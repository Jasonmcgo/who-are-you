# CC-025 — Engine Prose Tuning Round 2 (4-Section ShapeCard Architecture + Mirror & Tensions)

**Type:** Component restructure + engine prose authoring + canon updates. **Two staged phases in one CC; commit separately if helpful.**
**Goal:** Transform the engine's prose architecture so every report reads distinctly per user. Two coupled changes: (1) restructure each ShapeCard from 3 sections to 4 (Strength / Growth Edge / Practice / Pattern Note); (2) soften and sharpen Mirror + Tension prose with patterns surfaced from three real-user LLM rewrites (Madison, Michele, LaCinda).
**Predecessors:** CC-022a–f, CC-023, CC-024, CC-027, CC-028. All shipped.
**Successor:** CC-029 (pattern catalog expansion leveraging Si/Se/Ti/Fi/Fe — only after CC-025 prose architecture is canonical).
**Evidence base:** `prompts/queued/engine-prose-tuning-round-2-notes.md`, plus the LaCinda LLM rewrite (2026-04-27, post-CC-024 + CC-027), plus memory entry `project_engine_prose_round_2_evidence.md`. Read all three before drafting commits.

---

## Why this CC

Three LLM rewrites of real-user sessions (Madison, Michele, LaCinda) consistently produce the same prose architecture upgrades. The patterns are durable and structural, not user-specific. Most importantly, the per-card duplication problem CC-023 hotfixed for the Advocacy gift category is *solved at architecture* — not at variant count — by giving each card a card-register-specific Practice + a distinctive Pattern Note. CC-023's approach (per-gift variants) was right at small scale; CC-025 scales the same idea to architecture so collisions stop happening for *any* gift category.

Confirmation from LaCinda's session: 5 of 8 ShapeCards were rendering the same trap text ("Ignoring patterns and precedent..." on Lens / Conviction / Trust; "Carrying what is not yours..." on Compass / Gravity). The 4-section structure, per LaCinda's LLM rewrite, eliminates that — *"A strong spine does not carry every load. It carries the right load"* (Gravity Pattern Note) cannot be confused with *"Discernment improves when trusted voices have different jobs"* (Trust Pattern Note) because each is keyed to its body-part metaphor, not to a gift category.

---

## Scope

This CC modifies the following surfaces:

**Phase 1 — Component + types + per-card content:**
1. `lib/types.ts` — add `patternNote: SwotCell` field to `FullSwotOutput`. Same field added to `ConvictionOutput`. Optional one-line `pathPatternNote: string` on `PathOutput`.
2. `lib/identityEngine.ts` — per-card Practice + Pattern Note content authored for all 8 ShapeCards. Per-card register-aware Growth Edge variants where the existing Trap text reads as wrong-register (Conviction is the named case).
3. `app/components/ShapeCard.tsx` — render 4 sections (Strength / Growth Edge / Practice / Pattern Note) instead of 3. Section labels renamed: *Trap* → *Growth Edge*; *Next move* → *Practice*. Conviction variant: *Posture* stays where Practice would be (Conviction has no Practice slot — Posture does the equivalent work). Path variant: optional one-line Pattern Note appended to its existing PathExpanded body.
4. `lib/renderMirror.ts` — markdown export updated to render the 4 sections per card.

