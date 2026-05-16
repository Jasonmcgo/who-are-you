# CC-085 — Grip Pattern Card Render for Mixed-Bucket Sessions

## Objective

Today the 4-layer Grip Pattern card (Bucket / Underlying Question / Distorted Strategy / Healthy Gift) renders only for sessions whose surface grips align cleanly to a single bucket. Daniel (control / money / plan / money-security / economic → all map to **Security**, high confidence) and Cindy (reputation / being-needed / approval / social-stress / money-survival → all map to **Belonging**, high confidence) get the card. JasonDMcG with cleanly-bucketed grips also gets it.

But **Kevin / Michele / Ashley / Harry** get nothing — their surface grips span 2-3 buckets and the existing classifier's confidence drops below the render threshold, so no card appears at all.

This CC closes that gap: when surface grips don't cleanly align, the classifier surfaces a **best-guess bucket** with **medium confidence**, disambiguating using Compass + driver + lived Primal per `feedback_grip_pattern_shape_aware_routing.md` (canon 2026-05-11). The card renders for every cohort fixture instead of silently disappearing for half of them.

## Sequencing

- **Can fire in PARALLEL with CC-087** (admin demographic edit — no file overlap).
- **Sequential after CC-084** if CC-084 hasn't landed yet (both touch `lib/renderMirror.ts`).
- **Sequential before CC-086** (CC-086 touches more of `lib/renderMirror.ts`).

## Launch Directive

Run with `claude --dangerously-skip-permissions`.

## Execution Directive

Single pass. If the canon for the disambiguator chain (Compass → driver → Primal) doesn't deterministically resolve to a single bucket in some cohort case, pause and report. Don't invent new disambiguation rules.

## Bash Commands Authorized

- `grep`, `ls`, `cat`, `find`, `wc`
- `npx tsc --noEmit`
- `npm run lint`
- `npx tsx tests/audit/<name>.audit.ts`

Do NOT run `npm install`, `git commit`, `git push`, `drizzle-kit push`, or any build script that calls the LLM.

## Read First (Required)

1. `lib/gripTaxonomy.ts` — **the actual render-gate lives here**. Function `deriveProseMode` (~line 210) maps `(confidence, primary)` → `"rendered" | "hedged" | "omitted"`. Today: high/medium-high → rendered, medium → hedged, low/null → omitted. Confidence is assigned earlier in the same file (look ~line 280-325 for the `confidence = "X"` branches; calibration.hedgeMarker downgrades).
2. `lib/gripPattern.ts` — the classifier. Confirm current bucket-assignment logic + the GripPatternReading interface (line 86 area). The `confidence` field is `"high" | "medium" | "low"` — note that's a DIFFERENT confidence scale from gripTaxonomy.ts's `"high" | "medium-high" | "medium" | "low"`. Two scales coexist; the disambiguator chain may need to coordinate across both.
3. `lib/renderMirror.ts` — lines ~170-225 area renders the Grip Pattern card. References `pattern.renderedLabel`, `underlyingQuestion`, `distorted`, `healthy`. Confirm what mode (rendered vs hedged vs omitted) produces what visible output. Kevin/Michele/Ashley/Harry's reports today show ZERO card content — so they're likely in "omitted" mode (low/null), not "hedged". Promoting them to medium might still not produce a visible card if "hedged" mode renders nothing distinct.
4. `lib/handsCard.ts` — may consume Grip Pattern output; verify whether changes here ripple.
5. `feedback_grip_pattern_shape_aware_routing.md` (memory) — canon for the disambiguator chain.
6. `data/questions.ts` — Q-GRIP1, Q-Stakes1, Q-3C2 mappings (the inputs the bucket router consumes).

**Note from CC-084's experience**: hardcoded engine prose can live in non-obvious files (`lib/synthesis1Finish.ts` rather than `lib/renderMirror.ts`). If the Grip Pattern card's prose surface isn't where this CC scope predicts, follow the actual file path and flag the deviation in the report-back.

## Scope

### Item 1 — Add medium-confidence disambiguation in the classifier

In `lib/gripPattern.ts`, when surface grips don't cleanly align to one bucket (existing classifier returns low confidence or unmapped), apply the disambiguator chain:

1. **Compass top value** — Family → Belonging, Faith → (Security if life-stage stable; Worth if seeking), Truth → Worth, Honor → Security, etc. Canonical mapping per `feedback_grip_pattern_shape_aware_routing.md`.
2. **Driver function** — Ni → Worth (often Control/Mastery sub-register), Ne → Worth (Recognition or Control), Si → Security, Se → Belonging or Control, Ti → Control/Mastery, Te → Security/Control, Fi → Worth, Fe → Belonging.
3. **Lived Primal** (gripTaxonomy.primary.cluster if present) — overrides driver-based when present.

