# Signal Library v1

## CC-054 amendment (2026-05-01) — Composite-read signals

`peace_priority` and `faith_priority` are **composite-read signals**: their user-facing prose composes with cross-signals rather than rendering verbatim. The signal IDs themselves stay canonical and rank-aware (Q-S1 / Q-S2 ranking persists unchanged); the prose surface in the Compass card body reads cross-signals from Q-C4 attribution, Q-X3 institutional trust, Q-X4 personal trust, Q-Stakes1, and the Compass top portfolio to disambiguate which register of peace / faith operates for a given user.

**Peace disambiguation** (4 registers + fallback): moral / structural / relational / surface — see `result-writing-canon.md § Rule 10` for the full prose templates and predicate logic. Rendered in `lib/identityEngine.ts § getPeaceRegister`; surface field is `FullSwotOutput.peace_register_prose`.

**Faith disambiguation** (two-layer Shape + Texture): Layer 1 composes attribution + institutional + relational sub-prose into a single paragraph naming *what kind of faith*. Layer 2 fires top 1-2 of 5 Texture register-class disambiguators (moral architecture / living tension / hope in reconciliation / resistance to nihilism / institutional loyalty) naming *how faith operates*. See `result-writing-canon.md § Rule 11` for the full architecture. Rendered in `lib/identityEngine.ts § getFaithShape + getFaithTexture + composeFaithProse`; surface field is `FullSwotOutput.faith_register_prose`.

**Silent unless ranked top:** Both helpers return `null` when the corresponding sacred value isn't in the user's Compass top 5. The render layer omits the prose block — users who didn't rank Peace / Faith highly see no register frame imposed on them.

**Architectural pattern:** This composite-read approach is the canonical resolution for ambiguous Compass values. Future ambiguous values (`loyalty_priority` to-whom-for-what; `freedom_priority` autonomy-from-what; etc.) follow the same pattern when flagged for similar treatment.

---

## CC-043 amendment (2026-04-29) — Q-Stakes1 architectural cleanup

CC-043 corrects three Q-Stakes1 architectural drift items together:

1. **`time_autonomy_stakes_priority` deleted entirely.** The CC-035 addition was a category mistake — time is the substrate that all three drive registers compete for, not a destination of drive. The signal is removed from `SIGNAL_DESCRIPTIONS` (lib/identityEngine.ts), `SIGNAL_DRIVE_TAGS` (lib/drive.ts), and `SIGNAL_OCEAN_TAGS` (lib/ocean.ts). Q-Stakes1 returns to 5 items.
2. **`job_stakes_priority` Drive tag changed from cost to compliance.** Per the *security = compliance* canon principle (see `drive-framework.md § CC-043 amendment`): security and loss-prevention are risk-mitigation variables regardless of which domain the security applies to. Career-in-loss-context is dominantly stability/security register; career-as-ambition is captured separately by `success_priority` in Q-Ambition1. Single-tag, not multi.
3. **Q-Stakes1 money-item rename.** `money_stakes_priority` stays cost-tagged but the source-question item label changes from *"Money / Financial security"* to *"Money / Wealth"* with gloss *"Your money, savings, the resources you've built."* The prior compound label overloaded cost-flavored resource with compliance-flavored security; the new label aligns with the post-CC-033 Drive cost-bucket label *"Building & wealth."*

Saved-session compatibility: pre-CC-043 sessions that ranked the no-longer-existent `time` item still load (answer data is stable); the engine's distribution-compute code ignores any item id that isn't in the questions table — the contribution simply doesn't fire. Recomputed Drive distributions reflect the new tagging.

---

## CC-037 amendment (2026-04-29) — OCEAN tagging

CC-037 introduces a derived Big-5 OCEAN distribution computed from existing signals (no new questions, no new signals). Every signal in this library now carries an OCEAN tag — one or more of `O` (Openness), `C` (Conscientiousness), `E` (Extraversion), `A` (Agreeableness), `N` (Emotional Reactivity / estimated). The authoritative tagging table lives at `lib/ocean.ts § SIGNAL_OCEAN_TAGS`; the same map is reproduced inline below for canon-doc transparency. **Multi-tagged signals split-weight 1/N across their buckets.** Empty-array tags mean "intentionally ambivalent on OCEAN" — these are explicit canon decisions, not omissions.

### Full SIGNAL → OCEAN tag map

| Signal | OCEAN tag(s) | Bucket source |
|---|---|---|
| `ni` | O | Lens (Q-T1–T8) |
| `ne` | O, E | Lens |
| `si` | C | Lens |
| `se` | E, O | Lens |
| `ti` | O, C | Lens |
| `te` | C, E | Lens |
| `fi` | A | Lens |
| `fe` | A, E | Lens |
| `freedom_priority` | O | Compass sacred (Q-S1) |
| `truth_priority` | O, C | Compass sacred |
| `stability_priority` | C | Compass sacred |
| `loyalty_priority` | A, C | Compass sacred (Q-S2) |
| `peace_priority` | A | Compass sacred (CC-028) |
| `honor_priority` | C | Compass sacred (CC-028) |
| `family_priority` | A | Compass sacred |
| `knowledge_priority` | O | Compass sacred |
| `justice_priority` | C, A | Compass sacred |
| `faith_priority` | C | Compass sacred |
| `compassion_priority` | A | Compass sacred (CC-028) |
| `mercy_priority` | A | Compass sacred (CC-028) |
| `money_stakes_priority` | C | Compass stakes (Q-Stakes1) |
| `job_stakes_priority` | C | Compass stakes |
| `close_relationships_stakes_priority` | A | Compass stakes |
| `reputation_stakes_priority` | E, C | Compass stakes |
| `health_stakes_priority` | C | Compass stakes |
| `self_spending_priority` | *(none)* | Allocation money — direction-neutral |
| `family_spending_priority` | A | Allocation money |
| `friends_spending_priority` | E, A | Allocation money |
| `social_spending_priority` | E | Allocation money |
| `nonprofits_religious_spending_priority` | A | Allocation money |
| `companies_spending_priority` | C | Allocation money |
| `building_energy_priority` | C, O | Allocation energy |
| `solving_energy_priority` | C | Allocation energy |
| `restoring_energy_priority` | C | Allocation energy |
| `caring_energy_priority` | A | Allocation energy |
| `learning_energy_priority` | O | Allocation energy |
| `enjoying_energy_priority` | O, E | Allocation energy |
| `cost_drive` | C | Drive claimed (Q-3C1) |
| `coverage_drive` | A | Drive claimed |
| `compliance_drive` | C | Drive claimed |
| `success_priority` | C, E | Drive ambition (CC-033) |
| `fame_priority` | E | Drive ambition |
| `wealth_priority` | C | Drive ambition |
| `legacy_priority` | C, O | Drive ambition |
| `government_elected_trust_priority` | C | Trust institutional (CC-031) |
| `government_services_trust_priority` | C | Trust institutional |
| `education_trust_priority` | O, C | Trust institutional |
| `nonprofits_trust_priority` | A | Trust institutional |
| `religious_trust_priority` | C | Trust institutional |
| `journalism_trust_priority` | O | Trust institutional |
| `news_organizations_trust_priority` | C | Trust institutional |
| `social_media_trust_priority` | *(none)* | Trust institutional — ambivalent |
| `small_business_trust_priority` | C | Trust institutional |
| `large_companies_trust_priority` | C | Trust institutional |
| `family_trust_priority` | A | Trust personal (Q-X4) |
| `friend_trust_priority` | A, E | Trust personal |
| `partner_trust_priority` | A | Trust personal |
| `mentor_trust_priority` | O, A | Trust personal |
| `outside_expert_trust_priority` | O | Trust personal (CC-032) |
| `own_counsel_trust_priority` | *(none)* | Trust personal — ambivalent (high-O AND high-C at once) |
| `truth_priority_high` | O, C | Conviction (Q-C1) |
| `belonging_priority_high` | A | Conviction |
| `order_priority` | C | Conviction (Q-C3) |
| `individual_responsibility_priority` | C | Gravity (Q-C4) |
| `system_responsibility_priority` | O | Gravity |
| `nature_responsibility_priority` | O | Gravity |
| `supernatural_responsibility_priority` | C | Gravity |
| `authority_responsibility_priority` | C | Gravity |
| `adapts_under_social_pressure` | A, N | Pressure (Q-P1) |
| `adapts_under_economic_pressure` | N | Pressure (Q-P2) |
| `hides_belief` | N | Pressure |
| `holds_internal_conviction` | C | Pressure |
| `high_conviction_under_risk` | C | Pressure |
| `high_conviction_expression` | E | Pressure |
| `moderate_social_expression` | *(none)* | Pressure — middle-band, ambivalent |
| `authority_trust_high` | A, C | Formation (Q-F1) |
| `authority_skepticism_moderate` | *(none)* | Formation — middle-band, ambivalent |
| `authority_distrust` | O | Formation |
| `stability_baseline_high` | C | Formation (Q-F2) |
| `moderate_stability` | *(none)* | Formation — middle-band, ambivalent |
| `chaos_exposure` | N | Formation |
| `stability_present` | C | Context (Q-X1) |
| `moderate_load` | *(none)* | Context — middle-band, ambivalent |
| `high_pressure_context` | N | Context |
| `independent_thought_signal` | O | Belief catalog (Q-I1 freeform) |
| `epistemic_flexibility` | O, A | Belief catalog |
| `conviction_under_cost` | C | Belief catalog |
| `cost_awareness` | C | Belief catalog (forward-looking — declared but not currently emitted by extractor) |

