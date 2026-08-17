import AppKit

/// Owns the NSStatusItem and its menu: brain status row, Open Chat,
/// Pause Capture submenu, Settings, launch-at-login toggle, Debug submenu,
/// Quit. All volatile display logic lives in MenuModel; this class only
/// applies MenuAppearance to AppKit objects.
@MainActor
final class StatusItemController: NSObject {
    struct DebugAction {
        let title: String
        let handler: @MainActor () -> Void
    }

    var onOpenChat: (@MainActor () -> Void)?
    var onOpenSettings: (@MainActor () -> Void)?
    /// Clicking the "capture off" hint reopens the first-run flow.
    var onOpenOnboarding: (@MainActor () -> Void)?
    /// Fires whenever the pause state changes, including the automatic
    /// resume when a timed pause expires. The capture engine listens.
    var onPauseChange: (@MainActor (PauseState) -> Void)?

    /// Current pause state, with an expired timed pause already collapsed.
    var pauseState: PauseState { pause.resolved(now: Date()) }

    private let statusItem: NSStatusItem
    private let menu = NSMenu()
    private let statusRow: NSMenuItem
    private let hintItem: NSMenuItem
    private let pauseItem: NSMenuItem
    private let resumeItem: NSMenuItem
    private let launchAtLoginItem: NSMenuItem
    private let debugActions: [DebugAction]

    private var connection: BrainConnectionState = .connecting
    private var permission: CapturePermissionState
    private var pause: PauseState = .active
    private var resumeTimer: Timer?

    init(permission: CapturePermissionState, debugActions: [DebugAction]) {
        self.permission = permission
        self.debugActions = debugActions
        self.statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        self.statusRow = NSMenuItem(title: "Brain: starting…", action: nil, keyEquivalent: "")
        self.hintItem = NSMenuItem(title: "", action: nil, keyEquivalent: "")
        self.pauseItem = NSMenuItem(title: "Pause Capture", action: nil, keyEquivalent: "")
        self.resumeItem = NSMenuItem(title: "Resume Now", action: nil, keyEquivalent: "")
        self.launchAtLoginItem = NSMenuItem(
            title: "Launch at Login", action: nil, keyEquivalent: "")
        super.init()
        buildMenu()
        applyAppearance()
    }

    // MARK: - State inputs

    func update(connection: BrainConnectionState) {
        self.connection = connection
        applyAppearance()
    }

    func update(permission: CapturePermissionState) {
        self.permission = permission
        applyAppearance()
    }

    private func setPause(_ newState: PauseState) {
        pause = newState
        resumeTimer?.invalidate()
        resumeTimer = nil
        if case .paused(.some(let until)) = newState {
            // Auto-resume when the timed pause expires, so the icon flips
            // back without waiting for the user to open the menu.
            let timer = Timer(fire: until, interval: 0, repeats: false) { [weak self] _ in
                Task { @MainActor in self?.setPause(.active) }
            }
            RunLoop.main.add(timer, forMode: .common)
            resumeTimer = timer
        }
        BrainClient.log("capture pause state: \(newState)")
        onPauseChange?(newState)
        applyAppearance()
    }

    // MARK: - Menu construction

