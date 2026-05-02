# CC-038-prose — Aux-Pair Register Editorial Pass (v3 labels + canon framing + healthy/distorted/product-safe expressions)

**Type:** Editorial follow-on to CC-038. Replaces v1 placeholder analog labels with locked v3 labels; adds Driver/Instrument framing; adds three editorial expression fields per pair (healthy / distorted / product-safe sentence); locks three structural canon principles; wires the register analog into Mirror prose.
**Goal:** Convert CC-038's data spine from v1-placeholder state to product-ready state. Sixteen function-pair registers each carry: short single-word analog label, Driver/Instrument metadata, prototypical-healthy expression sentence, distorted-under-stress expression sentence, product-safe rendering sentence (the "Your Lens has a [analog] quality..." form). Three canon principles lock alongside: "Lens pair is a movement, not a type"; mirror-pair asymmetry preservation; single-word-label register canon.
**Predecessors:** CC-038 (data layer; shipped 2026-04-29). CC-034 / CC-029 / CC-036 (cognitive-function-parity tiers; all shipped). All v3 labels and editorial scope locked through workshop with Clarence and CC.
**Successor:** CC-038-body-map — deferred until Clarence's body-map vocabulary inconsistency is resolved (the "Agency" placeholder appearing in 4 cells of the body-map route column without being in the stated 8-card vocabulary). Once resolved, the body-map column ships as a separate CC.

---

## Why this CC

CC-038 shipped the routing structure with v1-placeholder analog labels (compound forms like *the framework-prober* / *the long-arc-architect* / *the cultivator-of-belonging*). The placeholders established the routing canon and let the engine compile, but they read as engineered phrases rather than inhabited identities — compound-noun forms doing rhetorical work that the `short_description` field was already supposed to carry. Workshop with Clarence and CC produced a v3 single-word label set where each label registers as a role a person could occupy and the `short_description` carries the specifying weight.

Beyond the label refresh, three structural canon principles surfaced that should lock alongside:

1. **"A Lens pair is not a type — it is a movement."** The instrument never tells a user "you are Ni-Te." It says "Your Lens has a long-arc architect quality" and explains the movement in ordinary language. This is the operational guardrail that distinguishes the register taxonomy from MBTI typology.

2. **Driver/Instrument framing replaces Judger/Perceiver-dominant shorthand.** The Driver is the first voice in the pair (supplies center of gravity); the Instrument is the second voice (supplies supporting method). J/P shorthand fights Jung's actual driver structure (INTP is Ti-driven though MBTI types it P; INTJ is Ni-driven though MBTI types it J), so canon avoids J/P.

3. **Mirror pairs share gift categories but should not be deduplicated.** Ni-Te and Te-Ni both route through Builder, but Ni-Te begins with the long-range pattern and seeks structure while Te-Ni begins with structure and aims it through the long-range pattern. The driver/instrument flip captures asymmetry that prose layers must preserve.

Plus a fourth principle on labeling itself, which lands as canon: future register-class labels prefer single-word inhabited identities; descriptions carry specificity. Compound labels register as engineered phrases unless the compound names a real distinction the description cannot land.

This CC also wires the register analog into Mirror prose — a single sentence in the Mirror card's strength section that names the user's register and references it back to the gift-category prose. CC-038 left this out of scope deliberately; CC-038-prose is its natural home.

---

## Scope

Files modified:

1. `lib/identityEngine.ts` — replace v1 analog labels in `FUNCTION_PAIR_REGISTER` with v3 locked labels; refine `short_description` strings to carry the specifying weight that was previously in compound labels; add `driver` and `instrument` fields to each entry; add three editorial fields per entry: `healthy_expression`, `distorted_expression`, `product_safe_sentence`.
2. `lib/types.ts` — extend `FunctionPairRegister` shape with `driver`, `instrument`, `healthy_expression`, `distorted_expression`, `product_safe_sentence` fields.
3. `app/components/MirrorCard.tsx` (or wherever Mirror prose composes — verify with `Read` first) — surface the register analog and product-safe sentence in the strength section. Single-sentence light edit; preserves existing Mirror prose architecture.
4. `docs/canon/function-pair-registers.md` — major revision. Replace v1 table with v3 table including all new fields. Add the three structural canon principles as named sections at the top of the doc. Add the single-word-label canon principle as a fourth. Lock the body-map column DEFERRED note pointing to CC-038-body-map for Agency-resolution work.
5. `docs/canon/output-engine-rules.md` — add the four canon principles as cross-references to function-pair-registers.md. Update the existing CC-038 section to point at the v3 labels.

