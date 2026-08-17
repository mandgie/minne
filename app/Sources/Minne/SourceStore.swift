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
    private let index: SnapshotIndex
    private let fileManager: FileManager
    /// Next section number per source file, so a repeat capture into the same
    /// hour does not re-read the file it just appended to.
    private var nextSection: [String: Int] = [:]

    /// Creates the memory root if missing and opens the index.
    init(
        paths: MemoryPaths = .resolved(), timeZone: TimeZone = .current,
        fileManager: FileManager = .default
    ) throws {
        self.paths = paths
        self.document = SourceDocument(timeZone: timeZone)
        self.fileManager = fileManager
        let created = try MemorySeed.seed(paths, fileManager: fileManager)
        self.index = try SnapshotIndex(url: paths.database)
        if !created.isEmpty {
            BrainClient.log(
                "memory root \(paths.memoryRoot.path): seeded \(created.joined(separator: ", "))")
        }
    }

    /// Appends a snapshot to its hour's source file and indexes it.
    @discardableResult
    func record(_ snapshot: CaptureSnapshot) throws -> Reference {
        let relativePath = document.relativePath(for: snapshot)
        let url = paths.memoryRoot.appendingPathComponent(relativePath)
        let section = try nextSectionNumber(for: relativePath, at: url, snapshot: snapshot)
        try append(document.section(number: section, for: snapshot), to: url)
        nextSection[relativePath] = section + 1
        try index.insert(snapshot, sourcePath: relativePath, section: section)
        return Reference(path: relativePath, section: section)
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
        report.removedSnapshots = try index.deleteSnapshots(before: cutoff)
        return report
    }

    /// Read path for tests and diagnostics; the brain serves search in
    /// production, reading the same database read-only.
    func search(matching expression: String, limit: Int = 20) throws -> [SnapshotIndex.Hit] {
        try index.search(matching: expression, limit: limit)
    }

    func indexedCount() throws -> Int { try index.count() }

    // MARK: - Appending

    /// The file's next snapshot number. The file on disk is the authority —
    /// Minne may have been restarted mid-hour, and the numbering has to
    /// continue rather than start over.
    private func nextSectionNumber(for relativePath: String, at url: URL, snapshot: CaptureSnapshot)
        throws -> Int
    {
        if let cached = nextSection[relativePath] { return cached }
        guard let existing = try? String(contentsOf: url, encoding: .utf8) else {
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
