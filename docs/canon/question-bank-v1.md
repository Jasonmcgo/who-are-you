# Question Bank v1 (Alpha)

## Purpose

Define the first working set of questions across core cards.

Each question must:
- map to a card
- produce a signal
- support future tension detection

---

## Ranking Question Schema

Ranking questions are authorized by `card-schema.md` § Question Types. A ranking question presents 4 or 5 items and asks the user to order them; each item emits its signal at a strength derived from the position the item occupied in the user's order, per `signal-mapping-rule.md` § Ranking Question Signal Emission. Item count is capped at 4 or 5; 6+ is not supported.

Two item variants are valid: `label` + `gloss` for generic ranking rows (Sacred Values, Institutional Trust, Responsibility), and `voice` + `quote` for the Temperament card's voice-styled rows. Each item must carry exactly one variant.

Generic shape (label + gloss):

```
## Q-X (example)

- card_id: <card>
- type: ranking
- question: <prompt text>
- helper: <optional one-line sub-prompt>
- items:
  - id: <stable item id>
    label: <user-facing short label>
    gloss: <one-line descriptor>
    signal: <signal_id this item carries>
  - ...
```

Temperament-row shape (voice + quote):

```
- items:
  - id: <stable id>
    voice: <e.g. "Voice A">
    quote: <serif italic first-person statement>
    signal: <signal_id>
```

A ranking item must have either `label`+`gloss` or `voice`+`quote`. Both shapes are valid; mixing the two within one question is not.

---

## Break Interstitial Schema

Break interstitials are authorized by `card-schema.md` § Break Interstitial Type. A break sits between two questions inside a card's flow, produces no signals, and is ignored by the engine during derivation.

```
## Break — B-X (example)

- card_id: <card>
- type: break
- position_after: <question_id>
- text: <prose shown to user>
- action_label: <button text>
```

A break appears in this file alongside the questions of the card it belongs to, immediately after the question identified by `position_after`.

---

# Conviction Card (Core)

## Q-C1

- card_id: conviction
- type: forced
- question: Would you rather be misunderstood but correct, or liked but slightly dishonest?
- options:
  - Misunderstood but correct
  - Liked but slightly dishonest
- signals:
  - truth_priority_high
  - belonging_priority_high

---

## Q-C2

- card_id: conviction
- type: forced
- question: Which matters more when they conflict?
- options:
  - Loyalty to people
  - Commitment to truth
- signals:
  - loyalty_priority
  - truth_priority

---

## Q-C3

- card_id: conviction
- type: forced
- question: Which feels more important to preserve?
- options:
  - Freedom to act
  - Stability and order
- signals:
  - freedom_priority
  - order_priority

---

## Q-C4

- card_id: conviction
- type: forced
- question: When something goes wrong, responsibility lies mostly with:
- options:
  - The individual
  - The system
  - Both equally
- signals:
  - individual_responsibility
  - systemic_responsibility
  - balanced_responsibility

---

# Pressure Card (Truth Under Cost)

## Q-P1

- card_id: pressure
- type: forced
- question: If expressing a belief would cost you close relationships, you would:
- options:
  - Stay silent
  - Soften it
  - Express it carefully
  - Say it directly
- signals:
  - adapts_under_social_pressure
  - moderate_social_expression
  - high_conviction_expression

---

## Q-P2

- card_id: pressure
- type: forced
- question: If a belief put your job at risk, you would:
- options:
  - Change your position
  - Keep it private
  - Hold it quietly
  - Accept the risk
- signals:
  - adapts_under_economic_pressure
  - hides_belief
  - holds_internal_conviction
  - high_conviction_under_risk

---

## Q-P3

- card_id: pressure
- type: forced
- question: If everyone you respect disagreed with you, you would:
- options:
  - Assume you're wrong
  - Doubt yourself
  - Re-examine carefully
  - Hold your position
- signals:
  - high_social_dependence
  - reflective_independence
  - strong_independent_conviction

---

# Formation Card (Past Shaping)

## Q-F1

- card_id: formation
- type: forced
- question: As a child, authority figures were mostly:
- options:
  - Trustworthy and protective
  - Necessary but flawed
  - Arbitrary or unfair
- signals:
  - authority_trust_high
  - authority_skepticism_moderate
  - authority_distrust

---

## Q-F2

- card_id: formation
- type: forced
- question: Your childhood environment felt:
- options:
  - Stable and predictable
  - Mixed
  - Uncertain or chaotic
- signals:
  - stability_baseline_high
  - moderate_stability
  - chaos_exposure

---

# Context Card (Present Pressure)

## Q-X1

- card_id: context
- type: forced
- question: Your current life feels:
- options:
  - Stable and manageable
  - Busy but controlled
  - Overwhelming or stretched
- signals:
  - stability_present
  - moderate_load
  - high_pressure_context

---

## Q-X2

- card_id: context
- type: forced
- question: Right now, people depend on you:
- options:
  - Very little
  - Some
  - A lot
- signals:
  - low_responsibility
  - moderate_responsibility
  - high_responsibility

---

# Agency Card (What You Actually Do)

## Q-A1

- card_id: agency
- type: forced
- question: How do you spend most of your time?
- options:
  - Building or creating
  - Maintaining responsibilities
  - Reacting to demands
- signals:
  - proactive_creator
  - responsibility_maintainer
  - reactive_operator

---

## Q-A2

- card_id: agency
- type: forced
- question: If your obligations were lighter, where would your energy naturally go?
- options:
  - Building or creating something new
  - Deepening relationships and care
  - Restoring order and stability
  - Exploring, learning, or wandering
- signals:
  - proactive_creator
  - relational_investment
  - stability_restoration
  - exploration_drive

---

# Sacred Values Card

## Q-S1

- card_id: sacred
- type: ranking
- question: Order these by what you'd protect first when something has to give.
- helper: Four of your own. Rank by which holds first when two of them pull apart.
- items:
  - id: freedom
    label: Freedom
    gloss: the ability to act without needing permission.
    signal: freedom_priority
  - id: truth
    label: Truth
    gloss: what's actually so, even when it costs.
    signal: truth_priority
  - id: stability
    label: Stability
    gloss: steady ground, for you and the people who rely on you.
    signal: stability_priority
  - id: loyalty
    label: Loyalty
    gloss: staying with your people through what comes.
    signal: loyalty_priority

---

## Q-S2

- card_id: sacred
- type: ranking
- question: Order these by which has the strongest claim on you.
- items:
  - id: family
    label: Family
    gloss: the people who are yours, and to whom you are theirs.
    signal: family_priority
  - id: knowledge
    label: Knowledge
    gloss: what's actually known, and the discipline of seeking more.
    signal: knowledge_priority
  - id: justice
    label: Justice
    gloss: fair weight, even when it costs you to give it.
    signal: justice_priority
  - id: faith
    label: Faith
    gloss: trust in what's larger than you, however you frame it.
    signal: faith_priority

---

# Freeform Insight (Critical)

## Q-I1

- card_id: conviction
- type: freeform
- question: What is something you believe that most people around you disagree with?
- signals:
  - independent_thought_signal

---

## Q-I2

- card_id: conviction
- type: freeform
- question: What would change your mind about that belief?
- signals:
  - epistemic_flexibility

## Q-I3

- card_id: pressure
- question_id: Q-I3
- type: freeform
- question: Describe a time you held a belief that cost you something. What did it cost, and did you keep the belief?
- signals:
  - conviction_under_cost
  - cost_awareness