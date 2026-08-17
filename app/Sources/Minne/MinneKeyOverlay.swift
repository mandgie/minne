import AppKit
import QuartzCore

/// What the overlay is showing. One value for the whole life of a press:
/// drafting, what the draft says, that it went in, or why it did not.
enum MinneKeyOverlayState: Equatable, Sendable {
    /// The model is working. Carries the mode so the user can see, before the
    /// draft arrives, that Minne read their intent the way they meant it.
    case working(DraftMode)
    /// The draft is reading memory; `tool` is the tool's name.
    case consulting(DraftMode, tool: String)
    /// The finished draft, waiting for the user to accept it.
    case result(String)
    /// It is in the field.
    case inserted(InsertionMethod)
    /// It is back out of the field.
    case undone
    case failed(String)

    /// Whether Minne is still waiting on the model — what the thinking
    /// indicator animates for.
    var isThinking: Bool {
        switch self {
        case .working, .consulting: return true
        default: return false
        }
    }
}

/// What the user asked the overlay for. The controller owns every one of these
/// verbs; the panel only reports that a button was pressed.
enum MinneKeyAction: Equatable, Sendable {
    case insert
    case copy
    case undo
    /// Try the thing that just failed again — the insertion when there is a
    /// draft to put in, the draft itself when there is not.
    case retry
    case dismiss
}

/// The overlay, as `MinneKeyController` needs it. A protocol so the
/// controller's rules — when it appears, what dismisses it, what each state
/// offers — can be tested without a window server.
@MainActor
protocol MinneKeyPresenting: AnyObject {
    var isPresenting: Bool { get }
    var state: MinneKeyOverlayState? { get }
    /// Pressed buttons arrive here.
    var onAction: (@MainActor (MinneKeyAction) -> Void)? { get set }
    func present(_ target: CaretTarget, state: MinneKeyOverlayState)
    func update(_ state: MinneKeyOverlayState)
    func dismiss()
    /// Whether a screen point (Quartz coordinates, as event taps report them)
    /// falls inside the overlay.
    func contains(quartzPoint: CGPoint) -> Bool
}

/// Borderless panel that appears at the caret.
///
/// Two properties matter more than anything it draws. It is
/// `.nonactivatingPanel` and refuses to become key, so the app the user is
/// typing in **keeps focus** — the whole feature is about drafting into that
/// field, and a panel that stole focus would lose the caret it is anchored to.
/// And it is `.canJoinAllSpaces`, so it appears wherever the user is, including
/// over a fullscreen app, without the ordering dance the chat window needs.
private final class MinneKeyOverlayPanel: NSPanel {
    override var canBecomeKey: Bool { false }
    override var canBecomeMain: Bool { false }
}

/// The panel's background: the system's own material, rounded, with a hairline
/// edge so it still reads as a surface against a white page.
///
/// The border is re-resolved on every appearance change: a `CGColor` is a
/// resolved colour and not a dynamic one, so a layer painted once in light mode
/// keeps that exact grey when the Mac turns dark.
private final class OverlayChromeView: NSVisualEffectView {
    static let cornerRadius: CGFloat = 14

    override init(frame frameRect: NSRect) {
        super.init(frame: frameRect)
        // `.popover` rather than `.hudWindow`: HUD is dark in both appearances,
        // and this panel sits inside the user's document, not over a video.
        material = .popover
        blendingMode = .behindWindow
        state = .active
        wantsLayer = true
        layer?.cornerRadius = Self.cornerRadius
        layer?.cornerCurve = .continuous
        layer?.masksToBounds = true
        layer?.borderWidth = 1
        applyBorderColor()
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("not used") }

    override func viewDidChangeEffectiveAppearance() {
        super.viewDidChangeEffectiveAppearance()
        applyBorderColor()
    }

    private func applyBorderColor() {
        effectiveAppearance.performAsCurrentDrawingAppearance {
            layer?.borderColor = NSColor.separatorColor.cgColor
        }
    }
}

