# CC-145 — Enrich the Individual's body cards + Grip section with the Guide prose + add the two missing charts

> Owner-driven: "the body cards are worthless. Bring over the 'Guide' prose from
> the body cards, and include the SVG / images." PLUS: bring the full Guide
> **Your Grip** block (Surface Grip / Grip Pattern / Underlying Question /
> Distorted Strategy / Healthy Gift / Contributing grips / Sub-register /
> Confidence) into the Individual. Numbering: next global CC; reconcile if you prefer.

## Execution mode

Proceed without pausing for permission dialogs. Single pass, no mid-task
confirmation prompts. On ambiguity, apply the codebase-faithful interpretation,
proceed, and flag it.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.
Independent of the couple-module CCs and the 138.x line. This is a render/
composition change to the **Individual** report only.

## Context

The 50° **Individual** report (user mode; `composeFiftyDegreeIndividual` in
`lib/fiftyDegreeIndividual.ts`, React mirror in
`app/components/FiftyDegreeIndividualSection.tsx`) renders its 8 body cards as
near-worthless one-liners:

- Markdown: `composeBodyCards` (~L372) emits the card question + a one-line
  `bodyCardAnswer`.
- React: `BodyCards` (in the mirror) emits `firstTwoSentences(card.cardHeader)`.

The **Guide** renders the same 8 cards with real substance — Strength / Growth
Edge / Practice per card — plus two charts the Individual is missing: the
**Disposition Signal Mix** bar chart and the **Drive distribution donut**. (The
Individual already has the trajectory chart.) The owner wants the Individual's
cards to carry the Guide's card prose and to include those two charts.

The data is already present — this is reuse, not new generation. **No LLM cost,
no engine-math change.**

