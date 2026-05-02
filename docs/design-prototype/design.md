# Who Are You? — Product & Interaction Design Specification

**Status:** Draft 02 — Claude Design handoff
**Audience:** Anthropic / Claude Design Lab
**Purpose:** Provide a complete product, visual, and interaction design specification before the project advances too far into CSS, UI, or UX implementation.
**Working principle:** This is a design specification, not an engineering prompt. It should guide design exploration and critique. Engineering work should later be translated into narrowly scoped implementation prompts.

---

## 1. Product thesis

**Who Are You?** is a self-discovery product that helps a person build a structured self-portrait. It is not a diagnosis, not a clinical instrument, and not a conventional personality quiz. It is a guided interpretation system that asks the user to rank values, inner voices, trust patterns, and responsibility instincts, then translates those signals into a written artifact called the **Inner Constitution**.

The product should feel like a thoughtful letter from a perceptive guide, not a dashboard, test result, or gamified assessment.

The core movement is:

> **answers → signals → tensions → interpretation → Inner Constitution**

The product should avoid telling users, “You are X.” It should say things like:

* “This pattern may be present.”
* “You may tend to…”
* “Under pressure, this can become…”
* “Does this feel accurate?”

The system’s authority comes from honest interpretation, not certainty theater.

---

## 2. Experience goal

The experience should make the user feel:

1. **Seen**, but not labeled.
2. **Invited**, not judged.
3. **Studied**, but not clinically assessed.
4. **Challenged**, but not accused.
5. **Curious enough to continue.**

The user should not feel like they are taking a psychology exam. They should feel like they are ordering pieces of their inner life so the system can reflect the shape back to them.

The core emotional target:

> “This is not telling me my type. It is showing me my shape.”

---

## 3. Product architecture: the body-map metaphor

The product should not present itself primarily as a list of abstract cards. The stronger metaphor is a **body-map of the self**: the person has ways of seeing, protecting, speaking, standing, listening, adapting, defending, and moving. The card system should feel embodied and memorable without becoming mystical or anatomical gimmickry.

The metaphor gives the user a simple way to understand the framework:

> **Who Are You? maps the body of a personhood: how you see, what you protect, what you say, where you stand, whom you listen to, what you've adapted to, how you defend, and how you move.**

The framework is **eight cards** (locked in `docs/canon/shape-framework.md`). Each has a product-friendly name, a body part it maps to, and the question it answers. The product-friendly names are the user-facing card labels. Names like Listen, Speak, Heart, Spine, Role, and Agency have been considered as alternative product voice; canon retains the names below.

| Card | Body part | What it answers |
|---|---|---|
| **Lens** | Eyes | How do you see and process reality? |
| **Compass** | Heart | What do you protect? |
| **Conviction** | Voice | What do you believe and defend? |
| **Gravity** | Spine | Where do cause, blame, and duty fall? |
| **Trust** | Ears | Whom or what do you trust to mediate reality? |
| **Weather** | Nervous system | What shaped you and what surrounds you now? |
| **Fire** | Immune response | What survives when belief costs you something? |
| **Path** | Gait | What are you becoming? |

### Lens (Eyes)

How you see. Lens describes perception, interpretation, pattern recognition, and the cognitive frame through which a person makes meaning. This is where cognitive-process / temperament work belongs under the hood, though the user-facing expression should avoid sounding like an MBTI exam.

Design implication: Lens surfaces should feel like ways of looking, framing, noticing, and interpreting. Avoid charts that imply fixed type certainty.

### Compass (Heart)

What you protect. Compass contains Sacred Values and the moral-emotional center of the framework — what a person loves, protects, and refuses to betray.

Design implication: Compass is a natural home for ranking. Ranking should feel less like sorting preferences and more like ordering loves and obligations.

### Conviction (Voice)

