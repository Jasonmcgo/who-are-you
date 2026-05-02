# CC-038 — Aux-Pair Gift-Category Routing (Full, all 16 canonical pairs)

**Type:** New routing layer in `pickGiftCategory` + new `FUNCTION_PAIR_REGISTER` data structure. **No new gift categories. No new prose. No new questions or signals.**
**Goal:** Add gift-category routing keyed on the user's top two cognitive functions (dominant + auxiliary) so the engine can discriminate between cognitive-structure registers that share a dominant function — NeTi (the framework-prober) vs NeFi (the meaning-catalyst), NiTe (the long-arc-architect) vs NiFe (the seer-of-people), and the other six pairs. Sixteen canonical Jung function-pair stacks get a routing entry.
**Predecessors:** CC-034 (Tier 1 fallback fix), CC-029 (Tier 2 patterns), CC-036 (Tier 3 secondary routes). All shipped 2026-04-29.
**Successor:** CC-038-prose (editorial workshop on the 16 register analog labels — placeholder text in this CC iterates in the follow-on); CC-040+ for cross-reference logic between aux-pair register and OCEAN / Drive / Path · Gait outputs.

This CC delivers the *fourth* layer of the cognitive-function-parity program, beyond the original three-tier framing. CC-034 raised the floor (every dominant gets a function-specific category). CC-029 raised the middle (every dominant has a cross-card pattern). CC-036 raised the ceiling on signal-conditioned routes (Si/Se/Ti/Te each got 3 signal-conditioned categories). CC-038 adds **structural** discrimination — the auxiliary function as a routing axis, distinct from compass-signal conditions.

---

## Why this CC

The standing parity program treated each dominant function as the routing key. But Jung function-stack theory holds that the *auxiliary* function is what shapes how the dominant expresses. Two Ne-dominants with different auxiliaries (NeTi vs NeFi) operate as different cognitive registers — the framework-prober vs the meaning-catalyst. The same is true for every dominant: NiTe vs NiFe, SeTi vs SeFi, SiTe vs SiFe, and the four judger-dominant pairs.

Pre-CC-038, the engine routes by dominant + signal conditions. A NeTi user with truth_priority high gets the same gift category as a NeFi user with truth_priority high (because the routing only keys on Ne-dom + truth-condition, not on the Ti-vs-Fi auxiliary). That's a structural discrimination the engine misses today.

Adding aux-pair routing gives the engine sixteen canonical-stack registers to read against, each landing on a gift category that composes with the register's cognitive shape. The discrimination is on cognitive structure (durable trait), distinct from compass-signal conditions (state and values). Both layers cooperate — signal-conditions still win when they match (so CC-036's routes are unchanged), aux-pair fires when no more-specific condition does, and CC-034's function-only fallback stays as the ultimate floor for non-canonical Lens stacks.

This CC is also the architectural foundation for the next set of cross-references the program calls for: aux-pair × OCEAN (CC-037 data), aux-pair × Drive (post-CC-026/CC-033 data), aux-pair × Path Work/Love/Give compression (post-CC-025 partial). Each of those cross-references reads off the `FUNCTION_PAIR_REGISTER` entry the user lands on. CC-038 makes that lookup possible; CC-040+ wires the cross-references.

**Vocabulary point that shapes the architecture.** This is *not* MBTI integration. The engine does not type users (no "you are an ENTP"). The 16 canonical pairs map structurally to MBTI's function-stacks because Jung's function-pair theory is what underlies both — but the engine surfaces the *register analog* (e.g., "the framework-prober") rather than the typological label. The register analog is body-of-work language: a phrase that captures the cognitive shape without invoking a typology.

---

## Scope

Files modified or created:

1. `lib/identityEngine.ts` — add `FUNCTION_PAIR_REGISTER` map; insert 16 aux-pair routes in `pickGiftCategory`; widen `categoryHasSupport` for affected categories; export `getFunctionPairRegister(stack: LensStack)` accessor for downstream prose layers.
2. `lib/types.ts` — add `FunctionPairKey` type (the 16 canonical pairs), `FunctionPairRegister` shape (key, analog_label, gift_category, short_description).
3. **NEW** — `docs/canon/function-pair-registers.md`. Canon doc. Lists all 16 pairs with their v1 analog labels, gift-category routes, and short descriptions. Names the analog labels as v1 placeholders subject to CC-038-prose editorial refinement.
4. `docs/canon/output-engine-rules.md` — add the aux-pair layer to the gift-category routing documentation; document the priority ordering (existing condition-driven → CC-036 secondary → CC-038 aux-pair → CC-034 fallbacks → generic Pattern); name the v1-placeholder status of the analog labels.
5. `docs/canon/temperament-framework.md` — if it enumerates the cognitive-function-to-prose mapping or types of cognitive registers, append the aux-pair register layer; otherwise leave alone.

