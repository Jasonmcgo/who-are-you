# CC-COUPLE-7-TWO-SIDED-BOND

> Cowork-chat CC, 2026-05-24.
> Turn the couple game's one-sided invite into a real two-sided **bond**
> between two assessed people, named at creation. This is the foundation
> the shareable game link and Mode 2 ("who's more likely") sit on. It does
> NOT build Mode 2 gameplay — that's CC-COUPLE-8.

## Product decisions (owner, 2026-05-24)

- **The token is the report permalink.** A person's `/report/[sessionId]`
  link IS their identity token. The bond is created from two such links /
  sessionIds. No new per-person token type.
- **Both people are assessed.** The bond ties two real `sessions`
  (Partner A + Partner B). This is what unlocks the couple-specific /
  comparative Mode 2 later.
- **The sender names both.** Whoever creates the bond confirms both
  first names up front (prefilled from each profile's demographics,
  editable). Names are stored on the bond so prompts/reveal read right
  even when a profile left the name blank.
- **Output is one shareable game link** (`/couple/[token]`), playable by
  anyone, with both identities baked in.

## Current state (what exists)

- `mintCoupleInviteLink(partnerASessionId)` (`lib/coupleInviteLink.ts`)
  inserts a `couple_sessions` row with `invite_token` + `partner_a_session_id`,
  status `"invited"`. `partner_b_session_id` exists in the schema
  (nullable, ON DELETE SET NULL) but the Mode-1 game **never sets it** and
  Partner B is anonymous ("you").
- `/api/couple/mint` POST `{ sessionId }` → `{ token, url }`.
- `/api/couple/[token]` GET/POST resolves A's name via `firstNameOf(A's
  demographics)`; B has no name. (CC-COUPLE-6 — landing in parallel —
  resolves the subject's name+pronoun server-side into the prompts.)
- `attachPartnerB(token, sessionId)` helper exists but is uncalled.
- `CoupleGameDirection` already includes both `"a_guesses_b"` and
  `"b_guesses_a"`.

## Changes

### 1. Schema + migration (⚠️ manual prod ALTER)

`db/schema.ts` — add to `couple_sessions`, after `partner_b_session_id`:
```ts
  partner_a_name: text("partner_a_name"),
  partner_b_name: text("partner_b_name"),
```
Both nullable (no default needed). `partner_b_session_id` stays nullable
(back-compat with existing one-sided invited rows).

Generate migration `0010_*.sql`. Expected SQL (additive, safe):
```sql
ALTER TABLE "couple_sessions" ADD COLUMN "partner_a_name" text;
ALTER TABLE "couple_sessions" ADD COLUMN "partner_b_name" text;
```
**Vercel does not run migrate on deploy** — same as 0007/0008/0009. Report
the exact generated SQL so Cowork-chat can hand Jason the manual prod psql
ALTER. Do NOT run it against prod yourself.

### 2. `lib/coupleSession.ts`

- Add `partner_a_name: string | null` + `partner_b_name: string | null`
  to `CoupleSessionRow` and `castRow`.

### 3. `lib/coupleInviteLink.ts` — mint a two-sided bond

Extend `mintCoupleInviteLink` to accept the bond shape:
```ts
mintCoupleInviteLink(
  partnerASessionId: string,
  options: {
    baseUrl?: string;
    partnerBSessionId?: string;
    partnerAName?: string;
    partnerBName?: string;
  } = {}
)
```
- Verify A's session exists (as today). If `partnerBSessionId` is
  provided, verify B's session exists too (clear error if not).
- Trim names; store `null` for empty/whitespace.
- Insert with `partner_b_session_id` (when provided), `partner_a_name`,
  `partner_b_name`, and `status`:
  - both sessions present → `"b_joined"` (the bond is complete; reuse the
    existing status — no enum/migration change).
  - A only → `"invited"` (unchanged legacy path).
- Return `{ token, url }` as today.

Keep the function backward-compatible: existing callers passing only
`partnerASessionId` still mint a one-sided invited row.

### 4. `/api/couple/mint` route — accept the bond

Accept body:
```ts
{ partnerASessionId?: string; sessionId?: string;  // back-compat alias
  partnerBSessionId?: string; partnerAName?: string; partnerBName?: string }