**Phase 2 — Mirror & Tension prose:**
5. `app/components/MirrorSection.tsx` (or wherever the Mirror header lives) — rename *"Your Top 3 Traps"* → *"Your Top 3 Growth Edges"*. Add a "How to Read This" preamble paragraph above the existing Mirror body.
6. `lib/identityEngine.ts` (continued) — Allocation Gap prose (T-013 / T-014 / T-015) rewritten per the queue notes' Pattern 2: "not hypocrisy" + "cannot know motive" + 6-item interpretation list + 3-state question.
7. `lib/beliefHeuristics.ts` — Keystone Reflection positive-read-first softening (acknowledge "may reflect conviction, faithfulness, and spiritual stability" before the watch-point line).
8. `lib/identityEngine.ts` / Open Tensions rendering — drop T-### IDs from user-facing prose; use descriptive names. Collapse the duplicate T-015 (outward + inward) into one entry with two subsections rather than two list items with the same ID and different prose.
9. `lib/renderMirror.ts` — pronoun register pinned to second-person throughout the Mirror sections. Synthesis section may keep name-threading (it's the natural place for it); other sections stay second-person.

**Canon updates:**
10. `docs/canon/result-writing-canon.md` — document the 4-section card architecture; canonical Practice + Pattern Note text per card; "How to Read This" preamble copy.
11. `docs/canon/shape-framework.md` — 4-section structure noted in the per-card descriptions.
12. `docs/canon/tension-library-v1.md` — T-013 / T-014 / T-015 user_prompt entries updated to match the new prose.
13. `docs/canon/keystone-reflection-rules.md` — Mirror prose softening pattern documented.

Out of scope explicitly: LLM substitution path, new questions, new signals, new cross-card patterns, 3C's integration, Path contribution-verbs question, Inner Constitution artifact tuning.

---

## Phase 1 — 4-Section ShapeCard Architecture

### Step 1.1 — Add `patternNote` field to types

In `lib/types.ts`, extend `FullSwotOutput`:

```ts
export type FullSwotOutput = {
  cardName: string;
  bodyPart: string;
  cardHeader: string;
  gift: SwotCell;
  blindSpot: SwotCell;
  growthEdge: SwotCell;
  patternNote: SwotCell;        // CC-025 — aphoristic closing per card
  riskUnderPressure: SwotCell;  // existing — not rendered in card
};
```

Extend `ConvictionOutput`:

```ts
export type ConvictionOutput = {
  cardName: "Conviction";
  bodyPart: "Voice";
  cardHeader: string;
  gift: SwotCell;
  blindSpot: SwotCell;
  posture: string;
  patternNote: string;          // CC-025 — aphoristic closing
};
```

Extend `PathOutput`:

```ts
export type PathOutput = {
  cardName: "Path";
  bodyPart: "Gait";
  directionalParagraph: string;
  work: string;
  love: string;
  give: string;
  growthCounterweight: string;
  patternNote: string;          // CC-025 — aphoristic closing
};
```

The `SwotCell` type already carries `{ category?: GiftCategory; text: string }` — Pattern Note doesn't need a gift-category, so `category` stays optional.

### Step 1.2 — Author Practice text per card

Per-card Practice text — fixed templates, no signal interpolation in v1. Each is keyed to the card's body-part metaphor and asks a question the card-register naturally invites. Canonical text:

| Card | Practice text |
|---|---|
| **Lens · Eyes** | *"Before acting, ask: What is this moment connected to? What happened before, and what will this choice create next?"* |
| **Compass · Heart** | *"When values collide, say the tradeoff out loud: I am trying to protect both of these goods, but this moment requires an order."* |
| **Conviction · Voice** | (no Practice slot — Posture occupies this position; see §1.5) |
| **Gravity · Spine** | *"Ask: What part is mine? What part belongs to another person? What part belongs to circumstance, system, limitation, or mystery?"* |
| **Trust · Ears** | *"Separate three questions: Who do I trust for facts? Who do I trust for wisdom? Who do I trust because they love me?"* |
| **Weather · Nervous System** | *"Notice which patterns remain when the load eases. Those are more likely to be shape. The others may be weather."* |
| **Fire · Immune Response** | *"Before paying a price, ask: Is this the right cost, for the right value, in the right way, at the right time?"* |
| **Path · Gait** | *"Choose one long-arc commitment that protects what matters most without depending on urgency: a recurring conversation, a standing act of generosity, a weekly planning ritual, or a relationship practice that continues when no one is asking."* |

These replace the existing growthEdge.text content in each card. The Practice for Path lives inside its existing prose flow (PathExpanded), not as a separate section header — Path keeps its narrative-paragraph body shape.

Note Path's Practice is the one with light templating: *"protects what matters most"* could optionally interpolate the user's top sacred value (e.g., *"protects Family without depending on urgency"*). For v1, ship the un-interpolated version; if real-user testing shows it reads generic, add interpolation in a follow-up.

### Step 1.3 — Author Pattern Note text per card

Aphoristic closing line per card, keyed to the card's architectural truth. Fixed templates, no interpolation. Canonical text:

| Card | Pattern Note |
|---|---|
| **Lens · Eyes** | *"Your growth is not to abandon action. It is to let context travel with action."* |
| **Compass · Heart** | *"Your values are strongest when they remain chosen priorities, not defended reflexes."* |
| **Conviction · Voice** | *"Conviction becomes more beautiful when it is strong enough to speak plainly and humble enough to listen carefully."* |
| **Gravity · Spine** | *"A strong spine does not carry every load. It carries the right load."* |
| **Trust · Ears** | *"Discernment improves when trusted voices have different jobs rather than equal authority over everything."* |
| **Weather · Nervous System** | *"This card protects the whole report from overclaiming. State is not the same as self."* |
| **Fire · Immune Response** | *"Courage with calibration is stronger than courage alone."* |
| **Path · Gait** | *"Your growth path is not to become less present. It is to let presence develop a memory and a future."* |

These are the durable, card-register-specific closing notes. They generalize across users; they're about the card's architectural truth, not user-specific content. This is what solves the per-card duplication problem at architecture.

Some of these phrases came verbatim from LaCinda's LLM rewrite. Three were authored to match style. All eight should be reviewed in browser smoke; if any reads off-tone, surface for a one-line tune-up.

### Step 1.4 — Per-card register-aware Growth Edge variants

LaCinda's session surfaced this case explicitly. Conviction · Voice was rendering an action-register trap (*"Ignoring patterns and precedent. The instinct to move can outrun the situation..."*) because the gift-category-to-trap mapping doesn't account for card register.

Required: each card's Growth Edge text composes with the card's body-part metaphor, regardless of which gift category the user landed in. Where the existing `BLIND_SPOT_TEXT_VARIANTS` for a gift category produces wrong-register text on a specific card, add a card-keyed variant.

The named fix: **Conviction Growth Edge for action-class gifts** should read *"The risk is that deeply held belief can become less available for conversation. When conviction has already chosen its room, it may stop checking whether the door should remain open."* — not the action-momentum variant.

Audit pass required: for each (gift-category × card) combination that appears in real-user output, verify the resulting Growth Edge text composes with the card register. Where it doesn't, add a card-keyed variant. Reference CC-023's `BLIND_SPOT_TEXT_VARIANTS.Advocacy` for the pattern of how to add card-keyed variants.

This audit may surface 3-6 additional needed variants beyond the named Conviction case. Don't try to invent variants for combinations that don't appear in real-user output — only patch what testing surfaces.

### Step 1.5 — `ShapeCard.tsx` rendering changes

Render 4 sections instead of 3 in the `full-swot` variant body:

```tsx
<div className="flex flex-col" style={{ gap: 22 }}>
  {mbtiSlot}
  <Cell label="Strength" text={output.gift.text} />
  <Cell label="Growth Edge" text={output.blindSpot.text} />
  <Cell label="Practice" text={output.growthEdge.text} />
  <Cell label="Pattern Note" text={output.patternNote.text} variant="aphorism" />
</div>
```

The fourth Cell uses an `aphorism` variant — italic, slightly smaller, perhaps an em-dash separator above. Visually distinct from the prose cells; reads as a closing line, not as another body section. Engineer's call on exact styling; goal is "feels like a closing aphorism" not "feels like a fourth body paragraph."

Conviction variant body:

```tsx
<div className="flex flex-col" style={{ gap: 22 }}>
  <Cell label="Strength" text={output.gift.text} />
  <Cell label="Growth Edge" text={output.blindSpot.text} />
  <Cell label="Posture" text={output.posture} />
  <Cell label="Pattern Note" text={output.patternNote} variant="aphorism" />
</div>
```

Posture stays where Practice would sit. Pattern Note appends.

Path variant: the existing PathExpanded body stays as narrative paragraphs. Append a single Pattern Note line at the end, styled the same as `aphorism` variant.

Section labels: *Strength* (unchanged), **Growth Edge** (was *Trap*), **Practice** (was *Next move*), **Pattern Note** (new). Update label strings in the existing CellLabel components.

### Step 1.6 — Markdown export

`lib/renderMirror.ts` already renders the existing 3-section card body (CC-022c shipped). Update to render the 4-section structure, including Pattern Note as a final italicized line per card. Markdown format: a final blockquote or em-italicized line works; engineer's choice on exact markdown shape.

---

## Phase 2 — Mirror & Tension Prose Softening

### Step 2.1 — Mirror header rename

In `app/components/MirrorSection.tsx` (or wherever the Top 3 section header lives), rename:

- *"Your Top 3 Traps"* → *"Your Top 3 Growth Edges"*

The body content stays unchanged. One-line change in the component.

Same change in `lib/renderMirror.ts` for markdown export.

### Step 2.2 — "How to Read This" preamble

Add a small framing paragraph at the top of the Mirror section, between the title and the Core Pattern body. Canonical text:

> *"This profile is not meant to define you from the outside. It is meant to give language to a pattern your answers suggest: how you notice reality, what you protect, who you trust, where responsibility tends to land, and how your gifts behave when life puts pressure on them.*
>
> *The model proposes. You confirm. The most useful reading is not the one that flatters you or corners you. It is the one that helps you become more grounded, more honest, more legible, and more free inside the person you already are."*

This sets reader disposition before any specific claim. Same paragraph for every report — no interpolation. Markdown export gets the same paragraph.

### Step 2.3 — Allocation Gap prose softening (T-013 / T-014 / T-015)

Rewrite the `user_prompt` strings for these three tensions per the queue notes' Pattern 2. Template (with `{value}` and `{top-2 spending}` interpolations):

> *"You named {value} as among your most sacred values. Your money appears to flow mostly to {top-2 spending}. That does not mean hypocrisy. The model cannot know motive.*
>
> *It could mean: exhaustion, a difficult season, needed self-care, social bonding, old habits, or a real gap between stated priority and lived allocation.*
>
> *The only fair question is: does this feel true, partially true, or not true at all?"*

Apply the same template shape to T-013 (money allocation gap), T-014 (sacred-words-vs-spent-energy), and T-015 (current-vs-aspirational allocation), with appropriate per-tension wording for the gap being surfaced.

For T-014 specifically, end with a candidate move rather than the open question:

> *"...If {value} is central, but energy mostly goes toward immediate problem-solving, the adjustment may not be dramatic. It may simply mean giving {value} a scheduled claim on your best energy, not only your leftover energy."*

The 3-state question ("true / partially true / not true") maps onto the existing Yes / Partially / No affordances on the Open Tensions UI.

### Step 2.4 — Keystone Reflection positive-read-first softening

In `lib/beliefHeuristics.ts`, the closed-revision case currently produces prose like *"the belief reads as held against the world."* Soften per LaCinda's LLM rewrite:

> *"Your answers also suggest that this belief is not easily revised by outside sources. That may reflect conviction, faithfulness, and spiritual stability. It may also be worth holding with awareness: when a belief is central enough to carry identity, it deserves not less care, but more humility in how it is expressed."*

The architectural read is unchanged (closed-revision pattern still detected); only the emotional register softens. Acknowledge the positive interpretation *first*, then the watch point.

Apply the same pattern to other Keystone Reflection prose paths where the engine detects something worth flagging — the structure is "name the positive read, then the watch point" rather than "name the watch point alone."

### Step 2.5 — Open Tensions named, not numbered

Two changes:

**A.** Drop T-### IDs from user-facing prose. The list shows tensions by descriptive name only. Engine bookkeeping keeps T-### IDs internally (they're useful for tension dedup and back-end logging), but the UI surfaces names. Mapping:

| ID (internal) | Display name (user-facing) |
|---|---|
| T-007 | Family vs Truth |
| T-012 | Sacred Values in Conflict |
| T-013 | (varies by case — see tension-library-v1.md) |
| T-014 | Words and Energy |
| T-015 | Current and Aspirational Allocation |

**B.** The duplicate T-015 case (outward + inward, currently rendering as two list entries with same ID and different prose). Collapse into one Open Tensions list entry that contains both subsections inside. Or — if the engine detects only one of outward / inward — render a single entry with that subsection only. Don't render two entries with the same ID.

Engineer's call on whether this is a render-layer collapse (in `MirrorSection.tsx`) or an engine-layer dedup (in tension construction). The user-visible result is the same: no duplicate list entries.

### Step 2.6 — Pronoun register cleanup

Audit Mirror sections for mid-document switches between *"you/your"* and the user's name. Standard: Mirror body uses second-person throughout. The Synthesis section *may* keep name-threading (it's the natural place for it — *"LaCinda's gift is X, LaCinda's danger is Y"* is the parallel-line close pattern). Other sections — Core Pattern, Top 3 Gifts, Top 3 Growth Edges, What Others May Experience, When the Load Gets Heavy, Allocation Gaps, Next 3 Moves, Keystone Reflection — pin to second-person.

