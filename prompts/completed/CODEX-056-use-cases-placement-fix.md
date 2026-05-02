# CODEX-056 — UseCasesSection Placement Fix (move to absolute closer position before footer)

*(Filename CODEX-056 per the agent-routing convention 2026-04-29: surgical / mechanical scope; two-file move with locked outcome and no judgment calls.)*

**Type:** Surgical two-file move. **No new logic. No new prose. No content changes. No canon edits.** Repositioning of an existing component on the on-page render and its mirror in the markdown export so it lands as the absolute closer before the footer rather than interrupting the synthesis trio.
**Goal:** Move `UseCasesSection` from its current position (between body cards and synthesis closer) to the absolute end of user-facing content (after the synthesis closer trio, after Open Tensions, after A Synthesis, immediately before the footer). On both the on-page render (`app/components/InnerConstitutionPage.tsx`) and the markdown export (`lib/renderMirror.ts`).
**Predecessors:** CODEX-055 Item 2 — shipped `UseCasesSection` and wired it. The wire-in seam Codex chose ("after MapSection / after Path · Gait") landed it before the synthesis trio because there's no `PathSection` component in this checkout. Defensible at ship time; the synthesis trio (Growth Path / Conflict Translation / Mirror-Types Seed) is the actual Path/Next-Move surface here, so UseCases should follow it, not precede it.
**Successor:** None hard-blocked. Closes a placement defect from CODEX-055 before the next CC fires.

---

## Why this CODEX

CODEX-055 Item 2 successfully shipped the new `UseCasesSection` component with the locked content for all ten use cases. The wire-in placement landed UseCases between `MapSection` (body) and `Growth Path / Conflict Translation / Mirror-Types Seed` (synthesis closer). Reading order:

```
Body cards (Map / Disposition / Work / Love)
UseCasesSection         ← currently here (interrupts the close)
Growth Path
Conflict Translation
Mirror-Types Seed
Open Tensions (when present)
A Synthesis (when present)
Footer
```

The use-cases section is the report's *"what this is good for"* closer — instructional, applied, designed to land at the end of the read. Placed mid-flow, it interrupts the synthesis arc; placed at the end, it closes the report cleanly.

Target reading order:

```
Body cards (Map / Disposition / Work / Love)
Growth Path
Conflict Translation
Mirror-Types Seed
Open Tensions (when present)
A Synthesis (when present)
UseCasesSection         ← target position (absolute closer before footer)
Footer
```

The fix is mechanical. Two files, two moves. No content changes. No new logic.

---

## Locked changes

### Move 1: `app/components/InnerConstitutionPage.tsx`

Current state (lines 467-502 region):

```tsx
<MapSection constitution={constitution} demographics={demographics} />

<SectionRule />

<UseCasesSection />              ← currently at line 471

<SectionRule />

{/* Remaining synthesis — Growth Path, Conflict Translation, Mirror-Types Seed */}
<section ...>
  <SectionLabel>Growth Path</SectionLabel>
  ...
</section>

<SectionRule />

<section ...>
  <SectionLabel>Conflict Translation</SectionLabel>
  ...
</section>

<SectionRule />

<section ...>
  <SectionLabel>Mirror-Types Seed</SectionLabel>
  ...
</section>

{confirmedTensions.length > 0 ? (
  <>
    <SectionRule />
    <section ...>
      ... Open Tensions ...
    </section>
  </>
) : null}

... A Synthesis section (similarly conditional on simpleSummary non-empty)
... footer
```

Target state:

1. Remove the existing `<UseCasesSection />` and its surrounding `<SectionRule />` separators at lines ~469-473 (the line emit immediately following `<MapSection ...>` and the SectionRule above and below it).
2. Insert `<UseCasesSection />` (with appropriate `<SectionRule />` separation) **after** the A Synthesis section (or after Open Tensions if A Synthesis is absent / conditionally not rendered) and **before** the footer.
3. Use the same `<SectionRule />` separation pattern the existing surrounding sections use; keep the visual rhythm consistent.

The placement should be unconditional: UseCases renders for every report, regardless of whether Open Tensions or A Synthesis fired. UseCases sits at the end of the user-facing content unconditionally; the footer always follows.

