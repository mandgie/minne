// Wire protocol between the Swift app and the brain: JSON-lines over stdio.
// One JSON object per line. Requests flow app -> brain; events flow brain -> app.
// Every message carries a correlation `id`. The brain answers each request with
// zero or more intermediate events and exactly one terminal event (`done` or
// `error`) bearing the request's id.
// Mirrored by app/Sources/Minne/BrainProtocol.swift — keep the two in sync.

export const PROTOCOL_VERSION = 1;

// ---- Requests (app -> brain) ----

export interface HelloRequest {
  type: "hello";
  id: string;
  protocolVersion: number;
  client?: string;
}

/**
 * One user turn against the in-memory chat session. The brain streams
 * `text_delta` events carrying this request's id, then terminates with `done`
 * whose result is `{ model, stopReason, text, usage?: {input, output,
 * totalTokens}, aborted?: true }`, or a typed `error` (`busy` while another
 * chat streams,
 * `not_authenticated` when the selected provider has no credentials,
 * `provider_error` for network/API failures). `newChat: true` clears the
 * session before this message.
 *
 * `text` is everything the assistant said during this turn — the same content
 * the deltas carried. It is there so a client can reconcile: deltas are a
 * stream and a UI may still be draining them (or may have dropped some) when
 * the terminal event settles the request.
 */
export interface ChatRequest {
  type: "chat";
  id: string;
  message: string;
  newChat?: boolean;
}

/**
 * Cancels the in-flight request `targetId`. An aborted *chat* still terminates
 * with `done` — carrying `aborted: true` — because the partial text already
 * streamed is valid content. An aborted *login* terminates with an `error` of
 * code "aborted" (nothing useful was produced).
 */
export interface AbortRequest {
  type: "abort";
  id: string;
  /** id of the in-flight request to cancel */
  targetId: string;
}

export type LoginMethod = "oauth" | "api_key";

export interface LoginRequest {
  type: "login";
  id: string;
  provider: string;
  /** Defaults to the provider's preferred method (oauth when available). */
  method?: LoginMethod;
}

/** Answers an `auth_prompt` event emitted by an in-flight `login`. */
export interface AuthReplyRequest {
  type: "auth_reply";
  id: string;
  /** id of the login request whose prompt this answers */
  targetId: string;
  promptId: string;
  value?: string;
  cancel?: boolean;
}

/** Updates selected provider/model and the local-server base URL; persisted. */
export interface ConfigureRequest {
  type: "configure";
  id: string;
  provider?: string;
  model?: string;
  baseUrl?: string;
}

export interface LogoutRequest {
  type: "logout";
  id: string;
  provider?: string;
}

export type IngestMode = "sync" | "lint";

/**
 * Runs a memory-maintenance pass now, instead of waiting for its timer.
 *
 * `mode: "sync"` (the default) digests the captures taken since the watermark
 * into wiki pages; `mode: "lint"` runs wiki-lint and has the agent fix what it
 * reports. Both terminate with `done` carrying the pass summary — see
 * `SyncPassSummary` / `LintPassSummary` in sync-state.ts — including the
 * `skipped` a pass reports when no provider is signed in and the `idle` it
 * reports when there is nothing new (neither calls a model). A second pass
 * while one is running is refused with `busy`; a provider failure mid-pass is a
 * `provider_error`.
 */
export interface IngestRequest {
  type: "ingest";
  id: string;
  mode?: IngestMode;
}

/**
 * Full-text search over the raw captures the app has indexed (the app writes
 * `minne.db`, the brain only ever reads it). Terminates with `done` whose
 * result is `{ query, indexed, results: SourceHit[] }` — see `sources.ts`.
 * Bare words are ANDed; a trailing `*` on a word makes it a prefix match.
 */
export interface SearchSourcesRequest {
  type: "search_sources";
  id: string;
  query: string;
  /** default 10, capped at 50 */
  limit?: number;
}

export type DraftMode = "instruction" | "rewrite" | "infer";

/**
 * One press of the Minne key: write the text that goes into the field the user
 * is in. The app has already read that field via Accessibility and decided the
 * mode (selection → `rewrite`, non-empty field → `instruction`, empty →
 * `infer`); the brain builds the prompt, consults the `style/` page for this
 * app and recipient, and answers with the finished text.
 *
 * Terminates with `done` whose result is `{ mode, text, model, stopReason,
 * stylePage, usage }` — no `text_delta`s, deliberately: the app must not touch
 * the user's field until the draft is complete, so a partial one has nowhere to
 * go. `tool_call` events do go out, so the overlay can say what memory is being
 * consulted. Errors: `busy` (a draft is already running), `not_authenticated`,
 * `provider_error`, `aborted`.
 */
