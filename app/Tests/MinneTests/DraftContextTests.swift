import XCTest

@testable import Minne

/// The pure half of the drafting key: what a press means, what edit it makes,
/// and what undo puts back.
final class DraftContextTests: XCTestCase {

    // MARK: - Mode

    /// The order is the rule: a selection is the most explicit thing a user can
    /// point at, so it wins even when the field has text around it.
    func testASelectionIsAlwaysARewrite() {
        XCTAssertEqual(
            DraftMode.detect(selection: "i cant make it", fieldText: "hi — i cant make it"),
            .rewrite)
    }

    func testTextInTheFieldIsAnInstruction() {
        XCTAssertEqual(DraftMode.detect(selection: "", fieldText: "decline politely"), .instruction)
    }

    func testAnEmptyFieldIsInferred() {
        XCTAssertEqual(DraftMode.detect(selection: "", fieldText: ""), .infer)
    }

    /// Whitespace is not an instruction, and a selection of spaces is not a
    /// passage — either would send the model a prompt about nothing.
    func testWhitespaceCountsAsEmpty() {
        XCTAssertEqual(DraftMode.detect(selection: "  ", fieldText: " \n "), .infer)
        XCTAssertEqual(
            DraftMode.detect(selection: "\n", fieldText: "write to Ingrid"), .instruction)
    }

    // MARK: - The edit each mode makes

    func testInstructionModeReplacesTheWholeField() {
        let field = FieldSnapshot(text: "decline politely")
        let edit = FieldEdit.forDraft("No thanks.", mode: .instruction, field: field)
        XCTAssertEqual(edit.range, NSRange(location: 0, length: 16))
        XCTAssertEqual(edit.previous, "decline politely")
        XCTAssertEqual(edit.applied(to: field.text), "No thanks.")
    }

    func testRewriteModeReplacesOnlyTheSelection() {
        let field = FieldSnapshot(
            text: "hi — i cant make it", selection: "i cant make it",
            selectedRange: NSRange(location: 5, length: 14))
        let edit = FieldEdit.forDraft("I can't make it", mode: .rewrite, field: field)
        XCTAssertEqual(edit.applied(to: field.text), "hi — I can't make it")
        XCTAssertEqual(edit.previous, "i cant make it")
    }

    /// An app that names a selection but not its range still works: replacing
    /// the whole field is what "rewrite the selection" degrades to.
    func testRewriteWithoutARangeFallsBackToTheWholeField() {
        let field = FieldSnapshot(text: "i cant make it", selection: "i cant make it")
        let edit = FieldEdit.forDraft("I can't make it", mode: .rewrite, field: field)
        XCTAssertEqual(edit.range, NSRange(location: 0, length: 14))
        XCTAssertEqual(edit.applied(to: field.text), "I can't make it")
    }

    func testInferModeInsertsAtTheCaret() {
        let field = FieldSnapshot(text: "Hei ", selectedRange: NSRange(location: 4, length: 0))
        let edit = FieldEdit.forDraft("Ingrid", mode: .infer, field: field)
        XCTAssertEqual(edit.range, NSRange(location: 4, length: 0))
        XCTAssertEqual(edit.previous, "")
        XCTAssertEqual(edit.applied(to: field.text), "Hei Ingrid")
    }

    func testInferWithoutACaretAppends() {
        let field = FieldSnapshot(text: "Hei ")
        let edit = FieldEdit.forDraft("Ingrid", mode: .infer, field: field)
        XCTAssertEqual(edit.applied(to: field.text), "Hei Ingrid")
    }

    // MARK: - Undo

    func testTheInverseEditPutsThePreviousTextBack() {
        let field = FieldSnapshot(text: "decline politely")
        let edit = FieldEdit.forDraft("No thanks.", mode: .instruction, field: field)
        let after = edit.applied(to: field.text)!
        XCTAssertEqual(edit.inverse.applied(to: after), "decline politely")
    }

