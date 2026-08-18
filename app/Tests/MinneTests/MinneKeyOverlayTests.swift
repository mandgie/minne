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
}
