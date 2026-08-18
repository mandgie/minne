import AppKit

/// The event tap, as the controller needs it. `MinneKeyTap` is the real one;
/// a fake lets the controller's rules be tested by pushing events through the
/// same three callbacks the tap uses.
@MainActor
protocol MinneKeyTapping: AnyObject {
    var onTap: (@MainActor () -> Void)? { get set }
    var onCommand: (@MainActor (MinneKeyCommand) -> Bool)? { get set }
    var onClick: (@MainActor (CGPoint) -> Void)? { get set }
    var onUserInput: (@MainActor () -> Void)? { get set }
    func invalidate()
}

extension MinneKeyTap: MinneKeyTapping {}

/// The brain, as the Minne key needs it: one request, one answer.
@MainActor
protocol DraftBackend: AnyObject {
    /// Asks for a draft. `completion` reports the terminal outcome; the brain
    /// settles `done`/`error` on the request rather than streaming a draft,
    /// because a half-written one must never reach the user's field.
    func draft(
        id: String, context: DraftRequestContext,
        completion: @escaping @MainActor (Result<DraftReply, any Error>) -> Void)
    /// Cancels the in-flight draft `id`.
    func abortDraft(id: String)
}

/// What the brain wrote.
struct DraftReply: Equatable, Sendable {
    var text: String
    /// The `style/` page it was written to sound like, when the user has one.
    var stylePage: String?
    /// The wiki pages prefetched into the prompt for the correspondent.
    var memoryPages: [String]

    /// Reads the `done` result of a `draft` request. Both grounding fields are
    /// optional on the wire: an older brain sends neither, and a draft decoded
    /// without them is a draft, not an error.
    init?(_ result: JSONValue?) {
        guard let object = result?.objectValue,
            let text = object["text"]?.stringValue, !text.isEmpty
        else { return nil }
        self.text = text
        self.stylePage = object["stylePage"]?.stringValue
        self.memoryPages = object["memoryPages"]?.arrayValue?.compactMap(\.stringValue) ?? []
    }

    init(text: String, stylePage: String? = nil, memoryPages: [String] = []) {
        self.text = text
        self.stylePage = stylePage
        self.memoryPages = memoryPages
    }
}

/// The Minne key: press it in a text field, and the field fills itself in.
///
/// Owns the tap's lifecycle (installed only while the setting is on *and*
/// Accessibility is granted), the overlay's, and the one piece of state that
/// makes this feature safe — the edit a draft made, kept so it can be taken
/// back. Everything else is behind a seam: the AX read is `CaretLocating`, the
/// AX write is `FieldWriting`, the window is `MinneKeyPresenting`, the model is
/// `DraftBackend`, the tap-versus-hold rule is `MinneKeyDiscriminator`.
///
/// The rule the whole story turns on lives here and nowhere else: **the user's
/// field is not touched until the draft is complete and they have accepted it.**
@MainActor
final class MinneKeyController {
    /// Injected so tests never create a real event tap.
    typealias TapFactory = @MainActor () -> (any MinneKeyTapping)?
    /// Injected so tests do not wait out the overlay's own timers.
    typealias Scheduler = @MainActor (TimeInterval, @escaping @MainActor () -> Void) -> Void

    /// How long the "inserted" confirmation stays up before the overlay closes
    /// itself. The draft is in the field by then and the user is looking at
    /// their own text, not at us — but closing instantly would leave them
    /// wondering whether the key did anything at all.
    static let insertedDismissDelay: TimeInterval = 1.4
    /// When a paste is checked. A synthesised ⌘V is delivered asynchronously,
    /// so there is nothing to read at the moment it is posted; this is long
    /// enough for the app to have handled it and short enough that an error
    /// arrives while the user is still looking at the overlay.
    static let pasteConfirmDelay: TimeInterval = 0.6

    /// How long the panel waits, after giving the keyboard back, before it
    /// types into the app it gave it to. Handing key status over happens
    /// through the window server and across two processes, so it is not done
    /// the instant `endGuiding()` returns — and a paste posted into the gap
    /// would land nowhere at all.
    static let focusReturnDelay: TimeInterval = 0.12

