# Question Bank v1 (Alpha)

## Purpose

Define the first working set of questions across core cards.

Each question must:
- map to a card
- produce a signal
- support future tension detection

---

## Ranking Question Schema

Ranking questions are authorized by `card-schema.md` § Question Types. A ranking question presents N items and asks the user to order them; each item emits its signal at a strength derived from the position the item occupied in the user's order, per `signal-mapping-rule.md` § Ranking Question Signal Emission.

**Item-count rule** (defined in `card-schema.md` § Question Types — *Ranking primitive: item-count rule*): three minimum, four default, five maximum. Above five, restructure.

**Multi-stage ranking pattern** — When a domain genuinely contains more than five items of resolution, the engine does not ask the user to rank seven or eight things at once. The domain is split into two parent groups, each ranked separately at 3-or-4 items, and a derived cross-rank resolves the top picks of each parent against each other.

Architectural properties:

1. Each parent stays at 3 or 4 items. The user never sees more than 4 things to rank in a single panel.
2. The cross-rank is always 4 items — top-2 of each parent. Fixed cross-rank shape regardless of parent size.
3. Parent rankings emit signals with `rank` 1..N. Cross-ranks emit cross-rank signals (`cross_rank` 1..4) using the same signal IDs as the parents. This gives the engine a clean, separable view of *what the user picked in isolation* versus *what the user picked when forced to resolve across the wider domain*.
4. The cross-rank does not carry the aspirational overlay. Only parent rankings do. The cross-rank reads pure resolved-priority direction; the overlay reads stated-vs-aspired posture per category, which only makes sense at the parent level where each category is fully visible.
5. Parents may carry domain-specific overlays (e.g., the three-state aspirational overlay `wish_less` / `right` / `wish_more` on Q-S3 / Q-E1 parents).

**Canonical examples:**

- **Q-S3-close** (3 items, parent) + **Q-S3-wider** (3 items, parent) + **Q-S3-cross** (derived, 4 items) — money allocation. Introduced in CC-016.
- **Q-E1-outward** (3 items, parent) + **Q-E1-inward** (3 items, parent) + **Q-E1-cross** (derived, 4 items) — energy allocation. Introduced in CC-016.
- **Q-X3** (multi-stage; institutional trust) — introduced in CC-031 (forward-reference; canonized as the architectural shape, item composition resolves at CC-031 drafting per `docs/product-direction/v2-5-universal-three.md` § Q-X3).
- **Q-X4** (multi-stage; personal trust) — introduced in CC-032 (forward-reference; relational / chosen split per `docs/product-direction/v2-5-universal-three.md` § Q-X4).

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
- type: ranking
- question: When something goes wrong, rank where the responsibility most often sits.
- items:
  - id: individual
    label: Individual
    gloss: the person who acted, and what they brought to the moment.
    signal: individual_responsibility_priority
  - id: system
    label: System
    gloss: the structures and incentives shaping what was possible.
    signal: system_responsibility_priority
  - id: nature
    label: Nature
    gloss: chance, biology, the way things just are.
    signal: nature_responsibility_priority
  - id: supernatural
    label: Supernatural
    gloss: divine will, fate, or what's beyond human reach.
    signal: supernatural_responsibility_priority
  - id: authority
    label: Authority
    gloss: the people in charge of the system, not the system itself.
    signal: authority_responsibility_priority

Q-C4 ranked attribution. Locked at umbrella level in `shape-framework.md` § Card 4 (Gravity). Glosses verbatim from `docs/option-glosses-v1.md` § Q-C4 (locked 2026-04-25). Replaces the legacy forced-choice version of Q-C4 (three options: The individual / The system / Both equally), which is now retired. The three legacy signals are deprecated in `signal-library.md`. T-009 (Individual vs System Responsibility) still references the legacy signals and is now formally canon-blocked; T-009 rewrite to consume the new rank-aware signals is future-CC scope.

**Q-C4 — canonical 5-item exception (CC-030).** The five attribution categories (Individual / System / Nature / Supernatural / Authority) do not split cleanly into two parents — they are five distinct ontological frames for where responsibility lives, and forcing them into two groups would smear a distinction the question is specifically trying to surface (System as structural-impersonal versus Authority as structural-personal, for instance, only reads cleanly when both are visible at once). Q-C4 sits at the principle's ceiling deliberately because the alternative loses signal. Per `card-schema.md` § Question Types: *"Five items maximum — acceptable when the domain genuinely requires that resolution and no clean way exists to split it into two parents."*

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
  - Hide it from work
  - Don't volunteer it
  - Accept the risk
- signals:
  - adapts_under_economic_pressure
  - hides_belief
  - holds_internal_conviction
  - high_conviction_under_risk

**CC-027 label sharpening (2026-04-27)**: middle-two options renamed from "Keep it private" / "Hold it quietly" to "Hide it from work" / "Don't volunteer it" so the active-vs-passive concealment split the engine already encodes via distinct signals (`hides_belief` = active concealment; `holds_internal_conviction` = passive non-advocacy) becomes visible to users. Real-user testing showed the prior labels collapsing in users' heads — both read as "I have it, but don't talk about it." Signal IDs and signal descriptions unchanged.

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

## Q-X3 (retired in CC-031)

The legacy single 5-item Q-X3 (Government / Press / Companies / Education / Non-Profits & Religious) was retired in CC-031 in favor of the multi-stage form below (Q-X3-public + Q-X3-information-and-commercial + Q-X3-cross). Four legacy signals (`government_trust_priority`, `press_trust_priority`, `companies_trust_priority`, `nonprofits_religious_trust_priority`) are retired; `education_trust_priority` is preserved unchanged. Pre-CC-031 saved sessions still carry the legacy signal IDs; renderers degrade gracefully (see § "Saved-session compatibility" in `signal-library.md`).

---

## Q-X3-public

- card_id: context
- type: ranking
- question: How much do you trust each of these public-mission institutions to tell the truth and act in good faith? Rank in order.
- helper: Five public and civic institutions. Most trusted at the top, least trusted at the bottom.
- items:
  - id: government_elected
    label: Government — Elected
    gloss: elected representatives, legislatures, and the political apparatus.
    signal: government_elected_trust_priority
  - id: government_services
    label: Government — Services
    gloss: the on-the-ground services of government — public schools, DMV, water, sanitation, local police.
    signal: government_services_trust_priority
  - id: education
    label: Education
    gloss: schools, colleges, and the credentialing they grant.
    signal: education_trust_priority
  - id: nonprofits
    label: Non-Profits
    gloss: charities, NGOs, and voluntary missions outside religious frame.
    signal: nonprofits_trust_priority
  - id: religious
    label: Religious
    gloss: churches, faith communities, and explicitly religious missions.
    signal: religious_trust_priority

