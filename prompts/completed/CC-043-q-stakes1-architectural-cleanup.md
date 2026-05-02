# CC-043 — Q-Stakes1 Architectural Cleanup (revert Time/autonomy + retag job_stakes + rename money item)

**Type:** Architectural correction across Q-Stakes1, Drive tagging, OCEAN tagging, and signal taxonomy. **No new signals. No engine logic changes. No new prose authored beyond a single Q-Stakes1 item label/gloss rewrite.** Reverts CC-035's Time/autonomy addition; corrects Drive tagging for money and job stakes signals to honor the *security = compliance* canon principle; cleans the "Money / Financial security" overload that conflated cost-flavored resource with compliance-flavored security.
**Goal:** Make Q-Stakes1's tagging and labeling architecturally consistent with the post-CC-033 / post-CC-040 Drive bucket vocabulary. Q-Stakes1's loss-aversion framing dominates per item; each item now tags by its dominant register, with cost-flavored resource (Money) staying cost and security-flavored standing/career/safety (Job, Reputation, Health) all on compliance.
**Predecessors:** CC-024 (Q-Stakes1 introduction), CC-035 (Time/autonomy addition — being reverted), CC-033 (cost relabel), CC-040 (coverage relabel). All shipped 2026-04-29.
**Successor:** None hard-blocked.

---

## Why this CC

Three architectural drift items converged in Q-Stakes1, each surfaced separately during CC-040 and CC-041 ship reports and consolidated into this single cleanup:

**1. Time/autonomy (CC-035 addition) is a category mistake.** Time isn't a *destination* of drive; it's the *substrate* that all three drive registers compete for. The 3C's framework is exhaustive precisely because Building / People-Service-Society / Risk-management *are* the only three places time and energy go. Adding "Time / autonomy" as a Q-Stakes1 item doesn't discriminate Drive direction — it tells us only that the user values self-direction, which is already captured three other ways: `freedom_priority` in Compass; `agency.aspirational` register on Path; creator-agency detection across the Q-A1 / Q-E1 surface. The signal `time_autonomy_stakes_priority` is redundant with existing measurements *and* category-confused at the architectural level.

**2. `job_stakes_priority` was tagged cost; should be compliance.** Per the *security = compliance* canon principle that surfaced 2026-04-29: security or loss-prevention are risk-mitigation variables regardless of which domain the security applies to. Career-in-loss-context is dominantly stability/security register (the user fears losing income, standing, daily structure). Career-as-ambition (the building dimension) is captured separately by `success_priority` in Q-Ambition1. Tagging job_stakes as cost conflated these two registers; the loss-domain framing of Q-Stakes1 makes job_stakes architecturally compliance-flavored.

**3. Q-Stakes1's money item label "Money / Financial security" overloaded two registers.** *Money* is cost-flavored (the resource users build). *Financial security* is compliance-flavored (security applied to the financial domain — the security frame, not the resource frame). The compound label asked the user to rank one item that conflated both. The fix: rename to *"Money / Wealth"* — keeps the cost-flavored register clean and aligns the item label with the post-CC-033 Drive cost-bucket label *"Building & wealth"* so the user's mental map composes (ranking money/wealth → contributes to cost bucket → renders as "Building & wealth" in Drive distribution). `money_stakes_priority` stays cost; the rename removes the compliance overload from the label without changing what the signal measures.

The bundle ships these three corrections together because they're all Q-Stakes1 architectural cleanup post-CC-033/CC-040 vocabulary clarification. Splitting would multiply review overhead for what's structurally one correction.

---

## Scope

Files modified:

1. `data/questions.ts` — Q-Stakes1: drop the 6th item (Time/autonomy); rename the money item ("Money / Financial security" → "Money / Wealth") with updated gloss.
2. `lib/identityEngine.ts` — remove `time_autonomy_stakes_priority` entry from `SIGNAL_DESCRIPTIONS`.
3. `lib/drive.ts` — remove `time_autonomy_stakes_priority` entry from `SIGNAL_DRIVE_TAGS`; change `job_stakes_priority` from `"cost"` to `"compliance"`.
4. `lib/ocean.ts` — remove `time_autonomy_stakes_priority` entry from `SIGNAL_OCEAN_TAGS`.
5. `docs/canon/drive-framework.md` — document the *security = compliance* canon principle; update the cost/compliance bucket signal lists; CC-043 amendment paragraph.
6. `docs/canon/signal-library.md` — remove `time_autonomy_stakes_priority` entry; update `money_stakes_priority` entry (label/gloss change reflected in produced-by-question line) and `job_stakes_priority` entry (drive-tag change). CC-043 amendment paragraph.
7. `docs/canon/question-bank-v1.md` — Q-Stakes1 entry returns to 5 items with renamed money item; CC-043 amendment paragraph documenting the architectural cleanup.

