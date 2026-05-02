# Inner Constitution (Canonical Output) v2

## Purpose

The Inner Constitution is what the user reads at the end of a session. It is the human-readable synthesis of their Shape — a structured self-portrait organized around the eight Shape cards defined in `shape-framework.md`.

It is not a label, score, or type.

It is **a map, not a destination.** A description, not a verdict.

`shape-framework.md` defines the eight cards. `output-engine-rules.md` defines the derivation logic that fills them. This file defines **what the user finally sees** — the structure, the tone, the per-card SWOT format, and the synthesized cross-card readings.

---

## Founding Principles

The Inner Constitution honors four principles. Every rendering decision flows from them.

1. **Map, not destination.** The user is not being told who they are. They are being shown the structure of their inner operating system, so they can navigate it themselves.
2. **Description, not verdict.** No type labels as headlines. No scores. No comparison to population. The Constitution is closer to a thoughtful letter than to a quiz result.
3. **Gift and risk live in the same body.** The user's strengths and their blind spots are not opposing rooms. The blind spot is the gift without balance. Every per-card output must hold both.
4. **Tension is honored, not flattened.** When the user holds two things in tension, the Constitution names the tension as real, not as preference variance to be optimized away.

---

## The Two Anchor Lines

Both lines from `shape-framework.md` govern how the Constitution is written. They are surfaced verbatim in the Constitution's opening prose:

> Your blind spot is not the opposite of your gift. It is your gift without balance.

> Your gift is your shape in health. Your blind spot is your shape under distortion. Your opportunity is your shape under discipline. Your threat is your shape under pressure.

---

## Output Rules

1. Every statement must be traceable to signals or confirmed tensions.
2. Use language like: *appears to, may suggest, tends to, leans toward, often, in the moments when, you may notice yourself.*
3. Avoid: *you are, you always, your type is, all [type] people, you cannot.*
4. Do not present unconfirmed tensions as fact.
5. Do not collapse multiple tensions into a single simplified statement.
6. Do not surface signal_ids, gift category labels, or any internal vocabulary verbatim to the user. The engine writes sentences using the vocabulary; it does not display the labels.
7. Confirmed tensions may speak with more weight than signals; rejected tensions must not be re-asserted.
8. Type labels (e.g., MBTI 4-letter codes) appear only as **optional disclosures** behind a small affordance, never as headlines.

---

## Top-Level Structure

The Inner Constitution renders top to bottom in the following order:

1. **Shape Summary** — a single paragraph naming the user's shape across the eight cards.
2. **The Eight Cards (SWOT)** — Lens, Compass, Conviction, Gravity, Trust, Weather, Fire, Path. Each with four cells: Gift, Blind Spot, Growth Edge, Risk Under Pressure.
3. **Top Gifts** — three Gifts synthesized across cards.
4. **Top Risks** — three Risks Under Pressure synthesized across cards.
5. **Watch For** — four to six "When X becomes Y" triggers that name where each gift starts to drift into its shadow.
6. **Growth Path** — a directional paragraph about meaningful work, love, and giving.
7. **Relationship Translation** — how others may experience this Shape.
8. **Conflict Translation** — how to engage with people whose Shape differs.
9. **Mirror-Types Seed** — a paragraph naming how the user's commitments may appear differently in others.
10. **Confirmed Tensions** — tensions the user has affirmed, written with weight.
11. **Open Tensions** — tensions surfaced but not yet confirmed.

---

## 1. Shape Summary

A single short paragraph (3-5 sentences) that names the user's shape across the eight cards in plain prose. The summary names what the user appears to see, protect, believe, blame, listen to, has adapted to, defends under pressure, and is becoming.

**Example shape summary:**

> Your shape leans toward truth and freedom, held through a lens that pattern-tests reality and refuses easy answers. You assign responsibility first to individuals, though you still recognize systems when they become obviously corrupt. Pressure tends to surface your conviction rather than soften it, sometimes faster than your audience can absorb. You are at your best when building structures that help others become capable, and your edge is learning that clarity, well-translated, can serve relationship rather than betray it.

This is the only place in the Constitution where the engine produces a unified narrative across all eight cards. Everything below this point is structured per card or per cross-card synthesis.

