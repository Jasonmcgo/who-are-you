# CODEX-081 — Architectural-Led O Paragraph: Remove Duplicate Closer

**Origin:** Jason's CODEX-078 verification paste (post-merge inspection of his rendered report) showed:

> *"...This is openness under discipline — creativity that wants architecture. The imagination register is alive and active."*

The architectural-led three-sentence chain ends correctly at *"creativity that wants architecture"* — but the leftover sentence *"The imagination register is alive and active"* appears redundantly after. The chain already names the imagination register in its second sentence (*"The imagination register is alive, but it tends to look for form: frameworks, models, songs..."*). The composer is currently appending a generic closer after the architectural chain instead of skipping it.

**Scope frame:** Mechanical fix to `lib/oceanDashboard.ts:composeOceanProse` (or wherever the O paragraph is assembled) to skip the generic "imagination register is alive" closer when the flavor is `'architectural_led'`. The chain is self-contained; the appended closer is doubling content.

**Why CODEX, not CC:** No new architecture, no editorial register decision (the architectural chain is locked canon from CC-077). One conditional branch in the composer.

**Why this matters before tomorrow:** Clarence takes the assessment tomorrow. His report will likely fire architectural-led too (he co-designed the architectural register). The duplicate sentence reads as engine sloppiness — small thing that erodes trust in a register-conscious instrument.

---

## Launch Directive

Run with `claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Execution Directive

Single pass. Find the O paragraph composition logic in `lib/oceanDashboard.ts`. Identify the line(s) that append the generic "imagination register is alive and active" sentence (or close paraphrase) after the flavor-specific lead. Add a conditional that skips that append when `flavor === 'architectural_led'`. Don't restructure; minimum surface area.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run audit:ocean`
- `npm run audit:goal-soul-give` (regression)
- `git status`, `git diff`
- `cat`, `grep`

## Read First (Required)

1. `lib/oceanDashboard.ts` — full file. Find the function that composes the O paragraph. Likely `composeOceanProse` or a helper. Locate (a) the architectural-led three-sentence chain CC-077 added, (b) the generic "imagination register is alive and active" closer that's currently appending after.
2. `lib/ocean.ts` (CC-077) — for confirmation of the `OpennessFlavor` union and the architectural-led branch.
3. `tests/audit/oceanDashboard.audit.ts` — current `architectural-o-chain-present` and `architectural-o-no-mixed-fallback` assertions. CODEX-081 may add a new assertion to catch this duplicate-content regression.
4. Jason's CODEX-078 verification paste (in conversation log) — the canonical bug evidence.

## Allowed to Modify

This file primarily:

1. **`lib/oceanDashboard.ts`** — modify the O paragraph composer to NOT append the generic "imagination register is alive and active" closer when `flavor === 'architectural_led'`. Add an inline comment citing CODEX-081 and the rationale.

Optionally:

2. **`tests/audit/oceanDashboard.audit.ts`** — add an assertion that the architectural-led O paragraph does NOT contain a substring like "imagination register is alive and active" duplicated, OR that the architectural-led paragraph does not contain that closer phrase at all (since the chain itself already covers the imagination-register claim in its second sentence). One additional assertion; can be inline with the existing `architectural-o-chain-present` block.

## Out of Scope (Do Not)

1. **Do NOT modify the architectural-led three-sentence chain itself.** The chain is locked CC-077 canon ("structured and conceptual" → "frameworks, models, songs..." → "openness under discipline").
2. **Do NOT modify the other flavor branches (intellectual_led, aesthetic_led, novelty_led, mixed).** Their generic closers may still be appropriate; CODEX-081 only fixes architectural_led.
3. **Do NOT modify `lib/ocean.ts`.** The flavor selector and intensity math are unchanged.
4. **Do NOT modify the O paragraph cross-reference logic** (the sentence that ties Openness to Goal/Soul). CODEX-081 only fixes the leftover generic closer.
5. **Do NOT change the `OpennessFlavor` union or any type.**
6. **Do NOT add new dependencies.**
7. **Do NOT modify spec memos.** This drift item is included in the eventual CODEX-082 / spec sync; CODEX-081 only fixes the implementation.
8. **Do NOT modify `tests/fixtures/ocean/*.json`.** Existing fixtures should pass without fixture changes.
9. **Do NOT modify `lib/renderMirror.ts`, `app/components/InnerConstitutionPage.tsx`, or any render-path file beyond `lib/oceanDashboard.ts`.**
10. **Do NOT widen the fix to other flavor branches** even if similar duplication exists. Track those as separate drift items if found, but don't fix in this CODEX.

