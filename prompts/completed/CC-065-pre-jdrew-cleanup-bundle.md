# CC-065 — Pre-JDrew Cleanup Bundle (admin export · OCEAN Rule 1 strip · cardHeader proseSlots · loveMap comment refresh · audit-doc tracking)

**Type:** Five-item cleanup bundle. **Mostly mechanical with editorial-judgment surfaces on items 1 and 2.** Locked outcomes per item. Single-pass; each item is independent and verifiable on its own. No new architecture. No new content beyond what's locked verbatim in this prompt.
**Goal:** Land all known small cleanup items before Jason's son JDrew (M.Div. + counseling/therapy) takes the assessment as the second test fixture for manual A/B comparison against Opus and ChatGPT-5+. Each item closes a known gap or follow-on flagged in prior ship reports. After CC-065 ships, JDrew's report renders against a clean engine state with the framework-name leaks stripped, repeated re-export available on the admin route, and accumulated minor follow-ons closed.
**Predecessors:** CC-021a (suppressed share block in admin detail view via `hideShareBlock` — the gate that surfaces here as the export-locking bug). CC-037 (OCEAN derivation; introduced the framework-name leaks Rule 1 caught). CC-048 (codified Rule 1). CC-059 (Love Map editorial polish; left stale inline comments at `lib/loveMap.ts:40-42` flagged in ship report). CC-063 (Trust + Responsibility cardHeaders; flagged `cardHeader` not in `proseSlots` for polish-layer protection in ship report). CODEX-062 (polish-layer anchor extraction; established the `proseSlots` extension pattern this CC reuses).
**Successor:** None hard-blocked. The full **OCEAN-as-Texture (Rule 6)** render-position relocation (Disposition Map → into Mirror layer) is a separate larger CC and remains queued. CC-065 only closes the framework-name leaks (Rule 1) — section structure unchanged.

---

## Why this CC

JDrew (M.Div. + counseling/therapy) is the next saved-session test fixture for the manual A/B pass. Five small cleanup items have accumulated; landing them before he takes the test gets the cleanest possible report into his hands and into the LLM-comparison workflow:

1. **Admin re-render route can't re-export.** The `/admin/sessions/[id]` page (per CODEX-050) hides the Print/Copy/Download share block via `hideShareBlock={true}` (CC-021a's original suppression for admin detail view). Repeated re-export is the whole point of admin re-render mode for the manual A/B workflow — feed updated reports to Opus and ChatGPT-5+ as the engine evolves. Hard block on Jason's workflow.

2. **OCEAN Rule 1 framework-name leaks** in three user-facing surfaces. JDrew's psychology / counseling background means he'll spot "Big-5" on sight. The canon (Rule 1) explicitly forbids framework names in user-facing prose. CC-037 shipped these as v1 placeholders; CC-048 audit codified them as Rule 1 violations.

3. **`cardHeader` not in `proseSlots[]`.** CC-063 ship-report flagged: Trust + Gravity cardHeaders aren't currently extracted into `lockedAnchors[]` for polish-layer protection. Not user-facing today (polish flag is OFF), but defensive close before any future flag flip. CODEX-062 closed the major polish-layer extraction gaps; this is the residual.

4. **Stale inline comments at `lib/loveMap.ts:40-42`.** CC-059 ship-report flagged: comments still describe the Pauline-prefix as a v1 placeholder needing a follow-on prose CC. CC-059 closed that closure; comments are now stale.

5. **Audit-doc finding restructuring tracking.** CC-059 surfaced the Fi-driver / Ne-driver leak as a discrete Rule 1 finding rather than buried under the Rule 2 v1-placeholder finding. Codex's in-scope improvement worth tracking explicitly so the audit doc reflects current finding structure.

Items 3-5 are tiny mechanical cleanups. Item 2 is three string edits with locked replacements. Item 1 has editorial judgment about which affordances to surface in the admin context. Bundling all five lets JDrew's pre-test sprint complete in one ship event.

---

## Item 1 — Admin re-export affordance

### Diagnosis

