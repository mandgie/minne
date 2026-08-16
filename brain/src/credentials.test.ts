import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Credential } from "@earendil-works/pi-ai";
import { FileCredentialStore } from "./credentials";

const OAUTH: Credential = { type: "oauth", refresh: "r", access: "a", expires: 123 };
const API_KEY: Credential = { type: "api_key", key: "sk-test" };

let dirs: string[] = [];
function makeStore(): FileCredentialStore {
  const dir = mkdtempSync(join(tmpdir(), "minne-cred-"));
  dirs.push(dir);
  return new FileCredentialStore(join(dir, "nested", "auth.json"));
}

afterEach(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
  dirs = [];
});

describe("FileCredentialStore", () => {
  test("read of a missing file resolves undefined", async () => {
    const store = makeStore();
    expect(await store.read("anthropic")).toBeUndefined();
    expect(await store.list()).toEqual([]);
  });

  test("modify persists and read round-trips", async () => {
    const store = makeStore();
    const written = await store.modify("anthropic", async (current) => {
      expect(current).toBeUndefined();
      return OAUTH;
    });
    expect(written).toEqual(OAUTH);
    expect(await store.read("anthropic")).toEqual(OAUTH);
    expect(await store.list()).toEqual([{ providerId: "anthropic", type: "oauth" }]);
  });

  test("file and directory are created with 0600/0700 permissions", async () => {
    const store = makeStore();
    await store.modify("anthropic", async () => OAUTH);
    expect(statSync(store.path).mode & 0o777).toBe(0o600);
    expect(statSync(join(store.path, "..")).mode & 0o777).toBe(0o700);
  });

  test("modify returning undefined leaves the entry unchanged", async () => {
    const store = makeStore();
    await store.modify("openai", async () => API_KEY);
    const result = await store.modify("openai", async () => undefined);
    expect(result).toEqual(API_KEY);
    expect(await store.read("openai")).toEqual(API_KEY);
  });

  test("delete removes only the given provider", async () => {
    const store = makeStore();
    await store.modify("anthropic", async () => OAUTH);
    await store.modify("openai", async () => API_KEY);
    await store.delete("anthropic");
    expect(await store.read("anthropic")).toBeUndefined();
    expect(await store.read("openai")).toEqual(API_KEY);
    await store.delete("never-stored"); // no-op, must not throw
  });

  test("writes are serialized: concurrent modifies both land", async () => {
    const store = makeStore();
    await Promise.all([
      store.modify("anthropic", async () => OAUTH),
      store.modify("openai", async () => API_KEY),
    ]);
    const list = await store.list();
    expect(list.map((i) => i.providerId).sort()).toEqual(["anthropic", "openai"]);
  });

  test("a corrupt file reads as empty instead of throwing", async () => {
    const store = makeStore();
    await store.modify("anthropic", async () => OAUTH);
    await Bun.write(store.path, "{not json");
    expect(await store.read("anthropic")).toBeUndefined();
  });
});
