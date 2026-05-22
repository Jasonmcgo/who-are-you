# CC-122 — Re-voice the Ne/Ni intuition items (prose-only, scoring-inert)

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass.
Do not stop for confirmation between steps. On ambiguity, apply the
canon-faithful interpretation, proceed, and flag it. Permission bypass is
on; the discipline below is scope.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.

## Execution Directive

- One pass, no mid-task confirmation prompts.
- This edits **display copy only** in `data/questions.ts`: the `quote` and
  `example` strings of the eight Ne/Ni Voice options in Q-T1–Q-T4.
- It does **NOT** change scoring, the engine, derivation, render logic, or
  any `id` / `label` / `voice` / `signal` field. It does NOT touch the Si/Se
  voices, the judging voices (Q-T5–T8), Q-O1, or any cache.
- Scoring is provably unaffected: `signalsFromRankingAnswer`
  (`lib/identityEngine.ts:502`) scores from `item.signal` + the respondent's
  stored `order` (rank). The `quote`/`example`/`label` prose is never read by
  the scorer. Therefore every existing saved session re-derives byte-identical
  (this is the regression guard, see Acceptance).

## Context

Validity review (Clarence-reviewed, `docs/canon/ne-item-validity-review.md`):
the current intuition items operationalize intuition as **impersonal
abstraction** — mapping forces, comparing methods, conceptual angles,
frameworks. That catches NT/ST intuitives but **under-detects NF intuition**,
which arrives through possibility, trajectory, and underlying meaning. Result:
intuitive Feelers lose their N — ENFP collapses to Fe (Michele: ENFP→ENFJ),
INFJ collapses to Se (Ashley: INFJ→ESFP).

Fix is **language first, scoring later**. These eight replacements keep the
intuition construct (Ne = possibility / openings / where it could lead; Ni =
hidden shape / underlying direction) but strip the analytic costume, so the
voices read cleanly for Thinkers AND Feelers without tipping into warmth (which
would over-correct into Fe). Approved verbatim by Jason 2026-05-22.

Note for after landing (NOT part of this CC): existing miscast sessions do not
self-correct — Ashley and Michele must be **manually re-answered** against the
new voices, because only a changed stored `order` moves a result. New
respondents get the improved wording automatically.

## Read First (Required)

- `data/questions.ts` — the Q-T1, Q-T2, Q-T3, Q-T4 blocks (`card_id:
  "temperament"`, `type: "ranking"`).
- `lib/identityEngine.ts` ~L502 `signalsFromRankingAnswer` — confirm the
  scorer reads only `item.signal` + `order`/rank, never the prose. This is the
  justification for the byte-identity acceptance criterion.
- `docs/canon/ne-item-validity-review.md` — the validity rationale.

## Tasks

In `data/questions.ts`, for each of the eight items below, replace **only**
the `quote` and `example` fields. Leave `id`, `label`, `voice`, and `signal`
exactly as they are. Identify each item by its question + current `signal` +
current opening words.

### Q-T1 — "When you're working on a hard problem"

**signal: "ne"** (currently Voice B, "There are at least four interesting angles…")
- quote → `"I start seeing several ways this could open up — one idea leads to another, and the useful path usually appears after I've followed a few live threads."`
- example → `"Partway in, I've got three or four threads I want to pull, and chasing them is usually how the workable path shows up."`

**signal: "ni"** (currently Voice A, "Once I see how the pieces are going to land…")
- quote → `"I keep looking for the hidden shape underneath the details. Once I see the pattern, the scattered pieces start to arrange themselves."`
- example → `"I sit with it until the underlying shape clicks; after that the specifics mostly sort themselves out."`

### Q-T2 — "When you walk into a new environment"

**signal: "ne"** (currently Voice A, "This is interesting — there are so many new possibilities…")
- quote → `"I start sensing what this place could become and where it might lead — I want to follow the openings before I settle into any read."`
- example → `"I find myself imagining what could happen here and which directions are worth following, well before I've pinned anything down."`

**signal: "ni"** (currently Voice D, "I'm already picking up on what this place is really about…")
- quote → `"I sense where this place is actually headed before much has been said — the direction starts to feel clear even without all the evidence."`
- example → `"A short while in, I have a quiet read on where this is really going, beneath what people are telling me."`

### Q-T3 — "When you're learning something new"

**signal: "ne"** (currently Voice D, "I'd rather try several approaches than commit to one method…")
- quote → `"I learn by finding different entrances into the thing — a conversation, an example, a story, or a tangent can suddenly make the whole subject come alive."`
- example → `"A chat, a story, a side-tangent — somewhere across those different ways in, it suddenly clicks into a whole."`

**signal: "ni"** (currently Voice C, "I want to understand what the skill is really *for*…")
- quote → `"I need the underlying meaning or organizing principle first. Once I understand what the thing is really about, the details fall into place."`
- example → `"Until I grasp what it's fundamentally for, the steps won't stick; once I do, they settle into place on their own."`

### Q-T4 — "When you're trying to read a complex situation"

**signal: "ne"** (currently Voice C, "There are probably several forces at work here…")
- quote → `"Several different things could be going on here — I follow where each one might lead before I settle on a read."`
- example → `"I hold a few live possibilities open and watch where each could go before I commit to one."`

**signal: "ni"** (currently Voice B, "I'm looking for the one underlying thing…")
- quote → `"I sense the deeper direction beneath the surface facts; where this is actually headed often becomes clear before I can fully explain why."`
- example → `"The underlying direction starts to feel clear to me before the evidence has fully caught up."`

## Allowed to Modify (exhaustive)

- `data/questions.ts` — the eight `quote`/`example` fields named above. Nothing
  else in the file.

## Out of Scope

- Any `id`, `label`, `voice`, or `signal` field (changing these WOULD change
  scoring and break stored-answer comparability).
- The Si/Se voices in Q-T1–T4, and all of Q-T5–T8.
- Q-O1 facet routing (`openness_perspective` / `openness_emotional` → intuition
  core) — that is a scoring change, deferred to a later CC.
- Engine / derivation / render / scoring logic. No cache regen. No fixture
  edits.

## Bash Commands Authorized

- `npx tsc --noEmit` (typecheck)
- The existing audit/test suite (e.g. `npm test` / the cohort + two-tier
  audits) to prove byte-identity.

## Acceptance Criteria

1. All eight `quote` + `example` strings replaced verbatim as above; preserve
   the existing backtick/quote delimiters (quotes stay ``` `"…"` ```, examples
   stay `"…"`).
2. `id`, `label`, `voice`, `signal` on every touched item are unchanged.
3. No other item or question touched. Si/Se/judging voices, Q-O1 untouched.
4. `npx tsc --noEmit` clean.
5. **Regression guard (the proof this is scoring-inert):** run the existing
   audit/fixture suite; every cohort + two-tier fixture must be **byte-identical**
   to before this change. If any fixture differs, STOP — it means prose is
   reaching the scorer somewhere unexpected; report it rather than re-baselining.

## Report Back

- The eight edits (file + line numbers), confirming only quote/example changed.
- `tsc` result.
- Audit result with explicit confirmation that all fixtures are byte-identical
  (names any that differ).
- One-line reminder that Ashley & Michele still need manual re-answers to move
  their casts (out of scope here).
