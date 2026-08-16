import {
  createModels,
  createProvider,
  type CredentialStore,
  type Model,
  type MutableModels,
  type Provider,
} from "@earendil-works/pi-ai";
import { openAICompletionsApi } from "@earendil-works/pi-ai/api/openai-completions.lazy";
import { registerBunOAuthFlows } from "@earendil-works/pi-ai/bun-oauth";
import { anthropicProvider } from "@earendil-works/pi-ai/providers/anthropic";
import { openaiProvider } from "@earendil-works/pi-ai/providers/openai";
import { openaiCodexProvider } from "@earendil-works/pi-ai/providers/openai-codex";
import type { MinneConfig } from "./config";
import { mockProvider } from "./mock-provider";
import type { LoginMethod } from "./protocol";

/** Static description of a registered provider, for status and login routing. */
export interface ProviderSpec {
  id: string;
  label: string;
  /** login methods the app may offer; empty = no login needed (keyless local) */
  methods: LoginMethod[];
  /** default model id; ollama's actual default comes from config at runtime */
  defaultModel: string;
}

export interface Registry {
  models: MutableModels;
  specs: ProviderSpec[];
}

/**
 * The OpenAI-compatible local provider (Ollama et al). Rebuilt via
 * `models.setProvider()` whenever the configured base URL or model changes.
 */
export function ollamaProviderFrom(config: MinneConfig): Provider<"openai-completions"> {
  const { baseUrl, model } = config.ollama;
  const localModel: Model<"openai-completions"> = {
    id: model,
    name: `${model} (local)`,
    api: "openai-completions",
    provider: "ollama",
    baseUrl,
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128_000,
    maxTokens: 32_000,
  };
  return createProvider({
    id: "ollama",
    name: "Ollama / OpenAI-compatible",
    baseUrl,
    // Keyless local servers still declare auth; resolving to {} means "configured".
    auth: { apiKey: { name: "Local server", resolve: async () => ({ auth: {} }) } },
    models: [localModel],
    api: openAICompletionsApi(),
  });
}

/**
 * Builds the pi Models collection with Minne's provider set. OAuth flow
 * implementations are registered statically so `bun build --compile` binaries
 * don't depend on pi's bundler-opaque dynamic imports.
 */
export function buildRegistry(config: MinneConfig, credentials: CredentialStore): Registry {
  registerBunOAuthFlows();
  const models = createModels({ credentials });
  models.setProvider(anthropicProvider());
  models.setProvider(openaiCodexProvider());
  models.setProvider(openaiProvider());
  models.setProvider(ollamaProviderFrom(config));

  const specs: ProviderSpec[] = [
    {
      id: "anthropic",
      label: "Anthropic (Claude Pro/Max or API key)",
      methods: ["oauth", "api_key"],
      defaultModel: "claude-sonnet-5",
    },
    {
      id: "openai-codex",
      label: "OpenAI (ChatGPT Plus/Pro)",
      methods: ["oauth"],
      defaultModel: "gpt-5.5",
    },
    {
      id: "openai",
      label: "OpenAI (API key)",
      methods: ["api_key"],
      defaultModel: "gpt-5.5",
    },
    {
      id: "ollama",
      label: "Local (Ollama / OpenAI-compatible)",
      methods: [],
      defaultModel: config.ollama.model,
    },
  ];

  if (process.env["MINNE_MOCK_PROVIDER"] === "1") {
    models.setProvider(mockProvider());
    specs.push({ id: "mock", label: "Mock (tests)", methods: ["oauth"], defaultModel: "mock-model" });
  }

  return { models, specs };
}
