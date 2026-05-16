# CC-CALIBRATION-PHASE-1-DISTRIBUTION-AUDIT

## Objective

Produce a read-only Phase 1 calibration evidence base: distribution histograms + cross-question contradiction table that every downstream calibration CC will read against. Two cohort sources, side-by-side: (a) the existing committed fixtures under `tests/fixtures/cohort` (baseline), and (b) the live persisted sessions backfilled by CC-LLM-REWRITES-PERSISTED-ON-SESSION (delta). The side-by-side answers the question "has the online deployment shifted the distributions the engine was calibrated against?" — which is the gate every Wave 4 calibration CC sits behind.

Output is a Markdown artifact committed to `docs/calibration/phase-1-distribution-audit.md` (NOT a code change, NOT a runtime feature, NOT a UI surface). The artifact is the deliverable.

This is Wave 1 / item 3 of the post-persistence punch list.

## Specific findings from 2026-05-16 cohort analysis (to test/confirm in this audit)

The audit must explicitly test the following findings that surfaced during the 2026-05-16 manual cohort review of 7 real-session reports (JasonDMcG / Michele / Ashley / Kevin / Harry on current engine; Daniel / Cindy on pre-online engine). Each finding is a testable hypothesis; the audit's job is to either confirm with cohort data or refute with cohort data.

**F1 — Engine-version split for §13 stakes amplifier.** Pre-online sessions (Daniel, Cindy) show +12 to +15 composed-vs-defensive amplification. Current-engine sessions show 0 to +5.6. Hypothesis: a code change between approximately 2026-05-10 and 2026-05-16 weakened or gated the amplifier. The audit's histogram must split by engine version (use `engine_shape_version` column if CC-STALE-SHAPE-DETECTOR has shipped; otherwise infer from `created_at` timestamp with a cutoff date documented in the artifact). Pull side-by-side amplification distributions for the two version groups.

**F2 — Composed Grip distribution compression.** Current-engine cohort (n=5) spans only composed Grip 17.8–30.6 (13-point range). Pre-online cohort (n=2) spans 38.2–55.0. Hypothesis: current engine compresses Grip distribution at the low end. Audit must produce a Grip-composed histogram with a 5-point bucket and split by engine version. Expected healthy distribution per Trajectory Model Refinement canon: meaningful presence in all bands 0–100, with cohort-typical density in the 30–60 range. Flag if more than 60% of current-engine sessions sit in a single 15-point band.

**F3 — Soul ceiling cluster.** 6 of 7 cohort users at Soul ≥ 95. Only JasonDMcG (Soul 79) sits below 90. Hypothesis: Soul aggregation lacks resolution in the upper range. Audit must produce a Soul histogram with 5-point buckets. Also split Soul by Q-A2 response (Building or creating / Deepening relationships and care / Exploring, learning, or wandering) — predicted finding per the 2026-05-16 review: the "Building or creating" cohort under-reads on Soul even when their other answers (Q-GS1, Q-V1) indicate cause-orientation.

**F4 — Cause-Soul vs Person-Soul vector hypothesis.** Soul currently conflates two motivational registers: orientation toward cause/humanity (cause-Soul) vs orientation toward specific people (person-Soul). Audit must compute two derived scores per session:
- *cause-Soul-proxy* = signal from Q-A2 "Building or creating" + Q-GS1 #1 "Served something larger than me" or "Expressed something true that needed form" + Q-V1 #1 "Tie it to a belief I would bear cost to protect" or "Explain the logic, model, or structure."
- *person-Soul-proxy* = signal from Q-A2 "Deepening relationships and care" + Q-GS1 #1 "Helped people I care about" + Q-V1 #1 "Name the person, people, or cause it serves."

Plot the two proxies against the engine's existing Soul score for all sessions. Expected finding if the hypothesis holds: JasonDMcG and Ashley should score significantly higher on cause-Soul-proxy than person-Soul-proxy; Daniel, Cindy, Kevin, Michele, Harry should show the opposite. If the engine's single Soul score correlates only with person-Soul-proxy and ignores cause-Soul-proxy, the vector hypothesis is confirmed and CC-BUILD-CREATE-SPLIT becomes load-bearing.

