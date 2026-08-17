import AppKit

/// The provider step's body: the four cards, a model picker, whatever the
/// login flow is asking for right now, and the account's live state with a
/// sign-out. Renders `AuthModel` and reports clicks back to it — every rule
/// about what a click means lives in the model, not here.
@MainActor
final class ProviderSetupView: NSView {
    private let model: AuthModel
    private let width: CGFloat

    private var cardRows: [ProviderChoice: CardRow] = [:]
    private let modelRow = NSStackView()
    private let modelPopUp = NSPopUpButton()

    private let promptBox = NSStackView()
    private let promptLabel = NSTextField(wrappingLabelWithString: "")
    private let promptField = NSTextField()
    private let promptSecureField = NSSecureTextField()
    private let promptPopUp = NSPopUpButton()
    private let promptSubmit = NSButton(title: "Continue", target: nil, action: nil)
    private let promptCancel = NSButton(title: "Cancel", target: nil, action: nil)

    private let statusRow = NSStackView()
    private let spinner = NSProgressIndicator()
    private let statusLabel = NSTextField(labelWithString: "")
    private let signInButton = NSButton(title: "Sign In", target: nil, action: nil)
    private let signOutButton = NSButton(title: "Sign Out", target: nil, action: nil)

    /// One provider card: a radio button, its explanation, and the extra input
    /// that only that card needs (a base URL, a choice of API-key provider).
    private final class CardRow: NSStackView {
        let choice: ProviderChoice
        let radio: NSButton
        let accessory = NSStackView()
        let baseURLField = NSTextField()
        let providerPopUp = NSPopUpButton()

        init(card: ProviderCard, width: CGFloat, target: AnyObject, action: Selector) {
            choice = card.choice
            radio = NSButton(radioButtonWithTitle: card.title, target: target, action: action)
            super.init(frame: .zero)
            orientation = .vertical
            alignment = .leading
            spacing = 4

            radio.font = .systemFont(ofSize: 13, weight: .medium)

            let subtitle = NSTextField(wrappingLabelWithString: card.subtitle)
            subtitle.font = .systemFont(ofSize: 11)
            subtitle.textColor = .secondaryLabelColor
            subtitle.preferredMaxLayoutWidth = width - 22

            accessory.orientation = .horizontal
            accessory.spacing = 8
            accessory.alignment = .centerY
            if card.needsBaseURL {
                baseURLField.placeholderString = "http://localhost:11434/v1"
                baseURLField.font = .monospacedSystemFont(ofSize: 11, weight: .regular)
                accessory.setViews(
                    [NSTextField(labelWithString: "Server:"), baseURLField], in: .leading)
                baseURLField.widthAnchor.constraint(equalToConstant: 260).isActive = true
            } else if card.providerIds.count > 1 {
                for id in card.providerIds {
                    providerPopUp.addItem(withTitle: ProviderSetupView.providerName(id))
                    providerPopUp.lastItem?.representedObject = id
                }
                accessory.setViews(
                    [NSTextField(labelWithString: "Key from:"), providerPopUp], in: .leading)
            }

            let indented = NSStackView(views: [subtitle, accessory])
            indented.orientation = .vertical
            indented.alignment = .leading
            indented.spacing = 6
            indented.edgeInsets = NSEdgeInsets(top: 0, left: 20, bottom: 0, right: 0)

            setViews([radio, indented], in: .leading)
        }

        @available(*, unavailable)
        required init?(coder: NSCoder) { fatalError("not used") }
    }

    init(model: AuthModel, width: CGFloat) {
        self.model = model
        self.width = width
        super.init(frame: .zero)
        buildLayout()
        model.observe(self) { [weak self] _ in self?.render() }
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("not used") }

    static func providerName(_ id: String) -> String {
        switch id {
        case "anthropic": return "Anthropic"
        case "openai": return "OpenAI"
        case "openai-codex": return "ChatGPT"
        case "ollama": return "Local server"
        default: return id
        }
    }

    // MARK: - Layout