Nothing else. Specifically:
- Q-I3's `derived_top_n_per_source: 6` stays unchanged. `Math.min(6, 5)` gracefully caps at 5 derived options when Q-Stakes1 returns to 5 items.
- No new signals.
- No engine logic changes.
- No re-tagging of any signal beyond `job_stakes_priority`.
- No changes to Q-Ambition1, Q-3C1, or any other question.
- No changes to any cross-card pattern.

---

## The locked changes

### Q-Stakes1 — return to 5 items with renamed money item

**Item 1 (renamed):**
```ts
{ id: "money", label: "Money / Wealth", gloss: "Your money, savings, the resources you've built.", signal: "money_stakes_priority" }
```

Drops the prior label *"Money / Financial security"* and gloss *"Your money, savings, financial stability."* The new label and gloss align with the post-CC-033 Drive cost-bucket vocabulary ("Building & wealth").

**Items 2–5 (unchanged in label/gloss):**

```ts
{ id: "job",                 label: "Job / Career",             gloss: "Your professional standing, your work.",                signal: "job_stakes_priority"                 },
{ id: "close_relationships", label: "Close relationships",      gloss: "Partner, family, closest friends.",                     signal: "close_relationships_stakes_priority" },
{ id: "reputation",          label: "Reputation",               gloss: "How others see you, your standing in your community.", signal: "reputation_stakes_priority"          },
{ id: "health",              label: "Physical safety / Health", gloss: "Your body, your safety.",                                signal: "health_stakes_priority"              },
```

**Item 6 — DROPPED** (Time / autonomy from CC-035). The line is removed entirely from the items array.

### `lib/identityEngine.ts` — `SIGNAL_DESCRIPTIONS` cleanup

Remove the `time_autonomy_stakes_priority` entry entirely. The CC-035 amendment line in the file's header comment block stays as historical record (the addition was a category mistake; the historical record reflects the correction trail).

### `lib/drive.ts` — `SIGNAL_DRIVE_TAGS` updates

Two changes in the Q-Stakes1 block:

```ts
// Q-Stakes1 — concrete loss domains.
money_stakes_priority: "cost",          // unchanged — Money/Wealth is cost-flavored resource
job_stakes_priority: "compliance",      // CC-043 — was "cost"; career-in-loss-context is compliance-flavored stability/security register
close_relationships_stakes_priority: "coverage",
reputation_stakes_priority: "compliance",
health_stakes_priority: "compliance",
// time_autonomy_stakes_priority entry REMOVED — CC-043 reverts CC-035 addition
```

Add a CC-043 amendment line in the file's header comment naming the *security = compliance* canon principle and the job_stakes retag rationale.

### `lib/ocean.ts` — `SIGNAL_OCEAN_TAGS` cleanup

Remove the `time_autonomy_stakes_priority: ["O"]` entry entirely. The remaining 75 OCEAN tags are unchanged.

### Q-Stakes1's loss-domain canon principle

Document in `docs/canon/drive-framework.md` and `docs/canon/question-bank-v1.md`:

> **Security = compliance canon principle.** Security and loss-prevention are risk-mitigation variables regardless of which domain the security applies to. *Financial security*, *physical safety*, *job security*, *reputation protection* are all compliance-class registers — *security* is the load-bearing word; the domain modifier names which area the security applies to. Q-Stakes1's loss-domain framing ("what would hurt most to lose") brings out the compliance dimension of any item that's named in security/protection/loss-prevention terms. Items that name a *resource* (Money / Wealth) rather than a *security frame* tag by their domain register (cost), not compliance.

This principle resolves the CC-043 retag rationale and forecloses future drift on similar items.

---

## Steps

