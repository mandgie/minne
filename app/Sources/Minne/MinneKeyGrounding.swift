/// The muted line under a finished draft saying what grounded it: the wiki
/// pages the brain prefetched for the correspondent, and the style page the
/// draft was written to sound like.
///
/// Pure string-building, so the rules are testable without a window server.
/// The label that renders the line truncates at the pixel; the character cap
/// here is the coarse cut that keeps an absurd page list from being carried
/// around at all. Both exist because the line must never wrap.
enum MinneKeyGrounding {
    /// Characters of line before it is cut with an ellipsis. Wider than the
    /// label can show, so the label's own tail truncation decides what the
    /// user sees; this only bounds the string itself.
    static let maxCharacters = 160

    /// `wiki/ingrid-berg.md` → `ingrid-berg`: the page as the user names it,
    /// not as the wiki files it.
    static func slug(_ path: String) -> String {
        let name = path.split(separator: "/").last.map(String.init) ?? path
        return name.hasSuffix(".md") ? String(name.dropLast(3)) : name
    }

    /// `wiki/style/style-slack.md` → `slack`: a style page's slug is all
    /// prefix, so what is left after it is the context the style belongs to.
    static func styleSlug(_ path: String) -> String {
        let base = slug(path)
        guard base.hasPrefix("style-") else { return base }
        let context = String(base.dropFirst("style-".count))
        return context.isEmpty ? base : context
    }

    /// The line itself, or nil when there is nothing to say — a draft grounded
    /// in nothing gets no line at all rather than an empty one.
    static func line(memoryPages: [String], stylePage: String?) -> String? {
        var parts: [String] = []
        let pages = memoryPages.map(slug).filter { !$0.isEmpty }
        if !pages.isEmpty {
            parts.append("from memory: \(pages.joined(separator: ", "))")
        }
        if let stylePage {
            let style = styleSlug(stylePage)
            if !style.isEmpty { parts.append("style: \(style)") }
        }
        guard !parts.isEmpty else { return nil }
        let line = parts.joined(separator: " · ")
        guard line.count > maxCharacters else { return line }
        return "\(line.prefix(maxCharacters - 1))…"
    }
}
