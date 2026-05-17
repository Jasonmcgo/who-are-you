# CC-090 — Hypocrisy Panel as First-Class Report Section

## Objective

Today the engine surfaces stated-vs-lived gaps (Sacred Words vs Sacred Spending, Value vs Institutional Trust Gap, Words and Energy) as **Open Tensions** at the bottom of the report — labeled tentatively with question marks (*"Does this feel accurate?"*). Per the canon you filed today (`feedback_hypocrisy_as_universal_shape_feature.md`):

> *"Hypocrisy (we humans all have it) is another highlight / blind spot we should be illustrating."*

These gaps aren't "open questions" — they're **central features of the shape**, as load-bearing as the gifts and growth edges. They should sit alongside the Gifts table, not buried as deferred footnotes. Same prominence, same shape-as-feature framing.

This CC:
1. Promotes the gap detections out of Open Tensions into a dedicated "Blind Spots" or "Shape Edges" section near the top of the report
2. Extends gap-detection to more Compass values per canon (Honor / Loyalty / Stability / Freedom / Peace / Compassion / Mercy / Truth)
3. Preserves the non-accusatory "this is your shape, not a verdict" framing the current prose already uses

Per the gradient canon: **hypocrisy detection is gradient (alignment ↔ small gap ↔ meaningful gap ↔ large gap)**. Don't binarize; surface what level the gap reads at.

## Sequencing

- Parallel-safe with CC-088, CC-089, CC-091, CC-094.
- Independent of CC-091 / CC-092 / CC-093 (different code paths).
- Should fire after CC-088 (baseline refresh) so the cohort sweep produces clean before/after comparison.

## Launch Directive

Run with `claude --dangerously-skip-permissions`.

## Execution Directive

Single pass with three concrete subtasks: detection extension, section reorganization, prose refinement. If extending detection to 8 new Compass values produces >100 lines of new code, pause and report — the extension should be data-driven (table of `(compass value, cross-question, alignment threshold)`) rather than 8 separate switch branches.

## Bash Commands Authorized

- `grep`, `ls`, `cat`, `find`, `wc`
- `npx tsc --noEmit`
- `npm run lint`
- `npx tsx tests/audit/<name>.audit.ts`

Do not run `npm install`, `git commit`, `git push`, `drizzle-kit push`, or any LLM build script.

## Read First (Required)

1. `feedback_hypocrisy_as_universal_shape_feature.md` — the canon memory. Includes the table of Compass values × cross-question signals to detect each gap.
2. `feedback_gradient_calibration_canon.md` — gradient framing. Hypocrisy detection should produce gradient output (alignment / small gap / meaningful gap / large gap), not binary.
3. `lib/identityEngine.ts` — find where the existing "Sacred Words vs Sacred Spending" + "Value vs Institutional Trust Gap" tensions are generated. Likely in a tension-detection function around T-013/T-014/T-015 (or whatever the current ID convention is — grep `Sacred Words`).
4. `lib/renderMirror.ts` — find the Open Tensions section render site. Also find where the Gifts table is rendered (for parity placement reference).
5. `data/questions.ts` — confirm Q-S1/Q-S2 (Compass), Q-S3-close/wider (money flow), Q-X3 (institutional trust), Q-E1 (energy direction), Q-3C2 (protection priority).
6. The existing prose templates for Sacred Words vs Sacred Spending — the framing *"the gap between what you name and what your week actually pays for is part of your shape, not a verdict against it"* is canonical. Preserve it.

## Scope

### Item 1 — Extend gap-detection to all Compass values

Currently detection fires for Faith / Knowledge / Justice / Compassion (per memory). Extend to also cover **Honor / Loyalty / Stability / Freedom / Peace / Mercy / Truth** per the table in `feedback_hypocrisy_as_universal_shape_feature.md`:

| Compass Value | Cross-question detection logic |
|---|---|
| Honor | Compass Honor top + Q-3C2 "reputation/standing" at bottom of priorities → honor-named-but-not-protected |
| Loyalty | Compass Loyalty top + Q-S3-close (yourself wins money flow over family/friends?) + Q-X4-relational (partner/family NOT first?) |
| Stability | Compass Stability top + Q-X1 "Overwhelming or stretched" → stability-named-but-not-lived |
| Freedom | Compass Freedom top + Q-A2 "maintaining responsibilities" + Q-3C2 "safety/rules" → freedom-named-but-bound |
| Peace | Compass Peace top + Q-O2 "angry/reactive/anxious" → peace-named-but-not-embodied |
| Mercy | Compass Mercy top + Q-V1 "results-speak" + Q-Stakes1 reputation high → mercy-named-but-justice-lived |
| Truth | Compass Truth top + Q-P1 "Don't volunteer/Hide" + Q-P2 "Change/Hide/Don't volunteer" → truth-named-but-not-paid-for |

Implementation should be **data-driven** — a table mapping `(compass_value_id, cross_signals, alignment_threshold)` → gap detection function. Not 7+ separate switch cases.

### Item 2 — Make gap-detection gradient

Each gap output should include a **magnitude grade**, not a binary yes/no:

- **Aligned** — Compass top value AND cross-question signals all converge. No gap surfaced.
- **Small gap** — Compass top value present, cross-question signal slightly off (e.g., Compass Honor top + Reputation #3 in Q-3C2, not bottom). Surface only as a single sentence; don't make it a section.
- **Meaningful gap** — Compass top value clearly contradicted by cross-question (e.g., Compass Faith top + Q-S3-wider Religious giving = bottom-of-list). Surface as a full Blind Spot entry with the canonical "your shape, not a verdict" framing.
- **Large gap** — Compass top + multiple cross-signals all wrong-direction (e.g., Compass Compassion top + Non-Profits not in top trust + Caring-for-people NOT in Q-E1-inward top). Surface as a prominent Blind Spot entry; may warrant a "this gap reads as load-bearing for your shape" framing.

Detection threshold per gap is documented in the memory canon. Apply the gradient grades; render accordingly.

### Item 3 — Reorganize the report layout

Currently structure:
```
... gifts table at top ...
... cards (Lens, Compass, ...) ...
... Open Tensions section (with hypocrisy detections) ...
... Path / Distribution ...
... What this is good for ...
```

New structure:
```
... gifts table at top ...
... Blind Spots / Shape Edges section (new — promoted from Open Tensions) ...
... cards (Lens, Compass, ...) ...
... Open Tensions section (residual tensions — multi-direction answer findings, Sacred Values in Conflict, etc.) ...
... Path / Distribution ...
... What this is good for ...
```

The Blind Spots section sits BEFORE the cards, immediately after Gifts. It contains the gradient-graded gap detections. Open Tensions stays but is now reserved for tension-as-finding outputs (per `feedback_tension_as_finding_canon.md`) — dual-direction answers, Sacred Values in Conflict, etc. — not the hypocrisy/alignment detections.

### Item 4 — Preserve canonical framing

The existing Sacred Words vs Sacred Spending prose uses:
> *"the gap between what you name and what your week actually pays for is part of your shape, not a verdict against it"*

This framing is LOAD-BEARING. Every gap entry in the new Blind Spots section must use the same register:
- Non-accusatory
- Frames the gap as feature, not failing
- Invites self-recognition, not defensiveness
- Optional: a one-line practice the user could try ("name one specific person Family would have you give your best energy to this season")

Do NOT use:
- "You should..."
- "Your hypocrisy is..."
- Question-mark suffixes like "Does this feel accurate?" — that was the deferred-Open-Tensions register; the Blind Spots register is assertion-with-care, not interrogation.

### Item 5 — Audit

New `tests/audit/hypocrisyPanel.audit.ts` with assertions:
1. The new Blind Spots section appears in rendered output
2. Gap-detection extends to at least 5 additional Compass values (beyond the existing Faith/Knowledge/Justice/Compassion)
3. Gradient grading produces at least 3 distinct levels across the cohort (some fixtures aligned, some small gap, some meaningful gap)
4. Canonical framing preserved: rendered output contains the load-bearing phrase or its semantic equivalent ("part of your shape, not a verdict")
5. Cohort regression anchor: Daniel's existing "Sacred Words vs Sacred Spending (Faith)" tension fires correctly at "meaningful gap" magnitude (Faith named top + Q-S3-wider Religious giving low)

### Item 6 — Regression sweep

After Items 1–5:
- Wave 1 audits + CC-084/085/086/087 audits + CC-088 baselines (if landed) all still pass
- `audit:hypocrisy-panel` passes 5/5
- twoTier baseline drift: bounded; report magnitude in report-back

## Do NOT

- **Do NOT change any engine math** — score computation, Risk Form classifier, Aim/Grip math. This CC is detection + render-layer only.
- **Do NOT change `GIFT_NOUN_PHRASE` / `GIFT_DESCRIPTION` tables.**
- **Do NOT remove the Open Tensions section.** Keep it for genuine tension-as-finding outputs (dual-direction answers, Sacred Values in Conflict). The hypocrisy detections promote OUT of it, not the whole section away.
- **Do NOT pathologize any gap.** Maintain the "shape, not failing" framing across every new Blind Spot entry.
- **Do NOT add gap-detection that requires new questions.** Use existing question signals only. If a Compass value's gap detection requires a question that doesn't exist (e.g., Mercy's signal might be thin), surface that finding in the report-back and skip that value.
- **Do NOT add prose-rewrite layer dependencies.** Engine prose only; no LLM calls.
- **Do NOT touch any Wave 1 persistence file.**
- **Do NOT regenerate `tests/audit/twoTierBaseline.snapshot.json` mid-CC.** CC-088 owns baseline refreshes.
- **Do NOT call any LLM.** No `*LlmServer.ts` imports. No SDK.
- **Do NOT commit or push.**

## Allowed to Modify

- `lib/identityEngine.ts` — extend gap detection (data-driven table). Do NOT touch engine math.
- `lib/renderMirror.ts` — new Blind Spots section composition + layout reorganization.
- `lib/synthesis1Finish.ts` — only if the new section's prose is composed there (per CC-084 precedent that prose can live in non-obvious places).
- `lib/types.ts` — only if a new type for the gap-detection table is needed.
- `tests/audit/hypocrisyPanel.audit.ts` (new)
- `package.json` (add `audit:hypocrisy-panel` script)
- Move prompt to `prompts/completed/` at end

## Out of Scope

- Engine math
- Risk Form prose
- Path card / Compass card / Movement section
- New question additions
- LLM rewrite layer
- Schema changes

## Acceptance Criteria

1. `npx tsc --noEmit` passes
2. `npm run lint` passes
3. `npx tsx tests/audit/hypocrisyPanel.audit.ts` passes 5/5
4. Wave 1 audits still pass
5. CC-084 / CC-085 / CC-086 / CC-087 audits still pass
6. The new Blind Spots section appears in rendered output, positioned after Gifts and before the cards
7. Gap-detection extends to at least 5 additional Compass values
8. Gradient grading produces 3+ levels across the cohort
9. Canonical "shape not verdict" framing preserved
10. Daniel's Faith-vs-Religious-giving gap (existing) still fires correctly post-CC
11. Zero modifications to engine math
12. Zero modifications to Wave 1 persistence files
13. Zero LLM calls
14. Zero cache file modifications
15. Zero commits

## Report Back

- Per-Compass-value detection coverage: which Compass values have gap-detection logic post-CC, with the cross-questions they use
- Gradient grading distribution across cohort fixtures (how many "aligned", "small gap", "meaningful gap", "large gap")
- Daniel + Cindy + Jason regression anchors: confirm existing Faith-gap detections still fire correctly
- Any Compass value whose gap-detection couldn't be implemented due to missing question signal — flag for question-bank refinement
- Any deviation from Allowed-to-Modify list
- Audit results
- twoTier baseline drift magnitude (if CC-088 already landed, this should be smaller; if not, larger)

## Notes for executor

- Estimated time: 60–90 min
- Cost: $0
- The gradient grading is the part that most easily over-scopes. Keep it simple: 3-4 magnitude levels, deterministic thresholds per gap. Don't invent a continuous-score system.
- This CC connects to the user's personal motivation memory (`user_jason_project_motivation.md`) — accurate reflection means making the user's shape visible, including the blind spots. Don't smooth them away; show them with care.
