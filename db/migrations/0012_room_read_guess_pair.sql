-- CC-184 — cross-card scoring: name the two.
--
-- A guess on a split (cross) card can now be a PAIR — the voter names
-- the two players the engine is torn between. Additive nullable
-- column; existing rows (single-player guesses, "both"/"nobody"
-- specials) keep loading. Legacy `guessed_special = 'both'` rows
-- carry no player ids and are scored as a zero-info guess per the
-- CC's "treat as 0" rule.

ALTER TABLE "room_read_guesses"
  ADD COLUMN IF NOT EXISTS "guessed_player_id_2" text;
