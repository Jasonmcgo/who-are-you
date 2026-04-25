# Validation Roadmap v1

## Purpose

Name the borrowed psychometric instruments per Shape card so that **if** the product ever needs formal validation, there is a clear baseline of which established scales would be used as parallel references. This file does not authorize new questions or signals. It is a planning document for v2 / external-validation work.

`shape-framework.md` defines the eight cards. `research-mapping-v1.md` names the underlying research bodies. **This file names the instruments** — the specific scales an academic or clinical reviewer would use to validate or critique each card's measurement.

The product is not a clinical instrument. The Inner Constitution disclaims diagnostic interpretation. This roadmap exists so that if the product ever needs to defend its measurement to a clinical, academic, or skeptical reviewer, the comparison instruments are pre-named and the gap between "what the product measures" and "what a validated instrument would measure" is transparent.

---

## Why Validation Is Optional in v1

The v1 product is a self-recognition tool, not a diagnostic instrument. Its value comes from narrative power and structural articulation, not from claiming psychometric purity. The product explicitly trades validation strictness for narrative depth in places (most notably Lens, where Jungian functions are chosen over Big Five — see `shape-framework.md` § Card 1 and `temperament-framework.md`).

Validation becomes important only if one of the following lands:

1. The product needs academic or clinical credibility (e.g., institutional partnerships, research use).
2. The product makes a clinical-adjacent claim (e.g., diagnostic interpretation, treatment implication) that requires evidentiary support.
3. The product is publicly challenged on its measurement and the team chooses to defend rather than concede.

Until one of those triggers, this roadmap is a reference, not a worklist.

---

## Per-Card Instruments

For each Shape card, the table below names:

- **Primary instrument** — the most established scale that would serve as a validation reference for this card.
- **Secondary / supplementary instruments** — additional scales that would refine the comparison.
- **What a comparison study would test.**
- **Known gaps** — places where the product's measurement is structurally different from the borrowed instrument and a correlation study would not tell the whole story.

### Lens (Process)

**Primary.** Big Five — BFI-2 (Big Five Inventory 2, Soto & John 2017) or NEO-PI-R (Costa & McCrae 1992).

**Secondary.** Cognitive Reflection Test (CRT, Frederick 2005). Need for Cognition (NFC, Cacioppo & Petty 1982). Actively Open-Minded Thinking (AOT, Stanovich & West 1997). Intellectual Humility scale (IH, Krumrei-Mancuso & Rouse 2016).

**What a comparison study would test.** Whether dominant Lens function (Ni / Ne / Si / Se / Ti / Te / Fi / Fe) correlates with expected Big Five trait patterns — e.g., Ne with Openness, Si with Conscientiousness, Fe with Agreeableness. Whether AOT and IH track Conviction's belief-revision posture rather than Lens itself.

**Known gap.** Big Five is dimensional and trait-based; Jungian functions are typological and process-based. A Big Five correlation study confirms whether Lens output is *consistent* with established trait variation, not whether the Jungian categorization is *correct*. The product accepts this as a v1 trade-off.

### Compass (Values)

**Primary.** Schwartz Portrait Values Questionnaire — PVQ-21, PVQ-40, or PVQ-57 (Schwartz et al. 2001 / 2012). Schwartz Values Survey (SVS) is the older alternative.

**Secondary.** Moral Foundations Questionnaire 2 (MFQ-2, Atari et al. 2023) for moralized-value weighting. Tetlock taboo-tradeoff paradigms for sacred-value reactivity.

**What a comparison study would test.** Whether a user's Q-S1 + Q-S2 ranked top values predict their Schwartz circumplex profile. Whether MFQ-2 foundation weights correlate with the moral-language register the user produces in freeform questions.

**Known gap.** The v1 sacred-values list (Freedom, Truth, Stability, Loyalty, Family, Knowledge, Justice, Faith) is Schwartz-compatible but not Schwartz-derived. A correlation study would surface mappings, not a 1:1 fit.

### Conviction (Belief)

**Primary.** Actively Open-Minded Thinking (AOT). Intellectual Humility scale (IH).

**Secondary.** Need for Cognition (NFC). Need for Closure (NFC, Webster & Kruglanski 1994 — note name collision with Need for Cognition). Dogmatism scales (Rokeach, Altemeyer).

**What a comparison study would test.** Whether the freeform Q-I1 / Q-I2 belief-revision answers map onto AOT and IH scores. Whether Conviction Posture (per `output-engine-rules.md` Rule 3 — Compass × Fire) tracks dogmatism vs. intellectual humility patterns.

**Known gap.** Conviction in v1 has thin question depth (Q-C1, Q-C3 in code; Q-C2 awaiting code; Q-I1 / Q-I2 freeform). A validation study would expose whether the v1 Conviction reading is reliable or whether it leans too heavily on freeform interpretation.

### Gravity (Responsibility)

**Primary.** Levenson Internality, Powerful Others, Chance scale (Levenson IPC, 1981).

**Secondary.** Multidimensional Locus of Control scales (Lefcourt, Wallston). Causal Dimension Scale (Russell 1982) for attribution.

**What a comparison study would test.** Whether Q-C4 ranked attributions (Individual / System / Nature / Supernatural / Authority) correlate with Levenson IPC subscales — Individual to Internality, System and Authority to Powerful Others, Nature to Chance. Supernatural is a custom expansion that has no direct IPC analog.

**Known gap.** The v1 five-attribution list extends beyond Levenson's three subscales. A correlation study would validate the overlapping portions and leave Supernatural as a v1 product-specific addition rather than a borrowed-instrument-validated category.

### Trust (Epistemic Trust)

**Primary.** Epistemic Trust, Mistrust and Credulity Questionnaire, Revised (ETMCQ-R, Campbell et al. 2021).

