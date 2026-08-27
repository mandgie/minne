import XCTest

@testable import Minne

final class MenuModelTests: XCTestCase {
    private let now = Date(timeIntervalSince1970: 1_000_000)

    func testConnectedActive() {
        let appearance = MenuModel.appearance(
            connection: .connected(brainVersion: "0.1.0"), permission: .granted, pause: .active,
            now: now)
        XCTAssertEqual(appearance.symbolName, "brain")
        XCTAssertFalse(appearance.appearsDisabled)
        XCTAssertEqual(appearance.statusText, "Brain: connected (v0.1.0)")
        XCTAssertEqual(appearance.pauseItemTitle, "Pause Capture")
        XCTAssertNil(appearance.hintText, "no hint while capture can actually run")
    }

    func testMissingPermissionShowsPersistentHintAndWarningIcon() {
        let appearance = MenuModel.appearance(
            connection: .connected(brainVersion: "0.1.0"), permission: .missing, pause: .active,
            now: now)
        XCTAssertEqual(appearance.symbolName, "exclamationmark.triangle")
        XCTAssertFalse(appearance.appearsDisabled, "the brain is fine; only capture is off")
        XCTAssertEqual(appearance.hintText, "Capture off — grant Accessibility access…")
        XCTAssertEqual(appearance.statusText, "Brain: connected (v0.1.0)")
    }

    func testMissingPermissionOutranksPauseForIcon() {
        let appearance = MenuModel.appearance(
            connection: .connected(brainVersion: "0.1.0"), permission: .missing,
            pause: .paused(until: nil), now: now)
        XCTAssertEqual(appearance.symbolName, "exclamationmark.triangle")
        XCTAssertEqual(appearance.pauseItemTitle, "Capture Paused")
    }

    func testDisconnectedOutranksMissingPermissionForIcon() {
        let appearance = MenuModel.appearance(
            connection: .failed(reason: "boom"), permission: .missing, pause: .active, now: now)
        XCTAssertEqual(appearance.symbolName, "brain")
        XCTAssertTrue(appearance.appearsDisabled)
        XCTAssertNotNil(appearance.hintText, "the hint stays regardless of brain state")
    }

    func testConnectingShowsStarting() {
        let appearance = MenuModel.appearance(
            connection: .connecting, permission: .granted, pause: .active, now: now)
        XCTAssertEqual(appearance.statusText, "Brain: starting…")
        XCTAssertFalse(appearance.appearsDisabled)
    }

    func testPausedTimedShowsMinutesLeftAndPauseIcon() {
        let appearance = MenuModel.appearance(
            connection: .connected(brainVersion: "0.1.0"),
            permission: .granted, pause: .paused(until: now.addingTimeInterval(15 * 60)), now: now)
        XCTAssertEqual(appearance.symbolName, "pause.circle")
        XCTAssertFalse(appearance.appearsDisabled)
        XCTAssertEqual(appearance.pauseItemTitle, "Capture Paused (15 min left)")
    }

    func testPausedUnderAMinute() {
        let appearance = MenuModel.appearance(
            connection: .connected(brainVersion: "0.1.0"),
            permission: .granted, pause: .paused(until: now.addingTimeInterval(30)), now: now)
        XCTAssertEqual(appearance.pauseItemTitle, "Capture Paused (1 min left)")
    }

    func testPausedIndefinitely() {
        let appearance = MenuModel.appearance(
            connection: .connected(brainVersion: "0.1.0"), permission: .granted,
            pause: .paused(until: nil), now: now)
        XCTAssertEqual(appearance.symbolName, "pause.circle")
        XCTAssertEqual(appearance.pauseItemTitle, "Capture Paused")
    }

