# CC-LAUNCH-VOICE-POLISH

## Objective
Bring the report's prose to the polish level required to send to 100+ professional organizations and friends. The live render is structurally correct but reads as "high-quality beta": too hedged, occasional pronoun bugs, redundant phrases, engine-internal parentheticals visible on the user surface, expandable sections that read as more procedural than human. This CC closes those gaps via an expanded LLM rewrite pass + surgical template fixes. All visuals (SVG charts, donut, body-card structure) stay byte-identical.

## Sequencing
Independent of CC-HEADER-NAV-AND-EMAIL-GATE and any other queued work. Recommended to land **after** the header/email/permalink CC so the share-readiness package is complete in one push.

## Scope

### Part A — Expand the LLM rewrite scope
Today's `/api/report-cards` and `/api/render` resolve LLM rewrites for: Lens, Compass, Hands, Path, Keystone. Expand to also include:

- **Executive Read** — keep the bold pull-quote at top as a tight summary (1 sentence), but follow with 2-3 sustained-prose paragraphs that develop the read. Jason's edited reference: *"You are a long-arc pattern reader with steady faith. You see the shape before the room has finished naming the problem. You are drawn to structures that can carry conviction across time: frameworks, systems, strategies, songs, institutions, and durable commitments. Your growth edge is not trying harder. It is becoming more visible…"*
- **Your Core Pattern** — replace the procedural opening ("The pattern you keep living inside has Faith at its center: when something has to give, that is what you protect first") with declarative prose. Jason's reference: *"Faith sits at the center of your shape. Not faith as decoration. Not faith as sentimental softness. Faith as the thing you are trying to keep true in the world."* Then the second paragraph develops the pattern-reader / structurer sequence in textured prose.
- **What Others May Experience** — tighten the hedges; let the voice commit.
- **When the Load Gets Heavy** — same.
- **A Synthesis** — same.
- **Closing Read** — same; preserve the canon line.
- **Path — Gait Work / Love / Give triptych** — already long, but the voice can tighten.

### Part B — Surgical template fixes
These are deterministic bugs the LLM pass doesn't need to address — fix in the engine templates directly.

1. **Pronoun leak: `JasonDMcG` in third person.** The live render has several instances of `JasonDMcG ranked highest, JasonDMcG marked...` and `JasonDMcG's shape, the meaningful allocation gap...`. Sweep the engine templates and replace all third-person name interpolations on user-mode surface with second-person `you` / `your`. The Cindy/Daniel/JasonDMcG pronoun leak we diagnosed earlier was claimed clean against cohort fixtures but is clearly present in live renders. Fix it. This is the **same bug class** as the Cindy issue from before — but live sessions hit different template paths than cohort fixtures.

2. **Drop "(formerly X)" parentheticals from user surface.**
   - "Open-Handed Aim (formerly Wisdom-governed)" → "Open-Handed Aim"
   - "Ungoverned Movement (formerly Free movement)" → "Ungoverned Movement"
   - Any other `(formerly ...)` patterns in user-mode rendering.
   - Clinician mode keeps the parentheticals (audit metadata).

3. **Fix "In health: In health, you build..." duplicate in Hands.** The engine prose template has a duplicated lead-in. Strip the redundant prefix. The polished version reads cleanly as "In health, you build to make truth more usable…" without the "In health:" before it.

4. **Singularize "Mirror-Types Seed" → "Mirror-Type Seed"** (the section name). This is a small literal-string change.

5. **Remove the MBTI surface-label disclaimer line from the masthead.** Currently renders: *"Possible surface label: INTJ. Type labels are surface descriptions only — your shape is not reducible to a four-letter code. The Lens reading above is the actual interpretation."* — drop this entire line from user-mode rendering. The masthead's other italic lines (the shape-led-by line and the "you can confuse..." caveat) stay. Clinician mode preserves the surface-label line for audit reference.

7. **Hide the Drive Distribution donut chart on the Path / Gait section.** The donut SVG currently renders with truncated labels and doesn't add information beyond what the existing text bullet list ("Distribution: Building & wealth 30%, People, Service & Society 39%, Risk and uncertainty 31%") already provides. Suppress the donut SVG block from user-mode rendering on the Path / Gait section — wrap in a conditional or CSS `display: none` so the code stays intact and can be re-enabled later. Clinician mode continues to render the donut for audit reference. The "Distribution" text line and the "Claimed drive" line above it stay visible in both modes.

