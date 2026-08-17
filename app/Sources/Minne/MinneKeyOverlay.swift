import AppKit

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

/// A button in a window that is never key.
///
/// `acceptsFirstMouse` is the whole point: without it the first click on a
/// panel belonging to an inactive app is swallowed as an activation click, so
/// every button would need pressing twice — and the second press would arrive
/// after the app underneath had already lost focus.
private final class ClickThroughButton: NSButton {
    override func acceptsFirstMouse(for event: NSEvent?) -> Bool { true }
}

/// The overlay's contents: a line saying what is happening, the draft when
/// there is one, and the buttons that state offers.
@MainActor
final class MinneKeyOverlayView: NSView {
    /// The panel's width, less the column's insets. A wrapping label needs to
    /// be told the width it may wrap at before it has one.
    static let contentWidth: CGFloat = 336
    /// Characters of draft shown before the preview elides. A long draft is
    /// still inserted whole — this is a HUD at someone's caret, not a document
    /// view. Elided by hand rather than by `lineBreakMode`: a wrapping label
    /// asked to truncate stops wrapping and puts the whole draft on one line.
    static let maxPreviewCharacters = 600

    var onAction: (@MainActor (MinneKeyAction) -> Void)?

    private let mark = NSTextField(labelWithString: "✳︎")
    private let title = NSTextField(labelWithString: "Minne")
    private let hint = NSTextField(labelWithString: "")
    private let spinner = NSProgressIndicator()
    private let draft = NSTextField(wrappingLabelWithString: "")
    private let buttons = NSStackView()
    private let column = NSStackView()

