import AppKit

/// First-run window. All flow decisions live in `OnboardingState`; this class
/// renders the current `OnboardingPage` into AppKit views and reports the
/// user's clicks back.
///
/// Two columns: `OnboardingRailView` answers "how far in am I", and the pane
/// beside it is the step itself — a title, a paragraph, the promises, and the
/// step's one action, and nothing else. The rail states position, so the pane
/// never repeats it; an earlier version carried a "step 1 of 4" eyebrow and a
/// caption over each half of the promise list as well, saying three times over
/// what the lit spark and the copy already said.
@MainActor
final class OnboardingWindowController: NSObject, NSWindowDelegate {
    /// The flow is over (granted, skipped, or the window was closed). The app
    /// stops fast permission polling and marks onboarding as seen.
    var onFinished: (@MainActor () -> Void)?

    private static let contentWidth: CGFloat = 680
    private static let inset: CGFloat = 32
    /// The pane's usable width — what every wrapping label measures against.
    private static var textWidth: CGFloat {
        contentWidth - OnboardingRailView.width - inset * 2
    }

    private var state: OnboardingState
    private let window: NSWindow
    private let auth: AuthModel
    private let repair: AccessibilityRepair

    private let titleLabel = NSTextField(wrappingLabelWithString: "")
    private let bodyLabel = NSTextField(wrappingLabelWithString: "")
    private let promiseStack = NSStackView()

    private let accountTitle = NSTextField(labelWithString: "")
    private let accountDetail = NSTextField(labelWithString: "")
    private let accountStack = NSStackView()
    private let hintLabel = NSTextField(wrappingLabelWithString: "")

    private let waitingSpinner = NSProgressIndicator()
    private let waitingLabel = NSTextField(labelWithString: "Watching for the grant…")
    private let waitingRow = NSStackView()

    private let repairLabel = NSTextField(wrappingLabelWithString: "")
    private let repairButton: MinneButton
    private let repairBlock = AccentRuleView()

