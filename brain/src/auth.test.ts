// Protocol-level auth tests: run the brain as a subprocess with the mock OAuth
// provider (MINNE_MOCK_PROVIDER=1) and an isolated data dir. No network, no
// real OAuth — the mock scripts the same notify/prompt shapes pi's real flows use.
import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MOCK_AUTH_URL, MOCK_LOGIN_CODE } from "./mock-provider";
import { BrainSession, hello } from "./test-support";

let dirs: string[] = [];
let sessions: BrainSession[] = [];

function makeSession(
  dataDir?: string,
  env?: Record<string, string | undefined>,
): { session: BrainSession; dataDir: string } {
  const dir = dataDir ?? mkdtempSync(join(tmpdir(), "minne-auth-"));
  if (!dirs.includes(dir)) dirs.push(dir);
  const session = new BrainSession(dir, env);
  sessions.push(session);
  return { session, dataDir: dir };
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

  // pi's Anthropic flow races the manual-code prompt against a localhost
  // callback; when the callback wins, the prompt is cancelled through its
  // signal and the login finishes without an answer. A client showing that
  // prompt has to survive it being pulled away.
  test("a prompt the flow abandons still completes the login, and a late reply is rejected", async () => {
    const { session } = makeSession(undefined, {
      MINNE_MOCK_AUTO_CODE: MOCK_LOGIN_CODE,
      MINNE_MOCK_AUTO_CODE_MS: "50",
    });
    await hello(session);
    const promptId = await loginToPrompt(session);
    const events = await session.collectUntilTerminal("l1");
    expect(events.at(-1)).toMatchObject({
      type: "done",
      id: "l1",
      result: { provider: "mock", authenticated: true },
    });
    // The UI may only learn the prompt was stale by answering it.
    const late = await session.request({
      type: "auth_reply",
      id: "r1",
      targetId: "l1",
      promptId,
      value: MOCK_LOGIN_CODE,
    });
    expect(late.at(-1)).toMatchObject({ type: "error", id: "r1", code: "invalid_request" });
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

describe("status as the provider picker sees it", () => {
  test("each provider reports its login methods, default model and model catalog", async () => {
    const { session } = makeSession();
    await hello(session);
    const events = await session.request({ type: "status", id: "s1" });
    const status = events.at(-1);
    if (status?.type !== "done") throw new Error("status did not complete");
    const result = status.result as {
      providers: {
        id: string;
        label: string;
        methods: string[];
        defaultModel: string | null;
        baseUrl?: string;
        models: { id: string; name: string }[];
      }[];
    };
    const byId = new Map(result.providers.map((p) => [p.id, p]));

    // The onboarding cards (Claude, ChatGPT, Local, API key) map onto exactly
    // these registered provider ids — a rename here breaks the UI silently.
    const anthropic = byId.get("anthropic");
    expect(anthropic).toBeDefined();
    expect(anthropic?.methods).toEqual(["oauth", "api_key"]);
    expect(byId.get("openai-codex")?.methods).toEqual(["oauth"]);
    expect(byId.get("openai")?.methods).toEqual(["api_key"]);

    // A picker can be populated without signing in: the catalog is static.
    expect(anthropic?.models.length).toBeGreaterThan(1);
    expect(anthropic?.models.map((m) => m.id)).toContain(anthropic?.defaultModel ?? "");
    expect(anthropic?.models.find((m) => m.id === "claude-sonnet-5")?.name).toBe("Claude Sonnet 5");

    // The local server needs no login, and its base URL is part of its state.
    const ollama = byId.get("ollama");
    expect(ollama?.methods).toEqual([]);
    expect(ollama?.baseUrl).toBe("http://localhost:11434/v1");
    expect(ollama?.models.map((m) => m.id)).toEqual(["llama3.1"]);
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
