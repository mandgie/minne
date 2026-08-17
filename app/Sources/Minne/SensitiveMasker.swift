import Foundation

/// Redacts sensitive strings out of captured text before anything can persist
/// it. Pure and deterministic: the same input always yields the same output,
/// with no state and no I/O, so every pattern is unit-testable.
///
/// The design principle is *validate, don't just match*. A regex alone would
/// mask any 16-digit run — order numbers, build ids, phone lists — and a memory
/// full of `▮▮▮` is worse than useless. So every pattern that has a checksum is
/// checked against it (Luhn for cards, mod-97 for IBAN, mod-10 for Swedish
/// personnummer) and the ones that don't (US SSN, CVV) are anchored on a
/// separator or a nearby keyword instead. False negatives are possible; that is
/// the price of a memory that still reads like the screen it came from.
enum SensitiveMasker {
    /// What replaces a redacted span. Three blocks, regardless of how long the
    /// original was — the length itself is information we don't need to keep.
    static let token = "▮▮▮"

    enum Kind: String, Sendable, CaseIterable {
        case creditCard
        case cvv
        case iban
        case ssn
        case personnummer
    }

    struct Match: Equatable, Sendable {
        let kind: Kind
        /// The span replaced by `token` — for CVV that is the digits only, so
        /// the label stays readable ("CVV: ▮▮▮").
        let range: Range<String.Index>
    }

    /// Text with every sensitive span replaced by `token`.
    static func mask(_ text: String) -> String { masking(text).text }

    /// As `mask`, plus what was redacted — the caller records the count so a
    /// snapshot can say masking ran without ever logging what it removed.
    static func masking(_ text: String) -> (text: String, kinds: [Kind]) {
        let matches = matches(in: text)
        guard !matches.isEmpty else { return (text, []) }
        var result = ""
        var cursor = text.startIndex
        for match in matches {
            result += text[cursor..<match.range.lowerBound]
            result += token
            cursor = match.range.upperBound
        }
        result += text[cursor...]
        return (result, matches.map(\.kind))
    }

    /// Every span that will be redacted, in document order and non-overlapping.
    static func matches(in text: String) -> [Match] {
        guard !text.isEmpty else { return [] }
        let whole = NSRange(text.startIndex..<text.endIndex, in: text)
        var candidates: [(kind: Kind, range: NSRange)] = []
        for rule in rules {
            rule.regex.enumerateMatches(in: text, range: whole) { result, _, _ in
                guard let result, let matched = Range(result.range, in: text) else { return }
                let matchedText = String(text[matched])
                guard let refined = rule.refine(matchedText) else { return }
                if rule.maskGroup != 0 {
                    let group = result.range(at: rule.maskGroup)
                    guard group.location != NSNotFound else { return }
                    return candidates.append((rule.kind, group))
                }
                // `refine` works in the matched substring's coordinates; shift
                // it back into the document.
                let offset = NSRange(refined, in: matchedText)
                candidates.append(
                    (
                        rule.kind,
                        NSRange(
                            location: result.range.location + offset.location,
                            length: offset.length)
                    ))
            }
        }

        // Rules are tried in `rules` order, so an earlier rule wins any
        // overlap. In practice the patterns are disjoint (each is anchored so
        // that a longer digit run cannot contain a shorter match), but a
        // future pattern must not be able to corrupt an existing one.
        var kept: [(kind: Kind, range: NSRange)] = []
        for candidate in candidates
        where !kept.contains(where: { NSIntersectionRange($0.range, candidate.range).length > 0 }) {
            kept.append(candidate)
        }
        return
            kept
            .sorted { $0.range.location < $1.range.location }
            .compactMap { candidate in
                Range(candidate.range, in: text).map { Match(kind: candidate.kind, range: $0) }
            }
    }

    // MARK: - Rules

    private struct Rule {
        let kind: Kind
        let regex: NSRegularExpression
        /// Capture group to replace; 0 means "whatever `refine` returns".
        let maskGroup: Int
        /// The part of the match that is genuinely sensitive, or nil when the
        /// match fails its checksum. A gate and a trimmer in one: a greedy
        /// pattern can hand back a shorter, valid span instead of nothing.
        let refine: @Sendable (String) -> Range<String.Index>?
    }

