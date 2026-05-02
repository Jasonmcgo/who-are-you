# OCEAN Framework (CC-037)

## Why this framework exists

The instrument today produces eight ShapeCard outputs (Lens, Compass, Conviction, Gravity, Trust, Weather, Fire, Path) plus the Drive distribution on Path · Gait. None of these output a Big-5 OCEAN read. OCEAN is a widely-recognized, research-validated personality framework — adding a derivation layer over existing signals gives the report a vocabulary that translates the instrument's specific findings into a register that other tools, clinicians, and researchers can immediately recognize.

Per the project's standing rule (`feedback_minimal_questions_maximum_output`): *derive new dimensions from existing signals before adding survey questions*. CC-037 is derivation-only. No new measurement surface; the instrument's question footprint is unchanged.

**Empirical grounding.** Jung-Big5 correlations are well-documented in the personality-psychology literature — extraversion preference correlates with Big-5 Extraversion (~0.5–0.7); intuition preference correlates with Big-5 Openness (~0.5–0.7); thinking/feeling preference correlates with Big-5 Agreeableness (~0.4–0.5); Si/Te dominance correlates with Big-5 Conscientiousness (~0.5–0.6). The instrument's compass values, allocation rankings, pressure-block answers, and formation-block answers carry additional signal that strengthens the Big-5 derivation beyond what Lens alone could deliver. The correlation evidence is referenced here for canon transparency; user-facing prose stays self-contained and does not surface the literature claim.

---

## The five buckets

| Bucket | Engineer-facing codename | User-facing label |
|---|---|---|
| Openness | `O` | *"Openness"* |
| Conscientiousness | `C` | *"Conscientiousness"* |
| Extraversion | `E` | *"Extraversion"* |
| Agreeableness | `A` | *"Agreeableness"* |
| (Neuroticism) | `N` | *"Emotional Reactivity (estimated)"* |

**The Neuroticism relabel.** "Neuroticism" carries clinical-pejorative baggage that doesn't match the instrument's tone (per `result-writing-canon.md` precedent — frame names describe register, not pathologize). User-facing prose uses *"Emotional Reactivity (estimated)"* instead. The "(estimated)" parenthetical is load-bearing — it makes the proxy nature of the N axis explicit without requiring the user to read the surrounding prose to learn that the instrument doesn't measure trait-level reactivity directly.

The TypeScript codename `"N"` and the type-level `OceanBucket = "O" | "C" | "E" | "A" | "N"` stay verbatim. Only the human-facing label substitutes.

### Bucket definitions

- **Openness** — pattern-finding, abstraction, willingness to revise frame in light of new evidence. Signals indexing high O include Ni/Ne dominance, knowledge_priority, freedom_priority, learning_energy_priority, system_responsibility_priority, independent_thought_signal, epistemic_flexibility, time_autonomy_stakes_priority.
- **Conscientiousness** — order, follow-through, rule-orientation, accumulation across time. Signals indexing high C include Si/Te dominance, stability_priority, faith_priority, honor_priority, money_stakes_priority, job_stakes_priority, building_energy_priority, solving_energy_priority, restoring_energy_priority, conviction_under_cost.
- **Extraversion** — outward energy direction, social-engagement pull, recognition-seeking. Signals indexing high E include Ne/Te/Fe/Se as auxiliary or dominant when paired with social-spending or fame-priority signals, friends_spending_priority, fame_priority, high_conviction_expression.
- **Agreeableness** — relational tending, compassion-orientation, cooperative posture. Signals indexing high A include Fi/Fe dominance, family_priority, peace_priority, compassion_priority, mercy_priority, loyalty_priority, caring_energy_priority, family_trust_priority, partner_trust_priority, friend_trust_priority.
- **Emotional Reactivity (estimated)** — proxy axis. Signals indexing high N include chaos_exposure (formation history), high_pressure_context (current-context load), adapts_under_social_pressure / adapts_under_economic_pressure / hides_belief (pressure-adaptation behavior). These are state-and-history measures, not trait-level dispositions. The "estimated" framing in user-facing prose is non-negotiable.

---

## Tagging table

The full `SIGNAL_OCEAN_TAGS` map lives at `lib/ocean.ts § SIGNAL_OCEAN_TAGS`. Each existing signal contributes to one or more OCEAN buckets. Multi-tagged signals split-weight 1/N across their buckets at distribution-compute time.

Tagging summary (rationale below for non-obvious choices):

