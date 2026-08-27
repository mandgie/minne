import Foundation

/// How long raw captures are kept. The wiki is never pruned — distilled pages
/// are meant to outlive the captures they came from.
struct RetentionPolicy: Equatable, Sendable {
    static let defaultDays = 90
    static let defaultsKey = "retentionDays"

    /// Days of raw sources to keep; zero or less keeps everything forever.
    var days: Int

    init(days: Int = RetentionPolicy.defaultDays) {
        self.days = days
    }

    /// Reads the setting US-015 will expose in Settings. Read as an object
    /// rather than an integer so that an absent key ("never configured", 90
    /// days) stays distinguishable from a stored 0 ("keep everything").
    static func fromUserDefaults(_ defaults: UserDefaults = .standard) -> RetentionPolicy {
        let stored = defaults.object(forKey: defaultsKey) as? Int
        return RetentionPolicy(days: stored ?? defaultDays)
    }

    /// Captures older than this are pruned; nil when retention is off.
    func cutoff(now: Date) -> Date? {
        days > 0 ? now.addingTimeInterval(-Double(days) * 86_400) : nil
    }
}

/// Persists snapshots as immutable markdown and keeps the search index in step.
///
/// Order matters: the markdown is written first, the index row second. The
/// files are the memory; the index is derived from them. A crash between the
/// two loses a row from search (recoverable by reindexing) rather than a
/// capture (not recoverable at all).
final class SourceStore {
    /// Where a snapshot ended up — the citation a wiki page will carry.
    struct Reference: Equatable, Sendable {
        /// e.g. `sources/2026-08-17/1400-safari.md`
        let path: String
        /// 1-based snapshot number within that file.
        let section: Int
        /// The form used in wiki citations: `path#section`.
        var citation: String { "\(path)#\(section)" }
    }

    struct PruneReport: Equatable, Sendable {
        var removedDays: [String] = []
        var removedSnapshots: Int = 0
        var isEmpty: Bool { removedDays.isEmpty && removedSnapshots == 0 }
    }

    let paths: MemoryPaths
    private let document: SourceDocument
    private let timeZone: TimeZone
    /// nil while the index is unavailable — the store then degrades to
    /// "writing markdown, no search" rather than refusing to persist at all.
    /// A corrupt derived file must never hold the ground truth hostage.
    private var index: SnapshotIndex?
    /// Why the index is unavailable, when it is.
    private var indexFailure: String?
    /// The last markdown write that failed, until a write succeeds again.
    private var lastWriteFailure: String?
    private var lastCaptureAt: Date?
    private let fileManager: FileManager
    /// Next section number per source file, so a repeat capture into the same
    /// hour does not re-read the file it just appended to.
    private var nextSection: [String: Int] = [:]

    /// Creates the memory root if missing and opens the index. Only an
    /// unusable memory root throws; a failed index open is a degraded store.
    init(
        paths: MemoryPaths = .resolved(), timeZone: TimeZone = .current,
        fileManager: FileManager = .default
    ) throws {
        self.paths = paths
        self.timeZone = timeZone
        self.document = SourceDocument(timeZone: timeZone)
        self.fileManager = fileManager
        let created = try MemorySeed.seed(paths, fileManager: fileManager)
        do {
            self.index = try SnapshotIndex(url: paths.database)
        } catch {
            self.index = nil
            self.indexFailure = StorageHealth.describe(error)
            BrainClient.log(
                "search index unavailable — capturing without search until a rebuild: \(error)")
        }
        if !created.isEmpty {
            BrainClient.log(
                "memory root \(paths.memoryRoot.path): seeded \(created.joined(separator: ", "))")
        }
    }

    /// Appends a snapshot to its hour's source file and indexes it.
    ///
    /// The markdown write self-heals once: a memory root deleted or replaced
    /// mid-run (the folder moved, a backup restored) invalidates the cached
    /// section numbers and possibly the whole tree, so on any write failure the
    /// root is re-seeded and the write retried before the failure is reported.
    @discardableResult
    func record(_ snapshot: CaptureSnapshot) throws -> Reference {
        let relativePath = document.relativePath(for: snapshot)
        let url = paths.memoryRoot.appendingPathComponent(relativePath)
        let section: Int
        do {
            section = try write(snapshot, to: url, relativePath: relativePath)
        } catch {
            nextSection[relativePath] = nil
            do {
                _ = try MemorySeed.seed(paths, fileManager: fileManager)
                section = try write(snapshot, to: url, relativePath: relativePath)
                BrainClient.log("memory root healed — re-seeded and the capture retried")
            } catch {
                lastWriteFailure = StorageHealth.describe(error)
                throw error
            }
        }
        lastWriteFailure = nil
        lastCaptureAt = snapshot.capturedAt
        if let index {
            do {
                try index.insert(snapshot, sourcePath: relativePath, section: section)
            } catch {
                // The capture is safe on disk; only search degrades. Close the
                // handle so the state is unambiguous until a rebuild.
                index.close()
                self.index = nil
                indexFailure = StorageHealth.describe(error)
                BrainClient.log("index write failed — degraded until a rebuild: \(error)")
            }
        }
        return Reference(path: relativePath, section: section)
    }

