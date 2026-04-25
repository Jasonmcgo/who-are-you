# Signal Library v1

## Purpose

Canonical registry of every signal referenced anywhere in the "Who Are You?" system. A signal is the atomic output of an answer and the atomic input to a tension.

Each entry records where the signal is **produced** (which question(s) emit it in `question-bank-v1.md`), where it is **used** (which tension(s) consume it in `tension-library-v1.md`), and its current **implementation status**.

This file is derivable from `question-bank-v1.md` and `tension-library-v1.md` but exists as a standalone source of truth to make wiring gaps visible. It also reports runtime-vs-canon drift: signals that canon produces but `data/questions.ts` or `lib/identityEngine.ts` does not.

---

## Canonical Rules

1. Every signal must either be produced by a question in `question-bank-v1.md` or used by a tension in `tension-library-v1.md`. Signals that are neither do not exist.
2. A signal's status is determined only by canonical production and canonical consumption. Runtime gaps are recorded in `notes`, not in the status.
3. A signal cannot simultaneously be `pending` and `unused`. If a signal is both tension-referenced-without-a-question AND question-emitted-without-a-tension (different sources disagreeing about its wiring), it is reported as an anomaly and assigned the status reflecting the larger structural problem (usually `pending`).
4. Cross-card signals list every producing card in `primary_cards`. The signal's primary entry lives under the card containing its earliest producing question; later cards point to it.
5. New signals enter canon by appearing in a question's `signals:` block in `question-bank-v1.md`. This file must be updated in the same change.

---

## Status Definitions (four values)

- **active** — produced by at least one canonical question AND (used by at least one canonical tension OR declared as a strengthener of at least one canonical tension via a `Strengtheners:` field in `tension-library-v1.md`). For `rank_aware` signals (per `signal-and-tension-model.md` § Rank-Aware Signals), "used by at least one canonical tension" is satisfied if any tension consumes the signal at any rank — tensions are free to filter by `rank` when relevant, but a signal does not need to be consumed at every rank to count as active.
- **pending** — referenced by a canonical tension but not produced by any canonical question. A dead reference. The referencing tension cannot fire through that branch.
- **unused** — produced by a canonical question (or the runtime freeform extractor) but not consumed by any canonical tension. An orphan.
- **deprecated** — formally removed from canon. Retained only so historical references remain explicable.

---

## Per-Signal Entry Schema

Each entry carries every field below:

- `signal_id`
- `description`
- `primary_cards` — list of every card with a producing question; `—` only for dead references
- `produced_by_questions` — list of question_ids; `—` for dead references
- `used_by_tensions` — list of tension_ids; `—` for orphans
- `strengthens_tensions` — optional list of tension_ids this signal strengthens (not triggers); present only for strengthener signals
- `rank_aware` — boolean (default `false`). When `true`, signals of this id are emitted by a `ranking` question and carry a `rank` field as described in `signal-and-tension-model.md` § Rank-Aware Signals
- `implementation_status` — one of `active | pending | unused | deprecated`
- `notes` — required when there is a runtime-vs-canon gap, a cross-card situation, or a tension-specific sourcing constraint

---

## Note on forthcoming rank-aware re-registration

Signals destined for ranking questions (forthcoming Q-S1 ranked, Q-S2, Q-X3, Q-C4, Q-T1–Q-T8) will be re-registered as `rank_aware: true` in CC-006 through CC-009. Existing entries are unchanged in CC-005. The schema field and supporting definitions are added in CC-005 so the per-question CCs have a stable target to bind to.

---

## Signals — by Card

### Conviction Card

#### truth_priority_high

- signal_id: truth_priority_high
- description: Appears to prioritize truth over social comfort.
- primary_cards: [conviction]
- produced_by_questions: [Q-C1]
- used_by_tensions: [T-001, T-002, T-007]
- implementation_status: active
- notes: —

---

#### belonging_priority_high

- signal_id: belonging_priority_high
- description: Appears to weight belonging heavily when truth is socially costly.
- primary_cards: [conviction]
- produced_by_questions: [Q-C1]
- used_by_tensions: —
- implementation_status: unused
- notes: Emitted by Q-C1 at runtime; no canonical tension consumes it.

---

#### loyalty_priority