If the executor finds that the on-page A Synthesis section is itself unconditional (always renders, even when simpleSummary is empty, with a degraded display), UseCases lands right after it. If A Synthesis is conditional (only renders when simpleSummary is non-empty), UseCases lands after the conditional A Synthesis block such that — whether or not A Synthesis renders — UseCases is the last content before the footer.

### Move 2: `lib/renderMirror.ts`

Current state (lines ~467-525 region):

```ts
emitPatternBlock("path");

// 12. Use-cases section.
out.push("");
out.push(`## ${USE_CASES_SECTION_TITLE}`);
out.push("");
out.push(`*${USE_CASES_SECTION_SUBHEAD}*`);
for (const useCase of USE_CASES) {
  out.push("");
  out.push(`**${useCase.title}** ${useCase.body}`);
}

// 13-15. Cross-card synthesis.
const cross = constitution.cross_card;
out.push("");
out.push("## Growth Path");
...
out.push("## Conflict Translation");
...
out.push("## Mirror-Types Seed");
...

// 16. Open Tensions — every fired tension that isn't already in the
// Allocation Gaps section.
...

// CC-022c — A Synthesis (Simple Summary). Sits at the end of the body
// content, just before the footer.
const simpleSummary = generateSimpleSummary(constitution, demographics).trim();
if (simpleSummary.length > 0) {
  out.push("");
  out.push("## A Synthesis");
  ...
}

// 17. Footer.
out.push("");
out.push("---");
```

Target state:

1. Cut the use-cases block (lines 469-477 — the block beginning `// 12. Use-cases section.` through the end of the `for (const useCase of USE_CASES)` loop, including the leading `out.push("")`).
2. Paste it **after** the A Synthesis block (after the closing `}` of the `if (simpleSummary.length > 0)` conditional at line ~525) and **before** the footer comment / footer emit at line ~527.
3. Leave the existing leading `out.push("");` separator pattern in place; the moved block already includes its own leading blank line.
4. Update the inline comment numbering: the moved block is no longer "// 12." Renumber it to follow the synthesis sequence — e.g., "// 17. Use-cases section (closer before footer)." Renumber the footer comment from "// 17." to "// 18." Keep numbering monotonic for future readers; not load-bearing, but consistent.

The result: the markdown export's section sequence becomes:

```
## Path · Gait
## Growth Path
## Conflict Translation
## Mirror-Types Seed
## Open Tensions  (when openTensions.length > 0)
## A Synthesis  (when simpleSummary non-empty)
## What this is good for  ← moved here
---  (footer)
```

The use-cases section in the export is now unconditional, runs verbatim, and closes the document right before the horizontal-rule footer.

---

## Acceptance

- `npx tsc --noEmit` exits 0.
- `npm run lint` clean.
- `npm run build` exits 0.
- On-page render of any saved session shows the new section order: synthesis trio → conditional Open Tensions → conditional A Synthesis → UseCasesSection → footer. UseCases is always the last user-facing content before the footer.
- Markdown export of any saved session shows the new section order: `## Path · Gait` → `## Growth Path` → `## Conflict Translation` → `## Mirror-Types Seed` → optional `## Open Tensions` → optional `## A Synthesis` → `## What this is good for` → `---` (footer).
- The locked use-case content (heading, subhead, all ten paragraphs) ships unchanged from CODEX-055 Item 2; this CC only moves the rendering position.
- `grep -rn "What this is good for" app/ lib/` returns the same source files (the new component file from CODEX-055 + the markdown emit in `renderMirror.ts`); no duplications introduced.
- No other section's render position changes. Synthesis trio (Growth Path / Conflict Translation / Mirror-Types Seed) keeps its existing relative order, before Open Tensions and A Synthesis. Only the UseCasesSection position changes.

---

## Verification — manual

After ship, Jason verifies on the admin re-rendered Jason0429 session:

- "What this is good for" appears at the very end of the user-facing content, immediately before the footer.
- Synthesis trio (Growth Path / Conflict Translation / Mirror-Types Seed) appears in its original mid-flow position, no longer interrupted by UseCases.
- Markdown export carries the same order.
- All ten use-case paragraphs still render verbatim with locked titles and bodies.

---

## Out of scope

