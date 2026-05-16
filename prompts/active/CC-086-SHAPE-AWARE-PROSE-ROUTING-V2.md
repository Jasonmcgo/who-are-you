# CC-086 — Shape-Aware Prose Routing V2 (Hands + Lens + "What this is good for")

## Objective

Three template-bleed sites surfaced in the 2026-05-16 cohort review are routing prose shape-blind across the cohort. Fix all three in one pass; each is independently scoped within this CC:

**Site 1 — Hands card caregiver template bleeds to non-caregivers.** The exact phrase "You build the relational continuity that lets people feel kept — care made concrete through repeated presence" + footnote "for a caregiver shape, high Soul-substance funnels into Goal-axis output through service" appears in Cindy, Kevin, Ashley, Michele reports (4 of 5 non-Daniel fixtures). Only Daniel — a steward shape — gets the steward template ("the standard followed when no one is watching..."). Routing rule appears to be: Soul-leaning OR Family compass → caregiver template, ignoring driver function + actual Hands shape. Kevin (Faith compass, present-tense Se driver, NOT a caregiver) gets routed there anyway.

**Site 2 — "What this is good for" architect-template example.** The "Family and coworker explanations" subsection literally contains the hardcoded sentence: *'I see the long arc of what I'm building, and the structure I'm carrying isn't the one this room is asking for, but it is the one I'm built to build.'* This is Jason-architect-coded language. It appears verbatim in every cohort report including Cindy (caregiver), Daniel (steward), Michele (room-reader). Should route to driver-specific example text.

**Site 3 — Lens card growth edge uses thinker-coded language for Se drivers.** Kevin / Ashley / Cindy (all Se present-tense self drivers) get "precision lets you see clearly can land as relational bluntness." Precision is a Ti/Te gift, not Se. The actual growth edge for present-tense shapes is "responsiveness becoming reactivity" — named correctly in the Gifts table, then forgotten by the Lens card. Michele (Fe room-reader) gets a more apt growth edge ("over-spiritualizing the practical"). The routing has partial shape-awareness but slips on present-tense Se drivers.

## Sequencing

- **Can fire in PARALLEL with CC-087** (admin demographic edit — no file overlap).
- **Sequential after CC-084 AND CC-085** — all three engine CCs touch `lib/renderMirror.ts`. CC-086 should fire LAST because it has the most surface area in that file.

## Launch Directive

Run with `claude --dangerously-skip-permissions`.

## Execution Directive

Single pass across the three sites. If any site's existing prose code is so tangled that fixing it cleanly would require >100 lines of new routing logic, pause and report — that site goes to a follow-up CC rather than getting a half-baked fix bundled in here.

## Bash Commands Authorized

- `grep`, `ls`, `cat`, `find`, `wc`
- `npx tsc --noEmit`
- `npm run lint`
- `npx tsx tests/audit/<name>.audit.ts`

Do NOT run `npm install`, `git commit`, `git push`, `drizzle-kit push`, or any LLM build script.

## Read First (Required)

1. `lib/handsCard.ts` — Hands card composition + archetype routing.
2. `lib/renderMirror.ts` — render-side prose for Hands + Lens cards. Find the template-bleed sites via `grep "relational continuity that lets people feel kept" lib/renderMirror.ts` and `grep "long arc of what I'm building" .`.
3. `app/components/UseCasesSection.tsx` — the "What this is good for" surface. Find the hardcoded architect example sentence.
4. `lib/identityEngine.ts` — verify Driver function + Compass top are available at Lens-card composition time (they are; they drive the routing).
5. `feedback_synthesis_not_routing_canon.md` (memory) — Jason canon 2026-05-15 reframes "Lens prose routing" from routing-fix to synthesis-architecture. The minimum-viable here is per-driver TEMPLATE selection; the full synthesis architecture is a much larger CC.

## Scope

### Item 1 — Hands card shape-aware routing

In `lib/handsCard.ts` (or wherever Hands prose archetype is selected), the routing decision should consume:
1. **Driver function** as primary signal: Te → builder/strategist, Si → steward, Se → embodied-craft, Fe → caregiver, Fi → conviction-builder, Ne → possibility-builder, Ni → architect, Ti → systems-craft
2. **Compass top** as secondary signal: Family compass + non-caregiver driver → caregiver template OK if the lived-pattern signals also align; otherwise driver wins.

Kevin (Se driver + Faith compass) should NOT route to caregiver; he should route to embodied-craft or steward depending on what the existing template library offers. If no template fits Kevin's exact shape, route to a `general` template rather than caregiver.

### Item 2 — "What this is good for" driver-specific example

