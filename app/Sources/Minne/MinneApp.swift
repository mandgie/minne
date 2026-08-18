import AppKit

@main
@MainActor
final class MinneApp: NSObject, NSApplicationDelegate {
    /// Set once the user has seen the first-run flow, however it ended.
    private static let onboardingSeenKey = "onboardingSeen"

    private var statusController: StatusItemController?
    private var brainClient: BrainClient?
    private let permission = AccessibilityPermission()
    private var onboarding: OnboardingWindowController?
    private let authModel = AuthModel()
    private let chatModel = ChatModel()
    private let settingsStore = SettingsStore()
    private var settingsModel: SettingsModel?
    private var settings: SettingsWindowController?
    private var chat: ChatWindowController?
    private var chatHotKey: GlobalHotKey?
    private var minneKey: MinneKeyController?
    /// Held only by `-minneKeyPreview`, which needs the panel to outlive the
    /// call that put it on screen.
    private var minneKeyPreview: MinneKeyOverlayController?
    private var capture: CaptureEngine?
    private var store: SourceStore?
    private var retentionTimer: Timer?
    /// Last persistence failure logged, so a broken disk cannot flood stderr.
    private var lastStoreError: String?

    static func main() {
        let app = NSApplication.shared
        let delegate = MinneApp()
        app.delegate = delegate
        // Accessory policy = no Dock icon, matching LSUIElement in the bundled app.
        app.setActivationPolicy(.accessory)
        app.run()
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        let settingsModel = makeSettingsModel()
        self.settingsModel = settingsModel

        // Before the status item exists: a fresh install on a notched MacBook
        // needs its menu-bar slot seeded or macOS may silently not render it.
        StatusItemPlacement.applyDefaultIfNeeded()

        let controller = StatusItemController(
            permission: permission.state,
            debugActions: [
                .init(title: "Search memory…") { [weak self] in self?.testSearchSources() },
                .init(title: "Show Onboarding…") { [weak self] in self?.showOnboarding() },
            ])
        controller.onOpenChat = { [weak self] in self?.showChat() }
        controller.onOpenSettings = { [weak self] in self?.showSettings() }
        controller.onOpenOnboarding = { [weak self] in self?.showOnboarding() }
        controller.onPauseChange = { [weak self] pause in
            self?.capture?.update(pause: pause)
            self?.settingsModel?.adopt(pause: pause)
        }
        statusController = controller
        // Auth state is live in the menu bar the moment the brain reports it,
        // and after every login, logout and provider switch.
        authModel.observe(controller) { [weak controller] auth in
            controller?.update(account: auth.state)
        }

        startChat()
        startMinneKey()
        startCapture()
        startPermissionTracking()
        connectBrain()

        if let section = Self.launchSettingsSection() { showSettings(section: section) }
        startMinneKeyPreview()
    }

    // MARK: - Settings

    /// Builds the settings model and connects each setting to the part of the
    /// running app it controls — which is what "takes effect without restart"
    /// means in practice: an edit here reaches the live capture engine, the
    /// retention sweep, the status item and the hotkey, with no relaunch.
    private func makeSettingsModel() -> SettingsModel {
        let model = SettingsModel(
            auth: authModel, store: settingsStore, permission: permission.state)
        model.onBlacklistChange = { [weak self] blacklist in
            self?.capture?.update(blacklist: blacklist)
            // The Minne key obeys the same list: an app whose contents may not
            // become memory may not become a prompt either.
            self?.minneKey?.update(blacklist: blacklist)
        }
        model.onRetentionChange = { [weak self] policy in
            // A shorter retention makes captures overdue right now, not at the
            // next daily tick.
            self?.sweepRetention(policy: policy)
        }
        model.onRequestPause = { [weak self] pause in self?.statusController?.setPause(pause) }
        // Opens the folder itself rather than selecting it in its parent: the
        // point is to look inside the wiki (or drag it onto Obsidian).
        model.onOpenFolder = { url in NSWorkspace.shared.open(url) }
        model.onHotKeyChange = { [weak self] enabled in self?.updateChatHotKey(enabled: enabled) }
        model.onMinneKeyChange = { [weak self] enabled in self?.minneKey?.setEnabled(enabled) }
        model.onWipe = { [weak self] paths in
            guard let self else { return MemoryWipe.wipe(paths: paths) }
            return self.wipeMemory(paths: paths)
        }
        return model
    }

