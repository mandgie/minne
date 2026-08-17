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

/// Putting a finished draft into someone else's text field.
///
/// A protocol because this is the one part of the feature with no honest test:
/// it is Accessibility IPC into another process. The rules around it — which
/// edit each mode makes, what undo puts back, whether an attempt worked — are
/// pure and live in `FieldEdit` and `InsertionCheck`.
@MainActor
protocol FieldWriting: AnyObject {
    /// Applies `edit` to `handle`'s element, whose text was `fieldText` when it
    /// was read. Returns how it got there, or nil when no path worked.
    func apply(_ edit: FieldEdit, fieldText: String, to handle: FocusedFieldHandle?)
        -> InsertionMethod?
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
}

/// Real `FieldWriting`, in three attempts, cheapest and most surgical first.
///
/// 1. `AXSelectedTextRange` + `AXSelectedText` — replaces exactly the span, and
///    leaves the app's own undo stack intact where the app implements it.
/// 2. `AXValue` — replaces the whole field. Works in plain single-line fields
///    and usually flattens native undo, which is why Minne keeps its own.
/// 3. The pasteboard: save it, put the draft on it, synthesise Cmd+V into the
///    app that still has focus, put the clipboard back.
///
/// Glue, like `AccessibilityCaretLocator`: `swift test` has neither a trusted
/// process nor another app to type into.
@MainActor
final class AccessibilityFieldWriter: FieldWriting {
    /// `kVK_ANSI_V`.
    private static let vKeyCode: CGKeyCode = 9
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

    private let swap: PasteboardSwap
    /// Debug hook (`-minneKeyForcePaste YES`): skip the AX paths and take the
    /// fallback. The apps that need it are the ones that cannot be scripted, so
    /// this is the only way to put that path through a real insertion.
    private let forcePasteboard: Bool

    init(swap: PasteboardSwap = PasteboardSwap(), forcePasteboard: Bool = false) {
        self.swap = swap
        self.forcePasteboard = forcePasteboard
    }

    func apply(_ edit: FieldEdit, fieldText: String, to handle: FocusedFieldHandle?)
        -> InsertionMethod?
    {
        guard let element = handle?.element else { return nil }
        let expected = forcePasteboard ? nil : edit.applied(to: fieldText)

        // Selecting the span first is worth doing even when the writes below
        // fail: it is what makes the paste replace the right text.
        let selected = setSelectedRange(edit.range, of: element)

        if !forcePasteboard, selected,
            setString(edit.replacement, kAXSelectedTextAttribute, of: element),
            landed(edit, fieldText: fieldText, in: element)
        {
            return .selectedText
        }
        if let expected, setString(expected, kAXValueAttribute, of: element),
            landed(edit, fieldText: fieldText, in: element)
        {
            return .value
        }
        let pasted = swap.paste(edit.replacement) { Self.postPaste() }
        return pasted ? .pasteboard : nil
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

    // MARK: - Pasteboard fallback

    /// Synthesises ⌘V. Posted to the HID tap, which delivers it to whichever
    /// app has focus — and that is still the user's app, because the overlay
    /// never took it.
    private static func postPaste() -> Bool {
        guard let source = CGEventSource(stateID: .combinedSessionState),
            let down = CGEvent(keyboardEventSource: source, virtualKey: vKeyCode, keyDown: true),
            let up = CGEvent(keyboardEventSource: source, virtualKey: vKeyCode, keyDown: false)
        else { return false }
        down.flags = .maskCommand
        up.flags = .maskCommand
        down.post(tap: .cghidEventTap)
        up.post(tap: .cghidEventTap)
        return true
    }
}
