# CC-005a — Temperament Canonical Rules Alignment

## Goal

Align rules 1, 2, and 5 of the **Canonical Rules section** in `docs/canon/temperament-framework.md` with the rank-aware Temperament model that CC-005 introduced. Rules 3, 4, 6, and 7 remain accurate and stay verbatim.

After CC-005 rewrote §6 Signal Family, §4 derivation, §7 tension hooks, and §8 question design principles, the protected Canonical Rules section still references the previous forced-choice / 24-signal model. CC-005a fixes that drift. **One file. One section. No other canon or code touched.**

Specifically:

- Rule 1 should reference the eight bare function signal ids (`ni`, `ne`, `si`, `se`, `ti`, `te`, `fi`, `fe`) and the new `ranking` question type.
- Rule 2 should describe a complete Temperament session as 32 function-signal records (8 functions × 4 appearances each), not "exactly one signal per function."
- Rule 5 should mark `decision_friction` as deferred / unused pending CC-009, not as a forced-choice "Can't choose" output.

The Purpose section's last bullet has the same drift class but is **explicitly out of scope for CC-005a**. If addressed at all, it lives in a separate future CC.

---

## Execution Directive

Complete every requirement in a single pass and deliver the full report-back at the end. Do **not** pause mid-execution to ask the user for confirmation, approval, scope clarification, or any additional input. This prompt is self-contained.

If something is genuinely ambiguous, apply the most canon-faithful interpretation and flag the decision in the Risks / next-step recommendations section of the report-back — do not halt to ask.

If a prerequisite appears missing (a referenced file is absent, a check fails, a canon block has drifted since this prompt was written), attempt the canon-faithful equivalent, record the discrepancy in the report, and continue. Do not stop short.

Do not truncate the work to request user review. Only the final report-back goes to the user.

---

## Read First (Required)

- docs/canon/temperament-framework.md (the file being edited; read in full first)
- docs/canon/card-schema.md (post-CC-005; documents the `ranking` question type and the 4-item cap referenced by the new rules)
- docs/canon/signal-mapping-rule.md (post-CC-005; documents the rank-to-strength mapping referenced by the new rules)
- docs/canon/signal-and-tension-model.md (post-CC-005; documents the `rank` field and rank-aware signal convention)
- docs/canon/signal-library.md (post-CC-005; documents the `rank_aware` schema field)

---

## Context

CC-005 rewrote the operational body of `temperament-framework.md` to use the rank-aware design (8 function signals, ranking questions, voice-styled options, no forced-choice probes). Per CC-005's allowed-modify scope, the Canonical Rules section was preserved verbatim.

Clarence's CC-005 report-back flagged this as Risk 1: rules 1, 2, and 5 now contradict §6 / §8 of the same file. CC-005a fixes only those three rules. The Purpose section's last bullet has the same drift class but is deliberately deferred to a future CC to keep this pass narrow.

After CC-005a lands, CC-006 (Q-S1 + Q-S2 ranked Sacred) can proceed cleanly.

---

## Requirements

### 1. Update Canonical Rules — rule 1

Replace rule 1 verbatim. Current text:

> 1. Every Temperament question must map its non-"Can't choose" options to function signals per the naming convention in Signal Family. Options emitting non-Temperament signals are rejected at canon review.

New text:

> 1. Every Temperament question is `type: ranking` per `card-schema.md` § Question Types. Each item in the ranking emits one of the eight canonical function signals (`ni`, `ne`, `si`, `se`, `ti`, `te`, `fi`, `fe`) per the naming convention in §6 Signal Family. Items emitting non-Temperament signals are rejected at canon review.

### 2. Update Canonical Rules — rule 2

Replace rule 2 verbatim. Current text:

> 2. A Temperament session emits exactly one signal per function. Sessions producing fewer than eight function signals are invalid and should not be used for tension detection or MBTI derivation.

New text:

> 2. A Temperament session emits 32 function-signal records — 8 function ids × 4 appearances each (Ni / Ne / Si / Se across Q-T1–Q-T4; Ti / Te / Fi / Fe across Q-T5–Q-T8). Sessions producing fewer are invalid and must not be used for stack derivation or MBTI labeling. Each record carries a `rank` field per `signal-mapping-rule.md` § Ranking Question Signal Emission.

### 3. Update Canonical Rules — rule 5

Replace rule 5 verbatim. Current text:

> 5. `decision_friction` is never a function signal. It does not occupy a stack position. It is not used to compute the MBTI label.

New text:

> 5. `decision_friction` is never a function signal. It does not occupy a stack position and is not used to compute the MBTI label. As of CC-005 the signal is registered as `unused` pending the CC-009 design call on whether ranked Temperament questions should expose a "hard to choose" opt-out. If CC-009 authorizes the opt-out, this rule still applies — `decision_friction` returns to `active` but remains outside the function family and outside stack derivation.

### 4. Preserve rules 3, 4, 6, 7 verbatim

Do not modify rules 3, 4, 6, or 7. They remain accurate under the rank-aware design.

### 5. Cross-reference check after edit, scoped to the Canonical Rules section

Re-read the Canonical Rules section after the three rule rewrites. Verify, **only within that section**:

- No remaining instance of the strings "non-\"Can't choose\"", "exactly one signal per function", or "fewer than eight function signals". These were the dropped fragments from rules 1, 2, 5.
- No reference to the old `{function}_{position}` family (e.g. `ni_dominant`, `se_inferior`) inside the rules.
- The strings `ni`, `ne`, `si`, `se`, `ti`, `te`, `fi`, `fe` are spelled identically wherever they appear in the rules.
- The rules' references to the new design (`type: ranking`, the 8 function signals, the 32-record session count, the deferred `decision_friction`) are consistent with §6 Signal Family, §4 derivation, §7 tension hooks, and §8 question design principles in the same file.

