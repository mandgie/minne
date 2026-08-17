import XCTest

@testable import Minne

/// Seeding, append-only persistence, and retention. Every test runs against a
/// temporary root — nothing here may touch the real `~/Minne`.
final class SourceStoreTests: XCTestCase {
    private let zone = TimeZone(identifier: "Europe/Stockholm")!
    private var root: URL!
    private var paths: MemoryPaths!

    override func setUpWithError() throws {
        root = URL(fileURLWithPath: NSTemporaryDirectory(), isDirectory: true)
            .appendingPathComponent("minne-store-\(UUID().uuidString)", isDirectory: true)
        paths = MemoryPaths(
            memoryRoot: root.appendingPathComponent("Minne", isDirectory: true),
            appSupport: root.appendingPathComponent("Support", isDirectory: true))
    }

    override func tearDownWithError() throws {
        try? FileManager.default.removeItem(at: root)
    }

    private func makeStore() throws -> SourceStore {
        try SourceStore(paths: paths, timeZone: zone)
    }

    private func date(_ hour: Int, _ minute: Int, _ second: Int = 0, day: Int = 17, month: Int = 8)
        -> Date
    {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = zone
        return calendar.date(
            from: DateComponents(
                year: 2026, month: month, day: day, hour: hour, minute: minute, second: second))!
    }

    private func snapshot(
        _ text: String, app: String = "Safari", bundle: String = "com.apple.Safari",
        title: String = "Docs", url: String? = nil, at date: Date
    ) -> CaptureSnapshot {
        CaptureSnapshot(
            capturedAt: date, bundleIdentifier: bundle, appName: app, windowTitle: title, url: url,
            text: text, truncated: false)
    }

    private func contents(_ relativePath: String) throws -> String {
        try String(
            contentsOf: paths.memoryRoot.appendingPathComponent(relativePath), encoding: .utf8)
    }

    // MARK: - First run

    func testFirstRunSeedsTheMemoryRoot() throws {
        _ = try makeStore()
        let fileManager = FileManager.default
        for path in ["sources", "wiki"] {
            var isDirectory: ObjCBool = false
            XCTAssertTrue(
                fileManager.fileExists(
                    atPath: paths.memoryRoot.appendingPathComponent(path).path,
                    isDirectory: &isDirectory), "\(path) must exist")
            XCTAssertTrue(isDirectory.boolValue, "\(path) must be a directory")
        }
        for file in [paths.schema, paths.index, paths.log] {
            XCTAssertTrue(fileManager.fileExists(atPath: file.path), "\(file.lastPathComponent)")
        }
        XCTAssertTrue(fileManager.fileExists(atPath: paths.database.path), "minne.db")
        XCTAssertTrue(try String(contentsOf: paths.schema, encoding: .utf8).contains("SCHEMA.md"))
    }

    func testSeedingNeverOverwritesWhatIsAlreadyThere() throws {
        _ = try makeStore()
        try "my own rules".write(to: paths.schema, atomically: true, encoding: .utf8)
        try FileManager.default.removeItem(at: paths.index)

        _ = try makeStore()
        // The schema is the user's the moment they touch it …
        XCTAssertEqual(try String(contentsOf: paths.schema, encoding: .utf8), "my own rules")
        // … but a file they deleted comes back rather than leaving a hole.
        XCTAssertTrue(FileManager.default.fileExists(atPath: paths.index.path))
    }

    // MARK: - Writing sources

    func testSnapshotIsAppendedToItsHourlyFile() throws {
        let store = try makeStore()
        let first = try store.record(snapshot("first capture", at: date(14, 31, 7)))
        XCTAssertEqual(first.path, "sources/2026-08-17/1400-safari.md")
        XCTAssertEqual(first.section, 1)
        XCTAssertEqual(first.citation, "sources/2026-08-17/1400-safari.md#1")

        let second = try store.record(snapshot("second capture", at: date(14, 45, 0)))
        XCTAssertEqual(second.section, 2)

        let file = try contents(first.path)
        XCTAssertEqual(file.components(separatedBy: "\n---\n").count, 2, "one frontmatter block")
        XCTAssertTrue(file.contains("## Snapshot 1 — 14:31:07"))
        XCTAssertTrue(file.contains("## Snapshot 2 — 14:45:00"))
        XCTAssertTrue(file.contains("first capture"))
        XCTAssertTrue(file.contains("second capture"))
    }

