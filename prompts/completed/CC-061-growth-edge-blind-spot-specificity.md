# CC-061 — Growth Edge + Blind Spot Specificity (CC-048 audit Rule 3 closure)

**Type:** Editorial rewrite landing in code. **Locked-content composition** for two prose surfaces (`GROWTH_EDGE_TEXT` 12 entries + `BLIND_SPOT_TEXT_VARIANTS` 12 entries) following CC-052's Sentence 2 anchor architecture. Each generic existing sentence becomes Sentence 1 (preserved verbatim); a new user-specific Sentence 2 anchor composes from cross-signal pattern keyed to the same dominant-function + Compass discriminators CC-052 uses. No new questions, no new signals, no new measurement surface.
**Goal:** Close CC-048 audit Rule 3 violations (38 findings; CC-061 closes 24 of them — `GROWTH_EDGE_TEXT` 12 + `BLIND_SPOT_TEXT_VARIANTS` 12). Each entry currently renders generic phrases reusable across users (*"The growth move is keeping the test alive..."* fits any Pattern user; *"Over-reading the future. The pattern you see clearly may stop being tested..."* fits any Pattern user). Per the canon: generic entries should compose with per-user signal-anchored second sentences. After CC-061, every growth-edge and blind-spot entry renders Sentence 1 generic + Sentence 2 user-specific anchored to the discriminating signal pattern that fired the gift category. Same architecture CC-052 shipped for `GIFT_DESCRIPTION`.
**Predecessors:** CC-048 (Report Calibration Canon — codified Rule 3). CC-052 / CC-052b (Sentence 2 anchor architecture for `GIFT_DESCRIPTION` — the canonical pattern this CC inherits). CC-058 + CODEX-058b (Mirror Rule 5 — same locked-content discipline applied to a different surface). CC-060 (Allocation Gap Rule 4 — same rewrite-track CC; ships before CC-061 because both touch `lib/identityEngine.ts`).
**Successor:** Trust + Responsibility Conditional Framing (Rules 8+9), OCEAN-as-Texture Refactor (Rules 6+1), workMap-prose closure (Rule 2 in `lib/workMap.ts`). All independent of CC-061's surfaces.

---

## Why this CC

CC-048's audit found 38 Rule 3 violations across four prose surfaces:

- `GROWTH_EDGE_TEXT` (12 entries) — largest single concentration
- `BLIND_SPOT_TEXT_VARIANTS` (12 entries) — second-largest
- `SHAPE_CARD_PRACTICE_TEXT` (8 entries) — deferred per audit's CC-051 scope; not in CC-061
- `GIFT_DANGER_LINES` (6 entries) — deferred; per the audit, *"The per-function generic is currently the strongest sentence in many reports; preserve it and add a per-user second sentence rather than replace"* — future CC handles

CC-061 ships the 24 highest-frequency-rendered entries (growth + blind, 12 each). Every user with a fired gift category sees both their growth-edge and blind-spot entries; these are the most-read prose on the Mirror layer and the largest payoff per locked-content rewrite.

The architecture mirrors CC-052 exactly:

```
[Sentence 1: generic register-naming, pre-CC-061 text — preserved verbatim]
[Sentence 2: user-specific anchor, NEW — keyed to discriminating signal pattern]
```

Sentence 2 fires per the user's actual cross-signal pattern. Each gift category has 2 candidate Sentence 2 conditions plus a no-discriminator fallback. The selector reuses CC-052's existing condition logic where possible.

CC-061 is engine-side substance per the Path C contract (CC-057a). The locked anchors ship as the engine's structural prose; the polish layer (CC-057b) is licensed to re-render warmer adjacent prose but cannot edit the locked Sentence 2 anchors. The new anchors join `lockedAnchors[]` via `extractAnchors`'s existing gift-routed-prose extraction (verify in `lib/humanityRendering/contract.ts`).

---

## Scope

Files modified:

1. **`lib/identityEngine.ts`** — three additions (parallel to CC-052's pattern):
   - **New helper `getGrowthEdgeSpecificity(category, stack, topCompass, topGravity, agency, weather, fire) → string`** (~80 lines including locked content). Same signature as CC-052's `getGiftSpecificity`. Returns the composed `Sentence1 + " " + Sentence2` string. Wired into `growthEdgeFor`'s return path so existing variant-pool logic (CC-023 Item 3 Advocacy doubling) stays intact.
   - **New helper `getBlindSpotSpecificity(category, variantIndex, stack, topCompass, topGravity, agency, weather, fire) → string`** (~80 lines). Same signature plus `variantIndex` for the existing multi-variant pools (Pattern, Discernment, Advocacy). Returns composed `Sentence1 + " " + Sentence2`.
   - **Two `_SPECIFICITY` Records** — `GROWTH_EDGE_SPECIFICITY` and `BLIND_SPOT_SPECIFICITY`, each keyed by GiftCategory mapping to a 2-condition selector + no-discriminator fallback per category.

2. **Two call-site rewrites in `lib/identityEngine.ts`:**
   - `growthEdgeFor` (line ~2456) — wraps `GROWTH_EDGE_TEXT[cat]` lookup with the new specificity composer when the no-discriminator-fallback case is the only available v1 entry; otherwise composes Sentence1 + Sentence2 via the helper.
   - `blindSpotFor` (existing function near `BLIND_SPOT_TEXT_VARIANTS` at line ~2489) — same pattern; composes Sentence1 + Sentence2 via the helper. Variant-pool selection logic preserved (Pattern / Discernment / Advocacy keep their multi-variant pools as Sentence 1 candidates; Sentence 2 fires uniformly per signal pattern regardless of which variant Sentence 1 was selected).

3. **`lib/humanityRendering/contract.ts § extractAnchors`** — verify the new growth-edge and blind-spot prose flows into `lockedAnchors[]`. If existing extraction reads card prose holistically (full Strength + Growth Edge + Practice + Pattern Note paragraph composed), the new anchors are already covered. If extraction reads sentence-level, may need a 5-line extension to add the Sentence 2 substrings explicitly.

4. **`docs/canon/result-writing-canon.md`** — append a CC-061 amendment under § Rule 3 marking the GROWTH_EDGE_TEXT + BLIND_SPOT_TEXT_VARIANTS subsets RESOLVED, naming the helpers and listing the locked Sentence 2 candidates per category.

5. **`docs/audits/report-calibration-audit-2026-04-29.md`** — mark the 24 Rule 3 findings (12 growth + 12 blind) as RESOLVED by CC-061. SHAPE_CARD_PRACTICE_TEXT and GIFT_DANGER_LINES findings remain open for follow-on CCs.

Nothing else. Specifically:

- **No edits to `GROWTH_EDGE_TEXT`** Record entries — the v1 strings stay as Sentence 1.
- **No edits to `BLIND_SPOT_TEXT_VARIANTS`** Record entries — same.
- **No edits to `GROWTH_EDGE_TEXT_VARIANTS`** (Advocacy first/second-occurrence pool) — same.
- **No edits to `pickGiftCategory`, `categoryHasSupport`, `getGiftSpecificity`** — gift routing untouched.
- **No edits to the 12 GiftCategory keys.**
- **No edits to `SHAPE_CARD_PRACTICE_TEXT`, `GIFT_DANGER_LINES`** — out of scope per audit's split.
- **No engine logic changes** beyond the two new helpers + two call-site composer additions.
- **No render-surface edits** — `MirrorSection.tsx`, `MapSection.tsx`, `LoveMap.tsx`, `WorkMap.tsx`, `InnerConstitutionPage.tsx`, `lib/renderMirror.ts` all untouched.
- **No polish-layer adapter or system-prompt edits.** Only `extractAnchors` may need extension (verify; surface in Report Back if so).
- **No test files.**

---

## The locked Sentence 2 architecture per category

Each of the 12 categories gets:
- 2 condition-keyed Sentence 2 candidates (priority-ordered; first match wins).
- 1 no-discriminator fallback (fires when neither condition matches).

Conditions reuse CC-052's existing signal-pattern matchers (`signalRankAtMost`, `inCompassTop`, `signalFiring`, etc.) plus CC-038-prose's `getFunctionPairRegister` for aux-pair access. Per the CODEX-058b workshop fix (`feedback_pair_key_casing_canon.md`), do not gate on `gift_category` for these conditions — the entry is itself routed by gift category, so gating again would be redundant. Gate on dominant function + Compass / Gravity / agency / weather / fire signal patterns.

Sentence 2 prefix is locked: `"For your shape, this growth edge expresses as "` (for GROWTH_EDGE) and `"For your shape, this blind spot expresses as "` (for BLIND_SPOT). Both prefixes mirror CC-052's `"For your shape, this expresses as "` for GIFT but with the surface noun named explicitly (the user has now seen the gift's anchor with `"For your shape, this expresses as ..."`; the growth and blind variants disambiguate).

---

## The locked content — Growth Edge (12 categories × 3 anchors)

### 1. Pattern (Ne / Ni dominants)

**Sentence 1 (preserved):** *"The growth move is keeping the test alive — letting the pattern remain a hypothesis longer than the part of you that already sees it would prefer."*

**Sentence 2 anchors:**
- **Ni-dominant + faith_priority OR knowledge_priority high** → *"For your shape, this growth edge expresses as resisting the long-arc closure — the read that's been three years in the making is also the read most prone to stopping its own correction."*
- **Ne-dominant + freedom_priority OR learning_energy_priority high** → *"For your shape, this growth edge expresses as resisting the lateral leap — the next angle of the pattern is always more interesting than the staying-with that would test the current one."*
- **No-discriminator fallback** → *"For your shape, this growth edge expresses as the discipline of not foreclosing — letting the pattern keep being a question after the part of you that already named it would prefer to move on."*

### 2. Precision (Ti dominant)

**Sentence 1 (preserved):** *"The growth move is borrowing from relational care — letting timing and tone serve the truth rather than be sacrificed to it."*

**Sentence 2 anchors:**
- **Ti-dominant + truth_priority OR knowledge_priority high** → *"For your shape, this growth edge expresses as letting the moment hold the precision rather than cutting through it — accuracy lands harder when the room can't tell whether you're correcting or condescending."*
- **Ti-dominant + system_responsibility_priority OR creator-agency** → *"For your shape, this growth edge expresses as remembering that the system is made of people; the cleanest definitional frame still has to land in someone's head, and the landing is part of the precision."*
- **No-discriminator fallback** → *"For your shape, this growth edge expresses as the discipline of timing — knowing when truth would land and when it would only collide; both readings are part of being precise."*

### 3. Stewardship (Si dominant)

**Sentence 1 (preserved):** *"The growth move is letting in disruption when the moment is structurally different from what came before."*

