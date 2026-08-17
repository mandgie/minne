import AppKit
import XCTest

@testable import Minne

/// Scripted caret: what the AX layer would have found.
@MainActor
private final class FakeCaretLocator: CaretLocating {
    var target: CaretTarget? = CaretTarget(
        bundleIdentifier: "com.apple.TextEdit", appName: "TextEdit",
        anchor: CaretAnchor(rect: CGRect(x: 100, y: 200, width: 1, height: 18), source: .caret),
        field: FieldSnapshot(
            text: "", selection: "", selectedRange: NSRange(location: 0, length: 0),
            windowText: "From: Ingrid\nCan you review the doc?", windowTitle: "Untitled"))
    private(set) var calls = 0

    func locateCaret() -> CaretTarget? {
        calls += 1
        return target
    }

    /// Replaces the field half of the scripted target, keeping the rest.
    func setField(_ field: FieldSnapshot) {
        guard let existing = target else { return }
        target = CaretTarget(
            bundleIdentifier: existing.bundleIdentifier, appName: existing.appName,
            anchor: existing.anchor, field: field, isWebContent: existing.isWebContent)
    }

    /// Points the scripted target at another app, and says whether its focused
    /// element sits inside a web area.
    func setApp(_ bundleIdentifier: String, name: String, isWebContent: Bool) {
        guard let existing = target else { return }
        target = CaretTarget(
            bundleIdentifier: bundleIdentifier, appName: name, anchor: existing.anchor,
            field: existing.field, isWebContent: isWebContent)
    }
}

@MainActor
private final class FakeOverlay: MinneKeyPresenting {
    private(set) var presented: [CaretTarget] = []
    private(set) var states: [MinneKeyOverlayState] = []
    private(set) var dismissals = 0
    var isPresenting = false
    var state: MinneKeyOverlayState?
    var onAction: (@MainActor (MinneKeyAction) -> Void)?
    /// Screen rectangle the overlay claims, in Quartz coordinates.
    var bounds = CGRect(x: 100, y: 200, width: 240, height: 44)

    func present(_ target: CaretTarget, state: MinneKeyOverlayState) {
        presented.append(target)
        states.append(state)
        self.state = state
        isPresenting = true
    }

    func update(_ state: MinneKeyOverlayState) {
        guard isPresenting else { return }
        states.append(state)
        self.state = state
    }

    func dismiss() {
        dismissals += 1
        isPresenting = false
        state = nil
    }

    func contains(quartzPoint: CGPoint) -> Bool {
        isPresenting && bounds.contains(quartzPoint)
    }
}

/// Stands in for the `CGEventTap`, so the controller's wiring is exercised
/// through the same three callbacks the real one uses.
@MainActor
private final class FakeTap: MinneKeyTapping {
    var onTap: (@MainActor () -> Void)?
    var onCommand: (@MainActor (MinneKeyCommand) -> Bool)?
    var onClick: (@MainActor (CGPoint) -> Void)?
    private(set) var invalidations = 0

    func invalidate() { invalidations += 1 }
}

/// Stands in for Accessibility, and keeps a field of its own so an edit and its
/// undo can be checked against the text they claim to produce.
@MainActor
private final class FakeFieldWriter: FieldWriting {
    private(set) var edits: [FieldEdit] = []
    /// The target each edit was applied to — which path it was allowed to take
    /// and how the span was to be selected.
    private(set) var targets: [InsertionTarget] = []
    private(set) var reverts: [(edit: FieldEdit, method: InsertionMethod)] = []
    /// Text the fake field holds, updated by every applied edit.
    private(set) var contents = ""
    var method: InsertionMethod? = .selectedText
    var revertSucceeds = true
    /// A paste the app quietly ignored: the writer reports success (the
    /// keystroke went out) but the field never changes.
    var pasteIsIgnored = false

    func apply(_ edit: FieldEdit, in target: InsertionTarget) -> InsertionMethod? {
        guard let method else { return nil }
        edits.append(edit)
        targets.append(target)
        if !pasteIsIgnored { contents = edit.applied(to: target.fieldText) ?? target.fieldText }
        return method
    }

    func revert(_ edit: FieldEdit, method: InsertionMethod, in target: InsertionTarget) -> Bool {
        guard revertSucceeds else { return false }
        reverts.append((edit, method))
        contents = edit.applied(to: target.fieldText) ?? target.fieldText
        return true
    }