- signal_id: loyalty_priority
- description: Tends to prioritize loyalty to people over abstract commitment to truth.
- primary_cards: [conviction, sacred]
- produced_by_questions: [Q-C2, Q-S1]
- used_by_tensions: [T-012]
- rank_aware: true
- implementation_status: active
- notes: Now cross-card. Q-S1 (ranking) is the live runtime producer and emits with rank metadata per `signal-mapping-rule.md` § Ranking Question Signal Emission. Q-C2 (forced) is canonical-only and not implemented in `data/questions.ts`; Q-C2 emissions would not carry rank. Promoted from `unused` to `active` in CC-006 because T-012's rewritten Sacred Value Conflict rule now consumes loyalty_priority.

---

#### truth_priority

- signal_id: truth_priority
- description: Holds truth as a sacred value; chooses truth when values conflict.
- primary_cards: [conviction, sacred]
- produced_by_questions: [Q-C2, Q-S1]
- used_by_tensions: [T-007, T-012]
- rank_aware: true
- implementation_status: active
- notes: Cross-card. Q-S1 is now a ranking question per CC-006; Q-S1 emissions carry rank metadata per `signal-mapping-rule.md` § Ranking Question Signal Emission, while Q-C2 emissions (forced) do not. Q-C2 is canonical-only and not implemented in `data/questions.ts`; at runtime `truth_priority` is only emittable via Q-S1.

---

#### freedom_priority

- signal_id: freedom_priority
- description: Holds freedom of action as a sacred value.
- primary_cards: [conviction, sacred]
- produced_by_questions: [Q-C3, Q-S1]
- used_by_tensions: [T-005, T-008, T-012]
- rank_aware: true
- implementation_status: active
- notes: Cross-card. Q-S1 is now a ranking question per CC-006; Q-S1 emissions carry rank metadata per `signal-mapping-rule.md` § Ranking Question Signal Emission, while Q-C3 emissions (forced) do not. Both producers are canonically authorized and Q-S1 is the live runtime producer.

---

#### order_priority

- signal_id: order_priority
- description: Tends to favor order and structure over freedom.
- primary_cards: [conviction]
- produced_by_questions: [Q-C3]
- used_by_tensions: [T-008, T-011]
- implementation_status: active
- notes: —

---

#### individual_responsibility

- signal_id: individual_responsibility
- description: Tends to locate responsibility for outcomes in the individual.
- primary_cards: [conviction]
- produced_by_questions: [Q-C4]
- used_by_tensions: [T-009]
- implementation_status: active
- notes: Canonically produced by Q-C4 (`question-bank-v1.md` lines 58–71); used by T-009 (`tension-library-v1.md` lines 128–138). Q-C4 is not implemented in `data/questions.ts`, so this signal is not emitted at runtime.

---

#### systemic_responsibility

- signal_id: systemic_responsibility
- description: Tends to locate responsibility for outcomes in systems.
- primary_cards: [conviction]
- produced_by_questions: [Q-C4]
- used_by_tensions: [T-009]
- implementation_status: active
- notes: Canonically produced by Q-C4 (`question-bank-v1.md` lines 58–71); used by T-009 (`tension-library-v1.md` lines 128–138). Q-C4 is not implemented in `data/questions.ts`, so this signal is not emitted at runtime.

---

#### balanced_responsibility

- signal_id: balanced_responsibility
- description: Tends to distribute responsibility between individual and system.
- primary_cards: [conviction]
- produced_by_questions: [Q-C4]
- used_by_tensions: [T-009]
- implementation_status: active
- notes: Canonically produced by Q-C4 (`question-bank-v1.md` lines 58–71); used by T-009 (`tension-library-v1.md` lines 128–138). Q-C4 is not implemented in `data/questions.ts`, so this signal is not emitted at runtime.

---

#### independent_thought_signal

- signal_id: independent_thought_signal
- description: Tends to hold beliefs that differ from those around them.
- primary_cards: [conviction]
- produced_by_questions: [Q-I1]
- used_by_tensions: —
- implementation_status: unused
- notes: Q-I1 is a freeform question (`question-bank-v1.md` lines 254–260). At runtime the signal is emitted by the keyword extractor in `lib/identityEngine.ts` (`extractFreeformSignals`). No canonical tension consumes it.

---

#### epistemic_flexibility

- signal_id: epistemic_flexibility
- description: Open to changing beliefs when presented with evidence.
- primary_cards: [conviction]
- produced_by_questions: [Q-I2]
- used_by_tensions: —
- implementation_status: unused
- notes: Q-I2 is a freeform question (`question-bank-v1.md` lines 264–270). At runtime the signal is emitted by the keyword extractor in `lib/identityEngine.ts`. No canonical tension consumes it.

---

### Pressure Card

#### adapts_under_social_pressure

