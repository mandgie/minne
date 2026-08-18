import Foundation

/// One row of the brain's `memory_recent` answer: a wiki page as the
/// status-bar menu lists it.
struct RecentMemoryPage: Equatable, Sendable {
    /// Path relative to the memory root, e.g. `wiki/ingrid-berg.md`.
    let path: String
    /// The page's frontmatter title; nil when the page carries none.
    let title: String?
    /// `YYYY-MM-DD`, or nil when the page carries no date.
    let lastUpdated: String?

    /// Decodes `done.result` leniently: rows without a path are dropped,
    /// unknown fields ignored, and a malformed result is an empty list — the
    /// menu then shows "Nothing yet" rather than the app minding.
    static func parse(_ result: JSONValue?) -> [RecentMemoryPage] {
        guard let pages = result?.objectValue?["pages"]?.arrayValue else { return [] }
        return pages.compactMap { entry in
            guard let fields = entry.objectValue, let path = fields["path"]?.stringValue else {
                return nil
            }
            return RecentMemoryPage(
                path: path,
                title: fields["title"]?.stringValue,
                lastUpdated: fields["lastUpdated"]?.stringValue)
        }
    }
}

/// The "Recently remembered" submenu, computed as data: StatusItemController
/// only turns entries into NSMenuItems, so everything the menu says — titles,
/// relative times, the empty placeholder — is testable without a window server.
enum RecentMemoryMenu {
    /// Characters of page title before it is cut with an ellipsis. Menus can
    /// be wide, but a runaway title must not make this one absurd.
    static let maxTitleCharacters = 48
    /// The menu never lists more than this many pages, whatever the brain sent.
    static let maxEntries = 8

    struct Entry: Equatable {
        /// What the menu item says.
        let title: String
        /// The page to open, relative to the memory root; nil for the disabled
        /// "Nothing yet" placeholder.
        let path: String?
    }

    /// The submenu's rows for a list of pages. The brain already sends newest
    /// first; the order is kept, the cap re-applied defensively, and an empty
    /// list becomes the one disabled placeholder row.
    static func entries(pages: [RecentMemoryPage], today: String) -> [Entry] {
        guard !pages.isEmpty else { return [Entry(title: "Nothing yet", path: nil)] }
        return pages.prefix(maxEntries).map { page in
            var title = displayTitle(of: page)
            if let lastUpdated = page.lastUpdated,
                let time = relativeTime(from: lastUpdated, today: today)
            {
                title += " — \(time)"
            }
            return Entry(title: title, path: page.path)
        }
    }

    /// The page's own title, or its slug when the frontmatter has none; never
    /// a path — the menu names pages the way the user does.
    static func displayTitle(of page: RecentMemoryPage) -> String {
        let raw = page.title?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let name = raw.isEmpty ? MinneKeyGrounding.slug(page.path) : raw
        guard name.count > maxTitleCharacters else { return name }
        return "\(name.prefix(maxTitleCharacters - 1))…"
    }

    /// `last_updated` is a calendar day with no clock, so the phrasing is in
    /// days: "today", "yesterday", "3 days ago", then weeks and months. A date
    /// that does not parse gets no phrase rather than a wrong one, and a date
    /// in the future (clock skew, a hand-edited page) reads as "today".
    static func relativeTime(from lastUpdated: String, today: String) -> String? {
        guard let then = dayNumber(of: lastUpdated), let now = dayNumber(of: today) else {
            return nil
        }
        let days = now - then
        switch days {
        case ..<1: return "today"
        case 1: return "yesterday"
        case 2...6: return "\(days) days ago"
        case 7...29:
            let weeks = days / 7
            return weeks == 1 ? "a week ago" : "\(weeks) weeks ago"
        case 30...364:
            let months = days / 30
            return months == 1 ? "a month ago" : "\(months) months ago"
        default:
            let years = days / 365
            return years == 1 ? "a year ago" : "\(years) years ago"
        }
    }

    /// Today as the wiki writes dates: the user's calendar day, not UTC's.
    static func today(
        _ date: Date = Date(), timeZone: TimeZone = .current
    ) -> String {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = timeZone
        let parts = calendar.dateComponents([.year, .month, .day], from: date)
        return String(
            format: "%04d-%02d-%02d", parts.year ?? 0, parts.month ?? 0, parts.day ?? 0)
    }

    /// Days since 1970-01-01 for a strict `YYYY-MM-DD`, by pure arithmetic
    /// (the civil-from-days inverse) — no Calendar, no time zone, so the same
    /// two strings always give the same answer.
    private static func dayNumber(of date: String) -> Int? {
        let parts = date.split(separator: "-", omittingEmptySubsequences: false)
        guard parts.count == 3, parts[0].count == 4, parts[1].count == 2, parts[2].count == 2,
            let year = Int(parts[0]), let month = Int(parts[1]), let day = Int(parts[2]),
            (1...12).contains(month), (1...31).contains(day)
        else { return nil }
        let shifted = month <= 2 ? year - 1 : year
        let era = (shifted >= 0 ? shifted : shifted - 399) / 400
        let yearOfEra = shifted - era * 400
        let dayOfYear = (153 * (month + (month > 2 ? -3 : 9)) + 2) / 5 + day - 1
        let dayOfEra = yearOfEra * 365 + yearOfEra / 4 - yearOfEra / 100 + dayOfYear
        return era * 146_097 + dayOfEra - 719_468
    }
}
