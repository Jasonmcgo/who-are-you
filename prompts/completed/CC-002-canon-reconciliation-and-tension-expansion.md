# CC-002 — Canon Reconciliation and Tension Expansion

## Goal

Restore alignment between code and canon, then light up existing canonical tensions whose required signals already exist in the question set.

- No new tension types.
- No new signals.
- No new questions beyond what canon reconciliation requires.
- No architectural changes.

---

## Read First (Required)

- docs/canon/question-bank-v1.md
- docs/canon/tension-library-v1.md
- docs/canon/signal-and-tension-model.md
- docs/canon/inner-constitution.md
- docs/canon/signal-mapping-rule.md
- lib/identityEngine.ts
- data/questions.ts

---

## Context

CC-001 built a deterministic signal/tension engine and a freeform layer. A canon review identified two drifts and a set of free-value tension detections that were never wired up. CC-002 addresses both.

Drifts to reconcile:

1. **Q-A2 is in code and runs at runtime, but is not defined in `docs/canon/question-bank-v1.md`.** Three signals (`relational_investment`, `stability_restoration`, `exploration_drive`) exist only because Q-A2 produces them — they have no canonical home.
2. **T-006 detection in code requires `proactive_creator` from Q-A2 AND (`responsibility_maintainer` OR `reactive_operator`) from Q-A1.** The canon T-006 entry does not specify this paired-question sourcing. The constraint is sound (aspiration vs. current reality), but it must be written down.

Free tensions (all required signals already produced by existing questions):

- **T-007 Family vs Truth** — `family_priority` (Q-S1), `truth_priority_high` (Q-C1) OR `truth_priority` (Q-S1).
- **T-008 Order vs Reinvention** — `order_priority` (Q-C3) OR `stability_priority` (Q-S1); `freedom_priority` (Q-C3 / Q-S1) OR `proactive_creator` (Q-A1 / Q-A2).
- **T-010 Inherited Stability vs Present Chaos** — `stability_baseline_high` (Q-F2); `high_pressure_context` (Q-X1) OR `reactive_operator` (Q-A1).

Tension that looks free but is not:

- **T-012 Sacred Value Conflict** requires four sacred-value signals (`family_priority`, `freedom_priority`, `truth_priority`, `stability_priority`) with no OR between them. Q-S1 is a single-choice forced question — a user can produce exactly one of those four per session. T-012 cannot fire with the current question bank. Do **not** implement T-012 in CC-002. Report the gap; propose no fix (fix belongs in a later CC).

---

## Requirements

### 1. Canon: add Q-A2 to `docs/canon/question-bank-v1.md`

