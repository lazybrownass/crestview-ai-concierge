"use client";

import { useState } from "react";
import { PK_PHONE_RE, submitLead, type BudgetBand, type Timeline } from "@/lib/api";

type Step = "name" | "phone" | "budget" | "timeline" | "submitting" | "done" | "error";

const BUDGET_OPTIONS: { value: BudgetBand; label: string }[] = [
  { value: "under_20m", label: "Under PKR 20M" },
  { value: "20m_35m", label: "PKR 20M – 35M" },
  { value: "35m_50m", label: "PKR 35M – 50M" },
  { value: "over_50m", label: "Over PKR 50M" },
];

const TIMELINE_OPTIONS: { value: Timeline; label: string }[] = [
  { value: "this_month", label: "This month" },
  { value: "1_3_months", label: "1–3 months" },
  { value: "3_plus_months", label: "3+ months" },
];

export function LeadSteps({ onDone }: { onDone: (message: string) => void }) {
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [budgetBand, setBudgetBand] = useState<BudgetBand | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function submitPhone() {
    if (!PK_PHONE_RE.test(phone.trim())) {
      setPhoneError("That doesn't look like a Pakistani mobile number, e.g. 03001234567.");
      return;
    }
    setPhoneError(null);
    setStep("budget");
  }

  async function submitTimeline(timeline: Timeline) {
    if (!budgetBand) return;
    setStep("submitting");
    try {
      await submitLead({ name: name.trim(), phone: phone.trim(), budget_band: budgetBand, timeline });
      setStep("done");
      onDone(`Thanks, ${name.trim()} — the team will reach out on ${phone.trim()} shortly.`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not submit your details.");
      setStep("error");
    }
  }

  if (step === "done") return null;

  return (
    <div className="border-t border-green-800 bg-green-900/60 px-4 py-3">
      {step === "name" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) setStep("phone");
          }}
          className="flex gap-2"
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="flex-1 rounded-[var(--radius-chip)] border border-green-800 bg-green-950 px-3 py-1.5 text-sm text-stone-100 placeholder:text-stone-400 focus:border-brass-500"
          />
          <button
            type="submit"
            className="rounded-[var(--radius-chip)] bg-brass-500 px-3 py-1.5 text-xs font-medium text-green-950"
          >
            Next
          </button>
        </form>
      )}

      {step === "phone" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitPhone();
          }}
        >
          <div className="flex gap-2">
            <input
              autoFocus
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03001234567"
              className="flex-1 rounded-[var(--radius-chip)] border border-green-800 bg-green-950 px-3 py-1.5 text-sm text-stone-100 placeholder:text-stone-400 focus:border-brass-500"
            />
            <button
              type="submit"
              className="rounded-[var(--radius-chip)] bg-brass-500 px-3 py-1.5 text-xs font-medium text-green-950"
            >
              Next
            </button>
          </div>
          {phoneError && <p className="mt-1.5 text-xs text-brass-400">{phoneError}</p>}
        </form>
      )}

      {step === "budget" && (
        <div>
          <p className="mb-2 text-xs text-stone-400">Budget range?</p>
          <div className="flex flex-wrap gap-2">
            {BUDGET_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setBudgetBand(option.value);
                  setStep("timeline");
                }}
                className="rounded-[var(--radius-chip)] border border-green-800 px-3 py-1.5 text-xs text-stone-100 hover:border-brass-500/60"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "timeline" && (
        <div>
          <p className="mb-2 text-xs text-stone-400">Looking to buy within?</p>
          <div className="flex flex-wrap gap-2">
            {TIMELINE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => submitTimeline(option.value)}
                className="rounded-[var(--radius-chip)] border border-green-800 px-3 py-1.5 text-xs text-stone-100 hover:border-brass-500/60"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "submitting" && <p className="text-xs text-stone-400">Sending…</p>}

      {step === "error" && (
        <p className="text-xs text-brass-400">{errorMessage} Please try again in a moment.</p>
      )}
    </div>
  );
}
