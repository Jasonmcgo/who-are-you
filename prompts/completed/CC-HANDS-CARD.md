# CC-HANDS-CARD — 9th Body Card: Hands / Work (Existential Goal-Axis)

> **▶ DEPENDENCY — CC-GRIP-TAXONOMY-REPLACEMENT must be landed and on `prompts/completed/`. Verify sweep is 34/34 green before starting.**

**Origin:** The 50° Journey canon (2026-05-11) identifies Hands / Work as the missing 9th body card. The body-map metaphor is structurally incomplete without it — Work currently appears in Path/Gait prose and in the separate Work Map appendix, but there's no dedicated body card for "what you build, carry, repair, produce, or make real."

Per `feedback_clarence_report_architecture_rulings.md` (binding):

> **Hands is what your life makes real. Work Map is where that making may fit.**

The distinction matters:

- **Hands** is *existential* — Goal-axis substance expressed through agency. What does this person naturally make real?
- **Work Map** is *vocational* — what work environments and registers fit this shape. Stays in the Supporting Signals appendix.

Both are preserved. Hands becomes the primary body-card expression of Goal. Work Map stays as supporting derivation.

**Method discipline:** new derivation module + new card render + body-map structure expansion (8 cards → 9). No engine math invented. The Goal score, CostStrength, and other inputs are pre-existing — this CC composes them into a new card output. Deterministic V1 (no LLM-generated Hands prose); LLM enhancement can be a future CC if cohort feedback shows the templated version is too thin.

**Scope frame:** CC-medium, ~75–90 min executor time. New module + wiring + render + audit. Templated content, no regen cost.

**Cost surface:** $0 — deterministic content, no LLM calls, no cache regen. The hash inputs change (Hands card data enters constitution output) but cached LLM paragraphs for the OTHER 8 cards are unaffected; they don't reference Hands. Hash bump is local to Hands-card hash inputs only.

---

## Embedded context

### The 8 documented input sources for Hands (canon)

Per Clarence's refinement 2026-05-11:

1. **Goal score / Goal drivers** — primary substrate (Hands is Goal-axis)
2. **CostStrength** — substance of building/output register (post-3C alignment, already canonical)
3. **Q-A1 / Q-A2** — activity and energy allocation (how time is spent, where energy flows when obligations lighter)
4. **Q-GS1** — durable creation / completion / service signals (what makes effort feel worth it)
5. **Q-V1** — work-meaning signals (why work matters)
6. **Gift category** — Builder / Precision / Advocacy / Endurance / Steward / Adapter (informs what kind of building)
7. **Lens driver** — pattern-reader / present-tense self / precedent-checker / etc. (informs HOW the building happens)
8. **Grip interaction** — what gets built under health vs under pressure. Dual-mode read.

### Dual-mode read (novel feature of Hands card)

Unlike the other 8 body cards, Hands has a **dual-mode read**: what a person builds in health may differ from what they build under pressure. This is canon per Clarence ruling.

Health register: the natural building (what they make real when load is light, when the conditions support full-shape expression)

Pressure register: the building under stress (what they build defensively, what becomes over-refined, what becomes control-as-output)

Both registers render in the card. The difference is informative — it shows the user where their making *changes* under load.

### Canonical content registers per archetype

Drawing from `feedback_50_degree_journey_canon.md` and `feedback_three_profile_canon.md`:

| Archetype | Health register — what they naturally make real | Pressure register — what building becomes under stress |
|---|---|---|
| **jasonType** (architect/Worth) | structural frameworks, intellectual systems, long-arc designs, visible/revisable architecture | over-refinement, mastery-as-control, structures that won't ship until perfect |
| **cindyType** (caregiver/Belonging) | relational continuity, present-tense care, embodied responsiveness, the form love takes in real time | over-extension, care-as-self-erasure, structures that won't stop running even when no one's asking |
| **danielType** (steward/Security) | operational systems, institutional continuity, faithful structures preserved across time | governance-as-non-delegation, structure-as-rigidity, the precedent that won't update |
| **unmappedType** | templated by gift category + Lens driver + Goal score | generic over-protection register |

### Card structure (mirrors other body cards)

```md
### Hands / Work
**What you build and carry**
*[opening line — health register, shape-specific]*

**Strength** — [what they naturally build, drawing from Goal + CostStrength + gift category + Lens]

**Growth Edge** — [where the building instinct can overshoot — drawing from Grip Pattern + pressure-register content]

**Under Pressure** — [DUAL-MODE: explicit prose comparing what gets built in health vs under pressure for THIS user]

**Practice** — [concrete next move tied to their shape]

**Movement Note** — [How Hands relates to Goal/Soul/Aim/Grip for this shape]

*[closing line — Path-style proverb]*
```

