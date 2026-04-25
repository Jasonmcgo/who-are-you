# CC-003 — Signal Library Inventory (Revise and Reconcile)

## Goal

Revise and reconcile the existing `docs/canon/signal-library.md` against canon and runtime. A v0 draft of this file already exists on disk. CC-003 is an audit-and-revise pass against canon (`question-bank-v1.md`, `tension-library-v1.md`, `signal-and-tension-model.md`, `card-schema.md`) and runtime (`lib/identityEngine.ts`, `data/questions.ts`, `lib/types.ts`).

This is documentation and inventory only. Do not change application behavior. Do not modify any code file. Do not modify any canon file other than `signal-library.md`.

---

## Read First (Required)

- docs/canon/signal-library.md (existing v0 draft — start here; do not assume it is correct)
- docs/canon/question-bank-v1.md
- docs/canon/tension-library-v1.md
- docs/canon/signal-and-tension-model.md
- docs/canon/card-schema.md
- docs/canon/freeform-signal-extraction.md
- lib/identityEngine.ts
- lib/types.ts
- data/questions.ts

---

## Context

A v0 of `docs/canon/signal-library.md` already exists. It was drafted quickly and uses a three-value status taxonomy (`active | pending | deprecated`) that conflates orphan signals with dead references. It also uses a singular `card_source` field that loses information for cross-card signals.

CC-003 rewrites that file to:

- use the four-value taxonomy below,
- use `primary_cards` (plural) so cross-card signals can list every card that produces them,
- verify every signal entry against current canon and current runtime, and
- separate blocked tensions into three distinct categories (canon blocker, runtime blocker, question-design blocker) with remediation paths.