    private func buildMenu() {
        menu.autoenablesItems = false
        menu.delegate = self

        statusRow.isEnabled = false
        menu.addItem(statusRow)

        hintItem.action = #selector(openOnboardingAction)
        hintItem.target = self
        hintItem.image = NSImage(
            systemSymbolName: "exclamationmark.triangle", accessibilityDescription: nil)
        menu.addItem(hintItem)
        menu.addItem(.separator())

        // ⌥Space is a Carbon global hotkey (GlobalHotKey); the key equivalent
        // here is for discoverability — the menu shows the shortcut.
        let openChat = NSMenuItem(
            title: "Open Chat", action: #selector(openChatAction), keyEquivalent: " ")
        openChat.keyEquivalentModifierMask = [.option]
        openChat.target = self
        menu.addItem(openChat)

        let pauseMenu = NSMenu()
        pauseMenu.autoenablesItems = false
        resumeItem.action = #selector(resumeNow)
        resumeItem.target = self
        resumeItem.isHidden = true
        pauseMenu.addItem(resumeItem)
        for (title, selector) in [
            ("For 15 Minutes", #selector(pauseFor15Minutes)),
            ("For 1 Hour", #selector(pauseFor1Hour)),
            ("Until Resumed", #selector(pauseUntilResumed)),
        ] {
            let item = NSMenuItem(title: title, action: selector, keyEquivalent: "")
            item.target = self
            pauseMenu.addItem(item)
        }
        pauseItem.submenu = pauseMenu
        menu.addItem(pauseItem)

        let settings = NSMenuItem(
            title: "Settings…", action: #selector(openSettingsAction), keyEquivalent: ",")
        settings.target = self
        menu.addItem(settings)

        launchAtLoginItem.action = #selector(toggleLaunchAtLogin)
        launchAtLoginItem.target = self
        if !LaunchAtLogin.isSupported {
            launchAtLoginItem.isEnabled = false
            launchAtLoginItem.toolTip =
                "Only available when running from Minne.app (build with scripts/build.sh)"
            BrainClient.log("launch at login unavailable: not running from a .app bundle")
        }
        menu.addItem(launchAtLoginItem)
        menu.addItem(.separator())

        let debugMenu = NSMenu()
        debugMenu.autoenablesItems = false
        for (index, action) in debugActions.enumerated() {
            let item = NSMenuItem(
                title: action.title, action: #selector(runDebugAction(_:)), keyEquivalent: "")
            item.target = self
            item.tag = index
            debugMenu.addItem(item)
        }
        let debugItem = NSMenuItem(title: "Debug", action: nil, keyEquivalent: "")
        debugItem.submenu = debugMenu
        menu.addItem(debugItem)
        menu.addItem(.separator())

        menu.addItem(
            NSMenuItem(
                title: "Quit Minne",
                // nil target: resolves to NSApplication, so quitting runs
                // through applicationWillTerminate and stops the brain.
                action: #selector(NSApplication.terminate(_:)),
                keyEquivalent: "q"))

        statusItem.menu = menu
    }

    // MARK: - Rendering

    private func applyAppearance() {
        let appearance = MenuModel.appearance(
            connection: connection, permission: permission, pause: pause, now: Date())
        if let button = statusItem.button {
            button.image = NSImage(
                systemSymbolName: appearance.symbolName, accessibilityDescription: "Minne")
            button.appearsDisabled = appearance.appearsDisabled
            button.toolTip = appearance.hintText
        }
        statusRow.title = appearance.statusText
        hintItem.title = appearance.hintText ?? ""
        hintItem.isHidden = appearance.hintText == nil
        pauseItem.title = appearance.pauseItemTitle
        resumeItem.isHidden = !pause.resolved(now: Date()).isPaused
        launchAtLoginItem.state = LaunchAtLogin.isEnabled ? .on : .off
    }

    // MARK: - Actions

    @objc private func openChatAction() {
        onOpenChat?()
    }

    @objc private func openSettingsAction() {
        onOpenSettings?()
    }

    @objc private func openOnboardingAction() {
        onOpenOnboarding?()
    }

    @objc private func pauseFor15Minutes() {
        setPause(.paused(until: Date().addingTimeInterval(15 * 60)))
    }

    @objc private func pauseFor1Hour() {
        setPause(.paused(until: Date().addingTimeInterval(60 * 60)))
    }

    @objc private func pauseUntilResumed() {
        setPause(.paused(until: nil))
    }

    @objc private func resumeNow() {
        setPause(.active)
    }

    @objc private func toggleLaunchAtLogin() {
        do {
            try LaunchAtLogin.setEnabled(!LaunchAtLogin.isEnabled)
        } catch {
            BrainClient.log("launch at login toggle failed: \(error)")
        }
        applyAppearance()
    }

    @objc private func runDebugAction(_ sender: NSMenuItem) {
        guard debugActions.indices.contains(sender.tag) else { return }
        debugActions[sender.tag].handler()
    }
}

extension StatusItemController: NSMenuDelegate {
    /// Refreshes countdowns (restart retry, pause time left) each time the
    /// menu opens, since they drift while the menu is closed.
    func menuNeedsUpdate(_ menu: NSMenu) {
        applyAppearance()
    }
}
