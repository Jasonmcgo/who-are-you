# CC-131 — Cross-section de-repetition: signature-fragment dedup + narrative consolidation + a global differentiation pass

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass.
Do not stop for confirmation between steps. On ambiguity, apply the
canon-faithful interpretation, proceed, and flag it. Permission bypass is
on; the discipline below is scope.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.

## Execution Directive

- One pass, no mid-task confirmation prompts.
- This CC changes **engine prose**, **render gating (two-tier)**, and the
  **LLM rewrite layer**. Engine stays the source of substance — we change
  how findings are *stated* and *which* statements survive into the
  Individual, never the findings or the numbers.
- **Numeric invariant (CC-129 carry-over, non-negotiable):** Goal / Soul /
  Aim / Grip / Lens-stack / OCEAN computations are NOT touched. Prove the
  numeric fields are byte-identical before/after for at least one fixture.
- The clinician (Guide) baseline WILL change where engine prose changes;
  re-snapshot it cold, LAST, and show the diff for review.

## Context

Real user feedback on the latest **Individual** report: "exceptionally
repetitive and parroting the answers from the assessment." Diagnosed three
distinct mechanisms, none of which prior passes cover:

1. **Verbatim signature-fragment reuse across cards.** The same engine
   fragment fires in multiple cards. Examples from a live `jasonType`
   report: *"you tend to detect what doesn't add up before it surfaces
   openly"* and *"the eye for what doesn't add up — catching the mismatch
   before it surfaces in language"* appear in **Top Gifts**, **Trust — Ears**,
   AND **Conviction — Voice**; *"the long-arc read pre-judging — the pattern
   your shape has been reaching for becomes more visible than the patterns
   actually present"* repeats across the same three cards; *"the strategy
   memo nobody asked for"* appears in **Executive Read**, **Hands**, **Lens**,
   and **Work Map** (4×). Root cause is two-fold: (a) the engine seeds the
   same gift/blind-spot fragment string into multiple card bodies, and (b)
   `ARCHETYPE_VOICE.jasonType` in `lib/launchPolishV3Llm.ts` **hard-codes**
   "writing the strategy memo nobody asked for" as imagery, so the LLM is
   *instructed* to reuse it in every V3 section. CC-121 Rule 10 caps signature
   terms **per section** and is structurally blind to cross-section reuse.