---

## 2. The Eight Cards

Each card renders as a four-cell SWOT plus a one-sentence card header.

### Card structure

```
[CARD NAME — body part metaphor in product voice]

[One-sentence card header naming what this card revealed for this user.]

Gift — [your shape in health]
[2-3 sentences]

Blind Spot — [your shape under distortion]
[2-3 sentences]

Growth Edge — [your shape under discipline]
[2-3 sentences]

Risk Under Pressure — [your shape under pressure]
[2-3 sentences]
```

### Per-card spec

#### Lens (Eyes)

**What this card answers:** how you see and process reality.

**Sources:** Q-T1 through Q-T8 (Temperament ranking — eight cognitive-function voice statements).

**Output:** Full SWOT. Gift and Blind Spot draw from the user's dominant cognitive function (Ni / Ne / Si / Se / Ti / Te / Fi / Fe). Growth Edge typically integrates the user's underweighted function. Risk Under Pressure is the dominant function under sustained stress — often inferior-function grip.

#### Compass (Heart)

**What this card answers:** what you protect.

**Sources:** Q-S1 (Freedom / Truth / Stability / Loyalty ranked) and Q-S2 (Family / Knowledge / Justice / Faith ranked).

**Output:** Full SWOT. Gift names the protected value as a strength; Blind Spot names the same value's overuse risk; Growth Edge typically integrates an underweighted value; Risk Under Pressure is the sacred value at the cost of relationship, truth, or self.

#### Conviction (Voice)

**What this card answers:** what you believe and how you defend it.

**Sources:** Q-C1, Q-C3 (in code); Q-C2 (canonical, awaiting code); Q-I1, Q-I2 (freeform belief questions).

**Output:** v1 produces a **leaner Conviction reading** rather than a full four-cell SWOT — typically a Gift + Blind Spot pair only, plus a Conviction Posture sentence (per `output-engine-rules.md` Rule 3). Growth Edge and Risk Under Pressure for Conviction are folded into the Conflict Translation section in v1. Full Conviction SWOT lands in v2 once question depth grows.

#### Gravity (Spine)

**What this card answers:** where cause, blame, and duty fall when life goes right or wrong.

**Sources:** Q-C4 ranked (Individual / System / Nature / Supernatural / Authority).

**Output:** Full SWOT. Gift names the user's responsibility lens as a strength (e.g., "you protect agency and accountability"); Blind Spot names what that lens minimizes (e.g., "you may underweight systems, trauma, or luck"); Growth Edge typically integrates the underweighted attribution; Risk is the lens applied unfairly under cost.

#### Trust (Ears)

**What this card answers:** whom or what you trust to mediate reality.

**Sources:** Q-X3 ranked institutional trust (Government / Press / Companies / Education / Non-Profits & Religious) plus Q-X4 ranked personal trust (Spouse/partner / Close friend / Family / Mentor or advisor / Your own counsel).

**Output:** Full SWOT. Gift names where the user's trust is well-placed; Blind Spot names whom they may dismiss too quickly; Growth Edge is widening discernment without losing it; Risk is trust capture or paranoia under pressure.

#### Weather (Nervous System)

**What this card answers:** what shaped your defaults and what surrounds you now.

**Sources:** Formation (Q-F1, Q-F2) plus the non-trust portions of Context (Q-X1, Q-X2).

**Output:** Full SWOT. The Weather card holds a special principle: **state is not shape.** A user under high load may show patterns that look like personality (cold, disorganized, anxious) but are actually adaptation to current pressure. Weather output explicitly distinguishes — *"this may be your shape, or this may be what you've adapted to. Both are real, but they ask different questions of you."*

#### Fire (Immune Response)

**What this card answers:** what happens when your protected things cost you something.

**Sources:** Pressure card (Q-P1, Q-P2; Q-P3 awaiting code) plus the freeform Q-I3 ("paid a cost for a belief").

**Output:** Full SWOT, **written conditionally.** Fire is a check on Compass under specific stress shapes — it surfaces which sacred values *may* survive when they cost something, not what the user "really" is underneath. Strong situations sometimes suppress trait expression and pull many people toward similar behavior; pressure can clarify identity but can also distort it. Both are real.

