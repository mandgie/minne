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

    func testEverythingElseIsIgnored() {
        for keyCode: Int64 in [0, 1, 9, 49, 122] {
            XCTAssertNil(command(keyCode), "key \(keyCode)")
        }
    }
}
