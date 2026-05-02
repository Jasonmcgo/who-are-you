# CC-041 — renderMirror.ts Markdown-Export Drift Fix (CC-033 + CC-040 cascade)

**Type:** Two-string drift fix in a single file. **No architectural change. No new prose. No new logic.**
**Goal:** Update the literal Drive-bucket labels in `lib/renderMirror.ts`'s markdown-export path to match what the on-page pie chart and engine prose now show. Currently the markdown export emits *"Financial security 23%, People you love 42%, Risk and uncertainty 35%"* — both bucket names are stale post-CC-033 (cost relabel) and post-CC-040 (coverage relabel). User clicking *"export to markdown"* sees labels that don't match their on-page report.
**Predecessors:** CC-033 (Drive Cost-Bucket Relabel — shipped 2026-04-29). CC-040 (Drive Coverage-Bucket Relabel — shipped 2026-04-29). Both ship reports flagged this drift; this CC catches it.
**Successor:** None.

---

## Why this CC

CC-033 renamed the cost bucket's human label *"Financial security"* → *"Building & wealth"*. CC-040 renamed coverage's *"People you love"* → *"People, Service & Society"*. Both relabels updated `app/components/PieChart.tsx`'s `HUMAN_LABEL` map and `lib/drive.ts`'s `HUMAN_LABELS` map and the engine prose templates. Neither CC touched `lib/renderMirror.ts` because the file wasn't on either CC's allow-list — and the executing engineers correctly stayed in scope.

Consequence: the markdown-export path in `lib/renderMirror.ts` (around lines 437–442) carries hardcoded literal strings that emit the old bucket names. A user generating a markdown copy of their report sees:

> *Path Distribution: Financial security 23%, People you love 42%, Risk and uncertainty 35%*

…while their on-page chart shows *"Building & wealth / People, Service & Society / Risk and uncertainty"*. Same data, different labels. User-visible inconsistency.

This CC is the smallest possible fix: two string updates in one function in one file.

---

## Scope

Files modified:

1. `lib/renderMirror.ts` — update the format string at line 437 and the labels object at line 442 to match post-CC-033 / post-CC-040 labels.

Nothing else. No other files. No type changes. No prose changes. No engine logic changes.

---

## The locked changes

### Format string at line 437

**Pre-CC-041:**
```
"Financial security ${d.cost}%, People you love ${d.coverage}%, Risk and uncertainty ${d.compliance}%"
```

**Post-CC-041:**
```
"Building & wealth ${d.cost}%, People, Service & Society ${d.coverage}%, Risk and uncertainty ${d.compliance}%"
```

### Labels object at line 442

**Pre-CC-041:**
```ts
{
  cost: "Financial security",
  coverage: "People you love",
  compliance: "Risk and uncertainty",
}
```

**Post-CC-041:**
```ts
{
  cost: "Building & wealth",
  coverage: "People, Service & Society",
  compliance: "Risk and uncertainty",
}
```

The compliance label is unchanged from the pre-CC-041 state — it was correct from CC-026's original integration.

---

## Steps

### 1. Locate the lines in `lib/renderMirror.ts`

Around lines 437 and 442 (verify exact line numbers via `grep -n "Financial security\|People you love" lib/renderMirror.ts`). The format-string is part of a Path-distribution markdown emission; the labels object is used elsewhere in the file (search for usages to verify all consumers pick up the new labels).

### 2. Update the format string

Replace verbatim per the locked content above.

### 3. Update the labels object

Replace verbatim per the locked content above.

### 4. Search for any other stale bucket-label strings

`grep -n "Financial security\|People you love" lib/renderMirror.ts` should return only the two updated locations after the edit. If the grep returns additional hits, update those too — they're the same drift.

### 5. Add a header amendment comment

If `lib/renderMirror.ts` has a header comment block, add a one-line CC-041 amendment noting the bucket-label cascade fix from CC-033 + CC-040. If no header block exists, leave alone.

### 6. Verification

- `npx tsc --noEmit` exits 0.
- `npm run lint` passes.
- `npm run build` succeeds (modulo pre-existing /admin Suspense issue).
- Existing test suite passes. If a test asserts on the literal strings *"Financial security"* or *"People you love"* in markdown-export output, update only that test's expected string.
- Manual: trigger a markdown export from a fresh session and confirm the Path Distribution line emits the new labels.

### 7. Browser smoke (Jason verifies)

- Generate markdown export from a saved session.
- Confirm Path Distribution line reads *"Building & wealth X%, People, Service & Society Y%, Risk and uncertainty Z%"*.
- Confirm any other location in the markdown that names buckets uses the new labels.

---

## Acceptance

- `lib/renderMirror.ts` line 437 format string updated to the locked content.
- `lib/renderMirror.ts` line 442 labels object updated to the locked content.
- `grep -n "Financial security\|People you love" lib/renderMirror.ts` returns no hits after the edit.
- `git diff --stat` shows changes only in `lib/renderMirror.ts`.
- `npx tsc --noEmit` exits 0. `npm run lint` passes. `npm run build` succeeds (modulo /admin).

---

## Out of scope

- **Editing any file other than `lib/renderMirror.ts`.**
- **Updating `HUMAN_LABEL` / `HUMAN_LABELS` maps in `PieChart.tsx` or `drive.ts`.** Those were updated by CC-033 / CC-040 and are correct.
- **Refactoring `renderMirror.ts` to import labels from a single source instead of hardcoding.** That's a larger refactor for a future CC. CC-041 does the literal-string replacement only.
- **Updating any other markdown-export strings** that aren't related to the Drive bucket relabels. If grep surfaces other accumulated drift in the file, flag in Report Back rather than silently fixing.
- **Engine logic changes** of any kind.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Execution Directive

Single pass. Trivial scope. Edit-and-verify.

## Bash Commands Authorized

- `grep -n "..." lib/renderMirror.ts`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `git diff --stat`
- `git status`

## Read First (Required)

- `lib/renderMirror.ts` — the only file in scope.
- `prompts/completed/CC-033-drive-cost-bucket-ambition-relabel.md` — context.
- `prompts/completed/CC-040-drive-coverage-bucket-relabel.md` — context.

## Allowed to Modify

- `lib/renderMirror.ts`

## Report Back

1. **Lines changed** — paste the before/after for both edits.
2. **Verification results** — tsc, lint, build outputs.
3. **Other drift surfaced** — if grep found additional stale-label hits, list them.

---

## Notes for the executing engineer

- This is the smallest possible fix. Resist any urge to refactor the file or extract labels to a constants module — a future CC can do that as a deliberate architectural improvement, but CC-041 is a literal-string update.
- The labels object at line 442 may be consumed by multiple call sites in the file. After updating the object's values, verify (via grep / read) that all consumers pick up the new labels automatically. They should — the labels object is the source of truth for those consumers.
- If a test fixture hardcodes the pre-CC-041 strings, update only the expected-value side of the assertion. Don't broaden test scope.
