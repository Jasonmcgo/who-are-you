# Card Schema (Canonical)

## Purpose

Define a consistent structure for all cards so that:

- inputs are standardized
- signals are derivable
- provenance is preserved
- interpretation is consistent

---

## Card Object

Each card must conform to:

```json
{
  "card_id": "formation | context | role | temperament | conviction | pressure | contradiction | agency | sacred",
  "version": "v1",
  "inputs": [],
  "derived_signals": [],
  "confidence": "low | medium | high",
  "provenance": [],
  "display_name": "(optional) user-facing label string"
}
```

### `display_name`

Optional. A user-facing label that may differ from the canonical card name. The canonical name (`card_id`) is used in canon — signal `from_card`, tension references, signal-library entries, all internal provenance — and never changes. The `display_name` is used by the UI when the card is shown to the user. If `display_name` is absent, the UI uses the canonical card name.

Example: the Temperament card may carry `display_name: "Four Voices"` so the user reads "Four Voices" while every signal still binds to `from_card: "temperament"`.

---

## Question Types

A card's questions belong to one of three types:

- **`forced`** — single-choice forced-pick. The user selects exactly one option from a list of two or more. Each option emits a single signal (or no signal). v1 default for short, decisive prompts.
- **`freeform`** — open-text response. The user writes a free-form answer. Signals are derived by the runtime extractor from the response text.
- **`ranking`** — ordered list. The user receives N items and orders them. Each item emits its signal at a strength derived from the position the item occupied in the user's order, per `signal-mapping-rule.md` § Ranking Question Signal Emission.

A `ranking` question presents N items. Each item has a stable `id`, a user-facing presentation (either `label` + optional `gloss`, or — in the Temperament-row variant — `voice` + `quote`), and a `signal` field that names the signal id the item carries when ranked. The user's answer is the ordered list of item ids; position 0 = ranked first.

### Ranking primitive: item-count rule

> **Three minimum, four default, five maximum. Above five, restructure.**

The engine's ranking primitive forces the user to resolve which of N items wins when they're in real competition. That cognitive job has a hard upper bound on items.

- **3 items minimum** — Below this, prefer forced-choice or another primitive entirely. A ranking of 2 is a forced-choice in disguise.
- **4 items default** — Cleanest aggregate signal across the broadest user population. Standard for Q-S1, Q-S2, Q-T1–Q-T8, the Q-S3-close / Q-S3-wider / Q-E1-outward / Q-E1-inward parent rankings, and all cross-ranks.
- **5 items maximum** — Acceptable when the domain genuinely requires that resolution and no clean way exists to split it into two parents. Q-C4 (Individual / System / Nature / Supernatural / Authority) is the canonical exception — the five attribution categories don't split cleanly into two parents.
- **6+ items forbidden** — When a domain needs more than five items, use the **multi-stage ranking pattern** (see `question-bank-v1.md` § Ranking Question Schema).

For the 5-item case, positions 1 and 2 (and the relative order of 1 vs. 2) carry the high-confidence signal; positions 4 and 5 are treated as low-confidence "also present" per `signal-mapping-rule.md`. The 4-item default reads cleanly across all positions on both desktop and mobile.

Empirical defense: below three, ranking collapses into forced-choice with no resolution to learn from. Above five, the user stops resolving and starts approximating; the middle of the list becomes noise. The 8-card iteration cycles and Michele's test session are the validation evidence.

---

## Break Interstitial Type

A card may include break interstitials between its questions. A break is not a question and produces no signals. It exists in the question flow to give the user a pause.

Schema:

```ts
type BreakInterstitial = {
  break_id: string;          // e.g. "B-T1"
  card_id: CardId;           // the card this break appears in
  type: "break";             // discriminator
  position_after: string;    // the question_id this break appears immediately after (e.g. "Q-T3")
  text: string;              // the prose shown (e.g. "pause. take a breath.")
  action_label: string;      // the button text (e.g. "ready")
};
```

The user may scroll past the break freely; the action button advances the flow. The engine ignores breaks during signal derivation. Break entries live in `question-bank-v1.md` alongside the questions of the card they belong to.