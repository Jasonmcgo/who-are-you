# CC-SYNTHESIS-1-FINISH — Close the Synthesis-1 Sub-Track (Dedup + Trust Reframe + Weather Qualifier + Risk Form Thin-Signal + Movement Notes + Path Master Synthesis)

**Origin:** CC-SYNTHESIS-1A shipped 2026-05-08 (Risk Form 2x2 + four-quadrant Movement rename + two-tier closing-phrase logic). Render review of the post-1A canonical Jason fixture surfaced two fronts:

1. **Repetition** — the canonical thesis line ("You are a long-arc pattern reader and builder whose growth edge is not caring more, but translating conviction into visible, revisable, present-tense structure") fires four times in the same report (Executive Read sentence 3 + Layer 5A summary callout + Synthesis closing thesis + Layer 5C Final Line callout). The gift/danger one-liner fires twice (Executive Read sentences 1-2 + Layer 5B Most Useful callout). The "your shape suggests work..." paragraph fires twice (Path · Gait opening + Growth Path).

2. **Synthesis architecture extension to the body cards** — per the Jason+Clarence architectural sketch 2026-05-08, the synthesis layer extends through 5 body cards (Trust + Weather get reframes; Lens / Compass / Conviction / Gravity / Fire get Movement Notes; Path becomes the master synthesis card).

CC-SYNTHESIS-1-FINISH closes both fronts in one pass. After this CC, the SYNTHESIS-1 sub-track is complete; the next move is CC-SYNTHESIS-2 (cross-card composition) or CC-SYNTHESIS-3 (LLM articulation layer), each gated by cohort feedback and queued behind this CC.

**Method discipline:** Mechanical to medium-judgment work. No new claims; no new measurements; no new questions; no LLM at production time. The Risk Form 2x2 + four-quadrant labels + two-tier closing-phrase logic from CC-SYNTHESIS-1A are inputs to the new Movement Notes; do NOT modify them. Engine canon phrases from CC-PROSE track stay verbatim. Hedge density stays within ±5 of pre-CC baseline.

**Scope frame:** Six sections, one coordinated CC. ~12-15 hours executor time. CC-scale because of the editorial judgment in card reframes and Path restructure, not because of architectural heaviness.

---

## Embedded context (because CC executor environments don't see Cowork memory)

**Synthesis architecture (Jason+Clarence sketch 2026-05-08):**

Each measurement system has ONE non-overlapping job:
- **Jungian processes** = cognitive orientation (what info is privileged); 8 functions: Ni/Ne/Si/Se/Ti/Te/Fi/Fe with plain-English labels (pattern-reader / possibility-finder / precedent-checker / present-tense self / coherence-checker / structurer / inner compass / room-reader)
- **OCEAN** = behavioral intensity and regulation (volume knobs)
- **Values / Compass** = sacred priority (what this protects)
- **3C drive distribution** = motivational fuel (Cost↔Goal-line; Coverage↔Soul-line; Compliance independent of Grip per correlation audit)
- **Goal/Soul/Movement** = trajectory state (where the life leans)
- **8 body cards** = embodiment map (where it shows up)
- **Path** = synthesis card (what to do with it)

Per-card primary/secondary system mapping:
- Lens: Jungian primary; Openness secondary
- Compass: Values primary; Agreeableness + Fi/Fe secondary
- Conviction: Fire+values-under-cost primary; Extraversion + Agreeableness + Ti/Te/Fi/Fe secondary
- Gravity: Responsibility-attribution primary; Te/Ti/Si/Ni + Conscientiousness secondary
- Trust: Epistemology/authority primary; Openness + Agreeableness + Ti/Te/Si/Fe secondary
- Weather: State/load primary; Reactivity + Extraversion + Conscientiousness secondary
- Fire: Risk Form primary; Reactivity + Conscientiousness + dominant/inferior process secondary
- Path: Integration primary; all systems

**Canonical compression block (Jason 2026-05-08):**

> *The line shows where the life is moving. The 3C's show what fuels and governs the movement. The body cards show how that movement becomes this person.*

**Risk Form 2x2 (from CC-SYNTHESIS-1A, lib/riskForm.ts):**

- Wisdom-governed: high Risk-bucket + low Grip
- Grip-governed: high Risk-bucket + high Grip
- Free movement: low Risk-bucket + low Grip
- Reckless-fearful: low Risk-bucket + high Grip

Risk-vs-Grip operational rule: *Risk is not Grip. Risk becomes Grip when the governor starts preventing movement instead of aiming it.*

**Hedge density baseline:** 30-47 phrases per fixture (high; do NOT add more). Per `feedback_hedge_density_in_engine_prose`.

**Engine canon phrases preserved verbatim across all CCs (do NOT paraphrase):**

