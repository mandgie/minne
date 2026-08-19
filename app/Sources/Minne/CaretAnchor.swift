import CoreGraphics
import Foundation

/// What the focused Accessibility element is, as far as the Minne key cares.
///
/// Pure so the rule that matters most — never wake up inside a password field
/// — can be tested without a real window. The AX glue in `CaretLocator` reads
/// the attributes; this decides what they mean.
enum FocusedTextElement {
    enum Kind: Equatable, Sendable {
        /// Somewhere the user types, and where Minne may appear.
        case text
        /// A password field. The Minne key must do nothing at all here.
        case secure
        /// A button, a list, a canvas — nothing to draft into.
        case other
    }

    /// Roles that are text by name. `AXWebArea` is included because a
    /// contenteditable region in a browser often focuses as the web area
    /// itself rather than as a field inside it.
    static let textRoles: Set<String> = [
        "AXTextField", "AXTextArea", "AXComboBox", "AXWebArea", "AXSearchField",
    ]

    /// `supportsSelectedTextRange` is the broad test: any element that can tell
    /// us where its caret is, is somewhere the user types — which is how VS
    /// Code, Electron apps and web editors qualify without being enumerated.
    /// The secure check runs first and unconditionally: a WebKit password input
    /// is an `AXTextField` whose *subrole* is what gives it away, and it
    /// answers `AXSelectedTextRange` like any other field.
    static func kind(role: String?, subrole: String?, supportsSelectedTextRange: Bool) -> Kind {
        if SecureField.isSecure(role) || SecureField.isSecure(subrole) { return .secure }
        guard let role else { return supportsSelectedTextRange ? .text : .other }
        if textRoles.contains(role) { return .text }
        return supportsSelectedTextRange ? .text : .other
    }
}

/// Where the overlay should appear, in Accessibility screen coordinates
/// (origin at the top-left of the primary display, y growing downwards).
///
/// Conversion to AppKit's coordinates and the on-screen placement are separate,
/// pure steps below — the AX layer never does arithmetic it cannot be tested on.
struct CaretAnchor: Equatable, Sendable {
    /// Where the rectangle came from, which is worth logging: an `.element`
    /// anchor means the app refused to tell us where its caret is, and that is
    /// the difference between an overlay at the insertion point and one at the
    /// top-left of the field.
    enum Source: String, Sendable {
        case caret
        case element
        case window
    }

    var rect: CGRect
    var source: Source

    /// Widest a synthetic caret gets: for a tall text area, the first line is a
    /// much better guess at where the user is than the whole box.
    static let syntheticCaretHeight: CGFloat = 20

    /// Picks the best anchor available, in order: the caret's own bounds, the
    /// focused element's leading edge, the window's. Returns nil when the app
    /// gave us nothing usable at all.
    static func resolve(caret: CGRect?, element: CGRect?, window: CGRect?) -> CaretAnchor? {
        if let caret, isUsableCaret(caret) { return CaretAnchor(rect: caret, source: .caret) }
        if let element, isUsableFrame(element) {
            return CaretAnchor(rect: leadingEdge(of: element), source: .element)
        }
        if let window, isUsableFrame(window) {
            return CaretAnchor(rect: leadingEdge(of: window), source: .window)
        }
        return nil
    }

    /// A caret rectangle is believable when it has height and sane numbers.
    /// Zero width is normal — that is what an insertion point is. The origin
    /// test catches the common web-area answer of an all-zero rect: a caret at
    /// the exact top-left pixel of the primary display is behind the menu bar,
    /// so it can only mean "I don't know".
    static func isUsableCaret(_ rect: CGRect) -> Bool {
        guard rect.width.isFinite, rect.height.isFinite else { return false }
        guard rect.origin.x.isFinite, rect.origin.y.isFinite else { return false }
        guard rect.height > 0 else { return false }
        return rect.origin != .zero
    }

    static func isUsableFrame(_ rect: CGRect) -> Bool {
        guard rect.width.isFinite, rect.height.isFinite else { return false }
        guard rect.origin.x.isFinite, rect.origin.y.isFinite else { return false }
        return rect.width > 0 && rect.height > 0
    }

    /// A caret-shaped rectangle at the top-left of a box — where the first
    /// character of an empty field sits.
    private static func leadingEdge(of frame: CGRect) -> CGRect {
        CGRect(
            x: frame.minX, y: frame.minY,
            width: 0, height: min(frame.height, syntheticCaretHeight))
    }
}

/// The coordinate bridge between the two worlds an anchor lives in. Where the
/// panel goes is `MinneKeyOverlayGeometry`'s decision — claimed once per
/// presentation, so a growing panel keeps its anchored edge.
enum OverlayPlacement {
    /// Accessibility coordinates are top-left-origin; AppKit's are
    /// bottom-left-origin, both anchored on the primary display. `primaryHeight`
    /// is that display's full height (`NSScreen.screens[0].frame.height`) — not
    /// the visible frame, which excludes the menu bar and would shift
    /// everything by its height.
    static func flipped(_ rect: CGRect, primaryHeight: CGFloat) -> CGRect {
        CGRect(
            x: rect.origin.x, y: primaryHeight - rect.origin.y - rect.height,
            width: rect.width, height: rect.height)
    }
}