**Q-X3-public — public-mission and civic institutions, parent ranking #1 of the multi-stage Q-X3 (CC-031).** Sits at the principle's 5-item ceiling deliberately — per `card-schema.md` § Question Types and CC-030's canonized item-count rule, five items are acceptable when the domain genuinely requires that resolution. The four splits (Government-Elected vs. Government-Services, Non-Profits vs. Religious) all matter; collapsing any of them loses the signal CC-031 was specifically designed to preserve.

---

## Q-X3-information-and-commercial

- card_id: context
- type: ranking
- question: How much do you trust each of these information and commercial institutions to tell the truth and act in good faith? Rank in order.
- helper: Five information-distribution and commercial institutions. Most trusted at the top, least trusted at the bottom.
- items:
  - id: journalism
    label: Journalism
    gloss: individual journalists and the discipline of journalistic craft.
    signal: journalism_trust_priority
  - id: news_organizations
    label: News organizations
    gloss: newsrooms, outlets, and the institutions that distribute and shape journalism.
    signal: news_organizations_trust_priority
  - id: social_media
    label: Social Media
    gloss: platforms that mediate information through algorithm and influence — Twitter/X, TikTok, YouTube, Instagram, Facebook, Substack, Reddit.
    signal: social_media_trust_priority
  - id: small_business
    label: Small / Private Business
    gloss: small, private, closely-held businesses — the local shop, the family firm, the contractor you've used for years.
    signal: small_business_trust_priority
  - id: large_companies
    label: Large / Public Companies
    gloss: large, public, publicly-traded companies — the multinationals, the platforms, the brands at scale.
    signal: large_companies_trust_priority

**Q-X3-information-and-commercial — commercial and information-distribution institutions, parent ranking #2 of the multi-stage Q-X3 (CC-031).** Also at the 5-item ceiling. Adds the Social Media category that the legacy Q-X3 omitted entirely; splits Press into Journalism (craft-level) vs. News organizations (institutional-level); splits Companies into Small/Private Business vs. Large/Public Companies. The legacy form's averaging hides postures that move opposite directions in real users.

---

## Q-X3-cross

- card_id: context
- type: ranking_derived
- derived_from: [Q-X3-public, Q-X3-information-and-commercial]
- question: When public-mission and information-and-commercial institutions compete for your trust, where does it actually go?
- helper: Your top picks from the previous two rankings. Rank in resolved priority — what wins when they're forced to compete.

**Q-X3-cross — derived 4-item cross-rank** (top-2 of each parent), the resolved-priority read of the multi-stage Q-X3 (CC-031). Per the multi-stage pattern in `question-bank-v1.md` § Ranking Question Schema (CC-030): cross-ranks are always 4 items, fixed shape regardless of parent size. Cross-rank emits `cross_rank` 1..4 signals using the same signal IDs as the parents. Consumed by Q-I2's derivation cascade post-CC-032.

---

## Q-X4 (retired in CC-032)

The legacy single 5-item Q-X4 (Spouse-or-partner / Close-friend / Family / Mentor-or-advisor / Your-own-counsel) was retired in CC-032 in favor of the multi-stage form below (Q-X4-relational + Q-X4-chosen + Q-X4-cross). The five legacy personal-trust signals are all preserved; one new signal (`outside_expert_trust_priority`) is added for the trusted-professional category the legacy form omitted. The relational/chosen split captures the architectural truth that entanglement-based trust and selection-based trust cluster differently in real users.

---

## Q-X4-relational

- card_id: context
- type: ranking
- question: When you need to hear the truth and not just kindness, whom of these — the people entangled in your life — do you trust most? Rank in order.
- helper: Three relational trust sources. Most trusted at the top, least trusted at the bottom.
- items:
  - id: partner
    label: A spouse or partner
    gloss: someone whose life is fully entangled with yours.
    signal: partner_trust_priority
  - id: family
    label: Family
    gloss: parents, siblings, or chosen kin who knew you before this version of you.
    signal: family_trust_priority
  - id: friend
    label: A close friend
    gloss: someone who has earned your trust outside obligation.
    signal: friend_trust_priority

**Q-X4-relational — entanglement-based trust, parent ranking #1 of the multi-stage Q-X4 (CC-032).** Three items at the principle's default. Relational trust is a function of who knew you before this version of you, who is entangled with the rest of your life. Per-item "doesn't apply" affordance is still deferred to v2 per `shape-framework.md` § Deferred — the multi-stage form gives the affordance a natural home (parent level) and unblocks it as a small follow-up CC.

---

## Q-X4-chosen

- card_id: context
- type: ranking
- question: And when you need truth from someone you've selected for their judgment — not someone bound to you by relationship — whom do you trust most? Rank in order.
- helper: Three chosen trust sources. Most trusted at the top, least trusted at the bottom.
- items:
  - id: mentor
    label: A mentor or advisor
    gloss: someone whose judgment you've sought across years.
    signal: mentor_trust_priority
  - id: outside_expert
    label: An outside expert
    gloss: a therapist, doctor, lawyer, coach, financial advisor, or clergy member — the trusted professional.
    signal: outside_expert_trust_priority
  - id: own_counsel
    label: Your own counsel
    gloss: your own judgment, when no other source feels right.
    signal: own_counsel_trust_priority

**Q-X4-chosen — selection-based trust, parent ranking #2 of the multi-stage Q-X4 (CC-032).** Three items at the principle's default. Chosen trust is a function of whose judgment you have selected for, often through paying for it or seeking it. Adds the missing **Outside expert** category (therapist / doctor / lawyer / coach / financial advisor / clergy member) — a real and common trust posture the legacy 5-item Q-X4 forced users to spread into "mentor or advisor" or compress into "own counsel." The label "outside expert" is canonical; don't substitute "professional" / "expert" / "advisor."

---

## Q-X4-cross

- card_id: context
- type: ranking_derived
- derived_from: [Q-X4-relational, Q-X4-chosen]
- question: When relational trust and chosen trust compete for the same hard-truth question, who actually wins?
- helper: Your top picks from the previous two rankings. Rank in resolved priority.

**Q-X4-cross — derived 4-item cross-rank** (top-2 of each parent), the resolved-priority read of the multi-stage Q-X4 (CC-032). Cross-rank emits `cross_rank` 1..4 signals using the same signal IDs as the parents. Consumed by Q-I2's derivation cascade post-CC-032.

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

