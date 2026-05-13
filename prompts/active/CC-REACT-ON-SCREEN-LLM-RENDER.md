# CC-REACT-ON-SCREEN-LLM-RENDER

## Objective
Make the user-facing on-screen report display LLM-resolved prose for the four scoped body cards (Lens / Compass / Hands / Path) and the Keystone Reflection, matching what the Copy/Download markdown flow at `/api/render` already produces. Currently the on-screen React render shows engine prose card-by-card; only the markdown export pipeline applies the LLM rewrites. After this CC, what the user sees in the browser matches what they get when they Copy/Download.

## Sequencing
Lands after CC-PRODUCTION-RENDER-PATH-WIRING (which is already deployed via `/api/render`). Independent of any other queued work. Recommended priority: this is the last user-visible gap between the LLM machinery and the user surface.

## Scope
- New endpoint `app/api/report-cards/route.ts` that returns the LLM-resolved prose for the four scoped body cards + Keystone as structured JSON (not markdown).
- `app/components/InnerConstitutionPage.tsx` fetches the endpoint on mount and threads results into the four card components and the Keystone block.
- Each card component reads its LLM-rewritten prose from props when present; falls back to the existing engine-prose render when the fetch is pending, fails, or returns empty.
- Loading state visible during fetch (skeleton, subtle indicator, or graceful "still rendering" cue — author's call).

## Do not
- Modify the LLM resolver, prompts, cache structure, runtime cache, or per-session budget logic. The endpoint reuses everything CC-LIVE-SESSION-LLM-WIRING built.
- Touch `/api/render` (the markdown endpoint). It stays as the markdown-export surface.
- Change the on-screen rendering of non-scoped sections (Executive Read, Core Signal Map, Movement, Disposition, Work Map, Love Map, Open Tensions, Mirror-Types Seed, Conflict Translation, "What this is good for" appendix). None of those are in the LLM-rewrite scope.
- Touch the admin re-render page (`app/admin/sessions/[id]/page.tsx`) or its clinician-mode rendering. The admin view stays on sync engine prose for audit fidelity.
- Block the initial page render waiting on the LLM fetch. The page must render fully with engine prose first; LLM prose swaps in when the fetch resolves.
- Trigger the endpoint from cohort regen scripts, audits, or any non-user-facing path.
- Add new dependencies. Use existing React patterns (useEffect or Next.js server component data fetching).
- Bump cache hashes (synthesis3 / gripTaxonomy / proseRewriteLlm / keystoneRewriteLlm — none).
- Persist on-demand LLM results to disk caches. Runtime cache only (same contract as `/api/render`).
- Display loading states for the non-scoped sections — only the four cards + Keystone show "upgrading" indication while the fetch is pending.

## Rules

### 1. Endpoint contract
`POST /api/report-cards` accepts `{ answers, demographics, metaSignals?, includeBeliefAnchor? }` (same body shape as `/api/render`).

Returns `200 OK` with JSON:
```json
{
  "lens": { "strength": "...", "growthEdge": "...", "practice": "..." },
  "compass": { "strength": "...", "growthEdge": "...", "practice": "...", "patternInMotion": "...", "movementNote": "..." },
  "hands": { "opener": "...", "strength": "...", "growthEdge": "...", "underPressure": "...", "practice": "...", "closing": "..." },
  "path": { "opener": "...", "danger": "...", "growth": "...", "workParagraph": "...", "loveParagraph": "...", "giveParagraph": "...", "practice": "..." },
  "keystone": { "paragraph": "..." }
}
```

Field names should mirror the structure the React components consume. The executor may adjust field names to match the actual component prop structure; the principle is: structured per-card prose, not markdown.

On failure (timeout, budget exhausted, LLM error), the endpoint returns the same JSON shape with `null` for any field that didn't resolve. The client uses engine prose for nulls.

The endpoint internally calls the same `renderMirrorAsMarkdownLive` (or a sibling helper that exposes the structured rewrites without serializing to markdown). Same SessionLlmBudget, same runtime cache, same Tier C fallback contract.

### 2. Progressive enhancement
The page renders fully with engine prose immediately. The fetch starts on mount. When the response arrives, the four cards + Keystone update their visible prose to the LLM version. No flash of empty content; no unmounting and re-mounting of the cards.

### 3. Graceful failure
If the fetch errors out, times out, or returns nulls: the on-screen render stays on engine prose. No user-facing error message. No console error spam beyond a single structured warn.

### 4. Loading affordance
Some visible indication that the cards are "still resolving" — could be a subtle italic note ("refining…"), a skeleton state on the body of each scoped card, or a top-of-card indicator. Should not be visually heavy; the engine prose is already a valid render.

### 5. Admin path stays sync
The admin re-render page (`app/admin/sessions/[id]/page.tsx`) renders with `renderMirrorAsMarkdown` (sync, no LLM). This CC does not change that. The admin view explicitly does NOT call `/api/report-cards`.

### 6. Cohort runs stay silent
Cohort regen scripts, audit tests, and any code path that runs over fixtures must not call `/api/report-cards`. Verified by grep across `scripts/**`, `tests/**`, `app/admin/**` — none should reference the new endpoint.

### 7. Same architecture as `/api/render`
The endpoint, the budget, the timeout, the cost-guard, the failure-mode behavior all mirror what `/api/render` already does. This is the same pattern, returning a different output shape. Do not introduce parallel machinery.

## Implementation notes
- The cleanest path is likely to expose a sibling function in `lib/renderMirrorLive.ts` — something like `resolveScopedRewritesLive(args, options)` — that runs the same resolver chain but returns the per-section LLM rewrites as a structured object rather than splicing them into markdown. `/api/report-cards/route.ts` calls this; `/api/render/route.ts` continues to call the existing `renderMirrorAsMarkdownLive` (which can be refactored to use the new structured helper internally if cleaner).
- React side: client component `InnerConstitutionPage` already has `answers`, `demographics`, `constitution` available. Add `useEffect` to fetch `/api/report-cards` on mount; store result in component state; pass into card components via existing prop interfaces.
- Card components likely already accept their prose via props; the change is which prop value gets used. Engine prose stays as the default; if the prop is provided from the LLM fetch, that takes precedence.

## Audit gates
- New audit `tests/audit/reactOnScreenLlmRender.audit.ts` with assertions:
  - `POST /api/report-cards` returns 200 with the expected JSON structure for a valid request.
  - Synthetic non-fixture input triggers the LLM resolver; the response contains LLM prose (not engine prose substrings).
  - Cohort fixture input returns cached LLM prose (no on-demand calls).
  - Simulated LLM timeout returns nulls or engine fallback; the endpoint does not 500.
  - Per-session budget cap is enforced (same as `/api/render`).
  - The new endpoint is not called from any path in `scripts/**`, `tests/**`, or `app/admin/**`.
- Existing 46+ audits stay green.
- `tsc --noEmit` clean.
- `npm run lint` clean.
- Cost: $0 in audit (mocked composers, no real API calls in test runs).
- Per-render cost in production: same as `/api/render` — ~$0.05–0.25 for new live user on first render; $0 for warm-process subsequent renders.

## Deliverables
- Files changed list.
- New endpoint route file.
- Diff of `InnerConstitutionPage.tsx` showing the fetch + prop threading.
- Per-card component diffs showing where LLM prose substitutes engine prose.
- Sample response payload (synthetic test).
- Confirmation that admin / cohort / audit paths don't call the new endpoint.
- Loading affordance description (what users see while the LLM resolves).
- 47-fixture sweep status.