/// Three dots that breathe while the model is writing.
///
/// Core Animation rather than a timer: the animation runs on the render server,
/// so nothing is laid out or drawn on the main thread while it plays — which
/// matters here more than usual, because that same thread is carrying the
/// user's keystrokes through the event tap.
@MainActor
final class ThinkingDots: NSView {
    private static let dotSize: CGFloat = 5
    private static let gap: CGFloat = 4
    private static let period: CFTimeInterval = 0.62

    private var dots: [CALayer] = []

    override init(frame frameRect: NSRect) {
        super.init(frame: frameRect)
        wantsLayer = true
        dots = (0..<3).map { _ in
            let dot = CALayer()
            dot.cornerRadius = Self.dotSize / 2
            dot.opacity = 0.3
            layer?.addSublayer(dot)
            return dot
        }
        applyColors()
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("not used") }

    override var intrinsicContentSize: NSSize {
        NSSize(width: Self.dotSize * 3 + Self.gap * 2, height: Self.dotSize)
    }

    override func layout() {
        super.layout()
        let y = (bounds.height - Self.dotSize) / 2
        for (index, dot) in dots.enumerated() {
            dot.frame = CGRect(
                x: CGFloat(index) * (Self.dotSize + Self.gap), y: y,
                width: Self.dotSize, height: Self.dotSize)
        }
    }

    override func viewDidChangeEffectiveAppearance() {
        super.viewDidChangeEffectiveAppearance()
        applyColors()
    }

    private func applyColors() {
        effectiveAppearance.performAsCurrentDrawingAppearance { [dots] in
            for dot in dots { dot.backgroundColor = NSColor.controlAccentColor.cgColor }
        }
    }

    func start() {
        guard dots.first?.animation(forKey: "pulse") == nil else { return }
        let now = CACurrentMediaTime()
        for (index, dot) in dots.enumerated() {
            let pulse = CABasicAnimation(keyPath: "opacity")
            pulse.fromValue = 0.25
            pulse.toValue = 1.0
            pulse.duration = Self.period
            pulse.autoreverses = true
            pulse.repeatCount = .infinity
            pulse.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
            // Staggered, so the row reads as a wave rather than a blink.
            pulse.beginTime = now + Double(index) * (Self.period / 3)
            dot.add(pulse, forKey: "pulse")
        }
    }

    func stop() {
        for dot in dots { dot.removeAnimation(forKey: "pulse") }
    }
}

/// The draft's own surface: a soft, bordered card behind the one paragraph of
/// prose the panel shows.
///
/// A plain layer-backed view rather than an `NSBox`, which lays its content view
/// out by frame — a wrapping label inside one measures as nothing at all and the
/// card collapses (verified: the draft simply did not appear).
private final class DraftCard: NSView {
    static let padding: CGFloat = 11

    init(content: NSView) {
        super.init(frame: .zero)
        wantsLayer = true
        layer?.cornerRadius = 9
        layer?.cornerCurve = .continuous
        layer?.borderWidth = 1
        content.translatesAutoresizingMaskIntoConstraints = false
        addSubview(content)
        NSLayoutConstraint.activate([
            content.leadingAnchor.constraint(equalTo: leadingAnchor, constant: Self.padding),
            content.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -Self.padding),
            content.topAnchor.constraint(equalTo: topAnchor, constant: Self.padding - 2),
            content.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -(Self.padding - 2)),
        ])
        applyColors()
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("not used") }

    override func viewDidChangeEffectiveAppearance() {
        super.viewDidChangeEffectiveAppearance()
        applyColors()
    }

    private func applyColors() {
        effectiveAppearance.performAsCurrentDrawingAppearance {
            layer?.backgroundColor = NSColor.textBackgroundColor.withAlphaComponent(0.5).cgColor
            layer?.borderColor = NSColor.separatorColor.cgColor
        }
    }
}

