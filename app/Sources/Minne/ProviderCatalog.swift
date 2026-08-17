import Foundation

/// One model a provider offers, as the brain's `status` reports it.
struct ModelOption: Equatable, Sendable, Identifiable {
    let id: String
    let name: String
}

/// Auth and catalog state of one registered provider, parsed from `status`.
struct ProviderAuthInfo: Equatable, Sendable, Identifiable {
    /// pi provider id: "anthropic", "openai-codex", "openai", "ollama", "mock".
    let id: String
    let label: String
    /// Login methods the provider accepts; empty means none is needed.
    let methods: [String]
    let isAuthenticated: Bool
    /// Where the credential came from ("credentials", an env var name, …).
    let source: String?
    /// "oauth" or "api_key" once signed in.
    let authType: String?
    let defaultModel: String?
    /// Only the local server has one.
    let baseURL: String?
    let models: [ModelOption]
}

/// The brain's account state: which provider and model are selected, and what
/// every registered provider's auth looks like. Parsed from a `status` result,
/// so the app never keeps a second copy of the truth.
struct AuthState: Equatable, Sendable {
    let provider: String
    let model: String?
    let providers: [ProviderAuthInfo]
    /// The brain's sync picture, which rides along on the same `status` answer
    /// (US-012). Settings' Memory section renders it; nil when the brain is old
    /// enough not to report it.
    let sync: SyncStatusInfo?

    init(
        provider: String, model: String?, providers: [ProviderAuthInfo],
        sync: SyncStatusInfo? = nil
    ) {
        self.provider = provider
        self.model = model
        self.providers = providers
        self.sync = sync
    }

    func info(_ providerId: String) -> ProviderAuthInfo? {
        providers.first { $0.id == providerId }
    }

    /// The selected provider, if the brain still registers it.
    var current: ProviderAuthInfo? { info(provider) }

    var isSignedIn: Bool { current?.isAuthenticated ?? false }

    /// One line for the menu bar and Settings: who Minne talks to, and on what.
    var accountSummary: String {
        guard let current else { return "Not signed in" }
        guard current.isAuthenticated else { return "\(current.label) — not signed in" }
        let modelId = model ?? current.defaultModel
        let modelName = modelId.flatMap { id in
            current.models.first { $0.id == id }?.name
        }
        guard let label = modelName ?? modelId else { return current.label }
        return "\(current.label) — \(label)"
    }

    /// Reads a `status` result. Returns nil when the payload is not a status
    /// answer at all; a provider entry missing required fields is skipped
    /// rather than failing the whole parse.
    static func parse(_ value: JSONValue?) -> AuthState? {
        guard let object = value?.objectValue,
            let provider = object["provider"]?.stringValue,
            let rawProviders = object["providers"]?.arrayValue
        else { return nil }

        let providers = rawProviders.compactMap { entry -> ProviderAuthInfo? in
            guard let fields = entry.objectValue,
                let id = fields["id"]?.stringValue
            else { return nil }
            let models = (fields["models"]?.arrayValue ?? []).compactMap {
                model -> ModelOption? in
                guard let fields = model.objectValue, let id = fields["id"]?.stringValue
                else { return nil }
                return ModelOption(id: id, name: fields["name"]?.stringValue ?? id)
            }
            return ProviderAuthInfo(
                id: id,
                label: fields["label"]?.stringValue ?? id,
                methods: (fields["methods"]?.arrayValue ?? []).compactMap(\.stringValue),
                isAuthenticated: fields["authenticated"]?.boolValue ?? false,
                source: fields["source"]?.stringValue,
                authType: fields["authType"]?.stringValue,
                defaultModel: fields["defaultModel"]?.stringValue,
                baseURL: fields["baseUrl"]?.stringValue,
                models: models)
        }
        return AuthState(
            provider: provider, model: object["model"]?.stringValue, providers: providers,
            sync: SyncStatusInfo.parse(object["sync"]))
    }
}

/// The four ways into Minne, as the onboarding step lists them.
enum ProviderChoice: String, CaseIterable, Sendable {
    case claude
    case chatgpt
    case local
    case apiKey
    /// Only offered when the brain runs its scripted provider.
    case mock
}

