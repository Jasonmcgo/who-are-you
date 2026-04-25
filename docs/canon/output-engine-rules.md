# Output Engine Rules v1

## Purpose

Specify how the engine derives the Inner Constitution's outputs (Gift / Blind Spot / Growth Edge / Risk Under Pressure per Shape card, plus synthesized Top Gifts, Top Risks, Growth Path, Relationship Translation, and Conflict Translation) from the underlying signals. This file is the bridge between `signal-library.md` (raw signal data) and `inner-constitution.md` (rendered output).

It does not specify final user-facing prose — that's the Inner Constitution's job. It specifies the **rules** by which prose is generated: what combines with what, what gift vocabulary the engine may borrow from, how a strength becomes a blind spot, how the four SWOT cells per card are computed.

The two anchor lines from `shape-framework.md` govern everything in this file:

> **Your blind spot is not the opposite of your gift. It is your gift without balance.**

> **Your gift is your shape in health. Your blind spot is your shape under distortion. Your opportunity is your shape under discipline. Your threat is your shape under pressure.**

Every derivation rule below is written so that the resulting output preserves the spirit of those lines.

---

## The Core Formula

The engine computes per-card and cross-card outputs using six derivation rules. Each rule is named, has inputs, and produces an output type.

### Rule 1 — Gift derivation

**Inputs:** Lens signals (cognitive function stack from Q-T1–Q-T8) + Path signals (Agency from Q-A1, Q-A2 + indirect signals from Compass and Gravity).

**Output:** A per-card Gift cell — what this aspect of the user's shape helps them do unusually well.

**Rule:** `Gift(card) = primary_signal_pattern(card) + Lens_inflection + Path_orientation`

Plain language: the Gift on each card is the strength that emerges when that card's signal pattern is operating in its native register, inflected by the user's Lens (how they perceive) and Path (where their energy moves).

**Example:** A user with `truth_priority` ranked #1 on Compass (Sacred Values), `ti` dominant on Lens (Temperament), and `proactive_creator` on Path (Agency) has a Compass Gift around courageous truth-precision: the strength is "willingness to absorb relational cost in service of a clearly-articulated principle."

### Rule 2 — Blind Spot derivation

**Inputs:** The Gift output from Rule 1, plus Weather signals (Formation + Context).

**Output:** A per-card Blind Spot cell — what this same strength can distort when overused, threatened, or immature.

**Rule:** `Blind_Spot(card) = Gift(card) × overuse_under(Weather_pressure)`

Plain language: the Blind Spot on each card is the Gift expressed without balance, often shaped by the weather conditions the user has adapted to.

**Example:** The Compass Gift "courageous truth-precision" becomes the Blind Spot "weaponized correctness" when overused — the same strength applied without timing, translation, or relational care.

This rule encodes the canonical line: *the Blind Spot is not the opposite of the Gift. It is the Gift without balance.*

### Rule 3 — Conviction Posture derivation

**Inputs:** Compass signals (sacred-value rank) + Fire signals (pressure response).

**Output:** Conviction card output — how the user holds belief and what kind of cost their belief tolerates.

**Rule:** `Conviction_Posture = Compass_top_value × Fire_signature`

Plain language: a person's Conviction is what their Compass would still defend when their Fire is real. The intersection reveals whether the person is principled, relational, evidence-driven, identity-driven, pragmatic, or prophetic.

**Conviction style vocabulary** (interpretive, not canonical labels):

- **Principled** — high Compass + Direct Fire. Holds the line when compromise would corrupt the issue.
- **Relational** — high Fe Lens + Soften Fire. Preserves people while navigating disagreement.
- **Evidence-driven** — Te or Ti Lens + Express-carefully Fire. Updates when facts change.
- **Identity-driven** — Fi Lens + Direct Fire. Lives with conscience as the deciding court.
- **Pragmatic** — Te Lens + Adapt-under-pressure Fire. Focuses on workable outcomes.
- **Prophetic** — Ni Lens + Accept-risk Fire. Names what others avoid; lives with the cost.

### Rule 4 — Conflict Style derivation

**Inputs:** Compass signals + Fire signals + Lens signals.

**Output:** A cross-card reading of how this user shows up in conflict — what they protect, what they pay for, and how they perceive the conflict.

