import XCTest

@testable import Minne

final class CaptureSchedulerTests: XCTestCase {
    private let start = Date(timeIntervalSince1970: 1_000_000)

    private func window(_ title: String, app: String = "Safari") -> WindowIdentity {
        WindowIdentity(
            bundleIdentifier: "com.apple.\(app.lowercased())", appName: app, windowTitle: title)
    }

    private func candidate(_ text: String, _ window: WindowIdentity, url: String? = nil)
        -> CaptureCandidate
    {
        CaptureCandidate(window: window, url: url, text: text)
    }

    private func scheduler(_ configure: (inout CaptureScheduler.Configuration) -> Void = { _ in })
        -> CaptureScheduler
    {
        var configuration = CaptureScheduler.Configuration()
        configure(&configuration)
        return CaptureScheduler(configuration: configuration)
    }

    // MARK: - Gating

    func testMissingPermissionNeverCaptures() {
        var scheduler = scheduler()
        XCTAssertEqual(
            scheduler.decide(
                trigger: .focusChange, window: window("Docs"), permission: .missing,
                pause: .active, now: start),
            .skip(.permissionMissing))
    }

    func testPausedNeverCaptures() {
        var scheduler = scheduler()
        XCTAssertEqual(
            scheduler.decide(
                trigger: .focusChange, window: window("Docs"), permission: .granted,
                pause: .paused(until: nil), now: start),
            .skip(.paused))
    }

    func testExpiredTimedPauseCapturesAgain() {
        var scheduler = scheduler()
        let stale = PauseState.paused(until: start.addingTimeInterval(-1))
        XCTAssertEqual(
            scheduler.decide(
                trigger: .timer, window: window("Docs"), permission: .granted, pause: stale,
                now: start),
            .capture)
    }

    func testPermissionOutranksPause() {
        var scheduler = scheduler()
        XCTAssertEqual(
            scheduler.decide(
                trigger: .timer, window: window("Docs"), permission: .missing,
                pause: .paused(until: nil), now: start),
            .skip(.permissionMissing))
    }

    func testNoFocusedWindowSkips() {
        var scheduler = scheduler()
        XCTAssertEqual(
            scheduler.decide(
                trigger: .focusChange, window: nil, permission: .granted, pause: .active,
                now: start),
            .skip(.noFocusedWindow))
    }

    func testGatedDecisionsDoNotConsumeTheDebounce() {
        var scheduler = scheduler()
        let docs = window("Docs")
        XCTAssertEqual(
            scheduler.decide(
                trigger: .timer, window: docs, permission: .granted, pause: .paused(until: nil),
                now: start),
            .skip(.paused))
        // Resuming captures immediately rather than waiting out an interval
        // that a paused tick silently started.
        XCTAssertEqual(
            scheduler.decide(
                trigger: .timer, window: docs, permission: .granted, pause: .active,
                now: start.addingTimeInterval(1)),
            .capture)
    }

    // MARK: - Debounce

    func testSameWindowIsDebouncedForTheFullInterval() {
        var scheduler = scheduler()
        let docs = window("Docs")
        XCTAssertEqual(decide(&scheduler, docs, at: start, trigger: .focusChange), .capture)
        for elapsed in [0.5, 5.0, 14.0] {
            XCTAssertEqual(
                decide(&scheduler, docs, at: start.addingTimeInterval(elapsed)),
                .skip(.debounced),
                "a tick \(elapsed)s in must not walk the tree again")
        }
        XCTAssertEqual(decide(&scheduler, docs, at: start.addingTimeInterval(15)), .capture)
    }

    func testDebounceToleratesSlightlyEarlyTicks() {
        // A 5s poll against a 15s debounce lands a hair under the interval;
        // without slack the capture would slip a whole extra tick.
        var scheduler = scheduler()
        let docs = window("Docs")
        XCTAssertEqual(decide(&scheduler, docs, at: start), .capture)
        XCTAssertEqual(
            decide(&scheduler, docs, at: start.addingTimeInterval(14.9)), .capture)
    }

    func testSwitchingToANewWindowCapturesImmediately() {
        var scheduler = scheduler()
        XCTAssertEqual(decide(&scheduler, window("Docs"), at: start), .capture)
        XCTAssertEqual(
            decide(
                &scheduler, window("Mail", app: "Mail"), at: start.addingTimeInterval(0.2),
                trigger: .focusChange),
            .capture)
    }

