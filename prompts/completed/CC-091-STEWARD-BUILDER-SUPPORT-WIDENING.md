# CC-091 — Steward-Builder Support Widening on Gravity (+ Defensive Fallback Fix)

## Objective

Daniel's Gravity card reads *"an advocacy gift"* in his post-CC-086-followup prod render, when it should read *"a builder's gift"*. The user's read of Daniel: *"he built the family business... took the risk his brothers wouldn't... drive (like creativity) should still have 'goal' contribution... this was a high risk move as well."* Daniel is canonically a steward-builder. The picker isn't reaching Builder for him.

**Two root causes, both gradient-collapse issues per the gradient canon:**

1. **Builder's `categoryHasSupport()` on Gravity is too narrow.** Daniel's signal cluster (Q-E1-outward Building/creating first + Q-A1 Maintaining responsibilities + Q-V1 logic-explanation first + Q-C4 Individual responsibility first) doesn't reach Builder's support threshold. He builds AS PROTECTION (faith, family, business inheritance) — not as build-for-its-own-sake. The current support check probably gates on signals tuned to architect-builders (Q-3C2 "Progress on the thing I am building" near top), missing the steward-who-builds pattern.

2. **The relational fallback to "Harmony" is wrong for steward shapes.** When Builder + Discernment + Integrity all fail support checks on Gravity for Daniel, the code falls to Harmony (per CC-086's added fallback). For a Si-Te steward, the canonical fallback should be **Stewardship**, not Harmony.

## Sequencing

- Parallel-safe with CC-088, CC-089, CC-090, CC-094.
- Independent of CC-092 (different code path).
- Should fire after CC-088 (baseline refresh) so cohort fixture drift from this CC is small + manageable.

## Launch Directive

Run with `claude --dangerously-skip-permissions`.

## Execution Directive

Single pass with two concrete subtasks: (1) widen Builder's Gravity support to detect the steward-builder cluster; (2) replace Harmony fallback with Stewardship fallback when `isStewardShape()` is true. If the existing `categoryHasSupport()` is gated on a single signal Daniel lacks, prefer adding an OR branch for the steward-builder cluster rather than removing the existing signal. Additive over substitutive (per gradient canon).

## Bash Commands Authorized

- `grep`, `ls`, `cat`, `find`, `wc`
- `npx tsc --noEmit`
- `npm run lint`
- `npx tsx tests/audit/<name>.audit.ts`
- `npx tsx scripts/verifyStewardRouting.ts` (the diagnostic script from yesterday) to verify per-fixture routing post-fix

Do not run `npm install`, `git commit`, `git push`, `drizzle-kit push`, or any LLM build script.

## Read First (Required)

1. `lib/identityEngine.ts` — find `categoryHasSupport()` function. Trace the Builder branch specifically. Identify which signals + thresholds it currently requires.
2. `lib/identityEngine.ts:3370` area — the relational fallback line: `isRelationalFallback ? "Harmony" : pickGiftCategory(...)`. This is the second fix site.
3. `lib/identityEngine.ts` — `isStewardShape()` if it exists (added by CC-086 followup); confirm it's available + correctly named. If it doesn't exist as a standalone function (CC-086 followup folded it into `reorderPreferencesForRelationalShape` via `stack.dominant === "si"` checks), extract it as a named function for clarity.
4. `data/questions.ts` — confirm signal IDs for Q-E1-outward "building", Q-A1 "maintaining_responsibilities", Q-V1 "goal_logic_explanation", Q-C4 "individual" / "authority". These compose the steward-builder cluster.
5. `feedback_qp2_gradient_asymmetry.md` — related; explains Q-P2 had the same gradient-collapse issue (different question, same architectural pattern).
6. `feedback_gradient_calibration_canon.md` — the meta-canon.

## Scope

### Item 1 — Define / surface `isStewardShape()` as a named function

If not already a named function, extract `isStewardShape(stack, topCompass)` from CC-086 followup's inline logic. Conditions:
- `stack.dominant === "si"` AND
- `topCompass` includes any of: `faith_priority` | `honor_priority` | `stability_priority` | `loyalty_priority` | `family_priority`

(Note: Family is included because Daniel + Harry both have Family in their compass top, and they're canonical steward shapes.)

### Item 2 — Widen Builder's Gravity support to detect steward-builder cluster

In `categoryHasSupport()`, find the `case "Builder":` branch (or equivalent). Today's logic likely requires some combination of:
- Q-3C2 "Progress on the thing I am building" near top, OR
- Q-V1 "Results should speak for themselves" near top, OR
- Q-GS1 "It created something beautiful, useful, or durable" near top

For Gravity card specifically, ADD a steward-builder OR branch:
```
Builder support also fires when:
  - Card is Gravity
  - AND isStewardShape(stack, topCompass) is true
  - AND Q-E1-outward ranks "building" or "creating" in top-2
  - AND Q-C4 ranks "individual" OR "authority" in top-2
```

This captures Daniel-shape: Si steward, Faith/Family compass, Q-E1-outward Building first, Q-C4 Individual first. Builder support fires for him on Gravity even though his Q-V1 and Q-3C2 don't lead with build-for-its-own-sake signals.

### Item 3 — Replace Harmony fallback with Stewardship fallback for steward shapes

In `lib/identityEngine.ts` around line 3370:

**Current logic:**
```typescript
const winner =
  scored.length > 0 && scored[0].score > 0
    ? scored[0].cat
    : isRelationalFallback
      ? "Harmony"
      : pickGiftCategory(stack, topCompass, topGravity, agency, weather, fire);
```

**New logic:**
```typescript
const isStewardFallback =
  SHAPE_REORDER_CARDS.has(card) && isStewardShape(stack, topCompass);
const winner =
  scored.length > 0 && scored[0].score > 0
    ? scored[0].cat
    : isStewardFallback
      ? "Stewardship"
      : isRelationalFallback
        ? "Harmony"
        : pickGiftCategory(stack, topCompass, topGravity, agency, weather, fire);
```

Note: the cap-of-3 still applies, so if Stewardship has been used 3 times already (Compass + Weather + Trust), the fallback may produce a category that's already capped. In that edge case, fall through to `pickGiftCategory()` as the final fallback. Verify the cap logic still applies correctly in the new fallback path.

### Item 4 — Verification via verifyStewardRouting.ts script

After Items 1-3, re-run the diagnostic script:
```
npx tsx scripts/verifyStewardRouting.ts
```

Confirm per-fixture changes:
- `si-tradition-steward` (canonical Daniel-shape fixture): Trust = Stewardship ✓ (unchanged), Gravity = **Builder** (was Advocacy), Conviction = Integrity or Discernment (was Harmony — depends on whether Q-P2 in fixture supports Integrity)
- `paralysis-shame-without-project` (Jason-shape): Gravity = Builder (regression anchor — unchanged)
- `ti-systems-analyst`: Gravity = Builder (unchanged)
- `fi-quiet-resister` (Fi-Se non-steward): Gravity = unchanged (no steward-shape route applies)
- Other fixtures: minimal impact

### Item 5 — Audit

New `tests/audit/stewardBuilderSupport.audit.ts` with assertions:
1. `isStewardShape()` is a named exported function with the expected signature
2. `categoryHasSupport()` for Builder on Gravity card fires for synthetic Si-Te + Faith compass + Q-E1-Building-first fixture
3. `categoryHasSupport()` for Builder on Gravity card does NOT fire for synthetic Si-Te + Faith compass WITHOUT Q-E1-Building-first (regression — non-builder stewards shouldn't get Builder)
4. Steward-shape fallback returns "Stewardship" (not "Harmony") when scored.length === 0 AND isStewardShape is true
5. Cohort regression: `si-tradition-steward` fixture now routes Gravity = Builder (was Advocacy in current state)
6. Cohort regression: `paralysis-shame-without-project` (Jason-shape) Gravity = Builder unchanged

### Item 6 — Regression sweep

After Items 1-5:
- Wave 1 + CC-084/085/086/087 audits all still pass
- `audit:steward-builder-support` passes 6/6
- twoTier baseline drift: small + bounded; report magnitude in report-back. If CC-088 has landed, baseline refresh already happened; new drift from this CC's si-tradition-steward Gravity change should be caught by audit assertion 5 and is acceptable

## Do NOT

- **Do NOT modify engine math.** No score / Aim / Grip / Movement changes. This is picker logic + support criteria only.
- **Do NOT change `GIFT_NOUN_PHRASE` or `GIFT_DESCRIPTION` tables.**
- **Do NOT change other categories' support criteria.** Only Builder on Gravity (Item 2). Don't widen Discernment / Integrity / Pattern support as part of this CC — those are separate calibration questions.
- **Do NOT change the Harmony fallback for non-steward relational shapes** (Cindy / Michele / Ashley). They should still fall to Harmony. Only steward shapes route to Stewardship fallback.
- **Do NOT remove the repetition cap.** The cap=3 from CC-086 followup stays.
- **Do NOT touch any Wave 1 persistence file.**
- **Do NOT regenerate any cache file** under `lib/cache/`.
- **Do NOT regenerate `tests/audit/twoTierBaseline.snapshot.json`.** CC-088 owns baseline refreshes.
- **Do NOT call any LLM.** No `*LlmServer.ts` imports. No SDK.
- **Do NOT commit or push.**

## Allowed to Modify

- `lib/identityEngine.ts` — `categoryHasSupport()` Builder branch + the fallback line + `isStewardShape()` extraction if not already named.
- `lib/types.ts` — only if a type for the steward-shape signature changes.
- `tests/audit/stewardBuilderSupport.audit.ts` (new)
- `package.json` (add `audit:steward-builder-support` script)
- Move prompt to `prompts/completed/` at end

## Out of Scope

- Engine math
- Other categories' support criteria
- Non-Gravity card routing (Trust, Conviction, Compass, etc.)
- Non-steward shape routing
- LLM rewrite layer
- Schema changes

## Acceptance Criteria

1. `npx tsc --noEmit` passes
2. `npm run lint` passes
3. `npx tsx tests/audit/stewardBuilderSupport.audit.ts` passes 6/6
4. Wave 1 audits still pass
5. CC-084 / CC-085 / CC-086 / CC-087 audits still pass
6. `si-tradition-steward` cohort fixture: Gravity routes Builder (was Advocacy)
7. `paralysis-shame-without-project` cohort fixture: Gravity still routes Builder (regression anchor)
8. Synthetic non-steward Si fixture (no Faith-cluster compass): Gravity does NOT route Builder via steward path
9. Synthetic Cindy-like fixture (Fi-Se): Gravity unchanged (relational path, not steward path)
10. Zero modifications to engine math
11. Zero modifications to Wave 1 persistence files
12. Zero LLM calls
13. Zero cache file modifications
14. Zero commits

## Report Back

- The widened Builder support criteria (exact AND/OR logic added)
- The fallback chain (steward → Stewardship; relational non-steward → Harmony; neither → pickGiftCategory)
- Per-cohort-fixture routing diff: which fixtures changed on Gravity, what they were before vs after
- Verification of Daniel-shape: si-tradition-steward fixture's full card breakdown post-fix (Compass / Trust / Gravity / Conviction)
- Audit results
- Any deviation from Allowed-to-Modify list

## Notes for executor

- Estimated time: 45–60 min
- Cost: $0
- The signal cluster for steward-builder is documented above; if you find that Daniel's actual cohort fixture doesn't have those exact signals (because synthetic fixtures may have been crafted differently from real prod Daniel), adjust the cluster to what the fixture actually has and document the deviation. Test against verifyStewardRouting.ts to confirm.
- This CC is the "additive over substitutive" canon in action: we're adding OR branches to existing support criteria, not removing existing ones. That preserves Jason's regression anchor (Ni-Te also gets Builder) while opening Daniel's path.
