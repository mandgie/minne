---
title: Build from source
description: Minne is a Swift menu-bar app and a Bun-compiled TypeScript sidecar. Both build from a clean checkout with two commands.
---

Minne is two halves that speak JSON-lines over stdio: a native Swift app that
owns capture, UI, permissions and hotkeys, and a TypeScript "brain", compiled to
a single Bun binary, that owns the LLM calls and every write to the wiki.

```
Minne.app (Swift)              minne-brain (TypeScript, Bun binary)
  capture · UI · hotkey   ⇄      pi agent · OAuth · wiki maintenance
                └────── stdio ──────┘
                         ▼
        ~/Minne/  sources/  wiki/  SCHEMA.md
```

## Requirements

- macOS 14 or later
- Swift 6.0+
- [Bun](https://bun.sh) 1.2+

There is no Xcode project. The app is plain SwiftPM, and `scripts/build.sh`
assembles the `.app` bundle itself.

## Build

```sh
git clone https://github.com/mandgie/minne
cd minne

# Full bundle -> build/Minne.app, with the compiled brain inside
scripts/build.sh

# Development: uncompiled brain + debug app, as a bare executable.
# Ctrl-C to quit.
scripts/dev.sh
```

Each half also builds on its own:

```sh
cd app   && swift build
cd brain && bun install && bun run typecheck && bun test
```

## Package a release

`scripts/release.sh` builds the bundle and packages it as
`build/Minne-<version>.dmg`. The version comes from the `VERSION` file at the
repo root — the single source for both `CFBundleShortVersionString` and the
version the brain reports.

```sh
# Contributors: ad-hoc signed dmg, no Apple developer account needed
scripts/release.sh

# Maintainers: signed, notarized and stapled
MINNE_SIGN_IDENTITY="Developer ID Application: Your Name (TEAMID)" \
MINNE_NOTARY_PROFILE=minne-notary \
  scripts/release.sh
```

Without those two variables the script signs the app **ad-hoc** — same hardened
runtime, same entitlements, no Apple identity — and skips notarization, saying
so as it goes.

An ad-hoc bundle passes `codesign --verify --strict --deep`, which a genuinely
unsigned one does not: the linker ad-hoc signs every arm64 executable, and that
signature alone claims a bundle seal that was never created. It runs fine when
you build it yourself, but macOS quarantines it if it travels through a browser
or a chat app. Open it once with right-click → Open, or clear the flag:

```sh
xattr -dr com.apple.quarantine Minne.app
```

`MINNE_NOTARY_PROFILE` names a keychain profile you create once with
`xcrun notarytool store-credentials`. The bundled brain is a Bun binary and is
signed separately with `scripts/minne-brain.entitlements`, which grants the JIT
exception JavaScriptCore needs under the hardened runtime.

## CI

`.github/workflows/ci.yml` builds and tests both halves on every push and pull
request. Pushing a `v*` tag that matches `VERSION` runs the same checks and then
publishes the dmg to a GitHub Release
(`.github/workflows/release.yml`); it signs and notarizes only if the repository
provides the signing secrets.

:::note
The repo is expected to be green after every change — both builds and both test
suites. `cd app && swift build` and `cd brain && bun run typecheck && bun test`
is the whole gate.
:::

## Licence

MIT. [Read the code.](https://github.com/mandgie/minne)
