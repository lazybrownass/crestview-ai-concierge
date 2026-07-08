"use client";

import { useEffect, useState } from "react";
import { fetchStats, type Stats } from "@/lib/api";

export function StatsPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 text-sm">
      <h3 className="font-display text-lg text-stone-100">Concierge stats</h3>

      {error && <p className="mt-3 text-xs text-brass-400">{error}</p>}

      {stats && (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-400">Conversations</dt>
              <dd className="tabular-nums mt-1 font-mono text-2xl text-stone-100">
                {stats.total_conversations}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-400">Active sessions</dt>
              <dd className="tabular-nums mt-1 font-mono text-2xl text-stone-100">
                {stats.active_sessions}
              </dd>
            </div>
          </dl>

          <div className="mt-6">
            <p className="text-xs uppercase tracking-wide text-stone-400">
              Unanswered questions — add these to your docs monthly
            </p>
            {stats.unanswered_questions.length === 0 ? (
              <p className="mt-2 text-xs text-stone-400">None yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {stats.unanswered_questions.map((question, i) => (
                  <li
                    key={i}
                    className="rounded-[var(--radius-chip)] border border-green-800 px-3 py-2 text-xs text-stone-400"
                  >
                    {question}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
