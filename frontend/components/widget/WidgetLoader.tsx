"use client";

import dynamic from "next/dynamic";

// ssr:false must live inside a Client Component boundary (Next.js 16). This
// keeps the landing page itself a static Server Component while the widget
// — the one client-heavy piece of the page — loads only in the browser,
// after first paint.
const ConciergeWidget = dynamic(
  () => import("@/components/widget/ConciergeWidget").then((mod) => mod.ConciergeWidget),
  { ssr: false },
);

export function WidgetLoader() {
  return <ConciergeWidget />;
}
