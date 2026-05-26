# CODEX-SENSING-SYNTHETIC-FIXTURE-DEAESTHETICIZE

> CODEX-scale, mechanical, test-fixture-only. Follow-up to CC-SENSING-TYPING. That
> CC added a +10 aesthetic component to scoreSi/scoreSe (fires when
> `qO1TopPickIsAesthetic || oceanOpennessAesthetic >= 60`). Two **synthetic**
> CC-097B fixtures incidentally rank aesthetic high, so the +10 nudged them past
> classifier thresholds and broke their Class-C/D assertions. This CODEX removes
> the INCIDENTAL aesthetic trigger from those two fixtures so they exercise their
> original detection paths again — WITHOUT weakening the aesthetic feature, moving
> any threshold, or touching real-cohort data.

## Scope — exactly two files (synthetic fixtures only)

- `tests/fixtures/cc-097b-synthetic/kevin-fe-si-class-c.json`
- `tests/fixtures/cc-097b-synthetic/ashley-mirror-axis-se-ni.json`

Nothing else. Do NOT touch `lib/*` (the aesthetic component stays exactly as
CC-SENSING-TYPING shipped), the disagree-classifier thresholds, the audit
assertions, real `cohort-real/*` fixtures, Nat's lock, or the other synthetic
fixtures (`harry-si-fe-ne-te.json`, `michele-ne-fi-class-b.json` — must stay green).

## What broke (verified)

The aesthetic component fires on `qO1TopPickIsAesthetic || oceanOpennessAesthetic
>= 60`. Per the CC-SENSING-TYPING report:
- **Kevin** (Class C, "Fe-driver-misread-as-Se"): his Q-O1 ranks **aesthetic #1** →
  `qO1TopPickIsAesthetic = true` → +10 se lifted cs.se 40→50, past
  `DISAGREE_QT_DRIVER_CEILING = 40`, so agreement fell from
  `disagree-prefer-cross-signal` back to `agree`. (cs.inferredDriver stayed `fe`,
  gap preserved — only the agreement flag broke.)
- **Ashley** (Class D, mirror-axis Se-Ni): her **aesthetic subdimension = 68** (≥60)
  → +10 se lifted cs.se 65→75 above cs.ni 70, flipping cs.inferredDriver ni→se, so
  mirror-axis detection (needs cs.inferredDriver == dominant's mirror = ni) didn't
  fire.

## The fix (minimal, per fixture)

Diagnose each fixture's actual trigger(s) first (which of `qO1TopPickIsAesthetic` /
`oceanOpennessAesthetic >= 60` is firing), then neutralize ONLY those, choosing
answer edits that do NOT alter the signals the Class-C/D discriminator depends on:

- **Kevin:** demote aesthetic out of the Q-O1 top rank (rank a non-aesthetic
  openness option — e.g. intellectual or experiential — first) so
  `qO1TopPickIsAesthetic = false`. Confirm `oceanOpennessAesthetic < 60` afterward
  (if it's still ≥60, also reduce the smallest set of aesthetic-feeding answers).
  DO NOT alter his Class-C drivers: Family+Compassion+Loyalty compass, very-high
  agreeableness / moral-concern register, relational trust portfolio, pastoral/
  embodied workMap, broad cost-surface — those must keep producing cs.fe > cs.se.
- **Ashley:** lower `oceanOpennessAesthetic` below 60 by trimming the aesthetic-
  feeding answers that are NOT load-bearing for the mirror-axis test, and ensure
  Q-O1 #1 is not aesthetic. DO NOT alter her Class-D drivers: Q-T Se-top (present-
  tense engagement) and the cross-signal mix that holds BOTH se ≥ 50 AND ni ≥ 50
  (Knowledge/Truth Ni-attractors + Se attractors). The aesthetic subdimension draws
  on `openness_aesthetic`/`openness_emotional` + compassion/mercy/peace priorities
  + Se/Fi contributions (see `lib/ocean.ts`); pick the feeders orthogonal to
  Se/Ni so the mirror-axis condition is untouched.

Update each fixture's `_source` note to record that aesthetic was intentionally
kept out of the top rank / below the subdim floor to avoid the CC-SENSING-TYPING
+10 side-effect (so a future editor doesn't "restore" it and re-break the test).

## Acceptance

- `npm run audit:cross-signal-driver-inference` (or the audit's npm script) is FULLY
  green — both `kevin-class-c-disagree-fe-preferred` and
  `ashley-class-d-mirror-axis-se-ni` pass with their ORIGINAL assertions (Kevin →
  `disagree-prefer-cross-signal`; Ashley → mirror-axis Se-Ni fires).
- Capture before/after cs scores for both: confirm the aesthetic +10 no longer
  fires (the se score returns to its pre-CC-SENSING-TYPING value) and the
  discriminator (Kevin fe>se gap; Ashley se≥50 & ni≥50 with cs.inferredDriver=ni)
  is restored.
- `cohortRealLensCanon` still PASS incl. the Nat Si-dom + Feeler-aux lock; the other
  two synthetic fixtures still PASS; `functionVoiceBinary` byte-identity still PASS.
- `npx tsc --noEmit` clean. No `lib/*` file changed (git diff touches only the two
  JSON fixtures).
- Do NOT commit or push. (Sandbox: prepend `rm -f .git/index.lock` to any commit
  command handed to Jason.)

## Report back

- The exact answer edits per fixture + the before/after cs scores showing the +10
  is gone and the Class-C/D discriminator restored.
- Confirmation only the two synthetic JSON files changed; full audit suite status.
