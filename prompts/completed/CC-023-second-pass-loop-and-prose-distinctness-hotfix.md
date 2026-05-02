# CC-023 — Second-Pass Loop + Prose Distinctness Hotfix

## Launch Directive

You are executing CC-023. This is a hotfix CC addressing three bugs surfaced in real-user testing of CC-022a + CC-022b:

1. **Q-T loop after Keystone** — when a user skips one or more Q-T (or any pre-boundary) questions, completes the Allocation block, runs through the second-pass at the post-Allocation / pre-Keystone boundary (CC-022a), completes Keystone, the second-pass fires AGAIN at end-of-flow with the same questions queued. The user sees Q-T1-T8 twice. Confirmed in Michele's session (2026-04-26).

2. **Top 3 Gifts duplicate** — the engine's gift-synthesis logic doesn't enforce distinctness across the three picks. Items 1 and 3 in Michele's session both rendered as *"A pattern-discernment gift"* with similar descriptions. Two independent reads (Michele's session + ChatGPT's rewrite analysis) flagged the same defect.

3. **Compass and Gravity sharing Trap + Next move prose** — when both cards' gift categories align with the same template pool (e.g., both pull "Advocacy" prose because of the user's structural reads), the Trap and Next move text renders identically across the two cards. Confirmed in Michele's session: both cards show *"Moral suspicion. The instinct to defend what's owed may begin to read disagreement itself as moral failure"* and *"The growth move is leaving room for ignorance, complexity, and partial responsibility before reaching for the moral frame."*

All three are existing-code bug fixes. No new features, no new types, no new question definitions, no canon changes. Tightly scoped.

Sequenced after CC-022b ships. Independent of CC-022d (design drop), CC-022e (SVG integration), and the Engine Prose Tuning Round 2 work captured in `prompts/queued/engine-prose-tuning-round-2-notes.md` (which is a separate CC for prose softening, not bug fixes).

## Bash Authorized

Yes. Use the shell for `tsc`, `eslint`, dev-server smoke runs, and any inspection scripts. Do not commit or push.

## Execution Directive

### Item 1 — Fix Q-T loop after Keystone

**File**: `app/page.tsx`.

**Root cause**: `handleSecondPassComplete()` merges the second-pass picks into `answers` but **does NOT clear or filter `skippedQuestionIds`**. After the boundary second-pass resolves the skipped Q-T questions, those IDs remain in the `skippedQuestionIds` array. When the user reaches end-of-flow after Keystone, `advanceFromIndex`'s defensive backstop (`else if (skippedQuestionIds.length > 0)`) re-triggers the second-pass with the same IDs, producing the duplicate-loop UX.

**Fix in `handleSecondPassComplete`**: filter resolved IDs out of `skippedQuestionIds`. Both the `picks` array (questions resolved in single-pick mode) and any IDs that produced `question_double_skipped` MetaSignals during the second-pass should be cleared.

```ts
function handleSecondPassComplete(picks: SinglePickAnswer[]) {
  const merged: Answer[] = [
    ...answers.filter(
      (a) => !picks.some((p) => p.question_id === a.question_id)
    ),
    ...picks,
  ];
  setAnswers(merged);

  // CC-023 — clear IDs that went through second-pass from skippedQuestionIds.
  // Resolved IDs (in picks) AND double-skipped IDs (which produced
  // question_double_skipped MetaSignals during this pass) should both be removed.
  // Any IDs that remain in skippedQuestionIds are post-second-pass skips
  // (e.g., Q-I1 skipped after the boundary pass completed; handled by Q-I1b
  // conditional render, not by another second-pass).
  const idsThroughSecondPass = new Set([
    ...picks.map((p) => p.question_id),
    // Also include IDs that produced a question_double_skipped MetaSignal in
    // this second-pass run. The second-pass component should pass a list of
    // double-skipped IDs through its onComplete callback, OR we can read
    // metaSignals here and filter by recorded_at after secondPassResumeIndex
    // was set. Use whichever surface is cleanest; if the SecondPassPage
    // doesn't currently surface double-skipped IDs, just clear all picks-IDs
    // and let the next defensive backstop catch any genuine post-pass skips.
  ]);
  setSkippedQuestionIds((prev) =>
    prev.filter((id) => !idsThroughSecondPass.has(id))
  );

  // Existing resume logic (unchanged).
  if (secondPassResumeIndex !== null) {
    const resume = secondPassResumeIndex;
    setSecondPassResumeIndex(null);
    setCurrent(resume);
    setPhase("first_pass");
  } else {
    setPhase("identity_context");
  }
}
```

