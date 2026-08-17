import XCTest

@testable import Minne

/// The sync half of the brain's `status`, which Settings' Memory section is the
/// only reader of. Parsing and wording are pure, so they are asserted here
/// rather than eyeballed in a screenshot.
final class SyncStatusInfoTests: XCTestCase {
    private let now = Date(timeIntervalSince1970: 1_786_000_000)

    private func status(_ fields: [String: JSONValue]) -> SyncStatusInfo {
        guard let parsed = SyncStatusInfo.parse(.object(fields)) else {
            fatalError("unparseable test fixture")
        }
        return parsed
    }

    func testParsesTheStatusPayloadTheBrainSends() throws {
        let value = JSONValue.object([
            "state": .string("idle"),
            "watermark": .number(412),
            "pending": .number(7),
            "indexAvailable": .bool(true),
            "intervalMinutes": .number(30),
            "lintIntervalHours": .number(24),
            "lastSync": .object([
                "at": .string("2026-08-17T14:31:07+02:00"),
                "status": .string("ingested"),
                "snapshots": .number(24),
                "batches": .number(2),
                "pagesTouched": .array([.string("wiki/trips/oslo.md"), .string("wiki/index.md")]),
                "remaining": .number(0),
            ]),
            "lastLint": .null,
        ])
        let parsed = try XCTUnwrap(SyncStatusInfo.parse(value))
        XCTAssertEqual(parsed.pending, 7)
        XCTAssertEqual(parsed.intervalMinutes, 30)
        XCTAssertFalse(parsed.isRunning)
        XCTAssertEqual(parsed.lastSync?.snapshots, 24)
        XCTAssertEqual(parsed.lastSync?.pagesTouched.count, 2)
        XCTAssertNotNil(parsed.lastSync?.finishedAt, "local time with an offset parses")
    }

    /// `status` grew its `sync` field in US-012; it rides on the same answer
    /// the account state comes from, so one request feeds both sections.
    func testAuthStateCarriesTheSyncStatus() throws {
        let value = JSONValue.object([
            "provider": .string("anthropic"),
            "model": .string("claude-sonnet-5"),
            "providers": .array([]),
            "sync": .object(["state": .string("running"), "pass": .string("lint")]),
        ])
        let state = try XCTUnwrap(AuthState.parse(value))
        XCTAssertEqual(state.sync?.pass, "lint")
        XCTAssertEqual(state.sync?.lastSyncLine(now: now), "Checking the wiki now…")
    }

    func testAMemoryThatHasNeverSyncedSaysSoWithoutPretendingToBeBroken() {
        let nothing = status(["state": .string("idle"), "indexAvailable": .bool(false)])
        XCTAssertEqual(nothing.lastSyncLine(now: now), "Nothing captured yet")
        XCTAssertEqual(nothing.pendingLine, "No captures indexed yet.")

        let captured = status([
            "state": .string("idle"), "indexAvailable": .bool(true), "pending": .number(3),
            "intervalMinutes": .number(30),
        ])
        XCTAssertEqual(captured.lastSyncLine(now: now), "Never synced")
        XCTAssertEqual(captured.pendingLine, "3 captures waiting. Minne syncs every 30 min.")
    }

    func testEachPassOutcomeGetsItsOwnWording() {
        let at = SyncPassInfo.parseTimestamp("2026-08-17T14:31:07+02:00")
        let finished = at ?? now
        let base: [String: JSONValue] = ["state": .string("idle"), "indexAvailable": .bool(true)]

        func line(_ summary: [String: JSONValue]) -> String {
            status(base.merging(["lastSync": .object(summary)]) { _, new in new })
                .lastSyncLine(now: finished.addingTimeInterval(60))
        }

        XCTAssertEqual(
            line([
                "at": .string("2026-08-17T14:31:07+02:00"), "status": .string("ingested"),
                "snapshots": .number(1), "pagesTouched": .array([.string("wiki/a.md")]),
            ]),
            "Last sync just now — 1 capture into 1 page")
        XCTAssertEqual(
            line(["at": .string("2026-08-17T14:31:07+02:00"), "status": .string("idle")]),
            "Last checked just now — nothing new")
        XCTAssertTrue(
            line([
                "at": .string("2026-08-17T14:31:07+02:00"), "status": .string("skipped"),
                "reason": .string("no provider signed in"),
            ]).hasSuffix("skipped (no provider signed in)"))
        XCTAssertTrue(
            line([
                "at": .string("2026-08-17T14:31:07+02:00"), "status": .string("error"),
                "reason": .string("rate limited"),
            ]).hasSuffix("failed — rate limited"))
    }

    /// An unparseable timestamp costs a relative time and nothing else.
    func testAMissingTimestampStillProducesALine() {
        let line = status([
            "state": .string("idle"), "indexAvailable": .bool(true),
            "lastSync": .object(["status": .string("idle")]),
        ]).lastSyncLine(now: now)
        XCTAssertEqual(line, "Last checked recently — nothing new")
    }

    @MainActor
    func testDescribesAnOnDemandPassResult() {
        XCTAssertEqual(
            SettingsModel.describePass(
                .object([
                    "status": .string("ingested"), "snapshots": .number(4),
                    "pagesTouched": .array([.string("a"), .string("b")]),
                ])),
            "Digested 4 captures into 2 pages.")
        XCTAssertEqual(
            SettingsModel.describePass(.object(["status": .string("idle")])),
            "Nothing new to digest.")
        XCTAssertEqual(
            SettingsModel.describePass(
                .object(["status": .string("skipped"), "reason": .string("nobody is signed in")])),
            "Skipped — nobody is signed in.")
    }
}
