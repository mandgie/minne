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

## A note on subscription OAuth

Using your Claude or ChatGPT subscription from a third-party app is a gray area under provider terms of service. You authenticate with your own account and the risk sits with that account. The API-key and local-model paths are always-safe alternatives.

## License

MIT
