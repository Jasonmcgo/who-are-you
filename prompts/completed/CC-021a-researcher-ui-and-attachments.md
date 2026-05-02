# CC-021a — Researcher UI: Sessions Table + Detail View + Attachments

## Launch Directive

You are executing CC-021a. This CC adds a **researcher-only UI** for reviewing saved sessions. It includes:

1. A passcode-protected `/admin` route surface.
2. A **sessions table view** showing all saved sessions with their key demographic and derived attributes.
3. A **session detail view** that renders the InnerConstitution for any saved session (re-using the existing render components).
4. An **attachments system** — researchers can upload files (LLM rewrites, interview notes, consent forms, etc.) associated with each session, stored on the local filesystem with metadata in Postgres.

This is the analytics surface discussed in chat — a tool for *Jason-the-researcher*, distinct from the test-taker's flow. The test flow stays exactly as today; the researcher UI is purely additive on a separate route tree.

The CC ships **local-first** like CC-019. The same code will work in cloud later (CC-021b territory) by swapping local filesystem storage for object storage (S3 / R2 / Vercel Blob) and replacing the simple passcode auth with a real auth provider. No cloud-specific logic in this CC.

Sequenced after CC-019 and CC-020. Independent of the v2 Coherence Engine work; can run alongside the editorial-polish CC.

## Bash Authorized

Yes. Use the shell freely for `tsc`, `eslint`, `psql`, dev-server smoke runs, and `npm run db:generate` / `db:migrate` for the new schema. Do not commit or push.

## Execution Directive

### Item 1 — Passcode auth via middleware

Add `middleware.ts` at the project root. Next.js App Router auto-discovers this file. It runs before every request matching its `config.matcher` glob.

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE_NAME = "wru_admin";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow the admin landing page itself (where the passcode is entered)
  if (pathname === "/admin" || pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Allow the auth API route (where the passcode is verified)
  if (pathname.startsWith("/api/admin/auth")) {
    return NextResponse.next();
  }

  // Gate everything else under /admin and /api/admin
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const cookie = req.cookies.get(ADMIN_COOKIE_NAME);
    if (!cookie || cookie.value !== "ok") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
```

The auth model:

- `ADMIN_PASSCODE` lives in `.env.local`. The user adds it themselves.
- The user navigates to `/admin`, types the passcode into a form. Submission hits `POST /api/admin/auth`.
- That handler compares the submitted passcode to `process.env.ADMIN_PASSCODE`. If matched, sets the `wru_admin=ok` cookie (HttpOnly, SameSite=Lax, expires in 7 days) and redirects to `/admin/sessions`.
- If not matched, returns 401 and the form shows an "Invalid passcode" message.
- Logout: a logout button on `/admin/sessions` POSTs to `/api/admin/auth/logout` which clears the cookie.

This is **simple-by-design auth**, appropriate for a single-user local-dev tool. It is NOT production-grade. CC-021c+ (cloud deploy) will replace it with a real auth provider.

**Add to `.env.local`** (manually by Jason — do not commit a value):

```
ADMIN_PASSCODE=<a-passphrase-Jason-picks>
```

The CC adds the placeholder line to `.env.local` (replacing the existing single-line file with a two-line file containing both `DATABASE_URL` and `ADMIN_PASSCODE=`); Jason fills in the value.

### Item 2 — Attachments schema

Add to `db/schema.ts`:

```ts
export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  session_id: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  uploaded_at: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
  filename: text("filename").notNull(),                  // original filename
  mime_type: text("mime_type").notNull(),
  size_bytes: integer("size_bytes").notNull(),
  storage_path: text("storage_path").notNull(),          // relative path under attachments/
  label: text("label"),                                  // optional category tag
  notes: text("notes"),                                  // optional researcher notes
});
```

Generate the migration: `npm run db:generate`. The new SQL file will create the `attachments` table with the foreign key cascade on session deletion. Apply: `npm run db:migrate`.

**Cascade semantics**: deleting a session deletes its attachments rows (database does this automatically via `ON DELETE CASCADE`). The attachments **files on disk** are NOT automatically deleted by the database — see Item 3 for the file-cleanup hook.

### Item 3 — File storage layer

Create `lib/attachmentStorage.ts`:

```ts
import { promises as fs } from "fs";
import path from "path";