**Sentence 2 anchors:**
- **Si-dominant + stability_priority OR honor_priority high** → *"For your shape, this growth edge expresses as testing whether the continuity you're protecting is still load-bearing or whether it has become its own reason — the patterns that earned their persistence sometimes outlast the conditions that earned them."*
- **Si-dominant + family_priority OR loyalty_priority high** → *"For your shape, this growth edge expresses as letting the people you've kept faith with grow in directions your steadiness doesn't already have a register for — the loyalty is real either way; the steadiness has to update."*
- **No-discriminator fallback** → *"For your shape, this growth edge expresses as the discipline of distinguishing continuity-because-it-still-works from continuity-because-it-always-has."*

### 4. Action (Se dominant)

**Sentence 1 (preserved):** *"The growth move is checking precedent and pattern before committing — momentum is a tool, not a verdict."*

**Sentence 2 anchors:**
- **Se-dominant + freedom_priority high** → *"For your shape, this growth edge expresses as the pause that doesn't feel like a pause — staying in the situation long enough to read what it's actually asking before the body answers."*
- **Se-dominant + creator-agency OR justice_priority high** → *"For your shape, this growth edge expresses as remembering that showing up is necessary but not sufficient; presence without read can mistake action for response."*
- **No-discriminator fallback** → *"For your shape, this growth edge expresses as the discipline of asking what the situation is asking before the body decides it knows."*

### 5. Harmony (Fe dominant)

**Sentence 1 (preserved):** *"The growth move is naming the friction earlier than feels comfortable, so that repair can begin before resentment."*

**Sentence 2 anchors:**
- **Fe-dominant + family_priority OR faith_priority high** → *"For your shape, this growth edge expresses as the move from preserving the room to repairing it — the keeper of the connective tissue sometimes has to introduce the friction the room won't introduce on its own."*
- **Fe-dominant + compassion_priority OR mercy_priority high** → *"For your shape, this growth edge expresses as the move from holding to confronting — soft strength sometimes requires the harder kindness, the truth that protects the bond by refusing to hide from it."*
- **No-discriminator fallback** → *"For your shape, this growth edge expresses as the discipline of naming friction before it composts into resentment, even when naming it costs the room you're keeping."*

### 6. Integrity (Fi dominant + non-Fi cross-routed Integrity)

**Sentence 1 (preserved):** *"The growth move is letting other people in — sharing the weighing process rather than only the verdict."*

**Sentence 2 anchors:**
- **Fi-dominant + truth_priority OR honor_priority high** → *"For your shape, this growth edge expresses as opening the deliberation door — the inner compass that doesn't bend to weather is also the compass others can't read until you let them watch you weigh."*
- **Non-Fi cross-routed (truth_priority + honor_priority both high) OR Fi-dominant + faith_priority OR justice_priority high** → *"For your shape, this growth edge expresses as letting conviction become conversation — what survived your testing is more useful to others when they get to see the testing, not only the survivor."*
- **No-discriminator fallback** → *"For your shape, this growth edge expresses as the discipline of showing the work — verdicts protect the verdict-holder; the weighing process is what other people can actually use."*

### 7. Builder (Te dominant + creator/system signals; NiTe aux-pair routed)

**Sentence 1 (preserved):** *"The growth move is checking that the people inside the system are still being seen as people, especially under deadline."*

**Sentence 2 anchors:**
- **Te-dominant + creator-agency** → *"For your shape, this growth edge expresses as the question the deadline obscures — does this structure still serve the people inside it, or has the structure become the thing the people are being asked to serve."*
- **NiTe aux-pair OR Te-dominant + system_responsibility_priority high** → *"For your shape, this growth edge expresses as the long-arc check the urgency obscures — the structure that would have served three years ago may not be the structure that should ship today, and momentum can mistake itself for fit."*
- **No-discriminator fallback** → *"For your shape, this growth edge expresses as the discipline of remembering that the system is made of people; under deadline, the people are the first thing the system stops noticing."*

### 8. Advocacy (handled via existing variant pool)

**Sentence 1 (preserved — first-occurrence Compass register):** *"The growth move is leaving room for ignorance, complexity, and partial responsibility before reaching for the moral frame."*

**Sentence 1 (preserved — second-occurrence Gravity register, per CC-023 Item 3):** *"The growth move is asking, before you absorb the next responsibility, whether it is actually yours to carry — letting others hold what they are equipped to hold."*

**Sentence 2 anchors (apply to whichever Sentence 1 fires):**
- **High-Fi + justice_priority OR truth_priority high** → *"For your shape, this growth edge expresses as the test of whether the moral frame is the right size for the problem — not every gap is a betrayal; not every wrong is a war."*
- **High-Fe + compassion_priority OR mercy_priority high** → *"For your shape, this growth edge expresses as the test of whether your defending is also the room's protecting — sometimes the people you're advocating for need air more than they need a champion."*
- **No-discriminator fallback** → *"For your shape, this growth edge expresses as the discipline of holding the moral frame loosely — moral clarity is real and load-bearing; it's also the kind of clarity that hardens fastest into rigidity."*

### 9. Meaning (Ni / Fi dominant + faith / knowledge priority)

**Sentence 1 (preserved):** *"The growth move is honoring the workable-next-step register, especially when meaning would otherwise crowd it out."*

**Sentence 2 anchors:**
- **Ni-dominant + faith_priority OR knowledge_priority high** → *"For your shape, this growth edge expresses as resisting the deeper-interpretation reflex when the moment is asking for an action — meaning is real, but meaning that doesn't move risks becoming the structure that prevents movement."*
- **Fi-dominant + faith_priority OR honor_priority high** → *"For your shape, this growth edge expresses as letting the next step be ordinary — devotion sometimes requires the unceremonious move that meaning would prefer to embellish."*
- **No-discriminator fallback** → *"For your shape, this growth edge expresses as the discipline of the next-step register — meaning is the field; the next step is the move."*

