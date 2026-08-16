// Protocol-level auth tests: run the brain as a subprocess with the mock OAuth
// provider (MINNE_MOCK_PROVIDER=1) and an isolated data dir. No network, no
// real OAuth — the mock scripts the same notify/prompt shapes pi's real flows use.
import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MOCK_AUTH_URL, MOCK_LOGIN_CODE } from "./mock-provider";
import { PROTOCOL_VERSION, type BrainEvent } from "./protocol";

const BRAIN_DIR = new URL("..", import.meta.url).pathname;

function spawnBrain(dataDir: string) {
  return Bun.spawn(["bun", "run", "src/main.ts"], {
    cwd: BRAIN_DIR,
    stdin: "pipe" as const,
    stdout: "pipe" as const,
    stderr: "ignore" as const,
    env: { ...process.env, MINNE_APP_SUPPORT_DIR: dataDir, MINNE_MOCK_PROVIDER: "1" },
  });
}

/** Interactive JSON-lines session against a live brain subprocess. */
class BrainSession {
  private proc: ReturnType<typeof spawnBrain>;
  // Structural type: Bun's own reader typings require a read() argument.
  private reader: { read(): Promise<{ done: boolean; value?: Uint8Array }>; releaseLock(): void };
  private buffer = "";
  private queue: BrainEvent[] = [];

