# CODEX-062 — Polish-Layer Anchor Extraction Extension (close gap before CC-057c flips polish flag)

*(Filename CODEX-062 per the agent-routing convention 2026-04-29: surgical / mechanical scope; locked-outcome extension to existing extraction logic; one file edit + one canon-doc note. Numbering shares the global CC-### sequence; the prefix is routing metadata.)*

**Type:** Surgical extension to `lib/humanityRendering/contract.ts § buildEngineRenderedReport`. **No new logic beyond the extraction additions. No new prose authored. No engine logic touched.** Adds three classes of engine-emitted locked prose to `lockedAnchors[]` so the polish layer's validation pass catches drift on them.
**Goal:** Close the polish-layer anchor-extraction gap surfaced in CC-060's ship report. Currently the polish layer extracts: CC-052/CC-052b Sentence 2 gift anchors (via `extractSentence2AnchorsFromText`), CC-058 `mirror.uncomfortableButTrue`, CC-054 Peace/Faith disambiguation (via `lockedDisambiguation`). Missing: (1) tension `user_prompt` strings — T-013/T-014/T-015 (allocation tensions with CC-060's locked sharp-question templates) plus any other tension whose `user_prompt` carries locked prose; (2) CC-061's growth-edge / blind-spot Sentence 2 anchors with their distinct `"For your shape, this growth edge expresses as "` and `"For your shape, this blind spot expresses as "` prefixes (`extractSentence2AnchorsFromText` only recognizes the gift-prefix `"For your shape, this expresses as "`). After CODEX-062 ships, every engine-emitted locked-prose surface flows into `lockedAnchors[]` and validation catches polish-layer drift on each.
**Predecessors:** CC-060 (Allocation Gap 3C's Rewrite — surfaced the gap in its ship report). CC-057a (Path C architectural canon — locked the polish-layer-immutability rule for engine-emitted prose). CC-057b (Path C implementation — built `extractAnchors` + the validation pass). CC-052/CC-052b/CC-054/CC-058 (the existing locked-anchor surfaces this CC extends to cover).
**Successor:** None hard-blocked. **Should ship before CC-057c** (which activates the polish feature flag in production). CC-061 (Growth Edge + Blind Spot Specificity) ships after CODEX-062 lands so CC-061's new anchors flow through complete extraction without further work.

---

## Why this CODEX

CC-060's ship-report grep on `lib/humanityRendering/contract.ts` surfaced this:

> *"`extractAnchors` extracts only `tension_fired:T-XXX` derivation markers, not the `user_prompt` strings themselves. Tension prompts do NOT currently flow into `lockedAnchors[]`."*

Concrete consequence: an LLM polish layer could rewrite the new T-013 cost-leaning sharp question, the validation pass would not catch it, and the polished report would ship a polish-layer-rewritten allocation question to the user. CC-057a's canonical guarantee ("the polish layer cannot edit derivation outputs or factual claims") would be silently violated.

Same gap class exists for CC-061's growth-edge and blind-spot Sentence 2 anchors. The existing `extractSentence2AnchorsFromText` reads only the gift-prefix substring `"For your shape, this expresses as "`. CC-061's anchors use distinct prefixes (`"For your shape, this growth edge expresses as "` / `"For your shape, this blind spot expresses as "`) and would not be matched by the existing extractor.

CC-057b's polish flag defaults OFF. So this gap is not yet user-facing. **But CC-057c will flip the flag** — the gap must close before that ships, or the first activation breaks CC-057a's contract silently.

CODEX-062 closes the gap. Three extraction additions + a small parallel extractor. Surgical.

---

## Scope

Files modified:

1. **`lib/humanityRendering/contract.ts`** — three additions:
   - **New `extractGrowthEdgeAnchorsFromText(text)`** parallel to `extractSentence2AnchorsFromText` but matching the CC-061 prefix `"For your shape, this growth edge expresses as "`. Same period-terminator logic.
   - **New `extractBlindSpotAnchorsFromText(text)`** parallel to the above but matching `"For your shape, this blind spot expresses as "`.
   - **Extend `buildEngineRenderedReport`** so that `lockedAnchors[]` additionally includes:
     - Tension `user_prompt` strings (one entry per fired tension that has a non-empty `user_prompt`).
     - Growth-edge anchors extracted from each card's `growthEdge.text` (CC-061's render surface).
     - Blind-spot anchors extracted from each card's `blindSpot.text` (CC-061's render surface).
     - The Synthesis section's prose (`cross.growthPath`, `cross.conflictTranslation`, `cross.mirrorTypesSeed`) — these are engine-composed and were never extracted; the polish layer should leave them alone or compose adjacent prose, not edit them in-place. (If the audit confirms these are already protected via `proseSlots` extraction comparison, the executor can decline this addition and surface in Report Back; otherwise, add them to `lockedAnchors[]`.)