/// One row of the provider step. `providerIds` is what the card maps onto in
/// the brain's registry — more than one means the card carries its own picker
/// (the API-key card serves both Anthropic and OpenAI).
struct ProviderCard: Equatable, Sendable {
    let choice: ProviderChoice
    let title: String
    let subtitle: String
    let providerIds: [String]
    /// "oauth", "api_key", or nil when the provider needs no credential.
    let method: String?
    /// The local server asks for the address of the server to talk to.
    let needsBaseURL: Bool

    var needsLogin: Bool { method != nil }
}

/// Static knowledge about providers: the cards onboarding shows, and which
/// model each provider should land on. Pure; `AuthModel` drives the brain.
enum ProviderCatalog {
    /// The cards the step offers. With `MINNE_MOCK_PROVIDER=1` set — the same
    /// flag brain/src/providers.ts registers its scripted OAuth provider under
    /// — a fifth card appears, which is how the whole flow is driven with no
    /// network and no real account.
    static let cards: [ProviderCard] = {
        guard ProcessInfo.processInfo.environment["MINNE_MOCK_PROVIDER"] == "1" else {
            return realCards
        }
        return realCards + [
            ProviderCard(
                choice: .mock,
                title: "Mock provider (tests)",
                subtitle:
                    "Scripted sign-in with no network. Present because MINNE_MOCK_PROVIDER=1.",
                providerIds: ["mock"],
                method: "oauth",
                needsBaseURL: false)
        ]
    }()

    private static let realCards: [ProviderCard] = [
        ProviderCard(
            choice: .claude,
            title: "Claude (Pro/Max)",
            subtitle: "Sign in with your Claude subscription. Nothing extra to pay for.",
            providerIds: ["anthropic"],
            method: "oauth",
            needsBaseURL: false),
        ProviderCard(
            choice: .chatgpt,
            title: "ChatGPT (Plus/Pro)",
            subtitle: "Sign in with your ChatGPT subscription.",
            providerIds: ["openai-codex"],
            method: "oauth",
            needsBaseURL: false),
        ProviderCard(
            choice: .local,
            title: "Local (Ollama)",
            subtitle: "Talk to a model on this Mac. Nothing leaves the machine.",
            providerIds: ["ollama"],
            method: nil,
            needsBaseURL: true),
        ProviderCard(
            choice: .apiKey,
            title: "API key",
            subtitle: "Pay per token with a key from Anthropic or OpenAI.",
            providerIds: ["anthropic", "openai"],
            method: "api_key",
            needsBaseURL: false),
    ]

    static func card(for choice: ProviderChoice) -> ProviderCard {
        // The mock card is absent unless the flag is set; falling back to the
        // first real card keeps the accessor non-optional.
        cards.first { $0.choice == choice } ?? cards[0]
    }

    /// Which card represents a provider the brain is configured for. Anthropic
    /// serves two cards, so the stored credential's type decides: an API key
    /// belongs on the API-key card, an OAuth token on the Claude card.
    static func choice(forProvider providerId: String, authType: String?) -> ProviderChoice? {
        if providerId == "anthropic" {
            return authType == "api_key" ? .apiKey : .claude
        }
        return cards.first { $0.providerIds.contains(providerId) }?.choice
    }

    /// Preference order per provider, most wanted first. Chat and the sync pass
    /// share one model, so the default is a mid-tier (Sonnet-class) model: fast
    /// and cheap enough to run every 30 minutes, strong enough to answer with.
    private static let preferredModels: [String: [String]] = [
        "anthropic": ["claude-sonnet-5", "claude-sonnet-4-6", "claude-sonnet-4-5"],
        "openai-codex": ["gpt-5.5", "gpt-5.4"],
        "openai": ["gpt-5.5", "gpt-5.4", "gpt-5.1"],
    ]

    /// The model a provider should start on: what the brain already defaults to
    /// when that model still exists, then this table, then whatever is offered.
    /// Nil only when the provider offers no models at all (a local server whose
    /// catalog we do not know yet).
    static func defaultModel(
        for providerId: String, available: [ModelOption], brainDefault: String?
    ) -> String? {
        let ids = Set(available.map(\.id))
        if let brainDefault, ids.contains(brainDefault) { return brainDefault }
        for candidate in preferredModels[providerId] ?? [] where ids.contains(candidate) {
            return candidate
        }
        return available.first?.id ?? brainDefault
    }
}
