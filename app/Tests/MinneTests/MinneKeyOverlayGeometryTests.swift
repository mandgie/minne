import XCTest

@testable import Minne

/// The overlay's calm geometry (US-203): one width and one anchored edge,
/// claimed at presentation; every state after that only chooses a height, and
/// the panel grows away from the caret with the anchored edge pinned.
final class MinneKeyOverlayGeometryTests: XCTestCase {
    private let screen = CGRect(x: 0, y: 0, width: 1440, height: 900)
    private let opening = CGSize(width: 368, height: 169)

    // MARK: - Where the panel opens

    func testTheOverlaySitsJustUnderTheCaret() {
        let caret = CGRect(x: 400, y: 500, width: 1, height: 18)
        let geometry = MinneKeyOverlayGeometry.claim(size: opening, caret: caret, visible: screen)
        let frame = geometry.frame(height: opening.height, visible: screen)
        XCTAssertEqual(frame.minX, 400)
        XCTAssertEqual(frame.maxY, caret.minY - MinneKeyOverlayGeometry.gap)
        XCTAssertEqual(geometry.growth, .down)
    }

    func testACaretNearTheBottomPutsTheOverlayAbove() {
        let caret = CGRect(x: 400, y: 12, width: 1, height: 18)
        let geometry = MinneKeyOverlayGeometry.claim(size: opening, caret: caret, visible: screen)
        let frame = geometry.frame(height: opening.height, visible: screen)
        XCTAssertEqual(frame.minY, caret.maxY + MinneKeyOverlayGeometry.gap)
        XCTAssertEqual(geometry.growth, .up)
    }

    func testACaretNearTheRightEdgePullsTheOverlayBackOnScreen() {
        let caret = CGRect(x: 1400, y: 500, width: 1, height: 18)
        let geometry = MinneKeyOverlayGeometry.claim(size: opening, caret: caret, visible: screen)
        let frame = geometry.frame(height: opening.height, visible: screen)
        XCTAssertEqual(frame.maxX, screen.maxX)
        XCTAssertTrue(screen.contains(frame))
    }

    func testTheOverlayStaysOutOfTheDock() {
        // A visible frame that does not start at the origin — menu bar above,
        // Dock below — is the normal case, and the overlay must respect it.
        let visible = CGRect(x: 0, y: 80, width: 1440, height: 780)
        let caret = CGRect(x: 20, y: 85, width: 1, height: 18)
        let geometry = MinneKeyOverlayGeometry.claim(size: opening, caret: caret, visible: visible)
        let frame = geometry.frame(height: opening.height, visible: visible)
        XCTAssertTrue(visible.contains(frame))
    }

    func testASecondDisplayLeftOfThePrimaryOneKeepsNegativeCoordinates() {
        let visible = CGRect(x: -1920, y: 0, width: 1920, height: 1080)
        let caret = CGRect(x: -1500, y: 600, width: 1, height: 18)
        let geometry = MinneKeyOverlayGeometry.claim(size: opening, caret: caret, visible: visible)
        let frame = geometry.frame(height: opening.height, visible: visible)
        XCTAssertEqual(frame.minX, -1500)
        XCTAssertTrue(visible.contains(frame))
    }

    /// A caret so near the bottom that the panel fits on neither side stays
    /// below and is clamped on screen, rather than jumping to the far edge.
    func testWhenNeitherSideFitsThePanelStaysBelowAndOnScreen() {
        let visible = CGRect(x: 0, y: 0, width: 1440, height: 200)
        let caret = CGRect(x: 400, y: 100, width: 1, height: 18)
        let geometry = MinneKeyOverlayGeometry.claim(size: opening, caret: caret, visible: visible)
        XCTAssertEqual(geometry.growth, .down)
        let frame = geometry.frame(height: opening.height, visible: visible)
        XCTAssertTrue(visible.contains(frame))
    }

    // MARK: - What a state change may move

    /// The whole point of claiming: thinking → result → guiding → editing all
    /// produce different heights, and through every one of them the width and
    /// the anchored top edge are byte-identical.
    func testGrowthBelowTheCaretPinsTheTopEdgeAndTheWidth() {
        let caret = CGRect(x: 400, y: 500, width: 1, height: 18)
        let geometry = MinneKeyOverlayGeometry.claim(size: opening, caret: caret, visible: screen)
        let heights: [CGFloat] = [169, 278, 306, 278, 231, 120]
        let frames = heights.map { geometry.frame(height: $0, visible: screen) }
        for frame in frames {
            XCTAssertEqual(frame.width, opening.width)
            XCTAssertEqual(frame.minX, frames[0].minX)
            XCTAssertEqual(frame.maxY, frames[0].maxY, "the anchored top edge moved")
        }
    }

