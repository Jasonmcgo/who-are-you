# CC-089 — Hedged Prose for Low-Confidence Lens Reads

## Objective

When the engine's `lens_stack.confidence` field is `"low"`, the renderer currently asserts the Driver / Support read with the same authoritative voice it uses for high-confidence reads. The engine's uncertainty is correctly captured at the data layer and silently discarded at the render layer.

**The Ashley case from the 2026-05-16 calibration:** Engine derived `Se-Fi (ESFP, confidence: "low")` for Ashley while her real cognitive identity is `Ni-Fe (INFJ)`. The `confidence: "low"` flag is the engine's honest read — *"I'm not sure about this; the answer pattern doesn't strongly converge on one driver."* The Lens card rendered as if it were sure: *"Your processing pattern leans toward present-tense self, supported by inner compass."* No hedge. No badge. No acknowledgment.

This CC closes that gap. When `confidence === "low"`, the report visibly surfaces the uncertainty so the user can trust the read for what it is — a tentative pattern from the engine, not an authoritative declaration.

Per the gradient canon (`feedback_gradient_calibration_canon.md`): **confidence is a gradient signal; render it as gradient, not binary.**

## Sequencing

- Parallel-safe with CC-088, CC-090, CC-091, CC-094.
- Independent of all other engine CCs (renderer-only change).

## Launch Directive

Run with `claude --dangerously-skip-permissions`.

## Execution Directive

Single pass. Three changes: (1) hedged Driver/Support prose substitution when confidence is low; (2) visible "low-confidence read" badge or meta-line near the Lens card; (3) softened shape-keyed routing decisions when confidence is low (to avoid compounding the misread downstream).

If the codepath that renders the Lens summary doesn't have access to `lens_stack.confidence` (e.g., the data isn't threaded into the renderer), pause and report — that's a wiring issue we'd address separately.

## Bash Commands Authorized

- `grep`, `ls`, `cat`, `find`, `wc`
- `npx tsc --noEmit`
- `npm run lint`
- `npx tsx tests/audit/<name>.audit.ts`

Do not run `npm install`, `git commit`, `git push`, `drizzle-kit push`, or any LLM build script.

## Read First (Required)

1. `lib/types.ts` — confirm `LensStack` has the `confidence: "high" | "low"` field (already verified — line ~255-262).
2. `lib/renderMirror.ts` — find the Driver/Support summary composition site. Probably composes a string like `"Your processing pattern leans toward ${FUNCTION_VOICE[dominant]}, supported by ${FUNCTION_VOICE[auxiliary]}."` — grep for that or similar.
3. `lib/identityEngine.ts` — find where `LensStack.confidence` is computed. Confirm it's actually populated (not always "high"). Look for `confidence = "low"` branches; understand what causes the "low" flag.
4. `feedback_low_confidence_should_hedge_prose.md` — the canon memory for this CC.
5. `feedback_gradient_calibration_canon.md` — the meta-canon. Confidence is gradient; render accordingly.

## Scope

### Item 1 — Hedged Driver/Support summary when confidence is low

In `lib/renderMirror.ts` (or wherever Lens summary is composed), branch on `constitution.lens_stack.confidence`:

**High confidence (existing behavior, unchanged):**
> *"Your processing pattern leans toward [driver], supported by [auxiliary]."*

**Low confidence (new):**
> *"The engine's read of your cognitive pattern is uncertain. The answers point toward [driver] supported by [auxiliary], but the signal isn't strong — trust your own knowledge of yourself if this doesn't fit."*

