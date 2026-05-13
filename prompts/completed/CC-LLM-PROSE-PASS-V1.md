# CC-LLM-PROSE-PASS-V1

## Objective
Move the report from structurally accurate engine prose to human-quality interpretive prose, without changing the underlying read. The engine continues to produce structured reads, the canon-line inventory, and don't-cross constraints; an LLM pass compresses, removes hedge stacking, lands one canonical phrasing per insight, and adds shape-specific texture where called for.

## Sequencing
Runs after CC-TWO-TIER-RENDER-SURFACE-CLEANUP. That CC defines what the user surface is allowed to show; this CC rewrites what it shows.

## Scope (in)
- Lens / Eyes
- Compass / Heart
- Hands / Work
- Path / Gait
- Closing Read (only if the rewrite preserves canon and doesn't expand scope; defer if uncertain)

## Do not touch
- Chart math, chart SVG, or any numeric value.
- Open Tensions section — the questions are the point.
- Raw evidence traces / cross-signal listings.
- Audit/debug metadata.
- Journey Map calculations.
- Disposition Signal Mix (header cleanup happened in CC-TWO-TIER).
- Work Map vocational example arrays.
- Love Map register definitions.
- Keystone Reflection — CC-KEYSTONE-RENDER owns it.
- Mirror-Types Seed.
- Conflict Translation.
- The "What this is good for" appendix.
- Movement, Grip, Risk Form metric blocks.
- Synthesis cross-card read (V2 candidate, not V1).
- Engine internals — this is a render-time prose layer.
- Cache hashes for synthesis3 / gripTaxonomy or any existing LLM module unrelated to this layer.

## Rules

### 1. Hedge cap
Each scoped section may use at most one softening phrase ("may," "appears," "tends," "likely," "leans toward"). Prefer one section-level humility frame over sentence-level hedging. The masthead already declares "a possibility, not a verdict" — the prose can speak more clearly inside that frame.

Bad: "Your processing pattern leans toward the pattern-reader. When this is operating in its native register, you tend to read the situation through the pattern-reader and execute through the structurer."

Better: "You read the situation through the pattern-reader and execute through the structurer. That sequence is most of how this shape moves through a week."

### 2. Engine-language banlist (zero hits in scoped sections)
- composite read
- disposition channel
- signal cluster
- derived from
- the model detects
- reinforces the Work-line
- substrate
- canonical (in user prose)
- register used technically
- driver / support outside Core Signal Map
- Big Five trait names as headlines
- Faith Shape / Faith Texture
- Primal Question

If CC-TWO-TIER landed correctly these should already be gone — the banlist here is a safety net for prose this CC might newly generate.

### 3. Canon-line scarcity
Each canon phrase appears at most once across the full report.

Preserve the strongest archetype line in the Executive Read. Do not echo it in body cards or in the Closing Read.

Phrases to enforce one-occurrence on:
- "visible, revisable, present-tense structure" (Jason canon)
- "grounded, legible, and free" (cross-archetype frame)
- "the work is not to care less; it is to let love become sustainable enough to last" (Cindy canon)
- "the work is not to abandon what has endured; it is to let what has endured remain alive enough to update" (Daniel canon)
- The Executive Read opening line for each archetype

A canon-line inventory ships as part of the deliverable with grep counts per phrase.

### 4. Speak from inside the conclusion
The prose should commit. It should sound like it knows what it's saying.

Bad: "Your composite read points toward strategic / architectural work."
Better: "You are built for work where the hidden structure has to be made visible before anyone can act wisely."

Bad: "The disposition channel for your output reinforces the Work-line we read elsewhere."
Better: "You organize effort well. Pressure turns into structure rather than noise."

### 5. Shape-specific texture
Each rewritten card includes at least one concrete image or behavior that reads as if drawn from the archetype's actual life. Generalize rather than tying to specific fixtures.

Architect examples: writing the strategy memo nobody asked for; building the model that explains the noise; refining a structure past usefulness; holding a conclusion until it can be revised in public.

Caregiver examples: noticing what the room needs before anyone names it; the recurring meal, the standing call; the structural fix that removes a recurring strain on someone you love; staying close when the work would be easier from a distance.

Steward examples: the standard followed when no one is watching; the precedent honored across decades; the system that doesn't ask to be reinvented every morning; the quiet faithfulness that institutions only notice in its absence.

### 6. Preserve meaning
The rewrite must not make the report more flattering, more clinical, or more dramatic. Same read; more alive.

If the engine produced a hedged read, the rewrite may commit at the section level via the frame but must not invent confidence the engine didn't claim. If the engine read a tension, the rewrite still names the tension — does not soften it.

### 7. Voice differentiation across archetypes
Jason, Cindy, and Daniel should sound different. Not one template with swapped nouns.

- Jason: long-arc, architectural, knowledge-protective, mastery-controlled. An architect's read of an architect.
- Cindy: present-tense, relational, family-protective, belonging-through-usefulness. A caregiver's read of a caregiver.
- Daniel: precedent-bound, structural, faith-protective, security-through-structure. A steward's read of a steward.

A diff between Jason's and Cindy's rewritten Lens cards should show substantially different sentence shapes and concrete imagery, not just substitution of "long-arc" for "present-tense."

## Implementation notes
- Render-time LLM call wrapping the existing engine prose for the four scoped cards. Engine produces structured reads + canon-line inventory + don't-cross constraints; LLM receives those as system context and produces the user-facing rewrite.
- Deterministic where feasible: temperature 0, fixed prompt, fixed system.
- Cache by report hash (composite of all relevant engine inputs for the four cards). Cache invalidates only when an upstream engine value changes.
- Target cost per report: under $0.05 at current pricing.

## Audit gates
- Three-fixture audit (Jason / Cindy / Daniel) with full diffs of each scoped card, before vs after.
- Hedge count per scoped section: before vs after (target ≤1 per section).
- Engine-language banlist grep: zero hits across scoped sections.
- Canon-line repetition report: each enforced canon phrase appears exactly once.
- Voice-differentiation check: Jason's Lens vs Cindy's Lens vs Daniel's Lens — different sentence shapes, different imagery, same architectural depth.
- Engine read preserved: same archetype routing, same gifts named, same growth edges named (not the same sentences — the same identifications).
- 35-fixture sweep stays green for non-scoped sections (byte-identical for Open Tensions, chart, metrics, Work Map, Love Map, Keystone, appendix, Mirror-Types Seed, Conflict Translation).
- `tsc` + lint clean.

## Deliverables
- Files changed list.
- Before/after excerpts for each scoped card, all three fixtures.
- Hedge count table (before/after, per section, per fixture).
- Banlist grep report.
- Canon-line repetition report.
- Voice-differentiation excerpts (Jason vs Cindy vs Daniel for the same card).
- Non-scoped section byte-identity confirmation.
- Cost-per-render measurement (average across three fixtures).
