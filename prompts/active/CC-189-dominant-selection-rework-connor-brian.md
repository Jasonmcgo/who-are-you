# CC-189 — Dominant-Selection Rework (Connor / Brian)

> **Depends on / follows CC-188.** CC-188 does the shape-hydration + Fi-Se hygiene and *documents*
> this bug as known debt (`dominant-selection-debt-connor-brian`) without fixing it. CC-189 fixes it.
>
> **This is investigation-first, then a gated fix — NOT a blind implementation.** The mechanism is
> unknown; a naive rule flips a correct type. Do Phase 1 before writing any fix.

## The problem (owner-confirmed + engine-verified 2026-07-03)

Two real people are mis-typed because `aggregateLensStack` crowns the wrong function as dominant,
*even though the engine's own signals already point at the right one*:

- **Connor** — owner-confirmed strong-Ne (ENTP-ward). Q-T-direct driver AND cross-signal BOTH infer
  `ne`, yet the published stack is `ti`-dominant → **INTP** (confidence low: aux-ambiguous, ns-valence).
- **Brian** — owner-confirmed **ENTJ** (Te-lead). Both signals infer `te`, yet published `ni`-dominant
  → **INTJ** (confidence low: thin-floor, dominant-convergence-weak, aux-ambiguous, ns-valence). This
  is also an E/I inversion (extravert published as introvert).

**Why the obvious fix is wrong:** the naive rule "honor the agreed driver" flips **Jason**, who is
also `dom=ni, xsig=te, agreement=agree` — but Jason is a *correct* Ni-Te where Te is a genuine strong
auxiliary. The whole difficulty is telling **"agreed driver = suppressed true lead"** (Connor/Brian)
apart from **"agreed driver = strong real auxiliary"** (Jason). That discriminator is the deliverable.

Also verified: **every cohort fixture returns `crossSignalAgreement="agree"`** — so the existing
`classifyAgreement` 60/20/40 `disagree-prefer-cross-signal` path fires for nobody and is NOT the hook.
Do not build on it.

## Embedded context (executors don't see Cowork memory)

Relevant code (verify line numbers; they drift):
- `lib/jungianStack.ts` — `aggregateLensStack` (~L731) legacy path; `aggregateLensStackBinary` (~L407);
  `poolTopPickRanking` (~L207); the E/I inference from an `extraversion_proxy` signal (~L546-585);
  the perceiving-vs-judging dominance decision; `applyPerceivingAxisCorrection` (~L1084) which only
  rescues *perceiving-dominant* stacks (`otherPerceivingAxisPair` returns null for judging dominants —
  this is why Connor's Ne under a Ti dominant is unreachable today).
- `lib/crossSignalDriverInference.ts` — `inferDriverFromCrossSignals` (~L1226); `classifyAgreement`
  (~L1369) thresholds `DISAGREE_INFERRED_SCORE_FLOOR=60`, `DISAGREE_GAP_FLOOR=20`,
  `DISAGREE_QT_DRIVER_CEILING=40`.
- Fixtures: `tests/fixtures/cohort-real/*.json`. Canon anchors that must NOT move: Jason (Ni-Te),
  Daniel (Si-Te), Cindy (Se-Fi), Ashley (Ni-Fe), Harry (Si↔Ne mirror). Fix targets: Connor (→Ne-Ti),
  Brian (→Te-Ni). (Nat/JDrew Fi-Se are handled in CC-188, not here.)
- Canon: `docs/canon/type-is-not-the-person.md` — typing is hygiene; the trajectory is the product.

## Phase 1 — Investigate (REQUIRED before any fix)

Instrument the dominant-selection path and dump, for **Connor, Brian, and Jason** side by side:
1. The perceiving-pool and judging-pool leaders and their `poolTopPickRanking` margins (top-pick
   counts + average rank).
2. Every `confidenceLowReason` and how it was set (esp. `dominant-convergence-weak`, `ns-valence`,
   `aux-ambiguous`).
3. The E/I inference (`inferredExtravert` and the `extraversion_proxy` signal that drove it) — Brian
   should read extravert but is published introvert; find where that inverts.
4. The exact branch that chose the perceiving function over the judging function (or vice versa) for
   the dominant slot.
5. The cross-signal `scores` map (all 8) and `inferredDriverScore` / `scoreGap`.

**Deliverable of Phase 1:** a written diff of what distinguishes Connor/Brian (agreed driver is the
*suppressed lead*) from Jason (agreed driver is a *strong aux*). Candidate discriminators to test:
the dominant-pool margin being weak (`dominant-convergence-weak` present for Connor/Brian) vs. Jason's
being firmer; the E/I signal contradicting the published attitude; the agreed driver out-scoring the
published dominant in the pool it actually competes in. Report which discriminator cleanly separates
the three, with the numbers.

## Phase 2 — Gated fix (only if Phase 1 finds a safe discriminator)

Implement the minimal dominant-selection correction keyed on the Phase-1 discriminator:
- Connor `ti-ne`/INTP → `ne-ti`/ENTP; Brian `ni-te`/INTJ → `te-ni`/ENTJ; re-derive tertiary/inferior
  from `STACK_TABLE`, recompute `mbtiCode`, record a distinct confidence reason (e.g.
  `dominant-corrected-suppressed-lead`).
- **Hard guard:** Jason stays Ni-Te/INTJ; Daniel/Cindy/Ashley/Harry unchanged; Nat/JDrew (CC-188)
  unchanged. Generic over functions — no per-name special-casing.
- If Phase 1 does NOT yield a discriminator that separates Connor/Brian from Jason with margin, **do
  not ship a fix** — report the finding and leave the debt documented. A wrong fix that flips Jason is
  worse than the current known bug.

## Audits
- `dominant-corrected-connor` — Connor → `ne`-dominant (ENTP), reason set.
- `dominant-corrected-brian` — Brian → `te`-dominant (ENTJ), reason set.
- `dominant-correction-noop-jason` — Jason stays `ni`-dominant INTJ (the correct-aux case is NOT
  corrected). This is the load-bearing safety assertion.
- `dominant-correction-noop-cohort` — Daniel/Cindy/Ashley/Harry/Nat/JDrew unchanged.
- Update `functionVoiceBinary` / `jungianCompletion` / `crossSignalDriverInference` expectations for
  Connor→ENTP and Brian→ENTJ deliberately; everything else stays green.

## Do NOT
1. Do NOT build on `classifyAgreement`'s `disagree-prefer-cross-signal` path — it never fires (all
   `agree`).
2. Do NOT ship a fix that moves Jason, or any anchor other than Connor/Brian.
3. Do NOT hardcode Connor/Brian by name — the discriminator must be principled.
4. Do NOT skip Phase 1. No fix without the written discriminator + numbers.
5. Do NOT commit or push (sandbox: prepend `rm -f .git/index.lock` to any git handed to Jason).

## Report back
1. Phase-1 dump for Connor/Brian/Jason and the discriminator that separates them (with numbers).
2. The fix (or the decision not to ship, if no safe discriminator).
3. Before/after cohort dominant table — proof only Connor and Brian moved.
4. tsc / lint / build + audit status; unrelated reds flagged not fixed.

**Architectural test:** Connor reads ENTP, Brian reads ENTJ, **Jason still reads INTJ** — and the
discriminator that achieves all three is stated in plain terms, not a fixture hardcode. If Jason moves,
the fix is wrong and must not ship.
