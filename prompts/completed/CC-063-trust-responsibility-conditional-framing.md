# CC-063 — Trust + Responsibility Conditional Framing (CC-048 audit Rules 8 + 9 closure)

**Type:** Editorial rewrite landing in code. **Locked-content composition** for two cardHeader strings — Trust card (Rule 8: conditional framing) and Gravity card (Rule 9: accountable-actor inside systems). No new questions, no new signals, no new measurement surface, no new rendering — single-string replacements that preserve the existing per-user label interpolation while rewriting the framing prose around it.
**Goal:** Close CC-048 audit Rules 8 + 9. The current Trust cardHeader (*"Among institutions, you appear to lean toward X. For hard truth, you appear to turn first toward Y."*) reads as categorical — makes users sound naive about institutional capture. The current Gravity cardHeader (*"When something goes wrong, you appear to look first toward Individual and Authority."*) flattens the user's actual structural-thinking-with-accountability stance into an individual-vs-system binary. After CC-063, Trust composes from a universal conditional-framing prefix (*"You tend to trust institutions when responsibility, consequence, and mission stay close to the people making decisions."*) plus per-user institution and personal naming; Gravity composes from a universal accountable-actor frame (*"When something goes wrong, you appear to look first for the accountable actor inside the system..."*) plus per-user attribution naming.
**Predecessors:** CC-048 (Report Calibration Canon — codified Rules 8 + 9 with adherence examples). CC-052 / CC-052b / CC-058 / CC-060 / CC-061 (locked-content rewrite-track precedent). CC-046 (Compass label leak fix — analogous Rule 1 cleanup pattern). The Trust card prose at `lib/identityEngine.ts § deriveTrustOutput` line ~3910; the Gravity card prose at `lib/identityEngine.ts § deriveGravityOutput` line ~3857.
**Successor:** OCEAN-as-Texture Refactor (Rules 6 + 1) — render-position relocation work for Disposition Map. workMap-prose closure (Rule 2 violations in `lib/workMap.ts`). Both are independent of CC-063's surfaces.

---

## Why this CC

CC-048's audit found 2 Rule 8 violations (one per Trust cardHeader call site — single string composing institutions and personals; no Builder ↔ Maintenance partial-adherence elsewhere) and 1 Rule 9 violation (Gravity cardHeader). Per the canon:

**Rule 8 — Trust nuance:** *"Trust prose names the condition under which the user's trust extends rather than asserting a categorical label. Replace 'You trust non-profits and small business' with 'You tend to trust institutions when responsibility, consequence, and mission stay close to the people making decisions.'"*

The current Trust cardHeader categorically asserts what institutions the user trusts. The reframe names the *condition* — what the user is testing for — and lets the institution names follow as evidence of that condition holding.

**Rule 9 — Responsibility nuance:** *"Responsibility-attribution prose names 'accountable actors inside systems' rather than 'individual responsibility vs system blame' binary. Preserves the user's structural-thinking dimension without making them sound reductionist."*

The current Gravity cardHeader flattens the user's actual stance. Per Clarence's review (cited in the canon): *"You do seem to resist vague system-blame. But you also spend a lot of time thinking structurally. So you are not simply an 'individual responsibility' person. The better read: you look for the accountable actor inside the system, not instead of the system."* The reframe names this stance.

CC-063 ships engine-side substance per the Path C contract (CC-057a). Both rewritten cardHeaders are engine-owned locked prose; the polish layer (CC-057b) can re-render warmer adjacent prose but cannot edit the locked framing.

---

## Scope

Files modified:

1. **`lib/identityEngine.ts § deriveGravityOutput`** (line ~3843) — rewrite the `cardHeader` composition (line ~3857) to use the locked Rule 9 accountable-actor framing. Per-user `labels` interpolation preserved.

