// Round-trip integration test: run the brain as a real subprocess, speak the
// protocol over its stdio, and assert stdout stays protocol-clean.
import { describe, expect, test } from "bun:test";
import { PROTOCOL_VERSION, type BrainEvent } from "./protocol";

const BRAIN_DIR = new URL("..", import.meta.url).pathname;

async function runBrain(
  lines: unknown[],
): Promise<{ events: BrainEvent[]; stderr: string; exitCode: number }> {
  const proc = Bun.spawn(["bun", "run", "src/main.ts"], {
    cwd: BRAIN_DIR,
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
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
      // ingest is still a stub; chat is live as of US-004 and would need auth.
      { type: "ingest", id: "c1" },
      { type: "status", id: "s1" },
    ]);
    expect(exitCode).toBe(0);
    expect(events).toHaveLength(4);
    expect(events[0]).toMatchObject({ type: "error", id: "", code: "invalid_json" });
    expect(events[1]).toMatchObject({ type: "error", id: "u1", code: "invalid_request" });
    expect(events[2]).toMatchObject({ type: "error", id: "c1", code: "unimplemented" });
    expect(events[3]).toMatchObject({ type: "done", id: "s1" });
  });

  test("responds while stdin is still open (no EOF buffering)", async () => {
    // Regression: Bun 1.2.x stdin async iterators buffer piped stdin until
    // EOF, deadlocking request/response. The brain must answer promptly.
    const proc = Bun.spawn(["bun", "run", "src/main.ts"], {
      cwd: BRAIN_DIR,
      stdin: "pipe",
      stdout: "pipe",
      stderr: "ignore",
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

  test("logs go to stderr, never stdout", async () => {
    const { stderr } = await runBrain([{ type: "status", id: "s1" }]);
    expect(stderr).toContain("[minne-brain]");
  });
});