"convert structure into mercy", "care with a spine", "the early shape of giving", "Your gift is the long read", "let context travel with action", "Pattern in motion" footer label, "Movement Note" is the new label introduced in this CC.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run audit:ocean`
- `npm run audit:goal-soul-give`
- `npx tsx tests/audit/proseArchitecture.audit.ts`
- `npx tsx tests/audit/synthesis1a.audit.ts`
- `npx tsx tests/audit/jungianCompletion.audit.ts`
- `npx tsx tests/audit/proseCorrelation.audit.ts`
- `npx tsx tests/audit/functionCoverage.audit.ts`
- `npx tsx tests/audit/synthesis1Finish.audit.ts` (the new file added by this CC)
- `npm run dev`
- `git status`, `git diff`
- `node`, `npx tsx`
- `cat`, `grep`, `find`

## Read First (Required)

1. `lib/identityEngine.ts` — `buildInnerConstitution`, `composeExecutiveRead`, `composeThesisLine`, `composeGiftDangerLine`, `composeReportCallouts`, `generateSimpleSummary`, `composeClosingReadProse`. The CC-PROSE + CC-SYNTHESIS-1A composers all live here.
2. `lib/renderMirror.ts` — markdown render path. Locate where Layer 5A summary callout, Layer 5B most useful line callout, Synthesis closing thesis sentence, Growth Path section, Path · Gait opening paragraph all render.
3. `lib/riskForm.ts` — Risk Form 2x2 classifier (CC-SYNTHESIS-1A canon). Used as input to Fire Movement Note.
4. `lib/movementQuadrant.ts` — four-quadrant classifier (CC-SYNTHESIS-1A canon). Used as input to Path master synthesis.
5. `lib/cardAssets.ts` — `SHAPE_CARD_QUESTION` (CC-PROSE-1 canon), `SHAPE_CARD_PRACTICE_TEXT` (CC-022 canon).
6. `lib/coreSignalMap.ts` — Core Signal Map composer (CC-PROSE-1B). Some of the same engine outputs feed Movement Notes; reuse helpers where possible.
7. `app/components/MirrorSection.tsx`, `app/components/ShapeCard.tsx`, `app/components/InnerConstitutionPage.tsx` — React render paths.
8. `lib/types.ts` — `InnerConstitutionOutput` type.
9. The 20-fixture cohort under `tests/fixtures/`.
10. `tests/audit/proseArchitecture.audit.ts` and `tests/audit/synthesis1a.audit.ts` — existing audit harnesses; CC-SYNTHESIS-1-FINISH adds its own audit file at `tests/audit/synthesis1Finish.audit.ts`.

---

## Section A — Prose Dedup Pass

**Files modified:** `lib/renderMirror.ts`, `app/components/MirrorSection.tsx`, possibly `lib/identityEngine.ts` (if `composeReportCallouts` needs the field shape adjusted).

**What:**

The canonical thesis line + gift/danger one-liner currently fire four and two times respectively in the same report. Establish Executive Read at the top as the canonical home; remove duplicates downstream.

**Specifically:**

1. **Remove Layer 5A summary callout entirely.** The callout block that renders after the Top Gifts and Growth Edges table (`> *You are a long-arc pattern reader...*`) is a verbatim duplicate of Executive Read sentence 3. Delete the rendering of `callouts.summary` at this position. The composer `composeReportCallouts` may keep producing the field for backward compatibility; the render path no longer emits it.

2. **Remove Layer 5B Most Useful Line callout entirely.** The callout block in the Synthesis section that renders the gift/danger one-liner (`> *Your gift is the long read. Your danger is...*`) is a verbatim duplicate of Executive Read sentences 1-2. Delete the rendering of `callouts.mostUsefulLine` at this position. The composer may keep producing the field; the render path no longer emits it.

3. **Remove Synthesis section closing thesis sentence.** The Synthesis section currently closes with the parallel-line tercet AND a thesis sentence ("You are a long-arc pattern reader and builder whose growth edge..."). The thesis sentence is a duplicate of Executive Read sentence 3. Delete the thesis sentence; keep the parallel-line tercet (it's unique content).

4. **Keep Layer 5C Final Line callout.** Different mechanical template ("The work is to..." vs "growth edge is not..."), different position (end of report). Genuinely a closing-of-the-closing distillation, not a duplicate. Stays.

5. **Remove Growth Path section entirely.** The "Growth Path" section duplicates the Path · Gait opening paragraph in compressed form ("Your shape suggests work built around the pattern-reader, with the structurer carrying the follow-through..."). Delete the section. The Path master synthesis restructure (Section F) absorbs Growth Path's job.

6. **Path · Gait opening paragraph stays for now** — it gets restructured in Section F, not here. Section A just removes the downstream Growth Path duplication.

**Render rule:** No new prose generated. Pure deletions + the Synthesis section's closing prose stitches cleanly to whatever follows it (likely the Closing Read section). Verify the section transitions read naturally after the deletions.

**Out of scope for Section A:** the callout COMPOSER outputs (`callouts.summary`, `callouts.mostUsefulLine`) MAY stay as engine fields if any test/admin surface consumes them; only the render-path emission is removed. If the composer can safely stop producing them, fine; if it would break a regression assertion, leave the composer producing them and just don't render.

## Section B — Trust Card Correction-Channel Reframe

**Files modified:** `lib/identityEngine.ts` (Trust card composer; locate via grep on the Trust card's existing prose), `lib/renderMirror.ts` (Trust card markdown), `app/components/ShapeCard.tsx` (Trust card React).

**What:**

Trust currently reads as passive ("whose truth gets weight"). The synthesis architecture reframes Trust as the active anti-Grip card: "what can revise the movement before it hardens." This is a meaningful reframe, not just a Movement Note add.

**New Trust card structure:**

- Question prefix (CC-PROSE-1A canon): **Whose truth gets weight** — preserved
- Read line (existing user-specific cardHeader text): preserved  
- **Strength** prose: existing — preserved
- **Growth Edge** prose: existing — preserved
- **Practice** prose: existing — preserved
- Pattern Note (italic): existing — preserved
- Pattern in motion (when fires): existing — preserved
- **NEW: Correction Channel paragraph** (added between Practice and Pattern Note)

**Correction Channel paragraph composition:**

Composer reads the user's top-trusted institutional sources (existing engine output) and top-trusted relational sources (existing engine output) and classifies them into one of six revision-channel categories:

- **Expert correction** — top trust includes professionals, experts, scholars, or vetted institutional sources
- **Partner correction** — top trust includes spouse / partner / closest relational tie
- **Community correction** — top trust includes broader social, religious, or cultural community
- **Institutional correction** — top trust includes formal institutions (Education, Government, Business, Non-Profits)
- **Evidence correction** — top trust includes own counsel + tested evidence + verifiable sources
- **Spiritual correction** — top trust includes religious authority, faith community, or sacred text

Most users will land in 1-3 categories (mixed correction channels). The composer outputs a paragraph naming which channels are open and which are narrower for the user. Template (illustrative; executor refines):

> **Correction channel.** Trust is not merely who you believe — it is who is allowed to interrupt your movement before it hardens. Your shape's primary correction channels appear to be {top-channel-1} and {top-channel-2 if present}. {Channel-1 description: "Expert correction names whoever has demonstrated competence in the domain at hand"; etc.} The narrower the correction channel, the more critical it becomes that the channels you have stay open.

**Anti-Grip framing:** the composer's prose includes one sentence noting that narrow correction channels increase Grip risk (per Risk Form 2x2 from CC-SYNTHESIS-1A). Do NOT restate the Risk Form letter; reference the concept ("when correction channels narrow, the governor more easily slips toward Grip").

**Render position:** Between the existing Practice line and the Pattern Note (italic) closer.

**Audit:**
- `synth-1f-trust-correction-channel-rendered`: Every fixture's rendered Trust card contains a labeled "Correction channel" paragraph.
- `synth-1f-trust-correction-channel-uses-existing-trust-data`: The paragraph references at least one of the user's existing top-trust sources verbatim (institution or relational source name).

## Section C — Weather Card State-vs-Shape Qualifier

**Files modified:** `lib/identityEngine.ts` (Weather card composer; locate via grep on existing Weather prose), `lib/renderMirror.ts`, `app/components/ShapeCard.tsx`.

**What:**

Weather currently reads as descriptive load + formation context. The synthesis architecture reframes Weather as the qualifier of the Movement read — telling the user whether what they're seeing in their report is shape (durable) or state (current load).

**New Weather card structure:**

- Question prefix: **Current load and formation context** — preserved
- Read line (user-specific cardHeader): preserved
- **Strength** prose: existing — preserved
- **Growth Edge** prose: existing — preserved
- **Practice** prose: existing — preserved
- Pattern Note (italic): existing — preserved
- **NEW: State-vs-Shape qualifier paragraph** (added between Practice and Pattern Note)

**State-vs-Shape qualifier paragraph composition:**

Composer reads the user's `weather.currentLoad` (low / moderate / high) and outputs a qualifier paragraph naming what the load means for reading the rest of the report:

Template per load:
- **Low load:** "Your current load reads as light. The shape this report describes is more likely to be your durable form than a season — the patterns above are most likely the patterns that hold when life isn't pressing. Read with that in mind."
- **Moderate load:** "Your current load reads as moderate — enough to test the shape without overwhelming it. The patterns above are valid reads, but you're seeing them under some pressure; what reads as 'shape' may have a percent of state mixed in. Notice which patterns ease when the load eases — those are most likely durable."
- **High load:** "Your current load reads as high. Read everything above with caution: behaviors that look like personality may be adaptation to current pressure. Recovery and reading are not the same task. Honor what you're carrying first; the durable shape will be more visible when the load eases."

**Render position:** Between Practice and Pattern Note. Similar visual treatment to Trust's Correction channel paragraph (consistent with sister card additions).

**Audit:**
- `synth-1f-weather-qualifier-rendered`: Every fixture's rendered Weather card contains a State-vs-Shape qualifier paragraph.
- `synth-1f-weather-qualifier-matches-load`: The qualifier paragraph's leading phrase ("Your current load reads as light/moderate/high") matches the fixture's `weather.currentLoad` value.

## Section D — Thin-Signal Risk Form Suppression

**Files modified:** `lib/identityEngine.ts` (where Risk Form is computed and attached to output) OR `lib/renderMirror.ts` (where Risk Form line renders).

**What:**

Per CC-SYNTHESIS-1A Report Back: thin-signal / Drift fixtures (where `movementStrength.length === 0`) currently land in Risk Form "Reckless-fearful" because grip=45 alongside synthetic 0/0 movement. Logically consistent with the classifier but semantically wrong — there's no movement for the governor to govern.

**Implementation:**

When `movementStrength.length === 0`, suppress the Risk Form line in the rendered Movement section AND suppress the Fire card Movement Note (Section E) that consumes Risk Form. The classifier still computes the field on the output object (for downstream test/admin compatibility); the renderer just doesn't emit the line.

```ts
// In renderMirror.ts Movement section render:
if (output.movementStrength.length > 0 && output.riskForm) {
  // render Risk Form line and italic prose
}
// else: omit Risk Form line entirely
```

**Audit:**
- `synth-1f-risk-form-suppressed-on-zero-length`: For fixtures with `movementStrength.length === 0`, the rendered Movement section does NOT contain a "Risk Form:" line. For fixtures with length > 0, the Risk Form line renders (CC-SYNTHESIS-1A regression).

## Section E — Movement Notes on 5 Body Cards (Lens / Compass / Conviction / Gravity / Fire)

**Files modified:** `lib/identityEngine.ts` (5 new card-level composer functions), `lib/renderMirror.ts` (5 insertions), `app/components/ShapeCard.tsx` (Movement Note rendering).

**What:**

Each of 5 body cards (Lens, Compass, Conviction, Gravity, Fire) gets a NEW labeled "Movement Note" paragraph that ties the card's content to the synthesis layer's Cost / Coverage / Risk / Goal / Soul / Giving framework. Trust and Weather are already getting reframes in Sections B and C; Path is restructured in Section F. So these 5 are the body-card Movement Note recipients.

**Visual treatment for Movement Note:**

Distinct from Pattern Note and Pattern in motion. Recommended:

- Label prefix: `**Movement Note** —` (bold, em-dash separator)
- Paragraph follows on same line, normal weight (not italic — distinguishes from Pattern in motion which uses italic body)
- Render position: between Pattern in motion (when present) and Pattern Note (italic closer aphorism). Order on a card with all three: Practice → Pattern in motion (when fires) → **Movement Note** → Pattern Note (italic aphorism).

If Pattern in motion doesn't fire on a card, Movement Note still renders. If Pattern Note is the only existing footer, Movement Note renders before it.

**Per-card Movement Note composition:**

#### Lens Movement Note — "Cost as Work shape"

Template: `**Movement Note** — Your Work becomes healthiest when the {function-plain-English-label} is allowed to turn Cost into {function-specific-work-shape}. Under load, this same function may {function-specific-distortion}.`

Per-function work shapes (executor adapts; these are starting points):
- pattern-reader: `long-arc structures and frameworks that organize where things are heading`
- possibility-finder: `option creation, alternative paths, and connection between adjacent ideas`
- present-tense self: `immediate response, concrete action, and reading what's actually here`
- structurer: `systems, order, follow-through, and the architecture that makes plans work`
- coherence-checker: `vetted ideas, clarified claims, and the test for internal fit`
- precedent-checker: `continuity, tested forms, and the inheritance of what has worked`
- inner compass: `authentic conviction made visible, the personal truth-test as a building principle`
- room-reader: `relational presence, consequence-aware action, and care expressed through attentiveness`

