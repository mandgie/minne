import Foundation

/// What the brain is doing right now on behalf of one answer. Rendered as a
/// subtle line above the assistant's text ("Searching memory…").
struct ChatToolActivity: Identifiable, Equatable, Sendable {
    let id: UUID
    /// Tool name as it comes over the protocol (`search_memory`, `write_page`, …).
    let tool: String
    /// The interesting argument, if the tool has one (query, page path).
    let detail: String?

    init(id: UUID = UUID(), tool: String, detail: String? = nil) {
        self.id = id
        self.tool = tool
        self.detail = detail
    }

    /// Present tense while the turn is still running, past tense once it ended
    /// — the same row stays in the transcript as a record of what was consulted.
    func label(finished: Bool) -> String {
        let verb: String
        switch (tool, finished) {
        case ("search_memory", false): verb = "Searching memory"
        case ("search_memory", true): verb = "Searched memory"
        case ("search_sources", false): verb = "Searching captures"
        case ("search_sources", true): verb = "Searched captures"
        case ("read_page", false): verb = "Reading"
        case ("read_page", true): verb = "Read"
        case ("list_index", false): verb = "Reading the index"
        case ("list_index", true): verb = "Read the index"
        case ("write_page", false): verb = "Updating"
        case ("write_page", true): verb = "Updated"
        case ("append_log", false): verb = "Writing to the log"
        case ("append_log", true): verb = "Wrote to the log"
        default: verb = finished ? "Used \(tool)" : "Using \(tool)"
        }
        guard let detail, !detail.isEmpty else { return finished ? verb : "\(verb)…" }
        return finished ? "\(verb) \(detail)" : "\(verb) \(detail)…"
    }

    /// The argument worth showing for a tool call, or nil for tools that take none.
    static func detail(tool: String, args: JSONValue) -> String? {
        guard let object = args.objectValue else { return nil }
        switch tool {
        case "search_memory", "search_sources":
            return object["query"]?.stringValue.map { "for “\($0)”" }
        case "read_page", "write_page":
            return object["path"]?.stringValue
        default:
            return nil
        }
    }
}

/// One turn in the transcript.
struct ChatMessage: Identifiable, Equatable, Sendable {
    enum Role: Equatable, Sendable { case user, assistant }

    let id: UUID
    let role: Role
    var text: String = ""
    /// Tools the brain reached for while producing this answer, in order.
    var activity: [ChatToolActivity] = []
    /// True while `text_delta`s are still arriving.
    var isStreaming: Bool = false
    /// Set when the turn failed; the view renders it inline with a Retry button.
    var failure: String?
    /// The user stopped the answer; whatever streamed stands.
    var wasStopped: Bool = false
}

/// How the transcript reaches the brain. The real implementation wraps
/// `BrainClient`; tests substitute a scripted double, which is what keeps every
/// rule below (deltas, tool rows, errors, retry, new chat) testable without a
/// running brain or a display.
@MainActor
protocol ChatBackend: AnyObject {
    /// Sends one chat turn. `completion` reports the terminal outcome — the
    /// brain settles `done`/`error` on the request rather than streaming them.
    func sendChat(
        id: String, message: String, newChat: Bool,
        completion: @escaping @MainActor (Result<JSONValue?, any Error>) -> Void)
    /// Cancels the in-flight turn `id`. The turn still completes (aborted).
    func abortChat(id: String)
}

/// The chat window's state and all of its rules. Deltas append, tool calls add
/// activity rows, failures become an inline error with a retry, and a new chat
/// tells the brain to forget the session. `ChatView` only renders this.
@MainActor
@Observable
final class ChatModel {
    private(set) var messages: [ChatMessage] = []
    var draft: String = ""
    /// Bumped when the window wants the input field focused again.
    private(set) var focusRequest = 0

    /// Set by the app once the brain is connected; nil means "no brain", which
    /// surfaces as an inline error rather than a dead send button.
    var backend: (any ChatBackend)?
    /// Injectable so tests can assert on request ids.
    var makeRequestId: () -> String = { UUID().uuidString }

