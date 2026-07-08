"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "@/components/widget/MessageBubble";
import type { ChatMessage } from "@/components/widget/types";

export function MessageStream({
  messages,
  offerMessageId,
  onAcceptCallback,
  onDeclineCallback,
}: {
  messages: ChatMessage[];
  offerMessageId: string | null;
  onAcceptCallback: () => void;
  onDeclineCallback: () => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  return (
    <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          showOfferButtons={offerMessageId === message.id}
          onAcceptCallback={onAcceptCallback}
          onDeclineCallback={onDeclineCallback}
        />
      ))}
      <div ref={endRef} />
    </div>
  );
}
