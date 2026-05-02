# CC-042 — Work Map (Work Registers + Light Example Anchors)

**Type:** New derivation framework + new visual section. **No new questions, no new signals.** Composes existing measurements (Lens aux-pair register, Drive distribution, OCEAN, Q-E1 energy allocation, Compass values, Q-Ambition1, Path agency aspiration) into a vocational/work derivation. Mirrors CC-037's architectural pattern (Disposition Map): new `lib/workMap.ts`, new `WorkMap.tsx` component, new page section parallel to Disposition Map.
**Goal:** Produce a system-derived "Work Map" that names 1–2 work registers the user is structurally aligned to — categories of vocation/hobby/skill that will come easy and feel meaningful given the user's cognitive register, motivational register, trait disposition, and value orientation. Each register carries 2–3 example anchors (specific vocations / hobbies / skills) to ground the abstract category. The user is never asked vocation-specific questions; the Work Map composes from existing measurements.
**Predecessors:** CC-037 (Disposition Map architectural template), CC-038 / CC-038-prose / CC-038-body-map (aux-pair register foundation), CC-033 (Drive cost relabel + Q-Ambition1), CC-040 (Drive coverage relabel). All shipped.
**Successor:** CC-043 (Love Map) and CC-044 (Giving Map) likely follow the same architectural pattern. Each adds another sibling section under the same triadic decomposition Jason articulated: *if we can derive Work / Love / Giving from existing signals, the instrument delivers the full purpose-direction read without adding any survey questions*.

---

## Why this CC

The instrument already measures every component of vocational fit at high resolution:

- **Lens aux-pair register** (16 cells, post-CC-038) — cognitive style. Each register carries a `short_description`, `healthy_expression`, `distorted_expression`, `body_map_route`, and a `gift_category` route. The architect, the surgeon, the operator, the imaginer, etc. each align naturally with different work registers.
- **Drive distribution** (3 buckets, post-CC-040) — what motivates exertion. Cost-leaning users gravitate toward building/wealth/ambition work; coverage-leaning toward service/relational/communal work; compliance-leaning toward preservation/risk-mitigation/institutional work.
- **OCEAN distribution** (5 buckets, post-CC-037) — Big-5 trait disposition. Empirical correlations with vocational fit are well-documented.
- **Q-E1 energy allocation** — outward (building / solving / restoring) vs inward (caring / learning / enjoying). Direct vocational signal.
- **Compass values + concrete stakes** — Truth+Knowledge → research/scholarship; Justice → law/advocacy; Compassion+Mercy → caring professions; Freedom → entrepreneurship/independent work; Stability → institutional roles.
- **Q-Ambition1** (post-CC-033) — Success / Fame / Wealth / Legacy. Shapes which kinds of "wins" feel meaningful.
- **Path agency aspiration** — current vs aspirational creator/relational/stability/exploration. Whether the user's current life is composing with their aspirational register.

The composite read across these seven discriminates vocational fit at high resolution without any new questions. Per the standing memory rule (`feedback_minimal_questions_maximum_output.md`), this is exactly the kind of derivation work the instrument should do — pattern-catalog over existing signals, not new measurement.

This is also the first of three sibling outputs Jason has named: **Work / Love / Giving**. Each maps the user's composite read onto a purpose-domain. CC-042 builds the architecture; CC-043 and CC-044 follow with parallel structures.

---

## Scope

Files modified or created:

1. **NEW** — `lib/workMap.ts`. Houses the 8 work-register definitions (key, label, description, composite-predicate, example-anchors), the matching/scoring function, the prose generator. Mirrors `lib/ocean.ts`'s structure.
2. `lib/types.ts` — add `WorkRegisterKey`, `WorkRegister`, `WorkMapOutput` types.
3. `lib/identityEngine.ts` — wire `computeWorkMapOutput` into the engine pipeline; extend `EngineOutput` (or whatever the canonical aggregate type is) to include `workMap?: WorkMapOutput`.
4. **NEW** — `app/components/WorkMap.tsx`. Renders 1–2 matching work registers with their example anchors. Editorial register matching `OceanBars.tsx` and `PieChart.tsx`.
5. `app/components/InnerConstitutionPage.tsx` (or wherever the report assembles sections) — render the Work Map page section. Position: after Disposition Map (Mirror → Disposition Map → Work Map → Compass), or after Path · Gait — flag both options for the executor's verification against the existing layout.
6. **NEW** — `docs/canon/work-map.md`. Canon doc parallel to `ocean-framework.md`.
7. `docs/canon/output-engine-rules.md` — add Work Map to the engine pipeline section.
8. `docs/canon/shape-framework.md` — note Work Map as a non-card page section (parallel to Disposition Map).

