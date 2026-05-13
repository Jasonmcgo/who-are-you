# OCEAN / Disposition Layer — Spec Memo

**Status:** Draft for canon review. Authored 2026-05-07, Cowork chat session.
**Predecessor work:** Workshop session with Clarence on Jason's report; integration with Goal/Soul/Give layer (`docs/goal-soul-give-spec.md`); existing implementation in `lib/ocean.ts` (CC-037, output type `OceanOutput`).
**Sibling memo:** `docs/goal-soul-give-spec.md` §14 OCEAN Integration carries the lightweight cross-reference; full architecture lives here.

---

## 1. Hierarchy: Where OCEAN Sits

OCEAN is a **disposition layer**, not an identity layer. It describes *how* a person's deeper shape becomes visible — the gait — not *who they are*.

The canonical hierarchy of the report's interpretive layers, top-down:

1. **Body Map** — Lens, Compass, Gravity, Voice, Heart, Spine, Eyes, Gait. The eight-card metaphor for *the person*.
2. **Goal/Soul/Give synthesis** — the polar plane of productive motion × love-line, with quadrant and Movement reads. *Whether the motion is becoming a life.*
3. **OCEAN / Disposition** — the expression channel through which body-map shape and Goal/Soul motion become observable. *The gait; how shape moves.*
4. **Applied Maps** — Work, Love, Give, Conflict, Growth Path. Domain-specific renderings of the upstream layers.

The summary line that anchors this hierarchy:

> OCEAN shows the gait. The body map shows the person. Goal/Soul shows whether the person's motion is becoming a life.

Practical implication: the report should never lead with OCEAN. Big Five trait readings are translation infrastructure, not the headline. They modify and color the deeper outputs; they do not stand alone as a personality verdict. Section ordering and weight in the rendered report should reflect this — Body Map first, Goal/Soul/Give synthesis next, Disposition Map afterward, Applied Maps last.

## 2. Disposition Signal Mix — Math and Labeling Canon

### 2.1 Independent trait intensity (canonical)

Each OCEAN trait is rendered as an **independent intensity score on a 0–100 scale**. Big Five traits are conceptually independent dimensions; a person can be high on multiple traits simultaneously, and the math and rendering must reflect that.

Required math behavior:

```
intensity_openness         ∈ [0, 100]
intensity_conscientiousness ∈ [0, 100]
intensity_extraversion     ∈ [0, 100]
intensity_agreeableness    ∈ [0, 100]
intensity_emotional_reactivity ∈ [0, 100]

NO normalization across traits. The five values do not sum to 100.
```

Render bands for narrative use (not displayed as numbers; trait names internal, narrative external — see §6):

- 0–19: under-detected
- 20–39: low
- 40–59: moderate
- 60–79: moderate-high
- 80–100: high

### 2.2 Relative signal dominance (additional, separate)

Alongside intensity, the instrument computes which traits **most shaped the present report** — the relative signal dominance. This is a rank order across the five traits, computed as the ordinal position of each trait's intensity (with ties broken by signal density).

Render output: a single sentence describing the strongest one or two traits and the lowest one. Example: *"Among the disposition signals detected, Conscientiousness carries the strongest weight, followed by Openness and Agreeableness, with Extraversion lower and Emotional Reactivity only weakly detected."*

Intensity is **primary** in the user-facing render; dominance is **secondary** (per workshop call). Both ship in MVP.

### 2.3 Forbidden: 100%-summing distribution

Earlier implementation rendered OCEAN traits as percentages of a 100% total ("Openness 26%, Conscientiousness 35%, Extraversion 15%, Agreeableness 24%, with Emotional Reactivity displayed as measured-zero"). That display is **misleading** and has been replaced in the user-facing render by `dispositionSignalMix` independent intensities:

- Big Five traits are independent dimensions, not slices of a fixed pie.
- Forced normalization makes one trait suppress another artificially.
- A user reading "Conscientiousness 35%" interprets it as a low-to-moderate score, when it may actually be a high independent intensity (just relatively the largest signal in their mix).

