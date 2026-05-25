# CC-COUPLE-6-PROMPT-NAME-TEMPLATING

> Cowork-chat CC, 2026-05-24.
> Kill the "When Michele is at Michele's best, Michele gives Michele:"
> bug. Replace the fragile client-side regex substitution chain with
> explicit server-side role templating, so subject vs guesser references
> never collide.

## The bug (confirmed)

`app/couple/[token]/page.tsx` (~L404-418) rephrases each first-person
item prompt into a guess-about-A prompt with an ordered `.replace()`
chain. For `aim_gives_you` — prompt `"When you are at your best, you
give your partner:"` — the chain mangles to
`"When Michele is at Michele's best, Michele gives Michele:"`:

1. `\byou are\b → "Michele is"` fires inside "you are at your best"
   BEFORE the specific `\byou are at your best\b` rule (L414) can match,
   so L414 is dead.
2. `\byou give your partner\b → "Michele gives you"` (L416) correctly
   produces "Michele gives you".
3. The catch-all `\byou\b → subject` (L417) then **clobbers** the "you"
   L416 just placed → "Michele gives Michele".
4. `\byour\b → "Michele's"` (L418) turns "at your best" into "at
   Michele's best" (should read "at her/their best").

Two referent classes share the word "you" in the source prompts, and a
positional regex chain cannot disambiguate them:
- **Subject (A)** — the assessed person being guessed about. Source uses
  "you / your" for A.
- **Guesser (B)** — the player. Source uses "your partner" (and, in one
  item, "they") for B.

## The fix: explicit role tokens, resolved server-side

Stop deriving the rendered prompt from first-person prose on the client.
Author a dedicated guess-about-subject template per item using
unambiguous placeholders, resolve it on the SERVER (where A's name AND
gender already live), and ship the client a final string. Delete the
client regex chain entirely.

### Token vocabulary (subject = A; guesser = literal "you")

