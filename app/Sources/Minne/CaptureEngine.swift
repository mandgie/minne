import Foundation

/// The engine's one impure seam: everything that has to ask the system what
/// the user is looking at. Isolating it here keeps `CaptureScheduler` pure and
/// lets the engine be driven by a scripted fake in tests — an AX tree walk is
/// not something a unit test can stand up.
@MainActor
protocol FocusedWindowSource: AnyObject {
    /// Fires when the frontmost app, its focused window, or that window's
    /// title changes.
    var onFocusChange: (@MainActor () -> Void)? { get set }

    func startObserving()
    func stopObserving()

    /// Identity of the focused window, cheap enough to call on every tick:
    /// a couple of attribute reads, no tree walk.
    func currentWindow() -> WindowIdentity?

    /// Walks the focused window's tree and extracts its visible text. The
    /// expensive call — only made after the scheduler says so.
    func readFocusedWindow(byteBudget: Int) -> CaptureCandidate?
}

/// Watches the foreground window and emits `CaptureSnapshot`s.
///
/// Thin by design: it wires the focus observer and the poll timer to
/// `CaptureScheduler`, which owns every decision. Snapshots are handed to
/// `onSnapshot`, which `MinneApp` routes into the `SourceStore`.
@MainActor
final class CaptureEngine {
    var onSnapshot: (@MainActor (CaptureSnapshot) -> Void)?

    private let source: FocusedWindowSource
    private var scheduler: CaptureScheduler
    private let configuration: CaptureScheduler.Configuration

    private var permission: CapturePermissionState
    private var pause: PauseState = .active
    private var timer: Timer?
    private var running = false
    /// Last exclusion logged, so the same one is not repeated every tick.
    private var lastExclusionKey: String?

    init(
        source: FocusedWindowSource,
        permission: CapturePermissionState,
        configuration: CaptureScheduler.Configuration = CaptureScheduler.Configuration()
    ) {
        self.source = source
        self.permission = permission
        self.configuration = configuration
        self.scheduler = CaptureScheduler(configuration: configuration)
        source.onFocusChange = { [weak self] in
            guard let self, self.running else { return }
            self.tick(trigger: .focusChange)
        }
    }

    func start() {
        guard !running else { return }
        running = true
        source.startObserving()
        let timer = Timer(timeInterval: configuration.pollInterval, repeats: true) {
            [weak self] _ in
            Task { @MainActor in self?.tick(trigger: .timer) }
        }
        // .common so capture keeps ticking while a menu is open or a window
        // is being dragged.
        RunLoop.main.add(timer, forMode: .common)
        self.timer = timer
        tick(trigger: .focusChange)
    }

    func stop() {
        running = false
        timer?.invalidate()
        timer = nil
        source.stopObserving()
    }

    func update(permission: CapturePermissionState) {
        guard permission != self.permission else { return }
        self.permission = permission
        // A fresh grant should start capturing without waiting for a tick.
        if running && permission.isGranted { tick(trigger: .focusChange) }
    }

    /// An edited blacklist (US-015) reaches the running engine here — the next
    /// tick, at most five seconds away, already honours it.
    func update(blacklist: CaptureBlacklist) {
        guard blacklist != scheduler.configuration.blacklist else { return }
        scheduler.update(blacklist: blacklist)
        BrainClient.log(
            "capture blacklist updated: \(blacklist.bundleIdentifiers.count) app(s), \(blacklist.domains.count) domain(s)"
        )
    }

    func update(pause: PauseState) {
        guard pause != self.pause else { return }
        self.pause = pause
        if running && !pause.isPaused { tick(trigger: .focusChange) }
    }

    /// One evaluation cycle. Exposed for tests, which drive it directly
    /// instead of waiting on real timers.
    @discardableResult
    func tick(trigger: CaptureScheduler.Trigger, now: Date = Date()) -> CaptureSnapshot? {
        let window = source.currentWindow()
        let decision = scheduler.decide(
            trigger: trigger, window: window, permission: permission, pause: pause, now: now)
        guard case .capture = decision else {
            if case .skip(.blacklistedApp) = decision { noteExclusion("blacklisted app", window) }
            if case .skip(.privateWindow) = decision { noteExclusion("private window", window) }
            return nil
        }
        guard let candidate = source.readFocusedWindow(byteBudget: configuration.maxSnapshotBytes)
        else { return nil }
        switch scheduler.accept(candidate, now: now) {
        case .accepted(let snapshot):
            onSnapshot?(snapshot)
            return snapshot
        case .rejected(.blacklistedDomain):
            noteExclusion("blacklisted domain", candidate.window)
            return nil
        case .rejected:
            return nil
        }
    }

    /// Exclusions are the one skip worth a log line: "why did Minne learn
    /// nothing about my bank?" is a question the user will ask. Recorded once
    /// per window and reason so the 5 s poll cannot flood stderr, and never
    /// with the window title or URL, which are the parts that could be
    /// sensitive.
    private func noteExclusion(_ reason: String, _ window: WindowIdentity?) {
        let key = "\(reason)|\(window?.bundleIdentifier ?? "-")|\(window?.windowTitle ?? "-")"
        guard key != lastExclusionKey else { return }
        lastExclusionKey = key
        BrainClient.log("capture skipped — \(reason): \(window?.appName ?? "unknown app")")
    }
}