What you believe and how you defend it. Conviction describes belief held under social cost — disclosure, truth-telling, silence, the difference between internal belief and external expression, and how convictions get revised. Two people can share a Compass value (e.g. truth) and hold it as conviction differently — one principled and rigid, one relational and provisional.

Design implication: Conviction is where freeform answers can matter most. A user's own words should strengthen interpretation, but the product should quote or reuse them carefully.

### Gravity (Spine)

Where weight, blame, responsibility, and duty fall when life goes right or wrong. Gravity describes attribution: individual, system, nature, supernatural, authority, chance, duty, and control. The body part is the spine because Gravity also describes the upright stance — what helps you hold position when something pulls against you (integrity, courage, posture under pull).

Design implication: Gravity questions should feel philosophical but practical. The user is not being asked who to blame; they are being asked where causality feels most real, and how they hold their shape under pull.

### Trust (Ears)

Whom or what you take reality from. Trust describes receptivity, trust calibration, institutional trust, peer trust, mentor trust, family trust, and openness to correction.

Design implication: Trust should visually and verbally support provenance — why did the system hear a signal? What source was trusted? What kind of authority carried weight?

### Weather (Nervous system)

What shaped your defaults, and what surrounds you now. Weather describes formation history plus present context, load, stress, instability, support — what shaped the user's adaptive patterns and what conditions surround them today. Formation is the weather you grew up in; Context is the weather you're standing in now. Both shape what your defaults adapt to.

Design implication: Weather is an overlay, not an identity claim. It should be visually treated as condition/context, not as permanent type. The Inner Constitution must explicitly distinguish *current adaptation* from *underlying structure* when the data suggests one is being mistaken for the other. *State is not shape.*

### Fire (Immune response)

What happens under cost. Fire describes stress responses, pressure patterns, threat reactions, and what becomes distorted or revealed under strain. Fire is a credibility test for Compass under specific stress shapes — but it is conditional, not an essence-revelation.

Design implication: Fire should never be framed as "your true self." Pressure can clarify, but it can also warp. The correct language is conditional — *"under heavy load and high-stakes pressure, your shape may express as X"* — never declarative.

### Path (Gait)

How you move through the world, and what growth is pulling toward. Path describes development, integration, maturity, lived behavior (what the person actually does — action, maintenance, reaction, creation), and the next trainable capacity. v1 produces directional Path output interpretively from existing signals (Compass + Lens + Gravity + Agency-card answers); v2 may add dedicated Work / Love / Give / Empower questions.

Design implication: Path should make the experience hopeful without becoming sentimental. It should answer: what would make this person more whole, more free, more responsible, and more generous?

### Freeform / Insight (the user's own hand)

Higher-resolution self-expression. Freeform answers are not a card; they are a supplementary layer that runs through Conviction and Fire (Q-I1, Q-I2, Q-I3). They should not be ornamental; they should strengthen or clarify interpretations when they provide meaningful signal.

Design implication: Insight should feel like margin notes in the user's own hand. It should help the system listen better, not replace the ranking spine.

---

## 4. Core design stance

The product should be designed as an **embodied interpretive artifact builder**, not a quiz flow. The body-map metaphor should quietly organize the experience: Lens, Compass, Conviction, Gravity, Trust, Weather, Fire, and Path (mapped to Eyes, Heart, Voice, Spine, Ears, Nervous system, Immune response, and Gait). These names do not all need equal visual weight on every screen, but the design should preserve the feeling that the user is mapping a living person, not filling out a database.

Avoid:

* Scorecards as the primary surface.
* Charts, gauges, badges, or game-like type reveals.
* Overuse of chips and tags.
* “Congratulations, you are…” reveal mechanics.
* Bright colors, gradient cards, playful confetti, personality-test tropes.
* A hero screen dominated by a type label.

Prefer:

* A quiet reading experience.
* Ranking as arrangement, not selection.
* Written reflections over metrics.
* Tensions as possibilities, not verdicts.
* Provenance disclosure: “tell me more” on every interpretation.
* A final Inner Constitution that reads like a composed document.