Nothing else. Specifically:

- **No body-map column.** Deferred to CC-038-body-map.
- **No new gift categories.**
- **No new cross-card patterns.**
- **No re-routing.** All 16 routes' `gift_category` field stays as locked in CC-038.
- **No new questions or signals.**

---

## The v3 locked labels and rationale

Each pair gets a single-word analog (or simple compound where the compound names a real distinction). The `short_description` carries the specifying weight that was in v1's compound labels.

| Pair | v1 (placeholder, in code) | v3 (locked) | Rationale |
|---|---|---|---|
| Ne-Ti | the framework-prober | **the prober** | Single-word; testing register intact via description |
| Ne-Fi | the meaning-catalyst | **the catalyst** | Description carries "meaning" |
| Ni-Te | the long-arc-architect | **the architect** | Description carries time horizon |
| Ni-Fe | the seer-of-people | **the seer** | Description carries "of-people" |
| Se-Ti | the surgeon-mind | **the surgeon** | "Mind" suffix unnecessary |
| Se-Fi | the artist-of-presence | **the artist** | Description carries "of-presence" |
| Si-Te | the keeper-and-builder | **the keeper** | Pairs cleanly with TeSi's "operator" |
| Si-Fe | the family-tender | **the family-tender** | Compound retained — already inhabited |
| Te-Ni | the strategic-executive | **the strategist** | Drops corporate read |
| Te-Si | the operational-leader | **the operator** | Verb-form differentiation |
| Ti-Ne | the system-questioner | **the questioner** | Parallelism with Ne-Ti's "prober" |
| Ti-Se | the troubleshooter | **the troubleshooter** | Compound retained — already simple, exact |
| Fe-Ni | the pastoral-mind | **the pastor** | Plainspoken authority; loses some weight, gains travel |
| Fe-Si | the cultivator-of-belonging | **the kinkeeper** | Anthropologically specific to FeSi register |
| Fi-Ne | the authentic-imaginer | **the imaginer** | "Authentic" carries through description |
| Fi-Se | the values-embodied | **the witness** | Fixes broken adjectival grammar |

Twelve labels become single-word; four retain compound form (family-tender, troubleshooter — and via different reasoning, kinkeeper which is a noun-compound, not an adjective-noun). The compounds remain because they read as inhabited identities, not engineered phrases.

---

## Driver / Instrument metadata

Each `FunctionPairRegister` entry gains two new fields. The driver is always the first voice in the pair; the instrument is always the second. Both fields use the canonical voice labels from `FUNCTION_VOICE_SHORT` (the user-facing register names, not the function codenames).

The driver/instrument labels are themselves a small workshop. Clarence proposed:

| Voice | Driver register | Instrument register |
|---|---|---|
| Ne | possibility-finder | possibility-finder |
| Ni | pattern-reader | pattern-reader |
| Se | present-tense self | present-tense self |
| Si | precedent-checker | precedent-checker |
| Te | structurer | structurer |
| Ti | coherence-checker | coherence-checker |
| Fe | room-reader | room-reader |
| Fi | inner compass | inner compass |

Each function carries the same register name whether it's serving as driver or instrument — the function's nature is consistent; only its position in the pair changes.

These labels are v1 placeholders themselves; refine if browser smoke surfaces tone problems. The `pair_key` and field structure are canonical.

---

## The three editorial expression fields

Each register gets three new prose fields beyond the `short_description`:

1. **`healthy_expression`** — one sentence describing what the register looks like when integrated and operating well. Names the register's natural strengths in active voice. Length: 18–35 words.

2. **`distorted_expression`** — one sentence describing what the register looks like under stress, when the gift becomes a risk. Names the gift→risk dynamic without pathologizing. Length: 18–35 words.

