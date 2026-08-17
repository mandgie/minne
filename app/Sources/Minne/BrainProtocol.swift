import Foundation

/// Wire protocol shared with the brain over JSON-lines stdio.
/// Mirrors brain/src/protocol.ts — keep the two in sync.
enum BrainProtocol {
    static let version = 1
}

/// Arbitrary JSON payload (e.g. `done.result`).
enum JSONValue: Codable, Sendable, Equatable {
    case null
    case bool(Bool)
    case number(Double)
    case string(String)
    case array([JSONValue])
    case object([String: JSONValue])

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self = .null
        } else if let bool = try? container.decode(Bool.self) {
            self = .bool(bool)
        } else if let number = try? container.decode(Double.self) {
            self = .number(number)
        } else if let string = try? container.decode(String.self) {
            self = .string(string)
        } else if let array = try? container.decode([JSONValue].self) {
            self = .array(array)
        } else if let object = try? container.decode([String: JSONValue].self) {
            self = .object(object)
        } else {
            throw DecodingError.dataCorruptedError(
                in: container, debugDescription: "not a JSON value")
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .null: try container.encodeNil()
        case .bool(let bool): try container.encode(bool)
        case .number(let number): try container.encode(number)
        case .string(let string): try container.encode(string)
        case .array(let array): try container.encode(array)
        case .object(let object): try container.encode(object)
        }
    }

    var objectValue: [String: JSONValue]? {
        if case .object(let object) = self { return object }
        return nil
    }

    var stringValue: String? {
        if case .string(let string) = self { return string }
        return nil
    }

    var boolValue: Bool? {
        if case .bool(let bool) = self { return bool }
        return nil
    }

    var arrayValue: [JSONValue]? {
        if case .array(let array) = self { return array }
        return nil
    }

    var intValue: Int? {
        if case .number(let number) = self, number == number.rounded() { return Int(number) }
        return nil
    }
}

/// Everything one press of the Minne key tells the brain: what the user is
/// doing, and what was on their screen when they asked.
struct DraftRequestContext: Encodable, Sendable, Equatable {
    var mode: String
    var fieldText: String
    var selection: String
    var windowText: String
    var app: String
    var bundleId: String
    var windowTitle: String
    var recipient: String?
}

/// Requests the app sends to the brain. `id` correlates the brain's events.
enum BrainRequest: Encodable, Sendable {
    case hello(id: String, protocolVersion: Int, client: String)
    /// Streams `textDelta` events on this id, then `done` whose result is
    /// `{model, stopReason, text, usage?: {input, output, totalTokens},
    /// aborted?: true}`, or a typed error (code "busy", "not_authenticated", or
    /// "provider_error"). `text` is everything the assistant said this turn:
    /// the terminal event settles the request without waiting for the event
    /// stream to drain, so it is what the transcript reconciles against rather
    /// than trusting that every delta was seen.
    /// `newChat: true` clears the brain's in-memory session first.
    case chat(id: String, message: String, newChat: Bool?)
    /// Cancels the in-flight request `targetId`. An aborted chat still ends
    /// with `done` (result carries `aborted: true`; partial text stands);
    /// an aborted login ends with an error of code "aborted".
    case abort(id: String, targetId: String)
    /// `method` is "oauth" or "api_key"; nil lets the brain pick the provider default.
    case login(id: String, provider: String, method: String?)
    /// Answers an `auth_prompt` event raised by the login with id `targetId`.
    case authReply(id: String, targetId: String, promptId: String, value: String?, cancel: Bool?)
    case configure(id: String, provider: String?, model: String?, baseUrl: String?)
    case logout(id: String, provider: String?)
    /// Runs a memory-maintenance pass now rather than on its timer: `mode`
    /// "sync" (the default) digests the captures taken since the brain's
    /// watermark, "lint" checks the wiki against SCHEMA.md and has the agent
    /// fix what it can. `done`'s result is the pass summary — `{pass, status,
    /// snapshots, batches, pagesTouched, remaining}` for a sync, where `status`
    /// is "ingested", "idle" (nothing new) or "skipped" (nobody signed in).
    case ingest(id: String, mode: String?)
    /// Full-text search over the captures the app has indexed. `done`'s result
    /// is `{query, indexed, results: [{app, title, url, capturedAt, source,
    /// snippet, score}]}`; `source` is `path#section` into `~/Minne/sources`.
    case searchSources(id: String, query: String, limit: Int?)
    /// One press of the Minne key. The app has already read the field via
    /// Accessibility and decided the mode ("rewrite", "instruction", "infer");
    /// the brain builds the prompt, consults the `style/` page for this app and
    /// recipient, and answers with the finished text. `done`'s result is
    /// `{mode, text, model, stopReason, stylePage, usage}`. There are no
    /// `textDelta`s on purpose — the field is not touched until the draft is
    /// whole, so half a draft has nowhere to go — but `toolCall` events do
    /// arrive, for the overlay's progress line.
    case draft(id: String, context: DraftRequestContext)
    case status(id: String)

    var id: String {
        switch self {
        case .hello(let id, _, _): return id
        case .chat(let id, _, _): return id
        case .abort(let id, _): return id
        case .login(let id, _, _): return id
        case .authReply(let id, _, _, _, _): return id
        case .configure(let id, _, _, _): return id
        case .logout(let id, _): return id
        case .ingest(let id, _): return id
        case .searchSources(let id, _, _): return id
        case .draft(let id, _): return id
        case .status(let id): return id
        }
    }

