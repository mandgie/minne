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

    /// Mail was considered for US-105 and rejected on the evidence: no Mail
    /// window title names a recipient. Compose is titled with the subject
    /// ("New Message" before one exists), the viewer with the mailbox or the
    /// open message's subject. Inventing one from any of these would ground
    /// the draft in the wrong person's pages — worse than none.
    func testMailTitlesNeverNameARecipient() {
        for title in [
            "New Message",
            "Re: Thursday?",
            "Fwd: Q3 numbers",
            "Inbox — magnus@example.com",
            "Inbox (2 messages, 1 unread)",
            "Trip to Oslo",
        ] {
            XCTAssertNil(
                RecipientHint.from(bundleIdentifier: "com.apple.mail", windowTitle: title),
                "Mail title \"\(title)\" must not yield a recipient")
        }
    }

    /// Gmail's tab titles carry the subject and the *user's own* address, and
    /// opening compose does not change the title at all — so every Gmail shape
    /// answers nil, whatever browser it is in.
    func testGmailTitlesNeverNameARecipient() {
        for title in [
            "Inbox (12) - magnus@example.com - Gmail - Google Chrome",
            "Trip to Oslo - magnus@example.com - Gmail",
            "Sent Mail - magnus@example.com - Gmail — Mozilla Firefox",
            "Gmail - Google Chrome",
        ] {
            XCTAssertNil(
                RecipientHint.from(bundleIdentifier: "com.google.Chrome", windowTitle: title))
            XCTAssertNil(
                RecipientHint.from(bundleIdentifier: "com.apple.Safari", windowTitle: title))
        }
    }

    /// LinkedIn messaging is the browser tab that does name the counterpart.
    /// Safari's AX title is the bare page title; Chrome and Firefox append
    /// their own name; an unread badge may sit in front. All of it comes off.
    /// (Shapes encoded from the "Messaging | <Name> | LinkedIn" pattern;
    /// verify against a live tab in daylight — prd-night-1.md Open Questions.)
    func testLinkedInConversationTitlesNameTheCounterpart() {
        XCTAssertEqual(
            RecipientHint.from(
                bundleIdentifier: "com.apple.Safari",
                windowTitle: "Messaging | Ingrid Berg | LinkedIn"),
            "Ingrid Berg")
        XCTAssertEqual(
            RecipientHint.from(
                bundleIdentifier: "com.google.Chrome",
                windowTitle: "(3) Messaging | Ingrid Berg | LinkedIn - Google Chrome"),
            "Ingrid Berg")
        XCTAssertEqual(
            RecipientHint.from(
                bundleIdentifier: "org.mozilla.firefox",
                windowTitle: "Messaging | Ingrid Berg | LinkedIn — Mozilla Firefox"),
            "Ingrid Berg")
        XCTAssertEqual(
            RecipientHint.from(
                bundleIdentifier: "com.brave.Browser",
                windowTitle: "(12) Messaging | Dr. Åsa Lindqvist-Øst | LinkedIn - Brave"),
            "Dr. Åsa Lindqvist-Øst")
    }

    /// The inbox with nobody open, a profile page, the feed, and every other
    /// LinkedIn surface must stay nil — a wrong recipient sends the draft to
    /// the wrong style page, which is worse than having none.
    func testLinkedInListViewsGiveNoRecipient() {
        for title in [
            "Messaging | LinkedIn",
            "(3) Messaging | LinkedIn - Google Chrome",
            "Ingrid Berg | LinkedIn",
            "Feed | LinkedIn",
            "(2) Notifications | LinkedIn - Google Chrome",
            "Ingrid Berg | Messaging | LinkedIn Learning",
            "• Messaging | Ingrid Berg | LinkedIn",
        ] {
            XCTAssertNil(
                RecipientHint.from(bundleIdentifier: "com.google.Chrome", windowTitle: title),
                "LinkedIn title \"\(title)\" must not yield a recipient")
        }
    }

    /// The LinkedIn shape only counts inside a browser: a non-browser app
    /// whose title happens to match is not LinkedIn.
    func testLinkedInShapeOutsideABrowserIsIgnored() {
        XCTAssertNil(
            RecipientHint.from(
                bundleIdentifier: "com.example.notes",
                windowTitle: "Messaging | Ingrid Berg | LinkedIn"))
    }
}
