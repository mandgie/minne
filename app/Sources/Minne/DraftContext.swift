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

/// Which insertion paths a target allows.
///
/// The distinction is not cosmetic, it is the difference between a draft that
/// stays and one that vanishes. A web editor's text belongs to a framework
/// (React and friends): the DOM is a rendering of state the framework holds,
/// and it only learns about a change from a real input event. An Accessibility
/// write mutates the DOM directly — it reads back fine, so every verification
/// passes — but the state never moved, so the next re-render (a blur, a click,
/// the next keystroke) paints the old text back and the draft is gone. Verified
/// live in a React-style contenteditable, and reported by a user in LinkedIn.
///
/// A synthesised ⌘V is a real input event. The framework processes it, owns the
/// result, and the draft survives.
enum InsertionStrategy: String, Equatable, Sendable {
    /// Native app: the surgical AX write first, then AXValue, then the paste.
    case accessibilityFirst
    /// Web content: the pasteboard, and only the pasteboard.
    case pasteboard
}

/// Which strategy a target gets.
enum InsertionPolicy {
    /// Browsers, for when the AX walk cannot answer.
    ///
    /// The walk (is the focused element inside an `AXWebArea`?) is the real
    /// test — it is precise, it costs about a millisecond, and it catches
    /// Electron apps and embedded web views that no bundle-id list ever will.
    /// This list is the backstop for an app that will not show its ancestors.
    static let webBundleIdentifiers: Set<String> = [
        "com.apple.Safari",
        "com.apple.SafariTechnologyPreview",
        "com.google.Chrome",
        "com.google.Chrome.beta",
        "com.google.Chrome.canary",
        "com.brave.Browser",
        "com.brave.Browser.beta",
        "org.mozilla.firefox",
        "org.mozilla.firefoxdeveloperedition",
        "com.microsoft.edgemac",
        "company.thebrowser.Browser",
        "company.thebrowser.dia",
        "com.vivaldi.Vivaldi",
        "com.operasoftware.Opera",
        "ru.yandex.desktop.yandex-browser",
        "org.chromium.Chromium",
        "com.sigmaos.sigmaos.macos",
    ]

    static func strategy(bundleIdentifier: String, isWebContent: Bool) -> InsertionStrategy {
        if isWebContent { return .pasteboard }
        return webBundleIdentifiers.contains(bundleIdentifier) ? .pasteboard : .accessibilityFirst
    }
}

/// How the span a draft replaces is selected before it is pasted.
///
/// The paste path cannot ask for a range the way an AX write can — it types
/// into whatever is selected. Happily the three modes need only two answers:
/// rewrite and infer already point at exactly the right span (the user's own
/// selection, or the caret), and instruction wants the whole field, which is
/// what ⌘A means inside a focused editor.
enum SelectionPlan: Equatable, Sendable {
    /// The caret or selection is already the span to replace.
    case asIs
    /// Select the whole editor first (⌘A).
    case selectAll
    /// Neither — ask Accessibility to move the selection, and paste anyway.
    case axRange(NSRange)

    static func plan(for edit: FieldEdit, field: FieldSnapshot) -> SelectionPlan {
        if let selected = field.selectedRange, selected == edit.range { return .asIs }
        let whole = NSRange(location: 0, length: field.text.utf16.count)
        if edit.range == whole {
            // Replacing nothing with something needs no selecting at all.
            return whole.length == 0 ? .asIs : .selectAll
        }
        return .axRange(edit.range)
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

    /// Whose undo takes this insertion back.
    ///
    /// After a paste it is the app's own: the draft went in through the app's
    /// event pipeline, so the app has it on its undo stack — and in a web
    /// editor an inverse AX write would be erased by the same re-render that
    /// erases an AX insertion. So ⌘Z is left to the app (the tap does not
    /// consume it) and Minne's Undo button asks the app for it. After an AX
    /// write it is ours, because setting `AXValue` usually flattens the app's
    /// own undo stack, which is the reason Minne keeps an inverse at all.
    var undoBelongsToTheApp: Bool { self == .pasteboard }
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
        case "com.apple.mail":
            // Considered, and the honest answer is no: a Mail window title
            // never names a recipient. Compose is the subject ("Re: Thursday?",
            // or "New Message" before one is typed) and the viewer is the
            // mailbox or the open message's subject. The recipient lives in the
            // To: field — windowText, not the title — so Mail waits for a
            // windowText-based hint (prd-night-1.md, Open Questions).
            return nil
        default:
            // A browser's title is the page's, and only one page worth knowing
            // about puts the correspondent there: LinkedIn messaging. Gmail
            // does not — its titles carry the subject and the user's *own*
            // address ("Trip to Oslo - magnus@… - Gmail"), and compose leaves
            // the title untouched — so Gmail stays nil like the rest of the web.
            guard InsertionPolicy.webBundleIdentifiers.contains(bundleIdentifier) else {
                return nil
            }
            return linkedInConversation(title)
        }
    }

    /// "Messaging | Ingrid Berg | LinkedIn", possibly wearing an unread badge
    /// ("(3) Messaging | …") and the browser's own tail ("… | LinkedIn -
    /// Google Chrome"). Exactly three segments, "Messaging" first and
    /// "LinkedIn" last, or it is not a conversation: the inbox with nobody
    /// open is "Messaging | LinkedIn", a profile is "<Name> | LinkedIn", and
    /// both must answer nil.
    private static func linkedInConversation(_ title: String) -> String? {
        let parts = title.components(separatedBy: " | ")
        guard parts.count == 3, stripUnreadBadge(from: parts[0]) == "Messaging" else { return nil }
        let tail = parts[2]
        guard tail == "LinkedIn" || tail.hasPrefix("LinkedIn - ") || tail.hasPrefix("LinkedIn — ")
        else { return nil }
        return clean(parts[1])
    }

    /// "(3) Messaging" → "Messaging". Only a parenthesised count comes off —
    /// anything else in front means the title is not the shape we know.
    private static func stripUnreadBadge(from text: String) -> String {
        guard text.hasPrefix("("), let close = text.range(of: ") ") else { return text }
        let count = text[text.index(after: text.startIndex)..<close.lowerBound]
        guard !count.isEmpty, count.allSatisfy(\.isNumber) else { return text }
        return String(text[close.upperBound...])
    }

    private static func clean(_ raw: String) -> String? {
        let text = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        // A bare unread count or an app name is not a correspondent.
        guard text.count > 1, text.count <= 60, text.rangeOfCharacter(from: .letters) != nil
        else { return nil }
        return text
    }
}
