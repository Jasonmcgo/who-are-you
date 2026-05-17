# CC-092 — Gift Table Label / Description Join Fix

## Objective

The Gifts table at the top of every report has a recurring misalignment bug: **gift LABELS** and **gift DESCRIPTIONS** are pulling from different categories. Visible in both Cindy's report (Surprise #2 from 2026-05-16 morning) and Daniel's post-Q-P2-fix render:

**Cindy's table (Se-Fi caregiver):**
| Gift label | Description that landed |
|---|---|
| "present-tense care" | "turn ideas into working systems and push past friction toward a result" *(this is Builder's description, not present-tense)* |
| "protective loyalty" | "clarify what's actually being claimed before the conversation moves" *(Precision's description, not loyalty)* |
| "embodied steadiness" | "notice what's owed and to protect those who can't protect themselves" *(Advocacy's description, not embodied)* |

**Daniel's table (Si-Te steward):**
| Gift label | Description that landed |
|---|---|
| "stewardship" | "preserve what matters across time" ✓ |
| "faithful responsibility" | "refuse compromises that would betray your own sense of what's right" *(Integrity's description, not faithful responsibility)* |
| "operational trust" | "notice what's owed and to protect those who can't protect themselves" *(Advocacy's description, not operational trust)* |

The labels are shape-coded correctly (the engine knows Cindy is a caregiver and Daniel is a steward, so labels are appropriately themed). But the descriptions are pulling from a separate `GIFT_DESCRIPTION` lookup that's keyed on `GiftCategory` rather than label. **The label and description are coming from different sources of truth.**

Per the gradient calibration canon: when two parts of the same output (label + description) come from different category resolutions, the output isn't gradient — it's incoherent. The user reads the label and the description as one statement; they need to align.

## Sequencing

- Parallel-safe with CC-088, CC-089, CC-094.
- Should fire AFTER CC-088 (baseline refresh) AND ideally AFTER CC-091 (steward-builder fix), since both produce cohort drift that compounds.
- Independent of CC-093 (different code path).

## Launch Directive

Run with `claude --dangerously-skip-permissions`.

## Execution Directive

Single pass: trace the gifts-composition layer, identify where label and description diverge, restore single-source-of-truth coupling. If the divergence is structural (e.g., two different functions populate label vs description, each computing their own category), fix the structural seam — don't paper over it with a post-hoc reconciliation.

## Bash Commands Authorized

- `grep`, `ls`, `cat`, `find`, `wc`
- `npx tsc --noEmit`
- `npm run lint`
- `npx tsx tests/audit/<name>.audit.ts`
- `npx tsx scripts/verifyStewardRouting.ts` (use as a smoke check after fix)

Do not run `npm install`, `git commit`, `git push`, `drizzle-kit push`, or any LLM build script.

## Read First (Required)

1. `lib/identityEngine.ts` — find:
   - The function that composes the Gifts table (likely `getTopGifts()` or similar)
   - `GIFT_NOUN_PHRASE` (line ~3552) — the noun-phrase lookup, keyed by `GiftCategory`
   - `GIFT_DESCRIPTION` (line ~3567) — the description lookup, keyed by `GiftCategory`
   - The lookup where the LABELS in the rendered table come from (these are shape-themed: "stewardship" / "present-tense care" / "operational trust" / "faithful responsibility" — NOT identical to `GIFT_NOUN_PHRASE` values)
2. `lib/renderMirror.ts` — find the Gifts table render site (likely renders a markdown table with three columns: Gift / What it means / Growth edge)
3. The "Top Gifts" section of any rendered cohort fixture report — confirm the exact labels + descriptions for diff comparison.
4. `feedback_gradient_calibration_canon.md` — the canon. Misaligned label+description is a gradient incoherence.
5. `feedback_hypocrisy_as_universal_shape_feature.md` — related; the engine has multiple shape-keyed lookups; this CC ensures they share source.

## Scope

### Item 1 — Trace the label vs description divergence

Find:
- Where the shape-themed LABELS come from (e.g., "present-tense care" for Cindy, "stewardship" for Daniel). Likely a `(GiftCategory + shape) → label` mapping, NOT just `GiftCategory → label`.
- Where the DESCRIPTIONS come from. Likely a `GiftCategory → description` mapping (just `GIFT_DESCRIPTION[cat]`).
- The composition site that joins them per row.

Diagnose the seam: the LABELS know about shape (steward-themed for Daniel, present-tense-themed for Cindy); the DESCRIPTIONS don't. Both need to come from a coherent source.

### Item 2 — Choose the join strategy

Two options, depending on what the trace reveals:

**Option A — Make labels and descriptions share the SAME `GiftCategory`.**
If today's labels are picked based on shape but descriptions are picked from the category that won `pickGiftCategoryForCard(lens, ...)` (which may be different from the shape-themed category), unify by picking ONE category per gift slot and deriving both label + description from it. The shape-themed label becomes the category's label; the category's description is used.

**Option B — Make descriptions follow labels' shape-keyed logic.**
If labels are correctly shape-themed but descriptions come from a stale GIFT_DESCRIPTION lookup, add a parallel SHAPE_KEYED_DESCRIPTION table (keyed on the same label as the label table), and route descriptions through it. This is more code but preserves the existing GIFT_DESCRIPTION for other surfaces.

**Recommended: Option A unless trace reveals a strong reason to prefer B.** Option A produces structural coherence (one category, one source); Option B introduces a parallel table that could drift over time.

### Item 3 — Apply the chosen fix

Implement Option A or B. The output requirement: for each gift slot in the table, the label and description come from the SAME category and therefore align semantically.

After fix, Cindy's table should read something like (assuming Option A):
| Gift label | Description |
|---|---|
| "relational attunement" | "read the room and tend to what the moment is asking" *(Harmony category — label + description aligned)* |
| "in-the-moment action" | "move when others freeze, learn by engaging the situation" *(Action category)* |
| "advocacy" | "notice what's owed, protect those who can't protect themselves" *(Advocacy category — same as today's third row)* |

Daniel's table:
| Gift label | Description |
|---|---|
| "stewardship" | "preserve what matters across time" *(Stewardship — label + description aligned)* |
| "costly conviction" or "integrity" | "refuse compromises that would betray your own sense of what's right" *(Integrity)* |
| "builder's gift" | "turn ideas into working systems, push past friction toward a result" *(Builder — only if Builder support fires; otherwise next category)* |

The exact labels depend on what's in the LABEL lookup today. Option A makes the existing label-source the source of truth and recomputes descriptions from it.

### Item 4 — Verification across cohort

After fix, re-render cohort fixtures + spot-check:
- Daniel-shape fixture (si-tradition-steward): Gifts table all three rows aligned (label and description from same category)
- Cindy-shape fixture (fi-quiet-resister): Gifts table all three rows aligned
- Jason-shape fixture (paralysis-shame): Gifts table all three rows aligned (Jason's typically Pattern + Discernment + Integrity, should be unchanged if those were already coherent)
- A fixture with mixed support pattern (e.g., restless-reinvention or se-high-extraversion): Gifts table all three rows aligned

### Item 5 — Audit

New `tests/audit/giftTableLabelDescriptionJoin.audit.ts` with assertions:
1. For every cohort fixture, the Gifts table's three rows have label and description that come from the same category source. (Implementation: render each fixture, parse the Gifts table, check that label + description pairs match a known `GiftCategory` entry from a unified source.)
2. Daniel's si-tradition-steward fixture: Gifts table doesn't contain the bug pattern (label "stewardship" paired with description that's actually Integrity's). Match by exact-byte check that's now wrong + verify the fix produces the right pairing.
3. Cindy's fi-quiet-resister fixture: Gifts table doesn't contain "present-tense care" paired with Builder's description.
4. Jason's paralysis-shame fixture: Gifts table unchanged (regression anchor — Jason's pre-CC table was probably already aligned).
5. The composition function source: assert that label-source and description-source share at least one common parameter (typically the `GiftCategory`).

### Item 6 — Regression sweep

After Items 1-5:
- Wave 1 + CC-084/085/086/087 + CC-091 (if landed) audits all pass
- `audit:gift-table-label-description-join` passes 5/5
- twoTier baseline drift: bounded; report magnitude in report-back

## Do NOT

- **Do NOT change `GIFT_NOUN_PHRASE` or `GIFT_DESCRIPTION` tables.** Those are canonical. Only the COMPOSITION (which entries get used) changes.
- **Do NOT change engine math.** No score / Aim / Grip changes.
- **Do NOT touch the gift-category picker logic.** `pickGiftCategoryForCard()` stays as-is. This CC fixes the Gifts TABLE composition specifically.
- **Do NOT remove the shape-themed labels.** They're correctly shape-coded; the fix is to make descriptions follow them.
- **Do NOT regenerate any cache file** under `lib/cache/`.
- **Do NOT regenerate `tests/audit/twoTierBaseline.snapshot.json`.** CC-088 owns baseline refreshes.
- **Do NOT touch any Wave 1 persistence file.**
- **Do NOT call any LLM.** No `*LlmServer.ts` imports. No SDK.
- **Do NOT commit or push.**

## Allowed to Modify

- `lib/identityEngine.ts` — Gifts table composition function + any helper that joins label + description.
- `lib/renderMirror.ts` — only if the join happens at render time (unlikely; the composition probably happens upstream).
- `lib/types.ts` — only if a unified gift-row type needs adding.
- `tests/audit/giftTableLabelDescriptionJoin.audit.ts` (new)
- `package.json` (add `audit:gift-table-label-description-join` script)
- Move prompt to `prompts/completed/` at end

## Out of Scope

- Engine math
- `GIFT_NOUN_PHRASE` / `GIFT_DESCRIPTION` table content
- Picker logic
- Other report sections beyond the Gifts table
- LLM rewrite layer
- Schema changes

## Acceptance Criteria

1. `npx tsc --noEmit` passes
2. `npm run lint` passes
3. `npx tsx tests/audit/giftTableLabelDescriptionJoin.audit.ts` passes 5/5
4. Wave 1 audits still pass
5. CC-084 / CC-085 / CC-086 / CC-087 audits still pass (CC-088 / CC-091 if landed)
6. Cohort regression: every cohort fixture's Gifts table has label/description rows from same category source
7. Daniel-shape regression: "stewardship" label paired with "preserve what matters across time" description (Stewardship category)
8. Cindy-shape regression: caregiver-themed label paired with caregiver-themed description (Harmony or similar)
9. Zero modifications to engine math
10. Zero modifications to `GIFT_NOUN_PHRASE` / `GIFT_DESCRIPTION` content
11. Zero modifications to Wave 1 persistence files
12. Zero LLM calls
13. Zero cache file modifications
14. Zero commits

## Report Back

- The seam diagnosis: where label and description were diverging
- Which option (A or B) was chosen + reasoning
- Per-cohort-fixture before/after Gifts table contents (at least 3 fixtures: Daniel-shape, Cindy-shape, Jason-shape)
- Audit results
- Any deviation from Allowed-to-Modify list

## Notes for executor

- Estimated time: 45–60 min
- Cost: $0
- This bug is structurally subtle but its USER-visible impact is high — the Gifts table is the FIRST table users read. If it's incoherent, the whole report's trust is undermined. Worth getting right.
- Connect this work to `user_jason_project_motivation.md`: the user reads reports for accurate reflection. A misaligned Gifts table is exactly the kind of small misread that compounds into "this instrument doesn't see me."
