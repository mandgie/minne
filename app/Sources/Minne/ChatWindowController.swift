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
        // A ⌥Space window has to come to where the user is. Without these, an
        // already-open panel stays on the Space it was opened on: pressing the
        // hotkey from another Space (or from a fullscreen app, which is its own
        // Space) silently does nothing at all.
        panel.collectionBehavior = [.moveToActiveSpace, .fullScreenAuxiliary]
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

    /// Is the panel actually in front of the user right now? `isKeyWindow`
    /// alone is not enough: it stays true while Minne is inactive and while the
    /// user is on another Space, which made ⌥Space close a panel they could not
    /// see instead of summoning it.
    var isFrontmost: Bool {
        panel.isVisible && panel.isKeyWindow && panel.isOnActiveSpace && NSApp.isActive
    }

    func show() {
        NSApp.activate(ignoringOtherApps: true)
        if panel.isVisible && !panel.isOnActiveSpace {
            // `.moveToActiveSpace` only takes effect when a window is ordered
            // in; one that is already visible on another Space stays there and
            // the hotkey looks dead. Order it out first to force the move.
            panel.orderOut(nil)
        }
        panel.makeKeyAndOrderFront(nil)
        model.focusInput()
        installEscapeMonitor()
        // Activation is asynchronous. Coming from another app — and especially
        // when the panel had to cross Spaces — key status lands only after the
        // Space transition, and a summoned window nobody can type into is
        // useless. Re-assert it once the transition has had time to finish.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { [weak self] in
            guard let self, self.panel.isVisible else { return }
            guard !self.panel.isKeyWindow || !NSApp.isActive else { return }
            NSApp.activate(ignoringOtherApps: true)
            self.panel.makeKeyAndOrderFront(nil)
            self.model.focusInput()
        }
    }

    func close() {
        panel.close()
    }

    /// ⌥Space: summon it to wherever the user is when it isn't in front,
    /// dismiss it when it is.
    func toggle() {
        if isFrontmost {
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
