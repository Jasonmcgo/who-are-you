# CC-029 — Pattern Catalog Expansion (Tier 2: Middle)

**Type:** Five new cross-card patterns leveraging Si / Se / Ti / Fi / Fe. **No new questions, no new signals, no new gift categories. Pure pattern-engine work.**
**Goal:** Bring cross-card pattern coverage for sensor-dominant and feeler-dominant users up to roughly Ni's level (4 patterns). Adds pattern-level cross-card insight where today the pattern engine fires nothing for Si / Se / Ti / Fi / Fe dominants.
**Predecessors:** CC-034 (Tier 1: fallback fix). Should ship after CC-034 so the floor is set first; not strictly hard-blocked.
**Successor:** CC-036 (Tier 3: secondary gift categories per function).

This is **Tier 2** of the cognitive-function-parity program. CC-034 raised the floor; CC-029 raises the middle by giving each underserved function its own cross-card pattern.

---

## Why this CC

Of 12 cross-card patterns currently in `lib/identityEngine.ts:CROSS_CARD_PATTERNS`, only 6 explicitly check dominant-function conditions, and all 6 check Ni or Ne (with one Te auxiliary check on `builder_vs_maintenance`). The other 5 cognitive functions — Si, Se, Ti, Fi, Fe — fire as Lens signals from Q-T1–T8 but feed no pattern. Sensor-dominant and feeler-dominant users get a Lens stack reading and pattern silence on the rest of their report.

Five candidate patterns have been queued in project memory since CC-024 (`project_pattern_catalog_function_bias.md`). Each composes a dominant function with an existing signal in a way that reads as a real cross-card observation, not a function description:

1. **Si + chaos_exposure formation** → "builds tradition because tradition wasn't given to them"
2. **Se + reactive_operator agency** → "alive in crisis but struggles with sustained planning"
3. **Ti + holds_internal_conviction + low Te exposure** → "closed reasoning chamber — frameworks rarely tested against external proof"
4. **Fi + high_conviction_under_risk** → "willing to bear cost only for personally-authentic reasons"
5. **Fe + adapts_under_social_pressure** → "social attunement turning into yielded conviction"

All five use signals that already fire in v0/v1. Zero new questions, zero new signals.

---

## Scope

Files modified:

1. `lib/identityEngine.ts` — append 5 new pattern entries to `CROSS_CARD_PATTERNS`. Each entry: `pattern_id`, `name`, `description`, `applicable_card`, `detection`, `prose`. Mirror the structure of existing patterns at lines 3719–3937.
2. `docs/canon/cross-card-patterns.md` — document the 5 new patterns (id, name, condition, applicable card, prose intent).
3. `docs/canon/temperament-framework.md` — if it enumerates which functions feed patterns, update; otherwise leave alone.

Nothing else.

---

## The five patterns — locked

### 1. `si_tradition_built_from_chaos`

- **Dominant function:** Si
- **Co-condition:** `chaos_exposure` signal fires (from Q-F2 "Uncertain or chaotic" childhood environment).
- **Applicable card:** `weather` (formation-and-load card; most relevant home for chaos-formation pattern).
- **Detection:** `stack.dominant === "si" && hasSignal(signals, "chaos_exposure")`.
- **Prose intent:** Si's preservation register, when paired with formation in chaos, reads as actively *building* the tradition the user didn't inherit. Not nostalgia — construction. The user becomes the keeper because no one kept it for them.
- **Prose template:**
  > "Your sensing register doesn't read as nostalgia for what was — it reads as construction of what wasn't given. ${nameOrYour(demographics)} formation in uncertain ground tends to produce people who build the tradition they didn't inherit, hour by hour, choice by choice. The continuity others took for granted is something you make."

### 2. `se_crisis_alive_planning_strain`

- **Dominant function:** Se
- **Co-condition:** `reactive_operator` agency pattern (the `agency.current === "reactive"` shape).
- **Applicable card:** `path` (agency / aspiration / sustained-direction card).
- **Detection:** `stack.dominant === "se" && agency.current === "reactive"`.
- **Prose intent:** Se's somatic-engagement strength turns into a planning gap when sustained over a long arc. The pattern names the gift-becoming-risk dynamic without judging the reactive mode.
- **Prose template:**
  > "${capitalize(nameOrYour(demographics))} sensing register is most alive in the present — engaged with what's actually here, responsive to what changes. The same register that makes ${getUserName(demographics) ? "you" : "you"} effective in crisis can struggle with the long arc, where the gift of immediacy doesn't carry. The growth move isn't to dampen the immediacy. It's to choose one long-arc commitment and protect it on a different rhythm."

