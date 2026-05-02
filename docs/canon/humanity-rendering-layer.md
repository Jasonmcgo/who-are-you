# Humanity Rendering Layer (Path C)

*Canon — locked 2026-04-30 via CC-057a. Implementation lands in CC-057b. LLM provider deferred for manual A/B comparison.*

## Why this exists

The engine's prose is structurally accurate — gifts, registers, Compass, OCEAN, Drive, Work Map, Love Map, aux-pair, cross-card patterns all derive cleanly from survey signals. After rewrite-track Rule 2-10 closure, the prose is also user-specifically anchored.

It is not, on its own, warm. The reports read as marble statues — accurate spine, missing the face, hands, scars, laughter. Humor, family attachment, grief, beauty appetite, comic timing, religious complexity, lived absurdity — none of these render directly from survey-derived signals because the survey doesn't measure them by design. (Adding measurement surfaces for them would violate the minimal-questions canon.)

The Humanity Rendering Layer closes that gap by adding a downstream LLM polish stage on top of the engine's structural read. The engine ships substance; the polish layer adds texture. The split is canonical.

## The split — what each layer owns

### Engine owns (substance — locked, polish layer cannot touch)

- **Signal extraction.** From survey answers; demographic-blind in derivation per `demographic-rules.md` Rule 4.
- **Derivation outputs.** Lens stack, Compass top-N, Drive 3C composite, OCEAN distribution, Work Map composite, Love Map register + flavor + Resource Balance case, aux-pair register, gift category routing, cross-card pattern firing.
- **Structural prose anchors.** Sentence 1 generic register-naming text per gift category; Sentence 2 user-specific anchor strings (per CC-052 + CC-052b); cross-signal interpretation prose for Peace + Faith (per CC-054); aux-pair `product_safe_sentence` (per CC-038-prose); Work Map / Love Map register + flavor descriptions; tension definitions and predicates.
- **Factual claims about the user.** "You ranked Peace among your most sacred values"; "Your driver function is Ni"; "Your work-map composite is Long-Arc Architect." These are derivation claims, not prose flourishes — the engine owns them.
- **Composition order.** Mirror → Disposition Map → Map → Work Map → Love Map → Open Tensions → Path → "What this is good for" → footer. The polish layer does not reorder.
- **Section headings.** "Top 3 Gifts," "Compass," "Drive," "Path," etc. The polish layer does not rename.
- **Numbered facts.** Top-3 gifts ordering, Compass top-5 ranking, percentages in the Drive pie chart. The polish layer does not edit numbers.

### Polish layer owns (texture — additive, configurable)

- **Sentence-level warmth.** Replacing register-flat sentences with sentences that carry the user's lived register: humor for high-Ne + freedom_priority + low-W users; tenderness for high-Fe + family_priority + caring-energy users; gravity for high-Si + honor_priority + faith-as-burden users.
- **Human-register additions.** Insertions naming what the survey didn't measure: humor instinct, family attachment in lived form, grief-or-disappointment as part of formation, religious complexity, beauty appetite, comic timing, entrepreneurial pressure, irony.
- **Tonal calibration.** Tightening over-cautious hedging where the engine is confident; softening over-confident assertions where the engine is uncertain; adjusting cadence so the report reads as one voice rather than concatenated paragraphs.
- **Surface polish.** Em-dash / sentence-flow / paragraph-break choices; minor word substitutions that preserve semantic content; pronoun consistency across paragraphs.
- **Texture anchored to engine signals.** When the engine indicates high-Ne + freedom_priority, the polish layer is licensed to render that as playful curiosity / philosophical absurdity. When the engine indicates Fe-keeper + family_priority, the polish layer is licensed to render that as the warmth of family-jokes / Christmas-movies texture. The texture is composed from engine-provided signals; the polish layer is not free-associating.

### Forbidden — neither layer (polish layer most strictly)

- **Changing derivations.** The polish layer cannot promote a gift category that didn't fire, demote one that did, re-rank the Compass, or alter the Drive composite.
- **Adding factual claims.** The polish layer cannot assert facts about the user that the engine didn't derive ("You probably love jazz" — forbidden unless the engine derives it).
- **Removing structural assertions.** If the engine says "Your driver function is Ni," the polish layer cannot soften that to "You may have an Ni-ish quality" — the assertion is engine-owned.
- **Inventing demographic specifics.** The polish layer cannot reference the user's age, family configuration, profession, religion, or other demographic facts beyond what the engine has surfaced via the demographic-blind derivation rules. (Demographics flow into prose only at engine-controlled interpolation sites per `demographic-rules.md` Rule 4.)
- **Reordering or renaming sections.** The composition spine is engine-owned.
- **Changing the locked Sentence 2 anchors from CC-052 / CC-052b** or the Peace/Faith disambiguation prose from CC-054 — these are engine-owned even though they sit at the prose surface.

