# CC-052 — Gift Specificity Rewrite (CC-048 audit Rule 2 — first rewrite-track CC)

**Type:** Editorial rewrite landing in code. **No new logic. No new measurements. Pure prose-rewrite work targeting Rule 2 violations from CC-048's audit.** Touches the 12 entries in `GIFT_DESCRIPTION` plus their composition with user-specific signal patterns.
**Goal:** Stop generic gift-category prose from rendering as horoscope-class flattery. Each of the 12 gift categories gains a *user-specific second sentence* anchored to the discriminating signal pattern that fired the category. The standard format becomes *"[generic register-naming first sentence]. For your shape, this expresses as [user-specific anchor based on which signals fired the category]."* Rule 2 closes; rewrite track begins.
**Predecessors:** CC-048 (Report Calibration Canon Refinement + audit — codified the ten rules and produced the audit document; flagged 32 Rule 2 violations across `GIFT_DESCRIPTION`, `THESIS_FALLBACK`, `lib/workMap.ts`, and `lib/loveMap.ts`). CC-038-prose (single-word-label canon principle — gift category prose follows the same generic-then-specific architectural pattern). CODEX-051 (three-surface fixes — closes report-rendering defects before rewrite track begins).
**Successor:** CC-053+ rewrite track per CC-048 audit's suggested sequencing — Allocation Gap 3C's Rewrite (Rule 4), Growth Edge + Blind Spot Specificity (Rule 3), Trust + Responsibility Conditional Framing (Rules 8+9), Mirror Layer Uncomfortable-but-True Slot (Rule 5), Peace Disambiguation (Rule 10), OCEAN-as-Texture Refactor (Rules 6+1).

---

## Why this CC

CC-048's audit found 32 Rule 2 violations (generic gifts need user-specific second sentences) across the codebase, the largest single concentration in `GIFT_DESCRIPTION` at 12 entries. Real-user re-render of Jason0429's saved session 2026-04-30 confirmed the violations land hard in user-facing prose — *"A discernment gift. — You tend to detect what doesn't add up before it surfaces openly."* reads as flattery rather than observation, because the second sentence is the same for every user who lands on Discernment regardless of what discriminating signals fired the category for them.

Per CC-048 § Rule 2: *"Generic gift labels (Discernment, Pattern, Integrity) flatter without informing. Most users would accept 'You have discernment' as plausible; the report needs to earn the assertion by naming the discriminating signal pattern. 'Anomaly-detection across moral, strategic, and linguistic patterns when truth_priority and knowledge_priority both rank top-3' is observation; 'Discernment' alone is horoscope."*

CC-052 closes the GIFT_DESCRIPTION subset of Rule 2 violations. Other Rule 2 surfaces (THESIS_FALLBACK, lib/workMap.ts, lib/loveMap.ts) get their own follow-on rewrite CCs because they have different signal-context shapes. GIFT_DESCRIPTION ships first because it's the highest-frequency-rendered surface — most users see at least 1-3 gift categories in their report, every time.

---

## Scope

Files modified:

1. `lib/identityEngine.ts` — extend `GIFT_DESCRIPTION` (currently `Record<GiftCategory, string>`) into a composition that produces both the generic first sentence and a user-specific second sentence based on signal context. Implementation: either (a) split `GIFT_DESCRIPTION` into two maps (`GIFT_DESCRIPTION_GENERIC` + `GIFT_DESCRIPTION_SPECIFIC`) where the specific map keys on `(GiftCategory, signal-context-discriminant)`, or (b) refactor `GIFT_DESCRIPTION` into a function `(category, ctx) => string` that composes both sentences. Either is acceptable; the executor picks based on existing call-site shape.
2. Possibly `lib/identityEngine.ts` `topGiftsForMirror` (or wherever the Top 3 Gifts compose) — adjust the call-site if the composition shape changes.
3. `docs/canon/result-writing-canon.md` — append a CC-052 amendment paragraph noting the Rule 2 implementation pattern.
4. `docs/audits/report-calibration-audit-2026-04-29.md` — mark the 12 GIFT_DESCRIPTION entries as resolved by CC-052; keep the other 20 Rule 2 violations open for follow-on rewrite CCs.

