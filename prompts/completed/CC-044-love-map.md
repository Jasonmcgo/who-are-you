# CC-044 — Love Map (Love Registers + Flavors + Resource Balance Diagnostic)

**Type:** New derivation framework + new visual section. **No new questions, no new signals.** Mirrors CC-042's Work Map architectural pattern: derives from existing Lens aux-pair register + Drive distribution + OCEAN + Compass values + Q-X4 trust portfolio + Q-S3 money allocation + Q-E1 energy allocation + Q-Stakes1 + Q-Ambition1.
**Goal:** Produce a system-derived "Love Map" that names the user's love-register (1 of 7 character-types), love-flavors (top 1–3 of 7 functional modes), and a Resource Balance diagnostic (when self-vs-other investment is distorted). The user is never asked love-specific questions; the Love Map composes from existing measurements. Ships as a standalone page section after Work Map (Mirror → Disposition Map → Work Map → Love Map → Compass).
**Predecessors:** CC-042 (Work Map architectural template), CC-038 / CC-038-prose / CC-038-body-map (aux-pair register foundation), CC-037 (OCEAN), CC-033 (Drive cost relabel), CC-040 (Drive coverage relabel), CC-043 (Q-Stakes1 cleanup).
**Successor:** CC-045 (Giving Map — third sibling). CC-044-prose (editorial polish on register/flavor labels and prose tone).

---

## Why this CC

The 3C's framework — Building / People-Service-Society / Risk-management — is canonically exhaustive for *where human drive goes*. The triadic decomposition Jason articulated for purpose-output (**Work / Love / Giving**) maps onto the Drive framework: Work expresses the cost-axis, Love expresses the intimate sub-register of coverage, Giving expresses the expansive sub-register of coverage. CC-042 shipped the Work output. CC-044 ships the Love output.

Love is structurally distinct from Work in two ways:

1. **Love operates on multiple architectural layers.** Where Work is well-described by *register × flavor × example anchors* (CC-042's structure), Love benefits from a six-layer architecture surfaced through workshop with Jason 2026-04-29:
   - **Layer 1**: Love-as-a-whole — Pauline framing (1 Corinthians 13). Universal/normative; what real love is and refuses to be. Lives in canon, not user-facing prose.
   - **Layer 2**: Register (7) — character-type / cognitive-relational shape; composes with aux-pair register.
   - **Layer 3**: Flavor (7) — functional mode; what love DOES for the person.
   - **Layer 4**: Virtue baseline — Pauline negatives applied per register as distortion-diagnostic vocabulary.
   - **Layer 5**: Bond type (Greek 4: Eros / Philia / Storge / Agape) — sampled from existing signals; *deferred to follow-on CC* (not in scope for CC-044).
   - **Layer 6**: Resource Balance — self-vs-other investment ratio; surfaces as a diagnostic when distortion fires.

2. **Love touches existential territory more directly than Work.** Mistakes in tone read as the instrument missing the user in a way that Work-register mistakes don't. Editorial polish gets a higher bar; CC-044 ships the data spine with v1 placeholder content; CC-044-prose handles refinement.

The architecture is locked structurally; analog labels, register descriptions, flavor descriptions, and Resource-Balance prose are workshop material per the pattern CC-038 / CC-042 established.

---

## Scope

Files modified or created:

1. **NEW** — `lib/loveMap.ts`. Houses 7 love-register definitions, 7 flavor definitions, predicate functions for each, the matching/scoring algorithm, the Resource Balance diagnostic computation, and the prose generator. Mirrors `lib/workMap.ts` and `lib/ocean.ts` structure.
2. `lib/types.ts` — add `LoveRegisterKey`, `LoveRegister`, `LoveFlavorKey`, `LoveFlavor`, `LoveMapMatch`, `ResourceBalanceCase`, `LoveMapOutput` types. Extend `InnerConstitution` (or aggregate type) with optional `loveMap` field.
3. `lib/identityEngine.ts` — wire `computeLoveMapOutput` into the engine pipeline after `computeWorkMapOutput`. Pass signals + answers + lensStack + driveOutput + oceanOutput + agency.
4. **NEW** — `app/components/LoveMap.tsx`. Renders the matched register, top 1–3 flavors, and Resource Balance diagnostic (when present). Editorial register matching `WorkMap.tsx` and `OceanBars.tsx`.
5. `app/components/InnerConstitutionPage.tsx` (or whichever component assembles the report — verify with Read) — render Love Map page section between Work Map and Map. Guard on `constitution.loveMap && (matches.length > 0 || resourceBalance.case !== "healthy")`.
6. **NEW** — `docs/canon/love-map.md`. Full canon doc covering all six architectural layers; Pauline reconciliation; Greek 4 bond-type acknowledgment with deferred-to-CC-045+ note; editorial policy; sibling-output futures.
7. `docs/canon/output-engine-rules.md` — add Love Map pipeline section after Work Map.
8. `docs/canon/shape-framework.md` — add Love Map as third non-card page section (after Disposition Map and Work Map).

Nothing else. **No new questions, no new signals, no changes to existing measurements, no edits to existing ShapeCards.**

---

## The 7 love registers — locked structure (v1 placeholder content)

Each register has these fields:

```ts
type LoveRegister = {
  register_key: LoveRegisterKey;
  register_label: string;        // v1 placeholder, refined in CC-044-prose
  short_description: string;      // v1 placeholder
  composite_predicate: (inputs: LoveMapInputs) => number; // 0..1 fit score
  composes_naturally_with: FunctionPairKey[];
  characteristic_distortion: string; // v1 placeholder; references Pauline negative
};
```

The 7 v1 registers:

### 1. The Devoted Partner (pair-bond)
- **Label:** "the Devoted Partner"
- **Short description:** "Love as long-arc commitment to one chosen person; pair-bond continuity; the steady architecture of a shared life."
- **Predicate:** `partner_trust_priority` top of Q-X4-relational AND (`loyalty_priority` OR `family_priority` in Compass top 3) AND (`family_spending_priority` rank ≤ 2 in Q-S3-close) AND (`close_relationships_stakes_priority` top 2 of Q-Stakes1) AND aux-pair register has Pair-Bonder-friendly shape (most pairs except Open-Heart Ne-Fi-driven types)
- **Characteristic distortion:** "Pair-bond commitment hardening into accountancy — a quiet ledger of who's owed what, who broke faith first, what hasn't been forgiven. Pauline diagnostic: *keeps no record of wrongs*."

### 2. The Parental Heart (cultivation)
- **Label:** "the Parental Heart"
- **Short description:** "Love as protective cultivation of what's becoming; the patient tending of someone or something growing into its own form."
- **Predicate:** (`family_priority` in Compass top 3) AND (`caring_energy_priority` in Q-E1-inward top 2) AND (`family_spending_priority` rank ≤ 2 in Q-S3-close) AND (`close_relationships_stakes_priority` top 2 of Q-Stakes1) AND coverage-leaning Drive
- **Characteristic distortion:** "Cultivation tipping into control — tending what's becoming until the becoming has to match the tender's image of it. Pauline diagnostic: *is not self-seeking* + *does not dishonor others* (treating the cultivated as instrument rather than presence)."

### 3. The Chosen Family (network/hub)
- **Label:** "the Chosen Family"
- **Short description:** "Love as the self-selected web of close ties held through ritual and faithful presence; many-held-together rather than one-held-deeply."
- **Predicate:** (`friend_trust_priority` rank ≤ 2 in Q-X4-relational) AND (`friends_spending_priority` rank ≤ 2 in Q-S3-close) AND (`social_spending_priority` rank ≤ 2 in Q-S3-wider) AND (`loyalty_priority` in Compass top 3) AND aux-pair register in {FeSi, SiFe, FeNi, FiSe} preferred
- **Characteristic distortion:** "Web-keeping turning into performance — the connections held for the sake of being-the-keeper, not for the people inside them. Pauline diagnostic: *does not boast* + *is not proud*."

### 4. The Companion (steady-presence-beside)
- **Label:** "the Companion"
- **Short description:** "Love as steady presence beside, friend-as-witness; the quiet alongside that doesn't try to lift, fix, or claim — just stays."
- **Predicate:** (`friend_trust_priority` rank ≤ 2) AND (`partner_trust_priority` rank ≤ 2) both moderate-balanced AND (`caring_energy_priority` moderate, not necessarily top) AND (`freedom_priority` OR `truth_priority` in Compass top 3)
- **Characteristic distortion:** "Presence-without-presence — steady but disengaged; the companion who's there but not engaged enough to interrupt drift. Pauline diagnostic: *always protects* + *rejoices with the truth* — failure to actively care when truth requires it."

### 5. The Belonging Heart (community/faith membership)
- **Label:** "the Belonging Heart"
- **Short description:** "Love as belonging-to-something-larger; community, faith, civic membership — the love of being-part-of, not just being-with."
- **Predicate:** (`faith_priority` in Compass top 3 OR `religious_trust_priority` rank ≤ 2 in Q-X3 institutional trust) AND (`nonprofits_religious_spending_priority` rank ≤ 2 in Q-S3-wider) AND (`family_priority` in Compass top 3 — communities often function as extended family) AND coverage-leaning Drive
- **Characteristic distortion:** "Tribal coding — love of belonging hardening into in-group loyalty + out-group cruelty. Pauline diagnostic: *does not dishonor others* + *does not delight in evil* (when 'evil' gets coded as the out-group)."

### 6. The Loyalist (Fi-driver values-anchored)
- **Label:** "the Loyalist"
- **Short description:** "Love as the unflinching anchor for what matters most; Fi-driver loyalty without show; values-rooted devotion that doesn't require performance."
- **Predicate:** Fi as driver in aux-pair register (FiNe or FiSe) AND (`justice_priority` OR `truth_priority` in Compass top 3) AND (`holds_internal_conviction` OR `high_conviction_under_risk` signal fires) AND (`close_relationships_stakes_priority` top 3 of Q-Stakes1 but not necessarily top 1)
- **Characteristic distortion:** "Values-loyalty hardening into rigidity; the anchor becomes the verdict. Pauline diagnostic: *is not easily angered* + *keeps no record of wrongs* — values-rooted loyalty turning into grievance accountancy."

### 7. The Open Heart (Ne-driver distributed possibility)
- **Label:** "the Open Heart"
- **Short description:** "Love as continuous invitation toward becoming, distributed across many; Ne-driver breadth-of-attention; the catalyst's love."
- **Predicate:** Ne as driver in aux-pair register (NeTi or NeFi) AND (`freedom_priority` in Compass top 3) AND (`learning_energy_priority` AND `enjoying_energy_priority` both rank ≤ 2 in Q-E1-inward) AND (`social_spending_priority` rank ≤ 2 in Q-S3-wider)
- **Characteristic distortion:** "Distributed attention failing to follow through; the invitation extended without the staying-with that makes it real. Pauline diagnostic: *always perseveres* + *always protects*."

---

## The 7 flavors — locked structure (v1 placeholder content)

Each flavor has these fields:

```ts
type LoveFlavor = {
  flavor_key: LoveFlavorKey;
  flavor_label: string;
  short_description: string;
  signal_predicate: (inputs: LoveMapInputs) => number; // 0..1 fit score
};
```

The 7 v1 flavors:

### 1. Commitment / Loyalty (durability)
- **Predicate:** `loyalty_priority` in Compass top 3 AND (`holds_internal_conviction` OR `high_conviction_under_risk`) AND (`partner_trust_priority` OR `family_trust_priority` rank ≤ 2 in Q-X4-relational) AND `family_priority` in Compass top 5

### 2. Fun / Adventure / Living Life (vitality)
- **Predicate:** (`enjoying_energy_priority` rank ≤ 2 in Q-E1-inward) AND (`freedom_priority` in Compass top 3) AND (`social_spending_priority` rank ≤ 2 in Q-S3-wider) AND (`learning_energy_priority` rank ≤ 2 in Q-E1-inward)

### 3. Building / Co-construction (practical)
- **Predicate:** (`building_energy_priority` rank ≤ 2 in Q-E1-outward) AND (`family_spending_priority` rank ≤ 2 in Q-S3-close) AND (`agency.aspirational` in {creator, stability}) AND (`success_priority` AND `family_priority` both in top 3 of their respective rankings)

### 4. Championing (goal-support)
- **Predicate:** (`caring_energy_priority` moderate-high in Q-E1-inward) AND (`mentor_trust_priority` rank ≤ 2 in Q-X4-relational) AND (`success_priority` OR `legacy_priority` in Q-Ambition1 top 2) AND (`individual_responsibility_priority` in Q-C4 top 2)

### 5. Tenderness / Care (comfort)
- **Predicate:** (`caring_energy_priority` rank ≤ 2 in Q-E1-inward) AND (`compassion_priority` AND `mercy_priority` both in Compass top 5) AND (Fe as driver OR instrument in aux-pair register) AND (`family_priority` in Compass top 3)

### 6. Witnessing / Recognition (being-seen)
- **Predicate:** Fi as driver in aux-pair register AND (`truth_priority` AND `family_priority` both composing in Compass top 5) AND (`holds_internal_conviction` signal fires) AND (`partner_trust_priority` AND `friend_trust_priority` both rank ≤ 2 in Q-X4-relational)

### 7. Devotion to a Calling (passion-as-identity)
- **Predicate:** (`legacy_priority` in Q-Ambition1 top 2) AND (`building_energy_priority` rank ≤ 2 in Q-E1-outward) AND (`knowledge_priority` OR `honor_priority` in Compass top 3) AND love-object includes non-personal (high `building_energy` + low `caring_energy` proxy)

**Pleasure / Eros NOT included as a flavor** — Eros stays at Layer 5 bond-type only (deferred). Provision/Stability and Truth-Telling/Honesty NOT included in v1 — candidate flavors that browser smoke can promote in a follow-on CC if the 7-flavor coverage reads thin.

---

## The Resource Balance diagnostic — locked structure

Computes the user's self-investment-vs-other-investment ratio across spending, energy, and stakes signals. Surfaces only when distortion fires.

```ts
type ResourceBalanceCase = "healthy" | "inward_heavy" | "outward_depleted" | "thin_overall";

type ResourceBalance = {
  case: ResourceBalanceCase;
  selfScore: number;     // 0..1, composite of self-investment signals
  otherScore: number;    // 0..1, composite of other-investment signals
  prose: string;         // empty for "healthy"; locked text for the three distortion cases
};
```

**Self-investment signals (sum and normalize):**
- `self_spending_priority` rank in Q-S3-close (high rank = high self-investment)
- `enjoying_energy_priority` rank in Q-E1-inward
- `learning_energy_priority` rank in Q-E1-inward
- `freedom_priority` rank in Compass
- Q-Ambition1 signals (`success_priority`, `fame_priority`, `wealth_priority`, `legacy_priority`) — sum of top-rank weights

**Other-investment signals (sum and normalize):**
- `family_spending_priority`, `friends_spending_priority` ranks in Q-S3-close
- `social_spending_priority`, `nonprofits_religious_spending_priority` ranks in Q-S3-wider
- `caring_energy_priority` rank in Q-E1-inward
- `family_priority`, `loyalty_priority`, `compassion_priority`, `mercy_priority` ranks in Compass
- Full Q-X4 relational trust rank composite

**Case classifier:**
- `healthy`: |selfScore - otherScore| ≤ 0.20 AND both > 0.30 (proportional + present)
- `inward_heavy`: selfScore - otherScore > 0.25
- `outward_depleted`: otherScore - selfScore > 0.25 AND selfScore < 0.30
- `thin_overall`: selfScore < 0.30 AND otherScore < 0.30

**Locked prose templates:**

```ts
const RESOURCE_BALANCE_PROSE: Record<ResourceBalanceCase, string> = {
  healthy: "", // not surfaced
  inward_heavy:
    "Your love map shows strong self-investment relative to other-investment — your money, energy, and stakes weight noticeably toward yourself. Self-care matters as the substrate for loving others, but if the balance stays heavily inward over time, the love-orientation outward may stay underdeveloped. The question isn't whether you should care for yourself; it's whether the care for yourself is making room for caring for others, or replacing it.",
  outward_depleted:
    "Your love map shows minimal self-investment relative to other-investment — your resources are flowing outward without much returning to keep the source full. Selfless love is real, but a love that empties the lover eventually has nothing left to give. Self-care isn't selfishness; it's the resource-base from which sustainable other-directed love operates. The question isn't whether you should give less; it's whether you're giving in a way that's still possible to keep giving.",
  thin_overall:
    "Your love map shows light investment in both self and others. This may simply be a season — life-stage, capacity, attention all elsewhere — or it may be that love-orientation hasn't yet had the chance to settle into form. Either way, the map below describes the shape your love would tend to take if it were more fully developed; the shape is real even when the practice is still arriving.",
};
```

---

## The matching algorithm — locked

Mirrors CC-042's threshold logic with one addition (Resource Balance always evaluated but only surfaced when distorted):

```ts
export function computeLoveMapOutput(
  signals: Signal[],
  answers: Answer[],
  lensStack: LensStack,
  driveOutput: DriveOutput | undefined,
  oceanOutput: OceanOutput | undefined,
  agency: AgencyPattern,
): LoveMapOutput | undefined {
  const inputs: LoveMapInputs = { signals, answers, lensStack, driveOutput, oceanOutput, agency };

  // 1. Score each register
  const registerScores = LOVE_REGISTERS.map((r) => ({
    register: r,
    score: r.composite_predicate(inputs),
  }));
  registerScores.sort((a, b) => b.score - a.score);

  // 2. Score each flavor
  const flavorScores = LOVE_FLAVORS.map((f) => ({
    flavor: f,
    score: f.signal_predicate(inputs),
  }));
  flavorScores.sort((a, b) => b.score - a.score);

  // 3. Compute Resource Balance
  const resourceBalance = computeResourceBalance(inputs);

  // 4. Threshold logic
  const topRegister = registerScores[0];
  const matchedRegisters = topRegister.score > 0.7
    ? [topRegister]
    : (topRegister.score > 0.5 && registerScores[1].score > 0.5
        ? [topRegister, registerScores[1]]
        : (topRegister.score > 0.4 ? [topRegister] : []));

  const matchedFlavors = flavorScores
    .filter((f) => f.score > 0.5)
    .slice(0, 3); // top 1-3 flavors

  // 5. Graceful undefined when nothing fires AND balance is healthy
  if (matchedRegisters.length === 0 && resourceBalance.case === "healthy") return undefined;

  return {
    matches: matchedRegisters,
    flavors: matchedFlavors,
    resourceBalance,
    prose: generateLoveProse(matchedRegisters, matchedFlavors, resourceBalance),
  };
}
```

Threshold constants (export as named constants for visible tuning):
- `LOVE_REGISTER_TOP1_THRESHOLD = 0.7`
- `LOVE_REGISTER_TOP2_FLOOR = 0.5`
- `LOVE_REGISTER_FLOOR = 0.4`
- `LOVE_FLAVOR_FLOOR = 0.5`
- `RESOURCE_BALANCE_DELTA_THRESHOLD = 0.25`
- `RESOURCE_BALANCE_THIN_FLOOR = 0.30`

---

## Render position

A new page section labeled **"LOVE MAP"** rendered after the Work Map. New sequence: *Mirror → Disposition Map → Work Map → **Love Map** → Compass → ...*

The section contains:

1. Section header: **"LOVE MAP"** (mono uppercase, matches existing section conventions).
2. One-paragraph framing (locked content): *"Love takes many shapes — what follows describes how your love tends to take shape, not whether your love is real. Real love, regardless of register or flavor, is patient and kind, persists, refuses to keep records, rejoices with truth. The map below names the shape; the qualities it must meet to be love at all are not particular to any shape."* This is the load-bearing Pauline-frame acknowledgment that distinguishes the instrument from typology systems.
3. Matched register(s) with description.
4. Matched flavors as italic line: *"Expressed primarily through {flavor1} and {flavor2}{, with notes of {flavor3}}."*
5. Resource Balance diagnostic prose (when distortion fires; silent when healthy).
6. Composite prose paragraph composing register × flavors × characteristic_distortion (locked template per register).
7. Footnote: *"Love Map is a derivation, not a prescription. It names the register and modes your existing answers point toward; it doesn't account for life-stage, current circumstance, or the relationships you've actually chosen to invest in."*

---

## Steps

### 1. Create `lib/loveMap.ts`

Mirror `lib/workMap.ts` structure. Lock the 7 registers and 7 flavors per the locked-content sections above. Implement `computeLoveMapOutput`, `computeResourceBalance`, `generateLoveProse`. Export threshold constants.

### 2. Add types to `lib/types.ts`

```ts
export type LoveRegisterKey =
  | "devoted_partner"
  | "parental_heart"
  | "chosen_family"
  | "companion"
  | "belonging_heart"
  | "loyalist"
  | "open_heart";

export type LoveFlavorKey =
  | "commitment_loyalty"
  | "fun_adventure"
  | "building_construction"
  | "championing"
  | "tenderness_care"
  | "witnessing_recognition"
  | "devotion_to_calling";

export type LoveRegister = {
  register_key: LoveRegisterKey;
  register_label: string;
  short_description: string;
  composes_naturally_with: FunctionPairKey[];
  characteristic_distortion: string;
};

export type LoveFlavor = {
  flavor_key: LoveFlavorKey;
  flavor_label: string;
  short_description: string;
};

export type LoveRegisterMatch = {
  register: LoveRegister;
  score: number;
};

export type LoveFlavorMatch = {
  flavor: LoveFlavor;
  score: number;
};

export type ResourceBalanceCase = "healthy" | "inward_heavy" | "outward_depleted" | "thin_overall";

export type ResourceBalance = {
  case: ResourceBalanceCase;
  selfScore: number;
  otherScore: number;
  prose: string;
};

export type LoveMapOutput = {
  matches: LoveRegisterMatch[]; // 0-2 entries
  flavors: LoveFlavorMatch[];   // 0-3 entries
  resourceBalance: ResourceBalance;
  prose: string;
};
```

### 3. Wire `computeLoveMapOutput` into the engine pipeline in `lib/identityEngine.ts`

Position the call after `computeWorkMapOutput`. Same input pattern; aggregate output extends with `loveMap?: LoveMapOutput`.

### 4. Create `app/components/LoveMap.tsx`

Renders matched register, matched flavors, Resource Balance diagnostic. Editorial register matching `WorkMap.tsx`. SVG- or text-based; no chart needed (typography-driven like WorkMap).

### 5. Render the Love Map page section

In the report-assembly component, add the Love Map section immediately after the Work Map section. Render guarded on `constitution.loveMap && (matches.length > 0 || resourceBalance.case !== "healthy")` so that even users with no register match still see the Resource Balance diagnostic if it fires.

### 6. Create `docs/canon/love-map.md`

Full canon doc with:
1. **Why this framework exists** — derivation-over-existing-signals; Work/Love/Giving triadic decomposition.
2. **The six architectural layers** — Pauline / register / flavor / virtue baseline / bond type (deferred) / resource balance.
3. **The 7 registers** — full table with all fields per register.
4. **The 7 flavors** — full table.
5. **The Resource Balance diagnostic** — case classifier, prose templates, signal taxonomy.
6. **Pauline reconciliation** — 1 Corinthians 13 mapping; how Pauline qualities inform the canon framing and the per-register characteristic_distortion vocabulary; explicit note that Pauline references stay in canon, not user-facing prose.
7. **Greek 4 bond-type acknowledgment** — Eros / Philia / Storge / Agape exist as Layer 5; signal sampling is possible from existing measurements; *deferred to CC-045+ for surfacing in user-facing Love Map output*.
8. **Philautia handling** — explicitly handled at Layer 6 (Resource Balance), not as a register or bond-type. Self-love is healthy in proportion; distorted in either direction (inward-heavy or outward-depleted).
9. **Editorial policy** — register labels, descriptions, and prose are v1 placeholders; CC-044-prose handles refinement.
10. **Sibling-output futures** — CC-045 (Giving Map) follows this pattern.

### 7. Update `docs/canon/output-engine-rules.md`

Add Love Map pipeline section after Work Map.

### 8. Update `docs/canon/shape-framework.md`

Note Love Map as third non-card page section (after Disposition Map, Work Map). Document the Mirror → Disposition Map → Work Map → Love Map → Compass sequence.

### 9. Verification

- `npx tsc --noEmit` exits 0.
- `npm run lint` passes.
- `npm run build` succeeds (modulo pre-existing /admin Suspense issue).
- Existing test suite passes.
- Manual sweep — synthesize 5 archetypal user profiles and trace each:
  - **Archetype A** (NeFi register + caring_energy + family + partner_trust + coverage-leaning) → expect Devoted Partner OR Parental Heart top match; flavors include Commitment + Tenderness.
  - **Archetype B** (FeSi + family + friends + social_spending high + faith_priority high + religious_trust) → expect Chosen Family OR Belonging Heart top match; flavors include Tenderness + Building.
  - **Archetype C** (FiSe + justice_priority + holds_internal_conviction + close_relationships moderate) → expect Loyalist top match; flavors include Witnessing + Commitment.
  - **Archetype D** (NeFi + freedom + learning_energy + social_spending + light caring_energy + creator-aspiration) → expect Open Heart top match; flavors include Fun + Devotion-to-Calling.
  - **Archetype E** (high self_spending + low family_spending + low caring_energy + high success_priority) → expect Resource Balance: inward_heavy fires.
  - **Archetype F** (high family_spending + high caring_energy + high friends_spending + low self_spending) → expect Resource Balance: outward_depleted fires.

### 10. Browser smoke (Jason verifies)

Six sessions tuned to the archetypes above. Confirm:
- Love Map section sits cleanly between Work Map and Map.
- Register match prose composes coherently with flavor line and characteristic_distortion reference.
- Pauline framing paragraph reads as acknowledgment, not preaching.
- Resource Balance diagnostic surfaces only when distortion fires; healthy case is silent.
- Footnote about derivation-not-prescription is visible.
- Non-canonical Lens stacks (e.g., Si + Ne) gracefully degrade — Love Map either omits register match entirely OR matches based on the predicate logic that doesn't strictly require canonical aux-pair.

---

## Acceptance

- `lib/loveMap.ts` exports `LOVE_REGISTERS` (7), `LOVE_FLAVORS` (7), `computeLoveMapOutput`, `computeResourceBalance`, `generateLoveProse`, threshold constants.
- `lib/types.ts` exports all listed types.
- `lib/identityEngine.ts` calls `computeLoveMapOutput` in pipeline; aggregate output includes `loveMap?: LoveMapOutput`.
- `app/components/LoveMap.tsx` renders register + flavors + balance diagnostic.
- Report assembly renders Love Map between Work Map and Map.
- `docs/canon/love-map.md` exists with all 10 sections.
- `docs/canon/output-engine-rules.md` and `docs/canon/shape-framework.md` updated.
- `git diff --stat` shows changes only in named files.
- `npx tsc --noEmit` exits 0. `npm run lint` passes. `npm run build` succeeds (modulo /admin).
- Manual archetype sweep confirms expected matches across 6 archetypes.

---

## Out of scope

- **Adding love-specific questions.** Future CC if browser smoke shows derivation isn't discriminating enough — but per standing memory rule, derive before measure.
- **Adding more than 7 registers or more than 7 flavors.** Locked starting taxonomy. Workshop refinement is post-ship.
- **Adding Pleasure/Eros as a flavor.** Per workshop decision: dropped. Eros lives at Layer 5 bond-type, deferred.
- **Adding Provision/Stability or Truth-Telling/Honesty as flavors.** Candidate flavors not in v1; promote in a follow-on CC if browser smoke shows 7-flavor coverage reads thin.
- **Surfacing Greek 4 bond-type emphasis in user-facing prose.** Layer 5 deferred to CC-045+. Canon doc acknowledges; render does not.
- **Rendering Pauline references in user-facing prose.** Pauline stays in canon doc lineage and informs distortion-diagnostic vocabulary; the user-facing prose paraphrases the Pauline-frame in plain language (per the locked framing paragraph).
- **Treating Philautia as a register.** Self-love is handled at Layer 6 Resource Balance, not as a separate register or bond-type.
- **Building Giving Map (CC-045) in this CC.** Sibling output is separate.
- **Modifying CC-042 Work Map's logic or rendering.** Love Map is a sibling.
- **Adding cross-references between love registers and Tensions.** Future cross-reference CC.
- **Wiring Love Map into the markdown export.** Future fix-CC if drift accumulates.
- **Renaming the section header** "LOVE MAP" or the canonical layer terminology. Locked.
- **Authoring tension reads** for non-natural register × flavor combinations (e.g., Open Heart + Commitment). Could be future cross-reference CC; not in v1.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Execution Directive

Single pass. The 7 register identities (`register_key`), 7 flavor identities (`flavor_key`), Resource Balance case classifier (4 cases), threshold constants, and Pauline framing paragraph are canonical. Register labels, descriptions, characteristic_distortions, flavor labels and descriptions are v1 placeholders — surface as workshop questions in Report Back rather than silently revising. The Resource Balance prose templates are locked content (verbatim per the locked-content section).

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` (smoke only; kill before exiting)
- `git diff --stat`
- `git status`
- `ls`, `cat`, `grep`, `rg` (read-only)

## Read First (Required)

- `AGENTS.md`
- `lib/workMap.ts` — direct architectural template; read in full.
- `lib/ocean.ts` — secondary architectural reference.
- `lib/drive.ts` — `weightFor`, Drive output shape.
- `lib/identityEngine.ts` — `FUNCTION_PAIR_REGISTER`, `getFunctionPairRegister`, engine pipeline (post-CC-042 wiring).
- `lib/types.ts` — `LensStack`, `DriveOutput`, `OceanOutput`, `WorkMapOutput`, `FunctionPairKey`, `ShapeCardId`, `AgencyPattern`.
- `app/components/WorkMap.tsx` — visual register template.
- `app/components/InnerConstitutionPage.tsx` — report-assembly component (verify with Read first; CC-037 and CC-042 both used this file).
- `docs/canon/work-map.md` — canon doc template.
- `docs/canon/function-pair-registers.md` — for aux-pair register's role in Love Map composition.
- `prompts/completed/CC-042-work-map.md` — direct predecessor; read for architectural pattern.
- `prompts/completed/CC-038-prose.md` — for the canon principles (movement-not-type, single-word-label, mirror-pair-asymmetry) that Love Map should compose with.

## Allowed to Modify

- `lib/loveMap.ts` (new)
- `lib/types.ts`
- `lib/identityEngine.ts`
- `app/components/LoveMap.tsx` (new)
- `app/components/InnerConstitutionPage.tsx` (or whatever component assembles the report — confirm via Read first)
- `docs/canon/love-map.md` (new)
- `docs/canon/output-engine-rules.md`
- `docs/canon/shape-framework.md`

## Report Back

1. **Files modified or created** with line counts.
2. **Verification results** — tsc, lint, build outputs.
3. **Manual archetype sweep** — 6 archetypal traces and resolved registers/flavors/balance.
4. **Predicate-tuning observations** — flag any register or flavor whose composite_predicate reads as overly narrow or overly broad against the archetypes.
5. **Editorial follow-up flags** — any register label, description, characteristic_distortion, or flavor label/description that read as obviously off during code review (workshop material, not silently-revised).
6. **Out-of-scope drift caught**.
7. **Browser smoke deferred to Jason**.
8. **Sibling-output recommendations** — confirm CC-045 (Giving Map) remains queued; note whether the Love Map predicate pattern transfers cleanly to Giving (overlapping signal taxonomy with different focal-direction).

---

## Notes for the executing engineer

- Love Map is **derivation-only**. The user is never asked love-specific questions. Per standing memory rule.
- The 7 register identities and 7 flavor identities are canonical. The labels and descriptions are workshop material. Surface labels that read obviously off as questions in Report Back; don't silently rewrite.
- The Pauline framing paragraph (locked text in Render-Position section) is the load-bearing acknowledgment that distinguishes Love Map from typology. Don't paraphrase or shorten.
- The Resource Balance prose templates (locked text in the Resource-Balance section) are also locked content. Verbatim — these touch existential territory and the wording matters.
- Top-1-vs-top-2 register thresholds (0.7 / 0.5 / 0.4) and flavor floor (0.5) are starting values. Export as named constants so post-smoke tuning is visible.
- The Resource Balance diagnostic surfaces independently of register matching. A user with no strong register match but inward_heavy balance still sees the Resource Balance prose. A user with a strong register match AND healthy balance sees the register prose without a balance line. This is intentional — Resource Balance is a separate diagnostic axis.
- Non-canonical Lens stacks (Si+Ne, etc.) won't have an aux-pair register entry, but most love-register predicates don't strictly require canonical aux-pair — they read signal portfolios (Compass, trust, spending, energy). Verify graceful behavior in archetype sweep.
- The Open Heart + Commitment combination is a known *natural tension* (Ne-driver wants distributed connection; Commitment narrows). The composite prose can acknowledge it: *"Your Open Heart register expressed through Commitment is unusual, and worth attending to: you appear to commit by staying open *to* the person rather than narrowing toward them."* Other register × flavor tensions exist; CC-044-prose can author register × flavor tension reads as an editorial layer.
- Pre-CC-044 saved sessions: re-rendering picks up the new Love Map automatically. The `loveMap` field is optional on the aggregate type, so saved sessions without it render gracefully.
- Greek 4 bond-type emphasis (Eros / Philia / Storge / Agape) sampling from existing signals is architecturally possible but **explicitly out of scope** for v1. The canon doc acknowledges the layer exists; the surfacing is queued for CC-045+.
- Sibling Map outputs (Work, Love, Giving) ideally share a `lib/derivationThresholds.ts` if their threshold values converge. Hold for CC-045 to decide; CC-044 keeps thresholds local to `loveMap.ts`.
- The composite prose template per register that names register × top flavor × characteristic_distortion is the editorial centerpiece of Love Map output. v1 placeholders ship; CC-044-prose refines them with care because the prose touches grief and longing more directly than Work Map's prose did.
