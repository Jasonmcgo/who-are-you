# CC-LLM-RENDER-PRODUCTION-POLISH

## Objective
Three production-readiness fixes to land before the assessment is shared with external professional organizations. None changes the LLM machinery or scope; all three sharpen the user-facing surface of the work already shipped.

1. **Parallelize the LLM calls server-side.** Both `/api/render` and `/api/report-cards` currently resolve their five sections (Lens / Compass / Hands / Path / Keystone) sequentially, making fresh on-demand renders take 10–25 seconds. Switch to parallel resolution via `Promise.all` so total latency ≈ slowest single call, not sum of all five.
2. **Add loading state to the share buttons.** Print / Copy as Markdown / Download Markdown currently look idle while `/api/render` is resolving. Add a visible "Generating…" state on Copy and Download (Print is synchronous and needs no change). Disable the button during fetch; re-enable on success or failure.
3. **Remove the "refining…" kicker from the body cards.** The kicker persists after LLM rewrites arrive (visible bug in Hands and Compass). Silent upgrade is the cleaner UX: page loads with engine prose immediately, LLM prose swaps in invisibly when ready, no loading indicator on cards.

## Sequencing
Independent of any other queued work. Recommended priority: this is the last production-polish gate before external share.

## Scope
- `lib/resolveScopedRewritesLive.ts`: switch the section-by-section resolution loop to `Promise.all` across the five sections.
- `lib/renderMirrorLive.ts`: same parallelization pattern if it has its own sequential resolution path.
- `app/components/InnerConstitutionPage.tsx`:
  - Add `isCopying` and `isDownloading` state flags.
  - Wire onClick handlers to set the flag, await the fetch, render visible loading text on the button ("Copying…" / "Generating…"), and clear the flag on completion or error.
  - Remove the per-card `llmResolving` prop threading and the `liveRewritesResolving` flag if they only feed the kicker.
- `app/components/MapSection.tsx`: stop passing `liveRewritesResolving` to body cards. Each card just renders engine prose when no LLM, LLM prose when present. No conditional kicker.
- `app/components/MirrorSection.tsx`: same — drop the kicker prop wiring for Keystone.
- `app/components/ShapeCard.tsx`: remove the `llmResolving` prop and the "refining…" kicker render block. Card body simply chooses between engine prose render and `<LlmProseBlock>` based on whether `llmRewriteMarkdown` is set.

## Do not
- Change the LLM prompts, system messages, temperature, cache key composition, runtime cache, or per-session budget cap.
- Change the timeout (10s per call) or the failure-mode behavior (timeout / error / cost-guard returns null; engine prose is the fallback).
- Touch admin paths (`app/admin/**`), scripts (`scripts/**`), or audit tests (`tests/**`) for the call-site classifications established by CC-PRODUCTION-RENDER-PATH-WIRING. Admin and cohort regen continue on the sync path.
- Add new dependencies. Use native `Promise.all` and existing React `useState` patterns.
- Bump cache hashes (synthesis3 / gripTaxonomy / proseRewriteLlm / keystoneRewriteLlm — none).
- Change the JSON contract of `/api/report-cards` or the markdown contract of `/api/render`. Same outputs; just produced faster.
- Stream the response (server-sent events or chunked transfer). The parallel `Promise.all` approach gets us most of the speed win without the engineering complexity.
- Expand the LLM-rewrite scope to additional sections. Same five (Lens / Compass / Hands / Path / Keystone).

## Rules

### 1. Parallel resolution, shared budget
The `SessionLlmBudget` cap (default 8) must continue to govern total LLM calls. When parallelizing with `Promise.all`, the budget check happens before each LLM call as it does today; if cap is exceeded mid-batch, the remaining calls return null and the affected sections render engine prose.

### 2. Independent section failures
If one section's LLM call times out or errors, the other four still resolve. The endpoint never 5xx's because of a single section failure. The response shape stays consistent — failed sections return null in the JSON; the client renders engine prose for nulls.

### 3. Button loading state — visible and time-bounded
Copy and Download buttons enter a loading state on click:
- Button text changes to "Generating…" (or equivalent — keep it short and the same monospace caps style as the existing button labels).
- Button is disabled (no further clicks) until the fetch resolves.
- On success: button reverts to original label; for Copy, the existing "copied" flash continues to behave as today.
- On failure: button reverts to original label; no user-facing error UI (single `console.warn` is acceptable).
- Hard maximum: after 30 seconds, the button reverts regardless. Stale loading states are worse than visible failure.

