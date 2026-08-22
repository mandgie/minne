import AppKit
import CoreText

/// The product's visual tokens, in one place.
///
/// Two faces are bundled (`Resources/Fonts`, both OFL): Familjen Grotesk for
/// display type and IBM Plex Mono for the small uppercase labels. They are the
/// faces minne.sh is set in, so the app and the site read as one product.
/// Everything else — body copy, controls — stays San Francisco, because prose
/// inside a macOS window should look like macOS.
///
/// Registration can fail (a stripped bundle, a corrupt file). It is not worth
/// crashing over: every accessor falls back to a system font of the same size
/// and weight, so a failed registration costs personality, never legibility.
enum MinneTheme {

    // MARK: - Colour
    //
    // The app is a white surface: `spark-ink` (#0A5CDE) is the site's accent
    // deepened for paper. Only `ink` and `paper` follow the system appearance
    // — the accent is the brand's and stays put.

    /// #0A5CDE — the one accent. Buttons, live step, "what it does" marks.
    static let accent = NSColor(srgbRed: 0.039, green: 0.361, blue: 0.871, alpha: 1)
    /// #EDF3FE — accent wash, for the selected provider card.
    static let accentWash = NSColor(srgbRed: 0.929, green: 0.953, blue: 0.996, alpha: 1)
    /// The accent at rest on an already-visited step: present, not shouting.
    static let accentSpent = NSColor(srgbRed: 0.616, green: 0.733, blue: 0.925, alpha: 1)

    /// #0B0E14 — primary text.
    static let ink = NSColor(srgbRed: 0.043, green: 0.055, blue: 0.078, alpha: 1)
    /// #59626F — body copy and secondary rows.
    static let prose = NSColor(srgbRed: 0.349, green: 0.384, blue: 0.435, alpha: 1)
    /// #8A94A3 — labels, footnotes, upcoming steps.
    static let mute = NSColor(srgbRed: 0.541, green: 0.580, blue: 0.639, alpha: 1)

    /// #FFFFFF — the pane.
    static let paper = NSColor.white
    /// #F4F7FD — the rail, and the "never does" panel.
    static let rail = NSColor(srgbRed: 0.957, green: 0.969, blue: 0.992, alpha: 1)
    /// #E5EBF4 — hairlines.
    static let line = NSColor(srgbRed: 0.898, green: 0.922, blue: 0.957, alpha: 1)
    /// #EFF3F9 — the softer hairline inside panels.
    static let lineSoft = NSColor(srgbRed: 0.937, green: 0.953, blue: 0.976, alpha: 1)
    /// #C6D0E0 — the outline of a step not reached yet.
    static let sparkIdle = NSColor(srgbRed: 0.776, green: 0.816, blue: 0.878, alpha: 1)

    // MARK: - Type

    private static let displayName = "FamiljenGrotesk-SemiBold"
    private static let monoName = "IBMPlexMono-Medium"

    /// Registers the bundled faces with CoreText. Idempotent, and safe to call
    /// from `applicationDidFinishLaunching` before any view is built.
    static func registerFonts() {
        _ = fontsRegistered
    }

    /// `true` when both faces registered. Computed once; the `lazy` is what
    /// makes repeat calls free and keeps registration off every font lookup.
    private static let fontsRegistered: Bool = {
        let names = ["FamiljenGrotesk-SemiBold", "IBMPlexMono-Medium"]
        var allOK = true
        for name in names {
            guard
                let url = Bundle.module.url(
                    forResource: name, withExtension: "ttf", subdirectory: "Fonts")
            else {
                BrainClient.log("theme: \(name).ttf missing from the bundle — falling back to SF")
                allOK = false
                continue
            }
            var error: Unmanaged<CFError>?
            if !CTFontManagerRegisterFontsForURL(url as CFURL, .process, &error) {
                // Already-registered is the benign case: a second call, or a
                // face macOS already knows. Anything else is a real failure.
                let code = error.map { CFErrorGetCode($0.takeRetainedValue()) }
                if code != CTFontManagerError.alreadyRegistered.rawValue {
                    BrainClient.log("theme: could not register \(name) — falling back to SF")
                    allOK = false
                }
            }
        }
        return allOK
    }()

    /// Display face — titles and the wordmark. Falls back to SF at the same
    /// size and weight, which is Route A of the design: quieter, still correct.
    static func display(_ size: CGFloat) -> NSFont {
        registerFonts()
        return NSFont(name: displayName, size: size)
            ?? .systemFont(ofSize: size, weight: .semibold)
    }

    /// Utility face — the small uppercase labels only. Never body copy: at
    /// 9.5pt with wide tracking it is a label, and it stops being readable the
    /// moment it has to carry a sentence.
    static func mono(_ size: CGFloat) -> NSFont {
        registerFonts()
        return NSFont(name: monoName, size: size)
            ?? .monospacedSystemFont(ofSize: size, weight: .medium)
    }

    /// Body copy and controls: San Francisco, deliberately.
    static func body(_ size: CGFloat, _ weight: NSFont.Weight = .regular) -> NSFont {
        .systemFont(ofSize: size, weight: weight)
    }

    /// A label's tracked, uppercased string. The tracking is what makes 9.5pt
    /// mono read as a label rather than as shrunken code.
    static func label(_ text: String, color: NSColor) -> NSAttributedString {
        NSAttributedString(
            string: text.uppercased(),
            attributes: [
                .font: mono(9.5),
                .foregroundColor: color,
                .kern: 1.35,
            ])
    }
}
