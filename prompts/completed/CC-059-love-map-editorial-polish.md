# CC-059 — Love Map Editorial Polish (CC-044-prose; CC-048 audit Rule 1 closure for `lib/loveMap.ts`)

**Type:** Editorial rewrite landing in code. **Locked-content string replacements** in `lib/loveMap.ts` — no schema changes, no new logic, no new measurements, no render-position changes. Strips Pauline framework references from `characteristic_distortion` fields (7 string rewrites) and strips Fi-driver / Ne-driver framework leaks from 2 register `short_description` fields. Canon-doc and audit-doc updates name the closure.
**Goal:** Close CC-048 audit Rule 1 violations in `lib/loveMap.ts`. The current `characteristic_distortion` fields carry literal *"Pauline diagnostic: ..."* trailers — flagged at CC-044 ship time as a known Rule 1 violation, deferred to "CC-044-prose," renumbered here as CC-059 per the global sequence. Two register short_descriptions (`loyalist`, `open_heart`) carry *"Fi-driver"* / *"Ne-driver"* framework references that also breach Rule 1. After CC-059 ships, the Love Map's data fields paraphrase Pauline qualities in plain language without naming the framework, and cognitive-function references appear as register-faithful prose without typological codenames.
**Predecessors:** CC-044 (Love Map shipped with v1 placeholder content; flagged 7 Pauline-prefix violations + 2 framework-name leaks for prose follow-on). CC-048 (Report Calibration Canon — Rule 1 codification: *"Frameworks behind the scenes — OCEAN, Jungian, 3 C's, aux-pair register, Pauline framing never surface as section labels or named references in user-facing prose."*). The locked Pauline-frame paragraph in `app/components/InnerConstitutionPage.tsx:457` already paraphrases the framework correctly — the field values in `lib/loveMap.ts` are the remaining gap.
**Successor:** None hard-blocked. Closes the substantive Love Map calibration gap before any render-surface work or polish-layer integration extends the field's user-facing footprint.

---

## Why this CC

CC-044 shipped the Love Map architecturally complete (7 registers + 7 flavors + Resource Balance diagnostic + threshold-tuned predicates) but with v1 placeholder string content the original CC explicitly deferred to a follow-on. Two specific defect classes:

1. **Rule 1 violation — Pauline framework leak (7 fields).** Each `characteristic_distortion` ends with *"Pauline diagnostic: [quality reference]."* The Pauline qualities (patient, kind, persists, refuses to keep records, rejoices with truth, does not boast, is not proud, does not dishonor, does not delight in evil, always protects, always perseveres) are canonical inputs the audit accepts. The framework *name* surfacing in user-facing field content is the violation.

2. **Rule 1 violation — typological codename leak (2 fields).** The `loyalist` register short_description names *"Fi-driver loyalty"*; `open_heart` names *"Ne-driver breadth-of-attention"*. These are typological codenames per CC-048 Rule 1 — same class of leak as *"Pauline diagnostic"* even though the framework is different (Jungian function-pair routing). Per `feedback_pair_key_casing_canon.md`, the canonical pattern is to name the *register* (analog labels like "the Loyalist," "the Open Heart") and let the cognitive-function routing live in canon docs and engine code, not in user-facing field content.

The Love Map's render currently surfaces `register_label`, `short_description`, and `resource_balance.prose` — *not* `characteristic_distortion`. So the Pauline-trailer leak is data-only at v1 (no live user-facing surface). But:

- The canon doc and audit doc reference Rule 1 closure pending; CC-059 closes the documentation gap.
- The polish-layer contract per CC-057a treats engine-emitted prose as substance the polish layer composes against. When `characteristic_distortion` becomes a render surface (future CC) or a polish-layer input, the cleaned text must be in place.
- The 2 register short_description leaks are *currently rendered* (the Love Map UI surfaces `short_description` per `app/components/LoveMap.tsx:69`). Those leaks are live in user-facing prose today. Real defect, immediate UX value.

CC-059 is engine-side substance per the Path C contract. The locked rewrites this CC ships are polish-layer-immutable: Path C's polish layer can re-render warmer adjacent prose but cannot edit the locked field strings.

---

## Scope

Files modified:

1. **`lib/loveMap.ts`** — 9 string replacements:
   - 7 `characteristic_distortion` fields (one per register): strip *"Pauline diagnostic: ..."* trailer; replace with locked plain-language continuation that preserves diagnostic content without naming the framework.
   - 2 `short_description` fields (`loyalist`, `open_heart`): strip *"Fi-driver"* / *"Ne-driver"* framework references; replace with locked plain-language clauses.

2. **`docs/canon/love-map.md`** — append a CC-059 amendment paragraph noting Rule 1 closure for `lib/loveMap.ts`. Update the field tables (if present) to reflect the new strings.

3. **`docs/canon/result-writing-canon.md`** — append a CC-059 amendment under § Rule 1 (Frameworks behind the scenes) noting the Love Map closure.

4. **`docs/audits/report-calibration-audit-2026-04-29.md`** — mark the relevant Rule 1 findings (Pauline-trailer × 7, Fi-driver / Ne-driver × 2) as RESOLVED by CC-059.

Nothing else. Specifically:

- **No schema changes.** `LoveRegister` / `LoveFlavor` / `LoveMapOutput` types in `lib/types.ts` are untouched.
- **No new fields.** `LOVE_REGISTERS` and `LOVE_FLAVORS` keep their existing structure; only the string values of two field-types change.
- **No new registers, flavors, or Resource Balance cases.** The 7×7×4 v1 floor stays.
- **No predicate changes.** Threshold constants, register predicates, flavor predicates, Resource Balance compute — all untouched.
- **No render-surface edits.** `app/components/LoveMap.tsx` is unchanged. `InnerConstitutionPage.tsx` is unchanged (the locked Pauline-frame framing paragraph at line 457 already paraphrases correctly).
- **No engine logic changes.** `computeLoveMapOutput`, `generateLoveProse`, `computeResourceBalance` — all untouched.
- **No polish-layer edits.** `lib/humanityRendering/contract.ts`, `validation.ts`, `prompt.ts` — all untouched.
- **No tagging-table changes.**
- **No additional editorial pass on the 5 register short_descriptions or 7 flavor short_descriptions that are already framework-clean.** Reads cleanly per CC-044 v1; not in this CC's scope.

---

## The locked content — 7 `characteristic_distortion` rewrites

For each register in `LOVE_REGISTERS` (`lib/loveMap.ts:144-210`), replace the entire `characteristic_distortion` string with the locked replacement below. Verbatim. Do not paraphrase, reorder, or "improve." All 7 ship as one batch.

### 1. `devoted_partner` (line ~151)

**Before:**

> *"Pair-bond commitment hardening into accountancy — a quiet ledger of who's owed what, who broke faith first, what hasn't been forgiven. Pauline diagnostic: keeps no record of wrongs."*

**After (locked):**

> *"Pair-bond commitment hardening into accountancy — a quiet ledger of who's owed what, who broke faith first, what hasn't been forgiven. The distortion is when love starts keeping books love wasn't meant to keep."*

### 2. `parental_heart` (line ~160)

**Before:**

> *"Cultivation tipping into control — tending what's becoming until the becoming has to match the tender's image of it. Pauline diagnostic: is not self-seeking + does not dishonor others (treating the cultivated as instrument rather than presence)."*

**After (locked):**

> *"Cultivation tipping into control — tending what's becoming until the becoming has to match the tender's image of it. The distortion is when the act of tending starts requiring the tended to be the kind of thing the tender wanted them to become."*

### 3. `chosen_family` (line ~169)

**Before:**

> *"Web-keeping turning into performance — the connections held for the sake of being-the-keeper, not for the people inside them. Pauline diagnostic: does not boast + is not proud."*

**After (locked):**

> *"Web-keeping turning into performance — the connections held for the sake of being-the-keeper, not for the people inside them. The distortion is when the connective work starts being its own audience, and the ties that were supposed to hold the people start holding the keeper's identity instead."*

### 4. `companion` (line ~180)

**Before:**

> *"Presence-without-presence — steady but disengaged; the companion who's there but not engaged enough to interrupt drift. Pauline diagnostic: always protects + rejoices with the truth — failure to actively care when truth requires it."*

**After (locked):**

> *"Presence-without-presence — steady but disengaged; the companion who's there but not engaged enough to interrupt drift. The distortion is when staying close becomes a substitute for caring enough to interrupt — the loyal silence that lets a life go quietly off course."*

### 5. `belonging_heart` (line ~189)

**Before:**