    func currentText(of handle: FocusedFieldHandle?) -> String? { contents }
}

@MainActor
private final class FakePasteboard: PasteboardHolding {
    private(set) var contents = PasteboardContents(items: [])
    private(set) var strings: [String] = []

    func read() -> PasteboardContents { contents }

    func write(string: String) {
        strings.append(string)
        contents = PasteboardContents(items: [["public.utf8-plain-text": Data(string.utf8)]])
    }

    func write(_ contents: PasteboardContents) { self.contents = contents }
}

@MainActor
private final class FakeDraftBackend: DraftBackend {
    private(set) var requests: [(id: String, context: DraftRequestContext)] = []
    private(set) var aborted: [String] = []
    private var completions: [String: @MainActor (Result<DraftReply, any Error>) -> Void] = [:]

    func draft(
        id: String, context: DraftRequestContext,
        completion: @escaping @MainActor (Result<DraftReply, any Error>) -> Void
    ) {
        requests.append((id, context))
        completions[id] = completion
    }

    func abortDraft(id: String) { aborted.append(id) }

    /// Answers the request the controller is waiting on.
    func finish(_ id: String, with reply: DraftReply) {
        completions.removeValue(forKey: id)?(.success(reply))
    }

    func fail(_ id: String, with error: any Error) {
        completions.removeValue(forKey: id)?(.failure(error))
    }
}

/// When the Minne key wakes up, what it asks for, what it does with the answer,
/// and what puts it away again.
@MainActor
final class MinneKeyControllerTests: XCTestCase {
    private var locator: FakeCaretLocator!
    private var overlay: FakeOverlay!
    private var writer: FakeFieldWriter!
    private var pasteboard: FakePasteboard!
    private var backend: FakeDraftBackend!
    private var taps: [FakeTap]!
    /// Work the controller has asked to happen later, and has not had run yet.
    private var scheduled: [(delay: TimeInterval, work: @MainActor () -> Void)] = []
    /// Set to false to simulate a tap that cannot be created.
    private var tapCanBeCreated = true
    /// Held for the length of the test: the tap's callbacks capture the
    /// controller weakly, so a released one would silently ignore every event.
    private var controller: MinneKeyController?

    override func setUp() async throws {
        locator = FakeCaretLocator()
        overlay = FakeOverlay()
        writer = FakeFieldWriter()
        pasteboard = FakePasteboard()
        backend = FakeDraftBackend()
        taps = []
        scheduled = []
        tapCanBeCreated = true
        controller = nil
    }

    override func tearDown() async throws {
        controller = nil
    }

    private func makeController(
        enabled: Bool = true, permission: CapturePermissionState = .granted,
        blacklist: CaptureBlacklist = CaptureBlacklist()
    ) -> MinneKeyController {
        let controller = MinneKeyController(
            locator: locator, presenter: overlay, writer: writer, pasteboard: pasteboard,
            enabled: enabled, permission: permission, blacklist: blacklist,
            makeTap: { [weak self] in
                guard let self, self.tapCanBeCreated else { return nil }
                let tap = FakeTap()
                self.taps.append(tap)
                return tap
            },
            makeRequestId: { "draft-1" },
            schedule: { [weak self] delay, work in self?.scheduled.append((delay, work)) })
        controller.backend = backend
        self.controller = controller
        return controller
    }

    private var tap: FakeTap { taps.last! }

    /// Runs everything the controller has scheduled, the way the run loop would.
    private func runScheduledWork() {
        let due = scheduled
        scheduled = []
        for item in due { item.work() }
    }

    // MARK: - When the tap exists

    func testTheTapIsInstalledWhenEnabledAndTrusted() {
        let controller = makeController()
        XCTAssertTrue(controller.isActive)
        XCTAssertEqual(taps.count, 1)
    }

    func testNoTapWithoutAccessibility() {
        let controller = makeController(permission: .missing)
        XCTAssertFalse(controller.isActive)
        XCTAssertTrue(taps.isEmpty)
    }

    func testNoTapWhenTurnedOffInSettings() {
        let controller = makeController(enabled: false)
        XCTAssertFalse(controller.isActive)
    }

