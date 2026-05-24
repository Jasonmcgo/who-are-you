# CC-156 — Plain-language rewrite of the hand-authored cohort clarifiers (`data/cohortFollowUps.ts`)

> Owner caught engine jargon still rendering on a cohort member's follow-up link:
> *"If the grip on building the model softened, what action could the same
> instrument be aimed at instead?"* CC-149 fixed the dynamic generator and CC-150
> fixed the option banks — but **`data/cohortFollowUps.ts`** is a separate,
> hand-authored file of bespoke per-cohort clarifiers that neither touched, and
> it's full of the old register ("same instrument," "be aimed at instead," "the
> grip on X softened," "same warm attentive instrument"). Owner chose: **rewrite
> it to plain language, keeping the bespoke per-cohort content.**

## Execution mode

Single pass, proceed on wording. This is a large content file, so the deliverable
includes a **before/after manifest for owner review**. Where a question's intent
is genuinely unclear, do NOT invent — leave the original text and list it under
"Ambiguous — needs owner."

## Rubric (same as CC-149/150 — obey literally)

1. Say what the person would actually **do or experience**, concretely.
2. No insider nouns a cold reader hasn't been handed ("instrument," "aimed at,"
   "the grip on X softened," register names, etc.). Judge by whether a smart
   stranger could picture it.
3. Second person where natural; plain sentences; no nominalization needing unpacking.
4. Each stem/option must stand alone and read like normal language.

The CC-149 locked control_mastery aim set + the CC-150 manifest
(`docs/cc150-clarifier-rewrites.md`) are the tone reference — match them.

## Faithfulness constraint (critical)

`data/cohortFollowUps.ts` maps **specific cohort members → bespoke clarifiers**.
Rewrite **only the human-readable text** — the stem strings and option `text`/
`label` display copy. Do NOT change: `question_id`s, `signal`/`tags`/
`interpretation`/scoring fields, the per-cohort keying, option ids/values, or the
file's structure. Use any existing `interpretation`/intent field as the
ground-truth meaning each rewrite must stay faithful to; don't drift meaning to
sound nicer. If a stem dynamically interpolates a grip object (e.g. "building the
model"), keep the interpolation — just fix the surrounding phrasing.

## Tasks

**T1 — rewrite.** Walk every cohort entry in `data/cohortFollowUps.ts` and rewrite
the stems + option display text to the rubric. Kill every instance of the jargon
("same instrument," "be aimed at instead," "the grip on … softened," "same warm
attentive instrument," and siblings). Keep authored order and all non-text fields
byte-identical.

**T2 — manifest.** Write `docs/cc156-cohort-clarifier-rewrites.md`: per-cohort,
per-question `OLD → NEW` for every stem and option, plus an "Ambiguous — needs
owner" section (even if empty).

**T3 — context note (no reroute).** While in the file, note in the report HOW it's
consumed (which cohort follow-up links read it vs the dynamic generator), for the
owner's awareness — but do NOT reroute or deprecate it; owner chose to keep and
rewrite.

## Allowed to modify

- `data/cohortFollowUps.ts` — display text only (stems + option text/label).
- `docs/cc156-cohort-clarifier-rewrites.md` — new manifest.

Do NOT touch `lib/followUpQuestions.ts`, the generator, option signals/tags, the
cohort keying, or any engine/derivation file.

## Acceptance criteria

1. Grep proves the jargon is gone from `data/cohortFollowUps.ts`: zero matches for
   `same instrument`, `aimed at instead`, `grip on .* softened`, `same warm`.
2. Every rewritten stem/option is a plain, standalone sentence per the rubric.
3. Diff shows **text-only** changes — no `question_id`/`signal`/`tags`/
   `interpretation`/value/structure edits. Cohort keying intact.
4. `docs/cc156-cohort-clarifier-rewrites.md` exists with the full OLD→NEW table +
   an Ambiguous section.
5. `tsc` + lint clean. Follow-up audits still pass; no two-tier re-snapshot
   expected (this copy isn't in the baseline). If an audit moves, STOP and flag.

## Flag in report

- Count of cohort entries / stems / options rewritten.
- The full Ambiguous-needs-owner list (the ones that need a workshop touch).
- Confirm the diff is text-only and the cohort keying is unchanged.
- The T3 consumption note (which links actually use this file).
