# CC-015b — Mirror Generator + Map Restructure + Path Expansion

## Goal

Rebuild the result page into the **two-layer architecture** Clarence's review surfaced: a short, beautiful, useful **Mirror** at top (default visible) plus a deeper **Map** below (eight cards rendered as inline accordions, default collapsed). After CC-015b, a first-time user opens their Inner Constitution and reads ~700 words that say *"Here is the pattern you keep living inside; here is where it helps; here is where it hurts; here is the next honest move."* Engaged users click to expand any card and read the full per-card analysis underneath.

Five things land together:

1. **`MirrorOutput` type and `generateMirror()` engine function** — produces the seven Mirror sections (shape-in-one-sentence, core pattern, top 3 gifts, top 3 traps, what others may experience, when you're under load, your next 3 moves) drawing on the structured signal data CC-011 already produces.
2. **Per-shape Next 3 Moves vocabulary** — the genuinely new authoring (~48 move templates indexed by MBTI archetype, with overrides). The user's specific shape produces three concrete actionable moves.
3. **Path card expansion** — Path's `directionalParagraph` gets supplemented with Work / Love / Give substantial subsections (Clarence's enriched content) plus a Growth Move that names the missing-counterweight cognitive process. The Path card becomes the most substantial card in the Map when expanded.
4. **Pressure consolidation** — per-card `riskUnderPressure` cells hide from the default rendered Map; a single *When the Load Gets Heavy* section in the Mirror surfaces pressure across cards. Engine still produces per-card RUP data; renderer just doesn't surface it as a per-card cell.
5. **Cell-label rename in renderer** — the per-card cells display as **Strength / Trap / Next move** (and *Posture* for Conviction; the Path card uses its expanded structure) instead of *Gift / Blind Spot / Growth Edge*. Engine field names (`gift`, `blindSpot`, `growthEdge`) stay; only the user-facing labels change.

Plus the small bug fix from CC-015a's report: the doubled-determiner glitch in the Conviction Posture template (*"the your top values you protect"*).

The result-writing canon from CC-015a binds every prose template authored here. Function codes never appear in body prose. The protected lines from `result-writing-canon.md` may not be edited or paraphrased.

---

## Launch Directive (CC tool)

**Run this CC with permission-bypass at the CC tool level.**

```
claude --dangerously-skip-permissions
```

Or, mid-session, type `/permissions` and pick **bypass permissions** mode.

This CC is the largest renderer-side CC since CC-D. It touches `lib/types.ts` substantially (multiple new types), `lib/identityEngine.ts` substantially (Mirror generator, per-shape vocabulary, Path expansion, pressure consolidation, the determiner fix), `app/components/InnerConstitutionPage.tsx` substantially (rebuild for two-layer architecture), `app/components/ShapeCard.tsx` (cell-label rename, accordion variant, Path expansion variant), plus three new components. Per-edit approval prompts will defeat single-pass execution.

## Bash Commands Authorized

This CC will run the following bash commands without further user approval:

- `npx tsc --noEmit` — type check.
- `npm run lint` — lint check.
- `npm run dev` (if browser smoke test is performed by the agent rather than the user; otherwise the user runs this themselves).
- File-system commands: `ls`, `cat`, `grep`, `find`, `git status`, `git diff`, `awk`, `sed`, `head`, `tail`, `wc`.

The agent should not pause to ask permission for these.

---

## Execution Directive

Complete every requirement in a single pass and deliver the full report-back at the end. Do **not** pause mid-execution to ask the user for confirmation, approval, scope clarification, or any additional input.

If something is genuinely ambiguous, apply the most spec-faithful interpretation and flag the decision in Risks / next-step recommendations. Do not halt.

If a prerequisite appears missing, attempt the canon-faithful equivalent, record the discrepancy, and continue.

---

## Read First (Required)

**Canon (read; do NOT edit any canon file):**

- `docs/canon/result-writing-canon.md` — **the canonical reference for every prose template authored here.** Seven rules, voice descriptor table, protected lines list, repetition rules, variation rules. Binding.
- `docs/canon/inner-constitution.md` — § Top-Level Structure (currently 11 sections). The Mirror at top is a new section above the existing structure; the Map below is the existing 8 cards rendered as accordions. The other synthesis sections (Growth Path, Relationship Translation, Conflict Translation, Mirror-Types Seed, Confirmed/Open Tensions) stay where they are in the canonical order.
- `docs/canon/shape-framework.md` — § Card-by-Card. Body parts (Eyes / Heart / Voice / Spine / Ears / Nervous-system / Immune-response / Gait) stay canon; CC-015b does not modify them.
- `docs/canon/output-engine-rules.md` — the six derivation rules. Already implemented; not modified here.
- `docs/canon/temperament-framework.md` — § 4 Canonical Stack Table (used for MBTI-archetype-indexed Next 3 Moves vocabulary).

