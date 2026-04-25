# Research Mapping v1

## Purpose

Document the academic and clinical research that grounds each Shape card. This file is **reference material**, not law. It informs how canon questions, signals, and tensions are designed; it does not authorize them. Authority for measurement lives in `question-bank-v1.md`, `signal-library.md`, and `tension-library-v1.md`. Authority for the interpretive umbrella lives in `shape-framework.md`. This file shows the load-bearing research underneath both.

The product is not academic. The user should not feel the research; they should feel themselves recognized. But the structure they're being recognized through has decades of empirical work behind it. This file is where that work is named.

---

## Why This File Exists

A self-discovery product can be one of two things:

1. **A horoscope.** Familiar, satisfying, unverifiable. Astrology, most personality quizzes, most "what kind of [X] are you" content.
2. **A map grounded in research.** Recognizable, useful, defensible.

The Shape model is the second. Every layer in `shape-framework.md` is anchored in a body of clinical or academic research that has been empirically tested. This file makes those anchors visible so that:

- Future canon authors can see *why* a card is structured the way it is.
- The product can be defended to clinical, academic, or skeptical reviewers without inventing post-hoc justifications.
- Decisions about adding cards, signals, or tensions can be checked against existing research before they ship.

The research informs canon. Canon is what's authoritative.

---

## The Seven Research Bodies

Seven bodies of research underwrite the v1 model. Each is mapped to the Shape layer(s) it informs and to specific cards in `question-bank-v1.md`.

### 1. Jungian Cognitive Functions (Carl Jung)

**Core idea.** People differ in how they perceive reality and how they make judgments. Perception splits into Sensing (what is concrete, present, or remembered) and Intuition (what is patterned, possible, or emerging). Judgment splits into Thinking (logical, structural) and Feeling (value-based, relational). Each function can be oriented inwardly (introverted, referenced against an internal framework) or outwardly (extraverted, referenced against the external world). The result: eight cognitive processes — Ni, Ne, Si, Se, Ti, Te, Fi, Fe — that combine into a four-function stack with predictable properties.

**Shape layer.** Lens (primary). Influences how Compass values are protected (e.g., truth-via-Ti vs truth-via-Fi) and how Fire reactions express themselves under pressure.

**Canon home.** `temperament-framework.md` (full theoretical model). Q-T1 through Q-T8 in `question-bank-v1.md` (the eight ranked Temperament questions, voice-styled per function).

**What it explains in this product.** Why two people who share a sacred value can sound nothing like each other. Why pressure responses vary by Lens even when values are identical. Why a single forced-choice question is too flat to capture identity.

