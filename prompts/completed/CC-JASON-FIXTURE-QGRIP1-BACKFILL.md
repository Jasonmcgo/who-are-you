# CC-JASON-FIXTURE-QGRIP1-BACKFILL — Add Q-GRIP1 Ranking to Jason's Session Fixture

**Origin:** CC-TRAJECTORY-TEST-FIXTURES report-back flagged that `tests/fixtures/ocean/07-jason-real-session.json` exists but lacks Q-GRIP1 — the fixture predates the Q-GRIP1 question landing. Phase 2's audits for Jason fixture currently use *constructed inputs* (acceptable, but tightening to the real fixture is preferred).

This CC adds Jason's Q-GRIP1 ranking to the existing fixture file.

**Method discipline:** One file edit. No engine logic changes. No new audit (existing audits will run against the now-complete fixture).

**Scope frame:** ~5-10 minutes executor time. Minimal CC.

**Cost surface:** Zero LLM. No cohort cache regen (Q-GRIP1 affects engine derivations that feed grippingPull → named grips → CC-GRIP-CALIBRATION → CC-PRIMAL-COHERENCE. These flow into the cohort cache via the cache key. Whether the cache regenerates depends on whether Jason's fixture has a cached LLM paragraph. If yes, it should regenerate; if no, no-op. Audit confirms.)

---

## Embedded context

### Jason's Q-GRIP1 ranking (from his live session report, jason0429)

Jason's rendered "Pressure pull" section showed three named grips:

1. **Grips control under pressure** → maps to `grips_control` (top-1)
2. **Grips money / security under pressure** → maps to `grips_security` (top-2)
3. **Grips being right under pressure** → maps to `grips_certainty` (top-3)

The Q-GRIP1 question has 8 ranked options total (per `lib/gripCalibration.ts:69-99` NAMED_GRIP_TO_PRIMAL keys):

- `grips_control`
- `grips_security`
- `grips_reputation`
- `grips_certainty` (being right)
- `grips_neededness` (being needed)
- `grips_comfort` (comfort / escape)
- `grips_old_plan` (plan that used to work)
- `grips_approval` (approval of specific people)

The top-3 are known from Jason's session. Ranks 4-8 are unknown from the public report.

### Recommended approach for ranks 4-8

Two options:

**Option A (recommended):** alphabetical ordering of remaining options for ranks 4-8.
**Option B:** plausible-Jason-shape ordering based on canonical INTJ + Knowledge-protector profile (e.g., `grips_old_plan` next because of structured thinking; `grips_reputation` later because of low approval-seeking signal).

Option A is more honest about the gap (we don't know the exact ranks). Option B introduces an editorial guess that may not match Jason's actual answers.

**Use Option A:** alphabetical ordering of the remaining 5 options after the known top-3.

The resulting Q-GRIP1 ranking:

```json
"Q-GRIP1": [
  "grips_control",
  "grips_security",
  "grips_certainty",
  "grips_approval",
  "grips_comfort",
  "grips_neededness",
  "grips_old_plan",
  "grips_reputation"
]
```

Add a code comment in the JSON file (or alongside) noting that ranks 4-8 are alphabetical placeholders; Jason can refine in a follow-on if needed.

---

## Architecture

### File map

| File | Action | Purpose |
|---|---|---|
| `tests/fixtures/ocean/07-jason-real-session.json` | MODIFY (single field add) | Insert Q-GRIP1 array with the 8-item ranking above |

If the fixture has a "metadata" or "notes" section, also add a brief note: *"Q-GRIP1 ranks 4-8 are alphabetical placeholders; top-3 sourced from jason0429 live session report 2026-05-10."*

### Verification

After the edit:

1. Run the existing audit suite:
   - `npx tsc --noEmit`
   - `npm run lint`
   - All audits in `tests/audit/` should remain green
2. Specifically check:
   - `tests/audit/primalCoherence.audit.ts` — Jason fixture validation should now run (was previously `.skip` per CC-PRIMAL-COHERENCE)
   - `tests/audit/gripCalibration.audit.ts` — Jason should now have named-grip signals firing
3. Verify the constitution build:
   - `goalSoulGive.grippingPull.signals` should now contain entries for control / security / certainty
   - `gripTaxonomy.primary` should fire (was previously low-confidence due to no grips firing)

---

## Out-of-scope guardrails (DO NOT)

1. **Do NOT modify any other fixture file.**
2. **Do NOT modify any engine code (`lib/*`).**
3. **Do NOT modify any audit code.**
4. **Do NOT modify the cache files manually.** If audits trigger cache invalidation, regenerate via build scripts; don't hand-edit cache JSON.
5. **Do NOT add any new questions to `data/questions.ts`.**
6. **Do NOT change ranks 1-3** — those are sourced from Jason's actual session report.
7. **Do NOT bundle Phase 2 / Phase 3 work.**

---

## Verification checklist

- [ ] `tests/fixtures/ocean/07-jason-real-session.json` contains a Q-GRIP1 array with 8 items
- [ ] Top-3 are `grips_control`, `grips_security`, `grips_certainty` in that order
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run lint` clean
- [ ] All existing audits green
- [ ] If cache regeneration is needed, run:
  ```
  ANTHROPIC_API_KEY=$(grep ^ANTHROPIC_API_KEY .env.local | cut -d= -f2) npx tsx scripts/buildSynthesis3.ts --fixture=ocean/07-jason-real-session.json --force
  ANTHROPIC_API_KEY=$(grep ^ANTHROPIC_API_KEY .env.local | cut -d= -f2) npx tsx scripts/buildGripTaxonomy.ts --fixture=ocean/07-jason-real-session.json --force
  ```

---

## Report-back format

1. **Summary** — confirm the fixture file was edited; paste the Q-GRIP1 array as inserted.
2. **Constitution build evidence** — paste Jason's `goalSoulGive.grippingPull.signals` (should now show control, security, certainty) and `gripTaxonomy.primary` (should now have a confident classification).
3. **Audit pass/fail** — confirm all audits green, including any that were previously `.skip`'d on Jason fixture (e.g., `primal-coherence-jason-validation`).
4. **Cache regen note** — confirm whether Jason fixture's cached prose was regenerated, and the resulting cost (probably ≤ $0.10 for two paragraphs).
5. **Recommendations** — note if Jason should later refine ranks 4-8 from his actual answers.

---

**Architectural test:** Jason's fixture now flows cleanly through the engine with Q-GRIP1 populated. Phase 2's audits can reference the real fixture instead of constructed inputs. Any previously-skipped Jason validation assertions in earlier CCs (CC-PRIMAL-COHERENCE, CC-GRIP-CALIBRATION) now run and pass.
