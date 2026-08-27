import Foundation

/// What the brain's `update_check` answered (brain/src/update.ts
/// `UpdateReport`): whether a newer release than the running one exists, and
/// where to get it. The brain owns the cadence and the network; the app only
/// ever renders this.
struct UpdateInfo: Equatable, Sendable {
    let updateAvailable: Bool
    /// Newest released version, when a check has ever succeeded.
    let latest: String?
    /// The release page to open.
    let url: String?

    static func parse(_ value: JSONValue?) -> UpdateInfo? {
        guard let fields = value?.objectValue,
            let available = fields["updateAvailable"]?.boolValue
        else { return nil }
        return UpdateInfo(
            updateAvailable: available,
            latest: fields["latest"]?.stringValue,
            url: fields["url"]?.stringValue)
    }
}

enum AppVersion {
    /// Where "Update Available" lands when a check result carries no page.
    static let releasesURL = URL(string: "https://github.com/mandgie/minne/releases")!

    /// The app's own version, from the bundle scripts/build.sh assembled.
    /// Nil in the bare SwiftPM dev executable, which has no Info.plist —
    /// the menu then falls back to the connected brain's version, which is
    /// the same VERSION file by another route.
    static var current: String? {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String
    }
}