- Card prose: each card's substance is on `constitution.shape_outputs[<source>]`.
  Mapping (per the established ShapeCard field convention — DO NOT mis-wire):
  - **Strength** ← `cardHeader` (full, not first-two-sentences).
  - **Growth Edge** ← `blindSpot.text`  *(note the field inversion: UI "Growth
    Edge" reads `blindSpot`, not `growthEdge`).*
  - **Practice** ← `growthEdge.text` / `SHAPE_CARD_PRACTICE_TEXT` *(UI "Practice"
    reads `growthEdge`).*
  Confirm against how the Guide composes the 8 cards in `lib/renderMirror.ts`
  and reproduce that mapping exactly so the Individual cards match the Guide.
- Charts: `renderOceanDashboardSVG(mix)` (`lib/oceanDashboard.ts`) for the
  Disposition Signal Mix; `renderDriveDistributionDonut(...)` (
  `lib/driveDistributionChart.ts`) for the donut. Trajectory already wired via
  `generateTrajectoryChartSvgFromConstitution`.
- Grip block: the Guide's `## Your Grip` (`lib/renderMirror.ts` ~L233-294) renders
  the full grip read from `constitution.gripPattern` — the narrative paragraph
  plus Surface Grip / Grip Pattern / Underlying Question / Distorted Strategy /
  Healthy Gift / Contributing (Named) grips / Sub-register / Confidence. The
  Individual's `composePatternAndGrip` (~L287) only emits the primal-question
  blockquote + the GRIP SAYS / AIM SAYS table (React mirror: `PatternAndGrip`
  ~L447).

## Tasks

### 1. Enrich the body cards (BOTH render paths, single-sourced)

Render the full Strength / Growth Edge / Practice prose for each of the 8 cards,
matching the Guide's content and the Individual's **second-person** voice (the
Individual addresses "you"; if any card field carries the name or third person,
keep the second-person register per the inferred-not-provided canon — do not
invent new prose, just keep the voice consistent).

- Markdown: rewrite `composeBodyCards` to emit, per card: the `### NN · Name ·
  Body` header, the italic question, then **Strength** / **Growth Edge** /
  **Practice** blocks from `shape_outputs[source]`.
- React: rewrite `BodyCards` to render the same three blocks from the same
  fields. Keep the markdown composer and the React mirror **single-sourced** for
  the field mapping (a shared helper or shared constant) so they cannot drift —
  this divergence is exactly why they're both thin today.

**Warm-prose gate:** the enriched cards must show the SAME warm text the Guide
shows. Verify `shape_outputs` carries the post-`proseRewrites` warm text at
render time. If it does NOT (i.e. `shape_outputs` is pre-warm and the warmth only
exists in the rendered guide markdown), instead extract the card blocks from
`inputs.guideMd` using the existing `extractV3PathTriptych`-style pattern. Pick
whichever yields cards that match the Guide verbatim; document which you used.

### 2. Add the two missing charts (BOTH render paths)

- **Drive distribution donut** → in the **Work, Love, and Giving** section
  (top), via `renderDriveDistributionDonut`. (Note: `renderMirror` strips the
  donut in user mode via a regex ~L747 — the Individual composer should generate
  it directly, not inherit the stripped guide body.)
- **Disposition Signal Mix** bar chart → add a compact section (mirror the
  Guide's "Disposition Signal Mix" placement) via `renderOceanDashboardSVG`,
  guarded for when `constitution.ocean?.dispositionSignalMix` is absent.
- Trajectory: leave as-is.
- In the React mirror, follow the existing trajectory pattern
  (`dangerouslySetInnerHTML={{ __html: svg }}`) for the two new SVGs.

### 3. Enrich the Grip section (BOTH render paths)

Bring the Guide's full `## Your Grip` content into the Individual's Grip section,
sourced from `constitution.gripPattern` exactly as `renderMirror` does. Render, in
the Individual's second-person voice:

- the narrative grip paragraph (surface clue → underlying question → the steadier
  turn / healthy gift),
- **Surface Grip**, **Grip Pattern**, **Underlying Question**, **Distorted
  Strategy**, **Healthy Gift**,
- **Contributing grips** (the named grips), **Sub-register**, **Confidence**.

Keep the existing GRIP SAYS / AIM SAYS table as the lead-in (it's a good
Individual-specific element) and append the full block beneath it. **De-duplicate**
the doubled "Grip Pattern / Underlying Question" lines that appear in the Guide's
raw structure — present each field once. Guard for any absent field. Reuse the
same `gripPattern` accessors/labels the Guide uses; do not re-derive grip.

## Read First (Required)

- `lib/fiftyDegreeIndividual.ts`: `composeBodyCards` (~L372), `composePatternAndGrip`
  (~L287, the §4b Grip), `composeWorkLoveGiving`
  (~L401, the `extractV3PathTriptych` reuse pattern), `BODY_CARDS`, and how
  `inputs.guideMd` is supplied.
- `app/components/FiftyDegreeIndividualSection.tsx`: `BodyCards`,
  `bodyCardAnswerReact`/`firstTwoSentences`, the trajectory SVG wiring (~L389/435).
- `lib/renderMirror.ts`: how the Guide composes the 8 cards (the
  Strength/Growth-Edge/Practice field mapping) and where it calls
  `renderOceanDashboardSVG` (~L1476) and `renderDriveDistributionDonut` (~L1892);
  the user-mode donut strip (~L737-747); the `## Your Grip` block (~L233-294).
- `app/components/FiftyDegreeIndividualSection.tsx`: `PatternAndGrip` (~L447).
- `lib/gripPattern.ts` / `lib/types.ts`: the `gripPattern` (GripPatternReading)
  field shape (surfaceGrip, pattern, underlyingQuestion, distortedStrategy,
  healthyGift, contributing/named grips, subRegister, confidence).
- `lib/types.ts`: the ShapeOutput card shape (`cardHeader`, `blindSpot`,
  `growthEdge`) and the SwotCell shape.
- `lib/cardAssets.ts`: `SHAPE_CARD_QUESTION`, `SHAPE_CARD_PRACTICE_TEXT`.
- The ShapeCard field-inversion convention (Growth Edge ← blindSpot, Practice ←
  growthEdge) — get this right.

## Allowed to Modify (exhaustive)

- `lib/fiftyDegreeIndividual.ts` (body-card composition + the two chart inserts).
- `app/components/FiftyDegreeIndividualSection.tsx` (same, React mirror).
- A small shared helper/constant module if needed to single-source the card
  field mapping (new file is fine; name it clearly).
- Re-snapshot `tests/audit/twoTierBaseline.snapshot.json` if the Individual
  render is captured there (cold, LAST; the diff must be confined to the
  Individual body-cards + the two added charts).
- A new/extended audit asserting the Individual cards carry Strength/Growth-Edge/
  Practice (not one-liners) and that both charts are present in the Individual.

Nothing else. No engine math, no Movement change, no new LLM generation, no
change to the Guide/clinician render, no change to the card *data* — presentation
only.

## Out of Scope

- The Guide / clinician render (leave it exactly as-is).
- Couple module, 138.x.
- Any change to `shape_outputs` data, Movement, or the LLM caches (read-only reuse).
- Re-ordering or re-wording the other 10 Individual sections.

## Bash Commands Authorized

- `npx tsc --noEmit`, `npm run lint`, `npm run build`
- the two-tier audit, the new body-cards audit, a cohort render spot-check
- diff the Individual render before/after for one cohort to confirm the cards now
  match the Guide cards
- `grep` / `rg`

## Acceptance Criteria

1. `npx tsc --noEmit` clean; `npm run lint` clean; `npm run build` succeeds.
2. The Individual's 8 body cards each render Strength / Growth Edge / Practice
   matching the Guide's card prose (warm), in second-person voice — NOT
   one-liners. Show one cohort's before/after for 2-3 cards.
3. The Disposition Signal Mix bar chart and the Drive distribution donut both
   render in the Individual (markdown + React); trajectory still present.
3b. The Individual's Grip section carries the full block — narrative + Surface
   Grip / Grip Pattern / Underlying Question / Distorted Strategy / Healthy Gift /
   Contributing grips / Sub-register / Confidence — matching the Guide, with the
   GRIP SAYS / AIM SAYS table retained as lead-in and no doubled field lines.
4. Markdown composer and React mirror are single-sourced for the card mapping and
   produce the same content (no drift); confirm by comparing both for one cohort.
5. Field mapping correct (Growth Edge ← blindSpot, Practice ← growthEdge) — no
   inversion.
6. Movement numerics byte-identical; Guide/clinician render byte-identical
   (only the Individual changed). Two-tier re-snapshot (if applicable) confined
   to the Individual body-cards + charts.
7. No file outside the Allowed-to-Modify list edited.

## Report Back

- Which card-prose source you used (warm `shape_outputs` vs `guideMd` extraction)
  and why (the warm-prose gate result).
- One cohort's before/after for a couple of cards (the headline).
- The enriched Grip section for one cohort (confirm all fields present, no doubled lines).
- Confirmation both charts render in both paths.
- The single-source mechanism for the card mapping (how drift is prevented).
- Confirmation the Guide render + Movement are byte-identical (Individual-only change).
- Any ambiguity decision (esp. chart placement + second-person normalization).
