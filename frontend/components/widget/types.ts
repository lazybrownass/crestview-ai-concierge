import type { Source } from "@/lib/sse";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources: Source[];
  streaming: boolean;
  /** Assistant text matched the lead-offer phrase and hasn't been resolved yet. */
  offeringCallback: boolean;
};