3. **`product_safe_sentence`** — one sentence in the canonical user-facing form: *"Your Lens has a [analog] quality: you appear to [observable behavior]..."* This is the locked grammatical pattern the Mirror card uses to surface the register without typing the user. Length: 25–40 words.

### Locked content for all 16 registers

```ts
NeTi: {
  pair_key: "NeTi",
  driver: "Ne",
  instrument: "Ti",
  analog_label: "the prober",
  gift_category: "Discernment",
  short_description:
    "Possibility-generation disciplined by internal-logical structure. Pattern-matches across many frames AND tests each match against a coherent framework — anomaly-detection by triangulation.",
  healthy_expression:
    "Generates many possible explanations for what's happening, then disciplines the field by testing each explanation against a coherent logical structure.",
  distorted_expression:
    "Endless probing without commitment — possibilities multiply faster than coherence can settle, and the testing register starts disqualifying rather than discriminating.",
  product_safe_sentence:
    "Your Lens has a prober quality: you appear to generate alternative explanations across many frames, then test each one against the same disciplined internal logic.",
},
NeFi: {
  pair_key: "NeFi",
  driver: "Ne",
  instrument: "Fi",
  analog_label: "the catalyst",
  gift_category: "Generativity",
  short_description:
    "Possibility-generation oriented by personal-values authentication. Sees what someone or something could become, then offers the invitation in a way that honors the values anchor.",
  healthy_expression:
    "Reads what's becoming possible in another person or situation and frames the invitation in a way that the person can recognize as their own real opportunity.",
  distorted_expression:
    "Possibility-naming runs ahead of the relational ground — the catalyst sees what could become true and pushes the invitation before the person is ready to receive it.",
  product_safe_sentence:
    "Your Lens has a catalyst quality: you appear to see what someone or something could become, and to frame the invitation in a way that honors what feels true to them.",
},
NiTe: {
  pair_key: "NiTe",
  driver: "Ni",
  instrument: "Te",
  analog_label: "the architect",
  gift_category: "Builder",
  short_description:
    "Depth-of-vision in service of operational execution. Holds the long arc and translates it into the structure the next phase requires.",
  healthy_expression:
    "Sees the future shape that's not yet visible to others, then builds the operational architecture that will be needed to carry it when it arrives.",
  distorted_expression:
    "The architecture gets ahead of the present — the long-arc vision becomes a constraint on what people can actually do today, and the structure overtakes the situation it was meant to serve.",
  product_safe_sentence:
    "Your Lens has an architect quality: you appear to see the future shape first, then look for the practical structures that could carry it.",
},
NiFe: {
  pair_key: "NiFe",
  driver: "Ni",
  instrument: "Fe",
  analog_label: "the seer",
  gift_category: "Meaning",
  short_description:
    "Depth-of-vision in service of relational-meaning. Reads what someone could become and tends the becoming through patient relational presence.",
  healthy_expression:
    "Holds an unhurried sense of who someone is becoming and tends that becoming with the kind of presence that doesn't require the person to see it yet.",
  distorted_expression:
    "The seeing turns prescriptive — the register starts holding people to the version of themselves the seer has glimpsed, before the person has had the chance to choose it.",
  product_safe_sentence:
    "Your Lens has a seer quality: you appear to read what someone could become over the long arc and to tend that becoming through patient relational presence.",
},
SeTi: {
  pair_key: "SeTi",
  driver: "Se",
  instrument: "Ti",
  analog_label: "the surgeon",
  gift_category: "Precision",
  short_description:
    "Somatic engagement disciplined by internal-logical structure. The hand that knows which cut to make in the moment because the framework is already internalized.",
  healthy_expression:
    "Reads the situation by being inside it, applies a precise intervention learned from internalized framework, and trusts the body to know which move is the right move.",
  distorted_expression:
    "The framework hardens into reflex — the precision register starts cutting before the situation has finished revealing itself, and intervention runs ahead of diagnosis.",
  product_safe_sentence:
    "Your Lens has a surgeon quality: you appear to enter the situation directly, read what's actually happening, and act with precision learned from prior framework.",
},
SeFi: {
  pair_key: "SeFi",
  driver: "Se",
  instrument: "Fi",
  analog_label: "the artist",
  gift_category: "Action",
  short_description:
    "Somatic engagement oriented by personal-values authentication. Embodiment as expression — the value made visible through how the moment is met.",
  healthy_expression:
    "Discovers what matters through direct contact with the moment and expresses the discovery through how the body shows up — taste, courage, refusal, presence.",
  distorted_expression:
    "Expression replaces examination — the values feel known through performance rather than tested against difficulty, and the artist's certainty about what's true outpaces the contact that earned it.",
  product_safe_sentence:
    "Your Lens has an artist quality: you appear to discover and express value through direct contact with the present moment — embodiment as expression.",
},
SiTe: {
  pair_key: "SiTe",
  driver: "Si",
  instrument: "Te",
  analog_label: "the keeper",
  gift_category: "Stewardship",
  short_description:
    "Preservation across time disciplined by operational execution. Maintains the institution AND extends it — turns memory into standards that hold up over years.",
  healthy_expression:
    "Holds the long memory of what has actually worked and translates it into the standards, systems, and routines that let the institution continue to work.",
  distorted_expression:
    "Preservation becomes precedent-tyranny — what worked before becomes what must work now, and the keeper starts protecting the institution from its own next form.",
  product_safe_sentence:
    "Your Lens has a keeper quality: you appear to preserve what has endured, then turn that memory into standards and systems others can rely on.",
},
SiFe: {
  pair_key: "SiFe",
  driver: "Si",
  instrument: "Fe",
  analog_label: "the family-tender",
  gift_category: "Harmony",
  short_description:
    "Preservation across time oriented by relational attunement. Holds the fabric of who-belongs-to-whom and tends it through small, consistent acts of remembered care.",
  healthy_expression:
    "Notices the small ritual acts that hold a community's fabric in place — birthdays, check-ins, the dish someone always brings — and continues them so the belonging continues.",
  distorted_expression:
    "The tending becomes silent obligation — the family-tender carries the fabric without being seen carrying it, and resentment starts to grow under the surface of the consistent care.",
  product_safe_sentence:
    "Your Lens has a family-tender quality: you appear to notice and protect the small consistent acts that help a community feel held over time.",
},
TeNi: {
  pair_key: "TeNi",
  driver: "Te",
  instrument: "Ni",
  analog_label: "the strategist",
  gift_category: "Builder",
  short_description:
    "Operational execution informed by depth-of-vision. Builds the system the long arc requires, not the system the present demands.",
  healthy_expression:
    "Reads the long-arc objective and aims the present operational force directly at it — the resources, the structure, and the deadlines all point at the same horizon.",
  distorted_expression:
    "The strategy outruns the people executing it — the long-arc objective remains crisp in the strategist's head while the team is asked to carry a plan they can no longer see the reasons for.",
  product_safe_sentence:
    "Your Lens has a strategist quality: you appear to aim operational force toward a long-range objective and to build the system the long arc requires.",
},
TeSi: {
  pair_key: "TeSi",
  driver: "Te",
  instrument: "Si",
  analog_label: "the operator",
  gift_category: "Stewardship",
  short_description:
    "Operational execution informed by preservation-across-time. Runs what must keep working through standards, precedent, duty, and operational trust.",
  healthy_expression:
    "Keeps the institution running with the eye of someone who knows both what it does today and what it has done before — operations that respect their own history.",
  distorted_expression:
    "The operations become ritual — the operator runs the system because the system runs, and what was once stewardship hardens into resistance to any change at all.",
  product_safe_sentence:
    "Your Lens has an operator quality: you appear to run what must keep working through standards, precedent, and operational trust.",
},
TiNe: {
  pair_key: "TiNe",
  driver: "Ti",
  instrument: "Ne",
  analog_label: "the questioner",
  gift_category: "Discernment",
  short_description:
    "Internal-logical structure-building informed by possibility-generation. Tests systems by imagining alternatives — finds truth by asking what else could explain the pattern.",
  healthy_expression:
    "Holds the system being claimed and tests it against the systems that could have been claimed instead — coherence earned by surviving real alternatives.",
  distorted_expression:
    "The questioning becomes solvent — every system gets tested against alternatives until none of them survive, and the questioner ends up holding nothing because everything could have been otherwise.",
  product_safe_sentence:
    "Your Lens has a questioner quality: you appear to test every system by imagining alternatives — finding truth by asking what else could explain the pattern.",
},
TiSe: {
  pair_key: "TiSe",
  driver: "Ti",
  instrument: "Se",
  analog_label: "the troubleshooter",
  gift_category: "Precision",
  short_description:
    "Internal-logical structure-building informed by somatic engagement. Diagnoses by entering the broken thing — precision earned from logic under direct contact.",
  healthy_expression:
    "Enters the system that's not working, applies a logical map to what's actually present, and locates the failure where the abstract framework meets the concrete situation.",
  distorted_expression:
    "Diagnosis without resolution — the troubleshooter can name what's broken with precision but the contact-based mode resists the longer-arc work of building what would actually replace it.",
  product_safe_sentence:
    "Your Lens has a troubleshooter quality: you appear to diagnose by entering the broken thing — precision learned from logic in direct contact with the failure.",
},
FeNi: {
  pair_key: "FeNi",
  driver: "Fe",
  instrument: "Ni",
  analog_label: "the pastor",
  gift_category: "Meaning",
  short_description:
    "Relational attunement informed by depth-of-vision. Holds what the person could become and orchestrates the room toward letting that becoming happen.",
  healthy_expression:
    "Reads the room with an unhurried sense of who each person is becoming, and arranges the conditions — attention, timing, witness — so that the becoming has room.",
  distorted_expression:
    "The pastoral register starts moving people — the seeing of what could be becomes a quiet pressure for it to be, and the orchestration crosses into authoring lives that aren't the pastor's to author.",
  product_safe_sentence:
    "Your Lens has a pastor quality: you appear to read the room through a sense of who people could become, and to arrange the conditions for that becoming to have room.",
},
FeSi: {
  pair_key: "FeSi",
  driver: "Fe",
  instrument: "Si",
  analog_label: "the kinkeeper",
  gift_category: "Harmony",
  short_description:
    "Relational attunement informed by preservation-across-time. Maintains the connective tissue of community through ritual, presence, and small consistent acts.",
  healthy_expression:
    "Holds the network of who's connected to whom and tends the connections through ritual and small consistent presence — the work that keeps a community a community.",
  distorted_expression:
    "The kinkeeping becomes the only role — the kinkeeper holds the community's threads but loses the parts of self that don't serve the threading, and resentment grows where individuation should have.",
  product_safe_sentence:
    "Your Lens has a kinkeeper quality: you appear to maintain the connective tissue of community through ritual, presence, and small consistent acts of relational care.",
},
FiNe: {
  pair_key: "FiNe",
  driver: "Fi",
  instrument: "Ne",
  analog_label: "the imaginer",
  gift_category: "Integrity",
  short_description:
    "Personal-values authentication informed by possibility-generation. Holds what's true to the self AND what could become true — the values-driven explorer.",
  healthy_expression:
    "Tests possibilities against the inner compass first — what's worth imagining is what could become true while remaining true to the values the self is anchored in.",
  distorted_expression:
    "The imagining stays inward — the values-driven explorer never leaves the conditional mode, and the possibilities accumulate without being made real because none of them is fully tested against the world.",
  product_safe_sentence:
    "Your Lens has an imaginer quality: you appear to explore what could be while testing whether each possibility remains true to your inner compass.",
},
FiSe: {
  pair_key: "FiSe",
  driver: "Fi",
  instrument: "Se",
  analog_label: "the witness",
  gift_category: "Integrity",
  short_description:
    "Personal-values authentication informed by somatic engagement. Doesn't argue the values — performs them, in the moment, in body and presence.",
  healthy_expression:
    "Makes the values visible through how the body meets the moment — refusal, taste, presence, embodied conviction that doesn't require explanation to be felt.",
  distorted_expression:
    "The witnessing stays mute — the values are visible through stance but the witness never names them, and the people around the witness have to read the body for what could have been said.",
  product_safe_sentence:
    "Your Lens has a witness quality: you appear to make conviction visible through action and presence rather than argument — the values lived rather than explained.",
},
```

