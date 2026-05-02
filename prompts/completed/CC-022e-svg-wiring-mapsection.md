# CC-022e — SVG Wiring (MapSection only)

**Type:** UI wiring of design assets that are already in the repo.
**Goal:** Render each of the eight body-map SVGs above its matching ShapeCard in `MapSection`, at the size the design package was designed for.
**Predecessor:** CC-022d (file drop landed `public/cards/01-…svg` through `08-…svg`).
**Successor:** **CC-022f** (small body-map icon on `QuestionShell`) — explicitly out of scope for this CC. See §"Why this CC stops at MapSection" below.

---

## Context — why we're doing this

CC-022d copied the eight body-map SVGs into `public/cards/`. They are reachable by URL (`/cards/01-lens-eyes.svg`, etc.) but no component renders them. Result: the card files exist on disk and serve over HTTP, but a user moving through the product never sees them. Jason confirmed this manually: *"I went through every screen, and there are no images."* This CC ends that gap for the Map.

The SVGs are display-grade editorial plates, not UI icons. The bundle's README (`docs/design_handoff_v2/README.md`) is explicit:

> **Right places:** card-opener screens, the Inner Constitution artifact, top of section reviews, print/PDF export. Display at **140–280px** on screen, with breathing room.
> **Wrong places:** dense list rows, navigation bars, buttons. **Don't shrink below 96px — the line work falls apart.**

Decision A (locked, 2026-04-26): no card-opener screens. The SVGs land in two surfaces only — **Map** (full size, this CC) and **survey screens** (small icon, future CC-022f, with a separate design call about tiny-size legibility).

---

## Scope

This CC modifies exactly two files:

1. `app/components/MapSection.tsx` — render an SVG above each of the eight ShapeCards.
2. A new `lib/cardAssets.ts` (or equivalent) — single source of truth mapping `ShapeCardId → /cards/NN-slug.svg`.

Nothing else. No data changes, no engine changes, no canon updates, no test fixture churn, no `QuestionShell` edits.

---

## Steps

### 1. Create `lib/cardAssets.ts`

Single named export:

```ts
import type { ShapeCardId } from "./identityEngine";

/**
 * Map of shape card → public-path to the body-map SVG.
 * Files were dropped by CC-022d. Filenames match the canonical
 * order in docs/canon/shape-framework.md.
 */
export const SHAPE_CARD_SVG_PATHS: Record<ShapeCardId, string> = {
  lens:       "/cards/01-lens-eyes.svg",
  compass:    "/cards/02-compass-heart.svg",
  conviction: "/cards/03-conviction-voice.svg",
  gravity:    "/cards/04-gravity-spine.svg",
  trust:      "/cards/05-trust-ears.svg",
  weather:    "/cards/06-weather-nervous-system.svg",
  fire:       "/cards/07-fire-immune-response.svg",
  path:       "/cards/08-path-gait.svg",
};

/**
 * Display sizing for the Map render. README says 140-280px with
 * breathing room; we're targeting the middle of the band.
 */
export const SHAPE_CARD_MAP_SIZE_PX = 200;
```

`ShapeCardId` is already exported from `lib/identityEngine.ts` (around line 3423).

If a different module placement makes more sense to the engineer (e.g. `lib/identityEngine.ts` already holds card metadata), the lookup may live there instead — what matters is *one* canonical place, not where it lives.

### 2. Render in `MapSection.tsx`

Each `<ShapeCard>` block in `MapSection` is currently followed by a `<CrossCardPatternBlock>`. The SVG renders **above the ShapeCard's accordion toggle** — visible whether the card is collapsed or expanded.