Nothing else. **No new prose authored beyond the placeholder analog labels and short descriptions.** The 12 existing gift categories' `GIFT_DESCRIPTION`, `GIFT_NOUN_PHRASE`, `GROWTH_EDGE_TEXT`, `BLIND_SPOT_TEXT_VARIANTS` stay verbatim. The Mirror card's existing prose surfaces stay verbatim. Wiring the analog into the rendered Mirror prose is **out of scope** for CC-038 — that's CC-038-prose territory once analog labels are settled.

---

## The 16 canonical Jung function-pair stacks — locked routing

Each canonical Jung stack has a dominant function with two viable auxiliaries (the auxiliary must be opposite-attitude AND opposite-axis from the dominant — perceiver-dominants pair with judging auxiliaries and vice versa; introvert-dominants pair with extravert auxiliaries and vice versa). This produces 8 × 2 = 16 cells.

| # | Pair (dominant + aux) | v1 analog label (placeholder) | Gift category route | Existing CC-034 fallback |
|---|---|---|---|---|
| 1 | NeTi | the framework-prober | Discernment | (Ne→Pattern; aux-pair narrows) |
| 2 | NeFi | the meaning-catalyst | Generativity | (Ne→Pattern; aux-pair narrows) |
| 3 | NiTe | the long-arc-architect | Builder | (Ni→Pattern; aux-pair narrows) |
| 4 | NiFe | the seer-of-people | Meaning | (Ni→Pattern; aux-pair narrows) |
| 5 | SeTi | the surgeon-mind | Precision | (Se→Action; aux-pair narrows) |
| 6 | SeFi | the artist-of-presence | Action | (Se→Action; aux-pair confirms with flavor) |
| 7 | SiTe | the keeper-and-builder | Stewardship | (Si→Stewardship; aux-pair confirms with flavor) |
| 8 | SiFe | the family-tender | Harmony | (Si→Stewardship; aux-pair narrows) |
| 9 | TeNi | the strategic-executive | Builder | (Te→Generativity; aux-pair narrows) |
| 10 | TeSi | the operational-leader | Stewardship | (Te→Generativity; aux-pair narrows) |
| 11 | TiNe | the system-questioner | Discernment | (Ti→Precision; aux-pair narrows) |
| 12 | TiSe | the troubleshooter | Precision | (Ti→Precision; aux-pair confirms with flavor) |
| 13 | FeNi | the pastoral-mind | Meaning | (Fe→Harmony; aux-pair narrows) |
| 14 | FeSi | the cultivator-of-belonging | Harmony | (Fe→Harmony; aux-pair confirms with flavor) |
| 15 | FiNe | the authentic-imaginer | Integrity | (Fi→Integrity; aux-pair confirms with flavor) |
| 16 | FiSe | the values-embodied | Integrity | (Fi→Integrity; aux-pair confirms with flavor) |

**Routing priority** (highest first):

1. Existing condition-driven routes — `pickGiftCategory` lines 1706–1717 (CC-011b / CC-022 / CC-026).
2. CC-036 signal-conditioned secondary routes — Si+truth, Se+justice, Se+creator, Ti+creator, Te+truth.
3. **NEW: CC-038 aux-pair routes** — sixteen `dominant + auxiliary` lookups.
4. CC-034 function-specific fallbacks — Si→Stewardship, Se→Action, Ti→Precision, Te→Generativity, Fi→Integrity, Fe→Harmony.
5. Generic Pattern fallback (legacy line; rarely reached post-CC-034).

