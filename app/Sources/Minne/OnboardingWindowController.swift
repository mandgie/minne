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
    private let auth: AuthModel
    private let repair: AccessibilityRepair

    private let titleLabel = NSTextField(labelWithString: "")
    private let bodyLabel = NSTextField(wrappingLabelWithString: "")
    private let bulletStack = NSStackView()
    private let waitingSpinner = NSProgressIndicator()
    private let waitingLabel = NSTextField(labelWithString: "Waiting for permission…")
    private let waitingRow = NSStackView()
    private let repairLabel = NSTextField(wrappingLabelWithString: "")
    private let repairButton = NSButton(title: "", target: nil, action: nil)
    private let repairStack = NSStackView()
    private let footnoteLabel = NSTextField(wrappingLabelWithString: "")
    private let secondaryButton = NSButton(title: "", target: nil, action: nil)
    private let primaryButton = NSButton(title: "", target: nil, action: nil)
    private var providerSetup: ProviderSetupView?
    /// Feeds the stale-grant patience clock while the window is up.
    private var repairClock: Timer?

    init(
        permission: CapturePermissionState, auth: AuthModel, step: OnboardingStep = .welcome,
        repair: AccessibilityRepair = AccessibilityRepair(
            runner: SystemProcessRunner(), bundleIdentifier: Bundle.main.bundleIdentifier)
    ) {
        state = OnboardingState(permission: permission, step: step)
        self.auth = auth
        self.repair = repair
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
        // A successful sign-in advances the flow on its own — the user does
        // not have to notice a button changing.
        auth.onSignedIn = { [weak self] summary in
            guard let self, self.state.signedIn(summary) else { return }
            self.render()
        }
        // The setup view redraws itself; the window has to follow its height.
        auth.observe(self) { [weak self] _ in self?.resizeToFit() }
        // Debug hook: `-simulatePermissionDeadlock YES` (with `-onboardingStep
        // permission`) shows the escalation without waiting out the patience
        // window — the only way to screenshot it without real TCC damage.
        if UserDefaults.standard.bool(forKey: "simulatePermissionDeadlock") {
            state.debugForceEscalation()
        }
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

    /// Fed by the app delegate when Minne becomes active again: the user came
    /// back from System Settings, and if the grant still has not landed they
    /// most likely flipped a switch that did nothing.
    func applicationBecameActive() {
        if state.returnedFromSettings(now: Date()) { render() }
    }

    /// One-second patience clock, alive only between "Open System Settings"
    /// and the grant (or the end of the flow). The state machine decides;
    /// this only feeds it the time.
    private func startRepairClock() {
        guard repairClock == nil else { return }
        let timer = Timer(timeInterval: 1, repeats: true) { [weak self] _ in
            Task { @MainActor in
                guard let self else { return }
                if self.state.tick(now: Date()) { self.render() }
            }
        }
        RunLoop.main.add(timer, forMode: .common)
        repairClock = timer
    }

    private func stopRepairClock() {
        repairClock?.invalidate()
        repairClock = nil
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

        // The stale-grant escalation: an explanation and its one-button fix.
        repairLabel.font = .systemFont(ofSize: 12)
        repairLabel.textColor = .secondaryLabelColor
        repairLabel.preferredMaxLayoutWidth = textWidth
        repairButton.bezelStyle = .rounded
        repairButton.target = self
        repairButton.action = #selector(repairClicked)
        repairStack.orientation = .vertical
        repairStack.alignment = .leading
        repairStack.spacing = 8
        repairStack.setViews([repairLabel, repairButton], in: .leading)

        footnoteLabel.font = .systemFont(ofSize: 11)
        footnoteLabel.textColor = .tertiaryLabelColor
        footnoteLabel.preferredMaxLayoutWidth = textWidth

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

        let setup = ProviderSetupView(model: auth, width: textWidth)
        providerSetup = setup

        let stack = NSStackView(views: [
            titleLabel, bodyLabel, bulletStack, setup, waitingRow, repairStack, buttonContainer,
            footnoteLabel,
        ])
        stack.orientation = .vertical
        stack.alignment = .leading
        stack.spacing = 16
        stack.setCustomSpacing(10, after: titleLabel)
        // The footnote is small print to the buttons above it, not a section.
        stack.setCustomSpacing(10, after: buttonContainer)
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
        providerSetup?.isHidden = page.kind != .providers

        if let repair = page.repair {
            repairLabel.stringValue = repair.body
            repairButton.title = repair.buttonTitle
            repairButton.isEnabled = !repair.inProgress
            repairStack.isHidden = false
        } else {
            repairStack.isHidden = true
        }

        footnoteLabel.stringValue = page.footnote ?? ""
        footnoteLabel.isHidden = page.footnote == nil

        primaryButton.title = page.primaryTitle
        secondaryButton.title = page.secondaryTitle ?? ""
        secondaryButton.isHidden = page.secondaryTitle == nil
        // On the provider step the card's own button is the one to press;
        // Return there should not close the window.
        primaryButton.keyEquivalent = page.kind == .providers ? "" : "\r"

        resizeToFit()
        if page.kind != .providers { window.makeFirstResponder(primaryButton) }
    }

    /// The provider step grows and shrinks under the window (a prompt appears,
    /// a card's extra field shows), so the window follows its content.
    private func resizeToFit() {
        guard let container = window.contentView else { return }
        container.layoutSubtreeIfNeeded()
        let height = container.fittingSize.height
        guard abs(height - window.contentLayoutRect.height) > 0.5 else { return }
        window.setContentSize(
            NSSize(width: OnboardingWindowController.contentWidth, height: height))
    }

    private func finishIfDone() {
        guard state.step == .finished else { return }
        stopRepairClock()
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
            state.sentToSettings(now: Date())
            startRepairClock()
            AccessibilityPermission.requestAndOpenSystemSettings()
        }
    }

    /// Clears the stale TCC entry, re-fires Apple's prompt so a fresh row
    /// appears, and goes back to watching for the grant.
    @objc private func repairClicked() {
        state.repairStarted()
        render()
        let repair = self.repair
        Task { [weak self] in
            _ = await repair.reset()
            guard let self else { return }
            // Re-prompt either way: if the reset failed the prompt is a no-op
            // (Minne is still registered), and if it worked this is what puts
            // the fresh row in the pane the user is looking at.
            AccessibilityPermission.requestPrompt()
            self.state.repairFinished(now: Date())
            self.startRepairClock()
            self.render()
        }
    }

    @objc private func secondaryClicked() {
        state.skip()
        finishIfDone()
    }

    /// Closing the window counts as "later": the menu-bar hint takes over.
    func windowWillClose(_ notification: Notification) {
        stopRepairClock()
        guard state.step != .finished else { return }
        state.skip()
        onFinished?()
    }
}