    func testExistingSectionsAreNeverRewritten() throws {
        let store = try makeStore()
        let reference = try store.record(snapshot("first capture", at: date(14, 31, 7)))
        let afterFirst = try contents(reference.path)
        _ = try store.record(snapshot("second capture", at: date(14, 45, 0)))
        let afterSecond = try contents(reference.path)
        XCTAssertTrue(
            afterSecond.hasPrefix(afterFirst),
            "a source file may only grow — the bytes already written must be untouched")
    }

    func testNumberingContinuesAfterARestartWithinTheSameHour() throws {
        let store = try makeStore()
        _ = try store.record(snapshot("first", at: date(14, 0, 1)))
        _ = try store.record(snapshot("second", at: date(14, 0, 2)))

        // A new store is a relaunched app: the file on disk is the authority.
        let restarted = try makeStore()
        let third = try restarted.record(snapshot("third", at: date(14, 0, 3)))
        XCTAssertEqual(third.section, 3)
        XCTAssertEqual(try contents(third.path).components(separatedBy: "## Snapshot ").count, 4)
    }

    func testSectionCountingIgnoresHeadingsInsideCapturedText() throws {
        // Minne captures its own source file open in an editor: the text
        // contains "## Snapshot 9", which must not renumber the file.
        let store = try makeStore()
        _ = try store.record(snapshot("## Snapshot 9 — 10:00:00\nnested", at: date(14, 0, 1)))
        let restarted = try makeStore()
        let next = try restarted.record(snapshot("plain", at: date(14, 0, 2)))
        XCTAssertGreaterThan(next.section, 9, "over-counting is safe, colliding citations are not")
    }

    func testSeparateAppsAndHoursGetSeparateFiles() throws {
        let store = try makeStore()
        _ = try store.record(snapshot("safari text", at: date(14, 1)))
        _ = try store.record(
            snapshot("mail text", app: "Mail", bundle: "com.apple.mail", at: date(14, 2)))
        _ = try store.record(snapshot("later text", at: date(15, 1)))
        let day = paths.sources.appendingPathComponent("2026-08-17")
        XCTAssertEqual(
            try FileManager.default.contentsOfDirectory(atPath: day.path).sorted(),
            ["1400-mail.md", "1400-safari.md", "1500-safari.md"])
    }

    // MARK: - Indexing

    func testEverySnapshotIsSearchableThroughTheIndex() throws {
        let store = try makeStore()
        let reference = try store.record(
            snapshot(
                "the Oslo trip itinerary and the hotel booking", title: "Trip planning",
                url: "https://example.com/oslo", at: date(9, 15)))
        _ = try store.record(snapshot("unrelated notes about gardening", at: date(10, 15)))

        let hits = try store.search(matching: "\"oslo\"")
        XCTAssertEqual(hits.count, 1)
        XCTAssertEqual(hits.first?.sourcePath, reference.path)
        XCTAssertEqual(hits.first?.section, reference.section)
        XCTAssertEqual(hits.first?.title, "Trip planning")
        XCTAssertEqual(hits.first?.url, "https://example.com/oslo")
        XCTAssertEqual(
            hits.first?.capturedAt.timeIntervalSince1970, date(9, 15).timeIntervalSince1970)
        XCTAssertTrue(hits.first?.snippet.contains("Oslo") ?? false)
        XCTAssertEqual(try store.indexedCount(), 2)
    }

    // MARK: - Retention

