# CC-STALE-SHAPE-DETECTOR

## Objective

Add an engine-side stale-shape detector + render-time type guard so that persisted sessions whose stored `innerConstitution` / engine bundle was written against an older schema version do not throw on report-view. Restores renderability for the two pre-online sessions the CC-LLM-REWRITES-PERSISTED-ON-SESSION backfill skipped — Daniel (`35d61070-fff7-497e-a518-04cb57d79059`) and Cindy (`5063c920-dc37-44a3-8931-8fd4fc8069fc`) — and any other rows in the same class. After this CC lands, every row in `sessions` is either (a) renderable directly, (b) renderable via re-derivation from `answers`, or (c) explicitly flagged as un-rerenderable with a clear admin signal — never a hard throw on `/report/[sessionId]`.

**Concrete error signature to harden against:** the CC-LLM-REWRITES-PERSISTED-ON-SESSION backfill script reported `Cannot read properties of undefined (reading 'bands')` for both skipped rows. This is the exact runtime shape mismatch the detector must catch — a stored `inner_constitution` (or downstream derived value the renderer expects) that lacks a `bands` field.

**Critical scope refinement (per CC-CALIBRATION-PHASE-1-DISTRIBUTION-AUDIT findings 2026-05-16):** the throw is NOT in `buildInnerConstitution` itself. PHASE-1's analytics script called `buildInnerConstitution(row.answers, [], null)` against all 13 live sessions including Daniel + Cindy and materialized them cleanly — zero stale-shape skips. The persistence CC's backfill must have called a different function (likely `renderMirrorAsMarkdown` or a post-engine derivation step in the report-render path) that hits the missing `bands` field. **Item 1 of this CC is therefore: identify the exact function the persistence CC's backfill called that produced the error, and harden THAT path.** The detector lives at the renderer / post-engine derivation boundary, not at the engine entry point.

Daniel and Cindy are both load-bearing calibration fixtures (Daniel is the only current cohort member with a high composed Grip; Cindy is the only Belonging Grip Pattern card in the cohort), so their un-renderability silently removes the two most-different data points from every downstream calibration audit.

**Parallel user action:** Jason is manually re-uploading Daniel + Cindy's answers via the online assessment at the50degreelife, which will produce fresh current-engine sessions for both (with new session IDs). Those new sessions will render fine. This CC is still needed for two reasons: (1) the *original* Daniel + Cindy sessions remain in the DB and should not throw the admin session viewer; (2) any future user whose stored bundle drifts from current engine schema needs graceful fallback rather than a hard throw.

This is Wave 1 / item 1 of the post-persistence punch list. Without it, two of the seven calibration fixtures throw on report-view via the persistence CC's render code path, and CC-CALIBRATION-PHASE-1-DISTRIBUTION-AUDIT (Wave 1 / item 3) will eventually need to read from the same render code path for prose-correlation work.

## Sequencing

Independent of CC-TYPO-TRIPLET-FIX (template-string fix, different files) and CC-CALIBRATION-PHASE-1-DISTRIBUTION-AUDIT (read-only analytics). All three can run in parallel; this CC is the renderability gate the audit CC depends on at consumption time.

Lands after CC-LLM-REWRITES-PERSISTED-ON-SESSION (already shipped) and before any further calibration CC fires.

## Launch Directive

Run with `claude --dangerously-skip-permissions`. Project-level `.claude/settings.local.json` has `defaultMode: "bypassPermissions"` so a fresh CC session opens without permission prompts.

## Execution Directive