### 10. Endurance (Si / Te / Fe dominant + caring-energy / family / honor patterns)

**Sentence 1 (preserved):** *"The growth move is asking which weight is actually yours, and letting some of it be carried by others or set down."*

**Sentence 2 anchors:**
- **Fe-dominant + family_priority OR caring_energy_priority high** → *"For your shape, this growth edge expresses as the test of which weights belong to the people you love and which belong to you — the keeper of the room sometimes carries what the room itself should be holding."*
- **Te-dominant + system_responsibility_priority OR creator-agency** → *"For your shape, this growth edge expresses as the test of which loads are structurally yours and which are structurally inherited — the operator sometimes absorbs what the system was supposed to distribute."*
- **No-discriminator fallback** → *"For your shape, this growth edge expresses as the discipline of distinguishing chosen weight from inherited weight; capacity is real, but capacity that absorbs everyone else's load eventually loses the load that was actually yours."*

### 11. Discernment (handled by existing host-card branching)

**Sentence 1 (preserved):** Two existing variants (`DISCERNMENT_GROWTH_PRIMARY` / `DISCERNMENT_GROWTH_ALTERNATE`) compose with the existing `"The growth move is "` prefix, per the existing `growthEdgeFor` logic. This CC preserves the host-card branching unchanged.

**Sentence 2 anchors:**
- **Ti-dominant + truth_priority OR knowledge_priority high** → *"For your shape, this growth edge expresses as the test of whether your read is detection or pattern-projection — anomaly-detection is a gift; the gift's failure mode is reading anomaly into ordinary noise."*
- **Ni-dominant + faith_priority OR honor_priority high** → *"For your shape, this growth edge expresses as the test of whether what you're discerning is actually present or whether it's the read your shape has been reaching for — the long-arc lens sometimes sees what it expects more clearly than what is."*
- **No-discriminator fallback** → *"For your shape, this growth edge expresses as the discipline of holding discernment as hypothesis — the eye that catches what doesn't add up sometimes needs to be asked whether it's adding up correctly itself."*

### 12. Generativity (Fe / Ne dominant + caring / family patterns)

**Sentence 1 (preserved):** *"The growth move is letting others want what they want, and trusting that capability grows without your direction."*

**Sentence 2 anchors:**
- **Fe-dominant + family_priority OR caring_energy_priority high** → *"For your shape, this growth edge expresses as the test of trust — letting the people you're cultivating choose paths your tending doesn't already endorse, without reading the divergence as failure of your care."*
- **Ne-dominant + freedom_priority OR learning_energy_priority high** → *"For your shape, this growth edge expresses as the test of finished — the catalyst's gift is the spark; the gift's failure mode is needing to keep sparking when the fire is already on."*
- **No-discriminator fallback** → *"For your shape, this growth edge expresses as the discipline of letting capability grow without direction — the cultivator's hand sometimes has to leave."*

---

## The locked content — Blind Spot (12 categories × 3 anchors)

The same architecture: Sentence 1 = existing `BLIND_SPOT_TEXT_VARIANTS[cat][variantIndex]` preserved verbatim; Sentence 2 = new locked anchor per condition. For categories with multi-variant pools (Pattern, Discernment, Advocacy), Sentence 2 fires uniformly per signal pattern regardless of which Sentence 1 variant the existing selector chose.

Sentence 2 prefix (locked): `"For your shape, this blind spot expresses as "`.

### 1. Pattern (multi-variant pool: 3 Sentence 1 variants)

**Sentence 2 anchors:**
- **Ni-dominant + (knowledge OR truth in Compass top 5)** → *"For your shape, this blind spot expresses as the long-arc certainty that closes early — what you've been reading toward becomes the thing you stop letting evidence touch."*
- **Ne-dominant + (freedom OR learning_energy)** → *"For your shape, this blind spot expresses as the breadth that loses the depth — the lateral connection feels like progress when staying with one would have produced the actual move."*
- **No-discriminator fallback** → *"For your shape, this blind spot expresses as the read-that-stops-being-tested — the pattern lands, and the part of you that landed it stops asking whether it's still right."*

### 2. Precision

**Sentence 2 anchors:**
- **Ti-dominant + (truth OR knowledge top 5)** → *"For your shape, this blind spot expresses as correctness that costs the room — the moment can't tell whether you're sharpening the claim or sharpening yourself against the claim's holder."*
- **Ti-dominant + (system_responsibility OR creator-agency)** → *"For your shape, this blind spot expresses as the system-diagnostic that ignores the system's people — the load-bearing claim is correctly named; the people who hold it are not."*
- **No-discriminator fallback** → *"For your shape, this blind spot expresses as accuracy at the cost of audience — being right and being heard sometimes require different moves."*

### 3. Stewardship

**Sentence 2 anchors:**
- **Si-dominant + (stability OR honor top 5)** → *"For your shape, this blind spot expresses as continuity-as-default — the pattern that earned its persistence sometimes outlasts the conditions that earned it, and continuing it becomes the reason a needed change doesn't happen."*
- **Si-dominant + (family OR loyalty top 5)** → *"For your shape, this blind spot expresses as faith-with-people-as-they-were — keeping faith with someone's earlier shape sometimes makes it harder to recognize the shape they've actually grown into."*
- **No-discriminator fallback** → *"For your shape, this blind spot expresses as the long memory's drag — what has worked before is not always what's needed now, and the memory of working can quietly close off the disruption a moment requires."*

