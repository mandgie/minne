# Gotchas & learnings

Shared brain for build agents. **Read this fully before starting any story.**
Append (never delete) a concise entry whenever you hit something non-obvious: a build
quirk, an API surprise, a decision with a reason. Keep entries to 1–3 lines each.
Format: `- [US-xxx] the gotcha, and what to do about it.`

## Seeded from research (before any code)

- [general] pi packages live under the `@earendil-works` npm scope (recently moved from `@mariozechner`). Pin exact versions (`save-exact`). Docs: https://github.com/badlogic/pi-mono — read `packages/ai/README.md` and `packages/agent/README.md` before using; APIs may differ from blog posts.
- [general] Do NOT read or copy code from github.com/Nadreau/goldfish (it references a provisional patent). Implement independently from our PRD only.
- [general] Toolchain on this machine: Bun 1.2.4 (`/opt/homebrew/bin/bun`), Swift 6.0.3, no Xcode project — we use SwiftPM. Node is available but the brain targets Bun.
- [US-001] SwiftPM does not produce .app bundles. `swift build` yields a bare executable; `scripts/build.sh` must assemble `Minne.app/Contents/{MacOS,Resources,Info.plist}` manually (LSUIElement=true in Info.plist). Dev runs can use the bare executable.
- [US-002] The brain's stdout is reserved exclusively for protocol JSON-lines. Any stray `console.log` corrupts the protocol — route ALL logging to stderr from day one.
- [US-002] pi's own `pi-server`/`pi-protocol` (CBOR) packages are experimental — do not use them; we own a thin JSON-lines protocol defined in `brain/src/protocol.ts`.
- [general] Every story must leave the repo green: `swift build` in `app/`, `bun run typecheck` + `bun test` in `brain/`. Never commit red.
- [general] Commit style: one commit per story, message `US-xxx: <summary>`, ending with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`. Do not push — the orchestrator pushes after verification.
- [general] Only touch `tasks/GOTCHAS.md` (append) among the tasks/ files — `progress.md` and the PRD are orchestrator/human-owned.

## Learnings (append below)

- [US-001] `bun add --exact -d typescript` now resolves to TypeScript 7.x (the Go-based compiler); `tsc --noEmit` works fine with it under strict settings. Pinned: typescript 7.0.2, @types/bun 1.3.14.
- [US-001] Swift 6 menu-bar skeleton: `@main @MainActor final class ... : NSObject, NSApplicationDelegate` with a custom `static func main()` that sets `NSApp.setActivationPolicy(.accessory)` (Dock-less for the bare dev executable; the bundle gets LSUIElement from Info.plist).
- [US-001] Locate SwiftPM's output with `swift build -c release --show-bin-path` instead of hardcoding `.build/release` — the path is arch-specific (`.build/arm64-apple-macosx/release`).
- [US-001] `bun build --compile src/main.ts --outfile <path>` produces the single-file brain binary (~57MB, embeds the Bun runtime); it runs standalone with no bun install on the target.
- [US-001] `bun build --compile` leaves stray temp files named `.<hash>-00000000.bun-build` in the cwd; add `*.bun-build` to .gitignore or they end up committed.
- [US-001] Minimal working Info.plist keys for the manual bundle: CFBundleExecutable, CFBundleIdentifier, CFBundleName, CFBundlePackageType=APPL, CFBundleShortVersionString, CFBundleVersion, LSMinimumSystemVersion, LSUIElement, NSPrincipalClass=NSApplication. Validate with `plutil -lint`.
- [US-002] Bun 1.2.4 buffers a *piped* stdin until EOF for `Bun.stdin.stream()`, `for await (of console)`, AND node-style `process.stdin` events — deadlocks any request/response protocol. Read fd 0 with node:fs `read()` instead (`stdinChunks()` in brain/src/jsonlines.ts); regression test "responds while stdin is still open" in main.test.ts.
- [US-002] Swift: never iterate `FileHandle.bytes.lines` from an actor-isolated Task — AsyncBytes runs its blocking read(2) inline on the iterating executor, parking the whole actor (deadlocked under `swift test`, only won the race in the app). Bridge readabilityHandler → AsyncStream instead (see BrainClient.lineStream).
- [US-002] `swift test` CAN test an executable target on macOS: `.testTarget(dependencies: ["Minne"])` + `@testable import Minne` works fine despite `@main`. But `swift test` buffers ALL output until the run ends — a hung async test shows nothing; diagnose with `sample <xctest-pid>`.
- [US-002] `bun run script.ts` spawns a *child* bun process; Swift's `Process` holds the parent. When kill-testing crash restart, kill the parent pid (the one Process reports), and beware orphaned children from killed test runs lingering and matching pgrep patterns.
- [US-002] Swift 6 strict concurrency: a mutable local captured by `readabilityHandler` errors ("captured var in concurrently-executing code"); `nonisolated(unsafe) var` is the fix when the closure is serialized on one dispatch source, and `nonisolated(unsafe)` on FileHandle locals is unnecessary (FileHandle is Sendable in the macOS 15 SDK).
