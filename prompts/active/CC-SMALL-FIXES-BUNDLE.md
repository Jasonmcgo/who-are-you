# CC-SMALL-FIXES-BUNDLE

## Objective
Five small surface fixes that need to land before any wider share. Each is targeted, deterministic, and independent of the larger CC-LIVE-SESSION-LLM-WIRING / CC-PROSE-V2 work. Bundled for efficiency.

## Sequencing
Independent of the other CCs in the current batch. Can land in parallel with CC-LIVE-SESSION-LLM-WIRING, CC-KEYSTONE-USER-MODE-UNCONDITIONAL, and CC-DISPOSITION-COLLAPSE-DEFAULT.

## Scope — five sites, each with a specific fix

### Fix 1 — Cindy pronoun consistency
**Problem:** Cindy's user-mode report uses third-person "Cindy" / "Cindy's" in three places where Jason's and Daniel's reports use "you" / "your". Sites in Cindy's render:
- Keystone paragraph: "Of the five stakes **Cindy** ranked highest, **Cindy** marked 5 (...) as concrete costs **Cindy** would bear for this belief"
- Compass Pattern-in-motion: "**Cindy** may believe in what is beyond human control without using it to excuse what remains within human responsibility"
- Path Pattern-in-motion: "**Cindy's** sensing register is most alive in what's actually here — the conversation in the room, the work in Cindy's hands..."

**Fix:** Replace name-interpolation with consistent second-person pronouns ("you" / "your") in user mode for these template sites. Audit must verify across Jason / Cindy / Daniel / unmapped that no third-person name reference appears in the user-mode rendered prose (masthead "For: {name}" stays — that's intentional name display, not narrative).

### Fix 2 — Hands template consistency for non-Jason archetypes
**Problem:** Jason's Hands card renders the full template (section heading, "**What you build and carry**" sub-header, italic opener, Strength, Growth Edge, Under Pressure, Practice, italic explanation, italic canon closing line, "Hands is what your life makes real" closing). Cindy's and Daniel's Hands cards are missing the "**What you build and carry**" sub-header and the italic opener (Daniel's case), and missing the italic canon closing line (both Cindy and Daniel).

**Fix:** Apply the full template structure to all archetypes. Each archetype's Hands card must include, in order:
- `### Hands — Work`
- `**What you build and carry**`
- `*[archetype-specific italic opener]*`
- `**Strength** —` paragraph
- `**Growth Edge** —` paragraph
- `**Under Pressure** —` paragraph (combining health and pressure sub-paragraphs)
- `**Practice** —` paragraph
- `*[archetype-specific italic explanation]*`
- `*[archetype-specific italic canon closing line]*`
- `*Hands is what your life makes real. Work Map is where that making may fit.*`

The italic canon closing line per archetype (already established by CC-HANDS-CARD):
- Architect (Jason): "*The work is to translate conviction into structure that others can see, use, and revise.*"
- Caregiver (Cindy): "*The work is not to care less. It is to let love become sustainable enough to last.*"
- Steward (Daniel): "*The work is not to abandon what has endured. It is to let what has endured remain alive enough to update.*"
- Unmapped: pick a generic canon line consistent with the archetype's voice or omit gracefully.

### Fix 3 — Canon-line scarcity report-wide
**Problem:** Jason's report contains "translate conviction into visible, revisable, present-tense structure" in three places: Executive Read, Closing Read, and the final pull quote at the bottom. The Hands card has the rewritten variant ("structure that others can see, use, and revise"). Target was one occurrence per report.

**Fix:** Each archetype's canonical closing line appears in the Executive Read only. The Closing Read and the final pull quote use different phrasings or remove the echo entirely.

The Executive Read is the canonical home for the archetype's closing line. The Closing Read and the final pull quote may reference the same theme but must not echo the canonical phrase verbatim. Suggested approach: rewrite the Closing Read and final pull quote to gesture at the same shape in different words.

Apply this across all three archetype canon lines:
- Architect canon: "translate conviction into visible, revisable, present-tense structure" — once in Executive Read only.
- Caregiver canon: "let love become sustainable enough to last" — once in Executive Read or the Hands closing only.
- Steward canon: "let what has endured remain alive enough to update" — once in Executive Read or the Hands closing only.

