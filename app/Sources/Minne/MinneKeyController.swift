import AppKit

/// The event tap, as the controller needs it. `MinneKeyTap` is the real one;
/// a fake lets the controller's rules be tested by pushing events through the
/// same three callbacks the tap uses.
@MainActor
protocol MinneKeyTapping: AnyObject {
    var onTap: (@MainActor () -> Void)? { get set }
    var onCommand: (@MainActor (MinneKeyCommand) -> Bool)? { get set }
    var onClick: (@MainActor (CGPoint) -> Void)? { get set }
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

    /// Reads the `done` result of a `draft` request.
    init?(_ result: JSONValue?) {
        guard let object = result?.objectValue,
            let text = object["text"]?.stringValue, !text.isEmpty
        else { return nil }
        self.text = text
        self.stylePage = object["stylePage"]?.stringValue
    }

    init(text: String, stylePage: String? = nil) {
        self.text = text
        self.stylePage = stylePage
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

    /// One press, from the key going down to the overlay going away.
    private struct Session {
        let requestId: String
        let target: CaretTarget
        let mode: DraftMode
        var draft: String?
        /// The edit that put the draft in, once it is in. Its `inverse` is undo.
        var applied: FieldEdit?
    }

    private let locator: any CaretLocating
    private let presenter: any MinneKeyPresenting
    private let writer: any FieldWriting
    private let pasteboard: any PasteboardHolding
    private let makeTap: TapFactory
    private let makeRequestId: () -> String
    private var tap: (any MinneKeyTapping)?
    private var session: Session?
    /// Only touched on the main actor plus `deinit`, which by definition runs
    /// when nothing else holds this object.
    private nonisolated(unsafe) var workspaceObserver: (any NSObjectProtocol)?

    private(set) var isEnabled: Bool
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
        enabled: Bool,
        permission: CapturePermissionState,
        blacklist: CaptureBlacklist = .standard,
        makeTap: @escaping TapFactory = { MinneKeyTap() },
        makeRequestId: @escaping () -> String = { UUID().uuidString }
    ) {
        self.locator = locator
        self.presenter = presenter
        self.writer = writer
        self.pasteboard = pasteboard
        self.makeTap = makeTap
        self.makeRequestId = makeRequestId
        self.isEnabled = enabled
        self.permission = permission
        self.blacklist = blacklist
        // The overlay belongs to the app the user was typing in; when they
        // leave it, it has nothing left to point at.
        workspaceObserver = NSWorkspace.shared.notificationCenter.addObserver(
            forName: NSWorkspace.didActivateApplicationNotification, object: nil, queue: .main
        ) { [weak self] _ in
            Task { @MainActor in self?.appSwitched() }
        }
        presenter.onAction = { [weak self] action in self?.perform(action) }
        refreshTap()
    }

    deinit {
        if let workspaceObserver {
            NSWorkspace.shared.notificationCenter.removeObserver(workspaceObserver)
        }
    }

    // MARK: - Lifecycle

    func setEnabled(_ enabled: Bool) {
        guard enabled != isEnabled else { return }
        isEnabled = enabled
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

    private var shouldRun: Bool { isEnabled && permission.isGranted }

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
        BrainClient.log("minne key: right-Option is live")
        return tap
    }

    // MARK: - Pressing the key

    /// A deliberate right-Option tap. Toggles, so a second press dismisses.
    func keyTapped() {
        guard shouldRun else { return }
        if presenter.isPresenting {
            dismiss()
            return
        }
        guard let target = locator.locateCaret() else {
            BrainClient.log("minne key: no text field is focused")
            return
        }
        guard !blacklist.blocks(bundleIdentifier: target.bundleIdentifier) else {
            BrainClient.log("minne key: ignored — \(target.appName) is on the blacklist")
            return
        }
        BrainClient.log("minne key: \(target.logSummary)")

        let mode = target.mode
        let requestId = makeRequestId()
        session = Session(requestId: requestId, target: target, mode: mode)
        presenter.present(target, state: .working(mode))

        guard let backend else {
            fail("Minne's brain is not running")
            return
        }
        backend.draft(id: requestId, context: Self.context(for: target, mode: mode)) {
            [weak self] result in
            self?.drafted(requestId, result)
        }
    }