## Acceptance Criteria

1. When `flavor === 'architectural_led'`, the rendered O paragraph contains the architectural three-sentence chain ("structured and conceptual" + "frameworks, models, songs..." + "openness under discipline") AND does NOT contain a trailing "The imagination register is alive and active" (or close paraphrase) sentence appended after the chain.
2. When flavor is anything else (`intellectual_led`, `aesthetic_led`, `novelty_led`, or `mixed`), the existing prose composition is unchanged. Verified by audit on the relevant fixtures.
3. The architectural three-sentence chain itself is unchanged — same wording as CC-077 shipped.
4. `architectural-o-chain-present` audit assertion (existing) continues to pass: paragraph contains both "structured and conceptual" and "openness under discipline".
5. `architectural-o-no-mixed-fallback` audit assertion (existing) continues to pass: paragraph does not contain "broadly — multiple registers active, no single dominant flavor".
6. New audit assertion (recommended): when flavor is `architectural_led`, the paragraph does NOT contain "The imagination register is alive and active" as a sentence (or contains it at most ONCE — the chain's sentence 2 is similar; the assertion should distinguish the chain's wording from the duplicate closer).
7. `npx tsc --noEmit` exits 0.
8. `npm run lint` exits 0.
9. `npm run audit:ocean` exits 0.
10. `npm run audit:goal-soul-give` exits 0 (regression — Movement narrative unchanged).
11. `git status --short` shows ONLY `M lib/oceanDashboard.ts` (and optionally `M tests/audit/oceanDashboard.audit.ts` if the new assertion was added).
12. `data/questions.ts` unchanged (40 question_ids).

### Visual verification

13. Re-render the architectural-led fixture (`01-architectural-openness.json` or similar) — the rendered O paragraph reads cleanly: "...openness under discipline — creativity that wants architecture." (sentence terminator). No leftover "imagination register is alive and active" appended.

## Report Back

1. **Summary** — what was changed in 2–3 sentences.
2. **Diff** — the BEFORE and AFTER of the O paragraph composer's relevant lines.
3. **Verbatim rendered paragraph** for at least one architectural-led fixture, post-fix. Confirm the chain ends cleanly without the duplicate closer.
4. **Other-flavor regression check** — confirm intellectual_led, aesthetic_led, novelty_led, and mixed flavor paragraphs are unchanged. Quote one example each.
5. **Audit pass/fail breakdown** — confirm existing assertions still pass; new assertion (if added) fires correctly.
6. **Out-of-scope verification** — `git status --short`.
7. **Other duplications observed** — if you spot similar leftover-closer issues in other flavor branches while reading, document them but do NOT fix in this CODEX. Bookmarked for a future small CODEX.

---

## Method note

**The architectural three-sentence chain is self-contained.** It opens with the flavor claim (structured/conceptual), elaborates with the imagination-register clause (sentence 2), and closes with the synthesis (openness under discipline → architecture). Appending "imagination register is alive and active" after sentence 3 doubles content sentence 2 already covers, in less specific language. Removing the redundant closer makes the paragraph land cleanly.

**Surface area is one conditional branch.** The composer likely has a pattern like:

```typescript
const flavorSentence = FLAVOR_TEMPLATES[flavor];
const closer = "The imagination register is alive and active.";
return `${narrative}. ${flavorSentence} ${closer}`;
```

The fix:

```typescript
const closer = flavor === 'architectural_led' ? '' : "The imagination register is alive and active.";
return `${narrative}. ${flavorSentence}${closer ? ' ' + closer : ''}`;
```

Or equivalent. Don't refactor the composer; just gate the closer.

**Tomorrow matters.** Clarence's report will likely fire architectural-led; he'll see the leftover sentence if CODEX-081 doesn't land first. CODEX-080 (production wiring) and CODEX-081 (this) together make Clarence's report read cleanly.
