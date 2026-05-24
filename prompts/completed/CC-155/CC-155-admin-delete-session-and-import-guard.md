# CC-155 — Admin: delete a session (hard delete) + stop duplicate imports

> Owner need: after restoring sessions via Import JSON, duplicates appeared
> (Madison ×2, LaCinda ×2 — each pair ~2s apart, a double-click double-submit).
> Owner needs the ability to **remove an individual**, and we should stop the
> import from creating dupes on a double-click.

## Decisions / framing

- **Hard delete, not soft archive (for now).** Every child table referencing
  `sessions` is `ON DELETE CASCADE` (demographics, follow_up_links,
  answer_history, attachments, `couple_sessions.partner_a`; `partner_b` is
  `SET NULL`), so `DELETE FROM sessions WHERE id = ?` cleans everything with no
  orphans, **no schema change, and works on prod immediately.** Soft-archive
  would need a new `sessions.archived_at` column → a migration → which prod can't
  cleanly take until the CC-139 reconcile. So ship hard-delete now; archive is a
  flagged follow-on.
- Delete is **destructive and irreversible on prod**, so it MUST be behind an
  explicit, unmissable confirmation that names the person + session id.

## Execution mode

Single pass, proceed without pausing; flag ambiguity. Admin-only. The delete
relies on existing FK cascades — do not add cascade logic in app code beyond the
single delete + best-effort disk cleanup.

## Tasks

**Part A — delete a session.**

A1. Server action (or `DELETE` API route under `app/api/admin/sessions/[id]/`)
`deleteSession(sessionId)`:
  - `db.delete(sessions).where(eq(sessions.id, sessionId))` inside the existing
    db client. FK cascade removes demographics / follow_up_links / answer_history
    / attachments rows and nulls `couple_sessions.partner_b`. Return
    `{ ok: true }` or a structured error.
  - **Best-effort disk cleanup:** attachments store bytes under
    `attachments/<sessionId>/`. After the DB delete, remove that directory if it
    exists (wrap in try/catch — on Vercel the FS is ephemeral, so a missing dir
    is normal; never fail the delete because the dir wasn't there).
  - Admin-gated like the other admin routes/actions.

A2. A **Delete** control in the roster `Actions` column
(`app/admin/sessions/page.tsx`) — and optionally on the detail page
(`app/admin/sessions/[id]/page.tsx`). On click:
  - Fire a confirmation that names the person and the session id, e.g.
    `Permanently delete "Madison" (0cbfd1e7…) and all of their data? This cannot be undone.`
    Use `window.confirm` at minimum; a typed-name confirm is acceptable hardening
    but not required.
  - On confirm → call A1 → on success `router.refresh()` (roster) or redirect to
    `/admin/sessions` (detail page) so the row disappears.
  - Style it distinctly from the benign actions (it's destructive) but consistent
    with the admin visual register.
  - The control is a client component (the roster is a server component, so the
    delete button must be a small client sibling, like CopySessionLinkButton).

**Part B — stop duplicate imports.** In
`app/admin/sessions/import/ImportSessionForm.tsx`, disable the submit button
while a request is in flight (a `submitting` state set true on submit, false on
response/error; ignore clicks while true). This prevents the double-click →
double-POST → duplicate-session pattern that created the Madison/LaCinda dupes.
(Import deliberately creates a new session per submit — this only blocks the
accidental second submit of the SAME click, not legitimate re-imports.)

## Allowed to modify

- `lib/saveSession.ts` (or a new `lib/deleteSession.ts`) for the delete action.
- A new `app/api/admin/sessions/[id]/route.ts` `DELETE` handler if a route is
  cleaner than a server action (follow the existing admin route pattern).
- `app/admin/sessions/page.tsx` + a small new client `DeleteSessionButton.tsx`.
- `app/admin/sessions/[id]/page.tsx` (optional detail-page delete).
- `app/admin/sessions/import/ImportSessionForm.tsx` (Part B).

Do NOT add a schema column, change the engine/derivation, or touch the import's
create-new-session behavior beyond the in-flight guard.

## Acceptance criteria

1. Deleting a session from the roster removes it (and its demographics / any
   follow-up links / answer-history / attachments rows) — verified by re-querying
   after delete; no orphan rows; other sessions untouched.
2. Delete requires an explicit confirmation naming the person + id; cancelling
   does nothing.
3. The roster refreshes and the row is gone after a successful delete.
4. Re-clicking the import submit button while a request is in flight does NOT
   create a second session (Part B).
5. `tsc` + lint clean. No schema change. No engine/derivation change.

## Flag in report

- Whether delete was implemented as a server action or a DELETE route, and the
  exact confirmation copy.
- Confirm the cascade actually cleared children (show a before/after row count on
  demographics for a deleted id, or equivalent).
- Note the soft-archive follow-on: it needs `sessions.archived_at` + a migration,
  so it's gated behind the prod-migration reconcile (CC-139). Out of scope here.
