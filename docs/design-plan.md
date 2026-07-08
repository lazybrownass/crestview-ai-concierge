# Design plan (Phase 3, per CLAUDE.md Section 9)

1. Palette: `--green-950` base surface, `--green-900` raised panels, `--stone-100` primary text, `--stone-400` secondary text, `--brass-500` as the single accent (chips, focus rings, one CTA) — no second accent color anywhere.
2. Type roles: Young Serif for the two headlines on the page (tight tracking, large size), Schibsted Grotesk for all body copy and UI labels, IBM Plex Mono with tabular numerals for every price and the possession date.
3. Layout sketch: full-bleed dusk hero (headline + one line of copy, no nav bar) → three listing cards on a quiet grid, mono prices → a single large possession-date numeral as its own section → footer with the fictional-company disclaimer. No feature grid, no testimonial carousel, no logo bar.
4. Hero treatment: no stock photography exists for a fictional developer, so the "architectural photograph" is a custom SVG facade-and-canal-reflection illustration in the green/brass palette rather than a borrowed or invented photo URL — deliberate substitution, not a shortcut.
5. Signature element: the concierge widget (Phase 4) is the one bold, animated thing on the page; the landing page itself stays still and quiet by contrast.
6. Motion: none on the landing page except a subtle hero fade-in on load; the widget gets the 180–220ms unfold.
7. Grid: 8px spacing scale throughout; radius 2px on chips/tags, 12px on cards.

**Self-critique — would I produce this exact plan for any generic brief?**
No: a generic brief would default to the banned looks in Section 9 (cream+terracotta, or dark+neon accent, or a stock hero photo with a gradient overlay and a feature-grid below it). What's specific here: the palette is developer-grade "brass and stone," not startup neon; the hero is an admitted illustration substitution rather than a stock photo, which is a decision forced by this being a fictional company, not a generic template choice; and the page deliberately withholds the feature grid / testimonial carousel that a generic real-estate template would default to, putting the possession date (a real, specific fact) where a generic site would put a "why choose us" section.

Revision made after the check: dropped an initial idea to add a subtle parallax scroll on the hero — that reads as generic "modern web agency" motion and adds JS weight to a page that's supposed to ship near-zero client JS. Replaced with a single CSS-only fade-in.