### Ambivalent signals (intentional empty tags)

The following signals are deliberately untagged on OCEAN — render as `OCEAN: none` rather than reading the absence as an oversight:

- `self_spending_priority` (direction-neutral)
- `social_media_trust_priority` (too domain-specific)
- `own_counsel_trust_priority` (high-O AND high-C at once)
- `authority_skepticism_moderate` (middle-band)
- `moderate_social_expression` (middle-band)
- `moderate_load` (middle-band)
- `moderate_stability` (middle-band)

### The Neuroticism floor architecture

CC-037's N axis uses a **weak-floor architecture**: signals that *would* index low-N (`stability_baseline_high`, `stability_present`, `holds_internal_conviction`, `high_conviction_under_risk`) are tagged C rather than as anti-N. Letting the *absence* of positive-N signals mean low Neuroticism avoids the math complexity of negative tags. See `docs/canon/ocean-framework.md` § "The Neuroticism floor problem" for the full rationale and successor-CC tuning paths.

---

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
- produced_by_questions: [Q-C4 (legacy forced version, retired in CC-009)]
- used_by_tensions: [T-009]
- implementation_status: deprecated
- notes: Deprecated in CC-009 when Q-C4 was migrated from a forced-choice 3-option question to a rank-aware 5-option question. Successor: `individual_responsibility_priority`. Still referenced by T-009 in `tension-library-v1.md`; T-009 is now formally canon-blocked until rewritten to consume the new rank-aware signals (future CC).

---

#### systemic_responsibility

- signal_id: systemic_responsibility
- description: Tends to locate responsibility for outcomes in systems.
- primary_cards: [conviction]
- produced_by_questions: [Q-C4 (legacy forced version, retired in CC-009)]
- used_by_tensions: [T-009]
- implementation_status: deprecated
- notes: Deprecated in CC-009 when Q-C4 was migrated from a forced-choice 3-option question to a rank-aware 5-option question. Successor: `system_responsibility_priority` (note the rename `systemic` → `system` for grammar consistency with the new ranked option label). Still referenced by T-009 in `tension-library-v1.md`; T-009 is now formally canon-blocked until rewritten to consume the new rank-aware signals (future CC).

---

#### balanced_responsibility

- signal_id: balanced_responsibility
- description: Tends to distribute responsibility between individual and system.
- primary_cards: [conviction]
- produced_by_questions: [Q-C4 (legacy forced version, retired in CC-009)]
- used_by_tensions: [T-009]
- implementation_status: deprecated
- notes: Deprecated in CC-009 when Q-C4 was migrated from a forced-choice 3-option question to a rank-aware 5-option question. Successor: — (no direct successor; "balanced" was a 3-option forced-choice construct, in ranked form expressed structurally by two top-2 ranks of `individual_responsibility_priority` and `system_responsibility_priority`). Still referenced by T-009 in `tension-library-v1.md`; T-009 is now formally canon-blocked until rewritten to consume the new rank-aware signals (future CC).

---

#### individual_responsibility_priority

- signal_id: individual_responsibility_priority
- description: Ranks the individual — the person who acted — as the locus of responsibility when things go wrong.
- primary_cards: [conviction]
- produced_by_questions: [Q-C4]
- used_by_tensions: —
- rank_aware: true
- implementation_status: unused
- notes: Introduced by Q-C4 ranking in CC-009. Rank-aware: emitted with `rank` metadata per `signal-mapping-rule.md` § Ranking Question Signal Emission. No tension consumes this signal in v1; T-009 rewrite to use the new rank-aware signals is future-CC scope. Successor to deprecated `individual_responsibility`.

---

#### system_responsibility_priority

- signal_id: system_responsibility_priority
- description: Ranks the system — structures and incentives — as the locus of responsibility when things go wrong.
- primary_cards: [conviction]
- produced_by_questions: [Q-C4]
- used_by_tensions: —
- rank_aware: true
- implementation_status: unused
- notes: Introduced by Q-C4 ranking in CC-009. Rank-aware: emitted with `rank` metadata per `signal-mapping-rule.md` § Ranking Question Signal Emission. No tension consumes this signal in v1; T-009 rewrite to use the new rank-aware signals is future-CC scope. Successor to deprecated `systemic_responsibility` (renamed `systemic` → `system` for grammar consistency with the ranked option label).

---

#### nature_responsibility_priority

- signal_id: nature_responsibility_priority
- description: Ranks nature — chance, biology, the way things just are — as the locus of responsibility when things go wrong.
- primary_cards: [conviction]
- produced_by_questions: [Q-C4]
- used_by_tensions: —
- rank_aware: true
- implementation_status: unused
- notes: Introduced by Q-C4 ranking in CC-009. Rank-aware: emitted with `rank` metadata per `signal-mapping-rule.md` § Ranking Question Signal Emission. No tension consumes this signal in v1; T-009 rewrite to use the new rank-aware signals is future-CC scope. New attribution category — no legacy predecessor.

