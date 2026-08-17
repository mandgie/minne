import AppKit

/// A small editable list: a table, a field to add to it, and a remove button.
/// Used twice in the Privacy section — once for app bundle identifiers, once
/// for domains. Knows nothing about what is in the list; the model validates.
@MainActor
final class SettingsListEditor: NSView {
    /// Returns false when the entry was not usable (unparseable, or already
    /// there), which is how the field knows to keep what the user typed.
    var onAdd: (@MainActor (String) -> Bool)?
    var onRemove: (@MainActor ([String]) -> Void)?

    private let table = NSTableView()
    private let scroll = NSScrollView()
    private let field = NSTextField()
    private let addButton = NSButton(title: "Add", target: nil, action: nil)
    private let removeButton = NSButton(title: "Remove", target: nil, action: nil)
    private let hintLabel = NSTextField(labelWithString: "")
    private var items: [String] = []

    init(title: String, placeholder: String, width: CGFloat, height: CGFloat = 116) {
        super.init(frame: .zero)

        let titleLabel = NSTextField(labelWithString: title)
        titleLabel.font = .systemFont(ofSize: 12, weight: .semibold)

        let column = NSTableColumn(identifier: NSUserInterfaceItemIdentifier("value"))
        column.title = title
        column.width = width - 20
        table.addTableColumn(column)
        table.headerView = nil
        table.rowHeight = 18
        table.usesAlternatingRowBackgroundColors = true
        table.allowsMultipleSelection = true
        table.style = .plain
        table.dataSource = self
        table.delegate = self
        table.setAccessibilityLabel(title)

        scroll.documentView = table
        scroll.hasVerticalScroller = true
        scroll.borderType = .bezelBorder
        scroll.translatesAutoresizingMaskIntoConstraints = false

        field.placeholderString = placeholder
        field.font = .systemFont(ofSize: 11)
        field.target = self
        field.action = #selector(addClicked)
        field.setAccessibilityLabel(placeholder)

        addButton.target = self
        addButton.action = #selector(addClicked)
        addButton.bezelStyle = .rounded
        addButton.controlSize = .small
        removeButton.target = self
        removeButton.action = #selector(removeClicked)
        removeButton.bezelStyle = .rounded
        removeButton.controlSize = .small
        removeButton.isEnabled = false

        hintLabel.font = .systemFont(ofSize: 10)
        hintLabel.textColor = .secondaryLabelColor

        let controls = NSStackView(views: [field, addButton, removeButton])
        controls.orientation = .horizontal
        controls.spacing = 6
        controls.alignment = .centerY

        let stack = NSStackView(views: [titleLabel, scroll, controls, hintLabel])
        stack.orientation = .vertical
        stack.alignment = .leading
        stack.spacing = 6
        stack.translatesAutoresizingMaskIntoConstraints = false
        addSubview(stack)

        NSLayoutConstraint.activate([
            widthAnchor.constraint(equalToConstant: width),
            stack.leadingAnchor.constraint(equalTo: leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: trailingAnchor),
            stack.topAnchor.constraint(equalTo: topAnchor),
            stack.bottomAnchor.constraint(equalTo: bottomAnchor),
            scroll.widthAnchor.constraint(equalTo: stack.widthAnchor),
            scroll.heightAnchor.constraint(equalToConstant: height),
            controls.widthAnchor.constraint(equalTo: stack.widthAnchor),
            field.widthAnchor.constraint(greaterThanOrEqualToConstant: 120),
        ])
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("not used") }

    /// Re-renders the list, keeping the selection where the same values are
    /// still present (removing one row should not scroll the user away).
    func setItems(_ newItems: [String]) {
        guard newItems != items else { return }
        let selected = Set(table.selectedRowIndexes.map { items[$0] })
        items = newItems
        table.reloadData()
        let indexes = IndexSet(
            items.enumerated().filter { selected.contains($0.element) }.map(\.offset))
        table.selectRowIndexes(indexes, byExtendingSelection: false)
        removeButton.isEnabled = !indexes.isEmpty
    }

    func setHint(_ text: String) {
        hintLabel.stringValue = text
    }

    @objc private func addClicked() {
        let typed = field.stringValue
        guard !typed.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        if onAdd?(typed) == true {
            field.stringValue = ""
        } else {
            NSSound.beep()
        }
    }

    @objc private func removeClicked() {
        let values = table.selectedRowIndexes.map { items[$0] }
        guard !values.isEmpty else { return }
        onRemove?(values)
    }
}

extension SettingsListEditor: NSTableViewDataSource, NSTableViewDelegate {
    func numberOfRows(in tableView: NSTableView) -> Int { items.count }

    func tableView(_ tableView: NSTableView, viewFor column: NSTableColumn?, row: Int) -> NSView? {
        guard items.indices.contains(row) else { return nil }
        let identifier = NSUserInterfaceItemIdentifier("cell")
        let label =
            tableView.makeView(withIdentifier: identifier, owner: self) as? NSTextField
            ?? {
                let label = NSTextField(labelWithString: "")
                label.identifier = identifier
                label.font = .monospacedSystemFont(ofSize: 11, weight: .regular)
                label.lineBreakMode = .byTruncatingMiddle
                return label
            }()
        label.stringValue = items[row]
        return label
    }

    func tableViewSelectionDidChange(_ notification: Notification) {
        removeButton.isEnabled = !table.selectedRowIndexes.isEmpty
    }
}
