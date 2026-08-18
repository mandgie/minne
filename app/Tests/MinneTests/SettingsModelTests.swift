import XCTest

@testable import Minne

/// Scripted `SettingsBackend`: the two brain requests Settings makes, with the
/// answers under the test's control.
@MainActor
private final class FakeSettingsBackend: SettingsBackend {
    var syncResult: Result<JSONValue?, any Error> = .success(nil)
    var logoutResult: Result<JSONValue?, any Error> = .success(nil)
    /// Every call in the order it was made — the wipe's ordering matters.
    private(set) var calls: [String] = []

    func runSync(completion: @escaping @MainActor (Result<JSONValue?, any Error>) -> Void) {
        calls.append("sync")
        completion(syncResult)
    }

    func clearAllCredentials(
        completion: @escaping @MainActor (Result<JSONValue?, any Error>) -> Void
    ) {
        calls.append("logout")
        completion(logoutResult)
    }
}

@MainActor
private final class FakeAuthStatusBackend: AuthBackend {
    var statusPayload: JSONValue?
    private(set) var statusCalls = 0

    func fetchStatus(completion: @escaping @MainActor (Result<JSONValue?, any Error>) -> Void) {
        statusCalls += 1
        completion(.success(statusPayload))
    }
    func configure(
        provider: String?, model: String?, baseURL: String?,
        completion: @escaping @MainActor (Result<JSONValue?, any Error>) -> Void
    ) { completion(.success(nil)) }
    func login(
        id: String, provider: String, method: String?,
        completion: @escaping @MainActor (Result<JSONValue?, any Error>) -> Void
    ) {}
    func answerPrompt(loginId: String, promptId: String, value: String?, cancel: Bool) {}
    func abort(id: String) {}
    func logout(
        provider: String?,
        completion: @escaping @MainActor (Result<JSONValue?, any Error>) -> Void
    ) { completion(.success(nil)) }
    func openAuthURL(_ url: URL) {}
}

/// Settings' behaviour without a window: what persists, what reaches the
/// running app, and what the delete-everything flow does in which order.
@MainActor
final class SettingsModelTests: XCTestCase {
    private var suiteName: String!
    private var defaults: UserDefaults!
    private var paths: MemoryPaths!

    /// `async` so the override inherits the class's main-actor isolation.
    override func setUp() async throws {
        suiteName = "minne-settings-tests-\(UUID().uuidString)"
        defaults = UserDefaults(suiteName: suiteName)
        // Never `.resolved()`: a test must not name the real memory root even
        // in a label, and nothing here touches the disk.
        paths = MemoryPaths(
            memoryRoot: URL(fileURLWithPath: "/tmp/minne-tests/Minne"),
            appSupport: URL(fileURLWithPath: "/tmp/minne-tests/Support"))
    }

    override func tearDown() async throws {
        defaults.removePersistentDomain(forName: suiteName)
    }

    private func makeModel() -> SettingsModel {
        SettingsModel(
            auth: AuthModel(), paths: paths, store: SettingsStore(defaults: defaults),
            permission: .granted)
    }

    /// A second model over the same defaults is what a relaunch looks like.
    private func reloaded() -> SettingsModel { makeModel() }

    // MARK: - Blacklist

    func testAddingAnAppPersistsAndReachesTheCaptureEngine() {
        let model = makeModel()
        var delivered: [CaptureBlacklist] = []
        model.onBlacklistChange = { delivered.append($0) }

        XCTAssertTrue(model.addBlacklistApp("com.example.Vault"))
        XCTAssertTrue(model.blacklist.blocks(bundleIdentifier: "com.example.vault"))
        XCTAssertEqual(delivered.count, 1, "the running engine is told, not the next launch")
        XCTAssertTrue(delivered.last?.blocks(bundleIdentifier: "com.example.vault") ?? false)
        XCTAssertTrue(reloaded().blacklist.blocks(bundleIdentifier: "com.example.vault"))
    }

    func testAddingADomainNormalizesWhatTheUserTyped() {
        let model = makeModel()
        XCTAssertTrue(model.addBlacklistDomain("https://Bank.Example.com/login?x=1"))
        XCTAssertTrue(model.blacklist.blocks(url: "https://secure.bank.example.com/accounts"))
        XCTAssertTrue(reloaded().blacklist.blocks(url: "https://bank.example.com/"))
    }

