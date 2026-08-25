import { join } from "node:path";
import { Agent, type AgentMessage } from "@earendil-works/pi-agent-core";
import type {
  Api,
  AuthEvent,
  AuthInteraction,
  AuthPrompt,
  Model,
} from "@earendil-works/pi-ai";
import { loadConfig, saveConfig, type MinneConfig } from "./config";
import { FileCredentialStore } from "./credentials";
import { SyncBusyError, SyncEngine, settingsFromEnv, type PassResult } from "./ingest";
import {
  PROTOCOL_VERSION,
  doneEvent,
  errorEvent,
  type AuthPromptEvent,
  type AuthReplyRequest,
  type BrainEvent,
  type BrainRequest,
  type ChatRequest,
  type ConfigureRequest,
  type DraftOutcomeRequest,
  type DraftRequest,
  type IngestRequest,
  type LoginRequest,
  type LogoutRequest,
  type SearchSourcesRequest,
} from "./protocol";
import { DraftFailedError, runDraft, type DraftContext } from "./draft";
import { EmptyQueryError, searchSources } from "./sources";
import { Memory } from "./memory";
import { memoryTools } from "./memory-tools";
import { buildRegistry, ollamaProviderFrom, type Registry } from "./providers";

/**
 * Everything the assistant said across the messages one turn produced: its
 * text parts, in order, which is exactly the concatenation of the `text_delta`
 * events that went out. Thinking and tool calls are not part of it.
 *
 * A turn can span several assistant messages (one per tool round trip), so
 * this is not `messages.at(-1)` — prose written before a tool call belongs to
 * the answer too.
 *
 * This rule is chat's alone. A draft (draft.ts) deliberately takes the final
 * message only: its text is inserted verbatim into the user's field, where
 * pre-tool commentary must never land.
 */
function assistantText(messages: readonly AgentMessage[]): string {
  let text = "";
  for (const message of messages) {
    if (message.role !== "assistant") continue;
    for (const part of message.content) {
      if (part.type === "text") text += part.text;
    }
  }
  return text;
}

/** The model for a turn, or why there is none and which error code says so. */
type ResolvedModel =
  | { model: Model<Api> }
  | { unavailable: string; code: "not_authenticated" | "invalid_request" };

interface PromptWaiter {
  loginId: string;
  resolve(value: string): void;
  reject(err: Error): void;
}

/**
 * System prompt for the chat agent. It describes the memory the tools in
 * memory-tools.ts open onto; SCHEMA.md in the user's own memory holds the full
 * rules and the agent can read it whenever it needs them.
 */
const MINNE_SYSTEM_PROMPT = `You are Minne, a local memory companion that lives in the macOS menu bar.

You hold the user's memory: a plain markdown wiki in ~/Minne, in three layers.
"sources/" is the raw, immutable capture of what has been on their screen, one
file per app per hour. "index.md", "log.md" and "wiki/" are yours: distilled,
interlinked pages that cite the captures they came from. "SCHEMA.md" is the
contract you work to — read it when you are unsure how something is organised.

Answer questions about the user's past activity from your tools, never from
guesswork: search memory first, and say plainly when you find nothing. Name the
capture a claim came from when the user asks where something came from.

When the conversation establishes something durable about a person, a project
or a topic, record it with write_page and note what you did with append_log
(pass "chat"). Passing chatter is not memory; do not write a page for it.

Be concise and direct.`;

export interface MinneBrainDeps {
  send: (event: BrainEvent) => void;
  log: (...args: unknown[]) => void;
  /** ~/Library/Application Support/Minne (or a test override) */
  dataDir: string;
  /** ~/Minne (or a test override) — the user's markdown memory */
  memoryRoot: string;
  brainVersion: string;
}

/**
 * Request handlers behind the protocol. Handlers are async and may overlap;
 * each emits exactly one terminal event for its request id. Login flows park
 * on `auth_prompt` events and are resumed by `auth_reply` requests, so the
 * caller must dispatch requests without awaiting earlier handlers.
 */
export class MinneBrain {
  private readonly send: (event: BrainEvent) => void;
  private readonly log: (...args: unknown[]) => void;
  private readonly brainVersion: string;
  private readonly dataDir: string;
  private readonly configPath: string;
  private readonly store: FileCredentialStore;
  private readonly memory: Memory;
  private readonly sync: SyncEngine;
  private config: MinneConfig;
  private registry: Registry;