    private func buildLayout() {
        let cardStack = NSStackView()
        cardStack.orientation = .vertical
        cardStack.alignment = .leading
        cardStack.spacing = 12
        for card in ProviderCatalog.cards {
            let row = CardRow(
                card: card, width: width, target: self, action: #selector(cardClicked(_:)))
            row.baseURLField.delegate = self
            row.providerPopUp.target = self
            row.providerPopUp.action = #selector(apiKeyProviderChanged(_:))
            cardRows[card.choice] = row
            cardStack.addArrangedSubview(row)
        }

        modelPopUp.target = self
        modelPopUp.action = #selector(modelChanged(_:))
        modelRow.orientation = .horizontal
        modelRow.spacing = 8
        modelRow.alignment = .centerY
        modelRow.setViews([NSTextField(labelWithString: "Model:"), modelPopUp], in: .leading)

        buildPromptBox()

        spinner.style = .spinning
        spinner.controlSize = .small
        statusLabel.font = .systemFont(ofSize: 12)
        statusLabel.textColor = .secondaryLabelColor
        statusLabel.lineBreakMode = .byTruncatingTail
        statusLabel.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
        signInButton.target = self
        signInButton.action = #selector(signInClicked)
        signInButton.bezelStyle = .rounded
        signOutButton.target = self
        signOutButton.action = #selector(signOutClicked)
        signOutButton.bezelStyle = .rounded
        statusRow.orientation = .horizontal
        statusRow.spacing = 8
        statusRow.alignment = .centerY
        statusRow.setViews([spinner, statusLabel, signOutButton, signInButton], in: .leading)

        let stack = NSStackView(views: [cardStack, modelRow, promptBox, statusRow])
        stack.orientation = .vertical
        stack.alignment = .leading
        stack.spacing = 14
        stack.translatesAutoresizingMaskIntoConstraints = false
        addSubview(stack)
        NSLayoutConstraint.activate([
            widthAnchor.constraint(equalToConstant: width),
            stack.leadingAnchor.constraint(equalTo: leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: trailingAnchor),
            stack.topAnchor.constraint(equalTo: topAnchor),
            stack.bottomAnchor.constraint(equalTo: bottomAnchor),
            statusRow.widthAnchor.constraint(equalTo: stack.widthAnchor),
            promptBox.widthAnchor.constraint(equalTo: stack.widthAnchor),
        ])
    }

    private func buildPromptBox() {
        promptLabel.font = .systemFont(ofSize: 12, weight: .medium)
        promptLabel.preferredMaxLayoutWidth = width - 24
        promptField.font = .monospacedSystemFont(ofSize: 12, weight: .regular)
        promptField.target = self
        promptField.action = #selector(promptSubmitClicked)
        promptSecureField.target = self
        promptSecureField.action = #selector(promptSubmitClicked)
        promptSubmit.target = self
        promptSubmit.action = #selector(promptSubmitClicked)
        promptSubmit.bezelStyle = .rounded
        promptCancel.target = self
        promptCancel.action = #selector(promptCancelClicked)
        promptCancel.bezelStyle = .rounded
        promptPopUp.target = self
        promptPopUp.action = #selector(promptSubmitClicked)

        let inputRow = NSStackView(views: [
            promptField, promptSecureField, promptPopUp, promptCancel, promptSubmit,
        ])
        inputRow.orientation = .horizontal
        inputRow.spacing = 8
        inputRow.alignment = .centerY
        promptField.widthAnchor.constraint(equalToConstant: 180).isActive = true
        promptSecureField.widthAnchor.constraint(equalToConstant: 180).isActive = true

        promptBox.orientation = .vertical
        promptBox.alignment = .leading
        promptBox.spacing = 8
        promptBox.edgeInsets = NSEdgeInsets(top: 10, left: 12, bottom: 10, right: 12)
        promptBox.wantsLayer = true
        promptBox.layer?.cornerRadius = 6
        promptBox.layer?.backgroundColor = NSColor.controlBackgroundColor.cgColor
        promptBox.setViews([promptLabel, inputRow], in: .leading)
    }

    // MARK: - Rendering

    private func render() {
        for (choice, row) in cardRows {
            let selected = choice == model.selection
            row.radio.state = selected ? .on : .off
            row.accessory.isHidden = !selected
            if choice == .local, row.baseURLField.stringValue != model.baseURL,
                window?.firstResponder !== row.baseURLField.currentEditor()
            {
                row.baseURLField.stringValue = model.baseURL
            }
            if choice == .apiKey {
                let index = row.providerPopUp.itemArray.firstIndex {
                    $0.representedObject as? String == model.apiKeyProvider
                }
                if let index { row.providerPopUp.selectItem(at: index) }
            }
        }

        renderModelPicker()
        renderPrompt()
        renderStatus()
        needsLayout = true
    }

    private func renderModelPicker() {
        let options = model.models
        modelRow.isHidden = options.isEmpty
        let titles = options.map(\.name)
        if modelPopUp.itemTitles != titles {
            modelPopUp.removeAllItems()
            for option in options {
                modelPopUp.addItem(withTitle: option.name)
                modelPopUp.lastItem?.representedObject = option.id
            }
        }
        if let selected = model.selectedModel,
            let index = modelPopUp.itemArray.firstIndex(where: {
                $0.representedObject as? String == selected
            })
        {
            modelPopUp.selectItem(at: index)
        }
    }

    private func renderPrompt() {
        guard case .prompting(let prompt) = model.phase else {
            promptBox.isHidden = true
            return
        }
        promptBox.isHidden = false
        promptLabel.stringValue = prompt.message
        let isSelect = prompt.promptType == "select"
        promptPopUp.isHidden = !isSelect
        promptField.isHidden = isSelect || prompt.isSecret
        promptSecureField.isHidden = isSelect || !prompt.isSecret
        if isSelect {
            promptPopUp.removeAllItems()
            for option in prompt.options {
                promptPopUp.addItem(withTitle: option.label)
                promptPopUp.lastItem?.representedObject = option.id
            }
        } else {
            let field = prompt.isSecret ? promptSecureField : promptField
            field.placeholderString = prompt.placeholder
            field.stringValue = ""
            window?.makeFirstResponder(field)
        }
    }

    private func renderStatus() {
        let busy = model.phase.isBusy
        if busy { spinner.startAnimation(nil) } else { spinner.stopAnimation(nil) }
        spinner.isHidden = !busy

        statusLabel.stringValue = model.statusLine
        statusLabel.textColor = {
            if case .failed = model.phase { return .systemRed }
            if model.isSelectionSignedIn { return .labelColor }
            return .secondaryLabelColor
        }()
        signInButton.title = model.signInTitle
        signInButton.isEnabled = model.canSignIn
        signInButton.keyEquivalent = busy ? "" : "\r"
        signOutButton.isHidden = !model.isSignedIn || busy
    }

    // MARK: - Actions

    @objc private func cardClicked(_ sender: NSButton) {
        guard let choice = cardRows.first(where: { $0.value.radio === sender })?.key else { return }
        model.select(choice)
    }

    @objc private func apiKeyProviderChanged(_ sender: NSPopUpButton) {
        guard let id = sender.selectedItem?.representedObject as? String else { return }
        model.selectAPIKeyProvider(id)
    }

    @objc private func modelChanged(_ sender: NSPopUpButton) {
        guard let id = sender.selectedItem?.representedObject as? String else { return }
        model.selectModel(id)
    }

    @objc private func signInClicked() {
        model.signIn()
    }

    @objc private func signOutClicked() {
        model.signOut()
    }

    @objc private func promptSubmitClicked() {
        guard case .prompting(let prompt) = model.phase else { return }
        if prompt.promptType == "select" {
            guard let id = promptPopUp.selectedItem?.representedObject as? String else { return }
            model.submitPrompt(id)
            return
        }
        let field = prompt.isSecret ? promptSecureField : promptField
        model.submitPrompt(field.stringValue)
    }

    @objc private func promptCancelClicked() {
        model.cancelSignIn()
    }
}

extension ProviderSetupView: NSTextFieldDelegate {
    func controlTextDidChange(_ notification: Notification) {
        guard let field = notification.object as? NSTextField,
            field === cardRows[.local]?.baseURLField
        else { return }
        model.setBaseURL(field.stringValue)
    }
}