    override init(frame frameRect: NSRect) {
        super.init(frame: frameRect)

        mark.font = .systemFont(ofSize: 15, weight: .medium)
        mark.textColor = .controlAccentColor
        title.font = .systemFont(ofSize: 13, weight: .semibold)
        hint.font = .systemFont(ofSize: 11)
        hint.textColor = .secondaryLabelColor
        hint.lineBreakMode = .byTruncatingTail

        spinner.style = .spinning
        spinner.controlSize = .small
        spinner.isDisplayedWhenStopped = false

        let text = NSStackView(views: [title, hint])
        text.orientation = .vertical
        text.alignment = .leading
        text.spacing = 1
        let header = NSStackView(views: [mark, text, spinner])
        header.orientation = .horizontal
        header.alignment = .centerY
        header.spacing = 8

        draft.font = .systemFont(ofSize: 12)
        // Selectable so the user can pick a sentence out of a draft they only
        // half want — a click inside the panel does not dismiss it.
        draft.isSelectable = true
        // A wrapping label with no width yet lays out on one endless line, and
        // the panel then reports a fitting size wider than the screen. Telling
        // it the width up front is what makes the draft wrap.
        draft.preferredMaxLayoutWidth = Self.contentWidth

        buttons.orientation = .horizontal
        buttons.alignment = .centerY
        buttons.spacing = 8

        column.orientation = .vertical
        column.alignment = .leading
        column.spacing = 8
        column.setViews([header, draft, buttons], in: .top)
        column.translatesAutoresizingMaskIntoConstraints = false
        addSubview(column)
        NSLayoutConstraint.activate([
            column.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 12),
            column.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -12),
            column.topAnchor.constraint(equalTo: topAnchor, constant: 9),
            column.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -9),
            draft.widthAnchor.constraint(equalToConstant: Self.contentWidth),
        ])
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("not used") }

    func render(_ target: CaretTarget, state: MinneKeyOverlayState) {
        title.stringValue = "Minne · \(target.appName)"
        render(state)
    }

    func render(_ state: MinneKeyOverlayState) {
        switch state {
        case .working(let mode):
            show(hint: mode.progressLabel, spinning: true, draft: nil, actions: [.dismiss])
        case .consulting(_, let tool):
            show(
                hint: Self.toolLabel(tool), spinning: true, draft: nil,
                actions: [.dismiss])
        case .result(let text):
            show(
                hint: "return to insert · esc to discard", spinning: false, draft: text,
                actions: [.insert, .copy, .dismiss])
        case .inserted(let method):
            show(
                hint: "Inserted (\(method.label)) · ⌘Z to undo", spinning: false, draft: nil,
                actions: [.undo, .dismiss])
        case .undone:
            show(
                hint: "Undone — the field is as it was", spinning: false, draft: nil,
                actions: [.dismiss])
        case .failed(let message):
            show(hint: message, spinning: false, draft: nil, actions: [.retry, .dismiss])
        }
    }

    /// "searching memory…" rather than the tool's name: the user is waiting on
    /// a sentence, not reading a trace.
    private static func toolLabel(_ tool: String) -> String {
        switch tool {
        case "search_memory": return "Searching your memory…"
        case "read_page", "list_index": return "Reading your memory…"
        default: return "Working…"
        }
    }

    private func show(
        hint text: String, spinning: Bool, draft body: String?, actions: [MinneKeyAction]
    ) {
        hint.stringValue = text
        if spinning { spinner.startAnimation(nil) } else { spinner.stopAnimation(nil) }

        draft.stringValue = body.map { Self.preview($0) } ?? ""
        draft.isHidden = body == nil

        buttons.setViews(actions.map(button(for:)), in: .leading)
        buttons.isHidden = actions.isEmpty
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
        let button = ClickThroughButton(
            title: Self.buttonTitle(action), target: self, action: #selector(buttonPressed(_:)))
        button.bezelStyle = .rounded
        button.controlSize = .small
        button.font = .systemFont(ofSize: 11)
        button.tag = Self.tag(action)
        if action == .insert { button.keyEquivalent = "" }
        return button
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
    private let panel: MinneKeyOverlayPanel
    private let content: MinneKeyOverlayView
    /// The caret this overlay is anchored to, in AppKit coordinates, kept so a
    /// state change can re-place a panel that just changed size.
    private var caret: CGRect = .zero

    private(set) var state: MinneKeyOverlayState?

    var onAction: (@MainActor (MinneKeyAction) -> Void)? {
        get { content.onAction }
        set { content.onAction = newValue }
    }

    init() {
        panel = MinneKeyOverlayPanel(
            contentRect: NSRect(x: 0, y: 0, width: 360, height: 44),
            styleMask: [.borderless, .nonactivatingPanel],
            backing: .buffered,
            defer: false)

        let effect = NSVisualEffectView()
        effect.material = .hudWindow
        effect.blendingMode = .behindWindow
        effect.state = .active
        effect.wantsLayer = true
        effect.layer?.cornerRadius = 11
        effect.layer?.masksToBounds = true

        content = MinneKeyOverlayView(frame: .zero)
        content.translatesAutoresizingMaskIntoConstraints = false
        effect.addSubview(content)
        NSLayoutConstraint.activate([
            content.leadingAnchor.constraint(equalTo: effect.leadingAnchor),
            content.trailingAnchor.constraint(equalTo: effect.trailingAnchor),
            content.topAnchor.constraint(equalTo: effect.topAnchor),
            content.bottomAnchor.constraint(equalTo: effect.bottomAnchor),
            content.widthAnchor.constraint(
                equalToConstant: MinneKeyOverlayView.contentWidth + 24),
        ])

        panel.contentView = effect
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

    var isPresenting: Bool { panel.isVisible }

    func present(_ target: CaretTarget, state: MinneKeyOverlayState) {
        self.state = state
        content.render(target, state: state)
        caret = OverlayPlacement.flipped(
            target.anchor.rect, primaryHeight: Self.primaryScreenHeight())
        place()
        // `orderFrontRegardless`, never `makeKeyAndOrderFront`: the second would
        // pull focus away from the field the overlay is pointing at, and Minne
        // is an accessory app that is not even active.
        panel.orderFrontRegardless()
    }

    func update(_ state: MinneKeyOverlayState) {
        guard panel.isVisible else { return }
        self.state = state
        content.render(state)
        place()
    }

    func dismiss() {
        state = nil
        guard panel.isVisible else { return }
        panel.orderOut(nil)
    }

    func contains(quartzPoint: CGPoint) -> Bool {
        guard panel.isVisible else { return false }
        let point = CGPoint(
            x: quartzPoint.x, y: Self.primaryScreenHeight() - quartzPoint.y)
        return panel.frame.contains(point)
    }

    /// Re-measures and re-places. Called on every state change because the
    /// panel grows by the height of a draft and has to stay next to the caret
    /// while it does.
    private func place() {
        panel.contentView?.layoutSubtreeIfNeeded()
        let size = panel.contentView?.fittingSize ?? panel.frame.size
        let visible = Self.screen(containing: caret).visibleFrame
        let frame = OverlayPlacement.frame(for: size, caret: caret, visible: visible)
        panel.setFrame(frame, display: true)
        BrainClient.log(
            "minne key: overlay at (\(Int(frame.minX)), \(Int(frame.minY))) "
                + "\(Int(frame.width))×\(Int(frame.height))")
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
