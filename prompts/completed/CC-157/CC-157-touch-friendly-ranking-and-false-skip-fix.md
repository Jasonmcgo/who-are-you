# CC-157 — Touch-friendly ranking (up/down arrows) + stop false "skipped" on engaged rankings

> Two linked, owner-confirmed bugs from a real first-time user on a phone:
> (1) drag-to-reorder doesn't work on mobile, and (2) the assessment told her she
> "skipped" a ranking she actually engaged with. They share a root: the ranking
> can only be answered by *dragging*, drag fails on touch, and CC-134 treats an
> un-dragged ("untouched") ranking as a skip. Owner chose the robust fix:
> **add up/down arrow controls** (tap-based reorder) that work on every device.

## Verified root cause

- `app/components/Ranking.tsx` reorders via Pointer events but sets
  `touch-action: none` **reactively** (`dragId === id ? "none" : "manipulation"`,
  ~L352). On touch the browser claims the first move as a scroll *before* JS sets
  `dragId`, so the drag never engages (pointercancel, not pointermove). Likely no
  `setPointerCapture` either. Net: on mobile you can't reorder at all.
- CC-134 Part A fires `onTouched` only on a deliberate drag/keyboard move; an
  untouched ranking is appended to `skippedQuestionIds` + meta-signaled
  `question_skipped`. So a mobile user who *couldn't* drag — or a desktop user who
  reviewed the order and accepted it without moving anything — is recorded as
  having skipped. That's the false-skip the user saw.

## Execution mode

Single pass; flag ambiguity. UI + interaction-routing fix. No engine math / no
derivation-value change (the lens/type derivation from rank order is unchanged —
only how the order gets *set* and what counts as "answered").

## Tasks

**T1 — add up/down arrow reorder (the robust mobile fix).** In `Ranking.tsx`,
give each item a pair of **▲ / ▼ buttons** that move it one slot (disabled at the
ends). These are real `<button>`s — tappable on touch, keyboard-operable, and
screen-reader-labeled (e.g. "Move 'Truth' up"). Keep the existing drag for
desktop/mouse; arrows are an always-available parallel path, not a replacement.
Min ~44px tap targets.

**T2 — any reorder (arrow OR drag OR keyboard) fires `onTouched`.** Wire the arrow
handlers through the same commit path so `onTouched` fires on the first arrow tap,
exactly as a drag does. This means a mobile user who reorders via arrows is
correctly recorded as having answered.

**T3 — stop the false "skipped" on engaged rankings.** Reconcile with CC-134:
a ranking the respondent **reached and advanced past** should not be surfaced to
the user as "skipped." Two cases to handle:
  - *Reordered* (touched) → answered, as today.
  - *Reached + continued without moving* → treat as **answered (accepted the
    order)**, NOT skipped. Accepting the presented order is a valid answer.
  Preserve CC-134's internal low-confidence signal if it's load-bearing for the
  engine, BUT do not tell the user they skipped it and do not force it into the
  second-pass purely for being unmoved. (If fully separating "internal
  low-confidence" from "user-facing skipped" is larger than expected, STOP and
  flag — at minimum, T1+T2 must ship so mobile users can answer.)

## Allowed to modify

- `app/components/Ranking.tsx` (arrows + onTouched wiring + touch-action on the
  drag handle if you also harden drag).
- `app/assessment/page.tsx` (the untouched→skip routing, for T3) — minimal,
  scoped to the false-skip reconciliation.

Do NOT change the rank→signal derivation, the binary-pick (CC-138) flow, or the
second-pass UI itself.

## Acceptance criteria

1. On a touch device (or emulated touch), a ranking can be fully reordered using
   the arrow buttons — no drag required.
2. Reordering via arrows records the question as answered (fires `onTouched`); it
   does NOT appear in `skippedQuestionIds`.
3. A ranking the respondent reached and advanced past is not reported to the user
   as "skipped" (accepted-order = answered). State exactly how T3 was resolved
   and what, if anything, still routes to the second pass.
4. Drag still works on desktop. `tsc` + lint clean. No derivation-value change.

## Flag in report

- How T3 was reconciled with CC-134 (what now counts as "answered" vs what still
  signals low-confidence internally).
- Confirm arrow reorder fires `onTouched` and a mobile reorder no longer
  false-skips.
- Whether you also hardened drag-on-touch (static touch-action + pointer capture)
  or left drag as desktop-only with arrows carrying mobile.
