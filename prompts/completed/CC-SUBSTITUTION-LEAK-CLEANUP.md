# CC-SUBSTITUTION-LEAK-CLEANUP

## Objective
Fix six specific grammatical leaks in user-mode rendered markdown caused by CC-TWO-TIER-RENDER-SURFACE-CLEANUP's text-substitution mask. The mask correctly removed banned terms but left ungrammatical prose where the surrounding template assumed the banned term was present.

## Sequencing
Independent of CC-PROSE-V1-RENDER-FIRE-DIAGNOSIS and CC-KEYSTONE-RENDER-FIRE-FIX. Recommend running after both so the LLM splices are firing correctly before verifying the leak fixes don't conflict with rewritten content.

## Scope
Six specific leak sites identified in Jason live render review 2026-05-12:

**1. Core Signal Map row 2 cell 1 (surface label).**
Currently renders `|, provisional |` — the INTJ strip leaked into a table cell, leaving an orphan comma.
Expected user-mode behavior: either omit the surface-label row entirely from the user-mode Core Signal Map (the masthead already shows the four-letter code with its disclaimer), or render the cell as "provisional" with no leading comma.

**2. Work Map composite paragraph.**
Currently renders "Your points toward strategic / architectural work." — "composite read" was stripped without sentence rebuild.
Expected: rewrite the surrounding engine template so the user-mode version doesn't depend on "composite read" being present. Suggested: "Your answers point toward strategic / architectural work."

**3. Keystone field label (clinician-mode-only concern after KEYSTONE-FIRE-FIX lands).**
Currently in user mode renders "How you take in new things to revision: Unsure" — Openness rename leaked into a metadata field label. If CC-KEYSTONE-RENDER-FIRE-FIX has landed, this field-list is gone from user mode and the leak is moot there. Verify the clinician-mode field label still reads "Openness to revision" (i.e. the rename should not corrupt clinician-mode audit metadata).

**4. Disposition Openness mid-paragraph.**
Currently renders "Architectural How you take in new things paired with the giving shape suggests…" — the Openness trait rename leaked into adjective-position prose.
Expected: rewrite the engine template for this Disposition sub-paragraph so the user-mode version reads as grammatical English. The trait rename should not fire in adjective position, OR the surrounding sentence should not depend on the trait noun.

**5. Disposition Conscientiousness paragraph.**
Currently renders "The for your output we read elsewhere — output is structured and load-bearing rather than ad-hoc." — orphan article + dangling fragment from the strips of "disposition channel" and "reinforces the Work-line".
Expected: rewrite the engine template for this sentence so the user-mode version is grammatical without depending on the stripped phrases.

**6. "What this is good for" appendix Faith bullet.**
Currently renders "the and composing in your read tell you which register is operating now" — the Faith Shape + Faith Texture strip left a "the and" fragment.
Expected: rewrite the surrounding sentence so the user-mode version is self-contained. Suggested direction: name the function the original phrasing did ("the way you hold belief under pressure") without using the suppressed terms.

## Do not
- Expand the TWO-TIER suppression list. The terms that are banned remain banned.
- Add a generic context-aware substitution mechanism. Do the six specific fixes; generalization is a later CC if needed.
- Touch clinician mode for these sites — clinician mode must continue to render the original engine terms unchanged. Each fix is user-mode-only (except for #3 above, which is verifying clinician integrity).
- Modify the LLM rewrites, cache, or splice logic for body cards or Keystone (separate CCs).
- Touch the body cards (Lens / Compass / Hands / Path) — those are owned by CC-PROSE-V1-RENDER-FIRE-DIAGNOSIS.
- Touch the Keystone section beyond verifying #3 (Keystone is owned by CC-KEYSTONE-RENDER-FIRE-FIX).
- Bump synthesis3 / gripTaxonomy / handsCard / keystoneRewrite / proseRewriteLlm cache hashes.
- Add new dependencies.

## Rules

### 1. Each fix is targeted and context-specific
There is no general mechanism. Each of the six leak sites has its own root cause (table-cell strip, sentence-template assumption, field-label rename, adjective-position rename, multi-strip fragment, dual-rename fragment). Each fix engages the specific cause.

### 2. Clinician mode preserves original
For each fix, the clinician-mode markdown for that site must remain byte-identical to pre-CC baseline. The user-mode fix is additional behavior; the clinician path is unchanged.

### 3. Grammatical English audit gate
For each fix, the audit must include a readability check that confirms the user-mode prose reads as grammatical English, not just absence-of-banned-terms grep. Per the "Banlist-grep ≠ readability check" feedback from TWO-TIER, the grep gate alone is not sufficient. Automated checks should include: orphan articles ("the and", "The for"), repeated phrases within 80 characters, dangling prepositions at sentence-end, sentence fragments missing a verb.

### 4. No regression on TWO-TIER suppression
The fixes must not reintroduce any of the suppressed terms in user mode. If a fix uses an alternative noun or adjective to avoid the trait-name leak, the new word must not itself be borrowed-system vocabulary (no "Big Five", no MBTI codes, no raw Jungian function names).

### 5. Symmetric for all three archetypes
Each fix must be verified for Jason, Cindy, and Daniel fixtures. A fix that produces grammatical English for Jason but breaks Cindy or Daniel is not landing.

## Implementation notes
- Most fixes will involve rewriting the surrounding engine template (lib/identityEngine.ts or relevant render module) to produce user-mode-friendly prose that doesn't assume the suppressed term is present.
- Some fixes may use a separate user-mode template alongside the existing clinician-mode template, with the mask choosing between them at render time.
- The Core Signal Map cell fix may require either a separate user-mode value for the surface-label cell, or omitting the surface-label row entirely from the user-mode Core Signal Map (the masthead already shows the surface label with its disclaimer, so the table row may be redundant in user mode).

## Audit gates
For each of the six sites, in Jason / Cindy / Daniel user-mode renders:
- The site reads as grammatical English (manual three-fixture eyeball + automated check for: orphan articles, dangling prepositions, repeated phrases within 80 characters, sentence fragments).
- No banned term from the TWO-TIER suppression list is reintroduced.
- The site changed visibly from the post-TWO-TIER baseline.

Plus:
- Clinician mode for each of the six sites is byte-identical to pre-CC baseline.
- 38-fixture sweep stays green.
- tsc + lint clean.
- Cost: $0 (deterministic template fixes; no LLM regen).

## Deliverables
- Files changed list.
- Before/after user-mode excerpts for each of the six sites, Jason fixture.
- Cindy and Daniel fixture excerpts for any site where the prose differs by archetype.
- Grammatical-English audit results for each site across all three fixtures.
- Clinician-mode byte-identity confirmation per site.
- Automated breakage-pattern check results (orphan articles / dangling prepositions / repeated phrases / fragments).
- 38-fixture sweep status.
