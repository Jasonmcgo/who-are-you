# CC-006 — Sacred Ranked Questions (Q-S1 + Q-S2)

## Goal

Land the canonical Sacred Values content under the rank-aware design CC-005 authorized. Three canon files change; **no code is touched**.

After CC-006:

- **Q-S1** is replaced. New shape: `type: ranking`, four items (Freedom / Truth / Stability / Loyalty), prompt `"Order these by what you'd protect first when something has to give."` Family is removed from Q-S1 — it moves to Q-S2.
- **Q-S2** is added. `type: ranking`, four items (Family / Knowledge / Justice / Faith), prompt `"Order these by which has the strongest claim on you."`
- **Three new signals** are registered: `knowledge_priority`, `justice_priority`, `faith_priority`. All `rank_aware: true`, `primary_cards: [sacred]`.
- **Five existing sacred-family signals** are flipped to `rank_aware: true`: `freedom_priority`, `truth_priority`, `stability_priority`, `family_priority`, `loyalty_priority`. Cross-card metadata is updated where producers change.
- **T-012 Sacred Value Conflict** is rewritten to use rank-aware semantics: fires when at least two distinct sacred `*_priority` signals are present at rank ≤ 2 across Q-S1 and Q-S2 combined.

No questions, signals, or tensions outside the sacred family change. No data file or code file is modified.

---

## Execution Directive

Complete every requirement in a single pass and deliver the full report-back at the end. Do **not** pause mid-execution to ask the user for confirmation, approval, scope clarification, or any additional input. This prompt is self-contained.

If something is genuinely ambiguous, apply the most canon-faithful interpretation and flag the decision in the Risks / next-step recommendations section of the report-back — do not halt to ask.

If a prerequisite appears missing (a referenced file is absent, a check fails, a canon block has drifted since this prompt was written), attempt the canon-faithful equivalent, record the discrepancy in the report, and continue. Do not stop short.

Do not truncate the work to request user review. Only the final report-back goes to the user.

---

## Read First (Required)

Canon (in scope or referenced):

- docs/canon/question-bank-v1.md
- docs/canon/signal-library.md
- docs/canon/tension-library-v1.md
- docs/canon/card-schema.md (post-CC-005; documents the `ranking` type and the 4-or-5-items rule referenced here)
- docs/canon/signal-mapping-rule.md (post-CC-005; documents the rank-to-strength mapping)
- docs/canon/signal-and-tension-model.md (post-CC-005; documents the `rank` field and rank-aware signal convention)

Reference (locked decisions; not edited):

- docs/open-design-calls.md (Section 1 — Sacred Values lock)
- docs/option-glosses-v1.md (locked Q-S1 glosses + locked Q-S2 glosses + Locked-2026-04-25 note)
- docs/design-spec-v1.md (§ 3 ranking primitive, § 7 data shapes)

---

## Context

`docs/open-design-calls.md` § 1 locked the Sacred Values redesign on 2026-04-24. CC-006 is the canonical implementation. The split places the four "personal-conduct" sacred values (Freedom / Truth / Stability / Loyalty) in Q-S1 and the four "larger-than-self" sacred values (Family / Knowledge / Justice / Faith) in Q-S2. Each user ranks each question 1–4. Eight rank-aware sacred signals total emit per session.

T-012 Sacred Value Conflict was previously unfireable — the existing rule required all four `family_priority`, `freedom_priority`, `truth_priority`, `stability_priority` simultaneously, but Q-S1 was forced single-choice and produced exactly one. CC-006 makes T-012 fireable by switching to rank-aware semantics.

CC-006 is canon-only, consistent with the canon-first rhythm CC-005 established. The matching code work — adding the `ranking` Question variant to `lib/types.ts`, the engine's rank-derivation pass to `lib/identityEngine.ts`, the React ranking primitive component, and the `data/questions.ts` migration — lives in subsequent CCs and is **explicitly out of scope here**.

---

## Requirements

### 1. Replace Q-S1 in `question-bank-v1.md`

The existing Q-S1 forced-choice block is removed and replaced. Target final state:

