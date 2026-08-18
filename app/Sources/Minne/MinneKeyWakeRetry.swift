import Foundation

/// The decision half of the one delayed retry a Chromium wake earns (US-104).
///
/// A press that finds an app's accessibility tree dark flips Chromium's
/// `AXManualAccessibility` switch — but the tree builds asynchronously, so
/// that press comes up empty and, without a retry, only arms the next one.
/// The controller therefore repeats the locate once, half a second later.
/// This type holds that retry's rules, pure so they can be tested without a
/// timer or a window server: which app the press was in, whether the user has
/// since done something that would make a late overlay an intrusion, and the
/// guarantee that one press never retries more than once. The timer and the
/// AX calls stay in `MinneKeyController`, which asks this type before acting.
struct MinneKeyWakeRetry: Equatable {
    /// Something the user did that makes the pending retry stale. Any of them
    /// means the moment the press belonged to is over, and an overlay arriving
    /// now would land on top of whatever they are doing instead.
    enum Cancellation: String, Equatable, Sendable {
        /// The Minne key again. The new press runs its own locate, which is
        /// fresher than the one the timer would repeat — the new press wins.
        case anotherPress = "the key was pressed again"
        case typing = "the user typed"
        case click = "the user clicked"
        case appSwitch = "the app changed"
    }

    enum Phase: Equatable, Sendable {
        case pending
        case cancelled(Cancellation)
        /// The retry ran. Terminal: one press gets one retry, ever.
        case fired
    }

    /// The app that was frontmost — and dark — when the key was pressed.
    let pid: pid_t
    private(set) var phase: Phase = .pending

    init(pid: pid_t) {
        self.pid = pid
    }

    /// Records what the user did. True only on the transition out of
    /// `pending`, so the caller can say why exactly once.
    @discardableResult
    mutating func cancel(_ reason: Cancellation) -> Bool {
        guard phase == .pending else { return false }
        phase = .cancelled(reason)
        return true
    }

    /// Answers the timer: run the locate again now? True at most once, and
    /// only when nothing cancelled the retry and the app in front is still the
    /// one the press was in — a locate would otherwise read a different app
    /// than the one that was woken.
    mutating func shouldFire(frontmostPid: pid_t?) -> Bool {
        guard phase == .pending else { return false }
        guard frontmostPid == pid else {
            phase = .cancelled(.appSwitch)
            return false
        }
        phase = .fired
        return true
    }
}
