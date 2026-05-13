# CC-KEYSTONE-RENDER-FIRE-FIX

## Objective
Fix the rendering pipeline so the Keystone Reflection section in user-mode markdown emits the LLM-rewritten paragraph and does NOT emit the engine field-list. Currently the cache contains the LLM rewrite, but the user-mode rendered Keystone still shows the field-list ("Likely value:" / "Wording temperature:" / "How you take in new things to revision:" / "Unsure") plus the original engine prose paragraph below it.

## Sequencing
Independent of CC-PROSE-V1-RENDER-FIRE-DIAGNOSIS and CC-SUBSTITUTION-LEAK-CLEANUP. Can land in any order. Recommend after PROSE-V1-RENDER-FIRE-DIAGNOSIS so the splice mechanism fix patterns are fresh.

## Scope
The Keystone section emission in lib/renderMirror.ts. Two changes needed in user mode:
1. Suppress the engine field-list bullets (Likely value / Wording temperature / Openness-to-revision-or-substituted-equivalent).
2. Replace the engine prose paragraph with the LLM-rewritten paragraph from lib/cache/keystone-rewrites.json.

Both must fire together. In clinician mode, both the field-list and the engine prose paragraph render byte-identical to pre-CC baseline.

## Do not
- Modify the LLM prompt, prompt builder, or cache contents.
- Re-prime the cache.
- Touch the React surface (KeystoneReflection.tsx) — its disclosure pattern is working; this is a markdown-pipeline fix.
- Modify the audit metadata format in clinician mode.
- Touch any other section.
- Bump cache hashes (synthesis3 / gripTaxonomy / etc.).
- Generalize the suppression-and-splice mechanism beyond Keystone.
- Add new dependencies.

## Rules

### 1. Audit the actual rendered output, not the cache lookup
The original KEYSTONE-RENDER audit reported 21/21 cache hits and zero field-list-string occurrences. The live render still has the field-list — TWO-TIER had renamed "Openness to revision" to "How you take in new things to revision" before the KEYSTONE audit's literal-string grep ran, so the audit passed while the structurally-equivalent field-list remained on user surface. This fix's audit must verify the absence of the field-list as a rendered structure (any bullet list following the belief quote), not as a literal-string grep.

### 2. Verbatim belief quote preserved
The user-mode Keystone must open with the user's exact belief statement, quoted verbatim. The LLM rewrite in cache already enforces this; the splice must preserve it.

### 3. Engine paragraph removed in user mode
The engine prose paragraph that currently appears below the field-list ("Your selections place this belief inside Knowledge, Peace, Faith, and Honor, with Knowledge as the value most directly at risk for it…") must NOT appear in user mode. The LLM-rewritten paragraph replaces it.

### 4. Clinician mode unchanged
Clinician-mode markdown for the Keystone section is byte-identical to pre-CC baseline: field-list + engine paragraph + (no LLM paragraph). This is the audit/debug reversibility floor.

### 5. Same diagnosis discipline as CC-PROSE-V1-RENDER-FIRE-DIAGNOSIS
Identify what's actually wrong with the Keystone splice. The same root cause may be operating here as in the Compass/Path PROSE failure — section-boundary detection, anchor matching, or two-tier branch fall-through. Document the cause in the report-back.

## Implementation notes
- Cache is correct; rewrites are correct. Don't regenerate.
- The React surface change in the original KEYSTONE-RENDER (collapsible disclosure for TagRows) is working; do not modify it. This fix is purely the markdown emission path.
- Likely fix: the two-tier branch in renderMirror.ts that's supposed to emit either the LLM paragraph (user mode) or the field-list + engine paragraph (clinician mode) is currently falling through to clinician-mode behavior even when user mode is requested. Diagnose the branch logic.

## Audit gates
For Jason / Cindy / Daniel user-mode Keystone:
- Contains the verbatim belief quote (exact-match).
- Does NOT contain any bullet matching `- **Likely value:**`, `- **Wording temperature:**`, or any `- **[anything] to revision:**` pattern.
- Does NOT contain the literal string "Unsure" anywhere in the Keystone section.
- Does NOT contain the engine prose paragraph that starts with "Your selections place this belief inside" (or its archetype-equivalent for Cindy/Daniel).
- Contains the LLM-rewritten paragraph from cache (verbatim match against the keystone-rewrites.json entry for that fixture).

For Jason / Cindy / Daniel clinician-mode Keystone: byte-identical to pre-CC baseline.

- 38-fixture sweep stays green for non-Keystone sections.
- Render-diff against pre-KEYSTONE-RENDER baseline shows Keystone visibly changed in user mode for all 21 fixtures with cache entries.
- tsc + lint clean.
- Cost: $0 (no LLM regen; pure pipeline fix).

## Deliverables
- Files changed list.
- Root-cause analysis: what was wrong with the Keystone two-tier branch.
- Before/after rendered-markdown for Jason Keystone (user mode).
- Field-list-structure-absence verification for all 21 fixtures with cache entries.
- LLM-paragraph-presence verbatim match verification (cache entry text appears in render).
- Clinician-mode byte-identity confirmation.
- 38-fixture sweep status.
