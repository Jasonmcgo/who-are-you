# CC-177-ROOM-READ-UI-AND-SELF-CONFIRM

> Cowork-chat CC, 2026-05-25. Final piece of the Room Read chain. Builds the
> player-facing UI (join / vote / waiting / reveal / scoreboard), the admin
> "Create Room Read Game" control, and — critically — the **subject self-confirm**
> step that populates `room_read_calibration_events.subject_self_confirm`, closing
> the calibration flywheel so the game collects self-confirmation data from day
> one. Consumes the CC-176 API contract; adds exactly ONE new route + one small
> persistence function (the self-confirm writer CC-176 deferred).

## Dependencies — run AFTER CC-175 / CC-175.1 / CC-176 (all done, verified)

Consume, do not modify: `lib/games/roomRead/*` (core), the assessment engine, and
the CC-176 persistence/route contract. The ONLY backend addition allowed here is
the self-confirm route + its persistence function (see §3).

## Conventions to mirror (verified in repo)

- Player page: mirror `app/couple/[token]/page.tsx` — a `"use client"` component,
  `use(params)` for the token, `useState`/`useEffect`, `fetch('/api/games/room-
  read/${token}')` for state and POST for actions. Types at the top of the file
  must match the CC-176 payloads (`RoomReadStateForToken`, `RevealedRoundPayload`,
  `SubmitGuessArgs`) exactly — copy them, don't re-derive.
- Admin control: mirror the existing "mint two-sided bond from two assessed
  sessions" control on `app/admin/sessions/page.tsx` (server page + client-
  component sibling like `CopySessionLinkButton`). Multi-select assessed sessions,
  POST to the admin create route, show a copyable join link.
- Styling: Tailwind core utility classes + the report fonts (Source Serif 4 /
  JetBrains Mono / Inter Tight, already in `app/layout.tsx`). Match the couple
  page's visual register — this is the same product surface.

## Part 1 — Admin "Create Room Read Game"

On the admin sessions surface, add a control to: multi-select 4–10 assessed
sessions, choose round count (4–10) and mode (default "classic"), and POST
`/api/admin/games/room-read/sessions` (the CC-176 admin route). On success show
the copyable join URL (`/game/room-read/<joinToken>`). Reuse the existing
copy-link affordance. Validation messages surface the route's existing errors
(player/round range, duplicates).

## Part 2 — Player game at `app/game/room-read/[token]/page.tsx`

A `"use client"` page driven by `GET /api/games/room-read/[token]` (the CC-176
state payload) + the action POSTs. Screens:

- **Join.** "Room Read: Body Card Journey / The room votes. The engine makes its
  read. The accused may plead their case." Show players; MVP identity = an
  `I am: [select player]` dropdown (tokenized auth is later). Persist the picked
  identity in component state (and `localStorage` keyed by token is acceptable
  here — this is the live app, not a sandboxed artifact).