The expression sentences land on Jung's gift→risk register convention from the existing engine prose: healthy expressions name the gift; distorted expressions name the gift-becoming-risk under stress. The product-safe sentence template *"Your Lens has a [analog] quality: you appear to..."* is locked. Future Mirror prose composes around this template.

---

## Steps

### 1. Extend the `FunctionPairRegister` type in `lib/types.ts`

```ts
export type FunctionPairRegister = {
  pair_key: FunctionPairKey;
  driver: "Ne" | "Ni" | "Se" | "Si" | "Te" | "Ti" | "Fe" | "Fi";
  instrument: "Ne" | "Ni" | "Se" | "Si" | "Te" | "Ti" | "Fe" | "Fi";
  analog_label: string;
  gift_category: GiftCategory;
  short_description: string;
  healthy_expression: string;
  distorted_expression: string;
  product_safe_sentence: string;
};
```

The driver/instrument types should re-use the existing function codename type if one exists in the file (likely `LensFunction` or similar). Adapt to match.

### 2. Replace the `FUNCTION_PAIR_REGISTER` content in `lib/identityEngine.ts`

Replace the v1 16-entry map with the v3 content from the locked-content section above. Each entry now has 8 fields instead of 4. Maintain canonical order: NeTi, NeFi, NiTe, NiFe, SeTi, SeFi, SiTe, SiFe, TeNi, TeSi, TiNe, TiSe, FeNi, FeSi, FiNe, FiSe.