**Display canon:** the per-trait readout is intensity (0–100, independent). The relative-mix language ("strongest signal," "second-strongest") lives in the dominance sentence and is explicitly framed as rank order, not percentages.

### 2.4 Section title and disclaimer

The section in the rendered report carries the heading **`## Disposition Signal Mix`** (not "OCEAN," not "Big Five," not "Personality").

Immediately under the heading, a one-line disclaimer makes the canon explicit:

> These describe the relative weight of disposition signals detected by the instrument across this assessment. They are not percentile scores against a population, and the trait readings are independent — high in one does not mean low in another.

Trait names (Openness, Conscientiousness, Extraversion, Agreeableness, Emotional Reactivity) appear in the body of the section but are introduced via narrative names first (see §6 register).

### 2.5 Confidence language for thin signals

When a trait's intensity is computed from few signals or proxy signals (rather than direct measurement), the rendered output **must** carry confidence language. Specifically:

- Intensity ≥ 40 with high signal density → render as the band ("moderate-high" etc.) without hedge.
- Intensity < 20 OR low signal density → render as "**low or under-detected**" with an explicit confidence note.
- Intensity exactly 0 with proxy-only signal → **never render as 0** in user-facing prose. Always paraphrase to "low or under-detected" with the proxy note.

Forbidden user-facing phrasings: *"Your Emotional Reactivity is 0%"* — epistemically wrong (humans are not emotionally non-reactive), display-misleading, and a confidence overreach.

## 3. Openness Subdimensions

Standard Big Five Openness blends several distinguishable registers. The instrument currently treats them as a single signal pool, which means a user with structured/architectural openness reads as low Openness even when their imagination is unmistakably alive — just disciplined.

The canonical 4-way split for this instrument:

### 3.1 Intellectual Openness

Curiosity about ideas, abstract thinking, willingness to wrestle with concepts for their own sake. Captures NEO PI-R's "Openness to Ideas" core.

Signal candidates from existing bank: `independent_thought_signal`, `epistemic_flexibility`, `truth_priority` ranked high, `knowledge_priority` ranked high, `te`/`ti` temperament prominence, Q-T patterns showing pattern-recognition orientation.

### 3.2 Aesthetic Openness

Sensitivity to beauty, art, music, nature, sensory richness, emotional resonance with the made-and-felt world. Captures NEO's Aesthetics + Feelings facets, collapsed.

Signal candidates: `compassion_priority`, `mercy_priority`, `peace_priority`, `enjoying_energy_priority`, Q-T `fi` prominence, freeform content flagged for sensory/aesthetic vocabulary.

### 3.3 Novelty Openness

Experimentation, spontaneity, willingness to change routines, openness to new experiences and actions. Captures NEO's Actions + Values + Fantasy facets, collapsed.

Signal candidates: `exploration_drive`, `proactive_creator`, `freedom_priority` ranked high, `high_conviction_expression`, low `stability_priority`, low `authority_trust_high`, Q-T `ne`/`se` prominence, low `responsibility_maintainer`.

### 3.4 Architectural Openness

Disciplined imagination that *resolves into structure*. Frameworks, models, theories, systems, long-arc syntheses, song or essay or sermon as form, codified strategy. **Not in standard NEO.** The Jason-specific case Clarence flagged in workshop.

Shared signal pool: `building_energy_priority`, `proactive_creator`, high `stability_priority`, high `truth_priority`, Q-T `ni`, Q-T `te`, `legacy_priority`, conviction signals paired with structured-output evidence, Q-3C1 `cost_drive`, and Q-3C1 `coverage_drive` (the build-as-service pattern). Each signal contributes independently to the architectural intensity; the deployed computation does not require paired firing.

The architectural openness signal cluster captures a creativity register the standard Big Five undercount: imagination that is alive but not free-floating, that wants to *land* in form before it counts as expression.

