import AppKit

/// First-run placement of the menu-bar item.
///
/// A fresh install with no stored position gets the leftmost status slot, and
/// on a notched MacBook with a full menu bar macOS silently declines to render
/// items in the region the notch (and the items already there) claims — the
/// app runs but looks absent, with nothing to click. Seeding a preferred
/// position before the `NSStatusItem` exists puts the item inside the
/// always-rendered right cluster (Wi-Fi, battery, Control Center, clock)
/// instead, where macOS draws it before anything else.
enum StatusItemPlacement {
    /// The key AppKit itself persists the item's position under; "Item-0" is
    /// the autosave name of an app's first status item. Once the key exists —
    /// whether we wrote it or the user ⌘-dragged the item — macOS's stored
    /// value wins forever, so the seed only ever fills an absent key.
    static let preferredPositionKey = "NSStatusItem Preferred Position Item-0"

    /// Distance from the RIGHT edge of the screen, in points. 290 is measured,
    /// not derived: on a 1512 pt notched MacBook Pro with a full menu bar it
    /// landed the item visibly among the right cluster (at x ≈ 1166) where the
    /// default leftmost slot rendered nothing at all.
    static let rightClusterOffset: Double = 290

    /// The position to seed, or nil to leave the defaults untouched.
    ///
    /// Clamping to a quarter of the screen width keeps the seed safely right
    /// of the notch on any scaled resolution: the notch is centred and never
    /// reaches past ~40% of the width from either edge, so width/4 from the
    /// right is always renderable, while 290 stays the measured sweet spot on
    /// standard widths (1470–1728 pt).
    static func seedPosition(
        hasStoredPosition: Bool, hasNotch: Bool, screenWidth: Double
    ) -> Double? {
        guard !hasStoredPosition, hasNotch, screenWidth > 0 else { return nil }
        return min(rightClusterOffset, (screenWidth / 4).rounded())
    }

    /// Width of the built-in notched display, or nil when no screen has a
    /// notch. `safeAreaInsets.top` is only non-zero on notched panels (a plain
    /// menu bar is not a safe-area inset); `auxiliaryTopLeftArea` is the
    /// second, equivalent signal.
    @MainActor
    static func notchedScreenWidth() -> Double? {
        let notched = NSScreen.screens.first {
            $0.safeAreaInsets.top > 0 || $0.auxiliaryTopLeftArea != nil
        }
        guard let notched else { return nil }
        return Double(notched.frame.width)
    }

    /// Must run before the `NSStatusItem` is created — the status bar reads
    /// the key at creation time.
    @MainActor
    static func applyDefaultIfNeeded(
        defaults: UserDefaults = .standard, notchedScreenWidth: Double? = notchedScreenWidth()
    ) {
        let hasStored = defaults.object(forKey: preferredPositionKey) != nil
        guard
            let position = seedPosition(
                hasStoredPosition: hasStored, hasNotch: notchedScreenWidth != nil,
                screenWidth: notchedScreenWidth ?? 0)
        else { return }
        defaults.set(position, forKey: preferredPositionKey)
        BrainClient.log(
            "first run on a notched display — seeding status item \(Int(position)) pt from the right"
        )
    }
}