    /// The setting takes effect immediately, both ways — no relaunch.
    func testTogglingTheSettingInstallsAndRemovesTheTapLive() {
        let controller = makeController(enabled: false)
        var actives: [Bool] = []
        controller.onActiveChange = { actives.append($0) }

        controller.setEnabled(true)
        XCTAssertTrue(controller.isActive)
        controller.setEnabled(false)
        XCTAssertFalse(controller.isActive)
        XCTAssertEqual(tap.invalidations, 1)
        XCTAssertEqual(actives, [true, false])
    }

    func testAGrantLandingStartsTheKey() {
        let controller = makeController(permission: .missing)
        XCTAssertFalse(controller.isActive)
        controller.update(permission: .granted)
        XCTAssertTrue(controller.isActive)
    }

    func testLosingTheGrantStopsTheKeyAndHidesTheOverlay() {
        let controller = makeController()
        tap.onTap?()
        XCTAssertTrue(overlay.isPresenting)

        controller.update(permission: .missing)
        XCTAssertFalse(controller.isActive)
        XCTAssertFalse(overlay.isPresenting)
    }

    /// A tap that will not install (Accessibility revoked between the check and
    /// the call) must leave the controller honestly inactive rather than
    /// claiming a key that does nothing.
    func testAFailedInstallationReportsInactive() {
        tapCanBeCreated = false
        let controller = makeController()
        XCTAssertFalse(controller.isActive)
    }

    // MARK: - Waking up

    func testATapShowsTheOverlayAtTheCaretAndAsksForADraft() {
        let controller = makeController()
        tap.onTap?()
        XCTAssertEqual(overlay.presented.count, 1)
        XCTAssertEqual(overlay.presented.first?.anchor.rect.origin, CGPoint(x: 100, y: 200))
        XCTAssertEqual(overlay.states.first, .working(.infer))
        XCTAssertEqual(backend.requests.count, 1)
        XCTAssertTrue(controller.isActive)
    }

    func testNothingHappensWhenNoTextFieldIsFocused() {
        // Also the password-field case: the locator refuses to name a target.
        locator.target = nil
        makeControllerAndTap()
        XCTAssertTrue(overlay.presented.isEmpty)
        XCTAssertFalse(overlay.isPresenting)
        XCTAssertTrue(backend.requests.isEmpty)
    }

    /// An app whose contents may not become memory may not become a prompt
    /// either — the key obeys the capture blacklist.
    func testABlacklistedAppGetsNoDraft() {
        let controller = makeController(
            blacklist: CaptureBlacklist(bundleIdentifiers: ["com.apple.TextEdit"]))
        tap.onTap?()
        XCTAssertFalse(overlay.isPresenting)
        XCTAssertTrue(backend.requests.isEmpty)
        XCTAssertTrue(controller.isActive)
    }

    func testASecondTapDismisses() {
        makeControllerAndTap()
        tap.onTap?()
        XCTAssertFalse(overlay.isPresenting)
        XCTAssertEqual(overlay.presented.count, 1)
        // The caret is not looked up again just to close the overlay.
        XCTAssertEqual(locator.calls, 1)
    }

    // MARK: - What the brain is asked for

    func testTheDraftRequestCarriesWhatWasReadAtPressTime() {
        locator.setField(
            FieldSnapshot(
                text: "decline politely", selection: "",
                selectedRange: NSRange(location: 16, length: 0),
                windowText: "From: Ingrid Berg", windowTitle: "Re: Thursday"))
        makeControllerAndTap()

        let context = backend.requests.first?.context
        XCTAssertEqual(context?.mode, "instruction")
        XCTAssertEqual(context?.fieldText, "decline politely")
        XCTAssertEqual(context?.windowText, "From: Ingrid Berg")
        XCTAssertEqual(context?.windowTitle, "Re: Thursday")
        XCTAssertEqual(context?.app, "TextEdit")
        XCTAssertEqual(context?.bundleId, "com.apple.TextEdit")
    }

    /// The selection is the subject in rewrite mode and noise everywhere else,
    /// so only that mode sends it.
    func testOnlyRewriteModeSendsTheSelection() {
        locator.setField(
            FieldSnapshot(
                text: "hi — i cant make it", selection: "i cant make it",
                selectedRange: NSRange(location: 5, length: 14)))
        makeControllerAndTap()
        XCTAssertEqual(backend.requests.first?.context.mode, "rewrite")
        XCTAssertEqual(backend.requests.first?.context.selection, "i cant make it")
    }

