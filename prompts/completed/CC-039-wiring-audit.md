# CC-039 — Wiring Audit (Systemic Connection Confirmation)

**Type:** Engineering verification + canon-doc generation. **No code logic changes. No new prose. No new questions or signals.** Output is a comprehensive audit document committed to `docs/audits/`.
**Goal:** Produce a single authoritative document that maps every signal in the instrument to every consumer, flags orphans both directions, and verifies structural completeness across cards / categories / patterns / tagging tables. Confirms — systematically — that the instrument's wiring is sound after the recent flurry of additions (CC-029 / CC-033 / CC-034 / CC-035 / CC-036 / CC-037 / CC-038).
**Predecessors:** Recommend running AFTER CC-038 ships (so the FUNCTION_PAIR_REGISTER table is auditable). Can run earlier if Jason wants pre-CC-038 baseline. None hard-blocked.
**Successor:** None. Surfaces gaps that may seed follow-on CCs but does not commit any.

---

## Why this CC

The instrument now carries substantial cross-card complexity — 34 questions, ~80+ signals, 17 cross-card patterns (post-CC-029), 12 gift categories, 8 ShapeCards, multiple tagging tables (sacred-priority, drive, OCEAN post-CC-037, function-pair-register post-CC-038), tension definitions, freeform-extraction signals, multi-stage derivations. The wiring is correct only if every signal that fires has a consumer and every consumer references signals that exist.

Recent rapid evolution heightens drift risk: CC-031 / CC-032 retired legacy v0 trust signals and replaced them with v2.5 split signals. CC-024 changed Q-I3's derivation source. CC-028 added 4 new sacred-priority signals. CC-033 added 4 ambition signals. CC-035 added `time_autonomy_stakes_priority`. CC-037 (in flight) tags every signal with OCEAN buckets. CC-038 (in flight) adds 16 aux-pair register entries. Across these changes, the right verification posture is *systemic, not incremental* — a single audit pass with a checklist that covers all connection types.

This CC delivers that audit as a documented artifact. The output is committed to `docs/audits/wiring-audit-YYYY-MM-DD.md` so future agents can compare against it, run the audit again, and detect drift over time. No code is changed.

---

## Scope

Files modified or created:

1. **NEW** — `docs/audits/wiring-audit-2026-04-29.md` (or current date). The audit document itself. Markdown, structured per the template below.
2. **NEW** — `docs/audits/README.md` (only if `docs/audits/` doesn't already exist). One-paragraph framing of what audit documents are for and how to read them.
3. (Optional) `docs/canon/question-bank-v1.md` — append a "last audited: YYYY-MM-DD" line at the top, pointing to the audit document. Don't edit any other content.

Nothing else. Specifically: **no code edits.** If the audit surfaces a code-level bug (e.g., a CROSS_CARD_PATTERN references a signal that doesn't exist), the audit *documents* the bug and surfaces a successor CC recommendation. CC-039 does not fix bugs in flight.

---

## The audit checklist — locked

The audit document follows this structure. Every section must be present, even if empty (with the note "no findings" inline).

### Section 1 — Signal Inventory

Enumerate every signal_id used in the instrument. Sources:

- `data/questions.ts` — every `signal:` value on every option / item.
- `lib/identityEngine.ts` — every signal emitted by `extractFreeformSignals` and any other signal-emission code paths.
- `lib/beliefHeuristics.ts` — any signals generated during belief-tension derivation.
- Any other library file that emits signals.

For each signal: name, source location (file:line), produced-by-question (if applicable).

Expected count: ~80–90 signals. If the count is dramatically different from this band, flag.

### Section 2 — Consumer Inventory

Enumerate every place where a signal_id is read. Categories:

- **Compass label / Gravity label maps** (`COMPASS_LABEL`, `GRAVITY_LABEL` in `lib/identityEngine.ts`).
- **Sacred priority list** (`SACRED_PRIORITY_SIGNAL_IDS` in `lib/identityEngine.ts`).
- **Drive tagging table** (`SIGNAL_DRIVE_TAGS` in `lib/drive.ts`).
- **OCEAN tagging table** (`SIGNAL_OCEAN_TAGS` in `lib/ocean.ts`, post-CC-037).
- **Cross-card pattern detection conditions** (`CROSS_CARD_PATTERNS` in `lib/identityEngine.ts`).
- **Tension definitions** (every tension's predicate).
- **Gift-category routing conditions** (`pickGiftCategory`, `categoryHasSupport` predicates referencing signal_ids — `truth_priority`, `faith_priority`, `freedom_priority`, etc.).
- **Aux-pair register** (post-CC-038, the FUNCTION_PAIR_REGISTER doesn't directly consume signals but surfaces via `LensStack`; note this).
- **`SIGNAL_DESCRIPTIONS` map** (every signal_id with a description entry).
- **Mirror prose generation** (any signal-keyed branches in lensCardHeader, deriveCompassOutput, etc.).
- **Multi-tag splits** (`MULTI_TAG_SPLITS` in `lib/drive.ts`).
- **Excluded-from-tagging signals** (entries with `"exclude"` tag in `SIGNAL_DRIVE_TAGS`).

For each consumer: location (file:line), purpose (one-line), signal_ids it references.

### Section 3 — Cross-Reference Matrix

Build a table: signal_ids on rows, consumer types on columns. Each cell ✓ if the signal is referenced by at least one consumer of that type, blank otherwise.

| signal_id | SIGNAL_DESC | COMPASS_LABEL | SACRED_PRIORITY | DRIVE_TAG | OCEAN_TAG | PATTERN_DETECT | TENSION_DETECT | GIFT_ROUTE | MIRROR_PROSE |
|---|---|---|---|---|---|---|---|---|---|
| ... | | | | | | | | | |

Rows ordered by signal_id alphabetically. Limit table width with abbreviated column headers if needed.

### Section 4 — Orphan Findings

**Direction A — Signals without consumers:** signals that are emitted but referenced by no consumer. Flag as either (i) intentionally-passive signals (e.g., demographic markers consumed only by the LLM-prose layer at runtime), or (ii) genuinely orphan signals indicating a wiring gap. Distinguish.

**Direction B — Consumers referencing non-existent signals:** any consumer that references a signal_id that no source emits. Flag as a wiring bug. Common causes: a signal was renamed (CC-031/CC-032 retired several legacy IDs) and a consumer wasn't updated, or a typo exists in a consumer's predicate.

For each orphan: location, the orphan signal_id, severity classification (informational / warning / bug), and a suggested resolution.

### Section 5 — Structural Completeness Checks

Confirm the following structural invariants. Each is a yes/no with location-of-evidence and a one-line note.

1. Every signal_id used in `data/questions.ts` is in `SIGNAL_DESCRIPTIONS` (no description-less signals firing).
2. Every signal in `SIGNAL_DESCRIPTIONS` is emitted by at least one source (no unreachable descriptions).
3. Every gift category in the type `GiftCategory` has entries in:
   - `GIFT_NOUN_PHRASE`
   - `GIFT_DESCRIPTION`
   - `GROWTH_EDGE_TEXT`
   - `BLIND_SPOT_TEXT_VARIANTS`
4. Every cross-card pattern's `applicable_card` is a valid `ShapeCardId` (verify against `SURVEY_CARD_TO_SHAPE_CARD` in `lib/cardAssets.ts`).
5. Every cross-card pattern's `detection` predicate compiles and references signals or accessors that exist.
6. Every tension's predicate compiles and references signals that exist.
7. Every multi-tag split signal in `MULTI_TAG_SPLITS` has the corresponding entry in `SIGNAL_DRIVE_TAGS` with `"multi"` tag.
8. Every entry in `SACRED_PRIORITY_SIGNAL_IDS` is also in `SIGNAL_DESCRIPTIONS`.
9. Every multi-tag entry in `SIGNAL_OCEAN_TAGS` (post-CC-037) tags only valid `OceanBucket` values.
10. Every `FUNCTION_PAIR_REGISTER` entry (post-CC-038) routes to a valid `GiftCategory`.
11. Every ShapeCardId has entries in `SHAPE_CARD_PRACTICE_TEXT` and `SHAPE_CARD_PATTERN_NOTE` (or is intentionally absent — Conviction skips Practice slot per CC-025).
12. Every question in `data/questions.ts` has a `card_id` that resolves via `SURVEY_CARD_TO_SHAPE_CARD` to a valid `ShapeCardId`.

### Section 6 — Coverage By Card

For each ShapeCardId (lens, compass, conviction, gravity, trust, weather, fire, path), report:

- Count of questions feeding the card (via card_id mapping).
- Count of cross-card patterns with `applicable_card` matching the card.
- Count of tensions associated with the card (if tensions are card-keyed).
- Count of signals primarily-attributed to the card (if `signal-library.md` carries `primary_cards` metadata).

Compare across cards. Flag cards with low coverage relative to peers.

### Section 7 — Coverage By Cognitive Function

For each of the 8 functions (ni, ne, si, se, ti, te, fi, fe), report:

- Count of cross-card patterns conditioned on the function (post-CC-029 expectation: ≥1 each).
- Count of gift-category routes per function (post-CC-034 + CC-036 + CC-038):
  - CC-034 fallback (1 per function for non-Ne/Ni; 0 for Ne; Ni has Pattern via legacy line).
  - CC-036 signal-conditioned routes (Si/Se/Ti/Te each have 1; 0 for Ne/Ni/Fi/Fe).
  - CC-038 aux-pair routes (2 per function — one for each viable auxiliary).
- Total gift-category breadth per function (sum of distinct categories that function can route to).

Confirm parity-program targets met: Ni at ~3 categories, Ne at 3 categories post-CC-038, others at 3+.

### Section 8 — Coverage By OCEAN Bucket (post-CC-037 only)

For each OCEAN bucket (O, C, E, A, N), report:

- Count of signals tagged to that bucket in `SIGNAL_OCEAN_TAGS`.
- Count of multi-tag signals contributing partial weight.
- Total expected weight contribution (sum of single-tag + multi-tag fractional).
- Flag buckets with dramatically lower coverage than peers (especially N — confirms the "weak floor" architecture is operating as designed).

### Section 9 — Coverage By Drive Bucket (post-CC-026 + CC-033 + CC-035)

For each Drive bucket (cost, coverage, compliance), report:

- Count of signals tagged to that bucket.
- Count of multi-tag signals contributing partial weight.
- Confirm post-CC-033 ambition signals (success / fame / wealth / legacy) all tag cost.
- Confirm post-CC-035 `time_autonomy_stakes_priority` tags compliance.

### Section 10 — Open Wiring Questions Surfaced

Any architectural questions raised by the audit. Examples that might appear:

- Should signal X (currently consumed only by tension Y) also be tagged for OCEAN?
- Does pattern Z's detection predicate match its prose intent? (Flag where the audit reveals a possible mismatch.)
- Are there gift categories that no function-pair register routes to and no signal-condition route fires for? (If yes, those categories are unreachable post-CC-038 and may be deprecated.)
- Does any tension reference a signal that was renamed in CC-031/CC-032 and never updated?

These are documentation, not action items. Surfacing them is the audit's job; resolving them is future work.

### Section 11 — Successor CC Recommendations

If the audit surfaces gaps that warrant a fix CC, name them concretely:

- "CC-040 — fix legacy-signal references in tension X" (if Section 4 flagged a renamed-signal consumer).
- "CC-041 — deprecate unreachable gift categories" (if Section 10 flagged any).
- "CC-042 — extend OCEAN tagging to signal Y" (if Section 8 flagged a coverage gap).

Each recommendation has: name, scope summary, severity, and pointer to the audit section that surfaced the gap.

---

## Steps

### 1. Read the codebase systematically

The executing engineer should:

- `grep -rn "signal:" data/questions.ts` to inventory question-emitted signals.
- `grep -n "extractFreeformSignals\|emit\|signal_id:" lib/` to inventory engine-emitted signals.
- `grep -n "SIGNAL_DESCRIPTIONS\b" lib/identityEngine.ts` to read the descriptions map.
- `grep -n "SIGNAL_DRIVE_TAGS\b" lib/drive.ts` to read the Drive tagging table.
- `grep -n "SIGNAL_OCEAN_TAGS\b" lib/ocean.ts` (if file exists, post-CC-037) to read OCEAN tagging.
- `grep -n "FUNCTION_PAIR_REGISTER\b" lib/identityEngine.ts` (if exists, post-CC-038).
- Read all of `CROSS_CARD_PATTERNS` (around line 3718+ in `lib/identityEngine.ts`).
- Locate and read tension definitions.
- Cross-check `SURVEY_CARD_TO_SHAPE_CARD` in `lib/cardAssets.ts`.

The audit is a comprehension exercise; the executing engineer is essentially reading the engine top to bottom and producing the cross-reference matrix.

### 2. Build the cross-reference matrix

For each signal, populate the Section 3 row by checking each consumer type. This is the most time-consuming step. The matrix becomes the artifact other audits compare against.

### 3. Run the orphan checks

Direction A: for each signal in the inventory, check whether ANY consumer references it. The set of unreferenced signals is Direction A's findings.

Direction B: for each consumer, list the signal_ids it references. Cross-check that each referenced signal appears in the inventory. Any reference to a non-existent signal is Direction B's finding.

### 4. Run the structural completeness checks

For each of the 12 invariants in Section 5, walk the code and verify. Each check is a discrete pass over a specific data structure. Document evidence inline (file:line).

### 5. Produce the coverage rollups

Sections 6–9 are aggregation passes over the inventory and consumer data already produced. Tabulate; compare; flag outliers.

### 6. Surface open questions and successor recommendations

Sections 10–11 are interpretive. The executing engineer makes judgment calls about what counts as an "open question" vs an "intentional design choice." When uncertain, surface as a question to Jason in the Report Back rather than asserting a verdict.

### 7. Write `docs/audits/wiring-audit-YYYY-MM-DD.md`

Compose the audit document. The document IS the deliverable. Use the section structure locked above. Include a header block with: audit date, codebase commit hash (output of `git rev-parse HEAD`), executing engineer's name (or "auto" if unattributed), and a one-paragraph executive summary.

### 8. (Conditional) Create `docs/audits/README.md`

If `docs/audits/` doesn't already exist as a directory, create a minimal README explaining the audits convention:

> Audit documents capture point-in-time wiring confirmations of the instrument. Each audit follows the CC-039 structure (Sections 1–11). Audits are immutable once committed — to update, run a new audit and commit alongside.

### 9. (Optional) Update `docs/canon/question-bank-v1.md`

Add a single "last audited: YYYY-MM-DD" reference line at the top, pointing to the audit document. No other edits to canonical question-bank content.

### 10. Verification

- The audit document exists at `docs/audits/wiring-audit-YYYY-MM-DD.md`.
- Every section from Section 1 through Section 11 is present.
- The cross-reference matrix is complete (no `???` placeholders).
- Orphan findings are categorized (informational / warning / bug).
- Structural completeness checks all have yes/no answers with evidence.
- `git diff --stat` shows changes only in `docs/audits/` (and optionally `docs/canon/question-bank-v1.md` for the timestamp line).

### 11. No browser smoke

CC-039 is documentation. Browser verification is not applicable.

---

## Acceptance

- `docs/audits/wiring-audit-YYYY-MM-DD.md` exists and contains all 11 sections per the locked structure.
- The cross-reference matrix is fully populated.
- Orphan findings are listed (or "no findings" noted explicitly).
- Structural completeness checks are answered with location-of-evidence per check.
- Coverage rollups (cards, functions, OCEAN, Drive) are tabulated.
- Successor CC recommendations name concrete next CCs (or "no successors needed" noted explicitly).
- `docs/audits/README.md` exists if the directory was newly created.
- `git diff --stat` shows changes only in named locations.
- No code files modified.

---

## Out of scope

- **Fixing any bugs surfaced by the audit.** The audit *documents* gaps; resolving them is future work.
- **Editing `lib/`, `app/`, or `data/` files.** Pure documentation CC.
- **Updating the question-bank xlsx** (the 5-sheet relationship table referenced in `reference_question_bank_table.md` memory). The xlsx update is a separate concern — could be a successor CC if Jason wants the audit reflected in the spreadsheet too.
- **Authoring new tensions or patterns** to fill coverage gaps.
- **Renaming signals.** The audit surfaces renamed-signal references but does not rename in this CC.
- **Editing canon docs other than `question-bank-v1.md`'s timestamp line and the new `docs/audits/` files.**
- **Re-running tests, lint, or build.** This CC produces no code changes; verification is documentation review.
- **Updating memory files.** Memory updates are out of scope for code-side CCs and should happen in Cowork chat sessions, not CC executions.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

Codex equivalent acceptable.

## Execution Directive

Single pass. Don't pause for user confirmation. The audit is structured; follow the section template strictly. Surface ambiguity as questions in the document itself rather than improvising verdicts. Don't edit code.

## Bash Commands Authorized

- `grep -rn "..." data/ lib/ app/ docs/` (read-only inventory commands)
- `rg "..."` (preferred over grep where available)
- `cat`, `ls`, `head`, `tail`
- `git rev-parse HEAD` (for the audit's header block)
- `git status` (to confirm no code changes)

No `tsc`, `lint`, `build`, or `test` commands needed since no code is changed.

## Read First (Required)

- `AGENTS.md`
- `data/questions.ts` — full file. Inventory every `signal:` value.
- `lib/identityEngine.ts` — full read for signal emissions, consumers, gift-category routing, `CROSS_CARD_PATTERNS`, `SIGNAL_DESCRIPTIONS`, `SACRED_PRIORITY_SIGNAL_IDS`, function-related maps.
- `lib/drive.ts` — `SIGNAL_DRIVE_TAGS`, `MULTI_TAG_SPLITS`.
- `lib/ocean.ts` — `SIGNAL_OCEAN_TAGS` (post-CC-037 only; if file doesn't exist, note in audit).
- `lib/beliefHeuristics.ts` — derivation logic and any signal-emission paths.
- `lib/cardAssets.ts` — `SURVEY_CARD_TO_SHAPE_CARD` mapping; ShapeCardId list.
- `lib/types.ts` — type definitions for `GiftCategory`, `OceanBucket`, `DriveBucket`, `FunctionPairKey`, `ShapeCardId`, etc.
- `prompts/completed/` — recent CCs (CC-024, CC-026, CC-028, CC-029, CC-031, CC-032, CC-033, CC-034, CC-035, CC-036, CC-037 if shipped, CC-038 if shipped) for context on what changed when.
- `docs/canon/signal-library.md` — current signal library doc (compare against actual code state for drift).

## Allowed to Modify

- `docs/audits/wiring-audit-YYYY-MM-DD.md` (new)
- `docs/audits/README.md` (new, only if directory is freshly created)
- `docs/canon/question-bank-v1.md` (only the "last audited" timestamp line; no other content edits)

## Report Back

1. **Files created** — paths.
2. **Audit highlights** — top 3 findings (most severe orphans, most surprising coverage gaps, most actionable successor recommendations). Don't paste the whole audit document; summarize.
3. **Successor CCs recommended** — concrete list with severity.
4. **Open questions surfaced** — anything the executing engineer flagged as ambiguous.
5. **Out-of-scope drift caught**.

---

## Notes for the executing engineer

- The audit document IS the deliverable. Don't truncate sections, don't skip the cross-reference matrix even if it's tedious, don't substitute summary for evidence. Future audits will diff against this one.
- For each orphan finding, classify carefully:
  - **Informational** — a signal intentionally not consumed by a structural map but used at runtime by the LLM-prose layer or by demographic-driven branching.
  - **Warning** — a signal that *should* probably be consumed (e.g., a sacred-priority signal that didn't make it into `SACRED_PRIORITY_SIGNAL_IDS`).
  - **Bug** — a signal that's actively broken (e.g., a tension predicate referencing a signal that no source emits).
- The Section 3 cross-reference matrix is the load-bearing artifact. Take the time to make it complete and accurate. Use file:line citations for every cell that's true.
- If a recent CC (CC-029 / CC-033 / CC-034 / CC-035 / CC-036 / CC-037 / CC-038) introduced a signal or consumer that the audit is the first to verify, name the introducing CC in the inventory entry. Helps future audits trace lineage.
- The "successor CC recommendations" section in the audit is suggestion-only. Each successor would be a separate Cowork-chat-drafted CC, not auto-spawned by the audit. Flag the recommendation; don't draft the prompt.
- If `docs/audits/` doesn't exist, the directory creation is implicit when the first audit file is written. Create the README in the same commit so the convention is documented.
- The audit timestamp in the filename should match the codebase commit hash recorded in the header block. If the executing engineer runs the audit against an in-flight worktree, note that in the header (e.g., "audit captured against worktree state on 2026-04-29; commit hash partial / dirty").
- The audit's value compounds. The first audit is the most expensive (no prior baseline). Subsequent audits diff against this one and run faster. Encourage Jason to run an audit per ~5–10 substantive CCs to keep the wiring confirmation cadence steady.
- This CC does not commit to a specific date in the filename. Use `git rev-parse HEAD` and the current date at execution time. The successor CC reference would adjust accordingly.