  /** pending auth prompts by promptId */
  private prompts = new Map<string, PromptWaiter>();
  /** in-flight abortable requests (logins, chats) by request id */
  private aborters = new Map<string, AbortController>();

  /** one chat session, kept in memory across `chat` requests */
  private chatAgent: Agent | null = null;
  /** id of the chat request currently streaming, if any */
  private activeChatId: string | null = null;
  /** id of the draft currently being written, if any */
  private activeDraftId: string | null = null;
  /**
   * The style context of recent drafts, so a `draft_outcome` can be attributed
   * to the page the draft read (US-205). In-memory only and capped small: an
   * outcome for a brain restarted mid-press finds nothing here and is silently
   * dropped — an accepted loss, the ledger learns from the next press.
   */
  private recentDraftContexts = new Map<
    string,
    { app: string; url?: string; recipient?: string }
  >();
  private static readonly MAX_RECENT_DRAFTS = 16;

  constructor(deps: MinneBrainDeps) {
    this.send = deps.send;
    this.log = deps.log;
    this.brainVersion = deps.brainVersion;
    this.dataDir = deps.dataDir;
    this.configPath = join(deps.dataDir, "config.json");
    this.store = new FileCredentialStore(join(deps.dataDir, "auth.json"));
    this.memory = new Memory({ root: deps.memoryRoot, dataDir: deps.dataDir });
    this.config = loadConfig(this.configPath);
    this.registry = buildRegistry(this.config, this.store);
    this.sync = new SyncEngine({
      memory: this.memory,
      dataDir: deps.dataDir,
      log: deps.log,
      // Late-bound on purpose: the ingestion pass runs on whatever provider and
      // model chat is using at the time it fires, including one signed in after
      // the brain started.
      resolveModel: () => this.resolveModel(),
      streamFn: this.registry.models.streamSimple.bind(this.registry.models),
      settings: settingsFromEnv(process.env),
    });
  }

  /** Starts the scheduled sync and lint passes. Called by main.ts, not by tests. */
  startScheduler(): void {
    this.sync.startTimers();
    this.log(
      `sync scheduled every ${this.sync.settings.intervalMs / 60_000} min, ` +
        `lint every ${this.sync.settings.lintIntervalMs / 3_600_000} h`,
    );
  }

  /**
   * Aborts in-flight logins and any running pass (used at stdin EOF so pending
   * flows settle), and stops the scheduler.
   */
  shutdown(): void {
    this.sync.stopTimers();
    this.sync.abort();
    for (const aborter of this.aborters.values()) aborter.abort();
  }

  async handle(request: BrainRequest): Promise<void> {
    switch (request.type) {
      case "hello": {
        if (request.protocolVersion !== PROTOCOL_VERSION) {
          this.send(
            errorEvent(
              request.id,
              "unsupported_version",
              `client speaks protocol ${request.protocolVersion}, brain speaks ${PROTOCOL_VERSION}`,
            ),
          );
          return;
        }
        this.log(
          `hello from ${request.client ?? "unknown client"} (protocol ${request.protocolVersion})`,
        );
        this.send(
          doneEvent(request.id, {
            protocolVersion: PROTOCOL_VERSION,
            brain: "minne-brain",
            brainVersion: this.brainVersion,
          }),
        );
        return;
      }
      case "status":
        return this.handleStatus(request.id);
      case "chat":
        return this.handleChat(request);
      case "login":
        return this.handleLogin(request);
      case "auth_reply":
        return this.handleAuthReply(request);
      case "logout":
        return this.handleLogout(request);
      case "configure":
        return this.handleConfigure(request);
      case "search_sources":
        return this.handleSearchSources(request);
      case "memory_recent":
        return this.handleMemoryRecent(request.id);
      case "draft":
        return this.handleDraft(request);
      case "draft_outcome":
        return this.handleDraftOutcome(request);
      case "ingest":
        return this.handleIngest(request);
      case "abort": {
        const aborter = this.aborters.get(request.targetId);
        aborter?.abort();
        this.send(doneEvent(request.id, { aborted: aborter !== undefined }));
        return;
      }
      default: {
        // Exhaustive today; the annotation is what fails the build the day a
        // request type is added to the protocol and not handled here.
        const unhandled: never = request;
        const raw = unhandled as BrainRequest;
        this.send(errorEvent(raw.id, "unimplemented", `"${raw.type}" is not implemented yet`));
      }
    }
  }

