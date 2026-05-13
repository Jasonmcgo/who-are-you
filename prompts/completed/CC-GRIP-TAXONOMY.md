# CC-GRIP-TAXONOMY — 7 Primal Questions as Grip Taxonomy + "Your Grip" Section

**Origin:** Family cohort testing 2026-05-09 + Clarence's architectural framing surfaced a meaningful insight — the 7 Primal Questions (Am I safe / secure / loved / wanted / successful / good enough / have purpose) shouldn't be 7 new identity types; they should be **the grips that pull a person off their 50-degree trajectory under pressure**. The engine ALREADY measures grips at a granular named-grip level (control, money/security, being right, being needed, approval, reputation, plan-that-used-to-work, etc.). The 7 Primal Questions provide a TAXONOMY that clusters these existing measurements into 7 meaningful categories, giving users a memorable grip-name they can carry.

This CC adds the Primal Question taxonomy as a new architectural layer, surfaces the dominant Primal cluster per user, and renders a new "Your Grip" section using LLM articulation (same architecture as CC-SYNTHESIS-3 Path master synthesis).

**Method discipline:** Engine for truth. LLM for reception. Per the canon `feedback_engine_for_truth_llm_for_reception.md`: the engine DECIDES which Primal cluster fires (deterministic mapping from named-grips + Risk Form + secondary signals); the LLM RENDERS the Grip section prose at the rubric standard (gift first, cost second, no architecture-narration, second-person voice).

**Scope frame:** Two-part architecture — engine-side cluster derivation + LLM-side prose articulation. ~2-3 hours executor time. CC-mega scale because of editorial judgment in the per-cluster prose templates AND the structural addition of a new top-level section.

**Cost surface:** ~$0.04 per unique grip-cluster shape, paid once and cached. Build-time generation across 24-fixture cohort: ~$0.85. Per family member runtime fallback: ~$0.04 once. Same cost economics as CC-SYNTHESIS-3.

---

## Embedded context (CC executor environments don't see Cowork memory)

### The 7 Primal Questions

A primal question is the question your system starts asking when pressure rises. Each question, healthy, produces a gift. Each question, ungoverned, becomes a grip that bends your trajectory off-course.

| Primal Question | Healthy gift | Grip pattern (what it bends toward under pressure) |
|---|---|---|
| Am I safe? | wisdom | avoidance, control, retreat, overprotection |
| Am I secure? | stewardship | hoarding, over-planning, scarcity logic |
| Am I loved? | tenderness | emotional dependency, testing, overgiving, withdrawal |
| Am I wanted? | belonging | approval-seeking, self-editing, room compliance |
| Am I successful? | excellence | achievement addiction, comparison, hollow productivity |
| Am I good enough? | humility, craft | shame, perfectionism, hiding, overproving |
| Do I have purpose? | mission | urgency, savior-complex, abstraction, restless reinvention |

**Critical framing:** the primal question is not bad. The grip is what happens when the question starts driving.

### Mapping existing engine named-grips to Primal categories