### 4. Action

**Sentence 2 anchors:**
- **Se-dominant + (freedom top 5)** → *"For your shape, this blind spot expresses as movement-without-read — the body's certainty about being-in-the-situation can outrun the question of whether the situation is the right one to be in."*
- **Se-dominant + (creator-agency OR justice top 5)** → *"For your shape, this blind spot expresses as embodied advocacy without precedent-check — showing up physically for what's owed sometimes runs past what's actually owed."*
- **No-discriminator fallback** → *"For your shape, this blind spot expresses as the speed that becomes its own justification — momentum in service of nothing in particular still feels like motion forward."*

### 5. Harmony

**Sentence 2 anchors:**
- **Fe-dominant + (family OR faith top 5)** → *"For your shape, this blind spot expresses as preserving-instead-of-repairing — the keeper of the room sometimes holds the room together at the cost of the conversation that would actually repair it."*
- **Fe-dominant + (compassion OR mercy top 5)** → *"For your shape, this blind spot expresses as soft-strength as withholding — patience sometimes lets damage compound that a harder kindness would have interrupted."*
- **No-discriminator fallback** → *"For your shape, this blind spot expresses as the friction-deferred — the conversation kept comfortable now is the conversation that becomes resentment later."*

### 6. Integrity

**Sentence 2 anchors:**
- **Fi-dominant + (truth OR honor top 5)** → *"For your shape, this blind spot expresses as private moral certainty — the conscience that doesn't bend to weather is also the conscience that's hard to reach when others need to be heard before they can be moved."*
- **Non-Fi cross-routed (truth + honor both high)** → *"For your shape, this blind spot expresses as conviction-as-conclusion — what survived your testing becomes hard to revisit even when new evidence would warrant the reopening."*
- **No-discriminator fallback** → *"For your shape, this blind spot expresses as the inner anchor that closes the question — values that don't bend under social pressure also don't bend when honest reconsideration would be the right move."*

### 7. Builder

**Sentence 2 anchors:**
- **Te-dominant + (creator-agency OR system_responsibility)** → *"For your shape, this blind spot expresses as instrumentalizing under deadline — the people inside the system quietly become means to the structure rather than the reason for the structure."*
- **NiTe aux-pair** → *"For your shape, this blind spot expresses as the long-arc structure ignoring the present arc's signal — the future shape you're building toward sometimes obscures what the people in front of you are actually telling you now."*
- **No-discriminator fallback** → *"For your shape, this blind spot expresses as the ship-instinct's overreach — the part of you that completes structures sometimes rearranges the people around the structure as if they were part of it."*

### 8. Advocacy (multi-variant pool: 2 Sentence 1 variants)

**Sentence 2 anchors:**
- **High-Fi + (justice OR truth top 5)** → *"For your shape, this blind spot expresses as the moral suspicion reflex — disagreement reads as moral failure before the disagreement has had its hearing."*
- **High-Fe + (compassion OR mercy top 5)** → *"For your shape, this blind spot expresses as champion-fatigue projected onto others — the load you're carrying for them gets read into them as their being unable to carry it themselves."*
- **No-discriminator fallback** → *"For your shape, this blind spot expresses as the moral frame applied past its useful range — not every wrong is a war; not every gap is a betrayal."*

### 9. Meaning

**Sentence 2 anchors:**
- **Ni-dominant + (faith OR knowledge top 5)** → *"For your shape, this blind spot expresses as deeper-interpretation as deflection — what asks for a workable next step gets answered with a frame that postpones the step indefinitely."*
- **Fi-dominant + (faith OR honor top 5)** → *"For your shape, this blind spot expresses as devotion-as-disengagement — the meaning that organizes your life sometimes sits at a register the actual living can't reach."*
- **No-discriminator fallback** → *"For your shape, this blind spot expresses as over-spiritualizing the practical — the move asked for is sometimes the ordinary one, and meaning can crowd it out by being the more impressive answer."*

### 10. Endurance

**Sentence 2 anchors:**
- **Fe-dominant + (family OR caring_energy)** → *"For your shape, this blind spot expresses as load-creep — the weights of the people you love quietly become your weights without anyone making the choice for you."*
- **Te-dominant + (system_responsibility OR creator-agency)** → *"For your shape, this blind spot expresses as system-load-absorption — what the structure was supposed to distribute settles onto you because you're the one who'll carry it without complaint."*
- **No-discriminator fallback** → *"For your shape, this blind spot expresses as carrying becoming identity — capacity is real, but capacity that never sets a load down stops being able to tell which loads are actually yours."*

### 11. Discernment (multi-variant pool: 3 Sentence 1 variants)

**Sentence 2 anchors:**
- **Ti-dominant + (truth OR knowledge top 5)** → *"For your shape, this blind spot expresses as anomaly-projection — the eye that catches what doesn't add up starts catching anomalies that aren't there."*
- **Ni-dominant + (faith OR honor top 5)** → *"For your shape, this blind spot expresses as the long-arc read pre-judging — the pattern your shape has been reaching for becomes more visible than the patterns actually present."*
- **No-discriminator fallback** → *"For your shape, this blind spot expresses as suspicion as default — discernment that protects accuracy slowly tilts into reading every difference as deception."*

### 12. Generativity