> *"Tribal coding — love of belonging hardening into in-group loyalty plus out-group cruelty. Pauline diagnostic: does not dishonor others + does not delight in evil (when 'evil' gets coded as the out-group)."*

**After (locked):**

> *"Tribal coding — love of belonging hardening into in-group loyalty plus out-group dismissal. The distortion is when 'we' becomes load-bearing in a way that requires a 'they' to fail; when the love of being-part-of starts feeding on what it isn't part of."*

### 6. `loyalist` (line ~198)

**Before:**

> *"Values-loyalty hardening into rigidity; the anchor becomes the verdict. Pauline diagnostic: is not easily angered + keeps no record of wrongs — values-rooted loyalty turning into grievance accountancy."*

**After (locked):**

> *"Values-loyalty hardening into rigidity; the anchor becomes the verdict. The distortion is when devotion to what's true starts collecting evidence against everyone who fell short of it — when conviction turns into grievance and the loyalty itself becomes the indictment."*

### 7. `open_heart` (line ~207)

**Before:**

> *"Distributed attention failing to follow through; the invitation extended without the staying-with that makes it real. Pauline diagnostic: always perseveres + always protects."*

**After (locked):**

> *"Distributed attention failing to follow through; the invitation extended without the staying-with that makes it real. The distortion is when the open hand never closes around anything for long enough — when love-as-invitation becomes a register without a residence."*

---

## The locked content — 2 `short_description` rewrites (Rule 1 framework-leak fix)

### 8. `loyalist` short_description (line ~196)

**Before:**

> *"Love as the unflinching anchor for what matters most; Fi-driver loyalty without show; values-rooted devotion that doesn't require performance."*

**After (locked):**

> *"Love as the unflinching anchor for what matters most; values-rooted devotion that doesn't require performance, that holds whether or not anyone is watching."*

### 9. `open_heart` short_description (line ~205)

**Before:**

> *"Love as continuous invitation toward becoming, distributed across many; Ne-driver breadth-of-attention; the catalyst's love."*

**After (locked):**

> *"Love as continuous invitation toward becoming, distributed across many; the catalyst's love — breadth of attention rather than depth of bond, but not less real for being wide."*

---

## The locked tone register

Each rewrite preserves:

- **The lead clause** (the v1 plain-language description of the register or distortion mechanism). Verbatim where the v1 reads cleanly; lightly tightened only where load-bearing for the framework strip.
- **Observational, not condemning.** Same tone canon as CC-058's uncomfortable-but-true sentences. The distortions name the failure mode of love in that register without indicting users who occupy the register.
- **No framework names.** "Pauline" doesn't appear. "Fi" / "Ne" / "driver" / "auxiliary" / "Jungian" / "MBTI" don't appear. Cognitive-function references stay in canon-doc and engine-code surfaces.
- **One sentence per distortion mechanism.** Length ~30-50 words; one register-naming clause + one distortion-mechanism clause connected by an em-dash or semicolon. Resists over-explaining.
- **No second-person possessive used as third-person stand-in.** Per Rule 7 / CC-047. (Most of these fields are written in the third person — *"The distortion is when love starts..."* — which is canonical for this surface; first-person and second-person register-naming happen in the framing paragraph and the live render, not in the static field content.)

These tones are locked. Tonal calibration of any individual rewrite surfaces in Report Back rather than silently revised.

---

## Acceptance

