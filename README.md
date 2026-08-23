# Minne

**Your computer's memory, kept by you.** Minne is an open-source macOS menu-bar companion that watches what you work on (text only, via the Accessibility APIs — never screenshots), distills it into a local markdown wiki maintained by an AI agent, and lets an assistant that already knows your context answer questions and, eventually, write for you anywhere you type.

*Minne* is Swedish for *memory*.

## Principles

- **Your own AI subscription is the engine.** Sign in with your Claude Pro/Max or ChatGPT Plus/Pro account via OAuth (powered by [pi](https://github.com/badlogic/pi-mono)), or point Minne at a local model (Ollama or any OpenAI-compatible endpoint). No API keys required, no vendor backend.
- **Memory is plain markdown.** A Karpathy-style LLM wiki: immutable raw captures in `sources/`, agent-maintained pages for people, projects, and topics in `wiki/`, governed by a human-owned `SCHEMA.md`. Open the whole thing in Obsidian. No embeddings, no vector database.
- **Nothing leaves your machine** except your own LLM calls. No accounts, no telemetry, no cloud storage. Sensitive data (card numbers, personal ID numbers, IBANs) is masked before anything touches disk.

## Architecture

Native Swift menu-bar app (capture, UI, permissions) + a bundled Bun-compiled TypeScript sidecar ("the brain") running the pi agent harness. They speak JSON-lines over stdio.

```
Minne.app (Swift)              minne-brain (TypeScript, Bun binary)
  capture · UI · hotkey   ⇄      pi agent · OAuth · wiki maintenance
                └────── stdio ──────┘
                         ▼
        ~/Minne/  sources/  wiki/  SCHEMA.md
```

## What leaves your Mac

An audited claim, not an aspiration: the Swift app links no networking API at
all, and the brain's only network I/O is [pi](https://github.com/badlogic/pi-mono)'s
provider layer for the one provider you configured. There are no Minne servers,
no telemetry and no analytics — in the app, the brain, or their dependency tree
as configured.

What travels, per feature, always to *your* AI provider under your own account
or key:

- **Draft (the Minne key):** the focused field's text, your selection, the
  window's visible text, and the wiki pages Minne recalls for grounding —
  clipped, inside one model request.
- **Chat:** your messages, plus whatever memory excerpts the assistant reads
  through its search/read tools while answering.
- **Memory sync:** recent raw captures, in batches, so the agent can distill
  them into wiki pages. Card and ID numbers are masked before a capture ever
  touches disk, so what is sent is the masked text.
- **Sign-in:** an OAuth exchange with that provider's own auth endpoints
  (Anthropic: `claude.ai` / `platform.claude.com`; OpenAI: `auth.openai.com`),
  or nothing at all for an API key, which is stored locally.

Model requests go to the provider's public API host — `api.anthropic.com`,
`chatgpt.com/backend-api`, `api.openai.com` — or, for the local provider, to
the base URL you set (default `http://localhost:11434/v1`).

What never leaves: the `~/Minne` folder itself. There is no backup, no cloud
sync, and no code path that uploads your memory anywhere — pages are read into
model prompts as excerpts when a feature needs them, and that is the only way
any of it travels.

`minne-brain --mcp` serves your memory read-only over local stdio to an MCP
client you configure (Claude Desktop, for instance). Nothing listens on the
network; what that client sends to its own model is governed by the client,
not by Minne.

To switch providers: Settings → Account ("Which AI Minne thinks with") offers
Anthropic (Claude Pro/Max or API key), OpenAI (ChatGPT Plus/Pro or API key),
and Local (Ollama or any OpenAI-compatible server). Point Minne at Ollama on
localhost and model traffic never leaves the machine.

## Documentation

[docs.minne.sh](https://docs.minne.sh) — install, the Minne key, the memory
format, every setting, and what leaves your Mac. Source in [`docs-site/`](docs-site/).

## Status

Early development. The plan lives in [`tasks/prd-minne.md`](tasks/prd-minne.md).

## Building from source

Requirements: macOS 14+, Swift 6.0+, [Bun](https://bun.sh) 1.2+.

```sh
# Full bundle → build/Minne.app (compiled brain included)
scripts/build.sh

# Development: brain uncompiled + debug app (bare executable, Ctrl-C to quit)
scripts/dev.sh

# Individual pieces
cd app && swift build
cd brain && bun install && bun run typecheck && bun test
```

There is no Xcode project — the app is plain SwiftPM, and `scripts/build.sh`
assembles the `.app` bundle itself.

## Release

`scripts/release.sh` builds the bundle and packages it as `build/Minne-<version>.dmg`.
The version comes from the `VERSION` file at the repo root — the single source for
both `CFBundleShortVersionString` and the brain's reported version.

```sh
# Contributors: ad-hoc signed dmg, no Apple developer account needed
scripts/release.sh

# Maintainers: signed, notarized and stapled
MINNE_SIGN_IDENTITY="Developer ID Application: Your Name (TEAMID)" \
MINNE_NOTARY_PROFILE=minne-notary \
  scripts/release.sh
```

Without those two variables the script signs the app **ad-hoc** — same hardened
runtime, same entitlements, no Apple identity — and skips notarization, saying so
as it goes. The bundle it produces passes `codesign --verify --strict --deep`, which
an unsigned one does not: the linker ad-hoc signs every arm64 executable, and that
signature alone claims a bundle seal that was never created. The build runs fine
when you build it yourself, but macOS quarantines it if it travels through a browser
or a chat app — open it once with right-click → Open, or clear the flag with
`xattr -dr com.apple.quarantine Minne.app`.

`MINNE_NOTARY_PROFILE` names a keychain profile you create once with
`xcrun notarytool store-credentials`. The bundled brain is a Bun binary and is
signed separately with `scripts/minne-brain.entitlements`, which grants the
JIT exception JavaScriptCore needs under the hardened runtime.

CI (`.github/workflows/ci.yml`) builds and tests both halves on every push and pull
request. Pushing a `v*` tag that matches `VERSION` runs the same checks and then
publishes the dmg to a GitHub Release (`.github/workflows/release.yml`); it signs
and notarizes only if the repository provides the signing secrets.

## A note on subscription OAuth

Using your Claude or ChatGPT subscription from a third-party app is a gray area under provider terms of service. You authenticate with your own account and the risk sits with that account. The API-key and local-model paths are always-safe alternatives.

## License

MIT