- **Editing the use-case content.** Locked from CODEX-055 Item 2; this CC only moves position.
- **Editing the synthesis trio or any other section.** Pure UseCases placement change.
- **Conditionalizing UseCases on signal patterns.** Static content; renders for every user.
- **Changing the SectionRule separator pattern.** Use whatever the surrounding sections use; consistent visual rhythm.
- **Moving Open Tensions or A Synthesis.** Their positions are unchanged.
- **Touching `lib/identityEngine.ts` or any engine logic.**
- **Adding tests.**
- **Editing canon docs.** This is a surface-render fix; no canon implications.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

Codex equivalent acceptable. **Filed CODEX- per the routing convention because the scope is surgical / mechanical with locked outcome.**

## Execution Directive

Single pass. Two files, two moves. No content changes; verify before ship that `git diff` shows only repositioning, not modification, of the use-cases content. **Move prompt to `prompts/completed/` when done.**

## Bash Commands Authorized

- `grep -rn "UseCasesSection\|USE_CASES_SECTION_TITLE\|What this is good for" app/ lib/`
- `cat app/components/InnerConstitutionPage.tsx`
- `cat lib/renderMirror.ts`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` (smoke; kill before exit)
- `mv prompts/active/CODEX-056-use-cases-placement-fix.md prompts/completed/CODEX-056-use-cases-placement-fix.md`
- `git diff --stat`
- `git diff app/components/InnerConstitutionPage.tsx lib/renderMirror.ts`

## Read First (Required)

- `AGENTS.md`.
- `app/components/InnerConstitutionPage.tsx` — full structure of the render order to identify the correct paste point after A Synthesis / Open Tensions / immediately before footer.
- `lib/renderMirror.ts` — full structure of the markdown export to identify the correct paste point after the A Synthesis block and before the footer.
- `app/components/UseCasesSection.tsx` — verify the component is unchanged and exports cleanly (no need to modify; just confirm import path stays valid).

## Allowed to Modify

- `app/components/InnerConstitutionPage.tsx` (Move 1 only).
- `lib/renderMirror.ts` (Move 2 only).
- **No other files.** No engine logic, no canon docs, no component content edits.

## Report Back

1. **Move 1:** before/after line range for `<UseCasesSection />` in `InnerConstitutionPage.tsx`. Confirmation that the section now lands after A Synthesis (and after Open Tensions when present) and before the footer.
2. **Move 2:** before/after line range for the use-cases block in `renderMirror.ts`. Confirmation that the block now lands after the A Synthesis conditional close and before the footer comment / footer emit. Confirmation that the inline comment numbering is updated.
3. **Verification:** tsc, lint, build all clean. `git diff app/components/InnerConstitutionPage.tsx lib/renderMirror.ts` shows only relocation, not modification, of the use-cases content (use-case titles and bodies appear identically pre/post diff).
4. **Manual sweep deferred to Jason** — verify on the admin re-rendered session: UseCases is the absolute closer before the footer; synthesis trio is uninterrupted; markdown export mirrors.
5. **Any deviation** — if a structural surprise (e.g., A Synthesis is rendered inside a wrapper that complicates the paste, or the conditionalization of A Synthesis differs in the on-page vs export surfaces) required a different placement choice. Surface in Report Back; do not silently revise the target.
6. **Prompt move-to-completed confirmation.**

---

## Notes for the executing engineer

- This is a placement-only fix. Resist any temptation to edit the use-case content, restructure the synthesis trio, or refactor the conditional rendering for Open Tensions / A Synthesis. None of those are scope.
- The intent: UseCases is the report's instructional closer. *"Here's how to use this read."* That register lands cleanly only at the end. Mid-flow, it interrupts the synthesis arc.
- The on-page surface and the markdown export must match in order. If the conditional rendering for A Synthesis differs between the two (e.g., on-page always renders A Synthesis with a degraded fallback; export only renders when non-empty), keep UseCases as the absolute final non-footer content in both cases. The unconditional placement principle holds across both surfaces.
- Per the routing convention, the prompt file moves to `prompts/completed/` when shipped. Explicit reminder.
- Pre-CODEX-056 saved sessions re-render against current rendering code on admin load; no migration needed.
