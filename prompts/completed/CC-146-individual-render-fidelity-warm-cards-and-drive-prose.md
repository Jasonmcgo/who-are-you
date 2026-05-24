# CC-146 — Individual render fidelity: warm 4-card splice + claimed-vs-revealed drive prose

> Owner-driven follow-up to CC-145. Two gaps remain between the Individual (user
> mode) and the Guide: (1) the 4 deep cards (Lens/Compass/Hands/Path) render
> ENGINE prose on the Individual while the Guide shows the warm LLM splice — they
> diverge; (2) the Work/Love/Giving section renders the donut + Work/Love/Give
> beats but omits the claimed-vs-revealed drive narrative ("you claim X but reveal
> Y — alignment or tension"). Close both.

## Execution mode

Proceed without pausing. Single pass. On ambiguity, apply the codebase-faithful
interpretation, proceed, and flag it.

## Launch Directive

`claude --dangerously-skip-permissions`. Independent of CC-147/CC-148 and the
couple-module CCs. **Runs on top of CC-145's changes — CC-145 must be committed
first** (it touches the same two Individual files). Render/composition only; no
engine-math change, no new LLM generation (reuses the live splice that already
feeds the Guide).

## Context — verified code facts

**Part A — warm 4-card splice (React-only).**
- The live warm rewrites already exist in `app/components/InnerConstitutionPage.tsx`:
  `liveScopedRewrites` state (~L235-262) carries `lens / compass / hands / path`
  (each `string | null`), fetched client-side. Engine prose is the default; the
  warm string swaps in silently when it arrives.
- The Guide applies these via `MapSection` (`app/components/MapSection.tsx`):
  `llmRewriteMarkdown={liveScopedRewrites?.lens ?? null}` per card → rendered by
  `<LlmProseBlock>` instead of engine prose. **This is the reference pattern to
  mirror.**
- BUT `MapSection` is **clinician-only**. The Individual (`mode === "user"`,
  InnerConstitutionPage ~L572-587) renders **only** `FiftyDegreeIndividualSection`,
  and the `liveRewrites` object passed to it (~L578-585) includes executiveRead /
  corePattern / pathTriptych / keystone / closingRead / synthesis but **NOT**
  lens / compass / hands / path. So the Individual's CC-145 `BodyCards` (sourced
  from `lib/bodyCardFieldMap.ts` → `constitution.shape_outputs[...]`) are the sole
  card render on the user surface and are always cold.
- The markdown composer (`composeBodyCards` in `lib/fiftyDegreeIndividual.ts`) runs
  server-side without the live rewrites, so it CANNOT show warm prose — leave it
  on engine prose. **Part A is React-only**, exactly as the Guide's warm cards are
  React-only via MapSection.

**Part B — claimed-vs-revealed drive prose.**
- The narrative already exists: `generateDriveProse(output: DriveOutput): string`
  in `lib/drive.ts` (L533) — six case-aware templates (aligned / inverted-small /
  inverted-big / partial / balanced / unstated), each closing "Which feels
  closer?". This is the alignment/tension read the owner wants ("if you picked
  Building but value People/Risk, say so").
- The Individual's `composeWorkLoveGiving` (`lib/fiftyDegreeIndividual.ts` ~L415)
  renders the donut + Work/Love/Give beats but does **not** call
  `generateDriveProse`, and omits the "Claimed drive: 1…2…3…" + "Distribution:…"
  lines the Guide emits (`lib/renderMirror.ts` ~L1870-1890).
- `constitution.shape_outputs.path.drive` is a `DriveOutput` (carries
  `.distribution`, `.claimed`, `.case` — verified `lib/types.ts` L566 + L629-632),
  so `generateDriveProse(drive)` drops in directly.

## Tasks

**A1.** In `InnerConstitutionPage.tsx`, add `lens`, `compass`, `hands`, `path`
(from `liveScopedRewrites`) to the `liveRewrites` object passed to
`<FiftyDegreeIndividualSection>` (~L578-585).

**A2.** In `FiftyDegreeIndividualSection.tsx`, accept the 4 new `liveRewrites`
fields and thread them into `BodyCards`. For each of the 4 cards (lens / compass /
hands / path), when the warm rewrite is non-null/non-empty, render it as the card
body (mirror MapSection's `<LlmProseBlock>` treatment) **instead of** the engine
Strength/Growth-Edge/Practice from `bodyCardFieldMap`. When null, fall back to the
CC-145 engine prose unchanged. The other 4 cards (gravity/trust/weather/fire/
conviction — note there is no warm slot for them) always use engine prose.

**A3.** Leave the markdown composer (`composeBodyCards`) on engine prose; add a
one-line comment noting warm prose is React-only (no live rewrites server-side),
matching the Guide.

**B1.** In `composeWorkLoveGiving` (`lib/fiftyDegreeIndividual.ts`), after the
donut and before/around the Work/Love/Give beats, emit (when `drive` is present):
the `Distribution: …` line, the `Claimed drive: 1. … · 2. … · 3. …` line, and
`generateDriveProse(drive)`. Reproduce the Guide's placement/labels
(`renderMirror.ts` ~L1870-1890) so the Individual matches.

**B2.** Mirror B1 in the React `WorkLoveGiving` of `FiftyDegreeIndividualSection.tsx`
so both surfaces show the drive prose.

## Allowed to modify

- `app/components/InnerConstitutionPage.tsx` (A1 only — the 4 added fields)
- `app/components/FiftyDegreeIndividualSection.tsx` (A2, B2)
- `lib/fiftyDegreeIndividual.ts` (A3 comment, B1)
- the CC-145 audit `tests/audit/individualBodyCardsEnrichment.audit.ts` may be
  EXTENDED (not weakened) to cover the new behavior
- `tests/audit/twoTierBaseline.snapshot.json` only if a re-snapshot is required
  (Part B changes Individual markdown; re-snapshot LAST if so)

Do NOT touch `MapSection.tsx`, `renderMirror.ts`, `lib/drive.ts`,
`lib/driveDistributionChart.ts`, or any engine/derivation file.

## Acceptance criteria

1. Individual user-mode render: with a warm `lens` rewrite present, the Lens card
   body shows the warm text (not the engine Strength/Growth/Practice); with it
   null, shows engine prose. Same for compass/hands/path. Prove with one fixture.
2. Guide (clinician) render byte-identical — Part A is user-mode only; MapSection
   untouched.
3. Individual Work/Love/Giving now contains the `generateDriveProse(drive)`
   paragraph + Claimed/Distribution lines, matching the Guide's text for the same
   fixture (aligned AND one inverted/partial fixture, to prove case routing).
4. Movement numerics + lens stack byte-identical across cohort fixtures (no engine
   change). `tsc` + lint clean; CC-145 audit still green (extended, not weakened).

## Flag in report

- Confirm `path.drive.case` populates for the fixtures tested (if a fixture lacks
  Q-3C1, `generateDriveProse` should still render the "unstated" template — verify
  it doesn't throw).
- Whether the React `BodyCards` warm-vs-engine branch needed a shared helper to
  stay single-sourced with the markdown path, or whether they legitimately diverge
  (markdown = always engine, React = warm-when-present). State which.
