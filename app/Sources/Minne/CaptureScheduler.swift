import Foundation

/// The capture engine's decision core: when to walk the Accessibility tree,
/// and whether the text that comes back is worth emitting.
///
/// Deliberately free of AppKit and AX so all of the policy — permission and
/// pause gating, per-window debounce, the 50 KB cap, near-duplicate rejection
/// — is a pure function of its inputs and unit-testable. `CaptureEngine` owns
/// the impure half: observers, timers, and the tree walk itself.
struct CaptureScheduler {
    struct Configuration: Equatable, Sendable {
        /// Minimum time between two tree walks of the *same* window.
        var debounceInterval: TimeInterval = 15
        /// How often the engine re-evaluates. Shorter than the debounce so a
        /// window that has gone quiet is revisited close to 15 s rather than
        /// 30 s, and cheap because a tick that fails the debounce only costs
        /// one AX title read — the tree walk itself still happens at most once
        /// per `debounceInterval` per window.
        var pollInterval: TimeInterval = 5
        /// Hard ceiling on a snapshot's UTF-8 size.
        var maxSnapshotBytes: Int = 50_000
        /// Similarity above which a snapshot is considered a repeat of the
        /// previous one from the same window and dropped.
        var duplicateThreshold: Double = 0.9
        /// How many recently seen windows keep debounce/dedup state. Bounded
        /// so a long session over many windows cannot grow without limit;
        /// evicting a window only costs one redundant capture.
        var trackedWindows: Int = 16

        init() {}
    }

    enum Trigger: Equatable, Sendable {
        /// Frontmost app, focused window, or window title changed.
        case focusChange
        /// Periodic re-evaluation of the window the user is still in.
        case timer
    }

    enum SkipReason: Equatable, Sendable {
        case permissionMissing
        case paused
        case noFocusedWindow
        /// This window was walked less than `debounceInterval` ago.
        case debounced
    }

    enum Decision: Equatable, Sendable {
        case capture
        case skip(SkipReason)
    }

    enum Rejection: Equatable, Sendable {
        /// Nothing but whitespace came back from the walk.
        case empty
        case duplicate(similarity: Double)
    }

    enum Acceptance: Equatable, Sendable {
        case accepted(CaptureSnapshot)
        case rejected(Rejection)
    }

    let configuration: Configuration

    /// Per-window debounce and dedup state, most recently touched last.
    private var tracked: [(window: WindowIdentity, state: WindowState)] = []

    private struct WindowState {
        var lastWalkedAt: Date
        var lastAcceptedText: String?
    }

    /// Timer ticks and observer callbacks can arrive marginally early; without
    /// slack a 5 s poll against a 15 s debounce would routinely land at
    /// 14.999 s and defer the capture by a whole extra tick.
    private static let debounceSlack: TimeInterval = 0.25

    init(configuration: Configuration = Configuration()) {
        self.configuration = configuration
    }

    /// Whether to walk the focused window's tree now.
    ///
    /// Both triggers run through the same rule — the debounce is per window,
    /// not per timer phase, so a switch to a fresh window captures instantly
    /// while a switch back to one just walked does not. `trigger` is therefore
    /// context for the caller and the tests rather than an input to the
    /// decision.
    ///
    /// Mutating: a `.capture` decision records the walk, so the debounce holds
    /// even when the walk comes back empty (the CPU was spent either way).
    mutating func decide(
        trigger: Trigger, window: WindowIdentity?, permission: CapturePermissionState,
        pause: PauseState, now: Date
    ) -> Decision {
        guard permission.isGranted else { return .skip(.permissionMissing) }
        guard !pause.resolved(now: now).isPaused else { return .skip(.paused) }
        guard let window else { return .skip(.noFocusedWindow) }

        // The same rule covers both triggers: a window first seen (a genuine
        // switch, including alt-tab to something new) is captured at once,
        // while returning to a window just walked — or sitting in it — waits
        // out the debounce. That is what keeps rapid app switching from
        // walking the same trees over and over.
        if let state = state(for: window),
            now.timeIntervalSince(state.lastWalkedAt)
                < configuration.debounceInterval - Self.debounceSlack
        {
            return .skip(.debounced)
        }

        touch(window) { $0.lastWalkedAt = now }
        return .capture
    }

    /// Applies the byte cap and the near-duplicate rule to a walk's output.
    mutating func accept(_ candidate: CaptureCandidate, now: Date) -> Acceptance {
        let (capped, wasCapped) = Self.cap(
            candidate.text, toBytes: configuration.maxSnapshotBytes)
        guard !capped.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return .rejected(.empty)
        }

        if let previous = state(for: candidate.window)?.lastAcceptedText {
            let similarity = TextSimilarity.similarity(previous, capped)
            if similarity > configuration.duplicateThreshold {
                return .rejected(.duplicate(similarity: similarity))
            }
        }

        touch(candidate.window) { $0.lastAcceptedText = capped }
        return .accepted(
            CaptureSnapshot(
                capturedAt: now,
                bundleIdentifier: candidate.window.bundleIdentifier,
                appName: candidate.window.appName,
                windowTitle: candidate.window.windowTitle,
                url: candidate.url,
                text: capped,
                truncated: wasCapped || candidate.truncatedByWalk))
    }

    // MARK: - Byte cap

    /// Truncates to `limit` UTF-8 bytes on a character boundary, so a capped
    /// snapshot never ends in a broken grapheme.
    static func cap(_ text: String, toBytes limit: Int) -> (text: String, wasCapped: Bool) {
        guard limit > 0 else { return ("", !text.isEmpty) }
        guard text.utf8.count > limit else { return (text, false) }
        var index = text.utf8.index(text.utf8.startIndex, offsetBy: limit)
        while index > text.utf8.startIndex, String.Index(index, within: text) == nil {
            index = text.utf8.index(before: index)
        }
        guard let boundary = String.Index(index, within: text) else { return ("", true) }
        return (String(text[..<boundary]), true)
    }

    // MARK: - Bounded per-window state

    private func state(for window: WindowIdentity) -> WindowState? {
        tracked.first { $0.window == window }?.state
    }

    /// Creates or updates a window's state and moves it to the front of the
    /// recency order, evicting the least recently touched window past the cap.
    private mutating func touch(
        _ window: WindowIdentity, _ mutate: (inout WindowState) -> Void
    ) {
        if let existing = tracked.firstIndex(where: { $0.window == window }) {
            var entry = tracked.remove(at: existing)
            mutate(&entry.state)
            tracked.append(entry)
            return
        }
        var state = WindowState(lastWalkedAt: .distantPast, lastAcceptedText: nil)
        mutate(&state)
        tracked.append((window, state))
        if tracked.count > configuration.trackedWindows {
            tracked.removeFirst(tracked.count - configuration.trackedWindows)
        }
    }
}
