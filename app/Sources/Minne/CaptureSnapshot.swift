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

/// One accepted observation of the foreground window, already masked — a
/// snapshot only exists once `CaptureScheduler.accept` has run every exclusion
/// and redaction rule over it. `SourceStore` then writes it to `~/Minne` and
/// indexes it, immutably.
struct CaptureSnapshot: Equatable, Sendable {
    let capturedAt: Date
    let bundleIdentifier: String
    let appName: String
    let windowTitle: String
    let url: String?
    let text: String
    /// Text was cut, either by the walk's ceilings or by the byte cap.
    let truncated: Bool
    /// How many sensitive spans `SensitiveMasker` replaced across text, title
    /// and URL. Counted rather than described: what was removed must not come
    /// back as metadata.
    let redactions: Int

    init(
        capturedAt: Date, bundleIdentifier: String, appName: String, windowTitle: String,
        url: String?, text: String, truncated: Bool, redactions: Int = 0
    ) {
        self.capturedAt = capturedAt
        self.bundleIdentifier = bundleIdentifier
        self.appName = appName
        self.windowTitle = windowTitle
        self.url = url
        self.text = text
        self.truncated = truncated
        self.redactions = redactions
    }

    /// One-line stderr summary; the text itself never reaches the log.
    var logSummary: String {
        var parts = ["\(appName) [\(bundleIdentifier)]", "“\(windowTitle)”"]
        if let url { parts.append(url) }
        parts.append("\(text.count) chars\(truncated ? " (truncated)" : "")")
        if redactions > 0 { parts.append("\(redactions) masked") }
        return parts.joined(separator: " · ")
    }
}
