import XCTest

@testable import Minne

/// The rule that decides whether right-Option was a deliberate tap or ordinary
/// Option usage, driven as sequences of events and timestamps.
final class MinneKeyDiscriminatorTests: XCTestCase {
    private var discriminator = MinneKeyDiscriminator(tapWindow: 0.3)

    override func setUp() {
        discriminator = MinneKeyDiscriminator(tapWindow: 0.3)
    }

    /// Feeds a sequence and returns the times at which a tap was recognised.
    private func fire(_ events: [(MinneKeyInput, TimeInterval)]) -> [TimeInterval] {
        events.compactMap { discriminator.handle($0.0, at: $0.1) ? $0.1 : nil }
    }

    func testPressAndReleaseInsideTheWindowIsATap() {
        XCTAssertEqual(fire([(.rightOptionDown, 10), (.rightOptionUp, 10.08)]), [10.08])
    }

    func testTheWindowIsWhereItSays() {
        XCTAssertEqual(fire([(.rightOptionDown, 1), (.rightOptionUp, 1.29)]), [1.29])
        XCTAssertEqual(fire([(.rightOptionDown, 2), (.rightOptionUp, 2.31)]), [])
    }

    func testHoldingPastTheWindowIsNotATap() {
        // Someone resting on Option waiting to press something else, who then
        // changes their mind. Nothing should happen.
        XCTAssertEqual(fire([(.rightOptionDown, 0), (.rightOptionUp, 0.9)]), [])
    }

    /// The case that matters most: ⌥-typing an accented character, Alt Gr on a
    /// Nordic layout, ⌥→ by word. The other key arrives while Option is down.
    func testAnotherKeyDuringThePressIsNotATap() {
        XCTAssertEqual(
            fire([(.rightOptionDown, 0), (.otherInput, 0.05), (.rightOptionUp, 0.1)]), [])
    }

    func testAClickDuringThePressIsNotATap() {
        // ⌥-click and ⌥-drag reach the discriminator as `.otherInput` too.
        XCTAssertEqual(
            fire([(.rightOptionDown, 2), (.otherInput, 2.02), (.rightOptionUp, 2.2)]), [])
    }

    func testInputBeforeThePressDoesNotSpoilIt() {
        // Typing, then reaching for the Minne key, is the normal case.
        XCTAssertEqual(
            fire([
                (.otherInput, 0), (.otherInput, 0.4), (.rightOptionDown, 1), (.rightOptionUp, 1.1),
            ]),
            [1.1])
    }

    func testEachPressIsJudgedOnItsOwn() {
        let taps = fire([
            (.rightOptionDown, 0), (.otherInput, 0.05), (.rightOptionUp, 0.1),
            (.rightOptionDown, 1), (.rightOptionUp, 1.05),
            (.rightOptionDown, 2), (.rightOptionUp, 2.8),
            (.rightOptionDown, 3), (.rightOptionUp, 3.02),
        ])
        XCTAssertEqual(taps, [1.05, 3.02])
    }

    func testAReleaseWithNoPressIsIgnored() {
        // The tap can be installed while the user is already holding the key.
        XCTAssertEqual(fire([(.rightOptionUp, 5)]), [])
    }

    func testASecondPressWithoutAReleaseRestartsTheWindow() {
        XCTAssertEqual(
            fire([(.rightOptionDown, 0), (.rightOptionDown, 5), (.rightOptionUp, 5.1)]), [5.1])
    }

    func testResetForgetsThePressInFlight() {
        _ = discriminator.handle(.rightOptionDown, at: 0)
        XCTAssertTrue(discriminator.isPressed)
        discriminator.reset()
        XCTAssertFalse(discriminator.isPressed)
        // The release that follows belongs to a press we never saw.
        XCTAssertFalse(discriminator.handle(.rightOptionUp, at: 0.05))
    }

    func testContaminationDoesNotSurviveIntoTheNextPress() {
        _ = fire([(.rightOptionDown, 0), (.otherInput, 0.01), (.rightOptionUp, 0.02)])
        XCTAssertEqual(fire([(.rightOptionDown, 1), (.rightOptionUp, 1.01)]), [1.01])
    }

    // MARK: - Reading the raw event

    func testRightOptionPressAndReleaseAreReadFromTheDeviceBit() {
        let rightOption = MinneKeyTap.rightOptionKeyCode
        // .maskAlternate | NX_DEVICERALTKEYMASK | .maskNonCoalesced
        XCTAssertEqual(
            MinneKeyTap.rightOptionInput(keyCode: rightOption, flags: 0x8_0140),
            .rightOptionDown)
        // Release: the device bit is gone.
        XCTAssertEqual(
            MinneKeyTap.rightOptionInput(keyCode: rightOption, flags: 0x100), .rightOptionUp)
    }

    func testTheLeftOptionKeyIsNotTheMinneKey() {
        // kVK_Option, with .maskAlternate | NX_DEVICELALTKEYMASK set.
        XCTAssertNil(MinneKeyTap.rightOptionInput(keyCode: 0x3A, flags: 0x8_0120))
    }

    func testOtherModifiersAreNotTheMinneKey() {
        XCTAssertNil(MinneKeyTap.rightOptionInput(keyCode: 0x37, flags: 0x10_0108))  // ⌘
        XCTAssertNil(MinneKeyTap.rightOptionInput(keyCode: 0x38, flags: 0x2_0102))  // ⇧
    }
}
