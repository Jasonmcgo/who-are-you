# CC-XXX — Design drop v2 (file moves only)

**Type:** Design-asset drop. **No application code changes.**
**Goal:** Land the body-map design package (spec, eight card SVGs, reference prototype) in the repo so subsequent CCs can reference paths instead of attached files.
**Predecessor:** Design Lab — `design_handoff_v2/` bundle.
**Successor:** CC-(next) — extend `Question` type with `ranking` variant and update `data/questions.ts` with locked option glosses.

---

## Scope

This CC moves files into the repo. It does **not** modify any app code, types, data, components, styles, tests, or build configuration. If a step would touch any of those, stop and flag.

## Inputs

The Design Lab has provided a `design_handoff_v2/` bundle with these files (paths relative to the bundle root):

- `docs/design-spec-v2.md`
- `public/cards/01-lens-eyes.svg`
- `public/cards/02-compass-heart.svg`
- `public/cards/03-conviction-voice.svg`
- `public/cards/04-gravity-spine.svg`
- `public/cards/05-trust-ears.svg`
- `public/cards/06-weather-nervous-system.svg`
- `public/cards/07-fire-immune-response.svg`
- `public/cards/08-path-gait.svg`
- `docs/design/reference/Who Are You.html`
- `docs/design/reference/components.jsx`
- `docs/design/reference/styles.css`
- `docs/design/reference/Body-Map Cards.html`

The bundle is either present at the repo root (unzipped from the lab) or attached to this prompt.

## Steps

1. **Spec.** Copy `design_handoff_v2/docs/design-spec-v2.md` to `docs/design-spec-v2.md`. Leave `docs/design-spec-v1.md` in place (history); add a top note to v1 that says `> Superseded by docs/design-spec-v2.md (YYYY-MM-DD).`

2. **Card SVGs.** Create `public/cards/` if it does not exist. Copy all eight SVGs from `design_handoff_v2/public/cards/` to `public/cards/`. Verify the count is 8 and filenames match exactly (numeric prefix + kebab-case slug + `.svg`).

3. **Reference prototype.** Create `docs/design/reference/` if it does not exist. Copy all four files from `design_handoff_v2/docs/design/reference/` to `docs/design/reference/`. Add a `README.md` in `docs/design/reference/` that says, verbatim:

   ```markdown
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
   ```

4. **Update `.gitattributes` / linters if needed.** The prototype files use non-standard JSX (loaded via inline Babel) and are inside `docs/`. Confirm:
   - ESLint, Prettier, TypeScript do not lint files under `docs/design/reference/`. If they do, add `docs/design/reference/` to the relevant ignore lists.
   - The Next.js build does not pick these up. (It shouldn't — `docs/` is outside `app/`. Verify and stop if it does.)

5. **Sanity checks before commit.**
   - `git status` shows additions only — no modifications to existing source files (`app/`, `components/`, `lib/`, `data/`, `package.json`, `tsconfig.json`, etc.).
   - `npm run build` (or equivalent) still succeeds and produces the same output as before this CC.
   - `npm test` (if present) still passes.

6. **Commit.** Single commit, message:

   ```
   design: drop v2 — body-map cards, spec, prototype reference

   - docs/design-spec-v2.md (supersedes v1)
   - public/cards/*.svg (8 body-map cards)
   - docs/design/reference/* (read-only design reference)

   Asset + docs only. No app code changes.
   ```

## Out of scope

- Extending `Question` types with a `ranking` variant — next CC.
- Updating `data/questions.ts` with locked option glosses — next CC.
- Implementing `<RankingQuestion>` — separate CC.
- Building card-opener screens that render the SVGs — separate CC.
- Wiring the Inner Constitution page — separate CC.

If you find yourself editing anything outside `docs/`, `public/cards/`, or this prompt's targets, stop and flag.

## Acceptance

- `docs/design-spec-v2.md` exists and is identical to the bundle copy.
- `public/cards/` contains exactly 8 SVGs, named `01-lens-eyes.svg` through `08-path-gait.svg`.
- `docs/design/reference/` contains 4 files plus the new README.
- `docs/design-spec-v1.md` carries a "Superseded" notice at the top.
- `git diff --stat` against pre-CC head shows additions only (modulo the v1 supersede note).
- Build still succeeds. Tests still pass.

## Notes for the design lab

- The SVGs are v1 — not design-approved. Conviction · Voice and Fire · Immune Response are the most likely to be revised. When alternates land, drop them in `public/cards/` with the same filenames; this CC's contract holds.
- The spec leaves a few questions open (§13). Card-opener CC should not begin until they're closed.
