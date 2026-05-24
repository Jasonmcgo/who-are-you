# CC-COUPLE-3 — Obvious or Oblivious: invite + play + reveal (asymmetric MVP)

> Couple module, brick 3 (spec: `docs/couple-module-mvp-spec.md`).
> The first user-facing slice of the game. Numbering: named sub-track.

## Execution mode

Proceed without pausing for permission dialogs. Single pass, no mid-task
confirmation prompts. On ambiguity, apply the spec-faithful, codebase-faithful
interpretation, proceed, and flag it.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.
**Depends on CC-COUPLE-1 (data model + invite link) AND CC-COUPLE-2 (item bank +
reveal resolver).** If `lib/coupleSession.ts`, `lib/coupleGameItems.ts`, or
`lib/coupleReveal.ts` are missing, stop and report — do not re-create them.
Independent of CC-138 / CC-138.1.

## The MVP shape (read this first — it bounds everything)

**Asymmetric, engine-as-truth.** Partner A (who has a completed individual
session) sends a link. Partner B opens it and **guesses A's answers** to the
~8–10 game items. The reveal compares B's guess against the **engine's** read of
A — i.e. each item's `predict(A_innerConstitution)`. No A-side play pass, no new
DB column, no coordination beyond sending the link.

Mapping onto CC-COUPLE-1's `CoupleGameItem` tuple, per direction `b_guesses_a`:

- `selfAnswer` := the engine's predicted option for A (`item.predict(icA)`).
- `partnerGuess` := B's guessed option.
- `selfKnows` := undefined (we don't have A's self-report in this MVP).
- `sourceSignal` := `item.sourceSignal`.

Consequence (expected, not a bug): with `selfKnows` undefined and
`selfAnswer === enginePredicted` by construction, only **Obvious / Oblivious /
Loving Misread** can fire. **Mirror Blind / Hidden Pattern** require A's own
self-answers and arrive in a later symmetric pass (out of scope here). Items
where `predict()` returns `null` are shown as "no strong read — skipped for
scoring," never forced into a reveal.

## Tasks

### 1. A-side: "Invite your partner" CTA + mint API

- New API route `app/api/couple/mint/route.ts`: `POST { sessionId }` →
  `mintCoupleInviteLink(sessionId)` (CC-COUPLE-1) → `{ token, url }`. Validate the
  session exists (the mint helper already does; surface a clean 404/400).
- On A's report page (`app/report/[sessionId]`), add a single, unobtrusive
  **"Invite your partner — Obvious or Oblivious?"** CTA that calls the mint API
  and reveals the link to copy (reuse the existing admin "Copy URL" interaction
  style from the follow-up-link surface). This is the ONLY edit to the report
  page — a button + a small copy-link panel. Do not restructure the report.

### 2. B-side: the guessing page — `app/couple/[token]/page.tsx`

Public route (mirror `app/follow-up/[token]/page.tsx` structure):

- Resolve the token via `getCoupleSessionByToken`. Invalid/expired → friendly
  "this link isn't valid" state. Already `completed` → jump straight to the saved
  reveal (idempotent; do not let B replay over a completed result).
- Intro: "{A's first name} wants to know how well you read them." Use A's first
  name if available (read-only, via the same name resolver the engine uses;
  fall back to "your partner" when name state isn't `specified`).
- Render the ~8–10 items from `coupleGameItems` (CC-COUPLE-2). For each: the item
  `prompt` phrased as a guess about A ("When {A} is under pressure, they most
  likely…"), single-pick over `item.options` (reuse the existing SinglePick
  picker component CC-138 wired into the assessment — do not build a new one).
- On submit, POST B's `{ itemId → optionId }` map to the API (Task 3).

### 3. POST handler — `app/api/couple/[token]/route.ts`

Mirror `app/api/follow-up/[token]/route.ts`:

- Load the couple session by token; load A's session
  (`partner_a_session_id`) and obtain A's `InnerConstitution` (re-derive from
  `sessions.answers` if needed, the same way the report path does — do NOT add a
  new engine entry point; reuse the existing one).
- For each item: `enginePredicted = item.predict(icA)`; build the
  `CoupleGameItem` (`selfAnswer = enginePredicted`, `partnerGuess = B's pick`),
  and `revealType = resolveReveal({ selfAnswer, partnerGuess, enginePredicted,
  options: item.options })` (CC-COUPLE-2). Items with `enginePredicted === null`
  are recorded but flagged `scored: false`.
- `saveGameResults(token, { items, playedAt })` (CC-COUPLE-1) — flips status to
  `completed`. Return the resolved results for the reveal screen.

### 4. Reveal screen