Complete in a single pass. Do not pause for user confirmation. Apply canon-faithful interpretation on ambiguity and flag in the report-back section.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npx tsx tests/audit/staleShapeDetector.audit.ts` (this CC creates this audit)
- `npm run audit:llm-rewrites-persisted-on-session` (regression check against the persistence CC)
- `npm run dev` for one local smoke
- `psql` for reading session row shapes
- `grep`, `ls`, `cat`, `find` for inspection

Do not run `git commit`, `git push`, `npm install`, or any `build*` script. Do not run anything that touches `api.anthropic.com`.

## Read First (Required)

Read these before editing anything:

1. `prompts/completed/CC-LLM-REWRITES-PERSISTED-ON-SESSION.md` — defines what `llm_rewrites` and `llm_rewrites_engine_hash` mean on `sessions`. The stale-shape detector keys off the same engine-output bytes that the persistence CC hashes.
2. `db/schema.ts` — the `sessions` table shape, including `answers`, `inner_constitution`, `allocation_overlays`, `belief_under_tension`, and the two new persistence columns.
3. `lib/identityEngine.ts` — top-level engine entry points; identify the function(s) consumed by `app/report/[sessionId]/page.tsx` and by the assessment flow's render entry. The detector lives at this boundary, not inside the engine internals.
4. `app/report/[sessionId]/page.tsx` and any sibling render entry (admin session viewer + assessment-end render). Confirm where the stored bundle is read and where rerender-from-answers is currently possible.
5. `lib/types.ts` — the `InnerConstitution` / engine-output types. Confirm the union shape of fields that the detector must treat as required vs optional vs schema-version-dependent.
6. One existing audit for format: `tests/audit/llmRewritesPersistedOnSession.audit.ts`.

## Scope

### Item 1 — Shape-version constant + hash

In `lib/staleShape.ts` (new file):

```ts
// Bump this when any engine-output field consumed by the render path
// changes shape (added required field, removed field, renamed field,
// changed numeric range, changed enum union, etc.). Bumping this
// constant marks every previously-saved row as stale-shape on next
// read; the render path then triggers re-derivation from `answers`.
export const ENGINE_SHAPE_VERSION = 1;

