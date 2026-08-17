// Path safety for the memory tools.
//
// Every path the agent hands us is memory-root-relative and untrusted: it is
// text an LLM produced, so `../../.ssh/id_rsa`, `/etc/passwd` and a symlink
// planted in the wiki are all things to expect rather than to be surprised by.
// The tools never touch the filesystem except through `resolveInMemory`, which
// answers one question: *is this path a file inside the memory root?*
//
// Two checks, because either alone is defeatable:
//
//   1. lexical  — the relative path is normalised and may not contain `..`,
//                 may not be absolute, and may not be empty.
//   2. physical — the deepest part of the path that exists on disk is resolved
//                 with `realpath(3)` and must still sit inside the *resolved*
//                 memory root. That is what catches a symlink pointing out,
//                 which no amount of string cleaning can see.
//
// The root is resolved too: on macOS `/tmp` is a symlink to `/private/tmp`, so
// comparing an unresolved root against a resolved path would reject every
// legitimate write in a test.
import { realpathSync } from "node:fs";
import { isAbsolute, join, resolve, sep } from "node:path";

/** A path that is not, or would not stay, inside the memory root. */
export class UnsafePathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafePathError";
  }
}

export interface ResolvedPath {
  /** cleaned memory-root-relative path, `/`-separated (`wiki/oslo-trip.md`) */
  relative: string;
  /** absolute path, with every existing component's symlinks resolved */
  absolute: string;
}

/**
 * Cleans a memory-root-relative path, or throws `UnsafePathError`.
 *
 * Drops `.` segments and redundant separators; refuses `..` anywhere rather
 * than resolving it, because a path that climbs out and back in (`wiki/../wiki`)
 * is never something the agent meant and always something an attacker would try.
 */
export function normalizeMemoryPath(input: string): string {
  const path = input.trim();
  if (path === "") {
    throw new UnsafePathError("path is empty — give a path relative to the memory root");
  }
  if (path.includes("\0")) {
    throw new UnsafePathError("path contains a NUL byte");
  }
  if (isAbsolute(path) || path.startsWith("~")) {
    throw new UnsafePathError(
      `"${input}" is an absolute path — paths are relative to the memory root (e.g. "wiki/oslo-trip.md")`,
    );
  }
  const segments: string[] = [];
  for (const segment of path.split(/[/\\]/)) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") {
      throw new UnsafePathError(`"${input}" climbs out of the memory root with ".."`);
    }
    segments.push(segment);
  }
  if (segments.length === 0) {
    throw new UnsafePathError(`"${input}" does not name a file inside the memory root`);
  }
  return segments.join("/");
}

/**
 * Resolves `relative` inside `root`, refusing anything that would escape.
 *
 * Works for paths that do not exist yet (a page about to be created): the walk
 * up to the deepest existing ancestor is what gets `realpath`ed, so a write
 * through a symlinked directory is caught before the file is created.
 */
export function resolveInMemory(root: string, relative: string): ResolvedPath {
  const cleaned = normalizeMemoryPath(relative);
  const realRoot = realpath(resolve(root));
  const absolute = realpath(join(realRoot, cleaned));
  if (absolute !== realRoot && !absolute.startsWith(realRoot + sep)) {
    throw new UnsafePathError(
      `"${relative}" resolves to ${absolute}, which is outside the memory root ${realRoot} (symlink?)`,
    );
  }
  return { relative: cleaned, absolute };
}

/**
 * `realpath` for a path that may not exist yet: resolves the longest existing
 * prefix and re-appends the rest verbatim. A component that exists is always
 * resolved, so a symlink anywhere along the path is followed and can be caught.
 */
function realpath(path: string): string {
  const missing: string[] = [];
  let current = resolve(path);
  for (;;) {
    try {
      return missing.length === 0 ? realpathSync(current) : join(realpathSync(current), ...missing);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== "ENOENT" && code !== "ENOTDIR") throw err;
      const parent = resolve(current, "..");
      // Reached the filesystem root without finding anything that exists.
      if (parent === current) return path;
      missing.unshift(current.slice(parent.length + (parent.endsWith(sep) ? 0 : 1)));
      current = parent;
    }
  }
}