    /// Request id of the turn currently streaming.
    private(set) var activeRequestId: String?
    /// Message the deltas are landing in.
    private var activeMessageId: UUID?
    /// The turn that just settled. Its events can still be in flight — the
    /// terminal event settles the request without waiting for the event stream
    /// to drain — and a tool the model used is worth showing even if the
    /// answer beat it here.
    private var settledRequestId: String?
    private var settledMessageId: UUID?
    /// Prompt of the last failed turn, resent by `retry()`.
    private(set) var retryPrompt: String?
    /// The next turn must tell the brain to reset its session. True at start:
    /// the brain may have served another client (or an earlier window) already.
    private var needsReset = true
    /// Whether the in-flight turn carried the reset, so a failure can restore it.
    private var activeCarriedReset = false

    var isStreaming: Bool { activeRequestId != nil }
    var canSend: Bool {
        !isStreaming && !draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
    var isEmpty: Bool { messages.isEmpty }
    /// Header line: the question that opened the conversation, once asked.
    var title: String {
        messages.first(where: { $0.role == .user })?.text ?? "New chat"
    }

    // MARK: - User actions

    func send() {
        submit(draft)
    }

    /// Appends the turn and starts it. No-op for blank input or while streaming.
    func submit(_ raw: String) {
        let prompt = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !prompt.isEmpty, !isStreaming else { return }
        draft = ""
        retryPrompt = nil
        // Stragglers are only ever expected in the moment after a turn ends;
        // once the user has asked something else, anything still arriving for
        // the old turn is stale.
        settledRequestId = nil
        settledMessageId = nil
        messages.append(ChatMessage(id: UUID(), role: .user, text: prompt))
        let answer = ChatMessage(id: UUID(), role: .assistant, isStreaming: true)
        messages.append(answer)

        guard let backend else {
            finishStreaming(messageId: answer.id) {
                $0.failure = "Minne's brain isn't running yet. It restarts on its own — try again."
            }
            retryPrompt = prompt
            return
        }

        let id = makeRequestId()
        activeRequestId = id
        activeMessageId = answer.id
        activeCarriedReset = needsReset
        needsReset = false
        backend.sendChat(id: id, message: prompt, newChat: activeCarriedReset) {
            [weak self] result in
            self?.complete(id: id, result: result)
        }
    }

    /// Resends the failed turn, dropping the failed exchange first so the
    /// transcript does not accumulate dead ends.
    func retry() {
        guard let prompt = retryPrompt, !isStreaming else { return }
        if let failed = messages.lastIndex(where: { $0.failure != nil }) {
            let start = failed > 0 && messages[failed - 1].role == .user ? failed - 1 : failed
            messages.removeSubrange(start...failed)
        }
        retryPrompt = nil
        submit(prompt)
    }

    /// Empties the transcript and makes the next turn reset the brain's session.
    func newChat() {
        stop()
        activeRequestId = nil
        activeMessageId = nil
        settledRequestId = nil
        settledMessageId = nil
        messages.removeAll()
        draft = ""
        retryPrompt = nil
        needsReset = true
        focusRequest += 1
    }

    /// Asks the brain to stop the in-flight turn. The turn still completes —
    /// partial text is a valid answer — so nothing is torn down here.
    func stop() {
        guard let id = activeRequestId else { return }
        backend?.abortChat(id: id)
    }

    /// The window was shown; the input field should take focus.
    func focusInput() {
        focusRequest += 1
    }

    // MARK: - Brain events

    /// Intermediate events for the in-flight turn — or for the one that just
    /// settled, whose events can still be arriving. Anything for another
    /// request (a login, an older turn) is ignored.
    func apply(_ event: BrainEvent) {
        if event.id == activeRequestId, let messageId = activeMessageId {
            switch event {
            case .textDelta(_, let delta):
                mutate(messageId) { $0.text += delta }
            case .toolCall(_, let name, let args):
                appendActivity(to: messageId, name: name, args: args)
            default:
                break
            }
            return
        }
        // A late tool call still belongs in the transcript; a late delta does
        // not, because `complete` already installed the brain's authoritative
        // text and appending would duplicate it.
        if event.id == settledRequestId, let messageId = settledMessageId,
            case .toolCall(_, let name, let args) = event
        {
            appendActivity(to: messageId, name: name, args: args)
        }
    }

    private func appendActivity(to messageId: UUID, name: String, args: JSONValue) {
        mutate(messageId) {
            $0.activity.append(
                ChatToolActivity(
                    tool: name, detail: ChatToolActivity.detail(tool: name, args: args)))
        }
    }

    /// Terminal outcome of a turn, delivered by the backend.
    private func complete(id: String, result: Result<JSONValue?, any Error>) {
        guard id == activeRequestId, let messageId = activeMessageId else { return }
        activeRequestId = nil
        activeMessageId = nil
        settledRequestId = id
        settledMessageId = messageId
        switch result {
        case .success(let value):
            let outcome = value?.objectValue
            let aborted = outcome?["aborted"] == .bool(true)
            // The brain's copy of what was said is authoritative. Deltas are a
            // stream and the terminal event settles the request directly, so
            // when a turn is answered faster than the UI drains its events the
            // last deltas arrive after this point (and the stream may drop some
            // under a burst). Without this the transcript keeps a truncated
            // answer — the bug that a fast reply exposed and every slow test
            // hid.
            let finalText = outcome?["text"]?.stringValue
            finishStreaming(messageId: messageId) {
                if let finalText, !finalText.isEmpty { $0.text = finalText }
                $0.wasStopped = aborted
            }
        case .failure(let error):
            // The brain only resets its session once a turn reaches the agent,
            // so a failed turn leaves the reset owing.
            if activeCarriedReset { needsReset = true }
            let prompt = messages.last(where: { $0.role == .user })?.text
            finishStreaming(messageId: messageId) { $0.failure = Self.describe(error) }
            retryPrompt = prompt
        }
    }

    /// User-facing wording for a failed turn. Brain error codes are the
    /// contract; their raw messages are developer-facing.
    static func describe(_ error: any Error) -> String {
        guard let error = error as? BrainClientError else { return "\(error)" }
        switch error {
        case .brain(let code, let message):
            switch code {
            case "not_authenticated":
                return "You're not signed in to an AI provider yet — sign in from the menu bar."
            case "busy":
                return "Another answer is still streaming. Try again in a moment."
            case "aborted":
                return "The answer was stopped."
            default:
                return message
            }
        case .notRunning, .brainExited:
            return "Minne's brain isn't running. It restarts on its own — try again."
        case .handshakeFailed(let reason):
            return "Minne's brain could not be reached: \(reason)"
        }
    }

    // MARK: - Transcript editing

    private func mutate(_ id: UUID, _ change: (inout ChatMessage) -> Void) {
        guard let index = messages.firstIndex(where: { $0.id == id }) else { return }
        change(&messages[index])
    }

    private func finishStreaming(messageId: UUID, _ change: (inout ChatMessage) -> Void) {
        mutate(messageId) {
            $0.isStreaming = false
            change(&$0)
        }
    }
}

/// `ChatBackend` over the real brain. Holds no reference back to the model:
/// each turn carries its own completion.
@MainActor
final class BrainChatBackend: ChatBackend {
    private let client: BrainClient

    init(client: BrainClient) {
        self.client = client
    }

    func sendChat(
        id: String, message: String, newChat: Bool,
        completion: @escaping @MainActor (Result<JSONValue?, any Error>) -> Void
    ) {
        Task {
            do {
                let result = try await client.request(
                    .chat(id: id, message: message, newChat: newChat ? true : nil))
                completion(.success(result))
            } catch {
                completion(.failure(error))
            }
        }
    }

    func abortChat(id: String) {
        Task {
            do {
                try await client.request(.abort(id: UUID().uuidString, targetId: id))
            } catch {
                BrainClient.log("chat abort failed: \(error)")
            }
        }
    }
}