Nothing else. **No new questions. No new signals. No changes to existing measurements.** The Work Map is pure derivation.

---

## The 8 work registers — locked structure (v1 placeholder content)

Each register has six fields:

```ts
type WorkRegister = {
  register_key: WorkRegisterKey;
  register_label: string;
  short_description: string;
  composite_predicate: (inputs: WorkMapInputs) => number; // 0..1 fit score
  example_anchors: string[]; // 2-3 specific vocations / hobbies / skills
  composes_naturally_with: FunctionPairKey[]; // aux-pair registers that often land here
};
```

The 8 v1 registers and their starting content (analog labels, descriptions, anchors are workshop material; `composite_predicate` logic and `composes_naturally_with` are canonical):

### 1. Strategic / Architectural
- **Label:** "Strategic / Architectural Work"
- **Description:** "Work that requires holding the long arc *and* building the structure to realize it. Time horizons matter; the work compounds across years rather than weeks. Composes with the architect, the strategist, the long-arc minds."
- **Composes with:** NiTe (the architect), TeNi (the strategist), TiNe (the questioner) when system-responsibility ranks high
- **Predicate:** Lens register in {NiTe, TeNi, TiNe} AND (Drive cost-leaning OR creator-aspiration) AND OCEAN.O > 18% AND OCEAN.C > 18%
- **Example anchors:** "research lab leadership / R&D direction; strategic planning, architectural practice; founder roles; academic department leadership"

### 2. Analytical / Investigative
- **Label:** "Analytical / Investigative Work"
- **Description:** "Work that rewards precision-thinking and the discipline of testing what is actually claimed. The texture is depth-of-understanding, not breadth-of-output."
- **Composes with:** TiNe (the questioner), TiSe (the troubleshooter), NeTi (the prober), SiTe (the keeper) when truth/knowledge ranks high
- **Predicate:** Lens register in {TiNe, TiSe, NeTi} OR (Lens dominant in {ti, ni} AND truth_priority OR knowledge_priority in Compass top 3) AND OCEAN.O > 18%
- **Example anchors:** "research scientist; data analyst; investigative journalist; archivist; technical writer"

### 3. Embodied / Craft / Precision
- **Label:** "Embodied Craft Work"
- **Description:** "Work that lives in the body — skill expressed through hands, presence, timing, contact. The framework is internalized; the doing is precise because the body knows."
- **Composes with:** SeTi (the surgeon), SeFi (the artist), TiSe (the troubleshooter)
- **Predicate:** Lens register in {SeTi, SeFi, TiSe} AND (building_energy_priority OR restoring_energy_priority high in Q-E1) AND OCEAN.C > 18%
- **Example anchors:** "surgeon, technician, master craftsperson; performer / athlete; chef, instrument-maker"

### 4. Caring / Direct-Service
- **Label:** "Caring / Direct-Service Work"
- **Description:** "Work that lives in attending to people in concrete need. The texture is presence with another's experience; the reward is the relational continuity itself."
- **Composes with:** FiSe (the witness), FeSi (the kinkeeper), SeFi (the artist) when caring_energy ranks high
- **Predicate:** Lens register has Fi or Fe as driver or instrument AND (Drive coverage-leaning) AND caring_energy_priority high in Q-E1 AND (compassion_priority OR family_priority in Compass top 3) AND OCEAN.A > 22%
- **Example anchors:** "nurse, hospice worker, social worker; therapist, counselor; teacher, midwife, hospice chaplain"