The Constitution must render Fire output with conditional framing: *"under heavy current load and high-stakes pressure, your shape may express as X"* rather than *"this is who you become under stress."* Gift names what the user *may be able to preserve* under pressure; Blind Spot names what they *may sacrifice too quickly*; Growth Edge is courage with calibration; Risk is the shape that *may* surface when load is heavy and stakes are high. Fire output names the likely pattern under specific stress shapes, not a hidden essence.

#### Path (Gait)

**What this card answers:** what you are becoming.

**Sources:** Agency Card (Q-A1, Q-A2). The full Path layer (Work / Love / Give / Empower) is deferred to v2.

**Output:** v1 produces a **directional paragraph** rather than a full four-cell SWOT — drawn interpretively from Compass + Lens + Gravity + existing Agency signals. The paragraph names what kind of work, love, and giving will likely feel meaningful for this Shape. v2 produces full Path SWOT once dedicated Path questions land.

---

## 3. Top Gifts (synthesized)

Three Gifts that appear across multiple cards or with the highest combined intensity in any single card. Drawn from the 12-vocabulary set in `output-engine-rules.md`. The labels are **embedded in prose**, not surfaced as standalone tags.

**Format example:**

> **What you bring**
>
> 1. **A pattern-discernment gift.** You tend to see the deeper shape of a problem before it becomes obvious to others. This appears in how you process new information, how you read situations, and how you anticipate where things are heading.
>
> 2. **Costly conviction.** You are willing to absorb some loss when an issue crosses a real moral line. You don't reach for principle as a weapon, but you don't drop it when it becomes inconvenient either.
>
> 3. **Builder energy.** When your obligations are rightly ordered, your instinct is to turn ideas into working systems. You make things that work.

The Top Gifts section is brief — three gifts with one short paragraph each.

---

## 4. Top Risks (synthesized)

Three Risks Under Pressure synthesized across cards — the most pressing ways the user's Shape can betray itself. Each risk is the same gift expressed without balance, named honestly without moralizing.

**Format example:**

> **What you may need to watch for**
>
> 1. **Pattern certainty becoming private fact.** When you see a pattern others can't yet see, you may stop testing it. The pattern becomes the conclusion before the evidence is in.
>
> 2. **Truth without translation.** Your willingness to speak directly is real, but its arrival is not always timed for the listener. The truth lands wrong when it lands early or hard.
>
> 3. **Carrying weight that isn't yours.** When systems you depend on falter, your default is to absorb the load. This builds endurance until it builds resentment.

---

## 5. Watch For (triggers)

A bulleted list of four to six "When X becomes Y" triggers. Each line names a specific moment where one of this Shape's gifts begins to drift into its shadow — the threshold worth noticing rather than a verdict that has already arrived. Triggers are drawn from each card's gift category (one per category, in canonical card order, deduplicated) and may be augmented by load-conditional or fire-pattern triggers when present.

**Format example:**

> **Watch for**
> *triggers — when a gift starts to drift into its shadow*
>
> - When 'I see the pattern' becomes 'I no longer need to test the pattern.'
> - When clarity stops asking whether the moment is asking for it.
> - When detecting bad faith becomes assuming bad faith.
> - When standing alone starts to feel like the only way to stand.
> - When willingness to bear cost stops checking whether the cost is needed.

The Watch For section sits between Top Risks (which name patterns) and Growth Path (which names direction). Where Top Risks describe the shape of the failure mode, Watch For names the threshold where it begins. Triggers are written without moralizing — no "you should", no "always" — and never as diagnosis.

---

## 6. Growth Path (directional)

A single paragraph (4-8 sentences) describing what kind of work, love, and giving will likely feel meaningful for this Shape. Drawn from Compass + Lens + Gravity + existing Path signals. **No new measurement; pure interpretation.**

**Format example:**

> **Where your energy moves best**
>
> Your shape suggests work that gives you autonomy over outcomes will feel right; work that requires constant social negotiation will drain you, even when the work itself is good. Love, for you, may be expressed more as being-someone-they-can-count-on than as verbal warmth — that doesn't make it less love, but it can leave the people closest to you wondering whether you see them. Your giving impulse points toward structural repair more than symptomatic relief; you may underestimate the value of small mercies because your Compass keeps pointing at the bigger broken thing. The next move likely isn't to do more, but to translate what you already do — letting your clarity, your loyalty, and your competence become more legible to the people who depend on them.