```
## Q-S1

- card_id: sacred
- type: ranking
- question: Order these by what you'd protect first when something has to give.
- helper: Four of your own. Rank by which holds first when two of them pull apart.
- items:
  - id: freedom
    label: Freedom
    gloss: the ability to act without needing permission.
    signal: freedom_priority
  - id: truth
    label: Truth
    gloss: what's actually so, even when it costs.
    signal: truth_priority
  - id: stability
    label: Stability
    gloss: steady ground, for you and the people who rely on you.
    signal: stability_priority
  - id: loyalty
    label: Loyalty
    gloss: staying with your people through what comes.
    signal: loyalty_priority
```

Notes:
- `Family` is intentionally removed from Q-S1. It moves to Q-S2 (§2).
- `Loyalty` is intentionally added to Q-S1. It is already canonical via Q-C2 (`loyalty_priority`); Q-S1 becomes a second producer.
- Glosses are byte-for-byte from `docs/option-glosses-v1.md` § Q-S1.

### 2. Add Q-S2 to `question-bank-v1.md`

Insert immediately after Q-S1, in the Sacred Values Card section. Target final state:

```
## Q-S2

- card_id: sacred
- type: ranking
- question: Order these by which has the strongest claim on you.
- items:
  - id: family
    label: Family
    gloss: the people who are yours, and to whom you are theirs.
    signal: family_priority
  - id: knowledge
    label: Knowledge
    gloss: what's actually known, and the discipline of seeking more.
    signal: knowledge_priority
  - id: justice
    label: Justice
    gloss: fair weight, even when it costs you to give it.
    signal: justice_priority
  - id: faith
    label: Faith
    gloss: trust in what's larger than you, however you frame it.
    signal: faith_priority
```

Notes:
- No `helper` line on Q-S2 (none specified in design lock).
- Glosses are byte-for-byte from `docs/option-glosses-v1.md` § Q-S2.

### 3. Register three new signals in `signal-library.md`

Add three entries to the Sacred Values Card section. Each entry follows the canonical Per-Signal Entry Schema. Target shapes:

```
#### knowledge_priority

- signal_id: knowledge_priority
- description: Holds knowledge — what's actually known and the discipline of seeking more — as a sacred value.
- primary_cards: [sacred]
- produced_by_questions: [Q-S2]
- used_by_tensions: [T-012]
- rank_aware: true
- implementation_status: active
- notes: Introduced by Q-S2 in CC-006. Rank-aware per `signal-mapping-rule.md` § Ranking Question Signal Emission.
```

```
#### justice_priority

- signal_id: justice_priority
- description: Holds justice — fair weight, even when it costs to give it — as a sacred value.
- primary_cards: [sacred]
- produced_by_questions: [Q-S2]
- used_by_tensions: [T-012]
- rank_aware: true
- implementation_status: active
- notes: Introduced by Q-S2 in CC-006. Rank-aware per `signal-mapping-rule.md` § Ranking Question Signal Emission.
```

```
#### faith_priority

- signal_id: faith_priority
- description: Holds faith — trust in what's larger than you, however framed — as a sacred value.
- primary_cards: [sacred]
- produced_by_questions: [Q-S2]
- used_by_tensions: [T-012]
- rank_aware: true
- implementation_status: active
- notes: Introduced by Q-S2 in CC-006. Rank-aware per `signal-mapping-rule.md` § Ranking Question Signal Emission.
```

### 4. Update five existing sacred-family signal entries in `signal-library.md`

Modify each of the entries below. **Do not change `description`.** Update only the listed fields.

**`family_priority`:**
- `produced_by_questions: [Q-S2]` (was `[Q-S1]`; producer moves with the value)
- `used_by_tensions: [T-007, T-012]` (unchanged)
- `rank_aware: true` (was `false`)
- `notes:` add a sentence — "Q-S2 is a ranking question; signal emits with rank metadata. Producer moved from Q-S1 (forced) to Q-S2 (ranking) in CC-006."