**Reference (read; do NOT edit):**

- `docs/design-prototype/components.jsx` — Claude Design Lab prototype. `QuestionPage` and `ConstitutionPage` give visual reference. Not a translation source — production stack stays Next.js + Tailwind. The design lab's cell labels are *"Strength / Trap / Next move"* (matching what CC-015b adopts).
- `docs/design-prototype/styles.css` — token reference. CC-D's tokens (warm paper, ink, umber) are already in `app/globals.css`; this CC inherits.
- `docs/design-spec-v2.md` § 10 — Inner Constitution layout suggestion. The Mirror+Map structure honors this section's editorial register.

**Existing code (read; will be edited):**

- `lib/types.ts` — extends `InnerConstitution` with `mirror: MirrorOutput`, `pressure_section: string`. Adds `MirrorOutput`, `WorkLoveGiveExpansion`, `NextMove` types. Extends `PathOutput` with `work / love / give / growthCounterweight` fields.
- `lib/identityEngine.ts` — adds `generateMirror`, `generateNextMoves`, `generatePathExpansion`, `generatePressureSection`. Extends `derivePathOutput` to emit the expanded fields. Updates `buildInnerConstitution` to call new generators. Fixes the determiner bug in Conviction Posture template.
- `app/components/InnerConstitutionPage.tsx` — rebuilt for two-layer architecture: Mirror at top, Map as accordion below.
- `app/components/ShapeCard.tsx` — cell-label rename in renderer; accordion (collapsible) behavior; Path variant renders expanded Work/Love/Give content.

**Existing code (do NOT edit):**

- `app/components/Ranking.tsx`, `app/components/QuestionShell.tsx`, `app/components/ProgressIndicator.tsx`, `app/components/TensionCard.tsx`, `app/components/MbtiDisclosure.tsx`, `app/components/SinglePickPicker.tsx`, `app/components/SecondPassPage.tsx`.
- `app/globals.css`, `app/layout.tsx`.
- `data/questions.ts`.
- Any tension detection block.
- Any signal definition (`SIGNAL_DESCRIPTIONS`, `SACRED_PRIORITY_SIGNAL_IDS`, `STRENGTHENERS`, `STACK_TABLE`, `MBTI_LOOKUP`).
- Any aggregation helper (`aggregateLensStack`, `getTopCompassValues`, etc.).
- The `FUNCTION_VOICE`, `FUNCTION_VOICE_SHORT`, `UNDER_PRESSURE_BEHAVIOR`, `TOP_RISK_CARD_FALLBACK`, `BLIND_SPOT_TEXT_VARIANTS`, `valueListPhrase` constants/helpers from CC-015a — read and use, do not modify.

---

## Context

After CC-015a, the engine speaks in voices instead of function codes. After CC-014, users can skip and return with examples. After CC-012, the result page renders the eight cards in body-part voice with tension provenance disclosure. The remaining gap is **structural**: the result page is still *one long document of equal-weight sections* rather than the *two-layer Mirror+Map* Clarence's review identified as the right product shape.

Clarence's framing:

> *"A normal user does not want eight miniature psychological essays. They want: 'I feel seen. I understand the risk. I know what to do with it.' Right now, the result often says the same thing three ways before it moves on."*

The Mirror serves the normal user. The Map serves the engaged user who wants to inspect the machinery. Both ship in CC-015b. The Mirror is short, beautiful, useful (~700 words). The Map is the rich diagnostic detail (per-card SWOT cells with renamed labels, Path expanded with Work/Love/Give, all collapsible).

Path becomes the most substantial card in the Map. Currently Path produces only a `directionalParagraph`. CC-015b extends it with three subsections — Work / Love / Give — that translate the user's shape into concrete behavioral patterns at the Tuesday-afternoon level Clarence prototyped, plus a Growth Move that names the missing-counterweight process (Path-as-process-integration).

The Mirror's *When the Load Gets Heavy* section consolidates pressure language into one place, rather than each card carrying its own pressure paragraph. The per-card `riskUnderPressure` data still gets produced by the engine (for analytical completeness) but the renderer hides it from the default Map view. This eliminates the *"every section has a pressure warning"* register Clarence flagged.

---

## Decisions Locked in This Prompt

These are decisions made at prompt-authorship time so the executing agent does not have to make them.

### D-1: Mirror seven sections, ~700-word total budget

The Mirror renders seven sections in this canonical order:

| # | Section | Word budget | Source |
|---|---|---|---|
| 1 | Your Shape in One Sentence | ~30–50 words | derived from `lens_stack` + top Compass + top Gravity |
| 2 | Your Core Pattern | ~80–120 words | derived from `shape_summary` (CC-011), retuned for Mirror voice |
| 3 | Your Top 3 Gifts | ~120–180 words (3 entries × ~40–60 words each) | from `cross_card.topGifts` (existing CC-011 data) |
| 4 | Your Top 3 Traps | ~120–180 words (3 entries × ~40–60 words each) | from `cross_card.topRisks` with editorial labels per CC-015a |
| 5 | What Others May Experience | ~80–120 words | from `cross_card.relationshipTranslation` (existing CC-011 data) |
| 6 | When the Load Gets Heavy | ~120–160 words | NEW — synthesized pressure section (see § D-5) |
| 7 | Your Next 3 Moves | ~80–120 words (3 entries × ~25–40 words each) | NEW — per-shape vocabulary (see § D-7) |

Total target: ~650–850 words. Hard cap: 1000 words.

Mirror prose voice: conversational-philosophical-example-driven per Clarence's framing. Plain language, no function codes (per CC-015a's voice substitution). Hedging vocabulary preserved (*"appears to," "may suggest," "tends to"*).

### D-2: MirrorOutput type

Add to `lib/types.ts`:

```ts
export type MirrorTopGift = {
  label: string;       // editorial label, e.g., "A pattern-discernment gift"
  paragraph: string;   // ~40-60 words
};

export type MirrorTopTrap = {
  label: string;       // editorial label, e.g., "Pattern certainty becoming private fact"
  paragraph: string;   // ~40-60 words
};

export type NextMove = {
  label: string;       // short imperative, e.g., "Show the weighing process"
  paragraph: string;   // ~25-40 words explaining
};

export type MirrorOutput = {
  shapeInOneSentence: string;
  corePattern: string;
  topGifts: MirrorTopGift[];        // exactly 3
  topTraps: MirrorTopTrap[];        // exactly 3
  whatOthersMayExperience: string;
  whenTheLoadGetsHeavy: string;
  yourNext3Moves: NextMove[];       // exactly 3
};
```

Extend `InnerConstitution`:

```ts
export type InnerConstitution = {
  // existing fields preserved verbatim
  ...
  mirror: MirrorOutput;            // NEW
};
```

### D-3: Map = inline accordion

Each of the eight Shape cards renders as a collapsible accordion. Default state: **collapsed.** Header shows kicker (e.g., `Lens · Eyes`) + a summary line drawn from the card's existing `cardHeader` field. Click expands the card inline, showing all cells. Click again collapses.

Visual treatment per existing CC-D / CC-012 styles:

- Card header (collapsed): mono kicker (`var(--ink-mute)`, JetBrains Mono caps 11px) + serif italic header line (`var(--ink-soft)`, 15px). Right-edge chevron icon (`▾` / `▸`) in `var(--ink-mute)`.
- Card body (expanded): existing per-cell layout. Mono cell labels, serif body. Hairline rule between cells.
- Click handler: toggles `expanded[cardName]` state.
- Accordion state lives in `InnerConstitutionPage.tsx` (or a new `MapSection.tsx` component) as `Record<string, boolean>` keyed by card name.

A small *"Show all cards"* / *"Collapse all"* affordance at the top of the Map section would be nice but is OPTIONAL for V1.

### D-4: Cell-label rename in renderer (engine field names preserved)

The renderer displays cell labels using these user-facing names:

| Engine field | User-facing label |
|---|---|
| `gift` | **Strength** |
| `blindSpot` | **Trap** |
| `growthEdge` | **Next move** |
| `riskUnderPressure` | (not displayed per-card; consolidated in Mirror's "When the Load Gets Heavy") |

For Conviction (lean variant):

| Engine field | User-facing label |
|---|---|
| `gift` | **Strength** |
| `blindSpot` | **Trap** |
| `posture` | **Posture** |

For Path (expanded variant — see § D-6):

| Engine field | User-facing label |
|---|---|
| `directionalParagraph` | (used as the card's lead paragraph; no separate "Direction" cell) |
| `work` | **Work** |
| `love` | **Love** |
| `give` | **Give** |
| `growthCounterweight` | **Growth move** |

Engine type field names (`gift`, `blindSpot`, `growthEdge`, `riskUnderPressure`, `posture`, `directionalParagraph`, `work`, `love`, `give`, `growthCounterweight`) stay as-is. Renderer translates to user-facing labels.

### D-5: Pressure consolidation — *When the Load Gets Heavy* section

Per-card `riskUnderPressure: SwotCell` data is still produced by the engine (CC-011 derivation logic stays). The renderer **hides** the per-card RUP cells from the default Map view. A new section in the Mirror, titled *When the Load Gets Heavy*, synthesizes pressure across cards into a single ~120-160 word paragraph (or 2-3 short paragraphs).

`generatePressureSection(constitution)` composes prose from:

- The user's dominant Lens function's `UNDER_PRESSURE_BEHAVIOR` (CC-015a constant).
- The user's inferior Lens function's `UNDER_PRESSURE_BEHAVIOR`.
- The Fire pattern signature (`willingToBearCost`, `adapts`, `concealsUnderThreat`, `holdsInternalConviction` — existing data).
- The user's top Compass values (under-load behavior of values: defended absolutes, etc.).
- The Weather load level.

Sample target output (illustrative):

> *"When the load gets heavy, your shape may tighten in two directions at once. The pattern-reader narrows the lens until certainty starts to feel like fact, and the present-tense self surfaces in cruder form — the move you'd usually slow down on becomes the move you make first. The values you protect (Knowledge, Truth, Faith, Freedom) may begin to express as defended absolutes rather than chosen priorities. None of this is who you are; each is who you may become if the load is not eased."*

The closing sentence — *"None of this is who you are; each is who you may become if the load is not eased"* — is a protected line per `result-writing-canon.md`. Use verbatim.

The section reads honestly without listing each card's pressure paragraph. The user gets one synthesized read of *what to watch for under load,* not eight separate warnings.

### D-6: Path card expansion — Work / Love / Give + Growth move

`PathOutput` extends with four new string fields:

```ts
export type PathOutput = {
  cardName: "Path";
  bodyPart: "Gait";
  directionalParagraph: string;      // existing — used as lead paragraph
  work: string;                       // NEW — Work translation, ~150-250 words
  love: string;                       // NEW — Love translation, ~150-250 words
  give: string;                       // NEW — Give translation, ~150-250 words
  growthCounterweight: string;        // NEW — process-integration insight, ~80-120 words
};
```

`generatePathExpansion()` produces these four fields drawing on:

- The user's `lens_stack` (for the dominant function's natural Work / Love / Give expressions, plus the missing-counterweight process for Growth move).
- Top Compass values (for what work/love/give *protects*).
- Top Gravity attribution (for how giving is structured).
- Path / Agency signals (existing CC-011 data).

**Authoring guide for Work / Love / Give content** (per Clarence's framing in his enrichment writeup):

Each subsection is conversational prose (3-5 short paragraphs OR 2-3 paragraphs + concrete bullet examples). Each subsection includes:

- A lead sentence anchoring the subsection in the user's specific shape (e.g., *"Work, for this shape, is not just labor. It is translation."*).
- 2-3 paragraphs of behavioral specificity (what the work/love/give actually looks like for this shape on a Tuesday afternoon).
- Optionally 4-6 concrete bullet examples (*"Seeing the flaw in a business model before it becomes obvious"* / *"Helping a team stop arguing about symptoms"* / etc.).
- A "good-fit" / "bad-fit" framing where appropriate (specific to Work).
- A closing growth move or principle.

The Work / Love / Give templates need to be authored per shape archetype. Use MBTI-archetype indexing as the primary key, with Compass-top overrides where the value pattern significantly changes the read.

For minimum V1 viability, author 16 archetype-specific Work / Love / Give templates (one per MBTI type). Each template is parameterized by `topCompass` and `topGravity` so the user's specific values appear in the prose. For an Ni-Te (INTJ) user with Knowledge / Truth / Faith / Freedom top: the Work template would say something like Clarence's prototype prose (the *"You are likely to feel most engaged when work lets you convert hidden structure into visible progress"* paragraph).

**Authoring scope: 16 archetypes × 3 subsections (Work / Love / Give) = 48 substantial prose templates** (each ~150-250 words). Plus parameterization variables. This is the most substantial authoring work in CC-015b.

If 48 templates is too aggressive for one CC, the agent may produce **8 templates indexed by dominant function** (Ni / Ne / Si / Se / Ti / Te / Fi / Fe) plus generic-prose-with-shape-substitution as a fallback. The full 16-archetype expansion can land in a follow-up CC. Document the choice in report-back.

The **Growth move** field (`growthCounterweight`) is shorter (~80-120 words) and references the missing-counterweight process per Path-as-integration framing. For an Ni-Te user, the missing counterweight is Se (the present-tense self) and Fe (the room-reader). The growth move template names which process needs to be borrowed for the next stretch — without typology jargon. Sample target:

> *"Your shape's growth move tends to involve borrowing from the present-tense self — the voice you trust least — for short, deliberate moments. Not abstractly: in the form of letting the room interrupt your read of the room, or letting fatigue speak before strategy does. The stretch isn't to become someone different; it's to let the function you reach for last get a small turn at the front."*

### D-7: Per-shape Next 3 Moves vocabulary

`generateNextMoves()` produces three concrete actionable moves rooted in the user's specific shape. Each move:

- Short imperative label (~5-8 words).
- Explanatory paragraph (~25-40 words).
- Specific to the user's stack / Compass / Gravity / Weather pattern, not generic.

**Authoring scope: 16 MBTI archetypes × 3 moves = 48 move templates** (or 8 dominant-function archetypes × 3 moves = 24 if scope is too aggressive). Each template is parameterized by user data.

Sample target (Ni-Te / INTJ user):

```
1. **Show the weighing process.**
   Don't just deliver the verdict — let people see the steps. The reasoning, the cost considered, the alternatives ruled out. Trust grows in the visible distance between insight and conclusion.

2. **Let the present interrupt the theory.**
   Briefly and deliberately. The pattern you see clearly is not always the pattern in the room right now. Make small space for what's actually here.

3. **Reserve protected time for creation.**
   Maintenance can swallow your week. The shape that builds atrophies in pure reaction. One page, one model, one structural fix per week — even when no one's asking.
```

The agent authors per-archetype move templates. Templates may share components (e.g., *"Let the present interrupt the theory"* is a core Ni-shape move that could appear for Ni-dominant shapes — INTJ, INFJ — with light wording adjustment).

If full 16-archetype authoring is too aggressive, fall back to 8 dominant-function templates with auxiliary-function-conditioned variants (e.g., Ni-led shapes get a base set of 3 moves; the auxiliary determines which variant of move #2 fires). Document the choice.

### D-8: Conviction Posture template determiner fix

CC-015a's report flagged: when `valueListPhrase(topCompass, 1)` returns *"your top values"* and the surrounding template hardcodes *"the ${list} you protect"*, output reads *"the your top values you protect"*. Fix the template to handle both verbatim-list and pre-articled-phrase variants. Two clean approaches:

- Drop the literal `the ` from the template and let `valueListPhrase` provide articles when needed. Helper updated to return article-self-contained phrases (variant 0: *"the X, Y, Z, and W you protect"*; variant 1: *"the values you protect"*; variant 2: *"what you protect"*; etc.).
- Or: rewrite the surrounding template to use a parameterized form that accepts already-articled phrases without doubling.

Either approach works. Pick whichever produces minimal diff and confirm the doubled-determiner bug is gone in the smoke test.

### D-9: Layout — top-level structure of the result page after CC-015b

```
┌─────────────────────────────────────────────────────────┐
│ THE INNER CONSTITUTION                                  │  ← page header (existing)
│ a possibility, not a verdict                            │  ← subtitle (existing)
├─────────────────────────────────────────────────────────┤
│ MIRROR  (default visible, ~700 words, drop cap)         │  ← NEW
│   1. Your Shape in One Sentence                         │
│   2. Your Core Pattern                                  │
│   3. Your Top 3 Gifts                                   │
│   4. Your Top 3 Traps                                   │
│   5. What Others May Experience                         │
│   6. When the Load Gets Heavy                           │
│   7. Your Next 3 Moves                                  │
├─────────────────────────────────────────────────────────┤
│ MAP — go deeper                                         │  ← NEW section header
│   ▸ Lens · Eyes        (collapsed)                      │  ← NEW accordion
│   ▸ Compass · Heart    (collapsed)                      │
│   ▸ Conviction · Voice (collapsed)                      │
│   ▸ Gravity · Spine    (collapsed)                      │
│   ▸ Trust · Ears       (collapsed)                      │
│   ▸ Weather · Nervous  (collapsed)                      │
│   ▸ Fire · Immune      (collapsed)                      │
│   ▸ Path · Gait        (collapsed; expands rich)        │
├─────────────────────────────────────────────────────────┤
│ Synthesis (existing CC-012 sections)                    │
│   Top Gifts (now redundant with Mirror — see § D-10)    │
│   Top Risks (now redundant with Mirror — see § D-10)    │
│   Watch For                                             │
│   Growth Path                                           │
│   Relationship Translation (now in Mirror — § D-10)     │
│   Conflict Translation                                  │
│   Mirror-Types Seed                                     │
├─────────────────────────────────────────────────────────┤
│ Confirmed Tensions  (existing)                          │
│ Open Tensions       (existing)                          │
└─────────────────────────────────────────────────────────┘
│ Footer: this is a draft. nothing is saved.              │
└─────────────────────────────────────────────────────────┘
```

### D-10: Synthesis sections that now overlap with Mirror

The Mirror surfaces content that the existing CC-012 result page already had as separate sections: Top Gifts, Top Risks, Relationship Translation, Watch For (which Clarence's pressure-translation maps to). The Mirror is the new primary surface for these.

Decision: **the Mirror replaces the standalone Top Gifts and Top Risks sections.** Watch For and Relationship Translation move into the Mirror's *Top Traps* (Watch For triggers can be folded into the trap paragraphs as concrete behavioral examples) and *What Others May Experience* (Relationship Translation content) respectively.

Standalone sections that **stay** below the Map (their full versions provide depth beyond the Mirror): Growth Path, Conflict Translation, Mirror-Types Seed. These are reflective/philosophical pieces that don't fit the Mirror's tighter register but are valuable for the engaged user.

Watch For as its own section: **deprecated.** Its triggers either fold into the Mirror's *Top Traps* (each trap can include a behavioral trigger sentence) OR get added to the Mirror's *When the Load Gets Heavy* (as concrete behavioral red flags). Engine still produces `watch_for: string[]` (CC-011b data); renderer just doesn't surface it as its own section.

### D-11: Renderer architecture

New components:

- `app/components/MirrorSection.tsx` — renders the seven Mirror sections with the spec'd typography, drop cap on the Shape Summary first letter, hairline rules between sections.
- `app/components/MapSection.tsx` — wraps the eight cards as accordion list with optional *Show all cards* / *Collapse all* affordance.
- `app/components/PathExpanded.tsx` — Path card's expanded body with Work / Love / Give / Growth move subsections.

Modified components:

- `app/components/InnerConstitutionPage.tsx` — rebuilt to mount MirrorSection + MapSection + the remaining synthesis sections (Growth Path, Conflict Translation, Mirror-Types Seed) + Tensions. Drop cap moves to MirrorSection's Shape Summary opening.
- `app/components/ShapeCard.tsx` — adds `mode: "default" | "accordion"` prop. In accordion mode: header shows kicker + summary, body collapses. Cell labels rename per § D-4. Path variant uses PathExpanded for body.

### D-12: Tone register and protected lines

Every prose template authored in CC-015b must respect:

- The result-writing canon's seven rules (per CC-015a's `docs/canon/result-writing-canon.md`).
- The protected lines list — verbatim use only; no paraphrase.
- Five Dangers (no type-label headlines, no stress-as-revelation, no moralizing, no clinical implication, no flat-trait combination).

The Mirror's editorial register is **conversational-philosophical-example-driven** per Clarence's framing. Plain language. Concrete. Hedging vocabulary preserved. No function codes in body prose.

### D-13: Body-part metaphors stay as canon

Per the user's open thinking on body-part adjectives (ongoing), CC-015b uses the canonical body-part labels from `shape-framework.md` verbatim: Eyes / Heart / Voice / Spine / Ears / Nervous-system / Immune-response / Gait. If those labels change in a future canon-revision CC, CC-015b's prose templates can be re-keyed; body-part labels appear in card kickers only and substitute trivially.

---

## Requirements

### 1. Add Mirror types per § D-2

`MirrorOutput`, `MirrorTopGift`, `MirrorTopTrap`, `NextMove`. Extend `InnerConstitution` with `mirror: MirrorOutput`. Extend `PathOutput` with `work / love / give / growthCounterweight` per § D-6.

### 2. Implement `generateMirror()` per §§ D-1, D-2, D-5, D-7

New top-level function in `lib/identityEngine.ts`. Produces all seven Mirror sections per the word budgets in § D-1.

### 3. Implement `generatePressureSection()` per § D-5

Synthesizes the *When the Load Gets Heavy* paragraph from `lens_stack`, `firePattern`, `topCompass`, `weatherLoad`. Uses CC-015a's `UNDER_PRESSURE_BEHAVIOR` constant. Closes with the protected line *"None of these is who you are; each is who you may become if the load is not eased"* (verbatim).

### 4. Implement `generateNextMoves()` per § D-7

New function. Authors per-shape Next 3 Moves vocabulary. 16-archetype × 3-moves table preferred; 8-dominant-function fallback acceptable. Document the choice.

### 5. Implement `generatePathExpansion()` per § D-6

Extends `derivePathOutput` (or wraps it) to populate `work / love / give / growthCounterweight` fields. 16-archetype × 3-subsections × Growth-move authoring; or 8-dominant-function fallback. Document the choice.

### 6. Update `buildInnerConstitution()` to call new generators and populate `mirror`

The `InnerConstitution` returned by `buildInnerConstitution` now includes a populated `mirror` field. Existing fields preserved verbatim.

### 7. Fix doubled-determiner bug per § D-8

In the Conviction Posture template (or `valueListPhrase` helper), eliminate the *"the your top values you protect"* construction. Smoke test confirms.

### 8. Build `MirrorSection.tsx`, `MapSection.tsx`, `PathExpanded.tsx` per § D-11

New components rendering the spec'd structure.

### 9. Refactor `InnerConstitutionPage.tsx` per § D-9 and § D-10

Result page becomes: page header → MirrorSection → MapSection → remaining synthesis (Growth Path, Conflict Translation, Mirror-Types Seed) → Confirmed Tensions → Open Tensions → footer.

The standalone Top Gifts, Top Risks, Watch For, Relationship Translation sections are removed as standalone — their content lives in the Mirror.

### 10. Update `ShapeCard.tsx` per § D-3 and § D-4

- Adds `mode: "default" | "accordion"` prop.
- In accordion mode: collapsible behavior, header shows kicker + summary, body expands on click.
- Cell labels: Strength / Trap / Next move (renamed in renderer; engine field names stay).
- Per-card `riskUnderPressure` cells are NOT rendered in accordion mode (consolidated to Mirror's *When the Load Gets Heavy*).
- Path variant uses PathExpanded for body content when expanded.

### 11. Type-check, lint, and verify

- `npx tsc --noEmit` — passes cleanly.
- `npm run lint` — passes cleanly.
- Manual smoke test in a browser at `localhost:3003`:
  - Result page opens with Mirror visible at top, ~700 words.
  - Drop cap on Shape Summary opening letter, umber color.
  - Top 3 Gifts and Top 3 Traps render with editorial labels.
  - *When the Load Gets Heavy* section reads as one synthesized paragraph, not eight per-card warnings.
  - *Your Next 3 Moves* renders with three short imperatives + explanatory paragraphs.
  - Map header below with eight cards as accordions; all collapsed by default.
  - Click a card to expand; expanded body shows Strength / Trap / Next move labels (not Gift / Blind Spot / Growth Edge).
  - Path card expands to show Work / Love / Give / Growth move subsections with rich content.
  - No standalone Top Gifts, Top Risks, Watch For, Relationship Translation sections.
  - Growth Path, Conflict Translation, Mirror-Types Seed remain as standalone sections below the Map.
  - Confirmed/Open Tensions render as before.
  - No *"the your top values"* doubled-determiner bug.
  - No function codes in body prose anywhere.
  - Mobile viewport (~390px) renders cleanly with accordion behavior preserved.

---

## Allowed to Modify

**Code:**

- `lib/types.ts` — add Mirror types per § D-2; extend `InnerConstitution` and `PathOutput`. Preserve all existing types verbatim.
- `lib/identityEngine.ts` — add `generateMirror`, `generatePressureSection`, `generateNextMoves`, `generatePathExpansion`. Update `derivePathOutput` to populate new fields. Update `buildInnerConstitution` to call new generators. Fix Conviction Posture template bug per § D-8. Preserve all other functions, constants, helpers verbatim.
- `app/components/InnerConstitutionPage.tsx` — rebuild for two-layer architecture per § D-9.
- `app/components/ShapeCard.tsx` — add accordion mode, cell-label rename, Path variant uses PathExpanded.
- `app/components/MirrorSection.tsx` — NEW.
- `app/components/MapSection.tsx` — NEW.
- `app/components/PathExpanded.tsx` — NEW.

Do **NOT** modify:

- Any `docs/canon/*.md` file. CC-015b is a code-only CC.
- `app/components/Ranking.tsx`, `app/components/QuestionShell.tsx`, `app/components/ProgressIndicator.tsx`, `app/components/TensionCard.tsx`, `app/components/MbtiDisclosure.tsx`, `app/components/SinglePickPicker.tsx`, `app/components/SecondPassPage.tsx`.
- `app/globals.css`, `app/layout.tsx`.
- `data/questions.ts`.
- Any tension detection block.
- Any signal definition.
- Any aggregation helper (`aggregateLensStack`, `getTopCompassValues`, etc.).
- The CC-015a constants/helpers (`FUNCTION_VOICE`, `FUNCTION_VOICE_SHORT`, `UNDER_PRESSURE_BEHAVIOR`, `TOP_RISK_CARD_FALLBACK`, `BLIND_SPOT_TEXT_VARIANTS`, `valueListPhrase`).
- `prompts/`, `AGENTS.md`, `CLAUDE.md`, `README.md`, `package.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `.claude/settings.local.json`, `postcss.config.mjs`.

---

## Out of Scope

- **Per-card process inflection architecture** (Clarence's deeper integration: Heart-as-Fi-vs-Fe, Listen-as-Si-vs-Te-vs-Ti-vs-Fe). CC-016 / v2.
- **Body-part metaphor revisions.** User is still iterating; whatever the labels become, CC-015b's structural work continues to function.
- **Persistence / autosave / sharing / export.** v1.5+ Postgres territory.
- **Always-on rank-or-pick channel** (V1.5 for CC-014).
- **New canon files or canon edits.** Result-writing canon was created by CC-015a; CC-015b respects it.
- **New questions, signals, tensions.**
- **Engine derivation rule changes.**
- **MBTI disclosure body changes.**
- **Tension provenance disclosure changes.** TensionCard untouched.
- **Print stylesheet.**
- **Dark mode.**
- **Accessibility audit beyond functional verification.**

---

## Acceptance Criteria

1. `lib/types.ts` declares `MirrorOutput`, `MirrorTopGift`, `MirrorTopTrap`, `NextMove`. `InnerConstitution` extended with `mirror: MirrorOutput`. `PathOutput` extended with `work / love / give / growthCounterweight`. Existing types preserved verbatim.
2. `lib/identityEngine.ts` has `generateMirror`, `generatePressureSection`, `generateNextMoves`, `generatePathExpansion`. `derivePathOutput` populates new fields. `buildInnerConstitution` returns `mirror`-populated InnerConstitution.
3. The doubled-determiner bug is gone — *"the your top values you protect"* (or similar duplicate-article construction) does not appear in any prose output.
4. `app/components/MirrorSection.tsx`, `MapSection.tsx`, `PathExpanded.tsx` exist and render per spec.
5. `app/components/ShapeCard.tsx` supports `mode: "default" | "accordion"`. In accordion mode: cells labeled Strength / Trap / Next move (not Gift / Blind Spot / Growth Edge). Path variant uses PathExpanded for body. Per-card `riskUnderPressure` is hidden.
6. `app/components/InnerConstitutionPage.tsx` renders Mirror at top, Map below as accordion list, remaining synthesis sections below, Tensions at bottom. No standalone Top Gifts / Top Risks / Watch For / Relationship Translation sections.
7. Mirror word count is within 500-1000 words (target ~700).
8. *When the Load Gets Heavy* closes with the protected line *"None of these is who you are; each is who you may become if the load is not eased"* verbatim.
9. *Your Next 3 Moves* renders three concrete actionable moves rooted in the user's specific shape.
10. Path card expanded body has Work / Love / Give / Growth move subsections with substantial prose (each ~150-250 words).
11. No function codes appear in body prose anywhere on the result page.
12. Manual smoke test passes per § 11.
13. `npx tsc --noEmit` passes cleanly.
14. `npm run lint` passes cleanly.
15. No file outside the Allowed to Modify list has been edited.
16. No canon file is modified.
17. CC-015a's constants and helpers (`FUNCTION_VOICE`, `UNDER_PRESSURE_BEHAVIOR`, `TOP_RISK_CARD_FALLBACK`, `BLIND_SPOT_TEXT_VARIANTS`, `valueListPhrase`) are read but not modified.
18. Mobile viewport (~390px) renders cleanly with accordion behavior preserved.

---

## Report Back

Return a single markdown block with the following sections, in order:

1. **Files changed** — bullet per file with one-line description. Note new components.
2. **Type system additions** — quote new types verbatim. Confirm existing types preserved.
3. **Mirror generator** — quote `generateMirror()` body. Show one full sample MirrorOutput for a synthetic INTJ session. Confirm word count target (500-1000).
4. **Pressure section** — quote `generatePressureSection()` body. Show the synthesized output for the synthetic session. Confirm protected-line use.
5. **Next 3 Moves** — quote `generateNextMoves()` body and the per-archetype move table. Document the authoring scope choice (16 archetypes vs. 8 dominant functions). Show the three moves for the synthetic session.
6. **Path expansion** — quote `generatePathExpansion()` body. Show the Work / Love / Give / Growth move output for the synthetic session.
7. **Conviction Posture determiner fix** — show the before/after of the template. Confirm the bug is gone.
8. **MirrorSection component** — show the component code (or relevant excerpt). Confirm typography per spec, drop cap, hairline rules.
9. **MapSection component** — show the accordion render logic. Confirm default-collapsed state and toggle behavior.
10. **PathExpanded component** — show how Work / Love / Give / Growth move render.
11. **ShapeCard updates** — quote the cell-label rename, the accordion mode logic, and the Path variant routing.
12. **InnerConstitutionPage refactor** — quote the new render structure. Confirm Mirror at top, MapSection in middle, remaining synthesis sections below.
13. **Smoke-test results** — confirm all spec'd behavior renders cleanly. If browser smoke testing was deferred, say so.
14. **Type check and lint** — output of `npx tsc --noEmit` and `npm run lint`.
15. **Scope-creep check** — explicit confirmation that:
    - No canon file was modified.
    - No engine logic beyond generator additions and the Path/Posture extensions was changed.
    - No new tensions, signals, or questions were authored.
    - No CC-015a constant or helper was modified (only read).
    - InnerConstitutionPage.tsx no longer renders standalone Top Gifts / Top Risks / Watch For / Relationship Translation sections.
    - The eight ShapeCards default to collapsed; expanded body shows renamed cell labels.
    - Path card expanded body shows Work / Love / Give / Growth move subsections.
    - No function codes in body prose.
    - Mobile viewport tested or testing deferred to user.
16. **Risks / next-step recommendations** — anything that surfaced. Specifically:
    - Whether the 16-archetype × 3-moves authoring landed cleanly, or whether the 8-dominant-function fallback was used.
    - Whether the 16-archetype Path Work/Love/Give authoring landed, or fallback used.
    - Whether the Mirror's word budget held, or any section bloated.
    - Whether the *When the Load Gets Heavy* synthesis felt like a natural single section vs. an aggregation of per-card warnings.
    - Whether the accordion UX feels right at default-collapsed, or whether default-expanded for Path or other "key" cards would be preferable.
    - Whether removing standalone Top Gifts / Top Risks / Watch For / Relationship Translation sections felt like the right call, or whether any deserve their own section despite Mirror coverage.
    - Whether the protected line *"None of these is who you are; each is who you may become if the load is not eased"* landed naturally in the synthesized pressure paragraph, or felt forced.
    - Any other observation worth surfacing.