The directional paragraph is honest about what's interpretive: it does not claim measurement it doesn't have.

---

## 7. Relationship Translation

A short section (2-4 sentences) describing how others, especially those with different Lens dominance or Compass priorities, may experience this user's Shape.

**Format example:**

> **How others may experience you**
>
> Others may experience your clarity as confidence when they trust you, and as judgment when they do not. Your loyalty reads as steadiness to the people inside your circle and as withholding to people outside it. The translation is rarely about doing less of yourself — it is usually about being more legible.

---

## 8. Conflict Translation

A practical section (2-4 sentences) suggesting how to engage with people whose Shape differs, particularly across Lens or Compass differences.

**Format example:**

> **How to translate across difference**
>
> When speaking with high-loyalty or high-Fe people, your conviction lands better when it is preceded by relational intent — show that you see the relational stakes before delivering the corrective truth. When speaking with high-systemic-responsibility people, name what individual choice cannot solve before insisting on what individual choice must do.

---

## 9. Mirror-Types Seed

A paragraph (3-5 sentences) naming how the user's protected commitments may show up differently in others. Drawn from the user's top Compass value × dominant Lens function. Plants the seed for the reconciliation use case.

**Format example:**

> **Different shape, same commitment**
>
> Your Truth-shape leans toward logical precision — you protect truth by getting the reasoning right. People who organize around Truth differently may sound nothing like you and still share your deepest commitment. Someone whose Truth-shape leans toward personal authenticity will protect truth by refusing to participate in what feels false; someone whose Truth-shape leans toward verified precedent will protect truth by holding to what's been tested. They may strike you as sentimental, or rigid, or impractical — and they may be protecting the same thing you are, in a register you don't speak.

This section replaces the old "Bridge Signals (Human Constants)" section. The reconciliation seed is now structurally tied to the user's actual Compass and Lens, not a generic moral-foundations list.

---

## 10. Confirmed Tensions

Tensions the user has explicitly affirmed (yes, partly, or with annotation) get rendered with full weight here. Each tension uses the canonical user prompt from `tension-library-v1.md` plus a sentence describing the user's specific signal pattern that triggered it.

**Format example:**

> **Tensions you confirmed**
>
> *Truth vs. Belonging.* You ranked Truth in the top half of your sacred values, and your responses suggest you adapt when social cost is high. The pattern may not always be the same one, but the pull is real: when belief and belonging collide, something tends to give.
>
> *Stability vs. Freedom.* You value freedom of action, but your current responsibilities or stability needs may constrain how freely you can act. This is a tension of season more than character — and it asks for honesty about whether the constraint is chosen or absorbed.

---

## 11. Open Tensions

Tensions the engine surfaced but the user did not confirm. Rendered with explicit uncertainty — not asserted as fact, but offered as possibilities for the user to consider.

**Format example:**

> **Patterns worth considering**
>
> The signals also pointed at a possible Creator vs. Maintainer tension — a pull between wanting to build new things and current life mostly maintaining or reacting. You did not confirm this; it may not feel right. It is offered here only because the underlying signals suggested the question is worth asking.

---

## v1 vs v2 Scope

### What v1 ships

- All eight cards rendered with their respective output formats.
- Six cards (Lens, Compass, Gravity, Trust, Weather, Fire) get full four-cell SWOT.
- Two cards (Conviction, Path) get leaner output: Conviction is Gift + Blind Spot + Conviction Posture; Path is a directional paragraph.
- Top 3 Gifts (synthesized).
- Top 3 Risks (synthesized).
- Directional Growth Path paragraph.
- Relationship Translation paragraph.
- Conflict Translation paragraph.
- Mirror-Types Seed paragraph.
- Confirmed Tensions and Open Tensions sections.
- Templated text per signal-pattern combination.
- Optional MBTI 4-letter disclosure behind a small affordance.

### What v2 adds