  constructor(dataDir: string) {
    this.proc = spawnBrain(dataDir);
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

let dirs: string[] = [];
let sessions: BrainSession[] = [];

function makeSession(dataDir?: string): { session: BrainSession; dataDir: string } {
  const dir = dataDir ?? mkdtempSync(join(tmpdir(), "minne-auth-"));
  if (!dirs.includes(dir)) dirs.push(dir);
  const session = new BrainSession(dir);
  sessions.push(session);
  return { session, dataDir: dir };
}

async function hello(session: BrainSession): Promise<void> {
  const events = await session.request({
    type: "hello",
    id: "h",
    protocolVersion: PROTOCOL_VERSION,
    client: "auth-test",
  });
  expect(events.at(-1)).toMatchObject({ type: "done", id: "h" });
}

async function loginToPrompt(session: BrainSession): Promise<string> {
  session.send({ type: "login", id: "l1", provider: "mock" });
  // Scripted order: progress (info), auth_url, auth_prompt.
  const progress = await session.next();
  expect(progress).toMatchObject({ type: "progress", id: "l1", message: "mock login starting" });
  const authUrl = await session.next();
  expect(authUrl).toMatchObject({ type: "auth_url", id: "l1", url: MOCK_AUTH_URL });
  const prompt = await session.next();
  expect(prompt).toMatchObject({
    type: "auth_prompt",
    id: "l1",
    prompt: "Enter the mock code",
    promptType: "manual_code",
    placeholder: "000000",
  });
  if (prompt.type !== "auth_prompt") throw new Error("unreachable");
  return prompt.promptId;
}

afterEach(async () => {
  for (const session of sessions) await session.close().catch(() => 0);
  sessions = [];
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
  dirs = [];
});

describe("login over the protocol", () => {
  test("full OAuth flow: auth_url, auth_prompt round-trip, credential on disk (0600), logout", async () => {
    const { session, dataDir } = makeSession();
    await hello(session);

    const promptId = await loginToPrompt(session);
    session.send({ type: "auth_reply", id: "r1", targetId: "l1", promptId, value: MOCK_LOGIN_CODE });
    // The reply's ack and the login's progress/done interleave; gather to the login terminal.
    const events = await session.collectUntilTerminal("l1");
    expect(events).toContainEqual({ type: "done", id: "r1" });
    expect(events).toContainEqual({ type: "progress", id: "l1", message: "exchanging code" });
    expect(events.at(-1)).toMatchObject({
      type: "done",
      id: "l1",
      result: { provider: "mock", method: "oauth", authenticated: true },
    });

    // Credential file: exists, holds the mock oauth credential, 0600.
    const authPath = join(dataDir, "auth.json");
    expect(existsSync(authPath)).toBe(true);
    expect(statSync(authPath).mode & 0o777).toBe(0o600);
    const stored = (await Bun.file(authPath).json()) as Record<string, { type: string }>;
    expect(stored["mock"]).toMatchObject({ type: "oauth", access: "mock-access" });

    // Status reports the provider as authenticated.
    const statusEvents = await session.request({ type: "status", id: "s1" });
    const status = statusEvents.at(-1);
    expect(status).toMatchObject({ type: "done", id: "s1" });
    if (status?.type !== "done") throw new Error("unreachable");
    const result = status.result as {
      state: string;
      provider: string;
      model: string;
      providers: { id: string; authenticated: boolean; authType: string | null }[];
    };
    expect(result.state).toBe("idle");
    expect(result.provider).toBe("anthropic");
    expect(result.model).toBe("claude-sonnet-5");
    const mock = result.providers.find((p) => p.id === "mock");
    expect(mock).toMatchObject({ authenticated: true, authType: "oauth" });
    const ollama = result.providers.find((p) => p.id === "ollama");
    expect(ollama).toMatchObject({ authenticated: true }); // keyless local is always configured
    const codex = result.providers.find((p) => p.id === "openai-codex");
    expect(codex).toMatchObject({ authenticated: false, source: null });

    // Logout clears the stored credential.
    const logoutEvents = await session.request({ type: "logout", id: "o1", provider: "mock" });
    expect(logoutEvents.at(-1)).toMatchObject({ type: "done", id: "o1", result: { cleared: ["mock"] } });
    const after = (await Bun.file(authPath).json()) as Record<string, unknown>;
    expect(after["mock"]).toBeUndefined();
    expect(await session.close()).toBe(0);
  }, 15000);

  test("wrong code fails the login with auth_failed", async () => {
    const { session } = makeSession();
    await hello(session);
    const promptId = await loginToPrompt(session);
    session.send({ type: "auth_reply", id: "r1", targetId: "l1", promptId, value: "000000" });
    const events = await session.collectUntilTerminal("l1");
    expect(events.at(-1)).toMatchObject({ type: "error", id: "l1", code: "auth_failed" });
  }, 15000);

  test("cancelling the prompt aborts the login", async () => {
    const { session } = makeSession();
    await hello(session);
    const promptId = await loginToPrompt(session);
    session.send({ type: "auth_reply", id: "r1", targetId: "l1", promptId, cancel: true });
    const events = await session.collectUntilTerminal("l1");
    expect(events.at(-1)).toMatchObject({ type: "error", id: "l1", code: "aborted" });
  }, 15000);

  test("abort request cancels an in-flight login", async () => {
    const { session } = makeSession();
    await hello(session);
    await loginToPrompt(session);
    session.send({ type: "abort", id: "a1", targetId: "l1" });
    const events = await session.collectUntilTerminal("l1");
    expect(events).toContainEqual({ type: "done", id: "a1", result: { aborted: true } });
    expect(events.at(-1)).toMatchObject({ type: "error", id: "l1", code: "aborted" });
  }, 15000);

  test("stale auth_reply and unknown provider are typed errors", async () => {
    const { session } = makeSession();
    await hello(session);
    const stale = await session.request({
      type: "auth_reply",
      id: "r9",
      targetId: "l9",
      promptId: "l9:1",
      value: "x",
    });
    expect(stale.at(-1)).toMatchObject({ type: "error", id: "r9", code: "invalid_request" });
    const unknown = await session.request({ type: "login", id: "l9", provider: "nope" });
    expect(unknown.at(-1)).toMatchObject({ type: "error", id: "l9", code: "invalid_request" });
  }, 15000);
});

describe("configure over the protocol", () => {
  test("selection persists to config.json and survives a brain restart", async () => {
    const first = makeSession();
    await hello(first.session);
    const configured = await first.session.request({
      type: "configure",
      id: "c1",
      provider: "ollama",
      model: "qwen3",
      baseUrl: "http://localhost:9999/v1",
    });
    expect(configured.at(-1)).toMatchObject({
      type: "done",
      id: "c1",
      result: { provider: "ollama", model: "qwen3" },
    });
    const configPath = join(first.dataDir, "config.json");
    expect(await Bun.file(configPath).json()).toEqual({
      provider: "ollama",
      model: "qwen3",
      ollama: { baseUrl: "http://localhost:9999/v1", model: "qwen3" },
    });
    expect(await first.session.close()).toBe(0);

    const second = makeSession(first.dataDir);
    await hello(second.session);
    const statusEvents = await second.session.request({ type: "status", id: "s1" });
    const status = statusEvents.at(-1);
    if (status?.type !== "done") throw new Error("status did not complete");
    const result = status.result as {
      provider: string;
      model: string;
      providers: { id: string; baseUrl?: string; defaultModel: string }[];
    };
    expect(result.provider).toBe("ollama");
    expect(result.model).toBe("qwen3");
    expect(result.providers.find((p) => p.id === "ollama")).toMatchObject({
      baseUrl: "http://localhost:9999/v1",
      defaultModel: "qwen3",
    });
  }, 15000);

  test("invalid configure requests are rejected", async () => {
    const { session } = makeSession();
    await hello(session);
    const badProvider = await session.request({ type: "configure", id: "c1", provider: "nope" });
    expect(badProvider.at(-1)).toMatchObject({ type: "error", id: "c1", code: "invalid_request" });
    const badUrl = await session.request({ type: "configure", id: "c2", baseUrl: "not a url" });
    expect(badUrl.at(-1)).toMatchObject({ type: "error", id: "c2", code: "invalid_request" });
  }, 15000);
});
