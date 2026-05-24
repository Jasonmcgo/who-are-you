# CC-153 — Admin: export a session's answers+demographics as JSON, and import them into a NEW session

> Owner goal: get the partial legacy tests (Madison, JDrew, LaCinda — taken on
> the old local system before all questions existed) into Vercel without
> hand-taking the test and faking answers through to completion. Flow: export/
> obtain a person's answers+demographics as a JSON file → import it as a NEW
> Vercel session → then reset legacy Qs (CC-136) + send their gap-fill link
> (existing CopySessionLinkButton mint). This CC builds the export + import; the
> reset + gap-fill chain already exists.

## Owner decisions (locked)

- Portable unit = **answers + demographics JSON** (regenerates the report; can be
  reset/gap-filled). NOT a rendered report.
- Import target = **a NEW session every time** (no merge-into-existing). One
  upload → one new session row.

## What already exists (reuse, don't rebuild)

- `lib/identityEngine.ts:2031` — `buildInnerConstitution(...)` derives the
  constitution from answers (+ demographics/meta). Read its exact signature.
- `lib/saveSession.ts` — `saveSession({ answers, innerConstitution,
  skippedQuestionIds, metaSignals, demographicAnswers, contactEmail,
  contactMobile, ... })` inserts a new session + its demographics row in one
  transaction. This is the import's write path.
- `app/admin/sessions/[id]/page.tsx` (~L125-151) already has a client-side
  file-download (blob + `a.download`) — reuse/extend it for the export side.
- `data/questions.ts` exports `allQuestions` (full bank incl. retired legacy
  Q-T) — use it to validate imported `question_id`s and to know which are now
  "missing" (the binary Q-TB-* set) so the gap-fill link asks them.
- `detectStaleShape` / the re-derivable render branch — relevant if a partial
  import can't fully derive (see Risk below).

## Execution mode

Single pass, proceed without pausing; flag ambiguity. No schema change (reuse
sessions + demographics). Validate all input; never persist malformed answers.

## Tasks

**T1 — export.** Add an admin action to download a session's portable JSON:
`{ schemaVersion, answers, skippedQuestionIds, metaSignals, demographics,
contactEmail, contactMobile }`. Shape it to round-trip cleanly into T2's import
(field names matching `saveSession` args / the demographics answer shape). Wire
it as a "Download JSON" control on the session detail page, reusing the existing
blob-download mechanism. Do NOT include the rendered report or the derived
`inner_constitution` (the import re-derives) — keep the file a pure source-data
artifact.

**T2 — import (new session).** Add an admin-gated import surface (a dedicated
`/admin/sessions/import` page is cleanest; an upload control on the roster is
acceptable). It accepts the T1 JSON (file upload or paste), then:
  1. **Validate**: parse JSON; assert `answers` is an `Answer[]` whose
     `question_id`s exist in `allQuestions`; coerce/validate demographics. On any
     malformed input, reject with a clear, specific error and persist nothing.
  2. **Derive**: call `buildInnerConstitution(...)` on the imported answers.
  3. **Persist**: `saveSession(...)` → a NEW session + demographics row.
  4. **Confirm**: show the new `sessionId` with links to its detail page and a
     reminder of the next step (reset legacy Qs + mint the gap-fill link — both
     already exist; don't rebuild them).
Stamp imported sessions with a provenance `metaSignal` (e.g. `imported_legacy`)
so they're distinguishable in admin — no schema change, just a meta entry.

**T3 — handle partial-import derivation failure (Risk).** Legacy/partial answer
sets may make `buildInnerConstitution` throw (e.g. the non-canonical Jungian
stack path) or produce a thin constitution. The import must NOT 500 and lose the
upload. Preferred: if derivation throws, still persist the session with the
answers and a placeholder/empty constitution + the correct `engine_shape_version`
so the render path's re-derivable branch handles it (confirm `saveSession` or an
import-specific variant can persist that state). Whichever path: a partial
import must end with a saved, openable session, and the report regenerates once
the gap-fill answers arrive. Flag exactly how this case is handled.

## Allowed to modify

- A new `app/admin/sessions/import/` page (+ a small client form component) and a
  new server action / `app/api/admin/...` route for the import.
- `app/admin/sessions/[id]/page.tsx` — add the export "Download JSON" control.
- `lib/saveSession.ts` — ONLY if an import-specific persist variant is needed for
  T3 (e.g. allowing a placeholder constitution); keep the existing `saveSession`
  signature/behavior intact for the normal flow.
- A thin `lib/sessionPortable.ts` (optional) for the shared export/import JSON
  type + validation, so both sides agree on the shape.

Do NOT change the engine/derivation math, the demographics schema, the reset
(CC-136) or follow-up-link mint (they already serve the downstream), or the
public assessment flow.

## Acceptance criteria

1. Export produces a JSON file for a session containing answers + demographics
   (no derived constitution, no rendered report).
2. Importing that exact file creates a NEW session whose report renders and whose
   demographics match the source — a clean round-trip (export A → import →
   new session B with A's answers/demographics).
3. A deliberately PARTIAL answer set imports successfully into an openable session
   (T3) without a 500; report completes after gap-fill. State how derivation
   failure is handled.
4. Malformed/invalid JSON is rejected with a clear error and persists nothing.
5. Imported sessions carry the `imported_legacy` provenance meta signal.
6. `tsc` + lint clean. No schema change. Existing `saveSession` normal-flow
   callers unaffected.

## Flag in report

- The exact portable JSON shape (so the owner can hand-build files for Madison/
  JDrew/LaCinda from the old system if needed).
- How T3 (partial-import derivation failure) was handled.
- Confirmation the normal save flow is unchanged, and the downstream chain
  (reset legacy Qs → mint gap-fill link) works on an imported session as-is.
