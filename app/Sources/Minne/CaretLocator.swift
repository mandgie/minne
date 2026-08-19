import AppKit
import ApplicationServices

/// Where the user is typing, at the moment the Minne key was tapped, and what
/// was in front of them.
///
/// Everything a draft is built from is read once, here, before the overlay is
/// even on screen: the field, the selection, the window around it. The user
/// keeps typing while the model works, so anything read later would describe a
/// different moment than the one they pressed the key in.
struct CaretTarget {
    let bundleIdentifier: String
    let appName: String
    let anchor: CaretAnchor
    var field = FieldSnapshot()
    /// The element to insert into. Nil in tests, and in any app that would not
    /// name its focused element.
    var handle: FocusedFieldHandle?
    /// Whether the focused element lives inside an `AXWebArea` — a browser tab,
    /// but also an Electron app or an embedded web view. It decides how the
    /// draft goes in; see `InsertionStrategy`.
    var isWebContent = false
    /// The web area's address, when there is one and it is a web URL — query
    /// and fragment already stripped (see `PageURL.sanitize`). "Google Chrome"
    /// says almost nothing about the register a draft should hit; x.com vs
    /// github.com is the context that actually matters, so this rides to the
    /// brain for the prompt and for domain-keyed style pages.
    var pageURL: String?

    /// Which insertion paths this target allows.
    var strategy: InsertionStrategy {
        InsertionPolicy.strategy(bundleIdentifier: bundleIdentifier, isWebContent: isWebContent)
    }

    /// What the key would do with this target, decided from the AX state alone.
    var mode: DraftMode {
        DraftMode.detect(selection: field.selection, fieldText: field.text)
    }

    /// The correspondent, when the window title names one (Slack, Messages).
    var recipient: String? {
        RecipientHint.from(bundleIdentifier: bundleIdentifier, windowTitle: field.windowTitle)
    }

    var logSummary: String {
        "\(appName) — \(mode.rawValue), \(isWebContent ? "web content" : "native"), "
            + "caret from \(anchor.source.rawValue) at "
            + "(\(Int(anchor.rect.minX)), \(Int(anchor.rect.minY))), "
            + "\(field.text.count) chars in the field, \(field.windowText.count) around it"
    }
}

/// The Minne key's one impure seam. Everything that asks the system where the
/// caret is lives behind it, so `MinneKeyController`'s rules can be driven by a
/// scripted fake — the same split `FocusedWindowSource` makes for capture.
@MainActor
protocol CaretLocating: AnyObject {
    /// The focused text element's caret, or nil when there is nothing to
    /// anchor to: no text focus, a password field, or Minne itself in front.
    func locateCaret() -> CaretTarget?

    /// The pid of the app the last `locateCaret()` just asked to wake, when
    /// that call still came up empty — the one nil worth retrying once the
    /// tree has had time to build (US-104). Nil after every other locate.
    var lastLocateWokeApp: pid_t? { get }
}

extension CaretLocating {
    var lastLocateWokeApp: pid_t? { nil }
}

/// Real `CaretLocating`: the frontmost app's focused Accessibility element,
/// its caret bounds, and the fallbacks for when an app will not say.
///
/// Glue, like `AccessibilityWindowSource` — not exercised by `swift test`,
/// which has no trusted process and no window server. The decisions it makes
/// are all in `FocusedTextElement` and `CaretAnchor`, which are.
@MainActor
final class AccessibilityCaretLocator: CaretLocating {
    /// Shorter than capture's 2 s: this one runs between the user's keypress
    /// and the overlay appearing, so a slow app should cost a dropped press
    /// rather than a visible stall.
    private static let messagingTimeout: Float = 1

    /// Bytes of surrounding window text one press may read. Enough for a mail
    /// thread or a chat channel; far below what capture takes, because this one
    /// runs while the user waits and every byte of it is sent to the model.
    private static let windowByteBudget = 12_000

    private var cachedApp: (pid: pid_t, element: AXUIElement)?
    /// The same AX tree walk capture uses, for the text around the caret.
    /// Constructed lazily and never told to observe — the Minne key reads the
    /// window on demand, it does not watch it.
    private lazy var windowSource = AccessibilityWindowSource()

