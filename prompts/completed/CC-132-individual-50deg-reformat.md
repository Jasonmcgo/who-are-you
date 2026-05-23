# CC-132 — Reformat the Individual to the "50° Life" outline (Michele spec)

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass.
Do not stop for confirmation between steps. On ambiguity, apply the
canon-faithful interpretation, proceed, and flag it. Permission bypass is
on; the discipline below is scope.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.
**RUNS AFTER CC-131 (already merged).** Start from the current tree, which
already contains CC-131's changes. Reconcile against them:
- **Keep / build on** CC-131 Part A (engine signature-fragment dedup,
  disposition-panel cadence, Keystone/Work recitation sweep) and its
  `ARCHETYPE_VOICE` signature-image scarcity fix. These are engine/LLM-prose
  improvements that flow into the warm rewrites this CC reuses — do NOT revert
  them.
- **Supersede** CC-131 Part B (it gated narrative sections in the Individual
  branch) and the Individual-side of Part C (the cross-section pass over the
  old 7-section Individual narrative). This CC rebuilds the Individual branch
  of `renderMirror.ts` + `InnerConstitutionPage.tsx`, so expect to overwrite
  those Individual-branch edits. CC-131's Guide-side work stays.
- **Invariant:** CC-131 left `guide-superset-of-individual` in force; this CC
  reframes it to topic-coverage (see "Two-tier handling"). This CC owns that
  change — update the audit from the post-131 state.
- **Snapshot/cache:** CC-131 re-snapshotted cold and **deferred its cache
  regen** (its C.3 runbook). Do NOT regen here either. Reuse the current
  (post-131) cache state for the warm rewrites; a SINGLE combined
  `regen-cache.sh` runs after this CC lands (covers both CCs). Re-snapshot
  cold LAST, from the post-131 baseline.
- **Cross-section-polish layer (CC-131 Part C.1):** CC-131 shipped
  `lib/crossSectionPolishLlm.ts` + a render-path second pass keyed on the
  **assembled 7-section Individual narrative**. It is a no-op today (committed
  `cross-section-polish-rewrites.json` is empty `{}`). This CC rebuilds the
  Individual into a different shape, so that layer's assembly input no longer
  matches. Decide explicitly: either (a) re-point the cross-section pass at the
  Guide's narrative (Guide-only), or (b) update its assembly input to the new
  Individual section set, or (c) leave it inert and flag it for a follow-up.
  Do NOT let it silently polish a stale/empty input on the new Individual.
  Whichever you choose, the combined regen must not generate cross-section
  entries against the dead 7-section shape.

## Execution Directive

- One pass, no mid-task confirmation prompts.
- **Render-only.** Engine substance is UNCHANGED: every value in the target
  outline (the four-force reads, trajectory numbers, grip pattern, the eight
  body-card findings, keystone, tensions, next moves, closing) already exists
  in the constitution today. This CC re-presents that substance; it does NOT
  recompute, re-score, or re-derive anything. Goal/Soul/Aim/Grip/Lens/OCEAN
  math is untouched — prove the numeric fields are byte-identical before/after.
