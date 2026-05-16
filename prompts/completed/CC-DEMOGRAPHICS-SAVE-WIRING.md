# CC-DEMOGRAPHICS-SAVE-WIRING

## Objective

Two-part scope, single landing:

1. **Forward-fix** — restore demographics persistence so every new assessment submission writes `name`, `email`, `gender`, `age`, `occupation`, `contact_mobile` (whatever fields the assessment collects) to the `demographics` table linked to the session row. Bug currently affects 100% of prod submissions: all 13 prod sessions are anonymous; email-gate completion does not persist to DB.

2. **Ghost-mapping reconciliation** — add an admin tool that lets a logged-in admin attach known-user identities to the existing 13 anonymous prod session rows by reviewing each row's answer fingerprint (Q-I1 freeform value + top Compass values + Q-GRIP1 top + Q-Stakes1 top). Apply the reconciliation against prod DB after the executor confirms each mapping with the in-CC fingerprint table.

This is the next CC after Wave 1. Blocks Cindy upload and resolves the cohort-denominator contamination flagged in PHASE-1.

## Specific findings from 2026-05-16 observation

**Symptom — SAVE AND FINISH button greyed.** User selected "Skilled trades" on the occupation page; button stayed greyed. Workaround: SKIP — SAVE WITHOUT THESE saves the session and answers but loses demographics. Screenshot in user's Cowork chat memory.

**Symptom — email gate completion not persisting.** Per the user 2026-05-16: "no demographics are saved, so I'm nervous about adding more profiles which will create more Anonymous." Email is collected via CC-HEADER-NAV-AND-EMAIL-GATE flow (landed earlier), but neither email nor any other demographic appears in DB rows for the 13 prod sessions.

**Evidence — Daniel's prod upload 2026-05-16 ~11:34 + re-render 12:28.** Anonymous session in prod DB with answers but no demographics. Q-I1 freeform = "Faith and Family". This is the most recent confirmation that the save path is broken end-to-end, not just on the occupation page.

**Out of scope:** the SAVE AND FINISH button greying is a separate gating issue (cosmetic). The load-bearing failure is that NO demographic field persists. Fix the save path first; button gating is a Phase 2 within this CC after the save path is wired.

## Sequencing

- Depends on: Wave 1 deploy complete (it is — commit `5607de0`, prod migration applied, smoke verified 2026-05-16 12:28).
- Blocks: Cindy upload to prod, any further calibration work that depends on identifiable cohort rows.
- Independent of: any Wave 2 prose-routing CC. Touches different code paths (form submission + admin UI), not engine prose or rendering.

## Launch Directive

Run with `claude --dangerously-skip-permissions`. Project-level `.claude/settings.local.json` has `defaultMode: "bypassPermissions"`.

## Execution Directive

Complete in a single pass. Multi-part scope: (1) diagnose where the save path breaks; (2) fix forward; (3) build ghost-mapping admin tool; (4) apply ghost-mapping to existing prod rows interactively (NOT auto-apply); (5) audit + verify.

**If the bug is more complex than a single broken wiring point** (e.g., the demographics flow itself was never wired to write to the demographics table at all, requiring new code rather than a fix), pause and report back before writing more than ~200 lines of new wiring code. Don't refactor the assessment flow architecture without confirmation.

## Bash Commands Authorized

- `grep`, `ls`, `cat`, `find`, `wc` for inspection
- `npx tsc --noEmit`
- `npm run lint`
- `npx tsx tests/audit/<name>.audit.ts` for individual audit runs
- `psql` against local Postgres for diagnosis
- `psql` against **prod** Postgres ONLY for the ghost-mapping read-and-update pass, AND only after explicit per-row confirmation in the executor's report-back
- `git diff`, `git log -S "<bytes>"` for source archaeology

**Do not run** `npm install`, `git commit`, `git push`, `drizzle-kit push` (schema is already correct — both `sessions` and `demographics` tables exist from migration 0002), or any build script that calls the LLM.

## Read First (Required)

1. `prompts/completed/CC-HEADER-NAV-AND-EMAIL-GATE.md` — defines the email gate flow that should be persisting email. Locate the original wiring intent.
2. `db/schema.ts` — confirm `demographics` table shape: which columns exist, what FK links it to `sessions`.
3. `db/migrations/0002_clumsy_rocket_raccoon.sql` — the migration that added `contact_email` / `contact_mobile` columns. Confirms the column names the save path should write.
4. `lib/saveSession.ts` — modified in Wave 1; verify the save path either includes demographics or has a sibling `saveDemographics` function. This is the most likely location of the broken wiring.
5. `app/api/` — find the API route the assessment submission POSTs to (likely `app/api/sessions/route.ts` or `app/api/saveSession/route.ts`).
6. `app/components/assessment/` (or wherever the React form lives) — find the SAVE AND FINISH button handler. Verify form state includes demographics fields and propagates to the submit POST body.
7. `app/admin/sessions/` — existing admin pages; the ghost-mapping tool builds on this surface.

