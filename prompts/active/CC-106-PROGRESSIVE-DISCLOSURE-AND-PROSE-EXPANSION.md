# CC-106-PROGRESSIVE-DISCLOSURE-AND-PROSE-EXPANSION

> Cowork-chat authored 2026-05-18 after Jason reviewed Cindy's full
> rendered report against the upcoming 100-person cohort drop.
>
> **Editorial premise:** the report is hiding its gold. Engine
> template prose currently occupies ~55–60% of the vertical height
> while saying the same Compass values eight different ways. LLM
> material lands harder when it isn't competing with templated
> restatement of the same point. Collapse the engine; expand the
> LLM; ship the anti-repetition rule that `feedback_clarence_
> progressive_disclosure_review.md` canonized two weeks ago but
> nothing has landed against.
>
> **Amendment 2026-05-18 (post initial fire):**
> Jason canonized the Giving↔Gripping polarity in a separate
> exchange — see `feedback_giving_vs_gripping_polarity.md`. The
> Vistage-note alignment review surfaced a gap (the report does
> not synthesize Goal/Soul balance into the user's canonical
> language). Phase 3.3 below adds a new section spec that
> addresses this gap directly. Re-fire only Phase 3.3 and re-do
> the Phase 4 cache regen against the updated prompt; Phases
> 1–3.2 do not change.
>
> **Why now:** Jason has invited 100 people and is about to make a
> Facebook post that will likely add a few dozen more in the same
> window. The cohort will form their first impression of the
> product on whichever render lands first; that render should not
> be the current one.

## Why this CC exists

Jason annotated Cindy's report and named the worst redundancies:

- "Family, Loyalty, Faith, Peace" appears in 8 places.
- "ESFP" appears 3×.
- "more grounded, more legible, more free" appears 4×.
- "a possibility, not a verdict" appears 2×.
- Goal 67 / Soul 100 appears twice (Core Signal Map + Movement
  panel).
- "Belonging through usefulness" appears in chart caption, Grip
  Pattern card, and Grip section bullets.

These are not bugs — every emission has a legitimate authoring
reason. But the *aggregate effect* is that the reader has stopped
noticing the Compass values by the time the Closing Read lands,
and the warmest LLM material (Closing Read, Path Triptych, the
parallel-line closes) appears below ~60% of the scroll depth.

The fix is structural, in three coupled moves:
1. **Engine collapse** (Phase 1) — cut static engine sections that
   restate what other sections already say.
2. **LLM editorial rule** (Phase 2) — update launchPolishV3 system
   prompt to enforce the anti-repetition canon: once a Compass
   value is named, downstream prose translates it into shape-
   specific verbs rather than re-listing it.
3. **LLM expansion** (Phase 3) — the two warmest LLM sections
   (Closing Read, Path Triptych) get expanded scope to fill the
   space the engine just gave up.

Body-card asymmetry stays as-is: Lens/Compass/Hands/Path keep their
LLM-rewritten bodies; Trust/Weather/Fire/Gravity/Conviction stay
terse. The asymmetry becomes a feature — the reader spends time
where the warmth is.

## Phase 1 — Engine collapse

### 1.1 Delete the "How to Read This" section

**Files:**
- `lib/renderMirror.ts` (~line 810–813): remove the
  `out.push("## How to Read This")` block and the two-paragraph
  body that follows it.
- `app/components/MirrorSection.tsx` (~line 414–417): remove the
  `<SectionLabel>How to Read This</SectionLabel>` and the wrapped
  paragraph component.
- `lib/identityEngine.ts` (~line 7948): remove the orphaned
  comment reference once the section is gone.

**Why:** The masthead's "a possibility, not a verdict" subtitle
already does the work this section does. The reader reads the
disposition-setting twice in the first 60 seconds.

### 1.2 Collapse "What this is good for" to an appendix link

**Files:**
- `app/components/UseCasesSection.tsx`: do NOT delete the
  component. Wrap the 10-item list in a `<details>` element with
  summary text "10 places this read earns its keep ▾" (collapsed
  by default).
- `lib/humanityRendering/contract.ts` (~line 290) and
  `lib/humanityRendering/prompt.ts` (~line 18): the spine
  reference "What this is good for" stays — the markdown output
  for clinician mode and Anthropic-rendering paths continues to
  emit the section in full. Only the user-mode React render
  collapses it.

