# CC-VOICE-RUBRIC-EXPANSION — Si/Se/Ti/Fi Driver Rubric Examples in LLM System Prompts

**Origin:** Cohort and pattern-catalog work has surfaced an asymmetry — the LLM rubric examples in `lib/synthesis3Llm.ts` and `lib/gripTaxonomyLlm.ts` are predominantly Ni/Ne/Te-driver examples. The pattern catalog has known Ne/Ni/Te bias (per `feedback_pattern_catalog_function_bias`). The cohort under-represents Si/Se driver shapes. The risk: when the LLM generates prose for Si/Se/Ti/Fi-driver users, it averages the prose toward Ni/Ne/Te register, producing reads that are "almost right but feel off" precisely for users whose driver function is on the under-represented side.

This CC adds canonical rubric examples for Si, Se, Ti, and Fi driver shapes to the LLM system prompts. The goal: force the LLM to reach for shape-appropriate register rather than averaging toward the rubric center of gravity.

**Method discipline:** Engine for truth. LLM for reception. The rubrics are validated examples (drawn from already-cached cohort prose where possible) embedded in the system prompts as additional reference shapes. The audit asserts on rubric-example coverage (one canonical exemplar per dominant function). The wedding-readout test still applies.

**Scope frame:** ~1-2 hours executor time. CC-standard scale. Adds rubric examples to existing prompts; no new prose generation infrastructure. Validates against existing cohort fixtures.

**Cost surface:** ~$0.50 cohort regeneration. Adding new rubric examples changes prompt content → input hashes change → cache invalidation by design. Small Si/Se cohort means most regenerated paragraphs are Ni/Ne/Te shapes anyway, but the new rubrics should produce a measurable register shift on the Si/Se/Ti/Fi fixtures.

---

## Embedded context (CC executor environments don't see Cowork memory)

### The asymmetry in the current rubrics

The current rubric library in both LLM system prompts is dominated by:
- Ni driver examples (Jason's INTJ, gsg/02-compartmentalized's stewardship register)
- Te driver examples (achievement / consequence register)
- Fe driver examples (ocean/27-fe-room-reader-attuned)

Underweighted (or absent):
- Si driver — precedent-keeping, "what holds, what doesn't drift" register
- Se driver — present-tense, sensory-grounded, "what's actually here right now" register
- Ti driver — coherence-seeking, "the read has to be internally consistent" register
- Fi driver — inner-compass, "this is true to me regardless of what room I'm in" register

When the LLM generates prose for an Si-driver user with no Si rubric in the prompt, it pulls from Ni/Ne register because that's what's available. The output is not wrong — it's *off-register*. The user reads it as "smart but not quite about me."

### The driver-specific register signatures (what each rubric should capture)

| Driver | Canonical phrasing register | What to lean into | What to avoid |
|---|---|---|---|
| Si | Precedent, continuity, what holds, reliable form, "the way you keep what matters" | Concrete past examples, what doesn't drift, the shape of repetition that becomes care | Abstract pattern-reading, "the long arc," foresight vocabulary (these are Ni-flavored) |
| Se | Present-tense, sensory, what's-in-the-room, immediate competence, "what you do when it's actually happening" | Embodied action, what gets noticed in real time, concrete responsiveness | Long-horizon framing, "the trajectory," strategic-architectural vocabulary |
| Ti | Coherence, internal consistency, "does this hold up?", the read that earns its conclusion | Logical structure as care, the discipline of refusing to round off, precision as integrity | "Excellence" / "consequence" framing (these are Te-flavored), structural-output vocabulary |
| Fi | Inner-compass, what's true regardless of room, "this stays itself under pressure" | Authenticity register, refusal-to-perform, the integrity that doesn't bend to context | Room-shaping framing (this is Fe), "what others experience" vocabulary, attunement-language |

These are *register signatures*, not strict vocabulary rules. Each driver shape's prose should *feel* different from the others — not because it uses different words, but because it reaches for different metaphors and emphases.

### The cohort fixtures we can use as canonical exemplars

The existing cache likely holds adequate-quality prose for some of these driver shapes already:

