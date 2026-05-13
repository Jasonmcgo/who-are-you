# CC-KEYSTONE-RENDER

## Objective
Replace the metadata-heavy Keystone Reflection with a human interpretive paragraph that engages the user's actual belief statement. The current render exposes the engine ("Likely value," "Wording temperature: Unsure," "Openness to revision: Unsure") at the exact moment the report should be most engaged with what the user said.

## Sequencing
Independent of CC-TWO-TIER and CC-LLM-PROSE-PASS-V1 in terms of code touch. Can land in parallel with either, but the suppression list from CC-TWO-TIER is a prerequisite for the prose voice (no "register" technically, no Big Five labels, etc.).

## Scope
The Keystone Reflection section only. Engine inputs available: the user's exact belief statement (Q-V1 freeform); the value-cluster mapping the engine produced; the user's cost-surface markings (which stakes they ranked as willing-to-bear for the belief); the user's correction-channel selections; the archetype.

Replace the field-list ("Likely value / Wording temperature / Openness to revision") with prose that engages the wording.

## Do not
- Show "Unsure" metadata on the user surface (move to clinician/debug view).
- Evaluate whether the belief is true.
- Overstate certainty about what the belief means.
- Become preachy, devotional, or clinical.
- Add a value-judgment about the belief's content.
- Reach for stock theological language ("faith journey," "spiritual walk," "deep convictions").
- Substitute paraphrase for quotation — the user's exact wording is the anchor.
- Touch any other section.
- Bump cache hashes for synthesis3 / gripTaxonomy.
- Editorialize about the religion or tradition the wording draws from.
- Add new dependencies.

## Rules

### 1. Anchor on the user's exact wording
The paragraph opens with the user's belief statement quoted verbatim. No paraphrase substitution. The quote is the load-bearing artifact.

### 2. Engage the wording itself
The prose names what the wording reveals — its tone, its theological register, what it suggests about how the user holds the belief. Not "this is doctrine" or "this is sentiment." The specific texture of the sentence the user wrote.

For "There's a loving God for all that wish": notice the invitation in "for all that wish," the framing of God as loving (not sovereign, judging, abstract), the implication that faith is received rather than coerced.

### 3. Place inside the value cluster
Name which values the engine placed the belief inside (e.g. Knowledge, Peace, Faith, Honor). Do not list them in a metadata row — fold them into the prose so the placement carries weight.

### 4. Engage the cost surface
The user marked specific stakes (close relationships, money, reputation, career, etc.) as concrete costs they'd bear for the belief. Name that cost surface in plain language. Land the point: the belief is not decorative; it belongs to the part of the user that would pay a price.

### 5. Name the growth edge specifically
Not "you should weaken the belief." Not "you should hold it more loosely." Engage how the user carries the belief — humility in expression, openness to revision, the relationship between the belief's centrality and the way it's spoken.

### 6. Register
Plain, warm, non-preachy. Closer to a thoughtful friend's read than a clinician's note. No devotional cadences ("blessed," "sacred journey"), no clinical hedging ("the subject's belief structure"), no flattery ("what a profound belief").

### 7. Length
One paragraph or two short paragraphs. The Keystone is not a long-form essay; it's a moment of warmth.

### 8. Quality target (Jason archetype)
> "There's a loving God for all that wish."
>
> This is not a cold doctrinal sentence. It carries invitation. The God you named is loving, and the phrase "for all that wish" suggests faith as something received rather than forced, offered rather than imposed.
>
> The instrument places this belief inside Knowledge, Peace, Faith, and Honor. You do not appear to hold faith as an escape from thought, but as something that must remain truthful, humane, and livable. You also marked a wide cost surface around it: close relationships, money, reputation, and career. In plain terms, this belief is not ornamental. It belongs to the part of you that would pay a price.
>
> The growth edge is not to weaken the belief. It is to keep the way you carry it as humble as the sentence itself. A belief this central deserves courage, but also tenderness in how it is spoken.

## Implementation
- Render-time LLM call scoped to the Keystone Reflection.
- Inputs: exact belief wording, value-cluster mapping, cost-surface markings, correction-channel selections, archetype.
- System prompt enforces the rules above.
- Temperature 0; deterministic.
- Cache by belief-wording hash + cross-signal hash.
- Target cost per render: under $0.01.
- Audit metadata ("Likely value," "Wording temperature," "Openness to revision") relocates to clinician/debug view; not deleted.

## Audit gates
- Three fixtures (Jason / Cindy / Daniel) with full Keystone Reflection before/after.
- Jason output meets the quality target above when read by Jason in his own report.
- Cindy and Daniel outputs read with archetype-appropriate texture (caregiver / steward register) without losing the core function: engage the wording, place inside values, name cost surface, name growth edge.
- User-facing render contains zero "Unsure" labels, zero "Likely value:" field, zero "Wording temperature:" field, zero "Openness to revision:" field.
- Clinician-mode render still contains the audit metadata, byte-identical to pre-CC baseline for the metadata fields specifically (the prose paragraph is new).
- The user's belief statement appears verbatim in the rendered prose.
- Cost-surface stakes the user actually marked appear by name in the prose (not paraphrased away).
- Value cluster the user actually scored appears in the prose.
- 35-fixture sweep stays green for non-Keystone sections (byte-identical).
- `tsc` + lint clean.

## Deliverables
- Files changed list.
- Before/after Keystone excerpts for Jason, Cindy, Daniel.
- Confirmation that no user-facing "Unsure" metadata remains.
- Clinician-mode audit-metadata retention confirmation.
- Verbatim-quote check (does the exact wording appear in each rendered paragraph?).
- Cost-surface name check (do the specific stakes appear?).
- Value cluster name check (do the specific values appear?).
- 35-fixture sweep status.
- Cost-per-render measurement.
