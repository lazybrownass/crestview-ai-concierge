"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { BACKEND_URL } from "@/lib/api";
import { streamChat, type Source } from "@/lib/sse";
import type { ChatMessage } from "@/components/widget/types";

// WidgetPanel pulls in react-markdown + plugins — real weight that a
// landing page shouldn't ship on first paint. Loaded only once a visitor
// actually opens the widget, not when this (small) trigger mounts.
const WidgetPanel = dynamic(() =>
  import("@/components/widget/WidgetPanel").then((mod) => mod.WidgetPanel),
);

function isOfferingCallback(text: string): boolean {
  return text.toLowerCase().includes("have someone call you");
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ConciergeWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
    setIsStreaming(true);

    function updateAssistant(patch: Partial<ChatMessage>) {
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, ...patch } : m)));
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
        <WidgetPanel
          messages={messages}
          sendMessage={sendMessage}
          leadOfferMessageId={leadOfferMessageId}
          acceptCallback={acceptCallback}
          declineCallback={declineCallback}
          leadFlowActive={leadFlowActive}
          leadFlowDone={leadFlowDone}
          isStreaming={isStreaming}
          stopStreaming={stopStreaming}
          onClose={() => setOpen(false)}
        />
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
