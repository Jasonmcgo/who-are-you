# CC-127 — Follow-up UI: admin Copy-URL button + public answer page

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass.
Do not stop for confirmation between steps. On ambiguity, apply the
canon-faithful interpretation, proceed, and flag it. Permission bypass is
on; the discipline below is scope.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.
**Depends on CC-126 merged** (the GET/POST `/api/follow-up/[token]` API, the
`mintFollowUpLink` helper, and the `follow_up_links` table).

## Execution Directive

- One pass. This is the **UI layer only** for the follow-up flow:
  (1) an admin **Copy-URL** affordance per session, and (2) the **public
  tokenized answer page** the link opens.
- Reuse the existing question-rendering UI (the assessment's ranking /
  forced-choice components) and the app's existing styling. Do NOT build a new
  design system or modify the engine, scoring, or CC-126's API/back-end.

## Context

Flow (manual sends until 50+ cohorts): operator opens the admin sessions list,
clicks **Copy follow-up link** on a person's row, pastes that URL into an email
by hand. The link opens a public page (no login) that shows the questions that
session never answered plus their 3 follow-ups; on submit, the answers write
back and the report re-derives (all handled by CC-126's API). No email
integration, no scheduler.

## Read First (Required)

- `app/admin/sessions/page.tsx` — the sessions list + the Actions column (where
  "VIEW →" lives); add the Copy-URL action alongside it.
- The existing assessment question UI components (ranking + forced-choice) —
  reuse them for both the missing questions and the follow-ups. Find them
  (likely under `app/` / `components/`); match their props.
- CC-126: `mintFollowUpLink(sessionId)` in `lib/followUpLink.ts`; the
  `GET`/`POST` handlers in `app/api/follow-up/[token]/route.ts` — match their
  exact request/response shapes (GET → `{ personName, missingQuestions,
  followUps }`; POST → the answer payload CC-126 defined).
- Admin auth: how `/api/admin/**` is gated (the Copy-URL mint endpoint must sit
  under admin auth; the public answer page + `/api/follow-up/**` must NOT).

## Tasks

### A. Admin mint endpoint

Add an admin-gated endpoint (route or server action) that calls
`mintFollowUpLink(sessionId)` and returns `{ url }`. Place it under the same
auth as the rest of `/api/admin/**`. (CC-126 built the helper; this exposes it.)

### B. Admin Copy-URL button

In the sessions list Actions column, add a **"Copy link"** control per row that:
- calls the mint endpoint with that session's id,
- writes the returned URL to the clipboard (`navigator.clipboard.writeText`),
- shows brief inline confirmation ("Copied ✓").
Match the existing admin styling (the cream/sienna theme, mono labels).

### C. Public answer page — `app/follow-up/[token]/page.tsx` (or the path
`mintFollowUpLink` points at — confirm and match)

- On load, GET `/api/follow-up/[token]`.
  - Unknown/used token → a calm "this link isn't active" state (no stack trace).
- Render, in order: a warm one-line intro using `personName` ("A few follow-up
  questions, {name} —"); the **missing questions** (reuse the assessment
  components, by `type`); then the **3 follow-ups** (render `responseMode`:
  `choose_one` → single-select; `rank_top_2` / `rank_top_3` → the existing
  ranking UI capped at N).
- Submit → POST `/api/follow-up/[token]` in CC-126's payload shape →
  on success show a confirmation ("Thanks — your report is updating."). Disable
  re-submit (CC-126 is idempotent, but the UI shouldn't invite double-sends).
- Public page: no admin chrome, no auth. Mobile-legible.

## Allowed to Modify (exhaustive)

- NEW: the public page route file(s) under `app/follow-up/[token]/`, the admin
  mint endpoint file, and any small client component for the Copy button.
- `app/admin/sessions/page.tsx` — only to add the Copy-URL control to the
  Actions column.
- Reuse existing question components without modifying them. Do NOT touch the
  engine, scoring, `data/questions.ts`, CC-126's API/back-end, or other admin UI.

## Out of Scope

- Email send / scheduling (manual paste).
- The follow-up generator (CC-125) and backend (CC-126).
- Seeding the 14 hand-authored sets (CC-126b).

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run build` (or the repo's lint/build check) if quick.

## Acceptance Criteria

1. The sessions list shows a working **Copy link** control per row that copies a
   real tokenized URL to the clipboard.
2. Visiting that URL renders the person's missing questions + 3 follow-ups using
   the existing question UI, and submits to CC-126's POST without error.
3. After submit, a confirmation shows; the session's answers updated + re-derived
   (verifiable in admin: the row's read can change).
4. The public page works **without** admin auth; the mint endpoint requires it.
5. `npx tsc --noEmit` clean. Engine/scoring/CC-126 back-end untouched.

## Report Back

- New files + the public page path (confirm it matches `mintFollowUpLink`'s URL).
- The existing question components reused (paths).
- Confirmation the public route is outside admin auth and the mint endpoint is inside.
- `tsc`/build result; a screenshot or text walkthrough of one end-to-end flow
  (copy link → open → answer → submit → re-derive).
