# CC-036 — Secondary Gift Categories per Function (Tier 3: Ceiling)

**Type:** Five new conditional gift-category routes in `pickGiftCategory` + matching `categoryHasSupport` widenings. **No new categories. No new prose. No new questions or signals.**
**Goal:** Bring Si / Se / Ti / Te up to 3 gift-category options each (matching Ni's 3-category breadth). Today Si has 2 (Stewardship, Endurance), Se has 1 (Action), Ti has 2 (Precision, Discernment), Te has 2 (Builder, Generativity). After CC-036: each has 3. Fi and Fe already have 3 — they're untouched.
**Predecessors:** CC-034 (Tier 1: fallback fix), CC-029 (Tier 2: pattern catalog). Both should ship before CC-036 so the floor and middle are settled.
**Successor:** None hard-blocked. CC-036 closes the cognitive-function-parity program.

This is **Tier 3** of the cognitive-function-parity program. CC-034 raised the floor; CC-029 raised the middle; CC-036 raises the ceiling by adding a secondary discriminating route per function so each user gets the *most-specific-applicable* category, not just the function's default.

---

## Why this CC

Post-CC-034, every dominant function has at least one assured gift category. But Ni-parity isn't reached until each function has Ni's *breadth* — three discriminating category reads, each fired by different signal patterns:

- Ni today: Pattern (default), Discernment (with truth + bearing-cost), Meaning (with faith). Three discriminating routes.
- Si post-CC-034: Stewardship (default), Endurance (with high weather). Two routes.
- Se post-CC-034: Action (default). One route.
- Ti post-CC-034: Precision (default), Discernment (with truth/knowledge + bearing-cost). Two routes.
- Te post-CC-034: Generativity (default), Builder (with creator-agency + system-responsibility). Two routes.
- Fi: Integrity (default), Harmony (with family), Advocacy (with justice + responsibility split). Three routes — **already at parity**.
- Fe: Harmony (default), Stewardship (with stability/family), Advocacy (with justice + responsibility split). Three routes — **already at parity**.

CC-036 adds one new route each for Si, Se (which gets two new routes since it starts at one), Ti, and Te. Total: 5 new conditional routes added to `pickGiftCategory`; matching `categoryHasSupport` widenings.

Categories themselves already exist with full prose. CC-036 only adds *routing conditions* — which existing category fires for which user signal pattern.

---

## Scope

Files modified:

1. `lib/identityEngine.ts` — `pickGiftCategory` heuristic ladder gets 5 new conditional routes inserted before CC-034's function-specific fallbacks. `categoryHasSupport` is widened so each new route's category resolves to support=true for that function under the new condition.
2. `docs/canon/output-engine-rules.md` — document the secondary discriminating routes per function.
3. `docs/canon/temperament-framework.md` — if the file enumerates function-to-category breadth, update; otherwise leave alone.

Nothing else. No new prose, no new categories, no new patterns, no new signals.

---

## The five new routes — locked

| # | Function | New category | Discriminating condition | Why this pairing |
|---|---|---|---|---|
| 1 | Si | Discernment | `dom === "si"` AND (`truth_priority` OR `knowledge_priority` in topCompass) | Si pattern-matches subtle anomalies — when paired with truth/knowledge values, the sensing register reads as detecting what doesn't add up. Discernment's prose ("you tend to detect what doesn't add up before it surfaces openly") composes naturally with this signal pattern. |
| 2 | Se | Advocacy | `dom === "se"` AND `justice_priority` in topCompass | Se's somatic engagement, when paired with justice values, expresses as embodied advocacy. The user shows up physically for what's owed. Advocacy's prose ("you tend to notice what's owed and to protect those who can't protect themselves") composes with the active-presence Se register. |
| 3 | Se | Builder | `dom === "se"` AND (`agency.current === "creator"` OR `system_responsibility_priority` in topGravity) | Se as builder of physical / tangible systems — the maker register, where Se's hands-on engagement turns into building. Builder's prose ("you tend to turn ideas into working systems and to push past friction toward a result") composes with creator-agency Se. |
| 4 | Ti | Builder | `dom === "ti"` AND (`agency.current === "creator"` OR `system_responsibility_priority` in topGravity) | Ti as system-architect — the framework-building register, where Ti's analytical clarity turns into structured systems. Builder's prose composes with creator-agency Ti. (Fi/Fe already have Builder routes through different conditions; this is the Ti-specific route.) |
| 5 | Te | Precision | `dom === "te"` AND (`truth_priority` OR `knowledge_priority` in topCompass) | Te clarifying what's actually being claimed — the operational-precision register. Te is typically read as builder/generative, but with truth/knowledge values it expresses as the cut-through-noise discipline. Precision's prose composes with this Te variant. |

Routes are inserted in `pickGiftCategory` between the existing condition-driven routes (lines 1706–1715) and the CC-034 function-specific fallbacks. Order matters: more-specific conditions go first, so a Si-with-truth user gets Discernment (CC-036 route 1) rather than Stewardship (CC-034 default).

---

## Steps

### 1. Extend `pickGiftCategory` in `lib/identityEngine.ts`

Around lines 1706–1721 (the heuristic-priority ladder). Insert the 5 new routes BETWEEN the existing condition-driven routes and the CC-034 fallbacks. Final structure:

```ts
function pickGiftCategory(...) {
  const dom = stack.dominant;
  const compassIds = topCompass.map((r) => r.signal_id);
  const gravityIds = topGravity.map((r) => r.signal_id);
  const has = (id: SignalId) => compassIds.includes(id);
  const hasG = (id: SignalId) => gravityIds.includes(id);

  // Existing condition-driven routes (CC-011b, CC-022, CC-026):
  if (dom === "ni" && has("faith_priority")) return "Meaning";
  if (dom === "ti" && (has("truth_priority") || has("knowledge_priority"))) return "Precision";
  if ((dom === "ti" || dom === "ni") && fire.willingToBearCost && has("truth_priority")) return "Discernment";
  if (dom === "te" && (agency.current === "creator" || agency.aspiration === "creator")
      && (hasG("system_responsibility_priority") || hasG("authority_responsibility_priority"))) return "Builder";
  if ((dom === "fi" || dom === "fe") && has("justice_priority")
      && hasG("individual_responsibility_priority") && hasG("system_responsibility_priority")) return "Advocacy";
  if (dom === "fi" && (has("truth_priority") || has("faith_priority"))) return "Integrity";
  if (dom === "fe" && (has("family_priority") || has("faith_priority"))) return "Harmony";
  if (dom === "si" && (has("stability_priority") || has("family_priority"))) return "Stewardship";
  if (dom === "si" && weather.intensifier === "high") return "Endurance";
  if (dom === "se" && has("freedom_priority")) return "Action";

  // CC-036 — secondary conditional routes for Si / Se / Ti / Te.
  // Each route is more specific than the function's default fallback below;
  // it fires when the discriminating signal matches and otherwise defers to
  // the CC-034 fallback.
  if (dom === "si" && (has("truth_priority") || has("knowledge_priority"))) return "Discernment";
  if (dom === "se" && has("justice_priority")) return "Advocacy";
  if (dom === "se" && (agency.current === "creator" || hasG("system_responsibility_priority"))) return "Builder";
  if (dom === "ti" && (agency.current === "creator" || hasG("system_responsibility_priority"))) return "Builder";
  if (dom === "te" && (has("truth_priority") || has("knowledge_priority"))) return "Precision";

  // Existing Ne/Ni baseline:
  if (dom === "ne" || dom === "ni") return "Pattern";
  if ((agency.aspiration === "relational" || agency.aspiration === "stability"
       || agency.aspiration === "exploration") && dom === "te") return "Generativity";

  // CC-034 — function-specific fallbacks before the generic Pattern default.
  if (dom === "si") return "Stewardship";
  if (dom === "se") return "Action";
  if (dom === "ti") return "Precision";
  if (dom === "te") return "Generativity";
  if (dom === "fi") return "Integrity";
  if (dom === "fe") return "Harmony";
  return "Pattern";
}
```

### 2. Widen `categoryHasSupport` in `lib/identityEngine.ts`

Each CC-036 route's category needs to return `true` for its function under the discriminating condition. Update only the categories named below; the rest stay as post-CC-034.

```ts
case "Discernment":
  return (dom === "ti" || dom === "ni") &&
    (inCompass("truth_priority") || inCompass("knowledge_priority") || fire.willingToBearCost) ||
    (dom === "si" && (inCompass("truth_priority") || inCompass("knowledge_priority"))); // CC-036 — Si pattern-matches subtle anomalies.

case "Advocacy":
  return inCompass("justice_priority") ||
    (inGravity("individual_responsibility_priority") && inGravity("system_responsibility_priority")) ||
    (dom === "se" && inCompass("justice_priority")); // CC-036 — Se somatic-justice register.

case "Builder":
  return dom === "te" && (agency.current === "creator" || agency.aspiration === "creator" ||
    inGravity("system_responsibility_priority") || inGravity("authority_responsibility_priority")) ||
    ((dom === "se" || dom === "ti") &&
      (agency.current === "creator" || inGravity("system_responsibility_priority"))); // CC-036 — Se/Ti as system-builders.

case "Precision":
  return dom === "ti" && (inCompass("truth_priority") || inCompass("knowledge_priority")) ||
    dom === "ti" || // CC-034 — Ti always supports Precision as its fallback.
    (dom === "te" && (inCompass("truth_priority") || inCompass("knowledge_priority"))); // CC-036 — Te clarification register.
```

### 3. Update `docs/canon/output-engine-rules.md`

Add a section (or amend the existing gift-category routing section) documenting the secondary discriminating routes. Include the post-CC-036 function-to-category-breadth table:

```
Gift-category routes per dominant function (post-CC-036):
- Ni: Pattern (default), Discernment (truth + bearing-cost), Meaning (faith)
- Ne: Pattern (default), no secondary routes (deliberate — Ne's breadth is in Pattern itself)
- Si: Stewardship (default), Endurance (high weather), Discernment (truth/knowledge)
- Se: Action (default), Advocacy (justice), Builder (creator-agency or system-resp)
- Ti: Precision (default), Discernment (truth/knowledge + bearing-cost), Builder (creator-agency or system-resp)
- Te: Generativity (default), Builder (creator-agency + system-resp/authority-resp), Precision (truth/knowledge)
- Fi: Integrity (default), Harmony (family or faith), Advocacy (justice + responsibility split)
- Fe: Harmony (default), Stewardship (stability or family), Advocacy (justice + responsibility split)

Routes are evaluated in priority order: most-specific condition first, function-default last.
```

CC-036 amendment paragraph naming the rationale (close the cognitive-function-parity gap by giving Si / Se / Ti / Te the same 3-category breadth as Ni, Fi, Fe).

### 4. Update `docs/canon/temperament-framework.md` if relevant

Search for any text claiming Si / Se / Ti / Te have only one or two gift-category reads. Update to reflect the post-CC-036 three-route architecture. If the file doesn't enumerate at this level, leave alone.

### 5. Verification

- `npx tsc --noEmit` exits 0.
- `npm run lint` passes.
- `npm run build` succeeds.
- Existing test suite passes.
- Manual case sweep: write down 5 minimal Lens-stack configurations (one per new route — Si+truth, Se+justice, Se+creator, Ti+creator, Te+truth) and confirm each routes to the locked secondary category. Then confirm that absent the discriminating condition, each function still routes to its CC-034 default.

### 6. Browser smoke (Jason verifies)

Five sessions tuned to land each new secondary route:

- Si-dominant + truth_priority in Compass top → Mirror reads Discernment prose.
- Se-dominant + justice_priority in Compass top → Mirror reads Advocacy prose.
- Se-dominant + creator-agency or system-responsibility-priority gravity → Mirror reads Builder prose.
- Ti-dominant + creator-agency or system-responsibility-priority gravity → Mirror reads Builder prose.
- Te-dominant + truth_priority in Compass top → Mirror reads Precision prose.

For each, also verify the CC-034 fallback still works when the discriminating condition is absent.

---

## Acceptance

- `pickGiftCategory` in `lib/identityEngine.ts` contains 5 new conditional routes inserted between existing condition-driven routes and CC-034 fallbacks, in the order specified above.
- `categoryHasSupport` is widened for Discernment, Advocacy, Builder, and Precision categories so the new routes pass the per-card preference filter.
- `docs/canon/output-engine-rules.md` documents the post-CC-036 function-to-category-breadth table.
- `docs/canon/temperament-framework.md` updated only if it referenced function-category breadth.
- `git diff --stat` shows changes only in the named files.
- `npx tsc --noEmit` exits 0. `npm run lint` passes. `npm run build` succeeds.
- Manual case sweep confirms each new secondary route fires under its condition AND each function's CC-034 fallback still fires absent the secondary condition.

---

## Out of scope

- **Authoring new prose.** All five categories used by CC-036 routes (Discernment, Advocacy, Builder, Precision) already have full prose in `GIFT_DESCRIPTION`, `GIFT_NOUN_PHRASE`, `GROWTH_EDGE_TEXT`, `BLIND_SPOT_TEXT_VARIANTS`. No edits to those maps.
- **Adding new gift categories.** The set of 12 stays at 12.
- **Adding new cross-card patterns.** That's CC-029 territory; CC-036 is gift-category-only.
- **Changing the existing CC-011b / CC-022 / CC-026 condition-driven routes.** Lines 1706–1717 stay verbatim. CC-036 inserts between them and the CC-034 fallbacks.
- **Reordering the heuristic priority ladder.** The order matters for resolution; only insert the new routes, don't move existing ones.
- **Adding routes for Ne, Ni, Fi, or Fe.** Ne is intentionally at-default (Pattern is its breadth). Ni already has 3 routes. Fi has 3. Fe has 3.
- **Adding more than 5 routes.** Si, Ti, Te each get one new route. Se gets two (because it starts at one route post-CC-034). That's 5 total — locked.
- **Changing `LensStack`, `AgencyPattern`, `WeatherLoad`, `FirePattern`** type definitions or accessors.
- **Updating Mirror, Strength, Growth Edge, Practice, or Pattern Note prose templates.**
- **Tuning `CARD_PREFERENCES` or `PREFERENCE_WEIGHTS`.**

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
- `lib/identityEngine.ts` lines 1689–1812 (full `pickGiftCategory` and `categoryHasSupport` post-CC-034).
- `lib/identityEngine.ts` lines 2099–2142 (`GIFT_NOUN_PHRASE`, `GIFT_DESCRIPTION`, `GROWTH_EDGE_TEXT`).
- `lib/identityEngine.ts` lines 2024–2071 (`BLIND_SPOT_TEXT_VARIANTS` — verify Discernment/Advocacy/Builder/Precision entries exist).
- `prompts/completed/CC-034-cognitive-function-prose-fallback-fix.md` — verify CC-034 routing is in place before CC-036.
- `docs/canon/output-engine-rules.md` — locate gift-category routing documentation.

## Allowed to Modify

- `lib/identityEngine.ts`
- `docs/canon/output-engine-rules.md`
- `docs/canon/temperament-framework.md` (only if it referenced function-category breadth)

## Report Back

1. **Files modified** with line counts.
2. **Verification results** — tsc, lint, build outputs.
3. **Manual case sweep** — 5 minimal-config function traces showing the resolved category for each new route, plus 6 traces showing CC-034 fallbacks still fire when the discriminating condition is absent (one per non-Ne/Ni function).
4. **Out-of-scope drift caught**.
5. **Browser smoke deferred to Jason**.
6. **Parity bare-numbers** — table showing each function's gift-category count post-CC-036 (target: Ni=3, Ne=1 by design, Si=3, Se=3, Ti=3, Te=3, Fi=3, Fe=3).

---

## Notes for the executing engineer

- CC-036 depends on CC-034 having shipped first. If `pickGiftCategory` doesn't already contain CC-034's six function-specific fallbacks, stop and surface as a blocker — don't combine CC-034 + CC-036 in this pass.
- The five new routes are ordered in the priority ladder so that more-specific conditions fire first. The ordering above is locked. Reordering could cause a Si+truth user to land on Stewardship (default) instead of Discernment (CC-036 route).
- `categoryHasSupport` updates use the `||` collapse pattern: existing condition kept for documentation, new function-condition pair appended. Don't simplify away the existing clauses.
- Ne is deliberately not given a secondary route. Ne's breadth lives inside the Pattern category itself (the prose is already broad). Forcing a secondary route would either duplicate Ni's Meaning or compete with Pattern's default — both bad.
- Verify before shipping that `BLIND_SPOT_TEXT_VARIANTS` and `GROWTH_EDGE_TEXT` have entries for Discernment, Advocacy, Builder, Precision. They do (per audit) — but confirm.
- The Builder route for Se and Ti (CC-036 routes 3 and 4) shares conditions but lands the same category. That's deliberate — Se as physical/tangible builder, Ti as conceptual/system builder. The prose in `GIFT_DESCRIPTION["Builder"]` reads coherently for both registers.
- The Ti+creator-agency Builder route (CC-036 route 4) does NOT conflict with the existing Te+creator-agency Builder route (line 1709): the existing route requires Te dominant AND system/authority-responsibility, so the Ti route fires only for Ti dominants. No overlap.
- Pre-CC-036 saved sessions: re-rendering picks up the new routing. No migration logic.
- If browser smoke reveals that Discernment / Advocacy / Builder / Precision prose reads awkwardly for a function it wasn't originally written for, surface as a successor CC for editorial-pass prose tuning. Don't rewrite prose during CC-036.
