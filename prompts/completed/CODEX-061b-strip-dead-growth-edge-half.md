# CODEX-061b — Strip Dead growth-edge Half (CC-061 follow-on; Path β workshop fix)

*(Filename CODEX-061b per the agent-routing convention 2026-04-29: surgical / mechanical scope; locked outcome; pure subtraction. The `b` sub-letter ties this to CC-061 as a workshop fix; numbering shares the global CC-### sequence.)*

**Type:** Pure subtractive cleanup. **No new logic. No new prose. No content authored.** Removes the dead-code half of CC-061 — the `getGrowthEdgeSpecificity` selector, its locked prefix constant, its parallel polish-layer extractor, and the `signalCtx` threading on `growthEdgeFor()` call sites. Per CC-025's design, `growthText` is voided on every card path; CC-061's growth-edge Sentence 2 anchors compose into a value that is immediately thrown away. CODEX-061b removes the dead infrastructure.
**Goal:** Close CC-061's dead-code half. Per `feedback_shapecard_field_inversion.md`: ShapeCard.tsx renders `output.blindSpot.text` as the user-visible "Growth Edge" cell and `output.growthEdge.text` (populated by `SHAPE_CARD_PRACTICE_TEXT`) as the user-visible "Practice" cell. CC-061's `getGrowthEdgeSpecificity` composes Sentence 2 anchors that flow into `growthEdgeFor()`'s return value — which is voided per CC-025's `void growthText;` pattern on every card path. Result: 36 of CC-061's 72 locked Sentence 2 anchors never reach users. Path β (per Jason 2026-05-01): strip the dead half. The 36 user-facing anchors in `getBlindSpotSpecificity` (rendered as "Growth Edge" cell) are unchanged and continue to land.
**Predecessors:** CC-025 (4-section ShapeCard architecture; voided `growthText` on every card path). CC-061 (Growth Edge + Blind Spot Specificity; shipped both halves). The 2026-05-01 ship-report deviation flagged the dead-code asymmetry; the 2026-05-01 workshop locked Path β.
**Successor:** None hard-blocked. CC-063 (Trust + Responsibility Conditional Framing) is the next rewrite-track CC; it doesn't depend on CODEX-061b's removal but doesn't conflict either. Both touch `lib/identityEngine.ts` and ship serially.

---

## Why this CODEX

CC-061 shipped 72 locked Sentence 2 anchors across two helpers:
- `getBlindSpotSpecificity` (36 anchors) → composed inside `blindSpotFor()` → written to `output.blindSpot.text` → renders as user-visible **"Growth Edge"** cell. **Live code.**
- `getGrowthEdgeSpecificity` (36 anchors) → composed inside `growthEdgeFor()` → result voided by `void growthText;` on every card path per CC-025. **Dead code.**

The dead half ships as forward-prepared infrastructure (in case a future CC un-voids `growthText`), but the workshop call (Jason 2026-05-01, Path β) is to strip it now. Reasoning:
- 36 anchors of locked content carry maintenance burden (future-CC drift risk; the next executor reading `getGrowthEdgeSpecificity` may assume it's live and try to wire it).
- Forward-prepared optionality is reclaimable later (re-author the 36 anchors, ~1 hour of locked-content work) if CC-025's voiding ever reverses.
- Three saved memories now document the field-shape drift class (FunctionPairKey casing, DriveCase semantics, ShapeCard field inversion). Removing the dead half closes one source of confusion before more CCs accumulate against the misnamed half.

CODEX-061b is purely subtractive. The 36 user-facing `getBlindSpotSpecificity` anchors are unchanged. The polish-layer extraction for blind-spot anchors via `extractBlindSpotAnchorsFromText` is unchanged.

---

## Locked changes

### `lib/identityEngine.ts`

1. **Remove `getGrowthEdgeSpecificity` function entirely.** All 12 GiftCategory branches (~150 lines including the locked Sentence 2 anchors and the priority-ordered conditions). No backward-compat shim.

2. **Remove the `SECOND_SENTENCE_PREFIX_GROWTH_EDGE` constant.** No remaining readers after step 1.

3. **Revert `growthEdgeFor()` to its pre-CC-061 3-arg signature.** Remove the 4th `signalCtx` parameter and any composition logic that consumed it. The function reverts to returning Sentence 1 only (`GROWTH_EDGE_TEXT[cat]` or its variants). Discernment host-card branching and Advocacy variant-pool selection are preserved unchanged.

4. **At the 7 call sites that pass `signalCtx` to `growthEdgeFor()`** (per CC-061 ship-report: lens line 3278, compass line 3727, conviction line 3802, gravity line 3869, trust line 3921, plus weather/fire if also threaded), remove the `signalCtx` argument. Keep `signalCtx` on every `blindSpotFor()` call site — the live-code half stays unchanged.

5. **Verify `void growthText;` patterns remain at all card paths.** Per CC-025 these are the canonical voiding markers; CODEX-061b does not touch them. The code keeps computing `growthText = growthEdgeFor(...)` and voiding it; only the Sentence 2 composition layer is removed.

### `lib/humanityRendering/contract.ts`

6. **Remove `extractGrowthEdgeAnchorsFromText` function** (added by CODEX-062; unused once `getGrowthEdgeSpecificity` is gone).

7. **Remove `GROWTH_EDGE_ANCHOR_PREFIX` constant.**

8. **Remove the call to `extractGrowthEdgeAnchorsFromText` inside `buildEngineRenderedReport`** (added by CODEX-062 to walk `cardOutput.growthEdge.text`). The growth-edge field is populated by `SHAPE_CARD_PRACTICE_TEXT` (the user-visible Practice cell) which has its own protection mechanism — out of scope for CODEX-061b.

9. **`extractByPrefix` shared helper stays.** Used by `extractSentence2AnchorsFromText` (gift) and `extractBlindSpotAnchorsFromText` (live blind-spot anchors). Only the growth-edge usage is removed.

10. **`BLIND_SPOT_ANCHOR_PREFIX` constant stays.** Live code; supports the user-facing "Growth Edge" cell anchors.

11. **`extractBlindSpotAnchorsFromText` stays.** Live code.

### `docs/canon/result-writing-canon.md`

12. **Update CC-061 amendment under § Rule 3.** Note the CODEX-061b workshop fix: the CC-061 implementation shipped 72 anchors; 36 user-facing (blind-spot half, rendering as "Growth Edge" cell); 36 dead per CC-025's voiding. CODEX-061b strips the dead half. Path β per Jason 2026-05-01. Net Rule 3 coverage post-fix: 12 user-facing GROWTH_EDGE_TEXT entries closed via the blind-spot composition pattern; 12 GiftCategory blind-spot entries closed.

### `docs/audits/report-calibration-audit-2026-04-29.md`

13. **Append CODEX-061b note under the existing Rule 3 § GROWTH_EDGE_TEXT RESOLVED-CC-061 banner.** Brief note that CC-061's growth-edge half was stripped as dead code per CC-025's voiding; the user-facing "Growth Edge" cell is closed via the blind-spot composition (live half).

Nothing else. Specifically:

- **No edits to `getBlindSpotSpecificity`, `BLIND_SPOT_TEXT_VARIANTS`, `BLIND_SPOT_ANCHOR_PREFIX`, `extractBlindSpotAnchorsFromText`.** Live half preserved.
- **No edits to `GROWTH_EDGE_TEXT` Record, `GROWTH_EDGE_TEXT_VARIANTS`, or `DISCERNMENT_GROWTH_PRIMARY/ALTERNATE`.** These supply Sentence 1 to `growthEdgeFor()`'s return value (still computed, still voided, still preserved as architectural records for the un-voiding option).
- **No edits to `void growthText;` patterns at card derivation paths.** Per CC-025 design.
- **No edits to `SHAPE_CARD_PRACTICE_TEXT` Record** or its consumption. The Practice cell's prose is a separate Rule 3 cluster (8 entries; out of scope for both CC-061 and CODEX-061b).
- **No edits to `extractSentence2AnchorsFromText`** or its `SENTENCE_2_ANCHOR_PREFIX`.
- **No edits to `validatePolish`, polish-layer system prompt, adapters, A/B harness, or any other polish-layer file.**
- **No edits to engine logic outside the named removals.**
- **No edits to render components.**
- **No tests.**

---

## Acceptance

- `npx tsc --noEmit` clean.
- `npm run lint` clean.
- `npm run build` exits 0.
- `grep -n "getGrowthEdgeSpecificity\|SECOND_SENTENCE_PREFIX_GROWTH_EDGE\|GROWTH_EDGE_ANCHOR_PREFIX\|extractGrowthEdgeAnchorsFromText" lib/ app/` returns zero hits.
- `grep -n "getBlindSpotSpecificity\|BLIND_SPOT_ANCHOR_PREFIX\|extractBlindSpotAnchorsFromText" lib/` returns hits in the expected live-code locations only.
- `growthEdgeFor` signature reverts to 3 args (or whatever it was pre-CC-061; verify by reading the CC-061 ship-report's "Active call sites threaded with `signalCtx`" diff).
- All `growthEdgeFor()` call sites no longer pass `signalCtx`. Verify by `grep -n "growthEdgeFor(" lib/identityEngine.ts` showing each call ends at `, context)` or equivalent without the 4th arg.
- All `blindSpotFor()` call sites still pass `signalCtx` (live-half preservation).
- `void growthText;` patterns remain at all card derivation paths (CC-025 design preserved).
- Re-rendered Jason0429 (admin route per CODEX-050) shows the user-facing "Growth Edge" cell rendering the locked Sentence 2 anchor from `getBlindSpotSpecificity` (whichever fires for his Ni-dom + knowledge/truth + NiTe pattern). Practice cell renders `SHAPE_CARD_PRACTICE_TEXT[cardId]` unchanged. No empty cells.
- A test session re-render shows identical user-facing prose pre/post CODEX-061b — the dead half was never visible, so removing it changes no rendered text.
- Markdown export carries the same content pre/post CODEX-061b.
- Polish-layer round-trip (when API keys set) preserves the user-facing anchors via the unchanged `extractBlindSpotAnchorsFromText`. No new polish-layer drift introduced.
- `lockedAnchors[]` length pre/post CODEX-061b is identical for any given session (the dead growth-edge half was never extracted to lockedAnchors in the first place because `growthText` was voided before reaching extraction surfaces).

---

## Out of scope

- **Restoring `growthText` rendering.** That would un-void CC-025's design. Different workshop. Not now.
- **Re-authoring the 36 stripped anchors.** Path α (forward-prepared) was rejected. If a future CC un-voids growthText, the anchors are re-authored at that time.
- **Repurposing the architecture for SHAPE_CARD_PRACTICE_TEXT closure.** Path γ — different keying (ShapeCardId vs GiftCategory), different conditions. Different CC.
- **Touching `getBlindSpotSpecificity` or any of its 36 user-facing anchors.** Live half preserved verbatim.
- **Editing `BLIND_SPOT_TEXT_VARIANTS` Record.** Sentence 1 source for the live half.
- **Editing the polish-layer system prompt or validation pass.** No new anchor classes; no extraction-pipeline changes beyond the growth-edge removals.
- **MVP product-vision work.**
- **Adding tests.**

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

Codex equivalent acceptable. **Filed CODEX- per the routing convention because the scope is purely subtractive / mechanical with locked outcome.** Either executor lands it cleanly.

## Execution Directive

Single pass. **Pure subtraction. No content authored. No new logic.** If `git diff` shows any added prose, any new function, any new constant, or any added behavior, something has gone wrong — surface in Report Back. **Move prompt to `prompts/completed/` when done.**

## Bash Commands Authorized

- `grep -n "getGrowthEdgeSpecificity\|SECOND_SENTENCE_PREFIX_GROWTH_EDGE\|GROWTH_EDGE_ANCHOR_PREFIX\|extractGrowthEdgeAnchorsFromText" lib/ app/`
- `grep -n "growthEdgeFor(\|blindSpotFor(" lib/identityEngine.ts`
- `grep -n "void growthText" lib/identityEngine.ts`
- `cat lib/identityEngine.ts | sed -n '2918,3050p'` (the getGrowthEdgeSpecificity range per CC-061 ship-report)
- `cat lib/humanityRendering/contract.ts | grep -E "GROWTH_EDGE|growthEdge"`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` (smoke; kill before exit)
- `mv prompts/active/CODEX-061b-strip-dead-growth-edge-half.md prompts/completed/CODEX-061b-strip-dead-growth-edge-half.md`
- `git diff --stat`
- `git diff lib/identityEngine.ts lib/humanityRendering/contract.ts`

## Read First (Required)

- `AGENTS.md`.
- `prompts/completed/CC-061-growth-edge-blind-spot-specificity.md` (parent CC; the architecture being subtracted on the growth-edge side).
- `lib/identityEngine.ts § getGrowthEdgeSpecificity` (the function being removed) and `growthEdgeFor` (the function being reverted to its 3-arg signature).
- `lib/identityEngine.ts § void growthText` patterns (CC-025 design — preserved unchanged).
- `lib/humanityRendering/contract.ts § extractGrowthEdgeAnchorsFromText, GROWTH_EDGE_ANCHOR_PREFIX` (the helpers being removed).
- `app/components/ShapeCard.tsx:215-220` (the canonical render-mapping that motivates this CODEX — `output.blindSpot.text` is what users read as "Growth Edge").
- Memory:
  - `feedback_shapecard_field_inversion.md` (the full architectural context)

## Allowed to Modify

- `lib/identityEngine.ts` — remove `getGrowthEdgeSpecificity`, `SECOND_SENTENCE_PREFIX_GROWTH_EDGE`; revert `growthEdgeFor` to 3-arg signature; remove `signalCtx` argument from all `growthEdgeFor()` call sites. Keep `void growthText;` patterns. Keep `growthEdgeFor`'s Sentence-1-only return logic.
- `lib/humanityRendering/contract.ts` — remove `extractGrowthEdgeAnchorsFromText`, `GROWTH_EDGE_ANCHOR_PREFIX`, and the call to `extractGrowthEdgeAnchorsFromText` inside `buildEngineRenderedReport`. Keep the shared `extractByPrefix` helper. Keep `BLIND_SPOT_ANCHOR_PREFIX` and `extractBlindSpotAnchorsFromText`.
- `docs/canon/result-writing-canon.md` — CODEX-061b note under § Rule 3 § CC-061 amendment.
- `docs/audits/report-calibration-audit-2026-04-29.md` — CODEX-061b note under the Rule 3 § GROWTH_EDGE_TEXT RESOLVED-CC-061 banner.
- **No other files.** Specifically NOT: `lib/types.ts`, `lib/loveMap.ts`, `lib/workMap.ts`, `lib/drive.ts`, `lib/ocean.ts`, `lib/beliefHeuristics.ts`, `data/questions.ts`, `app/components/*.tsx`, `lib/renderMirror.ts`, `lib/humanityRendering/types.ts`, `lib/humanityRendering/validation.ts`, `lib/humanityRendering/prompt.ts`, `lib/humanityRendering/index.ts`, `lib/humanityRendering/abHarness.ts`, `lib/humanityRendering/providers/*`, any test files.

## Report Back

1. **Diff for `getGrowthEdgeSpecificity` removal** — confirm the function and its constants are gone. Line range removed.
2. **Diff for `growthEdgeFor` signature revert** — show 4-arg → 3-arg revert; confirm Sentence-1-only return logic preserved (Discernment host-card branching, Advocacy variant pool, default `GROWTH_EDGE_TEXT[cat]`).
3. **Diff for the 7 (or however many) call-site updates** — confirm `signalCtx` removed from each `growthEdgeFor()` call; `signalCtx` preserved on all `blindSpotFor()` calls.
4. **Diff for `lib/humanityRendering/contract.ts`** — confirm `extractGrowthEdgeAnchorsFromText`, `GROWTH_EDGE_ANCHOR_PREFIX`, and the corresponding extraction call removed.
5. **`void growthText;` preservation** — `grep -n "void growthText" lib/identityEngine.ts` confirms patterns intact.
6. **Live-half preservation** — `grep -n "getBlindSpotSpecificity\|BLIND_SPOT_ANCHOR_PREFIX\|extractBlindSpotAnchorsFromText" lib/` confirms expected live hits.
7. **Locked content unchanged for live half** — confirmation that `getBlindSpotSpecificity` and `BLIND_SPOT_TEXT_VARIANTS` are byte-identical pre/post.
8. **Verification results** — tsc, lint, build all clean.
9. **Manual sweep deferred to Jason** — explicit verification list:
   - Re-rendered Jason0429 shows user-facing "Growth Edge" cell rendering the locked Sentence 2 anchor from `getBlindSpotSpecificity`. Practice cell renders `SHAPE_CARD_PRACTICE_TEXT` unchanged.
   - No empty cells; no rendering changes vs pre-CODEX-061b.
   - Markdown export unchanged.
10. **Any deviation** — if a structural surprise (e.g., a call site Codex's CC-061 ship-report didn't enumerate also passes `signalCtx`; an internal helper still references the removed function; the `signalCtx` parameter type definition needs touching) required a different scope.
11. **Prompt move-to-completed confirmation.**

---

## Notes for the executing engineer

- **CODEX-061b is purely subtractive.** Pre-existing render output is identical pre/post. Verify this before shipping by spot-checking a known fixture session's "Growth Edge" cell and "Practice" cell render verbatim.
- **The `void growthText;` patterns must remain** — CC-025's design depends on them. Don't simplify by removing the `growthText = growthEdgeFor(...)` line; the void pattern documents the architectural decision and the function is still called for backward-compat-with-old-output-type reasons.
- **`growthEdgeFor` itself stays.** It still returns Sentence 1 (Discernment host-card branching + Advocacy variant pool + `GROWTH_EDGE_TEXT[cat]` default). The only removal is the Sentence 2 composition added by CC-061 plus the `signalCtx` parameter that fed it.
- **The 36 stripped anchors are reclaimable.** If a future CC un-voids `growthText`, re-authoring is ~1 hour of locked-content work. CODEX-061b doesn't preclude that; it just doesn't pre-pay for the option.
- **`extractByPrefix` shared helper stays.** It's still used by `extractSentence2AnchorsFromText` (gift prefix) and `extractBlindSpotAnchorsFromText` (live blind-spot prefix). Don't refactor it away.
- **`SHAPE_CARD_PRACTICE_TEXT` is out of scope.** That's a separate CC-048 audit Rule 3 cluster (8 entries, keyed by ShapeCardId). Future CC handles. CODEX-061b leaves it untouched.
- **Polish-layer extraction of the user-visible "Practice" cell** (`output.growthEdge.text` populated by `SHAPE_CARD_PRACTICE_TEXT`) is a separate concern — covered by holistic prose-slot extraction or by future per-card-Practice extractors. Not in CODEX-061b's scope.
- **Per the routing convention** the prompt file moves to `prompts/completed/` when shipped. Explicit reminder.
- **Pre-CODEX-061b saved sessions** re-render against current engine code on admin load. No migration needed. Render is byte-identical pre/post since the dead half was never user-visible.
