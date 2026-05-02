# CC-060 — Allocation Gap 3C's Rewrite (CC-048 audit Rule 4 closure)

**Type:** Editorial rewrite landing in code. **Locked-content composition** for three allocation tension prompts (T-013 Sacred Words vs Sacred Spending, T-014 Words and Energy, T-015 Current vs Aspirational Allocation). Each tension's existing multi-disclaimer hedging block is replaced with a single bucket-keyed sharp question selected by the user's Drive bucket lean (cost / coverage / compliance / balanced). No new questions, no new signals, no new measurement surface — derivation reads the existing Drive case classifier.
**Goal:** Close CC-048 audit Rule 4 violations. The current allocation prompts read as the report apologizing for itself: *"That does not mean hypocrisy. The model cannot know motive. It could mean: exhaustion, a difficult season, needed self-care, social bonding, old habits, or a real gap..."* Three sentences of disclaimer, one sentence of question. Per the canon: the 3C's framework is one of the instrument's strongest differentiators; the prose should honor that with a sharp bucket-keyed question rather than diluted hedging. After CC-060, each allocation tension renders a single sharp question composed from the user's Drive lean — cost-leaning → maintenance-vs-creation; coverage-leaning → relational-presence; compliance-leaning → protection-vs-paralysis; balanced → load-bearing fallback.
**Predecessors:** CC-026 (Drive integration — supplies the bucket-lean classifier this CC reads). CC-040 (Drive coverage-bucket relabel — current canonical bucket labels). CC-048 (Report Calibration Canon — codified Rule 4). CC-052 / CC-052b (Sentence 2 anchor architecture — the *"locked content per cross-signal pattern, fallback for no-match"* discipline this CC inherits). CC-054 (Peace + Faith disambiguation — adjacent locked-prose pattern). CC-058 + CODEX-058b (Mirror Rule 5 — same canon discipline applied to a different surface).
**Successor:** CC-061 (Growth Edge + Blind Spot Specificity — Rule 3). Both touch `lib/identityEngine.ts` so they ship serially. CC-061 doesn't depend on CC-060's content but reuses the same Sentence 2 / locked-content pattern.

---

## Why this CC

CC-048's audit found 3 Rule 4 violations across allocation prompts:

- **T-013 user_prompt** (`lib/identityEngine.ts:848` — Sacred Words vs Sacred Spending): cautious *"That does not mean hypocrisy. The model cannot know motive. It could mean: exhaustion, a difficult season..."* hedging followed by *"The only fair question is: does this feel true, partially true, or not true at all?"*
- **T-014 user_prompt** (`lib/identityEngine.ts:899` — Words and Energy): same hedging template, ending with a candidate-move close (*"...giving X a scheduled claim on your best energy, not only your leftover energy."*) instead of the 3-state question.
- **T-015 user_prompt** (the synthesis-collapse case in `detectAllocationOverlayTensions`): same multi-disclaimer pattern.

Per the canon's Rule 4 adherence example:

> *"You named Knowledge as among your most sacred values. Your money flows mostly to family and yourself; your protected hours flow mostly to maintenance. The 3 C's question for your shape is sharper than 'do you donate enough to Knowledge causes?' It is whether your protected hours, creative output, and strategic attention are moving toward the future you say matters — or whether maintenance is consuming the life that was supposed to build it. Does this feel true, partially true, or not true at all?"*

The shape: prefix names what the user said vs where their resources flow → bucket-keyed sharp question naming the *3C's framework's specific reading* for this user's lean → 3-state question close. The bucket-keying is the load-bearing change. A user whose Drive lean is cost-class (Money / Wealth bucket) reads a different sharp question than a user whose lean is coverage-class (People, Service & Society) or compliance-class (Risk and uncertainty).

CC-060 is engine-side substance per the Path C contract (CC-057a). The locked sharp questions ship as the engine's structural anchor; the polish layer (CC-057b) is licensed to re-render warmer adjacent prose but cannot edit the locked questions.

---

## Scope

Files modified:

1. **`lib/identityEngine.ts`** — three changes in the allocation tension composers:
   - **New helper `getAllocationSharpQuestion(valueLabel, driveBucketLean, tensionType, topResourceFlows) → string`** composing a sharp question keyed to (a) which value was named, (b) which Drive bucket the user leans toward, (c) which tension surface (T-013 spending / T-014 energy / T-015 allocation overlay), (d) the resource flow already named in the prefix.
   - **`new ALLOCATION_SHARP_QUESTIONS` Record** keyed by `[tension_id, drive_bucket_case]` mapping to the locked sharp question template strings.
   - **Three call-site rewrites** — T-013 user_prompt (line ~848), T-014 user_prompt (line ~899), T-015 user_prompt (in `detectAllocationOverlayTensions`) — each replaces the *"That does not mean hypocrisy. The model cannot know motive. It could mean: exhaustion..."* multi-disclaimer block with the helper's output. The prefix (*"You named X as among your most sacred values. Your [resource] appears to flow mostly to..."*) is preserved verbatim. The 3-state question close (*"Does this feel true, partially true, or not true at all?"*) is preserved verbatim where present.

2. **`docs/canon/result-writing-canon.md`** — append a CC-060 amendment under § Rule 4 marking it RESOLVED, naming the helper and the locked sharp-question matrix.

3. **`docs/audits/report-calibration-audit-2026-04-29.md`** — mark Rule 4 (3 findings) as RESOLVED by CC-060.

Nothing else. Specifically:

- **No new questions.** The minimal-questions canon holds.
- **No new signals.** Signal reads use existing accessors.
- **No new tensions.** T-013, T-014, T-015 keep their existing detection predicates and `tension_id` keys.
- **No edits to the existing allocation tension detection logic.** This CC only changes the user_prompt strings, not the conditions that fire them.
- **No edits to the Drive bucket-lean classifier** (`lib/drive.ts § driveOutput.case`). The classifier is the existing CC-026 / CC-040 mechanism; this CC reads it.
- **No edits to other tensions** (T-001 through T-012, T-016+).
- **No edits to the Allocation Gaps render surface** in `app/components/InnerConstitutionPage.tsx` or `MapSection.tsx`. Per CODEX-051 the standalone Allocation Gaps section was removed; the tensions surface in Open Tensions. Render position stays.
- **No engine logic changes** beyond the new helper + three string replacements.
- **No edits to the `VALUE_LABEL_HUMAN`, `VALUE_TO_SPENDING`, `VALUE_TO_ENERGY` maps** beyond reading them.
- **No removal of the *"You named X as among your most sacred values. Your [resource] flows..."* prefix** — that scaffold is correct and load-bearing per the canon.

---

## The locked Drive-bucket lean classifier

The helper reads `constitution.path.drive.case` (CC-026 / CC-040 canonical Drive case). The four cases map to four sharp-question buckets:

| Drive case | Bucket lean | Sharp-question register |
|---|---|---|
| `cost-leaning` (formerly money-leaning) | **Cost-class** — building & wealth orientation; protected hours / strategic attention as currency | maintenance-vs-creation |
| `coverage-leaning` | **Coverage-class** — people, service, society orientation; relational presence as currency | relational-presence |
| `compliance-leaning` | **Compliance-class** — risk and uncertainty orientation; protection / risk-management as currency | protection-vs-paralysis |
| `balanced` (or any case not above) | **Balanced fallback** — no strong lean detected | load-bearing fallback question that doesn't presume a lean |

If `drive` is undefined (thin-signal session), default to the balanced fallback. The helper must be null-safe at every Drive read.

---

## The locked content — 12 sharp-question templates (3 tensions × 4 bucket cases)

Each template uses `${value}` for the named sacred value (e.g., "Knowledge", "Truth") and `${flows}` for the resource-flow phrase already composed by the existing humanizer (`humanizeSignalIds`). The prefix (preserved verbatim from current state) is:

> *"You named ${value} as among your most sacred values. Your [money/discretionary energy/resources across multiple domains] appears to flow mostly to ${flows}."*

The locked content below replaces the multi-disclaimer block that follows the prefix. The 3-state question close (*"Does this feel true, partially true, or not true at all?"*) is appended where the existing template appended it (T-013 and T-015); T-014's existing candidate-move close is preserved as-is.

