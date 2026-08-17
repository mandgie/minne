import Foundation

/// Where Minne keeps everything on disk.
///
/// Two roots, deliberately:
/// - `memoryRoot` (`~/Minne`) is the user's — plain markdown they can open in
///   Obsidian, grep, edit or delete. Nothing in it is a Minne-private format.
/// - `appSupport` (`~/Library/Application Support/Minne`) holds the derived and
///   the secret: the FTS index (rebuildable from the sources) and credentials.
///
/// Both are overridable by environment variable so tests and dev sandboxes
/// never touch the real ones. `MINNE_APP_SUPPORT_DIR` is the same variable the
/// brain reads (see brain/src/paths.ts) — the two halves must agree on where
/// `minne.db` lives, so they resolve it the same way.
struct MemoryPaths: Equatable, Sendable {
    /// `~/Minne` — the user-visible wiki root.
    let memoryRoot: URL
    /// `~/Library/Application Support/Minne` — index and credentials.
    let appSupport: URL

    static let memoryRootVariable = "MINNE_MEMORY_ROOT"
    static let appSupportVariable = "MINNE_APP_SUPPORT_DIR"

    init(memoryRoot: URL, appSupport: URL) {
        self.memoryRoot = memoryRoot
        self.appSupport = appSupport
    }

    static func resolved(
        environment: [String: String] = ProcessInfo.processInfo.environment,
        home: URL = URL(fileURLWithPath: NSHomeDirectory(), isDirectory: true)
    ) -> MemoryPaths {
        MemoryPaths(
            memoryRoot: override(environment[memoryRootVariable])
                ?? home.appendingPathComponent("Minne", isDirectory: true),
            appSupport: override(environment[appSupportVariable])
                ?? home
                .appendingPathComponent("Library/Application Support/Minne", isDirectory: true))
    }

    private static func override(_ value: String?) -> URL? {
        guard let value, !value.isEmpty else { return nil }
        return URL(fileURLWithPath: value, isDirectory: true)
    }

    /// Immutable raw captures, one directory per day.
    var sources: URL { memoryRoot.appendingPathComponent("sources", isDirectory: true) }
    /// Agent-maintained pages (US-010 onwards).
    var wiki: URL { memoryRoot.appendingPathComponent("wiki", isDirectory: true) }
    /// The human-owned contract the agent maintains the wiki against.
    var schema: URL { memoryRoot.appendingPathComponent("SCHEMA.md") }
    var index: URL { memoryRoot.appendingPathComponent("index.md") }
    var log: URL { memoryRoot.appendingPathComponent("log.md") }
    /// Full-text index over every snapshot. Derived data: deleting it costs
    /// search until the next capture, never memory.
    var database: URL { appSupport.appendingPathComponent("minne.db") }

    /// Path of `url` relative to the memory root, as it is cited in the wiki
    /// and stored in the index (e.g. `sources/2026-08-17/1400-safari.md`).
    /// Falls back to the absolute path if `url` is outside the root.
    func relativePath(of url: URL) -> String {
        let root = memoryRoot.standardizedFileURL.path
        let path = url.standardizedFileURL.path
        guard path.hasPrefix(root + "/") else { return path }
        return String(path.dropFirst(root.count + 1))
    }
}