**`freedom_priority`:**
- `primary_cards: [conviction, sacred]` (unchanged — already cross-card)
- `produced_by_questions: [Q-C3, Q-S1]` (unchanged)
- `used_by_tensions: [T-005, T-008, T-012]` (unchanged)
- `rank_aware: true` (was `false`)
- `notes:` update — Q-S1 is now a ranking question; Q-S1 emissions carry rank metadata, Q-C3 emissions do not.

**`truth_priority`:**
- `primary_cards: [conviction, sacred]` (unchanged)
- `produced_by_questions: [Q-C2, Q-S1]` (unchanged)
- `used_by_tensions: [T-007, T-012]` (unchanged)
- `rank_aware: true` (was `false`)
- `notes:` update — Q-S1 is now a ranking question; Q-S1 emissions carry rank metadata, Q-C2 emissions do not.

**`stability_priority`:**
- `primary_cards: [sacred]` (unchanged)
- `produced_by_questions: [Q-S1]` (unchanged)
- `used_by_tensions: [T-005, T-008, T-011, T-012]` (unchanged)
- `rank_aware: true` (was `false`)
- `notes:` update — Q-S1 is now a ranking question; signal emits with rank metadata.

**`loyalty_priority`:**
- `primary_cards: [conviction, sacred]` (was `[conviction]`; sacred added because Q-S1 produces it now)
- `produced_by_questions: [Q-C2, Q-S1]` (was `[Q-C2]`; Q-S1 added)
- `used_by_tensions: [T-012]` (was `—`; T-012 now consumes it)
- `rank_aware: true` (was `false`)
- `implementation_status: active` (was `unused`)
- `notes:` update — Now cross-card. Q-S1 (ranking) is the live runtime producer. Q-C2 (forced) is canonical-only and not implemented in `data/questions.ts`. Q-S1 emissions carry rank metadata; Q-C2 emissions would not. Promoted from `unused` to `active` in CC-006 because T-012 now consumes loyalty_priority.

### 5. Rewrite T-012 in `tension-library-v1.md`

Replace the existing T-012 block in full. Target final state:

```
## T-012 Sacred Value Conflict

Signals:
- Any two distinct rank-aware sacred `*_priority` signals at rank ≤ 2:
  freedom_priority, truth_priority, stability_priority, loyalty_priority,
  family_priority, knowledge_priority, justice_priority, faith_priority.

Source Questions:
- Sacred signals are produced by Q-S1 (freedom_priority, truth_priority, stability_priority, loyalty_priority) and Q-S2 (family_priority, knowledge_priority, justice_priority, faith_priority). Both are ranking-type questions per `card-schema.md` § Question Types; each emits its four signals with rank metadata per `signal-mapping-rule.md` § Ranking Question Signal Emission.

Description:
The user may hold multiple sacred values that cannot always be protected at the same time.

User Prompt:
This pattern may be present: some of your deepest values may come into conflict when life forces a tradeoff. Does this feel accurate?
```

Notes:
- The Description and User Prompt remain byte-identical to the pre-CC-006 T-012.
- The new `Signals:` block uses rank-aware semantics. The new `Source Questions:` block follows the format CC-002 introduced for T-006.
- T-012 effectively fires for any user who completes both Q-S1 and Q-S2 (since each ranking always produces two signals at rank ≤ 2). This is by design: the underlying observation — "you hold multiple sacred values that may conflict" — is universally true. The interpretive value comes from the user's confirm/partly/no/explain response and from which specific signals occupy the top ranks.

### 6. Cross-file consistency check after edits

After all edits, verify:

- The eight sacred signal_ids (`freedom_priority`, `truth_priority`, `stability_priority`, `loyalty_priority`, `family_priority`, `knowledge_priority`, `justice_priority`, `faith_priority`) appear identically across the three edited files.
- Every signal in T-012's `Signals:` block has an entry in `signal-library.md` with `rank_aware: true` and `used_by_tensions` including T-012.
- `family_priority`'s `produced_by_questions` is `[Q-S2]`, not `[Q-S1]` — Family moved.
- `loyalty_priority`'s `primary_cards` is `[conviction, sacred]` and `implementation_status` is `active`.
- The three new signal entries (`knowledge_priority`, `justice_priority`, `faith_priority`) are placed in the Sacred Values Card section of `signal-library.md`, not Conviction or elsewhere.
- No tension other than T-012 was modified.
- No question other than Q-S1 (replaced) and Q-S2 (added) was modified in `question-bank-v1.md`.

