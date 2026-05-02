# Shape Framework v1

## Purpose

Define the umbrella architecture under which every other canonical doc in this product lives. The Shape Framework is not a measurement layer — it does not introduce questions, signals, or tensions of its own. It is the **interpretive scaffold** that names how the existing cards relate to each other and what kind of artifact the product is producing.

`question-bank-v1.md` authorizes specific questions. `signal-library.md` authorizes specific signal_ids. `tension-library-v1.md` authorizes specific tensions. `card-schema.md` authorizes the card structures. `output-engine-rules.md` authorizes how outputs are derived from signals. `inner-constitution.md` authorizes what the user finally reads. **This file authorizes the eight Shape cards** — what those things together are.

---

## Founding Principle

**The Shape model produces a map, not a destination.**

Most personality systems answer the question *"what type are you?"* This product answers a different question: *"what is the structure of your inner operating system when values, perception, responsibility, pressure, and purpose interact?"*

The product helps a person articulate the structure of their inner commitments — especially the commitments that don't fit cleanly inside the tribes they belong to. Most people, inside a tribe, hold positions they cannot formulate, because formulation requires distance the tribe does not grant. **The map is the distance.** It gives the user enough room to see the architecture under their actual commitments without forcing them into a static set of conclusions.

This is the difference between description and verdict. The Shape model describes; it does not declare.

---

## Two Anchor Lines

These are canonical and govern how every other Shape output is written:

> **Your blind spot is not the opposite of your gift. It is your gift without balance.**

> **Your gift is your shape in health. Your blind spot is your shape under distortion. Your opportunity is your shape under discipline. Your threat is your shape under pressure.**

Every Inner Constitution rendering must preserve the spirit of these two lines: gifts and risks live in the same body, not in opposing rooms. A person's strength is rarely betrayed by a stranger. It is most often betrayed by itself, overused.

---

## The Eight Shape Cards

A person's Shape is the interaction of eight cards. Each is named twice — once academically (so it ties cleanly to research) and once metaphorically (so it can be spoken about in product voice).

| Academic name | Product name | What it answers |
|---|---|---|
| Process | **Lens** | How do you see and process reality? |
| Values | **Compass** | What do you protect? |
| Belief | **Conviction** | What do you believe and defend? |
| Responsibility | **Gravity** | Where do cause, blame, and duty fall? |
| Epistemic Trust | **Trust** | Whom or what do you trust to mediate reality? |
| Formation + Context | **Weather** | What shaped you and what surrounds you now? |
| Pressure | **Fire** | What survives when belief costs you something? |
| Purpose | **Path** | What are you becoming? |

The product-friendly names are not decorative. They are the language the Inner Constitution uses when speaking back to the user.

### Body analogy (eight parts)

| Card | Body part | What it does |
|---|---|---|
| Lens | Eyes | How you see |
| Compass | Heart | What you protect |
| Conviction | Voice | What you say from belief |
| Gravity | Spine | What your structure leans toward |
| Trust | Ears | Whom you listen to |
| Weather | Nervous system | What you've adapted to |
| Fire | Immune response | How you defend under threat |
| Path | Gait | How you move through the world |

A person's Shape is the way their eyes, heart, voice, spine, ears, nervous system, immune response, and gait work together. It is not one thing. It is the interaction.

### Body-map metaphor vocabulary (CC-038-body-map, added 2026-04-29)

A third user-facing vocabulary lives alongside the canonical card names and the body-analogy names above: the **body-map metaphor** vocabulary used in CC-038-body-map's aux-pair register routes (e.g., *Path → Speak* for the architect, *Heart → Fire* for the witness). The metaphor names are tuned for the cognitive-movement reading — verbs (Listen, Speak) and contextual noun-phrases (Heart, Gravity) compose better in `metaphor[from] → metaphor[to]` arrows than the body-part names would.

The translation between user-facing body-map metaphors and `ShapeCardId` codenames is canonical:

| User-facing body-map metaphor | `ShapeCardId` codename | Body-analogy (above) |
|---|---|---|
| Heart | compass | Heart |
| Listen | trust | Ears |
| Speak | conviction | Voice |
| Gravity | gravity | Spine |
| Lens | lens | Eyes |
| Weather | weather | Nervous system |
| Fire | fire | Immune response |
| Path | path | Gait |

**Engine fields use the codename column; user-facing prose chooses between the metaphor column (for body-map cognitive-movement readings) and the body-analogy column (for the per-card body-part metaphor in Strength / Growth Edge / Practice / Pattern Note prose).** The full body-map framework, the 16 aux-pair routes, the Agency = Conviction resolution, and the Si-Fe asymmetry note all live in `docs/canon/function-pair-registers.md`.

---

## Card-by-Card

### 1. Lens (Process)

**Question it answers:** How do you take in and judge reality?

**What it draws from:** Jungian cognitive functions (Ni, Ne, Si, Se, Ti, Te, Fi, Fe), function-stack theory, MBTI as a derived surface label.

**Existing canon home:** Temperament Card (Q-T1 through Q-T8 ranked, voice-styled). See `temperament-framework.md`. Per the ranking item-count rule (`card-schema.md` § Question Types — *Ranking primitive: item-count rule*), Q-T1–Q-T8 are the canonical four-default-at-scale example: eight 4-item rankings rather than one piled-up ranking.