The executor should grep for these signatures to locate code:
- `name:.*string|email:.*string|gender:.*string|occupation:.*string` in TypeScript files
- `demographics` (any case) across `app/`, `lib/`, `db/`
- `SAVE AND FINISH` or `Save and finish` literal string for the button handler
- `contact_email|contact_mobile` for the schema column references

## Scope

### Item 1 — Diagnose end-to-end save path (investigation; no code changes)

Trace one full submission from "user clicks SAVE AND FINISH on assessment" to "row written in `sessions` and `demographics` tables." For each layer, document in the executor report-back:

- Form state: what fields does the React form hold? Are demographics part of it?
- Submit handler: what gets sent in the POST body? Does demographics get included?
- API route: what does the route handler receive, and what does it write to the DB?
- DB write layer: does `lib/saveSession.ts` (or wherever the write happens) insert into `demographics` or only `sessions`?

Identify the **specific failure point**. The bug is one of:
- (A) form state never captures demographics (UI bug)
- (B) submit handler doesn't include demographics in POST body (component/form bug)
- (C) API route drops demographics from payload before DB write (API bug)
- (D) DB write layer never inserts into demographics table (write-layer bug)
- (E) all four — demographics flow was never fully wired (architectural gap)

Report-back must name the failure point with file + line numbers before proceeding to Item 2.

### Item 2 — Forward-fix the save path

Once the failure point is identified, write the minimum-viable wiring so:
- Every demographics field collected by the assessment UI persists to the `demographics` table
- The `demographics` row is FK-linked to the corresponding `sessions` row
- Idempotent: re-submitting the same session updates the existing demographics row rather than creating a duplicate
- Backward-compatible: existing anonymous rows in prod (13 of them) are NOT modified by this code path; they're handled by Item 4

**Smoke verification**: end-to-end submit a new assessment with all demographics filled, verify the DB row in `demographics` has every field populated. This smoke must run locally against the local DB before any prod work.

### Item 3 — Fix the SAVE AND FINISH button gating

After save path is wired, fix the button greying. Likely cause: button is disabled until N required demographics fields are populated, and one of them is hidden/scrolled-off the visible page. Either:
- Identify which fields gate the button and ensure they're all visible to the user, OR
- Loosen the gating to "button active when ANY single field is populated" (matching the SKIP path which already works), OR
- Match the gating intent to what's actually possible to fill on the visible page

The cosmetic fix is lower-priority than the save-path fix. Land it if it's quick; defer to a CODEX-NN follow-up if it requires meaningful UI refactor.

### Item 4 — Ghost-mapping admin tool

New admin page at `app/admin/sessions/ghost-mapping/page.tsx` (or similar). Behavior:

