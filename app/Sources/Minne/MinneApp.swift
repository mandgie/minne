import AppKit

@main
@MainActor
final class MinneApp: NSObject, NSApplicationDelegate {
    private var statusItem: NSStatusItem?
    private var brainClient: BrainClient?

    static func main() {
        let app = NSApplication.shared
        let delegate = MinneApp()
        app.delegate = delegate
        // Accessory policy = no Dock icon, matching LSUIElement in the bundled app.
        app.setActivationPolicy(.accessory)
        app.run()
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        let item = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        if let button = item.button {
            button.image = NSImage(
                systemSymbolName: "brain",
                accessibilityDescription: "Minne"
            )
        }

        let menu = NSMenu()
        let placeholder = NSMenuItem(title: "Minne — early development", action: nil, keyEquivalent: "")
        placeholder.isEnabled = false
        menu.addItem(placeholder)
        menu.addItem(.separator())
        // Temporary debug entry until US-014 builds real settings UI.
        let signIn = NSMenuItem(
            title: "Sign in to Claude…", action: #selector(signInAnthropic), keyEquivalent: "")
        signIn.target = self
        menu.addItem(signIn)
        menu.addItem(.separator())
        menu.addItem(
            NSMenuItem(
                title: "Quit Minne",
                action: #selector(NSApplication.terminate(_:)),
                keyEquivalent: "q"
            )
        )
        item.menu = menu
        statusItem = item

        connectBrain()
    }

    /// Connects to the brain and logs the handshake. No UI yet (US-005).
    private func connectBrain() {
        guard let launch = BrainLaunch.locate() else {
            BrainClient.log("no brain found — set MINNE_BRAIN_PATH or run scripts/build.sh")
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

    @objc private func signInAnthropic() {
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

    private func handleBrainEvent(_ event: BrainEvent) async {
        guard let client = brainClient else { return }
        switch event {
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
        let field: NSTextField = secure ? NSSecureTextField(frame: frame) : NSTextField(frame: frame)
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
