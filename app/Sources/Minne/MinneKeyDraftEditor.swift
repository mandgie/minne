import AppKit

/// A text view the overlay panel can lend the borrowed keyboard to.
///
/// Both of the panel's editable moments — the guidance field and the draft
/// editor — are this view inside a borderless scroll view. It knows one thing
/// its superclass does not: in a window that is not key it cannot hold a caret,
/// so a click on it has to become a request to borrow key status rather than an
/// ordinary mouseDown. Once the panel is key it is an ordinary text view again.
final class OverlayTextView: NSTextView {
    var onClickWhileInactive: (@MainActor () -> Void)?

    /// The panel belongs to an app that is never active; without this the first
    /// click on it is swallowed as an activation click.
    override func acceptsFirstMouse(for event: NSEvent?) -> Bool { true }

    override func mouseDown(with event: NSEvent) {
        guard window?.isKeyWindow == true else {
            MainActor.assumeIsolated { onClickWhileInactive?() }
            return
        }
        super.mouseDown(with: event)
    }
}

/// Builds the text system both borrowing fields share.
///
/// TextKit 1, by hand (storage → layoutManager → container → view): the
/// convenience initialiser gives TextKit 2, and touching `.layoutManager` for
/// `usedRect` measurement then downgrades it mid-flight. The scroll view is
/// field-like, not document-like — no border, no background, elasticity off —
/// because the scroller only exists for the text past the field's line cap.
enum OverlayTextEditor {
    @MainActor
    static func make(font: NSFont) -> (
        view: OverlayTextView, scroll: NSScrollView, lineHeight: CGFloat
    ) {
        let storage = NSTextStorage()
        let layoutManager = NSLayoutManager()
        storage.addLayoutManager(layoutManager)
        let container = NSTextContainer(
            size: NSSize(width: 0, height: CGFloat.greatestFiniteMagnitude))
        container.widthTracksTextView = true
        container.lineFragmentPadding = 0
        layoutManager.addTextContainer(container)
        let view = OverlayTextView(frame: .zero, textContainer: container)

        view.font = font
        view.drawsBackground = false
        view.isRichText = false
        view.allowsUndo = true
        view.textContainerInset = .zero
        // What the user typed is what is kept — a smart quote or an auto-dash
        // would quietly rewrite their words.
        view.isAutomaticQuoteSubstitutionEnabled = false
        view.isAutomaticDashSubstitutionEnabled = false
        view.isVerticallyResizable = true
        view.isHorizontallyResizable = false
        view.autoresizingMask = [.width]
        view.minSize = .zero
        view.maxSize = NSSize(
            width: CGFloat.greatestFiniteMagnitude, height: .greatestFiniteMagnitude)

        let scroll = NSScrollView()
        scroll.documentView = view
        scroll.drawsBackground = false
        scroll.borderType = .noBorder
        scroll.hasVerticalScroller = true
        scroll.hasHorizontalScroller = false
        scroll.autohidesScrollers = true
        scroll.scrollerStyle = .overlay
        scroll.verticalScrollElasticity = .none
        scroll.horizontalScrollElasticity = .none

        return (view, scroll, layoutManager.defaultLineHeight(for: font))
    }
}

/// The draft, editable in place (US-202).
///
/// Swapped in for the read-only draft label when the user asks to edit — the
/// same position, the same type, the same line air, so the words do not move
/// when they become touchable. It holds the *whole* draft even when the label
/// above elided it: what is edited here is what Insert puts in the field.
///
/// Return inserts the text as it stands; a newline is asked for with
/// Shift-Return, exactly as in the guidance field. Escape hands the view back
/// without discarding anything — edits are kept, because the user asked to
/// leave the editor, not to undo their work. ⌘Z inside is the text view's own
/// undo: the event tap claims nothing while the panel holds the keyboard.
@MainActor
final class DraftEditor: NSView {
    /// Every change to the text, as the user types — the controller keeps the
    /// session's draft current with the screen, so whatever inserts, reworks or
    /// regenerates next acts on what the user actually sees.
    var onEdit: (@MainActor (String) -> Void)?
    /// Return: insert the draft as it now stands.
    var onSubmit: (@MainActor () -> Void)?
    /// Escape: stop editing, keep the edits.
    var onCancel: (@MainActor () -> Void)?
    /// The editor changed height — the panel has to re-measure and re-place.
    var onGrowth: (@MainActor () -> Void)?
    /// The caret arrived or left — whoever paints the editing affordance
    /// re-reads `isEditing`.
    var onFocusChange: (@MainActor () -> Void)?

    /// Where the editor stops growing and starts scrolling inside itself. A
    /// draft is a paragraph or three; past this it is a document, and the panel
    /// is a HUD at someone's caret.
    nonisolated static let maxLines = 12

    /// The read-only draft's own type, so the swap moves nothing.
    private static let font = NSFont.systemFont(ofSize: 12.5)
    private static let lineSpacing: CGFloat = 3

    private let field: OverlayTextView
    private let scroll: NSScrollView
    /// One line's worth of editor: the font's line plus the paragraph air,
    /// which TextKit adds to every line fragment it lays out.
    private let lineHeight: CGFloat
    private let heightConstraint: NSLayoutConstraint
    private var previewLook = false