### 5. Pastoral / Counselor / Long-Arc Relational
- **Label:** "Pastoral / Counselor Work"
- **Description:** "Work that holds an unhurried sense of who someone is becoming and tends that becoming through patient relational presence. Long-arc relational, not direct-care urgent."
- **Composes with:** NiFe (the seer), FeNi (the pastor), FiNe (the imaginer)
- **Predicate:** Lens register in {NiFe, FeNi, FiNe} AND (Drive coverage-leaning) AND (faith_priority OR mercy_priority OR family_priority in Compass top 3) AND OCEAN.A > 18% AND legacy_priority OR success_priority in Q-Ambition1
- **Example anchors:** "psychotherapist, spiritual director; coach, mentor, advisor; clergy, pastoral counselor"

### 6. Civic / Advocacy / Justice
- **Label:** "Civic / Advocacy Work"
- **Description:** "Work that names what is owed and protects those who can't protect themselves. Values-driven public action; the texture is structural-ethical."
- **Composes with:** FiNe (the imaginer), FeNi (the pastor), NeFi (the catalyst), TiNe (the questioner) when justice ranks high
- **Predicate:** justice_priority in Compass top 3 AND (individual_responsibility_priority AND system_responsibility_priority) in Gravity AND (Drive coverage-leaning OR balanced)
- **Example anchors:** "lawyer (public-interest, civil rights); activist, organizer; nonprofit leadership; public servant, policy advisor"

### 7. Generative / Creative / Inspirational
- **Label:** "Generative / Creative Work"
- **Description:** "Work that turns possibilities into invitations. The texture is values-as-expression; the gift is naming what could become true so others can see it."
- **Composes with:** NeFi (the catalyst), FiNe (the imaginer), SeFi (the artist), NeTi (the prober) when learning/enjoying energy ranks high
- **Predicate:** Lens register has Ne or Fi as driver AND (Drive variable — often coverage but can be cost) AND OCEAN.O > 22% AND (learning_energy_priority OR enjoying_energy_priority in Q-E1)
- **Example anchors:** "writer, artist, designer; teacher (creative subjects); marketing/brand, copywriter; performer, filmmaker"

### 8. Operational / Institutional / Stewardship
- **Label:** "Operational / Stewardship Work"
- **Description:** "Work that keeps systems running through standards, precedent, duty, and operational trust. The texture is reliability over years; the gift is making the institution continue to work."
- **Composes with:** TeSi (the operator), SiTe (the keeper), SiFe (the family-tender)
- **Predicate:** Lens register in {TeSi, SiTe, SiFe} AND OCEAN.C > 22% AND (stability_priority OR honor_priority in Compass top 3) AND restoring_energy_priority OR solving_energy_priority high in Q-E1
- **Example anchors:** "operations management, COO; institutional administration; military / police leadership; project / program management"

---

## The matching algorithm — locked

Score each of the 8 registers against the user via `composite_predicate`. Predicate returns 0..1 (or a multi-factor score that normalizes to 0..1). Top 1–2 registers (above a threshold; recommend top-1 if score > 0.7, else top-2 if both > 0.5) become the user's Work Map output.

```ts
export function computeWorkMapOutput(
  signals: Signal[],
  answers: Answer[],
  lensStack: LensStack,
  driveOutput: DriveOutput | undefined,
  oceanOutput: OceanOutput | undefined,
  // ... other inputs as needed
): WorkMapOutput | undefined {
  const inputs: WorkMapInputs = { signals, answers, lensStack, driveOutput, oceanOutput };
  const scored = WORK_REGISTERS.map((r) => ({
    register: r,
    score: r.composite_predicate(inputs),
  }));
  scored.sort((a, b) => b.score - a.score);

  // Threshold logic: top-1 if score > 0.7, else top-2 if both > 0.5, else degrade gracefully.
  const top = scored[0];
  if (top.score > 0.7) return { matches: [top], prose: generateWorkProse([top]) };
  const second = scored[1];
  if (top.score > 0.5 && second.score > 0.5) return { matches: [top, second], prose: generateWorkProse([top, second]) };
  if (top.score > 0.4) return { matches: [top], prose: generateWorkProse([top]) }; // single weak match
  return undefined; // no register fires above threshold
}
```

