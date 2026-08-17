import Foundation

/// What the last memory-maintenance pass did, as `status.sync.lastSync`
/// reports it (brain/src/sync-state.ts `SyncPassSummary`).
struct SyncPassInfo: Equatable, Sendable {
    /// "ingested" | "idle" | "skipped" | "error" for a sync pass.
    let status: String
    let reason: String?
    /// Local time the pass finished; nil when the brain's timestamp did not
    /// parse, which costs a relative time and nothing else.
    let finishedAt: Date?
    let snapshots: Int
    let pagesTouched: [String]
    let remaining: Int

    static func parse(_ value: JSONValue?) -> SyncPassInfo? {
        guard let fields = value?.objectValue, let status = fields["status"]?.stringValue else {
            return nil
        }
        return SyncPassInfo(
            status: status,
            reason: fields["reason"]?.stringValue,
            finishedAt: fields["at"]?.stringValue.flatMap(Self.parseTimestamp),
            snapshots: fields["snapshots"]?.intValue ?? 0,
            pagesTouched: (fields["pagesTouched"]?.arrayValue ?? []).compactMap(\.stringValue),
            remaining: fields["remaining"]?.intValue ?? 0)
    }

    /// The brain stamps local time with an offset (`2026-08-17T14:31:07+02:00`).
    static func parseTimestamp(_ text: String) -> Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter.date(from: text)
    }
}

/// The brain's whole sync picture: what is waiting, what is running, and what
/// the last pass managed. Settings' Memory section is the only reader.
struct SyncStatusInfo: Equatable, Sendable {
    /// "idle" | "running"
    let state: String
    /// Which pass is running, when one is: "sync" | "lint".
    let pass: String?
    /// Snapshots captured but not yet digested.
    let pending: Int
    /// False when the app has never captured anything.
    let indexAvailable: Bool
    let intervalMinutes: Int
    let lastSync: SyncPassInfo?

    var isRunning: Bool { state == "running" }

    static func parse(_ value: JSONValue?) -> SyncStatusInfo? {
        guard let fields = value?.objectValue, let state = fields["state"]?.stringValue else {
            return nil
        }
        return SyncStatusInfo(
            state: state,
            pass: fields["pass"]?.stringValue,
            pending: fields["pending"]?.intValue ?? 0,
            indexAvailable: fields["indexAvailable"]?.boolValue ?? false,
            intervalMinutes: fields["intervalMinutes"]?.intValue ?? 0,
            lastSync: SyncPassInfo.parse(fields["lastSync"]))
    }

    /// The "last sync" line. Pure so the wording is unit-tested rather than
    /// eyeballed in a screenshot.
    func lastSyncLine(now: Date = Date()) -> String {
        if isRunning {
            return pass == "lint" ? "Checking the wiki now…" : "Syncing now…"
        }
        guard let last = lastSync else {
            return indexAvailable ? "Never synced" : "Nothing captured yet"
        }
        let when = last.finishedAt.map { "\(Self.relative($0, now: now))" } ?? "recently"
        switch last.status {
        case "ingested":
            let pages = last.pagesTouched.count
            return
                "Last sync \(when) — \(last.snapshots) capture\(last.snapshots == 1 ? "" : "s") into \(pages) page\(pages == 1 ? "" : "s")"
        case "idle":
            return "Last checked \(when) — nothing new"
        case "skipped":
            return "Last sync \(when) — skipped (\(last.reason ?? "no provider signed in"))"
        case "error":
            return "Last sync \(when) failed — \(last.reason ?? "unknown error")"
        default:
            return "Last sync \(when) — \(last.status)"
        }
    }

    /// The backlog line under it.
    var pendingLine: String {
        guard indexAvailable else { return "No captures indexed yet." }
        let schedule =
            intervalMinutes > 0
            ? "Minne syncs every \(intervalMinutes) min." : "Scheduled syncing is off."
        guard pending > 0 else { return "Everything captured has been digested. \(schedule)" }
        return "\(pending) capture\(pending == 1 ? "" : "s") waiting. \(schedule)"
    }

    static func relative(_ date: Date, now: Date) -> String {
        let seconds = now.timeIntervalSince(date)
        if seconds < 0 { return "just now" }
        if seconds < 90 { return "just now" }
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .full
        return formatter.localizedString(for: date, relativeTo: now)
    }
}