**Secondary.** General Social Survey (GSS) trust battery for institutional trust. Pew institutional trust longitudinal items. Experiences in Close Relationships — Revised (ECR-R, Fraley et al. 2000) for attachment-based personal trust. Rempel, Holmes & Zanna trust scale for close-relationships trust.

**What a comparison study would test.** Whether Q-X3 institutional ranking correlates with GSS-style social trust scores. Whether Q-X4 personal-trust ranking correlates with ECR-R attachment style — secure attachment predicting partner-trust priority, dismissive attachment predicting own-counsel priority, anxious attachment predicting close-friend or family priority.

**Known gap.** Q-X4's "your own counsel" option doesn't map cleanly onto attachment theory categories. ETMCQ-R and the GSS battery measure trust without ranking; the v1 product uses ranking as its primary measurement mode. A validation study would need to handle the ranking-vs-Likert format gap.

### Weather (Formation + Context)

**Primary.** Basic Psychological Need Satisfaction and Frustration Scale (BPNSFS, Chen et al. 2015) for current-context environmental conditions.

**Secondary.** Adverse Childhood Experiences (ACE) checklist for formation history — used cautiously, with explicit clinical disclaimers. Difficulties in Emotion Regulation Scale, Short Form (DERS-SF, Kaufman et al. 2016). Emotion Regulation Questionnaire (ERQ, Gross & John 2003). Brief COPE (Carver 1997) for stress-coping style.

**What a comparison study would test.** Whether Q-F1 / Q-F2 formation answers correlate with attachment-history measures. Whether Q-X1 / Q-X2 current-context answers track BPNSFS need-satisfaction vs. need-frustration.

**Known gap.** ACE-style formation measurement is clinically loaded; the v1 product does not collect ACE-grade detail and must not present its formation reading as ACE-equivalent. The product's Weather output is *adaptive-pattern recognition*, not childhood-adversity scoring. The "state is not shape" principle (per `shape-framework.md` § Card 6 and `inner-constitution.md` Canonical Rule 8) explicitly distances Weather output from clinical claim.

### Fire (Pressure)

**Primary.** Brief COPE (Carver 1997) for stress-response style. Emotion Regulation Questionnaire (ERQ, Gross & John 2003).

**Secondary.** Tetlock taboo-tradeoff paradigms for sacred-value-violation reactivity. BPNSFS need-frustration subscales for SDT-under-stress measurement.

**What a comparison study would test.** Whether Q-P1 / Q-P2 / Q-I3 patterns correlate with Brief COPE engagement-vs-disengagement coping styles. Whether the user's Conviction Posture under pressure tracks ERQ reappraisal-vs-suppression patterns.

**Known gap.** Pressure is conditional (per `shape-framework.md` § Card 7 and the Five Dangers § "Don't equate stress with revelation"). Borrowed stress-response instruments measure across many situations; the v1 product asks about specific past costly-belief moments. A correlation study would surface partial overlap, not full mapping.

### Path (Purpose)

**Primary.** Basic Psychological Need Satisfaction and Frustration Scale (BPNSFS).

**Secondary.** Self-Concordance Scale (Sheldon & Elliot 1999) for goal autonomy. Loyola Generativity Scale (LGS, McAdams & de St. Aubin 1992) for the generativity component.

**What a comparison study would test.** Whether the v1 directional Path output (interpreted from Compass + Lens + Gravity + Agency signals) anticipates a user's BPNSFS profile. Whether v2's planned Work / Love / Give / Empower stages correlate with LGS generativity scores in the expected age-graded pattern.

**Known gap.** v1 Path is interpretive, not measured. There is no v1 instrument to validate against — the validation question is whether the *interpretation* matches what direct measurement would show. v2's dedicated Path questions (deferred per `shape-framework.md` § Deferred) would close this gap.

---

## Validation Study Design Sketch

If the product ever runs a formal validation pass, the recommended structure:

1. **Recruit participants** who have completed the v1 Inner Constitution.
2. **Administer the borrowed instruments** above for the cards being validated. (Full-card validation is large; partial validation can run card-by-card.)
3. **Correlate** product outputs with established-instrument scores. Prioritize Compass (Schwartz PVQ) and Gravity (Levenson IPC) — these have the cleanest mappings.
4. **Test-retest** a subset of users at 4–12 weeks to measure Shape stability.
5. **Construct validity** for tensions: do confirmed T-012 (Sacred Value Conflict) detections correlate with Tetlock-style sacred-value-violation reactivity?

This study design is doable but is not v1 work. Naming it here is the entire purpose of this file.

---

## What This Roadmap Does Not Promise

- **It does not promise validation.** No formal validation has been run. This file lists what *could* be done if validation were prioritized.
- **It does not authorize new questions, signals, or tensions.** Validation work would draw on existing canon, not add to it.
- **It does not claim equivalence with the borrowed instruments.** The v1 product makes interpretive readings; the borrowed instruments make psychometric measurements. The two are different in kind. A correlation, however strong, would establish *consistency*, not *equivalence*.
- **It does not commit to a v2 timeline.** Validation is a possible future move, contingent on product direction and partner needs.

---

## Relationship to Other Canon Files

- `shape-framework.md` — defines the eight cards this file maps instruments to. The "Five Dangers to Avoid" (§ Five Dangers) constrain the validation language: the product must not slide from observation into clinical claim regardless of validation status.
- `research-mapping-v1.md` — names the underlying research bodies. This file names the instruments those research bodies produced.
- `temperament-framework.md` — Lens / Big Five trade-off lives there in detail.
- `inner-constitution.md` — the rendered output that any validation study would be testing.

If a future canon revision tightens or expands the eight-card structure, this file must be updated to keep the per-card instruments aligned with what each card actually measures.
