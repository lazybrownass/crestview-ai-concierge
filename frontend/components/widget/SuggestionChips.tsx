const STARTER_QUESTIONS = [
  "What's the payment plan for a 2 bed unit?",
  "When is possession?",
  "What amenities are included?",
  "Are pets allowed?",
];

export function SuggestionChips({ onSelect }: { onSelect: (question: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-4">
      {STARTER_QUESTIONS.map((question) => (
        <button
          key={question}
          type="button"
          onClick={() => onSelect(question)}
          className="rounded-[var(--radius-chip)] border border-green-800 px-3 py-1.5 text-left text-xs text-stone-400 hover:border-brass-500/60 hover:text-stone-100"
        >
          {question}
        </button>
      ))}
    </div>
  );
}
