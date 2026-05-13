# CC-CRISIS-PATH-PROSE — Differential Prose Rendering for Crisis-Path Users + Ethical Guardrails

**Origin:** CC-PRIMAL-COHERENCE establishes the trajectory-vs-crisis path-class gating at the engine layer. This CC wires up the differential prose rendering for crisis-path users, with an explicit ethical guardrail layer (the instrument is a mirror, not a clinician). Composes on top of CC-PRODUCT-THESIS-CANON (positioning), CC-RELIGIOUS-REGISTER-RULES (vocabulary discipline), and CC-AGE-CALIBRATION (band-aware register).

**Canon for this CC** (Jason validated 2026-05-10):

> *Sometimes the grip is not what's pulling you off course. It's what you're reaching for because there is no course yet. The work isn't to loosen — the work is to build something for the hand to hold.*

This is the lead canon line for the crisis-path register. It does NOT belong to the trajectory-path users; it appears only when `pathClass === "crisis"`.

**Method discipline:** Engine for truth. LLM for reception. The engine has already classified the user's path-class; this CC adjusts the LLM prose layer's register and structure when crisis-class fires. Crisis prose is the highest-stakes language the instrument writes — wrong tone, wrong framing, or false-clinical claims do real harm. The ethical guardrail layer is non-negotiable.

**Scope frame:** ~2-3 hours executor time. CC-mega scale because of editorial judgment in the per-flavor crisis prose templates AND the ethical-guardrail design AND the structural addition of crisis-mode rendering to multiple sections.

**Cost surface:** ~$0.40 cohort regeneration. The crisis-path prose generates only for fixtures where `pathClass === "crisis"` (currently 4 synthetic crisis fixtures from CC-PRIMAL-COHERENCE plus any cohort fixtures that reclassified). Existing trajectory-class cached entries do not regenerate (no input change).

---

## Embedded context (CC executor environments don't see Cowork memory)

### What crisis-path means

A user is crisis-class when their dominant Primal cluster *inverts against* their Goal/Soul shape. Examples:

- **Am I successful?** grip + Goal score 25 + Soul 20 → flavor `longing-without-build` ("the grip is reaching for consequence; the work-line is empty")
- **Am I loved?** grip + Soul 20 + Goal 35 → flavor `grasp-without-substance` ("the grip is reaching for love; the relational line is empty")
- **Am I good enough?** grip + Goal 22 + Soul 18 → flavor `paralysis` ("shame without a project")
- **Am I safe?** grip + Goal 15 + Soul 18 → flavor `withdrawal` ("movement collapse")
- **Do I have purpose?** grip + Goal 25 + Soul 25 → flavor `restless-without-anchor` ("reinvention loop")

For these users, the trajectory framework breaks. Telling them "your trajectory is 32° Goal-leaning at strength 71" confirms a shape they're not actually inhabiting. The crisis-path prose says something different: *the read points at something hard — there's a gap between what you're reaching for and what you're building right now.*

### The six flavors and their prose registers

| Flavor | Crisis register | Closing imperative direction |
|---|---|---|
| `longing-without-build` | The grip is reaching for consequence; the work-line is empty. The work isn't to loosen — it's to build something the hand can hold. | "Start with the smallest piece of the work that matters and let it matter." |
| `grasp-without-substance` | The grip is reaching for love; the relational line hasn't filled. The work is to find the source of the gap. | "Let one relationship be received before you ask it to prove itself." |
| `paralysis` | Shame without a project. The grip is real; the work the shame would discipline isn't there. | "The next move is rest, or asking for help, before any new plan." |
| `withdrawal` | Movement collapse. The shape isn't bending off course — it's not yet engaging. | "The work is not refinement; it's re-engagement. Smaller steps than feel reasonable." |
| `restless-without-anchor` | Reinvention loop. The grip is purpose-shaped; commitment hasn't landed yet. | "Commit to a smaller thing first. Let the smaller commitment teach you what the larger one would have asked." |
| `working-without-presence` | Goal-pinned, Soul-collapsed. The work-line is at maximum; output is already happening at full speed. The grip is being answered with more output, and yet the question is still firing — diagnostic signature that output is the wrong answer. | "The next move is asking, not producing." |

**Note on `working-without-presence`:** this flavor depends on CC-PRIMAL-COHERENCE-EXTENSION landing first to surface the flavor on the engine side. If CC-PRIMAL-COHERENCE-EXTENSION has not yet landed, this CC scaffolds the prose template but the rubric does not fire on cohort fixtures until the engine flavor exists. Audit assertion #1 verifies the flavor is in the system prompt; audit assertion for cohort firing is conditional on CC-PRIMAL-COHERENCE-EXTENSION shipping first.