export interface DraftRequest {
  type: "draft";
  id: string;
  mode: DraftMode;
  /** the field's whole text — the instruction itself in `instruction` mode */
  fieldText?: string;
  /** the selected text, in `rewrite` mode */
  selection?: string;
  /** the rest of the window, read via AX at press time */
  windowText?: string;
  /** the app's name, which is also the style page's context */
  app?: string;
  bundleId?: string;
  windowTitle?: string;
  /**
   * The page's address for web content, query and fragment already stripped
   * by the app — the register signal a browser's name cannot give, and the
   * key for domain-scoped style pages.
   */
  url?: string;
  /** person or channel written to, when the window title gives one away */
  recipient?: string;
  /**
   * The draft already on screen, when this press is a rework of it rather than
   * a first attempt — sent so the model can differ from it or revise it, which
   * it cannot do from a transcript it does not have (every draft is a fresh
   * Agent).
   */
  previousDraft?: string;
  /** the user's steers so far, oldest first; the last one is the new one */
  guidance?: string[];
  /** true when the user asked for another take rather than a revision */
  regenerate?: boolean;
}

export type DraftOutcome = "inserted" | "abandoned";

/**
 * What became of the draft the request `draftId` wrote (US-205). Fire-and-
 * forget from the app's point of view: the brain folds the outcome into the
 * edit ledger and answers a bare `done` — nothing in the insert path waits on
 * it.
 *
 * `edited` and `generated` ride along only when the user edited the draft in
 * the overlay before inserting it — the byte-exact correction nobody else can
 * see. They come together or not at all: an unedited insert sends neither
 * (it counts as an approval of the generated text), and an abandon carries no
 * texts (it is counted, never interpreted). The brain attributes the outcome
 * to the draft's style context via an in-memory map of recent draft ids, so
 * an outcome for a brain restarted mid-press is silently dropped — accepted.
 */
export interface DraftOutcomeRequest {
  type: "draft_outcome";
  id: string;
  /** id of the draft request whose text this settles */
  draftId: string;
  outcome: DraftOutcome;
  /** the inserted text, only when it differs from what the model wrote */
  edited?: string;
  /** what the model wrote, only alongside `edited` */
  generated?: string;
}

/**
 * The last few wiki pages by `last_updated`, for the status-bar menu's
 * "Recently remembered" submenu. Terminates with `done` whose result is
 * `{ pages: [{ path, title, lastUpdated }] }` — newest first, at most 8,
 * pages without a date last. An empty memory answers an empty list, not an
 * error.
 */
export interface MemoryRecentRequest {
  type: "memory_recent";
  id: string;
}

/**
 * The brain's current state. Terminates with `done` whose result is
 * `{ state, provider, model, providers: [...], sync }`.
 *
 * Each entry of `providers` is `{ id, label, methods, authenticated, source,
 * authType, defaultModel, models: [{id, name}] }` plus `baseUrl` for the local
 * server — everything the onboarding provider step and Settings need to render
 * auth state and a model picker without a second request.
 *
 * `sync` is the `SyncStatus` of ingest.ts: the watermark, how many captures are
 * still waiting, the schedule, and the summary of the last sync and lint
 * passes — what Settings renders as "last sync" (US-015).
 */
export interface StatusRequest {
  type: "status";
  id: string;
}

export type BrainRequest =
  | HelloRequest
  | ChatRequest
  | AbortRequest
  | LoginRequest
  | AuthReplyRequest
  | ConfigureRequest
  | LogoutRequest
  | IngestRequest
  | SearchSourcesRequest
  | DraftRequest
  | DraftOutcomeRequest
  | MemoryRecentRequest
  | StatusRequest;

// ---- Events (brain -> app) ----

export interface TextDeltaEvent {
  type: "text_delta";
  id: string;
  delta: string;
}

