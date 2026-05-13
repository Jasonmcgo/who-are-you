# CODEX-078 — Openness Flavor Tie-Break (Architectural Wins)

**Scope frame:** Surgical fix to the Openness subdimension flavor selector in `lib/oceanDashboard.ts`. CC-077's report §13 documented that Jason's session — the canonical architectural-led user — gets `flavor === 'mixed'` because intellectual and architectural both saturate at 100. The selector returns "mixed" when the top-2 are within 15 points (gap=0 here), so the new architectural three-sentence chain CC-077 wired in does NOT fire for the user it was designed for. The user-facing dashboard reads *"Your openness reads broadly — multiple registers active, no single dominant flavor"* — exactly the generic register Clarence flagged as wrong.

**The fix:** when intellectual and architectural are tied or near-tied at the top of the subdimension intensities, architectural wins. Architectural is the integration register — disciplined imagination resolving into structure. When a user has both intellectual curiosity AND architectural drive at high or saturating levels, architectural-led is the more useful read; "mixed" misses the synthesis.

**Per `feedback_codex_vs_cc_prompt_naming` memory:** mechanical/surgical scope. CODEX, not CC. Single source file plus audit fixture/assertion update.

---

## Launch Directive

Run with `claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Execution Directive

Single pass. The tie-break rule is narrow — only when architectural is in the top-tier-by-intensity group does it win the tie. When some other subdimension is the clear #1, the existing logic stands. Don't generalize to other subdimensions; this CODEX is specifically the intellectual-vs-architectural synthesis case.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run audit:ocean`
- `npm run audit:goal-soul-give` (regression check)
- `git status`, `git diff`
- `cat`, `grep`

## Read First (Required)

1. `lib/oceanDashboard.ts` — full file. Find the openness flavor selector function (likely named `selectOpennessFlavor` or similar). Note the current threshold constant (`OPENNESS_FLAVOR_GAP_THRESHOLD = 15` per CC-077 report) and the tie-break behavior that returns `'mixed'`.
2. `lib/types.ts` — `OpennessFlavor` union (`'intellectual_led' | 'aesthetic_led' | 'novelty_led' | 'architectural_led' | 'mixed'`). No type changes here.
3. `tests/audit/oceanDashboard.audit.ts` — find the per-fixture expected-flavor map. Jason's fixture currently expects `'mixed'`; CODEX-078 changes it to `'architectural_led'`.
4. `tests/fixtures/ocean/07-jason-real-session.json` — for the sidecar comment / band documentation. May need a one-line update noting the post-CODEX-078 expected flavor.
5. `prompts/completed/CC-077-…md` (when moved) — esp §13 Open Question 1, which is the canonical statement of this fix's design intent.
6. `docs/ocean-disposition-spec.md` §3.5 — for the architectural-led flavor sentence canon (verify the spec's flavor logic doesn't conflict with the tie-break rule).

## Allowed to Modify

These files only.

1. **`lib/oceanDashboard.ts`** — modify the openness flavor selector to add the architectural-tie-break rule. Specifically: when computing the flavor, if architectural is within the gap threshold of the top intensity (or tied), AND architectural is itself in the high band (≥ 80), return `'architectural_led'`. Otherwise existing logic. Document the rule with a comment citing CODEX-078.

2. **`tests/audit/oceanDashboard.audit.ts`** — update Jason fixture's `expectedFlavor` (or equivalent assertion) from `'mixed'` to `'architectural_led'`. Add a new assertion: when `intensities.architectural ≥ 80` AND `intensities.architectural >= max(other subdim intensities) - 15`, the flavor is `'architectural_led'`. Verify the existing 6 designed fixtures' flavors don't shift unexpectedly.

3. **`tests/fixtures/ocean/07-jason-real-session.json`** — sidecar comment block update (if present): note that flavor is now `'architectural_led'` post-CODEX-078. Answer set unchanged.