**Sentence 2 anchors:**
- **Fe-dominant + (family OR caring_energy)** → *"For your shape, this blind spot expresses as care-as-direction — wanting what's good for the people you tend slides into wanting them to want it the way you do."*
- **Ne-dominant + (freedom OR learning_energy)** → *"For your shape, this blind spot expresses as the catalyst's overreach — the spark you keep providing was the gift; continuing to provide it sometimes prevents the fire from becoming self-sustaining."*
- **No-discriminator fallback** → *"For your shape, this blind spot expresses as the helping-instinct organized around what others ought to want — capability doesn't always grow on the directed path; sometimes it needs the undirected one."*

---

## The selector function shape (locked)

```ts
// lib/identityEngine.ts (new helpers, near getGiftSpecificity at line ~2596)

const SECOND_SENTENCE_PREFIX_GROWTH = "For your shape, this growth edge expresses as ";
const SECOND_SENTENCE_PREFIX_BLIND = "For your shape, this blind spot expresses as ";

export function getGrowthEdgeSpecificity(
  category: GiftCategory,
  stack: LensStack,
  topCompass: SignalRef[],
  topGravity: SignalRef[],
  agency: AgencyPattern,
  weather: WeatherLoad,
  fire: FirePattern
): string {
  // Same conditional shape as getGiftSpecificity. Each category branch
  // walks 2 conditions in priority order; first match wins. No-discriminator
  // fallback fires when neither condition matches.
  // Returns the Sentence-1 + " " + Sentence-2 composition.
  // ... (12 category branches; each returns the locked Sentence 2)
}

export function getBlindSpotSpecificity(
  category: GiftCategory,
  variantIndex: number,
  stack: LensStack,
  topCompass: SignalRef[],
  topGravity: SignalRef[],
  agency: AgencyPattern,
  weather: WeatherLoad,
  fire: FirePattern
): string {
  // Same shape; reads BLIND_SPOT_TEXT_VARIANTS[category][variantIndex]
  // for Sentence 1 to preserve the existing variant-pool selection.
  // ... (12 category branches; each returns the locked Sentence 2)
}
```

The selector reuses CC-052's existing `has` / `hasG` (`topCompass`/`topGravity` accessors) plus `lensStack.dominant` and `getFunctionPairRegister(stack).pair_key`. Per CODEX-058b's lesson, do not gate on `gift_category` — the entry is already routed by category. Gate on dominant function + Compass / Gravity / agency / weather / fire signal patterns.

Aux-pair conditions (e.g., the NiTe-aux-pair clause in Builder) use PascalCase `pair_key` per `feedback_pair_key_casing_canon.md`.

---

## Call-site rewrites

### `growthEdgeFor` (line ~2456)

```diff
 function growthEdgeFor(
   cat: GiftCategory,
   card: CardKey,
-  context?: BuildContext
+  context?: BuildContext,
+  ctx?: GeneratorContext
 ): string {
   // existing Discernment + variant-pool branching unchanged...
   const variants = GROWTH_EDGE_TEXT_VARIANTS[cat];
   if (variants && variants.length > 1) {
     const usedCount = context?.usedCategories.get(cat) ?? 1;
     const idx = Math.max(0, Math.min(usedCount - 1, variants.length - 1));
-    return variants[idx];
+    const sentence1 = variants[idx];
+    const sentence2 = ctx ? getGrowthEdgeSentence2(cat, ctx) : "";
+    return sentence2 ? `${sentence1} ${sentence2}` : sentence1;
   }
-  return GROWTH_EDGE_TEXT[cat];
+  const sentence1 = GROWTH_EDGE_TEXT[cat];
+  const sentence2 = ctx ? getGrowthEdgeSentence2(cat, ctx) : "";
+  return sentence2 ? `${sentence1} ${sentence2}` : sentence1;
 }
```

`ctx` is the existing `GeneratorContext` already passed to other CC-022b enhancements. Plumb through from the call site (`growthEdgeFor` callers in `lib/identityEngine.ts`).

`getGrowthEdgeSentence2` (private to the module) wraps `getGrowthEdgeSpecificity`'s internal logic returning only the Sentence 2 portion (without the locked prefix), so the caller can compose `Sentence1 + " " + Sentence2` cleanly. Or alternatively, refactor `getGrowthEdgeSpecificity` to take Sentence 1 as a parameter and return the full composition. Either is acceptable; executor picks based on the cleanest call-site shape.

### `blindSpotFor` (existing function near `BLIND_SPOT_TEXT_VARIANTS` at line ~2489)

Same pattern. Plumb `ctx` through; compose Sentence1 + Sentence2 via the helper.

---

## Acceptance

