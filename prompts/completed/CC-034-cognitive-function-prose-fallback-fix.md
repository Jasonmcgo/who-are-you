# CC-034 — Cognitive Function Prose Fallback Fix (Tier 1: Floor)

**Type:** Engine routing fix in `pickGiftCategory` + `categoryHasSupport`. **No new prose authored. No new categories. No new patterns.**
**Goal:** Stop Si / Se / Ti / Te / Fi / Fe from dropping to the generic `"Pattern"` gift category when their primary condition isn't met. Each non-Ne/Ni dominant function gets a function-specific default category that already has prose written for it (`GIFT_DESCRIPTION`, `GROWTH_EDGE_TEXT`, `BLIND_SPOT_TEXT_VARIANTS`, `GIFT_NOUN_PHRASE`).
**Predecessors:** CC-025 (Engine Prose Tuning Round 2), CC-026 (Drive Integration), CC-028 (Compass Values Expansion). All shipped pre-2026-04-29.
**Successor:** CC-029 (Pattern Catalog Expansion — Tier 2 of the Ni-parity program). CC-036 (Secondary Gift Categories — Tier 3).

This is **Tier 1** of a three-tier cognitive-function-parity program. CC-034 raises the floor (no function ever reads as generic "Pattern" prose). CC-029 raises the middle (cross-card pattern coverage matches Ni's count). CC-036 raises the ceiling (each function gets multiple nuanced gift-category reads).

---

## Why this CC

Real-user verification 2026-04-29 surfaced that Si / Se / Ti / Te / Fi / Fe dominant users get noticeably thinner Mirror prose than Ni / Ne dominants. Audit confirms the cause is structural, not editorial:

`pickGiftCategory()` at `lib/identityEngine.ts:1691–1722` runs a heuristic priority ladder. Ni and Ne have a guaranteed default at line 1718 (`if (dom === "ne" || dom === "ni") return "Pattern";`). Every other function has only conditional category routes — when none of the conditions match, the function falls through to line 1721's generic `return "Pattern";`. But `categoryHasSupport()` at line 1781 declares `"Pattern"` is supported only for Ni / Ne — meaning the per-card category-selection path (`pickGiftCategoryForCard`) filters Pattern out entirely for non-Ne/Ni functions, leaving them with no qualifying category in some configurations.

Result: a Si-dominant user with a non-stability/non-family Compass and average weather hits the generic line 1721 fallback. The Mirror renders Pattern's `"you tend to see the deeper shape of a problem before it becomes obvious to others"` — prose written for intuitive functions, not Si.

Concrete impact per function in worst-case configs:
- **Si** without `stability_priority` or `family_priority` and weather not high → falls to Pattern.
- **Se** without `freedom_priority` → falls to Pattern.
- **Ti** without `truth_priority` and `knowledge_priority` and not bearing-cost → falls to Pattern.
- **Te** without creator-agency and without `system_responsibility_priority` / `authority_responsibility_priority` → falls to Pattern.
- **Fi** without `truth_priority` / `faith_priority` / `family_priority` / `justice_priority` → falls to Pattern.
- **Fe** without `family_priority` / `faith_priority` / `justice_priority` → falls to Pattern.

The fix is routing-only: every function gets a specific category as its final fallback (before the generic Pattern line), and `categoryHasSupport` is widened so each function's default category passes the per-card preference filter.

The categories themselves and all their prose blocks already exist (`GIFT_DESCRIPTION`, `GIFT_NOUN_PHRASE`, `GROWTH_EDGE_TEXT`, `BLIND_SPOT_TEXT_VARIANTS`). Nothing new is authored. This is a 12-to-15-line code change across two functions plus canon doc cross-references.

---

## Scope

Files modified:

1. `lib/identityEngine.ts` — `pickGiftCategory` heuristic ladder gets six new function-specific fallback returns inserted before the final `return "Pattern"`. `categoryHasSupport` is widened so each function's fallback category resolves to support=true for that function.
2. `docs/canon/output-engine-rules.md` — document the function-to-default-category routing as canon (Si→Stewardship, Se→Action, Ti→Precision, Te→Generativity, Fi→Integrity, Fe→Harmony).
3. `docs/canon/temperament-framework.md` — if the file enumerates the cognitive-function-to-prose mapping, update; otherwise leave alone.

Nothing else. No prose changes. No new categories. No new cross-card patterns. No changes to the temperament-block question Q-T1–T8. No changes to `LensStack` derivation or function-detection thresholds. No changes to ShapeCard structure.

---

## The fallback routing — locked

For each non-Ne/Ni dominant function, the assured fallback category is:

| Dominant function | Fallback category | Why |
|---|---|---|
| Si | Stewardship | Si's natural register is preservation across time. Stewardship is its canonical default. Existing condition (with stability/family) becomes the discriminating route; without those signals, Stewardship still applies. |
| Se | Action | Se's only existing route. Currently gated on `freedom_priority`. Drop the gate for the fallback case so Se always reaches Action. |
| Ti | Precision | Ti's primary cognitive register is clarifying what's actually being claimed. Precision is its canonical default. Existing condition (with truth/knowledge) becomes the discriminating route. |
| Te | Generativity | Te's relational mode (helping others become more capable) is the right fallback when neither creator-agency nor system-responsibility conditions match. Builder remains the discriminating route for creator-agency Te. |
| Fi | Integrity | Fi's canonical register is values-driven authenticity. Integrity is its default. Existing conditions (truth/faith for Integrity, family for Harmony, justice for Advocacy) remain discriminating routes. |
| Fe | Harmony | Fe's canonical register is relational attunement. Harmony is its default. Existing conditions remain discriminating routes. |

These six fallbacks are **locked**. The reasoning is that each chosen category has prose in `GIFT_DESCRIPTION` that reads naturally as that function's default mode (verified line by line in the audit). Substituting a different fallback would risk tone drift and require browser-smoke verification.

---

## Steps

### 1. Extend `pickGiftCategory` in `lib/identityEngine.ts` (around line 1718–1721)

Replace the closing block:

```ts
  if (dom === "ne" || dom === "ni") return "Pattern";
  if ((agency.aspiration === "relational" || agency.aspiration === "stability"
       || agency.aspiration === "exploration") && dom === "te") return "Generativity";
  return "Pattern";
}
```

with:

```ts
  if (dom === "ne" || dom === "ni") return "Pattern";
  if ((agency.aspiration === "relational" || agency.aspiration === "stability"
       || agency.aspiration === "exploration") && dom === "te") return "Generativity";
  // CC-034 — function-specific fallbacks before the generic Pattern default.
  // Each dominant function gets an assured category whose prose reads
  // naturally for that function's canonical mode. Categories themselves are
  // unchanged; only the routing now guarantees a function-specific landing.
  if (dom === "si") return "Stewardship";
  if (dom === "se") return "Action";
  if (dom === "ti") return "Precision";
  if (dom === "te") return "Generativity";
  if (dom === "fi") return "Integrity";
  if (dom === "fe") return "Harmony";
  return "Pattern";
}
```

The Te-aspiration check above stays (it's a condition-driven Generativity route, unchanged); the new Te fallback at the bottom catches Te users whose aspiration isn't `relational`/`stability`/`exploration` and who don't qualify for Builder.

### 2. Widen `categoryHasSupport` in `lib/identityEngine.ts` (around lines 1779–1812)

Each fallback category needs to return `true` for its function unconditionally so `pickGiftCategoryForCard` doesn't filter it out. Update only the categories named below; the rest stay as-is.

```ts
case "Stewardship":
  return (dom === "si" || dom === "fe") &&
    (inCompass("stability_priority") || inCompass("family_priority")) ||
    dom === "si"; // CC-034 — Si always supports Stewardship as its fallback.

case "Action":
  return (dom === "se" || dom === "te") &&
    (inCompass("freedom_priority") || inCompass("justice_priority") || agency.current === "creator") ||
    dom === "se"; // CC-034 — Se always supports Action as its fallback.

case "Precision":
  return dom === "ti" && (inCompass("truth_priority") || inCompass("knowledge_priority")) ||
    dom === "ti"; // CC-034 — Ti always supports Precision as its fallback.
  // (The `||` collapses to: Ti always supports Precision. Existing condition
  // remains for documentation; the function-only fallback is the operative
  // clause.)

case "Generativity":
  return agency.aspiration === "relational" || agency.aspiration === "stability" ||
    agency.aspiration === "exploration" ||
    dom === "te"; // CC-034 — Te always supports Generativity as its fallback.

case "Integrity":
  return dom === "fi" || (fire.willingToBearCost && (inCompass("truth_priority") || inCompass("faith_priority")));
  // (Fi already supports Integrity unconditionally — line 1792 already reads
  // `dom === "fi" || ...`. CC-034 verifies this stays. Fi-fallback support
  // requires no edit.)

case "Harmony":
  return dom === "fe" || (dom === "fi" && inCompass("family_priority"));
  // (Fe already supports Harmony unconditionally. CC-034 verifies this stays.
  // Fe-fallback support requires no edit.)
```

The post-edit `categoryHasSupport` cases for Stewardship / Action / Precision / Generativity each pick up a final `|| dom === "<function>"` clause so the fallback category always passes the support filter for its function. Integrity (Fi-support) and Harmony (Fe-support) already qualify and need no edit.

### 3. Update `docs/canon/output-engine-rules.md`

Add a section (or amend the existing gift-category routing section) documenting the function-to-default-category map:

```
Default fallback gift category per dominant function:
- Ni → Pattern
- Ne → Pattern
- Si → Stewardship
- Se → Action
- Ti → Precision
- Te → Generativity (when no creator-agency / system-responsibility match)
- Fi → Integrity
- Fe → Harmony

Conditional category routes (existing) take priority over fallbacks. The
fallback fires only when no conditional route's predicate matches.
```

CC-034 amendment paragraph naming the rationale (eliminate generic-Pattern prose for non-Ne/Ni dominants).

### 4. Update `docs/canon/temperament-framework.md` if relevant

Search for any text that asserts "Si reads as Pattern" / "Se reads as Pattern" / etc. If present, update to reflect the post-CC-034 routing. If the file doesn't enumerate function-to-prose mapping at this level of detail, leave alone.

### 5. Verification

- `npx tsc --noEmit` exits 0.
- `npm run lint` passes.
- `npm run build` succeeds.
- Existing test suite passes.
- Manual case sweep: write down 8 minimal Lens-stack configurations (one per dominant function) where no other gift-category condition matches. For each, trace `pickGiftCategory` and confirm the returned category is the locked fallback above. Confirm `categoryHasSupport(returnedCategory, ...)` returns true for that function.

### 6. Browser smoke (Jason verifies after CC closes)

Six fresh sessions, each tuned to land a different non-Ne/Ni dominant function with no qualifying signals:

- Si-dominant, Compass without stability/family, weather not high → Mirror reads Stewardship prose.
- Se-dominant, Compass without freedom → Mirror reads Action prose.
- Ti-dominant, Compass without truth/knowledge → Mirror reads Precision prose.
- Te-dominant, no creator-agency, no system-responsibility → Mirror reads Generativity prose.
- Fi-dominant, Compass without truth/faith/family/justice → Mirror reads Integrity prose.
- Fe-dominant, Compass without family/faith/justice → Mirror reads Harmony prose.

None of the six should read the generic "you tend to see the deeper shape of a problem" Pattern line.

---

## Acceptance

- `pickGiftCategory` in `lib/identityEngine.ts` contains six new function-specific fallback returns (Si→Stewardship, Se→Action, Ti→Precision, Te→Generativity, Fi→Integrity, Fe→Harmony) inserted before the final `return "Pattern"`.
- `categoryHasSupport` is widened so Stewardship, Action, Precision, and Generativity each return `true` unconditionally for their function. Integrity and Harmony unchanged (already qualify).
- `docs/canon/output-engine-rules.md` documents the function-to-default-category map with CC-034 amendment.
- `docs/canon/temperament-framework.md` updated only if it enumerated function-prose mapping.
- `git diff --stat` shows changes only in the named files.
- `npx tsc --noEmit` exits 0. `npm run lint` passes. `npm run build` succeeds.
- Manual case-sweep verification confirms each of the 8 dominant functions resolves to a function-specific category in worst-case configs.

---

## Out of scope

If you find yourself doing any of these, stop and flag — they belong elsewhere:

- **Authoring new gift-category prose.** All 12 existing categories' `GIFT_DESCRIPTION`, `GROWTH_EDGE_TEXT`, `BLIND_SPOT_TEXT_VARIANTS`, and `GIFT_NOUN_PHRASE` entries stay verbatim. CC-034 only changes routing.
- **Adding new gift categories.** The set of 12 stays at 12.
- **Authoring new cross-card patterns** for Si / Se / Ti / Fi / Fe. That's CC-029 (Tier 2) territory.
- **Adding secondary conditional gift-category routes** per function (e.g., Si + truth → Precision). That's CC-036 (Tier 3) territory. CC-034 only adds *one* fallback per function, not multiple discriminating routes.
- **Changing the Ne / Ni Pattern routing.** Lines 1706 (Ni+faith→Meaning), 1707 (Ti+truth→Precision), 1708 (Ti/Ni+cost+truth→Discernment), 1718 (Ne/Ni→Pattern) all stay verbatim.
- **Changing `LensStack` derivation, function-strength thresholds, or temperament-block question wiring.**
- **Changing `CARD_PREFERENCES` or `PREFERENCE_WEIGHTS`** (the per-card category preference order). CC-034 only changes which categories `categoryHasSupport` admits — the preference scoring itself is untouched.
- **Updating Mirror, Strength, Growth Edge, Practice, or Pattern Note prose templates.**
- **Changing `pickGiftCategoryForCard` directly.** It already calls `categoryHasSupport`, so widening support is enough.
- **Refactoring `pickGiftCategory` for clarity.** Add the 6 lines, leave the existing structure alone.

---

## Launch Directive

Run with permissions bypassed. Either: launch CC with `claude --dangerously-skip-permissions`, or in-session toggle `/permissions` → bypass.

## Execution Directive

Complete in a single pass. Do not pause for user confirmation. On ambiguity apply canon-faithful interpretation and flag in the Report Back. Do not edit files outside the Allowed-to-Modify list.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` (browser smoke only — kill before exiting)
- `git diff --stat`
- `git status`

## Read First (Required)

- `AGENTS.md`
- `lib/identityEngine.ts` lines 1689–1812 (full `pickGiftCategory` and `categoryHasSupport`); lines 2099–2142 (`GIFT_NOUN_PHRASE`, `GIFT_DESCRIPTION`, `GROWTH_EDGE_TEXT`); lines 2024–2071 (`BLIND_SPOT_TEXT_VARIANTS`).
- `lib/identityEngine.ts` lines 1736–1747 (`CARD_PREFERENCES`, `PREFERENCE_WEIGHTS`) — context only, do not edit.
- `docs/canon/output-engine-rules.md` — locate the gift-category routing documentation.
- `docs/canon/temperament-framework.md` — search for function-to-prose mapping references.

## Allowed to Modify

- `lib/identityEngine.ts`
- `docs/canon/output-engine-rules.md`
- `docs/canon/temperament-framework.md` (only if it references function-prose mapping)

## Report Back

1. **Files modified** — list with line counts.
2. **Verification results** — `tsc`, `lint`, `build` outputs.
3. **Manual case sweep** — 8 minimal-config function traces showing the resolved category.
4. **Out-of-scope drift caught** — anything considered and rejected.
5. **Browser smoke deferred to Jason** — confirm visual verification stays Jason's job.
6. **Successor recommendation** — confirm CC-029 / CC-036 still queued.

---

## Notes for the executing engineer

- This is a routing fix, not a prose fix. Every category referenced as a fallback already has full prose written. Verify the `GIFT_DESCRIPTION` / `GROWTH_EDGE_TEXT` / `BLIND_SPOT_TEXT_VARIANTS` / `GIFT_NOUN_PHRASE` entries exist for Stewardship, Action, Precision, Generativity, Integrity, Harmony before shipping. They do — but check.
- `categoryHasSupport`'s post-edit logic for Stewardship reads `(... existing condition ...) || dom === "si"`. The compiler will simplify, but keep the existing-condition clause for documentation — it tells future-you that Stewardship is Si's *default*, while the existing condition (Si or Fe with stability/family) is the *discriminating route*. Same pattern for Action (Se discriminating: with freedom/justice/creator), Precision (Ti discriminating: with truth/knowledge), Generativity (Te discriminating: with aspiration).
- Integrity already has `dom === "fi"` unconditional support — that's the pre-CC-034 state and must stay. Do NOT add `|| dom === "fi"` redundantly.
- Harmony already has `dom === "fe"` unconditional support. Same — leave alone.
- The Pattern category's support clause (`return dom === "ni" || dom === "ne";`) stays unchanged. Pattern is correctly Ne/Ni-only at the support-filter level; only the legacy `pickGiftCategory` ladder reaches Pattern as a final fallback for non-Ne/Ni functions today, and CC-034 stops that path.
- Pre-CC-034 saved sessions: any session whose Mirror was rendered against the old fallback shows the same prose. Re-rendering the report (e.g., re-loading a saved session) will pick up the new routing if the engine is re-run. No migration logic needed.