The engine already measures grips at a granular named-grip level (Movement section's "named grips under pressure" list). The Primal taxonomy CLUSTERS these:

| Engine named-grip | Primary Primal Category | Possible secondary |
|---|---|---|
| control | Am I safe? | (sometimes Am I secure?) |
| money / security | Am I secure? | — |
| being right | Am I good enough? | Am I successful? |
| being needed | Am I loved? | Am I wanted? |
| approval (specific people) | Am I wanted? | Am I loved? |
| reputation | Am I successful? | Am I good enough? |
| social-stress adaptation | Am I wanted? | — |
| plan that used to work | Am I secure? | — |
| being seen / acknowledged | Am I wanted? | Am I loved? |
| comfort / escape | Am I safe? | — |

Some grips bridge two categories. The engine determines the dominant Primal cluster by:
1. Counting which Primal categories each named-grip points to (primary + secondary)
2. Weighting by named-grip prominence (Movement section already ranks them)
3. Selecting top-1 cluster (and noting top-2 if it's close)

### The directional architecture (canon per `project_grip_taxonomy_50_degree_life.md`)

The report becomes four-part directional after this CC + CC-SYNTHESIS-PICTURE land:

1. **Where you are** — Goal/Soul, body cards, function pair, OCEAN, Compass, Movement (existing)
2. **What pulls you off course** — Your Grip from the 7 Primal categories (THIS CC)
3. **Where you could go** — P-word picture (CC-SYNTHESIS-PICTURE, queued)
4. **What keeps you on course** — Practice (existing in body cards + Path)

### The 50-degree life metaphor (Clarence canon 2026-05-09)

> *"The goal is not a perfect vertical life. Vertical can look impressive and go nowhere. The goal is not merely a low, practical life that keeps moving without knowing why. The goal is trajectory: enough height to be meaningful, enough forward motion to matter, and enough correction to stay true when weather and fire arrive."*

The Grip section names what bends the trajectory away from 50 degrees.

### Engine-for-truth, LLM-for-reception, Path-for-synthesis canon (Clarence 2026-05-09)

The engine DECIDES which Primal cluster fires. The LLM RENDERS the Grip section prose. Strict guardrails:
1. Structured input only — feed the LLM the engine's cluster decision + relevant signals; forbid new claims
2. One memorable sentence max per Grip section — prevent purple prose
3. Require signal traceability — every strong sentence must map to a field
4. Preserve Grip section's job — names the grip, names the gift, names the cost
5. Don't let Grip become Path — Grip is diagnostic, Path is synthesis

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run audit:ocean`
- `npm run audit:goal-soul-give`
- `npx tsx tests/audit/proseArchitecture.audit.ts`
- `npx tsx tests/audit/synthesis1a.audit.ts`
- `npx tsx tests/audit/synthesis1Finish.audit.ts`
- `npx tsx tests/audit/synthesis3.audit.ts`
- `npx tsx tests/audit/jungianCompletion.audit.ts`
- `npx tsx tests/audit/fixturesSiTiFiFe.audit.ts`
- `npx tsx tests/audit/gripTaxonomy.audit.ts` (the new audit added by this CC)
- `npx tsx scripts/buildGripTaxonomy.ts` (the new build script added by this CC)
- `npm run dev`
- `git status`, `git diff`
- `node`, `npx tsx`
- `cat`, `grep`, `find`

## Read First (Required)

1. `lib/identityEngine.ts` — locate where named-grips are computed and stored. Grep for "named-grip" or "grippingPull.signals" or where the Movement section's grip list is composed.
2. `lib/synthesis1Finish.ts` — locate the Risk Form 2x2 classifier. The Grip taxonomy uses Risk Form letter as a signal.
3. `lib/types.ts` — `InnerConstitutionOutput` type. New fields will be added here for Primal cluster.
4. `lib/synthesis3Llm.ts` — the LLM articulation pattern from CC-SYNTHESIS-3. The Grip section reuses this pattern (build-time cache + runtime fallback). Read carefully; the Grip implementation should mirror this architecture.
5. `lib/synthesis3LlmServer.ts` — server-only API caller (per CODEX-SYNTHESIS-3-RUNTIME-FALLBACK). The Grip equivalent goes in a new `lib/gripTaxonomyLlmServer.ts`.
6. `app/api/synthesis3/master-paragraph/route.ts` — API route pattern. The Grip equivalent goes in a new `app/api/grip/paragraph/route.ts`.
7. `lib/synthesis3LlmClient.ts` — client hook pattern. The Grip equivalent goes in a new `lib/gripTaxonomyLlmClient.ts` OR is integrated into the existing client hook.
8. `lib/cache/synthesis3-paragraphs.json` — existing cache structure. The Grip cache lives in a separate file: `lib/cache/grip-paragraphs.json`.
9. `lib/renderMirror.ts` — the markdown render path. The new Grip section inserts here.
10. `app/components/MirrorSection.tsx` and related React components — the React render path.

## Allowed to Modify

### Component 1 — Engine-side Primal cluster derivation

**New file:** `lib/gripTaxonomy.ts` (the deterministic taxonomy logic; client-bundle-safe).

**Function signature:**

```ts
export interface PrimalCluster {
  primary: PrimalQuestion;       // e.g., "Am I secure?"
  secondary?: PrimalQuestion;    // present if top-2 is within margin of top-1
  confidence: "high" | "low";    // low when no clear cluster; e.g., user has 0 named-grips
  contributingGrips: string[];   // the named-grips that contributed to this cluster
  giftRegister: string;          // e.g., "stewardship" — for prose register inference
}

export type PrimalQuestion =
  | "Am I safe?"
  | "Am I secure?"
  | "Am I loved?"
  | "Am I wanted?"
  | "Am I successful?"
  | "Am I good enough?"
  | "Do I have purpose?";

export function derivePrimalCluster(
  namedGrips: string[],          // from grippingPull.signals
  riskFormLetter: string | null, // from CC-SYNTHESIS-1A
  topCompass: string[],          // for secondary signal
  goalSoulMovement: { goal: number; soul: number }
): PrimalCluster;
```

**Mapping logic:**

Use the table in the embedded context above. For each named-grip:
- Add weight 1.0 to its primary Primal category
- Add weight 0.5 to its secondary (if defined)

Compute total weight per category. Sort descending.

- If top category > 1.5x of second → confidence "high", primary only
- If top category > second but within 1.5x → confidence "high", primary + secondary
- If no named-grips fired (zero-grip user) → confidence "low", no primary, render fallback prose ("Grip is below detection threshold — this shape doesn't currently show a dominant primal pattern under pressure")
- If named-grips fired but cluster is genuinely tied (2+ categories within 0.2x) → confidence "low", primary set to highest, but flag as ambiguous

**Mapping table (canonical, encoded as `NAMED_GRIP_TO_PRIMAL` in `lib/gripTaxonomy.ts`):**

```ts
const NAMED_GRIP_TO_PRIMAL: Record<string, { primary: PrimalQuestion; secondary?: PrimalQuestion }> = {
  "control": { primary: "Am I safe?", secondary: "Am I secure?" },
  "money / security": { primary: "Am I secure?" },
  "being right": { primary: "Am I good enough?", secondary: "Am I successful?" },
  "being needed": { primary: "Am I loved?", secondary: "Am I wanted?" },
  "approval of specific people": { primary: "Am I wanted?", secondary: "Am I loved?" },
  "reputation": { primary: "Am I successful?", secondary: "Am I good enough?" },
  "social-stress adaptation": { primary: "Am I wanted?" },
  "plan that used to work": { primary: "Am I secure?" },
  "being seen": { primary: "Am I wanted?", secondary: "Am I loved?" },
  "comfort or escape": { primary: "Am I safe?" },
  // ... extend per actual named-grip vocabulary; grep `lib/identityEngine.ts` to find all
};
```

**Verification step in this fix:** the executor MUST grep `lib/identityEngine.ts` (and related files) to find ALL named-grip strings the engine produces. The mapping table must cover every named-grip the engine emits. If a named-grip has no mapping, it should be added (with primary at minimum) — no silent skips.

### Component 2 — LLM articulation for the Grip section

**New file:** `lib/gripTaxonomyLlmServer.ts` (server-only, per CODEX-SYNTHESIS-3-RUNTIME-FALLBACK pattern).

**Function:**

```ts
export interface GripParagraphInputs {
  primary: PrimalQuestion;
  secondary?: PrimalQuestion;
  contributingGrips: string[];
  riskFormLetter: string | null;
  topCompass: string[];
  lensDominant: string;
  movementQuadrant: string;
}

export async function composeGripParagraph(
  inputs: GripParagraphInputs
): Promise<string | null>;
```

Same pattern as `composePathMasterSynthesisLlm`: SDK call, system prompt embedded inline, server-only via `typeof window !== "undefined"` guard, 10-second timeout, returns null on failure.

**System prompt for the Grip articulation** (embed inline, similar structure to synthesis3 system prompt):

The system prompt MUST include:

1. The 7 Primal Questions table (gift + grip-pattern mapping per the embedded context above)
2. Critical framing: "the primal question is not bad. The grip is what happens when the question starts driving."
3. Warmth diagnostic: warm precision with moral nerve. Same operational disciplines as Path master synthesis (no architecture-narration, implicate values through phrasing, rhetorical structure, second-person voice, register-matched).
4. **Grip-specific structural template** (more constrained than Path's):

> Open with the gift register the primal question produces in healthy form. Pivot to what the same question pulls toward when ungoverned. Close with the imperative that names how to govern (not eliminate) the grip.

5. Three rubric examples (one for each common cluster type — author these inline; signed off in this CC):

**Rubric example 1 — "Am I secure?" cluster**

For someone whose named-grips are money/security, plan-that-used-to-work, with Compass values like Family/Stability:

> *Your shape's primary primal question is Am I secure? When pressure rises, your system starts asking whether the foundations are still solid — whether what you've built will hold, whether the people you carry will be safe, whether the plan that worked last year still works now. This is the gift of stewardship: you keep things from falling apart that others would let slip. The cost: under pressure, the same question can pull you toward over-planning what cannot be controlled, hoarding what cannot be hoarded, or defending forms that have outlived their function. The work is not to stop asking the question. It is to let your answer to it be larger than your own foresight — to trust that some of what makes you secure is not yours to manage.*

**Rubric example 2 — "Am I good enough?" cluster**

For someone whose named-grips are being-right, reputation, with Compass values like Honor/Knowledge/Truth:

> *Your shape's primary primal question is Am I good enough? When pressure rises, your system starts asking whether your work is sound, whether your conviction is earned, whether you deserve the position you've taken. This is the gift of craft and humility: you don't take your own reasoning for granted; you keep testing what you've built. The cost: under pressure, the same question can pull you toward over-proving, perfectionism that prevents shipping, or a hidden shame that drives the cycle. The work is not to silence the question. It is to learn that the question's job is to keep you honest, not to keep you uncertain.*

**Rubric example 3 — "Am I loved?" / "Am I wanted?" combined cluster**

For someone whose named-grips are being-needed, approval, social-stress-adaptation, with Compass values like Family/Compassion/Loyalty:

> *Your shape's primary primal question moves between Am I loved? and Am I wanted? When pressure rises, your system starts asking whether you're still in the room, whether your place is still safe, whether the people who matter still see you. This is the gift of relational sensing: you read what the room needs and respond before others have noticed it shifting. The cost: under pressure, the same question can pull you toward editing yourself for the room, withholding the truth that would have served, or absorbing what others should carry. The work is not to need less. It is to let your needs be visible enough that the people who love you can meet them.*

These are reference rubric examples for the LLM. Each shape generates a fresh paragraph. Same canon-compression-over-compose-new-prose preference rule as CC-SYNTHESIS-3.

**User prompt template** (sent per shape):

```
Shape's primary primal question: {primary}
{if secondary: Secondary primal question (close second): {secondary}}
Named grips that fired: {contributingGrips.join(", ")}
Risk Form: {riskFormLetter}
Top Compass values: {topCompass.join(", ")}
Lens dominant: {lensDominant}
Movement quadrant: {movementQuadrant}

Compose the Grip section paragraph for this shape.
```

### Component 3 — Build-time cohort generation + cache

**New file:** `scripts/buildGripTaxonomy.ts` (mirrors `scripts/buildSynthesis3.ts`).

Runs across all 24 fixtures. For each:
1. Compute `derivePrimalCluster(...)` from existing engine outputs
2. If cluster confidence is "high", call `composeGripParagraph(...)` via LLM
3. If cluster confidence is "low", skip API call (zero-grip users get no LLM paragraph; engine produces a fallback prose statement)
4. Cache result to `lib/cache/grip-paragraphs.json`

**Cache file:** `lib/cache/grip-paragraphs.json` — same structure as synthesis3-paragraphs.json (key = inputsHash, value = {paragraph, fixtureHint, generatedAt}).

### Component 4 — Runtime fallback (server-only, per CODEX-SYNTHESIS-3-RUNTIME-FALLBACK pattern)

**New file:** `app/api/grip/paragraph/route.ts` — POST endpoint that takes `GripParagraphInputs`, returns paragraph string.

**Hook in client component:** integrated into the existing `useLlmMasterSynthesis` hook (so one client-side fetch handles both Path master synthesis AND Grip paragraph), OR a new sibling hook `useGripParagraph` if architectural cleanliness preferred.

The runtime fallback writes new cache entries to `lib/cache/grip-paragraphs.json` on cache miss (same persist-on-API-success pattern as synthesis3).

### Component 5 — Engine integration

**File modified:** `lib/identityEngine.ts`.

After the engine output is computed, derive the Primal cluster:

```ts
constitution.shape_outputs.gripTaxonomy = derivePrimalCluster(
  constitution.shape_outputs.movement.grippingPull.signals, // named grips
  constitution.shape_outputs.movement.riskForm?.letter ?? null,
  constitution.shape_outputs.compass.topValues,
  constitution.shape_outputs.movement.goalSoul
);
```

`gripTaxonomy.gripParagraphLlm` field gets attached separately (via the same "augment" pattern from CC-SYNTHESIS-3-RUNTIME-FALLBACK) — populated either from cache lookup or from the runtime API call.

### Component 6 — Render integration

**Files modified:** `lib/renderMirror.ts`, `app/components/MirrorSection.tsx`, possibly new `app/components/GripSection.tsx`.

**Position in the report:** new top-level section "Your Grip" inserted **between Movement and Disposition Signal Mix**. Rationale: Grip is a pressure-response architecture conceptually adjacent to Movement (which surfaces the named-grips at signal level) and Risk Form. Putting Grip right after Movement creates a natural reading flow: "here's your trajectory → here's how it responds to pressure → here's what bends it under pressure."

**Section structure (markdown):**

```
## Your Grip

> *{LLM-articulated paragraph from gripParagraphLlm, OR engine fallback prose if cache miss + API fail}*

**Primary question:** {primary}
{if secondary: **Secondary question:** {secondary}}

**Named grips contributing to this read:** {contributingGrips.join(", ")}
```

(The LLM paragraph is the load-bearing prose; the structured fields below are diagnostic transparency for users who want to see how the Grip was derived.)

**Engine fallback prose** (when LLM unavailable AND cache miss):

> *"Your shape's primary primal question is {primary}. The named grips fueling this read: {contributingGrips}. Under pressure, this question can pull you toward {generic-cost-language for the category}. The work is to govern the question, not silence it."*

(Generic but honest. Renders only when LLM AND cache both unavailable.)

### Component 7 — Audit assertions

**New file:** `tests/audit/gripTaxonomy.audit.ts`. Add assertion block (run across 24-fixture cohort + 4 Si/Ti/Fi/Fe fixtures = 28 total):

- `grip-taxonomy-cluster-derived`: Every fixture has a `gripTaxonomy.primary` value (one of 7 Primal Questions) OR confidence is "low".
- `grip-taxonomy-mapping-coverage`: Every named-grip the engine emits has a mapping entry in `NAMED_GRIP_TO_PRIMAL`. No silent skips.
- `grip-taxonomy-confidence-rules`: When confidence is "high", the primary cluster's weighted score is at least 1.5x the second cluster's score (or no second cluster exists).
- `grip-taxonomy-llm-paragraph-rendered`: For every fixture with `gripTaxonomy.confidence === "high"`, the rendered output contains the Grip section's LLM paragraph (cached or runtime-generated).
- `grip-taxonomy-llm-no-architecture-vocab`: LLM Grip paragraphs do NOT contain forbidden architecture words (banned list: "primal cluster", "named grip", "grippingPull", "Risk Form letter", "Compass top", etc.). The paragraph references concepts in lived terms only.
- `grip-taxonomy-llm-rhetorical-structure`: Every Grip paragraph contains a pivot phrase ("the cost is" / "but the same question" / "the work is" / "under pressure").
- `grip-taxonomy-llm-second-person`: Second-person voice; no name leaks; no third-person ("this shape is").
- `grip-taxonomy-llm-no-invented-claims`: The primary primal question named in the paragraph matches `gripTaxonomy.primary`. The contributingGrips referenced in prose are derivable from the input.
- `grip-taxonomy-llm-word-count`: 100-200 word soft band per Grip paragraph.
- `grip-taxonomy-fallback-when-cluster-low`: Fixtures with `confidence === "low"` render the engine fallback prose, not an LLM paragraph (or no paragraph at all if zero-grip).
- `grip-taxonomy-renders-after-movement`: The "## Your Grip" section appears in markdown render between "## Movement" and "## Disposition Signal Mix".
- `grip-taxonomy-cache-coverage`: At least 18 of 24 fixtures have cached Grip paragraphs (allowing for ~6 zero-grip or ambiguous fixtures to legitimately have no paragraph).

## Out of Scope (Do Not)

1. **Do NOT add new survey questions.** Per `feedback_minimal_questions_maximum_output`. The named-grips already in the engine are sufficient input for the taxonomy. If cohort testing after this CC ships shows real measurement gaps, a follow-on CC could add 3-5 grip-sensitive questions per Clarence's draft list (in `project_grip_taxonomy_50_degree_life.md` memory).
2. **Do NOT modify the Risk Form 2x2 classifier.** Risk Form is a separate architecture (CC-SYNTHESIS-1A canon). Grip taxonomy CONSUMES the Risk Form letter; doesn't modify it.
3. **Do NOT modify the named-grip generation logic in the engine.** The named-grips are produced upstream; the Grip taxonomy only categorizes them. Don't touch where they come from.
4. **Do NOT modify any signal pool, intensity math, composite consumption, OCEAN computation.**
5. **Do NOT modify CC-PROSE / CC-SYNTHESIS-1A / 1F / 3 canon.** Path master synthesis stays untouched. The new Grip section is ADDITIVE.
6. **Do NOT bundle the P-word picture (CC-SYNTHESIS-PICTURE) into this CC.** The aspirational closing block is a separate scope. Don't write any "the life this is reaching for" prose in the Grip section.
7. **Do NOT add loop-detection prose.** Loop patterns (e.g., Ni-Ti loop) belong in the future CODEX-MBTI-LOOP-DETECTION CC, integrated with the Grip taxonomy as a sub-category. Don't surface loop language in this CC.
8. **Do NOT modify** the question bank (`data/questions.ts`), fixture files, MEMORY.md, AGENTS.md, docs/canon/, or spec memos.
9. **Do NOT install dependencies** beyond what's already present (Anthropic SDK already installed per CC-SYNTHESIS-3).
10. **Do NOT modify the masthead, "How to Read This", or section ordering** beyond the new "## Your Grip" insertion between Movement and Disposition Signal Mix.
11. **Do NOT change the Surface-label render gate** in `lib/coreSignalMap.ts`.
12. **Do NOT touch CC-SYNTHESIS-3's runtime fallback infrastructure.** Reuse the patterns; don't refactor them.
13. **Do NOT call the API at runtime in client bundles.** Server-only via `typeof window !== "undefined"` guards (same pattern as CODEX-SYNTHESIS-3-RUNTIME-FALLBACK).
14. **Do NOT exceed 1 paragraph per shape's Grip section.** No multi-paragraph Grip prose. The Grip section is diagnostic, not synthesis.
15. **Do NOT make the Grip section's prose try to be Path-quality.** Per Clarence canon: "leave Path as the synthesis card; don't let every card become Path." The Grip section names the grip and gives the imperative; it doesn't try to be the closing monologue.

## Acceptance Criteria

1. `lib/gripTaxonomy.ts` ships with `derivePrimalCluster()` + `NAMED_GRIP_TO_PRIMAL` mapping covering every named-grip the engine emits.
2. `lib/gripTaxonomyLlmServer.ts` ships server-only with `composeGripParagraph()` + system prompt embedded inline + 3 rubric examples.
3. `app/api/grip/paragraph/route.ts` ships as POST endpoint.
4. `scripts/buildGripTaxonomy.ts` ships and successfully populates `lib/cache/grip-paragraphs.json` with at least 18/24 fixture entries (when API key set).
5. `lib/identityEngine.ts` integrates the Primal cluster derivation + `gripParagraphLlm` field attachment.
6. Renderer (markdown + React) emits the new "## Your Grip" section between Movement and Disposition Signal Mix.
7. All 12 new `grip-taxonomy-*` audit assertions pass.
8. All existing audit assertions still pass (CC-PROSE / CC-SYNTHESIS-1A / 1F / 3 / JUNGIAN / FIXTURES / OCEAN / Goal/Soul/Give regression).
9. Hedge density delta within ±5 phrases per fixture (no spike from new prose).
10. `npx tsc --noEmit` exits 0.
11. `npm run lint` exits 0.
12. `npx tsx tests/audit/gripTaxonomy.audit.ts` exits 0.
13. `npx tsx scripts/buildGripTaxonomy.ts` runs cleanly with API key set.
14. Renderer falls back to engine fallback prose when LLM cache + API both unavailable.
15. `git status --short` shows only new files + targeted modifications listed in this CC.

## Report Back

1. **Summary** in 6-10 sentences. Confirm the engine-side cluster derivation + LLM-side prose articulation both ship. Name how many of 24 fixtures got cached Grip paragraphs vs how many fell back. Name the dominant Primal cluster distribution across the cohort (e.g., "8 fixtures cluster on Am I secure?, 5 on Am I wanted?, 3 on Am I good enough?, etc.").

2. **Per-cluster examples** — for at least 3 different Primal clusters that fire across the cohort, paste:
   - The fixture name
   - Its named-grips
   - Its derived primary (and secondary if present)
   - The full LLM-generated Grip paragraph

3. **Family-shape spot-check** — for the canonical Jason fixture (`ocean/07-jason-real-session`), paste the full Grip section. Expected: primary likely "Am I good enough?" or "Am I successful?" given his named-grips (control, money/security, being right). Compare to your hand-written rubric examples for the same cluster. Apply the warmth diagnostic line-by-line.

4. **Mapping coverage verification** — list every named-grip the engine emits across the 24-fixture cohort + 4 Si/Ti/Fi/Fe fixtures. Confirm every one has a mapping entry. Flag any that were missing from the mapping table and were added during execution.

5. **Cluster distribution** — for the 24-fixture cohort:
   - How many fixtures landed in each of the 7 Primal categories (primary)
   - How many had a strong secondary cluster
   - How many were "low confidence" (zero-grip or genuinely ambiguous)
   - Any clusters with 0 fixtures (potential cohort thinness for that pattern)

6. **Render samples** — for the canonical Jason fixture, paste the full markdown rendered Grip section (after Movement, before Disposition Signal Mix). Confirm visual treatment is consistent with adjacent sections.

7. **Audit pass/fail breakdown** — including all 12 new `grip-taxonomy-*` assertions, all prior assertion suites' regression status.

8. **Cost note** — first cohort generation ~$0.85; per family-member runtime fallback ~$0.04 once. Document actual cost from this run.

9. **Out-of-scope verification** — git status; explicit confirmation that signal pool, intensity math, composite consumption, Risk Form 2x2, named-grip generation logic, CC-PROSE / 1A / 1F / 3 canon, question bank, fixture data, and spec memos are all untouched.

10. **Recommendations for follow-on work**:
    - **CODEX-MBTI-LOOP-DETECTION** (queued): non-canonical Jungian patterns surface as a sub-category of the Grip taxonomy. The mapping would extend `NAMED_GRIP_TO_PRIMAL` with loop-pattern entries (e.g., "Ni-Ti loop" → primary "Am I good enough?", secondary "Do I have purpose?"). Don't act on this in this CC; flag for follow-on.
    - **CC-GRIP-NEW-QUESTIONS** (conditional, if cohort testing reveals gaps): add 3-5 grip-sensitive questions per Clarence's draft list (in `project_grip_taxonomy_50_degree_life` memory). Only propose this CC if the existing named-grip mapping shows real gaps in cluster fidelity.
    - **CC-SYNTHESIS-PICTURE** (queued): the aspirational P-word picture, NOW informed by Grip data ("the life this shape is reaching for: not bound by the specific Grip your shape carries, but using its underlying primal question as gift"). Per `project_p_word_picture_architecture`. Builds on this CC.