/// Three bars where the draft will be, with a highlight sweeping across them.
///
/// It is the same box the finished draft appears in, which is the point: the
/// panel takes its shape the moment it opens and then fills in, rather than
/// jumping a hundred points when the model answers. The sweep is a gradient
/// mask animated on the render server — no timer, no redraw, nothing on the
/// thread that is carrying the user's keystrokes.
private final class ShimmerLines: NSView {
    private static let barHeight: CGFloat = 9
    private static let gap: CGFloat = 7
    /// Ragged ends, so it reads as a paragraph rather than a progress bar.
    private static let widths: [CGFloat] = [1.0, 0.93, 0.6]
    private static let sweep: CFTimeInterval = 1.5

    private let bars: [CALayer]
    private let sweepMask = CAGradientLayer()

    override init(frame frameRect: NSRect) {
        bars = Self.widths.map { _ in
            let bar = CALayer()
            bar.cornerRadius = Self.barHeight / 2
            return bar
        }
        super.init(frame: frameRect)
        wantsLayer = true
        for bar in bars { layer?.addSublayer(bar) }

        sweepMask.startPoint = CGPoint(x: 0, y: 0.5)
        sweepMask.endPoint = CGPoint(x: 1, y: 0.5)
        sweepMask.colors = [
            NSColor.black.withAlphaComponent(0.45).cgColor,
            NSColor.black.cgColor,
            NSColor.black.withAlphaComponent(0.45).cgColor,
        ]
        sweepMask.locations = [0, 0.2, 0.4]
        layer?.mask = sweepMask
        applyColors()
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("not used") }

    /// Top-down, so the ragged last line is at the bottom where a paragraph's
    /// is — an unflipped view would lay the widths out upside down.
    override var isFlipped: Bool { true }

    override var intrinsicContentSize: NSSize {
        NSSize(
            width: NSView.noIntrinsicMetric,
            height: Self.barHeight * CGFloat(Self.widths.count)
                + Self.gap * CGFloat(Self.widths.count - 1))
    }

    override func layout() {
        super.layout()
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        for (index, bar) in bars.enumerated() {
            bar.frame = CGRect(
                x: 0, y: CGFloat(index) * (Self.barHeight + Self.gap),
                width: bounds.width * Self.widths[index], height: Self.barHeight)
        }
        sweepMask.frame = bounds
        CATransaction.commit()
    }

    override func viewDidChangeEffectiveAppearance() {
        super.viewDidChangeEffectiveAppearance()
        applyColors()
    }

    private func applyColors() {
        effectiveAppearance.performAsCurrentDrawingAppearance { [bars] in
            let ink = NSColor.labelColor.withAlphaComponent(0.16).cgColor
            for bar in bars { bar.backgroundColor = ink }
        }
    }

    func start() {
        guard sweepMask.animation(forKey: "sweep") == nil else { return }
        let sweep = CABasicAnimation(keyPath: "locations")
        sweep.fromValue = [-0.4, -0.2, 0]
        sweep.toValue = [1.0, 1.2, 1.4]
        sweep.duration = Self.sweep
        sweep.repeatCount = .infinity
        sweep.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
        sweepMask.add(sweep, forKey: "sweep")
    }

    func stop() {
        sweepMask.removeAnimation(forKey: "sweep")
    }
}

/// A button in a window that is never key, drawn rather than bezelled.
///
/// Two reasons it paints itself. `acceptsFirstMouse` is the first: without it
/// the opening click on a panel belonging to an inactive app is swallowed as an
/// activation click, so every button would need pressing twice — and the second
/// press would arrive after the app underneath had already lost focus.
///
/// The second is that a stock `NSButton` in an app that is never active always
/// draws in its inactive state: `bezelColor` is ignored and an accent-tinted
/// primary comes out the same flat grey as everything beside it. Painting a
/// capsule ourselves is what makes Insert look like the thing to press.
private final class OverlayButton: NSButton {
    /// Text at the end of a title, dimmer than the label: the key that does the
    /// same thing.
    let hint: String?
    /// Kept because assigning `attributedTitle` overwrites `title` with the
    /// whole rendered string — building the next title from `title` would
    /// append the key hint again, and again.
    private let label: String
    private let isPrimary: Bool
    private var isHovered = false