    /// The markdown half of `record`, one attempt.
    private func write(_ snapshot: CaptureSnapshot, to url: URL, relativePath: String) throws
        -> Int
    {
        let section = try nextSectionNumber(for: relativePath, at: url, snapshot: snapshot)
        try append(document.section(number: section, for: snapshot), to: url)
        nextSection[relativePath] = section + 1
        return section
    }

    // MARK: - Health

    /// The store's condition, for the menu bar and Settings. Snapshot count
    /// comes from the index (the only place it is cheap); a degraded store
    /// reports the reason instead.
    func health() -> StorageHealth {
        if let lastWriteFailure { return .failing(reason: lastWriteFailure) }
        guard let index else {
            return .degraded(
                reason: indexFailure ?? "the search index is unavailable",
                lastCaptureAt: lastCaptureAt)
        }
        let count = (try? index.count()) ?? 0
        return .healthy(snapshots: count, lastCaptureAt: lastCaptureAt)
    }

    // MARK: - Rebuilding the index

    struct RebuildReport: Equatable, Sendable {
        var files = 0
        var snapshots = 0
        var skippedSections = 0
        /// Highest rowid in the rebuilt index — what the brain's sync
        /// watermark must be moved to, since the rebuild renumbered every row.
        var maxId: Int64 = 0
    }

    /// Builds a fresh index at `stagingURL` from every file under `sources/`.
    ///
    /// Static and self-contained on purpose: it touches nothing of the live
    /// store, so it can run off the main actor while capture continues, and
    /// a crash mid-build leaves only a staging file. `adoptIndex` does the
    /// swap. The staging database is checkpointed and closed before this
    /// returns, so the file is complete and sidecar-free.
    static func buildIndex(
        paths: MemoryPaths, timeZone: TimeZone, at stagingURL: URL,
        fileManager: FileManager = .default, progress: ((_ files: Int) -> Void)? = nil
    ) throws -> RebuildReport {
        try? fileManager.removeItem(at: stagingURL)
        let staging = try SnapshotIndex(url: stagingURL)
        defer { staging.close() }
        let parser = SourceFileParser(timeZone: timeZone)
        var report = RebuildReport()
        let days =
            (try? fileManager.contentsOfDirectory(atPath: paths.sources.path))?.sorted() ?? []
        for day in days {
            let directory = paths.sources.appendingPathComponent(day, isDirectory: true)
            let files =
                (try? fileManager.contentsOfDirectory(atPath: directory.path))?.sorted() ?? []
            for name in files where name.hasSuffix(".md") {
                let url = directory.appendingPathComponent(name)
                guard let contents = try? String(contentsOf: url, encoding: .utf8) else {
                    continue
                }
                let parsed = parser.parse(contents)
                let relativePath = "sources/\(day)/\(name)"
                // Sections in file order: ids then follow capture order within
                // the file, and the watermark stays meaningful.
                for entry in parsed.snapshots.sorted(by: { $0.section < $1.section }) {
                    let id = try staging.insert(
                        entry.snapshot, sourcePath: relativePath, section: entry.section)
                    report.maxId = max(report.maxId, id)
                    report.snapshots += 1
                }
                report.skippedSections += parsed.skippedSections
                report.files += 1
                progress?(report.files)
            }
        }
        try staging.checkpointTruncate()
        return report
    }

    /// Swaps a freshly built index into place and reopens it. The old file and
    /// its WAL sidecars only go once the staging file is ready to move, and the
    /// brain — which opens the database per query, read-only — simply sees the
    /// new file on its next search.
    func adoptIndex(from stagingURL: URL) throws {
        index?.close()
        index = nil
        for url in MemoryWipe.derivedFiles(paths).prefix(3) {  // db, -wal, -shm
            try? fileManager.removeItem(at: url)
        }
        try fileManager.moveItem(at: stagingURL, to: paths.database)
        index = try SnapshotIndex(url: paths.database)
        indexFailure = nil
    }