- Render per-item: B's guess, a warm one-line "read" of A, and the reveal-type
  message. Carry **all five** reveal-language blocks verbatim from the notes
  (`uploads/50_degree_life_relationship_marriage_product_notes.md` → "Reveal
  Types") so the symmetric Phase-2 pass needs no copy work — even though only
  three can fire now.
- Header score (spec §4): **Legibility** = % of *scored* items where
  `partnerGuess === selfAnswer`, shown **with** a second line (e.g. count of
  Oblivious/Loving-Misread items). **No single compatibility verdict number.**
- Close with a soft prompt toward the serious module ("Want the deeper read? The
  Partner Trajectory…") — copy only, no new route.

## Safety floor (spec §5 — enforce, do not soften)

- B sees the **reveal language only** — never A's individual report, scores, or
  card text. The report layer stays consent-gated; this CC does not expose it.
- All reveal copy is the gift-under-fear, "engine can't see the room" register
  already written in the notes. Do not generate new judgmental copy.
- Nothing B submits is written into A's `sessions.answers` — it lives only in the
  couple row's `game_results` (CC-COUPLE-1 invariant).

## Read First (Required)

- `docs/couple-module-mvp-spec.md` (§1, §3, §4, §5).
- `uploads/50_degree_life_relationship_marriage_product_notes.md` — "Reveal
  Types" (the five language blocks) + "Game Modes / Mode 1".
- `app/follow-up/[token]/page.tsx` + `app/api/follow-up/[token]/route.ts` (the
  token-page + handler pattern to mirror).
- `app/report/[sessionId]/…` (where the CTA goes; find the report container).
- `lib/coupleSession.ts`, `lib/coupleGameItems.ts`, `lib/coupleReveal.ts`,
  `lib/coupleInviteLink.ts`, `lib/coupleTypes.ts` (the pieces this wires together).
- The SinglePick picker component CC-138 used in `app/assessment/page.tsx` (reuse it).
- The name resolver used by the engine/report (for A's first name).

## Allowed to Modify (exhaustive)

- NEW `app/couple/[token]/page.tsx` (+ any small co-located client component).
- NEW `app/api/couple/[token]/route.ts`.
- NEW `app/api/couple/mint/route.ts`.
- `app/report/[sessionId]` container — the CTA button + copy-link panel ONLY.
- NEW `tests/audit/coupleFlow.audit.ts` (a flow-level assertion; see below).

Nothing else. No DB schema change, no new migration, no edit to the individual
engine, no edit to `coupleGameItems` / `coupleReveal` / `coupleSession` (consume
them as-is — if one is missing a capability, STOP and report rather than editing it).

## Out of Scope (do NOT build)

- A-side self-answer pass / symmetric play / Mirror Blind + Hidden Pattern
  (next CC; needs an `a_self_answers` column).
- Couple report (Aim Exchange / Grip Loop / Appreciation) — CC-COUPLE-4.
- The calibration tap into the typing surface — CC-COUPLE-5.
- The other four game modes.
- Any auth/identity for B beyond holding the token.

## Bash Commands Authorized

- `npx tsc --noEmit`, `npm run lint`, `npm run build`
- run the new `coupleFlow` audit
- a local manual round-trip against the dev server / dev DB (mint → open → submit
  → reveal) if useful
- `grep` / `rg`

## Acceptance Criteria

1. `npx tsc --noEmit` clean; `npm run lint` clean; `npm run build` succeeds.
2. End-to-end on dev: mint a link from a real A session, open `/couple/{token}`,
   submit B's guesses, see a reveal with a Legibility line + per-item reveals;
   re-opening the token shows the saved reveal (no replay).
3. Reveal types observed are only Obvious / Oblivious / Loving Misread; null-predict
   items are flagged unscored, never forced into a reveal.
4. Safety floor holds: B never sees A's report/scores/cards; B's guesses are NOT
   in `sessions.answers` (verify the A session row is unchanged).
5. No score that reads as a compatibility verdict; Legibility always paired with
   its second line.
6. No file outside the Allowed-to-Modify list edited; no schema/migration change;
   no individual-engine edit.

## Report Back

- Screenshots or a text transcript of the dev round-trip (mint → play → reveal).
- The reveal distribution on a couple of real A sessions (which items fired
  Obvious vs Oblivious vs Loving Misread; how many were unscored/null-predict).
- Confirmation A's `sessions.answers` is untouched after B submits.
- The Legibility computation + the second-line content.
- Any item whose `prompt` needed rephrasing from first-person ("you") to
  guess-about-A ("they/{name}") and how you handled it generically.
- Any ambiguity decision (esp. the report-page CTA placement + the A-name
  resolver path).