**CC-028 amendment (2026-04-27)**: Q-S1 and Q-S2 expanded from 4 items each to 6 items each. The 8-item sacred-value pool was confirmed across four real-user sessions (Madison, Jason, Michele, LaCinda) to produce **top-3-universal compression** — every user's top three came from the same handful (Family / Freedom / Loyalty plus one discriminator). The 12-item pool restores meaningful gradient between users at the Compass card. The four new values follow the verb-noun composition rule (`feedback_sacred_vs_contribution_register.md`): each composes with its question's verb register and carries distinct semantic territory not covered by existing items. Contribution verbs (Teaching, Leading, Supporting) were considered and rejected — they belong on Path/Gravity, not Compass.

## Q-S1

- card_id: sacred
- type: ranking
- question: Order these by what you'd protect first when something has to give.
- helper: Six of your own. Rank by which holds first when two of them pull apart.
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
  - id: peace
    label: Peace
    gloss: interior groundedness — the calm that holds even when conditions don't.
    signal: peace_priority
  - id: honor
    label: Honor
    gloss: keeping faith with your word, even when no one would notice the breach.
    signal: honor_priority

Q-S1's register is **embodied / qualities-of-self values** — things you protect because they are how you stand. Peace pairs naturally with Stability (both interior states); Honor pairs naturally with Truth (both quality-of-self commitments). Both compose with the protect register.

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
  - id: compassion
    label: Compassion
    gloss: being moved by what hurts in others, and not turning away.
    signal: compassion_priority
  - id: mercy
    label: Mercy
    gloss: softening the verdict, even when the verdict was fair.
    signal: mercy_priority

Q-S2's register is **external pulls / orientations toward others** — things that claim you because of what they are or who they are. The suffering of others claims compassion; the imperfection of others claims mercy. Mercy pairs naturally with Justice (the justice/mercy axis); Compassion pairs naturally with Family (relational orientation).

---

# Temperament Card (Four Voices)

The Temperament card carries `display_name: "Four Voices"` per `temperament-framework.md` § 8. Eight ranking questions, four perceiving (Q-T1–Q-T4: Ni / Ne / Si / Se) and four judging (Q-T5–Q-T8: Ti / Te / Fi / Fe). Each question presents four voice-styled first-person statements; the user ranks 1–4 by self-recognition. Each function appears in exactly four items across its block. Voice tokens (Voice A / B / C / D) follow reading order, not function. Aggregate rank across each function's four appearances determines stack position per `temperament-framework.md` § 4.

## Q-T1

- card_id: temperament
- display_name: Four Voices
- type: ranking
- question: When you're working on a hard problem
- items:
  - id: ni
    label: Voice A
    voice: Voice A
    quote: "Once I see how the pieces are going to land, the rest is mostly execution. I'm looking for the pattern that would explain everything else."
    signal: ni
  - id: ne
    label: Voice B
    voice: Voice B
    quote: "There are at least four interesting angles here. I want to spend time on each before deciding which one fits."
    signal: ne
  - id: si
    label: Voice C
    voice: Voice C
    quote: "What's worked in similar situations before? There's usually precedent worth checking before reinventing."
    signal: si
  - id: se
    label: Voice D
    voice: Voice D
    quote: "Let me start moving and see what surfaces. I'll know what I'm dealing with once I'm actually working on it."
    signal: se

Q-T1 scenario: hard-problem approach. Voice quotes promoted from `docs/temperament-voice-draft-v1.md` § Q-T1 (locked in CC-010). Five soft-spot quotes (Q-T1 Se, Q-T2 Ne, Q-T3 Si, Q-T6 Fi, Q-T8 Ti/Te) ship as drafted; iteration on quote wording is a separate copy-polish CC.

**Q-T1–Q-T8 — canonical four-default-at-scale (CC-030).** Each of the eight Q-T questions is a 4-item ranking (the four cognitive functions surfaced as Voice A / B / C / D). The eight-question structure gives the engine adequate observation depth without piling items into any single ranking. Per `card-schema.md` § Question Types: four-default. Q-T is the canonical example of the principle applied at scale — many small rankings, not one big one.

---

## Q-T2

- card_id: temperament
- display_name: Four Voices
- type: ranking
- question: When you walk into a new environment
- items:
  - id: ne
    label: Voice A
    voice: Voice A
    quote: "This is interesting — there are so many new possibilities here. I want to explore widely before forming any conclusions."
    signal: ne
  - id: si
    label: Voice B
    voice: Voice B
    quote: "I'm comparing this to similar environments I've been in. The differences are telling me what I need to pay attention to."
    signal: si
  - id: se
    label: Voice C
    voice: Voice C
    quote: "I'm taking in what's actually present — the room, the people, the energy. I'll respond to what I find."
    signal: se
  - id: ni
    label: Voice D
    voice: Voice D
    quote: "I'm already picking up on what this place is really about. A few cues tell me more than the formal orientation would."
    signal: ni

Q-T2 scenario: new environment. Voice quotes promoted from `docs/temperament-voice-draft-v1.md` § Q-T2 (locked in CC-010). Five soft-spot quotes (Q-T1 Se, Q-T2 Ne, Q-T3 Si, Q-T6 Fi, Q-T8 Ti/Te) ship as drafted; iteration on quote wording is a separate copy-polish CC.

**Q-T1–Q-T8 — canonical four-default-at-scale (CC-030).** Each of the eight Q-T questions is a 4-item ranking (the four cognitive functions surfaced as Voice A / B / C / D). The eight-question structure gives the engine adequate observation depth without piling items into any single ranking. Per `card-schema.md` § Question Types: four-default. Q-T is the canonical example of the principle applied at scale — many small rankings, not one big one.

---

## Q-T3

- card_id: temperament
- display_name: Four Voices
- type: ranking
- question: When you're learning something new
- items:
  - id: si
    label: Voice A
    voice: Voice A
    quote: "I want to learn it the way experts have taught it. The proven sequence usually exists for a reason."
    signal: si
  - id: se
    label: Voice B
    voice: Voice B
    quote: "I learn by doing it. Pick it up, try it, adjust based on what's actually happening in my hands."
    signal: se
  - id: ni
    label: Voice C
    voice: Voice C
    quote: "I want to understand what the skill is really *for*. Once I get the underlying principle, the specifics fall into place."
    signal: ni
  - id: ne
    label: Voice D
    voice: Voice D
    quote: "I'd rather try several approaches than commit to one method. Different methods reveal different things about the skill."
    signal: ne

