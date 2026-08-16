import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/** Persisted brain settings (config.json). No secrets — those live in auth.json. */
export interface MinneConfig {
  /** selected provider id */
  provider: string;
  /** selected model id; null means the provider's default */
  model: string | null;
  /** OpenAI-compatible local server (Ollama, vLLM, LM Studio, …) */
  ollama: {
    baseUrl: string;
    model: string;
  };
}

export const DEFAULT_CONFIG: MinneConfig = {
  provider: "anthropic",
  model: null,
  ollama: {
    baseUrl: "http://localhost:11434/v1",
    model: "llama3.1",
  },
};

/** Loads config.json, merging over defaults; missing or corrupt files yield defaults. */
export function loadConfig(path: string): MinneConfig {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return structuredClone(DEFAULT_CONFIG);
  }
  const config = structuredClone(DEFAULT_CONFIG);
  if (typeof parsed !== "object" || parsed === null) return config;
  const raw = parsed as Record<string, unknown>;
  if (typeof raw["provider"] === "string" && raw["provider"] !== "") {
    config.provider = raw["provider"];
  }
  if (typeof raw["model"] === "string" && raw["model"] !== "") {
    config.model = raw["model"];
  }
  const ollama = raw["ollama"];
  if (typeof ollama === "object" && ollama !== null) {
    const o = ollama as Record<string, unknown>;
    if (typeof o["baseUrl"] === "string" && o["baseUrl"] !== "") {
      config.ollama.baseUrl = o["baseUrl"];
    }
    if (typeof o["model"] === "string" && o["model"] !== "") {
      config.ollama.model = o["model"];
    }
  }
  return config;
}

export function saveConfig(path: string, config: MinneConfig): void {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, JSON.stringify(config, null, 2) + "\n");
  renameSync(tmp, path);
}
