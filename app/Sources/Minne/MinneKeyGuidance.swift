import AppKit

/// The line under the draft where the user says what they want changed.
///
/// It is one text field and nothing else — no label, no button, no border until
/// the caret is in it. A hairline separates it from the draft above, the same
/// hairline the header uses, so the panel keeps its single rule and its single
/// grid. What it is for is said by the placeholder, and the placeholder is a
/// worked example rather than a noun: "shorter, warmer, mention…" is the whole
/// instruction manual.
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
    /// Return in the field: steer the draft with this text.
    var onSubmit: (@MainActor (String) -> Void)?
    /// Escape in the field: stop editing, and leave the draft as it is.
    var onCancel: (@MainActor () -> Void)?

    /// How many steers are shown before the line starts counting instead.
    nonisolated static let maxChipsShown = 3
    /// How long one steer may be before it is elided in the chip line.
    nonisolated static let maxChipCharacters = 34

    private let rule = OverlayRule(frame: .zero)
    private let chips = NSTextField(labelWithString: "")
    private let field = GuidanceTextField(frame: .zero)
    private let hint = NSTextField(labelWithString: "⇥")
    /// Draws the focus ring. Layer-backed and painted by hand, because a stock
    /// focus ring in a panel that is only briefly key looks like a mistake.
    private let box = NSView()
    private let column = NSStackView()

    /// Whether the row is drawn as focused.
    ///
    /// Derived from where the caret actually is rather than from a flag set
    /// when editing was *asked for*: key status arrives from the window server
    /// a beat later and the field editor is torn down and rebuilt on the way,
    /// so a remembered flag ends up disagreeing with the blinking caret the
    /// user can see. `previewLook` is the one exception, for the screenshot
    /// hook that has no keyboard to take.
    var isEditing: Bool { previewLook || hasCaret }

    private var previewLook = false

    /// The steers in force, oldest first.
    var guidance: [String] = [] {
        didSet {
            chips.stringValue = Self.chipLine(guidance)
            chips.isHidden = chips.stringValue.isEmpty
        }
    }

    override init(frame frameRect: NSRect) {
        super.init(frame: frameRect)

        // A caption rather than a second line of the field: a shade smaller
        // than the placeholder under it, so the two grey lines read as what has
        // been applied and where to say more, not as one grey paragraph.
        chips.font = .systemFont(ofSize: 10.5)
        chips.textColor = OverlayPalette.inkTertiary
        chips.lineBreakMode = .byTruncatingTail
        chips.isHidden = true

        field.delegate = self
        field.isBordered = false
        field.isBezeled = false
        field.drawsBackground = false
        field.focusRingType = .none
        field.font = .systemFont(ofSize: 11.5)
        field.cell?.usesSingleLineMode = true
        field.cell?.wraps = false
        field.cell?.isScrollable = true
        field.onClickWhileInactive = { [weak self] in self?.onRequestEditing?() }

        hint.font = .systemFont(ofSize: 10.5)
        hint.textColor = OverlayPalette.inkTertiary
        hint.setContentHuggingPriority(.required, for: .horizontal)

        box.wantsLayer = true
        box.layer?.cornerRadius = 7
        box.layer?.cornerCurve = .continuous
        box.layer?.borderWidth = 1
        // Constraints rather than a stack view: the hint belongs at the far
        // edge of the field whatever the field's intrinsic width says, and a
        // stack view packs both at its leading edge the moment the field stops
        // being the stretchy one.
        field.translatesAutoresizingMaskIntoConstraints = false
        hint.translatesAutoresizingMaskIntoConstraints = false
        box.addSubview(field)
        box.addSubview(hint)
        field.setContentHuggingPriority(.defaultLow, for: .horizontal)
        field.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
        NSLayoutConstraint.activate([
            field.leadingAnchor.constraint(equalTo: box.leadingAnchor, constant: 7),
            field.topAnchor.constraint(equalTo: box.topAnchor, constant: 4),
            field.bottomAnchor.constraint(equalTo: box.bottomAnchor, constant: -4),
            field.trailingAnchor.constraint(equalTo: hint.leadingAnchor, constant: -6),
            hint.trailingAnchor.constraint(equalTo: box.trailingAnchor, constant: -7),
            hint.centerYAnchor.constraint(equalTo: field.centerYAnchor),
        ])

        column.orientation = .vertical
        column.alignment = .leading
        column.spacing = 8
        column.translatesAutoresizingMaskIntoConstraints = false
        column.setViews([rule, chips, box], in: .top)
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
            // The box is inset by its own padding rather than sitting at the
            // grid line: the *text* inside it then lands where every other line
            // of type in the panel does.
            box.leadingAnchor.constraint(equalTo: leadingAnchor, constant: -7),
            box.trailingAnchor.constraint(equalTo: trailingAnchor, constant: 7),
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
    /// anyway installs the field editor, and the keystrokes arrive at it the
    /// moment key does.
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
    /// Both halves are needed. AppKit makes this field the panel's initial
    /// first responder — field editor and all — the moment the overlay is
    /// ordered front, so being first responder proves nothing on its own: in a
    /// window that is not key that editor receives nothing, and treating it as
    /// focused would light the focus ring on every draft and, far worse, tell
    /// the event tap to stop claiming Escape and Return. And the first
    /// responder of a window whose text field *is* being edited is the field
    /// editor — an `NSTextView` this field is the delegate of — not the field.
    var hasCaret: Bool {
        guard let window, window.isKeyWindow, let responder = window.firstResponder as AnyObject?
        else { return false }
        if responder === field { return true }
        return (responder as? NSTextView)?.delegate === field
    }

    /// The focused look without the focus. Only the overlay's preview hook uses
    /// it: this state cannot otherwise be screenshotted without taking the
    /// keyboard off whoever is using the machine.
    func showEditingLook() {
        previewLook = true
        applyColors()
    }

    /// Gives the field up and empties it. Called both when the user cancels and
    /// when a steer is submitted — a steer that has been applied is shown as a
    /// chip, so leaving it in the field would say it twice.
    func endEditing() {
        field.stringValue = ""
        previewLook = false
        if hasCaret, let window { window.makeFirstResponder(nil) }
        applyColors()
    }

    /// While a rework is in flight there is nothing to steer yet.
    func setEditable(_ editable: Bool) {
        field.isEditable = editable
        field.isSelectable = editable
    }

    /// The steers in force, as one quiet line: `· warmer · shorter`.
    ///
    /// Pure, and capped in two directions, because the panel is a HUD at
    /// someone's caret: a user who has steered six times gets a count and the
    /// three that are freshest, and one very long steer is elided rather than
    /// pushing the panel wider than the draft it belongs to.
    nonisolated static func chipLine(_ guidance: [String]) -> String {
        let steers = guidance.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        guard !steers.isEmpty else { return "" }
        let shown = steers.suffix(maxChipsShown).map(elide)
        let hidden = steers.count - shown.count
        let head = hidden > 0 ? ["+\(hidden)"] : []
        return (head + shown).map { "· \($0)" }.joined(separator: "  ")
    }

    private nonisolated static func elide(_ steer: String) -> String {
        guard steer.count > maxChipCharacters else { return steer }
        return steer.prefix(maxChipCharacters - 1).trimmingCharacters(in: .whitespaces) + "…"
    }

    /// Nothing is painted until the caret is in the field: at rest the row is a
    /// hairline and a grey placeholder, which is what keeps a panel that is
    /// mostly *draft* from turning into a form.
    private func applyColors() {
        effectiveAppearance.performAsCurrentDrawingAppearance { [self] in
            chips.textColor = OverlayPalette.inkTertiary
            hint.textColor = OverlayPalette.inkTertiary
            hint.isHidden = isEditing
            field.textColor = OverlayPalette.ink
            field.placeholderAttributedString = NSAttributedString(
                string: "Guide it — shorter, warmer, mention…",
                attributes: [
                    .font: NSFont.systemFont(ofSize: 11.5),
                    .foregroundColor: OverlayPalette.inkTertiary,
                ])
            box.layer?.borderColor =
                isEditing ? OverlayPalette.blue.cgColor : NSColor.clear.cgColor
            box.layer?.backgroundColor =
                isEditing ? OverlayPalette.blueWash.cgColor : NSColor.clear.cgColor
        }
    }
}

