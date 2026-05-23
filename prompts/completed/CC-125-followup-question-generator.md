# CC-125 — Post-test follow-up question generator (deterministic)

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass.
Do not stop for confirmation between steps. On ambiguity, apply the
canon-faithful interpretation, proceed, and flag it. Permission bypass is
on; the discipline below is scope.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.

## Execution Directive

- One pass, no mid-task confirmation prompts.
- This adds a **new, self-contained module** that consumes the engine's
  existing `InnerConstitution` output and produces 3 follow-up questions. It
  does **NOT** modify the engine, scoring, derivation, the question bank, the
  report renderer, or any existing file's behavior. Pure addition + a test.
- **Deterministic rules + template-bank only. No LLM generation.** Same input
  → same output. Repeatability and readable scoring tags are the point.

## Context

The instrument's MBTI/Lens read is **smoke, not verdict**. The product goal of
these post-test clarifiers is to surface, for each person:
1. **what the Grip is protecting** (`grip_object` / `grip_fear`)
2. **what would make release feel safe** (`release_condition`)
3. **what Aim could replace the Grip** without betraying the gift (`aim_replacement`)

The engine names the grip but never the way out; this module produces the
questions whose answers will (later, separate CC) feed that "honorable
protection → cleaner protection" upgrade. Architectural precedent already in
the codebase: the `CROSS_PATTERNS` array in `lib/identityEngine.ts`
(detection-fn-on-signals → templated prose, e.g. `pattern_reader_vs_paralysis`)
is the exact rules+template model to mirror.

This CC builds the **generator only**. Email, scheduling, the answer-collection
surface, and feeding follow-up answers back into re-derivation are all OUT of
scope (separate later CCs). Links will be emailed manually for now.

## Read First (Required)

- `lib/identityEngine.ts` — `buildInnerConstitution` return shape (the
  `InnerConstitution`), and the `CROSS_PATTERNS` array (mirror its structure).
- The real engine field paths (verified) listed in **Adapter** below.
- `data/questions.ts` — confirm the scoring-tag convention: each option's
  `signal` field IS the scoring tag. Reuse that concept for option `tags`.

## Tasks

### A. New module `lib/followUpQuestions.ts` with these exact types

```ts
export type FollowUpInput = {
  personName: string;
  lens?: { typeLabel?: string; dom?: string; aux?: string;
           confidence?: "low" | "medium" | "high"; ambiguityNotes?: string[]; };
  movement: { goal: number; soul: number; directionDegrees: number;
    usableMovement: number; potentialMovement: number; dragPercent: number;
    aim: number; grip: number; gripWithStakes: number; gripDelta: number;
    amplifier?: number; riskForm: string; };
  weather: { load: "low" | "moderate" | "high"; stateCaveat?: boolean; };
  gripPattern?: { primary?: string; secondary?: string[]; stakesTriggers?: string[]; };
  reportSignals?: { workShape?: string; loveShape?: string; topValues?: string[];
                    currentMode?: string; keyPhrases?: string[]; };
};

export type FollowUpOption = { label: string; text: string; tags: string[]; interpretation: string; };
export type FollowUpQuestion = {
  id: string;
  purpose: "grip_object" | "release_condition" | "aim_replacement"
         | "compression_check" | "trait_vs_weather" | "type_clarity";
  question: string;
  responseMode: "choose_one" | "rank_top_2" | "rank_top_3";
  options: FollowUpOption[];
};
export type FollowUpQuestionSet = {
  personName: string; selectedFamilies: string[]; reasonForQuestions: string;
  questions: FollowUpQuestion[];
};
```

### B. Adapter — `buildFollowUpInput(constitution): FollowUpInput`

Map the REAL engine fields (these are verified against `buildInnerConstitution`
output — do not invent paths):

| FollowUpInput | Engine path |
| --- | --- |
| `lens.typeLabel / dom / aux / confidence` | `lens_stack.mbtiCode / .dominant / .auxiliary / .confidence` |
| `movement.goal / soul` | `goalSoulMovement.dashboard.goalScore / .soulScore` |
| `movement.directionDegrees` | `goalSoulMovement.dashboard.direction.angle` |
| `movement.usableMovement / potentialMovement / dragPercent` | `goalSoulMovement.dashboard.movementLimiter.{usableMovement, potentialMovement, dragPercent}` |
| `movement.aim` | `aimReading.score` |
| `movement.grip` (baseline) | `gripReading.components.defensiveGrip` |
| `movement.gripWithStakes` | `gripReading.score` |
| `movement.gripDelta` | `gripReading.score − gripReading.components.defensiveGrip` |
| `movement.amplifier` | `gripReading.components.amplifier` |
| `movement.riskForm` | `riskForm.legacyLetter` |
| `gripPattern.stakesTriggers` | `gripTaxonomy.contributingGrips` |
| `reportSignals.topValues` | compass top values (`sacred_values`, ranked) |
| `reportSignals.currentMode` | the `Q-A1` answer (reacting/building/maintaining) |

