# CC-HEADER-NAV-AND-EMAIL-GATE

## Objective
Four small surface fixes bundled into one CC, all required before the first soft-share with professional organizations:

1. **Header navigation bar across all routes.** Visitors currently have no way back from the report page or the assessment to the landing page. Add a thin header with "Who Are You?" linking to `/` on the left.
2. **Email-required gate on the demographics step.** Currently no email is collected. Add email as a required field on the existing `IdentityAndContextPage`. Mobile optional. Other demographic fields stay optional. User cannot proceed to the report without a valid email.
3. **Rename and rewire the landing-page CTA "Give it to someone you love" → "Pass along to someone that matters" — and wire the click to copy the assessment URL to clipboard.** The current button is a placeholder anchor. Make it functional with a low-friction share affordance.
4. **Permalink URL per session, surfaced on the report page.** Right now, users have no way to return to their report after leaving the site. Add a route `/report/[sessionId]` that re-renders the saved session, and surface the permalink prominently on the report page with a "Bookmark this link to return" affordance.

## Sequencing
Independent of any other queued work. Recommended to land before external share so:
- Visitors to the report can navigate back to the landing page.
- Every assessment completer's email is captured for follow-up.

## Scope

### Part A — Header bar
- New component `app/components/SiteHeader.tsx`: thin bar, "Who Are You?" link (small serif font, matches existing brand typography) → href `/`.
- Header renders on every route: `/` (landing), `/assessment`, the report page, and `/admin` (the admin sees it too, no harm).
- Subtle styling — should not compete visually with the landing page's existing header band ("Who Are You?" appears at the top of `web/index.html` already as part of the static landing). On `/`, the new component-level header may be redundant; either omit it on `/` (cleanest) or de-emphasize it. Author's call.
- The static landing page in `web/index.html` already has its own top header. The new component header is primarily for `/assessment` and the report page. Verify visually that the two don't collide on `/`.

### Part B — Email-required field on IdentityAndContextPage
- Add **Email** input to `IdentityAndContextPage` (the existing demographic/context step before the report renders).
  - Label: "Email address"
  - Helper text: "Required to view your reading. We won't share your email."
  - Validation: must be a syntactically valid email (basic `local@domain.tld` check). Use a simple regex; no need for SMTP verification.
  - Required: yes — the Continue button is disabled until a valid email is entered.
- Add **Mobile** input below email.
  - Label: "Mobile number"
  - Helper text: "Optional. Only for follow-up if you ask for it."
  - Validation: if filled, must be numeric/phone-ish (basic: only digits, spaces, dashes, parens, +). If empty, accepted.
  - Required: no.
- Other existing demographic fields stay exactly as they are (optional, skippable).
- Continue button behavior:
  - Disabled when email is empty or invalid.
  - When user attempts to proceed with bad/missing email, helper text under email field turns red (`var(--umber)` or equivalent error color) and reads: "Please enter a valid email to view your reading."
  - When email is valid, button enables; clicking it proceeds to the next step (report).
- Privacy line below both fields: a single sentence — "We won't share your contact info."

### Database persistence
- Email and mobile must be saved to the session row in the database alongside the existing demographic data.
- Use the same Drizzle schema pattern as other demographic fields. Add the two columns to the relevant table (likely `sessions` or a `session_demographics` table — depends on existing schema).
- Generate a new migration via `drizzle-kit generate` so the executor's CC produces an applied migration file that Jason can run in production.

### Part C — Landing-page CTA rewire
In `web/index.html` (the static landing page):
- Find the secondary CTA currently labeled **"Give it to someone you love"**. There are two instances (header CTA area + a second occurrence in the body or near the closing).
- **Change the visible button text** in both instances to **"Pass along to someone that matters"**.
- **Wire the click behavior** to copy the assessment URL (`https://the50degreelife.com/assessment`) to the user's clipboard.
  - Use the modern `navigator.clipboard.writeText(url)` API.
  - On success, show a brief inline confirmation: replace the button label with **"Link copied — paste it in an email or message"** for ~2 seconds, then revert to the original button label.
  - On clipboard failure (e.g., older browsers, permissions denied), fall back to selecting the URL in a hidden input + `document.execCommand('copy')`, or just show "Copy this link: https://the50degreelife.com/assessment" as inline text the user can manually select.
