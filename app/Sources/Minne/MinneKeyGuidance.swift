import AppKit

/// The line under the draft where the user says what they want changed.
///
/// It is one text view and nothing else — no label, no button, no border until
/// the caret is in it. A hairline separates it from the draft above, the same
/// hairline the header uses, so the panel keeps its single rule and its single
/// grid. What it is for is said by the placeholder, and the placeholder is a
/// worked example rather than a noun: "shorter, warmer, mention…" is the whole
/// instruction manual.
///
/// The field wraps and grows. A steer is often a sentence, and a single line
/// scrolled the words out of view exactly while they were being judged — so the
/// field grows with its content to `maxFieldLines` and then scrolls inside
/// itself, and the panel reflows downward to make room. Return still submits; a
/// newline is asked for with Shift-Return.
///
/// The chips above it are the steers already in force. They matter because
/// guidance stacks: after two rounds the draft on screen is the product of
/// everything the user has said, and a panel that showed only the newest steer
/// would leave them guessing at why it still reads the way it does.
@MainActor
final class GuidanceRow: NSView {
    /// The user clicked into the field while the panel was not key — the
    /// presenter has to borrow key status before there can be a caret here.
    var onRequestEditing: (@MainActor () -> Void)?

    /// While the draft editor holds the keyboard the row stays on screen —
    /// hiding it resized the whole panel, which read as a jump (user report,
    /// 2026-08-20) — but it must not compete for the borrow: inert means
    /// dimmed and deaf to clicks, so the single-borrower invariant holds
    /// without a single point of geometry changing.
    private(set) var isInert = false

    func setInert(_ inert: Bool) {
        isInert = inert
        alphaValue = inert ? 0.4 : 1
    }
    /// Return in the field: steer the draft with this text.
    var onSubmit: (@MainActor (String) -> Void)?
    /// Escape in the field: stop editing, and leave the draft as it is.
    var onCancel: (@MainActor () -> Void)?
    /// The field changed height — the panel has to re-measure and re-place,
    /// or the row below the field is drawn over rather than pushed down.
    var onGrowth: (@MainActor () -> Void)?
    /// The caret arrived or left — whoever paints key hints elsewhere in the
    /// panel re-reads `isEditing`. Fired from `applyColors`, which is already
    /// called at every moment the focus can have changed.
    var onFocusChange: (@MainActor () -> Void)?

    /// How many steers are shown before the line starts counting instead.
    nonisolated static let maxChipsShown = 3
    /// How long one steer may be before it is elided in the chip line.
    nonisolated static let maxChipCharacters = 42
    /// How many lines the field grows to before it scrolls inside itself.
    nonisolated static let maxFieldLines = 6
    /// Air under each line's ink. It exists for one reason beyond looks: glyph
    /// rasters bleed a fraction of a point past the font's own descent, so a
    /// viewport cut exactly at a line's bottom still shows the tips of the
    /// line above. A point of spacing is the moat that bleed drowns in.
    nonisolated static let fieldLineSpacing: CGFloat = 1

    /// The field's height for what is in it: one line when empty, growing with
    /// the text, capped at `maxLines` — past the cap the words scroll inside
    /// the field instead of growing the panel any further. Shared with the
    /// draft editor, whose cap is merely a different number of lines. `line`
    /// is one line's whole slot — its height plus `spacing`.
    ///
    /// Growth rounds up so a fractional line height never clips descenders,
    /// but the cap is *exactly* whole lines of ink: `maxLines` slots less the
    /// trailing spacing. That subtraction is what makes a field scrolled to
    /// its end rest on a slot boundary — under the spacing moat — rather than
    /// on a line's ink bottom, where the raster bleed of the scrolled-off
    /// line lives (US-203's sliver).
    nonisolated static func fieldHeight(
        content: CGFloat, line: CGFloat, spacing: CGFloat = 0, maxLines: Int = maxFieldLines
    ) -> CGFloat {
        let one = ceil(line - spacing)
        let cap = max(line * CGFloat(maxLines) - spacing, one)
        return min(max(ceil(content), one), cap)
    }

    private static let fieldFont = NSFont.systemFont(ofSize: 12.5)

    private let rule = OverlayRule(frame: .zero)
    private let chips = NSTextField(labelWithString: "")
    private let field: OverlayTextView
    private let scroll: NSScrollView
    /// An `NSTextView` has no placeholder of its own; this label sits over the
    /// empty field and lets clicks fall through to it.
    private let placeholder = ClickThroughLabel(
        labelWithString: "Guide it — shorter, warmer, mention…")
    /// The key that gets you in, and — once you are in — the key that sends
    /// what you typed. One slot, two answers, so focus is legible from the
    /// trailing edge as well as from the rule.
    private let hint = NSTextField(labelWithString: "⇥")
    /// Holds the field and the hint apart. It paints nothing: the row's focus
    /// is said by the rule above it and by the ink, never by a fill.
    private let fieldRow = NSView()
    private let column = NSStackView()
    /// One line's whole slot — the font's line plus the spacing moat. The
    /// constraint below grows from here and never past `maxFieldLines` of it.
    private let lineHeight: CGFloat
    private let fieldHeightConstraint: NSLayoutConstraint

