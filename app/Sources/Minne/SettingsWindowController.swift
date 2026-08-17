import AppKit

/// The settings window: a preference-style toolbar over four sections.
///
/// AppKit rather than SwiftUI on purpose — an AppKit window exposes a full
/// Accessibility tree, so every control here can be driven and verified by
/// script (the SwiftUI chat panel cannot; see US-013). The window is a
/// renderer: it owns no settings state, only `SettingsModel`.
/// Flipped so a section starts at the *top* of the scroll view. An unflipped
/// document view puts the origin at the bottom, which opens every section
/// already scrolled past its heading.
private final class FlippedView: NSView {
    override var isFlipped: Bool { true }
}

@MainActor
final class SettingsWindowController: NSObject, NSWindowDelegate {
    /// Reopens the first-run flow from the Privacy section.
    var onShowSetup: (@MainActor () -> Void)?

    private static let contentWidth: CGFloat = 560
    private static let inset: CGFloat = 24
    /// Privacy is the tall one; this is enough for all of it plus the window
    /// chrome on a 13" display, and the scroll view catches anything smaller.
    private static let maxContentHeight: CGFloat = 700
    private static let frameAutosaveName = "MinneSettingsWindow"

    private let model: SettingsModel
    private let window: NSWindow
    private let scroll = NSScrollView()
    private let documentView = FlippedView()
    private var sectionViews: [SettingsModel.Section: NSView] = [:]
    private var currentSection: NSView?
    private var sectionTopConstraint: NSLayoutConstraint?

    /// Held while the delete-everything sheet is up, so the typed confirmation
    /// can enable its button as it is typed.
    private var confirmAlert: NSAlert?
    private let confirmField = NSTextField()

    init(model: SettingsModel) {
        self.model = model
        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: Self.contentWidth, height: 420),
            styleMask: [.titled, .closable, .miniaturizable],
            backing: .buffered,
            defer: false)
        super.init()

        window.title = "Minne Settings"
        window.isReleasedWhenClosed = false
        window.delegate = self
        window.toolbarStyle = .preference
        window.contentView = buildContentView()

        let toolbar = NSToolbar(identifier: "MinneSettingsToolbar")
        toolbar.delegate = self
        toolbar.displayMode = .iconAndLabel
        toolbar.allowsUserCustomization = false
        window.toolbar = toolbar
        toolbar.selectedItemIdentifier = NSToolbarItem.Identifier(model.section.rawValue)

        if !window.setFrameUsingName(Self.frameAutosaveName) { window.center() }
        window.setFrameAutosaveName(Self.frameAutosaveName)

        show(section: model.section)
        // Section content changes height as the model changes (a wipe result
        // appears, a sync line grows), so the window follows it.
        model.observe(self) { [weak self] _ in self?.resizeToFit() }
    }

    // MARK: - Presentation

    func show(section: SettingsModel.Section? = nil) {
        if let section { model.select(section) }
        install(model.section)
        window.toolbar?.selectedItemIdentifier = NSToolbarItem.Identifier(model.section.rawValue)
        NSApp.activate(ignoringOtherApps: true)
        window.makeKeyAndOrderFront(nil)
        // Debug hook: `-settingsSheet delete` puts the confirmation sheet up on
        // launch, so that state can be reached (and screenshotted) without a
        // click — the same trick `-onboardingStep` plays for US-006.
        if UserDefaults.standard.string(forKey: "settingsSheet") == "delete", confirmAlert == nil {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { [weak self] in
                self?.presentDeleteSheet()
            }
        }
    }

    var isVisible: Bool { window.isVisible }

    // MARK: - Layout

    private func buildContentView() -> NSView {
        documentView.translatesAutoresizingMaskIntoConstraints = false
        scroll.documentView = documentView
        scroll.hasVerticalScroller = true
        scroll.drawsBackground = false
        scroll.automaticallyAdjustsContentInsets = false
        scroll.translatesAutoresizingMaskIntoConstraints = false

        let container = NSView()
        container.addSubview(scroll)
        NSLayoutConstraint.activate([
            container.widthAnchor.constraint(
                equalToConstant: Self.contentWidth + Self.inset * 2),
            scroll.leadingAnchor.constraint(equalTo: container.leadingAnchor),
            scroll.trailingAnchor.constraint(equalTo: container.trailingAnchor),
            scroll.topAnchor.constraint(equalTo: container.topAnchor),
            scroll.bottomAnchor.constraint(equalTo: container.bottomAnchor),
            documentView.widthAnchor.constraint(
                equalToConstant: Self.contentWidth + Self.inset * 2),
        ])
        return container
    }

    private func sectionView(_ section: SettingsModel.Section) -> NSView {
        if let existing = sectionViews[section] { return existing }
        let width = Self.contentWidth
        let view: NSView
        switch section {
        case .account:
            view = AccountSectionView(model: model, width: width)
        case .privacy:
            let privacy = PrivacySectionView(model: model, width: width)
            privacy.onShowSetup = { [weak self] in self?.onShowSetup?() }
            privacy.onDeleteAll = { [weak self] in self?.presentDeleteSheet() }
            view = privacy
        case .memory:
            view = MemorySectionView(model: model, width: width)
        case .general:
            view = GeneralSectionView(model: model, width: width)
        }
        view.translatesAutoresizingMaskIntoConstraints = false
        sectionViews[section] = view
        return view
    }

    private func install(_ section: SettingsModel.Section) {
        let view = sectionView(section)
        guard view !== currentSection else { return }
        currentSection?.removeFromSuperview()
        documentView.addSubview(view)
        let top = view.topAnchor.constraint(
            equalTo: documentView.topAnchor, constant: Self.inset)
        NSLayoutConstraint.activate([
            view.leadingAnchor.constraint(
                equalTo: documentView.leadingAnchor, constant: Self.inset),
            top,
            documentView.bottomAnchor.constraint(
                equalTo: view.bottomAnchor, constant: Self.inset),
        ])
        sectionTopConstraint = top
        currentSection = view
        resizeToFit()
        // A section taller than the window opens at its top, not wherever the
        // previous one had been scrolled to.
        scroll.contentView.scroll(to: NSPoint(x: 0, y: 0))
    }

    /// Sizes the window to the section on screen, capped so a tall section
    /// scrolls instead of running off the display.
    ///
    /// The frame is set rather than the content size: with a `.preference`
    /// toolbar the titlebar is tall and `setContentSize` does not account for
    /// it, which opened every section a toolbar's worth too short. The area
    /// this content actually gets is `contentLayoutRect`, so the difference
    /// between that and the frame is the chrome to add back.
    /// A section's height can settle a layout pass late — the Account section
    /// grows when the brain's `status` fills in the model picker and the
    /// sign-in row, and this controller is notified before the views that
    /// render it are. Measuring again on the next pass is what keeps the window
    /// from staying at the size the section briefly wanted.
    private func resizeToFit() {
        measureAndResize()
        DispatchQueue.main.async { [weak self] in self?.measureAndResize() }
    }

    private func measureAndResize() {
        guard let view = currentSection else { return }
        view.layoutSubtreeIfNeeded()
        let wanted = min(view.fittingSize.height + Self.inset * 2, Self.maxContentHeight)
        let chrome = window.frame.height - window.contentLayoutRect.height
        let target = (wanted + chrome).rounded()
        guard abs(window.frame.height - target) > 0.5 else { return }
        var frame = window.frame
        // Grow downwards: the titlebar stays where the user put it.
        frame.origin.y += frame.height - target
        frame.size.height = target
        frame.size.width = Self.contentWidth + Self.inset * 2
        window.setFrame(frame, display: true)
    }

    // MARK: - Delete all memory

    /// The typed confirmation. A sheet rather than a menu item with a scary
    /// name: this is the one action in Minne that cannot be undone, so it costs
    /// the user a deliberate word.
    private func presentDeleteSheet() {
        model.dismissWipeResult()
        let alert = NSAlert()
        alert.alertStyle = .critical
        alert.messageText = "Delete all memory?"
        alert.informativeText = model.wipeConfirmationHint

        confirmField.stringValue = ""
        confirmField.placeholderString = MemoryWipe.confirmationPhrase
        confirmField.delegate = self
        confirmField.setAccessibilityLabel("Confirmation")
        confirmField.frame = NSRect(x: 0, y: 0, width: 240, height: 24)
        alert.accessoryView = confirmField

        let delete = alert.addButton(withTitle: "Delete Everything")
        delete.hasDestructiveAction = true
        delete.isEnabled = false
        alert.addButton(withTitle: "Cancel")
        confirmAlert = alert
        alert.window.initialFirstResponder = confirmField

        alert.beginSheetModal(for: window) { [weak self] response in
            guard let self else { return }
            self.confirmAlert = nil
            guard response == .alertFirstButtonReturn else { return }
            self.model.deleteAllMemory(confirmation: self.confirmField.stringValue)
        }
    }
}

