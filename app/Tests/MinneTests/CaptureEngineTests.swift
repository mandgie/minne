import XCTest

@testable import Minne

/// Scripted stand-in for the Accessibility tree, so the engine's scheduling
/// can be driven deterministically without a window server or a TCC grant.
@MainActor
private final class FakeWindowSource: FocusedWindowSource {
    var onFocusChange: (@MainActor () -> Void)?

    var window: WindowIdentity?
    var text = "some window text worth capturing right here"
    var url: String?
    /// How many times the expensive extraction ran.
    private(set) var walks = 0
    private(set) var observing = false

    func startObserving() { observing = true }
    func stopObserving() { observing = false }
    func currentWindow() -> WindowIdentity? { window }

    func readFocusedWindow(byteBudget: Int) -> CaptureCandidate? {
        walks += 1
        guard let window else { return nil }
        return CaptureCandidate(window: window, url: url, text: text)
    }
}

@MainActor
final class CaptureEngineTests: XCTestCase {
    private let start = Date(timeIntervalSince1970: 2_000_000)

    private func window(_ title: String) -> WindowIdentity {
        WindowIdentity(bundleIdentifier: "com.example.app", appName: "Example", windowTitle: title)
    }

    private func makeEngine(permission: CapturePermissionState = .granted)
        -> (engine: CaptureEngine, source: FakeWindowSource, snapshots: Box)
    {
        let source = FakeWindowSource()
        source.window = window("Docs")
        let engine = CaptureEngine(source: source, permission: permission)
        let box = Box()
        engine.onSnapshot = { box.snapshots.append($0) }
        return (engine, source, box)
    }

    /// Reference holder so the snapshot callback can accumulate without
    /// capturing a `var` in an escaping closure.
    private final class Box {
        var snapshots: [CaptureSnapshot] = []
    }

    func testUnchangedWindowIsWalkedOncePerDebounceIntervalAndEmittedOnce() {
        let (engine, source, box) = makeEngine()
        // 60 s of 5 s ticks with nothing changing on screen.
        for step in stride(from: 0.0, through: 60.0, by: 5) {
            engine.tick(trigger: .timer, now: start.addingTimeInterval(step))
        }
        XCTAssertEqual(source.walks, 5, "13 ticks, but a tree walk only every 15 s")
        XCTAssertEqual(box.snapshots.count, 1, "the window never changed, so one snapshot")
    }

    func testChangedTextInTheSameWindowEmitsAgain() {
        let (engine, source, box) = makeEngine()
        engine.tick(trigger: .focusChange, now: start)
        source.text = "a completely different body of prose now fills this window"
        engine.tick(trigger: .timer, now: start.addingTimeInterval(15))
        XCTAssertEqual(box.snapshots.count, 2)
    }

    func testSwitchingWindowsEmitsImmediately() {
        let (engine, source, box) = makeEngine()
        engine.tick(trigger: .focusChange, now: start)
        source.window = window("Mail")
        source.text = "an entirely unrelated message thread about the Oslo trip"
        engine.tick(trigger: .focusChange, now: start.addingTimeInterval(1))
        XCTAssertEqual(box.snapshots.count, 2)
        XCTAssertEqual(box.snapshots.last?.windowTitle, "Mail")
    }

    func testMissingPermissionNeverTouchesTheTree() {
        let (engine, source, box) = makeEngine(permission: .missing)
        engine.tick(trigger: .focusChange, now: start)
        engine.tick(trigger: .timer, now: start.addingTimeInterval(20))
        XCTAssertEqual(source.walks, 0)
        XCTAssertTrue(box.snapshots.isEmpty)
    }

    func testPauseStopsCaptureAndResumeStartsItAgain() {
        let (engine, source, box) = makeEngine()
        engine.tick(trigger: .focusChange, now: start)
        XCTAssertEqual(source.walks, 1)

        engine.update(pause: .paused(until: nil))
        engine.tick(trigger: .timer, now: start.addingTimeInterval(20))
        engine.tick(trigger: .focusChange, now: start.addingTimeInterval(21))
        XCTAssertEqual(source.walks, 1, "paused means no tree walks at all")

        engine.update(pause: .active)
        source.text = "the window moved on to something else entirely while paused"
        engine.tick(trigger: .timer, now: start.addingTimeInterval(40))
        XCTAssertEqual(box.snapshots.count, 2)
    }

    func testGrantingPermissionMidSessionStartsCapture() {
        let (engine, _, box) = makeEngine(permission: .missing)
        engine.start()
        defer { engine.stop() }
        XCTAssertTrue(box.snapshots.isEmpty)
        engine.update(permission: .granted)
        XCTAssertEqual(box.snapshots.count, 1)
    }

    func testStartAndStopDriveTheObserver() {
        let (engine, source, _) = makeEngine()
        XCTAssertFalse(source.observing)
        engine.start()
        XCTAssertTrue(source.observing)
        engine.stop()
        XCTAssertFalse(source.observing)
    }

    func testFocusChangeCallbackIsIgnoredWhileStoppedAndHonouredWhileRunning() {
        let (engine, source, box) = makeEngine()
        source.onFocusChange?()
        XCTAssertEqual(source.walks, 0, "a stopped engine ignores stray observer callbacks")

        engine.start()
        defer { engine.stop() }
        XCTAssertEqual(box.snapshots.count, 1, "start() captures whatever is already in front")
        source.window = window("Mail")
        source.text = "an entirely unrelated message thread about the Oslo trip"
        source.onFocusChange?()
        XCTAssertEqual(box.snapshots.count, 2)
    }

    func testNoFocusedWindowProducesNothing() {
        let (engine, source, box) = makeEngine()
        source.window = nil
        engine.tick(trigger: .focusChange, now: start)
        XCTAssertEqual(source.walks, 0)
        XCTAssertTrue(box.snapshots.isEmpty)
    }
}
