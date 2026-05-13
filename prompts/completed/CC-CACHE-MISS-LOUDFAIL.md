# CC-CACHE-MISS-LOUDFAIL

## Objective
Add render-time observability for cache misses on the LLM-rewrite caches (prose-rewrites.json for body cards, keystone-rewrites.json for Keystone). When readCachedRewrite (or its Keystone equivalent) returns undefined at render time, emit a structured log entry that names the missed key, the card or section, and the engine body fingerprint that didn't match any cached fixture. Goal: confirm the live-session cache-miss diagnosis empirically (per the Jason live render review 2026-05-12) and provide ongoing observability so future divergences between live sessions and primed fixtures surface immediately rather than silently falling back to engine prose.

## Sequencing
Independent of CC-KEYSTONE-USER-MODE-UNCONDITIONAL, CC-LIVE-SESSION-LLM-WIRING, and any V2 prose work. Recommended first because it gives definitive evidence for the diagnosis and unblocks the two larger fixes by naming exactly which cards/keystone miss for which sessions.

## Scope
- The cache lookup function in lib/proseRewriteLlm.ts (readCachedRewrite or equivalent).
- The cache lookup function in lib/keystoneRewriteLlm.ts (readCachedKeystone or equivalent).
- A small shared helper at lib/cacheObservability.ts (or inline in each file — author's call) that formats the miss log entry.
- Audit test that verifies (a) cohort fixtures produce zero miss logs and (b) a synthetic non-fixture input produces the expected miss log entry.

## Do not
- Change the return value of any cache-lookup function. Misses must still return undefined; the splice must still fall through to engine prose. This CC adds a log, nothing else.
- Trigger on-demand LLM rewrites on miss. That's CC-LIVE-SESSION-LLM-WIRING.
- Modify the cache key composition. The cache key stays exactly as PROSE-V1 / KEYSTONE-RENDER defined it.
- Bump cache hashes (synthesis3 / gripTaxonomy / proseRewriteLlm / keystoneRewriteLlm — none).
- Emit logs at module load or import time. Logs fire only at render-time on actual cache misses.
- Block the render or throw on miss. Logs are observability only.
- Add new dependencies. Use the existing logging primitives (console.warn or whatever the repo already uses).
- Touch lib/renderMirror.ts beyond minimal call-site threading if absolutely necessary.
- Touch the React surface.
- Modify the audit metadata, the engine prose fallback content, or any rendered section's content.

## Rules

### 1. One miss log per cache lookup that returns undefined
Every call to readCachedRewrite / readCachedKeystone that returns undefined emits exactly one log entry. No deduplication, no rate limiting at this layer — each miss is informative.

### 2. Structured payload
The log entry includes:
- The cache namespace (e.g. "prose-rewrites" / "keystone-rewrites").
- The card or section identifier (e.g. "lens" / "compass" / "hands" / "path" / "keystone").
- The cache key that was looked up (the hash or composite identifier).
- A short fingerprint of the engine body that produced the missed key — enough to disambiguate one fixture from another (e.g. first 80 chars of the engine body, or the value list, or whatever's most diagnostic).
- A session/fixture identifier if available (fixture name for cohort runs; session id for live).

Format can be JSON-on-a-line or a human-readable structured string — choose what's easiest for grep and log aggregation.

### 3. Log channel
Use console.warn (or the repo's existing structured-log primitive). Logs should appear in:
- Dev/local terminal output where the app is running.
- Any aggregated log sink the production pipeline already collects.

Do not introduce a new log sink, new transport, or new external dependency.

### 4. Cohort runs are quiet
When the cohort regen or any audit that runs against cohort fixtures executes, zero miss logs should appear. The cache is hot for the cohort by design. Any miss log during cohort run is itself a regression signal.

### 5. Synthetic-miss verification
The audit must include at least one synthetic test input — engine body content that's NOT in the cache — and assert that the miss log fires for that input with the expected payload structure.

## Implementation notes
- The simplest implementation: wrap the existing readCachedRewrite return in a check; if undefined, console.warn with the payload before returning undefined.
- For Keystone, same pattern on readCachedKeystone.
- If a shared lib/cacheObservability.ts helper makes sense (small format function), add it. If the wrapping is tiny enough to inline, inline it.
- The log payload must be informative enough that on receiving one, you can immediately identify: which cache, which card, which session, why it missed (by comparing the fingerprint against known cohort fixtures).

## Audit gates
- Cohort cache regen / any cohort fixture audit produces zero miss-log entries across all 24 fixtures × 4 prose-rewrite cards + 21 Keystone fixtures. Captured by intercepting console.warn during the audit run.
- Synthetic non-fixture input (engine body bytes that don't match any cached fixture) produces exactly one miss log per missed cache lookup, with a payload that includes namespace, card identifier, cache key, and engine body fingerprint.
- Miss logs include enough information to manually correlate to a specific section/fixture — verified by reading the log payload for the synthetic test.
- readCachedRewrite / readCachedKeystone return values are unchanged from pre-CC behavior (undefined on miss, cache value on hit). Verified by existing audits passing.
- Lens / Hands / Compass / Path / Keystone splice behavior is unchanged. Cohort renders byte-identical for all sections.
- 40-fixture sweep stays green.
- tsc + lint clean.
- Cost: $0 (no LLM regen; pure observability).

## Deliverables
- Files changed list.
- Sample miss-log payload (verbatim, for the synthetic test input).
- Cohort-run miss-log count: 0/0.
- Synthetic-run miss-log count: ≥1 with correct payload.
- 40-fixture sweep status.
- Confirmation that readCachedRewrite / readCachedKeystone return values are unchanged.

## How to use after landing
1. Re-render Jason's user-mode report.
2. Inspect the log output for the render. Expected outcome based on the live-render diagnosis: miss logs appear for Compass, Path, and Keystone; no miss logs for Lens or Hands.
3. If that outcome matches, the cache-miss-on-live-session diagnosis is confirmed empirically. Proceed to CC-KEYSTONE-USER-MODE-UNCONDITIONAL and CC-LIVE-SESSION-LLM-WIRING.
4. If the outcome doesn't match (e.g. zero miss logs for any card despite live render still showing engine prose), the diagnosis is wrong and a different code path is producing the engine prose Jason sees. The log absence is its own data point.
