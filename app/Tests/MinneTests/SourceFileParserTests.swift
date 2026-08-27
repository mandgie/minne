import XCTest

@testable import Minne

/// The parser must read back exactly what `SourceDocument` wrote — the round
/// trip is what makes "the index is rebuildable from the sources" true.
final class SourceFileParserTests: XCTestCase {
    private let zone = TimeZone(identifier: "Europe/Stockholm")!

    private func snapshot(
        _ text: String, title: String = "Docs — draft: \"v2\"", url: String? = nil,
        truncated: Bool = false, redactions: Int = 0, at date: Date
    ) -> CaptureSnapshot {
        CaptureSnapshot(
            capturedAt: date, bundleIdentifier: "com.apple.Safari", appName: "Safari",
            windowTitle: title, url: url, text: text, truncated: truncated,
            redactions: redactions)
    }

    private func date(_ hour: Int, _ minute: Int) -> Date {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = zone
        return calendar.date(
            from: DateComponents(year: 2026, month: 8, day: 17, hour: hour, minute: minute))!
    }

    /// Writes a file the way SourceStore does: header once, sections appended.
    private func render(_ snapshots: [CaptureSnapshot]) -> String {
        let document = SourceDocument(timeZone: zone)
        var contents = document.header(for: snapshots[0])
        for (offset, snapshot) in snapshots.enumerated() {
            contents += document.section(number: offset + 1, for: snapshot)
        }
        return contents
    }

    func testRoundTripsEverySnapshotField() {
        let written = snapshot(
            "Flight booked for the Oslo move.\nSecond line.",
            url: "https://example.com/oslo", truncated: true, redactions: 2, at: date(14, 3))
        let parsed = SourceFileParser(timeZone: zone).parse(render([written]))
        XCTAssertEqual(parsed.appName, "Safari")
        XCTAssertEqual(parsed.bundleIdentifier, "com.apple.Safari")
        XCTAssertEqual(parsed.skippedSections, 0)
        XCTAssertEqual(parsed.snapshots.count, 1)
        XCTAssertEqual(parsed.snapshots[0].section, 1)
        // The parsed snapshot carries the file's identity plus the section's
        // own fields — byte-for-byte what was captured.
        XCTAssertEqual(parsed.snapshots[0].snapshot, written)
    }

    func testCapturedMarkdownCannotBreakTheParser() {
        // The trap the fence machinery exists for: text that *is* a source
        // file, headings, backticks and all.
        let hostile = """
            ## Snapshot 99 — 09:00:00

            ```yaml
            time: 1999-01-01T00:00:00+00:00
            ```

            ```text
            not a real section
            ```
            """
        let first = snapshot(hostile, at: date(14, 0))
        let second = snapshot("plain follow-up", at: date(14, 5))
        let parsed = SourceFileParser(timeZone: zone).parse(render([first, second]))
        XCTAssertEqual(parsed.snapshots.count, 2, "the embedded heading is text, not a boundary")
        XCTAssertEqual(parsed.snapshots[0].snapshot.text, hostile)
        XCTAssertEqual(parsed.snapshots[1].snapshot.text, "plain follow-up")
        XCTAssertEqual(
            parsed.snapshots[0].snapshot.capturedAt, date(14, 0),
            "the embedded yaml block's time must not win")
    }

    func testATruncatedFinalSectionIsSkippedNotFatal() {
        let good = snapshot("whole", at: date(14, 0))
        // The process died mid-append: a heading with no metadata yet.
        let contents = render([good]) + "\n## Snapshot 2 — 14:05:00\n"
        let parsed = SourceFileParser(timeZone: zone).parse(contents)
        XCTAssertEqual(parsed.snapshots.count, 1)
        XCTAssertEqual(parsed.skippedSections, 1)
    }
}