- signal_id: adapts_under_social_pressure
- description: May soften or withhold belief when relationships are at risk.
- primary_cards: [pressure]
- produced_by_questions: [Q-P1]
- used_by_tensions: [T-001]
- implementation_status: active
- notes: —

---

#### moderate_social_expression

- signal_id: moderate_social_expression
- description: Tends to express belief carefully under social pressure.
- primary_cards: [pressure]
- produced_by_questions: [Q-P1]
- used_by_tensions: —
- implementation_status: unused
- notes: Emitted at runtime by Q-P1; no canonical tension consumes it.

---

#### high_conviction_expression

- signal_id: high_conviction_expression
- description: Tends to state belief directly even under social cost.
- primary_cards: [pressure]
- produced_by_questions: [Q-P1]
- used_by_tensions: —
- implementation_status: unused
- notes: Emitted at runtime by Q-P1; no canonical tension consumes it.

---

#### adapts_under_economic_pressure

- signal_id: adapts_under_economic_pressure
- description: May change position when economic security is at risk.
- primary_cards: [pressure]
- produced_by_questions: [Q-P2]
- used_by_tensions: [T-002]
- implementation_status: active
- notes: —

---

#### hides_belief

- signal_id: hides_belief
- description: May keep belief private when livelihood is exposed.
- primary_cards: [pressure]
- produced_by_questions: [Q-P2]
- used_by_tensions: [T-002]
- implementation_status: active
- notes: —

---

#### holds_internal_conviction

- signal_id: holds_internal_conviction
- description: Appears to retain internal conviction while limiting expression.
- primary_cards: [pressure]
- produced_by_questions: [Q-P2]
- used_by_tensions: —
- implementation_status: unused
- notes: Emitted at runtime by Q-P2; no canonical tension consumes it.

---

#### high_conviction_under_risk

- signal_id: high_conviction_under_risk
- description: Appears willing to accept economic risk for belief.
- primary_cards: [pressure]
- produced_by_questions: [Q-P2]
- used_by_tensions: —
- implementation_status: unused
- notes: Emitted at runtime by Q-P2; no canonical tension consumes it.

---

#### high_social_dependence

- signal_id: high_social_dependence
- description: Tends to defer to respected others when beliefs diverge.
- primary_cards: [pressure]
- produced_by_questions: [Q-P3]
- used_by_tensions: —
- implementation_status: unused
- notes: Canonically produced by Q-P3 (`question-bank-v1.md` lines 111–124). Q-P3 is not implemented in `data/questions.ts`, so this signal is not emitted at runtime.

---

#### reflective_independence

- signal_id: reflective_independence
- description: Tends to re-examine belief carefully in response to respected disagreement, without capitulating.
- primary_cards: [pressure]
- produced_by_questions: [Q-P3]
- used_by_tensions: [T-003]
- implementation_status: active
- notes: Canonically produced by Q-P3 (`question-bank-v1.md` lines 111–124); used by T-003 (`tension-library-v1.md` lines 40–50). Q-P3 is not implemented in `data/questions.ts`, so this signal is not emitted at runtime.

---

#### strong_independent_conviction

- signal_id: strong_independent_conviction
- description: Tends to hold position even when respected others disagree.
- primary_cards: [pressure]
- produced_by_questions: [Q-P3]
- used_by_tensions: [T-002, T-003]
- implementation_status: active
- notes: Canonically produced by Q-P3 (`question-bank-v1.md` lines 111–124); used by T-002 (lines 26–36) and T-003 (lines 40–50). Q-P3 is not implemented in `data/questions.ts`, so this signal is not emitted at runtime. T-002 still fires via the `truth_priority_high` OR-branch at runtime; T-003 does not fire at runtime because its required left-side signal is this one.

---

#### conviction_under_cost

- signal_id: conviction_under_cost
- description: Has experienced cost for holding a belief.
- primary_cards: [pressure]
- produced_by_questions: [Q-I3]
- used_by_tensions: —
- strengthens_tensions: [T-001, T-002]
- implementation_status: active
- notes: Q-I3 is a freeform question (`question-bank-v1.md` lines 272–280). At runtime the signal is emitted by the keyword extractor in `lib/identityEngine.ts` on keywords `lost | cost | risk | job | friends`. Declared as a strengthener (not trigger) of T-001 (`tension-library-v1.md` lines 12–25) and T-002 (lines 28–41) via their `Strengtheners:` fields; when either tension is already detected by its canonical `Signals:` rule in the same session, this signal's presence raises that tension's `confidence` from `medium` to `high`. Strengtheners never fire a tension on their own.

