import XCTest

@testable import Minne

final class CaptureBlacklistTests: XCTestCase {
    private let blacklist = CaptureBlacklist(
        bundleIdentifiers: ["com.1password.1password", "com.example.Vault"],
        domains: ["example.com", "accounts.google.com"])

    // MARK: - Bundle identifiers

    func testBlacklistedBundleIdentifierIsBlocked() {
        XCTAssertTrue(blacklist.blocks(bundleIdentifier: "com.1password.1password"))
    }

    func testBundleIdentifierMatchingIgnoresCase() {
        // Bundle ids are case-insensitive to Launch Services, and a user
        // typing one into settings will not match Apple's capitalisation.
        XCTAssertTrue(blacklist.blocks(bundleIdentifier: "COM.Example.VAULT"))
    }

    func testUnrelatedAppsAreNotBlocked() {
        XCTAssertFalse(blacklist.blocks(bundleIdentifier: "com.apple.Safari"))
        XCTAssertFalse(blacklist.blocks(bundleIdentifier: "com.1password"))
        XCTAssertFalse(blacklist.blocks(bundleIdentifier: ""))
    }

    // MARK: - Domains

    func testBlacklistedDomainIsBlocked() {
        XCTAssertTrue(blacklist.blocks(url: "https://example.com/settings"))
    }

    func testSubdomainsOfABlacklistedDomainAreBlocked() {
        XCTAssertTrue(blacklist.blocks(url: "https://sub.example.com/"))
        XCTAssertTrue(blacklist.blocks(url: "https://deep.sub.example.com/a/b?c=d"))
    }

    func testABlockedSubdomainDoesNotBlockItsParent() {
        XCTAssertTrue(blacklist.blocks(url: "https://accounts.google.com/signin"))
        XCTAssertFalse(blacklist.blocks(url: "https://mail.google.com/"))
        XCTAssertFalse(blacklist.blocks(url: "https://google.com/"))
    }

    func testLookalikeHostsAreNotBlocked() {
        // The suffix rule must be anchored on a dot, or every domain would
        // block anyone who registers a name ending in it.
        XCTAssertFalse(blacklist.blocks(url: "https://notexample.com/"))
        XCTAssertFalse(blacklist.blocks(url: "https://example.com.attacker.net/"))
    }

    func testHostIsMatchedRegardlessOfCasePortOrCredentials() {
        XCTAssertTrue(blacklist.blocks(url: "https://EXAMPLE.COM:8443/path"))
        XCTAssertTrue(blacklist.blocks(url: "https://user:pw@www.example.com/"))
        // A fully qualified name may end in the root dot.
        XCTAssertTrue(blacklist.blocks(url: "https://example.com./"))
    }

    func testURLsWithoutAHostBlockNothing() {
        XCTAssertFalse(blacklist.blocks(url: nil))
        XCTAssertFalse(blacklist.blocks(url: "file:///Users/me/notes.md"))
        XCTAssertFalse(blacklist.blocks(url: "not a url at all"))
        XCTAssertFalse(blacklist.blocks(url: ""))
    }

    func testDomainEntriesAreNormalisedFromWhateverTheUserTyped() {
        // US-015 hands this straight to a text field.
        let typed = CaptureBlacklist(domains: [
            " .Example.com ", "https://bank.se/login", "vault.io:8443", "", ".",
        ])
        XCTAssertEqual(typed.domains, ["example.com", "bank.se", "vault.io"])
        XCTAssertTrue(typed.blocks(url: "https://www.example.com/"))
        XCTAssertTrue(typed.blocks(url: "https://bank.se/accounts"))
    }

    func testStandardListCoversPasswordManagers() {
        XCTAssertTrue(CaptureBlacklist.standard.blocks(bundleIdentifier: "com.1password.1password"))
        XCTAssertTrue(CaptureBlacklist.standard.blocks(bundleIdentifier: "com.apple.passwords"))
        XCTAssertTrue(CaptureBlacklist.standard.blocks(url: "https://my.1password.com/vaults"))
        XCTAssertFalse(CaptureBlacklist.standard.blocks(bundleIdentifier: "com.apple.Safari"))
    }

    // MARK: - Private browsing

    func testPrivateBrowsingTitlesFromEveryMajorBrowser() {
        for title in [
            "Minne — Google Chrome (Incognito)",
            "Start Page — Private Browsing — Mozilla Firefox",
            "Private Browsing",
            "Minne and 2 more pages — Personal — Microsoft​ Edge — InPrivate",
            "New Private Window",
            "SOMETHING IN INCOGNITO",
        ] {
            XCTAssertTrue(PrivateBrowsing.isPrivateWindowTitle(title), title)
        }
    }

    func testOrdinaryTitlesAreNotPrivate() {
        for title in [
            "Minne — Google Chrome",
            "Inbox (3) — Mail",
            "prd-minne.md — minne",
            "",
        ] {
            XCTAssertFalse(PrivateBrowsing.isPrivateWindowTitle(title), title)
        }
    }

    // MARK: - Secure fields

    func testSecureFieldRoles() {
        XCTAssertTrue(SecureField.isSecure("AXSecureTextField"))
        XCTAssertTrue(SecureField.isSecure("AXSecureTextArea"))
        XCTAssertFalse(SecureField.isSecure("AXTextField"))
        XCTAssertFalse(SecureField.isSecure(nil))
    }
}
