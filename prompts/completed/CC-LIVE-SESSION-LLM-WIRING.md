# CC-LIVE-SESSION-LLM-WIRING

## Objective
When the prose-rewrite or keystone-rewrite cache misses at render time, trigger an on-demand LLM rewrite for the specific section, cache the result under the same engine-body key, and serve it. This converts the current silent-fallback-to-engine-prose behavior (the actual root cause of live-session reports showing engine-y Compass / Path / Keystone) into a system where every live render produces the LLM voice.

## Sequencing
Foundational for the next prose batch. Land before CC-KEYSTONE-USER-MODE-UNCONDITIONAL, CC-PROSE-V2 expansions, or any further user-surface CC. Without this, every new user's report falls through to engine prose for any section whose engine body doesn't byte-match a cohort fixture — which is most of them.

## Scope
- lib/proseRewriteLlm.ts: when readCachedRewrite returns null in a live render, call the LLM via the existing proseRewriteLlmServer wrapper with the same prompt + system + cache key, cache the result, return it.
- lib/keystoneRewriteLlm.ts: same pattern for keystone-rewrites.
- Per-session cost guard: cap the number of on-demand LLM calls per session at a configurable maximum (default 8, generous enough for 4 body cards + Keystone + a few retries).
- Timeout: 10 seconds per LLM call; on timeout, fall through to engine prose (current behavior) and log the timeout.
- Reuse CacheObservability primitives: log every on-demand resolution alongside the cache miss it resolved.

## Do not
- Modify the cache key composition. The hash inputs stay exactly as PROSE-V1 / KEYSTONE-RENDER defined them.
- Modify the LLM prompts, system messages, or temperature (temp 0 stays).
- Touch the React surface. This is the markdown/render pipeline.
- Trigger on-demand calls during cohort regen, audit runs, or fixture-based testing. The cohort cache stays the source of truth for fixtures; on-demand only fires for non-fixture inputs.
- Block render indefinitely. Hard 10s timeout per LLM call; fall through to engine prose on timeout.
- Bypass cost guards. Per-session cap is non-negotiable.
- Add new dependencies beyond what the existing LLM server wrappers use.
- Persist on-demand cache entries to lib/cache/*.json (in-memory cache only for live sessions, or a separate live-cache file with rotation — author's call; pick the option that doesn't blow up the committed cache file).
- Change return contract: hits still return the cached rewrite; misses-that-now-resolve return the new rewrite; failures still return null.

## Rules

### 1. Live session vs cohort run detection
The function must distinguish a live render (user session) from a cohort regen or audit run. Suggested signal: an explicit `liveSession: boolean` parameter threaded from the render entry point, defaulting to false in cohort/audit code paths and true in the production render entry. Audit tests must verify this distinction holds.

### 2. On-demand LLM call on miss
When readCachedRewrite / readCachedKeystoneRewrite returns null AND `liveSession === true`:
- Call the existing LLM server wrapper with the exact same prompt builder, system message, and parameters used during cohort regen.
- Cache the result under the same key.
- Return the result.

### 3. Failure modes
- LLM timeout (>10s): log timeout, return null, splice falls through to engine prose.
- LLM API error: log error, return null, splice falls through to engine prose.
- Per-session cost guard exceeded: log guard hit, return null, splice falls through to engine prose.
- All three failure modes produce a structured log entry with enough context to investigate.

### 4. Per-session cost guard
A configurable cap (default 8) on the total number of on-demand LLM calls per render-session. Once exceeded, subsequent misses return null without calling the API. This protects against runaway costs if something goes wrong upstream.

### 5. Logging
Reuse the cacheObservability primitives. Every on-demand resolution emits a log entry with:
- The original cache-miss payload (namespace, section, key, fingerprint).
- An on-demand-resolution payload (success / timeout / error / cost-guard-hit, latency, tokens used if available).

### 6. Synthetic test infrastructure
The audit must include:
- A non-fixture engine body for a body card that triggers an on-demand call, verifies the result is cached and returned.
- A second call with the same input that returns the cached result without re-calling the API.
- A simulated LLM timeout that falls through to engine prose.
- A simulated cost-guard-exceeded that falls through to engine prose.

## Implementation notes
- The simplest implementation: readCachedRewrite returns null → check liveSession flag → if true and under cost guard → call LLM → cache → return. Otherwise return null.
- Cost: each on-demand call is ~$0.01-0.05 per card depending on engine body length. Worst case for a brand-new user: 4 body cards + Keystone = 5 calls = ~$0.25 first render. Subsequent renders for the same user are free (cache hit on their own engine body).
- The committed lib/cache/prose-rewrites.json and lib/cache/keystone-rewrites.json should NOT be polluted by live-session writes. Use a separate runtime cache (in-memory or separate file).

## Audit gates
- Synthetic non-fixture call: on-demand fires, result returned, second call returns cached result without re-calling LLM.
- Cohort run (`liveSession=false`): zero on-demand calls; cache hits only.
- Timeout test (mocked slow LLM): falls through to engine prose, no crash.
- Cost-guard test: simulate session exceeding cap, verify guard fires.
- Existing 41-fixture sweep stays green.
- readCachedRewrite / readCachedKeystoneRewrite return contracts preserved for null/hit paths.
- tsc + lint clean.
- Cost (this CC's runtime testing): <$1 for synthetic call verification.

## Deliverables
- Files changed list.
- Sample on-demand-resolution log payload (synthetic test).
- Verification that cohort runs produce zero on-demand calls.
- Timeout-fallthrough verification.
- Cost-guard verification.
- 41-fixture sweep status.
- One-line documentation of how to invoke the live-session flag from the render entry point.
