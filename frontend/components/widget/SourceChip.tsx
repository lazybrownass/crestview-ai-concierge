"use client";

import { useState } from "react";
import type { Source } from "@/lib/sse";

export function SourceChip({ source }: { source: Source }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="inline-block">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="rounded-[var(--radius-chip)] border border-brass-500/60 bg-green-950/40 px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-brass-400 hover:bg-green-950"
      >
        {source.label}
      </button>
      {expanded && (
        <p className="mt-2 max-w-sm rounded-[var(--radius-chip)] border border-green-800 bg-green-950/60 p-3 text-xs text-stone-400">
          {source.text}
        </p>
      )}
    </div>
  );
}
