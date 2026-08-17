import XCTest

@testable import Minne

/// "Delete all memory" is the one irreversible thing Minne does, so the routine
/// is tested rather than trusted: what it removes, what it leaves, and what it
/// refuses. Every case runs in a temporary directory — nothing here may touch
/// the real `~/Minne` or the real Application Support.
final class MemoryWipeTests: XCTestCase {
    private var root: URL!
    private var paths: MemoryPaths!

    override func setUpWithError() throws {
        root = URL(fileURLWithPath: NSTemporaryDirectory(), isDirectory: true)
            .appendingPathComponent("minne-wipe-\(UUID().uuidString)", isDirectory: true)
        paths = MemoryPaths(
            memoryRoot: root.appendingPathComponent("Minne", isDirectory: true),
            appSupport: root.appendingPathComponent("Support", isDirectory: true))
    }

    override func tearDownWithError() throws {
        try? FileManager.default.removeItem(at: root)
    }

    /// A memory that has been lived in: a wiki, raw sources, the index with its
    /// WAL sidecars, the brain's sync state, credentials and config.
    private func populate() throws {
        let manager = FileManager.default
        try manager.createDirectory(
            at: paths.wiki.appendingPathComponent("people"), withIntermediateDirectories: true)
        try manager.createDirectory(
            at: paths.sources.appendingPathComponent("2026-08-17"),
            withIntermediateDirectories: true)
        try manager.createDirectory(at: paths.appSupport, withIntermediateDirectories: true)
        try "# Index".write(to: paths.index, atomically: true, encoding: .utf8)
        try "# Schema".write(to: paths.schema, atomically: true, encoding: .utf8)
        try "---\ntitle: Ada\n---\n".write(
            to: paths.wiki.appendingPathComponent("people/ada.md"), atomically: true,
            encoding: .utf8)
        try "## Snapshot 1\n".write(
            to: paths.sources.appendingPathComponent("2026-08-17/1400-safari.md"),
            atomically: true, encoding: .utf8)
        for name in ["minne.db", "minne.db-wal", "minne.db-shm", "sync-state.json", "auth.json"] {
            try "x".write(
                to: paths.appSupport.appendingPathComponent(name), atomically: true, encoding: .utf8
            )
        }
        try "{\"provider\":\"anthropic\"}".write(
            to: paths.appSupport.appendingPathComponent("config.json"), atomically: true,
            encoding: .utf8)
    }

    func testRemovesTheWholeMemoryRootTheIndexAndTheCredentials() throws {
        try populate()
        let report = MemoryWipe.wipe(paths: paths, home: root)

        XCTAssertTrue(report.failed.isEmpty, "\(report.failed)")
        let manager = FileManager.default
        XCTAssertFalse(manager.fileExists(atPath: paths.memoryRoot.path), "the wiki is gone")
        for name in ["minne.db", "minne.db-wal", "minne.db-shm", "sync-state.json", "auth.json"] {
            XCTAssertFalse(
                manager.fileExists(atPath: paths.appSupport.appendingPathComponent(name).path),
                "\(name) should be gone")
        }
        XCTAssertEqual(report.removed.count, 6, "the root plus the five derived files")
    }

    /// Which provider the user picked is a preference, not a memory: emptying
    /// the wiki must not silently reconfigure the app.
    func testKeepsTheBrainsConfiguration() throws {
        try populate()
        MemoryWipe.wipe(paths: paths, home: root)
        XCTAssertTrue(
            FileManager.default.fileExists(
                atPath: paths.appSupport.appendingPathComponent("config.json").path))
    }

    func testAnEmptyMemoryIsNotAnError() {
        let report = MemoryWipe.wipe(paths: paths, home: root)
        XCTAssertTrue(report.isEmpty)
        XCTAssertEqual(report.summary, "Nothing to delete — memory was already empty.")
    }

    /// A misconfigured `MINNE_MEMORY_ROOT` must not turn this into `rm -rf ~`.
    func testRefusesToDeleteTheHomeDirectoryOrTheFilesystemRoot() throws {
        let home = URL(fileURLWithPath: "/Users/example")
        XCTAssertFalse(MemoryWipe.isDeletableRoot(home, home: home))
        XCTAssertFalse(MemoryWipe.isDeletableRoot(URL(fileURLWithPath: "/"), home: home))
        XCTAssertFalse(MemoryWipe.isDeletableRoot(URL(fileURLWithPath: "/Users"), home: home))
        XCTAssertTrue(
            MemoryWipe.isDeletableRoot(URL(fileURLWithPath: "/Users/example/Minne"), home: home))

        // And the refusal is reported rather than swallowed.
        let dangerous = MemoryPaths(memoryRoot: home, appSupport: paths.appSupport)
        let report = MemoryWipe.wipe(paths: dangerous, home: home)
        XCTAssertEqual(report.failed.map(\.path), [home.path])
        XCTAssertTrue(report.summary.contains("could not be removed"))
    }

    func testConfirmationIgnoresCaseAndSurroundingSpaceButNothingElse() {
        XCTAssertTrue(MemoryWipe.matchesConfirmation("delete"))
        XCTAssertTrue(MemoryWipe.matchesConfirmation("  DELETE \n"))
        XCTAssertFalse(MemoryWipe.matchesConfirmation("delete everything"))
        XCTAssertFalse(MemoryWipe.matchesConfirmation("del"))
        XCTAssertFalse(MemoryWipe.matchesConfirmation(""))
    }
}