2. **`docs/canon/humanity-rendering-layer.md`** — append a CODEX-062 amendment under § "Implementation status" documenting the now-exhaustive set of locked-anchor surfaces.

3. **`docs/audits/report-calibration-audit-2026-04-29.md`** — add a brief note (not a finding RESOLVED marker; this is closing a contract gap, not a calibration violation) that CODEX-062 closed the polish-layer anchor-extraction gap CC-060's ship report surfaced.

Nothing else. Specifically:

- **No engine logic changes.** Only `lib/humanityRendering/contract.ts` is edited (plus two canon-doc notes).
- **No edits to the locked prose surfaces themselves.** The Sentence 2 / Peace-Faith / uncomfortable-but-true / tension prompts / growth-edge / blind-spot strings are unchanged. CODEX-062 only extends extraction.
- **No edits to `extractDerivations`, `extractStructuralAssertions`, or `extractNumberedFacts`.** The four extraction surfaces have separate concerns; CODEX-062 only touches `lockedAnchors[]` extraction.
- **No edits to `validatePolish`.** The validation pass already iterates `lockedAnchors[]` doing substring checks; the new anchors flow through automatically.
- **No edits to the polish-layer system prompt.** The prompt already names "every locked Sentence 2 anchor string the engine emitted via `lockedAnchors`"; the new anchor classes flow through that mechanism without prompt edits.
- **No edits to CC-057b's adapters, A/B harness, defaults, or feature-flag wiring.**
- **No edits to render components.**
- **No tests.**

---

## The locked content — extraction additions

### 1. Tension `user_prompt` extraction

In `buildEngineRenderedReport`, after the existing tension-fired derivation marker emit (line ~155: `derivations.push(\`tension_fired:${t.tension_id}\`)`), add:

```ts
// CODEX-062 — tension user_prompt strings are engine-composed locked prose
// (T-013/T-014/T-015 sharp questions per CC-060; other tensions per their
// originating CCs). Push each non-empty user_prompt onto lockedAnchors so
// validation catches polish-layer drift.
if (t.user_prompt && t.user_prompt.trim().length > 0) {
  lockedAnchors.push(t.user_prompt);
}
```

This pushes one `user_prompt` per fired tension. The substring-match validation in `validatePolish` then catches drift on any of them.

### 2. Growth-edge and blind-spot anchor extraction (CC-061 prefixes)

Add two parallel extractors near the existing `extractSentence2AnchorsFromText`:

```ts
// CODEX-062 — CC-061's growth-edge Sentence 2 anchor prefix.
export const GROWTH_EDGE_ANCHOR_PREFIX =
  "For your shape, this growth edge expresses as ";

export function extractGrowthEdgeAnchorsFromText(text: string): string[] {
  return extractByPrefix(text, GROWTH_EDGE_ANCHOR_PREFIX);
}

// CODEX-062 — CC-061's blind-spot Sentence 2 anchor prefix.
export const BLIND_SPOT_ANCHOR_PREFIX =
  "For your shape, this blind spot expresses as ";

export function extractBlindSpotAnchorsFromText(text: string): string[] {
  return extractByPrefix(text, BLIND_SPOT_ANCHOR_PREFIX);
}

// Shared helper — same period-terminator logic as the existing
// extractSentence2AnchorsFromText. Preserve that function's exact behavior
// by refactoring it to call extractByPrefix with SENTENCE_2_ANCHOR_PREFIX.
function extractByPrefix(text: string, prefix: string): string[] {
  const out: string[] = [];
  let cursor = 0;
  while (true) {
    const idx = text.indexOf(prefix, cursor);
    if (idx === -1) break;
    const periodIdx = text.indexOf(".", idx);
    if (periodIdx === -1) break;
    out.push(text.substring(idx, periodIdx + 1));
    cursor = periodIdx + 1;
  }
  return out;
}
```