    /// Whether the editor is live. Derived from where the caret actually is,
    /// like the guidance field's (see `GuidanceRow.isEditing`): key status
    /// arrives from the window server a beat after it is asked for, and a
    /// remembered flag would disagree with the caret the user can see.
    var isEditing: Bool { previewLook || hasCaret }

    /// Whether the editor really holds the keyboard — first responder in a
    /// window that is actually key, not merely first responder.
    var hasCaret: Bool {
        guard let window, window.isKeyWindow else { return false }
        return window.firstResponder === field
    }

    var text: String { field.string }

    override init(frame frameRect: NSRect) {
        let made = OverlayTextEditor.make(font: Self.font)
        field = made.view
        scroll = made.scroll
        lineHeight = made.lineHeight + Self.lineSpacing
        heightConstraint = scroll.heightAnchor.constraint(
            equalToConstant: GuidanceRow.fieldHeight(
                content: 0, line: made.lineHeight + Self.lineSpacing, maxLines: Self.maxLines))
        super.init(frame: frameRect)

        field.delegate = self
        // The same air between lines the read-only draft label sets — it is
        // the one paragraph of prose in the panel, editable or not.
        let paragraph = NSMutableParagraphStyle()
        paragraph.lineSpacing = Self.lineSpacing
        field.defaultParagraphStyle = paragraph
        field.typingAttributes = [
            .font: Self.font,
            .paragraphStyle: paragraph,
            .foregroundColor: OverlayPalette.ink,
        ]
        field.textColor = OverlayPalette.ink
        field.insertionPointColor = OverlayPalette.ink

        scroll.translatesAutoresizingMaskIntoConstraints = false
        addSubview(scroll)
        NSLayoutConstraint.activate([
            scroll.leadingAnchor.constraint(equalTo: leadingAnchor),
            scroll.trailingAnchor.constraint(equalTo: trailingAnchor),
            scroll.topAnchor.constraint(equalTo: topAnchor),
            scroll.bottomAnchor.constraint(equalTo: bottomAnchor),
            heightConstraint,
        ])
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("not used") }

    /// Seeds the editor with the draft — the whole draft, never the label's
    /// elided preview — and puts the caret at the end, where a small fix most
    /// often is.
    func setText(_ text: String) {
        field.string = text
        updateHeight()
        let end = NSRange(location: (text as NSString).length, length: 0)
        field.setSelectedRange(end)
        field.scrollRangeToVisible(end)
    }

    /// Puts the caret in the editor. Deliberately not conditional on the window
    /// being key yet — see `GuidanceRow.beginEditing`.
    func focus() {
        guard !hasCaret else { return }
        window?.makeFirstResponder(field)
    }

    /// The editing look without the keyboard. Only the overlay's preview hook
    /// uses it: this state cannot otherwise be screenshotted without taking the
    /// keyboard off whoever is using the machine.
    func showEditingLook() {
        previewLook = true
        onFocusChange?()
    }

    /// Gives the keyboard up and returns what is on screen. The edits are kept
    /// — leaving the editor is not undoing the work done in it.
    func endEditing() -> String {
        previewLook = false
        if hasCaret, let window { window.makeFirstResponder(nil) }
        return field.string
    }

    /// Re-measures the text and grows or shrinks the editor, within the cap.
    private func updateHeight() {
        guard let layoutManager = field.layoutManager, let container = field.textContainer
        else { return }
        layoutManager.ensureLayout(for: container)
        let content = layoutManager.usedRect(for: container).height
        let height = GuidanceRow.fieldHeight(
            content: content, line: lineHeight, maxLines: Self.maxLines)
        guard heightConstraint.constant != height else { return }
        heightConstraint.constant = height
        onGrowth?()
    }
}

extension DraftEditor: NSTextViewDelegate {
    func textDidChange(_ notification: Notification) {
        updateHeight()
        onEdit?(field.string)
    }

    func textDidBeginEditing(_ notification: Notification) {
        onFocusChange?()
    }

    func textDidEndEditing(_ notification: Notification) {
        // On the next pass: the responder chain is still mid-hand-off while
        // this is being delivered — see GuidanceRow.textDidEndEditing.
        DispatchQueue.main.async { [weak self] in
            MainActor.assumeIsolated { self?.onFocusChange?() }
        }
    }

    /// The keys the editor owns while it is live. The event tap claims nothing
    /// in this state (`MinneKeyController.command`), precisely so that these
    /// arrive here as ordinary text-view commands.
    func textView(_ textView: NSTextView, doCommandBy selector: Selector) -> Bool {
        switch selector {
        case #selector(NSResponder.insertNewline(_:)):
            // Return inserts what is on screen; the newline is Shift-Return's,
            // handed back to the text view to insert.
            if NSApp.currentEvent?.modifierFlags.contains(.shift) == true { return false }
            onSubmit?()
            return true
        case #selector(NSResponder.cancelOperation(_:)):
            onCancel?()
            return true
        case #selector(NSResponder.insertTab(_:)),
            #selector(NSResponder.insertBacktab(_:)):
            // There is nowhere to tab to that would not cost the caret, and a
            // tab character has no business in a chat message or an email.
            return true
        default:
            return false
        }
    }
}