---

#### supernatural_responsibility_priority

- signal_id: supernatural_responsibility_priority
- description: Ranks the supernatural — divine will, fate, or what's beyond human reach — as the locus of responsibility when things go wrong.
- primary_cards: [conviction]
- produced_by_questions: [Q-C4]
- used_by_tensions: —
- rank_aware: true
- implementation_status: unused
- notes: Introduced by Q-C4 ranking in CC-009. Rank-aware: emitted with `rank` metadata per `signal-mapping-rule.md` § Ranking Question Signal Emission. No tension consumes this signal in v1; T-009 rewrite to use the new rank-aware signals is future-CC scope. New attribution category — no legacy predecessor.

---

#### authority_responsibility_priority

- signal_id: authority_responsibility_priority
- description: Ranks authority — the people in charge of the system, not the system itself — as the locus of responsibility when things go wrong.
- primary_cards: [conviction]
- produced_by_questions: [Q-C4]
- used_by_tensions: —
- rank_aware: true
- implementation_status: unused
- notes: Introduced by Q-C4 ranking in CC-009. Rank-aware: emitted with `rank` metadata per `signal-mapping-rule.md` § Ranking Question Signal Emission. No tension consumes this signal in v1; T-009 rewrite to use the new rank-aware signals is future-CC scope. The Authority gloss is load-bearing — distinct from System (the people in charge vs. the structure itself). Distinct from the Formation-card `authority_*` family (`authority_trust_high`, `authority_skepticism_moderate`, `authority_distrust`), which measure formative trust in authority figures rather than blame attribution. New attribution category — no legacy predecessor.

---

#### independent_thought_signal

- signal_id: independent_thought_signal
- description: Tends to hold beliefs that differ from those around them.
- primary_cards: [conviction]
- produced_by_questions: [Q-I1]
- used_by_tensions: —
- implementation_status: active
- notes: Heuristic extraction from Q-I1 freeform content. Preserved for v0 → v1 LLM-substitution continuity per CC-017 § Item 1. Q-I1 stays freeform as the belief anchor; the four catalog signals (this one + epistemic_flexibility + conviction_under_cost + cost_awareness) continue to fire from Q-I1 content via `extractFreeformSignals`. The `BeliefUnderTension` object is constructed from a separate, structured-source path (Q-I2 / Q-I3 multiselect_derived selections) and lives on a different abstraction layer.

---

#### epistemic_flexibility

- signal_id: epistemic_flexibility
- description: Open to changing beliefs when presented with evidence.
- primary_cards: [conviction]
- produced_by_questions: [Q-I1]
- used_by_tensions: —
- implementation_status: active
- notes: Heuristic extraction from Q-I1 freeform content (CC-017 — previously fired from Q-I2 freeform; Q-I2 is now `multiselect_derived` so the keyword extractor no longer routes through it). Preserved for v0 → v1 LLM-substitution continuity per CC-017 § Item 1.

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
- produced_by_questions: [Q-I1]
- used_by_tensions: —
- strengthens_tensions: [T-001, T-002]
- implementation_status: active
- notes: Heuristic extraction from Q-I1 freeform content (CC-017 — previously fired from Q-I3; Q-I3 is now `multiselect_derived`). At runtime emitted by the keyword extractor in `lib/identityEngine.ts` on keywords `lost | cost | risk | job | friends`. Declared as a strengthener of T-001 / T-002. Preserved for v0 → v1 LLM-substitution continuity per CC-017 § Item 1.

---

#### cost_awareness

- signal_id: cost_awareness
- description: Retains awareness of what a belief has cost or could cost.
- primary_cards: [pressure]
- produced_by_questions: [Q-I1]
- used_by_tensions: —
- implementation_status: unused
- notes: Canonically reassigned from Q-I3 to Q-I1 in CC-017 (Q-I3 is now `multiselect_derived`). The runtime freeform extractor in `lib/identityEngine.ts` does NOT currently emit `cost_awareness` — only `conviction_under_cost` is produced from cost-keyword matches. Canonical-but-runtime-dead, same status as before CC-017. Per CC-017 § Item 1, `extractFreeformSignals` stays unchanged in body; adding the missing `cost_awareness` branch is a future-CC concern. Preserved here for v0 → v1 LLM-substitution continuity.

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

#### government_trust_priority — DEPRECATED in CC-031

- signal_id: government_trust_priority
- description: (DEPRECATED) Ranks federal, state, and local public bodies as a trusted institutional source.
- primary_cards: [context]
- produced_by_questions: [Q-X3] (legacy; question retired in CC-031)
- used_by_tensions: —
- rank_aware: true
- implementation_status: deprecated_in_CC-031
- notes: Retired in CC-031. The legacy single 5-item Q-X3 averaged elected-government and on-the-ground government services into one signal — CC-031 splits it into `government_elected_trust_priority` + `government_services_trust_priority`. Pre-CC-031 saved sessions still carry this signal ID; renderers degrade gracefully (engine prose looking up a deprecated ID via SIGNAL_DESCRIPTIONS gets `undefined` and falls through to the signal_id string).

---

#### press_trust_priority — DEPRECATED in CC-031

- signal_id: press_trust_priority
- description: (DEPRECATED) Ranks newsrooms, journalists, and information outlets as a trusted institutional source.
- primary_cards: [context]
- produced_by_questions: [Q-X3] (legacy; question retired in CC-031)
- used_by_tensions: —
- rank_aware: true
- implementation_status: deprecated_in_CC-031
- notes: Retired in CC-031. The legacy form lumped craft-level journalism and institutional-level news organizations into one signal — CC-031 splits it into `journalism_trust_priority` + `news_organizations_trust_priority`. The two can move opposite directions in real users.

---

#### companies_trust_priority — DEPRECATED in CC-031

- signal_id: companies_trust_priority
- description: (DEPRECATED) Ranks businesses and workplaces as a trusted institutional source.
- primary_cards: [context]
- produced_by_questions: [Q-X3] (legacy; question retired in CC-031)
- used_by_tensions: —
- rank_aware: true
- implementation_status: deprecated_in_CC-031
- notes: Retired in CC-031. CC-031 splits Companies into `small_business_trust_priority` + `large_companies_trust_priority` — small/private/closely-held businesses pull different priors than large/public/publicly-traded companies.

---

#### education_trust_priority

- signal_id: education_trust_priority
- description: Ranks schools, colleges, and the credentialing they grant as a trusted public-mission institutional source.
- primary_cards: [context]
- produced_by_questions: [Q-X3-public]
- used_by_tensions: —
- used_by_cross_card_patterns: [knowledge_vs_education_trust]
- rank_aware: true
- implementation_status: active
- notes: Introduced by Q-X3 in CC-008; **preserved unchanged** through CC-031 (the only legacy Q-X3 signal that survives the multi-stage restructure). Now produced by Q-X3-public (5-item parent ranking). Consumed by the `knowledge_vs_education_trust` cross-card pattern (CC-022b).

---

#### nonprofits_religious_trust_priority — DEPRECATED in CC-031

