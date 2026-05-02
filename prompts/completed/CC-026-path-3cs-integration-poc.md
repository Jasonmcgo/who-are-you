# CC-026 — Drive Integration on Path · Gait (POC)

**Type:** New measurement axis + new derivation surface + visualization component + Path render extension. **First explicit "why-axis" in the model — most measurements today expose *what*; this CC introduces *why*.**
**Goal:** Add **Drive** as a named architectural register in the model. Capture the user's *claimed* drive via one new ranking question (Q-3C1); derive the user's *revealed* drive via signal-tagging across 15 existing question-equivalents; render both as a pie chart on Path · Gait with prose interpretation and a named tension. Three layers — visual, narrative, tension-as-data-point — for one architectural read: claimed-why vs. revealed-why.
**Predecessors:** CC-024, CC-027, CC-028 (shipped). CC-025 (engine prose tuning) in flight; CC-026 lands after CC-025 so Path's prose architecture is the new 4-section structure when this CC plugs in.
**Successor:** CC-026b would extend with cross-card drive-pattern surfaces (Lens × Drive, Conviction × Drive, etc.) if v1 smoke confirms the read is meaningful.

---

## Why this CC — the architectural cut

Almost every question in the bank exposes a *what*:

| Today's measurements | What they answer |
|---|---|
| Q-S1, Q-S2, Q-Stakes1 | *What* you protect / fear losing |
| Q-S3-*, Q-E1-* | *Where* your money / energy actually flows |
| Q-X3, Q-X4 | *Who* you trust |
| Q-T1–T8 | *How* you process |
| Q-A1, Q-A2 | *What* you do with time |
| Q-F1, Q-F2 | *What* shaped you |
| Q-P1 / Q-P2 / Q-C1 / Q-C3 / Q-C4 | *What* you do under pressure / preference |

The Keystone block (Q-I1 / Q-I1b / Q-I2 / Q-I3) does narrow why-work — *why* one specific named belief is held, what could revise it, what it would cost. But it scopes to a single belief.

**Drive is the model's first broad why-measurement.** Not what you do — what motivates the doing. The unseen motivator under the visible action. The engine of why your energy flows where it flows.

Drive is distinct from energy:

- **Energy** = the resource. Already measured by Q-E1-outward / Q-E1-inward / Q-E1-cross / Q-A2. Captures where discretionary energy actually flows. Existing register; unchanged by this CC.
- **Drive** = what motivates the exertion of energy. The *why* behind the *what*. Newly explicit via Q-3C1 + the 15-input signal-tagging map.

The three drives — **Cost-drive** (resource accumulation / financial security), **Coverage-drive** (relational care / others-as-engine), **Compliance-drive** (risk-mitigation / safety-as-engine) — compete for the user's energy expenditure. Drive is stable across days; energy expenditure varies by week.

**The matrix-tension this CC unlocks: claimed drive vs. revealed drive.** Q-3C1 captures what the user *claims* motivates them (their narrative about themselves). The 15-input distribution captures what the user's actual answers *reveal* about their motivators. The gap between claimed-why and revealed-why is the first surface in the model where the user can see whether the story they tell themselves matches the story their answers tell.

---

## Three architectural reads the CC exposes

