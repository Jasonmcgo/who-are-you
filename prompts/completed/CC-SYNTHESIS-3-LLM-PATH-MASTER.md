# CC-SYNTHESIS-3 — LLM Articulation Layer (Path Master Synthesis Paragraph Only)

**Origin:** CC-SYNTHESIS-1-FINISH shipped 2026-05-08 with mechanically-composed Path master synthesis paragraphs. Render review surfaced the marble-statue gap with new precision: the Compass Movement Note "Your beloved object is Knowledge held inside Peace, Faith, and Honor. Your Goal expresses Cost in service of it; your Soul covers it as presence" reads engine-written even after CODEX-SYNTHESIS-1F-CLEANUP because it narrates the architecture rather than expressing the insight. Jason wrote a warmer alternative ("Your gift is not knowing. Your gift is making knowledge habitable.") and a full punchy summary that he signed off line-by-line. Then he wrote a full punchy summary for fixture 27 (ENFJ exec coach) demonstrating the same diagnostic travels to a structurally different shape. The diagnostic is now empirically validated across two shapes; CC-SYNTHESIS-3 ships the LLM articulation layer to apply that diagnostic to the Path master synthesis paragraph for the entire 24-fixture cohort.

**Method discipline (FROM the warmth diagnostic, signed off Jason 2026-05-08):**

> *Warm precision with moral nerve.*

Five words. Captures: warmth (not coldness), precision (not vagueness or flattery), moral nerve (not therapeutic mush, not blunt-force advice). This is the master target.

**Scope frame:** ONE high-value paragraph per fixture (Path master synthesis ONLY). Build-time LLM call. Static caching. Falls back to current mechanical composition when LLM output is unavailable. ~8-12 hours executor time. CC-scale because of the LLM-call infrastructure + the editorial judgment in the system prompt + the human review of outputs.

**What stays mechanical (out of scope this CC):**
- All 5 body card Movement Notes (Lens / Compass / Conviction / Gravity / Fire)
- Trust correction-channel paragraph
- Weather state-vs-shape paragraph
- Executive Read at top
- Synthesis section parallel-line tercet
- Body card Strength / Growth Edge / Practice
- Disposition Signal Mix paragraphs
- Closing Read prose

If Path master synthesis lands cleanly, CC-SYNTHESIS-3-EXPANSION can extend the LLM articulation to Movement Notes and other engine-composed paragraphs. This CC tests the architecture on one piece first.

---

## Embedded context (CC executor environments don't see Cowork memory)

### The warmth diagnostic (full)

**Five patterns that make engine prose feel engine-written:**

