# CC-008 — Trust Ranking Questions (Q-X3 + Q-X4) Canon and Code

## Goal

Land the Trust Shape card's two ranking questions — **Q-X3 institutional trust** and **Q-X4 personal trust** — both in canon and in code, so the running app at `localhost:3003` collects both rankings and the engine emits ten new rank-aware trust signals.

Both questions are already locked at the umbrella level in `docs/canon/shape-framework.md` § Card 5 (Trust). What's missing:

1. Their canonical entries in `question-bank-v1.md` (Q-X3 entirely; Q-X4 entirely).
2. Their signal entries in `signal-library.md` (five institutional, five personal — none currently registered).
3. Their question definitions in `data/questions.ts`.
4. Their signal descriptions in `lib/identityEngine.ts`.

CC-008 is a combined canon-and-code CC modeled on the CC-006 → CC-007 pattern but compressed into one CC because the canon work is mechanical (the question text is already locked in `shape-framework.md`) and the code work follows the exact pattern Q-S1 / Q-S2 established in CC-007. Combining shortens the path to a browser-testable Trust card.

This CC does **not** activate or repair T-004 (Formation vs Current Conviction), does **not** author any new tensions (e.g., institutional-vs-personal mismatch, trust capture, distrust paranoia), and does **not** introduce a per-item "doesn't apply" affordance for Q-X4. Those are all future-CC scope.

---

## Launch Directive (CC tool)

**Run this CC with permission-bypass at the CC tool level.**

```
claude --dangerously-skip-permissions
```

Or, mid-session, type `/permissions` and pick **bypass permissions** mode. The project also has `.claude/settings.local.json` with `defaultMode: "bypassPermissions"`, so launches in this project should be quiet by default.

This CC touches multiple canon and code files and runs multiple bash commands. Per-edit or per-bash approval prompts will defeat single-pass execution.

## Bash Commands Authorized

This CC will run the following bash commands without further user approval:

- `npx tsc --noEmit` — type check.
- `npm run lint` — lint check.
- `npm run dev` (if browser smoke test is performed by the agent rather than the user; otherwise the user runs this themselves and reports back).
- File-system commands: `ls`, `cat`, `grep`, `find`, `git status`, `git diff` for verification.
- `awk`, `wc`, `head`, `tail` for counting / spot-checking canon line ranges.

The agent should not pause to ask permission for these. They are pre-authorized by this CC and the project's permission settings.

---

## Execution Directive

Complete every requirement in a single pass and deliver the full report-back at the end. Do **not** pause mid-execution to ask the user for confirmation, approval, scope clarification, or any additional input. This prompt is self-contained.

If something is genuinely ambiguous, apply the most canon-faithful interpretation and flag the decision in the Risks / next-step recommendations section of the report-back — do not halt to ask.

If a prerequisite appears missing (a referenced file is absent, a check fails, a canon block has drifted since this prompt was written), attempt the canon-faithful equivalent, record the discrepancy in the report, and continue. Do not stop short.

Do not truncate the work to request user review. Only the final report-back goes to the user.

---

## Read First (Required)

Canon (read in full first; canon edits are scoped per § Allowed to Modify):

- `docs/canon/shape-framework.md` (§ Card 5 Trust contains the locked Q-X4 text and the Q-X3 institutional list)
- `docs/canon/question-bank-v1.md` (Q-X1 / Q-X2 are already there as forced; Q-X3 and Q-X4 are absent)
- `docs/canon/signal-library.md` (look for the existing "Dead References" / pending section for `institutional_trust`, `institutional_skepticism`, `institutional_distrust` — those stay marked as legacy in this CC; Q-X3 introduces per-institution signals alongside, not replacing)
- `docs/canon/signal-mapping-rule.md` (§ Ranking Question Signal Emission — five-item rule already explicit)
- `docs/canon/signal-and-tension-model.md` (§ Rank-Aware Signals)
- `docs/canon/card-schema.md` (Q-X3 and Q-X4 use `card_id: "context"` to match Q-X1 / Q-X2; the Trust Shape card is an interpretive umbrella above `card_id`, not a new `card_id`)
- `docs/canon/tension-library-v1.md` (T-004 references the legacy aggregate institutional signals; this CC does **not** modify T-004)

