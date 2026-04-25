# Temperament Framework v1

## Purpose

Define the canonical model for the Temperament Card: what cognitive patterns it measures, what signals it emits, how those signals combine to produce an MBTI label as an optional surface handle, and how they interact with other cards to produce tensions.

This file is the source of truth for:

- which personality frameworks Temperament draws from and which it rejects
- the canonical eight cognitive functions and what each one means in this product
- the function-stack logic that resolves to an MBTI 4-letter code
- the canonical signal family Temperament questions are allowed to emit
- the stress-behavior theory (inferior-function grip) that powers Temperament-involved tensions
- how forced-choice Temperament questions are designed, and the `decision_friction` convention for "Can't choose" responses

`question-bank-v1.md` authorizes specific questions. `signal-library.md` authorizes specific signal_ids. This file authorizes the theoretical model that both rely on for the Temperament card, so that question authors and tension authors work from a shared canon rather than reinventing psychology per CC.

---

## Canonical Scope

Temperament measures cognitive processing patterns — how the person receives information and makes decisions — not values, not behaviors, not current circumstance.

**In scope.** The eight Jungian cognitive functions (Ni, Ne, Si, Se, Ti, Te, Fi, Fe). Function-stack theory (dominant / auxiliary / tertiary / inferior). MBTI 4-letter type as a derived surface label, not a direct measurement. Inferior-function grip theory for stress response.

**Explicitly deferred.** Enneagram-style motivational analysis (core fear, core desire, defense mechanism, stress and growth arrows). Enneagram is the natural next-pass extension of Temperament because it measures *why* rather than *how*, but it is not part of Temperament v1. When added, it lives in its own canon file (`motivation-framework.md` or similar), not here.

**Explicitly rejected.**

- **Big Five / OCEAN.** Most psychometrically respected option, but produces clinical continuous-dimension readouts ("high on conscientiousness, low on agreeableness") that do not generate narrative tension material. Retained only as a potential future validation layer, not as a measurement layer. Not implemented.
- **DiSC.** Corporate behavioral-profiling tool. Wrong tone for self-discovery. Not implemented.
- **Predictive Index / Accumax.** Stronger than DiSC psychometrically, but still workplace-focused and licensing-encumbered. Their native vs. adapted behavior gap analysis is conceptually useful — the canonical way to emulate it in this product is through Temperament signals + Agency/Context signals + cross-card tensions, not by importing their instruments. Not implemented.

---

## The Eight Cognitive Functions

Each function has a two-letter code, a full name, and a canonical description. Descriptions are deliberately operational (how the function *behaves*) rather than trait-based (what a person *is*), because the signal engine detects behavior, not identity.

### Ni — Introverted Intuition

Pattern synthesis directed inward. Ni consolidates disparate inputs over time into a single convergent interpretation — a sense of where something is going, why it is happening, what it fundamentally means. Characteristic output: the "a-ha" insight that collapses a space of possibilities into one. Presence indicators: long time horizons, strategic framing, confidence that an outcome is inevitable before evidence is complete, resistance to surface-level engagement with details.

### Ne — Extraverted Intuition

Pattern generation directed outward. Ne fans out from a single input to many possibilities, jumps across domains, finds unexpected connections between unrelated concepts. Characteristic output: brainstorming, riffing, "what if we looked at it this way." Presence indicators: open-ended exploration, reluctance to close off options, energy gained from novel combinations, pattern-jumping mid-conversation.

### Si — Introverted Sensing

Sensory data stored and referenced internally against past experience. Si compares present conditions to a durable mental archive of prior detail — what worked before, how things were done, what the precedent is. Characteristic output: "we've seen this before" or "this is different from last time." Presence indicators: attention to continuity and tradition, discomfort with novelty for its own sake, accurate recall of specifics, reliance on what has been established.

### Se — Extraverted Sensing

Sensory data received in the present moment, acted on immediately. Se engages the environment as it actually is — physical, tactile, kinesthetic, responsive. Characteristic output: quick reactions, present-moment responsiveness, physical fluency. Presence indicators: confidence with immediate action, aesthetic sensitivity, restlessness with abstraction, preference for concrete over theoretical.

### Ti — Introverted Thinking

