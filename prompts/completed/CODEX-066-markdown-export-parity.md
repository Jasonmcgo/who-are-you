# CODEX-066 — Markdown Export Parity Fix (close the gap between on-page and markdown export accumulated since CC-022c)

*(Filename CODEX-066 per the agent-routing convention 2026-04-29: surgical / mechanical scope; pure additive emission of content the engine already produces. Numbering shares the global CC-### sequence.)*

**Type:** Mechanical extension to `lib/renderMirror.ts`. **No new logic beyond emission additions. No new prose authored. No canon decisions delegated to the executor.** All content already exists as engine output fields; CODEX-066 only emits them in the markdown export so the markdown matches the on-page render. Plus one removal (standalone Allocation Gaps per CODEX-051's design intent) and one tension-iteration extension.
**Goal:** Close the markdown-parity gap surfaced by Jason's 2026-05-02 review. Multiple recent CCs (CC-037 / CC-042 / CC-044 / CC-054 / CC-064 / CODEX-051) shipped on-page changes without updating `lib/renderMirror.ts`. Result: markdown export is missing roughly 25% of the engine's actual user-facing output — Disposition Map (OCEAN), Work Map, Love Map, CC-054 Peace + Faith disambiguation prose in Compass body, MBTI disclosure, Lens architect observation, T-013/T-015/T-016 in Open Tensions. Plus a stale standalone Allocation Gaps section CODEX-051 removed on-page but renderMirror still emits. After CODEX-066 ships, markdown export carries everything the on-page render carries, in the same content order, so JDrew's manual A/B with Opus and ChatGPT-5+ tests against a complete engine output rather than a fossilized 2026-04-15-era subset.
**Predecessors:** CC-022c (original markdown export parity baseline). CC-041 (renderMirror markdown-export drift fix — the last targeted parity update). CC-037 (OCEAN added on-page; not in markdown). CC-042 (Work Map added on-page; not in markdown). CC-044 (Love Map added on-page; not in markdown). CC-054 (Peace + Faith disambiguation prose added on-page Compass body; not in markdown). CC-064 (T-016 tensions added; not in markdown's Open Tensions iteration). CODEX-051 (removed standalone Allocation Gaps on-page; markdown still emits it). CC-065 (added admin re-export panel — gives Jason the ability to re-export on demand, which surfaced this parity gap during the manual A/B prep).
**Successor:** None hard-blocked. **Should ship before JDrew takes the assessment** so his report (and Jason's re-export of Jason0429) flow through complete markdown to the LLM A/B reviewers.

---

## Why this CODEX

Jason's 2026-05-02 manual A/B prep surfaced the gap. The on-page render at `/admin/sessions/[id]` carries:

- MBTI disclosure ("Possible surface label: INTJ...")
- Lens architect-quality observation between Top Gifts and Top Growth Edges
- A Synthesis (early position, after Keystone)
- Disposition Map (OCEAN) section
- Work Map section
- Love Map section
- 8 ShapeCards including Compass with CC-054 Peace + Faith disambiguation prose in body
- Path · Gait
- Growth Path / Conflict Translation / Mirror-Types Seed
- Open Tensions including T-001 / T-002 / T-013 / T-015 / T-016
- "What this is good for" use-cases closer

The markdown export carries:

- MBTI disclosure ❌ MISSING
- Lens architect observation ❌ MISSING
- A Synthesis (LATE position — after Open Tensions)
- Disposition Map ❌ MISSING ENTIRELY
- Work Map ❌ MISSING ENTIRELY
- Love Map ❌ MISSING ENTIRELY
- 8 ShapeCards (Compass body MISSING Peace + Faith disambiguation prose)
- Path · Gait
- Growth Path / Conflict Translation / Mirror-Types Seed
- Standalone Allocation Gaps section (LEGACY — should be removed per CODEX-051)
- Open Tensions ONLY emits T-001 + T-002 (T-013 / T-015 / T-016 ❌ MISSING)
- "What this is good for"

The pattern is accumulated drift: every CC that added an on-page surface was supposed to update `renderMirror.ts`. Most didn't. CODEX-066 closes the accumulated drift in one pass and adds a procedural canon note so future CCs include markdown-parity in their scope.

CODEX-066 is purely additive (six section emissions added) plus one removal (standalone Allocation Gaps) plus one extension (tensions iteration). All content already exists as engine output. The locked content is what's already populated in `OceanOutput`, `WorkMapOutput`, `LoveMapOutput`, `FullSwotOutput.peace_register_prose` / `faith_register_prose`, `Tension[]`. Nothing new authored.

---

## Locked changes — additions

### 1. MBTI disclosure section

Emit immediately after the masthead (golden sentence + uncomfortable-but-true), before "How to Read This."

Shape (matches the on-page render):

```markdown
*Possible surface label: ${mbtiCode}. Type labels are surface descriptions only — your shape is not reducible to a four-letter code. The Lens reading above is the actual interpretation.*
```

The `${mbtiCode}` is computed by the existing MBTI inference (CC-038-prose era, possibly earlier). If `mbtiCode` is null or unknown, omit the entire disclosure section. If non-null, emit verbatim.

Locate the existing accessor in `lib/identityEngine.ts` (search for `mbtiCode` / `inferMbti` / `mbti` field on InnerConstitution or MirrorOutput). Read the existing on-page emit in `app/components/MbtiDisclosure.tsx` for the canonical text shape; mirror in markdown.

### 2. Lens architect observation

Emit between "Your Top 3 Gifts" and "Your Top 3 Growth Edges." Shape (matches on-page):

```markdown
*Your Lens has an architect quality: you appear to see the future shape first, then look for the practical structures that could carry it.*
```

The exact wording is conditional on the user's Lens stack — if the stack is something other than the architect quality (e.g., a different aux-pair), the locked text varies. Locate the existing on-page composer (likely in MirrorSection.tsx or a related component reading `lensStack` + `aux-pair register`). Mirror its conditional logic in the markdown emission.

If the executor finds the on-page logic is too entangled to mirror cleanly in renderMirror.ts, surface in Report Back — the fallback is to emit a generic Lens summary phrase using the existing `lensSummaryPhrase()` helper from `lib/identityEngine.ts`.

### 3. Disposition Map section (OCEAN)

Emit after Keystone Reflection, before A Synthesis (or wherever A Synthesis lands per Item 9). Section structure mirrors on-page:

```markdown
## Disposition Map

*${dispositionFramingParagraph}*

[Distribution: Openness ${O}%, Conscientiousness ${C}%, Extraversion ${E}%, Agreeableness ${A}%, Emotional Reactivity ${N}%]

${dispositionStrongestProse}

${dispositionNeuroticismCaveat}
```

Where:

- `dispositionFramingParagraph` is the locked CC-065 string: *"Disposition tendencies, derived from how you answered other questions in this instrument. No single answer determines a tendency; the model reads patterns across the full question footprint."*
- The bucket distribution renders as a single-line bracketed list mirroring how the Drive distribution renders elsewhere in the markdown. The N axis carries an `(estimated)` parenthetical.
- `dispositionStrongestProse` comes from `lib/ocean.ts § generateOceanProse` (single-dominant / two-dominant / balanced / n-elevated case). Emit verbatim.
- `dispositionNeuroticismCaveat` comes from the n-elevated case prose if it fired; otherwise emit the generic CC-037 caveat: *"Emotional Reactivity is shown as an estimate — the instrument measures it through proxy signals (formation history, current-context load, pressure-adaptation behavior) rather than directly."*

Section is conditional: if `constitution.ocean` is undefined or thin-signal, omit the section entirely. Pre-CC-037 saved sessions skip silently.

### 4. Work Map section

Emit after Disposition Map, before Love Map. Shape:

```markdown
## Work Map

*${workMapFramingParagraph}*

### ${matchedRegisterLabel}

${matchedRegisterDescription}

*Examples: ${exampleAnchors}*

${workMapCompositeProse}

*Work Map is a derivation, not a recommendation. It names registers your existing answers point toward; it doesn't account for training, geographic constraints, or life-stage tradeoffs you bring to any career decision.*
```

Where:

- `workMapFramingParagraph` is the locked CC-042 framing: *"Work registers the instrument detects you're structurally aligned to. Derived from your cognitive register, motivational distribution, trait disposition, and value orientation — not from any vocation-specific question. These are categories of work that will come easy and feel meaningful, not prescriptions."* (Note: this paragraph is a Rule 1 violation candidate per CC-048 audit at `app/components/InnerConstitutionPage.tsx:373` — *"cognitive register, motivational distribution, trait disposition, and value orientation"* names the four framework dimensions. Out of scope for this CODEX; emit verbatim from on-page state. A future Rule 1 closure CC handles.)
- `matchedRegisterLabel`, `matchedRegisterDescription`, `exampleAnchors` come from `lib/workMap.ts § WORK_REGISTERS` for whichever register matched.
- `workMapCompositeProse` is the "Your composite read points toward..." prose from `generateWorkProse()`.
- The footer caveat is locked from CC-042.

If 2 registers matched (top-1 + top-2), emit both with their fields. If 0 registers matched (thin-signal session), omit the section entirely. The on-page section guards on `matches.length > 0` per CC-042; mirror that guard in markdown.

### 5. Love Map section

Emit after Work Map, before A Synthesis (or wherever A Synthesis lands per Item 9). Shape:

```markdown
## Love Map

*Love takes many shapes — what follows describes how your love tends to take shape, not whether your love is real. Real love, regardless of register or flavor, is patient and kind, persists, refuses to keep records, rejoices with truth. The map below names the shape; the qualities it must meet to be love at all are not particular to any shape.*

### ${matchedRegisterLabel}

${matchedRegisterShortDescription}

*Expressed primarily through ${flavorList}.*

${resourceBalanceProseIfNonEmpty}

*Love Map is a derivation, not a prescription. It names the register and modes your existing answers point toward; it doesn't account for life-stage, current circumstance, or the relationships you've actually chosen to invest in.*
```

Where:

- The locked Pauline-frame paragraph is from CC-044, plain-language paraphrase per Rule 1.
- `matchedRegisterLabel`, `matchedRegisterShortDescription` come from `lib/loveMap.ts § LOVE_REGISTERS` for whichever register matched (post-CC-059's framework-leak strip).
- `flavorList` comes from `generateLoveProse()` — formatted as "X and Y, with notes of Z" per the existing flavor-line composer.
- `resourceBalanceProseIfNonEmpty`: if `loveMap.resourceBalance.case !== "healthy"`, emit `resourceBalance.prose`; otherwise omit the line.
- The footer caveat is locked from CC-044.

If 2 registers matched, emit both. If 0 registers matched AND Resource Balance is healthy (no diagnostic prose), omit the section entirely. The on-page guard is `matches.length > 0 || resourceBalance.case !== "healthy"`; mirror.

### 6. CC-054 Peace + Faith disambiguation prose in Compass card body

In the existing Compass card emit block, after the existing `## ${cardName}` heading + Strength + Growth Edge + Practice + Pattern Note + Pattern observation (whatever the existing structure is), add:

```markdown
${peaceRegisterProseIfNonEmpty}

${faithRegisterProseIfNonEmpty}
```

Where the prose strings come from `compassOutput.peace_register_prose` and `compassOutput.faith_register_prose` (CC-054 locked prose templates). Emit each on its own paragraph if non-null/non-empty; omit entirely if null.

The on-page emit is in `app/components/MapSection.tsx` adjacent to the Compass ShapeCard's body — gated on `expanded.compass && (peace || faith)`. Markdown export is unconditionally expanded (no accordion), so the gate becomes `peace || faith` only.

---

## Locked changes — removal

### 7. Remove standalone Allocation Gaps section

The current markdown emits a standalone "Allocation Gaps" section near the top of the body content (immediately after "When the Load Gets Heavy" / before "Your Next 3 Moves"). Looks like:

```markdown
## Allocation Gaps

*the gap between what you name and where your resources actually go.*

You named Knowledge as among your most sacred values. Your money appears to flow mostly to family and yourself.

The 3 C's question for your shape is...

Does this feel true, partially true, or not true at all?

Across multiple allocation domains, you marked categories where the current flow doesn't match what you wish.

The 3 C's question for your shape, across multiple allocation domains, is...

Does this feel true, partially true, or not true at all?
```

**Remove this entire section.** Per CODEX-051 Item 3's design intent, the standalone Allocation Gaps section was removed on-page in favor of surfacing T-013 (Sacred Words vs Sacred Spending) and T-015 (Current and Aspirational Allocation) in Open Tensions where they have the interactive Yes/Partially/No/Explain affordance. The markdown should mirror.

After the removal: T-013 / T-015 prose surfaces only in Open Tensions per the extension below. No duplication.

---

## Locked changes — extension

### 8. Extend Open Tensions iteration to walk all tensions

The current markdown's Open Tensions section emits only T-001 (Creator vs Maintainer) and T-002 (Sacred Values in Conflict) — the legacy subset. The iteration is presumably hardcoded or filtered.

**Replace with an iteration over `constitution.tensions` that walks every tension** with `status === "unconfirmed"` (or whatever filter the on-page Open Tensions uses), emitting each tension's `type` heading and `user_prompt` body.

Reference shape from current markdown render of T-001 / T-002:

```markdown
### ${tensionType}

${tensionUserPrompt}
```

After the extension, the markdown's Open Tensions section emits T-001, T-002, T-013, T-015, T-016 (and any other tensions that fire) in the order they appear in `constitution.tensions`.

The on-page render in `InnerConstitutionPage.tsx` uses an `openTensions` filter that excludes confirmed tensions and excludes "allocation tensions" (per CODEX-051's prior architecture). After CODEX-051's redesign, the allocation-tension exclusion was supposed to be lifted (T-013/T-015 surface in Open Tensions). Confirm whether the on-page `openTensions` filter still excludes T-013/T-015 — if so, the markdown should mirror that filter; if not, walk all unconfirmed tensions.

If the on-page filter still excludes T-013/T-015 (an architectural inconsistency), surface in Report Back — that's a separate concern.

### 9. Resolve A Synthesis position

On-page renders A Synthesis EARLY (after Keystone, before Disposition Map). Markdown renders A Synthesis LATE (after Open Tensions, before "What this is good for"). Pick one for parity.

**Path α (recommended):** Move markdown's A Synthesis to the EARLY position to match on-page. Reasoning: "the eight cards pulled into one read" reads as a synthesis closer to the Mirror layer, before the Maps and 8-card body; rendering it after the body cards reads redundantly. On-page's choice is the cleaner narrative arc. Markdown follows.

**Path β (rejected):** Move on-page's A Synthesis to the LATE position to match markdown. Reason for rejection: would require changes to `app/components/InnerConstitutionPage.tsx` (out of CODEX-066's allowed-to-modify); larger scope.

Lock to Path α: in renderMirror.ts, move the A Synthesis emit from its current late position to the new early position (after Keystone, before Disposition Map).

---

## Locked changes — canon note

### 10. Procedural canon note

Append to `docs/canon/result-writing-canon.md` a short paragraph (after the existing Rule 11 amendment, or wherever fits structurally):

```markdown
## § Markdown Export Parity (procedural — CODEX-066, 2026-05-02)

Every CC that adds, removes, or restructures an on-page report surface in `app/components/InnerConstitutionPage.tsx` or its child components MUST also update `lib/renderMirror.ts` to maintain markdown export parity. Markdown is the canonical handoff format for downstream LLM review (per the manual A/B workflow), share-without-account flow (per `project_mvp_product_vision.md`), and any future PDF generation pipeline. Drift between on-page and markdown invalidates the comparison surface.

CODEX-066 closed the accumulated drift since CC-022c — Disposition Map (CC-037), Work Map (CC-042), Love Map (CC-044), Peace + Faith disambiguation (CC-054), Open Tensions iteration (CC-064), removal of standalone Allocation Gaps (CODEX-051). The sequencing failure was avoidable; new CCs should include renderMirror.ts updates in their scope from the start.
```

The procedural rule is the protective rail. Future CCs that touch on-page surfaces will include renderMirror updates; this note makes the expectation explicit.

---

## Acceptance

- `npx tsc --noEmit` clean.
- `npm run lint` clean.
- `npm run build` exits 0.
- Re-rendered Jason0429 markdown export now contains:
  - MBTI disclosure section (if mbtiCode is non-null) ✓
  - Lens architect observation between Top Gifts and Top Growth Edges ✓
  - A Synthesis in EARLY position (after Keystone, before Disposition Map) ✓
  - Disposition Map section with bucket distribution + locked framing + strongest-disposition prose + Neuroticism caveat ✓
  - Work Map section with matched register + composite prose + footer caveat ✓
  - Love Map section with locked Pauline-frame paragraph + matched register + flavor line + Resource Balance prose if applicable + footer caveat ✓
  - Compass card body containing CC-054 Peace + Faith disambiguation prose (when fields are non-null) ✓
  - Open Tensions emitting T-001, T-002, T-013, T-015, T-016 (whichever fired) — minimum 5 tensions for Jason0429's profile ✓
- Standalone Allocation Gaps section is GONE from markdown ✓
- A test session with no OCEAN / Work Map / Love Map data (thin-signal) renders without those sections (graceful empty-state handling) ✓
- Markdown content order matches on-page section order from the masthead through the closer ✓
- Polish-layer round-trip (when API keys set) preserves the new sections via existing extraction (sections that flow into `proseSlots` or `lockedAnchors` are protected; Disposition Map / Work Map / Love Map prose flows into proseSlots per existing extractor or — if not — surface in Report Back as a follow-on) ✓
- Markdown filename convention preserved (`inner-constitution-{slug}-{YYYY-MM-DD}.md`).
- Footer line preserved.
- "What this is good for" closer preserved at the end.
- No edits to `lib/identityEngine.ts`, `lib/ocean.ts`, `lib/workMap.ts`, `lib/loveMap.ts`, or any engine-output composer. CODEX-066 only emits content that already exists.

---

## Out of scope

- **Editing any engine-output composer.** All emission additions read existing fields. No new prose authored.
- **Editing on-page render** (`InnerConstitutionPage.tsx`, `MapSection.tsx`, `MirrorSection.tsx`, etc.). On-page is the source of truth; markdown follows.
- **Editing canon docs beyond the one new procedural note.** Existing canon untouched.
- **Editing the audit doc.** No findings closed by CODEX-066; this is a parity fix, not a calibration fix.
- **Closing the Work Map framing-paragraph Rule 1 violation** (`app/components/InnerConstitutionPage.tsx:373` — "cognitive register, motivational distribution, trait disposition, and value orientation"). Out of scope; emit verbatim from on-page state. Future Rule 1 closure CC handles.
- **OCEAN-as-Texture (Rule 6) full refactor.** Future larger CC.
- **PDF export pipeline.** Markdown is the current canonical export; PDF is a future feature.
- **Adding new tensions, registers, or content beyond what the engine already produces.**
- **Adding tests.**
- **Editing the polish-layer adapters, A/B harness, validation pass, or system prompt.**
- **Editing the Compass card's existing prose blocks** (Strength / Growth Edge / Practice / Pattern Note / Pattern observation). Only the new Peace + Faith register prose is appended.
- **Editing CC-053 admin answer-edit components.**

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

Codex equivalent acceptable. **Filed CODEX- per the routing convention because the scope is mechanical / locked-content / pure additive emission. Either executor lands it cleanly given the locked content.**

## Execution Directive

Single pass. **All locked content is already in engine output fields; the executor's job is emission, not authorship.** The procedural canon note ships verbatim from this prompt's locked content. If the executor encounters a structural surprise (e.g., the on-page MBTI disclosure component has a non-trivial conditional that's hard to mirror in markdown; the existing `openTensions` filter excludes T-013/T-015 such that the on-page itself isn't surfacing them despite this prompt's claim; the Lens architect observation has multi-conditional logic per aux-pair register), surface in Report Back rather than restructuring on the fly. **Move prompt to `prompts/completed/` when done.**

## Bash Commands Authorized

- `cat lib/renderMirror.ts`
- `cat app/components/InnerConstitutionPage.tsx | head -500`
- `cat app/components/MapSection.tsx`
- `cat app/components/MirrorSection.tsx`
- `cat app/components/MbtiDisclosure.tsx` (if exists)
- `cat app/components/OceanBars.tsx`
- `cat app/components/WorkMap.tsx`
- `cat app/components/LoveMap.tsx`
- `grep -n "peace_register_prose\|faith_register_prose\|mbtiCode\|architect quality\|generateOceanProse\|generateWorkProse\|generateLoveProse" lib/ app/`
- `grep -n "openTensions\|isAllocationTension\|tension.tension_id" app/components/InnerConstitutionPage.tsx lib/renderMirror.ts`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` (smoke; kill before exit)
- `mv prompts/active/CODEX-066-markdown-export-parity.md prompts/completed/CODEX-066-markdown-export-parity.md`
- `git diff --stat`
- `git diff lib/renderMirror.ts docs/canon/result-writing-canon.md`

## Read First (Required)

- `AGENTS.md`.
- `lib/renderMirror.ts` (full file; the markdown emitter being extended).
- `app/components/InnerConstitutionPage.tsx` (full file; the on-page composer that's the source of truth — read for section order and emission patterns to mirror).
- `app/components/MirrorSection.tsx` (Mirror layer including MBTI disclosure + Lens architect observation).
- `app/components/MapSection.tsx` (Compass card body with CC-054 Peace + Faith disambiguation wire-in).
- `app/components/OceanBars.tsx`, `app/components/WorkMap.tsx`, `app/components/LoveMap.tsx` (page sections to mirror in markdown).
- `lib/ocean.ts § generateOceanProse, dispositionFraming` (canonical OCEAN prose; renderMirror reads same fields).
- `lib/workMap.ts § generateWorkProse, WORK_REGISTERS` (canonical Work Map prose).
- `lib/loveMap.ts § generateLoveProse, LOVE_REGISTERS, LOVE_FLAVORS, RESOURCE_BALANCE_PROSE` (canonical Love Map prose).
- `lib/identityEngine.ts § FullSwotOutput, MirrorOutput, InnerConstitution, generateMirror, deriveCompassOutput` (engine output shapes — verify peace_register_prose / faith_register_prose / mbtiCode field names).
- `lib/types.ts § Tension, FullSwotOutput, OceanOutput, WorkMapOutput, LoveMapOutput, MirrorOutput`.
- `docs/canon/result-writing-canon.md` (locate insertion point for the new § Markdown Export Parity procedural note).
- Memory:
  - `feedback_shapecard_field_inversion.md` (cardHeader is engine-emitted; renderMirror reads it correctly).

## Allowed to Modify

- `lib/renderMirror.ts` (the markdown emitter; all six section additions + one removal + Open Tensions iteration extension + A Synthesis position move).
- `docs/canon/result-writing-canon.md` (one new § Markdown Export Parity procedural note appended; no other canon edits).
- **No other files.** Specifically NOT: `lib/identityEngine.ts`, `lib/ocean.ts`, `lib/workMap.ts`, `lib/loveMap.ts`, `lib/drive.ts`, `lib/beliefHeuristics.ts`, `lib/types.ts`, `data/questions.ts`, `app/components/*.tsx`, `lib/humanityRendering/*`, any test files.

## Report Back

1. **Six emission additions** — diffs for each (MBTI disclosure / Lens architect observation / Disposition Map / Work Map / Love Map / Compass body Peace+Faith). Confirmation that the locked framing paragraphs ship verbatim.
2. **Standalone Allocation Gaps removal** — diff showing the section emit removed from renderMirror.ts. Verify by grepping that the strings *"the gap between what you name and where your resources actually go"* and *"## Allocation Gaps"* return zero hits in lib/renderMirror.ts post-fix.
3. **Open Tensions iteration extension** — diff showing the iteration walks all unconfirmed tensions (or the equivalent filter the on-page uses). Sample output for Jason0429 should emit at least 5 tension entries.
4. **A Synthesis position move** — diff showing A Synthesis emit moved from late position to early position (after Keystone, before Disposition Map).
5. **Procedural canon note** — line range showing the new § Markdown Export Parity paragraph in `result-writing-canon.md`.
6. **Sample re-rendered Jason0429 markdown** — first 100 lines + sections list (table of contents). Confirm parity with on-page.
7. **Verification results** — tsc, lint, build all clean.
8. **Manual sweep deferred to Jason** — explicit verification list:
   - Open `/admin/sessions/[id]` for Jason0429.
   - Click "Download Markdown" via the new admin export panel.
   - Compare downloaded markdown to the on-page render section by section.
   - Expected: every section visible on-page is now in the markdown, in the same content order.
   - Edge: the Disposition Map / Work Map / Love Map sections emit with correct content (locked framing paragraphs + per-user data fields).
   - The MBTI disclosure emits when mbtiCode is non-null.
   - The Compass card body in markdown carries Peace + Faith disambiguation prose (matching on-page).
   - Open Tensions section emits T-001 / T-002 / T-013 / T-015 / T-016 (whichever fired) in the same order as on-page.
   - Standalone Allocation Gaps section is GONE.
   - Polish-layer A/B harness (if testing) preserves the new content via existing extraction.
9. **Any deviation from locked content** — if a structural surprise prevented exact parity for any item.
10. **Prompt move-to-completed confirmation.**

---

## Notes for the executing engineer

- **All emission content already exists as engine output.** Don't author new prose. If a section's content isn't accessible from `renderMirror.ts`, that's a wiring issue worth surfacing — but most likely it's accessible via the same `constitution.{cardKey}` / `constitution.ocean` / `constitution.workMap` / `constitution.loveMap` / `constitution.mirror` paths the on-page composer uses.
- **Section order for parity is locked at the on-page render.** Match what's in `InnerConstitutionPage.tsx` from masthead through closer.
- **MBTI disclosure conditional emission** — if `mbtiCode` is null/unknown, omit entirely. Don't emit a placeholder.
- **Lens architect observation** is conditional on the user's Lens stack — locate the existing on-page composer logic and mirror in markdown. If too entangled, fall back to a generic Lens summary phrase.
- **Disposition Map / Work Map / Love Map sections are conditional on data being present.** Thin-signal sessions skip silently. Mirror the on-page guards (`constitution.ocean`, `constitution.workMap && matches.length > 0`, `constitution.loveMap && (matches.length > 0 || resourceBalance.case !== "healthy")`).
- **Compass body Peace + Faith disambiguation** — emit each prose block on its own paragraph if non-null/non-empty. Skip silently if null.
- **Standalone Allocation Gaps removal is the ONE removal.** Everything else is additive.
- **Open Tensions iteration extension** — verify the filter the on-page uses. If on-page excludes any tension types that markdown should include, surface in Report Back.
- **A Synthesis position move** is structural. Don't restructure surrounding sections; just move A Synthesis from late to early.
- **The procedural canon note** ships verbatim from this prompt's locked content. Append at the end of result-writing-canon.md after the existing Rule 11 amendment (or wherever fits structurally).
- **Polish-layer integration** — the new sections flow into `proseSlots` / `lockedAnchors` via existing extractors per CODEX-062 + CC-065. No new contract edits required. If `extractAnchors` doesn't pick up Disposition Map / Work Map / Love Map prose, that's a separate follow-on; surface in Report Back.
- **Per the routing convention** the prompt file moves to `prompts/completed/` when shipped. Explicit reminder.
- **Pre-CODEX-066 saved sessions** re-render against current code on admin load; the next Download Markdown click produces the new parity-correct markdown automatically.
- **CODEX-066 is the load-bearing pre-JDrew block.** After it ships, JDrew's report (and Jason0429's re-export) flow through complete markdown to Opus + ChatGPT-5+. The manual A/B comparison surface is intact.