Nothing else. Specifically:

- **No changes to `GIFT_NOUN_PHRASE` / `GROWTH_EDGE_TEXT` / `BLIND_SPOT_TEXT_VARIANTS`** — those are different prose surfaces, addressed by other rewrite CCs.
- **No changes to `pickGiftCategory` or `categoryHasSupport`** — gift-category routing logic is untouched; CC-052 only changes how the routed category's prose renders.
- **No changes to the 12 `GiftCategory` keys** (Pattern, Precision, Stewardship, Action, Harmony, Integrity, Builder, Advocacy, Meaning, Endurance, Discernment, Generativity).
- **No new gift categories.**
- **No engine logic changes.**
- **No changes to `lib/workMap.ts` or `lib/loveMap.ts`** prose — those Rule 2 violations land in their own follow-on CCs (CC-044-prose handles loveMap; a similar workMap-prose CC handles workMap).

---

## The locked architecture

Each of the 12 gift categories gets a TWO-SENTENCE composition:

```
[Sentence 1: generic register-naming, pre-CC-052 GIFT_DESCRIPTION text]
[Sentence 2: user-specific anchor, NEW]
```

Sentence 2 is selected based on the **discriminating signal pattern** that fired the category. Each category has 2-4 candidate signal patterns; the user's actual signal pattern selects which Sentence 2 fires.

### Locked content per category

Format: each entry shows the existing Sentence 1 (preserved verbatim), plus 2-4 conditional Sentence 2 options keyed to discriminating signal patterns. The composition logic selects the matching Sentence 2 based on which signals fired the category route in `pickGiftCategory`.

#### 1. Pattern (Ne / Ni dominants — default fallback)

**Sentence 1 (preserved):** *"you tend to see the deeper shape of a problem before it becomes obvious to others"*

**Sentence 2 candidates:**

- **Ni-dominant + faith_priority OR knowledge_priority high** → *"For your shape, this expresses as long-arc anticipation — reading where this is heading three years out, not three weeks."*
- **Ne-dominant + freedom_priority OR learning_energy_priority high** → *"For your shape, this expresses as breadth-of-frame — pattern-matching across many possibilities, finding the connection others didn't think to look for."*
- **Ne or Ni dominant, no top-priority discriminator** → *"For your shape, this expresses as the seeing-before-naming move — the sense that a structure is forming before you can fully articulate why."*

#### 2. Precision (Ti dominant — default fallback)

**Sentence 1 (preserved):** *"you tend to clarify what's actually being claimed before the conversation moves"*

**Sentence 2 candidates:**

- **Ti-dominant + truth_priority OR knowledge_priority high** → *"For your shape, this expresses as definitional discipline — refusing the comfortable fuzz of words that mean different things to different people."*
- **Ti-dominant + creator-agency OR system_responsibility_priority high** → *"For your shape, this expresses as system-level diagnosis — locating the load-bearing claim that the rest of the structure depends on."*
- **Ti-dominant, no discriminator** → *"For your shape, this expresses as the clarity-before-action instinct — the sense that an unclear claim is worse than no claim at all."*

#### 3. Stewardship (Si dominant — default fallback)

**Sentence 1 (preserved):** *"you tend to preserve what matters across time, especially when others are looking past it"*

**Sentence 2 candidates:**

- **Si-dominant + family_priority OR loyalty_priority high** → *"For your shape, this expresses as keeping faith with the people and commitments that have earned your continuity."*
- **Si-dominant + stability_priority OR honor_priority high** → *"For your shape, this expresses as guarding the standards that hold even when conditions change — the patterns that earned their persistence."*
- **Si-dominant, no discriminator** → *"For your shape, this expresses as the long memory of what has actually worked, applied to what's being asked of you now."*

#### 4. Action (Se dominant — default fallback)

**Sentence 1 (preserved):** *"you tend to move when others freeze, and to learn by engaging the situation as it actually is"*

