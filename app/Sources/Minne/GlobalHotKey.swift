import AppKit
import Carbon.HIToolbox

/// A system-wide hotkey via Carbon's `RegisterEventHotKey`.
///
/// Deliberately not `NSEvent.addGlobalMonitorForEvents`: a global monitor only
/// receives keys once the app has Accessibility permission, and Minne must open
/// its chat window whether or not capture was ever granted. Carbon hotkeys need
/// no permission.
@MainActor
final class GlobalHotKey {
    /// ⌥Space — the chat window's shortcut (US-013).
    static let optionSpace = (keyCode: UInt32(kVK_Space), modifiers: UInt32(optionKey))

    private static var actions: [UInt32: @MainActor () -> Void] = [:]
    private static var nextIdentifier: UInt32 = 1
    private static var handler: EventHandlerRef?

    private let identifier: UInt32
    /// Only ever touched on the main actor, plus `deinit`, which by definition
    /// runs when nothing else holds this object.
    private nonisolated(unsafe) var hotKey: EventHotKeyRef?

    /// Returns nil if the combination is already taken by another app.
    init?(keyCode: UInt32, modifiers: UInt32, action: @escaping @MainActor () -> Void) {
        Self.installHandlerIfNeeded()
        identifier = Self.nextIdentifier
        Self.nextIdentifier += 1

        var reference: EventHotKeyRef?
        // Signature is a four-char code, per the Carbon convention: 'MNNE'.
        let hotKeyID = EventHotKeyID(signature: 0x4D4E_4E45, id: identifier)
        let status = RegisterEventHotKey(
            keyCode, modifiers, hotKeyID, GetApplicationEventTarget(), 0, &reference)
        guard status == noErr, let reference else {
            BrainClient.log("hotkey registration failed (OSStatus \(status))")
            return nil
        }
        hotKey = reference
        Self.actions[identifier] = action
    }

    deinit {
        if let hotKey { UnregisterEventHotKey(hotKey) }
        // `actions` is main-actor state and deinit is nonisolated; the entry is
        // harmless once the hotkey itself is gone (nothing can fire it).
    }

    private static func installHandlerIfNeeded() {
        guard handler == nil else { return }
        var eventType = EventTypeSpec(
            eventClass: OSType(kEventClassKeyboard), eventKind: UInt32(kEventHotKeyPressed))
        // The callback is a C function pointer, so it cannot capture: it looks
        // the action up by id instead. Carbon delivers it on the main thread,
        // but hop explicitly rather than assume it.
        InstallEventHandler(
            GetApplicationEventTarget(),
            { _, event, _ in
                var hotKeyID = EventHotKeyID()
                let status = GetEventParameter(
                    event, EventParamName(kEventParamDirectObject),
                    EventParamType(typeEventHotKeyID), nil, MemoryLayout<EventHotKeyID>.size, nil,
                    &hotKeyID)
                guard status == noErr else { return status }
                let identifier = hotKeyID.id
                DispatchQueue.main.async {
                    MainActor.assumeIsolated { GlobalHotKey.fire(identifier) }
                }
                return noErr
            }, 1, &eventType, nil, &handler)
    }

    private static func fire(_ identifier: UInt32) {
        actions[identifier]?()
    }
}
