# CC-SYNTHESIS-1A — Risk Form 2x2 + Four-Quadrant Movement Rename + Two-Tier Closing Phrase

**Origin:** Per `project_synthesis_layer_collapse` (memory) — Jason+Clarence architecture sketch 2026-05-08 collapses 3C drive distribution + Goal/Soul trajectory + Work/Love/Give expression into one unified read. CC-SYNTHESIS-1A is the smallest, most-mechanical first pass: three structural additions that operationalize parts of the collapse without committing to the full architecture or the canonical phrase block.

The three additions:
1. **Risk Form 2x2:** classifier function takes Risk-bucket% (Drive distribution.compliance) and Gripping Pull score, returns one of {Wisdom-governed, Grip-governed, Free movement, Reckless-fearful}. Renders as a labeled output. Per Jason canon: "Risk is not Grip. Risk becomes Grip when the governor starts preventing movement instead of aiming it."
2. **Four-Quadrant Movement chart rename:** replaces current quadrant string ("Early Giving / Goal-leaning") with one of {Drift, Work without Presence, Love without Form, Giving / Presence} based on Goal/Soul thresholds.
3. **Two-Tier Closing-Phrase logic:** gated switch between "the early shape of giving" (default; partial integration) and "Giving is Work that has found its beloved object" (high Goal + high Soul + Wisdom-governed Risk Form; arrived state).

**Method discipline:** Mechanical to light-judgment work. No new claims; no engine math changes; no signal-pool changes. Three new derived classifications on top of existing engine outputs.

**Scope frame:** ~3-4 hours executor time. CC-scale because it adds new classification logic with thresholds that carry minor judgment, not because the work is heavy.

**Gating note:** The four-quadrant rename canonizes synthesis vocabulary. Its empirical grounding depends on CODEX-PROSE-CORRELATION's verdict. If that audit lands STRONG or WEAK, ship as drafted. If NO support, the four-quadrant labels remain technically valid (they're just Goal/Soul threshold readings) but the canonical phrase block from `project_synthesis_layer_collapse` does NOT ship in this CC. The Risk Form 2x2 and closing-phrase logic are independent of correlation results and ship regardless.

**Project memory context:** `project_synthesis_layer_collapse` (master architecture); `feedback_coherence_over_cleverness` (close coherence first; this CC is structural, not cleverness); `feedback_drive_case_vs_bucket_lean` (Drive bucket field names: distribution.cost / distribution.coverage / distribution.compliance); `project_cc_prose_track_status` (CC-PROSE track closed; this CC builds on that foundation).

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Execution Directive

Single pass with three coordinated additions. **Addition 1 (Risk Form 2x2):** new classifier in `lib/riskForm.ts`; consumed by Fire card prose and a new field in Movement output. **Addition 2 (four-quadrant rename):** new classifier in `lib/movementQuadrant.ts`; replaces the current quadrant string in Movement section. **Addition 3 (two-tier closing phrase):** logic in the existing closing-read composer (locate via grep on "the early shape of giving") that selects between two phrases based on Movement state.

Both render paths (markdown / React) stay synchronized. Shared composers in `lib/`, consumed by both renderers.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run audit:ocean`
- `npm run audit:goal-soul-give`
- `npx tsx tests/audit/proseArchitecture.audit.ts`
- `npx tsx tests/audit/synthesis1a.audit.ts` (the new file added by this CC)
- `npm run dev`
- `git status`, `git diff`
- `node`, `npx tsx`
- `cat`, `grep`, `find`

## Read First (Required)

1. `lib/identityEngine.ts` — `buildInnerConstitution` and the existing closing-read composer. Locate where "the early shape of giving" string is generated (grep for it).
2. `lib/drive.ts` — `computeDriveOutput` returns `distribution.{cost, coverage, compliance}` percentages. Confirm the field shape.
3. `lib/goalSoulMovement.ts` (or equivalent — confirm via grep on `grippingPull` or `goalSoulMovement`) — Movement output shape; confirm `goal`, `soul`, `direction`, `strength`, `grippingPull.score` field names.
4. `lib/renderMirror.ts` — markdown render path. Identify where Movement section's "Quadrant: ..." line renders. Identify where the closing-read prose gets emitted.
5. `app/components/MirrorSection.tsx` and `app/components/InnerConstitutionPage.tsx` — React render paths.
6. `lib/types.ts` — `InnerConstitutionOutput` type. New fields will be added here.
7. `tests/audit/proseArchitecture.audit.ts` — existing audit harness; CC-SYNTHESIS-1A adds its own audit file (`synthesis1a.audit.ts`).

## Allowed to Modify

### Addition 1 — Risk Form 2x2

**New file:** `lib/riskForm.ts`.
**Files modified:** `lib/types.ts` (new field on `InnerConstitutionOutput`); `lib/identityEngine.ts` (compute and attach the new field); `lib/renderMirror.ts` (render the new field in the Fire card or Movement section); React component(s) consuming Fire/Movement.

**Classifier signature:**

```ts
export type RiskFormLetter = "Wisdom-governed" | "Grip-governed" | "Free movement" | "Reckless-fearful";