- `{S}` → subject first name (or "your partner" when A gave no name)
- `{S_pron}` → subject subject-pronoun: she / he / they
- `{S_poss}` → subject possessive: her / his / their
- `{S_refl}` → subject reflexive: herself / himself / themselves  *(only
  if any template needs it; most won't)*

Guesser references stay as literal "you" / "your" in the template — they
are NOT placeholders and are never substituted.

Templates are authored already conjugated for a single third person
(subject is always one named person), so there is no is/are agreement
problem. When A gave no name, `{S}`→"your partner", `{S_pron}`→"they",
`{S_poss}`→"their" — which reads correctly with the they/their forms.

### Pronoun resolution from demographics

Derive the pronoun set from A's `demographics.gender_value`:
- woman / female / f → she / her / herself
- man / male / m → he / his / himself
- anything else, "prefer not to say", or missing → they / their /
  themselves  (singular "they")

Keep the mapping in one small helper (e.g. `subjectPronouns(genderValue:
string | null)`), case-insensitive, trimmed. Default to they/their —
never guess a binary pronoun from an ambiguous value.

### Authored `promptAboutPartner` templates (all 14 items)

Add a `promptAboutPartner: string` field to `CoupleGameItemSpec`
(`lib/coupleTypes.ts`) and populate it for every item in
`COUPLE_GAME_ITEMS` (`lib/coupleGameItems.ts`). Authored forms (verify
each against the item's current `prompt`):

| itemId | promptAboutPartner |
|---|---|
| under_pressure_become | `When {S} is under pressure, {S_pron} usually becomes:` |
| need_but_dont_say | `When {S} is struggling, what {S_pron} most wants but may not ask for is:` |
| grip_costs_you | `When {S_poss} fear takes over, {S_pron} probably costs you:` |
| aim_gives_you | `When {S} is at {S_poss} best, {S_pron} gives you:` |
| the_thing_i_call_helping | `When {S} says {S_pron} is helping, {S_pron} may actually be:` |
| under_pressure_most_need | `When {S} is under pressure, what {S_pron} most needs is:` |
| you_know_partner_loves_you_when | `{S} knows you love {S_pron} when you:` |
| how_you_show_love | `When love is steady in {S}, it shows up as {S_pron}:` |
| what_they_protect_in_argument | `When {S} is in an argument, what {S_pron} most protects is:` |
| default_question_they_ask | `The question {S_poss} mind most often asks first is:` |
| what_im_fine_means | `When {S} says "I'm fine," what {S_pron} usually means is:` |
| love_distortion_when_fear | `When fear is loud in {S}, {S_poss} love turns into:` |
| first_move_when_conflict_opens | `When a real conflict opens, {S_poss} first move is to:` |
| compliment_secretly_needed | `The compliment that secretly lands hardest for {S} is:` |

(Confirm itemIds against `COUPLE_GAME_ITEMS`; the table above is keyed to
the L715-848 `*_BY_*` block ids. If any itemId differs from the prompt
list, match by the item's `prompt` text, not by my guess at the id.)

The existing `prompt` field (first-person self-answer form) stays — it's
used for the symmetric self-pass (Phase 3) and reads fine as-is. We are
ADDING a guess-form template, not replacing the self-form.

### Server resolves the template

In `app/api/couple/[token]/route.ts`:
- `itemsForIntro` currently doesn't see A's name/gender. Thread the
  subject's `personName` and pronoun set into it (compute once in
  `buildIntroOrReveal`, which already has the demo row), and resolve
  each item's `promptAboutPartner` to a final string by substituting
  `{S}`/`{S_pron}`/`{S_poss}` (+`{S_refl}` if used). Put the resolved
  string into `ItemPayload.prompt`.
- `buildRevealPayload` sets `ResolvedItem.prompt` from `item?.prompt` —
  switch it to the same resolved `promptAboutPartner` so the reveal echoes
  the same wording the player saw. (It has `personName`; thread pronouns
  in alongside, same helper.)
- Capitalize a sentence-leading `{S}`-derived "they"/name correctly —
  templates already start with a capital token position, so just ensure
  the substituted value preserves the template's leading capital (e.g.
  the template literally starts with `{S}` → name is already capitalized;
  "your partner" fallback at sentence start should render "Your partner".
  Handle the sentence-initial-fallback capitalization explicitly).

### Client just renders

`app/couple/[token]/page.tsx`:
- DELETE the `.replace()` chain (L404-418) and the local `subject` /
  `possessive` derivation.
- Render `item.prompt` directly (it now arrives fully resolved).
- The intro line (L311-312) already uses `data.personName` cleanly —
  leave it, but sanity-check it reads naturally
  (`"{name} already knows this about you. You may or may not."`).

## Files to modify

- `lib/coupleTypes.ts` — add `promptAboutPartner: string` to
  `CoupleGameItemSpec`.
- `lib/coupleGameItems.ts` — add `promptAboutPartner` to all 14 items.
- `app/api/couple/[token]/route.ts` — `subjectPronouns` helper; resolve
  templates server-side in `itemsForIntro` + `buildRevealPayload`; thread
  name+pronouns through.
- `app/couple/[token]/page.tsx` — delete the regex chain; render
  `item.prompt` directly.

## Do NOT

- Change scoring, predictors, deck selection, adjacency, translations, or
  any engine read.
- Change the self-answer `prompt` field text (Phase-3 self-pass uses it).
- Reintroduce client-side string substitution of names/pronouns.
- Guess a gendered pronoun from an ambiguous/missing gender value —
  default to singular they/their.
- Commit or push.

## Acceptance

- `tsc --noEmit` clean; lint clean.
- Render check (Michele, female): `aim_gives_you` reads
  `"When Michele is at her best, Michele gives you:"` —
  no doubled name, no "Michele's best".
- Render check (no-name subject): `aim_gives_you` reads
  `"When your partner is at their best, your partner gives you:"`.
- `you_know_partner_loves_you_when` reads
  `"Michele knows you love her when you:"`.
- Couple-flow audit (`coupleFlow.audit.ts` or equivalent) green; full
  suite green at close.

## Report back

- Files modified.
- The resolved text of all 14 prompts for a female-named subject
  ("Michele") AND for a no-name subject, so I can eyeball every one.
- Audit results.

## Note — relation to the bond redesign

This fixes the *rendering* of the subject's name/pronoun. It does NOT
address how the bond is created or how the guesser is identified — that's
the separate architecture Jason is scoping (the "share a user/individual
token to create the bond" direction). This CC is safe to land first: the
subject name/pronoun must render correctly under any bond model.
