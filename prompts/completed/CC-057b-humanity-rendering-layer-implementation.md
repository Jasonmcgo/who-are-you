# CC-057b — Humanity Rendering Layer · Implementation (Path C polish layer; provider-deferred GPT-4-class vs Claude-class)

**Type:** Architectural implementation CC. Builds the LLM polish layer per the contract locked in CC-057a (`docs/canon/humanity-rendering-layer.md`). Provider-pluggable: ships with both GPT-4-class and Claude-class adapters wired so Jason + Clarence can run manual A/B testing post-ship and decide the production provider after cost-and-quality comparison.
**Goal:** Stand up the polish layer as a feature-flagged service that reads `EngineRenderedReport` (the typed structure the engine's composers already produce), composes a polish-layer prompt against CC-057a's contract, calls the configured LLM provider, validates the response against the polish-layer guardrails (anchor preservation, derivation immutability, structural identity), and emits a `PolishedReport` for downstream rendering. When the flag is off or validation fails, the engine-rendered report ships unchanged.
**Predecessors:** **CC-057a (HARD BLOCKER).** This CC cannot draft or ship until `docs/canon/humanity-rendering-layer.md` exists with the locked architectural canon. Memory: `feedback_marble_statue_humanity_gap.md`, `project_mvp_product_vision.md`. Engine substance: CC-052/CC-052b (Sentence 2 anchors), CC-054 (Peace + Faith disambiguation), CC-038-prose (aux-pair register `product_safe_sentence`), CC-042 (Work Map), CC-044 (Love Map), CC-037 (OCEAN), CC-026/CC-040 (Drive).
**Successor:** Manual A/B testing pass by Jason + Clarence using both providers, after which a follow-on CC-057c locks the production provider, retires the unselected adapter, and removes the A/B harness.

---

## Why this CC

CC-057a locked the architecture: engine owns substance, polish layer owns texture. CC-057b builds it. The build has three engineering surfaces — the input shape (engine output → typed `EngineRenderedReport`), the polish call (provider-pluggable LLM call with locked system prompt and dynamic per-user prose payload), and the validation pass (anchor preservation, structural identity, graceful fallback).

Provider deferral is by design. Per Jason 2026-04-30: *"Either GPT-4 or Claude-class. We need to test both manually, and then compare costs etc."* The polish layer ships with both adapters; the production-provider decision lands after the manual A/B comparison.

The polish layer is **post-MVP for the share-without-account fast read** (engine-rendered prose ships at MVP without polish) and **pre-launch for the account-holder PDF deliverable** (the marble-statue critique is acceptable for the fast read; not acceptable for the curated PDF the user pays for with demographic data per `project_mvp_product_vision.md`). CC-057b's ship clears the polish layer for use in either path; whether to enable it for the share-without-account flow at MVP is a feature-flag decision.

---

## Scope

Files modified:

1. **New file `lib/humanityRendering/types.ts`** — typed shapes for `EngineRenderedReport` (the input the polish layer reads from the engine; structurally a typed view over `FullSwotOutput` + `InnerConstitution`), `PolishedReport` (the output, same shape with prose-content slots possibly polished), `PolishConfig` (provider, model, temperature, max-tokens, flag-state), `PolishValidationResult` (pass/fail + reason).

2. **New file `lib/humanityRendering/contract.ts`** — extraction of the locked invariants from `docs/canon/humanity-rendering-layer.md` into runtime checks: `extractAnchors(report)`, `extractDerivations(report)`, `extractStructuralAssertions(report)`, `extractNumberedFacts(report)`. These produce diff-able snapshots used by the validation pass.

3. **New file `lib/humanityRendering/prompt.ts`** — the locked system prompt the polish layer sends to the provider. Verbatim content specified below.

4. **New file `lib/humanityRendering/providers/openaiAdapter.ts`** — GPT-4-class adapter (via the OpenAI SDK or fetch). Reads `OPENAI_API_KEY` from env; calls a configurable model (default: `gpt-4-turbo` or successor; fully overridable via `PolishConfig`).

5. **New file `lib/humanityRendering/providers/anthropicAdapter.ts`** — Claude-class adapter (via the Anthropic SDK or fetch). Reads `ANTHROPIC_API_KEY` from env; calls a configurable model (default: `claude-sonnet-4-6` or successor; fully overridable via `PolishConfig`).

6. **New file `lib/humanityRendering/index.ts`** — the public entry: `polish(engineReport, signalSummary, config) → polishedReport | engineReport`. Orchestrates the provider call, runs validation, falls back to `engineReport` on validation failure or flag-off.

7. **New file `lib/humanityRendering/validation.ts`** — `validatePolish(engineReport, candidatePolished) → PolishValidationResult`. Runs the four extract-and-compare checks (anchors, derivations, structural assertions, numbered facts).

8. **New file `lib/humanityRendering/abHarness.ts`** — the A/B testing utility: `runAB(engineReport, signalSummary, configs) → { openai: PolishedReport, anthropic: PolishedReport, costs: { openai: Cost, anthropic: Cost } }`. Used by the admin tooling at `/admin/polish-ab/[id]` for the manual comparison pass.

9. **New page `app/admin/polish-ab/[id]/page.tsx`** — admin route that loads a saved session, runs both providers via `abHarness`, and renders the two polished outputs side-by-side with the engine-rendered baseline at the top. Includes per-run cost display and a "Notes" textarea Jason + Clarence can use during the manual review pass.

10. **Wire flag into `app/components/InnerConstitutionPage.tsx`** — read a feature-flag (default OFF for MVP launch) and, when on, call `polish(engineReport, …)` before rendering each prose surface that the polish layer is licensed to touch. When off (or on validation failure), pass-through engine-rendered prose unchanged.

11. **`lib/types.ts`** — add `EngineRenderedReport` and `PolishedReport` re-exports if the type-system organization in `lib/humanityRendering/types.ts` warrants it; otherwise leave types co-located.

12. **`docs/canon/humanity-rendering-layer.md`** — append a "Implementation status" section noting CC-057b shipped, the two adapters wired, the A/B harness available, and the production provider TBD.

13. **No engine logic edits.** No edits to `lib/identityEngine.ts`, `lib/drive.ts`, `lib/ocean.ts`, `lib/workMap.ts`, `lib/loveMap.ts`, `lib/beliefHeuristics.ts`, `data/questions.ts`, or any rewrite-track prose surface. The polish layer wraps engine output; it does not edit the engine.

14. **No new dependencies beyond the two SDKs.** Add `openai` and `@anthropic-ai/sdk` to `package.json` `dependencies` if not present. Both are commonly-included; check `package.json` first.

---

## The locked content — system prompt for the polish layer

Save verbatim to `lib/humanityRendering/prompt.ts` as the exported `POLISH_SYSTEM_PROMPT`:

```text
You are the Humanity Rendering Layer for an identity-assessment instrument named "Who Are You." Your role is narrow and bounded: you add texture to an engine-rendered report without changing its substance.

The engine ships you a structured, user-anchored report with derivations already complete: gift categories, Compass values, Drive composite, OCEAN distribution, Work Map register, Love Map register and flavor, aux-pair register, cross-card patterns, and tensions. Your job is to add warmth, humor, family attachment, grief texture, beauty appetite, comic timing, religious complexity, and lived absurdity where the engine signals the user has those registers — and to leave the report alone where they don't.

You are forbidden from:

1. Changing any derivation. Do not promote a gift category that didn't fire, demote one that did, re-rank the Compass, or alter the Drive composite. The engine has already decided.
2. Adding factual claims about the user that the engine didn't derive. You do not know what music they like, what their family configuration is, what profession they're in, or what their religion is unless the engine has surfaced that fact. Do not invent specifics.
3. Removing or softening structural assertions. If the engine says "Your driver function is Ni," you do not soften that to "You may have an Ni-ish quality." The assertion is engine-owned.
4. Reordering or renaming sections. The composition spine is engine-owned: Mirror → Disposition Map → Map → Work Map → Love Map → Open Tensions → Path → "What this is good for." Do not reorder. Do not rename headings.
5. Editing numbered facts: top-3 gifts ordering, Compass top-5 ranking, percentages in the Drive pie chart. These are derivation outputs.
6. Editing the locked Sentence 2 anchors after each gift category's first sentence. These are structurally-fragile anchor strings the engine renders verbatim. You may add prose before or after them; you may not edit them.
7. Editing the Peace or Faith disambiguation prose blocks when they appear. These compose cross-signal interpretations and are engine-authored. Same rule: you may add adjacent prose; you may not edit.

You are licensed to:

- Replace register-flat sentences with sentences that carry the user's lived register, when the engine signals the register is present (high-Ne + freedom_priority → playful curiosity; Fe-keeper + family_priority → warmth of family-jokes; Si + honor_priority + faith-as-burden → gravity).
- Insert sentences that name human registers the survey did not measure — humor instinct, family attachment in lived form, grief or disappointment as part of formation, religious complexity, beauty appetite, comic timing, entrepreneurial pressure, irony — when the engine's surfaced signals plausibly support them.
- Tighten over-cautious hedging where the engine is confident; soften over-confident assertions where the engine is uncertain. The signalSummary you receive will tell you which registers are highest-confidence.
- Adjust cadence so the report reads as one voice rather than concatenated paragraphs. Sentence-flow polish, em-dash and paragraph-break choices, minor word substitutions that preserve semantic content, pronoun consistency.

The output you produce must preserve, exactly:

- Every section heading.
- Every numbered fact (top-3 ordering, Compass ranking, Drive percentages, OCEAN bucket labels).
- Every locked Sentence 2 anchor string the engine emitted (you will receive these in the contract object as `lockedAnchors`).
- Every Peace/Faith disambiguation prose block (`lockedDisambiguation`).
- The factual claims about derivation (`derivationClaims`).

If you are uncertain whether a transformation crosses a forbidden line, do not make it. Conservative pass is the canonical fallback; the engine-rendered report is acceptable on its own.

Your output is JSON conforming to the `PolishedReport` schema you will be provided. Do not output anything outside the JSON. Do not narrate your changes. Do not explain.
```

---

## The locked content — A/B harness UI and cost display

The admin page at `/admin/polish-ab/[id]` renders three columns:

- Left: engine-rendered baseline (from `buildInnerConstitution(answers, meta_signals)`).
- Center: GPT-4-class polished output.
- Right: Claude-class polished output.

Below each polished column:
- Cost line: provider, model, prompt tokens, completion tokens, total tokens, USD cost (computed from current rate-card constants — refresh manually).
- Validation status: PASS / FAIL with reason.

Below all three columns:
- Notes textarea (full-width, persistent in `localStorage` keyed by sessionId — note: per Cowork artifact constraints we do NOT use `localStorage` in user-facing artifacts; this is a developer-only admin route, so `localStorage` is acceptable here, but if the executor flags this as a concern, fall back to a server-persisted `polish_ab_notes` table or a no-op disabled textarea with a TODO).

Section heading: *"Polish A/B — judge tonal calibration; substance is locked."*

---

## The locked content — provider config defaults

```ts
// lib/humanityRendering/providers/defaults.ts
export const DEFAULT_OPENAI_CONFIG: PolishConfig = {
  provider: "openai",
  model: "gpt-4-turbo", // override via env POLISH_OPENAI_MODEL
  temperature: 0.4,
  max_tokens: 4096,
  enabled: false, // feature flag default OFF for MVP launch
};

export const DEFAULT_ANTHROPIC_CONFIG: PolishConfig = {
  provider: "anthropic",
  model: "claude-sonnet-4-6", // override via env POLISH_ANTHROPIC_MODEL
  temperature: 0.4,
  max_tokens: 4096,
  enabled: false, // feature flag default OFF for MVP launch
};
```

Both default to `enabled: false`. The MVP launch ships with the polish layer wired but disabled. The A/B harness route runs the polish call regardless of the flag (admin tool; bypasses flag).

---

## The locked content — validation pass

The polish layer's `validatePolish` runs four checks, in order, against the candidate polished output. Any failure → return engine-rendered baseline (graceful fallback).

1. **Anchor preservation.** For each `lockedAnchor` string in the contract object, check the polished output contains the anchor verbatim (case-sensitive, whitespace-tolerant within the anchor only). Fail if any anchor is missing or modified.

2. **Derivation immutability.** Compare `extractDerivations(engineReport)` to `extractDerivations(polishedReport)`. The set of fired gift categories, Compass top-5, Drive percentages, OCEAN bucket labels, Work Map register, Love Map register and flavor, aux-pair `pair_key`, and fired tensions must be identical. Fail on any drift.

3. **Structural assertion preservation.** For each engine-emitted structural assertion (the typed shape includes claim strings like `"driver_function: Ni"`, `"aux_pair: ni-te"`, `"compass_top: [peace, truth, knowledge, honor, mercy]"`), confirm presence in the polished output's claim set. Fail on any drop.

4. **Numbered fact preservation.** Top-3 gift ordering, Compass top-5 ranking sequence, Drive percentage triples, OCEAN bucket label sequence — all must match. Fail on any change.

If validation passes, return polished. If validation fails, log the failure reason and return engine-rendered baseline.

---

## Acceptance

- `npx tsc --noEmit` clean.
- `npm run lint` clean.
- `npm run build` exits 0.
- Both adapters callable: `polish(engineReport, summary, DEFAULT_OPENAI_CONFIG)` and `polish(engineReport, summary, DEFAULT_ANTHROPIC_CONFIG)` each round-trip a real provider call against a fixture engine report and return either a polished report (validation pass) or the engine-rendered baseline (validation fail). Tested manually by the executor against Jason0429.
- The A/B harness page loads at `/admin/polish-ab/[id]` for a saved session and renders three columns with cost lines.
- Feature flag default is OFF; user-facing rendering is unchanged when the flag is off.
- When the flag is ON and validation passes, the polished prose surfaces in the report. When validation fails, the engine-rendered prose ships and a server-side log captures the validation reason.
- All locked Sentence 2 anchors from CC-052/CC-052b survive a polish round-trip on Jason0429.
- All Peace/Faith disambiguation prose from CC-054 survives a polish round-trip on Jason0429.
- Engine derivations (gift ordering, Compass, Drive percentages, OCEAN labels, Work/Love registers, aux-pair label, fired tensions) survive both providers' round-trips identically.
- `git diff --stat lib/identityEngine.ts lib/drive.ts lib/ocean.ts lib/workMap.ts lib/loveMap.ts lib/beliefHeuristics.ts data/questions.ts` returns empty (no engine edits).

---

## Out of scope

- **Picking the production provider.** Deferred until manual A/B testing pass. CC-057c locks the choice and retires the loser.
- **Tonal calibration of the polish prompt itself.** The system prompt locked in this CC is V1; manual review may surface tweaks. Tweaks land in CC-057c or a small follow-on, not in this CC.
- **Caching strategy for polish runs.** Operational decision deferred; first cut runs polish per-render. If cost is prohibitive in production, a follow-on CC adds caching keyed by engine-report hash.
- **Account-holder PDF rendering pipeline.** The polish layer is a load-bearing input, but the PDF generator itself is a separate CC under the MVP product-vision program.
- **Engine-layer changes.** None. If a polish failure surfaces an engine-layer bug (e.g., the engine emits an inconsistent factual claim that the validation pass catches), document in Report Back; do not fix in this CC.
- **Removing the rewrite-track CCs.** The polish layer is additive; it does not relax the engine's calibration discipline. Rewrite-track CCs (CC-055, CC-056, CC-059+CC-060, CC-061, CC-062) ship independently.
- **Polish-layer unit tests.** First cut is manual-validation-only. A follow-on CC adds automated regression tests against a fixture panel once the production provider is locked.
- **Fine-tuning a custom polish model.** Out of scope; future architectural work.
- **MVP product-vision work** (auth/account/PDF/newsletter/share/population) beyond the bare polish-layer plumbing.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

This CC is filed CC- per the routing convention because the work is multi-file architectural with editorial-judgment surfaces (system prompt content, validation thresholds, A/B harness UI). Claude Code is the intended executor.

## Execution Directive

Single pass. **Do not draft this CC until `docs/canon/humanity-rendering-layer.md` exists** — that file is the contract; without it the implementation has nothing to compose against. If `humanity-rendering-layer.md` is absent, **abort the CC and report**: "CC-057a has not shipped; CC-057b is hard-blocked." Do not invent the canon text.

The locked system prompt and locked validation rules ship verbatim. Provider SDK choices (`openai` and `@anthropic-ai/sdk`) are conventional; if the executor finds either SDK already in `package.json`, use the existing version. If neither is present and the workspace is offline, surface in Report Back and ship the adapter scaffolding without the API call (executor decides — defensible if the manual validation can't run).

The A/B harness page is admin-only; do not wire it into any user-facing route. Verify by `grep -rn "polish-ab" app/page.tsx app/components/`.

**Move prompt to `prompts/completed/` when done.**

## Bash Commands Authorized

- `cat docs/canon/humanity-rendering-layer.md` (verify existence; abort if absent)
- `cat package.json | grep -E "openai|anthropic"` (check for existing SDKs)
- `npm install openai @anthropic-ai/sdk --save` (only if missing)
- `grep -rn "EngineRenderedReport\|PolishedReport\|polish-ab" app/ lib/`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` (smoke; kill before exit)
- `mv prompts/active/CC-057b-humanity-rendering-layer-implementation.md prompts/completed/CC-057b-humanity-rendering-layer-implementation.md`
- `git diff --stat`
- `git status`

## Read First (Required)

- `AGENTS.md`.
- **`docs/canon/humanity-rendering-layer.md` (CC-057a) — HARD PREREQUISITE.** Abort if absent.
- `docs/canon/result-writing-canon.md` — the rewrite-track rules the polish layer composes against.
- `docs/canon/output-engine-rules.md` — § "CC-057a — Derivation runs before polish" carries the engine-ownership-of-derivation rule. (Note: an earlier `derivation-rules.md` stub was migrated into this canonical doc post-CC-057a; if you encounter a `derivation-rules.md` redirect, follow it here.)
- `docs/canon/function-pair-registers.md` — `product_safe_sentence` is a locked anchor.
- `lib/types.ts` — `FullSwotOutput`, `InnerConstitution`, `MirrorOutput`, `PathOutput`, all the engine output shapes the polish layer reads.
- `lib/identityEngine.ts` — engine entry; understand `buildInnerConstitution` and the `getGiftSpecificity` selector that produces locked Sentence 2 anchors.
- `lib/loveMap.ts` / `lib/workMap.ts` — Map composers.
- `app/components/InnerConstitutionPage.tsx` — feature-flag wire site.
- `app/admin/sessions/[id]/page.tsx` — pattern for admin re-render route; A/B harness mirrors this.
- `package.json` — verify SDK availability.

**Helpful context (NOT required for execution).** The following memory files are authorship-session context from the Cowork chat that drafted CC-057a/057b. They live in the Cowork session memory directory, which is distinct from Claude Code's per-project memory directory and may not be reachable from CC's vantage point. **The architectural canon is fully self-contained in `humanity-rendering-layer.md`; the implementation can execute without these memory files present.** Read if available; ignore the references if not:

  - `feedback_marble_statue_humanity_gap.md` — the user-facing critique that motivated Path C.
  - `project_mvp_product_vision.md` — the post-launch product architecture context that makes the polish layer load-bearing for the account-holder PDF deliverable.
  - `feedback_peace_and_faith_disambiguation.md` — historical context on the cross-signal-interpretation-in-prose pattern (canonical content lives in `result-writing-canon.md` Rule 10/11 and CC-054's shipped code).

## Allowed to Modify

- New files under `lib/humanityRendering/` (types, contract, prompt, providers, index, validation, abHarness, defaults).
- New file `app/admin/polish-ab/[id]/page.tsx` and any companion components.
- `app/components/InnerConstitutionPage.tsx` — feature-flag wire-in only; pass-through unchanged when flag off.
- `lib/types.ts` — only if a re-export or shared-type addition is necessary.
- `package.json` — only to add `openai` and/or `@anthropic-ai/sdk` if missing.
- `docs/canon/humanity-rendering-layer.md` — append the Implementation status section.
- **No engine logic files** (`lib/identityEngine.ts`, `lib/drive.ts`, `lib/ocean.ts`, `lib/workMap.ts`, `lib/loveMap.ts`, `lib/beliefHeuristics.ts`).
- **No data files** (`data/questions.ts`).
- **No rewrite-track prose surfaces** (any pre-existing prose composer).
- **No tests yet.** Manual validation is the first cut.

## Report Back

1. **Files created and modified** — full list.
2. **System prompt** — confirmation it ships verbatim from this prompt's locked content.
3. **Validation pass** — confirmation the four-check sequence is implemented, with the failure-fallback to engine-rendered baseline.
4. **Provider adapters** — confirmation both `openaiAdapter` and `anthropicAdapter` exist and round-trip a real call against a fixture engine report. Sample output snippets (truncated for length) for each provider against Jason0429.
5. **Cost capture** — confirmation the A/B harness reads token counts from each provider's response and computes USD cost; rate-card constants documented inline.
6. **Feature flag** — confirmation default is OFF; confirmation user-facing rendering is unchanged when off.
7. **Anchor / derivation survival** — confirmation the validation pass catches edits to locked Sentence 2 anchors and Peace/Faith blocks; confirmation a deliberately-malformed polish output triggers fallback.
8. **A/B harness route** — screenshot or markdown excerpt of the three-column layout for Jason0429.
9. **No engine edits** — `git diff lib/identityEngine.ts lib/drive.ts lib/ocean.ts lib/workMap.ts lib/loveMap.ts lib/beliefHeuristics.ts data/questions.ts` returns empty.
10. **Verification results** — tsc, lint, build all clean.
11. **SDK presence** — `openai` and `@anthropic-ai/sdk` versions in `package.json`.
12. **Any deviation** — if a structural surprise required a different shape than the locked design.
13. **Manual A/B comparison instructions for Jason + Clarence** — explicit step-by-step for running both providers on Jason0429 + a small panel of additional saved sessions, capturing tonal-calibration notes in the harness textarea.
14. **Prompt move-to-completed confirmation.**

---

## Notes for the executing engineer

- **CC-057a is the contract.** If it isn't on disk, this CC has no foundation. Abort and report rather than inventing canon.
- **The locked system prompt is the canonical text.** It is the load-bearing protective rail that keeps the polish layer from violating CC-057a's invariants. Ship it verbatim.
- **Both adapters ship.** The point is the manual A/B comparison; do not silently pick a provider or comment one adapter out. The provider deferral is canonical per Jason 2026-04-30.
- **The validation pass is conservative by design.** Any drift fails validation; the user gets engine-rendered prose. Better to ship a structurally-accurate marble statue than a warmer-but-incorrect polished version. The graceful fallback is canonical.
- **The feature flag defaults OFF.** MVP launch ships engine-rendered prose unchanged for the share-without-account flow. The polish layer is built but disabled until Jason's manual A/B pass picks the production provider and a follow-on CC enables.
- **The A/B harness is admin-only.** Do not let the route surface in any user-facing navigation. The route should be reachable only via direct URL like the existing `/admin/sessions/[id]` pattern.
- **Tonal calibration of the system prompt is V1.** Manual review may surface tweaks. Tweaks land in a follow-on; CC-057b's locked content is the V1 floor.
- **No engine edits.** If a polish failure surfaces an engine-layer bug, document in Report Back; do not fix in this CC.
- **Cost rate-cards.** The token rates published by OpenAI and Anthropic change. The harness should compute cost from constants the executor defines inline (with a TODO note to refresh per provider's current pricing). Do not hard-code old rates.
- **Per the routing convention** the prompt file moves to `prompts/completed/` when shipped. Explicit reminder.
- **Sequencing reminder.** After CC-057b ships and Jason + Clarence run the manual A/B pass, a follow-on CC-057c will: (a) lock the production provider; (b) retire the unselected adapter and the A/B harness route; (c) decide whether to enable the feature flag for the share-without-account flow at MVP, or hold the polish layer for the account-holder PDF deliverable only.
