import AppKit

/// How the provider step reaches the brain. The real implementation wraps
/// `BrainClient`; tests substitute a scripted double, which is what keeps the
/// whole sign-in flow (configure, login, prompts, stale prompts, sign-out)
/// testable without a running brain, a browser, or a display.
@MainActor
protocol AuthBackend: AnyObject {
    func fetchStatus(completion: @escaping @MainActor (Result<JSONValue?, any Error>) -> Void)
    func configure(
        provider: String?, model: String?, baseURL: String?,
        completion: @escaping @MainActor (Result<JSONValue?, any Error>) -> Void)
    /// Starts a login. `id` is the request id whose `auth_url` and `auth_prompt`
    /// events belong to this flow.
    func login(
        id: String, provider: String, method: String?,
        completion: @escaping @MainActor (Result<JSONValue?, any Error>) -> Void)
    /// Answers (or cancels) a prompt the login raised. Fire and forget: a
    /// prompt the flow has already abandoned is answered with `invalid_request`,
    /// which is not the user's problem.
    func answerPrompt(loginId: String, promptId: String, value: String?, cancel: Bool)
    func abort(id: String)
    func logout(
        provider: String?,
        completion: @escaping @MainActor (Result<JSONValue?, any Error>) -> Void)
    /// Hands an OAuth URL to the browser.
    func openAuthURL(_ url: URL)
}

/// The app's live account state and the whole sign-in flow: which provider is
/// selected, which model it runs, whether it is authenticated, and every step
/// of getting there. Onboarding renders it (US-014) and Settings will render
/// the same object (US-015) — there is one auth state in the app, fed from the
/// brain's `status` after every login, logout and configure.
@MainActor
@Observable
final class AuthModel {
    /// A login flow is waiting for something only the user can supply.
    struct PendingPrompt: Equatable, Sendable {
        let promptId: String
        let message: String
        /// "text" | "secret" | "select" | "manual_code"
        let promptType: String
        let placeholder: String?
        let options: [AuthPromptOption]

        var isSecret: Bool { promptType == "secret" }
    }

    enum Phase: Equatable, Sendable {
        case idle
        /// Something is in flight; the string is what to tell the user.
        case working(String)
        case prompting(PendingPrompt)
        /// Sign-in succeeded; the string is the account summary.
        case signedIn(String)
        case failed(String)

        var isBusy: Bool {
            switch self {
            case .working, .prompting: return true
            case .idle, .signedIn, .failed: return false
            }
        }
    }

    /// Last state the brain reported. Nil until the first `status` answers.
    private(set) var state: AuthState?
    private(set) var phase: Phase = .idle
    /// Which card the provider step has selected.
    private(set) var selection: ProviderChoice = .claude
    /// Which provider the API-key card is pointed at.
    private(set) var apiKeyProvider: String = "anthropic"
    /// Address of the local server, as typed.
    private(set) var baseURL: String = "http://localhost:11434/v1"
    /// Model the picker shows for the selected provider.
    private(set) var selectedModel: String?

    /// Set by the app once the brain is connected.
    var backend: (any AuthBackend)?
    /// Injectable so tests can assert on request ids.
    var makeRequestId: () -> String = { UUID().uuidString }
    /// A sign-in completed — onboarding advances past the provider step.
    var onSignedIn: (@MainActor (String) -> Void)?

    /// Request id of the login in flight, if any. Also the id whose `auth_url`
    /// and `auth_prompt` events this model answers.
    private(set) var activeLoginId: String?
    /// Once the user picks a card (or edits the address), an incoming `status`
    /// no longer overrides them.
    private var selectionIsUserChosen = false
    private var baseURLIsUserEdited = false
    private var modelIsUserChosen = false

    /// AppKit observers: the onboarding window, the settings window and the
    /// menu bar all render this model.
    private var observers = ObserverRegistry<AuthModel>()

    /// Registers a renderer and renders it once immediately. The registration
    /// lasts as long as `owner` does — onboarding windows come and go, and a
    /// dead one must not keep being rendered into.
    func observe(_ owner: AnyObject, _ handler: @escaping @MainActor (AuthModel) -> Void) {
        observers.add(owner, handler)
        handler(self)
    }

    private func notify() {
        observers.notify(self)
    }

    // MARK: - Derived state

