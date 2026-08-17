import XCTest

@testable import Minne

/// Scripted `ChatBackend`: records what the model asked for and lets the test
/// settle each turn whenever it likes. No brain, no window, no display.
@MainActor
private final class FakeChatBackend: ChatBackend {
    struct Sent: Equatable {
        let id: String
        let message: String
        let newChat: Bool
    }

    private(set) var sent: [Sent] = []
    private(set) var aborted: [String] = []
    private var completions: [String: (Result<JSONValue?, any Error>) -> Void] = [:]

    func sendChat(
        id: String, message: String, newChat: Bool,
        completion: @escaping @MainActor (Result<JSONValue?, any Error>) -> Void
    ) {
        sent.append(Sent(id: id, message: message, newChat: newChat))
        completions[id] = completion
    }

    func abortChat(id: String) {
        aborted.append(id)
    }

    func finish(_ id: String, result: JSONValue? = nil) {
        completions.removeValue(forKey: id)?(.success(result))
    }

    func fail(_ id: String, with error: any Error) {
        completions.removeValue(forKey: id)?(.failure(error))
    }
}

@MainActor
final class ChatModelTests: XCTestCase {
    private var backend = FakeChatBackend()
    private var model = ChatModel()
    private var issued = 0

    override func setUp() async throws {
        backend = FakeChatBackend()
        model = ChatModel()
        model.backend = backend
        issued = 0
        model.makeRequestId = { [self] in
            issued += 1
            return "req\(issued)"
        }
    }

    // MARK: - Sending

    func testSubmitAppendsTheTurnAndStartsStreaming() {
        model.submit("  what did I do yesterday?  ")
        XCTAssertEqual(
            backend.sent, [.init(id: "req1", message: "what did I do yesterday?", newChat: true)])
        XCTAssertEqual(model.messages.count, 2)
        XCTAssertEqual(model.messages[0].role, .user)
        XCTAssertEqual(model.messages[0].text, "what did I do yesterday?")
        XCTAssertEqual(model.messages[1].role, .assistant)
        XCTAssertTrue(model.messages[1].isStreaming)
        XCTAssertTrue(model.isStreaming)
        XCTAssertEqual(model.draft, "", "sending clears the composer")
    }

    func testBlankInputAndSecondTurnWhileStreamingAreIgnored() {
        model.submit("   \n ")
        XCTAssertTrue(model.messages.isEmpty)
        XCTAssertEqual(backend.sent.count, 0)

        model.submit("first")
        model.submit("second")
        XCTAssertEqual(backend.sent.count, 1, "one turn at a time — the brain answers busy")
        XCTAssertEqual(model.messages.count, 2)
    }

    func testSendUsesTheDraftAndCanSendGuardsIt() {
        XCTAssertFalse(model.canSend)
        model.draft = "  "
        XCTAssertFalse(model.canSend)
        model.draft = "hello"
        XCTAssertTrue(model.canSend)
        model.send()
        XCTAssertEqual(backend.sent.first?.message, "hello")
        XCTAssertFalse(model.canSend, "no sending while an answer streams")
    }

    // MARK: - Streaming

    func testDeltasAppendToTheInFlightMessage() {
        model.submit("hi")
        model.apply(.textDelta(id: "req1", delta: "Hel"))
        model.apply(.textDelta(id: "req1", delta: "lo."))
        XCTAssertEqual(model.messages.last?.text, "Hello.")
        XCTAssertTrue(model.messages.last?.isStreaming == true)

        backend.finish("req1")
        XCTAssertEqual(model.messages.last?.text, "Hello.")
        XCTAssertFalse(model.messages.last?.isStreaming == true)
        XCTAssertFalse(model.isStreaming)
    }

    func testEventsForOtherRequestsAreIgnored() {
        model.submit("hi")
        model.apply(.textDelta(id: "some-login", delta: "nope"))
        model.apply(.textDelta(id: "req1", delta: "yes"))
        XCTAssertEqual(model.messages.last?.text, "yes")
    }

