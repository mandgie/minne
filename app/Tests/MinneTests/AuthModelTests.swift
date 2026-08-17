import XCTest

@testable import Minne

/// Scripted `AuthBackend`: records everything the model asked the brain for and
/// lets the test settle the login whenever it likes. No brain, no browser, no
/// display — which is what makes the whole sign-in flow testable.
@MainActor
private final class FakeAuthBackend: AuthBackend {
    struct Configure: Equatable {
        let provider: String?
        let model: String?
        let baseURL: String?
    }
    struct Login: Equatable {
        let id: String
        let provider: String
        let method: String?
    }
    struct Reply: Equatable {
        let loginId: String
        let promptId: String
        let value: String?
        let cancel: Bool
    }

    /// What `status` answers with. Settled synchronously.
    var statusPayload: JSONValue?
    var configureResult: Result<JSONValue?, any Error> = .success(nil)
    var logoutResult: Result<JSONValue?, any Error> = .success(nil)

    private(set) var statusCalls = 0
    private(set) var configures: [Configure] = []
    private(set) var logins: [Login] = []
    private(set) var replies: [Reply] = []
    private(set) var aborts: [String] = []
    private(set) var logouts: [String?] = []
    private(set) var openedURLs: [URL] = []

    private var loginCompletions: [String: (Result<JSONValue?, any Error>) -> Void] = [:]

    func fetchStatus(completion: @escaping @MainActor (Result<JSONValue?, any Error>) -> Void) {
        statusCalls += 1
        completion(.success(statusPayload))
    }

    func configure(
        provider: String?, model: String?, baseURL: String?,
        completion: @escaping @MainActor (Result<JSONValue?, any Error>) -> Void
    ) {
        configures.append(Configure(provider: provider, model: model, baseURL: baseURL))
        completion(configureResult)
    }

    func login(
        id: String, provider: String, method: String?,
        completion: @escaping @MainActor (Result<JSONValue?, any Error>) -> Void
    ) {
        logins.append(Login(id: id, provider: provider, method: method))
        loginCompletions[id] = completion
    }

    func answerPrompt(loginId: String, promptId: String, value: String?, cancel: Bool) {
        replies.append(Reply(loginId: loginId, promptId: promptId, value: value, cancel: cancel))
    }

    func abort(id: String) {
        aborts.append(id)
    }

    func logout(
        provider: String?,
        completion: @escaping @MainActor (Result<JSONValue?, any Error>) -> Void
    ) {
        logouts.append(provider)
        completion(logoutResult)
    }

    func openAuthURL(_ url: URL) {
        openedURLs.append(url)
    }

    func finishLogin(_ id: String) {
        loginCompletions.removeValue(forKey: id)?(.success(nil))
    }

    func failLogin(_ id: String, code: String, message: String = "nope") {
        loginCompletions.removeValue(forKey: id)?(
            .failure(BrainClientError.brain(code: code, message: message)))
    }
}

@MainActor
final class AuthModelTests: XCTestCase {
    private var backend = FakeAuthBackend()
    private var model = AuthModel()
    private var issued = 0

    override func setUp() async throws {
        backend = FakeAuthBackend()
        model = AuthModel()
        model.backend = backend
        issued = 0
        model.makeRequestId = { [self] in
            issued += 1
            return "login\(issued)"
        }
        backend.statusPayload = try AuthStateTests.statusJSON()
    }

    private func signedInStatus(provider: String, model modelId: String?, authType: String) throws {
        backend.statusPayload = try AuthStateTests.statusJSON(
            provider: provider, model: modelId, anthropicAuth: authType)
    }

    // MARK: - Adopting the brain's state

    func testRefreshSelectsTheConfiguredProviderAndItsModel() {
        model.refresh()
        XCTAssertEqual(model.selection, .claude)
        XCTAssertEqual(model.providerId, "anthropic")
        XCTAssertEqual(model.selectedModel, "claude-sonnet-5")
        XCTAssertEqual(model.models.map(\.id), ["claude-opus-5", "claude-sonnet-5"])
        XCTAssertFalse(model.isSelectionSignedIn)
        XCTAssertEqual(
            model.accountSummary, "Anthropic (Claude Pro/Max or API key) — not signed in")
    }