If any inconsistency surfaces, fix it in the same edit pass.

---

## Allowed to Modify

- `docs/canon/question-bank-v1.md` — replace Q-S1 in full per §1; add Q-S2 per §2. No other question is touched.
- `docs/canon/signal-library.md` — add three new entries per §3; update five existing entries per §4. No other entry is touched.
- `docs/canon/tension-library-v1.md` — rewrite T-012 in full per §5. No other tension is touched.

Do **not** modify:

- `docs/canon/card-schema.md`
- `docs/canon/signal-mapping-rule.md`
- `docs/canon/signal-and-tension-model.md`
- `docs/canon/temperament-framework.md`
- `docs/canon/inner-constitution.md`
- `docs/canon/foundational-system.md`
- `docs/canon/freeform-signal-extraction.md`
- `docs/canon/freeform-extraction-prompt.md`
- `docs/canon/question-design-standard.md`
- `docs/canon/engine-building-blocks.md`
- `lib/types.ts`, `lib/identityEngine.ts`, `data/questions.ts` — code, deferred to a future CC
- `app/page.tsx` and any file under `app/`
- Any file under `prompts/`
- Any file under `docs/` other than the three canon files in scope
- `docs/open-design-calls.md`, `docs/option-glosses-v1.md`, `docs/design-spec-v1.md`, `docs/temperament-voice-draft-v1.md`, `docs/design-prototype/` — reference sources, do not edit
- `AGENTS.md`, `CLAUDE.md`, `README.md`, `package.json`, any other root-level file

---

## Out of Scope

- Code: adding `ranking` to the `Question` type union in `lib/types.ts`; the engine's rank-derivation pass in `lib/identityEngine.ts`; the React ranking primitive component; migrating `data/questions.ts` to the new Q-S1 / Q-S2. All deferred to subsequent CCs.
- The other ranked questions: Q-X3 (Institutional, CC-007), Q-C4 (Responsibility attribution, CC-008), Q-T1–Q-T8 (Temperament, CC-009).
- Other tensions: only T-012 is touched. T-007 (Family vs Truth) still references `family_priority` and `truth_priority` — those signals' wiring updates in §4 are sufficient to keep T-007 firing; T-007's detection rule stays as-is. T-005, T-008, T-011 likewise stay as-is.
- Adding `Strengtheners:` to T-012 or any other tension. Strengtheners are a CC-004-specific mechanism; CC-006 does not touch them.
- Inner Constitution rendering of Sacred Values. The design spec proposes an inline serif-italic listing in the Constitution; that's a CC-013-class UI concern, not CC-006.
- Promoting or demoting signals beyond what §3 and §4 specify. `loyalty_priority` is promoted from `unused` to `active` because T-012 now uses it; `balanced_responsibility` and any other signal stay as-is.
- Re-litigating the locked decisions in `docs/open-design-calls.md` § 1. CC-006 implements the lock as written.
- Editorial rewrites of glosses. The glosses in `docs/option-glosses-v1.md` are locked per the 2026-04-25 note in that file. CC-006 transcribes them byte-for-byte; do not "improve" them.
- Adding helper text to Q-S2. None was specified; the question stands alone.
- Changes to the Q-C2 forced-choice question (which canonically also produces `loyalty_priority`). Q-C2 stays exactly as-is in canon.

---

## Acceptance Criteria

