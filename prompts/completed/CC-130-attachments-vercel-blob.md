# CC-130 — Attachments storage → Vercel Blob (fix read-only-FS upload failure)

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass.
Do not stop for confirmation between steps. On ambiguity, apply the
canon-faithful interpretation, proceed, and flag it. Permission bypass is
on; the discipline below is scope.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.

## Execution Directive

- This is the deferred **CC-021b** ("object-storage adapter when cloud deploy
  lands"). Rewrite `lib/attachmentStorage.ts` to use **Vercel Blob** instead of
  the local filesystem. **Preserve the three exported function signatures** so
  the upload/download/delete API routes and `AttachmentsPanel` need NO changes.
- Keep a **local-dev filesystem fallback** so dev still works without a Blob
  token.

## Context

On Vercel, attachment upload fails with `ENOENT: ... mkdir '/var/task/attachments'`.
`lib/attachmentStorage.ts` writes to `path.join(process.cwd(), "attachments")`,
which is `/var/task/attachments` in a serverless function — a **read-only**
filesystem. Local-disk storage can't work on Vercel. The module's own header
already names the fix: an object-storage adapter (Vercel Blob).

## Prereq (operator, not this CC)

A **Vercel Blob store** must be connected to the project (Vercel dashboard →
Storage → Blob), which sets `BLOB_READ_WRITE_TOKEN`. This CC's code reads that
token; without it, it falls back to local fs (dev).

## Read First (Required)

- `lib/attachmentStorage.ts` — the three functions to preserve:
  `saveAttachmentFile({sessionId, attachmentId, originalFilename, buffer}) → string`,
  `readAttachmentFile(storagePath) → Buffer`,
  `deleteAttachmentFile(storagePath) → void`,
  plus `ALLOWED_MIME_TYPES`, `MAX_ATTACHMENT_SIZE_BYTES`, `sanitizeFilename`.
- The three API routes under `app/api/admin/sessions/[id]/attachments/**` —
  confirm they only depend on those three functions + the `storage_path`
  string stored on the attachment record.

## Tasks

1. `npm install @vercel/blob`.
2. Rewrite `lib/attachmentStorage.ts`:
   - **`saveAttachmentFile`**: when `process.env.BLOB_READ_WRITE_TOKEN` is set →
     `put(key, buffer, { access: "public", contentType, addRandomSuffix: false })`
     where `key = "attachments/{sessionId}/{attachmentId}-{safeFilename}"`.
     Return the blob's **`url`** as the `storage_path` (stored on the record).
     When the token is absent (local dev) → keep the existing fs behavior and
     return the relative path as today.
   - **`readAttachmentFile(storagePath)`**: if `storagePath` looks like a URL
     (blob) → `fetch(storagePath)` → `Buffer.from(await res.arrayBuffer())`
     (the admin download route proxies the bytes, so the gate stays server-side).
     Else (relative path, dev) → `fs.readFile` as today.
   - **`deleteAttachmentFile(storagePath)`**: URL → `del(storagePath)` (idempotent,
     swallow not-found); relative → `fs.unlink` as today (existing ENOENT swallow).
   - Keep `ALLOWED_MIME_TYPES`, `MAX_ATTACHMENT_SIZE_BYTES`, `sanitizeFilename`
     unchanged. Preserve all three signatures exactly.
3. Pass `contentType` to `put` (the route already has the mime type; thread it
   into `saveAttachmentFile` if not already — minimal arg addition is OK since
   it's the same module's caller).

## Allowed to Modify (exhaustive)

- `lib/attachmentStorage.ts` (the rewrite).
- `package.json` / lockfile (add `@vercel/blob`).
- The attachments **POST** route only if `saveAttachmentFile` needs the
  `contentType` arg threaded through (minimal). Do NOT change the download/
  delete routes or `AttachmentsPanel`.

## Out of Scope

- Migrating any existing local attachments (there are none on prod — uploads
  were failing). Private/token-gated blob access (public + unguessable URL,
  proxied through the admin download route, is sufficient). Any non-attachment
  feature.

## Bash Commands Authorized

- `npm install @vercel/blob`
- `npx tsc --noEmit`

## Acceptance Criteria

1. With `BLOB_READ_WRITE_TOKEN` set, `saveAttachmentFile` uploads to Blob and
   returns a blob URL; `readAttachmentFile` fetches it back to a Buffer;
   `deleteAttachmentFile` removes it. No `fs.mkdir`/`writeFile` on that path.
2. Without the token (local dev), behavior is unchanged (fs path).
3. The three signatures are preserved; download/delete routes + AttachmentsPanel
   unmodified (or POST route only minimally, for contentType).
4. `npx tsc --noEmit` clean.

## Report Back

- The rewritten module + the blob branch vs fs-fallback logic.
- Confirm the three signatures are unchanged and which routes (if any) were touched.
- `tsc` result. Reminder that the operator must connect a Vercel Blob store
  (sets `BLOB_READ_WRITE_TOKEN`) before prod uploads work.
