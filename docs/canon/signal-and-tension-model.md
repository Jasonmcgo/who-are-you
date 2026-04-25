# Signal and Tension Model

## Purpose

Define how raw inputs become signals, and how signals interact to reveal tensions.

## Signal Definition

A signal is a directional tendency derived from one or more inputs.

A signal is not a label.  
A signal is evidence of a pattern.

Examples:
- Prioritizes truth over social harmony
- Adapts under economic pressure
- Shows moderate institutional skepticism
- Values stability under current responsibility load

### Optional fields

Signals derived from `ranking` questions (per `card-schema.md` § Question Types) carry an additional `rank?: number` field that records the position the underlying ranking item occupied — `1` for the item ranked first, `2` for the second, and so on. Signals derived from `forced` or `freeform` questions do not carry `rank`. See `signal-mapping-rule.md` § Ranking Question Signal Emission for how rank position maps to signal strength, and `signal-library.md` for which signal ids are `rank_aware`.

## Signal Interaction

Signals become useful when compared across cards.

Key comparisons:
- Conviction vs Pressure
- Conviction vs Agency
- Formation vs Conviction
- Context vs Agency
- Temperament vs Role
- Sacred Values vs Context

## Tension Object

A tension is detected when two signals create a meaningful pull, conflict, or unresolved tradeoff.

## Canonical Rules

1. A signal must be derived from one or more explicit inputs.
2. A tension must reference two or more signals.
3. No tension may be presented as fact without user confirmation.

## User Prompt Rule

Each tension must include a `user_prompt` field.

The prompt must:
- reflect the description

- invite validation, not assert truth
- maintain neutral, non-judgmental tone

Canonical format:

"This pattern may be present: [description].  
Does this feel accurate?"
4. Signals describe tendencies, not identity.
5. Tensions describe relationships between tendencies, not flaws.
6. All outputs must remain explainable through provenance.

```json

{
  "tension_id": "string",
  "type": "...",
  "description": "human-readable explanation of the tension",
  "signals_involved": [
    {
      "signal_id": "signal_a",
      "from_card": "conviction"
    },
    {
      "signal_id": "signal_b",
      "from_card": "pressure"
    }
  ],
  "confidence": "low | medium | high",
  "status": "unconfirmed | confirmed | rejected",
  "user_prompt": "This pattern may be present: [description]. Does this feel accurate?"
}
```

## Source Question Constraints

Some tensions are only meaningful when one or more of their signals originate from a specific `question_id`. For example, a "creator vs maintainer" tension requires that the creator signal come from an aspirational question while the maintainer signal come from a current-reality question — the same signal id sourced from the wrong question would collapse the tension's meaning. This constraint is expressed by adding a `Source Questions:` field to the tension block in `tension-library-v1.md`, immediately after `Signals:` and before `Description:`. The field lists each constrained signal with its required source `question_id`. Tensions without a `Source Questions:` field have no sourcing constraint and fire whenever their signal combination is present, regardless of origin. The canonical tension object schema is unchanged; `Source Questions:` is documentation that detection code must honor.

## Strengtheners

Some signals corroborate a tension without being part of its firing rule. A tension's `Strengtheners:` field, positioned immediately after `User Prompt:` in its `tension-library-v1.md` block, lists signal ids that raise the tension's `confidence` when present in the same session as an already-detected tension. Strengtheners describe corroborating evidence; they are not part of detection.

Strengtheners never fire a tension on their own. If the tension's canonical `Signals:` rule was not satisfied by the session's answers, the tension is not produced, and any strengthener signals present in the session are ignored for that tension. This invariant keeps the deterministic detection spine intact: every tension still requires structured-signal evidence to exist.

The confidence bump is binary: `medium` → `high`. There is no additive accumulation across multiple strengthener matches — if at least one declared strengthener is present, confidence is raised to `high`; otherwise it is left unchanged. No new value is introduced to the `confidence` enum.

Each strengthener signal's metadata (producing questions, canonical card, runtime status) is maintained in `signal-library.md`. A signal that strengthens one or more tensions carries a `strengthens_tensions:` field in its entry there. `signal-library.md` is the authoritative registry; `tension-library-v1.md` declares only the relationship at the tension side.

## Rank-Aware Signals

Some signals carry rank metadata. A `rank_aware` signal — one whose entry in `signal-library.md` declares `rank_aware: true` — is emitted by a `ranking` question and carries a `rank` field whose value is the position the underlying item occupied in the user's order (`1` for first, `2` for second, and so on). Tensions that consume rank-aware signals may filter by `rank` to make detection decisions (for example, "fires when signal X has rank ≤ 2", or "fires when signals X and Y both have rank ≤ 2"). Tensions that do not filter by `rank` continue to fire as long as the signal is present at any rank — `rank` is additive metadata, not a precondition. The position-to-strength mapping itself is canonical and lives in `signal-mapping-rule.md` § Ranking Question Signal Emission.