    func testGrowthAboveTheCaretPinsTheBottomEdge() {
        let caret = CGRect(x: 400, y: 12, width: 1, height: 18)
        let geometry = MinneKeyOverlayGeometry.claim(size: opening, caret: caret, visible: screen)
        let short = geometry.frame(height: 169, visible: screen)
        let tall = geometry.frame(height: 306, visible: screen)
        XCTAssertEqual(short.minY, tall.minY, "the anchored bottom edge moved")
        XCTAssertEqual(tall.maxY, short.maxY + (306 - 169))
    }

    /// The same height asks for the same frame — which is what lets the panel
    /// skip the animation entirely when a state change moves nothing.
    func testTheSameHeightYieldsTheSameFrame() {
        let caret = CGRect(x: 400, y: 500, width: 1, height: 18)
        let geometry = MinneKeyOverlayGeometry.claim(size: opening, caret: caret, visible: screen)
        XCTAssertEqual(
            geometry.frame(height: 278, visible: screen),
            geometry.frame(height: 278, visible: screen))
    }

    /// The anchor gives way only when the grown panel would leave the screen —
    /// and then by the least amount that keeps it on, not by flipping sides.
    func testAPanelGrownPastTheScreenEdgeSlidesInsteadOfFlipping() {
        let caret = CGRect(x: 400, y: 200, width: 1, height: 18)
        let geometry = MinneKeyOverlayGeometry.claim(size: opening, caret: caret, visible: screen)
        XCTAssertEqual(geometry.growth, .down)
        let grown = geometry.frame(height: 260, visible: screen)
        XCTAssertEqual(grown.minY, screen.minY)
        XCTAssertTrue(screen.contains(grown))
    }

    // MARK: - Where a scrolled field may rest

    /// The nit US-203 fixes: AppKit's scroll-to-end rests the clip a point or
    /// so past the line boundary, painting the descender tips of the
    /// scrolled-off line along the field's top. The rest snaps it back.
    func testAScrollRestingJustOffASlotBoundarySnapsToIt() {
        XCTAssertEqual(OverlayScrollRest.offset(proposing: 28.8, pitch: 15, limit: 30), 30)
        XCTAssertEqual(OverlayScrollRest.offset(proposing: 31.4, pitch: 15, limit: 45), 30)
    }

    func testACleanBoundaryIsLeftAlone() {
        XCTAssertEqual(OverlayScrollRest.offset(proposing: 30, pitch: 15, limit: 60), 30)
        XCTAssertEqual(OverlayScrollRest.offset(proposing: 0, pitch: 15, limit: 60), 0)
    }

    func testTheRestNeverLeavesTheDocument() {
        XCTAssertEqual(OverlayScrollRest.offset(proposing: -5, pitch: 15, limit: 60), 0)
        XCTAssertEqual(OverlayScrollRest.offset(proposing: 90, pitch: 15, limit: 60), 60)
        // A degenerate pitch clamps and nothing more.
        XCTAssertEqual(OverlayScrollRest.offset(proposing: 7, pitch: 0, limit: 60), 7)
    }

    // MARK: - The viewport heights the rests rely on

    /// A capped field's largest scroll offset is `content − viewport`; only
    /// because the cap subtracts the trailing line spacing does that land on a
    /// slot boundary. Guidance: 6 lines in slots of 15 with a 1 pt moat is 89
    /// of content against a 59 cap — offset 30, exactly two slots.
    func testTheCapPutsTheEndOfFieldRestOnASlotBoundary() {
        let cap = GuidanceRow.fieldHeight(content: 6 * 15 - 1, line: 15, spacing: 1)
        XCTAssertEqual(cap, 59)
        XCTAssertEqual((6 * 15 - 1) - cap, 30)
        // The draft editor: 20 lines in slots of 18 with a 3 pt moat against
        // its 12-line cap — offset 144, exactly eight slots.
        let editorCap = GuidanceRow.fieldHeight(
            content: 20 * 18 - 3, line: 18, spacing: 3, maxLines: DraftEditor.maxLines)
        XCTAssertEqual(editorCap, 213)
        XCTAssertEqual((20 * 18 - 3) - editorCap, 144)
    }

    /// An empty field is one line of ink tall — the slot less its moat.
    func testOneLineIsASlotLessItsMoat() {
        XCTAssertEqual(GuidanceRow.fieldHeight(content: 0, line: 15, spacing: 1), 14)
        XCTAssertEqual(
            GuidanceRow.fieldHeight(content: 0, line: 18, spacing: 3, maxLines: 12), 15)
    }
}