The executor **must treat the v0 file as a starting reference, not ground truth**. If the v0 file contains an entry that canon does not support (for example, a signal used by a tension that doesn't actually reference it), the entry is wrong and must be corrected.

---

## Requirements

### 1. Status taxonomy (four values)

Every signal must have exactly one status:

- **active** — produced by at least one canonical question AND used by at least one canonical tension.
- **pending** — referenced by a canonical tension but not produced by any canonical question. Also known as a dead reference. The referencing tension cannot fire through that branch.
- **unused** — produced by a canonical question (or the runtime freeform extractor) but not consumed by any canonical tension. Also known as an orphan.
- **deprecated** — formally removed from canon. Retained only so historical references remain explicable. Use only if explicitly discovered.

A signal cannot be both `pending` and `unused`. If you find a case where a signal is both tension-referenced-without-a-question AND question-emitted-without-a-tension (i.e. different questions and tensions disagree about the signal's wiring), report it as a separate anomaly under Recommendations and choose the status that reflects the larger structural problem (usually `pending`).

### 2. Per-signal entry schema

Every signal must be documented with every one of these fields. No field may be omitted:

- `signal_id`
- `description`
- `primary_cards` (list — every card that any producing question belongs to; use `—` only for dead references)
- `produced_by_questions` (list of question_ids; `—` for dead references)
- `used_by_tensions` (list of tension_ids; `—` for orphans)
- `implementation_status` (one of active | pending | unused | deprecated)
- `notes` (free text — required when there is a runtime-vs-canon gap, a cross-card situation, or a tension-specific sourcing constraint; may be empty otherwise)

Cross-card handling: if a signal is produced by questions on multiple cards (e.g., `truth_priority` from Q-C2 and Q-S1), list every card in `primary_cards`. Do not pick one.

Runtime-vs-canon handling: if a signal is canonically produced (its question is in `question-bank-v1.md`) but the producing question is not implemented in `data/questions.ts`, the `notes` field must state this explicitly. Example: "Canonically produced by Q-C4; Q-C4 is not implemented in `data/questions.ts`, so this signal is not emitted at runtime."

Same rule for signals canonically assigned to a freeform question that the runtime extractor does not emit (e.g., `cost_awareness` on Q-I3).

### 3. Required sections of `signal-library.md`

In this order:

1. **Overview** — purpose, canonical rules, status definitions.
2. **Signals — by card** — per-card sections with every signal for that card. Cross-card signals appear once under their earliest card and are pointed to from later cards.
3. **Active Signals** — summary list of all `active` signals.
4. **Pending Signals** — summary list of all `pending` signals (dead references). Include the tension(s) that reference each.
5. **Unused Signals** — summary list of all `unused` signals (orphans). Include the question(s) that produce each.
6. **Deprecated Signals** — summary list, or a one-line statement that none exist.
7. **Tensions Blocked by Missing Signals** — see §4.
8. **Signals Produced but Not Used** — summary list (same set as Unused Signals; this section frames it tension-forward rather than signal-forward, noting the loss to the system).
9. **Recommendations for CC-004** — see §5.

### 4. Blocked-tension categorization (three types)

Every tension that cannot currently fire must be classified into exactly one of:

- **Canon blocker** — the tension's required signals include at least one that no canonical question produces, and no OR-alternative is canonically produced either. The tension cannot fire under any combination of canonical answers, independent of code. **Remediation path must describe the canon edit needed** (e.g., "add a question producing `institutional_trust` or rewrite T-004 to remove the institutional signal requirement").
- **Runtime blocker** — every required signal exists in canon, but at least one producing question is absent from `data/questions.ts`. The tension is canonically firable but runtime-dead. **Remediation path must name the missing question(s)** (e.g., "implement Q-P3 in `data/questions.ts`").
- **Question-design blocker** — every required signal exists in canon AND at runtime, but the question bank's structure prevents the required signals from co-occurring in a single session (e.g., a single-choice forced question that lists multiple required signals as mutually exclusive options). **Remediation path must name both the structural issue and a plausible fix** (e.g., "Q-S1 is single-choice, cannot emit more than one sacred-value signal per session; fix options: restructure Q-S1 as ranked or multi-select, or add Q-S2 paired with Q-S1, or rewrite T-012 with OR semantics").

Each blocked tension entry must include: `tension_id`, `blocker_type`, `missing_signals` (or the co-occurrence obstruction), `remediation_path`.

### 5. CC-004 recommendations — scope constraint

Recommendations must be **unblocking moves for already-canonical signals or tensions**. Do not recommend:

- new tensions
- new signals that do not already appear in canon or in the engine
- new questions beyond those already defined in `question-bank-v1.md`
- UI changes
- persistence changes
- architectural changes

Permitted recommendations:

- implement an existing canonical question in `data/questions.ts` (runtime-gap remediation)
- add a question whose signals are already referenced by a canonical tension (canon-blocker remediation for tensions with dead-reference signals)
- restructure an existing canonical question to enable co-occurrence (question-design-blocker remediation)
- rewrite a canonical tension's signal requirements to OR-semantics using signals that are already canonical (tension-side remediation)
- add the missing branch to the runtime freeform extractor for a canonically-assigned signal (e.g., `cost_awareness`)
- kill a dead OR-branch in engine code if the signal it references is never produced

Each recommendation must name the specific canonical entity it unblocks.

### 6. Specific Checks

Confirm the current status of each signal below. Each must appear in the final file with a defensible status. Cite the canon line(s) that justify the status.

- `strong_independent_conviction`
- `institutional_trust`
- `institutional_skepticism`
- `institutional_distrust`
- `individual_responsibility`
- `systemic_responsibility`
- `balanced_responsibility`
- `relational_investment`
- `stability_restoration`
- `exploration_drive`
- `conviction_under_cost`
- `cost_awareness`
- `independent_thought_signal`
- `epistemic_flexibility`
- `doubt_self_when_respected_people_disagree`

---

## Allowed to Modify

- `docs/canon/signal-library.md` (revise in full to meet this specification)

Do **not** modify:

- `lib/identityEngine.ts`
- `lib/types.ts`
- `data/questions.ts`
- `app/page.tsx`
- `docs/canon/question-bank-v1.md`
- `docs/canon/tension-library-v1.md`
- `docs/canon/signal-and-tension-model.md`
- `docs/canon/card-schema.md`
- `docs/canon/inner-constitution.md`
- `docs/canon/signal-mapping-rule.md`
- `docs/canon/foundational-system.md`
- `docs/canon/question-design-standard.md`
- `docs/canon/engine-building-blocks.md`
- `docs/canon/freeform-signal-extraction.md`
- `docs/canon/freeform-extraction-prompt.md`
- any other file in the repository

---

## Out of Scope

- Any code change.
- Any other canon change.
- Inventing new signals not already present in canon or engine.
- Implementing new tensions.
- Adding new questions.
- Changing the runtime signal extractor (freeform keyword rules).
- Persistence, UI changes, architectural changes.
- Opinions on whether a tension should exist; CC-003 only inventories what canon says.
- Cross-referencing older prompts (CC-0001) or unimplemented design documents.

---

## Acceptance Criteria

1. `docs/canon/signal-library.md` has been revised in place.
2. Every signal that appears in `question-bank-v1.md` is in the file.
3. Every signal that appears in `tension-library-v1.md` is in the file.
4. Every signal referenced by `lib/identityEngine.ts` is in the file.
5. Every signal has exactly one status value, drawn from `active | pending | unused | deprecated`.
6. Every signal has a non-empty `primary_cards` list (or explicit `—` for dead references only).
7. Every signal that is canonically produced but whose producing question is not in `data/questions.ts` has a `notes` field that says so explicitly.
8. Every signal canonically assigned to a freeform question but not emitted by the runtime extractor has a `notes` field that says so explicitly (including `cost_awareness`).
9. Every signal listed in §6 Specific Checks has a defensible status with canon-line justification in its notes.
10. Every tension in `tension-library-v1.md` that cannot currently fire has an entry in §7 Tensions Blocked by Missing Signals, categorized as exactly one of: canon blocker, runtime blocker, question-design blocker. Each entry includes `tension_id`, `blocker_type`, `missing_signals` (or obstruction), and a `remediation_path`.
11. §9 Recommendations for CC-004 contain only unblocking moves for already-canonical signals or tensions, per §5.
12. No code file has been modified. No canon file other than `signal-library.md` has been modified.

---

## Report Back

Provide the following, in this order:

1. **Files changed** — `docs/canon/signal-library.md` only. One-line description of the nature of the revision.
2. **Total signals inventoried** — integer.
3. **Active signals count** — integer.
4. **Pending signals count** — integer.
5. **Unused signals count** — integer.
6. **Deprecated signals count** — integer.
7. **Specific Checks table** — for each of the 15 signals in §6, report: current status, producing questions, consuming tensions, and a one-line justification.
8. **Tensions currently blocked** — list with blocker_type and remediation_path for each.
9. **Deltas from the v0 draft** — bullet list of substantive changes the revision made to the file as it stood before CC-003 (e.g., "renamed `card_source` to `primary_cards`", "reclassified `belonging_priority_high` from `pending` to `unused`").
10. **Recommendations for CC-004** — each one naming the canonical entity it unblocks.
11. **Risks / anomalies** — anything the audit surfaced that does not fit the four-status taxonomy, contradicts canon, or suggests a deeper reconciliation pass is needed.
