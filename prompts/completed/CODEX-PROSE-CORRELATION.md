# CODEX-PROSE-CORRELATION — Empirical Validation of the 3C / Goal-Soul Collapse

**Origin:** Per `project_synthesis_layer_collapse` (memory): the architecture proposes Cost (Drive bucket) powers Goal-line, Coverage powers Soul-line, Risk-bucket + Gripping Pull jointly govern movement. The collapse is elegant; this audit tests whether it survives the 20-fixture cohort empirically before any canonical phrase block ships as user-facing claim. Per Jason canon 2026-05-08: "Don't canonize the collapse in user-facing prose until the correlation holds empirically."

**Method discipline:** Read-only audit. No code changes. Single deliverable: a correlation report with pass/weak/fail verdict on whether the collapse holds across the cohort.

**Scope frame:** ~50-80 lines of audit code in a new file. ~1 hour executor time. CODEX-scale because it's pure read-and-report, with one numerical interpretation step (correlation thresholds).

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npx tsx tests/audit/proseCorrelation.audit.ts` (the new file)
- `git status`, `git diff`
- `cat`, `grep`, `find`

## Read First (Required)

1. `lib/identityEngine.ts` — `buildInnerConstitution` entry point.
2. `lib/drive.ts` — drive output computation (`computeDriveOutput`); confirm the bucket field names (`distribution.cost`, `distribution.coverage`, `distribution.compliance` — per `feedback_drive_case_vs_bucket_lean`).
3. `lib/goalSoulMovement.ts` (or wherever Movement output lives) — `computeMovement` or equivalent; confirm field names (`goal`, `soul`, `direction`, `strength`, `grippingPull.score`).
4. The 20-fixture cohort under `tests/fixtures/`.

## Audit Implementation

Create `tests/audit/proseCorrelation.audit.ts`. The audit measures three correlations and reports a pass/weak/fail verdict.

### The three correlations

For each of the 20 fixtures, extract:

- `cost` = `driveOutput.distribution.cost` (percentage 0-100)
- `coverage` = `driveOutput.distribution.coverage`
- `compliance` = `driveOutput.distribution.compliance`
- `goal` = `goalSoulMovement.goal` (0-100)
- `soul` = `goalSoulMovement.soul` (0-100)
- `grip` = `goalSoulMovement.grippingPull.score` (0-100)

Compute Pearson correlation across the 20 paired observations:

- **Correlation A:** `cost` vs `goal`
- **Correlation B:** `coverage` vs `soul`
- **Correlation C:** `compliance` vs `grip`

(Pearson r implementation: standard formula. No external library needed — about 15 lines of TypeScript.)

### Verdict thresholds

- **STRONG SUPPORT** (r > 0.5): the synthesis collapse holds; canonical phrase block can ship as user-facing claim.
- **WEAK SUPPORT** (0.3 < r ≤ 0.5): collapse partially holds; ship with hedged language ("may correlate" / "appears to") rather than declarative.
- **NO SUPPORT** (r ≤ 0.3): collapse fails empirical validation; do not ship as user-facing claim. The architecture remains a private framing, not a measurement.

Apply the threshold to each of the three correlations independently. The collapse as a whole holds only if all three correlations land at WEAK or above.

### Additional descriptive measurements

For context (not gating):

- Fixture-level distribution: how many of the 20 have cost ≥ 38% (cost-bucket lean per `feedback_drive_case_vs_bucket_lean`'s 38% threshold), coverage ≥ 38%, compliance ≥ 38%
- Fixture-level Goal/Soul distribution: count fixtures in each of the four quadrants (Drift / Work without Presence / Love without Form / Giving Presence) using thresholds Goal>=50, Soul>=50 (executor's call on exact threshold; document it)
- Grip distribution: count fixtures with grip=0, grip 1-30, grip 31-70, grip 71-100

### Output format

Audit prints to stdout:

```
=== CODEX-PROSE-CORRELATION ===

Correlation A (cost ↔ goal):     r = 0.XX → STRONG | WEAK | NO support
Correlation B (coverage ↔ soul): r = 0.XX → STRONG | WEAK | NO support
Correlation C (compliance ↔ grip): r = 0.XX → STRONG | WEAK | NO support

VERDICT: <strongest of the three labels that all three meet, or weakest>

=== Cohort distribution ===
Cost-bucket lean (≥38%): N / 20
Coverage-bucket lean: N / 20
Compliance-bucket lean: N / 20

Quadrants (Goal>=50, Soul>=50):
  Drift (low/low): N
  Work without Presence (high/low): N
  Love without Form (low/high): N
  Giving Presence (high/high): N

Grip distribution:
  grip = 0: N
  grip 1-30: N
  grip 31-70: N
  grip 71-100: N
```

## Out of Scope (Do Not)

1. **Do NOT modify any signal pool, composer, renderer, or composite.** Read-only audit.
2. **Do NOT modify fixtures or any test data.**
3. **Do NOT modify other audit files.** Add as its own new file.
4. **Do NOT install statistical libraries.** Pearson r in plain TypeScript (~15 lines).
5. **Do NOT modify** `MEMORY.md`, `AGENTS.md`, or spec memos.
6. **Do NOT canonize anything in user-facing prose.** This audit gates whether canonization happens; it does not perform canonization.
7. **Do NOT recommend a verdict beyond what the numbers say.** If r=0.45, the verdict is WEAK SUPPORT — don't editorialize that "the collapse is intuitively correct anyway."

## Acceptance Criteria

1. New file `tests/audit/proseCorrelation.audit.ts` created.
2. Audit runs cleanly: `npx tsx tests/audit/proseCorrelation.audit.ts` exits 0 and produces the correlation report.
3. Three correlations computed and labeled per the threshold rules.
4. Cohort distribution measurements present.
5. `npx tsc --noEmit` exits 0.
6. `npm run lint` exits 0.
7. `git status --short` shows only the new audit file.

## Report Back

1. **Summary** in 3-5 sentences. Name the three correlation values and the verdict for each.
2. **Verdict for the collapse as a whole** — STRONG / WEAK / NO support, based on the lowest of the three correlations.
3. **Cohort distribution** — paste the descriptive measurements (bucket leans, quadrants, grip distribution).
4. **Implication for synthesis canonization** — given the verdict, what's safe to canonize as user-facing claim and what stays as private architectural framing? Specifically:
   - If STRONG: canonical phrase block from `project_synthesis_layer_collapse` can ship as user-facing prose.
   - If WEAK: ship with hedged language only; flag the weakness in the canon block.
   - If NO: collapse stays as private framing; CC-SYNTHESIS-1A ships Risk Form 2x2 + four-quadrant rename + closing-phrase logic ONLY (no canonical phrase block).
5. **Recommendation for CC-SYNTHESIS-1A scope adjustment** if the verdict requires it.