    func testTitleChangeInTheSameAppIsANewWindowIdentity() {
        var scheduler = scheduler()
        XCTAssertEqual(decide(&scheduler, window("Inbox — 3 unread"), at: start), .capture)
        XCTAssertEqual(
            decide(
                &scheduler, window("Inbox — 4 unread"), at: start.addingTimeInterval(1),
                trigger: .focusChange),
            .capture)
    }

    func testAlternatingBetweenTwoWindowsDoesNotRewalkEither() {
        var scheduler = scheduler()
        let docs = window("Docs")
        let mail = window("Mail", app: "Mail")
        XCTAssertEqual(decide(&scheduler, docs, at: start, trigger: .focusChange), .capture)
        XCTAssertEqual(
            decide(&scheduler, mail, at: start.addingTimeInterval(1), trigger: .focusChange),
            .capture)
        XCTAssertEqual(
            decide(&scheduler, docs, at: start.addingTimeInterval(2), trigger: .focusChange),
            .skip(.debounced))
        XCTAssertEqual(
            decide(&scheduler, mail, at: start.addingTimeInterval(3), trigger: .focusChange),
            .skip(.debounced))
    }

    func testDebounceIsForgottenOnceTheWindowFallsOutOfTheTrackedSet() {
        var scheduler = scheduler { $0.trackedWindows = 2 }
        let docs = window("Docs")
        XCTAssertEqual(decide(&scheduler, docs, at: start), .capture)
        XCTAssertEqual(decide(&scheduler, window("A"), at: start.addingTimeInterval(1)), .capture)
        XCTAssertEqual(decide(&scheduler, window("B"), at: start.addingTimeInterval(2)), .capture)
        // Evicting only costs one redundant capture, never a missed one.
        XCTAssertEqual(decide(&scheduler, docs, at: start.addingTimeInterval(3)), .capture)
    }

    private func decide(
        _ scheduler: inout CaptureScheduler, _ window: WindowIdentity, at now: Date,
        trigger: CaptureScheduler.Trigger = .timer
    ) -> CaptureScheduler.Decision {
        scheduler.decide(
            trigger: trigger, window: window, permission: .granted, pause: .active, now: now)
    }

    // MARK: - Dedup

    func testIdenticalTextFromTheSameWindowIsDropped() {
        var scheduler = scheduler()
        let docs = window("Docs")
        let text = "the quick brown fox jumps over the lazy dog again and again"
        guard case .accepted = scheduler.accept(candidate(text, docs), now: start) else {
            return XCTFail("first snapshot must be accepted")
        }
        guard
            case .rejected(.duplicate(let similarity)) = scheduler.accept(
                candidate(text, docs), now: start.addingTimeInterval(15))
        else { return XCTFail("an identical repeat must be dropped") }
        XCTAssertEqual(similarity, 1, accuracy: 0.0001)
    }

    func testNearIdenticalTextIsDroppedAndRealChangesAreKept() {
        var scheduler = scheduler()
        let docs = window("Docs")
        let base = (1...100).map { "line \($0) of the document body" }.joined(separator: " ")
        guard case .accepted = scheduler.accept(candidate(base, docs), now: start) else {
            return XCTFail("first snapshot must be accepted")
        }
        // One line edited out of a hundred: still the same window content.
        let nudged = base.replacingOccurrences(of: "line 50 of", with: "line fifty of")
        guard case .rejected(.duplicate) = scheduler.accept(candidate(nudged, docs), now: start)
        else { return XCTFail("a one-line edit is a near-duplicate") }
        // Wholly different content in the same window is not.
        let replaced = (1...100).map { "row \($0) of a spreadsheet" }.joined(separator: " ")
        guard case .accepted = scheduler.accept(candidate(replaced, docs), now: start) else {
            return XCTFail("different content in the same window must be kept")
        }
    }

    func testDedupIsPerWindow() {
        var scheduler = scheduler()
        let text = "shared chrome text that both windows happen to show verbatim"
        guard case .accepted = scheduler.accept(candidate(text, window("A")), now: start) else {
            return XCTFail("first snapshot must be accepted")
        }
        guard case .accepted = scheduler.accept(candidate(text, window("B")), now: start) else {
            return XCTFail("a different window is never a duplicate of this one")
        }
    }