**Sentence 2 candidates:**

- **Se-dominant + freedom_priority high** → *"For your shape, this expresses as the refusal to wait for permission — moving toward the live edge of the situation rather than rehearsing the meta."*
- **Se-dominant + creator-agency OR justice_priority high** → *"For your shape, this expresses as embodied advocacy — showing up physically for what's owed, not just naming it."*
- **Se-dominant, no discriminator** → *"For your shape, this expresses as the body-as-instrument move — knowing the situation by being in it, not above it."*

#### 5. Harmony (Fe dominant — default fallback)

**Sentence 1 (preserved):** *"you tend to read the room and tend to what the moment is asking of those present"*

**Sentence 2 candidates:**

- **Fe-dominant + family_priority OR faith_priority high** → *"For your shape, this expresses as the keeper of the connective tissue — noticing what holds the people you love together and tending it before it frays."*
- **Fe-dominant + compassion_priority OR mercy_priority high** → *"For your shape, this expresses as soft strength — the patience to hold someone where they are while believing in who they're becoming."*
- **Fe-dominant, no discriminator** → *"For your shape, this expresses as relational attunement — the sense that the room is asking something specific, even when no one is naming it."*

#### 6. Integrity (Fi dominant — default fallback)

**Sentence 1 (preserved):** *"you tend to refuse compromises that would betray your own sense of what's right"*

**Sentence 2 candidates:**

- **Fi-dominant + truth_priority OR honor_priority high** → *"For your shape, this expresses as the unflinching anchor — values lived through quiet refusals rather than declarations."*
- **Fi-dominant + faith_priority OR justice_priority high** → *"For your shape, this expresses as costly conviction — willing to bear the price for what your inner compass calls true."*
- **Fi-dominant, no discriminator** → *"For your shape, this expresses as the inner compass that doesn't bend to social weather — what's true to you stays true regardless of who's in the room."*

#### 7. Builder (Te dominant + creator/system signals — conditional)

**Sentence 1 (preserved):** *"you tend to turn ideas into working systems and to push past friction toward a result"*

**Sentence 2 candidates:**

- **Te-dominant + creator-agency + Ni-aux** → *"For your shape, this expresses as the long-arc architect — building the structure the future shape requires, not the structure the present demands."*
- **Te-dominant + creator-agency + Si-aux** → *"For your shape, this expresses as the institutional builder — running what must keep working through standards, precedent, and operational trust."*
- **Te-dominant + system_responsibility_priority high** → *"For your shape, this expresses as the system-level fix — locating the layer of the structure where intervention will hold and applying it there."*
- **Te-dominant, no discriminator** → *"For your shape, this expresses as the move-toward-shipped instinct — friction is information, not a stop sign."*

#### 8. Advocacy (justice + responsibility signals — conditional)

**Sentence 1 (preserved):** *"you tend to notice what's owed and to protect those who can't protect themselves"*

**Sentence 2 candidates:**

- **Justice_priority high + system_responsibility_priority + individual_responsibility_priority both top** → *"For your shape, this expresses as structural-with-accountability — looking for the accountable actor inside the system, not instead of the system."*
- **Justice_priority + Fi or Fe dominant** → *"For your shape, this expresses as the values-rooted defense — what's owed is felt before it's argued, and the argument follows the felt sense."*
- **Justice_priority, no other discriminator** → *"For your shape, this expresses as the noticing-what's-missing instinct — seeing the absent voice in the room before others realize it's absent."*

#### 9. Meaning (Ni dominant + faith — conditional)

**Sentence 1 (preserved):** *"you tend to connect what's happening to what it might mean over the longer arc"*

**Sentence 2 candidates:**

- **Ni-dominant + faith_priority high** → *"For your shape, this expresses as the orienting trust — faith that doesn't replace agency but oriented the agency you exercise."*
- **Ni-dominant + Fe-aux + family_priority OR loyalty_priority high** → *"For your shape, this expresses as the seer of becoming — holding what someone or something is growing into, not just what it is now."*
- **Ni-dominant, no other discriminator** → *"For your shape, this expresses as the long-arc read — the sense that this moment is connected to a longer pattern that hasn't fully revealed itself."*