    /// A `refine` for patterns whose shape is the whole evidence — the regex
    /// matching is already the decision.
    private static let matchIsEnough: @Sendable (String) -> Range<String.Index>? = {
        $0.startIndex..<$0.endIndex
    }

    /// A `refine` for patterns with a fixed shape: all of the match, or none.
    private static func whole(
        if isValid: @escaping @Sendable (String) -> Bool
    ) -> @Sendable (String) -> Range<String.Index>? {
        { isValid($0) ? $0.startIndex..<$0.endIndex : nil }
    }

    /// Greedy patterns swallow whatever follows them — "…7654 32 please",
    /// "…1111 1111 123". Rather than lose the whole match to the intruder, the
    /// candidate is re-cut along its separators: every contiguous run of groups
    /// is offered to `isValid`, longest first and leftmost among equals. Groups
    /// are never split, so an unbroken 20-digit id still matches nothing at all
    /// instead of having a card-shaped window carved out of it.
    private static func refineByGroups(
        _ isValid: @escaping @Sendable (String) -> Bool
    ) -> @Sendable (String) -> Range<String.Index>? {
        { candidate in
            let groups = groupRanges(in: candidate)
            guard !groups.isEmpty else { return nil }
            for length in stride(from: groups.count, through: 1, by: -1) {
                for start in 0...(groups.count - length) {
                    let span = groups[start].lowerBound..<groups[start + length - 1].upperBound
                    if isValid(String(candidate[span])) { return span }
                }
            }
            return nil
        }
    }

    /// Cards are printed either as one unbroken run of digits or in groups of
    /// four to six (4-4-4-4 for most schemes, 4-6-5 for Amex). Insisting on
    /// that layout is what stops a column of unrelated numbers — a spreadsheet,
    /// a log of ids — from being glued by its spaces into something 16 digits
    /// long that happens to satisfy Luhn one time in ten.
    static func isCardLayout(_ candidate: String) -> Bool {
        let groups = groupRanges(in: candidate).map { candidate[$0].count }
        if groups.count == 1 { return true }
        return (3...5).contains(groups.count) && groups.allSatisfy { (4...6).contains($0) }
    }

    /// Maximal runs of letters and digits, i.e. the match minus its separators.
    private static func groupRanges(in candidate: String) -> [Range<String.Index>] {
        var ranges: [Range<String.Index>] = []
        var start: String.Index?
        for index in candidate.indices {
            let isGroupCharacter = candidate[index].isLetter || candidate[index].isNumber
            if isGroupCharacter {
                if start == nil { start = index }
            } else if let open = start {
                ranges.append(open..<index)
                start = nil
            }
        }
        if let open = start { ranges.append(open..<candidate.endIndex) }
        return ranges
    }

