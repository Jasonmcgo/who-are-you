# CC-COUPLE-2 — Obvious-or-Oblivious item bank + reveal-type resolver (deterministic, $0)

> Couple module, brick 2 (spec: `docs/couple-module-mvp-spec.md`).
> Numbering: named sub-track; reconcile to the flat CC sequence at commit if preferred.

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass. Do not
stop for confirmation between steps. On ambiguity, apply the codebase-faithful,
spec-faithful interpretation, proceed, and flag it. Permission bypass is on; the
discipline below is scope.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.
**Runs AFTER CC-COUPLE-1** — it imports the couple types from
`lib/coupleTypes.ts`. If those types aren't present, stop and report (do not
re-create CC-COUPLE-1's work). **Independent of CC-138.** Deterministic; no LLM,
no DB, no UI.

## Execution Directive

- One pass, no mid-task confirmation prompts.
- This CC delivers exactly two things: (1) the Mode-1 **item bank** (the questions
  + options + signal tags + per-item engine predictors), and (2) the pure
  **reveal-type resolver**. Plus a small audit proving the resolver.
- **NO UI, NO route, NO DB read/write, NO persistence, NO couple report.** Those
  are CC-COUPLE-3/4. Do not anticipate them.
- **Do NOT modify the individual engine.** Predictors *read* individual output
  (`InnerConstitution`) only. No new questions in `data/questions.ts`. No change
  to `loveMap.ts` / `gripPattern.ts` / `identityEngine.ts`.
- Deterministic only. No `Math.random`, no LLM call, no network.

## Context

The MVP game (spec §1) is **Obvious or Oblivious? Mode 1**: each partner answers
for themselves, then guesses the other's answer. The reveal is one of five types
already authored in the notes. This CC encodes the items and the function that
maps an answered item to its reveal type.

The reveal resolver (spec §3) is a pure function of four inputs per item:

- `selfAnswer` — the subject's own answer (the optionId they picked).
- `partnerGuess` — the guesser's prediction of `selfAnswer`.
- `enginePredicted` — the option the **engine** expects for this subject, or
  `null` when the engine has no confident prediction for this item.
- `selfKnows` — optional: does the subject think this is obvious about themselves?

The five reveal types and the precedence to resolve them (spec §3 table). Encode
this exact order; expose the order as a documented constant so it's tunable:

