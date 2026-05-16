# CC-086 — Shape-Aware Prose Routing V2 (Hands + Lens + UseCases + GiftCategory Picker Across 3 More Cards)

## Objective

**Six template-bleed sites** surfaced across the 2026-05-16 cohort review + Cindy's 15:06 prod-render review. Sites 1-3 are template-swap routing; sites 4-6 share a single deeper bug — the `pickGiftCategory()` router in `lib/identityEngine.ts:3052` is shape-blind for Trust / Gravity / Conviction cards, routing Cindy (Se driver, Family compass, present-tense caregiver) to `GiftCategory: Builder` and thus producing "a builder's gift" + "you tend to turn ideas into working systems..." prose that's literally Jason-architect language. The user pointed out: *"There hardly could be different people than me (Jason) and my mom (Cindy)"* — yet the engine maps both their reports to Builder-coded Strength prose on multiple cards. The routing isn't shape-aware.

Fix all six in one pass; each is independently scoped within this CC:

**Site 1 — Hands card caregiver template bleeds to non-caregivers.** The exact phrase "You build the relational continuity that lets people feel kept — care made concrete through repeated presence" + footnote "for a caregiver shape, high Soul-substance funnels into Goal-axis output through service" appears in Cindy, Kevin, Ashley, Michele reports (4 of 5 non-Daniel fixtures). Only Daniel — a steward shape — gets the steward template ("the standard followed when no one is watching..."). Routing rule appears to be: Soul-leaning OR Family compass → caregiver template, ignoring driver function + actual Hands shape. Kevin (Faith compass, present-tense Se driver, NOT a caregiver) gets routed there anyway.

**Site 2 — "What this is good for" architect-template example.** The "Family and coworker explanations" subsection literally contains the hardcoded sentence: *'I see the long arc of what I'm building, and the structure I'm carrying isn't the one this room is asking for, but it is the one I'm built to build.'* This is Jason-architect-coded language. It appears verbatim in every cohort report including Cindy (caregiver), Daniel (steward), Michele (room-reader). Should route to driver-specific example text.

**Site 3 — Lens card growth edge uses thinker-coded language for Se drivers.** Kevin / Ashley / Cindy (all Se present-tense self drivers) get "precision lets you see clearly can land as relational bluntness." Precision is a Ti/Te gift, not Se. The actual growth edge for present-tense shapes is "responsiveness becoming reactivity" — named correctly in the Gifts table, then forgotten by the Lens card. Michele (Fe room-reader) gets a more apt growth edge ("over-spiritualizing the practical"). The routing has partial shape-awareness but slips on present-tense Se drivers.

**Sites 4, 5, 6 — Trust / Gravity / Conviction cards route Cindy to `GiftCategory: Builder`.** Cindy's report (2026-05-16 15:06) shows "A builder's gift shows up here: you tend to turn ideas into working systems and to push past friction toward a result" in BOTH the Trust card AND the Gravity card, plus "Precision is part of how this card lands: you tend to clarify what's actually being claimed before the conversation moves" on the Conviction card. The user's framing: *"There hardly could be different people than me (Jason) and my mom (Cindy)"* — yet the engine routes both shapes' Strength prose through the same `Builder` / `Precision` categories.

The architectural cause: `pickGiftCategory()` in `lib/identityEngine.ts:3052`, plus `CARD_PREFERENCES` at line 3136, plus `selectGiftCategoryForCard()`-style logic around line 3251 — these compose to map (LensStack + Compass + cardKey) → `GiftCategory`. For Cindy's shape (Se driver + Family compass + present-tense response), the picker routes Trust → Builder, Gravity → Builder, Conviction → Precision. Those should route to `Action` (in-the-moment action gift) or `Harmony` (relational-attunement gift) for her shape, NOT `Builder` or `Precision`.

The `GIFT_NOUN_PHRASE` + `GIFT_DESCRIPTION` lookups at lines 3552 / 3567 are correct — the bug is in the upstream category selection, not the noun/description tables. Fix the picker, the noun + description follow naturally.

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

