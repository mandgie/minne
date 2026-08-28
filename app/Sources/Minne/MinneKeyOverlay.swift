import AppKit
import QuartzCore

/// Why a draft is being written a second time.
///
/// The two are not the same request and must not read as one: another take is
/// the model told to *differ* from what it wrote, a revision is the model told
/// to *keep* it apart from one thing. The overlay says which is happening,
/// because a user who asked for "warmer" and got a completely different draft
/// would think Minne had thrown their sentence away — which is exactly what the
/// other button is for.
enum ReworkKind: Equatable, Sendable {
    case another
    case guided

    /// What the overlay says while it runs.
    var progressLabel: String {
        switch self {
        case .another: return "Another take…"
        case .guided: return "Reworking it…"
        }
    }
}

/// What the overlay is showing. One value for the whole life of a press:
/// drafting, what the draft says, that it went in, or why it did not.
enum MinneKeyOverlayState: Equatable, Sendable {
    /// The model is working. Carries the mode so the user can see, before the
    /// draft arrives, that Minne read their intent the way they meant it.
    case working(DraftMode)
    /// The draft is reading memory; `tool` is the tool's name.
    case consulting(DraftMode, tool: String)
    /// The finished draft, waiting for the user to accept it. `grounding` is
    /// the one-line account of what shaped it — which memory pages, which
    /// style page — or nil when it drew on neither, in which case the panel
    /// says nothing rather than pointing at an empty list.
    case result(String, grounding: String?)
    /// The draft is being written again — another take, or a revision. Carries
    /// the draft being reworked, which stays on screen under the sweep: the
    /// panel keeps its size and the user keeps their place, instead of the
    /// prose vanishing and a placeholder taking its seat.
    case reworking(ReworkKind, previous: String)
    /// It is in the field.
    case inserted(InsertionMethod)
    /// It is back out of the field.
    case undone
    case failed(String)

    /// Whether Minne is still waiting on the model — what the thinking
    /// indicator animates for.
    var isThinking: Bool {
        switch self {
        case .working, .consulting, .reworking: return true
        default: return false
        }
    }

    /// Whether this state has a draft the user can still steer — which is the
    /// only time the guidance field and the "another take" capsule exist.
    var isDraftOnScreen: Bool {
        switch self {
        case .result, .reworking: return true
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
    /// Write it again, differently.
    case regenerate
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
    /// A steer the user typed into the guidance field and submitted.
    var onGuidance: (@MainActor (String) -> Void)? { get set }
    /// Whether the guidance field is being edited — one of the two moments the
    /// panel holds key status, and therefore a moment at which the event tap
    /// must claim no keys at all.
    var isGuiding: Bool { get }
    /// Whether the draft itself is being edited in place — the other moment the
    /// panel holds key status. The same claims-nothing rule applies.
    var isEditingDraft: Bool { get }
    /// Every keystroke of the draft editor, so the controller's session always
    /// carries exactly what is on screen.
    var onDraftEdit: (@MainActor (String) -> Void)? { get set }
    func present(_ target: CaretTarget, state: MinneKeyOverlayState)
    func update(_ state: MinneKeyOverlayState)
    /// The steers in force, shown above the guidance field.
    func update(guidance: [String])
    /// Borrows key status from the app being written into and puts the caret in
    /// the guidance field.
    func beginGuiding()
    /// Hands key status back. Returns true when the panel actually had it,
    /// which is the caller's signal that focus has to travel back across
    /// processes before anything may be typed into that app.
    @discardableResult func endGuiding() -> Bool
    /// Turns the finished draft into an editor, borrowing the keyboard exactly
    /// like guiding does.
    func beginEditingDraft()
    /// Ends draft editing. The edits are kept on screen — the result the panel
    /// then shows carries them — and the keyboard is handed back; the return
    /// value means the same thing as `endGuiding`'s.
    @discardableResult func endEditingDraft() -> Bool
    func dismiss()
    /// Whether a screen point (Quartz coordinates, as event taps report them)
    /// falls inside the overlay.
    func contains(quartzPoint: CGPoint) -> Bool
    /// Whether a screen point falls inside the draft's own text — the click
    /// target that begins editing.
    func draftContains(quartzPoint: CGPoint) -> Bool
}

/// Borderless panel that appears at the caret.
///
/// Two properties matter more than anything it draws. It is
/// `.nonactivatingPanel`, so the app the user is typing in **keeps focus** —
/// the whole feature is about drafting into that field, and a panel that stole
/// focus would lose the caret it is anchored to. And it is `.canJoinAllSpaces`,
/// so it appears wherever the user is, including over a fullscreen app, without
/// the ordering dance the chat window needs.
///
/// `canBecomeKey` is a variable rather than `false` because of one thing the
/// panel has to do: hold a text field the user types a steer into. A text field
/// needs a field editor and a field editor needs a key window, so for exactly
/// as long as that field is being edited the panel says yes — and because the
/// panel is non-activating, saying yes borrows the *keyboard* without making
/// Minne the active app or disturbing the target's own first responder. The
/// moment editing ends the answer goes back to no and the panel is ordered out
/// and straight back in, which is the only way AppKit offers of handing key
/// status back to whoever had it.
private final class MinneKeyOverlayPanel: NSPanel {
    /// True only while the guidance field is being edited.
    var wantsKey = false
    override var canBecomeKey: Bool { wantsKey }
    override var canBecomeMain: Bool { false }

    /// A borderless panel is ignored by accessibility, so even with the
    /// guidance field key-and-focused, Minne's app element reported no
    /// focused window and no focused element — and the system-wide focus
    /// (how Wispr Flow and macOS Dictation find their target) resolved to
    /// nothing (probed live, 2026-08-19). Opting the panel back in is what
    /// makes the caret findable; activation alone (see `beginGuiding`) was
    /// necessary but not sufficient.
    override func isAccessibilityElement() -> Bool { true }
    override func accessibilityRole() -> NSAccessibility.Role? { .window }
}

/// The panel's background: one flat white surface with a hairline edge.
///
/// Solid rather than the system's `.popover` material, which is what put grey
/// into the panel in the first place — a translucent surface takes its colour
/// from whatever the user happens to be typing over, and no amount of white
/// inside it survives that. White is a decision here, not an average.
///
/// The colours are re-resolved on every appearance change: a `CGColor` is a
/// resolved colour and not a dynamic one, so a layer painted once in light mode
/// keeps that exact white when the Mac turns dark.
private final class OverlayChromeView: NSView {
    static let cornerRadius: CGFloat = 16

    override init(frame frameRect: NSRect) {
        super.init(frame: frameRect)
        wantsLayer = true
        layer?.cornerRadius = Self.cornerRadius
        layer?.cornerCurve = .continuous
        layer?.masksToBounds = true
        layer?.borderWidth = 1
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
            layer?.backgroundColor = OverlayPalette.surface.cgColor
            layer?.borderColor = OverlayPalette.edge.cgColor
        }
    }
}

/// A hairline the width of the content column — under the header, and above the
/// guidance field. Both sit at exactly the inset every other child starts at.
final class OverlayRule: NSView {
    /// The guidance rule turns blue while the field below it holds the
    /// keyboard. It is the whole focus indicator: the panel borrows key status
    /// from the app the user is typing in, so *where my keystrokes are going*
    /// has to be unmistakable — and the one shape already on the grid saying
    /// "everything below here is the guidance line" is the honest place to say
    /// it. A filled, bordered box would say it too, but by becoming the loudest
    /// thing in a panel whose language is whitespace and hairlines.
    var isAccented = false {
        didSet {
            guard isAccented != oldValue else { return }
            applyColors()
        }
    }

    override init(frame frameRect: NSRect) {
        super.init(frame: frameRect)
        wantsLayer = true
        applyColors()
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("not used") }

    override var intrinsicContentSize: NSSize {
        NSSize(width: NSView.noIntrinsicMetric, height: 1)
    }

    override func viewDidChangeEffectiveAppearance() {
        super.viewDidChangeEffectiveAppearance()
        applyColors()
    }