2. **`lib/identityEngine.ts § deriveTrustOutput`** (line ~3892) — rewrite the `cardHeader` composition (line ~3910) to use the locked Rule 8 conditional-framing template. Per-user `instLabels` and `personalLabels` interpolation preserved across four label-presence cases (both / inst-only / personal-only / neither).

3. **`docs/canon/result-writing-canon.md`** — append CC-063 amendment under § Rule 8 and § Rule 9 marking each RESOLVED, naming the two cardHeaders rewritten and listing the locked framings.

4. **`docs/audits/report-calibration-audit-2026-04-29.md`** — mark Rule 8 (2 findings) and Rule 9 (1 finding) as RESOLVED by CC-063.

Nothing else. Specifically:

- **No new questions, signals, or tagging tables.** All signal reads use existing accessors.
- **No edits to the Trust signal-detection logic** (`topInst`, `topPersonal`, `INST_LABEL`, `PERSONAL_LABEL`).
- **No edits to the Gravity signal-detection logic** (`topGravity`, `GRAVITY_LABEL`).
- **No edits to the gift-category routing** (`pickGiftCategoryForCard`) or the resulting `giftText`. Only the `cardHeader` is rewritten.
- **No edits to `blindSpot.text`, `growthEdge.text`, `riskUnderPressure.text`, `patternNote.text`** on either card. Only `cardHeader`.
- **No edits to other cards.** Lens, Compass, Conviction, Weather, Fire, Path are unchanged.
- **No edits to render components.** `MapSection.tsx`, `ShapeCard.tsx` are unchanged — they read `cardHeader` from the engine's output; the field shape is unchanged.
- **No edits to `lib/renderMirror.ts`.** Markdown export reads `cardHeader` verbatim; no edit needed.
- **No edits to the polish-layer contract.** The new locked cardHeader strings flow into `lockedAnchors[]` automatically via `proseSlots` extraction (verify in `lib/humanityRendering/contract.ts`; surface in Report Back if the cardHeader is not in `proseSlots`).
- **No engine logic changes** beyond the two cardHeader rewrites.

---

## The locked content — Gravity cardHeader rewrite (Rule 9)

The existing composition at `deriveGravityOutput` line ~3857:

```ts
const cardHeader =
  labels.length === 0
    ? "Your responsibility-attribution answers did not yet converge on a clear top frame."
    : `When something goes wrong, you appear to look first toward ${joinList(labels)}.`;
```

Replaced with:

```ts
const cardHeader =
  labels.length === 0
    ? "Your responsibility-attribution answers did not yet converge on a clear top frame."
    : `When something goes wrong, you appear to look first for the accountable actor inside the system — ${joinList(labels)} ${labels.length === 1 ? "ranks" : "rank"} highest in your responsibility weighting because they name who had agency, who made the decision, who failed to act. That doesn't mean you skip the system; it means you locate where the system became personal.`;
```

The locked framing has three structural beats:
1. **The accountable-actor frame** — *"you appear to look first for the accountable actor inside the system"* (replacing the previous categorical *"look first toward X"*).
2. **The user-specific evidence** — *"${labels} ${ranks/rank} highest in your responsibility weighting because they name who had agency, who made the decision, who failed to act"* (per-user via `labels` interpolation; the *"who had agency / who made the decision / who failed to act"* phrasing is the canonical reasoning the canon names).
3. **The structural-not-reductive disclaimer** — *"That doesn't mean you skip the system; it means you locate where the system became personal."* (locked verbatim; preserves the user's structural-thinking dimension).

Number agreement: when `labels.length === 1`, the verb is *"ranks"* (singular); when `labels.length > 1`, the verb is *"rank"* (plural). Use a small ternary or helper to render correctly.

The empty-labels fallback string (*"Your responsibility-attribution answers did not yet converge on a clear top frame."*) is unchanged.

---

## The locked content — Trust cardHeader rewrite (Rule 8)

The existing composition at `deriveTrustOutput` line ~3910:

```ts
const cardHeader =
  instLabels.length === 0 && personalLabels.length === 0
    ? "Your trust answers did not yet converge on clear top sources."
    : `Among institutions, you appear to lean toward ${instLabels.length > 0 ? joinList(instLabels) : "no clear top"}. For hard truth, you appear to turn first toward ${personalLabels.length > 0 ? joinList(personalLabels) : "no clear personal source"}.`;
