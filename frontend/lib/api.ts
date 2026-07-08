export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export type BudgetBand = "under_20m" | "20m_35m" | "35m_50m" | "over_50m";
export type Timeline = "this_month" | "1_3_months" | "3_plus_months";

export type LeadRequest = {
  name: string;
  phone: string;
  budget_band: BudgetBand;
  timeline: Timeline;
};

export async function submitLead(lead: LeadRequest): Promise<{ webhook_delivered: boolean }> {
  const response = await fetch(`${BACKEND_URL}/api/lead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(lead),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: unknown } | null;
    throw new Error(typeof body?.detail === "string" ? body.detail : "Could not submit your details.");
  }
  return response.json();
}

export type Stats = {
  total_conversations: number;
  active_sessions: number;
  unanswered_questions: string[];
};

export async function fetchStats(): Promise<Stats> {
  const response = await fetch(`${BACKEND_URL}/api/stats`, { credentials: "include" });
  if (!response.ok) throw new Error("Could not load stats.");
  return response.json();
}

export const PK_PHONE_RE = /^(\+92|0)3\d{2}[- ]?\d{7}$/;