### T-013 — Sacred Words vs Sacred Spending

#### Cost-leaning bucket

> *"The 3 C's question for your shape is sharper than 'do you donate enough to ${value} causes.' It is whether your protected hours, creative output, and strategic attention are moving toward what ${value} would actually require — or whether maintenance is consuming the resources that were supposed to build that."*

#### Coverage-leaning bucket

> *"The 3 C's question for your shape is sharper than 'do you give enough to ${value} causes.' It is whether the people through whom ${value} actually shows up — the ones you spend relational presence on, the ones whose lives your money lands inside — are the people ${value} would name if it could choose for itself, or whether the relational gravity has settled somewhere else."*

#### Compliance-leaning bucket

> *"The 3 C's question for your shape is sharper than 'do you donate enough to ${value} causes.' It is whether the risks you actually protect against, and the protections you actually fund, are aligned with what ${value} says is worth losing sleep over — or whether your risk register has drifted toward the threats your shape is wired to over-rate."*

#### Balanced fallback

> *"The 3 C's question for your shape is whether ${value}, named as one of your most sacred values, is actually getting any meaningful share of the resources that compose a life — money, time, attention, presence — or whether it sits in the named-but-unfunded register that almost every adult life has, and that almost every adult life regrets in the long arc."*

### T-014 — Words and Energy

(Existing template ends with a candidate-move close instead of a 3-state question. CC-060 preserves this structural difference — the bucket-keyed sharp question is composed in the same form, but the close is a candidate move rather than a 3-state question.)

#### Cost-leaning bucket

> *"The 3 C's question for your shape is sharper than 'are you spending energy on the right cause.' It is whether your best hours — the ones where attention compounds — are moving toward ${value}, or whether ${value} is what you intend to get to once the maintenance load lets up. The candidate move: give ${value} a scheduled claim on the best hour you reliably control, not only the leftover hour."*

#### Coverage-leaning bucket

> *"The 3 C's question for your shape is sharper than 'are you spending energy on the right cause.' It is whether the relational presence ${value} would actually require — sustained attention to specific people whose lives ${value} would have you tend — is what your discretionary energy lands on, or whether it lands on the broader-but-thinner register of being-near-many. The candidate move: name one specific person ${value} would have you give your best energy to this season, and check whether that person actually gets it."*

#### Compliance-leaning bucket

> *"The 3 C's question for your shape is sharper than 'are you spending energy on the right cause.' It is whether the watchful, protective, holding-against-bad-outcomes work that ${value} would have you do is where your discretionary energy actually lands, or whether it lands on lower-stakes vigilance that the same wiring also rewards. The candidate move: ask which protection ${value} most wants from you this season, and give it the best of what you have."*

#### Balanced fallback

> *"The 3 C's question for your shape is whether ${value}, named as central, is getting any of your best energy at all — or whether the energy ${value} is supposed to organize is getting absorbed by everything else and arriving to ${value} in whatever shape leftover allows. The candidate move: give ${value} a scheduled claim on your best energy, not only your leftover energy."*

### T-015 — Current vs Aspirational Allocation

#### Cost-leaning bucket

> *"The 3 C's question for your shape, across multiple allocation domains, is sharper than 'are your stated and lived priorities aligned.' It is whether the protected hours, creative output, and strategic attention you control are moving toward the kind of life you'd build if you were building it on purpose — or whether maintenance, obligation, and inertia are consuming the resources that were supposed to build that. Does this feel true, partially true, or not true at all?"*

#### Coverage-leaning bucket

> *"The 3 C's question for your shape, across multiple allocation domains, is sharper than 'are your stated and lived priorities aligned.' It is whether the people, communities, and relationships you actually invest in are the ones a life-built-on-purpose would invest in — or whether the relational gravity has settled onto people the present demands rather than people the future would have you stay close to. Does this feel true, partially true, or not true at all?"*

#### Compliance-leaning bucket

