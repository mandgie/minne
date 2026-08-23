---
title: Keys and shortcuts
description: Every key Minne listens for, when it listens, and the exact rule that separates a Minne key tap from ordinary use of the Option key.
---

Minne claims very little of your keyboard, and most of what it does claim it
claims only for the second or two an overlay is on screen. This page is the
complete list.

## Global

Five keys, and where each of them is live.

| Key | What it does | Where it works |
| --- | --- | --- |
| `⌥Space` | Open the chat window, or close it if it is already open. | Any app. |
| `right ⌥` | Wake Minne at the caret — a tap, not a hold. See below. | Any app. |
| `esc` | Close a Minne window. | Minne's own windows. |
| `⌘,` | Settings. | The menu-bar menu. |
| `⌘Q` | Quit Minne. | The menu-bar menu. |

The last two are the key equivalents printed beside **Settings…** and **Quit
Minne** in the menu, so they are there for the hand that has already opened
it. Minne is a menu-bar app with no application menu of its own; there is no
Minne ▸ Quit to reach them from.

`⌥Space` is on by default and can be switched off in Settings → General
("Open chat with ⌥Space"). The combination itself is not remappable. If another
app already owns it, registration fails and Settings says so — "⌥Space is
taken by another app — open chat from the menu bar instead" — rather than
leaving you with a key that silently does nothing.

It is a Carbon hotkey, which is why it works before Accessibility is granted:
Carbon hotkeys need no permission, and Minne must be able to open its own
window regardless of what you decided about capture.

## The Minne key, precisely

A tap is **right-Option down, then right-Option up, with nothing at all in
between, inside 0.3 seconds**.

Nothing at all means nothing: no other key, no second modifier, no mouse
click. Any of those turns the press into ordinary Option usage and Minne
ignores it. So does holding the key past the window.

That narrow definition is the entire trick. It is what keeps working:

- ⌥-typing on international layouts, where right-Option is AltGr and makes
  `@`, `€`, `~`, `\`.
- `⌥←` and `⌥→` to move by word, and their shifted selections.
- ⌥-click and ⌥-drag.
- Every other Option shortcut in every other app.

It is not a double-tap and there is no hold gesture; one clean tap is the
whole vocabulary. A second tap while the overlay is up dismisses it.

:::note
The tap never consumes the modifier event. Minne's event tap passes every
`flagsChanged` event through untouched, so the app underneath always sees
Option go down and come back up. Swallowing it would break ⌥-click and
⌥-drag system-wide, and would show the wrong items in any menu opened during
the press.
:::

## Choosing the trigger

Settings → General has **"Wake Minne at the caret with"**, a popup with
exactly two entries:

| Option | Effect |
| --- | --- |
| **Right Option (⌥)** | The default. The event tap is installed and watches for taps. |
| **Off** | The tap is torn down entirely. Nothing listens. |

There is no way to map the trigger to another key today. It is a popup rather
than a checkbox because a future release is expected to add one, not because
one is hiding.

Off is a real choice rather than a fallback. A held chord never fires anyway,
but on an AltGr layout some people would simply rather the key were not
listened to at all.

## What the trigger needs

- **Accessibility.** The key is read through an event tap and the draft is
  written back through the Accessibility APIs. Without the grant the trigger
  does not exist — see [First run](/start/first-run).
- **A focused text field.** Minne needs a caret to work at. A tap with nothing
  focused does nothing.
- **An app that is not blacklisted.** The Minne key honours the capture
  blacklist: an app whose contents may not become memory may not become a
  prompt either. See [Settings → Privacy](/reference/settings#privacy).

Secure text fields are refused outright, whatever the blacklist says.

## While the overlay is on screen

These keys belong to the app you are typing in the rest of the time. Minne
claims them only while the overlay is up, and only in the states where they
mean something — `⌘R` is Reload in every browser on the machine, and it goes
back to being Reload the moment the overlay closes.

| Key | What it does |
| --- | --- |
| `esc` | Dismiss the overlay. |
| `↩` or keypad Enter | Insert the draft into the field. |
| `⌘R` | Another take: regenerate the draft. |
| `Tab` | Move into the guidance field, to steer the next take. |
| `⌘E` | Edit the draft in place, before inserting it. |
| `⌘Z` | Undo the insertion Minne just made. |

`⌘Z` is claimed only when the undo is Minne's to give. A draft written through
the Accessibility APIs can be reversed exactly, selection and all, so Minne
takes the key. A draft that went in by the paste fallback is on the app's own
undo stack, so `⌘Z` stays the app's and Minne does not intercept it.
[Troubleshooting](/troubleshooting#undo-does-not-do-what-i-expect) has the
rest.

Modifiers disqualify rather than qualify here: `⌘↩` sends a message in half
the apps on this machine and `⇧⌘Z` is redo, so neither is Minne's. Plain
`↩` and plain `Tab` are only ever claimed while a draft is on screen and the
guidance field is not focused.

## Buttons on the overlay

Everything above has a button, for the times your hands are on the mouse.

| Button | Key |
| --- | --- |
| **Insert** | `↩` |
| **Copy** | — |
| **Undo** | `⌘Z` |
| **Retry** | — |
| **Dismiss** | `esc` |

A circular-arrow capsule sits alongside them, tooltipped **"Another take
(⌘R)"**.

Two things are clickable that do not look like buttons: the draft text itself,
which opens the in-place editor, and anywhere outside the overlay, which
dismisses it.

## Where to read next

[The Minne key](/guides/minne-key) is what these keys are actually for — how
the draft is built, what it is grounded in, and how the guidance field
changes it. [Chat](/guides/chat) covers the ⌥Space window.