Distortion templates:
- pattern-reader: `closing the read too early, certain before evidence is in`
- possibility-finder: `multiplying options past the point where any one can be chosen`
- ... (executor extends per function)

#### Compass Movement Note — "Beloved object names what Goal serves and Soul covers"

Template: `**Movement Note** — Your Goal protects {top-Compass-1}; your Soul covers {top-Compass-1}. Your Giving is {Compass-specific-giving-descriptor}.`

Per-Compass-1 giving descriptors (executor adapts; lift from existing engine vocabulary):
- Knowledge: `building structures that make truth more usable, more humane, and less captive to noise`
- Family: `love that becomes a reliable form others can count on`
- Compassion: `concrete care with enough structure to last beyond the moment`
- Peace: `order rebuilt where order broke, durable conditions for flourishing`
- Faith: `belief made visible through faithful action across time`
- Honor: `integrity given a body, the kept promise as a form of work`
- Freedom: `space made for self and others to become without coercion`
- Justice: `accountable structures that make wrong things right`
- ... (executor extends to cover all Compass values that appear in the cohort's top-Compass-1 slot)

#### Conviction Movement Note — "Speech-risk pattern under cost"

Template based on `convictionPosture` engine output (existing field — locate via grep). The four candidate readouts:

- Truth withheld: `**Movement Note** — Under cost, your conviction tends to soften before it speaks — your shape protects the room more readily than it protects the truth.`
- Truth weaponized: `**Movement Note** — Under cost, your conviction tends to land sharper than the moment asks — accuracy without the relational care that lets it be heard.`
- Truth overpaid: `**Movement Note** — Under cost, your conviction tends to accept too much weight too quickly — the willingness to bear cost outpaces the calibration of whether the cost is needed.`
- Truth matured: `**Movement Note** — Under cost, your conviction tends to hold and stay revisable — clear about what's true, humble about what isn't yet known.`

Composer maps existing `convictionPosture` to one of these four. If posture doesn't map cleanly, executor uses "Truth matured" as the safe default (most common register).

#### Gravity Movement Note — "Burden pattern: what's mine to carry"

Template: `**Movement Note** — Because {top-Gravity-1} and {top-Gravity-2} rank highest in your responsibility weighting, your Giving will likely point toward {Gravity-specific-direction}. The risk is {Gravity-specific-distortion}.`

Per-Gravity-1 directions and distortions:
- Individual: direction = `naming accountability before structure`; distortion = `over-locating agency in the person and missing systemic causes`
- System: direction = `aiming at structural repair`; distortion = `moralizing every gap in the system as if it were intentional`
- Authority: direction = `addressing whoever decided`; distortion = `conflating authority's responsibility with the structure they sit inside`
- Circumstance: direction = `making space for what couldn't be controlled`; distortion = `excusing patterns that genuinely could change`
- Mystery: direction = `holding what cannot be named`; distortion = `using mystery as a way to release responsibility that's actually shared`
- ... (executor extends per Gravity weighting label)

#### Fire Movement Note — "Risk Form's behavior under cost"

Template based on Risk Form letter from CC-SYNTHESIS-1A (orthogonal axes; do NOT restate the letter — name the behavior):

- Wisdom-governed: `**Movement Note** — When cost arrives, your shape tends to weigh and aim. Risk-orientation present, grip moderate. Your Risk reads as governor: the work it does is keep the cost honest without preventing the move.`
- Grip-governed: `**Movement Note** — When cost arrives, your shape tends to lock up before weighing. Risk-orientation present but grip has begun to dominate the governor. The work is to let Risk inform without becoming refusal.`
- Free movement: `**Movement Note** — When cost arrives, your shape tends to respond without much pause. Low risk-orientation, low grip. The motion is unimpeded; the work is to add enough pause that what gets risked is what's actually worth risking.`
- Reckless-fearful: `**Movement Note** — When cost arrives, your shape tends to bear cost without the protection a paused look would give. Low risk-orientation but grip has activated. The work is to let Risk become governor before grip takes its job.`

**Audit assertions for Section E:**

- `synth-1f-lens-movement-note-rendered`: Every fixture's rendered Lens card contains a "Movement Note" labeled paragraph.
- `synth-1f-lens-movement-note-uses-function-label`: The Lens Movement Note contains the user's dominant function plain-English label verbatim.
- `synth-1f-compass-movement-note-rendered`: Every fixture's Compass card contains a Movement Note.
- `synth-1f-compass-movement-note-uses-top-value`: Compass Movement Note contains `topCompass[0]` value name verbatim.
- `synth-1f-conviction-movement-note-rendered`: Every fixture's Conviction card contains a Movement Note matching one of the four canonical readouts.
- `synth-1f-gravity-movement-note-rendered`: Every fixture's Gravity card contains a Movement Note that names `topGravity[0]` verbatim.
- `synth-1f-fire-movement-note-rendered`: Every fixture's Fire card contains a Movement Note matching one of the four Risk Form behavior readouts (skipped only when Section D's thin-signal suppression applies).
- `synth-1f-fire-movement-note-skipped-on-zero-length`: For fixtures with `movementStrength.length === 0`, Fire card Movement Note is suppressed (alongside Section D's Movement-section suppression).
- `synth-1f-movement-notes-no-name-leak`: All 5 body card Movement Notes use second-person voice (no `getUserName(input)` literal name).
- `synth-1f-movement-notes-visual-distinct`: Each Movement Note renders with the `**Movement Note** —` bold prefix + em-dash separator + non-italic body, distinct from Pattern Note (italic) and Pattern in motion (bold prefix + italic body).
- `synth-1f-movement-notes-position`: Movement Notes render BEFORE Pattern Note (italic closer) on every card. If Pattern in motion fires, order is Pattern in motion → Movement Note → Pattern Note.

## Section F — Path Master Synthesis Restructure

**Files modified:** `lib/identityEngine.ts` (new master synthesis composer), `lib/renderMirror.ts` (Path section opening replaced), `app/components/InnerConstitutionPage.tsx` or wherever Path renders.

**What:**

Path · Gait becomes the master synthesis card. The current Path opening paragraph ("Your shape suggests work that lets you exercise...") is a compressed restatement of the Work / Love / Give detailed blocks below it. Replace this opening paragraph with a NEW master synthesis paragraph that weaves Movement Direction + Work Shape + Love Shape + Risk Form + beloved object + next move into one coherent reading.

**KEEP:** Question/Read prefix (CC-PROSE-1A canon); Distribution section + donut (CC-PROSE-1B canon); Work / Love / Give detailed prose blocks (vivid engine canon — "Tuesday afternoon" / "the meal brought, the call returned" must stay verbatim); Practice line (CC-022 canon); Pattern Note italic closer; Pattern in motion when fires.

**REPLACE:** the current "Your shape suggests work that lets you exercise..." multi-paragraph Path opening BEFORE the Distribution section.

**REMOVE:** the entire Growth Path section per Section A (its job is absorbed by this master synthesis paragraph).

**Master synthesis paragraph composition:**

Composer reads:
- `lens_stack.dominant` → Work shape vocabulary (e.g., "long-arc structures" for Ni)
- `topCompass[0]` → beloved object
- `loveMap.matches[0].label` → Love shape vocabulary (e.g., "the Companion")
- `riskForm.letter` → Risk Form behavior phrase (matches Fire Movement Note phrasing)
- `movementQuadrant.label` → trajectory quadrant
- `goalSoulMovement.direction` → bias direction (Goal-leaning / Soul-leaning / balanced)
- Existing engine canonical phrases ("convert structure into mercy", "the early shape of giving" or "Giving is Work that has found its beloved object" per two-tier closing-phrase logic from CC-SYNTHESIS-1A) — preserve verbatim where they fire

**Template (illustrative; executor refines for prose flow):**

> Your movement is {bias direction}: the {Work or Soul} line is strong, and the {complementary} line is {position descriptor}. Your Work shape is {Work-shape-descriptor — derived from Lens dominant}, organized around {topCompass[0]}. Your Love shape is {Love-Map-flavor-label} — {Love-Map-descriptor lifted from existing engine output}. Your Risk Form reads as {Risk-Form-letter behavior — matches Fire Movement Note phrasing without restating the letter directly}. The next movement is not more output. It is to {next-move-descriptor — derived from gap analysis of Goal vs Soul vs Risk Form vs beloved object}. {Closing canonical phrase — "the early shape of giving" or "Giving is Work that has found its beloved object" per CC-SYNTHESIS-1A two-tier closing-phrase logic}.

**Implementation note:** the master synthesis paragraph reuses the existing two-tier closing-phrase from CC-SYNTHESIS-1A. Do NOT reimplement the gate; consume the existing logic. The phrase fires here in addition to the Closing Read section's existing fire — that's two fires of the same phrase, which is acceptable IF this CC-SYNTHESIS-1-FINISH dedup pass (Section A) doesn't already remove one of them. If both fire and feel redundant, executor's call to gate one or the other.

**Render position:** Replace the current Path opening paragraph (between Question/Read prefix and Distribution section). Distribution + Work + Love + Give blocks all stay verbatim AFTER the new master synthesis paragraph. The synthesis paragraph names the integration; the existing blocks paint the texture.

**Audit:**
- `synth-1f-path-master-synthesis-rendered`: Every fixture's rendered Path section contains a master synthesis paragraph BEFORE the Distribution section.
- `synth-1f-path-master-synthesis-references-quadrant`: Master synthesis paragraph contains the four-quadrant label (Drift / Work without Presence / Love without Form / Giving / Presence) OR explicitly references the quadrant content (Goal-leaning / Soul-leaning / balanced + position descriptor).
- `synth-1f-path-master-synthesis-references-compass-1`: Master synthesis paragraph contains `topCompass[0]` verbatim.
- `synth-1f-path-master-synthesis-references-love-flavor`: Master synthesis paragraph contains the `loveMap.matches[0].label` verbatim.
- `synth-1f-path-master-synthesis-second-person`: Master synthesis paragraph uses second-person voice; no name leaks.
- `synth-1f-path-master-synthesis-replaces-old-opening`: The pre-CC "Your shape suggests work that lets you exercise..." opening text does NOT appear in any post-CC fixture's Path section.
- `synth-1f-growth-path-removed`: The "## Growth Path" section header does NOT appear in any post-CC fixture's rendered output.
- `synth-1f-work-love-give-blocks-preserved`: For every fixture, Path section still contains all of the **Work**, **Love**, **Give** detailed prose blocks verbatim (the canonical Tuesday-afternoon / meal-brought / structural-fix prose all preserved).
- `synth-1f-engine-canonical-phrases-preserved`: "convert structure into mercy", "care with a spine", "the early shape of giving", "Your gift is the long read", "let context travel with action", "Giving is Work that has found its beloved object" — all preserved verbatim where they currently fire.

---

## Out of Scope (Do Not)

1. **Do NOT modify any signal pool, intensity math, or composite consumption.** `SIGNAL_OCEAN_TAGS`, `INTENSITY_K`, `computeOceanIntensities`, `computeGoalSoulGive`, `computeMovement`, `computeDriveOutput`, `computeLoveMapOutput` — all untouched.
2. **Do NOT modify CC-PROSE-1 / 1A / 1B canon** beyond the explicit Section A dedup deletions. `composeExecutiveRead`, `SHAPE_CARD_QUESTION`, `MOVEMENT_GRIP_HALO_MAX`, `composeThesisLine`, `composeGiftDangerLine`, `generateSimpleSummary`, "Pattern in motion" label, callout visual treatment, Layer 4 Core Signal Map composer, Layer 6 Top Gifts/Edges table — all untouched. The dedup REMOVES rendered output but doesn't change the composers themselves.
3. **Do NOT modify CC-SYNTHESIS-1A canon.** Risk Form 2x2 classifier, four-quadrant Movement label classifier, two-tier closing-phrase logic, `RISK_FORM_HIGH_BUCKET` / `RISK_FORM_HIGH_GRIP` / `MOVEMENT_QUADRANT_HIGH_THRESHOLD` / `CLOSING_PHRASE_ARRIVED_STRENGTH_FLOOR` constants — all untouched. Section E's Fire Movement Note CONSUMES the Risk Form letter; it does NOT modify the classifier.
4. **Do NOT modify the pattern catalog (CROSS_CARD_PATTERNS).** Section E's Movement Notes are NOT patterns; they are body-card composer additions. Pattern in motion (CC-029 + CC-PROSE-1A canon) and Pattern Note (CC-022 canon) both stay untouched.
5. **Do NOT add LLM calls or API integrations.** All Movement Notes, master synthesis paragraph, Trust correction-channel, Weather state-vs-shape qualifier are mechanical templating from existing engine output.
6. **Do NOT add new questions to the question bank.** Per `feedback_minimal_questions_maximum_output`. All synthesis layer content derives from existing signals.
7. **Do NOT remove the existing Drive distribution prose narrative.** The donut renders alongside the narrative ("Your distribution is unusually balanced..."), not replacing it. CC-PROSE-1B canon.
8. **Do NOT remove or compress** Open Tensions, Conflict Translation, Mirror-Types Seed, "What this is good for", Disposition Signal Mix dashboard, Work Map, Love Map, Movement chart, Drive donut, Closing Read sections. All preserved.
9. **Do NOT remove engine hedging language.** "Appears to" / "may" / "tends to" / "suggests" / "likely" — preserved verbatim. Per `feedback_hedge_density_in_engine_prose`: do NOT add hedges either; current rate is 30-47/fixture.
10. **Do NOT invent new claims.** Movement Notes derive from existing engine output (function label, top Compass, top Gravity, Risk Form letter). Master synthesis paragraph composes existing values. Trust correction channel categories the existing top-trust list. Weather qualifier reads existing currentLoad. No new vocabulary beyond the per-card template strings the prompt provides above.
11. **Do NOT over-rewrite engine canonical phrases.** "convert structure into mercy", "care with a spine", "the early shape of giving", "Your gift is the long read", "let context travel with action", "Giving is Work that has found its beloved object" — all preserved verbatim where they fire.
12. **Do NOT modify the masthead** ("a possibility, not a verdict") or "How to Read This" framing.
13. **Do NOT modify section ordering** beyond Section A's Growth Path deletion and Section F's Path opening replacement.
14. **Do NOT change the SVG color palette** or design system tokens.
15. **Do NOT modify** the question bank (`data/questions.ts`), fixture files, `MEMORY.md`, `AGENTS.md`, `docs/canon/`, or any spec memo. Surface drift in Report Back.
16. **Do NOT install dependencies.**
17. **Do NOT modify band thresholds, calibration constants, or any architectural piece from CC-AS / CC-JX / CC-ES / CODEX-086 / CODEX-087.**
18. **Do NOT touch existing audit assertions** (`prose-1-*`, `prose-1a-*`, `prose-1b-*`, `synth-1a-*`, `jungian-completion-*`, OCEAN, Goal/Soul/Give, etc.). They stay green; CC-SYNTHESIS-1-FINISH adds new `synth-1f-*` assertions in a new file `tests/audit/synthesis1Finish.audit.ts`.
19. **Do NOT modify body card prose** (Strength / Growth Edge / Practice text) on any of the 5 cards getting Movement Notes. Only the new Movement Note paragraph is added; existing prose stays verbatim.
20. **Do NOT modify Trust card or Weather card existing prose.** Only the new Correction Channel paragraph (Trust) and State-vs-Shape qualifier paragraph (Weather) are added; existing Strength / Growth Edge / Practice / Pattern Note all preserved.
21. **Do NOT exceed the 5 named body cards for Movement Notes.** Trust + Weather get reframes (Sections B, C); they do NOT also get Movement Notes. Path is restructured (Section F) and does NOT also get a Movement Note. The 5 Movement Note cards are exactly Lens / Compass / Conviction / Gravity / Fire.

## Acceptance Criteria

1. Section A: Layer 5A summary callout + Layer 5B Most Useful Line callout + Synthesis closing thesis sentence + Growth Path section all REMOVED from rendered output. Layer 5C Final Line callout PRESERVED. Path · Gait opening paragraph stays for Section F to restructure.
2. Section B: Trust card renders Correction Channel paragraph using existing top-trust source data; one of 6 categories named.
3. Section C: Weather card renders State-vs-Shape qualifier paragraph; load-aware (low/moderate/high) prose template.
4. Section D: Risk Form line + Fire Movement Note both suppressed when `movementStrength.length === 0`.
5. Section E: All 5 body cards (Lens, Compass, Conviction, Gravity, Fire) render labeled Movement Note paragraphs with bold-prefix-em-dash visual treatment, second-person voice, function/value-aware content. Position: between Pattern in motion (when fires) and Pattern Note (italic closer).
6. Section F: Path · Gait opening replaced with master synthesis paragraph integrating quadrant + Work shape + Love flavor + Risk Form behavior + beloved object + next move; Work/Love/Give blocks preserved verbatim; canonical phrases preserved.
7. All new `synth-1f-*` audit assertions pass.
8. All existing CC-PROSE-1 / 1A / 1B / SYNTHESIS-1A / JUNGIAN-COMPLETION audit assertions still pass (regression).
9. Existing OCEAN + Goal/Soul/Give audit assertions pass.
10. CC-AS / CC-JX / CC-ES / CODEX-086 / CODEX-087 regression: all assertions still pass.
11. Hedge density delta within ±5 phrases per fixture (no spike from new prose).
12. `npx tsc --noEmit` exits 0.
13. `npm run lint` exits 0.
14. `npx tsx tests/audit/synthesis1Finish.audit.ts` exits 0.
15. `npm run dev` renders correctly on the canonical Jason fixture (manual visual verification of dedup + Movement Notes + Path master synthesis).

## Report Back

1. **Summary** in 6-10 sentences. Confirm all six sections landed cleanly. Name how many fixtures fire each new section's content (e.g., "Movement Notes render on all 20 fixtures' 5 cards = 100 Movement Notes total"). Name the canonical Jason fixture's post-CC report state in 1-2 sentences.
2. **Section A dedup verification** — paste the canonical Jason fixture's rendered Markdown sections for Top Gifts and Growth Edges (no longer has 5A callout), Synthesis (no longer has 5B callout or closing thesis), and Closing Read area (no longer followed by Growth Path). Confirm canonical thesis line + gift/danger one-liner each fire exactly TWICE in the report (Executive Read + Layer 5C Final Line for thesis; Executive Read for gift/danger).
3. **Section B Trust correction-channel samples** — paste the new Correction Channel paragraph for at least 3 fixtures with different top-trust profiles (Jason / one religious-community-leaning / one expert-leaning). Confirm channel categorization is sensible.
4. **Section C Weather qualifier samples** — paste the State-vs-Shape qualifier for at least 2 fixtures (one low-load, one moderate-load). Confirm load-aware prose fires correctly.
5. **Section D thin-signal suppression verification** — list which fixtures have `movementStrength.length === 0`; confirm Risk Form line + Fire Movement Note both suppressed for those fixtures; confirm Risk Form line renders for the rest.
6. **Section E Movement Note samples** — for the canonical Jason fixture, paste all 5 Movement Notes (Lens / Compass / Conviction / Gravity / Fire). Confirm bold-prefix visual treatment, second-person voice, function/value-aware content.
7. **Section F Path master synthesis** — paste the new master synthesis paragraph for at least 3 fixtures (Jason / one Soul-leaning / one balanced). Confirm Work shape + Love flavor + Risk Form behavior + beloved object + next move all integrated into one paragraph; confirm Work/Love/Give detailed blocks below remain verbatim.
8. **Hedge density delta** — pre-CC baseline vs post-CC baseline; confirm within ±5 phrases per fixture.
9. **Audit pass/fail breakdown** — including all new `synth-1f-*` assertions, CC-PROSE / SYNTHESIS-1A / JUNGIAN-COMPLETION regression, OCEAN + Goal/Soul/Give regression, CC-AS / CC-JX / CC-ES / CODEX-086 / CODEX-087 regression.
10. **Engine canonical phrase preservation** — for the canonical Jason fixture, confirm "convert structure into mercy", "care with a spine", "the early shape of giving" or "Giving is Work that has found its beloved object" (whichever fires per CC-SYNTHESIS-1A logic), "Your gift is the long read", "let context travel with action" all render verbatim where they fire pre-CC.
11. **Visual verification notes** — observations from `npm run dev` rendering of the canonical Jason fixture. Movement Note visual distinction from Pattern Note + Pattern in motion confirmed; Path master synthesis paragraph reads cohesively before Distribution section; dedup deletions don't leave awkward transitions in the rendered prose.
12. **Out-of-scope verification** — git status; explicit confirmation that signal pool, intensity math, composite consumption, fixture data, calibration constants, masthead, body card existing prose (Strength / Growth Edge / Practice), CC-PROSE / CC-SYNTHESIS-1A canon, pattern catalog, question bank, and spec memos are all untouched.
13. **Recommendation for what comes after CC-SYNTHESIS-1-FINISH** — the SYNTHESIS-1 sub-track is now complete. Potential next moves to flag if cohort feedback after this lands suggests them:
    - **CC-FIXTURES-SI-TI-FI-FE** — add 4 fixtures for absent dominant functions, unblocks pattern firing-rate audits and reveals shapes the current cohort can't surface
    - **CC-PATTERN-AUXILIARY-EXPANSION** — broaden CC-029 pattern triggers to include auxiliary-position functions (with editorial review of whether the prose still reads true)
    - **CC-SYNTHESIS-2** — cross-card composition layer (Voice four-readout, Work Shape composition, Love Shape composition, Risk Form composition, Giving Path integration as cross-card derivations)
    - **CC-SYNTHESIS-3** — LLM articulation layer for the Path master synthesis paragraph (and possibly cross-card OCEAN/Jungian texture). The marble-statue warmth lift; engine decides, LLM articulates. Specific input: master synthesis JSON; specific output: warm prose preserving structural integrity.
    - **CODEX-PATTERN-FUNCTION-PAIRS** — add patterns triggered by canonical FunctionPairKey combinations (NiFe / SeTe / TiNe / etc.) per the existing FunctionPairKey union
    
    Recommend one as the primary next move based on cohort signal, OR recommend a pause for cohort feedback before queueing further work.