### Item 4 — GiftCategory picker shape-awareness for Trust / Gravity / Conviction

In `lib/identityEngine.ts`, locate `pickGiftCategory()` (~line 3052), `CARD_PREFERENCES` (~line 3136), and the per-card category-selection logic (~line 3251). Today the picker routes Cindy's (Se driver + Family compass + present-tense response) Trust / Gravity cards to `Builder`. That's structurally wrong.

The fix: when the LensStack dominant is Se / Fe / Fi / Si (relational or present-tense drivers) AND the Compass cluster is Family / Loyalty / Peace / Compassion (relational protected values), the picker should prefer `Action` / `Harmony` / `Stewardship` over `Builder` / `Precision` for non-Hands cards (Trust / Gravity / Conviction).

Concrete routing constraints to add:
- **Cindy-shape route**: Se + Family-cluster Compass → Trust = `Action` or `Harmony`; Gravity = `Action` or `Harmony`; Conviction = `Harmony` (her "clarity-before-action" is relational read, not Ti-precision)
- **Jason-shape route**: Ni + Faith-cluster Compass → keep `Builder` / `Precision` / `Pattern` where it already routes for him (regression anchor)
- **Daniel-shape route**: Si + Faith-cluster Compass → `Stewardship` for Trust / Gravity (regression anchor)

Don't add new GiftCategory enum members. The 12 categories already in `GIFT_NOUN_PHRASE` are sufficient (Pattern / Precision / Stewardship / Action / Harmony / Integrity / Builder / Advocacy / Meaning / Endurance / Discernment / Generativity). The fix is in the picker's switch/match logic, not the lookup tables.

**Risk profile of this item**: `pickGiftCategory()` is read by every card on every report. Cohort regression will be significant. Don't change `GIFT_NOUN_PHRASE` or `GIFT_DESCRIPTION` text — only the upstream category selection. The text stays canonical; the route to it shape-aligns.

### Item 5 — Lens card growth edge per driver

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

### Item 6 — Regression sweep

Re-render the cohort fixtures. Verify:
- Kevin's Hands card no longer reads "relational continuity that lets people feel kept" (he's not a caregiver)
- Ashley's Hands card stays caregiver (she IS Family-focused present-tense — caregiver may still be right for her)
- Daniel's Hands card stays steward (regression anchor)
- Cindy's Hands card stays caregiver (regression anchor)
- Every cohort fixture has driver-appropriate growth edge on Lens card
- Every cohort fixture has driver-appropriate "What this is good for" example text
- **Cindy-equivalent fixtures (cindyType archetype) have Trust + Gravity cards routed to `Action` or `Harmony` GiftCategory, NOT `Builder`**
- **Cindy-equivalent fixtures have Conviction card routed to `Harmony` or `Action`, NOT `Precision`**
- **Jason-equivalent fixtures (jasonType: Ni driver + Faith Compass) STILL get `Builder` / `Precision` / `Pattern` where they already do** (regression anchor)
- **Daniel-equivalent fixtures (danielType: Si driver) get `Stewardship`** (regression anchor)

### Item 7 — Audit

New `tests/audit/shapeAwareProseRoutingV2.audit.ts` with assertions:
1. Hands card prose for Kevin's fixture does NOT contain "relational continuity that lets people feel kept"
2. Hands card prose for Daniel's fixture DOES contain "standard followed when no one is watching" or steward-equivalent
3. "What this is good for" section in Cindy's fixture renders does NOT contain "long arc of what I'm building"
4. Lens card growth edge for Kevin's fixture contains "responsiveness becoming reactivity" or Se-driver-appropriate language
5. Cohort sweep: every fixture's Hands card maps to a driver-appropriate template per the routing table
6. **Trust card prose for cindyType fixture does NOT contain "a builder's gift" or "turn ideas into working systems"** (Site 4)
7. **Gravity card prose for cindyType fixture does NOT contain "a builder's gift"** (Site 5)
8. **Conviction card prose for cindyType fixture does NOT contain "Precision is part of how this card lands"** (Site 6)
9. **Jason-equivalent fixture (jasonType: Ni + Faith) Trust/Gravity STILL routes to Builder or Pattern GiftCategory** (regression anchor — proves the fix is targeted, not blanket)
10. **Daniel-equivalent fixture (danielType: Si + Faith) Trust/Gravity routes to Stewardship GiftCategory** (regression anchor)