    func testToolCallsBecomeActivityRows() {
        model.submit("what did I do yesterday?")
        model.apply(
            .toolCall(
                id: "req1", name: "search_memory",
                args: .object(["query": .string("yesterday")])))
        model.apply(
            .toolCall(
                id: "req1", name: "read_page", args: .object(["path": .string("wiki/oslo.md")])))
        let activity = model.messages.last?.activity ?? []
        XCTAssertEqual(activity.map(\.tool), ["search_memory", "read_page"])
        XCTAssertEqual(activity.first?.label(finished: false), "Searching memory for “yesterday”…")
        XCTAssertEqual(activity.last?.label(finished: false), "Reading wiki/oslo.md…")

        backend.finish("req1")
        XCTAssertEqual(
            model.messages.last?.activity.first?.label(finished: true),
            "Searched memory for “yesterday”")
    }

    func testUnknownToolStillGetsAReadableLabel() {
        let activity = ChatToolActivity(tool: "count_beans")
        XCTAssertEqual(activity.label(finished: false), "Using count_beans…")
        XCTAssertEqual(activity.label(finished: true), "Used count_beans")
    }

    // MARK: - Reconciliation (the terminal event does not wait for the deltas)

    func testATurnThatSettlesWhileDeltasAreStillQueuedKeepsTheWholeAnswer() {
        // A fast reply: the brain answers and settles the request before the
        // app has drained more than the first delta or two off the event
        // stream. The transcript must still end up with the full text.
        model.submit("What did I do yesterday?")
        model.apply(.textDelta(id: "req1", delta: "Yesterday you"))
        backend.finish("req1", result: .object(["text": .string("Yesterday you worked on Minne.")]))
        XCTAssertEqual(model.messages.last?.text, "Yesterday you worked on Minne.")

        // The stragglers land after the turn is over and must not double up.
        model.apply(.textDelta(id: "req1", delta: " worked on Minne."))
        XCTAssertEqual(model.messages.last?.text, "Yesterday you worked on Minne.")
        XCTAssertFalse(model.messages.last?.isStreaming == true)
    }

    func testAToolCallThatArrivesAfterTheAnswerIsStillShown() {
        model.submit("What did I do yesterday?")
        backend.finish("req1", result: .object(["text": .string("You were in Oslo.")]))
        model.apply(
            .toolCall(
                id: "req1", name: "search_memory", args: .object(["query": .string("yesterday")])))
        XCTAssertEqual(
            model.messages.last?.activity.map(\.tool), ["search_memory"],
            "which memory was consulted is part of the finished answer")
        XCTAssertEqual(model.messages.last?.text, "You were in Oslo.")
    }

    func testEventsFromASettledTurnStopAtTheNextTurn() {
        model.submit("one")
        backend.finish("req1", result: .object(["text": .string("first")]))
        model.submit("two")
        // req1 is two turns back now; its stragglers belong nowhere.
        model.apply(.toolCall(id: "req1", name: "search_memory", args: .object([:])))
        XCTAssertTrue(model.messages.allSatisfy { $0.activity.isEmpty })
    }

    func testAnOutcomeWithoutTextLeavesTheStreamedTextAlone() {
        // Older brains (and any future terminal event that omits it) must not
        // blank the answer the deltas already built.
        model.submit("hi")
        model.apply(.textDelta(id: "req1", delta: "Hello."))
        backend.finish("req1", result: .object(["model": .string("mock-model")]))
        XCTAssertEqual(model.messages.last?.text, "Hello.")
    }

    func testStoppedTurnKeepsItsPartialText() {
        model.submit("SLOW one")
        model.apply(.textDelta(id: "req1", delta: "half an ans"))
        model.stop()
        XCTAssertEqual(backend.aborted, ["req1"])
        backend.finish("req1", result: .object(["aborted": .bool(true)]))
        XCTAssertEqual(model.messages.last?.text, "half an ans")
        XCTAssertTrue(model.messages.last?.wasStopped == true)
        XCTAssertNil(model.messages.last?.failure)
    }

    // MARK: - Sessions

    func testOnlyTheFirstTurnResetsTheBrainsSession() {
        model.submit("one")
        backend.finish("req1")
        model.submit("two")
        XCTAssertEqual(backend.sent.map(\.newChat), [true, false])
    }

