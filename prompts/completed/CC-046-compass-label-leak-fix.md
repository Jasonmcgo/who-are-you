# CC-046 — Compass Label Leak Fix (CC-028 signal labels missing from COMPASS_LABEL map)

**Type:** Single-file label-map gap fix. **No new signals. No new logic. No prose changes.**
**Goal:** Stop user-facing prose from rendering literal signal IDs (`peace_priority`, `honor_priority`, `compassion_priority`, `mercy_priority`) when CC-028 sacred values appear in a user's Compass top ranking. Symptom from a real-user report 2026-04-29: prose reads *"Knowledge, peace_priority, Faith, and honor_priority"* instead of *"Knowledge, Peace, Faith, and Honor"*.
**Predecessors:** CC-028 (Compass Values Expansion — added Peace / Honor / Compassion / Mercy as new sacred values). The `COMPASS_LABEL` map in `lib/identityEngine.ts` was not extended to include the four new signal IDs.
**Successor:** None.

---

## Why this CC

Real-user report 2026-04-29 surfaced the literal signal IDs `peace_priority` and `honor_priority` rendering in prose at least five times across the Compass card, Path · Gait, Synthesis, and Growth Path sections. Other Compass values (`knowledge_priority`, `faith_priority`) rendered correctly as *"Knowledge"* and *"Faith"*. The differentiator: the working signals are from CC-006's original 8-item sacred values; the broken signals are from CC-028's four-value expansion (Peace / Honor / Compassion / Mercy).

The mechanism: `COMPASS_LABEL` in `lib/identityEngine.ts` is a `Record<SignalId, string>` that maps signal IDs to user-facing labels. Prose composers call `COMPASS_LABEL[signal_id]` and fall back to the raw signal ID when the lookup misses. CC-028 added four new `*_priority` signals but didn't extend the label map, so those signal IDs leak through unrendered.

This affects every user who ranks Peace, Honor, Compassion, or Mercy highly in their Compass top values — likely a significant fraction of the user base post-CC-028.

---

## Scope

Files modified:

1. `lib/identityEngine.ts` — extend `COMPASS_LABEL` with four entries: `peace_priority: "Peace"`, `honor_priority: "Honor"`, `compassion_priority: "Compassion"`, `mercy_priority: "Mercy"`.

Nothing else. No new logic, no new prose, no other files.

---

## The locked changes

In `lib/identityEngine.ts`, locate the `COMPASS_LABEL` map. Append the four new entries:

```ts
const COMPASS_LABEL: Record<SignalId, string> = {
  // ... existing CC-006 entries (freedom_priority, truth_priority, stability_priority,
  //     loyalty_priority, family_priority, knowledge_priority, justice_priority, faith_priority) ...
  peace_priority: "Peace",            // CC-046 — was missing since CC-028
  honor_priority: "Honor",            // CC-046 — was missing since CC-028
  compassion_priority: "Compassion",  // CC-046 — was missing since CC-028
  mercy_priority: "Mercy",            // CC-046 — was missing since CC-028
};
```

---

## Steps

### 1. Locate `COMPASS_LABEL` in `lib/identityEngine.ts`

`grep -n "COMPASS_LABEL" lib/identityEngine.ts` should surface the map definition. Verify it currently contains the 8 CC-006 entries and is missing the 4 CC-028 entries.

### 2. Add the four entries

Append per the locked content above. Match the existing entry formatting (alignment, capitalization).

### 3. Verify no other label maps have the same gap

`grep -n "_priority" lib/identityEngine.ts | head -100` to scan for other `*_LABEL` or `*_DESCRIPTION` maps that might have similar CC-028 gaps. Specifically check:
- `SIGNAL_DESCRIPTIONS` — should already contain the 4 CC-028 entries (CC-028 spec required this; verify still present).
- `SACRED_PRIORITY_SIGNAL_IDS` — should already contain the 4 CC-028 entries (CC-028 spec required this; verify still present).
- Any other `*_LABEL` map that maps signal IDs to display names.

If any other map has the same gap, **fix it in this CC** — same architectural defect, same one-line-each fix.

### 4. Verification

- `npx tsc --noEmit` exits 0.
- `npm run lint` passes.
- `npm run build` succeeds (modulo pre-existing /admin Suspense issue).
- Existing test suite passes.
- Manual verification: load a saved session where the user ranked Peace or Honor highly, render the report, confirm prose renders *"Peace"* and *"Honor"* (not `peace_priority` / `honor_priority`).

### 5. Browser smoke (Jason verifies)

Re-render the existing report from 2026-04-29 (Jason0429). Confirm the five+ instances of `peace_priority` and `honor_priority` now render as *"Peace"* and *"Honor"* in prose. No other layout changes.

---

## Acceptance

- `lib/identityEngine.ts` `COMPASS_LABEL` contains entries for `peace_priority`, `honor_priority`, `compassion_priority`, `mercy_priority`.
- Any other label map with the same CC-028 gap is also fixed.
- `git diff --stat` shows changes only in `lib/identityEngine.ts`.
- `npx tsc --noEmit` exits 0. `npm run lint` passes. `npm run build` succeeds (modulo /admin).
- Re-rendered Jason0429 report shows *"Peace"* and *"Honor"* in prose, not signal IDs.

---

## Out of scope

- **Adding entries to non-label maps.** `COMPASS_LABEL` is the target. Don't touch `SIGNAL_DRIVE_TAGS`, `SIGNAL_OCEAN_TAGS`, `MULTI_TAG_SPLITS`, etc. — those have different purposes.
- **Renaming the four CC-028 values** in any user-facing surface. The labels are exactly *"Peace"*, *"Honor"*, *"Compassion"*, *"Mercy"* — single-word title-case.
- **Disambiguating "Peace"** into multiple meanings (inner-peace / moral-peace / relational-peace / structural-peace) — that's a separate prose-layer interpretation question Clarence raised, queued for a future prose-tuning CC.
- **Rewriting any existing prose** that references Compass values.
- **Editing canon docs** unless `signal-library.md` or `question-bank-v1.md` explicitly references the absent COMPASS_LABEL entries (unlikely; verify with grep but expect no edits there).

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Execution Directive

Trivial-scope, single-pass. Edit-and-verify.

## Bash Commands Authorized

- `grep -n "COMPASS_LABEL\|peace_priority\|honor_priority\|compassion_priority\|mercy_priority" lib/identityEngine.ts`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `git diff --stat`
- `git status`

## Read First (Required)

- `lib/identityEngine.ts` `COMPASS_LABEL` definition.
- `prompts/completed/CC-028-compass-values-expansion.md` for context on why the four signals were added.

## Allowed to Modify

- `lib/identityEngine.ts`

## Report Back

1. **Lines changed** — paste the four new entries in their context.
2. **Other-map check** — confirm `SIGNAL_DESCRIPTIONS`, `SACRED_PRIORITY_SIGNAL_IDS`, and any other `*_LABEL` map either already contain the four CC-028 signals or were fixed in this CC.
3. **Verification results** — tsc, lint, build outputs.
4. **Browser smoke deferred to Jason**.

---

## Notes for the executing engineer

- This is a label-map gap, not a logic bug. The four signals fire correctly; the prose just can't read their human-facing label.
- Resist any urge to refactor `COMPASS_LABEL` or extract it to a constants module. Single-purpose append.
- If grep surfaces other `*_LABEL` maps with the same CC-028 gap (e.g., a hypothetical `GIFT_LABEL` or `SACRED_LABEL` that should also have entries), fix them in this CC as same-architectural-defect, same-fix. But verify before adding — most of the engine's other maps don't index by signal ID in the same way.