```

Replaced with a four-case composition keyed to which label arrays are populated:

### Case A — Both populated (most common)

```ts
`You tend to trust institutions when responsibility, consequence, and mission stay close to the people making decisions. Among the institutions in your top-trust ranking, ${joinList(instLabels)} ${instLabels.length === 1 ? "sits" : "sit"} highest — likely because they tend to hold those proximities better than larger, more abstracted forms. For relational truth, ${joinList(personalLabels)} ${personalLabels.length === 1 ? "is" : "are"} where you turn first.`
```

### Case B — Institutions only

```ts
`You tend to trust institutions when responsibility, consequence, and mission stay close to the people making decisions. Among the institutions in your top-trust ranking, ${joinList(instLabels)} ${instLabels.length === 1 ? "sits" : "sit"} highest — likely because they tend to hold those proximities better than larger, more abstracted forms. Your personal trust answers did not yet converge on a clear top source.`
```

### Case C — Personals only

```ts
`Your institutional trust answers did not yet converge on clear top sources. For relational truth, ${joinList(personalLabels)} ${personalLabels.length === 1 ? "is" : "are"} where you turn first.`
```

### Case D — Both empty (fallback, unchanged)

```ts
"Your trust answers did not yet converge on clear top sources."
```

The locked Rule 8 conditional-framing prefix (*"You tend to trust institutions when responsibility, consequence, and mission stay close to the people making decisions."*) is the load-bearing canon-adherence move. Renders verbatim in Cases A and B. Drops in Cases C and D where the institutional read is thin (no read to condition).

The *"For hard truth"* wording in the existing template becomes *"For relational truth"* per the canon adherence example. Locked.

The *"likely because they tend to hold those proximities better than larger, more abstracted forms"* explanatory clause is locked from the canon adherence example. It connects the conditional framing to the user's specific institution-naming evidence.

Number agreement matters across all the verb forms (*"sits/sit"*, *"is/are"*) — use ternaries based on `.length === 1`.

---

## The selector function shape (locked)

The two rewrites are inline in the existing `deriveGravityOutput` and `deriveTrustOutput` functions. No new helper functions required — the composition is straightforward template-literal logic with the four/two cases.

Pseudocode for the Trust composition:

```ts
const cardHeader = (() => {
  if (instLabels.length === 0 && personalLabels.length === 0) {
    return "Your trust answers did not yet converge on clear top sources.";
  }
  if (instLabels.length > 0 && personalLabels.length > 0) {
    // Case A
    return `You tend to trust institutions when responsibility, consequence, and mission stay close to the people making decisions. Among the institutions in your top-trust ranking, ${joinList(instLabels)} ${instLabels.length === 1 ? "sits" : "sit"} highest — likely because they tend to hold those proximities better than larger, more abstracted forms. For relational truth, ${joinList(personalLabels)} ${personalLabels.length === 1 ? "is" : "are"} where you turn first.`;
  }
  if (instLabels.length > 0) {
    // Case B
    return `You tend to trust institutions when responsibility, consequence, and mission stay close to the people making decisions. Among the institutions in your top-trust ranking, ${joinList(instLabels)} ${instLabels.length === 1 ? "sits" : "sit"} highest — likely because they tend to hold those proximities better than larger, more abstracted forms. Your personal trust answers did not yet converge on a clear top source.`;
  }
  // Case C — personalLabels only
  return `Your institutional trust answers did not yet converge on clear top sources. For relational truth, ${joinList(personalLabels)} ${personalLabels.length === 1 ? "is" : "are"} where you turn first.`;
})();
```

Pseudocode for the Gravity composition:

```ts
const cardHeader = labels.length === 0
  ? "Your responsibility-attribution answers did not yet converge on a clear top frame."
  : `When something goes wrong, you appear to look first for the accountable actor inside the system — ${joinList(labels)} ${labels.length === 1 ? "ranks" : "rank"} highest in your responsibility weighting because they name who had agency, who made the decision, who failed to act. That doesn't mean you skip the system; it means you locate where the system became personal.`;
