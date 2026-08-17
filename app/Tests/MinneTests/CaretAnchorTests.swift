import XCTest

@testable import Minne

/// What the Minne key does with what an app tells it: whether the focused
/// element is somewhere to appear at all, which rectangle to trust, and where
/// the overlay ends up on screen.
final class CaretAnchorTests: XCTestCase {

    // MARK: - Which elements the key may wake up in

    func testTextRolesAreText() {
        for role in ["AXTextField", "AXTextArea", "AXComboBox", "AXWebArea", "AXSearchField"] {
            XCTAssertEqual(
                FocusedTextElement.kind(
                    role: role, subrole: nil, supportsSelectedTextRange: false),
                .text, role)
        }
    }

    func testAPasswordFieldIsNeverText() {
        XCTAssertEqual(
            FocusedTextElement.kind(
                role: "AXSecureTextField", subrole: nil, supportsSelectedTextRange: true),
            .secure)
    }

    /// WebKit dresses a password input as an ordinary text field and only the
    /// subrole gives it away — and it answers `AXSelectedTextRange` like any
    /// other field, so the secure check has to come first.
    func testAWebPasswordFieldIsCaughtByItsSubrole() {
        XCTAssertEqual(
            FocusedTextElement.kind(
                role: "AXTextField", subrole: "AXSecureTextField",
                supportsSelectedTextRange: true),
            .secure)
    }

    /// How VS Code, Slack and web editors qualify: whatever they call
    /// themselves, an element that can report its caret is somewhere to type.
    func testAnUnknownRoleWithACaretCountsAsText() {
        XCTAssertEqual(
            FocusedTextElement.kind(
                role: "AXGroup", subrole: nil, supportsSelectedTextRange: true),
            .text)
    }

    func testAButtonIsNotText() {
        XCTAssertEqual(
            FocusedTextElement.kind(
                role: "AXButton", subrole: nil, supportsSelectedTextRange: false),
            .other)
    }

    func testNoRoleAtAllFallsBackToTheCaretTest() {
        XCTAssertEqual(
            FocusedTextElement.kind(role: nil, subrole: nil, supportsSelectedTextRange: true),
            .text)
        XCTAssertEqual(
            FocusedTextElement.kind(role: nil, subrole: nil, supportsSelectedTextRange: false),
            .other)
    }

    // MARK: - Which rectangle to trust

    private let caret = CGRect(x: 400, y: 300, width: 1, height: 18)
    private let field = CGRect(x: 380, y: 280, width: 500, height: 120)
    private let window = CGRect(x: 100, y: 100, width: 900, height: 700)

    func testTheCaretWins() {
        let anchor = CaretAnchor.resolve(caret: caret, element: field, window: window)
        XCTAssertEqual(anchor, CaretAnchor(rect: caret, source: .caret))
    }

    /// The common web-area answer: the parameterized attribute exists but
    /// returns an all-zero rectangle. Falling back to the field's leading edge
    /// is the difference between an overlay at the top-left of the display and
    /// one on the right window.
    func testAnAllZeroCaretFallsBackToTheElement() {
        let anchor = CaretAnchor.resolve(caret: .zero, element: field, window: window)
        XCTAssertEqual(anchor?.source, .element)
        XCTAssertEqual(anchor?.rect.origin, CGPoint(x: 380, y: 280))
        // Caret-shaped, not field-shaped: the first line, not the whole box.
        XCTAssertEqual(anchor?.rect.width, 0)
        XCTAssertEqual(anchor?.rect.height, CaretAnchor.syntheticCaretHeight)
    }

    func testAFlatCaretFallsBackToTheElement() {
        let flat = CGRect(x: 400, y: 300, width: 0, height: 0)
        XCTAssertEqual(
            CaretAnchor.resolve(caret: flat, element: field, window: window)?.source, .element)
    }