Q-T3 scenario: learning something new. Voice quotes promoted from `docs/temperament-voice-draft-v1.md` § Q-T3 (locked in CC-010). Five soft-spot quotes (Q-T1 Se, Q-T2 Ne, Q-T3 Si, Q-T6 Fi, Q-T8 Ti/Te) ship as drafted; iteration on quote wording is a separate copy-polish CC. Note: the Q-T3 Ni quote contains literal markdown-style asterisks around `*for*` per the draft; the Ranking primitive does not parse markdown, so the asterisks render literally in v1.

**Q-T1–Q-T8 — canonical four-default-at-scale (CC-030).** Each of the eight Q-T questions is a 4-item ranking (the four cognitive functions surfaced as Voice A / B / C / D). The eight-question structure gives the engine adequate observation depth without piling items into any single ranking. Per `card-schema.md` § Question Types: four-default. Q-T is the canonical example of the principle applied at scale — many small rankings, not one big one.

---

## Q-T4

- card_id: temperament
- display_name: Four Voices
- type: ranking
- question: When you're trying to read a complex situation
- items:
  - id: se
    label: Voice A
    voice: Voice A
    quote: "I'm watching what's actually happening, not what people say is happening. Behavior in the moment is more honest than explanations."
    signal: se
  - id: ni
    label: Voice B
    voice: Voice B
    quote: "I'm looking for the one underlying thing that would explain all the other observations at once."
    signal: ni
  - id: ne
    label: Voice C
    voice: Voice C
    quote: "There are probably several forces at work here. I want to map them and see how they interact before picking a read."
    signal: ne
  - id: si
    label: Voice D
    voice: Voice D
    quote: "I've seen this kind of situation before. The pattern-match to past examples tells me a lot about what's likely happening."
    signal: si

Q-T4 scenario: reading a complex situation. Voice quotes promoted from `docs/temperament-voice-draft-v1.md` § Q-T4 (locked in CC-010). Five soft-spot quotes (Q-T1 Se, Q-T2 Ne, Q-T3 Si, Q-T6 Fi, Q-T8 Ti/Te) ship as drafted; iteration on quote wording is a separate copy-polish CC.

**Q-T1–Q-T8 — canonical four-default-at-scale (CC-030).** Each of the eight Q-T questions is a 4-item ranking (the four cognitive functions surfaced as Voice A / B / C / D). The eight-question structure gives the engine adequate observation depth without piling items into any single ranking. Per `card-schema.md` § Question Types: four-default. Q-T is the canonical example of the principle applied at scale — many small rankings, not one big one.

---

## Q-T5

- card_id: temperament
- display_name: Four Voices
- type: ranking
- question: When a plan isn't working
- items:
  - id: ti
    label: Voice A
    voice: Voice A
    quote: "There's a flaw in the underlying logic of the plan. I want to find it before we change what we're doing."
    signal: ti
  - id: te
    label: Voice B
    voice: Voice B
    quote: "Let's change what we're doing now to hit the target. We can diagnose the failure afterward."
    signal: te
  - id: fi
    label: Voice C
    voice: Voice C
    quote: "Before we keep pushing, I want to know whether this plan is actually aligned with what we care about. Maybe the plan is fine but we're wrong about wanting it."
    signal: fi
  - id: fe
    label: Voice D
    voice: Voice D
    quote: "People are getting frustrated. Before we can fix the plan, we need to address what the friction is doing to the team."
    signal: fe

Q-T5 scenario: plan failure response. Voice quotes promoted from `docs/temperament-voice-draft-v1.md` § Q-T5 (locked in CC-010). Five soft-spot quotes (Q-T1 Se, Q-T2 Ne, Q-T3 Si, Q-T6 Fi, Q-T8 Ti/Te) ship as drafted; iteration on quote wording is a separate copy-polish CC.

**Q-T1–Q-T8 — canonical four-default-at-scale (CC-030).** Each of the eight Q-T questions is a 4-item ranking (the four cognitive functions surfaced as Voice A / B / C / D). The eight-question structure gives the engine adequate observation depth without piling items into any single ranking. Per `card-schema.md` § Question Types: four-default. Q-T is the canonical example of the principle applied at scale — many small rankings, not one big one.

---

## Q-T6

- card_id: temperament
- display_name: Four Voices
- type: ranking
- question: When someone you respect disagrees with you
- items:
  - id: te
    label: Voice A
    voice: Voice A
    quote: "If they're right, we should change course quickly. What's the fastest way to test who's seeing it more clearly?"
    signal: te
  - id: fi
    label: Voice B
    voice: Voice B
    quote: "I have to stay true to what I actually think is right, even if they disagree. But the disagreement matters — I want to sit with it."
    signal: fi
  - id: fe
    label: Voice C
    voice: Voice C
    quote: "I care about the relationship as much as being right. Whatever the answer is, I want us to land somewhere we can both stand."
    signal: fe
  - id: ti
    label: Voice D
    voice: Voice D
    quote: "Before I adjust, I want to understand exactly where their reasoning differs from mine. The disagreement is informative — I just need to pin down what it turns on."
    signal: ti

Q-T6 scenario: respected disagreement. Voice quotes promoted from `docs/temperament-voice-draft-v1.md` § Q-T6 (locked in CC-010). Five soft-spot quotes (Q-T1 Se, Q-T2 Ne, Q-T3 Si, Q-T6 Fi, Q-T8 Ti/Te) ship as drafted; iteration on quote wording is a separate copy-polish CC.

**Q-T1–Q-T8 — canonical four-default-at-scale (CC-030).** Each of the eight Q-T questions is a 4-item ranking (the four cognitive functions surfaced as Voice A / B / C / D). The eight-question structure gives the engine adequate observation depth without piling items into any single ranking. Per `card-schema.md` § Question Types: four-default. Q-T is the canonical example of the principle applied at scale — many small rankings, not one big one.

---

## Q-T7

- card_id: temperament
- display_name: Four Voices
- type: ranking
- question: When you have to make a hard call
- items:
  - id: fi
    label: Voice A
    voice: Voice A
    quote: "I can't make this call well until I'm clear on what I actually believe matters here. Externally-optimal but internally-wrong is the worst place to land."
    signal: fi
  - id: fe
    label: Voice B
    voice: Voice B
    quote: "Whatever I decide affects other people. I want to understand who carries what cost before I choose."
    signal: fe
  - id: ti
    label: Voice C
    voice: Voice C
    quote: "I want to get the decision framework right first. The right framework makes the call itself straightforward."
    signal: ti
  - id: te
    label: Voice D
    voice: Voice D
    quote: "The data's in. Let's pick the option that best hits the goal and move. We can course-correct once we see how it plays out."
    signal: te