Refactor `extractSentence2AnchorsFromText` to delegate to `extractByPrefix(text, SENTENCE_2_ANCHOR_PREFIX)` so all three extractors share one period-terminator implementation. Behavior preserved exactly; `extractSentence2AnchorsFromText`'s exported signature unchanged for backward compatibility with `lib/humanityRendering/validation.ts` (if it imports the function directly).

### 3. Wire the new extractors into `buildEngineRenderedReport`

Where the existing code extracts gift Sentence 2 anchors per ShapeCard (line ~192):

```ts
if (cardOutput.gift?.text) {
  lockedAnchors.push(...extractSentence2AnchorsFromText(cardOutput.gift.text));
}
```

Add parallel extraction for growth-edge and blind-spot prose. The exact field names depend on the ShapeCard output shape; based on the existing pattern, the additions are:

```ts
if (cardOutput.growthEdge?.text) {
  lockedAnchors.push(
    ...extractGrowthEdgeAnchorsFromText(cardOutput.growthEdge.text)
  );
}
if (cardOutput.blindSpot?.text) {
  lockedAnchors.push(
    ...extractBlindSpotAnchorsFromText(cardOutput.blindSpot.text)
  );
}
```

Verify the field names against `lib/types.ts § ShapeCardOutput` (or wherever `gift` / `growthEdge` / `blindSpot` are typed) before wiring. If the field names differ, use the actual repo names; the extraction pattern stays the same.

### 4. Top-3 Gifts paragraph extraction (verify, possibly extend)

The existing code at line ~198 calls `extractSentence2AnchorsFromText(g.paragraph)` for each Top-3 Gifts entry. CC-061's growth-edge / blind-spot anchors don't render in the Top-3 Gifts paragraphs (those are gift-only); no change needed here. **Verify by inspection** that Top-3 paragraphs only contain the gift Sentence 2 anchor; if they also include growth/blind anchors, extend symmetrically.

### 5. Synthesis prose protection (audit decision)

