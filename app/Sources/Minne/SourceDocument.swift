import Foundation

/// The markdown format of a raw source file — pure text, no I/O.
///
/// One file per app per hour (`sources/2026-08-17/1400-safari.md`): a header
/// written when the file is created, then one appended section per snapshot.
/// Nothing already on disk is ever rewritten, so the format has to survive
/// being produced a section at a time, by a process that may be killed between
/// any two of them.
struct SourceDocument {
    /// Bucketing is in local time: a source file is a slice of the user's day,
    /// not of UTC. Injectable so tests get deterministic file names.
    let timeZone: TimeZone

    init(timeZone: TimeZone = .current) {
        self.timeZone = timeZone
    }

    /// Which file a snapshot belongs in, relative to the memory root.
    func relativePath(for snapshot: CaptureSnapshot) -> String {
        let slug = Self.slug(appName: snapshot.appName, bundleIdentifier: snapshot.bundleIdentifier)
        return "sources/\(day(snapshot.capturedAt))/\(hourBucket(snapshot.capturedAt))-\(slug).md"
    }

    /// Frontmatter plus title, written once when the file is created. Only the
    /// facts that hold for the whole hour bucket go here — the window title and
    /// URL change from capture to capture, so they live in the sections.
    func header(for snapshot: CaptureSnapshot) -> String {
        """
        ---
        type: source
        app: \(Self.yaml(snapshot.appName))
        bundle_id: \(Self.yaml(snapshot.bundleIdentifier))
        date: \(day(snapshot.capturedAt))
        hour: \(Self.yaml(hourBucket(snapshot.capturedAt)))
        started: \(timestamp(snapshot.capturedAt))
        ---

        # \(Self.headingSafe(snapshot.appName)) — \(day(snapshot.capturedAt)) \
        \(hourLabel(snapshot.capturedAt))

        <!-- Append-only capture log: each section is written once and never edited. -->

        """
    }

    /// One snapshot, appended verbatim to the file. `number` is the 1-based
    /// position in the file and the anchor a wiki page cites
    /// (`sources/2026-08-17/1400-safari.md#3`).
    func section(number: Int, for snapshot: CaptureSnapshot) -> String {
        var metadata = """
            time: \(timestamp(snapshot.capturedAt))
            window: \(Self.yaml(snapshot.windowTitle))
            """
        if let url = snapshot.url { metadata += "\nurl: \(Self.yaml(url))" }
        if snapshot.truncated { metadata += "\ntruncated: true" }
        if snapshot.redactions > 0 { metadata += "\nredactions: \(snapshot.redactions)" }
        let fence = Self.fence(for: snapshot.text)
        return """

            ## Snapshot \(number) — \(clock(snapshot.capturedAt))

            ```yaml
            \(metadata)
            ```

            \(fence)text
            \(snapshot.text)
            \(fence)

            """
    }

    // MARK: - Components

    func day(_ date: Date) -> String { format(date, "yyyy-MM-dd") }
    /// Start of the hour the capture falls in: 14:31 → "1400".
    func hourBucket(_ date: Date) -> String { format(date, "HH") + "00" }
    func clock(_ date: Date) -> String { format(date, "HH:mm:ss") }
    /// The bucket's hour as a heading reads: 14:31 → "14:00".
    func hourLabel(_ date: Date) -> String { format(date, "HH") + ":00" }
    func timestamp(_ date: Date) -> String { format(date, "yyyy-MM-dd'T'HH:mm:ssXXXXX") }

    private func format(_ date: Date, _ template: String) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.timeZone = timeZone
        formatter.dateFormat = template
        return formatter.string(from: date)
    }

    /// Filename-safe app identifier: "Google Chrome" → `google-chrome`.
    /// Falls back to the bundle id, and then to `app`, so a nameless process
    /// still gets a stable file rather than a broken path.
    static func slug(appName: String, bundleIdentifier: String) -> String {
        for candidate in [appName, bundleIdentifier] {
            let slug = slugify(candidate)
            if !slug.isEmpty { return slug }
        }
        return "app"
    }

    private static func slugify(_ value: String) -> String {
        let allowed = CharacterSet.alphanumerics
        var slug = ""
        var pendingSeparator = false
        for scalar in value.folding(options: .diacriticInsensitive, locale: nil).unicodeScalars {
            if allowed.contains(scalar) {
                if pendingSeparator && !slug.isEmpty { slug.append("-") }
                pendingSeparator = false
                slug.unicodeScalars.append(scalar)
            } else {
                pendingSeparator = true
            }
        }
        return String(slug.lowercased().prefix(48))
    }

    /// A code fence long enough to contain `text` whatever it holds — captured
    /// text routinely *is* markdown, backticks and all.
    static func fence(for text: String) -> String {
        var longestRun = 0
        var run = 0
        for character in text {
            run = character == "`" ? run + 1 : 0
            longestRun = max(longestRun, run)
        }
        return String(repeating: "`", count: max(3, longestRun + 1))
    }

    /// Double-quoted YAML scalar. Everything Minne writes is quoted rather than
    /// bare: a window title is arbitrary user text and will contain `:` and `#`.
    static func yaml(_ value: String) -> String {
        var escaped = ""
        for character in value {
            switch character {
            case "\\": escaped += "\\\\"
            case "\"": escaped += "\\\""
            case "\n", "\r", "\t": escaped += " "
            default: escaped.append(character)
            }
        }
        return "\"\(escaped)\""
    }

    /// Collapses a value to one line so it cannot break out of a heading.
    static func headingSafe(_ value: String) -> String {
        value.split(whereSeparator: \.isNewline).joined(separator: " ")
    }
}