- **Si driver** — `ocean/24-si-precedent-keeper` (cached Path master synthesis from CC-AGE-CALIBRATION shows good Si register: "you grew up watching what doesn't hold, and now you build what does")
- **Ti driver** — `ocean/25-ti-coherence-prober` (cached prose available; Ti coherence-prober register)
- **Se driver** — fewer fixtures; may need to draft a canonical exemplar OR pull the best-available from `goal-soul-give/03/08/10-striving` (these are Se-leaning per CC-MBTI-LABEL-FIX)
- **Fi driver** — fewer fixtures; need to identify a canonical Fi-driver fixture in cohort. If none, the executor should draft one Fi rubric exemplar that captures the Fi register, paralleling the structure of the existing INTJ rubric.

The CC executor should:
1. Read the cached `synthesis3-paragraphs.json` and `grip-paragraphs.json` for Si and Ti fixtures' current prose
2. Use those (verbatim or near-verbatim) as the rubric examples in the new prompts
3. For Se and Fi where cohort exemplars are thin, draft canonical exemplars in the spirit of the register signatures above, paralleling Jason's INTJ rubric structure (Surface Grip / Underlying Question / Distorted Strategy / Healthy Gift OR the master-synthesis paragraph structure)
4. Document each rubric's source (cached fixture vs newly drafted) in code comments

### What the rubric examples MUST satisfy

1. **Pass the wedding-readout test** — no tribal religious markers (per CC-RELIGIOUS-REGISTER-RULES).
2. **Pass the no-clinical-vocabulary test** — no diagnostic terms (per CC-CRISIS-PATH-PROSE).
3. **Be canonically representative of the driver register** — when the LLM looks at the example, it should be able to extract the register signature for similar shapes.
4. **Be diverse across other axes** — different Compass profiles, different Movement quadrants, different bands, so the LLM doesn't conflate driver register with other axes.

---

## Architecture

### File map

| File | Action | Purpose |
|---|---|---|
| `lib/voiceRubricExamples.ts` | NEW | Single-source-of-truth module exporting `SI_DRIVER_RUBRIC`, `SE_DRIVER_RUBRIC`, `TI_DRIVER_RUBRIC`, `FI_DRIVER_RUBRIC` constants. Same pattern as `lib/productThesisAnchor.ts` from CC-PRODUCT-THESIS-CANON. |
| `lib/synthesis3Llm.ts` | MODIFY | Import the four driver rubrics; embed them in SYSTEM_PROMPT as additional rubric examples (after the existing Ni/Ne/Te/Fe rubrics). |
| `lib/gripTaxonomyLlm.ts` | MODIFY | Same — embed the rubrics in GRIP_SYSTEM_PROMPT. |
| `tests/audit/voiceRubricExpansion.audit.ts` | NEW | Audit assertions: rubric module exists, all four exemplars present, both prompts contain the verbatim constants, no banned phrases in any rubric. |
| `lib/cache/synthesis3-paragraphs.json` | REGENERATE | Input hashes change. |
| `lib/cache/grip-paragraphs.json` | REGENERATE | Same. |

### Single-source-of-truth pattern (per CC-PRODUCT-THESIS-CANON precedent)

```ts
// lib/voiceRubricExamples.ts

export const SI_DRIVER_RUBRIC = `
[Si rubric exemplar — drawn from ocean/24-si-precedent-keeper cache OR draft.
Include source attribution comment.]
`;

export const SE_DRIVER_RUBRIC = `
[Se rubric exemplar — drawn from gsg/03 OR similar OR drafted.]
`;

export const TI_DRIVER_RUBRIC = `
[Ti rubric exemplar — drawn from ocean/25-ti-coherence-prober cache.]
`;

export const FI_DRIVER_RUBRIC = `
[Fi rubric exemplar — drafted, paralleling INTJ rubric structure.]
`;

export const VOICE_RUBRIC_LABELS: Record<string, string> = {
  si: "Si — precedent-keeper register (continuity, what holds, what doesn't drift)",
  se: "Se — present-tense register (immediate competence, embodied action, what's in the room)",
  ti: "Ti — coherence-prober register (internal consistency, precision as integrity)",
  fi: "Fi — inner-compass register (authenticity, what stays itself under pressure)",
};
```

### Insertion in system prompts

Both prompts already contain rubric examples for the existing register space. Add a new section after those examples:

