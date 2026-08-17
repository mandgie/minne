import Foundation

/// Cheap, deterministic near-duplicate detection for capture snapshots.
///
/// The metric is Jaccard similarity over word 3-shingles: text is lowercased,
/// split on whitespace, and every run of three consecutive words becomes one
/// shingle. Shingles rather than a bare token set because a bag of words calls
/// two documents identical whenever they share a vocabulary — a UI full of the
/// same chrome labels would then swallow real content changes. Shingles also
/// stay stable under scrolling (most windows overlap) which is precisely the
/// "same window, nothing new" case the dedup rule targets.
///
/// Cost is linear in word count and it runs at most once per debounce
/// interval per window, on a text already capped at 50 KB.
enum TextSimilarity {
    /// Words per shingle. 3 is the usual near-duplicate default: long enough
    /// that shared boilerplate words don't dominate, short enough that a small
    /// edit only perturbs a few shingles.
    static let shingleWidth = 3

    /// 0 = nothing in common, 1 = identical shingle sets. Two empty texts are
    /// identical; an empty text against a non-empty one shares nothing.
    static func similarity(_ a: String, _ b: String) -> Double {
        let left = shingles(a)
        let right = shingles(b)
        if left.isEmpty && right.isEmpty { return 1 }
        if left.isEmpty || right.isEmpty { return 0 }
        let intersection = left.intersection(right).count
        let union = left.count + right.count - intersection
        return Double(intersection) / Double(union)
    }

    /// Word 3-shingles of `text`. Texts shorter than the shingle width degrade
    /// to their own word set so short titles still compare sensibly.
    static func shingles(_ text: String) -> Set<String> {
        let words = text.lowercased().split(whereSeparator: { $0.isWhitespace || $0.isNewline })
        guard words.count >= shingleWidth else { return Set(words.map(String.init)) }
        var result = Set<String>()
        result.reserveCapacity(words.count)
        for start in 0...(words.count - shingleWidth) {
            result.insert(words[start..<(start + shingleWidth)].joined(separator: " "))
        }
        return result
    }
}