    func testANonFiniteCaretFallsBackToTheElement() {
        let broken = CGRect(x: CGFloat.nan, y: 300, width: 1, height: 18)
        XCTAssertEqual(
            CaretAnchor.resolve(caret: broken, element: field, window: window)?.source, .element)
    }

    func testAShortFieldKeepsItsOwnHeight() {
        let short = CGRect(x: 10, y: 20, width: 200, height: 12)
        let anchor = CaretAnchor.resolve(caret: nil, element: short, window: nil)
        XCTAssertEqual(anchor?.rect.height, 12)
    }

    func testTheWindowIsTheLastResort() {
        let anchor = CaretAnchor.resolve(caret: nil, element: nil, window: window)
        XCTAssertEqual(anchor?.source, .window)
        XCTAssertEqual(anchor?.rect.origin, CGPoint(x: 100, y: 100))
    }

    func testNothingUsableMeansNoAnchor() {
        XCTAssertNil(CaretAnchor.resolve(caret: .zero, element: .zero, window: nil))
        XCTAssertNil(CaretAnchor.resolve(caret: nil, element: nil, window: nil))
    }

    // MARK: - Where the overlay goes

    /// AX measures from the top-left of the primary display, AppKit from its
    /// bottom-left. A caret 300 pt down a 1000 pt display is 682 pt up from the
    /// bottom once its own 18 pt height is accounted for.
    func testFlippingIntoAppKitCoordinates() {
        let flipped = OverlayPlacement.flipped(caret, primaryHeight: 1000)
        XCTAssertEqual(flipped, CGRect(x: 400, y: 682, width: 1, height: 18))
    }

    func testFlippingIsItsOwnInverse() {
        let there = OverlayPlacement.flipped(caret, primaryHeight: 1000)
        XCTAssertEqual(OverlayPlacement.flipped(there, primaryHeight: 1000), caret)
    }

    private let screen = CGRect(x: 0, y: 0, width: 1440, height: 900)
    private let overlay = CGSize(width: 240, height: 44)

    func testTheOverlaySitsJustUnderTheCaret() {
        let caret = CGRect(x: 400, y: 500, width: 1, height: 18)
        let frame = OverlayPlacement.frame(for: overlay, caret: caret, visible: screen)
        XCTAssertEqual(frame.minX, 400)
        XCTAssertEqual(frame.maxY, caret.minY - OverlayPlacement.gap)
    }

    func testACaretNearTheBottomPutsTheOverlayAbove() {
        let caret = CGRect(x: 400, y: 12, width: 1, height: 18)
        let frame = OverlayPlacement.frame(for: overlay, caret: caret, visible: screen)
        XCTAssertEqual(frame.minY, caret.maxY + OverlayPlacement.gap)
    }

    func testACaretNearTheRightEdgePullsTheOverlayBackOnScreen() {
        let caret = CGRect(x: 1400, y: 500, width: 1, height: 18)
        let frame = OverlayPlacement.frame(for: overlay, caret: caret, visible: screen)
        XCTAssertEqual(frame.maxX, screen.maxX)
        XCTAssertTrue(screen.contains(frame))
    }

    func testTheOverlayStaysOutOfTheDock() {
        // A visible frame that does not start at the origin — menu bar above,
        // Dock below — is the normal case, and the overlay must respect it.
        let visible = CGRect(x: 0, y: 80, width: 1440, height: 780)
        let caret = CGRect(x: 20, y: 85, width: 1, height: 18)
        let frame = OverlayPlacement.frame(for: overlay, caret: caret, visible: visible)
        XCTAssertTrue(visible.contains(frame))
    }

    func testASecondDisplayLeftOfThePrimaryOneKeepsNegativeCoordinates() {
        let visible = CGRect(x: -1920, y: 0, width: 1920, height: 1080)
        let caret = CGRect(x: -1500, y: 600, width: 1, height: 18)
        let frame = OverlayPlacement.frame(for: overlay, caret: caret, visible: visible)
        XCTAssertEqual(frame.minX, -1500)
        XCTAssertTrue(visible.contains(frame))
    }
}
