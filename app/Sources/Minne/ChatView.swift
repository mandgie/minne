import SwiftUI

/// The chat window's content. All rules live in `ChatModel`; this only renders
/// the transcript and hands typing back.
struct ChatView: View {
    @Bindable var model: ChatModel
    @FocusState private var inputFocused: Bool

    var body: some View {
        VStack(spacing: 0) {
            header
            Divider()
            transcript
            Divider()
            composer
        }
        .frame(minWidth: 380, minHeight: 320)
        .background(.background)
        .onAppear { inputFocused = true }
        .onChange(of: model.focusRequest) { inputFocused = true }
    }

    // MARK: - Header

    private var header: some View {
        HStack(spacing: 8) {
            // The window title says "Minne"; this says which conversation.
            Text(model.title)
                .font(.headline)
                .lineLimit(1)
                .truncationMode(.tail)
                .foregroundStyle(model.isEmpty ? .secondary : .primary)
            Spacer(minLength: 8)
            Button {
                model.newChat()
            } label: {
                Image(systemName: "square.and.pencil")
            }
            .buttonStyle(.borderless)
            .help("New chat")
            .disabled(model.isEmpty && !model.isStreaming)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 9)
    }

    // MARK: - Transcript

    private var transcript: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 16) {
                    if model.isEmpty {
                        emptyState
                    }
                    ForEach(model.messages) { message in
                        MessageRow(message: message) { model.retry() }
                    }
                    Color.clear.frame(height: 1).id(Self.bottomAnchor)
                }
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .onChange(of: model.messages.count) { scrollToBottom(proxy) }
            .onChange(of: model.messages.last?.text.count ?? 0) { scrollToBottom(proxy) }
            .onChange(of: model.messages.last?.activity.count ?? 0) { scrollToBottom(proxy) }
        }
    }

    private static let bottomAnchor = "minne.chat.bottom"

    private func scrollToBottom(_ proxy: ScrollViewProxy) {
        proxy.scrollTo(Self.bottomAnchor, anchor: .bottom)
    }

    private var emptyState: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Ask your memory")
                .font(.title3.weight(.semibold))
            Text("Minne answers from the wiki it keeps of what you have been working on.")
                .foregroundStyle(.secondary)
            VStack(alignment: .leading, spacing: 4) {
                ForEach(Self.examplePrompts, id: \.self) { example in
                    Label(example, systemImage: "sparkle")
                        .foregroundStyle(.tertiary)
                        .font(.callout)
                }
            }
            .padding(.top, 4)
        }
        .padding(.vertical, 24)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private static let examplePrompts = [
        "What did I work on yesterday?",
        "Who is Ada and what are we building?",
        "Summarise the Oslo trip planning so far",
    ]

    // MARK: - Composer

    private var composer: some View {
        HStack(alignment: .bottom, spacing: 8) {
            TextField("Ask your memory…", text: $model.draft, axis: .vertical)
                .textFieldStyle(.plain)
                .lineLimit(1...6)
                .font(.body)
                .focused($inputFocused)
                .onSubmit { model.send() }
                .padding(.horizontal, 10)
                .padding(.vertical, 7)
                .background(
                    RoundedRectangle(cornerRadius: 9, style: .continuous)
                        .fill(.quaternary.opacity(0.5)))
            if model.isStreaming {
                Button {
                    model.stop()
                } label: {
                    Image(systemName: "stop.circle.fill").font(.title2)
                }
                .buttonStyle(.borderless)
                .help("Stop")
            } else {
                Button {
                    model.send()
                } label: {
                    Image(systemName: "arrow.up.circle.fill").font(.title2)
                }
                .buttonStyle(.borderless)
                .disabled(!model.canSend)
                .keyboardShortcut(.return, modifiers: [])
                .help("Send")
            }
        }
        .padding(12)
    }
}

/// One turn: a trailing bubble for the user, a plain block for the assistant
/// with its tool activity, streaming text, or inline failure.
private struct MessageRow: View {
    let message: ChatMessage
    let onRetry: () -> Void

    var body: some View {
        switch message.role {
        case .user:
            HStack {
                Spacer(minLength: 40)
                Text(message.text)
                    .textSelection(.enabled)
                    .padding(.horizontal, 11)
                    .padding(.vertical, 7)
                    .background(
                        RoundedRectangle(cornerRadius: 11, style: .continuous)
                            .fill(.quaternary.opacity(0.7)))
            }
        case .assistant:
            VStack(alignment: .leading, spacing: 8) {
                ForEach(message.activity) { activity in
                    HStack(spacing: 6) {
                        Image(systemName: message.isStreaming ? "magnifyingglass" : "checkmark")
                            .font(.caption2)
                        Text(activity.label(finished: !message.isStreaming))
                            .font(.callout)
                    }
                    .foregroundStyle(.secondary)
                }
                body(of: message)
                if let failure = message.failure {
                    failureView(failure)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    @ViewBuilder
    private func body(of message: ChatMessage) -> some View {
        if message.isStreaming {
            if message.text.isEmpty {
                if message.activity.isEmpty {
                    HStack(spacing: 6) {
                        ProgressView().controlSize(.small)
                        Text("Thinking…").foregroundStyle(.secondary)
                    }
                }
            } else {
                // Deltas arrive faster than markdown is worth re-parsing;
                // finished messages below get the real thing.
                Text(message.text + "▌")
                    .textSelection(.enabled)
            }
        } else if !message.text.isEmpty {
            MarkdownText(markdown: message.text)
            if message.wasStopped {
                Text("Stopped").font(.caption).foregroundStyle(.tertiary)
            }
        }
    }

    private func failureView(_ failure: String) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 8) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(.orange)
            Text(failure)
                .textSelection(.enabled)
            Spacer(minLength: 8)
            Button("Retry", action: onRetry)
                .controlSize(.small)
        }
        .padding(10)
        .background(
            RoundedRectangle(cornerRadius: 9, style: .continuous)
                .fill(.orange.opacity(0.12)))
    }
}

/// Block-level markdown, laid out from `ChatMarkdown.blocks`.
private struct MarkdownText: View {
    let markdown: String

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            ForEach(Array(ChatMarkdown.blocks(markdown).enumerated()), id: \.offset) { _, block in
                switch block {
                case .paragraph(let text):
                    Text(ChatMarkdown.inline(text)).textSelection(.enabled)
                case .heading(let level, let text):
                    Text(ChatMarkdown.inline(text))
                        .font(level <= 2 ? .title3.weight(.semibold) : .headline)
                        .padding(.top, 2)
                case .bullet(let text):
                    HStack(alignment: .firstTextBaseline, spacing: 7) {
                        Text("•")
                        Text(ChatMarkdown.inline(text)).textSelection(.enabled)
                    }
                case .numbered(let number, let text):
                    HStack(alignment: .firstTextBaseline, spacing: 7) {
                        Text("\(number).").monospacedDigit()
                        Text(ChatMarkdown.inline(text)).textSelection(.enabled)
                    }
                case .code(let source):
                    Text(source)
                        .font(.system(.callout, design: .monospaced))
                        .textSelection(.enabled)
                        .padding(9)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(
                            RoundedRectangle(cornerRadius: 7, style: .continuous)
                                .fill(.quaternary.opacity(0.5)))
                }
            }
        }
    }
}