    func testAnApiKeyCredentialLandsOnTheApiKeyCardNotTheSubscriptionCard() throws {
        try signedInStatus(provider: "anthropic", model: nil, authType: "api_key")
        model.refresh()
        XCTAssertEqual(model.selection, .apiKey)
        XCTAssertEqual(model.apiKeyProvider, "anthropic")
        XCTAssertTrue(model.isSignedIn)
    }

    func testTheLocalServersConfiguredAddressFillsTheField() {
        model.refresh()
        XCTAssertEqual(model.baseURL, "http://localhost:11434/v1")
        model.setBaseURL("http://192.168.1.9:11434/v1")
        model.refresh()
        XCTAssertEqual(
            model.baseURL, "http://192.168.1.9:11434/v1",
            "a refresh must not overwrite what the user is typing")
    }

    func testPickingACardKeepsItAgainstLaterStatusUpdates() {
        model.refresh()
        model.select(.chatgpt)
        XCTAssertEqual(model.providerId, "openai-codex")
        XCTAssertEqual(model.selectedModel, "gpt-5.5", "the new provider gets its own default")
        model.refresh()
        XCTAssertEqual(
            model.selection, .chatgpt, "status still says anthropic; the user said otherwise")
    }

    func testTheApiKeyCardCanBePointedAtEitherProvider() {
        model.refresh()
        model.select(.apiKey)
        XCTAssertEqual(model.providerId, "anthropic")
        model.selectAPIKeyProvider("openai")
        XCTAssertEqual(model.providerId, "openai")
        XCTAssertEqual(model.selectedModel, "gpt-5.5")
    }

    // MARK: - OAuth sign-in

    func testOAuthSignInDrivesConfigureLoginPromptAndAdvances() throws {
        model.refresh()
        var advanced: [String] = []
        model.onSignedIn = { advanced.append($0) }

        model.signIn()
        // Selection is persisted before the login, so a login that succeeds
        // never leaves the brain pointed at the previous provider.
        XCTAssertEqual(
            backend.configures,
            [.init(provider: "anthropic", model: "claude-sonnet-5", baseURL: nil)])
        XCTAssertEqual(
            backend.logins, [.init(id: "login1", provider: "anthropic", method: "oauth")])
        XCTAssertEqual(model.phase, .working("Contacting Claude (Pro/Max)…"))

        model.apply(.authURL(id: "login1", url: "https://claude.ai/oauth/authorize?x=1"))
        XCTAssertEqual(
            backend.openedURLs.map(\.absoluteString), ["https://claude.ai/oauth/authorize?x=1"])
        XCTAssertEqual(model.phase, .working("Finish signing in in your browser…"))

        model.apply(
            .authPrompt(
                id: "login1", promptId: "login1:1", prompt: "Paste the code",
                promptType: "manual_code", placeholder: "000000", options: nil))
        guard case .prompting(let prompt) = model.phase else {
            return XCTFail("expected the code prompt to be on screen, got \(model.phase)")
        }
        XCTAssertEqual(prompt.message, "Paste the code")
        XCTAssertEqual(prompt.placeholder, "000000")
        XCTAssertFalse(prompt.isSecret)

        model.submitPrompt("424242")
        XCTAssertEqual(
            backend.replies,
            [.init(loginId: "login1", promptId: "login1:1", value: "424242", cancel: false)])

        try signedInStatus(provider: "anthropic", model: "claude-sonnet-5", authType: "oauth")
        backend.finishLogin("login1")
        XCTAssertEqual(
            model.phase, .signedIn("Anthropic (Claude Pro/Max or API key) — Claude Sonnet 5"))
        XCTAssertEqual(
            advanced, ["Anthropic (Claude Pro/Max or API key) — Claude Sonnet 5"],
            "a successful sign-in advances onboarding")
        XCTAssertTrue(model.isSignedIn)
    }

    /// The Anthropic flow races a localhost callback against the manual code.
    /// When the callback wins, the prompt is cancelled out from under the UI
    /// and the flow just carries on — a field nobody will read must not sit
    /// there inviting input.
    func testAPromptGoesAwayWhenTheFlowMovesOnWithoutIt() {
        model.refresh()
        model.signIn()
        model.apply(
            .authPrompt(
                id: "login1", promptId: "login1:1", prompt: "Paste the code",
                promptType: "manual_code", placeholder: nil, options: nil))
        model.apply(.progress(id: "login1", message: "exchanging code", fraction: nil))
        XCTAssertEqual(model.phase, .working("exchanging code"))
        model.submitPrompt("424242")
        XCTAssertTrue(backend.replies.isEmpty, "there is nothing left to answer")
    }