The exact wording can vary; what's load-bearing:
- Explicit acknowledgment of uncertainty
- Names what the engine read (don't withhold)
- Permission for the user to override based on self-knowledge

### Item 2 — "Low-confidence read" badge or meta-line

Add a visible marker near the Lens card header or beside the Driver field. Something like:
> *"Driver: present-tense self (Se) · engine confidence: low"*

Or a small badge:
> *"⚠ The engine's confidence in this Lens read is low."*

Pick whichever fits the existing report aesthetic. The point is **visibility** — the uncertainty should be readable at a glance, not buried in prose.

### Item 3 — Soften shape-keyed routing decisions when confidence is low

When `lens_stack.confidence === "low"`, downstream routing decisions that key on `stack.dominant` or `stack.auxiliary` should fall back to **neutral templates**, not assert shape-specific reads that would compound the miss.

Concretely:
- `pickGiftCategoryForCard()` should skip the `isRelationalShape()` / `isStewardShape()` reorder when confidence is low — use base preferences as-is.
- `reorderPreferencesForRelationalShape()` and `selectStewardPreferences()` only fire when confidence is high.
- The Hands card archetype routing (in `lib/handsCard.ts`) should fall to `unmappedType` template when confidence is low.
- The Lens card growth-edge driver-keyed anchor should use a more neutral phrasing for low-confidence cases.

This is the principle: **don't assert shape on uncertain shape data.**

### Item 4 — Audit

New `tests/audit/hedgedLowConfidenceLens.audit.ts` with assertions:
1. `LensStack.confidence` field is read by `renderMirrorAsMarkdown` somewhere (grep)
2. Hedged-prose code branch exists (grep for the canonical phrase "engine's read of your cognitive pattern is uncertain" or similar identifying marker)
3. Confidence badge or meta-line appears in rendered output when confidence is low (synthetic fixture with `confidence: "low"` produces a rendered MD containing the badge marker)
4. `pickGiftCategoryForCard` does NOT apply steward/relational reorder when `lens_stack.confidence === "low"` (synthetic fixture test)
5. Existing high-confidence renders are byte-identical to pre-CC behavior (regression anchor: Daniel/Jason fixtures with `confidence: "high"` should produce the same Lens prose they do today)

### Item 5 — Regression sweep

After Items 1–4:
- Run cohort audit sweep; CC-084/CC-085/CC-086/CC-087 + Wave 1 all still pass
- `audit:hedged-low-confidence-lens` passes 5/5
- twoTier baseline drift: high-confidence fixtures byte-identical; low-confidence fixtures (if any in cohort) produce a small bounded drift documented in report-back
- If CC-088 hasn't landed yet, twoTier still fails per its pre-existing state — note but don't refresh

## Do NOT

- **Do NOT modify the engine's confidence computation.** Whatever produces `confidence: "high" | "low"` in `lib/identityEngine.ts` stays as-is. This CC only renders the existing signal correctly.
- **Do NOT change `GIFT_NOUN_PHRASE` or `GIFT_DESCRIPTION` tables.**
- **Do NOT change Path / Compass / Movement / Risk Form prose.** Out of scope.
- **Do NOT regenerate any cache file** under `lib/cache/`.
- **Do NOT regenerate `tests/audit/twoTierBaseline.snapshot.json`.** CC-088 owns baseline refreshes.
- **Do NOT touch any Wave 1 persistence file.**
- **Do NOT call any LLM.** No `*LlmServer.ts` imports. No SDK.
- **Do NOT commit or push.**
- **Do NOT make confidence a three-state field.** It's currently binary (`"high" | "low"`); leave it that way. This CC is render-layer only.

## Allowed to Modify

- `lib/renderMirror.ts` (Lens card composition + Driver/Support summary line; downstream routing-skip logic where it lives)
- `lib/identityEngine.ts` ONLY for the picker skip-when-low-confidence branch (`pickGiftCategoryForCard` and `reorderPreferencesForRelationalShape` short-circuit on `confidence === "low"`). Do NOT touch the confidence computation itself.
- `lib/handsCard.ts` (Hands archetype routing — fall to unmappedType when confidence is low)
- `tests/audit/hedgedLowConfidenceLens.audit.ts` (new)
- `package.json` (add `audit:hedged-low-confidence-lens` script)
- Move prompt to `prompts/completed/` at end

## Out of Scope

- Confidence computation logic
- New confidence categories (stays binary)
- Other Lens card sections (Strength / Growth Edge / Practice — those use Gifts routing; if confidence affects them, that's the picker-skip branch from Item 3, not new content here)
- Engine math
- Schema changes

## Acceptance Criteria

1. `npx tsc --noEmit` passes
2. `npm run lint` passes
3. `npx tsx tests/audit/hedgedLowConfidenceLens.audit.ts` passes 5/5
4. Wave 1 audits still pass
5. CC-084 / CC-085 / CC-086 / CC-087 audits still pass
6. Cohort fixtures with `confidence: "high"` produce byte-identical Lens prose (regression anchor)
7. Synthetic low-confidence fixture (or actual cohort fixture if any has `confidence: "low"`) produces visibly hedged Lens prose
8. `pickGiftCategoryForCard` skips shape-reorder when confidence is low (audit-verified)
9. Zero modifications to Wave 1 persistence files
10. Zero LLM calls
11. Zero cache file modifications
12. Zero commits

## Report Back

- Which fixtures (if any) currently produce `confidence: "low"` in the cohort. Likely none — Ashley's case lives in prod, not in cohort fixtures. If zero, the synthetic fixture in Item 4 is the verification surface.
- Exact phrasing chosen for the hedged Driver/Support summary
- Badge/meta-line placement + content
- Per-card routing skip behavior: which cards now route to neutral templates when confidence is low
- Audit results
- Any deviation from the Allowed-to-Modify list (per CC-084 precedent, flag if a related file needed touching)

## Notes for executor

- Estimated time: 45–60 min
- Cost: $0
- This CC's load-bearing test is whether Ashley's actual prod report (after deploy lands) reads visibly hedged. The synthetic fixture in Item 4 is the local verification surface; the prod verification happens after push.
- Confidence is currently binary, but the canon (`feedback_gradient_calibration_canon.md`) hints that a future CC could widen to "high / medium / low" for finer gradient. Not this CC. Keep binary; ship the visible-uncertainty UX now.