export interface RiskFormReading {
  letter: RiskFormLetter;
  riskBucketPct: number;
  gripScore: number;
  prose: string; // human-readable one-line summary
}

export function computeRiskForm(
  driveDistribution: { cost: number; coverage: number; compliance: number },
  grippingPullScore: number
): RiskFormReading;
```

**Classification rules:**

```
riskBucketPct = driveDistribution.compliance (0-100)
gripScore = grippingPullScore (0-100)

Thresholds:
  HIGH_RISK_BUCKET = 30 (≥30% compliance bucket = "high risk-orientation")
  HIGH_GRIP = 40 (≥40 grip score = "locking up")

  | riskBucketPct ≥ 30 + gripScore < 40 → "Wisdom-governed"
  | riskBucketPct ≥ 30 + gripScore ≥ 40 → "Grip-governed"
  | riskBucketPct < 30 + gripScore < 40 → "Free movement"
  | riskBucketPct < 30 + gripScore ≥ 40 → "Reckless-fearful"
```

**Threshold rationale:** 30% on the Risk-bucket is below the 38% bucket-lean threshold (per `feedback_drive_case_vs_bucket_lean`); a Risk-bucket "high enough to function as a governor" doesn't have to be a *bucket lean*. 40 on grip is the boundary where the grip starts dominating the chart per CC-PROSE-1A's halo calibration math (grip=40 → halo r ~11 svg-units, ~7% plot diameter, the visible-but-not-dominant inflection). Both thresholds are tunable in `lib/riskForm.ts` constants (`RISK_FORM_HIGH_BUCKET`, `RISK_FORM_HIGH_GRIP`) so CC-SYNTHESIS-1B/cohort feedback can adjust without touching the classifier logic.

**Prose templates per letter:**

- **Wisdom-governed:** "Your Risk Form reads as Wisdom-governed: risk-orientation present, grip moderate. The governor appears to aim movement rather than prevent it."
- **Grip-governed:** "Your Risk Form reads as Grip-governed: risk-orientation present, but grip has begun to lock up movement. The governor may be preventing motion in the name of safety."
- **Free movement:** "Your Risk Form reads as Free movement: low risk-orientation, low grip. Motion appears unimpeded — though without strong governance, calibration may be a future asking."
- **Reckless-fearful:** "Your Risk Form reads as Reckless-fearful: low risk-orientation, but grip has activated. Motion is constrained by fear rather than by considered Risk."

These prose templates use the existing engine hedge language ("appears to" / "may"). Do NOT add new hedges per `feedback_hedge_density_in_engine_prose`.

**Render position:** Inside the Fire (Immune Response) card's body prose, OR as a labeled line in the Movement section. Executor picks the cleaner placement; default to a new line at the top of the Fire card's Strength block (replacing or augmenting the existing willingness-to-bear-cost language). Document the choice in Report Back.

**Audit:** Classifier covers all four cells across the 20-fixture cohort (every fixture lands in exactly one cell; no fixture lands in zero or multiple cells).

### Addition 2 — Four-Quadrant Movement chart rename

**New file:** `lib/movementQuadrant.ts`.
**Files modified:** `lib/types.ts` (new field on Movement output); `lib/goalSoulMovement.ts` or `lib/identityEngine.ts` (attach the new field); `lib/renderMirror.ts` (render the new label in the Movement section).

**Classifier signature:**

```ts
export type MovementQuadrantLabel = "Drift" | "Work without Presence" | "Love without Form" | "Giving / Presence";

export interface MovementQuadrantReading {
  label: MovementQuadrantLabel;
  goal: number;
  soul: number;
}

export function computeMovementQuadrant(goal: number, soul: number): MovementQuadrantReading;
```

**Classification rules:**

```
HIGH_THRESHOLD = 50 (Goal or Soul ≥ 50 = "high")

  goal < 50 + soul < 50 → "Drift"
  goal ≥ 50 + soul < 50 → "Work without Presence"
  goal < 50 + soul ≥ 50 → "Love without Form"
  goal ≥ 50 + soul ≥ 50 → "Giving / Presence"