    func testNewChatClearsTheTranscriptAndResetsTheNextTurn() {
        model.submit("one")
        backend.finish("req1")
        model.newChat()
        XCTAssertTrue(model.messages.isEmpty)
        model.submit("two")
        XCTAssertEqual(backend.sent.map(\.newChat), [true, true])
    }

    func testNewChatWhileStreamingAbortsAndDropsTheAnswer() {
        model.submit("one")
        model.apply(.textDelta(id: "req1", delta: "partial"))
        model.newChat()
        XCTAssertEqual(backend.aborted, ["req1"])
        XCTAssertTrue(model.messages.isEmpty)
        XCTAssertFalse(model.isStreaming)
        // The abandoned turn's outcome must not resurrect anything.
        backend.finish("req1")
        XCTAssertTrue(model.messages.isEmpty)
    }

    // MARK: - Errors and retry

    func testProviderErrorRendersInlineAndRetryResendsThePrompt() {
        model.submit("who is Ada?")
        backend.fail(
            "req1",
            with: BrainClientError.brain(code: "provider_error", message: "upstream exploded"))
        XCTAssertEqual(model.messages.count, 2)
        XCTAssertEqual(model.messages.last?.failure, "upstream exploded")
        XCTAssertFalse(model.isStreaming)
        XCTAssertEqual(model.retryPrompt, "who is Ada?")

        model.retry()
        XCTAssertEqual(backend.sent.map(\.message), ["who is Ada?", "who is Ada?"])
        XCTAssertEqual(model.messages.count, 2, "the failed exchange is replaced, not stacked")
        XCTAssertNil(model.messages.last?.failure)
        XCTAssertTrue(model.messages.last?.isStreaming == true)
    }

    func testAFailedFirstTurnStillOwesTheSessionReset() {
        model.submit("one")
        backend.fail(
            "req1",
            with: BrainClientError.brain(code: "not_authenticated", message: "no credential"))
        model.retry()
        XCTAssertEqual(
            backend.sent.map(\.newChat), [true, true],
            "the brain only resets once a turn reaches the agent")
    }

    func testRetryWithoutAFailureDoesNothing() {
        model.submit("one")
        backend.finish("req1")
        model.retry()
        XCTAssertEqual(backend.sent.count, 1)
    }

    func testMissingBrainFailsTheTurnInline() {
        model.backend = nil
        model.submit("hello")
        XCTAssertEqual(model.messages.count, 2)
        XCTAssertEqual(
            model.messages.last?.failure,
            "Minne's brain isn't running yet. It restarts on its own — try again.")
        XCTAssertFalse(model.isStreaming)
        XCTAssertEqual(model.retryPrompt, "hello")
    }

    func testErrorWording() {
        XCTAssertEqual(
            ChatModel.describe(BrainClientError.brain(code: "not_authenticated", message: "raw")),
            "You're not signed in to an AI provider yet — sign in from the menu bar.")
        XCTAssertEqual(
            ChatModel.describe(BrainClientError.brain(code: "busy", message: "raw")),
            "Another answer is still streaming. Try again in a moment.")
        XCTAssertEqual(
            ChatModel.describe(
                BrainClientError.brain(code: "provider_error", message: "429 slow down")),
            "429 slow down", "developer detail is the best wording we have for an upstream failure")
        XCTAssertEqual(
            ChatModel.describe(BrainClientError.notRunning),
            "Minne's brain isn't running. It restarts on its own — try again.")
    }

    func testTitleIsTheOpeningQuestion() {
        XCTAssertEqual(model.title, "New chat")
        model.submit("what did I do yesterday?")
        backend.finish("req1")
        model.submit("and the day before?")
        XCTAssertEqual(model.title, "what did I do yesterday?")
        model.newChat()
        XCTAssertEqual(model.title, "New chat")
    }

    // MARK: - Focus

    func testShowingTheWindowRequestsFocus() {
        let before = model.focusRequest
        model.focusInput()
        XCTAssertEqual(model.focusRequest, before + 1)
    }
}