**Why:** Static, generic, 10 paragraphs of aspirational language at
the END of an already-long report. Most users will never reach it;
those who do don't need it on first read. Collapsing to a
disclosure preserves it for users who want it, frees the closing
real-estate for the warmer LLM Closing Read to land.

### 1.3 Strip Core Signal Map duplicates

**File:** `lib/coreSignalMap.ts`.

**Remove rows:**
- `Goal` (lives in Movement panel below)
- `Soul` (lives in Movement panel below)
- `Direction` (lives in Movement panel below)
- `Strength` (lives in Movement panel below)
- `Grip` (lives in Movement panel below)
- `Surface label` (lives in masthead above)

**Keep rows:**
- Driver
- Support
- Protected value
- First blame lens
- Work map
- Love map
- Pressure pull (one-line summary of stakes — keep, useful)
- Movement (one-line composite "67/100, Soul-leaning" — keep,
  reads as a single index)

**Result:** Core Signal Map drops from ~14 rows to ~8. The reader
gets a tight orientation table; the full numeric panel lives below
as the trajectory chart's data block.

## Phase 2 — LLM editorial rule (system prompt update)

### 2.1 launchPolishV3 anti-repetition rule

**File:** `lib/launchPolishV3Llm.ts` — `V3_REWRITE_SYSTEM_PROMPT`.

**Add to the system prompt** (after the existing voice / register
section, before the per-section scopes):

> **Anti-repetition rule.** Compass values (Family, Loyalty, Faith,
> Peace, Knowledge, Honor, etc.) and surface labels (ESFP, INTJ,
> etc.) appear ONCE in the report at their canonical placement
> (Compass card body and masthead, respectively). Your sections do
> not re-list them. When the read depends on a Compass value,
> translate it into the shape-specific verb the reader actually
> lives — what they *protect*, what they've *shown* they'll bear
> cost for, what they *organize their week around*. Generic example:
> instead of "you protect Family, Loyalty, Faith, and Peace," write
> "you organize your week around the people whose lives you've
> already shown you'll restructure for."
>
> The reader knows their Compass values by the time they reach your
> section. Your job is to land what the values *do*, not to repeat
> what they *are*.

**Why:** This is the canonical rule from
`feedback_clarence_progressive_disclosure_review.md` — "once the
core signal is established, later sections translate it into
concrete behavior rather than repeat the label." Has been canon for
two weeks; never landed in a system prompt.

### 2.2 Same rule applied to other LLM prompts (audit, don't necessarily edit)

For each of `lib/proseRewriteLlm.ts`, `lib/keystoneRewriteLlm.ts`,
`lib/synthesis3Llm.ts`, `lib/gripTaxonomyLlm.ts`: read the system
prompt. If it explicitly invites Compass-value restatement (e.g.,
"name the user's top values"), edit to apply the same rule. If it's
already neutral on this point, leave it alone.

Executor judgment call: if a prompt change here is non-trivial
(more than re-wording one paragraph), flag and stop — don't compose
multiple editorial CCs into one execution.

## Phase 3 — LLM expansion (regenerative)

### 3.1 launchPolishV3 closingRead — expand scope

**File:** `lib/launchPolishV3Llm.ts` — find the `closingRead`
scope/rubric block.

**Current scope (approximate):** 2–3 sentences summarizing the
shape's organizing pattern.

**New scope:** 5–8 sentences. Required beats:
1. One sentence: shape's organizing pattern (current behavior).
2. One sentence: the specific behavioral observation that names
   the lived shape — what they *do*, not what they *are*. (Cindy
   example: "You do not merely value Family; you act as if Family
   is something that must be held, fed, defended, and kept." This
   IS the current closingRead opening — keep this beat, build on
   it.)
3. Two sentences: what this gift costs and what it returns.
4. One sentence: the growth path framed as becoming more rooted
   in who they already are, NOT becoming someone else.
5. Optional one closing line: shape-specific, parallel-line
   structure if it lands. (Cindy: "The work is not to care less.
   It is to let love become sustainable enough to last." — this
   pattern is the canonical example.)

### 3.2 launchPolishV3 pathTriptych — add concrete this-week paragraph