Logical consistency maintained internally. Ti refines and tests frameworks against an inner standard of coherence — is this categorization precise? does this definition hold? where does the framework break? Characteristic output: "that doesn't quite fit," careful disambiguation, framework-building. Presence indicators: precision with terms, willingness to tear down an explanation that almost works, independence from external consensus on what is true.

### Te — Extraverted Thinking

Logic applied to organize the external world. Te structures tasks, measures outcomes, allocates resources, drives execution against objective criteria. Characteristic output: plans, metrics, deliverables, accountability. Presence indicators: preference for concrete goals, discomfort with ambiguous progress, fluency with systems and processes, willingness to make unpopular decisions when the data supports them.

### Fi — Introverted Feeling

Values held internally, referenced against a private sense of what matters. Fi asks whether a choice is consistent with who the person is — not what is socially acceptable, not what is logical, but what feels true. Characteristic output: "this isn't me," value-rooted resistance, deep personal conviction. Presence indicators: moral seriousness, resistance to acting in ways that violate self-concept, attunement to one's own inner state, comfort with being out of step.

### Fe — Extraverted Feeling

Emotional and relational attunement directed outward. Fe reads the room, tracks group mood, harmonizes interactions, tends to others' comfort. Characteristic output: care, conflict-smoothing, relational maintenance. Presence indicators: attentiveness to others' emotions, responsiveness to group norms, discomfort in the presence of relational friction, investment in shared wellbeing.

---

## Function Stacks and Type Derivation

Each MBTI type is defined by a stack of four functions in a fixed order: **dominant / auxiliary / tertiary / inferior**. The dominant function is the person's primary mode; the auxiliary supports it; the tertiary is underdeveloped; the inferior is the unconscious and least-trusted function.

The stack follows two canonical rules from Jungian typology:

1. The dominant and auxiliary functions alternate introversion and extraversion. If the dominant is introverted (Ni, Si, Ti, Fi), the auxiliary is extraverted. If the dominant is extraverted, the auxiliary is introverted.
2. If the dominant is a perceiving function (N or S), the auxiliary is a judging function (T or F), and vice versa. A person cannot have two perceiving functions or two judging functions at the top of their stack.

The tertiary inverts the extraversion-attitude of the auxiliary; the inferior inverts the attitude of the dominant. So every type's stack is fully determined by its dominant and auxiliary functions.

### Canonical stack table

| Type | Dominant | Auxiliary | Tertiary | Inferior |
|------|----------|-----------|----------|----------|
| INTJ | Ni | Te | Fi | Se |
| INTP | Ti | Ne | Si | Fe |
| ENTJ | Te | Ni | Se | Fi |
| ENTP | Ne | Ti | Fe | Si |
| INFJ | Ni | Fe | Ti | Se |
| INFP | Fi | Ne | Si | Te |
| ENFJ | Fe | Ni | Se | Ti |
| ENFP | Ne | Fi | Te | Si |
| ISTJ | Si | Te | Fi | Ne |
| ISTP | Ti | Se | Ni | Fe |
| ESTJ | Te | Si | Ne | Fi |
| ESTP | Se | Ti | Fe | Ni |
| ISFJ | Si | Fe | Ti | Ne |
| ISFP | Fi | Se | Ni | Te |
| ESFJ | Fe | Si | Ne | Ti |
| ESFP | Se | Fi | Te | Ni |

### MBTI derivation rule

Given the measured dominant and auxiliary functions, the 4-letter MBTI code is determined by lookup against the table above. The engine does not infer the code from dichotomy signals directly; it infers it from aggregate rank across the rank-aware function signals defined in §6.

The dominant function is the function with the lowest aggregate rank across its four perceiving-block appearances (for Ni / Ne / Si / Se) or its four judging-block appearances (for Ti / Te / Fi / Fe). The auxiliary follows from the canonical stack rules above (introvert/extravert alternation; perceiving/judging alternation) once the dominant is identified, then is confirmed against the table.

Example: aggregate ranks place `ni` lowest among the perceiving functions and `te` lowest among the judging functions → lookup row "INTJ" → surface label "INTJ." The engine then derives the remaining stack (Fi tertiary, Se inferior) deterministically from the table.