Insert Q-A2 immediately after Q-A1 under the "Agency Card (What You Actually Do)" section. Use exactly the existing question-bank format (mirror Q-A1's field order, indentation, and trailing `---` separator).

Use the Q-A2 definition already live in `data/questions.ts`:

```
## Q-A2

- card_id: agency
- type: forced
- question: If your obligations were lighter, where would your energy naturally go?
- options:
  - Building or creating something new
  - Deepening relationships and care
  - Restoring order and stability
  - Exploring, learning, or wandering
- signals:
  - proactive_creator
  - relational_investment
  - stability_restoration
  - exploration_drive
```

The three new signals (`relational_investment`, `stability_restoration`, `exploration_drive`) become canonical by appearing in this `signals:` block — this matches how every other signal in the bank is registered. No separate signal-library file is needed.

Do **not** renumber or edit any other question.

### 2. Canon: add T-006 paired-question sourcing rule

Update T-006 in `docs/canon/tension-library-v1.md` to document the sourcing constraint enforced by the code. Two coupled edits:

**2a.** In the T-006 block in `docs/canon/tension-library-v1.md`, add a `Source Questions:` field immediately after the `Signals:` block, before the `Description:` block. Preserve the existing Signals / Description / User Prompt lines verbatim. Target state:

```
## T-006 Creator vs Maintainer

Signals:
- proactive_creator
- responsibility_maintainer OR reactive_operator

Source Questions:
- proactive_creator must come from Q-A2 (aspiration)
- responsibility_maintainer or reactive_operator must come from Q-A1 (current reality)

Description:
The user may see themselves as a builder or creator, while current life demands keep them in maintenance or reaction mode.

User Prompt:
This pattern may be present: part of you wants to build, but much of your life may be spent maintaining or reacting. Does this feel accurate?
```

**2b.** In `docs/canon/signal-and-tension-model.md`, add a short section (heading `## Source Question Constraints`) explaining that some tensions require a signal to originate from a specific `question_id`, and that this is expressed via a `Source Questions:` field in the tension block. One paragraph is enough. Do not restructure the existing tension object schema.

Do **not** add `Source Questions:` to any tension other than T-006 in this CC.

### 3. Code: implement T-007, T-008, T-010 in `lib/identityEngine.ts`

Add three detection blocks inside `detectTensions(signals: Signal[])`, after the existing T-006 block and before the existing T-011 block. Use the same pattern as the existing blocks (`has(...)`, `ref(...)`, `tensions.push({...})`).

Copy `description` and `user_prompt` **verbatim** from `docs/canon/tension-library-v1.md`. Use `confidence: "medium"` and `status: "unconfirmed"`, matching the existing blocks.

Canonical signal combinations (from `tension-library-v1.md`):

- **T-007 Family vs Truth**: `family_priority` AND (`truth_priority_high` OR `truth_priority`).
- **T-008 Order vs Reinvention**: (`order_priority` OR `stability_priority`) AND (`freedom_priority` OR `proactive_creator`).
- **T-010 Inherited Stability vs Present Chaos**: `stability_baseline_high` AND (`high_pressure_context` OR `reactive_operator`).

`from_card` fallback for `ref(...)` calls, per canon:

- `family_priority`, `truth_priority`, `freedom_priority`, `stability_priority` → `"sacred"`
- `truth_priority_high` → `"conviction"`
- `order_priority` → `"conviction"`
- `proactive_creator`, `reactive_operator`, `responsibility_maintainer` → `"agency"`
- `stability_baseline_high` → `"formation"`
- `high_pressure_context` → `"context"`

When a tension's left or right side is an OR, pick the actually-present signal deterministically in the order written in the canon (matches the T-005 / T-011 pattern already in code).

Do **not** change any existing tension block. Do **not** change the function signature, the signal derivation pipeline, or the `InnerConstitution` shape.

### 4. Code: T-006 — no change required

The existing T-006 block (currently lines ~240–265 of `lib/identityEngine.ts`) already implements the paired-question sourcing rule via `hasFromQuestion`. Leave it as is. Requirement 2 is a documentation-only change; the code is already in the desired state.

### 5. Verification

- `npx tsc --noEmit` — must pass with no output.
- `npm run lint` — must pass with no output beyond the script banner.
- Manual smoke test via `npm run dev`:
  - Answer Q-S1 = "Family" and Q-C1 = "Misunderstood but correct" → T-007 must appear in "Possible Tensions".
  - Answer Q-C3 = "Stability and order" and Q-A1 = "Building or creating" → T-008 must appear.
  - Answer Q-F2 = "Stable and predictable" and Q-X1 = "Overwhelming or stretched" → T-010 must appear.
  - T-001, T-002, T-005, T-006, T-011 must still fire from their existing triggers. Spot-check at least one to confirm no regression.

---

## Allowed to Modify

- `docs/canon/question-bank-v1.md` (append Q-A2 only)
- `docs/canon/tension-library-v1.md` (add `Source Questions:` block to T-006 only)
- `docs/canon/signal-and-tension-model.md` (append one short section explaining Source Question Constraints)
- `lib/identityEngine.ts` (add T-007, T-008, T-010 detection blocks only)

Do **not** modify:

- `lib/types.ts`
- `data/questions.ts`
- `app/page.tsx`
- Any other canon file
- Any other code file

---

## Out of Scope

- localStorage or any persistence of confirmations.
- Signal strength logic — leave `strength: "medium"` everywhere.
- Any change to freeform keyword extraction.
- Real AI / LLM freeform extraction.
- UI changes of any kind.
- New questions (other than Q-A2, which is already live in code — CC-002 only adds it to canon).
- New signals (the three from Q-A2 become canonical via requirement 1; no others).
- New tension types.
- Implementing T-012 or any other un-implemented tension beyond T-007 / T-008 / T-010.
- T-003, T-004, T-009 — blocked on signals that do not exist; not in scope.
- Card object structs per `docs/canon/card-schema.md`.
- Cost_awareness or any other secondary freeform signal.

---

## Acceptance Criteria

1. `docs/canon/question-bank-v1.md` contains a Q-A2 block matching the definition in §1, placed immediately after Q-A1, with no other edits to the file.
2. `docs/canon/tension-library-v1.md` T-006 block contains a `Source Questions:` field positioned between `Signals:` and `Description:`, with the exact two lines shown in §2a. No other tension block is modified.
3. `docs/canon/signal-and-tension-model.md` contains a new section titled `Source Question Constraints` explaining the convention. Existing schema and prose are unchanged.
4. `lib/identityEngine.ts` contains three new detection blocks for T-007, T-008, and T-010 inside `detectTensions`. Description and user_prompt strings are byte-for-byte identical to canon.
5. The existing T-001, T-002, T-005, T-006, T-011 detection blocks are unchanged.
6. `npx tsc --noEmit` passes cleanly.
7. `npm run lint` passes cleanly.
8. The three smoke-test answer combinations in §5 each produce the expected tension.
9. No file outside the "Allowed to Modify" list has been edited.

---

## Report-Back Format

Return a single markdown block with the following sections, in this order:

**Files changed** — one bullet per file, short description of the edit.

**Canon reconciliation** — confirm (a) Q-A2 is now in canon, (b) T-006 sourcing rule is documented, (c) the three new signals are canonical via Q-A2's `signals:` field. Quote the final Q-A2 block and the final T-006 block as written.

**Tensions now detectable** — list T-007, T-008, T-010 with a one-line note on the signal combination each fires on.

**Smoke-test results** — pass/fail for each of the three combinations in §5, plus one regression spot-check.

**Checks** — output of `npx tsc --noEmit` and `npm run lint`.

**T-012 status** — restate that T-012 cannot fire with the current question bank (Q-S1 single-choice), confirm it was not implemented, and name the blocker so a future CC can address it.

**Risks / next-step recommendations** — same format as prior CC report-backs.