Post-CC-077 signal-pool discipline: Q-T cognitive-function signals no longer carry secondary Extraversion tags; `ne`, `se`, `te`, and `fe` each tag only their native disposition bucket. Likewise, the love-line signals `coverage_drive`, `partner_trust_priority`, `close_relationships_stakes_priority`, and `family_trust_priority` no longer tag into Agreeableness. They feed Soul through the Goal/Soul derivation; OCEAN uses them only where their native disposition evidence independently supports the trait read.

### 3.5 Render: lead with flavor, breakdown as expander

The user-facing Disposition Signal Mix section leads Openness with a **flavor read** that describes the dominant subdimensional shape. Architectural-led is intentionally asymmetric: it ships as the full three-sentence chain below, while the other flavors retain single-sentence forms.

- Intellectual-led: *"Your Openness leans intellectual — curious about ideas, drawn to abstraction and synthesis."*
- Aesthetic-led: *"Your Openness leans aesthetic — sensitive to beauty, mood, emotional weight, and the felt texture of things."*
- Novelty-led: *"Your Openness leans toward novelty — willing to experiment, change routines, and chase the unfamiliar."*
- Architectural-led: *"Your openness reads as structured and conceptual rather than novelty-seeking. The imagination register is alive, but it tends to look for form: frameworks, models, songs, systems, strategies, meanings, and long-arc patterns. This is openness under discipline — creativity that wants architecture."*
- Mixed (no dominant): *"Your Openness reads broadly — multiple registers active, no single dominant flavor."*

When intellectual and architectural Openness subdimensions tie or near-tie at the high band (`architectural ≥ 80` AND architectural is within `OPENNESS_FLAVOR_GAP_THRESHOLD = 15` points of the top), architectural-led wins the flavor selection. Architectural is the integration register — disciplined imagination resolving into structure — and is the more useful read when ties saturate.

The full 4-way breakdown lives behind an expander/footnote for users who want the detail. Default render is the flavor sentence only.

### 3.6 Investigation note for first OCEAN CC

The signal candidates listed in §3.1–3.4 are illustrative. The first CC implementing subdimensions must audit the existing OCEAN signal pool in `lib/ocean.ts` and the `SIGNAL_DESCRIPTIONS` table to confirm which signals carry enough variance to support 4 distinct subdimensional reads. If a subdimension is consistently thin (e.g., Aesthetic Openness rarely fires confidently across realistic users), the spec memo records the gap and a future surgical CC adds the targeted question — same pattern as CC-A → CC-B in the Goal/Soul/Give chain. **Re-tag existing signals first; add new measurement only when re-tagging cannot carry.**

Render note: the architectural-led three-sentence chain is self-contained; the generic per-band Openness closer is skipped only for this flavor to avoid duplicating the chain's second sentence in weaker form. Other flavors retain the band closer.

## 4. Agreeableness — Register Interpretation

Standard Big Five Agreeableness blends accommodation/harmony with loyalty/moral concern/service. The instrument's existing Agreeableness signal pool likely picks up both registers indistinguishably, which means a user with strong loyalty and protective care reads as "agreeable" in a way that may suggest social yielding they don't actually have.

The canonical interpretation rule:

**Agreeableness signals in this instrument predominantly express as loyalty, moral concern, service orientation, protective care, and relational obligation — not as accommodation, social softness, or conflict avoidance.**

This is because the Compass register (Q-S2 family/loyalty/compassion/mercy/faith) and the Love map already capture loyalty/care/service; those signals feed Agreeableness in this instrument's derivation. Standard Big Five batteries cleanly separate "I avoid conflict" from "I am loyal to my people"; this instrument does not, and the rendered prose must compensate by describing the register honestly.

Render guidance: when Agreeableness fires moderate-to-high, the prose should explicitly distinguish:

> Your Agreeableness signal sits high, but it likely expresses less as automatic accommodation and more as loyalty, moral concern, service, and protective care. In conflict, truth and responsibility may still outrank surface harmony.