**Note on validation.** Cognitive-function theory is the least empirically validated framework in this list. MBTI specifically has well-documented psychometric weaknesses (low test-retest reliability, dichotomous categorization that doesn't match the underlying continuous variation). The product uses Jungian functions because they generate narrative tension material the others don't, not because they're the most rigorous. If empirical defensibility matters more than narrative power for a future use case, Big Five is the validation reference. See `temperament-framework.md` § Canonical Scope.

### 2. Schwartz Theory of Basic Values (Shalom Schwartz)

**Core idea.** Across 80+ cultures, human values cluster into ten universal types: self-direction, stimulation, hedonism, achievement, power, security, conformity, tradition, benevolence, universalism. The values are organized in a circumplex — adjacent values are compatible, opposite values are in tension. Self-direction conflicts with conformity; achievement conflicts with benevolence; security conflicts with stimulation.

**Shape layer.** Compass (primary).

**Canon home.** Sacred Values Card in `question-bank-v1.md` (Q-S1 + Q-S2). The eight v1 sacred values (Freedom, Truth, Stability, Loyalty, Family, Knowledge, Justice, Faith) overlap substantially with Schwartz's ten — Freedom maps to self-direction, Stability to security, Loyalty to conformity/tradition, Justice to universalism, Faith to tradition, Family to benevolence, Knowledge to self-direction's intellectual variant, Truth to a Schwartz blend of universalism + self-direction. The v1 list is canon-locked per CC-006; it is not Schwartz-derived per se but is Schwartz-compatible.

**What it explains in this product.** Why some values feel oppositional even when both are individually appealing. Why ranking sacred values surfaces real internal tradeoffs rather than producing a single "favorite." Why T-012 Sacred Value Conflict is structurally inevitable — the values themselves sit in a tension geometry.

**Validation strength.** Schwartz's circumplex is one of the most replicated structures in cross-cultural psychology. Translatable to the product as: the Sacred Values card has empirical backing.

### 3. Moral Foundations Theory (Jonathan Haidt and colleagues)

**Core idea.** Moral instincts cluster around six foundations: care/harm, fairness/cheating, loyalty/betrayal, authority/subversion, sanctity/degradation, and liberty/oppression. Different cultures and individuals weight these differently. Political and religious differences often track foundation-weight differences rather than disagreements within a single foundation.

**Shape layer.** Compass (informs how Sacred Values get moralized) and Fire (informs which moral language pressure draws out).

**Canon home.** Distributed across Conviction Card, Sacred Values Card, and Pressure Card in `question-bank-v1.md`. Not a dedicated card in v1.

**What it explains in this product.** Why two people can disagree about a policy and both feel morally right — they're weighting different foundations. Why "Family vs Truth" (T-007) is structurally a loyalty-vs-care tension in Haidt's terms. Why some pressure responses are moralized (sanctity, betrayal language) while others are utilitarian (harm reduction).

**Validation strength.** Well-replicated, broadly cited, politically informative. Some critique exists about the empirical separability of liberty as a sixth foundation; for product purposes the six-foundation version is canonical.

**Future possibility.** A dedicated Moral Instinct Card mapping each Haidt foundation to its own ranking question. v2 territory; not v1.

### 4. Sacred Values / Taboo Tradeoffs (Philip Tetlock and colleagues)

**Core idea.** Some values are treated as "sacred" — non-negotiable and not subject to ordinary cost-benefit reasoning. Asking someone to make a routine tradeoff between a sacred value and a secular one (e.g., money for a kidney) produces moral outrage rather than calculation. Sacred-value violations are processed as identity threats, not ordinary losses. The strongest reactions occur when a tradeoff is forced and rejection isn't available.

**Shape layer.** Compass (which values are sacred) and Fire (what happens when sacred values are threatened).

**Canon home.** T-012 Sacred Value Conflict in `tension-library-v1.md`. Implicitly: the entire Sacred Values Card and the Pressure Card both rest on Tetlock's distinction between sacred and tradeable values.

**What it explains in this product.** Why compromise feels like betrayal for some users on some questions but not others. Why the Inner Constitution reads as honest rather than neutral — naming a sacred-value conflict honors the user's sense that the conflict is real, rather than treating it as preference variance. Why T-012 is the most important tension in the library: it's the structural diagnostic for *"this is where compromise becomes identity threat for me."*

**Validation strength.** Tetlock's sacred-values research has strong empirical support. Direct reference for any future product copy that needs to defend why the model treats some values as non-negotiable.

### 5. Locus of Control (Julian Rotter)

**Core idea.** People differ in where they assign causal explanation for outcomes — internal (personal agency, choice, effort) versus external (systems, authorities, fate, luck). The original 1966 scale was binary; modern versions split external into more granular categories (system, authority, chance, divine).

**Shape layer.** Gravity (primary).

**Canon home.** Q-C4 in `question-bank-v1.md` (post-CC-008 the locked design ranks five attributions: Individual / System / Nature / Supernatural / Authority). T-009 Individual vs System Responsibility in `tension-library-v1.md`.

**What it explains in this product.** Why two people who share the same Compass value (e.g., compassion) can disagree completely on what to do with it. The Gravity layer is what determines whether help looks like personal accountability or system reform.

**Validation strength.** Decades of replication. Locus-of-control as a construct is well-established; the specific multi-attribution version (Individual/System/Nature/Supernatural/Authority/Chance) used in this product is a custom expansion that gives finer-grained measurement than Rotter's original two-pole scale.

### 6. Self-Determination Theory (Edward Deci and Richard Ryan)

**Core idea.** Three universal psychological needs underlie human motivation and wellbeing: autonomy (volitional self-endorsement of one's actions), competence (mastery and effective action), and relatedness (meaningful connection with others). When these needs are met, intrinsic motivation and growth flourish; when they're frustrated, defense, withdrawal, and disengagement follow. SDT has strong empirical support across education, work, healthcare, and relationship research.

**Shape layer.** Path (primary), Weather (current-context conditions for the three needs), Agency (ongoing operational mode).

**Canon home.** Agency Card in `question-bank-v1.md` (Q-A1, Q-A2). Influences Context Card (Q-X1, Q-X2 indirectly measure SDT environmental conditions).

**What it explains in this product.** Why directional Path output can be generated from Compass + Lens + Weather signals — those signals together describe whether a person's autonomy, competence, and relatedness needs are being met or frustrated. Why the v1 Path output is interpretive (no new questions needed): SDT-grounded inference can be drawn from existing measurement.

**Generativity as a fourth need.** SDT classically names three needs. Some scholars (Erikson originally, McAdams more recently) argue generativity — the developmental need to give to others and the next generation — is a fourth need that emerges in adult life. The Path layer's Work / Love / Give / Empower progression in v2 will draw on this extension.

**Validation strength.** SDT is among the strongest validation bases in this list. Used by clinical practitioners worldwide. Direct reference for any product claim about wellbeing or growth.

### 7. Contact Hypothesis / Superordinate Identity (Gordon Allport, Thomas Pettigrew, Muzafer Sherif)

**Core idea.** Intergroup conflict reduces under specific conditions: shared goals, equal status, cooperative interaction, institutional support, and recognition of a superordinate (shared) identity that includes both groups. Sherif's 1954 Robbers Cave experiment, Allport's 1954 *The Nature of Prejudice*, and Pettigrew & Tropp's 2006 meta-analysis (515 studies) collectively form one of the most empirically robust findings in social psychology: contact under the right conditions reliably reduces prejudice.

**Shape layer.** Currently no v1 layer directly maps. The closest is mirror-types interpretation in the Inner Constitution, which uses Compass + Lens overlap to suggest commonality across difference. The full Shared Identity Card (with dedicated questions about who is "us," who is "them," what shared identity could bridge) is **deferred to v2**.

**Canon home.** v1: only as a seed paragraph in `inner-constitution.md` mirror-types section. v2: dedicated `shared-identity-framework.md` and a Shared Identity Card in `question-bank-v1.md`.

**What it explains in this product.** Why the user's vision of "showing that we're more similar than enemies" has empirical traction. The product's larger arc — beyond v1 — is to surface structural overlap between users with different surface answers, which is the Contact-Hypothesis move applied at the cognitive-structure level rather than the demographic-group level.

**Validation strength.** Among the strongest in social psychology. The Pettigrew & Tropp meta-analysis is a primary reference for any future product claim about reducing intergroup hostility.

---

## Card-by-Card Research Summary

The Shape model uses **eight cards** per `shape-framework.md`, not six layers. Conviction is a separate card from Compass (what you protect vs. what you believe and defend); Trust is a separate card from Gravity (where blame falls vs. whom you take reality from). The research mapping accommodates the eight-card structure.

The eight cards are also **not all the same kind of measurement**, per `shape-framework.md` § Card Types and Layered Architecture. They group into four functional layers: **Core Portrait** (Lens, Compass, Gravity, Trust — relatively durable, trait-like); **Belief Stance** (Conviction — narrower belief module); **Context Overlays** (Weather, Fire — state-like, conditional); **Developmental Direction** (Path — directional motive, not score). The research mapping below preserves this layered distinction — Core Portrait cards anchor on the most replicated trait or value research, Context Overlay cards anchor on developmental and stress-response literature, and Path's research base is directional rather than scoring-grade.

| Shape Card | Primary Research | Secondary |
|---|---|---|
| Lens | Jung | — |
| Compass | Schwartz, Tetlock | Haidt |
| Conviction | Moral psychology, epistemology of belief revision | Haidt (foundation-weighted moral conviction) |
| Gravity | Rotter | Schwartz (universalism vs power) |
| Trust | Institutional trust research, attachment theory, social-trust literature | Haidt (authority foundation) |
| Weather | Developmental psychology, attachment theory | SDT (environmental conditions) |
| Fire | Tetlock (sacred-value violation), Haidt (moral pressure) | SDT (need frustration) |
| Path | SDT, generativity research | Schwartz (achievement, benevolence) |

### Conviction card — research note

The Conviction card draws from moral psychology and the empirical literature on belief revision. Key references: William James on the "will to believe," Festinger's cognitive dissonance theory, Kruglanski's lay epistemics on need for closure, Tetlock's expert political judgment work on conviction-style differences. The card is thinner in v1 measurement than Compass — fewer questions, less granular signal — but the underlying research is well-established. v2 question depth will allow finer Conviction differentiation.

### Trust card — research note

The Trust card draws from two literatures. **Institutional trust** is grounded in social-trust research (Putnam's *Bowling Alone*, the General Social Survey trust battery, Pew's institutional trust longitudinal studies). **Personal trust** is grounded in attachment theory (Bowlby, Ainsworth) and the close-relationships trust literature (Rempel, Holmes & Zanna's trust scale). The two combine into a single Shape card because they answer the same Shape question — *whom do you take reality from* — even though they draw on distinct empirical bodies. v1 includes Q-X3 (institutional ranking) and Q-X4 (personal ranking) as the two questions feeding this card.

---

## Cross-Layer: Same Value, Different Shape

The strongest single insight from combining these research bodies is that two people can share a value and process it completely differently. This is what justifies the Lens × Compass interaction in the Shape model. Examples drawn from the research:

| Sacred value | Lens variation | What the value means in practice |
|---|---|---|
| Truth | Ti | Logical consistency, internal coherence |
| Truth | Te | External evidence, operational proof |
| Truth | Ni | Underlying pattern, hidden meaning |
| Truth | Si | Verified precedent, trusted reference |
| Truth | Fi | Personal moral authenticity |
| Truth | Fe | Relational and social honesty |
| Family | Fe | Care, harmony, presence |
| Family | Si | Tradition, continuity, history |
| Family | Te | Provision, structure, protection |
| Family | Fi | Intimate fidelity, personal bond |
| Justice | Fi | Conscience, refusing complicity |
| Justice | Te | Enforceable fairness, institutional reform |
| Justice | Fe | Social repair, relational restoration |
| Justice | Ti | Principled consistency, rule-application |

These crosswalks are interpretive guides for the Inner Constitution's Path output, not measurement targets. They do not authorize new signals or tensions.

---

## What Research Does Not Decide

The research bodies listed here inform the model. They do not dictate it. Several specific decisions in canon were made *despite* what the strongest research would have suggested:

- **Choice of Jungian functions over Big Five for Lens.** Big Five has stronger psychometric validation. Jungian functions produce richer narrative output for self-discovery. The product chose narrative power over psychometric purity. See `temperament-framework.md` § Canonical Scope.
- **Sacred Values list as canon-locked.** Schwartz's ten-value circumplex is the strongest empirical model for sacred-value taxonomy. The v1 list (Freedom, Truth, Stability, Loyalty, Family, Knowledge, Justice, Faith) overlaps with Schwartz but is not identical. The list was locked per user direction in CC-006; it is Schwartz-compatible but not Schwartz-derived.
- **Responsibility attribution at five categories rather than seven.** Locus-of-control research could support more granular subdivision (Family separately from System, Random chance separately from Nature). The v1 ranked list (Individual / System / Nature / Supernatural / Authority) was locked per user direction; finer-grained Gravity is v2 territory if needed.
- **Path interpretive in v1, not measured.** SDT would support direct measurement of autonomy / competence / relatedness with dedicated questions. v1 chose interpretive Path output instead, generated from existing signals. This is a scope decision, not a research-grounded one.

These choices are documented here so future canon authors can see *why* the model is what it is — and so any future revisit has a clear baseline of what was decided versus what the research alone would have produced.

---

## When to Update This File

This file should be updated when:

- A new canon card is added that draws on a research body not already documented here.
- A v2 expansion (Shared Identity Card, Path Card, motivation framework) lands in canon and brings its research basis with it.
- An empirical finding meaningfully changes how an existing layer should be interpreted. (Rare.)
- A future review identifies that the product is making a claim that research does not support, and the claim needs to be either softened or removed.

This file should **not** be updated to reflect every new study or theoretical refinement in the underlying fields. It exists as a stable reference, not a living literature review.

---

## Validation Roadmap

The full per-card validation plan — including specific borrowed instruments (PVQ, MFQ-2, Levenson IPC, ETMCQ-R, BPNSFS, Brief COPE, ERQ, AOT, IH, and others) — lives in `validation-roadmap-v1.md`. The high-level moves available if formal validation is ever needed:

1. **Big Five correlation study.** Recruit users to complete both the v1 question set and an established Big Five inventory (BFI-2, NEO-PI-R). Correlate outputs. Strongest single defensible move for Lens.
2. **Schwartz Values Survey correlation.** Same approach for the Sacred Values Card using PVQ-21/40/57.
3. **Levenson IPC correlation.** For Gravity — Q-C4 ranked attributions vs. Internality / Powerful Others / Chance subscales.
4. **Test-retest reliability.** A subset of users retake the survey after 4–12 weeks. Measure stability of Shape outputs across the layered architecture (Core Portrait should be more stable than Context Overlays — that's a testable prediction).
5. **Construct validity.** Compare tension detections (e.g., T-012 Sacred Value Conflict) against established sacred-value-violation paradigms from Tetlock's research.

None of this is v1. All of it is doable when the product wants academic credibility. See `validation-roadmap-v1.md` for the per-card instrument list, study design sketch, and known measurement gaps.
