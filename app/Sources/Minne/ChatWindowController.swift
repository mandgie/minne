import AppKit
import SwiftUI

/// Floating panel hosting `ChatView`. A panel (rather than a plain window)
/// stays above other apps' windows, which is what a ⌥Space scratchpad wants;
/// `canBecomeKey` is overridden so the input field can take focus even though
/// Minne is an accessory app with no Dock icon.
private final class ChatPanel: NSPanel {
    override var canBecomeKey: Bool { true }

    /// Escape closes the window. NSPanel already does this, but the SwiftUI
    /// field editor swallows the key while text is being edited.
    override func cancelOperation(_ sender: Any?) {
        close()
    }
}

@MainActor
final class ChatWindowController: NSObject, NSWindowDelegate {
    /// Size and position are remembered here, per the story.
    private static let frameAutosaveName = "MinneChatWindow"

    private let model: ChatModel
    private let panel: ChatPanel
    private var escapeMonitor: Any?

    init(model: ChatModel) {
        self.model = model
        panel = ChatPanel(
            contentRect: NSRect(x: 0, y: 0, width: 480, height: 560),
            styleMask: [.titled, .closable, .resizable, .utilityWindow],
            backing: .buffered,
            defer: false)
        super.init()

        panel.title = "Minne"
        panel.isFloatingPanel = true
        panel.hidesOnDeactivate = false
        panel.isReleasedWhenClosed = false
        panel.delegate = self
        panel.contentView = NSHostingView(rootView: ChatView(model: model))
        panel.contentMinSize = NSSize(width: 380, height: 320)
        // setFrameAutosaveName only starts *recording*; the saved frame has to
        // be applied explicitly, and centring is the fallback for a first run.
        if !panel.setFrameUsingName(Self.frameAutosaveName) {
            panel.center()
        }
        panel.setFrameAutosaveName(Self.frameAutosaveName)
    }

    var isKey: Bool { panel.isVisible && panel.isKeyWindow }

    func show() {
        NSApp.activate(ignoringOtherApps: true)
        panel.makeKeyAndOrderFront(nil)
        model.focusInput()
        installEscapeMonitor()
    }

    func close() {
        panel.close()
    }

    /// ⌥Space: open and focus when it isn't in front, dismiss when it is.
    func toggle() {
        if isKey {
            close()
        } else {
            show()
        }
    }

    /// Belt and braces for Escape: SwiftUI's text editing can consume
    /// `cancelOperation` before it reaches the panel.
    private func installEscapeMonitor() {
        guard escapeMonitor == nil else { return }
        escapeMonitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) {
            [weak self] event in
            guard let self, event.keyCode == 53, event.window === self.panel else { return event }
            self.close()
            return nil
        }
    }

    func windowWillClose(_ notification: Notification) {
        if let escapeMonitor {
            NSEvent.removeMonitor(escapeMonitor)
            self.escapeMonitor = nil
        }
    }
}