    /// How long a freshly woken Chromium accessibility tree gets to build
    /// before the press's locate is retried (US-104). The tree is constructed
    /// asynchronously after `AXManualAccessibility` is set, so the immediate
    /// retry usually misses; half a second is enough for it to come up and
    /// short enough that the overlay still arrives as the answer to the press.
    static let wakeRetryDelay: TimeInterval = 0.5

    /// One press, from the key going down to the overlay going away.
    ///
    /// A rework — another take, or a steer — starts a new request but stays the
    /// same press: same caret, same mode, same undo bookkeeping. What it adds
    /// is memory of what was written last time and of what the user has asked
    /// for since, because the brain builds every draft with a fresh agent and
    /// would otherwise have neither.
    private struct Session {
        let requestId: String
        let target: CaretTarget
        let mode: DraftMode
        /// The draft this request is reworking, when it is a rework.
        var previousDraft: String?
        /// The steers the user has typed, oldest first.
        var guidance: [String] = []
        /// This request asked for another take rather than a revision.
        var regenerate = false
        var draft: String?
        /// The edit that put the draft in, once it is in. Its `inverse` is undo.
        var applied: FieldEdit?
        /// How it got in, which decides whose undo takes it back.
        var method: InsertionMethod?
    }

    private let locator: any CaretLocating
    private let presenter: any MinneKeyPresenting
    private let writer: any FieldWriting
    private let pasteboard: any PasteboardHolding
    private let makeTap: TapFactory
    private let makeRequestId: () -> String
    private let frontmostPid: @MainActor () -> pid_t?
    private let schedule: Scheduler
    private var tap: (any MinneKeyTapping)?
    private var session: Session?
    /// The one delayed retry a wake earns, while its timer is armed (US-104).
    private var wakeRetry: MinneKeyWakeRetry?
    /// Bumped whenever a retry is scheduled, so a timer armed for an earlier
    /// press cannot fire a later press's retry ahead of its time.
    private var wakeRetryGeneration = 0
    /// Bumped by everything that changes what the overlay is showing, so a
    /// timer armed for an earlier state does not close a later one.
    private var overlayGeneration = 0
    /// Only touched on the main actor plus `deinit`, which by definition runs
    /// when nothing else holds this object.
    private nonisolated(unsafe) var workspaceObserver: (any NSObjectProtocol)?

    /// Which key the user chose, `off` included. Today the only tap that
    /// exists watches right-Option; a future trigger picks its own tap in
    /// `refreshTap()`, and everything else here already works per-trigger.
    private(set) var trigger: MinneKeyTrigger
    private(set) var permission: CapturePermissionState
    /// Apps Minne is not allowed to look at. The same list capture obeys: an
    /// app whose contents may not become memory may not become a prompt either.
    var blacklist: CaptureBlacklist

    /// Set by the app once the brain is connected; nil means "no brain", which
    /// the overlay says out loud rather than hanging on a spinner.
    var backend: (any DraftBackend)?

    /// Whether the tap is installed right now. Settings shows this rather than
    /// the preference: without Accessibility the key cannot work, and a user
    /// deserves to be told that instead of pressing a dead key.
    var isActive: Bool { tap != nil }

    /// Fires whenever `isActive` changes, so Settings can re-render.
    var onActiveChange: (@MainActor (Bool) -> Void)?