When Agreeableness intensity is high (`≥ 80`), the rendered paragraph closes with the canonical sentence: *"The high signal is not 'softness'; it is care with a spine."* This sentence disambiguates loyalty/moral-concern from accommodation in one clean phrase.

Duplicate-phrase guard: the phrase *"truth and responsibility may still outrank surface harmony"* appears at most once in the rendered Agreeableness paragraph. Doubling it is a regression of the CC-077 duplicate-phrase fix.

Forbidden user-facing phrasings without this disambiguation: *"You are highly agreeable"* — too vague; reads as "you defer to others" by default.

If signal pattern *also* fires accommodation (low conviction signals, high `adapts_under_social_pressure`, low `high_conviction_expression`), the prose may include the accommodation register alongside the loyalty register. But loyalty/service is the canonical lead.

## 5. Emotional Reactivity — Confidence Handling

The trait formerly called Neuroticism is renamed **Emotional Reactivity** in this instrument's user-facing language (per memory of CC-037 register decisions). The label avoids pathologizing register and matches the actual measurement.

Specific canon for this trait:

### 5.1 Never render 0%

A computed intensity of exactly 0 must **never** appear in user-facing prose. Humans are not emotionally non-reactive; an intensity of 0 indicates measurement absence, not measured zero. The render canon translates intensity 0 to "**low or under-detected**" with the explicit proxy-signal note.

### 5.2 Proxy-signal disclosure

Emotional Reactivity is currently inferred largely through proxy signals (pressure-adaptation behaviors, `chaos_exposure`, conviction-under-cost, etc.) rather than direct measurement of affect. The rendered prose **must** disclose this:

> Emotional Reactivity appears low or under-detected. Because the instrument estimates this through proxy signals rather than direct measurement, it should be treated cautiously — the safer read is that your emotional reactivity may not be easily visible from the outside, not that the affect-channel itself is absent.

This is especially important for users who process distress through analysis, structure, privacy, composure, or delayed access — patterns where the proxy signals would systematically under-detect.

### 5.3 Future direct-measurement question

A surgical question targeting Emotional Reactivity directly (a Q-ER1 or similar) would close the proxy gap. **Out of scope for the first OCEAN CC.** Flagged here as a queued candidate for after subdimensions and integration land.

## 6. Render Register: Trait Names Internal, Narrative Names External

Per workshop decision (Both register), the user-facing report uses **everyday language** for the section narrative and reserves the OCEAN trait names for body text and an optional expander.

### 6.1 Section title and lede

Section heading: `## Disposition Signal Mix` (not "OCEAN," not "Big Five," not "Personality").

Lede paragraph uses narrative descriptors:

- Conscientiousness → *"how you organize your effort,"* *"how you carry responsibility and follow through,"* *"the discipline-and-structure register."*
- Openness → *"how you take in new things,"* *"the imagination register,"* *"how you engage with what could be."*
- Extraversion → *"how visibly your interior moves outward,"* *"the social-energy register,"* *"how broadcast vs interior your default is."*
- Agreeableness → *"how you weigh others alongside yourself,"* *"the loyalty/service register,"* *"the moral-concern register."*
- Emotional Reactivity → *"how visibly emotion moves through you,"* *"the affect-visibility register,"* *"how easily others can read your weather from outside."*

Moderate Extraversion (`40 ≤ intensity < 65`) uses the canonical band template: *"the outward-energy register reads as situational and measured — moving outward when the moment, role, or mission calls for it, while the interior process does not automatically broadcast itself."* This is a capacity read, not a personality verdict; it must not collapse back to the low-E phrasing.

### 6.2 Trait names appear after introduction

After the narrative name, the trait name follows between em-dashes or in a subsequent sentence:

> Your strongest signal is in *how you organize your effort* — Big Five Conscientiousness — registering as moderate-high. The instrument reads this as the discipline-and-structure register that supports building, finishing, and carrying responsibility.

### 6.3 Optional expander