#### 10. Endurance (Si dominant + high weather — conditional)

**Sentence 1 (preserved):** *"you tend to keep functioning under load that would unseat others"*

**Sentence 2 candidates:**

- **Si-dominant + weather.intensifier === "high"** → *"For your shape, this expresses as the carrier-of-load — staying functional in conditions that would have broken a different shape, often without naming the cost."*
- **stability_priority high + weather.load !== "low"** → *"For your shape, this expresses as the steady-presence move — what others read as resilience is often the discipline of not flinching when flinching would help."*
- **Si or Endurance-routing condition, no specific discriminator** → *"For your shape, this expresses as continuity-under-pressure — the move that keeps the load distributed across time so it doesn't crack the shape carrying it."*

#### 11. Discernment (Ti or Ni dominant + truth/cost — conditional)

**Sentence 1 (preserved):** *"you tend to detect what doesn't add up before it surfaces openly"*

**Sentence 2 candidates:**

- **Ti or Ni dominant + truth_priority + fire.willingToBearCost** → *"For your shape, this expresses as anomaly-detection across moral, strategic, and linguistic patterns — noticing when language doesn't match reality, when an incentive doesn't match a stated objective, when a structure can't produce a promised outcome."*
- **Ti-dominant + truth_priority OR knowledge_priority high** → *"For your shape, this expresses as logical-coherence checking — the move that asks whether the system being claimed is actually consistent with itself."*
- **Ni-dominant + Ne-aux** → *"For your shape, this expresses as triangulation across many frames — pattern-matching that holds multiple possibilities at once and tests each against the one being claimed."*

#### 12. Generativity (Te aspiration + relational/stability/exploration — conditional)

**Sentence 1 (preserved):** *"you tend to help others become more capable rather than more dependent"*

**Sentence 2 candidates:**

- **Te-dominant + agency.aspiration === "relational"** → *"For your shape, this expresses as the developer of others — taking on someone's growth as part of your own work, expecting them to outgrow your scaffolding."*
- **Ne-dominant + Fi-aux (the catalyst register)** → *"For your shape, this expresses as the inviter — naming what someone could become and offering the invitation in a way that honors what's true to them."*
- **Te-dominant + agency.aspiration in {stability, exploration}** → *"For your shape, this expresses as the equipping move — making others more capable in the registers they choose, not the registers you'd choose for them."*

---

## Composition rule

The two sentences render together as a single coherent paragraph in user-facing prose. Format:

```
[Sentence 1, no leading qualifier]
[Sentence 2, prefixed with "For your shape, this expresses as " — preserves the rhetorical move]
```

Combined example for Jason0429's Discernment gift (post-CC-052):

> *"You tend to detect what doesn't add up before it surfaces openly. For your shape, this expresses as anomaly-detection across moral, strategic, and linguistic patterns — noticing when language doesn't match reality, when an incentive doesn't match a stated objective, when a structure can't produce a promised outcome."*

Compare to pre-CC-052:

> *"You tend to detect what doesn't add up before it surfaces openly."*

The first sentence stays generic-readable (it works for any user landing on Discernment). The second sentence anchors to *this* user's signal pattern. The composition reads as observation, not horoscope.

---

## The selection logic

When `topGiftsForMirror` (or whatever composes the Top 3 Gifts) reaches a gift category, it now reads:

1. The user's `LensStack` (dominant + auxiliary).
2. The user's `topCompass` signals.
3. The user's `topGravity` signals.
4. The user's `agency` (current + aspiration).
5. The user's `weather` (load + intensifier).
6. The user's `fire` (willingToBearCost).

These are the same inputs `pickGiftCategory` already uses. CC-052 reuses them at the prose-composition step.

