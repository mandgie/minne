import XCTest

@testable import Minne

final class MenuModelTests: XCTestCase {
    private let now = Date(timeIntervalSince1970: 1_000_000)

    func testConnectedActive() {
        let appearance = MenuModel.appearance(
            connection: .connected(brainVersion: "0.1.0"), pause: .active, now: now)
        XCTAssertEqual(appearance.symbolName, "brain")
        XCTAssertFalse(appearance.appearsDisabled)
        XCTAssertEqual(appearance.statusText, "Brain: connected (v0.1.0)")
        XCTAssertEqual(appearance.pauseItemTitle, "Pause Capture")
    }

    func testConnectingShowsStarting() {
        let appearance = MenuModel.appearance(connection: .connecting, pause: .active, now: now)
        XCTAssertEqual(appearance.statusText, "Brain: starting…")
        XCTAssertFalse(appearance.appearsDisabled)
    }

    func testPausedTimedShowsMinutesLeftAndPauseIcon() {
        let appearance = MenuModel.appearance(
            connection: .connected(brainVersion: "0.1.0"),
            pause: .paused(until: now.addingTimeInterval(15 * 60)), now: now)
        XCTAssertEqual(appearance.symbolName, "pause.circle")
        XCTAssertFalse(appearance.appearsDisabled)
        XCTAssertEqual(appearance.pauseItemTitle, "Capture Paused (15 min left)")
    }

    func testPausedUnderAMinute() {
        let appearance = MenuModel.appearance(
            connection: .connected(brainVersion: "0.1.0"),
            pause: .paused(until: now.addingTimeInterval(30)), now: now)
        XCTAssertEqual(appearance.pauseItemTitle, "Capture Paused (1 min left)")
    }

    func testPausedIndefinitely() {
        let appearance = MenuModel.appearance(
            connection: .connected(brainVersion: "0.1.0"), pause: .paused(until: nil), now: now)
        XCTAssertEqual(appearance.symbolName, "pause.circle")
        XCTAssertEqual(appearance.pauseItemTitle, "Capture Paused")
    }

    func testExpiredPauseResolvesToActive() {
        let stale = PauseState.paused(until: now.addingTimeInterval(-1))
        XCTAssertEqual(stale.resolved(now: now), .active)
        let appearance = MenuModel.appearance(
            connection: .connected(brainVersion: "0.1.0"), pause: stale, now: now)
        XCTAssertEqual(appearance.symbolName, "brain")
        XCTAssertEqual(appearance.pauseItemTitle, "Pause Capture")
    }

    func testRestartingShowsAttemptAndCountdownDisabled() {
        let appearance = MenuModel.appearance(
            connection: .restarting(attempt: 3, retryAt: now.addingTimeInterval(2)),
            pause: .active, now: now)
        XCTAssertTrue(appearance.appearsDisabled)
        XCTAssertEqual(appearance.statusText, "Brain: restarting (attempt 3, retry in 2s)")
    }

    func testRestartCountdownNeverNegative() {
        let appearance = MenuModel.appearance(
            connection: .restarting(attempt: 1, retryAt: now.addingTimeInterval(-5)),
            pause: .active, now: now)
        XCTAssertEqual(appearance.statusText, "Brain: restarting (attempt 1, retry in 0s)")
    }

    func testDisconnectedOutranksPausedForIcon() {
        let appearance = MenuModel.appearance(
            connection: .failed(reason: "boom"), pause: .paused(until: nil), now: now)
        XCTAssertEqual(appearance.symbolName, "brain")
        XCTAssertTrue(appearance.appearsDisabled)
        XCTAssertEqual(appearance.statusText, "Brain: failed — boom")
        XCTAssertEqual(appearance.pauseItemTitle, "Capture Paused")
    }

    func testStopped() {
        let appearance = MenuModel.appearance(connection: .stopped, pause: .active, now: now)
        XCTAssertTrue(appearance.appearsDisabled)
        XCTAssertEqual(appearance.statusText, "Brain: stopped")
    }
}
