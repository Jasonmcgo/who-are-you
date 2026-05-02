# CC-022f — SVG Wiring (QuestionShell, small icon above kicker)

**Type:** UI wiring of design assets that are already in the repo.
**Goal:** Render a small body-map icon above the kicker on every survey question screen, mapped from the question's `card_id` to the matching body-map SVG.
**Predecessor:** CC-022e (Map render in `MapSection`, full size 200px, shipped).
**Successor:** None planned. CC-022f-fix may follow if v1 squeeze looks bad and we commission small-size pictograms.

---

## Context — what we're solving and what we're not

CC-022e put the eight body-map SVGs above the eight ShapeCards on the report. Survey screens are still iconless. Jason's call (2026-04-25): *"keep them on the output report, and smaller icons that fit on the survey screens themselves (not an opener)."*

The bundle README (`docs/design_handoff_v2/README.md`) is explicit:

> **Wrong places:** dense list rows, navigation bars, buttons. **Don't shrink below 96px — the line work falls apart.**

This CC violates that floor knowingly. The mobile-first reality is harder than the README's display-target language acknowledges: on a 360–400px phone viewport you cannot fit a 96px icon next to a kicker without crowding. Three options were laid out in CC-022e's "Why this CC stops at MapSection" section. **CC-022f executes Option A** (squeeze v1 SVGs at 64px) per Jason's "let's try it, if it looks bad we'll change" call. If smoke shows the line work breaking visibly, the fix is Option B (commission small-size pictograms) in a follow-up.

---

## Scope

This CC modifies exactly three files:

1. `lib/cardAssets.ts` — extend the existing module with a survey-`CardId` → `ShapeCardId` mapping table, a kicker-icon size constant, and a helper that resolves a survey `card_id` to an SVG path.
2. `app/components/QuestionShell.tsx` — accept an optional `cardId` prop; when present, render the small body-map SVG above the kicker.
3. `app/page.tsx` and `app/components/SecondPassPage.tsx` — pass the question's `card_id` through to `QuestionShell`. (Both surfaces render `<QuestionShell>`; both need the prop wired.)

Nothing else. No data changes, no engine changes, no canon updates, no `MapSection` edits, no test fixture churn.

---

## Steps

### 1. Extend `lib/cardAssets.ts`

Add to the existing file (which CC-022e created):

```ts
import type { CardId } from "./types";
import type { ShapeCardId } from "./identityEngine";

/**
 * Survey-time card ids (used in data/questions.ts) → body-map shape card ids
 * (the 8 ShapeCards on the report). Mapping rationale:
 *
 *   conviction  → conviction  Voice card; direct.
 *   pressure    → fire        Immune-response: stress / heat / pressure.
 *   formation   → lens        Formation context feeds the Lens stack.
 *   context     → weather     External conditions = weather card.
 *   agency      → gravity     Locus of control / standing = spine.
 *   sacred      → compass     Sacred values are a Compass output.
 *   temperament → lens        Four Voices / Jungian functions = perception.
 *   role        → path        Role / profession lives on Path · Gait.
 *   contradiction → conviction Contradictions surface in Voice (Keystone block).
 *
 * Two survey ids map to `lens` (formation, temperament). That's intentional —
 * both feed the same Lens/perception read. `role` and `contradiction` are
 * reserved CardId values not currently used in data/questions.ts; the entries
 * are present for completeness so future questions don't silently fall through.
 */
export const SURVEY_CARD_TO_SHAPE_CARD: Record<CardId, ShapeCardId> = {
  conviction:    "conviction",
  pressure:      "fire",
  formation:     "lens",
  context:       "weather",
  agency:        "gravity",
  sacred:        "compass",
  temperament:   "lens",
  role:          "path",
  contradiction: "conviction",
};

/**
 * Kicker-icon target size on survey screens. Below the README's 96px floor —
 * deliberate, eyes-open trade-off (see CC-022f prompt). Mobile clamp applied
 * at the render site so narrow viewports scale down further.
 */
export const SHAPE_CARD_KICKER_ICON_SIZE_PX = 64;

/**
 * Helper: resolve a survey card id to its body-map SVG path.
 * Returns null if the mapping or asset is missing (defensive — shouldn't
 * happen in practice, but lets the caller render no icon rather than
 * crashing if a future card_id is added without updating this module).
 */
export function getSurveyKickerIcon(cardId: CardId): string | null {
  const shapeId = SURVEY_CARD_TO_SHAPE_CARD[cardId];
  if (!shapeId) return null;
  return SHAPE_CARD_SVG_PATHS[shapeId] ?? null;
}
```

