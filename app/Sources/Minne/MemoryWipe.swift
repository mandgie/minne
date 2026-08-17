import Foundation

/// "Delete all memory": removes everything Minne has ever learned.
///
/// Three kinds of thing go, and they live in two roots (see `MemoryPaths`):
/// the user's wiki and raw captures under `~/Minne`, the derived index and the
/// brain's sync watermark under Application Support, and the stored
/// credentials. `config.json` deliberately stays — which provider and model the
/// user picked is a preference, not a memory, and re-signing in is the account
/// section's job rather than a side effect of emptying the wiki.
///
/// Credentials are the brain's to hold, so the *file* removal here is the
/// fallback for a brain that is not running; `SettingsModel` asks the brain to
/// `logout` first, which is what makes an in-memory credential go too.
enum MemoryWipe {
    /// What the user has to type to arm the button. Compared case- and
    /// whitespace-insensitively: the confirmation exists to make the action
    /// deliberate, not to test typing.
    static let confirmationPhrase = "delete"

    static func matchesConfirmation(_ typed: String) -> Bool {
        typed.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() == confirmationPhrase
    }

    struct Report: Equatable, Sendable {
        /// Absolute paths that existed and are now gone.
        var removed: [String] = []
        /// Absolute paths that existed and could not be removed, with the reason.
        var failed: [(path: String, reason: String)] = []

        var isEmpty: Bool { removed.isEmpty && failed.isEmpty }

        static func == (lhs: Report, rhs: Report) -> Bool {
            lhs.removed == rhs.removed && lhs.failed.map(\.path) == rhs.failed.map(\.path)
        }

        /// One line for the settings sheet.
        var summary: String {
            if !failed.isEmpty {
                return
                    "Deleted \(removed.count) item(s); \(failed.count) could not be removed — \(failed[0].reason)"
            }
            if removed.isEmpty { return "Nothing to delete — memory was already empty." }
            return "Deleted \(removed.count) item(s). Minne starts over from here."
        }
    }

    /// A root Minne must refuse to delete however it was configured. An empty
    /// or misspelled `MINNE_MEMORY_ROOT` must not turn this into `rm -rf ~`.
    static func isDeletableRoot(_ url: URL, home: URL = URL(fileURLWithPath: NSHomeDirectory()))
        -> Bool
    {
        let path = url.standardizedFileURL.path
        guard path != "/", !path.isEmpty else { return false }
        guard path != home.standardizedFileURL.path else { return false }
        // At least two components below the root ("/Minne" is not a memory root
        // anyone configured on purpose).
        return url.standardizedFileURL.pathComponents.count > 2
    }

    /// Deletes the wiki, the raw captures, the search index, the brain's sync
    /// state and the credential file. Never throws: a wipe that only half
    /// succeeds must still report what it managed, so the UI can say so.
    @discardableResult
    static func wipe(
        paths: MemoryPaths, fileManager: FileManager = .default,
        home: URL = URL(fileURLWithPath: NSHomeDirectory())
    ) -> Report {
        var report = Report()

        if isDeletableRoot(paths.memoryRoot, home: home) {
            remove(paths.memoryRoot, into: &report, fileManager: fileManager)
        } else {
            report.failed.append(
                (
                    path: paths.memoryRoot.path,
                    reason: "refusing to delete \(paths.memoryRoot.path)"
                ))
        }

        for url in derivedFiles(paths) {
            remove(url, into: &report, fileManager: fileManager)
        }
        return report
    }

    /// Everything outside the memory root a wipe takes with it. SQLite names
    /// its sidecars `minne.db-wal`, not `minne.db.wal`, so they are spelled out
    /// rather than built with `appendingPathExtension`.
    static func derivedFiles(_ paths: MemoryPaths) -> [URL] {
        let database = paths.database
        let sidecars = ["-wal", "-shm"].map { suffix in
            database.deletingLastPathComponent()
                .appendingPathComponent(database.lastPathComponent + suffix)
        }
        return [database] + sidecars + [
            paths.appSupport.appendingPathComponent("sync-state.json"),
            paths.appSupport.appendingPathComponent("auth.json"),
        ]
    }

    private static func remove(_ url: URL, into report: inout Report, fileManager: FileManager) {
        guard fileManager.fileExists(atPath: url.path) else { return }
        do {
            try fileManager.removeItem(at: url)
            report.removed.append(url.path)
        } catch {
            report.failed.append((path: url.path, reason: "\(error)"))
        }
    }
}
