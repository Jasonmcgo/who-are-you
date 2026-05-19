# CC-108-WARMTH-COMPRESSION-AND-TRANSLATION

> Cowork-chat authored 2026-05-18. Three additive moves surfaced by
> the Brad/ChatGPT comparison, greenlit by Jason. Bundles together
> because they all touch launchPolishV3 prompt scope + share one
> cache regen pass.
>
> **Why now:** CC-106 closed the redundancy and warmed the LLM. The
> ChatGPT comparison showed three additional moves that would close
> the remaining ~30% of the warmth gap. Per the
> Brad-fixture editorial review, the engine version reads as
> diagnostically deep but not yet *humanly named first*. This CC
> adds the human framing, compresses the body-card real estate, and
> gives the user a sentence they can speak.
>
> **What this CC does NOT take from ChatGPT:** the engine's
> diagnostic surfaces (trajectory chart, Movement panel numbers,
> Grip Pattern card with named question + contributing grips,
> Keystone Reflection, Disposition Signal Mix). Those are what make
> this an instrument; ChatGPT only stripped them because it had no
> access. We keep all of them.

## Why this CC exists

Brad's report (rendered 2026-05-18 20:10, post-CC-106 in concept but
pre-deploy) was compared against a ChatGPT rewrite of the same
content. The ChatGPT version did six things CC-106 + CC-107 already
cover (preamble drop, appendix collapse, Compass anti-repetition,
Giving-pose close, etc.). It did THREE things neither CC covers:

1. **Humanizing one-line reframe at the top of the Executive Read.**
   ChatGPT opened: *"Brad may look like a pure operator on the
   surface, but the report is better read as a warm, loyal,
   people-protecting shape that uses structure as its native
   language."* This is a load-bearing reframe — it tells the reader
   who they ARE before listing what they DO. The engine version's
   Executive Read does land "structuring caregiver" as the frame,
   but buries it mid-paragraph. Promote it to opening position.

2. **Compress the eight body cards into a default tight view.** The
   current MapSection renders 8 individually-collapsible cards, each
   with Strength / Growth Edge / Practice / Movement Note (~7–10
   sentences per card when opened). ChatGPT compressed all 8 into a
   single 3-column table (Card / Read / Practice) with ~3 sentences
   total per row. Move: default view = tight table, click-to-expand
   per row reveals the full existing card body. Preserves diagnostic
   depth; tightens default scroll.

3. **Translation sentences — language the user can actually speak.**
   ChatGPT wrote: *"The useful sentence may be: 'I am trying to help
   by making this stable, but I may be moving too quickly into
   fixing. Tell me what you need before I solve the wrong problem.'"*
   That's a portable phrase Brad could use tonight. The engine
   currently gives no such phrase. Add a single LLM-generated
   translation sentence as the closing beat of *What Others May
   Experience*.

## Phase 1 — Humanizing reframe in Executive Read

**File:** `lib/launchPolishV3Llm.ts` — the `executiveRead` section
scope (post-CC-106 form, ~5–7 sentence target).

**Add a required opening beat** at the top of the existing
executiveRead rubric:

> **Beat 0 (NEW, required first sentence):** Open with one sentence
> that names the user as a *shape*. Use the pattern: *"You may look
> like a [surface read], but the report is better read as a [warmer
> reframe] who [native-language verb]."* The reframe must reconcile
> the engine read (driver + protected value) with the human
> experience of it. Example — for a structurer + Family + high
> Goal/low Soul shape: *"You may look like a pure operator on the
> surface, but the report is better read as a warm, loyal, people-
> protecting shape that uses structure as its native language."*
> For a present-tense + Family + Soul-leaning shape: *"You may look
> like an in-the-moment responder, but the report is better read as
> a deeply loyal caregiver whose attention IS the gift."*

**Why this works:** the engine already classifies driver / protected
value / Soul-lean from math. The LLM's job is to translate that
classification into one "you ARE" sentence before the existing
"your gift / your danger / growth edge" beats. Lands the reader
inside their shape first, then the analysis.

**Anti-pattern (executor: reject if generated):**
- *"You are a structurer."* (engine-internal vocabulary)
- *"You are an ISFJ."* (borrowed-system label)
- *"You're someone who likes order."* (flat trait, not shape)
- Any opening that doesn't pair a surface-read with a warmer reframe
  via "but the report is better read as..."

## Phase 2 — Eight-card compression with click-to-expand

**Files:** `app/components/MapSection.tsx`.