    func testToolActivityIsShownWhileTheDraftIsBeingWritten() {
        let controller = makeControllerAndTap()
        controller.toolStarted(requestId: "draft-1", name: "search_memory")
        XCTAssertEqual(overlay.states.last, .consulting(.infer, tool: "search_memory"))
        // A tool call belonging to a chat turn is not this overlay's business.
        controller.toolStarted(requestId: "chat-9", name: "write_page")
        XCTAssertEqual(overlay.states.last, .consulting(.infer, tool: "search_memory"))
    }

    func testTheDraftIsPreviewedRatherThanInserted() {
        makeControllerAndTap()
        backend.finish("draft-1", with: DraftReply(text: "Thursday works."))
        XCTAssertEqual(overlay.states.last, .result("Thursday works."))
        XCTAssertTrue(writer.edits.isEmpty, "the field must not be touched before the user accepts")
    }

    /// An answer to a press the user has already walked away from must never
    /// reach a text field.
    func testADraftThatArrivesAfterDismissalIsDropped() {
        let controller = makeControllerAndTap()
        controller.dismiss()
        backend.finish("draft-1", with: DraftReply(text: "too late"))
        XCTAssertTrue(writer.edits.isEmpty)
        XCTAssertFalse(overlay.isPresenting)
    }

    func testAFailedDraftIsExplainedAtTheCaret() {
        makeControllerAndTap()
        backend.fail(
            "draft-1",
            with: BrainClientError.brain(code: "not_authenticated", message: "sign in first"))
        XCTAssertEqual(overlay.states.last, .failed("Sign in to a provider in Settings first"))
        XCTAssertTrue(writer.edits.isEmpty)
    }

    func testDismissingWhileDraftingCancelsTheRequest() {
        let controller = makeControllerAndTap()
        controller.dismiss()
        XCTAssertEqual(backend.aborted, ["draft-1"])
    }

    // MARK: - Insertion

    func testInsertingReplacesTheInstructionWithTheDraft() {
        locator.setField(FieldSnapshot(text: "decline politely"))
        let controller = makeControllerAndTap()
        backend.finish("draft-1", with: DraftReply(text: "Sorry, I can't make Thursday."))
        controller.insert()

        XCTAssertEqual(writer.edits.count, 1)
        XCTAssertEqual(writer.edits.first?.range, NSRange(location: 0, length: 16))
        XCTAssertEqual(writer.contents, "Sorry, I can't make Thursday.")
        XCTAssertEqual(overlay.states.last, .inserted(.selectedText))
    }

    func testInsertingRewritesOnlyTheSelection() {
        locator.setField(
            FieldSnapshot(
                text: "hi — i cant make it", selection: "i cant make it",
                selectedRange: NSRange(location: 5, length: 14)))
        let controller = makeControllerAndTap()
        backend.finish("draft-1", with: DraftReply(text: "I can't make it"))
        controller.insert()
        XCTAssertEqual(writer.contents, "hi — I can't make it")
    }

    /// A field holding only whitespace is still inferred — and the user's blank
    /// lines are left where they put them, the draft going in at the caret.
    func testInferInsertsAtTheCaretWithoutDisturbingTheField() {
        locator.setField(
            FieldSnapshot(text: "\n\n", selectedRange: NSRange(location: 2, length: 0)))
        let controller = makeControllerAndTap()
        XCTAssertEqual(backend.requests.first?.context.mode, "infer")
        backend.finish("draft-1", with: DraftReply(text: "Thursday works."))
        controller.insert()
        XCTAssertEqual(writer.contents, "\n\nThursday works.")
    }

    func testAnAppThatWillNotTakeTheDraftSaysSo() {
        writer.method = nil
        let controller = makeControllerAndTap()
        backend.finish("draft-1", with: DraftReply(text: "Thursday works."))
        controller.insert()
        XCTAssertEqual(
            overlay.states.last, .failed("Minne could not write into TextEdit — use Copy"))
    }

    func testInsertingTwiceIsNotPossible() {
        let controller = makeControllerAndTap()
        backend.finish("draft-1", with: DraftReply(text: "Thursday works."))
        controller.insert()
        controller.insert()
        XCTAssertEqual(writer.edits.count, 1)
    }