1. Lists all `sessions` rows where the linked `demographics` row is null or has null name/email
2. For each anonymous row, displays:
   - Session ID (UUID)
   - Created at
   - Q-I1 freeform value (the belief they'd bear cost for)
   - Top 4 Compass values (from Q-S1 / Q-S2 cross)
   - Q-GRIP1 top-3 (what they grip)
   - Q-Stakes1 top-2 (what they'd hurt to lose)
   - Q-A2 response (energy direction)
3. Admin user can fill in name / email / gender / age / occupation manually
4. Save button writes to `demographics` table linked to that session
5. Audit log: every ghost-mapped row writes its own log entry to a new `ghost_mapping_audit` table (or appends to an existing audit log if one exists) with timestamp, admin user, before/after values

**Critical constraint**: admin tool must NEVER auto-match. Every mapping requires explicit admin click. The fingerprint display is decision support, not automation.

### Item 5 — Apply ghost-mapping to existing 13 anonymous prod rows

Using the fingerprint table below, the executor runs the ghost-mapping admin tool against prod (locally, via psql with prod DATABASE_URL) for each known anonymous row. Reports back per-row: which session UUID matched to which named user, and what fingerprint clinched the match.

**Known-user fingerprints (from 2026-05-16 cohort review):**

| Name | Q-I1 freeform | Top Compass cluster | Q-GRIP1 top |
|---|---|---|---|
| JasonDMcG | "Heaven and Hell are most meaningful a place we can reach on earth..." | Faith / Peace / Honor / Knowledge | Being right / Control / Money or security |
| Michele | "That people should love, in its truest form, whoever they want." | Family / Freedom / Compassion / Loyalty | Approval / Control / Reputation |
| Kevin | (Q-I1 value not in chat — match by other fingerprint) | Faith / Truth / Justice / Peace | (review answers in admin tool) |
| Ashley | "People are born good." | Family / Freedom / Knowledge / Truth | Control / Being right / Comfort or escape |
| Harry | (Q-I1 value not in chat — match by other fingerprint) | (review answers in admin tool) | (review answers in admin tool) |
| Daniel (anonymous prod upload 2026-05-16 ~11:34) | "Faith and Family" | Faith / Honor / Family / Loyalty | Control / Money or security / A plan that used to work |

**Cindy is NOT yet uploaded to prod**; her local-DB session predates this CC. Do not attempt to map Cindy in this pass.

**Unknown rows**: if the executor finds anonymous rows that don't match any of the 6 known users above, those are real anonymous users who completed the assessment without identifying themselves (or test-completion sessions from before email-gate was wired). Leave those as-is; flag the count in the report-back so Jason can decide whether to delete them.

### Item 6 — Audit

New `tests/audit/demographicsSaveWiring.audit.ts` with assertions:

1. New submission round-trip: post a fixture assessment via the API, verify the row in `demographics` has every field populated
2. Idempotency: post the same session twice, verify only one `demographics` row exists
3. FK integrity: every `demographics` row has a valid `session_id` foreign key
4. Ghost-mapping tool: the admin page exists and renders without throwing
5. Ghost-mapping audit log: a write to ghost-mapping triggers an audit-log entry

### Item 7 — Regression gates

After Items 1–6 land:
- `npx tsc --noEmit` passes
- `npm run lint` passes
- All Wave 1 audits still pass (`llmRewritesPersistedOnSession`, `staleShapeDetector`, `calibrationPhase1DistributionAudit`, `twoTierRenderSurfaceCleanup`)
- Standard cohort sweep passes
- The new `demographicsSaveWiring.audit.ts` passes
- `proseRegister.audit.ts` continues to fail in its pre-existing 24h-cache-freshness assertion (unrelated; documented)

## Do NOT

- **Do NOT modify engine output, prose templates, cache files, or fixtures.** This CC is form-submission + DB-write + admin-UI scope only. Engine math is untouched.
- **Do NOT touch the Wave 1 persistence wiring.** `lib/proseRewriteLlmServer.ts`, `lib/keystoneRewriteLlmServer.ts`, `lib/synthesis3LlmServer.ts`, `lib/gripTaxonomyLlmServer.ts`, `lib/launchPolishV3LlmServer.ts`, `lib/llmRewritesBundle.ts`, `lib/sessionLlmBundleStore.ts`, `lib/staleShape.ts` — all off-limits. Wave 1's cache-or-engine guarantee must be preserved byte-for-byte.
- **Do NOT call any LLM.** No `*LlmServer.ts` imports. No `@anthropic-ai/sdk` references. No build script invocations. Executor runs with no `ANTHROPIC_API_KEY` in scope.
- **Do NOT auto-match anonymous rows to named users.** Ghost-mapping is admin-confirmation-required. Every mapping goes through the tool's UI with explicit human click.
- **Do NOT delete any existing anonymous rows.** Unknown / unmatched anonymous rows stay; this CC reports their count but does not act on them.
- **Do NOT change the schema.** `sessions` and `demographics` tables already exist; their columns are sufficient. If the executor thinks a schema change is needed, pause and report back.
- **Do NOT commit or push.** Leave the branch dirty for review.
- **Do NOT apply ghost-mapping writes to prod DB before reporting back the matched fingerprints.** Every per-row prod write requires the report-back to name the session UUID, the matched user, and the fingerprint that clinched the match. After report-back, Jason confirms before the executor applies the writes — OR the executor applies the writes locally first (against a copy of prod DB) and reports the diff before touching prod.
- **Do NOT regenerate any cache file.** `lib/cache/*.json` are off-limits.
- **Do NOT rotate or modify any Vercel env var or DB credentials.**

## Allowed to Modify

- `app/components/assessment/*` (or the actual location of the React form — executor confirms during Read First)
- `app/api/sessions/*` or wherever the submission API route lives
- `app/admin/sessions/ghost-mapping/page.tsx` (new file)
- `lib/saveSession.ts` (modified in Wave 1; demographics-save additions only, no touching the persistence pieces)
- `db/schema.ts` ONLY if the ghost-mapping audit log table needs to be added (and only if no existing audit log table is usable)
- `db/migrations/0005_*.sql` ONLY if a new audit-log table is added (and only if Item 6 audit Assertion 5 can't be satisfied by writing to an existing log surface)
- `tests/audit/demographicsSaveWiring.audit.ts` (new file)
- `package.json` (add `audit:demographics-save-wiring` script)
- Move `prompts/active/CC-DEMOGRAPHICS-SAVE-WIRING.md` → `prompts/completed/` at the end

Anything not listed is forbidden. Specifically: do not touch `lib/identityEngine.ts`, `lib/renderMirror*.ts`, `lib/oceanDashboard.ts`, `lib/threeCStrength.ts`, `lib/drive.ts`, `lib/gripPattern.ts`, `lib/gripTaxonomy.ts`, `lib/aim.ts`, `lib/riskForm.ts`, `lib/movementLimiter.ts`, or any prose-template/cache files.

## Out of Scope

- Any engine-output change
- Any prose / cache / fixture change
- Schema changes beyond optionally adding a ghost-mapping audit-log table (and only when an existing audit surface isn't reusable)
- Re-running migrations against prod (schema is correct already)
- Cindy upload to prod (separate manual step after this CC lands)
- Engine version regression fixes (see `feedback_engine_version_split_refuted.md` — that hypothesis is dead)
- Wave 2 prose-routing CCs (separate track)

## Acceptance Criteria

1. `npx tsc --noEmit` passes
2. `npm run lint` passes
3. `npx tsx tests/audit/demographicsSaveWiring.audit.ts` passes all 5 assertions
4. Standard cohort sweep audit still passes
5. `npm run audit:llm-rewrites-persisted-on-session` still passes (Wave 1 untouched)
6. `npm run audit:calibration-phase-1` still produces byte-identical artifact (Wave 1 untouched)
7. New local-DB submission with full demographics fills name / email / gender / age / occupation / contact_mobile correctly
8. Ghost-mapping admin tool renders, lists anonymous sessions, and supports per-row manual identity attach
9. Audit log records every ghost-mapping write with timestamp + before/after
10. Report-back includes the fingerprint matches for the 6 known users (whichever the executor identified) and the count of unknown anonymous rows
11. Zero modifications to Wave 1 persistence files (`lib/proseRewriteLlmServer.ts`, `lib/keystoneRewriteLlmServer.ts`, `lib/synthesis3LlmServer.ts`, `lib/gripTaxonomyLlmServer.ts`, `lib/launchPolishV3LlmServer.ts`, `lib/llmRewritesBundle.ts`, `lib/sessionLlmBundleStore.ts`, `lib/staleShape.ts`)
12. Zero engine output changes (cohort sweep is byte-identical)
13. Zero LLM calls
14. Zero `lib/cache/*.json` modifications
15. Zero commits or pushes

## Report Back

Include in the CC summary:
- The diagnosis: failure point identified (A/B/C/D/E from Item 1) with file + line numbers
- The forward-fix: which files were modified and what the wiring change was
- The button-gating fix: applied or deferred to follow-up, with reasoning
- The ghost-mapping admin tool: location, screenshot or description of the UI
- The matched anonymous rows: per-row session UUID + matched name + fingerprint excerpt that clinched the match
- The count of unknown anonymous rows (not matched to any known user)
- Audit results (5/5 should pass)
- Regression sweep results (which audits pass / fail)
- Any ambiguity encountered + canon-faithful resolution applied
- Confirmation that no `ANTHROPIC_API_KEY` was in scope during the run
- Confirmation that Wave 1 files were not modified
- Local DB row count before and after (should be 13 sessions both before and after; demographics rows go up by however many were ghost-mapped)

## Notes for executor

- Estimated executor time: 60–90 minutes. Most of the time is the diagnosis + form/API/DB wiring. Ghost-mapping admin tool is straightforward CRUD. Audit is small.
- Cost: $0. No API spend. No LLM rewrites. No new migrations (only optional 0005 for audit-log table).
- The bug is pre-existing; it was never wired in the first place per Jason's observation. Don't waste time looking for a regression — assume the demographics save path was simply never implemented end-to-end, even though the schema columns exist.
- If you find the demographics flow uses a third-party form library (Formik, react-hook-form, Tanstack Form, etc.) that's already wired to `email` but not the other fields, the fix may be as simple as adding the other field bindings to the existing form schema.
- The ghost-mapping audit log is for traceability; if Jason later wonders "why does Daniel's session have an email" — the log shows when and who.
