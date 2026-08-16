import { createProvider, type Model, type OAuthAuth, type Provider } from "@earendil-works/pi-ai";
import { openAICompletionsApi } from "@earendil-works/pi-ai/api/openai-completions.lazy";

/**
 * Scripted OAuth provider for protocol tests: notify(auth_url) -> prompt for a
 * manual code -> notify(progress) -> credential. Registered only when
 * MINNE_MOCK_PROVIDER=1 (see providers.ts); never used against the network.
 */
export const MOCK_LOGIN_CODE = "424242";
export const MOCK_AUTH_URL = "https://example.invalid/authorize";

export function mockProvider(): Provider<"openai-completions"> {
  const model: Model<"openai-completions"> = {
    id: "mock-model",
    name: "Mock model",
    api: "openai-completions",
    provider: "mock",
    baseUrl: "http://localhost:1/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 8192,
    maxTokens: 4096,
  };

  const oauth: OAuthAuth = {
    name: "Mock provider (tests only)",
    isSubscription: true,
    async login(interaction) {
      interaction.signal.throwIfAborted();
      interaction.notify({ type: "info", message: "mock login starting" });
      interaction.notify({ type: "auth_url", url: MOCK_AUTH_URL });
      const code = await interaction.prompt({
        type: "manual_code",
        message: "Enter the mock code",
        placeholder: "000000",
      });
      interaction.signal.throwIfAborted();
      if (code !== MOCK_LOGIN_CODE) throw new Error("invalid code");
      interaction.notify({ type: "progress", message: "exchanging code" });
      return {
        type: "oauth",
        refresh: "mock-refresh",
        access: "mock-access",
        expires: Date.now() + 3_600_000,
      };
    },
    async refresh(credential) {
      return credential;
    },
    async toAuth(credential) {
      return { apiKey: credential.access };
    },
  };

  return createProvider({
    id: "mock",
    name: "Mock",
    baseUrl: "http://localhost:1/v1",
    auth: { oauth },
    models: [model],
    api: openAICompletionsApi(),
  });
}
