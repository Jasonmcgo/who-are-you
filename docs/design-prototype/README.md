# Design Prototype — Reference Files

This directory holds the reference prototype produced by the Anthropic Design Lab. It is **not production code** — the Next.js app in `app/` is the production target. These files exist as a pixel-faithful and interaction-faithful reference for translating the spec into CC prompts.

Per `docs/design-spec-v1.md` § 10, the prototype is React via Babel + a single CSS file. The production stack is Next.js + Tailwind. Translation between the two is a CC author's decision; do not lift the prototype code wholesale.

## Expected files

The design lab's prototype project produced three files. When you receive them, drop them here:

- `Who Are You.html` — page structure, working canvas of every screen at desktop and mobile widths. Drag-to-reorder is real (pointer-events), so the prototype demonstrates the ranking primitive end-to-end.
- `components.jsx` — React components: `RankingA` (the ranking primitive), `QuestionPage` (the question shell), `ConstitutionPage` (the Inner Constitution artifact), plus example question data shapes.
- `styles.css` — every CSS variable, class, and token referenced in `docs/design-spec-v1.md`.

## How CC prompts should reference these

Each CC prompt that translates a piece of the spec into Next.js code should:

1. Read `docs/design-spec-v1.md` for canonical visual + interaction specification.
2. Open the relevant prototype file in this directory as a pixel reference.
3. Implement against the production stack (Next.js, Tailwind, the existing `app/` structure), not by porting prototype code.
4. Where the spec and the prototype disagree, the spec wins.
5. Where the spec is silent and the prototype shows a behavior, treat the prototype as the design lab's intended default and call out the inference in the report-back so it can be canonized if approved.

## Status

This directory was created 2026-04-24 alongside `docs/design-spec-v1.md`. Reference files are not yet in place. Once they're added, this README's "Expected files" section becomes a manifest of what's present.

## Not in scope

- Production code lives in `app/`, `lib/`, `data/` — not here.
- The spec lives in `docs/design-spec-v1.md` — not here.
- This directory is reference-only. Nothing here is shipped.
