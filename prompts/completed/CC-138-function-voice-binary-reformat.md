# CC-138 — Function-voice binary reformat (replace 4-way Q-T rankings with attitude select-ones)

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass.
Do not stop for confirmation between steps. On ambiguity, apply the
canon-faithful interpretation, proceed, and flag it. Permission bypass is
on; the discipline below is scope.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.
**Run AFTER CC-134 + CC-135 are merged.** This is a question-format redesign
that **supersedes**, for new sessions, (a) CC-134's top-pick-convergence math
on the judging axis and the Ti+Fi co-occurrence guard, and (b) CC-135's N-vs-S
item-valence rebalance (N and S no longer compete directly). Those remain the
correct interim fixes for the legacy ranking format, which this CC keeps
working for already-collected sessions.

## Execution Directive

- One pass, no mid-task confirmation prompts.
- **Instrument + derivation change.** It changes the Q-T question *type*, the
  signal extraction, and the Lens derivation, and it re-derives type for new
  sessions. Movement (Goal/Soul/Aim/Grip) does not depend on type — keep it
  byte-identical for any fixture whose stored answers don't change.
- **Backward-compat is mandatory.** Existing sessions store *ranked* Q-T item
  IDs; new sessions store *binary picks*. Both must derive correctly (see
  Part D). Do not corrupt or force-migrate legacy ranking answers.

## Context

The 4-way Q-T ranking is the root of the typing noise:

1. **Weak-vs-weak ranking is noise.** Ranking all four voices forces
   comparisons among functions a person doesn't live in; the middle/bottom is
   inverted, not signal (owner: "ranking 4 generates more noise than it clears").
2. **Cross-dimension valence confound.** In one choice set, the warmer voice
   wins regardless of true preference — warm-Ti pulls Fi (judging), warm-N
   pulls S (perceiving). CC-134/135 mitigate this; they don't remove it.

**Owner's design (this CC):** stop ranking. Split each axis into two
**same-dimension** select-one-of-two binaries, on one page, low strain:

- Judging: **{Ti, Te}** pick one · **{Fi, Fe}** pick one
- Perceiving: **{Ni, Ne}** pick one · **{Si, Se}** pick one

Why it works structurally: every canonical stack holds exactly one T and one F
(opposite attitudes — `{Ti,Fe}` or `{Te,Fi}`) and exactly one N and one S
(opposite attitudes — `{Ni,Se}` or `{Ne,Si}`). So each binary asks an
*answerable, same-dimension* question ("is your thinking inward or outward?",
"is your intuition inward or outward?") and **Ti never competes with Fi, N
never competes with S** — the valence confound cannot fire. The
opposite-attitude rule then becomes a built-in consistency check.

## The design

### Four attitude binaries → four functions
Each pick yields the chosen function (the attitude within its dimension):
- {Ni|Ne} → your intuitive attitude
- {Si|Se} → your sensing attitude
- {Ti|Te} → your thinking attitude
- {Fi|Fe} → your feeling attitude

