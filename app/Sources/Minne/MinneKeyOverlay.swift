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
    /// The finished draft, waiting for the user to accept it.
    case result(String)
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
    /// Whether the guidance field is being edited — which is also the only
    /// moment the panel holds key status, and therefore the moment at which the
    /// event tap must claim no keys at all.
    var isGuiding: Bool { get }
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
    func dismiss()
    /// Whether a screen point (Quartz coordinates, as event taps report them)
    /// falls inside the overlay.
    func contains(quartzPoint: CGPoint) -> Bool
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
    static let cornerRadius: CGFloat = 14

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
    private static let dotSize: CGFloat = 4.5
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
    private static let barHeight: CGFloat = 8
    private static let gap: CGFloat = 8
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
    /// Kept because assigning `attributedTitle` overwrites `title` with the
    /// whole rendered string — building the next title from `title` would
    /// append the key hint again, and again.
    private let label: String
    /// An SF Symbol before the label, for the one capsule that says what it
    /// does better as a shape than as a word.
    private let symbol: String?
    private let isPrimary: Bool
    private var isHovered = false

    private static let height: CGFloat = 24
    private static let horizontalPadding: CGFloat = 13
    /// A glyph-only capsule is padded a little tighter: a symbol has no side
    /// bearing, so the same padding around one looks wider than around a word.
    private static let glyphPadding: CGFloat = 10

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
                    .font: NSFont.systemFont(ofSize: 11.5, weight: isPrimary ? .semibold : .medium),
                    .foregroundColor: ink,
                ]))
        if let hint {
            text.append(
                NSAttributedString(
                    string: "  \(hint)",
                    attributes: [
                        .font: NSFont.systemFont(ofSize: 11),
                        .foregroundColor: isPrimary
                            ? OverlayPalette.onBlue.withAlphaComponent(0.7)
                            : OverlayPalette.inkTertiary,
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
                    NSImage.SymbolConfiguration(pointSize: 11.5, weight: .semibold)),
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
    /// The panel's width, less the column's insets. A wrapping label needs to
    /// be told the width it may wrap at before it has one.
    static let contentWidth: CGFloat = 340
    /// Characters of draft shown before the preview elides. A long draft is
    /// still inserted whole — this is a HUD at someone's caret, not a document
    /// view. Elided by hand rather than by `lineBreakMode`: a wrapping label
    /// asked to truncate stops wrapping and puts the whole draft on one line.
    static let maxPreviewCharacters = 600
    /// The one internal grid. Every child of the panel — the spark, the status
    /// line, the draft, the first capsule — starts at `inset.width` from the
    /// panel's border and nothing starts anywhere else; top and bottom are equal.
    static let inset = NSSize(width: 14, height: 14)

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

    private let spark = NSImageView()
    private let title = NSTextField(labelWithString: "Minne")
    private let separator = NSTextField(labelWithString: "·")
    private let app = NSTextField(labelWithString: "")
    private let dots = ThinkingDots(frame: .zero)
    /// Marks the two states that are an outcome rather than a progress report:
    /// a blue tick when the draft landed, a warm mark when it did not.
    private let outcome = NSImageView()
    private let status = NSTextField(labelWithString: "")
    private let draft = DraftLabel()
    private let shimmer = ShimmerLines(frame: .zero)
    private let rule = OverlayRule(frame: .zero)
    private let guidance = GuidanceRow(frame: .zero)
    private let buttons = NSStackView()
    private let column = NSStackView()

    /// Whether the guidance field is being edited.
    var isGuiding: Bool { guidance.isEditing }
    /// Whether the caret really landed in it.
    var guidanceHasCaret: Bool { guidance.hasCaret }

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
        spark.symbolConfiguration = NSImage.SymbolConfiguration(pointSize: 11.5, weight: .semibold)
        spark.contentTintColor = OverlayPalette.blue
        spark.setContentHuggingPriority(.required, for: .horizontal)
        spark.setContentCompressionResistancePriority(.required, for: .horizontal)

        title.font = .systemFont(ofSize: 12.5, weight: .semibold)
        title.textColor = OverlayPalette.ink
        separator.font = .systemFont(ofSize: 11.5)
        separator.textColor = OverlayPalette.inkTertiary
        separator.setContentHuggingPriority(.required, for: .horizontal)
        app.font = .systemFont(ofSize: 11.5)
        app.textColor = OverlayPalette.inkTertiary
        app.lineBreakMode = .byTruncatingTail
        app.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
    }

    private func buildBody() {
        // Outlines rather than `.fill` symbols: an outcome is said in one line
        // of coloured ink and one hairline glyph — the panel never grows a
        // coloured block to say it.
        outcome.symbolConfiguration = NSImage.SymbolConfiguration(pointSize: 10.5, weight: .medium)
        outcome.setContentHuggingPriority(.required, for: .horizontal)

        status.font = .systemFont(ofSize: 11.5)
        status.textColor = OverlayPalette.inkSecondary
        status.lineBreakMode = .byWordWrapping
        status.maximumNumberOfLines = 3
        status.preferredMaxLayoutWidth = Self.contentWidth - Self.outcomeColumn

        draft.isSelectable = true
        draft.textColor = OverlayPalette.ink
        // A wrapping label with no width yet lays out on one endless line, and
        // the panel then reports a fitting size wider than the screen. Telling
        // it the width up front is what makes the draft wrap — and the width is
        // the grid's, since the draft now sits on the panel's own surface.
        draft.preferredMaxLayoutWidth = Self.contentWidth

        buttons.orientation = .horizontal
        buttons.alignment = .centerY
        buttons.spacing = 7

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

        let statusRow = NSStackView(views: [outcome, status])
        statusRow.orientation = .horizontal
        statusRow.alignment = .firstBaseline
        statusRow.spacing = 5

        column.setViews([header, rule, statusRow, shimmer, draft, guidance, buttons], in: .top)
        // Air, in three sizes: tight around the rule, a line's worth before the
        // draft, and a little more before the row of capsules.
        column.setCustomSpacing(9, after: header)
        column.setCustomSpacing(9, after: rule)
        column.setCustomSpacing(11, after: statusRow)
        column.setCustomSpacing(13, after: shimmer)
        column.setCustomSpacing(13, after: draft)
        column.setCustomSpacing(12, after: guidance)
        NSLayoutConstraint.activate([
            header.widthAnchor.constraint(equalToConstant: Self.contentWidth),
            rule.widthAnchor.constraint(equalToConstant: Self.contentWidth),
            shimmer.widthAnchor.constraint(equalToConstant: Self.contentWidth),
            guidance.widthAnchor.constraint(equalToConstant: Self.contentWidth),
            draft.widthAnchor.constraint(lessThanOrEqualToConstant: Self.contentWidth),
            statusRow.widthAnchor.constraint(lessThanOrEqualToConstant: Self.contentWidth),
        ])
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
        case .result(let text):
            show(
                status: "Draft ready", state: state, draft: text,
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
        actions: [MinneKeyAction]
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

        draft.attributedStringValue =
            body.map { Self.body(Self.preview($0), elided: $0.count > Self.maxPreviewCharacters) }
            ?? NSAttributedString()
        draft.isHidden = body == nil
        if case .reworking = state { draft.startSweep() } else { draft.stopSweep() }

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

    /// The draft, set with a little air between its lines — it is the one
    /// paragraph of prose in the panel and the thing being judged.
    ///
    /// The elision note is the one thing here that is not the draft, so it is
    /// set as an aside: smaller, and in the ink the app's own name uses.
    static func body(_ text: String, elided: Bool) -> NSAttributedString {
        let paragraph = NSMutableParagraphStyle()
        paragraph.lineSpacing = 3
        let body = NSMutableAttributedString(
            string: text,
            attributes: [
                .font: NSFont.systemFont(ofSize: 12.5),
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
                    .font: NSFont.systemFont(ofSize: 11),
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
    /// Ours rather than `panel.isVisible`, because the panel outlives its
    /// dismissal by the length of the fade — and a press during that fade must
    /// be a fresh presentation, not a toggle of a panel already on its way out.
    private var presenting = false

    private(set) var state: MinneKeyOverlayState?

    var onAction: (@MainActor (MinneKeyAction) -> Void)? {
        get { content.onAction }
        set { content.onAction = newValue }
    }

    var onGuidance: (@MainActor (String) -> Void)?

    var isGuiding: Bool { content.isGuiding }

    init() {
        panel = MinneKeyOverlayPanel(
            contentRect: NSRect(
                x: 0, y: 0,
                width: MinneKeyOverlayView.contentWidth + MinneKeyOverlayView.inset.width * 2,
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
        // A fresh press inherits nothing from the last one — no steers, and
        // certainly not the keyboard.
        panel.wantsKey = false
        content.render(guidance: [])
        content.endGuiding()
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
        // A state with no draft on screen has no field to type into either, so
        // whatever the user had started typing is abandoned along with it —
        // and the keyboard goes back where it came from.
        if !state.isDraftOnScreen { endGuiding() }
        place(animated: true)
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
    func beginGuiding() {
        guard presenting, state?.isDraftOnScreen == true, !content.isGuiding else { return }
        panel.wantsKey = true
        // First responder *before* asking for key, not after: with
        // `becomesKeyOnlyIfNeeded` the panel takes key only when something in
        // it needs the keyboard, and asking first is a panel that needs
        // nothing — which is exactly how this went wrong the first time (the
        // field drew unfocused and never got a caret).
        content.beginGuiding()
        panel.makeKeyAndOrderFront(nil)
        // Key status is granted by the window server and need not have arrived
        // by the time that call returns. One re-assert on the next pass, so a
        // field that did not take the caret first time still gets it rather
        // than leaving a panel that looks focused and is not — and the log
        // then says what actually happened, which is the only way to tell a
        // borrowed keyboard from a panel that merely looks focused.
        DispatchQueue.main.asyncAfter(deadline: .now() + Self.keyArrivalGrace) { [weak self] in
            MainActor.assumeIsolated {
                guard let self, self.panel.wantsKey else { return }
                if !self.content.guidanceHasCaret { self.content.beginGuiding() }
                // The field editor is rebuilt on the way to key status, so the
                // focus ring has to be repainted from where the caret ended up.
                self.content.refreshGuidingLook()
                // The failsafe. A field that looks focused but does not have
                // the keyboard is worse than no field at all: the user would
                // type their steer straight into the document they are writing.
                // If key did not arrive, put the field back and say so.
                guard self.panel.isKeyWindow else {
                    BrainClient.log("minne key: the keyboard could not be borrowed — field closed")
                    self.endGuiding()
                    return
                }
                BrainClient.log(
                    "minne key: guidance field has the keyboard "
                        + "(caret \(self.content.guidanceHasCaret), Minne active \(NSApp.isActive))"
                )
            }
        }
    }

    @discardableResult
    func endGuiding() -> Bool {
        let hadKey = panel.wantsKey
        content.endGuiding()
        guard hadKey else { return false }
        panel.wantsKey = false
        // AppKit has no "give key back" call. Ordering the panel out and
        // straight back in is the one that works: the window server hands key
        // status to the frontmost app's own window, which — because Minne was
        // never activated — is the field this overlay is pointing at.
        panel.orderOut(nil)
        panel.orderFrontRegardless()
        BrainClient.log("minne key: keyboard handed back to the app")
        return true
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

    func dismiss() {
        state = nil
        guard presenting else { return }
        presenting = false
        endGuiding()
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