| Source surface | Tag pattern |
|---|---|
| Lens (Q-T1–T8) | Each cognitive function tags its primary correlate(s). E.g., Ni → [O], Ne → [O, E], Si → [C], Se → [E, O], Ti → [O, C], Te → [C, E], Fi → [A], Fe → [A, E]. |
| Compass sacred values (Q-S1, Q-S2) | Each value tags the OCEAN axis its register most cleanly indexes. Truth → [O, C]; freedom → [O]; stability → [C]; loyalty → [A, C]; family → [A]; etc. |
| Concrete stakes (Q-Stakes1) | Money / job / health → [C]; close-relationships → [A]; reputation → [E, C]; time-autonomy → [O]. |
| Allocation (Q-S3-*, Q-E1-*) | Money + energy flow tags reflect the directional pull (e.g., friends_spending → [E, A], building_energy → [C, O]). |
| Drive: claimed (Q-3C1) | cost_drive → [C]; coverage_drive → [A]; compliance_drive → [C]. |
| Drive: ambition (Q-Ambition1) | success → [C, E]; fame → [E]; wealth → [C]; legacy → [C, O]. |
| Trust: institutional (Q-X3-*) | Institutional trust generally indexes Conscientiousness (rule-following / order-orientation). Education, journalism → also tag O. |
| Trust: personal (Q-X4-*) | Relational trust signals (family / partner / friend) → [A]; mentor / outside-expert → [O, A] / [O]. |
| Conviction (Q-C1, Q-C3, Q-C4) | truth_priority_high → [O, C]; belonging_priority_high → [A]; order_priority → [C]; responsibility-attribution signals tag per their register (individual → C, system → O, supernatural → C). |
| Pressure (Q-P1, Q-P2) | adapts_under_*, hides_belief → tag N (the proxy register); holds_internal_conviction, high_conviction_under_risk → [C]. |
| Formation (Q-F1, Q-F2) | authority_trust_high → [A, C]; authority_distrust → [O]; stability_baseline_high → [C]; chaos_exposure → [N]. |
| Context (Q-X1, Q-X2) | stability_present → [C]; high_pressure_context → [N]. |
| Belief catalog signals (Q-I1 freeform) | independent_thought_signal → [O]; epistemic_flexibility → [O, A]; conviction_under_cost → [C]. |

### Empty tags (intentionally ambivalent)

Several signals carry empty tag arrays. They are listed explicitly so future authors don't read the omission as an oversight:

- `self_spending_priority` — self-directed money flow is direction-neutral on OCEAN.
- `social_media_trust_priority` — too domain-specific; social-media trust correlates ambivalently with each bucket.
- `own_counsel_trust_priority` — self-counsel reads as both high O (independence) and high C (self-discipline) at once; tagging neither avoids smearing the distribution.
- `authority_skepticism_moderate` — middle-band authority posture; both O-leaning (skepticism is openness-adjacent) and A-deflating (skepticism reduces blanket agreeableness). Tagging neither.
- `moderate_social_expression` — middle-band pressure response; ambivalent.
- `moderate_load`, `moderate_stability` — middle-band context/formation; ambivalent.

---

## Multi-tag handling

When a signal tags N buckets, its weighted contribution divides 1/N across those buckets. So `truth_priority` (tagged `[O, C]`) at rank 1 contributes `weight=3` per `weightFor`, splitting to `1.5` for O and `1.5` for C. This mirrors the Drive `MULTI_TAG_SPLITS` pattern but generalizes to N≥2 buckets.

---

## Rank-aware weighting

`computeOceanDistribution` calls `weightFor` from `lib/drive.ts` for each signal:

- rank 1 → weight 3
- rank 2 → weight 2
- rank 3 → weight 1
- rank ≥ 4 → weight 0.5
- unranked (single_pick / freeform-tagged) → weight 1

The shared dependency is canonical. A future tuning change to the ladder propagates to both Drive and OCEAN at once. Don't duplicate the function in `lib/ocean.ts`.

---

## The Neuroticism floor problem

Several signals that *should* read as low-Neuroticism (the inverse of N) — `stability_baseline_high`, `stability_present`, `holds_internal_conviction`, `high_conviction_under_risk` — are tagged with C (Conscientiousness) rather than as anti-N. This is a deliberate architecture choice: rather than introducing negative tags (which would complicate the math and require a different weighting framework), the model lets the *absence* of positive-N signals mean low Neuroticism.

The effect is a **"weak floor"** — a user with no chaos-exposure / no high-pressure context / no pressure-adaptation answers will fire low N organically. The downside: a user whose answer set lands moderately positive on N proxies *and* moderately positive on stability signals will read with elevated N because the stability signals don't actively offset.

If browser smoke surfaces "N reads thin" or "N reads too strong for users with strong stability signals," surface as a successor CC. Two candidate paths:

1. **Add anti-N tags** (e.g., `stability_baseline_high: ["C", "ANTI_N"]`) and a more elaborate weighting framework that subtracts ANTI_N contributions from the N total. Math complexity goes up materially.
2. **Add a single forced-choice Q-N1** (e.g., "When something doesn't go your way, you most often:" with options indexing reactivity-stability). Cheap question; trait-level direct measurement; doesn't break the derivation-only architectural commitment because Q-N1 is its own dedicated surface.

CC-037 ships the weak-floor architecture for v1.

---

## Distribution-shape cases

`classifyOceanCase` returns one of four locked cases. Thresholds are exported as named constants (`SINGLE_DOMINANT_PCT_THRESHOLD`, `SINGLE_DOMINANT_GAP_THRESHOLD_PP`, `TWO_DOMINANT_FLOOR_PCT`, `TWO_DOMINANT_GAP_THRESHOLD_PP`, `BALANCED_SPREAD_THRESHOLD_PP`, `N_ELEVATED_THRESHOLD_PCT`) so future tuning is visible.