Do **not** scan or edit any other section of the file. The Purpose section's last bullet has the same drift class but is intentionally out of scope for CC-005a.

---

## Allowed to Modify

- `docs/canon/temperament-framework.md` — **Canonical Rules section only**, and within that section only rules 1, 2, and 5. No other rule, no other section.

Do **not** modify:

- Any other section of `docs/canon/temperament-framework.md` — Purpose, Canonical Scope, Eight Cognitive Functions §3, Function Stacks §4, Canonical Stack Table, Pressure Patterns §5, Signal Family §6, Tension Hooks §7, Question Design Principles §8, Deferred Layers. The Purpose section's last bullet has matching drift but is intentionally out of scope here.
- `docs/canon/card-schema.md`
- `docs/canon/question-bank-v1.md`
- `docs/canon/signal-mapping-rule.md`
- `docs/canon/signal-and-tension-model.md`
- `docs/canon/signal-library.md`
- `docs/canon/tension-library-v1.md`
- `docs/canon/inner-constitution.md`
- `docs/canon/foundational-system.md`
- `docs/canon/freeform-signal-extraction.md`
- `docs/canon/freeform-extraction-prompt.md`
- `docs/canon/question-design-standard.md`
- `docs/canon/engine-building-blocks.md`
- `lib/types.ts`, `lib/identityEngine.ts`, `data/questions.ts`
- `app/page.tsx` and any file under `app/`
- Any file under `prompts/`
- Any file under `docs/` other than `docs/canon/temperament-framework.md`
- `AGENTS.md`, `CLAUDE.md`, `README.md`, `package.json`, any other root-level file

---

## Out of Scope

- The Purpose section, including the stale last bullet about forced-choice questions and the `decision_friction` "Can't choose" convention. Same drift class as the rules being fixed; deliberately deferred to keep this pass narrow.
- Any other section of `temperament-framework.md` (§3 functions, §4 stack table, §5 grip patterns, §6 signal family, §7 tension hooks, §8 question design, Deferred Layers, Canonical Scope).
- Adding any ranking question, break entry, signal entry, or tension to canon. Those land in CC-006 / CC-007 / CC-008 / CC-009 per the post-lock CC sequence.
- Re-litigating CC-005's design decisions. CC-005a only aligns three rules with the body CC-005 already rewrote.
- Touching any code file or any other canon file. CC-005a is single-file, single-section.
- Promoting `decision_friction` to `active` or removing it. Its status stays `unused` per CC-005's lock; CC-009 decides.
- Reintroducing the `{function}_{position}` family or any "Can't choose" forced-choice convention. Both are formally out per CC-005.

---

## Acceptance Criteria

1. Canonical Rules § rule 1 reads exactly as written in §1 of this CC.
2. Canonical Rules § rule 2 reads exactly as written in §2 of this CC.
3. Canonical Rules § rule 5 reads exactly as written in §3 of this CC.
4. Rules 3, 4, 6, 7 are unchanged byte-for-byte.
5. No instance of the strings "non-\"Can't choose\"", "exactly one signal per function", or "fewer than eight function signals" remains inside the Canonical Rules section. No reference to `{function}_{position}` inside the Canonical Rules section.
6. The Purpose section is unchanged byte-for-byte.
7. Every other section of `temperament-framework.md` is unchanged byte-for-byte.
8. No file outside `docs/canon/temperament-framework.md` has been edited.
9. No code file has been touched.
10. The running app's behavior is unchanged after CC-005a.

---

## Report Back

Return a single markdown block with the following sections, in order:

1. **Files changed** — should be exactly one: `docs/canon/temperament-framework.md`. One-line description of the edit.
2. **Canonical Rules deltas** — quote rules 1, 2, 5 in the form "before / after" so the diff is visible. Confirm rules 3, 4, 6, 7 are unchanged byte-for-byte.
3. **Drift-fragment sweep** — confirm the three banned strings (`non-"Can't choose"`, `exactly one signal per function`, `fewer than eight function signals`) and the `{function}_{position}` family no longer appear inside the Canonical Rules section. Report any other drift fragment surfaced inside the Canonical Rules section and how it was resolved.
4. **Cross-section consistency** — one paragraph confirming the Canonical Rules section now refers to the same model as §6 Signal Family, §4 derivation, §7 tension hooks, and §8 question design principles (ranking, 8 function signals, deferred `decision_friction`).
5. **Scope-creep check** — explicit confirmation that:
   - Only the Canonical Rules section of `docs/canon/temperament-framework.md` was edited.
   - The Purpose section is unchanged byte-for-byte (its drift was deliberately left in place).
   - No code file was touched.
   - No other canon file was touched.
   - No new question, break, signal entry, or tension was added.
   - The eight function descriptions in §3, the Canonical Stack Table in §4, the grip descriptions in §5, §6 Signal Family, §7 Tension Hooks, §8 Question Design Principles, and the Deferred Layers section are byte-identical to their pre-CC-005a state.
6. **Risks / next-step recommendations** — any drift you noticed elsewhere in the canon that this CC did not address. The Purpose section's last bullet is the obvious one (already known and deferred). Other likely candidates: stale references to forced-choice Temperament in `inner-constitution.md`, `signal-library.md` notes, or `question-design-standard.md`. Flag without acting.