- signal_id: nonprofits_religious_trust_priority
- description: (DEPRECATED) Ranks charities, NGOs, churches, and voluntary missions as a trusted institutional source.
- primary_cards: [context]
- produced_by_questions: [Q-X3] (legacy; question retired in CC-031)
- used_by_tensions: —
- rank_aware: true
- implementation_status: deprecated_in_CC-031
- notes: Retired in CC-031. The legacy form combined civil-society non-profits and faith communities into one signal; CC-031 splits into `nonprofits_trust_priority` + `religious_trust_priority`. Per `drive-framework.md` and CC-026's tagging table, both new signals tag to the Compliance drive bucket (same register as the legacy combined form).

---

#### government_elected_trust_priority

- signal_id: government_elected_trust_priority
- description: Ranks elected representatives, legislatures, and the political apparatus as a trusted public-mission institutional source.
- primary_cards: [context]
- produced_by_questions: [Q-X3-public]
- used_by_tensions: —
- rank_aware: true
- implementation_status: active
- notes: Introduced in CC-031. One of the two splits of the retired `government_trust_priority`. Tags to the Compliance drive bucket (per `drive-framework.md`). No tension consumes this signal in v1; future trust tensions may distinguish elected-government trust from services trust.

---

#### government_services_trust_priority

- signal_id: government_services_trust_priority
- description: Ranks the on-the-ground services of government — public schools, DMV, water, sanitation, local police — as a trusted public-mission institutional source.
- primary_cards: [context]
- produced_by_questions: [Q-X3-public]
- used_by_tensions: —
- rank_aware: true
- implementation_status: active
- notes: Introduced in CC-031. One of the two splits of the retired `government_trust_priority`. Often clusters opposite from `government_elected_trust_priority` in real users — high services trust + low elected trust is a common pattern. Tags to Compliance drive bucket.

---

#### nonprofits_trust_priority

- signal_id: nonprofits_trust_priority
- description: Ranks charities, NGOs, and voluntary missions outside religious frame as a trusted public-mission institutional source.
- primary_cards: [context]
- produced_by_questions: [Q-X3-public]
- used_by_tensions: —
- rank_aware: true
- implementation_status: active
- notes: Introduced in CC-031. One of the two splits of the retired `nonprofits_religious_trust_priority`. Tags to Compliance drive bucket.

---

#### religious_trust_priority

- signal_id: religious_trust_priority
- description: Ranks churches, faith communities, and explicitly religious missions as a trusted public-mission institutional source.
- primary_cards: [context]
- produced_by_questions: [Q-X3-public]
- used_by_tensions: —
- rank_aware: true
- implementation_status: active
- notes: Introduced in CC-031. One of the two splits of the retired `nonprofits_religious_trust_priority`. Future cross-card patterns may join this with `faith_priority` (sacred-card) for a Faith × Religious-trust read. Tags to Compliance drive bucket.

---

#### journalism_trust_priority

- signal_id: journalism_trust_priority
- description: Ranks individual journalists and the discipline of journalistic craft as a trusted information-and-commercial institutional source.
- primary_cards: [context]
- produced_by_questions: [Q-X3-information-and-commercial]
- used_by_tensions: —
- rank_aware: true
- implementation_status: active
- notes: Introduced in CC-031. Craft-level read of the press domain — one of two splits of the retired `press_trust_priority`. Often clusters opposite from `news_organizations_trust_priority` (high journalism trust + low news-organizations trust = trust in the work, not the institutions distributing it). Tags to Compliance drive bucket.

---

#### news_organizations_trust_priority

- signal_id: news_organizations_trust_priority
- description: Ranks newsrooms, outlets, and the institutions that distribute and shape journalism as a trusted information-and-commercial institutional source.
- primary_cards: [context]
- produced_by_questions: [Q-X3-information-and-commercial]
- used_by_tensions: —
- rank_aware: true
- implementation_status: active
- notes: Introduced in CC-031. Institutional-distribution read of the press domain — the second split of the retired `press_trust_priority`. Tags to Compliance drive bucket.

---

#### social_media_trust_priority

- signal_id: social_media_trust_priority
- description: Ranks social media platforms — algorithmic and influence-mediated information surfaces — as a trusted information-and-commercial institutional source.
- primary_cards: [context]
- produced_by_questions: [Q-X3-information-and-commercial]
- used_by_tensions: —
- rank_aware: true
- implementation_status: active
- notes: Introduced in CC-031. The category the legacy 5-item Q-X3 omitted entirely. Per the v2.5 memo: *"Any institutional-trust reading that omits it leaves a hole that anyone testing the model will immediately notice."* Tags to Compliance drive bucket.

---

#### small_business_trust_priority

- signal_id: small_business_trust_priority
- description: Ranks small, private, closely-held businesses as a trusted information-and-commercial institutional source.
- primary_cards: [context]
- produced_by_questions: [Q-X3-information-and-commercial]
- used_by_tensions: —
- rank_aware: true
- implementation_status: active
- notes: Introduced in CC-031. One of two splits of the retired `companies_trust_priority`. Tags to Compliance drive bucket.

---

#### large_companies_trust_priority

- signal_id: large_companies_trust_priority
- description: Ranks large, public, publicly-traded companies as a trusted information-and-commercial institutional source.
- primary_cards: [context]
- produced_by_questions: [Q-X3-information-and-commercial]
- used_by_tensions: —
- rank_aware: true
- implementation_status: active
- notes: Introduced in CC-031. The second split of the retired `companies_trust_priority`. Often clusters opposite from `small_business_trust_priority` in real users (high small-business trust + low large-companies trust is a common pattern). Tags to Compliance drive bucket.

---

#### partner_trust_priority

- signal_id: partner_trust_priority
- description: Ranks a spouse or partner as a trusted personal source for hard truth.
- primary_cards: [context]
- produced_by_questions: [Q-X4]
- used_by_tensions: —
- rank_aware: true
- implementation_status: unused
- notes: Introduced by Q-X4 in CC-008. Rank-aware: emitted with `rank` metadata per `signal-mapping-rule.md` § Ranking Question Signal Emission. No tension consumes this signal in v1.

---

#### friend_trust_priority

- signal_id: friend_trust_priority
- description: Ranks a close friend as a trusted personal source for hard truth.
- primary_cards: [context]
- produced_by_questions: [Q-X4]
- used_by_tensions: —
- rank_aware: true
- implementation_status: unused
- notes: Introduced by Q-X4 in CC-008. Rank-aware: emitted with `rank` metadata per `signal-mapping-rule.md` § Ranking Question Signal Emission. No tension consumes this signal in v1.

---

#### family_trust_priority

- signal_id: family_trust_priority
- description: Ranks family — parents, siblings, or chosen kin — as a trusted personal source for hard truth.
- primary_cards: [context]
- produced_by_questions: [Q-X4]
- used_by_tensions: —
- rank_aware: true
- implementation_status: unused
- notes: Introduced by Q-X4 in CC-008. Distinct from `family_priority` (sacred-card; ranks family as a sacred value). This signal ranks family as a trusted source for hard truth. Rank-aware: emitted with `rank` metadata per `signal-mapping-rule.md` § Ranking Question Signal Emission. No tension consumes this signal in v1.

---

#### mentor_trust_priority

- signal_id: mentor_trust_priority
- description: Ranks a mentor or advisor as a trusted personal source for hard truth.
- primary_cards: [context]
- produced_by_questions: [Q-X4]
- used_by_tensions: —
- rank_aware: true
- implementation_status: unused
- notes: Introduced by Q-X4 in CC-008. Rank-aware: emitted with `rank` metadata per `signal-mapping-rule.md` § Ranking Question Signal Emission. No tension consumes this signal in v1.