    /// False while a rework is in flight — there is nothing to steer yet, so
    /// the row must not advertise a key that would do nothing.
    private var isEditable = true

    /// Whether the row is drawn as focused.
    ///
    /// Derived from where the caret actually is rather than from a flag set
    /// when editing was *asked for*: key status arrives from the window server
    /// a beat later, so a remembered flag ends up disagreeing with the blinking
    /// caret the user can see. `previewLook` is the one exception, for the
    /// screenshot hook that has no keyboard to take.
    var isEditing: Bool { previewLook || hasCaret }

    private var previewLook = false

    /// The steers in force, oldest first.
    var guidance: [String] = [] {
        didSet {
            guard guidance != oldValue else { return }
            applyColors()
        }
    }

    override init(frame frameRect: NSRect) {
        // The shared editor stack (OverlayTextEditor): TextKit 1 built by hand,
        // so the field measures itself with the same TextKit the height maths
        // reads — the convenience initialiser's stack downgrades lazily and
        // measures nothing until it has.
        let made = OverlayTextEditor.make(font: Self.fieldFont, lineSpacing: Self.fieldLineSpacing)
        field = made.view
        scroll = made.scroll
        lineHeight = made.lineHeight + Self.fieldLineSpacing
        let oneLine = Self.fieldHeight(
            content: 0, line: lineHeight, spacing: Self.fieldLineSpacing)
        fieldHeightConstraint = scroll.heightAnchor.constraint(equalToConstant: oneLine)
        super.init(frame: frameRect)

        // A caption, but not the same grey as the placeholder under it: these
        // are facts about the draft on screen and that is an empty invitation,
        // and two lines of identical tertiary ink read as one grey paragraph
        // instead of as two different things. Darker ink and an accent marker
        // per steer is what separates them.
        chips.font = .systemFont(ofSize: 11)
        chips.lineBreakMode = .byTruncatingTail
        chips.isHidden = true

        field.delegate = self
        field.onClickWhileInactive = { [weak self] in
            guard let self, !self.isInert else { return }
            self.onRequestEditing?()
        }

        placeholder.font = Self.fieldFont
        placeholder.lineBreakMode = .byTruncatingTail
        placeholder.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)

        hint.font = .systemFont(ofSize: 11)
        hint.setContentHuggingPriority(.required, for: .horizontal)

        // Constraints rather than a stack view: the hint belongs at the far
        // edge of the field whatever the field's width says, and a stack view
        // packs both at its leading edge the moment the field stops being the
        // stretchy one. The hint and the placeholder both sit on the *first*
        // line — where typing begins, and where they stay when the field grows.
        scroll.translatesAutoresizingMaskIntoConstraints = false
        placeholder.translatesAutoresizingMaskIntoConstraints = false
        hint.translatesAutoresizingMaskIntoConstraints = false
        fieldRow.addSubview(scroll)
        fieldRow.addSubview(placeholder)
        fieldRow.addSubview(hint)
        NSLayoutConstraint.activate([
            scroll.leadingAnchor.constraint(equalTo: fieldRow.leadingAnchor),
            scroll.topAnchor.constraint(equalTo: fieldRow.topAnchor, constant: 4),
            scroll.bottomAnchor.constraint(equalTo: fieldRow.bottomAnchor, constant: -4),
            scroll.trailingAnchor.constraint(equalTo: hint.leadingAnchor, constant: -6),
            fieldHeightConstraint,
            hint.trailingAnchor.constraint(equalTo: fieldRow.trailingAnchor),
            hint.centerYAnchor.constraint(equalTo: scroll.topAnchor, constant: oneLine / 2),
            placeholder.leadingAnchor.constraint(equalTo: scroll.leadingAnchor),
            placeholder.trailingAnchor.constraint(lessThanOrEqualTo: scroll.trailingAnchor),
            placeholder.centerYAnchor.constraint(equalTo: scroll.topAnchor, constant: oneLine / 2),
        ])

