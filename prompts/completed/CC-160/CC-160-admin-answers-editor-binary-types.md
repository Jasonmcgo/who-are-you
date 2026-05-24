# CC-160 — Admin answers editor handles binary-format types (fixes the prod crash on Nat's session)

> Live bug: opening `/admin/sessions/<id>/answers` for a **binary-format
> respondent** (post-CC-138) white-screens ("The page couldn't finish loading").
> Reproduced on Nat's session — the first respondent who answered via the binary
> picks. The answers editor predates CC-138 and doesn't handle the binary
> question/answer types.

## Verified root cause

`app/admin/sessions/[id]/answers/page.tsx`:
- `EditorDispatch` only renders on Edit-click (L461), so the white-screen is on
  **initial render** → it's in `ReadOnlyAnswer`.
- `ReadOnlyAnswer` has branches for `single_pick / ranking / ranking_derived /
  freeform / forced / multiselect_derived` — **no safe handling for the
  binary-format answers** (the `binary_pick_derived` ordering answers from
  Q-TB-PERC-ORDER / Q-TB-JUDG-ORDER, and any binary-specific answer shape). An
  unhandled type either falls through to a branch that assumes the wrong shape
  (e.g. mapping `question.items` that's undefined) or returns nothing — and
  something in that path throws, killing the whole page render.
- `EditorDispatch` (L965+) routes anything not ranking/ranking_derived/
  multiselect_derived/freeform to the forced `SinglepickAnswerEditor`, casting the
  question to `ForcedFreeformQuestion` — but `binary_pick` carries `items`, not
  `options`, so editing a Q-TB-* also breaks (the gap CC-148 flagged for "a future
  prompt"). This CC is that prompt.

## Execution mode

Single pass; flag ambiguity. Admin display + edit fix. No engine/derivation/schema
change. **Priority: prod is broken for binary-format respondents.**

## Tasks

**T1 — read: render binary-format answers (no crash).** First, determine the
actual stored answer `type` for `binary_pick` and `binary_pick_derived` questions
(CC-138 routes binary picks through the single-pick path; confirm what the derived
ordering ones store). Then ensure `ReadOnlyAnswer` renders them: show the picked
voice text via the question's `items` (reuse the CC-148 `voiceQuoteFor` helper,
which already handles `binary_pick` items). Add an explicit branch for the
binary-derived ordering answers so their picked order/value displays.

**T2 — fail safe on ANY unhandled type.** Make `ReadOnlyAnswer` end in a defensive
fallback: if no branch matches, render the raw stored value (or a muted "unsupported
answer type" line) — **never throw**. A single unrenderable answer must not
white-screen the entire admin page. (This is the durable guard so the next new
type can't take the page down.)

**T3 — edit: a working editor for binary types.** In `EditorDispatch`, route
`binary_pick` / `binary_pick_derived` to an editor that uses the question's
`items` (a pick-one-of-two control), NOT the forced/freeform `SinglepickAnswerEditor`
that assumes `question.options`. If a full editor is more than this fix warrants,
at minimum make Edit on a binary type a no-op-safe path (don't crash) and flag —
but T1+T2 (read + fail-safe) MUST ship so the page loads.

## Allowed to modify

- `app/admin/sessions/[id]/answers/page.tsx` (ReadOnlyAnswer + EditorDispatch +
  the defensive fallback).
- A small new editor component for binary types if T3 needs one (mirror
  `SinglepickAnswerEditor`'s save contract, but read `items`).

Do NOT change the assessment flow, the engine, the schema, or how binary answers
are stored.

## Acceptance criteria

1. `/admin/sessions/<id>/answers` for a **binary-format session (Nat's)** renders
   fully — no white-screen. Binary picks + the derived ordering answers display
   their chosen voices/values.
2. An intentionally unknown/garbage answer type renders a safe fallback, not a
   crash (prove the fail-safe).
3. Editing a binary-format answer either works (pick-one-of-two via items) or is
   safely inert — never crashes. State which.
4. Existing answer types (ranking, single_pick, forced, freeform, derived) render
   and edit exactly as before. `tsc` + lint clean. No engine/schema change.

## Flag in report

- The actual stored answer type(s) for `binary_pick` / `binary_pick_derived`, and
  which branch each now renders through.
- Whether T3 shipped a real binary editor or a safe-inert path.
- Confirm the fail-safe fallback (T2) so no future answer type can white-screen
  the page again.