    func testExpiredPauseResolvesToActive() {
        let stale = PauseState.paused(until: now.addingTimeInterval(-1))
        XCTAssertEqual(stale.resolved(now: now), .active)
        let appearance = MenuModel.appearance(
            connection: .connected(brainVersion: "0.1.0"), permission: .granted, pause: stale,
            now: now)
        XCTAssertEqual(appearance.symbolName, "brain")
        XCTAssertEqual(appearance.pauseItemTitle, "Pause Capture")
    }

    func testRestartingShowsAttemptAndCountdownDisabled() {
        let appearance = MenuModel.appearance(
            connection: .restarting(attempt: 3, retryAt: now.addingTimeInterval(2)),
            permission: .granted, pause: .active, now: now)
        XCTAssertTrue(appearance.appearsDisabled)
        XCTAssertEqual(appearance.statusText, "Brain: restarting (attempt 3, retry in 2s)")
    }

    func testRestartCountdownNeverNegative() {
        let appearance = MenuModel.appearance(
            connection: .restarting(attempt: 1, retryAt: now.addingTimeInterval(-5)),
            permission: .granted, pause: .active, now: now)
        XCTAssertEqual(appearance.statusText, "Brain: restarting (attempt 1, retry in 0s)")
    }

    func testDisconnectedOutranksPausedForIcon() {
        let appearance = MenuModel.appearance(
            connection: .failed(reason: "boom"), permission: .granted, pause: .paused(until: nil),
            now: now)
        XCTAssertEqual(appearance.symbolName, "brain")
        XCTAssertTrue(appearance.appearsDisabled)
        XCTAssertEqual(appearance.statusText, "Brain: failed — boom")
        XCTAssertEqual(appearance.pauseItemTitle, "Capture Paused")
    }

    func testStopped() {
        let appearance = MenuModel.appearance(
            connection: .stopped, permission: .granted, pause: .active, now: now)
        XCTAssertTrue(appearance.appearsDisabled)
        XCTAssertEqual(appearance.statusText, "Brain: stopped")
    }

    // MARK: - Version row

    func testVersionRowNamesTheBundleVersion() {
        let appearance = MenuModel.appearance(
            connection: .connecting, permission: .granted, pause: .active,
            appVersion: "0.1.9", now: now)
        XCTAssertEqual(appearance.versionText, "Minne v0.1.9")
    }

    func testVersionRowFallsBackToTheConnectedBrain() {
        // The bare dev executable has no bundle version; the brain reports the
        // same VERSION file over `hello`, so a connected brain fills the row.
        let appearance = MenuModel.appearance(
            connection: .connected(brainVersion: "0.1.9"), permission: .granted, pause: .active,
            appVersion: nil, now: now)
        XCTAssertEqual(appearance.versionText, "Minne v0.1.9")
    }

    func testVersionRowWithNothingToSayIsJustTheName() {
        let appearance = MenuModel.appearance(
            connection: .connecting, permission: .granted, pause: .active, now: now)
        XCTAssertEqual(appearance.versionText, "Minne")
    }

    // MARK: - Update row

    func testUpdateRowHiddenWithoutACheckOrWhenCurrent() {
        let none = MenuModel.appearance(
            connection: .connected(brainVersion: "0.1.9"), permission: .granted, pause: .active,
            now: now)
        XCTAssertNil(none.updateText)
        let current = MenuModel.appearance(
            connection: .connected(brainVersion: "0.1.9"), permission: .granted, pause: .active,
            update: UpdateInfo(updateAvailable: false, latest: "0.1.9", url: nil), now: now)
        XCTAssertNil(current.updateText)
    }

    func testUpdateRowNamesTheNewerVersion() {
        let appearance = MenuModel.appearance(
            connection: .connected(brainVersion: "0.1.9"), permission: .granted, pause: .active,
            update: UpdateInfo(
                updateAvailable: true, latest: "0.2.0",
                url: "https://github.com/mandgie/minne/releases/tag/v0.2.0"),
            now: now)
        XCTAssertEqual(appearance.updateText, "Update Available — v0.2.0…")
    }