    var card: ProviderCard { ProviderCatalog.card(for: selection) }

    /// The pi provider id the current selection maps onto.
    var providerId: String {
        let card = self.card
        if card.providerIds.count > 1 {
            return card.providerIds.contains(apiKeyProvider) ? apiKeyProvider : card.providerIds[0]
        }
        return card.providerIds[0]
    }

    /// Models the picker offers for the current selection.
    var models: [ModelOption] { state?.info(providerId)?.models ?? [] }

    /// Whether the currently selected provider already has a credential.
    var isSelectionSignedIn: Bool { state?.info(providerId)?.isAuthenticated ?? false }

    /// Whether the brain is configured for the selected provider *and* signed
    /// in to it — what "sign out" acts on.
    var isSignedIn: Bool { state?.isSignedIn ?? false }

    var accountSummary: String { state?.accountSummary ?? "Not signed in" }

    var canSignIn: Bool {
        guard backend != nil, !phase.isBusy else { return false }
        if card.needsBaseURL { return Self.isServerURL(trimmedBaseURL) }
        return true
    }

    /// Whether a typed address is somewhere an HTTP client could actually go.
    /// `URL(string:)` alone is no test at all — it reads "localhost:11434" as a
    /// URL whose *scheme* is "localhost".
    static func isServerURL(_ text: String) -> Bool {
        guard let url = URL(string: text), let scheme = url.scheme?.lowercased(),
            scheme == "http" || scheme == "https"
        else { return false }
        return !(url.host ?? "").isEmpty
    }

    /// Whether the brain is currently pointed at the selected provider.
    var isSelectionInUse: Bool { state?.provider == providerId }

    /// Label for the card's action button. A local server is configured rather
    /// than signed in to, and a provider whose credential is already stored
    /// only needs configuring — sending the user back to a browser to prove
    /// something the brain already knows would be rude.
    var signInTitle: String {
        if !card.needsLogin { return "Use This Server" }
        return isSelectionSignedIn ? "Use This Account" : "Sign In"
    }

    /// One line about where the *selected card* stands. `accountSummary` is
    /// the other question — what the app as a whole is signed in to — and the
    /// menu bar shows that one.
    var statusLine: String {
        switch phase {
        case .working(let message):
            return message
        case .prompting:
            return "Waiting for you…"
        case .signedIn(let summary):
            return "Signed in — \(summary)"
        case .failed(let reason):
            return reason
        case .idle:
            guard isSelectionSignedIn else {
                return card.needsLogin ? "Not signed in" : "Not set up yet"
            }
            if isSelectionInUse { return card.needsLogin ? "In use — signed in" : "In use" }
            return card.needsLogin ? "Signed in — not in use" : "Ready — not in use"
        }
    }