    private func applyColors() {
        effectiveAppearance.performAsCurrentDrawingAppearance { [isAccented] in
            layer?.backgroundColor =
                isAccented ? OverlayPalette.blue.cgColor : OverlayPalette.hairline.cgColor
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
            for dot in dots { dot.backgroundColor = OverlayPalette.blue.cgColor }
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

/// Three pale blue lines where the draft will be, with a highlight sweeping
/// across them.
///
/// They sit on the panel's white directly, on the same grid and at the same
/// width as the prose that replaces them: the panel takes its shape the moment
/// it opens and then fills in, rather than jumping a hundred points when the
/// model answers. The sweep is a gradient mask animated on the render server —
/// no timer, no redraw, nothing on the thread that is carrying the user's
/// keystrokes.
private final class ShimmerLines: NSView {
    private static let barHeight: CGFloat = 9
    private static let gap: CGFloat = 9
    /// Ragged ends, so it reads as a paragraph rather than a progress bar.
    private static let widths: [CGFloat] = [1.0, 0.92, 0.56]
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
            NSColor.black.withAlphaComponent(0.5).cgColor,
            NSColor.black.cgColor,
            NSColor.black.withAlphaComponent(0.5).cgColor,
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
            let ink = OverlayPalette.shimmer.cgColor
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

/// The draft itself, with one trick: it can shimmer.
///
/// When the user asks for another take, the draft they are looking at is not
/// replaced by placeholder bars — it stays where it is, dimmed, with a
/// highlight sweeping across it. Nothing moves, the panel keeps its height, and
/// the state reads as *this text, being rewritten* rather than as a fresh press.
/// The sweep is a gradient mask animated on the render server, like
/// `ShimmerLines`: nothing is drawn on the thread carrying the user's typing.
private final class DraftLabel: NSTextField {
    private static let sweepDuration: CFTimeInterval = 1.4
    /// How much of the previous draft is left showing under the sweep. Enough
    /// to read the shape of it; too faint to mistake for the new one.
    private static let reworkingAlpha: CGFloat = 0.5

    private let sweepMask = CAGradientLayer()

    init() {
        super.init(frame: .zero)
        // What `NSTextField(wrappingLabelWithString:)` sets up, by hand,
        // because that is a factory method and this is a subclass.
        isEditable = false
        isBordered = false
        isBezeled = false
        drawsBackground = false
        isSelectable = true
        lineBreakMode = .byWordWrapping
        cell?.usesSingleLineMode = false
        cell?.wraps = true
        cell?.isScrollable = false
        wantsLayer = true

        sweepMask.startPoint = CGPoint(x: 0, y: 0.5)
        sweepMask.endPoint = CGPoint(x: 1, y: 0.5)
        sweepMask.colors = [
            NSColor.black.withAlphaComponent(0.45).cgColor,
            NSColor.black.cgColor,
            NSColor.black.withAlphaComponent(0.45).cgColor,
        ]
        sweepMask.locations = [0, 0.2, 0.4]
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("not used") }

    override func layout() {
        super.layout()
        guard layer?.mask != nil else { return }
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        sweepMask.frame = bounds
        CATransaction.commit()
    }

    func startSweep() {
        alphaValue = Self.reworkingAlpha
        guard layer?.mask == nil else { return }
        sweepMask.frame = bounds
        layer?.mask = sweepMask
        let sweep = CABasicAnimation(keyPath: "locations")
        sweep.fromValue = [-0.4, -0.2, 0]
        sweep.toValue = [1.0, 1.2, 1.4]
        sweep.duration = Self.sweepDuration
        sweep.repeatCount = .infinity
        sweep.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
        sweepMask.add(sweep, forKey: "sweep")
    }

    func stopSweep() {
        alphaValue = 1
        guard layer?.mask != nil else { return }
        sweepMask.removeAnimation(forKey: "sweep")
        layer?.mask = nil
    }
}

/// The read-only draft, disciplined (US-203): at most `DraftEditor.maxLines`
/// lines of it, and past that the prose scrolls inside its own area rather
/// than growing the panel — the same cap and the same line slot the draft
/// editor lives under, so opening the editor on a long draft moves nothing.
///
/// It is the `DraftLabel` inside a field-like scroll view, not a second text
/// view: the label already knows how to render the elision note and how to
/// shimmer under a rework, and a wrapping label measures honestly where an
/// `NSTextView` handed to a stack view renders nothing (US-018). The scroll
/// view's clip is the line-resting one, so a scrolled draft is always cut
/// between lines, never through one.
private final class DraftArea: NSView {
    private final class FlippedView: NSView {
        override var isFlipped: Bool { true }
    }

    let label = DraftLabel()
    private let scroll = NSScrollView()
    private let clip = LineRestingClipView()
    private let document = FlippedView()
    private let heightConstraint: NSLayoutConstraint
    private let pitch: CGFloat
    /// The width the draft wraps and measures at — the panel's grid, kept in
    /// step with it by `setContentWidth`.
    private var contentWidth = MinneKeyOverlayView.minContentWidth
    /// The body as last set, so a width change can re-measure it.
    private var body = NSAttributedString()

    override init(frame frameRect: NSRect) {
        pitch = DraftEditor.linePitch()
        heightConstraint = scroll.heightAnchor.constraint(equalToConstant: pitch)
        super.init(frame: frameRect)

        label.isSelectable = true
        label.textColor = OverlayPalette.ink
        // A wrapping label with no width yet lays out on one endless line, and
        // the panel then reports a fitting size wider than the screen. Telling
        // it the width up front is what makes the draft wrap — and the width is
        // the grid's, since the draft sits on the panel's own surface.
        label.preferredMaxLayoutWidth = contentWidth

        clip.drawsBackground = false
        clip.pitch = pitch
        scroll.contentView = clip
        scroll.documentView = document
        scroll.drawsBackground = false
        scroll.borderType = .noBorder
        scroll.hasVerticalScroller = true
        scroll.hasHorizontalScroller = false
        scroll.autohidesScrollers = true
        scroll.scrollerStyle = .overlay
        scroll.verticalScrollElasticity = .none
        scroll.horizontalScrollElasticity = .none

        scroll.translatesAutoresizingMaskIntoConstraints = false
        document.translatesAutoresizingMaskIntoConstraints = false
        label.translatesAutoresizingMaskIntoConstraints = false
        addSubview(scroll)
        document.addSubview(label)
        NSLayoutConstraint.activate([
            scroll.leadingAnchor.constraint(equalTo: leadingAnchor),
            scroll.trailingAnchor.constraint(equalTo: trailingAnchor),
            scroll.topAnchor.constraint(equalTo: topAnchor),
            scroll.bottomAnchor.constraint(equalTo: bottomAnchor),
            heightConstraint,
            // The document rides the clip's width and takes its height from
            // the label, which is what lets the clip scroll it vertically.
            document.leadingAnchor.constraint(equalTo: clip.leadingAnchor),
            document.topAnchor.constraint(equalTo: clip.topAnchor),
            document.widthAnchor.constraint(equalTo: clip.widthAnchor),
            label.leadingAnchor.constraint(equalTo: document.leadingAnchor),
            label.trailingAnchor.constraint(equalTo: document.trailingAnchor),
            label.topAnchor.constraint(equalTo: document.topAnchor),
            label.bottomAnchor.constraint(equalTo: document.bottomAnchor),
        ])
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("not used") }

    /// Sets the draft and re-clamps: the area is exactly as tall as the prose
    /// up to the line cap, then scrolls — opened at the top, where reading
    /// starts.
    func setBody(_ text: NSAttributedString) {
        body = text
        label.attributedStringValue = text
        remeasure()
        clip.scroll(to: .zero)
        scroll.reflectScrolledClipView(clip)
    }

    /// The panel widened — the draft wraps at the new grid and its clamp is
    /// re-read, without touching where it is scrolled to.
    func setContentWidth(_ width: CGFloat) {
        guard width != contentWidth else { return }
        contentWidth = width
        label.preferredMaxLayoutWidth = width
        remeasure()
    }

    private func remeasure() {
        let bounds = NSRect(
            x: 0, y: 0, width: contentWidth, height: CGFloat.greatestFiniteMagnitude)
        let content = label.cell?.cellSize(forBounds: bounds).height ?? 0
        heightConstraint.constant = GuidanceRow.fieldHeight(
            content: content, line: pitch, spacing: DraftEditor.lineSpacing,
            maxLines: DraftEditor.maxLines)
    }

    func startSweep() { label.startSweep() }
    func stopSweep() { label.stopSweep() }
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
///
/// One capsule is filled blue and the rest are outlines — no grey fills. The
/// filled one is the answer to the panel's question; the outlined ones are the
/// ways out, and on white they weigh almost nothing until the pointer is over
/// them, which is exactly the hierarchy the panel wants.
private final class OverlayButton: NSButton {
    /// Text at the end of a title, dimmer than the label: the key that does the
    /// same thing.
    let hint: String?
    /// Whether the hint is telling the truth right now. While a borrowed field
    /// holds the keyboard, most of these keys belong to the field — a capsule
    /// still advertising one would claim a key that does something else. The
    /// hint is drawn in clear rather than removed: the capsule keeps its exact
    /// width, so the row never shuffles when the keyboard is borrowed.
    var hintShown = true {
        didSet {
            guard hintShown != oldValue else { return }
            attributedTitle = titleText()
        }
    }
    /// Kept because assigning `attributedTitle` overwrites `title` with the
    /// whole rendered string — building the next title from `title` would
    /// append the key hint again, and again.
    private let label: String
    /// An SF Symbol before the label, for the one capsule that says what it
    /// does better as a shape than as a word.
    private let symbol: String?
    private let isPrimary: Bool
    private var isHovered = false

    private static let height: CGFloat = 26
    private static let horizontalPadding: CGFloat = 14
    /// A glyph-only capsule is padded a little tighter: a symbol has no side
    /// bearing, so the same padding around one looks wider than around a word.
    private static let glyphPadding: CGFloat = 11

    init(
        label: String, hint: String?, symbol: String? = nil, isPrimary: Bool,
        target: AnyObject, action: Selector
    ) {
        self.hint = hint
        self.label = label
        self.symbol = symbol
        self.isPrimary = isPrimary
        super.init(frame: .zero)
        self.target = target
        self.action = action
        isBordered = false
        wantsLayer = true
        layer?.cornerRadius = Self.height / 2
        layer?.cornerCurve = .continuous
        layer?.borderWidth = isPrimary ? 0 : 1
        attributedTitle = titleText()
        applyColors()
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("not used") }

    override var intrinsicContentSize: NSSize {
        let padding = label.isEmpty ? Self.glyphPadding : Self.horizontalPadding
        return NSSize(width: ceil(attributedTitle.size().width) + padding * 2, height: Self.height)
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

    /// The glyph is tinted with a colour resolved *now* — it is pixels in an
    /// image, not a dynamic colour a label can re-read — so building the title
    /// has to happen under this view's own appearance.
    private func titleText() -> NSAttributedString {
        var text = NSAttributedString()
        effectiveAppearance.performAsCurrentDrawingAppearance { text = buildTitle() }
        return text
    }

    private func buildTitle() -> NSAttributedString {
        let ink = isPrimary ? OverlayPalette.onBlue : OverlayPalette.inkSecondary
        let text = NSMutableAttributedString()
        if let symbol, let glyph = Self.glyph(symbol, color: ink) {
            text.append(glyph)
            if !label.isEmpty { text.append(NSAttributedString(string: " ")) }
        }
        text.append(
            NSAttributedString(
                string: label,
                attributes: [
                    .font: NSFont.systemFont(ofSize: 12, weight: isPrimary ? .semibold : .medium),
                    .foregroundColor: ink,
                ]))
        if let hint {
            let hintInk =
                isPrimary
                ? OverlayPalette.onBlue.withAlphaComponent(0.7)
                : OverlayPalette.inkTertiary
            text.append(
                NSAttributedString(
                    string: "  \(hint)",
                    attributes: [
                        .font: NSFont.systemFont(ofSize: 11.5),
                        // Clear, not gone, when the hint is not in force: the
                        // glyphs keep their metrics, so the capsule keeps its
                        // width.
                        .foregroundColor: hintShown ? hintInk : NSColor.clear,
                    ]))
        }
        return text
    }

    /// A `CGColor` is resolved, not dynamic, so every colour here is re-read
    /// whenever the appearance, the hover or the press changes.
    ///
    /// The quiet capsule has no fill at rest — the pointer washes it with the
    /// accent instead of with grey, and its edge follows.
    private func applyColors() {
        effectiveAppearance.performAsCurrentDrawingAppearance { [self] in
            if isPrimary {
                let lift: CGFloat = isHighlighted ? -0.14 : (isHovered ? 0.08 : 0)
                layer?.backgroundColor = Self.adjusted(OverlayPalette.blueFill, by: lift).cgColor
            } else {
                layer?.backgroundColor =
                    isHighlighted
                    ? OverlayPalette.blueWashPressed.cgColor
                    : (isHovered ? OverlayPalette.blueWash.cgColor : NSColor.clear.cgColor)
                layer?.borderColor =
                    (isHovered || isHighlighted)
                    ? OverlayPalette.blue.withAlphaComponent(0.45).cgColor
                    : OverlayPalette.quietEdge.cgColor
            }
        }
    }

    /// An SF Symbol as one character of the title.
    ///
    /// Tinted by hand rather than left as a template image: a template
    /// attachment inside an attributed string is drawn black whatever the
    /// title's foreground colour says, which on the dark panel is a hole.
    ///
    /// The tint goes on at full strength and the *image* is then faded to the
    /// colour's own alpha. Filling `.sourceAtop` with a translucent colour
    /// instead leaves the template's black showing through the difference, so a
    /// glyph asked for in the secondary ink came out very nearly black — a full
    /// stop darker than the words in the capsules beside it.
    private static func glyph(_ symbol: String, color: NSColor) -> NSAttributedString? {
        guard
            let image = NSImage(systemSymbolName: symbol, accessibilityDescription: nil)?
                // A shade heavier than the label beside it: a stroked glyph at
                // the same weight as a letterform reads lighter than it is,
                // and in the dark it nearly disappears.
                .withSymbolConfiguration(
                    NSImage.SymbolConfiguration(pointSize: 12, weight: .semibold)),
            let tinted = image.copy() as? NSImage
        else { return nil }
        // Resolved first: a dynamic colour has no components to read until it
        // is matched against the appearance in force.
        let resolved = color.usingColorSpace(.sRGB) ?? color
        tinted.lockFocus()
        resolved.withAlphaComponent(1).set()
        NSRect(origin: .zero, size: tinted.size).fill(using: .sourceAtop)
        tinted.unlockFocus()
        tinted.isTemplate = false
        let alpha = resolved.alphaComponent
        let drawn =
            alpha < 1
            ? NSImage(size: tinted.size, flipped: false) { rect in
                tinted.draw(in: rect, from: .zero, operation: .sourceOver, fraction: alpha)
                return true
            }
            : tinted

        let attachment = NSTextAttachment()
        attachment.image = drawn
        // Sat down onto the text's baseline: an attachment's origin is the
        // baseline, so without this the glyph floats a couple of points high.
        attachment.bounds = CGRect(
            x: 0, y: -2, width: drawn.size.width, height: drawn.size.height)
        return NSAttributedString(attachment: attachment)
    }

    /// Hover lightens the accent capsule and a press darkens it, by the same
    /// small amount either way.
    private static func adjusted(_ color: NSColor, by amount: CGFloat) -> NSColor {
        guard amount != 0 else { return color }
        // A dynamic colour has no components to blend until it is resolved
        // against the appearance in force — `blended` on one returns nil.
        let resolved = color.usingColorSpace(.sRGB) ?? color
        return amount > 0
            ? resolved.blended(withFraction: amount, of: .white) ?? resolved
            : resolved.blended(withFraction: -amount, of: .black) ?? resolved
    }
}

/// The overlay's contents: who is speaking, what is happening, the draft when
/// there is one, and the buttons that state offers.
@MainActor
final class MinneKeyOverlayView: NSView {
    /// The compact content width — what every press opens at, and the floor
    /// the panel never narrows past. The width in force is the instance's
    /// `contentWidth`: a draft can earn a wider panel (`OverlayWidth`), and
    /// `setContentWidth` moves the whole grid together.
    static let minContentWidth: CGFloat = OverlayWidth.baseContent
    /// Characters of draft shown before the preview elides. A long draft is
    /// still inserted whole — this is a HUD at someone's caret, not a document
    /// view. Elided by hand rather than by `lineBreakMode`: a wrapping label
    /// asked to truncate stops wrapping and puts the whole draft on one line.
    static let maxPreviewCharacters = 600
    /// The one internal grid. Every child of the panel — the spark, the status
    /// line, the draft, the first capsule — starts at `inset.width` from the
    /// panel's border and nothing starts anywhere else; top and bottom are equal.
    static let inset = NSSize(width: 16, height: 16)

    var onAction: (@MainActor (MinneKeyAction) -> Void)?
    /// The guidance field's three moments, forwarded to the panel's controller
    /// because two of them need key status, which is the panel's to lend.
    var onRequestGuiding: (@MainActor () -> Void)? {
        get { guidance.onRequestEditing }
        set { guidance.onRequestEditing = newValue }
    }
    var onGuidanceSubmitted: (@MainActor (String) -> Void)? {
        get { guidance.onSubmit }
        set { guidance.onSubmit = newValue }
    }
    var onGuidanceCancelled: (@MainActor () -> Void)? {
        get { guidance.onCancel }
        set { guidance.onCancel = newValue }
    }
    /// The guidance field grew or shrank — the panel has to re-measure.
    var onGuidanceGrew: (@MainActor () -> Void)? {
        get { guidance.onGrowth }
        set { guidance.onGrowth = newValue }
    }
    /// The draft editor's moments, mirrored from the guidance field's: every
    /// keystroke (the controller keeps its session current), Escape (the
    /// presenter ends the borrow), and growth (the panel re-measures). Return
    /// is wired internally to `.insert` — it is the same verb as the button.
    var onDraftEdited: (@MainActor (String) -> Void)? {
        get { draftEditor.onEdit }
        set { draftEditor.onEdit = newValue }
    }
    var onDraftEditCancelled: (@MainActor () -> Void)? {
        get { draftEditor.onCancel }
        set { draftEditor.onCancel = newValue }
    }
    var onDraftEditorGrew: (@MainActor () -> Void)? {
        get { draftEditor.onGrowth }
        set { draftEditor.onGrowth = newValue }
    }

    private let spark = NSImageView()
    private let title = NSTextField(labelWithString: "Minne")
    private let separator = NSTextField(labelWithString: "·")
    private let app = NSTextField(labelWithString: "")
    private let dots = ThinkingDots(frame: .zero)
    /// Marks the two states that are an outcome rather than a progress report:
    /// a blue tick when the draft landed, a warm mark when it did not.
    private let outcome = NSImageView()
    private let status = NSTextField(labelWithString: "")
    private let draft = DraftArea(frame: .zero)
    /// The draft made touchable: swapped in for the label while the user edits
    /// (US-202), hidden the rest of the time.
    private let draftEditor = DraftEditor(frame: .zero)
    /// What grounded the draft, in the quiet ink under it. One line always:
    /// it is a citation, not content, and a citation that wrapped would push
    /// the draft around to say less than the tail truncation already does.
    private let grounding = NSTextField(labelWithString: "")
    private let shimmer = ShimmerLines(frame: .zero)
    private let rule = OverlayRule(frame: .zero)
    private let guidance = GuidanceRow(frame: .zero)
    private let buttons = NSStackView()
    /// At the status row's trailing edge, the one hint that is about the draft
    /// rather than about a button: ⌘E while it can be edited, esc while it is
    /// being. It lives up here because the capsule row is already full — a
    /// fifth element there compresses the buttons (measured: Insert lost 20 pt
    /// of its capsule) — and the status line has the room.
    private let editHint = NSTextField(labelWithString: "")
    private let column = NSStackView()
    /// The grid's width in force. Presses open compact; a draft can widen it
    /// (`setContentWidth`), and these pins are how every row moves together.
    private(set) var contentWidth = MinneKeyOverlayView.minContentWidth
    private var widthPins: [NSLayoutConstraint] = []

    /// Whether the guidance field is being edited.
    var isGuiding: Bool { guidance.isEditing }
    /// Whether the caret really landed in it.
    var guidanceHasCaret: Bool { guidance.hasCaret }
    /// Whether the draft editor is live — same caret-derived rule as guiding.
    var isEditingDraft: Bool { draftEditor.isEditing }
    /// Whether the caret really landed in the draft editor.
    var draftEditorHasCaret: Bool { draftEditor.hasCaret }

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
        spark.symbolConfiguration = NSImage.SymbolConfiguration(pointSize: 12.5, weight: .semibold)
        spark.contentTintColor = OverlayPalette.blue
        spark.setContentHuggingPriority(.required, for: .horizontal)
        spark.setContentCompressionResistancePriority(.required, for: .horizontal)

        title.font = .systemFont(ofSize: 13, weight: .semibold)
        title.textColor = OverlayPalette.ink
        separator.font = .systemFont(ofSize: 12)
        separator.textColor = OverlayPalette.inkTertiary
        separator.setContentHuggingPriority(.required, for: .horizontal)
        app.font = .systemFont(ofSize: 12)
        app.textColor = OverlayPalette.inkTertiary
        app.lineBreakMode = .byTruncatingTail
        app.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
    }

    private func buildBody() {
        // Outlines rather than `.fill` symbols: an outcome is said in one line
        // of coloured ink and one hairline glyph — the panel never grows a
        // coloured block to say it.
        outcome.symbolConfiguration = NSImage.SymbolConfiguration(pointSize: 11, weight: .medium)
        outcome.setContentHuggingPriority(.required, for: .horizontal)

        status.font = .systemFont(ofSize: 12)
        status.textColor = OverlayPalette.inkSecondary
        status.lineBreakMode = .byWordWrapping
        status.maximumNumberOfLines = 3
        status.preferredMaxLayoutWidth = contentWidth - Self.outcomeColumn

        grounding.font = .systemFont(ofSize: 11)
        grounding.textColor = OverlayPalette.inkTertiary
        grounding.maximumNumberOfLines = 1
        grounding.lineBreakMode = .byTruncatingTail
        grounding.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)

        buttons.orientation = .horizontal
        buttons.alignment = .centerY
        buttons.spacing = 7

        // ⌘E is the invitation to edit; esc, in the accent, is the way back
        // out — the same one-slot-two-answers pattern as the guidance field's
        // ⇥/↩ hint, and the affordance that says the draft is touchable at all.
        editHint.font = .systemFont(ofSize: 11)
        editHint.setContentHuggingPriority(.required, for: .horizontal)
        editHint.setContentCompressionResistancePriority(.required, for: .horizontal)

        draftEditor.isHidden = true
        // Return in the editor is the same verb as the Insert capsule — the
        // controller ends the borrow, waits for focus to travel, and inserts
        // what is on screen.
        draftEditor.onSubmit = { [weak self] in self?.onAction?(.insert) }
        draftEditor.onFocusChange = { [weak self] in self?.refreshKeyHints() }
        // Guiding claims Return and Escape for the field, so the capsules'
        // hints have to follow the keyboard, not just the state.
        guidance.onFocusChange = { [weak self] in self?.refreshKeyHints() }

        let name = NSStackView(views: [spark, title, separator, app])
        name.orientation = .horizontal
        name.alignment = .centerY
        name.spacing = 5
        // A hair more after the glyph than between the words: SF Symbols carry
        // side bearing that a text field does not, so an equal gap reads tight.
        name.setCustomSpacing(6, after: spark)
        // The dots sit at the far end of the header, so how the model is doing
        // is always in the same place, whatever the panel is saying below.
        let spacer = NSView()
        spacer.setContentHuggingPriority(.defaultLow, for: .horizontal)
        let header = NSStackView(views: [name, spacer, dots])
        header.orientation = .horizontal
        header.alignment = .centerY
        header.spacing = 8

        let statusSpacer = NSView()
        statusSpacer.setContentHuggingPriority(.defaultLow, for: .horizontal)
        let statusRow = NSStackView(views: [outcome, status, statusSpacer, editHint])
        statusRow.orientation = .horizontal
        statusRow.alignment = .firstBaseline
        statusRow.spacing = 5

        column.setViews(
            [header, rule, statusRow, shimmer, draft, draftEditor, grounding, guidance, buttons],
            in: .top)
        // Air, in three sizes: tight around the rule, a line's worth before the
        // draft, and a little more before the row of capsules. The grounding
        // line hugs the draft it annotates — its spacing is set per state in
        // `show`, because a hidden view collapses its custom spacing with it.
        column.setCustomSpacing(10, after: header)
        column.setCustomSpacing(10, after: rule)
        column.setCustomSpacing(12, after: statusRow)
        column.setCustomSpacing(14, after: shimmer)
        column.setCustomSpacing(14, after: draft)
        column.setCustomSpacing(14, after: draftEditor)
        column.setCustomSpacing(14, after: grounding)
        column.setCustomSpacing(13, after: guidance)
        widthPins = [
            header.widthAnchor.constraint(equalToConstant: contentWidth),
            rule.widthAnchor.constraint(equalToConstant: contentWidth),
            shimmer.widthAnchor.constraint(equalToConstant: contentWidth),
            guidance.widthAnchor.constraint(equalToConstant: contentWidth),
            draftEditor.widthAnchor.constraint(equalToConstant: contentWidth),
            draft.widthAnchor.constraint(equalToConstant: contentWidth),
            grounding.widthAnchor.constraint(lessThanOrEqualToConstant: contentWidth),
            // Full width, not ≤: the edit hint sits at the row's trailing edge.
            statusRow.widthAnchor.constraint(equalToConstant: contentWidth),
        ]
        NSLayoutConstraint.activate(widthPins)
    }

    /// Moves the whole grid to a new width — every pinned row, the status
    /// line's wrap width, and the draft's own measure. Width is decided by the
    /// controller (`OverlayWidth`), and within a press it only ever grows.
    func setContentWidth(_ width: CGFloat) {
        guard width != contentWidth else { return }
        contentWidth = width
        for pin in widthPins { pin.constant = width }
        status.preferredMaxLayoutWidth = width - Self.outcomeColumn
        draft.setContentWidth(width)
    }

    /// What the outcome glyph and its gap take off the status line's width.
    private static let outcomeColumn: CGFloat = 18

    func render(_ target: CaretTarget, state: MinneKeyOverlayState) {
        app.stringValue = target.appName
        separator.isHidden = target.appName.isEmpty
        app.isHidden = target.appName.isEmpty
        render(state)
    }

    func render(_ state: MinneKeyOverlayState) {
        switch state {
        case .working(let mode):
            show(status: mode.progressLabel, state: state, draft: nil, actions: [.dismiss])
        case .consulting(_, let tool):
            show(status: Self.toolLabel(tool), state: state, draft: nil, actions: [.dismiss])
        case .result(let text, let grounding):
            show(
                status: "Draft ready", state: state, draft: text, grounding: grounding,
                actions: [.insert, .copy, .regenerate, .dismiss])
        case .reworking(let kind, let previous):
            show(
                status: kind.progressLabel, state: state, draft: previous,
                actions: [.dismiss])
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

    /// The glyph before the status line, in the two states that are an outcome:
    /// the draft went in, or it did not. Everything else is Minne narrating
    /// itself and needs no mark.
    private static func outcomeMark(_ state: MinneKeyOverlayState)
        -> (symbol: String, tint: NSColor)?
    {
        switch state {
        case .inserted: return ("checkmark.circle", OverlayPalette.blue)
        case .failed: return ("exclamationmark.circle", OverlayPalette.warm)
        default: return nil
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
        grounding line: String? = nil, actions: [MinneKeyAction]
    ) {
        let failed: Bool
        if case .failed = state { failed = true } else { failed = false }

        status.stringValue = text
        // Warm ink, and only ink: what went wrong is said in a colour, never
        // fenced off in a coloured block.
        status.textColor = failed ? OverlayPalette.warm : OverlayPalette.inkSecondary
        let mark = Self.outcomeMark(state)
        outcome.image =
            mark.map {
                NSImage(systemSymbolName: $0.symbol, accessibilityDescription: nil)
            } ?? nil
        outcome.contentTintColor = mark?.tint
        outcome.isHidden = mark == nil

        if state.isThinking { dots.start() } else { dots.stop() }
        dots.isHidden = !state.isThinking
        // The draft's lines are there from the first moment, shimmering on the
        // same grid the prose will use — rather than the panel doubling in
        // height when the model answers. A *rework* needs none of that: it
        // already has prose on screen, and shimmers that instead.
        let placeholder = state.isThinking && body == nil
        if placeholder { shimmer.start() } else { shimmer.stop() }
        shimmer.isHidden = !placeholder

        draft.setBody(
            body.map { Self.body(Self.preview($0), elided: $0.count > Self.maxPreviewCharacters) }
                ?? NSAttributedString())
        draft.isHidden = body == nil
        // No state renders the editor — it only ever swaps in through
        // `beginDraftEditing`, and every path that renders a state has ended
        // the edit first. Belt and braces against the two showing at once.
        draftEditor.isHidden = true
        if case .reworking = state { draft.startSweep() } else { draft.stopSweep() }

        // Only under a finished draft — never while thinking, where it would
        // be a claim about a draft that does not exist yet. Nil means silence.
        grounding.stringValue = line ?? ""
        grounding.isHidden = line == nil
        // Tucked under the draft it annotates when it is there; the draft
        // keeps its usual air before the capsules when it is not.
        column.setCustomSpacing(grounding.isHidden ? 13 : 7, after: draft)

        // The field is offered whenever there is a draft to steer, and keeps
        // its place — with its chips — while a rework runs, so the panel does
        // not shuffle every time the user asks for something. It stops taking
        // text for those few seconds: a second steer typed into a draft that
        // is already being rewritten would be a steer for a draft that no
        // longer exists.
        guidance.isHidden = !state.isDraftOnScreen
        guidance.setEditable(!state.isThinking)

        buttons.setViews(actions.map(button(for:)), in: .leading)
        buttons.isHidden = actions.isEmpty
        // The edit hint exists exactly when editing is on offer: a finished
        // draft, waiting. Everywhere else it would be a claim about a gesture
        // that does nothing.
        if case .result = state { editHint.isHidden = false } else { editHint.isHidden = true }
        refreshKeyHints()
    }

    /// Whether a capsule's key hint tells the truth right now. While either
    /// borrowed field holds the keyboard the tap claims nothing, so most of
    /// the advertised keys go to the field instead: Escape puts the field
    /// away (the blue "esc done" above says so), ⌘R types nothing. The one
    /// exception is Return while the draft editor is live — the editor's own
    /// Return is the same verb as the Insert capsule.
    static func hintApplies(_ action: MinneKeyAction, guiding: Bool, editingDraft: Bool) -> Bool {
        guard guiding || editingDraft else { return true }
        return action == .insert && editingDraft
    }

    /// Repaints every key hint from where the keyboard actually is: the
    /// capsules' trailing hints, and the edit hint at the status row's edge.
    /// One slot, two answers there: ⌘E is how you get in, esc is how you get
    /// back out — and while the guidance field has the keyboard the slot is
    /// silent, because ⌘E would reach the field, not the overlay.
    private func refreshKeyHints() {
        let guiding = guidance.isEditing
        let editing = draftEditor.isEditing
        if editing {
            editHint.stringValue = "esc done"
            editHint.textColor = OverlayPalette.blue
        } else if guiding {
            editHint.stringValue = ""
        } else {
            editHint.stringValue = "⌘E edit"
            editHint.textColor = OverlayPalette.inkTertiary
        }
        for case let button as OverlayButton in buttons.views {
            guard let action = Self.action(tag: button.tag) else { continue }
            button.hintShown = Self.hintApplies(action, guiding: guiding, editingDraft: editing)
        }
    }

    /// The steers in force, above the field.
    func render(guidance steers: [String]) {
        guidance.guidance = steers
    }

    func beginGuiding() {
        guidance.beginEditing()
    }

    func endGuiding() {
        guidance.endEditing()
    }

    /// The guidance field's focused *look*, with no field editor behind it.
    func showGuidingLook() {
        guidance.showEditingLook()
    }

    /// Repaints the field from where the caret actually is.
    func refreshGuidingLook() {
        guidance.refreshLook()
    }

    /// Seeds the guidance field with text, as if the user had typed it.
    func previewGuidanceText(_ text: String) {
        guidance.setFieldText(text)
    }

    /// Swaps the read-only draft for the editor, seeded with the whole draft.
    /// The guidance row goes *inert* while the editor is up — dimmed and deaf
    /// to clicks, so the keyboard's owner stays unambiguous — but it does NOT
    /// hide: hiding it shrank the panel by the row's height and the whole box
    /// visibly jumped on ⌘E (user report, 2026-08-20). Entering the editor
    /// must move nothing; the label and the editor already share their pitch
    /// and cap, so with the row standing still the swap is pixel-stable.
    func beginDraftEditing(text: String) {
        draft.stopSweep()
        draft.isHidden = true
        guidance.setInert(true)
        draftEditor.isHidden = false
        // The editor annotates the same grounding line the label did.
        column.setCustomSpacing(grounding.isHidden ? 13 : 7, after: draftEditor)
        draftEditor.setText(text)
        refreshKeyHints()
    }

    /// Puts the caret in the editor — split from `beginDraftEditing` because
    /// first responder must be set before the panel asks for key status.
    func focusDraftEditor() {
        draftEditor.focus()
    }

    /// Puts the label back and returns what the editor holds, or nil when
    /// nothing was being edited. The label still shows the old text until the
    /// caller renders the state that carries the edits.
    func endDraftEditing() -> String? {
        guard !draftEditor.isHidden else { return nil }
        let text = draftEditor.endEditing()
        draftEditor.isHidden = true
        draft.isHidden = false
        guidance.setInert(false)
        refreshKeyHints()
        return text
    }

    /// The editor's focused *look*, with no keyboard behind it — the preview
    /// hook's version of `showGuidingLook`.
    func showDraftEditingLook() {
        draftEditor.showEditingLook()
    }

    /// Repaints the edit hint from where the caret actually is.
    func refreshDraftEditingLook() {
        refreshKeyHints()
    }

    /// The draft text's own footprint in screen coordinates — the click target
    /// that begins editing. Nil while no read-only draft is on screen.
    func draftFrameOnScreen() -> CGRect? {
        guard !draft.isHidden, let window else { return nil }
        return window.convertToScreen(draft.convert(draft.bounds, to: nil))
    }

    /// The draft, set with a little air between its lines — it is the one
    /// paragraph of prose in the panel and the thing being judged.
    ///
    /// The elision note is the one thing here that is not the draft, so it is
    /// set as an aside: smaller, and in the ink the app's own name uses.
    static func body(_ text: String, elided: Bool) -> NSAttributedString {
        let paragraph = NSMutableParagraphStyle()
        // The editor's own metrics, by name: the label and the editor swap in
        // place, and two hardcoded copies of the same numbers is how they
        // would drift apart.
        paragraph.lineSpacing = DraftEditor.lineSpacing
        let body = NSMutableAttributedString(
            string: text,
            attributes: [
                .font: DraftEditor.font,
                .foregroundColor: OverlayPalette.ink,
                .paragraphStyle: paragraph,
            ])
        // Gated on the panel having elided, never on the text's shape: a draft
        // is allowed to end in a bracketed line of its own.
        if elided, let note = text.range(of: elisionSeparator, options: .backwards) {
            // UTF-16 offsets, not Character ones: an emoji in the draft is two
            // units and would shift the note's range by one per emoji.
            let separator = NSRange(note, in: text)
            let start = separator.upperBound - 1
            body.addAttributes(
                [
                    .font: NSFont.systemFont(ofSize: 11.5),
                    .foregroundColor: OverlayPalette.inkTertiary,
                ], range: NSRange(location: start, length: body.length - start))
        }
        return body
    }

    /// What separates an elided draft from the note saying so — matched when the
    /// draft is set, which is why it is a constant and not a literal in two
    /// places.
    private static let elisionSeparator = "\n\n["

    /// The draft as the panel shows it: whole, or elided with what is missing
    /// said out loud rather than silently cut.
    static func preview(_ draft: String) -> String {
        guard draft.count > maxPreviewCharacters else { return draft }
        let shown = draft.prefix(maxPreviewCharacters)
        let rest = draft.count - shown.count
        return "\(shown)…\(elisionSeparator)\(rest) more characters — Insert takes all of it]"
    }

    private func button(for action: MinneKeyAction) -> NSButton {
        // One accent, on the one thing the user most likely came for. The rest
        // stay quiet, which is what makes it read as the primary at all.
        let button = OverlayButton(
            label: Self.buttonTitle(action), hint: Self.buttonHint(action),
            symbol: Self.buttonSymbol(action), isPrimary: Self.isPrimary(action), target: self,
            action: #selector(buttonPressed(_:)))
        button.tag = Self.tag(action)
        button.toolTip = Self.buttonTooltip(action)
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
        // Said as a shape. Four capsules is already a crowded row, and the one
        // that means "go round again" is the one word a glyph replaces cleanly.
        case .regenerate: return ""
        }
    }

    /// The key that does the same thing, where there is one.
    private static func buttonHint(_ action: MinneKeyAction) -> String? {
        switch action {
        case .insert: return "↩"
        case .undo: return "⌘Z"
        case .dismiss: return "esc"
        case .regenerate: return "⌘R"
        case .copy, .retry: return nil
        }
    }

    private static func buttonSymbol(_ action: MinneKeyAction) -> String? {
        action == .regenerate ? "arrow.triangle.2.circlepath" : nil
    }

    /// The glyph capsule is the one control whose label does not say what it
    /// does, so it is the one that gets a tooltip.
    private static func buttonTooltip(_ action: MinneKeyAction) -> String? {
        action == .regenerate ? "Another take (⌘R)" : nil
    }

    private static func tag(_ action: MinneKeyAction) -> Int {
        switch action {
        case .insert: return 1
        case .copy: return 2
        case .undo: return 3
        case .dismiss: return 4
        case .retry: return 5
        case .regenerate: return 6
        }
    }

    private static func action(tag: Int) -> MinneKeyAction? {
        switch tag {
        case 1: return .insert
        case 2: return .copy
        case 3: return .undo
        case 4: return .dismiss
        case 5: return .retry
        case 6: return .regenerate
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
    /// How long key status is given to arrive before the guidance field is
    /// judged to have failed. It is granted by the window server, so it is not
    /// necessarily in hand when `makeKeyAndOrderFront` returns.
    private static let keyArrivalGrace: TimeInterval = 0.12

    private let panel: MinneKeyOverlayPanel
    private let content: MinneKeyOverlayView
    /// The caret this overlay is anchored to, in AppKit coordinates, kept so a
    /// state change can re-place a panel that just changed size.
    private var caret: CGRect = .zero
    /// The width and anchored edge claimed at presentation (US-203). Every
    /// re-placement keeps both: state changes only choose a height, and the
    /// panel grows away from the caret with its anchored edge pinned.
    private var geometry: MinneKeyOverlayGeometry?
    /// Ours rather than `panel.isVisible`, because the panel outlives its
    /// dismissal by the length of the fade — and a press during that fade must
    /// be a fresh presentation, not a toggle of a panel already on its way out.
    private var presenting = false
    /// The app that was active when guiding borrowed activation (see
    /// `beginGuiding`) — reactivated by `endGuiding`, nil the rest of the time.
    private var reactivateOnEnd: NSRunningApplication?

    private(set) var state: MinneKeyOverlayState?

    var onAction: (@MainActor (MinneKeyAction) -> Void)? {
        get { content.onAction }
        set { content.onAction = newValue }
    }

    var onGuidance: (@MainActor (String) -> Void)?

    var onDraftEdit: (@MainActor (String) -> Void)? {
        get { content.onDraftEdited }
        set { content.onDraftEdited = newValue }
    }

    var isGuiding: Bool { content.isGuiding }

    var isEditingDraft: Bool { content.isEditingDraft }

    /// Which field the borrowed keyboard belongs to right now. The two share
    /// one borrow implementation (`borrowKeyboard(for:)`); this is what keeps
    /// `endGuiding` from handing back a keyboard the draft editor is using,
    /// and the other way round.
    private enum KeyboardBorrower: String {
        case guidance = "guidance field"
        case draftEditor = "draft editor"
    }
    private var borrower: KeyboardBorrower?

    init() {
        panel = MinneKeyOverlayPanel(
            contentRect: NSRect(
                x: 0, y: 0,
                width: MinneKeyOverlayView.minContentWidth + MinneKeyOverlayView.inset.width * 2,
                height: 44),
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
        // Belt and braces around the borrowed key status: even while the panel
        // is allowed to become key, it only does so when something in it
        // actually needs the keyboard.
        panel.becomesKeyOnlyIfNeeded = true

        content.onRequestGuiding = { [weak self] in self?.beginGuiding() }
        content.onGuidanceCancelled = { [weak self] in self?.endGuiding() }
        // Escape in the draft editor: back to the read-only result, edits kept.
        content.onDraftEditCancelled = { [weak self] in self?.endEditingDraft() }
        // A steer being typed can wrap onto another line; the panel grows
        // downward to make room, exactly as it does when a state changes.
        content.onGuidanceGrew = { [weak self] in
            guard let self, self.presenting else { return }
            self.place(animated: true)
        }
        content.onDraftEditorGrew = { [weak self] in
            guard let self, self.presenting else { return }
            self.place(animated: true)
        }
        content.onGuidanceSubmitted = { [weak self] steer in
            guard let self else { return }
            // Key goes back to the app being written into *before* the steer is
            // acted on: what follows is a request, and what follows that may be
            // an insertion that types into whoever holds the keyboard.
            endGuiding()
            onGuidance?(steer)
        }
    }

    var isPresenting: Bool { presenting }

    func present(_ target: CaretTarget, state: MinneKeyOverlayState) {
        self.state = state
        presenting = true
        // A fresh press inherits nothing from the last one — no steers, no
        // half-finished edit, and certainly not the keyboard.
        panel.wantsKey = false
        borrower = nil
        content.render(guidance: [])
        content.endGuiding()
        _ = content.endDraftEditing()
        caret = OverlayPlacement.flipped(
            target.anchor.rect, primaryHeight: Self.primaryScreenHeight())
        // A fresh press starts at the width its opening state deserves —
        // compact while thinking, wider at once when it opens straight onto a
        // draft (previews do).
        let visible = Self.screen(containing: caret).visibleFrame
        content.setContentWidth(
            OverlayWidth.content(forDraftCharacters: Self.draftCharacters(state), visible: visible))
        content.render(target, state: state)

        // The geometry is claimed here, once: the size the panel opens at
        // decides its width and which edge is pinned, and every state after
        // this one only chooses a height — except a draft earning a wider
        // panel, which grows the width through `widened` and nothing else.
        panel.contentView?.layoutSubtreeIfNeeded()
        let size = panel.contentView?.fittingSize ?? panel.frame.size
        geometry = MinneKeyOverlayGeometry.claim(size: size, caret: caret, visible: visible)
        let frame = place(animated: false)
        // A short rise from just below where it settles: it reads as the panel
        // arriving at the caret rather than being switched on. Skipped, along
        // with every other movement, for a user who asked motion to be reduced.
        let rise = Self.reduceMotion ? 0 : Self.rise
        panel.setFrame(frame.offsetBy(dx: 0, dy: -rise), display: false)
        panel.alphaValue = 0
        // `orderFrontRegardless`, never `makeKeyAndOrderFront`: the second would
        // pull focus away from the field the overlay is pointing at, and Minne
        // is an accessory app that is not even active.
        panel.orderFrontRegardless()
        NSAnimationContext.runAnimationGroup { context in
            context.duration = Self.duration(Self.appearDuration)
            context.timingFunction = CAMediaTimingFunction(name: .easeOut)
            panel.animator().alphaValue = 1
            panel.animator().setFrame(frame, display: true)
        }
    }

    func update(_ state: MinneKeyOverlayState) {
        guard presenting else { return }
        // A new state supersedes an edit in progress. Nothing is lost: every
        // keystroke already reached the controller through `onDraftEdit`, so
        // whatever produced this state acted on the edited text.
        endEditingDraft()
        self.state = state
        widen(for: state)
        content.render(state)
        // A state with no draft on screen has no field to type into either, so
        // whatever the user had started typing is abandoned along with it —
        // and the keyboard goes back where it came from.
        if !state.isDraftOnScreen { endGuiding() }
        place(animated: true)
    }

    /// The draft that decides the panel's width, when the state carries one.
    private static func draftCharacters(_ state: MinneKeyOverlayState) -> Int? {
        switch state {
        case .result(let text, _): return text.count
        case .reworking(_, let previous): return previous.count
        default: return nil
        }
    }

    /// Grows the claimed geometry to the width this state's draft deserves.
    /// Only ever grows — a rework that came back shorter keeps the width the
    /// press already earned, so nothing on screen shuffles — and the content
    /// grid moves with it in the same layout pass.
    private func widen(for state: MinneKeyOverlayState) {
        guard let characters = Self.draftCharacters(state), let claimed = geometry else { return }
        let visible = Self.screen(containing: caret).visibleFrame
        let wanted = OverlayWidth.content(forDraftCharacters: characters, visible: visible)
        let panelWidth = wanted + MinneKeyOverlayView.inset.width * 2
        guard panelWidth > claimed.width else { return }
        content.setContentWidth(wanted)
        geometry = claimed.widened(to: panelWidth, visible: visible)
    }

    func update(guidance: [String]) {
        content.render(guidance: guidance)
        guard presenting else { return }
        place(animated: true)
    }

    /// Borrows the keyboard for the guidance field.
    ///
    /// `makeKeyAndOrderFront` on a non-activating panel gives it key status
    /// **without** activating Minne: the target app stays the active app and
    /// keeps its own first responder, it simply stops receiving keystrokes for
    /// as long as the field has them. That is the whole trick, and the reason
    /// `canBecomeKey` is a variable — a panel that could always become key
    /// would take the caret every time it appeared.
    ///
    /// One deliberate exception to "Minne never activates": **while the
    /// guidance field is being edited, Minne becomes the active app.** Voice
    /// dictation tools (Wispr Flow, macOS Dictation) find their target through
    /// the system-wide Accessibility focus, which only resolves through the
    /// active application — a key-but-not-active panel is invisible to them,
    /// so dictating a steer failed with "no cursor found" (verified live with
    /// Wispr Flow, 2026-08-19). The app that was active is remembered and
    /// reactivated the moment guiding ends, and the controller's app-switch
    /// observer knows that reactivation is not the user leaving.
    func beginGuiding() {
        guard presenting, state?.isDraftOnScreen == true, !content.isGuiding else { return }
        borrowKeyboard(for: .guidance)
    }

    @discardableResult
    func endGuiding() -> Bool {
        content.endGuiding()
        // Only a keyboard borrowed *for the guidance field* is handed back
        // here — the draft editor may be holding it, and it hands back its own.
        guard borrower == .guidance else { return false }
        return handBackKeyboard()
    }

    /// Turns the finished draft into an editor (US-202) — the same borrow as
    /// guiding, pointed at the other field.
    func beginEditingDraft() {
        guard presenting, let current = state, case .result(let text, _) = current,
            !content.isEditingDraft
        else { return }
        // Clicking into the draft while the guidance field had the keyboard is
        // a change of mind: the half-typed steer is abandoned (as it is on any
        // state change) and the borrow simply moves to the editor — the
        // keyboard never travels back to the app in between.
        if borrower == .guidance { content.endGuiding() }
        content.beginDraftEditing(text: text)
        borrowKeyboard(for: .draftEditor)
    }

    @discardableResult
    func endEditingDraft() -> Bool {
        if let edited = content.endDraftEditing() {
            // The edits are kept: the read-only result the panel goes back to
            // *is* the edited text, so Insert, ⌘R and a steer all act on what
            // the user sees — and a later `beginEditingDraft` reopens it.
            if let current = state, case .result(_, let grounding) = current {
                let kept = MinneKeyOverlayState.result(edited, grounding: grounding)
                state = kept
                content.render(kept)
                place(animated: true)
            }
        }
        guard borrower == .draftEditor else { return false }
        return handBackKeyboard()
    }

    /// One borrow for both fields — everything the comment on `beginGuiding`
    /// says, shared. First responder is set *before* asking for key: with
    /// `becomesKeyOnlyIfNeeded` the panel takes key only when something in it
    /// needs the keyboard, and asking first is a panel that needs nothing —
    /// the field then draws focused and never gets a caret.
    private func borrowKeyboard(for newBorrower: KeyboardBorrower) {
        borrower = newBorrower
        panel.wantsKey = true
        focus(newBorrower)
        panel.makeKeyAndOrderFront(nil)
        if !NSApp.isActive {
            reactivateOnEnd = NSWorkspace.shared.frontmostApplication
            NSApp.activate(ignoringOtherApps: true)
        }
        // Key status is granted by the window server and need not have arrived
        // by the time that call returns. One re-assert on the next pass, so a
        // field that did not take the caret first time still gets it rather
        // than leaving a panel that looks focused and is not — and the log
        // then says what actually happened, which is the only way to tell a
        // borrowed keyboard from a panel that merely looks focused.
        DispatchQueue.main.asyncAfter(deadline: .now() + Self.keyArrivalGrace) { [weak self] in
            MainActor.assumeIsolated {
                guard let self, self.panel.wantsKey, self.borrower == newBorrower else { return }
                if !self.hasCaret(newBorrower) { self.focus(newBorrower) }
                // The field editor is rebuilt on the way to key status, so the
                // focused look has to be repainted from where the caret ended up.
                self.refreshLook(newBorrower)
                // The failsafe. A field that looks focused but does not have
                // the keyboard is worse than no field at all: the user would
                // type straight into the document they are writing. If key did
                // not arrive, put the field back and say so.
                guard self.panel.isKeyWindow else {
                    BrainClient.log(
                        "minne key: the keyboard could not be borrowed — "
                            + "\(newBorrower.rawValue) closed")
                    self.end(newBorrower)
                    return
                }
                BrainClient.log(
                    "minne key: \(newBorrower.rawValue) has the keyboard "
                        + "(caret \(self.hasCaret(newBorrower)), Minne active \(NSApp.isActive), "
                        + "AX sees \(Self.selfAccessibilityFocus()))"
                )
            }
        }
    }

    private func focus(_ borrower: KeyboardBorrower) {
        switch borrower {
        case .guidance: content.beginGuiding()
        case .draftEditor: content.focusDraftEditor()
        }
    }

    private func hasCaret(_ borrower: KeyboardBorrower) -> Bool {
        switch borrower {
        case .guidance: return content.guidanceHasCaret
        case .draftEditor: return content.draftEditorHasCaret
        }
    }

    private func refreshLook(_ borrower: KeyboardBorrower) {
        switch borrower {
        case .guidance: content.refreshGuidingLook()
        case .draftEditor: content.refreshDraftEditingLook()
        }
    }

    private func end(_ borrower: KeyboardBorrower) {
        switch borrower {
        case .guidance: endGuiding()
        case .draftEditor: endEditingDraft()
        }
    }

    private func handBackKeyboard() -> Bool {
        guard panel.wantsKey else { return false }
        borrower = nil
        panel.wantsKey = false
        // AppKit has no "give key back" call. Ordering the panel out and
        // straight back in is the one that works: the window server hands key
        // status to the frontmost app's own window.
        panel.orderOut(nil)
        panel.orderFrontRegardless()
        // Borrowing activated Minne (see `borrowKeyboard`); activation goes
        // back to the app the overlay points at, so its field is focused again
        // before anything — an insertion, the user's next keystroke — needs
        // it. The app may have quit meanwhile; `deactivate` is the fallback
        // that hands activation to whoever is next in line.
        if let previous = reactivateOnEnd {
            reactivateOnEnd = nil
            if previous.isTerminated { NSApp.deactivate() } else { previous.activate() }
        }
        BrainClient.log("minne key: keyboard handed back to the app")
        return true
    }

    /// What Minne's own accessibility reports as focused — the exact lookup a
    /// dictation tool makes (through the app element; the system-wide one
    /// resolves here once Minne is active). Diagnostic for the guiding log
    /// line: "window+element" is a field Wispr Flow can find, anything else
    /// is why it cannot.
    private static func selfAccessibilityFocus() -> String {
        let app = AXUIElementCreateApplication(ProcessInfo.processInfo.processIdentifier)
        var window: CFTypeRef?
        let hasWindow =
            AXUIElementCopyAttributeValue(app, kAXFocusedWindowAttribute as CFString, &window)
            == .success
        var element: CFTypeRef?
        let hasElement =
            AXUIElementCopyAttributeValue(app, kAXFocusedUIElementAttribute as CFString, &element)
            == .success
        var role = "?"
        if hasElement, let element, CFGetTypeID(element) == AXUIElementGetTypeID() {
            var value: CFTypeRef?
            AXUIElementCopyAttributeValue(
                element as! AXUIElement, kAXRoleAttribute as CFString, &value)
            role = value as? String ?? "?"
        }
        let selfView: String
        switch (hasWindow, hasElement) {
        case (true, true): selfView = "window+element(\(role))"
        case (true, false): selfView = "window only"
        case (false, true): selfView = "element(\(role)) only"
        case (false, false): selfView = "nothing"
        }
        return "\(selfView); systemwide → \(systemwideFocus())"
    }

    /// The window server's answer to "who is focused" — the step a dictation
    /// tool takes BEFORE looking inside any app. An accessory app that is
    /// active but not reported here is invisible to dictation no matter how
    /// good its own tree is.
    private static func systemwideFocus() -> String {
        let systemwide = AXUIElementCreateSystemWide()
        var value: CFTypeRef?
        let err = AXUIElementCopyAttributeValue(
            systemwide, kAXFocusedUIElementAttribute as CFString, &value)
        guard err == .success, let value, CFGetTypeID(value) == AXUIElementGetTypeID() else {
            return "error \(err.rawValue)"
        }
        let element = value as! AXUIElement
        var pid: pid_t = 0
        AXUIElementGetPid(element, &pid)
        var roleValue: CFTypeRef?
        AXUIElementCopyAttributeValue(element, kAXRoleAttribute as CFString, &roleValue)
        let role = roleValue as? String ?? "?"
        let ours = pid == ProcessInfo.processInfo.processIdentifier
        return "\(role) in \(ours ? "Minne" : "pid \(pid)")"
    }

    /// Debug hook: paints the guidance field as focused without borrowing the
    /// keyboard, so `-minneKeyPreview guiding` can be screenshotted on a
    /// machine somebody else is typing on.
    func previewGuiding() {
        BrainClient.log(
            "minne key: preview guiding, look only (caret \(content.guidanceHasCaret))")
        content.showGuidingLook()
        place(animated: false)
    }

    /// Debug hook: seeds the guidance field with text as if it had been typed,
    /// so the wrapped and internally-scrolling field states can be
    /// screenshotted without a keyboard to take.
    func previewGuidance(text: String) {
        content.previewGuidanceText(text)
        place(animated: false)
    }

    /// Debug hook: the draft editor's focused look without borrowing the
    /// keyboard, so `-minneKeyPreview editing` can be screenshotted on a
    /// machine somebody else is typing on. `-minneKeyPreviewEditing key` asks
    /// for the real borrow instead, via `beginEditingDraft`.
    func previewDraftEditing() {
        guard let current = state, case .result(let text, _) = current else { return }
        BrainClient.log("minne key: preview draft editing, look only")
        content.beginDraftEditing(text: text)
        content.showDraftEditingLook()
        place(animated: false)
    }

    func dismiss() {
        state = nil
        guard presenting else { return }
        presenting = false
        endEditingDraft()
        endGuiding()
        NSAnimationContext.runAnimationGroup { context in
            context.duration = Self.duration(Self.disappearDuration)
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

    func draftContains(quartzPoint: CGPoint) -> Bool {
        guard presenting, let rect = content.draftFrameOnScreen() else { return false }
        let point = CGPoint(
            x: quartzPoint.x, y: Self.primaryScreenHeight() - quartzPoint.y)
        return rect.contains(point)
    }

    /// Re-measures and re-places. Called on every state change because the
    /// panel grows by the height of a draft — animated once it is on screen,
    /// so a draft arriving unfolds rather than jumps. The claimed geometry
    /// does the deciding: the width and the anchored edge never move, only
    /// the height is read off the content, and a state whose content asks for
    /// nothing new leaves the frame exactly alone.
    @discardableResult
    private func place(animated: Bool) -> NSRect {
        panel.contentView?.layoutSubtreeIfNeeded()
        let size = panel.contentView?.fittingSize ?? panel.frame.size
        let visible = Self.screen(containing: caret).visibleFrame
        let geometry =
            geometry ?? MinneKeyOverlayGeometry.claim(size: size, caret: caret, visible: visible)
        let frame = geometry.frame(height: size.height, visible: visible)
        guard frame != panel.frame else { return frame }
        if animated, !Self.reduceMotion {
            NSAnimationContext.runAnimationGroup { context in
                context.duration = Self.resizeDuration
                context.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
                panel.animator().setFrame(frame, display: true)
            }
        } else {
            panel.setFrame(frame, display: true)
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
    /// an overlay clamped to the primary one. The pick itself is pure
    /// (`MinneKeyOverlayGeometry.screenIndex`): midpoint-contains, which is
    /// deterministic for a caret on the shared edge between two displays and
    /// testable without a window server — see the comment there.
    private static func screen(containing rect: CGRect) -> NSScreen {
        let screens = NSScreen.screens
        if let index = MinneKeyOverlayGeometry.screenIndex(
            containing: rect, frames: screens.map(\.frame))
        {
            return screens[index]
        }
        return NSScreen.main ?? NSScreen.screens[0]
    }

    /// Whether the user asked the system to reduce motion — the panel then
    /// appears, resizes and leaves without animating.
    private static var reduceMotion: Bool {
        NSWorkspace.shared.accessibilityDisplayShouldReduceMotion
    }

    private static func duration(_ base: TimeInterval) -> TimeInterval {
        reduceMotion ? 0 : base
    }
}