    func testCopyPutsTheDraftOnThePasteboardWithoutTouchingTheField() {
        let controller = makeControllerAndTap()
        backend.finish("draft-1", with: DraftReply(text: "Thursday works."))
        controller.copyDraft()
        XCTAssertEqual(pasteboard.strings, ["Thursday works."])
        XCTAssertTrue(writer.edits.isEmpty)
    }

    // MARK: - Which path the draft takes in

    /// The bug this policy exists for: in a browser an Accessibility write
    /// lands in the DOM, reads back perfectly, and is erased by the editor's
    /// next re-render. The paste goes through the app's own input pipeline, so
    /// the framework owns the text and it survives.
    func testWebContentGetsThePasteboardAndNoAXWriteIsAttempted() {
        locator.setApp("com.google.Chrome", name: "Google Chrome", isWebContent: true)
        let controller = makeControllerAndTap()
        backend.finish("draft-1", with: DraftReply(text: "Thursday works."))
        controller.insert()
        XCTAssertEqual(writer.targets.last?.strategy, .pasteboard)
    }

    func testANativeAppKeepsTheAccessibilityPath() {
        let controller = makeControllerAndTap()
        backend.finish("draft-1", with: DraftReply(text: "Thursday works."))
        controller.insert()
        XCTAssertEqual(writer.targets.last?.strategy, .accessibilityFirst)
    }

    /// An app that will not show its ancestors still gets the right path when
    /// it is a browser we know by name.
    func testABrowserThatNamesNoWebAreaStillGetsThePasteboard() {
        locator.setApp("com.apple.Safari", name: "Safari", isWebContent: false)
        let controller = makeControllerAndTap()
        backend.finish("draft-1", with: DraftReply(text: "Thursday works."))
        controller.insert()
        XCTAssertEqual(writer.targets.last?.strategy, .pasteboard)
    }

    /// The paste replaces what is selected, so each mode has to arrive with the
    /// right thing selected: the user's own selection, the whole editor, or
    /// nothing at all when the draft goes in at the caret.
    func testInstructionModeSelectsTheWholeEditorBeforePasting() {
        locator.setApp("com.google.Chrome", name: "Google Chrome", isWebContent: true)
        locator.setField(
            FieldSnapshot(text: "decline politely", selectedRange: NSRange(location: 16, length: 0))
        )
        let controller = makeControllerAndTap()
        backend.finish("draft-1", with: DraftReply(text: "Sorry, not Thursday."))
        controller.insert()
        XCTAssertEqual(writer.targets.last?.selection, .selectAll)
    }

    func testRewriteModePastesOverTheUsersOwnSelection() {
        locator.setApp("com.google.Chrome", name: "Google Chrome", isWebContent: true)
        locator.setField(
            FieldSnapshot(
                text: "hi — i cant make it", selection: "i cant make it",
                selectedRange: NSRange(location: 5, length: 14)))
        let controller = makeControllerAndTap()
        backend.finish("draft-1", with: DraftReply(text: "I can't make it"))
        controller.insert()
        XCTAssertEqual(writer.targets.last?.selection, .asIs)
    }

    func testInferModePastesAtTheCaretWithNothingSelected() {
        locator.setApp("com.google.Chrome", name: "Google Chrome", isWebContent: true)
        let controller = makeControllerAndTap()
        backend.finish("draft-1", with: DraftReply(text: "Thursday works."))
        controller.insert()
        XCTAssertEqual(writer.targets.last?.selection, .asIs)
    }

    // MARK: - The overlay's own life

    /// The user asked for text in their field and now has it; the panel has
    /// nothing left to say and closes itself.
    func testTheOverlayClosesItselfAfterASuccessfulInsertion() {
        let controller = makeControllerAndTap()
        backend.finish("draft-1", with: DraftReply(text: "Thursday works."))
        controller.insert()
        XCTAssertTrue(overlay.isPresenting, "the confirmation is shown before it closes")
        XCTAssertEqual(overlay.states.last, .inserted(.selectedText))

        runScheduledWork()
        XCTAssertFalse(overlay.isPresenting)
    }

    /// The opposite rule, and the reason the close is not unconditional: an
    /// insertion that did not work has to stay on screen and say so.
    func testAFailedInsertionKeepsTheOverlayUpWithAnError() {
        writer.method = nil
        let controller = makeControllerAndTap()
        backend.finish("draft-1", with: DraftReply(text: "Thursday works."))
        controller.insert()
        runScheduledWork()
        XCTAssertTrue(overlay.isPresenting)
        XCTAssertEqual(
            overlay.states.last, .failed("Minne could not write into TextEdit — use Copy"))
    }

