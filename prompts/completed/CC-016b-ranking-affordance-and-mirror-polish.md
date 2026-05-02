# CC-016b — Ranking affordance + Mirror polish

## Launch Directive

You are executing CC-016b. This is a UI-and-prose polish CC that lands four small, related touch-ups on top of CC-016. No engine derivation logic changes. No new questions, signals, tensions, or canon rules. No new types beyond a small deletion.

The work is sequenced as a follow-up to CC-016 (which shipped the Allocation Layer) and as a prerequisite for CC-017 (the v2 Coherence Engine's Interpretive Evidence Layer). The four scope items came out of real-user testing on CC-016: Jason's daughter ran a session, surfaced one user-experience defect (the Continue affordance is ambiguous on ranking questions) and three smaller polish items that were already known but parked.

## Bash Authorized

Yes. Use the shell freely for `tsc`, `eslint`, dev-server smoke runs, and any inspection scripts you need. Do not commit or push.

## Execution Directive

### Item 1 — Replace Continue with Accept on ranking questions

**The defect.** In `app/page.tsx` lines 158-172, the `seed` initializer for ranking questions returns the original presentation order from `data/questions.ts` when the user has no prior answer. When a user lands on a ranking question and presses **Continue** without dragging anything, the system commits the seed order as the user's ranking and the engine emits rank-aware signals from it. Users who saw a canonical order and thought it already matched their preference would Continue without dragging, and the system silently treated that as a real ranking — but users who didn't engage at all would also Continue, producing the same phantom signals. The two cases are observationally indistinguishable to the engine.

**The fix is in the affordance, not the data capture.** The user's intent has to be made explicit. Replace the single ambiguous **Continue** button on ranking questions with two explicit affordances:

- **Accept** — *"yes, this ordering reflects what I actually think"*. Commits the current visible order as the user's ranking, identical to today's Continue behavior. Emits rank-aware signals as before.
- **Skip** — *"I don't want to commit a ranking here"*. The existing CC-014 Skip pathway. Emits the `question_skipped` MetaSignal, advances, lets second-pass handle the question on return.

Both buttons stay visible during first-pass on every ranking question. The user has to make a deliberate choice between them. There is no auto-route, no inference, no silent commit. The user picks one.

**For non-ranking question types** (forced, freeform, single_pick), the existing **Continue** button stays as-is. The forced and single_pick types already require an active selection to proceed (`canContinue` enforces this via existing logic in `app/page.tsx`); freeform's empty-string case is already handled by the same. Only ranking and ranking_derived need the renamed affordance.

**Implementation sketch** (you may diverge if you find a cleaner path; the constraint is the user-visible behavior, not the implementation route):

- `app/components/QuestionShell.tsx` — accept a new optional prop `continueLabel?: string` that defaults to `"Continue"` and is rendered in place of the hardcoded label on the primary action button. Existing styling, disabled state, focus ring, and click handler all stay unchanged.
- `app/page.tsx` — when constructing the QuestionShell props, pass `continueLabel="Accept"` when `question.type === "ranking" || question.type === "ranking_derived"`. Omit the prop otherwise (defaults to `"Continue"`).
- The Skip button stays as-is. Its `skipVisible` predicate (`mode === "first_pass" && typeof onSkip === "function"`) is correct and continues to work.

The `canContinue` predicate currently controls whether the primary button is disabled. For ranking questions, `canContinue` is currently `true` whenever a draft exists or the seed is non-empty — i.e., always true for ranking questions on first paint. **This stays unchanged.** A user can press Accept immediately on first paint to commit the canonical order, or drag-then-Accept to commit a custom order. Both paths are valid user choices. The whole point of this CC is to make the choice explicit, not to gate it.

### Item 2 — Vary T-013 / T-014 / T-015 closing questions

**The defect.** All three CC-016 tensions currently close their `user_prompt` with the same line: *"Does this gap feel familiar?"* When two or three of them fire in the same session, the Mirror's Allocation Gaps section renders as a sequence of paragraphs each ending with the identical closing question. It reads as templated rather than authored.

**The fix.** Vary the closing line per tension:

- **T-013** — keep *"Does this gap feel familiar?"* (unchanged; the existing Q-S2 sacred-value vs Q-S3 spending-allocation framing is the cleanest "feel familiar" target).
- **T-014** — replace with *"Does this match what you'd predict?"* (energy allocation against stated values is more cognitively legible than money allocation; "predict" invites the user to reflect on their own self-model rather than to recognize a pattern).
- **T-015** — replace with *"What do you read in this?"* (overlay-driven; the gap is between the user's current state and their own aspirational marker, so the question is more open than diagnostic).

**Locations.** The three `user_prompt` strings live in `lib/identityEngine.ts`:

- T-013 — inside the `for (const [valueSignal, spendingMatches] of Object.entries(VALUE_TO_SPENDING))` loop. The closing line is the final `Does this gap feel familiar?` in the template literal that builds `user_prompt`.
- T-014 — analogous block consuming `VALUE_TO_ENERGY`. Same closing line, same surface for the swap.
- T-015 — inside `detectAllocationOverlayTensions`. The closing line is in the templated `user_prompt` for the per-ranking instance.

**Canon update.** `docs/canon/tension-library-v1.md` carries the T-013 / T-014 / T-015 user-prompt prose verbatim. Update the closing line in each entry to match the engine. Do not modify any other line of any tension entry.

### Item 3 — T-015 multi-fire synthesis

**The defect.** T-015 fires once per allocation parent ranking with ≥2 non-`right` overlay markers. A user who marks overlays heavily across all four parents (Q-S3-close, Q-S3-wider, Q-E1-outward, Q-E1-inward) would see four T-015 paragraphs in the Mirror — one per ranking — repeating the same structural framing four times. Reads as repetitive.

**The fix.** When **3 or more** T-015 instances would fire in the same session, replace the per-ranking instances with a **single synthesis tension** that names the broader pattern across rankings. Below the threshold (1 or 2 instances), keep the per-ranking instances — the per-ranking framing is the right shape when the gap lives in only one or two domains.

**Implementation surface.** `lib/identityEngine.ts` `detectAllocationOverlayTensions(answers)`. When the function would return ≥3 Tension objects, instead return a single Tension with:

- `tension_id: "T-015"` (preserved).
- `type: "Aspirational Allocation Gap (synthesis)"` or similar — your call on the human label, but the synthesis nature should be visible in the type string.
- `signals_involved`: a summary list referencing the affected rankings; do not enumerate every per-item overlay marker.
- `confidence: "medium"`.
- `status: "unconfirmed"`.
- `strengthened_by: []`.
- `user_prompt`: a single paragraph naming the broader pattern. Suggested wording (you may polish):

> *"Across multiple allocation domains, you marked categories where the current flow doesn't match what you wish. The gap shows up in [list of affected ranking labels — e.g. 'how money flows close to home, where your money goes beyond your immediate circle, and where your outward energy lands']. The model surfaces the pattern; it doesn't decide what you do with it. What do you read in this?"*

The list of affected rankings is built from the input — the rankings whose overlays triggered the synthesis. Use human-readable labels, not question_ids. Suggested label map (define inline near the existing `RANKING_LABELS` constant if one exists, or alongside the function):

- `Q-S3-close` → "how money flows close to home"
- `Q-S3-wider` → "where your money goes beyond your immediate circle"
- `Q-E1-outward` → "where your outward energy lands"
- `Q-E1-inward` → "where your inward energy lands"

The synthesis tension closes with the same T-015 closing question as the per-ranking instances ("What do you read in this?" after Item 2).

The Mirror's `MirrorSection.tsx` filter (`ALLOCATION_TENSION_IDS.has(t.tension_id)`) continues to work unchanged — the synthesis tension still has `tension_id: "T-015"`, so it renders in the Allocation Gaps section.

### Item 4 — RankingAnswerWithOverlay cleanup

**The condition.** `lib/types.ts` declares `RankingAnswerWithOverlay` per CC-016 § D-3 as a refined type for the four allocation parent rankings, but no production code consumes it (the actual code uses `RankingAnswer` with optional `overlay`). Lean YAGNI delete.

**The fix.** Delete the `RankingAnswerWithOverlay` type declaration from `lib/types.ts`. Verify with `tsc --noEmit` that no consumer references it (none expected). If `tsc` flags any references, surface them in the report — that means CC-016's smoke missed a real consumer and the type should stay.

## Allowed-to-Modify

- `app/components/QuestionShell.tsx` — add the `continueLabel?: string` prop and use it for the primary action button label.
- `app/page.tsx` — pass `continueLabel="Accept"` for ranking and ranking_derived questions; omit otherwise.
- `lib/identityEngine.ts` — modify the closing line of T-013 / T-014 / T-015 `user_prompt` strings; modify `detectAllocationOverlayTensions` to support the synthesis path at threshold ≥3; add the ranking-label map if needed.
- `lib/types.ts` — delete `RankingAnswerWithOverlay`.
- `docs/canon/tension-library-v1.md` — update the closing line of T-013 / T-014 / T-015 entries to match the engine.

No other file should be modified.

## Out of Scope — explicit "do not" list

- **Do not** change the seed initialization in `app/page.tsx`. The auto-route-to-skip behavior I sketched in chat earlier was wrong — it would erase the legitimate "user genuinely accepts the canonical order" case. Leave the seed as-is. The fix is in the affordance label, not in the data capture.
- **Do not** modify any signal extraction logic — `signalsFromRankingAnswer`, `signalsFromDerivedRanking`, `extractFreeformSignals`, `signalFromSinglePick`, `deriveSignals`. These produce signals correctly; the Accept/Skip change does not require any signal-side work.
- **Do not** modify any of the existing T-001 through T-012 tension blocks. Read-only.
- **Do not** modify the structural detection logic of T-013 / T-014. Only their closing-question prose changes.
- **Do not** modify any per-card derivation function (`deriveCompassOutput`, `deriveConvictionOutput`, `derivePathOutput`, etc.). Read-only.
- **Do not** modify the cross-card synthesis functions (`generateMirror`, `generatePathExpansion`, `generateNextMoves`, `generatePressureSection`, `valueListPhrase`, `valuesPlural`, the gift-category pickers, anything in the synthesis surface). Read-only.
- **Do not** modify any signal definition in `lib/identityEngine.ts` `SIGNAL_DESCRIPTIONS` or in `docs/canon/signal-library.md`. Read-only.
- **Do not** modify any question definition in `data/questions.ts`. The question bank stays exactly as CC-016 left it.
- **Do not** shuffle Q-T item order. That is CC-016c, separate scope.
- **Do not** rewrite Q-T quotes. That is CC-016d (hypothetical), separate scope.
- **Do not** modify the Allocation Overlay UI in `Ranking.tsx` (the wish_less / right / wish_more affordance row). Jason has parked overlay UX polish for a later CC.
- **Do not** modify the Mirror's section structure, ordering, or any of the existing 7+1 sections. Only the prose inside the existing T-013 / T-014 / T-015 user_prompts changes.
- **Do not** introduce any new signal type, MetaSignal type, Tension type, or question type. The synthesis T-015 is a Tension instance with the same `tension_id`, not a new tension category.
- **Do not** introduce LLM substitution, persistence, evidence-layer types, or any v2 Coherence Engine work. CC-017 is a separate CC with its own architectural decisions.
- **Do not** modify the CC-014 second-pass mechanism. The second_pass flow for previously-skipped forced questions stays as-is.
- **Do not** modify the cascade-skip behavior for derived rankings (CC-016 § 10). The Accept/Skip rename applies to derived rankings the same way as parent rankings, but the cascade-skip-when-parent-data-missing behavior stays unchanged.
- **Do not** modify `eslint.config.mjs`, `tsconfig.json`, package.json, or any build configuration.
- **Do not** modify AGENTS.md, CLAUDE.md, README, or any prompt file other than this one.

## Acceptance Criteria

1. **Affordance change verified across all ranking question types.** Q-S1, Q-S2, Q-X3, Q-X4, Q-T1 through Q-T8, Q-S3-close, Q-S3-wider, Q-S3-cross, Q-E1-outward, Q-E1-inward, Q-E1-cross — all show **Accept** as the primary button label and **Skip** as the secondary on first_pass. Twelve ranking questions in total. Verify by reading the relevant code paths or running the dev server and walking through each question.
2. **Non-ranking question types unchanged.** Q-C1, Q-C2, Q-C3 (forced); Q-C4 (ranking — note: this IS a ranking, so it gets Accept/Skip too); Q-P1, Q-P2, Q-P3 (forced); Q-F1, Q-F2 (forced); Q-X1, Q-X2 (forced); Q-A1, Q-A2 (forced); Q-I1, Q-I2, Q-I3 (freeform). All show **Continue** + Skip (where Skip is currently shown). Q-C4 is a ranking and moves to Accept; do not miss it.
3. **Pressing Accept commits the visible order as the ranking** — same data capture as today's Continue. Verify by smoke-testing one session where the user does not drag, presses Accept, and the resulting `Answer.order` matches the canonical item order in `data/questions.ts`.
4. **Pressing Skip on a ranking question emits the existing `question_skipped` MetaSignal and advances.** Same behavior as before this CC. Verify by smoke-testing one session where the user presses Skip on Q-S1 and confirming the MetaSignal lands and the question is queued for second_pass.
5. **T-013 closes with the unchanged line.** *"…Does this gap feel familiar?"*
6. **T-014 closes with the new line.** *"…Does this match what you'd predict?"*
7. **T-015 closes with the new line.** *"…What do you read in this?"*
8. **T-015 synthesis triggers at ≥3 instances.** Verify with three smoke sessions: 1 instance fires (per-ranking), 2 instances fire (per-ranking, both rendered), 3 instances fire (synthesis only, single paragraph), 4 instances fire (synthesis only, single paragraph).
9. **`RankingAnswerWithOverlay` deleted.** `tsc --noEmit` produces no errors after deletion. If any consumer surfaces, surface in the report and leave the type in place.
10. **Canon `tension-library-v1.md` closing-line text matches the engine** for T-013 / T-014 / T-015. Verify by reading the file post-edit.
11. **TSC clean.** `npx tsc --noEmit` exits 0 with no output.
12. **Lint clean.** `npm run lint` exits 0 with no warnings.
13. **No file outside the Allowed-to-Modify list is modified.** Confirm via `git status` and a file-by-file diff review.

## Report Back

Return the following sections in the report:

1. **Files changed** — file-by-file diff summary, each with a one-line description of the change.
2. **Affordance change verification** — list each of the 12 ranking questions and confirm each renders Accept; list at least three non-ranking questions and confirm each still renders Continue. Use the dev server output, screenshot descriptions, or code-path walkthrough as evidence.
3. **Closing-question prose** — paste the new T-013 / T-014 / T-015 `user_prompt` strings verbatim from the engine, and confirm the canon's `tension-library-v1.md` entries match.
4. **T-015 synthesis smoke** — five sets at thresholds 0/1/2/3/4 instances. Set 0: confirms no T-015 fires when no overlay markers cross threshold. Set 1: confirms a single per-ranking T-015 fires. Set 2: confirms two per-ranking instances fire. Set 3: confirms the synthesis instance fires (and per-ranking instances do not). Set 4: same as Set 3 with all four rankings included in the synthesis label list.
5. **`RankingAnswerWithOverlay` deletion** — confirm `tsc --noEmit` clean post-deletion. If any consumer surfaced, list it.
6. **Type check + lint** — paste the exit codes for `tsc --noEmit` and `npm run lint`.
7. **Scope-creep check** — confirm no file outside the Allowed-to-Modify list was modified. Confirm none of the items on the "do not" list were touched.
8. **Risks / next-step recommendations** — anything you noticed during the work that warrants a follow-up CC. Keep this short; the CC is small.

## Notes for the executing engineer

- The Accept/Skip change is the load-bearing item. The other three are real but smaller. If you hit any surprise blocker in items 2–4, ship item 1 alone and surface the blocker in the report; do not let small items hold up the affordance fix.
- The synthesis tension's `signals_involved` list is the place where I expect the most ambiguity. The per-ranking T-015 today uses the parent ranking's overlay markers as `signals_involved`; the synthesis form covers multiple rankings. A reasonable shape is one `SignalRef` per affected ranking pointing at the parent question_id, but you may find a cleaner representation. Use your judgment; surface the choice in the report.
- The "Q-C4 is a ranking" reminder in Acceptance Criteria #2 is deliberate — Q-C4 is the lone canonical 5-item ranking and it's easy to miss when listing rankings. Do not miss it.
- If `tsc` flags `RankingAnswerWithOverlay` as referenced from a CC-016 file the smoke didn't catch, leave it in place and surface in the report. Don't force-delete a type that has a real consumer.
- Browser smoke is deferred to Jason. Your smoke testing should cover: per-question affordance verification (read the QuestionShell render path; you do not need to walk all 12 by hand), engine-level T-013/14/15 closing-line emission, T-015 synthesis at the four thresholds, and TSC + lint cleanliness. UX/visual verification is Jason's.
