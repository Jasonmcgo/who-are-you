# Design Prototype — Reference Files

This directory holds the reference prototype produced by the Anthropic Design Lab. It is **not production code** — the Next.js app in `app/` is the production target. These files exist as a pixel-faithful and interaction-faithful reference for translating the spec into CC prompts.

Per `docs/design-spec-v2.md` § 5–10, the prototype is React via Babel + a single CSS file. The production stack is Next.js + Tailwind. Translation between the two is a CC author's decision; do not lift the prototype code wholesale.

## Files present

The design lab's prototype bundle delivered seven files. All are byte-for-byte verbatim from the lab's handoff archive (`docs/Who are you_design.zip`).

- `Who Are You.html` — page structure, working canvas of every screen at desktop and mobile widths. Drag-to-reorder is real (pointer-events), so the prototype demonstrates the ranking primitive end-to-end.
- `components.jsx` — shared UI primitives. Contains `ProgressBar`, `ArtboardHead`, three ranking variants (`RankingA`, `RankingB`, `RankingC`) the lab built to compare, `QuestionPage` (the question shell), `ConstitutionPage` (the Inner Constitution artifact), plus question data shapes (`Q_S1`, `Q_S2`, `Q_X3`, `Q_C4`, `Q_T1`) and small `SectionTitleSwatch` / `ChipTreatmentSwatch` swatches for the open-call illustrations.
- `styles.css` — every CSS variable, class, and token referenced in `docs/design-spec-v2.md`.
- `design.md` — the canonical spec the lab worked from. Byte-identical to `docs/design-spec-v2.md`; preserved here per the lab's handoff intent so this directory matches what the lab shipped.
- `design-canvas.jsx` — the lab's canvas-rendering harness for the prototype. Reference only; not for production translation.
- `tweaks-panel.jsx` — the lab's live-tweaks panel for design adjustment. Reference only; not for production translation.
- `LAB-README.md` — the design lab's handoff README. Renamed from `README.md` to avoid colliding with this project-side README. Useful for understanding the lab's framing of the handoff.

## How CC prompts should reference these

Each CC prompt that translates a piece of the spec into Next.js code should:

1. Read `docs/design-spec-v2.md` for canonical visual + interaction specification.
2. Open the relevant prototype file in this directory as a pixel reference.
3. Implement against the production stack (Next.js, Tailwind, the existing `app/` structure), not by porting prototype code.
4. Where the spec and the prototype disagree, the spec wins.
5. Where the spec is silent and the prototype shows a behavior, treat the prototype as the design lab's intended default and call out the inference in the report-back so it can be canonized if approved.

## Status

- 2026-04-24: directory created alongside `docs/design-spec-v1.md` (later superseded by v2 after body-map reconciliation).
- 2026-04-25: design lab delivered the prototype bundle as a zip. All seven files placed in this directory verbatim. Source archive retained at `docs/Who are you_design.zip` for provenance.

## Not in scope

- Production code lives in `app/`, `lib/`, `data/` — not here.
- The spec lives in `docs/design-spec-v2.md` — not here.
- This directory is reference-only. Nothing here is shipped.
