import Foundation

/// The two brain requests Settings makes on its own behalf. Auth goes through
/// `AuthBackend`; this is the memory half — run a sync now, and drop every
/// stored credential as part of deleting all memory.
@MainActor
protocol SettingsBackend: AnyObject {
    func runSync(completion: @escaping @MainActor (Result<JSONValue?, any Error>) -> Void)
    /// `logout` with no provider: the brain clears every credential it holds,
    /// in memory as well as on disk. Deleting `auth.json` from under a running
    /// brain would not.
    func clearAllCredentials(
        completion: @escaping @MainActor (Result<JSONValue?, any Error>) -> Void)
}

/// Everything the settings window shows and changes.
///
/// The window is a renderer; every rule about what a click means lives here,
/// which is what lets the whole of Settings — persistence, live effect, the
/// delete-everything flow — be tested without opening a window. Account state
/// is not duplicated: `auth` is the same `AuthModel` onboarding and the menu
/// bar render (US-014).
@MainActor
final class SettingsModel {
    enum Section: String, CaseIterable, Sendable {
        case account, privacy, memory, general

        var title: String {
            switch self {
            case .account: return "Account"
            case .privacy: return "Privacy"
            case .memory: return "Memory"
            case .general: return "General"
            }
        }

        var symbolName: String {
            switch self {
            case .account: return "person.crop.circle"
            case .privacy: return "hand.raised"
            case .memory: return "books.vertical"
            case .general: return "gearshape"
            }
        }
    }

    /// What the Memory section's sync button is doing.
    enum SyncPhase: Equatable, Sendable {
        case idle
        case running
        case finished(String)
        case failed(String)

        var isRunning: Bool { self == .running }
    }

    /// What the delete-everything sheet is doing.
    enum WipePhase: Equatable, Sendable {
        case idle
        case working
        case done(String)
        case failed(String)
    }

    let auth: AuthModel
    let paths: MemoryPaths
    private var store: SettingsStore

    private(set) var section: Section = .account
    private(set) var blacklist: CaptureBlacklist
    private(set) var retentionDays: Int
    private(set) var pause: PauseState = .active
    private(set) var permission: CapturePermissionState
    private(set) var syncPhase: SyncPhase = .idle
    private(set) var wipePhase: WipePhase = .idle

    var backend: (any SettingsBackend)?

    /// The capture engine's blacklist is replaced through this, which is what
    /// makes an edit apply to the running engine rather than the next launch.
    var onBlacklistChange: (@MainActor (CaptureBlacklist) -> Void)?
    /// A shorter retention means sources are already overdue: the app sweeps
    /// immediately rather than at the next daily tick.
    var onRetentionChange: (@MainActor (RetentionPolicy) -> Void)?
    /// Pause is owned by the status item (it drives the icon and the menu), so
    /// Settings asks rather than sets, and adopts what comes back.
    var onRequestPause: (@MainActor (PauseState) -> Void)?
    /// Deletes the files. The app owns it because the app owns the open
    /// database handle, which has to be closed before its file goes away and
    /// reopened (re-seeding the memory root) afterwards.
    var onWipe: (@MainActor (MemoryPaths) -> MemoryWipe.Report)?
    /// Opens a folder in the Finder. Injected so tests do not need one.
    var onOpenFolder: (@MainActor (URL) -> Void)?
    /// Registers or unregisters the ⌥Space hotkey, live.
    var onHotKeyChange: (@MainActor (Bool) -> Void)?
    /// Applies a Minne key trigger change to the running controller, live.
    var onMinneKeyChange: (@MainActor (MinneKeyTrigger) -> Void)?

    private var observers = ObserverRegistry<SettingsModel>()