**Rule:** `Conflict_Style = Compass_top + Fire_top + Lens_dominant`

Used in the Relationship Translation and Conflict Translation sections of the Inner Constitution. Tells the user how others may experience them and how to translate their shape across difference.

### Rule 5 — Growth Edge derivation

**Inputs:** Blind Spot output + signals the user does NOT strongly emit (the missing values, missing Lens functions, underweighted attributions).

**Output:** A per-card Growth Edge cell — the next development move.

**Rule:** `Growth_Edge(card) = Blind_Spot(card) balanced by missing_signal(opposite_register)`

Plain language: the Growth Edge for each card is the Blind Spot's medicine — usually integration of the value, function, or attribution that the user underweights. The growth move is rarely "do less of your Gift" and almost always "borrow from the part of yourself you've muted."

**Example:** A user with the Compass Blind Spot of "weaponized correctness" has a Growth Edge that borrows from underused Fe (relational attunement) — the move is "translate truth before delivering it; let timing and tone serve the principle rather than betray it."

### Rule 6 — Risk Under Pressure derivation

**Inputs:** Gift output + Fire signals + Weather signals (current load).

**Output:** A per-card Risk Under Pressure cell — how this card's shape can betray the user under cost.

**Rule:** `Risk(card) = Gift(card) × Fire_signature × Weather_current_load`

Plain language: under sustained pressure (Fire) and overload (Weather), a person's Gift can collapse into a smaller version of itself. The Risk cell names that collapse.

**Example:** The Lens Gift "pattern discernment" under pressure + overload may collapse into "over-reading the future" — same capacity, applied without ground truth, becomes paranoia or strategic catastrophizing.

---

## The Twelve Gift Categories (Vocabulary)

The engine uses the following vocabulary when generating Gift cell prose. **These are not canonical labels.** The engine writes sentences that draw from the vocabulary; it does not surface the labels verbatim. A user reads "you bring a pattern-discernment gift — you tend to see the deeper shape of a problem before others do," not "Gift: Pattern Discernment ★."

| Vocabulary | Underlying signal pattern | Plain meaning |
|---|---|---|
| Pattern | Ni or Ne dominant + high Compass abstraction values | Sees what is coming or what connects |
| Precision | Ti dominant + Truth or Knowledge in Compass top-2 | Clarifies what is true or logically clean |
| Stewardship | Si or Fe dominant + Stability or Family in Compass top-2 | Preserves what matters across time |
| Action | Se or Te dominant + Freedom or Justice in Compass top-2 | Moves when others freeze |
| Harmony | Fe dominant + low individual_responsibility | Reads the room and repairs trust |
| Integrity | Fi dominant + Truth or Faith in Compass top-2 | Refuses to betray conscience |
| Builder | Te dominant + proactive_creator + Knowledge or Achievement in Compass | Turns ideas into working systems |
| Advocacy | Fi or Fe + Justice in Compass top-1 + systemic_responsibility | Protects the vulnerable or unfairly treated |
| Meaning | Ni dominant + Faith or Truth in Compass top-2 | Connects events to deeper purpose |
| Endurance | Si dominant + high_pressure_context + responsibility_maintainer | Carries responsibility through difficult conditions |
| Discernment | Ti or Ni + low institutional_trust | Detects falsehood, manipulation, or incoherence |
| Generativity | Fe or Fi + Family or Compassion in Compass + relational_investment | Helps others become more capable |

A user typically has **2-4 primary Gifts** drawn from this vocabulary, surfaced in the Top Gifts section of the Inner Constitution.

---

## Gift-to-Blind-Spot Pairs

Every Gift has a corresponding Blind Spot — the same strength under distortion. This table is the canonical pairing the engine uses when computing Rule 2.

| Gift vocabulary | Blind Spot under distortion |
|---|---|
| Pattern | Over-reading the future; private interpretation as fact |
| Precision | Weaponized correctness; relational tone-deafness |
| Stewardship | Fear of disruption; mistaking familiarity for truth |
| Action | Ignoring patterns and precedent; impulsive escalation |
| Harmony | Avoiding necessary truth; consensus-capture |
| Integrity | Private moral certainty; hard-to-reach |
| Builder | Instrumentalizing people; confusing effectiveness with goodness |
| Advocacy | Moral suspicion; assuming disagreement equals moral failure |
| Meaning | Over-spiritualizing practical problems |
| Endurance | Carrying what is not yours; survival mistaken for identity |
| Discernment | Cynicism; capture in conspiracy or paranoia |
| Generativity | Controlling others "for their own good" |

