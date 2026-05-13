# CC-AGE-CALIBRATION — Developmental-Band Calibration of the Trajectory Model

**Origin:** Jason canonized 2026-05-10:

> *"50 degrees by 50 years old is the correct trajectory toward purpose."*

Clarence refined 2026-05-10 (preferred over a literal `expected_angle = age` formula):

> *"Use developmental bands — formation, direction, integration, purpose consolidation, stewardship, wisdom/transmission."*

The trajectory model now carries a temporal dimension. The 50° life is age-relative, not absolute. Younger users get age-appropriate expectations; older users get integration framing. Solves the seasonality problem without flattening the directional metaphor.

This CC encodes the developmental bands as the canonical age-trajectory framework. The bands are *life stages* the user enters when their shape calls for them — age is a hint, not a determination. A user at 40 may still be in late "direction" if life delays have held them there; the bands respect that.

**Method discipline:** Engine for truth. The band classification is deterministic over age (with optional shape-signal nudges in subsequent CCs). LLM prose layer consumes the band as a register hint, never as a verdict. No "you're behind" framing — every band has its own dignity.

**Scope frame:** ~1-2 hours executor time. CC-standard scale. New module + audit + targeted prose-prompt updates so the LLM register adapts to band.

**Cost surface:** ~$0.50 cohort regeneration to re-run synthesis3 + grip paragraphs with band-aware prose register. Same cost economics as CC-RELIGIOUS-REGISTER-RULES.

---

## Embedded context (CC executor environments don't see Cowork memory)

### The six developmental bands

| Band | Approximate age | Life-stage character | Trajectory work |
|---|---|---|---|
| **Formation** | ~14–22 | Building self, identity, first commitments. Goal-line emerging from school/family. Soul-line untested. | Shape is forming; trajectory not yet measurable as commitment-bearing. The instrument's framework may not fully apply. |
| **Direction** | ~22–32 | Establishing trajectory, career foothold, partnership choice. Goal dominance is appropriate; Soul is beginning to register. | Goal-leaning trajectory expected; the work is to commit and to build. |
| **Integration** | ~32–45 | Bringing Soul to existing Goal-line. Relationships, parenthood, mentorship begin to weave through work. | Trajectory shifts toward balance; the work is to integrate, not to choose. |
| **Purpose consolidation** | ~45–55 | Refining what the work was for. Focusing. Beloved object becoming visible. | The 50° destination emerges; the work is to make the line steady and the beloved unmistakable. |
| **Stewardship** | ~55–70 | Carrying forward, mentoring, guarding what was built. Soul-leaning past 50°. | The work is to transmit, to govern legacy, to keep the line honest as seasons turn. |
| **Wisdom / Transmission** | ~70+ | Passing on what was learned. Integration becomes legacy. Trajectory is past steepness; line is becoming testimony. | The work is to be what the next generation needs to see. |

**Critical framings:**

1. **Bands are entered when life-shape calls them, not at strict age.** A user at 38 may be in Integration; another may still be in late Direction. Age is a primary hint, not a determination.
2. **Each band has its own dignity.** No band is "behind" another. A user in Formation is not failing to be in Direction; they're doing the formation work. Prose register reflects this.
3. **The trajectory metaphor is age-relative.** A 25-year-old at 25° is on-track for their stage. A 60-year-old at 25° is significantly off-trajectory — but the prose names that as *"more of the integration work is still ahead,"* never as *"behind."*

### What "50 by 50" actually means

The phrase is a directional anchor, not a numeric law. It means:

- The 50° integrated trajectory is the canonical destination of mid-life work
- It's expected to consolidate around the Purpose Consolidation band (45–55)
- It's not expected before that band; it's not unhealthy to remain there past it
- "50 by 50" is the canon line; the engine's bands are the operational mechanism

### Why bands beat a linear formula

A linear `expected_angle = age` formula has three problems:

1. **It implies precision the engine doesn't have.** Saying "you're at 32° at 35; you should be at 35°" creates false-precision anxiety.
2. **It pathologizes life-stage variance.** Someone who delayed career to caregive isn't "behind"; they're doing different work.
3. **It collapses qualitative differences into quantitative ones.** The 32–45 work is qualitatively different from the 45–55 work; the band framework captures the difference, the linear formula doesn't.