Below the rendered section, an expander (or footnote) shows the per-trait intensity readout (0–100 band) and the relative dominance ranking, for users who want the psychometric mapping. Default closed; user opens to read.

### 6.4 Forbidden registers

In user-facing prose:

- **No percentages presented as scores.** "Your Conscientiousness is 65%" is forbidden display register.
- **No 100%-summing claims.** "Your traits sum to..." is forbidden.
- **No "personality verdict" framing.** "You are an introvert" is forbidden; "your social-energy register reads lower than average — much of the interior process may not automatically broadcast itself" is in-register.
- **No therapy-coded register on Emotional Reactivity.** "You are emotionally suppressed" is forbidden; "your emotional reactivity may not be easily visible from the outside" is in-register.

## 7. OCEAN ↔ Goal/Soul Composition

OCEAN does not stand alone. Each trait modifies how Goal and Soul become visible in the user's life. The composition rules below define the cross-references.

### 7.1 Conscientiousness × Goal

**High Conscientiousness strengthens Goal.** It is the disposition channel through which productive motion gets organized, sustained, and finished. A person with high Conscientiousness and high Goal score shows up as someone whose work is reliable, structured, follow-through-capable, and responsibility-carrying.

Render hook: when Conscientiousness ≥ 60 AND Goal ≥ 60 in `goalSoulGive.scores.goal`, the closing read or Movement read may reference the alignment: *"the disposition channel for your output (Big Five Conscientiousness moderate-high) reinforces the Work-line we read."*

Risk to flag: high Conscientiousness with thin Soul can entrench Striving — discipline reinforcing productive motion without the love-line to anchor it. Render prose should name this risk in Striving cases.

### 7.2 Openness × Soul (and Architectural Openness × Goal+Soul integration)

**Openness can enrich Soul** by keeping imagination, beauty, meaning, and possibility alive in how the user takes in the world. Non-architectural Openness (Intellectual, Aesthetic, Novelty) tends to feed Soul.

**Architectural Openness sits at the integration point** of Goal and Soul. It is the disposition channel through which imagination *resolves into structure*. A user with strong Architectural Openness in the Give quadrant is showing the early shape of the disciplined-imagination-as-purpose pattern Clarence named in workshop.

Render hooks:

- Aesthetic/Intellectual Openness moderate-high + Soul score moderate-high → reinforce Soul read.
- Architectural Openness moderate-high + Give quadrant → strong Generative Builder candidate (CC-070 pattern), regardless of `building_motive_*` signal availability.
- Architectural Openness moderate-high + Striving quadrant → flag as potential Generative-trapped-in-Striving — the discipline is there for purpose but the love-line hasn't yet anchored it.

### 7.3 Extraversion × Soul visibility

**Low Extraversion may make Soul less visible to others, even when internally strong.** A user with high Soul and low Extraversion may experience the love-line privately while reading externally as steady or cool. The instrument's prose should name this asymmetry when it fires.

Render hook: when Extraversion ≤ 35 AND Soul ≥ 60, the prose may include: *"much of the love-line you carry may not automatically broadcast itself outward; care, conviction, and the things that matter to you may need deliberate translation to be visible to others."*

This is the Parallel Lives precursor in many cases — strong Soul that simply doesn't show.

### 7.4 Agreeableness × Soul interpretation

**Agreeableness colors how the Soul-line is read.** High Agreeableness with high Soul typically expresses as protective care, loyalty, and service — the love-line that shows up *for people*. Low Agreeableness with high Soul can express as moral conviction, cause-driven service, or loyalty to truth/justice over relational accommodation.

Render hook: in Soul-led quadrants (Longing or Give), Agreeableness modulates the *direction* of love-line expression. The composition rule: high A → relational care; low A + high Soul → cause/justice/truth-as-love.

### 7.5 Emotional Reactivity × pressure response