    /// A paste is a keystroke: the app may simply never handle it, and nothing
    /// can be read back at the moment it is posted. The check happens a moment
    /// later, and turns silence into a message.
    func testAPasteTheAppIgnoredBecomesAVisibleError() {
        locator.setApp("com.google.Chrome", name: "Google Chrome", isWebContent: true)
        writer.method = .pasteboard
        writer.pasteIsIgnored = true
        let controller = makeControllerAndTap()
        backend.finish("draft-1", with: DraftReply(text: "Thursday works."))
        controller.insert()
        XCTAssertEqual(overlay.states.last, .inserted(.pasteboard))

        runScheduledWork()
        XCTAssertTrue(overlay.isPresenting)
        XCTAssertEqual(
            overlay.states.last, .failed("Google Chrome did not take the draft — use Copy"))
    }

    func testAPasteThatLandedIsNotSecondGuessed() {
        locator.setApp("com.google.Chrome", name: "Google Chrome", isWebContent: true)
        writer.method = .pasteboard
        let controller = makeControllerAndTap()
        backend.finish("draft-1", with: DraftReply(text: "Thursday works."))
        controller.insert()
        runScheduledWork()
        XCTAssertFalse(overlay.isPresenting)
        XCTAssertEqual(writer.edits.count, 1, "a paste is never attempted twice")
    }

    func testRetryAsksForTheDraftAgainAfterTheBrainFailed() {
        let controller = makeControllerAndTap()
        backend.fail("draft-1", with: BrainClientError.brain(code: "busy", message: "busy"))
        XCTAssertEqual(overlay.states.last, .failed("Minne is already writing a draft"))

        controller.retry()
        XCTAssertEqual(backend.requests.count, 2)
        XCTAssertEqual(overlay.states.last, .working(.infer))
    }

    func testRetryInsertsAgainWhenTheDraftIsAlreadyWritten() {
        writer.method = nil
        let controller = makeControllerAndTap()
        backend.finish("draft-1", with: DraftReply(text: "Thursday works."))
        controller.insert()
        XCTAssertEqual(writer.edits.count, 0)

        writer.method = .selectedText
        controller.retry()
        XCTAssertEqual(writer.edits.count, 1)
        XCTAssertEqual(overlay.states.last, .inserted(.selectedText))
        XCTAssertEqual(backend.requests.count, 1, "the draft is not asked for twice")
    }

    // MARK: - Undo

    func testUndoPutsTheFieldBackExactlyAsItWas() {
        locator.setField(FieldSnapshot(text: "decline politely"))
        let controller = makeControllerAndTap()
        backend.finish("draft-1", with: DraftReply(text: "Sorry, I can't make Thursday."))
        controller.insert()
        controller.undo()

        XCTAssertEqual(writer.contents, "decline politely")
        XCTAssertEqual(overlay.states.last, .undone)
    }

    func testUndoOfARewriteRestoresOnlyTheSelection() {
        locator.setField(
            FieldSnapshot(
                text: "hi — i cant make it", selection: "i cant make it",
                selectedRange: NSRange(location: 5, length: 14)))
        let controller = makeControllerAndTap()
        backend.finish("draft-1", with: DraftReply(text: "I can't make it"))
        controller.insert()
        controller.undo()
        XCTAssertEqual(writer.contents, "hi — i cant make it")
    }

    /// After a paste the app holds the edit on its own undo stack, and in a web
    /// editor an inverse AX write would be repainted away exactly as the
    /// insertion would have been. So Undo asks the app instead.
    func testUndoAfterAPasteAsksTheAppRatherThanWritingBack() {
        locator.setApp("com.google.Chrome", name: "Google Chrome", isWebContent: true)
        writer.method = .pasteboard
        let controller = makeControllerAndTap()
        backend.finish("draft-1", with: DraftReply(text: "Thursday works."))
        controller.insert()
        controller.undo()

        XCTAssertEqual(writer.reverts.count, 1)
        XCTAssertEqual(writer.reverts.last?.method, .pasteboard)
        XCTAssertEqual(overlay.states.last, .undone)
    }

