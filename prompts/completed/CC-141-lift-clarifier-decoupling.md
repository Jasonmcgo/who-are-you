# CC-141 — Confidence-reason flags: stop the cross-signal lift from neutralizing the axis guards + suppressing clarifiers (+ hide function codes on the §D clarifiers)

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass.
Do not stop for confirmation between steps. On ambiguity, apply the
canon-faithful interpretation, proceed, and flag it. Permission bypass is
on; the discipline below is scope.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.
**Follow-up to CC-134 / CC-134.1.** Fixes the interaction between CC-097B's
cross-signal confidence lift and the CC-134.1 axis guards + §D clarifiers.
**This is now the regen gate** (supersedes CC-134.1 as the gate): regen should
bake against post-CC-141 confidence + clarifier behavior.

## Execution Directive

- One pass, no mid-task confirmation prompts.
- Confidence / clarifier-trigger / clarifier-label only. No dominant/aux
  selection change. No Movement math change. Re-snapshot cold, LAST.

## Context

Verified in code: CC-097B's lift (`lib/identityEngine.ts:2534–2543`, inside
`buildInnerConstitution`) does:

```
if (lens_stack.confidence === "low"
    && cs.inferredDriver === lens_stack.dominant   // agrees on the DOMINANT only
    && score >= floor && gap >= floor)
  lens_stack.confidence = "high";
```

It keys on **dominant agreement** and then **blanket-lifts the whole lens
confidence to `high`** — which has two bad effects, because the lifted value is
what downstream (incl. clarifier generation in `lib/followUpQuestions.ts`)
reads:

1. It **neutralizes the CC-134.1 axis guards** — the §C.6 N/S valence guard and
   the Ti+Fi / Te+Fe co-occurrence guard both set `low`, but the lift overrides
   them whenever cross-signals corroborate the *dominant* — even though the
   contamination is on a *different* axis (perceiving N/S or judging T/F).
2. It **suppresses the §D head-to-head clarifiers**, which fire on
   `confidence === "low"`.

Failure mode (Megan): a warm-Sensor with a clear dominant (Fi) but an ambiguous
perceiving axis (Ne vs Se) gets its dominant corroborated by OCEAN/values →
lifted to `high` → the N/S clarifier never fires → the FiNe-vs-FiSe mistype is
hardened instead of caught. Dominant agreement says nothing about the
contaminated axis.

(Separately, observed in the running build: the §D head-to-head renders the raw
function codes **"NE" / "SE"** (and would render TI/FI on the judging axis),
leaking the function the way the main Q-T items deliberately do NOT — they hide
behind "Voice A–D".)

## Tasks

### A. Track WHY confidence is low (reason flags)
In `lib/jungianStack.ts`, when `aggregateLensStack` sets `confidence = "low"`,
also record the **reason(s)** on the lens stack — e.g. a
`confidenceLowReasons: string[]` (or flags): `"thin-floor"`,
`"ns-valence"`, `"judging-cooccurrence"`, `"aux-ambiguous"`, `"dominant-mirror"`.
(Add the field to the `LensStack` type.) This is additive; it does not change
the confidence value itself.

### B. Scope the cross-signal lift (`lib/identityEngine.ts:2534+`)
The lift may override a `low` ONLY when the low came from a reason that
**dominant agreement actually resolves** — i.e. `aux-ambiguous` or
`dominant-mirror`. It must **NOT** override a `low` whose reasons include
`ns-valence`, `judging-cooccurrence`, or `thin-floor` — those mean the type
instrument is contaminated/thin on an axis the dominant inference can't speak
to. Gate the existing lift on the reason flags accordingly. (The mirror-axis /
disagree branches below it are unchanged.)

### C. Decouple clarifier triggers from displayed confidence
In `lib/followUpQuestions.ts`, the N/S and judging head-to-head clarifiers must
fire on the **pre-lift axis flags** (`confidenceLowReasons` includes
`ns-valence` / `judging-cooccurrence`), NOT on the final (possibly lifted)
`confidence === "low"`. So even when the lift raises *displayed* confidence to
`high` (because the dominant is corroborated), a contaminated axis still gets
its clarifier. "Ask the question" is decoupled from "show high."

