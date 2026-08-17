import AppKit
import XCTest

@testable import Minne

/// A pasteboard that records what it was asked to do, so the borrow-and-return
/// can be checked without touching the machine's real clipboard.
@MainActor
private final class FakePasteboard: PasteboardHolding {
    var contents: PasteboardContents
    private(set) var writes: [String] = []
    private(set) var restores: [PasteboardContents] = []

    init(_ contents: PasteboardContents) {
        self.contents = contents
    }

    func read() -> PasteboardContents { contents }

    func write(string: String) {
        writes.append(string)
        contents = PasteboardContents(items: [["public.utf8-plain-text": Data(string.utf8)]])
    }

    func write(_ contents: PasteboardContents) {
        restores.append(contents)
        self.contents = contents
    }
}

/// The clipboard is the user's, and the fallback insertion path only borrows it.
@MainActor
final class PasteboardSwapTests: XCTestCase {
    /// A pasteboard holding something that is not text, which is exactly what a
    /// string-only restore would destroy.
    private let image = PasteboardContents(items: [
        ["public.png": Data([0x89, 0x50, 0x4E, 0x47]), "public.utf8-plain-text": Data("alt".utf8)]
    ])

    private func makeSwap(_ pasteboard: FakePasteboard) -> (PasteboardSwap, () -> Void) {
        // Captures the scheduled restore instead of waiting for it, so the test
        // can assert on the window in between.
        nonisolated(unsafe) var pending: (@MainActor () -> Void)?
        let swap = PasteboardSwap(
            pasteboard: pasteboard, restoreDelay: 0.6,
            schedule: { _, work in pending = work })
        return (swap, { MainActor.assumeIsolated { pending?() } })
    }

    func testTheDraftIsOnTheBoardWhilePastingAndTheUsersContentComesBack() {
        let pasteboard = FakePasteboard(image)
        let (swap, runRestore) = makeSwap(pasteboard)

        var boardDuringPaste: PasteboardContents?
        let pasted = swap.paste("Thursday works.") {
            boardDuringPaste = pasteboard.read()
            return true
        }

        XCTAssertTrue(pasted)
        XCTAssertEqual(pasteboard.writes, ["Thursday works."])
        // The paste really did see the draft, not the user's image.
        XCTAssertEqual(
            boardDuringPaste?.items.first?["public.utf8-plain-text"],
            Data("Thursday works.".utf8))
        // …and the restore has not run yet, because the app underneath has not
        // handled the keystroke yet either.
        XCTAssertTrue(pasteboard.restores.isEmpty)

        runRestore()
        XCTAssertEqual(pasteboard.read(), image)
    }

    /// Every type, not just the string: a copied image restored as its own alt
    /// text is the user's work quietly destroyed.
    func testEveryTypeOfEveryItemIsPutBack() {
        let pasteboard = FakePasteboard(image)
        let (swap, runRestore) = makeSwap(pasteboard)
        swap.paste("draft") { true }
        runRestore()
        XCTAssertEqual(pasteboard.restores.last?.items.first?.count, 2)
        XCTAssertEqual(pasteboard.restores.last?.items.first?["public.png"]?.count, 4)
    }

    /// Nothing to wait for when the keystroke never went out.
    func testAFailedPasteRestoresImmediately() {
        let pasteboard = FakePasteboard(image)
        let (swap, _) = makeSwap(pasteboard)
        let pasted = swap.paste("draft") { false }
        XCTAssertFalse(pasted)
        XCTAssertEqual(pasteboard.read(), image)
    }

    func testAnEmptyClipboardIsRestoredAsEmpty() {
        let pasteboard = FakePasteboard(PasteboardContents(items: []))
        let (swap, runRestore) = makeSwap(pasteboard)
        swap.paste("draft") { true }
        runRestore()
        XCTAssertTrue(pasteboard.read().isEmpty)
    }
}