The Synthesis section (`cross.growthPath`, `cross.conflictTranslation`, `cross.mirrorTypesSeed`) is engine-composed prose. The polish layer is allowed to add adjacent texture but should not edit these in-place. The audit decision is whether they live in `proseSlots` (where the validation pass compares them via the `Object.values(b.proseSlots).join("\n")` substring check at line ~362) or in `lockedAnchors[]` (where they're checked via direct substring match).

**If the existing `buildEngineRenderedReport` already pushes these into `proseSlots`** (e.g., `proseSlots["cross.growthPath"] = constitution.cross_card.growthPath`), they're already protected — no change needed.

**If they're not in `proseSlots`**, push them into `lockedAnchors[]` so validation catches drift:

```ts
if (constitution.cross_card?.growthPath) {
  lockedAnchors.push(constitution.cross_card.growthPath);
}
if (constitution.cross_card?.conflictTranslation) {
  lockedAnchors.push(constitution.cross_card.conflictTranslation);
}
if (constitution.cross_card?.mirrorTypesSeed) {
  lockedAnchors.push(constitution.cross_card.mirrorTypesSeed);
}
```

Verify in `buildEngineRenderedReport` first; pick the right path. Document the decision in Report Back.

---

## Audit checklist (read-only verification)

Before firing the extension, the executor should confirm the existing extraction state by walking `buildEngineRenderedReport` and `extractAnchors` and noting which of these surfaces are currently covered:

| # | Surface | CC of origin | Currently in `lockedAnchors[]`? |
|---|---|---|---|
| 1 | Gift Sentence 2 anchors (per-card `cardOutput.gift.text` + Top-3 Gifts paragraphs) | CC-052/CC-052b | Yes — via `extractSentence2AnchorsFromText` |
| 2 | Mirror `uncomfortableButTrue` sentence | CC-058 | Yes — explicit push at ~line 209 |
| 3 | Compass `peace_register_prose` | CC-054 | Via `lockedDisambiguation` (separate array) — confirm `validatePolish` checks both arrays or merge into `lockedAnchors[]` |
| 4 | Compass `faith_register_prose` | CC-054 | Same as above |
| 5 | Tension `user_prompt` strings (T-013/T-014/T-015 + others) | CC-016 / CC-060 | **No — gap to close** |
| 6 | CC-061 growth-edge Sentence 2 anchors | CC-061 (active/, unshipped) | **No — gap to close** |
| 7 | CC-061 blind-spot Sentence 2 anchors | CC-061 (active/, unshipped) | **No — gap to close** |
| 8 | Synthesis (cross.growthPath / cross.conflictTranslation / cross.mirrorTypesSeed) | CC-011/CC-022b | Verify; either via `proseSlots` or add to `lockedAnchors[]` |
| 9 | Aux-pair register `product_safe_sentence` (per CC-038-prose) | CC-038-prose | Verify whether this string lands in `proseSlots` or `lockedAnchors[]`; may already be covered by `proseSlots` |
| 10 | Resource Balance prose (`loveMap.resourceBalance.prose`) | CC-044 | Verify; likely in `proseSlots` already |
| 11 | Work Map / Love Map / OCEAN prose paragraphs | CC-037 / CC-042 / CC-044 | Verify; likely in `proseSlots` already |

The audit determines which gaps actually exist. CODEX-062 closes the confirmed gaps (rows 5, 6, 7 minimum; rows 3, 4, 8 if they're not already covered through `lockedDisambiguation` / `proseSlots`).

---

## Acceptance

- `npx tsc --noEmit` clean.
- `npm run lint` clean.
- `npm run build` exits 0.
- `extractGrowthEdgeAnchorsFromText` and `extractBlindSpotAnchorsFromText` exist and are exported.
- `extractSentence2AnchorsFromText`'s behavior is preserved (refactored to delegate to `extractByPrefix` if that's the chosen consolidation; otherwise unchanged).
- `buildEngineRenderedReport` pushes tension `user_prompt` strings onto `lockedAnchors[]` for every fired tension that has a non-empty prompt.
- `buildEngineRenderedReport` pushes growth-edge anchors (extracted via the new helper) onto `lockedAnchors[]` for every ShapeCard with non-empty `growthEdge.text`.
- `buildEngineRenderedReport` pushes blind-spot anchors onto `lockedAnchors[]` similarly.
- Synthesis prose protection is in place — either via existing `proseSlots` (verified by inspection) or via new `lockedAnchors[]` pushes.
- Audit checklist (rows 1-11) walked and decisions documented in Report Back.
- A test against Jason0429 (or a fixture engine report) shows: `lockedAnchors[]` contains the sample tension prompt(s) that fire, sample growth-edge / blind-spot anchors per ShapeCard, and the existing CC-052/CC-054/CC-058 anchors. Length increased over pre-CODEX-062 baseline.
- Synthetic polish round-trip test: a malformed polish output that edits a tension `user_prompt` triggers validation failure (`failedCheck: "anchor"`); same for malformed edits to growth-edge / blind-spot Sentence 2 anchors.

---

## Out of scope

- **Editing any locked prose surface** (Sentence 2 anchors, tension prompts, peace/faith disambiguation, uncomfortable-but-true, growth/blind anchors, synthesis paragraphs). Pure extraction extension; no content authored.
- **Editing the polish-layer system prompt.** The prompt already references `lockedAnchors` as the load-bearing protective rail; new anchors flow through that mechanism without prompt edits.
- **Editing `validatePolish`.** The substring-check pass already iterates `lockedAnchors[]`; no validation-pass edits required for the new anchors.
- **Editing `extractDerivations`, `extractStructuralAssertions`, or `extractNumberedFacts`.** Those serve different polish-layer concerns; CODEX-062 only touches `lockedAnchors[]` extraction.
- **Editing the polish-layer adapters, A/B harness, defaults, or feature-flag wiring.**
- **Closing the `lockedDisambiguation` vs `lockedAnchors[]` separation** if Peace/Faith disambiguation lives in its own array rather than the main one. If they're separately checked in `validatePolish` already, leave the architecture as-is. If not, decision deferred to a follow-on CC.
- **Refactoring `buildEngineRenderedReport`'s overall structure.** Pure additive; no restructuring.
- **Touching `lib/identityEngine.ts`, `lib/loveMap.ts`, `lib/workMap.ts`, etc.**
- **Touching CC-061 (active/, unshipped).** CC-061's anchors flow through CODEX-062's extension automatically once both ship.
- **MVP product-vision work.**
- **Adding tests.** No tests on this surface; not adding any here. (A future CC may add automated regression tests against a fixture panel; not now.)

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

Codex equivalent acceptable. **Filed CODEX- per the routing convention because the scope is surgical / mechanical with locked outcome (extension to existing extraction logic). Either executor will land it cleanly.**

## Execution Directive

Single pass. **Audit first** (read-only walk through `buildEngineRenderedReport` + `extractAnchors` to confirm which gaps actually exist), then **extend** (push the missing surfaces onto `lockedAnchors[]`). Document audit decisions in Report Back. **Move prompt to `prompts/completed/` when done.**

## Bash Commands Authorized

- `grep -n "extractAnchors\|lockedAnchors\|user_prompt\|extractSentence2\|extractByPrefix\|GROWTH_EDGE_ANCHOR\|BLIND_SPOT_ANCHOR\|proseSlots\|cross.growthPath" lib/humanityRendering/contract.ts`
- `grep -n "tension_fired\|t.user_prompt\|constitution.tensions" lib/humanityRendering/contract.ts`
- `cat lib/humanityRendering/contract.ts`
- `cat lib/humanityRendering/types.ts`
- `cat lib/humanityRendering/validation.ts | grep -E "lockedAnchors|reportsHaveSameAnchors"`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` (smoke; kill before exit)
- `mv prompts/active/CODEX-062-polish-layer-anchor-extraction.md prompts/completed/CODEX-062-polish-layer-anchor-extraction.md`
- `git diff --stat`
- `git diff lib/humanityRendering/contract.ts`

## Read First (Required)

- `AGENTS.md`.
- `docs/canon/humanity-rendering-layer.md` (the locked Path C contract; § Implementation status section).
- `lib/humanityRendering/contract.ts` (full file; the audit happens here).
- `lib/humanityRendering/validation.ts § validatePolish, reportsHaveSameAnchors` — verify the substring-match logic still holds for the new anchors.
- `lib/humanityRendering/types.ts § EngineRenderedReport` — `lockedAnchors[]` field shape.
- `lib/types.ts § Tension, ShapeCardOutput, MirrorOutput, FullSwotOutput, CrossCardSynthesis` — verify field names referenced by the audit checklist match repo state.
- `lib/identityEngine.ts § detectTensions, detectAllocationOverlayTensions` — confirm tension `user_prompt` shape (string field, possibly empty).
- Memory — helpful context only:
  - `feedback_pair_key_casing_canon.md`
  - `feedback_drive_case_vs_bucket_lean.md`

## Allowed to Modify

- `lib/humanityRendering/contract.ts` — additions only (new prefix constants + new extractors + buildEngineRenderedReport extensions). The existing `extractSentence2AnchorsFromText` may be refactored to delegate to a shared `extractByPrefix` helper; signature preserved.
- `docs/canon/humanity-rendering-layer.md` — append CODEX-062 amendment under § Implementation status.
- `docs/audits/report-calibration-audit-2026-04-29.md` — append brief note about the polish-layer extraction gap closed.
- **No other files.** Specifically NOT: `lib/humanityRendering/validation.ts`, `lib/humanityRendering/prompt.ts`, `lib/humanityRendering/index.ts`, `lib/humanityRendering/abHarness.ts`, `lib/humanityRendering/types.ts`, `lib/humanityRendering/providers/*`, `lib/identityEngine.ts`, `lib/types.ts`, any render component.

## Report Back

1. **Audit checklist** — per-row decision for the 11 surfaces in the audit table. For each: "covered already (via X)" or "gap closed (added to lockedAnchors via Y)" or "decision deferred (reason)."
2. **New extractors** — diffs for `extractGrowthEdgeAnchorsFromText`, `extractBlindSpotAnchorsFromText`, and the optional shared `extractByPrefix` helper. Confirmation that `extractSentence2AnchorsFromText`'s behavior is preserved.
3. **`buildEngineRenderedReport` extensions** — diffs for the three extension blocks (tension `user_prompt`, growth-edge anchors, blind-spot anchors, plus any synthesis-prose decisions).
4. **Polish-layer system prompt unchanged** — confirmation that `lib/humanityRendering/prompt.ts` was not edited.
5. **`validatePolish` unchanged** — confirmation that `lib/humanityRendering/validation.ts` was not edited and the new anchors flow through the existing substring-match pass.
6. **Test against Jason0429 (or fixture)** — `lockedAnchors[]` length and sample contents pre/post fix. Confirmation that the new anchor classes appear in the array.
7. **Synthetic polish drift test** — confirmation that a malformed polish output editing a tension `user_prompt` (or growth-edge / blind-spot anchor) triggers validation failure with `failedCheck: "anchor"`.
8. **Canon doc update** — line range showing the CODEX-062 amendment in `docs/canon/humanity-rendering-layer.md`.
9. **Audit doc update** — line range for the polish-layer-gap-closed note.
10. **Verification results** — tsc, lint, build all clean.
11. **Any deviation** — if a structural surprise (e.g., one of the audit-checklist surfaces has a different field shape than the prompt assumes) required a different approach.
12. **Prompt move-to-completed confirmation.**

---

## Notes for the executing engineer

- **CODEX-062 is purely additive.** Pre-existing extraction behavior preserved exactly. If `git diff` shows any removed or modified pre-existing behavior (beyond the optional `extractByPrefix` refactor), something has gone wrong.
- **The polish-layer system prompt does not need editing.** It already references `lockedAnchors` as the protective-rail mechanism; the new anchors flow through automatically because the validation pass iterates the array.
- **`extractSentence2AnchorsFromText`'s exported signature is preserved** for backward compatibility with `lib/humanityRendering/validation.ts` (which imports it directly per `grep`). The refactor to delegate to `extractByPrefix` is internal.
- **Tension `user_prompt` strings come in two shapes:** (a) bucket-keyed sharp questions with the locked CC-060 templates (T-013/T-014/T-015); (b) other tension types with their own locked prose (T-001 through T-012, T-016+). All of these should be in `lockedAnchors[]` — extraction is type-agnostic. Push every fired tension's `user_prompt` if non-empty.
- **CC-061 ships after CODEX-062.** When CC-061 lands, its growth-edge / blind-spot Sentence 2 anchors flow through `extractGrowthEdgeAnchorsFromText` / `extractBlindSpotAnchorsFromText` automatically. No follow-on contract edit needed.
- **CC-057c is the next polish-layer CC** — locks the production provider after Jason + Clarence's manual A/B pass and decides whether to flip the flag. CODEX-062 must ship before CC-057c so the flag-flip lands against a complete extraction pipeline.
- **The audit-checklist verification step is load-bearing.** Don't blindly add all 11 surfaces — confirm which gaps actually exist by reading the existing extraction logic, then close the confirmed gaps. Some surfaces (CC-038-prose `product_safe_sentence`, Resource Balance prose, etc.) may already be covered via `proseSlots`.
- **Per the routing convention** the prompt file moves to `prompts/completed/` when shipped. Explicit reminder.
- **Pre-CODEX-062 saved sessions** — no migration needed. The polish layer reads `EngineRenderedReport` produced fresh on every render; the extraction pipeline runs against current code on each invocation.