```
# Driver-register rubric expansion

The following rubric examples represent driver-function register variety. When the user's lens_stack.dominant matches one of these drivers, lean toward the register signature shown.

## Si driver — precedent-keeper register
${SI_DRIVER_RUBRIC}

## Se driver — present-tense register
${SE_DRIVER_RUBRIC}

## Ti driver — coherence-prober register
${TI_DRIVER_RUBRIC}

## Fi driver — inner-compass register
${FI_DRIVER_RUBRIC}

These registers are signatures, not strict vocabulary rules. Same warmth diagnostic, same wedding-readout test, same banned-phrase lists. The driver register changes WHAT the prose reaches for; the architectural framing (product thesis, religious register, age band) stays.
```

### Driver register-hint in user-prompt builder

When the user's `lensStack.dominant` is one of `si | se | ti | fi`, the user prompt builder should additionally pass a `driverRegisterHint` field that names the relevant rubric. The LLM consumes this as a cue for which rubric to lean toward.

```ts
// In synthesis3Inputs.ts and gripTaxonomyInputs.ts:
const SI_HINT = "Driver register: Si (precedent-keeper). Lean toward continuity, reliable form, what holds. Avoid 'long arc' / 'foresight' (Ni vocabulary).";
const SE_HINT = "Driver register: Se (present-tense). Lean toward immediate competence, embodied action. Avoid strategic-architectural framing (Te vocabulary).";
const TI_HINT = "Driver register: Ti (coherence-prober). Lean toward internal consistency, precision as integrity. Avoid 'excellence' / 'consequence' framing (Te vocabulary).";
const FI_HINT = "Driver register: Fi (inner-compass). Lean toward authenticity, what stays itself under pressure. Avoid 'attunement' / 'room-shaping' framing (Fe vocabulary).";

// Map dominant function to hint
function driverRegisterHint(dominant: CognitiveFunctionId): string | null {
  switch (dominant) {
    case "si": return SI_HINT;
    case "se": return SE_HINT;
    case "ti": return TI_HINT;
    case "fi": return FI_HINT;
    default: return null; // Ni / Ne / Te / Fe shapes use existing rubric center of gravity
  }
}
```

---

## Audit assertions (8 NEW)

In `tests/audit/voiceRubricExpansion.audit.ts`:

1. **`voice-rubric-module-exists`** — `lib/voiceRubricExamples.ts` exists and exports the four constants.
2. **`voice-rubric-non-empty`** — each of the four rubric constants is a non-empty string > 100 chars.
3. **`voice-rubric-prompts-anchor`** — both `synthesis3Llm.ts` and `gripTaxonomyLlm.ts` SYSTEM_PROMPTs contain all four rubric constants verbatim.
4. **`voice-rubric-banned-phrases-absent`** — each rubric constant passes `auditProseForBannedPhrases()` (per CC-RELIGIOUS-REGISTER-RULES).
5. **`voice-rubric-clinical-phrases-absent`** — each rubric constant contains none of the clinical banned phrases (per CC-CRISIS-PATH-PROSE).
6. **`voice-rubric-driver-hint-routing`** — `driverRegisterHint(dominant)` returns a non-null hint for `si|se|ti|fi` and `null` for `ni|ne|te|fe`.
7. **`voice-rubric-cohort-shift-on-si-fixture`** — for `ocean/24-si-precedent-keeper`, the regenerated cached paragraph contains at least one canonical Si register marker (e.g., "what holds," "what doesn't drift," "reliable form," "continuity," "precedent" — fuzzy match on at least one). Observational; flag for review if absent.
8. **`voice-rubric-cohort-shift-on-ti-fixture`** — for `ocean/25-ti-coherence-prober`, same check on Ti register markers ("coherence," "internal consistency," "earns its conclusion," "precision," "doesn't round off").

In `tests/audit/synthesis3.audit.ts` extension:
- 1 assertion that the SYSTEM_PROMPT contains the driver-rubric expansion section.

In `tests/audit/gripTaxonomy.audit.ts` extension:
- 1 assertion that the GRIP_SYSTEM_PROMPT contains the driver-rubric expansion section.

---

## Cohort regeneration

After the prompts change, regenerate caches with `--force`:

```
ANTHROPIC_API_KEY=$(grep ^ANTHROPIC_API_KEY .env.local | cut -d= -f2) npx tsx scripts/buildSynthesis3.ts --force
ANTHROPIC_API_KEY=$(grep ^ANTHROPIC_API_KEY .env.local | cut -d= -f2) npx tsx scripts/buildGripTaxonomy.ts --force
```