**F5 — Cohort-cache zero-match-rate.** Per the CC-LLM-REWRITES-PERSISTED-ON-SESSION result summary: 11 of 13 sessions backfilled, all with zero matching cache keys across all 5 layers (prose / keystone / synthesis3 / grip / launchPolishV3). Audit must confirm this independently by re-running the bundle-lookup against the committed cohort cache. If confirmed, the artifact's "Inputs" section must document that no current real-session report is served by the LLM rewrite layer — every render falls through to engine prose. This sharpens the downstream prose-routing CCs (currently shape-blind engine prose IS what every real user sees).

**F6 — JasonDMcG self-report calibration anchor (informational, not authoritative).** Jason's stated lived position: "lowest Grip, highest Movement in the cohort." Engine current output: composed Grip 30.6 (tied with Michele, mid-pack), Usable Movement 68.0 (mid-pack — Kevin 75.7 above him). Audit must surface this discrepancy as a data point in the artifact's "subject self-report comparison" appendix, but explicitly NOT weight it as authoritative — per the editorial-discipline canon from the same 2026-05-16 review, calibration cannot be tuned to a single subject's intuition. The other 6 sessions' self-reports (gathered separately and outside this CC's scope) will eventually compose the full self-report basis.

**F7 — Grip Pattern card render gate.** Only Daniel (composed 55) and Cindy (composed 38.2) render the 4-layer Grip Pattern card in the current cohort. JasonDMcG renders it too (composed 30.6, cleanly-bucketed grips → Control/Mastery high confidence). Michele / Kevin / Ashley / Harry do not. Hypothesis: gate is bucket-mapping confidence (mixed-bucket surface grips fail to cleanly route to one of the 7 buckets), not composed-Grip score. Audit must count, per session, how many of the surface grips map to the same Grip Pattern bucket using the existing routing logic. Expected finding: cleanly-bucketed sessions render; mixed-bucket sessions don't.

## Sequencing

Independent of CC-STALE-SHAPE-DETECTOR and CC-TYPO-TRIPLET-FIX at write time (this CC touches docs + a new analytics script, no overlap with their engine / template / schema work). All three Wave 1 CCs can run in parallel.

Consumption-time dependency: CC-STALE-SHAPE-DETECTOR must land before any further calibration CC (Wave 4) fires against the output of this audit, because Daniel and Cindy are currently unrenderable and would be silently omitted from the live-side histograms without it. This CC itself runs to completion with that silent omission flagged in its own report-back — it does not block on the stale-shape CC, but it loudly logs which live sessions it could not read.

Drives Wave 4 directly: CC-BUILD-CREATE-SPLIT, CC-CALIBRATION-PHASE-2-CROSS-QUESTION-AUDIT, and CC-GRIP-STAKES-AMPLIFIER-RECALIBRATION all read this artifact as their evidence base.

## Launch Directive

Run with `claude --dangerously-skip-permissions`. Project-level `.claude/settings.local.json` has `defaultMode: "bypassPermissions"`.

## Execution Directive

Complete in a single pass. Do not pause for user confirmation. If a histogram cannot be produced because the underlying signal is not surfaced on either cohort source, document the gap inline in the artifact (mark as "DATA GAP — no signal surfaced on cohort, recommend Q-### audit before downstream calibration") rather than silently omitting.

## Bash Commands Authorized

- `npx tsx scripts/calibrationPhase1DistributionAudit.ts` (this CC creates this script)
- `npx tsc --noEmit`
- `npm run lint`
- `psql` against the local Postgres for live-cohort reads.
- `grep`, `ls`, `cat`, `find`, `wc` for inspection.

Do not run any `build*` script, `npm install`, `git commit`, `git push`, or anything that touches `api.anthropic.com`.

## Read First (Required)

1. `prompts/completed/CC-LLM-REWRITES-PERSISTED-ON-SESSION.md` — defines what `sessions.llm_rewrites` and `sessions.llm_rewrites_engine_hash` mean; the live-cohort read works against rows backfilled by this CC.
2. `db/schema.ts` — `sessions` table shape.
3. `tests/fixtures/cohort/` — file list + one fixture's contents to confirm the fixture-cohort read shape.
4. `data/questions.ts` — question_id list. Confirm Q-A2 (Soul split anchor), Q-GRIP1, Q-Stakes1, Q-3C2 (Grip / stakes / coverage anchors), Q-X3 / Q-X4 (Universal-Three multi-stage), Q-I2 / Q-I3 (Identity).
5. `lib/identityEngine.ts` (skim only) — confirm the engine entry point the script will call to materialize Risk Form labels + Grip distribution for each session. Do not edit.
6. `lib/staleShape.ts` (if CC-STALE-SHAPE-DETECTOR has shipped) — use the predicate to skip un-rerenderable rows gracefully on the live-cohort read. If the stale-shape detector is not yet present, wrap the live-cohort engine call in a try/catch and log skips rather than throwing.

## Scope

### Item 1 — Analytics script: `scripts/calibrationPhase1DistributionAudit.ts`

New script. Behavior:

1. Read both cohort sources:
   - **Fixtures cohort**: every file under `tests/fixtures/cohort/`. Materialize the InnerConstitution for each via the engine.
   - **Live cohort**: every row in `sessions` with non-NULL `answers`. Materialize via the engine. Wrap in try/catch; log + skip any row that throws (typically stale-shape rows; CC-STALE-SHAPE-DETECTOR resolves this, but the audit runs cleanly with or without that CC's outcome present).
2. For each cohort source, produce the following distributions (each one explicitly testing one or more of findings F1–F7 above):
   - **Composed Grip distribution split by engine version** (F1, F2) — 5-point buckets 0–100, side-by-side pre-online vs current. Annotate cohort medians per group.
   - **Defensive Grip → Composed Grip amplification distribution split by engine version** (F1) — histogram of `(composed - defensive)` per session, side-by-side. Confirms or refutes the amplifier-regression hypothesis.
   - **Soul-axis distribution** (F3) — 5-point buckets 0–100. Flag if more than X% of sessions sit in a single 10-point band (X documented in the artifact text, not in script logic).
   - **Soul-axis distribution split by Q-A2 response** (F3, F4) — count of sessions per Soul bucket × Q-A2 answer (Building or creating / Deepening relationships and care / Exploring, learning, or wandering).
   - **Cause-Soul-proxy vs Person-Soul-proxy scatter against engine Soul score** (F4) — per the F4 definitions above. Annotate each session's name on the scatter.
   - **Grip Pattern card render rate by surface-grip bucket alignment** (F7) — for each session: count surface grips, count distinct buckets the surface grips map to, mark whether the card renders. Predicted: renders correlate with low-bucket-count (cleanly-aligned grips) not with high composed Grip.
   - **Grip Pattern bucket distribution** — count of sessions per Grip Pattern bucket (Safety / Security / Belonging / Worth / Recognition / Control / Purpose / unmapped). Surface unmapped count as a flag.
   - **Risk Form label distribution** — count of sessions per label across the 5-band classifier (Open-Handed Aim / White-Knuckled Aim / Lightly Governed Movement / Strained Integration / Ungoverned Movement, plus any twin labels emitted by CC-MOMENTUM-HONESTY's 12-label Quadrant union). Expected per the cohort review: zero sessions in Lightly Governed Movement (canon wiring not landed) — confirm or refute.
   - **Cost / Coverage / Compliance bucket lean distribution** — count of sessions per bucket (Cost-leaning / Coverage-leaning / Compliance-leaning / aligned), using the 38% threshold per `workMap.ts` / `loveMap.ts` canon.
   - **Drive Case distribution** — count of sessions per DriveCase classification (aligned / inverted / split / etc.).
   - **Cohort-cache match-rate per session, per layer** (F5) — for each backfilled session: count keys in the session's `llm_rewrites` bundle per layer (prose / keystone / synthesis3 / grip / launchPolishV3). Confirm or refute the "zero matches across all 11 backfilled sessions" finding from the persistence CC.
3. Produce one cross-question contradiction table:
   - Rows: pairs of questions that should correlate per canon (e.g., Q-A2 ↔ Q-E1-outward; Q-Stakes1 ↔ Q-GRIP1; Q-I2 ↔ Q-I3; etc. — confirm the canonical correlate list from `feedback_honor_every_answer_canon` / `reference_question_bank_table`).
   - Columns: response combos that count as "expected" vs "contradiction."
   - Cell: count of sessions exhibiting each combo, per cohort source.
   - Each row flags its contradiction-rate as a percentage. Rates above an inline threshold (e.g., 25%) get a bold marker — the threshold is documented in the artifact text, not hard-coded into the script's logic.
4. Side-by-side delta: every histogram and the contradiction table appear twice in the artifact — once for the fixtures cohort, once for the live cohort — and a third "delta" column / line for each row that calls out shift direction + magnitude. The delta column is the entire reason the live-cohort read exists.

The script is pure analytics: it reads, materializes via engine, counts, and writes Markdown. It does NOT modify engine output, cache, sessions, or any other DB table. It does NOT call the LLM render path.

Add an npm script: `"audit:calibration-phase-1": "tsx scripts/calibrationPhase1DistributionAudit.ts"`.

### Item 2 — Artifact: `docs/calibration/phase-1-distribution-audit.md`

The script writes its output to this path. Structure:

1. **Header** — cohort counts (fixtures N / live N / live skipped N + skip reasons + engine version split counts).
2. **Findings summary** — one paragraph per finding F1–F7 above, with "confirmed / refuted / inconclusive" verdict and the histogram(s) that supported the verdict.
3. **Composed Grip × engine version** — fixtures, live (split pre-online vs current), delta.
4. **Amplifier × engine version** — fixtures, live (split), delta.
5. **Soul-axis** — fixtures, live, delta.
6. **Soul-axis × Q-A2** — fixtures, live, delta.
7. **Cause-Soul / Person-Soul scatter** — fixtures + live combined with session-name labels.
8. **Grip Pattern card render × bucket alignment** — fixtures, live, delta.
9. **Grip Pattern bucket distribution** — fixtures, live, delta.
10. **Risk Form label distribution** — fixtures, live, delta. Explicitly check for Lightly Governed Movement presence.
11. **3C bucket lean distribution** — fixtures, live, delta.
12. **DriveCase distribution** — fixtures, live, delta.
13. **Cohort-cache match-rate per session per layer** — live only (fixtures are the cohort cache, so they trivially match themselves).
14. **Cross-question contradiction table** — fixtures, live, delta. Bold markers on high-rate rows.
15. **Subject self-report comparison appendix** — JasonDMcG only for now (one-row table: his stated position vs his rendered numbers). Per F6, this is data not authority.
16. **Data gaps** — any histogram that could not be produced because the underlying signal is not surfaced.
17. **Inputs** — git SHA at run time, cohort file list (fixtures), `sessions` row count + filter (live), the version of the engine entry point called, the engine-version cutoff date used to split pre-online vs current (if `engine_shape_version` is absent).

Commit the artifact (and the script that produced it). The artifact is the gate for Wave 4.

### Item 3 — Audit: `tests/audit/calibrationPhase1DistributionAudit.audit.ts`

Hand-rolled audit. Verifies:

1. `scripts/calibrationPhase1DistributionAudit.ts` exists.
2. The script contains NO import from any `lib/*LlmServer.ts` file (grep, fail if matched).
3. The script does NOT instantiate the Anthropic SDK (grep `@anthropic-ai/sdk`, fail if matched).
4. The script does NOT write to any path under `lib/cache/`, `db/`, `tests/fixtures/`, or the `sessions` table (grep + a runtime check via a write-monitoring fixture).
5. `docs/calibration/phase-1-distribution-audit.md` exists and contains the 9 structural sections named in Item 2.
6. Each histogram in the artifact contains both a fixtures-cohort table and a live-cohort table, plus a delta annotation.

### Item 4 — Regression gates

After Items 1–3 land:

- `npx tsc --noEmit` passes.
- `npm run lint` passes.
- The standard cohort sweep audit still passes (this CC does not modify engine output; cohort sweep should be byte-identical).
- `npm run audit:llm-rewrites-persisted-on-session` still passes (no schema or render-path change here).

## Do NOT

- **Do NOT modify engine output, prose templates, cache files, sessions rows, or fixtures.** This is a read-only analytics CC. Any mutation outside the new script + new artifact + new audit + `package.json` script entry is forbidden.
- **Do NOT call the LLM render path.** The script materializes engine output only. No `lib/*LlmServer.ts` import. No SDK instantiation.
- **Do NOT touch `lib/cache/*.json` files.**
- **Do NOT add a UI surface for the artifact.** The deliverable is a Markdown file in `docs/`. No admin page, no React component, no API endpoint.
- **Do NOT add a build-time hook that regenerates the artifact on `npm run build`.** Regeneration is explicitly user-initiated via `npm run audit:calibration-phase-1`.
- **Do NOT propose Wave 4 calibration changes inside this CC.** This CC produces the evidence base. Decisions about Build/Create split, amplifier recalibration, cause-Soul / person-Soul split, etc. live in Wave 4 CCs that read this artifact. The artifact may state "F4 hypothesis confirmed" but MUST NOT propose what to do about it.
- **Do NOT tune any coefficient to JasonDMcG's self-report.** F6 is data, not a target. The artifact surfaces the discrepancy; downstream CCs choose how to weigh it alongside the other 6 sessions' self-reports (which arrive separately).
- **Do NOT include any session that throws on engine materialization unless it produces a skip-reason log.** Each skipped session must appear in the "live skipped" header line by `sessionId` + skip reason. Silent omission is forbidden.
- **Do NOT silently omit live sessions that fail to render.** Log them in the artifact's "live skipped" header line with the skip reason (typically stale-shape — that's CC-STALE-SHAPE-DETECTOR's job to resolve).
- **Do NOT bump any cache version.** The prose-rewrite version bump is owned by CC-TYPO-TRIPLET-FIX; nothing else in this CC moves any version constant.
- **Do NOT call `api.anthropic.com`.** Executor runs with no `ANTHROPIC_API_KEY` in scope.
- **Do NOT add new dependencies.** Drizzle + postgres + tsx + the existing project deps cover all of this.
- **Do NOT introduce a database write of any kind.** The script reads `sessions`; it does not insert, update, or delete.
- **Do NOT commit or push.** Leave for review.

## Allowed to Modify

- `scripts/calibrationPhase1DistributionAudit.ts` (new file)
- `docs/calibration/phase-1-distribution-audit.md` (new file, written by the script)
- `tests/audit/calibrationPhase1DistributionAudit.audit.ts` (new file)
- `package.json` (add `"audit:calibration-phase-1"` script; nothing else)

Anything not listed is forbidden. Specifically: do not touch `lib/`, `app/`, `db/`, `data/`, `tests/fixtures/`, or any existing audit.

## Out of Scope

- Any change to engine output, prose, or cache.
- Wave 4 calibration changes (Build/Create split, amplifier recalibration, cross-question audit logic).
- UI surfaces for the artifact.
- A build-time regen hook.
- Database mutations.
- Re-derive-and-persist for stale-shape rows (that's CC-STALE-SHAPE-DETECTOR).
- New fixtures.

## Acceptance Criteria

1. `npx tsc --noEmit` passes.
2. `npm run lint` passes.
3. `npx tsx tests/audit/calibrationPhase1DistributionAudit.audit.ts` passes all 6 assertions.
4. The standard cohort sweep audit still passes.
5. `npm run audit:llm-rewrites-persisted-on-session` still passes.
6. `npm run audit:calibration-phase-1` produces `docs/calibration/phase-1-distribution-audit.md` deterministically (re-running the script with the same DB state produces byte-identical output).
7. The artifact's "live skipped" header line is populated (zero or more rows; either is fine) with a skip reason per row.
8. No file outside the Allowed-to-Modify list has been edited.
9. Zero `lib/cache/*.json` files modified.
10. Zero `sessions` row mutations (database state pre/post run is identical; verify via row count + checksums on the rows the script read).
11. Zero requests to `api.anthropic.com` from the script's run.

## Report Back

Include in the CC summary:

- The artifact's header line verbatim (cohort counts).
- The five histogram delta headlines (one sentence per: where fixtures and live disagree most).
- The contradiction-table headline (which row had the highest live-cohort contradiction rate).
- Any data gaps surfaced.
- Whether CC-STALE-SHAPE-DETECTOR was present at run time, and the count of live-cohort sessions skipped because of stale-shape.
- The git SHA at run time.
- Any ambiguity encountered + canon-faithful resolution applied.
- Confirmation no API key was present in scope.

## Notes for executor

- Estimated executor time: 45–75 minutes. Most of the time is engine-materialization speed + getting the contradiction-table row list correct from canon.
- Cost: $0. No API spend. No LLM rewrites generated. No DB mutations.
- The artifact is consumed by humans (Jason / Clarence) and by Wave 4 CCs. Optimize for readability — tables not paragraphs, delta values explicit, threshold numbers documented inline rather than buried in script logic.
- If CC-STALE-SHAPE-DETECTOR has shipped, the live cohort should include Daniel and Cindy via re-derivation; verify their presence in the live-cohort row count. If it hasn't shipped, they'll appear in the skipped count — that's expected and not a blocker.
