import CoreGraphics
import XCTest

@testable import Minne

/// Which key presses the overlay may claim.
///
/// The modifier rules are what keep these keys the user's the rest of the time,
/// and a wrong answer here is a key that stops working system-wide — so they
/// are pure and tested rather than inferred from behaviour.
final class MinneKeyCommandTests: XCTestCase {
    private func command(_ keyCode: Int64, _ flags: CGEventFlags = []) -> MinneKeyCommand? {
        MinneKeyTap.command(keyCode: keyCode, flags: flags.rawValue)
    }

    func testEscapeAndReturnAreRecognised() {
        XCTAssertEqual(command(MinneKeyTap.escapeKeyCode), .escape)
        XCTAssertEqual(command(MinneKeyTap.returnKeyCode), .submit)
        XCTAssertEqual(command(MinneKeyTap.keypadEnterKeyCode), .submit)
    }

    /// ⌘Return sends a message in half the apps on this machine; it is not ours.
    func testAModifiedReturnBelongsToTheApp() {
        XCTAssertNil(command(MinneKeyTap.returnKeyCode, .maskCommand))
        XCTAssertNil(command(MinneKeyTap.returnKeyCode, .maskShift))
        XCTAssertNil(command(MinneKeyTap.returnKeyCode, .maskAlternate))
    }

    func testCommandZIsUndoAndPlainZIsNot() {
        XCTAssertEqual(command(MinneKeyTap.zKeyCode, .maskCommand), .undo)
        XCTAssertNil(command(MinneKeyTap.zKeyCode))
    }

    /// ⇧⌘Z is redo, which Minne has no business claiming.
    func testShiftCommandZIsNotUndo() {
        XCTAssertNil(command(MinneKeyTap.zKeyCode, [.maskCommand, .maskShift]))
    }

    /// ⌘R is another take while a draft is on screen — and Reload every other
    /// moment of the day, which is why the modifiers are exact.
    func testCommandRIsAnotherTake() {
        XCTAssertEqual(command(MinneKeyTap.rKeyCode, .maskCommand), .regenerate)
        XCTAssertNil(command(MinneKeyTap.rKeyCode))
        XCTAssertNil(command(MinneKeyTap.rKeyCode, [.maskCommand, .maskShift]))
        XCTAssertNil(command(MinneKeyTap.rKeyCode, [.maskCommand, .maskAlternate]))
    }

    /// ⌘E opens the in-place draft editor while a draft is on screen — and
    /// "use selection for find" the rest of the time, so the modifiers are as
    /// exact as ⌘R's.
    func testCommandEIsEditAndOnlyExactly() {
        XCTAssertEqual(command(MinneKeyTap.eKeyCode, .maskCommand), .edit)
        XCTAssertNil(command(MinneKeyTap.eKeyCode))
        XCTAssertNil(command(MinneKeyTap.eKeyCode, [.maskCommand, .maskShift]))
        XCTAssertNil(command(MinneKeyTap.eKeyCode, [.maskCommand, .maskAlternate]))
        XCTAssertNil(command(MinneKeyTap.eKeyCode, [.maskCommand, .maskControl]))
    }

    /// Tab moves into the guidance field. ⌘Tab is the app switcher and ⌥Tab is
    /// the system's; neither is ever ours.
    func testTabIsGuidanceAndOnlyBare() {
        XCTAssertEqual(command(MinneKeyTap.tabKeyCode), .guide)
        XCTAssertNil(command(MinneKeyTap.tabKeyCode, .maskCommand))
        XCTAssertNil(command(MinneKeyTap.tabKeyCode, .maskAlternate))
        XCTAssertNil(command(MinneKeyTap.tabKeyCode, .maskShift))
    }

    func testEverythingElseIsIgnored() {
        for keyCode: Int64 in [0, 1, 9, 49, 122] {
            XCTAssertNil(command(keyCode), "key \(keyCode)")
        }
    }
}
