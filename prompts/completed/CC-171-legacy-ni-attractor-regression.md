# CC-171-LEGACY-NI-ATTRACTOR-REGRESSION

> Cowork-chat CC, 2026-05-24. A cohort calibration anchor (Harry) regressed:
> his Lens now reads Ni-led where the canonical read is Si-Fe (precedent-
> checker). DIAGNOSE which prior typing change flipped him, then CORRECT the
> over-attraction — without regressing the fix that change was made for.

## Established facts (don't re-litigate these)

- Harry's answers are UNCHANGED (his fixture diff is re-extraction metadata
  only — a timestamp; no answer edits). He is a pure-legacy session: Q-T1–Q-T8
  4-way rankings, NO binary picks.
- The typing engine was NOT changed by the 2026-05-24 batch (18eebe7..7e8932c):
  `jungianStack.ts`, `crossSignalDriverInference.ts`, `staleShape.ts` untouched;
  the only `identityEngine.ts` change was Lens *prose*. So this regression is
  NOT from today's push — do NOT revert it.
- The last typing changes were **CC-159** (`ab49143`, aux-ambiguous legacy-path
  head-to-head) and **CC-161** (`f7412d7`, binary-path clarifier), which
  deployed in the earlier `a0bb757` push. The flip lives in that window.

## The symptom

Harry's report Lens shows the `disagree-prefer-cross-signal` hedge:
"ranking → NI-led, broader signature → FE-led", with Ni chosen as dominant.
Canonical Harry = **Si-Fe** (Si-Fe-Ne-Te, precedent-checker), a **mirror-axis
Si↔Ne** shape (per `feedback_mirror_axis_canon`). Ni is on the *other*
perceiving axis (Se↔Ni) — so this is a cross-axis mis-type, not a within-axis
wobble.

**The bug is isolated to Harry — this is NOT a broad Ni over-attractor.**
Ashley correctly reads **Ni** (her Se↔Ni mirror resolving to Ni — owner-
confirmed canonical), so she is a CONTROL that must STAY Ni, not collateral.
Daniel (also Si) reads **Si** correctly. So it is not "all Si shapes" and not
"everything pulled to Ni." It is specifically Harry's **mirror-axis Si↔Ne**
resolution mis-routing to Ni — the OTHER perceiving axis — instead of settling
within Si↔Ne to Si. The defect lives in how the low-confidence / mirror-axis
introverted-perceiving dominant is chosen for an Si↔Ne shape, introduced by
CC-159/CC-161.

## The crux (owner calibration, load-bearing)

Harry is, in the owner's words, "the most intuitive Si I've ever met." That is
the whole difficulty: he is **Si-dominant with an unusually strong Ne** (Ne is
his mirror partner on the Si↔Ne axis). His intuition is real — but it is **Ne
(divergent, possibility-reading), not Ni (convergent foresight)**. The engine
is taking that strong intuitive signal and mis-filing it on the **Se↔Ni axis as
Ni**, then promoting it to dominant — when it should read the same signal as
**Ne on his own Si↔Ne axis** and leave **Si** leading.

So the defect is an **axis-assignment** error, not a magnitude one. The fix is
NOT "suppress Ni" or "down-weight intuition" (that would break Ashley, a true
Ni, and any real intuitive). The fix is to make the discriminator route a
strong introverted/ divergent-intuitive signal to the **correct mirror axis**:
an Si-anchored shape (concrete/precedent markers, what he protects/trusts, the
Si↔Ne mirror evidence) keeps its intuition as **Ne** and stays **Si-led**. A
discriminator keyed on raw "intuition present?" will always over-pull an
intuitive Si — that's the mechanism to replace.

## Step 1 — DIAGNOSE (measure before changing anything)

1. Re-derive the FULL `tests/fixtures/cohort-real/*` set at current HEAD; print
   each anchor's lens `dominant` + `crossSignalAgreement` + (if low-conf) the
   hedge variant. Flag every anchor whose dominant ≠ its canonical type (use the
   canonical types in the cohort memory / prior calibration notes; Harry=Si,
   Ashley=Se or Ni-mirror, Nat=Fi/Ti INFJ-direction, Jason=Ni INTJ, etc.).
