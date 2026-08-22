import AppKit

/// A button in the product's own colours rather than the system's.
///
/// `NSButton`'s bezel follows the user's accent colour, which is exactly what
/// most apps want and exactly what this one does not: Minne's blue is part of
/// the mark. Drawing the bezel here keeps the primary action at #0A5CDE on
/// every Mac, whatever the user picked in Appearance settings.
final class MinneButton: NSButton {
    enum Style {
        /// The step's one real action.
        case primary
        /// A second, equal-weight action (the permission repair).
        case quiet
        /// "Set Up Later" — present, deliberately unpersuasive.
        case ghost
    }

    private let style: Style

    init(title: String, style: Style, target: AnyObject?, action: Selector) {
        self.style = style
        super.init(frame: .zero)
        self.title = title
        self.target = target
        self.action = action
        isBordered = false
        bezelStyle = .shadowlessSquare
        wantsLayer = true
        translatesAutoresizingMaskIntoConstraints = false
        setContentHuggingPriority(.required, for: .horizontal)
        setContentCompressionResistancePriority(.required, for: .horizontal)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    private var titleAttributes: [NSAttributedString.Key: Any] {
        let colour: NSColor =
            switch style {
            case .primary: .white
            case .quiet: MinneTheme.ink
            case .ghost: MinneTheme.prose
            }
        let paragraph = NSMutableParagraphStyle()
        paragraph.alignment = .center
        return [
            // 13pt medium, not 12.5 semibold: 13 is the size every other
            // macOS control label is set at, and medium carries the weight
            // without the label reading as bold.
            .font: MinneTheme.body(13, .medium),
            .foregroundColor: isEnabled ? colour : colour.withAlphaComponent(0.45),
            .paragraphStyle: paragraph,
        ]
    }

    /// 28pt tall with 14pt of air each side. The first version was 30×15
    /// around a 12.5pt label, which left a small word marooned in a lot of
    /// blue; these proportions are the ones AppKit's own push button uses.
    override var intrinsicContentSize: NSSize {
        let text = NSAttributedString(string: title, attributes: titleAttributes)
        return NSSize(width: ceil(text.size().width) + 28, height: 28)
    }

    override func draw(_ dirtyRect: NSRect) {
        let path = NSBezierPath(roundedRect: bounds, xRadius: 6, yRadius: 6)

        switch style {
        case .primary:
            (isEnabled ? MinneTheme.accent : MinneTheme.accent.withAlphaComponent(0.4)).setFill()
            path.fill()
            if isHighlighted {
                NSColor.black.withAlphaComponent(0.14).setFill()
                path.fill()
            }
        case .quiet:
            MinneTheme.paper.setFill()
            path.fill()
            if isHighlighted {
                MinneTheme.rail.setFill()
                path.fill()
            }
            MinneTheme.line.setStroke()
            path.lineWidth = 1
            path.stroke()
        case .ghost:
            if isHighlighted {
                MinneTheme.rail.setFill()
                path.fill()
            }
        }

        // Centre on the cap height, not on the line box. A line box carries
        // more room under the baseline than over it, so centring that instead
        // parks every label a pixel low — the kind of thing that reads as
        // sloppy without being nameable.
        let font = MinneTheme.body(13, .medium)
        let text = NSAttributedString(string: title, attributes: titleAttributes)
        let size = text.size()
        let baseline = bounds.midY - font.capHeight / 2
        let top = baseline + font.ascender
        text.draw(
            in: NSRect(
                x: bounds.minX, y: top - size.height,
                width: bounds.width, height: size.height))
    }

    override func updateLayer() { needsDisplay = true }
}

/// A hairline. The only divider the window uses.
final class HairlineView: NSView {
    private let colour: NSColor
    private let thickness: CGFloat

    init(colour: NSColor = MinneTheme.line, thickness: CGFloat = 1) {
        self.colour = colour
        self.thickness = thickness
        super.init(frame: .zero)
        translatesAutoresizingMaskIntoConstraints = false
        heightAnchor.constraint(equalToConstant: thickness).isActive = true
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    override func draw(_ dirtyRect: NSRect) {
        colour.setFill()
        bounds.fill()
    }
}

/// A 2pt accent rule down the left edge, for the one block on the whole flow
/// that is an intervention rather than a statement: the permission repair.
///
/// A rule rather than a filled, bordered box — a box for four lines of text
/// reads as an alert, and the repair is help, not an error.
final class AccentRuleView: NSView {
    override func draw(_ dirtyRect: NSRect) {
        MinneTheme.accent.setFill()
        NSBezierPath(
            roundedRect: NSRect(x: 0, y: 0, width: 2, height: bounds.height),
            xRadius: 1, yRadius: 1
        ).fill()
    }
}

/// The left rail: the mark, and the four steps as sparks that light up as the
/// user gets through them.
///
/// The rail is the only place position is stated, and the only place the mark
/// appears. An earlier version also put a "FIRST RUN" caption above the steps,
/// a "~/Minne" line below them and a "Step 1 of 4" eyebrow in the pane — three
/// more ways of saying what the lit spark already says.
final class OnboardingRailView: NSView {
    static let width: CGFloat = 176