**File:** `lib/launchPolishV3Llm.ts` — find the `pathTriptych`
scope/rubric block.

**Current scope:** one paragraph naming the chart shape ("Your
line leans toward the love-line right now...").

**New scope:** two paragraphs.

**Paragraph 1 (unchanged in spirit):** chart-shape read.

**Paragraph 2 (new):** what to actually do this week. Concrete,
behavioral, no abstraction. The chart told them where the line
leans; this paragraph tells them what move would lift the axis
that's currently quieter. Required beats:
- One concrete action targeted at the quieter axis (Goal-quieter
  → name something they will commit to that doesn't require
  emotional buy-in from anyone else; Soul-quieter → name a
  person, practice, or place they have not given full attention
  to in 30+ days and will this week).
- Not a self-help list; one specific move.
- Stays in second-person, present tense.

### 3.3 launchPolishV3 — add `givingGrippingSynthesis` section (NEW, amendment 2026-05-18)

**Why:** Per `feedback_giving_vs_gripping_polarity.md`, Giving and
Gripping are the two poles of the same axis — outward flow vs.
inward contraction. The chart already names the Giving quadrant
("Giving / Presence"); the Grip section already names Gripping
behaviorally. What the report does NOT yet do is name them as the
SAME axis in plain English, in the user's canonical language. This
is also the central missing read from Jason's Vistage-note framing:
"enough Goal to keep building, enough Soul to keep the building
connected to something that actually matters."

**File:** `lib/launchPolishV3Llm.ts`

**Add a new section** to the V3 layer named `givingGrippingSynthesis`.
Place it in the rendering order between `synthesis` and `closingRead`
(i.e., the second-to-last LLM section before the Closing Read lands).

**Scope (system prompt rubric for this section):**

The paragraph must land in 4–5 sentences and follow this canonical
frame, with mechanical inserts driven by engine values:

> *"Giving is what happens when the line is in balance and moving.
> Gripping is what happens when fear contracts it. Your line right
> now is `<balance-read>`, with Grip pulling at `<grip-intensity>`
> intensity — meaning `<polarity-read>`. The next step is not to do
> more; it's `<release-or-build-line>`."*

**Mechanical inserts (engine-supplied):**

`<balance-read>` (one of three, based on angle vs. 50° canonical):
- angle < 42°: `"Goal-saturated — more form than feeling right now"`
- angle 42–58°: `"in balance — Goal and Soul are speaking to each other"`
- angle > 58°: `"Soul-saturated — more feeling than form right now"`

`<grip-intensity>` (from composed Grip score, per `gripReading.score`):
- Grip ≤ 30: `"low"`
- Grip 31–55: `"moderate"`
- Grip 56–75: `"elevated"`
- Grip > 75: `"high"`

`<polarity-read>` (composition of balance + grip):
- balanced + low grip: `"you are closer to Giving than to Gripping on this axis right now — the line is flowing outward"`
- balanced + moderate grip: `"the line has Giving shape, but Grip is asking for a portion of the flow"`
- balanced + elevated/high grip: `"the line has Giving shape on paper, but Gripping is holding more of it than you can feel — and the holding-on is rooted in <fear-reference>"`
- Goal-saturated + low/moderate grip: `"the building is happening, but the building is not yet what you're giving — Giving requires the Soul axis to be in the line"`
- Goal-saturated + elevated/high grip: `"the building has become the Gripping — the form you've made is now the form you're afraid to let move; what reads as discipline is rooted in <fear-reference>"`
- Soul-saturated + low grip: `"the longing is whole; the form for Giving is still gathering"`
- Soul-saturated + elevated/high grip: `"the longing is whole, but Gripping has put on a Loving face — the holding-on is rooted in <fear-reference>, naming itself as devotion"`

`<fear-reference>` — **canonical fear vocabulary lives in the Grip
Pattern catalog. Do NOT coin new fear language.** Pull from the
user's resolved `gripPattern.bucket` (per the 4-layer Grip Pattern
architecture that landed in CC-GRIP-TAXONOMY-REPLACEMENT, commit
ref in memory `project_cc_grip_taxonomy_replacement_landed.md`):

