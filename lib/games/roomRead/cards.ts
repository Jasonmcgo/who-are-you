// CC-175 + CC-182 — Room Read card library.
//
// The library now loads from `cards.data.json` (840 cards, generated from
// the 2026-05-26 cohort report dump and tagged per
// `room-read-card-tagging-spec.md`). The seed library of 40 hand-authored
// cards has been retired in favor of the full set.
//
// Integrity guarantees (enforced by `scripts/validateCardLibrary.ts`,
// which MUST pass before a new `cards.data.json` is committed):
//   - every `tag` is a valid engine `TagId` (a tag the signal builder in
//     `signals.ts` produces) — an unknown tag scores 0 and the card never
//     appears, so this check is load-bearing;
//   - every `theme` is one of the 8 BodyCardTheme keys;
//   - every `id` is unique (the de-dup key in `generate.ts`);
//   - every prompt is a complete "Who's more likely to <verb> …?" sentence;
//   - each card has 2–4 tags with exactly one dominant (weight ≥ 0.7).
//
// Because the validator guarantees `tag` ∈ TagId and `theme` ∈
// BodyCardTheme, the cast below is safe. (TS infers `string` for the JSON
// fields; the validator is the runtime contract.)
//
// NOTE on existing games: the reveal/lookup paths read each round's card
// from the session's stored `generated_game` snapshot, never from `CARDS`
// by id — so retiring the seed cards does not break games created before
// this swap.

import cardData from "./cards.data.json";
import type { RoomReadCard } from "./types";

export const CARDS: RoomReadCard[] = cardData as unknown as RoomReadCard[];
