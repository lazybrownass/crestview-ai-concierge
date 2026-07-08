import { formatPKR, type Listing } from "@/lib/content";

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <article className="rounded-[var(--radius-card)] border border-green-800 bg-green-900/60 p-6">
      <div className="flex items-baseline justify-between">
        <h3 className="font-mono text-sm tracking-wide text-stone-400">{listing.code}</h3>
        {listing.status === "Reserved" && (
          <span className="rounded-[var(--radius-chip)] border border-brass-500/50 px-2 py-0.5 text-xs uppercase tracking-wide text-brass-400">
            Reserved
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-2xl">
        {listing.beds} Bed · Tower {listing.tower}
      </p>
      <p className="mt-1 text-sm text-stone-400">
        {listing.sqft.toLocaleString("en-PK")} sq ft · Floor {listing.floor}
      </p>
      <p className="mt-1 text-sm text-stone-400">{listing.orientation}</p>
      <p className="tabular-nums mt-5 font-mono text-xl text-stone-100">
        {formatPKR(listing.priceRupees)}
      </p>
    </article>
  );
}