### 3. `ti_closed_reasoning_chamber`

- **Dominant function:** Ti
- **Co-conditions:** `holds_internal_conviction` signal AND Te is low in the Lens stack (not in top 2).
- **Applicable card:** `conviction`
- **Detection:** `stack.dominant === "ti" && hasSignal(signals, "holds_internal_conviction") && !stack.top2.includes("te")`.
- **Prose intent:** Ti's framework-building can become a closed chamber when Te (external proof, system-level testing) is low. The user's reasoning is sharp but rarely stress-tested against the world. Names the risk register without implying the framework is wrong.
- **Prose template:**
  > "${capitalize(nameOrYour(demographics))} reasoning is internally consistent and well-formed — the frameworks you hold are real frameworks, not slogans. The risk in this configuration is testing those frameworks mostly against your own internal coherence rather than against external proof. The growth move is exposing one held position to the discipline of someone who'd disagree with it for reasons you respect."

### 4. `fi_personally_authentic_only`

- **Dominant function:** Fi
- **Co-condition:** `high_conviction_under_risk` signal fires (from Q-P2 "Accept the risk" answer).
- **Applicable card:** `fire` (cost-bearing / conviction-under-cost card).
- **Detection:** `stack.dominant === "fi" && hasSignal(signals, "high_conviction_under_risk")`.
- **Prose intent:** Fi's authenticity-driven cost-bearing is a strength when the conviction is the user's own. The pattern surfaces the boundary: group-shared belief without personal authentication tends not to trigger the same cost-bearing — which is honest, but worth seeing.
- **Prose template:**
  > "When ${nameOrYour(demographics)} conviction is personally authentic — when ${getUserName(demographics) ? "you" : "you've"} weighed it and made it ${getUserName(demographics) ? "your" : "your"} own — ${getUserName(demographics) ? "you" : "you"} will bear cost for it. The same register reads more thinly when the belief is shared by ${getUserName(demographics) ? "your" : "your"} group but hasn't been weighed personally. The growth move is naming this distinction out loud — both to ${getUserName(demographics) ? "yourself" : "yourself"} and to the people who count on ${getUserName(demographics) ? "you" : "you"}."

### 5. `fe_attunement_to_yielded_conviction`

- **Dominant function:** Fe
- **Co-condition:** `adapts_under_social_pressure` signal fires (from Q-P1 "Stay silent" or "Soften it").
- **Applicable card:** `pressure` (note: `pressure` is the card_id; the `applicable_card` field uses the ShapeCardId equivalent — verify by reading `lib/cardAssets.ts:SURVEY_CARD_TO_SHAPE_CARD`).
- **Detection:** `stack.dominant === "fe" && hasSignal(signals, "adapts_under_social_pressure")`.
- **Prose intent:** Fe's relational attunement is a real gift; the same register can become yielding under social pressure. The pattern names the gift→risk gradient without pathologizing the attunement.
- **Prose template:**
  > "${capitalize(nameOrYour(demographics))} attunement to others is real — ${getUserName(demographics) ? "you" : "you"} read what the moment is asking and respond to what's needed. The same register, under social pressure, can yield more than ${getUserName(demographics) ? "you" : "you"} intend. The gift and the risk are the same instrument; the question is whether ${getUserName(demographics) ? "you're" : "you're"} attending to what others need or attending to what ${getUserName(demographics) ? "you" : "you"} need to keep ${getUserName(demographics) ? "your" : "your"} place with them."

---

## Steps

### 1. Locate the `CROSS_CARD_PATTERNS` array in `lib/identityEngine.ts`

Around line 3718–3937. Read the existing 12 patterns first to internalize the structure (`pattern_id`, `name`, `description`, `applicable_card`, `detection` signature, `prose` signature, `getUserName` / `nameOrYour` / `capitalize` helpers).

### 2. Verify helper availability