**Why it exists separately from Compass:** Two people can both rank Truth as their first sacred value but mean entirely different things — one through logical precision (Ti), one through personal authenticity (Fi), one through pattern recognition (Ni), one through verified precedent (Si). Without Lens, "Truth" is too flat. Lens is what keeps the same value from collapsing into one shape.

**Psychometric posture (acknowledged trade-off).** Of the eight cards, Lens is the one that most explicitly trades psychometric rigor for narrative power. Jungian function-stack theory has weaker empirical support than the Big Five or other dimensional models, and a fair scientific reading would say Lens measures *recognizable processing patterns* rather than validated typological architecture. The product accepts this trade because the Jungian functions produce richer self-recognition language than Big Five trait scores do. v2 may add Big Five validation as a parallel reference layer (see `validation-roadmap-v1.md`); v1 ships Lens as an interpretive tool, not a clinical instrument.

### 2. Compass (Values)

**Question it answers:** What do you protect?

**What it draws from:** Schwartz Theory of Basic Values, Haidt's Moral Foundations Theory, Tetlock's research on sacred values and taboo tradeoffs.

**Existing canon home:** Sacred Values Card (Q-S1 + Q-S2 ranked) + the Allocation Layer (Q-S3-close / Q-S3-wider / Q-S3-cross from CC-016) + the Concrete Stakes ranking (Q-Stakes1 from CC-024). Per the ranking item-count rule (`card-schema.md` § Question Types — *Ranking primitive: item-count rule*), Q-S3 is the canonical multi-stage example: two 3-item parents resolved by a derived 4-item cross-rank.

**Operating definition of sacred:** A value becomes sacred when compromising it feels like betraying yourself. Compass identifies the values a person will not casually trade away.

**Canonical sacred values pool (12 items)** (CC-028 expansion, 2026-04-27):

- Q-S1 (embodied / qualities-of-self): Freedom, Truth, Stability, Loyalty, **Peace**, **Honor**.
- Q-S2 (external pulls / orientations toward others): Family, Knowledge, Justice, Faith, **Compassion**, **Mercy**.

Pre-CC-028 the pool was 8 items (4 per question). Real-user testing across four sessions (Madison, Jason, Michele, LaCinda) confirmed top-3-universal compression: every user's top three came from the same handful (Family / Freedom / Loyalty plus one discriminator), because the 4-item ranking gradient was too thin to differentiate. The 12-item pool restores meaningful gradient between users at the Compass card. The 4 new values follow the verb-noun composition rule — each composes with its question's verb register and carries distinct semantic territory not covered by existing items. Contribution verbs (Teaching, Leading, Supporting) were considered and rejected — they belong on Path/Gravity, not Compass, per `feedback_sacred_vs_contribution_register.md`.

**Two registers** (CC-024 amendment, 2026-04-26): Compass measures both abstract and concrete protection. Q-S1/Q-S2 capture the user's **abstract sacred values** — what the heart loves in principle (the 12 items above). Q-Stakes1 captures the user's **concrete stakes** — what the heart fears losing in particular (Money, Job, Close relationships, Reputation, Health). The architectural truth: *what the heart loves abstractly + what the heart fears losing concretely.* Both registers cohabit in the heart-as-compass body part; together they give Compass a more complete measurement surface than the abstract-values-only read it carried pre-CC-024.

The two registers feed downstream cards differently: abstract sacred values feed `value_domain` on BeliefUnderTension (which sacred value the named belief touches); concrete stakes feed Q-I3 (which concrete losses the user would bear for that belief). Architecturally symmetric to how CC-016's Allocation Layer added a third Compass register (where discretionary money and energy actually flow), giving the Compass card a *named* register, an *allocated* register, and now a *feared* register.

### 3. Conviction (Belief)

**Question it answers:** What do you believe, and what would change your mind?

**What it draws from:** Moral psychology, sacred values, epistemology of belief revision.

**Existing canon home:** Conviction Card (Q-C1, Q-C3 in code; Q-C2 in canon awaiting code). Plus the freeform belief questions Q-I1 ("something you believe that most people around you disagree with") and Q-I2 ("what would change your mind about that belief").

**Why it exists separately from Compass:** Compass is *what* you protect. Conviction is *what you believe and how you defend it.* Two people can share Truth as a Compass value and hold conviction differently — one principled and rigid, one relational and provisional, one evidence-driven and updatable, one identity-driven and defensive. Conviction is how the Compass is held, not what it points at.

**v1 question support is thin.** Q-C1 and Q-C3 in code; Q-I1 and Q-I2 freeform; Q-C2 not yet implemented. The Conviction SWOT in v1 is leaner than the other cards' until question depth grows in v2.

### 4. Gravity (Responsibility)

**Question it answers:** Where do cause, blame, and duty fall when life goes right or wrong?

**What it draws from:** Rotter's locus of control, attribution theory.

**Existing canon home:** Q-C4 ranked (Individual / System / Nature / Supernatural / Authority). Locked in `open-design-calls.md` § 3, awaiting CC-008. Per the ranking item-count rule (`card-schema.md` § Question Types — *Ranking primitive: item-count rule*), Q-C4 is the canonical 5-item exception: the five attribution categories don't split cleanly into two parents, so Q-C4 sits at the principle's ceiling deliberately.