    private enum CodingKeys: String, CodingKey {
        case type, id, protocolVersion, client, message, newChat, targetId, provider
        case method, promptId, value, cancel, model, baseUrl, query, limit, mode
        case fieldText, selection, windowText, app, bundleId, windowTitle, recipient
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        switch self {
        case let .hello(_, protocolVersion, client):
            try container.encode("hello", forKey: .type)
            try container.encode(protocolVersion, forKey: .protocolVersion)
            try container.encode(client, forKey: .client)
        case let .chat(_, message, newChat):
            try container.encode("chat", forKey: .type)
            try container.encode(message, forKey: .message)
            try container.encodeIfPresent(newChat, forKey: .newChat)
        case let .abort(_, targetId):
            try container.encode("abort", forKey: .type)
            try container.encode(targetId, forKey: .targetId)
        case let .login(_, provider, method):
            try container.encode("login", forKey: .type)
            try container.encode(provider, forKey: .provider)
            try container.encodeIfPresent(method, forKey: .method)
        case let .authReply(_, targetId, promptId, value, cancel):
            try container.encode("auth_reply", forKey: .type)
            try container.encode(targetId, forKey: .targetId)
            try container.encode(promptId, forKey: .promptId)
            try container.encodeIfPresent(value, forKey: .value)
            try container.encodeIfPresent(cancel, forKey: .cancel)
        case let .configure(_, provider, model, baseUrl):
            try container.encode("configure", forKey: .type)
            try container.encodeIfPresent(provider, forKey: .provider)
            try container.encodeIfPresent(model, forKey: .model)
            try container.encodeIfPresent(baseUrl, forKey: .baseUrl)
        case let .logout(_, provider):
            try container.encode("logout", forKey: .type)
            try container.encodeIfPresent(provider, forKey: .provider)
        case let .ingest(_, mode):
            try container.encode("ingest", forKey: .type)
            try container.encodeIfPresent(mode, forKey: .mode)
        case let .searchSources(_, query, limit):
            try container.encode("search_sources", forKey: .type)
            try container.encode(query, forKey: .query)
            try container.encodeIfPresent(limit, forKey: .limit)
        case let .draft(_, context):
            try container.encode("draft", forKey: .type)
            try container.encode(context.mode, forKey: .mode)
            try container.encode(context.fieldText, forKey: .fieldText)
            try container.encode(context.selection, forKey: .selection)
            try container.encode(context.windowText, forKey: .windowText)
            try container.encode(context.app, forKey: .app)
            try container.encode(context.bundleId, forKey: .bundleId)
            try container.encode(context.windowTitle, forKey: .windowTitle)
            try container.encodeIfPresent(context.recipient, forKey: .recipient)
        case .status:
            try container.encode("status", forKey: .type)
        }
    }
}

/// One choice in a "select" auth prompt; the reply value is the chosen `id`.
struct AuthPromptOption: Decodable, Sendable, Equatable {
    let id: String
    let label: String
    let description: String?
}

/// Events the brain streams back. Terminal events (`done`/`error`) settle the
/// request carrying the same `id`; the rest are intermediate.
enum BrainEvent: Decodable, Sendable {
    case textDelta(id: String, delta: String)
    case toolCall(id: String, name: String, args: JSONValue)
    case authURL(id: String, url: String)
    /// promptType: "text" | "secret" | "select" | "manual_code". Answer with
    /// a `BrainRequest.authReply` carrying the same promptId.
    case authPrompt(
        id: String, promptId: String, prompt: String, promptType: String,
        placeholder: String?, options: [AuthPromptOption]?)
    case progress(id: String, message: String, fraction: Double?)
    case done(id: String, result: JSONValue?)
    case error(id: String, code: String, message: String)

    var id: String {
        switch self {
        case .textDelta(let id, _): return id
        case .toolCall(let id, _, _): return id
        case .authURL(let id, _): return id
        case .authPrompt(let id, _, _, _, _, _): return id
        case .progress(let id, _, _): return id
        case .done(let id, _): return id
        case .error(let id, _, _): return id
        }
    }

    var isTerminal: Bool {
        switch self {
        case .done, .error: return true
        default: return false
        }
    }

    private enum CodingKeys: String, CodingKey {
        case type, id, delta, name, args, url, prompt, message, fraction, result, code
        case promptId, promptType, placeholder, options
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)
        let id = try container.decode(String.self, forKey: .id)
        switch type {
        case "text_delta":
            self = .textDelta(id: id, delta: try container.decode(String.self, forKey: .delta))
        case "tool_call":
            self = .toolCall(
                id: id,
                name: try container.decode(String.self, forKey: .name),
                args: try container.decode(JSONValue.self, forKey: .args))
        case "auth_url":
            self = .authURL(id: id, url: try container.decode(String.self, forKey: .url))
        case "auth_prompt":
            self = .authPrompt(
                id: id,
                promptId: try container.decode(String.self, forKey: .promptId),
                prompt: try container.decode(String.self, forKey: .prompt),
                promptType: try container.decode(String.self, forKey: .promptType),
                placeholder: try container.decodeIfPresent(String.self, forKey: .placeholder),
                options: try container.decodeIfPresent([AuthPromptOption].self, forKey: .options))
        case "progress":
            self = .progress(
                id: id,
                message: try container.decode(String.self, forKey: .message),
                fraction: try container.decodeIfPresent(Double.self, forKey: .fraction))
        case "done":
            self = .done(
                id: id, result: try container.decodeIfPresent(JSONValue.self, forKey: .result))
        case "error":
            self = .error(
                id: id,
                code: try container.decode(String.self, forKey: .code),
                message: try container.decode(String.self, forKey: .message))
        default:
            throw DecodingError.dataCorruptedError(
                forKey: .type, in: container, debugDescription: "unknown event type \"\(type)\"")
        }
    }
}
