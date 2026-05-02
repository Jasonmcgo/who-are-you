# Engine Prose Tuning Round 2 — Notes

*Surfaced 2026-04-26 from real-user testing. Madison's and Michele's sessions both produced LLM rewrites (ChatGPT) that surfaced the same prose-layer improvements. Capturing here for a future CC after CC-023's hotfix lands.*

*Probable label: **CC-025 — Engine Prose Tuning Round 2** (or similar; numbering depends on what else lands in between).*

*Sequenced AFTER CC-023 (hotfix), CC-022d (file drop), CC-022e (SVG integration), CC-022g (Inner Constitution alignment with spec §10).*

---

## Pattern 1 — Four-sentence Simple Summary closer

**Current** (CC-022b's THESIS_TEMPLATES + GIFT_DANGER_LINES):

> *"{Name}'s gift is {capability}. {Name}'s danger is {capability} {temporal}.*
> *{Name} is a {shape descriptor} whose growth edge is not {assumed answer}, but {actual structural answer}."*

**Proposed evolution** (from ChatGPT's rewrite of Michele's session):

> *"{Name}'s gift is {capability}.*
> *{Name}'s growth is {next-stage capability}.*
> *{Name} does not need {what user might assume they need}.*
> *{Name} needs {what user actually needs}."*

The four-sentence form expands "not X, but Y" into two sentences, giving the user-correction beat its own line. That last sentence (*"{Name} needs..."*) is where the line lands — it should carry the most specificity.

Example from ChatGPT's Michele rewrite:

> *"Michele's gift is seeing what else could be true. Her growth is choosing what must now be done. She does not need fewer possibilities. She needs one finished act of love at a time."*

The pattern: gift → growth-direction → don't-need → actually-need. The last sentence does the real work; the prior three set it up.

**Implementation hook**: extend `THESIS_TEMPLATES` to be 4-line templates instead of 2-line. Per (function × top-compass) keying, with gift / growth / don't-need / needs slot-fills.

## Pattern 2 — Allocation Gap softening

**Current** (T-013 prose):

> *"You named {value} as among your most sacred values. Your money appears to flow mostly to {top-2 spending}. The model reads a gap — between what you say is sacred and where your discretionary resources actually go. This may be exhaustion, ambition, season, or a real conflict between stated and lived values. The model doesn't read which. Does this gap feel familiar?"*

**Proposed evolution** (from ChatGPT's rewrite of Michele's session):

> *"You named {value} as among your most sacred values. Your money appears to flow mostly to {top-2 spending}. That does not mean hypocrisy. The model cannot know motive.*
>
> *It could mean: exhaustion, a difficult season, needed self-care, social bonding, old habits, or a real gap between stated priority and lived allocation.*
>
> *The only fair question is: does this feel true, partially true, or not true at all?"*

Three improvements:

- **Explicit "not hypocrisy"** disclaimer at the top, before the interpretation list. Currently the constraint-first interpretation rule from `allocation-rules.md` is honored at the policy level but the per-instance prose can still feel mildly prosecutorial. Naming "not hypocrisy" upfront defuses that.
- **"The model cannot know motive"** as explicit epistemic acknowledgment. Strong prose move; mirrors the canonical *"the model proposes — you confirm"* posture but in a sharper register.
- **Enumerated interpretations** (6 items: exhaustion / season / self-care / social bonding / old habits / real gap). Our current 4-item list is good; the 6-item list is better because it covers more non-prosecutorial reads before the "real gap" interpretation.
- **Three-state question** (*"true / partially true / not true"*) that maps onto the live page's Yes/Partially/No affordances. Better UX coherence than the current open-ended question.

**Implementation hook**: rewrite T-013 / T-014 / T-015 user_prompt strings in `lib/identityEngine.ts`. Update `tension-library-v1.md` canon entries to match.

## Pattern 3 — "Growth Edges" register over "Traps"

**Current**: section heading is "Your Top 3 Traps."

**Proposed**: rename to "Your Top 3 Growth Edges" (or just "Growth Edges").

Reasoning: "Traps" reads as accusatory or warning-coded. "Growth Edges" reads as developmental — what the user could become more of. The spec v2 §10 uses "Growth Edges" for the same section. ChatGPT's rewrite uses the same renaming.

The actual prose for each item stays the same; only the section header changes.

**Implementation hook**: small change in `MirrorSection.tsx` and the markdown export (`lib/renderMirror.ts`). One line in each.

## Pattern 4 — Section renaming alignment with spec §10

ChatGPT's rewrite uses different section names than our current Mirror:

| Current Mirror section | ChatGPT / spec §10 register |
|---|---|
| Your Top 3 Gifts | Michele's Top Gifts |
| Your Top 3 Traps | Growth Edges |
| What Others May Experience | What Others May Experience (same) |
| When the Load Gets Heavy | (folded into Growth Edges or kept) |
| Your Next 3 Moves | (folded into Growth Edges) |
| A Synthesis | The Cleanest Summary (or kept) |

Some of these are mostly cosmetic (capitalization, possessive "Your" vs name); others are structural (folding "When the Load Gets Heavy" + "Your Next 3 Moves" into "Growth Edges"). The spec v2 alignment work in CC-022g should consider adopting these sectional changes.

## Pattern 5 — The "What Others May Experience" sharper close

**Current** ends with:

> *"The translation is rarely about doing less of yourself — it is usually about being more legible."*

**Proposed evolution** (from ChatGPT's rewrite):

> *"{Name} does not need to become less {themselves}. {Name} needs to become more legible. That is the difference between changing your nature and translating it."*

The added line (*"That is the difference between changing your nature and translating it"*) reframes the move from "do something different" to "translate what you already are." Stronger compression.

## Pattern 6 — Path · Gait Love compression

**Current** (Path Love section, multi-paragraph):

> *"Love, for this shape, is generative — you tend to bring more energy, more possibility, more curiosity into the relationships that matter to you than is strictly required. ... [continues for several sentences]"*

**Proposed evolution** (from ChatGPT's Michele rewrite):

> *"For Michele, love may mature through staying."*

That's a one-sentence compression of the entire section's argument. We don't lose the longer prose, but we add a section closer that lands the central idea in one sentence per shape.

**Implementation hook**: add a one-line compression closer to each Path · Gait sub-section (Work / Love / Give), keyed by shape. Like the gift/danger compression but for the Path section.

## Architectural note — when LLM substitution lands

These patterns are achievable rule-based for v1, but LLM substitution will produce them more naturally. When CC-???-future ships LLM substitution, the prompt should require:

1. The 4-sentence Simple Summary close with the gift / growth / don't-need / needs structure.
2. Explicit "not hypocrisy" + "cannot know motive" framing on Allocation Gaps.
3. "Growth Edges" register over "Traps."
4. One-line compression closers for Path sub-sections.
5. The translation/legibility framing for What Others May Experience.

Keep this list as the prompt-design reference when the LLM CC eventually drafts.

---

## Sequencing

These prose-tuning items defer until:

1. **CC-023** ships (Q-T loop fix + Top 3 Gifts dedup + Compass/Gravity prose distinctness).
2. **CC-022d** ships (file drop with design-spec-v2 + SVG assets).
3. **CC-022e** ships (SVG integration into Map + survey screens).
4. **CC-022g** ships (Inner Constitution alignment with spec §10 — would naturally include the section renaming from Pattern 4).

Then a focused prose-tuning CC (probable label CC-025 or CC-026) addresses Patterns 1, 2, 3, 5, 6 above. The 4 (section renaming) likely lands as part of CC-022g.

These are NOT in CC-023's scope. CC-023 is structural bug fixes only.