- `npx tsc --noEmit` clean.
- `npm run lint` clean.
- `npm run build` exits 0.
- All 7 `characteristic_distortion` fields ship the locked replacements verbatim.
- Both `loyalist` and `open_heart` `short_description` fields ship the locked replacements verbatim.
- `grep -n "Pauline" lib/loveMap.ts` returns only the inline comments at the top of the file (those reference the canon doc and are not user-facing). No `Pauline` references remain inside any string literal in `LOVE_REGISTERS`, `LOVE_FLAVORS`, `RESOURCE_BALANCE_PROSE`, or any predicate.
- `grep -n "Fi-driver\|Ne-driver\|Ti-driver\|Fe-driver" lib/loveMap.ts` returns zero hits.
- `grep -n "Pauline diagnostic\|Fi-driver\|Ne-driver" docs/canon/love-map.md docs/audits/report-calibration-audit-2026-04-29.md` — verify only historical references remain (in CC-044 amendment text or audit findings text). The current-state field references should be the new locked content.
- Re-rendered Jason0429 (admin route per CODEX-050) shows the Love Map's `loyalist` or `open_heart` register's `short_description` (whichever fires for him) without any framework-name leak. No *"Fi-driver"* or *"Ne-driver"* visible.
- The locked Pauline-frame paragraph at `app/components/InnerConstitutionPage.tsx:457` is unchanged (already framework-clean per CC-044's design).
- The Love Map render component (`app/components/LoveMap.tsx`) is unchanged (no new render surface for `characteristic_distortion` in this CC).
- Resource Balance prose templates unchanged.
- Predicates / threshold constants / compute functions unchanged.
- No new exports from `lib/loveMap.ts`.

---

## Out of scope

- **Surfacing `characteristic_distortion` in the Love Map render.** The field stays data-only in CC-059. A future CC may add a render surface (e.g., a "watch for" line after the register description); not now.
- **Editorial polish on the 5 framework-clean register short_descriptions** (`devoted_partner`, `parental_heart`, `chosen_family`, `companion`, `belonging_heart`). Reads cleanly at v1; not in this CC's scope.
- **Editorial polish on any of the 7 flavor `short_description` fields.** All read cleanly at v1; not in this CC's scope.
- **Editorial polish on the Resource Balance prose templates** (`healthy`, `inward_heavy`, `outward_depleted`, `thin_overall`). Locked in CC-044 and read cleanly; not in this CC's scope.
- **Editing the locked Pauline-frame paragraph** at `app/components/InnerConstitutionPage.tsx:457`. Already framework-clean.
- **Adding new flavors, registers, or Resource Balance cases.**
- **Touching predicate weights, threshold constants, or composite predicates.**
- **Touching the Love Map render component or its render position.**
- **Touching the polish-layer contract** in `lib/humanityRendering/`. The locked rewrites flow through `extractAnchors` if/when the field becomes part of the rendered surface; CC-059 doesn't pre-wire that.
- **Editing CC-058's Mirror uncomfortable-but-true selector** (`getUncomfortableButTrue`).
- **Editing the Work Map** (`lib/workMap.ts`). Same audit Rule 2 violations exist there per CC-048; a future Work-Map-prose CC handles them.
- **Adding tests.** No tests on this surface; not adding any here.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

Codex equivalent acceptable. **Filed CC- per the routing convention because the locked content is editorial-judgment-adjacent (sentences that need to land tonally), but the scope is mechanical (string replacement). Either Claude Code or Codex can execute.** If routed to Codex, the surgical scope holds; if routed to Claude Code, the tonal preservation holds.

## Execution Directive

Single pass. **All 9 locked replacements ship verbatim from this prompt's locked content.** If the executor encounters a structural surprise (e.g., the field strings have been auto-formatted in a way that complicates the search-and-replace, or a string has shifted line numbers from CC-044's ship-state), surface in Report Back rather than rewriting the locked content. **Move prompt to `prompts/completed/` when done.**

## Bash Commands Authorized

