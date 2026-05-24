# CC-143 — Love Map register calibration (fix the "everyone is the Devoted Partner" monoculture)

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass.
Do not stop for confirmation between steps. On ambiguity, apply the
canon-faithful interpretation, proceed, and flag it. Permission bypass is
on; the discipline below is scope.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.
**Independent of CC-138** (this edits `lib/loveMap.ts`; CC-138 edits the typing
derivation). Run this BEFORE CC-138. Run AFTER the current batch (CC-139–142)
is committed + regenerated, to avoid stacking derivation changes.

## Execution Directive

- One pass, no mid-task confirmation prompts.
- Calibration of register SELECTION + predicates only. No new registers, no new
  flavors, no new questions, no new signals (Q-L1 already exists). No Movement
  math change. The 7-register / 7-flavor taxonomy is canon — do not change it.
- Love Map prose is deterministic (`generateLoveProse` in-module) — **no LLM
  cache regen needed**; re-snapshot the two-tier baseline cold, LAST.

## Context

Every report shows **"the Devoted Partner."** It's not a one-entry table — there
are **seven** registers (`lib/loveMap.ts`: devoted_partner, parental_heart,
chosen_family, companion, belonging_heart, loyalist, open_heart) + 7 flavors.
The bug is that `devotedPartnerPredicate` scores on **near-universal** signals,
so it clears the top-1 threshold for almost everyone and the selection rule then
shows it **alone**:

- partner-trust #1 → 0.30 (almost everyone ranks "a spouse/partner" first in Q-X4)
- loyalty OR family in top-3 → 0.20 (near-universal)
- close-relationships top-2 in Q-Stakes1 → 0.15 (almost everyone)
- family-spending top-2 → 0.15
- lens ∈ `PAIR_BONDER_LENSES` → 0.10 (that list is **12 of 16** pairs)

Jason ≈ 0.75, Megan ≈ 0.80 — both from baseline-human signals. Then
`computeLoveMapOutput`: `if (top.score > LOVE_REGISTER_TOP1_THRESHOLD /*0.7*/)
matchedRegisters = [top]` → Devoted Partner becomes the **sole** match, and the
other six never surface. Two compounding causes: an **over-broad predicate** and
a **top-1 rule that suppresses the runner-up.**

Principle: registers must score on what's **distinctive**, not on what nearly
everyone shares.

## Tasks (in `lib/loveMap.ts`)

1. **Sharpen `devotedPartnerPredicate` to partner *primacy*, not presence.**
   Reward partner-trust **outranking** friend-trust AND family-trust (a real
   pair-bond-first signal), not merely partner-trust being #1 (which is
   near-universal). De-weight the components that almost everyone satisfies
   (close-relationships-stakes, family in top-3) so they don't alone carry it
   over the line.
2. **Make register scoring competitive / discriminating.** The output should
   reflect the **strongest relative register**, not whichever absolute floor
   everyone clears. Options (pick + document): normalize the seven scores
   against each other before thresholding; and/or re-tune
   `LOVE_REGISTER_TOP1_THRESHOLD` upward / require a **margin** over the
   runner-up before collapsing to a single register — so a clear second register
   surfaces more often (the top-2 path should not be rare).