- `npx tsc --noEmit` clean.
- `npm run lint` clean.
- `npm run build` exits 0.
- `getGrowthEdgeSpecificity` and `getBlindSpotSpecificity` shipped with all 12 + 12 = 24 category branches; each branch composes 2 conditions + 1 fallback; all 72 locked Sentence 2 candidates ship verbatim from this prompt.
- Re-rendered Jason0429 (admin route per CODEX-050) shows growth-edge and blind-spot prose as `Sentence 1 + Sentence 2` compositions for every fired gift category. The Sentence 2 anchors fire per his cross-signal pattern (Ni-dominant + knowledge/truth → condition-1 firing on most categories; NiTe aux-pair → Builder's NiTe condition firing).
- A test session with cross-signal patterns that match no condition for a given category fires the no-discriminator fallback.
- The existing variant-pool selection (Pattern / Discernment / Advocacy) still works — Sentence 1 renders correctly per use-count; Sentence 2 fires uniformly per the user's signal pattern regardless of which Sentence 1 variant was selected.
- Markdown export (`lib/renderMirror.ts`) carries the same composed prose. No edit needed; renderMirror reads card prose holistically.
- Polish-layer round-trip (when API keys set) preserves the new Sentence 2 anchors via `extractAnchors`'s existing card-prose extraction. If `extractAnchors` extracts at the sentence level rather than holistically, may need a 5-line extension to add the Sentence 2 substrings explicitly to `lockedAnchors[]`. Surface in Report Back if that's the case.
- `grep -n "For your shape, this growth edge expresses as" lib/identityEngine.ts` returns hits in `getGrowthEdgeSpecificity` only.
- `grep -n "For your shape, this blind spot expresses as" lib/identityEngine.ts` returns hits in `getBlindSpotSpecificity` only.
- `GROWTH_EDGE_TEXT` Record entries unchanged (Sentence 1 verbatim).
- `BLIND_SPOT_TEXT_VARIANTS` Record entries unchanged (all variants verbatim).
- `GROWTH_EDGE_TEXT_VARIANTS` (Advocacy first/second-occurrence pool) unchanged.

---

## Out of scope

- **Rewriting any of the existing Sentence 1 strings** in `GROWTH_EDGE_TEXT`, `BLIND_SPOT_TEXT_VARIANTS`, `GROWTH_EDGE_TEXT_VARIANTS`. All 12 + 12 + 2 entries preserved verbatim as Sentence 1.
- **Rewriting any of the 72 locked Sentence 2 anchors** beyond what's in this prompt. Locked content; tonal calibration is a separate authorship pass.
- **`SHAPE_CARD_PRACTICE_TEXT`** (8 entries) — Rule 3 violation per audit but deferred per audit's CC-051 split. Future CC handles.
- **`GIFT_DANGER_LINES`** (6 entries) — Rule 3 violation per audit but the per-function generic is currently load-bearing per the audit's note; preserve it. Future CC may add per-user Sentence 2 anchors there too.
- **`THESIS_FALLBACK`** Rule 2 violations — different surface; CC-052's follow-on covers it.
- **Touching `pickGiftCategory`, `categoryHasSupport`, `getGiftSpecificity`, `FUNCTION_PAIR_REGISTER`** or any aux-pair routing. Read but don't modify.
- **Touching the Drive bucket-lean classifier or CC-060's allocation prompts.** Different surface.
- **Touching CC-058's `getUncomfortableButTrue` or CODEX-058b's gates.** Different surface.
- **Touching any render component** (`MirrorSection.tsx`, `MapSection.tsx`, etc.).
- **Touching `lib/loveMap.ts` or `lib/workMap.ts`.** Other surfaces; future CCs.
- **MVP product-vision work.**
- **Adding tests.**

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

This CC is filed CC- per the routing convention: multi-file architectural with locked editorial content. Claude Code is the intended executor for the tonal preservation; Codex acceptable given the locked-content discipline.

## Execution Directive

Single pass. **All 72 locked Sentence 2 anchors ship verbatim from this prompt's locked content.** If the executor encounters a structural surprise (e.g., the existing `growthEdgeFor` / `blindSpotFor` call sites don't have access to `GeneratorContext` and plumbing it through requires touching more files than expected), surface in Report Back rather than rewriting locked content. Read `lib/identityEngine.ts § getGiftSpecificity` for the canonical Sentence 2 selector pattern; mirror it here. Read `feedback_pair_key_casing_canon.md` for PascalCase pair_key convention. **Move prompt to `prompts/completed/` when done.**

## Bash Commands Authorized