**Low Emotional Reactivity (or under-detected Emotional Reactivity) can preserve steadiness under cost** but may also conceal grief, longing, tenderness, or need. The instrument's existing Weather/Fire body-map cards already read pressure response; OCEAN Emotional Reactivity adds the dispositional layer.

Render hook: when Emotional Reactivity ≤ 30 (or under-detected) AND any high-pressure signal fires (`high_pressure_context`, `chaos_exposure`, conviction-under-cost), the prose may include: *"the steadiness reads as composure; the cost it carries may not be visible from outside, including possibly to you."*

## 8. OCEAN ↔ Body-Map Landing Points

Each OCEAN trait has natural landing points on the body-map cards. The cross-references below define which trait modifies which card's prose.

| Trait | Primary card | Secondary card | Tertiary |
|---|---|---|---|
| Openness | Lens (Eyes) | Path (Gait) | Compass (Heart) when Aesthetic |
| Conscientiousness | Spine (Gravity) | Path (Gait) | Voice (Conviction) when discipline of belief |
| Extraversion | Voice (Conviction) | Heart (Compass) when externally expressed | — |
| Agreeableness | Heart (Compass) | Trust (in Love map) | Path (Gait) when service-oriented |
| Emotional Reactivity | Weather (Nervous System) | Fire (Immune Response) | — |

Render canon: each card's existing prose may carry an OCEAN-modifier sentence when the trait's intensity is moderate-or-higher and the card's read corroborates. Modifier sentences are short (≤1 sentence per card per trait), labeled in code as a kicker, and never replace the card's primary read.

Example: a user with moderate-high Conscientiousness AND a Spine card reading "high responsibility" gets a kicker on the Spine card: *"The disposition channel for this — Big Five Conscientiousness moderate-high — reinforces the spine read."*

This integration is **out of scope for the first OCEAN CC** (which focuses on math/label fix and subdimensions). The body-map composition lands in a follow-on CC after the first lands.

## 9. Render Specifications Summary

Pulling §2, §6, and prior decisions together, the canonical Disposition Signal Mix render shape:

```
## Disposition Signal Mix

[One-line disclaimer about independent-trait + relative-weight framing]

[Lede paragraph using narrative names: "Your strongest signal is in *how you organize your effort* — Big Five Conscientiousness — registering as moderate-high…"]

[Per-trait paragraph for each of the 5 traits, in dominance rank order. Each paragraph:
 - Opens with narrative name + trait name
 - Names the intensity band (under-detected / low / moderate / moderate-high / high)
 - Adds register interpretation (Agreeableness as loyalty/service, etc.)
 - References the cross-card or Goal/Soul composition where it fires]

[For Openness specifically: lead with the subdimensional flavor sentence (intellectual / aesthetic / novelty / architectural / mixed). Subdimension breakdown lives in optional expander below.]

[Closing integration paragraph tying disposition to the Goal/Soul read]

[Optional expander: per-trait intensity readout 0-100 + dominance ranking]
```

Section length: 5–8 paragraphs, longer than Closing Read because it covers five traits. Position in report: after Goal/Soul/Give synthesis section (Closing Read + Movement), before Applied Maps (Work, Love, Give, Conflict, Growth Path).

## 10. Guardrails

In addition to general guardrails, the OCEAN/Disposition layer adds:

1. **Do NOT lead the report with OCEAN.** The hierarchy in §1 is binding. Body Map → Goal/Soul/Give → Disposition → Applied Maps. Disposition Signal Mix renders after the synthesis layer.
2. **Do NOT render 100%-summing percentages.** Per §2.3.
3. **Do NOT render trait names in section heading.** "Disposition Signal Mix," not "OCEAN" or "Big Five." Per §2.4 and §6.1.
4. **Do NOT render Emotional Reactivity as 0% or as affect-channel absence.** Per §5.1.
5. **Do NOT collapse Agreeableness signals into "you are agreeable" without the loyalty/service register disambiguation.** Per §4.
6. **Do NOT undercount Architectural Openness.** Existing measurement may systematically under-detect this register; the first CC re-tags existing signals to address it. Per §3.4 and §3.6.
7. **Do NOT moralize on low/high traits.** "You should be more open" is forbidden. Disposition is observation, not prescription.
8. **Do NOT use OCEAN as a personality verdict.** Big Five is a translation layer for the deeper outputs, not the headline. Per §1.
9. **Do NOT add new questions to address measurement gaps without first auditing whether existing signals can be re-tagged.** `feedback_minimal_questions_maximum_output` canon applies.
10. **Do NOT speak engine-layer math in user-facing prose.** "Your Openness intensity is 67" is forbidden display register; "your Openness reads moderate-high" or "your imagination register is alive" is in-register.