    private var sparks: [SparkView] = []
    private var labels: [NSTextField] = []

    override var isFlipped: Bool { true }

    init() {
        super.init(frame: .zero)
        translatesAutoresizingMaskIntoConstraints = false
        build()
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    private func build() {
        let mark = BrandMarkView(side: 19)
        let wordmark = NSTextField(labelWithString: "Minne")
        wordmark.font = MinneTheme.display(16)
        wordmark.textColor = MinneTheme.ink

        let brandRow = NSStackView(views: [mark, wordmark])
        brandRow.orientation = .horizontal
        brandRow.spacing = 9
        brandRow.alignment = .centerY

        let steps = NSStackView()
        steps.orientation = .vertical
        steps.alignment = .leading
        steps.spacing = 0
        for step in OnboardingRailStep.allCases {
            let spark = SparkView(state: .upcoming, side: 15)
            let label = NSTextField(labelWithString: step.title)
            label.font = MinneTheme.body(12.5)
            label.textColor = MinneTheme.mute
            sparks.append(spark)
            labels.append(label)

            let row = NSStackView(views: [spark, label])
            row.orientation = .horizontal
            row.spacing = 12
            row.alignment = .centerY
            row.heightAnchor.constraint(equalToConstant: 40).isActive = true
            steps.addArrangedSubview(row)
        }

        let stack = NSStackView(views: [brandRow, steps])
        stack.orientation = .vertical
        stack.alignment = .leading
        stack.spacing = 26
        stack.translatesAutoresizingMaskIntoConstraints = false
        addSubview(stack)

        NSLayoutConstraint.activate([
            widthAnchor.constraint(equalToConstant: Self.width),
            // Enough that the shortest step (the granted confirmation) still
            // opens a window the rail does not look squashed in.
            heightAnchor.constraint(greaterThanOrEqualToConstant: 320),
            stack.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 22),
            stack.trailingAnchor.constraint(lessThanOrEqualTo: trailingAnchor, constant: -12),
            stack.topAnchor.constraint(equalTo: topAnchor, constant: 26),
            stack.bottomAnchor.constraint(lessThanOrEqualTo: bottomAnchor, constant: -22),
        ])
    }

    /// Lights the rail for `step`: everything before it is spent, it is
    /// current, everything after is an outline.
    func show(_ step: OnboardingRailStep?) {
        for (index, spark) in sparks.enumerated() {
            let state: SparkView.State
            if let step {
                state = index < step.rawValue ? .done : (index == step.rawValue ? .current : .upcoming)
            } else {
                state = .upcoming
            }
            spark.state = state
            labels[index].textColor =
                switch state {
                case .current: MinneTheme.ink
                case .done: MinneTheme.prose
                default: MinneTheme.mute
                }
            labels[index].font = MinneTheme.body(12.5, state == .current ? .semibold : .regular)
        }
        needsDisplay = true
    }

    override func draw(_ dirtyRect: NSRect) {
        MinneTheme.rail.setFill()
        bounds.fill()

        // The hairline the sparks are threaded on, measured from the real
        // frames so it cannot drift if the rows are ever re-spaced.
        if let first = sparks.first, let last = sparks.last {
            let top = convert(first.bounds, from: first)
            let bottom = convert(last.bounds, from: last)
            MinneTheme.line.setFill()
            NSRect(
                x: top.midX - 0.5, y: min(top.midY, bottom.midY),
                width: 1, height: abs(bottom.midY - top.midY)
            ).fill()
        }

        MinneTheme.line.setFill()
        NSRect(x: bounds.maxX - 1, y: 0, width: 1, height: bounds.height).fill()
    }
}

/// The page itself. Paints its own background rather than borrowing the
/// window's, so the view renders correctly wherever it is drawn — including
/// into a bitmap, which is how this flow gets reviewed on a machine without
/// Screen Recording permission.
final class OnboardingPageView: NSView {
    override func draw(_ dirtyRect: NSRect) {
        MinneTheme.paper.setFill()
        dirtyRect.fill()
    }
}
