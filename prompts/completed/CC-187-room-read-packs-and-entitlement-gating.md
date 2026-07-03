# CC-187 — Room Read packs + entitlement gating

> **Product context (owner).** Room Read is going from one card set to a *store of packs.*
> The assessment stays **free**. Partner and Family games sit behind an **annual pass**, and
> individual themed **packs** are one-time purchases (e.g. a holiday-movie pack, a fantasy-
> school pack). The existing 840-card witty set is now pack **`academic`** (already tagged in
> `lib/games/roomRead/cards.data.json` — every card has `"pack": "academic"`). This CC makes
> `pack` a first-class, enforced field and gates which packs a given game may draw from.
>
> Keep the mechanic intact: the engine still picks a player per card by
> `Σ (tag weight × signal strength)`. A pack is the **same trait-skeleton in a different
> costume** — it does NOT change scoring, themes, or tags. All this CC adds is (1) a real
> `pack` field and (2) a pool filter + entitlement seam in front of generation.

## Scope — three parts

### Part A — make `pack` a real, validated field

1. **Type** (`lib/games/roomRead/types.ts`): add `pack` to `RoomReadCard`. Introduce a
   `PackId` type alongside `TagId` (free-form `string`, same rationale — the pack space is
   negotiated between the card author and this registry, not a hard enum). Add a single
   source-of-truth `KNOWN_PACKS` set/registry somewhere sensible (e.g. a new
   `lib/games/roomRead/packs.ts`) listing the packs that exist today: at minimum
   `"academic"`. Each entry should carry a human label + a `requiresEntitlement: boolean`
   (academic = `false`; everything else = `true`) so the gating layer and any future store UI
   read from one place.
2. **Loader back-compat** (`lib/games/roomRead/cards.ts`): if any card is missing `pack`,
   default it to `"academic"` at load time so an un-tagged card can never silently fall out of
   every pool. (Today all 840 carry it; this is belt-and-suspenders for hand edits.)
3. **Validator** (`scripts/validateCardLibrary.ts`): add `pack` checks — **error** if a card
   has no `pack`; **error** if `pack` is not in `KNOWN_PACKS`; and a per-pack coverage
   **warning** if a pack does not span all 8 themes (a pack that can't fill all 8 themes can't
   field a full game on its own — see Part B's hard failure). Keep all existing checks. Print a
   per-pack card count in the summary.

### Part B — filter the card pool by allowed packs (end to end)

The pool is consumed in `generate.ts` at `CARDS.filter(...)` (~line 143). Thread an
**`allowedPacks: PackId[]`** through the whole creation path:

- `GenerateRoomReadGameArgs` (`generate.ts` ~line 103): add `allowedPacks?: PackId[]`.
  Default to `["academic"]` when omitted (back-compat). In the round loop, add
  `&& allowedPacks.includes(c.pack ?? "academic")` to the candidate filter.
- **Hard-fail with a clear message** if the allowed packs collectively don't cover all 8
  themes *before* the round loop — don't let it surface as the existing mid-loop
  `no eligible card for theme=…` throw. Message should name the missing theme(s) and the
  allowed packs, e.g. `Room Read: allowed packs [holiday_chaos] don't cover theme "trust"`.
- `createRoomReadSession` (`persistence.ts` ~line 179) + `CreateRoomReadSessionArgs`: accept
  `allowedPacks` (resolved by Part C, not passed raw from the client), pass it into
  `generateRoomReadGame`, and **persist it** on the session row so reveal/replay/score are
  consistent with what was generated.
- **Migration**: add `allowed_packs text[]` to `room_read_sessions` (Drizzle schema + a new
  numbered migration). Existing rows / null → treat as `["academic"]` on read. NOTE the known
  migration-journal drift on this DB (see CC-184): `drizzle-kit migrate` fails on 0003's
  `llm_rewrites` re-add. Make the column add **idempotent** (`ADD COLUMN IF NOT EXISTS`) and,
  if `migrate` won't run, provide a one-off apply script mirroring
  `scripts/_scratch_apply_0012_column.ts` rather than fighting the journal.
- Admin create route (`app/api/admin/games/room-read/sessions/route.ts`): pass the
  entitlement-resolved `allowedPacks` through (see Part C).

### Part C — entitlement seam (NOT full billing)

Do **not** build Stripe/payments in this CC. Build the **seam** the billing system will plug
into later, with a stub policy that's correct today:

- Add `resolveAllowedPacks(context): PackId[]` (e.g. in `lib/games/roomRead/entitlements.ts`).
  Input: whatever identifies the purchaser/room today (admin id / creator session — match what
  `created_by_admin` already carries). Output: the packs this game may draw from.
- **Stub policy (today):** `academic` is always allowed (it's free / the base set). Any
  `requiresEntitlement` pack is allowed only if an entitlement record says so. Since there's no
  billing yet, back the entitlement lookup with a single clearly-marked stub
  (`hasPackEntitlement(context, pack) => boolean`) that currently returns `true` only for
  `academic` and is the **one place** real billing wiring lands later. Leave a `// TODO(billing)`
  with the intended model in a comment: assessment free; annual pass gates partner/family game
  *creation*; per-pack purchase adds that pack to the allowed set.
- The admin route resolves `allowedPacks` via this seam (it may also accept an explicit
  `allowedPacks` override for admin/testing, validated against `KNOWN_PACKS`), never trusting a
  raw client list for entitlement.

## Do NOT

- Do NOT change the engine scoring, the 8 themes, the tag vocabulary, or rename `theme`
  (`pack` is a NEW, separate dimension — they are not the same axis).
- Do NOT build Stripe / real payments / a store UI. Part C is a seam + stub only.
- Do NOT break existing sessions: rows without `allowed_packs` must behave exactly as today
  (`["academic"]`). Reveal/replay read packs from the stored `generated_game`, never re-derive.
- Do NOT special-case any one pack name in generation logic — the filter is generic over
  `allowedPacks`.
- Do NOT commit or push (sandbox: prepend `rm -f .git/index.lock` to any git you hand Jason).

## Acceptance

- `pack` is required + validated; `validateCardLibrary.ts` errors on missing/unknown pack and
  reports per-pack counts + a coverage warning. The current library passes (840 academic, all
  8 themes covered).
- `generateRoomReadGame` filters by `allowedPacks` (default `["academic"]`); a game created
  with only `["academic"]` is byte-identical to today's behavior (no regression in
  distribution/fit tests).
- A game whose allowed packs don't cover all 8 themes fails **at creation** with a clear,
  named-theme error (not a mid-loop throw, not a 500).
- `allowed_packs` persists on the session and is what reveal/score read; old rows default to
  `["academic"]`.
- `resolveAllowedPacks` + `hasPackEntitlement` exist as the single billing seam; academic is
  free, entitlement-required packs are gated, with a `TODO(billing)` describing the pass +
  per-pack model.
- `roomRead` suite green; `npx tsc --noEmit` + lint + `npm run build` clean. Run the full suite
  at the bundle boundary; **flag-don't-fix** any pre-existing reds (the known assessment-audit
  debt from CC-183/185), don't absorb them into this CC.

## Report back

- The `RoomReadCard.pack` type + `KNOWN_PACKS` registry shape (labels + `requiresEntitlement`).
- The exact candidate-filter line in `generate.ts` and the all-8-themes pre-check + its error
  text.
- Migration name + whether `drizzle-kit migrate` ran or the scratch-apply path was needed.
- The `resolveAllowedPacks` / `hasPackEntitlement` signatures and the stub policy, with the
  `TODO(billing)` text.
- tsc / lint / build + suite status; any reds flagged not fixed.
