// Protocol-level chat tests: the brain runs a pi-agent-core Agent against the
// deterministic mock streaming provider (MINNE_MOCK_PROVIDER=1). No network,
// no live LLM calls — the mock scripts deltas, failures, and abort behavior.
import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MOCK_LOGIN_CODE, MOCK_SLOW_DELTAS } from "./mock-provider";
import type { BrainEvent } from "./protocol";
import { BrainSession, hello } from "./test-support";

let dirs: string[] = [];
let sessions: BrainSession[] = [];
/** Memory root of the session made last — where its tools write. */
let memoryRoot = "";

function makeSession(): BrainSession {
  const dir = mkdtempSync(join(tmpdir(), "minne-chat-"));
  dirs.push(dir);
  memoryRoot = join(dir, "memory");
  // Strip real API keys so nothing can leak into auth checks, and keep the
  // memory tools inside the scratch dir rather than the user's own ~/Minne.
  const session = new BrainSession(dir, {
    ANTHROPIC_API_KEY: undefined,
    OPENAI_API_KEY: undefined,
    MINNE_MEMORY_ROOT: memoryRoot,
  });
  sessions.push(session);
  return session;
}

/** Runs the scripted mock OAuth login and selects the mock provider. */
async function signIn(session: BrainSession): Promise<void> {
  session.send({ type: "login", id: "l1", provider: "mock" });
  let prompt: BrainEvent;
  do {
    prompt = await session.next();
  } while (prompt.type !== "auth_prompt");
  session.send({
    type: "auth_reply",
    id: "r1",
    targetId: "l1",
    promptId: prompt.promptId,
    value: MOCK_LOGIN_CODE,
  });
  const events = await session.collectUntilTerminal("l1");
  expect(events.at(-1)).toMatchObject({ type: "done", id: "l1" });
  const configured = await session.request({ type: "configure", id: "cfg", provider: "mock" });
  expect(configured.at(-1)).toMatchObject({
    type: "done",
    id: "cfg",
    result: { provider: "mock", model: "mock-model" },
  });
}

function deltasOf(events: BrainEvent[], id: string): string[] {
  return events
    .filter((e): e is Extract<BrainEvent, { type: "text_delta" }> => e.type === "text_delta")
    .filter((e) => e.id === id)
    .map((e) => e.delta);
}

afterEach(async () => {
  for (const session of sessions) await session.close().catch(() => 0);
  sessions = [];
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
  dirs = [];
});

