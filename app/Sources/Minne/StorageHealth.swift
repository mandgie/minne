import Foundation

/// The condition of the capture store, as the menu bar and Settings render it.
///
/// Health is about the two things the store does: writing markdown (the
/// memory) and keeping the search index in step (derived). Losing the index
/// degrades search; losing the markdown write is the one genuinely alarming
/// state, because from the user's side it is silent — the app looks fine and
/// simply stops remembering. That is exactly the state this type exists to
/// make visible.
enum StorageHealth: Equatable, Sendable {
    /// Markdown and index both working.
    case healthy(snapshots: Int, lastCaptureAt: Date?)
    /// Markdown still being written; the index cannot be opened or written.
    /// Search misses everything captured since `reason` happened, until the
    /// index is rebuilt.
    case degraded(reason: String, lastCaptureAt: Date?)
    /// The last capture could not be written at all.
    case failing(reason: String)
    /// The store never opened — nothing is being persisted.
    case unavailable(reason: String)

    /// True for the states the menu must alarm on: memory is not being saved.
    var isCritical: Bool {
        switch self {
        case .failing, .unavailable: return true
        case .healthy, .degraded: return false
        }
    }

    /// Maps a store error to a sentence a user can act on — same discipline as
    /// `AuthModel.describe`: raw `Error` dumps go to the log, never the menu.
    static func describe(_ error: any Error) -> String {
        if let indexError = error as? SnapshotIndex.IndexError {
            switch indexError {
            case .open: return "the search index could not be opened"
            case .sqlite: return "the search index rejected a write"
            }
        }
        let nsError = error as NSError
        guard nsError.domain == NSCocoaErrorDomain else {
            return shortened(nsError.localizedDescription)
        }
        switch CocoaError.Code(rawValue: nsError.code) {
        case .fileWriteOutOfSpace:
            return "the disk is full"
        case .fileWriteVolumeReadOnly:
            return "the disk is read-only"
        case .fileWriteNoPermission, .fileReadNoPermission:
            return "Minne is not allowed to write its memory folder"
        case .fileNoSuchFile, .fileReadNoSuchFile:
            return "the memory folder is missing"
        default:
            return shortened(nsError.localizedDescription)
        }
    }

    /// One sentence, however verbose the underlying description was.
    private static func shortened(_ description: String) -> String {
        let firstLine = description.split(whereSeparator: \.isNewline).first.map(String.init)
        let sentence = firstLine ?? description
        return sentence.count > 120 ? String(sentence.prefix(117)) + "…" : sentence
    }

    /// "2 min ago" for the status line. Pure so the rendering is testable; the
    /// caller passes the same `now` the menu renders with.
    static func relative(_ date: Date, now: Date) -> String {
        let seconds = max(0, now.timeIntervalSince(date))
        if seconds < 90 { return "just now" }
        let minutes = Int((seconds / 60).rounded())
        if minutes < 60 { return "\(minutes) min ago" }
        let hours = Int((seconds / 3600).rounded(.down))
        if hours < 48 { return "\(hours) h ago" }
        return "\(hours / 24) days ago"
    }
}
