import AppKit

/// The Minne key overlay's colours: white and blue.
///
/// Three rules hold the whole panel together. The surface is white (near-black
/// in the dark) and nothing else fills anything — structure comes from
/// whitespace, type and a hairline, never from a grey box. Ink is blackish
/// rather than grey, thinned with alpha when it is meant to recede. And the
/// accent is one committed blue, not `controlAccentColor`: the accent belongs to
/// the user, and on a graphite or pink Mac a panel tinted with it has no
/// identity at all.
///
/// Every colour here is dynamic (`NSColor(name:dynamicProvider:)`), so a layer
/// that re-reads `.cgColor` in `viewDidChangeEffectiveAppearance` picks up the
/// other appearance — a `CGColor` is a resolved colour and never a dynamic one.
enum OverlayPalette {
    /// The panel itself.
    static let surface = dynamic(
        light: NSColor(srgbRed: 1, green: 1, blue: 1, alpha: 1),
        dark: NSColor(srgbRed: 0.086, green: 0.094, blue: 0.110, alpha: 1))

    /// The panel's own edge. Blue-tinted rather than neutral, so even the
    /// quietest line in the panel belongs to the palette — and a shade stronger
    /// than the rule inside, because on a white page it is all that separates
    /// the panel from the document under it.
    static let edge = dynamic(
        light: NSColor(srgbRed: 0.04, green: 0.10, blue: 0.25, alpha: 0.16),
        dark: NSColor(srgbRed: 1, green: 1, blue: 1, alpha: 0.15))

    /// The one rule inside the panel.
    static let hairline = dynamic(
        light: NSColor(srgbRed: 0.04, green: 0.10, blue: 0.25, alpha: 0.11),
        dark: NSColor(srgbRed: 1, green: 1, blue: 1, alpha: 0.12))

    /// The draft and the app's own name: blackish, not black.
    static let ink = dynamic(
        light: NSColor(srgbRed: 0.07, green: 0.08, blue: 0.10, alpha: 1),
        dark: NSColor(srgbRed: 0.94, green: 0.95, blue: 0.96, alpha: 1))

    /// What Minne is doing, and the quiet buttons' labels.
    static let inkSecondary = dynamic(
        light: NSColor(srgbRed: 0.07, green: 0.08, blue: 0.10, alpha: 0.62),
        dark: NSColor(srgbRed: 1, green: 1, blue: 1, alpha: 0.60))

    /// The app being written into, and the dot before it.
    static let inkTertiary = dynamic(
        light: NSColor(srgbRed: 0.07, green: 0.08, blue: 0.10, alpha: 0.38),
        dark: NSColor(srgbRed: 1, green: 1, blue: 1, alpha: 0.36))

    /// The accent: the spark, the thinking dots, every hover.
    static let blue = dynamic(
        light: NSColor(srgbRed: 0.039, green: 0.361, blue: 0.871, alpha: 1),
        dark: NSColor(srgbRed: 0.36, green: 0.62, blue: 1, alpha: 1))

    /// The primary capsule. A shade deeper than the accent in the dark, where a
    /// glyph wants to be bright but white-on-blue wants contrast.
    static let blueFill = dynamic(
        light: NSColor(srgbRed: 0.039, green: 0.361, blue: 0.871, alpha: 1),
        dark: NSColor(srgbRed: 0.20, green: 0.45, blue: 0.92, alpha: 1))

    /// On the primary capsule.
    static let onBlue = dynamic(
        light: NSColor(srgbRed: 1, green: 1, blue: 1, alpha: 1),
        dark: NSColor(srgbRed: 1, green: 1, blue: 1, alpha: 1))

    /// A quiet button's edge — the capsule shape without a fill.
    static let quietEdge = dynamic(
        light: NSColor(srgbRed: 0.04, green: 0.10, blue: 0.25, alpha: 0.18),
        dark: NSColor(srgbRed: 1, green: 1, blue: 1, alpha: 0.18))

    /// A quiet button under the pointer: the accent, barely.
    static let blueWash = dynamic(
        light: NSColor(srgbRed: 0.039, green: 0.361, blue: 0.871, alpha: 0.07),
        dark: NSColor(srgbRed: 0.36, green: 0.62, blue: 1, alpha: 0.13))

    /// The same, pressed.
    static let blueWashPressed = dynamic(
        light: NSColor(srgbRed: 0.039, green: 0.361, blue: 0.871, alpha: 0.14),
        dark: NSColor(srgbRed: 0.36, green: 0.62, blue: 1, alpha: 0.22))

    /// The lines that stand in for the draft while the model writes it. Pale
    /// blue rather than grey — it is the accent at rest, not a placeholder grey.
    static let shimmer = dynamic(
        light: NSColor(srgbRed: 0.039, green: 0.361, blue: 0.871, alpha: 0.13),
        dark: NSColor(srgbRed: 0.36, green: 0.62, blue: 1, alpha: 0.19))

    /// Something went wrong. Warm and restrained, and only ever ink — the panel
    /// has no red fill and never grows one.
    static let warm = dynamic(
        light: NSColor(srgbRed: 0.62, green: 0.33, blue: 0.02, alpha: 1),
        dark: NSColor(srgbRed: 0.96, green: 0.74, blue: 0.38, alpha: 1))

    private static func dynamic(light: NSColor, dark: NSColor) -> NSColor {
        NSColor(name: nil) { appearance in
            appearance.bestMatch(from: [.aqua, .darkAqua]) == .darkAqua ? dark : light
        }
    }
}