- `grep -n "GROWTH_EDGE_TEXT\|BLIND_SPOT_TEXT_VARIANTS\|getGiftSpecificity\|growthEdgeFor\|blindSpotFor" lib/identityEngine.ts`
- `grep -n "For your shape, this expresses as\|For your shape, this growth edge\|For your shape, this blind spot" lib/identityEngine.ts`
- `grep -n "GeneratorContext\|BuildContext" lib/identityEngine.ts`
- `cat lib/identityEngine.ts | sed -n '2440,2540p'` (existing growth/blind composers)
- `cat lib/identityEngine.ts | sed -n '2596,2760p'` (CC-052's getGiftSpecificity)
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` (smoke; kill before exit)
- `mv prompts/active/CC-061-growth-edge-blind-spot-specificity.md prompts/completed/CC-061-growth-edge-blind-spot-specificity.md`
- `git diff --stat`
- `git diff lib/identityEngine.ts`

## Read First (Required)

- `AGENTS.md`.
- `docs/canon/result-writing-canon.md` § Rule 3 (full canon text + the CC-058 / CC-060 amendments setting the locked-content precedent).
- `docs/audits/report-calibration-audit-2026-04-29.md` § Rule 3 (38 findings — the audit's CC-051 split notes which 24 land in this CC).
- `lib/identityEngine.ts § getGiftSpecificity` (line ~2596) — the canonical Sentence 2 selector pattern this CC mirrors.
- `lib/identityEngine.ts § growthEdgeFor` (~line 2456) and `blindSpotFor` (near line 2489) — call sites being rewritten.
- `lib/identityEngine.ts § GROWTH_EDGE_TEXT, BLIND_SPOT_TEXT_VARIANTS, GROWTH_EDGE_TEXT_VARIANTS, DISCERNMENT_GROWTH_PRIMARY/ALTERNATE` — the 26 Sentence 1 strings preserved.
- `lib/identityEngine.ts § FUNCTION_PAIR_REGISTER` (~line 1730) for aux-pair access; `getFunctionPairRegister`.
- `lib/types.ts § GeneratorContext, FunctionPairKey (PascalCase)`, `GiftCategory`, `LensStack`, `AgencyPattern`, `WeatherLoad`, `FirePattern`.
- `lib/humanityRendering/contract.ts § extractAnchors, buildEngineRenderedReport` — verify card-prose extraction picks up new anchors.
- Memory — helpful context only:
  - `feedback_pair_key_casing_canon.md`

## Allowed to Modify

- `lib/identityEngine.ts` — new `getGrowthEdgeSpecificity`, `getBlindSpotSpecificity` helpers + two `_SPECIFICITY` Records + two call-site rewrites (`growthEdgeFor`, `blindSpotFor`) + `GeneratorContext` plumb-through if needed.
- `lib/humanityRendering/contract.ts § extractAnchors` — extension only if existing extraction misses Sentence 2 anchors. Verify first; surface decision in Report Back.
- `docs/canon/result-writing-canon.md` — CC-061 amendment under § Rule 3.
- `docs/audits/report-calibration-audit-2026-04-29.md` — RESOLVED markers on 24 Rule 3 findings; SHAPE_CARD_PRACTICE_TEXT + GIFT_DANGER_LINES findings remain open.
- **No other files.**

## Report Back

1. **Helpers + Records** — diffs for `getGrowthEdgeSpecificity`, `getBlindSpotSpecificity`, `GROWTH_EDGE_SPECIFICITY`, `BLIND_SPOT_SPECIFICITY`. Confirmation that all 72 Sentence 2 anchors ship verbatim from this prompt.
2. **Call-site rewrites** — diffs for `growthEdgeFor` and `blindSpotFor` showing Sentence 1 + Sentence 2 composition.
3. **GeneratorContext plumbing** — list of any files where `ctx` had to be threaded through to reach the call sites. If the plumbing required >1-2 files of edits, surface as a separate concern.
4. **Polish-layer integration** — confirmation (via reading `lib/humanityRendering/contract.ts`) that card-prose extraction picks up the new Sentence 2 anchors. Decision: holistic extraction (no contract edit needed) vs sentence-level extraction (contract extension required).
5. **Existing Sentence 1 preservation** — confirmation that `GROWTH_EDGE_TEXT`, `BLIND_SPOT_TEXT_VARIANTS`, `GROWTH_EDGE_TEXT_VARIANTS`, `DISCERNMENT_GROWTH_PRIMARY/ALTERNATE` are byte-identical pre/post diff.
6. **Canon doc + audit doc updates** — line ranges for both.
7. **Verification results** — tsc, lint, build all clean.
8. **Manual sweep deferred to Jason** — explicit list:
   - Re-rendered Jason0429 shows Sentence 1 + Sentence 2 compositions for every fired gift category. Sentence 2 fires per his cross-signal pattern.
   - A test panel (Ni-dom + knowledge user; Te-dom + creator-agency user; Fi-dom + truth user; Fe-dom + family user; Si-dom + stability user) confirms each category's conditions fire correctly.
   - A no-discriminator-match user fires the fallback.
   - Polish-layer A/B harness (when API keys set) preserves new anchors verbatim across both providers.
9. **Any deviation from locked content** — if a structural surprise prevented verbatim placement of any of the 72 anchors.
10. **Prompt move-to-completed confirmation.**

---

## Notes for the executing engineer

- **72 locked Sentence 2 anchors ship verbatim.** Tonal calibration is a separate authorship pass. If a sentence reads "off" tonally, surface in Report Back. Do not silently revise.
- **Mirror CC-052's pattern exactly.** The structural template (`getGiftSpecificity` for gifts; `getGrowthEdgeSpecificity` and `getBlindSpotSpecificity` for these surfaces) is canonical. Same accessors, same priority-ordered conditions, same locked prefixes.
- **Do not gate on `gift_category`** in the conditions per CODEX-058b's lesson. The entry is already routed by category; gating again is redundant. Gate on dominant function + cross-signal Compass / Gravity / agency / weather / fire patterns.
- **PascalCase pair_key** per `feedback_pair_key_casing_canon.md`. NiTe, NiFe, FeSi, etc. — not kebab-case.
- **Variant-pool preservation** — Pattern, Discernment, Advocacy `BLIND_SPOT_TEXT_VARIANTS` keep their existing multi-variant selection logic for Sentence 1; Sentence 2 fires uniformly per signal pattern.
- **Discernment growth-edge** uses the existing `DISCERNMENT_GROWTH_PRIMARY` / `DISCERNMENT_GROWTH_ALTERNATE` host-card branching for Sentence 1; Sentence 2 fires per signal pattern.
- **Advocacy growth-edge** uses the existing first-occurrence (Compass register) / second-occurrence (Gravity register) variant pool for Sentence 1; Sentence 2 fires per signal pattern.
- **Polish-layer integration** — if `extractAnchors` already reads card prose holistically (full Strength + Growth Edge + Practice + Pattern Note paragraph), the new anchors are automatically covered. Verify by reading the existing extraction. If sentence-level extraction is in place, may need a 5-line extension to add Sentence 2 substrings.
- **CC-060 ships before CC-061.** Both touch `lib/identityEngine.ts`; serial execution. If CC-060 is not yet shipped, abort and surface in Report Back.
- **Pre-CC-061 saved sessions** re-render against current engine code on admin load. No migration needed.
- **Per the routing convention** the prompt file moves to `prompts/completed/` when shipped. Explicit reminder.
