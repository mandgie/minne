import Foundation

/// Which key wakes Minne at the caret — or none.
///
/// Today there are two answers: the right Option key, or nothing. The enum
/// exists so that a future trigger (fn, right ⌘) is one new case here plus a
/// tap that watches for it, not a second boolean: everything between Settings
/// and `MinneKeyController` already speaks in terms of a trigger.
///
/// `off` is a real choice, not an absence: on international (AltGr) layouts
/// right-Option is how @, €, ~ are typed, and while a held chord never fires
/// (see `MinneKeyDiscriminator`), some people would rather the key did not
/// listen at all.
enum MinneKeyTrigger: String, CaseIterable, Equatable, Sendable {
    case rightOption
    case off

    /// Whether this trigger wants an event tap installed at all.
    var installsTap: Bool { self != .off }

    /// What the Settings popup calls it.
    var title: String {
        switch self {
        case .rightOption: return "Right Option (⌥)"
        case .off: return "Off"
        }
    }
}
