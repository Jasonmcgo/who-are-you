# CC-LAUNCH-VOICE-POLISH-V2

## Objective
Three surgical bugs flagged in the live `the50degreelife.com` Jason-session report after CC-LAUNCH-VOICE-POLISH (Part B) landed. Each is small, deterministic, and visible to any careful reader. Fix them before opening soft-share to professional organizations.

## Sequencing
Independent of any other queued work. Recommended to land + push before soft-share.

## Scope

### Bug 1 — `(formerly X)` strip is too aggressive in Path/Gait
**Symptom:** the engine sentence in Path/Gait's opening reads:

> "Your Risk Form reads as — the governor is doing its work."

The Risk Form label (e.g., "Open-Handed Aim") has been stripped along with the parenthetical. The current user-mode mask is matching too broadly — likely a regex that eats `[Label] (formerly X)` instead of just `(formerly X)`.

**Fix:** tighten the `(formerly X)` strip pattern in `lib/renderMirror.ts` (the user-mode mask) so it ONLY removes the parenthetical plus the immediately-preceding space. The Risk Form name itself stays. Example:

- Before strip: `"Your Risk Form reads as Open-Handed Aim (formerly Wisdom-governed) — the governor..."`
- After strip (target): `"Your Risk Form reads as Open-Handed Aim — the governor..."`

The regex should be something like `\s*\(formerly[^)]*\)` (whitespace + parenthetical only), not anything that consumes the preceding word.

**Audit:** verify across 24 cohort fixtures that:
- Zero occurrences of `(formerly` remain in user-mode rendered output.
- Zero occurrences of `"reads as —"` or `"reads as :"` (i.e., orphaned `as` followed by a dash/colon with no Risk Form label between them) in user-mode rendered output.
- Clinician mode retains the full `Label (formerly X)` form byte-identical to pre-CC.

### Bug 2 — Verb-conjugation bug in name-to-pronoun substitution
**Symptom:** Path/Gait "Pattern in motion" paragraph reads:

> "...is whether your creative output, your protected hours, and your strategic attention are moving toward the future **you says you believes** in — or whether maintenance is consuming the time..."

The engine template originally had third-person interpolation (`${name} says ${name} believes` or equivalent). The CC-LAUNCH-VOICE-POLISH name-to-pronoun mask replaced `${name}` → `you` and `${name}'s` → `your`, but didn't conjugate the third-person-singular verbs. Result: `you says you believes`.

**Fix preferred:** rewrite the engine template in second person directly so no name interpolation is needed. Find the template that produces this sentence — likely in the Path/Gait or 3C's allocation prose module — and rewrite as:

> "...is whether your creative output, your protected hours, and your strategic attention are moving toward the future you say you believe in..."

(Plain second-person, no substitution needed.)

**Fix alternative if the template can't be cleanly second-personed:** add verb-conjugation rules to the user-mode mask. Match patterns like `\byou says\b` → `you say`, `\byou believes\b` → `you believe`, `\byou has\b` → `you have`, etc. Brittle and adds maintenance load; prefer the template rewrite if feasible.

**Audit:** scan user-mode rendered output across 24 cohort fixtures for these patterns. Zero occurrences should exist of:
- `\byou says\b`
- `\byou believes\b`
- `\byou has\b` (vs `you have`)
- `\byou is\b`
- `\byou does\b`
- `\byou makes\b`
- `\byou wants\b`
- `\byou needs\b`
- `\byou knows\b`
- Any other `\byou [verb-s]\b` pattern where the verb has a third-person-singular -s suffix.

(For comparison: `\byou might\b`, `\byou may\b`, `\byou can\b`, `\byou should\b`, `\byou tend to\b` are all fine because those verbs don't take the -s suffix.)

### Bug 3 — Path/Gait LLM rewrite not firing on-screen for the Jason live session
**Symptom:** Jason's live report at `the50degreelife.com` shows engine-fallback Path/Gait prose:

> "Your movement is balanced: the Work line and the Soul line both register, neither dominating the other. Your Work shape is long-arc structures and frameworks that organize where things are heading, organized around Faith. Your Love shape is the Devoted Partner — Love as long-arc commitment to one chosen person; pair-bond continuity; the steady architecture of a shared life. Your Risk Form reads as — the governor is doing its work. The next movement is not more output. It is to keep this shape honest as the seasons turn — what's integrated this month must stay integrated when the load shifts. The early shape of giving."

Earlier renders had textured LLM-rewritten Path/Gait prose ("You see the pattern before the room has finished forming it — that's the gift, and the trap..."). Two-tier diagnosis required:

**Diagnose first:**
1. Does `/api/report-cards` return non-null `path` field for Jason's live session?
2. If yes (LLM call succeeded), the splice in `MapSection.tsx` for Path is failing.
3. If no (LLM call returned null), the on-demand resolver is failing for Path specifically — either cache miss + budget exhausted, or LLM timeout, or composer error.

Run the diagnostic against Jason's live session (the engine body that produced the report he's looking at) and report what `/api/report-cards` returns for the `path` field.