    /// The values the brain is given. Static and pure: what one press sends is
    /// worth being able to assert on without a window server.
    static func context(for target: CaretTarget, mode: DraftMode) -> DraftRequestContext {
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
            recipient: target.recipient)
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
                    + (reply.stylePage.map { ", style \($0)" } ?? "") + ")")
            presenter.update(.result(reply.text))
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
        presenter.update(.failed(message))
    }

    /// A tool the draft reached for, so the overlay can say what it is reading.
    func toolStarted(requestId: String, name: String) {
        guard let session, session.requestId == requestId, session.draft == nil else { return }
        presenter.update(.consulting(session.mode, tool: name))
    }

    // MARK: - Insertion and undo

    /// Puts the draft in the field — the first and only moment this feature
    /// touches the user's text.
    func insert() {
        guard var session, let draft = session.draft, session.applied == nil else { return }
        let edit = FieldEdit.forDraft(draft, mode: session.mode, field: session.target.field)
        guard
            let method = writer.apply(
                edit, fieldText: session.target.field.text, to: session.target.handle)
        else {
            fail("Minne could not write into \(session.target.appName) — use Copy")
            return
        }
        session.applied = edit
        self.session = session
        BrainClient.log("minne key: inserted via \(method.rawValue)")
        presenter.update(.inserted(method))
    }

    /// Puts back exactly what the field held before the draft went in.
    ///
    /// The inverse edit, through the same writer: undo is not a second
    /// insertion path with its own bugs, it is the one path pointed backwards.
    func undo() {
        guard var session, let edit = session.applied else { return }
        let inverse = edit.inverse
        let current = edit.applied(to: session.target.field.text) ?? session.target.field.text
        guard writer.apply(inverse, fieldText: current, to: session.target.handle) != nil else {
            fail("Minne could not undo that — use \(session.target.appName)'s own undo")
            return
        }
        session.applied = nil
        self.session = session
        BrainClient.log("minne key: undone")
        presenter.update(.undone)
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
        case .undo: undo()
        case .dismiss: dismiss()
        }
    }

    // MARK: - Keys

    /// Returns true when the overlay consumed the key.
    ///
    /// Only ever while the overlay is up, and only for what the state on screen
    /// actually offers: Return is not ours while a draft is still being
    /// written, and ⌘Z is not ours unless there is an insertion of ours to take
    /// back. Everything else belongs to the app the user is typing in, which is
    /// the whole reason this is a question the tap asks rather than a rule it
    /// applies.
    @discardableResult
    func command(_ command: MinneKeyCommand) -> Bool {
        guard presenter.isPresenting else { return false }
        switch command {
        case .escape:
            dismiss()
            return true
        case .submit:
            guard case .result = presenter.state else { return false }
            insert()
            return true
        case .undo:
            guard case .inserted = presenter.state, session?.applied != nil else { return false }
            undo()
            return true
        }
    }

    // MARK: - Going away

    /// A click anywhere but on the overlay puts the user somewhere else — very
    /// likely a different caret — so the overlay goes away.
    func clicked(at point: CGPoint) {
        guard presenter.isPresenting, !presenter.contains(quartzPoint: point) else { return }
        dismiss()
    }

    func appSwitched() {
        dismiss()
    }

    /// Closes the overlay and abandons the press. A draft still in flight is
    /// cancelled: nobody is waiting for it any more, and the brain should not
    /// spend the user's quota finishing it.
    func dismiss() {
        if let session, session.draft == nil {
            backend?.abortDraft(id: session.requestId)
        }
        session = nil
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
                    completion(.failure(BrainClientError.brain(
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