The engine must not present an MBTI label when dominant and auxiliary cannot be cleanly identified. In that case no label is shown; the individual function signals still appear with their rank metadata.

---

## Pressure Patterns (Inferior Grip)

Under sustained stress, the inferior function "grips" — it takes over in a crude, exaggerated, and poorly integrated form. This is the mechanism that makes Temperament interesting for tension detection: a person's visible behavior under pressure can diverge sharply from their native mode, and the divergence is predictable from the stack.

The grip patterns below are canonical theory used by tension authors and the engine. They are no longer probed by direct questions in v1 — the original Q-T11 / Q-T12 inferior-grip block was dropped per `docs/open-design-calls.md` § 4 lock — because aggregate-rank stack derivation (§4 + §6) already identifies the inferior via the Canonical Stack Table without needing dedicated probes. The patterns now exist as canonical knowledge that tensions consuming Temperament signals may consult; they no longer correspond to dedicated questions.

The canonical grip patterns, one per dominant function:

- **Ni-dominant → Se grip.** Sensory escapism. Binge eating, alcohol, compulsive physical activity, hedonic overconsumption, crude sensory indulgence dissociated from meaning.
- **Ne-dominant → Si grip.** Catastrophic body-fixation. Obsessing over bodily sensations, rigid fixation on past details, paranoid health worries, loss of usual openness.
- **Si-dominant → Ne grip.** Catastrophic imagination. Disaster scenarios, paranoid future-projection, loss of usual groundedness, worst-case spiraling.
- **Se-dominant → Ni grip.** Doom-laden hidden-meaning interpretation. Everything is a sign, dark convergent prophecies, loss of usual presence.
- **Ti-dominant → Fe grip.** Emotional outbursts. Desperate need for external validation, relational lashing out, uncharacteristic emotional volatility.
- **Te-dominant → Fi grip.** Personal-value meltdowns. "Nobody understands me," identity crisis, loss of usual effectiveness, internal collapse.
- **Fi-dominant → Te grip.** Rigid control. Obsessive task-listing, harsh external judgment, uncharacteristic drive toward control of others.
- **Fe-dominant → Ti grip.** Cold logical withdrawal. Cutting analysis, devaluing of relationships, uncharacteristic detachment.

These patterns are canonical for tension-detection purposes — they define what the engine expects to see in a stressed Ni-dominant user versus a stressed Fi-dominant user. Individual variation is real; the patterns are prototypes, not laws.

---

## Signal Family

Temperament questions emit signals in a controlled family. No Temperament question may emit a signal outside this family.

### Naming convention

The Temperament card emits 8 function signals: `ni`, `ne`, `si`, `se`, `ti`, `te`, `fi`, `fe`. The signal id is the lowercase function code, with no suffix. Each signal is `rank_aware: true` per `signal-library.md` § Per-Signal Entry Schema and carries a `rank` field plus a `source_question` field naming the Q-T question that produced it. Every appearance of a function signal records the position the corresponding voice statement occupied in that question's ranking, per `signal-mapping-rule.md` § Ranking Question Signal Emission.

The previous `{function}_{position}` family (24 stack-position signals) is no longer canonical and is dropped from this section. Stack position is no longer baked into the signal id; it is derived from aggregate rank.

### Aggregate stack derivation

Across the 8 Q-T questions, each function appears in exactly four — four times within the perceiving block (Q-T1–Q-T4 for Ni / Ne / Si / Se) and four times within the judging block (Q-T5–Q-T8 for Ti / Te / Fi / Fe). The function with the lowest aggregate rank within its block is the dominant for that category. The full stack — dominant, auxiliary, tertiary, inferior — is then resolved against the Canonical Stack Table in §4.

### Session rule

A single Temperament session emits 32 function-signal records — 8 function ids × 4 appearances each — together describing the user's full ranking. The engine validates this count; a session producing fewer is a question-design or runtime bug, not a valid state.

### Signal id list (8 total)

`ni`, `ne`, `si`, `se`, `ti`, `te`, `fi`, `fe`. Each is `rank_aware: true`. `signal-library.md` registers each with `primary_cards: [temperament]` when the family is wired in CC-009.

### `decision_friction` — deferred

