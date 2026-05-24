# CC-149 — Make engine follow-up clarifiers legible: render the plain sentence, de-jargon the aim stem, plain-language the mastery set

> Owner-flagged and owner-workshopped: the engine-generated follow-up clarifiers
> are good in concept, but one class is incomprehensible — even to the owner, who
> is fluent in the model. Live read-through of the `control_mastery`
> aim-replacement question: the terse option labels ("Held lightly", "Recoveries
> on record", "Mastery as service") were unparseable, and the stem's "the same
> instrument … aimed at" has no referent a reader can picture. Rule of thumb:
> "if the owner doesn't understand it, cohorts won't." The fix is to (a) show the
> explanatory sentence instead of the label, (b) give the stem a concrete
> referent, and (c) rewrite the mastery option set in plain, concrete language.

## Execution mode

Proceed without pausing. Single pass. On ambiguity, apply the codebase-faithful
interpretation, proceed, and flag it.

## Launch Directive

`claude --dangerously-skip-permissions`. Independent of CC-146/147/148 and the
couple module. Three changes: a follow-up render fix + a stem copy rewrite + a
locked content rewrite of one option set. No engine-math change, no derivation
change. (The remaining ~40 aim options and the grip-object / release-condition
banks are explicitly deferred to CC-150 — see "Out of scope".)

## Why this matters / corrected framing

An earlier draft of this CC framed the stem problem as an "engine-vocabulary-ban
violation" (Grip / aimed-at). **That framing was wrong and must not drive the
rewrite.** "Grip" and "Aim" are deliberately user-facing terms in this product
(the report has a `## Your Grip` section; Movement prints Grip/Aim). The
*good* clarifier the owner liked also uses "grip" ("loosen your grip on the
work"). So the executor must NOT scrub "grip"/"aim" wholesale — that would
regress the good stems.

The real problems are two, and both are about **concreteness, not vocabulary**:

1. **"The same instrument" is a pronoun pointing at nothing.** It silently means
   "the same drive/energy you've been gripping with," but nothing on screen
   gives it a referent. Replace it with a referent the reader can picture.
2. **The option labels are abstract nominalizations rendered with their
   explanatory sentence hidden.** "Held lightly" / "Recoveries on record" are
   opaque alone; and for several, even the current full sentence stays in our
   register ("Recoveries logged as part of the record"). So: render the sentence
   AND make the sentence plain.

## Context — verified root cause of the render bug

- Each clarifier option is a `SeedOption` with a terse `label` and a fuller
  `text` (`lib/followUpQuestions.ts`; the `control_mastery` aim set is L208-215,
  e.g. `{ label: "Mastery as service", text: "Mastery measured by what it lets
  others do.", … }`).
- `FollowUpBlock` (`app/follow-up/[token]/page.tsx` ~L583-597) maps options to
  `RankingItem`s and carries the sentence through as `quote: o.text`, but sets
  **no `voice`** field.
- `Ranking` (`app/components/Ranking.tsx` L263) only renders the `quote` body
  when BOTH `item.voice` and `item.quote` are truthy; otherwise it falls to the
  else branch showing only `item.label` (+ optional `gloss`). With `voice`
  undefined, the sentence never shows → every clarifier renders label-only.
- Single render surface: only `FollowUpBlock` maps these (no equivalent mapping
  in `app/assessment/page.tsx`). Both `responseMode` paths (`SinglePickPicker`
  and `Ranking`) consume the same `items`.

## Tasks

**T1 — render the plain sentence as the option; drop the cryptic label from
display.** In `FollowUpBlock` (`app/follow-up/[token]/page.tsx`), make the
explanatory sentence the visible option text for follow-up clarifiers, and stop
surfacing the terse insider label as the primary handle. Owner decision
(validated by live read-through): **lead with the sentence, do not show the
cryptic label** — the labels actively seeded wrong guesses ("Public iteration"
→ misread as "the public gives an opinion").

- Implementation: render `o.text` as the option's primary line (for both
  `SinglePickPicker` choose-one and `Ranking` rank modes). The simplest faithful
  path is to map the sentence into the field the else-branch already shows as the
  primary line (i.e. put the sentence where `label` is read for display), rather
  than touching `Ranking.tsx`.
- **Write-back must not change.** The id / matching key the POST handler resolves
  on today (the option `label`) must stay the stored/submitted value. Only the
  *displayed* text changes. Confirm a submitted answer still resolves to the same
  tag/signal. (If the only way to display the sentence is to also change the
  stored key, STOP and flag — do not silently change the write-back key.)
- Do NOT edit `Ranking.tsx` (a change there alters every ranking question's
  display); fix at the `FollowUpBlock` mapping.

**T2 — give the aim-replacement stem a referent (all six families).** Rewrite
`AIM_REPLACEMENT_STEM` (`lib/followUpQuestions.ts` L730-737). Replace "the same
instrument … aimed at instead" with a concrete referent ("that same drive /
care / strength … point instead") and open with the eased *fear* rather than
"the Grip on X softened". Keep "grip"/"aim" allowed elsewhere — this is a
referent + concreteness fix, not a vocabulary scrub. `control_mastery` is
**locked** to the owner-approved wording; the other five follow the same
parallel structure (refine wording but keep the shape):

- control_mastery (LOCKED): `"If being 'not good enough' felt less dangerous, where could that same drive point instead?"`
- belonging_usefulness: `"If your place didn't depend on being useful, where could that same care point instead?"`
- worth_achievement: `"If your worth didn't depend on the next win, where could that same drive point instead?"`
- continuity: `"If keeping everything the way it's been felt less urgent, where could that same faithfulness point instead?"`
- security: `"If the floor already felt solid enough, where could that same care point instead?"`
- responsibility: `"If you didn't have to carry it all yourself, where could that same strength point instead?"`

While here, scan `GRIP_OBJECT_STEM` (L712-719) and `RELEASE_CONDITION_STEM`
(L721-728) for a dead-referent phrase like "the same instrument"; the
release-condition stems read plain (the owner liked them) — flag, don't rewrite,
unless one carries the same no-referent problem.

**T3 — plain-language the `control_mastery` aim-replacement option set (LOCKED,
8 options).** In `FAMILY_SEED_BANKS.control_mastery.aimReplacement` (L208-215),
replace each option's `text` with the owner-approved plain sentence below. Keep
`label`, `tags`, `interpretation`, `boost` unchanged (label remains the internal
write-back key; it just stops being displayed per T1). Map by current label:

- `Ships under feedback` → `"Putting work out before it's perfect and improving it from real feedback."`
- `Public iteration` → `"Improving the work in the open, where people can watch it evolve."`
- `Mastery as service` → `"Measuring your skill by what it lets other people do — not by how good you are."`
- `Next revision` → `"Aiming for the next good version instead of one final, perfect answer."`
- `Held lightly` → `"Holding your skill loosely, because there's always a next version."`
- `Recoveries on record` → `"Being open about your mistakes and how you fixed them, instead of hiding them."`
- `Stewardship of craft` → `"Tending a craft you'll hand down to someone after you."`
- `Curiosity over certainty` → `"Letting curiosity matter more than being certain."`

## Plain-language rubric (for CC-150; record it here so it carries forward)

The eight T3 rewrites define the target register. Distill and leave as a comment
near `FAMILY_SEED_BANKS` so CC-150 (and future authors) inherit it:
- Say what the person would actually **do or experience**, concretely.
- No insider nouns the report hasn't defined for a cold reader ("recoveries",
  "stewardship-as-register", "instrument", "downstream enablement").
