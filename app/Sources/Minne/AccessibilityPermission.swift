import AppKit
import ApplicationServices

/// Whether Minne may read window text. The capture engine (US-007) consults
/// this before touching the AX tree; `.missing` is the app's degraded
/// no-capture mode, not an error.
enum CapturePermissionState: Sendable, Equatable {
    case granted
    case missing

    var isGranted: Bool { self == .granted }

    init(isTrusted: Bool) {
        self = isTrusted ? .granted : .missing
    }
}

/// Live view of the Accessibility (TCC) grant. There is no notification for
/// it, so the state is polled — fast while onboarding is on screen, slowly in
/// the background so the menu-bar hint stays honest if the user revokes it.
@MainActor
final class AccessibilityPermission {
    /// Poll interval while the onboarding window waits for the grant.
    static let foregroundInterval: TimeInterval = 1
    /// Background interval: only keeps the menu hint in sync.
    static let backgroundInterval: TimeInterval = 5

    static let systemSettingsURL = URL(
        string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")!

    static var current: CapturePermissionState {
        // Dev override — the only way to exercise the no-capture path on a Mac
        // that already trusts Minne, since TCC cannot be revoked
        // programmatically: `defaults write sh.minne.app simulateNoAccessibility
        // -bool YES`, and flip it back to watch the live grant land. Fails
        // closed, so it can only ever disable capture.
        if UserDefaults.standard.bool(forKey: "simulateNoAccessibility") { return .missing }
        return CapturePermissionState(isTrusted: AXIsProcessTrusted())
    }

    /// Prompts first, then deep-links. The prompt is what registers Minne in
    /// the Accessibility list — without it the user opens the pane to a list
    /// that has no Minne row to switch on.
    static func requestAndOpenSystemSettings() {
        requestPrompt()
        NSWorkspace.shared.open(systemSettingsURL)
    }

    /// The prompt alone (no deep link): used after a permission repair, when
    /// the pane is already open in front of the user and the reset has just
    /// unregistered Minne from it.
    static func requestPrompt() {
        // Spelled out rather than using `kAXTrustedCheckOptionPrompt`: that
        // constant imports as a mutable global, which Swift 6 rejects as
        // shared mutable state.
        let options = ["AXTrustedCheckOptionPrompt": true]
        _ = AXIsProcessTrustedWithOptions(options as CFDictionary)
    }

    private(set) var state: CapturePermissionState
    /// Called on the main actor whenever the grant flips.
    var onChange: (@MainActor (CapturePermissionState) -> Void)?

    private var timer: Timer?
    private var interval: TimeInterval?

    init() {
        state = AccessibilityPermission.current
    }

    func startPolling(interval: TimeInterval) {
        guard self.interval != interval else { return }
        self.interval = interval
        timer?.invalidate()
        let timer = Timer(timeInterval: interval, repeats: true) { [weak self] _ in
            Task { @MainActor in self?.poll() }
        }
        // .common so polling survives menu tracking and window drags.
        RunLoop.main.add(timer, forMode: .common)
        self.timer = timer
    }

    func stopPolling() {
        timer?.invalidate()
        timer = nil
        interval = nil
    }

    /// Checks now instead of waiting for the next tick (used when the
    /// onboarding window appears or the app is reactivated).
    func poll() {
        let observed = AccessibilityPermission.current
        guard observed != state else { return }
        state = observed
        BrainClient.log("accessibility permission is now \(observed)")
        onChange?(observed)
    }
}