Confirm the following helpers are in scope at the bottom of the file (where `CROSS_CARD_PATTERNS` lives): `getUserName`, `nameOrYour`, `capitalize`, `hasSignal`, `compassRanksTop`, `gravityRanksTop`. They should be — existing patterns use them. If `hasSignal` doesn't exist, look for the equivalent (likely a method on the `signals` array or a free function imported from elsewhere).

### 3. Verify `stack` and `agency` access patterns

Confirm the pattern detection signature passes `stack: LensStack`, `agency: AgencyPattern`, and `topCompass`/`topGravity` correctly. Existing patterns may not use `stack.top2` directly — check whether `LensStack` exposes `top2` or whether the executing engineer needs to derive it (e.g., `[stack.dominant, stack.auxiliary].includes("te")`). Prefer the existing accessor.

### 4. Append the five patterns to `CROSS_CARD_PATTERNS`

Insert after the existing pattern 12, in the order listed above (Si → Se → Ti → Fi → Fe). Each entry follows the existing template:

```ts
// CC-029 — pattern N: <description>
{
  pattern_id: "<id>",
  name: "<human-readable name>",
  description: "<one-line condition + intent>",
  applicable_card: "<card>",
  detection: (signals, topCompass, topGravity, stack, agency, weather, fire) =>
    <condition>,
  prose: (signals, topCompass, topGravity, stack, demographics) => {
    <prose template per pattern above>
  },
},
```

The exact `detection` and `prose` parameter signatures must match what existing patterns use. Read patterns 1–12 and mirror.

### 5. Update `docs/canon/cross-card-patterns.md`

Append a CC-029 section documenting the 5 new patterns: id, name, condition shorthand, applicable card, and prose intent (one sentence each). The full prose lives in code; the canon doc captures intent.

### 6. Update `docs/canon/temperament-framework.md`

Search for any text claiming "only Ne/Ni/Te feed cross-card patterns" or similar. Update the count to reflect post-CC-029 coverage (Si/Se/Ti/Fi/Fe each get one pattern). If no such claim exists, leave alone.

### 7. Verification

- `npx tsc --noEmit` exits 0.
- `npm run lint` passes.
- `npm run build` succeeds.
- Existing test suite passes.
- Manual case sweep: write down 5 minimal-config user states (one per new pattern) where the pattern's detection should fire. Trace through `CROSS_CARD_PATTERNS` and confirm each pattern fires exactly when expected. Confirm none of the 5 new patterns fire for users who shouldn't trigger them (e.g., a Ti user without `holds_internal_conviction` should not trigger pattern 3).

### 8. Browser smoke (Jason verifies)

Run 5 sessions, each tuned to a different new pattern's condition:

- Si-dominant + chaotic-childhood answer → Weather card shows the tradition-from-chaos pattern.
- Se-dominant + reactive-operator agency → Path card shows the crisis-alive pattern.
- Ti-dominant + Q-P2 "Hide it from work" + low Te → Conviction card shows the closed-chamber pattern.
- Fi-dominant + Q-P2 "Accept the risk" → Fire card shows the personally-authentic pattern.
- Fe-dominant + Q-P1 "Stay silent" or "Soften it" → Pressure card shows the attunement-to-yielded pattern.

---

## Acceptance

- `lib/identityEngine.ts` `CROSS_CARD_PATTERNS` contains 5 new entries (`si_tradition_built_from_chaos`, `se_crisis_alive_planning_strain`, `ti_closed_reasoning_chamber`, `fi_personally_authentic_only`, `fe_attunement_to_yielded_conviction`) following the existing pattern template.
- Each pattern's `detection` references the locked function + signal conditions above.
- Each pattern's `prose` matches the templates above (allowing for engine-correct interpolation of `nameOrYour`, `capitalize`, `getUserName`).
- `docs/canon/cross-card-patterns.md` documents the 5 new patterns.
- `docs/canon/temperament-framework.md` updated only if it referenced pattern coverage.
- `git diff --stat` shows changes only in the named files.
- `npx tsc --noEmit` exits 0. `npm run lint` passes. `npm run build` succeeds.
- Manual case sweep confirms each new pattern fires under its condition and not otherwise.

---

## Out of scope