The legacy `decision_friction` signal (previously emitted by forced-choice Temperament probes when the user selected "Can't choose") is **deferred** in CC-005 — there are no forced-choice dominant probes under the ranked design. Whether ranked Temperament questions should expose an opt-out that emits `decision_friction` is a CC-009 design call. The signal is not removed from canon; it is marked `unused` pending that decision. If the opt-out is added, `decision_friction` returns to the active set; otherwise it remains formally registered but unemitted.

---

## Tension Hooks

Temperament signals open four named tension classes. Full tension entries live in `tension-library-v1.md` and are added in later CCs; this section authorizes the shapes they may take.

**Temperament × Pressure (inferior grip).** The user's dominant function (the function with the lowest aggregate rank across §6) + signals indicating sustained pressure (high_pressure_context, high_responsibility, adapts_under_economic_pressure, etc.) together suggest the user may be operating from their inferior function — grip behavior. The tension's user prompt frames the observation softly: "under pressure you may reach for modes that are not your natural strength." Detection-side, tensions filter the function signals on `rank ≤ 1` (or another low-rank threshold) to identify the dominant.

**Temperament × Agency (native vs. current).** The user's dominant function + an Agency signal whose typical expression is incompatible (e.g., Ni at low aggregate rank + reactive_operator from Q-A1) suggests the user's current mode of operation is out of step with their native wiring. This is the misalignment tension — the native-vs-adapted gap PI/Accumax instruments measure.

**Temperament × Context (native tempo vs. current load).** The user's dominant function + a Context signal indicating overload or mismatched pace (high_pressure_context, low_responsibility when the type thrives on responsibility, etc.) suggests environmental fit is poor.

**Temperament × Role (when Role exists).** Reserved for when the Role Card is added. A Role-derived signal (e.g., "role requires constant coordination") combined with a Temperament function signal incompatible with that role (e.g., Ni at low aggregate rank + Fi preference for autonomy) fires this tension.

Additional hook (deferred): any tension that uses `decision_friction` against a Temperament function signal is a **Temperament stability tension**. Whether `decision_friction` is emitted at all under the ranked design is a CC-009 design call (see §6); this hook is canonically authorized but cannot fire until that decision is made and the signal returns to the active set.

---

## Question Design Principles

Temperament questions are cognitive-function probes, not self-description items. A good Temperament question presents four voice-styled statements — one per cognitive function in the relevant block — and asks the user to rank them by which voice most sounds like how they actually think.

### Display name

The Temperament card carries `display_name: "Four Voices"` per `card-schema.md` § Question Types and § `display_name`. The user-facing card label shown in the UI is "Four Voices"; the canonical `card_id` remains `temperament` and is used in all signal `from_card` references, tension references, and signal-library entries.

### Construction

Each Temperament question is `type: ranking` per `card-schema.md` § Question Types. Each presents four items, and each item carries:

- a `voice` field (e.g., `"Voice A"`) used as a mono kicker above the quote;
- a `quote` field (serif italic first-person statement) written in the register of one cognitive function;
- a `signal` field naming the function signal the item carries (one of `ni`, `ne`, `si`, `se`, `ti`, `te`, `fi`, `fe`).

The user's ranking emits four signals per question — one per function — each carrying a `rank` field per `signal-mapping-rule.md` § Ranking Question Signal Emission and a `source_question` field per §6 of this document. The voice-quality guardrail authorized in `docs/open-design-calls.md` § 4 (Ni not mystical, Te not sociopathic, Fi not precious, Fe not needy, etc.) governs statement drafting: each voice must read as a competent expression of its function, never a straw-man. The signal comes from priority order — the user recognizing which voice most sounds like them — not from making three of the four voices obviously weaker.

### Question shape

Eight Q-T questions per `docs/open-design-calls.md` § 4 lock — four perceiving + four judging. Across the eight questions, each function appears in exactly four — once per question within its block.

- **Q-T1–Q-T4 (perceiving block).** Each presents Ni / Ne / Si / Se voice statements under a different scenario header.
- **Q-T5–Q-T8 (judging block).** Each presents Ti / Te / Fi / Fe voice statements under a different scenario header.

Aggregate rank across each function's four appearances determines stack position per §4.

### Two ambient breaks