---

#### cost_awareness

- signal_id: cost_awareness
- description: Retains awareness of what a belief has cost or could cost.
- primary_cards: [pressure]
- produced_by_questions: [Q-I3]
- used_by_tensions: —
- implementation_status: unused
- notes: Canonically assigned to Q-I3 in `question-bank-v1.md` line 280. The runtime freeform extractor in `lib/identityEngine.ts` does NOT currently emit `cost_awareness` — only `conviction_under_cost` is produced from Q-I3 answers. Canonical but runtime-dead.

---

### Formation Card

#### authority_trust_high

- signal_id: authority_trust_high
- description: Early experience of authority as protective may shape trust in institutions.
- primary_cards: [formation]
- produced_by_questions: [Q-F1]
- used_by_tensions: [T-004]
- implementation_status: active
- notes: T-004's right side is composed entirely of dead-reference signals (`institutional_trust`, `institutional_skepticism`, `institutional_distrust`), so T-004 cannot fire despite this signal being active.

---

#### authority_skepticism_moderate

- signal_id: authority_skepticism_moderate
- description: Early experience of authority as flawed may produce measured skepticism.
- primary_cards: [formation]
- produced_by_questions: [Q-F1]
- used_by_tensions: [T-004]
- implementation_status: active
- notes: Same T-004 right-side dead-reference blocker as `authority_trust_high`.

---

#### authority_distrust

- signal_id: authority_distrust
- description: Early experience of authority as unfair may produce durable skepticism.
- primary_cards: [formation]
- produced_by_questions: [Q-F1]
- used_by_tensions: [T-004]
- implementation_status: active
- notes: Same T-004 right-side dead-reference blocker as `authority_trust_high`.

---

#### stability_baseline_high

- signal_id: stability_baseline_high
- description: Formed in stability, which may set an internal expectation of predictability.
- primary_cards: [formation]
- produced_by_questions: [Q-F2]
- used_by_tensions: [T-010]
- implementation_status: active
- notes: —

---

#### moderate_stability

- signal_id: moderate_stability
- description: Formed in a mix of stability and uncertainty.
- primary_cards: [formation]
- produced_by_questions: [Q-F2]
- used_by_tensions: —
- implementation_status: unused
- notes: Emitted at runtime by Q-F2; no canonical tension consumes it.

---

#### chaos_exposure

- signal_id: chaos_exposure
- description: Formed in uncertainty, which may shape later preferences for control or order.
- primary_cards: [formation]
- produced_by_questions: [Q-F2]
- used_by_tensions: [T-011]
- implementation_status: active
- notes: —

---

### Context Card

#### stability_present

- signal_id: stability_present
- description: Current context appears stable and manageable.
- primary_cards: [context]
- produced_by_questions: [Q-X1]
- used_by_tensions: —
- implementation_status: unused
- notes: Emitted at runtime by Q-X1; no canonical tension consumes it.

---

#### moderate_load

- signal_id: moderate_load
- description: Current context appears busy but controlled.
- primary_cards: [context]
- produced_by_questions: [Q-X1]
- used_by_tensions: —
- implementation_status: unused
- notes: Emitted at runtime by Q-X1; no canonical tension consumes it.

---

#### high_pressure_context

- signal_id: high_pressure_context
- description: Current context appears stretched or overloaded.
- primary_cards: [context]
- produced_by_questions: [Q-X1]
- used_by_tensions: [T-005, T-010]
- implementation_status: active
- notes: —

---

#### low_responsibility

- signal_id: low_responsibility
- description: Few external dependents at present.
- primary_cards: [context]
- produced_by_questions: [Q-X2]
- used_by_tensions: —
- implementation_status: unused
- notes: Emitted at runtime by Q-X2; no canonical tension consumes it.

---

#### moderate_responsibility

- signal_id: moderate_responsibility
- description: Some external dependents at present.
- primary_cards: [context]
- produced_by_questions: [Q-X2]
- used_by_tensions: —
- implementation_status: unused
- notes: Emitted at runtime by Q-X2; no canonical tension consumes it.

---

#### high_responsibility

- signal_id: high_responsibility
- description: Many others depend on the user at present.
- primary_cards: [context]
- produced_by_questions: [Q-X2]
- used_by_tensions: [T-005]
- implementation_status: active
- notes: —

---

### Agency Card

#### proactive_creator

