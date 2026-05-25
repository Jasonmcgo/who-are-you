# CC-COUPLE-8-MODE2-RECIPROCAL-READ

> Cowork-chat CC, 2026-05-25. The Partner game is currently ONE-WAY: a bond only
> ever runs "Partner B reads Partner A" (subject hardcoded to A; the POST handler
> stamps `direction: "b_guesses_a"`). This CC adds **Mode 2** — when BOTH partners
> are assessed, each reads the other, and a head-to-head "who knows whom better"
> compare view lands. The `CoupleGameDirection = "a_guesses_b" | "b_guesses_a"`
> enum and the "Compare the two of you →" coming-soon card already anticipate
> this; the enum's second branch just was never wired.

## Interim workaround (note in the UI, ships independent of this CC)

Today, two-way can be faked by minting a SECOND bond with roles swapped (Partner
A = Jason0429, Partner B = Michele); Michele plays it and you compare scores by
hand. CC-COUPLE-8 replaces that with one bond that does both directions.

## Current state (verified — `app/api/couple/[token]/route.ts`)

- `loadBondNames` resolves Partner A's name + `subjectPronouns(A.gender)` only;
  Partner B gets a name but no pronouns and is never the subject.
- `itemsForIntro(token, partnerAName, pronouns)` builds the round with A as
  subject; the engine `predict(ic)` runs against **A's** constitution
  (`buildInnerConstitution` for `partner_a_session_id`).
- POST scores the guesses, writes a single `CoupleGameResults` to
  `couple_sessions.game_results`, stamps every item `direction: "b_guesses_a"`,
  and flips `status` → `completed`.
- `buildRevealPayload(game_results, ctx)` (lib/coupleReveal.ts) renders "How
  clearly {B} read {A}" using `summarizeWarmTotal` / `scoreRankedGuess`.

## Mode 2 design (what to build)

**Gate:** Mode 2 is enabled only when the bond is BOTH-ASSESSED — `partner_b_
session_id` is non-null AND that session has answers (a derivable constitution).
Otherwise the bond stays Mode 1 (current one-way flow), unchanged. Detect this
once and branch.

1. **Viewer-aware direction.** The player must indicate which partner they are.
   MVP: the page shows "Which one are you? {A name} / {B name}" and passes a
   `role: "a" | "b"` to GET/POST. Direction follows: role "a" → `a_guesses_b`
   (subject = B); role "b" → `b_guesses_a` (subject = A). (A per-partner sub-token
   is the cleaner long-term auth, but role-select is the MVP — note it.)
2. **Subject resolution follows the guesser.** Generalize `loadBondNames` to
   resolve BOTH partners' names + pronouns (B currently has no pronouns). For each
   direction the SUBJECT is the *other* partner: `itemsForIntro` takes the
   subject's name + `subjectPronouns(subject.gender)`, and — CRITICAL — the engine
   predictions must run against the **subject's** constitution
   (`buildInnerConstitution` for the subject's session), not always A's. Getting
   this wrong silently scores B's guesses against A's engine answers.
3. **Two result sets.** Change `game_results` to hold both directions, e.g.
   `{ a_guesses_b?: CoupleGameResults; b_guesses_a?: CoupleGameResults }`.
   `game_results` is jsonb (no migration needed — the schema comment explicitly
   allows shape evolution). BACK-COMPAT (hard): existing completed bonds store a
   bare `CoupleGameResults` (legacy single-direction). Detect that shape and treat
   it as the `b_guesses_a` result so old reveals still render.
4. **Completion model.** A direction is "done" when its result set is present.
   `status` reaches `completed` only when BOTH directions are done; add an
   intermediate state (or derive from `game_results` keys) for "one side done,
   waiting on the other." GET returns: the play screen for the viewer's direction
   if not yet done; their single-direction reveal if theirs is done but the
   partner's isn't; the **compare view** once both are done.
5. **Compare reveal (the payload that makes the "Compare the two of you" card
   live).** A head-to-head view: each direction's score via the existing
   `summarizeWarmTotal` / `scoreRankedGuess`, e.g. "Jason read Michele 15/40 ·
   Michele read Jason Y/40," a winner/tie line, and the per-item cards shown per
   direction with the correct subject name + pronouns (the CC-COUPLE-PRONOUN-FIX
   resolution applies to whichever partner is the subject).
6. **Page (`app/couple/[token]/page.tsx`).** Add the role-select step, route the
   player into their direction's play flow, then to the per-direction reveal and
   finally the compare view. Mirror the existing intro/round/reveal structure;
   reuse the option-label rendering (already partner-mode-correct from
   CC-COUPLE-PRONOUN-FIX).

## Do NOT

- Do NOT break Mode 1: bonds where B is not assessed keep the exact current
  one-way behavior. The gate must be explicit.
- Do NOT break legacy completed bonds: old bare-`CoupleGameResults` `game_results`
  must still render (map to `b_guesses_a`).
- Do NOT merge any guess into either partner's `sessions.answers` (hard invariant,
  couple §5).
- Do NOT change the engine, the item bank, the prediction logic, or the
  `coupleReveal` scoring — only run predictions against the correct subject IC and
  reuse the existing scorers.
- Do NOT alter Room Read (`lib/games/roomRead/*`) or its routes.
- Do NOT commit or push. (Sandbox: prepend `rm -f .git/index.lock` to any commit
  command handed to Jason.)

## Acceptance

- Both-assessed bond (Michele = A, Jason0429 = B): Jason playing as "b" reads
  Michele (subject A, scored against A's constitution); Michele playing as "a"
  reads Jason (subject B, scored against B's constitution). Two independent /40
  scores.
- `game_results` holds both `a_guesses_b` and `b_guesses_a`; `status` → completed
  only when both present; the one-side-done intermediate returns the right screen.
- Compare view renders both scores + a winner/tie line; per-item cards show the
  correct subject name + third-person pronouns for EACH direction (Michele→"her",
  Jason→"him").
- A legacy one-way completed bond still renders its original reveal unchanged.
- A bond where B is not assessed stays Mode 1 (no role-select, one-way as today).
- `npx tsc --noEmit` clean; `npx eslint` clean on touched files; `npm run build`
  compiles.

## Report back

- Files touched (route, types, coupleReveal, page) + confirmation Mode 1 and
  legacy reveals are preserved (show a legacy-shape `game_results` still rendering).
- A walk of the Michele↔Jason0429 bond: both directions played, the two scores,
  and the compare-view output (paste it). Confirm B's guesses scored against B-as-
  subject's constitution, not A's.
- Whether `game_results` legacy detection needed any special-casing beyond shape
  sniffing.
- tsc / lint / build status; anything in `docs/couple-module-mvp-spec.md` that
  this contradicts (flag, don't silently diverge).