### 2. Modify `app/components/QuestionShell.tsx`

Add an optional `cardId?: CardId` prop. When present:

- Resolve to an SVG path via `getSurveyKickerIcon(cardId)`.
- If the path resolves, render an `<img>` **above the kicker** (inside the existing header, before the `<ProgressIndicator>` is fine, or between progress indicator and kicker — engineer's call on which reads cleaner; the contract is "icon then kicker text" visually).
- Centered horizontally.
- Width × height attributes: 64 × 64 (per `SHAPE_CARD_KICKER_ICON_SIZE_PX`).
- Inline CSS clamp: `width: min(64px, 16vw); height: auto`. On a 320px viewport this scales down to ~51px; still visible.
- `alt=""` (decorative; the kicker text immediately below names the card).
- 12px bottom margin separating icon from kicker.
- Use the same `eslint-disable-next-line @next/next/no-img-element` pattern CC-022e established. No `next/image`.
- Add a `data-card-svg-kicker={cardId}` attribute matching CC-022e's `data-card-svg` pattern (stable hook for tests / future print CSS).

When `cardId` is absent, the header renders unchanged from today.

### 3. Pass `cardId` through from the two `QuestionShell` callers

**`app/page.tsx`** (around line 701, the main first-pass render): pass `cardId={question.card_id}` to `<QuestionShell>`.

**`app/components/SecondPassPage.tsx`** (around line 98): pass `cardId={question.card_id}` to `<QuestionShell>` there too. Second-pass questions carry the same `card_id` shape; the icon should render in second-pass surfaces consistently with first-pass.

### 4. Verify nothing else changed

- `git diff --stat` shows exactly: `lib/cardAssets.ts` (modified), `app/components/QuestionShell.tsx` (modified), `app/page.tsx` (modified), `app/components/SecondPassPage.tsx` (modified).
- No changes to `data/`, `lib/types.ts`, `lib/identityEngine.ts`, `lib/renderMirror.ts`, `app/components/MapSection.tsx`, `docs/canon/`, or `prompts/`.
- `npx tsc --noEmit` exits 0.
- `npm run lint` passes.
- `npm run build` succeeds.

---

## Acceptance

- A user moving through the survey sees a small (64px desktop, scaled on narrow phones) body-map SVG above the kicker on every question screen.
- The SVG shown matches the `SURVEY_CARD_TO_SHAPE_CARD` mapping. Sacred-values questions show the Compass · Heart SVG; conviction questions show the Conviction · Voice SVG; etc.
- The icon also appears on second-pass screens (formation/context/etc. cleanup questions) using the same mapping.
- Demographic / intro / completion screens that don't use `QuestionShell` are unchanged.
- The Map (CC-022e's full-size render) is unchanged. Markdown export is unchanged.
- `git diff --stat` shows additions only in the four named files.
- Build, type-check, and lint all pass.

---

## Out of scope

- Replacing or commissioning new SVGs — design lab call. If the v1 squeeze looks bad, the fix is a separate design round + CC-022f-fix or CC-022g.
- Inner Constitution artifact's use of the SVGs — separate CC, tied to spec §10.
- Any change to the kicker text format ("CARD N · NAME · Q-XX"). The icon sits *above* it; kicker text reads unchanged.
- Adding the icon to the second-pass intro / outro headers (`SecondPassHeader`). Only the per-question `QuestionShell` gets the icon.

If you find yourself editing anything outside the four named files, stop and flag.

---

## Notes for the executing engineer

- Two survey card ids (`formation`, `temperament`) intentionally map to the same shape card (`lens`). That isn't a bug — both feed Lens-stack perception. Don't try to disambiguate them by routing to different SVGs; the mapping reflects an architectural truth.
- `role` and `contradiction` are present in the mapping for completeness but no question in `data/questions.ts` uses them today. Including them keeps future card additions from silently falling through.
- The 64px target is below the README's 96px floor. That's intentional and named in the prompt; no need to flag it as a concern. If the v1 SVGs look broken at 64px in real use, that's design feedback for the lab, not a CC-022f bug.
- Browser smoke is required before this CC closes — engine checks verify wiring and lookup correctness, not visual fidelity. The visual verification is Jason's.
- After this CC ships, the asset / sizing pattern is: `SHAPE_CARD_SVG_PATHS` (paths), `SHAPE_CARD_MAP_SIZE_PX` (200, Map), `SHAPE_CARD_KICKER_ICON_SIZE_PX` (64, survey), `SURVEY_CARD_TO_SHAPE_CARD` (survey-id → shape-id). Any future surface that wants a body-map icon should reuse these and add its own size constant rather than duplicating the path table.
