# CODEX-058b — Drop gift_category Gates from 6 of 8 getUncomfortableButTrue Conditions (CC-058 workshop fix)

*(Filename CODEX-058b per the agent-routing convention 2026-04-29: surgical / mechanical scope; locked outcome; one-file engine fix + two canon-doc updates. The `b` sub-letter ties this to CC-058 as a workshop fix; numbering shares the global CC-### sequence.)*

**Type:** Surgical removal of one clause from 6 conditional branches in a single function. **No new logic. No new prose. No new content authored.** Purely subtractive: drops the `gift_category` gate from conditions 1, 4, 5, 6, 7, 8 in `getUncomfortableButTrue`. Conditions 2 and 3 already had no `gift_category` gate; they are untouched. Canon doc and audit doc updated to reflect the new condition shapes.
**Goal:** Fix a workshop bug Codex's CC-058 ship-report flagged: the `gift_category` gate at condition 1 (and the analogous gates at conditions 4-8) over-narrow the selector. `gift_category` is itself derived from aux-pair routing, which can route a dominant-function user to a category label that doesn't match the conceptual register the condition is testing for. Concrete failure: Jason0429 is Ni-dominant + knowledge_priority + truth_priority in Compass top — exactly the user-shape Clarence's condition-1 sentence is written for — but his NiTe aux-pair routes to `gift_category: "Builder"`, which fails condition 1's `Pattern || Discernment` gate. After this fix, condition 1 fires on dominant function + epistemic-Compass register alone; Jason0429 fires the canonical sentence as intended.
**Predecessors:** CC-058 (Mirror Layer Uncomfortable-but-True Slot — shipped the 8-condition selector with the `gift_category` gates that this CC removes). Workshop lock 2026-05-01 (Jason: *"I agree, let's lock both as 'A'"* — Path α on Workshop A: drop `gift_category` from all 8 conditions; Path α on Workshop B: leave condition 2's discriminator as freedom/learning-energy only).
**Successor:** None hard-blocked. Closes the CC-058 calibration miss before browser smoke runs.

---

## Why this CODEX

CC-058's ship-report flagged that 6 of the 8 conditions in `getUncomfortableButTrue` gate on `gift_category` (Pattern, Discernment, Integrity, Builder, Harmony, Action, Stewardship). The intent of each condition is to read *user-shape register* — long-arc-context-absorber for condition 1, conviction-without-correction for condition 4, and so on. But `gift_category` is itself derived from the FUNCTION_PAIR_REGISTER (CC-038-prose) which routes dominant-function users to category labels via aux-pair. For example:

- **NiTe aux-pair** routes to `gift_category: "Builder"`. A user with this aux-pair who is also a long-arc-context-absorber (Ni-dom + knowledge_priority + truth_priority) doesn't satisfy condition 1's `Pattern || Discernment` gate even though they're the canonical condition-1 user. Concrete: Jason0429.
- **NiFe aux-pair** routes differently (per CC-038-prose v3 — "the pastor"). A Ni-dom + knowledge user with NiFe aux still wants condition 1 to fire; the `Pattern || Discernment` gate locks them out too.
- **TiNe aux-pair** routes to a non-Builder label even though the dominant Te / Ti-Te boundary user may want condition 5's *builder-vs-pause* sentence. Same trap.

The right test for each condition is *(dominant function) AND (cross-signal Compass / energy / Drive discriminator)* — not (dominant function) AND (cross-signal) AND (gift_category). Removing the `gift_category` clause restores the design intent.

The two Clarence-authored example sentences for Jason0429 (which motivate conditions 1 and 2) are register-faithful by dominant function + Compass pattern, not by aux-pair routing — confirming the architectural call.

---

## Locked changes

### `lib/identityEngine.ts § getUncomfortableButTrue`

For **each of conditions 1, 4, 5, 6, 7, 8**, remove the trailing `&& giftCategory === "..."` clause (or `&& (giftCategory === "..." || giftCategory === "...")` for condition 1 which has two acceptable categories).

**Conditions 2 and 3 are untouched** — neither had a `gift_category` gate per CC-058's original spec.

After the edit, each condition is `(dominant function) AND (cross-signal discriminator)`. The first-match-wins priority order is preserved.

The local `giftCategory` variable declaration near the top of the function should be **removed** if it has no remaining readers after the gates are dropped. (If it's still used by any helper inside the function — verify with grep — leave it.)

#### Concrete diff per condition

**Condition 1 (context_vs_authority):**

```diff
   if (
     dom === "ni" &&
     (signalRankAtMost(topCompass, "knowledge_priority", 5) ||
-      signalRankAtMost(topCompass, "truth_priority", 5)) &&
-    (giftCategory === "Pattern" || giftCategory === "Discernment")
+      signalRankAtMost(topCompass, "truth_priority", 5))
   ) {
     return UNCOMFORTABLE_BUT_TRUE_TEMPLATES.context_vs_authority;
   }
```

**Condition 4 (conviction_vs_rigidity):**

```diff
   if (
     dom === "fi" &&
     (signalFiring(signals, "holds_internal_conviction") ||
-      signalRankAtMost(topCompass, "truth_priority", 3)) &&
-    giftCategory === "Integrity"
+      signalRankAtMost(topCompass, "truth_priority", 3))
   ) {
     return UNCOMFORTABLE_BUT_TRUE_TEMPLATES.conviction_vs_rigidity;
   }
```

**Condition 5 (builder_vs_pause):**

```diff
   if (
     dom === "te" &&
     (signalFiring(signals, "creator-agency") ||
-      signalRankAtMost(topCompass, "system_responsibility_priority", 5)) &&
-    giftCategory === "Builder"
+      signalRankAtMost(topCompass, "system_responsibility_priority", 5))
   ) {
     return UNCOMFORTABLE_BUT_TRUE_TEMPLATES.builder_vs_pause;
   }
```

**Condition 6 (caretaker_vs_self):**

```diff
   if (
     dom === "fe" &&
     (signalRankAtMost(topCompass, "family_priority", 5) ||
-      energyRankAtMost(signals, "caring_energy_priority", 2)) &&
-    giftCategory === "Harmony"
+      energyRankAtMost(signals, "caring_energy_priority", 2))
   ) {
     return UNCOMFORTABLE_BUT_TRUE_TEMPLATES.caretaker_vs_self;
   }
```

**Condition 7 (action_vs_direction):**

```diff
   if (
     dom === "se" &&
     (signalRankAtMost(topCompass, "freedom_priority", 5) ||
-      energyRankAtMost(signals, "restoring_energy_priority", 2)) &&
-    giftCategory === "Action"
+      energyRankAtMost(signals, "restoring_energy_priority", 2))
   ) {
     return UNCOMFORTABLE_BUT_TRUE_TEMPLATES.action_vs_direction;
   }
```

**Condition 8 (stewardship_vs_stagnation):**

```diff
   if (
     dom === "si" &&
     (signalRankAtMost(topCompass, "stability_priority", 5) ||
-      signalRankAtMost(topCompass, "honor_priority", 5)) &&
-    giftCategory === "Stewardship"
+      signalRankAtMost(topCompass, "honor_priority", 5))
   ) {
     return UNCOMFORTABLE_BUT_TRUE_TEMPLATES.stewardship_vs_stagnation;
   }
```

**Conditions 2 and 3 unchanged.** Verify by inspection that neither contains a `giftCategory` clause.

#### `giftCategory` variable cleanup

After the six gate removals, search the function body for any remaining `giftCategory` reference:

- If grep returns zero matches inside `getUncomfortableButTrue`, **remove the `const giftCategory = ...` declaration line** at the top of the function.
- If grep returns any remaining match (unlikely), leave the declaration in place; document in Report Back.

The aux-pair register fetch (`getFunctionPairRegister(stack)`) may also become unused — check and remove if so. Same discipline: only remove if zero remaining readers in the function.

---

### `docs/canon/result-writing-canon.md` — § Rule 5 amendment update

Locate the CC-058 amendment under § Rule 5 (added 2026-05-01) and update the 8-class table to reflect the dropped gates. The locked sentences ship verbatim — this CODEX touches only the **condition columns** of the canon table, not the **sentence columns**.

For each affected row (1, 4, 5, 6, 7, 8), update the condition column to remove the `gift_category` clause. Append a brief CODEX-058b amendment paragraph noting the workshop fix:

```markdown
**CODEX-058b amendment (2026-05-01) — gift_category gates dropped from 6 of 8 conditions.**

Workshop review of CC-058's ship-report surfaced that 6 conditions gated on `gift_category` (an aux-pair-routed label), which over-narrowed selection. `gift_category` is derived from FUNCTION_PAIR_REGISTER and may not match the dominant-function register a condition tests for — concrete: Jason0429 is Ni-dom + knowledge_priority + truth_priority (the canonical context-vs-authority user-shape) but his NiTe aux-pair routes to `gift_category: "Builder"`, which failed condition 1's `Pattern || Discernment` gate. CODEX-058b drops the `gift_category` clause from conditions 1, 4, 5, 6, 7, 8. Conditions 2 and 3 had no `gift_category` gate and are untouched. Each condition's design intent is preserved: select on dominant function + cross-signal Compass / energy / Drive discriminator alone. Locked sentences ship verbatim across the workshop fix.
```

The 8-class table after this update:

| # | Class | Condition (post-CODEX-058b) | Locked sentence (unchanged) |
|---|---|---|---|
| 1 | context_vs_authority | Ni-dom + (knowledge OR truth in Compass top 5) | *"You can confuse having absorbed more context with having earned more authority to conclude."* |
| 2 | pattern_vs_translation | (Ne OR Ni) + (freedom in top 5 OR learning_energy rank ≤ 2) AND condition 1 didn't match | *"You sometimes treat translation as optional because the pattern feels obvious to you."* |
| 3 | claim_vs_allocation | Drive case ∈ {inverted-small, inverted-big} OR allocation-tension firing (T-013/T-014/T-015) | *"You can claim what you haven't yet allocated toward — and the gap between what you name and what your week actually pays for is part of your shape, not a verdict against it."* |
| 4 | conviction_vs_rigidity | Fi-dom + (holds_internal_conviction firing OR truth_priority in Compass top 3) | *"You can confuse what feels true to you with what is true — and the conviction that protects you from social weather is the same conviction that, in the wrong moment, refuses the correction you'd otherwise welcome."* |
| 5 | builder_vs_pause | Te-dom + (creator-agency firing OR system_responsibility_priority in Compass top 5) | *"You can build past the point where the structure has stopped serving the people inside it — and momentum can feel like rightness when it is sometimes just inertia."* |
| 6 | caretaker_vs_self | Fe-dom + (family_priority in Compass top 5 OR caring_energy rank ≤ 2) | *"You can carry the room until the people in it stop seeing what carrying it costs you — and your read of what others need can quietly displace your read of what you need."* |
| 7 | action_vs_direction | Se-dom + (freedom_priority in Compass top 5 OR restoring_energy rank ≤ 2) | *"You can mistake speed for direction — the body knows the situation by being in it, and that knowing can sometimes outrun the question of whether the situation is worth being in."* |
| 8 | stewardship_vs_stagnation | Si-dom + (stability_priority OR honor_priority in Compass top 5) | *"You can mistake guarding what you've kept for refusing what you'd grow into — and continuity, which is your real gift, can quietly become the reason a needed change doesn't happen."* |

---

### `docs/audits/report-calibration-audit-2026-04-29.md` — Rule 5 update

Append a one-line note under § Rule 5's existing CC-058 RESOLVED banner:

> *CODEX-058b workshop fix (2026-05-01) — dropped `gift_category` gates from 6 of 8 conditions to fix a selector miss surfaced in CC-058's ship-report. Locked sentences unchanged.*

Aggregated counts table: leave the existing Rule 5 row alone; the rule is still RESOLVED, the counts haven't changed.

---

## Acceptance

- `npx tsc --noEmit` clean.
- `npm run lint` clean.
- `npm run build` exits 0.
- `getUncomfortableButTrue` source diff shows exactly six clause removals (one per affected condition); no other logic changes.
- `grep -n "giftCategory" lib/identityEngine.ts` shows the variable is either removed (preferred) or still referenced (only if some other internal helper still reads it; unlikely).
- Re-rendered Jason0429 (admin route per CODEX-050) fires **condition 1** (context_vs_authority) — the locked sentence *"You can confuse having absorbed more context with having earned more authority to conclude."* renders italic + ink-mute immediately after the golden sentence.
- A test session that previously fell through silently due to a `gift_category` mismatch now fires the appropriate condition — e.g., a Te-dom user with creator-agency but routed to a non-Builder gift_category now fires condition 5.
- A test session with no matching condition still renders silent (`null` fallback canonical).
- Markdown export carries the same conditional behavior.
- Canon doc § Rule 5 8-class table updated to remove `gift_category` from condition descriptions; CODEX-058b amendment paragraph appended.
- Audit doc § Rule 5 updated with the one-line CODEX-058b note.
- All 8 locked sentences in `UNCOMFORTABLE_BUT_TRUE_TEMPLATES` are byte-identical pre/post diff (no content drift).

---

## Out of scope

- **Rewriting any of the 8 locked sentences.** Locked content; CODEX-058b is gate-removal-only.
- **Adding new conditions or new templates.** v1 floor stays at 8.
- **Changing condition priority order.** First-match-wins order is canonical.
- **Editing condition 2's discriminator** (the Workshop B path β rejected; condition 2 stays freedom/learning-energy only per Jason's Path α lock).
- **Editing condition 3's discriminator** (claim_vs_allocation reads Drive case + tension fires, no gift_category gate to drop).
- **Touching `pickGiftCategory`, `categoryHasSupport`, `getGiftSpecificity`, FUNCTION_PAIR_REGISTER, or any aux-pair routing logic.** Gift-category routing stays intact for every other downstream consumer (Top 3 Gifts composition, Map / Compass card prose, etc.).
- **Touching the polish-layer contract** (`lib/humanityRendering/contract.ts § extractAnchors`). The locked anchor pipeline is unchanged; `mirror.uncomfortableButTrue` still flows into `lockedAnchors[]` per CC-058's wire-in.
- **Touching `MirrorSection.tsx` or `lib/renderMirror.ts`.** Render surfaces unchanged.
- **Engine-side rewrite-track CCs** (Love Map polish, Allocation+Growth Edge, Trust+Responsibility, OCEAN-as-Texture). Out of scope.
- **Adding tests.** No tests on this surface; not adding any here.
- **Removing the `UncomfortableButTrueClass` union** or any of its 8 keys. The class taxonomy is intact; CODEX-058b only loosens the gates.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

Codex equivalent acceptable. **Filed CODEX- per the routing convention because the scope is surgical / mechanical with locked outcome.**

## Execution Directive

Single pass. **Six gate removals, all in `getUncomfortableButTrue` in `lib/identityEngine.ts`. Two doc updates. No prose authored. No content drift on the 8 locked sentences.** If the executor finds a structural surprise (e.g., the local `giftCategory` variable is referenced inside an internal helper not visible from the outer function, blocking removal of the declaration), surface in Report Back rather than restructuring on the fly. **Move prompt to `prompts/completed/` when done.**

## Bash Commands Authorized

- `grep -n "giftCategory\|gift_category" lib/identityEngine.ts`
- `grep -n "getUncomfortableButTrue\|UNCOMFORTABLE_BUT_TRUE_TEMPLATES" lib/identityEngine.ts`
- `grep -rn "gift_category" docs/canon/result-writing-canon.md docs/audits/report-calibration-audit-2026-04-29.md`
- `cat lib/identityEngine.ts | sed -n '4544,4690p'` (or whatever range CC-058's ship-report identified)
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` (smoke; kill before exit)
- `mv prompts/active/CODEX-058b-drop-gift-category-gates.md prompts/completed/CODEX-058b-drop-gift-category-gates.md`
- `git diff --stat`
- `git diff lib/identityEngine.ts`

## Read First (Required)

- `AGENTS.md` (especially the active → completed move convention).
- `prompts/completed/CC-058-mirror-uncomfortable-but-true-slot.md` (the parent CC; the 8 conditions and locked sentences).
- `lib/identityEngine.ts § getUncomfortableButTrue` (the function being edited).
- `lib/identityEngine.ts § FUNCTION_PAIR_REGISTER` (~line 1730 — for reading the aux-pair → gift_category routing that motivates this fix; do not modify).
- `docs/canon/result-writing-canon.md` § Rule 5 (the canon doc being updated; locate the CC-058 amendment and the 8-class table).
- `docs/audits/report-calibration-audit-2026-04-29.md` § Rule 5 (the audit doc being updated; locate the CC-058 RESOLVED banner).

## Allowed to Modify

- `lib/identityEngine.ts` — only `getUncomfortableButTrue` function body (six clause removals + the local `giftCategory` declaration if unused).
- `docs/canon/result-writing-canon.md` — only the § Rule 5 CC-058 amendment region (table column updates + new CODEX-058b amendment paragraph).
- `docs/audits/report-calibration-audit-2026-04-29.md` — only the § Rule 5 RESOLVED banner (one-line CODEX-058b note).
- **No other files.** No type changes, no canon docs beyond the two named, no test files, no engine-logic changes outside the named function, no aux-pair register edits, no polish-layer edits, no UI edits.

## Report Back

1. **Diff** for `getUncomfortableButTrue` showing the six gate removals. Each diff hunk should be a single line removed (the trailing `&& giftCategory === "..."` clause), or two lines for condition 1's compound `(giftCategory === "Pattern" || giftCategory === "Discernment")`.
2. **`giftCategory` variable cleanup** — confirmation that the local declaration was removed (preferred), or explanation if it had to stay. Same for `getFunctionPairRegister(stack)` if it's no longer needed.
3. **Locked sentences verbatim** — confirmation that `UNCOMFORTABLE_BUT_TRUE_TEMPLATES` ships byte-identical pre/post fix. `git diff` of just the templates Record should show zero lines changed.
4. **Canon doc update** — line range showing the 8-class table updated; line range showing the CODEX-058b amendment paragraph appended.
5. **Audit doc update** — line range for the one-line CODEX-058b note under the existing CC-058 RESOLVED banner.
6. **Verification results** — tsc, lint, build all clean.
7. **Manual sweep deferred to Jason** — explicit list:
   - Re-rendered Jason0429 fires condition 1 with the *"absorbed more context vs earned more authority"* sentence in italic + ink-mute.
   - A non-Builder Te-dom user with creator-agency or system_responsibility_priority in Compass top 5 now fires condition 5.
   - A non-Integrity Fi-dom user with holds_internal_conviction or truth_priority in Compass top 3 now fires condition 4.
   - Thin-signal sessions still render silent (null fallback canonical).
   - Markdown export carries the same conditional behavior.
   - Polish-layer A/B harness (when API keys set) preserves the new sentences verbatim.
8. **Any deviation from locked changes** — if a structural surprise required a different approach.
9. **Prompt move-to-completed confirmation.**

---

## Notes for the executing engineer

- This CODEX is purely subtractive. Six clause removals, two doc updates, zero content authored. If the diff shows any added prose or any new function, something has gone wrong.
- The 8 locked sentences in `UNCOMFORTABLE_BUT_TRUE_TEMPLATES` ship byte-identical. If you're tempted to "improve" any of them while you're in the file, don't — that's a future CC's scope.
- The `giftCategory` cleanup is a small linter-pleaser. If there's any internal helper inside the function that still reads `giftCategory` after the gates are dropped, leave the declaration in place and surface in Report Back. Don't refactor the function structure to chase the cleanup.
- Conditions 2 and 3 should remain untouched. Verify by inspection that neither contains a `giftCategory` clause; if either does (unlikely; would mean my CC-058 spec drifted from what shipped), surface in Report Back rather than silently extending this CODEX's scope.
- Per the routing convention the prompt file moves to `prompts/completed/` when shipped. Explicit reminder.
- Pre-CODEX-058b saved sessions re-render against current engine code on admin load; no migration needed.