    func testRejectsEntriesThatAreNotUsable() {
        let model = makeModel()
        XCTAssertFalse(model.addBlacklistApp("  "), "empty")
        XCTAssertFalse(model.addBlacklistApp("1Password 7"), "a name, not a bundle id")
        XCTAssertFalse(model.addBlacklistDomain("://"), "unparseable")
        XCTAssertTrue(model.addBlacklistApp("com.example.app"))
        XCTAssertFalse(model.addBlacklistApp("COM.EXAMPLE.APP"), "already blocked")
    }

    /// The point of persisting the whole list rather than the user's additions:
    /// a default the user removes stays removed across a relaunch.
    func testRemovingAShippedDefaultSticks() {
        let model = makeModel()
        XCTAssertTrue(CaptureBlacklist.standard.blocks(url: "https://accounts.google.com/"))
        model.removeBlacklistDomains(["accounts.google.com"])
        XCTAssertFalse(model.blacklist.blocks(url: "https://accounts.google.com/"))
        XCTAssertFalse(reloaded().blacklist.blocks(url: "https://accounts.google.com/"))
    }

    func testResetRestoresTheShippedLists() {
        let model = makeModel()
        XCTAssertFalse(model.canResetBlacklist, "nothing has been edited yet")
        model.removeBlacklistDomains(["accounts.google.com"])
        model.addBlacklistApp("com.example.app")
        XCTAssertTrue(model.canResetBlacklist)

        var delivered: [CaptureBlacklist] = []
        model.onBlacklistChange = { delivered.append($0) }
        model.resetBlacklist()
        XCTAssertEqual(model.blacklist, .standard)
        XCTAssertEqual(delivered.last, .standard)
        XCTAssertEqual(reloaded().blacklist, .standard)
    }

    // MARK: - Retention

    func testRetentionPersistsAndSweepsImmediately() {
        let model = makeModel()
        var swept: [RetentionPolicy] = []
        model.onRetentionChange = { swept.append($0) }

        model.setRetentionDays(7)
        XCTAssertEqual(swept, [RetentionPolicy(days: 7)], "shortening it makes sources overdue now")
        XCTAssertEqual(SettingsStore(defaults: defaults).retention.days, 7)
        XCTAssertEqual(reloaded().retentionDays, 7)

        model.setRetentionDays(0)
        XCTAssertEqual(model.retentionLine, "Raw captures are kept forever.")
        model.setRetentionDays(-5)
        XCTAssertEqual(model.retentionDays, 0, "negative days mean the same as forever")
    }

    // MARK: - Pause

    /// Settings asks; the status item owns the pause and hands it back. That
    /// round trip is what keeps the menu bar icon and the popup in step.
    func testPauseIsRequestedNotSetDirectly() {
        let model = makeModel()
        var requested: [PauseState] = []
        model.onRequestPause = { requested.append($0) }

        model.requestPause(.paused(until: nil))
        XCTAssertEqual(requested, [.paused(until: nil)])
        XCTAssertEqual(model.pause, .active, "not until the owner confirms")

        model.adopt(pause: .paused(until: nil))
        XCTAssertEqual(model.pause, .paused(until: nil))
    }

    func testTimedPauseRendersOntoTheNearestMenuOffer() {
        XCTAssertEqual(PrivacySectionView.pauseIndex(for: .active), 0)
        XCTAssertEqual(
            PrivacySectionView.pauseIndex(for: .paused(until: Date().addingTimeInterval(600))), 1)
        XCTAssertEqual(
            PrivacySectionView.pauseIndex(for: .paused(until: Date().addingTimeInterval(3000))), 2)
        XCTAssertEqual(PrivacySectionView.pauseIndex(for: .paused(until: nil)), 3)
    }

    /// The egress statement (US-111) must keep the claims the audit verified:
    /// memory in ~/Minne, provider-only network traffic under the user's own
    /// credentials, no Minne servers, no telemetry, and the local escape hatch.
    /// If the product grows a network path, this copy — and this test — must
    /// change with it.
    func testTheEgressCopyKeepsItsAuditedClaims() {
        let line = makeModel().egressLine
        XCTAssertTrue(line.contains("~/Minne"))
        XCTAssertTrue(line.contains("provider you chose"))
        XCTAssertTrue(line.contains("your own account or key"))
        XCTAssertTrue(line.contains("no Minne server"))
        XCTAssertTrue(line.contains("no telemetry"))
        XCTAssertTrue(line.contains("Ollama"))
    }

    // MARK: - Shortcuts