The canonical line worth surfacing in the Inner Constitution: *Your blind spot is your gift without balance.*

---

## Cross-Card Pattern Examples

These are illustrative readings the engine can use as templates. They are not exhaustive — the engine is allowed to generate readings beyond this table when signal patterns warrant. The table exists to anchor the kind of insight the Inner Constitution should be capable of producing.

### Example 1 — Strong Truth Compass + Fe Lens + Silent Fire

**Likely shape:** "You care deeply about truth, but your relational radar is so strong that you may silence yourself to preserve belonging."

- **Gift:** Diplomatic truth-teller; can preserve relationships in conflict.
- **Blind Spot:** May resent people for not knowing what you never said.
- **Growth Edge:** Say the true thing earlier, softer, and cleaner.

### Example 2 — Freedom Compass + Individual Gravity + Low Institutional Trust

**Likely shape:** "You are built to resist control. You notice coercion quickly and instinctively protect agency."

- **Gift:** Hard to manipulate; entrepreneurial; courageous around authority.
- **Blind Spot:** May interpret needed structure as oppression.
- **Growth Edge:** Distinguish control from coordination.

### Example 3 — Family / Loyalty Compass + Stable Weather + Soften Fire

**Likely shape:** "You preserve belonging and continuity. You are the person who keeps the room from breaking."

- **Gift:** Reliable; loyal; relationally protective.
- **Blind Spot:** May protect peace at the expense of truth.
- **Growth Edge:** Learn that truth, spoken carefully, can serve loyalty rather than betray it.

### Example 4 — Justice Compass + System Gravity + Direct Fire

**Likely shape:** "You are wired to confront unfairness and name structural failure."

- **Gift:** Advocate; reformer; courage under conflict.
- **Blind Spot:** May assume disagreement equals moral failure.
- **Growth Edge:** Leave room for ignorance, complexity, and partial responsibility.

### Example 5 — Te Lens + Work Path + High Dependence Weather

**Likely shape:** "You become useful under pressure and may confuse carrying the load with being fully alive."

- **Gift:** Builder; responsible; operationally serious.
- **Blind Spot:** May not notice emotional absence if the system is still working.
- **Growth Edge:** Let love be measured by presence, not only provision.

---

## Synthesis Rules (Cross-Card Outputs)

Beyond per-card SWOT, the Inner Constitution synthesizes cross-card readings. These derivations are simpler in v1, richer in v2.

### Top Gifts (v1: 3 items; v2: 3-5)

**Rule:** Identify the 3 highest-strength Gifts across all eight cards. A Gift's strength = (signal-pattern intensity × cross-card reinforcement).

A Gift that appears strongly in only one card is a single-card Gift. A Gift that appears across multiple cards (e.g., "Builder" surfaces in Lens + Path + Compass for Te-dominant + proactive_creator + Knowledge users) is a synthesized Gift and ranks higher.

### Top Risks (v1: 3 items; v2: 3-5)

**Rule:** Identify the 3 most pressing Risks Under Pressure across all eight cards. A Risk's urgency = (Gift overuse intensity × current Fire signature × Weather load).

### Growth Path (v1: directional; v2: structured)

**v1 rule:** Generate a single directional paragraph describing what kind of work, love, and giving will likely feel meaningful for this Shape, drawn from Compass + Lens + Gravity + existing Path signals. No new measurement needed.

**v2 rule:** Compute a structured Path output across Work / Love / Give / Empower stages with explicit signal sources for each stage.

### Relationship Translation (v1: present; v2: richer)

**Rule:** `Relationship_Translation = Conflict_Style × Lens_dominant_inverted`

Tells the user how others, especially those with different Lens dominance, may experience their Shape. Format: *"Others may experience your [trait] as [positive reading] when they trust you, and as [negative reading] when they do not."*

### Conflict Translation (v1: present; v2: richer)

