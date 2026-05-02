# CC-022d — Design Drop v2 (file moves only)

**Type:** Design-asset drop. **No application code changes.**
**Goal:** Land the body-map design package (spec, eight card SVGs, reference prototype) in the repo so subsequent CCs can reference paths instead of attached files.
**Source:** `docs/design_handoff_v2/` bundle (already present in the repo).
**Successor:** **CC-022e** — wire the SVGs into MapSection (full size) and QuestionShell (small icons inline with kicker), per the design directive at `docs/design/eight-cards-design-directive.md` and the sizing guidance in `docs/design_handoff_v2/README.md`.

---

## Scope

This CC moves files into the repo. It does **not** modify any app code, types, data, components, styles, tests, or build configuration. If a step would touch any of those, stop and flag.

## Inputs

The Design Lab's `design_handoff_v2/` bundle is already in the repo at `docs/design_handoff_v2/` with these files (paths relative to the bundle root):

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

## Steps

1. **Spec.** Copy `docs/design_handoff_v2/docs/design-spec-v2.md` to `docs/design-spec-v2.md`. Leave `docs/design-spec-v1.md` in place (history); add a top note to v1 that says: `> Superseded by docs/design-spec-v2.md (2026-04-26).`

2. **Card SVGs.** Create `public/cards/` if it does not exist. Copy all eight SVGs from `docs/design_handoff_v2/public/cards/` to `public/cards/`. Verify the count is 8 and filenames match exactly (numeric prefix + kebab-case slug + `.svg`).

3. **Reference prototype.** Create `docs/design/reference/` if it does not exist. Copy all four files from `docs/design_handoff_v2/docs/design/reference/` to `docs/design/reference/`. Add a `README.md` in `docs/design/reference/` that says, verbatim:

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
   - `npx tsc --noEmit` still exits 0.
   - `npm run lint` still passes.

6. **Do not delete the bundle.** Leave `docs/design_handoff_v2/` in place as the source-of-truth archive. Future bundle drops (v3, v4) land at sibling paths (`design_handoff_v3/`, etc.); this CC's targets stay copied into their canonical positions.

## Out of scope

- Wiring the SVGs into `MapSection.tsx` — that's CC-022e.
- Inlining icon variants into `QuestionShell.tsx` — also CC-022e.
- Extending `Question` types with a `ranking` variant — already done in earlier CCs (CC-006/CC-007 era); not needed.
- Updating `data/questions.ts` with locked option glosses — already done; not needed.
- Implementing `<RankingQuestion>` — already done (`app/components/Ranking.tsx`); audit deferred to a later CC.
- Building card-opener screens — out of scope per Jason's call (no openers; SVGs land in Map + survey screens only).
- Wiring the Inner Constitution page to spec §10 — that's a future CC.

If you find yourself editing anything outside `docs/`, `public/cards/`, or this prompt's targets, stop and flag.

## Acceptance

- `docs/design-spec-v2.md` exists and is identical to the bundle copy.
- `public/cards/` contains exactly 8 SVGs, named `01-lens-eyes.svg` through `08-path-gait.svg`.
- `docs/design/reference/` contains 4 files plus the new README.
- `docs/design-spec-v1.md` carries a "Superseded" notice at the top with the 2026-04-26 date.
- `git diff --stat` against pre-CC head shows additions only (modulo the v1 supersede note).
- `npx tsc --noEmit` exits 0. `npm run lint` passes. Build still succeeds.
- The `docs/design_handoff_v2/` bundle is left in place (not deleted, not moved).

## Notes for the executing engineer

- This is **purely file moves**. No code changes. If a step would touch app code, stop and surface — that means the spec is wrong or the project state has shifted.
- The SVGs are v1 — not design-approved. Conviction · Voice and Fire · Immune Response are the most likely to be revised. When alternates land, drop them in `public/cards/` with the same filenames; this CC's contract holds.
- The bundle README at `docs/design_handoff_v2/README.md` was authored before the project's full state was known to the design lab. Its proposed CC sequence (CC-A through CC-F) maps imperfectly against the actual codebase — much of CC-B and CC-C is already done. The actual sequencing is documented in chat conversation; this CC implements only CC-A (file moves).
- Browser smoke deferred to Jason after the CC lands — visual verification of the bundle's contents in canonical paths is not engine-verifiable.