    init(
        locator: any CaretLocating = AccessibilityCaretLocator(),
        presenter: any MinneKeyPresenting = MinneKeyOverlayController(),
        writer: any FieldWriting = AccessibilityFieldWriter(),
        pasteboard: any PasteboardHolding = SystemPasteboard(),
        trigger: MinneKeyTrigger,
        permission: CapturePermissionState,
        blacklist: CaptureBlacklist = .standard,
        makeTap: @escaping TapFactory = { MinneKeyTap() },
        makeRequestId: @escaping () -> String = { UUID().uuidString },
        frontmostPid: @escaping @MainActor () -> pid_t? = {
            NSWorkspace.shared.frontmostApplication?.processIdentifier
        },
        schedule: @escaping Scheduler = { delay, work in
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                MainActor.assumeIsolated(work)
            }
        }
    ) {
        self.locator = locator
        self.presenter = presenter
        self.writer = writer
        self.pasteboard = pasteboard
        self.makeTap = makeTap
        self.makeRequestId = makeRequestId
        self.frontmostPid = frontmostPid
        self.schedule = schedule
        self.trigger = trigger
        self.permission = permission
        self.blacklist = blacklist
        // The overlay belongs to the app the user was typing in; when they
        // leave it, it has nothing left to point at.
        workspaceObserver = NSWorkspace.shared.notificationCenter.addObserver(
            forName: NSWorkspace.didActivateApplicationNotification, object: nil, queue: .main
        ) { [weak self] note in
            // Minne activating is not the user leaving: borrowing the keyboard
            // for the guidance field must never look like an app switch, or the
            // overlay would dismiss itself the moment it was typed into.
            let app = note.userInfo?[NSWorkspace.applicationUserInfoKey] as? NSRunningApplication
            guard app?.processIdentifier != ProcessInfo.processInfo.processIdentifier else {
                return
            }
            Task { @MainActor in self?.appSwitched() }
        }
        presenter.onAction = { [weak self] action in self?.perform(action) }
        presenter.onGuidance = { [weak self] steer in self?.guide(steer) }
        refreshTap()
    }

    deinit {
        if let workspaceObserver {
            NSWorkspace.shared.notificationCenter.removeObserver(workspaceObserver)
        }
    }

    // MARK: - Lifecycle

    /// `off` tears the tap down exactly as revoked Accessibility does; any
    /// other trigger installs it (US-103).
    func apply(trigger: MinneKeyTrigger) {
        guard trigger != self.trigger else { return }
        self.trigger = trigger
        refreshTap()
    }

    /// A grant landing (or being revoked) installs or drops the tap live, the
    /// same way it starts and stops capture.
    func update(permission: CapturePermissionState) {
        guard permission != self.permission else { return }
        self.permission = permission
        refreshTap()
    }

    func update(blacklist: CaptureBlacklist) {
        self.blacklist = blacklist
    }

    private var shouldRun: Bool { trigger.installsTap && permission.isGranted }

    private func refreshTap() {
        let wasActive = isActive
        if shouldRun {
            if tap == nil { tap = install() }
        } else {
            tap?.invalidate()
            tap = nil
            dismiss()
        }
        if isActive != wasActive { onActiveChange?(isActive) }
    }

    private func install() -> (any MinneKeyTapping)? {
        guard let tap = makeTap() else { return nil }
        tap.onTap = { [weak self] in self?.keyTapped() }
        tap.onCommand = { [weak self] command in self?.command(command) ?? false }
        tap.onClick = { [weak self] point in self?.clicked(at: point) }
        tap.onUserInput = { [weak self] in self?.cancelWakeRetry(.typing) }
        BrainClient.log("minne key: right-Option is live")
        return tap
    }

    // MARK: - Pressing the key

    /// A deliberate right-Option tap. Toggles, so a second press dismisses.
    func keyTapped() {
        guard shouldRun else { return }
        // A new press supersedes a pending wake retry: its own locate is
        // fresher than the one the timer would repeat.
        cancelWakeRetry(.anotherPress)
        if presenter.isPresenting {
            dismiss()
            return
        }
        press(isWakeRetry: false)
    }

    /// One attempt at turning the press into a draft. The wake retry comes
    /// back through here too, so a press that needed one proceeds exactly like
    /// a press that did not: same blacklist check, same logging, same overlay.
    private func press(isWakeRetry: Bool) {
        guard let target = locator.locateCaret() else {
            if !isWakeRetry, let pid = locator.lastLocateWokeApp {
                // Not logged as a failure yet: the retry's outcome speaks for
                // this press, so the "no text field" line fires once, there.
                scheduleWakeRetry(afterWaking: pid)
            } else {
                BrainClient.log("minne key: no text field is focused")
            }
            return
        }
        guard !blacklist.blocks(bundleIdentifier: target.bundleIdentifier) else {
            BrainClient.log("minne key: ignored — \(target.appName) is on the blacklist")
            return
        }
        BrainClient.log("minne key: \(target.logSummary)")

        let mode = target.mode
        let session = Session(requestId: makeRequestId(), target: target, mode: mode)
        self.session = session
        overlayGeneration += 1
        presenter.present(target, state: .working(mode))
        send(session)
    }

    // MARK: - The wake retry

    /// The press found the app's tree dark and this locate just flipped the
    /// wake switch; the tree builds asynchronously, so the locate is repeated
    /// once after it has had time to (US-104). `MinneKeyWakeRetry` holds the
    /// rules; this is only the timer around it.
    private func scheduleWakeRetry(afterWaking pid: pid_t) {
        wakeRetry = MinneKeyWakeRetry(pid: pid)
        wakeRetryGeneration += 1
        let generation = wakeRetryGeneration
        BrainClient.log(
            "minne key: retrying in \(Int(Self.wakeRetryDelay * 1000)) ms — "
                + "the accessibility tree may still be building")
        schedule(Self.wakeRetryDelay) { [weak self] in self?.wakeRetryFired(generation) }
    }

    private func wakeRetryFired(_ generation: Int) {
        guard generation == wakeRetryGeneration, var retry = wakeRetry else { return }
        wakeRetry = nil
        let wasPending = retry.phase == .pending
        guard retry.shouldFire(frontmostPid: frontmostPid()) else {
            // A cancellation noticed only now: the frontmost app changed
            // without a press, keystroke or click. The earlier ones already
            // said why when they happened.
            if wasPending {
                BrainClient.log(
                    "minne key: wake retry abandoned — "
                        + MinneKeyWakeRetry.Cancellation.appSwitch.rawValue)
            }
            return
        }
        guard shouldRun, !presenter.isPresenting else { return }
        press(isWakeRetry: true)
    }

    private func cancelWakeRetry(_ reason: MinneKeyWakeRetry.Cancellation) {
        guard wakeRetry?.cancel(reason) == true else { return }
        BrainClient.log("minne key: wake retry abandoned — \(reason.rawValue)")
    }

    /// Puts one session's request on the wire and shows nothing — the caller
    /// has already put the right state on screen, because what a request looks
    /// like while it runs is not the same question as what it asks for.
    private func send(_ session: Session) {
        guard let backend else {
            fail("Minne's brain is not running")
            return
        }
        let requestId = session.requestId
        backend.draft(id: requestId, context: Self.context(for: session)) { [weak self] result in
            self?.drafted(requestId, result)
        }
    }

    private static func context(for session: Session) -> DraftRequestContext {
        context(
            for: session.target, mode: session.mode, previousDraft: session.previousDraft,
            guidance: session.guidance, regenerate: session.regenerate)
    }

    /// The values the brain is given. Static and pure: what one press sends is
    /// worth being able to assert on without a window server.
    static func context(
        for target: CaretTarget, mode: DraftMode, previousDraft: String? = nil,
        guidance: [String] = [], regenerate: Bool = false
    ) -> DraftRequestContext {
        DraftRequestContext(
            mode: mode.rawValue,
            fieldText: target.field.text,
            // In rewrite mode the selection is the subject; everywhere else it
            // is noise (an empty string, or a caret's worth of nothing).
            selection: mode == .rewrite ? target.field.selection : "",
            windowText: target.field.windowText,
            app: target.appName,
            bundleId: target.bundleIdentifier,
            windowTitle: target.field.windowTitle,
            recipient: target.recipient,
            previousDraft: previousDraft,
            guidance: guidance,
            regenerate: regenerate)
    }

    // MARK: - Asking again

    /// Another take on the draft on screen.
    ///
    /// The same press, the same context, and the previous draft sent along as
    /// the thing to differ from — without it the model has no idea it is being
    /// asked a second time (each draft is a fresh agent) and writes the same
    /// sentences back. Steers already given stay in force.
    func regenerate() {
        guard let session, let previous = session.draft, session.applied == nil else { return }
        rework(.another, previous: previous, guidance: session.guidance, regenerate: true)
    }

    /// A steer: the draft on screen, changed in one respect.
    ///
    /// Guidance accumulates rather than replaces — a user who asked for
    /// "shorter" and then "warmer" wants both — and it is the *previous draft*
    /// that is revised, not the original press replayed with a note attached.
    func guide(_ steer: String) {
        let steer = steer.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !steer.isEmpty, let session, let previous = session.draft, session.applied == nil
        else { return }
        rework(.guided, previous: previous, guidance: session.guidance + [steer], regenerate: false)
    }

    private func rework(
        _ kind: ReworkKind, previous: String, guidance: [String], regenerate: Bool
    ) {
        guard let current = session else { return }
        var next = Session(
            requestId: makeRequestId(), target: current.target, mode: current.mode)
        next.previousDraft = previous
        next.guidance = guidance
        next.regenerate = regenerate
        session = next
        BrainClient.log(
            "minne key: \(regenerate ? "another take" : "reworking")"
                + (guidance.isEmpty ? "" : " (\(guidance.count) steer(s))"))
        presenter.update(guidance: guidance)
        show(.reworking(kind, previous: previous))
        send(next)
    }

    private func drafted(_ requestId: String, _ result: Result<DraftReply, any Error>) {
        // A press the user has already dismissed, or a second one on top of it:
        // its answer is not wanted and must not reach anybody's text field.
        guard session?.requestId == requestId, presenter.isPresenting else { return }
        switch result {
        case .success(let reply):
            session?.draft = reply.text
            BrainClient.log(
                "minne key: draft ready (\(reply.text.count) chars"
                    + (reply.stylePage.map { ", style \($0)" } ?? "")
                    + (reply.memoryPages.isEmpty
                        ? "" : ", memory \(reply.memoryPages.joined(separator: " "))") + ")")
            show(
                .result(
                    reply.text,
                    grounding: MinneKeyGrounding.line(
                        memoryPages: reply.memoryPages, stylePage: reply.stylePage)))
        case .failure(let error):
            fail(Self.message(for: error))
        }
    }

    /// The brain's error codes, as something a user reads at their caret.
    static func message(for error: any Error) -> String {
        guard case let BrainClientError.brain(code, message) = error else {
            return "Minne could not reach its brain"
        }
        switch code {
        case "not_authenticated": return "Sign in to a provider in Settings first"
        case "busy": return "Minne is already writing a draft"
        case "aborted": return "Cancelled"
        default: return message
        }
    }

    private func fail(_ message: String) {
        BrainClient.log("minne key: \(message)")
        show(.failed(message))
    }

    /// Renders a state and cancels any timer armed for the previous one — an
    /// error must not be swept away by the close that a successful insertion
    /// scheduled a moment earlier.
    private func show(_ state: MinneKeyOverlayState) {
        overlayGeneration += 1
        presenter.update(state)
    }

    /// Closes the overlay unless something else happens first.
    private func closeOverlay(after delay: TimeInterval) {
        let generation = overlayGeneration
        schedule(delay) { [weak self] in
            guard let self, self.overlayGeneration == generation, self.presenter.isPresenting
            else { return }
            self.dismiss()
        }
    }

    /// A tool the draft reached for, so the overlay can say what it is reading.
    func toolStarted(requestId: String, name: String) {
        guard let session, session.requestId == requestId, session.draft == nil else { return }
        show(.consulting(session.mode, tool: name))
    }

    // MARK: - Insertion and undo

    /// Puts the draft in the field — the first and only moment this feature
    /// touches the user's text.
    ///
    /// Which path it takes is not the writer's choice but the target's: web
    /// content only ever gets the pasteboard, because an Accessibility write
    /// there lands in a DOM the framework will repaint from its own state (see
    /// `InsertionStrategy`). And a successful insertion closes the overlay: the
    /// user asked for text in their field, they now have it, and a panel that
    /// stayed put would be one more thing to dismiss.
    func insert() {
        guard let session, session.draft != nil, session.applied == nil else { return }
        // If the guidance field has the keyboard, the app about to be typed
        // into does not. Give it back first and let focus travel: the
        // pasteboard path posts a real ⌘V, and a ⌘V posted while our own panel
        // is key goes into our own panel.
        let requestId = session.requestId
        if presenter.endGuiding() {
            schedule(Self.focusReturnDelay) { [weak self] in self?.performInsert(requestId) }
            return
        }
        performInsert(requestId)
    }

    private func performInsert(_ requestId: String) {
        guard var session, session.requestId == requestId, let draft = session.draft,
            session.applied == nil, presenter.isPresenting
        else { return }
        let edit = FieldEdit.forDraft(draft, mode: session.mode, field: session.target.field)
        guard let method = writer.apply(edit, in: insertionTarget(for: edit, in: session)) else {
            fail("Minne could not write into \(session.target.appName) — use Copy")
            return
        }
        session.applied = edit
        session.method = method
        self.session = session
        BrainClient.log(
            "minne key: inserted via \(method.rawValue) (\(session.target.strategy.rawValue))")
        show(.inserted(method))
        if method == .pasteboard { confirmPaste(session.requestId, after: Self.pasteConfirmDelay) }
        closeOverlay(after: Self.insertedDismissDelay)
    }

    private func insertionTarget(for edit: FieldEdit, in session: Session) -> InsertionTarget {
        InsertionTarget(
            handle: session.target.handle,
            fieldText: session.target.field.text,
            strategy: session.target.strategy,
            selection: SelectionPlan.plan(for: edit, field: session.target.field))
    }

    /// A paste is a keystroke, not a write: it is delivered when the app gets
    /// round to it, so there is nothing to verify at the moment it is posted.
    /// This looks a moment later, and only to be able to *say* that nothing
    /// happened — it never inserts again, because a second attempt on top of a
    /// paste that did land would put the draft in twice.
    private func confirmPaste(_ requestId: String, after delay: TimeInterval) {
        schedule(delay) { [weak self] in
            guard let self, var session = self.session, session.requestId == requestId,
                session.method == .pasteboard, self.presenter.isPresenting
            else { return }
            let after = self.writer.currentText(of: session.target.handle)
            guard !InsertionCheck.changed(before: session.target.field.text, after: after) else {
                return
            }
            session.applied = nil
            session.method = nil
            self.session = session
            self.fail("\(session.target.appName) did not take the draft — use Copy")
        }
    }

    /// Puts back exactly what the field held before the draft went in.
    ///
    /// For an Accessibility insertion that is the inverse edit through the same
    /// writer — undo is not a second insertion path with its own bugs, it is
    /// the one path pointed backwards. For a paste it is the app's own undo,
    /// asked for with ⌘Z: the paste went through the app's event pipeline, so
    /// the app has it on its undo stack, and in a web editor an inverse AX
    /// write would be repainted away exactly like the insertion was.
    func undo() {
        guard var session, let edit = session.applied, let method = session.method else { return }
        let inverse = edit.inverse
        let current = edit.applied(to: session.target.field.text) ?? session.target.field.text
        var target = insertionTarget(for: inverse, in: session)
        target.fieldText = current
        // The selection read at press time goes back with the text, so undo
        // restores the user's place too, not just their words. Only the AX
        // revert needs it — the app's own ⌘Z restores its selection itself.
        let selection = session.target.field.selectedRange
        guard writer.revert(inverse, method: method, in: target, restoringSelection: selection)
        else {
            fail("Minne could not undo that — use \(session.target.appName)'s own undo")
            return
        }
        session.applied = nil
        session.method = nil
        self.session = session
        BrainClient.log("minne key: undone via \(method.undoBelongsToTheApp ? "⌘Z" : "AX")")
        show(.undone)
        closeOverlay(after: Self.insertedDismissDelay)
    }

    /// Tries again after a failure: the insertion when there is a draft to put
    /// in, the draft itself when there is not.
    func retry() {
        guard let session else { return }
        if session.draft != nil {
            insert()
            return
        }
        // The same request again, rework and all: a steer the user gave before
        // the brain fell over is still what they asked for.
        var next = Session(
            requestId: makeRequestId(), target: session.target, mode: session.mode)
        next.previousDraft = session.previousDraft
        next.guidance = session.guidance
        next.regenerate = session.regenerate
        self.session = next
        if let previous = next.previousDraft {
            show(.reworking(next.regenerate ? .another : .guided, previous: previous))
        } else {
            show(.working(next.mode))
        }
        send(next)
    }

    func copyDraft() {
        guard let draft = session?.draft else { return }
        pasteboard.write(string: draft)
        BrainClient.log("minne key: draft copied to the clipboard")
    }

    func perform(_ action: MinneKeyAction) {
        switch action {
        case .insert: insert()
        case .copy: copyDraft()
        case .retry: retry()
        case .undo: undo()
        case .regenerate: regenerate()
        case .dismiss: dismiss()
        }
    }

    // MARK: - Keys

    /// Returns true when the overlay consumed the key.
    ///
    /// Only ever while the overlay is up, and only for what the state on screen
    /// actually offers: Return is not ours while a draft is still being
    /// written, ⌘R is not ours unless there is a draft to write again, and ⌘Z
    /// is not ours unless there is an insertion of ours to take back — nor when
    /// the draft went in as a paste, because then the app's own undo stack
    /// holds it and is the better answer. Everything else belongs to the app
    /// the user is typing in, which is the whole reason this is a question the
    /// tap asks rather than a rule it applies.
    ///
    /// And while the guidance field is being edited, **nothing** is ours. The
    /// panel holds the keyboard in that state, so every key the user presses is
    /// meant for the text they are typing into it: Return submits the steer,
    /// Escape puts the field away, and ⌘Z is the field editor's own undo. All
    /// four arrive at the field natively, which is only true because the tap
    /// lets them past.
    @discardableResult
    func command(_ command: MinneKeyCommand) -> Bool {
        guard presenter.isPresenting, !presenter.isGuiding else { return false }
        switch command {
        case .escape:
            dismiss()
            return true
        case .submit:
            guard case .result = presenter.state else { return false }
            insert()
            return true
        case .regenerate:
            guard case .result = presenter.state, session?.draft != nil else { return false }
            regenerate()
            return true
        case .guide:
            guard case .result = presenter.state else { return false }
            presenter.beginGuiding()
            return true
        case .undo:
            guard case .inserted(let method) = presenter.state, session?.applied != nil,
                !method.undoBelongsToTheApp
            else { return false }
            undo()
            return true
        }
    }

    // MARK: - Going away

    /// A click anywhere but on the overlay puts the user somewhere else — very
    /// likely a different caret — so the overlay goes away, and so does any
    /// retry still waiting on a woken tree.
    func clicked(at point: CGPoint) {
        cancelWakeRetry(.click)
        guard presenter.isPresenting, !presenter.contains(quartzPoint: point) else { return }
        dismiss()
    }

    func appSwitched() {
        cancelWakeRetry(.appSwitch)
        dismiss()
    }

    /// Closes the overlay and abandons the press. A draft still in flight is
    /// cancelled: nobody is waiting for it any more, and the brain should not
    /// spend the user's quota finishing it.
    func dismiss() {
        // The keyboard goes back before the panel does: it is the app's, and
        // the user is about to be typing in it again.
        presenter.endGuiding()
        if let session, session.draft == nil {
            backend?.abortDraft(id: session.requestId)
        }
        session = nil
        overlayGeneration += 1
        presenter.dismiss()
    }
}

/// Real `DraftBackend`: the `draft` request over the stdio protocol.
@MainActor
final class BrainDraftBackend: DraftBackend {
    private let client: BrainClient

    init(client: BrainClient) {
        self.client = client
    }

    func draft(
        id: String, context: DraftRequestContext,
        completion: @escaping @MainActor (Result<DraftReply, any Error>) -> Void
    ) {
        Task {
            do {
                let result = try await client.request(.draft(id: id, context: context))
                guard let reply = DraftReply(result) else {
                    completion(
                        .failure(
                            BrainClientError.brain(
                                code: "internal", message: "the brain returned no draft")))
                    return
                }
                completion(.success(reply))
            } catch {
                completion(.failure(error))
            }
        }
    }

    func abortDraft(id: String) {
        Task {
            do {
                try await client.request(.abort(id: UUID().uuidString, targetId: id))
            } catch {
                BrainClient.log("draft abort failed: \(error)")
            }
        }
    }
}
