# CC-009 — Q-C4 Ranked Attribution (Conviction Card → Gravity Shape) Canon and Code

## Goal

Replace the legacy forced-choice Q-C4 with the locked five-option ranking (Individual / System / Nature / Supernatural / Authority), in canon and in code. After CC-009, the running app at `localhost:3003` collects the Q-C4 ranking and the engine emits five new rank-aware responsibility-attribution signals.

This CC is **not additive like CC-008** — it is a canon-replacement CC. Q-C4 already exists in `question-bank-v1.md` as a forced-choice question with three options (The individual / The system / Both equally) and three associated signals (`individual_responsibility`, `systemic_responsibility`, `balanced_responsibility`). All three signals are referenced by T-009 (Individual vs System Responsibility), which has been canon-blocked since CC-003 (cannot fire because the forced question only emits one signal at a time but the tension requires two).

CC-009 retires the forced version, replaces it with the locked ranking, and marks the three legacy signals **deprecated** rather than deleting them so historical references remain explicable. Five new rank-aware signals get registered. T-009 itself is **not modified in this CC** — the rewrite (using the new rank-aware signals with rank ≤ 2 thresholds) is deferred to a future CC.

Scope is intentionally narrow:

- Replace Q-C4 forced with Q-C4 ranking in `question-bank-v1.md`.
- Deprecate three legacy responsibility signals in `signal-library.md`.
- Register five new rank-aware responsibility signals in `signal-library.md`.
- Update Active / Pending / Unused / Deprecated summary counts in `signal-library.md`.
- Add Q-C4 ranking entry to `data/questions.ts`.
- Add five new SIGNAL_DESCRIPTIONS entries to `lib/identityEngine.ts`.
- Flag T-009 status (now canon-blocked because its referenced signals are being deprecated) in `signal-library.md` § Tensions Blocked.

**Out of scope** for this CC: rewriting T-009 to use the new signals; authoring any new tensions consuming the new signals; touching other canon docs; modifying `app/components/Ranking.tsx`, `app/page.tsx`, or `lib/types.ts`. Each is a future-CC concern.

---

## Launch Directive (CC tool)

**Run this CC with permission-bypass at the CC tool level.**

```
claude --dangerously-skip-permissions
```

Or, mid-session, type `/permissions` and pick **bypass permissions** mode. The project's `.claude/settings.local.json` has `permissions.defaultMode: "bypassPermissions"` plus a broad allowlist; launches in this project should be quiet by default.

This CC touches multiple canon and code files and runs multiple bash commands. Per-edit or per-bash approval prompts will defeat single-pass execution.

## Bash Commands Authorized

This CC will run the following bash commands without further user approval:

- `npx tsc --noEmit` — type check.
- `npm run lint` — lint check.
- `npm run dev` (if browser smoke test is performed by the agent rather than the user; otherwise the user runs this themselves).
- File-system commands: `ls`, `cat`, `grep`, `find`, `git status`, `git diff`, `awk`, `sed`, `head`, `tail`, `wc` for verification and scoped substitutions.

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

- `docs/canon/shape-framework.md` (§ Card 4 Gravity contains the Q-C4 lock and umbrella context; line ~111: "Q-C4 ranked (Individual / System / Nature / Supernatural / Authority). Locked... awaiting CC-008." — note the CC numbering shifted; CC-009 is the actual implementation.)
- `docs/canon/question-bank-v1.md` (Q-C4 forced exists; will be replaced)
- `docs/canon/signal-library.md` (look for the existing entries for `individual_responsibility`, `systemic_responsibility`, `balanced_responsibility` under the Conviction Card section; these will be marked deprecated. Also check the Active / Pending / Unused / Deprecated summary sections — counts will need updating.)
- `docs/canon/signal-mapping-rule.md` (§ Ranking Question Signal Emission — five-item rule already explicit)
- `docs/canon/signal-and-tension-model.md` (§ Rank-Aware Signals)
- `docs/canon/card-schema.md` (Q-C4 keeps `card_id: "conviction"` — the Gravity Shape card is an interpretive umbrella above `card_id`, not a new `card_id`)
- `docs/canon/tension-library-v1.md` (T-009 references the three legacy signals; T-009 is **not modified in this CC** — flag for future rewrite only)