## Architecture diagram

```
Survey answers
    ↓
[Engine derivation]
    - signals
    - lens stack / aux-pair register
    - Compass / Drive / OCEAN / Work / Love / Patterns / Tensions
    - structural prose composition (Sentence 1 + Sentence 2 anchors;
      Peace/Faith disambiguation; tension descriptions; etc.)
    ↓
EngineRenderedReport (typed; structural; user-anchored)
    ↓
[Humanity Rendering Layer — LLM polish]
    - reads EngineRenderedReport as input
    - reads minimal session metadata (signal-rank summary, top-line registers)
    - applies texture pass per the polish-layer-owned categories above
    - emits PolishedReport
    - guardrails enforce: no derivation changes, no fact additions, no
      section reorder, no numbered-fact edits, no Sentence 2 anchor edits
    ↓
PolishedReport (rendered to user)
```

## The contract

The polish layer's input is `EngineRenderedReport` — the typed structure the engine's composers produce. The polish layer's output is `PolishedReport` — same typed structure, possibly with sentence-level warmth additions and tonal calibration applied within the engine-owned content slots.

**The polish layer is a function** `polish(engineReport, signalSummary, providerConfig) → polishedReport`. It is not an autonomous report author. It is a texture pass.

**Determinism is not required** but **structural identity is.** Two polish runs of the same engine report may produce different prose flourishes; both must preserve the same derivations, the same factual claims, the same section order, the same numbered facts.

**The polish layer is configurable per provider** so CC-057b can run manual A/B tests across GPT-4-class and Claude-class providers, compare cost, and pick the production provider after the comparison. The canon does not commit to a provider.

**The polish layer is feature-flagged.** When the flag is off, the engine-rendered report ships as-is. The user sees no degradation; the polish layer is additive, never substitutive.

## Testing surface

Three test classes are required before CC-057b can ship to production:

1. **Determinism-of-substance test.** Run the polish layer 10 times against the same engine report. Verify across all 10 runs: identical gift-category ordering, identical Compass top-5, identical Drive percentages, identical aux-pair label, identical Sentence 2 anchor strings, identical section order, identical tension predicates fired. Sentence-level prose may vary; substance must not.

2. **Anchor-preservation test.** For a fixture set of engine reports (Jason0429 + a representative panel covering each of the 8 ShapeCard dominants), verify the polish output preserves the locked Sentence 2 anchors from CC-052/CC-052b verbatim. The polish layer is licensed to add sentences before or after the locked anchor; not to edit the anchor itself.

3. **Provider A/B test.** The polish layer runs against the same engine-report fixture set under each provider (GPT-4-class, Claude-class). Cost per polish run is captured. Tonal calibration is judged by Jason + Clarence in a manual review pass (no automated tonal scoring at MVP). The provider decision lands after this pass.

If a polish run fails determinism-of-substance or anchor-preservation, the polish layer falls back to the engine-rendered report for that run (graceful degradation; user always gets a report).

## Operational stance

- **The polish layer is not on the critical path for MVP launch.** Engine-rendered reports ship without polish; users see structurally-accurate prose with the rewrite-track calibrations. The polish layer adds warmth post-launch as the provider/cost decision lands.
- **The polish layer is on the critical path for the account-holder PDF deliverable** (per `project_mvp_product_vision.md` — "custom LLM-rewritten PDF of their report" as account-holder benefit). The marble-statue critique is acceptable for the share-without-account fast read; not acceptable for the curated PDF the user pays for with demographic data.
- **Sequencing:** rewrite-track CCs (CC-055 / CC-056 / CC-059+CC-060 / CC-061 / CC-062) close engine-side calibration gaps first; polish layer (CC-057b) ships after the engine substance is reliably accurate. This avoids the polish layer papering over structural defects.

## What this canon does NOT decide

- **Provider choice.** Deferred to CC-057b after manual A/B testing.
- **Polish-layer prompt content.** Drafted in CC-057b against the contract this canon establishes.
- **Caching strategy.** Whether polish runs are cached per-user or re-run per render is a CC-057b operational decision.
- **Polish-layer model fine-tuning.** Out of scope for both 057a and 057b; future architectural work.

