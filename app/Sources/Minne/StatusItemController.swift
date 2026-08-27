import AppKit

/// Owns the NSStatusItem and its menu: brain status row, Open Chat,
/// Open Memory Folder, Recently remembered submenu, Pause Capture submenu,
/// Settings, launch-at-login toggle, Debug submenu, Quit. All volatile display
/// logic lives in MenuModel/RecentMemoryMenu; this class only applies it to
/// AppKit objects.
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
    /// "Open Memory Folder": show the memory root in Finder.
    var onOpenMemoryFolder: (@MainActor () -> Void)?
    /// A "Recently remembered" page was picked; the argument is its path
    /// relative to the memory root.
    var onOpenRecentPage: (@MainActor (String) -> Void)?
    /// The menu is about to open: ask the brain for a fresh recent list. The
    /// call is async over stdio, so the menu shows the last-known list now and
    /// the answer lands via `update(recentPages:)` — NSMenu re-renders a live
    /// submenu, so usually while this open is still up, at worst for the next.
    var onRefreshRecentPages: (@MainActor () -> Void)?
    /// "Update Available" was clicked; the argument is the release page URL
    /// the brain reported, when it reported one.
    var onOpenUpdate: (@MainActor (String?) -> Void)?

    /// Current pause state, with an expired timed pause already collapsed.
    var pauseState: PauseState { pause.resolved(now: Date()) }

    private let statusItem: NSStatusItem
    private let menu = NSMenu()
    private let versionRow: NSMenuItem
    private let updateItem: NSMenuItem
    private let statusRow: NSMenuItem
    private let accountRow: NSMenuItem
    private let hintItem: NSMenuItem
    private let pauseItem: NSMenuItem
    private let resumeItem: NSMenuItem
    private let launchAtLoginItem: NSMenuItem
    private let recentMenu = NSMenu()
    private let debugActions: [DebugAction]

    private var connection: BrainConnectionState = .connecting
    private var permission: CapturePermissionState
    private var pause: PauseState = .active
    private var account: AuthState?
    /// Last `update_check` answer; nil until one lands (or after checks are
    /// turned off), which simply hides the row.
    private var updateInfo: UpdateInfo?
    /// Last list the brain sent; the submenu renders this while a refresh flies.
    private var recentPages: [RecentMemoryPage] = []
    private var resumeTimer: Timer?

    init(permission: CapturePermissionState, debugActions: [DebugAction]) {
        self.permission = permission
        self.debugActions = debugActions
        self.statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        self.versionRow = NSMenuItem(title: "Minne", action: nil, keyEquivalent: "")
        self.updateItem = NSMenuItem(title: "", action: nil, keyEquivalent: "")
        self.statusRow = NSMenuItem(title: "Brain: starting…", action: nil, keyEquivalent: "")
        self.accountRow = NSMenuItem(title: "Account: checking…", action: nil, keyEquivalent: "")
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

    /// The brain's auth state changed (a login, a logout, a provider switch).
    func update(account: AuthState?) {
        self.account = account
        applyAppearance()
    }

    /// The brain answered `update_check`. Nil clears the row (checks off).
    func update(update: UpdateInfo?) {
        self.updateInfo = update
        applyAppearance()
    }

    /// The brain answered `memory_recent` (fired when the menu opened).
    func update(recentPages: [RecentMemoryPage]) {
        self.recentPages = recentPages
        renderRecentPages()
    }

    /// The one way pause changes, whoever asked: the menu's own items, or the
    /// Privacy section of Settings. Everything downstream (the icon, the
    /// capture engine, the settings window) hangs off `onPauseChange`, so there
    /// is a single pause state rather than one per window.
    func setPause(_ newState: PauseState) {
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

        versionRow.isEnabled = false
        menu.addItem(versionRow)

        // Hidden until an update_check reports a newer release; clicking
        // opens its release page. No auto-download — updating stays a
        // deliberate drag-to-Applications.
        updateItem.action = #selector(openUpdateAction)
        updateItem.target = self
        updateItem.image = NSImage(
            systemSymbolName: "arrow.down.circle", accessibilityDescription: nil)
        updateItem.isHidden = true
        menu.addItem(updateItem)

        statusRow.isEnabled = false
        menu.addItem(statusRow)

        accountRow.isEnabled = false
        menu.addItem(accountRow)

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

        // The memory, inspectable: the folder itself, and the pages the brain
        // touched most recently (US-108).
        let openMemory = NSMenuItem(
            title: "Open Memory Folder", action: #selector(openMemoryFolderAction),
            keyEquivalent: "")
        openMemory.target = self
        menu.addItem(openMemory)

        recentMenu.autoenablesItems = false
        let recentItem = NSMenuItem(title: "Recently remembered", action: nil, keyEquivalent: "")
        recentItem.submenu = recentMenu
        menu.addItem(recentItem)
        renderRecentPages()

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
            connection: connection, permission: permission, pause: pause, account: account,
            appVersion: AppVersion.current, update: updateInfo, now: Date())
        if let button = statusItem.button {
            button.image = NSImage(
                systemSymbolName: appearance.symbolName, accessibilityDescription: "Minne")
            button.appearsDisabled = appearance.appearsDisabled
            button.toolTip = appearance.hintText
        }
        versionRow.title = appearance.versionText
        updateItem.title = appearance.updateText ?? ""
        updateItem.isHidden = appearance.updateText == nil
        statusRow.title = appearance.statusText
        accountRow.title = appearance.accountText
        hintItem.title = appearance.hintText ?? ""
        hintItem.isHidden = appearance.hintText == nil
        pauseItem.title = appearance.pauseItemTitle
        resumeItem.isHidden = !pause.resolved(now: Date()).isPaused
        launchAtLoginItem.state = LaunchAtLogin.isEnabled ? .on : .off
    }

    /// Rebuilds the "Recently remembered" submenu from the last list the brain
    /// sent. What each row says is RecentMemoryMenu's business; this only makes
    /// NSMenuItems out of its entries.
    private func renderRecentPages() {
        recentMenu.removeAllItems()
        let entries = RecentMemoryMenu.entries(pages: recentPages, today: RecentMemoryMenu.today())
        for entry in entries {
            let item = NSMenuItem(title: entry.title, action: nil, keyEquivalent: "")
            if let path = entry.path {
                item.action = #selector(openRecentPageAction(_:))
                item.target = self
                item.representedObject = path
            } else {
                item.isEnabled = false
            }
            recentMenu.addItem(item)
        }
    }

    // MARK: - Actions

    @objc private func openChatAction() {
        onOpenChat?()
    }

    @objc private func openUpdateAction() {
        onOpenUpdate?(updateInfo?.url)
    }

    @objc private func openSettingsAction() {
        onOpenSettings?()
    }

    @objc private func openOnboardingAction() {
        onOpenOnboarding?()
    }

    @objc private func openMemoryFolderAction() {
        onOpenMemoryFolder?()
    }

    @objc private func openRecentPageAction(_ sender: NSMenuItem) {
        guard let path = sender.representedObject as? String else { return }
        onOpenRecentPage?(path)
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
    /// Refreshes countdowns (restart retry, pause time left) and the recent
    /// list's relative times each time the menu opens, since they drift while
    /// the menu is closed — and fires an async refresh of the recent pages.
    func menuNeedsUpdate(_ menu: NSMenu) {
        applyAppearance()
        renderRecentPages()
        onRefreshRecentPages?()
    }
}