    /// Undo is surgical: it replaces where the draft now sits, so text the user
    /// typed on either side of it while reading survives.
    func testUndoOnlyTouchesWhereTheDraftLanded() {
        let field = FieldSnapshot(
            text: "hi — i cant make it", selection: "i cant make it",
            selectedRange: NSRange(location: 5, length: 14))
        let edit = FieldEdit.forDraft("I can't make it", mode: .rewrite, field: field)
        let after = edit.applied(to: field.text)!
        XCTAssertEqual(edit.inverse.range, NSRange(location: 5, length: 15))
        XCTAssertEqual(edit.inverse.applied(to: after), "hi — i cant make it")
    }

    func testUndoOfAnInsertionRemovesIt() {
        let field = FieldSnapshot(text: "Hei ", selectedRange: NSRange(location: 4, length: 0))
        let edit = FieldEdit.forDraft("Ingrid", mode: .infer, field: field)
        XCTAssertEqual(edit.inverse.applied(to: "Hei Ingrid"), "Hei ")
    }

    /// The field is read at press time and written a network round trip later.
    /// If the user edited it in between, the range no longer describes the text
    /// and the only safe answer is to touch nothing.
    func testAnEditThatNoLongerFitsIsRefused() {
        let edit = FieldEdit(
            range: NSRange(location: 0, length: 16), replacement: "x", previous: "y")
        XCTAssertNil(edit.applied(to: "short"))
    }

    /// AX speaks UTF-16, so the ranges have to as well — an emoji is two units
    /// and a naive character count would cut it in half.
    func testRangesAreCountedInUTF16Units() {
        let field = FieldSnapshot(text: "ok 👍 done")
        let edit = FieldEdit.forDraft("fine", mode: .instruction, field: field)
        XCTAssertEqual(edit.range.length, 10)
        XCTAssertEqual(edit.applied(to: field.text), "fine")
    }

    // MARK: - Did the write land

    func testAnUnreadableFieldIsTrusted() {
        XCTAssertTrue(InsertionCheck.succeeded(before: "a", after: nil, replacement: "b"))
    }

    /// The honest failure: the app took the call and did nothing.
    func testAnUnchangedFieldIsAFailure() {
        XCTAssertFalse(InsertionCheck.succeeded(before: "a", after: "a", replacement: "b"))
    }

    func testTheReplacementHasToBeThere() {
        XCTAssertTrue(InsertionCheck.succeeded(before: "a", after: "ab", replacement: "b"))
        XCTAssertFalse(InsertionCheck.succeeded(before: "a", after: "ac", replacement: "b"))
    }

    /// Undo can legitimately replace with nothing; changed is all it can claim.
    func testDeletingCountsAsSuccess() {
        XCTAssertTrue(InsertionCheck.succeeded(before: "ab", after: "a", replacement: ""))
    }

    // MARK: - Recipient

    func testSlackTitlesNameTheirCorrespondent() {
        XCTAssertEqual(
            RecipientHint.from(
                bundleIdentifier: "com.tinyspeck.slackmacgap",
                windowTitle: "Ingrid Berg (DM) - Nordfjord - Slack"),
            "Ingrid Berg")
        XCTAssertEqual(
            RecipientHint.from(
                bundleIdentifier: "com.tinyspeck.slackmacgap",
                windowTitle: "#oslo-migration - Nordfjord - Slack"),
            "#oslo-migration")
    }

    /// A window title is a bad place to guess from — Mail's is the subject and
    /// a browser's is the page — so everything else answers honestly with nil.
    func testUnknownAppsGiveNoRecipient() {
        XCTAssertNil(
            RecipientHint.from(bundleIdentifier: "com.apple.mail", windowTitle: "Re: Thursday?"))
        XCTAssertNil(
            RecipientHint.from(bundleIdentifier: "com.google.Chrome", windowTitle: "GitHub"))
        XCTAssertNil(
            RecipientHint.from(bundleIdentifier: "com.tinyspeck.slackmacgap", windowTitle: ""))
    }
}