The `pair_key` and `gift_category` fields are unchanged (canonical from CC-038). The `analog_label` becomes the v3 single-word (or simple-compound) label. The `short_description` is refined to carry the specifying weight. The `driver`, `instrument`, `healthy_expression`, `distorted_expression`, `product_safe_sentence` fields are all new.

### 3. Wire the analog into Mirror prose

Locate the Mirror card composition. Likely in `app/components/MirrorCard.tsx` or `app/components/InnerConstitutionPage.tsx` or a `lib/` mirror-prose composer. Search for how the existing strength prose is assembled.

Add a single sentence in the strength section that surfaces the register analog. Use the `product_safe_sentence` directly when the user's `LensStack` has a canonical aux-pair; degrade gracefully (omit the sentence) for non-canonical Lens stacks.

```tsx
const register = getFunctionPairRegister(stack);
{register ? (
  <p className="register-line">{register.product_safe_sentence}</p>
) : null}
```

Position the register line after the existing strength prose (so it reads as elaboration, not replacement). Use the same typography as surrounding strength prose. No new section header.

### 4. Major revision to `docs/canon/function-pair-registers.md`

Rewrite the doc with the following structure:

#### 4a. Opening canon paragraph (locked)

> A Lens pair is not a type. It is a movement. The Driver voice supplies the center of gravity; the Instrument voice supplies the supporting method. The pair describes how the Lens carries the person's values, trust, responsibility, pressure, and growth direction through the world. The model should never say "you are Ni-Te." It should say, "Your Lens has an architect quality," then explain the movement in ordinary language.