        column.orientation = .vertical
        column.alignment = .leading
        column.spacing = 8
        column.translatesAutoresizingMaskIntoConstraints = false
        column.setViews([rule, chips, fieldRow], in: .top)
        column.setCustomSpacing(9, after: rule)
        column.setCustomSpacing(7, after: chips)
        addSubview(column)
        NSLayoutConstraint.activate([
            column.leadingAnchor.constraint(equalTo: leadingAnchor),
            column.trailingAnchor.constraint(equalTo: trailingAnchor),
            column.topAnchor.constraint(equalTo: topAnchor),
            column.bottomAnchor.constraint(equalTo: bottomAnchor),
            rule.widthAnchor.constraint(equalTo: widthAnchor),
            chips.widthAnchor.constraint(lessThanOrEqualTo: widthAnchor),
            // On the grid, like everything else: with no box to pad, the
            // placeholder, the steers and the draft above them all begin on the
            // one line the panel is built on.
            fieldRow.leadingAnchor.constraint(equalTo: leadingAnchor),
            fieldRow.trailingAnchor.constraint(equalTo: trailingAnchor),
        ])
        applyColors()
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("not used") }

    override func viewDidChangeEffectiveAppearance() {
        super.viewDidChangeEffectiveAppearance()
        applyColors()
    }

    /// Puts the caret in the field.
    ///
    /// Deliberately not conditional on the window being key yet: a panel asked
    /// for key status is granted it by the window server, which does not
    /// necessarily answer within the call. Making the field first responder
    /// anyway means the keystrokes arrive at it the moment key does.
    func beginEditing() {
        guard !hasCaret else { return }
        window?.makeFirstResponder(field)
        applyColors()
    }

    /// Re-reads where the caret is and repaints. Called once the window server
    /// has had its moment to grant key status.
    func refreshLook() {
        applyColors()
    }

    /// Whether the field really holds the keyboard.
    ///
    /// Being first responder proves nothing on its own: AppKit can make this
    /// field the panel's initial first responder the moment the overlay is
    /// ordered front, and in a window that is not key it receives nothing.
    /// Treating that as focused would light the focus ring on every draft
    /// and, far worse, tell the event tap to stop claiming Escape and Return.
    var hasCaret: Bool {
        guard let window, window.isKeyWindow else { return false }
        return window.firstResponder === field
    }

    /// The focused look without the focus. Only the overlay's preview hook uses
    /// it: this state cannot otherwise be screenshotted without taking the
    /// keyboard off whoever is using the machine.
    func showEditingLook() {
        previewLook = true
        applyColors()
    }

    /// Puts words in the field as if they had been typed — the preview hook's
    /// way of screenshotting the wrapped and scrolling states, since the real
    /// thing needs the keyboard. Scrolled to the end, which is where a caret
    /// that had just typed this would be.
    func setFieldText(_ text: String) {
        field.string = text
        placeholder.isHidden = !text.isEmpty
        updateFieldHeight()
        field.scrollRangeToVisible(NSRange(location: (text as NSString).length, length: 0))
    }

    /// Gives the field up and empties it. Called both when the user cancels and
    /// when a steer is submitted — a steer that has been applied is shown as a
    /// chip, so leaving it in the field would say it twice.
    func endEditing() {
        field.string = ""
        placeholder.isHidden = false
        updateFieldHeight()
        previewLook = false
        if hasCaret, let window { window.makeFirstResponder(nil) }
        applyColors()
    }

    /// While a rework is in flight there is nothing to steer yet.
    func setEditable(_ editable: Bool) {
        isEditable = editable
        field.isEditable = editable
        field.isSelectable = editable
        applyColors()
    }

    /// Re-measures the text and grows or shrinks the field, within the cap.
    /// Growth is the panel's business too — `onGrowth` is how it hears.
    private func updateFieldHeight() {
        guard let layoutManager = field.layoutManager, let container = field.textContainer
        else { return }
        layoutManager.ensureLayout(for: container)
        let content = layoutManager.usedRect(for: container).height
        let height = Self.fieldHeight(
            content: content, line: lineHeight, spacing: Self.fieldLineSpacing)
        guard fieldHeightConstraint.constant != height else { return }
        fieldHeightConstraint.constant = height
        onGrowth?()
    }

    /// `chipLine`, inked: the words in the secondary ink and every marker in the
    /// accent.
    ///
    /// The markers are what separates this line from the placeholder under it at
    /// a glance. A steer is something the user asked for and it is still in
    /// force, and on this panel that is said in blue.
    private static func chipText(_ guidance: [String]) -> NSAttributedString {
        let line = NSMutableAttributedString(
            string: chipLine(guidance),
            attributes: [
                .font: NSFont.systemFont(ofSize: 11),
                .foregroundColor: OverlayPalette.inkSecondary,
            ])
        // Walked from the parts rather than found by searching the finished
        // line for "·": a steer is the user's own words and may contain one.
        var location = 0
        for part in chipParts(guidance) {
            line.addAttribute(
                .foregroundColor, value: OverlayPalette.blue,
                range: NSRange(location: location, length: 1))
            location += ("· " + part + "  ").utf16.count
        }
        return line
    }

    /// The steers as they are shown, without their markers — the one place the
    /// capping and eliding happens, so the line and its colouring cannot
    /// disagree about where a chip starts.
    nonisolated static func chipParts(_ guidance: [String]) -> [String] {
        let steers = guidance.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        guard !steers.isEmpty else { return [] }
        let shown = steers.suffix(maxChipsShown).map(elide)
        let hidden = steers.count - shown.count
        return (hidden > 0 ? ["+\(hidden)"] : []) + shown
    }

    /// The steers in force, as one quiet line: `· warmer · shorter`.
    ///
    /// Pure, and capped in two directions, because the panel is a HUD at
    /// someone's caret: a user who has steered six times gets a count and the
    /// three that are freshest, and one very long steer is elided rather than
    /// pushing the panel wider than the draft it belongs to.
    nonisolated static func chipLine(_ guidance: [String]) -> String {
        chipParts(guidance).map { "· \($0)" }.joined(separator: "  ")
    }

    private nonisolated static func elide(_ steer: String) -> String {
        guard steer.count > maxChipCharacters else { return steer }
        return steer.prefix(maxChipCharacters - 1).trimmingCharacters(in: .whitespaces) + "…"
    }

    /// No shape is ever painted here: at rest the row is a hairline and a grey
    /// placeholder, and focused it is the same hairline in blue and a darker
    /// placeholder. That is what keeps a panel that is mostly *draft* from
    /// turning into a form — and it keeps the row on the panel's one grid,
    /// which a box drawn round the text cannot be at the same time as the text
    /// inside it.
    private func applyColors() {
        effectiveAppearance.performAsCurrentDrawingAppearance { [self] in
            let editing = isEditing
            chips.attributedStringValue = Self.chipText(guidance)
            chips.isHidden = Self.chipParts(guidance).isEmpty
            // ⇥ is how you get in; ↩ is what sends it. Neither is offered while
            // a rework is running, because neither would do anything.
            hint.stringValue = editing ? "↩" : "⇥"
            hint.textColor = editing ? OverlayPalette.blue : OverlayPalette.inkTertiary
            hint.isHidden = !isEditable
            field.textColor = OverlayPalette.ink
            field.insertionPointColor = OverlayPalette.ink
            placeholder.isHidden = !field.string.isEmpty
            // The invitation steps forward when it is live and recedes again
            // when it is not.
            placeholder.textColor =
                editing ? OverlayPalette.inkSecondary : OverlayPalette.inkTertiary
            rule.isAccented = editing
        }
        onFocusChange?()
    }
}

