import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

// Raw control bytes in a source file make grep/ripgrep treat it as binary and
// silently return nothing (verified live on memory.ts, 2026-08-18). This test
// keeps the tree navigable: every source file must be plain text.

const REPO_ROOT = resolve(import.meta.dir, "..", "..");
const SOURCE_ROOTS = ["app/Sources", "brain/src", "tasks", "scripts"];
const BINARY_EXTENSIONS = new Set([
  ".png",
  ".tiff",
  ".icns",
  ".jpg",
  ".jpeg",
  ".gif",
  ".pdf",
  ".zip",
  ".dmg",
  ".p12",
  // Bundled typefaces (app/Sources/Minne/Resources/Fonts) — binary by nature.
  ".ttf",
  ".otf",
]);
const ALLOWED = new Set([0x09, 0x0a, 0x0d]); // \t \n \r

function isBinaryAsset(path: string): boolean {
  const dot = path.lastIndexOf(".");
  return dot >= 0 && BINARY_EXTENSIONS.has(path.slice(dot).toLowerCase());
}

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      if (entry === "node_modules" || entry === ".build") continue;
      walk(path, files);
    } else {
      files.push(path);
    }
  }
  return files;
}

function controlByteOffsets(data: Uint8Array): number[] {
  const offsets: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const byte = data[i]!;
    if (byte < 0x20 && !ALLOWED.has(byte)) offsets.push(i);
  }
  return offsets;
}

describe("source hygiene", () => {
  test("no source file contains raw control bytes", () => {
    const violations: string[] = [];
    for (const root of SOURCE_ROOTS) {
      for (const path of walk(join(REPO_ROOT, root))) {
        if (isBinaryAsset(path)) continue;
        const offsets = controlByteOffsets(readFileSync(path));
        if (offsets.length > 0) {
          const shown = offsets.slice(0, 5).join(", ");
          const more = offsets.length > 5 ? ` (+${offsets.length - 5} more)` : "";
          violations.push(`${path}: raw control byte at offset ${shown}${more}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