---

#### own_counsel_trust_priority

- signal_id: own_counsel_trust_priority
- description: Ranks own judgment as the trusted source when no other source feels right.
- primary_cards: [context]
- produced_by_questions: [Q-X4-chosen] (was Q-X4 pre-CC-032)
- used_by_tensions: —
- used_by_belief_heuristics: [deriveEpistemicPostureFromQI2 "guarded" branch]
- rank_aware: true
- implementation_status: active
- notes: Introduced by Q-X4 in CC-008; preserved through CC-032's multi-stage Q-X4 restructure (now produced by Q-X4-chosen, the selection-based parent). Special-cased in `lib/beliefHeuristics.ts § deriveEpistemicPostureFromQI2`: when Q-I2 selections include exactly own_counsel from Q-X4-cross and no Q-X3-cross institutional source, the engine emits `epistemic_posture: "guarded"`. Tagged `"exclude"` in the Drive framework's tagging table — self-counsel is not an external drive.

---

#### outside_expert_trust_priority

- signal_id: outside_expert_trust_priority
- description: Ranks an outside expert — therapist, doctor, lawyer, coach, financial advisor, or clergy member — as a trusted personal source for hard truth.
- primary_cards: [context]
- produced_by_questions: [Q-X4-chosen]
- used_by_tensions: —
- rank_aware: true
- implementation_status: active
- notes: Introduced in CC-032. The trusted-professional category the legacy 5-item Q-X4 omitted entirely — a user with strong outside-expert posture + weak family/partner posture is a real and common pattern that the legacy form forced into "mentor or advisor" or "own counsel." The label "outside expert" is canonical (not "professional" / "expert" / "advisor"); selected to be inclusive across the trusted-professional category without implying credentialed authority above other categories. Tags to the Coverage drive bucket per `drive-framework.md` — chosen-for-relationship, even when transactional.

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

#### peace_priority

- signal_id: peace_priority
- description: Holds peace — interior groundedness, the calm that holds even when conditions don't — as a sacred value.
- primary_cards: [sacred]
- produced_by_questions: [Q-S1]
- used_by_tensions: []
- rank_aware: true
- implementation_status: active
- notes: Introduced by Q-S1 in CC-028 (Compass values expansion 4 → 6 items). Rank-aware per `signal-mapping-rule.md`. Participates in `getTopCompassValues` via `SACRED_IDS` (and in compass-rank computations via `SACRED_PRIORITY_SIGNAL_IDS`). Q-S1's embodied / qualities-of-self register; pairs naturally with `stability_priority`.

---

#### honor_priority

- signal_id: honor_priority
- description: Holds honor — keeping faith with your word and your standing, even when the breach would go unnoticed — as a sacred value.
- primary_cards: [sacred]
- produced_by_questions: [Q-S1]
- used_by_tensions: []
- rank_aware: true
- implementation_status: active
- notes: Introduced by Q-S1 in CC-028. Rank-aware. Q-S1's embodied / qualities-of-self register; pairs naturally with `truth_priority`.

---

#### compassion_priority

- signal_id: compassion_priority
- description: Holds compassion — being moved by what hurts in others — as a sacred value.
- primary_cards: [sacred]
- produced_by_questions: [Q-S2]
- used_by_tensions: []
- rank_aware: true
- implementation_status: active
- notes: Introduced by Q-S2 in CC-028. Rank-aware. Q-S2's external-pulls / orientation-toward-others register; pairs naturally with `family_priority` (relational orientation).

---

#### mercy_priority

- signal_id: mercy_priority
- description: Holds mercy — softening what justice would let you claim — as a sacred value.
- primary_cards: [sacred]
- produced_by_questions: [Q-S2]
- used_by_tensions: []
- rank_aware: true
- implementation_status: active
- notes: Introduced by Q-S2 in CC-028. Rank-aware. Q-S2's external-pulls register; pairs naturally with `justice_priority` (the justice/mercy axis).

---

#### money_stakes_priority

- signal_id: money_stakes_priority
- description: Ranks money / wealth as among the most important things to protect from loss.
- primary_cards: [sacred]
- produced_by_questions: [Q-Stakes1 — "Money / Wealth" item, post-CC-043]
- used_by_tensions: []
- rank_aware: true
- implementation_status: active
- notes: Introduced by Q-Stakes1 in CC-024 (Compass card extension — concrete-stakes register). Rank-aware per `signal-mapping-rule.md`. Consumed by Q-I3's derivation from the user's top Q-Stakes1 items. Drive tag: cost (Money / Wealth is the resource frame; the prior compound label "Money / Financial security" was an overload that CC-043 also fixed at the question-label level — see drive-framework.md § CC-043 amendment).

---

#### job_stakes_priority

- signal_id: job_stakes_priority
- description: Ranks job / career — professional standing — as among the most important things to protect from loss.
- primary_cards: [sacred]
- produced_by_questions: [Q-Stakes1]
- used_by_tensions: []
- rank_aware: true
- implementation_status: active
- notes: Introduced by Q-Stakes1 in CC-024. Rank-aware. Consumed by Q-I3's derivation. Drive tag: compliance (post-CC-043; previously cost). Career-in-loss-context is dominantly stability/security register per the *security = compliance* canon principle; career-as-ambition is captured separately by `success_priority` in Q-Ambition1. Single-tag, not multi.

---

#### close_relationships_stakes_priority

- signal_id: close_relationships_stakes_priority
- description: Ranks close relationships — partner, family, closest friends — as among the most important things to protect from loss.
- primary_cards: [sacred]
- produced_by_questions: [Q-Stakes1]
- used_by_tensions: []
- rank_aware: true
- implementation_status: active
- notes: Introduced by Q-Stakes1 in CC-024. Rank-aware. Consumed by Q-I3's derivation.

---

#### reputation_stakes_priority

- signal_id: reputation_stakes_priority
- description: Ranks reputation — how others see you, your standing in your community — as among the most important things to protect from loss.
- primary_cards: [sacred]
- produced_by_questions: [Q-Stakes1]
- used_by_tensions: []
- rank_aware: true
- implementation_status: active
- notes: Introduced by Q-Stakes1 in CC-024. Rank-aware. Consumed by Q-I3's derivation.

---

#### health_stakes_priority

- signal_id: health_stakes_priority
- description: Ranks physical safety / health as among the most important things to protect from loss.
- primary_cards: [sacred]
- produced_by_questions: [Q-Stakes1]
- used_by_tensions: []
- rank_aware: true
- implementation_status: active
- notes: Introduced by Q-Stakes1 in CC-024. Rank-aware. Consumed by Q-I3's derivation.

---

### Path · Drive Card (CC-026)

The three drive signals are the **claimed** half of the claimed-vs-revealed why-axis introduced in CC-026. Bound by `drive-framework.md`'s vocabulary discipline: the framework terms are engineer-facing only; user-facing prose uses human-language phrases. **Not added to `SACRED_PRIORITY_SIGNAL_IDS` or `SACRED_IDS`** — drive is its own register, and conflating with sacred-value math would corrupt compass-ranking computations.