extension GuidanceRow: NSTextViewDelegate {
    func textDidBeginEditing(_ notification: Notification) {
        applyColors()
    }

    func textDidEndEditing(_ notification: Notification) {
        // On the next pass: the responder chain is still mid-hand-off while
        // this is being delivered, so reading the caret now would say the field
        // is focused a moment after it stopped being.
        DispatchQueue.main.async { [weak self] in
            MainActor.assumeIsolated { self?.applyColors() }
        }
    }

    func textDidChange(_ notification: Notification) {
        placeholder.isHidden = !field.string.isEmpty
        updateFieldHeight()
    }

    /// The keys the field owns while it is being edited. The event tap is told
    /// to claim nothing at all in this state (`MinneKeyController.command`),
    /// precisely so that these arrive here as ordinary text-view commands
    /// rather than as overlay shortcuts.
    func textView(_ textView: NSTextView, doCommandBy selector: Selector) -> Bool {
        switch selector {
        case #selector(NSResponder.insertNewline(_:)):
            // Return submits, however many lines are on screen; the newline is
            // Shift-Return's, handed back to the text view to insert.
            if NSApp.currentEvent?.modifierFlags.contains(.shift) == true { return false }
            let steer = field.string.trimmingCharacters(in: .whitespacesAndNewlines)
            // Return on an empty field is not a steer; it just puts the field
            // away, which is the least surprising thing it can do.
            if steer.isEmpty {
                onCancel?()
            } else {
                onSubmit?(steer)
            }
            return true
        case #selector(NSResponder.cancelOperation(_:)):
            onCancel?()
            return true
        case #selector(NSResponder.insertTab(_:)),
            #selector(NSResponder.insertBacktab(_:)):
            // There is nowhere else to go in this panel, and letting AppKit
            // hunt for a next key view would drop the caret out of the field
            // the user just tabbed into.
            return true
        default:
            return false
        }
    }
}

/// A label that clicks fall through: it sits over the guidance field, and a
/// click on the placeholder has to reach the field it is inviting you into.
private final class ClickThroughLabel: NSTextField {
    override func hitTest(_ point: NSPoint) -> NSView? { nil }
}