    /// Deletes raw sources and index rows older than `policy` allows. Whole day
    /// directories go at once: a source file is only ever appended to during
    /// its own hour, so a day past the cutoff has nothing live in it.
    @discardableResult
    func prune(policy: RetentionPolicy, now: Date = Date()) throws -> PruneReport {
        guard let cutoff = policy.cutoff(now: now) else { return PruneReport() }
        var report = PruneReport()
        let days = (try? fileManager.contentsOfDirectory(atPath: paths.sources.path)) ?? []
        for day in days.sorted() {
            guard let dayStart = document.date(fromDay: day) else { continue }
            // Keep the day until its last possible capture is past the cutoff.
            guard dayStart.addingTimeInterval(86_400) < cutoff else { continue }
            let directory = paths.sources.appendingPathComponent(day, isDirectory: true)
            try fileManager.removeItem(at: directory)
            nextSection = nextSection.filter { !$0.key.hasPrefix("sources/\(day)/") }
            report.removedDays.append(day)
        }
        // A degraded store still prunes files; the stale index rows go with
        // the rebuild that ends the degradation.
        report.removedSnapshots = try index?.deleteSnapshots(before: cutoff) ?? 0
        return report
    }

    enum StoreError: Error, CustomStringConvertible {
        case indexUnavailable(reason: String)

        var description: String {
            switch self {
            case .indexUnavailable(let reason): return "search index unavailable: \(reason)"
            }
        }
    }

    /// Read path for tests and diagnostics; the brain serves search in
    /// production, reading the same database read-only.
    func search(matching expression: String, limit: Int = 20) throws -> [SnapshotIndex.Hit] {
        guard let index else {
            throw StoreError.indexUnavailable(reason: indexFailure ?? "not open")
        }
        return try index.search(matching: expression, limit: limit)
    }

    func indexedCount() throws -> Int {
        guard let index else {
            throw StoreError.indexUnavailable(reason: indexFailure ?? "not open")
        }
        return try index.count()
    }

    // MARK: - Appending

    /// The file's next snapshot number. The file on disk is the authority —
    /// Minne may have been restarted mid-hour, and the numbering has to
    /// continue rather than start over.
    private func nextSectionNumber(for relativePath: String, at url: URL, snapshot: CaptureSnapshot)
        throws -> Int
    {
        // The cache is only as good as the file it describes: a memory root
        // deleted mid-run used to wedge every append until the hour rolled
        // over, because the cached number skipped the exists-check below.
        if let cached = nextSection[relativePath], fileManager.fileExists(atPath: url.path) {
            return cached
        }
        nextSection[relativePath] = nil
        guard let existing = try? String(contentsOf: url, encoding: .utf8) else {
            // Creating a file is the moment to notice a vanished root: seeding
            // is four stat calls when everything exists, and rebuilds
            // SCHEMA.md and the wiki when the folder was deleted mid-run.
            _ = try MemorySeed.seed(paths, fileManager: fileManager)
            try fileManager.createDirectory(
                at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
            try document.header(for: snapshot).write(to: url, atomically: true, encoding: .utf8)
            return 1
        }
        return Self.highestSectionNumber(in: existing) + 1
    }

    /// Highest `## Snapshot N` in a source file. Deliberately the maximum
    /// rather than a count: captured text can itself contain a line that looks
    /// like a heading (Minne reading its own sources in an editor), and
    /// over-counting only skips a number where under-counting would overwrite
    /// a snapshot's citation.
    static func highestSectionNumber(in contents: String) -> Int {
        var highest = 0
        for line in contents.split(whereSeparator: \.isNewline) {
            guard line.hasPrefix("## Snapshot ") else { continue }
            let rest = line.dropFirst("## Snapshot ".count)
            let digits = rest.prefix { $0.isNumber }
            if let number = Int(digits) { highest = max(highest, number) }
        }
        return highest
    }

    private func append(_ text: String, to url: URL) throws {
        let handle = try FileHandle(forWritingTo: url)
        defer { try? handle.close() }
        try handle.seekToEnd()
        try handle.write(contentsOf: Data(text.utf8))
    }
}

extension SourceDocument {
    /// Parses a `sources/` day directory name back into its local midnight.
    func date(fromDay day: String) -> Date? {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.timeZone = timeZone
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: day)
    }
}
