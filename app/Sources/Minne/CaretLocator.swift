import AppKit
import ApplicationServices

/// Where the user is typing, at the moment the Minne key was tapped.
struct CaretTarget: Equatable, Sendable {
    let bundleIdentifier: String
    let appName: String
    let anchor: CaretAnchor

    var logSummary: String {
        "\(appName) — caret from \(anchor.source.rawValue) at "
            + "(\(Int(anchor.rect.minX)), \(Int(anchor.rect.minY)))"
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

    private var cachedApp: (pid: pid_t, element: AXUIElement)?

    func locateCaret() -> CaretTarget? {
        guard let running = NSWorkspace.shared.frontmostApplication else { return nil }
        let pid = running.processIdentifier
        // Right-Option inside Minne's own chat window is just Option.
        guard pid != ProcessInfo.processInfo.processIdentifier else { return nil }

        let app = appElement(for: pid)
        guard let focused = element(app, kAXFocusedUIElementAttribute) else { return nil }

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

        return CaretTarget(
            bundleIdentifier: running.bundleIdentifier ?? "unknown",
            appName: running.localizedName ?? "Unknown",
            anchor: anchor)
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