## Out of Scope (Do Not)

1. **Do NOT touch `lib/ocean.ts`** — the intensity math is correct; only the dashboard's flavor selector logic changes.
2. **Do NOT modify `lib/types.ts`** — `OpennessFlavor` union is unchanged.
3. **Do NOT add new subdimensions or new flavors.** Architectural-led already exists; this CODEX makes it fire correctly.
4. **Do NOT change the gap threshold constant `OPENNESS_FLAVOR_GAP_THRESHOLD = 15`** for other tie cases. The architectural-tie-break is additive — applies only when architectural is in the tied group AND ≥ 80.
5. **Do NOT extend the tie-break rule to other subdimensions.** Specifically: do NOT add "if intellectual ≥ 80, intellectual wins" or similar for other subdimensions. The architectural-specific rule is justified by spec §3.4 framing of architectural as the *integration register* (disciplined imagination resolving into structure); other subdimensions don't have the same synthesis claim.
6. **Do NOT modify the architectural-led prose template.** CC-077 already authored the canonical three-sentence chain; CODEX-078 just makes it fire for the intended users.
7. **Do NOT modify `docs/ocean-disposition-spec.md` or `docs/goal-soul-give-spec.md`.** Spec sync for the new tie-break rule is a follow-on CODEX (or fold into CODEX-079 spec drift sync).
8. **Do NOT modify the prose-quality assertions added in CC-077.** The `architectural-o-chain-present` assertion is gated on `flavor === 'architectural_led'`; once Jason's flavor is `'architectural_led'`, the assertion fires correctly without any change.
9. **Do NOT install new dependencies.**
10. **Do NOT modify `app/components/InnerConstitutionPage.tsx` or `lib/renderMirror.ts`.** The flavor change propagates through the existing render path without surface-level changes.

## Acceptance Criteria

### Selector logic

1. The openness flavor selector in `lib/oceanDashboard.ts` adds an architectural-tie-break rule. The rule fires when:
   - `intensities.architectural ≥ 80` (high band), AND
   - `intensities.architectural >= max(intellectual, aesthetic, novelty) - 15` (within gap threshold of the top, or strictly above)
2. When the rule fires, the flavor is `'architectural_led'` regardless of whether intellectual or another subdimension is technically higher. This overrides the default "mixed" return.
3. When the rule does NOT fire (architectural < 80, or another subdim is more than 15 points above architectural), existing flavor-selection logic stands unchanged.
4. The change is documented inline with a comment block citing CODEX-078 and the design rationale (architectural is the integration register).

### Jason fixture (canonical user)

5. Jason's fixture (`tests/fixtures/ocean/07-jason-real-session.json`) now resolves to `flavor === 'architectural_led'`. Verified by audit.
6. Jason's rendered O paragraph contains both *"structured and conceptual"* AND *"openness under discipline"* (the CC-077 three-sentence chain) — the substring assertions CC-077 added now actually fire on Jason's data. Verified by audit.
7. Jason's rendered O paragraph does NOT contain *"broadly — multiple registers active, no single dominant flavor"* (the generic mixed-flavor sentence). Verified by audit.

### Designed-fixture regression