### The ethical guardrail layer

The crisis-path register is the instrument's highest-stakes prose. Some users in `paralysis` flavor are clinically depressed. Some in `withdrawal` are dissociating. Some in any flavor are in acute distress.

**Mandatory framing** for every crisis-path paragraph:

1. **The instrument is a mirror, not a clinician.** Every crisis-path Path/Gait section ends with a soft directional pointer: *"If this read lands hard, consider talking to someone — a therapist, a friend who knows you well. The instrument is a mirror, not a clinician; some kinds of weight need company to carry."*
2. **No "next moves" that depend on the user being able to act.** Replace with framing that allows for "the next move is rest" or "the next move is asking for help."
3. **No diagnostic claims.** Crisis-path prose names patterns; it does not diagnose conditions. Banned: "depression," "anxiety," "trauma," "PTSD," "dissociation," "burnout" (clinical sense), "mental health crisis." Allowed: "hard season," "weight," "real difficulty."
4. **Resources gate.** When `crisisFlavor === "paralysis"` OR `crisisFlavor === "withdrawal"`, the prose includes a soft pointer to professional support without prescribing specific helplines. The user can ask for resources directly; the instrument doesn't inject them unsolicited (helplines vary by region, become stale, can feel performative).
5. **Held-loosely framing.** The crisis read carries explicit hedging language: *"this read is one possible map of where you are now. If it doesn't fit, the read is the wrong aim — your shape is making a finer-grained question that this section hasn't measured cleanly."*

### What crisis-path prose does NOT do

