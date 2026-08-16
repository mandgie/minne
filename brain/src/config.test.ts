import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DEFAULT_CONFIG, loadConfig, saveConfig } from "./config";

let dirs: string[] = [];
function tempPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "minne-config-"));
  dirs.push(dir);
  return join(dir, "config.json");
}

afterEach(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
  dirs = [];
});

describe("config", () => {
  test("missing file yields defaults", () => {
    expect(loadConfig(tempPath())).toEqual(DEFAULT_CONFIG);
  });

  test("save/load round-trips", () => {
    const path = tempPath();
    const config = {
      provider: "ollama",
      model: "qwen3",
      ollama: { baseUrl: "http://localhost:9999/v1", model: "qwen3" },
    };
    saveConfig(path, config);
    expect(loadConfig(path)).toEqual(config);
  });

  test("partial or corrupt files merge over defaults", async () => {
    const partial = tempPath();
    await Bun.write(partial, JSON.stringify({ provider: "openai" }));
    expect(loadConfig(partial)).toEqual({ ...structuredClone(DEFAULT_CONFIG), provider: "openai" });

    const corrupt = tempPath();
    await Bun.write(corrupt, "{nope");
    expect(loadConfig(corrupt)).toEqual(DEFAULT_CONFIG);
  });
});