- **Do not** add a backend POST, an email-collection modal, or any kind of "we'll send for you" affordance. That's v2 work (requires email service integration — Resend / Postmark / SendGrid + DNS records). For v1, the user copies and pastes the link themselves.

Implementation note: since `web/index.html` is static HTML rendered via `dangerouslySetInnerHTML` in `app/page.tsx`, the click handler can be added either as inline JavaScript in the HTML's `<script>` block (simplest), or by wrapping the static landing in a client component that attaches event listeners. Inline JS is fine for this small a handler.

### Part D — Report permalink + return-access
- New route `app/report/[sessionId]/page.tsx`:
  - Reads `sessionId` from the URL path params.
  - Fetches the session row from the database via Drizzle (the existing schema; query by primary key).
  - If found: renders the same `InnerConstitutionPage` component the assessment flow uses to display reports — passing in the saved constitution, answers, demographics, etc.
  - If not found (invalid or deleted sessionId): renders a friendly 404-style page with a link back to `/` and a brief message like "This reading wasn't found. It may have been deleted, or the link may be incorrect. Take a new assessment from the home page."
  - Server-side rendering — no need for client-side fetch on this route.
- **Surface the permalink on the report page itself** (the page rendered after a user completes the assessment AND on the `/report/[sessionId]` route):
  - Add a new section near the top of the report (or just below the existing masthead, author's call) labeled **"Return to your reading"** with:
    - The full permalink URL as a copyable line: `https://the50degreelife.com/report/{sessionId}`
    - One-line helper text: "Bookmark this link to return to your reading. Anyone with the link can view it — keep it private if it should be."
    - A small "Copy link" button next to the URL that copies it to clipboard on click. Same micro-pattern as the "Pass along" button: brief confirmation message ("Link copied"), reverts after ~2 seconds.
- The permalink also works as the share-with-someone-else URL if the user wants to send their own report to a friend or therapist. The privacy framing — "anyone with the link can view it" — is intentional and honest.
- The permalink survives across deploys, browsers, and devices. As long as the session row exists in the database, the URL works.

Privacy note: the report contains personal beliefs, values rankings, and identity context. The permalink is effectively a long random UUID — security through obscurity. For v1, this is acceptable; v2 could add token-based access (passcode required) but is out of scope here.

## Do not
- Implement automated email sending. No SMTP service, no Resend / Postmark / SendGrid integration. Email is collected and stored only. Future CC can add the send.
- Add SMS / messaging integration for the mobile field. Collection only.
- Change the order of assessment steps. The demographic/context step stays where it is in the flow.
- Make any of the other existing demographic fields required. Only email is required.
- Touch the LLM render pipeline, the markdown export endpoint, the cache layers, or the admin paths.
- Bump synthesis3 / gripTaxonomy / proseRewriteLlm / keystoneRewriteLlm cache hashes.
- Add the new header to `web/index.html` directly. The static landing page already has its own header section; the new React-component header is for the dynamic routes (`/assessment` and the report page).
- Add new dependencies. Use the existing Next.js + React stack.
- Modify the visual design language. The header uses existing CSS variables (`--ink`, `--paper`, `--serif`, etc.).

## Rules

### 1. Header is unobtrusive, single-line
The header is a thin top bar — probably 48-56px tall — with one piece of text on the left ("Who Are You?") and nothing else. No nav menu, no buttons, no separate links. Single-purpose: get back home. The static landing page on `/` may render the header redundantly; either suppress it on `/` (recommended) or accept the redundancy as low cost.

### 2. Email validation is permissive
The validation is just a basic syntactic check: contains `@`, has something on both sides, has a `.` after the `@`. Do not block legitimate email addresses with overly strict validation. Use a simple regex; if in doubt, accept.

### 3. Gate is firm but not aggressive
The Continue button is disabled when email is invalid — but the disabled state should be visually clear (lower opacity, cursor: not-allowed, distinct from the active state). When the user clicks the disabled button OR tries to proceed without email, an inline error message appears under the email field — not a modal, not a toast, not an alert.

### 4. Privacy is one sentence, no more
"We won't share your contact info." is sufficient. No long privacy policy block on this page. If you want a full policy later, link it from the footer.

### 5. Persistence is silent
Email and mobile save to DB when the form is submitted (Continue clicked with valid email). No user-visible "Saving…" state needed — the existing demographic-page submission flow already handles persistence.

### 6. Backward compatibility
Existing sessions in the database (created before this CC) have no email field. After the migration adds the column, existing rows will have NULL email. Do not break the admin view or the re-render flow for sessions without an email — the column is nullable, the gate is only applied at the demographics step before the report is shown to new users.

### 7. The header on `/admin` and `/admin/sessions/[id]` is fine to render — no special suppression needed.

## Implementation notes
- The email field is the only new required gate. Keep validation logic small and reusable in case other fields ever need required-status later.
- The mobile field is more flexible — strip non-digit characters server-side before storage if you want clean phone numbers in the DB, or store the raw input. Recommend storing the raw input for v1 (keeps the user's formatting intact).
- The header component should be a server component or a static client component — no state, no hooks beyond the link rendering. Add it to the root layout (`app/layout.tsx`) so it renders on every route automatically; conditionally suppress on `/` if you prefer to avoid collision with the static landing's own header.

## Audit gates
- New audit `tests/audit/headerNavAndEmailGate.audit.ts`:
  - The `<SiteHeader>` component is rendered on `/assessment` and the report page (renders "Who Are You?" with `href="/"`).
  - The header is either rendered or explicitly suppressed on `/` (visual collision check is manual).
  - The `IdentityAndContextPage` includes a required email input and an optional mobile input.
  - The Continue button is disabled when email is empty or invalid (component-level test).
  - The error helper text appears when an invalid email is submitted.
  - The Drizzle schema includes `email` (text/varchar, nullable) and `mobile` (text/varchar, nullable) columns on the relevant table.
  - A new migration file exists in the `drizzle/` migrations folder.
  - The landing-page CTA renders the new text "Pass along to someone that matters" (zero occurrences of "Give it to someone you love").
  - The landing-page CTA click handler copies the assessment URL to clipboard (component-level or DOM test).
  - The `/report/[sessionId]` route exists and renders successfully when given a valid sessionId.
  - The `/report/[sessionId]` route renders a friendly not-found page when given an invalid sessionId.
  - The report page (both inline and `/report/[sessionId]`) surfaces the permalink URL with the "Bookmark this link to return" affordance.
- Existing 48+ audits stay green.
- `tsc --noEmit` clean.
- `npm run lint` clean.
- Cost: $0 (no LLM calls).

## Deliverables
- Files changed list.
- New header component file path + render confirmation across `/`, `/assessment`, report page, `/admin`.
- Before/after of `IdentityAndContextPage` showing the new email + mobile fields.
- New migration file path (e.g., `drizzle/0008_add_contact_fields.sql` or similar).
- Sample DB row showing email + mobile stored.
- Audit results.

## Post-CC migration step
After this lands and Jason pushes to GitHub, he needs to run the new migration against the production database (same flow as before — pull DATABASE_URL value from Vercel env vars and run `npx drizzle-kit migrate`). Without that, the new columns won't exist in production and the demographics submission will error.

Include the exact migration command in the report-back so Jason can copy-paste it.