8. The 6 designed fixtures' flavors do not shift unexpectedly:
   - `01-architectural-openness`: should land `'architectural_led'` (architectural saturating at 100 in this fixture per CC-077 report; if intellectual or aesthetic outpaces architectural by more than 15 points, the rule doesn't fire — verify whether 01 needs flavor adjustment too).
   - `02-high-conscientiousness`: typically architectural-leaning per CC-077 report (architectural=63 was the strongest subdim). Whether this lands `'architectural_led'` or stays as the existing flavor depends on the post-CODEX-078 logic; document either way.
   - `03-low-extraversion-high-soul`: pre-CODEX flavor was `'aesthetic_led'`. Architectural=31 is below the 80 threshold, so the rule doesn't fire. Flavor stays `'aesthetic_led'`. Verified.
   - `04-high-agreeableness-loyalty`: pre-CODEX flavor was `'mixed'`. Architectural=31 is below the 80 threshold, so the rule doesn't fire. Flavor stays `'mixed'`. Verified.
   - `05-low-emotional-reactivity-proxy`: pre-CODEX flavor was `'architectural_led'` (architectural=98 per CC-072). Already correct — rule firing here is consistent with prior expected behavior.
   - `06-thin-signal-under-detected`: pre-CODEX flavor was `'mixed'`. Architectural=31 below threshold, rule doesn't fire. Flavor stays `'mixed'`. Verified.

### Build and audit

9. `npx tsc --noEmit` exits 0.
10. `npm run lint` exits 0.
11. `npm run audit:ocean` exits 0 — the existing CC-077 prose-quality assertions (`architectural-o-chain-present`, `architectural-o-no-mixed-fallback`) now fire on Jason's fixture without any change to the assertions themselves.
12. `npm run audit:goal-soul-give` exits 0 (regression — Goal/Soul unaffected).
13. Distribution-cap assertions from CC-075 still hold (no >2 traits ≥95 per fixture; no trait saturating in >50% of fixtures).
14. `git status --short` shows ONLY `M lib/oceanDashboard.ts`, `M tests/audit/oceanDashboard.audit.ts`, and (if updated) `?? tests/fixtures/ocean/07-jason-real-session.json` (sidecar block only — answer array unchanged).
15. `data/questions.ts` unchanged (40 question_ids).

## Report Back

1. **Summary** — what changed in 3–5 sentences.
2. **Selector logic diff** — paste the BEFORE and AFTER code for the openness flavor selector. Verify the architectural-tie-break is narrow (only fires when architectural ≥ 80 AND within gap threshold of top).
3. **Jason fixture verification** — confirm `flavor === 'architectural_led'` and that the rendered O paragraph now contains the architectural three-sentence chain (paste the verbatim rendered paragraph).
4. **Designed-fixture flavor audit** — for each of the 6 designed fixtures, report the pre-CODEX-078 and post-CODEX-078 flavor. Flag any unexpected shifts.
5. **Audit pass/fail breakdown** — confirm `architectural-o-chain-present` and `architectural-o-no-mixed-fallback` fire on Jason's fixture post-fix.
6. **Out-of-scope verification** — `git status --short`.
7. **Spec ↔ code drift report** — note that spec §3.5 should canonize the tie-break rule for a future spec sync (architectural is the integration register; ties at high intensity favor architectural).
8. **Open questions** — anything that surfaced during implementation.

---

## Method note

**The architectural-tie-break is asymmetric and intentional.** Architectural is the only subdimension that captures *integration* — disciplined imagination resolving into structure. When a user has both architectural drive and another subdimension (intellectual curiosity, aesthetic sensitivity) at saturating levels, the architectural register is what tells the user something they don't already know about themselves. "You're high on multiple Openness registers" is a less useful read than "Your imagination wants architecture." The asymmetry is the design choice; CODEX-078 implements it without generalizing to other subdimensions.

**Why ≥ 80 specifically.** The high band threshold from spec §2.1 is 80. The tie-break rule fires only when architectural is solidly in the high band — it doesn't flip a moderate-architectural-with-high-aesthetic user into architectural-led. Architectural has to genuinely saturate before it wins ties; below 80 the existing logic correctly returns whatever subdimension is actually leading.

**Why the 15-point gap specifically.** Same threshold as the existing `OPENNESS_FLAVOR_GAP_THRESHOLD`. Reusing the existing constant keeps the architecture coherent — ties are defined consistently across the selector. The architectural rule is "when there's a tie at the top AND architectural is in the tied group AND architectural ≥ 80, architectural wins."

**Surface area is one constant + one if-branch.** This is a small, defensible, narrowly-scoped fix. Don't expand it.