```
- `partnerASessionId ?? sessionId` is required (keep the alias so the
  existing report-page mint button keeps working).
- Pass the bond fields through to `mintCoupleInviteLink`.
- Keep the CC-154 generic error copy + server-side logging contract
  exactly (never leak raw causes; 404 on "not found", 500 otherwise).

### 5. Creation surface — "Create couple game" (admin)

Add a minimal admin surface so the sender can build a bond by picking two
people and confirming names. The roster (`app/admin/sessions/page.tsx`)
already lists sessions with names — the lowest-friction home for this.

Add a "Create couple game" control that opens a small form:
- Two selects (Partner A, Partner B), each populated from the saved-session
  roster (id + display name). Disallow A === B (validate; friendly inline
  error).
- Two text inputs for the names, **prefilled** from each selected
  session's demographics first name (editable — this is "sender names
  both"). If a profile has no name, leave blank with placeholder
  "Partner A" / "Partner B".
- Submit → POST `/api/couple/mint` with all four fields → on success show
  the `/couple/[token]` URL with a copy-to-clipboard button (reuse the
  existing copy-button pattern; write the URL verbatim — see the Nat 404
  lesson: never concatenate).

Keep it client-side-light and in the existing admin visual language
(paper/serif/umber). This is an internal operator tool; no public
self-serve "paste two links" page in this CC (note as a future option).

### 6. Game route — thread BOTH names; name precedence

`/api/couple/[token]/route.ts`:
- Resolve each partner's display name with this precedence:
  `bond.partner_X_name` → `firstNameOf(X's demographics)` → `"Partner A"`/
  `"Partner B"`.
- The subject of the current Mode-1 round is still Partner A; the guesser
  is Partner B. Surface **both** names on the payloads:
  - `IntroPayload` / `RevealPayload`: add `partnerAName` (the subject — was
    `personName`; keep `personName` as an alias === partnerAName for
    back-compat with the page) and `partnerBName` (the guesser/player).
- **Coordinate with CC-COUPLE-6**: CC-COUPLE-6 resolves the subject's
  `{S}` token from the subject name + demographics pronoun. Feed the
  bond-resolved Partner A name into that resolver so `{S}` prefers the
  bond name over the raw demographics name. (If CC-COUPLE-6 hasn't landed
  yet, still pass the bond name where `personName` is used.)
- Pronouns: keep deriving from each session's demographics gender
  (CC-COUPLE-6's `subjectPronouns`); the bond stores names, not gender.

### 7. Page — use B's name; seam for Mode 2

`app/couple/[token]/page.tsx`:
- The intro line (currently `"${data.personName} already knows this about
  you…"`) can now address the player by name when present:
  `"${A} already knows this about you, ${B}. You may or may not."`
  (fall back to no-name phrasing when B name absent).
- Reveal header: where it reads "How clearly you read {A}", use B's name
  if present ("How clearly {B} read {A}") — keep it warm, optional name.
- Add a clearly-stubbed seam for Mode 2: if the bond has both sessions
  (status `"b_joined"`/`"completed"` AND `partner_b_session_id` set),
  render a disabled/"coming soon" entry like "Compare the two of you →"
  near the reveal. Do NOT build the comparative game — just the seam, so
  the both-assessed state is visible. (CC-COUPLE-8 fills it.)

## Do NOT

- Build Mode 2 comparative gameplay or scoring (CC-COUPLE-8).
- Add a new status enum value or change the status migration (reuse
  `b_joined` for a complete bond).
- Run the prod ALTER, commit, or push.
- Change scoring, predictors, decks, adjacency, or any engine read.
- Break the legacy one-sided mint (report-page "share" button must still
  work with `{ sessionId }`).
- Leak raw mint errors to the client (keep CC-154 generic copy).

## Acceptance

- `tsc --noEmit` clean; lint clean.
- Local: apply migration 0010. Create a bond (Michele + a second
  assessed person) via the admin form → returns a `/couple/[token]` link;
  the row has both `partner_*_session_id` and both `partner_*_name`,
  status `b_joined`.
- Open the link → intro + prompts render with A's bond name (and B's name
  in the intro/reveal where wired); play through → reveal saves and
  renders. Legacy one-sided invite (mint with only `sessionId`) still
  works end-to-end.
- The "Compare the two of you" seam appears only when both sessions are
  bonded.
- Couple-flow audit green; full suite green at close.

## Report back

- Files modified/created.
- Exact generated `0010` SQL (for the manual prod ALTER).
- The name-precedence chain as implemented; confirm legacy mint untouched.
- Confirm Mode 2 is only a seam (no comparative logic added).
- Audit results.

## Next after this closes

- CC-COUPLE-8 — Mode 2 comparative ("who's more likely"): both ICs are
  now reachable from the bond; build the comparative prompt set + scoring
  table from docs/obvious-oblivious-game-spec.md (Mode 2 section) +
  Jason's hand-authored per-couple questions.
- Optional: direction choice (let either partner be the subject for a
  Mode-1 round) now that both are named/assessed.