- Does NOT use the trajectory degree-reading at all (no "32° Goal-leaning at strength 71" — the framework doesn't apply)
- Does NOT use the open-hands/grip-loosening framing (loosening assumes there's a hand-holding the right thing; crisis prose says the hand may not be holding the right thing yet)
- Does NOT use age-band trajectory work descriptions (a user in Integration with crisis flavor needs different framing than one in Direction)
- Does NOT render the four-vector dashboard the way trajectory users see it (deferred to CC-TRAJECTORY-VISUALIZATION; this CC sets the prose; visualization differential comes later)
- Does NOT collapse the read into hopelessness — every crisis flavor has a "next move" that's real, even if small

### Composition with prior CCs

- **CC-PRIMAL-COHERENCE** sets `pathClass` and `crisisFlavor`. This CC reads them.
- **CC-PRODUCT-THESIS-CANON** anchors the LLM in purpose-orientation framing. Crisis prose still serves purpose orientation — *"why am I here?"* is the question; the crisis register answers it differently than the trajectory register.
- **CC-RELIGIOUS-REGISTER-RULES** governs vocabulary. Crisis prose follows the same banned-phrase list. The wedding-readout test still applies.
- **CC-AGE-CALIBRATION** provides band register hints. Crisis prose may consume band hints (a user in Formation with crisis flavor reads differently than one in Stewardship), but the crisis register dominates band register where they conflict.

---

## Architecture

### File map

| File | Action | Purpose |
|---|---|---|
| `lib/synthesis3Llm.ts` | MODIFY | System prompt updated with crisis-path mode + per-flavor templates + ethical-guardrail framing. Conditional rendering based on `pathClass`. |
| `lib/synthesis3LlmInputs.ts` (or equivalent) | MODIFY | Pass `pathClass`, `crisisFlavor`, `coherenceReading.rationale` through to LLM input contract. |
| `lib/gripTaxonomyLlm.ts` | MODIFY | Crisis-path mode: when `pathClass === "crisis"`, the Grip section paragraph adopts crisis register (the grip is reaching for X that the shape isn't yet supporting). |
| `lib/gripTaxonomyInputs.ts` | MODIFY | Pass `pathClass`, `crisisFlavor` through. |
| `lib/renderMirror.ts` | MODIFY | Crisis-path users get differential markdown rendering: Path/Gait section uses crisis template; Movement section degrees-reading is suppressed in favor of "the trajectory framework doesn't apply here" hedge; ethical guardrail block is appended. |
| `app/components/InnerConstitutionPage.tsx` | MODIFY | Same differential rendering at the React layer. |
| `lib/cache/synthesis3-paragraphs.json` | REGENERATE (partial) | Only crisis-class fixtures regenerate. |
| `lib/cache/grip-paragraphs.json` | REGENERATE (partial) | Same. |
| `tests/audit/crisisPathProse.audit.ts` | NEW | Audit assertions covering crisis flavor coverage, ethical guardrails present, banned-clinical-phrases absent, trajectory-degree suppression in crisis renders. |
| `tests/fixtures/coherence/01-trajectory-class.json` thru `04-crisis-paralysis.json` | (existing from CC-PRIMAL-COHERENCE) | Used as test cases. |

### Crisis prose rubric (lead example for system prompt)

For `crisisFlavor === "longing-without-build"` (Am I successful? + low Goal):

> Sometimes the grip is not what's pulling you off course. It's what you're reaching for because there is no course yet. The shape your answers describe is a system asking *Am I successful?* — wanting to land, wanting consequence, wanting the work to mean something. But the work-line in the read is thin right now: the building hasn't compounded into the shape the question is asking after.
>
> This is not a verdict. It's a possible map. If it lands, the work isn't to loosen the grip — there's nothing yet to loosen onto. The work is to start with the smallest piece of the work that matters, and let it matter. Smaller than feels reasonable. The grip will quiet when there's something for it to hold.
>
> If this read lands hard, consider talking to someone — a therapist, a friend who knows you well. The instrument is a mirror, not a clinician; some kinds of weight need company to carry.

This rubric:
- Names the pattern without diagnosing
- Refuses trajectory framework explicitly ("there is no course yet")
- Offers a real next move (smaller than feels reasonable)
- Closes with the ethical guardrail
- Passes the wedding-readout test (no tribal religious vocabulary)
- Holds itself loosely ("it's a possible map")

### Crisis prose rubric for `paralysis`

> The shape your answers describe is a system asking *Am I good enough?* — but the building the shame would discipline isn't there to be disciplined. The grip is real; the project the grip is for hasn't found you yet, or you haven't found your way back to it.
>
> This read is one possible map. If it doesn't fit, the read is the wrong aim. If it does, the next move isn't a new plan. The next move is rest, or asking for help, before any new plan. The shame will reorganize when there's a smaller thing for it to attend to.
>
> If this read lands hard, consider talking to someone — a therapist, a friend who knows you well. The instrument is a mirror, not a clinician; some kinds of weight need company to carry.

### Crisis prose rubric for `withdrawal`

> The shape your answers describe is a system asking *Am I safe?* — wanting the world to be quieter than it is. The trajectory framework the report normally uses asks where you're heading; right now the more honest read is that the line hasn't yet engaged. That's not failure. That's the shape of a season where re-engagement is the work.
>
> The next move is not refinement. It's re-engagement, smaller than feels reasonable. One real conversation. One commitment kept. One day where you do less and let yourself notice.
>
> If this read lands hard, consider talking to someone — a therapist, a friend who knows you well. The instrument is a mirror, not a clinician; some kinds of weight need company to carry.

### Crisis prose rubric for `working-without-presence`

> The shape your answers describe is a system asking *Am I good enough?* — and the answer your shape has been giving is more output, more building, more proving. The work-line is at full speed. The relational and soul-line haven't been able to keep up — or haven't been allowed to. This is the recognizable shape of a season where the answer to the question is "do more" and yet the question keeps firing, which is the read's way of telling you that output isn't the answer it's asking for.
>
> This is one possible map. If it lands, the work isn't to slow the building down — that may not be available to you yet. The work is to find one place where being received matters more than being effective. One conversation. One small offering. The next move is asking, not producing.
>
> If this read lands hard, consider talking to someone — a therapist, a friend who knows you well. The instrument is a mirror, not a clinician; some kinds of weight need company to carry.

### LLM system prompt mode-switching

In `synthesis3Llm.ts`:

```
# Path-class register switching

The user's report carries a `pathClass` of either "trajectory" or "crisis".

- TRAJECTORY: render the existing rubric — gift, growth-edge, practice, closing imperative, integrated paragraph. Use trajectory degree, age-band register, open-hands grip-loosening framing. The user is moving; the work is to refine aim.

- CRISIS: render the crisis rubric. Banned: trajectory degree-reading, open-hands framing, "growth edge" vocabulary, age-band trajectory work descriptions, clinical diagnostic terms ("depression," "anxiety," "trauma," "PTSD," "dissociation," "burnout"). Required: pattern naming without diagnosing, explicit hedging ("this is one possible map"), per-flavor closing imperative, ethical guardrail block ("If this read lands hard, consider talking to someone...").

Crisis flavors and their registers:
- longing-without-build: the grip is reaching for consequence; the work isn't to loosen — it's to build
- grasp-without-substance: the grip is reaching for love; the work is to find the source of the gap
- paralysis: shame without a project; the next move is rest or asking for help, before any new plan
- withdrawal: movement collapse; the work is re-engagement, smaller than feels reasonable
- restless-without-anchor: reinvention loop; commit to a smaller thing first
- working-without-presence: Goal-pinned/Soul-collapsed; output is the wrong answer; the next move is asking, not producing

When `pathClass === "crisis"`, the trajectory framework does NOT apply. Do not render trajectory degree, do not use the 50° metaphor, do not invoke age-band trajectory work descriptions. The user is in a different framework; honor it.

The four-register flexibility on purpose still applies. Crisis prose still serves the "Why am I here?" question — it just answers it from a place where the user is asking a more foundational version of the question.
```

### Render-layer changes

In `lib/renderMirror.ts` and `app/components/InnerConstitutionPage.tsx`:

When `pathClass === "crisis"`:
- The Movement section's degree-reading line is suppressed (or replaced with a brief hedge: "*The trajectory framework the report normally uses doesn't fully apply to this read. See the Path/Gait section for what the read is naming.*")
- The Path/Gait section renders the crisis-rubric paragraph (LLM cached or engine fallback)
- An ethical-guardrail block is appended at the end of the report (visible, distinct treatment) — same content as the per-paragraph guardrail, but elevated as a standing reminder
- The body cards still render (depth tools), but with a top-of-section hedge: *"These cards describe shape characteristics that may not feel applicable in a hard season. Hold them lightly."*

### Engine fallback (if LLM unavailable)

A deterministic engine-side template per flavor produces a structurally-correct paragraph without the LLM's warmth. Less vivid than LLM output but still passes the ethical guardrail layer (banned phrases absent, soft-pointer present, hedging language present).

---

## Audit assertions (10 NEW)

In `tests/audit/crisisPathProse.audit.ts`:

1. **`crisis-prose-flavor-coverage`** — every `crisisFlavor` value has a corresponding rubric template in the LLM system prompt (regex match).
2. **`crisis-prose-banned-clinical-phrases`** — `BANNED_CLINICAL_PHRASES` constant exists; cached crisis-class paragraphs contain none of: "depression," "anxiety," "trauma," "PTSD," "dissociation," "burnout" (clinical sense), "mental health crisis."
3. **`crisis-prose-ethical-guardrail-present`** — every cached crisis-class paragraph contains the soft-pointer phrase ("If this read lands hard," or equivalent canonical phrasing).
4. **`crisis-prose-trajectory-degree-suppression`** — for crisis-class fixtures, the rendered markdown does NOT contain a trajectory-degree reading (regex check on `/\d+° (Goal|Soul)-leaning/`).
5. **`crisis-prose-no-open-hands-framing`** — crisis-class paragraphs do NOT use grip-loosening or open-hands vocabulary (regex check on phrases like "loosen the grip," "open hand," "release the grip"). The crisis register uses "build something for the hand to hold" instead.
6. **`crisis-prose-explicit-hedging`** — every crisis-class paragraph contains explicit hedging language ("one possible map," "this is not a verdict," "if this doesn't fit," or equivalent).
7. **`crisis-prose-per-flavor-closing-imperative`** — each crisis-class fixture's closing imperative matches the flavor's expected register (longing-without-build → smallest piece of the work; paralysis → rest or asking for help; withdrawal → re-engagement, smaller than reasonable; etc.).
8. **`crisis-prose-religious-register-compliance`** — crisis-class paragraphs pass the CC-RELIGIOUS-REGISTER-RULES banned-phrase audit.
9. **`crisis-prose-trajectory-class-unaffected`** — trajectory-class fixtures' cached paragraphs are byte-identical to pre-CC versions (no incidental regeneration).
10. **`crisis-prose-engine-fallback-template`** — the engine-fallback templates for each flavor pass all of the above structural checks even without LLM.

In `tests/audit/synthesis3.audit.ts` (extension):
- Add 1 assertion that the SYSTEM_PROMPT contains the path-class register switching block.

In `tests/audit/gripTaxonomy.audit.ts` (extension):
- Add 1 assertion that the GRIP_SYSTEM_PROMPT consumes `pathClass` and renders crisis register when applicable.

---

## Cohort regeneration

After the prompts change, regenerate caches with `--force` flag, but only crisis-class fixtures will produce new content (trajectory-class hashes are unchanged):

```
ANTHROPIC_API_KEY=$(grep ^ANTHROPIC_API_KEY .env.local | cut -d= -f2) npx tsx scripts/buildSynthesis3.ts --force
ANTHROPIC_API_KEY=$(grep ^ANTHROPIC_API_KEY .env.local | cut -d= -f2) npx tsx scripts/buildGripTaxonomy.ts --force
```

Expected outcome:
- 4 synthetic crisis fixtures (from CC-PRIMAL-COHERENCE) generate new crisis-class paragraphs
- Any cohort fixtures that reclassified to crisis-class also regenerate
- Trajectory-class fixtures show "cached" / no API call
- Total ~$0.10–$0.40 depending on crisis-class count

---

## Out-of-scope guardrails (DO NOT)

1. **Do NOT modify the trajectory-class prose rubric.** The existing rubric stays exactly as it is; this CC adds a parallel crisis register.
2. **Do NOT add new survey questions.** Per `feedback_minimal_questions_maximum_output`.
3. **Do NOT modify CC-PRIMAL-COHERENCE code.** Path-class gating is its responsibility; this CC reads the gating output.
4. **Do NOT modify the body cards' content for trajectory-class users.** Only the top-of-section hedge for crisis-class users is added.
5. **Do NOT include specific helpline phone numbers, URLs, or resource lists.** Helplines vary by region, become stale, and can feel performative. The instrument's pointer is general ("a therapist, a friend who knows you well"); specific resources require user request.
6. **Do NOT make any clinical claims.** Banned: "depression," "anxiety," "trauma," "PTSD," "dissociation," "burnout" (clinical sense), "mental health crisis," "suicidal ideation." Allowed: "hard season," "real difficulty," "weight."
7. **Do NOT modify the four-vector dashboard rendering.** Crisis-path visualization differential is CC-TRAJECTORY-VISUALIZATION's territory.
8. **Do NOT bundle CC-OPEN-HANDS work.** Open-hands prose is trajectory-class only and lands as a separate CC.
9. **Do NOT modify the existing ethical guardrails in body cards.** Only add the elevated standing reminder for crisis-class users.
10. **Do NOT regenerate trajectory-class cached paragraphs incidentally.** Audit #9 enforces byte-identity.

---

## Verification checklist

- [ ] `npx tsc --noEmit`
- [ ] `npm run lint`
- [ ] `npx tsx tests/audit/crisisPathProse.audit.ts` (new — all 10 assertions pass)
- [ ] `npx tsx tests/audit/synthesis3.audit.ts` (extended — pass)
- [ ] `npx tsx tests/audit/gripTaxonomy.audit.ts` (extended — pass)
- [ ] `npx tsx tests/audit/proseRegister.audit.ts` (CC-RELIGIOUS-REGISTER-RULES — composes; pass)
- [ ] `npx tsx tests/audit/primalCoherence.audit.ts` (pass)
- [ ] All other existing audits remain green
- [ ] Cohort regeneration runs cleanly; crisis-class paragraphs generated; trajectory-class unaffected

---

## Report-back format

1. **Summary** — files modified, line-count delta, audit pass count.
2. **Crisis prose rubric paste** — the per-flavor rubric examples as inserted in the system prompt (so Jason / Clarence can review the language).
3. **5 generated crisis-class paragraphs** — one per flavor, full paragraph text. Tagged with fixture name + flavor + ethical-guardrail-block confirmation.
4. **Engine-fallback template paste** — the deterministic templates that fire when LLM is unavailable. Confirm structural correctness without LLM warmth.
5. **Wedding-readout test** — confirm all 5 generated paragraphs pass (subjective; flag any that read as religious or as clinical).
6. **Trajectory-class non-regression confirmation** — show that trajectory-class cached paragraphs are byte-identical pre/post CC.
7. **Audit pass/fail breakdown** — every audit listed in the verification checklist.
8. **Out-of-scope verification** — confirm none of the 10 DO-NOT items were touched. Specifically confirm zero diff in trajectory-class prose, no helpline injection, no clinical vocabulary.
9. **Cost note** — actual API spend.
10. **Recommendations for follow-on work** — including any flavors where the prose feels under-differentiated, any cohort fixtures that surfaced unexpected coherence-gap classifications, any ethical-guardrail framings that could be tightened.

---

**Architectural test for this CC:** a user with high *Am I successful?* grip and Goal score 25 reads a paragraph that names the longing without naming a clinical condition, refuses the trajectory framework, offers a real-but-small next move, and closes with the ethical pointer. The same paragraph passes the wedding-readout test AND respects every banned-phrase list (architectural, religious, clinical). If this lands clean across all 5 flavors, the crisis-path register works.