Reference (do not edit):

- `docs/option-glosses-v1.md` § Q-C4 — **the locked Q-C4 glosses live here.** Read this file before authoring any gloss text. Q-C4 glosses are byte-for-byte verbatim from this section; do not author new gloss text. (This rule was missed in CC-008 for Q-X3 — do not repeat that miss in CC-009.)
- `docs/design-spec-v2.md` § 7.4 — same Q-C4 glosses as `option-glosses-v1.md`; reference for designer-side context only. Both files agree.
- `docs/canon/inner-constitution.md`
- `docs/canon/output-engine-rules.md`
- `docs/canon/research-mapping-v1.md` (§ Gravity card — research note on Rotter / Levenson IPC)

Existing code (read; will be edited):

- `lib/identityEngine.ts`
- `data/questions.ts`

Existing code (do **not** edit):

- `lib/types.ts` — already supports ranking from CC-007; no changes needed
- `app/components/Ranking.tsx` — handles 5-item rankings without modification (proven by CC-008 Q-X3 / Q-X4)
- `app/page.tsx` — already routes `type: "ranking"` to `Ranking`

---

## Context

The Q-C4 forced version was authored before the rank-aware redesign. It has three options (The individual / The system / Both equally) and emits one of three signals per session at strength `medium`. T-009 (Individual vs System Responsibility) needs `individual_responsibility` AND (`systemic_responsibility` OR `balanced_responsibility`) — structurally impossible from a single forced-choice answer. T-009 has been canon-blocked since CC-003.

The locked successor is a five-option ranking that adds Nature, Supernatural, and Authority to the existing Individual and System. The ranking emits five signals (one per ranked item) with rank metadata, allowing T-009 (after rewrite, future CC) to consume "individual + system both at rank ≤ 2" as a clean signature.

Q-C4 keeps `card_id: "conviction"` because that's the canonical taxonomy. The Gravity Shape card (per `shape-framework.md` § Card 4) is an interpretive grouping above the canonical `card_id`. The card_id taxonomy is the storage; Gravity is the rendering.

The Authority option is **disambiguated from System** in the gloss ("the people in charge of the system, not the system itself"). Per `option-glosses-v1.md`, this gloss is load-bearing — keep it longer than the others if mobile fitting forces shortening; do not abbreviate at the cost of the disambiguation clause.

---

## Canon-Faithful Interpretation Decisions Locked in This Prompt

These are decisions made at prompt-authorship time so the executing agent does not have to make them. Treat as canon for this CC.

### D-1: Signal naming convention

Five new rank-aware signals follow the Sacred / Trust convention `<concept>_priority`. Concept name is `<item>_responsibility`:

- `individual_responsibility_priority`
- `system_responsibility_priority` (note: `system_`, not `systemic_` — matches the option label "System" and the row's grammar)
- `nature_responsibility_priority`
- `supernatural_responsibility_priority`
- `authority_responsibility_priority`

### D-2: Three legacy signals are deprecated, not deleted

The three legacy responsibility signals stay in `signal-library.md` but transition to `implementation_status: deprecated` with notes pointing to their successors. They are NOT removed — historical T-009 references must remain explicable.

- `individual_responsibility` → deprecated; successor is `individual_responsibility_priority`. Note: still referenced by T-009 (canon-blocked). T-009 rewrite is future-CC scope.
- `systemic_responsibility` → deprecated; successor is `system_responsibility_priority` (note the rename `systemic` → `system` for grammar consistency with the new ranked option label). Still referenced by T-009.
- `balanced_responsibility` → deprecated; **no direct successor.** "Balanced" was a 3-option forced-choice construct; in ranked form, two top items at rank 1–2 indicate balance without needing a separate signal. Still referenced by T-009.

### D-3: T-009 stays unchanged

Do **not** modify `tension-library-v1.md` T-009 in this CC. T-009 will be rewritten in a future CC to consume `individual_responsibility_priority` AND `system_responsibility_priority` at rank ≤ 2 (or similar rank-aware formulation). Until that future CC lands, T-009 remains canon-blocked and the new signals are `unused` (no tension consumes them yet).

In `signal-library.md` § Tensions Blocked by Missing Signals, update T-009's entry to note the new state: legacy signals are now deprecated rather than just dead, and the rewrite path is to migrate T-009 to the new rank-aware signals.

### D-4: Question text and helper

**Q-C4 prompt (verbatim from `option-glosses-v1.md` § Q-C4 line `Question:`):**

> "When something goes wrong, rank where the responsibility most often sits."

Note `option-glosses-v1.md` includes the article "the" before "responsibility"; this is the canonical text. (`design-spec-v2.md` § 7.4 has a near-identical version without "the"; option-glosses-v1.md wins because it is the canonical gloss source.)

**Q-C4 helper:** none. Q-C4 has no canonical helper text. Do not author one. (This is consistent with Q-X4, which also has no helper.)

### D-5: Glosses — verbatim from `option-glosses-v1.md` § Q-C4

Use byte-for-byte. Do **not** author new gloss text.

- **Individual** — *the person who acted, and what they brought to the moment.*
- **System** — *the structures and incentives shaping what was possible.*
- **Nature** — *chance, biology, the way things just are.*
- **Supernatural** — *divine will, fate, or what's beyond human reach.*
- **Authority** — *the people in charge of the system, not the system itself.*

The Authority gloss is the longest because it carries the System↔Authority disambiguation. Keep it intact. If mobile fit forces a shorter gloss anywhere, do not shorten Authority.

### D-6: card_id

Q-C4 uses `card_id: "conviction"`. Do not introduce a new `gravity` card_id. The Shape framework's Gravity card is interpretive.

### D-7: Item IDs

Item IDs (used inside the `RankingQuestion.items[].id` field) are short kebab-style strings:

- `individual`
- `system`
- `nature`
- `supernatural`
- `authority`

These are local to the question and do not need a `_responsibility_priority` suffix; the suffix lives on the `signal` field that maps to the actual `signal_id`.

### D-8: SIGNAL_DESCRIPTIONS for the new signals

Use these (matches the `<concept>_priority` voice already in `lib/identityEngine.ts`):

- `individual_responsibility_priority`: *"Ranks the individual — the person who acted — as the locus of responsibility when things go wrong."*
- `system_responsibility_priority`: *"Ranks the system — structures and incentives — as the locus of responsibility when things go wrong."*
- `nature_responsibility_priority`: *"Ranks nature — chance, biology, the way things just are — as the locus of responsibility when things go wrong."*
- `supernatural_responsibility_priority`: *"Ranks the supernatural — divine will, fate, or what's beyond human reach — as the locus of responsibility when things go wrong."*
- `authority_responsibility_priority`: *"Ranks authority — the people in charge of the system, not the system itself — as the locus of responsibility when things go wrong."*

Each description preserves the gloss content without copying it byte-for-byte (the gloss appears under the option label in the UI; the description is for engine / provenance use).

---

## Requirements

### 1. Canon: replace Q-C4 in `docs/canon/question-bank-v1.md`

Locate the existing Q-C4 forced-choice entry. Replace it entirely with a ranking entry. Preserve placement (the entry's position in the file does not change; only its content does).

**Replacement Q-C4 entry shape:**

```
## Q-C4

- card_id: conviction
- type: ranking
- question: When something goes wrong, rank where the responsibility most often sits.
- items:
  - id: individual
    label: Individual
    gloss: the person who acted, and what they brought to the moment.
    signal: individual_responsibility_priority
  - id: system
    label: System
    gloss: the structures and incentives shaping what was possible.
    signal: system_responsibility_priority
  - id: nature
    label: Nature
    gloss: chance, biology, the way things just are.
    signal: nature_responsibility_priority
  - id: supernatural
    label: Supernatural
    gloss: divine will, fate, or what's beyond human reach.
    signal: supernatural_responsibility_priority
  - id: authority
    label: Authority
    gloss: the people in charge of the system, not the system itself.
    signal: authority_responsibility_priority

Q-C4 ranked attribution. Locked at umbrella level in `shape-framework.md` § Card 4 (Gravity). Glosses verbatim from `docs/option-glosses-v1.md` § Q-C4 (locked 2026-04-25). Replaces the legacy forced-choice version of Q-C4 (three options: The individual / The system / Both equally), which is now retired. The three legacy signals are deprecated in `signal-library.md`. T-009 (Individual vs System Responsibility) still references the legacy signals and is now formally canon-blocked; T-009 rewrite to consume the new rank-aware signals is future-CC scope.
```

The forced-choice version, including its three options and three signals listed in the question entry, must be removed entirely (not commented out).

### 2. Canon: deprecate three legacy responsibility signals in `docs/canon/signal-library.md`

Locate the three existing signal entries:

- `individual_responsibility`
- `systemic_responsibility`
- `balanced_responsibility`

For each, change `implementation_status: active` to `implementation_status: deprecated` and update the `notes` field to read:

> "Deprecated in CC-009 when Q-C4 was migrated from a forced-choice 3-option question to a rank-aware 5-option question. Successor: `<successor_signal_id>` (or `—` for `balanced_responsibility`, which has no direct successor — see `prompts/completed/CC-009/CC-009-attribution-ranking.md` § D-2). Still referenced by T-009 in `tension-library-v1.md`; T-009 is now formally canon-blocked until rewritten to consume the new rank-aware signals (future CC)."

Successor mapping:
- `individual_responsibility` → `individual_responsibility_priority`
- `systemic_responsibility` → `system_responsibility_priority`
- `balanced_responsibility` → no direct successor

Do not delete the signals. Do not change `produced_by_questions` (it should still read `[Q-C4]` because Q-C4 is the question being changed; the field may be updated to note "(legacy forced version, retired in CC-009)" but the entry stays).

### 3. Canon: register five new rank-aware signals in `docs/canon/signal-library.md`

Add a new subsection (or extend the existing Conviction Card section) with five new signal entries. Each entry follows the file's per-entry schema with `rank_aware: true` and `implementation_status: unused` (no v1 tension consumes them yet; T-009 rewrite is future-CC scope).

Each entry:

```
#### <signal_id>

- signal_id: <signal_id>
- description: <D-8 description>
- primary_cards: [conviction]
- produced_by_questions: [Q-C4]
- used_by_tensions: —
- rank_aware: true
- implementation_status: unused
- notes: Introduced by Q-C4 ranking in CC-009. Rank-aware: emitted with `rank` metadata per `signal-mapping-rule.md` § Ranking Question Signal Emission. No tension consumes this signal in v1; T-009 rewrite to use the new rank-aware signals is future-CC scope.
```

For `authority_responsibility_priority`, the notes field should additionally record: "The Authority gloss is load-bearing — distinct from System (the people in charge vs. the structure itself)."

### 4. Canon: update Active / Unused / Deprecated summary sections in `docs/canon/signal-library.md`

After the per-entry edits in §§ 2 and 3, the summary sections must reflect:

- **Active Signals.** Currently 29. Three signals leave (deprecated). New count: **26**. Remove `individual_responsibility`, `systemic_responsibility`, `balanced_responsibility` from the prose list at the top of the Active Signals section.
- **Unused Signals.** Currently 27 (post-CC-008). Add the five new signals. New count: **32**. Add five lines:
  - `individual_responsibility_priority` — produced by Q-C4 (rank-aware).
  - `system_responsibility_priority` — produced by Q-C4 (rank-aware).
  - `nature_responsibility_priority` — produced by Q-C4 (rank-aware).
  - `supernatural_responsibility_priority` — produced by Q-C4 (rank-aware).
  - `authority_responsibility_priority` — produced by Q-C4 (rank-aware).
- **Deprecated Signals.** Currently "None." Now three:
  - `individual_responsibility` — deprecated in CC-009; successor `individual_responsibility_priority`.
  - `systemic_responsibility` — deprecated in CC-009; successor `system_responsibility_priority`.
  - `balanced_responsibility` — deprecated in CC-009; no direct successor (the "balanced" semantic is now expressed by two top-2 ranks of `individual_responsibility_priority` and `system_responsibility_priority`).

### 5. Canon: update T-009 entry in `docs/canon/signal-library.md` § Tensions Blocked by Missing Signals

Locate the T-009 entry under § Tensions Blocked. Update the `missing_signals` and `remediation_path` to reflect the new state (legacy signals deprecated; rewrite needed to consume rank-aware signals):

> **T-009 Individual vs System Responsibility (post-CC-009 state)**
>
> - tension_id: T-009
> - blocker_type: canon blocker (deprecated signal references)
> - missing_signals: `individual_responsibility`, `systemic_responsibility`, `balanced_responsibility` are all deprecated in CC-009. They remain in canon for historical legibility but no question produces them anymore (Q-C4 was migrated to a rank-aware ranking question with successor signals).
> - remediation_path: rewrite T-009 in `tension-library-v1.md` to consume `individual_responsibility_priority` AND `system_responsibility_priority` at rank ≤ 2 (or equivalent rank-aware formulation). The "balanced" semantic is now expressed structurally by both signals appearing in the user's top-2 ranks rather than by a dedicated signal. Future-CC scope (likely paired with the output engine derivation CC).

Do not modify the actual T-009 entry in `tension-library-v1.md`. The blocker entry in `signal-library.md` is a status report, not a tension definition.

### 6. Code: add Q-C4 to `data/questions.ts`

Q-C4 is currently absent from `data/questions.ts` (the legacy forced-choice version was never implemented at runtime). Add the ranking entry. Place it in a sensible location — after Q-C3 if Q-C1/Q-C3 are sequential, or at the end of the existing array if Conviction-card questions are scattered.

**Target Q-C4 entry:**

```ts
{
  question_id: "Q-C4",
  card_id: "conviction",
  type: "ranking",
  text: "When something goes wrong, rank where the responsibility most often sits.",
  items: [
    { id: "individual",    label: "Individual",    gloss: "the person who acted, and what they brought to the moment.",       signal: "individual_responsibility_priority"    },
    { id: "system",        label: "System",        gloss: "the structures and incentives shaping what was possible.",          signal: "system_responsibility_priority"        },
    { id: "nature",        label: "Nature",        gloss: "chance, biology, the way things just are.",                         signal: "nature_responsibility_priority"        },
    { id: "supernatural",  label: "Supernatural",  gloss: "divine will, fate, or what's beyond human reach.",                  signal: "supernatural_responsibility_priority"  },
    { id: "authority",     label: "Authority",     gloss: "the people in charge of the system, not the system itself.",        signal: "authority_responsibility_priority"     },
  ],
},
```

Glosses, labels, and signal IDs must match § D-1 / § D-5 / § D-7 byte-for-byte. Q-C4 has no `helper` field, intentionally.

### 7. Code: add five new SIGNAL_DESCRIPTIONS entries to `lib/identityEngine.ts`

Add the five entries to the existing `SIGNAL_DESCRIPTIONS` constant. Use the descriptions from § D-8 verbatim.

Do **not** modify any existing SIGNAL_DESCRIPTIONS entries. Do **not** modify `signalsFromRankingAnswer`, `strengthForRank`, `signalFromAnswer`, or `detectTensions`. The ranking emission and strength logic from CC-007 already handle these signals correctly.

There are no SIGNAL_DESCRIPTIONS entries for the three legacy signals (because Q-C4 was never coded). Do not add new entries for the deprecated signals.

### 8. Code: type system

`lib/types.ts` requires **no changes**.

### 9. Verify in browser

After all edits, run `npm run dev` and confirm in a real browser at `localhost:3003`:

- Q-C4 renders as a 5-item ranking (Individual / System / Nature / Supernatural / Authority) with prompt text and **no helper line** (intentional).
- Drag-to-reorder works. Index numerals (1–5) update on release.
- Continue advances after at least one reorder.
- After completing Q-C4 (plus the rest of the question flow), the engine emits all five new signals with appropriate `rank` (1–5) and `strength` (high / medium / low / low / low).
- T-009 does NOT fire (it still references deprecated signals; this is the expected canon-blocked state).

If browser smoke testing is performed by the user instead of the agent, the agent must clearly state in report-back that browser testing was deferred.

### 10. Type check and lint

- `npx tsc --noEmit` — passes cleanly.
- `npm run lint` — passes cleanly.

---

## Allowed to Modify

**Canon (this CC writes canon — narrow set):**

- `docs/canon/question-bank-v1.md` — replace Q-C4 entry (forced → ranking). No other entries modified.
- `docs/canon/signal-library.md` — three legacy signals deprecated; five new signals added; Active / Unused / Deprecated summary sections updated; T-009 entry under § Tensions Blocked updated. No other signal entries modified.

**Code:**

- `data/questions.ts` — append Q-C4 ranking entry only. No other entries modified.
- `lib/identityEngine.ts` — add five new entries to `SIGNAL_DESCRIPTIONS`. No existing function or constant modified.

Do **not** modify:

- Any other file under `docs/canon/`. Specifically: `shape-framework.md`, `tension-library-v1.md`, `inner-constitution.md`, `output-engine-rules.md`, `signal-mapping-rule.md`, `signal-and-tension-model.md`, `card-schema.md`, `temperament-framework.md`, `research-mapping-v1.md`, `validation-roadmap-v1.md`. Canon edits are limited to the two listed above.
- `tension-library-v1.md` — T-009 stays exactly as written.
- `docs/option-glosses-v1.md` — reference only.
- `docs/design-spec-v2.md` — reference only.
- Any file under `app/`. The Ranking primitive built in CC-007 handles 5-item rankings without modification; `app/page.tsx` already routes `type: "ranking"` to `Ranking` (proven by CC-008).
- `data/questions.ts` entries other than the new Q-C4.
- `lib/identityEngine.ts` functions, constants, or existing SIGNAL_DESCRIPTIONS entries other than the five new additions.
- `lib/types.ts`.
- `prompts/`, `AGENTS.md`, `CLAUDE.md`, `README.md`, `package.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `.claude/settings.local.json`.

---

## Out of Scope

This CC does not do any of the following. Each is a future-CC concern.

- **T-009 rewrite.** T-009 stays exactly as written. Its referenced signals are deprecated in CC-009 but T-009's text is unchanged. Rewriting T-009 to consume the new rank-aware signals (e.g., "fires when both `individual_responsibility_priority` AND `system_responsibility_priority` are at rank ≤ 2") is future-CC scope, likely paired with the output-engine derivation CC.
- **New tensions.** Do not author any new tension consuming the new rank-aware responsibility signals. No "Individual-Authority alignment" tension, no "high systemic + high supernatural" tension, etc.
- **Authority-System disambiguation hints in UI.** The Authority gloss carries the disambiguation in text. Do not add JSX warnings, tooltips, or inline help affordances. Future copy-polish CC scope if warranted.
- **`Ranking` component changes.** The CC-007 component handles 5-item rankings without modification.
- **`app/page.tsx` changes.**
- **Question reordering.** Do not reorder existing questions in `data/questions.ts` or `question-bank-v1.md`. Replacement-in-place for Q-C4; append for new things.
- **Card schema changes.** Do not introduce a `gravity` `card_id`. Q-C4 stays `card_id: "conviction"`.
- **Helper text for Q-C4.** Q-C4 has no canonical helper. Do not invent one.
- **Inner Constitution rendering.** No changes to how results are displayed.
- **Output engine derivation rules.** No changes to `output-engine-rules.md` or any signal-to-SWOT logic.
- **Tension confidence / strengthen logic.** No changes to the strengthen-only freeform logic from CC-004.
- **Persistence / autosave / localStorage.** Out of scope.
- **Design-system tokens.** Out of scope (CC-D territory).
- **Q-S2 gloss fork** between v2 design-spec and canon — separate decision; do not touch.

---

## Acceptance Criteria

1. `docs/canon/question-bank-v1.md` Q-C4 entry has been replaced with the 5-item ranking version per § 1, with question text and glosses byte-for-byte from `option-glosses-v1.md` § Q-C4.
2. The three legacy responsibility signals (`individual_responsibility`, `systemic_responsibility`, `balanced_responsibility`) in `docs/canon/signal-library.md` have `implementation_status: deprecated` with successor-pointing notes.
3. Five new rank-aware signals (`individual_responsibility_priority`, `system_responsibility_priority`, `nature_responsibility_priority`, `supernatural_responsibility_priority`, `authority_responsibility_priority`) are registered in `docs/canon/signal-library.md` with `rank_aware: true` and `implementation_status: unused`.
4. `docs/canon/signal-library.md` summary sections are updated: Active Signals → 26 (with the three deprecated removed from the prose list); Unused Signals → 32 (with the five new added); Deprecated Signals → 3 (with the three legacy listed and successor-mapped).
5. `docs/canon/signal-library.md` § Tensions Blocked T-009 entry is updated to reflect the new "deprecated signal references" state and the rewrite remediation path.
6. `docs/canon/tension-library-v1.md` T-009 entry is **unchanged**.
7. `data/questions.ts` Q-C4 entry exists as a `RankingQuestion` matching § 6 byte-for-byte.
8. `lib/identityEngine.ts` SIGNAL_DESCRIPTIONS contains the five new entries with descriptions matching § D-8.
9. `lib/types.ts` is unchanged.
10. Manual smoke test in a browser at `localhost:3003`: Q-C4 renders with 5-item drag-to-reorder; the engine emits all five new signals with correct `rank` and `strength`. T-009 does not fire (expected). (Or browser testing is explicitly deferred to the user with that fact stated in report-back.)
11. `npx tsc --noEmit` passes cleanly.
12. `npm run lint` passes cleanly.
13. No file outside the Allowed to Modify list has been edited.
14. T-009 is unchanged in `tension-library-v1.md`. No new tensions have been authored.
15. No `card_id: "gravity"` exists; Q-C4 stays `card_id: "conviction"`.
16. No helper field added to Q-C4.
17. Three legacy responsibility signals remain in `signal-library.md` (status deprecated); they have NOT been deleted.

---

## Report Back

Return a single markdown block with the following sections, in order:

1. **Files changed** — bullet per file with one-line description.
2. **Canon: question-bank-v1.md Q-C4 replacement** — quote the new Q-C4 entry verbatim. Confirm the question text and glosses match `option-glosses-v1.md` § Q-C4 byte-for-byte. Confirm the legacy 3-option forced version has been removed (not commented out).
3. **Canon: signal-library.md deprecations** — show the updated `implementation_status` and `notes` for the three legacy signals. Confirm none were deleted.
4. **Canon: signal-library.md additions** — quote the five new signal entries verbatim. Confirm each is `rank_aware: true` and `implementation_status: unused`. Confirm the `authority_responsibility_priority` notes call out the load-bearing System↔Authority disambiguation.
5. **Canon: signal-library.md summary updates** — quote the updated Active / Unused / Deprecated headers and prose lists. Confirm new counts: Active 26, Unused 32, Deprecated 3.
6. **Canon: signal-library.md § Tensions Blocked T-009 update** — quote the updated T-009 entry in the Blocked section.
7. **Code: data/questions.ts** — quote the new Q-C4 entry verbatim. Confirm placement.
8. **Code: lib/identityEngine.ts** — quote the five new SIGNAL_DESCRIPTIONS entries verbatim. Confirm no existing entries were modified.
9. **Type system** — confirm `lib/types.ts` was not modified.
10. **Smoke-test results** — state whether browser testing confirmed Q-C4 rendering, drag-reorder, and the five new signals firing with correct rank and strength. Confirm T-009 did not fire (expected). If browser testing was deferred to the user, say so explicitly.
11. **Type check and lint** — output of `npx tsc --noEmit` and `npm run lint`.
12. **Scope-creep check** — explicit confirmation that:
    - No canon file outside `question-bank-v1.md` and `signal-library.md` was modified.
    - `tension-library-v1.md` T-009 was not modified.
    - No new tensions were authored.
    - The three legacy responsibility signals were deprecated, not deleted.
    - No `card_id: "gravity"` was introduced.
    - No helper field was added to Q-C4.
    - `app/components/Ranking.tsx` and `app/page.tsx` were not modified.
    - No question other than Q-C4 was added or modified.
13. **Risks / next-step recommendations** — anything that surfaced during execution. Specifically:
    - Surface T-009 as the most pressing follow-up: it is now formally canon-blocked because its referenced signals are deprecated. Recommend the rewrite path (consume `individual_responsibility_priority` AND `system_responsibility_priority` at rank ≤ 2, plus possibly authority/system tension or individual/authority alignment as new tensions).
    - Note that the Q-C4 result page will look thinner than expected because no v1 tension consumes the new signals. Same v1-known-state pattern as Q-X3 / Q-X4.
    - Note any unexpected friction from the canon-replacement pattern (this is the first CC where canon and code both go from "exists, blocked" to "replaced").
    - Any other observation worth surfacing.