For each gift category, the selector walks the candidate Sentence 2 conditions in priority order (the top of each category's list above is the most-specific condition; the bottom is the no-discriminator fallback). The first matching condition's Sentence 2 fires.

```ts
function getGiftSpecificity(
  category: GiftCategory,
  stack: LensStack,
  topCompass: SignalRef[],
  topGravity: SignalRef[],
  agency: AgencyPattern,
  weather: WeatherLoad,
  fire: FirePattern
): string {
  const dom = stack.dominant;
  const aux = stack.auxiliary;
  const has = (id: SignalId) => topCompass.some((r) => r.signal_id === id);
  const hasG = (id: SignalId) => topGravity.some((r) => r.signal_id === id);

  switch (category) {
    case "Pattern":
      if (dom === "ni" && (has("faith_priority") || has("knowledge_priority"))) {
        return "For your shape, this expresses as long-arc anticipation — reading where this is heading three years out, not three weeks.";
      }
      if (dom === "ne" && (has("freedom_priority") || has("learning_energy_priority"))) {
        return "For your shape, this expresses as breadth-of-frame — pattern-matching across many possibilities, finding the connection others didn't think to look for.";
      }
      return "For your shape, this expresses as the seeing-before-naming move — the sense that a structure is forming before you can fully articulate why.";

    case "Precision":
      // ... per the locked content per category ...

    // ... 10 more categories ...
  }
}
```

The function is locked structurally. The locked content per category above provides the candidate sentences and their conditions verbatim. The implementation language (switch / if-chain / Map lookup) is the executor's choice.

---

## Steps

### 1. Read existing `GIFT_DESCRIPTION` and its callers

Grep for `GIFT_DESCRIPTION` across `lib/` and `app/`. Identify:
- Where it's defined (`lib/identityEngine.ts:2114` per audit)
- Where it's read (Top 3 Gifts composition, possibly Mirror prose, possibly Synthesis)

### 2. Decide composition implementation

Two options per the architecture section:
- **Option A:** Split into `GIFT_DESCRIPTION_GENERIC` (12 entries — preserves existing `GIFT_DESCRIPTION` structure) + `GIFT_DESCRIPTION_SPECIFIC` (selector function returning the user-specific second sentence). Composition at call site reads both and joins.
- **Option B:** Refactor `GIFT_DESCRIPTION` into a function that takes signal context and returns the full two-sentence prose.

Option A is more conservative (preserves existing structure as a default fallback if the selector function fails). Option B is cleaner architecturally.

Either is acceptable. Surface the choice in Report Back.

### 3. Implement the selector function

Author the function (or split-map equivalent) per the locked content. All 12 gift categories must have at least one Sentence 2 fire condition; the no-discriminator fallback is the safety net.

### 4. Wire the composition into the Top 3 Gifts render path

Find the composition site (likely `topGiftsForMirror` or equivalent in `lib/identityEngine.ts`). Replace the existing `GIFT_DESCRIPTION[category]` lookup with the two-sentence composition.

### 5. Update canon doc

Append CC-052 amendment paragraph to `docs/canon/result-writing-canon.md` § Report Calibration Canon § Rule 2:

> *CC-052 (2026-04-30) implements Rule 2 for the GIFT_DESCRIPTION subset (12 entries × 2-4 candidate Sentence 2 options each). The composition pattern is `[generic register-naming first sentence]. For your shape, this expresses as [user-specific anchor].` Future Rule 2 implementations (THESIS_FALLBACK, lib/workMap.ts, lib/loveMap.ts) follow the same architectural pattern with surface-specific Sentence 2 candidate logic. The audit document at docs/audits/report-calibration-audit-2026-04-29.md marks the 12 GIFT_DESCRIPTION entries as resolved by CC-052; other Rule 2 surfaces remain open for follow-on rewrite CCs.*

### 6. Update audit document

In `docs/audits/report-calibration-audit-2026-04-29.md`, find the GIFT_DESCRIPTION findings (12 entries under Rule 2). Mark each as resolved by CC-052 (e.g., add a status column or strikethrough with "Resolved CC-052").

### 7. Verification

- `npx tsc --noEmit` exits 0.
- `npm run lint` passes.
- `npm run build` exits 0 (fourth consecutive clean build post-CODEX-049).
- Manual: load Jason0429's saved session in admin (per CODEX-050's live-engine render). Confirm:
  - Top 3 Gifts now render the two-sentence composition.
  - For Jason0429 specifically (NiTe register, top values include Knowledge): Discernment gift renders the *"anomaly-detection across moral, strategic, and linguistic patterns..."* anchor (the most-specific Discernment condition matches).
  - Pattern gift renders the long-arc-anticipation anchor (Ni-dominant + knowledge_priority match).
  - Other 10 categories' fallbacks are reachable (test by walking minimal-config users in mental model).