- **Authoring more than 5 new patterns.** The 5 listed are the queued candidates. Any additional pattern proposals are CC-029-followup territory.
- **Modifying any of the existing 12 patterns.** Read-only.
- **Adding new signals.** All 5 patterns use existing signals (`chaos_exposure`, `holds_internal_conviction`, `high_conviction_under_risk`, `adapts_under_social_pressure`) and existing Lens / Agency derivations.
- **Changing pattern engine architecture.** No edits to how `CROSS_CARD_PATTERNS` is iterated or rendered.
- **Updating gift categories or `pickGiftCategory`.** That's CC-034 / CC-036 territory. Patterns are a separate prose layer from gift categories.
- **Authoring Mirror or ShapeCard prose** that names the new patterns by name. Patterns surface as "Pattern Note" entries on the relevant card via the existing rendering pipeline.
- **Renaming any of the 5 new patterns.** The IDs and names are locked.
- **Adjusting prose templates beyond engine-mechanical fixes.** If `nameOrYour` returns a value that requires capitalization, use `capitalize()`; if `getUserName` is null, the falsy branch should still read coherently. Keep the prose intent intact.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Execution Directive

Single pass. Don't pause. Canon-faithful interpretation. Don't edit files outside Allowed-to-Modify.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` (smoke only)
- `git diff --stat`
- `git status`

## Read First (Required)

- `AGENTS.md`
- `lib/identityEngine.ts` lines 3705–3937 (full `CROSS_CARD_PATTERNS` array — read all 12 patterns to internalize structure).
- `lib/identityEngine.ts` `LensStack`, `AgencyPattern`, `WeatherLoad`, `FirePattern` type definitions (search for them).
- `lib/identityEngine.ts` `hasSignal`, `compassRanksTop`, `gravityRanksTop` helpers.
- `lib/cardAssets.ts` — `SURVEY_CARD_TO_SHAPE_CARD` mapping (resolve which `applicable_card` value pattern 5 uses for the pressure-card surface).
- `docs/canon/cross-card-patterns.md` — locate the catalog format.
- `prompts/completed/CC-022-engine-prose-v2.md` — context on the pattern-prose authoring convention.

## Allowed to Modify

- `lib/identityEngine.ts`
- `docs/canon/cross-card-patterns.md`
- `docs/canon/temperament-framework.md` (only if it referenced pattern coverage)

## Report Back

1. **Files modified** with line counts.
2. **Verification results** — tsc, lint, build outputs.
3. **Manual case sweep** — 5 minimal-config trace results showing pattern fires.
4. **Resolutions** — any place where the pattern detection signature, helper availability, or `LensStack.top2` accessor required improvising; document the choice.
5. **Out-of-scope drift caught**.
6. **Browser smoke deferred to Jason**.
7. **Pattern coverage post-CC-029** — bare-numbers table showing each function's pattern count after CC-029 ships.

---

## Notes for the executing engineer

- Patterns 3 (`ti_closed_reasoning_chamber`) and 5 (`fe_attunement_to_yielded_conviction`) check signals that fire from Q-P1 / Q-P2 (the pressure-card forced-choice questions). Verify those signals fire correctly in the current engine before relying on them — `holds_internal_conviction` and `adapts_under_social_pressure` are referenced in the existing pattern catalog (e.g., pattern 4 — search for them).
- Pattern 3's "low Te exposure" check is the most architecturally sensitive — `LensStack.top2` may not exist; the executing engineer may need to use `stack.dominant` and `stack.auxiliary` separately. Prefer `[stack.dominant, stack.auxiliary].includes("te")` as the negation check if `top2` is unavailable.
- Pattern 2's `agency.current === "reactive"` check assumes `AgencyPattern` exposes a `current` field with a `"reactive"` enum value. Verify against `lib/identityEngine.ts` `AgencyPattern` type. If the field name differs (e.g., `posture` instead of `current`, or `reactive_operator` is a derived predicate elsewhere), use the canonical accessor.
- Prose templates use `nameOrYour(demographics)` — when `getUserName` returns null, `nameOrYour` returns "your"; when it returns a name, it returns the name's possessive form. The templates above are written to read coherently in both cases. Verify by reading existing pattern prose for the same convention.
- The 5 patterns lock function-and-signal pairs. Don't substitute different conditions even if they seem to fire more often — the conditions are chosen for the specific gift→risk dynamic the prose names. A more permissive condition would dilute the pattern.
- If a pattern's detection turns out to require a signal helper that doesn't exist in the current engine, surface as a follow-up CC, don't author the helper inline. The 5 patterns above are designed to use only existing helpers.
