# CC-120 — Individual tightening pass (gate secondary sections to Guide-only)

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass.
Do not stop for confirmation between steps. On ambiguity, apply the
canon-faithful interpretation, proceed, and flag it. Permission bypass is
on; the discipline below is scope.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.

## Execution Directive

- One pass, no mid-task confirmation prompts.
- This changes the **Individual** render only (shorter). The **Guide**
  retains everything — nothing is deleted, only gated to Guide-only. The
  superset invariant (`guide-superset-of-individual`) must still hold.
- Re-snapshot the two-tier baseline in a **cold process** (plain `npx tsx`,
  no API key, no warm runtime cache), LAST.

## Context

Real user feedback: the report is **too long and too repetitive** (while
its accuracy is praised). Per `docs/canon/guide-individual-model.md`
(CC-118), length and repetition are *defects in the Individual*, and the
additive Guide (CC-119) makes cutting safe — anything removed from the
Individual is retained verbatim in the Guide. So a "cut" here means **gate
the section/lines to Guide-only** (`renderMode === "clinician"`), not delete.

This CC is the **section-level** tightening pass (deterministic, no LLM
regen). A sibling CC will handle within-prose verbosity (tightening the V3 /
prose-card prompts + regen).

## Sections to gate to Guide-only (editorial proposal — owner may adjust)

These are secondary, diagnostic, or duplicative in the Individual; all have
clear homes and are retained in the Guide:

1. **The second "Next Moves" block** (the one citing `Q-X2`/`Q-A1` retake
   guidance) — duplicates "Your Next 3 Moves" near the top and exposes
   question-IDs (diagnostic). Keep "Your Next 3 Moves"; gate this one.
2. **Conflict Translation** — interpretive/advisory; secondary to the core
   read.
3. **Mirror-Type Seed** — comparative/diagnostic aside.
4. **"What this is good for" / the 10 "earns its keep" items** — long
   appendix. Gate the full list to Guide; if a short version is wanted in
   the Individual, keep only the masthead line ("a read you can return to")
   — flag that choice.
5. **Eight Cards secondary annotations** — within each Mirror card, gate the
   `Movement Note`, `Pattern in motion`, `State vs. shape`, and
   `Correction channel` sub-blocks to Guide-only. Keep each card's core
   (`Strength`, `Growth Edge`, `Practice`, and the lede) in the Individual.
6. **The "A Synthesis" closing tercet** ("To keep a … gift without …") —
   restates the Gifts & Growth Edges table verbatim. Gate the tercet to
   Guide; keep the one-paragraph synthesis read in the Individual.

Do NOT gate: Executive Read, Core Signal Map, Core Pattern, Top Gifts &
Growth Edges, What Others May Experience, When the Load Gets Heavy, Your
Next 3 Moves, Keystone, the Synthesis paragraph, Closing Read, Movement,
Your Grip (prose), Work Map, Love Map, Path — Gait, Open Tensions, the
Eight Cards' cores. These are the Individual's spine.

## Read First (Required)

- `docs/canon/guide-individual-model.md` — the additive contract +
  "length/repetition are Individual defects" principle.
- `lib/renderMirror.ts` — locate each section's emit point; mirror the
  existing `renderMode === "clinician"` gating pattern (CC-114/115/117/119).
- `app/components/InnerConstitutionPage.tsx` — the React render of the same
  sections (gate identically so the on-screen Individual matches).
- `tests/audit/twoTierRenderSurfaceCleanup.audit.ts` — the
  `guide-superset-of-individual` + `guide-mode-snapshot-stable` assertions.
- `tests/audit/twoTierBaseline.snapshot.ts` — re-snapshot LAST, cold.

## Tasks

1. Gate sections 1–6 above to `renderMode === "clinician"` in **both**
   `renderMirror.ts` and `InnerConstitutionPage.tsx`. Individual suppresses
   them; Guide retains them in place.
2. Confirm the **Guide is unchanged** (it still emits every section) and the
   **superset invariant holds** (Individual ⊆ Guide).
3. Re-snapshot `twoTierBaseline.snapshot.json` in a cold process, LAST. (The
   Guide snapshot is unchanged by this CC; the Individual is shorter.)
4. Report the Individual word-count / line-count before vs after per cohort
   fixture (target: a substantial reduction — aim ~25–40%).

## Allowed to Modify (exhaustive)

- `lib/renderMirror.ts`
- `app/components/InnerConstitutionPage.tsx`
- `tests/audit/twoTierBaseline.snapshot.json` (re-snapshot, cold, last)

Nothing else. No engine/derivation change, no prose-content rewrite, no LLM
prompt change, no cache regen, no deletion of any section from the Guide.

## Out of Scope

- Within-prose verbosity / cadence tightening of the warm rewrites (V3 /
  prose-card prompt tuning + regen) — sibling CC.
- Deleting content outright (everything stays in the Guide).
- Renaming internal `renderMode` values.
- The prose-rewrites cache backfill for the goal-soul-give fallbacks.

## Bash Commands Authorized

- `npx tsc --noEmit`, `npm run lint`
- the two-tier + react-surface audits
- `grep` / `sed` / a one-off cold render of both modes for a fixture to diff
  + word-count

## Acceptance Criteria

1. `npx tsc --noEmit` clean; `npm run lint` clean (pre-existing warnings ok).
2. Individual render no longer contains sections 1–6; **Guide still
   contains all of them** in place.
3. `guide-superset-of-individual` passes (Individual ⊆ Guide).
4. `guide-mode-snapshot-stable` passes after a **cold** re-snapshot (Guide
   output unchanged by this CC — verify the Guide diff is empty; only the
   Individual shrank).
5. Measured Individual word-count reduction reported per fixture (target
   ~25–40%).
6. React Individual matches the markdown Individual (same sections gated).
7. No file outside the Allowed-to-Modify list edited.

## Report Back

- Which sections were gated + the emit-point line for each (markdown + React).
- Individual before/after word-count per cohort fixture + the average % cut.
- Confirmation the Guide is byte-unchanged (superset holds; snapshot stable).
- Any section where gating was ambiguous or risky (flag for owner review).
- Any ambiguity decision.