**Rule:** Generate a recommendation for how to engage with people whose Shape differs from the user's, particularly across Lens or Compass differences. Format: *"When speaking with [Shape pattern X], lead with [adaptation move] before delivering [your native move]."*

### Mirror-Types Seed (v1: present; v2: multi-user matching)

**Rule:** Identify the user's top Compass value and pair it with their dominant Lens function. Generate a paragraph naming how that same value might show up differently in others.

Format: *"Your [value]-shape leans toward [Lens-inflected expression]. People who organize around [value] differently — [other Lens-inflected expressions] — may sound nothing like you and still share your deepest commitment."*

---

## Tone Constraints

Every output the engine generates must obey the canonical tone guardrails from `inner-constitution.md`:

- **Use:** *appears to, may suggest, tends to, leans toward, often, in the moments when.*
- **Avoid:** *you are, you always, your type is, all [type] people, you cannot.*
- **Never:** declarative type labels as headlines, scoring, percentages, comparison-to-population framing.

Gift category vocabulary appears inside sentences, never as standalone labels. The engine writes "you bring a pattern-discernment gift" not "Gift: Pattern Discernment."

The tone register is *thoughtful letter*, not *quiz result*. If a generated sentence reads like a horoscope, the engine must rewrite it.

---

## v1 vs v2 Scope

### What v1 ships

- All eight cards' four-cell SWOT (Gift / Blind Spot / Growth Edge / Risk Under Pressure), with thinner output for Conviction and Path due to question-support gaps.
- The 12-vocabulary Gift category set as interpretive language.
- Top 3 Gifts (synthesized).
- Top 3 Risks (synthesized).
- Directional Growth Path paragraph (no new measurement).
- Relationship Translation paragraph.
- Conflict Translation paragraph.
- Mirror-Types Seed paragraph.
- Templated text per signal-pattern combination — engineering-feasible without LLM dependency.

### What v2 adds

- 3-5 Top Gifts and 3-5 Top Risks instead of 3 each.
- Structured Growth Path across Work / Love / Give / Empower stages with explicit signal sources.
- Richer cross-card pattern detection (lookup table or LLM-generated narrative beyond v1 templates).
- Multi-user mirror-type matching (compare two Shapes, surface structural overlap).
- Path Card v2: dedicated Path questions, signals, and tensions; full Path SWOT instead of directional paragraph.
- Conviction question depth: more questions to support full Conviction SWOT.

---

## Canonical Rules

1. The six derivation rules (Gift, Blind Spot, Conviction Posture, Conflict Style, Growth Edge, Risk Under Pressure) are canonical. New rules require revision to this file.
2. The Gift vocabulary (12 categories) is canonical as **vocabulary**, not as **labels**. The engine writes sentences using the vocabulary; it does not surface the labels verbatim to the user.
3. The Gift-to-Blind-Spot pairing table is canonical. New Gifts require new corresponding Blind Spot pairings.
4. Cross-card pattern examples (the table of five sample readings) are illustrative, not exhaustive. The engine may generate readings beyond them when signal patterns warrant.
5. Conviction and Path SWOT outputs in v1 are leaner due to thin question support. The engine must write these honestly — a directional paragraph instead of forcing a thin SWOT into the four-cell format. See `shape-framework.md` Canonical Rule 7.
6. Tone guardrails from `inner-constitution.md` apply to every generated output without exception.
7. Type labels (e.g., MBTI 4-letter codes) may appear as optional disclosures but never as Inner Constitution headlines.

---

## Relationship to Other Canon Files

- `shape-framework.md` — defines the eight Shape cards this file derives outputs for.
- `inner-constitution.md` — defines the user-facing structure of the Inner Constitution; this file is the engine that fills it.
- `signal-library.md` — defines the signal_ids this file consumes.
- `signal-mapping-rule.md` — defines how raw answers become the signals this file consumes.
- `tension-library-v1.md` — tensions inform the cross-card readings in this file's Synthesis Rules.
- `temperament-framework.md` — defines the cognitive functions referenced throughout the Lens-dependent rules in this file.
- `research-mapping-v1.md` — academic basis for why these rules produce defensible outputs.

If a derivation rule conflicts with the signal data in `signal-library.md` or the question structure in `question-bank-v1.md`, the more specific file wins. This file is engine logic; the data files are operational truth.
