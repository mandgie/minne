import AppKit
import CoreGraphics

/// The `CGEventTap` behind the Minne key.
///
/// Watches `flagsChanged` for the right Option key and hands the sequence to
/// `MinneKeyDiscriminator`. It also watches key and mouse presses, for two
/// reasons: they are what tells a tap from a hold, and Escape is how the
/// overlay is dismissed while the app underneath keeps focus.
///
/// **Why the tap must not swallow `flagsChanged`.** A bare modifier press types
/// nothing, so passing it through costs us nothing — but *consuming* it would
/// cost the user everything: the app underneath would never learn that Option
/// went down, so ⌥-click, ⌥-drag and every Option shortcut would break
/// system-wide, and a menu opened during the press would show the wrong items.
/// The tap therefore returns every `flagsChanged` event untouched. Escape is
/// the one event it ever consumes, and only while the overlay is on screen,
/// which is why it is a `.defaultTap` rather than `.listenOnly`.
///
/// The callback runs on the main run loop, in line with the user's typing:
/// it must do nothing but bookkeeping, and hand the real work — Accessibility
/// round trips, showing a window — to `DispatchQueue.main.async`.
@MainActor
final class MinneKeyTap {
    /// `kVK_RightOption`.
    nonisolated static let rightOptionKeyCode: Int64 = 0x3D
    /// `NX_DEVICERALTKEYMASK` — the bit that says *which* Option key. The event
    /// is a press when it is set and a release when it is not.
    nonisolated static let rightOptionDeviceMask: UInt64 = 0x0000_0040
    /// `kVK_Escape`.
    nonisolated static let escapeKeyCode: Int64 = 53

    /// A deliberate tap of right-Option.
    var onTap: (@MainActor () -> Void)?
    /// Escape was pressed. Return true to swallow it, which the controller does
    /// only when the overlay is up — otherwise Escape belongs to whoever the
    /// user is typing in.
    var onEscape: (@MainActor () -> Bool)?
    /// A mouse press, in Quartz screen coordinates.
    var onClick: (@MainActor (CGPoint) -> Void)?

    private var discriminator: MinneKeyDiscriminator
    /// Optionals only because `self` cannot be handed to `passUnretained` until
    /// every stored property has a value, and the tap needs that pointer to
    /// exist. `nonisolated(unsafe)` for `deinit`, which by definition runs when
    /// nothing else holds this object.
    private nonisolated(unsafe) var machPort: CFMachPort?
    private nonisolated(unsafe) var runLoopSource: CFRunLoopSource?

