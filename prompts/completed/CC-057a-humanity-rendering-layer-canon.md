# CC-057a — Humanity Rendering Layer · Architectural Canon (Path C: Engine Substance + LLM Polish)

**Type:** Architectural canon CC. **No code authored. No prose authored. No engine logic touched.** Pure canon-document authoring that locks the responsibility split between the engine and the LLM polish layer, names the testing surface, and enumerates what the LLM polish layer is forbidden from doing. This is the contract CC-057b (implementation) executes against.
**Goal:** Lock the architectural canon for Path C — the hybrid model that closes the marble-statue humanity gap (per `feedback_marble_statue_humanity_gap.md`) by adding a downstream LLM polish stage on top of the engine's structurally-accurate prose. Document what the engine OWNS (substance: signals, registers, derivations, structural reads, anchors), what the LLM polish layer ADDS (texture: warmth, humor, specificity, tonal calibration, family/grief/beauty/absurdity registers), and what the LLM polish layer is forbidden from changing (anchors, derivations, structural assertions, factual claims about the user). Per Jason 2026-04-30: **"Path C. Split 57a and 57b; defer LLM provider. Either GPT-4 or Claude-class. We need to test both manually, and then compare costs etc."**
**Predecessors:** `feedback_marble_statue_humanity_gap.md` (Clarence's post-CC-052 critique — the rewrite track makes reports more accurate but not warmer; humor / family / grief / beauty texture missing), CC-052 / CC-052b (Sentence 2 anchor architecture — the "structural spine" the LLM polish layer composes against), CC-054 (Peace + Faith disambiguation — establishes the cross-signal-interpretation-in-prose pattern; a canonical example of *substance* the LLM polish layer must preserve).
**Successor:** **CC-057b** (implementation). Hard-blocked: CC-057b cannot draft until CC-057a's canon ships, because the implementation must execute against locked architectural responsibility lines.

---

## Why this CC

Per the marble-statue memory: even after the rewrite-track CCs close Rule 2 / Rule 3 / Rule 4 violations from CC-048's audit, the report stays *"structurally accurate but aesthetically thin."* Three architectural paths were considered:

1. **LLM-prose layer** — engine produces structural read; downstream LLM stage takes the read + minimal session metadata and renders warmer prose. (Most production identity instruments converge here.)
2. **Cross-signal interpretation rules** — rules that compose existing signals into warmer prose inside the engine. CC-054 shipped the first instance (Peace + Faith Disambiguation). Stays inside engine architecture; harder to author at scale.
3. **New measurement surface for human-texture inputs** — humor / beauty / grief / etc. **Closed** because it violates the minimal-questions canon.

Path C (chosen 2026-04-30) is the hybrid: **engine ships substance via Path 2 (cross-signal interpretation rules) AND a downstream LLM polish layer adds texture per Path 1**. Engine remains canonically responsible for structural accuracy; LLM polish layer is canonically responsible for texture / warmth / human register that survey-derived signals can't render directly.

The split matters because of risk asymmetry: an LLM polish layer that *adds texture* is recoverable (turn it off, ship the structural prose). An LLM polish layer that *changes derivations* is not recoverable — the user is misread silently. The canon must lock which side of the line the polish layer sits on, and must do it before any code is written.

This CC is canon-only because the architectural decision is the load-bearing artifact. CC-057b's implementation will be small (a polish pass over engine-rendered prose) once CC-057a's contract is clear; without CC-057a's contract, CC-057b risks drift.

---

## Scope

Files modified (canon docs only):

1. **New file `docs/canon/humanity-rendering-layer.md`** — the architectural canon for Path C. Contents fully specified below; ship verbatim.

2. **`docs/canon/result-writing-canon.md`** — append a new top-level section *"§ Humanity Rendering Layer (Path C)"* with a one-paragraph summary and a pointer to `humanity-rendering-layer.md`. Add a clarifying paragraph under the existing § Rule 2 amendment noting that Sentence 2 anchors remain engine-owned regardless of LLM polish layer status.

3. **`docs/audits/report-calibration-audit-2026-04-29.md`** — append a new note section *"Path C resolution"* documenting that the marble-statue gap (acknowledged in CC-048's audit notes) gets resolved via the LLM polish layer per CC-057a + CC-057b, not via further rewrite-track CCs.

4. **`docs/canon/derivation-rules.md`** — append a one-paragraph clarification: *"Derivation runs in the engine, before any LLM polish stage. The polish layer reads the engine's output as input; it does not re-derive, re-rank, or re-route. Any change in derivation requires an engine-layer CC, not a polish-layer prompt edit."*

5. **No code files. No data files. No engine logic. No prose surface edits.** Pure canon-document authoring.

Per the workshop lock 2026-04-30 (**"Path C. Split 57a and 57b; defer LLM provider."**) — the LLM provider choice (GPT-4-class vs Claude-class) is **explicitly deferred to CC-057b**. CC-057a's canon is provider-agnostic. The architecture must hold whether the polish layer is operated by GPT-4-class, Claude-class, or eventually a fine-tuned in-house model.

---

## The locked content — `docs/canon/humanity-rendering-layer.md`

Verbatim. Ship as-is. Do not reorder, paraphrase, or "improve."

```markdown
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
```

---

## The locked addition to `docs/canon/result-writing-canon.md`

Append at the end of the existing canon document, as a new top-level section:

```markdown
## § Humanity Rendering Layer (Path C)

The marble-statue critique surfaced post-CC-052 — *"the report is structurally accurate but missing humor / family attachment / grief / beauty / lived absurdity"* — is resolved architecturally by the Humanity Rendering Layer (Path C), an LLM polish stage that runs downstream of the engine's structural read. The polish layer adds texture; it does not change substance. See `humanity-rendering-layer.md` for the full architectural canon.

The rewrite-track rules (Rule 1-10 above) remain the engine's canonical constraints regardless of polish-layer status. When the polish flag is off, the engine-rendered report ships as-is. When the polish flag is on, the polish layer composes texture on top of engine output without violating any rewrite-track rule.

**Sentence 2 anchors (Rule 2 implementation per CC-052/CC-052b) and the Peace/Faith disambiguation prose (Rule 10/Rule 11 per CC-054) are engine-owned. The polish layer cannot edit them, even when adding sentences before or after them.**
```

---

## The locked addition to `docs/audits/report-calibration-audit-2026-04-29.md`

Append a new section near the audit's "Notes for the rewrite track" area:

```markdown
## Path C resolution (post-audit, 2026-04-30)

Clarence's post-CC-052 review surfaced a humanity-texture gap not directly addressable by the rewrite-track rules: even after Rule 2-10 closure, the report stays structurally accurate but aesthetically thin (missing humor / family attachment / grief / beauty / lived absurdity). The audit acknowledges this gap but does not propose an audit-rule fix because the missing texture isn't a structural-accuracy defect — it's a register the survey doesn't measure by design.

Resolution: **Path C — Humanity Rendering Layer.** A downstream LLM polish stage adds texture on top of engine-rendered prose. The split is canonical (engine owns substance; polish owns texture). See `docs/canon/humanity-rendering-layer.md` (locked via CC-057a) for the architectural canon. Implementation lands in CC-057b.

The rewrite-track rules in this audit remain authoritative for the engine layer. The polish layer composes against them; it does not relax them.
```

---

## The locked addition to `docs/canon/derivation-rules.md`

Append at the end of the existing rules:

```markdown
## Derivation runs before polish

Derivation runs in the engine, before any LLM polish stage. The Humanity Rendering Layer (Path C; see `humanity-rendering-layer.md`) reads the engine's output as input; it does not re-derive, re-rank, or re-route.

Any change in derivation — adding a signal, changing a threshold, retagging an answer, tweaking the gift-category routing — requires an engine-layer CC, not a polish-layer prompt edit. The polish layer is downstream of derivation and architecturally forbidden from editing it.
```

---

## Verification

- `npx tsc --noEmit` clean (no code touched, but run as discipline).
- `npm run lint` passes (no code touched, but run).
- `npm run build` exits 0.
- `git diff --stat` shows changes only in `docs/`.
- `git diff lib/ app/ data/` returns empty.
- `cat docs/canon/humanity-rendering-layer.md` returns the locked content above verbatim.
- The four canon-doc additions land verbatim per the locked content.
- Cross-references in the new canon doc resolve to existing files.

---

## Out of scope

- **Any code authoring.** This CC is canon-only; CC-057b implements.
- **Provider choice.** Deferred to CC-057b explicitly.
- **Polish-layer prompt content.** Drafted in CC-057b against this canon.
- **Engine-layer prose edits.** Rewrite-track CCs handle those; CC-057a does not touch engine prose.
- **MVP product-vision work.** Per `project_mvp_product_vision.md`: post-launch noodling, separate program.
- **Tests.** No tests at this stage — testing surface is *defined* in this canon but *implemented* in CC-057b.
- **Account-holder PDF design.** The canon notes the polish layer is critical for that deliverable, but the PDF rendering pipeline is a separate CC.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

This CC is filed CC- (not CODEX-) per the routing convention because it locks an architectural canon — the canon-doc text is locked, but the architectural framing decision is canonical and editorial-judgment-adjacent. Claude Code is the intended executor.

## Execution Directive

Single pass. Five doc edits (one new file, four append edits to existing files). All content locked verbatim per the prompt. **Do not paraphrase, reorder, or "improve" the locked text.** If the executor encounters a structural reason a locked passage doesn't fit cleanly into an existing doc (e.g., the doc has a different section ordering than expected), surface in Report Back rather than reorganizing on the fly. **Move prompt to `prompts/completed/` when done.**

## Bash Commands Authorized

- `cat docs/canon/result-writing-canon.md`
- `cat docs/canon/derivation-rules.md`
- `cat docs/audits/report-calibration-audit-2026-04-29.md`
- `cat docs/canon/humanity-rendering-layer.md` (after creation, for verification)
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `mv prompts/active/CC-057a-humanity-rendering-layer-canon.md prompts/completed/CC-057a-humanity-rendering-layer-canon.md`
- `git diff --stat`
- `git status`

## Read First (Required)

- `AGENTS.md`.
- `docs/canon/result-writing-canon.md` — full doc; verify the new § fits the existing structure.
- `docs/canon/derivation-rules.md` — full doc; verify the appended paragraph fits.
- `docs/audits/report-calibration-audit-2026-04-29.md` — find the "Notes for the rewrite track" area for the appended section.
- `docs/canon/function-pair-registers.md` — referenced in cross-references.
- `docs/canon/demographic-rules.md` Rule 4 — referenced in the locked canon.
- Memory files (read before drafting; do not modify):
  - `feedback_marble_statue_humanity_gap.md`
  - `project_mvp_product_vision.md`
  - `feedback_peace_and_faith_disambiguation.md` (for the cross-signal-interpretation pattern context)

## Allowed to Modify

- `docs/canon/humanity-rendering-layer.md` (new file; locked content).
- `docs/canon/result-writing-canon.md` (append the new § section verbatim).
- `docs/canon/derivation-rules.md` (append the locked paragraph verbatim).
- `docs/audits/report-calibration-audit-2026-04-29.md` (append the locked Path C resolution section verbatim).
- **No other files. No code. No data. No tests. No engine.**

## Report Back

1. **New file `docs/canon/humanity-rendering-layer.md`** — confirm created with the locked content verbatim. Line count.
2. **`docs/canon/result-writing-canon.md`** — append confirmation; line range of the new § section.
3. **`docs/canon/derivation-rules.md`** — append confirmation; line range of the new paragraph.
4. **`docs/audits/report-calibration-audit-2026-04-29.md`** — append confirmation; line range of the new section.
5. **Verification** — tsc, lint, build all clean. `git diff --stat` shows only docs changes.
6. **Any deviation from locked content** — if a structural reason prevented verbatim placement.
7. **Cross-reference resolution** — confirm all `*.md` references in the new canon doc resolve to existing files.
8. **Prompt move-to-completed confirmation.**

---

## Notes for the executing engineer

- **CC-057a is canon-only.** No code, no engine, no implementation. The implementation lands in CC-057b. Resist any temptation to start prototyping the polish layer in this CC; the architectural lines have to lock first or CC-057b drifts.
- **The locked content in this prompt is the canonical text.** Ship it verbatim. If something reads "off" tonally or structurally, surface in Report Back; do not silently revise.
- **The provider deferral is deliberate.** The user's lock 2026-04-30 was: *"Either GPT-4 or Claude-class. We need to test both manually, and then compare costs etc."* CC-057a's canon must hold under either provider; CC-057b runs the comparison.
- **The architectural split (engine = substance, polish = texture) is the load-bearing decision.** Everything else in CC-057a flows from that split. The "forbidden" list under the contract is the protective rail that keeps the polish layer from silently degrading instrument accuracy.
- **The feature-flag requirement is canonical.** Even if CC-057b ships in production, the flag must be present and the fallback path must work — graceful degradation when the LLM provider is down or returns malformed output.
- **CC-057b cannot draft until CC-057a ships.** The dependency is enforced by file order: CC-057b reads `humanity-rendering-layer.md` as a prerequisite. If `humanity-rendering-layer.md` isn't on disk, CC-057b's executor has no contract to compose against.
- **Per the routing convention** the prompt file moves to `prompts/completed/` when shipped. Explicit reminder.