The mapping table is documented in the canon memory; if missing or ambiguous, the executor adds the rule and documents the rationale inline.

The classifier returns confidence "medium" (not "high") when this fallback fires. The render path treats medium-confidence as renderable (current code presumably treats below-high as suppressed; this CC widens that gate).

### Item 2 — Render the card at medium confidence

In `lib/renderMirror.ts`, locate the Grip Pattern card render gate. The current gate (likely something like `if (gripPattern.confidence === "high")`) widens to `if (gripPattern.confidence === "high" || gripPattern.confidence === "medium")`. The card text already accommodates a confidence level field; verify it renders sensibly with "medium" before declaring done.

### Item 3 — Regression sweep

After Items 1+2, re-render the cohort fixtures. Verify:
- Daniel / Cindy / JasonDMcG still produce high-confidence reads with their existing buckets (Security / Belonging / Worth-Control respectively)
- Kevin / Michele / Ashley / Harry now produce medium-confidence reads with bucket assignments per the canon
- No fixture renders zero (every cohort fixture has SOME Grip Pattern card)

### Item 4 — Audit

New `tests/audit/gripPatternRenderForMixedBuckets.audit.ts` with assertions:
1. Every cohort fixture under `tests/fixtures/cohort/` produces a non-null `gripPattern` field on the InnerConstitution
2. Daniel's fixture still reads bucket = "Security" (regression anchor)
3. Cindy's fixture still reads bucket = "Belonging" (regression anchor)
4. At least 3 fixtures route to medium-confidence (proves the fallback fires)
5. The render output for medium-confidence cases is non-empty (the card renders, not just classified silently)

## Do NOT

- **Do NOT change any Grip score math.** Composed Grip, defensive Grip, the §13 amplifier — all untouched.
- **Do NOT change the bucket taxonomy.** Same 7 Foster-derived buckets (Safety / Security / Belonging / Worth / Recognition / Control / Purpose). This CC only changes when/how a fallback bucket is assigned.
- **Do NOT touch the Hands card.** That's CC-086.
- **Do NOT touch any Wave 1 persistence file.**
- **Do NOT regenerate any cache file.**
- **Do NOT regenerate `tests/audit/twoTierBaseline.snapshot.json`.** If twoTier fails after this CC because newly-rendering cards change the cohort fixtures' bytes, that's expected. Report; don't refresh.
- **Do NOT call any LLM.** No `*LlmServer.ts` imports. No `@anthropic-ai/sdk`.
- **Do NOT commit or push.**

## Allowed to Modify

- `lib/gripPattern.ts`
- `lib/gripTaxonomy.ts` (the actual render-gate function `deriveProseMode` lives here; disambiguator chain may need to land here too)
- `lib/renderMirror.ts` (Grip Pattern card render site only — leave Hands/Lens/Path/etc. alone)
- `lib/synthesis1Finish.ts` (only if the card's prose template lives here per CC-084's pattern — verify before editing)
- `lib/handsCard.ts` (only if Grip Pattern output cascades into Hands card composition and needs adjusting)
- `lib/types.ts` (only if the confidence union needs widening)
- `tests/audit/gripPatternRenderForMixedBuckets.audit.ts` (new)
- `package.json` (add `audit:grip-pattern-render-for-mixed-buckets` script)
- Move prompt to `prompts/completed/` at end

## Out of Scope

- Grip score calibration
- Bucket taxonomy changes
- Hands card / Lens card / other prose
- Schema changes
- LLM rewrites of Grip Pattern text (engine prose stays as-is)

## Acceptance Criteria

1. `npx tsc --noEmit` passes
2. `npm run lint` passes
3. `npx tsx tests/audit/gripPatternRenderForMixedBuckets.audit.ts` passes 5/5
4. Wave 1 audits still pass
5. CC-084 audit still passes (if CC-084 has landed)
6. Demographics audit still passes
7. Every cohort fixture produces a Grip Pattern card in its rendered output
8. Daniel + Cindy fixtures unchanged on bucket assignment
9. At least 3 fixtures route to medium-confidence bucket assignment
10. Zero modifications to Wave 1 persistence files
11. Zero LLM calls
12. Zero cache file modifications
13. Zero commits

## Report Back

- The disambiguator chain implementation: file + function + line range
- Per-fixture bucket assignments (especially the 4 previously-missing: Kevin / Michele / Ashley / Harry)
- Confidence levels per fixture (high vs medium)
- Audit results
- Regression sweep results

## Notes for executor

- Estimated time: 45-60 min
- Cost: $0
- The render-gate widening is the smaller half; the disambiguator chain is the load-bearing logic. Read the canon memory carefully before coding the mapping table.
