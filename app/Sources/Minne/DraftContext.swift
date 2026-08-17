import Foundation

/// What the Minne key is being asked to do, decided entirely from the
/// Accessibility state read at the moment the key was pressed.
///
/// The order is the whole rule and it is deliberate: a selection is the most
/// explicit thing a user can point at, so it wins over the text around it; text
/// in the field is an instruction, because a user who wanted to keep it would
/// not have pressed the key; and an empty field is the only case where Minne
/// has to work out what the user would have said.
enum DraftMode: String, Equatable, Sendable {
    /// Something is selected: replace it with a better version.
    case rewrite
    /// The field holds an instruction: replace it with the result.
    case instruction
    /// The field is empty: write the reply from the window and from memory.
    case infer

    static func detect(selection: String, fieldText: String) -> DraftMode {
        if !selection.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { return .rewrite }
        if !fieldText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return .instruction
        }
        return .infer
    }

    /// What the overlay says while this mode is being drafted.
    var progressLabel: String {
        switch self {
        case .rewrite: return "Rewriting the selection…"
        case .instruction: return "Following your instruction…"
        case .infer: return "Drafting a reply…"
        }
    }
}

/// The text field as it stood when the key was pressed.
///
/// A snapshot, not a live view: everything the draft is built from and
/// everything undo has to put back is read once, up front, because between the
/// press and the insertion there is a network round trip during which the user
/// is still holding the keyboard.
struct FieldSnapshot: Equatable, Sendable {
    /// the focused element's whole value
    var text: String = ""
    /// what was selected in it, if anything
    var selection: String = ""
    /// where that selection was, in UTF-16 units — the unit AX speaks
    var selectedRange: NSRange?
    /// the rest of the window, from the same AX walk capture uses
    var windowText: String = ""
    var windowTitle: String = ""
}

/// One replacement in a text field: what to overwrite, with what, and what was
/// there before.
///
/// Pure, and the single place the three modes turn into an edit — which is what
/// makes undo trivial rather than a second implementation: `inverse` is the
/// same kind of edit pointing the other way.
struct FieldEdit: Equatable, Sendable {
    /// the range to overwrite, in UTF-16 units
    var range: NSRange
    var replacement: String
    /// what `range` holds before this edit is applied
    var previous: String

    /// The edit one mode's draft makes.
    ///
    /// `rewrite` replaces the selection, `instruction` replaces the whole field
    /// (the instruction was never text the user wanted), and `infer` inserts at
    /// the caret without disturbing anything — a zero-length range.
    static func forDraft(_ draft: String, mode: DraftMode, field: FieldSnapshot) -> FieldEdit {
        let whole = NSRange(location: 0, length: field.text.utf16.count)
        switch mode {
        case .rewrite:
            let range = field.selectedRange ?? whole
            return FieldEdit(range: range, replacement: draft, previous: field.selection)
        case .instruction:
            return FieldEdit(range: whole, replacement: draft, previous: field.text)
        case .infer:
            let caret = NSRange(
                location: field.selectedRange?.location ?? whole.length, length: 0)
            return FieldEdit(range: caret, replacement: draft, previous: "")
        }
    }

    /// The edit that puts the field back. Its range is where the replacement
    /// now sits — same start, the new text's length — so undo is surgical
    /// rather than a rewrite of the whole field, and anything the user typed
    /// around the draft survives.
    var inverse: FieldEdit {
        FieldEdit(
            range: NSRange(location: range.location, length: replacement.utf16.count),
            replacement: previous,
            previous: replacement)
    }

    /// The field's whole value after this edit, or nil when the range does not
    /// fit the text we were given — which means the user edited the field while
    /// the draft was being written, and the safe answer is to touch nothing.
    func applied(to text: String) -> String? {
        let units = Array(text.utf16)
        guard range.location >= 0, range.length >= 0, range.upperBound <= units.count else {
            return nil
        }
        let head = String(utf16CodeUnits: Array(units[0..<range.location]), count: range.location)
        let tailCount = units.count - range.upperBound
        let tail = String(utf16CodeUnits: Array(units[range.upperBound...]), count: tailCount)
        return head + replacement + tail
    }
}

/// How a draft got into the field. Worth reporting, and worth logging: which
/// path an app takes is the per-app quirk this feature lives or dies on.
enum InsertionMethod: String, Equatable, Sendable {
    /// `AXSelectedTextRange` + `AXSelectedText` — the surgical path, and the
    /// one that leaves the app's own undo stack intact.
    case selectedText
    /// Setting `AXValue` wholesale. Works in simple fields; usually clears the
    /// app's native undo, which is why ours exists.
    case value
    /// Cmd+V with the pasteboard briefly swapped, then put back. The last
    /// resort, and the only one that works in apps with no writable AX.
    case pasteboard

    var label: String {
        switch self {
        case .selectedText: return "AX"
        case .value: return "AX value"
        case .pasteboard: return "paste"
        }
    }
}

/// The person or channel being written to, when the app's window title says so.
///
/// Deliberately a short list of shapes that really do name a correspondent. A
/// window title is a bad place to guess from — Mail's is the subject, a
/// browser's is the page — and a wrong recipient sends the draft to the wrong
/// style page, which is worse than having none.
enum RecipientHint {
    static func from(bundleIdentifier: String, windowTitle: String) -> String? {
        let title = windowTitle.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !title.isEmpty else { return nil }
        switch bundleIdentifier {
        case "com.tinyspeck.slackmacgap", "com.hnc.Discord":
            // "Ingrid Berg (DM) - Nordfjord - Slack", "#oslo-migration - …"
            guard let first = title.components(separatedBy: " - ").first else { return nil }
            return clean(first.replacingOccurrences(of: "(DM)", with: ""))
        case "com.apple.MobileSMS":
            // Messages titles its window with the conversation.
            return clean(title)
        default:
            return nil
        }
    }

    private static func clean(_ raw: String) -> String? {
        let text = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        // A bare unread count or an app name is not a correspondent.
        guard text.count > 1, text.count <= 60, text.rangeOfCharacter(from: .letters) != nil
        else { return nil }
        return text
    }
}
