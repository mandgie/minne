import { join } from "node:path";
import { Agent } from "@earendil-works/pi-agent-core";
import type {
  Api,
  AuthEvent,
  AuthInteraction,
  AuthPrompt,
  Model,
} from "@earendil-works/pi-ai";
import { loadConfig, saveConfig, type MinneConfig } from "./config";
import { FileCredentialStore } from "./credentials";
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
  type LoginRequest,
  type LogoutRequest,
} from "./protocol";
import { buildRegistry, ollamaProviderFrom, type Registry } from "./providers";

interface PromptWaiter {
  loginId: string;
  resolve(value: string): void;
  reject(err: Error): void;
}

/**
 * System prompt for the chat agent. Memory tools arrive in a later story, so
 * the prompt promises nothing the brain can't do yet.
 */
const MINNE_SYSTEM_PROMPT = `You are Minne, a local memory companion that lives in the macOS menu bar. \
You chat with the user about whatever they bring up. Your memory of their work \
(a local markdown wiki) is not wired up yet, so answer from this conversation \
alone and say so if asked about past activity. Be concise and direct.`;

export interface MinneBrainDeps {
  send: (event: BrainEvent) => void;
  log: (...args: unknown[]) => void;
  /** ~/Library/Application Support/Minne (or a test override) */
  dataDir: string;
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
  private readonly configPath: string;
  private readonly store: FileCredentialStore;
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

  constructor(deps: MinneBrainDeps) {
    this.send = deps.send;
    this.log = deps.log;
    this.brainVersion = deps.brainVersion;
    this.configPath = join(deps.dataDir, "config.json");
    this.store = new FileCredentialStore(join(deps.dataDir, "auth.json"));
    this.config = loadConfig(this.configPath);
    this.registry = buildRegistry(this.config, this.store);
  }

  /** Aborts in-flight logins (used at stdin EOF so pending flows settle). */
  shutdown(): void {
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
      case "abort": {
        const aborter = this.aborters.get(request.targetId);
        aborter?.abort();
        this.send(doneEvent(request.id, { aborted: aborter !== undefined }));
        return;
      }
      default:
        this.send(errorEvent(request.id, "unimplemented", `"${request.type}" is not implemented yet`));
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

    const providerId = this.config.provider;
    let check;
    try {
      check = await this.registry.models.checkAuth(providerId);
    } catch (err) {
      this.log(`checkAuth(${providerId}) failed:`, err);
    }
    if (check === undefined) {
      this.send(
        errorEvent(
          id,
          "not_authenticated",
          `provider "${providerId}" is not authenticated — sign in first`,
        ),
      );
      return;
    }
    const modelId = this.selectedModel();
    const model = modelId ? this.registry.models.getModel(providerId, modelId) : undefined;
    if (!model) {
      this.send(
        errorEvent(
          id,
          "invalid_request",
          `model "${modelId ?? "(none)"}" not found for provider "${providerId}"`,
        ),
      );
      return;
    }

    const agent = this.ensureChatAgent(model);
    if (request.newChat) agent.reset();
    // Provider/model selection may have changed since the session started.
    agent.state.model = model;

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

  /** Lazily creates the session Agent and bridges its deltas to the protocol. */
  private ensureChatAgent(model: Model<Api>): Agent {
    if (this.chatAgent) return this.chatAgent;
    const agent = new Agent({
      initialState: { systemPrompt: MINNE_SYSTEM_PROMPT, model },
      streamFn: this.registry.models.streamSimple.bind(this.registry.models),
    });
    agent.subscribe((event) => {
      if (event.type !== "message_update" || this.activeChatId === null) return;
      const streamEvent = event.assistantMessageEvent;
      if (streamEvent.type === "text_delta") {
        this.send({ type: "text_delta", id: this.activeChatId, delta: streamEvent.delta });
      }
    });
    this.chatAgent = agent;
    return agent;
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
        ...(spec.id === "ollama" ? { baseUrl: this.config.ollama.baseUrl } : {}),
      });
    }
    this.send(
      doneEvent(id, {
        state: "idle",
        provider: this.config.provider,
        model: this.selectedModel(),
        providers,
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