    private let footnoteLabel = NSTextField(wrappingLabelWithString: "")
    private let rail = OnboardingRailView()
    private let secondaryButton: MinneButton
    private let primaryButton: MinneButton
    private let footer = NSStackView()

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
        // The buttons need `self` as their target, so they are built here
        // rather than as stored-property initialisers.
        repairButton = MinneButton(
            title: "", style: .quiet, target: nil, action: #selector(Self.repairClicked))
        secondaryButton = MinneButton(
            title: "", style: .ghost, target: nil, action: #selector(Self.secondaryClicked))
        primaryButton = MinneButton(
            title: "", style: .primary, target: nil, action: #selector(Self.primaryClicked))
        window = NSWindow(
            contentRect: NSRect(
                x: 0, y: 0, width: OnboardingWindowController.contentWidth, height: 420),
            styleMask: [.titled, .closable],
            backing: .buffered,
            defer: false)
        super.init()

        for button in [repairButton, secondaryButton, primaryButton] { button.target = self }

        window.title = "Welcome to Minne"
        window.isReleasedWhenClosed = false
        window.delegate = self
        window.backgroundColor = MinneTheme.paper
        // The page is white; a dark-mode titlebar over it would look like a
        // rendering fault rather than a choice.
        window.appearance = NSAppearance(named: .aqua)
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
        let inset = OnboardingWindowController.inset
        let textWidth = OnboardingWindowController.textWidth

        titleLabel.font = MinneTheme.display(24)
        titleLabel.textColor = MinneTheme.ink
        titleLabel.preferredMaxLayoutWidth = textWidth

        bodyLabel.font = MinneTheme.body(13)
        bodyLabel.textColor = MinneTheme.prose
        bodyLabel.preferredMaxLayoutWidth = textWidth

        promiseStack.orientation = .vertical
        promiseStack.alignment = .leading
        promiseStack.spacing = 8

        accountTitle.font = MinneTheme.body(13, .semibold)
        accountTitle.textColor = MinneTheme.ink
        accountDetail.font = MinneTheme.body(12.5)
        accountDetail.textColor = MinneTheme.prose
        accountStack.orientation = .vertical
        accountStack.alignment = .leading
        accountStack.spacing = 3
        accountStack.setViews([accountTitle, accountDetail], in: .leading)

        hintLabel.preferredMaxLayoutWidth = textWidth

        waitingSpinner.style = .spinning
        waitingSpinner.controlSize = .small
        waitingSpinner.startAnimation(nil)
        waitingLabel.font = MinneTheme.body(12)
        waitingLabel.textColor = MinneTheme.mute
        waitingRow.orientation = .horizontal
        waitingRow.spacing = 8
        waitingRow.alignment = .centerY
        waitingRow.setViews([waitingSpinner, waitingLabel], in: .leading)

        repairLabel.font = MinneTheme.body(12.5)
        repairLabel.textColor = MinneTheme.prose
        repairLabel.preferredMaxLayoutWidth = textWidth - 16
        let repairStack = NSStackView(views: [repairLabel, repairButton])
        repairStack.orientation = .vertical
        repairStack.alignment = .leading
        repairStack.spacing = 11
        repairStack.translatesAutoresizingMaskIntoConstraints = false
        repairBlock.addSubview(repairStack)
        NSLayoutConstraint.activate([
            repairStack.leadingAnchor.constraint(equalTo: repairBlock.leadingAnchor, constant: 16),
            repairStack.trailingAnchor.constraint(equalTo: repairBlock.trailingAnchor),
            repairStack.topAnchor.constraint(equalTo: repairBlock.topAnchor, constant: 1),
            repairStack.bottomAnchor.constraint(equalTo: repairBlock.bottomAnchor, constant: -1),
        ])

        footnoteLabel.font = MinneTheme.body(11.5)
        footnoteLabel.textColor = MinneTheme.mute
        footnoteLabel.preferredMaxLayoutWidth = textWidth

        primaryButton.keyEquivalent = "\r"
        let spacer = NSView()
        spacer.setContentHuggingPriority(.defaultLow - 1, for: .horizontal)
        footer.orientation = .horizontal
        footer.spacing = 9
        footer.alignment = .centerY
        footer.setViews([spacer, secondaryButton, primaryButton], in: .leading)

        let setup = ProviderSetupView(model: auth, width: textWidth)
        providerSetup = setup

        // Eats the slack, pinning the footer to the bottom however tall the
        // step above it is.
        let filler = NSView()
        filler.translatesAutoresizingMaskIntoConstraints = false
        filler.setContentHuggingPriority(.defaultLow - 1, for: .vertical)
        filler.setContentCompressionResistancePriority(.defaultLow - 1, for: .vertical)

        let rule = HairlineView()

        let stack = NSStackView(views: [
            titleLabel, bodyLabel, promiseStack, setup, accountStack, hintLabel,
            waitingRow, repairBlock, filler, footnoteLabel, rule, footer,
        ])
        stack.orientation = .vertical
        stack.alignment = .leading
        stack.spacing = 18
        stack.setCustomSpacing(12, after: titleLabel)
        stack.setCustomSpacing(22, after: bodyLabel)
        stack.setCustomSpacing(14, after: footnoteLabel)
        stack.setCustomSpacing(16, after: rule)
        stack.translatesAutoresizingMaskIntoConstraints = false

        let pane = NSView()
        pane.translatesAutoresizingMaskIntoConstraints = false
        pane.addSubview(stack)

        let container = OnboardingPageView()
        container.addSubview(rail)
        container.addSubview(pane)
        NSLayoutConstraint.activate([
            container.widthAnchor.constraint(
                equalToConstant: OnboardingWindowController.contentWidth),

            rail.leadingAnchor.constraint(equalTo: container.leadingAnchor),
            rail.topAnchor.constraint(equalTo: container.topAnchor),
            rail.bottomAnchor.constraint(equalTo: container.bottomAnchor),

            pane.leadingAnchor.constraint(equalTo: rail.trailingAnchor),
            pane.trailingAnchor.constraint(equalTo: container.trailingAnchor),
            pane.topAnchor.constraint(equalTo: container.topAnchor),
            pane.bottomAnchor.constraint(equalTo: container.bottomAnchor),

            stack.leadingAnchor.constraint(equalTo: pane.leadingAnchor, constant: inset),
            stack.trailingAnchor.constraint(equalTo: pane.trailingAnchor, constant: -inset),
            stack.topAnchor.constraint(equalTo: pane.topAnchor, constant: inset),
            stack.bottomAnchor.constraint(equalTo: pane.bottomAnchor, constant: -22),
            // Full-width children, so the rule and the footer span the column.
            footer.widthAnchor.constraint(equalTo: stack.widthAnchor),
            rule.widthAnchor.constraint(equalTo: stack.widthAnchor),
            repairBlock.widthAnchor.constraint(equalTo: stack.widthAnchor),
            promiseStack.widthAnchor.constraint(equalTo: stack.widthAnchor),
        ])
        return container
    }

    /// One promise, as a line of text.
    ///
    /// No icon: the copy already says "Never …" where it needs to, and a green
    /// tick beside a privacy guarantee reads like a validation result. Colour
    /// carries the distinction instead — what Minne does in ink, what it never
    /// does in prose grey.
    private func promiseView(_ bullet: OnboardingBullet, width: CGFloat) -> NSTextField {
        let label = NSTextField(wrappingLabelWithString: bullet.text)
        label.font = MinneTheme.body(13)
        label.textColor = bullet.isPositive ? MinneTheme.ink : MinneTheme.prose
        label.preferredMaxLayoutWidth = width
        return label
    }

    // MARK: - Rendering

    private func render() {
        guard let page = state.page else { return }
        let textWidth = OnboardingWindowController.textWidth

        rail.show(page.rail)

        titleLabel.stringValue = page.title
        bodyLabel.stringValue = page.body
        bodyLabel.isHidden = page.body.isEmpty

        for view in promiseStack.arrangedSubviews {
            promiseStack.removeArrangedSubview(view)
            view.removeFromSuperview()
        }
        var lastPositive: NSView?
        for bullet in page.bullets {
            let row = promiseView(bullet, width: textWidth)
            promiseStack.addArrangedSubview(row)
            if bullet.isPositive { lastPositive = row }
        }
        // The one gap that separates what Minne does from what it never does.
        // A caption over each half said out loud what the copy already says;
        // a wider gap says it quietly.
        if let lastPositive, page.bullets.contains(where: { !$0.isPositive }) {
            promiseStack.setCustomSpacing(18, after: lastPositive)
        }
        promiseStack.isHidden = page.bullets.isEmpty

        if let account = page.account {
            // "Claude (Pro/Max) — Claude Sonnet 5" splits into a name and the
            // model underneath it; an em dash is the summary's own separator.
            let parts = account.components(separatedBy: " — ")
            accountTitle.stringValue = parts.first.map { "Signed in to \($0)" } ?? account
            accountDetail.stringValue =
                parts.count > 1 ? parts.dropFirst().joined(separator: " — ") : ""
            accountDetail.isHidden = accountDetail.stringValue.isEmpty
            accountStack.isHidden = false
        } else {
            accountStack.isHidden = true
        }

        if let hint = page.hint {
            hintLabel.attributedStringValue = shortcutHint(hint)
            hintLabel.isHidden = false
        } else {
            hintLabel.isHidden = true
        }

        waitingRow.isHidden = !page.isWaiting
        providerSetup?.isHidden = page.kind != .providers

        if let repair = page.repair {
            repairLabel.stringValue = repair.body
            repairButton.title = repair.buttonTitle
            repairButton.isEnabled = !repair.inProgress
            repairBlock.isHidden = false
        } else {
            repairBlock.isHidden = true
        }

        footnoteLabel.stringValue = page.footnote ?? ""
        footnoteLabel.isHidden = page.footnote == nil

        primaryButton.title = page.primaryTitle
        secondaryButton.title = page.secondaryTitle ?? ""
        secondaryButton.isHidden = page.secondaryTitle == nil
        primaryButton.invalidateIntrinsicContentSize()
        secondaryButton.invalidateIntrinsicContentSize()
        repairButton.invalidateIntrinsicContentSize()
        // On the provider step the card's own button is the one to press;
        // Return there should not close the window.
        primaryButton.keyEquivalent = page.kind == .providers ? "" : "\r"

        resizeToFit()
        if page.kind != .providers { window.makeFirstResponder(primaryButton) }
    }

    /// "⌥Space asks Minne anything" — the shortcut in ink and the rest in
    /// prose. Deliberately not the utility face: IBM Plex Mono has no glyph
    /// for ⌥, and the fallback it triggers renders it clipped.
    private func shortcutHint(_ tail: String) -> NSAttributedString {
        let hint = NSMutableAttributedString(
            string: "⌥Space ",
            attributes: [
                .font: MinneTheme.body(13, .semibold),
                .foregroundColor: MinneTheme.ink,
            ])
        hint.append(
            NSAttributedString(
                string: tail,
                attributes: [
                    .font: MinneTheme.body(13),
                    .foregroundColor: MinneTheme.prose,
                ]))
        return hint
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