- Full SWOT for all eight cards (Conviction and Path included).
- Top 3-5 Gifts and Top 3-5 Risks instead of fixed 3.
- Structured Growth Path across Work / Love / Give / Empower stages with explicit signal sources.
- Multi-user mirror-type matching (compare two Shapes, surface structural overlap).
- Richer cross-card pattern detection (LLM-generated narrative beyond v1 templates).
- Optional Schwartz Values, Moral Foundations, and Big Five validation overlays.

---

## Canonical Rules

1. Every Inner Constitution rendering uses the eight Shape cards as its top-level structure. Sections may be reordered for v2 experimentation, but cards may not be merged, dropped, or renamed without revising `shape-framework.md`.
2. Per-card output for v1 follows the spec above: six cards full SWOT, Conviction lean, Path directional. v2 may upgrade the lean cards once question depth grows.
3. Top Gifts and Top Risks are always exactly three in v1. v2 may expand to 3-5.
4. Gift category vocabulary from `output-engine-rules.md` is embedded in prose, never surfaced as standalone tags or labels.
5. Type labels (MBTI codes, Enneagram numbers if v2) appear only as optional disclosures, never as headlines.
6. Tone guardrails are non-negotiable. *"You are"* never appears in v1. *"Appears to," "tends to," "may suggest"* are the canonical tone tokens.
7. Confirmed tensions may speak with more weight than signals. Rejected tensions must not be re-asserted in any form.
8. The "state is not shape" principle is canonical for the Weather card. The Constitution must explicitly distinguish current adaptation from underlying structure when the data suggests one is being mistaken for the other.
9. The "stress is not revelation" principle is canonical for the Fire card. Fire output must be rendered conditionally — *"under heavy load and high-stakes pressure, your shape may express as X"* — never declaratively as *"this is who you really are under stress."* Pressure can clarify identity, but it can also warp it; the Constitution must hold both possibilities open.
10. The layered-architecture distinction (Core Portrait / Belief Stance / Context Overlays / Developmental Direction, per `shape-framework.md` § Card Types and Layered Architecture) governs the weight of every claim. Core Portrait outputs (Lens, Compass, Gravity, Trust) may carry the most weight. Belief Stance output (Conviction) is hedged. Context Overlay outputs (Weather, Fire) are conditional. Path output is directional. The Constitution must not flatten these layers into a single identity claim.
11. Path output in v1 is interpretive, not measured. The Constitution must not claim Path measurement it doesn't have.
12. Mirror-Types Seed must always tie to the user's actual top Compass value × dominant Lens function. It must not produce a generic reconciliation paragraph that could be written for any user.
13. The Five Dangers to Avoid (per `shape-framework.md` § Five Dangers) constrain every generated sentence. If a rendering violates any of them — claiming Jungian validation, flattening card layers, equating stress with revelation, moralizing trust/values/contact, or drifting into clinical implication — the engine must rewrite.

---

## Relationship to Other Canon Files

- `shape-framework.md` — defines the eight Shape cards this file renders.
- `output-engine-rules.md` — defines the derivation logic that fills the SWOT cells; this file is the rendering shell.
- `signal-library.md` — defines the signal_ids that flow through derivation into rendering.
- `tension-library-v1.md` — defines the tensions surfaced in sections 9 and 10.
- `temperament-framework.md` — defines the cognitive functions referenced in Lens, Conviction Posture, and Conflict Translation.
- `research-mapping-v1.md` — academic basis for why the rendered outputs are defensible.
- `validation-roadmap-v1.md` — per-card borrowed instruments for any future formal validation pass.

If the rendering specified here conflicts with what the engine can actually produce given v1 signal coverage, the engine's actual output wins for v1. The spec describes what the Constitution **should** look like; the engine's v1 implementation is what it **does** look like. Gaps between the two are documented in v1/v2 scope and resolved by future CCs.

---

## Product Definition

The Inner Constitution is a living document.

It evolves as:

- New inputs are added.
- Signals are refined.
- Tensions are confirmed or rejected.
- The user re-takes the survey across time.

It is not a result.

It is an ongoing self-portrait — a map the user can return to as their Shape clarifies under pressure, settles under discipline, and grows under attention.
