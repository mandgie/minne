import AppKit

/// The event tap, as the controller needs it. `MinneKeyTap` is the real one;
/// a fake lets the controller's rules be tested by pushing events through the
/// same three callbacks the tap uses.
@MainActor
protocol MinneKeyTapping: AnyObject {
    var onTap: (@MainActor () -> Void)? { get set }
    var onEscape: (@MainActor () -> Bool)? { get set }
    var onClick: (@MainActor (CGPoint) -> Void)? { get set }
    func invalidate()
}

extension MinneKeyTap: MinneKeyTapping {}

/// The Minne key: everything that decides whether the overlay appears.
///
/// Owns the tap's lifecycle (installed only while the setting is on *and*
/// Accessibility is granted) and the overlay's, and nothing else — the AX
/// lookup is `CaretLocating`, the window is `MinneKeyPresenting`, the
/// tap-versus-hold rule is `MinneKeyDiscriminator`.
@MainActor
final class MinneKeyController {
    /// Injected so tests never create a real event tap.
    typealias TapFactory = @MainActor () -> (any MinneKeyTapping)?

    private let locator: any CaretLocating
    private let presenter: any MinneKeyPresenting
    private let makeTap: TapFactory
    private var tap: (any MinneKeyTapping)?
    /// Only touched on the main actor plus `deinit`, which by definition runs
    /// when nothing else holds this object.
    private nonisolated(unsafe) var workspaceObserver: (any NSObjectProtocol)?

    private(set) var isEnabled: Bool
    private(set) var permission: CapturePermissionState

    /// Whether the tap is installed right now. Settings shows this rather than
    /// the preference: without Accessibility the key cannot work, and a user
    /// deserves to be told that instead of pressing a dead key.
    var isActive: Bool { tap != nil }

    /// Fires whenever `isActive` changes, so Settings can re-render.
    var onActiveChange: (@MainActor (Bool) -> Void)?

    init(
        locator: any CaretLocating = AccessibilityCaretLocator(),
        presenter: any MinneKeyPresenting = MinneKeyOverlayController(),
        enabled: Bool,
        permission: CapturePermissionState,
        makeTap: @escaping TapFactory = { MinneKeyTap() }
    ) {
        self.locator = locator
        self.presenter = presenter
        self.makeTap = makeTap
        self.isEnabled = enabled
        self.permission = permission
        // The overlay belongs to the app the user was typing in; when they
        // leave it, it has nothing left to point at.
        workspaceObserver = NSWorkspace.shared.notificationCenter.addObserver(
            forName: NSWorkspace.didActivateApplicationNotification, object: nil, queue: .main
        ) { [weak self] _ in
            Task { @MainActor in self?.appSwitched() }
        }
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

    private var shouldRun: Bool { isEnabled && permission.isGranted }

    private func refreshTap() {
        let wasActive = isActive
        if shouldRun {
            if tap == nil { tap = install() }
        } else {
            tap?.invalidate()
            tap = nil
            presenter.dismiss()
        }
        if isActive != wasActive { onActiveChange?(isActive) }
    }

    private func install() -> (any MinneKeyTapping)? {
        guard let tap = makeTap() else { return nil }
        tap.onTap = { [weak self] in self?.keyTapped() }
        tap.onEscape = { [weak self] in self?.escapePressed() ?? false }
        tap.onClick = { [weak self] point in self?.clicked(at: point) }
        BrainClient.log("minne key: right-Option is live")
        return tap
    }

    // MARK: - Events

    /// A deliberate right-Option tap. Toggles, so a second press dismisses.
    func keyTapped() {
        guard shouldRun else { return }
        if presenter.isPresenting {
            presenter.dismiss()
            return
        }
        guard let target = locator.locateCaret() else {
            BrainClient.log("minne key: no text field is focused")
            return
        }
        BrainClient.log("minne key: \(target.logSummary)")
        presenter.present(target)
    }

    /// Returns true when the overlay consumed the key. Escape belongs to the
    /// app underneath at every other moment, which is why this is a question
    /// the tap asks rather than something it decides.
    @discardableResult
    func escapePressed() -> Bool {
        guard presenter.isPresenting else { return false }
        presenter.dismiss()
        return true
    }

    /// A click anywhere but on the overlay puts the user somewhere else — very
    /// likely a different caret — so the overlay goes away.
    func clicked(at point: CGPoint) {
        guard presenter.isPresenting, !presenter.contains(quartzPoint: point) else { return }
        presenter.dismiss()
    }

    func appSwitched() {
        presenter.dismiss()
    }
}