**Why it matters:** Two people who share the same Compass value (e.g., compassion) can disagree completely on what to do with it because their Gravity differs. One says "help them take responsibility," the other says "change the system that trapped them." Same value, different responsibility map.

### 5. Trust (Epistemic Trust)

**Question it answers:** Whom or what do you trust to mediate reality for you?

**What it draws from:** Institutional trust research, attachment theory, social-trust literature.

**Existing canon home:** Multi-stage Q-X3 (CC-031) — Q-X3-public (Government-Elected / Government-Services / Education / Non-Profits / Religious) + Q-X3-information-and-commercial (Journalism / News organizations / Social Media / Small Business / Large Companies) + Q-X3-cross (4-item derived). Plus multi-stage Q-X4 (CC-032) — Q-X4-relational (Spouse-or-partner / Family / Close-friend) + Q-X4-chosen (Mentor / Outside-expert / Own-counsel) + Q-X4-cross (4-item derived).  
Per the ranking item-count rule (`card-schema.md` § Question Types — *Ranking primitive: item-count rule*), Q-X3 sits at the 5+5 parent ceiling deliberately because the four splits (Government / Press / Companies / NP&Religious) all matter; Q-X4 sits at the 3+3 default because the relational/chosen split is clean and three items per parent already capture the resolution the domain needs.

The full v2.5 architecture: Q-I2's derivation cascades from `[Q-X3-cross, Q-X4-cross]` (CC-032), so the user's revision-source space in the Keystone Reflection now potentially includes Social Media, Outside-expert, Government-Services, News-organizations — dimensions the legacy flat Q-X3 + Q-X4 averaged into bucket labels.

**Q-X4 v2.5 multi-stage form (CC-032):**

Two parent rankings + one cross-rank. Six personal-trust signals total — five preserved from the legacy form + one new (Outside-expert).

> **Q-X4-relational** — *"When you need to hear the truth and not just kindness, whom of these — the people entangled in your life — do you trust most? Rank in order."*
>
> 1. **A spouse or partner** — someone whose life is fully entangled with yours.
> 2. **Family** — parents, siblings, or chosen kin who knew you before this version of you.
> 3. **A close friend** — someone who has earned your trust outside obligation.
>
> **Q-X4-chosen** — *"And when you need truth from someone you've selected for their judgment — not someone bound to you by relationship — whom do you trust most? Rank in order."*
>
> 1. **A mentor or advisor** — someone whose judgment you've sought across years.
> 2. **An outside expert** *(NEW in CC-032)* — a therapist, doctor, lawyer, coach, financial advisor, or clergy member — the trusted professional.
> 3. **Your own counsel** — your own judgment, when no other source feels right.
>
> **Q-X4-cross** *(derived, 4 items)* — *"When relational trust and chosen trust compete for the same hard-truth question, who actually wins?"*

Each item emits a `*_trust_priority` signal. Users may have empty slots (no spouse, no mentor, no living family); the engine handles missing items gracefully and treats absence as itself a signal. The per-item "doesn't apply" affordance is now unblocked by the multi-stage form (parent level is a natural home) but still deferred per § Deferred — separate small CC.

**Why it exists separately from Gravity:** Gravity is where you place blame. Trust is whose word you take about reality. Both are causal-interpretive, but distinct: a user can attribute responsibility to systems while still trusting their close friend to read situations accurately. Or attribute responsibility to individuals while distrusting all institutional voices.

### 6. Weather (Formation + Context)

**Question it answers:** What shaped your defaults, and what surrounds you now?

**What it draws from:** Developmental psychology, attachment theory, Self-Determination Theory's environmental conditions.

**Existing canon home:** Formation Card (Q-F1 + Q-F2) and the non-trust portions of Context Card (Q-X1 + Q-X2; Q-X3 belongs to Trust).

**Why both Formation and Context live together:** Formation is the weather you grew up in; Context is the weather you're standing in now. Both shape what your defaults adapt to. Tensions like "Inherited Stability vs Present Chaos" (T-010) are Weather-internal — formation pulling one way, current context pulling another.

**Card type — overlay, not trait.** Weather is a **contextual overlay**, not a parallel trait alongside Lens or Compass. The user's current load and formation history shape how their other cards present, but Weather itself does not describe "who they are" in the same sense Compass or Gravity does. The Inner Constitution must explicitly distinguish *current adaptation* from *underlying structure* when the data suggests one is being mistaken for the other. *State is not shape.* A user under high load may show patterns that look like personality (cold, disorganized, anxious) but are actually adaptation. Weather output names the difference rather than collapsing it.

### 7. Fire (Pressure)

**Question it answers:** What happens when your protected things cost you something?

**What it draws from:** Sacred Values research on taboo tradeoffs, moral psychology of cost-bearing, SDT under stress.

**Existing canon home:** Pressure Card (Q-P1, Q-P2; Q-P3 in canon awaiting code) and the freeform Q-I3 ("paid a cost for a belief").