**The cleanest implementation**: if `SecondPassPage` doesn't currently surface double-skipped IDs through its `onComplete` callback, extend the callback signature to include them. If that's a heavier lift, a simpler fallback: clear IDs that match the picks AND clear IDs whose `question_double_skipped` MetaSignal was recorded after the second-pass entered (use `metaSignals.filter((m) => m.type === "question_double_skipped" && m.recorded_at >= secondPassEntryTimestamp)` — would require capturing entry timestamp).

Use your judgment on the cleanest available surface. The behavior we need: after `handleSecondPassComplete` returns, `skippedQuestionIds` contains only IDs that have NOT been through this second-pass (i.e., post-pass skips, which is just Q-I1 in practice).

**Fix the end-of-flow defensive backstop in `advanceFromIndex`**: even with the clear in place, Q-I1 has its own conditional-render handling via Q-I1b (CC-017). Q-I1 should never trigger the second-pass; it should always trigger Q-I1b. Exclude Q-I1 from the backstop's check:

```ts
function advanceFromIndex(idx: number) {
  const nextIdx = idx + 1;
  // CC-022a Item 6 — pre-Keystone boundary trigger (existing behavior; unchanged).
  if (
    nextIdx === Q_I1_INDEX &&
    Q_I1_INDEX !== -1 &&
    skippedQuestionIds.length > 0
  ) {
    setSecondPassResumeIndex(Q_I1_INDEX);
    setPhase("second_pass");
    return;
  }

  if (idx < questions.length - 1) {
    setCurrent(nextIdx);
  } else if (
    // CC-023 — defensive backstop excludes Q-I1 since it has Q-I1b handling.
    skippedQuestionIds.filter((id) => id !== "Q-I1").length > 0
  ) {
    setSecondPassResumeIndex(null);
    setPhase("second_pass");
  } else {
    setPhase("identity_context");
  }
}
```

**Combined effect**: with both fixes, the loop is closed:

- After the boundary second-pass, resolved + double-skipped Q-T IDs are removed from `skippedQuestionIds`.
- If Q-I1 is later skipped, it gets added to `skippedQuestionIds`, but Q-I1b conditional render handles it.
- At end-of-flow, the backstop checks for ANY skipped ID that isn't Q-I1; if none, advance to identity_context (the new save-before-portrait flow). If some genuinely-skipped non-Q-I1 IDs remain (defensive case for any future cascade-skip we haven't anticipated), the backstop still fires.

### Item 2 — Top 3 Gifts dedup

**File**: `lib/identityEngine.ts` (the function that assembles `Top 3 Gifts` for the Mirror).

**Root cause**: the gift-synthesis logic ranks gifts by structural strength but doesn't enforce distinctness across the three picks. When two cards both surface "pattern-discernment" as their top gift category, both make it into the Top 3 — producing the duplicate.

**Fix**: dedupe by gift-category-id when assembling the Top 3 array. If dedup yields fewer than 3, pad from the next-tier gifts.

```ts
// Pseudocode — adapt to actual function shape
const allCandidateGifts = collectGiftsAcrossCards(...);   // existing logic
const seen = new Set<string>();
const topThreeGifts = [];
for (const gift of allCandidateGifts.sortedByStrength) {
  if (seen.has(gift.category_id)) continue;
  seen.add(gift.category_id);
  topThreeGifts.push(gift);
  if (topThreeGifts.length === 3) break;
}
// If fewer than 3 distinct, pad from a fallback list (existing engine behavior
// for thin sessions; preserve whatever the current fallback is).
```

**Locate the actual function** — likely `synthesizeTopGifts(...)` or similar in `lib/identityEngine.ts`. Find the existing logic; add the dedup step before the array is returned.

**Verify against Michele's session**: re-run her session through the engine post-fix; confirm the Top 3 Gifts now contains 3 distinct gifts (e.g., pattern-discernment + advocacy + endurance, in some order, not pattern-discernment twice).

### Item 3 — Compass / Gravity prose distinctness

**File**: `lib/identityEngine.ts` (the per-card output generators for Compass and Gravity).

