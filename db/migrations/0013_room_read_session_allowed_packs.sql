-- CC-187 — store which packs a Room Read session was generated from.
--
-- Additive nullable column; existing rows (created pre-CC-187) keep
-- loading and readers treat null as `["academic"]` (the
-- DEFAULT_PACK_ID in lib/games/roomRead/packs.ts). New rows persist
-- the entitlement-resolved `allowedPacks` list at creation so
-- reveal/replay/score paths see the exact pool that fed generation
-- without re-deriving from the live CARDS pool.
--
-- IDEMPOTENT (IF NOT EXISTS) — safe to apply via
-- `scripts/_scratch_apply_0013_column.ts` even if the drizzle-kit
-- journal chain is out of sync with this DB (see CC-184 / 0012).

ALTER TABLE "room_read_sessions"
  ADD COLUMN IF NOT EXISTS "allowed_packs" text[];
