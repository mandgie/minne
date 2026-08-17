import Foundation

/// Sources Minne must not look at, at all.
///
/// This is a harder rule than masking: masking cleans a snapshot, the blacklist
/// means no snapshot is produced in the first place. Matching is by app bundle
/// identifier (a password manager's whole window is a secret) and by domain for
/// browser windows, where the app is Chrome but the *content* is the bank.
///
/// `standard` is the starting set every install gets. Settings edits the same
/// value type (US-015) and `SettingsStore` persists the result, so a user who
/// removes one of the defaults keeps it removed.
struct CaptureBlacklist: Equatable, Sendable {
    /// Lowercased bundle identifiers.
    private(set) var bundleIdentifiers: Set<String>
    /// Lowercased registrable hostnames; each also blocks its subdomains.
    private(set) var domains: Set<String>

    init(bundleIdentifiers: [String] = [], domains: [String] = []) {
        self.bundleIdentifiers = Set(bundleIdentifiers.map { $0.lowercased() })
        self.domains = Set(domains.compactMap(Self.normalizeDomain))
    }

    /// Password managers and the system keychain: everything on screen there is
    /// a credential, and none of it belongs in a memory wiki.
    static let standard = CaptureBlacklist(
        bundleIdentifiers: [
            "com.1password.1password",
            "com.agilebits.onepassword7",
            "com.agilebits.onepassword-osx",
            "com.bitwarden.desktop",
            "com.lastpass.lastpassmacdesktop",
            "org.keepassxc.keepassxc",
            "com.apple.keychainaccess",
            "com.apple.Passwords",
        ],
        domains: [
            // Password vaults and the credential-entry pages of the identity
            // providers most people pass through daily.
            "1password.com",
            "bitwarden.com",
            "lastpass.com",
            "keepersecurity.com",
            "dashlane.com",
            "accounts.google.com",
            "login.microsoftonline.com",
            "appleid.apple.com",
        ])

    /// Display order for the settings editor, and the form the lists are
    /// persisted in.
    var sortedBundleIdentifiers: [String] { bundleIdentifiers.sorted() }
    var sortedDomains: [String] { domains.sorted() }

    /// Accepts what the user typed into the apps field. Bundle identifiers are
    /// lowercased (matching is case-insensitive) and must be a single token —
    /// anything with whitespace is a name like "1Password", not an id.
    static func normalizeBundleIdentifier(_ raw: String) -> String? {
        let value = raw.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !value.isEmpty, !value.contains(where: \.isWhitespace), value != "." else {
            return nil
        }
        return value
    }

    /// Accepts a bare domain, a leading dot, or a pasted URL.
    static func normalize(domain raw: String) -> String? { normalizeDomain(raw) }

    /// Returns the list with `raw` added, or nil when it is not a usable entry
    /// (unparseable, or already blocked). Nil is what the editor turns into "no
    /// row appeared", which is why adding a duplicate is not an error.
    func adding(bundleIdentifier raw: String) -> CaptureBlacklist? {
        guard let value = Self.normalizeBundleIdentifier(raw), !bundleIdentifiers.contains(value)
        else { return nil }
        var copy = self
        copy.bundleIdentifiers.insert(value)
        return copy
    }

    func adding(domain raw: String) -> CaptureBlacklist? {
        guard let value = Self.normalizeDomain(raw), !domains.contains(value) else { return nil }
        var copy = self
        copy.domains.insert(value)
        return copy
    }

    func removing(bundleIdentifiers values: [String]) -> CaptureBlacklist {
        var copy = self
        for value in values { copy.bundleIdentifiers.remove(value.lowercased()) }
        return copy
    }

    func removing(domains values: [String]) -> CaptureBlacklist {
        var copy = self
        for value in values { copy.domains.remove(value.lowercased()) }
        return copy
    }

    func blocks(bundleIdentifier: String) -> Bool {
        bundleIdentifiers.contains(bundleIdentifier.lowercased())
    }

    /// True when `url`'s host is a blacklisted domain or a subdomain of one.
    /// A missing or hostless URL (a local file, an app with no address bar)
    /// blocks nothing — the bundle-id rule covers those.
    func blocks(url: String?) -> Bool {
        guard let url, let host = Self.host(ofURL: url) else { return false }
        return domains.contains { Self.host(host, isWithin: $0) }
    }

    /// Subdomain-aware: blocking `example.com` blocks `sub.example.com` but
    /// never `notexample.com`.
    static func host(_ host: String, isWithin domain: String) -> Bool {
        let host = host.lowercased()
        return host == domain || host.hasSuffix("." + domain)
    }

    static func host(ofURL url: String) -> String? {
        guard let host = URLComponents(string: url)?.host?.lowercased(), !host.isEmpty else {
            return nil
        }
        // A fully qualified name may carry a trailing root dot.
        return host.hasSuffix(".") ? String(host.dropLast()) : host
    }

    /// Accepts what a user is likely to type into the settings field a story or
    /// two from now — a bare domain, a leading dot, or a pasted URL.
    private static func normalizeDomain(_ raw: String) -> String? {
        var value = raw.trimmingCharacters(in: .whitespaces).lowercased()
        if value.contains("://"), let host = host(ofURL: value) {
            value = host
        }
        if let slash = value.firstIndex(of: "/") { value = String(value[..<slash]) }
        if let colon = value.firstIndex(of: ":") { value = String(value[..<colon]) }
        value = value.trimmingCharacters(in: CharacterSet(charactersIn: "."))
        return value.isEmpty ? nil : value
    }
}

/// Detects a private/incognito browser window from its title.
///
/// Browsers expose no Accessibility attribute for it, but every major one
/// advertises the mode in the window title. The rule deliberately runs against
/// any app rather than a list of known browsers — a browser we haven't heard of
/// still deserves the check, and the cost of a false positive is one skipped
/// window, while a false negative writes a private session into memory forever.
enum PrivateBrowsing {
    /// Lowercased, matched as substrings. English titles only; a localized
    /// browser will not be recognised until the settings work in US-015 lets
    /// the user add their own marker.
    static let titleMarkers = [
        "incognito",  // Chrome, Brave, Vivaldi
        "private browsing",  // Safari, Firefox
        "private window",  // Opera, Brave
        "inprivate",  // Edge
    ]

    static func isPrivateWindowTitle(_ title: String) -> Bool {
        let title = title.lowercased()
        return titleMarkers.contains { title.contains($0) }
    }
}

/// Accessibility roles that identify a password field.
///
/// `AccessibilityWindowSource` skips these elements and their whole subtree
/// before reading any attribute: a secure field's contents must never be read,
/// not read and then masked. The rule lives here, next to the other exclusions
/// and away from the AX glue, so it can be unit-tested.
enum SecureField {
    /// `kAXSecureTextFieldRole` appears as an element's role in AppKit apps and
    /// as the *subrole* of a plain text field in WebKit, so both are checked.
    /// `AXSecureTextArea` is not a documented role but costs nothing to refuse.
    static let secureRoles: Set<String> = ["AXSecureTextField", "AXSecureTextArea"]

    static func isSecure(_ roleOrSubrole: String?) -> Bool {
        guard let roleOrSubrole else { return false }
        return secureRoles.contains(roleOrSubrole)
    }
}
