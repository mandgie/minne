import Foundation
import SQLite3

/// SQLite full-text index over every snapshot ever written.
///
/// Derived data, and deliberately so: the markdown under `sources/` is the
/// ground truth, this file is what makes it searchable. Deleting `minne.db`
/// costs search until captures resume, never memory.
///
/// The app is the only writer; the brain opens the same file read-only to serve
/// `search_sources` (brain/src/sources.ts mirrors this schema — keep the two in
/// sync). That is why the database runs in WAL mode: a reader in another
/// process never blocks a capture, and a capture never blocks a reader.
final class SnapshotIndex {
    /// Bumped when the schema below changes in a way that needs migrating.
    static let schemaVersion: Int32 = 1

    enum IndexError: Error, CustomStringConvertible {
        case open(path: String, message: String)
        case sqlite(operation: String, message: String)

        var description: String {
            switch self {
            case let .open(path, message): return "cannot open \(path): \(message)"
            case let .sqlite(operation, message): return "\(operation) failed: \(message)"
            }
        }
    }

    /// One indexed snapshot, as returned by `search`.
    struct Hit: Equatable, Sendable {
        let id: Int64
        let capturedAt: Date
        let app: String
        let title: String
        let url: String?
        /// e.g. `sources/2026-08-17/1400-safari.md`
        let sourcePath: String
        /// 1-based snapshot number within that file.
        let section: Int
        /// Matching text with elisions, from FTS5's `snippet()`.
        let snippet: String
    }

    private var handle: OpaquePointer?

    /// Opens (creating if needed) the index at `url`, applying the schema.
    init(url: URL) throws {
        try FileManager.default.createDirectory(
            at: url.deletingLastPathComponent(), withIntermediateDirectories: true,
            attributes: [.posixPermissions: 0o700])
        var handle: OpaquePointer?
        let flags = SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE | SQLITE_OPEN_FULLMUTEX
        guard sqlite3_open_v2(url.path, &handle, flags, nil) == SQLITE_OK, let handle else {
            let message = handle.map { String(cString: sqlite3_errmsg($0)) } ?? "unknown error"
            if let handle { sqlite3_close_v2(handle) }
            throw IndexError.open(path: url.path, message: message)
        }
        self.handle = handle
        // busy_timeout so a capture waits out a reader's checkpoint rather than
        // failing; WAL so it rarely has to.
        try execute("PRAGMA busy_timeout = 3000;")
        try execute("PRAGMA journal_mode = WAL;")
        try execute("PRAGMA synchronous = NORMAL;")
        try execute(Self.schemaSQL)
        try execute("PRAGMA user_version = \(Self.schemaVersion);")
    }

    deinit {
        if let handle { sqlite3_close_v2(handle) }
    }

    /// `text` is the first column because `snippet()` is asked for column 0 —
    /// the captured text is what a search result should quote.
    static let schemaSQL = """
        CREATE TABLE IF NOT EXISTS snapshots (
            id INTEGER PRIMARY KEY,
            captured_at INTEGER NOT NULL,
            app TEXT NOT NULL,
            bundle_id TEXT NOT NULL,
            title TEXT NOT NULL,
            url TEXT,
            source_path TEXT NOT NULL,
            section INTEGER NOT NULL,
            text TEXT NOT NULL,
            UNIQUE (source_path, section)
        );
        CREATE INDEX IF NOT EXISTS snapshots_captured_at ON snapshots (captured_at);
        CREATE VIRTUAL TABLE IF NOT EXISTS snapshots_fts USING fts5 (
            text, title, app, url,
            content = 'snapshots', content_rowid = 'id',
            tokenize = 'unicode61 remove_diacritics 2'
        );
        CREATE TRIGGER IF NOT EXISTS snapshots_after_insert AFTER INSERT ON snapshots BEGIN
            INSERT INTO snapshots_fts (rowid, text, title, app, url)
            VALUES (new.id, new.text, new.title, new.app, new.url);
        END;
        CREATE TRIGGER IF NOT EXISTS snapshots_after_delete AFTER DELETE ON snapshots BEGIN
            INSERT INTO snapshots_fts (snapshots_fts, rowid, text, title, app, url)
            VALUES ('delete', old.id, old.text, old.title, old.app, old.url);
        END;
        """

    // MARK: - Writing

    /// Indexes one snapshot against the source file section it was written to.
    /// Re-indexing the same `(sourcePath, section)` replaces the old row, so a
    /// retry after a crash cannot leave a duplicate.
    @discardableResult
    func insert(_ snapshot: CaptureSnapshot, sourcePath: String, section: Int) throws -> Int64 {
        try run(
            "DELETE FROM snapshots WHERE source_path = ?1 AND section = ?2",
            bind: { statement in
                try Self.bind(statement, 1, text: sourcePath)
                try Self.bind(statement, 2, int: Int64(section))
            })
        try run(
            """
            INSERT INTO snapshots
                (captured_at, app, bundle_id, title, url, source_path, section, text)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
            """,
            bind: { statement in
                try Self.bind(statement, 1, int: Int64(snapshot.capturedAt.timeIntervalSince1970))
                try Self.bind(statement, 2, text: snapshot.appName)
                try Self.bind(statement, 3, text: snapshot.bundleIdentifier)
                try Self.bind(statement, 4, text: snapshot.windowTitle)
                try Self.bind(statement, 5, text: snapshot.url)
                try Self.bind(statement, 6, text: sourcePath)
                try Self.bind(statement, 7, int: Int64(section))
                try Self.bind(statement, 8, text: snapshot.text)
            })
        return sqlite3_last_insert_rowid(handle)
    }