## 11. Open Questions for Canon Review

1. **Should the "Big Five" or "Big 5" reference appear at all in user-facing prose?** Current draft uses it parenthetically alongside narrative names. Alternative: drop the framework reference entirely; users who want the psychometric anchor see it in the optional expander only.
2. **Subdimension granularity for the other four traits.** Openness gets 4 subdimensions per workshop. Should Conscientiousness, Extraversion, Agreeableness, Emotional Reactivity also get subdimension splits in v2? Or is the user case for splitting only architectural for now?
3. **Direct measurement of Emotional Reactivity.** The proxy-signal approach is honest but limited. A surgical Q-ER1 question would close the gap. Queue for a future CC, or live with the proxy-only read indefinitely?
4. **Cohort calibration.** Like the Goal/Soul/Give thresholds, the trait intensity bands (under-detected / low / moderate / moderate-high / high) are stake-in-the-ground defaults. Once cohort data exists, percentile-of-cohort cuts may produce more honest reads.
5. **The Architectural Openness subdimension is novel to this instrument.** Its signal cluster is illustrative in §3.4. If the first CC's audit reveals the signal cluster doesn't carry confidently across realistic users, what's the fallback — collapse to a 3-way Openness split, or commit to the surgical question that lands the architectural register directly?

## 12. Implementation Sequencing

Proposed CC chain to land this architecture:

1. **OCEAN-A (CODEX-NNN):** Math + label fix only. Independent-intensity rendering, "Disposition Signal Mix" section title, the disclaimer line, Emotional Reactivity measured-zero guard, dominance-ranking sentence, "trait names internal, narrative names external" register pass. Single-file scope: `lib/ocean.ts` math + `lib/renderMirror.ts` render. Mechanical, ~CODEX scope.
2. **OCEAN-B (CC-NNN):** Openness subdimensions + Agreeableness register interpretation. Audit existing signal pool, re-tag into subdimensions, render flavor sentence + optional expander. Add Agreeableness disambiguation prose hooks. Larger CC.
3. **OCEAN-C (CC-NNN):** OCEAN ↔ Goal/Soul composition + body-map landing points. Wire kickers and prose hooks per §7 and §8. Audit additions for cross-reference assertions (e.g., low Extraversion + high Soul renders the visibility caveat).
4. **OCEAN-D (CODEX-NNN, optional):** Direct Emotional Reactivity question if proxy approach proves too thin. Adds one question to `data/questions.ts` plus signal extraction. Deferred until OCEAN-A through OCEAN-C ship and we observe whether the proxy gap is large enough to warrant the question slot.

CC-070 (Goal/Soul/Give pattern catalog + Movement layer) is currently in flight. The OCEAN chain should fire **after** CC-070 returns and is committed, to avoid working tree contention on `lib/types.ts`, `lib/identityEngine.ts`, and `lib/renderMirror.ts`.

## 13. Bottom-line Design Principle

Do not let OCEAN become the center of Who Are You.

Use it as a translation layer. The instrument should not say:

> *"You are 26% open."*

It should say:

> *"Among the disposition signals detected by the instrument, your imagination register reads moderate. Its expression appears structured, conceptual, and architecture-seeking rather than novelty-seeking or emotionally spontaneous."*

That protects the insight without flattening the person.
