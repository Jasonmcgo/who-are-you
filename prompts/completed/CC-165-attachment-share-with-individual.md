# CC-165-ATTACHMENT-SHARE-WITH-INDIVIDUAL

> Cowork-chat CC, 2026-05-24.
> Let an admin/guide mark an uploaded attachment "Share with individual,"
> and let the individual download those (and only those) files from their
> own report permalink (`/report/[sessionId]`). Today an uploaded PDF
> (e.g. Megan's guide) is admin-only; the person whose report it is has
> no way to get it.

## ⚠️ PROD MIGRATION IS MANUAL — READ FIRST

This CC adds a column to the `attachments` table. **Vercel does NOT run
`db:migrate` on deploy** (build = `next build` only). So after this lands
and is pushed, the new column must be applied to prod by hand via psql,
exactly like migrations 0007/0008 were. The generated migration file is
for local + the record; it will NOT auto-apply to prod. Call this out in
your report-back and DO NOT assume the prod column exists.

The ALTER is additive and safe (new nullable-with-default column):
```sql
ALTER TABLE "attachments"
  ADD COLUMN "shared_with_individual" boolean DEFAULT false NOT NULL;
```

## Scope

1. **Schema + migration** — add `shared_with_individual boolean NOT NULL
   DEFAULT false` to the `attachments` table.
2. **Type** — add the field to the `Attachment` type.
3. **Upload + toggle** — a "Share with individual" checkbox on the upload
   form, AND a per-card toggle so already-uploaded files (Megan's PDF
   already exists) can be shared without re-uploading.
4. **Public read + download** — the individual's report page lists shared
   attachments with download links, served by a NEW public download route
   that only serves attachments flagged shared.

### 1. `db/schema.ts` — attachments table (~line 268)

Add after `notes`:
```ts
  // CC-165 — when true, the individual can download this file from their
  // own report permalink (/report/[session_id]). Default false: admin-only.
  shared_with_individual: boolean("shared_with_individual")
    .notNull()
    .default(false),
```
(Confirm `boolean` is imported from `drizzle-orm/pg-core` at the top of
the file; add it to the import if missing.)

### 1b. Migration

Generate the migration (`npx drizzle-kit generate`) so a new
`db/migrations/0009_*.sql` + updated `meta/` snapshot are produced. The
SQL must be exactly the additive ALTER above. Verify the generated file
contains ONLY that ALTER (no unrelated drift from snapshot skew — if
drizzle tries to emit other statements because the local snapshot is
behind prod, hand-write the `0009` file with just the ALTER and add the
matching `meta/0009_snapshot.json` + `_journal.json` entry rather than
shipping spurious statements). Report the exact generated SQL.

### 2. `lib/types.ts` — `Attachment` type (~line 1456)

Add: `shared_with_individual: boolean;`

Then fix EVERY place that constructs an `Attachment` result object to
include the new field, or tsc will fail. Known sites:
- `app/api/admin/sessions/[id]/attachments/route.ts` (POST result, ~line 172)
- `app/api/admin/sessions/[id]/attachments/[attachmentId]/route.ts` (PATCH result, ~line 86)
- Any other `: Attachment = {` literal — grep for them and add the field.

### 3a. POST upload route — accept the flag

`app/api/admin/sessions/[id]/attachments/route.ts`:
- Read `const sharedRaw = formData.get("shared_with_individual");` and
  coerce: `const shared_with_individual = sharedRaw === "true" || sharedRaw === "on" || sharedRaw === "1";`
- Pass `shared_with_individual` into the `.values({...})` insert.
- Include `shared_with_individual: row.shared_with_individual` in the
  returned `result`.

### 3b. PATCH route — allow toggling the flag

`app/api/admin/sessions/[id]/attachments/[attachmentId]/route.ts`:
- Extend the body type + validation to accept
  `shared_with_individual?: boolean`. If present and a boolean, set
  `updates.shared_with_individual = body.shared_with_individual`.
- Keep the "at least one of" guard but add `shared_with_individual` to
  the accepted set (so a toggle-only PATCH is valid).
- Include `shared_with_individual: row.shared_with_individual` in the
  returned `result`.

### 3c. `app/components/AttachmentsPanel.tsx` — UI

Upload form: add a checkbox below the Notes field:
```tsx
<label className="flex flex-row items-center" style={{ gap: 8 }}>
  <input type="checkbox" checked={sharedWithIndividual}
    onChange={(e) => setSharedWithIndividual(e.target.checked)} data-focus-ring />
  <span className="font-mono uppercase" style={{ fontSize: 10, letterSpacing: "0.12em", color: "var(--ink-mute)" }}>
    Share with individual
  </span>
</label>
```
- New state `const [sharedWithIndividual, setSharedWithIndividual] = useState(false);`
- In `handleUpload`, append to FormData when checked:
  `if (sharedWithIndividual) fd.append("shared_with_individual", "true");`
- Reset it to `false` on successful upload (alongside `setLabel("")` etc).

Per-card toggle (in `AttachmentCard`): so existing files can be shared.
Add a control in the card's action row (next to Download / Edit notes /
Delete) that reflects `att.shared_with_individual` and PATCHes it. Use a
button that flips state, e.g.:
- When shared: a small "Shared ✓" pill/badge near the filename (mirror
  the existing `att.label` pill style) AND the action button reads
  "Unshare".