6. **Add an inline "expand to unpack" affordance on the architect-shape failure-mode line in the masthead.** The line *"You can confuse having absorbed more context with having earned more authority to conclude"* should be expandable. When clicked, it reveals a paragraph of explanation that unpacks the distinction.

   Implementation: wrap the line in a `<details>` element with the italic line as the `<summary>` and an explanation paragraph in the body. Use the existing `<details>` styling pattern from the Disposition section so the visual language is consistent. Browser-native semantics, no JS required.

   Per-archetype explanation text:

   **Architect / jasonType:**
   > Pattern-reading is a gift — you see the strategic shape before the room has finished forming it. The trap is sliding from "I see what's happening" into "I should decide what to do about it." Those are different things. Authority to conclude comes from relationship to the affected parties, accountability for outcomes, having been asked, having earned trust over time, having stakes. Absorbing more context than the room doesn't, by itself, earn that authority. The check-question, when you feel the pull to call a shot: am I in the position that gets to make this call, or did I just take in more of the situation than the people who are?

   **Caregiver / cindyType:**
   > A different version of this same line applies to caregiver shapes: present-tense care is a gift, but the closeness you have to people can slide into "I see what they need, so I should decide for them." The check is similar: am I deciding for someone, or alongside them? Has the relationship actually given me the authority to act on their behalf, or only the closeness to see what they're going through? Defer to the caregiver-archetype writer (LLM) to refine this paragraph in their voice.

   **Steward / danielType:**
   > For stewardship shapes, the same pattern: holding precedent and continuity gives you genuine insight into what's worked and what hasn't — but that insight isn't, by itself, authority over what changes next. The check: am I the keeper of this thing, or am I assuming that being the longest-running observer makes me the right voice on its next chapter? Defer to the steward-archetype writer (LLM) to refine.

   **Unmapped:** generic version of the architect text without the pattern-reader-specific opener; or skip the expand affordance for unmapped shapes if the line itself is suppressed for them.

   In clinician mode: the `<details>` renders open by default for audit visibility (or as a flat paragraph, author's call). User mode renders closed by default.

5. **Hedge density reduction.** Per the engine-vs-human prose diagnostic memory, hedges ("appears to," "tends to," "may," "leans toward," "likely") pile up across the report. The earlier audit gate was ≤3 per section. Tighten to **≤2 per section as a soft target** for the LLM rewrites; the deterministic engine templates outside LLM scope can stay as they are for v1 but should be reviewed in a future pass.

### Part C — Keep these visuals byte-identical
- **Trajectory chart SVG** (the 50° arc with legend) on the Movement section.
- **Disposition bar chart SVG** inside the collapsed `<details>` panel.
- **Drive donut chart SVG** on Path / Gait.
- **All body card structure** — Lens/Compass/Hands/Gravity/Trust/Weather/Fire/Conviction → expandable Path/Gait card.
- **All metric rows** (Goal/Soul/Direction/Aim/Grip numbers, Risk Form line, Quadrant line, etc.) — engine math untouched.
- **Open Tensions interactive Yes/Partially/No buttons** — keep the interactive feedback affordance; only tighten the prose around them.
- **Share This Reading block** (Print / Copy / Download buttons).

## Do not
- Remove or modify any SVG chart, image, or visual element.
- Add the "Edited for launch voice and reduced noise" footer or similar editorial-meta text.
- Change the engine math, the engine signal extraction, or any computation.
- Remove the bold-italic pull-quote in Executive Read entirely. Keep one tight summary sentence at the top, then add sustained prose paragraphs underneath. Both/and, not either/or.
- Touch the admin re-render path or clinician-mode rendering. Clinician mode preserves all engine parentheticals and the original hedge density (audit fidelity).
- Bump cache hashes (synthesis3 / gripTaxonomy / proseRewriteLlm / keystoneRewriteLlm — none).
- Rewrite the Open Tensions to drop the Yes/Partially/No interactive buttons. Keep the form behavior.
- Expand LLM scope to body-card sections beyond what's listed (don't add Gravity / Trust / Weather / Fire / Conviction to LLM rewrite yet — defer to V2).
- Remove the "What this is good for" appendix or change its 10 entries.
- Add new dependencies.

## Rules

### 1. Sustained prose, bold pull-quote preserved
Executive Read structure:
- Top: bold-italic single sentence summary (the canon pull-quote — preserve current archetype-specific line).
- Below: 2-3 sustained-prose paragraphs that develop the read. Reference Jason's edited example for tone and pacing.
- Total length: roughly twice the current Executive Read's footprint — but the bold pull-quote at the top stays as a quotable summary moment.

### 2. Voice commits more than hedges
Across the newly-in-scope sections, the LLM rewrite should produce prose that commits at the section level. Hedges should appear at most twice per section, not in every sentence. Section-level humility ("a possibility, not a verdict" already in the masthead) is the humility frame; the body prose can speak more clearly inside that frame.