**Root cause**: the Trap and Next move prose for both Compass and Gravity is keyed off the same gift category (Advocacy / similar). When the user's structural reads route both cards to the same gift category, the per-card prose pools both pull from the same template — producing identical text in two cards.

**Fix**: ensure per-card distinctness even when the gift category overlaps. Two implementation paths:

**Path A — split prose pools per card.** Author distinct Trap and Next move pools for Compass and Gravity, even within the same gift category. The Compass card's "Advocacy" trap pool produces different prose than Gravity's "Advocacy" trap pool.

**Path B — card-id aware lookup.** Existing prose pools stay shared, but the lookup function takes both gift category AND card_id; a small variation function tweaks the prose per card. Lighter touch but produces less differentiated prose.

**Lean Path A.** It's more work upfront but produces actually distinct reads. The cards are different metaphors (Compass = what you protect; Gravity = where responsibility lives) — they should sound different even when the user's underlying gift is similar.

**Locate the actual prose pools** — likely in `lib/identityEngine.ts`'s per-card output generators (`deriveCompassOutput`, `deriveGravityOutput`, or similar names). Find where the Trap and Next move strings are pulled; produce per-card distinct templates for the overlapping gift categories.

**Minimum viable fix**: for the Advocacy gift category (which is the one Michele's session triggered), author distinct Compass-Trap and Gravity-Trap variants. Same for Next move. If other gift categories produce similar Compass+Gravity overlap in real-user testing, those land in a follow-up CC.

**Verify against Michele's session**: re-run her session post-fix; confirm Compass card and Gravity card show different Trap and Next move text.

## Allowed-to-Modify

- `app/page.tsx` — fix `handleSecondPassComplete` to clear resolved IDs from `skippedQuestionIds`; fix `advanceFromIndex`'s end-of-flow backstop to exclude Q-I1.
- `lib/identityEngine.ts` — add dedup step in Top 3 Gifts synthesis; add per-card distinctness to Compass and Gravity Trap + Next move pools (minimum: Advocacy gift category; expand if other overlapping categories surface).
- `app/components/SecondPassPage.tsx` — IF the second-pass component needs to surface double-skipped IDs through its `onComplete` callback to support Item 1's clean implementation. Optional; if the cleaner path is reading `metaSignals` in `handleSecondPassComplete`, this file is not modified.

No other file should be modified.

## Out of Scope — explicit "do not" list

- **Do not** modify any signal definition, MetaSignal type, tension-detection block, or question definition.
- **Do not** modify the second-pass mechanism's UI or flow — only the post-completion bookkeeping in `handleSecondPassComplete`.
- **Do not** modify the boundary trigger logic in `advanceFromIndex` — only the end-of-flow defensive backstop.
- **Do not** modify any tension's `user_prompt` text. T-013 / T-014 / T-015 prose softening is a separate CC (per `prompts/queued/engine-prose-tuning-round-2-notes.md`).
- **Do not** modify the Simple Summary generator, the cross-card pattern catalog, or the Keystone selection citation. Those are CC-022b's surface; they work correctly.
- **Do not** rename "Top 3 Traps" to "Growth Edges" — that's part of the Engine Prose Tuning Round 2 work, not this hotfix.
- **Do not** modify the demographic interpolation, name threading, or `getUserName` / `nameOrYour` helpers.
- **Do not** introduce new gift categories or modify the gift-category taxonomy.
- **Do not** modify the `data/questions.ts` question bank.
- **Do not** modify any canon doc.
- **Do not** modify the SVG integration, design-spec-v2 surfaces, or any of the design-handoff-v2 files.
- **Do not** modify build configuration, AGENTS.md, CLAUDE.md, or any prompt file other than this one.

## Acceptance Criteria

1. **Q-T loop closed** — synthetic test session: skip Q-T1, Q-T3, Q-T5 (or any subset of pre-Keystone questions). Complete Allocation block. Second-pass triggers at the post-Allocation / pre-Keystone boundary (CC-022a behavior preserved). User answers all 3 in second-pass. Test resumes at Q-I1. User completes Keystone (Q-I1, Q-I2, Q-I3). After Q-I3, the user lands at the Identity & Context page (per CC-022a's save-before-portrait flow). The second-pass does NOT fire again.
2. **Q-I1 skip path preserved** — synthetic test session: skip Q-I1 specifically. Confirm Q-I1b conditional render fires (per CC-017). Confirm second-pass does NOT fire for Q-I1. After Q-I1b is answered, test continues normally.
3. **End-of-flow backstop preserved for genuine cases** — synthetic test session that produces a non-Q-I1 skip after the boundary (defensive case; should be impossible via UI but the code path should still work). Backstop fires with the genuine skip; Q-I1 is excluded.
4. **Top 3 Gifts distinct** — re-run Michele's session through the engine post-fix; verify the Top 3 Gifts contains 3 distinct gift categories. Run a synthetic session designed to surface only 2 distinct gift categories — verify the Top 3 falls back gracefully (renders 2 with a sensible third, or renders 2 and acknowledges the thin signal; preserve whatever the current "thin signal" fallback is).
5. **Compass / Gravity prose distinct** — re-run Michele's session post-fix; verify Compass card's Trap and Next move text differs from Gravity card's Trap and Next move text. Both cards still produce coherent prose for their respective metaphors.
6. **No regression in other cards** — Lens, Conviction, Trust, Weather, Fire, Path cards' prose pools unchanged. Verify by running a smoke session and confirming each card's prose matches what it produced pre-CC-023.
7. **Demographic-blind derivation preserved** — for two synthetic sessions with identical answers but different demographics, derived InnerConstitution structures byte-identical (same as CC-022b's invariant).
8. **TSC clean.** `npx tsc --noEmit` exits 0.
9. **Lint clean.** `npm run lint` exits 0.
10. **No file outside the Allowed-to-Modify list is modified.**

## Report Back

1. **Files changed** — file-by-file summary.
2. **Q-T loop fix verification** — paste the Q-T-loop smoke session walkthrough (skip Q-T1/3/5, complete Allocation, second-pass at boundary, resume to Q-I1, Keystone, identity_context). Confirm second-pass fires once, not twice.
3. **Q-I1 skip preservation** — confirm Q-I1 → Q-I1b path still works.
4. **End-of-flow backstop preservation** — confirm the backstop still fires for non-Q-I1 skips that arrive after the boundary.
5. **Top 3 Gifts dedup verification** — paste Michele's actual top-3 gifts post-fix; confirm distinctness.
6. **Compass / Gravity distinctness** — paste Michele's Compass Trap + Next move and Gravity Trap + Next move; confirm they differ.
7. **No regression in other cards** — paste Lens / Conviction / Trust / Weather / Fire / Path prose for Michele's session pre and post; confirm identical.
8. **Demographic-blind derivation** — confirm `JSON.stringify(constitution)` byte-identical for two sessions with identical answers and different demographics.
9. **TSC + lint** — exit codes.
10. **Scope-creep check** — confirm only allowed files modified.
11. **Risks / next-step recommendations** — anything noticed during the work that warrants a follow-up CC.

## Notes for the executing engineer

- **Item 1 is the highest-priority fix.** The Q-T loop is currently in production; every interview Jason runs hits it. Get it right; smoke it carefully.
- **The cleanest path for Item 1** is to filter `skippedQuestionIds` by the IDs that went through second-pass — both resolved (in `picks`) and double-skipped (via the `question_double_skipped` MetaSignal). The pseudocode in the spec shows the filter pattern; the actual mechanism for collecting double-skipped IDs depends on what the SecondPassPage component currently exposes. Use the cleanest available surface; if extending the `onComplete` callback signature is needed, do it.
- **Item 2 is straightforward** — find the gift-synthesis function, add a `Set` for seen category IDs, dedupe before returning the array. ~5 lines of code.
- **Item 3 is the largest of the three by line count** but still tight. The minimum viable fix is per-card distinct templates for the Advocacy gift category (the one Michele's session surfaced). If other gift categories produce Compass/Gravity overlap during smoke, surface in the report; full per-category coverage can land in a follow-up CC.
- **Don't drift into prose tuning.** ChatGPT's rewrite of Michele's session surfaced multiple prose-softening opportunities (Allocation Gap framing, "Growth Edges" naming, four-sentence thesis closer). Those are NOT in CC-023's scope; they're queued for a separate prose-tuning CC. Stay focused on the three structural bug fixes.
- **Browser smoke deferred to Jason.** Engine-level verification covers the bug fixes (loop closed, dedup applied, prose distinct). Visual verification of how the fixes feel in real research workflow is Jason's after CC-023 lands.
