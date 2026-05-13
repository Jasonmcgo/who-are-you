# CC-AIM-CALIBRATION-MIGRATION-FINISH — Complete the AimScoreInputs Migration

**Origin:** CC-JASON-FIXTURE-QGRIP1-BACKFILL report-back surfaced 8 static-type errors that were hidden behind TypeScript's incremental cache. `lib/identityEngine.ts:1845` calls `computeAimScore` with the OLD AimScoreInputs shape (`{ complianceBucket, costBucket, convictionScore, movementStrength }`), but Phase 2's `computeAimScore` now requires the NEW shape (`{ wiseRiskStrength, convictionClarity, goalSoulCoherence, movementStrength, responsibilityIntegration }`). The audit suite has the same drift in 5 places.

This means: **the new Phase 2 Aim formula isn't actually running in production.** The engine still consumes the old formula path because the call site never migrated. Jason's reported Aim score (47.2) reflects this — the new formula would produce ~56.

**Method discipline:** Mechanical migration. No new derivations, no formula changes, no architectural decisions. Wire Phase 2's existing functions (`computeConvictionClarity`, `computeGoalSoulCoherence`, `computeResponsibilityIntegration`) into the call site so the new `computeAimScore` receives proper inputs.

**Scope frame:** ~20-30 minutes executor time. CC-standard scale (could be CODEX scope; using CC- prefix per the standard naming convention).

**Cost surface:** Zero LLM. Engine wiring only. Cache regen may or may not fire depending on whether the new Aim score affects cache keys (currently pinned to legacy per Phase 2; should remain pinned unless audit reveals otherwise).

---

## Embedded context

### The drift (per CC-JASON-FIXTURE-QGRIP1-BACKFILL §3)

```
lib/identityEngine.ts:1845
  computeAimScore({ complianceBucket, costBucket, convictionScore, movementStrength })
                                                    ^ OLD shape; type error against NEW shape
```

The new `computeAimScore` (from Phase 2) signature:

```ts
export interface AimScoreInputs {
  wiseRiskStrength: number;            // 0-100
  convictionClarity: number;           // 0-100
  goalSoulCoherence: number;           // 0-100
  movementStrength: number;            // 0-100
  responsibilityIntegration: number;   // 0-100
}
```

The old call site is passing `{ complianceBucket, costBucket, convictionScore, movementStrength }`. At runtime, TypeScript-bypass via tsx means `inputs.wiseRiskStrength`, `inputs.convictionClarity`, etc. are all `undefined` → clamped to 0 by `clamp01`. The result: new `computeAimScore` returns roughly `movementStrength × 0.10 + (some default behavior)`, not the canonical 5-component blend.

This is why Jason's `aimReading.score` reads 47.2 instead of the expected ~56.2 — the new formula isn't really running.

### What the fix looks like

At `lib/identityEngine.ts:1845`, replace the call with the proper input composition:

```ts
// Compose new AimScoreInputs from Phase 1 + Phase 2 derivations
const aimInputs: AimScoreInputs = {
  wiseRiskStrength: constitution.drive.strengths.compliance,         // Phase 1
  convictionClarity: constitution.convictionClarity?.score ?? 50,    // Phase 2 (Segment 1.1)
  goalSoulCoherence: constitution.goalSoulCoherence?.score ?? 50,    // Phase 2 (Segment 1.2)
  movementStrength: constitution.goalSoulMovement.dashboard.movementStrength.length,
  responsibilityIntegration:
    constitution.responsibilityIntegration?.score ?? 0,              // Phase 2 (Segment 1.3)
};

const aimReading = computeAimScore(aimInputs);
```