- signal_id: proactive_creator
- description: Tends to spend time or channel aspirational energy toward building or creating.
- primary_cards: [agency]
- produced_by_questions: [Q-A1, Q-A2]
- used_by_tensions: [T-006, T-008]
- implementation_status: active
- notes: Tension-specific sourcing constraint. T-006 requires `proactive_creator` to originate specifically from Q-A2 (aspiration), not Q-A1 (current reality). See `tension-library-v1.md` T-006 Source Questions (lines 88–90). T-008 has no sourcing constraint and accepts either source.

---

#### responsibility_maintainer

- signal_id: responsibility_maintainer
- description: Tends to spend time maintaining existing responsibilities.
- primary_cards: [agency]
- produced_by_questions: [Q-A1]
- used_by_tensions: [T-006]
- implementation_status: active
- notes: T-006 Source Questions constrain this signal to originate from Q-A1 (current reality).

---

#### reactive_operator

- signal_id: reactive_operator
- description: Tends to spend time reacting to incoming demands.
- primary_cards: [agency]
- produced_by_questions: [Q-A1]
- used_by_tensions: [T-006, T-010]
- implementation_status: active
- notes: T-006 Source Questions constrain this signal to originate from Q-A1. T-010 has no sourcing constraint.

---

#### relational_investment

- signal_id: relational_investment
- description: Energy would flow toward deepening relationships and care if freed.
- primary_cards: [agency]
- produced_by_questions: [Q-A2]
- used_by_tensions: —
- implementation_status: unused
- notes: Emitted at runtime by Q-A2; no canonical tension consumes it.

---

#### stability_restoration

- signal_id: stability_restoration
- description: Energy would flow toward restoring order and stability if freed.
- primary_cards: [agency]
- produced_by_questions: [Q-A2]
- used_by_tensions: —
- implementation_status: unused
- notes: Emitted at runtime by Q-A2; no canonical tension consumes it.

---

#### exploration_drive

- signal_id: exploration_drive
- description: Energy would flow toward exploring, learning, or wandering if freed.
- primary_cards: [agency]
- produced_by_questions: [Q-A2]
- used_by_tensions: —
- implementation_status: unused
- notes: Emitted at runtime by Q-A2; no canonical tension consumes it.

---

### Sacred Values Card

#### family_priority

- signal_id: family_priority
- description: Holds family as a sacred value.
- primary_cards: [sacred]
- produced_by_questions: [Q-S2]
- used_by_tensions: [T-007, T-012]
- rank_aware: true
- implementation_status: active
- notes: Q-S2 is a ranking question; signal emits with rank metadata per `signal-mapping-rule.md` § Ranking Question Signal Emission. Producer moved from Q-S1 (forced) to Q-S2 (ranking) in CC-006.

---

#### stability_priority

- signal_id: stability_priority
- description: Holds stability as a sacred value.
- primary_cards: [sacred]
- produced_by_questions: [Q-S1]
- used_by_tensions: [T-005, T-008, T-011, T-012]
- rank_aware: true
- implementation_status: active
- notes: Q-S1 is now a ranking question per CC-006; signal emits with rank metadata per `signal-mapping-rule.md` § Ranking Question Signal Emission.

---

#### knowledge_priority

- signal_id: knowledge_priority
- description: Holds knowledge — what's actually known and the discipline of seeking more — as a sacred value.
- primary_cards: [sacred]
- produced_by_questions: [Q-S2]
- used_by_tensions: [T-012]
- rank_aware: true
- implementation_status: active
- notes: Introduced by Q-S2 in CC-006. Rank-aware per `signal-mapping-rule.md` § Ranking Question Signal Emission.

---

#### justice_priority

- signal_id: justice_priority
- description: Holds justice — fair weight, even when it costs to give it — as a sacred value.
- primary_cards: [sacred]
- produced_by_questions: [Q-S2]
- used_by_tensions: [T-012]
- rank_aware: true
- implementation_status: active
- notes: Introduced by Q-S2 in CC-006. Rank-aware per `signal-mapping-rule.md` § Ranking Question Signal Emission.

---

#### faith_priority

- signal_id: faith_priority
- description: Holds faith — trust in what's larger than you, however framed — as a sacred value.
- primary_cards: [sacred]
- produced_by_questions: [Q-S2]
- used_by_tensions: [T-012]
- rank_aware: true
- implementation_status: active
- notes: Introduced by Q-S2 in CC-006. Rank-aware per `signal-mapping-rule.md` § Ranking Question Signal Emission.

---

`truth_priority` and `freedom_priority` are cross-card. Their primary entries live under the Conviction Card section above. `loyalty_priority` is also cross-card under CC-006 — its primary entry lives in the Conviction Card section.