- Second person where natural; a single plain sentence; no nominalization that
  needs unpacking.
- The sentence must stand alone without the label.

## Out of scope (→ CC-150)

- The other five families' `aimReplacement` option `text` (~40 options).
- All `gripObject` and `releaseCondition` option `text` across families.
- After T1's render fix these will at least *show* their sentence; CC-150 makes
  those sentences plain, family by family, owner-reviewed, using the rubric above.

## Allowed to modify

- `app/follow-up/[token]/page.tsx` (T1)
- `lib/followUpQuestions.ts` (T2 stems + T3 the `control_mastery.aimReplacement`
  texts + the rubric comment; do NOT touch other families' option text)

Do NOT change `Ranking.tsx`, the option `tags`/`interpretation`/`signal`
write-back, or any engine/derivation file.

## Acceptance criteria

1. Rendering a `control_mastery` aim-replacement clarifier shows, for each
   option, the plain sentence (e.g. "Holding your skill loosely, because there's
   always a next version.") as the option itself — NOT "Held lightly" — in both
   rank and choose-one modes.
2. The aim-replacement stem reads as plain language with a concrete referent;
   "the same instrument" is gone across all six families; `control_mastery`
   matches the locked wording exactly.
3. "grip"/"aim" are NOT scrubbed from the release-condition or other stems that
   already read plainly (no regression of the good stems).
4. Write-back unchanged: the POST handler still matches on the same option key
   (label today); a submitted answer resolves to the right tag/signal. Confirm
   explicitly.
5. `tsc` + lint clean. No engine numerics or derivation change. No re-snapshot
   expected (follow-up copy is not in the two-tier baseline) — confirm none of
   the audits move; if one does, STOP and flag.

## Flag in report

- Exactly how the sentence is rendered (which field carries it) and a before/after
  of one rendered option in each mode.
- Confirmation the write-back key is unchanged (still `label`), with the line
  that proves the POST match still resolves.
- Any stem found carrying a dead-referent phrase (flag, don't fix beyond T2).
- Confirm the rubric comment landed for CC-150.