**Then fix based on diagnosis:**
- If splice broken: fix the Path-specific splice logic in `MapSection.tsx` / `ShapeCard.tsx` (the path variant).
- If LLM resolver failing: re-prime the Path cache for Jason's engine body, or extend the budget cap, or fix the composer error.

**Bonus fix — sentence fragment:** the closing line of the engine-fallback Path opening reads "The early shape of giving." as a fragment. Either complete the sentence or remove it from the engine fallback template.

**Audit:** Jason's live session re-render produces a Path/Gait section whose body differs visibly from the engine-fallback prose (verified by signature-paragraph match against the cache OR by absence of the specific fallback phrase "the Work line and the Soul line both register").

## Do not
- Modify the LLM prompts, system messages, or cache keys.
- Bump synthesis3 / gripTaxonomy / proseRewriteLlm / keystoneRewriteLlm cache hashes.
- Add new env vars or dependencies.
- Re-architect the user-mode mask. Surgical fixes only.
- Touch admin paths, clinician-mode rendering, or scripts.
- Change anything outside the three specific bugs.
- Modify other engine prose templates that aren't producing the broken sentences.

## Rules

### 1. Each fix is independently testable
Bug 1, Bug 2, and Bug 3 each have their own audit assertions. Failures must surface clearly per-bug.

### 2. Clinician mode preserved
Bug 1 and Bug 2 fixes affect user mode only. Clinician mode renders the original engine output (with `(formerly X)` and third-person name interpolation intact). Bug 3 is mode-agnostic but the diagnostic-then-fix path should not alter clinician-mode behavior.

### 3. No regression on the seven Part B fixes
The audit suite from CC-LAUNCH-VOICE-POLISH must continue to pass: pronoun-sweep, MBTI line removal, donut hide, masthead-line `<details>`, "In health: In health" dedup, Mirror-Type Seed singular, `(formerly X)` strip — all still verified. This CC adds three new audit assertions on top.

### 4. Re-prime if needed
If Bug 3's diagnosis reveals the Path LLM resolver is hitting cache miss for Jason's engine body, a cohort cache re-prime is acceptable (~$0.10–0.20). Note in the report-back if it was needed.

## Audit gates
- New audit `tests/audit/launchVoicePolishV2.audit.ts`:
  - Bug 1: zero `\(formerly\b` occurrences in user-mode rendered output across all cohort fixtures; zero `reads as —` patterns (orphaned `as` followed by em-dash).
  - Bug 2: zero `\byou (says|believes|has|is|does|makes|wants|needs|knows|wishes|tells|gets|takes|gives|finds|sees|feels)\b` patterns in user-mode rendered output across all cohort fixtures.
  - Bug 3: Jason fixture's Path/Gait body rendered output is distinct from the engine fallback ("the Work line and the Soul line both register" string is absent OR the cache-rewrite signature phrase is present).
- Existing 50+ audits stay green.
- `tsc --noEmit` clean.
- `npm run lint` clean.
- Cost: $0 in audit. ~$0.10–0.20 in production cache re-prime if Bug 3 needs it.

## Deliverables
- Files changed list.
- Bug 1: before/after excerpts of Risk Form sentence in user mode for Jason fixture.
- Bug 2: before/after excerpts of the offending "you says you believes" sentence for Jason fixture; list of all engine templates touched.
- Bug 3: diagnosis report (what `/api/report-cards` returned for `path` before fix; what changed); before/after Path/Gait excerpts for Jason fixture's on-screen render.
- 50+3 audit sweep status.

## Why this CC matters now
Three small bugs, each individually noticeable to careful readers. The "you says you believes" especially is the kind of thing a professional reader will catch within the first scan and form an opinion about. Fixing these three before soft-share keeps the launch credibility intact. Each fix is small; the bundle is small; the audit is straightforward.