- **Round.** Header from `BODY_CARD_LABELS[theme]` (title + subtitle) + the
  **round-intro prose** (deferred from CC-175.1 — author one short intro line per
  theme, e.g. Lens: "This round is about how people read reality: the pattern, the
  warning sign, the emotional weather, the human clue, or the thing everyone else
  walks past."). Then the card prompt. Vote tiles: one per player + "Both /
  Multiple, but for different reasons" (→ `guessedSpecial:"both"`) + "Nobody,
  thankfully" (→ `guessedSpecial:"nobody"`). "Submit Read" POSTs the guess; allow
  changing the vote until reveal (the route upserts).
- **Waiting.** "Waiting for the rest of the room… N of M submitted. The engine has
  already made its accusation." Poll `GET` for round status.
- **Reveal.** POST the reveal route (auto-fire when all voted, or an admin/host
  "Reveal the Room Read" button). Show: Room says (vote distribution, incl. the
  "both"/"nobody" tallies), Engine says (pick + `reason`), the **Verdict** (see
  §4), this round's per-player points, and the running scoreboard. "Next Body
  Card" POSTs `/next-round`.
- **Final scoreboard.** After the last round (session `complete`): winner + a
  title (MVP: "Pattern Whisperer" for the top score is enough; the brief's fuller
  title logic is optional).

## Part 3 — Subject self-confirm (THE calibration closer — required, not optional)

Per `project_room_read_calibration_flywheel`, self-confirmation outranks peer
guessing and is the highest-grade calibration label. CC-176 left
`subject_self_confirm` null; CC-177 makes it real:

- **New route** `POST /api/games/room-read/[token]/rounds/[roundId]/subject-
  confirm` (public, token-as-auth) → calls a new persistence function
  `setSubjectSelfConfirm({ joinToken, roundId, response })` that writes the JSON
  onto that round's `room_read_calibration_events` row. Shape:
  `{ subjectPlayerId, response: "yes" | "no" | "both", note?: string,
  confirmedAt }`. Idempotent-ish: last write wins for that round.
- **UI step on the Reveal screen:** when the viewer's selected identity ==
  `enginePick.playerId`, show a private prompt — "The engine read this as you.
  Does it land?" with **Yes, that's me / No, not really / Both, for different
  reasons** (+ optional one-line note) — and POST it to the new route. Only the
  engine-picked subject sees this; other players see the normal reveal.
- This is the only backend write CC-177 adds. Do NOT touch any other calibration
  field, scoring, or the engine.

## Part 4 — Verdict display copy (4 variants from the 3 core outcomes)

Core `getVerdict` emits `obvious` / `human_override` / `identity_fog` (do NOT
change it). Derive the 4th display copy at the UI from the core verdict + the
engine pick:
- `obvious` → "Obvious. The room and the engine agree. The accused may now stop
  pretending."
- `human_override` AND `enginePick.confidence === "high"` (or `isSplit === false`
  with a strong gap) → **Engine Dissent**: "The room saw the surface. The engine
  suspects deeper wiring."
- `human_override` otherwise → "Human Override. The engine made a principled
  accusation. The room brought different receipts."
- `identity_fog` → "Identity Fog. No clean consensus. Either the prompt is
  brilliant, or everyone needs snacks."
The optional "+1 best receipt" point is a host-awarded UI affordance — include a
simple "award best receipt" toggle if cheap, else defer and note it.

## Do NOT

- Do NOT modify `lib/games/roomRead/*`, the assessment engine, the CC-176 tables,
  or the existing CC-176 routes (consume them). The sole backend addition is the
  self-confirm route + `setSubjectSelfConfirm`.
- Do NOT re-implement scoring/verdict/winner client-side — render what the reveal
  payload returns.
- Do NOT leak the engine pick before reveal — the server already omits it; the
  client must not fetch it from elsewhere or infer it.
- Do NOT merge anything into `sessions.answers`.
- Do NOT commit or push. (Sandbox: prepend `rm -f .git/index.lock` to any commit
  command handed to Jason.)

## Acceptance

- Admin can create a game (4–10 players, 4–10 rounds) and copy the join link;
  out-of-range selections surface the route's error.
- A player can open the link, pick identity, vote (player / both / nobody), see
  the waiting state, and see the reveal with room distribution + engine pick +
  verdict + scores + scoreboard; "Next Body Card" advances; final screen shows the
  winner.
- Engine pick is never visible in the DOM/network before the round is revealed
  (verify in the open-round state).
- Subject self-confirm: as the engine-picked player, the reveal shows the
  confirm/deny prompt; submitting it writes `subject_self_confirm` on that round's
  calibration event (verify the row); non-picked players never see the prompt.
- All 4 verdict copies render for the right conditions.
- `npx tsc --noEmit` clean; `npx eslint` clean on new files; `npm run build`
  compiles the new routes/pages.

## Report back

- The files created (player page, admin control, self-confirm route + persistence
  fn) and confirmation nothing in `lib/games/roomRead/*` / engine / CC-176 tables
  was modified beyond the one self-confirm writer.
- A walk of one full game in the demo cohort: create → join → vote → reveal (with
  a screenshot or DOM dump showing the engine pick absent pre-reveal and present
  post-reveal) → a subject-confirm write (paste the resulting calibration-event
  row showing `subject_self_confirm` populated).
- tsc / lint / build status.
- Anything in the CC-176 contract that was awkward to consume from the client.
