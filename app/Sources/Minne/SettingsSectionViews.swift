import AppKit

/// Shared furniture for the settings sections: a heading, a caption, and the
/// vertical stack every section is built from.
enum SettingsStyle {
    @MainActor
    static func heading(_ text: String) -> NSTextField {
        let label = NSTextField(labelWithString: text)
        label.font = .systemFont(ofSize: 13, weight: .semibold)
        return label
    }

    @MainActor
    static func caption(_ text: String, width: CGFloat) -> NSTextField {
        let label = NSTextField(wrappingLabelWithString: text)
        label.font = .systemFont(ofSize: 11)
        label.textColor = .secondaryLabelColor
        label.preferredMaxLayoutWidth = width
        return label
    }

    @MainActor
    static func section(_ views: [NSView], width: CGFloat) -> NSStackView {
        let stack = NSStackView(views: views)
        stack.orientation = .vertical
        stack.alignment = .leading
        stack.spacing = 14
        stack.translatesAutoresizingMaskIntoConstraints = false
        return stack
    }

    /// Fills a container with `stack`, pinned to its edges at a fixed width.
    @MainActor
    static func fill(_ container: NSView, with stack: NSView, width: CGFloat) {
        container.addSubview(stack)
        NSLayoutConstraint.activate([
            container.widthAnchor.constraint(equalToConstant: width),
            stack.leadingAnchor.constraint(equalTo: container.leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: container.trailingAnchor),
            stack.topAnchor.constraint(equalTo: container.topAnchor),
            stack.bottomAnchor.constraint(equalTo: container.bottomAnchor),
        ])
    }
}

/// Account: the provider cards, the model picker and sign in/out — the same
/// `ProviderSetupView` onboarding uses, rendering the same `AuthModel`. A
/// second implementation of the sign-in UI would be a second set of bugs.
@MainActor
final class AccountSectionView: NSView {
    init(model: SettingsModel, width: CGFloat) {
        super.init(frame: .zero)
        let setup = ProviderSetupView(model: model.auth, width: width)
        // Without this the enclosing stack measures the setup view at less than
        // its content needs and the sign-in row is drawn past the window's
        // bottom edge: a plain NSView hugs at 250, and the stack believes it.
        setup.setContentHuggingPriority(.required, for: .vertical)
        setup.setContentCompressionResistancePriority(.required, for: .vertical)
        let stack = SettingsStyle.section(
            [
                SettingsStyle.heading("Which AI Minne thinks with"),
                SettingsStyle.caption(
                    "Chat and the memory sync pass both use this account and model.", width: width),
                setup,
            ], width: width)
        SettingsStyle.fill(self, with: stack, width: width)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("not used") }
}

/// Privacy: what Minne is allowed to see, how long it keeps it, and the way
/// out — deleting everything.
@MainActor
final class PrivacySectionView: NSView {
    /// Reopens the first-run flow (US-006), which is where the permission is
    /// explained rather than merely reported.
    var onShowSetup: (@MainActor () -> Void)?
    /// Asks the window to put up the typed-confirmation sheet.
    var onDeleteAll: (@MainActor () -> Void)?

    private let model: SettingsModel
    private let permissionLabel = NSTextField(wrappingLabelWithString: "")
    private let permissionIcon = NSImageView()
    private let grantButton = NSButton(
        title: "Open Accessibility Settings", target: nil, action: nil)
    private let pausePopUp = NSPopUpButton()
    private let pauseLabel = NSTextField(labelWithString: "")
    private let retentionField = NSTextField()
    private let retentionStepper = NSStepper()
    private let retentionLabel = NSTextField(wrappingLabelWithString: "")
    private let appsEditor: SettingsListEditor
    private let domainsEditor: SettingsListEditor
    private let resetButton = NSButton(title: "Restore Default Lists", target: nil, action: nil)
    private let wipeStatus = NSTextField(wrappingLabelWithString: "")

    /// What the pause menu offers, in order. A timed pause that came from the
    /// menu bar is matched back onto the nearest of these.
    private static let pauseOptions: [(title: String, minutes: Int?)] = [
        ("Capturing", nil),
        ("Paused for 15 minutes", 15),
        ("Paused for 1 hour", 60),
        ("Paused until I resume", 0),
    ]

