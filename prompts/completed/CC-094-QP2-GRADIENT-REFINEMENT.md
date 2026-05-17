# CC-094 — Q-P2 Gradient Refinement

## Objective

Q-P2 ("If a belief put your job at risk, you would:") currently has 4 options:
- Accept the risk
- Hide it from work
- Don't volunteer it
- Change your position

Per Jason's observation 2026-05-16 (filed in `feedback_qp2_gradient_asymmetry.md`): **three of these options are functionally indistinguishable** to the engine. "Hide it from work" and "Don't volunteer it" produce identical `categoryHasSupport()` results for Integrity / Discernment / costly-conviction signals. "Change your position" is a meaningfully different signal (actual belief shift / capitulation), but the two suppression variants are collapsed.

Q-P1 (the relationship-cost equivalent) has a proper gradient: *"Say it directly / Express it carefully / Soften it / Don't share / Hide it"*. The middle option **"Express it carefully"** is what's missing from Q-P2 — the answer that means *"I hold the belief, I'll express it when appropriate, but I won't actively risk the job."* That's Daniel's actual lived posture; today he has no accurate option and toggles between two imperfect ones producing wildly different reads.

Per the gradient calibration canon: **gradient inputs deserve gradient routing**. Question-design that collapses meaningful gradient into binary or near-binary choices is the load-bearing reason single questions produce dramatic prose swings.

This CC refines Q-P2 to match Q-P1's gradient structure.

## Sequencing

- Parallel-safe with CC-088, CC-089, CC-090, CC-091, CC-092, CC-093.
- Independent of all engine CCs (Layer 1 question content, not engine math).
- Should fire after CC-088 so cohort fixtures' baseline is clean.

## Launch Directive

Run with `claude --dangerously-skip-permissions`.

## Execution Directive

Single pass with three concrete subtasks: (1) add the "Express carefully at work" option to Q-P2; (2) consolidate the two redundant suppression options into one; (3) ensure backward compatibility for existing answers. Don't add OR remove other gradient stops beyond what's documented in scope.

## Bash Commands Authorized

- `grep`, `ls`, `cat`, `find`, `wc`
- `npx tsc --noEmit`
- `npm run lint`
- `npx tsx tests/audit/<name>.audit.ts`

Do not run `npm install`, `git commit`, `git push`, `drizzle-kit push`, or any LLM build script.

## Read First (Required)

1. `data/questions.ts` — find Q-P2 definition. Confirm the current option list. Also confirm Q-P1 for gradient-parallel reference.
2. `data/questions.ts` — find Q-P1 ("If expressing a belief would cost you close relationships, you would:") — confirm its options include "Express it carefully" (or similar middle stop).
3. `lib/identityEngine.ts` — find where Q-P2 is consumed. Specifically, `categoryHasSupport()`'s Integrity branch + any other places that key on Q-P2. Confirm consumers don't hard-code the existing option strings in ways that would break with new options.
4. `feedback_qp2_gradient_asymmetry.md` — the canon memory for this CC.
5. `feedback_gradient_calibration_canon.md` — gradient framing.
6. `feedback_honor_every_answer_canon.md` — every Q-### option must be load-bearing AND distinct.

## Scope

### Item 1 — Revise Q-P2 options

**Current Q-P2 options:**
1. Accept the risk
2. Hide it from work
3. Don't volunteer it
4. Change your position