---

### Dead References (Tension-Only)

Signals referenced by a tension in `tension-library-v1.md` that no question in `question-bank-v1.md` produces. They are `pending` until either a question is added that emits them or the referencing tension is revised.

#### doubt_self_when_respected_people_disagree

- signal_id: doubt_self_when_respected_people_disagree
- description: Tends to assume error when respected people disagree.
- primary_cards: —
- produced_by_questions: —
- used_by_tensions: [T-003]
- implementation_status: pending
- notes: Referenced only by T-003 on the right-side OR branch (`tension-library-v1.md` line 44). The alternative `reflective_independence` is canonically produced by Q-P3, so T-003 can still fire through the OR alternative once Q-P3 is implemented at runtime.

---

#### institutional_trust

- signal_id: institutional_trust
- description: Tends to trust institutions as currently constituted.
- primary_cards: —
- produced_by_questions: —
- used_by_tensions: [T-004]
- implementation_status: pending
- notes: Referenced by T-004 on the right side (`tension-library-v1.md` line 58). No canonical question produces it; no OR-alternative on that side has a canonical producer either, so T-004 is blocked at the canon level.

---

#### institutional_skepticism

- signal_id: institutional_skepticism
- description: Holds measured skepticism toward institutions.
- primary_cards: —
- produced_by_questions: —
- used_by_tensions: [T-004]
- implementation_status: pending
- notes: Same T-004 right-side dead-reference condition as `institutional_trust`.

---

#### institutional_distrust

- signal_id: institutional_distrust
- description: Distrusts institutions as currently constituted.
- primary_cards: —
- produced_by_questions: —
- used_by_tensions: [T-004]
- implementation_status: pending
- notes: Same T-004 right-side dead-reference condition as `institutional_trust`.

---

## Active Signals

Produced by at least one canonical question AND (used by at least one canonical tension OR declared as a strengthener of one). 29 total.

`truth_priority_high`, `truth_priority`, `freedom_priority`, `order_priority`, `individual_responsibility`, `systemic_responsibility`, `balanced_responsibility`, `adapts_under_social_pressure`, `adapts_under_economic_pressure`, `hides_belief`, `reflective_independence`, `strong_independent_conviction`, `authority_trust_high`, `authority_skepticism_moderate`, `authority_distrust`, `stability_baseline_high`, `chaos_exposure`, `high_pressure_context`, `high_responsibility`, `proactive_creator`, `responsibility_maintainer`, `reactive_operator`, `family_priority`, `stability_priority`, `conviction_under_cost`, `loyalty_priority`, `knowledge_priority`, `justice_priority`, `faith_priority`.

---

## Pending Signals

Referenced by a canonical tension but not produced by any canonical question. Dead references. 4 total.

- `doubt_self_when_respected_people_disagree` — referenced by T-003.
- `institutional_trust` — referenced by T-004.
- `institutional_skepticism` — referenced by T-004.
- `institutional_distrust` — referenced by T-004.

---

## Unused Signals

Produced by a canonical question (or the runtime freeform extractor) but not consumed by any canonical tension. Orphans. 17 total.

- `belonging_priority_high` — produced by Q-C1.
- `moderate_social_expression` — produced by Q-P1.
- `high_conviction_expression` — produced by Q-P1.
- `holds_internal_conviction` — produced by Q-P2.
- `high_conviction_under_risk` — produced by Q-P2.
- `high_social_dependence` — produced by Q-P3.
- `moderate_stability` — produced by Q-F2.
- `stability_present` — produced by Q-X1.
- `moderate_load` — produced by Q-X1.
- `low_responsibility` — produced by Q-X2.
- `moderate_responsibility` — produced by Q-X2.
- `relational_investment` — produced by Q-A2.
- `stability_restoration` — produced by Q-A2.
- `exploration_drive` — produced by Q-A2.
- `independent_thought_signal` — produced by Q-I1 (freeform).
- `epistemic_flexibility` — produced by Q-I2 (freeform).
- `cost_awareness` — canonically produced by Q-I3; not emitted by the runtime extractor.

---

## Deprecated Signals

None.

---

## Tensions Blocked by Missing Signals

Every tension in `tension-library-v1.md` that cannot currently fire, categorized per CC-003 §4.

### T-003 Independence vs Respect

