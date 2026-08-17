import XCTest

@testable import Minne

/// First-run seeding, and the guard that keeps the seeded text identical to
/// the brain's templates.
final class MemorySeedTests: XCTestCase {
    private var root: URL!
    private var paths: MemoryPaths!

    override func setUpWithError() throws {
        root = URL(fileURLWithPath: NSTemporaryDirectory(), isDirectory: true)
            .appendingPathComponent("minne-seed-\(UUID().uuidString)", isDirectory: true)
        paths = MemoryPaths(
            memoryRoot: root.appendingPathComponent("Minne", isDirectory: true),
            appSupport: root.appendingPathComponent("Support", isDirectory: true))
    }

    override func tearDownWithError() throws {
        try? FileManager.default.removeItem(at: root)
    }

    func testSeedsTheMemoryRootOnFirstRun() throws {
        let created = try MemorySeed.seed(paths)
        // The root itself has no path relative to itself, so it reports absolute.
        XCTAssertEqual(created.first, paths.memoryRoot.path)
        XCTAssertEqual(
            Array(created.dropFirst()), ["sources", "wiki", "SCHEMA.md", "index.md", "log.md"])
        for url in [paths.sources, paths.wiki] {
            var isDirectory: ObjCBool = false
            XCTAssertTrue(
                FileManager.default.fileExists(atPath: url.path, isDirectory: &isDirectory)
                    && isDirectory.boolValue, url.path)
        }
        XCTAssertEqual(
            try String(contentsOf: paths.schema, encoding: .utf8), MemorySeed.schemaTemplate)
    }

    func testSeedingIsIdempotentAndNeverOverwrites() throws {
        _ = try MemorySeed.seed(paths)
        try "mine now\n".write(to: paths.index, atomically: true, encoding: .utf8)
        XCTAssertEqual(try MemorySeed.seed(paths), [])
        XCTAssertEqual(try String(contentsOf: paths.index, encoding: .utf8), "mine now\n")
    }

    func testDeletedFilesAreReseeded() throws {
        _ = try MemorySeed.seed(paths)
        try FileManager.default.removeItem(at: paths.log)
        XCTAssertEqual(try MemorySeed.seed(paths), ["log.md"])
        XCTAssertEqual(try String(contentsOf: paths.log, encoding: .utf8), MemorySeed.logTemplate)
    }

    /// The bootstrap wiki has to satisfy the schema it ships with. The real
    /// check is `wiki-lint` in the brain (brain/src/wiki-lint.test.ts, which
    /// lints exactly these templates); this is the Swift-side smoke test that
    /// the two root pages carry the frontmatter the linter requires, and that
    /// the log starts with no entries.
    func testSeededWikiConformsToTheSchema() throws {
        _ = try MemorySeed.seed(paths)
        let index = try String(contentsOf: paths.index, encoding: .utf8)
        for field in ["title: Index", "type: index", "summary: ", "last_updated: "] {
            XCTAssertTrue(index.contains(field), "index.md is missing \(field)")
        }
        let log = try String(contentsOf: paths.log, encoding: .utf8)
        XCTAssertTrue(log.hasPrefix("---\ntitle: Log\ntype: log\n"))
        XCTAssertFalse(log.contains("\n## "), "a fresh log has no entries")
    }

    /// `brain/templates/` is the single source of truth for the schema; the
    /// constants in MemorySeed are a copy so that a first run can seed a
    /// memory without the brain. Regenerate them from those files when this
    /// fails — never the other way round.
    func testTemplatesMatchTheBrainsCopy() throws {
        for (name, seeded) in [
            ("SCHEMA.md", MemorySeed.schemaTemplate),
            ("index.md", MemorySeed.indexTemplate),
            ("log.md", MemorySeed.logTemplate),
        ] {
            let url = Self.brainTemplates.appendingPathComponent(name)
            let canonical = try String(contentsOf: url, encoding: .utf8)
            XCTAssertEqual(
                seeded, canonical,
                "MemorySeed has drifted from brain/templates/\(name) — copy that file's text in")
        }
    }

    /// `<repo>/brain/templates`, found from this file rather than the working
    /// directory, which `swift test` does not promise.
    private static let brainTemplates = URL(fileURLWithPath: #filePath)
        .deletingLastPathComponent()  // MinneTests
        .deletingLastPathComponent()  // Tests
        .deletingLastPathComponent()  // app
        .deletingLastPathComponent()  // repo root
        .appendingPathComponent("brain/templates", isDirectory: true)
}
