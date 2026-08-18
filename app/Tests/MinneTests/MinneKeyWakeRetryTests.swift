import XCTest

@testable import Minne

/// The rules of the one delayed retry a Chromium wake earns (US-104), driven
/// without a timer: what lets it fire, everything that abandons it, and the
/// guarantee that one press never retries twice.
final class MinneKeyWakeRetryTests: XCTestCase {
    func testAnUndisturbedRetryFiresInTheAppItWasPressedIn() {
        var retry = MinneKeyWakeRetry(pid: 42)
        XCTAssertTrue(retry.shouldFire(frontmostPid: 42))
        XCTAssertEqual(retry.phase, .fired)
    }

    func testOnePressGetsOneRetryEver() {
        var retry = MinneKeyWakeRetry(pid: 42)
        XCTAssertTrue(retry.shouldFire(frontmostPid: 42))
        XCTAssertFalse(retry.shouldFire(frontmostPid: 42), "fired is terminal")
    }

    func testEveryKindOfUserActivityAbandonsThePendingRetry() {
        for reason: MinneKeyWakeRetry.Cancellation in [
            .anotherPress, .typing, .click, .appSwitch,
        ] {
            var retry = MinneKeyWakeRetry(pid: 42)
            XCTAssertTrue(retry.cancel(reason), "the first cancellation is the one to report")
            XCTAssertEqual(retry.phase, .cancelled(reason))
            XCTAssertFalse(retry.shouldFire(frontmostPid: 42), "\(reason) must block the retry")
        }
    }

    /// Only the transition out of `pending` reports true, so whoever logs the
    /// abandonment says why exactly once.
    func testASecondCancellationIsNotReportedAgain() {
        var retry = MinneKeyWakeRetry(pid: 42)
        XCTAssertTrue(retry.cancel(.typing))
        XCTAssertFalse(retry.cancel(.click))
        XCTAssertEqual(retry.phase, .cancelled(.typing), "the first reason stands")
    }

    func testCancellingAFiredRetryChangesNothing() {
        var retry = MinneKeyWakeRetry(pid: 42)
        XCTAssertTrue(retry.shouldFire(frontmostPid: 42))
        XCTAssertFalse(retry.cancel(.typing))
        XCTAssertEqual(retry.phase, .fired)
    }

    /// A locate at fire time would read whatever app is in front *now* — if
    /// that is not the app the press woke, the retry is wrong, not late.
    func testADifferentFrontmostAppAtFireTimeAbandons() {
        var retry = MinneKeyWakeRetry(pid: 42)
        XCTAssertFalse(retry.shouldFire(frontmostPid: 7))
        XCTAssertEqual(retry.phase, .cancelled(.appSwitch))
        XCTAssertFalse(retry.shouldFire(frontmostPid: 42), "abandoned stays abandoned")
    }

    func testNoFrontmostAppAtFireTimeAbandons() {
        var retry = MinneKeyWakeRetry(pid: 42)
        XCTAssertFalse(retry.shouldFire(frontmostPid: nil))
        XCTAssertEqual(retry.phase, .cancelled(.appSwitch))
    }
}