extension SettingsWindowController: NSTextFieldDelegate {
    func controlTextDidChange(_ notification: Notification) {
        guard let alert = confirmAlert, notification.object as? NSTextField === confirmField
        else { return }
        alert.buttons.first?.isEnabled = model.canConfirmWipe(confirmField.stringValue)
    }
}

extension SettingsWindowController: NSToolbarDelegate {
    private var identifiers: [NSToolbarItem.Identifier] {
        SettingsModel.Section.allCases.map { NSToolbarItem.Identifier($0.rawValue) }
    }

    func toolbarDefaultItemIdentifiers(_ toolbar: NSToolbar) -> [NSToolbarItem.Identifier] {
        identifiers
    }

    func toolbarAllowedItemIdentifiers(_ toolbar: NSToolbar) -> [NSToolbarItem.Identifier] {
        identifiers
    }

    func toolbarSelectableItemIdentifiers(_ toolbar: NSToolbar) -> [NSToolbarItem.Identifier] {
        identifiers
    }

    func toolbar(
        _ toolbar: NSToolbar, itemForItemIdentifier identifier: NSToolbarItem.Identifier,
        willBeInsertedIntoToolbar flag: Bool
    ) -> NSToolbarItem? {
        guard let section = SettingsModel.Section(rawValue: identifier.rawValue) else { return nil }
        let item = NSToolbarItem(itemIdentifier: identifier)
        item.label = section.title
        item.paletteLabel = section.title
        item.image = NSImage(
            systemSymbolName: section.symbolName, accessibilityDescription: section.title)
        item.target = self
        item.action = #selector(sectionSelected(_:))
        return item
    }

    @objc private func sectionSelected(_ sender: NSToolbarItem) {
        guard let section = SettingsModel.Section(rawValue: sender.itemIdentifier.rawValue) else {
            return
        }
        model.select(section)
        install(section)
        // AppKit does not always follow a click through to the selection (an
        // AX-driven click never does), and a toolbar highlighting a section
        // other than the one on screen is worse than no highlight at all.
        window.toolbar?.selectedItemIdentifier = sender.itemIdentifier
    }
}
