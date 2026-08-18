import XCTest

@testable import Minne

/// The "Recently remembered" submenu as data: decoding the brain's
/// `memory_recent` answer, phrasing relative times, and building the rows.
final class RecentMemoryTests: XCTestCase {
    private let today = "2026-08-18"

    // MARK: - Decoding

    func testParseReadsPagesInOrder() throws {
        let json = """
            {"type":"done","id":"m1","result":{"pages":[\
            {"path":"wiki/ingrid-berg.md","title":"Ingrid Berg","lastUpdated":"2026-08-18"},\
            {"path":"wiki/oslo-trip.md","title":"Oslo Trip","lastUpdated":"2026-08-10"}]}}
            """
        let event = try JSONDecoder().decode(BrainEvent.self, from: Data(json.utf8))
        guard case let .done(_, result) = event else {
            return XCTFail("expected done, got \(event)")
        }
        XCTAssertEqual(
            RecentMemoryPage.parse(result),
            [
                RecentMemoryPage(
                    path: "wiki/ingrid-berg.md", title: "Ingrid Berg", lastUpdated: "2026-08-18"),
                RecentMemoryPage(
                    path: "wiki/oslo-trip.md", title: "Oslo Trip", lastUpdated: "2026-08-10"),
            ])
    }

    /// The brain sends `title`/`lastUpdated` as JSON null for a page missing
    /// them; a row without a path is undisplayable and dropped, and a shape
    /// that is not the result at all is an empty list rather than a crash.
    func testParseIsLenient() throws {
        let json = """
            {"type":"done","id":"m1","result":{"pages":[\
            {"path":"wiki/undated.md","title":null,"lastUpdated":null},\
            {"title":"No path"},"garbage"]}}
            """
        let event = try JSONDecoder().decode(BrainEvent.self, from: Data(json.utf8))
        guard case let .done(_, result) = event else {
            return XCTFail("expected done, got \(event)")
        }
        XCTAssertEqual(
            RecentMemoryPage.parse(result),
            [RecentMemoryPage(path: "wiki/undated.md", title: nil, lastUpdated: nil)])

        XCTAssertEqual(RecentMemoryPage.parse(nil), [])
        XCTAssertEqual(RecentMemoryPage.parse(.object(["pages": .string("nope")])), [])
        XCTAssertEqual(RecentMemoryPage.parse(.object([:])), [])
    }

    // MARK: - Relative time

    func testRelativeTimePhrasing() {
        let cases: [(String, String?)] = [
            ("2026-08-18", "today"),
            ("2026-08-19", "today"),  // future: clock skew reads as today
            ("2026-08-17", "yesterday"),
            ("2026-08-15", "3 days ago"),
            ("2026-08-12", "6 days ago"),
            ("2026-08-11", "a week ago"),
            ("2026-08-04", "2 weeks ago"),
            ("2026-07-19", "a month ago"),
            ("2026-05-20", "3 months ago"),
            ("2025-08-18", "a year ago"),
            ("2024-08-18", "2 years ago"),
        ]
        for (date, expected) in cases {
            XCTAssertEqual(
                RecentMemoryMenu.relativeTime(from: date, today: today), expected,
                "for \(date)")
        }
    }

    /// A date that does not parse gets no phrase rather than a wrong one.
    func testUnparsableDatesGetNoPhrase() {
        for bad in ["", "yesterday", "2026-8-18", "2026-13-01", "18-08-2026", "2026-08"] {
            XCTAssertNil(RecentMemoryMenu.relativeTime(from: bad, today: today), "for \(bad)")
        }
        XCTAssertNil(RecentMemoryMenu.relativeTime(from: "2026-08-18", today: "not a date"))
    }

