# Crestview frontend

Next.js 16 (App Router), TypeScript strict, Tailwind 4. See the repo root
[README](../README.md) for the full project, and [CLAUDE.md](../CLAUDE.md)
for the build spec.

```bash
pnpm install
pnpm dev
```

The landing page (`app/page.tsx`) is a statically rendered Server Component
with hourly ISR (`export const revalidate = 3600`) — no client-side data
fetching on first load. The concierge widget (Phase 4) is a client
component, dynamically imported after first paint so the landing shell
itself ships close to zero JS.
