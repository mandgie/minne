// Round-trip integration test: run the brain as a real subprocess, speak the
// protocol over its stdio, and assert stdout stays protocol-clean.
import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PROTOCOL_VERSION, type BrainEvent } from "./protocol";
import { BrainSession, hello } from "./test-support";

const BRAIN_DIR = new URL("..", import.meta.url).pathname;

const dirs: string[] = [];
afterAll(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
});

/**
 * A scratch app-support dir and memory root per run. Without them these tests
 * would read the user's own Minne — and `ingest` would digest it with the
 * user's own credentials.
 */
function isolatedEnv(): Record<string, string | undefined> {
  const dir = mkdtempSync(join(tmpdir(), "minne-main-"));
  dirs.push(dir);
  return {
    ...process.env,
    MINNE_APP_SUPPORT_DIR: dir,
    MINNE_MEMORY_ROOT: join(dir, "memory"),
    ANTHROPIC_API_KEY: undefined,
    OPENAI_API_KEY: undefined,
  };
}

async function runBrain(
  lines: unknown[],
): Promise<{ events: BrainEvent[]; stderr: string; exitCode: number }> {
  const proc = Bun.spawn(["bun", "run", "src/main.ts"], {
    cwd: BRAIN_DIR,
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
    env: isolatedEnv(),
  });
  proc.stdin.write(
    lines.map((l) => (typeof l === "string" ? l : JSON.stringify(l)) + "\n").join(""),
  );
  await proc.stdin.end();
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  // Protocol cleanliness: every non-empty stdout line must be a JSON event.
  const events = stdout
    .split("\n")
    .filter((line) => line !== "")
    .map((line) => JSON.parse(line) as BrainEvent);
  return { events, stderr, exitCode };
}