    private static let height: CGFloat = 23
    private static let horizontalPadding: CGFloat = 12

    init(label: String, hint: String?, isPrimary: Bool, target: AnyObject, action: Selector) {
        self.hint = hint
        self.label = label
        self.isPrimary = isPrimary
        super.init(frame: .zero)
        self.target = target
        self.action = action
        isBordered = false
        wantsLayer = true
        layer?.cornerRadius = Self.height / 2
        layer?.cornerCurve = .continuous
        attributedTitle = titleText()
        applyColors()
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("not used") }

    override var intrinsicContentSize: NSSize {
        NSSize(
            width: ceil(attributedTitle.size().width) + Self.horizontalPadding * 2,
            height: Self.height)
    }

    override func acceptsFirstMouse(for event: NSEvent?) -> Bool { true }

    override var isHighlighted: Bool {
        didSet { applyColors() }
    }

    override func updateTrackingAreas() {
        super.updateTrackingAreas()
        for area in trackingAreas { removeTrackingArea(area) }
        addTrackingArea(
            NSTrackingArea(
                rect: bounds, options: [.mouseEnteredAndExited, .activeAlways], owner: self))
    }

    override func mouseEntered(with event: NSEvent) {
        isHovered = true
        applyColors()
    }

    override func mouseExited(with event: NSEvent) {
        isHovered = false
        applyColors()
    }

    override func viewDidChangeEffectiveAppearance() {
        super.viewDidChangeEffectiveAppearance()
        attributedTitle = titleText()
        applyColors()
    }

    private func titleText() -> NSAttributedString {
        let text = NSMutableAttributedString(
            string: label,
            attributes: [
                .font: NSFont.systemFont(ofSize: 11.5, weight: isPrimary ? .semibold : .regular),
                .foregroundColor: isPrimary ? NSColor.white : NSColor.labelColor,
            ])
        if let hint {
            text.append(
                NSAttributedString(
                    string: "  \(hint)",
                    attributes: [
                        .font: NSFont.systemFont(ofSize: 11),
                        .foregroundColor: isPrimary
                            ? NSColor.white.withAlphaComponent(0.75)
                            : NSColor.secondaryLabelColor,
                    ]))
        }
        return text
    }

    /// A `CGColor` is resolved, not dynamic, so every colour here is re-read
    /// whenever the appearance, the hover or the press changes.
    private func applyColors() {
        effectiveAppearance.performAsCurrentDrawingAppearance { [self] in
            let base: NSColor =
                isPrimary ? .controlAccentColor : NSColor.labelColor.withAlphaComponent(0.09)
            let lift: CGFloat = isHighlighted ? -0.12 : (isHovered ? 0.06 : 0)
            layer?.backgroundColor = Self.adjusted(base, by: lift).cgColor
        }
    }

    /// Hover lightens and a press darkens, by the same small amount for the
    /// accent capsule and the quiet ones.
    private static func adjusted(_ color: NSColor, by amount: CGFloat) -> NSColor {
        guard amount != 0 else { return color }
        return amount > 0
            ? color.blended(withFraction: amount, of: .white) ?? color
            : color.blended(withFraction: -amount, of: .black) ?? color
    }
}