    func locateCaret() -> CaretTarget? {
        lastLocateWokeApp = nil
        guard let running = NSWorkspace.shared.frontmostApplication else { return nil }
        let pid = running.processIdentifier
        // Right-Option inside Minne's own chat window is just Option.
        guard pid != ProcessInfo.processInfo.processIdentifier else { return nil }

        let app = appElement(for: pid)
        guard let focused = focusedElement(of: app, pid: pid) else { return nil }

        let role = string(focused, kAXRoleAttribute)
        let subrole = string(focused, kAXSubroleAttribute)
        let kind = FocusedTextElement.kind(
            role: role, subrole: subrole,
            supportsSelectedTextRange: hasAttribute(focused, kAXSelectedTextRangeAttribute))
        switch kind {
        case .secure:
            BrainClient.log("minne key: ignored — the focused field is a password field")
            return nil
        case .other:
            return nil
        case .text:
            break
        }

        guard
            let anchor = CaretAnchor.resolve(
                caret: caretBounds(of: focused),
                element: frame(of: focused),
                window: element(app, kAXFocusedWindowAttribute).flatMap { frame(of: $0) })
        else { return nil }

        let webArea = webArea(from: focused, role: role)
        let bundleIdentifier = running.bundleIdentifier ?? "unknown"
        // The web area is the honest URL source, but deep editors (X's
        // compose box) can bury the focus beyond any sane ancestor walk. In a
        // known browser the focused *window* carries the address too — and
        // only there is the fallback safe, because a random app's window URL
        // (a document path) is not a page.
        var pageURL = webArea.flatMap(pageURL(of:))
        if pageURL == nil, InsertionPolicy.webBundleIdentifiers.contains(bundleIdentifier),
            let window = element(app, kAXFocusedWindowAttribute)
        {
            pageURL = self.pageURL(of: window)
        }
        return CaretTarget(
            bundleIdentifier: bundleIdentifier,
            appName: running.localizedName ?? "Unknown",
            anchor: anchor,
            field: snapshot(of: focused),
            handle: FocusedFieldHandle(element: focused),
            isWebContent: webArea != nil,
            pageURL: pageURL)
    }

    /// The role that means "this is a rendered web page".
    private static let webAreaRole = "AXWebArea"

    // MARK: - Waking a Chromium accessibility tree

    /// Chromium's switch for forcing its accessibility tree on.
    private static let manualAccessibilityAttribute = "AXManualAccessibility"

    /// Apps already asked to wake, so the set is tried once per app run.
    private var wokenApps: Set<pid_t> = []

    /// See `CaretLocating`. Set when the last locate flipped the wake switch
    /// and *still* found no focus — the tree was dark and is now building.
    private(set) var lastLocateWokeApp: pid_t?

    /// The app's focused element, waking a dark Chromium tree when it has none.
    ///
    /// Chromium keeps its accessibility tree switched off until it detects an
    /// assistive client, and while it is off `AXFocusedUIElement` answers
    /// nothing app-wide — a caret blinking in Slack, Chrome or any Electron
    /// app is invisible to us (verified live in Slack; GOTCHAS records the
    /// same for VS Code). `AXManualAccessibility` is Chromium's documented
    /// switch for exactly this, and other apps ignore it harmlessly, so it is
    /// set for whatever app will not name its focus rather than kept behind a
    /// bundle-id list. The tree builds asynchronously, though: the immediate
    /// retry sometimes lands, but a press that found the tree dark may still
    /// come up empty — `lastLocateWokeApp` then tells the controller this nil
    /// is worth one delayed retry (US-104).
    private func focusedElement(of app: AXUIElement, pid: pid_t) -> AXUIElement? {
        if let focused = element(app, kAXFocusedUIElementAttribute) { return focused }
        guard wokenApps.insert(pid).inserted else { return nil }
        AXUIElementSetAttributeValue(
            app, Self.manualAccessibilityAttribute as CFString, kCFBooleanTrue)
        BrainClient.log(
            "minne key: no focused element — set \(Self.manualAccessibilityAttribute), retrying")
        let retried = element(app, kAXFocusedUIElementAttribute)
        if retried == nil { lastLocateWokeApp = pid }
        return retried
    }

    /// Walks `AXParent` looking for a web area.
    ///
    /// Precise where a bundle-id list is a guess: it says yes to an Electron
    /// app's editor and to an embedded web view, and no to a browser's own
    /// address bar, which is a native field. Measured at 1.3 ms for the full
    /// twelve levels of a Chrome tab — the depth cap is there for a tree with a
    /// cycle in it, not for the cost.
    private func webArea(from element: AXUIElement, role: String?) -> AXUIElement? {
        if role == Self.webAreaRole { return element }
        var current = element
        for _ in 0..<Self.ancestorDepthLimit {
            guard let parent = self.element(current, kAXParentAttribute) else { return nil }
            if string(parent, kAXRoleAttribute) == Self.webAreaRole { return parent }
            current = parent
        }
        return nil
    }

    /// The element's address — `AXURL` (a CFURL, same read capture makes),
    /// else `AXDocument` (Chrome's window puts the tab's URL there) —
    /// sanitized down to scheme + host + path.
    private func pageURL(of element: AXUIElement) -> String? {
        let value = copyValue(element, kAXURLAttribute) ?? copyValue(element, "AXDocument")
        guard let value else { return nil }
        let raw = (value as? URL)?.absoluteString ?? (value as? String)
        return raw.flatMap(PageURL.sanitize)
    }

    /// A plain Chrome tab is ~12 levels; X's compose editor overshoots 16
    /// (measured live 2026-08-19: the walk missed and the press read as
    /// native). The cap is for a tree with a cycle in it, not for cost —
    /// 48 parent hops is still well under a millisecond.
    private static let ancestorDepthLimit = 48

    // MARK: - The field, as it stands