Existing code (read; will be edited):

- `lib/types.ts`
- `lib/identityEngine.ts`
- `data/questions.ts`

Reference (do not edit):

- `docs/canon/inner-constitution.md`
- `docs/canon/output-engine-rules.md`
- `docs/canon/research-mapping-v1.md` (§ Trust card — research note)
- `docs/canon/validation-roadmap-v1.md` (§ Trust — borrowed instruments)
- `app/components/Ranking.tsx` (the ranking primitive built in CC-007 — Q-X3 and Q-X4 reuse it without modification)
- `app/page.tsx` (the existing question flow already mounts `Ranking` for `type: "ranking"` per CC-007 — no changes needed here)

---

## Context

Per `shape-framework.md` § Card 5 (Trust), the Trust Shape card draws from two canonical questions:

- **Q-X3** — *"How much do you trust each of these institutions to tell the truth and act in good faith? Rank in order."* Five items: Government, Press, Companies, Education, Non-Profits & Religious.
- **Q-X4** — *"When you need to hear the truth and not just kindness, whom do you trust most? Rank in order."* Five items: A spouse or partner, A close friend, Family, A mentor or advisor, Your own counsel. Question text locked in `shape-framework.md` lines 123-132.

Both questions are five-item rankings. The engine's `signalsFromRankingAnswer` (built in CC-007) already handles five-item rankings correctly per `signal-mapping-rule.md`: position 1 → high, position 2 → medium, positions 3+ → low. The CC-007 strength function works without modification.

The legacy aggregate institutional trust signals (`institutional_trust`, `institutional_skepticism`, `institutional_distrust`) referenced by T-004 are preserved in `signal-library.md` as legacy / pending — this CC does **not** delete them and does **not** wire them into Q-X3. Q-X3 emits ten new per-institution rank-aware signals; the legacy aggregate model is left for a future CC to migrate or retire.

Q-X4's "your own counsel" item is treated as a normal ranked item in v1. The "doesn't apply" per-item affordance for users without a spouse / mentor / living family is **deferred to v2** per `shape-framework.md` § Deferred. v1 ships rank-all-five.

The Trust card is `card_id: "context"` in the canonical taxonomy (matching Q-X1 / Q-X2). The Shape framework's Trust card is an interpretive grouping above the canonical `card_id`, not a new `card_id`. Do not introduce a `trust` `card_id`.

---

## Canon-Faithful Interpretation Decisions Locked in This Prompt

These are decisions made at prompt-authorship time so the executing agent does not have to make them. Treat as canon for this CC.

### D-1: Signal naming convention

The ten new signals follow the Sacred convention `<concept>_priority` with rank metadata:

- **Q-X3 institutional (5 signals):** `government_trust_priority`, `press_trust_priority`, `companies_trust_priority`, `education_trust_priority`, `nonprofits_religious_trust_priority`
- **Q-X4 personal (5 signals):** `partner_trust_priority`, `friend_trust_priority`, `family_trust_priority`, `mentor_trust_priority`, `own_counsel_trust_priority`

Rationale: matches `freedom_priority`, `truth_priority`, etc. The `_priority` suffix means "ranked-as-prioritized" and carries `rank` metadata. The verbose `nonprofits_religious_trust_priority` is accepted because the ranked item itself combines two related categories per `shape-framework.md`.

### D-2: Question texts

**Q-X3 prompt:** *"How much do you trust each of these institutions to tell the truth and act in good faith? Rank in order."*

**Q-X3 helper:** *"Rank by how much weight you'd give what each says about what's actually happening — most trusted at the top, least trusted at the bottom."*

**Q-X4 prompt and helper:** verbatim from `shape-framework.md` lines 123-132. Use as written.