**Change the default rendered shape** from 8 individual `<section>`
accordion cards to ONE compact `<table>` with 8 rows and 3 columns:

| Card | Read (one sentence) | Practice (one sentence) |
|---|---|---|

**Each row:**
- **Card** column: kicker label only (e.g. "Lens · Eyes / How you
  read reality"), in the existing kicker register.
- **Read** column: the leading sentence of the existing card body.
  For Lens/Compass/Hands/Path (LLM-rewritten), this is the opener
  of the LLM prose body. For Trust/Weather/Fire/Gravity/Conviction
  (engine-deterministic), this is the existing one-line summary
  that currently sits under the kicker.
- **Practice** column: the existing Practice sentence from each
  card body. For the 5 engine cards, this is the Practice sentence
  already composed by the engine. For the 4 LLM cards, extract the
  Practice sentence from the existing rewritten body.

**Click-to-expand:** clicking any row reveals the FULL existing card
body below the row (Strength / Growth Edge / Practice / Movement
Note for engine cards; the LLM-rewritten body for the 4 warm cards).
The expanded content is unchanged from today's render — same prose,
same structure. Only the DEFAULT view changes.

**Hands card asymmetry stays:** The Hands card image (PNG, per
CC-HANDS-CARD-IMAGE) renders ABOVE the table, not inside it.
Image is too tall for a table cell and Hands carries the Giving
pose visual canon (per `feedback_giving_vs_gripping_polarity.md`).

**Why click-to-expand rather than just shorter cards:** preserves
the diagnostic depth ChatGPT stripped. The reader who wants the
full card body still gets it; the reader scanning for orientation
gets a 9-row table instead of 8 cards × 7–10 sentences each.

**Acceptance for this section specifically:**
- Default view renders ~9 rows (8 cards + Hands image above) within
  one screen height on a desktop viewport (1080p).
- Click on any row expands the full card body underneath.
- Click again collapses.
- Multiple rows can be expanded at once (accordion-style "exclusive
  open" is NOT desired — users may want to compare two cards).
- Print stylesheet expands all cards (full body visible on PDF
  export).

## Phase 3 — Translation sentence in *What Others May Experience*

**File:** `lib/launchPolishV3Llm.ts` — the `whatOthersMayExperience`
section scope.

**Extend the current scope** with one additional required closing
beat:

> **Beat (NEW, required closing sentence):** Close the section with
> one portable translation sentence the user could actually speak
> to bridge the gap named earlier in the section. Use the pattern:
> *"The useful sentence may be: '[verbatim quote of something the
> user could say, in their voice, that names the misread + offers
> a redirect].'"* The quoted sentence must:
> - Be ≤ 35 words.
> - Be speakable aloud (no clinical vocabulary, no semicolons, no
>   parenthetical asides).
> - Name what the user is trying to do AND what they want the
>   listener to do differently (a 2-part shape: "I'm trying to X,
>   but [misread risk]. [Concrete ask of the listener]").
> - Be tailored to the specific shape — NOT a generic phrase. A
>   structuring caregiver's sentence should sound different from a
>   present-tense responder's.

**Anti-patterns (executor: reject if generated):**
- *"Just tell me what you need."* (generic, not shape-specific)
- *"I'm sorry for being too direct."* (apology, not a translation)
- Any sentence that's just a restatement of the *What Others May
  Experience* paragraph in quotes.

**Example output (for Brad's shape):**
> *The useful sentence may be: "I'm trying to help by making this
> stable, but I may be moving too quickly into fixing. Tell me what
> you need before I solve the wrong problem."*

## Phase 4 — Cache regen

Editorial changes to `executiveRead` and `whatOthersMayExperience`
scope invalidate every existing entry for those two sections in
`lib/cache/launch-polish-v3-rewrites.json` (engine hash will change).
Regen is required for those two sections only — the other 5 V3
sections (corePattern, whenTheLoadGetsHeavy, synthesis, closingRead,
pathTriptych) are untouched.

**Order (per `feedback_cache_regen_ordering.md`):**
1. `buildSynthesis3` — verify nothing else moved (cheap on cache
   hits).
2. `buildProseRewrites` — verify nothing else moved.
3. `buildLaunchPolishV3` — regen `executiveRead` and
   `whatOthersMayExperience` ONLY. Other 5 V3 sections should hit
   cache and not regenerate.

**Fixtures to regenerate against:** the full 24-fixture cohort
(ocean/* + goal-soul-give/*) plus `jason-live.json` and the 7
cohort-real fixtures.

**Cost ceiling:** $4 hard stop. Expected $1–2 with prompt-cache
landed (per Jason's confirmation that CC-PROMPT-CACHE-CONTROL is
live). Calculation: ~25–32 fixtures × 2 sections × ~$0.02 per
fresh generation (cache-warm) = ~$1–2.

## Editorial review gate

Per `feedback_codex_llm_editorial_review.md` — mechanical "ran
clean" is insufficient when scripts write LLM content.

1. **Sample-read 5 fixtures' executiveRead** (Jason / Cindy / Daniel
   / Brad / Harry, if jason-live + the 4 named real-person fixtures
   are present). Confirm:
   - First sentence matches the *"You may look like X, but the
     report is better read as Y"* pattern.
   - The "X" surface-read and "Y" warmer-reframe are shape-specific
     and DIFFERENT across the 5 fixtures (no template re-use).
   - The rest of the executiveRead (gift / danger / growth edge
     beats) is preserved from CC-106.

2. **Sample-read 5 fixtures' whatOthersMayExperience.** Confirm:
   - The closing translation sentence exists (regex check:
     `"The useful sentence may be: "[^"]+\.""`).
   - The quoted sentence passes the constraints (≤ 35 words,
     2-part shape, shape-specific).
   - Inter-fixture diversity: no two translation sentences should
     share more than 3 content words (Jaccard ≤ 0.20 on tokens ≥ 4
     chars).

3. **Phase 2 acceptance (visual):** render Brad's report in the
   new compact MapSection. Confirm:
   - 9 rows visible in one screen on desktop.
   - Clicking any row expands the full card body.
   - Hands image renders above the table, not inside a row.

4. **Full audit suite green.** All 77 audits should remain at 77/77
   after this CC. Per `feedback_full_suite_after_bundle.md`: flag
   unexpected reds, don't auto-fix.

## What this CC does NOT do

- **Does NOT touch the 5 engine-deterministic body cards' bodies.**
  Trust/Weather/Fire/Gravity/Conviction expanded bodies remain the
  current engine prose. CC-108 only changes the DEFAULT rendered
  shape (table) — clicking expands the unchanged body.
- **Does NOT add a 9th body card to the table** beyond Hands. Hands
  renders above as image, not as table row.
- **Does NOT add translation sentences to any other section.** Only
  whatOthersMayExperience gets the new closing beat.
- **Does NOT regenerate Lens/Compass/Hands/Path prose-rewrites** —
  those are in `lib/cache/prose-rewrites.json`, untouched. Only the
  2 V3 sections regen.
- **Does NOT touch CC-107's preamble suppression.** CC-107 and
  CC-108 are independent; either can ship first.
- **Does NOT change engine math, chart, Movement panel, Grip
  section, Grip Pattern card, Keystone Reflection, or Disposition
  Signal Mix.** Those are the engine's empirical contribution and
  are explicitly preserved per Jason's *"what ChatGPT lost that we
  should NOT lose"* list.
- **Does NOT change clinician-mode rendering.** Clinician markdown
  continues to emit the un-tabled per-card sections; only the user-
  mode React render compresses into table format.

## Notes for the executor

- Total executor time estimate: ~1.5–2 hours. Phase 1 + Phase 3
  are small prompt edits (~30 min combined). Phase 2 is the
  largest piece — MapSection.tsx restructure with table + expand-
  on-click (~1 hour). Phase 4 cache regen is ~5–10 min of LLM
  wall time. Per `feedback_cc_time_estimates_5x_too_high.md`,
  reject any estimate above 3 hours as overshoot.
- The Phase 2 table is a presentational change only. The data
  model under MapSection (constitution.lens / .compass / .hands /
  etc.) is untouched. Read carefully — there's likely an existing
  `<details>` pattern in the codebase (used in UseCasesSection
  per CC-106 Phase 1.2) that this can mirror for the click-to-
  expand UX.
- If the Phase 2 table reveals that a card's leading-sentence isn't
  a clean one-sentence read (e.g. Trust card's "You tend to trust
  institutions when..." spans across grammatical structure),
  truncate at the first period for the table cell. The full prose
  appears on expand.
- Per `feedback_sandbox_git_lockfile.md`: any commit command handed
  to Jason should prepend `rm -f .git/index.lock`.
- After landing, save a short memory file confirming the cohort-
  level translation-sentence diversity holds (the editorial review
  measures this once; memory should record the baseline so future
  CCs that touch whatOthersMayExperience can compare).