Q-T7 scenario: hard call. Voice quotes promoted from `docs/temperament-voice-draft-v1.md` § Q-T7 (locked in CC-010). Five soft-spot quotes (Q-T1 Se, Q-T2 Ne, Q-T3 Si, Q-T6 Fi, Q-T8 Ti/Te) ship as drafted; iteration on quote wording is a separate copy-polish CC.

**Q-T1–Q-T8 — canonical four-default-at-scale (CC-030).** Each of the eight Q-T questions is a 4-item ranking (the four cognitive functions surfaced as Voice A / B / C / D). The eight-question structure gives the engine adequate observation depth without piling items into any single ranking. Per `card-schema.md` § Question Types: four-default. Q-T is the canonical example of the principle applied at scale — many small rankings, not one big one.

---

## Q-T8

- card_id: temperament
- display_name: Four Voices
- type: ranking
- question: When someone close to you is struggling
- items:
  - id: fe
    label: Voice A
    voice: Voice A
    quote: "I'm paying attention to what they need from me in the moment: quiet, reassurance, company, honesty, or help carrying it."
    signal: fe
  - id: ti
    label: Voice B
    voice: Voice B
    quote: "I want to understand what's really going on before I respond. If I misread the problem, even sincere help can make it worse."
    signal: ti
  - id: te
    label: Voice C
    voice: Voice C
    quote: "I want to find the next useful action. What needs to be handled, fixed, arranged, or removed so they can breathe?"
    signal: te
  - id: fi
    label: Voice D
    voice: Voice D
    quote: "I want to honor what this feels like from inside their life. I don't want to rush past the meaning of it just to make myself useful."
    signal: fi

Q-T8 scenario: someone close struggling. Voice quotes promoted from `docs/temperament-voice-draft-v1.md` § Q-T8 (locked in CC-010, revised 2026-04-24 from v1 original per the draft note). Five soft-spot quotes (Q-T1 Se, Q-T2 Ne, Q-T3 Si, Q-T6 Fi, Q-T8 Ti/Te) ship as drafted; iteration on quote wording is a separate copy-polish CC. Note: the draft includes a preamble line ("Order these by which most sounds like your first instinct:") between the scenario header and the items; this preamble is dropped in canon since Q-T questions do not carry helpers per `temperament-framework.md` § 8.

**Q-T1–Q-T8 — canonical four-default-at-scale (CC-030).** Each of the eight Q-T questions is a 4-item ranking (the four cognitive functions surfaced as Voice A / B / C / D). The eight-question structure gives the engine adequate observation depth without piling items into any single ranking. Per `card-schema.md` § Question Types: four-default. Q-T is the canonical example of the principle applied at scale — many small rankings, not one big one.

---

# Allocation Layer (CC-016 — Compass extension)

*Two domains (money, energy), each with two parent rankings + one derived cross-rank that resolves between them. Bound by `allocation-rules.md`: direction not quality, non-accusatory framing, current-vs-aspirational gap surfaced (not prescribed). The four parent rankings carry a per-category three-state aspirational overlay; the two cross-ranks do not.*

## Q-S3-close

- card_id: sacred
- type: ranking
- helper: Rank from most flow to least. The model reads direction, not moral quality.
- question: When you have discretionary money — beyond basic survival — where does it most naturally flow among the people closest to you?
- items:
  - yourself: your own needs, comforts, savings, well-being. → self_spending_priority
  - family: kin — parents, children, siblings, spouse, chosen kin. → family_spending_priority
  - friends: people you've chosen as close, outside family obligation. → friends_spending_priority
- overlay: per-category three-state (wish_less / right / wish_more)

## Q-S3-wider

- card_id: sacred
- type: ranking
- helper: Rank from most flow to least. Direction only — the model doesn't judge what kind of allocation this is.
- question: When your money flows beyond your immediate circle, where does it most naturally go?
- items:
  - social: experiences, leisure, dining, travel, entertainment. → social_spending_priority
  - nonprofits_religious: civil society and faith communities — charities, NGOs, churches, voluntary missions. → nonprofits_religious_spending_priority
  - companies: businesses you transact with — whether you own them, work for them, invest in them, or buy from them. (For self-employed users, this category may overlap with Yourself.) → companies_spending_priority
- overlay: per-category three-state

## Q-S3-cross

- card_id: sacred
- type: ranking_derived
- derived_from: [Q-S3-close, Q-S3-wider]
- derived_top_n: 2
- helper: These are your top picks from the previous two rankings. Rank them in resolved priority — what wins when they're forced to compete.
- question: When close-circle and wider-circle compete for the same dollar, where does it actually go?
- items: dynamically populated at render time from top-2 of each parent
- emits: cross-rank signals (same signal_ids as parents) with `cross_rank` ∈ [1..4]; consumed by T-013

## Q-E1-outward

- card_id: sacred
- type: ranking
- helper: Rank from most flow to least.
- question: When you have discretionary energy — not forced by obligation — where does it most naturally go in the outward, generative direction?
- items:
  - building: making something new — products, structures, frameworks, art, code, businesses, ideas. → building_energy_priority
  - solving: removing dysfunction — debugging, repairing, troubleshooting, fixing what's broken. → solving_energy_priority
  - restoring: bringing back coherence — organizing, cleaning, maintaining, preserving what already works. → restoring_energy_priority
- overlay: per-category three-state

## Q-E1-inward

- card_id: sacred
- type: ranking
- helper: Rank from most flow to least.
- question: And in the inward, relational direction — where does your discretionary energy most naturally go?
- items:
  - caring: attending to others — listening, supporting, presence, emotional labor. → caring_energy_priority
  - learning: taking in — reading, studying, exploring, making sense. → learning_energy_priority
  - enjoying: savoring — being in the moment, pleasure, rest, presence with what is. → enjoying_energy_priority
- overlay: per-category three-state

## Q-E1-cross

- card_id: sacred
- type: ranking_derived
- derived_from: [Q-E1-outward, Q-E1-inward]
- derived_top_n: 2
- helper: Your top picks from the previous two rankings. Rank in resolved priority.
- question: When outward energy and inward energy compete for the same hour, which actually wins?
- items: dynamically populated at render time from top-2 of each parent
- emits: cross-rank signals (same signal_ids as parents) with `cross_rank` ∈ [1..4]; consumed by T-014

---

## Q-Stakes1

- card_id: sacred (Compass shape card on the report; survey-side `card_id` is `"sacred"` for all Compass-extension questions per the `SURVEY_CARD_TO_SHAPE_CARD` mapping in `lib/cardAssets.ts`)
- type: ranking
- helper: Drag to reorder. Top is most important; bottom is least.
- question: Rank these by importance to your life — what would hurt most to lose.
- items (canonical order; user reorders via drag):
  1. money — Money / Wealth — `money_stakes_priority`
  2. job — Job / Career — `job_stakes_priority`
  3. close_relationships — Close relationships — `close_relationships_stakes_priority`
  4. reputation — Reputation — `reputation_stakes_priority`
  5. health — Physical safety / Health — `health_stakes_priority`