**Revised Q-P2 options:**
1. **Accept the risk** *(full integrity, full cost — unchanged)*
2. **Express it carefully at work** *(new — middle gradient stop matching Q-P1's "Express it carefully")*
3. **Keep it quiet at work** *(consolidated — replaces both "Hide it from work" and "Don't volunteer it")*
4. **Change your position** *(belief actually shifted — unchanged)*

Order matters: gradient runs from highest integrity (Accept) to lowest (Change). The order should reflect the gradient.

### Item 2 — Backward compatibility

Existing sessions have answers like "Hide it from work" or "Don't volunteer it". These answers must still be accepted by the engine post-CC. Approach:

**Option A — Map legacy answers in the consumer.** Keep the old option strings as valid answer values, but the engine maps "Hide it from work" and "Don't volunteer it" both to the new "Keep it quiet at work" signal internally. New users only see the 4 revised options.

**Option B — Migrate stored answers.** Run a migration that updates existing answer rows to the new option strings. Loses information (was the user Hide-coded or Don't-volunteer-coded? — but per the canon, they were indistinguishable to the engine anyway, so no real info loss).

**Recommended: Option A.** No DB migration; old answers continue to work; engine handles the mapping. The new options only show in the UI for new submissions.

Implementation: in the consumer (likely `categoryHasSupport()` Integrity branch), accept any of `["Accept the risk", "Express it carefully at work", "Keep it quiet at work", "Hide it from work", "Don't volunteer it", "Change your position"]` and map appropriately:
- "Accept the risk" → full Integrity support
- "Express it carefully at work" → partial Integrity support (new)
- "Keep it quiet at work" / "Hide it from work" / "Don't volunteer it" → no Integrity support (suppression cluster)
- "Change your position" → low Integrity, capitulation signal

### Item 3 — Engine signal mapping for the new middle option

"Express it carefully at work" should fire **partial Integrity support** — equivalent to Q-P1's "Express it carefully" partial support. The user has the belief and will express it carefully, choosing audience and timing. That's not full integrity-at-all-costs (which is "Accept the risk"), but it's far from suppression.

Concretely in `categoryHasSupport()`:
- **Integrity full support fires** when Q-P2 = "Accept the risk" (existing behavior)
- **Integrity partial support fires** when Q-P2 = "Express it carefully at work" (new) — this should be enough to put Integrity in the candidate set with non-zero score
- **Integrity no-support** when Q-P2 ∈ {"Keep it quiet at work", "Hide it from work", "Don't volunteer it", "Change your position"}

The "partial support" mechanism needs definition. Today `categoryHasSupport()` likely returns a boolean. For partial support, options:

**Option A — Lower the threshold for full support.** Accept the risk OR Express carefully both fire Integrity support; the categoryHasSupport boolean returns true for both.

**Option B — Add a partial-support concept.** Returns `"full" | "partial" | "none"` and the scoring loop applies a multiplier (e.g., 0.7) for partial. More code, more nuance.

**Recommended: Option A for this CC.** Adding a partial-support concept is a layer-2 architectural change that should be its own CC. For now, "Express it carefully at work" simply gets treated as Integrity-supporting, same as "Accept the risk", but with the gradient-canon implication that future work can refine.

### Item 4 — UI / form changes

The `/assessment` form needs to render the new options. Locate the form component that renders Q-P2 (probably reads from `data/questions.ts`). If `data/questions.ts` is the single source of truth, updating it propagates to UI automatically. Verify.

If the UI has any hard-coded references to the old option strings (e.g., for analytics or test fixtures), update those too.

### Item 5 — Cohort fixture update

Check `tests/fixtures/cohort/` for Q-P2 answers in synthetic personas. Some may use "Don't volunteer it" or "Hide it from work". Post-CC:

- Synthetic personas with the old options STAY valid (per Item 2 backward compatibility).
- Optionally update synthetic personas to the new vocabulary for cleanliness, OR keep them as-is to test backward compatibility. Document the choice.

Recommendation: keep synthetic fixtures as-is for backward-compat testing; add ONE new synthetic fixture with "Express it carefully at work" as a regression anchor for the new option's routing behavior.

### Item 6 — Audit

New `tests/audit/qp2GradientRefinement.audit.ts` with assertions:
1. Q-P2 in `data/questions.ts` has the 4 revised options in the documented order
2. Q-P2 in `data/questions.ts` does NOT include both "Hide it from work" AND "Don't volunteer it" simultaneously (the consolidation happened)
3. Legacy answer values ("Hide it from work", "Don't volunteer it") are still accepted by the engine without error
4. A synthetic fixture with Q-P2 = "Express it carefully at work" + canonical Daniel-like signals produces Integrity-supported Conviction (not the Harmony fallback)
5. The Daniel-shape regression: synthetic fixture with Q-P2 = "Accept the risk" + canonical signals still routes Conviction = Integrity (unchanged)

### Item 7 — Regression sweep

After Items 1-6:
- Wave 1 + CC-084/085/086/087 + CC-088 (if landed) + CC-089/090/091/092 (if landed) audits all pass
- `audit:qp2-gradient-refinement` passes 5/5
- twoTier baseline drift: small if synthetic fixtures use new option, none if they stay legacy

## Do NOT

- **Do NOT change Q-P1's options.** Q-P1 is parallel-structured already (per gradient canon); only Q-P2 needs work in this CC.
- **Do NOT add other gradient stops to Q-P2 beyond the 4 documented.** Specifically, don't add "Soften it for work" or similar — keep it tight.
- **Do NOT migrate stored DB rows.** Backward compatibility via consumer mapping (Item 2 Option A), not via data migration.
- **Do NOT change engine math.** This is question content + consumer mapping only.
- **Do NOT introduce a "partial support" concept** in `categoryHasSupport()`. Defer that to a future layer-2 CC. For now, "Express it carefully at work" is full Integrity support like "Accept the risk".
- **Do NOT touch any Wave 1 persistence file.**
- **Do NOT regenerate any cache file** under `lib/cache/`.
- **Do NOT regenerate `tests/audit/twoTierBaseline.snapshot.json`.** CC-088 owns baseline refreshes.
- **Do NOT call any LLM.** No `*LlmServer.ts` imports. No SDK.
- **Do NOT commit or push.**

## Allowed to Modify

- `data/questions.ts` — Q-P2 options revision
- `lib/identityEngine.ts` — `categoryHasSupport()` Integrity branch (legacy answer mapping + new option support)
- `app/components/assessment/` (or wherever the assessment form renders Q-P2) — only if there's hard-coded option strings; ideally the UI reads from `data/questions.ts` and no edit is needed
- `tests/fixtures/cohort/` — optionally add one new synthetic fixture with the new option (Item 5 recommendation); don't change existing fixtures
- `tests/audit/qp2GradientRefinement.audit.ts` (new)
- `package.json` (add `audit:qp2-gradient-refinement` script)
- Move prompt to `prompts/completed/` at end

## Out of Scope

- Q-P1 changes
- Other question revisions (Q-O1, Q-V1, etc.)
- Engine math
- Schema changes
- Migration of stored DB rows
- Partial-support concept in `categoryHasSupport()`
- LLM rewrite layer

## Acceptance Criteria

1. `npx tsc --noEmit` passes
2. `npm run lint` passes
3. `npx tsx tests/audit/qp2GradientRefinement.audit.ts` passes 5/5
4. Wave 1 audits still pass
5. CC-084 / CC-085 / CC-086 / CC-087 / CC-088 / CC-089 / CC-090 / CC-091 / CC-092 audits still pass (whichever have landed)
6. Q-P2 has 4 options in the documented gradient order
7. Legacy Q-P2 answer values are still accepted (no breaking change)
8. Synthetic fixture with new "Express it carefully at work" routes Conviction to Integrity (not Harmony fallback)
9. Regression: existing Daniel-shape fixture (Q-P2 = "Accept the risk") still routes Conviction = Integrity
10. Zero modifications to engine math
11. Zero modifications to Wave 1 persistence files
12. Zero LLM calls
13. Zero cache file modifications
14. Zero DB row migrations
15. Zero commits

## Report Back

- The exact revised Q-P2 option list
- The consumer mapping logic added (which old + new option strings produce which Integrity support level)
- Cohort fixture impact: any existing synthetic fixture that uses legacy Q-P2 options, verify still routes correctly
- New synthetic fixture (if added) per Item 5
- Audit results
- Any deviation from Allowed-to-Modify list

## Notes for executor

- Estimated time: 30–45 min
- Cost: $0
- This is the smallest CC in tomorrow's batch in terms of scope, but it has high user-visible impact: every future user takes a more accurate Q-P2 going forward.
- The "Express it carefully at work" option language can vary if you have a better phrasing. The semantic requirement is *"acknowledges belief, expresses with care, doesn't actively risk job"* — that's the gradient stop the engine needs. Phrase it however lands cleanly.
- This is layer 1 question-content work. Per `feedback_relationships_and_behavioral_metadata_canon.md`, the bigger layer-2 work (cross-answer tension detection, behavioral metadata) is queued separately. Don't bundle.
