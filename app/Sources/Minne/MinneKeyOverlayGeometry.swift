import CoreGraphics

/// The overlay panel's geometry, decided once per presentation (US-203).
///
/// A panel that re-derived its position from scratch on every state change
/// jumped: a draft arriving could flip it to the other side of the caret, and
/// a caret near a screen edge made every resize a re-clamp. This type is the
/// decision, kept: one width and one anchored edge are claimed when the panel
/// appears, and every later size only chooses a height — the frame grows away
/// from the caret with the anchored edge pinned exactly where it was.
///
/// Pure, and in AppKit coordinates throughout: the caret rect arrives already
/// flipped (`OverlayPlacement.flipped`), and what comes out is an `NSWindow`
/// frame. Nothing here touches a screen or a window, which is what makes the
/// growth rules testable.
struct MinneKeyOverlayGeometry: Equatable, Sendable {
    /// Which way the panel grows when its content gets taller.
    enum Growth: String, Equatable, Sendable {
        /// Below the caret: the top edge is pinned, growth extends downward.
        case down
        /// Above the caret: the bottom edge is pinned, growth extends upward.
        case up
    }

    /// Gap between the caret and the overlay's nearest edge.
    static let gap: CGFloat = 8

    /// The one width, claimed at presentation and kept for the panel's life.
    var width: CGFloat
    /// The left edge, clamped on screen once — a taller panel never slides
    /// sideways.
    var x: CGFloat
    /// The pinned edge's y: the frame's top (`maxY`) when growing down, its
    /// bottom (`minY`) when growing up. This is the edge nearest the caret,
    /// and it is the thing the user's eye is anchored to.
    var anchor: CGFloat
    var growth: Growth

    /// Claims a geometry for a panel of `size` at `caret`: just under the
    /// caret when it fits there, above when only above fits — and below with
    /// clamping when neither does, which keeps the panel next to the caret
    /// rather than jumping to the far edge of the screen.
    static func claim(size: CGSize, caret: CGRect, visible: CGRect) -> MinneKeyOverlayGeometry {
        let x = min(max(caret.minX, visible.minX), max(visible.minX, visible.maxX - size.width))
        let below = caret.minY - gap
        let above = caret.maxY + gap
        let fitsBelow = below - size.height >= visible.minY
        let fitsAbove = above + size.height <= visible.maxY
        if fitsBelow || !fitsAbove {
            return MinneKeyOverlayGeometry(width: size.width, x: x, anchor: below, growth: .down)
        }
        return MinneKeyOverlayGeometry(width: size.width, x: x, anchor: above, growth: .up)
    }

    /// The frame for a content height, anchored edge pinned. The anchor moves
    /// only when the grown panel would otherwise leave the visible frame —
    /// and then by the least amount that keeps it on screen.
    func frame(height: CGFloat, visible: CGRect) -> CGRect {
        let wanted = growth == .down ? anchor - height : anchor
        let y = min(max(wanted, visible.minY), max(visible.minY, visible.maxY - height))
        return CGRect(x: x, y: y, width: width, height: height)
    }
}

/// Where a borrowed field's scroller may come to rest (US-203).
///
/// A text view scrolled "to the end" by AppKit rests wherever the caret rect
/// landed — measured at a point and a half past the line boundary, which
/// painted the descender tips of the scrolled-off line along the field's top
/// edge. A viewport whose top edge only ever sits on a slot boundary — under
/// the line-spacing moat, where even a glyph's raster bleed has ended — never
/// shows a sliver of the line above. The viewport heights are shaped to agree
/// (`GuidanceRow.fieldHeight` subtracts the trailing spacing from the cap), so
/// a field scrolled to its very end also rests on a slot boundary.
enum OverlayScrollRest {
    /// Snaps a proposed scroll offset to the nearest slot boundary, clamped
    /// to what the document allows. `pitch` is one line's slot: its height
    /// plus the paragraph's line spacing.
    static func offset(proposing y: CGFloat, pitch: CGFloat, limit: CGFloat) -> CGFloat {
        let ceiling = max(0, limit)
        guard pitch > 0 else { return min(max(0, y), ceiling) }
        return min(max(0, (y / pitch).rounded() * pitch), ceiling)
    }
}
