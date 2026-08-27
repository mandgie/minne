import XCTest

@testable import Minne

/// The data-safety guarantees: a broken index degrades the store instead of
/// killing persistence, a deleted memory root self-heals, the index is
/// genuinely rebuildable from the markdown, and an export is a restorable zip.
final class StorageResilienceTests: XCTestCase {
    private let zone = TimeZone(identifier: "Europe/Stockholm")!
    private var root: URL!
    private var paths: MemoryPaths!

    override func setUpWithError() throws {
        root = URL(fileURLWithPath: NSTemporaryDirectory(), isDirectory: true)
            .appendingPathComponent("minne-resilience-\(UUID().uuidString)", isDirectory: true)
        paths = MemoryPaths(
            memoryRoot: root.appendingPathComponent("Minne", isDirectory: true),
            appSupport: root.appendingPathComponent("Support", isDirectory: true))
    }

    override func tearDownWithError() throws {
        try? FileManager.default.removeItem(at: root)
    }

    private func snapshot(_ text: String, hour: Int = 14, minute: Int = 0) -> CaptureSnapshot {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = zone
        let date = calendar.date(
            from: DateComponents(year: 2026, month: 8, day: 17, hour: hour, minute: minute))!
        return CaptureSnapshot(
            capturedAt: date, bundleIdentifier: "com.apple.Safari", appName: "Safari",
            windowTitle: "Docs", url: nil, text: text, truncated: false)
    }

    // MARK: - Degrade instead of die

    func testABrokenIndexDegradesTheStoreButMarkdownKeepsFlowing() throws {
        // A directory where minne.db should be makes the SQLite open fail —
        // the closest a test gets to a corrupt database without one.
        try FileManager.default.createDirectory(
            at: paths.database, withIntermediateDirectories: true)
        let store = try SourceStore(paths: paths, timeZone: zone)
        let reference = try store.record(snapshot("still remembered"))
        let contents = try String(
            contentsOf: paths.memoryRoot.appendingPathComponent(reference.path), encoding: .utf8)
        XCTAssertTrue(contents.contains("still remembered"), "the capture reached the markdown")
        guard case .degraded = store.health() else {
            return XCTFail("expected degraded, got \(store.health())")
        }
        XCTAssertThrowsError(try store.indexedCount())
    }

    func testADeletedMemoryRootSelfHealsOnTheNextCapture() throws {
        let store = try SourceStore(paths: paths, timeZone: zone)
        _ = try store.record(snapshot("before the deletion"))
        // The user (or a cloud-sync client) removes the whole folder mid-run.
        try FileManager.default.removeItem(at: paths.memoryRoot)
        let reference = try store.record(snapshot("after the deletion", minute: 5))
        let contents = try String(
            contentsOf: paths.memoryRoot.appendingPathComponent(reference.path), encoding: .utf8)
        XCTAssertTrue(contents.contains("after the deletion"))
        XCTAssertTrue(
            FileManager.default.fileExists(atPath: paths.schema.path),
            "the heal re-seeds SCHEMA.md and the wiki, not just the one file")
        guard case .healthy = store.health() else {
            return XCTFail("expected healthy after the heal, got \(store.health())")
        }
    }

    // MARK: - Rebuild

