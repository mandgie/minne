import XCTest

@testable import Minne

/// The grounding line under a finished draft: pure string-building from the
/// page paths the brain cites. The label truncates at the pixel; these tests
/// pin the rules for everything before that.
final class MinneKeyGroundingTests: XCTestCase {
    // MARK: - Slugs

    func testAWikiPathBecomesItsSlug() {
        XCTAssertEqual(MinneKeyGrounding.slug("wiki/ingrid-berg.md"), "ingrid-berg")
    }

    func testABarePageNamePassesThrough() {
        XCTAssertEqual(MinneKeyGrounding.slug("ingrid-berg"), "ingrid-berg")
    }

    func testAStylePageRendersAsItsContext() {
        XCTAssertEqual(MinneKeyGrounding.styleSlug("wiki/style/style-slack.md"), "slack")
        XCTAssertEqual(
            MinneKeyGrounding.styleSlug("wiki/style/style-messages-ingrid-berg.md"),
            "messages-ingrid-berg")
    }

    /// A page that is nothing but the prefix keeps its slug — an empty context
    /// would render as `style: ` pointing at nothing.
    func testAStylePageWithNoContextKeepsItsSlug() {
        XCTAssertEqual(MinneKeyGrounding.styleSlug("wiki/style/style-.md"), "style-")
    }

    // MARK: - The line

    func testNothingGroundedMeansNoLineAtAll() {
        XCTAssertNil(MinneKeyGrounding.line(memoryPages: [], stylePage: nil))
    }

    func testOneMemoryPage() {
        XCTAssertEqual(
            MinneKeyGrounding.line(memoryPages: ["wiki/ingrid-berg.md"], stylePage: nil),
            "from memory: ingrid-berg")
    }

    func testManyMemoryPagesAndAStylePage() {
        XCTAssertEqual(
            MinneKeyGrounding.line(
                memoryPages: ["wiki/ingrid-berg.md", "wiki/oslo-trip.md"],
                stylePage: "wiki/style/style-slack.md"),
            "from memory: ingrid-berg, oslo-trip · style: slack")
    }

    func testAStylePageAlone() {
        XCTAssertEqual(
            MinneKeyGrounding.line(memoryPages: [], stylePage: "wiki/style/style-slack.md"),
            "style: slack")
    }

    /// Degenerate paths must not leave punctuation pointing at nothing: an
    /// empty page path renders as no page, and all-empty renders as no line.
    func testEmptyPathsAreDropped() {
        XCTAssertEqual(
            MinneKeyGrounding.line(memoryPages: ["", "wiki/oslo-trip.md"], stylePage: nil),
            "from memory: oslo-trip")
        XCTAssertNil(MinneKeyGrounding.line(memoryPages: [""], stylePage: nil))
    }

    /// The line is a citation, not content: past the cap it is cut with an
    /// ellipsis rather than allowed to grow with the wiki.
    func testAnOverlongLineIsTruncatedWithAnEllipsis() {
        let pages = (1...30).map { "wiki/page-with-a-long-name-\($0).md" }
        let line = MinneKeyGrounding.line(memoryPages: pages, stylePage: nil)
        XCTAssertEqual(line?.count, MinneKeyGrounding.maxCharacters)
        XCTAssertTrue(line?.hasSuffix("…") ?? false)
        XCTAssertTrue(line?.hasPrefix("from memory: page-with-a-long-name-1") ?? false)
    }

    func testALineAtTheCapIsNotTruncated() {
        let line = MinneKeyGrounding.line(memoryPages: ["wiki/ingrid-berg.md"], stylePage: nil)
        XCTAssertFalse(line?.hasSuffix("…") ?? true)
    }
}