const ATTACHMENTS_ROOT = path.join(process.cwd(), "attachments");

export async function saveAttachmentFile(args: {
  sessionId: string;
  attachmentId: string;
  originalFilename: string;
  buffer: Buffer;
}): Promise<string> {
  const dir = path.join(ATTACHMENTS_ROOT, args.sessionId);
  await fs.mkdir(dir, { recursive: true });
  const safeFilename = sanitizeFilename(args.originalFilename);
  const storagePath = path.join(args.sessionId, `${args.attachmentId}-${safeFilename}`);
  const fullPath = path.join(ATTACHMENTS_ROOT, storagePath);
  await fs.writeFile(fullPath, args.buffer);
  return storagePath;        // returned value is what gets stored in attachments.storage_path
}

export async function readAttachmentFile(storagePath: string): Promise<Buffer> {
  return fs.readFile(path.join(ATTACHMENTS_ROOT, storagePath));
}

export async function deleteAttachmentFile(storagePath: string): Promise<void> {
  try {
    await fs.unlink(path.join(ATTACHMENTS_ROOT, storagePath));
  } catch (err) {
    // Idempotent: file may not exist if already deleted manually.
    // Surface non-ENOENT errors.
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
}
```

**Add `attachments/` to `.gitignore`** so uploaded files aren't accidentally committed.

**Allowed MIME types**: text-y formats are first-class; images and small audio are permitted; large binary files are rejected. Default size cap: 10 MB per file.

```ts
export const ALLOWED_MIME_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
]);

