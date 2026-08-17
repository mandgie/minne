import AppKit

/// A pasteboard's whole contents: every item, and for each item every type it
/// carries with its data.
///
/// All of it, not just the string — the fallback insertion path borrows the
/// user's clipboard for a fraction of a second, and giving back only the text
/// of a copied image, file or styled paragraph would be destroying their work
/// to save ours.
struct PasteboardContents: Equatable, Sendable {
    var items: [[String: Data]]

    var isEmpty: Bool { items.allSatisfy(\.isEmpty) }
}

/// The pasteboard, as `PasteboardSwap` needs it. A protocol so the save/restore
/// rules can be tested without touching the machine's real clipboard.
@MainActor
protocol PasteboardHolding: AnyObject {
    func read() -> PasteboardContents
    func write(string: String)
    func write(_ contents: PasteboardContents)
}

/// `NSPasteboard.general`.
@MainActor
final class SystemPasteboard: PasteboardHolding {
    private let pasteboard: NSPasteboard

    init(pasteboard: NSPasteboard = .general) {
        self.pasteboard = pasteboard
    }

    func read() -> PasteboardContents {
        PasteboardContents(
            items: (pasteboard.pasteboardItems ?? []).map { item in
                var carried: [String: Data] = [:]
                for type in item.types {
                    guard let data = item.data(forType: type) else { continue }
                    carried[type.rawValue] = data
                }
                return carried
            })
    }

    func write(string: String) {
        pasteboard.clearContents()
        pasteboard.setString(string, forType: .string)
    }

    func write(_ contents: PasteboardContents) {
        pasteboard.clearContents()
        let items: [NSPasteboardItem] = contents.items.compactMap { carried in
            guard !carried.isEmpty else { return nil }
            let item = NSPasteboardItem()
            for (type, data) in carried {
                item.setData(data, forType: NSPasteboard.PasteboardType(type))
            }
            return item
        }
        guard !items.isEmpty else { return }
        pasteboard.writeObjects(items)
    }
}

/// Borrows the pasteboard for one paste and gives it back.
///
/// The restore is delayed rather than immediate because a paste is not
/// synchronous: the target app reads the pasteboard when it gets round to
/// handling the keystroke, and putting the user's clipboard back before then
/// would paste their clipboard instead of our draft. A failed paste is restored
/// at once — there is nothing to wait for.
@MainActor
final class PasteboardSwap {
    /// Injected so a test does not wait half a second per assertion.
    typealias Scheduler = @MainActor (TimeInterval, @escaping @MainActor () -> Void) -> Void

    static let defaultRestoreDelay: TimeInterval = 0.6

    private let pasteboard: any PasteboardHolding
    private let schedule: Scheduler
    private let restoreDelay: TimeInterval

    init(
        pasteboard: any PasteboardHolding = SystemPasteboard(),
        restoreDelay: TimeInterval = PasteboardSwap.defaultRestoreDelay,
        schedule: @escaping Scheduler = { delay, work in
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                MainActor.assumeIsolated(work)
            }
        }
    ) {
        self.pasteboard = pasteboard
        self.restoreDelay = restoreDelay
        self.schedule = schedule
    }

    /// Puts `text` on the pasteboard, runs `paste`, and restores whatever was
    /// there. Returns what `paste` returned.
    @discardableResult
    func paste(_ text: String, using paste: () -> Bool) -> Bool {
        let saved = pasteboard.read()
        pasteboard.write(string: text)
        let pasted = paste()
        let restore: @MainActor @Sendable () -> Void = { [pasteboard] in pasteboard.write(saved) }
        if pasted {
            schedule(restoreDelay, restore)
        } else {
            restore()
        }
        return pasted
    }
}
