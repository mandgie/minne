import Foundation

/// One piece of input, as far as the Minne key is concerned.
///
/// Everything that is not the right Option key collapses into `.otherInput`:
/// the discriminator only ever needs to know *that* something else happened
/// while the key was down, never what it was.
enum MinneKeyInput: Equatable, Sendable {
    case rightOptionDown
    case rightOptionUp
    /// Any other key, modifier or click.
    case otherInput
}

/// Tells a deliberate *tap* of right-Option from ordinary use of the key.
///
/// The whole point of the Minne key is that it is a key people already use:
/// ⌥-typing an accented character, ⌥←/⌥→ by word, ⌥-click, Alt Gr on a Nordic
/// layout. So a tap is defined narrowly — press and release with nothing at all
/// in between, inside a short window. A press held past that window, or one
/// with any other input during it, is ordinary Option usage and is ignored.
///
/// Pure, so the rule can be tested as a sequence of events and timestamps
/// rather than by pressing keys at a real keyboard.
struct MinneKeyDiscriminator {
    /// Longest a tap may last. Long enough that nobody has to stab at the key,
    /// short enough that holding Option to reach for a second key never fires
    /// even when the second key never arrives.
    static let defaultTapWindow: TimeInterval = 0.3

    let tapWindow: TimeInterval

    /// When the current press started; nil when the key is up.
    private var pressedAt: TimeInterval?
    /// Whether anything else happened during the current press.
    private var contaminated = false

    init(tapWindow: TimeInterval = MinneKeyDiscriminator.defaultTapWindow) {
        self.tapWindow = tapWindow
    }

    /// Whether the key is currently held (the overlay uses this to ignore its
    /// own synthetic input, and tests to assert the machine's state).
    var isPressed: Bool { pressedAt != nil }

    /// Feeds one event. Returns true exactly when this event completed a tap.
    mutating func handle(_ input: MinneKeyInput, at time: TimeInterval) -> Bool {
        switch input {
        case .rightOptionDown:
            // A second down without an up cannot come from real hardware
            // (modifiers do not auto-repeat), but restarting is the safe read.
            pressedAt = time
            contaminated = false
            return false

        case .otherInput:
            // Only interesting while the key is down. Note this deliberately
            // does *not* start a press: input before the key went down says
            // nothing about the press that follows.
            if pressedAt != nil { contaminated = true }
            return false

        case .rightOptionUp:
            // A release with no press is normal at startup: the tap can be
            // installed while the user already holds the key.
            guard let pressedAt else { return false }
            let held = time - pressedAt
            let isTap = !contaminated && held >= 0 && held <= tapWindow
            self.pressedAt = nil
            contaminated = false
            return isTap
        }
    }

    /// Forgets any press in progress. Used when the event tap is re-enabled
    /// after the system disabled it: the release that ends the current press
    /// may have been missed entirely.
    mutating func reset() {
        pressedAt = nil
        contaminated = false
    }
}