  // ---- chat ----

  /**
   * Runs one user turn through a pi-agent-core Agent. Deltas stream out as
   * `text_delta` events on the request id; the terminal event is `done` with
   * `{ model, stopReason, usage?, aborted? }` (aborted chats keep their
   * partial text in the session) or a typed error (`busy`,
   * `not_authenticated`, `provider_error`). Errored exchanges are rolled out
   * of the session so a retry starts clean.
   */
  private async handleChat(request: ChatRequest): Promise<void> {
    const { id } = request;
    if (this.activeChatId !== null) {
      this.send(errorEvent(id, "busy", "a chat is already streaming; abort it first"));
      return;
    }

    const resolution = await this.resolveModel();
    if ("unavailable" in resolution) {
      this.send(errorEvent(id, resolution.code, resolution.unavailable));
      return;
    }

    const agent = this.ensureChatAgent(resolution.model);
    if (request.newChat) agent.reset();
    // Provider/model selection may have changed since the session started.
    agent.state.model = resolution.model;

    const aborter = new AbortController();
    aborter.signal.addEventListener("abort", () => agent.abort(), { once: true });
    this.aborters.set(id, aborter);
    this.activeChatId = id;
    const transcriptLength = agent.state.messages.length;
    try {
      await agent.prompt(request.message);
      const last = agent.state.messages.at(-1);
      if (last === undefined || !("role" in last) || last.role !== "assistant") {
        this.send(errorEvent(id, "internal", "agent produced no assistant message"));
        return;
      }
      if (last.stopReason === "error") {
        // Drop the failed exchange (user turn + error message) from the session.
        agent.state.messages = agent.state.messages.slice(0, transcriptLength);
        this.send(errorEvent(id, "provider_error", last.errorMessage ?? "provider request failed"));
        return;
      }
      const aborted = last.stopReason === "aborted";
      this.log(`chat ${id}: ${last.model} stopReason=${last.stopReason}`);
      this.send(
        doneEvent(id, {
          model: last.model,
          stopReason: last.stopReason,
          text: assistantText(agent.state.messages.slice(transcriptLength)),
          usage: {
            input: last.usage.input,
            output: last.usage.output,
            totalTokens: last.usage.totalTokens,
          },
          ...(aborted ? { aborted: true } : {}),
        }),
      );
    } catch (err) {
      // agent.prompt should encode failures in the transcript, but never let
      // a surprise reject crash the brain.
      const message = err instanceof Error ? err.message : String(err);
      this.log(`chat ${id} failed:`, err);
      this.send(errorEvent(id, "provider_error", message));
    } finally {
      this.activeChatId = null;
      this.aborters.delete(id);
    }
  }

  /**
   * Lazily creates the session Agent and bridges its events to the protocol:
   * assistant deltas as `text_delta`, each tool the model reaches for as
   * `tool_call` so the UI can say what memory is being consulted.
   *
   * The tools are the ones from memory-tools.ts — the same array the ingestion
   * pass uses, which is why a chat turn can already read and write the wiki.
   */
  private ensureChatAgent(model: Model<Api>): Agent {
    if (this.chatAgent) return this.chatAgent;
    const agent = new Agent({
      initialState: {
        systemPrompt: MINNE_SYSTEM_PROMPT,
        model,
        tools: memoryTools(this.memory),
      },
      streamFn: this.registry.models.streamSimple.bind(this.registry.models),
    });
    agent.subscribe((event) => {
      if (this.activeChatId === null) return;
      if (event.type === "tool_execution_start") {
        this.log(`chat ${this.activeChatId}: tool ${event.toolName}`);
        this.send({
          type: "tool_call",
          id: this.activeChatId,
          name: event.toolName,
          args: isRecord(event.args) ? event.args : {},
        });
        return;
      }
      if (event.type !== "message_update") return;
      const streamEvent = event.assistantMessageEvent;
      if (streamEvent.type === "text_delta") {
        this.send({ type: "text_delta", id: this.activeChatId, delta: streamEvent.delta });
      }
    });
    this.chatAgent = agent;
    return agent;
  }