2. **Bisect the flip.** Re-derive Harry (and the full cohort) at three points:
   - the commit BEFORE CC-159 (i.e., CC-158 / `ab49143~1`),
   - after CC-159 (`ab49143`),
   - after CC-161 (`f7412d7`).
   Record Harry's dominant at each. Identify exactly which commit flips Harry
   Si→Ni, and how many OTHER cohort anchors regressed at the same step. This
   tells us whether the fix belongs in the legacy aux-ambiguous path (CC-159) or
   the binary/cross-signal path (CC-161).

Report the diagnosis table BEFORE proposing the code fix.

## Step 2 — CORRECT (after diagnosis, scoped to the flipping commit's change)

Fix the over-attraction so:
- **Harry reads Si-led** (Si↔Ne axis), not Ni.
- The cohort calibration anchors match canon at no worse a rate than BEFORE
  CC-159 (net regressions ≤ 0 vs the pre-CC-159 baseline).
- **Nat's CC-161 fix is preserved** — CC-161 existed to fix Nat's Ne/Si mis-read
  on the binary path; this correction must NOT reintroduce that. Nat is a
  required control.
- Mirror-axis canon honored: Harry surfaces on Si↔Ne, Ashley on Se↔Ni.

The exact lever depends on Step 1 (e.g., a cross-signal tie-break that now
favors Ni; an aux-ambiguous head-to-head that mis-resolves the introverted-
perceiving dominant; a legacy→convergence weighting). Make the minimal change
that restores Harry without collateral cohort regressions, and add Harry as a
locked regression fixture so this can't silently flip again.

## Controls / canon (must hold at close)

| Anchor | Canonical lens | Must read |
|---|---|---|
| Harry | Si-Fe (precedent-checker), Si↔Ne mirror | **Si-led** (the regression to fix) |
| Ashley | Se↔Ni mirror → **Ni** (owner-confirmed) | **stays Ni** — control, do not break |
| Daniel | Si (clean, not mirror) | **stays Si** — control |
| Nat | Fe/Ti INFJ-direction (CC-161 target) | unchanged from CC-161 |
| Jason | Ni (INTJ) | unchanged |

The fix must move ONLY Harry (Si↔Ne → Si) while Ashley stays Ni and Daniel
stays Si — i.e. it discriminates the Si↔Ne mirror resolution, NOT a global
Ni/Si re-weighting that would knock Ashley off Ni.

## Do NOT

- Revert the 2026-05-24 batch (it didn't cause this).
- Regress Nat's CC-161 binary-clarifier fix.
- Change unrelated engine math (Goal/Soul/Aim/Grip/Movement), prose, or render.
- "Fix" by hand-pinning Harry's stored constitution — the engine must re-derive
  him correctly from his answers.
- Skip the bisect — we need to know which commit + which mechanism flipped him
  before touching the code.

## Acceptance

- Diagnosis table (cohort lens dominants at HEAD + the 3 bisect points) reported.
- After the fix: Harry re-derives Si-led; the cohort-real anchors match canon at
  ≥ the pre-CC-159 rate; Nat unchanged; Ashley not collateral-damaged.
- New locked regression assertion (Harry = Si) added to the cohort/lens audit.
- `functionVoiceBinary` + `crossSignalDriverInference` + any lens-confidence
  audits green; full suite green at close.
- `tsc --noEmit` clean.

## Report back

- The diagnosis table + which commit (CC-159 or CC-161) flipped Harry, and the
  mechanism.
- The fix (minimal lever) + the cohort before/after dominants.
- Confirm Nat unchanged + the new Harry regression lock.
- Audit results.

## Context

This is a cohort-calibration regression on a real-person anchor, same family as
the Nat binary-confound work (CC-161 / queued CC-163). Pairs naturally with the
confidence-refinement framework (task #17). Higher priority than the parked
prose/Bundle-3 items because it's a live correctness regression on the typing —
the thing the whole instrument rests on.