### 1. `data/questions.ts` — Q-Stakes1 cleanup

Locate the Q-Stakes1 entry (around line 434). Update the items array:

```ts
items: [
  { id: "money",               label: "Money / Wealth",           gloss: "Your money, savings, the resources you've built.",      signal: "money_stakes_priority"               },
  { id: "job",                 label: "Job / Career",             gloss: "Your professional standing, your work.",                signal: "job_stakes_priority"                 },
  { id: "close_relationships", label: "Close relationships",      gloss: "Partner, family, closest friends.",                     signal: "close_relationships_stakes_priority" },
  { id: "reputation",          label: "Reputation",               gloss: "How others see you, your standing in your community.", signal: "reputation_stakes_priority"          },
  { id: "health",              label: "Physical safety / Health", gloss: "Your body, your safety.",                                signal: "health_stakes_priority"              },
],
```

Five items total. The Time/autonomy entry that CC-035 added is removed entirely.

### 2. `lib/identityEngine.ts` — remove time_autonomy_stakes_priority from SIGNAL_DESCRIPTIONS

Locate `time_autonomy_stakes_priority: "Treats time and autonomy..."` in the `SIGNAL_DESCRIPTIONS` map and delete the entry. Verify no other code path in the file references the signal (grep for `time_autonomy_stakes_priority` to confirm).

### 3. `lib/drive.ts` — SIGNAL_DRIVE_TAGS retag + cleanup

In `SIGNAL_DRIVE_TAGS`, in the Q-Stakes1 block:
- Change `job_stakes_priority: "cost"` to `job_stakes_priority: "compliance"`
- Delete the `time_autonomy_stakes_priority: "compliance"` line

Add a CC-043 amendment line in the file's header comment block naming the retag and the canon principle.

### 4. `lib/ocean.ts` — SIGNAL_OCEAN_TAGS cleanup

In `SIGNAL_OCEAN_TAGS`, in the Q-Stakes1 block, delete the `time_autonomy_stakes_priority: ["O"]` line. The other Q-Stakes1 OCEAN tags are unchanged.

### 5. `docs/canon/drive-framework.md`

- Update the cost-bucket signal list to reflect that `job_stakes_priority` no longer contributes (now compliance).
- Update the compliance-bucket signal list to add `job_stakes_priority` and remove `time_autonomy_stakes_priority`.
- Add a "CC-043 amendment (2026-04-29) — Q-Stakes1 architectural cleanup" section documenting:
  - The *security = compliance* canon principle (full text per the locked content above).
  - Time/autonomy revert rationale (substrate, not destination).
  - job_stakes retag rationale (career-in-loss-context = compliance; ambition captured by Q-Ambition1).
  - money_stakes stays cost rationale (Money / Wealth is the resource; cost-flavored).
  - The architectural picture post-CC-043 with the 5-item Q-Stakes1 + tag table.

### 6. `docs/canon/signal-library.md`

- Delete the `time_autonomy_stakes_priority` entry entirely.
- Update the `money_stakes_priority` entry: produced-by-question reflects the new "Money / Wealth" label.
- Update the `job_stakes_priority` entry: drive-tag changes from cost to compliance; description may reflect the loss-aversion register more explicitly.
- Add a CC-043 amendment paragraph noting the cleanup.

### 7. `docs/canon/question-bank-v1.md`

- Update the Q-Stakes1 entry: 5 items (drop Time/autonomy); money item renamed to "Money / Wealth" with new gloss.
- Add a CC-043 amendment paragraph parallel to the canon-doc amendment in drive-framework.md.

### 8. Verification

- `npx tsc --noEmit` exits 0.
- `npm run lint` passes.
- `npm run build` succeeds (modulo /admin Suspense pre-existing failure).
- Existing test suite passes. If a test references `time_autonomy_stakes_priority` directly, the test must be updated (the signal no longer exists). If a test asserts Q-Stakes1 has 6 items, update to 5. If a test asserts on the literal "Money / Financial security" string in Q-Stakes1's label, update to "Money / Wealth".
- Manual sweep: confirm no remaining references to `time_autonomy_stakes_priority` anywhere in the codebase via `grep -rn "time_autonomy_stakes_priority"`.
- Manual sweep: confirm `job_stakes_priority` is now in the compliance bucket — synthesize a user with `job_stakes_priority` ranked 1 in Q-Stakes1 and trace through `computeDriveDistribution`; the contribution should land in the compliance bucket.

