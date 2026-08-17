import Foundation

/// Renderers to call when a model changes.
///
/// `@Observable` notifies SwiftUI and nothing else, so the AppKit windows
/// (onboarding, settings, the menu bar) have to be told explicitly. Each entry
/// holds its owner **weakly**: these windows are recreated every time they are
/// opened, and a strong list would keep rendering into dead ones forever.
@MainActor
struct ObserverRegistry<Model: AnyObject> {
    private struct Entry {
        weak var owner: AnyObject?
        let render: @MainActor (Model) -> Void
    }

    private var entries: [Entry] = []

    init() {}

    /// Registers a renderer for as long as `owner` lives.
    mutating func add(_ owner: AnyObject, _ render: @escaping @MainActor (Model) -> Void) {
        entries.removeAll { $0.owner == nil }
        entries.append(Entry(owner: owner, render: render))
    }

    mutating func notify(_ model: Model) {
        entries.removeAll { $0.owner == nil }
        for entry in entries { entry.render(model) }
    }
}