If a separate legacy call is also needed (for cache stability per Phase 2's design), preserve it:

```ts
const aimReadingLegacy = computeAimScoreLegacy({
  complianceBucket: constitution.drive.distribution.compliance,
  costBucket: constitution.drive.distribution.cost,
  convictionScore: convictionScoreFromTemperature(
    constitution.belief_under_tension?.conviction_temperature ?? null,
  ),
  movementStrength: constitution.goalSoulMovement.dashboard.movementStrength.length,
});
```

Both attach to the constitution: `aimReading` (new canonical) and `aimReadingLegacy` (cache-stability legacy).

### Dependency ordering

The new computation depends on Phase 1 + Phase 2 fields being populated. Check that `attachAimReading` (or whatever the helper is named) runs AFTER:

1. `attachDriveStrengths` (Phase 1) — provides `drive.strengths.compliance`
2. `attachConvictionClarity` (Phase 2)
3. `attachGoalSoulCoherence` (Phase 2)
4. `attachResponsibilityIntegration` (Phase 2) — and this depends on `attachStakesLoad` + `attachDefensiveGrip` already running
5. `attachGoalSoulMovement` — provides `movementStrength.length`

If the orchestration order is wrong, the new helpers will read `undefined` from constitution fields that haven't been attached yet.

### Audit-side drift

5 sites in `tests/audit/aimCalibration.audit.ts` reference the old `AimScoreInputs` shape. They need the same migration. Either:

- **Option A:** update each call site to use the new shape with proper test inputs
- **Option B:** keep some calls testing the legacy path (with `computeAimScoreLegacy`), some testing the new path (with `computeAimScore`)

Option B is cleaner — preserves the legacy regression coverage while testing the new path. If a specific assertion was specifically about the old shape's behavior, keep it on legacy. New behavior assertions move to the new shape.

---

## Architecture

### File map

| File | Action | Purpose |
|---|---|---|
| `lib/identityEngine.ts` | MODIFY (surgical, line ~1845) | Fix the `computeAimScore` call site to use new AimScoreInputs shape composed from Phase 1+2 fields |
| `tests/audit/aimCalibration.audit.ts` | MODIFY | Fix the 5 drift sites — either migrate to new shape OR route to `computeAimScoreLegacy` per Option B |
| (no new files) | — | Pure migration |

### Verification of the actual Aim score post-migration

Audit assertion: after migration, Jason's `aimReading.score` lands ≥ 55 AND ≥ 5 points above `aimReadingLegacy.score`. This validates that the new formula is actually running.

If the post-migration score is still ~47, something else is wrong (likely orchestration ordering — see Dependency ordering above).

---

## Audit assertions (5 NEW)

In `tests/audit/aimMigrationFinish.audit.ts` (NEW small audit):

1. **`aim-migration-tsc-clean-cold`** — running `tsc --noEmit` with `.tsbuildinfo` cleared produces zero errors. (This is the assertion that surfaces the drift; passing means the migration is complete.)
2. **`aim-migration-call-site-uses-new-shape`** — `lib/identityEngine.ts` regex check: `computeAimScore(...)` calls include `wiseRiskStrength:` and `convictionClarity:`.
3. **`aim-migration-legacy-call-site-preserved`** — `lib/identityEngine.ts` regex check: `computeAimScoreLegacy(...)` is called at least once (legacy preserved for cache stability).
4. **`aim-migration-jason-fixture-new-aim-active`** — Jason fixture's `aimReading.score >= 55` AND `aimReading.score - aimReadingLegacy.score >= 5`. (Validates that the new formula is genuinely running on cohort fixtures.)
5. **`aim-migration-cohort-new-aim-distribution`** — for all 28 fixtures, `aimReading.score` is computed from the new formula (not falling back to defaults). Audit asserts the cohort distribution shows the expected lift over legacy (per Phase 2's report).

In `tests/audit/aimCalibration.audit.ts` (REFACTOR per Option B above):
- Tests referencing legacy behavior route to `computeAimScoreLegacy`
- Tests for new behavior use the new shape directly

---

## Out-of-scope guardrails (DO NOT)

1. **Do NOT modify `lib/aim.ts` formula logic.** Phase 2 shipped the formula; this CC just wires it correctly.
2. **Do NOT modify any of Phase 2's new derivation modules** (`lib/convictionClarity.ts`, `lib/goalSoulCoherence.ts`, `lib/responsibilityIntegration.ts`, `lib/gripDecomposition.ts`, `lib/movementLimiter.ts`).
3. **Do NOT modify `lib/threeCStrength.ts`** (Phase 1).
4. **Do NOT modify the LLM prompts.** The cache-key pinning to legacy Aim stays in place per Phase 2's design.
5. **Do NOT modify `lib/renderMirror.ts` or `app/components/InnerConstitutionPage.tsx`.** Phase 3 is render layer.
6. **Do NOT modify `lib/riskForm.ts`.** Phase 3a will switch it to the new Aim.
7. **Do NOT change the Aim weighting constants.** Calibration adjustments belong in a separate CC if cohort review reveals miscalibration.
8. **Do NOT regenerate the cohort cache.** Cache hashes remain pinned to legacy per Phase 2.

---

## Verification checklist

- [ ] `rm tsconfig.tsbuildinfo` (clear the incremental cache so the drift surfaces)
- [ ] `npx tsc --noEmit` — clean (the 8 errors must be gone)
- [ ] `npm run lint` — clean
- [ ] `npx tsx tests/audit/aimMigrationFinish.audit.ts` — all 5 assertions pass
- [ ] `npx tsx tests/audit/aimCalibration.audit.ts` (refactored) — pass
- [ ] All 22 other audits remain green

---

## Report-back format

1. **Summary** — files modified, line-count delta, audit pass count.
2. **Call-site code paste** — show the new `computeAimScore` call with proper input composition AND the preserved `computeAimScoreLegacy` call.
3. **Orchestration order confirmation** — confirm `attachAimReading` runs after Phase 1 + Phase 2 helpers.
4. **Jason fixture validation** — paste `aimReading.score` (expected ~56) AND `aimReadingLegacy.score` (expected ~37 or ~47) post-migration.
5. **Cohort distribution table** — for all 28 fixtures: legacy Aim, new Aim, diff. Confirm new formula is producing the expected lift across the cohort.
6. **tsc cold-build confirmation** — explicitly show that running `tsc --noEmit` after clearing `.tsbuildinfo` is clean.
7. **Audit pass/fail breakdown** — every audit listed in the verification checklist.
8. **Out-of-scope verification** — confirm none of the 8 DO-NOT items were touched.

---

**Architectural test:** after this CC, Jason's `aimReading.score` actually lands at the Phase 2 canonical value (~56) instead of the 47 he's currently rendering. `tsc --noEmit` cold-clean passes. Phase 3a can confidently consume the new Aim score knowing it's live in production.
