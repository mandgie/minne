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