- emits: rank-aware priority signals (one per item ranked); consumed by Q-I3's derivation

**CC-024 introduction (2026-04-26)**: Q-Stakes1 is a Compass card extension that adds a second register alongside the abstract sacred-value rankings (Q-S1 / Q-S2). Architectural truth: *"what the heart loves abstractly + what the heart fears losing concretely."* The Compass card now measures both axes; per `shape-framework.md`'s Compass card framing extension.

The question feeds Q-I3's derivation — Q-I3 takes the user's top concrete stakes from Q-Stakes1 and asks which of those losses they would bear for the belief they named in Q-I1 (or Q-I1b). This restores composition between Q-I3's verb (*"would risk losing"*) and its answer space (*concrete losses*), which the pre-CC-024 Q-S1/Q-S2 source broke (sacred-by-definition means not-to-be-sacrificed; the verb couldn't compose with the noun).

**CC-035 amendment (2026-04-29)**: Q-Stakes1 expanded from 5 items to 6 by adding **Time / autonomy** (`time_autonomy_stakes_priority`) as the final item. The register is concrete-loss, not abstract-value: *how you spend your hours, control over your own life.* This lets Q-I3 expand from a top-3 to a top-6 derivation without changing its single-source architecture. *(Reverted in CC-043; see below.)*

**CC-043 amendment (2026-04-29)**: Q-Stakes1 architectural cleanup. Three drift items corrected together:

1. **Time / autonomy reverted.** The CC-035 addition was a category mistake — time is the *substrate* that all three drive registers compete for, not a *destination* of drive. The 3C's framework (Building / Coverage / Compliance) is exhaustive precisely because those are the only three places time and energy go. Adding "Time / autonomy" as a Q-Stakes1 item didn't discriminate Drive direction — it captured self-direction, which is already measured three other ways: `freedom_priority` in Compass, `agency.aspirational` register on Path, creator-agency detection across Q-A1 / Q-E1. The signal `time_autonomy_stakes_priority` is deleted entirely from the codebase. Q-Stakes1 returns to 5 items.

2. **Money item renamed.** *"Money / Financial security"* overloaded two registers (Money is cost-flavored resource; Financial security is compliance-flavored security frame). Renamed to *"Money / Wealth"* with gloss *"Your money, savings, the resources you've built."* The signal `money_stakes_priority` stays cost-tagged; the new label aligns with the post-CC-033 Drive cost-bucket label *"Building & wealth"* so the user's mental map composes.