#### 4b. Driver / Instrument framing canon

A short section explaining why J/P shorthand is canonically rejected. Use Clarence's framing: INTP is Ti-driven (judging) though MBTI types it P; INTJ is Ni-driven (perceiving) though MBTI types it J. The Driver/Instrument framing avoids the J/P trap.

#### 4c. Mirror-pair asymmetry canon

> Mirror pairs may share the same gift category, but they should not be deduplicated. Ni-Te and Te-Ni may both route through Builder, but Ni-Te begins with the long-range pattern and seeks structure; Te-Ni begins with structure and aims it through the long-range pattern. The same principle applies to all driver/instrument flips. The prose layer must surface the asymmetry through analog labels and `short_description` differences, even when `gift_category` is identical.

#### 4d. Single-word-label canon

> Future register-class labels prefer single-word inhabited identities; the `short_description` carries specificity. Compound labels register as engineered phrases unless the compound names a real distinction the description cannot land. This canon rule applies beyond the Lens pair table — to any analog-class taxonomy the instrument may add later.

#### 4e. The 16 registers — full table

Render the full v3 table with all 8 fields per pair. Format as readable markdown (one entry per section, not a giant table).

#### 4f. Body-map column — DEFERRED note

> The body-map route column proposed during the CC-038-prose workshop (mapping each register to a movement through the 8-card body model — *Heart → Path*, *Lens → Fire*, etc.) is deferred to a successor CC. The deferral is due to a vocabulary inconsistency in the workshop draft: four cells reference "Agency" (in the Te-involved pairs) without that name appearing in the stated 8-card vocabulary (Heart, Listen, Speak, Gravity, Lens, Weather, Fire, Path). Resolution of "Agency" — whether it maps to Path, to Gravity, to a ninth name, or to typos in those four cells — is precondition to landing the body-map column.