2. **Seven top sections re-tell one thesis.** Executive Read → Core Pattern →
   What Others May Experience → When the Load Gets Heavy → A Synthesis →
   Closing Read → Path each independently restate "pattern-reader builds
   structure → holds it too long → show the work / make the beloved object
   visible." The V3 rewrite layer (`lib/launchPolishV3Llm.ts`) rewrites each
   of these **independently and blind to the others** — CC-121 explicitly
   logged this as out of scope ("Cross-section de-duplication … each rewrite
   is per-section and blind to others"). This CC is that deferred work.

3. **Recitation / parroting of the user's own answers.** CC-112/CC-116
   ratified "Interpretation over recitation" and swept several composers, but
   it persists in three sites the sweep didn't reach: **Keystone Reflection**
   (quotes the belief verbatim, then paraphrases it straight back), the
   **disposition signal panel** ("registers as high. The X register is a
   defining strand…" — the same scaffold restated five times, once per
   trait), and **Work Map** (names the category, then restates the category's
   own description verbatim two sentences later).

Owner steer for this CC (already decided): **layered fix** — deterministic
where the repeat is a fixed string (Part A), structural consolidation of the
redundant narrative (Part B), and a constrained global LLM differentiation
pass for what remains (Part C). Consolidation should **cut**, not just
reword — but per the two-tier model (`docs/canon/guide-individual-model.md`),
"cut" means **gate to Guide-only**; nothing is deleted from the Guide.

## Read First (Required)

- `docs/canon/guide-individual-model.md` — the additive contract +
  "length/repetition are Individual defects" principle (the license to cut).
- `docs/canon/result-writing-canon.md` — "Interpretation over recitation"
  (CC-112). Part A.3 enforces this canon at the remaining sites; no new canon.
- `docs/canon/humanity-rendering-layer.md` + `output-engine-rules.md` — the
  engine-derives / polish-only boundary; keep changes on the correct side.
- `lib/identityEngine.ts` — the gift/blind-spot fragment composers that seed
  the same string into multiple cards (grep the quoted strings in Context §1
  to pin the emit sites; line numbers drift). Also the disposition-panel and
  Work-Map composers (Context §3).
- `lib/launchPolishV3Llm.ts` — `ARCHETYPE_VOICE` (the hard-coded signature
  imagery), the per-section `V3_SECTION_TARGETS`, the system prompt Rules
  (esp. §3 canon-line scarcity, §10 signature-term cap, §11 cadence), and the
  `reservedCanonLines` mechanism (the existing cross-section scarcity hook).
- `lib/launchPolishV3LlmServer.ts` + `lib/llmRewritesBundle.ts` — the bundle
  cache architecture (committed cache → session bundle → runtime gate →
  build-script-only LLM call). Part C adds a layer here; it must obey the
  same null-safe, no-render-path-spend contract.
- `lib/renderMirror.ts` + `app/components/InnerConstitutionPage.tsx` — the
  markdown and React renderers. Section gating uses `renderMode === "clinician"`
  (mirror CC-114/115/117/119/120). BOTH must be gated identically.
- `tests/audit/twoTierRenderSurfaceCleanup.audit.ts` — `guide-superset-of-
  individual` (the real guard) + `guide-contains-expected-sections` (the
  structural assertion that replaced the byte-hash in CC-121) +
  `user-mode-cohort-renders-clean`.
- `tests/audit/twoTierBaseline.snapshot.{ts,json}` — re-snapshot cold, LAST.

## Part A — Deterministic de-duplication (engine-side, no LLM)

### A.1 Signature-fragment registry (kill verbatim cross-card reuse)
The gift/blind-spot fragment families (the "for your shape, this expresses as
…" strings, e.g. the discernment "eye for what doesn't add up" fragment and
the "long-arc read pre-judging" fragment) are emitted verbatim into multiple
cards. Introduce a **render-scoped used-fragment registry** so each signature
fragment family lands at its **canonical card only**, and later cards either
(a) draw an alternate phrasing variant from a small per-family pool, or
(b) fall back to a neutral form / back-reference ("the same discernment, here
turned on …"). Requirements:
- Deterministic and pure (no RNG; rotation keyed on a stable per-render
  sequence). Same inputs → same output.
- Assign each fragment family ONE canonical home card (proposal: the
  discernment/"doesn't add up" gift → **Trust — Ears**; the pattern-read gift
  → **Lens — Eyes**; the pre-judging blind-spot → **Lens** growth-edge). The
  other cards that currently re-paste it get the variant or back-reference.
- Provide **2 phrasing variants minimum** per reused family so a second
  legitimate appearance reads as fresh, not as a paste.
- Unit-test the registry: assert no signature fragment string appears more
  than once verbatim across the full set of card bodies for a fixture.

### A.2 Disposition-panel cadence
The signal panel restates one scaffold per trait ("…registers as high. The X
register is a defining strand — …"). Vary the per-trait sentence shape
deterministically (a small rotation of opener forms) so the five entries do
not read as one template stamped five times. No score/threshold change — copy
only.

### A.3 Recitation sweep at the three remaining sites (apply CC-112 canon)
Apply the existing "Interpretation over recitation" canon — do NOT add new
canon — to:
- **Keystone Reflection.** It may quote the belief once (the blockquote
  already does), but the prose must interpret what the wording *does*, not
  paraphrase the sentence back. Strip the restate-the-belief-in-other-words
  beat.
- **Work Map.** Name the category once; do not restate the category's
  description verbatim two sentences later. Keep only the meaning the reader
  can't infer from the label.
- **Disposition panel** (with A.2): replace any "you answered / your
  selections" recitation framing with what the signal *means*.

Part A re-snapshots the clinician baseline (engine prose changed); show the
diff is confined to these sites.

## Part B — Consolidate the redundant narrative (gate to Guide-only)

The seven V3 narrative sections restate one thesis (Context §2). Give each a
**distinct, non-overlapping job** in the Individual and gate the pure
restatements to Guide-only. This revisits CC-120's "spine" decision (CC-120
deliberately kept all seven; this CC narrows them on fresh feedback).

**Editorial proposal (owner may adjust — flag what you change):**
- **Keep in the Individual**, each with one assigned job:
  - *Executive Read* — the verdict (the shape + its one growth edge).
  - *What Others May Experience* — the external/perception read.
  - *When the Load Gets Heavy* — the failure-mode read.
  - *Path — Gait* — the work/love/give direction + the this-week move.
- **Gate to Guide-only** (they restate the above with no new load):
  - *A Synthesis* — restates the cross-card thesis Executive Read already
    lands.
  - *Closing Read* — restates "don't soften the standard, stay rooted."
  - *Core Pattern* — restates Executive Read's "pattern-reader builds
    structure." (If you judge Core Pattern carries a distinct value-at-center
    beat the Executive Read lacks, keep a **single tightened paragraph** in
    the Individual and gate the rest — flag the call.)

Gate in BOTH `renderMirror.ts` and `InnerConstitutionPage.tsx` via
`renderMode === "clinician"`. The Guide must still emit all seven in place;
`guide-superset-of-individual` must hold. Re-snapshot cold, LAST. Report the
Individual word-count before/after per cohort fixture.

## Part C — Global cross-section differentiation pass (LLM)

The sections that remain in the Individual are still rewritten independently
and blind to each other. Add a **final cross-section pass** that runs AFTER
the per-section V3 rewrites and enforces non-repetition across them.

### C.1 Mechanism
- Add a new layer to the bundle (e.g. `crossSectionPolish` in
  `LlmRewritesBundle` + a server composer beside `launchPolishV3LlmServer.ts`)
  that takes the **assembled Individual narrative** (the kept sections, in
  order) and rewrites for cross-section differentiation under a section-purpose
  contract: each section keeps ONLY its assigned job (per Part B), and any
  thesis, image, or sentence-shape already used by an earlier section is
  stripped or replaced in the later one.
- Obey the bundle contract exactly: committed cache → session bundle →
  runtime gate (`LLM_REWRITE_RUNTIME === "on"` + key) → build-script-only
  call. The render path must **fall through to the per-section prose** on a
  bundle miss — no API spend on render. Add the layer to
  `hashEngineForLlmBundle` inputs and `emptyLlmRewritesBundle`.
- Reuse the existing HARD rules (hedge cap, banlist, declaratives, length
  ceilings). Do not relax them.

### C.2 Cross-section signature-image scarcity (fix the `ARCHETYPE_VOICE` root cause)
- `ARCHETYPE_VOICE` hard-codes one image (e.g. "the strategy memo nobody
  asked for") that the LLM then reuses in every section. Either (a) supply the
  rewriter a **rotation** of distinct images per archetype so each section
  draws a different one, or (b) add a HARD rule: any single concrete signature
  image appears **at most once across the full Individual** (extends CC-121
  Rule 10 from per-section to cross-section). Implement via the C.1 pass
  and/or the `reservedCanonLines`-style channel (feed each section the images
  already spent). Prefer the approach that survives caching cleanly — flag
  your choice.

### C.3 Cache runbook
Changing engine prose (Part A) and the V3/cross-section prompts shifts cache
keys → committed rewrites miss → render falls through to engine prose until
regen. Do NOT regen in this CC (needs the API key). State the runbook:
`regen-cache.sh` with the key, then re-measure Individual word-count + grep
the dedup assertions. Note which layers' keys shifted.

## Allowed to Modify (exhaustive)

- Part A: `lib/identityEngine.ts` (fragment registry + disposition cadence +
  Keystone/Work recitation), plus a small new helper module if the registry
  warrants one (e.g. `lib/signatureFragmentRegistry.ts`). `lib/keystoneFallback.ts`
  / `lib/beliefHeuristics.ts` only if the Keystone restate-beat lives there.
- Part B: `lib/renderMirror.ts`, `app/components/InnerConstitutionPage.tsx`.
- Part C: `lib/launchPolishV3Llm.ts`, `lib/launchPolishV3LlmServer.ts`,
  `lib/llmRewritesBundle.ts`, and a new cross-section composer module +
  its cache JSON under `lib/cache/`.
- Tests: `tests/audit/twoTierBaseline.snapshot.json` (cold re-snapshot, show
  diff), `tests/audit/twoTierRenderSurfaceCleanup.audit.ts` (only if the
  expected-section set legitimately changes from Part B), a new audit for the
  Part A dedup assertion, and any audit whose anchor strings break on the
  intentional prose changes (anchor refresh only — flag each).

Nothing else. **No numeric-derivation change** (no Goal/Soul/Aim/Grip/Lens/
OCEAN math). No cache regen. No renderMode renames. No deletion from the Guide.

## Out of Scope

- The cohort cache regeneration (manual follow-up; see C.3).
- Any new finding, score, signal, or derivation change.
- New canon (Part A.3 enforces the canon CC-112 already ratified).
- Email/scheduling, attachments, admin surfaces.

## Bash Commands Authorized

- `npx tsc --noEmit`, `npm run lint`
- the two-tier + relevant audits; the new Part A dedup audit
- `grep` / `rg` / `sed` read-only verification
- a one-off **cold** render (plain `npx tsx`, no API key, no warm cache) of
  2–3 fixtures (incl. the `jasonType` fixture that produced the reported
  output) in BOTH modes to diff before/after + word-count
- a numeric-invariant check: render the chosen fixture before/after and diff
  the Movement/Grip/OCEAN numeric fields (must be byte-identical)

## Acceptance Criteria

1. `npx tsc --noEmit` clean; `npm run lint` clean (pre-existing warnings ok).
2. **Numeric invariant:** Goal/Soul/Aim/Grip/Lens/OCEAN fields byte-identical
   before/after for the `jasonType` fixture (prove it).
3. **Part A:** no signature gift/blind-spot fragment appears more than once
   verbatim across a fixture's card bodies (the reported reuses — "eye for
   what doesn't add up", "long-arc read pre-judging" — appear once); the
   disposition panel's five entries no longer share one scaffold; Keystone
   and Work Map no longer restate the belief / category description. Prove via
   before/after on the `jasonType` fixture; the new dedup audit passes.
4. **Part B:** the Individual no longer contains the gated restatement
   sections (A Synthesis, Closing Read, and Core Pattern per the proposal/your
   flagged adjustment); the **Guide still contains all of them in place**;
   `guide-superset-of-individual` passes; React Individual matches the
   markdown Individual (same sections gated). Individual word-count reduction
   reported per fixture.
5. **Part C:** the cross-section pass is wired into the bundle with the
   render-path-no-spend contract intact (bundle miss → per-section prose, no
   API call on render); "the strategy memo nobody asked for" (and any single
   signature image) appears **at most once** across the Individual.
6. The clinician baseline is re-snapshotted **cold, LAST**; the diff is
   confined to the intended sites (no collateral drift); the two-tier audit
   passes cold AND warm (no flap).
7. No file outside the Allowed-to-Modify list edited; no cache regenerated.

## Report Back

- **Part A:** the registry design (canonical-home assignment + variant pools);
  before/after for each reported reuse on the `jasonType` fixture; the new
  dedup audit + what it asserts.
- **Part B:** which sections were gated + the emit-point line for each
  (markdown + React); any deviation from the editorial proposal (flagged);
  Individual word-count before/after per cohort fixture + average % cut;
  confirmation the Guide is byte-unchanged by the gating (superset holds).
- **Part C:** the cross-section layer's place in the bundle chain; how the
  no-render-spend contract is preserved; the `ARCHETYPE_VOICE` fix (rotation
  vs. scarcity rule) and why; which cache keys shifted.
- **Numeric invariant:** the before/after numeric-field diff (empty).
- The baseline diff scope (only the targeted sites changed).
- Any audit anchor refreshes (flagged).
- **Cache runbook (C.3):** the regen command + post-regen verification steps;
  note that the dedup/length wins fully land only after regen.
- Any ambiguity decision; any site found but left out of scope.
