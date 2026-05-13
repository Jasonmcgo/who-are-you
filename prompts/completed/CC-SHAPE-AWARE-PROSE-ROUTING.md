# CC-SHAPE-AWARE-PROSE-ROUTING — Fix 7 Engine Bugs Where Prose Defaults to Jason/INTJ Language

> **⚠️ DEPENDENCY — DO NOT START UNTIL CC-GRIP-WIRING-AND-FLOOR-CALIBRATION HAS LANDED.**
>
> This CC must be executed AFTER `prompts/active/CC-GRIP-WIRING-AND-FLOOR-CALIBRATION.md` completes and moves to `prompts/completed/`. Reason: CC-GRIP-WIRING wires `gripReading.score` (the §13 composed Grip) into Movement Quadrant, Limiter, Risk Form, and chart rendering. Daniel's composed Grip 88.5 and the cohort drag-shift fixtures (gsg/12, ocean/25, ocean/02) will produce different Grip values and possibly different Quadrant labels after that CC lands. If this prose-routing CC runs BEFORE the wiring CC, the prose templates will be calibrated against legacy Grip numbers that are about to shift — and the cohort regen at the end of this CC would have to be redone.
>
> **Sequencing rule:** verify the prior CC's report-back has been received and the audit sweep is 31/31 green. Only then begin this CC.

**Origin:** Clarence reviews of Cindy's (ESFP/Family/Soul-leaning) and Daniel's (SJ/faithful-steward) full rendered reports surfaced concrete engine bugs where prose templates default to Jason-coded language regardless of shape. The headline bug: the "What this is good for" appendix literally contained `Not 'I'm an INTJ' — instead 'I'm running the long-arc-architect register...'` text in BOTH Cindy's and Daniel's reports. That's not editorial calibration — that's a hard engine bug shipping in front of every user regardless of shape.

The model is now passing the big differentiation test (three distinct recognizable shapes from cohort fixtures). The remaining work is making the prose layer route through driver / Voice / Lens / cognitivePair so every section reflects the user's shape, not Jason's.

This CC implements the **three-profile canon** as the routing architecture: Jason-type (long-arc architect), Cindy-type (present-tense caregiver), Daniel-type (faithful steward). Each archetype carries a canonical line, gift labels, danger labels, growth edges, Path templates, and surface-grip framing. The seven bugs below are fixed by routing prose-template selection through these archetypes.

**Method discipline:** Prose-template surgery + driver-aware routing. No engine math. No LLM system prompt changes (the templates ARE LLM inputs, but the routing layer is engine-side selecting which template to feed). Lens/Voice/cognitivePair/Compass already exist on constitution — this CC ROUTES through them rather than building new measurements.

**Scope frame:** CC-mega, ~90–120 min executor time. Multiple files but each fix is surgical with clear before/after.

**Cost surface:** Cohort cache regen REQUIRED — prose anchors change for non-architect shapes. Bounded ~$0.50–$2.00 across 24 fixtures depending on how many sections regenerate. Hash bump in `synthesis3Inputs.ts` is the cleanest path.

---

## Embedded context

### The three-profile canon (routing anchors)

| Archetype | Driver range | Compass | Canonical line | Gift label | Danger label |
|---|---|---|---|---|---|
| **Jason-type** (long-arc architect) | NiTe / NiFe / TiNe | Knowledge, Honor, Peace | "The work is to translate conviction into visible, revisable, present-tense structure." | architectural openness, structural mastery, long-arc pattern reading | structure becoming verdict; long-arc believing too early |
| **Cindy-type** (present-tense caregiver) | SeFi / FiSe / FeSe | Family, Mercy, Loyalty | "The work is not to care less. It is to let love become sustainable enough to last." | present-tense care, protective loyalty, embodied steadiness | responsiveness becoming reactivity; loyalty becoming self-erasure; being needed becoming being gripped |
| **Daniel-type** (faithful steward) | SiTe / SiFe / TeSi | Faith, Honor, Order | "The work is not to abandon what has endured. It is to let what has endured remain alive enough to update." | stewardship, faithful responsibility, operational trust | continuity becoming control; responsibility becoming non-delegation; precedent becoming verdict |