    func testUpdateInfoParsesTheBrainsAnswer() {
        let result = JSONValue.object([
            "version": .string("0.1.9"),
            "updateAvailable": .bool(true),
            "latest": .string("0.2.0"),
            "url": .string("https://example.test/releases/v0.2.0"),
        ])
        XCTAssertEqual(
            UpdateInfo.parse(result),
            UpdateInfo(
                updateAvailable: true, latest: "0.2.0",
                url: "https://example.test/releases/v0.2.0"))
        XCTAssertNil(UpdateInfo.parse(.object(["version": .string("0.1.9")])))
        XCTAssertNil(UpdateInfo.parse(nil))
    }

    // MARK: - Storage health

    func testHealthyStorageShowsTheSummaryRowAndNoAlarm() {
        let appearance = MenuModel.appearance(
            connection: .connected(brainVersion: "0.1.9"), permission: .granted, pause: .active,
            storage: .healthy(snapshots: 4812, lastCaptureAt: now.addingTimeInterval(-120)),
            now: now)
        XCTAssertEqual(appearance.storageText, "Memory: 4812 snapshots · last capture 2 min ago")
        XCTAssertNil(appearance.storageAlertText)
        XCTAssertEqual(appearance.symbolName, "brain")
    }

    func testNoStorageReportYetShowsNoRows() {
        let appearance = MenuModel.appearance(
            connection: .connected(brainVersion: "0.1.9"), permission: .granted, pause: .active,
            now: now)
        XCTAssertNil(appearance.storageText)
        XCTAssertNil(appearance.storageAlertText)
    }

    func testDegradedStorageAlarmsWithTheReasonButKeepsTheCalmIcon() {
        let appearance = MenuModel.appearance(
            connection: .connected(brainVersion: "0.1.9"), permission: .granted, pause: .active,
            storage: .degraded(
                reason: "the search index could not be opened", lastCaptureAt: nil),
            now: now)
        XCTAssertEqual(appearance.storageText, "Memory: capturing, search offline")
        XCTAssertEqual(
            appearance.storageAlertText,
            "Search broken — the search index could not be opened. Rebuild…")
        XCTAssertEqual(appearance.symbolName, "brain", "captures are safe; no triangle")
    }

    func testFailingStorageIsTheAlarmingStateIconIncluded() {
        let appearance = MenuModel.appearance(
            connection: .connected(brainVersion: "0.1.9"), permission: .granted, pause: .active,
            storage: .failing(reason: "the disk is full"), now: now)
        XCTAssertEqual(appearance.storageText, "Memory: not being saved")
        XCTAssertEqual(
            appearance.storageAlertText, "Memory not being saved — the disk is full…")
        XCTAssertEqual(appearance.symbolName, "exclamationmark.triangle")
    }

    func testFailingStorageOutranksPauseButNotADownBrainForTheIcon() {
        let paused = MenuModel.appearance(
            connection: .connected(brainVersion: "0.1.9"), permission: .granted,
            pause: .paused(until: nil), storage: .failing(reason: "the disk is full"), now: now)
        XCTAssertEqual(paused.symbolName, "exclamationmark.triangle")
        let down = MenuModel.appearance(
            connection: .failed(reason: "boom"), permission: .granted, pause: .active,
            storage: .failing(reason: "the disk is full"), now: now)
        XCTAssertEqual(down.symbolName, "brain")
        XCTAssertTrue(down.appearsDisabled)
    }

    func testRelativeCaptureTimesReadNaturally() {
        XCTAssertEqual(StorageHealth.relative(now.addingTimeInterval(-30), now: now), "just now")
        XCTAssertEqual(
            StorageHealth.relative(now.addingTimeInterval(-300), now: now), "5 min ago")
        XCTAssertEqual(
            StorageHealth.relative(now.addingTimeInterval(-7200), now: now), "2 h ago")
        XCTAssertEqual(
            StorageHealth.relative(now.addingTimeInterval(-3 * 86_400), now: now), "3 days ago")
    }
}
