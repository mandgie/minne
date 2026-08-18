// Shared harness for protocol-level subprocess tests: spawn the brain with the
// mock provider (MINNE_MOCK_PROVIDER=1) and an isolated data dir, then speak
// JSON-lines over its stdio. Not a test file itself — imported by *.test.ts.
import { expect } from "bun:test";
import { Database } from "bun:sqlite";
import { join } from "node:path";
import { PROTOCOL_VERSION, type BrainEvent } from "./protocol";
import { databasePath } from "./sources";

const BRAIN_DIR = new URL("..", import.meta.url).pathname;

function spawnBrain(dataDir: string, env?: Record<string, string | undefined>) {
  return Bun.spawn(["bun", "run", "src/main.ts"], {
    cwd: BRAIN_DIR,
    stdin: "pipe" as const,
    stdout: "pipe" as const,
    stderr: "ignore" as const,
    env: {
      ...process.env,
      MINNE_APP_SUPPORT_DIR: dataDir,
      // Never the real ~/Minne: the memory tools write, and a test that forgot
      // this would edit the user's own wiki. Defaults inside the data dir the
      // caller already owns, overridable for tests that seed a memory.
      MINNE_MEMORY_ROOT: join(dataDir, "memory"),
      MINNE_MOCK_PROVIDER: "1",
      // No scheduled passes in a subprocess test: a tick would spend a turn on
      // whatever the test seeded, at a moment no assertion is expecting.
      MINNE_SYNC_INTERVAL_MS: "0",
      MINNE_LINT_INTERVAL_MS: "0",
      ...env,
    },
  });
}

/** Interactive JSON-lines session against a live brain subprocess. */
export class BrainSession {
  private proc: ReturnType<typeof spawnBrain>;
  // Structural type: Bun's own reader typings require a read() argument.
  private reader: { read(): Promise<{ done: boolean; value?: Uint8Array }>; releaseLock(): void };
  private buffer = "";
  private queue: BrainEvent[] = [];

  constructor(dataDir: string, env?: Record<string, string | undefined>) {
    this.proc = spawnBrain(dataDir, env);
    this.reader = this.proc.stdout.getReader() as unknown as typeof this.reader;
  }

  send(message: Record<string, unknown>): void {
    this.proc.stdin.write(JSON.stringify(message) + "\n");
    void this.proc.stdin.flush();
  }

  /** Next event, in stdout order. */
  async next(): Promise<BrainEvent> {
    while (this.queue.length === 0) {
      const { done, value } = await this.reader.read();
      if (done) throw new Error("brain stdout closed while awaiting an event");
      this.buffer += new TextDecoder().decode(value);
      let newline: number;
      while ((newline = this.buffer.indexOf("\n")) !== -1) {
        const line = this.buffer.slice(0, newline);
        this.buffer = this.buffer.slice(newline + 1);
        if (line !== "") this.queue.push(JSON.parse(line) as BrainEvent);
      }
    }
    return this.queue.shift()!;
  }

  /** Collects events until the terminal (done/error) for `id`; returns all seen. */
  async collectUntilTerminal(id: string): Promise<BrainEvent[]> {
    const events: BrainEvent[] = [];
    for (;;) {
      const event = await this.next();
      events.push(event);
      if (event.id === id && (event.type === "done" || event.type === "error")) return events;
    }
  }

  async request(message: Record<string, unknown>): Promise<BrainEvent[]> {
    this.send(message);
    return this.collectUntilTerminal(message["id"] as string);
  }

  async close(): Promise<number> {
    await this.proc.stdin.end();
    const code = await this.proc.exited;
    this.reader.releaseLock();
    return code;
  }
}

/**
 * Snapshot the app would have indexed. Only what search reads from — the raw
 * markdown lives under the memory root and is the app's business.
 */
export interface TestSnapshot {
  capturedAt: Date;
  app?: string;
  bundleId?: string;
  title?: string;
  url?: string | null;
  sourcePath: string;
  section: number;
  text: string;
}

/**
 * Stands up a minne.db the way the Swift app would.
 *
 * The DDL mirrors `SnapshotIndex.schemaSQL` in
 * app/Sources/Minne/SnapshotIndex.swift — the app owns the schema and this is a
 * copy for tests, so the two must be changed together. Production code in the
 * brain never creates a table; it opens the file read-only.
 */
export function seedSnapshotIndex(dataDir: string, snapshots: TestSnapshot[]): void {
  const db = new Database(databasePath(dataDir), { create: true });
  db.run("PRAGMA journal_mode = WAL");
  db.run(`CREATE TABLE IF NOT EXISTS snapshots (
      id INTEGER PRIMARY KEY,
      captured_at INTEGER NOT NULL,
      app TEXT NOT NULL,
      bundle_id TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT,
      source_path TEXT NOT NULL,
      section INTEGER NOT NULL,
      text TEXT NOT NULL,
      UNIQUE (source_path, section)
    )`);
  db.run(`CREATE VIRTUAL TABLE IF NOT EXISTS snapshots_fts USING fts5 (
      text, title, app, url,
      content = 'snapshots', content_rowid = 'id',
      tokenize = 'unicode61 remove_diacritics 2'
    )`);
  db.run(`CREATE TRIGGER IF NOT EXISTS snapshots_after_insert AFTER INSERT ON snapshots BEGIN
      INSERT INTO snapshots_fts (rowid, text, title, app, url)
      VALUES (new.id, new.text, new.title, new.app, new.url);
    END`);
  const insert = db.prepare(
    `INSERT INTO snapshots (captured_at, app, bundle_id, title, url, source_path, section, text)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const snapshot of snapshots) {
    const app = snapshot.app ?? "Safari";
    insert.run(
      Math.floor(snapshot.capturedAt.getTime() / 1000),
      app,
      snapshot.bundleId ?? `com.example.${app.toLowerCase()}`,
      snapshot.title ?? "Untitled",
      snapshot.url ?? null,
      snapshot.sourcePath,
      snapshot.section,
      snapshot.text,
    );
  }
  // Fold the WAL back into the database file before another process opens it
  // read-only. Without this the seeded rows live in `-wal` until sqlite decides
  // to checkpoint, and a brain subprocess that opens the file in that window
  // sees an empty index — which is the intermittent "no results" failure this
  // harness used to produce about once in ten runs.
  db.run("PRAGMA wal_checkpoint(TRUNCATE)");
  db.close();
}

export async function hello(session: BrainSession): Promise<void> {
  const events = await session.request({
    type: "hello",
    id: "h",
    protocolVersion: PROTOCOL_VERSION,
    client: "bun-test",
  });
  expect(events.at(-1)).toMatchObject({ type: "done", id: "h" });
}
