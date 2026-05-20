# CC-115 — Grip empty-section prose fallback (live regression fix)

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass.
Do not stop for confirmation between steps. On ambiguity, apply the
canon-faithful interpretation, proceed, and flag it. Permission bypass is
on; the discipline below is scope.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.

## Execution Directive

- One pass, no mid-task confirmation prompts.
- User-mode presentation only. Clinician output stays byte-identical
  (do NOT regenerate the baseline). No derivation/cache-key change — this
  is render-time composition from fields the engine already produced.

## The live bug

After CC-111, in **user mode**, the `## Your Grip` section renders **empty**
for any session that has no cached LLM grip paragraph (`gripParagraphLlm`)
AND whose `grip.proseMode` is `"rendered"` (not `"hedged"`). CC-111 gated
the labeled engine-fallback block to clinician-only, and that block was the
only thing user mode had to fall back to — so the heading now stands alone
with nothing under it. This shipped in the CC-110/111/112 commit, so it is
**live in production** (observed on Keith's report: a `## Your Grip` heading
followed by nothing).

Root cause is in `emitGripSection` (`lib/renderMirror.ts`, ~L223–283). The
body branch ladder:

```
if (llmParagraph) { ...warm blockquote... }            // both modes
else if (grip.proseMode === "hedged") { ...prose... }   // both modes
else if (renderMode === "clinician") { ...labeled fallback... }  // CC-111
// (user mode + rendered + no LLM  ->  NOTHING)
```

## Read First (Required)

- `lib/renderMirror.ts` — `emitGripSection` in full (~L174–283): the branch
  ladder above, the available engine fields (`grip.surfaceGrip`,
  `pattern.underlyingQuestion` / `underlyingQuestion`,
  `grip.distortedStrategy?.text`, `grip.healthyGift`,
  `formatHealthyGiftFallback`, `PRIMAL_FALLBACK_COST`), and the existing
  hedged-prose sentence (the model for tone/voice).
- `docs/canon/result-writing-canon.md` — the CC-112 "interpretation over
  recitation" principle (prose, no labeled `Field: value` rows, vary
  cadence). The new fallback must comply.
- `tests/audit/twoTierRenderSurfaceCleanup*.ts` + baseline — clinician must
  stay byte-identical (baseline NOT regenerated).

## Task

Add a **user-mode** branch so the rendered-fallback case (no LLM paragraph,
`proseMode !== "hedged"`) emits a short prose grip paragraph instead of
nothing. Compose it from the same engine fields the clinician labeled
fallback uses — `surfaceGrip`, `underlyingQuestion`, the distorted-strategy
text, and the healthy-gift — woven into 1–2 second-person sentences with
**no labels** and varied cadence (per CC-112 canon). Clinician keeps its
labeled fallback exactly as today.

Suggested shape (compose tastefully; do not emit `Field:` labels):
> Under pressure the surface clue is {surfaceGrip, lowercased}; underneath
> it runs a quieter question — *{underlyingQuestion}* {distorted-strategy
> sentence}. At its steadier, the same question becomes {healthy gift}.

Implementation: change the final `else if (renderMode === "clinician")` so
clinician still gets the labeled block and user mode gets the composed
prose (e.g. add an `else { …prose… }`, or branch inside). Leave the warm
blockquote and hedged-prose branches untouched.

## Allowed to Modify (exhaustive)

- `lib/renderMirror.ts` (only `emitGripSection`).

Nothing else. No baseline snapshot, no LLM prompt, no `gripTaxonomyLlm.ts`
(reflowing the *cached* warm narrative's labeled format is a separate CC),
no other section.

## Out of Scope

- Reflowing the `gripTaxonomyLlm.ts` "rendered" four-line labeled output
  into prose (separate CC; that touches the LLM prompt + cache key).
- The `hedged` branch (already prose).
- Clinician output (must stay byte-identical).
- Movement metrics, Disposition, anything outside `emitGripSection`.

## Bash Commands Authorized

- `npx tsc --noEmit`, `npm run lint`
- the two-tier audit
- `grep` / `sed` / `rg` read-only verification
- a one-off render in both modes for a no-LLM-paragraph fixture to confirm
  the section is no longer empty (don't commit it)

## Acceptance Criteria

1. `npx tsc --noEmit` clean; `npm run lint` clean (pre-existing warnings ok).
2. **Clinician byte-identical** for all cohort fixtures
   (`twoTierRenderSurfaceCleanup` passes; baseline NOT regenerated).
3. For a fixture with **no** `gripParagraphLlm` and `proseMode === "rendered"`,
   user-mode `## Your Grip` now has a prose paragraph under it (not empty).
   Prove with before/after.
4. The user-mode fallback contains **no** labeled `Field: value` lines
   (no `Surface Grip:`, `Grip Pattern:`, `Underlying Question:`,
   `Distorted Strategy:`, `Healthy Gift:`, `Sub-register:`, `Confidence:`).
5. Sessions WITH a cached `gripParagraphLlm` are unchanged (warm blockquote
   still renders; the new branch doesn't fire).
6. No file outside the Allowed-to-Modify list edited.

## Report Back

- The branch change + the composed prose template.
- Before/after `## Your Grip` for a no-LLM fixture, both modes (user now has
  prose, clinician unchanged labeled block).
- Confirmation clinician baseline is byte-identical (how verified).
- Confirmation a cached-paragraph session still renders the warm blockquote.
- Any ambiguity decision.