**Why this is a credibility test for Compass — and where the test has limits:** Values are cheap when nothing is at stake. Fire reveals hierarchy. A person may say they value truth, but under pressure may preserve belonging. The product treats Fire as a check on Compass *under specific conditions*.

**Card type — conditional response, not essence revelation.** Fire is **a conditional overlay**, not the trait that "reveals who you really are." Strong situations can suppress trait expression and pull many people toward similar behavior; pressure can also warp rather than reveal. The Inner Constitution must write Fire output conditionally — *"under heavy current load and high-stakes pressure, your shape may express as X"* — rather than declaratively (*"you become X under stress"*). Sometimes pressure clarifies; sometimes it distorts. Both are real. Fire output names the likely pattern under specific stress shapes, not a hidden essence.

### 8. Path (Purpose)

**Question it answers:** What are you becoming?

**What it draws from:** Self-Determination Theory's autonomy / competence / relatedness, plus generativity as a developmental fourth need.

**Existing canon home:** Agency Card (Q-A1, Q-A2). The full Path layer (with developmental Work / Love / Give / Empower stages and dedicated questions) is **deferred to v2**. v1 produces directional Path output interpretively from existing signals; it does not add new questions.

**Why directional Path output belongs in v1 even without dedicated questions:** A map without contour is descriptive but not generative. Existing signals (Compass rank + Lens stack + Gravity attribution) are enough to write directional guidance about what kind of work, love, and giving will feel meaningful for a given Shape. v1 ships interpretation only.

**v1 question support is thin** (Q-A1, Q-A2 only). Path SWOT in v1 produces a directional paragraph rather than full Gift / Blind Spot / Growth Edge / Risk Under Pressure. Full Path SWOT lands in v2.

---

## Card Types and Layered Architecture

The eight cards are **not all the same kind of measurement.** Treating them as parallel latent traits and combining them into a single composite would mix reflective traits, contextual modifiers, and directional motives in a way that muddies meaning. The cards group into four functional layers:

### Layer 1 — Core Portrait (relatively durable, trait-like)

- **Lens** — how the person processes reality.
- **Compass** — what the person protects.
- **Gravity** — where the person assigns cause and duty.
- **Trust** — whom the person takes reality from.

These four are the most stable across a person's life. They change, but slowly. The Inner Constitution treats them as the user's underlying portrait.

### Layer 2 — Belief Stance (narrower module, partially derivable)

- **Conviction** — how the person holds belief.

Conviction is real but narrower. It draws partly on Lens (open-mindedness), partly on Compass (sacred-value rigidity), and partly on Trust (epistemic posture). v1 keeps it as its own card because it pulls weight in the product story; v2 may demote it to a derived module rendered from the Core Portrait if measurement proves duplicative.

### Layer 3 — Context Overlays (state-like, contingent)

- **Weather** — what shaped you and what surrounds you now.
- **Fire** — what happens under cost.

These two are **overlays**, not traits. Weather names current adaptation; Fire names conditional response. Neither describes "who the user is" the way the Core Portrait does. The Inner Constitution must render them conditionally and explicitly distinguish state from shape.

### Layer 4 — Developmental Direction (motive, not score)

- **Path** — what the user is becoming.

Path is a directional motive layer, not a parallel trait. v1 produces Path output interpretively from the Core Portrait; v2 will measure it directly via dedicated Work / Love / Give / Empower questions.

### Why this matters

The user-facing experience still surfaces eight cards. The layered architecture is **internal canon** — it tells the engine and the Inner Constitution renderer that:

1. Core Portrait outputs may be claimed with the most weight.
2. Belief Stance output is narrower and may be hedged accordingly.
3. Context Overlay outputs (Weather, Fire) must be written conditionally — *"under these conditions, this pattern may surface"* — rather than as identity claims.
4. Path output is directional language, never typological scoring.

The eight cards do not get combined into a single "Who Are You score." Each layer's outputs preserve their type. The Inner Constitution synthesizes across layers without pretending they all sit on one common metric.

---

## What "Shape" Produces

The output of the Shape model is **a structured self-portrait**, not a type label. Each of the eight cards generates a four-output SWOT — Gift, Blind Spot, Growth Edge, Risk Under Pressure. Plus synthesized cross-card readings (Top Gifts, Top Risks, Growth Path, Relationship Translation, Conflict Translation).

The full output spec lives in `inner-constitution.md`. The derivation rules (how Gift / Blind Spot / Growth Edge / Risk Under Pressure get computed from signal combinations) live in `output-engine-rules.md`.

The Inner Constitution renders Shape, not type. Surface labels (e.g., MBTI 4-letter codes) may appear as optional disclosures but never as the headline.

---

## Mirror Types

Two people can share the same sacred value and process it completely differently. Two people can share the same Lens and protect entirely different values. The Shape model treats these as **mirror types** — different surface expressions of structurally similar commitments, or shared surface expressions of structurally different commitments.

**Why this matters for the product:** The product's larger purpose includes helping people recognize that perceived enemies often share more structure than they appear to. A user who organizes around Truth via Ti may experience a user who organizes around Truth via Fi as nothing alike — yet the protected commitment is identical. Surfacing this resemblance is one of the most novel things the Shape model can do.

