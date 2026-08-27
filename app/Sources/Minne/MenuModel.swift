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
    /// Disabled first row naming the app and its version.
    let versionText: String
    /// Clickable "Update Available" row under it; `nil` hides it.
    let updateText: String?
    /// Disabled status row at the top of the menu.
    let statusText: String
    /// Disabled row naming the signed-in provider and model.
    let accountText: String
    /// Disabled row summarizing the capture store ("Memory: 4 812 snapshots ·
    /// last capture 2 min ago"); `nil` before the store has reported.
    let storageText: String?
    /// Clickable alarm row when memory is not being saved or search is broken;
    /// opens Settings → Memory. `nil` while storage is healthy.
    let storageAlertText: String?
    /// Title of the "Pause Capture" submenu parent item.
    let pauseItemTitle: String
    /// Persistent hint row shown while capture cannot run; `nil` hides it.
    /// Doubles as the status button's tooltip.
    let hintText: String?
}

enum MenuModel {
    /// `account` is the brain's last reported auth state; nil means no `status`
    /// has answered yet, which is a different thing from being signed out.
    static func appearance(
        connection: BrainConnectionState, permission: CapturePermissionState, pause: PauseState,
        account: AuthState? = nil, appVersion: String? = nil, update: UpdateInfo? = nil,
        storage: StorageHealth? = nil,
        now: Date
    ) -> MenuAppearance {
        let pause = pause.resolved(now: now)

        // The bundle's version when there is one; the bare dev executable has
        // no Info.plist, so fall back to the connected brain's version — the
        // same VERSION file by the other route.
        let versionText: String
        if let appVersion {
            versionText = "Minne v\(appVersion)"
        } else if case .connected(let brainVersion) = connection {
            versionText = "Minne v\(brainVersion)"
        } else {
            versionText = "Minne"
        }

        var updateText: String?
        if let update, update.updateAvailable {
            updateText =
                update.latest.map { "Update Available — v\($0)…" } ?? "Update Available…"
        }

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

        // What the storage rows say. The summary row is always there once the
        // store has reported (memory should be visibly alive, not silently
        // assumed); the alarm row only exists when something needs the user.
        var storageText: String?
        var storageAlertText: String?
        switch storage {
        case nil:
            break
        case .healthy(let snapshots, let lastCaptureAt):
            var line = "Memory: \(snapshots) snapshot\(snapshots == 1 ? "" : "s")"
            if let lastCaptureAt {
                line += " · last capture \(StorageHealth.relative(lastCaptureAt, now: now))"
            }
            storageText = line
        case .degraded(let reason, let lastCaptureAt):
            var line = "Memory: capturing, search offline"
            if let lastCaptureAt {
                line += " · last capture \(StorageHealth.relative(lastCaptureAt, now: now))"
            }
            storageText = line
            storageAlertText = "Search broken — \(reason). Rebuild…"
        case .failing(let reason):
            storageText = "Memory: not being saved"
            storageAlertText = "Memory not being saved — \(reason)…"
        case .unavailable(let reason):
            storageText = "Memory: unavailable"
            storageAlertText = "Memory unavailable — \(reason)…"
        }

        // Precedence, most urgent first: a down brain (dimmed icon) outranks
        // broken storage, which outranks a missing permission, which outranks
        // a user-chosen pause.
        let symbolName: String
        if disconnected {
            symbolName = "brain"
        } else if storage?.isCritical == true || !permission.isGranted {
            symbolName = "exclamationmark.triangle"
        } else if pause.isPaused {
            symbolName = "pause.circle"
        } else {
            symbolName = "brain"
        }

        return MenuAppearance(
            symbolName: symbolName,
            appearsDisabled: disconnected,
            versionText: versionText,
            updateText: updateText,
            statusText: statusText,
            accountText: "Account: \(account?.accountSummary ?? "checking…")",
            storageText: storageText,
            storageAlertText: storageAlertText,
            pauseItemTitle: pauseItemTitle,
            hintText: permission.isGranted
                ? nil : "Capture off — grant Accessibility access…")
    }
}
