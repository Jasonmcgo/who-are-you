# Tension Library v1

## Purpose

Define reusable tensions detected by comparing signals across cards.

A tension is not a flaw.  
A tension is a meaningful pull between two or more parts of the person.

---

## T-001 Truth vs Belonging

Signals:
- truth_priority_high
- adapts_under_social_pressure

Description:
The user values truth, but may soften or withhold it when relationships are at risk.

User Prompt:
This pattern may be present: you value truth, but adapt when social cost is high. Does this feel accurate?

Strengtheners:
- conviction_under_cost — raises confidence when the user's freeform answer describes real cost paid for holding a belief.

---

## T-002 Conviction vs Economic Security

Signals:
- truth_priority_high OR strong_independent_conviction
- adapts_under_economic_pressure OR hides_belief

Description:
The user may hold strong beliefs internally while limiting expression when financial security is at risk.

User Prompt:
This pattern may be present: your convictions may remain intact internally, but become more private when economic risk rises. Does this feel accurate?

Strengtheners:
- conviction_under_cost — raises confidence when the user's freeform answer describes real cost paid for holding a belief.

---

## T-003 Independence vs Respect

Signals:
- strong_independent_conviction
- doubt_self_when_respected_people_disagree OR reflective_independence

Description:
The user may think independently, but still gives meaningful weight to respected people.

User Prompt:
This pattern may be present: you are independent, but not immune to the judgment of people you respect. Does this feel accurate?

---

## T-004 Formation vs Current Conviction

Signals:
- authority_trust_high OR authority_skepticism_moderate OR authority_distrust
- institutional_trust OR institutional_skepticism OR institutional_distrust

Description:
The user’s current view of institutions may either extend or resist their early experience with authority.

User Prompt:
This pattern may be present: your current view of institutions may be shaped by, or reacting against, your early experience with authority. Does this feel accurate?

---

## T-005 Stability vs Freedom

Signals:
- stability_priority OR high_responsibility OR high_pressure_context
- freedom_priority

Description:
The user values freedom, but current responsibilities or stability needs may constrain how freely they can act.

User Prompt:
This pattern may be present: you value freedom, but your responsibilities or need for stability may limit how much freedom you can actually choose. Does this feel accurate?

---

## T-006 Creator vs Maintainer

Signals:
- proactive_creator
- responsibility_maintainer OR reactive_operator

Source Questions:
- proactive_creator must come from Q-A2 (aspiration)
- responsibility_maintainer or reactive_operator must come from Q-A1 (current reality)

Description:
The user may see themselves as a builder or creator, while current life demands keep them in maintenance or reaction mode.

User Prompt:
This pattern may be present: part of you wants to build, but much of your life may be spent maintaining or reacting. Does this feel accurate?

---

## T-007 Family vs Truth

Signals:
- family_priority
- truth_priority_high OR truth_priority

Description:
The user may experience tension when protecting family conflicts with speaking or pursuing truth.

User Prompt:
This pattern may be present: family and truth both matter deeply to you, and there may be moments where protecting one feels like risking the other. Does this feel accurate?

---

## T-008 Order vs Reinvention

Signals:
- order_priority OR stability_priority
- freedom_priority OR proactive_creator

Description:
The user may value order and stability while also wanting freedom to create or reinvent.

User Prompt:
This pattern may be present: you may want stable structures, but also resist structures that prevent reinvention. Does this feel accurate?

---

## T-009 Individual vs System Responsibility

Signals:
- individual_responsibility
- systemic_responsibility OR balanced_responsibility

Description:
The user may believe people are responsible for their choices while also recognizing that systems shape outcomes.

User Prompt:
This pattern may be present: you may hold individuals accountable while still recognizing that systems can meaningfully constrain them. Does this feel accurate?

---

## T-010 Inherited Stability vs Present Chaos

Signals:
- stability_baseline_high
- high_pressure_context OR reactive_operator

Description:
The user may have been formed in stability but currently lives under pressure, overload, or constant reaction.

User Prompt:
This pattern may be present: you may have a strong internal expectation for stability, while your current life feels more pressured or reactive. Does this feel accurate?

---

## T-011 Chaos Formation vs Control Need

Signals:
- chaos_exposure
- order_priority OR stability_priority

Description:
The user may value order or stability partly because early life felt uncertain or chaotic.

User Prompt:
This pattern may be present: your desire for order may be connected to earlier experiences of uncertainty. Does this feel accurate?

---

## T-012 Sacred Value Conflict

Signals:
- Any two distinct rank-aware sacred `*_priority` signals at rank ≤ 2:
  freedom_priority, truth_priority, stability_priority, loyalty_priority,
  family_priority, knowledge_priority, justice_priority, faith_priority.

Source Questions:
- Sacred signals are produced by Q-S1 (freedom_priority, truth_priority, stability_priority, loyalty_priority) and Q-S2 (family_priority, knowledge_priority, justice_priority, faith_priority). Both are ranking-type questions per `card-schema.md` § Question Types; each emits its four signals with rank metadata per `signal-mapping-rule.md` § Ranking Question Signal Emission.

Description:
The user may hold multiple sacred values that cannot always be protected at the same time.

User Prompt:
This pattern may be present: some of your deepest values may come into conflict when life forces a tradeoff. Does this feel accurate?

---

## Canonical Rules

1. Tensions must be derived from signals, not raw guesses.
2. Tensions must be presented as possibilities, not declarations.
3. Every tension must include a user-facing confirmation prompt.
4. A rejected tension must not be reused as settled truth.
5. Confirmed tensions may be used in the Inner Constitution.
6. Tensions should never shame adaptation, caution, silence, or compromise.
7. Tensions should reveal structure, not assign blame.
