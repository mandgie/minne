import XCTest

@testable import Minne

/// The FTS5 index the brain reads. What matters here is that what goes in comes
/// back out — including through a reopen, since the writer is a menu-bar app
/// that gets quit and relaunched all day.
final class SnapshotIndexTests: XCTestCase {
    private var directory: URL!
    private var databaseURL: URL { directory.appendingPathComponent("minne.db") }

    override func setUpWithError() throws {
        directory = URL(fileURLWithPath: NSTemporaryDirectory(), isDirectory: true)
            .appendingPathComponent("minne-index-\(UUID().uuidString)", isDirectory: true)
    }

    override func tearDownWithError() throws {
        try? FileManager.default.removeItem(at: directory)
    }

    private func snapshot(
        _ text: String, app: String = "Safari", title: String = "Docs", url: String? = nil,
        at date: Date = Date(timeIntervalSince1970: 1_800_000_000)
    ) -> CaptureSnapshot {
        CaptureSnapshot(
            capturedAt: date, bundleIdentifier: "com.apple.\(app)", appName: app,
            windowTitle: title,
            url: url, text: text, truncated: false)
    }

    func testRoundTripsASnapshotThroughFullTextSearch() throws {
        let index = try SnapshotIndex(url: databaseURL)
        try index.insert(
            snapshot(
                "Reviewed the pull request for the capture engine", title: "minne — PR #12",
                url: "https://github.com/example/minne/pull/12"),
            sourcePath: "sources/2026-08-17/1400-safari.md", section: 1)

        let hits = try index.search(matching: "\"capture\" \"engine\"")
        XCTAssertEqual(hits.count, 1)
        let hit = try XCTUnwrap(hits.first)
        XCTAssertEqual(hit.app, "Safari")
        XCTAssertEqual(hit.title, "minne — PR #12")
        XCTAssertEqual(hit.url, "https://github.com/example/minne/pull/12")
        XCTAssertEqual(hit.sourcePath, "sources/2026-08-17/1400-safari.md")
        XCTAssertEqual(hit.section, 1)
        XCTAssertTrue(hit.snippet.contains("capture engine"), hit.snippet)
    }

    func testTitleAndAppAreSearchableAlongsideTheText() throws {
        let index = try SnapshotIndex(url: databaseURL)
        try index.insert(
            snapshot("nothing relevant in the body", app: "Mail", title: "Oslo trip — booking"),
            sourcePath: "sources/2026-08-17/0900-mail.md", section: 1)
        XCTAssertEqual(try index.search(matching: "\"oslo\"").count, 1)
        XCTAssertEqual(try index.search(matching: "\"mail\"").count, 1)
        XCTAssertEqual(try index.search(matching: "\"helsinki\"").count, 0)
    }

    func testSearchIsDiacriticAndCaseInsensitive() throws {
        let index = try SnapshotIndex(url: databaseURL)
        try index.insert(
            snapshot("Möte om förslaget i Göteborg"), sourcePath: "sources/a.md", section: 1)
        XCTAssertEqual(try index.search(matching: "\"goteborg\"").count, 1)
        XCTAssertEqual(try index.search(matching: "\"MÖTE\"").count, 1)
    }

    func testTheIndexSurvivesReopening() throws {
        do {
            let index = try SnapshotIndex(url: databaseURL)
            try index.insert(
                snapshot("persisted across launches"), sourcePath: "sources/a.md", section: 1)
        }
        let reopened = try SnapshotIndex(url: databaseURL)
        XCTAssertEqual(try reopened.count(), 1)
        XCTAssertEqual(try reopened.search(matching: "\"persisted\"").count, 1)
    }

    func testReindexingTheSameSectionReplacesItRatherThanDuplicating() throws {
        // A crash between writing the markdown and indexing it leaves the app
        // free to retry; the retry must not double-count the snapshot.
        let index = try SnapshotIndex(url: databaseURL)
        try index.insert(snapshot("first attempt"), sourcePath: "sources/a.md", section: 4)
        try index.insert(snapshot("second attempt"), sourcePath: "sources/a.md", section: 4)
        XCTAssertEqual(try index.count(), 1)
        XCTAssertEqual(try index.search(matching: "\"attempt\"").count, 1)
        XCTAssertEqual(
            try index.search(matching: "\"first\"").count, 0, "the stale FTS row must go too")
    }

    func testDeletingByAgeTakesTheFullTextEntriesWithIt() throws {
        let index = try SnapshotIndex(url: databaseURL)
        let old = Date(timeIntervalSince1970: 1_700_000_000)
        let recent = Date(timeIntervalSince1970: 1_800_000_000)
        try index.insert(
            snapshot("old business", at: old), sourcePath: "sources/old.md", section: 1)
        try index.insert(
            snapshot("new business", at: recent), sourcePath: "sources/new.md", section: 1)

        XCTAssertEqual(try index.deleteSnapshots(before: recent), 1)
        XCTAssertEqual(try index.count(), 1)
        XCTAssertEqual(try index.search(matching: "\"old\"").count, 0)
        XCTAssertEqual(try index.search(matching: "\"new\"").count, 1)
    }

    func testMalformedQueriesFailLoudlyRatherThanSilently() throws {
        let index = try SnapshotIndex(url: databaseURL)
        XCTAssertThrowsError(try index.search(matching: "\"unbalanced"))
    }

    func testDatabaseRunsInWALSoTheBrainCanReadWhileTheAppWrites() throws {
        let index = try SnapshotIndex(url: databaseURL)
        try index.insert(snapshot("written under WAL"), sourcePath: "sources/a.md", section: 1)
        XCTAssertTrue(
            FileManager.default.fileExists(atPath: databaseURL.path + "-wal"),
            "a write-ahead log means a reader in the brain never blocks a capture")
    }
}