| Claimed drive (Q-3C1 #1) | Revealed drive (largest slice) | What the engine surfaces |
|---|---|---|
| Cost | Cost | **Aligned** — what you name as your motivator is what your answers expose |
| Cost | Coverage / Compliance | **Inverted-small** — your declared why points one direction; your revealed why points another |
| Coverage | Compliance | The motivator you've named differs from the motivator your distribution reveals |
| (Q-3C1 skipped) | Any | **Unstated** — distribution renders, but the model can't compare claimed-vs-revealed |
| Three slices ~33% each | Any rank | **Balanced** — disciplined integration, or unresolved tradeoffs the model can't see |

The "inverted-small" case (claimed #1 is the smallest revealed slice) is the central architectural insight. It's not that the user is being dishonest — it's that the why-they-tell-themselves and the why-their-answers-reveal are pointing at different things. That gap is informative and worth seeing.

---

## Scope

**Three layers of integration — chart, prose, tension-as-data-point. All three ship together; each carries different cognitive load.**

1. **`data/questions.ts`** — new ranking question Q-3C1 inserted between Q-Stakes1 and Q-I1.
2. **`lib/types.ts`** — three new SignalIds (`cost_drive`, `coverage_drive`, `compliance_drive`); new types `DriveRanking`, `DriveDistribution`, `DriveCase`, `DriveOutput`; `PathOutput` extended with `drive?: DriveOutput`.
3. **`lib/identityEngine.ts`** — `SIGNAL_DESCRIPTIONS` entries for the three new signals; Path output construction extended to include `drive` field.
4. **`lib/drive.ts` (NEW)** — single canonical home for the Drive framework. Tagging table mapping signal_ids to drive buckets; distribution-computation function; case classifier; prose-generation function.
5. **New tension entry** — `T-D1` (internal ID) surfacing as **"Claimed and Revealed Drive"** (user-facing name per CC-025's tension-renaming rule). Fires on `inverted-small` and `inverted-big` cases.
6. **`app/components/PieChart.tsx` (NEW)** — three-slice SVG pie chart with optional rank badges. Paper / ink / umber palette.
7. **`app/components/PathExpanded.tsx`** — new "Distribution" subsection mounted above existing Work / Love / Give body. Renders chart + interpretation paragraph + small note when the tension also surfaces in Open Tensions.
8. **`lib/renderMirror.ts`** — markdown export for the Distribution subsection.
9. **Canon docs** — new `docs/canon/drive-framework.md` (architectural opening leads with the what/why distinction); updates to `question-bank-v1.md`, `signal-library.md`, `tension-library-v1.md`, `shape-framework.md`.

Out of scope explicitly: cross-card drive-pattern surfaces (Lens × Drive, Conviction × Drive, Sacred × Drive, etc. from `prompts/queued/path-3cs-allocation-notes.md`); LLM substitution; extending the chart to other cards beyond Path; new questions beyond Q-3C1; changes to existing questions, signals, or patterns; renaming or removing any existing measurement.

---

## Phase 1 — Data Layer

### Step 1.1 — Add Q-3C1 to `data/questions.ts`

Insert between Q-Stakes1 (around line 364) and the Keystone block comment. Conceptual flow: sacred values → allocation → stakes → drive → keystone. Q-3C1 asks the meta-priority question after the user has named what they protect, where their resources flow, and what they fear losing.

```ts
{
  // CC-026 — Q-3C1. Path-anchored drive-priority ranking. Captures the user's
  // CLAIMED drive across the three drive-categories (Cost-drive / Coverage-drive
  // / Compliance-drive). Internal framework name: Drive. User-facing prose
  // never exposes the framework terms — items render in human language.
  //
  // The rank captured here is the claimed drive. The user's REVEALED drive
  // derives from 15 existing question-equivalents (5 per bucket; see
  // lib/drive.ts tagging table). The matrix between claimed and revealed
  // is the tension this CC surfaces — the model's first claimed-vs-revealed
  // why-axis.
  question_id: "Q-3C1",
  card_id: "role",          // routes to Path · Gait via SURVEY_CARD_TO_SHAPE_CARD
  type: "ranking",
  text: "When you have to choose, which most often guides you?",
  helper: "Three of how decisions actually get made. Rank by which most often wins when they pull apart.",
  items: [
    {
      id: "cost",
      label: "Protecting financial security",
      gloss: "your money, savings, the resources you've built.",
      signal: "cost_drive",
    },
    {
      id: "coverage",
      label: "Caring for those closest to you",
      gloss: "the people, relationships, and commitments you love.",
      signal: "coverage_drive",
    },
    {
      id: "compliance",
      label: "Managing risk and uncertainty",
      gloss: "guarding against loss, protecting what could be taken.",
      signal: "compliance_drive",
    },
  ],
},
```

`card_id: "role"` activates the previously-reserved `role` survey card_id (already mapped to Path · Gait in `SURVEY_CARD_TO_SHAPE_CARD`). No mapping change needed.

### Step 1.2 — Add three signal descriptions

In `lib/identityEngine.ts` `SIGNAL_DESCRIPTIONS`, append after the `*_stakes_priority` block (around line 147):

```ts
cost_drive:
  "Claims protecting financial security — money, savings, accumulated resources — as the drive that most often guides decisions.",
coverage_drive:
  "Claims caring for those closest — people, relationships, commitments — as the drive that most often guides decisions.",
compliance_drive:
  "Claims managing risk and uncertainty — guarding against loss, protecting what could be taken — as the drive that most often guides decisions.",
```

The `*_drive` suffix distinguishes these from sacred-value `*_priority` signals on a different axis. **Don't add to `SACRED_PRIORITY_SIGNAL_IDS` or `SACRED_IDS`** — drive is its own register; conflating with sacred-value math would corrupt compass-ranking computations. (CC-028 had a spec slip on the duplicate sacred-IDs arrays; CC-026 explicitly tells the engineer: drive signals are independent.)

### Step 1.3 — Create `lib/drive.ts`

The canonical home for the Drive framework. Single new file containing:

**A. Tagging table** — `Record<SignalId, DriveBucket>` where `DriveBucket = "cost" | "coverage" | "compliance" | "multi" | "exclude"`. Maps each existing signal to its primary drive bucket. Multi-tagged signals (`family_spending_priority` is both Cost-drive and Coverage-drive; `caring_energy_priority` is both Coverage-drive and Cost-drive at the resource layer; `stability_priority` is both Compliance-drive and Coverage-drive) get tagged `"multi"` and split-weighted at distribution-compute time. Excluded signals (the Four Voices `ni`/`ne`/`si`/`se`/`ti`/`te`/`fi`/`fe` — cognitive style, not drive) are tagged `"exclude"`.

**B. Five-input-per-bucket target distribution:**

| Drive bucket | 5 inputs (rank-aware where applicable) |
|---|---|
| **Cost-drive** | Q-S3-close (3-item ranking, money flow within close circle) · Q-S3-wider (3-item ranking, money flow beyond close circle) · Q-S3-cross (resolved money tension) · Q-Stakes1 *money* item · Q-P2 economic-pressure response |
| **Coverage-drive** | Q-E1-inward (3-item ranking, caring/learning/enjoying) · Q-E1-cross (resolved energy tension) · Q-S2 (Family/Compassion/Mercy item subset) · Q-X4 (close-trust sources, 5-item ranking) · Q-Stakes1 *close-relationships* item |
| **Compliance-drive** | Q-S1 (Stability/Honor item subset) · Q-X1 forced response (current load) · Q-X3 (institutional trust, 5-item ranking) · Q-F1 + Q-F2 (formation context, treated as one input) · Q-Stakes1 (*health* + *reputation* item subset) |

The math: rank-aware weighted sum per bucket. A signal at rank 1 in a 3-item ranking weighs more than a signal at rank 3. A forced-choice signal weighs as 1 unit. Multi-tagged signals split-weight 50/50 across their two buckets. Final percentages normalized to sum to 100.

**C. Types and computation functions:**

```ts
export type DriveBucket = "cost" | "coverage" | "compliance";

export type DriveRanking = {
  first: DriveBucket;
  second: DriveBucket;
  third: DriveBucket;
};

export type DriveDistribution = {
  cost: number;        // 0-100, summing with coverage + compliance to 100
  coverage: number;
  compliance: number;
  rankAware: boolean;
  inputCount: { cost: number; coverage: number; compliance: number };
};

export type DriveCase =
  | "aligned"
  | "inverted-small"
  | "inverted-big"
  | "partial-mismatch"
  | "balanced"
  | "unstated";  // Q-3C1 skipped

export type DriveOutput = {
  distribution: DriveDistribution;  // revealed drive
  claimed?: DriveRanking;            // present when Q-3C1 was answered
  case: DriveCase;
  prose: string;                     // case-specific interpretation paragraph
};

export function computeDriveDistribution(
  signals: Signal[],
  answers: Answer[]
): DriveDistribution;

export function classifyDriveCase(
  claimed: DriveRanking | undefined,
  revealed: DriveDistribution
): DriveCase;

export function generateDriveProse(
  output: DriveOutput
): string;
```

Encode case-classifier thresholds as named constants (e.g., `BALANCED_THRESHOLD_PERCENT = 10`, `INVERSION_GAP_THRESHOLD_PERCENT = 15`) so future tuning is visible.

### Step 1.4 — Extend `PathOutput`

In `lib/types.ts`:

```ts
export type PathOutput = {
  cardName: "Path";
  bodyPart: "Gait";
  directionalParagraph: string;
  work: string;
  love: string;
  give: string;
  growthCounterweight: string;
  patternNote: string;       // CC-025
  drive?: DriveOutput;        // CC-026 — present when distribution is computable
};
```

### Step 1.5 — Wire into Path output construction

In `lib/identityEngine.ts`, where `PathOutput` is constructed: import from `lib/drive.ts`, compute revealed distribution, classify case (using claimed ranking if Q-3C1 was answered), generate prose, attach to `PathOutput.drive`. When Q-3C1 is unanswered, `claimed` is undefined and `case` is `"unstated"`.

### Step 1.6 — Add `T-D1` tension

Internal ID `T-D1`; user-facing name per CC-025: **"Claimed and Revealed Drive"**. Fires on `inverted-small` and `inverted-big` cases.

User-prompt template (per CC-025's Allocation Gap softening pattern):

> *"You named {claimed_first_human} as the drive that most often guides you. Your distribution reveals a different motivator — your answers point most strongly toward {revealed_first_human}, with {claimed_first_human} appearing as the {gap_descriptor} share. That gap does not mean dishonesty. The model cannot know which is closer to truth.*
>
> *It could mean: a season of constraint, a recent shift, a stated ideal that hasn't yet caught up to lived reality, or a real gap between the why you tell yourself and the why your answers reveal.*
>
> *The only fair question is: does this feel true, partially true, or not true at all?"*

Interpolations: `{claimed_first_human}`, `{revealed_first_human}` use the human-language phrases (*"financial security"* / *"the people you love"* / *"risk and uncertainty"*); `{gap_descriptor}` is *"smallest"* for `inverted-small` or *"third"* for `inverted-big`.

---

## Phase 2 — Visualization

### Step 2.1 — `app/components/PieChart.tsx` (new)

Small dependency-free SVG component:

```tsx
type PieChartProps = {
  cost: number;        // 0-100
  coverage: number;    // 0-100
  compliance: number;  // 0-100
  rank?: DriveRanking; // optional rank badges
  size?: number;       // default 240px
};
```

Rendering:

- Three SVG arc slices, sized proportionally.
- Palette: paper background, ink slice strokes, umber accent on the largest slice.
- Slice labels at slice midpoints in human language (*"Financial security"* / *"People you love"* / *"Risk and uncertainty"*) — never *"Cost"* / *"Coverage"* / *"Compliance"*.
- When `rank` is provided, render numbered badges (1 / 2 / 3) at each slice, indicating the user's claimed drive.
- When `rank` is undefined, slices render without badges.
- Mobile clamp: `width: min(240px, 80vw); height: auto`.

The chart is editorial, not dashboard. Goal: feels like a quiet, considered diagram, not an analytics widget.

### Step 2.2 — Mount in `app/components/PathExpanded.tsx`

New "Distribution" subsection above the existing body. Order on Path becomes:

1. Distribution (new — pie chart + interpretation paragraph + tension-also-surfaces note)
2. Work
3. Love
4. Give
5. Growth Counterweight
6. Pattern Note (from CC-025)

Structure:

```tsx
{output.drive && (
  <section>
    <h3>Distribution</h3>
    <PieChart {...output.drive.distribution} rank={output.drive.claimed} />
    <p>{output.drive.prose}</p>
    {(output.drive.case === "inverted-small" || output.drive.case === "inverted-big") && (
      <p className="tension-cross-reference">
        {/* "Also surfaced in Open Tensions as Claimed and Revealed Drive." */}
      </p>
    )}
  </section>
)}
```

When `output.drive` is undefined, the section doesn't render. Path stays as today for low-completion sessions.

---

## Phase 3 — Prose

### Step 3.1 — Six prose templates per case

`lib/drive.ts` exports `generateDriveProse(output)` keyed by case. The templates lead with the claimed-vs-revealed framing, not the stated-vs-actual framing:

**Aligned:** *"You name {claimed_first_human} as what most often guides you, and your answers reveal the same motivator — your distribution shows {revealed_first_human} as the largest share. The match is informative; the why you claim and the why your answers expose are pointing at the same thing."*

**Inverted-small (the architectural lead case):** *"You name {claimed_first_human} as what most often guides you. Your distribution reveals a different motivator — your answers point most strongly toward {revealed_first_human}, with {claimed_first_human} appearing as the smallest share. There's a gap between the why you tell yourself and the why your answers expose. The model doesn't read which is closer to truth — it surfaces the gap and asks whether you want to."*

**Inverted-big:** *"What you rank as third in priority is what your distribution reveals as your largest share. {revealed_first_human} dominates your answers — even though you named {claimed_third_human} as third in priority. Sometimes the motivators we don't name are the motivators that have the most weight in our actual lives."*

**Partial-mismatch:** *"You name {claimed_first_human} as your top drive, and your answers reveal it as a real share — but not the largest. Your distribution leans more toward {revealed_first_human}. The lean is informative; the question is whether it's intentional, seasonal, or a quiet drift the model is exposing."*

**Balanced:** *"Your distribution is unusually balanced — financial, relational, and risk-mitigation motivators show roughly equal weight in your answers. That balance can mean disciplined integration of three competing drives, or it can mean unresolved tradeoffs the model can't see. Which feels closer?"*

**Unstated (Q-3C1 skipped):** *"Your distribution across financial, relational, and risk-mitigation motivators reveals {revealed_first_human} as the largest share. Without your claimed drive, the model can't compare what you'd say guides you against what your answers expose."*

### Step 3.2 — Mirror Synthesis hook (forward-looking)

CC-025 (Engine Prose Tuning Round 2) is in flight. Its Mirror Synthesis section can — in a follow-up tuning pass — reference the drive read directly. Example: *"What animates this shape — the why under the what — appears to be {revealed_first_human}."* Make this a documented hook in canon for CC-025's prose work to consume; do not edit Synthesis prose in this CC.

### Step 3.3 — Markdown export

`lib/renderMirror.ts` updated to render the Distribution subsection. Format:

```markdown
### Distribution

[Distribution: Financial security X%, People you love Y%, Risk and uncertainty Z%]
Claimed drive: 1. {first} 2. {second} 3. {third}

{Distribution prose}
```

---

## Acceptance

- Q-3C1 added to `data/questions.ts` with `card_id: "role"`, `type: "ranking"`, three items with the locked human-language labels and glosses.
- Three new SignalIds (`cost_drive`, `coverage_drive`, `compliance_drive`) registered in `SIGNAL_DESCRIPTIONS`. **Not added to `SACRED_PRIORITY_SIGNAL_IDS` or `SACRED_IDS`.**
- `lib/drive.ts` exists with: tagging table, distribution-computation function, case classifier, prose-generation function. Thresholds encoded as named constants.
- `PathOutput` type extended with optional `drive: DriveOutput` field.
- Path output construction populates `drive` when distribution is computable.
- New tension `T-D1` ("Claimed and Revealed Drive") fires on `inverted-small` / `inverted-big` cases.
- `PieChart` component renders three slices with optional rank badges; mobile-clamped.
- `PathExpanded.tsx` mounts the Distribution subsection above Work; renders gracefully when `drive` is undefined.
- Markdown export includes Distribution section.
- Canon docs updated. **`docs/canon/drive-framework.md` opens with the what/why architectural distinction:** "Most of the model's measurements expose what — what you protect, what you do, what you fear, what you trust. Drive exposes why."
- `git diff --stat` shows only the named files modified plus the new files (`lib/drive.ts`, `app/components/PieChart.tsx`, `docs/canon/drive-framework.md`).
- `npx tsc --noEmit` exits 0. `npm run lint` passes. `npm run build` succeeds.
- A fresh real-user session produces a populated pie chart on Path with rank badges; the prose paragraph matches the case classification; when the case is `inverted-small` or `inverted-big`, the tension also appears in the Open Tensions list as "Claimed and Revealed Drive."

---

## Out of scope

If you find yourself doing any of these, stop and flag — they belong elsewhere:

- **Cross-card drive-pattern surfaces** (Lens × Drive, Conviction × Drive, Sacred × Drive, Weather × Drive from `prompts/queued/path-3cs-allocation-notes.md`). Deferred to CC-026b after v1 smoke confirms the read is meaningful.
- **LLM substitution** for the prose templates. Engine-deterministic per the standing rule.
- **New questions beyond Q-3C1.**
- **Changes to existing questions, signals, or patterns.**
- **Extending the pie chart to cards other than Path.** Path owns the measurement. Body-map cards may *reference* the drive read in their prose (CC-026b) but don't render their own chart.
- **Adding drive signals to `SACRED_PRIORITY_SIGNAL_IDS` or `SACRED_IDS`.** Drive is its own axis; conflating with sacred-value math would corrupt compass-ranking computations.
- **Renaming or removing any existing question, signal, tension, or measurement.**
- **Changes to the Compass card's value-pool or allocation surfaces.**
- **Editing CC-025's Mirror Synthesis prose.** CC-026 documents the Synthesis hook in canon for CC-025 to consume; CC-026 does not write Synthesis prose itself.
- **Component changes outside `PieChart.tsx` (new) and `PathExpanded.tsx` (extend).** No edits to MapSection, ShapeCard, QuestionShell, MirrorSection, or app/page.tsx.
- **Threshold tuning beyond defaults.** Encode the case-classifier thresholds as named constants; ship with documented defaults.

---

## Notes for the executing engineer

- **The architectural framing is the load-bearing piece.** Most of the model's measurements expose *what*. Drive exposes *why*. This isn't just a new chart — it's the model's first explicit why-axis. Open `docs/canon/drive-framework.md` with this distinction; it sets the conceptual standing for the framework.
- **Q-3C1's `card_id: "role"`** activates a previously-reserved CardId that already maps to Path · Gait via `SURVEY_CARD_TO_SHAPE_CARD`. No mapping change needed.
- **Q_I1_INDEX is dynamically computed** via `findIndex(q => q.question_id === "Q-I1")`. Inserting Q-3C1 before Q-I1 auto-shifts the index — no `app/page.tsx` edit required (same pattern as CC-024's Q-Stakes1 insert).
- **Drive signals are independent of sacred-value signals.** Don't add `cost_drive` / `coverage_drive` / `compliance_drive` to `SACRED_PRIORITY_SIGNAL_IDS` or `SACRED_IDS`. They're a different axis. (CC-028 had the duplicate-arrays spec slip for sacred signals; CC-026 explicitly does NOT generalize that pattern here.)
- **The tagging table is the editorial heart of the framework.** Some signals are honestly multi-tagged. Document the rationale for each multi-tag in `docs/canon/drive-framework.md`; future authors will want to know why split-weighting was applied where.
- **Vocabulary discipline:** *"Drive"* and the three drive-bucket names live in canon docs and engineer-facing surfaces. *"Claimed"* and *"revealed"* are the architectural terms for the two readings (claimed = Q-3C1 ranking; revealed = computed distribution). User-facing prose uses human-language phrases (*"financial security"* / *"the people you love"* / *"risk and uncertainty"*) and never the framework terms or the words *"drive"* / *"claimed"* / *"revealed."*
- **Pie chart visual design** — engineer's choice on details. Goal: editorial chart, not dashboard. Paper background, ink slice strokes, umber accent on the largest slice. Rank badges visible but quiet.
- **Prose templates are locked.** Six canonical templates per case. Don't substitute. If a template reads off-tone in browser smoke, surface for follow-up tune-up.
- **Markdown export parity required.** CC-022c established the architecture; this CC's Distribution section flows through.
- **Saved-session compatibility.** Pre-CC-026 sessions don't have Q-3C1 answers. Engine computes revealed distribution from existing 15 inputs regardless; rank badges and tension only render when Q-3C1 is answered. Old sessions show populated pie chart without rank overlays. No migration needed.
- **Browser smoke required.** Engine checks confirm wiring. The visual read (does the pie chart land on Path? does the case classification feel accurate? does the inversion case actually surface as "huh, that's a real read on me"?) needs Jason's eyes across multiple sessions, especially at least one where claimed and revealed drive visibly diverge.
