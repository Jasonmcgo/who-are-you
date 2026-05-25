# CC-COUPLE-PRONOUN-FIX

> Cowork-chat CC, 2026-05-25. Bug fix in the Partner Game (couple mode). In
> partner-guessing mode the PROMPT resolves correctly ("Michele knows you love
> her when you:") but the OPTION LABELS still read in second person about the
> beloved ("champion your goals", "make space for you", "calming yourself"),
> which is grammatically wrong once the frame is about Michele. The prompt is
> token-resolved; the options are not. This CC resolves option labels through the
> same subject-token system — surgically, only where "you/your/yourself" refers
> to the BELOVED (the assessed partner), never where it refers to the guesser.

## Evidence (live, 2026-05-25)

Screen — `you_know_partner_loves_you_when`, partner mode, subject = Michele (woman):
- Prompt (correct): "Michele knows you love her when you:"
- Options (WRONG): "make space for you", "champion your goals", "sit with you in
  hard moments", "are honest with you", "make you laugh", "build something with you".
- Should read: "make space for her", "champion her goals", "sit with her in hard
  moments", "are honest with her", "make her laugh", "build something with her".
- Reveal card shows the same raw labels in "Engine read" and "Your top 3" — same bug.

Also wrong: `the_thing_i_call_helping` option "calming yourself" → "calming herself"
("When Michele says she is helping, she may actually be: calming herself").

CORRECT as-is (do NOT touch — proves why a blanket replace is wrong):
- `grip_costs_you` / `aim_gives_you` options are abstract nouns (peace, directness…) — no pronoun.
- "When her fear takes over, she probably costs you: directness" — already correct.
- Item ~644 option "needing reassurance you won't push" — here "you" = the GUESSER
  (the one who might push), not the beloved. Keep.
- Item ~698/707 quoted compliment "You don't have to prove yourself." — quoted
  direct address spoken TO the partner; second person is correct in a quote. Keep.

## Root cause (`app/api/couple/[token]/route.ts`)

- Prompt is resolved: `resolvePromptAboutPartner(item.promptAboutPartner, …)` (line ~347).
- Options are NOT: `itemsForIntro` line ~355 passes `{ id: o.id, label: o.label }` raw.
- Reveal path: `labelFor(itemId, optionId)` (line ~360) returns `o.label` raw; used
  for `rankedGuessLabels` (~443) and the engine-predicted label (~446).
The token resolver supports `{S}` (name / "your partner"), `{S_pron}` (she/he/they),
`{S_poss}` (her/his/their), `{S_obj}` (her/him/them), `{S_refl}` (herself/…).

## Fix — Part 1: data (`lib/coupleGameItems.ts`)

Add an optional `labelAboutPartner?: string` to the option type, and populate it ONLY
for options whose label's "you/your/yourself" refers to the beloved. Use the
grammatically correct token per slot (object vs possessive vs reflexive):

| itemId | option id | `labelAboutPartner` |
|---|---|---|
| you_know_partner_loves_you_when | make_space_for_you | `make space for {S_obj}` |
| you_know_partner_loves_you_when | champion_your_goals | `champion {S_poss} goals` |
| you_know_partner_loves_you_when | sit_with_you_in_hard_moments | `sit with {S_obj} in hard moments` |
| you_know_partner_loves_you_when | are_honest_with_you | `are honest with {S_obj}` |
| you_know_partner_loves_you_when | make_you_laugh | `make {S_obj} laugh` |
| you_know_partner_loves_you_when | build_something_with_you | `build something with {S_obj}` |
| the_thing_i_call_helping | calming_yourself | `calming {S_refl}` |

Options with no beloved-referring second person (remember_small_things,
show_up_reliably, all abstract nouns) get NO `labelAboutPartner` and render `label`
unchanged. AUDIT every item's options and apply the same classification; if you find
another beloved-referring "you/your/yourself" not listed above, template it and
report it. If a "you" is the guesser or a quoted address, leave it.

## Fix — Part 2: render (`app/api/couple/[token]/route.ts`)

Resolve option labels through the same substitution in partner mode, both sites:
- `itemsForIntro` (~355): `label: resolveOptionLabel(o, personName, pronouns)` where
  `resolveOptionLabel` = if `o.labelAboutPartner` present, run it through the SAME
  token substitution used by `resolvePromptAboutPartner`; else return `o.label`.
- `labelFor` (~360) used by reveal (~443/~446): same resolution, so the reveal card
  matches the play screen. (Thread `personName`/`pronouns` into `labelFor`.)
Factor the token-replace out of `resolvePromptAboutPartner` into a shared helper so
prompt and labels resolve identically.

## Fix — Part 3: resolution rule (gender → pronoun; else name's; else "your partner")

Honor the stated rule. Extend the resolver's no-gender fallback so that when gender
is NOT on file but a name IS:
- `{S_poss}` → `"{name}'s"` (→ "champion Michele's goals")
- `{S_obj}` / `{S}` → `"{name}"` (→ "make space for Michele")
- `{S_pron}` / `{S_refl}` → keep `they` / `themselves` (name-subject/-reflexive reads
  worse: "calming Michele" is wrong; "calming themselves" is fine).
Gender on file → existing pronoun set (Michele = woman → her/she/herself). No name
AND no gender → existing "your partner" / "your partner's" fallback.

## Do NOT

- Do NOT blanket find-replace "you"/"your". Classify each: beloved-object → template;
  guesser → keep; quoted address → keep.
- Do NOT change the self-mode `label` (Mode-1 / guessing-about-self uses the raw
  second-person label and is correct).
- Do NOT change prompts, predictions, scoring, signal tags, or option ids.
- Do NOT alter `promptAboutPartner` strings except via the shared helper refactor.
- Do NOT commit or push. (Sandbox: prepend `rm -f .git/index.lock` to any commit
  command handed to Jason.)

## Acceptance

1. Render the couple payload for a subject with gender=woman, name=Michele:
   `you_know_partner_loves_you_when` options read "make space for her", "champion her
   goals", "sit with her in hard moments", "are honest with her", "make her laugh",
   "build something with her"; `the_thing_i_call_helping` shows "calming herself".
2. Render for a subject with NO gender, name=Michele: options read "champion
   Michele's goals", "make space for Michele", "calming themselves".
3. Reveal payload (`rankedGuessLabels` + engine label) shows the SAME resolved
   labels as the play screen for the same subject.
4. Untouched: abstract-noun options; "needing reassurance you won't push"; the quoted
   "You don't have to prove yourself." compliment; self-mode labels.
5. `npx tsc --noEmit` clean; lint clean. Paste a before/after of the Michele render
   for `you_know_partner_loves_you_when` and `the_thing_i_call_helping`.

## Report back

- The full list of options you gave a `labelAboutPartner` (beyond the table above),
  and any "you" you deliberately LEFT as guesser/quoted — with the reasoning.
- Before/after Michele render (gender + no-gender cases).
- tsc/lint status; confirmation only `lib/coupleGameItems.ts`, its type def, and
  `app/api/couple/[token]/route.ts` were touched.