export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
```

Files exceeding the size cap or with a disallowed MIME type are rejected by the upload API route with a 400 response and a clear error message.

### Item 4 — API routes

All under `app/api/admin/`. Auth-gated by middleware (Item 1).

**`POST /api/admin/auth`** — verify passcode; set cookie. Body: `{ passcode: string }`. Returns 200 + sets cookie on match; 401 on mismatch.

**`POST /api/admin/auth/logout`** — clear cookie. Returns 200.

**`GET /api/admin/sessions`** — list sessions. Returns an array of session summary objects: `{ id, name, age_decade, profession_label, gender_label, dominant_function, top_compass, conviction_posture, allocation_tensions_count, saved_at, attachments_count }`. Joins `sessions` + `demographics` + counts from `attachments`. Computed columns derived from `inner_constitution` JSONB.

**`GET /api/admin/sessions/[id]`** — full session detail. Returns `{ session, demographics, attachments }`. Used by the detail page.

**`POST /api/admin/sessions/[id]/attachments`** — upload a file. Multipart form-data with fields: `file` (the file), `label?` (string), `notes?` (string). Validates MIME type + size; saves file via `saveAttachmentFile`; inserts attachments row; returns the new attachment record.

**`GET /api/admin/sessions/[id]/attachments/[attachmentId]/download`** — stream the file back with the original filename in `Content-Disposition: attachment; filename=...` and the stored MIME type. Used by the download links in the detail view.

**`DELETE /api/admin/sessions/[id]/attachments/[attachmentId]`** — delete an attachment. Removes the database row first; then attempts to delete the file via `deleteAttachmentFile`. Returns 200 on success.

### Item 5 — Sessions table view

Create `app/admin/sessions/page.tsx`. Server Component. Fetches sessions via the API route (or directly via the `db` client since it's server-side).

**Layout**: a single full-width table with sticky header. Columns:

| Name | Saved At | Age | Profession | Gender | Lens (dominant) | Compass top | Conviction | Allocation tensions | Attachments | Actions |
|------|----------|-----|------------|--------|-----------------|-------------|------------|---------------------|-------------|---------|

**Per-column behavior**:

- **Name**: from demographics. If `name_state === "specified"` show the value; else show italic "Anonymous" or "Prefer not to say" depending on the state.
- **Saved At**: relative time ("2 hours ago", "3 days ago") with hover-tooltip showing absolute timestamp.
- **Age, Profession, Gender**: from demographics, with the same state-aware rendering. Italic state labels for non-specified states.
- **Lens (dominant)**: from `inner_constitution.lens_stack.dominant`. Render the function code (e.g., "Ni") plus the metaphor label in parens ("Ni (possibility-finder)").
- **Compass top**: from `inner_constitution.top_compass[0]`. Render the value label (e.g., "Faith").
- **Conviction**: from `inner_constitution.belief_under_tension?.epistemic_posture` if present; else dash.
- **Allocation tensions**: count of T-013, T-014, T-015 instances in `inner_constitution.tensions`. Render as a small badge with the count.
- **Attachments**: count from the join. Small icon + count.
- **Actions**: a "View →" link to `/admin/sessions/[id]`.

**Sorting**: clicking a column header sorts ascending; clicking again sorts descending. Sort state in URL params (`?sort=saved_at&dir=desc`) so the user can bookmark a sorted view.

**Filtering**: a row of small filter inputs above the table:
- A search box (filters by name substring).
- A dropdown for Profession (the 14 demographic options + "Any").
- A dropdown for Lens dominant (8 functions + "Any").
- A dropdown for Compass top (8 sacred values + "Any").

Filter state in URL params. Server-side filtering — the API route receives the params and constructs the query.

**Empty state**: if no sessions exist, render a friendly empty state with "No sessions saved yet. Take the test from the home page and click Save at the end."

**Header bar**: the page has a small top bar with "Sessions" title, total count, and a Logout button.

### Item 6 — Session detail view

Create `app/admin/sessions/[id]/page.tsx`. Server Component. Fetches the session + demographics + attachments via the database client (server-side).

**Layout**: two-column.

- **Left column (~70% width)**: the rendered InnerConstitution. Reuse `app/components/InnerConstitutionPage.tsx` (or its inner render structure). The renderer takes the `InnerConstitution` shape; pass it the saved one. Note: do NOT show the Save block or Share block in the admin detail view (the session is already saved; researcher doesn't need those). Pass props or state to suppress those blocks. The Mirror, Map, and tension prose all render as in the live experience.
- **Right column (~30% width)**: the **Attachments panel** (Item 7).

**Top bar**: "Session: {name or 'Anonymous'} — saved {date}" + a "Back to sessions" link.

**Conditional behavior**:

- If the saved session has no demographics row: show italic "No demographic data captured" in the panel where demographic context normally appears.
- If the saved session has no `belief_under_tension`: skip the Keystone Reflection section in the render (matches the live behavior).

### Item 7 — Attachments panel

Create `app/components/AttachmentsPanel.tsx`. Renders the attachments list and the upload form.

**List**: each attachment as a small card showing:

- Filename
- File size (human-readable: "12 KB", "1.4 MB")
- Uploaded relative time ("3 hours ago")
- Label (if specified) as a small tag chip
- Notes (if specified) below the filename, italic
- Three action buttons: "Download" (link to the download API), "Delete" (with confirmation), "Edit notes" (opens an inline editor; PATCH the row).

**Upload form**: at the top of the panel.

- A file picker (`<input type="file">`).
- An optional label field — single-line text input, with a small dropdown of canonical labels for quick selection: "LLM rewrite", "Interview notes", "Consent form", "Audio recording", "Screenshot", "Other".
- An optional notes field — multi-line textarea.
- An "Upload" button that submits via `fetch` to `POST /api/admin/sessions/[id]/attachments` with multipart FormData.
- Inline status: "Uploading..." spinner; "Uploaded" green flash on success; error message on failure (size limit, MIME type, etc.).

**Empty state**: italic "No attachments yet. Upload an LLM rewrite, interview notes, or any other file you want associated with this session."

### Item 8 — `/admin` landing / login page

Create `app/admin/page.tsx`. Renders the passcode entry form.

**Layout**: minimal centered form on a clean page.

- Title: "Researcher Login"
- Passcode input (type="password" so the field is masked)
- Submit button
- An error message slot (shown if a previous attempt failed; checked via URL param `?error=invalid`)

On submit, POST to `/api/admin/auth`. On 200, redirect to `/admin/sessions`. On 401, redirect back to `/admin?error=invalid`.

If the user lands on `/admin` already authenticated (cookie present), redirect immediately to `/admin/sessions`.

## Allowed-to-Modify

- `middleware.ts` — NEW at project root.
- `db/schema.ts` — add `attachments` table.
- `db/migrations/<generated>.sql` — NEW migration file from `npm run db:generate`.
- `lib/attachmentStorage.ts` — NEW.
- `lib/types.ts` — add `Attachment`, `SessionSummary`, `SessionDetail` types as needed for the API route responses.
- `app/api/admin/auth/route.ts` — NEW.
- `app/api/admin/auth/logout/route.ts` — NEW.
- `app/api/admin/sessions/route.ts` — NEW (list).
- `app/api/admin/sessions/[id]/route.ts` — NEW (detail).
- `app/api/admin/sessions/[id]/attachments/route.ts` — NEW (POST upload).
- `app/api/admin/sessions/[id]/attachments/[attachmentId]/route.ts` — NEW (PATCH for notes update, DELETE for delete).
- `app/api/admin/sessions/[id]/attachments/[attachmentId]/download/route.ts` — NEW (GET stream).
- `app/admin/page.tsx` — NEW (login).
- `app/admin/sessions/page.tsx` — NEW (table view).
- `app/admin/sessions/[id]/page.tsx` — NEW (detail view).
- `app/components/AttachmentsPanel.tsx` — NEW.
- `.gitignore` — add `attachments/` to the ignore list.
- `.env.local` — add `ADMIN_PASSCODE=` placeholder line (Jason fills in value).
- `README.md` — add a brief "Researcher UI" section documenting how to access `/admin` and where attachment files live.

No other file should be modified.

## Out of Scope — explicit "do not" list

- **Do not** modify `app/components/InnerConstitutionPage.tsx`'s rendering logic. The detail view passes the saved InnerConstitution to the existing render components and adds props to suppress the Save and Share blocks; do not change how the prose renders.
- **Do not** modify any engine logic, signal extraction, tension detection, or per-card derivation.
- **Do not** modify the test flow — the user-facing route tree (`/`, the question pages, the result page) stays byte-identical.
- **Do not** modify the demographic question definitions or the demographic save flow.
- **Do not** modify any canon file under `docs/canon/`.
- **Do not** introduce a real authentication system (OAuth, magic links, Google login, etc.). The simple passcode is intentional for v1; CC-021c+ replaces it with real auth alongside cloud deployment.
- **Do not** introduce session deletion from the admin UI in this CC. Researchers can browse and download but not delete sessions; deletion happens via SQL in pgAdmin if needed. Adds simplicity and safety. (Future CC can add deletion with confirmation.)
- **Do not** introduce session editing of demographic or answer data. The admin UI is read-only on session content; only attachments are user-modifiable here.
- **Do not** introduce search-within-session-content (SQL-LIKE on belief anchors, etc.). Filtering is by demographic and derived attributes only. Full-text search on belief content has privacy implications; defer.
- **Do not** introduce bulk actions (delete N sessions, export N sessions). One-at-a-time only.
- **Do not** introduce object storage (S3, R2, Vercel Blob). Local filesystem only. Cloud storage lands when cloud deploy lands.
- **Do not** introduce file thumbnailing or in-browser preview. Files download; the user opens them in their native app.
- **Do not** introduce audit logging beyond what Postgres timestamps provide.
- **Do not** modify build configuration, AGENTS.md, CLAUDE.md, or any prompt file other than this one.

## Acceptance Criteria

1. **Middleware gates `/admin/*` routes**. Visiting `/admin/sessions` without the cookie redirects to `/admin`. Submitting the correct passcode at `/admin` sets the cookie and lands at `/admin/sessions`. Submitting wrong passcode shows the error.
2. **Logout button** clears the cookie. Subsequent navigation to `/admin/sessions` redirects back to `/admin`.
3. **Sessions table renders** all saved sessions with the spec'd columns. Empty state shows when no sessions exist.
4. **Sortable columns**: clicking a header sorts the table; sort state persists in URL params.
5. **Filterable**: name search + Profession / Lens / Compass top dropdowns work; combine sensibly (AND across filters).
6. **Session detail renders** the saved InnerConstitution exactly as the live result page would, minus the Save and Share blocks.
7. **Attachments schema migration applies cleanly** via `npm run db:migrate`. Verify via `psql who_are_you -c "\d attachments"`.
8. **Attachments upload works** end-to-end: pick a file, optionally add label + notes, click Upload, attachment appears in the panel and the file lands in `attachments/{session_id}/{attachment_id}-{filename}` on disk.
9. **Attachments download works**: clicking Download triggers a browser download with the original filename and correct MIME type.
10. **Attachments delete works**: clicking Delete (with confirmation) removes the database row and the on-disk file.
11. **Attachments edit notes works**: clicking Edit notes opens an inline editor, PATCH saves the change.
12. **MIME type rejection works**: attempting to upload a `.exe` (or any disallowed type) returns 400 with a clear error.
13. **Size limit enforced**: attempting to upload a 15 MB file (over the 10 MB cap) returns 400 with a clear error.
14. **`attachments/` is gitignored** — verify `.gitignore` contains the entry; running `git status` after an upload should not show the new file.
15. **TSC clean.** `npx tsc --noEmit` exits 0.
16. **Lint clean.** `npm run lint` exits 0.
17. **No file outside the Allowed-to-Modify list is modified.**
18. **Existing test flow is unchanged**: take the test, click Save, demographics save, the live test flow works identically.
19. **Existing CC-016 / 016b / 017 / 018 / 019 / 020 features unchanged**: cascade-skip, Accept/Skip, Q-I1b conditional render, Q-T item-order shuffle, save flow, share/print flow.

## Report Back

1. **Files changed** — file-by-file summary.
2. **Auth smoke**: confirm passcode-correct path lands at sessions; passcode-wrong path shows error; logout clears cookie; un-authed direct navigation to `/admin/sessions` redirects to `/admin`.
3. **Migration verification**: paste the `\d attachments` output.
4. **Sessions table screenshot or render-walkthrough**: confirm columns render, sort works, filter works, empty state works.
5. **Session detail walkthrough**: confirm the saved InnerConstitution renders correctly without Save/Share blocks.
6. **Attachments end-to-end**: upload a sample LLM-rewrite markdown file (or any small file). Confirm it appears in the panel, on disk, and the database. Download it; verify content matches. Delete it; verify both row and file removed.
7. **MIME type and size rejection**: paste the error responses from invalid uploads.
8. **TSC + lint**: exit codes.
9. **Existing-flow regression check**: confirm the test flow + save flow + share flow all still work.
10. **Scope-creep check**: confirm only allowed files modified.
11. **Risks / next-step recommendations**: anything you noticed during implementation that warrants a follow-up CC. Specifically: if the file storage approach has any edge case worth flagging (e.g., what happens if disk fills up), if any UX issue surfaces with the table layout (e.g., 14 profession options × Any in the dropdown) that warrants a design pass, if the `/admin` middleware has any Next.js version-specific quirk.

## Notes for the executing engineer

- **Next.js version compatibility.** The middleware pattern works in Next.js 13+ (App Router). Verify the project's Next.js version in `package.json`. If the project is on a version where middleware behavior differs, surface in the report.
- **Server Components vs Client Components.** The Sessions table page should be a Server Component (fetches data server-side, renders HTML). The Attachments panel needs Client Component behavior for the upload form (file picker, FormData submission). Use the `"use client"` directive sparingly — only on components that need it.
- **The `InnerConstitutionPage` reuse for the detail view** should pass props that suppress the Save and Share blocks. Adding two optional props (`hideSaveBlock?: boolean`, `hideShareBlock?: boolean`) defaulting to `false` is the cleanest minimal change. The CC-019 and CC-020 work added these blocks; toggling them off via prop preserves the existing behavior on the live page while enabling the read-only render in the admin view.
- **File-deletion idempotency**: the Delete handler removes the database row first (so subsequent UI list refreshes don't show a row pointing at a missing file), then attempts to delete the file. If the file doesn't exist (already deleted), the handler does not error.
- **Demographics state-aware rendering** in the table: when `name_state === "specified"`, show the name as text. When `name_state === "prefer_not_to_say"`, show italic "Prefer not to say". When `name_state === "not_answered"`, show italic "Anonymous". Same pattern for other demographic columns.
- **Browser smoke deferred to Jason.** Your smoke testing covers: middleware gating, schema migration, sessions list, session detail render, attachment upload/download/delete/edit, MIME and size rejection, TSC + lint, no regression. UX/visual verification (does the table feel scannable? does the attachment panel feel useful?) is Jason's after the CC lands.