The Temperament card includes two break interstitials per `card-schema.md` § Break Interstitial Type — typically positioned after Q-T3 and after Q-T6 — that read "pause. take a breath." in serif italic with a "ready" advance button. Breaks produce no signals and are not skippable except by the action button. Specific break ids and `position_after` values are authorized in `question-bank-v1.md` when the Temperament card is implemented in CC-009.

### `decision_friction` opt-out

Whether ranked Temperament questions should expose a "can't rank" opt-out that emits `decision_friction` is a CC-009 design call. v1 default is no opt-out — every Temperament ranking produces rank data for all four functions. If the opt-out is added, it follows the canon already established in §6 for the `decision_friction` signal.

### What Temperament questions must not do

- Do not ask the user to self-identify as an MBTI type. Items are voice statements that the user ranks; the engine infers type from aggregate rank.
- Do not ask about values. Values are Conviction and Sacred's domain.
- Do not ask about current circumstance. Circumstance is Context's domain.
- Do not ask about what the user *should* do. Temperament measures natural tendency, not prescription.
- Do not pad an item with two functions or a hybrid voice. Each item speaks in exactly one function's register.
- Do not introduce a fifth or sixth item. Temperament rankings are four items per question, per `card-schema.md` § Ranking item count.

---

## Canonical Rules

1. Every Temperament question is `type: ranking` per `card-schema.md` § Question Types. Each item in the ranking emits one of the eight canonical function signals (`ni`, `ne`, `si`, `se`, `ti`, `te`, `fi`, `fe`) per the naming convention in §6 Signal Family. Items emitting non-Temperament signals are rejected at canon review.
2. A Temperament session emits 32 function-signal records — 8 function ids × 4 appearances each (Ni / Ne / Si / Se across Q-T1–Q-T4; Ti / Te / Fi / Fe across Q-T5–Q-T8). Sessions producing fewer are invalid and must not be used for stack derivation or MBTI labeling. Each record carries a `rank` field per `signal-mapping-rule.md` § Ranking Question Signal Emission.
3. The MBTI surface label is derived strictly from the Canonical Stack Table. The engine must not invent stack resolutions that the table does not contain. If dominant and auxiliary cannot be identified, no label is shown.
4. Function signals must not be presented to the user as declarative type claims ("You are an INTJ"). Language per `inner-constitution.md` applies: "your stack appears to lead with Ni," "tends toward introverted intuition," "may suggest an INTJ-shaped pattern."
5. `decision_friction` is never a function signal. It does not occupy a stack position and is not used to compute the MBTI label. As of CC-005 the signal is registered as `unused` pending the CC-009 design call on whether ranked Temperament questions should expose a "hard to choose" opt-out. If CC-009 authorizes the opt-out, this rule still applies — `decision_friction` returns to `active` but remains outside the function family and outside stack derivation.
6. Inferior-grip interpretation is canonical per the Pressure Patterns section and may only be surfaced in a tension context, never as a standalone reading of a person.
7. New cognitive frameworks (Enneagram, Big Five, etc.) require their own canon file; they must not be grafted into this one.

---

## Deferred Layers

Named here so future contributors know what is intentionally outside scope.

**Enneagram motivational layer.** The natural next pass. Enneagram measures core fear, core desire, defense mechanism, and stress-and-growth arrows — the *why* beneath the cognitive-function *how*. When added, it lives in its own canon file (tentative `motivation-framework.md`) and produces a separate signal family (nine types plus wings, or the 27 subtypes if granular). Tensions that combine Temperament × Motivation become possible at that point. Not in scope for Temperament v1.

**Big Five / OCEAN as validation.** OCEAN's factor structure is the most peer-reviewed in psychology. If the product ever needs to demonstrate psychometric soundness — e.g., to clinical users, researchers, or regulators — a validation study comparing Temperament signals against Big Five scores is the canonical reference class. Held in reserve. Not implemented as a measurement layer here.

**Predictive Index / Accumax native-vs-adapted modeling.** Their instrument framework is licensed and not directly reusable, but the concept (native self versus adapted behavior under current demands) is reproducible here via Temperament signals compared to Agency and Context signals through tensions. That reproduction is captured in the Tension Hooks section, not by importing PI or Accumax instruments.
