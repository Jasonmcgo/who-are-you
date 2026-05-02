# Function-Pair Registers (CC-038 / CC-038-prose)

## Opening canon: A Lens pair is a movement, not a type

> A Lens pair is not a type. It is a movement. The Driver voice supplies the center of gravity; the Instrument voice supplies the supporting method. The pair describes how the Lens carries the person's values, trust, responsibility, pressure, and growth direction through the world. The model should never say *"you are Ni-Te."* It should say *"Your Lens has an architect quality,"* then explain the movement in ordinary language.

This is the operational guardrail that distinguishes the register taxonomy from MBTI typology. The 16 canonical Jung function-pair stacks each map to a register *analog* (e.g., *"the architect"*) plus a `short_description` and three editorial expression fields. The user-facing surface is the analog and the prose; the typological codes (`pair_key: "NiTe"` etc.) stay engineer-facing only.

---

## Driver / Instrument framing canon

The pair has two voices. The **Driver** is the first voice in the pair (NeTi's Ne, NiTe's Ni, TeNi's Te, etc.); the **Instrument** is the second. Driver supplies the center of gravity — the move the user reaches for first; Instrument supplies the supporting method — the discipline that shapes how the driver expresses.

J/P shorthand from MBTI is canonically rejected here because it fights Jung's actual driver structure. Two examples:

- **INTP** is **Ti-driven** (a judging function) though MBTI types it as P (perceiving). The driver is internal-logical structure-building; the perceiving Ne is the instrument.
- **INTJ** is **Ni-driven** (a perceiving function) though MBTI types it as J (judging). The driver is depth-of-vision; the judging Te is the instrument.

The Driver/Instrument framing avoids the J/P trap by naming what's actually steering the pair. Future analog/register taxonomies in this instrument should compose with this framing.

---

## Mirror-pair asymmetry canon

> Mirror pairs may share the same gift category, but they should not be deduplicated. Ni-Te and Te-Ni may both route through Builder, but Ni-Te begins with the long-range pattern and seeks structure; Te-Ni begins with structure and aims it through the long-range pattern. The same principle applies to all driver/instrument flips. The prose layer must surface the asymmetry through analog labels and `short_description` differences, even when `gift_category` is identical.

Three doubled-up gift categories in the v3 set:

- **Builder** ← NiTe (the architect) + TeNi (the strategist)
- **Stewardship** ← SiTe (the keeper) + TeSi (the operator)
- **Integrity** ← FiNe (the imaginer) + FiSe (the witness)

Each pair's analog and `short_description` carry the asymmetry. The architect designs the long arc and looks for structures to carry it; the strategist holds the operational force and aims it at the long arc. Same gift category, opposite direction of movement. Prose layers must read the analog plus the description, not just the gift category.

---

## Single-word-label canon

> Future register-class labels prefer single-word inhabited identities; the `short_description` carries specificity. Compound labels register as engineered phrases unless the compound names a real distinction the description cannot land. This canon rule applies beyond the Lens pair table — to any analog-class taxonomy the instrument may add later.

The v3 labels follow this rule. Twelve are single-word (the prober, the catalyst, the architect, the seer, the surgeon, the artist, the keeper, the strategist, the operator, the questioner, the pastor, the imaginer, the witness). Three retain compound form: *family-tender* and *troubleshooter* (already inhabited; not engineered phrases) and *kinkeeper* (a single noun-compound, anthropologically specific to the FeSi register and not adjective-noun like the v1 *cultivator-of-belonging*).

---

## The 16 registers

Each entry carries 8 fields: `pair_key` + `driver` + `instrument` + `analog_label` + `gift_category` + `short_description` + `healthy_expression` + `distorted_expression` + `product_safe_sentence`. The healthy / distorted expression pair composes as the gift→risk dynamic. The `product_safe_sentence` is the locked Mirror template:

> *"Your Lens has a [analog] quality: you appear to [observable behavior] ..."*

### Perceiver-dominants (Ne / Ni / Se / Si)

#### Ne-Ti — the prober (Discernment)

- **Driver:** Ne (possibility-finder). **Instrument:** Ti (coherence-checker).
- **Short description:** Possibility-generation disciplined by internal-logical structure. Pattern-matches across many frames AND tests each match against a coherent framework — anomaly-detection by triangulation.
- **Healthy:** Generates many possible explanations for what's happening, then disciplines the field by testing each explanation against a coherent logical structure.
- **Distorted:** Endless probing without commitment — possibilities multiply faster than coherence can settle, and the testing register starts disqualifying rather than discriminating.
- **Product-safe:** *"Your Lens has a prober quality: you appear to generate alternative explanations across many frames, then test each one against the same disciplined internal logic."*

#### Ne-Fi — the catalyst (Generativity)

- **Driver:** Ne. **Instrument:** Fi (inner compass).
- **Short description:** Possibility-generation oriented by personal-values authentication. Sees what someone or something could become, then offers the invitation in a way that honors the values anchor.
- **Healthy:** Reads what's becoming possible in another person or situation and frames the invitation in a way that the person can recognize as their own real opportunity.
- **Distorted:** Possibility-naming runs ahead of the relational ground — the catalyst sees what could become true and pushes the invitation before the person is ready to receive it.
- **Product-safe:** *"Your Lens has a catalyst quality: you appear to see what someone or something could become, and to frame the invitation in a way that honors what feels true to them."*

#### Ni-Te — the architect (Builder)

- **Driver:** Ni (pattern-reader). **Instrument:** Te (structurer).
- **Short description:** Depth-of-vision in service of operational execution. Holds the long arc and translates it into the structure the next phase requires.
- **Healthy:** Sees the future shape that's not yet visible to others, then builds the operational architecture that will be needed to carry it when it arrives.
- **Distorted:** The architecture gets ahead of the present — the long-arc vision becomes a constraint on what people can actually do today, and the structure overtakes the situation it was meant to serve.
- **Product-safe:** *"Your Lens has an architect quality: you appear to see the future shape first, then look for the practical structures that could carry it."*

#### Ni-Fe — the seer (Meaning)

- **Driver:** Ni. **Instrument:** Fe (room-reader).
- **Short description:** Depth-of-vision in service of relational-meaning. Reads what someone could become and tends the becoming through patient relational presence.
- **Healthy:** Holds an unhurried sense of who someone is becoming and tends that becoming with the kind of presence that doesn't require the person to see it yet.
- **Distorted:** The seeing turns prescriptive — the register starts holding people to the version of themselves the seer has glimpsed, before the person has had the chance to choose it.
- **Product-safe:** *"Your Lens has a seer quality: you appear to read what someone could become over the long arc and to tend that becoming through patient relational presence."*

#### Se-Ti — the surgeon (Precision)

- **Driver:** Se (present-tense self). **Instrument:** Ti.
- **Short description:** Somatic engagement disciplined by internal-logical structure. The hand that knows which cut to make in the moment because the framework is already internalized.
- **Healthy:** Reads the situation by being inside it, applies a precise intervention learned from internalized framework, and trusts the body to know which move is the right move.
- **Distorted:** The framework hardens into reflex — the precision register starts cutting before the situation has finished revealing itself, and intervention runs ahead of diagnosis.
- **Product-safe:** *"Your Lens has a surgeon quality: you appear to enter the situation directly, read what's actually happening, and act with precision learned from prior framework."*

#### Se-Fi — the artist (Action)

- **Driver:** Se. **Instrument:** Fi.
- **Short description:** Somatic engagement oriented by personal-values authentication. Embodiment as expression — the value made visible through how the moment is met.
- **Healthy:** Discovers what matters through direct contact with the moment and expresses the discovery through how the body shows up — taste, courage, refusal, presence.
- **Distorted:** Expression replaces examination — the values feel known through performance rather than tested against difficulty, and the artist's certainty about what's true outpaces the contact that earned it.
- **Product-safe:** *"Your Lens has an artist quality: you appear to discover and express value through direct contact with the present moment — embodiment as expression."*

#### Si-Te — the keeper (Stewardship)

- **Driver:** Si (precedent-checker). **Instrument:** Te.
- **Short description:** Preservation across time disciplined by operational execution. Maintains the institution AND extends it — turns memory into standards that hold up over years.
- **Healthy:** Holds the long memory of what has actually worked and translates it into the standards, systems, and routines that let the institution continue to work.
- **Distorted:** Preservation becomes precedent-tyranny — what worked before becomes what must work now, and the keeper starts protecting the institution from its own next form.
- **Product-safe:** *"Your Lens has a keeper quality: you appear to preserve what has endured, then turn that memory into standards and systems others can rely on."*

#### Si-Fe — the family-tender (Harmony)

- **Driver:** Si. **Instrument:** Fe.
- **Short description:** Preservation across time oriented by relational attunement. Holds the fabric of who-belongs-to-whom and tends it through small, consistent acts of remembered care.
- **Healthy:** Notices the small ritual acts that hold a community's fabric in place — birthdays, check-ins, the dish someone always brings — and continues them so the belonging continues.
- **Distorted:** The tending becomes silent obligation — the family-tender carries the fabric without being seen carrying it, and resentment starts to grow under the surface of the consistent care.
- **Product-safe:** *"Your Lens has a family-tender quality: you appear to notice and protect the small consistent acts that help a community feel held over time."*

### Judger-dominants (Te / Ti / Fe / Fi)

#### Te-Ni — the strategist (Builder)

- **Driver:** Te. **Instrument:** Ni.
- **Short description:** Operational execution informed by depth-of-vision. Builds the system the long arc requires, not the system the present demands.
- **Healthy:** Reads the long-arc objective and aims the present operational force directly at it — the resources, the structure, and the deadlines all point at the same horizon.
- **Distorted:** The strategy outruns the people executing it — the long-arc objective remains crisp in the strategist's head while the team is asked to carry a plan they can no longer see the reasons for.
- **Product-safe:** *"Your Lens has a strategist quality: you appear to aim operational force toward a long-range objective and to build the system the long arc requires."*

#### Te-Si — the operator (Stewardship)

- **Driver:** Te. **Instrument:** Si.
- **Short description:** Operational execution informed by preservation-across-time. Runs what must keep working through standards, precedent, duty, and operational trust.
- **Healthy:** Keeps the institution running with the eye of someone who knows both what it does today and what it has done before — operations that respect their own history.
- **Distorted:** The operations become ritual — the operator runs the system because the system runs, and what was once stewardship hardens into resistance to any change at all.
- **Product-safe:** *"Your Lens has an operator quality: you appear to run what must keep working through standards, precedent, and operational trust."*

#### Ti-Ne — the questioner (Discernment)

- **Driver:** Ti. **Instrument:** Ne.
- **Short description:** Internal-logical structure-building informed by possibility-generation. Tests systems by imagining alternatives — finds truth by asking what else could explain the pattern.
- **Healthy:** Holds the system being claimed and tests it against the systems that could have been claimed instead — coherence earned by surviving real alternatives.
- **Distorted:** The questioning becomes solvent — every system gets tested against alternatives until none of them survive, and the questioner ends up holding nothing because everything could have been otherwise.
- **Product-safe:** *"Your Lens has a questioner quality: you appear to test every system by imagining alternatives — finding truth by asking what else could explain the pattern."*

#### Ti-Se — the troubleshooter (Precision)

- **Driver:** Ti. **Instrument:** Se.
- **Short description:** Internal-logical structure-building informed by somatic engagement. Diagnoses by entering the broken thing — precision earned from logic under direct contact.
- **Healthy:** Enters the system that's not working, applies a logical map to what's actually present, and locates the failure where the abstract framework meets the concrete situation.
- **Distorted:** Diagnosis without resolution — the troubleshooter can name what's broken with precision but the contact-based mode resists the longer-arc work of building what would actually replace it.
- **Product-safe:** *"Your Lens has a troubleshooter quality: you appear to diagnose by entering the broken thing — precision learned from logic in direct contact with the failure."*

#### Fe-Ni — the pastor (Meaning)

- **Driver:** Fe. **Instrument:** Ni.
- **Short description:** Relational attunement informed by depth-of-vision. Holds what the person could become and orchestrates the room toward letting that becoming happen.
- **Healthy:** Reads the room with an unhurried sense of who each person is becoming, and arranges the conditions — attention, timing, witness — so that the becoming has room.
- **Distorted:** The pastoral register starts moving people — the seeing of what could be becomes a quiet pressure for it to be, and the orchestration crosses into authoring lives that aren't the pastor's to author.
- **Product-safe:** *"Your Lens has a pastor quality: you appear to read the room through a sense of who people could become, and to arrange the conditions for that becoming to have room."*

#### Fe-Si — the kinkeeper (Harmony)

- **Driver:** Fe. **Instrument:** Si.
- **Short description:** Relational attunement informed by preservation-across-time. Maintains the connective tissue of community through ritual, presence, and small consistent acts.
- **Healthy:** Holds the network of who's connected to whom and tends the connections through ritual and small consistent presence — the work that keeps a community a community.
- **Distorted:** The kinkeeping becomes the only role — the kinkeeper holds the community's threads but loses the parts of self that don't serve the threading, and resentment grows where individuation should have.
- **Product-safe:** *"Your Lens has a kinkeeper quality: you appear to maintain the connective tissue of community through ritual, presence, and small consistent acts of relational care."*

#### Fi-Ne — the imaginer (Integrity)

- **Driver:** Fi. **Instrument:** Ne.
- **Short description:** Personal-values authentication informed by possibility-generation. Holds what's true to the self AND what could become true — the values-driven explorer.
- **Healthy:** Tests possibilities against the inner compass first — what's worth imagining is what could become true while remaining true to the values the self is anchored in.
- **Distorted:** The imagining stays inward — the values-driven explorer never leaves the conditional mode, and the possibilities accumulate without being made real because none of them is fully tested against the world.
- **Product-safe:** *"Your Lens has an imaginer quality: you appear to explore what could be while testing whether each possibility remains true to your inner compass."*

#### Fi-Se — the witness (Integrity)

- **Driver:** Fi. **Instrument:** Se.
- **Short description:** Personal-values authentication informed by somatic engagement. Doesn't argue the values — performs them, in the moment, in body and presence.
- **Healthy:** Makes the values visible through how the body meets the moment — refusal, taste, presence, embodied conviction that doesn't require explanation to be felt.
- **Distorted:** The witnessing stays mute — the values are visible through stance but the witness never names them, and the people around the witness have to read the body for what could have been said.
- **Product-safe:** *"Your Lens has a witness quality: you appear to make conviction visible through action and presence rather than argument — the values lived rather than explained."*

---

## Routing priority

The aux-pair routing layer sits inside `pickGiftCategory`'s priority ladder. The order is:

1. **Existing condition-driven routes** (CC-011b / CC-022 / CC-026).
2. **CC-036 signal-conditioned secondary routes** — Si+truth, Se+justice, Se+creator, Ti+creator, Te+truth.
3. **CC-038 aux-pair routes** — sixteen `dominant + auxiliary` lookups via `getFunctionPairRegister(stack)`.
4. **Ne / Ni → Pattern baseline** (existing) — non-canonical Ne or Ni stacks fall through here.
5. **Te aspiration → Generativity** (existing CC-022 route).
6. **CC-034 function-specific fallbacks** — Si → Stewardship, Se → Action, Ti → Precision, Te → Generativity, Fi → Integrity, Fe → Harmony.
7. **Generic Pattern fallback** — legacy line, rarely reached.

CC-036's signal-conditions still win when their predicates match (a SiTe user with truth_priority high routes via CC-036 to Discernment, NOT via CC-038 to Stewardship). Aux-pair fires only when no signal-condition has matched. CC-034's fallback fires when neither signal-condition nor canonical aux-pair has matched (e.g., when the user's Lens stack has a non-canonical pair like Si + Ne).

### Note on overlapping fallbacks

Six aux-pair routes land on the same gift category as the corresponding CC-034 fallback (SeFi → Action, SiTe → Stewardship, TiSe → Precision, FeSi → Harmony, FiNe → Integrity, FiSe → Integrity). These look redundant for routing alone, but they carry the load-bearing **analog metadata** — the prose layer reads `getFunctionPairRegister(stack)` separately to attach the register analog to the user's read. A SeFi user gets *"the artist"* with the artist's healthy/distorted/product-safe expressions; SiTe gets *"the keeper"* with its own. Without the aux-pair entries, those users would land on the function-specific fallback prose with no register-specific elaboration. All 16 entries stay; the analog is the load-bearing part for the overlapping routes.

---

## Non-canonical Lens stacks

Q-T1–T8 detection produces a `LensStack` with a `dominant` and an `auxiliary`. Most users land on one of the 16 canonical pairs. Edge cases:

- **Same-attitude auxiliary** (e.g., Ni + Ti — both introvert).
- **Same-axis auxiliary** (e.g., Si + Se — both perceiving).
- **Detection ties** producing degenerate orderings.

`getFunctionPairRegister` returns `undefined` for any stack whose `dominant + auxiliary` concatenation isn't a `FunctionPairKey`. `pickGiftCategory` falls through to the Ne/Ni baseline → Te aspiration → CC-034 fallbacks. The user lands on a function-specific category; only the analog metadata is missing. Mirror prose's `product_safe_sentence` line gracefully omits when the accessor returns `undefined`. No special-case logic.

---

## Vocabulary policy

Analog labels are body-of-work language. The engine never surfaces the typological label (no "you are an ENTP" / "you are an INTJ"). The 16 canonical pairs map structurally to MBTI's function-stacks because Jung's function-pair theory underlies both — but the user-facing surface is the register analog (e.g., *"the architect"*).

The framework codenames `pair_key: "NeTi"` and the type-level `FunctionPairKey` and `LensFunctionVoice` stay verbatim at the engineer-facing level. They are NOT user-facing.

---

## Editorial policy

Post-CC-038-prose, all 16 analog labels and 48 expression sentences (16 × 3) are **canonically locked**. Future iterations require a new editorial CC, not silent rewrites. The locked content lives in `lib/identityEngine.ts § FUNCTION_PAIR_REGISTER` and is reproduced verbatim in this canon doc above.

The `product_safe_sentence` template is canonical:

> *"Your Lens has a [analog] quality: you appear to [observable behavior] ..."*

Future surfaces (OCEAN cross-reference prose, tension prose, Mirror prose extensions) compose around this template form. Don't break the pattern.

---

## Body-map routes (CC-038-body-map, added 2026-04-29)

Each register carries a `body_map_route` field describing the user's cognitive movement through the 8-card body model — *Path → Speak* for Ni-Te (the architect), *Heart → Fire* for Fi-Se (the witness), and so on. The route is engine-side metadata; downstream cross-reference CCs (CC-040+) compose user-facing prose from it. The body-map field shipped in CC-038-body-map; CC-038 and CC-038-prose left it deferred pending the Agency vocabulary resolution below.

### Agency vocabulary resolution (2026-04-29)

Clarence's workshop draft of the body-map column used "Agency" in four cells (the Te-involved pairs Ni-Te / Si-Te / Te-Ni / Te-Si) without that name appearing in the stated 8-card body-map vocabulary (Heart / Listen / Speak / Gravity / Lens / Weather / Fire / Path). Agency resolves to **Conviction (user-facing: Speak)**.

Reasoning: Te externalizes operational structure through stance-taking — naming the standard, declaring the operational truth, advocating for the system. The body-position that canonically carries that movement is Conviction (the spine, the standing-for, the plain-speech register). With Agency = Conviction, all four Te-involved cells resolve without degeneracy:

- Ni-Te (the architect): Path → Speak (vision becomes stance)
- Si-Te (the keeper): Gravity → Speak (continuity becomes stance)
- Te-Ni (the strategist): Speak → Path (stance aimed at long-arc objective)
- Te-Si (the operator): Speak → Gravity (stance rooted in precedent)

### User-facing metaphor → ShapeCardId translation

The eight user-facing body-map metaphors map to `ShapeCardId` codenames. **Engine fields use the codename column; user-facing prose uses the metaphor column.**

| User-facing metaphor | `ShapeCardId` codename |
|---|---|
| Heart | compass |
| Listen | trust |
| Speak | conviction |
| Gravity | gravity |
| Lens | lens |
| Weather | weather |
| Fire | fire |
| Path | path |

The body-map vocabulary (Heart / Listen / Speak / etc.) is a third register, distinct from both `ShapeCardId` codenames (the canonical engine identifiers) and the body-analogy names from `shape-framework.md` § Body analogy (Eyes / Heart / Voice / Spine / Ears / Nervous system / Immune response / Gait). The body-map metaphor names are tuned for the cognitive-movement reading — verbs (Listen, Speak) and contextual noun-phrases (Heart, Gravity) compose better in `metaphor[from] → metaphor[to]` arrows than the body-part names would.

### The 16 routes

| Pair | Analog | Body-map route (user-facing) | Code-side `from / to` |
|---|---|---|---|
| Ne-Ti | the prober | Path → Lens | `path / lens` |
| Ne-Fi | the catalyst | Path → Heart | `path / compass` |
| Ni-Te | the architect | Path → Speak | `path / conviction` |
| Ni-Fe | the seer | Path → Listen | `path / trust` |
| Se-Ti | the surgeon | Fire → Lens | `fire / lens` |
| Se-Fi | the artist | Fire → Heart | `fire / compass` |
| Si-Te | the keeper | Gravity → Speak | `gravity / conviction` |
| Si-Fe | the family-tender | Heart → Listen | `compass / trust` |
| Te-Ni | the strategist | Speak → Path | `conviction / path` |
| Te-Si | the operator | Speak → Gravity | `conviction / gravity` |
| Ti-Ne | the questioner | Lens → Path | `lens / path` |
| Ti-Se | the troubleshooter | Lens → Fire | `lens / fire` |
| Fe-Ni | the pastor | Listen → Path | `trust / path` |
| Fe-Si | the kinkeeper | Listen → Heart | `trust / compass` |
| Fi-Ne | the imaginer | Heart → Path | `compass / path` |
| Fi-Se | the witness | Heart → Fire | `compass / fire` |

### Si-Fe asymmetry note

The Si-Fe route is the asymmetric one. Si is the driver, but the route starts from **Heart (compass)** rather than **Gravity** (where Si typically lives). The reading: Si-Fe (the family-tender) holds remembered care as a sacred-values commitment (Heart) and expresses it through relational presence (Listen). The driver's natural body-position (Gravity) is implicit in the *kind* of Heart the family-tender holds — a Heart rooted in continuity — but the active movement is from sacred-care to relational-attention, not from continuity to relational-attention.

The "Si is the driver" fact is preserved in the analog (*the family-tender*) and the `short_description`. The route describes the cognitive movement, not the dominant function's body-position. This is a deliberate canon choice; do not "correct" to `gravity / trust`. If browser smoke later surfaces the route as off, surface as a successor CC.

### Field discipline

- `body_map_route.from` and `body_map_route.to` use `ShapeCardId` codenames — `path`, `lens`, `compass`, `conviction`, `gravity`, `trust`, `fire`, `weather`. The TypeScript type system enforces correctness at compile time; an invalid value (e.g., `"agency"`) fails to compile.
- The route is intentionally a `{ from, to }` object rather than a single string. This keeps the data structured (downstream prose composers can reference `from` and `to` independently) and lets user-facing rendering choose its own delimiter (arrow, slash, hyphen, em-dash) without engine-side changes.
- No code path consumes `body_map_route` yet. CC-040+ cross-reference CCs are the natural consumers.

---

## Cross-reference futures

CC-038's `FUNCTION_PAIR_REGISTER` is the data structure that future cross-reference work reads from. Queued follow-ons:

- **Aux-pair × OCEAN** (CC-040+). Reads the register entry alongside the user's OCEAN distribution (CC-037) to generate cross-cutting prose. E.g., NeTi + high-O → "framework-prober + open-to-revision posture" — cognitive structure reinforces disposition.
- **Aux-pair × Drive** (CC-040+). Reads the aux-pair register alongside the Drive distribution (CC-026 / CC-033). E.g., NiTe + cost-bucket-dominant → "architect + ambition-driven."
- **Aux-pair × Path Work/Love/Give compression** (CC-040+). Reads the aux-pair analog inside the Path narrative subsections to register-tune the existing prose templates (CC-025's Love-compression is the template surface).
- **Body-map route × cross-reference prose** (CC-040+). Now that `body_map_route` lives on each register, future cross-reference CCs can compose prose like *"Your architect movement (Path → Speak) carries your high-O disposition into stance-taking on long-arc objectives"* — naming the cognitive movement alongside OCEAN / Drive readings.
- **Body-map UI surfacing** — optional follow-on if Jason wants visible body-map display in Mirror. Not hard-blocked.

Each cross-reference is its own follow-on CC.

---

## CC-038 / CC-038-prose lineage

**CC-038 (shipped 2026-04-29).** Routing layer landed. Sixteen canonical Jung function-pair stacks each got a route in `pickGiftCategory`, a v1-placeholder analog label (compound forms like *the framework-prober*, *the long-arc-architect*), and a `short_description`. The data spine compiled and the per-card support filter widened on Discernment / Generativity / Builder / Meaning / Precision / Stewardship / Harmony.

**CC-038-prose (this CC, 2026-04-29).** Editorial pass. Replaced v1 placeholder labels with v3 locked single-word identities (twelve simplifications, four compounds retained). Added Driver/Instrument metadata. Added three editorial expression fields per pair (`healthy_expression`, `distorted_expression`, `product_safe_sentence`). Locked four canon principles (movement-not-type; driver-instrument; mirror-pair asymmetry; single-word-label). Wired the register analog into Mirror prose via the `product_safe_sentence` template.

**CC-038-body-map (shipped 2026-04-29).** Added the `body_map_route: { from: ShapeCardId; to: ShapeCardId }` field to `FunctionPairRegister`. Populated all 16 entries with the locked routes. Resolved the Agency vocabulary inconsistency: Agency = Conviction (user-facing: Speak). Documented the user-facing-metaphor → ShapeCardId translation table and the Si-Fe asymmetry as canon. Moved `ShapeCardId` from `lib/identityEngine.ts` to `lib/types.ts` so `FunctionPairRegister` can reference it without a circular type-import edge; legacy import path preserved via re-export from identityEngine.

---

## Implementation surfaces

| Canonical rule | Code-level surface |
|---|---|
| 16 pair_keys + LensFunctionVoice | `lib/types.ts` (`FunctionPairKey`, `FunctionPairRegister`, `LensFunctionVoice`) |
| Register map (16 entries × 9 fields post-CC-038-body-map) | `lib/identityEngine.ts § FUNCTION_PAIR_REGISTER` |
| `ShapeCardId` definition | `lib/types.ts` (re-exported from `lib/identityEngine.ts` for legacy import paths) |
| `body_map_route` field | `lib/types.ts § FunctionPairRegister`; populated per-entry in `lib/identityEngine.ts § FUNCTION_PAIR_REGISTER` |
| Body-map metaphor → codename translation | `docs/canon/function-pair-registers.md § User-facing metaphor → ShapeCardId translation` (canonical); engine fields use codename, prose surfaces use metaphor |
| LensStack → register lookup | `lib/identityEngine.ts § getFunctionPairRegister` |
| Routing layer | `lib/identityEngine.ts § pickGiftCategory` (between CC-036 routes and Ne/Ni baseline) |
| Per-card support filter | `lib/identityEngine.ts § categoryHasSupport` (widenings on Discernment / Generativity / Builder / Meaning / Precision / Stewardship / Harmony) |
| Mirror prose surface | `app/components/MirrorSection.tsx` (product_safe_sentence rendered after Top 3 Gifts via getFunctionPairRegister; graceful fallback for non-canonical stacks) |