### 8. Browser smoke (Jason verifies)

Three sessions in the admin re-render mode:
- Jason0429 — confirm Discernment + Pattern + Integrity render the most-specific Sentence 2 conditions.
- Any FeSi-dominant + family-priority session — confirm Harmony renders the *"keeper of connective tissue"* anchor.
- Any Ti-dominant + truth-priority session — confirm Precision renders the *"definitional discipline"* anchor.

---

## Acceptance

- `lib/identityEngine.ts` `GIFT_DESCRIPTION` (or its successor) composes two-sentence prose with the user-specific Sentence 2 selected by signal context.
- All 12 gift categories have at least 2-4 candidate Sentence 2 conditions per the locked content above.
- The composition site (Top 3 Gifts render path) consumes the new composition.
- `docs/canon/result-writing-canon.md` carries the CC-052 amendment paragraph.
- `docs/audits/report-calibration-audit-2026-04-29.md` marks the 12 GIFT_DESCRIPTION findings as resolved.
- `git diff --stat` shows changes only in named files.
- `npx tsc --noEmit` exits 0. `npm run lint` passes. `npm run build` succeeds.
- Manual sweep confirms the most-specific Sentence 2 fires for Jason0429's Discernment / Pattern / Integrity gifts.

---

## Out of scope

If you find yourself doing any of these, stop and flag — they belong elsewhere:

- **Rewriting Sentence 1 (the existing generic GIFT_DESCRIPTION text).** All 12 generic sentences stay verbatim. Sentence 2 is the new addition.
- **Adding new gift categories or removing existing ones.** The 12-category set is canonical.
- **Changing `pickGiftCategory` or `categoryHasSupport` routing logic.** This CC only changes the prose at the selected category, not which category gets selected.
- **Editing `GIFT_NOUN_PHRASE`, `GROWTH_EDGE_TEXT`, `BLIND_SPOT_TEXT_VARIANTS`, `SHAPE_CARD_PRACTICE_TEXT`, `SHAPE_CARD_PATTERN_NOTE`.** These are different prose surfaces; their Rule 2 (and Rule 3) violations get their own follow-on CCs.
- **Editing `lib/workMap.ts` or `lib/loveMap.ts` prose.** Rule 2 violations there get separate follow-on CCs (workMap-prose and CC-044-prose respectively).
- **Editing `THESIS_TEMPLATES` or `THESIS_FALLBACK_BY_FUNCTION`.** Different Rule 2 surface; separate CC.
- **Authoring more than the locked candidate Sentence 2 options per category.** v1 ships with 2-4 candidates per category; future workshop CCs can expand.
- **Changing the *"For your shape, this expresses as"* prefix.** It's the locked composition pattern; preserves rhetorical-move parallelism with the audit's adherence example.
- **Adding cross-references between gift categories and other layers (OCEAN, Drive, etc.).** Future cross-reference CCs.
- **Modifying canon docs beyond `result-writing-canon.md` § Rule 2 amendment and `audit-2026-04-29.md` resolution markings.**

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

This is a CC-prefixed prompt (not CODEX-) because the editorial-judgment density is meaningful — the executor needs to verify that each candidate Sentence 2 reads coherently in composition with the existing Sentence 1, that the conditions fire for plausible user shapes, and that the prose tone matches the surrounding result-writing canon. Codex could execute it, but the tone-sensitivity weighs toward Claude Code.

## Execution Directive

