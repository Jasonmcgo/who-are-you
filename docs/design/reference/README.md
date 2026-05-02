# Design Reference — Read Only

This folder contains the Design Lab's reference prototype for "Who Are You?".

**Do not import, transpile, or build any file in this folder into the application.**
These files exist to document the visual system, ranking interaction, and Inner
Constitution layout. The production implementations live in `app/`, `components/`,
and `lib/` and are guided by `docs/design-spec-v2.md`.

- `Who Are You.html` — hi-fi prototype canvas (Sacred Values, five-item rankings,
  Temperament, Inner Constitution).
- `components.jsx` — single-file React reference for the ranking primitive and
  question / artifact pages. Demonstrates state shape and drag-drop semantics.
- `styles.css` — design tokens (paper/ink/umber palette, type scale, ranking row
  styles, Inner Constitution layout). Translate values into Tailwind tokens or
  CSS modules; do not link this file from the app.
- `Body-Map Cards.html` — contact sheet displaying the eight body-map SVGs as a
  family.
