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