This priority ordering preserves all existing behavior. CC-036's signal-conditions still fire when their predicates match (a SiTe user with truth_priority high → Discernment from CC-036, NOT Stewardship from CC-038). Aux-pair fires when no signal-condition has matched. CC-034's fallback fires when neither signal-condition nor canonical aux-pair has matched (e.g., when the user's Lens stack has a non-canonical pair like Si+Ne — possible if Q-T1–T8 detection produces unusual orderings).

**Note on overlapping fallbacks.** Several aux-pair routes land on the same gift category as the corresponding CC-034 fallback (SeFi → Action = Se fallback; SiTe → Stewardship = Si fallback; TiSe → Precision = Ti fallback; FeSi → Harmony = Fe fallback; FiNe and FiSe → Integrity = Fi fallback). These are not redundant — the aux-pair route's value is in (a) attaching the register *analog* to the user's read, which the prose layer can use, and (b) distinguishing canonical Jung-stack users from non-canonical Lens-stack users (only canonical pairs land on these routes; the rest fall through to CC-034). Keep all 16 routes; the analog metadata is the load-bearing part for some pairs.

### Note on the `FUNCTION_PAIR_REGISTER` short descriptions

Each entry in the new map carries a one-paragraph short description capturing the register's cognitive shape. These are also v1 placeholders. Sample structure (locked for shape, not for final wording):

```ts
NeTi: {
  pair_key: "NeTi",
  analog_label: "the framework-prober",
  gift_category: "Discernment",
  short_description:
    "Possibility-generation disciplined by internal-logical structure. Pattern-matches across many frames AND tests each match against a coherent framework — the register where Ne's breadth becomes anomaly-detection by triangulation.",
},
NeFi: {
  pair_key: "NeFi",
  analog_label: "the meaning-catalyst",
  gift_category: "Generativity",
  short_description:
    "Possibility-generation oriented by personal-values authentication. Sees what someone or something could become and offers the invitation in a way that honors the values anchor — the inspirational-catalyst register.",
},
// ... 14 more entries, structured identically.
```

The CC-038-prose follow-on will refine analog labels and short descriptions. CC-038 ships with v1 placeholder content drawn from the architecture work in the chat session that produced this prompt.

---

## Steps

### 1. Add types in `lib/types.ts`

```ts
export type FunctionPairKey =
  | "NeTi" | "NeFi" | "NiTe" | "NiFe"
  | "SeTi" | "SeFi" | "SiTe" | "SiFe"
  | "TeNi" | "TeSi" | "TiNe" | "TiSe"
  | "FeNi" | "FeSi" | "FiNe" | "FiSe";

export type FunctionPairRegister = {
  pair_key: FunctionPairKey;
  analog_label: string;
  gift_category: GiftCategory;
  short_description: string;
};
```

Position adjacent to `LensStack` and `GiftCategory` definitions, matching the file's existing convention.

### 2. Add `FUNCTION_PAIR_REGISTER` map in `lib/identityEngine.ts`

Position the map adjacent to existing function-related maps (`FUNCTION_PHRASE`, `FUNCTION_VOICE`, `FUNCTION_VOICE_SHORT`) around lines 1575–1625. The map has 16 entries — one per canonical Jung pair from the table above. Each entry carries `pair_key`, `analog_label`, `gift_category`, `short_description`.

```ts
// CC-038 — Function-pair register map. Sixteen canonical Jung function-stack
// pairs, each with a v1-placeholder analog label, a gift-category route,
// and a short description capturing the register's cognitive shape. The
// analog_label and short_description fields are placeholders subject to
// editorial refinement in CC-038-prose. The pair_key and gift_category
// fields are canonical and lock with this CC.
//
// Architectural rules:
//   - Aux-pair routing is *cognitive-structure* discrimination, distinct
//     from CC-036's signal-condition discrimination. Both layers cooperate.
//   - Routes fire AFTER existing condition-driven and CC-036 routes, BEFORE
//     CC-034 function-specific fallbacks.
//   - Non-canonical Lens stacks (e.g., Si dominant + Ne auxiliary, possible
//     when Q-T1–T8 detection produces unusual orderings) do not match any
//     entry; they fall through to CC-034 fallbacks.
export const FUNCTION_PAIR_REGISTER: Record<FunctionPairKey, FunctionPairRegister> = {
  NeTi: { pair_key: "NeTi", analog_label: "the framework-prober",       gift_category: "Discernment",  short_description: "Possibility-generation disciplined by internal-logical structure. Pattern-matches across many frames AND tests each match against a coherent framework — the register where Ne's breadth becomes anomaly-detection by triangulation." },
  NeFi: { pair_key: "NeFi", analog_label: "the meaning-catalyst",       gift_category: "Generativity", short_description: "Possibility-generation oriented by personal-values authentication. Sees what someone or something could become and offers the invitation in a way that honors the values anchor." },
  NiTe: { pair_key: "NiTe", analog_label: "the long-arc-architect",     gift_category: "Builder",      short_description: "Depth-of-vision in service of operational-execution. The register that holds the ten-year frame and translates it into the next quarter's structures." },
  NiFe: { pair_key: "NiFe", analog_label: "the seer-of-people",         gift_category: "Meaning",      short_description: "Depth-of-vision in service of relational-meaning. Reads what someone could become and tends the becoming through patient relational presence." },
  SeTi: { pair_key: "SeTi", analog_label: "the surgeon-mind",           gift_category: "Precision",    short_description: "Somatic engagement disciplined by internal-logical structure. The hand that knows exactly which cut to make in the moment because the framework is already internalized." },
  SeFi: { pair_key: "SeFi", analog_label: "the artist-of-presence",     gift_category: "Action",       short_description: "Somatic engagement oriented by personal-values authentication. The performance that is the value — embodiment as expression." },
  SiTe: { pair_key: "SiTe", analog_label: "the keeper-and-builder",     gift_category: "Stewardship",  short_description: "Preservation across time disciplined by operational execution. The register that maintains *and* extends — keeps the institution running while patiently building what it will need next." },
  SiFe: { pair_key: "SiFe", analog_label: "the family-tender",          gift_category: "Harmony",      short_description: "Preservation across time oriented by relational attunement. The register that holds the fabric of who-belongs-to-whom and tends it through small consistent acts." },
  TeNi: { pair_key: "TeNi", analog_label: "the strategic-executive",    gift_category: "Builder",      short_description: "Operational execution informed by depth-of-vision. The register that builds the system the long arc requires, not the system the present demands." },
  TeSi: { pair_key: "TeSi", analog_label: "the operational-leader",     gift_category: "Stewardship",  short_description: "Operational execution informed by preservation-across-time. The register that runs the institution by knowing both what it does and what it has been." },
  TiNe: { pair_key: "TiNe", analog_label: "the system-questioner",      gift_category: "Discernment",  short_description: "Internal-logical structure-building informed by possibility-generation. The register that asks not just whether the system is consistent but which other systems it could have been." },
  TiSe: { pair_key: "TiSe", analog_label: "the troubleshooter",         gift_category: "Precision",    short_description: "Internal-logical structure-building informed by somatic engagement. The register that diagnoses what's actually broken by being inside the broken thing." },
  FeNi: { pair_key: "FeNi", analog_label: "the pastoral-mind",          gift_category: "Meaning",      short_description: "Relational attunement informed by depth-of-vision. The register that holds what the person could become and orchestrates the room toward letting it happen." },
  FeSi: { pair_key: "FeSi", analog_label: "the cultivator-of-belonging", gift_category: "Harmony",     short_description: "Relational attunement informed by preservation-across-time. The register that maintains the connective tissue of community through ritual, presence, and small consistent acts." },
  FiNe: { pair_key: "FiNe", analog_label: "the authentic-imaginer",     gift_category: "Integrity",    short_description: "Personal-values authentication informed by possibility-generation. The register that holds what's true to the self AND what could become true — the values-driven explorer." },
  FiSe: { pair_key: "FiSe", analog_label: "the values-embodied",        gift_category: "Integrity",    short_description: "Personal-values authentication informed by somatic engagement. The register that doesn't argue the values — performs them, in the moment, in body and presence." },
};
```

### 3. Add the `getFunctionPairRegister` accessor

Right after the `FUNCTION_PAIR_REGISTER` map definition:

```ts
export function getFunctionPairRegister(stack: LensStack): FunctionPairRegister | undefined {
  if (!stack.dominant || !stack.auxiliary) return undefined;
  // Capitalize the function names to match FunctionPairKey format.
  const dom = stack.dominant.charAt(0).toUpperCase() + stack.dominant.slice(1);
  const aux = stack.auxiliary.charAt(0).toUpperCase() + stack.auxiliary.slice(1);
  const key = `${dom}${aux}` as FunctionPairKey;
  return FUNCTION_PAIR_REGISTER[key];
}
```

The accessor returns `undefined` for non-canonical Lens stacks (e.g., Si dominant + Ne auxiliary, where the function-pair key doesn't exist in the map). Downstream consumers (Mirror prose, future cross-reference logic) handle `undefined` gracefully.

### 4. Insert the 16 aux-pair routes in `pickGiftCategory`

Position: BETWEEN the CC-036 routes (around lines 1722–1726) and the existing Ne/Ni Pattern baseline (line 1718 in pre-CC-036 numbering; locate post-CC-036 in current code).

```ts
// CC-038 — Aux-pair routing layer. Sixteen canonical Jung function-stack
// pairs each route to a gift category that composes with the register's
// cognitive shape. Routes fire only when no more-specific condition above
// has matched. Non-canonical Lens stacks fall through to CC-034 fallbacks.
const auxPairRegister = getFunctionPairRegister(stack);
if (auxPairRegister) return auxPairRegister.gift_category;
```

Replace the literal lookup if the executing engineer prefers a switch-statement form; the canonical form is the map lookup via `getFunctionPairRegister`. The end result must be: any of the 16 canonical aux-pair stacks resolves to the corresponding entry's `gift_category`.

### 5. Widen `categoryHasSupport` to admit the aux-pair routes

For each category that receives an aux-pair route from a function it doesn't already support, add a clause to `categoryHasSupport`. After CC-038, the support-filter coverage is:

- **Discernment** — supports Ti, Ni, Si (via CC-036), AND now Ne (via NeTi route), AND Ti (via TiNe route — already supported). Add `dom === "ne"` clause.
- **Generativity** — supports Te (via CC-034 fallback), AND now Ne (via NeFi route). Add `dom === "ne"` clause.
- **Builder** — supports Te + creator-agency-or-system-resp (via CC-022/CC-036), Se+creator (CC-036), Ti+creator (CC-036), AND now Ni (via NiTe route) and Te+Si-aux (via TeSi route). Existing Te clauses cover TeNi+TeSi already; add `dom === "ni"` clause for NiTe.
- **Meaning** — supports Ni+faith (via CC-022), AND now Ni (NiFe route — Ni already partially supported, just needs the no-faith case to also pass) AND Fe (FeNi route). Add `dom === "ni"` (broaden) and `dom === "fe"` clauses.
- **Precision** — supports Ti (CC-034 fallback), Te+truth (CC-036), AND now Se (via SeTi route). Add `dom === "se"` clause.
- **Action** — supports Se (CC-034 fallback), Te (existing). Confirms via SeFi route — no widening needed.
- **Stewardship** — supports Si (CC-034 fallback), Si+stability/family or Fe+stability/family (existing), AND now Te (via TeSi route). Add `dom === "te"` clause.
- **Harmony** — supports Fe (CC-034 fallback), Fi+family (existing), AND now Si (via SiFe route). Add `dom === "si"` clause.
- **Integrity** — supports Fi (existing), no widening needed (FiNe + FiSe both Fi-dominant).

Match the post-CC-036 `||` collapse pattern for each widening. Keep existing clauses for documentation; add the function-only fallback clause via `|| dom === "<function>"`.

### 6. Create `docs/canon/function-pair-registers.md`

Full canon doc. Sections:

1. **Why this layer exists** — auxiliary as cognitive-structure discrimination axis; not MBTI typing.
2. **The sixteen registers** — full table with analog labels, gift-category routes, short descriptions. Mark v1-placeholder status.
3. **Routing priority** — order: existing condition-driven → CC-036 secondary → CC-038 aux-pair → CC-034 fallbacks.
4. **Non-canonical Lens stacks** — what happens when a user's Q-T1–T8 detection produces a non-canonical pair (e.g., Si+Ne); fall-through to CC-034.
5. **Vocabulary policy** — analog labels are body-of-work language, NOT MBTI typological labels. Engine never surfaces "ENTP" / "ESFJ" / etc.
6. **Editorial policy** — analog labels and short descriptions are v1 placeholders. CC-038-prose refines them. Code-level routing (gift_category field) is canonical and locked.
7. **Cross-reference futures** — name the queued cross-reference work: aux-pair × OCEAN, aux-pair × Drive, aux-pair × Path Work/Love/Give compression. CC-038 establishes the data structure that those CCs read.

### 7. Update `docs/canon/output-engine-rules.md`

Add a section on the aux-pair routing layer. Document the priority ordering. Cross-reference `docs/canon/function-pair-registers.md`.

### 8. Update `docs/canon/temperament-framework.md` if relevant

Search for any text that enumerates cognitive-function-to-prose mapping or types of cognitive registers. If present, append the aux-pair register layer. If not, leave alone.

### 9. Verification

- `npx tsc --noEmit` exits 0.
- `npm run lint` passes.
- `npm run build` succeeds (note: pre-existing /admin Suspense failure is out of scope).
- Existing test suite passes.
- Manual case sweep: 16 minimal-config Lens stacks (one per canonical pair) with no qualifying signal conditions. Each should route to the locked gift category for its pair.
- Manual case sweep: 6 minimal-config Lens stacks where signal-conditions match (one per CC-036 route). Each should route to the CC-036 category, NOT the aux-pair category — confirming priority ordering.
- Manual case sweep: 1 non-canonical Lens stack (e.g., Si dominant + Ne auxiliary). Should fall through aux-pair (no match in `FUNCTION_PAIR_REGISTER`) and land on CC-034's Si→Stewardship fallback.

### 10. Browser smoke (Jason verifies)

Sixteen fresh sessions are aspirational; a representative sample of 4–6 is sufficient:

- NeTi-stack user → Mirror reads Discernment prose; future prose layer (CC-038-prose) will surface "the framework-prober" register.
- NeFi-stack user → Mirror reads Generativity prose; future surface "the meaning-catalyst."
- NiTe-stack user → Mirror reads Builder prose; future surface "the long-arc-architect."
- SiFe-stack user → Mirror reads Harmony prose; future surface "the family-tender."
- TeSi-stack user → Mirror reads Stewardship prose; future surface "the operational-leader."
- A user with non-canonical Lens stack → Mirror reads the CC-034 fallback prose unchanged from pre-CC-038.

Confirming the pre-CC-038 behavior is unchanged for users with strong signal-conditions matches (CC-036 routes still win) is the highest-value smoke check.

---

## Acceptance

- `lib/types.ts` exports `FunctionPairKey` and `FunctionPairRegister`.
- `lib/identityEngine.ts` exports `FUNCTION_PAIR_REGISTER` (16 entries, structurally complete) and `getFunctionPairRegister(stack)`.
- `pickGiftCategory` contains the aux-pair lookup inserted after CC-036 routes and before CC-034 fallbacks.
- `categoryHasSupport` widened on Discernment, Generativity, Builder, Meaning, Precision, Stewardship, Harmony per Step 5.
- `docs/canon/function-pair-registers.md` exists and documents all 16 pairs.
- `docs/canon/output-engine-rules.md` and (conditionally) `docs/canon/temperament-framework.md` updated.
- `git diff --stat` shows changes only in named files.
- `npx tsc --noEmit` exits 0. `npm run lint` passes. `npm run build` succeeds (modulo /admin).
- Manual case sweep: 16 canonical pairs route correctly; 6 CC-036 conditions still win; 1 non-canonical stack falls through.

---

## Out of scope

If you find yourself doing any of these, stop and flag — they belong elsewhere:

- **Refining the analog labels.** The 16 placeholders are v1; CC-038-prose handles editorial refinement. Don't rewrite labels during CC-038.
- **Refining short_description strings.** Same — v1 placeholders; CC-038-prose handles.
- **Wiring the analog into Mirror card prose.** That's CC-038-prose territory. CC-038 ships the data layer + routing only.
- **Authoring new gift categories.** The set of 12 stays at 12.
- **Authoring new prose for existing gift categories.** All `GIFT_DESCRIPTION`, `GIFT_NOUN_PHRASE`, `GROWTH_EDGE_TEXT`, `BLIND_SPOT_TEXT_VARIANTS` entries unchanged.
- **Modifying CC-036 signal-conditioned routes.** CC-036's 5 routes (Si+truth, Se+justice, Se+creator, Ti+creator, Te+truth) stay verbatim and continue to win priority over aux-pair routes.
- **Modifying CC-034 function-specific fallbacks.** All 6 fallbacks stay; aux-pair routes fire above them.
- **Building cross-reference logic** between aux-pair register and OCEAN / Drive / Path. Each cross-reference is its own follow-on CC.
- **Detecting non-canonical Lens stacks for special handling.** Non-canonical stacks fall through to CC-034 fallbacks; no special-case logic.
- **Renaming functions or LensStack accessors.** `LensStack.dominant` and `LensStack.auxiliary` stay as named.
- **Adding Q-T9 or other new questions to firm up auxiliary detection.** Existing Q-T1–T8 detection is the canonical source.
- **Adjusting `categoryHasSupport` for categories beyond those listed in Step 5.** Only widen what aux-pair routes require.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

For Codex: substitute Codex's permission-bypass mechanism. Substantive sections are tool-agnostic.

## Execution Directive

Single pass. Don't pause for user confirmation. Canon-faithful interpretation on ambiguity. The 16 routing entries' `gift_category` field is canonical; the analog and description fields are v1 placeholders allowed minor wording polish if blatantly off-tone. Don't edit files outside Allowed-to-Modify.

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
- `lib/identityEngine.ts` lines 1575–1812 (function-related maps, `pickGiftCategory`, `categoryHasSupport`) — full read.
- `lib/identityEngine.ts` `LensStack` type definition (search for `type LensStack`).
- `lib/types.ts` — locate where Lens / GiftCategory types live.
- `prompts/completed/CC-034-cognitive-function-prose-fallback-fix.md` — context on fallback layer.
- `prompts/completed/CC-036-secondary-gift-categories.md` — context on CC-036 routing additions and `categoryHasSupport` widening pattern.
- `docs/canon/output-engine-rules.md` — locate gift-category routing documentation.

## Allowed to Modify

- `lib/identityEngine.ts`
- `lib/types.ts`
- `docs/canon/function-pair-registers.md` (new)
- `docs/canon/output-engine-rules.md`
- `docs/canon/temperament-framework.md` (only if it references function-to-prose breadth)

## Report Back

1. **Files modified or created** with line counts; confirm against Allowed-to-Modify.
2. **Verification results** — tsc, lint, build outputs.
3. **Manual case sweep — 16 canonical pairs** — show the routed category for each.
4. **Manual case sweep — 6 CC-036 conditions still winning** — confirm priority preservation.
5. **Manual case sweep — 1 non-canonical stack falling through** — confirm graceful fallback.
6. **Out-of-scope drift caught** — anything considered and rejected.
7. **Browser smoke deferred to Jason**.
8. **Successor recommendation** — confirm CC-038-prose (analog editorial refinement) and CC-040+ (cross-references with OCEAN / Drive / Path) remain queued.
9. **Open analog questions** — if any of the 16 placeholder labels read as obviously wrong or off-tone during code review, surface as an editorial question for Jason rather than silently rewriting.

---

## Notes for the executing engineer

- The 16 canonical Jung function-pair stacks are an architectural fact, not a stylistic choice. Do not add non-canonical pairs (e.g., NiNi, TiTe) to `FUNCTION_PAIR_REGISTER`.
- The `gift_category` field on each register entry is canonical and locks with this CC. Do not substitute different categories during execution.
- Some aux-pair routes land on the same gift category as the CC-034 fallback (SeFi → Action; SiTe → Stewardship; TiSe → Precision; FeSi → Harmony; FiNe + FiSe → Integrity). These look redundant for routing but carry the load-bearing analog metadata. Keep all 16 entries.
- The `categoryHasSupport` widenings use the same `||` collapse pattern as CC-034 / CC-036 — preserve existing clauses for documentation, append the function-only fallback clause.
- Non-canonical Lens stacks (e.g., when Q-T1–T8 detection happens to produce Si+Ne instead of canonical Si+Te or Si+Fe) are a real possibility, not a theoretical edge case. The accessor returning `undefined` is the canonical handling — verify graceful fallback in the manual sweep.
- The capitalization in the `getFunctionPairRegister` accessor matters: `FunctionPairKey` uses `NeTi` not `neti`. The accessor must capitalize the first letter of each function name before concatenating.
- If `LensStack.auxiliary` is sometimes `undefined` (e.g., for users whose Q-T1–T8 answers produce only one strong function), the accessor's `if (!stack.dominant || !stack.auxiliary) return undefined;` guard handles it. Verify `LensStack.auxiliary`'s actual nullability in the type definition before relying on it.
- The 16 placeholder analog labels and short_description strings are best-effort first-pass content from the CC-038 architecture conversation. They may read awkwardly in places. CC-038-prose is the editorial pass that refines them — don't try to perfect them in this CC.
- Pre-CC-038 saved sessions: re-rendering a saved session post-CC-038 picks up the new routing if the engine is re-run. The previous Mirror output may differ from the new one. No migration logic needed.
- The Mirror card's existing prose surfaces (Strength, Growth Edge, Practice, Pattern Note) all consume the routed gift category via existing maps. No edits to those surfaces in CC-038. CC-038-prose handles the analog wiring into Mirror prose.