#### 4g. CC-038 / CC-038-prose lineage

A two-paragraph lineage note: CC-038 shipped the routing layer with v1-placeholder labels (2026-04-29). CC-038-prose locked v3 labels and the editorial structure (this CC). CC-038-body-map will land the body-map column once Agency is resolved.

### 5. Update `docs/canon/output-engine-rules.md`

Add cross-references to function-pair-registers.md for each of the four canon principles (movement-not-type; driver-instrument; mirror-pair asymmetry; single-word-label). Update the existing CC-038 section to reference v3 labels rather than v1.

### 6. Verification

- `npx tsc --noEmit` exits 0.
- `npm run lint` passes.
- `npm run build` succeeds (modulo the pre-existing /admin issue).
- Existing test suite passes.
- Manual sweep — load a session that lands on each of 4 representative pairs (NeTi, NiFe, SiTe, FiSe) and confirm:
  - The `getFunctionPairRegister` accessor returns the v3 entry.
  - The Mirror card renders the `product_safe_sentence`.
  - The `analog_label`, `healthy_expression`, `distorted_expression` are accessible to downstream prose composers.

### 7. Browser smoke (Jason verifies)

Four sessions tuned to land on different aux-pair registers:

- A session producing NeTi → Mirror prose includes "Your Lens has a prober quality: you appear to..."
- A session producing NiFe → Mirror prose includes "Your Lens has a seer quality..."
- A session producing TeSi → Mirror prose includes "Your Lens has an operator quality..."
- A session producing FiNe → Mirror prose includes "Your Lens has an imaginer quality..."

For each: the register line reads coherently in context with the surrounding strength prose; the typography matches; non-canonical Lens stacks gracefully omit the line.

---

## Acceptance

- `lib/types.ts` extends `FunctionPairRegister` with `driver`, `instrument`, `healthy_expression`, `distorted_expression`, `product_safe_sentence` fields.
- `lib/identityEngine.ts` `FUNCTION_PAIR_REGISTER` map is fully populated with v3 content per the locked-content section above. All 16 entries present; all 8 fields per entry present; v3 analog labels match the locked table.
- The Mirror card composition surfaces `product_safe_sentence` for canonical aux-pair stacks and degrades gracefully otherwise.
- `docs/canon/function-pair-registers.md` is rewritten with all sections per Step 4.
- `docs/canon/output-engine-rules.md` updated with four canon-principle cross-references.
- `git diff --stat` shows changes only in named files.
- `npx tsc --noEmit` exits 0. `npm run lint` passes. `npm run build` succeeds (modulo /admin).
- Manual sweep confirms 4 representative pairs render `product_safe_sentence`.

---

## Out of scope

- **Authoring the body-map column.** Deferred to CC-038-body-map pending Agency resolution.
- **Rewriting `gift_category` routes.** All 16 routes' gift-category field is canonical from CC-038; CC-038-prose changes only the prose / metadata fields.
- **Adding new gift categories or new pairs.** The 16 canonical Jung function-pair stacks are the complete set.
- **Modifying CC-034 fallbacks, CC-036 secondary routes, or CC-029 patterns.** None of these surfaces are touched.
- **Editing `pickGiftCategory` or `categoryHasSupport`.** Routing logic is unchanged from CC-038.
- **Editing existing gift-category prose** (`GIFT_DESCRIPTION`, `GIFT_NOUN_PHRASE`, `GROWTH_EDGE_TEXT`, `BLIND_SPOT_TEXT_VARIANTS`). Aux-pair register prose is additive, not replacement.
- **Adding cross-references between aux-pair register and OCEAN / Drive / Path Work-Love-Give compression.** Each cross-reference is its own follow-on CC (CC-040+).
- **Renaming `dominant`, `auxiliary`, or any LensStack accessor.**
- **Changing the canonical priority order** of routing layers (existing condition-driven → CC-036 secondary → CC-038 aux-pair → CC-034 fallback). All four layers stay in CC-038's ordering.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