These three archetypes are the validated minimum. Cohort sweep may surface additional archetypes (likely 4–6 total cover the cohort cleanly). Executor's call: implement the three named archetypes with extensibility hooks for adding more.

### The seven engine bugs (from `project_shape_blind_prose_routing_bugs.md`)

1. **"What this is good for" appendix contains literal "I'm an INTJ" language in non-architect reports.**
2. **Architecture-language leakage in body cards / Closing Read** — phrases like "architectural openness," "structure-as-purpose," "long-arc," "building systems," "precision becoming weaponized correctness" appear in Cindy's and Daniel's reports inappropriately.
3. **Gift labels not Lens-aware** — defaults to "builder's gift / clarifying-precision gift / advocacy gift" (Te/Ti-coded) regardless of shape.
4. **Growth-edge labels not Lens-aware** — defaults to "precision becoming weaponized correctness" regardless of shape.
5. **Work Map occupational examples too narrow per category** — Embodied Craft cited only elite-technical examples; Operational/Stewardship cited only white-collar examples.
6. **Closing Read template is shape-blind** — same "verbs and nouns appear to be pulling in the same direction" structure across all three reports.
7. **Surface-grip composition shape-blind** — money/wealth stakes lead the surface grip cluster even when the Primal is "Am I wanted?" or "Am I secure?" and stakes are a proxy.