> *"The 3 C's question for your shape, across multiple allocation domains, is sharper than 'are your stated and lived priorities aligned.' It is whether the protections you fund, the risks you actually mitigate, and the threats you actually hold against are calibrated to the life you'd build on purpose — or whether your risk register is shaped more by the threats your wiring over-rates than by the threats a clear-eyed read would actually flag. Does this feel true, partially true, or not true at all?"*

#### Balanced fallback

> *"The 3 C's question for your shape, across multiple allocation domains, is whether the lived shape of your week — money, time, attention, relational presence, risk-protection — is the shape of the life you'd build if you were building it on purpose, or whether it's the shape that emerged from a long sequence of adjacent reasonable choices. The honest read is rarely all-aligned and rarely all-misaligned; it's specific. Does this feel true, partially true, or not true at all?"*

---

## The selector function shape (locked)

```ts
// lib/identityEngine.ts (new helper, near the allocation tension detection block)

type AllocationTensionId = "T-013" | "T-014" | "T-015";
type AllocationBucketCase = "cost" | "coverage" | "compliance" | "balanced";

const ALLOCATION_SHARP_QUESTIONS: Record<
  AllocationTensionId,
  Record<AllocationBucketCase, string>
> = {
  "T-013": {
    cost: "<locked T-013 cost template>",
    coverage: "<locked T-013 coverage template>",
    compliance: "<locked T-013 compliance template>",
    balanced: "<locked T-013 balanced template>",
  },
  "T-014": {
    cost: "<locked T-014 cost template>",
    coverage: "<locked T-014 coverage template>",
    compliance: "<locked T-014 compliance template>",
    balanced: "<locked T-014 balanced template>",
  },
  "T-015": {
    cost: "<locked T-015 cost template>",
    coverage: "<locked T-015 coverage template>",
    compliance: "<locked T-015 compliance template>",
    balanced: "<locked T-015 balanced template>",
  },
};

function classifyAllocationBucket(
  driveOutput: DriveOutput | undefined
): AllocationBucketCase {
  if (!driveOutput) return "balanced";
  const c = driveOutput.case;
  if (c === "cost-leaning") return "cost";
  if (c === "coverage-leaning") return "coverage";
  if (c === "compliance-leaning") return "compliance";
  return "balanced";
}

export function getAllocationSharpQuestion(
  tensionId: AllocationTensionId,
  valueLabel: string,
  driveOutput: DriveOutput | undefined
): string {
  const bucket = classifyAllocationBucket(driveOutput);
  const template = ALLOCATION_SHARP_QUESTIONS[tensionId][bucket];
  // ${value} interpolation; ${flows} is interpolated by the call-site since
  // the resource-flow phrase composes from existing humanizeSignalIds output.
  return template.replace(/\$\{value\}/g, valueLabel);
}
```

The actual Drive case keys MUST match what `lib/drive.ts § DriveOutput.case` emits. Verify in `lib/drive.ts` before wiring; if the case keys have shifted (e.g., post-CC-040 renaming) update the `classifyAllocationBucket` mapping accordingly. The four bucket-case branches are canonical; the case-key strings on the right side of each conditional are subject to repo state.

---

## Call-site rewrites

### T-013 (line ~848 in `lib/identityEngine.ts`)

Replace the existing template literal with a composition that:

1. Preserves the prefix (*"You named ${valueLabel} as among your most sacred values. Your money appears to flow mostly to ${flows}."*) — verbatim.
2. Drops the multi-disclaimer block (*"That does not mean hypocrisy..."* through *"...gap between stated priority and lived allocation."*).
3. Composes the bucket-keyed sharp question via `getAllocationSharpQuestion("T-013", valueLabel, driveOutput)`.
4. Preserves the 3-state question close (*"Does this feel true, partially true, or not true at all?"*) — appended after the sharp question via `\n\n`.

The `driveOutput` is read from the constitution being built — pass it as a parameter or read via the existing context the tension detection function has access to. If the function doesn't currently receive `driveOutput`, add it to the function signature and update the call site in `buildInnerConstitution`.

### T-014 (line ~899 in `lib/identityEngine.ts`)

