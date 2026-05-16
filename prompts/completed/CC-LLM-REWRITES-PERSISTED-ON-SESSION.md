# CC-LLM-REWRITES-PERSISTED-ON-SESSION

## Objective

Persist the 353 already-warmed LLM rewrites that live in `lib/cache/*.json` (≈$56 of one-time investment, dated May 11–13) into the `sessions` row in Postgres, and rewire the render path so it serves rewrites from the DB row instead of calling Anthropic at request time. After this CC lands, the render path is structurally incapable of spending money — every report view is either DB-served or engine-fallback. The Anthropic API is only ever called from explicit `build*` scripts the user opts into.

This is the foundational gate established by the 2026-05-13/14 spend incident and the six-guard checklist in `feedback_public_deploy_cost_guards.md` / `project_50degreelife_runtime_llm_incident.md`. **No new API key will be issued until this CC ships.** Therefore the executor MUST complete this CC without an `ANTHROPIC_API_KEY` in scope — backfill works only from existing committed cache files; tests run with the key absent.

## Sequencing

Independent of all queued editorial / synthesis / Grip-bucket / SVG work. This is priority #1 on the 2026-05-15 punch list. Lands before any new API key is reissued, before any new public deploy, and before any further LLM-prose CC fires.

## Bash Authorized

Yes. Use the shell for `tsc`, `eslint`, audit runs, `drizzle-kit generate` + `drizzle-kit push`, local `psql` inspection, and one local `npm run` smoke. Do not commit or push.

## Execution Directive

### Item 1 — Schema migration: two columns on `sessions`

In `db/schema.ts`, add two columns to the existing `sessions` table:

```ts
// CC-LLM-REWRITES-PERSISTED-ON-SESSION — render-path cache.
// `llm_rewrites` holds the full per-session rewrite bundle, keyed by
// layer (prose / keystone / synthesis3 / grip / launch_polish_v3).
// `llm_rewrites_engine_hash` is a deterministic hash of the engine
// inputs used to produce the rewrites; the render path uses it to
// detect when a stored bundle is stale relative to current engine
// output. NULL on rows that have not yet been backfilled or that
// were saved before this column existed.
llm_rewrites: jsonb("llm_rewrites"),
llm_rewrites_engine_hash: text("llm_rewrites_engine_hash"),
```

Generate the migration with `npx drizzle-kit generate` → it will produce `db/migrations/0003_*.sql`. Apply locally with `npx drizzle-kit push`. Inspect with `psql` that both columns landed as nullable.

`llm_rewrites` shape, codified as a TS type exported from `lib/llmRewritesBundle.ts` (new file):

```ts
export interface LlmRewritesBundle {
  prose: Record<string, { rewrite: string }>;            // keyed by proseRewriteHash
  keystone: Record<string, { rewrite: string }>;         // keyed by keystoneRewriteHash
  synthesis3: Record<string, { paragraph: string }>;     // keyed by synthesis3 key
  grip: Record<string, { paragraph: string }>;           // keyed by grip cache key
  launchPolishV3: Record<string, { rewrite: string }>;   // keyed by launchPolish v3 hash
  generatedAt: string;
  bundleVersion: 1;
}
```

The bundle is a per-session snapshot — NOT a copy of the entire `lib/cache/*.json` file. Each session row carries only the keys it actually needs to render.

### Item 2 — Engine-hash helper

Add `hashEngineForLlmBundle(innerConstitution, answers, demographics) → string` in `lib/llmRewritesBundle.ts`. It must:

- Sort all inputs canonically.
- Include exactly the fields that any of the five rewrite layers consume as input.
- Be byte-stable across re-runs.

This hash is what gets written to `llm_rewrites_engine_hash` and what the render path compares to before serving the bundle.

### Item 3 — Render path: cache-or-engine, never cache-or-API

Touch the five render-path modules:

- `lib/proseRewriteLlmServer.ts` (function `resolveProseRewriteLive`)
- `lib/keystoneRewriteLlmServer.ts`
- `lib/synthesis3LlmServer.ts`
- `lib/gripTaxonomyLlmServer.ts`
- `lib/launchPolishV3LlmServer.ts`

Replace the existing live-LLM-on-cache-miss fall-through with this control flow:

