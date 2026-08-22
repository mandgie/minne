import AppKit
import XCTest

@testable import Minne

/// The bundled faces are the easiest thing in the app to lose silently:
/// `MinneTheme` falls back to San Francisco whenever registration fails, so a
/// dropped resource declaration, a renamed file or a build script that forgets
/// to copy `Minne_Minne.bundle` all produce a working app that has quietly
/// stopped being the product's own. These tests are the alarm for that.
final class MinneThemeTests: XCTestCase {

    func testDisplayFaceIsTheBundledOneRatherThanTheFallback() {
        let font = MinneTheme.display(25)
        XCTAssertEqual(
            font.fontName, "FamiljenGrotesk-SemiBold",
            "the display face fell back to the system font — is Resources/Fonts still declared?")
        XCTAssertEqual(font.pointSize, 25)
    }

    func testUtilityFaceIsTheBundledOneRatherThanTheFallback() {
        let font = MinneTheme.mono(9.5)
        XCTAssertEqual(
            font.fontName, "IBMPlexMono-Medium",
            "the utility face fell back to the system monospace font")
        XCTAssertEqual(font.pointSize, 9.5)
    }

    func testRegisteringTwiceIsHarmless() {
        // The accessors register on every call; already-registered must not be
        // treated as a failure or the second label drawn would lose its face.
        MinneTheme.registerFonts()
        MinneTheme.registerFonts()
        XCTAssertEqual(MinneTheme.display(13).fontName, "FamiljenGrotesk-SemiBold")
    }

    func testBodyCopyStaysSystemFont() {
        // Prose inside a macOS window should look like macOS: the brand face
        // is for titles and labels, never paragraphs.
        let body = MinneTheme.body(13)
        XCTAssertEqual(body, NSFont.systemFont(ofSize: 13, weight: .regular))
    }

    func testLabelsAreUppercasedAndTracked() {
        let label = MinneTheme.label("First run", color: MinneTheme.mute)
        XCTAssertEqual(label.string, "FIRST RUN")
        let kern = label.attribute(.kern, at: 0, effectiveRange: nil) as? CGFloat
        XCTAssertEqual(kern, 1.35, "the tracking is what makes 9.5pt mono read as a label")
    }

    // MARK: - The mark

    func testSparkPathStaysInsideTheRectItIsGiven() {
        let rect = NSRect(x: 4, y: 7, width: 19, height: 19)
        let bounds = SparkGlyph.path(in: rect).bounds
        XCTAssertGreaterThanOrEqual(bounds.minX, rect.minX - 0.01)
        XCTAssertGreaterThanOrEqual(bounds.minY, rect.minY - 0.01)
        XCTAssertLessThanOrEqual(bounds.maxX, rect.maxX + 0.01)
        XCTAssertLessThanOrEqual(bounds.maxY, rect.maxY + 0.01)
    }

    func testSparkScalesWithItsRect() {
        let small = SparkGlyph.path(in: NSRect(x: 0, y: 0, width: 11, height: 11)).bounds
        let large = SparkGlyph.path(in: NSRect(x: 0, y: 0, width: 44, height: 44)).bounds
        XCTAssertEqual(large.width / small.width, 4, accuracy: 0.01)
    }

    /// A non-square rect must not stretch the mark. The authored path is
    /// slightly wider than it is tall (59.7×56 in its own 64pt space), so the
    /// invariant is that its proportions survive, not that it is square.
    func testSparkIsScaledUniformlyRatherThanStretched() {
        func aspect(_ rect: NSRect) -> CGFloat {
            let bounds = SparkGlyph.path(in: rect).bounds
            return bounds.width / bounds.height
        }
        let square = aspect(NSRect(x: 0, y: 0, width: 40, height: 40))
        XCTAssertEqual(aspect(NSRect(x: 0, y: 0, width: 120, height: 40)), square, accuracy: 0.001)
        XCTAssertEqual(aspect(NSRect(x: 0, y: 0, width: 40, height: 120)), square, accuracy: 0.001)
    }

    /// …and it is centred in whatever space it is given, so a spark in a wide
    /// row does not drift to one edge.
    func testSparkIsCentredInANonSquareRect() {
        let rect = NSRect(x: 0, y: 0, width: 120, height: 40)
        let bounds = SparkGlyph.path(in: rect).bounds
        XCTAssertEqual(bounds.midX, rect.midX, accuracy: 0.01)
        XCTAssertEqual(bounds.midY, rect.midY, accuracy: 0.01)
    }
}
