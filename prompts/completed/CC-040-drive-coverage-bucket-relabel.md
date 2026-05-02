# CC-040 — Drive Coverage-Bucket Relabel ("People you love" → "People, Service & Society")

**Type:** Drive-framework labeling correction. **No engine logic changes. No re-tagging of signals. No new questions or signals.**
**Goal:** Stop the Drive coverage bucket from being labeled "People you love." That phrase only covers the intimate-circle dimension of what the bucket actually measures. The signal taxonomy already captures the full other-directed register — broader social engagement, civic contribution, professional service, religious community, mentor/expert trust — none of which are "people you love" in the narrow sense. Relabel to "People, Service & Society" so the human label matches the canonical scope of the bucket.
**Predecessors:** CC-033 (Drive Cost-Bucket Relabel — same architectural pattern; relabel without re-tagging when the human label undersells what the bucket measures). Shipped 2026-04-29.
**Successor:** None hard-blocked.

---

## Why this CC

The 3C's framework is, by canonical claim, an exhaustive decomposition of where human drive/concern/priority is directed: *Building (do/make/become)* ↔ *Coverage (give/care/belong)* ↔ *Compliance (protect/preserve/mitigate-risk)*. Every drive distills to one of those three. That structural completeness depends on each bucket being labeled coherently with what it actually measures.

The cost bucket failed this test pre-CC-033 — it was labeled "Financial security" but tagged signals like `building_energy_priority` and `success_priority` that are about ambition, not security. CC-033 fixed it: cost → "Building & wealth."

The coverage bucket has the same problem post-CC-033. It's labeled "People you love" but tags signals across a much broader scope:

- `social_spending_priority` — broader social experiences, leisure, dining, travel
- `nonprofits_religious_spending_priority` — charities, NGOs, voluntary missions, faith communities
- `mentor_trust_priority` — chosen-relational beyond family
- `outside_expert_trust_priority` — therapists, clergy, coaches, lawyers, doctors, professional service relationships
- `caring_energy_priority` — caring labor extending well past intimate circle
- `family_priority`, `loyalty_priority`, `partner_trust_priority`, `friend_trust_priority`, `family_trust_priority`, `close_relationships_stakes_priority` — the intimate-circle signals

The bucket measures the full other-directed register. Some users land in this bucket because they orient toward intimate care; others because they orient toward civic service; others because they orient toward the broader social fabric. The label "People you love" reads accurately only for the first group. Users in the other two groups read the chart and either don't recognize themselves, or read the bucket as if it were measuring intimate-circle care exclusively — both failure modes.

The fix is the CC-033 fix repeated: relabel to match what the bucket measures. Internal codename `coverage` stays. Signal tagging stays. Only the human-facing label changes.

This CC also updates Q-3C1's coverage item, since the claimed-drive ranking question must use language that matches the revealed-distribution label. Currently Q-3C1 reads *"Caring for those closest to you"* / *"the people, relationships, and commitments you love"* — same intimate-circle bias as the pie-chart label. Rewriting both in lockstep keeps claimed and revealed Drive readings semantically aligned.

---

## Scope

Files modified:

1. `app/components/PieChart.tsx` — `HUMAN_LABEL.coverage` rename; aria-label update.
2. `lib/drive.ts` — `HUMAN_LABELS.coverage` rename; engine-prose updates in `generateDriveProse` (the `balanced` and `unstated` templates that name "the people you love" or "relational" explicitly need updating).
3. `data/questions.ts` — Q-3C1's coverage item label/gloss rewrite.
4. `docs/canon/drive-framework.md` — bucket-label canon update; document the rename rationale parallel to CC-033's.
5. `docs/canon/question-bank-v1.md` — Q-3C1 entry's coverage item updated.
6. `docs/canon/allocation-rules.md` — only if it references the prior label.
7. `docs/canon/shape-framework.md` — only if it references the prior label.

Internal framework codename `coverage` is **not** renamed. The TypeScript `DriveBucket` type stays `"cost" | "coverage" | "compliance"`. Q-3C1's `id: "coverage"` and `signal: "coverage_drive"` stay. Only human-facing labels and prose change.

No re-tagging of signals. Every signal currently in the coverage bucket stays there. No multi-tag splits change. The bucket's *measurement* is correct; only its *label* needs correcting.

---

## The decisions, locked

### Coverage bucket human label