The threshold values (0.7 / 0.5 / 0.4) are workshop-tunable. Lock them as named constants in `lib/workMap.ts` so future tuning is visible.

---

## Render position

A new page section labeled **"Work Map"** rendered after the Disposition Map (which sits between Mirror and Compass per CC-037). New sequence: *Mirror → Disposition Map → **Work Map** → Compass → ...*

The section contains:

1. Section header: **"WORK MAP"** (mono uppercase, matches existing Disposition Map convention).
2. One-paragraph framing: *"Work registers the instrument detects you're structurally aligned to. Derived from your cognitive register, motivational distribution, trait disposition, and value orientation — not from any vocation-specific question. These are categories of work that will come easy and feel meaningful, not prescriptions."*
3. For each top-matching register: register label, short_description as a paragraph, example anchors as an italic list-line.
4. Footnote: *"Work Map is a derivation, not a recommendation. It names registers your existing answers point toward; it doesn't account for training, geographic constraints, or life-stage tradeoffs you bring to any career decision."*

---

## Steps

### 1. Create `lib/workMap.ts`

Mirror `lib/ocean.ts` structure. Lock the 8 work registers per the locked-content section above. Implement `computeWorkMapOutput`, `generateWorkProse`. Export the threshold constants.

### 2. Add types to `lib/types.ts`

```ts
export type WorkRegisterKey =
  | "strategic_architectural"
  | "analytical_investigative"
  | "embodied_craft"
  | "caring_service"
  | "pastoral_counselor"
  | "civic_advocacy"
  | "generative_creative"
  | "operational_stewardship";

export type WorkRegister = {
  register_key: WorkRegisterKey;
  register_label: string;
  short_description: string;
  example_anchors: string[];
  composes_naturally_with: FunctionPairKey[];
};

export type WorkMapMatch = {
  register: WorkRegister;
  score: number;
};

export type WorkMapOutput = {
  matches: WorkMapMatch[]; // 1-2 entries
  prose: string;
};
```

### 3. Wire `computeWorkMapOutput` into the engine pipeline in `lib/identityEngine.ts`

Position the call after `computeOceanOutput` and `computeDriveOutput` (so the Work Map can read both their outputs):

```ts
import { computeWorkMapOutput } from "./workMap";
// ...
const workMap = computeWorkMapOutput(signals, answers, lensStack, drive, ocean);
// ...
return {
  // ... existing output fields ...
  drive,
  ocean,
  workMap,
};
```

### 4. Create `app/components/WorkMap.tsx`

Renders 1–2 matching work registers. SVG- or text-based, matching the editorial register of `OceanBars.tsx`. Each match shows: register label, description, italic anchors line. Falls back to silent omission if `workMap === undefined` or `matches.length === 0`.

### 5. Render the Work Map page section