    /// Drops every snapshot captured before `date`. The FTS entries go with
    /// them (the delete trigger); the source files are removed separately by
    /// `SourceStore.prune`.
    @discardableResult
    func deleteSnapshots(before date: Date) throws -> Int {
        try run(
            "DELETE FROM snapshots WHERE captured_at < ?1",
            bind: { try Self.bind($0, 1, int: Int64(date.timeIntervalSince1970)) })
        return Int(sqlite3_changes(handle))
    }

    func count() throws -> Int {
        var total = 0
        try query("SELECT count(*) FROM snapshots") { statement in
            total = Int(sqlite3_column_int64(statement, 0))
        }
        return total
    }

    // MARK: - Reading

    /// Ranked matches for an FTS5 expression (bare words are ANDed).
    ///
    /// The brain serves search in production — this is the read path for tests
    /// and for diagnosing what the app actually indexed. `expression` is passed
    /// to FTS5 as written, so a caller handing it raw user input must quote it
    /// first or expect a syntax error back.
    func search(matching expression: String, limit: Int = 20) throws -> [Hit] {
        var hits: [Hit] = []
        try query(
            """
            SELECT s.id, s.captured_at, s.app, s.title, s.url, s.source_path, s.section,
                   snippet(snapshots_fts, 0, '', '', '…', 12)
            FROM snapshots_fts
            JOIN snapshots s ON s.id = snapshots_fts.rowid
            WHERE snapshots_fts MATCH ?1
            ORDER BY bm25(snapshots_fts), s.captured_at DESC
            LIMIT ?2
            """,
            bind: { statement in
                try Self.bind(statement, 1, text: expression)
                try Self.bind(statement, 2, int: Int64(limit))
            }
        ) { statement in
            hits.append(
                Hit(
                    id: sqlite3_column_int64(statement, 0),
                    capturedAt: Date(
                        timeIntervalSince1970: Double(sqlite3_column_int64(statement, 1))),
                    app: Self.string(statement, 2) ?? "",
                    title: Self.string(statement, 3) ?? "",
                    url: Self.string(statement, 4),
                    sourcePath: Self.string(statement, 5) ?? "",
                    section: Int(sqlite3_column_int64(statement, 6)),
                    snippet: Self.string(statement, 7) ?? ""))
        }
        return hits
    }

    // MARK: - SQLite plumbing

    private static let transient = unsafeBitCast(
        -1, to: sqlite3_destructor_type.self)

    private func execute(_ sql: String) throws {
        var error: UnsafeMutablePointer<CChar>?
        guard sqlite3_exec(handle, sql, nil, nil, &error) == SQLITE_OK else {
            let message = error.map { String(cString: $0) } ?? lastErrorMessage
            sqlite3_free(error)
            throw IndexError.sqlite(operation: Self.firstLine(of: sql), message: message)
        }
    }

    private func run(
        _ sql: String, bind: (OpaquePointer) throws -> Void = { _ in }
    ) throws {
        try query(sql, bind: bind, row: { _ in })
    }

    /// Prepares, binds, and steps a statement, calling `row` for each result.
    private func query(
        _ sql: String, bind: (OpaquePointer) throws -> Void = { _ in },
        row: (OpaquePointer) -> Void
    ) throws {
        var statement: OpaquePointer?
        guard sqlite3_prepare_v2(handle, sql, -1, &statement, nil) == SQLITE_OK,
            let statement
        else {
            throw IndexError.sqlite(operation: Self.firstLine(of: sql), message: lastErrorMessage)
        }
        defer { sqlite3_finalize(statement) }
        try bind(statement)
        while true {
            switch sqlite3_step(statement) {
            case SQLITE_ROW: row(statement)
            case SQLITE_DONE: return
            default:
                throw IndexError.sqlite(
                    operation: Self.firstLine(of: sql), message: lastErrorMessage)
            }
        }
    }

    private static func bind(_ statement: OpaquePointer, _ index: Int32, text: String?) throws {
        let status =
            text.map { sqlite3_bind_text(statement, index, $0, -1, transient) }
            ?? sqlite3_bind_null(statement, index)
        guard status == SQLITE_OK else {
            throw IndexError.sqlite(operation: "bind \(index)", message: "status \(status)")
        }
    }

    private static func bind(_ statement: OpaquePointer, _ index: Int32, int value: Int64) throws {
        guard sqlite3_bind_int64(statement, index, value) == SQLITE_OK else {
            throw IndexError.sqlite(operation: "bind \(index)", message: "int64 rejected")
        }
    }

    private static func string(_ statement: OpaquePointer, _ column: Int32) -> String? {
        guard let bytes = sqlite3_column_text(statement, column) else { return nil }
        return String(cString: bytes)
    }

    private var lastErrorMessage: String {
        handle.map { String(cString: sqlite3_errmsg($0)) } ?? "no database handle"
    }

    private static func firstLine(of sql: String) -> String {
        String(sql.split(whereSeparator: \.isNewline).first ?? "SQL").trimmingCharacters(
            in: .whitespaces)
    }
}