    func testHotKeyToggleIsAppliedLiveAndRemembered() {
        let model = makeModel()
        var applied: [Bool] = []
        model.onHotKeyChange = { applied.append($0) }
        XCTAssertTrue(model.hotKeyEnabled, "on unless the user turns it off")

        model.setHotKeyEnabled(false)
        XCTAssertEqual(applied, [false])
        XCTAssertFalse(reloaded().hotKeyEnabled)
        XCTAssertEqual(model.hotKeyLine, "The chat window opens from the menu bar.")

        model.setHotKeyEnabled(true)
        model.adopt(hotKeyRegistered: false)
        XCTAssertTrue(model.hotKeyLine.contains("taken by another app"))
    }

    func testMinneKeyToggleIsAppliedLiveAndRemembered() {
        let model = makeModel()
        var applied: [MinneKeyTrigger] = []
        model.onMinneKeyChange = { applied.append($0) }
        XCTAssertTrue(model.minneKeyEnabled, "on unless the user turns it off")
        XCTAssertEqual(model.minneKeyTrigger, .rightOption, "right-Option unless re-mapped")

        model.setMinneKeyEnabled(false)
        XCTAssertEqual(applied, [.off])
        XCTAssertFalse(reloaded().minneKeyEnabled)
        XCTAssertEqual(model.minneKeyLine, "Right-Option behaves like any other Option key.")

        model.setMinneKeyEnabled(true)
        model.adopt(minneKeyActive: true)
        XCTAssertTrue(model.minneKeyLine.contains("Tap right-Option"))
    }

    /// The `off` trigger is "disabled" spelled as a trigger (US-103): it tears
    /// the tap down through the same callback, and both spellings agree on
    /// disk and after a reload.
    func testTheOffTriggerIsExactlyTheDisabledToggle() {
        let model = makeModel()
        var applied: [MinneKeyTrigger] = []
        model.onMinneKeyChange = { applied.append($0) }

        model.setMinneKeyTrigger(.off)
        XCTAssertEqual(applied, [.off])
        XCTAssertFalse(model.minneKeyEnabled)
        let after = reloaded()
        XCTAssertEqual(after.minneKeyTrigger, .off)
        XCTAssertFalse(after.minneKeyEnabled)

        model.setMinneKeyTrigger(.rightOption)
        XCTAssertEqual(applied, [.off, .rightOption])
        XCTAssertTrue(reloaded().minneKeyEnabled)
    }

    /// A pre-trigger install knows only the boolean; false must read as `off`,
    /// and — because `-minneKeyEnabled NO` is also how a dev run switches the
    /// key off — the boolean wins over any stored trigger.
    func testTheLegacyBooleanStillDecides() {
        defaults.set(false, forKey: SettingsStore.minneKeyKey)
        XCTAssertEqual(makeModel().minneKeyTrigger, .off)

        defaults.set(MinneKeyTrigger.rightOption.rawValue, forKey: SettingsStore.minneKeyTriggerKey)
        XCTAssertEqual(makeModel().minneKeyTrigger, .off, "false is a kill switch")

        defaults.set(true, forKey: SettingsStore.minneKeyKey)
        XCTAssertEqual(makeModel().minneKeyTrigger, .rightOption)
    }

    /// A trigger written by a newer version falls back to the default key, not
    /// to off: the user asked for *a* key, not for none.
    func testAnUnknownStoredTriggerFallsBackToRightOption() {
        defaults.set("fn", forKey: SettingsStore.minneKeyTriggerKey)
        XCTAssertEqual(makeModel().minneKeyTrigger, .rightOption)
    }

    /// The settings copy has to reassure exactly the people the key worries:
    /// AltGr typists on international layouts (US-103).
    func testTheMinneKeyCopyMentionsInternationalLayouts() {
        let model = makeModel()
        model.adopt(minneKeyActive: true)
        XCTAssertTrue(model.minneKeyLine.contains("international"))
        XCTAssertTrue(model.minneKeyLine.contains("AltGr"))
    }

    /// The Minne key is an event tap, so it needs Accessibility. On but
    /// inactive has to say *why*, or the user presses a dead key.
    func testTheMinneKeyExplainsAMissingGrant() {
        let model = SettingsModel(
            auth: AuthModel(), paths: paths, store: SettingsStore(defaults: defaults),
            permission: .missing)
        XCTAssertTrue(model.minneKeyEnabled)
        XCTAssertFalse(model.minneKeyActive)
        XCTAssertTrue(model.minneKeyLine.contains("Grant Accessibility access"))

        model.adopt(permission: .granted)
        XCTAssertTrue(model.minneKeyLine.contains("could not start"))
        model.adopt(minneKeyActive: true)
        XCTAssertTrue(model.minneKeyLine.contains("Tap right-Option"))
    }