    private func showSettings(section: SettingsModel.Section = .account) {
        guard let settingsModel else { return }
        if settings == nil {
            let controller = SettingsWindowController(model: settingsModel)
            controller.onShowSetup = { [weak self] in self?.showOnboarding() }
            settings = controller
        }
        settings?.show(section: section)
    }

    /// Debug hook: `-settingsSection privacy` opens Settings straight at a
    /// section, which is how each one is screenshotted without clicking.
    private static func launchSettingsSection() -> SettingsModel.Section? {
        guard let raw = UserDefaults.standard.string(forKey: "settingsSection") else { return nil }
        return SettingsModel.Section(rawValue: raw)
    }

    /// Closes the index before its file is deleted and reopens it afterwards,
    /// which re-seeds an empty memory root. The deletion itself is
    /// `MemoryWipe`; this is the part only the app can do.
    private func wipeMemory(paths: MemoryPaths) -> MemoryWipe.Report {
        store = nil
        let report = MemoryWipe.wipe(paths: paths)
        startStore()
        return report
    }

    // MARK: - Chat

    private func startChat() {
        chat = ChatWindowController(model: chatModel)
        updateChatHotKey(enabled: settingsModel?.hotKeyEnabled ?? true)
    }

    /// Registers or drops ⌥Space. Carbon refuses a combination another app
    /// already owns, so what Settings shows is the *registration*, not the
    /// preference.
    private func updateChatHotKey(enabled: Bool) {
        guard enabled else {
            chatHotKey = nil
            settingsModel?.adopt(hotKeyRegistered: false)
            BrainClient.log("⌥Space turned off in Settings — chat opens from the menu bar")
            return
        }
        chatHotKey = GlobalHotKey(
            keyCode: GlobalHotKey.optionSpace.keyCode,
            modifiers: GlobalHotKey.optionSpace.modifiers
        ) { [weak self] in
            self?.chat?.toggle()
        }
        settingsModel?.adopt(hotKeyRegistered: chatHotKey != nil)
        if chatHotKey == nil {
            BrainClient.log("⌥Space is taken by another app — chat opens from the menu bar only")
        }
    }

    private func showChat() {
        chat?.show()
    }

    // MARK: - The Minne key

    /// Right-Option at the caret (US-017). Unlike ⌥Space, this one needs
    /// Accessibility — it is a `CGEventTap` — so it comes and goes with the
    /// grant as well as with the setting.
    private func startMinneKey() {
        let controller = MinneKeyController(
            // Debug hook: `-minneKeyForcePaste YES` takes the pasteboard
            // fallback in every app, which is the only way to exercise it in
            // one that would have accepted an AX write.
            writer: AccessibilityFieldWriter(
                forcePasteboard: UserDefaults.standard.bool(forKey: "minneKeyForcePaste")),
            enabled: settingsModel?.minneKeyEnabled ?? true, permission: permission.state,
            blacklist: settingsStore.blacklist)
        controller.onActiveChange = { [weak self] active in
            self?.settingsModel?.adopt(minneKeyActive: active)
        }
        minneKey = controller
        settingsModel?.adopt(minneKeyActive: controller.isActive)
    }

    /// Debug hook: `-minneKeyPreview result` puts the overlay on screen in one
    /// state, with no key press and no model behind it. Every other way of
    /// reaching a state needs a caret in another app and a draft coming back,
    /// which makes each of the six a race — and none of them can be reached at
    /// all with the screen locked, where a window-id capture still works.
    private func startMinneKeyPreview() {
        guard let raw = UserDefaults.standard.string(forKey: "minneKeyPreview"),
            let state = Self.previewState(raw)
        else { return }
        let target = CaretTarget(
            bundleIdentifier: "com.google.Chrome", appName: "Google Chrome",
            anchor: CaretAnchor(
                rect: CGRect(x: 220, y: 260, width: 1, height: 18), source: .caret))
        // `-minneKeyPreviewAppearance dark` forces the other palette. AppKit
        // takes the appearance from the system and ignores the usual
        // `-AppleInterfaceStyle` argument, so this is the only way to see the
        // dark side of the panel without changing the user's own setting.
        switch UserDefaults.standard.string(forKey: "minneKeyPreviewAppearance") {
        case "dark": NSApp.appearance = NSAppearance(named: .darkAqua)
        case "light": NSApp.appearance = NSAppearance(named: .aqua)
        default: break
        }
        let overlay = MinneKeyOverlayController()
        minneKeyPreview = overlay
        overlay.present(target, state: state.state)
        if !state.guidance.isEmpty { overlay.update(guidance: state.guidance) }
        // The *look* of the focused field, never the keyboard itself: this hook
        // exists to be run on a machine somebody is using. `-minneKeyPreviewGuiding
        // key` asks for the real thing — the panel actually borrows key status —
        // which is how the focus hand-off gets verified against a real target
        // app, and must only be run when nobody is typing.
        if state.guiding {
            if UserDefaults.standard.string(forKey: "minneKeyPreviewGuiding") == "key" {
                overlay.beginGuiding()
            } else {
                overlay.previewGuiding()
            }
        }
    }