    /// Reads the focused element and the window around it.
    ///
    /// The selection is read as text *and* as a range: the text is what the
    /// model rewrites, the range is what the writer replaces. An app that gives
    /// one without the other still works — the range falls back to the whole
    /// field, which is what "replace the selection" degrades to when nobody
    /// will say where it is.
    private func snapshot(of focused: AXUIElement) -> FieldSnapshot {
        var snapshot = FieldSnapshot()
        snapshot.text = string(focused, kAXValueAttribute) ?? ""
        snapshot.selection = string(focused, kAXSelectedTextAttribute) ?? ""
        if let range = selectedRange(of: focused) {
            snapshot.selectedRange = NSRange(location: range.location, length: range.length)
        }
        if let candidate = windowSource.readFocusedWindow(byteBudget: Self.windowByteBudget) {
            snapshot.windowTitle = candidate.window.windowTitle
            snapshot.windowText = candidate.text
        }
        return snapshot
    }

    // MARK: - Caret bounds

    /// `AXBoundsForRange` over the selection. Apps that only implement the
    /// parameterized attribute for non-empty ranges answer nothing for a plain
    /// insertion point, so a zero-length selection is retried as the single
    /// character after it — which lands on the same line, at the same place.
    private func caretBounds(of element: AXUIElement) -> CGRect? {
        guard let selection = selectedRange(of: element) else { return nil }
        if let rect = bounds(of: element, range: selection), CaretAnchor.isUsableCaret(rect) {
            return rect
        }
        guard selection.length == 0 else { return nil }
        return bounds(of: element, range: CFRange(location: selection.location, length: 1))
    }

    private func selectedRange(of element: AXUIElement) -> CFRange? {
        guard let value = copyValue(element, kAXSelectedTextRangeAttribute),
            CFGetTypeID(value) == AXValueGetTypeID()
        else { return nil }
        var range = CFRange()
        guard AXValueGetValue(value as! AXValue, .cfRange, &range) else { return nil }
        return range
    }

    private func bounds(of element: AXUIElement, range: CFRange) -> CGRect? {
        var range = range
        guard let parameter = AXValueCreate(.cfRange, &range) else { return nil }
        var raw: CFTypeRef?
        guard
            AXUIElementCopyParameterizedAttributeValue(
                element, kAXBoundsForRangeParameterizedAttribute as CFString, parameter, &raw)
                == .success,
            let raw, CFGetTypeID(raw) == AXValueGetTypeID()
        else { return nil }
        var rect = CGRect.zero
        guard AXValueGetValue(raw as! AXValue, .cgRect, &rect) else { return nil }
        return rect
    }

    /// `AXFrame` where the app has it, position + size everywhere else.
    private func frame(of element: AXUIElement) -> CGRect? {
        if let value = copyValue(element, "AXFrame"), CFGetTypeID(value) == AXValueGetTypeID() {
            var rect = CGRect.zero
            if AXValueGetValue(value as! AXValue, .cgRect, &rect) { return rect }
        }
        guard let positionValue = copyValue(element, kAXPositionAttribute),
            CFGetTypeID(positionValue) == AXValueGetTypeID(),
            let sizeValue = copyValue(element, kAXSizeAttribute),
            CFGetTypeID(sizeValue) == AXValueGetTypeID()
        else { return nil }
        var origin = CGPoint.zero
        var size = CGSize.zero
        guard AXValueGetValue(positionValue as! AXValue, .cgPoint, &origin),
            AXValueGetValue(sizeValue as! AXValue, .cgSize, &size)
        else { return nil }
        return CGRect(origin: origin, size: size)
    }

    // MARK: - AX accessors

    private func appElement(for pid: pid_t) -> AXUIElement {
        if let cachedApp, cachedApp.pid == pid { return cachedApp.element }
        let element = AXUIElementCreateApplication(pid)
        AXUIElementSetMessagingTimeout(element, Self.messagingTimeout)
        cachedApp = (pid, element)
        return element
    }

    private func copyValue(_ element: AXUIElement, _ attribute: String) -> CFTypeRef? {
        var value: CFTypeRef?
        guard AXUIElementCopyAttributeValue(element, attribute as CFString, &value) == .success
        else { return nil }
        return value
    }

    private func string(_ element: AXUIElement, _ attribute: String) -> String? {
        copyValue(element, attribute) as? String
    }

    private func element(_ element: AXUIElement, _ attribute: String) -> AXUIElement? {
        guard let value = copyValue(element, attribute),
            CFGetTypeID(value) == AXUIElementGetTypeID()
        else { return nil }
        return (value as! AXUIElement)
    }

    /// Asks whether the attribute exists rather than reading it: an empty text
    /// field still advertises `AXSelectedTextRange`, and reading a big document
    /// just to learn that is a wasted round trip.
    private func hasAttribute(_ element: AXUIElement, _ attribute: String) -> Bool {
        var names: CFArray?
        guard AXUIElementCopyAttributeNames(element, &names) == .success,
            let names = names as? [String]
        else { return false }
        return names.contains(attribute)
    }
}