    init(
        auth: AuthModel, paths: MemoryPaths = .resolved(), store: SettingsStore = SettingsStore(),
        permission: CapturePermissionState = .missing
    ) {
        self.auth = auth
        self.paths = paths
        self.store = store
        self.permission = permission
        self.blacklist = store.blacklist
        self.retentionDays = store.retention.days
        self.hotKeyEnabled = store.chatHotKeyEnabled
        self.minneKeyTrigger = store.minneKeyTrigger
        // Account state is live in Settings for the same reason it is live in
        // the menu bar: one model, rendered wherever it is shown.
        auth.observe(self) { [weak self] _ in self?.notify() }
    }

    func observe(_ owner: AnyObject, _ handler: @escaping @MainActor (SettingsModel) -> Void) {
        observers.add(owner, handler)
        handler(self)
    }

    private func notify() {
        observers.notify(self)
    }

    // MARK: - Section

    func select(_ section: Section) {
        guard section != self.section else { return }
        self.section = section
        notify()
    }

    // MARK: - Inputs from the app

    func adopt(permission: CapturePermissionState) {
        guard permission != self.permission else { return }
        self.permission = permission
        notify()
    }

    func adopt(pause: PauseState) {
        guard pause != self.pause else { return }
        self.pause = pause
        notify()
    }

    // MARK: - Privacy: blacklist

    /// Adds what the user typed. Returns false when it was not a usable entry
    /// or is already blocked, which the editor shows by leaving the field
    /// alone instead of clearing it.
    @discardableResult
    func addBlacklistApp(_ raw: String) -> Bool {
        guard let updated = blacklist.adding(bundleIdentifier: raw) else { return false }
        apply(updated)
        return true
    }

    @discardableResult
    func addBlacklistDomain(_ raw: String) -> Bool {
        guard let updated = blacklist.adding(domain: raw) else { return false }
        apply(updated)
        return true
    }

    func removeBlacklistApps(_ values: [String]) {
        guard !values.isEmpty else { return }
        apply(blacklist.removing(bundleIdentifiers: values))
    }

    func removeBlacklistDomains(_ values: [String]) {
        guard !values.isEmpty else { return }
        apply(blacklist.removing(domains: values))
    }

    var canResetBlacklist: Bool { store.hasCustomBlacklist }

    /// Back to the shipped list, including any default the user had removed.
    func resetBlacklist() {
        store.resetBlacklist()
        blacklist = store.blacklist
        onBlacklistChange?(blacklist)
        notify()
    }

    private func apply(_ updated: CaptureBlacklist) {
        blacklist = updated
        store.setBlacklist(updated)
        onBlacklistChange?(updated)
        notify()
    }

    // MARK: - Privacy: retention

    /// Days of raw captures to keep; 0 means forever.
    func setRetentionDays(_ days: Int) {
        let days = max(0, days)
        guard days != retentionDays else { return }
        retentionDays = days
        store.setRetentionDays(days)
        onRetentionChange?(RetentionPolicy(days: days))
        notify()
    }

    var retentionLine: String {
        retentionDays > 0
            ? "Raw captures older than \(retentionDays) days are deleted. Wiki pages are never deleted."
            : "Raw captures are kept forever."
    }

    // MARK: - Privacy: pause

    func requestPause(_ state: PauseState) {
        onRequestPause?(state)
    }

    var permissionLine: String {
        permission.isGranted
            ? "Accessibility access granted — Minne can read the window you are working in."
            : "Accessibility access missing — Minne captures nothing."
    }

    // MARK: - Privacy: egress

    /// The egress story (US-111), stated where the user looks for it. Every
    /// sentence is audited against the code: the app links no networking APIs
    /// at all, and the brain's only network I/O is the pi provider layer for
    /// the provider the user configured — model requests and sign-in. Keep
    /// this text true before keeping it short.
    var egressLine: String {
        "Your memory is a folder of plain files on this Mac, in ~/Minne — "
            + "there is no cloud copy, no backup, and no Minne server anywhere. "
            + "The only network connections Minne makes are to the AI provider you chose, "
            + "using your own account or key: drafts, chat and the sync pass send it "
            + "excerpts of your captures and notes to think about, and sign-in exchanges "
            + "credentials with that same provider. Nothing else is sent to anyone — "
            + "no telemetry, no analytics. Choose the local provider (Ollama) and "
            + "requests stay on your Mac."
    }

