import CoreGraphics
import XCTest

@testable import Minne

/// AltGr safety (US-103). On Swedish and most EU layouts right-Option *is*
/// AltGr: ⌥2 types @, ⌥¨ types ~, ⌥E types €. These chords must never read as
/// a tap of the Minne key — and must never be consumed, or the character would
/// not type.
///
/// Driven through `MinneKeyTap.handle(_:)` with the same `Signal` values the C
/// callback builds from real events, so the whole routing is under test:
/// flagsChanged → the discriminator, keyDown → `.otherInput`.
@MainActor
final class MinneKeyAltGrTests: XCTestCase {
    /// A test case is not `Sendable` (XCTestCase is not), so the count lives in
    /// a main-actor box the `onTap` callback can capture.
    @MainActor
    private final class Counter {
        private(set) var taps = 0
        func bump() { taps += 1 }
    }

    private var tap: MinneKeyTap!
    private var counter = Counter()
    private var taps: Int { counter.taps }

    override func setUp() async throws {
        tap = MinneKeyTap(forTestingTapWindow: 0.3)
        counter = Counter()
        tap.onTap = { @MainActor [counter] in counter.bump() }
    }

    override func tearDown() async throws {
        tap = nil
    }

    /// `.maskAlternate` | `NX_DEVICERALTKEYMASK` | `.maskNonCoalesced` — what a
    /// real right-Option press carries (see MinneKeyDiscriminatorTests).
    private static let rightOptionDownFlags: UInt64 = 0x8_0140
    /// The release: the Option and device bits are gone.
    private static let releaseFlags: UInt64 = 0x100

    /// Swedish-layout keycodes for the chords under test.
    private static let digitTwo: Int64 = 19  // kVK_ANSI_2, ⌥2 = @
    private static let diaeresis: Int64 = 30  // the ¨ key, ⌥¨ = ~ (dead key)
    private static let letterE: Int64 = 14  // kVK_ANSI_E, ⌥E = €

    private func rightOption(down: Bool) -> MinneKeyTap.Signal {
        MinneKeyTap.Signal(
            type: .flagsChanged, keyCode: MinneKeyTap.rightOptionKeyCode,
            flags: down ? Self.rightOptionDownFlags : Self.releaseFlags, location: .zero)
    }

    /// A keyDown while right-Option is held: the flags still carry the Option
    /// and device bits.
    private func keyDown(
        _ keyCode: Int64, flags: UInt64 = MinneKeyAltGrTests.rightOptionDownFlags
    ) -> MinneKeyTap.Signal {
        MinneKeyTap.Signal(type: .keyDown, keyCode: keyCode, flags: flags, location: .zero)
    }

    /// `onTap` is dispatched asynchronously (the callback sits in the
    /// keyboard's critical path), so any pending fire has to be let through
    /// before `taps` can be believed.
    private func drainMainQueue() {
        let drained = expectation(description: "main queue drained")
        DispatchQueue.main.async { drained.fulfill() }
        wait(for: [drained], timeout: 1)
    }

    func testTypingAnAtSignIsNotATap() {
        // ⌥2 on a Swedish layout: down, the digit while held, up.
        XCTAssertEqual(tap.handle(rightOption(down: true)), .pass)
        XCTAssertEqual(tap.handle(keyDown(Self.digitTwo)), .pass, "the @ must type through")
        XCTAssertEqual(tap.handle(rightOption(down: false)), .pass)
        drainMainQueue()
        XCTAssertEqual(taps, 0)
    }

    func testTypingATildeIsNotATap() {
        // ⌥¨ is a dead key: the chord, release, then the composing key pressed
        // bare. None of it may fire, and the bare keyDown after the release
        // must not spoil anything either.
        XCTAssertEqual(tap.handle(rightOption(down: true)), .pass)
        XCTAssertEqual(tap.handle(keyDown(Self.diaeresis)), .pass)
        XCTAssertEqual(tap.handle(rightOption(down: false)), .pass)
        XCTAssertEqual(tap.handle(keyDown(49, flags: 0x100)), .pass)  // space completes the ~
        drainMainQueue()
        XCTAssertEqual(taps, 0)
    }

    func testRapidRepeatedChordsNeverTap() {
        // "@@@" typed quickly: three full chords back to back.
        for _ in 0..<3 {
            XCTAssertEqual(tap.handle(rightOption(down: true)), .pass)
            XCTAssertEqual(tap.handle(keyDown(Self.digitTwo)), .pass)
            XCTAssertEqual(tap.handle(rightOption(down: false)), .pass)
        }
        drainMainQueue()
        XCTAssertEqual(taps, 0)
    }

    func testSeveralCharactersDuringOneHeldPressNeverTap() {
        // "user@host" finished in one hold: Option stays down across repeats.
        XCTAssertEqual(tap.handle(rightOption(down: true)), .pass)
        for _ in 0..<3 { XCTAssertEqual(tap.handle(keyDown(Self.digitTwo)), .pass) }
        XCTAssertEqual(tap.handle(rightOption(down: false)), .pass)
        drainMainQueue()
        XCTAssertEqual(taps, 0)
    }

    func testTypingAEuroSignIsNotATap() {
        XCTAssertEqual(tap.handle(rightOption(down: true)), .pass)
        XCTAssertEqual(tap.handle(keyDown(Self.letterE)), .pass)
        XCTAssertEqual(tap.handle(rightOption(down: false)), .pass)
        drainMainQueue()
        XCTAssertEqual(taps, 0)
    }

    /// The half that keeps the key usable: someone types an @, then reaches
    /// straight for the Minne key. The chord just before must not cost them
    /// the tap.
    func testABareTapImmediatelyAfterAChordStillFires() {
        XCTAssertEqual(tap.handle(rightOption(down: true)), .pass)
        XCTAssertEqual(tap.handle(keyDown(Self.digitTwo)), .pass)
        XCTAssertEqual(tap.handle(rightOption(down: false)), .pass)

        XCTAssertEqual(tap.handle(rightOption(down: true)), .pass)
        XCTAssertEqual(tap.handle(rightOption(down: false)), .pass)
        drainMainQueue()
        XCTAssertEqual(taps, 1)
    }
}
