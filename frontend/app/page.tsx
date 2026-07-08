import { Footer } from "@/components/landing/Footer";
import { HeroIllustration } from "@/components/landing/HeroIllustration";
import { ListingCard } from "@/components/landing/ListingCard";
import { WidgetLoader } from "@/components/widget/WidgetLoader";
import { FEATURED_LISTINGS, POSSESSION_DETAIL, POSSESSION_QUARTER } from "@/lib/content";

// Static-rendered shell with hourly ISR: content only changes when this
// file or lib/content.ts is redeployed, but the revalidate window means a
// content update doesn't require a full rebuild to reach visitors.
export const revalidate = 3600;

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="relative isolate flex min-h-[70vh] items-end overflow-hidden">
        <HeroIllustration />
        <div className="hero-fade-in relative z-10 px-6 pb-16 md:px-16 md:pb-24">
          <h1 className="max-w-2xl font-display text-4xl leading-tight text-stone-100 md:text-6xl">
            Canal District, Lahore. Three towers, one courtyard, no shortcuts.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-stone-400">
            1, 2, and 3 bed residences at Crestview Residences, with a payment plan and a
            possession date you can check against the source document, not a sales script.
          </p>
        </div>
      </section>

      <section className="px-6 py-16 md:px-16" aria-label="Current listings">
        <h2 className="font-display text-2xl text-stone-100">Current listings</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {FEATURED_LISTINGS.map((listing) => (
            <ListingCard key={listing.code} listing={listing} />
          ))}
        </div>
      </section>

      <section className="border-t border-green-800 px-6 py-16 md:px-16" aria-label="Possession">
        <p className="text-sm uppercase tracking-wide text-stone-400">Target possession</p>
        <p className="tabular-nums mt-2 font-mono text-6xl text-brass-400 md:text-8xl">
          {POSSESSION_QUARTER}
        </p>
        <p className="mt-3 max-w-lg text-stone-400">{POSSESSION_DETAIL}</p>
      </section>

      <div className="flex-1" />
      <Footer />
      <WidgetLoader />
    </div>
  );
}