    func testASecretPromptIsMarkedSecret() {
        model.refresh()
        model.select(.apiKey)
        model.signIn()
        XCTAssertEqual(backend.logins.map(\.method), ["api_key"])
        model.apply(
            .authPrompt(
                id: "login1", promptId: "login1:1", prompt: "Paste your API key",
                promptType: "secret", placeholder: "sk-ant-…", options: nil))
        guard case .prompting(let prompt) = model.phase else {
            return XCTFail("expected the key prompt, got \(model.phase)")
        }
        XCTAssertTrue(prompt.isSecret)
    }

    func testASelectPromptCarriesItsOptions() {
        model.refresh()
        model.signIn()
        model.apply(
            .authPrompt(
                id: "login1", promptId: "login1:1", prompt: "How do you pay?",
                promptType: "select", placeholder: nil,
                options: [
                    AuthPromptOption(id: "max", label: "Claude Pro/Max", description: nil),
                    AuthPromptOption(
                        id: "console", label: "API console", description: "pay per token"),
                ]))
        guard case .prompting(let prompt) = model.phase else {
            return XCTFail("expected the select prompt, got \(model.phase)")
        }
        XCTAssertEqual(prompt.options.map(\.id), ["max", "console"])
    }

    func testEventsForAnotherRequestAreIgnored() {
        model.refresh()
        model.signIn()
        model.apply(.authURL(id: "some-chat-turn", url: "https://example.invalid/"))
        model.apply(
            .authPrompt(
                id: "some-chat-turn", promptId: "x:1", prompt: "no", promptType: "text",
                placeholder: nil, options: nil))
        XCTAssertTrue(backend.openedURLs.isEmpty)
        XCTAssertEqual(model.phase, .working("Contacting Claude (Pro/Max)…"))
    }

    func testAFailedLoginShowsWhyAndLeavesTheCardUsable() {
        model.refresh()
        model.signIn()
        backend.failLogin("login1", code: "auth_failed", message: "invalid code")
        XCTAssertEqual(model.phase, .failed("Sign-in failed: invalid code"))
        XCTAssertTrue(model.canSignIn, "the user can try again")
    }

    func testCancellingAPromptCancelsTheLoginAndReturnsToIdle() {
        model.refresh()
        model.signIn()
        model.apply(
            .authPrompt(
                id: "login1", promptId: "login1:1", prompt: "Paste the code",
                promptType: "manual_code", placeholder: nil, options: nil))
        model.cancelSignIn()
        XCTAssertEqual(
            backend.replies,
            [.init(loginId: "login1", promptId: "login1:1", value: nil, cancel: true)])
        backend.failLogin("login1", code: "aborted", message: "cancelled by user")
        XCTAssertEqual(model.phase, .idle, "the user's own cancel is not an error to show them")
    }

    func testCancellingBeforeAPromptAbortsTheRequest() {
        model.refresh()
        model.signIn()
        model.cancelSignIn()
        XCTAssertEqual(backend.aborts, ["login1"])
    }

    func testASelectionTheBrainRejectsNeverStartsALogin() {
        model.refresh()
        backend.configureResult = .failure(
            BrainClientError.brain(code: "invalid_request", message: "invalid baseUrl"))
        model.signIn()
        XCTAssertTrue(backend.logins.isEmpty)
        XCTAssertEqual(model.phase, .failed("Minne could not use those settings: invalid baseUrl"))
    }

    // MARK: - Local server

    /// The line beside a card is about *that card*, not about the account the
    /// app is using — the menu bar's Account row answers the other question.
    func testTheStatusLineDescribesTheSelectedCard() throws {
        try signedInStatus(provider: "anthropic", model: nil, authType: "oauth")
        model.refresh()
        XCTAssertEqual(model.statusLine, "In use — signed in")
        XCTAssertEqual(model.signInTitle, "Use This Account")

        model.select(.chatgpt)
        XCTAssertEqual(model.statusLine, "Not signed in")
        XCTAssertEqual(model.signInTitle, "Sign In")

        // The local server is always reachable-in-principle, but saying
        // "signed in" about a keyless server on this Mac would be nonsense.
        model.select(.local)
        XCTAssertEqual(model.statusLine, "Ready — not in use")
        XCTAssertEqual(model.signInTitle, "Use This Server")
    }