- tension_id: T-003
- blocker_type: runtime blocker
- missing_signals: `strong_independent_conviction`, `reflective_independence` — both canonically produced by Q-P3, which is absent from `data/questions.ts`. The OR-alternative `doubt_self_when_respected_people_disagree` is a dead reference and does not help.
- remediation_path: implement Q-P3 in `data/questions.ts` (per `question-bank-v1.md` lines 111–124). Once Q-P3 emits `strong_independent_conviction` and `reflective_independence` at runtime, T-003 fires via the `reflective_independence` OR-branch.

### T-004 Formation vs Current Conviction

- tension_id: T-004
- blocker_type: canon blocker
- missing_signals: `institutional_trust`, `institutional_skepticism`, `institutional_distrust`. All three are dead references; the right-side of T-004 is composed entirely of signals that no canonical question produces. No OR-alternative has a canonical producer. T-004 cannot fire under any combination of canonical answers, independent of code.
- remediation_path: canon edit required. Either (a) add a question — most naturally a new context or formation question — whose `signals:` block produces at least one of `institutional_trust | institutional_skepticism | institutional_distrust`, or (b) rewrite T-004's right side to reference signals already produced by canonical questions (for example, reuse the authority-trust signals on both sides, or introduce a different right-side signal family already present in canon).

### T-009 Individual vs System Responsibility

- tension_id: T-009
- blocker_type: runtime blocker
- missing_signals: `individual_responsibility`, `systemic_responsibility`, `balanced_responsibility` — all canonical (Q-C4) but Q-C4 is absent from `data/questions.ts`, so none is emitted at runtime.
- remediation_path: implement Q-C4 in `data/questions.ts` (per `question-bank-v1.md` lines 58–71). NOTE: after Q-C4 is added, T-009 will transition from runtime-blocked to question-design-blocked — Q-C4 is single-choice with three mutually exclusive options, so a single session can emit at most one of the three responsibility signals, but T-009 requires `individual_responsibility` AND (`systemic_responsibility` OR `balanced_responsibility`). A follow-up fix is required: either restructure Q-C4 as multi-select / ranked, or rewrite T-009's requirement from AND to an OR-over-pairs formulation that can be satisfied by a single selection.

### T-012 Sacred Value Conflict

- tension_id: T-012
- blocker_type: question-design blocker
- missing_signals: none are missing in the canon-producer sense. All four of `family_priority`, `freedom_priority`, `truth_priority`, `stability_priority` exist in canon and (via Q-S1, which is implemented) at runtime. The obstruction is structural co-occurrence: T-012 requires all four signals simultaneously, but Q-S1 is single-choice (`question-bank-v1.md` lines 234–248), so any single session can emit at most one of the four sacred-value signals through Q-S1. `freedom_priority` also has Q-C3 as a producer and `truth_priority` also has Q-C2 (runtime-gapped), but even combining Q-C3 and Q-S1 the user can emit at most two of the four at runtime, not all four. T-012 cannot fire under the current question bank.
- remediation_path: options, in ascending scope: (a) rewrite T-012 to use OR rather than strict AND across the four sacred-value signals so any two suffice — tension-side remediation; (b) restructure Q-S1 as ranked-choice or multi-select so a single session emits more than one sacred-value signal; (c) add a paired Q-S2 whose options also emit sacred-value signals so that Q-S1 + Q-S2 together can produce the needed combinations. Any one is sufficient; all three are permitted under CC-004 scope.

---

## Signals Produced but Not Used

Tension-forward framing of the `Unused Signals` list. Each entry represents capacity the system produces but does not currently interpret.

- Conviction Card: `belonging_priority_high`, `loyalty_priority` — Q-C1 / Q-C2 produce these, but no tension interrogates belonging-as-priority or loyalty-as-priority directly.
- Pressure Card: `moderate_social_expression`, `high_conviction_expression`, `holds_internal_conviction`, `high_conviction_under_risk`, `high_social_dependence` — Q-P1 / Q-P2 / Q-P3 produce nuanced responses to social and economic pressure that no tension picks up; the Pressure Card emits more resolution than the tension library consumes.
- Formation Card: `moderate_stability` — Q-F2's middle option is an interpretive dead end.
- Context Card: `stability_present`, `moderate_load`, `low_responsibility`, `moderate_responsibility` — Q-X1 / Q-X2 produce graded load signals where only the high-end (`high_pressure_context`, `high_responsibility`) is consumed by tensions.
- Agency Card: `relational_investment`, `stability_restoration`, `exploration_drive` — Q-A2's non-creator options produce directional signals that no tension currently uses.
- Freeform: `independent_thought_signal`, `epistemic_flexibility`, `conviction_under_cost`, `cost_awareness` — the entire freeform extraction layer emits signals that the tension library does not consume. This is the largest single interpretive gap.

