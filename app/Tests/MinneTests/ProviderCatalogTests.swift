import XCTest

@testable import Minne

final class ProviderCatalogTests: XCTestCase {
    // MARK: - Cards

    /// `prefix`, not the whole list: MINNE_MOCK_PROVIDER=1 appends a scripted
    /// card for verification runs, exactly as the brain appends its provider.
    func testTheStepListsTheFourWaysIn() {
        XCTAssertEqual(
            Array(ProviderCatalog.cards.prefix(4).map(\.choice)),
            [.claude, .chatgpt, .local, .apiKey])
        XCTAssertEqual(
            Array(ProviderCatalog.cards.prefix(4).map(\.title)),
            ["Claude (Pro/Max)", "ChatGPT (Plus/Pro)", "Local (Ollama)", "API key"])
    }

    /// The cards are only useful if they name providers the brain registers —
    /// brain/src/providers.ts owns these ids, and auth.test.ts pins them.
    func testCardsMapOntoRealProviderIdsAndLoginMethods() {
        let claude = ProviderCatalog.card(for: .claude)
        XCTAssertEqual(claude.providerIds, ["anthropic"])
        XCTAssertEqual(claude.method, "oauth")

        let chatgpt = ProviderCatalog.card(for: .chatgpt)
        XCTAssertEqual(chatgpt.providerIds, ["openai-codex"])
        XCTAssertEqual(chatgpt.method, "oauth")

        let local = ProviderCatalog.card(for: .local)
        XCTAssertEqual(local.providerIds, ["ollama"])
        XCTAssertNil(local.method, "a local server needs no credential")
        XCTAssertFalse(local.needsLogin)
        XCTAssertTrue(local.needsBaseURL)

        let apiKey = ProviderCatalog.card(for: .apiKey)
        XCTAssertEqual(apiKey.providerIds, ["anthropic", "openai"])
        XCTAssertEqual(apiKey.method, "api_key")
        XCTAssertFalse(apiKey.needsBaseURL)
    }

    func testProviderMapsBackToItsCard() {
        // Anthropic serves two cards; the credential's type decides which.
        XCTAssertEqual(ProviderCatalog.choice(forProvider: "anthropic", authType: "oauth"), .claude)
        XCTAssertEqual(
            ProviderCatalog.choice(forProvider: "anthropic", authType: "api_key"), .apiKey)
        XCTAssertEqual(
            ProviderCatalog.choice(forProvider: "anthropic", authType: nil), .claude,
            "not signed in yet: the subscription card is the one we offer first")
        XCTAssertEqual(
            ProviderCatalog.choice(forProvider: "openai-codex", authType: "oauth"), .chatgpt)
        XCTAssertEqual(ProviderCatalog.choice(forProvider: "openai", authType: "api_key"), .apiKey)
        XCTAssertEqual(ProviderCatalog.choice(forProvider: "ollama", authType: nil), .local)
        XCTAssertNil(ProviderCatalog.choice(forProvider: "bedrock", authType: nil))
    }

    // MARK: - Model defaults

    private let anthropicModels = [
        ModelOption(id: "claude-opus-5", name: "Claude Opus 5"),
        ModelOption(id: "claude-haiku-4-5", name: "Claude Haiku 4.5"),
        ModelOption(id: "claude-sonnet-5", name: "Claude Sonnet 5"),
    ]

    func testTheBrainsOwnDefaultWins() {
        XCTAssertEqual(
            ProviderCatalog.defaultModel(
                for: "anthropic", available: anthropicModels, brainDefault: "claude-opus-5"),
            "claude-opus-5")
    }

    /// Chat and the 30-minute sync pass share one model, so a provider the
    /// brain has no opinion about still lands on a Sonnet-class default rather
    /// than whatever happens to sort first (Opus, here).
    func testFallsBackToASonnetClassDefault() {
        XCTAssertEqual(
            ProviderCatalog.defaultModel(
                for: "anthropic", available: anthropicModels, brainDefault: nil),
            "claude-sonnet-5")
        XCTAssertEqual(
            ProviderCatalog.defaultModel(
                for: "anthropic", available: anthropicModels, brainDefault: "claude-sonnet-9"),
            "claude-sonnet-5",
            "a default the provider no longer offers is not a default")
        XCTAssertEqual(
            ProviderCatalog.defaultModel(
                for: "openai-codex",
                available: [
                    ModelOption(id: "gpt-5.4", name: "GPT-5.4"),
                    ModelOption(id: "gpt-5.5", name: "GPT-5.5"),
                ], brainDefault: nil),
            "gpt-5.5")
    }

    func testUnknownProviderTakesWhateverItOffers() {
        XCTAssertEqual(
            ProviderCatalog.defaultModel(
                for: "ollama", available: [ModelOption(id: "llama3.1", name: "llama3.1 (local)")],
                brainDefault: nil),
            "llama3.1")
        XCTAssertEqual(
            ProviderCatalog.defaultModel(for: "ollama", available: [], brainDefault: "qwen3"),
            "qwen3", "an empty catalog is not a reason to forget what is configured")
        XCTAssertNil(ProviderCatalog.defaultModel(for: "ollama", available: [], brainDefault: nil))
    }
}

