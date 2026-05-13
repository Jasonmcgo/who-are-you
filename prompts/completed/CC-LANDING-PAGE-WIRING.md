# CC-LANDING-PAGE-WIRING

## Objective
Make the 50° Life marketing landing page (currently in `web/index.html`) the front door of the deployed Next.js app at the root route `/`. Move the existing survey entry (currently at `app/page.tsx`) to a sub-route `/assessment`. Update the "Begin the 50 Questions" call-to-action links in the landing page to point at `/assessment`. Preserve all existing survey functionality byte-identical at its new location.

## Sequencing
Independent of all other queued CCs (production-render-path wiring, PROSE-V2 body cards, etc.). Can land in parallel.

## Scope

### File moves
- The current `app/page.tsx` content moves to `app/assessment/page.tsx`. The entire survey state machine, hooks, components, and rendering logic stay byte-identical; only the route changes.
- A new `app/page.tsx` is created that renders the 50° Life landing page content.

### Landing page rendering
- The landing page in `web/index.html` is a self-contained HTML document (~1,419 lines) with embedded `<style>` blocks, inline SVG (the trajectory illustration), Google Fonts preconnect tags, and section content.
- Render approach: a Next.js server component at `app/page.tsx` that emits the HTML content inline. Preserves visual fidelity exactly.
- Acceptable patterns:
  - Server component reading `web/index.html` at module load via `fs.readFileSync` and rendering with `dangerouslySetInnerHTML` (only the body content, not the full `<html>` shell).
  - Or: extract the `<body>` content into a TSX literal embedded directly in the page component.
  - Or: copy `web/index.html` content into a `<style>` block + JSX structure within the page component, preserving classes and inline styles.
- Whichever pattern: the rendered output's visual appearance must match `web/index.html` when viewed in a browser. No styling drift.

### Link rewiring
The landing page contains "Begin the 50 Questions" and "Give it to someone you love" anchor tags currently pointing at `#` (placeholder). Update to:
- "Begin the 50 Questions" → `/assessment`
- "Give it to someone you love" → `/assessment` (or a future `/share` route, defer)

### Navigation
- Visiting `/` renders the landing page.
- Clicking "Begin the 50 Questions" navigates to `/assessment` where the existing survey state machine begins from Q-C1.
- Existing survey behavior at `/assessment` is byte-identical to the pre-CC `/` behavior — session storage, second-pass flow, admin paths, all unchanged.

## Do not
- Modify any survey logic, state machine, hooks, components, or rendering in `app/components/` beyond what's needed to move them under `app/assessment/`. The survey relocates; it doesn't change.
- Change the engine (`lib/identityEngine.ts`, etc.), the prose pipeline, or any computation.
- Touch the database schema or Drizzle migrations.
- Modify `app/admin/`, `app/api/`, or any route other than `/` and the new `/assessment`.
- Touch the CC-LIVE-SESSION-LLM-WIRING server wrapper or the prose rewrite caches.
- Bump cache hashes.
- Add new dependencies. The existing Next.js + React + TypeScript stack handles all needed work.
- Rewrite the marketing HTML's CSS or visual design. Visual fidelity to `web/index.html` is non-negotiable.
- Inline the landing page content into a client component. The landing should be a server component (or fully static) for SEO + performance.
- Change the "Who Are You?" branding or the landing page copy. The copy is canonical product material.

## Rules

### 1. Visual fidelity
Open the rendered `/` route in a browser. It must look identical to opening `web/index.html` directly in a browser. Font loading, colors, spacing, the trajectory SVG illustration, the body-card sections, the reader-recognition pattern cards, the closing CTA — all preserved.

### 2. Existing survey untouched
After this CC lands, visiting `/assessment` and proceeding through the survey must behave identically to the pre-CC `/` behavior. Same questions in same order, same state persistence, same admin paths, same eventual report rendering.

### 3. SEO and meta
The landing page's `<title>`, meta tags, font preconnects, and `<link>` tags must be properly served by Next.js. Acceptable: lift the meta into the page's `metadata` export (Next.js App Router pattern). Acceptable: emit the meta inline via the page component if simpler.

### 4. Mobile responsiveness
The landing page is already responsive in the source HTML. The Next.js wrapping must not break that. Verify by viewing the rendered `/` route at narrow viewport widths.

### 5. Static / cacheable
The landing page should be statically rendered (no client-side JS for the page itself; the existing CTAs that go to `/assessment` are just standard anchor navigation). Next.js should be able to cache and serve it efficiently.

### 6. Both routes deploy cleanly
The build (`next build`) succeeds without warnings related to the new structure. Both `/` and `/assessment` are reachable in dev (`npm run dev`) and in production build.

## Audit gates
- Visiting `/` in dev returns HTML that visually matches `web/index.html` opened directly in a browser. Verified by manual inspection across mobile + desktop viewport widths.
- Visiting `/assessment` returns the survey starting at Q-C1, identical to pre-CC `/` behavior.
- "Begin the 50 Questions" link on the landing page has `href="/assessment"`.
- `next build` completes successfully with no new errors.
- All existing audits pass (43+ in the current suite).
- `tsc --noEmit` clean.
- `npm run lint` clean.
- Cost: $0.

## Deliverables
- Files changed list.
- Before/after route map: pre-CC `/` was survey; post-CC `/` is landing, `/assessment` is survey.
- Screenshots or descriptions confirming visual fidelity of the rendered landing page vs `web/index.html`.
- Confirmation that `/assessment` behaves identically to pre-CC `/`.
- Build + audit status.

## Note for the executor
The landing page HTML contains a section labeled "Ten patterns · scroll →" which is a horizontal scroll affordance. If the source HTML implements this with CSS scroll-snap and no JS, preserve that. If it requires any JS to function, that JS must be carried over (either inline or as a small client component within the otherwise-server-component page).
