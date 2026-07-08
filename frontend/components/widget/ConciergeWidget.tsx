"use client";

import { useEffect, useRef, useState } from "react";
import { BACKEND_URL } from "@/lib/api";
import { streamChat, type Source } from "@/lib/sse";
import { BreakItPanel } from "@/components/widget/BreakItPanel";
import { LeadSteps } from "@/components/widget/LeadSteps";
import { MessageStream } from "@/components/widget/MessageStream";
import { StatsPanel } from "@/components/widget/StatsPanel";
import { SuggestionChips } from "@/components/widget/SuggestionChips";
import type { ChatMessage } from "@/components/widget/types";

function isOfferingCallback(text: string): boolean {
  return text.toLowerCase().includes("have someone call you");
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ConciergeWidget() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"chat" | "stats">("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [composerValue, setComposerValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [leadOfferMessageId, setLeadOfferMessageId] = useState<string | null>(null);
  const [leadFlowActive, setLeadFlowActive] = useState(false);
  const leadFlowResolved = useRef(false);
  const stopStreamRef = useRef<(() => void) | null>(null);

  useEffect(() => () => stopStreamRef.current?.(), []);

  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    const userMessage: ChatMessage = {
      id: newId(),
      role: "user",
      text: trimmed,
      sources: [],
      streaming: false,
      offeringCallback: false,
    };
    const assistantId = newId();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      text: "",
      sources: [],
      streaming: true,
      offeringCallback: false,
    };
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setComposerValue("");
    setIsStreaming(true);

    function updateAssistant(patch: Partial<ChatMessage>) {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, ...patch } : m)),
      );
    }

    stopStreamRef.current = streamChat(BACKEND_URL, trimmed, {
      onToken: (delta) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, text: m.text + delta } : m)),
        );
      },
      onCitations: (sources: Source[]) => updateAssistant({ sources }),
      onDone: (result) => {
        setIsStreaming(false);
        const finalText = result.corrected && result.text ? result.text : undefined;
        updateAssistant({
          streaming: false,
          ...(finalText ? { text: finalText, sources: [] } : {}),
        });
        setMessages((prev) => {
          const finished = prev.find((m) => m.id === assistantId);
          const text = finalText ?? finished?.text ?? "";
          if (!leadFlowResolved.current && isOfferingCallback(text)) {
            setLeadOfferMessageId(assistantId);
          }
          return prev;
        });
      },
      onError: () => {
        setIsStreaming(false);
        updateAssistant({
          streaming: false,
          text: "Connection to the concierge was lost. Please try again.",
        });
      },
    });
  }

  function stopStreaming() {
    stopStreamRef.current?.();
    setIsStreaming(false);
    setMessages((prev) => prev.map((m) => (m.streaming ? { ...m, streaming: false } : m)));
  }

  function acceptCallback() {
    setLeadOfferMessageId(null);
    setLeadFlowActive(true);
  }

  function declineCallback() {
    setLeadOfferMessageId(null);
    leadFlowResolved.current = true;
  }

  function leadFlowDone(confirmationText: string) {
    setLeadFlowActive(false);
    leadFlowResolved.current = true;
    setMessages((prev) => [
      ...prev,
      {
        id: newId(),
        role: "assistant",
        text: confirmationText,
        sources: [],
        streaming: false,
        offeringCallback: false,
      },
    ]);
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 flex flex-col items-end sm:inset-x-auto sm:right-6 sm:bottom-6">
      {open && (
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
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="hover:text-stone-100">
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
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="motion-reduce:transition-none rounded-[var(--radius-card)] border border-brass-500/60 bg-green-900 px-5 py-3 font-display text-base text-stone-100 shadow-lg transition-transform duration-200 ease-out hover:scale-[1.02]"
      >
        {open ? "Close" : "Ask Crestview"}
      </button>
    </div>
  );
}
