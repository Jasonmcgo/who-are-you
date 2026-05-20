# CC-116 — Recitation sweep (apply the CC-112 canon to the remaining composers)

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass.
Do not stop for confirmation between steps. On ambiguity, apply the
canon-faithful interpretation, proceed, and flag it. Permission bypass is
on; the discipline below is scope.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.

## Execution Directive

- One pass, no mid-task confirmation prompts.
- This CC **intentionally changes engine prose** (like CC-112). The
  clinician baseline WILL change and must be re-snapshotted, with the diff
  shown for review. Engine stays the source of substance — we change how
  findings are *stated*, not the findings.

## Context

CC-112 added the canon principle **"Interpretation over recitation"** to
`docs/canon/result-writing-canon.md` and fixed the Keystone composer. The
same input-echo pattern — counting/listing the user's selections instead of
saying what they mean, plus "the user / your selections" framings and the
repetitive cadence — still lives in several other composers. This CC applies
the existing canon to those remaining sites. No new canon needed; enforce
the one CC-112 ratified.

## Target sites (verify exact lines before editing)

1. **Compass "the N values you ranked highest"** — `lib/identityEngine.ts`
   ~L3768 and ~L6410–6418 (`return \`the ${labels.length} values you ranked
   highest\``). A count of selections used as a phrase. Replace with a
   reading of what those values *do* together, not a tally.
2. **Allocation tension prompts** — `lib/identityEngine.ts` ~L1326, L1342,
   L1350 ("Across multiple allocation domains, you marked categories where
   the current flow doesn't match what you wish", "When you ranked X, you
   marked at least two categories…"). Re-state as what the gap *means*, not
   "you marked categories".
3. **Open Tensions descriptions** — `lib/identityEngine.ts` ~L940 ("The
   user may experience tension when…") and sibling tension description
   strings. Two faults: third-person "The user" (→ second person) and
   recitation framing. Make them second-person and meaning-first.
4. **Revision-source / cost tally** — `lib/beliefHeuristics.ts` ~L456–479
   (and any sibling "Of the {offered}… marked None/one/two/{n} ({list})…"
   still emitting a count). CC-112 reworded the qi3 cost-surface and the
   value/posture lines; confirm the qi2 revision-source family is also
   meaning-first and not a counted tally. Finish any that remain.
5. **UseCases "the gravity you ranked highest"** — `app/components/
   UseCasesSection.tsx` (verify; the same recitation pattern in the
   "earns its keep" copy). Re-state as meaning.

For each: state what the *pattern* reveals; weave specific values/costs
into prose only where they carry meaning the reader can't already infer
from having answered; never enumerate as a count; vary cadence (no adjacent
sentences sharing an opener); second person, no "the user".

## Read First (Required)

- `docs/canon/result-writing-canon.md` — the "Interpretation over
  recitation" section (added by CC-112) — the contract to enforce.
- `docs/canon/keystone-reflection-rules.md` — CC-112's worked example of
  the rewrite pattern (use as the model for tone).
- `lib/identityEngine.ts` — the five-ish composer sites above (grep the
  quoted strings to pin exact current lines; line numbers drift).
- `lib/beliefHeuristics.ts` — the revision-source tally family.
- `app/components/UseCasesSection.tsx` — the gravity-ranking copy.
- `tests/audit/twoTierBaseline.snapshot.json` + `twoTierRenderSurfaceCleanup*.ts`
  — the clinician baseline this CC re-snapshots.
- `tests/audit/proseRegister.audit.ts` — note (do not fix) that this CC,
  like CC-112, shifts engine prose and thus the LLM cache keys for affected
  sections.

## Tasks

1. Rewrite each target site to interpretation-over-recitation per the canon
   (see "Target sites"). Match the CC-112 register.
2. Kill any remaining third-person "the user / {name} marked / {name} would
   bear" leakage in these composers — second person throughout the
   reflective prose.
3. Re-snapshot `twoTierBaseline.snapshot.json`; show the per-fixture diff in
   the Report Back and confirm the changes are confined to the targeted
   sections (Compass / Allocation tensions / Open Tensions / belief
   revision-source / UseCases) — no collateral drift.

## Allowed to Modify (exhaustive)

- `lib/identityEngine.ts`
- `lib/beliefHeuristics.ts`
- `app/components/UseCasesSection.tsx`
- `tests/audit/twoTierBaseline.snapshot.json` (regen; show diff)
- any audit whose anchor strings break on these intentional prose changes
  (anchor refresh only — flag each, as CC-112 did with synthesis1a /
  keystone audits)

Nothing else. No new canon, no derivation/score changes, no React report
suppression (that's CC-117), no markdown-renderer changes.

## Out of Scope

- Adding new canon (the principle already exists).
- The grip narrative's labeled format (separate `gripTaxonomyLlm.ts` CC).
- React report / admin preview (CC-117).
- Cohort cache regeneration (planned separately, after this lands).
- Any change to scores, signals, or derivation.

## Bash Commands Authorized

- `npx tsc --noEmit`, `npm run lint`
- the two-tier + relevant audits
- `grep` / `sed` / `rg` read-only verification
- a one-off render of 2–3 fixtures (incl. one with allocation tensions and
  one with Open Tensions) in both modes to eyeball before/after

## Acceptance Criteria

1. `npx tsc --noEmit` clean; `npm run lint` clean (pre-existing warnings ok).
2. Across the targeted sections, these no longer appear as recitation:
   "you marked", "the N values you ranked highest" (as a tally), "the user
   may", "{name} marked / would bear", "your selections place". Prove via
   before/after on fixtures that exercise each site.
3. The same findings are still present — stated as meaning, second person,
   varied cadence (no adjacent-sentence opener repetition).
4. The clinician baseline is re-snapshotted; the diff is confined to the
   targeted sections (no collateral drift elsewhere).
5. No file outside the Allowed-to-Modify list edited.

## Report Back

- Per-site before/after (Compass phrase, allocation tension, Open Tensions
  description, belief revision-source, UseCases gravity line).
- The baseline diff scope (which sections/fixtures changed — confirm only
  the targeted ones).
- Any audit anchor refreshes (flagged).
- **Cache note:** which sections' LLM cache keys shifted (engineSectionBody
  changes) and whether `proseRegister` is affected — for the planned
  post-sweep cohort cache regen.
- Any site you found but left out of scope.