/// The overlay's contents: who is speaking, what is happening, the draft when
/// there is one, and the buttons that state offers.
@MainActor
final class MinneKeyOverlayView: NSView {
    /// The panel's width, less the column's insets. A wrapping label needs to
    /// be told the width it may wrap at before it has one.
    static let contentWidth: CGFloat = 340
    /// Characters of draft shown before the preview elides. A long draft is
    /// still inserted whole — this is a HUD at someone's caret, not a document
    /// view. Elided by hand rather than by `lineBreakMode`: a wrapping label
    /// asked to truncate stops wrapping and puts the whole draft on one line.
    static let maxPreviewCharacters = 600
    /// Room around the column.
    static let inset = NSSize(width: 16, height: 13)

    var onAction: (@MainActor (MinneKeyAction) -> Void)?

    private let spark = NSImageView()
    private let title = NSTextField(labelWithString: "Minne")
    private let app = NSTextField(labelWithString: "")
    private let dots = ThinkingDots(frame: .zero)
    private let warning = NSImageView()
    private let status = NSTextField(labelWithString: "")
    private let draft = NSTextField(wrappingLabelWithString: "")
    private lazy var card = DraftCard(content: draft)
    private let shimmer = ShimmerLines(frame: .zero)
    private lazy var thinkingCard = DraftCard(content: shimmer)
    private let buttons = NSStackView()
    private let column = NSStackView()