## What this canon DOES decide (the locked invariants)

1. The engine owns substance; the polish layer owns texture.
2. The polish layer cannot change derivations, factual claims, structural assertions, section order, or numbered facts.
3. Sentence 2 anchors from CC-052/CC-052b and Peace/Faith disambiguation prose from CC-054 are engine-owned and polish-layer-immutable.
4. The polish layer is feature-flagged and falls back gracefully when off or when validation fails.
5. The polish layer is provider-agnostic at the canon level; the provider decision lives in CC-057b.
6. The polish layer is post-MVP for the share-without-account fast read, but pre-launch for the account-holder PDF deliverable.

## Cross-references

- `feedback_marble_statue_humanity_gap.md` — the user-facing critique that motivated Path C.
- `project_mvp_product_vision.md` — the post-launch architecture that makes the polish layer load-bearing for the account-holder PDF.
- `result-writing-canon.md` — the prose calibration rules the engine layer enforces; the polish layer composes against this canon.
- `demographic-rules.md` Rule 4 — demographic-blind derivation; the polish layer inherits this constraint.
- `function-pair-registers.md` — aux-pair register canon; the polish layer reads but does not author register labels.
- CC-057b — implementation prompt (drafted after this canon ships).

---

## Implementation status (CC-057b shipped, 2026-05-01)

CC-057b shipped the polish-layer plumbing per the contract above. Status:

- **Both adapters wired.** `lib/humanityRendering/providers/openaiAdapter.ts` and `lib/humanityRendering/providers/anthropicAdapter.ts` both ship as fetch-based HTTP calls (no SDK dependency). Each reads its respective API key from env (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) and falls back to a "no API key" sentinel + engine baseline when unset. Models default to `gpt-4-turbo` and `claude-sonnet-4-6` respectively; both override-able via `POLISH_OPENAI_MODEL` / `POLISH_ANTHROPIC_MODEL` env vars.
- **Polish entry.** `lib/humanityRendering/index.ts` exports `polish(engineReport, config)`. The function orchestrates the provider call, runs the four-check validation pass, and falls back to the engine baseline on any failure (flag off, missing API key, fetch error, malformed response, validation failure).
- **Validation pass.** `lib/humanityRendering/validation.ts` runs the four locked checks: anchor preservation, derivation immutability, structural assertion preservation, numbered-fact preservation. Any drift returns the engine baseline with a logged reason. Conservative-by-design: better to ship the structural-spine prose than a warmer-but-incorrect polished version.
- **A/B harness available.** `/admin/polish-ab/[id]` server-component route loads a saved session, re-derives the constitution, runs both providers in parallel via `runAB`, and renders three columns (engine baseline / GPT-4-class polish / Claude-class polish) with per-run cost lines and a notes textarea for tonal-calibration capture.
- **Feature flag default OFF.** `NEXT_PUBLIC_POLISH_ENABLED` reads at the InnerConstitutionPage; the flag's actual effect on user-facing rendering activates in CC-057c. v1 is plumbing-only at the user-facing surface; the A/B harness bypasses the flag for admin use.
- **Production provider TBD.** Deferred to CC-057c after Jason + Clarence's manual A/B pass. CC-057c will lock the provider, retire the unselected adapter, decide whether to enable the flag for the share-without-account flow at MVP, and remove the A/B harness route.

**CODEX-062 amendment (2026-05-01) — locked-anchor extraction extended before flag flip.** `buildEngineRenderedReport` now carries every currently confirmed engine-emitted locked-prose surface through the validation rail: CC-052/CC-052b gift Sentence 2 anchors, CC-061 growth-edge / blind-spot Sentence 2 anchors, CC-058 uncomfortable-but-true, CC-060+ tension `user_prompt` strings, and `cross_card.mirrorTypesSeed`. Peace/Faith disambiguation remains protected via `lockedDisambiguation`, while `cross_card.growthPath` / `cross_card.conflictTranslation` stay protected via `proseSlots`. This closes the extraction gap surfaced in CC-060's ship report before CC-057c can activate the polish flag.

Cost rate-cards in `providers/defaults.ts` are starting estimates as of CC-057b authoring; refresh against `openai.com/pricing` and `anthropic.com/pricing` before any production decision. The harness displays computed cost prominently so the comparison includes cost-per-polish-run alongside tonal calibration.
