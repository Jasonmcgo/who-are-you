# CC-PRODUCTION-RENDER-PATH-WIRING

## Objective
Switch the user-facing production render path to call `renderMirrorAsMarkdownLive` (the async on-demand LLM resolver wrapper built by CC-LIVE-SESSION-LLM-WIRING) instead of the synchronous `renderMirrorAsMarkdown`. This is the final piece that activates the LLM machinery for live users: cohort fixtures hit cache, live sessions whose engine body doesn't match a fixture trigger on-demand LLM resolution, and Tier C fallback handles the remaining edge cases. Without this CC, the LLM infrastructure built across PROSE-V1 + KEYSTONE-RENDER + LIVE-SESSION-LLM-WIRING + KEYSTONE-USER-MODE-UNCONDITIONAL exists but isn't called for live users.

## Sequencing
Independent of CC-LANDING-PAGE-WIRING and any V2 prose work. Recommend landing before opening the deployed Vercel URL to non-team-member readers — without this, live users still see engine-prose fallback for Compass / Path / Keystone whenever their session's engine body doesn't byte-match a cohort fixture.

## Scope
- Find every call site of `renderMirrorAsMarkdown(...)` in `app/`.
- Classify each call site as **live** (user-facing report rendering, where a real session reaches the markdown) or **non-live** (admin previews, cohort regen, fixture rendering, audit code paths).
- Switch the **live** call sites to `await renderMirrorAsMarkdownLive(...)` from `lib/renderMirrorLive.ts`.
- Make the enclosing function `async` if it isn't already.
- Leave **non-live** call sites on the sync `renderMirrorAsMarkdown(...)` — admin paths, scripts/, tests/, and cohort regen must continue to use the sync version so they never trigger on-demand LLM calls or runtime-cache writes.

## Live vs non-live classification
**Live (switch to async live wrapper):**
- Any route or server action that renders a report for a real user session after they complete the assessment.
- Any page or API endpoint at the user-facing surface that produces the markdown report for a session ID the user owns.
- Any "view my report" or "share my report" endpoint.

**Non-live (keep sync):**
- `app/admin/**` — admin views of sessions for debugging / inspection.
- `scripts/**` — cohort regen, fixture build, audit-snapshot scripts.
- `tests/**` — audit tests.
- Any code path that explicitly passes `renderMode: "clinician"` (clinician renders never need on-demand LLM by design; the field-list + engine prose is the clinician-mode artifact).
- Any code path that runs over fixtures rather than live session data.

## Do not
- Modify `renderMirrorAsMarkdown` (sync) or `renderMirrorAsMarkdownLive` (async) themselves. Both functions exist and are correct; this CC just changes which one each call site uses.
- Touch the LLM prompts, cache keys, or LLM server wrappers.
- Modify `lib/proseRewriteLlm.ts` or `lib/keystoneRewriteLlm.ts` beyond what's strictly needed at call sites.
- Change the engine, the prose pipeline, the audit gates, or the React surface beyond what call-site swapping requires.
- Touch admin paths, scripts, or tests. They stay on the sync render.
- Add new dependencies.
- Bump cache hashes (synthesis3 / gripTaxonomy / proseRewriteLlm / keystoneRewriteLlm — none).
- Touch `lib/renderMirror.ts` itself unless necessary to expose a type/helper for the live wrapper.
- Pre-resolve LLM rewrites in non-live paths. The runtime cache must stay empty in cohort + admin + test runs.
- Change the timeout (10s), the per-session cost cap (default 8), or the failure-mode behavior of the live resolver. Those are fixed contracts from CC-LIVE-SESSION-LLM-WIRING.

## Rules

### 1. Identify all call sites first
Before changing any code, produce a complete list of `renderMirrorAsMarkdown(...)` call sites in the repo. Classify each as live or non-live with a one-line rationale. Include this list in the report-back.

### 2. Live sites use async live wrapper
Each live call site swaps `renderMirrorAsMarkdown(args)` for `await renderMirrorAsMarkdownLive(args, options)`. The enclosing function becomes `async`. Calling sites of that enclosing function become `await`-ed.

### 3. Non-live sites unchanged
Admin paths, scripts, and tests continue to use the sync `renderMirrorAsMarkdown(args)`. No `await`, no async, no live wrapper. Verified by grep over `app/admin/**`, `scripts/**`, and `tests/**` — none should contain `renderMirrorAsMarkdownLive`.

### 4. Error handling
The live wrapper's three failure modes (LLM timeout / API error / cost-guard hit) all fall through to engine-prose splice behavior, returning a valid markdown string. The caller does not need new error handling beyond what wraps the existing sync call. If the existing sync call site has try/catch, preserve it.

### 5. Observability
After this CC lands, a live render where the session's engine body misses the cohort cache should produce `[cache-miss]` log entries (from CC-CACHE-MISS-LOUDFAIL) and then `[cache-resolution]` log entries (from CC-LIVE-SESSION-LLM-WIRING) showing on-demand LLM success or timeout. Cohort runs and admin path runs should produce zero of either.

### 6. Audit
Add or extend an audit test that:
- Simulates a live render with a non-fixture engine body.
- Verifies the on-demand LLM resolver fires (via composer injection or by intercepting the resolver).
- Verifies the rendered output for the four scoped body cards (Lens / Compass / Hands / Path) and Keystone contains LLM-quality prose, not engine fallback.
- Verifies that a cohort fixture render (sync path) produces zero `[cache-resolution]` logs.

## Audit gates
- All `renderMirrorAsMarkdown` call sites enumerated and classified in the report-back.
- Live call sites switched to `await renderMirrorAsMarkdownLive(...)`; non-live call sites unchanged.
- Synthetic live render with non-fixture engine body produces:
  - `[cache-miss]` logs for the sections that miss
  - `[cache-resolution]` logs with `outcome: "success"` for each resolved section
  - Rendered output contains the LLM-rewritten prose (verified by string-match against the resolver's output)
- Cohort fixture render produces zero `[cache-resolution]` logs.
- Admin path render produces zero `[cache-resolution]` logs.
- Existing 45-fixture audit sweep stays green.
- `tsc --noEmit` clean.
- `npm run lint` clean.
- Cost: $0 in audit (mocked composers, no real API calls).
- Per-render cost in production: ~$0.05–0.25 for a new user's first render whose engine body doesn't match a fixture; $0 for subsequent renders of the same session.

## Deliverables
- Files changed list.
- Complete inventory of `renderMirrorAsMarkdown` call sites with live/non-live classification.
- Before/after diff of each live call site (showing the await + import swap).
- Confirmation that admin paths, scripts, and tests are untouched.
- Synthetic live-render audit results showing on-demand resolution fires.
- Cohort + admin path audit results showing zero on-demand resolution.
- 45-fixture sweep status.