`weather.load`: derive from `Q-X1`/`Q-X2`. **Grep for the canonical load /
`stateLoad` computation before wiring** — confirm the field rather than guess.
`weather.stateCaveat` = true when load is high (the "state is not self" caveat).

`gripPattern.primary` is **derived** (the engine's `gripPattern.bucket` is only
worth/belonging/security — coarser). Derive via `bucket × gripTaxonomy.subRegister`
(+ Si-dominance):
- worth + subRegister `mastery` → `"control_mastery"`
- worth (else) → `"worth_achievement"`
- belonging + subRegister `relational` → `"belonging_usefulness"`
- belonging + subRegister `stewardship` → `"responsibility"`
- security → `"security"`
- `lens_stack.dominant === "si"` (overrides toward) → `"continuity"`

### C. `generateFollowUpQuestions(input: FollowUpInput): FollowUpQuestionSet`

Slot model — exactly 3 questions:
- **Slot 1 = `grip_object`** (always). Stem templated by `gripPattern.primary`;
  options assembled from `topValues` + `stakesTriggers` + family seed-bank.
- **Slot 3 = `aim_replacement`** (always). Options from the family seed-bank
  keyed by `gripPattern.primary` (× dom function for flavor).
- **Slot 2 = adaptive.** Default `release_condition`; SWAP per the flags below
  (the swapped probe still serves a core purpose where possible).

Selection rules (Clarence's decision tree):
1. `lens.confidence==="low"` AND `weather.load==="high"` AND `gripDelta>=10`
   → Slot 2 = **`compression_check`** ("when stakes rise, what changes first?").
2. `grip>=65` AND `gripDelta<=5` → favor **`trait_vs_weather`** ("when did this
   become normal?").
3. `grip<65` AND `gripDelta>=10` → stakes-reactive `release_condition`.
4. `weather.load==="high"` AND `gripDelta<7` AND `lens.confidence==="low"`
   → burden/restoration `release_condition` ("what would actually restore you?").
5. Family content keyed by `gripPattern.primary`:
   `control_mastery`, `belonging_usefulness`, `worth_achievement`, `continuity`,
   `security`, `responsibility`.

### D. Seed-banks

Implement family seed-banks as data (one block per `gripPattern.primary` value),
each with `gripObject`, `releaseCondition`, `aimReplacement` option pools.
**Seed from the 14 hand-authored cohort sets** (Clarence's) — Control/Mastery,
Belonging/Usefulness, Worth/Achievement, and Continuity are fully specified
there; derive Security and Responsibility pools from the same vocabulary. Pool
size ~8–10 per family, filtered to the 5–6 best-matching the person's signals.

### E. Hard invariant

Every set MUST include one `grip_object`, one `release_condition`, AND one
`aim_replacement` purpose, and be exactly 3 questions. (A `compression_check` /
`trait_vs_weather` swap occupies the Slot-2 release position but the set must
still satisfy the three core purposes — implement so the swap augments, not
removes, coverage; if a probe replaces release_condition, fold the release
intent into its options.) Populate `selectedFamilies` and a human-readable
`reasonForQuestions`.

### F. Validation test — `tests/followUpQuestions.test.ts` (or repo's test convention)

Build `FollowUpInput` fixtures for each pattern and assert per Clarence:
- exactly 3 questions; each has ≥5 options; set includes grip_object +
  release_condition + aim_replacement; `selectedFamilies` populated;
  `reasonForQuestions` non-empty; deterministic (same input twice → identical).
Fixtures: trait grip (high grip, low delta); stakes-reactive (mod grip, high
delta); state-compression (high load, high delta, low conf); burden-no-grip
(high load, low delta, low conf); belonging/usefulness; worth/achievement;
control/mastery; continuity/Si.

## Allowed to Modify (exhaustive)

- NEW `lib/followUpQuestions.ts`
- NEW test file (repo convention)
- Nothing else. Do not touch the engine, scoring, `data/questions.ts`, or the
  renderer.

## Out of Scope

- LLM/generative output (deterministic only).
- Email, scheduling, the answer-collection UI surface.
- Feeding follow-up answers back into re-derivation / report revision (later CC).
- Any change to existing engine/report behavior.

## Bash Commands Authorized

- `npx tsc --noEmit`
- The repo's test runner for the new test file.

## Acceptance Criteria

1. `lib/followUpQuestions.ts` exports `FollowUpInput`, `FollowUpQuestionSet`,
   `buildFollowUpInput(constitution)`, and `generateFollowUpQuestions(input)`.
2. Adapter uses the real field paths above; `weather.load` field confirmed by
   grep (note which field in Report Back).
3. `npx tsc --noEmit` clean.
4. All 8 validation fixtures pass; output deterministic.
5. The 3-purpose invariant holds for every fixture.

## Report Back

- New files + exported signatures.
- Which engine field `weather.load` was wired to (grep result).
- `tsc` + test results (fixtures passing).
- Run `generateFollowUpQuestions` on the real `michele`, `connor`, and `harry`
  fixtures and paste the 3 questions each — so we can eyeball assembled-vs-
  hand-authored against Clarence's sets.