`InnerConstitutionPage.tsx:579` gates the Share block (Print / Copy as Markdown / Download Markdown buttons at lines 579-680ish) on `{hideShareBlock ? null : (...)}`. The buttons exist and work; they're just suppressed in the admin detail view. CC-021a's original comment at line 578 explains: *"CC-021a — suppressed in the admin detail view via hideShareBlock."*

The admin re-render route at `app/admin/sessions/[id]/page.tsx` (per CODEX-050) renders the constitution but inherits the share-block suppression. For the manual A/B workflow, that suppression now blocks repeated re-export — the whole point of admin re-render is that engine iterations should produce fresh exports.

### Locked changes

**Path α (recommended):** Add a NEW admin-only export block to `app/admin/sessions/[id]/page.tsx` rendering Copy as Markdown + Download Markdown buttons unconditionally. The buttons reuse the existing `handleCopyMarkdown` / `handleDownloadMarkdown` patterns from `InnerConstitutionPage.tsx`. The user-facing share block stays suppressed in admin view (per CC-021a's original UX intent — admin views should look distinct from user views), but the admin route adds its own unconditional export affordance. Print is dropped from the admin block (browser print is fine on either route).

Implementation sketch:

```tsx
// app/admin/sessions/[id]/page.tsx (or a co-located AdminExportPanel.tsx)

function AdminExportPanel({ constitution, demographics, sessionId }: Props) {
  function handleCopyMarkdown() {
    const md = renderMirror(constitution, demographics);
    navigator.clipboard.writeText(md);
  }
  function handleDownloadMarkdown() {
    const md = renderMirror(constitution, demographics);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sessionId}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section className="admin-export-panel">
      <SectionLabel>Admin Export — Re-Render Mode</SectionLabel>
      <p className="font-serif italic">
        Repeated export available; engine re-renders against current code on each load.
      </p>
      <div className="flex flex-row" style={{ gap: 10 }}>
        <button onClick={handleCopyMarkdown}>Copy as Markdown</button>
        <button onClick={handleDownloadMarkdown}>Download Markdown</button>
      </div>
    </section>
  );
}
```

Wire into the admin page near the top (so it's reachable without scrolling through the full report) AND/OR at the bottom of the report. Either is acceptable; executor picks.

**Render position decision:** at the top of the admin page, above the constitution render, with a clear "ADMIN EXPORT" label. Reasoning: the admin reviewer doesn't need to scroll the full report to re-export; the affordance is a tool, not a closing CTA.

The user-facing Share block at `InnerConstitutionPage.tsx:579+` is **unchanged** — still suppressed in admin view via `hideShareBlock`, still rendered in user view via the existing flow. CC-065 is purely additive on the admin side.

**Path β (rejected):** Drop the `hideShareBlock` suppression entirely. Reason for rejection: collapses the deliberate UX distinction CC-021a made between admin detail view and user-facing flow. If the admin reviewer needs different affordances than the consumer (no Print prompt; clear "Admin" labeling; positioned at the top for quick re-export), Path α serves that better.

### Acceptance per item

- New admin-only export panel renders at `/admin/sessions/[id]` for any saved session.
- Copy as Markdown copies the current re-rendered markdown to clipboard.
- Download Markdown downloads `{sessionId}-{YYYY-MM-DD}.md` (or similar canonical filename) containing the current re-rendered markdown.
- Repeated re-export works — clicking Download Markdown five times produces five identical downloads (or, more usefully, identical content if no engine change has occurred between clicks; fresh content if the engine was edited).
- The user-facing Share block at `InnerConstitutionPage.tsx:579+` is unchanged — still suppressed in admin via `hideShareBlock`; still rendered in user view.
- Markdown content matches `lib/renderMirror.ts § renderMirror(constitution, demographics)` output verbatim.
- Print button is NOT in the admin export panel (browser print works on either route; not duplicated as an admin-specific tool).

### Out of scope per item

- **PDF export.** The current implementation has no PDF generation pipeline; markdown export is the canonical path. Adding PDF export is a separate CC.
- **Editing the user-facing Share block.** CC-021a's UX distinction stays.
- **Editing `hideShareBlock` semantics.** Path α leaves it intact.
- **New admin auth or permission gating.** The `/admin/*` route is already gated; CC-065 inherits.

---

## Item 2 — OCEAN Rule 1 framework-name leak strip

### Diagnosis

Three user-facing surfaces leak framework names per CC-048 audit:

1. **`app/components/InnerConstitutionPage.tsx:320`** — Disposition Map framing paragraph: *"Big-5 personality dimensions, derived from how you answered other questions in this instrument. No single answer determines a dimension; the model reads patterns across the full question footprint."*

2. **`app/components/OceanBars.tsx:66`** — aria-label: *"Big-5 disposition distribution: Openness, Conscientiousness, Extraversion, Agreeableness, Emotional Reactivity"*

3. **`lib/ocean.ts:320`** — n-elevated case prose: *"Your distribution shows elevated emotional-reactivity proxies (${d.N}%) — formation, context, or pressure-adaptation signals that often correlate with Big-5 Neuroticism. Treat this as an estimate; the instrument measures these dimensions indirectly rather than asking about them. Outside of Reactivity, your strongest dimension reads as ${topNonNLabel} (${d[topNonN]}%)."*

Per the canon (Rule 1): framework names ("Big-5", "Neuroticism") never appear in user-facing prose. The Rule 6 broader work (relocate Disposition Map into Mirror layer + reframe percentage anchoring) is **deferred** to a future CC; CC-065 only strips the Rule 1 framework-name leaks. Section structure stays.

The other "Big-5" / "Neuroticism" hits in `lib/ocean.ts:1-30, 243` and `OceanBars.tsx:5-7, 142` are **developer comments**, not user-facing prose, and per Rule 1 canon explicitly preserve framework references in code comments / canon docs. Do NOT edit those lines.

### Locked changes

#### 2a. Framing paragraph at `InnerConstitutionPage.tsx:320`

**Before:**

> *"Big-5 personality dimensions, derived from how you answered other questions in this instrument. No single answer determines a dimension; the model reads patterns across the full question footprint."*

**After (locked):**

> *"Disposition tendencies, derived from how you answered other questions in this instrument. No single answer determines a tendency; the model reads patterns across the full question footprint."*

Two substitutions: *"Big-5 personality dimensions"* → *"Disposition tendencies"*; *"No single answer determines a dimension"* → *"No single answer determines a tendency"*. Rule 1 leak closed; the paragraph's role (introducing the section) preserved.

#### 2b. aria-label at `OceanBars.tsx:66`

**Before:**

```tsx
aria-label="Big-5 disposition distribution: Openness, Conscientiousness, Extraversion, Agreeableness, Emotional Reactivity"
```

**After (locked):**

```tsx
aria-label="Disposition distribution: Openness, Conscientiousness, Extraversion, Agreeableness, Emotional Reactivity"
```

Drops *"Big-5"*. Screen-reader announcement now matches the visible "Disposition Map" register.

#### 2c. n-elevated case prose at `lib/ocean.ts:320`

**Before:**

> *"Your distribution shows elevated emotional-reactivity proxies (${d.N}%) — formation, context, or pressure-adaptation signals that often correlate with Big-5 Neuroticism. Treat this as an estimate; the instrument measures these dimensions indirectly rather than asking about them. Outside of Reactivity, your strongest dimension reads as ${topNonNLabel} (${d[topNonN]}%)."*

**After (locked):**

> *"Your distribution shows elevated emotional-reactivity proxies (${d.N}%) — formation, context, or pressure-adaptation signals worth treating as an estimate, since the instrument measures this register indirectly rather than asking about it. Outside of Reactivity, your strongest tendency reads as ${topNonNLabel} (${d[topNonN]}%)."*

Substitutions: drops *"that often correlate with Big-5 Neuroticism. Treat this as an estimate; the instrument measures these dimensions indirectly rather than asking about them"* → *"worth treating as an estimate, since the instrument measures this register indirectly rather than asking about it"* (closes the framework-name leak; preserves the load-bearing "estimated" caveat); *"strongest dimension"* → *"strongest tendency"*.

### Acceptance per item

- `grep -n "Big-5\|Big 5\|Neuroticism" app/components/InnerConstitutionPage.tsx app/components/OceanBars.tsx lib/ocean.ts` returns **only developer-comment hits** (lines `1-30, 243` in `lib/ocean.ts`; `5-7, 142` in `OceanBars.tsx`; `288` in `InnerConstitutionPage.tsx`). Zero hits in user-facing prose / aria-labels.
- Framing paragraph at `InnerConstitutionPage.tsx:320` reads the locked rewrite verbatim.
- aria-label at `OceanBars.tsx:66` reads the locked rewrite verbatim.
- n-elevated case prose at `lib/ocean.ts:320` reads the locked rewrite verbatim.
- The `(estimated)` parenthetical on the N axis subscript (per CC-037 canon) is unchanged — load-bearing per `feedback_minimal_questions_maximum_output.md` precedent.
- Section header *"Disposition Map"* unchanged (already canon-compliant — no framework name).
- Section render position unchanged (Rule 6 relocation deferred).
- Other OCEAN case prose (single-dominant / two-dominant / balanced at `lib/ocean.ts:309-313`) **unchanged** — those are Rule 6 violations (percentage anchoring, framework-architecture meta-prose), not Rule 1, and stay for the future Rule 6 CC.

### Out of scope per item

- **Rule 6 OCEAN-as-Texture refactor.** Section relocation into Mirror layer + reframed copy ("how these tendencies show up in your week") + drop percentage anchoring. Future CC.
- **Editing other OCEAN case prose** (single-dominant / two-dominant / balanced). Rule 6 violations; future CC.
- **Editing `OceanBars.tsx`'s `(estimated)` subscript.** Load-bearing per CC-037 canon.
- **Editing `BUCKET_LABEL` Records or the canonical *"Emotional Reactivity"* relabel.** Already canon-compliant.
- **Editing developer comments** in `lib/ocean.ts:1-30, 243` or `OceanBars.tsx:5-7, 142` or `InnerConstitutionPage.tsx:288`. Rule 1 explicitly preserves framework references in code comments.

---

## Item 3 — `cardHeader` proseSlots extension

### Diagnosis

CC-063 ship-report (2026-05-01) flagged: `cardHeader` is not currently in `proseSlots[]` per `lib/humanityRendering/contract.ts § buildEngineRenderedReport`. The Trust + Gravity cardHeaders rewritten by CC-063 (and any other card's cardHeader) flow into the engine-rendered report but not into the polish-layer's `lockedAnchors[]` extraction — meaning a future polish-flag activation could in theory let an LLM rewrite the cardHeaders without validation catching it.

CODEX-062 closed the major polish-layer extraction gaps (tension `user_prompt`, growth-edge / blind-spot anchors via card extraction). This is the residual.

### Locked changes

In `lib/humanityRendering/contract.ts § buildEngineRenderedReport`, extend the proseSlots loop to push every card's `cardHeader` (when non-empty) onto the appropriate slot key. Pattern matches the existing card-prose extraction at the same loop:

```ts
// Per-card extraction loop (existing):
for (const cardKey of cardKeys) {
  const cardOutput = constitution.shape_outputs[cardKey];
  if (!cardOutput) continue;
  // existing: gift, blindSpot, riskUnderPressure prose extraction
  // ...
  // CC-065 — extend to cover cardHeader for polish-layer protection.
  if (cardOutput.cardHeader && cardOutput.cardHeader.length > 0) {
    proseSlots[`card.${cardKey}.card_header`] = cardOutput.cardHeader;
  }
}
```

The exact key naming follows the existing `proseSlots` convention (per the existing slot keys; if they use snake_case `card.lens.gift`, follow snake_case; if camelCase, follow camelCase). Verify by reading the existing `buildEngineRenderedReport` extraction loop.

The validation pass in `lib/humanityRendering/validation.ts` already iterates `proseSlots` doing substring-match comparisons; the new slot flows through automatically without further edit.

### Acceptance per item

- `buildEngineRenderedReport` adds `card.${cardKey}.card_header` (or canonical equivalent) to `proseSlots` for each card with a non-empty `cardHeader`.
- Existing `proseSlots` keys unchanged; addition is purely additive.
- A test against Jason0429 shows `proseSlots` now includes 8 new entries (one per ShapeCard) with the rendered cardHeader content.
- A synthetic polish output that edits a cardHeader triggers validation failure via the existing `proseSlots` substring match. (Unless the cardHeader was empty for that card; thin-signal cards with empty headers are not in the slots, which is correct.)
- No edits to `validatePolish`, polish-layer system prompt, or any adapter. Pure extraction extension.

### Out of scope per item

- **Editing existing `proseSlots` keys.** Pure additive.
- **Editing the polish-layer system prompt.** The prompt already references `proseSlots` as substance to preserve; new keys flow automatically.
- **Adding card-section extraction** beyond cardHeader (e.g., per-card pattern notes, practice cells). Future scope if needed.

---

## Item 4 — Stale `lib/loveMap.ts:40-42` inline comments

### Diagnosis

CC-059 ship-report flagged (2026-05-01): inline comments at `lib/loveMap.ts:40-42` describe the Pauline-prefix as a v1 placeholder needing a follow-on prose CC. CC-059 closed that closure; comments are now stale and misleading.

### Locked changes

Read the current comment block at `lib/loveMap.ts:38-44` (or whatever range carries the stale text). The comments reference *"the v1 placeholder `characteristic_distortion` strings currently include literal 'Pauline diagnostic:' prefix..."* and similar.

Update to reflect post-CC-059 state: the Pauline-prefix has been stripped; the framework reference lives in canon doc + this file's developer-facing context comments only. Keep the Pauline-reference architectural-context comment (developer-facing, Rule 1 preserves) but drop the *"v1 placeholder"* and *"currently includes"* language.

Suggested replacement (executor adapts based on actual current text):

```ts
// CC-059 (2026-05-01) — Pauline-prefix references stripped from
// `characteristic_distortion` fields. The Pauline reference (1 Corinthians 13)
// remains the architectural source for distortion-diagnostic vocabulary
// per `docs/canon/love-map.md`; user-facing prose paraphrases it in plain
// language. Per Rule 1, the framework name itself never surfaces in
// user-visible field content.
```

The exact wording is at executor discretion as long as the stale "v1 placeholder" / "currently includes" framing is removed and the post-CC-059 state is described accurately.

### Acceptance per item

- `lib/loveMap.ts:40-42` (or canonical range) no longer describes the Pauline-prefix as a v1 placeholder pending closure.
- Comment block accurately reflects post-CC-059 closure state.
- Pauline-reference developer context preserved.
- No code changes; comments only.

### Out of scope per item

- Editing any string literal (those shipped verbatim in CC-059).
- Editing any other `lib/loveMap.ts` content beyond the named comment range.

---

## Item 5 — Audit-doc finding restructuring tracking

### Diagnosis

CC-059 ship-report (2026-05-01) noted Codex's in-scope improvement: the Fi-driver / Ne-driver register-label leaks (`loyalist` / `open_heart` short_descriptions) were originally grouped under the Rule 2 v1-placeholder finding in the audit. Codex surfaced them as a discrete Rule 1 finding for traceability. Worth tracking explicitly so the audit doc reflects current finding structure.

### Locked changes

In `docs/audits/report-calibration-audit-2026-04-29.md § 2.3` (or wherever the loveMap findings cluster), confirm the Fi-driver / Ne-driver Rule 1 finding is explicitly enumerated as its own row, marked RESOLVED by CC-059. If the row already exists per CC-059's audit-doc edit, no further action; if it's still buried under the v1-placeholder finding, surface it explicitly.

If the audit doc's finding count tables (§ 3 aggregated counts) need updating to reflect the surfaced finding (e.g., Rule 1 count was implicitly incremented when CC-059 surfaced this; confirm the count is correct), update accordingly.

### Acceptance per item

- Audit doc `docs/audits/report-calibration-audit-2026-04-29.md` carries the Fi-driver / Ne-driver leak as a discrete Rule 1 finding (whether surfaced by CC-059 or surfaced now), marked ✅ RESOLVED CC-059.
- Aggregated count tables in § 3 reflect the finding consistently.
- No other audit-doc edits.

### Out of scope per item

- Adding new findings to the audit. CC-065 only tracks the CC-059-surfaced restructuring.
- Editing other Rule findings.
- Editing other audit doc sections.

---

## Cross-item acceptance

- `npx tsc --noEmit` clean.
- `npm run lint` clean.
- `npm run build` exits 0.
- All five items shipped per their respective Acceptance sections.
- No regression: re-rendered Jason0429 still shows all surfaces working as expected (Mirror golden sentence + uncomfortable-but-true; Compass with Faith Shape; Trust + Gravity cardHeaders; Love Map without framework-name leaks; Open Tensions including T-016; "What this is good for" closer).
- Manual sweep deferred to Jason: confirm the admin route at `/admin/sessions/[id]` shows the new export panel; click Download Markdown twice in succession and verify two identical downloads occur; verify Big-5 / Neuroticism strings no longer appear in user-facing prose at the Disposition Map, OceanBars aria-label, or n-elevated case prose; verify polish-layer A/B harness (when API keys set) preserves cardHeaders via the new `proseSlots` extraction.

---

## Out of scope (whole CC)

- **OCEAN-as-Texture (Rule 6) full refactor.** Render-position relocation + percentage anchoring rework. Future sizable CC.
- **PDF export pipeline.** Not currently implemented; future CC if account-holder PDF deliverable activates.
- **Path β export-locking fix** (drop `hideShareBlock` suppression). Path α was chosen.
- **MVP product-vision work** (auth/account/PDF/newsletter/share/population). Out of scope per `project_mvp_product_vision.md`.
- **v2.5 Universal-Three restructure.** Defer.
- **workMap-prose closure.** Defer.
- **Path Contribution-Verbs question.** Held architecture.
- **Adding tests.** No tests on these surfaces; not adding any here.
- **CC-057c provider lock.** Pending Jason's manual A/B pass with JDrew + Clarence.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

This CC is filed CC- per the routing convention because the bundle includes editorial-judgment surfaces (export-affordance UX in Item 1; OCEAN framing-paragraph rewrite in Item 2) despite the mostly-mechanical scope of Items 3-5. Claude Code is the intended executor.

## Execution Directive

Single pass. Five items; verify each independently. **All locked content ships verbatim from this prompt's locked content sections.** Do not paraphrase, reorder, or "improve" the locked OCEAN rewrites or the admin export panel scaffolding. If the executor encounters a structural surprise (e.g., `proseSlots` key naming differs from snake_case; the admin re-render route's component structure doesn't have a clean wire point for the new export panel; the audit doc's finding restructuring was already done by CC-059 making Item 5 a no-op), surface in Report Back rather than restructuring on the fly. **Move prompt to `prompts/completed/` when done.**

## Bash Commands Authorized

- `grep -rn "Big-5\|Big 5\|Neuroticism" app/ lib/ docs/canon/result-writing-canon.md`
- `grep -n "hideShareBlock\|handleCopyMarkdown\|handleDownloadMarkdown\|handlePrint" app/components/InnerConstitutionPage.tsx app/admin/sessions/`
- `grep -n "proseSlots\|cardHeader\|buildEngineRenderedReport" lib/humanityRendering/contract.ts lib/humanityRendering/types.ts`
- `grep -n "Pauline diagnostic\|v1 placeholder" lib/loveMap.ts`
- `grep -n "Fi-driver\|Ne-driver" docs/audits/report-calibration-audit-2026-04-29.md`
- `cat lib/ocean.ts | sed -n '300,330p'`
- `cat app/components/InnerConstitutionPage.tsx | sed -n '285,330p'`
- `cat app/components/OceanBars.tsx | sed -n '60,75p'`
- `cat lib/loveMap.ts | sed -n '30,50p'`
- `cat lib/humanityRendering/contract.ts`
- `cat app/admin/sessions/\[id\]/page.tsx`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` (smoke; kill before exit)
- `mv prompts/active/CC-065-pre-jdrew-cleanup-bundle.md prompts/completed/CC-065-pre-jdrew-cleanup-bundle.md`
- `git diff --stat`
- `git diff app/components/InnerConstitutionPage.tsx app/components/OceanBars.tsx lib/ocean.ts lib/humanityRendering/contract.ts lib/loveMap.ts app/admin/sessions/`

## Read First (Required)

- `AGENTS.md`.
- `docs/canon/result-writing-canon.md` § Rule 1 (frameworks behind the scenes).
- `docs/audits/report-calibration-audit-2026-04-29.md` § Rule 1 OCEAN findings (lines ~305-321 per the audit), § Rule 6 deferral note, § 2.3 loveMap findings.
- `app/components/InnerConstitutionPage.tsx` lines 285-330 (Disposition Map render area + framing paragraph) and lines 575-680 (Share block + `hideShareBlock` gate).
- `app/components/OceanBars.tsx` lines 60-75 (aria-label).
- `lib/ocean.ts` lines 300-330 (n-elevated case prose).
- `lib/loveMap.ts` lines 30-50 (stale comment block).
- `lib/humanityRendering/contract.ts` (full file; `proseSlots` extraction loop and `extractAnchors` flow).
- `app/admin/sessions/[id]/page.tsx` (full file; admin re-render entry; wire site for new export panel).
- `lib/renderMirror.ts` (the markdown export composer the admin export panel reuses).
- Memory:
  - `feedback_shapecard_field_inversion.md` (cardHeader is unaffected by the field-inversion that affects growthEdge/blindSpot — it's the title field).

## Allowed to Modify

- `app/admin/sessions/[id]/page.tsx` (new admin export panel; either inline or in a co-located AdminExportPanel.tsx component).
- New file `app/admin/sessions/[id]/AdminExportPanel.tsx` (optional; if executor prefers component extraction).
- `app/components/InnerConstitutionPage.tsx` (Item 2a — framing paragraph rewrite at line ~320; user-facing Share block UNCHANGED).
- `app/components/OceanBars.tsx` (Item 2b — aria-label rewrite only; SVG / chart logic UNCHANGED).
- `lib/ocean.ts` (Item 2c — n-elevated case prose at line ~320 ONLY; other case prose UNCHANGED).
- `lib/humanityRendering/contract.ts` (Item 3 — `proseSlots` extension only; rest of file UNCHANGED).
- `lib/loveMap.ts` (Item 4 — comment refresh at lines ~40-42 ONLY; all string literals and code UNCHANGED).
- `docs/audits/report-calibration-audit-2026-04-29.md` (Item 5 — finding restructuring tracking; OCEAN Rule 1 RESOLVED markers).
- `docs/canon/result-writing-canon.md` (CC-065 amendment paragraph under § Rule 1 noting the OCEAN closure; under § Rule 5 if any cross-reference to admin export workflow is warranted).
- **No other files.** Specifically NOT: `lib/identityEngine.ts`, `lib/loveMap.ts` string literals, `lib/workMap.ts`, `lib/drive.ts`, `lib/types.ts`, `lib/beliefHeuristics.ts`, `data/questions.ts`, `lib/humanityRendering/validation.ts`, `lib/humanityRendering/prompt.ts`, `lib/humanityRendering/index.ts`, `lib/humanityRendering/abHarness.ts`, `lib/humanityRendering/providers/*`, any test files.

## Report Back

1. **Item 1 (admin export):** new component / wire-in diff; confirmation that the user-facing Share block at `InnerConstitutionPage.tsx:579+` is unchanged; demo screenshot or markdown excerpt of the admin export panel rendering at `/admin/sessions/[id]`.
2. **Item 2a (framing paragraph):** diff at `InnerConstitutionPage.tsx:320` showing the locked rewrite verbatim.
3. **Item 2b (aria-label):** diff at `OceanBars.tsx:66` showing the locked rewrite verbatim.
4. **Item 2c (n-elevated prose):** diff at `lib/ocean.ts:320` showing the locked rewrite verbatim.
5. **Big-5 / Neuroticism final grep:** `grep -rn "Big-5\|Big 5\|Neuroticism" app/ lib/` output. Only developer-comment hits should remain; zero in user-facing prose / aria-labels.
6. **Item 3 (proseSlots cardHeader):** diff for `buildEngineRenderedReport` showing the new extraction; sample `proseSlots` keys for Jason0429 confirming 8 new card_header entries.
7. **Item 4 (loveMap comments):** diff at `lib/loveMap.ts:40-42` (or canonical range) showing the comment refresh.
8. **Item 5 (audit doc):** line ranges showing the Fi-driver / Ne-driver finding restructuring; confirmation the audit doc carries it as a discrete Rule 1 row marked RESOLVED CC-059.
9. **Canon doc updates:** line ranges for the CC-065 amendment under § Rule 1 (OCEAN closure note).
10. **Verification:** tsc, lint, build all clean.
11. **Manual sweep deferred to Jason:**
    - Admin route at `/admin/sessions/[id]` shows the new export panel above the constitution; clicking Download Markdown twice in succession produces two identical downloads.
    - Re-rendered Jason0429 Disposition Map renders the locked framing paragraph (no "Big-5" visible).
    - aria-label on the OceanBars chart no longer includes "Big-5".
    - n-elevated case prose (if Jason0429 fires that case) renders the locked rewrite (no "Neuroticism" / "Big-5").
    - Polish-layer A/B harness (when API keys set) extracts cardHeaders into the validation pass (verify by reading the engine report's proseSlots in the harness debug output).
12. **Any deviation from locked content** — surface explicitly.
13. **Prompt move-to-completed confirmation.**

---

## Notes for the executing engineer

- **CC-065 is a five-item bundle.** Verify each item independently in the manual sweep. None of the five depend on the others; failure of one shouldn't block the others.
- **Items 1 and 2 land before JDrew takes the assessment** — they're the user-visible cleanup that JDrew's M.Div. + counseling lens would catch immediately. Items 3-5 are mechanical / canon hygiene; ship together for cheaper review.
- **Path α on Item 1 is locked.** Adding a NEW admin-only export panel; user-facing Share block stays suppressed in admin via `hideShareBlock`. Don't drop the suppression (Path β rejected).
- **OCEAN Rule 6 (render-position relocation) is explicitly OUT of CC-065.** Future larger CC. Don't attempt to relocate the Disposition Map into the Mirror layer in this CC.
- **Developer comments preserved per Rule 1 canon.** "Big-5" / "Neuroticism" mentions in `lib/ocean.ts:1-30, 243` and `OceanBars.tsx:5-7, 142` and `InnerConstitutionPage.tsx:288` are all developer-facing; do NOT edit those lines.
- **The `(estimated)` parenthetical** on the N axis subscript per CC-037 is load-bearing. Do NOT remove or alter.
- **`proseSlots` key naming convention** — verify by reading existing keys in `buildEngineRenderedReport`. Use the same casing convention (snake_case `card.lens.gift` or camelCase `card.lens.gift` — match what's there).
- **Markdown export filename** for Item 1 — suggestion `${sessionId}-${YYYY-MM-DD}.md`. Adapt if a different convention is in use elsewhere.
- **CC-059 follow-on items 4-5** are tiny by design. If either turns out to already be handled by CC-059's audit-doc edits, mark as no-op and surface in Report Back.
- **Per the routing convention** the prompt file moves to `prompts/completed/` when shipped.
- **Pre-CC-065 saved sessions** re-render against current engine code on admin load; no migration needed.
- **CC-065 sequencing:** ships standalone; no file conflicts with active queue (only CC-064 is in active/, which touches identityEngine — different file). Active queue post-ship: empty.
