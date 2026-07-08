"use client";

import { useState } from "react";
import { BreakItPanel } from "@/components/widget/BreakItPanel";
import { LeadSteps } from "@/components/widget/LeadSteps";
import { MessageStream } from "@/components/widget/MessageStream";
import { StatsPanel } from "@/components/widget/StatsPanel";
import { SuggestionChips } from "@/components/widget/SuggestionChips";
import type { ChatMessage } from "@/components/widget/types";

// Everything here — react-markdown and its plugins in particular — is
// heavier than a landing page should ship on first paint, so this whole
// panel is dynamically imported by ConciergeWidget only once a visitor
// actually opens the widget, not on initial page load.
export function WidgetPanel({
  messages,
  sendMessage,
  leadOfferMessageId,
  acceptCallback,
  declineCallback,
  leadFlowActive,
  leadFlowDone,
  isStreaming,
  stopStreaming,
  onClose,
}: {
  messages: ChatMessage[];
  sendMessage: (text: string) => void;
  leadOfferMessageId: string | null;
  acceptCallback: () => void;
  declineCallback: () => void;
  leadFlowActive: boolean;
  leadFlowDone: (confirmationText: string) => void;
  isStreaming: boolean;
  stopStreaming: () => void;
  onClose: () => void;
}) {
  const [view, setView] = useState<"chat" | "stats">("chat");
  const [composerValue, setComposerValue] = useState("");

  return (
    <div
      className="hero-fade-in mb-3 flex h-[70vh] max-h-[560px] w-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-green-800 bg-green-950 shadow-2xl sm:w-[360px]"
      role="dialog"
      aria-label="Crestview concierge chat"
    >
      <header className="flex items-center justify-between border-b border-green-800 px-4 py-3">
        <h2 className="font-display text-lg text-stone-100">Ask Crestview</h2>
        <div className="flex items-center gap-3 text-xs text-stone-400">
          <button
            type="button"
            onClick={() => setView(view === "chat" ? "stats" : "chat")}
            className="hover:text-stone-100"
          >
            {view === "chat" ? "Stats" : "Back to chat"}
          </button>
          <button type="button" onClick={onClose} aria-label="Close" className="hover:text-stone-100">
            Close
          </button>
        </div>
      </header>

      {view === "stats" ? (
        <StatsPanel />
      ) : (
        <>
          {messages.length === 0 ? (
            <SuggestionChips onSelect={sendMessage} />
          ) : (
            <MessageStream
              messages={messages}
              offerMessageId={leadOfferMessageId}
              onAcceptCallback={acceptCallback}
              onDeclineCallback={declineCallback}
            />
          )}

          {!leadFlowActive && <BreakItPanel onSelect={sendMessage} />}

          {leadFlowActive ? (
            <LeadSteps onDone={leadFlowDone} />
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(composerValue);
                setComposerValue("");
              }}
              className="flex items-center gap-2 border-t border-green-800 px-4 py-3"
            >
              <input
                value={composerValue}
                onChange={(e) => setComposerValue(e.target.value)}
                maxLength={500}
                placeholder="Ask about Crestview…"
                className="flex-1 rounded-[var(--radius-chip)] border border-green-800 bg-green-900/60 px-3 py-1.5 text-sm text-stone-100 placeholder:text-stone-400 focus:border-brass-500"
              />
              {isStreaming ? (
                <button
                  type="button"
                  onClick={stopStreaming}
                  className="rounded-[var(--radius-chip)] border border-stone-400/40 px-3 py-1.5 text-xs text-stone-400 hover:text-stone-100"
                >
                  Stop
                </button>
              ) : (
                <button
                  type="submit"
                  className="rounded-[var(--radius-chip)] bg-brass-500 px-3 py-1.5 text-xs font-medium text-green-950 hover:bg-brass-400"
                >
                  Send
                </button>
              )}
            </form>
          )}
        </>
      )}
    </div>
  );
}