Single pass. The 12 categories' locked Sentence 2 candidates and conditions are content; preserve verbatim. The architectural choice (split-map vs function) has executor latitude. Surface in Report Back if any candidate Sentence 2 reads obviously off in composition with its Sentence 1 — flag, don't silently rewrite. **Move prompt to `prompts/completed/` when shipped.**

## Bash Commands Authorized

- `grep -rn "GIFT_DESCRIPTION\|topGiftsForMirror\|pickGiftCategory" lib/ app/`
- `cat <file>` (verifying changes)
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` (smoke; kill before exiting)
- `mv prompts/active/CC-052-gift-specificity-rewrite.md prompts/completed/CC-052-gift-specificity-rewrite.md`
- `git diff --stat`
- `git status`

## Read First (Required)

- `AGENTS.md`
- `lib/identityEngine.ts` `GIFT_DESCRIPTION` (line ~2114), `GIFT_NOUN_PHRASE` (line ~2099), `pickGiftCategory` (line ~1691), `categoryHasSupport`, `topGiftsForMirror` (or wherever Top 3 Gifts compose).
- `lib/identityEngine.ts` `LensStack`, `AgencyPattern`, `WeatherLoad`, `FirePattern` types.
- `docs/canon/result-writing-canon.md` § Report Calibration Canon § Rule 2 (CC-048's locked rule definition).
- `docs/audits/report-calibration-audit-2026-04-29.md` § GIFT_DESCRIPTION findings.
- `prompts/completed/CC-038-prose.md` for the canon principle precedent (single-word labels + composition pattern).

## Allowed to Modify

- `lib/identityEngine.ts`
- `docs/canon/result-writing-canon.md`
- `docs/audits/report-calibration-audit-2026-04-29.md`

**No other files.** No test files, no other prose surfaces, no admin route, no rendering components.

## Report Back

1. **Architectural choice** — Option A (split-map) or Option B (function), with one-line justification.
2. **Files modified** with line counts.
3. **Verification results** — tsc, lint, build outputs.
4. **Manual sweep** — Jason0429's three gift categories' Sentence 2 outputs, confirming most-specific conditions fired.
5. **Any candidate Sentence 2 that read obviously off** during code review — flag for editorial follow-up.
6. **Out-of-scope drift caught** — anything considered and rejected.
7. **Browser smoke deferred to Jason** — three-session check.
8. **Audit doc resolution markings** — confirm 12 GIFT_DESCRIPTION findings marked resolved.
9. **Prompt move-to-completed confirmation**.

---

## Notes for the executing engineer

- The 12 gift-category locked Sentence 2 candidates were authored in the prompt against the canon principle in CC-048's Rule 2. Treat the candidates as content (preserve verbatim) unless one reads obviously off in composition — surface in Report Back, don't silently revise.
- The conditions per candidate are based on signal patterns that already fire in the engine (`pickGiftCategory`'s logic uses the same inputs). The selector function's predicate logic should mirror `pickGiftCategory`'s structure for consistency.
- The no-discriminator fallback per category is a safety net — every user landing on a gift category gets *some* Sentence 2, even if their signal pattern is sparse. Don't return empty string or null from the selector.
- The *"For your shape, this expresses as"* prefix is canonical. The rhetorical move is: generic-claim → specific-anchor. Future Rule 2 implementations on other surfaces should follow the same prefix pattern (THESIS_FALLBACK, lib/workMap.ts, lib/loveMap.ts).
- Pre-CC-052 saved sessions: re-rendering picks up the new composition automatically when the engine re-runs. No migration needed. Admin live-engine renders show the updated prose; pre-CC-052 stored snapshots (if any) keep the old text.
- The audit document marking convention is up to the executor — strikethrough with annotation, status column added, separate "Resolved" section appended, etc. As long as the 12 GIFT_DESCRIPTION findings are clearly marked as closed by CC-052 and traceable.
- This is the first rewrite-track CC. Subsequent rewrite CCs (CC-053+) follow the same pattern: read the audit, address one cluster of findings, lock content per category/surface, ship. Pace is deliberate — small CCs are reviewable; large CCs are not.