### 4. Kicker removal — clean swap
The "refining…" kicker is removed entirely from the on-screen body card surface. Replacement behavior:
- Page loads. Each in-scope card (Lens / Compass / Hands / Path) renders its engine prose immediately.
- `/api/report-cards` fetch fires on mount (unchanged).
- When the response arrives, each card's body swaps from engine prose to `<LlmProseBlock>` if an LLM rewrite is present for that section.
- The Keystone block swaps from Tier C fallback / engine prose to LLM rewrite via the existing `liveKeystoneRewriteProse` prop.
- No visible indicator that the swap is happening. No "refining…", no skeleton, no fade animation. Engine prose → LLM prose, the way the user wouldn't even notice unless they're A/B-ing.

### 5. Engine prose stays as the visible default
Until the LLM rewrite arrives (and after, if it never arrives or returns null), engine prose is what the user sees. The Hands card especially must not flash empty content while waiting for the rewrite — engine prose body is the immediate render.

### 6. Print button untouched
Print uses `window.print()` synchronously. No loading state needed. Leave as-is.

## Implementation notes
- Promise.all parallelization in the resolver: instead of `for (const section of sections) { await resolve(section); }`, do `await Promise.all(sections.map(s => resolve(s)));`. Each resolve checks the SessionLlmBudget, makes its LLM call with the existing 10s timeout, returns the rewrite or null.
- The SessionLlmBudget is shared by reference across the parallel calls. Concurrent budget checks need to be safe — the existing implementation likely already handles this (the cap is informational, not strictly atomic), but verify.
- Button loading state: simple `useState<boolean>` per button. Set true at start of handler, false in a `finally` block that runs whether the fetch succeeds or throws.
- For the kicker removal, the simplest path is: delete the `llmResolving` prop, delete the kicker JSX block in ShapeCard, delete the threading in MapSection / MirrorSection. The body content conditional (engine vs LLM) stays — that's the load-bearing swap.

## Audit gates
- New audit `tests/audit/llmRenderProductionPolish.audit.ts`:
  - Parallel resolution: synthetic mock composers with 200ms latency × 5 sections complete in <500ms total (proving parallelization, not 1000ms+ for serial).
  - Budget enforcement holds under parallel calls: cap=2 with 5 sections fires exactly 2 LLM calls, the other 3 return null.
  - Independent failure: 1 mock composer throws; the other 4 sections still return successfully; endpoint returns 200 with one null field.
  - Loading state assertion (component-level): clicking Copy with a slow mocked /api/render shows the "Generating…" label and disabled state; reverts on resolution.
  - Kicker absence: the rendered React tree for any in-scope card contains no "refining" string and no kicker element with the prior class name.

- Existing audits stay green:
  - `proseV1RenderFire.audit.ts` (splice verification)
  - `keystoneUserModeUnconditional.audit.ts` (Tier A/B/C)
  - `reactOnScreenLlmRender.audit.ts` (the previous CC's audit — must update to reflect kicker removal: drop the kicker-present assertion if present, replace with kicker-absent assertion)
  - `productionRenderPathWiring.audit.ts`
  - `liveSessionLlmWiring.audit.ts`
  - 47-fixture sweep

- `tsc --noEmit` clean.
- `npm run lint` clean.
- Cost in audit: $0 (mocked composers).
- Cost in production: same per-render budget (~$0.05–0.25 for new user first render); subsequent renders cached and free. Parallel just makes the same total spend complete faster.

## Deliverables
- Files changed list.
- Before/after timing for parallel vs serial resolution (synthetic test with 5 × 200ms composers).
- Before/after diff of button loading state (Copy / Download).
- Confirmation that "refining…" string and kicker element are absent from the rendered DOM for any in-scope card.
- Sample loading-state screenshots or descriptions if useful.
- 47-fixture (+1 new) sweep status.

## Why this is the right bundle now
Each of the three fixes alone is small. Bundled, they remove the three things a careful first-time reader would notice as "this feels broken or amateur": serial slowness, idle-looking buttons, persistent loading indicators. After this lands, the user-facing surface should feel sharp enough to share with professional organizations without explaining "it's a beta, ignore the rough edges."