#### cost_drive

- signal_id: cost_drive
- description: Claims building wealth and standing — what you build, accumulate, and become known for — as the drive that most often guides decisions.
- primary_cards: [role]
- produced_by_questions: [Q-3C1]
- used_by_tensions: [T-D1]
- rank_aware: true
- implementation_status: active
- notes: Introduced by Q-3C1 in CC-026. Captures the user's *claimed* drive (Cost-drive). Excluded from the revealed-drive distribution (`SIGNAL_DRIVE_TAGS["cost_drive"] = "exclude"`) so claimed signals don't double-count into the revealed distribution. **CC-033 amendment**: description rewritten to match the cost-bucket relabel from "financial security" to "building & wealth" (the prior phrasing conflated cost-as-ambition with compliance-as-security).

#### coverage_drive

- signal_id: coverage_drive
- description: Claims caring for those closest — people, relationships, commitments — as the drive that most often guides decisions.
- primary_cards: [role]
- produced_by_questions: [Q-3C1]
- used_by_tensions: [T-D1]
- rank_aware: true
- implementation_status: active
- notes: Introduced by Q-3C1 in CC-026. Captures the user's *claimed* drive (Coverage-drive). Excluded from the revealed-drive distribution.

#### compliance_drive

- signal_id: compliance_drive
- description: Claims managing risk and uncertainty — guarding against loss, protecting what could be taken — as the drive that most often guides decisions.
- primary_cards: [role]
- produced_by_questions: [Q-3C1]
- used_by_tensions: [T-D1]
- rank_aware: true
- implementation_status: active
- notes: Introduced by Q-3C1 in CC-026. Captures the user's *claimed* drive (Compliance-drive). Excluded from the revealed-drive distribution.

---

### Path · Ambition Card (CC-033)

Four pursuit-class signals introduced by Q-Ambition1, refining the *revealed* measurement inside the cost bucket of the Drive framework. All four tag `"cost"` in `lib/drive.ts § SIGNAL_DRIVE_TAGS`. None are multi-tagged. **Not added to `SACRED_PRIORITY_SIGNAL_IDS` or `SACRED_IDS`** — they are Drive-bucket signals, not sacred-value signals. The architectural rule from `lib/drive.ts:10–14` (drive signals stay outside sacred priority) applies.

#### success_priority

- signal_id: success_priority
- description: Pulls toward success — hitting the goals you set, accomplishing what you set out to do — when imagining what winning looks like.
- primary_cards: [role]
- produced_by_questions: [Q-Ambition1]
- used_by_tensions: —
- rank_aware: true
- implementation_status: active
- notes: Introduced in CC-033. Achievement orientation is ambition-class; tagged `"cost"`. Future cross-card patterns may join `success_priority` with high-rank `building_energy_priority` for an "execution-orientation" read.

#### fame_priority

- signal_id: fame_priority
- description: Pulls toward fame — recognition, attention, reach beyond the immediate circle — when imagining what winning looks like.
- primary_cards: [role]
- produced_by_questions: [Q-Ambition1]
- used_by_tensions: —
- rank_aware: true
- implementation_status: active
- notes: Introduced in CC-033. Recognition-seeking is ambition-class; tagged `"cost"`. Direction of pull is self-elevation, not other-care — which is why this is *not* tagged coverage despite fame implying others.

#### wealth_priority

- signal_id: wealth_priority
- description: Pulls toward wealth — accumulation as an end, money and assets built and held — when imagining what winning looks like.
- primary_cards: [role]
- produced_by_questions: [Q-Ambition1]
- used_by_tensions: —
- rank_aware: true
- implementation_status: active
- notes: Introduced in CC-033. Wealth-as-end is the canonical cost axis; tagged `"cost"`. Distinct from `money_stakes_priority` (which measures *fear of losing* money — Q-Stakes1, compliance-adjacent) and from `self_spending_priority` (which measures *flow toward self* — Q-S3-close). `wealth_priority` measures *pursuit of accumulation as a goal*.

#### legacy_priority

- signal_id: legacy_priority
- description: Pulls toward legacy — lasting impact, what outlives you in the world or in others — when imagining what winning looks like.
- primary_cards: [role]
- produced_by_questions: [Q-Ambition1]
- used_by_tensions: —
- rank_aware: true
- implementation_status: active
- notes: Introduced in CC-033. What-outlives-you is a building-class drive; tagged `"cost"` (single-tag, not multi). Considered multi-tagging with coverage because legacy can be relational; rejected — relational legacy is already captured by `family_priority` and family-class signals, so multi-tagging would double-weight. If browser smoke later reveals the relational dimension of legacy needs explicit weighting, surface as a successor CC.

---

### Temperament Card

#### ni

- signal_id: ni
- description: Pattern synthesis directed inward — consolidating disparate inputs over time into a single convergent interpretation of where something is going.
- primary_cards: [temperament]
- produced_by_questions: [Q-T1, Q-T2, Q-T3, Q-T4]
- used_by_tensions: —
- rank_aware: true
- implementation_status: unused
- notes: Introduced in CC-010 from `temperament-framework.md` § 9 Canonical Rule 1. Rank-aware: emitted with `rank` metadata per `signal-mapping-rule.md` § Ranking Question Signal Emission. Each function appears across four Q-T questions in its block (perceiving for Ni/Ne/Si/Se; judging for Ti/Te/Fi/Fe). No tension consumes this signal in v1; the four hooks named in `temperament-framework.md` § 7 (Temperament × Pressure inferior grip; Temperament × Agency native vs. current; Temperament × Context; Temperament × Role) are deferred. Function-stack aggregation logic is also deferred to a future CC.

---

#### ne

- signal_id: ne
- description: Pattern generation directed outward — surfacing multiple parallel possibilities and connections from a single input.
- primary_cards: [temperament]
- produced_by_questions: [Q-T1, Q-T2, Q-T3, Q-T4]
- used_by_tensions: —
- rank_aware: true
- implementation_status: unused
- notes: Introduced in CC-010 from `temperament-framework.md` § 9 Canonical Rule 1. Rank-aware per `signal-mapping-rule.md` § Ranking Question Signal Emission. No tension consumes this signal in v1; tension hooks deferred per `temperament-framework.md` § 7. Function-stack aggregation deferred.

---

#### si

- signal_id: si
- description: Sensory recall directed inward — referencing prior verified experience and precedent before acting.
- primary_cards: [temperament]
- produced_by_questions: [Q-T1, Q-T2, Q-T3, Q-T4]
- used_by_tensions: —
- rank_aware: true
- implementation_status: unused
- notes: Introduced in CC-010 from `temperament-framework.md` § 9 Canonical Rule 1. Rank-aware per `signal-mapping-rule.md` § Ranking Question Signal Emission. No tension consumes this signal in v1; tension hooks deferred per `temperament-framework.md` § 7. Function-stack aggregation deferred.

---

#### se

- signal_id: se
- description: Sensory engagement directed outward — taking in the present concrete situation and acting on what's available now.
- primary_cards: [temperament]
- produced_by_questions: [Q-T1, Q-T2, Q-T3, Q-T4]
- used_by_tensions: —
- rank_aware: true
- implementation_status: unused
- notes: Introduced in CC-010 from `temperament-framework.md` § 9 Canonical Rule 1. Rank-aware per `signal-mapping-rule.md` § Ranking Question Signal Emission. No tension consumes this signal in v1; tension hooks deferred per `temperament-framework.md` § 7. Function-stack aggregation deferred.