First reference uses dual name "Hands / Work"; subsequent references use "Hands" only (per dual-naming canon).

---

## Architecture

### File map

| File | Action | Purpose |
|---|---|---|
| `lib/handsCard.ts` | NEW | Derivation function + content templates per archetype + dual-mode renderer. |
| `lib/types.ts` | MODIFY | Add `HandsCardReading` type. Add `handsCard` field to `InnerConstitution`. |
| `lib/identityEngine.ts` | MODIFY | Wire `attachHandsCard(constitution)` after archetype + Grip Pattern + drive.strengths are attached. |
| `lib/renderMirror.ts` | MODIFY | Render Hands card between Heart/Compass and Spine/Gravity in Body Map section. |
| `app/components/InnerConstitutionPage.tsx` | MODIFY | React render — same placement. |
| `lib/synthesis3Inputs.ts` | MAYBE MODIFY | Only if Hands card content enters LLM prose anchors. V1 is deterministic, so likely NO modification needed. Hash bump not required if Hands stays out of synthesis3 input contract. |
| `tests/audit/handsCard.audit.ts` | NEW | 14 audit assertions. |

### Segment A — `lib/handsCard.ts` (NEW)

```ts
// CC-HANDS-CARD — 9th body card: Hands / Work.
// Canon: "Hands is what your life makes real. Work Map is where that making may fit."
// Existential Goal-axis card. Distinct from Work Map (vocational).
// Dual-mode read: what gets built in health vs under pressure.

import type {
  CostStrength,
  GiftCategory,
  GripPatternKey,
  InnerConstitution,
  LensStack,
  ProfileArchetype,
} from "./types";

export interface HandsCardReading {
  /** Opening line — health register, shape-specific. */
  openingLine: string;
  /** What they naturally build (Strength block). */
  strength: string;
  /** Where building overshoots (Growth Edge block). */
  growthEdge: string;
  /** Dual-mode read: health vs pressure prose. */
  underPressure: {
    healthRegister: string;
    pressureRegister: string;
    integrationLine: string;
  };
  /** Concrete next move. */
  practice: string;
  /** How Hands relates to Goal/Soul/Aim/Grip for this shape. */
  movementNote: string;
  /** Path-style closing proverb. */
  closingLine: string;
  /** Diagnostic — which inputs fired. */
  rationale: string;
}

export function computeHandsCard(inputs: {
  archetype: ProfileArchetype;
  gripPatternBucket: GripPatternKey;
  goalScore: number;
  costStrength: number; // from drive.strengths.cost
  topGiftCategory: GiftCategory | null;
  lensDriver: string;
  qA1Activity: string | null;     // "maintaining responsibilities" / "building" / etc.
  qA2EnergyDirection: string | null; // "deepening relationships and care" / etc.
  qGS1TopReward: string | null;   // top-ranked Q-GS1 — what makes success feel worth it
  qV1TopMeaning: string | null;   // top-ranked Q-V1 — why work matters
}): HandsCardReading {
  // Compose from archetype templates + interpolated user-specific signal content.
  // ...
}
```

**Executor implements:**

- Archetype-routed content templates (jasonType / cindyType / danielType / unmappedType) for each of: opening, strength, growth edge, health register, pressure register, integration line, practice, movement note, closing.
- Interpolation: where templates reference shape specifics (e.g., "you tend to build [GIFT_LABEL] structures that [Q-V1-INTERPOLATED]"), pull from the user's actual signals.
- Dual-mode resolution: select pressure register prose based on user's Grip Pattern bucket. Worth Grip + classical-defensive cluster produces different pressure register than Belonging Grip + relational cluster.

### Segment B — types.ts and engine wiring

```ts
// lib/types.ts additions
export interface InnerConstitution {
  // ... existing fields
  handsCard?: HandsCardReading;
  // ... existing fields
}
```

In `lib/identityEngine.ts`:

```ts
attachHandsCard(constitution); // After archetype + gripPattern + drive.strengths
```

Placement matters: Hands depends on `archetype`, `gripPattern`, and `drive.strengths.cost`. All three must be attached first.

### Segment C — renderMirror placement

Body Map section render order (per Clarence ruling):

1. Eyes / Lens
2. Heart / Compass
3. **Hands / Work** ← NEW (between Heart and Spine)
4. Ears / Trust
5. Spine / Gravity
6. Voice / Conviction
7. Nervous System / Weather
8. Immune Response / Fire
9. Gait / Path

Hands renders with the same structural pattern as the other cards (Strength / Growth Edge / Under Pressure / Practice / Movement Note / closing line) but with the DUAL-MODE Under Pressure block.