1. **Committed-cache check** (existing `readCached*` calls) — return if hit. (Unchanged. Keeps cohort + fixture audits green.)
2. **Session-bundle check** — if a sessionLlmBundle was passed into the call site, look up the same hash key in `sessionLlmBundle.<layer>`. Return if hit.
3. **Runtime gate** — if `process.env.LLM_REWRITE_RUNTIME !== "on"`, return `null` (engine fallback). Always log a structured `[cache-miss]` line via `cacheObservability` so the miss is visible.
4. **Runtime LLM call** — ONLY reachable when `LLM_REWRITE_RUNTIME=on` AND an `ANTHROPIC_API_KEY` is present AND the budget is non-exhausted. This branch must be byte-identical to today's runtime behavior so build scripts continue to work.

Thread a `sessionLlmBundle: LlmRewritesBundle | null` parameter from the report page (`app/report/[sessionId]/page.tsx`, the assessment flow's render entry, and the admin session viewer) down through `resolveScopedRewritesLive` and the per-layer resolvers. Default null is acceptable; null routes straight to engine fallback when the committed cache also misses.

### Item 4 — Backfill script: cache files → DB rows (NO API CALLS)

Create `scripts/backfillLlmRewritesOnSessions.ts`. Behavior:

1. Read all five committed `lib/cache/*.json` files into memory.
2. Query every row in `sessions` (id, answers, inner_constitution, allocation_overlays, belief_under_tension).
3. For each session: re-derive the five layers' cache keys deterministically from the engine output (use the same key-builders the render path uses — `proseRewriteHash`, `keystoneRewriteHash`, etc.). For each layer, look up every key the session would need in the corresponding cache file. Build the per-session `LlmRewritesBundle` containing only matched entries.
4. Compute `llm_rewrites_engine_hash` via `hashEngineForLlmBundle`.
5. UPDATE the session row: `llm_rewrites = bundle`, `llm_rewrites_engine_hash = hash`. Idempotent — re-running over an already-backfilled row produces a no-op when hash matches.
6. Emit a per-session report: which layers populated, how many keys per layer, how many keys were not found in the cache. Total counts at the end.

**Hard rule on this script:** It MUST import nothing from `lib/*LlmServer.ts` and MUST NOT instantiate the Anthropic SDK. It is a pure cache-file-to-DB transcoder. Verify at the top of the file with a comment AND a runtime guard: if `process.env.ANTHROPIC_API_KEY` is set, log a warning and continue (do not error — the key being present should not break the script, but the script must not use it). The audit (Item 6) will grep this script for SDK imports and fail if any appear.

Add an npm script: `"backfill:llm-rewrites": "tsx scripts/backfillLlmRewritesOnSessions.ts"`.

### Item 5 — Default `LLM_REWRITE_RUNTIME=off` everywhere

- `.env.example`: add `LLM_REWRITE_RUNTIME=off` with a comment block explaining that flipping to `on` permits render-time API calls and should only happen inside `build*` script invocations.
- `.env.local`: if present in the repo's tracked example, mirror `=off`. (Real local `.env.local` is gitignored — note in the CC summary that the user must set this manually.)
- `vercel.json` (or the README's Vercel section): document that `LLM_REWRITE_RUNTIME` MUST be `off` (or absent) in the Vercel project's env vars, and that the Anthropic key MUST be absent. Add a one-line readme update under "Deployment".

In every `lib/*LlmServer.ts` runtime branch, add an early guard:

```ts
if (process.env.LLM_REWRITE_RUNTIME !== "on") {
  // Render-time path may not call the API. Engine fallback.
  return null;
}
```

`scripts/build*.ts` must set `process.env.LLM_REWRITE_RUNTIME = "on"` programmatically at the top, before importing any LlmServer module. That way build scripts opt in explicitly; nothing else can.

### Item 6 — Audit: `tests/audit/llmRewritesPersistedOnSession.audit.ts`

Audit must verify:

1. `db/schema.ts` exports `sessions.llm_rewrites` (jsonb) and `sessions.llm_rewrites_engine_hash` (text).
2. `db/migrations/0003_*.sql` exists and contains both `ADD COLUMN` statements.
3. `lib/llmRewritesBundle.ts` exists and exports `LlmRewritesBundle`, `hashEngineForLlmBundle`.
4. All five `lib/*LlmServer.ts` files contain the `LLM_REWRITE_RUNTIME !== "on"` guard before any `composeXxx` call.
5. `scripts/backfillLlmRewritesOnSessions.ts` exists, contains NO import of `@anthropic-ai/sdk`, and contains NO import from any `lib/*LlmServer.ts` file (grep both, fail if matched).
6. Sample 3 session rows (mock fixtures wired in the audit) round-trip through `resolveProseRewriteLive` with a populated `sessionLlmBundle` argument and return the bundle's rewrite without touching network. Stub `composeProseRewrite` to throw — if the throw is reached, the test fails.

### Item 7 — Render-path wire-through verification

After Items 1–6 land, run the existing 38+ audits. Cohort audits must remain at 100% (they hit committed-cache, not session-bundle). Then prove the new path is live by running one fresh assessment locally, hitting `/report/[sessionId]`, and confirming via Network panel that NO request to `api.anthropic.com` is issued. Include the local smoke result in the CC summary.

## Do NOT

- **Do NOT regenerate any LLM content.** The cache files are the source of truth for this CC. Do not call the API for any reason. Do not "freshen" stale entries. Do not delete or modify any `lib/cache/*.json` file.
- **Do NOT touch the engine.** Engine output is the deterministic hash input — changing it invalidates the entire backfill. No edits to engine modules, prose templates, or canon line inventories.
- **Do NOT add a "fall back to API if DB column is null" path.** A null bundle means engine prose. That is the correct behavior for un-backfilled rows. The render path is structurally cache-or-engine; the absence of an API path is the whole point.
- **Do NOT introduce a new in-memory or process-scoped cache that survives serverless cold starts.** The runtime cache in `lib/proseRewriteLlm.ts` (`RUNTIME_CACHE`) is the existing pattern for the runtime branch; do not generalize it or wire it into the render path.
- **Do NOT recreate `ANTHROPIC_API_KEY` in `.env.local` or Vercel.** The key reset is a downstream user step, gated on this CC + the rest of the six-guard checklist. Executor must complete the work with no key present.
- **Do NOT modify any of the five `build*` scripts beyond setting `LLM_REWRITE_RUNTIME = "on"` at the top.** Their behavior is otherwise correct; they're the only callers that should ever hit the API.
- **Do NOT change cohort cache keys, hash algorithms, or cache file formats.** Backfill must read the committed files as-is. If a key shape needs to change later, it's a separate CC.
- **Do NOT add a public surface (admin route, API endpoint, UI affordance) that triggers backfill.** The script is a developer-run one-off. If you find yourself building a button, stop — that's out of scope.
- **Do NOT skip the Vercel-env documentation step.** The render-path guards are insufficient without `LLM_REWRITE_RUNTIME=off` set (or absent) in the deployed env, and without the key removed there.
- **Do NOT commit or push.** Leave the work for the user to review.

## Verification Checklist (executor reports back)

1. Migration `db/migrations/0003_*.sql` exists; `drizzle-kit push` applied locally without error.
2. New columns visible in `psql` against the local DB.
3. All five `*LlmServer.ts` modules contain the runtime guard; grep-confirmed.
4. Backfill script grep clean: zero `@anthropic-ai/sdk` references, zero `*LlmServer` references.
5. `npm run backfill:llm-rewrites` runs locally, reports per-session populated-key counts, exits zero.
6. New audit `llmRewritesPersistedOnSession.audit.ts` passes; existing 38+ audits stay green.
7. Local smoke: one report-view network capture confirms zero `api.anthropic.com` requests, with engine fallback rendering cleanly where bundle is null/empty.
8. Summary lists: total sessions in DB, sessions successfully backfilled, total bundle-key counts per layer (prose / keystone / synthesis3 / grip / launchPolishV3), any per-session match-rate outliers.

## Notes for executor

- Estimated executor time: 60–90 minutes (per `feedback_cc_time_estimates_5x_too_high.md` recalibration). If you find yourself over two hours, stop and report the blocker rather than continuing.
- 353 total cached entries currently: grip 64 / keystone 16 / launch-polish-v3 118 / prose 54 / synthesis3 101. Match-rate from cache files to existing session bundles will be partial — sessions saved before a given cache file existed will simply have empty per-layer maps. That is correct behavior, not a bug.
- The `RUNTIME_CACHE` Map in `lib/proseRewriteLlm.ts` is fine to leave in place — it's reachable only when `LLM_REWRITE_RUNTIME=on` after Item 5 ships, which means it's effectively dormant on production. Do not delete it; build scripts use it.
- Cost: $0. This CC executes entirely against committed cache files + local Postgres. No API spend, no LLM rewrites generated.