**v1 scope:** The Inner Constitution plants the seed by naming how the user's commitments may show up differently in others. *"Your Truth-shape leans toward [logical precision / personal authenticity / pattern recognition / verified precedent]. People who organize around Truth differently from you may surprise you — they may sound nothing like you and still share your deepest commitment."*

**v2 scope:** A multi-user comparison view that surfaces overlapping Shape structure between two users with different surface answers. Not in v1.

---

## Tribe-Formulation Principle

The Shape model exists in part to help users articulate views they cannot formulate from inside the tribes that absorbed their unformulated commitments.

A user's contrarian moves often share a structural pattern: they preserve an underlying commitment (salvation, hell, the cosmos as having an origin) while breaking with the binary that the tribe owning that commitment requires. Each one is *"yes, AND"* rather than *"either/or."* Tribes cannot grant the distance to formulate that move, because their coherence depends on the binary holding.

The product's job is not to evaluate which contrarian moves are correct. The product's job is to give users **the structure to articulate beliefs they couldn't articulate before**. The map provides distance from the orthodoxies that absorbed them. What they do with that distance is their own.

---

## Canonical Scope

**In scope for this file:**

- Naming the eight Shape cards and their relationship to existing canonical cards.
- The "map not destination" founding principle.
- The two anchor lines about gift/blind-spot.
- The body analogy and product-friendly card names.
- Mirror types as a v1 interpretive seed and v2 reconciliation layer.
- The tribe-formulation principle as the philosophical justification.
- The Q-X4 personal-trust question as a v1 commitment.

**Out of scope for this file:**

- Specific question text for cards other than Q-X4 (locked here for cross-reference). Questions live in `question-bank-v1.md`.
- Signal definitions. Those live in `signal-library.md`.
- Tension definitions. Those live in `tension-library-v1.md`.
- Output rendering details and per-card SWOT structure. Those live in `inner-constitution.md`.
- Derivation logic (how Gift / Blind Spot / Growth Edge / Risk are computed from signals). Lives in `output-engine-rules.md`.
- Card structure schema. Lives in `card-schema.md`.
- The full Path *card* (questions, signals, tensions). v2.
- Multi-user mirror-type matching. v2.
- Sacred Values list revisions. v1 list is locked in `question-bank-v1.md` Q-S1 + Q-S2 per CC-006.

---

## Canonical Rules

1. The Shape framework is interpretive scaffolding. It must not introduce questions, signals, or tensions of its own. New questions go through `question-bank-v1.md` and `signal-library.md`. New tensions go through `tension-library-v1.md`.
2. The eight cards (Lens, Compass, Conviction, Gravity, Trust, Weather, Fire, Path) are canonical. New cards or removals require a canon revision to this file.
3. Existing canonical cards (in `card-schema.md`) may feed multiple Shape cards. The Conviction Card feeds both Conviction and Gravity (Q-C4). The Context Card feeds both Weather (Q-X1, Q-X2) and Trust (Q-X3, Q-X4). This is allowed — Shape cards are interpretive groupings above the card_id taxonomy, not 1:1 with it.
4. The product-friendly names (Lens, Compass, Conviction, Gravity, Trust, Weather, Fire, Path) are the user-facing card labels. The academic names (Process, Values, Belief, Responsibility, Epistemic Trust, Formation+Context, Pressure, Purpose) are for canon authors and reviewers.
5. The Inner Constitution renders Shape, not type. Surface labels (e.g., MBTI 4-letter codes) may appear as optional disclosures but never as the headline.
6. Path output in v1 is interpretive only — generated from existing Compass / Lens / Gravity / Fire signals. New Path-specific questions, signals, or tensions require a v2 canon revision.
7. Conviction and Path SWOT outputs in v1 are leaner than the other six cards' due to thin question support. The Inner Constitution should write these honestly — a directional paragraph instead of forcing a thin SWOT into the four-cell format.
8. Q-X4 (personal-trust ranking) is locked for v1 inclusion. Its canonical entry will be added to `question-bank-v1.md` in the CC that adds Q-X3 institutional trust to canon.

---

## Five Dangers to Avoid

These are canonical guardrails on what the Inner Constitution may say. Every output the engine generates must respect them. The dangers are drawn from the v1 evidence review of the Shape framework against the underlying psychometric and clinical literature.

1. **Don't claim Jungian functions are validated perceptual modules.** Lens trades psychometric purity for narrative power. The product can say *"your processing pattern leans toward Ni"* but must not say *"you are a confirmed INTJ type."* MBTI surface labels appear only as optional disclosures, never as headlines. Lens describes recognizable patterns, not validated typological architecture.

2. **Don't treat all eight cards as the same kind of measurement.** They are not. Lens / Compass / Gravity / Trust are relatively durable trait-like cards (Core Portrait). Conviction is a narrower belief-stance module. Weather and Fire are state-like contextual overlays, not parallel traits. Path is a directional motive, not a score. Combining their outputs into a single "Who Are You score" would mix incompatible measurement types and weaken validity. The engine and the Inner Constitution must preserve the layered distinction.