```

Either an inline IIFE (as shown) or a small private helper near the function is acceptable. Either preserves the engine's existing structural pattern.

---

## Acceptance

- `npx tsc --noEmit` clean.
- `npm run lint` clean.
- `npm run build` exits 0.
- Re-rendered Jason0429 (admin route per CODEX-050) shows:
  - Gravity cardHeader rendering the locked accountable-actor framing with his actual top-attribution labels interpolated.
  - Trust cardHeader rendering Case A (most likely for him) with his actual top institutions and top personals interpolated, prefaced by the conditional-framing canon line.
- Test sessions for each Trust label-presence case render the correct case template.
- Number-agreement is correct in every case (singular labels list → *"sits"* / *"ranks"* / *"is"*; plural → *"sit"* / *"rank"* / *"are"*).
- `grep -n "Among institutions, you appear to lean toward\|appear to turn first toward\|look first toward" lib/identityEngine.ts` returns zero hits (the old framings are gone).
- `grep -n "accountable actor inside the system\|trust institutions when responsibility, consequence, and mission stay close" lib/identityEngine.ts` returns hits at the expected locations only (the new framings).
- Markdown export carries the same content (`lib/renderMirror.ts` reads `cardHeader` verbatim; no edit needed there).
- Polish-layer round-trip (when API keys set) preserves the new cardHeader strings via existing `proseSlots` extraction. Surface in Report Back if `cardHeader` is not currently in `proseSlots` — that would mean a small follow-on extraction extension is needed.
- Other card prose (Lens, Compass, Conviction, Weather, Fire, Path) is byte-identical pre/post diff.
- Every other field on Trust and Gravity outputs (`gift.text`, `blindSpot.text`, `growthEdge.text`, `riskUnderPressure.text`, `patternNote.text`) is byte-identical pre/post diff.

---

## Out of scope

- **Editing other prose fields on Trust or Gravity cards.** Only `cardHeader` rewrites.
- **Editing other cards' prose** (Lens, Compass, Conviction, Weather, Fire, Path).
- **Adding per-user variation within a case.** All Case A users get the same framing structure with their actual labels interpolated; no further conditional anchoring within a case.
- **Editing the institution-detection or personal-detection logic.** `topInst`, `topPersonal`, `INST_LABEL`, `PERSONAL_LABEL`, the underlying signals — all unchanged.
- **Editing the responsibility-attribution detection logic.** `topGravity`, `GRAVITY_LABEL`, the underlying signals — unchanged.
- **Adding tests.** No tests on this surface; not adding any here.
- **Polish-layer extraction extensions.** If `cardHeader` is not in `proseSlots`, surface as a separate concern — don't fix in this CC. (CODEX-062 closed the major polish-layer gaps; this would be a small follow-on.)
- **OCEAN-as-Texture (Rules 6+1)** — separate CC.
- **workMap-prose closure** — separate CC.
- **MVP product-vision work.**
- **Touching Drive 3C's allocation tensions** — CC-060 closed those; CC-063 stays out of `detectTensions`.
- **Touching CC-058's Mirror uncomfortable-but-true selector or any of the other Sentence 2 rewrite-track CCs** (CC-052, CC-054, CC-061). Different surfaces.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

This CC is filed CC- per the routing convention because the locked content is editorial-judgment-adjacent (framings that need to land tonally) and the four-case Trust composition requires careful handling of label-presence edge cases. Claude Code is the cleaner default; Codex acceptable given the locked content discipline.

## Execution Directive

Single pass. **All locked framings ship verbatim from this prompt's locked content.** If the executor encounters a structural surprise (e.g., the existing `joinList` helper doesn't behave as expected with the new templates, or `instLabels` / `personalLabels` arrays have a different shape than the prompt assumes), surface in Report Back rather than rewriting locked content. **Move prompt to `prompts/completed/` when done.**

## Bash Commands Authorized

- `grep -n "deriveTrustOutput\|deriveGravityOutput" lib/identityEngine.ts`
- `grep -n "appear to look first toward\|appear to turn first toward\|appear to lean toward" lib/identityEngine.ts`
- `grep -n "accountable actor\|trust institutions when responsibility" lib/identityEngine.ts docs/canon/result-writing-canon.md`
- `grep -n "joinList\|INST_LABEL\|PERSONAL_LABEL\|GRAVITY_LABEL" lib/identityEngine.ts`
- `grep -n "cardHeader" lib/humanityRendering/contract.ts lib/humanityRendering/types.ts`
- `cat lib/identityEngine.ts | sed -n '3843,3920p'` (Gravity + Trust derive functions)
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` (smoke; kill before exit)
- `mv prompts/active/CC-063-trust-responsibility-conditional-framing.md prompts/completed/CC-063-trust-responsibility-conditional-framing.md`
- `git diff --stat`
- `git diff lib/identityEngine.ts`

