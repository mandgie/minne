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
}
