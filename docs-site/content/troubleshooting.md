---
title: Troubleshooting
description: Symptom, cause, fix — for the places where macOS, Chromium and the Accessibility APIs make life interesting.
---

Almost everything below comes down to one thing: Minne talks to other apps
through the macOS Accessibility APIs, and not every app answers the same way.
Where behaviour differs by app, it is named.

## Nothing happens when I tap right-Option

**Check the permission first.** Minne needs Accessibility access to watch for
the key at all — without it the event tap cannot be created and the key simply
does not exist. Settings → Privacy shows whether the grant is there.

If System Settings shows Minne's switch as **on** and the key is still dead, you
have hit the stale-entry case: macOS is holding a grant that belongs to an older
or differently-signed copy of Minne, and no amount of flipping the switch
escapes it. Settings → Privacy → **Setup Guide…** reopens onboarding, which
offers a **Repair Permission** button that clears the stale entry and re-asks.
See [First run](/start/first-run#when-the-switch-is-on-but-nothing-works).

**Check the trigger is on.** Settings → General → "Wake Minne at the caret with"
offers Right Option (⌥) and Off. Set to Off, the key tap is torn down entirely
and right-Option is an ordinary Option key again.

**Check the app is not blacklisted.** The Minne key shares the capture
blacklist, by design — an app whose contents may not become memory may not
become a prompt either.

**Check something is actually focused.** Minne needs a text field with a caret
in it. Clicking a page and then tapping does nothing if the caret never landed
in a field.

## It works everywhere except VS Code, Slack, or another Electron app

Chromium-based apps — Electron apps, VS Code, Slack, and the browsers when they
are cold — keep their accessibility tree **switched off** until an assistive
client asks for it. While the tree is dark, the app reports no focused element
at all, app-wide, even though the window itself answers normally.

Minne asks for the tree on the first press, which is exactly why that first
press can come up empty and the second works. It also retries the lookup once,
about half a second later, for that reason.

For VS Code specifically, you can turn the tree on permanently: set
`editor.accessibilitySupport` to `"on"` in its settings, or launch it with
`--force-renderer-accessibility`. It then behaves like any ordinary text area.

## The panel refuses to open in a password field

By design. Anything macOS marks as a secure text field — password boxes in
Safari, Chrome and Mail all qualify — is refused before any text is read. There
is no setting to override it.

You may see a stray "no text field is focused" line right after using a password
field. macOS's own autofill popover steals focus and emits an extra modifier
event on its way out; nothing is captured and nothing appears.

## Right-Option types special characters on my keyboard layout

On many international layouts right-Option is AltGr: the key that makes `@`,
`~`, `\` and friends. Minne only counts a press as a tap when right-Option goes
down and back up **with nothing in between** — the moment a letter key follows,
the press is an AltGr chord and Minne stays out of the way. The character types
normally.

If you would still rather it never listened, set "Wake Minne at the caret with"
to Off in Settings → General. Chat's ⌥Space and the menu bar keep working.

## The draft appeared and then vanished

In a browser or an Electron app, and only if something has gone wrong: Minne
does not write into web content through accessibility precisely because such a
write succeeds, verifies, and is then repainted away by React or whatever else
owns that editor. Web content goes through the clipboard instead, which survives
because it travels through the app's own input pipeline.

If you see it anyway, the web-area detection missed. Worth
[reporting](https://github.com/mandgie/minne/issues), with the site.

## The draft went in twice

Outside web content Minne tries three paths in order and verifies each: replace
the selected range, set the field's value, then paste. Two of the three will
answer "success" for a write they quietly ignored, so the verification is the
whole point — and Chromium makes it harder by applying an accessibility write
*asynchronously*, answering success while the field still reads unchanged for
another moment. Minne polls rather than reading once. An earlier version did
not, called the path dead, ran the paste on top, and inserted twice in Brave.

A paste is never retried for the same reason: a second ⌘V on top of one that
landed inserts twice. If Minne cannot confirm a paste it tells you to use Copy
rather than trying again.

## Undo does not do what I expect

Which undo works depends on how the text actually got in — and the panel's
**Undo** button always does the right one, so pressing that is the reliable
move:

- **Written through accessibility** (TextEdit, Notes, most native fields):
  Minne owns the undo. It restores the exact previous text *and* the selection
  you had, and ⌘Z is claimed while the *Inserted* state is on screen.
- **Pasted** (all web content, and the fallback elsewhere): the app owns the
  undo, because the paste went through its own event pipeline. Minne does not
  intercept ⌘Z; the Undo button posts one for you.

Either way, nothing is written into your document until you press Insert. While
a draft is being made it exists only in the panel.

## My clipboard changed

Only for a moment. Minne saves every item and every type on the pasteboard — not
just the string, so a copied image comes back as an image — puts the draft
there, pastes, and restores the lot about six-tenths of a second later. The
delay is deliberate: the target app reads the pasteboard when it gets round to
the synthetic ⌘V, and restoring immediately would paste your old clipboard
instead of the draft.

If something interrupts that window you can lose a clipboard item. Note that
this path is not rare — **all web content uses it**, because an accessibility
write into a browser or Electron editor does not survive the next repaint.

## The panel vanished mid-draft

An app switch dismisses it. That is intentional — the panel points at a caret in
a specific window, and the caret is gone once another app takes focus. Anything
that steals focus counts, including a meeting app raising a window on its own.

Escape dismisses it too.

## What I type in the guidance field goes into the document behind it

The panel has to borrow the keyboard from the app you are in to run the guidance
field and the draft editor, and occasionally the window server will not hand it
over — most reliably when the screen is locked. Minne has a failsafe for exactly
this: if key status does not arrive it closes the field rather than letting your
typing land in your document. Unlock and try again.

## A steer never becomes a standing rule

Three things to check:

- **The threshold is three, per context** — and the context is the domain (or
  the app), narrowed by recipient. Three "shorter"s spread across three
  different sites are three separate counts of one.
- **Normalisation is mechanical.** `shorter` and `Shorter.` pool; `shorter
  please` is a different steer. Say it the same way.
- **Another take (⌘R) never counts**, and a steer longer than 200 characters is
  treated as a one-off.

See [Telling it what you want](/guides/instructions#what-you-keep-asking-for-becomes-a-rule).

## A drafted email addressed the wrong person, or nobody

Minne only guesses a recipient when the window title genuinely names one —
Slack, Discord, Messages and LinkedIn messaging. A Mail or Gmail window title
carries the *subject* (and, in Gmail's case, your own address), so Minne
deliberately guesses nothing there rather than guess wrong. Name the person in
the field and tap, or steer the draft afterwards.

## A press got swallowed while Minne was busy

macOS switches off an event tap that blocks for too long. Minne's capture pass
walking a large window has been measured doing exactly that; the tap re-enables
itself immediately, but the keypress in flight is lost. Tap again.

## The memory folder is empty, or nothing new appears

- **Capture may be paused.** The menu bar shows the state, and Settings →
  Privacy has the pause controls. A pause set to "until I resume" stays until
  you resume it.
- **The app may be blacklisted.** Check "Never capture these" in Settings →
  Privacy for the app or domain in question.
- **Sync may not have run yet.** Raw captures land in `sources/` immediately;
  they become wiki pages only when the distillation pass runs. "Sync Now" in
  Settings forces one.
- **You may not be signed in.** Distillation is a model job. Without a provider
  it is skipped, and captures simply accumulate.

## Sign-in fails or expires

Check Settings → Account. Signing out and back in re-runs the OAuth exchange
with your provider. If your subscription itself has lapsed or been rate-limited,
Minne cannot tell you much beyond what the provider returned — switching to an
API key or a local model is the reliable fallback. See
[Choose your AI](/start/provider).

## macOS says the app is damaged, or refuses to open it

That is quarantine, not damage. It happens to builds that are not notarized —
your own build from source, for instance — after they travel through a browser
or a chat app.

```sh
xattr -dr com.apple.quarantine /Applications/Minne.app
```

Or open it once with right-click → Open. Releases published from CI are signed
and notarized and should not need this.

## Still stuck

The [source](https://github.com/mandgie/minne) is the final word, and
[issues](https://github.com/mandgie/minne/issues) is where to say what broke.
Include the app you were in — that detail solves most of these.