3. **Don't equate stress with revelation.** Pressure can clarify identity, but it can also warp it. Strong situations sometimes suppress trait expression and pull many people toward similar behavior. The Inner Constitution must write Fire output conditionally — *"under heavy load and high-stakes pressure, your shape may express as X"* — rather than declaratively (*"this is who you really are"*). Sometimes pressure reveals; sometimes it distorts. Both are real.

4. **Don't moralize trust, values, or contact profiles.** Low institutional trust is not automatically wisdom and not automatically pathology. Strong sacred values are not automatically integrity and not automatically fanaticism. Preference for shared identity is not automatically enlightenment and not automatically erasure. Each depends on target, context, evidence, and power asymmetry. Shape outputs describe structure; they do not hand out halos and horns.

5. **Don't drift into clinical implication without clinical safeguards.** Developmental adversity, attachment insecurity, epistemic mistrust, and emotion dysregulation matter. But once the product infers them with confidence from consumer-style self-report cards, users will hear diagnosis even if the product disclaims it. Weather and Trust outputs especially must use careful language, hedge confidence, and resist the slide from observation into clinical claim. Shape is not a diagnostic instrument.

These five dangers are not aspirational. They are constraints on every Inner Constitution rendering. If a generated sentence violates one of them, the engine must rewrite.

---

## Deferred (v2)

- **Path Card.** Dedicated questions about Work / Love / Give / Empower. Signal family for generativity. Tensions like Work-Love conflict, Give-Empower progression. v1 produces directional Path text interpretively; v2 measures Path directly.
- **Shared Identity Card.** Contact-Hypothesis-grounded card for the reconciliation use case. Questions about who is "us," who is "them," what shared identity could reduce hostility. v2.
- **Multi-user mirror-type matching.** Compare two users' Shapes to surface structural overlap across surface difference. v2.
- **Motivation framework.** Enneagram-style core-fear / core-desire / defense-mechanism layer. v2 (planned home: `motivation-framework.md`).
- **Conviction question depth.** v1 has thin Conviction questions. v2 may add Q-C5+ to deepen the card's measurement.
- **Q-X4 expansion.** v1 Trust personal question lists five close-relationship categories. v2 may add per-item "doesn't apply" affordance and finer-grained personal-trust signals.

---

## Relationship to Existing Canon

Shape does not replace any existing canon doc. It sits above them as the umbrella. Every existing canon doc remains authoritative for its scope:

- `card-schema.md` — card structures and the question type union.
- `question-bank-v1.md` — specific questions.
- `signal-library.md` — specific signals.
- `signal-mapping-rule.md` — how answers become signals.
- `signal-and-tension-model.md` — the signal/tension data model.
- `tension-library-v1.md` — specific tensions.
- `temperament-framework.md` — the Lens card's theoretical model.
- `inner-constitution.md` — the eight-card SWOT output rendering.
- `output-engine-rules.md` — derivation logic from signals to SWOT outputs.
- `research-mapping-v1.md` — academic grounding for each Shape card.
- `validation-roadmap-v1.md` — per-card psychometric instruments for any future formal validation pass.

If any conflict surfaces between this file and another canon file, **the more specific file wins for its scope**. This file is interpretive umbrella; the others are operational truth.

---

## CC-025 — Per-card 4-section structure (added 2026-04-26)

Each ShapeCard now renders four sections in the Map: **Strength / Growth Edge / Practice / Pattern Note**. The change is structural at the framework level — every card gets the same shape, with content keyed to that card's body-part metaphor.

- **Strength** — the gift the card surfaces.
- **Growth Edge** — the same machinery viewed in failure mode (was *Trap* in earlier CCs).
- **Practice** — a card-register-specific instruction the card naturally invites (was *Next move*). Conviction's Posture occupies this slot; Path's Practice lives inside its narrative paragraph.
- **Pattern Note** — an aphoristic closing line keyed to the card's architectural truth. Aphorism variant render (italic, separator above), visually distinct from the body cells.

Locked Practice + Pattern Note text per card lives in `result-writing-canon.md § CC-025` — the framework names the structure; the editorial canon owns the text.

Why at framework level: identical body text across two cards becomes structurally impossible when each card has its own Pattern Note keyed to body-part metaphor. The per-card duplication problem (real-user output where Lens / Conviction / Trust converged on the same Trap text) is solved by architecture rather than by gift-category variant counts.

---

## CC-026 — Drive on Path · Gait (added 2026-04-26)

CC-026 introduces **Drive** as the model's first explicit broad why-axis. Most of the model's measurements expose *what* (what you protect, what you do, what you fear, what you trust); Drive exposes *why* — what motivates the exertion of energy.

Drive lives on **Path · Gait**. Path keeps its existing narrative shape (directional paragraph + Work / Love / Give / Practice / Pattern Note); the new Distribution subsection mounts above Work and renders a three-slice pie chart (`cost` / `coverage` / `compliance` buckets) with optional rank badges from Q-3C1's claimed-drive ranking. The chart visualizes the matrix between *claimed* and *revealed* drive — Q-3C1 captures what the user names as their motivator; a 15-input distribution computed at engine-derivation time reveals what the user's answers expose as their motivator.

The Drive read is body-part-keyed to **Gait** because gait is the visible expression of an unseen motivator (the why under the walk). Other body-map cards keep their existing measurement registers; Drive does not extend to them in v1. Cross-card drive-pattern surfaces (Lens × Drive, Conviction × Drive, etc.) are deferred to CC-026b after v1 smoke confirms the read is meaningful.

