import Foundation

/// Identity of the window a capture belongs to.
///
/// There is no public API for a stable AX window id, so a window is identified
/// by its owning app plus its title. That is exactly the granularity the
/// capture rules need: a new title means new content worth capturing, and the
/// near-duplicate check only ever compares a window against itself.
struct WindowIdentity: Hashable, Sendable {
    let bundleIdentifier: String
    let appName: String
    let windowTitle: String

    init(bundleIdentifier: String, appName: String, windowTitle: String) {
        self.bundleIdentifier = bundleIdentifier
        self.appName = appName
        self.windowTitle = windowTitle
    }
}

/// Raw result of one Accessibility tree walk, before scheduling policy
/// (capping, dedup) has had a say.
struct CaptureCandidate: Equatable, Sendable {
    let window: WindowIdentity
    /// From the AX tree's `AXURL`, when the app exposes one (browsers do).
    let url: String?
    let text: String
    /// The walk stopped early because it hit its element/depth ceiling.
    let truncatedByWalk: Bool

    init(window: WindowIdentity, url: String? = nil, text: String, truncatedByWalk: Bool = false) {
        self.window = window
        self.url = url
        self.text = text
        self.truncatedByWalk = truncatedByWalk
    }
}

/// One accepted observation of the foreground window. Nothing persists these
/// yet — US-009 builds the raw source store; for now `MinneApp` logs a summary.
struct CaptureSnapshot: Equatable, Sendable {
    let capturedAt: Date
    let bundleIdentifier: String
    let appName: String
    let windowTitle: String
    let url: String?
    let text: String
    /// Text was cut, either by the walk's ceilings or by the byte cap.
    let truncated: Bool

    /// One-line stderr summary; the text itself never reaches the log.
    var logSummary: String {
        var parts = ["\(appName) [\(bundleIdentifier)]", "“\(windowTitle)”"]
        if let url { parts.append(url) }
        parts.append("\(text.count) chars\(truncated ? " (truncated)" : "")")
        return parts.joined(separator: " · ")
    }
}
