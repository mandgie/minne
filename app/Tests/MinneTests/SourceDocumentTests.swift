import XCTest

@testable import Minne

/// The on-disk shape of a raw source file. These assertions are the format
/// contract SCHEMA.md documents and the wiki layer will parse, so they are
/// deliberately literal about the bytes.
final class SourceDocumentTests: XCTestCase {
    private let zone = TimeZone(identifier: "Europe/Stockholm")!
    private lazy var document = SourceDocument(timeZone: zone)

    private func date(_ hour: Int, _ minute: Int, _ second: Int, day: Int = 17) -> Date {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = zone
        return calendar.date(
            from: DateComponents(
                year: 2026, month: 8, day: day, hour: hour, minute: minute, second: second))!
    }

    private func snapshot(
        _ text: String = "some captured text", app: String = "Safari",
        bundle: String = "com.apple.Safari", title: String = "Docs", url: String? = nil,
        at date: Date? = nil, truncated: Bool = false, redactions: Int = 0
    ) -> CaptureSnapshot {
        CaptureSnapshot(
            capturedAt: date ?? self.date(14, 31, 7), bundleIdentifier: bundle, appName: app,
            windowTitle: title, url: url, text: text, truncated: truncated, redactions: redactions)
    }

    // MARK: - Bucketing

    func testOneFilePerAppPerHour() {
        XCTAssertEqual(
            document.relativePath(for: snapshot(at: date(14, 0, 0))),
            "sources/2026-08-17/1400-safari.md")
        // Anything in the same hour lands in the same file …
        XCTAssertEqual(
            document.relativePath(for: snapshot(at: date(14, 59, 59))),
            "sources/2026-08-17/1400-safari.md")
        // … the next hour starts a new one …
        XCTAssertEqual(
            document.relativePath(for: snapshot(at: date(15, 0, 0))),
            "sources/2026-08-17/1500-safari.md")
        // … and so does another app in the same hour.
        XCTAssertEqual(
            document.relativePath(
                for: snapshot(app: "Google Chrome", bundle: "com.google.Chrome")),
            "sources/2026-08-17/1400-google-chrome.md")
    }

    func testBucketsFollowLocalTimeNotUTC() {
        // 00:30 in Stockholm is the previous day in UTC; the file belongs to
        // the user's day, not the server's.
        XCTAssertEqual(
            document.relativePath(for: snapshot(at: date(0, 30, 0))),
            "sources/2026-08-17/0000-safari.md")
    }

    func testSlugFallsBackFromNameToBundleIdToAConstant() {
        XCTAssertEqual(
            SourceDocument.slug(appName: "Café Notes", bundleIdentifier: "x"), "cafe-notes")
        XCTAssertEqual(
            SourceDocument.slug(appName: "  ", bundleIdentifier: "com.apple.Mail"), "com-apple-mail"
        )
        XCTAssertEqual(SourceDocument.slug(appName: "", bundleIdentifier: "…"), "app")
        XCTAssertEqual(SourceDocument.slug(appName: "IINA+", bundleIdentifier: "x"), "iina")
    }

    // MARK: - Header

    func testHeaderCarriesTheBucketMetadataAsFrontmatter() {
        let header = document.header(for: snapshot())
        XCTAssertTrue(header.hasPrefix("---\ntype: source\n"), header)
        XCTAssertTrue(header.contains("\napp: \"Safari\"\n"), header)
        XCTAssertTrue(header.contains("\nbundle_id: \"com.apple.Safari\"\n"), header)
        XCTAssertTrue(header.contains("\ndate: 2026-08-17\n"), header)
        XCTAssertTrue(header.contains("\nhour: \"1400\"\n"), header)
        XCTAssertTrue(header.contains("\nstarted: 2026-08-17T14:31:07+02:00\n"), header)
        XCTAssertTrue(header.contains("\n# Safari — 2026-08-17 14:00\n"), header)
    }

    // MARK: - Sections

    func testSectionCarriesTheSnapshotMetadata() {
        let section = document.section(
            number: 3,
            for: snapshot(
                "hello", title: "Minne — a local memory", url: "https://example.com/minne"))
        XCTAssertEqual(
            section,
            """

            ## Snapshot 3 — 14:31:07

            ```yaml
            time: 2026-08-17T14:31:07+02:00
            window: "Minne — a local memory"
            url: "https://example.com/minne"
            ```

            ```text
            hello
            ```

            """)
    }

    func testOptionalFieldsAppearOnlyWhenTheyApply() {
        let plain = document.section(number: 1, for: snapshot())
        XCTAssertFalse(plain.contains("url:"))
        XCTAssertFalse(plain.contains("truncated:"))
        XCTAssertFalse(plain.contains("redactions:"))

        let flagged = document.section(
            number: 1, for: snapshot(truncated: true, redactions: 2))
        XCTAssertTrue(flagged.contains("\ntruncated: true\n"))
        XCTAssertTrue(flagged.contains("\nredactions: 2\n"))
    }

    func testTitlesAndURLsAreQuotedSoTheyCannotBreakTheYAML() {
        let section = document.section(
            number: 1,
            for: snapshot(title: "note: \"quoted\" — a\\b", url: "https://x.test/#a: b"))
        XCTAssertTrue(section.contains("window: \"note: \\\"quoted\\\" — a\\\\b\""), section)
        XCTAssertTrue(section.contains("url: \"https://x.test/#a: b\""), section)
        // A title spanning lines must not become two YAML lines.
        let multiline = document.section(number: 1, for: snapshot(title: "one\ntwo"))
        XCTAssertTrue(multiline.contains("window: \"one two\""), multiline)
    }

    func testCapturedMarkdownCannotEscapeItsCodeFence() {
        // Captured text is frequently markdown — a fence inside it must not
        // close the block Minne wrapped it in.
        let text = "here is a fence:\n```swift\nlet x = 1\n```\ndone"
        let section = document.section(number: 1, for: snapshot(text))
        XCTAssertTrue(section.contains("````text\n\(text)\n````"), section)
        XCTAssertEqual(SourceDocument.fence(for: "no backticks"), "```")
        XCTAssertEqual(SourceDocument.fence(for: "a ```` b"), "`````")
    }
}
