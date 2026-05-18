# CODEX-LLM-LIVE-SESSION-COVERAGE

> Cowork-chat informal CODEX, 2026-05-18.
> Per `feedback_codex_llm_editorial_review.md`: this is a CODEX-LLM-*
> run. Editorial review of newly-generated entries IS in scope.
>
> Per `feedback_cache_regen_ordering.md`: synthesis3 must run before
> proseRewrites. Order matters.
>
> **Amendment 2026-05-18 (post first-fire blocker):**
> - `DATABASE_URL` will be exported in the executor's shell before
>   re-firing (Prisma Postgres prod connection). Use
>   `process.env.DATABASE_URL` to read it. Do NOT echo it back in
>   the report or commit it anywhere.
> - The executor IS authorized to add `--session-id=<UUID>` flag
>   support to `scripts/backfillLlmRewritesOnSessions.ts` as part
>   of Step 6. Minimal change: parse argv, filter the session query
>   when flag is present, leave unfiltered behavior intact when
>   absent. Commit-eligible.

## Why this CODEX exists

The committed LLM rewrite cache (`lib/cache/prose-rewrites.json`) is
keyed by `(archetype, cardId, engineSectionBody)`. Live prod sessions
compute their own engine body which differs from static fixtures
(demographics shape, V/O wiring effects, session metadata embedded in
section bodies). Result: live sessions miss the cache for most
sections and fall through to deterministic engine prose.

For Jason's live prod session specifically, the report rendered
2026-05-17 23:34 shows deterministic prose for Lens / Compass /
Keystone / Conviction-Voice / etc., even though there are 12 Lens
entries / 10 Compass entries cached for `jasonType`. None match the
live engine body's hash.

This CODEX: re-extract Jason's live prod session as a fixture,
regen the LLM caches against its actual engine body, backfill the
resulting rewrites onto his saved session.

## Scope

**Target: ONE session** — Jason's most recent live prod session. Do
not run this CODEX for other sessions; the cohort-wide live-cache
coverage problem is a separate architectural CC (queued as
`CC-PROD-LLM-CACHE-COVERAGE-ARCHITECTURE`).

## Acceptance: when this CODEX is done

1. Jason's saved prod session has `llm_rewrites` populated with
   entries for at least: `lens`, `compass`, `hands`, `path`.
2. Re-rendering his report from the persisted session reads with
   LLM-warm prose for those sections (not the deterministic
   template language).
3. Cost ≤ $0.50 (single session × 4-5 sections of new generation).
4. No other sessions modified.
5. No engine code modified.
6. No commits made (Cowork-chat handles commit + push after
   verification).

## Step sequence

### Step 1 — Identify Jason's live prod session UUID

From the cohort UUID list saved earlier in this project:
- Jason cohort-real session: `3d3ddc5a-8b32-49c1-a90b-4e2d761a1913`

Confirm this is his MOST RECENT session by querying prod Postgres:

```sql
SELECT id, created_at, name_value
FROM sessions s
LEFT JOIN demographics d ON d.session_id = s.id
WHERE d.name_value ILIKE '%jason%'
   OR s.id = '3d3ddc5a-8b32-49c1-a90b-4e2d761a1913'
ORDER BY s.created_at DESC
LIMIT 5;
```

Report the UUID being used.

### Step 2 — Re-extract Jason's session answers + demographics

Use the existing `scripts/extractCohortRealFixtures.ts` pattern but
target ONE session. Either:

- Adapt `extractCohortRealFixtures.ts` to take a single UUID
  argument (cleanest), OR
- Manually inline the SQL query and write the fixture file.

Write the fixture to: `tests/fixtures/cohort-real/jason-live.json`.

The fixture shape must match what `buildProseRewrites.ts` expects.
Check existing `cohort-real/*.json` files — same shape required.
Most importantly:
- `answers`: array of Answer objects (matches existing schema)
- `demographics`: the live-session demographics shape (variable
  across migrations; preserve whatever's in DB)

### Step 3 — Add the new fixture to buildProseRewrites iteration

If `buildProseRewrites.ts` iterates `tests/fixtures/ocean/*.json` and
`tests/fixtures/goal-soul-give/*.json`, EITHER:

- Temporarily add `tests/fixtures/cohort-real/jason-live.json` to its
  fixture-glob list, OR
- Verify it already iterates `cohort-real/*.json` (it may; check the
  script header).

Whichever path: confirm via dry-run (no API calls) that the new
fixture appears in the script's iteration log.

### Step 4 — Run cache regen in canonical order

Per `feedback_cache_regen_ordering.md`, run scripts in dependency
order:

```bash
npx tsx scripts/buildSynthesis3.ts
npx tsx scripts/buildProseRewrites.ts
npx tsx scripts/buildKeystoneRewrites.ts
npx tsx scripts/buildGripTaxonomy.ts
npx tsx scripts/buildLaunchPolishV3.ts
```

Each script generates entries for the new fixture if its engine body
hash isn't in the cache. Expect ~4-5 new entries total (one per
section: lens, compass, hands, path, possibly keystone). Cost ~$0.50.

