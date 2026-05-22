# CC-121 — Prose tightening (length + anti-repetition) + relax the byte-snapshot audit

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass.
Do not stop for confirmation between steps. On ambiguity, apply the
canon-faithful interpretation, proceed, and flag it. Permission bypass is
on; the discipline below is scope.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.

## Execution Directive

- One pass, no mid-task confirmation prompts.
- This edits **LLM rewrite prompts** and **one audit**. It does NOT
  regenerate caches (that's a follow-up manual step with the API key) and
  does NOT change engine/derivation or render logic.
- The tightening shortens the warm prose in BOTH Individual and Guide
  (correct: the Guide is the junk drawer for *scaffolding*, not for verbose
  prose). Per `docs/canon/guide-individual-model.md`, concise prose is the
  goal everywhere; the Guide just additionally carries scaffolding.

## Context

Real user feedback: reports are **too long and too repetitive**. CC-120 cut
~18% structurally (gated secondary sections to Guide-only). The remainder
lives *inside* the warm LLM rewrites — verbose sections (the Path triptych
runs ~600 words), an over-used signature term (e.g. the function-voice
label "room-reader" appearing many times), the protected-value cluster
restated repeatedly, and formulaic cadence. Each section is rewritten
independently, so the prompt can control **per-section length, within-
section repetition, signature-term frequency, and cadence** — which is the
bulk of the felt verbosity.

Also: the `guide-mode-snapshot-stable` two-tier assertion byte-pins LLM-
cached prose and has flapped at CC-116/119/120 (baseline written warm vs.
audit run cold). The meaningful guarantee — `guide-superset-of-individual`
— is robust. This CC relaxes the byte-hash assertion to a structural one so
prose changes (like this CC's regen) never flap it again.

## Read First (Required)

- `lib/launchPolishV3Llm.ts` — the 7-section system prompt (hedge cap, the
  "speak in declaratives" rule, the per-section targets incl. `pathTriptych`).
- `lib/proseRewriteLlm.ts` — the 4-card system prompt (Rule 1 hedge cap,
  Rule 4 declaratives, the banlist).
- `lib/keystoneRewriteLlm.ts` — Rule 9 (CC-112 anti-recitation) as the model.
- `docs/canon/result-writing-canon.md` + `guide-individual-model.md` — the
  concision + interpretation principles to cite.
- `tests/audit/twoTierRenderSurfaceCleanup.audit.ts` — the
  `guide-mode-snapshot-stable` (byte-hash) + `guide-superset-of-individual`
  assertions; the section-header set used elsewhere in the file.

## Tasks

### A. Length + anti-repetition rules in the rewrite prompts
Add a shared, explicit rule block to `launchPolishV3Llm.ts`,
`proseRewriteLlm.ts`, and `keystoneRewriteLlm.ts` (phrase per each file's
existing style/numbering):

1. **Length discipline.** Be concise. Give each section a soft word budget
   and a hard ceiling; the Path triptych ("Work"/"Love"/"Give") in
   particular must not balloon — cap each of the three beats (suggest ~110
   words each, hard ceiling ~140) and the other V3 sections proportionally.
   Prefer fewer, sharper sentences over comprehensive ones.
2. **No signature-term over-use.** Do not repeat any single signature label
   (function-voice terms like "room-reader"/"pattern-reader", archetype
   names) more than **twice** in a section; after that, use natural prose /
   pronouns. (Mirrors the hand-fix done on the Keith report.)
3. **State the protected-value cluster at most once** per section; do not
   re-list the same values as a refrain.
4. **Vary cadence.** No two consecutive sentences share an opener; avoid
   formulaic repeated structures ("For your shape, this expresses as …"
   stacked across paragraphs).
5. Reaffirm the existing hedge caps + declarative voice; these rules extend,
   not replace, them.

### B. Relax the byte-snapshot audit
In `tests/audit/twoTierRenderSurfaceCleanup.audit.ts`, replace
`guide-mode-snapshot-stable` (sha256 byte-hash vs. baseline) with a
**structural** assertion, e.g. `guide-contains-expected-sections`: for every
cohort fixture, assert the Guide render contains the canonical set of
top-level section headers (Executive Read, Core Signal Map, Core Pattern,
Top Gifts…, What Others…, When the Load…, Keystone, Movement, Your Grip,
Work Map, Love Map, Path — Gait, Open Tensions, plus the Guide-only
scaffolding markers). Keep `guide-superset-of-individual` and
`user-mode-cohort-renders-clean` as-is — those are the real guards. Remove
the now-unused baseline-hash plumbing if it's dead after this (leave the
`.snapshot.json` file in place but no longer hash-compared, or delete the
assertion's hash read — your call, flag it).

## Allowed to Modify (exhaustive)

- `lib/launchPolishV3Llm.ts`
- `lib/proseRewriteLlm.ts`
- `lib/keystoneRewriteLlm.ts`
- `tests/audit/twoTierRenderSurfaceCleanup.audit.ts`

Nothing else. Do NOT regenerate or edit `lib/cache/*.json`, do NOT touch
engine/derivation/render, do NOT change the snapshot writer.

## Out of Scope

- The cohort cache regen itself (manual follow-up: `regen-cache.sh` with the
  key, then verify word-count). The tightened prompts only take effect after
  regen.
- Cross-section de-duplication (each rewrite is per-section and blind to
  others; the structural cross-section repetition was CC-120's domain).
- Engine function-voice seeding (the engine emits the label into each
  section body; reducing that is a separate engine CC — note it).
- Renaming internal renderMode values.

## Bash Commands Authorized

- `npx tsc --noEmit`, `npm run lint`
- the two-tier + relevant prompt-audits
- `grep` / `rg` read-only verification

## Acceptance Criteria

1. `npx tsc --noEmit` clean; `npm run lint` clean (pre-existing warnings ok).
2. All three rewrite prompts contain the length + anti-repetition + cadence
   rules (grep shows the new rule text in each).
3. `guide-mode-snapshot-stable` is replaced by the structural
   `guide-contains-expected-sections` assertion; the two-tier audit passes
   **without** depending on a byte-hash baseline (run it cold AND in a
   warm-ish process — it should pass both, proving the flap is gone).
4. `guide-superset-of-individual` + `user-mode-cohort-renders-clean` still
   pass.
5. No file outside the Allowed-to-Modify list edited; no cache regenerated.

## Report Back

- The rule block added to each prompt (quote it).
- The audit assertion swap + how the section-header set is sourced; confirm
  the audit no longer byte-compares (run it twice in different process
  states to prove no flap).
- Confirmation no cache was regenerated (the tightening lands after the
  manual regen).
- The follow-up runbook: regen via `regen-cache.sh`, then measure Individual
  word-count before/after to confirm the prose actually shortened.
- Engine function-voice seeding flagged as a separate CC if the signature-
  term repetition persists post-regen.