    func testRetentionPrunesOldSourcesAndTheirIndexRows() throws {
        let store = try makeStore()
        _ = try store.record(snapshot("ancient history", at: date(9, 0, day: 1, month: 1)))
        _ = try store.record(snapshot("recent thinking", at: date(9, 0, day: 16)))

        let report = try store.prune(policy: RetentionPolicy(days: 90), now: date(12, 0))
        XCTAssertEqual(report.removedDays, ["2026-01-01"])
        XCTAssertEqual(report.removedSnapshots, 1)

        XCTAssertFalse(
            FileManager.default.fileExists(
                atPath: paths.sources.appendingPathComponent("2026-01-01").path))
        XCTAssertTrue(
            FileManager.default.fileExists(
                atPath: paths.sources.appendingPathComponent("2026-08-16").path))
        XCTAssertEqual(try store.search(matching: "\"ancient\"").count, 0)
        XCTAssertEqual(try store.search(matching: "\"recent\"").count, 1)
        XCTAssertEqual(try store.indexedCount(), 1)
    }

    func testPruningLeavesTheWikiAlone() throws {
        let store = try makeStore()
        let page = paths.wiki.appendingPathComponent("oslo.md")
        try "everything I learned in January".write(to: page, atomically: true, encoding: .utf8)
        _ = try store.record(snapshot("ancient history", at: date(9, 0, day: 1, month: 1)))

        _ = try store.prune(policy: RetentionPolicy(days: 30), now: date(12, 0))
        XCTAssertTrue(FileManager.default.fileExists(atPath: page.path))
        XCTAssertTrue(FileManager.default.fileExists(atPath: paths.log.path))
    }

    func testADayIsKeptUntilAllOfItIsPastTheCutoff() throws {
        let store = try makeStore()
        _ = try store.record(snapshot("yesterday", at: date(23, 0, day: 16)))
        let report = try store.prune(policy: RetentionPolicy(days: 1), now: date(12, 0))
        XCTAssertEqual(report.removedDays, [], "a capture inside the window keeps its day")
    }

    func testRetentionCanBeTurnedOff() throws {
        let store = try makeStore()
        _ = try store.record(snapshot("ancient history", at: date(9, 0, day: 1, month: 1)))
        let report = try store.prune(policy: RetentionPolicy(days: 0), now: date(12, 0))
        XCTAssertTrue(report.isEmpty)
        XCTAssertEqual(try store.indexedCount(), 1)
    }

    func testRetentionDefaultsToNinetyDaysUntilSettingsSaysOtherwise() {
        let defaults = UserDefaults(suiteName: "minne-retention-\(UUID().uuidString)")!
        XCTAssertEqual(RetentionPolicy.fromUserDefaults(defaults).days, 90)
        defaults.set(7, forKey: RetentionPolicy.defaultsKey)
        XCTAssertEqual(RetentionPolicy.fromUserDefaults(defaults).days, 7)
        defaults.set(0, forKey: RetentionPolicy.defaultsKey)
        XCTAssertNil(RetentionPolicy.fromUserDefaults(defaults).cutoff(now: Date()))
    }

    // MARK: - Paths

    func testRootsAreOverridableByEnvironmentSoTestsNeverTouchTheRealOnes() {
        let resolved = MemoryPaths.resolved(
            environment: [
                MemoryPaths.memoryRootVariable: "/tmp/memory",
                MemoryPaths.appSupportVariable: "/tmp/support",
            ], home: URL(fileURLWithPath: "/Users/nobody"))
        XCTAssertEqual(resolved.memoryRoot.path, "/tmp/memory")
        XCTAssertEqual(resolved.database.path, "/tmp/support/minne.db")

        let defaults = MemoryPaths.resolved(
            environment: [:], home: URL(fileURLWithPath: "/Users/nobody"))
        XCTAssertEqual(defaults.memoryRoot.path, "/Users/nobody/Minne")
        XCTAssertEqual(
            defaults.database.path, "/Users/nobody/Library/Application Support/Minne/minne.db")
    }

    func testCitationPathsAreRelativeToTheMemoryRoot() {
        XCTAssertEqual(
            paths.relativePath(
                of: paths.sources.appendingPathComponent("2026-08-17/1400-safari.md")),
            "sources/2026-08-17/1400-safari.md")
    }
}