describe("chat over the protocol", () => {
  test("streams text deltas then done with model and usage metadata", async () => {
    const session = makeSession();
    await hello(session);
    await signIn(session);

    const events = await session.request({ type: "chat", id: "c1", message: "hello" });
    const deltas = deltasOf(events, "c1");
    expect(deltas.length).toBeGreaterThan(1);
    expect(deltas.join("")).toBe("echo: hello [history=1]");
    expect(events.at(-1)).toMatchObject({
      type: "done",
      id: "c1",
      result: { model: "mock-model", stopReason: "stop" },
    });
    const done = events.at(-1);
    if (done?.type !== "done") throw new Error("unreachable");
    const usage = (done.result as { usage: { input: number; output: number; totalTokens: number } })
      .usage;
    expect(usage.input).toBe(1);
    expect(usage.totalTokens).toBe(usage.input + usage.output);
  }, 15000);

  test("done carries the whole answer, so a client can reconcile its deltas", async () => {
    const session = makeSession();
    await hello(session);
    await signIn(session);

    // A UI settles the request the moment `done` lands, without waiting for the
    // event stream to drain — so `text` has to be the complete answer, deltas
    // or no deltas. Across a tool round trip that means every assistant turn's
    // prose, not just the last message's.
    const events = await session.request({
      type: "chat",
      id: "c1",
      message: "TOOL: list_index {}",
    });
    const done = events.at(-1);
    if (done?.type !== "done") throw new Error("chat did not finish");
    const { text } = done.result as { text: string };
    expect(text).toBe(deltasOf(events, "c1").join(""));
    expect(text).toContain("tool list_index said:");
  }, 15000);

  test("session persists across chats and new_chat resets it", async () => {
    const session = makeSession();
    await hello(session);
    await signIn(session);

    // history counts messages sent to the model: [user] = 1, then
    // [user, assistant, user] = 3, then a fresh session is back to 1.
    const first = await session.request({ type: "chat", id: "c1", message: "one" });
    expect(deltasOf(first, "c1").join("")).toBe("echo: one [history=1]");
    const second = await session.request({ type: "chat", id: "c2", message: "two" });
    expect(deltasOf(second, "c2").join("")).toBe("echo: two [history=3]");
    const fresh = await session.request({ type: "chat", id: "c3", message: "three", newChat: true });
    expect(deltasOf(fresh, "c3").join("")).toBe("echo: three [history=1]");
  }, 15000);

  test("abort mid-stream stops generation and terminates with done {aborted}", async () => {
    const session = makeSession();
    await hello(session);
    await signIn(session);

    session.send({ type: "chat", id: "c1", message: "SLOW please" });
    // Wait until streaming has visibly started, then abort.
    let event = await session.next();
    while (event.type !== "text_delta") event = await session.next();
    session.send({ type: "abort", id: "a1", targetId: "c1" });
    const events = [event, ...(await session.collectUntilTerminal("c1"))];

    expect(events).toContainEqual({ type: "done", id: "a1", result: { aborted: true } });
    const terminal = events.at(-1);
    expect(terminal).toMatchObject({
      type: "done",
      id: "c1",
      result: { aborted: true, stopReason: "aborted" },
    });
    expect(deltasOf(events, "c1").length).toBeLessThan(MOCK_SLOW_DELTAS);

    // The session is idle again after an abort.
    const after = await session.request({ type: "chat", id: "c2", message: "still there?" });
    expect(after.at(-1)).toMatchObject({ type: "done", id: "c2" });
  }, 15000);

  test("concurrent chat while one is streaming gets a busy error", async () => {
    const session = makeSession();
    await hello(session);
    await signIn(session);

    session.send({ type: "chat", id: "c1", message: "SLOW again" });
    let event = await session.next();
    while (event.type !== "text_delta") event = await session.next();
    session.send({ type: "chat", id: "c2", message: "me too" });
    const rejected = await session.collectUntilTerminal("c2");
    expect(rejected.at(-1)).toMatchObject({ type: "error", id: "c2", code: "busy" });

    session.send({ type: "abort", id: "a1", targetId: "c1" });
    const events = await session.collectUntilTerminal("c1");
    expect(events.at(-1)).toMatchObject({ type: "done", id: "c1" });
  }, 15000);

  test("chat without credentials is a typed not_authenticated error", async () => {
    const session = makeSession();
    await hello(session);
    // Select the mock provider but never log in.
    await session.request({ type: "configure", id: "cfg", provider: "mock" });
    const events = await session.request({ type: "chat", id: "c1", message: "hi" });
    expect(events).toHaveLength(1);
    expect(events.at(-1)).toMatchObject({ type: "error", id: "c1", code: "not_authenticated" });
  }, 15000);

  test("a chat turn can write memory and read it back through its tools", async () => {
    const session = makeSession();
    await hello(session);
    await signIn(session);

    // The mock model's `TOOL:` script stands in for a model choosing a tool:
    // the call goes through the real agent loop, the real tool, and the real
    // memory on disk.
    const wrote = await session.request({
      type: "chat",
      id: "c1",
      message:
        'TOOL: write_page {"type":"project","title":"Oslo Trip",' +
        '"summary":"Moving the team in September.","body":"# Oslo Trip\\n\\nFlights are booked."}',
    });
    expect(wrote).toContainEqual({
      type: "tool_call",
      id: "c1",
      name: "write_page",
      args: expect.objectContaining({ title: "Oslo Trip" }),
    });
    expect(deltasOf(wrote, "c1").join("")).toContain("Created wiki/oslo-trip.md");
    expect(wrote.at(-1)).toMatchObject({ type: "done", id: "c1", result: { stopReason: "stop" } });

    const page = readFileSync(join(memoryRoot, "wiki", "oslo-trip.md"), "utf8");
    expect(page).toContain("title: Oslo Trip");
    expect(page).toContain("Flights are booked.");
    expect(readFileSync(join(memoryRoot, "index.md"), "utf8")).toContain("- [[Oslo Trip]] —");

    const found = await session.request({
      type: "chat",
      id: "c2",
      message: 'TOOL: search_memory {"query":"flights"}',
    });
    expect(deltasOf(found, "c2").join("")).toContain("[wiki] wiki/oslo-trip.md — Oslo Trip");
  }, 15000);

  test("provider failures surface as provider_error and roll back the exchange", async () => {
    const session = makeSession();
    await hello(session);
    await signIn(session);

    const failed = await session.request({ type: "chat", id: "c1", message: "FAIL: rate limited" });
    const terminal = failed.at(-1);
    expect(terminal).toMatchObject({ type: "error", id: "c1", code: "provider_error" });
    if (terminal?.type !== "error") throw new Error("unreachable");
    expect(terminal.message).toContain("rate limited");

    // The brain survived, and the failed exchange left no trace in the session.
    const retry = await session.request({ type: "chat", id: "c2", message: "again" });
    expect(deltasOf(retry, "c2").join("")).toBe("echo: again [history=1]");
    expect(await session.close()).toBe(0);
  }, 15000);
});