In `app/components/UseCasesSection.tsx`, the architect-coded sentence is one of N example strings. Build a driver-keyed lookup so:
- Ni / Te / Ti drivers → "I see the long arc of what I'm building..." (current)
- Si driver → "I keep the things that have worked, even when the room wants something new." (steward voice)
- Se driver → "I read the room and I move; I'm not the one who plans the meeting." (present-tense voice)
- Fe / Fi drivers → "I tend the people in this room — that's how I know my job is going well." (relational voice)
- Ne driver → "I see what could be here, even when no one else does yet." (possibility voice)
- Fallback when driver is unknown: keep the architect example (least-bad default) but flag in a code comment.

### Item 3 — Lens card growth edge per driver

In `lib/renderMirror.ts` (Lens card section), the growth edge line for Se present-tense drivers currently uses precision-coded language. Route by driver:
- Ni → "long-arc certainty closes early"
- Si → "continuity becoming control"
- Se → "responsiveness becoming reactivity"
- Ne → "possibility becoming evasion"
- Ti → "precision becoming relational bluntness"
- Te → "structure becoming non-delegation"
- Fi → "conviction becoming over-sacrifice"
- Fe → "tending becoming self-erasure"

Use the Gifts table's already-named growth edges as the canonical source if they exist per-driver; otherwise the list above.

### Item 4 — Regression sweep

Re-render the cohort fixtures. Verify:
- Kevin's Hands card no longer reads "relational continuity that lets people feel kept" (he's not a caregiver)
- Ashley's Hands card stays caregiver (she IS Family-focused present-tense — caregiver may still be right for her)
- Daniel's Hands card stays steward (regression anchor)
- Cindy's Hands card stays caregiver (regression anchor)
- Every cohort fixture has driver-appropriate growth edge on Lens card
- Every cohort fixture has driver-appropriate "What this is good for" example text

### Item 5 — Audit

New `tests/audit/shapeAwareProseRoutingV2.audit.ts` with assertions:
1. Hands card prose for Kevin's fixture does NOT contain "relational continuity that lets people feel kept"
2. Hands card prose for Daniel's fixture DOES contain "standard followed when no one is watching" or steward-equivalent
3. "What this is good for" section in Cindy's fixture renders does NOT contain "long arc of what I'm building"
4. Lens card growth edge for Kevin's fixture contains "responsiveness becoming reactivity" or Se-driver-appropriate language
5. Cohort sweep: every fixture's Hands card maps to a driver-appropriate template per the routing table

## Do NOT

- **Do NOT change any engine math.** No score changes. No Drive distribution changes. No Aim changes.
- **Do NOT rewrite the existing template prose.** This CC routes existing templates correctly; it doesn't author new prose. New prose authoring is a CC-LLM-PROSE-PASS-Vx job, not this.
- **Do NOT change the Path card, Compass card, Movement section, or Risk Form prose.** Out of scope here.
- **Do NOT regenerate any cache file** under `lib/cache/`.
- **Do NOT regenerate `tests/audit/twoTierBaseline.snapshot.json`** until after this CC + CC-084 + CC-085 all land. The baseline refresh becomes a separate cleanup CC.
- **Do NOT call any LLM.** No `*LlmServer.ts` imports. No `@anthropic-ai/sdk`.
- **Do NOT touch any Wave 1 persistence file.**
- **Do NOT commit or push.**

## Allowed to Modify

- `lib/handsCard.ts`
- `lib/renderMirror.ts` (Hands card section + Lens card section only)
- `app/components/UseCasesSection.tsx`
- `lib/types.ts` (only if a driver-to-template mapping type needs adding)
- `tests/audit/shapeAwareProseRoutingV2.audit.ts` (new)
- `package.json` (add `audit:shape-aware-prose-routing-v2` script)
- Move prompt to `prompts/completed/` at end

## Out of Scope

- Engine math
- Path / Compass / Movement / Risk Form prose
- LLM rewrite layer
- New prose authoring (only routing existing templates correctly)
- Schema changes

## Acceptance Criteria

1. `npx tsc --noEmit` passes
2. `npm run lint` passes
3. `npx tsx tests/audit/shapeAwareProseRoutingV2.audit.ts` passes 5/5
4. Wave 1 audits still pass
5. CC-084 + CC-085 audits still pass (if they landed)
6. Demographics audit still passes
7. Kevin's Hands card no longer uses caregiver template
8. Daniel + Cindy Hands cards unchanged (regression anchors)
9. Lens card growth edge per-driver routing for Se drivers fires correctly
10. "What this is good for" architect-template no longer bleeds to non-architects
11. Zero modifications to Wave 1 persistence files
12. Zero LLM calls
13. Zero cache file modifications
14. Zero commits

## Report Back

- Per-fixture Hands card template assignment (before / after)
- Per-fixture Lens card growth edge text (before / after for the Se drivers)
- "What this is good for" example mapping table
- Audit results
- Whether any of the 3 sites had to be deferred to a follow-up (per Execution Directive)
- twoTier audit status (expected to fail; report magnitude)

## Notes for executor

- Estimated time: 60-90 min
- Cost: $0
- The Hands card site is biggest. Lens + UseCases are smaller.
- If any site needs a deferral, surface it early; don't bundle a half-fix.