- **`coverage` chart label:** "People, Service & Society"
- **`coverage` engine-prose phrase:** "people, service, and society"

Capitalization follows the existing convention from CC-033: title-case for the pie-chart slice (parallel to "Building & wealth"), lowercase for engine prose (parallel to "building & wealth" / "risk and uncertainty" in `HUMAN_LABELS`).

The triadic structure (People / Service / Society) is deliberate. Each noun captures a distinct sub-dimension of the bucket's scope:
- **People** — intimate-circle relational (family, partners, close friends; the original "people you love" register).
- **Service** — active-giving (caring labor, mentorship, professional service, volunteer work, charity).
- **Society** — broader civil belonging (community, civic engagement, public good, social fabric).

These three sub-dimensions are exactly what the existing tagged signals measure when summed. Users land high on coverage for any combination of these reasons; the label now names all three explicitly so the user can see themselves in the bucket regardless of which sub-dimension drives their share.

### Q-3C1 coverage item

- **Label (was):** "Caring for those closest to you"
- **Label (now):** "Caring for people, service, and society"

- **Gloss (was):** "the people, relationships, and commitments you love."
- **Gloss (now):** "the people you love, the work you give, and the world you contribute to."

`signal: "coverage_drive"` and `id: "coverage"` stay. Cost and compliance items unchanged.

The new gloss preserves the tripartite structure — *people you love* (intimate), *work you give* (service), *world you contribute to* (society). Users ranking Q-3C1 now see the full scope of what claiming coverage as their top drive means.

### Engine-prose updates in `lib/drive.ts:generateDriveProse`

Two templates need explicit edits; the other four interpolate via `HUMAN_LABELS` and pick up the new label automatically.

**`balanced` (post-CC-033 form, pre-CC-040):**
> "Your distribution is unusually balanced — building & wealth, the people you love, and risk-mitigation motivators show roughly equal weight in your answers. ..."

**`balanced` (post-CC-040):**
> "Your distribution is unusually balanced — building & wealth, people-service-and-society, and risk-mitigation motivators show roughly equal weight in your answers. That balance can mean disciplined integration of three competing drives, or it can mean unresolved tradeoffs the model can't see. Which feels closer?"

The hyphenation `people-service-and-society` is a styling decision to keep the three-noun phrase reading as a single compound register-name in this list-of-three sentence. The alternative (commas) breaks parallelism with the other two sibling-buckets. Lock the hyphenated form for the `balanced` and `unstated` cases only — interpolated forms via `HUMAN_LABELS` use the unhyphenated "people, service, and society" because they appear standalone, not in a list.

**`unstated` (post-CC-033 form, pre-CC-040):**
> "Your distribution across building & wealth, the people you love, and risk-mitigation motivators reveals ${revFirst} as the largest share. ..."

**`unstated` (post-CC-040):**
> "Your distribution across building & wealth, people-service-and-society, and risk-mitigation motivators reveals ${revFirst} as the largest share. Without your claimed drive, the model can't compare what you'd say guides you against what your answers expose."

The other four templates (`aligned`, `inverted-small`, `inverted-big`, `partial-mismatch`) reference `${revFirst}` / `${claimedFirst}` / `${claimedThird}` only — those interpolate from `HUMAN_LABELS["coverage"]`, so updating `HUMAN_LABELS.coverage = "people, service, and society"` cascades correctly. Don't edit the four interpolation-only templates.

### PieChart aria-label

Currently: `"Drive distribution: building & wealth, people you love, risk and uncertainty"`

Update to: `"Drive distribution: building & wealth, people service and society, risk and uncertainty"`

The aria-label uses the unhyphenated form (screen readers handle commas naturally) — the hyphenation is only for the prose-template list-of-three case where parallelism matters.

---

## Steps

### 1. `app/components/PieChart.tsx` — HUMAN_LABEL rename + aria

Around line 22:

```tsx
const HUMAN_LABEL: Record<DriveBucket, string> = {
  cost: "Building & wealth",
  coverage: "People, Service & Society",
  compliance: "Risk and uncertainty",
};
```

Around line 120, update the SVG aria-label:

```tsx
aria-label="Drive distribution: building & wealth, people service and society, risk and uncertainty"
```

The header comment block at the top of the file should pick up a CC-040 amendment line noting the coverage rename. Don't rewrite the existing CC-026 / CC-033 commentary.

