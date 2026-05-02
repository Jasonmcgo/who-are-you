# v3 Product Direction — Aperture and Distance

**Status:** Design memo. Not yet implementation. Captures the v3 architectural milestone identified in the design-jam between Jason and Clarence (2026-04-26). The third of three sequential memos: this one builds on the Coherence Engine (v2) and the Universal-Three Restructuring (v2.5) and pushes the engine into context-aware reads the user can opt into or out of.

**Audience:** Future CC authors who will eventually scope and draft v3 work — likely several CCs spread across cultural framings, relational reads, and (when scale arrives) population baselines. Plus any product-direction conversation that needs to know how far the body-map metaphor is intended to extend, and what guardrails protect it from drift.

**Relationship to existing canon:** This memo describes work that has not yet been canonized and that depends materially on v2 being shipped and stable. When v3 work begins, the architectural ideas here either get canonized (joining `output-engine-rules.md`, `result-writing-canon.md`, `coherence-pattern-library.md` if v2 has shipped that, `aperture-rules.md` if this memo's vocabulary lands) or get refined / replaced. Until then, this is design thinking on paper.

---

## The metaphor

Jason's framing during the CC-016 jam, captured verbatim because the language is load-bearing for the whole v3 surface:

> *"And the 'distance' between you in the mirror... closer to the mirror, more details can be viewed about yourself... further away, the aperture expands..."*

The metaphor maps cleanly onto a real product capability. **Close-aperture reads** show the user in fine detail — their Lens, Compass, Conviction posture, allocation receipts, the cross-card coherence pattern. That's the v1/v2 product. **Wide-aperture reads** zoom out and place the user in context — cultural, relational, generational, demographic, eventually population-statistical. Each context layer shows less per-pixel detail of the individual but more of how the individual reads against the world they're embedded in.

Both views are honest. Neither is more true than the other. **The choice of aperture belongs to the user, not to the model.** A user who wants pure self-portrait stays at close aperture indefinitely. A user who wants context — *"how does this read look against the cultural frame I came up in"* / *"how does this read look against the people I share my life with"* — opens the aperture as far as they want, and closes it back when they're done.

The architectural primitive of v3 is **user-controlled aperture**. The Inner Constitution doesn't decide for the user how zoomed-out to render. The user decides, layer by layer, with the model holding all layers ready and showing only the ones the user has explicitly opened.

---

## Three context layers

The v3 memo identifies three distinct context layers, ordered by reversibility (cheapest and least invasive first, most demanding last). Each is a separable v3 work surface; v3 does not have to ship all three together.

### Layer A — Cultural framing

The closest of the three to v2. A cultural framing layer reads the user's existing evidence portfolio against a chosen cultural frame and surfaces how the interpretation shifts.

A user with high Family in Q-S2, high allocation toward family in Q-S3, low Independence in any pressure response, and a Conviction posture that adapts under social pressure reads one way against an individualist-baseline frame and a different way against a collectivist-baseline frame. **Neither reading is more true.** The first frames the user's allocation as deviation from "self-actualization" priors that the user may or may not share; the second frames the same allocation as alignment with a frame where family is the primary unit of meaning. The model does not adjudicate between frames; it shows the user how the read shifts and leaves the choice of frame to the user.

Cultural-frame inputs (sketch — not yet canonized):

- **Religious context** (the user names their tradition, or none).
- **Regional / national culture** (the user names where they were raised, where they now live, both, or neither).
- **Generational cohort** (the user names a birth-decade or age band).
- **Language community / linguistic identity** (when meaningful — bilingual users, users whose primary identity language differs from their environment language).
- **Professional culture** (the user names their working domain — engineering, healthcare, art, ministry, military — when relevant).

The user picks the frames they want to apply. Frames are additive: a user can apply zero, one, or several. Each applied frame produces a separate hedged read; the model never composes frames into a single composite (composing would manufacture certainty the engine doesn't have).

**Hard rules** (the canon's Five Dangers extend directly into cultural framing):

> **No cultural-archetype compression.** The model never says *"users from culture X tend to..."*. That's exactly the trait-archetype move the Five Dangers forbid, projected onto a different axis. Cultural framing operates on the *individual user's existing evidence*; it does not import group claims and apply them to the user.

> **No moral framing.** The model does not name one cultural frame as healthier, more developed, more evolved, or more correct than another. It surfaces how the read shifts; the user reads.

> **User-named frames only.** The model does not infer a user's culture from their answers and apply a frame the user did not name. The user is the only authority on which cultural frames are theirs.

Cultural framing is the lightest-weight v3 work because it can ship with **synthetic baselines** drawn from the canonical literature — Schwartz Values Survey distributions across regions, Hofstede dimensions, MFQ-2 cohort data, Big Five normative samples. No real population scale required. The lift is pattern-library work (frames + per-frame interpretation rules) and UX work (the user picks which frames to apply).

### Layer B — Relational reads

Wider aperture than cultural. A relational read places the user in context with specific others in their life — partner, family, close friends, professional collaborators — and surfaces where the readings converge and diverge.

Two implementation paths, very different in scope:

**Path B1 — Relational input by the user.** The user names the relational context (e.g., *"my spouse"*) and describes how the relational dimension shows up — what they protect with this person, what gets allocated, what gets named, what they suspect the other person would say. The model treats this as additional `behavioral_report` evidence (the v2 type) with the relational context as metadata, not as actual data about the other person. The other person is never modeled. The user is reading themselves *through* the relational frame they chose to bring forward.

This path is achievable in v3 with v2's evidence layer already in place. It adds new evidence kinds (`relational_report`) and new pattern detections (e.g., *"your stated values diverge from how you describe showing up with this person"*) but does not require multi-user infrastructure.

**Path B2 — Two-user parallel sessions.** Both people take the test. Both opt into a shared read. The engine produces an interpretation of each person individually plus a hedged read of where the two evidence portfolios converge and diverge. This is much more demanding — multi-user accounts, consent flows, cross-session data boundaries, joint-result rendering. Probably v3.5 or later, after Path B1 has been tested at small scale.

Both paths share the same hard rules:

> **Consent gates everything.** Path B1: the user explicitly opts into the relational frame and explicitly chooses which relational context to bring forward. Path B2: both users explicitly consent to each having access to the joint read; either user can revoke at any time.

> **No modeling of unconsented others.** Path B1 never models what *the other person* is like; it models what *the user reports about themselves in the context of that relationship*. Path B2 models both people, with both people's consent.

> **No relationship-prescription.** The model never says what the user *should* do about a relational read. It surfaces; the user decides.

### Layer C — Population baseline

The widest aperture and the most demanding. A population layer reads the user's evidence portfolio against the aggregate distribution of users who have taken the test. *"Your Lens stack is held by approximately N% of users in your reported generation"* / *"Your top-3 Compass cluster appears in approximately N% of users with your reported context."*

Population reads sharpen certain coherence patterns that synthetic baselines can't reach. *"Your conviction posture is unusually willing-to-bear-cost compared to baseline"* requires real opt-in user data; no canonical literature replicates this exactly.

**This work is contingent on real scale.** The v2 memo already named this as v3 territory at earliest, conditional on enough opt-in users to produce statistically meaningful distributions. Probably hundreds of opted-in users at minimum, more for fine-grained subgroup distributions.

**Hard rules:**

> **Aggregate-only.** The model never compares the user against any individual other user. Population reads are statistical distributions, never identity-keyed.

> **Opt-in to contribute, opt-in to read.** A user's data is included in the baseline only if they explicitly opted in to contribute. A user sees population reads only if they explicitly opted in to read them. The two opt-ins are separable — a user may want to contribute without seeing reads, or want to see reads without contributing.

> **No "you're unusual" framing without user choice.** The architectural register of population reads is *"here's how this distributes; you sit at point X"* — not *"you're unusual"*. The user reads what the position means.

> **No retention beyond what the user has consented to.** Population data is aggregated and retained only as needed for the baseline itself; raw individual data has the same retention rules as the rest of the platform.

Population layer is the work that most closely brushes against the rules that the v2 memo's `llm-substitution-rules.md` (if shipped) already establishes — redaction, summarization, consent, logging, retention, data boundaries. Same canon principles, different surface.

---

## User control as the architectural primitive

The single most important architectural fact about v3 is that the user controls the aperture. This shows up in three places:

1. **The default is closed.** A new user sees the v1/v2 close-aperture reading. Wide-aperture layers are not added by default; they are opened by the user, layer by layer, with each opening recorded as an explicit consent action.

2. **Each layer is independently toggleable.** The user can open Cultural Framing without ever opening Relational reads. Or open Relational without Population. Or any combination. The layers are orthogonal and independently consented.

3. **Closing a layer removes the layer.** When the user closes Cultural Framing, the cultural reads disappear from the rendered Inner Constitution. The model does not preserve cached cultural reads "in case the user opens it again." Closing means closed.

This is the **opposite of the social-software pattern** that pushes context onto the user without asking. Many products optimize for engagement by adding context surface (notifications, comparisons, social feeds, recommendations). v3 deliberately optimizes for the inverse — context surface is available *only when requested* and *only at the level requested*. The user's attention belongs to the user.

The reason this matters: each context layer has the potential to distort the user's reading of themselves. Cultural framing risks the user reading themselves through a cultural lens that isn't actually theirs. Relational reads risk the user distorting their self-image through what they imagine someone else thinks of them. Population baselines risk the user defining themselves by what's "normal." All three risks are real, and all three are mitigated by the same architectural choice: **the user has to actively want the layer.** Defaults push; v3 doesn't push.

---

## What v3 changes structurally

A short list of the architectural changes v3 introduces, assuming v2 has shipped:

1. **The Inner Constitution gains an aperture control.** UX surface — a slider, a layer-toggle panel, or whatever the v3 design jam settles on. The control's default state opens the close-aperture reading and nothing else.

2. **The Coherence Engine's evidence catalog grows new kinds.** `cultural_evidence`, `relational_report`, `population_baseline`, possibly `linguistic_evidence` — added to the `kind` taxonomy authored in CC-017 (the v2 Interpretive Evidence Layer). Each new kind has its own `rendering_posture` defaults; cultural and relational both default to `hold_as_possibility` (low confidence, user-confirmable), population reads default to `suggest_gently` (the statistical claim is reasonably solid; the *meaning* of the claim is the user's to read).

3. **The Coherence Pattern Library grows new pattern families.** Cross-cultural patterns (the same evidence portfolio against different frames), relational patterns (stated values vs. how the user reports showing up in specific relationships), population patterns (where the user sits in the distribution). Each pattern family has authored detection rules, hedged rendering templates, and explicit user-control gates.

4. **The Mirror grows new sections.** Cultural Reading, Relational Reading, Population Reading — each renders only when the user has opened the corresponding aperture layer. The Mirror's section count is no longer fixed; the section list is data-driven.

5. **A new canon file: `aperture-rules.md`.** Documents the principles named in this memo — user control as primitive, no cultural-archetype compression, no relationship-prescription, opt-in-to-contribute and opt-in-to-read separately, defaults are closed, closing means closed. This file is the moral guardrail of v3, the way `result-writing-canon.md` is the moral guardrail of v1/v2.

---

## v2 architectural constraints to preserve runway

The v3 work depends on the v2 engine being structurally extensible. Two specific architectural decisions made during v2 implementation will determine whether v3 is a clean addition or a major refactor.

**Constraint 1 — The Mirror's section list is data-driven.** The v2 memo already flagged this. CC-015b's renderer has a hardcoded section list, sufficient for the seven (now eight, with CC-016's Allocation Gaps) sections currently in the Mirror. v2 work that adds the Coherence narrative section should either preserve the hardcoded form cleanly OR refactor the renderer to consume a section list from the engine output. If v2 chooses the refactor, v3's three new context-layer sections drop in without any further renderer work. If v2 preserves the hardcoded form, v3 has to do the refactor as part of its own scope. Lean toward doing the refactor in v2 — the section list will only grow.

**Constraint 2 — The Interpretive Evidence taxonomy is open.** CC-017 introduces the `kind` taxonomy with eight initial kinds (`stated_value`, `stated_trust`, `stated_attribution`, `stated_belief`, `allocation_receipt`, `behavioral_report`, `inferred_pattern`, `meta_signal`). v3 needs to add at least three more (`cultural_evidence`, `relational_report`, `population_baseline`). The taxonomy should be designed in CC-017 as **discriminated-union-extensible** — adding new `kind` values does not require rewriting any existing consumer. The `rendering_posture` field already has the right shape for this; the addition is just new constants, not a new architecture.

**Constraint 3 (soft) — Pattern detection registers new families cleanly.** CC-018's pattern library should be a registry that v3 can add to without modifying the existing pattern-detection loop. The registry shape is a CC-018 design decision; flagging here so v3's pattern-family additions don't hit a refactor wall.

These three constraints are the work v2 owes v3. Honoring them costs v2 a small amount of additional discipline; failing to honor them turns v3 into a much larger refactor.

---

## What v3 is not

Several things that sound like v3 but are not, and should be explicitly excluded from v3 scope:

- **Behavioral prediction.** The model never predicts what the user will do. Wider aperture reveals more *interpretation* of existing evidence; it does not project forward into actions the user hasn't taken.
- **Clinical or diagnostic reads.** The model is a self-discovery instrument, not a clinical tool. Population reads do not produce clinical thresholds; cultural reads do not produce pathology framings; relational reads do not produce relationship-quality verdicts.
- **Type-matching social features.** No *"find others with your shape"*. No leaderboards, no compatibility scores, no social discovery. The product is the user's relationship with themselves; it is not a relationship-formation tool. Even Path B2 (two-user parallel sessions) does not create matching — both users explicitly invite each other; the engine never proposes others.
- **Trait-locked content for cultural / relational / population groups.** Same Five Dangers rule that protects the v1/v2 type-label compression: the model does not say *"users in cultural frame X tend to Y"* or *"users in your generation tend to Z"*. The pattern library reads the *user's individual evidence* against frames and baselines; it does not import group claims.
- **Recommendations.** The model does not recommend cultures, relationships, or behaviors. The user's choices are the user's.
- **Persistent identity claims.** Wide-aperture reads are session-bound. Closing a layer removes its read from the session. The model does not accumulate cultural / relational / population reads across sessions and present them as a persistent identity portrait — though Postgres-backed session history (a v2 / v3 capability) may allow the user to revisit prior aperture states if they choose.

---

## Sequencing

v3 does not begin until v2 has shipped and stabilized. The dependency chain is concrete:

1. **v2 ships** — Interpretive Evidence Layer (CC-017), Coherence Pattern Library (CC-018), Coherence Narrative (CC-019), Mirror restructure for the new Coherence section.
2. **v2 is tested at small real-user scale.** The constraint-first interpretation rule, the evidence taxonomy, the rendering postures all need real-user shakedown before v3 builds on top.
3. **v2.5 lands somewhere in this window.** Q-X3 / Q-X4 restructure, the multi-stage ranking pattern, the three-min / four-default / five-max principle canonized. Independent of v3 in spirit but its disaggregated trust signals enrich the evidence catalog v3 reads from.
4. **v3 Layer A — Cultural framing.** First v3 surface; no scale dependency; ships with synthetic baselines drawn from the canonical literature. Probable order: `aperture-rules.md` canon doc → cultural-frame UX → cultural pattern family → Mirror section.
5. **v3 Layer B Path B1 — Relational input.** User-driven relational frames. Builds on the evidence layer; no multi-user infrastructure. Probable second v3 surface.
6. **v3 Layer B Path B2 — Two-user parallel sessions.** Multi-user accounts, consent flows, cross-session boundaries, joint-result rendering. Probable v3.5; non-trivial product surface.
7. **v3 Layer C — Population baseline.** Contingent on real opt-in scale. Probably last; possibly never if scale doesn't materialize.

The probable v3 size is 8-12 substantial CCs spread across the three layers, with the cultural and relational work easier than the population work and the Path B2 work substantially easier than the population work. Each layer is independently shippable; v3 does not have to be a monolithic release.

---

## Protected lines

The aperture metaphor and the lines around it should be preserved for use in v3 prose when the work begins:

> *"Closer to the mirror, more details can be viewed about yourself; further away, the aperture expands."* (Jason — the load-bearing v3 metaphor)

> *"The choice of aperture belongs to the user, not to the model."* (architectural statement; suitable for `aperture-rules.md` opener)

> *"Wider aperture is not deeper truth. It is a different read of the same person."* (rendering register for cultural / relational reads)

> *"You sit at this point in the distribution. What that means is yours to read."* (rendering register for population reads)

These belong in the v3 prose surfaces when those surfaces ship. Future CCs that touch v3 reads may use these verbatim; they may not paraphrase, abbreviate, or replace.

---

## Cross-references

- `v2-coherence-engine.md` — the v2 work this memo depends on. v3 cannot ship without v2's evidence layer, pattern library, and renderer extensibility being in place.
- `v2-5-universal-three.md` — runway-extension memo for the ranking primitive. Not a v3 dependency in the strict sense, but its disaggregated institutional-trust signals enrich the evidence catalog v3 reads from.
- `docs/canon/result-writing-canon.md` — the moral guardrail of v1/v2 prose. v3's `aperture-rules.md` (when authored) extends the same register into context-aware reads.
- `docs/canon/coherence-pattern-library.md` (CC-018, prospective) — the v2 pattern library that v3 extends with new pattern families.
- The Five Dangers rule (across `result-writing-canon.md` and project canon) — the type-archetype compression rule that v3 must honor across cultural and population framings as much as v1/v2 honored across personality framings.

---

## Bottom line

v1 / v2 give the user a self-portrait — close-aperture, careful, hedged, structurally complete.

v3 gives the user **a self-portrait with optional context layers the user controls** — cultural, relational, eventually population. Wider aperture reveals more interpretation of the same evidence, never more evidence. The user opens the aperture they want and closes the rest.

The two governing rules of v3, in their cleanest form:

> **Aperture is a user choice, never a model assumption.**

> **Wider aperture is more context, never more verdict.**

That is the product the design jam revealed was reachable, contingent on v2 shipping cleanly. CC-016 is the first installment of the body-map metaphor reaching structural completeness; v2 generalizes the engine's reading; v3 lets the user choose how much of the world the engine reads them against.
