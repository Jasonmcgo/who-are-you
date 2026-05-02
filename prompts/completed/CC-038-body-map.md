# CC-038-body-map — Body-Map Route Column for Aux-Pair Registers

**Type:** Data extension to `FUNCTION_PAIR_REGISTER`. New `body_map_route` field on each entry. New canonical translation table between user-facing body-map metaphors and code-side `ShapeCardId` values. **No new gift categories. No routing logic changes. No prose authored beyond a 16-entry body-map route table.**
**Goal:** Land Clarence's body-map route column on the 16 aux-pair registers. Each register gains a `body_map_route` field describing the user's cognitive movement through the 8-card body model — *Path → Speak* for Ni-Te, *Heart → Fire* for Fi-Se, etc. The Agency vocabulary inconsistency that blocked this CC is resolved: Agency = Conviction (user-facing: Speak).
**Predecessors:** CC-038 (data layer; shipped 2026-04-29). CC-038-prose (v3 labels + canon principles + Mirror prose; shipped 2026-04-29).
**Successor:** None hard-blocked. Future CCs (CC-040+) can compose body-map routes with OCEAN / Drive / Path Work-Love-Give cross-references.

---

## Why this CC

CC-038-prose deferred the body-map column pending resolution of an "Agency" vocabulary inconsistency in the workshop draft. Clarence's stated user-facing body-map vocabulary listed eight names (Heart / Listen / Speak / Gravity / Lens / Weather / Fire / Path) but the body-map route column referenced *Agency* in four cells (the Te-involved pairs: Ni-Te / Si-Te / Te-Ni / Te-Si). Agency was not in the eight. Workshop with Jason (2026-04-29) resolved the gap: **Agency = Conviction (user-facing: Speak).**

The reasoning: Te is fundamentally about externalizing operational structure through judgment — naming the standard, declaring the operational truth, advocating for the system. The body-position that carries that movement canonically is Conviction — the spine, the standing-for, the plain-speech register. With Agency = Conviction (Speak), all four Te-involved cells resolve without degeneracy:

- Ni-Te (the architect): Path → Speak (vision becomes stance)
- Si-Te (the keeper): Gravity → Speak (continuity becomes stance)
- Te-Ni (the strategist): Speak → Path (stance aimed at long-arc objective)
- Te-Si (the operator): Speak → Gravity (stance rooted in precedent)

This CC ships the resolution: 16 body-map routes added to `FUNCTION_PAIR_REGISTER`, a translation table between user-facing metaphors and `ShapeCardId` codenames committed to canon, and the canon doc's "Body-map column DEFERRED" note removed.

---

## Scope

Files modified:

1. `lib/identityEngine.ts` — add `body_map_route` field to each of the 16 `FUNCTION_PAIR_REGISTER` entries. Body-map routes use code-side `ShapeCardId` codenames (`compass`, `trust`, `conviction`, `gravity`, `lens`, `weather`, `fire`, `path`). The user-facing metaphors (Heart / Listen / Speak / etc.) live in canon docs and prose surfaces, not in the engine field.
2. `lib/types.ts` — extend `FunctionPairRegister` shape with `body_map_route: { from: ShapeCardId; to: ShapeCardId }`.
3. `docs/canon/function-pair-registers.md` — remove the "Body-map column — DEFERRED" section. Add: (a) the user-facing-metaphor-to-ShapeCardId translation table; (b) the resolved-Agency canon paragraph; (c) the full 16-pair body-map route table; (d) the canon rule that engine fields use ShapeCardId codenames while user-facing prose uses the metaphor names.
4. `docs/canon/output-engine-rules.md` — update the CC-038-prose subsection to note CC-038-body-map's addition. Cross-reference `function-pair-registers.md` for the body-map route convention.
5. `docs/canon/shape-framework.md` — append a CC-038-body-map note to the body-metaphor section if one exists; otherwise add a small section documenting the metaphor-to-ShapeCardId translation table.

Nothing else. **No new prose authored** beyond the 16 route entries. **No code paths consume `body_map_route` yet** — this CC ships the data field; future cross-reference CCs read it.

---

## The translation table — locked

The eight user-facing body-map metaphors map to `ShapeCardId` codenames as follows. This table is canonical from CC-038-body-map forward. Engine fields use codename; prose surfaces use metaphor.

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