1. `docs/canon/question-bank-v1.md` Q-S1 reads exactly as written in §1, with `type: ranking`, the four items in the order Freedom / Truth / Stability / Loyalty, the locked glosses, and the helper line. Family is no longer in Q-S1.
2. `docs/canon/question-bank-v1.md` Q-S2 reads exactly as written in §2, immediately after Q-S1 in the Sacred Values Card section. Items in the order Family / Knowledge / Justice / Faith. Glosses byte-for-byte from `option-glosses-v1.md`.
3. `docs/canon/signal-library.md` contains three new entries (`knowledge_priority`, `justice_priority`, `faith_priority`) per §3, each with `rank_aware: true`, `primary_cards: [sacred]`, `used_by_tensions: [T-012]`, `implementation_status: active`.
4. `docs/canon/signal-library.md` entries for `family_priority`, `freedom_priority`, `truth_priority`, `stability_priority`, `loyalty_priority` are updated per §4 — `rank_aware` flipped to `true`, `produced_by_questions` and `primary_cards` updated where specified, `loyalty_priority` promoted to `active`.
5. `docs/canon/tension-library-v1.md` T-012 reads exactly as written in §5. Description and User Prompt are byte-identical to their pre-CC-006 text.
6. No other tension is modified.
7. No other signal-library entry is modified.
8. No other question in `question-bank-v1.md` is modified.
9. No file outside the Allowed to Modify list has been edited.
10. No code file has been touched.
11. The eight sacred signal_ids appear identically across all three edited files (no typos or capitalization drift).
12. The running app's behavior is unchanged after CC-006 (canon-only; the code mismatch with `data/questions.ts` is acknowledged and deliberate — resolved by a future code CC).

---

## Report Back

Return a single markdown block with the following sections, in order:

1. **Files changed** — three bullets, one per file, with one-line descriptions.
2. **Question-bank deltas** — quote the new Q-S1 and Q-S2 blocks in full as written. Confirm Family is no longer in Q-S1 and Loyalty is now in Q-S1.
3. **Signal-library deltas — new entries** — quote each of the three new entries (`knowledge_priority`, `justice_priority`, `faith_priority`) verbatim.
4. **Signal-library deltas — updated entries** — for each of `family_priority`, `freedom_priority`, `truth_priority`, `stability_priority`, `loyalty_priority`, show the updated entry verbatim and call out which fields changed (e.g., "rank_aware: false → true; produced_by_questions: [Q-S1] → [Q-S2]").
5. **T-012 delta** — quote the rewritten T-012 block verbatim. Confirm Description and User Prompt are byte-identical to the pre-CC-006 text.
6. **Cross-file consistency check** — confirm the eight sacred signal_ids match across the three files, and confirm T-012's `Signals:` block lists exactly the eight signals registered with `rank_aware: true` in `signal-library.md`.
7. **Sacred-card runtime/canon split** — name which sacred signals are now produced canonically by ranking questions (Q-S1, Q-S2) and which are also produced by canonical-but-not-implemented forced questions (Q-C2 for `loyalty_priority`, Q-C3 for `freedom_priority`, Q-C2 for `truth_priority`). This makes the runtime-vs-canon picture visible for the next CC that touches code.
8. **Scope-creep check** — explicit confirmation that:
   - No code file was touched.
   - Only the three allowed canon files were edited.
   - No question other than Q-S1 (replaced) and Q-S2 (added) was modified.
   - No tension other than T-012 was modified.
   - No signal entry other than the three new ones and the five updated ones was modified.
   - The locked glosses in `docs/option-glosses-v1.md` were transcribed byte-for-byte; not edited or "improved."
9. **Risks / next-step recommendations** — flag anything the next CC needs to know. Specifically:
   - Cross-card signals (`freedom_priority`, `truth_priority`, `loyalty_priority`) now have producers of mixed type — ranking from sacred-card questions, forced from conviction-card questions. The `rank_aware: true` flag means the signal *can* carry rank, not that it always does. Worth confirming the engine treats `rank` as an optional field, not a required one, when CC-010 (or equivalent engine CC) lands.
   - T-012's effective behavior is "always fires when both Q-S1 and Q-S2 are completed" — this is by design but worth flagging so the future tension-detection code CC plans for it (and so the UI handles a "always-fires" tension gracefully).
   - The next per-question canon CCs are CC-007 (Q-X3 Institutional) and CC-008 (Q-C4 Responsibility), then CC-009 (Temperament). The matching code CCs (engine + ranking primitive component + `data/questions.ts` migration) come after, per `docs/open-design-calls.md` Post-lock CC sequence.