    // MARK: - General: the chat hotkey

    /// Whether ⌥Space should be registered at all.
    private(set) var hotKeyEnabled: Bool
    /// Whether the registration actually succeeded — Carbon refuses a
    /// combination another app already owns, and the user deserves to be told
    /// that rather than pressing a dead key.
    private(set) var hotKeyRegistered = false

    func setHotKeyEnabled(_ enabled: Bool) {
        guard enabled != hotKeyEnabled else { return }
        hotKeyEnabled = enabled
        store.setChatHotKeyEnabled(enabled)
        onHotKeyChange?(enabled)
        notify()
    }

    func adopt(hotKeyRegistered: Bool) {
        guard hotKeyRegistered != self.hotKeyRegistered else { return }
        self.hotKeyRegistered = hotKeyRegistered
        notify()
    }

    var hotKeyLine: String {
        guard hotKeyEnabled else { return "The chat window opens from the menu bar." }
        return hotKeyRegistered
            ? "Press ⌥Space in any app to open the chat window."
            : "⌥Space is taken by another app — open chat from the menu bar instead."
    }

    // MARK: - General: the Minne key

    /// Which key wakes Minne at the caret (US-017, US-103): right-Option, or
    /// none. The old `minneKeyEnabled` boolean is a view over this — `off` is
    /// how "disabled" is spelled now.
    private(set) var minneKeyTrigger: MinneKeyTrigger
    var minneKeyEnabled: Bool { minneKeyTrigger.installsTap }
    /// Whether the event tap is actually installed. It needs Accessibility, so
    /// the preference being on is not the same as the key working.
    private(set) var minneKeyActive = false

    func setMinneKeyTrigger(_ trigger: MinneKeyTrigger) {
        guard trigger != minneKeyTrigger else { return }
        minneKeyTrigger = trigger
        store.setMinneKeyTrigger(trigger)
        onMinneKeyChange?(trigger)
        notify()
    }

    /// The boolean spelling, kept for callers that only know on/off.
    func setMinneKeyEnabled(_ enabled: Bool) {
        setMinneKeyTrigger(enabled ? .rightOption : .off)
    }

    func adopt(minneKeyActive: Bool) {
        guard minneKeyActive != self.minneKeyActive else { return }
        self.minneKeyActive = minneKeyActive
        notify()
    }

    var minneKeyLine: String {
        guard minneKeyEnabled else {
            return "Right-Option behaves like any other Option key."
        }
        if minneKeyActive {
            return "Tap right-Option in any text field to bring Minne to your caret. "
                + "A bare tap only: typing with it held — @, €, ~ on international "
                + "(AltGr) layouts — works as it always did."
        }
        return permission.isGranted
            ? "The Minne key could not start — Minne cannot watch the keyboard."
            : "Grant Accessibility access in Privacy to use the Minne key."
    }

    // MARK: - Memory

    var syncStatus: SyncStatusInfo? { auth.state?.sync }

    var lastSyncLine: String {
        guard let syncStatus else { return "Waiting for the brain…" }
        if case .running = syncPhase { return "Syncing now…" }
        if case .failed(let reason) = syncPhase { return "Sync failed — \(reason)" }
        return syncStatus.lastSyncLine()
    }

    var pendingLine: String { syncStatus?.pendingLine ?? "" }

    var canSyncNow: Bool {
        backend != nil && !syncPhase.isRunning && !(syncStatus?.isRunning ?? false)
    }