```

**Threshold rationale:** 50 is the natural midpoint of the 0-100 axis. Tunable via `MOVEMENT_QUADRANT_HIGH_THRESHOLD` constant in `lib/movementQuadrant.ts`.

**Render position:** Replace the current "Quadrant: ..." line in the Movement section's bullet list. Where Jason's canonical fixture renders "Quadrant: Early Giving / Goal-leaning" today, post-1A renders "Quadrant: Giving / Presence" (or whichever cell that fixture lands in). The bias direction (Goal-leaning / Soul-leaning / balanced) stays as a SEPARATE field in the existing Direction/Direction angle line — do NOT collapse the two; they're orthogonal.

**Render rule:** The existing engine's bias-direction language ("Goal-leaning", "Soul-leaning", "balanced") stays in the Direction line. The new four-quadrant label appears on the Quadrant line. They're independent readings.

**Audit:** Every fixture lands in exactly one of the four quadrants.

### Addition 3 — Two-Tier Closing-Phrase logic

**Files modified:** `lib/identityEngine.ts` (or wherever the closing-read composer is — locate via grep on "the early shape of giving"). Single function modification: gate the phrase choice based on Movement state + Risk Form.

**Logic:**

```
defaultPhrase = "the early shape of giving"
arrivedPhrase = "Giving is Work that has found its beloved object"

If movementQuadrant.label === "Giving / Presence" 
   AND riskForm.letter === "Wisdom-governed"
   AND movementStrength ≥ 70 (per existing strength scale)
   → use arrivedPhrase
Else
   → use defaultPhrase
