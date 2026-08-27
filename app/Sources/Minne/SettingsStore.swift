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
    static let minneKeyTriggerKey = "minneKeyTrigger"

    /// On unless the user turned it off. A bare tap of right-Option types
    /// nothing, and holding it still reaches every ⌥ character and shortcut
    /// (see `MinneKeyDiscriminator`), so an on-by-default key costs nobody
    /// their keyboard.
    var minneKeyEnabled: Bool {
        defaults.object(forKey: Self.minneKeyKey) as? Bool ?? true
    }

    /// The trigger subsumes the boolean: `off` is what "disabled" is spelled
    /// as now, and `setMinneKeyTrigger` keeps `minneKeyEnabled` written in
    /// agreement. The boolean is still honoured on read — as a kill switch,
    /// false wins over any stored trigger — which is what keeps a pre-trigger
    /// "off" choice off, and the `-minneKeyEnabled NO` debug launch argument
    /// working. An unrecognised stored value (a trigger from a newer version)
    /// falls back to the default rather than to off: the user asked for *a*
    /// key, not for none.
    var minneKeyTrigger: MinneKeyTrigger {
        guard minneKeyEnabled else { return .off }
        guard let raw = defaults.string(forKey: Self.minneKeyTriggerKey),
            let trigger = MinneKeyTrigger(rawValue: raw)
        else { return .rightOption }
        return trigger
    }

    func setMinneKeyTrigger(_ trigger: MinneKeyTrigger) {
        defaults.set(trigger.rawValue, forKey: Self.minneKeyTriggerKey)
        defaults.set(trigger.installsTap, forKey: Self.minneKeyKey)
    }

    // MARK: - Update check

    static let updateCheckKey = "updateCheckEnabled"

    /// On unless the user turned it off — the check is one anonymous request
    /// a day for the latest release tag, carrying nothing about the user.
    var updateCheckEnabled: Bool {
        defaults.object(forKey: Self.updateCheckKey) as? Bool ?? true
    }

    func setUpdateCheckEnabled(_ enabled: Bool) {
        defaults.set(enabled, forKey: Self.updateCheckKey)
    }

    // MARK: - Retention

    var retention: RetentionPolicy { .fromUserDefaults(defaults) }

    /// Clamped rather than validated: the field is a stepper, and a negative
    /// number means the same thing as zero (keep everything).
    func setRetentionDays(_ days: Int) {
        defaults.set(max(0, days), forKey: RetentionPolicy.defaultsKey)
    }
}