- The redesign is the **Individual** (`renderMode !== "clinician"`). The
  **Guide** (`renderMode === "clinician"`) keeps today's comprehensive format
  (and gets CC-131's cleanup). See "Two-tier handling" below.

## Context

The Individual report is the dense, repetitive markdown wall users have
complained about (Core Signal Map tables, OCEAN disposition SVG panel, Work
Map, Love Map, eight Strength/Growth/Practice card expansions, multiple
near-duplicate narrative sections). The product brand is **"The 50° Life"**
built on the four forces (Goal / Soul / Aim / Grip) — see
`docs/canon/brochure-and-examples.md` and `docs/canon/product-thesis.md`. The
landing page already brands around "Four Forces / 8 Body Cards"; the report
is behind that public framing.

The attached **Michele — Inner Constitution** PDF is the **authoritative
target outline** for the redesigned Individual: an 11-section, lean,
reader-first report. A plain-text rendering of it is reproduced in the
"Authoritative outline" section below — build the Individual to match that
structure and register. (The PDF is paginated; this CC targets the
**web/markdown render only** — no PDF engine. Page breaks/footers are a later
concern.)

## Voice decision (RESOLVED — second person, reuse)

The Michele spec is third person, name-led ("Michele's gift is…"); the current
Individual is second person ("You may look like…"). **Owner decision: keep the
Individual in second person ("you…").** The new Individual matches Michele's
*structure and register* but NOT its pronoun. Rationale is cost: the warm
prose is already generated in second person for the Guide, so reusing it costs
nothing, whereas third person would force a regen (see Render approach). Do NOT
flip voice or add a voice switch. The Guide stays as-is.

## Render approach (important — warm reuse, ~$0, no regen)

The new Individual **reuses the existing warm LLM rewrites** for its
prose-heavy sections — it does NOT re-render them deterministically and does
NOT trigger any new generation. The seven V3 sections (Executive Read, Core
Pattern, Path triptych, Closing, etc.) plus the prose-card / keystone rewrites
are **already generated and cached for the Guide today**; the current
Individual already reuses a subset of them. This CC re-places those
already-cached rewrites into the Michele outline.

**Cost-critical constraint:** the warm rewrites are cached by key
(`v3RewriteHash` etc. = archetype + sectionId + `engineSectionBody` + reserved
canon lines). To keep cost at ~$0, the reformat must feed the **same
`engineSectionBody` to the same `sectionId`** so the existing cache keys still
hit. Re-place the rewritten OUTPUT into the new layout; do NOT re-slice or
re-compose the section bodies in a way that changes the cache key (that would
cause misses → regen). If a section's input genuinely must change, flag it and
quantify the regen rather than silently invalidating the cache.

Map of warm reuse → outline:
- Cover gift/danger + reframe ← `executiveRead` rewrite (trim to the cover blurb).
- §4 {Name}'s Pattern ← `corePattern` rewrite.
- §6 Work/Love/Giving ← `pathTriptych` rewrite (the three beats; drop the
  4th "This week" paragraph or fold it into §9).
- §8 Keystone ← the keystone rewrite. §10 Closing ← `closingRead` (+ the
  `synthesis` rewrite folded in).

**Deterministic (no LLM)** for the new scaffolds only: the four-forces table,
the trajectory numbers/panel, the GRIP SAYS/AIM SAYS rows, and the eight
one-line **Body Cards** (condensed from each card's existing — already warm
where applicable — lede sentence). These are tables/numbers/one-liners where
warmth adds nothing and a live call is unwarranted.

## Authoritative outline (build the Individual to this — 11 sections)

For each section: **[format]** then **[data source — existing engine field]**.

1. **Cover.** Masthead "The Inner Constitution / *a possibility, not a
   verdict*"; "FOR {name}"; the **display archetype label** (e.g. "The
   Possibility-Driven Caregiver"); a 3–4 sentence **gift / danger** paragraph
   ("{Name}'s gift is X. … Her danger is not Y — it is Z."); then a
   **surface-label reframe** ("The surface label is {MBTI}, but the label is
   not the point. The useful read: {name} moves through life as a …").
   *Source:* archetype display name + surface (MBTI) label (verify the fields;
   grep found them in `identityEngine.ts`/`profileArchetype.ts`); the
   gift/danger + reframe are today's Executive Read opener content, trimmed.
2. **How to Read This Report.** A 3-column table: **FORCE | WHAT IT MEANS |
   {NAME}'S READ**, one row each for Goal, Soul, Aim, Grip.
   *Source:* the "WHAT IT MEANS" column is **fixed canon copy** — lift from
   `docs/canon/brochure-and-examples.md` (the four-forces definitions), do NOT
   re-invent. The "{NAME}'S READ" cell is a one-line derivation per force from
   the Movement numbers + grip pattern (e.g. Goal "Strong.", Soul "Stronger
   still.", Aim "The growth edge.", Grip "{GripPattern}: {one-line}").
3. **{Name}'s Trajectory.** The numeric panel (Goal, Soul, Direction, Aim,
   Grip (stakes), Usable, Potential + drag%) + the trajectory chart SVG + a
   2–3 sentence plain-English read + one closing aphorism line.
   *Source:* the existing Movement section + `trajectoryChart.ts`. Re-lay-out
   only; same numbers, same chart.
4. **{Name}'s Pattern** and **{Name}'s Grip** (one page/section pair).
   Pattern: quadrant read ("closest to {Quadrant}"), health-vs-pressure
   sentence, growth-path sentence. Grip: the primal question (blockquote) +
   a **GRIP SAYS | AIM SAYS** 2-column table (2–3 rows).
   *Source:* current "Your Core Pattern", "Your Grip", and the "From Grip to
   Aim" content (incl. follow-up-derived rows from CC-129 when present) — the
   table is a re-presentation of the grip→aim pairs.
5. **Why This Is Happening — The Body Cards.** Eight cards, each rendered as:
   `0N · {CARD} · {BODY PART}` + ONE question + ONE short answer (1–2
   sentences). Cards in order: Lens·Eyes, Compass·Heart, Hands·Work,
   Voice·Conviction, Gravity·Spine, Trust·Ears, Weather·Nervous System,
   Fire·Immune Response.
   *Source:* the existing eight Mirror cards. **Collapse** each card to its
   question + a one-sentence answer drawn from the card's current lede /
   Strength sentence. The Strength / Growth Edge / Practice / Movement-Note
   expansions are DROPPED from the Individual (retained in the Guide).
6. **Work, Love, and Giving.** Three short paragraphs (~80–110 words each),
   headed **Work.** / **Love.** / **Giving.**
   *Source:* the Path triptych content, trimmed to the Michele register. (No
   "Distribution %" block in the Individual.)
7. **Open Tensions Worth Watching.** Named tensions, ~2–3 sentences each,
   ALL-CAPS tension titles (e.g. "CREATOR VS. MAINTAINER").
   *Source:* current Open Tensions section, trimmed; drop the "Does this feel
   accurate?" prompts (or keep one closing line — flag the call).
8. **Keystone Reflection.** The belief (blockquote) + a structural read
   (2 short paragraphs) + a growth-question line.
   *Source:* current Keystone Reflection. Apply interpretation-over-recitation
   (do not paraphrase the belief back; this aligns with CC-112 canon).
9. **Your Next Three Moves — From Grip to Aim.** Three numbered moves, each:
   a titled headline (e.g. "1. Purpose — finish one living thing.") + 2–3
   sentences + a bold **Practice.** line.
   *Source:* current "Your Next 3 Moves" + the grip→aim aim move.
10. **Closing Read.** 2 short paragraphs + the parallel-line close ("To keep X
    without Y. / To keep …").
    *Source:* current Closing Read + the Synthesis tercet (the Synthesis
    section is FOLDED IN here, not rendered separately).
11. **Footer line.** "THE MODEL PROPOSES — {NAME} CONFIRMS · GENERATED
    {date}".

**Dropped from the Individual (retained in the Guide):** Core Signal Map
table, Top Gifts & Growth Edges table, "What Others May Experience", "When the
Load Gets Heavy", Blind Spots, "How Your Disposition Reads" (OCEAN panel +
SVG), Work Map, Love Map, the standalone "A Synthesis" section, the per-card
Strength/Growth/Practice/Movement-Note expansions, the Path "Distribution"
percentages, the "How Your Disposition Reads" details block.

## Two-tier handling (the invariant needs a rethink — do not skip)

Today `guide-superset-of-individual` asserts the Individual's text is a
literal subset of the Guide's. After this redesign the Individual gains NEW
presentational structures (the four-forces table, the GRIP SAYS/AIM SAYS
table, the one-line Body Cards) that are NOT byte-present in the Guide, and
re-places reused prose into a different layout, so the literal-subset audit
will break by design even though the warm prose itself is shared.

Reframe the invariant as **finding coverage, not byte-subset**: every
*topic/finding* surfaced in the Individual (each of the eight body-card
registers, the four forces, keystone, tensions, next moves, closing) is also
covered in the Guide. Update `tests/audit/twoTierRenderSurfaceCleanup.audit.ts`
accordingly (a section/topic-coverage assertion), keep
`guide-contains-expected-sections` and `user-mode-cohort-renders-clean`, and
flag the change for owner review. If a clean coverage check isn't feasible in
one pass, gate the redesign behind a flag and flag the blocker — do NOT delete
the guard silently.

## Read First (Required)

- The Michele spec above (authoritative outline) + `docs/canon/
  brochure-and-examples.md` (four-forces "WHAT IT MEANS" canon copy + the
  Body Cards framing) + `docs/canon/product-thesis.md`.
- `docs/canon/guide-individual-model.md` — the additive contract; the
  Individual is the lean read, the Guide is the superset.
- `lib/renderMirror.ts` — every current Individual section emit point; this is
  where the new outline is assembled for the markdown render.
- `app/components/InnerConstitutionPage.tsx` — the React render; rebuild the
  same outline so on-screen matches markdown.
- `lib/trajectoryChart.ts` + the Movement composer — reused as-is in §3.
- `lib/profileArchetype.ts` / `lib/identityEngine.ts` — the archetype display
  label + surface (MBTI) label for the cover; the eight card ledes for the
  Body Cards; the grip→aim pairs.
- `lib/followUpNarrative.ts` (CC-129) — the grip→aim follow-up rows feed §4's
  GRIP SAYS/AIM SAYS table when present.
- `tests/audit/twoTierRenderSurfaceCleanup.audit.ts` + `twoTierBaseline.snapshot.*`.

## Tasks

1. Build the 11-section Individual outline in `renderMirror.ts` for
   `renderMode !== "clinician"`, in second person. Re-place the existing warm
   rewrites into the prose-heavy sections per the reuse map above (preserving
   cache keys — no regen); render the new scaffolds deterministically. Reuse
   the trajectory chart and Movement numbers verbatim.
2. Add the new structural scaffolds: the four-forces table (canon "WHAT IT
   MEANS" + derived "{NAME}'S READ"), the GRIP SAYS/AIM SAYS table, and the
   eight one-line Body Cards (question + one-sentence answer collapsed from
   each card's current lede).
3. Mirror the exact outline in `InnerConstitutionPage.tsx` so the on-screen
   Individual matches the markdown.
4. Keep the Guide (`renderMode === "clinician"`) on today's comprehensive
   format; everything dropped from the Individual still renders in the Guide.
5. Reframe + update the two-tier invariant to topic coverage (see above).
6. Re-snapshot `twoTierBaseline.snapshot.json` cold, LAST; show the diff
   (Individual changes large/expected; Guide unchanged).
7. Prove the numeric fields are byte-identical before/after for the `jasonType`
   fixture and one other (render-only guarantee).

## Allowed to Modify (exhaustive)

- `lib/renderMirror.ts`
- `app/components/InnerConstitutionPage.tsx`
- a new small helper module if warranted (e.g. `lib/fiftyDegreeIndividual.ts`
  for the new section composers / the warm-reuse re-placement / Body-Card collapse).
- `tests/audit/twoTierRenderSurfaceCleanup.audit.ts` (invariant reframe) +
  `tests/audit/twoTierBaseline.snapshot.json` (cold re-snapshot, show diff) +
  any audit whose anchor strings break on the new Individual structure (anchor
  refresh only — flag each).

Nothing else. **No engine/derivation/score change.** No LLM-prompt edits and
**no cache regen** — the Individual reuses the existing warm rewrites by
preserving their cache keys; only the new scaffolds are deterministic. No PDF
engine. No renderMode renames.

## Out of Scope

- A paginated/branded PDF export (later CC; this is web/markdown only).
- Third-person voice / any cache regen (owner chose second-person reuse, ~$0).
- New warm micro-copy generation for the scaffolds (tables/Body-Card one-liners
  are deterministic; do not add LLM calls for them).
- CC-131's Guide de-repetition (separate, composes).
- Any score, signal, or derivation change.

## Bash Commands Authorized

- `npx tsc --noEmit`, `npm run lint`
- the two-tier + relevant audits
- `grep` / `rg` / `sed` read-only verification
- a one-off **cold** render (plain `npx tsx`, no API key, no warm cache) of
  2–3 fixtures (incl. the `jasonType` fixture and a caregiver fixture like
  Michele's archetype) in BOTH modes — eyeball the Individual against the
  Michele outline + word-count
- a numeric-invariant check: render the chosen fixtures before/after and diff
  the Movement/Grip/OCEAN numeric fields (must be byte-identical)

## Acceptance Criteria

1. `npx tsc --noEmit` clean; `npm run lint` clean (pre-existing warnings ok).
2. **Numeric invariant:** Goal/Soul/Aim/Grip/Lens/OCEAN byte-identical
   before/after for two fixtures (render-only — prove it).
3. The Individual renders the **11 Michele sections in order** with the right
   format (cover + four-forces table + trajectory panel + Pattern/Grip incl.
   GRIP SAYS/AIM SAYS table + eight one-line Body Cards + Work/Love/Giving +
   Open Tensions + Keystone + Next Three Moves + Closing + footer). Paste the
   rendered `jasonType` Individual in the Report Back.
4. The dropped sections (Core Signal Map, OCEAN panel, Work/Love Map, card
   expansions, standalone Synthesis, Distribution) are **absent from the
   Individual** and **still present in the Guide**.
5. Voice: the Individual is second person and **reuses** the existing warm
   rewrites (no regen). Confirm the warm sections hit the existing cache (no
   new generation) by showing the cache keys are unchanged for a fixture.
6. The two-tier invariant is reframed to topic coverage and passes; the Guide
   render is unchanged by this CC (verify its diff is empty); audits pass cold
   AND warm (no flap).
7. React Individual matches the markdown Individual (same outline).
8. No file outside the Allowed-to-Modify list edited; no engine/LLM/cache change.

## Report Back

- The full rendered `jasonType` Individual (markdown) so the outline can be
  eyeballed against Michele.
- The section-by-section data-source mapping you actually used (esp. the
  archetype/surface-label fields and the four-forces canon copy source).
- The Body-Card collapse rule (how each card's one-line answer is derived).
- The warm-reuse wiring: which cached rewrites feed which outline sections,
  and proof the cache keys are unchanged (no regen, ~$0).
- The two-tier invariant reframe (old assertion → new coverage assertion) +
  confirmation the Guide diff is empty and the Individual numeric fields are
  unchanged.
- Individual word-count before/after per fixture (expect a large cut).
- Any audit anchor refreshes (flagged); any ambiguity decision (esp. Open
  Tensions closing prompt, Core Pattern/Grip section pairing).
- Any overlap with CC-131 if it has already landed (which file/branch).