Bands give the engine register flexibility (qualitative) while keeping the directional anchor (50° by 50). Both layers serve.

### Future shape-signal nudges (NOT this CC)

Eventually, band classification may be nudged by shape signals beyond age — e.g., a user with high Goal score + low Soul score + age 38 may be flagged as still in Direction (not yet Integration), regardless of age. This is a future CC. CC-AGE-CALIBRATION ships pure age-based banding; shape-signal refinement is queued.

---

## Architecture

### File map

| File | Action | Purpose |
|---|---|---|
| `lib/ageCalibration.ts` | NEW | `DEVELOPMENTAL_BAND` constants, `classifyDevelopmentalBand(age)` function, `BandReading` type, band-by-stage description map. |
| `lib/types.ts` | MODIFY | Add `bandReading?: BandReading` to `InnerConstitution` type. |
| `lib/identityEngine.ts` | MODIFY (surgical) | Add `attachBandReading()` helper called after demographics resolve. Reads `demographics.age` from constitution. |
| `lib/synthesis3Llm.ts` | MODIFY | System prompt updated to consume `bandReading` and adjust register by band. |
| `lib/synthesis3LlmInputs.ts` (or equivalent) | MODIFY | Pass `bandReading.band`, `bandReading.bandLabel`, `bandReading.registerHint` through to LLM input contract. |
| `lib/gripTaxonomyLlm.ts` | MODIFY | Same — band-aware register. |
| `lib/gripTaxonomyInputs.ts` | MODIFY | Same — pass band info. |
| `tests/audit/ageCalibration.audit.ts` | NEW | Audit assertions: bands cover age range; classification deterministic; LLM prompts consume band field. |
| `lib/cache/synthesis3-paragraphs.json` | REGENERATE | Input hash changes. |
| `lib/cache/grip-paragraphs.json` | REGENERATE | Same. |

### Type signatures

```ts
// lib/ageCalibration.ts

export type DevelopmentalBand =
  | "formation"
  | "direction"
  | "integration"
  | "purpose-consolidation"
  | "stewardship"
  | "wisdom-transmission";

export type BandConfig = {
  band: DevelopmentalBand;
  label: string;            // "Formation", "Direction", etc.
  ageRange: { min: number; max: number };
  characterDescription: string; // for prose register
  trajectoryWorkDescription: string; // for prose register
  registerHint: string;     // 1-line hint for LLM prose tone
};

export const DEVELOPMENTAL_BANDS: ReadonlyArray<BandConfig> = [
  {
    band: "formation",
    label: "Formation",
    ageRange: { min: 14, max: 22 },
    characterDescription: "Building self, identity, first commitments. Goal-line emerging from school/family. Soul-line untested.",
    trajectoryWorkDescription: "Shape is forming; trajectory not yet measurable as commitment-bearing.",
    registerHint: "Generous tone — the user is in early shape-formation. Avoid trajectory-judgment language. Frame the read as a working hypothesis the user is invited to test, not as a current verdict.",
  },
  {
    band: "direction",
    label: "Direction",
    ageRange: { min: 22, max: 32 },
    characterDescription: "Establishing trajectory, career foothold, partnership choice.",
    trajectoryWorkDescription: "Goal-leaning trajectory expected; the work is to commit and to build.",
    registerHint: "Building register. The work is establishing direction; Goal dominance is appropriate at this stage. Frame Soul scarcity as developmentally normal, not as deficit.",
  },
  {
    band: "integration",
    label: "Integration",
    ageRange: { min: 32, max: 45 },
    characterDescription: "Bringing Soul to existing Goal-line. Relationships, parenthood, mentorship begin to weave through work.",
    trajectoryWorkDescription: "Trajectory shifts toward balance; the work is to integrate, not to choose.",
    registerHint: "Integration register. The user has built; the work now is weaving Soul through what they've built. Avoid framing as 'finally ready to slow down' — integration is its own form of motion.",
  },
  {
    band: "purpose-consolidation",
    label: "Purpose Consolidation",
    ageRange: { min: 45, max: 55 },
    characterDescription: "Refining what the work was for. Focusing. Beloved object becoming visible.",
    trajectoryWorkDescription: "The 50° destination emerges; the work is to make the line steady and the beloved unmistakable.",
    registerHint: "Consolidation register. The 50° anchor lands here. The work is making the beloved object unmistakable. Avoid 'still building' framing — the building is converging.",
  },
  {
    band: "stewardship",
    label: "Stewardship",
    ageRange: { min: 55, max: 70 },
    characterDescription: "Carrying forward, mentoring, guarding what was built.",
    trajectoryWorkDescription: "Soul-leaning past 50°. The work is to transmit, to govern legacy, to keep the line honest as seasons turn.",
    registerHint: "Stewardship register. The user is past peak ascent; the work is governance and transmission. Avoid achievement-framing or 'next move' urgency. The next move is keeping watch.",
  },
  {
    band: "wisdom-transmission",
    label: "Wisdom / Transmission",
    ageRange: { min: 70, max: 200 }, // open-ended upper bound
    characterDescription: "Passing on what was learned. Integration becomes legacy.",
    trajectoryWorkDescription: "Trajectory is past steepness; line is becoming testimony.",
    registerHint: "Wisdom register. The user is in the transmission stage. Frame as testimony, not as future-work. The instrument is honoring what's been built, not pointing at what's next.",
  },
];

export type BandReading = {
  band: DevelopmentalBand;
  label: string;
  age: number;
  ageOnLowerEdge: boolean; // true if user is within 2 years of lower bound
  ageOnUpperEdge: boolean; // true if user is within 2 years of upper bound
  characterDescription: string;
  trajectoryWorkDescription: string;
  registerHint: string;
  // Transparency:
  rationale: string;
};

export function classifyDevelopmentalBand(age: number): BandReading;
```

