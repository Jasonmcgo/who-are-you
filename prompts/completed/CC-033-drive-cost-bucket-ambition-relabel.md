# CC-033 — Drive Cost-Bucket Relabel + Ambition Signals + Pie Chart Label Fix

**Type:** Drive-framework labeling correction + question-bank addition + 4 new `*_priority` signals + UI rendering fix.
**Goal:** (1) Stop the Drive cost bucket from being labeled "Financial security" — that phrase conflates cost (ambition / wealth-creation) with compliance (security / risk-mitigation), which already lives in its own bucket. (2) Add a new Q-Ambition ranking that captures Success / Fame / Wealth / Legacy as explicit cost-bucket signals. (3) Fix the PieChart text-overflow that cuts off long slice labels (e.g. "Risk and uncertainty 35%" → "sk and uncertainty 35%") on the rendered Drive distribution.
**Predecessors:** CC-026 (Path 3C's POC — original Drive framework), CC-028 (Compass Values Expansion), CC-032 (v2.5 Q-X4/Q-I2 cascade). All shipped pre-2026-04-29.
**Successor:** None hard-blocked. The four new signals make a future ambition-vs-relational pattern catalog entry possible (queued under post-CC-033 pattern work, not this CC).

---

## Why this CC

Real-user testing (Jason, 2026-04-29) surfaces a labeling defect in the Drive framework that's been present since CC-026:

The `cost` bucket renders to users as **"Financial security"** in three places — `app/components/PieChart.tsx`, `lib/drive.ts` HUMAN_LABELS, and `data/questions.ts` Q-3C1 first item ("Protecting financial security"). But "financial security" describes two competing motivators jammed into one phrase:

- **Financial / ambition** — Success, Fame, Reputation, Wealth, Building. Wealth-creation, achievement, recognition. This is what `cost`-tagged signals (`self_spending_priority`, `building_energy_priority`, `money_stakes_priority`, `companies_spending_priority`) actually measure.
- **Security / risk-mitigation** — protecting what you have, guarding against loss. This is what `compliance`-tagged signals already measure (`reputation_stakes_priority`, `health_stakes_priority`, `solving_energy_priority`, `restoring_energy_priority`, the institutional-trust signals).

The two are competing interests, not a unified bucket. By labeling the cost bucket "Financial security" we conflate them and let the user's eye blur a meaningful Drive distinction.

A second, smaller observation: the cost bucket today contains no signals that capture **Success / Fame / Wealth / Legacy** as ambition-class drives. `building_energy_priority` captures *making things*, `self_spending_priority` captures *resource concentration on self*, `money_stakes_priority` captures *money as a loss domain* — none directly measure ambition orientation. Adding a Q-Ambition ranking gives the cost bucket explicit pursuit-class signals, not just resource-allocation proxies.

A third, unrelated observation: PieChart slice labels are positioned at `labelR = (size/2) * 0.55` with `textAnchor="middle"` and a single-line `${label} ${pct}%` string. Long phrases like "Risk and uncertainty 35%" overflow the SVG `viewBox="0 0 ${size} ${size}"` and get clipped on the left. Fix is structural: two-line `tspan` (label on line 1, percentage on line 2) plus a viewBox extended on all sides so outside-the-slice text doesn't clip.

Bundled into one CC because all three changes touch the same human-facing surface (the Drive pie chart rendered on the Path · Gait card) and share a common review surface.

---

## Scope

This CC modifies a focused set of files. Anything not on this list is forbidden.

1. `app/components/PieChart.tsx` — bucket label rename (HUMAN_LABEL map + aria-label) **and** label-overflow fix (two-line tspan + viewBox padding).
2. `lib/drive.ts` — bucket label rename in `HUMAN_LABELS`; engine-prose updates in `generateDriveProse` (the templates that say "financial security" or "financial, relational, and risk-mitigation motivators"); add 4 new entries to `SIGNAL_DRIVE_TAGS` (success_priority, fame_priority, wealth_priority, legacy_priority — all tagged `"cost"`).
3. `lib/identityEngine.ts` — `SIGNAL_DESCRIPTIONS` gets 4 new `*_priority` entries.
4. `data/questions.ts` — Q-3C1 first item label/gloss rewrite; insert new Q-Ambition1 ranking question.
5. `docs/canon/drive-framework.md` — bucket-label canon update; document the rename rationale; add Q-Ambition1 to the input table; document the four new signals' tagging.
6. `docs/canon/question-bank-v1.md` — Q-3C1 entry updated with new first-item wording; new Q-Ambition1 entry appended in the appropriate section (Path · Gait card / role card_id).
7. `docs/canon/signal-library.md` — 4 new `*_priority` signal entries.
8. `docs/canon/allocation-rules.md` — if it references the cost bucket by its prior label, update; otherwise leave alone.
9. `docs/canon/shape-framework.md` — if the Path · Gait card section names the three Drive buckets by their human-facing labels, update; otherwise leave alone.

Internal framework codename `cost` is **not** renamed. The TypeScript `DriveBucket` type stays `"cost" | "coverage" | "compliance"`. Only human-facing labels and prose change. This keeps the diff narrow and avoids cascading renames through every module that references the type.

---

## The decisions, locked

### Bucket label

- **`cost` human label:** "Building & wealth"
- **`coverage` human label:** unchanged — "People you love"
- **`compliance` human label:** unchanged — "Risk and uncertainty"

Capitalization on the cost bucket follows the existing pattern: pie-chart slice label uses sentence-style capitalization ("Building & wealth"), engine-prose phrase uses lowercase ("building & wealth") matching `HUMAN_LABELS` lowercase convention in `lib/drive.ts:354–358`.

### Q-3C1 first-item label

- **From:** `label: "Protecting financial security"` / `gloss: "your money, savings, the resources you've built."`
- **To:** `label: "Building wealth and standing"` / `gloss: "what you build, accumulate, and become known for."`

`signal: "cost_drive"` and `id: "cost"` stay. Coverage and compliance items unchanged.

### Q-Ambition1 — new ranking question

- **question_id:** `Q-Ambition1`
- **card_id:** `role` (Path · Gait card — same as Q-3C1)
- **type:** `ranking`
- **text:** "When you imagine succeeding — what does the win look like?"
- **helper:** "Rank from most pull to least. There are no wrong answers; the model reads direction."
- **items (4):**
  - `success` — "Success" — *"hitting the goals you set, accomplishing what you set out to do."* — signal `success_priority`
  - `fame` — "Fame" — *"being known beyond your immediate circle — recognition, attention, reach."* — signal `fame_priority`
  - `wealth` — "Wealth" — *"accumulation as an end — money and assets you've built and hold."* — signal `wealth_priority`
  - `legacy` — "Legacy" — *"lasting impact — what outlives you in the world or in others."* — signal `legacy_priority`

### Tagging for the four new signals

All four tag to `"cost"` in `SIGNAL_DRIVE_TAGS`. None are multi-tagged. Rationale documented inline in `lib/drive.ts` and in `docs/canon/drive-framework.md`:

- `success_priority` → cost. Achievement orientation is ambition-class.
- `fame_priority` → cost. Recognition-seeking is ambition-class. (Not coverage, even though fame implies others — the *direction of pull* is self-elevation, not other-care.)
- `wealth_priority` → cost. Wealth-as-end is the canonical cost axis.
- `legacy_priority` → cost. What-outlives-you is a building-class drive. (Considered multi-tag with coverage, since legacy can be relational. Rejected: the relational legacy is already captured by `family_priority` and `family_stakes_priority`. Keeping legacy cost-only avoids double-weighting.)

### Engine-prose updates in `lib/drive.ts:generateDriveProse`

The "balanced" and "unstated" templates contain the literal phrase "financial, relational, and risk-mitigation motivators". Both rewrites:

- **balanced (was):** `"Your distribution is unusually balanced — financial, relational, and risk-mitigation motivators show roughly equal weight in your answers. ..."`
- **balanced (now):** `"Your distribution is unusually balanced — building & wealth, the people you love, and risk-mitigation motivators show roughly equal weight in your answers. That balance can mean disciplined integration of three competing drives, or it can mean unresolved tradeoffs the model can't see. Which feels closer?"`

- **unstated (was):** `"Your distribution across financial, relational, and risk-mitigation motivators reveals ${revFirst} as the largest share. ..."`
- **unstated (now):** `"Your distribution across building & wealth, the people you love, and risk-mitigation motivators reveals ${revFirst} as the largest share. Without your claimed drive, the model can't compare what you'd say guides you against what your answers expose."`

The other four templates (`aligned`, `inverted-small`, `inverted-big`, `partial-mismatch`) reference `${revFirst}` / `${claimedFirst}` / `${claimedThird}` only — those interpolate from `HUMAN_LABELS`, so updating `HUMAN_LABELS["cost"] = "building & wealth"` cascades correctly. Don't edit the four interpolation-only templates.

### PieChart label-overflow fix

Two structural changes to `app/components/PieChart.tsx`:

1. **Two-line tspan rendering** (around lines 142–162). Each slice label becomes `<text>` with two `<tspan>` children — line 1 is the human label, line 2 is the percentage. This roughly halves the horizontal width each line needs.
2. **Expanded viewBox** (line 116). Pad the viewBox on all four sides so labels at the outer edge of a slice don't clip when they spill outside the pie's bounding circle. Specifically: change from `viewBox="0 0 ${size} ${size}"` to `viewBox="${-size*0.15} ${-size*0.08} ${size*1.3} ${size*1.16}"`. The pie itself (`cx`, `cy`, `r`) is unchanged — only the canvas grows.
3. **Label positioning unchanged** (`labelR = (size/2) * 0.55`). The two-line + expanded-viewBox combination handles the overflow without moving the labels outward to leader-line placement, which would be a bigger UI change.

The figure container's `width: min(${size}px, 80vw)` rule in the JSX style block stays — the responsive sizing is correct; only the SVG canvas needs more breathing room. The aria-label string updates to match the new bucket vocabulary: `"Drive distribution: building & wealth, people you love, risk and uncertainty"`.

---

## Steps

### 1. `app/components/PieChart.tsx` — HUMAN_LABEL rename + aria + viewBox + tspan

Around line 22:

```tsx
const HUMAN_LABEL: Record<DriveBucket, string> = {
  cost: "Building & wealth",
  coverage: "People you love",
  compliance: "Risk and uncertainty",
};
```

Around line 116, swap the SVG opening:

```tsx
<svg
  viewBox={`${-size * 0.15} ${-size * 0.08} ${size * 1.3} ${size * 1.16}`}
  width="100%"
  height="auto"
  role="img"
  aria-label="Drive distribution: building & wealth, people you love, risk and uncertainty"
>
```

Around line 142–162, replace the slice-label `<text>` block with:

```tsx
{slices.map((slice) => {
  if (slice.pct < 8) return null;
  const mid = sliceMidpoint(cx, cy, labelR, slice);
  const label = HUMAN_LABEL[slice.bucket];
  return (
    <text
      key={`label-${slice.bucket}`}
      x={mid.x}
      y={mid.y}
      textAnchor="middle"
      dominantBaseline="middle"
      style={{
        fontFamily: "var(--font-serif, Georgia, serif)",
        fontSize: Math.max(10, size * 0.05),
        fill: "var(--ink, #2b2417)",
      }}
    >
      <tspan x={mid.x} dy="-0.5em">{label}</tspan>
      <tspan x={mid.x} dy="1.1em">{slice.pct}%</tspan>
    </text>
  );
})}
```

The header comment block at the top of the file should pick up a CC-033 amendment line noting the rename and the overflow fix. Don't rewrite the existing CC-026 commentary.

### 2. `lib/drive.ts` — HUMAN_LABELS + prose templates + tagging table

Around line 354:

```ts
const HUMAN_LABELS: Record<DriveBucket, string> = {
  cost: "building & wealth",
  coverage: "the people you love",
  compliance: "risk and uncertainty",
};
```

Around line 380, the `balanced` case:

```ts
case "balanced":
  return `Your distribution is unusually balanced — building & wealth, the people you love, and risk-mitigation motivators show roughly equal weight in your answers. That balance can mean disciplined integration of three competing drives, or it can mean unresolved tradeoffs the model can't see. Which feels closer?`;
```

Around line 383, the `unstated` case:

```ts
case "unstated":
default:
  return `Your distribution across building & wealth, the people you love, and risk-mitigation motivators reveals ${revFirst} as the largest share. Without your claimed drive, the model can't compare what you'd say guides you against what your answers expose.`;
```

In the `SIGNAL_DRIVE_TAGS` map (around lines 57–138), append after the existing Q-E1 outward block (around line 90):

```ts
  // Q-Ambition1 — what success looks like. All four tag cost (ambition-class).
  // Rationale per signal documented in docs/canon/drive-framework.md.
  success_priority: "cost",
  fame_priority: "cost",
  wealth_priority: "cost",
  legacy_priority: "cost",
```

Header comment at the top of the file picks up a CC-033 amendment line noting the rename and the four new signals.

### 3. `lib/identityEngine.ts` — SIGNAL_DESCRIPTIONS additions

Append four new entries to the `SIGNAL_DESCRIPTIONS` object (find an existing `*_priority` entry like `building_energy_priority` and append nearby, matching the file's existing style):

```ts
success_priority:
  "Pulls toward success — hitting the goals you set, accomplishing what you set out to do — when imagining what winning looks like.",
fame_priority:
  "Pulls toward fame — recognition, attention, reach beyond the immediate circle — when imagining what winning looks like.",
wealth_priority:
  "Pulls toward wealth — accumulation as an end, money and assets built and held — when imagining what winning looks like.",
legacy_priority:
  "Pulls toward legacy — lasting impact, what outlives you in the world or in others — when imagining what winning looks like.",
```

These four are NOT added to `SACRED_PRIORITY_SIGNAL_IDS` — they are Drive-bucket signals, not sacred-value signals. The architectural rule from `lib/drive.ts:10–14` (drive signals stay outside sacred priority) applies.

### 4. `data/questions.ts` — Q-3C1 rewrite + new Q-Ambition1

Around line 467, update Q-3C1's first item (and only the first item — leave coverage and compliance items alone):

```ts
items: [
  { id: "cost",       label: "Building wealth and standing",     gloss: "what you build, accumulate, and become known for.",        signal: "cost_drive"       },
  { id: "coverage",   label: "Caring for those closest to you",  gloss: "the people, relationships, and commitments you love.",     signal: "coverage_drive"   },
  { id: "compliance", label: "Managing risk and uncertainty",    gloss: "guarding against loss, protecting what could be taken.",   signal: "compliance_drive" },
],
```

Insert Q-Ambition1 immediately AFTER Q-3C1 (around line 472). Q-Ambition1 sits on the same Path · Gait card (`card_id: "role"`) and reads as a refinement of Q-3C1's cost axis:

```ts
{
  // CC-033 — Q-Ambition1. Path-anchored ambition-class ranking. Captures
  // explicit pursuit-orientation signals (Success / Fame / Wealth / Legacy)
  // for the cost bucket of the Drive framework. All four items tag "cost"
  // in lib/drive.ts SIGNAL_DRIVE_TAGS. Rank-aware weighting applies (rank 1
  // = 3x, rank 2 = 2x, rank 3 = 1x, rank 4 = 0.5x).
  //
  // Sits adjacent to Q-3C1 on the role card. Q-3C1 captures CLAIMED top-
  // level drive across all three buckets; Q-Ambition1 refines the REVEALED
  // measurement inside the cost bucket.
  question_id: "Q-Ambition1",
  card_id: "role",
  type: "ranking",
  text: "When you imagine succeeding — what does the win look like?",
  helper: "Rank from most pull to least. There are no wrong answers; the model reads direction.",
  items: [
    { id: "success", label: "Success", gloss: "hitting the goals you set, accomplishing what you set out to do.",       signal: "success_priority" },
    { id: "fame",    label: "Fame",    gloss: "being known beyond your immediate circle — recognition, attention, reach.", signal: "fame_priority"    },
    { id: "wealth",  label: "Wealth",  gloss: "accumulation as an end — money and assets you've built and hold.",          signal: "wealth_priority"  },
    { id: "legacy",  label: "Legacy",  gloss: "lasting impact — what outlives you in the world or in others.",             signal: "legacy_priority"  },
  ],
},
```

### 5. `docs/canon/drive-framework.md`

Find the human-label section and update the `cost` row to "Building & wealth" / "building & wealth". Add a CC-033 amendment paragraph documenting:

- The rename rationale (cost = ambition / wealth-creation, NOT security; security lives in compliance).
- The four new ambition-class signals and Q-Ambition1's role as their source question.
- The architectural rule preserved: framework codename `cost` unchanged at the TypeScript-type level.

If the canon enumerates the input-signals table for the cost bucket, append the four new signals with `cost` tag and rank-aware weighting noted.

### 6. `docs/canon/question-bank-v1.md`

Update Q-3C1's entry: first-item label "Protecting financial security" → "Building wealth and standing" with the new gloss. Append a Q-Ambition1 entry in the role-card section (or wherever Q-3C1 sits). CC-033 amendment paragraph at the top of the affected section.

### 7. `docs/canon/signal-library.md`

Append four new signal entries following the existing template (signal_id, description, primary_cards: [role], produced_by_questions: [Q-Ambition1], rank-aware: true, marked active). Position alphabetically or after `building_energy_priority`, matching the file's existing convention.

### 8. `docs/canon/allocation-rules.md`

Open and search for the literal phrases "financial security", "Financial security", or "cost bucket". If any reference the cost bucket by its prior human-facing label, update to "building & wealth" / "Building & wealth". If no such references exist, leave the file alone.

### 9. `docs/canon/shape-framework.md`

Same approach — search for "financial security" / "Financial security" / "cost bucket" references. Update human-facing label references only. Leave architectural and codename references (`cost`, `coverage`, `compliance`) alone. If the file already names the three buckets in their human labels, the cost row updates to "Building & wealth".

### 10. Verification

- `npx tsc --noEmit` exits 0.
- `npm run lint` passes.
- `npm run build` succeeds.
- Existing test suite passes. If a test hardcodes the literal string "Financial security" or "financial security" in an assertion, update only that test's expected string — don't broaden test scope.

### 11. Browser smoke (Jason verifies after CC closes — not engine-verifiable)

After the CC ships, run a fresh session through:

- Pie chart on Path · Gait now shows three slices labeled **Building & wealth / People you love / Risk and uncertainty**, each on two lines (label, then percentage), no clipping at the edges.
- Q-Ambition1 renders with 4 draggable items, all glosses visible.
- Q-3C1's first item now reads "Building wealth and standing" with the new gloss.
- The engine-prose paragraph under the pie chart for the `balanced` and `unstated` cases reads with "building & wealth" in place of "financial".
- Existing `aligned` / `inverted-small` / `inverted-big` / `partial-mismatch` cases pick up the new label automatically via `HUMAN_LABELS`.

---

## Acceptance

- `app/components/PieChart.tsx` — `HUMAN_LABEL.cost === "Building & wealth"`; aria-label updated; viewBox padded; slice labels render as two `<tspan>` lines.
- `lib/drive.ts` — `HUMAN_LABELS.cost === "building & wealth"`; `balanced` and `unstated` prose templates updated; `SIGNAL_DRIVE_TAGS` contains the four new entries (`success_priority`, `fame_priority`, `wealth_priority`, `legacy_priority`), each tagged `"cost"`.
- `lib/identityEngine.ts` — `SIGNAL_DESCRIPTIONS` contains the four new entries.
- `data/questions.ts` — Q-3C1 first item updated to "Building wealth and standing" with new gloss; Q-Ambition1 inserted with the 4 items as specified, `card_id: "role"`, `type: "ranking"`.
- `docs/canon/drive-framework.md`, `docs/canon/question-bank-v1.md`, `docs/canon/signal-library.md` updated. `docs/canon/allocation-rules.md` and `docs/canon/shape-framework.md` updated only if they contained references to the prior label.
- `git diff --stat` shows changes only in the named files. No file outside the Allowed-to-Modify list has been edited.
- `npx tsc --noEmit` exits 0. `npm run lint` passes. `npm run build` succeeds.
- A fresh user-flow smoke confirms: (a) Q-Ambition1 renders, (b) pie chart shows two-line labels with no clipping, (c) the cost-bucket label reads "Building & wealth" everywhere it surfaces.

---

## Out of scope

If you find yourself doing any of these, stop and flag — they belong elsewhere:

- **Renaming the TypeScript type `DriveBucket`** or the codename `"cost"` to anything else. The type stays `"cost" | "coverage" | "compliance"`. Only human-facing labels and prose change.
- **Re-tagging existing cost-bucket signals.** `self_spending_priority`, `building_energy_priority`, `money_stakes_priority`, `companies_spending_priority`, `learning_energy_priority`, `job_stakes_priority` all stay tagged `"cost"`. No moves to compliance or coverage.
- **Re-tagging coverage or compliance signals.** Both buckets unchanged.
- **Renaming `coverage` or `compliance` human labels.** "People you love" and "Risk and uncertainty" stay verbatim.
- **Adding a fourth Drive bucket.** The CCC model stays three buckets. The cost-bucket relabel does NOT introduce a fourth axis.
- **Adding multi-tag splits for the four new signals.** All four are cost-only. Specifically, `legacy_priority` does NOT multi-tag with coverage — relational legacy is already captured by `family_priority` and family-class signals.
- **Adding the four new signals to `SACRED_PRIORITY_SIGNAL_IDS`.** They are Drive signals, not sacred-value signals. The architectural rule in `lib/drive.ts:10–14` forbids the conflation.
- **Editing the `aligned`, `inverted-small`, `inverted-big`, or `partial-mismatch` prose templates.** Those interpolate via `HUMAN_LABELS` and update for free. Touching them risks tone drift.
- **Authoring new cross-card patterns** that leverage `success_priority`, `fame_priority`, `wealth_priority`, or `legacy_priority`. That's the post-CC-033 pattern catalog work, not this CC.
- **Mirror prose updates** to specifically mention the new bucket label or the new signals beyond the `HUMAN_LABELS` cascade and the two prose-template edits in `lib/drive.ts`. Engine-prose Round 3 is a separate CC.
- **Component edits beyond `PieChart.tsx`.** `MapSection.tsx`, `QuestionShell.tsx`, `ShapeCard.tsx`, `app/page.tsx`, and the Ranking primitive should all be untouched. Q-Ambition1 renders via the existing Ranking component with no modifications.
- **Engine logic changes** to `computeDriveDistribution`, `classifyDriveCase`, `extractClaimedDrive`, `weightFor`, or `computeDriveOutput`. The four new signals flow through the existing rank-aware weighting unchanged.
- **Migrating saved sessions.** Pre-CC-033 saved sessions don't have Q-Ambition1 answers; the cost-bucket distribution computation still works without them (the function tolerates missing signals). No migration needed.
- **Renaming Q-3C1's `id: "cost"`, `signal: "cost_drive"`, or its coverage/compliance items.** Only the first item's `label` and `gloss` change.
- **Adjusting rank-weighting tiers** (`weightFor` in `lib/drive.ts:154–160`). The existing 3/2/1/0.5 ladder applies to Q-Ambition1 unchanged.

---

## Launch Directive

Run with permissions bypassed. Either: launch CC with `claude --dangerously-skip-permissions`, or in-session toggle `/permissions` → bypass. Project's `.claude/settings.local.json` already sets `defaultMode: "bypassPermissions"` — fresh sessions in this project should be bypass by default. If a permission prompt appears, the launch flag was not picked up; restart with `--dangerously-skip-permissions`.

## Execution Directive

Complete this CC in a single pass. Do not pause for user confirmation between steps. On any ambiguity, apply canon-faithful interpretation (the rules in `lib/drive.ts:10–22` and the architectural notes in `docs/canon/drive-framework.md` are authoritative) and flag the ambiguity in the Report Back. Do not edit files outside the Allowed-to-Modify list under any circumstance.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` (for browser smoke verification only — kill the dev server before exiting)
- `git diff --stat`
- `git status`
- `ls`, `cat`, `grep`, `rg` against the working tree (read-only verification)

## Read First (Required)

Before any edits, read in full:

- `AGENTS.md` (project root) — workflow rules.
- `lib/drive.ts` — current Drive framework implementation, especially the architectural-rules comment block (lines 10–22), the tagging table (lines 57–138), `HUMAN_LABELS` (lines 354–358), and `generateDriveProse` (lines 364–386).
- `lib/identityEngine.ts` — `SIGNAL_DESCRIPTIONS` location and style; `SACRED_PRIORITY_SIGNAL_IDS` definition (to confirm the new four signals are NOT added to it).
- `lib/types.ts` — `DriveBucket`, `DriveDistribution`, `DriveRanking`, `DriveOutput`, `Signal`, `SignalId` definitions.
- `data/questions.ts` — Q-3C1 (around line 462–472) and surrounding Path/Role-card questions; the Q-S3-* and Q-E1-* allocation block patterns for stylistic consistency in the new Q-Ambition1 entry.
- `app/components/PieChart.tsx` — full file (213 lines). Understand the existing slice/label/badge rendering before editing.
- `docs/canon/drive-framework.md` — full file. Locate the existing human-label section and the input-signals table.
- `docs/canon/question-bank-v1.md` — locate Q-3C1's current entry and the role-card section structure.
- `docs/canon/signal-library.md` — locate the existing `*_priority` entries to match style.
- `prompts/completed/CC-026-path-3cs-integration-poc.md` — for context on the original Drive framework integration.
- `prompts/completed/CC-028-compass-values-expansion.md` — for the canonical pattern of "add new ranking items + new `*_priority` signals + canon updates" that this CC mirrors structurally.

## Allowed to Modify

Only these paths. Editing any other file is a violation of acceptance.

- `app/components/PieChart.tsx`
- `lib/drive.ts`
- `lib/identityEngine.ts`
- `data/questions.ts`
- `docs/canon/drive-framework.md`
- `docs/canon/question-bank-v1.md`
- `docs/canon/signal-library.md`
- `docs/canon/allocation-rules.md` (only if it references the prior bucket label)
- `docs/canon/shape-framework.md` (only if it references the prior bucket label)

## Report Back

Required sections in the executing CC's final report:

1. **Files modified** — exact list with line counts changed per file. Confirm against the Allowed-to-Modify list.
2. **Verification results** — paste output of `npx tsc --noEmit`, `npm run lint`, `npm run build`. Note any test failures and whether they were addressed within scope.
3. **Canon decisions surfaced** — any place where canon was ambiguous and a judgment call was applied. Include the rule that resolved the call.
4. **Out-of-scope drift caught** — any change considered and rejected because it would have widened the diff. List explicitly so the next CC author can pick up dropped scope.
5. **Browser smoke deferred to Jason** — confirm the visual verification items listed in Step 11 above remain Jason's responsibility.
6. **Successor recommendations** — if Q-Ambition1's distribution behavior or the new signals' weighting reveals tuning needs in browser smoke, name the successor CC explicitly. Do not implement it in this pass.

---

## Notes for the executing engineer

- The Drive framework's TypeScript codename `cost` is canon-locked. The user-facing label rename does not propagate down to the type definition, the bucket-keys in `DriveDistribution`, or the `id: "cost"` value in Q-3C1's items array. If you find yourself touching any of those, you've drifted out of scope.
- The four new signals are locked: `success_priority`, `fame_priority`, `wealth_priority`, `legacy_priority`. Don't substitute names. Glosses are also locked — surface tone-issues during browser smoke as follow-ups; don't silently rewrite during this CC.
- `legacy_priority` is single-tagged `"cost"` in this CC, not multi-tagged. If browser smoke later reveals the relational dimension of legacy needs explicit weighting, surface as a successor CC. Do not multi-tag in this pass.
- The engine-prose template edits target only `balanced` and `unstated` cases. The other four cases interpolate via `HUMAN_LABELS["cost"]` and pick up the new label automatically. Touching them is out of scope.
- The PieChart `viewBox` change is the load-bearing fix for label overflow — without it, the two-line `tspan` rendering still clips when slices spill labels outside the original `0 0 size size` box. Don't skip the viewBox edit even if the tspan edit makes labels look better.
- Saved-session compatibility: pre-CC-033 saved sessions don't carry Q-Ambition1 answers. The Drive distribution still computes from the existing tagged signals; the four new signals just don't contribute weight for those sessions. New sessions get the full Q-Ambition1 input. No migration needed.
- The four new signals do NOT participate in `compassRanksTop()` or any sacred-priority computation. They are Drive-bucket-only. Adding them to `SACRED_PRIORITY_SIGNAL_IDS` would corrupt Compass-card output — do not.
