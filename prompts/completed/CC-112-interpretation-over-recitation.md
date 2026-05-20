# CC-112 — Interpretation over recitation (Keystone / belief composers + canon)

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass.
Do not stop for confirmation between steps. On genuine ambiguity, apply the
canon-faithful interpretation, proceed, and flag it in the Report Back.
This session runs with permission bypass; the discipline below is scope,
not permission.

## Launch Directive

`claude --dangerously-skip-permissions`, or in-session `/permissions` →
bypass. `.claude/settings.local.json` already sets bypass by default.

## Execution Directive

- One pass, no mid-task confirmation prompts.
- This CC **intentionally changes engine prose** (a deliberate exception to
  the usual clinician-byte-identical rule). The clinician baseline WILL
  change and must be re-snapshotted as part of this CC, with the diff shown
  in the Report Back for human review.
- The engine stays the source of substance. We are changing *how a finding
  is stated* (interpret, don't recite), not inventing new findings.

## The problem

The Keystone Reflection / belief composers state findings by **reciting the
user's inputs back to them** — counting and listing what they selected —
instead of saying what those selections *mean*. Example (real output):

> "Your selections place this belief inside Family, Stability, Knowledge,
> and Peace, with Stability as the value most directly at risk for it. Of
> the five stakes Keith ranked highest, Keith marked 4 (Close
> relationships, Reputation, Money / Wealth, and Job / Career) as concrete
> costs Keith would bear for this belief — a wide cost surface. Your shape
> places this belief inside what you protect, not outside it."

Three faults:
1. **Recitation, not interpretation.** "you marked 4 of the 5 stakes",
   "your selections place", a listed tally — the reader already knows what
   they picked. The report must translate the *pattern* into meaning (what
   does a wide cost surface across relationships, reputation, money, and
   career *reveal*?), not echo the mechanics of the input.
2. **Repetitive cadence.** "Your selections place… / you marked… / Your
   shape places…" — the same sentence shape three times.
3. **Audience leakage.** The `name ? "${name} marked" : "you marked"`
   ternary emits "Keith marked / Keith would bear" in clinician mode — a
   third-person clinical voice bleeding into a reflective section.

## Exact source sites (verified)

- `lib/beliefHeuristics.ts`
  - L232 — `Your selections place this belief inside {values}, with {X} as
    the value most directly at risk for it.`
  - L280 — `Your shape places this belief inside what you protect, not
    outside it.`
  - L456–479 — revision-source tally (`Of the {offered}… marked None/one/
    two/{n} ({list})…`).
  - L487–541 — cost-surface tally (`Of the {offered}… {name} marked {n}
    ({list}) … — a wide cost surface.`) incl. the `name ?` ternary.
- `lib/keystoneFallback.ts` L29–68 — the same patterns in the fallback
  composer (`Your selections place this belief inside {list}.`, `You marked
  {list} as concrete costs you would bear for it — a wide cost surface.`).
- `lib/keystoneRewriteLlm.ts` — the LLM warmth pass. Rule 3 already says
  "fold values into prose, do not list as a metadata row"; it needs an
  explicit anti-recitation + vary-cadence rule so the warm layer can't
  reintroduce the tally.

## Read First (Required)

- `docs/canon/keystone-reflection-rules.md` — the section's canon.
- `docs/canon/result-writing-canon.md` — cross-cutting writing canon (home
  for the general principle).
- `docs/canon/humanity-rendering-layer.md` + `output-engine-rules.md` — the
  engine-derives / polish-only boundary, so the principle is stated
  consistently.
- `lib/beliefHeuristics.ts` (the functions composing the sites above).
- `lib/keystoneFallback.ts`, `lib/keystoneRewriteLlm.ts`.
- `tests/audit/twoTierRenderSurfaceCleanup*.ts` + `twoTixxBaseline`/
  `twoTierBaseline.snapshot.json` — the baseline this CC re-snapshots.
- `tests/audit/proseRegister*.ts` — note cache implications (below).

## Canon principle to add

In `result-writing-canon.md` (general) and applied in
`keystone-reflection-rules.md` (specific), add:

> **Interpretation over recitation.** The report translates the user's
> selections into meaning; it never recites the mechanics of their input.
> Forbidden: counts of what they selected ("you marked N of M", "the N
> values you ranked highest" as a tally), listing selections as evidence of
> themselves, and "your selections place / your shape places" framings that
> narrate the act of choosing. State what the *pattern* reveals. A list is
> allowed only when it carries new meaning the reader can't already infer
> from having answered. Vary sentence cadence — never repeat the same
> opener across adjacent sentences.

## Tasks

1. **Canon.** Add the principle above to `result-writing-canon.md` and a
   keystone-specific application in `keystone-reflection-rules.md`.
2. **Rewrite the belief/keystone composers** (`beliefHeuristics.ts`,
   `keystoneFallback.ts`) so each site interprets instead of reciting:
   - Cost surface: instead of "Of the five stakes you ranked highest you
     marked 4 (…) — a wide cost surface", derive what the *breadth* means
     (e.g., a belief one would pay for across relationships, reputation,
     money, and livelihood is load-bearing, not ornamental — it sits at the
     center of what's protected). Keep the specific costs only where they
     add meaning, woven into the sentence, not as a counted tally.
   - Value cluster: replace "Your selections place this belief inside {X}"
     with an interpretation of what holding the belief inside those values
     does to it (this is what Rule 3 of the LLM prompt already gestures at
     — bring the engine layer in line).
   - Remove the repeated "places this belief" cadence; vary openers.
3. **Kill the audience leakage.** Drop the `name ? "${name} marked"` third-
   person form; the reflective voice is second person ("you") in both
   modes for these sentences (the clinician/diagnostic *metadata* row, if
   any, stays clinician-only — but the reflective prose is not where the
   name belongs).
4. **Harden the LLM prompt.** Add an explicit rule to `keystoneRewriteLlm.ts`:
   no recitation of selection counts/lists; translate to meaning; vary
   cadence. (Extends existing Rule 3.)
5. **Re-snapshot the clinician baseline.** Because engine prose changed,
   regenerate `twoTierBaseline.snapshot.json` for the affected fixtures and
   include the before/after prose diff in the Report Back. Do NOT blindly
   overwrite — show the diff and confirm it's the intended change only.

## Allowed to Modify (exhaustive)

- `lib/beliefHeuristics.ts`
- `lib/keystoneFallback.ts`
- `lib/keystoneRewriteLlm.ts`
- `docs/canon/result-writing-canon.md`
- `docs/canon/keystone-reflection-rules.md`
- the two-tier baseline snapshot file (regen only; show diff)

Nothing else. In particular, do NOT touch the Compass "the N values you
ranked highest" helper (`identityEngine.ts:3768/6410`), the allocation
tension prompts (`identityEngine.ts:1326/1342/1350`), the Open Tensions
descriptions, or any other section — those are the follow-up recitation
sweep (separate CC).

## Out of Scope

- The broader recitation sweep across Compass / Stakes / Allocation /
  Open Tensions (named follow-up).
- Warm vs. clinician voice mechanics beyond the name-ternary fix here.
- Any new finding, score, or derivation change.
- PDF, toggle, telemetry-panel suppression.

## Bash Commands Authorized

- `npx tsc --noEmit`, `npm run lint`
- the two-tier + keystone audits
- `grep` / `sed` / `rg` read-only verification
- a one-off render of the Keystone section for 2–3 fixtures (incl. the
  belief-bearing one) in both modes to eyeball before/after (don't commit it)

## Acceptance Criteria

1. `npx tsc --noEmit` clean; `npm run lint` clean (pre-existing warnings ok).
2. The Keystone Reflection for a belief-bearing fixture **no longer
   contains**: "you marked", "{name} marked", "your selections place",
   "{name} would bear", "ranked highest" (as a tally), or "a wide cost
   surface" stated as a count. Prove via before/after.
3. The same finding is still present — stated as **meaning** (the belief is
   load-bearing / central to what's protected), not as a recited tally.
4. No two adjacent sentences in the section share the same opener.
5. No third-person name leakage in the reflective prose in either mode.
6. The clinician baseline is re-snapshotted; the diff shown contains ONLY
   the intended Keystone/belief prose changes (no collateral drift in other
   sections).
7. `keystoneRewriteLlm.ts` carries the explicit anti-recitation/vary-cadence
   rule.
8. No file outside the Allowed-to-Modify list edited.

## Report Back

- Before/after Keystone prose for the belief-bearing fixture, both modes.
- The canon text added (both files).
- The baseline diff scope (which fixtures/sections changed — confirm only
  Keystone/belief).
- **Cache note:** changing the engine `engineSectionBody` changes the
  keystone LLM cache key, so committed keystone rewrites will miss until
  regenerated. State whether you regenerated them or left them to re-resolve
  live, and whether `proseRegister` is affected.
- The LLM-prompt rule added.
- Follow-up: the recitation sweep targets you saw but left out of scope
  (Compass "N values you ranked highest", allocation tension prompts, Open
  Tensions descriptions, the revision-source tally if not covered).