- `grep -n "Pauline\|Fi-driver\|Ne-driver\|Ti-driver\|Fe-driver" lib/loveMap.ts`
- `grep -n "characteristic_distortion\|short_description" lib/loveMap.ts`
- `grep -rn "Pauline diagnostic" docs/`
- `cat lib/loveMap.ts | sed -n '140,215p'` (or whatever range the executor verifies)
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` (smoke; kill before exit)
- `mv prompts/active/CC-059-love-map-editorial-polish.md prompts/completed/CC-059-love-map-editorial-polish.md`
- `git diff --stat`
- `git diff lib/loveMap.ts`

## Read First (Required)

- `AGENTS.md`.
- `docs/canon/result-writing-canon.md` § Rule 1 (frameworks behind the scenes).
- `docs/canon/love-map.md` (full doc; verify the field-table format expected by the canon-doc update).
- `docs/audits/report-calibration-audit-2026-04-29.md` § the rows referencing `lib/loveMap.ts` Pauline / Fi-driver / Ne-driver violations.
- `lib/loveMap.ts` lines 144-210 (LOVE_REGISTERS array) — the 7 + 2 strings being replaced.
- `app/components/LoveMap.tsx` — confirm the field render surfaces. The polish CC does NOT edit this file; reading verifies the scope claim that `characteristic_distortion` is data-only at v1.
- `app/components/InnerConstitutionPage.tsx:457` — confirm the locked Pauline-frame paragraph is framework-clean (don't edit).
- Memory — helpful context only:
  - `feedback_minimal_questions_maximum_output.md`

## Allowed to Modify

- `lib/loveMap.ts` — exactly 9 string replacements (7 `characteristic_distortion` + 2 `short_description`). No other lines.
- `docs/canon/love-map.md` — CC-059 amendment paragraph; field-table updates if the doc carries verbatim copies.
- `docs/canon/result-writing-canon.md` — CC-059 amendment under § Rule 1.
- `docs/audits/report-calibration-audit-2026-04-29.md` — RESOLVED markers on the 9 Rule 1 findings.
- **No other files.** Specifically NOT: `lib/types.ts`, `lib/workMap.ts`, `lib/identityEngine.ts`, `lib/drive.ts`, `lib/ocean.ts`, `lib/beliefHeuristics.ts`, `data/questions.ts`, `app/components/LoveMap.tsx`, `app/components/InnerConstitutionPage.tsx`, `app/components/MapSection.tsx`, `app/components/MirrorSection.tsx`, `lib/renderMirror.ts`, `lib/humanityRendering/*`, any test files.

## Report Back

1. **9 string replacements** — diff for `lib/loveMap.ts` showing each replacement. The `git diff` should show 9 hunks, one per field, each replacing one string with another. No other lines should change.
2. **Locked content verbatim** — confirmation that all 9 locked replacements ship byte-identical from this prompt.
3. **Framework-leak grep** — `grep -n "Pauline\|Fi-driver\|Ne-driver" lib/loveMap.ts` output. Expected: only inline-comment references (no string literals).
4. **Canon doc update** — line range showing the CC-059 amendment in `docs/canon/love-map.md`. If the canon doc carries verbatim copies of the field text, line ranges showing those updates too.
5. **Result-writing-canon update** — line range showing the CC-059 amendment under § Rule 1.
6. **Audit doc update** — line range(s) showing the 9 Rule 1 findings marked RESOLVED.
7. **Verification results** — tsc, lint, build all clean.
8. **Manual sweep deferred to Jason** — explicit list:
   - Re-rendered Jason0429's Love Map register `short_description` (whichever fires) shows no framework-name leak. If `loyalist` or `open_heart` fires, the rewritten version is visible.
   - The locked Pauline-frame paragraph above the Love Map renders unchanged.
   - Markdown export carries the same content.
   - Polish-layer A/B harness (when API keys set) preserves the new field strings verbatim if/when the polish layer reads them.
9. **Any deviation from locked content** — if a structural surprise prevented verbatim placement of any of the 9 strings.
10. **Prompt move-to-completed confirmation.**

---

## Notes for the executing engineer

- **Locked replacements ship verbatim.** Tone calibration is a separate authorship pass; if a sentence reads "off" tonally during your manual sweep, surface in Report Back. Do not silently revise. The 9 locked strings are the canonical text.
- **9 hunks, no more.** If `git diff lib/loveMap.ts` shows more than 9 hunks (or fewer than 9), something has gone wrong. Surface and verify.
- **Inline comments at the top of `lib/loveMap.ts`** (lines 19-44) reference *"Pauline reference (1 Corinthians 13)"* and the framework's role. Those are developer-facing comments, not user-facing prose, and the Rule 1 canon explicitly preserves canonical-doc + code-comment references to frameworks. Do NOT edit those comments.
- **The framing paragraph at `app/components/InnerConstitutionPage.tsx:457`** is the locked plain-language paraphrase of 1 Corinthians 13. It uses the qualities (*"patient and kind, persists, refuses to keep records, rejoices with truth"*) without naming Pauline. Don't edit it — it's already correct.
- **The polish-layer contract** (`lib/humanityRendering/contract.ts § extractAnchors`) does not currently extract `characteristic_distortion` because the field is not rendered. After CC-059, if/when a future CC adds the render surface, that future CC also extends `extractAnchors` to add the cleaned distortion strings to `lockedAnchors[]`. Not in CC-059's scope.
- **Pre-CC-059 saved sessions** re-render against current engine code on admin load — the new field strings populate automatically. No migration needed.
- **Per the routing convention** the prompt file moves to `prompts/completed/` when shipped. Explicit reminder.