    init(model: SettingsModel, width: CGFloat) {
        self.model = model
        let columnWidth = (width - 16) / 2
        appsEditor = SettingsListEditor(
            title: "Apps", placeholder: "com.example.app", width: columnWidth)
        domainsEditor = SettingsListEditor(
            title: "Domains", placeholder: "bank.example", width: columnWidth)
        super.init(frame: .zero)

        permissionIcon.setContentHuggingPriority(.required, for: .horizontal)
        permissionLabel.font = .systemFont(ofSize: 12)
        permissionLabel.preferredMaxLayoutWidth = width - 130
        grantButton.bezelStyle = .rounded
        grantButton.controlSize = .small
        grantButton.target = self
        grantButton.action = #selector(grantClicked)
        let setupButton = NSButton(
            title: "Setup Guide…", target: self, action: #selector(setupClicked))
        setupButton.bezelStyle = .rounded
        setupButton.controlSize = .small
        let permissionRow = NSStackView(views: [
            permissionIcon, permissionLabel, grantButton, setupButton,
        ])
        permissionRow.orientation = .horizontal
        permissionRow.spacing = 8
        permissionRow.alignment = .centerY

        pausePopUp.target = self
        pausePopUp.action = #selector(pauseChanged(_:))
        for option in Self.pauseOptions { pausePopUp.addItem(withTitle: option.title) }
        pausePopUp.setAccessibilityLabel("Capture")
        pauseLabel.font = .systemFont(ofSize: 11)
        pauseLabel.textColor = .secondaryLabelColor
        let pauseRow = NSStackView(views: [
            NSTextField(labelWithString: "Capture:"), pausePopUp, pauseLabel,
        ])
        pauseRow.orientation = .horizontal
        pauseRow.spacing = 8
        pauseRow.alignment = .centerY

        retentionField.formatter = Self.dayFormatter()
        retentionField.alignment = .right
        retentionField.target = self
        retentionField.action = #selector(retentionEdited)
        retentionField.setAccessibilityLabel("Retention days")
        retentionStepper.minValue = 0
        retentionStepper.maxValue = 3650
        retentionStepper.increment = 5
        retentionStepper.valueWraps = false
        retentionStepper.target = self
        retentionStepper.action = #selector(retentionStepped)
        retentionLabel.font = .systemFont(ofSize: 11)
        retentionLabel.textColor = .secondaryLabelColor
        retentionLabel.preferredMaxLayoutWidth = width
        let retentionRow = NSStackView(views: [
            NSTextField(labelWithString: "Keep raw captures for:"), retentionField,
            retentionStepper, NSTextField(labelWithString: "days (0 = forever)"),
        ])
        retentionRow.orientation = .horizontal
        retentionRow.spacing = 8
        retentionRow.alignment = .centerY
        retentionField.widthAnchor.constraint(equalToConstant: 54).isActive = true

        appsEditor.setHint("Bundle identifier, e.g. com.1password.1password")
        appsEditor.onAdd = { [weak model] value in model?.addBlacklistApp(value) ?? false }
        appsEditor.onRemove = { [weak model] values in model?.removeBlacklistApps(values) }
        domainsEditor.setHint("Blocks subdomains too")
        domainsEditor.onAdd = { [weak model] value in model?.addBlacklistDomain(value) ?? false }
        domainsEditor.onRemove = { [weak model] values in model?.removeBlacklistDomains(values) }
        let editors = NSStackView(views: [appsEditor, domainsEditor])
        editors.orientation = .horizontal
        editors.spacing = 16
        editors.alignment = .top

        resetButton.bezelStyle = .rounded
        resetButton.controlSize = .small
        resetButton.target = self
        resetButton.action = #selector(resetClicked)

        let deleteButton = NSButton(
            title: "Delete All Memory…", target: self, action: #selector(deleteClicked))
        deleteButton.bezelStyle = .rounded
        deleteButton.contentTintColor = .systemRed
        wipeStatus.font = .systemFont(ofSize: 11)
        wipeStatus.preferredMaxLayoutWidth = width
        wipeStatus.isHidden = true

        let stack = SettingsStyle.section(
            [
                SettingsStyle.heading("Accessibility access"),
                permissionRow,
                separator(width: width),
                SettingsStyle.heading("Capture"),
                pauseRow,
                retentionRow,
                retentionLabel,
                separator(width: width),
                SettingsStyle.heading("Never capture these"),
                SettingsStyle.caption(
                    "Windows of these apps, and browser tabs on these domains, produce no snapshot at all.",
                    width: width),
                editors,
                resetButton,
                separator(width: width),
                SettingsStyle.heading("What leaves this Mac"),
                SettingsStyle.caption(model.egressLine, width: width),
                separator(width: width),
                SettingsStyle.heading("Delete all memory"),
                SettingsStyle.caption(
                    "Removes the wiki, every raw capture, the search index and your stored sign-in. There is no undo.",
                    width: width),
                deleteButton,
                wipeStatus,
            ], width: width)
        SettingsStyle.fill(self, with: stack, width: width)

        model.observe(self) { [weak self] model in self?.render(model) }
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("not used") }

    private func separator(width: CGFloat) -> NSView {
        let line = NSBox()
        line.boxType = .separator
        line.widthAnchor.constraint(equalToConstant: width).isActive = true
        return line
    }

    private static func dayFormatter() -> NumberFormatter {
        let formatter = NumberFormatter()
        formatter.numberStyle = .none
        formatter.minimum = 0
        formatter.maximum = 3650
        return formatter
    }

    // MARK: - Rendering

    private func render(_ model: SettingsModel) {
        let granted = model.permission.isGranted
        permissionIcon.image = NSImage(
            systemSymbolName: granted ? "checkmark.circle.fill" : "exclamationmark.triangle.fill",
            accessibilityDescription: nil)
        permissionIcon.contentTintColor = granted ? .systemGreen : .systemOrange
        permissionLabel.stringValue = model.permissionLine
        grantButton.isHidden = granted

        let pause = model.pause.resolved(now: Date())
        pausePopUp.selectItem(at: Self.pauseIndex(for: pause))
        switch pause {
        case .active:
            pauseLabel.stringValue = ""
        case .paused(nil):
            pauseLabel.stringValue = "Nothing is being captured."
        case .paused(.some(let until)):
            let minutes = Int((until.timeIntervalSinceNow / 60).rounded(.up))
            pauseLabel.stringValue =
                minutes >= 1 ? "Resumes in \(minutes) min." : "Resumes in under a minute."
        }

        if window?.firstResponder !== retentionField.currentEditor() {
            retentionField.integerValue = model.retentionDays
        }
        retentionStepper.integerValue = model.retentionDays
        retentionLabel.stringValue = model.retentionLine

        appsEditor.setItems(model.blacklist.sortedBundleIdentifiers)
        domainsEditor.setItems(model.blacklist.sortedDomains)
        resetButton.isEnabled = model.canResetBlacklist

        switch model.wipePhase {
        case .idle:
            wipeStatus.isHidden = true
        case .working:
            wipeStatus.isHidden = false
            wipeStatus.textColor = .secondaryLabelColor
            wipeStatus.stringValue = "Deleting…"
        case .done(let summary):
            wipeStatus.isHidden = false
            wipeStatus.textColor = .secondaryLabelColor
            wipeStatus.stringValue = summary
        case .failed(let reason):
            wipeStatus.isHidden = false
            wipeStatus.textColor = .systemRed
            wipeStatus.stringValue = reason
        }
    }

    /// A timed pause carries a deadline, not the menu item it came from; the
    /// nearest offer is close enough to render honestly, and the countdown
    /// beside it is the exact truth.
    static func pauseIndex(for pause: PauseState) -> Int {
        switch pause {
        case .active: return 0
        case .paused(nil): return 3
        case .paused(.some(let until)):
            return until.timeIntervalSinceNow > 30 * 60 ? 2 : 1
        }
    }

    // MARK: - Actions

    @objc private func grantClicked() {
        AccessibilityPermission.requestAndOpenSystemSettings()
    }

    @objc private func setupClicked() {
        onShowSetup?()
    }

    @objc private func pauseChanged(_ sender: NSPopUpButton) {
        let index = sender.indexOfSelectedItem
        guard Self.pauseOptions.indices.contains(index) else { return }
        switch Self.pauseOptions[index].minutes {
        case nil:
            model.requestPause(.active)
        case 0:
            model.requestPause(.paused(until: nil))
        case .some(let minutes):
            model.requestPause(.paused(until: Date().addingTimeInterval(Double(minutes) * 60)))
        }
    }

    @objc private func retentionEdited() {
        model.setRetentionDays(retentionField.integerValue)
    }

    @objc private func retentionStepped() {
        model.setRetentionDays(retentionStepper.integerValue)
    }

    @objc private func resetClicked() {
        model.resetBlacklist()
    }

    @objc private func deleteClicked() {
        onDeleteAll?()
    }
}

/// Memory: where the wiki is, when it was last brought up to date, and a way
/// to do that now.
@MainActor
final class MemorySectionView: NSView {
    private let model: SettingsModel
    private let pathLabel = NSTextField(wrappingLabelWithString: "")
    private let lastSyncLabel = NSTextField(wrappingLabelWithString: "")
    private let pendingLabel = NSTextField(wrappingLabelWithString: "")
    private let resultLabel = NSTextField(wrappingLabelWithString: "")
    private let syncButton = NSButton(title: "Sync Now", target: nil, action: nil)
    private let spinner = NSProgressIndicator()

    init(model: SettingsModel, width: CGFloat) {
        self.model = model
        super.init(frame: .zero)

        pathLabel.font = .monospacedSystemFont(ofSize: 11, weight: .regular)
        pathLabel.textColor = .secondaryLabelColor
        pathLabel.preferredMaxLayoutWidth = width

        let openButton = NSButton(
            title: "Open Wiki Folder", target: self, action: #selector(openWikiClicked))
        openButton.bezelStyle = .rounded

        lastSyncLabel.font = .systemFont(ofSize: 12)
        lastSyncLabel.preferredMaxLayoutWidth = width
        pendingLabel.font = .systemFont(ofSize: 11)
        pendingLabel.textColor = .secondaryLabelColor
        pendingLabel.preferredMaxLayoutWidth = width
        resultLabel.font = .systemFont(ofSize: 11)
        resultLabel.textColor = .secondaryLabelColor
        resultLabel.preferredMaxLayoutWidth = width
        resultLabel.isHidden = true

        spinner.style = .spinning
        spinner.controlSize = .small
        spinner.isHidden = true
        syncButton.bezelStyle = .rounded
        syncButton.target = self
        syncButton.action = #selector(syncClicked)
        let syncRow = NSStackView(views: [syncButton, spinner])
        syncRow.orientation = .horizontal
        syncRow.spacing = 8
        syncRow.alignment = .centerY

        let stack = SettingsStyle.section(
            [
                SettingsStyle.heading("Your memory"),
                SettingsStyle.caption(
                    "Plain markdown you own. Open the folder in Finder, or point Obsidian at it as a vault.",
                    width: width),
                pathLabel,
                openButton,
                separator(width: width),
                SettingsStyle.heading("Syncing"),
                SettingsStyle.caption(
                    "Minne digests what it captured into wiki pages on a schedule. You can run a pass now.",
                    width: width),
                lastSyncLabel,
                pendingLabel,
                syncRow,
                resultLabel,
            ], width: width)
        SettingsStyle.fill(self, with: stack, width: width)

        model.observe(self) { [weak self] model in self?.render(model) }
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("not used") }

    private func separator(width: CGFloat) -> NSView {
        let line = NSBox()
        line.boxType = .separator
        line.widthAnchor.constraint(equalToConstant: width).isActive = true
        return line
    }

    private func render(_ model: SettingsModel) {
        pathLabel.stringValue = model.paths.wiki.path
        lastSyncLabel.stringValue = model.lastSyncLine
        pendingLabel.stringValue = model.pendingLine
        let running = model.syncPhase.isRunning
        spinner.isHidden = !running
        if running { spinner.startAnimation(nil) } else { spinner.stopAnimation(nil) }
        syncButton.isEnabled = model.canSyncNow
        switch model.syncPhase {
        case .finished(let summary):
            resultLabel.isHidden = false
            resultLabel.textColor = .secondaryLabelColor
            resultLabel.stringValue = summary
        case .failed(let reason):
            resultLabel.isHidden = false
            resultLabel.textColor = .systemRed
            resultLabel.stringValue = reason
        case .idle, .running:
            resultLabel.isHidden = true
        }
    }

    @objc private func openWikiClicked() {
        model.openWikiFolder()
    }

    @objc private func syncClicked() {
        model.syncNow()
    }
}

/// General: starting with the Mac, and the keys that summon Minne.
@MainActor
final class GeneralSectionView: NSView {
    private let model: SettingsModel
    private let launchCheckbox: NSButton
    private let hotKeyCheckbox: NSButton
    private let hotKeyNote = NSTextField(wrappingLabelWithString: "")
    private let minneKeyPopup = NSPopUpButton(frame: .zero, pullsDown: false)
    private let minneKeyNote = NSTextField(wrappingLabelWithString: "")

    init(model: SettingsModel, width: CGFloat) {
        self.model = model
        launchCheckbox = NSButton(
            checkboxWithTitle: "Launch Minne at login", target: nil, action: nil)
        hotKeyCheckbox = NSButton(
            checkboxWithTitle: "Open chat with ⌥Space", target: nil, action: nil)
        super.init(frame: .zero)

        launchCheckbox.target = self
        launchCheckbox.action = #selector(launchToggled)
        hotKeyCheckbox.target = self
        hotKeyCheckbox.action = #selector(hotKeyToggled)
        // A popup rather than a checkbox: on international (AltGr) layouts
        // right-Option is a typing key, and a future release re-maps the
        // trigger instead of only switching it off (US-103).
        minneKeyPopup.addItems(withTitles: MinneKeyTrigger.allCases.map(\.title))
        minneKeyPopup.target = self
        minneKeyPopup.action = #selector(minneKeyChanged)
        for note in [hotKeyNote, minneKeyNote] {
            note.font = .systemFont(ofSize: 11)
            note.textColor = .secondaryLabelColor
            note.preferredMaxLayoutWidth = width
        }

        let stack = SettingsStyle.section(
            [
                SettingsStyle.heading("Startup"),
                launchCheckbox,
                separator(width: width),
                SettingsStyle.heading("Shortcuts"),
                shortcutRow("Open chat", "⌥Space", width: width),
                shortcutRow("Wake Minne at the caret", "right ⌥", width: width),
                shortcutRow("Settings", "⌘,", width: width),
                shortcutRow("Close a Minne window", "esc", width: width),
                hotKeyCheckbox,
                hotKeyNote,
                minneKeyRow(width: width),
                minneKeyNote,
            ], width: width)
        SettingsStyle.fill(self, with: stack, width: width)

        model.observe(self) { [weak self] model in self?.render(model) }
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("not used") }

    private func separator(width: CGFloat) -> NSView {
        let line = NSBox()
        line.boxType = .separator
        line.widthAnchor.constraint(equalToConstant: width).isActive = true
        return line
    }

    private func shortcutRow(_ what: String, _ keys: String, width: CGFloat) -> NSView {
        let name = NSTextField(labelWithString: what)
        name.font = .systemFont(ofSize: 12)
        let shortcut = NSTextField(labelWithString: keys)
        shortcut.font = .monospacedSystemFont(ofSize: 12, weight: .medium)
        shortcut.alignment = .right
        let row = NSStackView(views: [name, shortcut])
        row.orientation = .horizontal
        row.distribution = .fill
        row.alignment = .firstBaseline
        name.widthAnchor.constraint(equalToConstant: width * 0.6).isActive = true
        return row
    }

    private func minneKeyRow(width: CGFloat) -> NSView {
        let name = NSTextField(labelWithString: "Wake Minne at the caret with")
        name.font = .systemFont(ofSize: 12)
        let row = NSStackView(views: [name, minneKeyPopup])
        row.orientation = .horizontal
        row.distribution = .fill
        row.alignment = .firstBaseline
        name.widthAnchor.constraint(equalToConstant: width * 0.6).isActive = true
        return row
    }

    private func render(_ model: SettingsModel) {
        launchCheckbox.state = LaunchAtLogin.isEnabled ? .on : .off
        launchCheckbox.isEnabled = LaunchAtLogin.isSupported
        launchCheckbox.toolTip =
            LaunchAtLogin.isSupported
            ? nil : "Only available when running from Minne.app (build with scripts/build.sh)"
        hotKeyCheckbox.state = model.hotKeyEnabled ? .on : .off
        hotKeyNote.stringValue = model.hotKeyLine
        if let index = MinneKeyTrigger.allCases.firstIndex(of: model.minneKeyTrigger) {
            minneKeyPopup.selectItem(at: index)
        }
        minneKeyNote.stringValue = model.minneKeyLine
    }

    @objc private func launchToggled() {
        do {
            try LaunchAtLogin.setEnabled(launchCheckbox.state == .on)
        } catch {
            BrainClient.log("launch at login toggle failed: \(error)")
        }
        render(model)
    }

    @objc private func hotKeyToggled() {
        model.setHotKeyEnabled(hotKeyCheckbox.state == .on)
    }

    @objc private func minneKeyChanged() {
        let index = minneKeyPopup.indexOfSelectedItem
        guard MinneKeyTrigger.allCases.indices.contains(index) else { return }
        model.setMinneKeyTrigger(MinneKeyTrigger.allCases[index])
    }
}