  /**
   * The model a turn should run on, or why there is none. Shared by chat and
   * the ingestion pass so the two can never drift onto different providers —
   * "sync uses the same OAuth'd model as chat" is one function, not a
   * convention.
   */
  private async resolveModel(): Promise<ResolvedModel> {
    const providerId = this.config.provider;
    let check;
    try {
      check = await this.registry.models.checkAuth(providerId);
    } catch (err) {
      this.log(`checkAuth(${providerId}) failed:`, err);
    }
    if (check === undefined) {
      return {
        unavailable: `provider "${providerId}" is not authenticated — sign in first`,
        code: "not_authenticated",
      };
    }
    const modelId = this.selectedModel();
    const model = modelId ? this.registry.models.getModel(providerId, modelId) : undefined;
    if (!model) {
      return {
        unavailable: `model "${modelId ?? "(none)"}" not found for provider "${providerId}"`,
        code: "invalid_request",
      };
    }
    return { model };
  }

  // ---- the Minne key ----

  /**
   * One press of the drafting key. Unlike chat this streams nothing: the app
   * may not touch the user's text field until the draft is whole, so a partial
   * draft has nowhere to go and the terminal event carries all of it. What does
   * go out is `tool_call`, so the overlay can say which memory is being read
   * while the user waits.
   *
   * One at a time, like chat — but with its own flag, because a draft in Mail
   * and a chat turn in the panel are different conversations and neither should
   * refuse the other.
   */
  private async handleDraft(request: DraftRequest): Promise<void> {
    const { id } = request;
    if (this.activeDraftId !== null) {
      this.send(errorEvent(id, "busy", "a draft is already being written"));
      return;
    }
    const resolution = await this.resolveModel();
    if ("unavailable" in resolution) {
      this.send(errorEvent(id, resolution.code, resolution.unavailable));
      return;
    }

    const context: DraftContext = {
      mode: request.mode,
      fieldText: request.fieldText ?? "",
      selection: request.selection ?? "",
      windowText: request.windowText ?? "",
      app: request.app ?? "this app",
      ...(request.bundleId === undefined ? {} : { bundleId: request.bundleId }),
      ...(request.windowTitle === undefined ? {} : { windowTitle: request.windowTitle }),
      ...(request.url === undefined ? {} : { url: request.url }),
      ...(request.recipient === undefined ? {} : { recipient: request.recipient }),
      // The rework fields: absent on a first press, and absent rather than
      // empty here so a plain draft's prompt is byte-for-byte what it was.
      ...(request.previousDraft === undefined ? {} : { previousDraft: request.previousDraft }),
      ...(request.guidance === undefined ? {} : { guidance: request.guidance }),
      ...(request.regenerate === undefined ? {} : { regenerate: request.regenerate }),
    };

    // US-204: a steer is learned the moment it is submitted, before the model
    // runs — a draft that then fails, or is retried, changes nothing about
    // what the user asked for. Never allowed to fail the draft itself.
    try {
      this.sync.recordSteer(context);
    } catch (err) {
      this.log("steer record failed:", err);
    }

    // US-205: remember which style context this draft belongs to, so the
    // outcome that may arrive later can be attributed without carrying the
    // whole context back over the wire.
    this.recentDraftContexts.set(id, {
      app: context.app,
      ...(request.url === undefined ? {} : { url: request.url }),
      ...(request.recipient === undefined ? {} : { recipient: request.recipient }),
    });
    while (this.recentDraftContexts.size > MinneBrain.MAX_RECENT_DRAFTS) {
      const oldest = this.recentDraftContexts.keys().next().value as string;
      this.recentDraftContexts.delete(oldest);
    }

    const aborter = new AbortController();
    this.aborters.set(id, aborter);
    this.activeDraftId = id;
    try {
      const result = await runDraft(context, {
        memory: this.memory,
        model: resolution.model,
        streamFn: this.registry.models.streamSimple.bind(this.registry.models),
        signal: aborter.signal,
        onTool: (name) => this.send({ type: "tool_call", id, name, args: {} }),
        log: this.log,
      });
      this.log(
        `draft ${id}: ${result.mode} in ${context.app}, ${result.text.length} chars, ` +
          `style ${result.stylePage ?? "(none)"}, ` +
          `memory ${result.memoryPages.length === 0 ? "(none)" : result.memoryPages.join(" ")}` +
          (context.regenerate === true ? ", another take" : "") +
          (context.guidance !== undefined && context.guidance.length > 0
            ? `, guided by ${context.guidance.length}`
            : ""),
      );
      this.send(doneEvent(id, result));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log(`draft ${id} failed:`, err);
      const aborted = aborter.signal.aborted;
      this.send(
        errorEvent(
          id,
          aborted ? "aborted" : err instanceof DraftFailedError ? "provider_error" : "internal",
          message,
        ),
      );
    } finally {
      this.activeDraftId = null;
      this.aborters.delete(id);
    }
  }