    // MARK: - Sync

    func testSyncNowRunsAPassAndRereadsStatus() {
        let model = makeModel()
        let auth = FakeAuthStatusBackend()
        model.auth.backend = auth
        let backend = FakeSettingsBackend()
        backend.syncResult = .success(
            .object([
                "pass": .string("sync"), "status": .string("ingested"), "snapshots": .number(12),
                "pagesTouched": .array([.string("wiki/people/ada.md")]),
            ]))
        model.backend = backend

        model.syncNow()
        XCTAssertEqual(backend.calls, ["sync"])
        XCTAssertEqual(model.syncPhase, .finished("Digested 12 captures into 1 page."))
        XCTAssertEqual(auth.statusCalls, 1, "the watermark moved; re-read rather than guess")
    }

    func testSyncNowIsRefusedWhileTheBrainIsAlreadyRunningAPass() {
        let model = makeModel()
        model.backend = FakeSettingsBackend()
        XCTAssertTrue(model.canSyncNow)

        let auth = FakeAuthStatusBackend()
        auth.statusPayload = .object([
            "provider": .string("anthropic"), "providers": .array([]),
            "sync": .object(["state": .string("running"), "pass": .string("sync")]),
        ])
        model.auth.backend = auth
        model.auth.refresh()
        XCTAssertFalse(model.canSyncNow)
        XCTAssertEqual(model.lastSyncLine, "Syncing now…")
    }

    func testOpenWikiFolderOpensTheWikiNotTheWholeRoot() {
        let model = makeModel()
        var opened: [URL] = []
        model.onOpenFolder = { opened.append($0) }
        model.openWikiFolder()
        XCTAssertEqual(opened, [paths.wiki])
    }

    // MARK: - Delete all memory

    func testDeleteAllMemoryNeedsTheTypedConfirmation() {
        let model = makeModel()
        var wipes = 0
        model.onWipe = { _ in
            wipes += 1
            return MemoryWipe.Report()
        }
        model.deleteAllMemory(confirmation: "yes please")
        XCTAssertEqual(wipes, 0)
        XCTAssertEqual(model.wipePhase, .idle)
    }

    /// Credentials are dropped through the brain *before* the files go, because
    /// the brain holds them in memory too — deleting auth.json under a running
    /// brain would leave it still signed in.
    func testDeleteAllMemoryLogsOutFirstThenWipes() {
        let model = makeModel()
        let auth = FakeAuthStatusBackend()
        model.auth.backend = auth
        let backend = FakeSettingsBackend()
        model.backend = backend

        var wipedPaths: [MemoryPaths] = []
        model.onWipe = { paths in
            wipedPaths.append(paths)
            var report = MemoryWipe.Report()
            report.removed = [paths.memoryRoot.path, "minne.db"]
            return report
        }

        model.deleteAllMemory(confirmation: " Delete ")
        XCTAssertEqual(backend.calls, ["logout"])
        XCTAssertEqual(wipedPaths, [paths])
        XCTAssertEqual(model.wipePhase, .done("Deleted 2 item(s). Minne starts over from here."))
        XCTAssertEqual(auth.statusCalls, 1, "the account is signed out now; re-read it")
    }

    /// A brain that will not answer must not block the deletion — the files are
    /// the user's memory, and they asked for them to go.
    func testDeleteAllMemoryStillWipesWhenTheBrainRefusesToLogOut() {
        let model = makeModel()
        let backend = FakeSettingsBackend()
        backend.logoutResult = .failure(
            BrainClientError.brain(code: "internal", message: "no credential store"))
        model.backend = backend
        var wipes = 0
        model.onWipe = { _ in
            wipes += 1
            return MemoryWipe.Report()
        }
        model.deleteAllMemory(confirmation: "delete")
        XCTAssertEqual(wipes, 1)
    }

    func testAFailedWipeIsReportedRatherThanCelebrated() {
        let model = makeModel()
        model.onWipe = { paths in
            var report = MemoryWipe.Report()
            report.failed = [(path: paths.memoryRoot.path, reason: "permission denied")]
            return report
        }
        model.deleteAllMemory(confirmation: "delete")
        guard case .failed(let message) = model.wipePhase else {
            return XCTFail("expected a failure, got \(model.wipePhase)")
        }
        XCTAssertTrue(message.contains("permission denied"))
    }
}
