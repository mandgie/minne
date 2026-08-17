import Foundation

/// User-facing brain connection state, published by `BrainClient.connectionStates`.
enum BrainConnectionState: Sendable, Equatable {
    case connecting
    case connected(brainVersion: String)
    case restarting(attempt: Int, retryAt: Date)
    /// Terminal: the client gave up (e.g. protocol mismatch, brain not found).
    case failed(reason: String)
    case stopped
}

/// Whether capture is paused. No capture engine exists yet (US-007/US-008);
/// the state is held so the menu and icon behave per spec, and the engine
/// will consult it once it exists.
enum PauseState: Sendable, Equatable {
    case active
    /// `until == nil` means paused until manually resumed.
    case paused(until: Date?)

    var isPaused: Bool {
        if case .paused = self { return true }
        return false
    }

    /// Collapses an expired timed pause back to `.active`.
    func resolved(now: Date) -> PauseState {
        if case .paused(.some(let until)) = self, until <= now { return .active }
        return self
    }
}

/// Everything volatile the status item shows, derived from state. Pure and
/// unit-tested; `StatusItemController` just applies it to AppKit objects.
struct MenuAppearance: Equatable {
    /// SF Symbol for the status-bar button.
    let symbolName: String
    /// Dimmed icon (NSStatusBarButton.appearsDisabled) when the brain is down.
    let appearsDisabled: Bool
    /// Disabled status row at the top of the menu.
    let statusText: String
    /// Title of the "Pause Capture" submenu parent item.
    let pauseItemTitle: String
}

enum MenuModel {
    static func appearance(
        connection: BrainConnectionState, pause: PauseState, now: Date
    ) -> MenuAppearance {
        let pause = pause.resolved(now: now)

        let statusText: String
        let disconnected: Bool
        switch connection {
        case .connecting:
            statusText = "Brain: starting…"
            disconnected = false
        case .connected(let version):
            statusText = "Brain: connected (v\(version))"
            disconnected = false
        case .restarting(let attempt, let retryAt):
            let seconds = Int(max(0, retryAt.timeIntervalSince(now)).rounded(.up))
            statusText = "Brain: restarting (attempt \(attempt), retry in \(seconds)s)"
            disconnected = true
        case .failed(let reason):
            statusText = "Brain: failed — \(reason)"
            disconnected = true
        case .stopped:
            statusText = "Brain: stopped"
            disconnected = true
        }

        let pauseItemTitle: String
        switch pause {
        case .active:
            pauseItemTitle = "Pause Capture"
        case .paused(nil):
            pauseItemTitle = "Capture Paused"
        case .paused(.some(let until)):
            let minutes = Int((until.timeIntervalSince(now) / 60).rounded(.up))
            pauseItemTitle =
                minutes >= 1
                ? "Capture Paused (\(minutes) min left)"
                : "Capture Paused (<1 min left)"
        }

        // Disconnected outranks paused: a down brain is the more urgent signal.
        let symbolName = !disconnected && pause.isPaused ? "pause.circle" : "brain"
        return MenuAppearance(
            symbolName: symbolName,
            appearsDisabled: disconnected,
            statusText: statusText,
            pauseItemTitle: pauseItemTitle)
    }
}