    /// One preview: what the panel shows, which steers are in force, and
    /// whether the guidance field is drawn focused.
    private struct MinneKeyPreview {
        var state: MinneKeyOverlayState
        var guidance: [String] = []
        var guiding = false
    }

    private static let previewDraft = """
        Hei Ingrid — torsdag passer fint for meg. Skal vi si 14:00 på \
        kontoret? Da rekker vi å gå gjennom både budsjettet og \
        Oslo-flyttingen før du reiser.
        """

    /// Built through the real formatter, so the preview drifts with the rule
    /// rather than with somebody's memory of it.
    private static let previewGrounding = MinneKeyGrounding.line(
        memoryPages: ["wiki/ingrid-berg.md", "wiki/oslo-flytting.md"],
        stylePage: "wiki/style/style-messages-ingrid-berg.md")

    private static func previewState(_ raw: String) -> MinneKeyPreview? {
        switch raw {
        case "working": return MinneKeyPreview(state: .working(.infer))
        case "consulting":
            return MinneKeyPreview(state: .consulting(.infer, tool: "search_memory"))
        case "result":
            return MinneKeyPreview(state: .result(previewDraft, grounding: previewGrounding))
        case "long":
            // The elision boundary, to see how tall the panel gets at its worst.
            return MinneKeyPreview(
                state: .result(
                    String(
                        repeating: "Takk for tålmodigheten — jeg rekker det før fredag. ",
                        count: 12),
                    grounding: previewGrounding))
        case "regenerating":
            return MinneKeyPreview(state: .reworking(.another, previous: previewDraft))
        case "guiding":
            return MinneKeyPreview(
                state: .result(previewDraft, grounding: previewGrounding), guiding: true)
        case "guiding-steered":
            // The busiest the guidance line ever gets: the rule in the accent,
            // the steers already in force under it, and the field live.
            return MinneKeyPreview(
                state: .result(previewDraft, grounding: previewGrounding),
                guidance: ["warmer", "mention the Friday deadline"], guiding: true)
        case "guided":
            return MinneKeyPreview(
                state: .result(
                    """
                    Hei Ingrid! Torsdag passer veldig fint — 14:00 på kontoret? \
                    Da rekker vi budsjettet og Oslo-flyttingen før du reiser, og \
                    fristen på fredag er trygg.
                    """,
                    grounding: previewGrounding),
                guidance: ["warmer", "mention the Friday deadline"])
        case "reworking":
            return MinneKeyPreview(
                state: .reworking(.guided, previous: previewDraft),
                guidance: ["warmer", "mention the Friday deadline"])
        case "inserted": return MinneKeyPreview(state: .inserted(.pasteboard))
        case "undone": return MinneKeyPreview(state: .undone)
        case "failed":
            return MinneKeyPreview(
                state: .failed("Google Chrome did not take the draft — use Copy"))
        default: return nil
        }
    }

    // MARK: - Capture

    private func startCapture() {
        startStore()
        var configuration = CaptureScheduler.Configuration()
        // The blacklist the user last left in Settings, not the shipped default.
        configuration.blacklist = settingsStore.blacklist
        let engine = CaptureEngine(
            source: AccessibilityWindowSource(), permission: permission.state,
            configuration: configuration)
        engine.onSnapshot = { [weak self] snapshot in
            BrainClient.log("capture: \(snapshot.logSummary)")
            self?.persist(snapshot)
        }
        engine.update(pause: statusController?.pauseState ?? .active)
        capture = engine
        engine.start()
    }

    // MARK: - Raw source store

