import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
import { UnsafePathError, normalizeMemoryPath, resolveInMemory } from "./memory-path";

let dirs: string[] = [];
function tempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  dirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
  dirs = [];
});

describe("normalizeMemoryPath", () => {
  test.each([
    ["wiki/oslo-trip.md", "wiki/oslo-trip.md"],
    ["./wiki//oslo-trip.md", "wiki/oslo-trip.md"],
    ["  index.md  ", "index.md"],
    ["wiki/daily/2026-08-17.md", "wiki/daily/2026-08-17.md"],
  ])("%j normalises to %j", (input, expected) => {
    expect(normalizeMemoryPath(input)).toBe(expected);
  });

  test.each([
    ["", "empty"],
    ["   ", "empty"],
    ["..", ".."],
    ["../secrets.md", ".."],
    ["wiki/../../etc/passwd", ".."],
    ["wiki/..", ".."],
    ["/etc/passwd", "absolute"],
    ["~/.ssh/id_rsa", "absolute"],
    ["wiki/\0.md", "NUL"],
    [".", "does not name a file"],
  ])("%j is refused (%s)", (input, because) => {
    expect(() => normalizeMemoryPath(input)).toThrow(UnsafePathError);
    expect(() => normalizeMemoryPath(input)).toThrow(because);
  });

  test("a backslash is a separator too, not a way to smuggle a segment", () => {
    expect(() => normalizeMemoryPath("wiki\\..\\..\\etc\\passwd")).toThrow(UnsafePathError);
  });
});

describe("resolveInMemory", () => {
  test("resolves a path that does not exist yet", () => {
    const root = tempDir("minne-path-");
    const resolved = resolveInMemory(root, "wiki/daily/2026-08-17.md");
    expect(resolved.relative).toBe("wiki/daily/2026-08-17.md");
    expect(resolved.absolute.endsWith(`${sep}wiki${sep}daily${sep}2026-08-17.md`)).toBe(true);
  });

  test("resolves the root's own symlinks, so a temp dir is not an escape", () => {
    const root = tempDir("minne-path-");
    // /var and /tmp are symlinks on macOS: an unresolved root would make every
    // legitimate path look like it left the memory.
    expect(() => resolveInMemory(root, "index.md")).not.toThrow();
  });

  test("refuses a symlink pointing out of the memory", () => {
    const root = tempDir("minne-path-");
    const outside = tempDir("minne-outside-");
    writeFileSync(join(outside, "secrets.md"), "not yours\n");
    mkdirSync(join(root, "wiki"));
    symlinkSync(join(outside, "secrets.md"), join(root, "wiki", "leak.md"));
    expect(() => resolveInMemory(root, "wiki/leak.md")).toThrow(UnsafePathError);
    expect(() => resolveInMemory(root, "wiki/leak.md")).toThrow("outside the memory root");
  });

  test("refuses a write through a symlinked directory", () => {
    const root = tempDir("minne-path-");
    const outside = tempDir("minne-outside-");
    mkdirSync(join(root, "wiki"));
    symlinkSync(outside, join(root, "wiki", "elsewhere"));
    // The file does not exist yet — the escape is caught at the directory.
    expect(() => resolveInMemory(root, "wiki/elsewhere/new.md")).toThrow(UnsafePathError);
  });

  test("allows a symlink that stays inside the memory", () => {
    const root = tempDir("minne-path-");
    mkdirSync(join(root, "wiki"));
    writeFileSync(join(root, "wiki", "real.md"), "page\n");
    symlinkSync(join(root, "wiki", "real.md"), join(root, "wiki", "alias.md"));
    expect(resolveInMemory(root, "wiki/alias.md").absolute).toBe(
      resolveInMemory(root, "wiki/real.md").absolute,
    );
  });

  test("a root that does not exist yet still resolves and still contains", () => {
    const root = join(tempDir("minne-path-"), "not-created-yet");
    expect(resolveInMemory(root, "index.md").relative).toBe("index.md");
    expect(() => resolveInMemory(root, "../index.md")).toThrow(UnsafePathError);
  });
});
