# CC-REPORT-PERMALINK

## Objective
Add a permalink URL per session that lets users return to their report after leaving the site. Closes the "lost forever unless they downloaded it" gap. Implementation: a new route `/report/[sessionId]` that re-renders the saved session from the database, plus a "Bookmark this link to return" affordance surfaced on the report page itself.

## Sequencing
Independent of CC-LAUNCH-VOICE-POLISH and any other queued work. Recommended to land before soft-share to 100+ professionals — without permalink, users have no way back to their own report once they close the tab.

## Scope

### New route: `app/report/[sessionId]/page.tsx`
- Server component (no client-side fetch needed).
- Reads `sessionId` from the URL path params.
- Queries the database via Drizzle for the session row matching that ID.
- If found: renders the report using the same `InnerConstitutionPage` component the assessment flow uses, passing in the saved constitution, answers, demographics, etc.
- If not found (invalid, deleted, or malformed sessionId): renders a friendly not-found page (NOT a generic 404) with:
  - Heading: *"This reading wasn't found"*
  - Body: *"The link may be incorrect, or this reading may have been deleted. Take a new assessment from the home page."*
  - A clear link back to `/` ("Take the assessment →")
  - Same SiteHeader and visual styling as the rest of the app.
- The site header from CC-HEADER-NAV-AND-EMAIL-GATE renders on this route automatically (no extra wiring needed; layout-level).

### Permalink affordance on the report page
Add a new section to the report rendering — placed **just above the "Share This Reading" block** (which currently has Print / Copy / Download buttons). Section structure:

- Section label (matches existing typography): **"Return to this reading"**
- One-line italic helper: *"Bookmark this link to return any time. Anyone with the link can view this reading."*
- The full URL displayed as monospace text in a subtle box: `https://the50degreelife.com/report/{sessionId}`
- A small mono-caps button next to the URL labeled **"Copy link"** that copies the URL to clipboard. Same micro-pattern as the existing buttons:
  - On success: brief label change to "Copied" for ~2 seconds, then reverts.
  - Disabled state during the copy operation if needed (shouldn't be visible — clipboard write is fast).

The affordance must render in **both contexts**: after the user completes the assessment on `/assessment` (their fresh report), AND on the `/report/[sessionId]` route (someone returning via permalink).

## Do not
- Modify the assessment flow, the `IdentityAndContextPage`, the demographics step, the engine math, or the LLM render pipeline.
- Touch admin paths (`app/admin/**`). Admin's existing re-render view is separate from this user-facing permalink and stays untouched.
- Add authentication, passcode protection, or token gating to the permalink. The sessionId is the key; it's long and random enough to be effectively private. v2 can add token-based access if needed.
- Send any emails. Email auto-delivery of the permalink is deferred (needs Resend integration; out of scope here).
- Bump cache hashes (synthesis3 / gripTaxonomy / proseRewriteLlm / keystoneRewriteLlm — none).
- Add new dependencies.
- Change the existing Copy as Markdown / Download Markdown / Print buttons in the Share This Reading block. The permalink affordance is a NEW section sitting above them, not a modification of them.
- Render the permalink for sessions that haven't been saved yet (i.e., during the in-progress assessment flow before the user completes the demographics step). The affordance only appears once the session is persisted.

## Rules

### 1. Permalink is always-on once a session is saved
After the user submits demographics and the report renders, the permalink section is always visible. They don't have to click anything to see it. Bookmarking should be one click ("Copy link" or browser bookmark on the URL itself).

### 2. The URL is the canonical reference
The session ID in the URL is the session's primary key UUID. No separate "share token" — using the existing session ID keeps the implementation simple. Privacy is by obscurity (long random UUID); for a v1 soft-share, this is acceptable.

### 3. The not-found page is friendly, not technical
No "404 Error" or "Server Error." Plain language explaining what happened and how to take a new assessment. Same visual style as the rest of the app (paper background, serif headings).

### 4. Server-side render
The `/report/[sessionId]` route renders server-side from the database. No client-side fetch, no loading state. If the DB query succeeds, the report renders. If it fails, the not-found page renders.

### 5. The LLM rewrites still flow through `/api/report-cards`
When the report is rendered via `/report/[sessionId]`, the React component mounts and fires `/api/report-cards` the same way it does on the fresh-assessment render. LLM upgrade still happens; engine prose is the immediate render.

### 6. Privacy framing is honest
The helper text says *"Anyone with the link can view this reading"* — true and important. Users should understand they're sharing a publicly-resolvable URL when they share the link, not an account-bound private resource. Privacy by obscurity, not by access control.

## Implementation notes
- The Drizzle query for fetching a session by ID is straightforward — use the existing schema. The constitution + answers + demographics live in related tables; join or fetch as needed to reconstitute the props for `InnerConstitutionPage`.
- For the not-found page, return Next.js's `notFound()` is one option, but a custom rendered page is preferable for matching the app's voice and visual style.
- The "Copy link" button can reuse the same clipboard-write pattern as the Copy as Markdown button (with the 30s safety timeout from CC-LLM-RENDER-PRODUCTION-POLISH — though for a 50-byte URL string, timeout is unlikely to matter).
- The permalink section's typography should match the existing report rhythm — section label in caps mono, body italic serif. No new design language.

## Audit gates
- New audit `tests/audit/reportPermalink.audit.ts`:
  - The `/report/[sessionId]` route exists at `app/report/[sessionId]/page.tsx`.
  - When given a valid sessionId, the route renders the report (same InnerConstitutionPage structure as the assessment-flow render).
  - When given an invalid sessionId, the route renders the friendly not-found page (contains "This reading wasn't found" or equivalent + a link to `/`).
  - The report page (both via `/assessment` post-submission AND via `/report/[sessionId]`) contains a section labeled "Return to this reading" with the permalink URL as visible text.
  - The "Copy link" button is present and has the expected click handler wired.
  - The permalink section renders ABOVE the "Share This Reading" block (DOM order check).
- Existing 49 audits stay green.
- `tsc --noEmit` clean.
- `npm run lint` clean.
- Cost: $0.

## Deliverables
- Files changed list.
- New route file at `app/report/[sessionId]/page.tsx`.
- Sample rendered output: valid sessionId → report renders; invalid sessionId → friendly not-found page.
- Screenshot or description of the "Return to this reading" section.
- DOM-order confirmation that the permalink section sits above Share This Reading.
- 49+1 sweep status.

## Why this matters for soft-share
Without permalinks, users can complete the assessment, see their report, close the tab, and lose access forever (unless they downloaded markdown or printed to PDF first). For a 100-professional soft-share, that's a real failure mode — people get distracted, forget to download, and the report effectively disappears. With permalinks, anyone with the link can return; the user is responsible for saving it, but at minimum it exists and is shareable.

This is also the foundation for v2's auto-email-the-link feature once you integrate Resend. The email body just contains the permalink URL.
