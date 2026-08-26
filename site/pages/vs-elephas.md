---
slug: vs/elephas
title: Minne vs Elephas — which Mac AI assistant is for you?
h1: Minne and Elephas — which one is for you?
description: An honest comparison. Elephas is a mature, paid Mac AI assistant with a document knowledge base; Minne is a free, open-source memory that builds itself from your work. Different tools, different bets — here is how to choose.
published: 2026-08-26
checked: 2026-08-26
---

Minne and [Elephas](https://elephas.app) get mentioned in the same breath
because both are Mac-native AI assistants that work across your apps and both
take privacy seriously. But they are built on different bets, and one of them
is probably obviously right *for you*. This page is honest about which —
Elephas is good software, and Minne is young.

The short version: **Elephas** is a polished, commercial assistant with a
knowledge base you build from your documents. **Minne** is a free, open-source
memory that builds *itself* from what you do, and writes from it.

## What Elephas does well

From Elephas's own site, checked at the date in the footer:

- **Super Brain** — a knowledge base you assemble from PDFs, Word and Excel
  files, Apple Notes, Notion, Obsidian and more, indexed on your Mac, with
  AI answers that cite their sources.
- **Super Command** — a keyboard shortcut that summarises, rewrites,
  translates or drafts in any app.
- **A privacy story with real engineering in it** — on-device indexing,
  automatic redaction of 28 types of sensitive data before anything goes to a
  cloud model, and a fully offline mode.
- **AI included** — plans bundle monthly AI credits, so it works without any
  key or account elsewhere; you can also bring keys from 15+ providers.
- Mac and iOS, years of releases, a paying user base.

Pricing at time of checking: free plan with 20 credits monthly, then
$19/$39/$49 per month by credit tier, with a yearly discount.

## Where Minne differs

- **The memory feeds itself.** Elephas answers from documents you give it;
  Minne watches the work itself — the text of the windows you are in, via the
  Accessibility APIs — and [an agent distils it into a wiki](/second-brain)
  of people, projects and decisions. Nobody files anything.
- **The memory is plain markdown on disk.** One page per subject in
  `~/Minne`, open-in-Obsidian compatible, with
  [a schema file you own](https://docs.minne.sh/guides/schema). Read it, edit
  it, take it with you.
- **Free and MIT-licensed.** No tiers, no credits, no account. You bring the
  model: an API key, [Ollama on your own machine](/local-ai-writing), or a
  Claude/ChatGPT subscription sign-in. The code is
  [public and auditable](https://github.com/mandgie/minne), which for a tool
  that reads your screen text is not a small thing.
- **Drafts that know your week.** Tap right-Option in a reply and the draft
  already carries what you agreed on Tuesday — because
  [the memory was there](/what-is-ai-memory).

## Choose Elephas if…

- You want answers from *documents* — contracts, papers, meeting notes — and
  a mature tool for querying them.
- You want AI bundled in the price, with no key or provider decisions.
- You want iOS, onboarding, support, and software that has been shipping for
  years.

## Choose Minne if…

- You want the memory built from your *work*, automatically, rather than
  from files you curate.
- You want it in plain markdown you own, from an app you can read the source
  of, for free.
- You are comfortable with early software — Minne is new, and says so.

No scores and no winner: the honest summary is that Elephas is the safer
choice today and Minne is the more radical bet on what a memory should be.
If Minne's bet appeals, it is
[a two-minute install](https://docs.minne.sh/start/install) on macOS 14+.
See also [Minne and Raycast AI](/vs/raycast-ai).