---

#### ti

- signal_id: ti
- description: Logical analysis directed inward — testing reasoning against an internal framework of consistency and definition.
- primary_cards: [temperament]
- produced_by_questions: [Q-T5, Q-T6, Q-T7, Q-T8]
- used_by_tensions: —
- rank_aware: true
- implementation_status: unused
- notes: Introduced in CC-010 from `temperament-framework.md` § 9 Canonical Rule 1. Rank-aware per `signal-mapping-rule.md` § Ranking Question Signal Emission. No tension consumes this signal in v1; tension hooks deferred per `temperament-framework.md` § 7. Function-stack aggregation deferred.

---

#### te

- signal_id: te
- description: Logical organization directed outward — structuring effort and evidence against external proof and operational result.
- primary_cards: [temperament]
- produced_by_questions: [Q-T5, Q-T6, Q-T7, Q-T8]
- used_by_tensions: —
- rank_aware: true
- implementation_status: unused
- notes: Introduced in CC-010 from `temperament-framework.md` § 9 Canonical Rule 1. Rank-aware per `signal-mapping-rule.md` § Ranking Question Signal Emission. No tension consumes this signal in v1; tension hooks deferred per `temperament-framework.md` § 7. Function-stack aggregation deferred.

---

#### fi

- signal_id: fi
- description: Value discernment directed inward — testing options against personal moral authenticity and integrity.
- primary_cards: [temperament]
- produced_by_questions: [Q-T5, Q-T6, Q-T7, Q-T8]
- used_by_tensions: —
- rank_aware: true
- implementation_status: unused
- notes: Introduced in CC-010 from `temperament-framework.md` § 9 Canonical Rule 1. Rank-aware per `signal-mapping-rule.md` § Ranking Question Signal Emission. No tension consumes this signal in v1; tension hooks deferred per `temperament-framework.md` § 7. Function-stack aggregation deferred.

---

#### fe

- signal_id: fe
- description: Value calibration directed outward — sensing relational and social register and what the situation asks of those present.
- primary_cards: [temperament]
- produced_by_questions: [Q-T5, Q-T6, Q-T7, Q-T8]
- used_by_tensions: —
- rank_aware: true
- implementation_status: unused
- notes: Introduced in CC-010 from `temperament-framework.md` § 9 Canonical Rule 1. Rank-aware per `signal-mapping-rule.md` § Ranking Question Signal Emission. No tension consumes this signal in v1; tension hooks deferred per `temperament-framework.md` § 7. Function-stack aggregation deferred.

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

## Allocation Card (Compass extension — CC-016)

Twelve rank-aware signals registered as the lived counterpart to Compass / Heart's stated values. Six describe discretionary money flow (Q-S3); six describe discretionary energy flow (Q-E1). Cross-rank signals (from Q-S3-cross / Q-E1-cross) share signal_ids with their parent counterparts; the engine distinguishes them via the `cross_rank` field on the Signal. All bound by `allocation-rules.md`: direction not quality, non-accusatory framing.

### `self_spending_priority`

- description: Allocates discretionary money primarily toward themselves — needs, comforts, savings, well-being.
- primary_cards: [sacred]
- produced_by_questions: [Q-S3-close, Q-S3-cross]
- used_by_tensions: [T-013]
- rank_aware: true
- implementation_status: active

### `family_spending_priority`

- description: Allocates discretionary money primarily toward family — kin, partners, children, parents, chosen kin.
- primary_cards: [sacred]
- produced_by_questions: [Q-S3-close, Q-S3-cross]
- used_by_tensions: [T-013]
- rank_aware: true
- implementation_status: active

### `friends_spending_priority`

- description: Allocates discretionary money primarily toward chosen friends — people they've selected as close.
- primary_cards: [sacred]
- produced_by_questions: [Q-S3-close, Q-S3-cross]
- used_by_tensions: [T-013]
- rank_aware: true
- implementation_status: active

### `social_spending_priority`

- description: Allocates discretionary money primarily toward social experiences — leisure, dining, travel, entertainment.
- primary_cards: [sacred]
- produced_by_questions: [Q-S3-wider, Q-S3-cross]
- used_by_tensions: [T-013]
- rank_aware: true
- implementation_status: active

### `nonprofits_religious_spending_priority`

- description: Allocates discretionary money primarily toward civil society and faith communities — charities, NGOs, churches, missions.
- primary_cards: [sacred]
- produced_by_questions: [Q-S3-wider, Q-S3-cross]
- used_by_tensions: [T-013]
- rank_aware: true
- implementation_status: active

### `companies_spending_priority`

- description: Allocates discretionary money primarily toward businesses — whether owned, employed by, invested in, or transacted with.
- primary_cards: [sacred]
- produced_by_questions: [Q-S3-wider, Q-S3-cross]
- used_by_tensions: [T-013]
- rank_aware: true
- implementation_status: active

### `building_energy_priority`

- description: Allocates discretionary energy primarily toward building or creating — making something new.
- primary_cards: [sacred]
- produced_by_questions: [Q-E1-outward, Q-E1-cross]
- used_by_tensions: [T-014]
- rank_aware: true
- implementation_status: active

### `solving_energy_priority`

- description: Allocates discretionary energy primarily toward solving problems — removing dysfunction, debugging, repairing.
- primary_cards: [sacred]
- produced_by_questions: [Q-E1-outward, Q-E1-cross]
- used_by_tensions: [T-014]
- rank_aware: true
- implementation_status: active

### `restoring_energy_priority`

- description: Allocates discretionary energy primarily toward restoring order — organizing, maintaining, preserving what works.
- primary_cards: [sacred]
- produced_by_questions: [Q-E1-outward, Q-E1-cross]
- used_by_tensions: [T-014]
- rank_aware: true
- implementation_status: active

### `caring_energy_priority`

- description: Allocates discretionary energy primarily toward caring for people — attention, presence, emotional labor.
- primary_cards: [sacred]
- produced_by_questions: [Q-E1-inward, Q-E1-cross]
- used_by_tensions: [T-014]
- rank_aware: true
- implementation_status: active

### `learning_energy_priority`

- description: Allocates discretionary energy primarily toward learning — taking in, studying, exploring, making sense.
- primary_cards: [sacred]
- produced_by_questions: [Q-E1-inward, Q-E1-cross]
- used_by_tensions: [T-014]
- rank_aware: true
- implementation_status: active

### `enjoying_energy_priority`

- description: Allocates discretionary energy primarily toward enjoying experience — savoring, presence, rest, pleasure.
- primary_cards: [sacred]
- produced_by_questions: [Q-E1-inward, Q-E1-cross]
- used_by_tensions: [T-014]
- rank_aware: true
- implementation_status: active

---

## MetaSignals (CC-014 + CC-016 + CC-017)

MetaSignals are engagement-data records — they live on `InnerConstitution.meta_signals` and never feed shape derivation, tension detection, or cross-card synthesis. They exist for analytics-style use and product evolution.

### `question_skipped` (CC-014)
Emitted when the user clicks Skip on a question during first-pass.

