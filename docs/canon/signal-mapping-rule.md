## Signal Mapping Rule

Every answer option must map explicitly to one or more signal_ids.

No answer option should exist without a defined signal outcome.

Signals must be:
- deterministic (no guessing)
- traceable to a specific question_id
- consistent across the system

If an answer does not produce a signal, the question is incomplete.

---

## Ranking Question Signal Emission

Ranking questions (per `card-schema.md` § Question Types) emit signals deterministically from the user's order.

A ranking question of N items emits N signals — one per item — each carrying a `rank: n` field where `n ∈ {1, 2, …, N}`. The rank value records the position the underlying item occupied in the user's order (`1` = ranked first).

Strength mapping is canonical:

- **Position 1** emits the item's signal at strength `high`.
- **Position 2** emits the item's signal at strength `medium`.
- **Positions 3 through N** emit the item's signal at strength `low`.

For 5-item rankings specifically, positions 4 and 5 are additionally noted as "also present" — the signal is recorded at strength `low` and should be treated by tension detection as low-confidence corroborating evidence rather than primary evidence. This is a tension-author concern, not an engine flag; the engine emits the same `low` strength regardless of N, and tensions consuming rank-aware signals decide whether to filter on `rank`.

Tensions consuming rank-aware signals may read the `rank` field to make detection decisions (e.g., "fires when signal X has rank ≤ 2", or "fires when signals X and Y both have rank ≤ 2"). The current canonical tensions (T-001 through T-012) are not rewritten to use `rank` in CC-005; tension-side rank-awareness is authored in subsequent CCs. Tensions that do not filter by `rank` continue to fire as long as the signal is present at any rank — `rank` is additive metadata, not a precondition.

Source: `docs/design-spec-v1.md` § 3.7 and § 8 (open call 3) authorize this strength model.