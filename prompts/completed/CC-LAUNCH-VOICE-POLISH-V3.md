# CC-LAUNCH-VOICE-POLISH-V3

## Objective
Expand the LLM rewrite scope to cover the seven Part A sections deferred from CC-LAUNCH-VOICE-POLISH (Part B only). Today, only the four body cards (Lens / Compass / Hands / Path) and the Keystone Reflection get LLM-quality prose. The rest of the report's prose is engine-generated and reads accordingly. This CC adds LLM rewrite for the sections that get the most reader attention.

## Sequencing
Independent of CC-PROSE-LEAK-CLEANUP-V3 (leak fixes) and any design studio Hands visual work. Land after CC-PROSE-LEAK-CLEANUP-V3 so the prose surface is clean before adding new LLM-rewritten content on top.

## Scope — expand LLM rewrite to 7 additional sections

### Section 1 — Executive Read
**Currently:** single bold-italic pull-quote sentence rendered from engine template.
**Target:** bold pull-quote line at top (preserved) PLUS 2-3 sustained-prose paragraphs that develop the read. Reference shape per Jason's earlier polish reference: opens with a confident "You are…" framing, then a second paragraph naming the growth edge with concrete texture.

### Section 2 — Your Core Pattern
**Currently:** engine prose ("The pattern you keep living inside has [value] at its center…") — procedural register.
**Target:** declarative voice that opens with the value-at-center idea but delivers it with confidence and texture. Jason's polished sample: *"Faith sits at the center of your shape. Not faith as decoration. Not faith as sentimental softness. Faith as the thing you are trying to keep true in the world."* Same shape for each archetype with archetype-appropriate substance.

### Section 3 — What Others May Experience
**Currently:** engine template with multiple "your willingness to bear cost may read as…" hedges.
**Target:** committed second-person prose that names the perception gap honestly. Cap hedges to ≤2 in this section.

### Section 4 — When the Load Gets Heavy
**Currently:** engine template describing the shape's pressure-mode tightening.
**Target:** more textured prose that names the failure-mode shapes specifically — the "private-fact closure," the "responsiveness-as-collapse," etc. — in the second-person committed voice.