- Safety → `"the fear of harm coming to what you've built"`
- Security → `"the fear that what you've built will dissolve"`
- Belonging → `"the fear of no longer having a place if you stop providing"`
- Worth → `"the fear of being unseen if you are not the one giving"`
- Recognition → `"the fear of being unnoticed if you don't perform the giving"`
- Control → `"the fear that what you've built will fall apart without your management"`
- Purpose → `"the fear of being directionless if you stop"`
- Unmapped (~29% of cohort per memory) → `"the fear your Grip Pattern card has begun to name"` (graceful pointer back to the Grip Pattern surface; do NOT invent a fear when the bucket is unmapped)

**Architectural rule (canonize in the rubric, top of section):**

> **Fear = Grip Patterns.** The fear underneath any Gripping read is
> already named in the user's Grip Pattern card. The synthesis
> paragraph composes with the Grip Pattern surface — it does not
> fork the fear vocabulary. When this section needs to reference
> fear, pull the exact wording from the `<fear-reference>` table
> above. If a future LLM generation attempts to invent a fear name
> not in the table, treat that as a regression and revert.

**Why this matters architecturally:** The Grip Pattern card and the
Giving·Gripping synthesis are two surfaces reading the same fear
from different angles — Grip Pattern names it from the user's lived
experience ("Will I still have a place here if I cannot provide
what they need?"), Giving·Gripping names it from the polarity-read
("the holding-on is rooted in the fear of no longer having a place
if you stop providing"). The two readings should rhyme word-for-
word on the fear noun — that rhyme is what makes the report feel
unified rather than templated.

`<release-or-build-line>` (matched to polarity-read):
- For balanced + low grip (already Giving): `"to keep the line moving; what you've built wants to be spent, not preserved"`
- For balanced + moderate/elevated grip: `"to release what's pulling the line back, so what you've already built can flow"`
- For Goal-saturated: `"to find the one piece of what you build that you would give away without trade — and start there"`
- For Soul-saturated + low grip: `"to give the longing a shape someone else could receive — Love takes form, or it stays an internal weather"`
- For Soul-saturated + elevated/high grip: `"to notice where the holding-on has stopped being love and started being weight — and open the hand"`

**Anti-repetition rule applies** (per Phase 2.1): the paragraph does
NOT re-list Compass values. The synthesis works at the polarity
level, not the value-list level.

**Why mechanical inserts (rather than free LLM composition):** This
section is the canonical synthesis read. It must use Jason's exact
canonical language ("Giving," "Gripping," the 50° balance frame).
Mechanical inserts guarantee canon-faithful vocabulary; LLM
free-composition risks paraphrase drift away from the canonical
terms. The LLM's job is to make the inserts read naturally in
context, not to invent the framing.

**Render placement:** Display the paragraph as a standalone
section between A Synthesis and Closing Read in the user-facing
report. Section label: `Giving · Gripping` (with the middle-dot,
matching the body-card naming convention).

**Acceptance for this section specifically:**

- Sample-read all 24 cohort fixtures' `givingGrippingSynthesis`
  output. Each must contain the literal strings "Giving" and
  "Gripping" (the canonical vocabulary).
- Confirm the `<polarity-read>` insert correctly composes balance
  × grip — spot-check 6 fixtures across the polarity-read
  branches (one Giving, one Goal-saturated, one Soul-saturated +
  low grip, one Soul-saturated + high grip, one balanced +
  moderate grip, one balanced + elevated grip).
- The paragraph must NOT exceed 5 sentences. If it does, the LLM
  is over-elaborating the inserts — tighten the rubric.

## Phase 4 — Cache regeneration

Editorial changes to launchPolishV3 system prompt invalidate every
existing entry in `lib/cache/launch-polish-v3-rewrites.json`
(engine hash will change once the prompt does). Regen is required.

**Order (per `feedback_cache_regen_ordering.md`):**
1. `buildSynthesis3` first (no changes to its prompt expected, but
   re-runs are cheap on cache hits — verify nothing else moved).
2. `buildProseRewrites` second (untouched here, same reason).
3. `buildLaunchPolishV3` third (this is the one that actually
   regenerates against the new system prompt + new closingRead /
   pathTriptych scopes).
4. `buildKeystoneRewrites` and `buildGripTaxonomy` last (untouched
   here unless the executor's Phase 2.2 audit changes them).

**Fixtures to regenerate against:** the full 24-fixture cohort
(ocean/* + goal-soul-give/*) plus `jason-live.json` and any other
real-person fixtures in `tests/fixtures/cohort-real/`.

**Cost ceiling:** $8 hard stop. Expected $3–5 if CODEX-PROMPT-
CACHE-CONTROL has landed first ($1–2 with cache); $5–8 without
cache. (Per `feedback_llm_cost_estimates_10x_too_high.md`: anchor
on fresh-generation count, not iterations. 24 fixtures × 4 sections
× ~$0.05 = ~$4.80.)

## Editorial review gate (acceptance, not optional)

Per `feedback_codex_llm_editorial_review.md` — mechanical "ran
clean" is insufficient when scripts write LLM content. Before
declaring this CC done, executor MUST:

1. **Sample-read 5 fixtures' closingRead** (mix: Jason + Cindy +
   Daniel + 2 random ocean fixtures). Confirm:
   - Each is 5–8 sentences, hits all required beats.
   - No two closing reads share more than 2 sentences in structure
     (different shapes should read differently).
   - No Compass-value list reproduction inside the closing read.
   - Hedge count ≤ 3 per fixture (per
     `feedback_hedge_density_in_engine_prose.md`).

2. **Sample-read 5 fixtures' pathTriptych.** Confirm:
   - Two paragraphs, the second is concrete-action.
   - The concrete move targets the quieter axis (engine reports
     Goal/Soul split; the move should NOT be on the dominant
     axis).
   - No "self-help list" tone.

3. **Repetition audit on 3 full reports** (Jason / Cindy /
   Daniel): count occurrences of each top Compass value across
   the full rendered report.
   - Family/Loyalty/Faith/Peace (Cindy's case): target ≤ 3
     occurrences total across non-Compass-card sections (was 8).
   - Surface label (ESFP/INTJ/etc.): target = 1 (was 3).

4. **Full audit suite** (`npm test` or equivalent — all 77
   `tests/audit/*.audit.ts` files) MUST pass. Per
   `feedback_full_suite_after_bundle.md`: per-CC audits green ≠
   bundle audits green. If any audit goes red unexpectedly, flag
   and stop — do not auto-fix.

## What this CC does NOT do

- **Does NOT touch the body-card asymmetry.** Lens/Compass/Hands/
  Path stay LLM-rewritten; Trust/Weather/Fire/Gravity/Conviction
  stay engine-deterministic. Bringing the latter five to LLM
  parity is a separate CC if/when Jason wants it.
- **Does NOT change engine math.** No edits to `lib/identityEngine
  .ts`, `lib/aim.ts`, hash functions, score composition.
- **Does NOT change Movement panel, chart, or Grip section
  structure.** Those landed cleanly in CC-105 and CC-MOMENTUM-
  HONESTY; leave them alone.
- **Does NOT add new sections.** This CC only collapses or expands
  what exists.
- **Does NOT change the masthead, Open Tensions, Mirror-Type Seed,
  Conflict Translation, or Disposition Signal Mix.** Those have
  their own editorial questions; not in scope here.
- **Does NOT modify the clinician-mode render.** Phase 1.2's
  `<details>` collapse applies to user-mode React only;
  clinician-mode markdown emission continues to write the full
  "What this is good for" section per
  `feedback_two_tier_render_canon.md`.

## Notes for the executor

- Executor time estimate: ~1.5–2 hours, NOT counting the cache
  regen wall time (regen is ~5–10 min of LLM API time, mostly
  parallel). Per `feedback_cc_time_estimates_5x_too_high.md`,
  reject any time estimate above 3 hours as overshoot.
- The launchPolishV3 system-prompt edit is the most editorially
  delicate change in this CC. If the rewritten prompt comes out
  longer than ~3,800 tokens (current is ~1,621), pause and
  flag — over-stuffing the prompt risks compressing per-section
  quality. The anti-repetition rule should add ~150 tokens, not
  ~1,500.
- If the executor reads Cindy's regenerated closingRead and it's
  not visibly better than the current one in 3.1's example,
  STOP and flag. Don't ship a regen that produces flat output.
- After landing, save a short memory file noting the cohort-
  level redundancy counts (post-CC-106 baseline) so future
  editorial work has a reference point.
