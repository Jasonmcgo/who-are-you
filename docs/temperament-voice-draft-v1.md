# Temperament — Voice Statement Draft v1

**Status.** First draft for review and iteration before CC-009 makes these canonical. Not authoritative yet.

**Purpose.** 8 scenario headers + 32 voice-styled statements for the Temperament card. Each question presents four statements (one per cognitive function in the relevant category — perceiving or judging) and the user ranks them by which most sounds like how they actually think. The ranking, aggregated across the 8 questions, identifies the user's dominant and auxiliary functions; the full stack follows from the Canonical Stack Table in `temperament-framework.md`.

**Voice-quality guardrail.** Every statement is written as a competent version of its function. No straw-man options. The signal comes from priority order, not from making three options obviously weaker. See `open-design-calls.md` Section 4 for the full guardrail list (Ni not mystical, Te not sociopathic, etc.).

**Iteration format.** Edit in place. Flag statements that feel off, cartoonish, out of register, or too similar to a neighbor. Propose alternatives inline. When this draft stabilizes, CC-009 will promote these into `data/questions.ts` and `question-bank-v1.md`.

---

## Perceiving Block — Q-T1 through Q-T4

Each question presents four statements representing Ni, Ne, Si, Se. User ranks 1–4 (1 = most sounds like me).

### Q-T1 — When you're working on a hard problem

- **Ni:** "Once I see how the pieces are going to land, the rest is mostly execution. I'm looking for the pattern that would explain everything else."
- **Ne:** "There are at least four interesting angles here. I want to spend time on each before deciding which one fits."
- **Si:** "What's worked in similar situations before? There's usually precedent worth checking before reinventing."
- **Se:** "Let me start moving and see what surfaces. I'll know what I'm dealing with once I'm actually working on it."

### Q-T2 — When you walk into a new environment

- **Ni:** "I'm already picking up on what this place is really about. A few cues tell me more than the formal orientation would."
- **Ne:** "This is interesting — there are so many new possibilities here. I want to explore widely before forming any conclusions."
- **Si:** "I'm comparing this to similar environments I've been in. The differences are telling me what I need to pay attention to."
- **Se:** "I'm taking in what's actually present — the room, the people, the energy. I'll respond to what I find."

### Q-T3 — When you're learning something new

- **Ni:** "I want to understand what the skill is really *for*. Once I get the underlying principle, the specifics fall into place."
- **Ne:** "I'd rather try several approaches than commit to one method. Different methods reveal different things about the skill."
- **Si:** "I want to learn it the way experts have taught it. The proven sequence usually exists for a reason."
- **Se:** "I learn by doing it. Pick it up, try it, adjust based on what's actually happening in my hands."

### Q-T4 — When you're trying to read a complex situation

- **Ni:** "I'm looking for the one underlying thing that would explain all the other observations at once."
- **Ne:** "There are probably several forces at work here. I want to map them and see how they interact before picking a read."
- **Si:** "I've seen this kind of situation before. The pattern-match to past examples tells me a lot about what's likely happening."
- **Se:** "I'm watching what's actually happening, not what people say is happening. Behavior in the moment is more honest than explanations."

---

## Judging Block — Q-T5 through Q-T8

Each question presents four statements representing Ti, Te, Fi, Fe. User ranks 1–4.

### Q-T5 — When a plan isn't working

- **Ti:** "There's a flaw in the underlying logic of the plan. I want to find it before we change what we're doing."
- **Te:** "Let's change what we're doing now to hit the target. We can diagnose the failure afterward."
- **Fi:** "Before we keep pushing, I want to know whether this plan is actually aligned with what we care about. Maybe the plan is fine but we're wrong about wanting it."
- **Fe:** "People are getting frustrated. Before we can fix the plan, we need to address what the friction is doing to the team."

### Q-T6 — When someone you respect disagrees with you

- **Ti:** "Before I adjust, I want to understand exactly where their reasoning differs from mine. The disagreement is informative — I just need to pin down what it turns on."
- **Te:** "If they're right, we should change course quickly. What's the fastest way to test who's seeing it more clearly?"
- **Fi:** "I have to stay true to what I actually think is right, even if they disagree. But the disagreement matters — I want to sit with it."
- **Fe:** "I care about the relationship as much as being right. Whatever the answer is, I want us to land somewhere we can both stand."

### Q-T7 — When you have to make a hard call

- **Ti:** "I want to get the decision framework right first. The right framework makes the call itself straightforward."
- **Te:** "The data's in. Let's pick the option that best hits the goal and move. We can course-correct once we see how it plays out."
- **Fi:** "I can't make this call well until I'm clear on what I actually believe matters here. Externally-optimal but internally-wrong is the worst place to land."
- **Fe:** "Whatever I decide affects other people. I want to understand who carries what cost before I choose."

### Q-T8 — When someone close to you is struggling

Order these by which most sounds like your first instinct:

