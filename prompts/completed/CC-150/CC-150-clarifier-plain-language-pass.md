# CC-150 — Plain-language pass over the remaining follow-up clarifier options

> Sibling/continuation of CC-149. CC-149 fixed the render (the option `text`
> sentence now shows instead of the cryptic `label`), de-jargoned the
> aim-replacement stem (6 families), and rewrote ONE option set
> (`control_mastery.aimReplacement`, 8 options) as the locked reference. This CC
> applies the same plain-language rewrite to **all the remaining option `text`
> fields** so no clarifier ships in insider register. Owner's standing rule:
> "if the owner can't parse it cold, cohorts won't" — and the owner is fluent in
> the model, so abstraction that survives his read is the bar.

## Execution mode

Single pass, proceed without pausing on wording. BUT this is a large content
rewrite with register risk, so the deliverable includes a full before/after
**manifest for owner review** (see Tasks). Where an option's intent is genuinely
unclear, do NOT invent a meaning — leave the original `text`, rewrite nothing,
and list it under "Ambiguous — needs owner" in the manifest.

## Launch Directive

`claude --dangerously-skip-permissions`. Independent of the admin CCs
(151/152/153) and the couple module. Content-only: rewrites option `text`
strings. No render change (CC-149 shipped it), no stem change (CC-149 shipped
it), no engine/derivation/math change, no schema change.

## The rubric (already in the code — obey it literally)

CC-149 left this rubric as a comment above `FAMILY_SEED_BANKS` in
`lib/followUpQuestions.ts`. Every rewritten `text` must satisfy all four:
1. Say what the person would actually **do or experience**, concretely.
2. No insider nouns a cold reader hasn't been handed ("recoveries",
   "stewardship-as-register", "instrument", "downstream enablement", "ledger",
   "attribution", "the floor", etc. — judge by whether a smart stranger could
   picture it).
3. Second person where natural; a single plain sentence; no nominalization that
   needs unpacking.
4. The sentence must stand alone without the label.

The 8 locked `control_mastery.aimReplacement` rewrites (CC-149) are the gold
reference for tone and concreteness — match them. Examples of the transform:
- "Recoveries logged as part of the record, not hidden." → "Being open about
  your mistakes and how you fixed them, instead of hiding them."
- "Stewardship of a craft someone else will inherit." → "Tending a craft you'll
  hand down to someone after you."

## Faithfulness constraint (critical)

Each option carries `label`, `text`, `tags`, `interpretation`, and sometimes
`boost`. **Only `text` may change.** `tags`/`interpretation`/`boost`/`label`
are the engine's signal semantics and the write-back key — touching them changes
what the answer means. Use each option's existing `interpretation` as the
**ground truth** for what the option is about, and write plain `text` faithful to
that interpretation. Do not drift the meaning to make it sound nicer.

## Scope — what to rewrite (in `lib/followUpQuestions.ts`, `FAMILY_SEED_BANKS`)

For all SIX families (`control_mastery`, `belonging_usefulness`,
`worth_achievement`, `continuity`, `security`, `responsibility`):
- `gripObject[]` option `text` — all of them.
- `releaseCondition[]` option `text` — all of them.
- `aimReplacement[]` option `text` — **all EXCEPT `control_mastery` (done in
  CC-149; leave those 8 byte-identical).**

Plus the two shared seed sets:
- `COMPRESSION_CHECK_OPTIONS[]` `text`
- `TRAIT_VS_WEATHER_OPTIONS[]` `text`

(That's ~140 option texts. The grip-object and release-condition stems
themselves are already plain — do not touch stems; CC-149 handled the only one
that needed it.)

## Tasks

**T1 — rewrite.** Walk every option in the scope above and rewrite `text` to the
rubric, faithful to `interpretation`. Keep `label`/`tags`/`interpretation`/
`boost` exactly. Keep authored order (deterministic top-N selection depends on
index order).

**T2 — manifest for owner review.** Write `docs/cc150-clarifier-rewrites.md`: a
per-family, per-bank table of `label | interpretation | OLD text | NEW text`,
plus an "Ambiguous — needs owner" section listing any option left unchanged
because its intent wasn't clear enough to rewrite safely. This is the artifact
the owner reads to approve or correct — make it scannable.

## Allowed to modify

- `lib/followUpQuestions.ts` — option `text` fields only, within the scope above.
- `docs/cc150-clarifier-rewrites.md` — new manifest.

Do NOT touch: the stems, `Ranking.tsx`, the follow-up page render, option
`tags`/`interpretation`/`boost`/`label`, `control_mastery.aimReplacement`'s 8
texts, or any engine/derivation/audit-baseline file.

## Acceptance criteria

1. Every in-scope `text` is a single plain, standalone sentence that satisfies
   the rubric; spot-check proves no insider nouns survive (grep the obvious
   offenders: "recoveries", "stewardship", "ledger", "attribution", "instrument").
2. `control_mastery.aimReplacement`'s 8 texts are byte-identical to CC-149.
3. No `tags`/`interpretation`/`boost`/`label` changed anywhere (diff proves
   `text`-only edits). Write-back + engine signal translation unaffected.
4. `docs/cc150-clarifier-rewrites.md` exists with the full before/after table and
   an Ambiguous section (even if empty).
5. `tsc` + lint clean. Follow-up clarifier audits (`followUpQuestions.audit`,
   `followUpBackend.audit`) still pass; no two-tier re-snapshot expected (this
   copy isn't in the baseline). If any audit moves, STOP and flag.

## Flag in report

- Count of options rewritten per family/bank.
- The full Ambiguous-needs-owner list (these are the ones that need a workshop
  pass like the mastery set got).
- Confirmation that only `text` changed (the diff is text-only).