**Agency** (used in Clarence's workshop draft for Te-involved pairs) → **Conviction (Speak)**. Documented in canon as the resolution to the workshop-draft vocabulary gap.

---

## The 16 body-map routes — locked

Each register gets a `body_map_route` field with `from` and `to` `ShapeCardId` values. User-facing rendering composes `metaphor[from] → metaphor[to]` (e.g., "Path → Lens" not "path → lens"; "Speak → Path" not "conviction → path").

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

**Note on Si-Fe (`Heart → Listen` / `compass / trust`).** This route is the asymmetric one — Si is the driver but the route starts from Heart (compass) rather than Gravity (where Si typically lives). The reading: Si-Fe (the family-tender) holds remembered care as a sacred-values commitment (Heart) and expresses it through relational presence (Listen). The driver's natural body-position (Gravity) is implicit in the *kind* of Heart the family-tender holds (one rooted in continuity), but the active movement is from sacred-care to relational-attention. Documented as a deliberate canon choice; do not "correct" to `gravity / trust`.

---

## Steps

### 1. Extend `FunctionPairRegister` type in `lib/types.ts`

```ts
export type FunctionPairRegister = {
  pair_key: FunctionPairKey;
  driver: LensFunctionVoice;
  instrument: LensFunctionVoice;
  analog_label: string;
  gift_category: GiftCategory;
  short_description: string;
  healthy_expression: string;
  distorted_expression: string;
  product_safe_sentence: string;
  body_map_route: { from: ShapeCardId; to: ShapeCardId };  // CC-038-body-map
};
```

`ShapeCardId` is the existing `lib/types.ts` type (or wherever it canonically lives — locate via `Read` first). Both `from` and `to` must be valid `ShapeCardId` values; the type system enforces correctness at compile time.

### 2. Populate `body_map_route` in each of the 16 `FUNCTION_PAIR_REGISTER` entries

```ts
NeTi: { ...existing fields..., body_map_route: { from: "path", to: "lens" } },
NeFi: { ...existing fields..., body_map_route: { from: "path", to: "compass" } },
NiTe: { ...existing fields..., body_map_route: { from: "path", to: "conviction" } },
NiFe: { ...existing fields..., body_map_route: { from: "path", to: "trust" } },
SeTi: { ...existing fields..., body_map_route: { from: "fire", to: "lens" } },
SeFi: { ...existing fields..., body_map_route: { from: "fire", to: "compass" } },
SiTe: { ...existing fields..., body_map_route: { from: "gravity", to: "conviction" } },
SiFe: { ...existing fields..., body_map_route: { from: "compass", to: "trust" } },
TeNi: { ...existing fields..., body_map_route: { from: "conviction", to: "path" } },
TeSi: { ...existing fields..., body_map_route: { from: "conviction", to: "gravity" } },
TiNe: { ...existing fields..., body_map_route: { from: "lens", to: "path" } },
TiSe: { ...existing fields..., body_map_route: { from: "lens", to: "fire" } },
FeNi: { ...existing fields..., body_map_route: { from: "trust", to: "path" } },
FeSi: { ...existing fields..., body_map_route: { from: "trust", to: "compass" } },
FiNe: { ...existing fields..., body_map_route: { from: "compass", to: "path" } },
FiSe: { ...existing fields..., body_map_route: { from: "compass", to: "fire" } },
```

The 16 entries' other fields (analog_label, gift_category, short_description, etc.) stay unchanged from CC-038-prose.

### 3. Major revision to `docs/canon/function-pair-registers.md`

#### 3a. Remove the "Body-map column — DEFERRED" section

The DEFERRED section that CC-038-prose committed must be deleted in this CC. Replaced with the new content below.

#### 3b. Add the Agency-resolution canon paragraph

> **Agency vocabulary resolution (2026-04-29):** Clarence's workshop draft of the body-map column used "Agency" in four cells (the Te-involved pairs Ni-Te / Si-Te / Te-Ni / Te-Si) without that name appearing in the stated 8-card body-map vocabulary (Heart / Listen / Speak / Gravity / Lens / Weather / Fire / Path). Agency resolves to **Conviction (user-facing: Speak)**. The reasoning: Te externalizes operational structure through stance-taking — naming the standard, declaring the operational truth, advocating for the system. The body-position that canonically carries that movement is Conviction (the spine, the standing-for, the plain-speech register). With Agency = Conviction, all four Te-involved cells resolve without degeneracy.

#### 3c. Add the user-facing metaphor → ShapeCardId translation table

The eight-row table from this prompt. Position immediately after the Agency-resolution paragraph. Add a one-line canon rule: *"Engine fields use the codename column; user-facing prose uses the metaphor column."*

#### 3d. Add the 16-pair body-map route table

Render the full route table with three columns: pair, analog, route (in user-facing metaphor form). Position alongside the existing v3 register table OR in its own section labeled "Body-map routes (CC-038-body-map)". Each row references the pair's existing analog so the route reads as a cognitive movement attached to that register.

#### 3e. Document the Si-Fe asymmetry

Add a paragraph explaining the Si-Fe `Heart → Listen` route as a deliberate canon choice — Si-Fe (the family-tender) starts from the sacred-values dimension of remembered care (Heart) rather than from Gravity (where Si typically lives) because the active movement of the register is from sacred-care to relational-attention, not from continuity to relational-attention. The "Si is the driver" fact is preserved in the analog and short_description; the route describes the cognitive movement, not the dominant function's body-position.

#### 3f. Update the implementation-surface table

If function-pair-registers.md has an implementation-surface table from CC-038-prose, add a row for the new `body_map_route` field referencing `lib/types.ts` and `lib/identityEngine.ts`.

#### 3g. Update the CC lineage section

Append: *"CC-038-body-map (2026-04-29) added the body_map_route field to FUNCTION_PAIR_REGISTER and resolved the Agency vocabulary inconsistency."*

### 4. Update `docs/canon/output-engine-rules.md`

Append a "CC-038-body-map (added 2026-04-29)" subsection to the existing CC-038 content. Document the body-map route convention and the user-facing-metaphor / ShapeCardId discipline. Cross-reference `function-pair-registers.md`.

### 5. Update `docs/canon/shape-framework.md`

If the file has a body-metaphor section enumerating the 8 cards' body-positions, append the user-facing-metaphor-to-ShapeCardId translation table. If the file does not have such a section, add a small new section documenting the convention so the metaphor-to-codename mapping is canonically discoverable from this file as well as from `function-pair-registers.md`.

### 6. Verification

- `npx tsc --noEmit` exits 0.
- `npm run lint` passes.
- `npm run build` succeeds (modulo the pre-existing `/admin` issue).
- Existing test suite passes.
- Manual sweep: for each of the 16 registers, confirm `FUNCTION_PAIR_REGISTER[key].body_map_route` matches the locked table. Specifically check the four Te-involved pairs (Ni-Te / Si-Te / Te-Ni / Te-Si) all use `conviction` in either `from` or `to`.
- Manual sweep: confirm Si-Fe uses `compass` (Heart) as `from`, not `gravity`.
- Confirm the type system rejects an invalid `body_map_route` (e.g., `from: "agency"`) at compile time, since `ShapeCardId` does not include "agency".

### 7. Browser smoke (Jason verifies)

CC-038-body-map ships the *data field*, not user-visible rendering. The body-map route is engine-side metadata that downstream cross-reference CCs (CC-040+) will read. Browser smoke at this stage:

- Mirror prose for canonical aux-pair stacks renders unchanged from CC-038-prose. The body-map route is not surfaced to the user yet.
- No layout regressions on any card.
- No console errors when loading a session with a canonical Lens stack OR a non-canonical stack.

The body-map *user-facing display* (e.g., a small icon or text on Mirror showing "Path → Speak") is **explicitly out of scope** for this CC. That's a follow-on UI CC if Jason decides body-map should be visually surfaced.

---

## Acceptance

- `lib/types.ts` extends `FunctionPairRegister` with `body_map_route: { from: ShapeCardId; to: ShapeCardId }`.
- `lib/identityEngine.ts` `FUNCTION_PAIR_REGISTER` has all 16 entries populated with the locked routes per the table above.
- `docs/canon/function-pair-registers.md` removes the DEFERRED section and adds: Agency-resolution paragraph, translation table, body-map route table, Si-Fe asymmetry paragraph, lineage update.
- `docs/canon/output-engine-rules.md` appends CC-038-body-map subsection.
- `docs/canon/shape-framework.md` carries the translation table.
- `git diff --stat` shows changes only in named files.
- `npx tsc --noEmit` exits 0. `npm run lint` passes. `npm run build` succeeds (modulo `/admin`).
- Manual sweep confirms the 16 routes match the locked table.

---

## Out of scope

- **User-facing rendering of body-map routes.** No UI surfacing in this CC. Future UI CC if Jason wants visible body-map display in Mirror.
- **Cross-reference logic** between body-map routes and OCEAN / Drive / Path output. CC-040+ territory.
- **Renaming the eight `ShapeCardId` codenames to match Clarence's user-facing metaphors.** The codenames stay as-is (lens / compass / conviction / gravity / trust / weather / fire / path); the user-facing metaphors live in canon docs and prose surfaces.
- **Adding a ninth body-map name.** Agency = Conviction; no new card or metaphor.
- **Editing existing register fields** (analog_label, gift_category, short_description, healthy_expression, distorted_expression, product_safe_sentence). All 16 entries' non-body-map fields stay verbatim from CC-038-prose.
- **Polishing the 5 over-length distorted_expression sentences flagged in the CC-038-prose ship report.** That's a separate editorial polish CC.
- **Modifying CC-034 / CC-029 / CC-036 / CC-038 / CC-038-prose** outputs. All shipped behavior preserved.
- **Adding `body_map_route` to non-aux-pair surfaces** (e.g., to gift categories or to ShapeCards directly). The field lives only on `FunctionPairRegister`.
- **Renaming the field** to `body_map_movement` or `register_arc` or any other name. The locked field name is `body_map_route`.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

Codex equivalent acceptable.

## Execution Directive

Single pass. Don't pause for user confirmation. The 16 routes are locked content; do not substitute any `from` or `to` values. The user-facing-metaphor-to-ShapeCardId translation table is canonical; do not add new metaphor names or remove any. Don't edit files outside Allowed-to-Modify.

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
- `lib/identityEngine.ts` `FUNCTION_PAIR_REGISTER` (post-CC-038-prose; verify the 16 entries are present with all 8 fields).
- `lib/types.ts` `FunctionPairRegister` (post-CC-038-prose) and `ShapeCardId` definitions.
- `docs/canon/function-pair-registers.md` (post-CC-038-prose; locate the "Body-map column — DEFERRED" section to remove).
- `docs/canon/output-engine-rules.md` and `docs/canon/shape-framework.md`.
- `prompts/completed/CC-038-prose.md` for context on what shipped before this extension.

## Allowed to Modify

- `lib/identityEngine.ts`
- `lib/types.ts`
- `docs/canon/function-pair-registers.md`
- `docs/canon/output-engine-rules.md`
- `docs/canon/shape-framework.md`

## Report Back

1. **Files modified** with line counts; confirm against Allowed-to-Modify.
2. **Verification results** — tsc, lint, build outputs.
3. **Manual sweep — 16 routes** — table showing the resolved `body_map_route` per pair.
4. **Type-system enforcement check** — confirm a hypothetical `from: "agency"` would fail TypeScript compilation.
5. **Si-Fe route confirmation** — confirm the deliberate `compass / trust` (Heart → Listen) route is not "corrected" to `gravity / trust`.
6. **Out-of-scope drift caught** — anything considered and rejected.
7. **Successor recommendations** — confirm CC-040+ cross-reference CCs (aux-pair × OCEAN, aux-pair × Drive, aux-pair × Path Work-Love-Give compression) remain queued; flag whether body-map rendering in Mirror should be a near-term CC or held until the cross-references inform the surface.

---

## Notes for the executing engineer

- The `body_map_route` field is engine-side metadata. No prose surfaces consume it in CC-038-body-map. Future cross-reference CCs read the field to compose contextual prose that names the cognitive movement.
- The user-facing metaphors (Heart / Listen / Speak / Gravity / Lens / Weather / Fire / Path) live in canon docs and prose surfaces only. The engine field uses `ShapeCardId` codenames. Don't conflate.
- The Agency = Conviction resolution is canonical. Future agents reading the workshop history should encounter the resolution paragraph in `function-pair-registers.md` and not re-derive the question.
- The Si-Fe asymmetry (`compass / trust` rather than the more "expected" `gravity / trust`) is deliberate and documented. If browser smoke later surfaces the route as off, surface as a successor CC; do not silently retag.
- All 16 routes use only existing `ShapeCardId` values. The type system enforces this at compile time. If a `from` or `to` value fails type-check, you've drifted from the locked table.
- Pre-CC-038-body-map saved sessions: the engine field is additive metadata; saved sessions don't need a `body_map_route` in their stored output. Re-rendering picks up the field automatically when the engine is re-run. No migration logic needed.
- The body-map route is intentionally a `{ from, to }` object rather than a single string ("path → lens"). This keeps the data structured (downstream prose composers can reference `from` and `to` independently) and lets user-facing rendering choose its own delimiter (arrow, slash, hyphen, em-dash) without engine-side changes.
