import AppKit

/// Minne's mark: the four-pointed spark from the app icon.
///
/// The onboarding uses it as its progress indicator — hollow for a step not
/// reached, haloed for the live one, solid for one already done — and as the
/// bullet on "what it does". It is drawn rather than shipped as an image so it
/// stays crisp at 11pt and picks up the theme's colours directly.
enum SparkGlyph {

    /// The path in the icon's own 64×64 space, y-down as authored in the SVG.
    /// Every point here is lifted verbatim from `site/assets/favicon.svg`, so
    /// the menu-bar icon, the site and this glyph cannot drift apart.
    private static let designSize: CGFloat = 64

    /// The spark, fitted to `rect` and centred in it.
    ///
    /// The authored path does not fill its own 64pt box — it spans x 0.3–60
    /// and y 8–64 — so scaling by `size / 64` would leave the mark visibly low
    /// and left of centre. The transform is therefore derived from the path's
    /// real bounds: fit uniformly, then centre. Uniformly matters as much as
    /// centred, because a stretched spark reads as a different logo.
    static func path(in rect: NSRect) -> NSBezierPath {
        let path = designPath()
        let bounds = path.bounds
        guard bounds.width > 0, bounds.height > 0 else { return path }

        let scale = min(rect.width / bounds.width, rect.height / bounds.height)
        // Read bottom-up, the way the point travels: shift the path's own
        // centre onto the origin, scale it there, then move it to the rect's
        // centre. Composing a scale and a translation the other way round
        // scales the offset too, which is what puts the mark off-centre.
        var fit = AffineTransform.identity
        fit.translate(x: rect.midX, y: rect.midY)
        fit.scale(scale)
        fit.translate(x: -bounds.midX, y: -bounds.midY)
        path.transform(using: fit)
        return path
    }

    /// The mark in its own space, already flipped for AppKit's y-up geometry.
    /// Every point is lifted verbatim from the SVG, so the menu-bar icon, the
    /// site and this glyph cannot drift apart.
    private static func designPath() -> NSBezierPath {
        let path = NSBezierPath()

        // Authored in SVG coordinates, which run y-down; `point` flips them.
        func point(_ x: CGFloat, _ y: CGFloat) -> NSPoint {
            NSPoint(x: x, y: designSize - y)
        }

        path.move(to: point(32, 8))
        path.curve(to: point(43.5, 29.9), controlPoint1: point(33.6, 20.3), controlPoint2: point(36.8, 26.4))
        path.curve(to: point(60, 34.2), controlPoint1: point(47.2, 31.8), controlPoint2: point(52, 33.1))
        path.line(to: point(60, 37.8))
        path.curve(to: point(43.5, 42.1), controlPoint1: point(52, 38.9), controlPoint2: point(47.2, 40.2))
        path.curve(to: point(32, 64), controlPoint1: point(36.8, 45.6), controlPoint2: point(33.6, 51.7))
        path.line(to: point(28.3, 64))
        path.curve(to: point(16.8, 42.1), controlPoint1: point(26.7, 51.7), controlPoint2: point(23.5, 45.6))
        path.curve(to: point(0.3, 37.8), controlPoint1: point(13.1, 40.2), controlPoint2: point(8.3, 38.9))
        path.line(to: point(0.3, 34.2))
        path.curve(to: point(16.8, 29.9), controlPoint1: point(8.3, 33.1), controlPoint2: point(13.1, 31.8))
        path.curve(to: point(28.3, 8), controlPoint1: point(23.5, 26.4), controlPoint2: point(26.7, 20.3))
        path.close()
        return path
    }
}

/// A spark at one of the three states the onboarding rail needs.
final class SparkView: NSView {
    enum State: Equatable {
        /// A step already completed: solid, but spent.
        case done
        /// The step the user is on: full accent, with a soft halo.
        case current
        /// Not reached yet: outline only.
        case upcoming
        /// A bullet on "what it does" — full accent, no halo.
        case mark
    }

    var state: State {
        didSet { if state != oldValue { needsDisplay = true } }
    }

    private let side: CGFloat

    init(state: State, side: CGFloat) {
        self.state = state
        self.side = side
        super.init(frame: NSRect(x: 0, y: 0, width: side, height: side))
        translatesAutoresizingMaskIntoConstraints = false
        setContentHuggingPriority(.required, for: .horizontal)
        setContentHuggingPriority(.required, for: .vertical)
        setContentCompressionResistancePriority(.required, for: .horizontal)
        NSLayoutConstraint.activate([
            widthAnchor.constraint(equalToConstant: side),
            heightAnchor.constraint(equalToConstant: side),
        ])
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    /// Colour alone separates the three states. An earlier version drew a halo
    /// behind the live one; at the 9pt size the footer uses, the halo covered
    /// the glyph and the mark read as a plain blue dot.
    override func draw(_ dirtyRect: NSRect) {
        let path = SparkGlyph.path(in: bounds)
        switch state {
        case .done:
            MinneTheme.accentSpent.setFill()
            path.fill()
        case .current, .mark:
            MinneTheme.accent.setFill()
            path.fill()
        case .upcoming:
            MinneTheme.sparkIdle.setStroke()
            path.lineWidth = max(1, bounds.width * 0.11)
            path.stroke()
        }
    }
}

/// The app icon at label size: the spark on its dark rounded square. Used as
/// the onboarding rail's wordmark, so the window opens with the same mark the
/// user just clicked in the Finder.
final class BrandMarkView: NSView {
    private let side: CGFloat

    init(side: CGFloat) {
        self.side = side
        super.init(frame: NSRect(x: 0, y: 0, width: side, height: side))
        translatesAutoresizingMaskIntoConstraints = false
        setContentHuggingPriority(.required, for: .horizontal)
        NSLayoutConstraint.activate([
            widthAnchor.constraint(equalToConstant: side),
            heightAnchor.constraint(equalToConstant: side),
        ])
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    override func draw(_ dirtyRect: NSRect) {
        // The icon's own corner ratio: 14 on a 64pt square.
        let radius = bounds.width * (14.0 / 64.0)
        MinneTheme.ink.setFill()
        NSBezierPath(roundedRect: bounds, xRadius: radius, yRadius: radius).fill()

        // …and its own inset: the icon scales the spark to 0.7 and centres it.
        let inset = bounds.width * 0.15
        NSColor(srgbRed: 0.204, green: 0.471, blue: 0.965, alpha: 1).setFill()
        SparkGlyph.path(in: bounds.insetBy(dx: inset, dy: inset)).fill()
    }
}