    /// Opens `~/Minne` and the search index. A failure here (unwritable home,
    /// corrupt database) costs persistence, not the app: capture keeps running
    /// and the menu bar stays alive.
    private func startStore() {
        retentionTimer?.invalidate()
        do {
            let store = try SourceStore()
            self.store = store
            BrainClient.log(
                "memory root \(store.paths.memoryRoot.path) ready — \(try store.indexedCount()) snapshots indexed"
            )
            sweepRetention()
            // Sources age out while the app just sits there, so the sweep also
            // runs on a daily timer rather than only at launch.
            let timer = Timer(timeInterval: 86_400, repeats: true) { [weak self] _ in
                Task { @MainActor in self?.sweepRetention() }
            }
            RunLoop.main.add(timer, forMode: .common)
            retentionTimer = timer
        } catch {
            BrainClient.log("memory root unavailable — captures will not be persisted: \(error)")
        }
    }

    private func persist(_ snapshot: CaptureSnapshot) {
        guard let store else { return }
        do {
            let reference = try store.record(snapshot)
            lastStoreError = nil
            BrainClient.log("stored \(reference.citation)")
        } catch {
            let message = "\(error)"
            guard message != lastStoreError else { return }
            lastStoreError = message
            BrainClient.log("failed to store capture: \(message)")
        }
    }

    private func sweepRetention(policy: RetentionPolicy = .fromUserDefaults()) {
        guard let store else { return }
        do {
            let report = try store.prune(policy: policy)
            guard !report.isEmpty else { return }
            BrainClient.log(
                "retention: pruned \(report.removedSnapshots) snapshots from \(report.removedDays.count) day(s)"
            )
        } catch {
            BrainClient.log("retention sweep failed: \(error)")
        }
    }

    // MARK: - Accessibility permission / onboarding

    private func startPermissionTracking() {
        BrainClient.log(
            permission.state.isGranted
                ? "accessibility granted — capture engine running"
                : "accessibility missing — running in degraded no-capture mode")
        permission.onChange = { [weak self] state in
            guard let self else { return }
            self.statusController?.update(permission: state)
            self.onboarding?.permissionChanged(state)
            self.capture?.update(permission: state)
            self.minneKey?.update(permission: state)
            self.settingsModel?.adopt(permission: state)
        }
        permission.startPolling(interval: AccessibilityPermission.backgroundInterval)

        if let step = Self.launchOnboardingStep() {
            showOnboarding(startingAt: step)
        } else if !UserDefaults.standard.bool(forKey: Self.onboardingSeenKey) {
            showOnboarding()
        }
    }

    /// Debug hook: `-onboardingStep provider` opens the first-run flow straight
    /// at the provider step. It exists because a UI state can only be verified
    /// on a machine where it can be reached, and clicking through onboarding is
    /// not always available (a locked screen drives nothing).
    private static func launchOnboardingStep() -> OnboardingStep? {
        switch UserDefaults.standard.string(forKey: "onboardingStep") {
        case "provider": return .chooseProvider
        case "welcome": return .welcome
        case "permission": return .requestPermission
        case "granted": return .granted
        default: return nil
        }
    }

    /// Debug hook: `-autoSignIn claude|chatgpt|local|apiKey|mock` picks that
    /// card and presses Sign In as soon as the brain answers, so the sign-in
    /// states can be reached without a click.
    private func startAutoSignIn() {
        guard let raw = UserDefaults.standard.string(forKey: "autoSignIn"),
            let choice = ProviderChoice(rawValue: raw)
        else { return }
        Task { [weak self] in
            // Wait for the first `status`, so the sign-in carries the model the
            // picker would have shown rather than none at all.
            for _ in 0..<20 {
                if self?.authModel.state != nil { break }
                try? await Task.sleep(nanoseconds: 100_000_000)
            }
            guard let self else { return }
            BrainClient.log("debug: auto sign-in with the \(raw) card")
            self.authModel.select(choice)
            self.authModel.signIn()
        }
    }

    /// Opens the first-run flow. Reopened from the menu it starts wherever the
    /// caller asks: the capture hint sends the user back to the beginning, the
    /// account entry straight to the provider step, which then shows what the
    /// brain is currently signed in to and lets it be changed.
    private func showOnboarding(startingAt step: OnboardingStep = .welcome) {
        let controller =
            onboarding
            ?? OnboardingWindowController(
                permission: permission.state, auth: authModel, step: step)
        onboarding = controller
        controller.onFinished = { [weak self] in
            guard let self else { return }
            UserDefaults.standard.set(true, forKey: Self.onboardingSeenKey)
            self.onboarding = nil
            // Back to the cheap background cadence.
            self.permission.startPolling(interval: AccessibilityPermission.backgroundInterval)
        }
        // Tight polling only while the window is up, so the grant lands live.
        permission.startPolling(interval: AccessibilityPermission.foregroundInterval)
        permission.poll()
        controller.show()
    }