    /// Compiled once and shared: `NSRegularExpression` is immutable and
    /// thread-safe, and the validators are pure, so the table is `Sendable`.
    private static let rules: [Rule] = [
        // IBAN first: a printed IBAN ends in a long group of digits, so the
        // card rule would otherwise claim a slice of one and leave the rest
        // in the clear.
        Rule(
            kind: .iban,
            // Country code, 2 check digits, then 11–30 alphanumerics that may
            // be printed in space-separated groups.
            regex: regex(
                #"(?<![A-Za-z0-9])[A-Za-z]{2}[0-9]{2}(?: ?[A-Za-z0-9]){11,30}(?![A-Za-z0-9])"#),
            maskGroup: 0,
            refine: refineByGroups(isIBANValid)
        ),
        Rule(
            kind: .creditCard,
            // 13–19 digits in groups separated by at most one space or hyphen,
            // in a layout a card is actually printed in. The digit lookaround
            // means a longer run (an order id, a run of digits) matches nothing
            // at all rather than having a card-shaped slice taken out of it.
            regex: regex(#"(?<![0-9])(?:[0-9][ -]?){12,18}[0-9](?![0-9])"#),
            maskGroup: 0,
            refine: refineByGroups {
                let digits = digits(of: $0)
                return (13...19).contains(digits.count) && isCardLayout($0)
                    && isLuhnValid(digits)
            }
        ),
        Rule(
            kind: .personnummer,
            // YYMMDD / YYYYMMDD, an optional `-` or `+` (the latter marks
            // someone over 100), then the four-digit birth number. Days 61–91
            // cover samordningsnummer, which share the same checksum.
            regex: regex(
                #"(?<![0-9])(?:19|20)?[0-9]{2}(?:0[1-9]|1[0-2])"#
                    + #"(?:0[1-9]|[12][0-9]|3[01]|6[1-9]|[78][0-9]|9[01])[-+]?[0-9]{4}(?![0-9])"#),
            maskGroup: 0,
            refine: whole(if: isPersonnummerValid)
        ),
        Rule(
            kind: .ssn,
            // US SSN in its printed form only. A bare 9-digit run is left
            // alone: without the separators it is indistinguishable from any
            // other number and there is no checksum to appeal to.
            regex: regex(
                #"(?<![0-9-])(?!000|666|9[0-9][0-9])[0-9]{3}([- ])(?!00)[0-9]{2}\1(?!0000)[0-9]{4}(?![0-9-])"#
            ),
            maskGroup: 0,
            refine: matchIsEnough
        ),
        Rule(
            kind: .cvv,
            // No checksum exists, so the keyword is the evidence. Only the
            // digits are replaced — "CVV: ▮▮▮" still reads as a form field.
            regex: regex(
                #"(?i)\b(?:cvv2?|cvc2?|cid|csc|security code|card verification"#
                    + #"(?: code| value| number)?)\b[^0-9\n]{0,8}([0-9]{3,4})(?![0-9])"#),
            maskGroup: 1,
            refine: matchIsEnough
        ),
    ]

    /// Patterns are literals written in this file; a typo in one is a
    /// programmer error, not a runtime condition.
    private static func regex(_ pattern: String) -> NSRegularExpression {
        do {
            return try NSRegularExpression(pattern: pattern)
        } catch {
            preconditionFailure("invalid masking pattern \(pattern): \(error)")
        }
    }

    // MARK: - Checksums

    /// Digits only, dropping the separators a human typed.
    static func digits(of text: String) -> String {
        text.filter { $0.isASCII && $0.isNumber }
    }

    /// Standard Luhn (mod 10): every second digit from the right is doubled,
    /// digits over 9 have 9 subtracted, and a valid number sums to a multiple
    /// of ten. Guards card numbers and Swedish personnummer alike.
    static func isLuhnValid(_ digits: String) -> Bool {
        let values = digits.compactMap { $0.isASCII ? $0.wholeNumberValue : nil }
        guard values.count == digits.count, values.count >= 2 else { return false }
        var sum = 0
        for (offset, digit) in values.reversed().enumerated() {
            if offset.isMultiple(of: 2) {
                sum += digit
            } else {
                let doubled = digit * 2
                sum += doubled > 9 ? doubled - 9 : doubled
            }
        }
        return sum.isMultiple(of: 10)
    }

    /// ISO 13616 mod-97: move the first four characters to the end, expand
    /// letters to two-digit numbers (A = 10), and the whole thing read as one
    /// integer must be ≡ 1 (mod 97).
    static func isIBANValid(_ candidate: String) -> Bool {
        let compact = candidate.uppercased().filter { !$0.isWhitespace }
        guard (15...34).contains(compact.count) else { return false }
        let prefix = Array(compact.prefix(4))
        guard prefix[0].isLetter, prefix[1].isLetter, prefix[2].isNumber, prefix[3].isNumber
        else { return false }

        var remainder = 0
        for character in compact.dropFirst(4) + compact.prefix(4) {
            guard character.isASCII else { return false }
            if let digit = character.wholeNumberValue, character.isNumber {
                remainder = (remainder * 10 + digit) % 97
            } else if let ascii = character.asciiValue, character.isUppercase {
                remainder = (remainder * 100 + Int(ascii - 65) + 10) % 97
            } else {
                return false
            }
        }
        return remainder == 1
    }

    /// Swedish personnummer: the last digit is a Luhn check over the ten-digit
    /// form, so a century prefix is dropped before checking. The date itself is
    /// already constrained by the pattern.
    static func isPersonnummerValid(_ candidate: String) -> Bool {
        let digits = digits(of: candidate)
        switch digits.count {
        case 10: return isLuhnValid(digits)
        case 12: return isLuhnValid(String(digits.dropFirst(2)))
        default: return false
        }
    }
}
