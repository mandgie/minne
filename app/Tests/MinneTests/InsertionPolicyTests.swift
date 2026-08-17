import XCTest

@testable import Minne

/// Which insertion path a target gets, and what has to be selected before a
/// paste. Both rules are pure, which is the point: the bug they fix (a draft
/// that appears in a web editor and vanishes on the next re-render) can only be
/// seen in a browser, but the decision that prevents it can be tested here.
final class InsertionPolicyTests: XCTestCase {

    // MARK: - Which path

    func testAnElementInsideAWebAreaTakesThePasteboard() {
        XCTAssertEqual(
            InsertionPolicy.strategy(bundleIdentifier: "com.google.Chrome", isWebContent: true),
            .pasteboard)
    }

    /// The AX walk is the precise test, and it is what catches an Electron app:
    /// its bundle id is in nobody's browser list, but its editor is a web view.
    func testAnElectronAppsEditorTakesThePasteboardOnItsWebAreaAlone() {
        XCTAssertEqual(
            InsertionPolicy.strategy(
                bundleIdentifier: "com.tinyspeck.slackmacgap", isWebContent: true),
            .pasteboard)
    }

    /// And the bundle-id list is the backstop for a browser that will not show
    /// its ancestors at all.
    func testAKnownBrowserTakesThePasteboardEvenWithoutAWebArea() {
        for bundle in ["com.apple.Safari", "com.brave.Browser", "company.thebrowser.Browser"] {
            XCTAssertEqual(
                InsertionPolicy.strategy(bundleIdentifier: bundle, isWebContent: false),
                .pasteboard, bundle)
        }
    }

    /// A native app keeps the surgical path — it is the one that leaves the
    /// app's own undo stack intact.
    func testANativeAppKeepsTheAccessibilityPath() {
        XCTAssertEqual(
            InsertionPolicy.strategy(bundleIdentifier: "com.apple.TextEdit", isWebContent: false),
            .accessibilityFirst)
        XCTAssertEqual(
            InsertionPolicy.strategy(bundleIdentifier: "com.apple.mail", isWebContent: false),
            .accessibilityFirst)
    }

    // MARK: - What is selected before the paste

    /// Rewrite: the user's own selection is already exactly the span.
    func testRewritePastesOverTheSelectionAsItIs() {
        let field = FieldSnapshot(
            text: "hi — i cant make it", selection: "i cant make it",
            selectedRange: NSRange(location: 5, length: 14))
        let edit = FieldEdit.forDraft("I can't make it", mode: .rewrite, field: field)
        XCTAssertEqual(SelectionPlan.plan(for: edit, field: field), .asIs)
    }

    /// Instruction: the whole field goes, and inside a focused editor that is
    /// what ⌘A means.
    func testInstructionSelectsTheWholeEditor() {
        let field = FieldSnapshot(
            text: "decline politely", selectedRange: NSRange(location: 16, length: 0))
        let edit = FieldEdit.forDraft("Sorry, not Thursday.", mode: .instruction, field: field)
        XCTAssertEqual(SelectionPlan.plan(for: edit, field: field), .selectAll)
    }

    /// Infer: nothing is replaced, so nothing is selected — and the user's own
    /// blank lines survive.
    func testInferPastesAtTheCaret() {
        let field = FieldSnapshot(text: "\n\n", selectedRange: NSRange(location: 2, length: 0))
        let edit = FieldEdit.forDraft("Thursday works.", mode: .infer, field: field)
        XCTAssertEqual(SelectionPlan.plan(for: edit, field: field), .asIs)
    }

    /// An empty field is `selectAll`'s one trap: there is nothing to select,
    /// and ⌘A in a browser that decided the caret is not in an editor would
    /// select the whole page.
    func testAnEmptyFieldIsNeverSelected() {
        let field = FieldSnapshot(text: "", selectedRange: NSRange(location: 0, length: 0))
        let edit = FieldEdit.forDraft("Thursday works.", mode: .infer, field: field)
        XCTAssertEqual(SelectionPlan.plan(for: edit, field: field), .asIs)
    }

    /// A span that is neither the selection nor the whole field: no keystroke
    /// expresses it, so Accessibility is asked and the paste follows anyway.
    func testAnArbitrarySpanFallsBackToAnAccessibilityRange() {
        let field = FieldSnapshot(
            text: "hi — i cant make it", selectedRange: NSRange(location: 0, length: 0))
        let edit = FieldEdit(
            range: NSRange(location: 5, length: 14), replacement: "I can't make it",
            previous: "i cant make it")
        XCTAssertEqual(
            SelectionPlan.plan(for: edit, field: field),
            .axRange(NSRange(location: 5, length: 14)))
    }

    // MARK: - Whose undo

    func testUndoBelongsToTheAppOnlyAfterAPaste() {
        XCTAssertTrue(InsertionMethod.pasteboard.undoBelongsToTheApp)
        XCTAssertFalse(InsertionMethod.selectedText.undoBelongsToTheApp)
        XCTAssertFalse(InsertionMethod.value.undoBelongsToTheApp)
    }

    // MARK: - Confirming a paste after the fact

    func testAFieldThatNeverChangedMeansThePasteWasIgnored() {
        XCTAssertFalse(InsertionCheck.changed(before: "hello", after: "hello"))
        XCTAssertTrue(InsertionCheck.changed(before: "hello", after: "hello there"))
    }

    /// A rich editor may normalise what it took, and an app may refuse to say
    /// what it holds at all. Neither is a failed insertion — putting an error
    /// over a draft the user can see in their field is worse than saying
    /// nothing.
    func testAnUnreadableFieldIsNotCalledAFailure() {
        XCTAssertTrue(InsertionCheck.changed(before: "hello", after: nil))
    }
}
