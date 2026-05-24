# CC-152 — Admin: reach an individual's demographics from the roster (name → profile → edit)

> Owner pain: "I have no idea how to access any individual's demographic data,
> including their name. Clicking a name in the admin session roster should open
> their profile, where admin can fix a fat-fingered email/name." Investigation
> shows the **edit capability already exists** — it's just not reachable. This CC
> is wiring + discoverability, NOT a new feature build.

## What already exists (do not rebuild)

- `app/admin/sessions/[id]/demographics/page.tsx` + `DemographicEditForm.tsx` —
  a working per-session demographics editor.
- `app/admin/sessions/[id]/page.tsx` — the session detail page (renders
  demographics read-only; links to `/answers` but NOT to the demographics editor).
- `app/admin/sessions/page.tsx` — the roster. The **Name cell (L673-677) is
  plain text**, not a link; only a small "view →" in the Actions column links to
  `/admin/sessions/[id]`.
- `app/admin/sessions/ghost-mapping/` — a separate tool to attach name/email to
  *anonymous* sessions via an answer fingerprint (note it exists; not in scope).

So the gap is purely navigation: the name isn't clickable, and the editor is
orphaned from the detail page.

## Execution mode

Single pass, proceed without pausing. Flag ambiguity. No schema change, no engine
change, no derivation change. Display/navigation + a verify of the existing editor.

## Tasks

**T1 — make the roster Name a link.** In `app/admin/sessions/page.tsx`, wrap the
Name cell value (L673-677) in a `next/link` to `/admin/sessions/${s.id}` (the
detail page), styled so it still reads as a name (not a loud button) but is
obviously clickable. Keep the italic "Anonymous"/"Prefer not to say" states —
those should still link (so an admin can open and fix an unnamed session).

**T2 — link the detail page to the demographics editor.** In
`app/admin/sessions/[id]/page.tsx`, add a clear link to
`/admin/sessions/${id}/demographics`, mirroring the existing `/answers` link
(L509-520). Label it so its purpose is obvious (e.g. "edit demographics" / "edit
profile"). This is the missing bridge that makes the editor reachable.

**T3 — verify the editor actually covers name + email.** Read
`DemographicEditForm.tsx` and its save action. Confirm an admin can edit at least
`name_value` and `contact_email` (the fat-finger cases the owner named), and that
saving persists + re-renders. If a field the owner needs (name, email, mobile)
is NOT editable there, ADD it to the form following the form's existing pattern —
but do not redesign the form. If everything's already covered, say so and change
nothing in the form.

## Allowed to modify

- `app/admin/sessions/page.tsx` (T1)
- `app/admin/sessions/[id]/page.tsx` (T2)
- `app/admin/sessions/[id]/demographics/DemographicEditForm.tsx` and its
  save action (T3 — only if a needed field is missing)

Do NOT change the roster's data loading, the answers editor, or any engine/
derivation/schema file.

## Acceptance criteria

1. From `/admin/sessions`, clicking a person's name opens their session detail.
2. From the detail page, there is a visible link into the demographics editor.
3. The demographics editor can edit name and contact_email and persist them
   (verified end-to-end: edit → save → value shows updated). State which fields
   were already editable and which (if any) had to be added.
4. `tsc` + lint clean. No saved answers or derivation touched.

## Flag in report

- Whether T3 required adding any field, or the editor already covered name/email.
- Note that `ghost-mapping` exists (for the separate anonymous-identification
  case) so the owner knows about it.