export function hashEngineShape(constitution: InnerConstitution): string {
  // Deterministic over the keys + value-shape (not values) of every
  // field consumed by the render path. NOT a content hash — two
  // constitutions with the same schema produce the same hash even when
  // their numeric values differ. Used purely for stale-shape detection.
}
```

Export `ENGINE_SHAPE_VERSION`, `hashEngineShape`, and a `StaleShapeReason` union from the new module.

### Item 2 — `sessions` column for shape version

Add one column to `sessions` in `db/schema.ts`:

```ts
// CC-STALE-SHAPE-DETECTOR — schema version of the engine output that
// produced inner_constitution / allocation_overlays / belief_under_tension.
// Compared to ENGINE_SHAPE_VERSION at render time; mismatch triggers
// re-derivation from `answers`. NULL on pre-CC rows (treated as stale).
engine_shape_version: integer("engine_shape_version"),
```

Generate the migration with `npx drizzle-kit generate` → `db/migrations/0004_*.sql`. Apply locally with `npx drizzle-kit push`. Confirm in `psql` that the column landed as nullable.

Backfill is not required — NULL is the explicit "treat as stale, re-derive" sentinel. New rows written by the assessment flow stamp `engine_shape_version = ENGINE_SHAPE_VERSION` at save time.

### Item 3 — Render-path detector + fallback

**First sub-item — locate the actual throw site.** Open `scripts/backfillLlmRewritesOnSessions.ts` and identify the exact function call that produced `Cannot read properties of undefined (reading 'bands')` for the two skipped sessions during the persistence CC's run. The PHASE-1 audit confirmed `buildInnerConstitution` is NOT the throw site — the throw lives downstream. Likely candidates: `renderMirrorAsMarkdown`, `composeReportCards`, a post-engine derivation in `lib/renderMirror*.ts`, or a renderer entry point in `app/report/[sessionId]/page.tsx` that reads a field the older `inner_constitution` doesn't carry. Document the exact function + the field path that's undefined in the CC summary's first paragraph.

**Then — wrap that function's entry point** in a three-branch detector. The render entries are: `app/report/[sessionId]/page.tsx`, the admin session viewer, and the assessment-end render. Each calls into the throw-site function identified above.

1. **Fresh shape** (`row.engine_shape_version === ENGINE_SHAPE_VERSION` AND the stored bundle / re-derived bundle passes the `isFreshConstitution` predicate) → render directly. (Today's behavior.)
2. **Stale shape, re-derivable** (`engine_shape_version` is null OR mismatched, but `row.answers` is present and complete) → call `buildInnerConstitution(row.answers, [], demographics)` to re-derive a fresh `InnerConstitution`, then render from THAT re-derived constitution (which by construction has the current shape and the `bands` field). Emit a structured log line via `cacheObservability` tagged `[stale-shape:re-derived]` with `sessionId`, stored version, current version, and which fields differed (specifically: confirm `bands` is one of the listed differences, since that's the persistence CC's reported failure).
3. **Stale shape, not re-derivable** (mismatched AND `row.answers` is missing / incomplete) → render an explicit "this report needs to be retaken" admin-visible card in admin/clinician mode, and a graceful "we can't render this report; please re-take the assessment" message in user mode. Never throw.

Branch (2) must NOT touch the LLM render path — re-derivation is engine-only. The bundle re-derived in branch (2) does NOT get written back to the DB by this CC (that's a separate "rerender-and-persist" CC if/when wanted). Branch (2) is read-only-with-recompute.

### Item 4 — Type guards

In `lib/staleShape.ts`, export a `isFreshConstitution(value: unknown): value is InnerConstitution` predicate that the render path uses inside the "fresh shape" branch. The predicate runs the structural checks required to safely cast a JSON-parsed `inner_constitution` blob into the current `InnerConstitution` type. If the predicate returns false, the render path falls into branch (2) or (3) — never throws.

### Item 5 — Admin observability

Add a single admin-visible counter in the existing admin session viewer (`app/admin/sessions`): "Stale-shape sessions: N (re-derived: X, un-rerenderable: Y)." Implementation can be a count query against `sessions` joined with a session-render observability table OR a simple in-page tally of which rows the detector flagged during the current admin page-load. The point is a single visible number, not a dashboard.

### Item 6 — Audit: `tests/audit/staleShapeDetector.audit.ts`

Hand-rolled audit (mirror `proseRegister.audit.ts` format). Verifies:

1. `lib/staleShape.ts` exports `ENGINE_SHAPE_VERSION`, `hashEngineShape`, `isFreshConstitution`, `StaleShapeReason`.
2. `db/schema.ts` exports `sessions.engine_shape_version`.
3. `db/migrations/0004_*.sql` exists and contains the `ADD COLUMN` statement.
4. Three synthetic stale-shape fixtures (constructed inline in the audit, not committed as new fixture files): one fresh, one re-derivable, one un-rerenderable. Each renders through the detector and produces the expected branch outcome.
5. `app/report/[sessionId]/page.tsx` does not call the engine entry point unconditionally — there is a detector check before the call.
6. The detector contains no import from any `lib/*LlmServer.ts` file (grep, fail if matched). Re-derivation is engine-only.

### Item 7 — Regression: persistence CC audit stays green

Run `npm run audit:llm-rewrites-persisted-on-session` after Items 1–6 land. The persistence CC's audit must still pass — the stale-shape detector is additive; it does not modify the `llm_rewrites` columns, the bundle shape, or the cache-or-engine render contract.

### Item 8 — Smoke

**Reproduce the original failure first.** Run `npm run backfill:llm-rewrites` against the local DB. The persistence CC's summary reported 2 of 13 sessions skipped with `Cannot read properties of undefined (reading 'bands')`. Confirm this still happens against the pre-CC code state on the two original Daniel/Cindy session IDs (`35d61070-fff7-497e-a518-04cb57d79059` and `5063c920-dc37-44a3-8931-8fd4fc8069fc`). If the backfill script no longer reproduces the error against those IDs (because the rows have been deleted or replaced via Jason's manual re-upload at the50degreelife — see Objective), use whatever live session in the DB currently fails the same throw, OR construct a synthetic stale-shape session inline in the smoke step and assert the throw against the post-CC code path.

**Then verify the post-CC behavior:**

- The original throw site no longer throws against stale-shape input. (Verify the throw is gone, not just suppressed.)
- A `[stale-shape:re-derived]` line is logged via `cacheObservability` with `sessionId`, stored shape version (or NULL), current `ENGINE_SHAPE_VERSION`, and the list of fields that differed (specifically: confirm `bands` is one of the listed differences).
- The stale-shape render produces engine-fallback body content (LLM rewrites are absent for stale shapes because no bundle was backfilled into `llm_rewrites`).
- No request to `api.anthropic.com` is issued from any render (Network panel).
- The rendered output for the stale-shape session is a complete, readable Inner Constitution markdown — not a partial render or a graceful-error message. Branch (2) re-derives the full constitution.

**Note on Jason's parallel re-upload:** Jason is manually re-uploading Daniel + Cindy's answers via the online assessment at the50degreelife as a separate calibration step. Those re-uploads will produce NEW session IDs with current engine output (and won't be stale). The original session IDs above may or may not still exist in the DB depending on whether Jason deletes them. Either case is fine — this CC's smoke step needs ONE stale-shape session to exercise the detector, from any source.

## Do NOT

- **Do NOT re-derive on save without an explicit, separate CC.** Branch (2) re-derives at render time only. Writing the re-derived bundle back to the DB is a different concern (potential cache poisoning if re-derivation differs from canonical engine output across deploys). That's its own CC if/when wanted.
- **Do NOT call the LLM render path from inside the detector or from branch (2).** Re-derivation is engine-only. Branch (2)'s rendered body is engine-templated, not LLM-rewritten. The whole point of the post-persistence cache-or-engine contract is that the render path is structurally incapable of spending money; this CC must not introduce a loophole.
- **Do NOT modify any `lib/cache/*.json` file.** The detector reads the stored bundle and falls back to engine output; it does not write or freshen cache.
- **Do NOT backfill `engine_shape_version = ENGINE_SHAPE_VERSION` onto existing NULL rows.** NULL is the explicit stale-marker; backfilling defeats the entire detector. New rows written by the assessment flow stamp the column; existing rows stay NULL until they are re-saved.
- **Do NOT add a "fall back to LLM if engine fallback looks short" path.** Engine output for re-derived rows is the floor. Body cards that depend on LLM rewrite simply render their engine template (which is the same fallback contract as for any session with a missing rewrite key).
- **Do NOT bump any cache hash** (`proseRewriteHash`, `keystoneRewriteHash`, `synthesis3 key`, `grip key`, `launchPolish v3 hash`). The detector is independent of the rewrite-key namespace.
- **Do NOT touch the engine internals to "fix" the schema drift.** If the engine schema must change to make re-derivation match the stored bundle better, that is its own CC. This CC adds a detector around the schema reality as it stands today.
- **Do NOT add an admin button or API endpoint that triggers re-derivation across all rows.** The detector runs lazily on read. Bulk re-derivation is out of scope.
- **Do NOT introduce new dependencies.** Drizzle, postgres, and the existing project deps cover all of this.
- **Do NOT commit or push.** Leave the work for review.

## Allowed to Modify

- `db/schema.ts` (add one column)
- `db/migrations/0004_*.sql` (generated by drizzle-kit)
- `lib/staleShape.ts` (new file)
- `lib/types.ts` (only if necessary to export `InnerConstitution` shape for the predicate; do not change field definitions)
- `app/report/[sessionId]/page.tsx` (render-path branch)
- `app/admin/sessions/*` (admin observability counter; one file)
- The assessment-end render entry (one file; identify during Read First)
- `tests/audit/staleShapeDetector.audit.ts` (new file)
- `package.json` (add `"audit:stale-shape-detector"` script; nothing else)

Anything not listed is forbidden.

## Out of Scope

- Re-derive-and-persist (separate CC).
- Re-running the LLM render path against re-derived bundles (forbidden — see Do NOT).
- Backfilling `engine_shape_version` onto existing rows.
- Schema changes to engine output (separate CC if needed).
- Admin bulk-rerender UI (out of scope).
- Public API exposing detector status (out of scope).
- New fixtures or fixture changes — synthetic fixtures live inline in the audit only.

## Acceptance Criteria

1. `npx tsc --noEmit` passes.
2. `npm run lint` passes.
3. `npx tsx tests/audit/staleShapeDetector.audit.ts` passes all 6 assertions.
4. `npm run audit:llm-rewrites-persisted-on-session` still passes (regression).
5. Daniel and Cindy report pages render without throwing in local smoke.
6. Both render via branch (2) (re-derivation) — confirmed by `[stale-shape:re-derived]` log line.
7. No `api.anthropic.com` request issued from either render (Network tab).
8. No file outside the Allowed-to-Modify list has been edited (`git status` confirms).
9. No `lib/cache/*.json` file modified.
10. No cache hash bumped (`grep -rn "VERSION\s*=\s*\d\+" lib/*.ts` shows no changes to render-cache version constants).

## Report Back

Include in the CC summary:

- Files changed (full paths).
- Migration filename + brief contents.
- Counts: total rows in `sessions`, NULL `engine_shape_version` rows, rows rendered via branch (1) / (2) / (3) during the smoke.
- The `[stale-shape:re-derived]` log lines from Daniel and Cindy.
- Any field-level shape differences the detector surfaced (which keys in `inner_constitution` differed between stored and re-derived bundles).
- Any ambiguity encountered + canon-faithful resolution applied.
- Confirmation that no API key was present in scope during execution.

## Notes for executor

- Estimated executor time: 45–75 minutes (per `feedback_cc_time_estimates_5x_too_high.md` recalibration). If you find yourself over 90 minutes, stop and report.
- Cost: $0. No API spend. No LLM rewrites generated.
- The detector is the renderability gate the calibration audit depends on at consumption time — without it, Daniel and Cindy are silent omissions from Wave 1's distribution histograms.
