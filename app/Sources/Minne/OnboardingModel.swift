import Foundation

/// Where the first-run flow currently is.
enum OnboardingStep: Equatable, Sendable {
    /// What Minne captures, and what it never does.
    case welcome
    /// Waiting for the user to flip Minne on in System Settings.
    case requestPermission
    /// Permission observed as granted — confirmation screen.
    case granted
    /// Pick an AI provider and sign in to it.
    case chooseProvider
    /// Signed in — confirmation screen naming the account and model.
    case ready
    /// Nothing left to show; the window should close.
    case finished
}

/// The four entries the onboarding rail shows, in order. Fewer than there are
/// `OnboardingStep`s: `granted` is the accessibility step's confirmation, not a
/// station of its own, so the rail does not move for it.
enum OnboardingRailStep: Int, CaseIterable, Equatable, Sendable {
    case privacy
    case accessibility
    case provider
    case ready

    var title: String {
        switch self {
        case .privacy: return "Privacy"
        case .accessibility: return "Accessibility"
        case .provider: return "Provider"
        case .ready: return "Ready"
        }
    }
}

/// What a step renders below its bullets. The provider step owns a live view
/// of `AuthModel`; every other step is static text.
enum OnboardingPageKind: Equatable, Sendable {
    case info
    case providers
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

/// Where the stale-grant escalation on the permission step is (see
/// `PermissionRepair` for what "stale" means and why Settings cannot fix it).
enum PermissionRepairPhase: Equatable, Sendable {
    /// System Settings not opened yet, or the grant landed.
    case idle
    /// The user was sent to System Settings; the patience clock is running.
    case waiting(since: Date)
    /// Still missing after the patience window — offer the repair.
    case escalated
    /// tccutil is running.
    case repairing
}

/// The escalation section the permission step renders when the grant refuses
/// to land: an explanation in user words and a repair button.
struct RepairPresentation: Equatable, Sendable {
    let body: String
    let buttonTitle: String
    let inProgress: Bool
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
    /// What the body of the step is: static text, or the provider picker.
    let kind: OnboardingPageKind
    /// The stale-grant escalation, on the permission step only.
    let repair: RepairPresentation?
    /// Quiet small print under the buttons; the permission step uses it to
    /// say that Apple's own dialog never closes itself.
    let footnote: String?
    /// Which step the progress marks are on. `nil` on a page with no position.
    let rail: OnboardingRailStep?
    /// The account line on the closing screen, shown in its own row rather
    /// than buried in the body.
    let account: String?
    /// One thing worth learning before the window closes.
    let hint: String?

    init(
        title: String, body: String, bullets: [OnboardingBullet], primaryTitle: String,
        primaryAction: OnboardingAction, secondaryTitle: String?, isWaiting: Bool,
        kind: OnboardingPageKind = .info, repair: RepairPresentation? = nil,
        footnote: String? = nil, rail: OnboardingRailStep? = nil,
        account: String? = nil, hint: String? = nil
    ) {
        self.title = title
        self.body = body
        self.bullets = bullets
        self.primaryTitle = primaryTitle
        self.primaryAction = primaryAction
        self.secondaryTitle = secondaryTitle
        self.isWaiting = isWaiting
        self.kind = kind
        self.repair = repair
        self.footnote = footnote
        self.rail = rail
        self.account = account
        self.hint = hint
    }
}

/// First-run state machine. Pure and unit-tested; `OnboardingWindowController`
/// renders `page` and feeds user actions and AX-permission polls back in.
struct OnboardingState: Equatable, Sendable {
    /// How long the permission step waits after sending the user to System
    /// Settings before concluding the grant is stuck and offering the repair.
    static let repairPatience: TimeInterval = 15