    func applicationDidBecomeActive(_ notification: Notification) {
        // Coming back from System Settings should feel instant.
        permission.poll()
        // And a return with the grant still missing is the stale-switch
        // signal the permission step escalates on.
        onboarding?.applicationBecameActive()
    }

    private func connectBrain() {
        guard let launch = BrainLaunch.locate() else {
            BrainClient.log("no brain found — set MINNE_BRAIN_PATH or run scripts/build.sh")
            statusController?.update(connection: .failed(reason: "brain binary not found"))
            return
        }
        let client = BrainClient(launch: launch)
        brainClient = client
        chatModel.backend = BrainChatBackend(client: client)
        authModel.backend = BrainAuthBackend(client: client)
        minneKey?.backend = BrainDraftBackend(client: client)
        settingsModel?.backend = BrainSettingsBackend(client: client)
        Task { [weak self] in
            do {
                let hello = try await client.start()
                BrainClient.log(
                    "handshake OK: protocol \(hello.protocolVersion), brain v\(hello.brainVersion)")
                self?.authModel.refresh()
                self?.startAutoSignIn()
            } catch {
                BrainClient.log("handshake failed: \(error)")
            }
        }
        // Drive the menu-bar UI from the client's connection state.
        Task { [weak self] in
            for await connection in client.connectionStates {
                self?.statusController?.update(connection: connection)
            }
        }
        // Single consumer of the brain's intermediate events, fanned out to the
        // two models that care: the chat window and the sign-in flow.
        Task { [weak self] in
            for await event in client.events {
                self?.handleBrainEvent(event)
            }
        }
    }

    /// Round-trips a query through the brain's `search_sources` — the app
    /// writes the index, the brain reads it. Chat asks the same question
    /// through its tools; this stays as a debug probe of the raw index.
    private func testSearchSources() {
        guard let client = brainClient else {
            BrainClient.log("search: brain not connected")
            return
        }
        guard
            let query = promptUser(
                message: "Search your captures", placeholder: nil, secure: false),
            !query.isEmpty
        else { return }
        Task {
            do {
                let result = try await client.request(
                    .searchSources(id: UUID().uuidString, query: query, limit: 5))
                BrainClient.log("search results: \(String(describing: result))")
            } catch {
                BrainClient.log("search failed: \(error)")
            }
        }
    }

    private func handleBrainEvent(_ event: BrainEvent) {
        switch event {
        case .toolCall(let id, let name, _):
            // Both the chat window and the Minne key run agents with tools;
            // each ignores anything that isn't its own in-flight request.
            chatModel.apply(event)
            minneKey?.toolStarted(requestId: id, name: name)
        case .textDelta:
            chatModel.apply(event)
        case .authURL, .authPrompt:
            // The provider step opens the browser and renders prompts natively;
            // events from any other request are ignored there.
            authModel.apply(event)
        case .progress(_, let message, _):
            BrainClient.log("brain progress: \(message)")
            authModel.apply(event)
        default:
            break
        }
    }

    /// Modal text prompt; returns nil on cancel. Debug-quality UI by design.
    private func promptUser(message: String, placeholder: String?, secure: Bool) -> String? {
        let alert = NSAlert()
        alert.messageText = "Minne sign-in"
        alert.informativeText = message
        let frame = NSRect(x: 0, y: 0, width: 320, height: 24)
        let field: NSTextField =
            secure ? NSSecureTextField(frame: frame) : NSTextField(frame: frame)
        field.placeholderString = placeholder
        alert.accessoryView = field
        alert.addButton(withTitle: "OK")
        alert.addButton(withTitle: "Cancel")
        NSApp.activate(ignoringOtherApps: true)
        alert.window.initialFirstResponder = field
        guard alert.runModal() == .alertFirstButtonReturn else { return nil }
        return field.stringValue
    }

    func applicationWillTerminate(_ notification: Notification) {
        capture?.stop()
        retentionTimer?.invalidate()
        guard let client = brainClient else { return }
        // Best effort: let the brain exit cleanly on stdin close before we die.
        let semaphore = DispatchSemaphore(value: 0)
        Task.detached {
            await client.stop()
            semaphore.signal()
        }
        _ = semaphore.wait(timeout: .now() + 2)
    }
}