Plus: **Template bleed-through between shapes** (Daniel's Practice section contained Cindy's "presence developing memory" line) and **Mirror-Types Seed duplicate** (Daniel's own Faith register appeared in his own contrast list).

---

## Architecture

### File map

| File | Action | Purpose |
|---|---|---|
| `lib/profileArchetype.ts` | NEW | Compute the user's primary archetype (jasonType / cindyType / danielType / etc.) from driver + Compass + movement class. Returns archetype key + confidence. |
| `lib/renderMirror.ts` | MODIFY | Appendix routing, body card vocabulary, Closing Read template selection all route through archetype. |
| `lib/identityEngine.ts` | MODIFY | Gift label and growth-edge generation reads archetype for routing (or wherever those are currently generated). |
| `lib/workMap.ts` | MODIFY | Per-category occupational examples broadened with humane non-elite breadth. |
| `lib/loveMap.ts` | MODIFY | Same broadening for love-register categories. |
| `lib/giftCatalog.ts` (new or existing — locate) | MAYBE MODIFY | Gift labels per archetype: ESFP gets "present-tense care," SJ gets "stewardship," NJ gets current architect labels. Growth edges parallel. |
| `lib/mirrorTypesSeed.ts` (or wherever Mirror-Types is computed) | MODIFY | Filter out the user's own register from the contrast list. |
| `lib/surfaceGripComposition.ts` (or wherever surface grip strings are composed) | MODIFY | When Primal is non-stakes (Am I wanted? Am I loved? Am I good enough?) AND money/reputation signals fire, route the surface grip to reframe through the Primal. |
| `lib/closingRead.ts` (new or existing — locate) | MODIFY | Closing Read template per archetype, each with its canonical line. |
| `lib/synthesis3Inputs.ts` | MODIFY | Hash bump if archetype enters LLM input contract. |
| `tests/audit/shapeAwareProseRouting.audit.ts` | NEW | 16 audit assertions. |

### Segment A: Compute the archetype

In a new `lib/profileArchetype.ts`:

```ts
export type ProfileArchetype =
  | "jasonType"      // long-arc architect
  | "cindyType"      // present-tense caregiver
  | "danielType"     // faithful steward
  | "unmappedType";  // explicit fallback when none of the three match

export interface ArchetypeReading {
  primary: ProfileArchetype;
  confidence: "high" | "medium" | "low";
  rationale: string;
}

export function computeArchetype(
  driverPair: FunctionPairKey,           // e.g., "NiTe"
  compassValues: CompassValue[],          // e.g., ["Knowledge", "Honor", "Peace"]
  movementClass: MovementQuadrantLabel,  // e.g., "Goal-led Presence"
  voiceRegister: VoiceProfile             // existing constitution field
): ArchetypeReading {
  // Match against the three archetype rules. High confidence requires
  // driver match + at least 2 compass values matching + movement class
  // matching. Medium = driver match + 1 compass + any movement.
  // Low = driver match alone. Anything else = unmappedType.
}
```

Add to constitution as `constitution.profileArchetype`. This becomes the routing input for all downstream prose decisions.

### Segment B: Appendix routing fix (Bug 1)

In `lib/renderMirror.ts`, find the "What this is good for" appendix composition. It currently emits a fixed string containing "Not 'I'm an INTJ'..." Replace with archetype-routed templates:

```ts
const APPENDIX_BY_ARCHETYPE: Record<ProfileArchetype, string> = {
  jasonType:
    "Not 'I'm an INTJ' — instead, 'I'm running the long-arc-architect register: I see structure before others, " +
    "and my growth edge is translating conviction into visible, revisable form.'",
  cindyType:
    "Not 'I'm an ESFP' — instead, 'I read what's happening in the room quickly, and I often respond before others " +
    "have named the need. My growth edge is letting love become sustainable enough to last.'",
  danielType:
    "Not 'I'm an SJ' — instead, 'I trust what has endured, and I need to know when precedent is still wisdom and " +
    "when it has become inertia. My growth edge is letting what has endured remain alive enough to update.'",
  unmappedType:
    "Not a personality type — instead, a specific shape: how you tend to move, what you protect, what pulls you " +
    "back, and what becomes available when the pull eases.",
};
```

Routed by `constitution.profileArchetype.primary`.

### Segment C: Architecture-language leakage fix (Bug 2)

Grep the prose-template files for the Jason-coded vocabulary list:
- "architectural openness," "structure-as-purpose," "long-arc," "building systems," "precision becoming weaponized correctness," "the structure I'm building isn't the one this room is asking for"

For each occurrence, either:
- Gate it to `archetype === "jasonType"` only, OR
- Replace with an archetype-aware substitution table

Substitution vocabulary for Cindy-type: presence, loyalty, immediate need, practical care, family continuity, being needed, responsiveness, concrete love, room-read, embodied action, durable commitment.

Substitution vocabulary for Daniel-type: continuity, precedent, stewardship, responsibility, faithful action, durable commitment, operational trust, security through reliability, memory as obligation.

### Segment D: Gift labels Lens-aware (Bug 3)

Find the gift-label generation (likely `lib/identityEngine.ts` or a dedicated module). Replace the fixed Te/Ti-coded labels with archetype-routed sets:

```ts
const GIFT_LABELS_BY_ARCHETYPE: Record<ProfileArchetype, GiftLabel[]> = {
  jasonType: [
    { label: "architectural openness", growthEdge: "structure becoming verdict" },
    { label: "structural mastery", growthEdge: "mastery becoming over-refinement" },
    { label: "long-arc pattern reading", growthEdge: "long-arc believing too early" },
  ],
  cindyType: [
    { label: "present-tense care", growthEdge: "responsiveness becoming reactivity" },
    { label: "protective loyalty", growthEdge: "loyalty becoming self-erasure" },
    { label: "embodied steadiness", growthEdge: "being needed becoming being gripped" },
  ],
  danielType: [
    { label: "stewardship", growthEdge: "continuity becoming control" },
    { label: "faithful responsibility", growthEdge: "responsibility becoming non-delegation" },
    { label: "operational trust", growthEdge: "precedent becoming verdict" },
  ],
  unmappedType: [/* fall back to current Te/Ti-coded labels, but keep them */],
};
```

### Segment E: Growth-edge labels (Bug 4)

Bundled with Segment D — growth edges are paired with gift labels in the table above.

### Segment F: Work Map example breadth (Bug 5)

In `lib/workMap.ts`, find the per-category occupational example arrays. For each category, broaden the examples:

**Embodied Craft Work** — keep current elite examples but ADD: hospitality, caregiving, hands-on service, event coordination, practical support, customer-facing work, craft, food, home-making, health support, retail, community service, performance.

**Operational/Stewardship Work** — keep COO/admin examples but ADD: facilities, logistics, compliance, church administration, skilled trades supervision, family business operations, finance/accounting controls, veteran leadership, maintenance of inherited systems.

**(Other categories — executor identifies and broadens analogously.)**

### Segment G: Closing Read class-routing (Bug 6)

Find the Closing Read composition. Replace the single "verbs and nouns appear to be pulling in the same direction" template with archetype-routed Closing Reads:

```ts
const CLOSING_READ_BY_ARCHETYPE: Record<ProfileArchetype, string> = {
  jasonType:
    "Your verbs and your nouns appear to be pulling in the same direction — the long-arc structure you build " +
    "is in service of the truth you keep returning to. The work is to translate conviction into visible, " +
    "revisable, present-tense structure. Keep this shape honest as the seasons turn.",
  cindyType:
    "Your life appears organized around love made concrete. You do not merely value Family; you act as if Family " +
    "is something that must be held, fed, defended, and kept. The work is not to care less. It is to let love " +
    "become sustainable enough to last.",
  danielType:
    "Your life appears organized around faithful continuity: belief made visible through repeated action, " +
    "responsibility carried across time, and love expressed as reliability. The work is not to abandon what " +
    "has endured. It is to let what has endured remain alive enough to update.",
  unmappedType:
    "(current template falls through here, but flagged as a watch-item for cohort review)",
};
```

### Segment H: Surface-grip composition shape-aware (Bug 7)

Find where the surface grip cluster strings are composed (likely from named grip signals + Q-Stakes1 + Q-GRIP1). Current logic appears to lead with stakes signals when present, regardless of Primal. New logic:

```ts
if (primalQuestion === "Am I wanted?" && (signals.money || signals.reputation || signals.approval)) {
  surfaceGrip = "Belonging through usefulness";
  secondaryPressures = ["money/wealth stakes", "reputation pressure", "approval need"];
}
if (primalQuestion === "Am I secure?" && (signals.money || signals.control)) {
  surfaceGrip = "Security through control";
  secondaryPressures = ["money/wealth stakes", "control under pressure"];
}
if (primalQuestion === "Am I good enough?" && (signals.control || signals.beingRight)) {
  surfaceGrip = "Control under pressure";
  secondaryPressures = ["being right", "money/security"];
}
// etc. for each of the 7 Primals
```

The composition routes through the Primal output before naming the surface. Money/reputation become secondary pressures, not the headline.

### Segment I: Template bleed-through fix

Find any Path/Practice template strings that reference shape-specific imagery (e.g., "presence developing memory and a future" — Cindy-coded) and route them through archetype. Each archetype gets its own Path/Practice template.

### Segment J: Mirror-Types Seed filter

In `lib/mirrorTypesSeed.ts` (or wherever computed), filter the contrast list to EXCLUDE the user's own register. If the user's Faith-shape is "verified precedent," the contrast list should offer authenticity / mercy / reform — not verified precedent again.

---

## Audit assertions (16 NEW)

In `tests/audit/shapeAwareProseRouting.audit.ts`:

1. **`archetype-computed-for-every-fixture`** — `constitution.profileArchetype.primary` is defined and non-null for every cohort fixture.
2. **`jason-archetype-jason-type`** — Jason fixture maps to `jasonType` at high confidence.
3. **`cindy-archetype-cindy-type`** — Cindy synthetic fixture maps to `cindyType` at high or medium confidence.
4. **`daniel-archetype-daniel-type`** — Daniel synthetic fixture maps to `danielType` at high or medium confidence.
5. **`appendix-routes-by-archetype`** — appendix string for Cindy fixture does NOT contain "INTJ" or "long-arc-architect"; for Daniel does NOT contain "INTJ" or "long-arc-architect"; for Jason DOES contain the architect text.
6. **`gift-labels-route-by-archetype`** — Cindy gift labels include "present-tense care" or "protective loyalty"; Daniel gift labels include "stewardship" or "faithful responsibility"; Jason unchanged.
7. **`growth-edges-route-by-archetype`** — Cindy growth edges include "responsiveness becoming reactivity" or "loyalty becoming self-erasure"; Daniel growth edges include "continuity becoming control"; Jason unchanged.
8. **`architecture-vocabulary-only-in-architect-reports`** — grep across all 24 fixture renders for: ["architectural openness", "structure-as-purpose", "long-arc", "building systems", "weaponized correctness"]. Any occurrence in a non-jasonType fixture = audit FAIL.
9. **`work-map-examples-broadened`** — Embodied Craft Work category includes humane non-elite examples; Operational/Stewardship Work category includes non-white-collar examples.
10. **`closing-read-routes-by-archetype`** — Jason / Cindy / Daniel fixtures produce distinct Closing Read text containing their respective canonical lines.
11. **`surface-grip-routes-through-primal`** — for Cindy synthetic (Primal "Am I wanted?" + money signals), surface grip headline is "Belonging through usefulness" NOT "Money/wealth stakes elevated."
12. **`mirror-types-seed-excludes-own-register`** — for Daniel (Faith register = verified precedent), Mirror-Types contrast list does NOT contain "verified precedent."
13. **`template-bleed-through-fixed`** — Daniel fixture Path/Practice section does NOT contain "presence developing memory" (Cindy-coded); Cindy fixture Path/Practice section does NOT contain "the long arc" (Jason-coded).
14. **`canonical-lines-preserved`** — Jason fixture contains "Your gift is the long read. Your danger is believing the long read too early." Cindy fixture contains "The work is not to care less. It is to let love become sustainable enough to last." Daniel fixture contains "The work is not to abandon what has endured. It is to let what has endured remain alive enough to update."
15. **`unmapped-archetype-fallback-works`** — at least one cohort fixture maps to `unmappedType` (proves the fallback path is exercised) and produces non-empty prose.
16. **`cohort-regen-or-flag-strategy`** — audit prints which path was taken (full regen vs feature flag) and the cost/scope.

---

## Out-of-scope guardrails (DO NOT)

1. **Do NOT modify engine math** (Aim formula, Grip composition, Movement formulas, OCEAN composition, Compass derivation).
2. **Do NOT modify Quadrant routing, Movement Limiter, Risk Form letter logic, or chart rendering.** All visual substrate stays as Phase 2 + CC-MOMENTUM-HONESTY + CC-GRIP-WIRING shipped them.
3. **Do NOT modify the §13 floor constant or composition formula.** That's CC-GRIP-WIRING's scope, runs first.
4. **Do NOT modify LLM system prompts.** The prose templates change; the meta-prompts do not.
5. **Do NOT add new question-bank items.** Archetype routing reads existing signals; no new measurements.
6. **Do NOT modify the Compass values list or Peace/Faith disambiguation logic.** Faith register routing (toward "moral-metaphysical trust" for some shapes) is a calibration signal saved for future CC, NOT this one.
7. **Do NOT modify the 7 Primal Questions taxonomy.** This CC reads the existing Primal output to route surface grip; no new Primals added.
8. **Do NOT bundle the lib/synthesis3Inputs.ts cache hash retirement of legacy Aim.** That's a separate architectural-debt CC.
9. **Do NOT modify the angle-band integration logic** (42–58°). Locked.
10. **Do NOT touch the trajectory chart layout, viewBox, legend.** Locked.
11. **Do NOT remove the Te/Ti-coded gift labels entirely.** Keep them as the `unmappedType` fallback; only the archetype-aware variants are new.
12. **Do NOT regenerate cohort cache without an explicit strategy choice** (Option A: full regen with hash bump; Option B: feature flag). Document the choice in audit #16.
13. **Do NOT bundle additional archetypes beyond the three named** (jasonType, cindyType, danielType, unmappedType). Cohort review will surface candidates for 4th/5th/6th archetypes; those are separate CCs.
14. **Do NOT modify Mirror-Types Seed content** other than the duplicate-filter fix. Adding new mirror types is separate work.
15. **Do NOT bundle the "Lightly Governed Movement" 5th Risk Form band.** That's a calibration signal queued for the editorial mega; this CC is shape-aware routing of EXISTING templates, not new label introduction.

---

## Verification checklist

- [ ] `npx tsc --noEmit` clean
- [ ] `npm run lint` clean
- [ ] `npx tsx tests/audit/shapeAwareProseRouting.audit.ts` — all 16 assertions pass
- [ ] All existing audits remain green (31/31 from CC-GRIP-WIRING → 32/32 with this CC's new file)
- [ ] Cohort regen completes OR feature flag documented and tested
- [ ] Jason / Cindy / Daniel fixtures render and pass grep audit: no Jason-coded vocabulary in non-architect fixtures

---

## Report-back format

1. **Summary** — files modified, line-count delta, audit pass count, regen cost.
2. **ProfileArchetype computation paste** — show the `computeArchetype` function and the rule table.
3. **Cohort archetype distribution** — for every cohort fixture, list its computed archetype + confidence. Confirm at least Jason/Cindy/Daniel land in their named archetypes.
4. **Appendix routing paste** — show the new APPENDIX_BY_ARCHETYPE map and one example render per archetype.
5. **Gift-label routing paste** — show the GIFT_LABELS_BY_ARCHETYPE map.
6. **Closing Read routing paste** — show the CLOSING_READ_BY_ARCHETYPE map and one example render per archetype.
7. **Surface-grip routing paste** — show the Primal-routed composition logic.
8. **Cohort grep audit** — count of Jason-coded vocabulary occurrences across all 24 fixtures, broken down by archetype. Expected: zero occurrences in non-jasonType fixtures.
9. **Work Map breadth confirmation** — paste the new example arrays for Embodied Craft and Operational/Stewardship categories.
10. **Mirror-Types filter confirmation** — Daniel fixture's contrast list, confirming "verified precedent" is excluded.
11. **Cindy regression** — paste her renders of: appendix, gift labels, growth edges, surface grip, Path/Practice section, Closing Read. All should be in caregiver register.
12. **Daniel regression** — paste his renders of: appendix, gift labels, growth edges, Path/Practice section, Closing Read. All should be in steward register.
13. **Jason regression** — paste his renders of the same sections. All should be unchanged from pre-CC architect register.
14. **LLM cache strategy** — Option A or Option B, with rationale and cost.
15. **Audit pass/fail breakdown** — every audit listed in verification.
16. **Out-of-scope verification** — confirm none of the 15 DO-NOT items were touched.

---

**Architectural test:** the cohort renders three distinct profile tones with no vocabulary leakage. Cindy's report reads in caregiver register end to end (present-tense care, protective loyalty, "love made sustainable"); Daniel's reads in steward register (stewardship, faithful continuity, "what has endured"); Jason's reads in architect register (long-arc, structural mastery, "translate conviction into visible structure"). The "What this is good for" appendix matches the shape; the Closing Read carries the canonical line; the surface grip names what's actually being protected.

The instrument now sounds like the user, not like Jason.
