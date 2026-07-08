// Mirrors content/docs/listings.md and content/docs/possession-schedule.md.
// Kept as static data (not fetched) so the landing shell stays a fully
// static-rendered page with near-zero server work per request; update this
// file alongside the corpus docs if pricing or possession dates change.

export type Listing = {
  code: string;
  beds: 1 | 2 | 3;
  tower: "A" | "B" | "C";
  floor: number;
  sqft: number;
  priceRupees: number;
  orientation: string;
  status: "Available" | "Reserved";
};

export const FEATURED_LISTINGS: Listing[] = [
  {
    code: "A-710",
    beds: 1,
    tower: "A",
    floor: 7,
    sqft: 750,
    priceRupees: 20_250_000,
    orientation: "Corner unit, canal-facing",
    status: "Available",
  },
  {
    code: "B-305",
    beds: 2,
    tower: "B",
    floor: 3,
    sqft: 1_200,
    priceRupees: 32_400_000,
    orientation: "Canal-facing",
    status: "Available",
  },
  {
    code: "C-605",
    beds: 3,
    tower: "C",
    floor: 6,
    sqft: 1_720,
    priceRupees: 46_440_000,
    orientation: "Top-floor, canal and skyline view",
    status: "Available",
  },
];

export function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

export const POSSESSION_QUARTER = "Q4 2027";
export const POSSESSION_DETAIL =
  "Tower A October 2027, Tower B November 2027, Tower C December 2027.";

export const FICTIONAL_DISCLAIMER =
  "Crestview Residences is a fictional company created to demonstrate this system.";
