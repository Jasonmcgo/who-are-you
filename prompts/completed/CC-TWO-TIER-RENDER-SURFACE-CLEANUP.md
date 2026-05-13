# CC-TWO-TIER-RENDER-SURFACE-CLEANUP

## Objective
Introduce a `renderMode: "user" | "clinician"` switch and migrate borrowed-framework and engine-internal vocabulary off the user-facing surface, so the LLM prose pass that follows has a clean substrate to rewrite on top of. This is a relocation, not a deletion.

## Sequencing
First in the three-CC sequence: TWO-TIER → LLM-PROSE-PASS-V1 → KEYSTONE-RENDER. The suppression list this CC enforces is a prerequisite for the voice of the next two.

## Scope
Add `renderMode` to the report render pipeline. Default `"user"`; `"clinician"` accessible via debug/audit path. In user view, suppress the items in the suppression list below; in clinician view, render byte-identical to current behavior. Replace each suppressed term with the user-facing equivalent if one exists, or drop the term if no replacement is needed.

## Suppression list (user view only)

Borrowed-system labels:
- "Big Five [trait]" as section headers in Disposition Signal Mix. Use plain-language section titles drawn from existing engine prose (e.g. "How you organize your effort," "How you weigh others alongside yourself," "How you take in new things").
- "INTJ" / "ESFP" / "ISFJ" etc. in body prose and dialog examples. The masthead's "Possible surface label" line is the only place a four-letter code may appear, with its existing disclaimer. Remove "I'm an INTJ" from the appendix dialog example.
- Raw Jungian function names (Ni, Te, Fe, Si, etc.) as user-visible labels.
- "OCEAN" / "Big Five" anywhere user-visible.

Engine-internal phrases (user view, prose anywhere):
- "composite read"
- "disposition channel"
- "signal cluster"
- "derived from"
- "the model detects"
- "reinforces the Work-line"
- "substrate"
- "canonical" (in user prose)
- "register" used technically (e.g. "the long-arc-architect register" — proprietary translations like "the pattern-reader" stay)
- "driver" / "support" outside the Core Signal Map table

Verdict-phrase rework (user view):
- "Goal-led Presence," "Ungoverned Movement," "Lightly Governed Movement," "White-Knuckled Aim," "Open-Handed Aim": keep in the chart label and the dedicated Risk Form / Quadrant lines. Do not echo as standalone verdicts in other prose sections.
- "Faith Shape," "Faith Texture," "Primal Question": suppress entirely from user view; preserve in clinician view.

Stays in both views (proprietary translations, not borrowed systems):
- Body card names (Lens / Eyes, Compass / Heart, Hands / Work, Gravity / Spine, Trust / Ears, Weather / Nervous System, Fire / Immune Response, Conviction / Voice, Path / Gait).
- "Pattern-reader," "structurer," "discernment gift," "costly-conviction gift," "pattern-discernment gift," etc.
- Grip Pattern names (Worth, Belonging, Security, Recognition, Control, Purpose, Safety).
- "Goal," "Soul," "Aim," "Grip" axis names.

## Do not
- Change chart math, the rendered chart SVG, or any numeric value.
- Modify Open Tensions or the underlying engine reads.
- Remove information from clinician view — this is relocation, not deletion.
- Touch Journey Map / Movement / Disposition raw values.
- Bump synthesis3 / gripTaxonomy LLM cache hashes.
- Re-architect body card structure or render order.
- Modify gripReading.score, §13 engine math, or the matrix-tension classifier.
- Introduce new prose templates — that's CC-LLM-PROSE-PASS-V1's job.
- Touch the Keystone Reflection — that's CC-KEYSTONE-RENDER's job.
- Modify the Movement / Grip / Risk Form metric blocks (the labels in those blocks stay; the prose echoes elsewhere are what gets cleaned).
- Add new dependencies.

## Audit gates
- Three fixtures (Jason / Cindy / Daniel) render in user mode with zero occurrences of any suppression-list term.
- The same three fixtures render in clinician mode byte-identical to pre-CC baseline.
- The full 35-fixture sweep stays green.
- Grep across the user-mode markdown for each suppression-list term returns zero hits.
- Disposition Signal Mix section headers no longer say "Big Five [trait]."
- The "What this is good for" appendix dialog example no longer contains the literal string "I'm an INTJ."
- `tsc` + lint clean; no new dependencies.
- Cost: $0 (deterministic relabeling).

## Deliverables
- Files changed list.
- Before/after excerpts of the Disposition Signal Mix headers (user mode).
- Before/after excerpts of the appendix dialog example (user mode).
- Suppression-list grep report against Jason / Cindy / Daniel user-mode renders.
- Clinician-mode byte-identity confirmation.
- 35-fixture sweep status.