  /**
   * What became of a draft (US-205): an edited insert feeds the edit ledger,
   * an untouched insert counts as approval, a dismissal as an abandon. The
   * app fires and forgets this, so the answer is always a bare `done` —
   * including for a draft id the map no longer knows (a brain restarted
   * mid-press, or an id long since aged out), whose outcome is dropped
   * silently by design.
   */
  private handleDraftOutcome(request: DraftOutcomeRequest): void {
    const context = this.recentDraftContexts.get(request.draftId);
    this.recentDraftContexts.delete(request.draftId);
    if (context === undefined) {
      this.log(`draft_outcome for unknown draft ${request.draftId} — dropped`);
      this.send(doneEvent(request.id, { recorded: false }));
      return;
    }
    try {
      this.sync.recordDraftOutcome({
        ...context,
        outcome: request.outcome,
        ...(request.edited === undefined ? {} : { edited: request.edited }),
        ...(request.generated === undefined ? {} : { generated: request.generated }),
      });
      this.log(
        `draft_outcome ${request.draftId}: ${request.outcome}` +
          (request.edited === undefined ? "" : " (edited)"),
      );
    } catch (err) {
      // Never let ledger bookkeeping turn a fire-and-forget into an error.
      this.log("draft outcome record failed:", err);
    }
    this.send(doneEvent(request.id, { recorded: true }));
  }

  // ---- ingestion ----

  /**
   * Runs a sync or lint pass now. The pass itself decides whether there is
   * anything to do — an idle or skipped pass is a `done` carrying that verdict,
   * not an error, because "nothing new" and "not signed in" are normal states
   * for a background job and Settings shows them as such. Only a genuine
   * failure (or a second pass on top of a running one) is an error.
   */
  private async handleIngest(request: IngestRequest): Promise<void> {
    const mode = request.mode ?? "sync";
    const aborter = new AbortController();
    aborter.signal.addEventListener("abort", () => this.sync.abort(), { once: true });
    this.aborters.set(request.id, aborter);
    try {
      const result: PassResult =
        mode === "lint"
          ? { pass: "lint", ...(await this.sync.runLint()) }
          : { pass: "sync", ...(await this.sync.runSync()) };
      if (result.status === "error") {
        this.send(errorEvent(request.id, "provider_error", result.reason ?? `${mode} pass failed`));
        return;
      }
      this.log(`${mode} pass: ${result.status}`);
      this.send(doneEvent(request.id, result));
    } catch (err) {
      if (err instanceof SyncBusyError) {
        this.send(errorEvent(request.id, "busy", err.message));
        return;
      }
      const message = err instanceof Error ? err.message : String(err);
      this.log(`${mode} pass failed:`, err);
      this.send(errorEvent(request.id, "internal", message));
    } finally {
      this.aborters.delete(request.id);
    }
  }

  // ---- login ----