### Opposite-attitude constraint = consistency check
- Perceiving: N-pick and S-pick must be opposite attitude (`Ni+Se` or `Ne+Si`).
- Judging: T-pick and F-pick must be opposite attitude (`Ti+Fe` or `Te+Fi`).
- A violation (both introverted or both extraverted — e.g. `Ni+Si`, `Ti+Fi`) is
  **impossible in a real stack** → it's the contamination fingerprint. Mark Lens
  `low` and trigger the CC-134 §D head-to-head clarifier (this replaces the
  Ti+Fi co-occurrence heuristic — now it's a one-line check).

### Dominance / ordering — RESOLVED (owner design: order-the-selections)
The four picks determine the *set* of functions but not the *order*; the same
four describe two types (an I/E flip — `{Ni,Te,Fi,Se}` is both INTJ and ENTJ).
Resolve in two stages, both pairwise (no 4-way rank):

**Sequence is a UX choice (informationally equivalent — A/B, owner to pick):**
either *pick-then-order* (pick within each box, then order your two picks) or
*order-then-pick* (order the two boxes/dimensions first — "which matters more,
how you reason or what you value?" — then pick within each). The order-first
variant may read the dominance more cleanly: it frames T-vs-F / N-vs-S at a
neutral *dimension* level rather than a voice-vs-voice comparison, dodging more
of the residual valence. Try both; keep the one with better reliability + lower
strain.

1. **Within-axis dominance + reinforcement.** Per page, the user **orders their
   two selections** (or the two boxes, per the sequence above):
   - Judging page: order {your T-pick, your F-pick} → judging is T-led or F-led.
   - Perceiving page: order {your N-pick, your S-pick} → perceiving is N-led or S-led.
   This yields the **dominant/auxiliary pair** (one perceiving + one judging,
   guaranteed opposite attitude) and re-engages the user with their own picks
   (a data-quality reinforcement, like re-ranking already-selected items).
2. **Which of the pair leads = I/E.** The two page-winners are always one
   introverted + one extraverted function, so the dominant is the introverted
   one for introverts, the extraverted one for extraverts. Resolve via EITHER
   (a) inference from the existing extraversion / energy-direction signal (no
   new prompt — try first), or (b) one final **order-the-two** of the two
   page-winners (explicit fallback). Flag which path proves reliable.

Net: ~4 binary picks + 2–3 trivial pairwise orderings; the resolved stack must
be one of the 16 canonical `STACK_TABLE` entries.

**Valence note on the per-page ordering.** Ordering {your-N vs your-S} (or
{your-T vs your-F}) is technically cross-dimension — the comparison the binary
split avoided. It is acceptable here because it is between two *already-affirmed*
picks, with CC-135's balanced warmth, as a single focused pairwise choice (a
fraction of the 4-rank's confound), and the opposite-attitude constraint still
guards it. A **near-tie ordering** (the two selections feel equally lead) →
`low` confidence → §D head-to-head clarifier, same as a constraint violation.

## Tasks

### A. Reformat the Q-T items (`data/questions.ts`)
Replace the perceiving + judging Q-T blocks with the four attitude binaries
(select-one-of-two), grouped on one page, plus the dominance mechanism chosen
above. Reuse the CC-135 warm-balanced Se/Si prose and the existing N/T/F voices;
keep neutral framing within each pair (no attitude label leakage — the user
sees two voices, not "introverted/extraverted"). Preserve the `signal` ids.

### B. New question type + signal extraction
Add the select-one (binary) answer type and its extraction: each pick →
a single function signal (no ranks). Wire through save + the engine's signal
ingestion. (The legacy `ranking` Q-T path stays for old sessions — Part D.)

### C. Derivation (`lib/jungianStack.ts`)
A new resolver for binary-pick sessions: take the four chosen functions, apply
the opposite-attitude constraint checks (→ confidence + clarifier trigger),
resolve dom/aux via the dominance bit, map through `STACK_TABLE`/`MBTI_LOOKUP`
(unchanged). For binary sessions this **replaces** the top-pick-convergence
path. Confidence: `high` only when both constraints hold (consistent attitudes)
and the dominance signal is unambiguous; else `low` → clarifier.

### D. Backward-compat (legacy ranking sessions)
Detect answer shape per session. Legacy Q-T *ranking* answers continue to
derive through the CC-134 top-pick path (unchanged). New *binary* answers use
the Part C resolver. A session never mixes both for the same block. Do NOT
rewrite stored legacy answers.

### E. Untouched / skip handling
Binary select-one is lighter, but an un-answered binary must still route to the
second pass (CC-134 Part A) rather than defaulting. Confirm the touched/skip
routing covers the new type.

## Read First (Required)

- `data/questions.ts` (Q-T blocks; CC-135's rebalanced Se/Si prose).
- `lib/jungianStack.ts` (`aggregateLensStack` top-pick path from CC-134;
  `STACK_TABLE`, `SAME_DIMENSION_MIRROR`, the §C.6 guard).
- The Q-T signal extraction in `lib/identityEngine.ts`; `lib/saveSession.ts`.
- `app/components/Ranking.tsx` + `app/assessment/page.tsx` + `SecondPassPage.tsx`
  (touched/skip routing; the new binary input UI lives near here).
- `app/components/SinglePickPicker.tsx` (existing single-pick UI to reuse).
- `lib/followUpQuestions.ts` (CC-134 §D clarifier — the constraint-violation
  trigger plugs in here).
- `docs/canon/ns-item-valence.md`, `docs/canon/jungian-items-current.md`,
  `docs/canon/question-design-standard.md`, `docs/pattern-taxonomy-notes.md`.

## Allowed to Modify (exhaustive)

- `data/questions.ts` (Q-T reformat).
- `lib/types.ts` (new binary answer/question type), `lib/saveSession.ts`,
  `lib/identityEngine.ts` (signal extraction at the Q-T site only — NOT
  Movement math), `lib/jungianStack.ts` (binary resolver + compat dispatch),
  `lib/followUpQuestions.ts` (constraint-violation clarifier trigger).
- Assessment UI: a binary picker component (reuse `SinglePickPicker` if it
  fits) + `app/assessment/page.tsx` wiring + skip/touched routing.
- `docs/canon/jungian-items-current.md` (record the binary format).
- A new audit (`tests/audit/functionVoiceBinary.audit.ts`) + cold re-snapshot
  of `twoTierBaseline.snapshot.json` + Lens/type audit anchor refreshes (flag).

Nothing else. No Movement math change. No cache regen (manual follow-up).

## Out of Scope

- Engine-derived labels / patterns (still parked).
- Versioned answer "passes" (the deferred CC-137).
- Re-deriving / re-collecting existing cohorts under the new format (they stay
  on the legacy ranking path until a retake; that's the CC-136 link's job).

## Bash Commands Authorized

- `npx tsc --noEmit`, `npm run lint`
- the two-tier + new binary audit + Lens/type audits
- cold re-derive of fixtures (legacy ranking ones must be unchanged) +
  constructed binary-session tests
- `grep` / `rg` read-only verification

## Acceptance Criteria

1. `npx tsc --noEmit` clean; `npm run lint` clean (pre-existing warnings ok).
2. Q-T renders as four same-dimension select-one binaries (+ the dominance
   mechanism); no ranking; no attitude-label leakage; cognitive load reduced
   (fewer interactions — state the count).
3. A binary session resolves a canonical stack via the four picks + dominance;
   an attitude-constraint violation (e.g. Ni+Si or Ti+Fi) yields `low` + the
   §D head-to-head clarifier. Prove with constructed sessions, incl. a
   warm-Sensor (resolves S) and a Megan-style split (→ low → clarifier).
4. **Backward-compat:** legacy ranking sessions derive byte-identically to
   pre-CC-138 (the CC-134 path is untouched for them) — prove on the 14 cohorts;
   Movement byte-identical.
5. Confidence is `high` only on consistent attitudes + unambiguous dominance.
6. Two-tier baseline re-snapshotted cold, LAST; deltas confined to the new
   format path (legacy fixtures unchanged).
7. No file outside the Allowed-to-Modify list edited; no cache regenerated.

## Report Back

- The four-binary UI + the dominance mechanism chosen (and why); interaction count.
- The binary resolver + the opposite-attitude constraint check + how it triggers
  the clarifier; confirmation it replaces the Ti+Fi heuristic for binary sessions.
- Backward-compat proof: legacy cohorts derive unchanged; Movement byte-identical.
- Constructed-session results: warm-Sensor → S; Megan-split → low → clarifier.
- What CC-134/135 machinery is now superseded for new sessions (and what stays
  for legacy).
- The dominance-resolution decision flagged for owner sign-off.
- Any ambiguity decision; any site left out of scope.