Key product line:

> **The Constitution is one document, not a results dashboard.**

---

## 5. Visual identity

### 5.1 Visual register

The visual language should feel like:

* warm paper
* ink
* margin notes
* quiet editorial design
* a constitution, letter, field guide, or old philosophical workbook

It should not feel like:

* SaaS analytics
* HR assessment software
* dating app onboarding
* social media quiz
* medical intake
* corporate LMS

### 5.2 Color tokens

Use warm paper and dark ink as the identity. Umber is the only accent.

```css
--paper:       #f6f2ea;   /* page background; warm off-white */
--paper-warm:  #efe9dd;   /* secondary surface */
--paper-deep:  #e6dece;   /* tertiary surface */
--ink:         #1a1713;   /* primary text */
--ink-soft:    #433d33;   /* secondary text */
--ink-mute:    #807566;   /* metadata, kickers */
--ink-faint:   #b8ad9c;   /* hairlines, decorative */
--rule:        rgba(26,23,19,.14);
--rule-soft:   rgba(26,23,19,.08);
--umber:       #8a4a1f;   /* only accent */
--umber-soft:  #a8653a;
--umber-wash:  rgba(138,74,31,.08);
```

Rules:

* No blues, greens, neon accents, or multi-accent status palette.
* Umber marks system emphasis: card kicker, active progress, rank rule, primary button, tension border.
* The product should be paper-on-ink, never black-on-white or white-on-black.
* Default browser focus rings should not visually dominate, but keyboard focus must remain visible and accessible through a designed umber focus state.

### 5.3 Typography

Suggested pairing:

```css
--serif: "Source Serif 4", "Source Serif Pro", "Iowan Old Style", "Palatino", Georgia, serif;
--mono:  "JetBrains Mono", "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
--sans:  "Inter Tight", system-ui, -apple-system, "Segoe UI", sans-serif;
```

Roles:

* **Serif** is the voice of the product: body copy, prompts, Inner Constitution, reflective text, Four Voices statements.
* **Mono** is the voice of the system: question IDs, card labels, rank numerals, tension IDs, progress metadata, utility labels.
* **Sans** should be rare: small utility microcopy, autosave status, short helper labels.

The contrast between serif and mono is important. It lets the product distinguish between “the guide speaking” and “the system keeping track.”

---

## 6. Ranking as the central interaction primitive

Ranking is now the core interaction model. It should not feel like a survey trick. It should feel like the user is arranging what matters.

### 6.1 Why ranking

Ranking captures tradeoffs better than single-choice questions. A person rarely has only one sacred value, one trust source, one attribution instinct, or one inner voice. Ranking reveals priority, conflict, and second-place truths.

The product should assume:

* Rank 1 matters most.
* Rank 2 is also meaningful.
* Rank 3 is present but less defining.
* Ranks 4–5 are lower-confidence and should not be over-interpreted.

The tail of a ranked list is not meaningless, but it is structurally weaker evidence.

### 6.2 Ranking cap

No ranking question should ask the user to rank more than **five** items.

Preferred range: **four to five**.

If a future question needs more than five options, split it into multiple ranking questions or design a different control. Do not silently extend the ranking primitive.

### 6.3 Mobile ranking behavior

Primary interaction:

* Drag-to-reorder.
* Whole row should feel draggable if possible.
* The grip handle should remain visually clear on the right.
* Rank number should remain prominent on the left.
* Rows should have enough height for thumb use.
* Minimum grip target: 44px.

Fallback/accessibility:

* Keyboard reorder must exist.
* Space/Enter can pick up/drop.
* Arrow keys reorder while active.
* Screen reader announcements should communicate position changes.
* There should be a designed focus state on the grip or row, not an invisible or suppressed state.

Avoid separate mobile-only interaction models if possible. A single ranking mental model across devices is preferable.

### 6.4 Ranking row anatomy

Each row should include:

1. Rank number, large, left column, mono.
2. Primary option label, serif or strong text.
3. Short descriptor, one sentence maximum.
4. Drag grip, right side.

Example row:

**1 — Freedom**
The ability to act without needing permission.

The descriptor is not decoration. It is part of the question’s interpretive precision. “Freedom” alone is too broad; the descriptor tells the user which meaning is being ranked.

---

## 7. Current ranking questions to design around

### 7.1 Sacred Values A

**Question ID:** Q-S1
**Card:** Sacred Values
**Prompt:** “Order these by what you’d protect first when something has to give.”

Options:

1. Freedom
2. Truth
3. Stability
4. Loyalty

Design task: make these feel like serious commitments, not virtue words.

Draft descriptors:

* **Freedom** — the ability to act without needing permission.
* **Truth** — what is actually so, even when it costs.
* **Stability** — the safety and order that keep life from breaking.
* **Loyalty** — staying faithful to people or commitments when it would be easier to leave.

### 7.2 Sacred Values B

**Question ID:** Q-S2
**Card:** Sacred Values
**Prompt:** “Order these by which has the strongest claim on you.”

Options:

1. Family
2. Knowledge
3. Justice
4. Faith

Draft descriptors:

* **Family** — the people and bonds that are yours to protect.
* **Knowledge** — understanding what is true, useful, or wise.
* **Justice** — setting right what is unfair, corrupt, or cruel.
* **Faith** — meaning, trust, or obligation beyond what can be measured.

### 7.3 Institutional trust ranking

**Question ID:** Q-X3
**Card:** Context / Trust
**Prompt draft:** “Rank these institutions from most to least trustworthy.”

Options (label — gloss; locked 2026-04-25 per `docs/option-glosses-v1.md`):

1. **Government** — federal, state, and local public bodies.
2. **Press** — newsrooms, journalists, and information outlets.
3. **Companies** — businesses and the workplaces that hire you.
4. **Education** — schools, colleges, and the credentialing they grant.
5. **Non-Profits & Religious** — charities, NGOs, churches, and other voluntary missions.

Design note: the combined Non-Profits & Religious category represents civil society / mission-driven institutions. It should not visually bias the user toward religion or charity; it is a broad category. *Employers* was renamed to *Companies* for plain-English match with the rest of the row; the long form *Non-Profits & Religious organizations* was shortened to fit mobile.

### 7.4 Responsibility / attribution ranking

**Question ID:** Q-C4
**Card:** Conviction / Gravity
**Prompt draft:** “When something goes wrong, rank where responsibility most often sits.”

Options (label — gloss; locked per `docs/option-glosses-v1.md`):

1. **Individual** — the person who acted, and what they brought to the moment.
2. **System** — the structures and incentives shaping what was possible.
3. **Nature** — chance, biology, the way things just are.
4. **Supernatural** — divine will, fate, or what's beyond human reach.
5. **Authority** — the people in charge of the system, not the system itself.

Design note: “Authority” is distinct from “System.” System means structure, incentives, constraints. Authority means leaders, decision-makers, power-holders, or those entrusted to act. The Authority gloss carries this disambiguation explicitly (“not the system itself”) and is load-bearing — keep it longer than the others if needed.

### 7.5 Temperament / Four Voices

**Card name shown to user:** Four Voices
**Engine concept:** cognitive functions, MBTI-style label inferred later
**Question structure:** 8 ranked questions, 4 options each

Each option is a voice-styled self-recognition statement. The user ranks which inner voice sounds most like them in that scenario.

Guardrail:

No function should be made cartoonish. Ni is not mystical. Te is not sociopathic. Fe is not needy. Fi is not precious. Se is not reckless. Si is not merely nostalgic. Ne is not scattered. Ti is not cold. Every voice should sound competent and plausible.

The signal comes from priority order, not from making three options obviously weaker.

---

## 8. Question shell

A question screen should contain:

### Header