    override init(frame frameRect: NSRect) {
        super.init(frame: frameRect)
        buildHeader()
        buildBody()

        column.orientation = .vertical
        column.alignment = .leading
        column.spacing = 9
        column.translatesAutoresizingMaskIntoConstraints = false
        addSubview(column)
        NSLayoutConstraint.activate([
            column.leadingAnchor.constraint(equalTo: leadingAnchor, constant: Self.inset.width),
            column.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -Self.inset.width),
            column.topAnchor.constraint(equalTo: topAnchor, constant: Self.inset.height),
            column.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -Self.inset.height),
        ])
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("not used") }

    /// The spark, the name, and the app being written into.
    private func buildHeader() {
        spark.image = NSImage(systemSymbolName: "sparkle", accessibilityDescription: "Minne")
        spark.symbolConfiguration = NSImage.SymbolConfiguration(pointSize: 12, weight: .semibold)
        spark.contentTintColor = .controlAccentColor
        spark.setContentHuggingPriority(.required, for: .horizontal)

        title.font = .systemFont(ofSize: 12.5, weight: .semibold)
        title.textColor = .labelColor
        app.font = .systemFont(ofSize: 11.5)
        app.textColor = .tertiaryLabelColor
        app.lineBreakMode = .byTruncatingTail
        app.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
    }

    private func buildBody() {
        warning.image = NSImage(
            systemSymbolName: "exclamationmark.triangle.fill", accessibilityDescription: nil)
        warning.symbolConfiguration = NSImage.SymbolConfiguration(pointSize: 10, weight: .semibold)
        warning.contentTintColor = .systemOrange
        warning.setContentHuggingPriority(.required, for: .horizontal)

        status.font = .systemFont(ofSize: 11.5)
        status.textColor = .secondaryLabelColor
        status.lineBreakMode = .byWordWrapping
        status.maximumNumberOfLines = 3
        status.preferredMaxLayoutWidth = Self.contentWidth - 18

        draft.isSelectable = true
        // A wrapping label with no width yet lays out on one endless line, and
        // the panel then reports a fitting size wider than the screen. Telling
        // it the width up front is what makes the draft wrap.
        draft.preferredMaxLayoutWidth = Self.contentWidth - DraftCard.padding * 2

        buttons.orientation = .horizontal
        buttons.alignment = .centerY
        buttons.spacing = 7

        let name = NSStackView(views: [spark, title, app])
        name.orientation = .horizontal
        name.alignment = .centerY
        name.spacing = 6
        // The dots sit at the far end of the header, so how the model is doing
        // is always in the same place, whatever the panel is saying below.
        let spacer = NSView()
        spacer.setContentHuggingPriority(.defaultLow, for: .horizontal)
        let header = NSStackView(views: [name, spacer, dots])
        header.orientation = .horizontal
        header.alignment = .centerY
        header.spacing = 8

        let statusRow = NSStackView(views: [warning, status])
        statusRow.orientation = .horizontal
        statusRow.alignment = .firstBaseline
        statusRow.spacing = 5

        column.setViews([header, statusRow, thinkingCard, card, buttons], in: .top)
        NSLayoutConstraint.activate([
            header.widthAnchor.constraint(equalToConstant: Self.contentWidth),
            card.widthAnchor.constraint(equalToConstant: Self.contentWidth),
            thinkingCard.widthAnchor.constraint(equalToConstant: Self.contentWidth),
            statusRow.widthAnchor.constraint(lessThanOrEqualToConstant: Self.contentWidth),
        ])
    }

    func render(_ target: CaretTarget, state: MinneKeyOverlayState) {
        app.stringValue = target.appName
        render(state)
    }

    func render(_ state: MinneKeyOverlayState) {
        switch state {
        case .working(let mode):
            show(status: mode.progressLabel, state: state, draft: nil, actions: [.dismiss])
        case .consulting(_, let tool):
            show(status: Self.toolLabel(tool), state: state, draft: nil, actions: [.dismiss])
        case .result(let text):
            show(
                status: "Draft ready", state: state, draft: text,
                actions: [.insert, .copy, .dismiss])
        case .inserted(let method):
            show(
                status: "Inserted with \(method.label)", state: state, draft: nil,
                actions: [.undo, .dismiss])
        case .undone:
            show(
                status: "Undone — the field is as it was", state: state, draft: nil,
                actions: [.dismiss])
        case .failed(let message):
            show(status: message, state: state, draft: nil, actions: [.retry, .dismiss])
        }
    }

    /// "Searching your memory…" rather than the tool's name: the user is waiting
    /// on a sentence, not reading a trace.
    private static func toolLabel(_ tool: String) -> String {
        switch tool {
        case "search_memory": return "Searching your memory…"
        case "read_page", "list_index": return "Reading your memory…"
        default: return "Working…"
        }
    }

    private func show(
        status text: String, state: MinneKeyOverlayState, draft body: String?,
        actions: [MinneKeyAction]
    ) {
        let failed: Bool
        if case .failed = state { failed = true } else { failed = false }

        status.stringValue = text
        status.textColor = failed ? .labelColor : .secondaryLabelColor
        warning.isHidden = !failed

        if state.isThinking { dots.start() } else { dots.stop() }
        dots.isHidden = !state.isThinking
        // The draft's box is there from the first moment, shimmering, and the
        // draft lands in it — rather than the panel doubling in height when the
        // model answers.
        if state.isThinking { shimmer.start() } else { shimmer.stop() }
        thinkingCard.isHidden = !state.isThinking

        draft.attributedStringValue =
            body.map { Self.body(Self.preview($0)) } ?? NSAttributedString()
        card.isHidden = body == nil

        buttons.setViews(actions.map(button(for:)), in: .leading)
        buttons.isHidden = actions.isEmpty
    }

    /// The draft, set with a little air between its lines — it is the one
    /// paragraph of prose in the panel and the thing being judged.
    private static func body(_ text: String) -> NSAttributedString {
        let paragraph = NSMutableParagraphStyle()
        paragraph.lineSpacing = 2.5
        return NSAttributedString(
            string: text,
            attributes: [
                .font: NSFont.systemFont(ofSize: 12.5),
                .foregroundColor: NSColor.labelColor,
                .paragraphStyle: paragraph,
            ])
    }

    /// The draft as the panel shows it: whole, or elided with what is missing
    /// said out loud rather than silently cut.
    static func preview(_ draft: String) -> String {
        guard draft.count > maxPreviewCharacters else { return draft }
        let shown = draft.prefix(maxPreviewCharacters)
        let rest = draft.count - shown.count
        return "\(shown)…\n\n[\(rest) more characters — Insert takes all of it]"
    }

    private func button(for action: MinneKeyAction) -> NSButton {
        // One accent, on the one thing the user most likely came for. The rest
        // stay quiet, which is what makes it read as the primary at all.
        let button = OverlayButton(
            label: Self.buttonTitle(action), hint: Self.buttonHint(action),
            isPrimary: Self.isPrimary(action), target: self,
            action: #selector(buttonPressed(_:)))
        button.tag = Self.tag(action)
        return button
    }

    private static func isPrimary(_ action: MinneKeyAction) -> Bool {
        action == .insert || action == .retry
    }

    private static func buttonTitle(_ action: MinneKeyAction) -> String {
        switch action {
        case .insert: return "Insert"
        case .copy: return "Copy"
        case .undo: return "Undo"
        case .retry: return "Retry"
        case .dismiss: return "Dismiss"
        }
    }

    /// The key that does the same thing, where there is one.
    private static func buttonHint(_ action: MinneKeyAction) -> String? {
        switch action {
        case .insert: return "↩"
        case .undo: return "⌘Z"
        case .dismiss: return "esc"
        case .copy, .retry: return nil
        }
    }

    private static func tag(_ action: MinneKeyAction) -> Int {
        switch action {
        case .insert: return 1
        case .copy: return 2
        case .undo: return 3
        case .dismiss: return 4
        case .retry: return 5
        }
    }

    private static func action(tag: Int) -> MinneKeyAction? {
        switch tag {
        case 1: return .insert
        case 2: return .copy
        case 3: return .undo
        case 4: return .dismiss
        case 5: return .retry
        default: return nil
        }
    }

    @objc private func buttonPressed(_ sender: NSButton) {
        guard let action = Self.action(tag: sender.tag) else { return }
        onAction?(action)
    }
}

