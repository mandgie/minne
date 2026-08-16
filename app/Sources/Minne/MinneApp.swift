import AppKit

@main
@MainActor
final class MinneApp: NSObject, NSApplicationDelegate {
    private var statusItem: NSStatusItem?

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
    }
}