## Read First (Required)

- `AGENTS.md`.
- `docs/canon/result-writing-canon.md` § Rule 8 (full canon — including the *"institutions when responsibility, consequence, and mission stay close"* adherence example) and § Rule 9 (full canon — including the *"accountable actor inside the system"* adherence example).
- `docs/audits/report-calibration-audit-2026-04-29.md` § Rule 8 + § Rule 9 findings.
- `lib/identityEngine.ts § deriveGravityOutput` (line ~3843; the Gravity cardHeader being rewritten).
- `lib/identityEngine.ts § deriveTrustOutput` (line ~3892; the Trust cardHeader being rewritten).
- `lib/identityEngine.ts § joinList` (label-list humanizer; preserves Oxford-comma rendering).
- `lib/types.ts § FullSwotOutput, SignalRef` — verify `cardHeader` field shape.
- `lib/humanityRendering/contract.ts § buildEngineRenderedReport, proseSlots` — verify `cardHeader` flows into `proseSlots[]` for polish-layer protection. If not present, surface in Report Back.
- Memory — helpful context only:
  - `feedback_shapecard_field_inversion.md` (CC-025 collapse context — `cardHeader` is the title field, unaffected by the field inversion that affects growthEdge/blindSpot text fields).

## Allowed to Modify

- `lib/identityEngine.ts § deriveGravityOutput` — `cardHeader` composition only.
- `lib/identityEngine.ts § deriveTrustOutput` — `cardHeader` composition only.
- `docs/canon/result-writing-canon.md` — CC-063 amendments under § Rule 8 and § Rule 9.
- `docs/audits/report-calibration-audit-2026-04-29.md` — RESOLVED markers on the 3 findings (2 Rule 8 + 1 Rule 9).
- **No other files.** Specifically NOT: `lib/types.ts`, `lib/loveMap.ts`, `lib/workMap.ts`, `lib/drive.ts`, `lib/ocean.ts`, `lib/beliefHeuristics.ts`, `data/questions.ts`, `app/components/*.tsx`, `lib/renderMirror.ts`, `lib/humanityRendering/*`, any test files.

## Report Back