    /// Month boundaries are real calendar days, not "every month has 30".
    func testRelativeTimeCrossesMonthBoundaries() {
        XCTAssertEqual(RecentMemoryMenu.relativeTime(from: "2026-07-31", today: "2026-08-01"),
            "yesterday")
        XCTAssertEqual(RecentMemoryMenu.relativeTime(from: "2025-12-31", today: "2026-01-01"),
            "yesterday")
        // 2028 is a leap year.
        XCTAssertEqual(RecentMemoryMenu.relativeTime(from: "2028-02-28", today: "2028-03-01"),
            "2 days ago")
    }

    // MARK: - Menu entries

    func testEntriesCarryTitleAndRelativeTime() {
        let entries = RecentMemoryMenu.entries(
            pages: [
                RecentMemoryPage(
                    path: "wiki/ingrid-berg.md", title: "Ingrid Berg", lastUpdated: "2026-08-18"),
                RecentMemoryPage(
                    path: "wiki/oslo-trip.md", title: "Oslo Trip", lastUpdated: "2026-08-15"),
            ],
            today: today)
        XCTAssertEqual(
            entries,
            [
                RecentMemoryMenu.Entry(title: "Ingrid Berg — today", path: "wiki/ingrid-berg.md"),
                RecentMemoryMenu.Entry(title: "Oslo Trip — 3 days ago", path: "wiki/oslo-trip.md"),
            ])
    }

    func testEmptyMemoryShowsTheDisabledPlaceholder() {
        XCTAssertEqual(
            RecentMemoryMenu.entries(pages: [], today: today),
            [RecentMemoryMenu.Entry(title: "Nothing yet", path: nil)])
    }

    /// An undated page renders with no time, and a page without a title falls
    /// back to its slug — never to a path.
    func testEntriesFallBackToSlugAndSkipMissingTimes() {
        let entries = RecentMemoryMenu.entries(
            pages: [
                RecentMemoryPage(path: "wiki/style/style-slack.md", title: nil, lastUpdated: nil),
                RecentMemoryPage(path: "wiki/undated.md", title: "  ", lastUpdated: "garbage"),
            ],
            today: today)
        XCTAssertEqual(
            entries,
            [
                RecentMemoryMenu.Entry(title: "style-slack", path: "wiki/style/style-slack.md"),
                RecentMemoryMenu.Entry(title: "undated", path: "wiki/undated.md"),
            ])
    }

    func testEntriesCapAtEightAndKeepTheBrainsOrder() {
        let pages = (0..<10).map { index in
            RecentMemoryPage(
                path: "wiki/page-\(index).md", title: "Page \(index)", lastUpdated: nil)
        }
        let entries = RecentMemoryMenu.entries(pages: pages, today: today)
        XCTAssertEqual(entries.count, 8)
        XCTAssertEqual(entries.first?.title, "Page 0")
        XCTAssertEqual(entries.last?.title, "Page 7")
    }

    func testARunawayTitleIsTruncatedWithAnEllipsis() {
        let long = String(repeating: "Very Long Title ", count: 10)
        let entries = RecentMemoryMenu.entries(
            pages: [RecentMemoryPage(path: "wiki/long.md", title: long, lastUpdated: nil)],
            today: today)
        let title = entries[0].title
        XCTAssertEqual(title.count, RecentMemoryMenu.maxTitleCharacters)
        XCTAssertTrue(title.hasSuffix("…"))
    }

    func testTodayFormatsTheCalendarDayInTheGivenZone() throws {
        // 2026-08-18 23:30 UTC is already the 19th in Oslo, still the 18th in UTC.
        let formatter = ISO8601DateFormatter()
        let date = try XCTUnwrap(formatter.date(from: "2026-08-18T23:30:00Z"))
        XCTAssertEqual(RecentMemoryMenu.today(date, timeZone: TimeZone(identifier: "UTC")!),
            "2026-08-18")
        XCTAssertEqual(
            RecentMemoryMenu.today(date, timeZone: TimeZone(identifier: "Europe/Oslo")!),
            "2026-08-19")
    }
}
