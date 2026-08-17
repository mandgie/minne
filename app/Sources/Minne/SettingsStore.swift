import Foundation

/// Every preference Settings writes, and the only place that knows their
/// `UserDefaults` keys.
///
/// Deliberately a thin value over `UserDefaults` rather than a model: the
/// running app reads some of these itself (retention is swept from a timer,
/// the blacklist is handed to the capture engine at launch), and a settings
/// window that happens to be closed must not be in that path. Injectable so
/// tests never touch the real defaults domain.
struct SettingsStore {
    /// Written only once the user edits the list; an absent key means "never
    /// edited", which is what keeps `CaptureBlacklist.standard` free to grow in
    /// a later release without overwriting anybody's choices.
    static let blacklistAppsKey = "blacklistBundleIdentifiers"
    static let blacklistDomainsKey = "blacklistDomains"

    let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    // MARK: - Blacklist

    var blacklist: CaptureBlacklist {
        let apps = defaults.stringArray(forKey: Self.blacklistAppsKey)
        let domains = defaults.stringArray(forKey: Self.blacklistDomainsKey)
        guard apps != nil || domains != nil else { return .standard }
        return CaptureBlacklist(
            bundleIdentifiers: apps ?? CaptureBlacklist.standard.sortedBundleIdentifiers,
            domains: domains ?? CaptureBlacklist.standard.sortedDomains)
    }

    func setBlacklist(_ blacklist: CaptureBlacklist) {
        defaults.set(blacklist.sortedBundleIdentifiers, forKey: Self.blacklistAppsKey)
        defaults.set(blacklist.sortedDomains, forKey: Self.blacklistDomainsKey)
    }

    /// Whether the user has ever edited the lists; the editor offers a reset
    /// only when there is something to reset to.
    var hasCustomBlacklist: Bool {
        defaults.object(forKey: Self.blacklistAppsKey) != nil
            || defaults.object(forKey: Self.blacklistDomainsKey) != nil
    }

    func resetBlacklist() {
        defaults.removeObject(forKey: Self.blacklistAppsKey)
        defaults.removeObject(forKey: Self.blacklistDomainsKey)
    }

    // MARK: - Shortcuts

    static let chatHotKeyKey = "chatHotKeyEnabled"

    /// On unless the user turned it off — ⌥Space is how the chat window is
    /// meant to be reached, so an absent key means enabled.
    var chatHotKeyEnabled: Bool {
        defaults.object(forKey: Self.chatHotKeyKey) as? Bool ?? true
    }

    func setChatHotKeyEnabled(_ enabled: Bool) {
        defaults.set(enabled, forKey: Self.chatHotKeyKey)
    }

    static let minneKeyKey = "minneKeyEnabled"

    /// On unless the user turned it off. A bare tap of right-Option types
    /// nothing, and holding it still reaches every ⌥ character and shortcut
    /// (see `MinneKeyDiscriminator`), so an on-by-default key costs nobody
    /// their keyboard.
    var minneKeyEnabled: Bool {
        defaults.object(forKey: Self.minneKeyKey) as? Bool ?? true
    }

    func setMinneKeyEnabled(_ enabled: Bool) {
        defaults.set(enabled, forKey: Self.minneKeyKey)
    }

    // MARK: - Retention

    var retention: RetentionPolicy { .fromUserDefaults(defaults) }

    /// Clamped rather than validated: the field is a stepper, and a negative
    /// number means the same thing as zero (keep everything).
    func setRetentionDays(_ days: Int) {
        defaults.set(max(0, days), forKey: RetentionPolicy.defaultsKey)
    }
}