export interface ToolCallEvent {
  type: "tool_call";
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface AuthUrlEvent {
  type: "auth_url";
  id: string;
  url: string;
}

export type AuthPromptType = "text" | "secret" | "select" | "manual_code";

export interface AuthPromptOption {
  id: string;
  label: string;
  description?: string;
}

/**
 * A login flow needs user input. The app answers with an `auth_reply` request
 * carrying the same `promptId`; the login stays in flight until then.
 */
export interface AuthPromptEvent {
  type: "auth_prompt";
  /** id of the login request that raised the prompt */
  id: string;
  promptId: string;
  prompt: string;
  promptType: AuthPromptType;
  placeholder?: string;
  /** present for promptType "select"; reply value is the chosen option id */
  options?: AuthPromptOption[];
}

export interface ProgressEvent {
  type: "progress";
  id: string;
  message: string;
  fraction?: number;
}

export interface DoneEvent {
  type: "done";
  id: string;
  result?: unknown;
}

export type ErrorCode =
  | "invalid_json"
  | "invalid_request"
  | "unsupported_version"
  | "unimplemented"
  | "auth_failed"
  | "aborted"
  /** a chat is already streaming; abort it before sending another */
  | "busy"
  /** the selected provider has no credentials — run `login` first */
  | "not_authenticated"
  /** the provider request failed (network, rate limit, API error) */
  | "provider_error"
  | "internal";

export interface ErrorEvent {
  type: "error";
  /** empty string when the offending input's id could not be recovered */
  id: string;
  code: ErrorCode;
  message: string;
}

export type BrainEvent =
  | TextDeltaEvent
  | ToolCallEvent
  | AuthUrlEvent
  | AuthPromptEvent
  | ProgressEvent
  | DoneEvent
  | ErrorEvent;

// ---- Encoding / decoding ----

export function encodeEvent(event: BrainEvent): string {
  return JSON.stringify(event);
}

export function doneEvent(id: string, result?: unknown): DoneEvent {
  return result === undefined ? { type: "done", id } : { type: "done", id, result };
}

export function errorEvent(id: string, code: ErrorCode, message: string): ErrorEvent {
  return { type: "error", id, code, message };
}

export type DecodeResult =
  | { ok: true; request: BrainRequest }
  | { ok: false; error: ErrorEvent };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fail(id: string, code: ErrorCode, message: string): DecodeResult {
  return { ok: false, error: errorEvent(id, code, message) };
}

function ok(request: BrainRequest): DecodeResult {
  return { ok: true, request };
}

/** Validates one inbound line into a typed request, or a typed error event. */
export function decodeRequest(line: string): DecodeResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch {
    return fail("", "invalid_json", "line is not valid JSON");
  }
  if (!isRecord(parsed)) {
    return fail("", "invalid_request", "message must be a JSON object");
  }
  const rawId = parsed["id"];
  if (typeof rawId !== "string" || rawId === "") {
    return fail("", "invalid_request", "message must carry a non-empty string `id`");
  }
  const id = rawId;
  const type = parsed["type"];
  if (typeof type !== "string") {
    return fail(id, "invalid_request", "message must carry a string `type`");
  }

