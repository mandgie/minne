import AppKit
import ApplicationServices

/// The text element the caret was in when the key was pressed.
///
/// It exists only to carry an `AXUIElement` from the locator to the writer:
/// `CaretTarget` is a value the overlay and the tests pass around, and an AX
/// element is neither a value nor `Sendable`. Insertion goes back to the very
/// element that was read, never to whatever happens to be focused a second
/// later — the draft belongs to the field the user pointed at.
@MainActor
final class FocusedFieldHandle {
    let element: AXUIElement

    init(element: AXUIElement) {
        self.element = element
    }
}

/// Everything the writer needs about where a draft is going: the element, the
/// text that was in it, which paths this target allows, and how the span to be
/// replaced gets selected when the path is a paste.
@MainActor
struct InsertionTarget {
    var handle: FocusedFieldHandle?
    /// The field's whole value as it was read.
    var fieldText: String
    var strategy: InsertionStrategy
    var selection: SelectionPlan
}

/// Putting a finished draft into someone else's text field.
///
/// A protocol because this is the one part of the feature with no honest test:
/// it is Accessibility IPC into another process. The rules around it — which
/// edit each mode makes, which paths a target allows, how the span is selected,
/// whether an attempt worked — are pure and live in `FieldEdit`,
/// `InsertionPolicy`, `SelectionPlan` and `InsertionCheck`.
@MainActor
protocol FieldWriting: AnyObject {
    /// Applies `edit` to `target`'s element. Returns how it got there, or nil
    /// when no path allowed by the strategy worked.
    func apply(_ edit: FieldEdit, in target: InsertionTarget) -> InsertionMethod?
    /// Takes an insertion back. `edit` is the inverse edit and `method` is how
    /// the insertion got in, which decides whether the inverse is applied by us
    /// or asked of the app (see `InsertionMethod.undoBelongsToTheApp`).
    func revert(_ edit: FieldEdit, method: InsertionMethod, in target: InsertionTarget) -> Bool
    /// The field's value now, or nil when the app will not say. Used to confirm
    /// a paste after the fact — a keystroke is delivered asynchronously, so
    /// there is nothing to read at the moment it is posted.
    func currentText(of handle: FocusedFieldHandle?) -> String?
}

/// Did a write actually land? Pure, because "the app said .success" and "the
/// text is in the field" are not the same claim in Accessibility.
enum InsertionCheck {
    /// `after` is the field's value read back, or nil when the app will not say.
    ///
    /// An unreadable value is trusted: the alternative is falling through to
    /// the pasteboard path after a write that did work, which inserts the draft
    /// twice. An unchanged value is the honest failure — the app took the call
    /// and did nothing, which is exactly what several of them do.
    static func succeeded(before: String, after: String?, replacement: String) -> Bool {
        guard let after else { return true }
        if after == before { return false }
        return replacement.isEmpty || after.contains(replacement)
    }

    /// The lenient test, for confirming a paste some time after the event was
    /// posted. Only "readable and completely unchanged" counts as a failure: a
    /// rich editor may normalise what it took (whitespace, smart quotes, a
    /// paragraph split into nodes) and calling that a failed insertion would
    /// put an error over a draft the user can see sitting in their field.
    static func changed(before: String, after: String?) -> Bool {
        guard let after else { return true }
        return after != before
    }
}

/// Real `FieldWriting`.
///
/// In a native app, three attempts, cheapest and most surgical first:
/// 1. `AXSelectedTextRange` + `AXSelectedText` — replaces exactly the span, and
///    leaves the app's own undo stack intact where the app implements it.
/// 2. `AXValue` — replaces the whole field. Works in plain single-line fields
///    and usually flattens native undo, which is why Minne keeps its own.
/// 3. The pasteboard: save it, put the draft on it, synthesise ⌘V into the app
///    that still has focus, put the clipboard back.
///
/// In web content, only the third. See `InsertionStrategy` for why: the first
/// two land in the DOM, verify perfectly, and are erased by the framework's
/// next re-render.
///
/// Glue, like `AccessibilityCaretLocator`: `swift test` has neither a trusted
/// process nor another app to type into.
@MainActor
final class AccessibilityFieldWriter: FieldWriting {
    /// `kVK_ANSI_V`, `kVK_ANSI_A`, `kVK_ANSI_Z`.
    private static let vKeyCode: CGKeyCode = 9
    private static let aKeyCode: CGKeyCode = 0
    private static let zKeyCode: CGKeyCode = 6
    /// How long a write is given to show up in the field before it is called a
    /// failure, and how often the field is re-read while waiting.
    ///
    /// It has to be a wait rather than a single read: **Chromium applies an AX
    /// text write asynchronously**. It answers `.success`, the field still reads
    /// as it was, and a moment later the text appears. Verified live in Brave,
    /// where reading once meant every AX path looked dead, the pasteboard
    /// fallback ran, and the draft landed in the field *twice*.
    private static let verifyTimeout: TimeInterval = 0.12
    private static let verifyPoll: useconds_t = 15_000
    /// Gap between the ⌘A and the ⌘V that follows it. The select has to be in
    /// the app's queue before the paste, or the paste replaces nothing.
    private static let keystrokeGap: useconds_t = 30_000