Approach (engineer's call on exact factoring):

- Wrap each `(SVG + ShapeCard + CrossCardPatternBlock)` triple in a small inline component, e.g. `<MappedShapeCard cardId="lens" … />`, that renders the SVG image then forwards the existing props through to `<ShapeCard>`.
- Or: render the SVG inline before each existing `<ShapeCard>`, with no new component.

The SVG itself uses `next/image` if the project already uses it, otherwise a plain `<img>` is fine — these are static SVGs, no responsive variants needed.

Sizing and layout:

- Width × height: **200px × 200px** desktop target (per `SHAPE_CARD_MAP_SIZE_PX`).
- **Mobile clamp:** apply `width: min(200px, 60vw); height: auto` (or equivalent inline style) so the image scales down on viewports narrower than ~333px. The aspect ratio is square, so `height: auto` keeps the SVG from squashing. On a typical 360–400px phone viewport, 200px renders at roughly half the screen with breathing room — well above the README's 96px floor and inside its 140–280px display band.
- Centered horizontally above the accordion toggle.
- Top margin: ~24px (breathing room from the previous card's bottom rule).
- Bottom margin: ~12px (so the toggle row sits close to the image without crowding).
- `alt` text: empty string. The card kicker / heading already names the card; the SVG is decorative-with-meaning, not the primary label. Screen-reader users get the heading and the prose; double-naming would be noise.
- The SVG must remain visible whether `expanded[cardId]` is true or false. (Don't gate it on the accordion state.)

Print behavior is inherited automatically. `MapSection` already has the print-expand bridge (`beforeprint` → `setAll(true)`) — once the SVG sits above the toggle, it prints with the rest of the section. No new print logic.

### 3. Verify nothing else changed

- `git diff --stat` shows only `lib/cardAssets.ts` (new) and `app/components/MapSection.tsx`.
- No changes to `data/`, `lib/types.ts`, `lib/identityEngine.ts` (other than possibly the import path), `lib/renderMirror.ts`, `app/page.tsx`, `docs/canon/`, or `prompts/`.
- `npx tsc --noEmit` exits 0.
- `npm run lint` passes.
- `npm run build` succeeds.

---

## Why this CC stops at MapSection

Jason's call (2026-04-25): *"keep them on the output report, and smaller icons that fit on the survey screens themselves (not an opener)."* Both placements are wanted; only the Map placement is unambiguous from the design package today.

The bundle README forbids rendering below 96px — the line work breaks. Survey screens want ~48–64px icons next to a kicker. **Mobile sharpens this constraint:** on a 360–400px viewport you can't fit a 96px icon next to a kicker without crowding, so the README's "don't go below 96px" guidance simply will not survive contact with the survey screen on a phone. That gap is a real design call, not an engineering call:

- **Option A:** Render the existing SVGs at 48–64px on survey screens, accepting that the line work will lose fidelity at that size. Cheapest; ships now; honest about the trade-off. Risk: looks bad, especially for Conviction · Voice and Fire · Immune Response (README-flagged for redraw).
- **Option B:** Commission a parallel set of small-size pictograms designed for 48–64px — same family, simpler line work. Adds a design round, but yields icons that hold up next to a kicker on mobile.
- **Option C:** Skip survey-screen icons entirely; rely on the kicker text alone. Cheapest; loses the visual continuity Jason wanted.

CC-022f is the surface where that choice gets made. CC-022e doesn't preempt it. The mobile-first constraint should be named explicitly in the CC-022f draft so the design lab understands that the 96px floor is being knowingly violated, not overlooked.

---

## Acceptance

- A user loading the report after completing the survey sees a body-map SVG above each of the eight ShapeCards in the Map section.
- The SVGs are visible whether each card is collapsed or expanded.
- Printing the report includes all eight SVGs (handled by the existing print-expand bridge).
- The single source of truth for `ShapeCardId → SVG path` is `lib/cardAssets.ts` (or wherever the engineer chose to place it — only one canonical lookup).
- `git diff --stat` against pre-CC head shows additions only, in the two named files.
- Build, type-check, and lint all pass.
- The markdown export from `lib/renderMirror.ts` is unchanged. (Markdown is text-only; SVGs are visual chrome and intentionally don't appear there.)

---

## Out of scope

- `QuestionShell` icons — CC-022f.
- Inner Constitution artifact's use of the SVGs — separate CC, tied to spec §10 alignment.
- Card-opener screens — Decision A locked; not building them.
- Replacing or editing the SVGs themselves — design lab call, not an engineering one.
- Any markdown / text-export changes.

If you find yourself editing anything outside `lib/cardAssets.ts` and `app/components/MapSection.tsx`, stop and flag.

---

## Notes for the executing engineer

- The SVGs are **v1 — not design-approved**. Conviction · Voice and Fire · Immune Response are the README-flagged candidates for replacement. When alternates land, they'll arrive at the same paths with the same filenames; this CC's `SHAPE_CARD_SVG_PATHS` table holds without edits.
- The cross-card pattern block (`<CrossCardPatternBlock>`) sits *between* each ShapeCard pair today and renders only when the card above it is expanded. The SVG is sibling to the ShapeCard, not the pattern block — render order is `[SVG] [ShapeCard] [CrossCardPatternBlock]` per card.
- 200px is the explicit target. The README's range is 140–280px; 200 sits center-band with margin for both larger and smaller phones. If real-device testing surfaces an issue, that's a follow-up tweak, not a CC-022e blocker.
- Browser smoke is required before this CC closes — engine checks (build, lint, type) verify the wiring compiles, not that the rendered Map looks right. The visual verification is Jason's.
