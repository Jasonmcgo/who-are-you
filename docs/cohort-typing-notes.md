# Cohort typing notes — suspected mistypes & control candidates

**Status:** Working notes for the typing-accuracy pass (CC-134 derivation fix +
CC-135 N/S item-valence rebalance). Until those land and the cohort is
re-derived, treat the flagged cohorts' **type/Lens** as provisional and do NOT
use them as ground-truth anchors for their flagged dimension.

## Suspected mistypes

### Megan — suspected **FiSe**, engine read **FiNe** ("the catalyst")
- **Warm-Sensor → NF mistype** (Clarence's predicted failure mode).
- Evidence: her four perceiving top-picks split **Se / Ne / Si / Ni** (one
  each) — non-convergent; FiNe was a coin-flip the warm-N voices tipped.
  Dominant **Fi** is solid (Q-T5/6/7 all land on "what feels true to me").
- Real-world anchor: **Nursing Manager** — a present, hands-on, operational
  care role (Se/Si), plus Conscientiousness 94 and "maintaining
  responsibilities." Points to a Sensor, not an intuitive possibility-explorer.
- **Action:** do NOT use Megan as an NF / intuitive anchor. She is a prime
  **warm-Sensor CONTROL candidate** for the CC-135 validation gate — once her
  N/S clarifier (CC-134 Part D) confirms Se, she anchors "warm Sensor recovers
  as S."

### Kevin — suspected mistype, engine read **"the artist" (SeFi)**
- Owner: "doesn't have an artistic bone… but wants one." The label captures an
  aspiration, not the lived shape. Re-derive after CC-134; treat type as
  provisional.

### Connor — suspected mistype, engine read **"the questioner" (TiNe)**
- Owner: "mistyped… but questioner isn't wrong." Partial — the register is in
  the right neighborhood; the exact stack is suspect. Re-derive after CC-134.

### Matti — label-fit note, engine read **"the strategist" (TeNi)**
- Owner reads him as "on the ground, field-marshal — defend the helpless, win
  the battle," not "win the war" long-arc strategist. Not necessarily a stack
  mistype; flag the label/register fit when labels are revisited.

## Why these are flagged now (root causes, addressed by CC-134/135)
1. **Untouched rankings saved as default order** (CC-134 Part A/B) — silent
   artifact in any ranking the respondent didn't deliberately order.
2. **Type from flat average rank** (CC-134 Part C) — weak-vs-weak noise inverts
   the dominant (the Ti-beats-Fi class).
3. **N/S item-valence bias** (CC-135) — N voices written warmer than S voices,
   so warm/feeling respondents over-pick N → warm-Sensor → NF mistype (Megan).

Re-confirm each flagged cohort after the cohort re-derive that follows CC-134
and CC-135.

## CC-188 — Typing Hydration (unique shape over MBTI stereotype)

Adds a first-class **function shape** to `lens_stack` (`functionMagnitudes`,
`axisMagnitude`, `withinAxisBroad`, `shapeLabel`, `shapeEvidence`) so the
user-facing output is the differentiated spine **plus** honest axis range and
within-axis breadth — MBTI demoted to the `mbtiCode` litmus. Anti-bleed: axis
strength is allocated per-function (never a bonus added to both same-axis
functions), so a clean Ni-Te never smears into a false NiTeTiNe / Ne-Ti mush.

- **Jason** reads `Ni-Te · clean stack · wide N/T axis range` (axisMagnitude
  N=75, T=99; `intuitionBroad=false`, `thinkingBroad=false`; Ni 65 ≫ Ne 40,
  Te 95 ≫ Ti 15). Still INTJ underneath. The high N/T axis range honours why
  Ne/Ti feel familiar to him without promoting them.
- **Ni-Te default killed** (Part B.1): the binary `dominant ?? "ni"` fallback
  and the legacy degenerate `ni/te/fi/se` return now emit an explicit
  `unresolved-shape` (mbtiCode `"UNRESOLVED"`) instead of a fake INTJ. Empty /
  typing-signal-free fixtures no longer default to the architect halo.
- **Nat** = **Fi-Se (ISFP)** already — corrected by CC-183; her real picks are
  Ne+Se / Ti+Fi, so she takes the clean opposite-attitude path and the binary
  same-attitude recovery no longer inverts her. No CC-188 change needed for her
  dominant. The **principled Fi-Se discriminator**
  (`applyFiSeSameAttitudeCorrection`, cross-signal-gated on Se-vs-Si + a
  corroborated Fi signature) is shipped to close the *latent* attractor for
  future binary Si+Fi / Ni+Fi respondents; it fires on no current cohort
  member (verified) — no hardcode.
- **JDrew** = published **Fe-Ni (ENFJ)**, low-confidence. Owner reads him as
  Fi-Se ISFP, but his real answers do **not** support it: Q-T judging splits
  Fi/Fe 2–2 (Fe slightly better avg), perceiving is a 4-way rank-1 tie, and
  cross-signal is Fe 85 / Si 70 / Se 40 / Fi 35. A principled discriminator
  cannot flip him without a name hardcode. **Owner decision (2026-07-03):**
  surface the honest read — the Part D satisficing guard raises
  `low-discrimination` on his flat data (he is the only cohort member that
  trips it) and widens the hedge, rather than confidently mislabelling him.
- **Connor** (published Ti-INTP, cross-signal infers Ne) and **Brian**
  (published Ni-INTJ, cross-signal infers Te) remain **documented
  dominant-selection debt** — the `dominant-selection-debt-connor-brian` audit
  guards their current output against silent regression. Fix deferred to
  **CC-189 — Dominant-Selection Rework**. Not retyped here.
- **Part D** blends the full rank distribution into pool ranking as a
  *tiebreak* (top-pick count stays primary, so no cohort dominant moves —
  Harry stays Si-Fe) plus the `low-discrimination` flat-response guard.