| Case | Condition | Prose template |
|---|---|---|
| `single-dominant` | Top bucket ≥ 30% AND ≥ 10pp ahead of #2 | *"Your strongest disposition reads as {top} ({pct}%). The instrument detects this through patterns across your sacred values, allocation rankings, and lens-block answers — not from any single question."* |
| `two-dominant` | Top two each ≥ 22% AND within 5pp | *"Your disposition is shaped by {top1} ({pct1}%) and {top2} ({pct2}%) in roughly equal weight. Two strong dimensions can integrate well or pull against each other depending on context."* |
| `balanced` | Max-min spread across all five < 12pp | *"Your disposition is unusually balanced — no single dimension dominates. This often shows up as adaptability across registers, or as a system that draws on whichever dimension the moment is asking for."* |
| `n-elevated` | N ≥ 22% (regardless of overall shape) | *"Your distribution shows elevated emotional-reactivity proxies ({pct}%) — formation, context, or pressure-adaptation signals that often correlate with Big-5 Neuroticism. Treat this as an estimate; the instrument measures these dimensions indirectly rather than asking about them. Outside of Reactivity, your strongest dimension reads as {top-non-N} ({pct-non-N}%)."* |

**`n-elevated` takes precedence.** When N clears its threshold, the user gets the N-elevated prose regardless of whether O/C/E/A also has a single-dominant or two-dominant shape. The N-elevated prose composes the two reads (Neuroticism callout + top non-N dimension) into one paragraph.

---

## Render position

A page section labeled **"Disposition Map"** rendered between the MirrorSection and the MapSection in `InnerConstitutionPage.tsx`. **Not a ShapeCard.** ShapeCards have a 4-section architecture (Strength / Growth Edge / Practice / Pattern Note) and a body-part metaphor; OCEAN is a cross-cutting derivation that doesn't fit that schema. The page-section register matches existing non-card sections like Growth Path / Conflict Translation / Mirror-Types Seed at the bottom of the page.

The section contains:

1. Mono-uppercase section header: **"Disposition Map"**
2. One-paragraph framing: *"Big-5 personality dimensions, derived from how you answered other questions in this instrument. No single answer determines a dimension; the model reads patterns across the full question footprint."*
3. `<OceanBars />` rendering the 5-bar SVG distribution. Bars in O/C/E/A/N order; largest bar gets `umber-soft` fill; others get `rule-soft` fill with `ink` stroke. The N bar carries an italic mono-small subscript: *"estimated — derived from proxy signals, not asked directly."*
4. Distribution-shape prose paragraph (per the case classifier).
5. Footnote: *"Emotional Reactivity is shown as an estimate — the instrument measures it through proxy signals (formation history, current-context load, pressure-adaptation behavior) rather than directly."*

The render layer guards on `constitution.ocean` presence — pre-CC-037 saved sessions don't have the field, and `computeOceanOutput` returns `undefined` for thin-signal sessions. The Disposition Map section silently skips render in either case.

---

## Open questions for future tuning

These are CC-037-followup territory; not in scope for v1:

- **Q-N1 candidate.** Single forced-choice for direct Neuroticism measurement. Would firm up the N axis without breaking the derivation-only commitment for the rest of the framework.
- **Anti-N tags.** Architectural alternative to Q-N1 if we want to keep the no-new-questions commitment.
- **Multi-tag distribution drift.** If browser smoke shows specific signals weighting unintuitively (e.g., a user where `truth_priority` at rank 1 splits 1.5/1.5 to O+C and the user expects more O than C), surface as a tagging-table revision CC.
- **Tied-bucket rounding-correction edge case.** When the largest bucket ties with another after `Math.round`, the deterministic tie-breaking (canonical ORDER first occurrence) should hold; verify under unusual distributions.
- **Disposition Map render position.** The "between Mirror and Map" placement may feel off relative to the surrounding cards; if browser smoke shows pacing problems (e.g., the section reads as an interruption of the Mirror-to-Map flow), consider alternative positions (e.g., after MapSection alongside Growth Path / Conflict Translation).

---

## Implementation surfaces

| Canonical rule | Code-level surface |
|---|---|
| Five OCEAN buckets + types | `lib/types.ts` (`OceanBucket`, `OceanDistribution`, `OceanCase`, `OceanOutput`); `InnerConstitution.ocean?: OceanOutput` |
| Tagging table | `lib/ocean.ts § SIGNAL_OCEAN_TAGS` |
| Distribution + classifier + prose | `lib/ocean.ts` (`computeOceanDistribution`, `classifyOceanCase`, `generateOceanProse`, `computeOceanOutput`) |
| Rank-aware weighting | `lib/drive.ts § weightFor` (shared with Drive framework) |
| Bar chart render | `app/components/OceanBars.tsx` |
| Page-section render | `app/components/InnerConstitutionPage.tsx` (between MirrorSection and MapSection) |
| Engine pipeline | `lib/identityEngine.ts § buildInnerConstitution` (post-Drive call site) |