    /// Returns nil when the tap cannot be created, which in practice means one
    /// thing: Accessibility has not been granted. The Minne key then simply
    /// does not exist, the same way capture does not.
    init?(tapWindow: TimeInterval = MinneKeyDiscriminator.defaultTapWindow) {
        discriminator = MinneKeyDiscriminator(tapWindow: tapWindow)

        let mask: CGEventMask =
            (1 << CGEventType.flagsChanged.rawValue)
            | (1 << CGEventType.keyDown.rawValue)
            | (1 << CGEventType.leftMouseDown.rawValue)
            | (1 << CGEventType.rightMouseDown.rawValue)
            | (1 << CGEventType.otherMouseDown.rawValue)

        // Unretained: the tap is owned by whoever created it and torn down in
        // `deinit`, so the callback can never outlive the object.
        let refcon = Unmanaged.passUnretained(self).toOpaque()
        guard
            let port = CGEvent.tapCreate(
                tap: .cgSessionEventTap, place: .headInsertEventTap, options: .defaultTap,
                eventsOfInterest: mask, callback: minneKeyTapCallback, userInfo: refcon),
            let source = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, port, 0)
        else {
            BrainClient.log("minne key: event tap could not be created (Accessibility missing?)")
            return nil
        }
        machPort = port
        runLoopSource = source
        // .commonModes so the key still works while a menu is tracking or a
        // window is being dragged.
        CFRunLoopAddSource(CFRunLoopGetMain(), source, .commonModes)
        CGEvent.tapEnable(tap: port, enable: true)
    }

    deinit {
        Self.tearDown(machPort: machPort, runLoopSource: runLoopSource)
        machPort = nil
        runLoopSource = nil
    }

    func invalidate() {
        Self.tearDown(machPort: machPort, runLoopSource: runLoopSource)
        machPort = nil
        runLoopSource = nil
    }

    private nonisolated static func tearDown(
        machPort: CFMachPort?, runLoopSource: CFRunLoopSource?
    ) {
        if let machPort {
            CGEvent.tapEnable(tap: machPort, enable: false)
            CFMachPortInvalidate(machPort)
        }
        if let runLoopSource {
            CFRunLoopRemoveSource(CFRunLoopGetMain(), runLoopSource, .commonModes)
            CFRunLoopSourceInvalidate(runLoopSource)
        }
    }

    /// Everything the tap needs from one event, as plain values.
    ///
    /// `CGEvent` is a class and not `Sendable`, so it cannot cross into
    /// `MainActor.assumeIsolated`. Reading the three fields we care about in
    /// the C callback and handing over a struct is what makes the handler below
    /// both compile under strict concurrency and testable.
    struct Signal: Sendable {
        var type: CGEventType
        var keyCode: Int64
        var flags: UInt64
        var location: CGPoint

        init(type: CGEventType, keyCode: Int64, flags: UInt64, location: CGPoint) {
            self.type = type
            self.keyCode = keyCode
            self.flags = flags
            self.location = location
        }

        init(type: CGEventType, event: CGEvent) {
            self.init(
                type: type,
                keyCode: event.getIntegerValueField(.keyboardEventKeycode),
                flags: event.flags.rawValue,
                location: event.location)
        }
    }

    enum Verdict: Equatable, Sendable {
        /// Hand the event on to the app the user is typing in.
        case pass
        /// Swallow it. Only ever Escape, and only while the overlay is up.
        case consume
    }

    /// The callback's body, on the main actor.
    func handle(_ signal: Signal) -> Verdict {
        switch signal.type {
        case .tapDisabledByTimeout, .tapDisabledByUserInput:
            // The system switches a tap off when its callback is too slow, and
            // never switches it back on. Without this the Minne key dies
            // silently the first time the main thread is busy. The press in
            // flight is forgotten too: its release may have gone missing.
            BrainClient.log("minne key: event tap was disabled by the system — re-enabling")
            discriminator.reset()
            if let machPort { CGEvent.tapEnable(tap: machPort, enable: true) }
            return .pass

        case .flagsChanged:
            guard let input = Self.rightOptionInput(keyCode: signal.keyCode, flags: signal.flags)
            else {
                // Some other modifier: not our key, but it does end any tap in
                // progress (⌥⇧, ⌥⌘ and friends are ordinary Option usage).
                feed(.otherInput)
                return .pass
            }
            if feed(input) {
                // Never inline: locating the caret is Accessibility IPC, and
                // this callback sits in the keyboard's critical path.
                DispatchQueue.main.async { [weak self] in self?.onTap?() }
            }
            return .pass

        case .keyDown:
            if signal.keyCode == Self.escapeKeyCode, onEscape?() == true { return .consume }
            feed(.otherInput)
            return .pass

        case .leftMouseDown, .rightMouseDown, .otherMouseDown:
            feed(.otherInput)
            if let onClick {
                let location = signal.location
                DispatchQueue.main.async { onClick(location) }
            }
            return .pass

        default:
            return .pass
        }
    }

    /// Reads a `flagsChanged` event as a right-Option press or release, or nil
    /// when it is some other modifier.
    ///
    /// The device bit is what distinguishes the two Option keys —
    /// `.maskAlternate` alone is set for both, and is set on the release event
    /// too whenever another modifier is still held. Kept static and pure
    /// because the exact bit is the sort of thing that is easy to get subtly
    /// wrong and impossible to notice.
    nonisolated static func rightOptionInput(keyCode: Int64, flags: UInt64) -> MinneKeyInput? {
        guard keyCode == rightOptionKeyCode else { return nil }
        return (flags & rightOptionDeviceMask) != 0 ? .rightOptionDown : .rightOptionUp
    }

    @discardableResult
    private func feed(_ input: MinneKeyInput) -> Bool {
        // Monotonic and not subject to clock changes, unlike `Date()`; the
        // event's own timestamp is in mach units whose scale is machine
        // dependent, and this callback runs in line with the event anyway.
        discriminator.handle(input, at: ProcessInfo.processInfo.systemUptime)
    }
}

/// Event-tap callbacks are C function pointers, so the tap travels as a refcon
/// — the same shape as `AXObserverCallback`. The run-loop source is on the main
/// run loop, hence `assumeIsolated`.
private func minneKeyTapCallback(
    proxy: CGEventTapProxy, type: CGEventType, event: CGEvent,
    refcon: UnsafeMutableRawPointer?
) -> Unmanaged<CGEvent>? {
    guard let refcon else { return Unmanaged.passUnretained(event) }
    let tap = Unmanaged<MinneKeyTap>.fromOpaque(refcon).takeUnretainedValue()
    let signal = MinneKeyTap.Signal(type: type, event: event)
    let verdict = MainActor.assumeIsolated { tap.handle(signal) }
    return verdict == .consume ? nil : Unmanaged.passUnretained(event)
}