1. **Gravity cardHeader rewrite** — diff for `deriveGravityOutput` showing the locked framing with `${labels}` interpolation and number-agreement ternary (*ranks/rank*).
2. **Trust cardHeader rewrite** — diff for `deriveTrustOutput` showing the four-case composition (A/B/C/D) with the locked Rule 8 conditional-framing prefix and number-agreement ternaries.
3. **Locked content verbatim** — confirmation that all locked framings (Gravity accountable-actor; Trust conditional + institutions clause + relational-truth clause) ship byte-identical from this prompt.
4. **Other field preservation** — confirmation that `gift.text`, `blindSpot.text`, `growthEdge.text`, `riskUnderPressure.text`, `patternNote.text` on both cards are byte-identical pre/post.
5. **`joinList` and `LABEL` Records preserved** — confirmation that the per-user label-interpolation pipeline is unchanged.
6. **Polish-layer integration** — confirmation (via reading `lib/humanityRendering/contract.ts § buildEngineRenderedReport`) that `cardHeader` flows into `proseSlots[]` for polish-layer protection. If not, surface as a small follow-on concern — *do not fix in this CC*.
7. **Number-agreement verification** — explicit confirmation that singular-vs-plural verb forms render correctly across each case.
8. **Canon doc update** — line ranges for the CC-063 amendments under § Rule 8 and § Rule 9.
9. **Audit doc update** — line ranges showing the 3 findings (2 Rule 8 + 1 Rule 9) marked RESOLVED.
10. **Verification results** — tsc, lint, build all clean.
11. **Manual sweep deferred to Jason** — explicit verification list:
    - Re-rendered Jason0429 shows Gravity cardHeader rendering the locked accountable-actor framing with his actual top-attribution labels.
    - Re-rendered Jason0429 shows Trust cardHeader rendering Case A with his actual top institutions and top personals + the conditional-framing canon prefix.
    - Test sessions covering the four Trust label-presence cases render correctly.
    - Markdown export carries the same content.
    - Polish-layer A/B harness (when API keys set) preserves the new cardHeaders verbatim.
12. **Any deviation from locked content** — if a structural surprise prevented verbatim placement of any locked framing.
13. **Prompt move-to-completed confirmation.**

---

## Notes for the executing engineer

- **Locked framings ship verbatim.** Tonal calibration is a separate authorship pass. If a sentence reads "off" tonally during your manual sweep, surface in Report Back. Do not silently revise.
- **Number agreement matters.** *"X ranks highest"* (singular) vs *"X and Y rank highest"* (plural) — same for *"sits/sit"* and *"is/are"*. Use ternaries based on the `labels.length === 1` check. The CC-046 / CC-047 era code already establishes this pattern; reuse it.
- **The four Trust cases are exhaustive.** Both empty / inst-only / personal-only / both populated. No fifth case. Edge case: if either `instLabels` or `personalLabels` is somehow `null` rather than empty array, treat as empty (existing code shape suggests empty arrays not nulls; verify before locking).
- **The conditional-framing prefix in Trust** (*"You tend to trust institutions when responsibility, consequence, and mission stay close..."*) is the load-bearing canon adherence sentence. Cases A and B use it; Cases C and D drop it because there's no institutional read to condition. Don't append the prefix to Case C; it would read as detached.
- **The relational-truth wording** (Trust Case A and Case C) replaces the existing *"hard truth"* wording per the canon adherence example. Locked.
- **Polish-layer integration** — `cardHeader` should flow into `proseSlots[]` automatically per the existing extraction logic. If `extractAnchors` / `buildEngineRenderedReport` doesn't currently extract `cardHeader`, that's a small CODEX-062-class follow-on (extending `proseSlots` to include card header). Surface in Report Back; don't extend in this CC.
- **`joinList` formatting** — verify it renders Oxford-comma style for 3+ items (e.g., *"X, Y, and Z"* not *"X, Y and Z"*). The existing helper handles this; reuse.
- **Pre-CC-063 saved sessions** re-render against current engine code on admin load; no migration needed.
- **Per the routing convention** the prompt file moves to `prompts/completed/` when shipped. Explicit reminder.
- **CC-063 + CODEX-061b ship serially** — both touch `lib/identityEngine.ts`. CODEX-061b should land first (smaller scope, pure subtraction); CC-063 ships against the cleaned-up state.