  private async handleLogin(request: LoginRequest): Promise<void> {
    const { id, provider } = request;
    const spec = this.registry.specs.find((s) => s.id === provider);
    if (!spec) {
      this.send(errorEvent(id, "invalid_request", `unknown provider "${provider}"`));
      return;
    }
    const method = request.method ?? spec.methods[0];
    if (method === undefined || !spec.methods.includes(method)) {
      this.send(
        errorEvent(
          id,
          "invalid_request",
          `provider "${provider}" does not support ${request.method ?? "any"} login`,
        ),
      );
      return;
    }

    const aborter = new AbortController();
    this.aborters.set(id, aborter);
    try {
      await this.registry.models.login(provider, method, this.makeInteraction(id, aborter.signal));
      this.log(`login ok: ${provider} via ${method}`);
      this.send(doneEvent(id, { provider, method, authenticated: true }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const aborted =
        aborter.signal.aborted || (err instanceof Error && err.name === "AbortError");
      this.log(`login failed: ${provider} via ${method}: ${message}`);
      this.send(errorEvent(id, aborted ? "aborted" : "auth_failed", message));
    } finally {
      this.aborters.delete(id);
      // Drop any prompt still pending for this login so auth_reply can't
      // resume a dead flow.
      for (const [promptId, waiter] of this.prompts) {
        if (waiter.loginId === id) this.prompts.delete(promptId);
      }
    }
  }

  /** Bridges pi's AuthInteraction onto protocol events. */
  private makeInteraction(loginId: string, signal: AbortSignal): AuthInteraction {
    let seq = 0;
    return {
      signal,
      prompt: (p: AuthPrompt) =>
        new Promise<string>((resolve, reject) => {
          const promptId = `${loginId}:${++seq}`;
          const settle = (fn: () => void) => {
            if (!this.prompts.delete(promptId)) return;
            fn();
          };
          this.prompts.set(promptId, {
            loginId,
            resolve: (value) => settle(() => resolve(value)),
            reject: (err) => settle(() => reject(err)),
          });
          const abort = () =>
            settle(() => reject(new DOMException("auth prompt aborted", "AbortError")));
          // p.signal: the flow no longer needs this prompt (e.g. a callback
          // server won the race); the login-level signal covers app aborts.
          p.signal?.addEventListener("abort", abort, { once: true });
          signal.addEventListener("abort", abort, { once: true });

          const event: AuthPromptEvent = {
            type: "auth_prompt",
            id: loginId,
            promptId,
            prompt: p.message,
            promptType: p.type,
          };
          if (p.type !== "select" && p.placeholder !== undefined) {
            event.placeholder = p.placeholder;
          }
          if (p.type === "select") {
            event.options = p.options.map((o) =>
              o.description === undefined
                ? { id: o.id, label: o.label }
                : { id: o.id, label: o.label, description: o.description },
            );
          }
          this.send(event);
        }),
      notify: (event: AuthEvent) => {
        switch (event.type) {
          case "auth_url":
            this.send({ type: "auth_url", id: loginId, url: event.url });
            if (event.instructions) {
              this.send({ type: "progress", id: loginId, message: event.instructions });
            }
            return;
          case "device_code":
            this.send({ type: "auth_url", id: loginId, url: event.verificationUri });
            this.send({
              type: "progress",
              id: loginId,
              message: `Enter code ${event.userCode} at ${event.verificationUri}`,
            });
            return;
          case "info": {
            this.send({ type: "progress", id: loginId, message: event.message });
            for (const link of event.links ?? []) {
              this.send({
                type: "progress",
                id: loginId,
                message: `${link.label ?? "More information"}: ${link.url}`,
              });
            }
            return;
          }
          case "progress":
            this.send({ type: "progress", id: loginId, message: event.message });
            return;
        }
      },
    };
  }

  private handleAuthReply(request: AuthReplyRequest): void {
    const waiter = this.prompts.get(request.promptId);
    if (!waiter || waiter.loginId !== request.targetId) {
      this.send(
        errorEvent(
          request.id,
          "invalid_request",
          `no pending auth prompt "${request.promptId}" for login "${request.targetId}"`,
        ),
      );
      return;
    }
    if (request.cancel === true) {
      waiter.reject(new DOMException("cancelled by user", "AbortError"));
    } else {
      // decodeRequest guarantees value is present when cancel isn't true
      waiter.resolve(request.value ?? "");
    }
    this.send(doneEvent(request.id));
  }

  // ---- sources ----

  /**
   * Ranked snippets from the captures the app has indexed. Synchronous and
   * cheap; the answer carries `available: false` rather than an error when
   * nothing has been captured yet, so a caller can tell "no memory" from
   * "no match".
   */
  private handleSearchSources(request: SearchSourcesRequest): void {
    try {
      const result = searchSources(this.dataDir, request.query, request.limit);
      this.log(
        `search_sources "${request.query}": ${result.results.length}/${result.indexed} indexed`,
      );
      this.send(doneEvent(request.id, result));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (err instanceof EmptyQueryError) {
        this.send(errorEvent(request.id, "invalid_request", message));
        return;
      }
      this.log("search_sources failed:", err);
      this.send(errorEvent(request.id, "internal", message));
    }
  }

  // ---- memory ----

  /**
   * The pages behind the menu bar's "Recently remembered": newest first,
   * capped at eight. Synchronous and cheap (one wiki-tree scan); an empty
   * memory is an empty list, not an error.
   */
  private handleMemoryRecent(id: string): void {
    try {
      const pages = this.memory.recentPages();
      this.log(`memory_recent: ${pages.length} page(s)`);
      this.send(doneEvent(id, { pages }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log("memory_recent failed:", err);
      this.send(errorEvent(id, "internal", message));
    }
  }

  // ---- logout / status / configure ----

  private async handleLogout(request: LogoutRequest): Promise<void> {
    const providerIds = request.provider
      ? [request.provider]
      : (await this.store.list()).map((info) => info.providerId);
    for (const providerId of providerIds) {
      if (this.registry.models.getProvider(providerId)) {
        await this.registry.models.logout(providerId);
      } else {
        await this.store.delete(providerId);
      }
    }
    this.log(`logout: ${providerIds.join(", ") || "(nothing stored)"}`);
    this.send(doneEvent(request.id, { cleared: providerIds }));
  }

  private async handleStatus(id: string): Promise<void> {
    const providers = [];
    for (const spec of this.registry.specs) {
      let check;
      try {
        check = await this.registry.models.checkAuth(spec.id);
      } catch (err) {
        this.log(`checkAuth(${spec.id}) failed:`, err);
      }
      providers.push({
        id: spec.id,
        label: spec.label,
        methods: spec.methods,
        authenticated: check !== undefined,
        source: check?.source ?? null,
        authType: check?.type ?? null,
        defaultModel: this.defaultModelFor(spec.id),
        // The catalog the app's model picker offers for this provider (US-014).
        // Last-known list, synchronous: static providers hold their whole
        // catalog, so no login is needed to populate the picker.
        models: this.registry.models
          .getModels(spec.id)
          .map((model) => ({ id: model.id, name: model.name })),
        ...(spec.id === "ollama" ? { baseUrl: this.config.ollama.baseUrl } : {}),
      });
    }
    this.send(
      doneEvent(id, {
        state: "idle",
        provider: this.config.provider,
        model: this.selectedModel(),
        providers,
        // What Settings shows as "last sync": the watermark, the backlog, the
        // schedule, and what the last sync and lint passes did (US-015).
        sync: this.sync.status(),
      }),
    );
  }

  private async handleConfigure(request: ConfigureRequest): Promise<void> {
    if (request.provider !== undefined && !this.registry.specs.some((s) => s.id === request.provider)) {
      this.send(errorEvent(request.id, "invalid_request", `unknown provider "${request.provider}"`));
      return;
    }
    if (request.baseUrl !== undefined) {
      try {
        new URL(request.baseUrl);
      } catch {
        this.send(errorEvent(request.id, "invalid_request", `invalid baseUrl "${request.baseUrl}"`));
        return;
      }
    }

    const next = structuredClone(this.config);
    if (request.provider !== undefined && request.provider !== next.provider) {
      next.provider = request.provider;
      next.model = null; // fall back to the new provider's default
    }
    if (request.baseUrl !== undefined) next.ollama.baseUrl = request.baseUrl;
    if (request.model !== undefined) {
      next.model = request.model;
      if (next.provider === "ollama") next.ollama.model = request.model;
    }

    const ollamaChanged =
      next.ollama.baseUrl !== this.config.ollama.baseUrl ||
      next.ollama.model !== this.config.ollama.model;
    this.config = next;
    saveConfig(this.configPath, this.config);
    if (ollamaChanged) {
      this.registry.models.setProvider(ollamaProviderFrom(this.config));
      const spec = this.registry.specs.find((s) => s.id === "ollama");
      if (spec) spec.defaultModel = this.config.ollama.model;
    }
    this.log(`configured: provider=${this.config.provider} model=${this.selectedModel()}`);
    this.send(
      doneEvent(request.id, { provider: this.config.provider, model: this.selectedModel() }),
    );
  }

  private defaultModelFor(providerId: string): string | null {
    if (providerId === "ollama") return this.config.ollama.model;
    return this.registry.specs.find((s) => s.id === providerId)?.defaultModel ?? null;
  }

  private selectedModel(): string | null {
    return this.config.model ?? this.defaultModelFor(this.config.provider);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
