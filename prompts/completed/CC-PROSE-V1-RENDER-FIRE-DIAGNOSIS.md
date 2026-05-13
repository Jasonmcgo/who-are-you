# CC-PROSE-V1-RENDER-FIRE-DIAGNOSIS

## Objective
Diagnose and fix the splice failure that causes Compass and Path LLM-rewritten prose to NOT appear in user-mode rendered markdown, even though the cache contains the rewrites and the cache-lookup audit reports 100% hit rate. Lens and Hands rewrites currently fire correctly in live renders; Compass and Path do not.

## Sequencing
Independent of CC-KEYSTONE-RENDER-FIRE-FIX and CC-SUBSTITUTION-LEAK-CLEANUP. Can land in any order; recommend running before SUBSTITUTION-LEAK-CLEANUP so the verification-by-render baseline is fresh.

## Scope
The splice logic in lib/renderMirror.ts that inserts cached LLM rewrites into the four scoped sections (Lens, Compass, Hands, Path) in user mode. Lens and Hands splices fire correctly — preserve them unchanged. Compass and Path splices need diagnosis: most likely a section-boundary detection mismatch where the regex / marker / heading pattern used to identify those two sections differs from what Lens and Hands match against.

## Do not
- Modify the LLM prompt, prompt builder, or cache contents.
- Re-prime the cache or bump cache hashes (synthesis3 / gripTaxonomy / handsCard / keystoneRewrite / proseRewriteLlm — none).
- Touch Lens or Hands splice logic (they're working).
- Modify chart math, metrics, Open Tensions, or any non-scoped section.
- Generalize the splice mechanism into a new abstraction; the four cards already have two working precedents.
- Touch React surface (KeystoneReflection.tsx etc.) — this is a markdown-pipeline fix.
- Add new dependencies.
- Re-run the cohort regen (no new LLM calls needed).

## Rules

### 1. Diagnose before patching
Identify the specific reason Compass and Path splices fail. Possibilities:
- Section heading regex / marker doesn't match the actual heading text for Compass and Path
- Section boundary detection consumes wrong content range
- Splice insertion targets a different anchor than Lens/Hands use
- Cache key composition differs in a way that causes a lookup miss at render time despite audit showing hit

Document the actual root cause in the report-back. Surface-level "fix and move on" is not acceptable for a diagnosis CC.

### 2. Symmetric splice for all four cards
Once the root cause is identified, the fix should make Compass and Path use the same splice mechanism that Lens and Hands use — not a parallel branch with subtle differences. The diagnosis should reveal what's special about the working two; the fix should generalize so all four behave the same.

### 3. Preserve Lens and Hands
The current Lens and Hands splices land correctly in live renders. Whatever the fix is, it must not regress these.

### 4. Live-render verification
The audit gate must verify the splice fires in the production-pipeline rendered user-mode markdown, not just in the cache lookup. Generate the user-mode markdown end-to-end for Jason, Cindy, and Daniel; diff each of the four scoped sections against the pre-PROSE-V1 baseline; confirm each section's content differs.

## Implementation notes
- The cache is correct; the rewrites are correct. Don't regenerate.
- The fix is likely small — a regex, a marker string, a boundary calculation, or an anchor lookup.
- This is a diagnosis CC: the report-back should explain what was wrong and why, not just describe the fix.

## Audit gates
- All four scoped cards (Lens, Compass, Hands, Path) in user-mode rendered markdown contain content that differs from the pre-PROSE-V1 baseline. Verified by section-level diff for Jason, Cindy, and Daniel fixtures.
- Specific text from each card's cache entry appears in the rendered output (verbatim string match against the cache entry for at least one canonical phrase per card per fixture).
- Lens and Hands user-mode renders are unchanged from post-PROSE-V1 state (regression check).
- Clinician mode renders byte-identical to pre-CC baseline.
- 38-fixture sweep stays green.
- tsc + lint clean.
- Cost: $0 (no LLM regen; pure splice fix).

## Deliverables
- Files changed list.
- Root-cause analysis: what was wrong with the Compass and Path splices and why Lens and Hands worked.
- Before/after rendered-markdown excerpts for Compass and Path (Jason fixture, user mode).
- Section-level diff confirmation for all four scoped cards (verbatim match against cache).
- 38-fixture sweep status.