    private var trimmedBaseURL: String {
        baseURL.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    // MARK: - Selection

    func select(_ choice: ProviderChoice) {
        guard choice != selection else { return }
        selection = choice
        selectionIsUserChosen = true
        modelIsUserChosen = false
        // A failure belonged to the card the user just left.
        if case .failed = phase { phase = .idle }
        if case .signedIn = phase { phase = .idle }
        resolveModel()
        notify()
    }

    /// Points the API-key card at Anthropic or OpenAI.
    func selectAPIKeyProvider(_ providerId: String) {
        guard apiKeyProvider != providerId else { return }
        apiKeyProvider = providerId
        selectionIsUserChosen = true
        modelIsUserChosen = false
        resolveModel()
        notify()
    }

    func selectModel(_ modelId: String) {
        guard selectedModel != modelId else { return }
        selectedModel = modelId
        modelIsUserChosen = true
        notify()
        // A model change on a provider already in use takes effect without a
        // second sign-in.
        guard isSelectionSignedIn, state?.provider == providerId, let backend else { return }
        backend.configure(provider: providerId, model: modelId, baseURL: nil) {
            [weak self] result in
            self?.adoptOrLog(result)
        }
    }

    func setBaseURL(_ value: String) {
        guard baseURL != value else { return }
        baseURL = value
        baseURLIsUserEdited = true
        notify()
    }

    // MARK: - Status

    /// Asks the brain what it is configured for. Every flow ends here, so the
    /// UI never guesses at auth state it could read.
    func refresh() {
        guard let backend else { return }
        backend.fetchStatus { [weak self] result in
            self?.adoptOrLog(result)
        }
    }

    private func adoptOrLog(_ result: Result<JSONValue?, any Error>) {
        switch result {
        case .success(let value):
            guard let parsed = AuthState.parse(value) else {
                BrainClient.log("auth: unparseable status result")
                return
            }
            adopt(parsed)
        case .failure(let error):
            BrainClient.log("auth: status failed: \(error)")
        }
    }

    private func adopt(_ newState: AuthState) {
        state = newState
        if !selectionIsUserChosen {
            let authType = newState.current?.authType
            if let choice = ProviderCatalog.choice(
                forProvider: newState.provider, authType: authType)
            {
                selection = choice
                if ProviderCatalog.card(for: choice).providerIds.count > 1 {
                    apiKeyProvider = newState.provider
                }
            }
        }
        if !baseURLIsUserEdited, let configured = newState.info("ollama")?.baseURL {
            baseURL = configured
        }
        resolveModel()
        notify()
    }

    /// Keeps the picker on a model that exists: the brain's selection when it
    /// applies, otherwise the catalog's default for this provider.
    private func resolveModel() {
        let info = state?.info(providerId)
        let available = info?.models ?? []
        if modelIsUserChosen, let selectedModel,
            available.isEmpty || available.contains(where: { $0.id == selectedModel })
        {
            return
        }
        if let configured = state?.model, state?.provider == providerId,
            available.contains(where: { $0.id == configured })
        {
            selectedModel = configured
            return
        }
        selectedModel = ProviderCatalog.defaultModel(
            for: providerId, available: available, brainDefault: info?.defaultModel)
    }

    // MARK: - Sign in

    /// Configures the brain for the selected provider and model, then runs its
    /// login flow if it needs one. A local server needs none — configuring it
    /// *is* signing in.
    func signIn() {
        guard let backend, canSignIn else { return }
        let card = self.card
        let providerId = self.providerId
        phase = .working(card.needsLogin ? "Contacting \(card.title)…" : "Checking the server…")
        notify()
        backend.configure(
            provider: providerId, model: selectedModel,
            baseURL: card.needsBaseURL ? trimmedBaseURL : nil
        ) { [weak self] result in
            guard let self else { return }
            if case .failure(let error) = result {
                self.fail(error)
                return
            }
            // No login flow needed: the provider takes no credential, or it
            // already holds one and only had to be selected.
            guard let method = card.method, !self.isSelectionSignedIn else {
                self.finishSignIn()
                return
            }
            let id = self.makeRequestId()
            self.activeLoginId = id
            backend.login(id: id, provider: providerId, method: method) { [weak self] result in
                self?.completeLogin(id: id, result: result)
            }
        }
    }

    /// Abandons an in-flight sign-in. The brain settles the login with
    /// "aborted", which `completeLogin` turns back into an idle card.
    func cancelSignIn() {
        guard let id = activeLoginId else {
            phase = .idle
            notify()
            return
        }
        if case .prompting(let prompt) = phase {
            backend?.answerPrompt(loginId: id, promptId: prompt.promptId, value: nil, cancel: true)
        } else {
            backend?.abort(id: id)
        }
        phase = .working("Cancelling…")
        notify()
    }

    private func completeLogin(id: String, result: Result<JSONValue?, any Error>) {
        guard id == activeLoginId else { return }
        activeLoginId = nil
        switch result {
        case .success:
            finishSignIn()
        case .failure(let error):
            // The user cancelled; that is not a failure to report back at them.
            if case .brain("aborted", _)? = error as? BrainClientError {
                phase = .idle
                notify()
                return
            }
            fail(error)
        }
    }

    /// Re-reads status so the success screen shows what the brain actually
    /// ended up configured for, rather than what the UI asked for.
    private func finishSignIn() {
        guard let backend else { return }
        backend.fetchStatus { [weak self] result in
            guard let self else { return }
            self.adoptOrLog(result)
            let summary = self.state?.accountSummary ?? self.card.title
            self.phase = .signedIn(summary)
            self.notify()
            self.onSignedIn?(summary)
        }
    }

    private func fail(_ error: any Error) {
        activeLoginId = nil
        phase = .failed(Self.describe(error))
        notify()
    }

    // MARK: - Sign out

    /// Drops the credential for the provider currently in use and re-reads
    /// status, so the UI shows the signed-out state rather than assuming it.
    func signOut() {
        guard let backend, let providerId = state?.provider else { return }
        phase = .working("Signing out…")
        notify()
        backend.logout(provider: providerId) { [weak self] result in
            guard let self else { return }
            if case .failure(let error) = result {
                self.fail(error)
                return
            }
            backend.fetchStatus { [weak self] result in
                guard let self else { return }
                self.adoptOrLog(result)
                self.phase = .idle
                self.notify()
            }
        }
    }

    // MARK: - Login events

    /// Intermediate events belonging to the login in flight. Anything for
    /// another request (a chat turn, an older login) is ignored.
    func apply(_ event: BrainEvent) {
        guard let loginId = activeLoginId, event.id == loginId else { return }
        switch event {
        case .authURL(_, let url):
            if let parsed = URL(string: url) { backend?.openAuthURL(parsed) }
            phase = .working("Finish signing in in your browser…")
            notify()
        case let .authPrompt(_, promptId, prompt, promptType, placeholder, options):
            phase = .prompting(
                PendingPrompt(
                    promptId: promptId, message: prompt, promptType: promptType,
                    placeholder: placeholder, options: options ?? []))
            notify()
        case .progress(_, let message, _):
            // Progress while a prompt is up means the flow moved on without it
            // — the OAuth callback beat the manual code. The prompt is dead;
            // showing a field nobody will read is worse than showing nothing.
            phase = .working(message)
            notify()
        default:
            break
        }
    }

    /// Answers the prompt on screen.
    func submitPrompt(_ value: String) {
        guard case .prompting(let prompt) = phase, let loginId = activeLoginId else { return }
        backend?.answerPrompt(
            loginId: loginId, promptId: prompt.promptId, value: value, cancel: false)
        phase = .working("Signing in…")
        notify()
    }

    // MARK: - Wording

    /// User-facing wording for a failed sign-in. Brain error codes are the
    /// contract; their raw messages are developer-facing.
    static func describe(_ error: any Error) -> String {
        guard let error = error as? BrainClientError else { return "\(error)" }
        guard case .brain(let code, let message) = error else {
            return ChatModel.describe(error)
        }
        switch code {
        case "auth_failed":
            return "Sign-in failed: \(message)"
        case "aborted":
            return "Sign-in was cancelled."
        case "invalid_request":
            return "Minne could not use those settings: \(message)"
        default:
            return message
        }
    }
}

/// `AuthBackend` over the real brain.
@MainActor
final class BrainAuthBackend: AuthBackend {
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