### Edge handling

- **Age < 14:** the instrument is not appropriate for this user; engine attaches `bandReading: null` and a flag `tooYoungForInstrument: true`. Render layer (future CC) decides what to do; this CC just sets the flag.
- **Age 14–17:** within Formation band, but flagged `under18: true` for any future CC that needs the additional restriction.
- **Edge ages (within 2 years of band boundary):** `ageOnLowerEdge` / `ageOnUpperEdge` flags set. LLM prose layer can soften register at edges (e.g., a 31-year-old in late Direction shouldn't read aggressively as if just-entered; a 33-year-old in early Integration shouldn't read as if fully consolidated).
- **Missing age:** if `demographics.age` is unavailable, `bandReading` is null. Prose layer falls back to age-agnostic register.

### LLM system prompt updates

After the CC-PRODUCT-THESIS-CANON anchor and CC-RELIGIOUS-REGISTER-RULES register block, add a band-aware register block:

```
# Developmental band register (anchor — adjusts prose tone)

The user's report includes a developmental band (formation / direction / integration / purpose-consolidation / stewardship / wisdom-transmission). The band reflects life stage, not just age. Adjust prose register accordingly:

- Formation: generous tone; framework is a working hypothesis, not a verdict
- Direction: building register; Goal dominance is appropriate; don't frame Soul scarcity as deficit
- Integration: integration register; the work is weaving, not choosing
- Purpose Consolidation: consolidation register; making the beloved unmistakable
- Stewardship: stewardship register; governance and transmission, not achievement
- Wisdom / Transmission: wisdom register; testimony, not future-work

Never use "behind" framing. Each band has its own dignity. Tracking-late prose says "more of the work is still ahead" without judgment. Tracking-ahead prose says "your line is steeper than the canonical for your stage; the work is to keep the steepness honest as seasons turn."

If `bandReading` is null (user under 14, or age missing), use age-agnostic register.
```

---

## Audit assertions (8 NEW)

In `tests/audit/ageCalibration.audit.ts`:

1. **`age-calibration-bands-cover-range`** — DEVELOPMENTAL_BANDS array covers ages 14 through ~200 with no gaps and no overlaps (allowing for the open-ended upper bound).
2. **`age-calibration-deterministic-classification`** — `classifyDevelopmentalBand(age)` is deterministic; same input produces same output.
3. **`age-calibration-edge-detection`** — for users at boundaries (e.g., age 32, 45, 55), `ageOnLowerEdge` or `ageOnUpperEdge` flag fires correctly.
4. **`age-calibration-too-young-flag`** — for age < 14, `bandReading === null` AND `tooYoungForInstrument === true` is set on constitution.
5. **`age-calibration-missing-age-graceful`** — when `demographics.age` is undefined, `bandReading === null` and engine continues without error.
6. **`age-calibration-llm-prompts-anchor`** — both `synthesis3Llm.ts` and `gripTaxonomyLlm.ts` SYSTEM_PROMPTs contain the band-aware register block.
7. **`age-calibration-llm-input-passes-band`** — the LLM input contracts (synthesis3 + grip) pass `band`, `label`, `registerHint` to the LLM. Regex-check on the input-builder code.
8. **`age-calibration-cohort-classification`** — every cohort fixture with an `age` field is classified into a band; report distribution. Observational, not asserted.

---

## Cohort regeneration

After the prompts change, regenerate both caches:

```
ANTHROPIC_API_KEY=$(grep ^ANTHROPIC_API_KEY .env.local | cut -d= -f2) npx tsx scripts/buildSynthesis3.ts --force
ANTHROPIC_API_KEY=$(grep ^ANTHROPIC_API_KEY .env.local | cut -d= -f2) npx tsx scripts/buildGripTaxonomy.ts --force
```

Expected outcome:
- Paragraphs regenerate with band-aware register where age data is available
- Fixtures without age fall back to age-agnostic register (no degradation)
- Total ~$0.50 cohort regeneration

---

## Out-of-scope guardrails (DO NOT)

1. **Do NOT modify the trajectory degree calculation in `lib/goalSoulGive.ts`.** Bands READ the trajectory; they don't WRITE it.
2. **Do NOT add shape-signal nudges to band classification.** Pure age-based banding for V1; shape nudges are a future CC.
3. **Do NOT add a canonical age-line render to the chart.** That's CC-TRAJECTORY-VISUALIZATION's territory.
4. **Do NOT modify the user-facing report structure.** Band classification is engine-internal until the prose layer renders it implicitly through register adjustment.
5. **Do NOT add new band names beyond the six listed.** Calibration of edges (e.g., late-formation vs early-direction nuance) is future-CC scope.
6. **Do NOT modify CC-PRIMAL-COHERENCE or CC-GRIP-CALIBRATION code.** Band classification is independent.
7. **Do NOT remove the "50 by 50" canon line from documentation.** It stays as the directional anchor; bands are the operational mechanism.
8. **Do NOT rewrite or restructure the LLM operational instructions.** Only ADD the band-aware register block as preamble.

---

## Verification checklist

- [ ] `npx tsc --noEmit`
- [ ] `npm run lint`
- [ ] `npx tsx tests/audit/ageCalibration.audit.ts` (new — all 8 assertions pass)
- [ ] All existing audits remain green
- [ ] Cohort regeneration runs cleanly; both cache files updated
- [ ] No banned-phrase violations in regenerated cache (CC-RELIGIOUS-REGISTER-RULES audit composes)

---

## Report-back format

1. **Summary** — files added/modified, line-count delta, audit pass count.
2. **`DEVELOPMENTAL_BANDS` table dump** — the full constant array (so Jason can verify the band ranges + descriptions).
3. **Cohort band distribution** — for the 24 fixtures, count per band (observational; not asserted).
4. **3 sample paragraphs from different bands** — same Primal cluster, different band-aware register variants. Demonstrates the band-flex working.
5. **Edge-case handling demo** — show 1 user at age 32 (boundary) and 1 user without age data; confirm graceful behavior.
6. **Audit pass/fail breakdown** — every audit listed in the verification checklist.
7. **Out-of-scope verification** — confirm no diffs in trajectory degree calc, render code, or fixture data.
8. **Recommendations for follow-on work** — including any bands where the prose register feels under-differentiated (suggesting CC-AGE-REGISTER-EXPANSION) or any cohort fixtures that fall awkwardly across bands (suggesting fixture-data review).

---

**Architectural test for this CC:** a 28-year-old user reads as in Direction with building-register prose; a 38-year-old reads as in Integration with weaving-register prose; a 60-year-old reads as in Stewardship with governance-register prose. Same engine, same Primal calibration, age-appropriate prose register. The "50 by 50" anchor lands as developmentally generous, not as universal pressure.
