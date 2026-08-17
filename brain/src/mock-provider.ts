import {
  createAssistantMessageEventStream,
  createProvider,
  type AssistantMessage,
  type AuthInteraction,
  type AssistantMessageEventStream,
  type Context,
  type Model,
  type OAuthAuth,
  type Provider,
  type ProviderStreams,
  type StreamOptions,
  type ToolCall,
  type Usage,
} from "@earendil-works/pi-ai";

/**
 * Scripted OAuth provider for protocol tests: notify(auth_url) -> prompt for a
 * manual code -> notify(progress) -> credential. Registered only when
 * MINNE_MOCK_PROVIDER=1 (see providers.ts); never used against the network.
 *
 * MINNE_MOCK_AUTO_CODE replaces the typed code with pi's other path: the
 * prompt goes up, a callback beats it, and the flow abandons the prompt
 * through its signal. That drives a login to completion with no input at all,
 * and puts a client through the stale-prompt case on the way.
 *
 * Its models stream deterministically (no HTTP), scripted by the last user
 * message:
 *   - a line "FAIL: <reason>" -> stream error, errorMessage "mock failure: <reason>"
 *   - starts with "SLOW" -> many small deltas with sleeps (25 ms, or
 *                           MINNE_MOCK_SLOW_DELTA_MS) — for abort tests, and
 *                           for screenshotting a UI mid-stream
 *   - a line "TOOL: <name> <json args>" -> one tool call per such line, in
 *                           order, one per turn, then (once the last result
 *                           comes back) "tool <name> said: <result text>" — the
 *                           scripted way to drive a real tool round trip
 *                           through the agent loop and the protocol. The lines
 *                           may sit anywhere in the message, which is how the
 *                           ingestion pass is scripted: the directives ride
 *                           along in a seeded snapshot's captured text. The
 *                           same lines in MINNE_MOCK_SCRIPT apply to every
 *                           message, for prompts a test does not compose.
 *   - MINNE_MOCK_REPLY    -> once any script is spent, exactly that text,
 *                           streamed word by word. The way to drive a UI to a
 *                           known answer (markdown, say) from outside.
 *   - anything else      -> "echo: <text> [history=<n>]" split into deltas,
 *                           where <n> is the message count sent to the model
 *                           (verifies session persistence / new_chat resets)
 */
export const MOCK_LOGIN_CODE = "424242";
export const MOCK_AUTH_URL = "https://example.invalid/authorize";
export const MOCK_SLOW_DELTAS = 40;

function emptyUsage(): Usage {
  return {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 0,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
  };
}