  switch (type) {
    case "hello": {
      const protocolVersion = parsed["protocolVersion"];
      if (typeof protocolVersion !== "number" || !Number.isInteger(protocolVersion)) {
        return fail(id, "invalid_request", "hello requires an integer `protocolVersion`");
      }
      const client = parsed["client"];
      if (client !== undefined && typeof client !== "string") {
        return fail(id, "invalid_request", "hello `client` must be a string when present");
      }
      return ok(
        client === undefined
          ? { type: "hello", id, protocolVersion }
          : { type: "hello", id, protocolVersion, client },
      );
    }
    case "chat": {
      const message = parsed["message"];
      if (typeof message !== "string") {
        return fail(id, "invalid_request", "chat requires a string `message`");
      }
      const newChat = parsed["newChat"];
      if (newChat !== undefined && typeof newChat !== "boolean") {
        return fail(id, "invalid_request", "chat `newChat` must be a boolean when present");
      }
      return ok(
        newChat === undefined
          ? { type: "chat", id, message }
          : { type: "chat", id, message, newChat },
      );
    }
    case "abort": {
      const targetId = parsed["targetId"];
      if (typeof targetId !== "string" || targetId === "") {
        return fail(id, "invalid_request", "abort requires a non-empty string `targetId`");
      }
      return ok({ type: "abort", id, targetId });
    }
    case "login": {
      const provider = parsed["provider"];
      if (typeof provider !== "string" || provider === "") {
        return fail(id, "invalid_request", "login requires a non-empty string `provider`");
      }
      const method = parsed["method"];
      if (method !== undefined && method !== "oauth" && method !== "api_key") {
        return fail(id, "invalid_request", 'login `method` must be "oauth" or "api_key"');
      }
      return ok(
        method === undefined ? { type: "login", id, provider } : { type: "login", id, provider, method },
      );
    }
    case "auth_reply": {
      const targetId = parsed["targetId"];
      if (typeof targetId !== "string" || targetId === "") {
        return fail(id, "invalid_request", "auth_reply requires a non-empty string `targetId`");
      }
      const promptId = parsed["promptId"];
      if (typeof promptId !== "string" || promptId === "") {
        return fail(id, "invalid_request", "auth_reply requires a non-empty string `promptId`");
      }
      const value = parsed["value"];
      if (value !== undefined && typeof value !== "string") {
        return fail(id, "invalid_request", "auth_reply `value` must be a string when present");
      }
      const cancel = parsed["cancel"];
      if (cancel !== undefined && typeof cancel !== "boolean") {
        return fail(id, "invalid_request", "auth_reply `cancel` must be a boolean when present");
      }
      if (value === undefined && cancel !== true) {
        return fail(id, "invalid_request", "auth_reply requires `value` unless `cancel` is true");
      }
      const request: AuthReplyRequest = { type: "auth_reply", id, targetId, promptId };
      if (value !== undefined) request.value = value;
      if (cancel !== undefined) request.cancel = cancel;
      return ok(request);
    }
    case "configure": {
      for (const field of ["provider", "model", "baseUrl"] as const) {
        const value = parsed[field];
        if (value !== undefined && (typeof value !== "string" || value === "")) {
          return fail(id, "invalid_request", `configure \`${field}\` must be a non-empty string when present`);
        }
      }
      const request: ConfigureRequest = { type: "configure", id };
      if (parsed["provider"] !== undefined) request.provider = parsed["provider"] as string;
      if (parsed["model"] !== undefined) request.model = parsed["model"] as string;
      if (parsed["baseUrl"] !== undefined) request.baseUrl = parsed["baseUrl"] as string;
      return ok(request);
    }
    case "logout": {
      const provider = parsed["provider"];
      if (provider !== undefined && typeof provider !== "string") {
        return fail(id, "invalid_request", "logout `provider` must be a string when present");
      }
      return ok(
        provider === undefined ? { type: "logout", id } : { type: "logout", id, provider },
      );
    }
    case "ingest": {
      const mode = parsed["mode"];
      if (mode !== undefined && mode !== "sync" && mode !== "lint") {
        return fail(id, "invalid_request", 'ingest `mode` must be "sync" or "lint"');
      }
      return ok(mode === undefined ? { type: "ingest", id } : { type: "ingest", id, mode });
    }
    case "search_sources": {
      const query = parsed["query"];
      if (typeof query !== "string" || query.trim() === "") {
        return fail(id, "invalid_request", "search_sources requires a non-empty string `query`");
      }
      const limit = parsed["limit"];
      if (limit !== undefined && (typeof limit !== "number" || !Number.isInteger(limit) || limit < 1)) {
        return fail(id, "invalid_request", "search_sources `limit` must be a positive integer");
      }
      return ok(
        limit === undefined
          ? { type: "search_sources", id, query }
          : { type: "search_sources", id, query, limit },
      );
    }
    case "draft": {
      const mode = parsed["mode"];
      if (mode !== "instruction" && mode !== "rewrite" && mode !== "infer") {
        return fail(
          id,
          "invalid_request",
          'draft `mode` must be "instruction", "rewrite" or "infer"',
        );
      }
      const request: DraftRequest = { type: "draft", id, mode };
      for (const field of [
        "fieldText",
        "selection",
        "windowText",
        "app",
        "bundleId",
        "windowTitle",
        "url",
        "recipient",
        "previousDraft",
      ] as const) {
        const value = parsed[field];
        if (value === undefined) continue;
        if (typeof value !== "string") {
          return fail(id, "invalid_request", `draft \`${field}\` must be a string when present`);
        }
        request[field] = value;
      }
      const guidance = parsed["guidance"];
      if (guidance !== undefined) {
        if (!Array.isArray(guidance) || guidance.some((entry) => typeof entry !== "string")) {
          return fail(id, "invalid_request", "draft `guidance` must be an array of strings");
        }
        request.guidance = guidance as string[];
      }
      const regenerate = parsed["regenerate"];
      if (regenerate !== undefined) {
        if (typeof regenerate !== "boolean") {
          return fail(id, "invalid_request", "draft `regenerate` must be a boolean when present");
        }
        request.regenerate = regenerate;
      }
      return ok(request);
    }
    case "draft_outcome": {
      const draftId = parsed["draftId"];
      if (typeof draftId !== "string" || draftId === "") {
        return fail(id, "invalid_request", "draft_outcome requires a non-empty string `draftId`");
      }
      const outcome = parsed["outcome"];
      if (outcome !== "inserted" && outcome !== "abandoned") {
        return fail(id, "invalid_request", 'draft_outcome `outcome` must be "inserted" or "abandoned"');
      }
      const edited = parsed["edited"];
      const generated = parsed["generated"];
      for (const [field, value] of [
        ["edited", edited],
        ["generated", generated],
      ] as const) {
        if (value !== undefined && typeof value !== "string") {
          return fail(id, "invalid_request", `draft_outcome \`${field}\` must be a string when present`);
        }
      }
      // The pair is a diff: one half alone can never be compared to anything.
      if ((edited === undefined) !== (generated === undefined)) {
        return fail(id, "invalid_request", "draft_outcome `edited` and `generated` come together");
      }
      const request: DraftOutcomeRequest = { type: "draft_outcome", id, draftId, outcome };
      if (edited !== undefined) request.edited = edited as string;
      if (generated !== undefined) request.generated = generated as string;
      return ok(request);
    }
    case "memory_recent":
      return ok({ type: "memory_recent", id });
    case "status":
      return ok({ type: "status", id });
    default:
      return fail(id, "invalid_request", `unknown request type "${type}"`);
  }
}
