# CC-158 — Respondent demographics: make "Prefer not to say" reversible

> Bug from a real first-time user: on the demographics screen she chose "Prefer
> not to say," then changed her mind — but the screen **locks the first choice and
> won't let her switch to actually answering.** It's a one-way door.

## Verified root cause

`app/components/IdentityAndContextPage.tsx` (the respondent-facing demographics
screen — NOT the admin editor):
- `const isOptOut = state.state === "prefer_not_to_say";` (~L540)
- The field input is conditionally rendered: `{!isOptOut ? renderInput(field, …) : null}` (~L570) — so once `isOptOut` is true, **the answer input disappears entirely.**
- `onOptOut` (~L120) sets `{ state: "prefer_not_to_say" }` one-way; clicking the
  opt-out button again just re-sets the same state. No toggle, no revert.

Net: after tapping "Prefer not to say," the only control left is the opt-out
button, and there's no path back to specifying a value.

## Execution mode

Single pass; flag ambiguity. Small user-facing UI fix. No schema change, no
engine/derivation change. Preserve the field-state semantics
(`specified` / `prefer_not_to_say` / `not_answered`) — only the toggle behavior
changes.

## Tasks

**T1 — make opt-out reversible.** Pick whichever reads cleaner and apply
consistently to every demographic field:
  - **Toggle:** clicking "Prefer not to say" when already opted out reverts the
    field to `not_answered` and re-renders the input (so the respondent can type/
    pick a real value). Show the opt-out control in a clearly-selected state while
    active so it's obvious it can be tapped off.
  - **Or always-render:** keep the input visible even when opted out, with "Prefer
    not to say" as a deselectable choice alongside it.
The required outcome: from a `prefer_not_to_say` state, the respondent can get
back to specifying a value **without reloading or losing other fields.**

**T2 — preserve saved semantics.** Reverting from opt-out should set the field
back to `not_answered` until they enter a value (then `specified`); re-selecting
opt-out sets `prefer_not_to_say`. The save payload mapping (the `buildSubmission`
/ field-state → DemographicAnswer logic, ~L147-158) stays correct for all three
states.

## Allowed to modify

- `app/components/IdentityAndContextPage.tsx` (the `DemographicField` component +
  its opt-out handler).

Do NOT change the admin demographics editor (CC-152), the schema, or the
derivation.

## Acceptance criteria

1. Select "Prefer not to say" on a field, then revert — the input comes back and a
   real value can be entered and saved as `specified`.
2. Re-selecting opt-out after entering a value sets `prefer_not_to_say` and the
   saved payload reflects it.
3. Other fields' values are untouched when toggling one field. `tsc` + lint clean.

## Flag in report

- Which approach was used (toggle vs always-render) and the exact opt-out control
  copy/state.
- Confirm the three-state save mapping still produces correct DemographicAnswers.