### D. Hide function codes on the §D clarifiers
The head-to-head clarifier options must use **neutral labels** ("Voice A" /
"Voice B", matching the bank's `data/questions.ts` convention) — NOT the raw
`NE`/`SE`/`TI`/`FI` codes. Keep the function as the internal `signal`/id so the
resolver still maps the pick back correctly (it maps by id, not visible label).
Applies to both the perceiving (N/S) and judging (T/F) head-to-heads. The
equal-warmth framings stay.

### E. Re-validate
- Megan-shape (clear Fi dominant + Ne/Se perceiving split + cross-signal
  corroborating Fi): displayed confidence may be `high`, but the **N/S clarifier
  STILL fires** (reason `ns-valence`/`thin-floor` present). Prove it.
- A genuine `aux-ambiguous` low that cross-signals resolve: lift to `high`, no
  clarifier (correct — dominant agreement resolves that reason).
- The §D clarifier renders "Voice A/Voice B", no NE/SE/TI/FI; resolver still
  maps the pick to the right function.
- Jason-live (honest low, no lift): clarifier still fires (unchanged).

## Read First (Required)

- `lib/identityEngine.ts` ~2514–2566 (`attachCrossSignalDriverInference`, the
  lift) + line 2350 call site.
- `lib/jungianStack.ts` (`aggregateLensStack` confidence block + the CC-134.1
  guards/floors).
- `lib/followUpQuestions.ts` (`buildFollowUpInput` + the N/S and judging
  head-to-head builders; where labels are set).
- `lib/types.ts` (`LensStack`).
- `data/questions.ts` (the "Voice A–D" neutral-label convention to match).
- `lib/crossSignalDriverInference.ts` (`AGREEMENT_LIFT_*` floors).
- `tests/audit/twoTierBaseline.snapshot.json` + Lens/type audits.

## Allowed to Modify (exhaustive)

- `lib/jungianStack.ts` (reason flags).
- `lib/types.ts` (`LensStack.confidenceLowReasons`).
- `lib/identityEngine.ts` (scope the lift on reason flags — the lift block
  only; no other derivation/Movement change).
- `lib/followUpQuestions.ts` (clarifier trigger reads reasons; neutral labels).
- Re-snapshot `tests/audit/twoTierBaseline.snapshot.json` (cold, LAST) +
  Lens/type audit anchor refreshes (flag).

Nothing else. No dominant/aux selection change. No Movement math. No cache regen.

## Out of Scope

- The binary reformat (CC-138) — supersedes the co-occurrence guard for new
  sessions; this fixes the legacy ranking + lift interaction.
- Cohort cache regen (manual `regen-cache.sh` AFTER this lands — the new gate).
- The admin follow-up-answer display gap (CC-140).

## Bash Commands Authorized

- `npx tsc --noEmit`, `npm run lint`
- two-tier + Lens/type audits
- constructed-session validation (Megan-shape, aux-ambiguous, Jason-live);
  cold re-derive to show confidence + clarifier-fire before/after
- `grep` / `rg`

## Acceptance Criteria

1. `npx tsc --noEmit` clean; `npm run lint` clean (pre-existing warnings ok).
2. `confidenceLowReasons` is recorded whenever confidence is `low`.
3. The lift no longer overrides `ns-valence` / `judging-cooccurrence` /
   `thin-floor` lows; it still resolves `aux-ambiguous` / `dominant-mirror`.
4. The N/S + judging clarifiers fire on the axis flags **even when displayed
   confidence was lifted to `high`** — proven on a Megan-shape fixture.
5. §D clarifier options render neutral "Voice A/B" (no NE/SE/TI/FI); the
   resolver still maps the pick to the correct function.
6. Dominant/aux selection unchanged; Movement (incl. Aim) byte-identical.
7. Two-tier baseline re-snapshotted cold, LAST; deltas confined to
   confidence-reason/hedge-prose + clarifier behavior.
8. No file outside the Allowed-to-Modify list edited; no cache regenerated.

## Report Back

- The reason-flag set + where each is raised.
- The lift's new gating (which reasons it may vs. may not override).
- Proof the Megan-shape clarifier fires despite a lifted `high`.
- Proof the §D options render neutral labels + resolver still maps correctly.
- Confirmation dominant/aux + Movement unchanged.
- Two-tier diff scope.
- **Regen note:** this is now the gate — `regen-cache.sh` after merge; state
  which cohorts' end-to-end confidence changes vs CC-134.1 (the lift no longer
  rescues contaminated-axis lows).
- Any ambiguity decision.