### 2. `lib/drive.ts` — HUMAN_LABELS + prose templates

Around line 354 (post-CC-033):

```ts
const HUMAN_LABELS: Record<DriveBucket, string> = {
  cost: "building & wealth",
  coverage: "people, service, and society",
  compliance: "risk and uncertainty",
};
```

Around line 380, the `balanced` case:

```ts
case "balanced":
  return `Your distribution is unusually balanced — building & wealth, people-service-and-society, and risk-mitigation motivators show roughly equal weight in your answers. That balance can mean disciplined integration of three competing drives, or it can mean unresolved tradeoffs the model can't see. Which feels closer?`;
```

Around line 383, the `unstated` case:

```ts
case "unstated":
default:
  return `Your distribution across building & wealth, people-service-and-society, and risk-mitigation motivators reveals ${revFirst} as the largest share. Without your claimed drive, the model can't compare what you'd say guides you against what your answers expose.`;
```

Header comment at the top of the file picks up a CC-040 amendment line noting the coverage rename, parallel to CC-033's.

### 3. `data/questions.ts` — Q-3C1 coverage item rewrite

Around line 467 (post-CC-033 numbering may differ — locate via the `id: "coverage"` value), update Q-3C1's coverage item:

```ts
items: [
  { id: "cost",       label: "Building wealth and standing",         gloss: "what you build, accumulate, and become known for.",                                  signal: "cost_drive"       },
  { id: "coverage",   label: "Caring for people, service, and society", gloss: "the people you love, the work you give, and the world you contribute to.",       signal: "coverage_drive"   },
  { id: "compliance", label: "Managing risk and uncertainty",        gloss: "guarding against loss, protecting what could be taken.",                            signal: "compliance_drive" },
],
```

Cost and compliance items unchanged.

### 4. `docs/canon/drive-framework.md`

Find the human-label section and update the `coverage` row to "People, Service & Society" / "people, service, and society". Add a CC-040 amendment paragraph documenting:

- The rename rationale: the prior label "People you love" only covered the intimate-circle dimension; the bucket actually measures the full other-directed register including social engagement, civic contribution, professional service, mentor/expert trust.
- The canonical claim: the 3C's framework is exhaustive — Building / Coverage / Compliance is a complete decomposition of where human drive is directed; each bucket's label must match its full scope for the framework to read correctly.
- The architectural rule preserved: framework codename `coverage` unchanged at the TypeScript-type level.

Position adjacent to the CC-033 amendment paragraph for parallel reference.

### 5. `docs/canon/question-bank-v1.md`

Update Q-3C1's entry: coverage item label "Caring for those closest to you" → "Caring for people, service, and society" with the new gloss. CC-040 amendment paragraph documenting the rewording's parallel-with-pie-chart-relabel rationale.

### 6. `docs/canon/allocation-rules.md`

Open and search for the literal phrases "people you love", "People you love", or "coverage bucket". If any reference the coverage bucket by its prior human-facing label, update to "people, service, and society" / "People, Service & Society". If no such references exist, leave the file alone.

### 7. `docs/canon/shape-framework.md`

Same approach — search for "people you love" / "People you love" / "coverage bucket" references. Update human-facing label references only. Leave architectural and codename references (`cost`, `coverage`, `compliance`) alone.

### 8. Verification

- `npx tsc --noEmit` exits 0.
- `npm run lint` passes.
- `npm run build` succeeds (modulo pre-existing /admin Suspense issue, out of scope).
- Existing test suite passes. If a test hardcodes the literal string "People you love" or "the people you love" in an assertion, update only that test's expected string — don't broaden test scope.

### 9. Browser smoke (Jason verifies after CC closes — not engine-verifiable)

After the CC ships, run a fresh session through:

- Pie chart on Path · Gait now shows three slices labeled **Building & wealth / People, Service & Society / Risk and uncertainty**, no clipping at the edges (CC-033's two-line tspan + expanded viewBox handles the longer label).
- Q-3C1's coverage item now reads "Caring for people, service, and society" with the new gloss.
- The engine-prose paragraph under the pie chart for the `balanced` and `unstated` cases reads with "people-service-and-society" in place of "the people you love."
- Existing `aligned` / `inverted-small` / `inverted-big` / `partial-mismatch` cases pick up the new label automatically via `HUMAN_LABELS`.

---

## Acceptance

- `app/components/PieChart.tsx` — `HUMAN_LABEL.coverage === "People, Service & Society"`; aria-label updated.
- `lib/drive.ts` — `HUMAN_LABELS.coverage === "people, service, and society"`; `balanced` and `unstated` prose templates updated with the hyphenated `people-service-and-society` form; the four interpolation-only templates unchanged.
- `data/questions.ts` — Q-3C1 coverage item label "Caring for people, service, and society" with new gloss; `id: "coverage"` and `signal: "coverage_drive"` unchanged.
- `docs/canon/drive-framework.md`, `docs/canon/question-bank-v1.md` updated with CC-040 amendment paragraphs.
- `docs/canon/allocation-rules.md` and `docs/canon/shape-framework.md` updated only if they contained references to the prior label.
- `git diff --stat` shows changes only in named files.
- `npx tsc --noEmit` exits 0. `npm run lint` passes. `npm run build` succeeds.
- A fresh user-flow smoke confirms: (a) pie chart slice reads "People, Service & Society" with no clipping; (b) Q-3C1 coverage item reads broader-scope language; (c) the coverage-bucket label appears verbatim everywhere it surfaces.

---

## Out of scope

If you find yourself doing any of these, stop and flag — they belong elsewhere:

- **Renaming the TypeScript type `DriveBucket`** or the codename `"coverage"` to anything else. The type stays `"cost" | "coverage" | "compliance"`. Only human-facing labels and prose change.
- **Re-tagging existing coverage-bucket signals.** All coverage-tagged signals stay tagged coverage. No moves to cost or compliance.
- **Re-tagging cost or compliance signals.** Both buckets unchanged.
- **Renaming `cost` or `compliance` human labels.** "Building & wealth" and "Risk and uncertainty" stay verbatim from CC-033.
- **Adding a fourth Drive bucket.** The CCC model stays three buckets — canonical claim that the three-bucket decomposition is exhaustive.
- **Adding new signals to the coverage bucket.** The bucket's signal taxonomy is unchanged.
- **Splitting coverage into sub-buckets** (e.g., separate "intimate-care" and "civic-service" buckets). The 3C's framework's strength is its decomposition discipline; sub-bucketing would weaken the model.
- **Editing the `aligned`, `inverted-small`, `inverted-big`, or `partial-mismatch` prose templates.** Those interpolate via `HUMAN_LABELS` and update for free. Touching them risks tone drift.
- **Renaming Q-3C1's `id: "coverage"`, `signal: "coverage_drive"`, or its cost/compliance items.** Only the coverage item's `label` and `gloss` change.
- **Updating Mirror prose** to specifically mention the new bucket label beyond the `HUMAN_LABELS` cascade and the two prose-template edits in `lib/drive.ts`. Engine-prose Round 3 is a separate CC.
- **Component edits beyond `PieChart.tsx`.** `MapSection.tsx`, `QuestionShell.tsx`, `ShapeCard.tsx`, `app/page.tsx`, and the Ranking primitive should all be untouched.
- **Engine logic changes** to `computeDriveDistribution`, `classifyDriveCase`, `extractClaimedDrive`, `weightFor`, or `computeDriveOutput`. Pure label change.
- **Migrating saved sessions.** Pre-CC-040 saved sessions render with the old label only if the engine isn't re-run. Re-rendering picks up the new label automatically. No migration logic needed.

---

## Launch Directive

Run with permissions bypassed. Either: launch CC with `claude --dangerously-skip-permissions`, or in-session toggle `/permissions` → bypass. Project's `.claude/settings.local.json` already sets `defaultMode: "bypassPermissions"` for fresh sessions in this project.

For Codex executors: substitute Codex's permission-bypass mechanism. Substantive sections are tool-agnostic.

## Execution Directive

Complete this CC in a single pass. Do not pause for user confirmation between steps. On any ambiguity, apply canon-faithful interpretation (the rules in `lib/drive.ts:10–22` and the architectural notes in `docs/canon/drive-framework.md` are authoritative) and flag the ambiguity in the Report Back. Do not edit files outside the Allowed-to-Modify list under any circumstance.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` (browser smoke verification only — kill the dev server before exiting)
- `git diff --stat`
- `git status`
- `ls`, `cat`, `grep`, `rg` against the working tree (read-only verification)

