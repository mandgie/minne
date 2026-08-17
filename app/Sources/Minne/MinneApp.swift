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
    private var capture: CaptureEngine?

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
                // Temporary debug entries until US-013/US-014 build real UI.
                .init(title: "Sign in to Claude…") { [weak self] in self?.signInAnthropic() },
                .init(title: "Test chat") { [weak self] in self?.testChat() },
                .init(title: "Show Onboarding…") { [weak self] in self?.showOnboarding() },
            ])
        controller.onOpenChat = {
            BrainClient.log("Open Chat: chat window arrives in US-013")
        }
        controller.onOpenSettings = {
            BrainClient.log("Settings: settings window arrives in US-014")
        }
        controller.onOpenOnboarding = { [weak self] in self?.showOnboarding() }
        controller.onPauseChange = { [weak self] pause in self?.capture?.update(pause: pause) }
        statusController = controller

        startCapture()
        startPermissionTracking()
        connectBrain()
    }

    // MARK: - Capture

    private func startCapture() {
        let engine = CaptureEngine(
            source: AccessibilityWindowSource(), permission: permission.state)
        engine.onSnapshot = { snapshot in
            // US-009 persists these; for now the summary goes to stderr so a
            // dev run shows capture working.
            BrainClient.log("capture: \(snapshot.logSummary)")
        }
        engine.update(pause: statusController?.pauseState ?? .active)
        capture = engine
        engine.start()
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

    /// Sends a canned chat prompt and logs the streamed reply (US-013 builds real UI).
    private func testChat() {
        guard let client = brainClient else {
            BrainClient.log("test chat: brain not connected")
            return
        }
        Task {
            do {
                let result = try await client.request(
                    .chat(
                        id: UUID().uuidString,
                        message: "Say hello in one short sentence.",
                        newChat: true))
                BrainClient.log("test chat done: \(String(describing: result))")
            } catch {
                BrainClient.log("test chat failed: \(error)")
            }
        }
    }

    private func handleBrainEvent(_ event: BrainEvent) async {
        guard let client = brainClient else { return }
        switch event {
        case .textDelta(let id, let delta):
            BrainClient.log("chat \(id) delta: \(delta)")
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