* Small mono kicker: `CARD 09 · SACRED VALUES · Q-S1 OF S2`
* Optional card title: Sacred Values
* Progress indicator with quiet umber active segment

### Body

* Large serif prompt
* Short explanatory subtitle if needed
* Ranking component or freeform field
* No decorative illustrations unless they are extremely restrained

### Footer

* Back
* Continue
* Save / autosave status, only if true persistence exists

Important rule:

If the UI says **Saved** or **Autosave**, the product must actually persist the user’s answer. Otherwise, use non-committal language like “Draft in progress” until persistence exists.

---

## 9. Tension cards

Tensions are interpretive possibilities created by signal combinations. They are not declarations.

A tension card should include:

* Tension ID, e.g. `T-001`
* Human title, e.g. “Truth vs Belonging”
* Short interpretation sentence
* Confirmation options: Yes / Partially / No
* Optional note field
* “Tell me more” disclosure

The disclosure is essential. It should show the user why the system surfaced the tension.

Example:

> This appeared because you ranked Truth highly and also indicated that social cost may change how directly you speak.

The system should never feel like it is making mysterious claims from nowhere.

Visual treatment:

* Tension cards should have a left umber rule or subtle border.
* They should read like marginal notes or interpretive footnotes, not warning alerts.
* Avoid red/yellow/green severity colors.
* Avoid “risk score” language.

---

## 10. Inner Constitution layout

The Inner Constitution is the final artifact. It should feel composed, calm, and worth saving.

It should not be a dashboard.

Suggested structure:

1. **Opening Shape Summary**
   A short prose paragraph synthesizing the most important patterns.

2. **Your Primary Gifts**
   2–4 synthesized gifts derived from multiple cards.

3. **Your Active Tensions**
   The major tensions that may be present, written in careful language.

4. **Your Blind Spots**
   Strengths under distortion.

5. **Growth Edges**
   Trainable capacities, not accusations.

6. **Pressure Watch**
   How the person may distort under load.

7. **Relationship Translation**
   How others may experience this person.

8. **Colophon / Provenance**
   Quiet summary of which cards/questions contributed, with optional disclosure.

Design principle:

> Everything that wants to be a chip should first try to become a sentence.

Avoid:

* Big type label hero.
* Radar charts.
* Percentile bars.
* “Your score is…”
* Overly decorative cards.

Use:

* Serif prose.
* Section rules.
* Drop cap or subtle editorial opening treatment.
* Mono metadata for IDs and provenance.
* Umber as a quiet connective thread.

---

## 11. Tone and language rules

### 11.1 Required tone

The product voice should be:

* clear
* humane
* psychologically mature
* slightly formal
* never cute
* never clinical in a cold way
* never mystical in a way that overclaims

### 11.2 Interpretive restraint

Use:

* “may”
* “appears to”
* “can become”
* “under pressure”
* “this pattern may be present”
* “does this feel accurate?”

Avoid:

* “you are”
* “you always”
* “your true self is”
* “this proves”
* “this means you are broken”
* “toxic”
* “trauma response” unless clinically warranted and intentionally scoped

### 11.3 The best interpretive formula

> Your gift is your shape in health.
> Your blind spot is your shape under distortion.
> Your opportunity is your shape under discipline.
> Your threat is your shape under pressure.

This should influence all output copy.

---

## 12. Accessibility and trust requirements

### 12.1 Accessibility

The ranking interaction must support:

* pointer drag
* keyboard reorder
* visible focus state
* screen reader position announcements
* adequate touch targets
* non-color-only state indication

Do not remove browser focus styles unless the replacement is complete and tested.

### 12.2 Trust

The product must not imply certainty it does not have.

Required trust mechanisms:

* provenance disclosure on tension cards
* cautious language
* confirmation prompts
* ability to disagree with a tension
* no hidden diagnostic claims
* no fake autosave
* no fake precision

---

## 13. Design questions for Claude Design Lab

Please evaluate and propose design ideas around these questions:

1. **Body-map metaphor:** How should the eight cards (Lens, Compass, Conviction, Gravity, Trust, Weather, Fire, Path) and their body parts (Eyes, Heart, Voice, Spine, Ears, Nervous system, Immune response, Gait) appear in the product without becoming gimmicky or overly anatomical?

2. **Card naming:** Should the user see the body-map names directly, or should some remain behind the scenes while the UI uses simpler section titles?

3. **Ranking on mobile:** Is drag-to-reorder the right primitive, or should there be a tap-to-rank fallback that preserves the same mental model?

4. **Cognitive load:** Do four and five-item ranking lists feel manageable, especially when the options are abstract values?

5. **Descriptors:** How much explanatory text should each rank option carry before the row feels heavy?

6. **Four Voices:** How should the UI make voice-styled temperament statements feel readable and rankable without becoming too text-heavy?

7. **Inner Constitution:** How can the final artifact feel composed, durable, and worth saving without becoming visually dull?

8. **Tensions:** How should “tell me more” provenance appear so the system feels honest but not overly technical?

9. **Progression:** Should the experience feel like cards, chapters, pages, or sections of a single written instrument?

10. **Autosave:** If persistence exists, how should it be signaled quietly? If it does not yet exist, what language avoids overpromising?

11. **Mobile thumb ergonomics:** Where should rank number, descriptor, and drag handle sit for the least awkward one-handed use?

12. **Result restraint:** How do we prevent users from hunting for labels while still giving them a satisfying reveal?

---

## 14. What is not being asked of Claude Design Lab

The design lab does not need to solve:

* psychometric validation
* canon architecture
* tension logic
* exact signal mapping
* implementation slicing
* database persistence model
* AI/freeform extraction logic
* MBTI / cognitive-function correctness

The immediate ask is visual and interaction design:

> How should this feel, move, read, and reveal itself?

---

## 15. Design deliverables requested

Ideal deliverables from Claude Design Lab:

1. Mobile ranking interaction recommendation.
2. Desktop ranking interaction recommendation.
3. Question shell layout.
4. Four Voices layout treatment.
5. Tension card treatment with “tell me more.”
6. Inner Constitution layout.
7. Design token refinement if needed.
8. Accessibility critique of the ranking primitive.
9. UI copy suggestions for ranking instructions and autosave language.
10. Any major red flags before engineering commits to the ranking primitive.

---

## 16. Non-negotiables

1. The body-map metaphor is central. The eight cards are Lens (Eyes), Compass (Heart), Conviction (Voice), Gravity (Spine), Trust (Ears), Weather (Nervous system), Fire (Immune response), and Path (Gait). Names are locked in `docs/canon/shape-framework.md`.
2. Ranking is central.
3. Four to five items is the cap.
4. Umber is the only accent color.
5. The product should feel like paper and ink.
6. The Inner Constitution is a document, not a dashboard.
7. Tensions are possibilities, not declarations.
8. Provenance disclosure is required.
9. Do not surface MBTI as the main product identity.
10. Do not make the product feel clinical, corporate, or gamified.
11. Do not let the UI promise saved state unless persistence exists.

---

## 17. Summary for designers

**Who Are You?** is a reflective ranking-based self-discovery product organized through a body-map metaphor. It asks users to order values, trust sources, attribution instincts, and inner cognitive voices. The engine interprets these rankings as signals, combines them into tensions, and produces a written Inner Constitution.

The user is not merely answering questions. They are mapping the body of their personhood: Lens (Eyes), Compass (Heart), Conviction (Voice), Gravity (Spine), Trust (Ears), Weather (Nervous system), Fire (Immune response), and Path (Gait).

The visual identity should be warm, literary, restrained, and serious. The interaction should be simple enough for mobile but rich enough to capture tradeoffs. The result should feel like something the user might save, revisit, and share with a trusted person.

The central design challenge is this:

> Make ranking feel less like sorting a list and more like arranging a life.
