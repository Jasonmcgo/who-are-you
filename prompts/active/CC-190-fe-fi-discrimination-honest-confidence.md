# CC-190 — Fe/Fi Discrimination + Honest Confidence (feeling-attitude is the worst-identified axis)

> **Depends on CC-188** (shape hydration + confidence-to-surface shipped). This is the highest-value
> typing follow-on: the empirically worst-identified axis is **feeling-attitude (Fe vs Fi).**
>
> **Investigation-first, like CC-189. The goal is BETTER DISCRIMINATION + HONEST CONFIDENCE — NOT
> forcing feelers to Fi.** Do Phase 1 before any fix.

## The problem (engine-verified 2026-07-03 across the 16 real fixtures)

Feeling shapes dominate the low-confidence pile, and Fi in particular keeps getting lost:
- **Every Fe-in-stack shape is low-confidence:** Harry (si-fe), JDrew (fe-ni), Ashley (ni-fe).
- **3 of 4 Fi shapes are low-confidence:** Nat (fi-se), Cindy (se-fi), Kevin (se-fi); only Michele
  (ne-fi) is high.
- **Fi gets rendered as the wrong thing:** Nat's Fi was published as Si (fixed via CC-183/188's
  same-attitude path); JDrew's Fi (owner-claimed ISFP) is published as **Fe** (ENFJ).
- Overall 75% (12/16) of the cohort reads low-confidence and renders confidently (CC-188 now hedges
  this at the surface, but the underlying discrimination is still weak on the feeling axis).

## Canon this CC MUST respect (do not violate)
- **`docs/canon/type-is-not-the-person.md`** — typing is hygiene; do not over-fit.
- **This is NOT "make feelers Fi."** The fix improves the *discriminator's resolution*: raise
  confidence for feelers whose answers clearly support one attitude, and keep **honest low-confidence**
  where they genuinely don't. A feeler the instrument can't resolve should read tentative, not
  confidently mistyped in either direction.
- **JDrew is the cautionary anchor, not a fix target.** His owner label is ISFP (Fi) but his ANSWERS
  point to Fe (cross-signal Fe 85 / Fi 35, Q-T judging Fe-better-avg, perceiving 4-way tie). CC-190
  must NOT force JDrew to Fi. Acceptable outcomes for JDrew: (a) stays Fe with *earned* confidence if
  the discriminator finds real Fe support, or (b) stays honest low-confidence. Forcing Fi would be a
  hardcode against the data and a canon violation. (The gap between his ISFP self-label and his Fe
  answers is itself a finding — possibly the instrument under-measures his Fi, possibly he is more
  Fe than the label; the honest engine says "uncertain," and the *room-vote* (Room Read) is the
  real arbiter, not a forced label.)
- **Do not move confidently-correct feelers:** Michele (Ne-Fi, high) stays; Cindy (Se-Fi) and Nat
  (Fi-Se) stay their current dominant/aux.

## Phase 1 — Investigate (REQUIRED before any fix)
Instrument the feeling-axis scoring and dump, for **Harry, JDrew, Ashley, Nat, Cindy, Kevin, Michele**:
1. The Fe and Fi cross-signal component scores and which inputs (Compass values, OCEAN, trust,
   cost-surface, DiSC) fed each — where does Fi under-credit vs Fe over-credit?
2. Which Q-T judging items separate Fe from Fi, and how often those items are tied / thin for these
   people (JDrew's judging is 2–2 Fe/Fi — is that instrument coverage, or genuine ambiguity?).
3. Which confidence flags fire on feelers (`aux-ambiguous`, `dominant-mirror`, `ns-valence`?) and
   whether they trace to a *specific* Fe/Fi discriminator gap.
4. The single question: **is there Fe-vs-Fi discriminating signal in the answers the engine is not
   consuming** (per the "honor every answer" canon — orphan discriminators), or is the ambiguity real?

**Deliverable of Phase 1:** a written account of whether a principled Fe/Fi discriminator exists in
the current answer space (and where), or whether the honest answer is "the instrument under-measures
this axis and the fix is a new question" (→ hand off to a question-design follow-on, out of scope here).

## Phase 2 — Gated fix (only if Phase 1 finds real, unused discriminating signal)
- Add/strengthen the Fe/Fi discriminator using the Phase-1 signal; raise confidence where it now
  resolves cleanly; leave honest low-confidence where it doesn't.
- **Hard guards:** Michele/Cindy/Nat unchanged; JDrew NOT forced to Fi; no per-name logic; principled
  over the answer space. Any correctly-typed non-feeler must be untouched.
- If Phase 1 finds the ambiguity is real (no unused signal), **do not ship a discriminator** — report
  that the fix is question-design (new Fe/Fi discriminator items), and leave CC-188's honest
  low-confidence as the correct interim behavior.

## Audits
- `fe-fi-phase1-diagnostic` — records the Fe/Fi component scores + confidence flags for the 7 feeling
  fixtures (documents the axis health; no assertion of retype).
- `fe-fi-noop-on-correct` — Michele/Cindy/Nat dominant+aux unchanged; JDrew not forced to Fi.
- If a Phase-2 fix ships: `fe-fi-confidence-earned` — a feeler whose data clearly supports one
  attitude reads at earned (not defaulted) confidence; an ambiguous one stays honest low.

## Do NOT
1. Do NOT force any feeler to Fi (or Fe). The deliverable is discrimination + honest confidence.
2. Do NOT hardcode JDrew/Nat/anyone by name.
3. Do NOT move a confidently-correct feeler (Michele) or any non-feeler.
4. Do NOT skip Phase 1. No fix without the written finding on whether unused signal exists.
5. Do NOT add survey questions in this CC (if Phase 1 says the axis needs new items, that's a
   separate question-design follow-on).
6. Do NOT commit or push (sandbox: prepend `rm -f .git/index.lock` to any git handed to Jason).

## Report back
1. Phase-1 Fe/Fi diagnostic for the 7 feeling fixtures + the verdict: unused discriminating signal
   exists (where) vs. genuine ambiguity (→ question-design).
2. The fix (or the decision not to ship), with JDrew explicitly addressed (earned-Fe vs honest-low,
   never forced Fi).
3. Before/after cohort table — proof no confidently-correct member moved.
4. tsc / lint / build + audit status.

**Architectural test:** feeling shapes the instrument *can* resolve read at earned confidence; the
ones it can't read honestly tentative; Michele/Cindy/Nat unchanged; and JDrew is never forced to a
Fi label his own answers don't support. Better discrimination and honest uncertainty — not a
feeling-attitude that always resolves to one side.