The audit must grep each canon phrase against the user-mode rendered report and assert ≤1 occurrence per archetype-canon-phrase per report.

### Fix 4 — "the the" typo
**Problem:** Jason's Keystone paragraph contains "You did not mark any of **the the** trust sources you ranked highest as potentially capable of revising this belief." Double "the". This is in the engine template, not in any LLM rewrite.

**Fix:** Find the engine template producing this string and remove the duplicate article. Likely a string concatenation issue where two phrases were joined with an extra "the". Audit must verify no "the the" sequence appears in user-mode rendered markdown for any cohort fixture.

### Fix 5 — Disposition stutter persistence
**Problem:** The "*how you organize your effort* — How you organize your effort — registering as high" stutter pattern persists in all three current user-mode renders despite CC-SUBSTITUTION-LEAK-CLEANUP's L4 fix. The fix substituted "Architectural How you take in new things" with "Architectural curiosity" but the lead-in pattern "*how you X* — How you X —" still appears in all five trait paragraphs.

**Fix:** Rewrite the disposition prose template (in user mode) so the trait-rename substitution doesn't double-print. Two viable approaches:
- (a) Replace the lead-in italic with a different format that doesn't reference the trait label twice — e.g. "Your strongest signal — registered as high — is in *how you organize your effort*. The discipline-and-structure register is a defining strand…"
- (b) Suppress the second occurrence post-rename by detecting the doubled phrase and collapsing.

Author's call which approach. Audit must verify no "*how you [X]* — How you [X] —" pattern appears in user-mode rendered prose for any cohort fixture or any of the five traits.

Note: this fix coexists cleanly with CC-DISPOSITION-COLLAPSE-DEFAULT — the disposition prose still exists behind the disclosure, and the prose inside the disclosure should also be stutter-free.

## Do not
- Touch LLM rewrites or cache.
- Modify clinician-mode rendering.
- Modify chart math, metric values, or non-scoped sections.
- Modify any engine calculation.
- Add new dependencies.
- Bump cache hashes (synthesis3, gripTaxonomy, proseRewriteLlm, keystoneRewriteLlm — none).
- Generalize the small fixes into a broader mechanism. Five targeted fixes; no general substitution layer.
- Touch React surface beyond what's needed for parity with the markdown export.

## Audit gates
For each fix, verified across Jason / Cindy / Daniel cohort fixtures in user mode:

1. **Pronoun consistency:** Zero occurrences of third-person name references in user-mode rendered prose (excluding the masthead `For: {name}` display).
2. **Hands template consistency:** Each archetype's Hands card contains the full template structure listed in Fix 2 — sub-header, italic opener, Strength, Growth Edge, Under Pressure, Practice, italic explanation, italic canon closing line, Work Map distinction line. Verified by section structure regex.
3. **Canon-line scarcity:** For each archetype canon phrase, exactly one occurrence in user-mode rendered report.
4. **"the the" typo:** Zero occurrences of `\bthe the\b` (case-insensitive) in user-mode rendered markdown.
5. **Disposition stutter:** Zero occurrences of any `\*how you [^*]+\* — How you [^*]+ —` pattern in user-mode rendered prose.

Plus:
- Clinician-mode rendered markdown for these sites is byte-identical to pre-CC baseline (pronoun, Hands, canon-scarcity, typo, stutter fixes are user-mode-only where applicable; for the "the the" typo, fix in clinician too since it's an engine-template typo that has no reason to live anywhere).
- 41-fixture sweep stays green.
- tsc + lint clean.
- Cost: $0 (deterministic).

## Deliverables
- Files changed list.
- Before/after excerpts for each of the five fixes (Jason fixture; Cindy for fixes 1 and 2; Daniel for fix 2).
- Audit results per fix across Jason / Cindy / Daniel.
- Clinician-mode byte-identity confirmation (with the "the the" typo correction as the one exception that applies in both modes).
- 41-fixture sweep status.