Expected outcome:
- All cohort paragraphs regenerate (~$0.50)
- Si and Ti fixtures (ocean/24, ocean/25) produce paragraphs with notable register-marker presence
- Se fixtures (gsg/03, 08, 10) produce paragraphs leaning toward present-tense register
- Ni/Ne/Te/Fe fixtures: largely unchanged in feel (their existing rubrics still center the gravity)

---

## Out-of-scope guardrails (DO NOT)

1. **Do NOT remove existing rubric examples.** The new driver-register rubrics ADD to the rubric library; they don't replace.
2. **Do NOT modify CC-RELIGIOUS-REGISTER-RULES banned-phrase list.** The new rubrics must respect the existing list.
3. **Do NOT modify CC-CRISIS-PATH-PROSE flavor templates.** Voice rubric expansion is independent of path-class register.
4. **Do NOT modify the engine's lens_stack computation.** Rubrics consume `dominant`; they don't recompute it.
5. **Do NOT add new survey questions.**
6. **Do NOT modify CC-AGE-CALIBRATION band logic.** Driver register composes alongside band register.
7. **Do NOT modify CC-PRODUCT-THESIS-CANON anchor block.** It stays at the top of both prompts; voice rubrics insert further down.
8. **Do NOT bundle CC-PATTERN-CATALOG-SI-SE-FI work.** Pattern catalog extension is a separate engine-layer CC.
9. **Do NOT add cohort fixtures.** That's CC-COHORT-EXPANSION-SI-SE.
10. **Do NOT use ChatGPT or external sources to draft rubrics.** Use the existing cached prose where available; draft Se/Fi exemplars in-house against the register signatures.

---

## Verification checklist

- [ ] `npx tsc --noEmit`
- [ ] `npm run lint`
- [ ] `npx tsx tests/audit/voiceRubricExpansion.audit.ts` (new — all 8 assertions pass)
- [ ] `npx tsx tests/audit/synthesis3.audit.ts` (extended — pass)
- [ ] `npx tsx tests/audit/gripTaxonomy.audit.ts` (extended — pass)
- [ ] `npx tsx tests/audit/proseRegister.audit.ts` (CC-RELIGIOUS-REGISTER-RULES — composes; pass)
- [ ] All other existing audits remain green
- [ ] Cohort regeneration runs cleanly; both cache files updated
- [ ] No banned-phrase or clinical-phrase violations in any rubric or regenerated paragraph

---

## Report-back format

1. **Summary** — files added/modified, line-count delta, audit pass count.
2. **Four rubric constants paste** — full content of each (Si, Se, Ti, Fi). Mark each with source: cached fixture (which one) or in-house draft.
3. **Driver register-hint routing confirmation** — show `driverRegisterHint("si")` / `("se")` / `("ti")` / `("fi")` outputs.
4. **Cohort register-marker presence report** — for ocean/24 (Si), ocean/25 (Ti), and any Se / Fi cohort fixtures, list at least one canonical register marker found in the regenerated paragraph. Flag any fixture where no marker fires.
5. **Sample paragraphs comparison** — for ocean/24 (Si fixture), paste BOTH the pre-CC cached paragraph AND the post-CC regenerated paragraph. Confirm the register has shifted toward Si signature.
6. **Audit pass/fail breakdown** — every audit listed in the verification checklist.
7. **Out-of-scope verification** — confirm none of the 10 DO-NOT items were touched.
8. **Cost note** — actual API spend on cohort regeneration.
9. **Recommendations for follow-on work** — including:
   - Any driver register where the cohort regeneration showed weak shift (suggesting the rubric needs sharpening)
   - Whether CC-COHORT-EXPANSION-SI-SE should be raised in priority (e.g., if Se / Fi register couldn't be empirically validated due to fixture thinness)

---

**Architectural test for this CC:** ocean/24-si-precedent-keeper's regenerated paragraph reads as Si-flavored (continuity, reliable form, what holds) rather than Ni-flavored (long arc, foresight, pattern). ocean/25-ti-coherence-prober reads Ti-flavored (coherence, internal consistency) rather than Te-flavored (excellence, consequence). If the register shift is observable in cached output, the voice rubric expansion is doing real work.