Full architectural framework, the 15-input map, the case classifier, the locked prose templates, the `T-D1` tension, and the vocabulary discipline (framework terms engineer-facing only; user-facing prose uses human-language phrases) live in the dedicated canon file `drive-framework.md`. This framework doc names the structure at the umbrella level; the dedicated doc owns the operational truth.

Distinct from existing measurements (binding rule):

- Drive is **not** energy. Energy is the resource (already measured by Q-E1-* / Q-A2 — where discretionary energy actually flows). Drive is what motivates the exertion.
- Drive signals are **not** sacred-value priority signals. Drive lives on a different axis; conflating with sacred-value math (`SACRED_PRIORITY_SIGNAL_IDS` / `SACRED_IDS`) would corrupt compass-ranking computations.

---

## CC-037 — Disposition Map (added 2026-04-29)

CC-037 introduces a **Big-5 OCEAN distribution** as a derived non-card page section between Mirror and Map. The section is labeled **"Disposition Map"** and renders a five-bar SVG chart (Openness / Conscientiousness / Extraversion / Agreeableness / Emotional Reactivity (estimated)) plus a one-paragraph prose interpretation, sourced from a tagging table over signals already collected by the instrument.

**Not a ShapeCard.** ShapeCards have a 4-section architecture (Strength / Growth Edge / Practice / Pattern Note) and a body-part metaphor; OCEAN is a cross-cutting derivation that doesn't fit either schema. The Disposition Map sits at the **page level**, parallel to MirrorSection and MapSection — it is a rendering surface, not a measurement surface in the body-map taxonomy.

Architectural rationale for the placement:

- **Adjacency to Mirror is natural.** Jung-Big5 correlations are well-documented in the personality-psychology literature; the Mirror's Lens-stack reading and the Disposition Map's OCEAN distribution are different vocabularies for overlapping structure. Sitting them adjacent lets the reader move between the two registers without losing context.
- **Body-part metaphor doesn't apply.** OCEAN is a cross-cutting psychometric register, not a Card 1–8 body-part read. Trying to assign it a body-part would force a metaphor where none belongs.
- **No new ShapeCardId.** `disposition` is NOT added to `ShapeCardId`, `CARD_PREFERENCES`, `SHAPE_CARD_PRACTICE_TEXT`, or `SHAPE_CARD_PATTERN_NOTE`. The eight Shape cards remain canonical at eight.

**Distinct from existing measurements (binding rule):**

- OCEAN is **derivation only**. The user is never asked to rank themselves on Big-5; the distribution emerges from how they answered the existing questions across Lens / Compass / Allocation / Drive / Trust / Conviction / Pressure / Formation / Context / Belief blocks.
- The **N axis is shipped as estimated**, not as a direct measurement. The instrument proxies Neuroticism through formation-history (`chaos_exposure`), current-context load (`high_pressure_context`), pressure-adaptation behavior (`adapts_under_*`), and agency reactivity (`reactive_operator`). These are state-and-history signals, not trait-level reactivity. The "(estimated)" parenthetical and the per-bar subscript make the proxy nature explicit at every render surface.
- OCEAN signals are **not** sacred-value priority signals, **not** drive signals, **not** trust signals. The framework is its own register; conflating with any of the above would corrupt their respective computations. The shared dependency is `weightFor` from `lib/drive.ts` (the rank-aware weighting ladder) — that's a tuning convenience, not a semantic merger.

Full architectural framework, the tagging table, the multi-tag math, the Neuroticism-floor architecture, the four distribution-shape cases, and the locked prose templates live in the dedicated canon file `ocean-framework.md`. This framework doc names the structure at the umbrella level; the dedicated doc owns the operational truth.

---

## CC-042 — Work Map (added 2026-04-29)

CC-042 introduces a **Work Map** as a derived non-card page section between the Disposition Map and Map. The section is labeled **"Work Map"** and renders 1–2 work registers the user is structurally aligned to — categories of vocation/hobby/skill that will come easy and feel meaningful given the user's cognitive register, motivational distribution, trait disposition, and value orientation. Each register carries 2–3 example anchors (specific vocations / hobbies / skills) to ground the abstract category. Sourced from a composite predicate over signals already collected by the instrument.

**Not a ShapeCard.** ShapeCards have a 4-section architecture (Strength / Growth Edge / Practice / Pattern Note) and a body-part metaphor; the Work Map is a cross-cutting derivation that doesn't fit either schema. The Work Map sits at the **page level**, parallel to MirrorSection, the Disposition Map, and MapSection — it is a rendering surface, not a measurement surface in the body-map taxonomy.

Architectural rationale for the placement:

- **Adjacency to Disposition Map is natural.** Both are derivation-only page sections that compose existing signals; the Work Map reads the OCEAN distribution as one of its inputs. Sitting them adjacent keeps the derivation register coherent across the report.
- **Body-part metaphor doesn't apply.** Work Map names categories of vocation, not a Card 1–8 body-part read. Trying to assign it a body-part would force a metaphor where none belongs.
- **No new ShapeCardId.** `work_map` is NOT added to `ShapeCardId`, `CARD_PREFERENCES`, `SHAPE_CARD_PRACTICE_TEXT`, or `SHAPE_CARD_PATTERN_NOTE`. The eight Shape cards remain canonical at eight.