First reference uses "Hands / Work" (dual name); subsequent references in any cross-card prose use "Hands" only.

### Segment D — React mirror

`app/components/InnerConstitutionPage.tsx` — render the Hands card at the same position. Match the existing body-card component structure.

### Segment E — Work Map preservation

Work Map STAYS as a Supporting Signals appendix section. No content migration. The Hands card is additive, not replacement.

The canon line *"Hands is what your life makes real. Work Map is where that making may fit"* belongs in the Hands card render — likely as the opening framing or as a closing proverb. Executor's editorial call on exact placement.

---

## Audit assertions (14 NEW)

In `tests/audit/handsCard.audit.ts`:

1. **`hands-card-module-exists`** — `lib/handsCard.ts` exists, exports `computeHandsCard`, `HandsCardReading`.
2. **`hands-card-attached-to-constitution`** — every cohort fixture has `constitution.handsCard` populated with non-null `openingLine`, `strength`, `growthEdge`, `underPressure.{healthRegister, pressureRegister}`, `practice`, `closingLine`.
3. **`hands-renders-between-heart-and-spine`** — markdown render contains Hands card section header AFTER Heart/Compass and BEFORE Spine/Gravity. Order verified via regex match on section header positions.
4. **`body-map-has-9-cards`** — rendered Body Map section contains all 9 named cards (Lens, Compass, Hands, Trust, Gravity, Conviction, Weather, Fire, Path).
5. **`hands-first-reference-dual-name`** — first render of Hands section uses dual name "Hands / Work" (per canon). Subsequent in-prose references may use "Hands" alone.
6. **`hands-consumes-eight-inputs`** — `computeHandsCard` function signature accepts the 8 documented inputs (archetype, gripPatternBucket, goalScore, costStrength, topGiftCategory, lensDriver, qA1Activity, qA2EnergyDirection, qGS1TopReward, qV1TopMeaning). Source-grep verification.
7. **`hands-dual-mode-read-distinct`** — for every cohort fixture, `handsCard.underPressure.healthRegister !== handsCard.underPressure.pressureRegister`. The dual-mode produces distinct prose, not the same string twice.
8. **`hands-archetype-routed-content`** — Jason fixture Hands.strength contains architecture/structure/long-arc vocabulary. Cindy synthetic Hands.strength contains care/presence/relational vocabulary. Daniel synthetic Hands.strength contains stewardship/continuity/system vocabulary. Three distinct content registers.
9. **`hands-not-work-map-content`** — Hands card prose does NOT contain Work Map vocational examples ("surgeon", "COO", "operations management", etc.). Hands is existential register; Work Map vocabulary stays in the Work Map section.
10. **`work-map-section-preserved`** — Work Map section still renders in the Supporting Signals appendix. Hands does NOT replace it.
11. **`hands-canon-line-present`** — somewhere in the Hands card render (opening or closing) the canon line *"Hands is what your life makes real"* appears, OR a close paraphrase that preserves the distinction from Work Map.
12. **`hands-content-foster-vocabulary-free`** — no "Primal Question" / "Am I X?" Foster strings in Hands card prose. Inherits the canon-faithful gate from CC-GRIP-TAXONOMY-REPLACEMENT.
13. **`existing-eight-cards-unchanged`** — Lens / Compass / Trust / Gravity / Conviction / Weather / Fire / Path content byte-identical to pre-CC. Audit pulls a hash of each card's rendered output and compares to a baseline snapshot.
14. **`hands-card-zero-cost`** — no LLM calls in Hands card computation. `computeHandsCard` is a pure deterministic function. No regen required. Cohort cache unaffected.

---

## Out-of-scope guardrails (DO NOT)

