import Foundation

/// Minimal block-level markdown for finished assistant messages.
///
/// `AttributedString(markdown:)` handles inline styling but collapses block
/// structure — lists, headings and fenced code all come out as one run-on
/// paragraph. So blocks are split here (pure, unit-tested) and the view lays
/// each one out itself, using `inline()` for the emphasis inside it.
enum ChatMarkdown {
    enum Block: Equatable, Sendable {
        case paragraph(String)
        case heading(level: Int, text: String)
        case bullet(String)
        case numbered(number: Int, text: String)
        /// Fenced code, verbatim, with no inline markdown applied.
        case code(String)
    }

    static func blocks(_ markdown: String) -> [Block] {
        var blocks: [Block] = []
        var paragraph: [String] = []

        func flushParagraph() {
            guard !paragraph.isEmpty else { return }
            blocks.append(.paragraph(paragraph.joined(separator: " ")))
            paragraph = []
        }

        var lines = markdown.components(separatedBy: .newlines)[...]
        while let line = lines.first {
            lines = lines.dropFirst()
            let trimmed = line.trimmingCharacters(in: .whitespaces)

            if trimmed.hasPrefix("```") {
                flushParagraph()
                var body: [String] = []
                while let next = lines.first,
                    !next.trimmingCharacters(in: .whitespaces).hasPrefix("```")
                {
                    body.append(next)
                    lines = lines.dropFirst()
                }
                // Drop the closing fence; an unterminated fence just ends here,
                // which is what a half-streamed message looks like.
                if lines.first != nil { lines = lines.dropFirst() }
                blocks.append(.code(body.joined(separator: "\n")))
                continue
            }

            if trimmed.isEmpty {
                flushParagraph()
                continue
            }

            if let heading = heading(trimmed) {
                flushParagraph()
                blocks.append(heading)
                continue
            }

            if let bullet = bullet(trimmed) {
                flushParagraph()
                blocks.append(bullet)
                continue
            }

            if let numbered = numbered(trimmed) {
                flushParagraph()
                blocks.append(numbered)
                continue
            }

            paragraph.append(trimmed)
        }
        flushParagraph()
        return blocks
    }

    /// Inline markdown (`**bold**`, `` `code` ``, links) for one block's text.
    /// Falls back to the raw string rather than losing the answer.
    static func inline(_ text: String) -> AttributedString {
        let options = AttributedString.MarkdownParsingOptions(
            allowsExtendedAttributes: true,
            interpretedSyntax: .inlineOnlyPreservingWhitespace,
            failurePolicy: .returnPartiallyParsedIfPossible)
        return (try? AttributedString(markdown: text, options: options)) ?? AttributedString(text)
    }

    // MARK: - Line shapes

    private static func heading(_ line: String) -> Block? {
        var level = 0
        var rest = Substring(line)
        while rest.first == "#", level < 6 {
            level += 1
            rest = rest.dropFirst()
        }
        guard level > 0, rest.first == " " else { return nil }
        return .heading(level: level, text: String(rest.dropFirst()))
    }

    private static func bullet(_ line: String) -> Block? {
        guard let marker = line.first, "-*+".contains(marker) else { return nil }
        let rest = line.dropFirst()
        guard rest.first == " " else { return nil }
        return .bullet(String(rest.dropFirst()))
    }

    private static func numbered(_ line: String) -> Block? {
        let digits = line.prefix(while: \.isNumber)
        guard !digits.isEmpty, let number = Int(digits) else { return nil }
        var rest = line.dropFirst(digits.count)
        guard let separator = rest.first, separator == "." || separator == ")" else { return nil }
        rest = rest.dropFirst()
        guard rest.first == " " else { return nil }
        return .numbered(number: number, text: String(rest.dropFirst()))
    }
}