    /// And the ⌘Z key is left alone there: the app's own undo is already the
    /// right answer, so swallowing the keystroke would only get in its way.
    func testCommandZIsLeftToTheAppAfterAPaste() {
        locator.setApp("com.google.Chrome", name: "Google Chrome", isWebContent: true)
        writer.method = .pasteboard
        let controller = makeControllerAndTap()
        backend.finish("draft-1", with: DraftReply(text: "Thursday works."))
        controller.insert()
        XCTAssertEqual(tap.onCommand?(.undo), false)
        XCTAssertTrue(writer.reverts.isEmpty)
    }

    func testUndoDoesNothingBeforeAnInsertion() {
        let controller = makeControllerAndTap()
        backend.finish("draft-1", with: DraftReply(text: "Thursday works."))
        controller.undo()
        XCTAssertTrue(writer.edits.isEmpty)
    }

    // MARK: - Keys

    func testEscapeDismissesAndIsSwallowed() {
        makeControllerAndTap()
        XCTAssertEqual(tap.onCommand?(.escape), true)
        XCTAssertFalse(overlay.isPresenting)
    }

    /// The tap consumes these keys only while the overlay is up; at every other
    /// moment they belong to whatever the user is typing in.
    func testKeysPassThroughWhenNothingIsShowing() {
        _ = makeController()
        XCTAssertEqual(tap.onCommand?(.escape), false)
        XCTAssertEqual(tap.onCommand?(.submit), false)
        XCTAssertEqual(tap.onCommand?(.undo), false)
        XCTAssertEqual(overlay.dismissals, 0)
    }

    func testReturnInsertsTheDraftOnScreen() {
        makeControllerAndTap()
        backend.finish("draft-1", with: DraftReply(text: "Thursday works."))
        XCTAssertEqual(tap.onCommand?(.submit), true)
        XCTAssertEqual(writer.edits.count, 1)
    }

    /// Return belongs to the app while Minne is still writing — consuming it
    /// would eat the keystroke that sends the user's own message.
    func testReturnPassesThroughWhileStillDrafting() {
        makeControllerAndTap()
        XCTAssertEqual(tap.onCommand?(.submit), false)
        XCTAssertTrue(writer.edits.isEmpty)
    }

    func testCommandZUndoesOnlyMinnesOwnInsertion() {
        locator.setField(FieldSnapshot(text: "decline politely"))
        let controller = makeControllerAndTap()
        backend.finish("draft-1", with: DraftReply(text: "No thanks."))
        // Nothing inserted yet: the app's own undo stack is not ours to touch.
        XCTAssertEqual(tap.onCommand?(.undo), false)

        controller.insert()
        XCTAssertEqual(tap.onCommand?(.undo), true)
        XCTAssertEqual(writer.contents, "decline politely")
        // And once it is undone, ⌘Z goes back to the app.
        XCTAssertEqual(tap.onCommand?(.undo), false)
    }

    // MARK: - Going away

    func testAClickElsewhereDismisses() {
        makeControllerAndTap()
        tap.onClick?(CGPoint(x: 900, y: 700))
        XCTAssertFalse(overlay.isPresenting)
    }

    func testAClickOnTheOverlayDoesNotDismiss() {
        makeControllerAndTap()
        tap.onClick?(CGPoint(x: 150, y: 210))
        XCTAssertTrue(overlay.isPresenting)
    }

    func testSwitchingAppDismisses() {
        let controller = makeControllerAndTap()
        controller.appSwitched()
        XCTAssertFalse(overlay.isPresenting)
    }

    /// The buttons and the keys go through the same verbs.
    func testTheOverlaysButtonsDriveTheSameActions() {
        makeControllerAndTap()
        backend.finish("draft-1", with: DraftReply(text: "Thursday works."))
        overlay.onAction?(.copy)
        XCTAssertEqual(pasteboard.strings, ["Thursday works."])
        overlay.onAction?(.insert)
        XCTAssertEqual(writer.edits.count, 1)
        overlay.onAction?(.undo)
        XCTAssertEqual(writer.reverts.count, 1)
        overlay.onAction?(.dismiss)
        XCTAssertFalse(overlay.isPresenting)
    }

    @discardableResult
    private func makeControllerAndTap() -> MinneKeyController {
        let controller = makeController()
        tap.onTap?()
        return controller
    }
}