### Step 5 — Editorial review of newly-generated entries

REQUIRED per `feedback_codex_llm_editorial_review.md`. Read each
newly-generated entry for Jason and report:

- Hedge count per section (target: ≤3)
- Architect-coded vocabulary present (expected for Jason, this is
  HIS shape — "weaponized correctness", "precision", "structure",
  "long-arc" are fine here)
- Voice consistency with prior Jason-archetype renderings
- Any obvious shape-leak (caregiver-coded or steward-coded language
  bleeding into Jason's read — should NOT appear)

Report the new entries' first 2-3 sentences each in the response.

### Step 6 — Backfill onto Jason's saved session

Run the backfill script against prod:

```bash
DATABASE_URL='postgres://...prod...' \
  npx tsx scripts/backfillLlmRewritesOnSessions.ts \
  --session-id=<Jason's UUID from Step 1>
```

If the script doesn't support `--session-id`, run unfiltered but
report which sessions were touched. Worst case: target all sessions
and accept that other cohort sessions might also pick up new bundles
(which would actually be a net positive, not a regression).

The backfill writes per-section LLM rewrites from the committed
cache into `sessions.llm_rewrites` column for the matched session(s).

### Step 7 — Verify Jason's prod render

Pull Jason's prod render URL. Confirm:
- Lens section reads warm (NOT "A pattern-discernment gift shows up
  here...")
- Compass section reads warm
- Hands section reads warm (was already warm before; should stay)
- Path section reads warm
- Other sections that have backfilled rewrites read warm

Report the first 2-3 sentences of each rendered section that
changed.

## Files allowed to modify

- `scripts/extractCohortRealFixtures.ts` (if adapting for single-UUID
  flow)
- `scripts/buildProseRewrites.ts` (only to add the new fixture to its
  iteration glob, if needed; revert this addition before committing)
- `scripts/backfillLlmRewritesOnSessions.ts` — add `--session-id=<UUID>`
  flag support. Minimal change, commit-eligible.
- `lib/cache/prose-rewrites.json`, `lib/cache/synthesis3-paragraphs.json`,
  `lib/cache/keystone-rewrites.json`, `lib/cache/grip-paragraphs.json`,
  `lib/cache/launch-polish-v3-rewrites.json` (regen output)
- `tests/fixtures/cohort-real/jason-live.json` (new fixture; commit
  question: yes — distinct from cohort-real/jason-real.json which is
  the cohort-period snapshot)
- prod DB `sessions.llm_rewrites` column for Jason's UUID only

## Do NOT

- Modify engine code (`lib/identityEngine.ts`, `lib/aim.ts`, etc).
- Modify the cache-key hash function in `lib/proseRewriteLlm.ts`.
- Run the backfill against the full prod sessions table without a
  single-session filter (if `--session-id` isn't supported, report
  back and we'll add the filter before running).
- Modify other LLM cache entries (only ADD new entries for Jason's
  live fixture).
- Make commits or push (Cowork-chat handles after verification).
- Skip the editorial-review step.

## Expected runtime

~30-45 min total:
- Step 1 (UUID confirm): ~5 min
- Step 2 (extraction): ~5 min
- Step 3 (fixture inclusion): ~5 min
- Step 4 (cache regen): ~10 min + ~$0.50 LLM
- Step 5 (editorial review): ~5 min
- Step 6 (backfill): ~5 min
- Step 7 (prod verify): ~5 min

## Cost budget

~$0.50 (single session × 4-5 LLM sections).
If cost exceeds $2, stop and flag — something's iterating wider than
intended.

## Report back

- Jason's live session UUID confirmed.
- Fixture written: `tests/fixtures/cohort-real/jason-live.json`
  (size, answer count).
- buildProseRewrites summary: generated count, cost.
- Editorial review notes (per section): hedge count, register
  consistency, shape-leak check.
- Backfill confirmation: which session(s) had `llm_rewrites`
  written.
- Prod render verification: first 2-3 sentences of changed sections.
- Total LLM cost observed.

## Out of scope (queued separately)

- Cohort-wide live-session LLM coverage (this CODEX does ONE session).
- Architectural fix to make the cache live-session-aware
  (`CC-PROD-LLM-CACHE-COVERAGE-ARCHITECTURE`).
- Backfill for users beyond Jason. Once architecture is correct, all
  sessions should auto-cover.
