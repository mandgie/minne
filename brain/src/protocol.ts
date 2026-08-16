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

export interface ChatRequest {
  type: "chat";
  id: string;
  message: string;
  newChat?: boolean;
}

export interface AbortRequest {
  type: "abort";
  id: string;
  /** id of the in-flight request to cancel */
  targetId: string;
}

export interface LoginRequest {
  type: "login";
  id: string;
  provider: string;
}

export interface LogoutRequest {
  type: "logout";
  id: string;
  provider?: string;
}

export interface IngestRequest {
  type: "ingest";
  id: string;
}

export interface StatusRequest {
  type: "status";
  id: string;
}

export type BrainRequest =
  | HelloRequest
  | ChatRequest
  | AbortRequest
  | LoginRequest
  | LogoutRequest
  | IngestRequest
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

export interface AuthPromptEvent {
  type: "auth_prompt";
  id: string;
  prompt: string;
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
      return ok({ type: "login", id, provider });
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
    case "ingest":
      return ok({ type: "ingest", id });
    case "status":
      return ok({ type: "status", id });
    default:
      return fail(id, "invalid_request", `unknown request type "${type}"`);
  }
}