### Section 5 — A Synthesis
**Currently:** engine template that re-states the shape and lists growth-without rules.
**Target:** one paragraph cross-card synthesis that genuinely synthesizes — names what the cards together say that no single card says alone. Followed by the existing "To keep X without Y" parallel-line close (deterministic, don't rewrite that part).

### Section 6 — Closing Read
**Currently:** engine template ("Your verbs and your nouns appear to be pulling in the same direction…").
**Target:** archetype-appropriate closing line that lands as the report's last word. Three archetype canon lines already exist:
- Architect: "translate conviction into visible, revisable, present-tense structure"
- Caregiver: "let love become sustainable enough to last"
- Steward: "let what has endured remain alive enough to update"

Use the canon line in the closing read, set up by 2-3 sentences of context that earn the canon line. Preserve "Keep this shape honest as the seasons turn" as the final beat.

### Section 7 — Path / Gait Work / Love / Give triptych
**Currently:** engine paragraphs that are reasonably good but read as engine prose with formulaic structure ("Work, for this shape, is…" / "Love, for this shape, is…" / "Giving, for this shape, is…").
**Target:** LLM rewrite of each paragraph in archetype voice. Same three-section structure (Work / Love / Give) but the prose inside each section reads as written for the reader's shape, not as templated.

## Sequencing of LLM scope expansion
The seven sections are not independent. Recommended approach:
1. **New LLM prompts** per section, in `lib/proseRewriteLlm.ts` or a sibling file. Each prompt receives the relevant constitution data + archetype + engine fallback prose as context, returns the rewritten paragraph(s).
2. **Cache files** for each new section (similar to `lib/cache/prose-rewrites.json` pattern).
3. **`resolveScopedRewritesLive` extension** to handle the new section IDs in the same parallel resolution pattern.
4. **`/api/report-cards` JSON contract expansion** to include the new fields.
5. **React surface integration** — each section's component reads `liveScopedRewrites.[sectionName]` and falls back to engine prose when null.
6. **Cohort cache prime** via a build script (~$1-2 total LLM spend).

## Do not
- Modify the engine math, the engine signal extraction, or any computation. This is render-layer only.
- Touch the existing 5 LLM-rewritten sections (Lens / Compass / Hands / Path / Keystone) beyond what's needed to extend the resolver pattern.
- Change the LLM cache key composition.
- Bump existing cache hashes for synthesis3 / gripTaxonomy / etc.
- Add LLM scope to deeper body cards (Gravity / Trust / Weather / Fire / Conviction). They stay engine for v1; defer to V4 if needed based on cohort feedback.
- Add LLM scope to engine sections that are purely structural (Core Signal Map table, Movement section bullets, Disposition panel, Work Map, Love Map, Conflict Translation, Mirror-Type Seed, Open Tensions, "What this is good for" appendix). Those stay engine.
- Touch admin / clinician-mode rendering — clinician keeps full engine output.
- Add new dependencies.

## Rules

### 1. Bold pull-quote + sustained prose coexist in Executive Read
Per the canon set in CC-LAUNCH-VOICE-POLISH, the bold-italic pull-quote at the top of Executive Read is preserved as a tight summary line. The sustained-prose paragraphs sit BELOW it. Both/and, not either/or.

### 2. Hedges capped per section
Each rewritten section caps soft hedges ("may," "appears," "tends," "likely," "leans toward") at ≤2 occurrences. Section-level humility frame ("a possibility, not a verdict" in the masthead) does the work; the body prose can speak more clearly inside that frame.

### 3. Engine-language banlist (zero hits in rewritten sections)
- composite read
- disposition channel
- signal cluster
- the model detects
- reinforces the Work-line
- substrate
- canonical (in user prose)
- register used technically
- 3 C's (per existing canon)
- Faith Shape / Faith Texture
- Primal Question
- driver / support outside Core Signal Map

### 4. Canon-line scarcity preserved
The archetype canon lines (architect / caregiver / steward) appear at most twice across the full report — once in Executive Read, once in either Hands closing OR Closing Read (not both). If the Hands closing already uses the canon variant, Closing Read uses a different phrasing that gestures at the same shape.

### 5. Three-fixture voice differentiation
Run Jason / Cindy / Daniel through the rewrite pipeline. Each archetype produces visibly different prose for the same section. Jaccard similarity on word sets between archetypes' rewrites for the same section: <0.65.

### 6. Engine prose stays as the immediate render
The React surface loads with engine prose first; LLM prose swaps in silently when `/api/report-cards` resolves. Same pattern as existing 5 LLM sections — no flash of empty content, no kicker indicator, graceful fallback to engine prose on failure.

### 7. Per-render cost target
Adding 7 sections to the LLM resolver brings the worst-case cost of a new-user first render from ~$0.05-0.25 to ~$0.20-0.50. Still well within $40 budget envelope. Subsequent renders for the same engine body remain $0 via runtime cache.

## Implementation notes
- Each section's LLM prompt should receive: the user's archetype, the relevant compass/lens/gifts/risk-form context, the engine-fallback prose as a "do not repeat this — this is the engine version, write a better one in the same voice as Lens/Compass/Hands" reference.
- The cohort cache prime regenerates one canonical-shape rewrite per archetype × section. Subsequent on-demand resolution handles non-fixture inputs.
- The 7 sections can land incrementally if simpler — fire Executive Read alone first, then expand. Or land all 7 together if executor capacity allows.

## Audit gates
- New audit `tests/audit/launchVoicePolishV3.audit.ts`:
  - 7 new sections render LLM prose for cohort fixtures (cache hit) — verified by signature-paragraph match per archetype.
  - Engine fallback works for non-fixture inputs that fail LLM resolution.
  - Banlist grep: zero hits across new LLM-rewritten sections.
  - Hedge count: ≤2 per section per fixture.
  - Archetype canon-line scarcity: ≤2 occurrences per report.
  - Voice differentiation: Jaccard < 0.65 between Jason / Cindy / Daniel for same section.
- Existing 53+ audits stay green.
- `tsc --noEmit` clean.
- `npm run lint` clean.
- Cost: ~$1-2 for cohort prime; ~$0.20-0.50 per new-user first render in production.

## Deliverables
- Files changed list.
- Before/after excerpts for each of the 7 sections × 3 fixtures.
- Banlist grep report (zero hits).
- Hedge density per section per fixture.
- Voice-differentiation excerpts.
- Cost breakdown for cohort prime.
- 53+7 audit sweep status.

## Why this CC matters now
The five LLM-rewritten sections currently land beautifully — the Hands card especially carries archetype-specific texture that reads as actual prose. The seven engine-prose sections sit alongside them and read by comparison as procedural. For a 100-professional soft-share, the inconsistency is more noticeable than uniform engine prose would be — careful readers notice the gap between "this paragraph reads like it was written for me" and "this paragraph reads like it was generated." Closing that gap brings the whole report up to the LLM-quality voice that's already proven viable on the existing 5 sections.