@MainActor
final class MinneKeyOverlayController: MinneKeyPresenting {
    /// Fade in, fade out, and settle into a new size. Short enough that the
    /// panel is never something the user waits for.
    private static let appearDuration: TimeInterval = 0.15
    private static let disappearDuration: TimeInterval = 0.11
    private static let resizeDuration: TimeInterval = 0.13
    /// How far the panel rises as it appears.
    private static let rise: CGFloat = 6

    private let panel: MinneKeyOverlayPanel
    private let content: MinneKeyOverlayView
    /// The caret this overlay is anchored to, in AppKit coordinates, kept so a
    /// state change can re-place a panel that just changed size.
    private var caret: CGRect = .zero
    /// Ours rather than `panel.isVisible`, because the panel outlives its
    /// dismissal by the length of the fade — and a press during that fade must
    /// be a fresh presentation, not a toggle of a panel already on its way out.
    private var presenting = false

    private(set) var state: MinneKeyOverlayState?

    var onAction: (@MainActor (MinneKeyAction) -> Void)? {
        get { content.onAction }
        set { content.onAction = newValue }
    }

    init() {
        panel = MinneKeyOverlayPanel(
            contentRect: NSRect(x: 0, y: 0, width: 372, height: 44),
            styleMask: [.borderless, .nonactivatingPanel],
            backing: .buffered,
            defer: false)

        let chrome = OverlayChromeView(frame: .zero)
        content = MinneKeyOverlayView(frame: .zero)
        content.translatesAutoresizingMaskIntoConstraints = false
        chrome.addSubview(content)
        NSLayoutConstraint.activate([
            content.leadingAnchor.constraint(equalTo: chrome.leadingAnchor),
            content.trailingAnchor.constraint(equalTo: chrome.trailingAnchor),
            content.topAnchor.constraint(equalTo: chrome.topAnchor),
            content.bottomAnchor.constraint(equalTo: chrome.bottomAnchor),
        ])

        panel.contentView = chrome
        panel.isOpaque = false
        panel.backgroundColor = .clear
        panel.hasShadow = true
        panel.isFloatingPanel = true
        panel.hidesOnDeactivate = false
        panel.isReleasedWhenClosed = false
        // Above ordinary windows but below menus and the status bar.
        panel.level = .floating
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .stationary]
        // Nothing here is a drag target and the panel never activates; without
        // this a click at its edge could still start a window drag.
        panel.isMovable = false
    }

    var isPresenting: Bool { presenting }

    func present(_ target: CaretTarget, state: MinneKeyOverlayState) {
        self.state = state
        presenting = true
        content.render(target, state: state)
        caret = OverlayPlacement.flipped(
            target.anchor.rect, primaryHeight: Self.primaryScreenHeight())

        let frame = place(animated: false)
        // A short rise from just below where it settles: it reads as the panel
        // arriving at the caret rather than being switched on.
        panel.setFrame(frame.offsetBy(dx: 0, dy: -Self.rise), display: false)
        panel.alphaValue = 0
        // `orderFrontRegardless`, never `makeKeyAndOrderFront`: the second would
        // pull focus away from the field the overlay is pointing at, and Minne
        // is an accessory app that is not even active.
        panel.orderFrontRegardless()
        NSAnimationContext.runAnimationGroup { context in
            context.duration = Self.appearDuration
            context.timingFunction = CAMediaTimingFunction(name: .easeOut)
            panel.animator().alphaValue = 1
            panel.animator().setFrame(frame, display: true)
        }
    }

    func update(_ state: MinneKeyOverlayState) {
        guard presenting else { return }
        self.state = state
        content.render(state)
        place(animated: true)
    }

    func dismiss() {
        state = nil
        guard presenting else { return }
        presenting = false
        NSAnimationContext.runAnimationGroup { context in
            context.duration = Self.disappearDuration
            context.timingFunction = CAMediaTimingFunction(name: .easeIn)
            panel.animator().alphaValue = 0
        } completionHandler: { [panel] in
            MainActor.assumeIsolated {
                // Only if nothing has presented over the top of it since.
                guard panel.alphaValue == 0 else { return }
                panel.orderOut(nil)
            }
        }
    }

    func contains(quartzPoint: CGPoint) -> Bool {
        guard presenting else { return false }
        let point = CGPoint(
            x: quartzPoint.x, y: Self.primaryScreenHeight() - quartzPoint.y)
        return panel.frame.contains(point)
    }

    /// Re-measures and re-places. Called on every state change because the
    /// panel grows by the height of a draft and has to stay next to the caret
    /// while it does — animated once it is on screen, so a draft arriving
    /// unfolds rather than jumps.
    @discardableResult
    private func place(animated: Bool) -> NSRect {
        panel.contentView?.layoutSubtreeIfNeeded()
        let size = panel.contentView?.fittingSize ?? panel.frame.size
        let visible = Self.screen(containing: caret).visibleFrame
        let frame = OverlayPlacement.frame(for: size, caret: caret, visible: visible)
        if animated {
            NSAnimationContext.runAnimationGroup { context in
                context.duration = Self.resizeDuration
                context.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
                panel.animator().setFrame(frame, display: true)
            }
        }
        BrainClient.log(
            "minne key: overlay at (\(Int(frame.minX)), \(Int(frame.minY))) "
                + "\(Int(frame.width))×\(Int(frame.height))")
        return frame
    }

    /// The primary display's full height — the origin both coordinate systems
    /// are anchored on. `NSScreen.screens[0]` is that display by definition;
    /// `.main` is merely the one with the key window, which for an accessory
    /// app with no key window is not the same thing.
    private static func primaryScreenHeight() -> CGFloat {
        NSScreen.screens.first?.frame.height ?? 0
    }

    /// The screen the caret is on, so a caret on a second display does not get
    /// an overlay clamped to the primary one.
    private static func screen(containing rect: CGRect) -> NSScreen {
        NSScreen.screens.first { $0.frame.intersects(rect) }
            ?? NSScreen.main
            ?? NSScreen.screens[0]
    }
}
