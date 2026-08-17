import XCTest

@testable import Minne

final class ChatMarkdownTests: XCTestCase {
    func testParagraphsAreSplitOnBlankLinesAndSoftWrapsJoin() {
        let blocks = ChatMarkdown.blocks(
            """
            You worked on the Oslo trip
            and the billing migration.

            Nothing else stood out.
            """)
        XCTAssertEqual(
            blocks,
            [
                .paragraph("You worked on the Oslo trip and the billing migration."),
                .paragraph("Nothing else stood out."),
            ])
    }

    func testHeadingsBulletsAndNumbers() {
        let blocks = ChatMarkdown.blocks(
            """
            ## Yesterday

            - Oslo trip planning
            * Billing migration

            1. Read the spec
            2) Wrote the plan
            """)
        XCTAssertEqual(
            blocks,
            [
                .heading(level: 2, text: "Yesterday"),
                .bullet("Oslo trip planning"),
                .bullet("Billing migration"),
                .numbered(number: 1, text: "Read the spec"),
                .numbered(number: 2, text: "Wrote the plan"),
            ])
    }

    func testFencedCodeKeepsItsLinesVerbatim() {
        let blocks = ChatMarkdown.blocks(
            """
            Run:

            ```sh
            swift build
              swift test
            ```

            Done.
            """)
        XCTAssertEqual(
            blocks,
            [.paragraph("Run:"), .code("swift build\n  swift test"), .paragraph("Done.")])
    }

    func testUnterminatedFenceEndsAtTheEnd() {
        // What a half-streamed answer looks like if it is rendered as markdown.
        XCTAssertEqual(
            ChatMarkdown.blocks("```\nlet x = 1"),
            [.code("let x = 1")])
    }

    func testTextThatMerelyLooksLikeAListIsAParagraph() {
        XCTAssertEqual(ChatMarkdown.blocks("-nospace"), [.paragraph("-nospace")])
        XCTAssertEqual(ChatMarkdown.blocks("2024 was busy"), [.paragraph("2024 was busy")])
        XCTAssertEqual(ChatMarkdown.blocks("####### too deep"), [.paragraph("####### too deep")])
    }

    func testInlineMarkupIsInterpretedAndNeverThrowsAwayTheText() {
        let bold = ChatMarkdown.inline("a **bold** claim")
        XCTAssertEqual(String(bold.characters), "a bold claim")
        let broken = ChatMarkdown.inline("unclosed [link](")
        XCTAssertTrue(String(broken.characters).contains("unclosed"))
    }

    func testEmptyMarkdownHasNoBlocks() {
        XCTAssertEqual(ChatMarkdown.blocks("   \n\n"), [])
    }
}