---

## Recommendations for CC-004

Each recommendation unblocks an already-canonical signal or tension. Scope per CC-003 §5.

1. **Implement Q-P3 in `data/questions.ts`.** Unblocks T-003 (runtime blocker) by bringing `strong_independent_conviction` and `reflective_independence` online at runtime. Also activates the `strong_independent_conviction` OR-branch of T-002, which is currently runtime-dead even though T-002 fires via its other branch.

2. **Implement Q-C4 in `data/questions.ts`.** Brings `individual_responsibility`, `systemic_responsibility`, `balanced_responsibility` online at runtime. Does not by itself unblock T-009 — see recommendation 3.

3. **Restructure Q-C4 or rewrite T-009 to handle the single-choice co-occurrence issue.** Unblocks T-009 after it is implemented at runtime. Per CC-003 §5, permitted under "restructure an existing canonical question to enable co-occurrence" or "rewrite a canonical tension's signal requirements to OR-semantics".

4. **Implement Q-C2 in `data/questions.ts`.** Brings `loyalty_priority` (currently unused) online at runtime and adds a second runtime producer for `truth_priority`, reducing the Q-S1 bottleneck that currently forces T-007 and T-012 to compete for the same Q-S1 choice.

5. **Restructure Q-S1 or rewrite T-012.** Unblocks T-012 (question-design blocker). The three permitted options — rewrite T-012 to OR-semantics, restructure Q-S1 as ranked/multi-select, or add a Q-S2 that also emits sacred-value signals — are all in scope per CC-003 §5.

6. **Add the `cost_awareness` branch to the runtime freeform extractor in `lib/identityEngine.ts`.** Aligns runtime extraction with canon — `cost_awareness` is canonically assigned to Q-I3 but not currently emitted. Permitted per CC-003 §5 ("add the missing branch to the runtime freeform extractor for a canonically-assigned signal").

7. **Canon-side remediation for T-004.** Either add a question whose `signals:` block emits at least one of `institutional_trust | institutional_skepticism | institutional_distrust`, or rewrite T-004's right side to reference canonically-produced signals. Permitted per CC-003 §5 ("add a question whose signals are already referenced by a canonical tension").

---

## Risks / Anomalies

- **Q-P3 options/signals mismatch.** `question-bank-v1.md` Q-P3 lists four options ("Assume you're wrong", "Doubt yourself", "Re-examine carefully", "Hold your position") but only three signals (`high_social_dependence`, `reflective_independence`, `strong_independent_conviction`). This violates `signal-mapping-rule.md` ("every answer option must map explicitly to one or more signal_ids"). It is also suggestive: "Doubt yourself" reads as a natural producer of `doubt_self_when_respected_people_disagree` — the exact dead-reference signal T-003 names. The canon likely intended a 4-signal block that was never completed. Flagging as a canon-internal inconsistency; resolving is out of CC-003 scope but would turn `doubt_self_when_respected_people_disagree` from `pending` to `active` when Q-P3 is fixed and implemented.

- **T-009 is a latent double-blocker.** It is correctly classified as a runtime blocker today, but implementing Q-C4 alone will not unblock it — the single-choice structure of Q-C4 prevents the required AND combination. Any plan that treats Q-C4 implementation as sufficient for T-009 will be surprised; recommendation 3 must accompany recommendation 2.

- **T-002 has a runtime-dead OR-branch.** `lib/identityEngine.ts` references `strong_independent_conviction` on T-002's left OR-branch. Because Q-P3 is not implemented in code, that branch never contributes to T-002 at runtime; T-002 currently fires only via `truth_priority_high`. This is not a bug — the branch becomes live the moment Q-P3 is added — but it is runtime-dead code today.

- **Freeform layer is currently orphaned.** All four freeform-extracted signals (`independent_thought_signal`, `epistemic_flexibility`, `conviction_under_cost`, `cost_awareness`) are `unused`. The entire freeform input layer contributes zero tension activations today. The system collects rich open-ended data whose interpretive cost is paid but whose interpretive benefit does not yet land anywhere. This is the largest gap the inventory surfaced and probably deserves a dedicated CC.

- **No entry is simultaneously `pending` and `unused`.** No signal in the current canon is both tension-referenced-without-a-question AND question-emitted-without-a-tension. The taxonomy applies cleanly. If a future canon change introduces such a case, this section should be revisited under CC-003 §1.