Codex equivalent acceptable; substantive sections are tool-agnostic.

## Execution Directive

Single pass. Don't pause for user confirmation. The 16 v3 analog labels are locked; do not substitute. The 48 expression sentences (16 × 3) are locked content; preserve them verbatim. The four canon principles in Step 4 are locked content. Editorial latitude exists only on minor wording polish during code review if a sentence reads obviously off — surface as a question in Report Back rather than silently rewriting.

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
- `lib/identityEngine.ts` `FUNCTION_PAIR_REGISTER` (post-CC-038, look for the v1 placeholder content).
- `lib/types.ts` `FunctionPairRegister` definition (post-CC-038).
- `app/components/MirrorCard.tsx` and `app/components/InnerConstitutionPage.tsx` — locate Mirror prose composition.
- `lib/identityEngine.ts` `pickGiftCategoryForCard` and `pickGiftCategory` (read-only context; do not edit).
- `docs/canon/function-pair-registers.md` (post-CC-038 v1 doc).
- `docs/canon/output-engine-rules.md`.
- `prompts/completed/CC-038-aux-pair-routing-full.md` — context on what shipped before this editorial pass.

## Allowed to Modify

- `lib/identityEngine.ts`
- `lib/types.ts`
- `app/components/MirrorCard.tsx` (or whatever Mirror prose component is canonical — verify with Read first)
- `app/components/InnerConstitutionPage.tsx` (only if the Mirror prose lives there instead)
- `docs/canon/function-pair-registers.md`
- `docs/canon/output-engine-rules.md`

## Report Back

1. **Files modified** with line counts.
2. **Verification results** — tsc, lint, build outputs.
3. **Manual sweep** — 4 representative pair traces showing `product_safe_sentence` rendering.
4. **Mirror-prose integration confirmation** — where the register line was placed; degradation behavior for non-canonical stacks.
5. **Out-of-scope drift caught**.
6. **Browser smoke deferred to Jason**.
7. **Successor recommendations** — confirm CC-038-body-map remains queued pending Agency resolution; cross-references CCs (aux-pair × OCEAN / Drive / Path) remain queued.
8. **Any sentence that read obviously off during code review** — flag as editorial follow-up rather than silently rewriting.

---

## Notes for the executing engineer

- CC-038-prose is *editorial* work landing in code. The 48 expression sentences and 16 analog labels are content, not template scaffolding. Preserve them verbatim except for the explicit editorial-latitude case in the Execution Directive.
- The Mirror card integration is light — one `<p>` tag conditional on `getFunctionPairRegister(stack)` returning a canonical entry. Don't refactor surrounding Mirror prose architecture during this CC.
- Non-canonical Lens stacks (e.g., Si dominant + Ne auxiliary) should NOT crash. The accessor returns `undefined` and the conditional render handles the absence gracefully. Verify this in the manual sweep with at least one non-canonical configuration.
- The body-map column deferral is canon-locked. Do NOT add it to `FunctionPairRegister` even speculatively. CC-038-body-map will add it once the Agency vocabulary question is resolved.
- The `product_safe_sentence` template is canonical: *"Your Lens has a [analog] quality: you appear to [observable behavior]..."* Future surfaces (OCEAN cross-reference prose, tension prose, Mirror prose) all compose around this template form. Don't break the pattern.
- The `healthy_expression` and `distorted_expression` are designed to compose with each other — read healthy first, then distorted, and the gift→risk dynamic should land. If a pair's pair doesn't read coherently, surface as an editorial follow-up rather than silently revising.
- Pre-CC-038-prose saved sessions: re-rendering picks up the new analog labels and Mirror prose automatically. No migration logic needed.
- The four canon principles (movement-not-type; driver-instrument; mirror-pair asymmetry; single-word-label) apply beyond CC-038-prose. Future analog/register taxonomies in this instrument should compose with them. The canon doc is authoritative.