### 9. Browser smoke (Jason verifies)

After the CC ships:
- Q-Stakes1 renders with 5 items: Money / Wealth, Job / Career, Close relationships, Reputation, Physical safety / Health.
- Q-I3 derives up to 5 options from the user's Q-Stakes1 ranking + None + Other = 7 total checkboxes.
- Drive distribution for users who ranked Job highly in Q-Stakes1 shows compliance bucket elevated relative to pre-CC-043 (and cost slightly reduced).
- Drive distribution for users who ranked Money highly in Q-Stakes1 is unchanged (money_stakes_priority still tags cost).

---

## Acceptance

- `data/questions.ts` Q-Stakes1 has exactly 5 items in the order specified above; money item is "Money / Wealth" with the new gloss; Time/autonomy item is gone entirely.
- `lib/identityEngine.ts` `SIGNAL_DESCRIPTIONS` no longer contains `time_autonomy_stakes_priority`.
- `lib/drive.ts` `SIGNAL_DRIVE_TAGS` has `job_stakes_priority: "compliance"` and no `time_autonomy_stakes_priority` entry.
- `lib/ocean.ts` `SIGNAL_OCEAN_TAGS` has no `time_autonomy_stakes_priority` entry.
- `grep -rn "time_autonomy_stakes_priority"` returns zero hits across the codebase.
- Three canon docs (drive-framework.md, signal-library.md, question-bank-v1.md) updated with CC-043 amendment paragraphs documenting the rationale.
- `git diff --stat` shows changes only in named files.
- `npx tsc --noEmit` exits 0. `npm run lint` passes. `npm run build` succeeds (modulo /admin).

---

## Out of scope

If you find yourself doing any of these, stop and flag — they belong elsewhere:

- **Renaming any other Q-Stakes1 item.** Only the money item is renamed. Job / Career, Close relationships, Reputation, Physical safety / Health stay verbatim.
- **Re-tagging any signal beyond `job_stakes_priority`.** No other tagging table changes. `money_stakes_priority` stays cost; `close_relationships_stakes_priority` stays coverage; `reputation_stakes_priority` stays compliance; `health_stakes_priority` stays compliance.
- **Adding multi-tag splits for `job_stakes_priority`.** Single retag to compliance. Multi-tag would re-introduce the cost-flavor that ambition-level career building already gets via `success_priority` in Q-Ambition1.
- **Changing Q-I3's `derived_top_n_per_source`.** Stays at 6 with graceful Math.min cap at 5.
- **Adding a replacement 6th Q-Stakes1 item.** Five items is the right count; the framework doesn't need a sixth.
- **Renaming `time_autonomy_stakes_priority` to something else.** Delete entirely; no replacement signal.
- **Updating Mirror prose, Tension prose, or ShapeCard prose** that may have referenced Time/autonomy or "Financial security." Engine-prose tuning is separate CC territory.
- **Migrating saved sessions.** Saved sessions that have a Q-Stakes1 ranking including Time/autonomy still load (the answer data is stable); the engine simply ignores the no-longer-recognized item id when computing distribution. The recomputed Drive distribution will reflect the new tagging without the Time/autonomy contribution. No migration code needed.
- **Retagging `time_autonomy_stakes_priority`'s OCEAN bucket** — the entire signal is being deleted, so the OCEAN tag for it goes with it.
- **Modifying CC-035's prompt file in `prompts/completed/`.** Historical record stays.
- **Component edits.** No `MapSection.tsx`, `QuestionShell.tsx`, `PieChart.tsx`, etc. changes.
- **Engine logic changes** to `computeDriveDistribution`, `weightFor`, `MULTI_TAG_SPLITS`, etc. Pure tagging-table edit.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

Codex equivalent acceptable.

## Execution Directive

Single pass. Don't pause for user confirmation. Architectural correction; the locked changes per the Locked-Changes section are exhaustive — don't add scope. On any test failure, update only the directly-affected test fixtures (item count, signal name, label string); don't broaden test scope.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` (smoke only; kill before exiting)
- `grep -rn "time_autonomy_stakes_priority"` (verify no remaining references)
- `grep -rn "Financial security"` (verify Q-Stakes1 label is updated)
- `git diff --stat`
- `git status`

