import XCTest

@testable import Minne

/// The overlay's one piece of pure text handling.
@MainActor
final class MinneKeyOverlayTests: XCTestCase {
    func testAnOrdinaryDraftIsShownWhole() {
        let draft = "Hei Ingrid, torsdag passer fint. M."
        XCTAssertEqual(MinneKeyOverlayView.preview(draft), draft)
    }

    /// A long draft is elided with what is missing said out loud — the panel is
    /// a HUD at someone's caret, and silently cutting a draft the user is about
    /// to insert would be the worst of both.
    func testALongDraftIsElidedAndSaysSo() {
        let draft = String(repeating: "word ", count: 400)
        let preview = MinneKeyOverlayView.preview(draft)
        XCTAssertTrue(preview.hasPrefix(String(draft.prefix(100))))
        XCTAssertLessThan(preview.count, draft.count)
        XCTAssertTrue(preview.contains("more characters"))
        XCTAssertTrue(preview.contains("Insert takes all of it"))
    }

    func testTheBoundaryIsNotElided() {
        let draft = String(repeating: "x", count: MinneKeyOverlayView.maxPreviewCharacters)
        XCTAssertEqual(MinneKeyOverlayView.preview(draft), draft)
    }

    /// The elision note is an aside about the draft, not part of it, and is set
    /// in the quiet ink to say so. `body` finds it by the separator `preview`
    /// wrote — this is the test that keeps those two in step.
    func testTheElisionNoteIsSetApartFromTheDraft() {
        let draft = String(repeating: "word ", count: 400)
        let body = MinneKeyOverlayView.body(MinneKeyOverlayView.preview(draft), elided: true)
        let noteColor =
            body.attribute(
                .foregroundColor, at: body.length - 1, effectiveRange: nil) as? NSColor
        let draftColor = body.attribute(.foregroundColor, at: 0, effectiveRange: nil) as? NSColor
        XCTAssertEqual(noteColor, OverlayPalette.inkTertiary)
        XCTAssertEqual(draftColor, OverlayPalette.ink)
    }

    /// A draft short enough to be shown whole is one colour throughout — the
    /// note styling must not fire on a bracketed line the user wrote themselves.
    func testAnUnelidedDraftIsAllOneInk() {
        let draft = "Done.\n\n[see notes]"
        let body = MinneKeyOverlayView.body(MinneKeyOverlayView.preview(draft), elided: false)
        var range = NSRange()
        _ = body.attribute(.foregroundColor, at: 0, effectiveRange: &range)
        XCTAssertEqual(range.length, body.length)
    }

    // MARK: - The steers in force

    func testNoSteersMeansNoChipLine() {
        XCTAssertEqual(GuidanceRow.chipLine([]), "")
        XCTAssertEqual(GuidanceRow.chipLine(["  ", ""]), "")
    }

    func testEachSteerGetsADot() {
        XCTAssertEqual(GuidanceRow.chipLine(["warmer"]), "· warmer")
        XCTAssertEqual(GuidanceRow.chipLine(["warmer", "shorter"]), "· warmer  · shorter")
    }

    /// The panel is a HUD at someone's caret: after a few rounds it counts the
    /// older steers rather than listing them.
    func testOlderSteersBecomeACount() {
        let line = GuidanceRow.chipLine(["a", "b", "c", "d", "e"])
        XCTAssertTrue(line.hasPrefix("· +2"))
        XCTAssertTrue(line.contains("· c"))
        XCTAssertTrue(line.contains("· e"))
        XCTAssertFalse(line.contains("· a"))
    }

    /// And one very long steer is elided rather than pushing the panel wider
    /// than the draft it belongs to.
    func testALongSteerIsElided() {
        let steer = String(repeating: "very ", count: 20) + "warm"
        let line = GuidanceRow.chipLine([steer])
        XCTAssertTrue(line.hasSuffix("…"))
        XCTAssertLessThan(line.count, GuidanceRow.maxChipCharacters + 4)
    }

    // MARK: - The guidance field's growth

    func testAnEmptyFieldIsOneLineTall() {
        XCTAssertEqual(GuidanceRow.fieldHeight(content: 0, line: 14), 14)
    }

    func testTheFieldGrowsWithItsContent() {
        XCTAssertEqual(GuidanceRow.fieldHeight(content: 28, line: 14), 28)
        XCTAssertEqual(GuidanceRow.fieldHeight(content: 42, line: 14), 42)
    }

    /// Past four lines the words scroll inside the field instead of growing
    /// the panel any further.
    func testGrowthStopsAtFourLines() {
        XCTAssertEqual(GuidanceRow.fieldHeight(content: 14 * 4, line: 14), 14 * 4)
        XCTAssertEqual(GuidanceRow.fieldHeight(content: 14 * 9, line: 14), 14 * 4)
    }

    /// Growth rounds up — a fractional line height that was floored would clip
    /// the last line's descenders — but the cap is exactly four lines: the cap
    /// is the one height at which the field scrolls, and a viewport taller
    /// than its whole lines shows a clipped sliver of the line above.
    func testAFractionalLineHeightRoundsUpButTheCapStaysOnWholeLines() {
        XCTAssertEqual(GuidanceRow.fieldHeight(content: 13.4, line: 13.4), 14)
        XCTAssertEqual(GuidanceRow.fieldHeight(content: 13.4 * 6, line: 13.4), 13.4 * 4)
    }

    /// The markers are coloured by walking the parts and stepping over each
    /// one's own length, which is the only thing that could silently drift: a
    /// steer that is elided, counted or contains a `·` of its own would put the
    /// accent on a letter instead. Walked here exactly as the row walks it.
    func testTheChipWalkLandsOnEveryMarkerAndNothingElse() {
        let steers = [
            "warmer", "keep the · bullet", String(repeating: "very ", count: 20) + "warm",
            "mention the Friday deadline", "sign it off",
        ]
        let units = Array(GuidanceRow.chipLine(steers).utf16)
        let marker = Array("·".utf16)[0]
        var location = 0
        for part in GuidanceRow.chipParts(steers) {
            XCTAssertLessThan(location, units.count)
            XCTAssertEqual(units[location], marker, "part \(part) does not start at a marker")
            location += ("· " + part + "  ").utf16.count
        }
        // The walk steps over a separator the last chip does not have.
        XCTAssertEqual(location - 2, units.count)
    }
}
