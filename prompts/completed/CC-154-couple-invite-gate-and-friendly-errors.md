# CC-154 — Couple invite card: require a saved session + surface friendly errors

> Owner hit this live: on a report showing "THIS IS A DRAFT. NOTHING IS SAVED",
> the "Invite your partner" card tried to mint a couple link and surfaced a raw
> DB error to the user — *Couldn't mint a link: relation "couple_sessions" does
> not exist*. Two problems: (1) the card offered invite when there's no saved
> session to invite from, and (2) raw internal errors leak to the reader. (The
> missing-table root cause is separate — that's applying migration 0008 / the
> CC-139 reconcile, not this CC.)

## Execution mode

Single pass, proceed without pausing; flag ambiguity. UI + error-handling only.
No engine/derivation/schema change. No change to the mint's success behavior.

## Verified context

- `app/report/[sessionId]/ReportView.tsx` — `CoupleInviteCTA` (L95) is mounted at
  L77 with `sessionId`. On click it POSTs `{ sessionId }` to `/api/couple/mint`,
  and on failure renders the raw message: `Couldn't mint a link: {state.message}`
  (L260). That raw passthrough is how the DB error reached the user.
- `app/api/couple/mint/route.ts` — returns the error that the client displays.
- The Share/permalink block in `app/components/InnerConstitutionPage.tsx` already
  models the right gate: it renders **only when a real `sessionId` exists**
  (`hideShareBlock || !sessionId ? null : …`, ~L1406). The draft banner "this is
  a draft. nothing is saved." is L1706 — the unsaved state to guard against.
- `lib/coupleInviteLink.ts` `mintCoupleInviteLink` already throws a clear
  internal error when partner A's session isn't found — good for logs, not for
  users.

## Tasks

**T1 — gate the invite card on a saved session.** `CoupleInviteCTA` must only
offer minting when `sessionId` refers to a genuinely saved session (the same
condition the Share block uses). In the draft / unsaved state, do NOT show the
mint button — instead show a short, warm hint like *"Save your report first,
then you can invite your partner."* Confirm where the CTA is mounted: if it can
appear in the assessment-flow draft view (not just the `/report/[sessionId]`
permalink), gate it there too so it never renders a live mint button on an
unsaved draft.

**T2 — friendly mint errors (no raw internals).** On mint failure the user
should see a generic, reassuring message — e.g. *"We couldn't create your invite
link just now. Please try again in a moment."* — never a raw string like
`relation "couple_sessions" does not exist` or `mint failed (500)`. In
`/api/couple/mint/route.ts`, log the real error server-side (console.error with
context) and return a generic user-facing message + an appropriate status. The
client (`CoupleInviteCTA`) shows the generic copy; it must not echo internal
detail.

**T3 — (small, optional) distinguish "not ready yet" from "broke".** If it reads
cleanly, the generic failure copy can gently suggest trying again later (covers
the transient/missing-table case) without exposing why. Keep it one sentence.

## Allowed to modify

- `app/report/[sessionId]/ReportView.tsx` (CTA gating + generic error copy)
- `app/api/couple/mint/route.ts` (server-side log + generic returned message)
- `app/components/InnerConstitutionPage.tsx` — ONLY if the CTA can render in the
  draft path and needs gating there; otherwise leave untouched.

Do NOT change the mint success flow, `lib/coupleInviteLink.ts`, the couple
schema, or anything in the engine/derivation.

## Acceptance criteria

1. On an unsaved draft report, the invite card shows a "save first" hint and no
   live mint button — clicking can't trigger a mint.
2. On a saved report, the invite flow works exactly as before (success path
   unchanged).
3. A mint failure (simulate by pointing at a DB without `couple_sessions`, or
   stubbing the route to throw) shows a generic friendly message to the user; the
   real error appears only in server logs. No raw DB/relation text reaches the UI.
4. `tsc` + lint clean. No schema/engine/derivation change.

## Flag in report

- Where the CTA turned out to be mounted (permalink only, or also the draft
  flow), and where the gate was applied.
- The exact user-facing failure copy used.
- Confirm the real error is logged server-side and not returned to the client.
