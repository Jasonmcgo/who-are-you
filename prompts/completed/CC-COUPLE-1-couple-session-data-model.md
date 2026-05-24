# CC-COUPLE-1 — Couple-session data model + invite-link mint (plumbing only)

> Numbering: named sub-track ("CC-COUPLE-N"). Reconcile to the global CC sequence
> at commit time if you prefer a flat number — no behavior depends on the name.
> First brick of the couple module (spec: `docs/couple-module-mvp-spec.md`).

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass.
Do not stop for confirmation between steps. On ambiguity, apply the
codebase-faithful interpretation, proceed, and flag it. Permission bypass is
on; the discipline below is scope.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.
**Independent of CC-138** (CC-138 edits the typing derivation; this adds a new
table + helpers in new files and touches no individual-engine code). Safe to run
in parallel with, or after, CC-138.

## Execution Directive

- One pass, no mid-task confirmation prompts.
- **Plumbing only.** This CC adds: a DB table, an invite-link mint helper, a
  small data-access module, and the TypeScript types for the game tuple. That is
  the whole job.
- **NO UI. NO game items. NO reveal logic. NO couple report. NO derivation that
  reads the new table.** Those are CC-COUPLE-2/3/4 — do not anticipate them.
- **Migration is DEV-ONLY.** Generate the Drizzle migration + meta snapshot and
  apply it to the dev DB. **Do NOT apply to prod.** The prod migration chain is
  mid-reconcile (CC-139, snapshots 0006/0007) and is gated on owner sign-off; a
  prod apply of this new migration waits behind that runbook.

## Context

We are building the couple module (Obvious or Oblivious? + Partner Trajectory).
The MVP wedge is the game: Partner A (who has an individual session) invites
Partner B by link; each answers for themselves and guesses the other's answer.
This CC lays the persistence + invite spine so the later CCs have somewhere to
read and write. Nothing user-facing ships here.

The invite link mirrors the existing follow-up link exactly: `lib/followUpLink.ts`
mints an unguessable `crypto.randomBytes(24).toString("base64url")` token, stores
it as a primary key, and returns `{ token, url }`. Reuse that pattern verbatim —
do not invent a new token scheme.

Game results are stored as JSONB **on the couple-session row**, NOT merged into
`sessions.answers`. A partner's guesses are *about another person* and must never
contaminate that person's individual answer set. This is a hard invariant.

## Tasks

### 1. Schema — `db/schema.ts`

Add one table, following the file's existing conventions (uuid PK
`defaultRandom()`, timezone timestamps, cascade-delete FKs, JSONB for flexible
state):

```ts
export const coupleSessions = pgTable("couple_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Unguessable token Partner B uses to join (same scheme as follow_up_links).
  invite_token: text("invite_token").notNull().unique(),
  // Partner A always has a full individual session.
  partner_a_session_id: uuid("partner_a_session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  // Partner B may join via the game without a full individual session in MVP,
  // so this is nullable; SET NULL (not cascade) so deleting B's later-created
  // session doesn't destroy the couple row.
  partner_b_session_id: uuid("partner_b_session_id")
    .references(() => sessions.id, { onDelete: "set null" }),
  // "invited" -> "b_joined" -> "completed". Plain text + named constant; no enum
  // churn for a 3-state field still in flux.
  status: text("status").notNull().default("invited"),
  // The Obvious-or-Oblivious result payload (array of game tuples; see types).
  // NULL until the game is played. JSONB so the tuple shape can evolve without
  // a migration, matching the sessions.answers convention.
  game_results: jsonb("game_results"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

### 2. Types — new file `lib/coupleTypes.ts`

Define the game tuple from spec §3. These are the only couple types this CC
introduces:

```ts
export type CoupleGameDirection = "a_guesses_b" | "b_guesses_a";

export interface CoupleGameItem {
  itemId: string;              // which game item (item bank lands in CC-COUPLE-2)
  direction: CoupleGameDirection;
  selfAnswer: string;          // the subject's own answer
  partnerGuess: string;        // the guesser's prediction of selfAnswer
  selfKnows?: boolean;         // optional: does the subject think this is obvious about themselves?
  sourceSignal: string;        // engine signal/claim this item maps to (load-bearing for calibration)
}

export interface CoupleGameResults {
  items: CoupleGameItem[];
  playedAt: string;            // ISO timestamp
}

