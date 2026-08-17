import AppKit
import XCTest

@testable import Minne

/// Scripted caret: what the AX layer would have found.
@MainActor
private final class FakeCaretLocator: CaretLocating {
    var target: CaretTarget? = CaretTarget(
        bundleIdentifier: "com.apple.TextEdit", appName: "TextEdit",
        anchor: CaretAnchor(rect: CGRect(x: 100, y: 200, width: 1, height: 18), source: .caret))
    private(set) var calls = 0

    func locateCaret() -> CaretTarget? {
        calls += 1
        return target
    }
}

@MainActor
private final class FakeOverlay: MinneKeyPresenting {
    private(set) var presented: [CaretTarget] = []
    private(set) var dismissals = 0
    var isPresenting = false
    /// Screen rectangle the overlay claims, in Quartz coordinates.
    var bounds = CGRect(x: 100, y: 200, width: 240, height: 44)

    func present(_ target: CaretTarget) {
        presented.append(target)
        isPresenting = true
    }

    func dismiss() {
        dismissals += 1
        isPresenting = false
    }

    func contains(quartzPoint: CGPoint) -> Bool {
        isPresenting && bounds.contains(quartzPoint)
    }
}

/// Stands in for the `CGEventTap`, so the controller's wiring is exercised
/// through the same three callbacks the real one uses.
@MainActor
private final class FakeTap: MinneKeyTapping {
    var onTap: (@MainActor () -> Void)?
    var onEscape: (@MainActor () -> Bool)?
    var onClick: (@MainActor (CGPoint) -> Void)?
    private(set) var invalidations = 0

    func invalidate() { invalidations += 1 }
}

/// When the Minne key wakes up, and what puts it away again.
@MainActor
final class MinneKeyControllerTests: XCTestCase {
    private var locator: FakeCaretLocator!
    private var overlay: FakeOverlay!
    private var taps: [FakeTap]!
    /// Set to false to simulate a tap that cannot be created.
    private var tapCanBeCreated = true
    /// Held for the length of the test: the tap's callbacks capture the
    /// controller weakly, so a released one would silently ignore every event.
    private var controller: MinneKeyController?

    override func setUp() async throws {
        locator = FakeCaretLocator()
        overlay = FakeOverlay()
        taps = []
        tapCanBeCreated = true
        controller = nil
    }

    override func tearDown() async throws {
        controller = nil
    }

    private func makeController(
        enabled: Bool = true, permission: CapturePermissionState = .granted
    ) -> MinneKeyController {
        let controller = MinneKeyController(
            locator: locator, presenter: overlay, enabled: enabled, permission: permission,
            makeTap: { [weak self] in
                guard let self, self.tapCanBeCreated else { return nil }
                let tap = FakeTap()
                self.taps.append(tap)
                return tap
            })
        self.controller = controller
        return controller
    }

    private var tap: FakeTap { taps.last! }

    // MARK: - When the tap exists

    func testTheTapIsInstalledWhenEnabledAndTrusted() {
        let controller = makeController()
        XCTAssertTrue(controller.isActive)
        XCTAssertEqual(taps.count, 1)
    }

    func testNoTapWithoutAccessibility() {
        let controller = makeController(permission: .missing)
        XCTAssertFalse(controller.isActive)
        XCTAssertTrue(taps.isEmpty)
    }

    func testNoTapWhenTurnedOffInSettings() {
        let controller = makeController(enabled: false)
        XCTAssertFalse(controller.isActive)
    }

    /// The setting takes effect immediately, both ways — no relaunch.
    func testTogglingTheSettingInstallsAndRemovesTheTapLive() {
        let controller = makeController(enabled: false)
        var actives: [Bool] = []
        controller.onActiveChange = { actives.append($0) }

        controller.setEnabled(true)
        XCTAssertTrue(controller.isActive)
        controller.setEnabled(false)
        XCTAssertFalse(controller.isActive)
        XCTAssertEqual(tap.invalidations, 1)
        XCTAssertEqual(actives, [true, false])
    }

    func testAGrantLandingStartsTheKey() {
        let controller = makeController(permission: .missing)
        XCTAssertFalse(controller.isActive)
        controller.update(permission: .granted)
        XCTAssertTrue(controller.isActive)
    }

    func testLosingTheGrantStopsTheKeyAndHidesTheOverlay() {
        let controller = makeController()
        tap.onTap?()
        XCTAssertTrue(overlay.isPresenting)

        controller.update(permission: .missing)
        XCTAssertFalse(controller.isActive)
        XCTAssertFalse(overlay.isPresenting)
    }

    /// A tap that will not install (Accessibility revoked between the check and
    /// the call) must leave the controller honestly inactive rather than
    /// claiming a key that does nothing.
    func testAFailedInstallationReportsInactive() {
        tapCanBeCreated = false
        let controller = makeController()
        XCTAssertFalse(controller.isActive)
    }

    // MARK: - Waking up

    func testATapShowsTheOverlayAtTheCaret() {
        let controller = makeController()
        tap.onTap?()
        XCTAssertEqual(overlay.presented.count, 1)
        XCTAssertEqual(overlay.presented.first?.anchor.rect.origin, CGPoint(x: 100, y: 200))
        XCTAssertTrue(controller.isActive)
    }

    func testNothingHappensWhenNoTextFieldIsFocused() {
        // Also the password-field case: the locator refuses to name a target.
        locator.target = nil
        makeControllerAndTap()
        XCTAssertTrue(overlay.presented.isEmpty)
        XCTAssertFalse(overlay.isPresenting)
    }

    func testASecondTapDismisses() {
        makeControllerAndTap()
        tap.onTap?()
        XCTAssertFalse(overlay.isPresenting)
        XCTAssertEqual(overlay.presented.count, 1)
        // The caret is not looked up again just to close the overlay.
        XCTAssertEqual(locator.calls, 1)
    }

    // MARK: - Going away

    func testEscapeDismissesAndIsSwallowed() {
        makeControllerAndTap()
        XCTAssertEqual(tap.onEscape?(), true)
        XCTAssertFalse(overlay.isPresenting)
    }

    /// The tap consumes Escape only while the overlay is up; at every other
    /// moment the key belongs to whatever the user is typing in.
    func testEscapePassesThroughWhenNothingIsShowing() {
        _ = makeController()
        XCTAssertEqual(tap.onEscape?(), false)
        XCTAssertEqual(overlay.dismissals, 0)
    }

    func testAClickElsewhereDismisses() {
        makeControllerAndTap()
        tap.onClick?(CGPoint(x: 900, y: 700))
        XCTAssertFalse(overlay.isPresenting)
    }

    func testAClickOnTheOverlayDoesNotDismiss() {
        makeControllerAndTap()
        tap.onClick?(CGPoint(x: 150, y: 210))
        XCTAssertTrue(overlay.isPresenting)
    }

    func testSwitchingAppDismisses() {
        let controller = makeControllerAndTap()
        controller.appSwitched()
        XCTAssertFalse(overlay.isPresenting)
    }

    @discardableResult
    private func makeControllerAndTap() -> MinneKeyController {
        let controller = makeController()
        tap.onTap?()
        return controller
    }
}