### 3. Pronouns: always second person on user surface
Zero occurrences of any user's name in third person on the user-mode rendered report (except in the masthead "For: [name]" line, which is appropriate). All template interpolations that previously read `${name} ranked highest` or `${name}'s shape` become `you ranked highest` and `your shape`.

### 4. Engine-internal parentheticals suppressed
Zero occurrences of `(formerly *)` in user-mode rendered report. The parenthetical is engine-internal documentation that doesn't belong on the user surface.

### 5. Visuals fully preserved
SVG bytes byte-identical to pre-CC for all charts. Open Tensions interactive controls present and functional. All metric rows render as today.

### 6. Three-fixture verification
Run Jason, Cindy, Daniel fixtures through the new pass. Each archetype's voice should:
- Read as committed and human, not engine-procedural.
- Show second-person pronouns throughout (no third-person name leaks).
- Render all visuals byte-identical to pre-CC.
- Land its respective archetype's closing canon line at the appropriate single position.

### 7. Cohort cache reflows
The LLM-rewrite cache (`lib/cache/prose-rewrites.json`, `lib/cache/keystone-rewrites.json`) needs to be re-primed for the expanded scope. Treat as a cohort-prime run (~$1-2 total per the calibration memory, well within budget).

## Implementation notes
- The expanded LLM scope means `resolveScopedRewritesLive` and `renderMirrorAsMarkdownLive` need to handle the new sections. The structured JSON contract on `/api/report-cards` may need to grow new fields (executiveRead, corePattern, etc.) or the per-section LLM rewrites can be returned as a single map.
- The new sections render server-side; the React surface continues to fetch `/api/report-cards` on mount and swap in LLM prose progressively. Same architecture, more fields.
- The deterministic template fixes (pronoun sweep, `(formerly *)` removal, "In health: In health" dedup, "Mirror-Types Seed" rename) are independent of the LLM pass and can be applied in the same CC without scope conflict.

## Audit gates
- New audit `tests/audit/launchVoicePolish.audit.ts`:
  - Pronoun sweep: across Jason / Cindy / Daniel user-mode renders, zero third-person name occurrences in body prose (masthead "For:" exempted).
  - Parenthetical sweep: zero `(formerly *)` patterns in user-mode body prose.
  - "In health: In health" duplicate: zero hits.
  - "Mirror-Types Seed" → "Mirror-Type Seed" rename: zero hits of the old form on user surface.
  - MBTI surface-label disclaimer line absent from user-mode masthead: zero matches for "Possible surface label:" or "Type labels are surface descriptions only" in user-mode rendered output. Clinician mode still contains both phrases.
  - Architect-shape failure-mode line wrapped in `<details>` / `<summary>` with the explanatory paragraph in the disclosure body. Verified for jasonType / cindyType / danielType fixtures: each has the archetype-appropriate explanation text inside the disclosure.
  - Executive Read: contains bold pull-quote (at least one bold-italic line) AND at least two body paragraphs of sustained prose.
  - SVG visuals byte-identical to pre-CC baseline (Trajectory chart, Disposition bar chart, Drive donut chart, body-card structure).
  - Hedge density per scoped section: ≤2 for LLM-rewritten sections (Lens/Compass/Hands/Path/Keystone + the new ones).
  - Open Tensions section retains its interactive controls (Yes/Partially/No buttons or equivalent).
- Existing 49+ audits stay green.
- `tsc --noEmit` clean.
- `npm run lint` clean.
- Cost: ~$1-2 total for cache re-prime; subsequent live renders use cached + on-demand patterns same as today (~$0.10/new-user worst case).

## Deliverables
- Files changed list.
- Before/after excerpts for the newly-rewritten sections (Executive Read, Core Pattern, What Others May Experience, When the Load Gets Heavy, Synthesis, Closing Read, Path-Gait triptych) — Jason / Cindy / Daniel fixtures.
- Pronoun sweep report: zero third-person name occurrences across all three fixtures' user-mode renders.
- Parenthetical sweep report: zero `(formerly *)` patterns.
- Hands "In health: In health" dedup verification.
- "Mirror-Type Seed" rename verification.
- SVG byte-identity confirmation across all charts.
- Hedge-density count before/after per scoped section.
- 49-fixture (+1 new) sweep status.
- Cache re-prime cost report.

## Why this is the right CC right now
Each individual fix is small. The cumulative effect is the difference between "this looks like a real product" and "this looks like a thoughtful beta." For a soft-share to 100+ professionals and friends, the polish gap matters disproportionately — careful readers notice hedge density, third-person name leaks, and engine parentheticals as signals about how seriously to take the product. Closing those gaps in one push protects the launch narrative.