1. **Architecture narration.** The sentence talks ABOUT the synthesis layer rather than FROM it. ("Your Goal expresses Cost in service of it" is the engine describing its own composition mechanism. Users don't think in those terms.)

2. **Enumeration instead of expression.** "Held inside Peace, Faith, and Honor" reads like a registry. Values listed as labels rather than embedded in living phrasing. The warmer move: implicate values through phrasing, never list them.

3. **Internal vocabulary leaks.** "Cost," "Coverage," "presence" (as a noun the way the architecture uses it) — engine-architecture words, not user-experience words. Banned at output time.

4. **No rhetorical shape.** Stacked labeled clauses with no narrative arc. The warmer move has setup-pivot-resolution: "you are built to do X, but your best work is not X — your best work is Y."

5. **Vivid phrases get buried.** When the engine has a real image (e.g., "less captive to noise"), 30 words of mechanical setup flatten its impact. Compression unlocks the image.

**Five operational disciplines (the LLM must do all five):**

1. **Compress.** ONE paragraph (100-200 words). Not enumeration of 5 architectural inputs; ONE coherent insight that absorbs them.

2. **Hide architecture entirely.** Banned vocabulary list (regex-checked at audit time): "beloved object" (as label), "expresses Cost", "covers it as presence", "Your Goal expresses", "Your Soul covers", "Compass value", "Risk Form" (the label; the letter as a concept is fine), "Coverage as presence", "Cost in service of", "the Cost-side", "the Coverage-side", "the architectural", "the synthesis layer".

3. **Implicate values through phrasing, not enumeration.** If `topCompass = [Knowledge, Peace, Faith, Honor]`, the LLM writes a paragraph where Knowledge is named at most once, Peace/Faith/Honor are named never (their content shows up implicitly through phrasing like "the noise" / "what's been tested" / "what survives examination").

4. **Use rhetorical structure.** Setup-pivot-resolution OR opposing structure ("not X, but Y"; "the gift, and the trap"). At least one explicit pivot phrase ("but" / "the danger is" / "the work is" / "the same instrument" / "the growth is not").

5. **Match register to the shape.** Architectural-intellectual register for Te-aux / Ti-dominant shapes (Jason's "make the beloved unmistakable" / "let context travel with action" register). Warm-relational register for Fe-dominant / Fi-dominant / high-Agreeableness shapes (ENFJ's "let truth pass through your warmth" / "add yourself to the room" register). Steward-precedent register for Si-dominant shapes. Embodied-action register for Se-dominant shapes. Don't write the Jason paragraph for the ENFJ shape; the words will be in the wrong register.

### Canon: prefer canon-compression over compose-new-prose

**Lower editorial risk:** lift engine-canon vivid phrases ("convert structure into mercy" / "the early shape of giving" / "Giving is Work that has found its beloved object" / "make the beloved unmistakable") and compress them harder when possible. The LLM should preserve these phrases verbatim or compress to sharper imperatives, NEVER paraphrase them away.

**Higher editorial risk:** compose new prose where the engine canon is mechanical. This is where the LLM has the most freedom AND the most risk. Most iteration happens here.

The empirical finding (from Jason's editing of Cowork-Claude's drafts): kept-verbatim lines were all canon-compression; heavily-revised lines were all compose-new-prose. Constrain the LLM accordingly: prefer compression; compose only when canon doesn't yield a vivid phrase.

### The deepest move: register-inversion

The strongest rubric moves are register-inversions:

- **Jason canonical:** *"the room you can't be reached in"* — flips "rigidity" into a spatial metaphor that names what it's like for the people excluded.
- **ENFJ exec coach:** *"Your warmth is not the thing to outgrow. The work is to stop disappearing inside it."* — inverts the standard ENFJ advice (be more direct) by naming warmth as fine and disappearance as the problem.

These are the report's highest-impact lines. They name what the engine architecture knows but what most personality instruments don't say out loud. The LLM should produce these where the architectural inputs support the inversion, particularly for shapes where standard personality advice misses the point (Fi/Fe-dominant; Si-dominant; high-Agreeableness; high-Conscientiousness with low Reactivity).

### Empirical rubric example 1 — Jason canonical (signed off line-by-line 2026-05-08)

Architectural inputs:
- Lens: pattern-reader (Ni) supported by structurer (Te)
- Top Compass: Knowledge, Peace, Faith, Honor
- Top Gravity: Individual, Authority
- Movement: Goal 88 / Soul 53; quadrant Giving / Presence; bias Goal-leaning; strength 72.6 long
- Risk Form: Wisdom-governed (low Risk-bucket but moderate grip)
- Love Map: the Companion (steady presence beside)
- Engine canonical phrase fired: "Giving is Work that has found its beloved object"

Rubric output (target):

> *You see the long arc — that's the gift, and the trap. You can finish the read before the evidence finishes arriving.*
>
> *What you protect is Knowledge: not as possession, but as something you make habitable for other people. Your work has form. Structure runs deep, what you build compounds across years, and care travels through what you build, not through what you say. The people close to you can count on you to hold what matters; they may not always know you see them.*
>
> *Your conviction is real and costly. The same conviction can become the room you can't be reached in.*
>
> *The growth move is not more output. It's letting the structure you build become visibly generous — letting presence develop a memory and a future.*
>
> *You are work that has found its beloved object. The next thing is to make the beloved unmistakable.*

165 words. Six paragraphs. Architectural register. Engine canon "make the beloved unmistakable" lifted from "make the beloved object more visible". "the room you can't be reached in" is the register-inversion.

### Empirical rubric example 2 — ENFJ exec coach (Jason wrote it 2026-05-08)

Architectural inputs:
- Lens: room-reader (Fe) supported by pattern-reader (Ni)
- Top Compass: Compassion, Peace, Family
- Top Gravity: Individual, System
- Movement: Goal 48 / Soul 100; quadrant Love without Form; bias Soul-leaning
- Risk Form: Reckless-fearful or Free movement (depending on grip score; either way: not Wisdom-governed)
- Love Map: the Devoted Partner
- Pattern fired: fe_attunement_to_yielded_conviction
- Persona signal: adapts under social pressure (Q-P1 "Stay silent" or "Soften it")

Rubric output (target — Jason wrote this verbatim):

> *You read the room before anyone else has noticed the room has shifted. This is the gift: you sense what is happening between people, where the emotional temperature has changed, and what the moment may require before anyone has said it plainly. But under pressure, the same instrument can turn the wrong way. You may protect the room from discomfort and accidentally withhold the truth that would have served it. The growth is not to become harder. It is to let truth pass through your warmth without being edited into silence. Add yourself to the room you are translating for.*

~115 words. Single paragraph. Warm-relational register. "let truth pass through your warmth without being edited into silence" is the register-inversion (warmth is fine; silencing-via-warmth is the problem). "Add yourself to the room you are translating for" is engine canon compressed to imperative.

**Critical observation:** the ENFJ rubric is shorter than the Jason rubric (115 vs 165 words). Length should match what the shape needs, not target a fixed count. ENFJ relational register lands cleanly in fewer words; Jason architectural register needs the longer arc to do its work. The 100-200 word range is a soft band, not a strict target.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm install @anthropic-ai/sdk` (the only allowed dependency install; needed for the LLM call)
- `npx tsx scripts/buildSynthesis3.ts` (the new build script added by this CC)
- `npx tsx tests/audit/synthesis3.audit.ts`
- `npx tsx tests/audit/proseArchitecture.audit.ts`
- `npx tsx tests/audit/synthesis1a.audit.ts`
- `npx tsx tests/audit/synthesis1Finish.audit.ts`
- `npx tsx tests/audit/jungianCompletion.audit.ts`
- `npx tsx tests/audit/fixturesSiTiFiFe.audit.ts`
- `npm run audit:ocean`
- `npm run audit:goal-soul-give`
- `npm run dev`
- `git status`, `git diff`
- `node`, `npx tsx`
- `cat`, `grep`, `find`

## Read First (Required)

1. `lib/synthesis1Finish.ts` — current mechanical Path master synthesis composer. Locate `composePathMasterSynthesis` (or equivalent function). The LLM articulation layer becomes a new alternative; the mechanical version stays as fallback.
2. `lib/identityEngine.ts` — `buildInnerConstitution` end-to-end; identify where Path master synthesis is computed and attached to output.
3. `lib/types.ts` — `InnerConstitutionOutput` type. Add new optional field `path.masterSynthesisLlm: string | null`.
4. `lib/renderMirror.ts` — markdown render path for the Path master synthesis paragraph. Modify to read from `masterSynthesisLlm` if present; fall back to mechanical otherwise.
5. `app/components/InnerConstitutionPage.tsx` and `app/components/PathExpanded.tsx` — React render paths. Same fallback-aware reading.
6. The 24-fixture cohort under `tests/fixtures/`. Each fixture needs an LLM-articulated paragraph generated and cached.
7. `tests/audit/synthesis1Finish.audit.ts` — existing `synth-1f-path-master-synthesis-*` assertions. CC-SYNTHESIS-3 augments these with `synth-3-llm-*` assertions verifying LLM output quality where present.
8. `package.json` — confirm whether `@anthropic-ai/sdk` is already installed; if not, install it as the SOLE allowed new dependency.

## Allowed to Modify

### Component 1 — Build-time LLM composer

**New file:** `lib/synthesis3Llm.ts`.

**Function signature:**

```ts
export interface PathMasterInputs {
  lensDominant: string;            // plain-English label, e.g., "pattern-reader"
  lensAux: string;                 // e.g., "structurer"
  topCompass: string[];            // e.g., ["Knowledge", "Peace", "Faith", "Honor"]
  topGravity: string[];            // e.g., ["Individual", "Authority"]
  movement: {
    goal: number;                  // 0-100
    soul: number;                  // 0-100
    quadrant: string;              // "Giving / Presence" | "Drift" | "Work without Presence" | "Love without Form"
    biasDirection: string;         // "Goal-leaning" | "Soul-leaning" | "balanced"
    strength: number;              // 0-100
    length: string;                // "long" | "moderate" | "short" | "full"
  };
  riskForm: string | null;         // "Wisdom-governed" | "Grip-governed" | "Free movement" | "Reckless-fearful" | null
  loveMap: string;                 // e.g., "the Companion" | "the Devoted Partner"
  givingDescriptor: string;        // existing engine canonical phrase, e.g., "building structures that make truth more usable, more humane, and less captive to noise"
  engineCanonicalPhrases: string[]; // any phrases relevant to this shape that fire in the engine, e.g., ["Giving is Work that has found its beloved object", "convert structure into mercy"]
  topPatternInMotion: string | null; // the pattern body if any pattern fires on this shape
}

export async function composePathMasterSynthesisLlm(
  inputs: PathMasterInputs
): Promise<string>;
```

**Implementation requirements:**

1. **LLM choice:** Claude Sonnet (default) — balance of cost and quality. Executor may use Opus if Sonnet outputs don't hit rubric. Specify `model: "claude-sonnet-4-5"` (or current latest) in the API call. Never gpt-* or other models.

2. **System prompt:** the system prompt is THE heart of this CC. The full system prompt must include:
   - The "warm precision with moral nerve" target
   - All 5 patterns of engine-prose (banned moves)
   - All 5 operational disciplines (required moves)
   - The banned vocabulary list (regex-able)
   - Both rubric examples (Jason canonical + ENFJ exec coach) verbatim with their architectural inputs
   - The canon-compression-over-compose-new-prose rule
   - The register-inversion encouragement (with both example inversions)
   - Length guidance (100-200 word soft band; ~115 words for relational shapes; ~165 words for architectural shapes; not a strict target)
   - Voice rules (second-person; no name leaks; no future tense; no "users" / "people like you" — only "you")
   - The expected paragraph structure (open with the gift; pivot to the danger / trap; close with the imperative-form growth move and aphoristic close)

3. **User prompt:** structured as the architectural inputs JSON, formatted as:
   ```
   Generate the Path master synthesis paragraph for the following shape:
   
   Lens: {lensDominant} supported by {lensAux}
   Top Compass values (top-1 is primary; others texture but not enumerate): {topCompass.join(", ")}
   Top Gravity (where responsibility lands): {topGravity.join(", ")}
   Movement: Goal {movement.goal} / Soul {movement.soul}; quadrant {movement.quadrant}; bias {movement.biasDirection}; strength {movement.strength} ({movement.length})
   Risk Form: {riskForm}
   Love Map flavor: {loveMap}
   Engine giving descriptor (preserve verbatim if it fires; else compress; never paraphrase away): {givingDescriptor}
   Engine canonical phrases relevant to this shape (preserve verbatim where they fit): {engineCanonicalPhrases.join("; ")}
   Pattern firing for this shape (use as additional texture, do not restate verbatim): {topPatternInMotion}
   
   Produce one paragraph in the Path master synthesis register, following the system prompt's discipline. Output the paragraph only — no preamble, no commentary, no quotation marks.
   ```

4. **API key:** read from environment variable `ANTHROPIC_API_KEY`. If missing, the function returns `null` (graceful fallback so build doesn't crash without API access).

5. **Caching:** the function caches results in a JSON file at `lib/cache/synthesis3-paragraphs.json` keyed by a stable hash of the inputs (e.g., SHA-256 of canonical-stringified inputs). On cache hit: return cached paragraph; do NOT call API. On cache miss: call API; write to cache; return paragraph.

6. **Cache invalidation:** when input changes (e.g., fixture data updated, engine architecture shifted), the input hash changes, cache miss, regenerate. Adding a `--force-regenerate` flag to the build script bypasses cache for all fixtures.

### Component 2 — Build-script integration

**New file:** `scripts/buildSynthesis3.ts`.

This script runs at build time across all 24 fixtures:
1. Loads each fixture
2. Runs `buildInnerConstitution` to get the structural output
3. Extracts the inputs for `PathMasterInputs`
4. Calls `composePathMasterSynthesisLlm` (cache-aware)
5. Writes the output to `lib/cache/synthesis3-paragraphs.json` keyed by fixture identifier (e.g., `"ocean/07-jason-real-session"`)

**Run:** `npx tsx scripts/buildSynthesis3.ts` generates / updates all 24 paragraphs. Optional `--fixture=<path>` flag to regenerate one fixture only. Optional `--force` flag to bypass cache.

### Component 3 — Engine integration

**File modified:** `lib/identityEngine.ts`.

In `buildInnerConstitution`, after the mechanical Path master synthesis is computed, look up the cached LLM paragraph from `lib/cache/synthesis3-paragraphs.json`. If found, attach to `output.path.masterSynthesisLlm`. If not found (cache miss at runtime), leave field as `null` and let renderer fall back to the mechanical version.

The mechanical Path master synthesis stays unchanged; the LLM version is purely ADDITIVE.

### Component 4 — Render integration

**Files modified:** `lib/renderMirror.ts`, `app/components/InnerConstitutionPage.tsx`, `app/components/PathExpanded.tsx`.

In each render path, the Path master synthesis paragraph reads:
```ts
const masterSynthesis = output.path.masterSynthesisLlm ?? output.path.masterSynthesisMechanical;
// render masterSynthesis
```

If `masterSynthesisLlm` is present, render it. If null (cache miss / API unavailable), fall back to the mechanical version. Both renders look identical visually — the LLM version just has different prose content.

### Component 5 — Audit assertions

**New file:** `tests/audit/synthesis3.audit.ts`. Add 9 audit assertions verifying LLM output quality across the 24-fixture cohort.

For each fixture where `masterSynthesisLlm` is present (cached output exists):

- `synth-3-llm-no-architecture-vocab`: Output does NOT contain banned vocabulary (regex check on the banned list).
- `synth-3-llm-rhetorical-structure`: Output contains at least one pivot phrase ("but" / "the danger is" / "the work is" / "the same instrument" / "the growth is not" / "your danger is" / "the next move" / "the next thing" / "the trap").
- `synth-3-llm-canon-phrases-preserved`: For each engine canonical phrase relevant to the fixture (passed as `engineCanonicalPhrases` input), the output contains that phrase verbatim OR a compressed-imperative version of it (heuristic: at least 60% of the canonical phrase's content words appear in the output).
- `synth-3-llm-second-person`: Output contains "You" or "Your" at least 3 times. Output contains zero instances of the user's literal name (per `getUserName(input)`).
- `synth-3-llm-no-third-person`: Output contains zero instances of "this shape is" or "this person" or "they tend to" or other third-person constructions.
- `synth-3-llm-no-invented-claims`: Each substantive claim in the output is derivable from the input JSON. Specifically: the output's named function plain-English label (if present) matches `lensDominant` or `lensAux`. The output's named top-Compass value (if any one is named) matches `topCompass[0]`. No new function labels, value names, or trait labels invented.
- `synth-3-llm-word-count-band`: Output is 80-220 words (soft band; warns at 70-300).
- `synth-3-llm-paragraph-count`: Output is 1-6 paragraphs (no enumerated lists; no markdown headings; no bullets).
- `synth-3-llm-cache-coverage`: At least 20 of 24 fixtures have cached LLM paragraphs (allowing for up to 4 fixtures to legitimately fail cache for thin-signal cases or other pathological inputs the LLM declines to articulate).

### Component 6 — Fallback verification

For each fixture WITHOUT a cached LLM paragraph (cache miss):
- `synth-3-fallback-mechanical-renders`: The render path emits the mechanical Path master synthesis paragraph unchanged.
- `synth-3-fallback-no-runtime-api-call`: The renderer does NOT call the LLM at runtime — only build-time generation, with cache-or-fallback at runtime.

## Out of Scope (Do Not)

1. **Do NOT modify any signal pool, intensity math, or composite consumption.** `SIGNAL_OCEAN_TAGS`, `INTENSITY_K`, `computeOceanIntensities`, `computeGoalSoulGive`, `computeMovement`, `computeDriveOutput`, `computeLoveMapOutput` — all untouched.
2. **Do NOT extend LLM articulation beyond the Path master synthesis paragraph.** Movement Notes (5 cards), Trust correction-channel, Weather state-vs-shape, Executive Read, Synthesis tercet, body card prose — all stay mechanical. CC-SYNTHESIS-3-EXPANSION may extend later if Path master synthesis lands cleanly.
3. **Do NOT modify CC-PROSE / CC-SYNTHESIS-1A / 1F canon.** All composers, classifiers, render-treatment decisions from prior CCs stay verbatim. The LLM ADDS a new field on output; it doesn't replace anything.
4. **Do NOT call the LLM at runtime.** Build-time only. Render path uses cache OR fallback. Per-render API calls are forbidden.
5. **Do NOT remove the engine's hedging language.** "Appears to" / "may" / "tends to" / "suggests" / "likely" — the LLM may use these naturally when the architecture supports them, but should NOT add hedge-density beyond existing baseline. The system prompt should NOT instruct "be hedged"; it should let the LLM hedge organically based on the canonical phrases it lifts.
6. **Do NOT introduce LLM calls anywhere else in the codebase.** Only `lib/synthesis3Llm.ts` calls the API.
7. **Do NOT change the masthead, "How to Read This", section ordering, or any visual treatment.** The LLM paragraph renders in the same position the mechanical paragraph rendered.
8. **Do NOT modify** the question bank (`data/questions.ts`), fixture files, `MEMORY.md`, `AGENTS.md`, `docs/canon/`, or any spec memo. Surface drift in Report Back.
9. **Do NOT install dependencies beyond `@anthropic-ai/sdk`.** That is the only allowed new dependency. No `openai`, no `langchain`, no other LLM-adjacent libraries.
10. **Do NOT modify band thresholds, calibration constants, or any architectural piece from CC-AS / CC-JX / CC-ES / CODEX-086 / CODEX-087.**
11. **Do NOT touch existing audit assertions** (`prose-1-*`, `prose-1a-*`, `prose-1b-*`, `synth-1a-*`, `synth-1f-*`, `cleanup-1f-*`, `jungian-completion-*`, `fixtures-*`, OCEAN, Goal/Soul/Give). They stay green; CC-SYNTHESIS-3 adds new `synth-3-llm-*` assertions in a new file.
12. **Do NOT use models other than Claude.** No GPT-*, Gemini, Llama, etc. The discipline is consistent voice across the cohort, and the rubric examples were generated and signed off in Claude's voice.
13. **Do NOT instruct the LLM to "be more emotional" or "be warmer" generically.** The system prompt's discipline is *warm precision with moral nerve* — precision is equally weighted with warmth. Generic "more emotional" prompts lead to therapeutic mush.
14. **Do NOT include in the system prompt any instruction the LLM might interpret as "rewrite the input prose."** The LLM is COMPOSING from architectural inputs, not rephrasing existing prose. The user prompt provides JSON-style architectural facts; the system prompt provides the discipline; the output is fresh prose at the rubric standard.
15. **Do NOT regenerate fixtures or modify cached LLM outputs in version control without human review.** Each LLM paragraph that gets checked into `lib/cache/synthesis3-paragraphs.json` represents an editorial decision. Regeneration requires a human review step (per Report Back item 5 below).

## Acceptance Criteria

1. New file `lib/synthesis3Llm.ts` ships the `composePathMasterSynthesisLlm` function with the system prompt + user prompt template embedded inline.
2. New file `scripts/buildSynthesis3.ts` runs across all 24 fixtures, generating LLM paragraphs (cache-aware).
3. New file `lib/cache/synthesis3-paragraphs.json` contains LLM paragraphs for at least 20 of 24 fixtures.
4. `lib/types.ts` adds `path.masterSynthesisLlm: string | null`.
5. `lib/identityEngine.ts` attaches the cached LLM paragraph to the output when present.
6. `lib/renderMirror.ts`, `app/components/InnerConstitutionPage.tsx`, `app/components/PathExpanded.tsx` all render `masterSynthesisLlm` when present, fall back to mechanical otherwise.
7. New file `tests/audit/synthesis3.audit.ts` runs 9 assertions across cached LLM outputs; all pass.
8. All existing audit assertions (CC-PROSE / CC-SYNTHESIS-1A / 1F / JUNGIAN / FIXTURES / OCEAN / Goal/Soul/Give / CC-AS / CC-JX / CC-ES / CODEX-086 / CODEX-087) still pass (regression).
9. Hedge density delta within ±5 phrases per fixture (LLM may produce slightly different hedge counts than mechanical version; should not spike).
10. `npx tsc --noEmit` exits 0.
11. `npm run lint` exits 0.
12. `npx tsx tests/audit/synthesis3.audit.ts` exits 0.
13. `npx tsx scripts/buildSynthesis3.ts` runs cleanly with API key set.
14. Renderer falls back to mechanical Path master synthesis when LLM cache is missing OR `masterSynthesisLlm` is null.
15. `git status --short` shows only the new files + the targeted modifications listed in this CC.

## Report Back

1. **Summary** in 6-10 sentences. Confirm LLM articulation layer ships for Path master synthesis paragraph. Name how many of 24 fixtures generated cached LLM paragraphs vs how many fell back. Name LLM model used (Sonnet vs Opus) and reasoning.

2. **Three required human-review render samples — these are the empirical sign-off requirement, not optional:**
   - **Jason canonical (ocean/07)** — paste the LLM-generated Path master synthesis paragraph. Compare against the Jason rubric example in this prompt's embedded context. Sign off line-by-line: which lines match the rubric standard? Which catch? Editorial calls for any catches?
   - **ENFJ exec coach (ocean/27)** — same exercise. Compare against the ENFJ rubric example. Sign off line-by-line.
   - **One structurally different third fixture** — your pick (recommend Si archivist 24 OR Soul-leaning gsg/11 OR balanced gsg/09). Paste the LLM output. Note whether it hits the rubric standard for a register that has no rubric example to compare against (i.e., does the diagnostic travel beyond architect+exec-coach?).

3. **System prompt iteration log** — if the first system prompt didn't produce rubric-quality outputs across the 3 review fixtures, what did you change and why? List the iterations. The system prompt is the most important deliverable of this CC; its evolution matters.

4. **Fallback fixture list** — if any of 24 fixtures fell back to mechanical instead of LLM, list them and why. Some legitimate failures (thin-signal fixtures, ambiguous inputs) are expected; document them.

5. **Cache file review** — confirm `lib/cache/synthesis3-paragraphs.json` is checked into the repo, contains paragraphs for the cohort, and has a clear schema. Sample 3 entries in Report Back.

6. **Audit pass/fail breakdown** — including all 9 new `synth-3-llm-*` assertions, all prior assertion suites' regression status.

7. **Hedge density delta** — pre-CC vs post-CC; LLM may produce different hedge density than mechanical. Confirm within ±5 phrases per fixture.

8. **Cost estimate** — across 24 fixtures with the system prompt size, what's the approximate API cost per full regeneration run? (For build-time budget planning.)

9. **Out-of-scope verification** — git status; confirm signal pool, intensity math, composite consumption, fixture data, calibration constants, masthead, body card prose, hedging language, CC-PROSE / SYNTHESIS-1A / 1F canon, question bank, and spec memos are all untouched. Confirm no LLM calls exist outside `lib/synthesis3Llm.ts`.

10. **Recommendations for CC-SYNTHESIS-3-EXPANSION** — based on Path master synthesis quality, would the same LLM approach extend cleanly to the 5 body card Movement Notes? To Trust correction-channel? To Weather state-vs-shape? Name which surfaces benefit most from the warmth lift and which would require system-prompt iterations specific to that surface. If any fail empirically, name them as "stay mechanical" candidates.

11. **Editorial sign-off invitation** — list 3-5 LLM outputs (across 3 different shapes) that you (the executor) judge as best-of-cohort. List 3-5 that you judge as needing iteration. Jason will review. The cohort-vs-shape variance is the diagnostic test for whether CC-SYNTHESIS-3 is shippable at this iteration or needs another round of system-prompt tuning.