1. **Obvious** — `partnerGuess === selfAnswer`. (Match. Partner reads them clearly.)
2. **Mirror Blind** — mismatch AND `enginePredicted != null` AND
   `partnerGuess === enginePredicted` AND `selfAnswer !== enginePredicted` AND
   `selfKnows === false`. (Partner + engine agree on a driver the subject doesn't see.)
3. **Hidden Pattern** — mismatch AND `enginePredicted != null` AND
   `selfAnswer !== enginePredicted` AND `partnerGuess !== enginePredicted`.
   (Neither person named the engine's likely driver.)
4. **Loving Misread** — mismatch AND option valence data exists AND
   `valence(partnerGuess)` is more generous than `valence(selfAnswer)`.
   (Partner guessed something kind but wrong.)
5. **Oblivious** — any remaining mismatch. (Partner simply missed; subject is clear.)

Note the precedence choice: Mirror Blind and Hidden Pattern (engine-informed)
outrank Loving Misread (valence-informed), which outranks plain Oblivious. Flag
this in the report as the tunable decision it is.

## Tasks

### 1. Types — extend `lib/coupleTypes.ts`

Add (do not duplicate CC-COUPLE-1's `CoupleGameItem`):

```ts
export type RevealType =
  | "obvious" | "oblivious" | "mirror_blind" | "hidden_pattern" | "loving_misread";

export type OptionValence = "generous" | "neutral" | "critical";

export interface CoupleGameOption {
  id: string;            // stable option id, e.g. "under_pressure_controlling"
  label: string;         // user-facing text
  valence?: OptionValence; // present only where a generous/critical read exists
  signalTag?: string;    // which engine signal this option expresses, if any
}

export interface CoupleGameItemSpec {
  itemId: string;
  prompt: string;        // second-person; rendered both self ("you") + guess ("your partner")
  options: CoupleGameOption[];
  sourceSignal: string;  // the engine signal/claim this whole item maps to (load-bearing for calibration)
  // Returns the option id the engine expects for this subject, or null when the
  // engine has no confident prediction. Pure read of individual output.
  predict: (ic: InnerConstitution) => string | null;
}
```

### 2. Item bank — new file `lib/coupleGameItems.ts`

Encode **8–10** Mode-1 items. The six below are the canonical seed (verbatim from
the notes' Game Modes / Question Categories); round out to 8–10 with the same
structure drawn from the same notes — **do not invent new psychometric claims or
new measured constructs.** Every item carries a `sourceSignal`; tag option
`valence` where a generous/critical reading genuinely exists (esp. items 3 & 5).

1. **under_pressure_become** — "When you are under pressure, you usually become:"
   more logical / more quiet / more helpful / more controlling / more agreeable /
   more avoidant / more intense / more productive. sourceSignal: `stress_posture`.
2. **need_but_dont_say** — "When you are struggling, what you most want but may
   not ask for is:" reassurance / space / practical help / a plan / warmth /
   permission to stop / truth told gently / to not have to explain.
   sourceSignal: `hidden_need`.
3. **grip_costs_you** — "When your fear takes over, you probably cost your partner:"
   peace / freedom / clarity / emotional safety / momentum / playfulness /
   directness / rest. sourceSignal: `grip_pattern`. (valence: critical-leaning.)
4. **aim_gives_you** — "When you are at your best, you give your partner:"
   stability / possibility / warmth / truth / courage / direction / freedom /
   protection. sourceSignal: `aim`. (valence: generous across the board.)
5. **the_thing_i_call_helping** — "When you say you are helping, you may actually
   be:" calming yourself / preventing failure / staying needed / avoiding conflict
   / proving worth / creating safety / controlling the outcome / actually helping.
   sourceSignal: `grip_pattern`. (valence: mixed — "actually helping" generous.)
6. **under_pressure_most_need** — "When you are under pressure, you most need:"
   space / reassurance / a plan / someone to listen / help solving it /
   permission to stop carrying it. sourceSignal: `hidden_need`.

**Predictors (`predict`)**: implement a real engine prediction for the items
where the mapping is clear and defensible — at minimum `grip_costs_you` and
`the_thing_i_call_helping` from the Grip Pattern bucket (`classifyGripPattern` /
`GripPatternKey` in `lib/gripPattern.ts`), and `under_pressure_become` from the
grip/stress posture. For items where there is **no** confident mapping yet,
`predict` returns `null` (which correctly routes mismatches toward Oblivious /
Loving Misread, never to a fabricated Mirror Blind / Hidden Pattern). Document
each predictor's signal source in a comment. Honest nulls beat invented mappings.

### 3. Reveal resolver — new file `lib/coupleReveal.ts`

`resolveReveal(input: { selfAnswer, partnerGuess, enginePredicted, selfKnows?,
options? }): RevealType` — pure function implementing the §Context precedence
exactly. `options` (the item's `CoupleGameOption[]`) is needed only to read
`valence` for the Loving Misread branch; if valence data is absent, that branch
is skipped. Expose the precedence as a documented ordered list/const. No I/O.

### 4. Audit — new file `tests/audit/coupleReveal.audit.ts`

Construct crafted input tuples that each land on a distinct reveal type, and
assert all **five** types are reachable and that the precedence holds at the
boundaries (e.g. an input that satisfies both Mirror Blind and Loving Misread
resolves to Mirror Blind). Also assert: when `enginePredicted === null`, the
result is only ever Obvious / Loving Misread / Oblivious (never Mirror Blind /
Hidden Pattern). Print a small table of input → reveal.

## Read First (Required)

- `lib/coupleTypes.ts` (CC-COUPLE-1's types — extend, don't duplicate).
- `docs/couple-module-mvp-spec.md` (§1 wedge, §3 data model + reveal table, §5 safety floor).
- `uploads/50_degree_life_relationship_marriage_product_notes.md` — the
  "Reveal Types", "Game Modes", and "Question Categories" sections (the verbatim
  copy + the five reveal-language blocks; this CC encodes structure, the prose
  language lands in CC-COUPLE-3's UI).
- `lib/gripPattern.ts` (`GripPatternKey`, `classifyGripPattern`, buckets) — predictor source.
- `lib/types.ts` around L1159 (`InnerConstitution` shape; find `loveMap`, grip,
  aim/risk-form fields the predictors read).

## Allowed to Modify (exhaustive)

- `lib/coupleTypes.ts` (ADD the types in Task 1 only).
- NEW `lib/coupleGameItems.ts`, NEW `lib/coupleReveal.ts`.
- NEW `tests/audit/coupleReveal.audit.ts`.

Nothing else. No UI, no route, no DB, no `data/questions.ts`, no individual-engine file.

## Out of Scope (do NOT build)

- Game UI / `/couple/[token]` route / invite flow (CC-COUPLE-3).
- Persisting answers or reading/writing `couple_sessions` (the flow that calls
  these is CC-COUPLE-3; this CC only provides the pure pieces).
- Couple report / Aim Exchange / Grip Loop (CC-COUPLE-4).
- The other four game modes (Grip or Gift?, What Am I Protecting?, The Aim Swap,
  Who Said It?) — Phase 2.
- Any new measured construct or new survey question.

## Bash Commands Authorized

- `npx tsc --noEmit`, `npm run lint`
- run the new `coupleReveal` audit
- `grep` / `rg`

## Acceptance Criteria

1. `npx tsc --noEmit` clean; `npm run lint` clean (pre-existing warnings ok).
2. Item bank has 8–10 items, each with a `sourceSignal`; the six seed items are
   present verbatim-faithful; valence tagged where a real generous/critical read exists.
3. At least the three named predictors return a real engine-derived option;
   others return `null` cleanly (no throw on any cohort `InnerConstitution`).
4. `resolveReveal` implements the precedence exactly; the audit shows all five
   reveal types reachable and the boundary/precedence + null-engine guarantees hold.
5. No UI, no route, no DB, no persistence; no `data/questions.ts` edit; no
   individual-engine file touched.

## Report Back

- The final item list (itemId + sourceSignal + which have real predictors vs null).
- The predictor signal sources (which engine field each reads).
- The reveal precedence as implemented + the boundary-case decisions (esp. Mirror
  Blind vs Hidden Pattern vs Loving Misread ordering) — flag as tunable.
- The audit table (input → reveal) proving all five types + the null-engine guarantee.
- Any item you rounded out beyond the six seed + its sourceSignal justification.
- Any ambiguity decision.