extension GuidanceRow: NSTextFieldDelegate {
    func controlTextDidBeginEditing(_ notification: Notification) {
        applyColors()
    }

    func controlTextDidEndEditing(_ notification: Notification) {
        // On the next pass: the field editor is still the first responder while
        // this is being delivered, so reading the caret now would say the field
        // is focused a moment after it stopped being.
        DispatchQueue.main.async { [weak self] in
            MainActor.assumeIsolated { self?.applyColors() }
        }
    }

    /// The two keys the field owns while it is being edited. The event tap is
    /// told to claim nothing at all in this state (`MinneKeyController.command`),
    /// precisely so that these arrive here as ordinary text-field commands
    /// rather than as overlay shortcuts.
    func control(
        _ control: NSControl, textView: NSTextView, doCommandBy selector: Selector
    ) -> Bool {
        switch selector {
        case #selector(NSResponder.insertNewline(_:)):
            let steer = field.stringValue.trimmingCharacters(in: .whitespacesAndNewlines)
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

/// The field itself, in a window that is usually not key.
///
/// A text field in a non-key window cannot get a field editor, so an ordinary
/// `mouseDown` there does nothing at all — the click has to become a request to
/// the presenter to borrow key status first. Once the panel is key it is an
/// ordinary text field again.
private final class GuidanceTextField: NSTextField {
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