Same pattern as T-013, with two differences:
- Sharp question template comes from `ALLOCATION_SHARP_QUESTIONS["T-014"]`.
- The candidate-move close (existing template's *"It may simply mean giving ${value} a scheduled claim on your best energy, not only your leftover energy."*) is REPLACED by the bucket-keyed candidate move embedded inside the sharp-question template (each T-014 template ends with a "The candidate move: ..." sentence). Do NOT append the existing candidate-move close on top of the new bucket-keyed close — that would duplicate.

### T-015 (in `detectAllocationOverlayTensions`)

Same pattern as T-013. Sharp question template comes from `ALLOCATION_SHARP_QUESTIONS["T-015"]`. The 3-state question close is preserved at the end. The synthesis-collapse case (when 3+ rankings trigger T-015 and a single synthesis tension is emitted) uses the same templates; the bucket-keying still applies because the synthesis tension carries the same structural shape.

---

## Acceptance

- `npx tsc --noEmit` clean.
- `npm run lint` clean.
- `npm run build` exits 0.
- `getAllocationSharpQuestion` shipped with all 12 locked templates verbatim from this prompt.
- `classifyAllocationBucket` correctly maps the existing Drive case strings to the four bucket cases; balanced-fallback fires when `driveOutput` is undefined or when the case key doesn't match a leaning case.
- T-013 / T-014 / T-015 user_prompt strings now compose: prefix + sharp question + close. The prefix is unchanged from current state; the multi-disclaimer block is gone; the close is preserved.
- `grep -n "That does not mean hypocrisy\|The model cannot know motive\|It could mean: exhaustion" lib/identityEngine.ts` returns zero hits.
- Re-rendered Jason0429 (admin route per CODEX-050) shows the T-013 / T-014 / T-015 prompts (whichever fire) with the bucket-keyed sharp question matching his Drive lean. If Jason0429's Drive lean is the canonical Builder/long-arc-cost-leaning shape, condition `cost` fires; the locked T-013 cost template is visible verbatim.
- A test session with a coverage-class Drive lean fires the coverage-leaning template; a compliance-class lean fires the compliance template; a session with no detectable Drive output (thin-signal) fires the balanced fallback.
- Markdown export carries the same conditional behavior — `lib/renderMirror.ts` already reads `tension.user_prompt` verbatim per Open Tensions emit, so no edit needed there. Verify by grep.
- The 3-state question close is still present at the end of T-013 and T-015 prompts; T-014's candidate-move close is embedded in the locked templates.
- Polish-layer round-trip (when API keys set) preserves the new sharp questions verbatim — they join `lockedAnchors` automatically via `extractAnchors`'s existing tension-prompt extraction (verify in `lib/humanityRendering/contract.ts`).

---

## Out of scope

- **Rewriting the prefix** (*"You named X as among your most sacred values. Your Y appears to flow mostly to Z."*). Scaffolding is canonical and load-bearing.
- **Adding more bucket cases** beyond cost / coverage / compliance / balanced.
- **Editing the Drive bucket-lean classifier** in `lib/drive.ts`. CC-060 reads it; doesn't refactor.
- **Per-user variation within a bucket case.** All cost-leaning users land on the same T-013 cost template. Future CC may add per-Compass-value variation (e.g., a Knowledge-specific cost question vs a Truth-specific one); not now.
- **Adding tensions or removing tensions.** T-013, T-014, T-015 detection logic untouched.
- **Editing Open Tensions render or interaction** (Yes/Partially/No/Explain). Render layer untouched.
- **Editing the canon doc's Rule 4 § beyond the CC-060 amendment paragraph + RESOLVED note.**
- **Touching CC-058 / CC-059 / CC-052 / CC-054 surfaces.** Each is its own anchor.
- **Touching the polish-layer adapter or system prompt.** The new sharp questions flow into `lockedAnchors[]` automatically via the existing tension-extraction path; no polish-layer code edit required.
- **Adding tests.** No tests on this surface; not adding any here.
- **Migrating pre-CC-060 saved sessions.** Re-render against current engine code on admin load picks up the new prompts automatically.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

Codex equivalent acceptable. **Filed CC- per the routing convention because the work spans multi-file (engine helper + three call-site rewrites + canon docs) and the locked content is editorial-judgment-adjacent (sharp questions that need to land tonally).** Either executor will land it cleanly given the locked content; Claude Code is the cleaner default.

## Execution Directive

Single pass. **All 12 locked sharp-question templates ship verbatim from this prompt's locked content.** If the executor encounters a structural surprise (e.g., the Drive case strings differ from `cost-leaning` / `coverage-leaning` / `compliance-leaning` in current repo state, or the T-015 synthesis-collapse case has a different signature than the prompt assumes), surface in Report Back rather than rewriting locked content. Read `lib/drive.ts § DriveOutput.case` before wiring `classifyAllocationBucket` to verify the case-key strings match. **Move prompt to `prompts/completed/` when done.**

## Bash Commands Authorized

- `grep -n "T-013\|T-014\|T-015\|user_prompt\|tension_id" lib/identityEngine.ts`
- `grep -n "DriveOutput\|driveOutput\|drive.case\|DriveCase" lib/drive.ts lib/types.ts lib/identityEngine.ts`
- `grep -n "That does not mean hypocrisy\|cannot know motive\|It could mean" lib/`
- `grep -rn "Rule 4\|allocation gap\|Allocation Gap" docs/canon/result-writing-canon.md docs/audits/report-calibration-audit-2026-04-29.md`
- `cat lib/identityEngine.ts | sed -n '800,910p'`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` (smoke; kill before exit)
- `mv prompts/active/CC-060-allocation-gap-3cs-rewrite.md prompts/completed/CC-060-allocation-gap-3cs-rewrite.md`
- `git diff --stat`
- `git diff lib/identityEngine.ts`

## Read First (Required)

- `AGENTS.md`.
- `docs/canon/result-writing-canon.md` § Rule 4 (full canon text including the Knowledge/protected-hours adherence example) and the CC-058 amendment under § Rule 5 (Sentence-2-anchor-style locked-content discipline this CC inherits).
- `docs/audits/report-calibration-audit-2026-04-29.md` § Rule 4 findings (T-013, T-014, T-015 lines).
- `docs/canon/output-engine-rules.md` § "CC-057a — Derivation runs before polish" — engine ownership of locked prose anchors.
- `lib/identityEngine.ts` lines 800-910 (allocation tension detection — T-013, T-014, T-015 user_prompt composers).
- `lib/identityEngine.ts § detectAllocationOverlayTensions` (T-015 synthesis case).
- `lib/drive.ts § DriveOutput.case` (canonical Drive case strings — verify before wiring `classifyAllocationBucket`).
- `lib/types.ts § DriveOutput`, `Tension`.
- `lib/humanityRendering/contract.ts § extractAnchors` — verify tension prompts already flow into `lockedAnchors[]`; if they don't, surface in Report Back (potentially a sub-fix).
- Memory — helpful context only:
  - `feedback_pair_key_casing_canon.md`

## Allowed to Modify

- `lib/identityEngine.ts` — new helper `getAllocationSharpQuestion` + `ALLOCATION_SHARP_QUESTIONS` Record + `classifyAllocationBucket` helper + three user_prompt call-site rewrites (T-013, T-014, T-015).
- `docs/canon/result-writing-canon.md` — CC-060 amendment under § Rule 4.
- `docs/audits/report-calibration-audit-2026-04-29.md` — RESOLVED markers on the 3 Rule 4 findings.
- **No other files.** Specifically NOT: `lib/drive.ts`, `lib/types.ts`, `lib/loveMap.ts`, `lib/workMap.ts`, `lib/ocean.ts`, `lib/beliefHeuristics.ts`, `data/questions.ts`, `app/components/*.tsx`, `lib/renderMirror.ts`, `lib/humanityRendering/*`, any test files.

## Report Back

1. **Helper + Record** — diff for the new `getAllocationSharpQuestion`, `classifyAllocationBucket`, and `ALLOCATION_SHARP_QUESTIONS`. Confirmation that all 12 templates ship verbatim from this prompt.
2. **T-013 rewrite** — diff showing the prefix preserved, the multi-disclaimer block removed, the bucket-keyed sharp question composed via the helper, the 3-state question close preserved.
3. **T-014 rewrite** — diff showing the prefix preserved, the multi-disclaimer block removed, the bucket-keyed sharp question composed (which embeds the candidate-move close), the existing candidate-move close at the end of the old template removed (no duplication).
4. **T-015 rewrite** — diff showing the same pattern as T-013 (3-state question close preserved). Confirmation that the synthesis-collapse case in `detectAllocationOverlayTensions` is also wired.
5. **Drive case verification** — grep confirmation that the Drive case strings in `lib/drive.ts § DriveOutput.case` match the `classifyAllocationBucket` mapping (`cost-leaning`, `coverage-leaning`, `compliance-leaning`, plus a balanced or default).
6. **Hedging removal verification** — `grep -n "That does not mean hypocrisy\|cannot know motive\|It could mean: exhaustion" lib/identityEngine.ts` returns zero hits.
7. **Polish-layer integration** — confirmation (via grep) that tension `user_prompt` strings already flow into `lockedAnchors[]` via `lib/humanityRendering/contract.ts § extractAnchors`. If they don't, surface as a separate concern (potentially a small follow-on CC).
8. **Canon doc update** — line range showing the CC-060 amendment in `docs/canon/result-writing-canon.md` § Rule 4. RESOLVED status visible.
9. **Audit doc update** — line ranges showing T-013, T-014, T-015 marked RESOLVED.
10. **Verification results** — tsc, lint, build all clean.
11. **Manual sweep deferred to Jason** — explicit list:
    - Re-rendered Jason0429 shows the T-013 / T-014 / T-015 prompts (whichever fire) with the bucket-keyed sharp question matching his Drive lean.
    - A test panel covering each Drive case (cost / coverage / compliance / balanced) confirms the right template fires for each.
    - Thin-signal session with no Drive output fires balanced fallback.
    - Markdown export carries the same conditional behavior.
12. **Any deviation from locked content** — if a structural surprise prevented verbatim placement of any template.
13. **Prompt move-to-completed confirmation.**

---

## Notes for the executing engineer

- **Locked sharp-question templates ship verbatim.** If a sentence reads "off" tonally during your manual sweep, surface in Report Back; do not silently revise. Tonal calibration is a separate authorship pass.
- **Drive case-key verification is load-bearing.** The `classifyAllocationBucket` mapping assumes case keys *"cost-leaning"*, *"coverage-leaning"*, *"compliance-leaning"*. Per CC-040, the bucket relabel may have shifted internal codenames; read `lib/drive.ts § DriveOutput.case` definition first. If the keys differ, update `classifyAllocationBucket` to match repo state and surface the actual keys in Report Back.
- **The candidate-move close in T-014** is the architectural difference from T-013 / T-015. Each T-014 locked template embeds *"The candidate move: ..."* inside the sharp question. Don't append the existing legacy candidate-move close on top — it would duplicate. The locked T-014 templates end with the candidate move; nothing further.
- **The T-015 synthesis-collapse case** (when 3+ rankings trigger T-015 and a single synthesis tension fires) uses the same templates as the per-instance T-015. The bucket-keying still applies — the synthesis tension carries the same structural shape as the per-instance one for prose purposes.
- **Polish-layer immutability** — the new sharp questions are engine-owned. Path C's polish layer can re-render warmer adjacent prose (e.g., a softening sentence after the sharp question) but cannot edit the locked question text. Validation pass enforces via `lockedAnchors` extraction; if `extractAnchors` doesn't currently extract tension `user_prompt` strings, surface in Report Back — that's a polish-layer gap that should be closed.
- **Pre-CC-060 saved sessions** re-render against current engine code on admin load. No migration needed.
- **Per the routing convention** the prompt file moves to `prompts/completed/` when shipped. Explicit reminder.
- **CC-061 (Growth Edge + Blind Spot Specificity, Rule 3)** ships next in the rewrite-track queue. Both touch `lib/identityEngine.ts` so they ship serially; CC-060 should land before CC-061 fires.
