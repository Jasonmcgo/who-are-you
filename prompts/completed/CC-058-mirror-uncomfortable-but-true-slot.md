# CC-058 — Mirror Layer Uncomfortable-but-True Slot (CC-048 audit Rule 5 implementation)

**Type:** Editorial implementation landing in code. New structural slot in the Mirror layer that emits a per-user *uncomfortable-but-true* sentence composed from the user's strongest aspiration-vs-current tension. **Locked content per cross-signal pattern.** No new questions, no new signals, no new measurement surface — derivation composes the sentence from the existing signal portfolio per the minimal-questions canon.
**Goal:** Stop the Mirror layer from reading as flattering-throughout (Clarence's 2026-04-29 critique). Every report that has enough cross-signal data emits exactly one observation the reader recognizes as probably true but doesn't enjoy reading. Composed from the strongest signal-derived aspiration-vs-current tension; selected from 8 locked candidate sentences keyed to tension class. Silent (null, no slot rendered) when no tension condition matches a locked candidate — better silence than flat horoscope.
**Predecessors:** CC-048 (Report Calibration Canon — codified Rule 5 as the canon principle). CC-026 (Drive integration — supplies one of the three aspiration-vs-current input signals via `claimed_vs_revealed` Drive tension). CC-052 / CC-052b (Sentence 2 anchor architecture — the "lock template, key on cross-signals, fallback silent" pattern this CC inherits). CC-054 (Peace + Faith disambiguation — the cross-signal-interpretation-in-prose architectural pattern). CC-038-prose (aux-pair register `product_safe_sentence` — adjacent locked-anchor pattern).
**Successor:** CC-057a / CC-057b's polish layer is licensed to re-render the locked sentence in a warmer register per the Path C contract; the engine-emitted sentence is the locked anchor the polish layer composes against. Future rewrite-track CCs (Love Map polish, Allocation+Growth Edge, Trust+Responsibility, OCEAN-as-Texture) compose their own surfaces; this CC closes Rule 5 specifically.

---

## Why this CC

CC-048's audit found Rule 5 violations as a structural absence (one finding, not per-line) — the entire instrument lacks a slot that authors a per-user uncomfortable-but-true observation. Per the canon: *"every report needs at least one sentence the user may not enjoy reading but recognizes as probably true. Without this, the report becomes a 'flattering enough to share' artifact rather than a tool for self-knowledge."*

The Mirror layer's golden sentence (`shapeInOneSentence`) names the user's gift. The new slot, adjacent to the golden sentence, names the *cost or compromise the gift carries when the user isn't paying attention to it.* Two registers in tandem: gift, then the gift's shadow.

Clarence's two example sentences for Jason0429 set the canonical register:

- *"You can confuse having absorbed more context with having earned more authority to conclude."*
- *"You sometimes treat translation as optional because the pattern feels obvious to you."*

Both are observational, register-faithful, and clearly land for that specific user-shape. Neither could be a generic horoscope sentence. The slot's discipline: any user-facing sentence must be at this calibration level or null. **Silence is the canonical fallback.**

This CC is engine-side substance per the Path C contract (CC-057a). The polish layer (CC-057b) is licensed to re-render the locked sentence in a warmer register; the engine owns the sentence's substance and structural anchor. The locked sentences this CC ships are the polish-layer-immutable texts in the same class as CC-052's Sentence 2 anchors and CC-054's Peace/Faith disambiguation prose.

---

## Scope

Files modified:

1. **`lib/types.ts`** — extend `MirrorOutput` with optional field:
   - `uncomfortableButTrue?: string | null` — the locked sentence (or `null` for silent / no slot rendered).
   - Add type `UncomfortableButTrueClass = "context_vs_authority" | "pattern_vs_translation" | "claim_vs_allocation" | "conviction_vs_rigidity" | "builder_vs_pause" | "caretaker_vs_self" | "action_vs_direction" | "stewardship_vs_stagnation"` for the tension classifier.

2. **`lib/identityEngine.ts`** — three additions:
   - **New helper `getUncomfortableButTrue(constitution, ctx) → string | null`** (~150 lines including the locked content). Reads LensStack, aux-pair register, Drive output, Compass top, OCEAN distribution, and existing tension fires. Walks the 8 candidate conditions in priority order; first match wins. Returns `null` when no condition matches.
   - **New `UNCOMFORTABLE_BUT_TRUE_TEMPLATES` Record** keyed by `UncomfortableButTrueClass` mapping to the locked sentence string.
   - **Wire into `generateMirror`** — new line composes `uncomfortableButTrue: getUncomfortableButTrue(constitution, ctx)` into the returned `MirrorOutput`.

3. **`app/components/MirrorSection.tsx`** — render the new field immediately after the golden sentence (`shapeInOneSentence`) and before the Top 3 Gifts block. Gated on `mirror.uncomfortableButTrue !== null && mirror.uncomfortableButTrue?.length > 0` — silent rendering when the field is null/empty (no orphan whitespace, no section header, no separator). When present, renders as a single italicized paragraph with the same typography as `shapeInOneSentence` but in `--ink-mute` to signal the calibration-question register.

4. **`lib/renderMirror.ts`** — markdown export emits the uncomfortable-but-true sentence on its own paragraph immediately after the golden sentence, prefixed with the locked italic-paragraph marker (`*…*`). Same conditional-render gate; skip entirely when null.

5. **`lib/humanityRendering/contract.ts`** — extend `extractAnchors` so the locked uncomfortable-but-true sentence (when present) is added to the polish-layer's `lockedAnchors` array. This makes the new sentence preservable across the polish round-trip, exactly like CC-052's Sentence 2 anchors and CC-054's Peace/Faith disambiguation prose.

6. **`docs/canon/result-writing-canon.md`** — append a CC-058 amendment under § Rule 5 marking it RESOLVED, naming the helper function, and listing the 8 locked templates with their conditions.

7. **`docs/audits/report-calibration-audit-2026-04-29.md`** — mark Rule 5 (uncomfortable-but-true) as RESOLVED by CC-058.

Nothing else. Specifically:

- **No new questions.** The minimal-questions canon (`feedback_minimal_questions_maximum_output.md`) holds.
- **No new signals.** All signal reads are existing.
- **No new tagging tables.** No additions to `SIGNAL_DRIVE_TAGS`, `SIGNAL_OCEAN_TAGS`, etc.
- **No engine logic changes** beyond the new selector helper and its `MirrorOutput` wire-in.
- **No edits to `shapeInOneSentence` / golden-sentence prose** — the new slot is adjacent and additive.
- **No edits to the existing Mirror prose surfaces** (`corePattern`, `topGifts`, `topTraps`, `whatOthersMayExperience`, `whenTheLoadGetsHeavy`, `yourNext3Moves`).
- **No edits to other rewrite-track surfaces** (Allocation Gaps / Growth Edge / Trust / Responsibility / OCEAN). Those land in their own CCs.
- **No edits to the Drive `claimed_vs_revealed` tension** machinery — this CC reads the existing output; doesn't refactor the source.

---

## The locked content — 8 uncomfortable-but-true candidate sentences

Selection logic: walk the 8 conditions in priority order; first match wins. Returns `null` when none match.

The conditions read existing engine outputs (LensStack, FunctionPairRegister, Drive output, Compass top, OCEAN distribution, Tension array). No new derivations.

### 1. Context-vs-authority (Ni-dominant, long-arc-pattern-reader register)

**Condition:** `lensStack.dominant === "ni"` AND (`knowledge_priority` in Compass top 5 OR `truth_priority` in Compass top 5) AND aux-pair register's gift_category is `Pattern` or `Discernment`.

**Locked sentence (Clarence 2026-04-29):**

> *"You can confuse having absorbed more context with having earned more authority to conclude."*

### 2. Pattern-vs-translation (Ne or Ni dominant + breadth-of-frame; aux-pair driver-side carrying the read)

**Condition:** (`lensStack.dominant === "ne"` OR `lensStack.dominant === "ni"`) AND (`freedom_priority` in Compass top 5 OR `learning_energy_priority` rank ≤ 2 in Q-E1) AND condition #1 did NOT match.

**Locked sentence (Clarence 2026-04-29):**

> *"You sometimes treat translation as optional because the pattern feels obvious to you."*

### 3. Claim-vs-allocation (any user with the Drive `claimed_vs_revealed` tension firing strongly)

**Condition:** Drive `claimed_vs_revealed` tension firing with delta exceeding the existing threshold constant; OR an Allocation-class tension firing in `constitution.tensions[]` (the existing `Sacred Words vs Sacred Spending` / `Current and Aspirational Allocation` predicates).

**Locked sentence:**

> *"You can claim what you haven't yet allocated toward — and the gap between what you name and what your week actually pays for is part of your shape, not a verdict against it."*

### 4. Conviction-vs-rigidity (Fi-dominant + holds-internal-conviction firing)

**Condition:** `lensStack.dominant === "fi"` AND (`holds_internal_conviction` signal firing OR `truth_priority` in Compass top 3) AND aux-pair register's gift_category is `Integrity`.

**Locked sentence:**

> *"You can confuse what feels true to you with what is true — and the conviction that protects you from social weather is the same conviction that, in the wrong moment, refuses the correction you'd otherwise welcome."*

### 5. Builder-vs-pause (Te-dominant + creator-agency / system_responsibility patterns)

**Condition:** `lensStack.dominant === "te"` AND (`creator-agency` firing OR `system_responsibility_priority` in Compass top 5) AND aux-pair register's gift_category is `Builder`.

**Locked sentence:**

> *"You can build past the point where the structure has stopped serving the people inside it — and momentum can feel like rightness when it is sometimes just inertia."*

### 6. Caretaker-vs-self (Fe-dominant + caring-energy + family_priority)

**Condition:** `lensStack.dominant === "fe"` AND (`family_priority` in Compass top 5 OR `caring_energy_priority` rank ≤ 2 in Q-E1) AND aux-pair register's gift_category is `Harmony`.

**Locked sentence:**

> *"You can carry the room until the people in it stop seeing what carrying it costs you — and your read of what others need can quietly displace your read of what you need."*

### 7. Action-vs-direction (Se-dominant + freedom_priority)

**Condition:** `lensStack.dominant === "se"` AND (`freedom_priority` in Compass top 5 OR `restoring_energy_priority` rank ≤ 2 in Q-E1) AND aux-pair register's gift_category is `Action`.

**Locked sentence:**

> *"You can mistake speed for direction — the body knows the situation by being in it, and that knowing can sometimes outrun the question of whether the situation is worth being in."*

### 8. Stewardship-vs-stagnation (Si-dominant + stability_priority + honor_priority)

**Condition:** `lensStack.dominant === "si"` AND (`stability_priority` in Compass top 5 OR `honor_priority` in Compass top 5) AND aux-pair register's gift_category is `Stewardship`.

**Locked sentence:**

> *"You can mistake guarding what you've kept for refusing what you'd grow into — and continuity, which is your real gift, can quietly become the reason a needed change doesn't happen."*

### 9. Fallback (no condition matched)

Return `null`. The slot renders silently — no sentence, no header, no separator. Better silence than flat.

---

## The locked tone register

Each candidate sentence is calibrated to:

- **Observational, not condemning.** "You can…" / "You sometimes…" — names the pattern's failure mode without indicting the user.
- **Adjacent to the gift, not opposite to it.** Each sentence names the cost or compromise the *gift itself* carries when the user isn't paying attention to it. Per the canon: *"Your blind spot is not the opposite of your gift. It is your gift without balance."*
- **One sentence, one breath.** Length capped at ~25 words; one main clause + one optional dependent clause. Resists over-explaining.
- **No second-person possessive used as third-person stand-in.** Per Rule 7 / CC-047, never "Jason0429 can confuse…" — always "You can…"

These tones are locked. Tonal calibration of any individual template surfaces in Report Back rather than silently revised. The polish layer (CC-057b) is licensed to add adjacent prose that softens the landing if the user-shape would benefit; it cannot edit the locked sentence itself.

---

## Selector function shape (locked)

```ts
// lib/identityEngine.ts (new helper, near generateMirror)

export function getUncomfortableButTrue(
  constitution: InnerConstitution,
  ctx: GeneratorContext
): string | null {
  const stack = constitution.lens_stack;
  const dom = stack.dominant;
  const auxPairRegister = getFunctionPairRegister(stack); // existing accessor
  const giftCategory = auxPairRegister?.gift_category;
  const topCompass = topCompassRefs(constitution); // existing helper
  const driveOutput = constitution.drive; // existing field
  const tensions = constitution.tensions;
  const signals = constitution.signals;
  const ocean = constitution.ocean;

  // Walk the 8 conditions in priority order. First match wins.

  // 1. Context-vs-authority (Ni-dominant, long-arc-pattern-reader)
  if (
    dom === "ni" &&
    (signalRankAtMost(topCompass, "knowledge_priority", 5) ||
      signalRankAtMost(topCompass, "truth_priority", 5)) &&
    (giftCategory === "Pattern" || giftCategory === "Discernment")
  ) {
    return UNCOMFORTABLE_BUT_TRUE_TEMPLATES.context_vs_authority;
  }

  // 2. Pattern-vs-translation (Ne or Ni + breadth-of-frame)
  if (
    (dom === "ne" || dom === "ni") &&
    (signalRankAtMost(topCompass, "freedom_priority", 5) ||
      energyRankAtMost(signals, "learning_energy_priority", 2))
  ) {
    return UNCOMFORTABLE_BUT_TRUE_TEMPLATES.pattern_vs_translation;
  }

  // 3. Claim-vs-allocation (Drive claimed_vs_revealed OR Allocation tension fires)
  if (
    driveTensionFiringStrongly(driveOutput) ||
    allocationTensionFiring(tensions)
  ) {
    return UNCOMFORTABLE_BUT_TRUE_TEMPLATES.claim_vs_allocation;
  }

  // 4. Conviction-vs-rigidity (Fi-dominant + Integrity)
  if (
    dom === "fi" &&
    (signalFiring(signals, "holds_internal_conviction") ||
      signalRankAtMost(topCompass, "truth_priority", 3)) &&
    giftCategory === "Integrity"
  ) {
    return UNCOMFORTABLE_BUT_TRUE_TEMPLATES.conviction_vs_rigidity;
  }

  // 5. Builder-vs-pause (Te-dominant + Builder)
  if (
    dom === "te" &&
    (signalFiring(signals, "creator-agency") ||
      signalRankAtMost(topCompass, "system_responsibility_priority", 5)) &&
    giftCategory === "Builder"
  ) {
    return UNCOMFORTABLE_BUT_TRUE_TEMPLATES.builder_vs_pause;
  }

  // 6. Caretaker-vs-self (Fe-dominant + Harmony)
  if (
    dom === "fe" &&
    (signalRankAtMost(topCompass, "family_priority", 5) ||
      energyRankAtMost(signals, "caring_energy_priority", 2)) &&
    giftCategory === "Harmony"
  ) {
    return UNCOMFORTABLE_BUT_TRUE_TEMPLATES.caretaker_vs_self;
  }

  // 7. Action-vs-direction (Se-dominant + Action)
  if (
    dom === "se" &&
    (signalRankAtMost(topCompass, "freedom_priority", 5) ||
      energyRankAtMost(signals, "restoring_energy_priority", 2)) &&
    giftCategory === "Action"
  ) {
    return UNCOMFORTABLE_BUT_TRUE_TEMPLATES.action_vs_direction;
  }

  // 8. Stewardship-vs-stagnation (Si-dominant + Stewardship)
  if (
    dom === "si" &&
    (signalRankAtMost(topCompass, "stability_priority", 5) ||
      signalRankAtMost(topCompass, "honor_priority", 5)) &&
    giftCategory === "Stewardship"
  ) {
    return UNCOMFORTABLE_BUT_TRUE_TEMPLATES.stewardship_vs_stagnation;
  }

  // No condition matched — silent.
  return null;
}
```

The helper signatures (`signalRankAtMost`, `energyRankAtMost`, `signalFiring`, `topCompassRefs`, `driveTensionFiringStrongly`, `allocationTensionFiring`) reuse existing patterns. Where an existing helper covers the read, use it. Where one doesn't, add a small one near `getUncomfortableButTrue` — one helper per missing accessor, kept private to the module.

`UNCOMFORTABLE_BUT_TRUE_TEMPLATES` is a `Record<UncomfortableButTrueClass, string>` mapping each class key to the locked sentence verbatim from this prompt.

---

## Render specification

### On-page (`MirrorSection.tsx`)

Position: immediately after `shapeInOneSentence` rendering, immediately before the `Top 3 Gifts` block.

```tsx
{mirror.uncomfortableButTrue ? (
  <p
    style={{
      ...existingMirrorParagraphStyle,
      fontStyle: "italic",
      color: "var(--ink-mute)",
      marginTop: 12,
      marginBottom: 12,
    }}
  >
    {mirror.uncomfortableButTrue}
  </p>
) : null}
```

Typography: same as the surrounding paragraph weight; italic + ink-mute signals the calibration-question register. No section header, no separator rule, no decorative element. The sentence stands alone as a single paragraph.

If `mirror.uncomfortableButTrue` is `null` or empty, render nothing — no orphan whitespace, no decoration.

### Markdown export (`renderMirror.ts`)

Position: immediately after the golden sentence emit, immediately before the Top 3 Gifts emit.

```ts
out.push("");
if (mirror.uncomfortableButTrue && mirror.uncomfortableButTrue.length > 0) {
  out.push(`*${mirror.uncomfortableButTrue}*`);
  out.push("");
}
```

Italic markdown wrap (`*…*`) preserves the calibration-register cue across surfaces.

---

## Polish-layer integration

Per the Path C contract (`docs/canon/humanity-rendering-layer.md`), `mirror.uncomfortableButTrue` is engine-owned. The polish layer (CC-057b) reads it as part of `EngineRenderedReport`, treats it as a `lockedAnchor`, and is forbidden from editing it. The polish layer may add adjacent prose (a softening sentence after, or a connecting transition before) but cannot rewrite the locked sentence itself.

Implementation: extend `lib/humanityRendering/contract.ts § extractAnchors` so that when `mirror.uncomfortableButTrue` is non-null, its content joins the `lockedAnchors` array. The validation pass in `lib/humanityRendering/validation.ts` then catches any polish-layer drift on the new anchor automatically — no validation-pass edits required beyond the contract extraction.

---

## Acceptance

- `npx tsc --noEmit` clean.
- `npm run lint` clean.
- `npm run build` exits 0.
- Re-rendered Jason0429 (admin route per CODEX-050) shows the uncomfortable-but-true sentence as one of the two condition-1-or-2 sentences (Jason0429 is Ni-dominant + knowledge/truth top + Pattern aux-pair → condition 1 fires; sentence renders).
- A test session with no matching condition (e.g., a thin-signal session) renders no slot — `mirror.uncomfortableButTrue === null`, no orphan whitespace.
- Markdown export carries the same conditional rendering.
- The locked sentences ship verbatim — no paraphrasing, no tonal "improvement."
- The new field is null-safe at every read site (server-render, client-render, markdown export, polish-layer contract).
- Polish-layer round-trip (when API keys set) preserves the new anchor verbatim — validation pass returns `failedCheck: "anchor"` if the polish output edits the sentence.

---

## Out of scope

- **Rewriting any of the 8 locked sentences.** Locked content. Tonal-calibration tweaks land in a follow-on (CC-058-prose) only if browser-smoke + Clarence review surface a specific landing problem.
- **Adding more candidate sentences** beyond the 8 locked. Future CC may extend per cross-reference patterns (aux-pair × dominant; OCEAN × Compass; etc.); CC-058 ships the v1 floor.
- **Per-user variation within a class.** All Ni-dominant + knowledge/truth + Pattern users get the same condition-1 sentence. Future CC may compose per-user variation; not now.
- **Adding a fallback generic sentence.** Per the canon, silence is the fallback. Don't add a "you may sometimes…" generic when no condition matches; render `null`.
- **Touching the existing golden sentence.** `shapeInOneSentence` is unchanged; the new slot sits adjacent.
- **Touching `pickGiftCategory`, `categoryHasSupport`, `getGiftSpecificity`** — gift-category routing logic untouched; CC-058 reads the routed gift_category but doesn't rewire it.
- **Touching the polish layer's locked system prompt.** The polish layer's prompt already names "every locked Sentence 2 anchor string the engine emitted" via `lockedAnchors`; the new anchor flows through that mechanism without prompt edits.
- **MVP product-vision work** (auth/account/PDF/newsletter/share/population). Out of scope per `project_mvp_product_vision.md`.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

This CC is filed CC- per the routing convention because the work is multi-file, the locked content is editorial-judgment-adjacent (sentences that need to land tonally), and integration with the polish-layer contract requires understanding both surfaces. Claude Code is the intended executor.

## Execution Directive

Single pass. **All 8 locked sentences ship verbatim from this prompt's locked content.** If the executor encounters a structural reason a condition can't be wired cleanly (e.g., an existing helper has a different signature than the prompt assumes, or a signal name has drifted from the prompt's reference), surface in Report Back rather than rewriting the condition or the sentence. Read `lib/types.ts` `FunctionPairKey` casing convention (PascalCase per `feedback_pair_key_casing_canon.md`) before authoring any pair-key conditional. Read the existing CC-052 / CC-054 selector helpers for the canonical pattern. **Move prompt to `prompts/completed/` when done.**

## Bash Commands Authorized

- `grep -rn "shapeInOneSentence\|MirrorOutput\|generateMirror\|getGiftCategory\|topCompassRefs\|signalRankAtMost\|energyRankAtMost" lib/ app/`
- `grep -rn "claimed_vs_revealed\|allocationTension\|driveTension" lib/`
- `cat lib/types.ts | grep -E "MirrorOutput|FunctionPairKey|GiftCategory"`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` (smoke; kill before exit)
- `mv prompts/active/CC-058-mirror-uncomfortable-but-true-slot.md prompts/completed/CC-058-mirror-uncomfortable-but-true-slot.md`
- `git diff --stat`
- `git status`

## Read First (Required)

- `AGENTS.md`.
- `docs/canon/result-writing-canon.md` — § Rule 5 (full canon text), § Rule 7 (name resolution rule the new sentence inherits), the CC-052 / CC-054 amendments (locked-anchor pattern this CC follows).
- `docs/audits/report-calibration-audit-2026-04-29.md` — Rule 5 finding section.
- `docs/canon/humanity-rendering-layer.md` — engine ownership of the new anchor; polish layer immutability.
- `docs/canon/output-engine-rules.md` — § "CC-057a — Derivation runs before polish" for the engine/polish boundary; § Rule 5 for the existing Growth Edge derivation pattern (different rule, different surface; named for context).
- `lib/types.ts` — `MirrorOutput`, `LensStack`, `FunctionPairKey` (PascalCase canonical), `GiftCategory`, `Signal`, `Tension`, `InnerConstitution`.
- `lib/identityEngine.ts` — `generateMirror`, `shapeInOneSentence`, existing helpers (`getGiftSpecificity`, `getPeaceRegister`, `composeFaithProse`, `inCompassTop`, `signalRankAtMost`, `signalRankBetween`, `topCompassRefs`).
- `lib/drive.ts` — `buildDriveTension`, `claimed_vs_revealed` machinery.
- `lib/humanityRendering/contract.ts` — `extractAnchors`, `buildEngineRenderedReport`, `lockedAnchors` array shape.
- `app/components/MirrorSection.tsx` — render site for the new slot.
- `lib/renderMirror.ts` — markdown export composer.
- Memory — helpful context only (NOT required for execution; canon doc + this prompt are self-contained):
  - `feedback_minimal_questions_maximum_output.md`
  - `feedback_pair_key_casing_canon.md`

## Allowed to Modify

- `lib/types.ts` (MirrorOutput extension; UncomfortableButTrueClass type addition).
- `lib/identityEngine.ts` (new `getUncomfortableButTrue` helper; `UNCOMFORTABLE_BUT_TRUE_TEMPLATES` map; one-line wire-in to `generateMirror`).
- `app/components/MirrorSection.tsx` (single conditional render block after `shapeInOneSentence`).
- `lib/renderMirror.ts` (single conditional emit after the golden-sentence markdown emit).
- `lib/humanityRendering/contract.ts` (`extractAnchors` extension to add the new anchor to `lockedAnchors` array).
- `docs/canon/result-writing-canon.md` (CC-058 amendment under § Rule 5).
- `docs/audits/report-calibration-audit-2026-04-29.md` (mark Rule 5 RESOLVED).
- **No other files.** No new gift categories, no signal-tagging-table edits, no question schema changes, no engine logic changes, no Compass / Drive / OCEAN / Work Map / Love Map edits, no polish-layer adapter or harness changes, no test files.

## Report Back

1. **`MirrorOutput` extension** — diff for the new optional field; type-system path confirmation.
2. **`getUncomfortableButTrue` helper** — full source diff; confirmation that all 8 conditions wire to the locked sentences verbatim; helper-function-by-condition mapping for any new accessor helpers added.
3. **Wire-in to `generateMirror`** — diff showing the new line; confirmation the existing `generateMirror` shape is otherwise unchanged.
4. **`MirrorSection.tsx` render** — diff; confirmation typography matches spec (italic + ink-mute, no section header, no separator); confirmation null/empty case renders nothing.
5. **Markdown export** — diff; confirmation italic-wrap preserves the register; confirmation null/empty case emits no content (no orphan blank lines).
6. **Polish-layer contract** — diff for `extractAnchors` showing the new anchor joining `lockedAnchors` when present; confirmation the validation pass catches polish drift on the new anchor without further edits.
7. **Canon doc amendment** — line range in `result-writing-canon.md`; one-line confirmation that all 8 conditions and locked sentences are documented.
8. **Audit doc update** — line range showing Rule 5 marked RESOLVED.
9. **Verification results** — tsc, lint, build all clean.
10. **Manual sweep deferred to Jason** — explicit verification list:
    - Re-rendered Jason0429 shows the condition-1 or condition-2 sentence (whichever fires) immediately after the golden sentence in italic + ink-mute.
    - A thin-signal test session shows no slot rendered — clean layout, no orphan whitespace.
    - Markdown export carries the same conditional behavior.
    - Polish-layer A/B harness (per CC-057b setup, when API keys present) preserves the new anchor verbatim across both providers.
11. **Any deviation from locked content** — if a structural surprise prevented verbatim placement of any of the 8 sentences, or if a condition couldn't wire as specified.
12. **Prompt move-to-completed confirmation.**

---

## Notes for the executing engineer

- **Locked sentences ship verbatim.** Tone calibration is a separate authorship pass; if a sentence reads "off" tonally during your manual sweep, surface in Report Back and we'll do a `CC-058-prose` follow-on. Do not silently revise.
- **Silence is canonical.** Returning `null` when no condition matches is not a defect — it's the design. Better silence than horoscope.
- **The 8 conditions are priority-ordered.** First match wins. Conditions are written so they don't overlap in normal cases (Ni and Ne can both hit condition 2 only when condition 1 didn't fire; Te and creator-agency reach condition 5 only when conditions 1-4 didn't); if you find an edge case where two conditions both match, the priority order is canonical (lower number wins).
- **The aux-pair `gift_category` field** comes from `FUNCTION_PAIR_REGISTER` in `lib/identityEngine.ts` per CC-038-prose. PascalCase pair keys (NeTi, NiTe, FeSi, etc.) per `feedback_pair_key_casing_canon.md`.
- **The `claimed_vs_revealed` Drive tension** is the existing CC-026 mechanism. If its threshold or output shape has shifted in a CC since CC-026, surface in Report Back; the condition #3 wiring assumes the existing shape.
- **The polish layer's locked anchor list** already covers Sentence 2 anchors (CC-052) and Peace/Faith disambiguation (CC-054). The new uncomfortable-but-true sentence joins that list automatically once `extractAnchors` reads the field. No polish-layer prompt edit required.
- **Pre-CC-058 saved sessions** re-render against current engine code on admin load — the new field populates automatically. No migration needed. Sessions saved before CC-058 will render the new slot once they're re-derived.
- **Per the routing convention** the prompt file moves to `prompts/completed/` when shipped. Explicit reminder.
