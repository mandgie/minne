import { chmod, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type {
  AuthOperationOptions,
  Credential,
  CredentialInfo,
  CredentialStore,
} from "@earendil-works/pi-ai";

type CredentialFile = Record<string, Credential>;

/**
 * pi CredentialStore backed by a single JSON file (auth.json), one credential
 * per provider id. The file and its directory are created on first write with
 * 0600/0700 permissions; writes are atomic (temp file + rename) and serialized
 * through a promise chain so OAuth refresh inside `modify` cannot interleave.
 */
export class FileCredentialStore implements CredentialStore {
  private chain: Promise<unknown> = Promise.resolve();

  constructor(readonly path: string) {}

  read(providerId: string, _options?: AuthOperationOptions): Promise<Credential | undefined> {
    return this.enqueue(async () => (await this.load())[providerId]);
  }

  list(_options?: AuthOperationOptions): Promise<readonly CredentialInfo[]> {
    return this.enqueue(async () =>
      Object.entries(await this.load()).map(([providerId, credential]) => ({
        providerId,
        type: credential.type,
      })),
    );
  }

  modify(
    providerId: string,
    fn: (current: Credential | undefined) => Promise<Credential | undefined>,
    _options?: AuthOperationOptions,
  ): Promise<Credential | undefined> {
    return this.enqueue(async () => {
      const data = await this.load();
      const current = data[providerId];
      const next = await fn(current);
      if (next === undefined) return current;
      data[providerId] = next;
      await this.save(data);
      return next;
    });
  }

  delete(providerId: string, _options?: AuthOperationOptions): Promise<void> {
    return this.enqueue(async () => {
      const data = await this.load();
      if (!(providerId in data)) return;
      delete data[providerId];
      await this.save(data);
    });
  }

  /** Serialize all operations; a failed task must not poison the chain. */
  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const next = this.chain.then(task, task);
    this.chain = next.catch(() => undefined);
    return next;
  }

  private async load(): Promise<CredentialFile> {
    let raw: string;
    try {
      raw = await readFile(this.path, "utf8");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return {};
      throw err;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return parsed as CredentialFile;
      }
    } catch {
      // fall through: corrupt file is treated as empty and rewritten on next save
    }
    console.error(`[minne-brain] ignoring corrupt credential file at ${this.path}`);
    return {};
  }

  private async save(data: CredentialFile): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true, mode: 0o700 });
    const tmp = `${this.path}.tmp`;
    await writeFile(tmp, JSON.stringify(data, null, 2) + "\n", { mode: 0o600 });
    await chmod(tmp, 0o600); // mode above is masked by umask; force it
    await rename(tmp, this.path);
  }
}