final class AuthStateTests: XCTestCase {
    /// Shaped exactly like brain/src/service.ts `handleStatus`.
    static func statusJSON(
        provider: String = "anthropic", model: String? = nil, anthropicAuth: String? = nil
    ) throws -> JSONValue {
        let modelLine = model.map { "\"model\": \"\($0)\"," } ?? "\"model\": null,"
        let auth =
            anthropicAuth.map { "\"authenticated\": true, \"authType\": \"\($0)\"" }
            ?? "\"authenticated\": false, \"authType\": null"
        let json = """
            {
              "state": "idle",
              "provider": "\(provider)",
              \(modelLine)
              "providers": [
                {
                  "id": "anthropic", "label": "Anthropic (Claude Pro/Max or API key)",
                  "methods": ["oauth", "api_key"], \(auth), "source": "credentials",
                  "defaultModel": "claude-sonnet-5",
                  "models": [
                    {"id": "claude-opus-5", "name": "Claude Opus 5"},
                    {"id": "claude-sonnet-5", "name": "Claude Sonnet 5"}
                  ]
                },
                {
                  "id": "openai-codex", "label": "OpenAI (ChatGPT Plus/Pro)",
                  "methods": ["oauth"], "authenticated": false, "authType": null,
                  "source": null, "defaultModel": "gpt-5.5",
                  "models": [{"id": "gpt-5.5", "name": "GPT-5.5"}]
                },
                {
                  "id": "openai", "label": "OpenAI (API key)", "methods": ["api_key"],
                  "authenticated": false, "authType": null, "source": null,
                  "defaultModel": "gpt-5.5",
                  "models": [{"id": "gpt-5.5", "name": "GPT-5.5"}]
                },
                {
                  "id": "ollama", "label": "Local (Ollama / OpenAI-compatible)",
                  "methods": [], "authenticated": true, "authType": "api_key",
                  "source": "local", "defaultModel": "llama3.1",
                  "baseUrl": "http://localhost:11434/v1",
                  "models": [{"id": "llama3.1", "name": "llama3.1 (local)"}]
                }
              ],
              "sync": {"watermark": 0}
            }
            """
        return try JSONDecoder().decode(JSONValue.self, from: Data(json.utf8))
    }

    func testParsesEveryProvidersAuthAndCatalog() throws {
        let state = try XCTUnwrap(AuthState.parse(Self.statusJSON(anthropicAuth: "oauth")))
        XCTAssertEqual(state.provider, "anthropic")
        XCTAssertNil(state.model, "null model means the provider's default")
        XCTAssertEqual(
            state.providers.map(\.id), ["anthropic", "openai-codex", "openai", "ollama"])

        let anthropic = try XCTUnwrap(state.info("anthropic"))
        XCTAssertEqual(anthropic.methods, ["oauth", "api_key"])
        XCTAssertTrue(anthropic.isAuthenticated)
        XCTAssertEqual(anthropic.authType, "oauth")
        XCTAssertEqual(anthropic.defaultModel, "claude-sonnet-5")
        XCTAssertEqual(anthropic.models.map(\.id), ["claude-opus-5", "claude-sonnet-5"])
        XCTAssertNil(anthropic.baseURL)

        let ollama = try XCTUnwrap(state.info("ollama"))
        XCTAssertEqual(ollama.baseURL, "http://localhost:11434/v1")
        XCTAssertTrue(ollama.methods.isEmpty)
        XCTAssertTrue(ollama.isAuthenticated, "a keyless local server is always configured")
    }

    func testAccountSummaryNamesTheProviderAndModel() throws {
        let signedIn = try XCTUnwrap(
            AuthState.parse(Self.statusJSON(model: "claude-opus-5", anthropicAuth: "oauth")))
        XCTAssertTrue(signedIn.isSignedIn)
        XCTAssertEqual(
            signedIn.accountSummary, "Anthropic (Claude Pro/Max or API key) — Claude Opus 5")

        // No explicit model: the provider's default is what will be used.
        let defaulted = try XCTUnwrap(AuthState.parse(Self.statusJSON(anthropicAuth: "oauth")))
        XCTAssertEqual(
            defaulted.accountSummary, "Anthropic (Claude Pro/Max or API key) — Claude Sonnet 5")

        let signedOut = try XCTUnwrap(AuthState.parse(Self.statusJSON()))
        XCTAssertFalse(signedOut.isSignedIn)
        XCTAssertEqual(
            signedOut.accountSummary, "Anthropic (Claude Pro/Max or API key) — not signed in")
    }

    func testNonStatusPayloadsParseToNothing() throws {
        XCTAssertNil(AuthState.parse(nil))
        XCTAssertNil(AuthState.parse(.object(["provider": .string("anthropic")])))
        XCTAssertNil(AuthState.parse(.string("nope")))
    }

    func testAProviderEntryMissingItsIdIsSkippedRatherThanFailingTheParse() throws {
        let json = """
            {"provider": "anthropic", "model": null,
             "providers": [{"label": "broken"}, {"id": "ollama"}]}
            """
        let state = try XCTUnwrap(
            AuthState.parse(try JSONDecoder().decode(JSONValue.self, from: Data(json.utf8))))
        XCTAssertEqual(state.providers.map(\.id), ["ollama"])
        XCTAssertEqual(state.info("ollama")?.label, "ollama", "no label falls back to the id")
        XCTAssertEqual(state.accountSummary, "Not signed in", "the selected provider is gone")
    }
}