### D-3: Glosses

**Q-X3 glosses (authored in this CC; flag as canon authorship in report):**

- Government — *"the state — laws, courts, agencies, the institutions that govern collectively."*
- Press — *"journalism — reporters, editors, the people whose job it is to tell us what's happening."*
- Companies — *"private business — what corporations and the people who run them claim about themselves and the world."*
- Education — *"schools, universities, and the people whose job it is to teach what's known."*
- Non-Profits & Religious — *"civil society and faith communities — the institutions that organize meaning, mutual aid, and moral framing outside government and market."*

**Q-X4 glosses:** verbatim from `shape-framework.md` lines 125-130 (already authored there). Reproduce byte-for-byte:

- A spouse or partner — *"someone whose life is fully entangled with yours."*
- A close friend — *"someone who has earned your trust outside obligation."*
- Family — *"parents, siblings, or chosen kin who knew you before this version of you."*
- A mentor or advisor — *"someone whose judgment you've sought across years."*
- Your own counsel — *"your own judgment, when no other source feels right."*

### D-4: Signal description voice

Match the SIGNAL_DESCRIPTIONS voice already in `lib/identityEngine.ts`. Keep each description one sentence, descriptive not declarative. Examples (use these or close paraphrases that match the Sacred-signal voice):

- `government_trust_priority`: *"Ranks the state — laws, courts, agencies — as a trusted institutional source."*
- `press_trust_priority`: *"Ranks journalism as a trusted institutional source."*
- `companies_trust_priority`: *"Ranks private business as a trusted institutional source."*
- `education_trust_priority`: *"Ranks schools and universities as a trusted institutional source."*
- `nonprofits_religious_trust_priority`: *"Ranks civil society and faith communities as a trusted institutional source."*
- `partner_trust_priority`: *"Ranks a spouse or partner as a trusted personal source for hard truth."*
- `friend_trust_priority`: *"Ranks a close friend as a trusted personal source for hard truth."*
- `family_trust_priority`: *"Ranks family — parents, siblings, or chosen kin — as a trusted personal source for hard truth."*
- `mentor_trust_priority`: *"Ranks a mentor or advisor as a trusted personal source for hard truth."*
- `own_counsel_trust_priority`: *"Ranks own judgment as the trusted source when no other source feels right."*

### D-5: card_id

Both Q-X3 and Q-X4 use `card_id: "context"`. Do not introduce a new `trust` card_id. The Shape framework's Trust card is interpretive.

### D-6: Item IDs

Item IDs (used inside the `RankingQuestion.items[].id` field) are short kebab-style strings:

- Q-X3: `government`, `press`, `companies`, `education`, `nonprofits_religious`
- Q-X4: `partner`, `friend`, `family`, `mentor`, `own_counsel`

These are local to the question and do not need a `_priority` suffix; the suffix lives on the `signal` field that maps to the actual `signal_id`.

---

## Requirements

### 1. Canon: add Q-X3 and Q-X4 entries to `docs/canon/question-bank-v1.md`