- When not shared: action button reads "Share with individual".
- Wire it through a new `onToggleShare(att, next: boolean)` handler in
  `AttachmentsPanel` that PATCHes
  `{ shared_with_individual: next }` to the existing attachment PATCH
  endpoint and `commit`s the updated row (same pattern as
  `handleSaveNotes`).

Keep the existing notes/label/download/delete behavior intact.

### 4a. NEW public download route

Create `app/api/report/[sessionId]/attachments/[attachmentId]/download/route.ts`.
Model it on the admin download route
(`app/api/admin/sessions/[id]/attachments/[attachmentId]/download/route.ts`)
but with ONE critical difference — the WHERE clause must additionally
require the shared flag, so non-shared files are never reachable here:

```ts
.where(
  and(
    eq(attachmentsTable.id, attachmentId),
    eq(attachmentsTable.session_id, sessionId),
    eq(attachmentsTable.shared_with_individual, true)
  )
)
```
If no row matches (wrong id, wrong session, or not shared) → 404 with the
same generic "Attachment not found" message (do NOT distinguish
"exists but not shared" from "doesn't exist" — that avoids leaking which
attachments exist). Stream bytes with the same Content-Type /
Content-Disposition handling as the admin route. No admin auth — the
report permalink is the access token, same trust model as the report
itself.

### 4b. Report page lists shared files

`app/report/[sessionId]/page.tsx` — in `fetchSession`, after loading the
session, also query attachments for that session where
`shared_with_individual = true` (select id, filename, mime_type,
size_bytes, label — NOT storage_path; the page never needs the disk
path). Add the resulting list to the returned `FetchedSession` as
`sharedAttachments`. Pass it to `<ReportView />`.

`app/report/[sessionId]/ReportView.tsx` (read it first to match its
styling/placement conventions) — render a small "Files shared with you"
section (only if `sharedAttachments.length > 0`) with each file's
filename, size, optional label, and a Download link pointing at the new
public route:
`/api/report/${sessionId}/attachments/${att.id}/download`
(use an `<a href download>` like the admin AttachmentCard does). Place it
at the end of the report (below the constitution) — unobtrusive, clearly
a "here are documents your guide shared" block, in-voice with the
report's paper/serif styling. Do NOT leak admin-only fields (notes,
storage_path, the share flag itself) to this surface.

## Files to modify / create

- `db/schema.ts` (column + boolean import)
- `db/migrations/0009_*.sql` + `db/migrations/meta/*` (generated)
- `lib/types.ts` (`Attachment` field)
- `app/api/admin/sessions/[id]/attachments/route.ts` (POST accepts flag)
- `app/api/admin/sessions/[id]/attachments/[attachmentId]/route.ts` (PATCH toggles flag)
- `app/components/AttachmentsPanel.tsx` (upload checkbox + per-card toggle + badge)
- `app/api/report/[sessionId]/attachments/[attachmentId]/download/route.ts` (NEW, public, shared-only)
- `app/report/[sessionId]/page.tsx` (fetch shared attachments, pass down)
- `app/report/[sessionId]/ReportView.tsx` (render shared-files section)

## Security / behavior requirements

- The public download route MUST enforce `shared_with_individual = true`
  in the SQL WHERE. A non-shared attachment id, even with the correct
  sessionId, returns 404. (Add a test for this — see acceptance.)
- Default is `false`: nothing becomes downloadable by the individual
  until an admin explicitly flips it.
- The admin download route is unchanged (still serves all attachments,
  shared or not, behind admin).
- Do not expose `storage_path`, `notes`, or the share flag on the public
  report surface.

## Do NOT

- Run `db:migrate` against prod from the sandbox or assume Vercel ran it
  — flag the manual psql ALTER in the report-back instead.
- Touch the engine, report prose, trajectory chart, couple game, or any
  unrelated surface.
- Change the admin download route's WHERE clause (it stays admin = all).
- Make commits or push (Cowork-chat handles the commit script + the
  manual prod ALTER coordination after local verification).

## Audit acceptance

- `tsc --noEmit` clean; lint clean.
- Local: apply migration 0009, upload a file with the box checked →
  appears in that session's report page with a working download; upload
  with box unchecked → does NOT appear on the report page and the public
  route returns 404 for its id; toggle an existing file's Share on/off →
  report page list updates accordingly.
- Add/extend an attachment route test asserting the public download route
  returns 404 for a non-shared attachment and 200 for a shared one.
- Full audit suite green at close.

## Cost

$0. No LLM; schema + route + UI only.

## Report back

- Files modified/created.
- The exact generated `0009` SQL (so Cowork-chat can hand Jason the
  manual prod psql ALTER).
- Confirmation the public route 404s on non-shared ids (test output).
- One-line note on where the shared-files section renders on the report.

## Next after this closes

1. Cowork-chat writes the commit script (bundles CC-164 + CC-165 if both
   landed).
2. Push → Vercel deploy.
3. **Manual prod step:** run the `0009` ALTER against prod via psql
   (same flow as 0007/0008), THEN flip "Share with individual" on
   Megan's existing PDF and confirm she can download it from her report
   link.