## Read First (Required)

Before any edits, read in full:

- `AGENTS.md` (project root) — workflow rules.
- `lib/drive.ts` — full file. Especially the architectural-rules comment block (lines 10–22), `SIGNAL_DRIVE_TAGS` (lines 57–138), `HUMAN_LABELS` (around line 354 post-CC-033), `generateDriveProse` (lines 364–386 post-CC-033).
- `app/components/PieChart.tsx` — full file (post-CC-033 with two-line tspan + expanded viewBox).
- `data/questions.ts` — Q-3C1 around line 462–472 (post-CC-033 form).
- `docs/canon/drive-framework.md` — locate the human-label section and the existing CC-033 amendment paragraph.
- `docs/canon/question-bank-v1.md` — locate Q-3C1's current entry post-CC-033.
- `prompts/completed/CC-033-drive-cost-bucket-ambition-relabel.md` — for the architectural template this CC mirrors.
- `prompts/completed/CC-026-path-3cs-integration-poc.md` — for context on the original Drive framework.

## Allowed to Modify

Only these paths. Editing any other file is a violation of acceptance.

- `app/components/PieChart.tsx`
- `lib/drive.ts`
- `data/questions.ts`
- `docs/canon/drive-framework.md`
- `docs/canon/question-bank-v1.md`
- `docs/canon/allocation-rules.md` (only if it references the prior bucket label)
- `docs/canon/shape-framework.md` (only if it references the prior bucket label)