1. **Do NOT modify the existing 8 body cards** (Lens, Compass, Trust, Gravity, Conviction, Weather, Fire, Path). Their content stays byte-identical. Audit #13 verifies.
2. **Do NOT modify the Work Map section or its derivation.** Work Map content and placement stay as-is. Hands is additive.
3. **Do NOT modify `constitution.gripReading.score` or any §13 engine math.** Hands consumes Grip Pattern bucket as a classifier input only.
4. **Do NOT modify the Grip Pattern taxonomy** (`lib/gripPattern.ts`). Hands reads `gripPattern.bucket`; it does NOT modify the 4-layer architecture.
5. **Do NOT modify `computeAimScore`, AIM_WEIGHTS, Movement Limiter formulas, Quadrant routing, Risk Form, or chart rendering.**
6. **Do NOT restructure the report page architecture** — Executive Read placement, Core Signal Map page move, tagline, masthead, How to Read This copy are all CC-PROGRESSIVE-DISCLOSURE-FRONT-PAGE scope. This CC only adds Hands as the 9th body card in the existing Body Map section.
7. **Do NOT add LLM-generated prose to Hands.** V1 is deterministic / templated. Future CC may add LLM enhancement if cohort feedback shows the templated version is too thin. This CC ships templates only.
8. **Do NOT bump synthesis3 or gripTaxonomy LLM cache hashes** unless Hands data enters those input contracts. V1 deterministic Hands stays out of LLM input contracts; no regen needed.
9. **Do NOT modify the three-profile archetype routing** (jasonType / cindyType / danielType / unmappedType). It's a classifier *input* to Hands; not a target of modification.
10. **Do NOT add new question-bank items.** All 8 Hands inputs draw from existing questions.
11. **Do NOT modify Compass values or Peace/Faith disambiguation.**
12. **Do NOT modify lean classifiers** (`workMap.ts`, `loveMap.ts`) or pie chart.
13. **Do NOT change the dual-naming convention.** First reference uses "Hands / Work"; subsequent references use "Hands" only. Same rule applies to the other cards (per Clarence ruling) but those don't change as part of this CC.
14. **Do NOT modify body-card render order beyond inserting Hands at position 3** (between Heart and Spine). The other 8 cards stay in their existing positions.
15. **Do NOT introduce Foster vocabulary** ("Primal Question", "Am I X?") in Hands content. Inherits the canon-faithful gate.

---

## Verification checklist

- [ ] `npx tsc --noEmit` clean
- [ ] `npm run lint` clean (0 warnings)
- [ ] `npx tsx tests/audit/handsCard.audit.ts` — all 14 assertions pass
- [ ] All existing audits remain green (34/34 → 35/35 with this CC's new file)
- [ ] Cohort renders show Hands card between Heart and Spine for every fixture
- [ ] Jason / Cindy / Daniel Hands content visibly distinct in register
- [ ] Work Map section still renders unchanged in Supporting Signals
- [ ] $0 cost — no LLM calls, no regen

---

## Report-back format

1. **Summary** — files modified, line-count delta, audit pass count.
2. **`lib/handsCard.ts` structure paste** — show `computeHandsCard` function signature + the four archetype-routed template families.
3. **Body Map render-order confirmation** — paste the markdown header sequence showing Hands between Heart and Spine.
4. **Jason Hands content paste** — full Hands card render for Jason fixture. Confirm architect/structure register.
5. **Cindy synthetic Hands content paste** — confirm caregiver/relational register.
6. **Daniel synthetic Hands content paste** — confirm steward/continuity register.
7. **Dual-mode read sample** — for one cohort fixture with high composed Grip, paste the health register vs pressure register prose side by side. Confirm distinct content.
8. **Work Map preservation confirmation** — confirm Work Map section still renders with original vocational examples.
9. **Foster-grep on Hands content** — confirm 0 Foster vocabulary occurrences across 24 fixtures.
10. **Existing-card hash check** — confirm the 8 prior cards render byte-identical to pre-CC.
11. **Audit pass/fail breakdown.**
12. **Out-of-scope verification** — confirm none of the 15 DO-NOT items were touched.

---

**Architectural test:** the body map is now structurally complete with 9 cards. Open any cohort fixture's rendered markdown — the Body Map section reads:

```
## The Body Map

### Eyes / Lens
[...]

### Heart / Compass
[...]

### Hands / Work
[new card — existential Goal-axis with dual-mode read]

### Ears / Trust
[...]

### Spine / Gravity
[...]

### Voice / Conviction
[...]

### Nervous System / Weather
[...]

### Immune Response / Fire
[...]

### Gait / Path
[...]
```

Hands renders shape-aware content: Jason as architect ("you tend to build structural frameworks that hold what you've seen — the long-arc systems that turn pattern into form"); Cindy as caregiver ("you tend to build the relational continuity that lets people feel kept — care made concrete through repeated presence"); Daniel as steward ("you tend to build operational systems that hold across time — the precedent and structure that keeps the institution working").

The dual-mode read shows each user where their making *changes* under load. Daniel's healthy stewardship vs his pressure-driven non-delegation. Cindy's healthy presence vs her pressure-driven self-erasure. Jason's healthy structural mastery vs his pressure-driven over-refinement.

Work Map stays in Supporting Signals. The canon line *"Hands is what your life makes real. Work Map is where that making may fit"* lives in the Hands card render, completing the distinction.

After this CC, the queue advances to CC-PROGRESSIVE-DISCLOSURE-FRONT-PAGE — the final assembly CC that takes all the corrected pieces (4-layer Grip Pattern, 9 body cards including Hands, Goal/Soul/Aim/Grip score layer) and restructures the full report around the canonical Page 1 / Page 2 architecture.