3. **Feed Q-L1 into REGISTER selection (currently flavors-only).** The Q-L1
   `love_*` signals ("the people closest to you know you love them because
   you…") are the most *discriminating* love data and currently lift only
   flavors. Route them into the register predicates too, e.g.:
   - `love_presence` → devoted_partner / companion
   - `love_protection` → parental_heart / devoted_partner
   - `love_co_construction` → parental_heart / (Championing flavor already)
   - `love_problem_solving` → building-leaning registers
   - `love_shared_experience` → open_heart / chosen_family
   - `love_verbal_expression` → witnessing-leaning / loyalist
   - `love_quiet_sacrifice` → tenderness-leaning / devoted_partner
   Use the existing `loveDirectLift` helper pattern (top-1 / top-2 weighting).
   Keep the mapping documented; tune weights against the cohort gate below.
4. **Re-tune thresholds** (`LOVE_REGISTER_TOP1_THRESHOLD`,
   `LOVE_REGISTER_TOP2_FLOOR`, `LOVE_REGISTER_FLOOR`) as needed so the
   distribution spreads. Keep them named constants with comments.

## Acceptance gate — cohort distribution (the real test)

Run all 14 cohort fixtures through `computeLoveMapOutput` and report the register
each lands on. **Pass = a genuine spread, not a monoculture:** at least 4 of the
7 registers represented across the 14, and the named cohorts land sensibly
(sanity, not hard-pinned): e.g. a possibility-caregiver (Michele) → open_heart /
parental_heart, not devoted_partner; a steward (Daniel) → belonging_heart /
loyalist; a present-tense caregiver (Cindy) → parental_heart / tenderness-leaning.
If everything still collapses to devoted_partner, the calibration isn't done.
Add a diagnostic audit (`tests/audit/loveMapRegisterDistribution.audit.ts`) that
prints the per-cohort register + the spread count.

## Read First (Required)

- `lib/loveMap.ts` (the 7 register predicates, `computeLoveMapOutput`
  thresholds, `loveDirectLift`, the Q-L1 `love_*` signal handling in flavors).
- `docs/canon/love-map.md` (the register taxonomy + the "derivation only" rule).
- `data/questions.ts` Q-L1 (the `love_*` option → signal mapping) + Q-X4 /
  Q-Stakes1 / Q-S3 (the trust/stakes/spending signals the predicates read).
- `lib/renderMirror.ts` + the 50° composer (where the Love Map renders) — to
  confirm the render reflects the new selection.
- `tests/audit/twoTierBaseline.snapshot.json`.

## Allowed to Modify (exhaustive)

- `lib/loveMap.ts` (predicates + selection + thresholds + Q-L1 routing).
- A new `tests/audit/loveMapRegisterDistribution.audit.ts`.
- Re-snapshot `tests/audit/twoTierBaseline.snapshot.json` (cold, LAST) + any
  audit anchor that legitimately moves on the new Love Map prose (flag each).

Nothing else. No new registers/flavors/questions/signals. No Movement math.
No LLM cache regen (Love Map prose is deterministic).

## Out of Scope

- New love registers or flavors / Layer-5 bond-types (Pleasure/Eros etc.).
- CC-138's typing reformat (independent; runs after this).
- The Resource Balance diagnostic (leave its thresholds as-is).

## Bash Commands Authorized

- `npx tsc --noEmit`, `npm run lint`
- the two-tier audit + the new love-map distribution audit
- cold re-derive of the 14 cohorts to print the register distribution
  before/after
- `grep` / `rg`

## Acceptance Criteria

1. `npx tsc --noEmit` clean; `npm run lint` clean (pre-existing warnings ok).
2. The 14-cohort register distribution is a **spread** (≥4 of 7 registers
   represented); not all devoted_partner. Show before (likely ~14/14
   devoted_partner) vs after.
3. Named cohorts land sensibly per the gate (flag any that don't and why).
4. The top-2 path surfaces a second register for genuinely-mixed shapes (no
   longer suppressed by the over-broad top-1).
5. Movement numerics byte-identical (Love Map doesn't feed Movement — verify).
6. Two-tier baseline re-snapshotted cold, LAST; diff confined to Love Map prose.
7. No file outside the Allowed-to-Modify list edited; no cache regenerated.

## Report Back

- The devoted_partner sharpening (primacy vs presence) + which components were
  de-weighted.
- The competitive-scoring / threshold change.
- The Q-L1 → register mapping + weights.
- **Before/after per-cohort register distribution** (the headline).
- Any cohort that lands oddly (flag).
- Confirmation Movement unchanged + the two-tier diff scope.
- Note: CC-138 will shift lenses slightly → a quick Love Map re-check is worth
  doing after CC-138 lands.
- Any ambiguity decision.