    func fetchStatus(completion: @escaping @MainActor (Result<JSONValue?, any Error>) -> Void) {
        send(.status(id: UUID().uuidString), completion: completion)
    }

    func configure(
        provider: String?, model: String?, baseURL: String?,
        completion: @escaping @MainActor (Result<JSONValue?, any Error>) -> Void
    ) {
        send(
            .configure(id: UUID().uuidString, provider: provider, model: model, baseUrl: baseURL),
            completion: completion)
    }

    func login(
        id: String, provider: String, method: String?,
        completion: @escaping @MainActor (Result<JSONValue?, any Error>) -> Void
    ) {
        send(.login(id: id, provider: provider, method: method), completion: completion)
    }

    func answerPrompt(loginId: String, promptId: String, value: String?, cancel: Bool) {
        Task {
            do {
                try await client.request(
                    .authReply(
                        id: UUID().uuidString, targetId: loginId, promptId: promptId,
                        value: cancel ? nil : value, cancel: cancel ? true : nil))
            } catch {
                // Expected when the flow already abandoned the prompt.
                BrainClient.log("auth reply not accepted: \(error)")
            }
        }
    }

    func abort(id: String) {
        Task {
            do {
                try await client.request(.abort(id: UUID().uuidString, targetId: id))
            } catch {
                BrainClient.log("login abort failed: \(error)")
            }
        }
    }

    func logout(
        provider: String?,
        completion: @escaping @MainActor (Result<JSONValue?, any Error>) -> Void
    ) {
        send(.logout(id: UUID().uuidString, provider: provider), completion: completion)
    }

    func openAuthURL(_ url: URL) {
        BrainClient.log("auth: opening \(url.absoluteString)")
        NSWorkspace.shared.open(url)
    }
}
