import AppKit

/// First-run window. All flow decisions live in `OnboardingState`; this class
/// renders the current `OnboardingPage` into AppKit views and reports the
/// user's clicks back.
@MainActor
final class OnboardingWindowController: NSObject, NSWindowDelegate {
    /// The flow is over (granted, skipped, or the window was closed). The app
    /// stops fast permission polling and marks onboarding as seen.
    var onFinished: (@MainActor () -> Void)?

    private static let contentWidth: CGFloat = 520
    private static let inset: CGFloat = 28

    private var state: OnboardingState
    private let window: NSWindow

    private let titleLabel = NSTextField(labelWithString: "")
    private let bodyLabel = NSTextField(wrappingLabelWithString: "")
    private let bulletStack = NSStackView()
    private let waitingSpinner = NSProgressIndicator()
    private let waitingLabel = NSTextField(labelWithString: "Waiting for permission…")
    private let waitingRow = NSStackView()
    private let secondaryButton = NSButton(title: "", target: nil, action: nil)
    private let primaryButton = NSButton(title: "", target: nil, action: nil)

    init(permission: CapturePermissionState) {
        state = OnboardingState(permission: permission)
        window = NSWindow(
            contentRect: NSRect(
                x: 0, y: 0, width: OnboardingWindowController.contentWidth, height: 420),
            styleMask: [.titled, .closable],
            backing: .buffered,
            defer: false)
        super.init()

        window.title = "Welcome to Minne"
        window.isReleasedWhenClosed = false
        window.delegate = self
        window.contentView = buildContentView()
        render()
    }

    // MARK: - Inputs

    func show() {
        window.center()
        NSApp.activate(ignoringOtherApps: true)
        window.makeKeyAndOrderFront(nil)
    }

    /// Fed by `AccessibilityPermission`'s poller — this is what makes the
    /// grant advance the flow without the user coming back to the window.
    func permissionChanged(_ permission: CapturePermissionState) {
        guard state.permissionObserved(permission) else { return }
        render()
        finishIfDone()
    }

    // MARK: - Layout

    private func buildContentView() -> NSView {
        let width = OnboardingWindowController.contentWidth
        let inset = OnboardingWindowController.inset
        let textWidth = width - inset * 2

        titleLabel.font = .systemFont(ofSize: 20, weight: .semibold)

        bodyLabel.font = .systemFont(ofSize: 13)
        bodyLabel.textColor = .secondaryLabelColor
        bodyLabel.preferredMaxLayoutWidth = textWidth

        bulletStack.orientation = .vertical
        bulletStack.alignment = .leading
        bulletStack.spacing = 8

        waitingSpinner.style = .spinning
        waitingSpinner.controlSize = .small
        waitingSpinner.startAnimation(nil)
        waitingLabel.font = .systemFont(ofSize: 12)
        waitingLabel.textColor = .secondaryLabelColor
        waitingRow.orientation = .horizontal
        waitingRow.spacing = 8
        waitingRow.setViews([waitingSpinner, waitingLabel], in: .leading)

        secondaryButton.bezelStyle = .rounded
        secondaryButton.target = self
        secondaryButton.action = #selector(secondaryClicked)

        primaryButton.bezelStyle = .rounded
        primaryButton.keyEquivalent = "\r"
        primaryButton.target = self
        primaryButton.action = #selector(primaryClicked)

        let buttonRow = NSStackView(views: [secondaryButton, primaryButton])
        buttonRow.orientation = .horizontal
        buttonRow.spacing = 12
        buttonRow.alignment = .centerY

        let buttonContainer = NSStackView(views: [buttonRow])
        buttonContainer.orientation = .horizontal
        buttonContainer.alignment = .centerY
        buttonContainer.distribution = .fill
        // Push the buttons to the trailing edge.
        let spacer = NSView()
        spacer.setContentHuggingPriority(.defaultLow - 1, for: .horizontal)
        buttonContainer.setViews([spacer, buttonRow], in: .leading)

        let stack = NSStackView(views: [
            titleLabel, bodyLabel, bulletStack, waitingRow, buttonContainer,
        ])
        stack.orientation = .vertical
        stack.alignment = .leading
        stack.spacing = 16
        stack.setCustomSpacing(10, after: titleLabel)
        stack.translatesAutoresizingMaskIntoConstraints = false

        let container = NSView()
        container.addSubview(stack)
        NSLayoutConstraint.activate([
            container.widthAnchor.constraint(equalToConstant: width),
            stack.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: inset),
            stack.trailingAnchor.constraint(equalTo: container.trailingAnchor, constant: -inset),
            stack.topAnchor.constraint(equalTo: container.topAnchor, constant: inset),
            stack.bottomAnchor.constraint(equalTo: container.bottomAnchor, constant: -inset),
            buttonContainer.widthAnchor.constraint(equalTo: stack.widthAnchor),
        ])
        return container
    }

    private func bulletView(_ bullet: OnboardingBullet, width: CGFloat) -> NSView {
        let symbol = bullet.isPositive ? "checkmark.circle.fill" : "xmark.circle.fill"
        let icon = NSImageView(
            image: NSImage(systemSymbolName: symbol, accessibilityDescription: nil) ?? NSImage())
        icon.contentTintColor = bullet.isPositive ? .systemGreen : .secondaryLabelColor
        icon.setContentHuggingPriority(.required, for: .horizontal)

        let label = NSTextField(wrappingLabelWithString: bullet.text)
        label.font = .systemFont(ofSize: 13)
        label.preferredMaxLayoutWidth = width - 24

        let row = NSStackView(views: [icon, label])
        row.orientation = .horizontal
        row.alignment = .firstBaseline
        row.spacing = 8
        return row
    }

    // MARK: - Rendering

    private func render() {
        guard let page = state.page else { return }
        let textWidth =
            OnboardingWindowController.contentWidth - OnboardingWindowController.inset * 2

        titleLabel.stringValue = page.title
        bodyLabel.stringValue = page.body

        for view in bulletStack.arrangedSubviews {
            bulletStack.removeArrangedSubview(view)
            view.removeFromSuperview()
        }
        for bullet in page.bullets {
            bulletStack.addArrangedSubview(bulletView(bullet, width: textWidth))
        }
        bulletStack.isHidden = page.bullets.isEmpty

        waitingRow.isHidden = !page.isWaiting

        primaryButton.title = page.primaryTitle
        secondaryButton.title = page.secondaryTitle ?? ""
        secondaryButton.isHidden = page.secondaryTitle == nil

        if let container = window.contentView {
            container.layoutSubtreeIfNeeded()
            window.setContentSize(
                NSSize(
                    width: OnboardingWindowController.contentWidth,
                    height: container.fittingSize.height))
        }
        window.makeFirstResponder(primaryButton)
    }

    private func finishIfDone() {
        guard state.step == .finished else { return }
        window.orderOut(nil)
        onFinished?()
    }

    // MARK: - Actions

    @objc private func primaryClicked() {
        guard let page = state.page else { return }
        switch page.primaryAction {
        case .advance, .finish:
            state.advance()
            render()
            finishIfDone()
        case .openSystemSettings:
            AccessibilityPermission.requestAndOpenSystemSettings()
        }
    }

    @objc private func secondaryClicked() {
        state.skip()
        finishIfDone()
    }

    /// Closing the window counts as "later": the menu-bar hint takes over.
    func windowWillClose(_ notification: Notification) {
        guard state.step != .finished else { return }
        state.skip()
        onFinished?()
    }
}
