import Foundation

/// Where the first-run flow currently is.
enum OnboardingStep: Equatable, Sendable {
    /// What Minne captures, and what it never does.
    case welcome
    /// Waiting for the user to flip Minne on in System Settings.
    case requestPermission
    /// Permission observed as granted — confirmation screen.
    case granted
    /// Nothing left to show; the window should close.
    case finished
}

/// What the primary button does on the current step. Keeps the window
/// controller free of flow decisions.
enum OnboardingAction: Equatable, Sendable {
    case advance
    case openSystemSettings
    case finish
}

struct OnboardingBullet: Equatable, Sendable {
    /// `true` = something Minne does, `false` = something that never happens.
    let isPositive: Bool
    let text: String
}

/// Everything one onboarding screen renders, derived purely from the step.
struct OnboardingPage: Equatable, Sendable {
    let title: String
    let body: String
    let bullets: [OnboardingBullet]
    let primaryTitle: String
    let primaryAction: OnboardingAction
    /// `nil` hides the secondary button.
    let secondaryTitle: String?
    /// Show the "still watching for the grant" spinner and note.
    let isWaiting: Bool
}

/// First-run state machine. Pure and unit-tested; `OnboardingWindowController`
/// renders `page` and feeds user actions and AX-permission polls back in.
struct OnboardingState: Equatable, Sendable {
    private(set) var step: OnboardingStep
    private(set) var permission: CapturePermissionState

    init(permission: CapturePermissionState, step: OnboardingStep = .welcome) {
        self.permission = permission
        self.step = step
    }

    /// The primary button was clicked. Opening System Settings is the
    /// controller's job — the step only ends when polling sees the grant.
    mutating func advance() {
        switch step {
        case .welcome:
            // Already trusted (a reinstall, or the user got there first):
            // skip straight past the request screen.
            step = permission == .granted ? .granted : .requestPermission
        case .requestPermission:
            break
        case .granted, .finished:
            step = .finished
        }
    }

    /// "Set Up Later" — leaves the app in degraded no-capture mode, with the
    /// menu-bar hint as the standing reminder.
    mutating func skip() {
        step = .finished
    }

    /// Feed from the AX poller. Returns true when the step changed, so the
    /// controller only re-renders on real transitions.
    @discardableResult
    mutating func permissionObserved(_ observed: CapturePermissionState) -> Bool {
        permission = observed
        switch (step, observed) {
        case (.requestPermission, .granted):
            step = .granted
            return true
        case (.granted, .missing):
            // Revoked while the confirmation screen was up — ask again.
            step = .requestPermission
            return true
        default:
            return false
        }
    }

    /// `nil` once the flow is over: the window should close.
    var page: OnboardingPage? {
        OnboardingModel.page(for: step)
    }
}

enum OnboardingModel {
    static func page(for step: OnboardingStep) -> OnboardingPage? {
        switch step {
        case .welcome:
            return OnboardingPage(
                title: "Minne remembers what you work on",
                body: """
                    Minne reads the text of whatever window you have in front of you \
                    and turns it into a plain-markdown memory that stays on this Mac. \
                    Here is exactly what that does and does not mean.
                    """,
                bullets: [
                    .init(
                        isPositive: true,
                        text:
                            "Reads the visible text of your foreground window through macOS Accessibility"
                    ),
                    .init(
                        isPositive: true,
                        text:
                            "Stores it as markdown files in ~/Minne, yours to read, edit or delete"
                    ),
                    .init(
                        isPositive: true,
                        text: "Talks only to the AI provider you sign in with yourself"),
                    .init(
                        isPositive: false,
                        text: "Never takes screenshots or records your screen"),
                    .init(
                        isPositive: false,
                        text: "Never uploads or syncs your memory to any cloud service"),
                    .init(
                        isPositive: false,
                        text: "Never captures password fields, and skips apps you blacklist"),
                ],
                primaryTitle: "Continue",
                primaryAction: .advance,
                secondaryTitle: nil,
                isWaiting: false)

        case .requestPermission:
            return OnboardingPage(
                title: "Grant Accessibility access",
                body: """
                    macOS keeps window text behind the Accessibility permission. \
                    Open System Settings, go to Privacy & Security ▸ Accessibility, \
                    and switch Minne on.
                    """,
                bullets: [
                    .init(
                        isPositive: true,
                        text: "Minne checks continuously and moves on the moment you grant it"),
                    .init(
                        isPositive: false,
                        text:
                            "Without it Minne still runs — menu bar and chat work, capture stays off"
                    ),
                ],
                primaryTitle: "Open System Settings",
                primaryAction: .openSystemSettings,
                secondaryTitle: "Set Up Later",
                isWaiting: true)

        case .granted:
            return OnboardingPage(
                title: "Accessibility granted",
                body: """
                    Minne can read your foreground window now. Everything else lives \
                    in the menu bar: chat with your memory, pause capture whenever you \
                    want, and open Settings to sign in to your AI provider.
                    """,
                bullets: [],
                primaryTitle: "Start Using Minne",
                primaryAction: .finish,
                secondaryTitle: nil,
                isWaiting: false)

        case .finished:
            return nil
        }
    }
}