3. **Job stakes retag.** `job_stakes_priority` Drive tag changed from cost to compliance. Career-in-loss-context (Q-Stakes1's framing — "what would hurt most to lose") is dominantly stability/security register; career-as-ambition (the building dimension) is captured separately by `success_priority` in Q-Ambition1. See `drive-framework.md § CC-043 amendment` for the full *security = compliance* canon principle.

**Security = compliance canon principle** (locked in CC-043): security and loss-prevention are risk-mitigation variables regardless of which domain the security applies to. *Financial security*, *physical safety*, *job security*, *reputation protection* are all compliance-class registers — *security* is the load-bearing word; the domain modifier names which area the security applies to. Q-Stakes1's loss-domain framing brings out the compliance dimension of any item that's named in security/protection/loss-prevention terms. Items that name a *resource* (Money / Wealth) rather than a *security frame* tag by their domain register (cost), not compliance. This forecloses future drift on similar items.

Saved-session compatibility: pre-CC-043 sessions that ranked the no-longer-existent `time` item still load (answer data is stable); the engine ignores any item id that isn't in the questions table — the contribution simply doesn't fire. No migration code needed.

---

## Q-3C1

- card_id: role (Path · Gait shape card on the report; the `role` survey-side `card_id` is reserved in `SURVEY_CARD_TO_SHAPE_CARD` for Path-anchored measurements and is activated by this question)
- type: ranking
- helper: Three of how decisions actually get made. Rank by which most often wins when they pull apart.
- question: When you have to choose, which most often guides you?
- items (canonical order; user reorders via drag):
  1. cost — Building wealth and standing — `cost_drive`
  2. coverage — Caring for people, service, and society — `coverage_drive`
  3. compliance — Managing risk and uncertainty — `compliance_drive`
- emits: three claimed-drive signals (one per item ranked, rank-aware); consumed by `lib/drive.ts § extractClaimedDrive` for the claimed-vs-revealed matrix on Path · Gait

**CC-026 introduction (2026-04-26)**: Q-3C1 is the model's first explicit broad why-measurement. See `drive-framework.md` for the architectural framing — most of the model's measurements expose *what*; Drive exposes *why*. The question captures the user's *claimed* drive; the *revealed* drive derives from a 15-input distribution computed at engine-derivation time across existing signals.

**CC-033 amendment (2026-04-29)**: the cost-bucket item label moved from *"Protecting financial security"* (with gloss *"your money, savings, the resources you've built."*) to *"Building wealth and standing"* (with gloss *"what you build, accumulate, and become known for."*). The prior wording conflated cost-as-ambition with compliance-as-security; security already lives in its own bucket. The item id (`cost`) and signal id (`cost_drive`) are canon-locked and unchanged. Coverage and compliance items are unchanged.

**CC-040 amendment (2026-04-29)**: the coverage-bucket item label moved from *"Caring for those closest to you"* (with gloss *"the people, relationships, and commitments you love."*) to *"Caring for people, service, and society"* (with gloss *"the people you love, the work you give, and the world you contribute to."*). Mirrors the CC-033 architectural pattern: relabel without re-tagging when the human label undersells what the bucket actually measures. The prior label captured only the intimate-circle dimension while the coverage bucket measures the full other-directed register — intimate-care + active service + civic belonging. The new gloss preserves the tripartite structure (people / work / world) so users see the bucket's full scope when ranking. The item id (`coverage`) and signal id (`coverage_drive`) are canon-locked and unchanged. Cost and compliance items are unchanged. Updated in lockstep with the pie-chart label rewrite per `drive-framework.md § CC-040 amendment`.

Vocabulary discipline: the framework terms (*Drive*, *claimed*, *revealed*, *cost-drive* / *coverage-drive* / *compliance-drive*) are engineer-facing only. User-facing prose uses human-language phrases (*"building & wealth"* / *"people, service, and society"* / *"risk and uncertainty"*) and never the framework terms themselves.

---

## Q-Ambition1

- card_id: role (Path · Gait shape card on the report; same survey-side `role` card_id as Q-3C1)
- type: ranking
- helper: Rank from most pull to least. There are no wrong answers; the model reads direction.
- question: When you imagine succeeding — what does the win look like?
- items (canonical order; user reorders via drag):
  1. success — Success — `success_priority`
  2. fame — Fame — `fame_priority`
  3. wealth — Wealth — `wealth_priority`
  4. legacy — Legacy — `legacy_priority`
- emits: four ambition-class priority signals (one per item ranked, rank-aware); all four tag `"cost"` in `lib/drive.ts § SIGNAL_DRIVE_TAGS`; feeds the revealed-drive cost-bucket distribution per `drive-framework.md`

**CC-033 introduction (2026-04-29)**: Q-Ambition1 sits adjacent to Q-3C1 on the role card. Q-3C1 captures *claimed* top-level drive across all three buckets; Q-Ambition1 refines the *revealed* measurement inside the cost bucket with four explicit pursuit-class signals — Success / Fame / Wealth / Legacy. Adds explicit ambition signals where the prior cost-bucket inputs (resource-allocation proxies like `building_energy_priority`, `self_spending_priority`, `money_stakes_priority`) only measured ambition indirectly.

Per the CC-030 item-count rule (`card-schema.md` § Question Types): Q-Ambition1 is a 4-item ranking — the principle's clean default. Rank-aware weighting applies (rank 1 = 3x, rank 2 = 2x, rank 3 = 1x, rank 4 = 0.5x).

Tagging rationale per signal lives in `drive-framework.md § Cost-drive` and inline in `lib/drive.ts § SIGNAL_DRIVE_TAGS`. None of the four signals are multi-tagged; specifically `legacy_priority` is single-tagged `"cost"` (relational legacy is already captured by `family_priority` and family-class signals — multi-tagging would double-weight).

---

# Keystone Reflection (Critical)

*Sequenced after the Allocation Layer (re-ordered 2026-04-26): the user names stated values, then sees their actual allocation receipts, then marks aspirational gaps, and only then is asked to articulate a belief. The named ↔ spent ↔ wished priming produces more honest belief naming than asking up front.*

*Restructured by CC-017 from a freeform belief stress-test into an **anchor + cross-card structured stress-test**. Q-I1 (or Q-I1b on skip) anchors a belief; Q-I2 reads which trust sources could revise it (cross-card against Q-X3 + Q-X4); Q-I3 reads which concrete stakes the user would bear losing for it (cross-card against Q-Stakes1, the Compass card's concrete-stakes ranking). The engine reads the user's belief through their own pre-named portfolio of trust sources and concrete stakes rather than through text-mining the answer content. **CC-024 (2026-04-26)** reframed Q-I1's text from social-differentiation register to cost-bearing register, and re-derived Q-I3 from Q-Stakes1 (concrete losses) instead of Q-S1+Q-S2 (sacred values) — see the per-question entries below for the architectural rationale.*

*The model treats the four answers (anchor + Q-I2 + Q-I3) as a Belief Under Tension probe — a stress test for whether the user can name a conviction, articulate what would revise it (against their own most-trusted sources), and articulate what they would bear losing for it (against their own most-feared concrete losses). The model does not score any of the answers by content; the Q-I1 anchor's content is not signal-extracted into the BeliefUnderTension object (the four catalog signals — `independent_thought_signal`, `epistemic_flexibility`, `conviction_under_cost`, `cost_awareness` — continue to fire from the freeform via `extractFreeformSignals` and are preserved for v0 → v1 LLM-substitution continuity, per `signal-library.md`).*

## Q-I1

- card_id: conviction
- type: freeform
- question: What is a belief you'd bear real cost to keep?
- signals:
  - independent_thought_signal (heuristic from `extractFreeformSignals` — preserved, not consumed by BeliefUnderTension)
  - epistemic_flexibility (heuristic from `extractFreeformSignals` — preserved)
  - conviction_under_cost (heuristic from `extractFreeformSignals` — preserved)
  - cost_awareness (canonical-but-runtime-dead per `signal-library.md`; preserved for forward-compatibility)

Q-I1 is the **anchor only**. Its text is stored as the user's belief anchor and surfaced visibly at the top of Q-I2 and Q-I3 so the user sees the belief they're stress-testing. Skippable; if skipped, Q-I1b renders as the conditional follow-up.

**CC-024 reframe (2026-04-26)**: text changed from social-differentiation register (*"believe that most people around you disagree with"*) to cost-bearing register, matching the Keystone block's intended purpose as a cost-of-conviction stress-test. The four catalog signals continue to fire from the freeform content via `extractFreeformSignals` — the extractor is text-content-driven, not question-text-driven. Signal *quality* improves under the new framing because users write more cost-shaped content; the catalog itself is unchanged.

---

## Q-I1b

- card_id: conviction
- type: freeform
- render_if_skipped: Q-I1
- unskippable: true
- question: Ok, maybe not a heavy cost. How about a belief you'd defend even when it makes things harder?

Q-I1b is the **conditional follow-up** that renders only when Q-I1 was skipped (per the `render_if_skipped` predicate). Softer threshold (defending under friction, not bearing real cost). The only **unskippable** question in the bank — the Skip button does not render, and Continue is disabled until non-empty text is entered. The deliberate "quiet pressure" — the friction-threshold is broad enough that anyone who can introspect can name something, and the engine treats inability-to-name as itself a meta-signal (via the existing `question_skipped` MetaSignal on Q-I1; Q-I1b cannot itself emit `question_skipped`). The four catalog signals fire from Q-I1b's freeform content the same way they fire from Q-I1.

**CC-024 reframe (2026-04-26)**: text reframed alongside Q-I1 to stay in cost-bearing register. The architectural rule: Q-I1b's softer fallback must not collapse back to social-differentiation register; otherwise Q-I1's reframe is undermined the moment a user skips it.

---

## Q-I2

- card_id: conviction
- type: multiselect_derived
- derived_from: [Q-X3-cross, Q-X4-cross]
- derived_top_n_per_source: 3
- question: What or who could change your mind about this belief?
- helper: Check all that apply. The model reads which trust sources have power over this belief.
- none_option: { id: "none", label: "None of these" }
- other_option: { id: "other", label: "Other (please specify)", allows_text: true }
- emits: cross-rank signals (the same signal_ids carried by the parent items in Q-X3-cross / Q-X4-cross, marked as Q-I2 selections); the `belief_impervious` MetaSignal when `none_selected: true`.

**CC-032 cascade** (2026-04-28): Q-I2's derivation source moved from the legacy flat `[Q-X3, Q-X4]` to the v2.5 cross-ranks `[Q-X3-cross, Q-X4-cross]`, completing CC-031's restructure.  
`derived_top_n_per_source` dropped 3 → 2 because cross-ranks already resolved priority across the wider domain — top-2 of a cross-rank is a sharper read than top-3 of a flat ranking. Q-I2 now renders **4 derived items + None of these + Other (specify)** (vs. 6 in the legacy form). The user-visible win: Q-I2's checkbox list now potentially shows *Social Media*, *Outside expert*, *Government — Services*, *News organizations* as revision-source items — dimensions the legacy form averaged into bucket labels.

**CC-035 amendment (2026-04-29)**: `derived_top_n_per_source` rose 2 → 3. Q-I2 now renders **6 derived items + None of these + Other (specify)**: the user's top-3 cross-ranked institutional trust sources from Q-X3-cross plus top-3 cross-ranked personal trust sources from Q-X4-cross. Architectural rule unchanged: Q-I2 still derives only from the two trust cross-ranks, and the helper prose stays verbatim.

The derived items are the user's own top cross-ranked institutional trust sources from Q-X3-cross plus top cross-ranked personal trust sources from Q-X4-cross. The user is asked which of those self-named trust sources could revise this belief. Mutual exclusion: clicking None clears any other selections; clicking any other clears None. The Other freeform field is NOT text-mined (per the deliberate architectural commitment that the engine moves away from text-mining for Q-I content). Cascade-skip behavior: when neither Q-X3-cross nor Q-X4-cross has been answered (which itself requires both parents of each cross-rank to be unanswered), Q-I2 emits a `derived_question_skipped` MetaSignal and advances.

The "guarded" epistemic-posture check in `lib/beliefHeuristics.ts § deriveEpistemicPostureFromQI2` reads `source_question_id === "Q-X3-cross"` / `"Q-X4-cross"` post-cascade. The own_counsel_trust_priority signal is preserved by the Q-X4 restructure, so the "guarded" detection (only "Own counsel" selected from Q-X4-cross, no Q-X3-cross institutional source selected) survives unchanged.

---

## Q-I3

- card_id: pressure
- type: multiselect_derived
- derived_from: [Q-Stakes1]
- derived_top_n_per_source: 6
- question: What would you risk losing for this belief?
- helper: Check all that apply. The model reads which concrete costs you'd bear for this belief.
- none_option: { id: "none", label: "None of these" }
- other_option: { id: "other", label: "Other (please specify)", allows_text: true }
- emits: cross-rank signals (the same `*_stakes_priority` signal_ids carried by the parent items in Q-Stakes1, marked as Q-I3 selections); the `belief_no_cost_named` MetaSignal when `none_selected: true`.

Q-I3 mirrors Q-I2's shape against the Compass card's concrete-stakes register. The derived items are the user's own top stakes from Q-Stakes1. Same mutual-exclusion semantics, same Other-text-not-mined commitment, same cascade-skip behavior when the parent has no data.

**CC-024 redefinition (2026-04-26)**: Q-I3's source changed from Q-S1+Q-S2 (sacred values, 6 items × 2 parents) to Q-Stakes1 (concrete stakes, 1 parent). The pre-CC-024 architecture asked the user to rank-order their sacred values by sacrificiability — incoherent because sacred-by-definition means not-to-be-sacrificed, and the honest answer was "I wouldn't want to lose any of those for anything," which read as a refusal of the question. The new derivation source restores composition: the verb (*"would risk losing"*) composes with the answer space (*concrete losses*), and the user can coherently say yes/no per item.

**CC-035 amendment (2026-04-29)**: `derived_top_n_per_source` rose 3 → 6 after Q-Stakes1 itself expanded to 6 items. New sessions render **up to 6 derived items + None of these + Other (specify)**, bounded by the parent ranking's actual length. Pre-CC-035 saved sessions still degrade gracefully to 5 or fewer because the derivation logic caps at the parent answer length.

`card_id` stays `"pressure"` (Q-I3 reads cost-bearing under pressure; Fire/immune-response register, unchanged by the derivation-source shift).

---

## BeliefUnderTension construction

The engine constructs a three-dimension `BeliefUnderTension` object from the structured Q-I1 / Q-I1b anchor + Q-I2 / Q-I3 selections:

- `belief_text` — verbatim from Q-I1 or Q-I1b (whichever produced the anchor).
- `belief_source_question_id` — `"Q-I1"` or `"Q-I1b"`.
- `value_domain` — derived from the user's top-1 sacred value across Q-S1 + Q-S2 (lower rank wins; `"unknown"` only if Q-S1 + Q-S2 were both unanswered or shapeless). **CC-024 (2026-04-26)**: re-sourced from Q-S1/Q-S2 directly. Pre-CC-024 it was derived from Q-I3 selections (which were sacred-value drivers via Q-S1/Q-S2 derivation); post-CC-024 Q-I3 carries concrete stakes, not sacred values, so the field is sourced from Q-S1/Q-S2 directly. Field semantics ("which sacred value the belief touches") preserved.
- `epistemic_posture` — derived from Q-I2 selections (None → `rigid`; 1-2 trust drivers → `reflective`; 3+ → `open`; Own counsel only → `guarded`). Unchanged by CC-024.
- `conviction_temperature` — derived from Q-I2 + Q-I3 cardinality combined (Q-I2 None + Q-I3 with selections → `high`; Q-I2 with selections + Q-I3 None → `low`; Q-I2 with selections + Q-I3 with selections → `moderate`; both None or cascade-skipped → `unknown`). Unchanged by CC-024 — the cardinality logic still works against Q-I3's new shape (selections vs none_selected); the semantic meaning shifts slightly (was "willing to risk sacred values for belief"; now "willing to bear concrete costs for belief") but the four cardinality bins stay valid.

The legacy CC-015c BeliefUnderTension dimensions `disagreement_context` and `social_cost` (and all `*_user_confirmed` / `*_confident` flags) are retired. The simplified shape is structurally complete because the source data is structured rather than heuristic.

The Keystone Reflection's contextual prose generator (`lib/beliefHeuristics.ts` `generateBeliefContextProse`) consumes the three-dimension BUT shape and the user's actual Q-I2 / Q-I3 selections. CC-017 ships a structurally-correct prose generator; CC-022 (Engine Prose v2) extends it to cite the user's specific selections back to them by name.

See `docs/canon/keystone-reflection-rules.md` for the seven canonical rules governing the Keystone block's architecture.
