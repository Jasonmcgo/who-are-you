# CC-118 — Guide / Individual additive model (canon + rename)

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass.
Do not stop for confirmation between steps. On ambiguity, apply the
canon-faithful interpretation, proceed, and flag it. Permission bypass is
on; the discipline below is scope.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.

## Execution Directive

- One pass, no mid-task confirmation prompts.
- This CC is **canon + naming only** — it writes the principle and renames
  the admin toggle's display labels. It does NOT change render logic
  (that's CC-119). No engine/derivation/prose change.

## Context

The two report modes are currently named "clinician" and "user". The owner
wants better product terms and, more importantly, a clear architectural
principle for how the two modes relate. Today the relationship is
backwards: the "clinician" render returns cold engine prose while "user"
gets the warm rewrites — so prose investments land only in the user view
and the clinician view never inherits them. The intended model is
**additive**.

Real user feedback also reports the Individual report is **too long and too
repetitive** (while praising its accuracy). The additive model is what makes
fixing that safe: the Individual can be cut hard because the Guide retains
everything cut.

## Canon to establish

Create `docs/canon/guide-individual-model.md` with these binding principles:

1. **Two views, one read.** "Individual" and "Guide" are the same
   underlying read. The Guide is never a different or more severe verdict —
   only the same read with more explanation.
2. **Individual = the canonical, reader-facing report.** All prose
   investment and refinement target the Individual. It is the product.
3. **Guide = Individual + additive scaffolding.** The Guide is a strict
   **superset** of the Individual: every line in the Individual appears in
   the Guide, plus diagnostic scaffolding (signal logic, scores, inferred
   values, grip components, confidence, surface labels, provenance). The
   Guide inherits Individual improvements automatically — it never carries
   its own colder copy.
4. **Length and repetition are defects in the Individual.** The Individual
   is tightened ruthlessly — shorter, de-duplicated, punchier. Cut material
   is not lost: it lives in the Guide (the "junk drawer"). Cutting from the
   Individual never destroys information because the Guide retains it.
5. **Audience.** Individual = the person who took the assessment. Guide =
   whoever helps them interpret it (coach, therapist, pastor, mentor,
   facilitator, trusted friend) and internal QA/engine review. Not a
   medical/clinical designation.
6. **Naming.** Display label "Individual" maps to the internal `renderMode`
   value `"user"`; "Guide" maps to `"clinician"`. The internal strings are
   retained for now (renaming them would churn audits + baselines that key
   on them); this doc is the authoritative mapping.

## Read First (Required)

- `docs/canon/` — existing canon docs for format/tone (e.g.
  `result-writing-canon.md`, the two-tier comments in `lib/renderMirror.ts`).
- `app/admin/sessions/[id]/page.tsx` — the toggle (`AdminExportPanel`,
  ~L184–193 maps over `["clinician","user"]` to render the labels; the
  `previewMode` state ~L322).

## Tasks

1. Create `docs/canon/guide-individual-model.md` with the six principles
   above.
2. In the admin toggle, render the **display labels** as "Guide" (for
   `"clinician"`) and "Individual" (for `"user"`). Keep the internal
   `renderMode` values and all logic exactly as-is — only the visible button
   text changes. Use a small label map; do not rename the `previewMode`
   type or values.
3. Update the nearby `// CC-REACT-USER-MODE-PARITY` / two-tier comments that
   say "clinician"/"user" in user-facing-ish copy to note the Guide/
   Individual display mapping (comments only; no logic).

## Allowed to Modify (exhaustive)

- `docs/canon/guide-individual-model.md` (new)
- `app/admin/sessions/[id]/page.tsx` (toggle display labels + comments only)

Nothing else. No `renderMode` value rename, no render-logic change, no
engine/prose change, no audit edits.

## Out of Scope

- The render restructure that makes the Guide actually additive (CC-119).
- Any prose tightening of the Individual (later CC, after additive lands).
- Renaming internal `renderMode` string values.

## Bash Commands Authorized

- `npx tsc --noEmit`, `npm run lint`
- `npm run dev` to confirm the toggle reads "Guide | Individual"
- `grep` / `rg` read-only verification

## Acceptance Criteria

1. `npx tsc --noEmit` clean; `npm run lint` clean (pre-existing warnings ok).
2. `docs/canon/guide-individual-model.md` exists with the six principles.
3. The admin toggle displays "Guide" and "Individual"; internal `renderMode`
   values are unchanged (`"clinician"`/`"user"`) — grep proves the values
   and the type are untouched.
4. No render/engine/audit behavior changed (no other files edited).

## Report Back

- The canon doc path + a one-line summary of each principle captured.
- The label-map change + confirmation internal values are untouched.
- Any ambiguity decision.