    private(set) var step: OnboardingStep
    private(set) var permission: CapturePermissionState
    private(set) var repair: PermissionRepairPhase = .idle
    /// Account line of the last successful sign-in, for the closing screen.
    private(set) var signInSummary: String?

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
        case .granted:
            step = .chooseProvider
        case .chooseProvider, .ready, .finished:
            step = .finished
        }
    }

    /// Fed by `AuthModel`: a provider was signed in to. Returns true when the
    /// step changed, so the controller only re-renders on real transitions.
    @discardableResult
    mutating func signedIn(_ summary: String) -> Bool {
        signInSummary = summary
        guard step == .chooseProvider else { return false }
        step = .ready
        return true
    }

    /// "Set Up Later" — leaves the app in degraded no-capture mode, with the
    /// menu-bar hint as the standing reminder.
    mutating func skip() {
        step = .finished
    }

    // MARK: - Stale-grant escalation

    /// The user was just sent to System Settings: start (or keep) the
    /// patience clock. Once escalated, stays escalated — clicking the grant
    /// button again is not evidence the stale entry healed.
    mutating func sentToSettings(now: Date) {
        guard step == .requestPermission, repair == .idle else { return }
        repair = .waiting(since: now)
    }

    /// Clock tick (or the app becoming active after a Settings round trip).
    /// Returns true when the escalation just appeared, so the controller only
    /// re-renders on the transition.
    @discardableResult
    mutating func tick(now: Date) -> Bool {
        guard step == .requestPermission, permission == .missing,
            case .waiting(let since) = repair,
            now.timeIntervalSince(since) >= Self.repairPatience
        else { return false }
        repair = .escalated
        return true
    }

    /// How long the user must have been away before their return with the
    /// grant still missing counts as a failed attempt in Settings rather than
    /// an accidental switch back.
    static let returnGrace: TimeInterval = 4

    /// The app became active again — the user came back from System Settings.
    /// A return after a real visit with the grant still missing is the
    /// clearest sign of the stale switch, so it escalates ahead of the
    /// patience clock. Returns true when the escalation just appeared.
    @discardableResult
    mutating func returnedFromSettings(now: Date) -> Bool {
        guard step == .requestPermission, permission == .missing,
            case .waiting(let since) = repair,
            now.timeIntervalSince(since) >= Self.returnGrace
        else { return false }
        repair = .escalated
        return true
    }

    mutating func repairStarted() {
        guard repair == .escalated else { return }
        repair = .repairing
    }

    /// tccutil finished (either way): re-prompted, back to watching the
    /// clock — if the grant stays stuck the escalation returns.
    mutating func repairFinished(now: Date) {
        guard repair == .repairing else { return }
        repair = .waiting(since: now)
    }

    /// Debug hook (`-simulatePermissionDeadlock YES`): jump straight to the
    /// escalated state so the UI can be verified without real TCC damage.
    mutating func debugForceEscalation() {
        guard step == .requestPermission else { return }
        repair = .escalated
    }

    /// Feed from the AX poller. Returns true when the step changed, so the
    /// controller only re-renders on real transitions.
    @discardableResult
    mutating func permissionObserved(_ observed: CapturePermissionState) -> Bool {
        permission = observed
        if observed == .granted { repair = .idle }
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
        OnboardingModel.page(for: step, signInSummary: signInSummary, repair: repair)
    }
}

enum OnboardingModel {
    static func page(
        for step: OnboardingStep, signInSummary: String? = nil,
        repair: PermissionRepairPhase = .idle
    ) -> OnboardingPage? {
        switch step {
        case .welcome:
            return OnboardingPage(
                title: "Minne remembers what you work on",
                body: """
                    Minne reads the text of whatever window you have in front of you \
                    and turns it into a plain-markdown memory that stays on this Mac.
                    """,
                bullets: [
                    .init(
                        isPositive: true,
                        text:
                            "Reads the visible text of your foreground window through macOS Accessibility"
                    ),
                    .init(
                        isPositive: true,
                        text: "Stores it as plain markdown in ~/Minne, yours to edit or delete"),
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
                isWaiting: false,
                rail: .privacy)

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
                isWaiting: true,
                repair: repairPresentation(for: repair),
                footnote: """
                    Apple's permission dialog does not close by itself — once the \
                    switch is on, it is safe to close.
                    """,
                rail: .accessibility)

        case .granted:
            return OnboardingPage(
                title: "Accessibility granted",
                body: """
                    The permission landed — Minne can read your foreground window \
                    now. If Apple's permission dialog is still open, you can close \
                    it. One thing left: choose which AI you want it to think with.
                    """,
                bullets: [],
                primaryTitle: "Continue",
                primaryAction: .advance,
                secondaryTitle: nil,
                isWaiting: false,
                rail: .accessibility)

        case .chooseProvider:
            return OnboardingPage(
                title: "Choose your AI provider",
                body: """
                    Minne talks to one provider, with your own account. Your memory \
                    stays on this Mac either way — only the text of a question and the \
                    pages it needs are ever sent.
                    """,
                bullets: [],
                primaryTitle: "Done",
                primaryAction: .finish,
                secondaryTitle: "Set Up Later",
                isWaiting: false,
                kind: .providers,
                rail: .provider)

        case .ready:
            return OnboardingPage(
                title: "You're all set",
                body: """
                    Minne lives in the menu bar from here. It starts remembering as \
                    soon as you close this window.
                    """,
                bullets: [],
                primaryTitle: "Start Using Minne",
                primaryAction: .finish,
                secondaryTitle: nil,
                isWaiting: false,
                footnote: """
                    Pause capture or change any of this in Settings, any time.
                    """,
                rail: .ready,
                account: signInSummary,
                hint: "asks Minne anything, from any app")

        case .finished:
            return nil
        }
    }

    /// The escalation the permission step shows once the grant looks stuck.
    /// Calm on purpose: the user has just spent real time on a switch that
    /// did nothing, and the way out is one button.
    static func repairPresentation(for phase: PermissionRepairPhase) -> RepairPresentation? {
        switch phase {
        case .idle, .waiting:
            return nil
        case .escalated:
            return RepairPresentation(
                // The caption above this already asks "switch on, nothing
                // happening?", so the body answers rather than asking again.
                body: """
                    macOS may be holding on to a stale entry from an older copy of \
                    Minne — the switch can already look on, but it belongs to that \
                    old copy. Repair clears the stale entry, then asks for the \
                    permission again so a fresh switch can land.
                    """,
                buttonTitle: "Repair Permission",
                inProgress: false)
        case .repairing:
            return RepairPresentation(
                body: """
                    Clearing the stale entry. macOS will ask for the permission \
                    again in a moment.
                    """,
                buttonTitle: "Repairing…",
                inProgress: true)
        }
    }
}