describe("brain subprocess", () => {
  test("hello + status round trip, clean exit on stdin close", async () => {
    const { events, exitCode } = await runBrain([
      { type: "hello", id: "h1", protocolVersion: PROTOCOL_VERSION, client: "bun-test" },
      { type: "status", id: "s1" },
    ]);
    expect(exitCode).toBe(0);
    expect(events).toHaveLength(2);

    const hello = events[0]!;
    expect(hello.type).toBe("done");
    expect(hello.id).toBe("h1");
    if (hello.type === "done") {
      expect(hello.result).toMatchObject({ protocolVersion: PROTOCOL_VERSION, brain: "minne-brain" });
    }

    const status = events[1]!;
    expect(status.type).toBe("done");
    expect(status.id).toBe("s1");
    if (status.type === "done") {
      expect(status.result).toMatchObject({ state: "idle" });
    }
  });

  test("rejects a mismatched protocol version", async () => {
    const { events, exitCode } = await runBrain([
      { type: "hello", id: "h1", protocolVersion: PROTOCOL_VERSION + 999 },
    ]);
    expect(exitCode).toBe(0);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: "error", id: "h1", code: "unsupported_version" });
  });

  test("survives garbage and unknown requests, keeps serving", async () => {
    const { events, exitCode } = await runBrain([
      "this is not json",
      { type: "frobnicate", id: "u1" },
      { type: "chat", id: "c1", message: 0 },
      // Nothing captured in this scratch dir, so the pass is idle: no model is
      // reached and no credentials are needed.
      { type: "ingest", id: "i1" },
      { type: "status", id: "s1" },
    ]);
    expect(exitCode).toBe(0);
    expect(events).toHaveLength(5);
    expect(events[0]).toMatchObject({ type: "error", id: "", code: "invalid_json" });
    expect(events[1]).toMatchObject({ type: "error", id: "u1", code: "invalid_request" });
    expect(events[2]).toMatchObject({ type: "error", id: "c1", code: "invalid_request" });
    expect(events[3]).toMatchObject({
      type: "done",
      id: "i1",
      result: { pass: "sync", status: "idle", snapshots: 0 },
    });
    expect(events[4]).toMatchObject({ type: "done", id: "s1" });
  });

  test("sync_mark moves the watermark over the wire, and validates its input", async () => {
    const { events, exitCode } = await runBrain([
      { type: "hello", id: "h1", protocolVersion: PROTOCOL_VERSION, client: "bun-test" },
      { type: "sync_mark", id: "m1", watermark: 42 },
      { type: "sync_mark", id: "m2", watermark: -1 },
      { type: "sync_mark", id: "m3" },
      { type: "status", id: "s1" },
    ]);
    expect(exitCode).toBe(0);
    expect(events[1]).toMatchObject({ type: "done", id: "m1", result: { watermark: 42 } });
    expect(events[2]).toMatchObject({ type: "error", id: "m2", code: "invalid_request" });
    expect(events[3]).toMatchObject({ type: "error", id: "m3", code: "invalid_request" });
    const status = events[4]!;
    expect(status.type).toBe("done");
    if (status.type === "done") {
      expect(status.result).toMatchObject({ sync: { watermark: 42 } });
    }
  });

  test("responds while stdin is still open (no EOF buffering)", async () => {
    // Regression: Bun 1.2.x stdin async iterators buffer piped stdin until
    // EOF, deadlocking request/response. The brain must answer promptly.
    const proc = Bun.spawn(["bun", "run", "src/main.ts"], {
      cwd: BRAIN_DIR,
      stdin: "pipe",
      stdout: "pipe",
      stderr: "ignore",
      env: isolatedEnv(),
    });
    try {
      proc.stdin.write(
        JSON.stringify({ type: "hello", id: "h1", protocolVersion: PROTOCOL_VERSION }) + "\n",
      );
      await proc.stdin.flush();
      const reader = proc.stdout.getReader();
      const first = await reader.read();
      expect(first.done).toBe(false);
      const event = JSON.parse(new TextDecoder().decode(first.value).split("\n")[0]!) as BrainEvent;
      expect(event).toMatchObject({ type: "done", id: "h1" });
      reader.releaseLock();
    } finally {
      await proc.stdin.end();
      await proc.exited;
    }
  }, 5000);

  test("memory_recent lists wiki pages newest first over the protocol", async () => {
    const dir = mkdtempSync(join(tmpdir(), "minne-main-"));
    dirs.push(dir);
    // Seed a wiki under the memory root BrainSession points the brain at.
    const wiki = join(dir, "memory", "wiki");
    mkdirSync(wiki, { recursive: true });
    const page = (title: string, lastUpdated: string) =>
      `---\ntype: person\ntitle: ${title}\nsummary: Seeded.\nlast_updated: ${lastUpdated}\nsources: []\n---\n\nBody.\n`;
    writeFileSync(join(wiki, "older.md"), page("Older", "2026-08-10"));
    writeFileSync(join(wiki, "ingrid-berg.md"), page("Ingrid Berg", "2026-08-17"));

    const session = new BrainSession(dir);
    try {
      await hello(session);
      const events = await session.request({ type: "memory_recent", id: "m1" });
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: "done",
        id: "m1",
        result: {
          pages: [
            { path: "wiki/ingrid-berg.md", title: "Ingrid Berg", lastUpdated: "2026-08-17" },
            { path: "wiki/older.md", title: "Older", lastUpdated: "2026-08-10" },
          ],
        },
      });
    } finally {
      await session.close();
    }
  });

  test("memory_recent on an empty memory answers an empty list", async () => {
    const { events, exitCode } = await runBrain([{ type: "memory_recent", id: "m0" }]);
    expect(exitCode).toBe(0);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: "done", id: "m0", result: { pages: [] } });
  });

  test("logs go to stderr, never stdout", async () => {
    const { stderr } = await runBrain([{ type: "status", id: "s1" }]);
    expect(stderr).toContain("[minne-brain]");
  });
});