    func testDedupComparesAgainstTheLastAcceptedSnapshotNotTheLastSeen() {
        var scheduler = scheduler()
        let docs = window("Docs")
        let original = (1...50).map { "paragraph \($0)" }.joined(separator: " ")
        guard case .accepted = scheduler.accept(candidate(original, docs), now: start) else {
            return XCTFail("first snapshot must be accepted")
        }
        // Dropped as a duplicate, so it must not become the new baseline —
        // otherwise a slow drift would never be recorded at all.
        let drifted = original + " paragraph 51"
        guard case .rejected(.duplicate) = scheduler.accept(candidate(drifted, docs), now: start)
        else { return XCTFail("an appended line is a near-duplicate") }
        guard case .rejected(.duplicate) = scheduler.accept(candidate(drifted, docs), now: start)
        else { return XCTFail("baseline must still be the accepted snapshot") }
    }

    func testEmptyAndWhitespaceOnlySnapshotsAreRejected() {
        var scheduler = scheduler()
        XCTAssertEqual(scheduler.accept(candidate("", window("A")), now: start), .rejected(.empty))
        XCTAssertEqual(
            scheduler.accept(candidate("  \n\t ", window("A")), now: start), .rejected(.empty))
    }

    // MARK: - Capping and snapshot contents

    func testSnapshotIsCappedAtTheByteLimitAndFlagged() {
        var scheduler = scheduler { $0.maxSnapshotBytes = 64 }
        let long = String(repeating: "abcde ", count: 100)
        guard
            case .accepted(let snapshot) = scheduler.accept(
                candidate(long, window("A")), now: start)
        else { return XCTFail("a long snapshot is capped, not rejected") }
        XCTAssertLessThanOrEqual(snapshot.text.utf8.count, 64)
        XCTAssertTrue(snapshot.truncated)
    }

    func testCapNeverSplitsACharacter() {
        // "é" is two UTF-8 bytes: a cap of 3 must stop after "a".
        let (text, wasCapped) = CaptureScheduler.cap("aéé", toBytes: 3)
        XCTAssertEqual(text, "aé")
        XCTAssertTrue(wasCapped)
        XCTAssertEqual(CaptureScheduler.cap("añb", toBytes: 2).text, "a")
        let untouched = CaptureScheduler.cap("hello", toBytes: 99)
        XCTAssertEqual(untouched.text, "hello")
        XCTAssertFalse(untouched.wasCapped)
    }

    func testSnapshotCarriesMetadata() {
        var scheduler = scheduler()
        let identity = WindowIdentity(
            bundleIdentifier: "com.apple.Safari", appName: "Safari",
            windowTitle: "Minne — a local memory")
        let input = CaptureCandidate(
            window: identity, url: "https://example.com/minne", text: "some page text")
        guard case .accepted(let snapshot) = scheduler.accept(input, now: start) else {
            return XCTFail("snapshot must be accepted")
        }
        XCTAssertEqual(snapshot.capturedAt, start)
        XCTAssertEqual(snapshot.bundleIdentifier, "com.apple.Safari")
        XCTAssertEqual(snapshot.appName, "Safari")
        XCTAssertEqual(snapshot.windowTitle, "Minne — a local memory")
        XCTAssertEqual(snapshot.url, "https://example.com/minne")
        XCTAssertEqual(snapshot.text, "some page text")
        XCTAssertFalse(snapshot.truncated)
    }

    func testWalkTruncationPropagatesToTheSnapshot() {
        var scheduler = scheduler()
        let input = CaptureCandidate(
            window: window("A"), text: "partial text", truncatedByWalk: true)
        guard case .accepted(let snapshot) = scheduler.accept(input, now: start) else {
            return XCTFail("snapshot must be accepted")
        }
        XCTAssertTrue(snapshot.truncated)
    }

    func testLogSummaryOmitsTheCapturedText() {
        let snapshot = CaptureSnapshot(
            capturedAt: start, bundleIdentifier: "com.apple.Safari", appName: "Safari",
            windowTitle: "Docs", url: "https://example.com", text: "secret contents",
            truncated: false)
        XCTAssertFalse(snapshot.logSummary.contains("secret contents"))
        XCTAssertTrue(snapshot.logSummary.contains("Safari"))
        XCTAssertTrue(snapshot.logSummary.contains("https://example.com"))
        XCTAssertTrue(snapshot.logSummary.contains("15 chars"))
    }
}