## Do NOT

- **Do NOT change any engine math.** No score changes. No Drive distribution changes. No Aim changes. No Grip changes. The GiftCategory picker edit changes WHICH category is selected, not the category's contents (text, scores).
- **Do NOT rewrite the existing template prose.** This CC routes existing templates correctly; it doesn't author new prose. New prose authoring is a CC-LLM-PROSE-PASS-Vx job, not this.
- **Do NOT add new GiftCategory enum members.** The 12 existing categories (Pattern / Precision / Stewardship / Action / Harmony / Integrity / Builder / Advocacy / Meaning / Endurance / Discernment / Generativity) are sufficient.
- **Do NOT change `GIFT_NOUN_PHRASE` or `GIFT_DESCRIPTION` tables.** Their text is canonical. Only the upstream picker selecting WHICH category gets used changes.
- **Do NOT change the Path card, Compass card, Movement section, or Risk Form prose.** Out of scope here.
- **Do NOT touch the Gift table at the top of the report.** That's the separate misalignment bug (Site 7 — gift name/description cross-wiring) and goes to CC-088, not here.
- **Do NOT regenerate any cache file** under `lib/cache/`.
- **Do NOT regenerate `tests/audit/twoTierBaseline.snapshot.json`** until after this CC + CC-084 + CC-085 all land. The baseline refresh becomes a separate cleanup CC.
- **Do NOT call any LLM.** No `*LlmServer.ts` imports. No `@anthropic-ai/sdk`.
- **Do NOT touch any Wave 1 persistence file.**
- **Do NOT commit or push.**

## Allowed to Modify

- `lib/handsCard.ts`
- `lib/renderMirror.ts` (Hands card section + Lens card section only)
- `app/components/UseCasesSection.tsx`
- `lib/identityEngine.ts` — **`pickGiftCategory()` (~line 3052) + `CARD_PREFERENCES` (~line 3136) + the per-card category-selection logic (~line 3251) only**. Do NOT touch `GIFT_NOUN_PHRASE` (~line 3552) or `GIFT_DESCRIPTION` (~line 3567) — those tables are canonical and stay as-is. Do NOT touch any score/aggregation/scoring function. Do NOT add new GiftCategory enum members.
- `lib/synthesis1Finish.ts` — only if Strength prose Records for the three additional cards live here per CC-084's discovered pattern. Verify before editing.
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
3. `npx tsx tests/audit/shapeAwareProseRoutingV2.audit.ts` passes 10/10 (5 original + 5 added for sites 4-6)
4. Wave 1 audits still pass
5. CC-084 + CC-085 audits still pass
6. Demographics audit still passes
7. Kevin's Hands card no longer uses caregiver template (Site 1)
8. Daniel + Cindy Hands cards unchanged in archetype routing (regression anchors)
9. Lens card growth edge per-driver routing for Se drivers fires correctly (Site 3)
10. "What this is good for" architect-template no longer bleeds to non-architects (Site 2)
11. Cindy's Trust card no longer reads "a builder's gift" (Site 4)
12. Cindy's Gravity card no longer reads "a builder's gift" (Site 5)
13. Cindy's Conviction card no longer reads "Precision is part of how this card lands" (Site 6)
14. Jason-equivalent fixture's Trust/Gravity STILL routes to Builder/Pattern (regression anchor — proves picker is targeted, not blanket)
15. `GIFT_NOUN_PHRASE` + `GIFT_DESCRIPTION` tables byte-identical to pre-CC (canonical text preserved)
16. Zero modifications to Wave 1 persistence files
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
