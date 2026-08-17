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
    private let chatModel = ChatModel()
    private var chat: ChatWindowController?
    private var chatHotKey: GlobalHotKey?
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
        let controller = StatusItemController(
            permission: permission.state,
            debugActions: [
                // Temporary debug entries until US-014 builds the real UI.
                .init(title: "Sign in to Claude…") { [weak self] in self?.signInAnthropic() },
                .init(title: "Search memory…") { [weak self] in self?.testSearchSources() },
                .init(title: "Show Onboarding…") { [weak self] in self?.showOnboarding() },
            ])
        controller.onOpenChat = { [weak self] in self?.showChat() }
        controller.onOpenSettings = {
            BrainClient.log("Settings: settings window arrives in US-015")
        }
        controller.onOpenOnboarding = { [weak self] in self?.showOnboarding() }
        controller.onPauseChange = { [weak self] pause in self?.capture?.update(pause: pause) }
        statusController = controller

        startChat()
        startCapture()
        startPermissionTracking()
        connectBrain()
    }

    // MARK: - Chat

    private func startChat() {
        chat = ChatWindowController(model: chatModel)
        chatHotKey = GlobalHotKey(
            keyCode: GlobalHotKey.optionSpace.keyCode,
            modifiers: GlobalHotKey.optionSpace.modifiers
        ) { [weak self] in
            self?.chat?.toggle()
        }
        if chatHotKey == nil {
            BrainClient.log("⌥Space is taken by another app — chat opens from the menu bar only")
        }
    }

    private func showChat() {
        chat?.show()
    }

    // MARK: - Capture

    private func startCapture() {
        startStore()
        let engine = CaptureEngine(
            source: AccessibilityWindowSource(), permission: permission.state)
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

    private func sweepRetention() {
        guard let store else { return }
        do {
            let report = try store.prune(policy: .fromUserDefaults())
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
        }
        permission.startPolling(interval: AccessibilityPermission.backgroundInterval)

        if !UserDefaults.standard.bool(forKey: Self.onboardingSeenKey) {
            showOnboarding()
        }
    }

    private func showOnboarding() {
        let controller = onboarding ?? OnboardingWindowController(permission: permission.state)
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
        Task {
            do {
                let hello = try await client.start()
                BrainClient.log(
                    "handshake OK: protocol \(hello.protocolVersion), brain v\(hello.brainVersion)")
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
        // Single consumer of the brain's intermediate events. Drives the OAuth
        // login UX until US-014: open auth URLs in the browser, answer auth
        // prompts with a modal input, log progress to stderr.
        Task { [weak self] in
            for await event in client.events {
                await self?.handleBrainEvent(event)
            }
        }
    }

    // MARK: - Debug sign-in (temporary until US-014)

    private func signInAnthropic() {
        guard let client = brainClient else {
            BrainClient.log("sign-in: brain not connected")
            return
        }
        Task {
            do {
                let result = try await client.request(
                    .login(id: UUID().uuidString, provider: "anthropic", method: nil))
                BrainClient.log("sign-in complete: \(String(describing: result))")
                let status = try await client.status()
                BrainClient.log("status after sign-in: \(String(describing: status))")
            } catch {
                BrainClient.log("sign-in failed: \(error)")
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

    private func handleBrainEvent(_ event: BrainEvent) async {
        guard let client = brainClient else { return }
        switch event {
        case .textDelta, .toolCall:
            // The chat window is the only consumer of a turn's intermediate
            // events; it ignores anything that isn't its in-flight request.
            chatModel.apply(event)
        case .authURL(_, let url):
            BrainClient.log("auth: opening \(url)")
            if let parsed = URL(string: url) { NSWorkspace.shared.open(parsed) }
        case let .authPrompt(loginId, promptId, prompt, promptType, placeholder, _):
            BrainClient.log("auth prompt [\(promptType)]: \(prompt)")
            let answer = promptUser(
                message: prompt, placeholder: placeholder, secure: promptType == "secret")
            do {
                _ = try await client.request(
                    .authReply(
                        id: UUID().uuidString, targetId: loginId, promptId: promptId,
                        value: answer, cancel: answer == nil ? true : nil))
            } catch {
                BrainClient.log("auth reply failed: \(error)")
            }
        case .progress(_, let message, _):
            BrainClient.log("brain progress: \(message)")
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