    func testTheIndexIsRebuildableFromTheMarkdownAlone() throws {
        var store = try SourceStore(paths: paths, timeZone: zone)
        _ = try store.record(snapshot("the Oslo flight is booked"))
        _ = try store.record(snapshot("budget approved for the move", hour: 15))
        // Lose the index entirely — the failure mode that used to be permanent.
        store = try {
            for url in MemoryWipe.derivedFiles(paths).prefix(3) {
                try? FileManager.default.removeItem(at: url)
            }
            return try SourceStore(paths: paths, timeZone: zone)
        }()
        XCTAssertEqual(try store.indexedCount(), 0, "a fresh index knows nothing")

        let staging = paths.appSupport.appendingPathComponent("minne.db.rebuild-test")
        var progressCalls = 0
        let report = try SourceStore.buildIndex(
            paths: paths, timeZone: zone, at: staging, progress: { _ in progressCalls += 1 })
        XCTAssertEqual(report.files, 2, "one file per hour bucket")
        XCTAssertEqual(report.snapshots, 2)
        XCTAssertEqual(report.skippedSections, 0)
        XCTAssertGreaterThan(report.maxId, 0)
        XCTAssertEqual(progressCalls, report.files)
        try store.adoptIndex(from: staging)

        XCTAssertEqual(try store.indexedCount(), 2)
        let hits = try store.search(matching: "\"oslo\"")
        XCTAssertEqual(hits.count, 1)
        XCTAssertEqual(hits[0].sourcePath, "sources/2026-08-17/1400-safari.md")
        XCTAssertEqual(hits[0].section, 1, "citations still resolve after the rebuild")
        // And the store keeps working with the adopted index.
        _ = try store.record(snapshot("a capture after the rebuild", hour: 16))
        XCTAssertEqual(try store.indexedCount(), 3)
    }

    func testRebuildEndsADegradedState() throws {
        try FileManager.default.createDirectory(
            at: paths.database, withIntermediateDirectories: true)
        let store = try SourceStore(paths: paths, timeZone: zone)
        _ = try store.record(snapshot("captured while degraded"))
        let staging = paths.appSupport.appendingPathComponent("minne.db.rebuild-test")
        let report = try SourceStore.buildIndex(paths: paths, timeZone: zone, at: staging)
        XCTAssertEqual(report.snapshots, 1, "degraded-era captures are in the rebuild")
        // The stand-in "corrupt database" is a directory; clear it so the swap
        // has a normal target, as adoptIndex would over a real corrupt file.
        try FileManager.default.removeItem(at: paths.database)
        try store.adoptIndex(from: staging)
        guard case .healthy(let count, _) = store.health() else {
            return XCTFail("expected healthy after adopt, got \(store.health())")
        }
        XCTAssertEqual(count, 1)
    }

    // MARK: - Export

    func testExportZipsARestorableMemory() throws {
        let store = try SourceStore(paths: paths, timeZone: zone)
        let reference = try store.record(snapshot("worth backing up"))
        let destination = root.appendingPathComponent("backup.zip")
        let report = try MemoryExport.export(memoryRoot: paths.memoryRoot, to: destination)
        XCTAssertEqual(report.destination, destination)
        XCTAssertGreaterThan(report.bytes, 0)

        // Restorable means: unzip it and the tree is back, byte for byte.
        let restored = root.appendingPathComponent("restored", isDirectory: true)
        let unzip = Process()
        unzip.executableURL = URL(fileURLWithPath: "/usr/bin/ditto")
        unzip.arguments = ["-x", "-k", destination.path, restored.path]
        try unzip.run()
        unzip.waitUntilExit()
        XCTAssertEqual(unzip.terminationStatus, 0)
        let restoredCapture = restored.appendingPathComponent("Minne/\(reference.path)")
        XCTAssertTrue(
            try String(contentsOf: restoredCapture, encoding: .utf8).contains("worth backing up"))
        XCTAssertTrue(
            FileManager.default.fileExists(
                atPath: restored.appendingPathComponent("Minne/SCHEMA.md").path))
        XCTAssertFalse(
            FileManager.default.fileExists(
                atPath: restored.appendingPathComponent("Minne/minne.db").path),
            "the derived index stays out of the backup")
    }

    func testExportFilenameFollowsTheByHandConvention() {
        let date = Date(timeIntervalSince1970: 1_787_000_000)  // 2026-08-17 UTC
        XCTAssertEqual(
            MemoryExport.defaultFilename(now: date, timeZone: TimeZone(identifier: "UTC")!),
            "Minne-backup-2026-08-17.zip")
    }
}