export type CoupleSessionStatus = "invited" | "b_joined" | "completed";
```

### 3. Invite-link mint — new file `lib/coupleInviteLink.ts`

Parallel `lib/followUpLink.ts` closely. `mintCoupleInviteLink(partnerASessionId)`:
verifies the A session exists (clean error if not), generates a token via the
**existing** `generateUnguessableToken()` (import it from `./followUpLink` — do
not duplicate the crypto), inserts a `couple_sessions` row, returns `{ token, url }`
with `PUBLIC_PATH = "/couple"`. No route file in this CC (UI is CC-COUPLE-3).

### 4. Data access — new file `lib/coupleSession.ts`

Thin, typed helpers over the table (no business logic, no engine reads):

- `getCoupleSessionByToken(token)` → row or null.
- `attachPartnerB(token, partnerBSessionId)` → sets `partner_b_session_id`,
  flips `status` to `"b_joined"`, bumps `updated_at`. Transactional.
- `saveGameResults(token, results: CoupleGameResults)` → writes `game_results`,
  flips `status` to `"completed"`, bumps `updated_at`. Transactional. Validates
  the payload is well-formed `CoupleGameResults` before writing.

Keep status strings centralized as a named const using `CoupleSessionStatus`.

### 5. Migration (DEV ONLY)

Generate the Drizzle migration + meta snapshot for the new table via the repo's
normal generate command. Apply to the **dev** DB and verify the table exists.
**Do not touch prod.** Add a one-line note to the migration's companion runbook
area (or a short comment) that prod apply is deferred behind CC-139 sign-off.

### 6. Proof (since the executor has working tsx; my sandbox does not)

Add a scratch verifier (e.g. `scripts/_scratch_couple1_roundtrip.ts`, gitignored
like the other `_scratch_*`) that: mints a link for an existing dev session,
looks it up by token, attaches a fake B session id, saves a tiny
`CoupleGameResults`, and reads it back — proving the round-trip end to end. Print
each step. This is throwaway proof, not a committed test.

## Read First (Required)

- `db/schema.ts` (table conventions; the `sessions`, `follow_up_links`,
  `answer_history` patterns).
- `lib/followUpLink.ts` (the exact mint pattern to mirror).
- `lib/db.ts` / `db/index.ts` (`getDb()` and the migration/generate commands).
- `docs/couple-module-mvp-spec.md` (§3 data model, §5 safety floor — esp. the
  "guesses never merge into sessions.answers" invariant).
- `db/migrations/meta/0007_snapshot.json` (the current migration head you build on).

## Allowed to Modify (exhaustive)

- `db/schema.ts` (add `coupleSessions` only — touch no existing table).
- NEW `lib/coupleTypes.ts`, NEW `lib/coupleInviteLink.ts`, NEW `lib/coupleSession.ts`.
- NEW Drizzle migration file + `db/migrations/meta/*` snapshot for this table.
- NEW gitignored `scripts/_scratch_couple1_roundtrip.ts`.

Nothing else. No edits to existing tables, no individual-engine files, no
`sessions.answers` handling, no UI, no routes, no item bank.

## Out of Scope (do NOT build)

- Game item bank + reveal-type resolver (CC-COUPLE-2).
- Invite/answer/guess UI, the `/couple/[token]` route (CC-COUPLE-3).
- Couple report composition / Aim Exchange / Grip Loop (CC-COUPLE-4).
- Calibration tap into the typing surface (CC-COUPLE-5).
- Any prod migration apply.
- Reading `game_results` into any derivation or render.

## Bash Commands Authorized

- `npx tsc --noEmit`, `npm run lint`
- the Drizzle generate + **dev** migrate/push commands
- run the scratch round-trip verifier against the dev DB
- `grep` / `rg`

## Acceptance Criteria

1. `npx tsc --noEmit` clean; `npm run lint` clean (pre-existing warnings ok).
2. `couple_sessions` table created in dev; migration + meta snapshot generated;
   prod untouched.
3. `mintCoupleInviteLink` round-trips: mint → lookup-by-token → attachPartnerB →
   saveGameResults → read back, all verified by the scratch script (paste output).
4. Token scheme is the **imported** `generateUnguessableToken` — no duplicate crypto.
5. No existing table altered; no individual-engine file touched;
   `sessions.answers` handling untouched.
6. No UI, no route, no item bank, no derivation reads the new table.

## Report Back

- The final `coupleSessions` column list + the FK delete behaviors chosen.
- The new files added and a one-line purpose each.
- The migration filename + confirmation it applied to dev and NOT prod.
- The scratch round-trip output (the headline proof).
- Confirmation no existing table / engine file / `sessions.answers` was touched.
- Any ambiguity decision (esp. anything about the generate/migrate commands).
- Flag: prod apply of this migration is deferred behind the CC-139 runbook.