    func testAProviderThatAlreadyHasACredentialIsSwitchedToWithoutANewLogin() throws {
        try signedInStatus(provider: "ollama", model: nil, authType: "oauth")
        model.refresh()
        XCTAssertEqual(model.selection, .local)
        model.select(.claude)
        XCTAssertEqual(model.statusLine, "Signed in — not in use")
        model.signIn()
        XCTAssertEqual(backend.configures.map(\.provider), ["anthropic"])
        XCTAssertTrue(backend.logins.isEmpty, "the credential is already stored")
        guard case .signedIn = model.phase else {
            return XCTFail("switching to a stored account is a completed sign-in")
        }
    }

    func testTheLocalServerIsConfiguredRatherThanSignedInTo() {
        model.refresh()
        model.select(.local)
        XCTAssertEqual(model.signInTitle, "Use This Server")
        model.setBaseURL("http://localhost:1234/v1")
        model.signIn()
        XCTAssertEqual(
            backend.configures.last,
            .init(provider: "ollama", model: "llama3.1", baseURL: "http://localhost:1234/v1"))
        XCTAssertTrue(backend.logins.isEmpty, "a local server has no login flow")
        guard case .signedIn = model.phase else {
            return XCTFail("configuring the server is what signing in means here")
        }
    }

    func testAnAddressThatIsNotAUrlBlocksTheButton() {
        model.refresh()
        model.select(.local)
        // "localhost:11434" parses as a URL whose scheme is "localhost", which
        // is why the check is stricter than URL(string:).
        for bad in ["", "localhost:11434", "not a url", "ftp://localhost/", "http://"] {
            model.setBaseURL(bad)
            XCTAssertFalse(model.canSignIn, "\"\(bad)\" is not a server address")
        }
        model.setBaseURL("http://localhost:11434/v1")
        XCTAssertTrue(model.canSignIn)
        model.setBaseURL("https://box.local:11434/v1")
        XCTAssertTrue(model.canSignIn)
    }

    // MARK: - Model picker

    func testChangingTheModelOfTheProviderInUseTakesEffectImmediately() throws {
        try signedInStatus(provider: "anthropic", model: nil, authType: "oauth")
        model.refresh()
        model.selectModel("claude-opus-5")
        XCTAssertEqual(
            backend.configures,
            [.init(provider: "anthropic", model: "claude-opus-5", baseURL: nil)])
    }

    func testChangingTheModelOfAProviderNotInUseWaitsForSignIn() {
        model.refresh()
        model.select(.chatgpt)
        model.selectModel("gpt-5.5")
        XCTAssertTrue(backend.configures.isEmpty, "nothing to apply until that provider is chosen")
        model.signIn()
        XCTAssertEqual(
            backend.configures,
            [.init(provider: "openai-codex", model: "gpt-5.5", baseURL: nil)])
    }

    // MARK: - Sign out

    func testSignOutClearsTheCredentialAndTheStateFollows() throws {
        try signedInStatus(provider: "anthropic", model: nil, authType: "oauth")
        model.refresh()
        XCTAssertTrue(model.isSignedIn)

        backend.statusPayload = try AuthStateTests.statusJSON()
        model.signOut()
        XCTAssertEqual(backend.logouts, ["anthropic"], "sign out acts on the provider in use")
        XCTAssertEqual(model.phase, .idle)
        XCTAssertFalse(model.isSignedIn)
        XCTAssertEqual(
            model.accountSummary, "Anthropic (Claude Pro/Max or API key) — not signed in")
    }

    func testObserversSeeEveryChange() {
        var renders = 0
        let owner = NSObject()
        model.observe(owner) { _ in renders += 1 }
        XCTAssertEqual(renders, 1, "observing renders once immediately")
        model.refresh()
        model.select(.local)
        XCTAssertEqual(renders, 3)
    }

    func testObserversStopWhenTheirOwnerGoesAway() {
        var renders = 0
        do {
            let owner = NSObject()
            model.observe(owner) { _ in renders += 1 }
            model.refresh()
            XCTAssertEqual(renders, 2)
            _ = owner
        }
        model.select(.local)
        XCTAssertEqual(renders, 2, "a closed window must not be rendered into")
    }
}
