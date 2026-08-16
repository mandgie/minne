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
