---
slug: rewind-alternative
title: A Rewind AI alternative that never records your screen — Minne
h1: A Rewind alternative that never records your screen
description: Rewind's Mac capture was switched off in December 2025 after Meta acquired Limitless. Minne is a free, open-source replacement — a memory built from the text of your windows, kept as plain markdown on your Mac. No screenshots, no audio, no server.
published: 2026-08-26
checked: 2026-08-26
---

Rewind, the Mac app that remembered your screen by recording it, is gone.
Meta acquired its maker, Limitless, in early December 2025, and on 19 December
the app's screen and audio capture was switched off. If you relied on it, you
are shopping for a replacement — which makes this a good moment to ask how much
a memory app actually needs to see.

Minne is a free, open-source memory for your Mac that never records your
screen. It reads the *text* of the window you are working in through the macOS
Accessibility APIs — the same interface a screen reader uses — and distils it
into a wiki of plain markdown notes in a folder on your disk. You can search
your past, ask it what was agreed, and have it write from what it remembers,
anywhere you type. No screenshots, no audio, no account, no server.

> A memory of your work does not require a recording of your screen. The text
> of your windows, captured as you work and distilled into notes, keeps what
> you did — without keeping a picture of everything you saw.

## How Minne remembers, without recording

A screen recorder keeps frames and runs text recognition over them afterwards.
Minne skips the picture and asks the window for its text directly, the way
VoiceOver does. What lands on disk is markdown: raw captures in
`~/Minne/sources/`, and above them a wiki the agent maintains — one page per
person, project and topic, each citing the captures it came from.

That difference runs deeper than storage:

- **You can read your memory.** It is a folder of files with names you
  recognise, not a database of video. Open it in Obsidian, grep it, edit it.
- **Minne never asks for Screen Recording permission**, so the purple
  recording indicator never appears because of it. One Accessibility grant is
  the whole footprint.
- **Sensitive text is handled before it is stored.** Card numbers, personal ID
  numbers and IBANs are masked before anything touches disk, and password
  fields are skipped entirely — a screenshot, by contrast, contains whatever
  was on screen. The details are in [What leaves your Mac](https://docs.minne.sh/privacy).

## What Minne does that Rewind did

- **Search your past.** Press ⌥Space and ask — *what did Ingrid and I agree on
  last week? when did that decision land?* The assistant searches your wiki
  and the raw captures under it, and answers with where it looked. See
  [Chat](https://docs.minne.sh/guides/chat).
- **A memory that builds itself.** No tagging, no capture ritual. Minne
  watches the work you were doing anyway and distils it every half hour.
- **And one thing Rewind never did:** Minne writes from the memory. Tap
  right-Option in any text field and the reply or the summary arrives already
  knowing the context. That is the actual point of remembering — see
  [what a personal AI memory is for](/what-is-ai-memory).

## What Minne doesn't do

Honesty first: Minne keeps text, so anything that was only ever pixels is out
of scope.

- **No screenshots to scroll back through.** You cannot rewind to what a
  window looked like last Tuesday — only to what it said.
- **No audio, no meeting capture.** Minne will not transcribe your calls. If
  meetings are the thing you need remembered, a recorder is the right tool —
  [Screenpipe](https://screenpipe.com) records screen and audio continuously
  and keeps the data local, and that trade-off may be the one you want.

## Privacy, side by side

| | Minne | A screen-recording memory app |
| --- | --- | --- |
| What is captured | The text of the focused window | Frames of everything on screen, often audio too |
| What it is stored as | Plain markdown you can open and edit | The app's own recording database |
| Password fields | Skipped before a single character is read | On screen is on record |
| Recording indicator | Never — Screen Recording permission is never requested | macOS shows the purple indicator while capture runs |
| Where it goes | Nowhere. Model calls go to the AI you configured — or to [Ollama on your own machine](/local-ai-writing), and then nothing leaves at all | Varies by app — check what leaves, and what happens if the company is acquired |
| Leaving | Copy the folder; it is yours | Whatever export the app offers |

The last row is not hypothetical. Rewind's users got two weeks' notice, and in
the EU and UK a deadline to export before deletion. A memory that is a folder
of markdown on your disk cannot be shut down by an acquisition.

## Get started

Minne is free, MIT-licensed and early — built in the open, with
[the code the final word](https://github.com/mandgie/minne) on every claim
above. It runs on macOS 14 and later. [Download it](https://github.com/mandgie/minne/releases/latest/download/Minne.dmg),
grant the one permission, and the first wiki pages appear within the hour.
[The install guide](https://docs.minne.sh/start/install) covers the rest.

If screen recording itself is what worries you, the sharper question — what an
app can know without it — has [its own page](/ai-without-screen-recording).
