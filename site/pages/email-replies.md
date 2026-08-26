---
slug: email-replies
title: AI email replies that already know the thread — Minne for Mac
h1: Email replies that already know the thread
description: Tap one key in any mail app on your Mac and Minne drafts the reply — from the thread on screen and what it remembers about the work, in your tone. Nothing sends until you press Insert.
published: 2026-08-26
---

Put the caret in the reply field, tap right-Option, and Minne writes the
reply — from the thread it can see on screen and from what it remembers about
the sender, the project and what you promised last week. The draft appears in
a small panel beside the caret, in your tone, and nothing touches your email
until you press Insert. It works in Apple Mail, Outlook, Gmail in a browser —
anywhere there is a text field, because that is all Minne needs.

> The slow part of a reply is not the typing. It is scrolling back through
> three weeks of thread to remember what you already know. A reply written
> from memory skips the scroll.

## Not another reply generator

The web is full of tools that generate email replies if you paste the thread
in and describe what you want. Minne inverts that:

- **No copy-paste.** Minne reads the thread where it sits, through the macOS
  Accessibility APIs. You never leave the mail window.
- **No prompt to write.** An empty reply field is itself the instruction:
  Minne looks at the thread and writes what should come next. If you want to
  steer it first, type the intent in plain words — *say yes but push it to
  Thursday* — and tap the key; the instruction is replaced by the thing
  itself.
- **The context comes from memory.** A generator knows only what you paste.
  Minne also consults [its wiki of your work](/what-is-ai-memory) — the page
  about the person you are writing to, the project the mail is about — so the
  draft can commit to the date you actually agreed instead of inventing one.

## In your words

Minne learns your tone from your own writing — greeting, sign-off, typical
length, language — and keeps it per context, so mail-you can stay more formal
than Slack-you. The corrections you make teach it: ask for *shorter* three
times, or keep trimming the greeting before you send, and that becomes a
standing rule for mail drafts. You stop repeating yourself. How that works is
in [Telling it what you want](https://docs.minne.sh/guides/instructions).

## Works in every mail app

There is no plugin, no extension, and no list of supported clients. Minne
operates at the level of the text field itself, so the mail app is just
another window it can read and a field it can write into — desktop app or
browser tab. The same key drafts your Slack replies and your
[status updates](/status-updates), which is rather the point: one gesture,
everywhere you type.

## What gets sent to the model, exactly

One request per draft, to the AI provider *you* configured — your account,
your key, or [a model running on your own machine](/local-ai-writing). It
carries the field you are writing in, the visible text of the window around
it, and the notes Minne recalled. There is no Minne server in the middle, no
telemetry, and your memory folder itself never leaves your Mac. The complete
ledger is [What leaves your Mac](https://docs.minne.sh/privacy).

## You stay the sender

Nothing is typed into the field until you press Insert — and ⌘Z takes it
straight back out. Press ⇥ to steer the draft (*warmer, and mention the
Thursday deadline*), ⌘R for a different take, ⌘E to edit it in place. Minne
never sends anything; the Send button remains entirely yours.

Minne is free, open source, and runs on macOS 14 and later.
[Download it](https://github.com/mandgie/minne/releases/latest/download/Minne.dmg),
or start with [how the Minne key works](https://docs.minne.sh/guides/minne-key).