```

**Threshold rationale:** All three conditions (high Goal + high Soul + Wisdom-governed Risk + strong movement) must hold for the arrived phrase to fire. This prevents the canonical close from over-firing per Jason canon: "the canonical close is reserved for arrived shapes; default to early-shape-of-giving for ambiguous or transitional shapes." Threshold 70 on movementStrength is the existing "long" threshold per the engine's length-of-line classification — confirm the threshold via grep on "long" in goalSoulMovement.ts.

**Render rule:** The closing-read composer's existing prose stays verbatim except for the substituted phrase. The substitution is mechanical (find-and-replace at composition time); the surrounding sentence is unchanged.

**Audit:** Across the 20 fixtures, count how many fixtures fire `arrivedPhrase` vs `defaultPhrase`. Report the count in Report Back. Per Jason canon, most fixtures should land on `defaultPhrase`; only a small minority should fire `arrivedPhrase` (the ones that genuinely qualify).

### Addition 4 — Audit assertions

**New file:** `tests/audit/synthesis1a.audit.ts`. Add CC-SYNTHESIS-1A assertion block (run across all 20 fixtures):

- `synth-1a-risk-form-letter-present`: Every fixture's output contains a non-null `riskForm.letter` value, one of the four canonical letters.
- `synth-1a-risk-form-coverage`: Across the 20 fixtures, all four Risk Form letters are represented (or, if cohort doesn't cover all four, document the gap).
- `synth-1a-risk-form-prose-rendered`: Every fixture's rendered output (markdown) contains the Risk Form prose line.
- `synth-1a-quadrant-label-present`: Every fixture's output contains a non-null `movementQuadrant.label` value, one of the four canonical labels.
- `synth-1a-quadrant-coverage`: Across the 20 fixtures, all four quadrant labels are represented (or document the gap).
- `synth-1a-quadrant-replaces-old`: For every fixture's rendered output, the Movement section contains exactly ONE of the four canonical quadrant labels in the Quadrant line. The pre-1A "Early Giving / Goal-leaning" composite string does NOT appear.
- `synth-1a-bias-direction-preserved`: The existing bias-direction language (Goal-leaning / Soul-leaning / balanced) is still present in the Direction line. Not collapsed into the Quadrant line.
- `synth-1a-closing-phrase-default`: For fixtures NOT meeting all three arrived-phrase conditions, the closing-read renders "the early shape of giving" verbatim.
- `synth-1a-closing-phrase-arrived`: For fixtures meeting all three arrived-phrase conditions, the closing-read renders "Giving is Work that has found its beloved object" verbatim.
- `synth-1a-closing-phrase-mutually-exclusive`: No fixture's rendered output contains BOTH closing phrases.

## Out of Scope (Do Not)

1. **Do NOT modify any signal pool, intensity math, or composite consumption.** `SIGNAL_OCEAN_TAGS`, `INTENSITY_K`, `computeOceanIntensities`, `computeGoalSoulGive`, `computeMovement`, `computeDriveOutput`, `computeLoveMapOutput` — all untouched.
2. **Do NOT modify CC-PROSE-1 / 1A / 1B canon.** `composeExecutiveRead`, `SHAPE_CARD_QUESTION`, `MOVEMENT_GRIP_HALO_MAX`, `generateSimpleSummary`, "Pattern in motion" label, callout visual treatment, Layer 4 / 5 / 6 composers — all untouched. CC-SYNTHESIS-1A builds on top.
3. **Do NOT add patterns to the pattern catalog.** That's CC-JUNGIAN-COMPLETION's territory.
4. **Do NOT add Movement Notes to body cards.** That's CC-SYNTHESIS-1C's territory.
5. **Do NOT reframe Trust or Weather cards.** That's CC-SYNTHESIS-1B's territory.
6. **Do NOT canonize the synthesis canonical phrase block** ("Cost powers Goal / Work. Coverage powers Soul / Love. ..." per `project_synthesis_layer_collapse`) into user-facing prose. That depends on CODEX-PROSE-CORRELATION's verdict; if it lands STRONG or WEAK, a future CC ships the block. CC-SYNTHESIS-1A only ships the three structural additions.
7. **Do NOT remove or compress** any existing report section.
8. **Do NOT add hedges.** Per `feedback_hedge_density_in_engine_prose`. Risk Form prose templates use existing hedge language only.
9. **Do NOT invent new claims.** Risk Form, Quadrant, and closing-phrase selection are all derivations of existing engine output.
10. **Do NOT add LLM calls or API integrations.** Pure structural classifier work.
11. **Do NOT modify the masthead or "How to Read This."**
12. **Do NOT modify section ordering.**
13. **Do NOT modify** the question bank, fixture files, `MEMORY.md`, `AGENTS.md`, `docs/canon/`, or any spec memo.
14. **Do NOT install dependencies.**
15. **Do NOT modify band thresholds, calibration constants beyond the new ones in `lib/riskForm.ts` and `lib/movementQuadrant.ts`, or any architectural piece from CC-AS / CC-JX / CC-ES / CODEX-086 / CODEX-087.**
16. **Do NOT touch existing audit assertions** (`prose-1-*`, `prose-1a-*`, `prose-1b-*`, OCEAN, Goal/Soul/Give). They stay green; CC-SYNTHESIS-1A adds new `synth-1a-*` assertions in a new file.

## Acceptance Criteria

1. Risk Form 2x2 classifier ships at `lib/riskForm.ts`; every fixture's output carries a `riskForm` field with letter, percentages, and prose.
2. Four-quadrant Movement label classifier ships at `lib/movementQuadrant.ts`; every fixture's output carries a `movementQuadrant` field; the Quadrant line in the Movement section renders one of the four canonical labels.
3. Bias-direction language (Goal-leaning / Soul-leaning / balanced) preserved in the Direction line — not collapsed into the Quadrant line.
4. Two-tier closing-phrase logic ships in the closing-read composer; "Giving is Work that has found its beloved object" fires only for fixtures meeting all three arrived-phrase conditions.
5. All 10 new `synth-1a-*` audit assertions pass.
6. All existing CC-PROSE-1 / 1A / 1B audit assertions still pass (regression).
7. Existing OCEAN audit assertions pass.
8. Existing Goal/Soul/Give audit assertions pass.
9. CC-AS / CC-JX / CC-ES / CODEX-086 / CODEX-087 regression: all assertions still pass.
10. `npx tsc --noEmit` exits 0.
11. `npm run lint` exits 0.
12. `npx tsx tests/audit/synthesis1a.audit.ts` exits 0.
13. `git status --short` shows only Allowed-to-Modify files.

## Report Back

1. **Summary** in 4-6 sentences. Confirm the three additions landed cleanly.
2. **Risk Form distribution across cohort** — paste a table showing how many of the 20 fixtures land in each of the four cells. If any cell is empty, name which fixtures came closest and why none landed there.
3. **Quadrant distribution across cohort** — paste a table showing how many fixtures land in each of the four quadrants. Note whether the quadrant labels feel intuitive against your read of the fixture data.
4. **Closing-phrase fire rate** — count of fixtures firing the arrived phrase vs the default phrase. List the fixtures that fire the arrived phrase by name.
5. **Render samples** — paste the Risk Form prose line and the Movement Quadrant line for at least 3 fixtures (Jason canonical, one Soul-leaning fixture, one balanced fixture).
6. **Threshold tunability** — confirm `RISK_FORM_HIGH_BUCKET`, `RISK_FORM_HIGH_GRIP`, `MOVEMENT_QUADRANT_HIGH_THRESHOLD` are accessible constants. If cohort feedback later argues for adjusting any threshold, the tuning surface is one constant, not a code rewrite.
7. **Audit pass/fail breakdown** — including all 10 new `synth-1a-*` assertions, CC-PROSE-1 / 1A / 1B regression, OCEAN + Goal/Soul/Give regression, CC-AS / CC-JX / CC-ES / CODEX-086 / CODEX-087 regression.
8. **Out-of-scope verification** — git status; explicit confirmation that signal pool, intensity math, composite consumption, fixture data, calibration constants beyond the new ones, masthead, body card prose, hedging language, CC-PROSE canon, question bank, and spec memos are all untouched.
9. **Recommendation for CC-SYNTHESIS-1B/1C** — based on what landed in 1A, what does 1B (Trust + Weather reframes) and 1C (Movement Notes + Path restructure) inherit cleanly? Any threshold adjustments needed before 1B/1C ship?