## Report Back

Required sections in the executing CC's final report:

1. **Files modified** — exact list with line counts changed per file. Confirm against the Allowed-to-Modify list.
2. **Verification results** — paste output of `npx tsc --noEmit`, `npm run lint`, `npm run build`. Note any test failures and whether they were addressed within scope.
3. **Canon decisions surfaced** — any place where canon was ambiguous and a judgment call was applied. Include the rule that resolved the call.
4. **Out-of-scope drift caught** — any change considered and rejected because it would have widened the diff.
5. **Browser smoke deferred to Jason** — confirm the visual verification items listed in Step 9 above remain Jason's responsibility.
6. **Successor recommendations** — if the relabel surfaces tuning needs (e.g., Q-3C1 coverage gloss reading off in browser smoke), name the successor CC explicitly. Do not implement it in this pass.

---

## Notes for the executing engineer

- The Drive framework's TypeScript codename `coverage` is canon-locked. The user-facing label rename does not propagate down to the type definition, the bucket-keys in `DriveDistribution`, or the `id: "coverage"` value in Q-3C1's items array. If you find yourself touching any of those, you've drifted out of scope.
- The hyphenated `people-service-and-society` form is locked for the `balanced` and `unstated` engine-prose templates only. The unhyphenated `people, service, and society` form lives in `HUMAN_LABELS` and gets interpolated into the four interpolation-only templates. Do not unify the forms — the hyphenation serves the list-of-three sentence parallelism, the unhyphenated serves standalone interpolation.
- `HUMAN_LABELS.coverage` capitalization stays lowercase (`"people, service, and society"`) to match the existing `HUMAN_LABELS` convention. Capitalization for the chart slice is in `app/components/PieChart.tsx`'s separate `HUMAN_LABEL` map (`"People, Service & Society"`).
- Saved-session compatibility: pre-CC-040 sessions still compute the same coverage distribution from the same tagged signals. Re-rendering picks up the new label automatically. No migration needed.
- The four interpolation-only prose templates (`aligned`, `inverted-small`, `inverted-big`, `partial-mismatch`) read awkwardly if you imagine reading them aloud with the new label — *"You name people, service, and society as what most often guides you..."* — but they're already designed for label-interpolation and the new label's commas don't break the sentence structure. Do NOT edit them.
- Q-3C1's coverage gloss is *"the people you love, the work you give, and the world you contribute to."* The "the world you contribute to" phrase is intentionally broad — captures civic, communal, and societal-good registers without forcing the user to pick a flavor. Don't substitute "society you belong to" or "community you build" — the canon language is the gloss above.
- The 3C's framework's canonical-completeness claim (Building / Coverage / Compliance is exhaustive) is implicit but worth honoring in the canon-doc amendment paragraph. The decomposition's strength is what makes the relabel effort high-payoff: each bucket must be labeled coherently with its full scope for the framework to deliver on its claim.
