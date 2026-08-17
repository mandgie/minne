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
/// `onSnapshot`; persistence arrives with US-009.
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

    func update(pause: PauseState) {
        guard pause != self.pause else { return }
        self.pause = pause
        if running && !pause.isPaused { tick(trigger: .focusChange) }
    }

    /// One evaluation cycle. Exposed for tests, which drive it directly
    /// instead of waiting on real timers.
    @discardableResult
    func tick(trigger: CaptureScheduler.Trigger, now: Date = Date()) -> CaptureSnapshot? {
        let decision = scheduler.decide(
            trigger: trigger, window: source.currentWindow(), permission: permission,
            pause: pause, now: now)
        guard case .capture = decision else { return nil }
        guard let candidate = source.readFocusedWindow(byteBudget: configuration.maxSnapshotBytes)
        else { return nil }
        guard case .accepted(let snapshot) = scheduler.accept(candidate, now: now) else {
            return nil
        }
        onSnapshot?(snapshot)
        return snapshot
    }
}
