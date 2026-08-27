import Foundation

/// Reads a `sources/` file back into the snapshots that were appended to it —
/// the other half of `SourceDocument`, and what makes the index genuinely
/// rebuildable rather than rebuildable-in-principle.
///
/// The format is append-only and may end mid-write (the process can die
/// between any two sections), so parsing is deliberately forgiving: a section
/// that cannot be read is skipped and counted, never allowed to fail the file.
/// Fences are tracked exactly — captured text routinely contains `## Snapshot`
/// lines and backtick runs, and only a line matching the section's own opening
/// fence closes it (the writer picks a fence longer than any run in the text).
struct SourceFileParser {
    struct ParsedSnapshot: Equatable {
        let section: Int
        let snapshot: CaptureSnapshot
    }

    struct ParsedFile: Equatable {
        var appName = ""
        var bundleIdentifier = ""
        var snapshots: [ParsedSnapshot] = []
        /// Sections that were malformed beyond use (no parsable timestamp).
        var skippedSections = 0
    }

    /// Bucketing timezone, only used to keep parity with the writer; the
    /// timestamps in the file carry their own zone offset.
    let timeZone: TimeZone

    init(timeZone: TimeZone = .current) {
        self.timeZone = timeZone
    }

    func parse(_ contents: String) -> ParsedFile {
        var file = ParsedFile()
        var lines = contents.split(separator: "\n", omittingEmptySubsequences: false)[...]

        // Frontmatter: the app and bundle id that hold for the whole file.
        if lines.first == "---" {
            lines = lines.dropFirst()
            while let line = lines.first, line != "---" {
                lines = lines.dropFirst()
                if let value = Self.value(of: "app", in: line) { file.appName = value }
                if let value = Self.value(of: "bundle_id", in: line) {
                    file.bundleIdentifier = value
                }
            }
            lines = lines.dropFirst()
        }

        // Sections. A boundary only counts outside a fence.
        var openFence: Substring?
        var fenceLanguage: Substring?
        var current: SectionAccumulator?
        for line in lines {
            if let fence = openFence {
                if line == fence {
                    openFence = nil
                    if fenceLanguage != "yaml" { current?.textDone = true }
                    fenceLanguage = nil
                } else if fenceLanguage == "yaml" {
                    current?.metadata.append(line)
                } else if current?.textDone == false {
                    current?.textLines.append(line)
                }
                continue
            }
            let backticks = line.prefix { $0 == "`" }
            if backticks.count >= 3 {
                openFence = backticks
                fenceLanguage = line.dropFirst(backticks.count)
                continue
            }
            if let number = Self.sectionNumber(of: line) {
                current.map { finish($0, into: &file) }
                current = SectionAccumulator(section: number)
            }
        }
        current.map { finish($0, into: &file) }
        return file
    }

    // MARK: - Section assembly

    private struct SectionAccumulator {
        let section: Int
        var metadata: [Substring] = []
        var textLines: [Substring] = []
        /// The first non-yaml fence is the snapshot's text; later fences in a
        /// malformed file are ignored rather than appended.
        var textDone = false
    }

    private func finish(_ accumulator: SectionAccumulator, into file: inout ParsedFile) {
        var capturedAt: Date?
        var windowTitle = ""
        var url: String?
        var truncated = false
        var redactions = 0
        for line in accumulator.metadata {
            if let value = Self.value(of: "time", in: line) {
                capturedAt = Self.timestampFormatter.date(from: value)
            }
            if let value = Self.value(of: "window", in: line) { windowTitle = value }
            if let value = Self.value(of: "url", in: line) { url = value }
            if let value = Self.value(of: "truncated", in: line) { truncated = value == "true" }
            if let value = Self.value(of: "redactions", in: line) { redactions = Int(value) ?? 0 }
        }
        guard let capturedAt else {
            file.skippedSections += 1
            return
        }
        file.snapshots.append(
            ParsedSnapshot(
                section: accumulator.section,
                snapshot: CaptureSnapshot(
                    capturedAt: capturedAt, bundleIdentifier: file.bundleIdentifier,
                    appName: file.appName, windowTitle: windowTitle, url: url,
                    text: accumulator.textLines.joined(separator: "\n"), truncated: truncated,
                    redactions: redactions)))
    }

    // MARK: - Lines and values

    /// `## Snapshot 3 — 14:00:12` → 3. The writer always appends the clock,
    /// but the number alone is enough to accept the heading.
    static func sectionNumber(of line: Substring) -> Int? {
        guard line.hasPrefix("## Snapshot ") else { return nil }
        let digits = line.dropFirst("## Snapshot ".count).prefix { $0.isNumber }
        return digits.isEmpty ? nil : Int(digits)
    }

    /// `key: value` with the writer's quoting undone. Bare scalars (time,
    /// truncated, redactions) come back as written.
    static func value(of key: String, in line: Substring) -> String? {
        guard line.hasPrefix("\(key): ") else { return nil }
        let raw = line.dropFirst(key.count + 2)
        guard raw.hasPrefix("\""), raw.hasSuffix("\""), raw.count >= 2 else {
            return String(raw)
        }
        var unescaped = ""
        var escaping = false
        for character in raw.dropFirst().dropLast() {
            if escaping {
                unescaped.append(character)
                escaping = false
            } else if character == "\\" {
                escaping = true
            } else {
                unescaped.append(character)
            }
        }
        return unescaped
    }

    /// Matches `SourceDocument.timestamp` exactly (en_US_POSIX, zone offset in
    /// the string itself, so the parser's own zone never shifts a capture).
    private static let timestampFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssXXXXX"
        return formatter
    }()
}