In the report-assembly component (likely `app/components/InnerConstitutionPage.tsx` per CC-037's executor finding), add the Work Map section immediately after the Disposition Map section. Render guarded on `constitution.workMap` being present.

### 6. Create `docs/canon/work-map.md`

Full canon doc:
1. **Why this framework exists** — derivation-over-existing-signals rationale; the Work / Love / Giving triadic decomposition Jason articulated.
2. **The 8 work registers** — full table with all fields per register.
3. **The matching algorithm** — threshold values, top-1-vs-top-2 logic, graceful degradation.
4. **Composite predicate inputs** — Lens aux-pair register + Drive distribution + OCEAN + Q-E1 + Compass + Q-Ambition1 + Path agency aspiration.
5. **Render position** — Work Map page section between Disposition Map and Compass; not a ShapeCard.
6. **Editorial policy** — register labels, descriptions, and anchors are v1 placeholders subject to a future workshop CC. The 8 register identities (`register_key`) and predicate logic are canonical.
7. **Sibling-output futures** — CC-043 (Love Map), CC-044 (Giving Map) will follow the same architectural pattern.

### 7. Update `docs/canon/output-engine-rules.md`

Add Work Map to the engine output pipeline section. Document the render position (between Disposition Map and Compass).

### 8. Update `docs/canon/shape-framework.md`

Add a section noting the Work Map as a non-card page section (parallel to Disposition Map). Note the Work / Love / Giving sibling pattern.

### 9. Verification

- `npx tsc --noEmit` exits 0.
- `npm run lint` passes.
- `npm run build` succeeds (modulo /admin).
- Existing test suite passes.
- Manual sweep — synthesize 4 archetypal user profiles and trace each through `computeWorkMapOutput`:
  - Archetype A (NiTe + cost-leaning Drive + high O+C + creator-aspiration) → expect Strategic / Architectural top match.
  - Archetype B (FeSi + coverage-leaning Drive + high A + caring-energy + family-priority) → expect Caring / Direct-Service top match.
  - Archetype C (TeSi + balanced Drive + high C + stability-priority + restoring-energy) → expect Operational / Stewardship top match.
  - Archetype D (NeFi + variable Drive + high O+E + learning-energy + freedom-priority) → expect Generative / Creative top match.

### 10. Browser smoke (Jason verifies)

Four sessions tuned to land on different work registers. Confirm each session's Work Map renders 1–2 matching registers with example anchors, the framing paragraph reads cleanly, the footnote about derivation-not-prescription is visible, the section sits cleanly between Disposition Map and Compass.

Edge case: a session whose composite read doesn't fire any register above the 0.4 threshold (e.g., a balanced user with no strong values or ambition signals) → Work Map gracefully omits or shows a "your read crosses multiple registers" fallback.

---

## Acceptance

- `lib/workMap.ts` exists and exports `WORK_REGISTERS` (8 entries), `computeWorkMapOutput`, `generateWorkProse`, threshold constants.
- `lib/types.ts` exports `WorkRegisterKey`, `WorkRegister`, `WorkMapMatch`, `WorkMapOutput`.
- `lib/identityEngine.ts` calls `computeWorkMapOutput` in the pipeline; aggregate output type includes `workMap?: WorkMapOutput`.
- `app/components/WorkMap.tsx` exists and renders matches with example anchors.
- The report assembly renders the Work Map section between Disposition Map and Compass when `workMap` is present.
- `docs/canon/work-map.md` exists with all 7 sections.
- `docs/canon/output-engine-rules.md` and `docs/canon/shape-framework.md` updated.
- `git diff --stat` shows changes only in named files.
- `npx tsc --noEmit` exits 0. `npm run lint` passes. `npm run build` succeeds (modulo /admin).
- Manual archetype sweep confirms 4 archetypes resolve to expected work registers.

---

## Out of scope

- **Adding vocation-specific questions** to firm up the Work Map. Future CC if browser smoke shows the derivation isn't discriminating enough — but per the standing memory rule, derive before measure.
- **Adding more than 8 work registers.** 8 is the locked starting taxonomy. Workshop refinement is post-ship.
- **Authoring a full vocational catalog** (hundreds of specific job titles). Each register has 2–3 example anchors only — anchors are *grounding handholds*, not exhaustive.
- **Renaming the 8 register keys.** `register_key` values are canonical and lock with this CC.
- **Tuning the predicate logic per register.** The predicates are v1; workshop refinement happens post-browser-smoke.
- **Building Love Map (CC-043) or Giving Map (CC-044) in this CC.** Sibling outputs are separate CCs.
- **Modifying CC-037 Disposition Map's render or logic.** Work Map is a sibling, not a replacement.
- **Adding cross-references between work registers and Tensions.** That's a future composition CC.
- **Renaming the section header** "WORK MAP". The label is canonical for the page-section register established by Disposition Map.
- **Wiring Work Map into the markdown export.** Future fix-CC if drift accumulates (per CC-041's pattern).
- **Authoring a "work-as-aspiration vs work-as-current" tension** that compares the user's current vocation register (asked? not in v1) vs the Work Map's matched register. Future CC if Jason wants to add that aspirational dimension.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Execution Directive

Single pass. The 8 register identities (`register_key`), predicate logic structure (composite-score function reading the listed inputs), and threshold constants are canonical. The register labels, descriptions, anchors, and `composes_naturally_with` lists are v1 placeholders — surface as workshop questions in Report Back rather than silently revising.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` (smoke only)
- `git diff --stat`
- `git status`

## Read First (Required)

- `AGENTS.md`
- `lib/ocean.ts` — architectural template. Read in full.
- `lib/drive.ts` — `weightFor` and the Drive output shape.
- `lib/identityEngine.ts` `FUNCTION_PAIR_REGISTER`, `getFunctionPairRegister`, the engine pipeline.
- `lib/types.ts` — `LensStack`, `DriveOutput`, `OceanOutput`, `FunctionPairKey`, `ShapeCardId`.
- `app/components/OceanBars.tsx` — visual register template.
- `app/components/InnerConstitutionPage.tsx` — the report-assembly component (verify with Read first per CC-037's executor finding).
- `docs/canon/ocean-framework.md` — canon doc template.
- `docs/canon/function-pair-registers.md` — for the aux-pair register's role in Work Map composition.

## Allowed to Modify

- `lib/workMap.ts` (new)
- `lib/types.ts`
- `lib/identityEngine.ts`
- `app/components/WorkMap.tsx` (new)
- `app/components/InnerConstitutionPage.tsx` (or whatever component assembles the report — confirm via Read first)
- `docs/canon/work-map.md` (new)
- `docs/canon/output-engine-rules.md`
- `docs/canon/shape-framework.md`

## Report Back

1. **Files modified or created** with line counts.
2. **Verification results** — tsc, lint, build outputs.
3. **Manual archetype sweep** — paste the 4 archetypal traces and resolved registers.
4. **Predicate-tuning observations** — flag any register whose composite_predicate reads as overly narrow or overly broad against the archetypes.
5. **Editorial follow-up flags** — any register label, description, or anchor that read as obviously off during code review (workshop material, not silently-revised).
6. **Out-of-scope drift caught**.
7. **Browser smoke deferred to Jason**.
8. **Sibling-output recommendations** — confirm CC-043 (Love Map) and CC-044 (Giving Map) remain queued; flag whether the Work Map's derivation pattern transfers cleanly to Love/Giving (likely yes, with different predicate inputs and register taxonomies).

---

## Notes for the executing engineer

- Work Map is a **derivation layer**, not a measurement layer. The user is never asked vocation-specific questions; the Work Map composes from existing signals. This is the canonical architectural posture per `feedback_minimal_questions_maximum_output.md`.
- The 8 register identities are locked. The labels and anchors are workshop material. If a label reads obviously off (e.g., "Caring / Direct-Service Work" feels too clinical), surface as a workshop question. Don't silently rewrite.
- The `composite_predicate` for each register is your authoring task — write the predicate that reads the inputs and returns a 0..1 score. The locked content above describes the *intent* of each predicate; the implementation choice (boolean ANDs, weighted scoring, percentile-based thresholds) is yours within the locked intent.
- Top-1-vs-top-2 thresholds (0.7 / 0.5 / 0.4) are starting values. Export them as named constants so post-smoke tuning is visible.
- The Work Map renders 1–2 matches, not all 8. The user should land on a tight register read, not a horoscope spread. If multiple registers fire above 0.5, take only the top 2; if only one fires above 0.5, render that one alone; if none fire above 0.4, return undefined and the section gracefully omits.
- Pre-CC-042 saved sessions: re-rendering picks up the new Work Map automatically when the engine re-runs. The `workMap` field is optional on the aggregate type, so saved sessions without it render gracefully.
- The "example_anchors" field is the load-bearing user-facing content for grounding. Each anchor should name a recognizable vocation/role/skill. Anchors are illustrative, not exhaustive — the framing paragraph and footnote both reinforce the derivation-not-prescription register.
- Sibling outputs (Love Map, Giving Map) will follow this CC's pattern. If during execution you notice an architectural decision that should generalize across all three, flag it in Report Back rather than committing to a generalization in CC-042.