- **Ti:** "I want to understand what's really going on before I respond. If I misread the problem, even sincere help can make it worse."
- **Te:** "I want to find the next useful action. What needs to be handled, fixed, arranged, or removed so they can breathe?"
- **Fi:** "I want to honor what this feels like from inside their life. I don't want to rush past the meaning of it just to make myself useful."
- **Fe:** "I'm paying attention to what they need from me in the moment: quiet, reassurance, company, honesty, or help carrying it."

*Revised 2026-04-24 from v1 original. Each function now has a distinct first move — Ti: clarify the problem; Te: solve the problem; Fi: honor the person's inner experience; Fe: regulate the relational/emotional field. See `open-design-calls.md` for the full iteration note.*

---

## Self-check against the guardrail

Each function across all 8 statements was reviewed for register consistency:

- **Ni** — convergent pattern-finding ("the pattern that explains everything," "the underlying thing," "what it's really for," "what this place is really about"). Not mystical.
- **Ne** — divergent possibility-mapping ("four interesting angles," "several approaches," "many new possibilities," "several forces at work"). Not scatterbrained — each reads as disciplined breadth.
- **Si** — precedent-aware and grounded ("what's worked before," "similar situations I've been in," "the way experts have taught it," "I've seen this before"). Not rigid — reads as remembering what worked.
- **Se** — present-moment responsive ("start moving and see," "what's actually present," "doing it," "what's actually happening"). Not impulsive — reads as engaged attention.
- **Ti** — logic-testing and precise ("flaw in the underlying logic," "where their reasoning differs," "get the decision framework right," "bad analysis leads to bad help"). Not cold or pedantic.
- **Te** — action-oriented and decisive ("change what we're doing," "change course quickly," "pick the option, move, course-correct," "do one useful thing"). Not controlling or sociopathic — reads as effective.
- **Fi** — aligned to inner compass ("what we care about," "what I actually think is right," "what I believe matters," "sitting with how this feels"). Not precious — reads as honest self-reference.
- **Fe** — relationally attuned ("what the friction is doing to the team," "where we can both stand," "who carries what cost," "attuning to them"). Not needy — reads as relational intelligence.

## Known soft spots to review

- ~~**Q-T8 Ti and Q-T8 Te distinction.** Both emphasize doing-right-thing-for-them.~~ **Resolved in v2 (2026-04-24).** Q-T8 rewritten with distinct first-move + distinct protection per function. See revised Q-T8 above.
- **Q-T6 Fi "I want to sit with it."** Could be read as dithering. Intent: reflective re-examination. Alternatives worth considering: "I want to take it seriously without abandoning my read," or "I want to hold both their view and mine until I see what's true." **Status: still open.**
- **Q-T3 Si "the way experts have taught it."** May read as deferential. Alternative: "through the established progression that works." Worth testing. **Status: still open.**
- **Q-T2 Ne.** "So many new possibilities here" is the riskiest-for-cartoonish line. Alternative: "I want to explore before forming any conclusions — there's a lot here." **Status: still open.**
- **Q-T1 Se "I'll know what I'm dealing with once I'm actually working on it."** Could be read as careless-before-action. The intent is embodied cognition. Alternative: "I learn more from engaging the problem directly than from thinking about it abstractly." **Status: still open.**
- **Scenario header voice.** All 8 headers are written plainly ("When you're working on a hard problem"). Could be tightened or dramatized if you want more texture; I kept them flat so the voice work lives in the options. **Status: still open.**

## Iteration principle (from Q-T8 review)

Each of four statements in a question must have:

1. **A distinct first move** — the action the function reaches for before anything else (clarify, solve, honor, attune; or see-pattern, map-possibilities, check-precedent, engage-present; etc.).
2. **A distinct protection** — what the function is safeguarding (truth of the problem, practical relief, authentic experience, emotional connection; or convergence, breadth, continuity, presence; etc.).

When two functions in the same question overlap on either first-move or protection, they read close and the signal degrades. Tighten until each function has a clean lane without making any function sound worse.

Preserve the humanity of the scenario. Signal quality comes from priority-order resonance, not from making three of four options obviously weaker.

## Proposed changes for v2 (after review)

To be filled in after review feedback. The scaffolding of 8 scenarios × 4 statements each should stay stable; individual statements are the iteration unit.

---

## Signal emission (for reference — CC-009 time)

Each statement, when ranked, emits a per-question rank signal for its function:

- `ni(rank: n, source_question: Q-Tn)` — for Ni statements ranked at position n
- `ne(rank: n, source_question: Q-Tn)` — for Ne statements
- Similarly for `si`, `se`, `ti`, `te`, `fi`, `fe`

Across the 4 perceiving questions, each of Ni/Ne/Si/Se is ranked four times. Average or sum rank identifies the dominant perceiving function for the user. Same for judging. Dominant + auxiliary via the Canonical Stack Table → MBTI label.

The `decision_friction` signal (per `temperament-framework.md`) is not emitted by these questions in the v1 design; every ranking produces rank data for all four functions. Whether to allow an opt-out that emits `decision_friction` is a CC-009 design call.