    /// Runs an ingestion pass now instead of waiting for the brain's timer.
    func syncNow() {
        guard let backend, canSyncNow else { return }
        syncPhase = .running
        notify()
        backend.runSync { [weak self] result in
            guard let self else { return }
            switch result {
            case .success(let value):
                self.syncPhase = .finished(Self.describePass(value))
            case .failure(let error):
                self.syncPhase = .failed(AuthModel.describe(error))
            }
            self.notify()
            // The pass moved the watermark and the last-sync summary, both of
            // which live in `status` — re-read rather than guess.
            self.auth.refresh()
        }
    }

    /// One line about what an on-demand pass did, from `ingest`'s result.
    static func describePass(_ value: JSONValue?) -> String {
        guard let fields = value?.objectValue else { return "Sync finished." }
        let status = fields["status"]?.stringValue ?? "finished"
        let snapshots = fields["snapshots"]?.intValue ?? 0
        let pages = (fields["pagesTouched"]?.arrayValue ?? []).count
        switch status {
        case "ingested":
            return
                "Digested \(snapshots) capture\(snapshots == 1 ? "" : "s") into \(pages) page\(pages == 1 ? "" : "s")."
        case "idle":
            return "Nothing new to digest."
        case "skipped":
            return "Skipped — \(fields["reason"]?.stringValue ?? "no provider signed in")."
        case "clean":
            return "The wiki is already consistent."
        case "fixed":
            return "Fixed \(pages) page\(pages == 1 ? "" : "s")."
        default:
            return "Sync \(status)."
        }
    }

    func openWikiFolder() {
        onOpenFolder?(paths.wiki)
    }

    // MARK: - Delete all memory

    var wipeConfirmationHint: String {
        "Type “\(MemoryWipe.confirmationPhrase)” to confirm. This deletes \(paths.memoryRoot.path), the search index and your stored sign-in."
    }

    func canConfirmWipe(_ typed: String) -> Bool {
        MemoryWipe.matchesConfirmation(typed) && wipePhase != .working
    }

    /// Signs out of every provider, then deletes the memory root, the index and
    /// the brain's derived state. Credentials go first and through the brain:
    /// it holds them in memory too, so removing the file alone would leave the
    /// running process still signed in.
    func deleteAllMemory(confirmation: String) {
        guard canConfirmWipe(confirmation) else { return }
        wipePhase = .working
        notify()
        guard let backend else {
            finishWipe()
            return
        }
        backend.clearAllCredentials { [weak self] result in
            if case .failure(let error) = result {
                BrainClient.log("delete all memory: logout failed: \(error)")
            }
            self?.finishWipe()
        }
    }

    private func finishWipe() {
        guard let onWipe else {
            wipePhase = .failed("Nothing was deleted — Minne could not reach its files.")
            notify()
            return
        }
        let report = onWipe(paths)
        wipePhase = report.failed.isEmpty ? .done(report.summary) : .failed(report.summary)
        BrainClient.log("delete all memory: \(report.summary)")
        notify()
        // Auth and sync state both changed underneath us.
        auth.refresh()
    }

    func dismissWipeResult() {
        guard wipePhase != .idle else { return }
        wipePhase = .idle
        notify()
    }
}

/// `SettingsBackend` over the real brain.
@MainActor
final class BrainSettingsBackend: SettingsBackend {
    private let client: BrainClient

    init(client: BrainClient) {
        self.client = client
    }

    private func send(
        _ request: BrainRequest,
        completion: @escaping @MainActor (Result<JSONValue?, any Error>) -> Void
    ) {
        Task {
            do {
                completion(.success(try await client.request(request)))
            } catch {
                completion(.failure(error))
            }
        }
    }

    func runSync(completion: @escaping @MainActor (Result<JSONValue?, any Error>) -> Void) {
        send(.ingest(id: UUID().uuidString, mode: "sync"), completion: completion)
    }

    func clearAllCredentials(
        completion: @escaping @MainActor (Result<JSONValue?, any Error>) -> Void
    ) {
        send(.logout(id: UUID().uuidString, provider: nil), completion: completion)
    }
}