## Read First (Required)

- `AGENTS.md`
- `data/questions.ts` Q-Stakes1 (around line 434, post-CC-035 form with 6 items).
- `lib/identityEngine.ts` `SIGNAL_DESCRIPTIONS` (locate `time_autonomy_stakes_priority`).
- `lib/drive.ts` `SIGNAL_DRIVE_TAGS` Q-Stakes1 block (lines around 68–73 plus the CC-035 addition).
- `lib/ocean.ts` `SIGNAL_OCEAN_TAGS` Q-Stakes1 block.
- `docs/canon/drive-framework.md`, `docs/canon/signal-library.md`, `docs/canon/question-bank-v1.md`.
- `prompts/completed/CC-024-keystone-block-restructure.md` — context on Q-Stakes1's original 5-item set.
- `prompts/completed/CC-035-belief-stress-test-expansion.md` — context on what's being reverted.

## Allowed to Modify

- `data/questions.ts`
- `lib/identityEngine.ts`
- `lib/drive.ts`
- `lib/ocean.ts`
- `docs/canon/drive-framework.md`
- `docs/canon/signal-library.md`
- `docs/canon/question-bank-v1.md`

## Report Back

1. **Files modified** with line counts; confirm against Allowed-to-Modify.
2. **Verification results** — tsc, lint, build outputs.
3. **Grep verification** — paste the post-edit `grep -rn "time_autonomy_stakes_priority"` (should be zero hits) and `grep -rn "Financial security" data/` (should show only `Q-Stakes1`'s prior reference is gone, OR if "Financial security" appears elsewhere, surface it).
4. **Test updates** — any tests modified to reflect the 5-item Q-Stakes1 or the renamed money item or the missing time_autonomy signal.
5. **Manual sweep** — synthesized user trace confirming `job_stakes_priority` now contributes to the compliance bucket.
6. **Out-of-scope drift caught**.
7. **Browser smoke deferred to Jason**.
8. **Saved-session compatibility** — confirm pre-CC-043 sessions load gracefully (engine ignores the no-longer-recognized Time/autonomy item id) and recomputed Drive distributions reflect the new tagging.

---

## Notes for the executing engineer

- This CC is a deliberate revert + retag. The Time/autonomy signal is being deleted entirely from the codebase, not just hidden. Verify no other module references it before completing.
- The *security = compliance* canon principle (documented in the canon docs) is the load-bearing argument. Future agents reading the canon should encounter the principle and the rationale together; don't truncate the explanation.
- `money_stakes_priority` stays tagged `cost`. Don't retag it — the rename ("Money / Wealth") makes the cost tag coherent. The phrase that was overloaded ("Money / Financial security") is what we're removing; the cost-flavored money-as-resource register survives unchanged.
- `job_stakes_priority` becomes single-compliance, NOT multi (cost + compliance). Career ambition is captured by `success_priority` in Q-Ambition1; multi-tagging job_stakes would double-count the building dimension of career.
- Q-I3's `derived_top_n_per_source: 6` stays. The `Math.min(topN, parentLength)` clause caps at parent length gracefully. Q-I3 with 5 Q-Stakes1 items renders 5 derived options + None + Other = 7 total. Don't lower top_n.
- Saved-session compatibility: pre-CC-043 sessions that have a Q-Stakes1 ranking referencing the no-longer-existent `time` item will store the answer data stably, but the engine's distribution-compute code doesn't recognize an item id that isn't in the questions table — the contribution simply doesn't fire. No migration code needed; the behavior is graceful by construction.
- Drive distributions will shift visibly for users who ranked Job highly in Q-Stakes1: cost shrinks, compliance grows. That's the correct result under the canon principle. Document expectation in browser smoke.
- This CC closes a real architectural drift item. The Drive framework's exhaustiveness claim (Building / Coverage / Compliance is a complete decomposition of where human drive is directed) finally has tagging that matches the claim — every loss-aversion-framed Q-Stakes1 item tags compliance (Job, Reputation, Health) except for the one resource-framed item (Money / Wealth, which tags cost) and the one relational-framed item (Close relationships, which tags coverage).