function lastUserText(context: Context): string {
  for (let i = context.messages.length - 1; i >= 0; i--) {
    const message = context.messages[i];
    if (message?.role !== "user") continue;
    if (typeof message.content === "string") return message.content;
    return message.content
      .map((part) => (part.type === "text" ? part.text : ""))
      .join("");
  }
  return "";
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Pause between "SLOW" deltas; stretched when a UI is being screenshotted. */
function slowDeltaMs(): number {
  const override = Number(process.env["MINNE_MOCK_SLOW_DELTA_MS"]);
  return Number.isFinite(override) && override > 0 ? override : 25;
}

/** Every `TOOL: <name> <json>` line in the message, in order. */
function scriptedToolCalls(text: string): ToolCall[] {
  const calls: ToolCall[] = [];
  for (const line of text.split("\n")) {
    const match = /^\s*TOOL:\s*(\S+)\s*(\{.*\})?\s*$/.exec(line);
    if (!match) continue;
    calls.push({
      type: "toolCall",
      id: `mock-call-${calls.length}-${Date.now()}`,
      name: match[1] as string,
      arguments: match[2] === undefined ? {} : (JSON.parse(match[2]) as Record<string, unknown>),
    });
  }
  return calls;
}

/**
 * Tool results since the last user message — i.e. how far through the script
 * this run has got, since the mock emits exactly one call per turn.
 */
function scriptProgress(context: Context): number {
  let count = 0;
  for (let i = context.messages.length - 1; i >= 0; i--) {
    const message = context.messages[i];
    if (message?.role === "user") break;
    if (message?.role === "toolResult") count++;
  }
  return count;
}

/**
 * Model requests the mock has served, process-wide. A test that wants to prove
 * a pass called no model asserts this did not move — the only evidence that is
 * about the model rather than about what happened to reach disk.
 */
let streamCalls = 0;

export function mockStreamCalls(): number {
  return streamCalls;
}

export function resetMockStreamCalls(): void {
  streamCalls = 0;
}

/** What the last tool result said, so the mock can echo it back as prose. */
function lastToolResult(context: Context): { name: string; text: string } | null {
  const last = context.messages.at(-1);
  if (last === undefined || last.role !== "toolResult") return null;
  return {
    name: last.toolName,
    text: last.content
      .map((part) => (part.type === "text" ? part.text : ""))
      .join("")
      .trim(),
  };
}

/** Deterministic in-process replacement for a real streaming API. */
function mockStreams(): ProviderStreams {
  const run = (
    model: Model<"openai-completions">,
    context: Context,
    options?: StreamOptions,
  ): AssistantMessageEventStream => {
    streamCalls++;
    const stream = createAssistantMessageEventStream();
    const signal = options?.signal;
    const base: AssistantMessage = {
      role: "assistant",
      content: [{ type: "text", text: "" }],
      api: model.api,
      provider: model.provider,
      model: model.id,
      usage: emptyUsage(),
      stopReason: "pending",
      timestamp: Date.now(),
    };
    const partial = (text: string): AssistantMessage => ({
      ...base,
      content: [{ type: "text", text }],
    });

    void (async () => {
      const text = lastUserText(context);

      // The script, one call per turn. Emitted before the tool-result branch
      // below so a multi-step script keeps going instead of stopping at its
      // first result. MINNE_MOCK_SCRIPT scripts a turn whose prompt the test
      // does not write — the ingestion and lint passes compose their own.
      const script = scriptedToolCalls(`${text}\n${process.env["MINNE_MOCK_SCRIPT"] ?? ""}`);
      const served = scriptProgress(context);
      const next = script[served];
      if (next !== undefined) {
        const calling: AssistantMessage = { ...base, content: [next] };
        stream.push({ type: "start", partial: partial("") });
        stream.push({ type: "toolcall_start", contentIndex: 0, partial: calling });
        stream.push({ type: "toolcall_end", contentIndex: 0, toolCall: next, partial: calling });
        stream.push({
          type: "done",
          reason: "toolUse",
          message: { ...calling, stopReason: "toolUse" },
        });
        return;
      }

      const slow = text.startsWith("SLOW");

      // One fixed answer for the whole run, once any script is spent. Exists so
      // a UI can be driven to a known reply — markdown included, which none of
      // the canned replies below can produce.
      const fixedReply = process.env["MINNE_MOCK_REPLY"];
      if (fixedReply !== undefined && fixedReply !== "") {
        stream.push({ type: "start", partial: partial("") });
        stream.push({ type: "text_start", contentIndex: 0, partial: partial("") });
        let written = "";
        for (const chunk of fixedReply.match(/\S+\s*/g) ?? []) {
          if (slow) await sleep(slowDeltaMs());
          written += chunk;
          stream.push({
            type: "text_delta",
            contentIndex: 0,
            delta: chunk,
            partial: partial(written),
          });
        }
        stream.push({
          type: "text_end",
          contentIndex: 0,
          content: written,
          partial: partial(written),
        });
        stream.push({
          type: "done",
          reason: "stop",
          message: { ...partial(written), stopReason: "stop" },
        });
        return;
      }

      // The script is spent and a tool result just came back: report it and end
      // the turn, so a scripted run always terminates.
      const toolResult = lastToolResult(context);
      if (toolResult !== null) {
        const reply = `tool ${toolResult.name} said: ${toolResult.text}`;
        stream.push({ type: "start", partial: partial("") });
        stream.push({ type: "text_start", contentIndex: 0, partial: partial("") });
        stream.push({ type: "text_delta", contentIndex: 0, delta: reply, partial: partial(reply) });
        stream.push({ type: "text_end", contentIndex: 0, content: reply, partial: partial(reply) });
        stream.push({
          type: "done",
          reason: "stop",
          message: { ...partial(reply), stopReason: "stop" },
        });
        return;
      }

      // A `FAIL:` line anywhere, so a seeded capture can script a provider
      // failure inside a prompt the test did not compose.
      const failure = /^FAIL:(.*)$/m.exec(text);
      if (failure !== null) {
        stream.push({
          type: "error",
          reason: "error",
          error: {
            ...partial(""),
            stopReason: "error",
            errorMessage: `mock failure:${failure[1]}`,
          },
        });
        return;
      }

      const deltas = slow
        ? Array.from({ length: MOCK_SLOW_DELTAS }, (_, i) => `chunk${i} `)
        : ["echo:", ` ${text}`, ` [history=${context.messages.length}]`];

      stream.push({ type: "start", partial: partial("") });
      stream.push({ type: "text_start", contentIndex: 0, partial: partial("") });
      let accumulated = "";
      for (const delta of deltas) {
        if (slow) await sleep(slowDeltaMs());
        if (signal?.aborted) {
          stream.push({
            type: "error",
            reason: "aborted",
            error: {
              ...partial(accumulated),
              stopReason: "aborted",
              errorMessage: "aborted",
            },
          });
          return;
        }
        accumulated += delta;
        stream.push({
          type: "text_delta",
          contentIndex: 0,
          delta,
          partial: partial(accumulated),
        });
      }
      stream.push({
        type: "text_end",
        contentIndex: 0,
        content: accumulated,
        partial: partial(accumulated),
      });
      const usage = emptyUsage();
      usage.input = context.messages.length;
      usage.output = accumulated.length;
      usage.totalTokens = usage.input + usage.output;
      stream.push({
        type: "done",
        reason: "stop",
        message: { ...partial(accumulated), stopReason: "stop", usage },
      });
    })().catch((err: unknown) => {
      // A malformed `TOOL:` line is the likely cause; surface it as a provider
      // error rather than an unhandled rejection in whatever test wrote it.
      stream.push({
        type: "error",
        reason: "error",
        error: {
          ...partial(""),
          stopReason: "error",
          errorMessage: `mock script error: ${err instanceof Error ? err.message : String(err)}`,
        },
      });
    });
    return stream;
  };
  return { stream: run, streamSimple: run };
}

/**
 * The manual-code prompt losing its race, the way pi's real Anthropic flow
 * works: the prompt goes up, the callback server delivers the code, and the
 * flow cancels the prompt through its `signal` and carries on. The prompt
 * stays up for MINNE_MOCK_AUTO_CODE_MS (default 4 s) so a UI showing it can be
 * observed before it is pulled away.
 */
async function codeFromCallback(interaction: AuthInteraction, code: string): Promise<string> {
  const abandon = new AbortController();
  // Nobody awaits this: the flow is walking away from the prompt on purpose,
  // and an unobserved rejection would be an unhandled one.
  interaction
    .prompt({
      type: "manual_code",
      message: "Enter the mock code",
      placeholder: "000000",
      signal: abandon.signal,
    })
    .catch(() => undefined);
  const delay = Number(process.env["MINNE_MOCK_AUTO_CODE_MS"]);
  await sleep(Number.isFinite(delay) && delay >= 0 ? delay : 4000);
  interaction.signal?.throwIfAborted();
  abandon.abort();
  return code;
}

export function mockProvider(): Provider<"openai-completions"> {
  const model: Model<"openai-completions"> = {
    id: "mock-model",
    name: "Mock model",
    api: "openai-completions",
    provider: "mock",
    baseUrl: "http://localhost:1/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 8192,
    maxTokens: 4096,
  };

  const oauth: OAuthAuth = {
    name: "Mock provider (tests only)",
    isSubscription: true,
    async login(interaction) {
      interaction.signal.throwIfAborted();
      interaction.notify({ type: "info", message: "mock login starting" });
      interaction.notify({ type: "auth_url", url: MOCK_AUTH_URL });
      const automatic = process.env["MINNE_MOCK_AUTO_CODE"];
      const code =
        automatic === undefined || automatic === ""
          ? await interaction.prompt({
              type: "manual_code",
              message: "Enter the mock code",
              placeholder: "000000",
            })
          : await codeFromCallback(interaction, automatic);
      interaction.signal.throwIfAborted();
      if (code !== MOCK_LOGIN_CODE) throw new Error("invalid code");
      interaction.notify({ type: "progress", message: "exchanging code" });
      return {
        type: "oauth",
        refresh: "mock-refresh",
        access: "mock-access",
        expires: Date.now() + 3_600_000,
      };
    },
    async refresh(credential) {
      return credential;
    },
    async toAuth(credential) {
      return { apiKey: credential.access };
    },
  };

  return createProvider({
    id: "mock",
    name: "Mock",
    baseUrl: "http://localhost:1/v1",
    auth: { oauth },
    models: [model],
    api: mockStreams(),
  });
}