Append two new question entries in the Context Card section (where Q-X1 / Q-X2 already live), or wherever the Q-X3 entry would naturally sit alphabetically/sequentially. Use the existing question-entry voice (match Q-S1 / Q-S2's structure).

**Q-X3 entry must contain:**

- `question_id: Q-X3`
- `card_id: context`
- `type: ranking` (5 items)
- Question text per § D-2
- Helper text per § D-2
- Items list with: id, label, gloss, signal — per § D-1, § D-3, § D-6
- A short authoring note: "Q-X3 institutional trust ranking. Locked at umbrella level in `shape-framework.md` § Card 5 (Trust). Glosses authored in CC-008."

**Q-X4 entry must contain:**

- `question_id: Q-X4`
- `card_id: context`
- `type: ranking` (5 items)
- Question text and helper verbatim from `shape-framework.md` lines 123-132
- Items list with: id, label, gloss, signal — per § D-1, § D-3, § D-6
- An authoring note: "Q-X4 personal trust ranking. Question text and item glosses locked verbatim in `shape-framework.md` § Card 5 (Trust). Per-item 'doesn't apply' affordance is deferred to v2 per `shape-framework.md` § Deferred."

### 2. Canon: register the ten new signals in `docs/canon/signal-library.md`

Add a new "Trust Card (Context)" subsection (or add to the existing Context Card section if one is present) with the ten signals listed below. Each signal entry follows the section's existing format (signal_id, description, produced_by, consumed_by, status, notes).

**Five institutional trust signals** (produced by Q-X3):

| signal_id | description | produced_by | consumed_by | status |
|---|---|---|---|---|
| `government_trust_priority` | per § D-4 | Q-X3 | (none in v1; future Trust tensions) | active |
| `press_trust_priority` | per § D-4 | Q-X3 | (none in v1) | active |
| `companies_trust_priority` | per § D-4 | Q-X3 | (none in v1) | active |
| `education_trust_priority` | per § D-4 | Q-X3 | (none in v1) | active |
| `nonprofits_religious_trust_priority` | per § D-4 | Q-X3 | (none in v1) | active |

**Five personal trust signals** (produced by Q-X4):

| signal_id | description | produced_by | consumed_by | status |
|---|---|---|---|---|
| `partner_trust_priority` | per § D-4 | Q-X4 | (none in v1) | active |
| `friend_trust_priority` | per § D-4 | Q-X4 | (none in v1) | active |
| `family_trust_priority` | per § D-4 | Q-X4 | (none in v1) | active |
| `mentor_trust_priority` | per § D-4 | Q-X4 | (none in v1) | active |
| `own_counsel_trust_priority` | per § D-4 | Q-X4 | (none in v1) | active |

Each signal entry should also note: "rank-aware: emitted with `rank` metadata per `signal-mapping-rule.md` § Ranking Question Signal Emission."

**Do not touch the legacy aggregate signals** (`institutional_trust`, `institutional_skepticism`, `institutional_distrust`). They remain in the file as written. Migration / retirement is future-CC scope.

### 3. Code: add Q-X3 and Q-X4 to `data/questions.ts`

Append both entries to the questions array. They should appear after Q-X2 (which is forced) and before Q-S1 (or wherever they fit logically in the existing question order). Match the `RankingQuestion` shape established by Q-S1 and Q-S2.

**Q-X3 target:**

```ts
{
  question_id: "Q-X3",
  card_id: "context",
  type: "ranking",
  text: "How much do you trust each of these institutions to tell the truth and act in good faith? Rank in order.",
  helper: "Rank by how much weight you'd give what each says about what's actually happening — most trusted at the top, least trusted at the bottom.",
  items: [
    { id: "government",           label: "Government",            gloss: "the state — laws, courts, agencies, the institutions that govern collectively.",                              signal: "government_trust_priority"           },
    { id: "press",                label: "Press",                 gloss: "journalism — reporters, editors, the people whose job it is to tell us what's happening.",                    signal: "press_trust_priority"                },
    { id: "companies",            label: "Companies",             gloss: "private business — what corporations and the people who run them claim about themselves and the world.",     signal: "companies_trust_priority"            },
    { id: "education",            label: "Education",             gloss: "schools, universities, and the people whose job it is to teach what's known.",                                signal: "education_trust_priority"            },
    { id: "nonprofits_religious", label: "Non-Profits & Religious", gloss: "civil society and faith communities — the institutions that organize meaning, mutual aid, and moral framing outside government and market.", signal: "nonprofits_religious_trust_priority" },
  ],
},
```

**Q-X4 target:**

```ts
{
  question_id: "Q-X4",
  card_id: "context",
  type: "ranking",
  text: "When you need to hear the truth and not just kindness, whom do you trust most? Rank in order.",
  items: [
    { id: "partner",     label: "A spouse or partner",   gloss: "someone whose life is fully entangled with yours.",                              signal: "partner_trust_priority"     },
    { id: "friend",      label: "A close friend",        gloss: "someone who has earned your trust outside obligation.",                          signal: "friend_trust_priority"      },
    { id: "family",      label: "Family",                gloss: "parents, siblings, or chosen kin who knew you before this version of you.",      signal: "family_trust_priority"      },
    { id: "mentor",      label: "A mentor or advisor",   gloss: "someone whose judgment you've sought across years.",                             signal: "mentor_trust_priority"      },
    { id: "own_counsel", label: "Your own counsel",      gloss: "your own judgment, when no other source feels right.",                           signal: "own_counsel_trust_priority" },
  ],
},
```

Note: Q-X4 has no helper string in the canonical lock (`shape-framework.md` does not provide one). Omit the `helper` field for Q-X4. Flag in report-back that Q-X4 helper is intentionally absent and may be authored later.

Glosses, labels, and signal IDs must match § D-1 / § D-3 byte-for-byte. The Q-X4 question text and item glosses are verbatim from `shape-framework.md` lines 123-132.

### 4. Code: add the ten new SIGNAL_DESCRIPTIONS entries to `lib/identityEngine.ts`

Add the ten entries to the existing `SIGNAL_DESCRIPTIONS` constant. Use the descriptions from § D-4 verbatim.

Do **not** modify any existing SIGNAL_DESCRIPTIONS entries. Do **not** modify `signalsFromRankingAnswer`, `strengthForRank`, `signalFromAnswer`, or `detectTensions`. The ranking emission and strength logic from CC-007 already handle these signals correctly.

### 5. Code: type system

`lib/types.ts` requires **no changes**. The `Question`, `Answer`, `Signal`, `SignalId`, `RankingQuestion`, and `RankingAnswer` types are already in place from CC-007. `SignalId = string` accepts the new IDs without enumeration.

If for any reason a type-level change is required (e.g., a stricter `SignalId` literal union has been added since CC-007 and now needs the new ten IDs added to it), make the minimum necessary change and document it explicitly in the report-back.

### 6. Verify in browser

After all edits, run `npm run dev` and confirm in a real browser at `localhost:3003`:

- Q-X3 renders as a 5-item ranking (Government, Press, Companies, Education, Non-Profits & Religious) with prompt text and helper line.
- Q-X4 renders as a 5-item ranking (A spouse or partner, A close friend, Family, A mentor or advisor, Your own counsel) with prompt text and **no helper line** (intentional).
- Drag-to-reorder works in both. Index numerals (1-5) update on release.
- Continue advances after at least one reorder.
- After completing both rankings (plus the existing question flow), inspect derived signals (via console.log, devtools, or whatever inspection mechanism CC-007 left in place). Each of the ten new signals should appear with appropriate `rank` (1-5) and `strength` (high / medium / low / low / low for positions 1-5 respectively).

If browser smoke testing is performed by the user instead of the agent, the agent must clearly state in report-back that browser testing was deferred.

### 7. Type check and lint

- `npx tsc --noEmit` — passes cleanly.
- `npm run lint` — passes cleanly.

---

## Allowed to Modify

**Canon (this CC writes canon — narrow set):**

- `docs/canon/question-bank-v1.md` — append Q-X3 and Q-X4 entries only; do not modify existing question entries.
- `docs/canon/signal-library.md` — register the ten new trust signals only; do not modify existing signal entries; do not delete or alter the legacy aggregate institutional signals.

**Code:**

- `data/questions.ts` — append Q-X3 and Q-X4 entries only; do not modify existing question entries.
- `lib/identityEngine.ts` — add ten new entries to `SIGNAL_DESCRIPTIONS`; do not modify any existing function or constant.
- `lib/types.ts` — only if a strict `SignalId` literal union exists and requires extension; otherwise leave untouched.

Do **not** modify:

- Any other file under `docs/canon/`. Specifically: `shape-framework.md`, `tension-library-v1.md`, `inner-constitution.md`, `output-engine-rules.md`, `signal-mapping-rule.md`, `signal-and-tension-model.md`, `card-schema.md`, `temperament-framework.md`, `research-mapping-v1.md`, `validation-roadmap-v1.md`. Canon edits are limited to the two listed above.
- Any file under `app/`. The `Ranking` primitive built in CC-007 handles 5-item rankings without modification; `app/page.tsx` already routes `type: "ranking"` to `Ranking`.
- `data/questions.ts` entries other than the new Q-X3 and Q-X4.
- `lib/identityEngine.ts` functions or constants other than the `SIGNAL_DESCRIPTIONS` additions.
- `lib/types.ts` (unless strictly required per § 5).
- `prompts/`, `AGENTS.md`, `CLAUDE.md`, `README.md`, `package.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `.claude/settings.local.json`.

---

## Out of Scope

This CC does not do any of the following. Each is a future-CC concern.

- **T-004 (Formation vs Current Conviction) reactivation.** T-004's right side currently references the legacy aggregate institutional signals (`institutional_trust`, `institutional_skepticism`, `institutional_distrust`). CC-008 leaves T-004 exactly as it is. A future CC will decide whether to migrate T-004 to per-institution signals or retire the legacy aggregate model.
- **New tensions.** Do not author T-013, T-014, or any other new tension related to trust (e.g., institutional-vs-personal trust mismatch, distrust paranoia, trust capture, partner-as-only-trusted-source isolation pattern). Any tension authoring is a separate canon CC.
- **Aggregate institutional trust signals.** Do not introduce a new `institutional_trust_aggregate`, `mean_institutional_trust`, or any derived aggregate signal. Per-institution rank-aware signals are the only Q-X3 emission.
- **Per-item "doesn't apply" affordance.** Q-X4 currently asks the user to rank all five even if some don't apply (no spouse, no mentor, no living family). v2 may add per-item opt-out per `shape-framework.md` § Deferred. Do not add it in CC-008.
- **`Ranking` component changes.** The CC-007 component handles 5-item rankings without modification. Do not edit `app/components/Ranking.tsx`.
- **`app/page.tsx` changes.** The page already routes `type: "ranking"` to `Ranking`. Do not refactor.
- **Question reordering.** Do not reorder existing questions in `data/questions.ts` or `question-bank-v1.md`. Append-only.
- **Card schema changes.** Do not introduce a `trust` `card_id`. Q-X3 and Q-X4 are `card_id: "context"`.
- **Helper text for Q-X4.** Q-X4 has no canonical helper. Do not invent one.
- **Inner Constitution rendering.** No changes to how results are displayed. CC-008 ships the data plumbing, not the UI for the Trust card.
- **Output engine derivation rules.** No changes to `output-engine-rules.md` or any signal-to-SWOT logic. CC-008 only registers signals.
- **Tension confidence / strengthen logic.** No changes to the strengthen-only freeform logic from CC-004.
- **Persistence / autosave / localStorage.** Out of scope.
- **Design-system tokens** (warm paper, umber accent, Source Serif typography). Out of scope.

---

## Acceptance Criteria

1. `docs/canon/question-bank-v1.md` contains a Q-X3 entry as a 5-item ranking question on Context Card with the locked text, helper, items, glosses, and signal mappings per § D-1 / § D-2 / § D-3 / § D-6.
2. `docs/canon/question-bank-v1.md` contains a Q-X4 entry as a 5-item ranking question on Context Card with the locked text (verbatim from `shape-framework.md`), no helper, items, glosses (verbatim from `shape-framework.md`), and signal mappings.
3. `docs/canon/signal-library.md` contains all ten new trust signal entries (`government_trust_priority`, `press_trust_priority`, `companies_trust_priority`, `education_trust_priority`, `nonprofits_religious_trust_priority`, `partner_trust_priority`, `friend_trust_priority`, `family_trust_priority`, `mentor_trust_priority`, `own_counsel_trust_priority`), each marked rank-aware and active.
4. The legacy aggregate institutional signals (`institutional_trust`, `institutional_skepticism`, `institutional_distrust`) remain unchanged in `signal-library.md`.
5. `data/questions.ts` contains Q-X3 and Q-X4 as `RankingQuestion` entries matching § 3 byte-for-byte (label / gloss / signal triples).
6. `lib/identityEngine.ts` `SIGNAL_DESCRIPTIONS` contains the ten new entries with descriptions matching § D-4.
7. `lib/types.ts` is unchanged (or, if a strict literal `SignalId` union required extension, the ten new IDs are added with no other changes).
8. Manual smoke test in a browser at `localhost:3003`: Q-X3 and Q-X4 each render with drag-to-reorder; the engine emits all ten new signals with correct `rank` and `strength` after the user completes both rankings. (Or browser testing is explicitly deferred to the user with that fact stated in report-back.)
9. `npx tsc --noEmit` passes cleanly.
10. `npm run lint` passes cleanly.
11. No file outside the Allowed to Modify list has been edited.
12. T-004 is unchanged. No new tensions have been authored. The legacy aggregate institutional signals are unchanged.
13. No `card_id: "trust"` exists; Q-X3 and Q-X4 are both `card_id: "context"`.
14. No per-item "doesn't apply" affordance has been added to Q-X4.

---

## Report Back

Return a single markdown block with the following sections, in order:

1. **Files changed** — bullet per file with one-line description.
2. **Canon additions: question-bank-v1.md** — quote the new Q-X3 and Q-X4 entries verbatim. Confirm Q-X4's question text and glosses are byte-for-byte from `shape-framework.md` lines 123-132. Confirm Q-X4 has no helper.
3. **Canon additions: signal-library.md** — quote the ten new signal entries verbatim. Confirm each is marked rank-aware and active. Confirm the legacy aggregate signals were not modified.
4. **Code additions: data/questions.ts** — quote the new Q-X3 and Q-X4 entries verbatim. Confirm placement (where they sit in the questions array) and that no existing entries were modified.
5. **Code additions: lib/identityEngine.ts** — quote the ten new SIGNAL_DESCRIPTIONS entries verbatim. Confirm no existing entries or functions were modified.
6. **Type system** — confirm `lib/types.ts` was not modified. If a strict literal `SignalId` union required extension, document the change and justify.
7. **Smoke-test results** — state whether browser testing confirmed Q-X3 and Q-X4 rendering, drag-reorder, and the ten new signals firing with correct rank and strength. If browser testing was deferred to the user, say so explicitly.
8. **Type check and lint** — output of `npx tsc --noEmit` and `npm run lint`.
9. **Scope-creep check** — explicit confirmation that:
   - No canon file outside `question-bank-v1.md` and `signal-library.md` was modified.
   - T-004 was not modified.
   - No new tensions were authored.
   - The legacy aggregate institutional signals were not modified, deleted, or wired to Q-X3.
   - No `card_id: "trust"` was introduced.
   - No per-item "doesn't apply" affordance was added.
   - `app/components/Ranking.tsx` and `app/page.tsx` were not modified.
   - No question other than Q-X3 and Q-X4 was added to or modified in `data/questions.ts` or `question-bank-v1.md`.
10. **Risks / next-step recommendations** — anything that surfaced during execution. Specifically:
    - If T-004 surfaces as obviously broken / dead-referencing during browser testing, flag for a future CC (T-004 reactivation or retirement) — do not fix in CC-008.
    - If the absence of any tension consuming the new trust signals makes the result page look thin, flag as a known v1 state — the Trust SWOT renderer is a future CC.
    - If Q-X4's missing helper looks visually inconsistent with Q-S1 / Q-S2 / Q-X3 in the browser, flag for a future copy-polish CC.
    - If the verbose `nonprofits_religious_trust_priority` signal name causes any tooling or display friction, flag for review.
    - Any other observation worth surfacing.
