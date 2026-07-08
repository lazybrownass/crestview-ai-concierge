import { SourceChip } from "@/components/widget/SourceChip";
import type { ChatMessage } from "@/components/widget/types";

export function MessageBubble({
  message,
  showOfferButtons,
  onAcceptCallback,
  onDeclineCallback,
}: {
  message: ChatMessage;
  showOfferButtons: boolean;
  onAcceptCallback: () => void;
  onDeclineCallback: () => void;
}) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-[var(--radius-chip)] px-3 py-2 text-sm ${
          isUser
            ? "bg-brass-500 text-green-950"
            : "border border-green-800 bg-green-900/70 text-stone-100"
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">
          {message.text}
          {message.streaming && (
            <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-brass-400 align-middle" />
          )}
        </p>

        {message.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.sources.map((source) => (
              <SourceChip key={source.label} source={source} />
            ))}
          </div>
        )}

        {showOfferButtons && (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={onAcceptCallback}
              className="rounded-[var(--radius-chip)] bg-brass-500 px-3 py-1 text-xs font-medium text-green-950 hover:bg-brass-400"
            >
              Yes, have someone call me
            </button>
            <button
              type="button"
              onClick={onDeclineCallback}
              className="rounded-[var(--radius-chip)] border border-stone-400/40 px-3 py-1 text-xs text-stone-400 hover:text-stone-100"
            >
              No thanks
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