**Distinct from existing measurements (binding rule):**

- The Work Map is **derivation only**. The user is never asked vocation-specific questions; the matched registers emerge from how they answered the existing questions across Lens / Drive / OCEAN / Q-E1 / Compass / Q-Ambition1 / Path agency aspiration.
- The Work Map composes existing outputs (Drive, OCEAN, Lens aux-pair register) as inputs. It does **not** introduce new signals; the framework reads what's already in `signals[]` and the engine outputs.
- Work Map is the first of three sibling outputs (Work / Love / Giving). CC-043 (Love Map) and CC-044 (Giving Map) follow the same architectural pattern with sibling-specific predicate inputs and register taxonomies. The pattern (8 registers, composite predicate, top-1-vs-top-2 thresholds, page section between adjacent registers) is the canonical scaffold; per-domain register identities and predicate inputs are sibling-specific.

Full architectural framework, the 8 register taxonomy, the composite predicate inputs, the threshold ladder, and the locked prose templates live in the dedicated canon file `work-map.md`. This framework doc names the structure at the umbrella level; the dedicated doc owns the operational truth.

---

## CC-044 — Love Map (added 2026-04-29)

CC-044 introduces a **Love Map** as the third derived non-card page section. The section is labeled **"Love Map"** and renders 1–2 matched love registers (1 of 7 character-types) plus top 1–3 flavors (1 of 7 functional modes) plus a Resource Balance diagnostic that surfaces only when self-vs-other investment is distorted. Sourced from a composite predicate over signals already collected by the instrument.

**Page sequence post-CC-044:** *Mirror → Disposition Map → Work Map → Love Map → Map → Compass → ...*

**Not a ShapeCard.** Same architectural rationale as Disposition Map and Work Map: ShapeCards have a 4-section architecture (Strength / Growth Edge / Practice / Pattern Note) and a body-part metaphor; the Love Map is a cross-cutting derivation that doesn't fit either schema. The Love Map sits at the **page level**, parallel to MirrorSection, the Disposition Map, the Work Map, and MapSection.

Architectural rationale for the placement:

- **Adjacency to Work Map is natural.** Both are sibling derivations on the Work / Love / Giving triadic decomposition Jason articulated. Where Work Map expresses the cost-axis of Drive, Love Map expresses the *intimate* sub-register of the coverage-axis. Sitting them adjacent keeps the purpose-output register coherent.
- **Body-part metaphor doesn't apply.** Love Map names categories of love-shape, not a Card 1–8 body-part read.
- **No new ShapeCardId.** `love_map` is NOT added to `ShapeCardId`, `CARD_PREFERENCES`, `SHAPE_CARD_PRACTICE_TEXT`, or `SHAPE_CARD_PATTERN_NOTE`. The eight Shape cards remain canonical at eight.

**Six-layer architecture distinguishes Love Map from Work Map:**

1. **Pauline framing** (1 Corinthians 13) — universal/normative ethical floor. Plain-language paraphrase only in user-facing prose; framework name does NOT surface.
2. **Register (7)** — character-type / cognitive-relational shape; composes with aux-pair register.
3. **Flavor (7)** — functional mode; what love DOES for the person.
4. **Virtue baseline** — Pauline negatives applied per register as distortion-diagnostic vocabulary.
5. **Bond type (Greek 4)** — Eros / Philia / Storge / Agape; deferred to CC-045+ for surfacing.
6. **Resource Balance** — self-vs-other investment ratio; surfaces independently when distorted.

**Distinct from existing measurements (binding rule):**

- The Love Map is **derivation only**. The user is never asked love-specific questions; the matched registers emerge from how they answered the existing questions across Lens / Drive / OCEAN / Compass / Q-X4 / Q-S3 / Q-E1 / Q-Stakes1 / Q-Ambition1 / Path agency aspiration.
- The Love Map composes existing outputs (Drive, OCEAN, Lens aux-pair register) as inputs. It does **not** introduce new signals.
- Love Map is the second of three sibling outputs (Work / Love / Giving). CC-045 (Giving Map) follows the same architectural pattern with sibling-specific predicate inputs and register taxonomy.
- **The Pauline framework name itself never surfaces in user-facing prose** per CC-048 Rule 1 (frameworks behind the scenes). The Pauline qualities — patient, kind, persists, refuses to keep records, rejoices with truth — surface in plain-language paraphrase via the locked framing paragraph above the register render.

**Resource Balance is a separate diagnostic axis** — it surfaces independently of register matching. A user with no strong register match but `inward_heavy` / `outward_depleted` / `thin_overall` Resource Balance still sees the locked prose paragraph for that case. A user with strong register match AND `healthy` balance sees register prose without a balance line.

Full architectural framework, the six-layer architecture, the 7 register taxonomy, the 7 flavor taxonomy, predicate intents, Resource Balance compute and locked prose, Pauline reconciliation, Greek-4 bond-type deferral, and Philautia handling live in the dedicated canon file `love-map.md`.
