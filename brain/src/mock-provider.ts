import {
  createAssistantMessageEventStream,
  createProvider,
  type AssistantMessage,
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
 * Its models stream deterministically (no HTTP), scripted by the last user
 * message:
 *   - "FAIL: <reason>"  -> stream error with errorMessage "mock failure: <reason>"
 *   - starts with "SLOW" -> many small deltas with sleeps, for abort tests
 *   - "TOOL: <name> <json args>" -> one tool call, then (once the result comes
 *                           back) "tool <name> said: <result text>" — the
 *                           scripted way to drive a real tool round trip
 *                           through the agent loop and the protocol
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

/** The `TOOL: <name> <json>` script, parsed. */
function scriptedToolCall(text: string): ToolCall | null {
  const match = /^TOOL:\s*(\S+)\s*(\{[\s\S]*\})?\s*$/.exec(text);
  if (!match) return null;
  return {
    type: "toolCall",
    id: `mock-call-${Date.now()}`,
    name: match[1] as string,
    arguments: match[2] === undefined ? {} : (JSON.parse(match[2]) as Record<string, unknown>),
  };
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

      // A tool result just came back: report it and end the turn, so a scripted
      // tool call is exactly two turns and never loops.
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

      const toolCall = scriptedToolCall(text);
      if (toolCall !== null) {
        const calling: AssistantMessage = { ...base, content: [toolCall] };
        stream.push({ type: "start", partial: partial("") });
        stream.push({ type: "toolcall_start", contentIndex: 0, partial: calling });
        stream.push({ type: "toolcall_end", contentIndex: 0, toolCall, partial: calling });
        stream.push({
          type: "done",
          reason: "toolUse",
          message: { ...calling, stopReason: "toolUse" },
        });
        return;
      }

      if (text.startsWith("FAIL:")) {
        stream.push({
          type: "error",
          reason: "error",
          error: {
            ...partial(""),
            stopReason: "error",
            errorMessage: `mock failure:${text.slice("FAIL:".length)}`,
          },
        });
        return;
      }

      const slow = text.startsWith("SLOW");
      const deltas = slow
        ? Array.from({ length: MOCK_SLOW_DELTAS }, (_, i) => `chunk${i} `)
        : ["echo:", ` ${text}`, ` [history=${context.messages.length}]`];

      stream.push({ type: "start", partial: partial("") });
      stream.push({ type: "text_start", contentIndex: 0, partial: partial("") });
      let accumulated = "";
      for (const delta of deltas) {
        if (slow) await sleep(25);
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
    })();
    return stream;
  };
  return { stream: run, streamSimple: run };
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
      const code = await interaction.prompt({
        type: "manual_code",
        message: "Enter the mock code",
        placeholder: "000000",
      });
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