    private let swap: PasteboardSwap
    /// Debug hook (`-minneKeyForcePaste YES`): take the pasteboard path even in
    /// a native app. The apps that need it are the ones that cannot be
    /// scripted, so this is the only way to put that path through a real
    /// insertion by hand.
    private let forcePasteboard: Bool

    init(swap: PasteboardSwap = PasteboardSwap(), forcePasteboard: Bool = false) {
        self.swap = swap
        self.forcePasteboard = forcePasteboard
    }

    func apply(_ edit: FieldEdit, in target: InsertionTarget) -> InsertionMethod? {
        let viaPasteboard = forcePasteboard || target.strategy == .pasteboard

        if !viaPasteboard, let element = target.handle?.element {
            // Selecting the span first is worth doing even when the writes
            // below fail: it is what makes the paste replace the right text.
            let selected = setSelectedRange(edit.range, of: element)
            if selected, setString(edit.replacement, kAXSelectedTextAttribute, of: element),
                landed(edit, fieldText: target.fieldText, in: element)
            {
                return .selectedText
            }
            if let expected = edit.applied(to: target.fieldText),
                setString(expected, kAXValueAttribute, of: element),
                landed(edit, fieldText: target.fieldText, in: element)
            {
                return .value
            }
        }

        return paste(edit.replacement, selecting: target.selection, in: target.handle?.element)
            ? .pasteboard : nil
    }

    func revert(_ edit: FieldEdit, method: InsertionMethod, in target: InsertionTarget) -> Bool {
        guard !method.undoBelongsToTheApp else { return Self.postUndo() }
        guard let element = target.handle?.element else { return false }
        guard setSelectedRange(edit.range, of: element) else { return false }
        if setString(edit.replacement, kAXSelectedTextAttribute, of: element),
            landed(edit, fieldText: target.fieldText, in: element)
        {
            return true
        }
        guard let expected = edit.applied(to: target.fieldText),
            setString(expected, kAXValueAttribute, of: element)
        else { return false }
        return landed(edit, fieldText: target.fieldText, in: element)
    }

    func currentText(of handle: FocusedFieldHandle?) -> String? {
        guard let element = handle?.element else { return nil }
        return string(element, kAXValueAttribute)
    }

    /// Reads the field back until the edit shows up, or the budget runs out.
    ///
    /// Blocking the main thread for a tenth of a second is the point: nothing
    /// else may happen between deciding that a write failed and taking the next
    /// path, and the whole budget is spent only when the write really did
    /// nothing. It stays well inside the event tap's own timeout (US-017).
    private func landed(_ edit: FieldEdit, fieldText: String, in element: AXUIElement) -> Bool {
        let deadline = Date().addingTimeInterval(Self.verifyTimeout)
        while true {
            if InsertionCheck.succeeded(
                before: fieldText, after: string(element, kAXValueAttribute),
                replacement: edit.replacement)
            {
                return true
            }
            if Date() >= deadline { return false }
            usleep(Self.verifyPoll)
        }
    }

    // MARK: - AX writes

    private func setSelectedRange(_ range: NSRange, of element: AXUIElement) -> Bool {
        var cfRange = CFRange(location: range.location, length: range.length)
        guard let value = AXValueCreate(.cfRange, &cfRange) else { return false }
        return AXUIElementSetAttributeValue(
            element, kAXSelectedTextRangeAttribute as CFString, value) == .success
    }

    private func setString(_ text: String, _ attribute: String, of element: AXUIElement) -> Bool {
        AXUIElementSetAttributeValue(element, attribute as CFString, text as CFString) == .success
    }

    private func string(_ element: AXUIElement, _ attribute: String) -> String? {
        var value: CFTypeRef?
        guard AXUIElementCopyAttributeValue(element, attribute as CFString, &value) == .success
        else { return nil }
        return value as? String
    }

    // MARK: - The pasteboard path

    /// Selects the span the plan asks for, then pastes.
    ///
    /// Only `.axRange` touches Accessibility, and only as a best effort — it is
    /// the plan for a span that is neither the current selection nor the whole
    /// field, which none of the three modes produces. The paste follows either
    /// way: a draft in the wrong place is recoverable, no draft at all is not.
    private func paste(_ text: String, selecting plan: SelectionPlan, in element: AXUIElement?)
        -> Bool
    {
        switch plan {
        case .asIs:
            break
        case .selectAll:
            guard Self.postKey(Self.aKeyCode) else { return false }
            usleep(Self.keystrokeGap)
        case .axRange(let range):
            if let element { _ = setSelectedRange(range, of: element) }
        }
        return swap.paste(text) { Self.postKey(Self.vKeyCode) }
    }

    /// Synthesises ⌘<key>. Posted to the HID tap, which delivers it to whichever
    /// app has focus — and that is still the user's app, because the overlay
    /// never took it.
    private static func postKey(_ key: CGKeyCode) -> Bool {
        guard let source = CGEventSource(stateID: .combinedSessionState),
            let down = CGEvent(keyboardEventSource: source, virtualKey: key, keyDown: true),
            let up = CGEvent(keyboardEventSource: source, virtualKey: key, keyDown: false)
        else { return false }
        down.flags = .maskCommand
        up.flags = .maskCommand
        down.post(tap: .cghidEventTap)
        up.post(tap: .cghidEventTap)
        return true
    }

    /// ⌘Z, for taking back an insertion the app itself performed.
    private static func postUndo() -> Bool { postKey(zKeyCode) }
}