### `question_double_skipped` (CC-014)
Reserved for future use — emitted when a question is skipped both in first-pass and second-pass.

### `derived_question_skipped` (CC-016)
Emitted when a `ranking_derived` (CC-016) or `multiselect_derived` (CC-017) question cascade-skips because its parent answers lack sufficient data.

### `belief_impervious` (CC-017)
Emitted when Q-I2's `none_selected: true` — no trust source the user named could change their mind about the belief in Q-I1 / Q-I1b.

### `belief_no_cost_named` (CC-017)
Emitted when Q-I3's `none_selected: true` — the user did not name a sacred driver they'd risk losing for the belief.

---

## Active Signals

Produced by at least one canonical question AND (used by at least one canonical tension OR declared as a strengthener of one). 38 total (CC-016 added 12 allocation signals).

`truth_priority_high`, `truth_priority`, `freedom_priority`, `order_priority`, `adapts_under_social_pressure`, `adapts_under_economic_pressure`, `hides_belief`, `reflective_independence`, `strong_independent_conviction`, `authority_trust_high`, `authority_skepticism_moderate`, `authority_distrust`, `stability_baseline_high`, `chaos_exposure`, `high_pressure_context`, `high_responsibility`, `proactive_creator`, `responsibility_maintainer`, `reactive_operator`, `family_priority`, `stability_priority`, `conviction_under_cost`, `loyalty_priority`, `knowledge_priority`, `justice_priority`, `faith_priority`, `self_spending_priority`, `family_spending_priority`, `friends_spending_priority`, `social_spending_priority`, `nonprofits_religious_spending_priority`, `companies_spending_priority`, `building_energy_priority`, `solving_energy_priority`, `restoring_energy_priority`, `caring_energy_priority`, `learning_energy_priority`, `enjoying_energy_priority`.

---

## Pending Signals

Referenced by a canonical tension but not produced by any canonical question. Dead references. 4 total.

- `doubt_self_when_respected_people_disagree` — referenced by T-003.
- `institutional_trust` — referenced by T-004.
- `institutional_skepticism` — referenced by T-004.
- `institutional_distrust` — referenced by T-004.

---

## Unused Signals

Produced by a canonical question (or the runtime freeform extractor) but not consumed by any canonical tension. Orphans. 40 total.

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
- `government_elected_trust_priority` — produced by Q-X3-public (rank-aware, CC-031).
- `government_services_trust_priority` — produced by Q-X3-public (rank-aware, CC-031).
- `education_trust_priority` — produced by Q-X3-public (rank-aware; preserved through CC-031).
- `nonprofits_trust_priority` — produced by Q-X3-public (rank-aware, CC-031).
- `religious_trust_priority` — produced by Q-X3-public (rank-aware, CC-031).
- `journalism_trust_priority` — produced by Q-X3-information-and-commercial (rank-aware, CC-031).
- `news_organizations_trust_priority` — produced by Q-X3-information-and-commercial (rank-aware, CC-031).
- `social_media_trust_priority` — produced by Q-X3-information-and-commercial (rank-aware, CC-031).
- `small_business_trust_priority` — produced by Q-X3-information-and-commercial (rank-aware, CC-031).
- `large_companies_trust_priority` — produced by Q-X3-information-and-commercial (rank-aware, CC-031).
- `partner_trust_priority` — produced by Q-X4-relational (rank-aware; was Q-X4 pre-CC-032).
- `friend_trust_priority` — produced by Q-X4-relational (rank-aware; was Q-X4 pre-CC-032).
- `family_trust_priority` — produced by Q-X4-relational (rank-aware; was Q-X4 pre-CC-032).
- `mentor_trust_priority` — produced by Q-X4-chosen (rank-aware; was Q-X4 pre-CC-032).
- `outside_expert_trust_priority` — produced by Q-X4-chosen (rank-aware, CC-032).
- `own_counsel_trust_priority` — produced by Q-X4-chosen (rank-aware; was Q-X4 pre-CC-032).
- `government_trust_priority` — DEPRECATED in CC-031 (legacy; flat Q-X3 retired).
- `press_trust_priority` — DEPRECATED in CC-031 (legacy; flat Q-X3 retired).
- `companies_trust_priority` — DEPRECATED in CC-031 (legacy; flat Q-X3 retired).
- `nonprofits_religious_trust_priority` — DEPRECATED in CC-031 (legacy; flat Q-X3 retired).
- `individual_responsibility_priority` — produced by Q-C4 (rank-aware).
- `system_responsibility_priority` — produced by Q-C4 (rank-aware).
- `nature_responsibility_priority` — produced by Q-C4 (rank-aware).
- `supernatural_responsibility_priority` — produced by Q-C4 (rank-aware).
- `authority_responsibility_priority` — produced by Q-C4 (rank-aware).
- `ni` — produced by Q-T1, Q-T2, Q-T3, Q-T4 (rank-aware).
- `ne` — produced by Q-T1, Q-T2, Q-T3, Q-T4 (rank-aware).
- `si` — produced by Q-T1, Q-T2, Q-T3, Q-T4 (rank-aware).
- `se` — produced by Q-T1, Q-T2, Q-T3, Q-T4 (rank-aware).
- `ti` — produced by Q-T5, Q-T6, Q-T7, Q-T8 (rank-aware).
- `te` — produced by Q-T5, Q-T6, Q-T7, Q-T8 (rank-aware).
- `fi` — produced by Q-T5, Q-T6, Q-T7, Q-T8 (rank-aware).
- `fe` — produced by Q-T5, Q-T6, Q-T7, Q-T8 (rank-aware).

---

## Deprecated Signals

Formally retired from canon but retained so historical references remain explicable. 3 total.

- `individual_responsibility` — deprecated in CC-009 when Q-C4 was migrated from forced to ranked. Successor: `individual_responsibility_priority`.
- `systemic_responsibility` — deprecated in CC-009 when Q-C4 was migrated from forced to ranked. Successor: `system_responsibility_priority` (renamed `systemic` → `system` for grammar consistency with the new ranked option label).
- `balanced_responsibility` — deprecated in CC-009 when Q-C4 was migrated from forced to ranked. No direct successor — the "balanced" semantic is now expressed structurally by two top-2 ranks of `individual_responsibility_priority` and `system_responsibility_priority`.

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

### T-009 Individual vs System Responsibility (post-CC-009 state)

- tension_id: T-009
- blocker_type: canon blocker (deprecated signal references)
- missing_signals: `individual_responsibility`, `systemic_responsibility`, `balanced_responsibility` are all deprecated in CC-009. They remain in canon for historical legibility but no question produces them anymore (Q-C4 was migrated to a rank-aware ranking question with successor signals `individual_responsibility_priority`, `system_responsibility_priority`, plus the three new attribution categories `nature_responsibility_priority`, `supernatural_responsibility_priority`, `authority_responsibility_priority`).
- remediation_path: rewrite T-009 in `tension-library-v1.md` to consume `individual_responsibility_priority` AND `system_responsibility_priority` at rank ≤ 2 (or equivalent rank-aware formulation). The "balanced" semantic is now expressed structurally by both signals appearing in the user's top-2 ranks rather than by a dedicated signal. Future-CC scope (likely paired with the output engine derivation CC).

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
