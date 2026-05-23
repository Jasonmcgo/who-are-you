# CC-133 — Cover cleanup + label decisions (hand-applied)

Hand-applied edits (not an agent CC), recorded for traceability. Render-only;
no engine/derivation change. `npx tsc --noEmit` clean.

## Changes

1. **Cover trimmed to three elements** then to **two label-free elements.**
   Final cover = masthead ("The Inner Constitution", from the page header) +
   "FOR {NAME}". Removed the duplicate masthead (page-header subtitle "a
   possibility, not a verdict" now Guide-only via `mode !== "user"`), the
   surface-label reframe paragraph, and ultimately the archetype headline.

2. **Archetype/Lens labels pulled from the cover (parked).** Decision: a
   coarse 3–4-bucket archetype label can't be accurate per person (an INFJ
   routes to jasonType), and single-word Lens labels over-claim. The
   `ARCHETYPE_DISPLAY_LABEL` table + `resolveArchetypeDisplayLabel` remain in
   `lib/fiftyDegreeIndividual.ts` but are **unwired** — kept for the future
   engine-derived label (see `docs/pattern-taxonomy-notes.md`).
   - Ratified-but-parked labels: Conviction-Driven Architect / Present-Tense
     Caregiver (Se) / Possibility-Driven Caregiver (Ne) / Faithful Steward /
     "A Shape not contained in a box".

3. **Executive Read pull-quote relocated to an epigraph** under the cover
   (`composeEpigraph` / `<Epigraph>`), on both markdown + React surfaces. It
   is the per-person synthesis line and leads the report; populates after the
   cache regen (sourced from the warm `executiveRead` rewrite).

## Files
- `lib/fiftyDegreeIndividual.ts`
- `app/components/FiftyDegreeIndividualSection.tsx`
- `app/components/InnerConstitutionPage.tsx`

## Follow-ups
- Optional deterministic epigraph fallback so the cover isn't bare pre-regen.
- Guide MBTI "box/table" (owner asked) — not built; separate small change.
- Re-snapshot two-tier baseline (cover render changed) — via regen-cache.sh.
