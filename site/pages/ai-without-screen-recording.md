---
slug: ai-without-screen-recording
title: AI memory without screen recording — how Minne reads your Mac
h1: Your Mac's AI memory doesn't need a screen recorder
description: There are two ways an app can know what you work on — record the screen, or read the focused window's text through the Accessibility APIs. Minne uses the second. What that interface exposes, what it never sees, and when you genuinely need a recorder.
published: 2026-08-26
byline: true
---

There are two ways an app on your Mac can know what you are working on. It
can record the screen — capture frames continuously and run text recognition
over them — or it can ask the focused window for its *text* through the macOS
Accessibility APIs, the same interface VoiceOver uses to read the screen to a
blind user. Minne uses the second, and only the second: it never takes a
screenshot, never records audio, and never requests Screen Recording
permission.

> An AI memory does not need to see your screen. It needs to read it — and
> macOS has had an interface for reading windows as text, built for screen
> readers, for twenty years.

## What the Accessibility API actually exposes

When you grant Minne Accessibility access, it can ask the frontmost window
for its structure: the text of the field you are in, the visible text around
it, the window title, the page URL in a browser. Text, as text — no pixels,
no fonts, no images, nothing from windows sitting in the background.
Everything a draft or a capture uses comes through that one interface, and
[the capture's exact reach is documented](https://docs.minne.sh/privacy).

## Why the purple recording dot never appears

macOS separates the permissions. Screen Recording — what Rewind needed, what
a screenshot tool needs — puts the purple indicator in your menu bar while it
runs. Accessibility is a different grant, and it is the only one Minne asks
for. So the recording indicator never appears because of Minne — not as a
courtesy, but because the permission that triggers it was never requested.
The distinction matters beyond the dot, and it is why
[the Rewind replacement page](/rewind-alternative) exists at all.

## What never reaches the disk

Reading text instead of pixels makes the data small enough to *handle* before
it is stored — something no screenshot pipeline can offer:

- **Password fields are skipped whole.** Anything macOS marks as a secure
  text field is refused before a single character is read — never
  read-then-scrubbed.
- **Sensitive numbers are masked first.** Card numbers, CVVs, IBANs and
  personal identity numbers are replaced with `▮▮▮` before a capture touches
  disk — and each pattern is checksum-validated, so an order number is not
  blanked by mistake.
- **Whole apps can be excluded.** The blacklist ships already populated with
  password managers and credential pages; add your bank. Private browser
  windows are skipped without being on any list.

## When you genuinely need screen recording

Text is not everything, and pretending otherwise would be dishonest. If you
need to *see* what a window looked like, work in tools that are essentially
images — design canvases, video — or want your meetings captured and
transcribed, you need pixels and audio, and a recorder is the right tool.
[Screenpipe](https://screenpipe.com) does continuous screen and audio capture
and keeps the data on your machine; that is the honest alternative when
recording is what you actually want.

For the rest — the threads, the decisions, the people, the things you would
[ask your memory about](/what-is-ai-memory) or want
[written into a reply](/email-replies) — the words are enough. Minne is
[free and open source](https://github.com/mandgie/minne), so "only the words"
is a claim you can check against the code. More first questions are answered
in [the FAQ](https://docs.minne.sh/faq).