Where the engine currently interpolates user name in non-Synthesis sections, change to second-person. Demographic-name interpolation in card body prose (Path, Compass, etc.) stays as-is — that's per-card prose, not Mirror prose.

### Step 2.7 — Path · Gait Love compression (Pattern 6 from queue notes)

In `lib/identityEngine.ts`, add a one-line compression closer to each Path · Gait sub-section (Work / Love / Give). Template (per queue notes):

- Work closer: *"For {Name}, work may mature through {one-word distillation per shape}."*
- Love closer: *"For {Name}, love may mature through {one-word distillation per shape}."*
- Give closer: *"For {Name}, giving may mature through {one-word distillation per shape}."*

Per-shape one-word distillations to author. This may surface as 4-8 distinct distillations across all (function × top-compass) combinations. If authoring complete coverage is too large for this CC, ship Love only (the queue note's named example) and queue Work + Give for a follow-up.

---

## Acceptance

**Phase 1:**

- `FullSwotOutput`, `ConvictionOutput`, and `PathOutput` types include `patternNote` field.
- Per-card Practice text and Pattern Note text exist in `lib/identityEngine.ts` for all 8 ShapeCards.
- Conviction Growth Edge variant for action-class gifts reads as conviction-register text, not action-register.
- `ShapeCard.tsx` renders 4 sections per full-swot card (Strength / Growth Edge / Practice / Pattern Note); Conviction renders Strength / Growth Edge / Posture / Pattern Note; Path appends Pattern Note line at end of PathExpanded body.
- Markdown export includes the new sections.

**Phase 2:**

- Mirror header reads *"Your Top 3 Growth Edges"* (was *"Traps"*).
- "How to Read This" preamble paragraph appears at top of Mirror.
- Allocation Gap tensions (T-013 / T-014 / T-015) prose follows the 6-item interpretation list + 3-state question template.
- T-014 closes with a candidate move, not a question + model disclaimer.
- Keystone Reflection closed-revision prose acknowledges the positive read before the watch point.
- Open Tensions list shows tensions by descriptive name; T-### IDs not user-visible.
- Duplicate T-015 entries (outward + inward) consolidated into one list entry.
- Mirror body uses second-person throughout; Synthesis section may name-thread.

**Verification:**

- `npx tsc --noEmit` exits 0. `npm run lint` passes. `npm run build` succeeds.
- Browser smoke shows the new card structure rendering on all 8 cards. Markdown export shows the same structure in text form.
- A fresh real-user session reads with distinct prose per card (no two cards converge on identical Growth Edge or Practice text).

---

## Out of scope

- **LLM substitution path** — the queue notes flag LLM substitution as a future CC. Stays out. All prose is engine-deterministic.
- **New questions, new signals, new cross-card patterns.** Pattern catalog expansion is CC-029.
- **3C's integration.** Held; Jason's call.
- **Path contribution-verbs question.** Held; only after CC-028 evaluation.
- **Inner Constitution artifact alignment with spec §10.** Separate CC.
- **Renaming any existing question, signal, or pattern.**
- **Changes to question bank, ranking primitives, or the second-pass / Keystone flow.**
- **`MapSection.tsx` structural changes** — only the Path Pattern Note append is in-scope; the rest of MapSection stays as today.
- **Per-shape Path Work / Give one-line compressions** if the authoring surface is too large — ship Love only and queue the rest.

If you find yourself editing files outside the named surfaces, or making engine-logic changes beyond per-card prose authoring + the Open Tensions name/dedup work, stop and flag.

---

## Notes for the executing engineer

- **Stage commits if helpful.** Phase 1 (component + types + per-card content) and Phase 2 (Mirror + Tensions + preamble) are independently coherent. Two commits is fine; one is also fine. Don't ship Phase 1 without Phase 2 in the same CC — the prose architecture needs to land coherently or the report reads with mixed registers.
- **The Conviction Growth Edge fix is the named test case** for per-card register-aware variants. Audit the (gift-category × card) matrix for additional cases by reading the existing variant tables in `lib/identityEngine.ts` and checking each combination against the card's body-part metaphor. Don't invent variants for combinations that don't appear in real-user output.
- **Practice + Pattern Note text is locked.** All 16 strings (8 Practices + 8 Pattern Notes) are canonical per the tables in §1.2 and §1.3. Don't substitute. If any reads off in browser smoke, surface for a follow-up tune-up.
- **The Allocation Gap template is locked.** Don't reword "not hypocrisy" or "the model cannot know motive" — those are the load-bearing softening moves. Surrounding prose can be tuned to fit context, but those two phrases stay verbatim.
- **Pattern Note styling matters.** Engineer's call on exact rendering, but the goal is "feels like a closing aphorism, not another body paragraph." Italic, slightly smaller, em-dash separator above are all fine. Don't make it look like another Strength/Growth-Edge/Practice body cell.
- **Saved-session compatibility.** Pre-CC-025 saved sessions don't have `patternNote` fields in their stored ShapeOutputs. The engine should fall back gracefully — render the card with 3 sections (no Pattern Note) for old sessions, or fill in the Pattern Note from canonical-per-card text at render time. Engineer's call on the cleaner path.
- **Markdown export parity** is required. CC-022c established the architecture; this CC's prose changes must flow through.
- **Browser smoke required.** Engine checks confirm the wiring compiles and the new fields render. The prose register read (does the new structure feel coherent? do the Pattern Notes land as intended?) needs Jason's eyes across multiple sessions, especially at least one with a Conviction-register Growth Edge to verify the named fix.
