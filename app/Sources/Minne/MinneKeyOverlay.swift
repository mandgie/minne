import AppKit

/// The overlay, as `MinneKeyController` needs it. A protocol so the
/// controller's rules — when it appears, what dismisses it — can be tested
/// without a window server.
@MainActor
protocol MinneKeyPresenting: AnyObject {
    var isPresenting: Bool { get }
    func present(_ target: CaretTarget)
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

/// The placeholder contents. US-018 replaces this view with the draft field;
/// everything around it — anchoring, ordering, dismissal — stays as it is.
@MainActor
final class MinneKeyOverlayView: NSView {
    private let title = NSTextField(labelWithString: "Minne")
    private let hint = NSTextField(labelWithString: "")

    override init(frame frameRect: NSRect) {
        super.init(frame: frameRect)

        let mark = NSTextField(labelWithString: "✳︎")
        mark.font = .systemFont(ofSize: 15, weight: .medium)
        mark.textColor = .controlAccentColor
        title.font = .systemFont(ofSize: 13, weight: .semibold)
        hint.font = .systemFont(ofSize: 11)
        hint.textColor = .secondaryLabelColor

        let text = NSStackView(views: [title, hint])
        text.orientation = .vertical
        text.alignment = .leading
        text.spacing = 1

        let row = NSStackView(views: [mark, text])
        row.orientation = .horizontal
        row.alignment = .centerY
        row.spacing = 8
        row.translatesAutoresizingMaskIntoConstraints = false
        addSubview(row)
        NSLayoutConstraint.activate([
            row.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 12),
            row.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -12),
            row.topAnchor.constraint(equalTo: topAnchor, constant: 9),
            row.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -9),
        ])
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("not used") }

    func render(_ target: CaretTarget) {
        hint.stringValue = "Ready in \(target.appName) · esc to dismiss"
    }
}

@MainActor
final class MinneKeyOverlayController: MinneKeyPresenting {
    private let panel: MinneKeyOverlayPanel
    private let content: MinneKeyOverlayView

    init() {
        panel = MinneKeyOverlayPanel(
            contentRect: NSRect(x: 0, y: 0, width: 240, height: 44),
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

    func present(_ target: CaretTarget) {
        content.render(target)

        let caret = OverlayPlacement.flipped(
            target.anchor.rect, primaryHeight: Self.primaryScreenHeight())
        let size = panel.contentView?.fittingSize ?? panel.frame.size
        let visible = Self.screen(containing: caret).visibleFrame
        panel.setFrame(
            OverlayPlacement.frame(for: size, caret: caret, visible: visible), display: true)

        // `orderFrontRegardless`, never `makeKeyAndOrderFront`: the second would
        // pull focus away from the field the overlay is pointing at, and Minne
        // is an accessory app that is not even active.
        panel.orderFrontRegardless()
    }

    func dismiss() {
        guard panel.isVisible else { return }
        panel.orderOut(nil)
    }

    func contains(quartzPoint: CGPoint) -> Bool {
        guard panel.isVisible else { return false }
        let point = CGPoint(
            x: quartzPoint.x, y: Self.primaryScreenHeight() - quartzPoint.y)
        return panel.frame.contains(point)
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
