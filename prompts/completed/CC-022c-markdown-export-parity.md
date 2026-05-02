# CC-022c — Markdown Export Parity (Cross-Card Patterns + Simple Summary + Keystone Citation in Markdown)

## Launch Directive

You are executing CC-022c. This is a small follow-up CC that closes the gap between CC-022b's on-screen prose enhancements and the Print / Download-Markdown surfaces shipped by CC-020.

CC-022b shipped three new prose surfaces visible only on screen:

1. **Cross-card pattern observations** rendered inside expanded Map cards.
2. **Simple Summary** closing section with all three closing patterns (parallel lines, gift/danger compression, *"not X, but Y"* thesis).
3. **Keystone Reflection selection citation** with the user's actual Q-I2 / Q-I3 selections cited by source-question label.

The Markdown export (`lib/renderMirror.ts`) was not in CC-022b's allow-list. Result: a saved session that downloads as Markdown receives the pre-CC-022b prose register, while the on-screen render receives the enriched register. Same session, two different reads. CC-022c closes the gap.

The CC is scope-tight: the engine logic is unchanged, the cross-card pattern catalog is unchanged, the Simple Summary structure is unchanged, the Keystone citation prose function is unchanged. CC-022c only **wires** the existing engine outputs into the markdown renderer.

Sequenced after CC-022b ships. Independent of any pending visual-design or vendor-setup work.

## Bash Authorized

Yes. Use the shell freely for `tsc`, `eslint`, dev-server smoke runs, and any inspection scripts. Do not commit or push.

## Execution Directive

### Item 1 — Extend `RenderArgs` to accept `answers`

**File**: `lib/renderMirror.ts`.

Current `RenderArgs` shape:

```ts
type RenderArgs = {
  constitution: InnerConstitution;
  demographics?: DemographicSet | null;
  includeBeliefAnchor: boolean;
  generatedAt?: Date;
};
```

Add optional `answers?: Answer[]`:

```ts
type RenderArgs = {
  constitution: InnerConstitution;
  demographics?: DemographicSet | null;
  answers?: Answer[];                    // CC-022c — for Keystone selection citation
  includeBeliefAnchor: boolean;
  generatedAt?: Date;
};
```

`answers` is optional for backward-compatibility with any call site that doesn't yet pass it; when missing, the Keystone citation falls back to CC-017's generic dimension-label prose (the existing `generateBeliefContextProse` behavior CC-022b already preserved).

### Item 2 — Wire Keystone selection citation through to markdown export

**File**: `lib/renderMirror.ts` (where `generateBeliefContextProse` is currently called).

The current call site passes `(belief, valuesPhraseFromCompass)`. CC-022b extended the function signature to accept `(belief, valuesPhraseFromCompass, answers?, demographics?)`. Update the call site in `renderMirror.ts` to pass through `answers` and `demographics`:

```ts
// Existing call (replace this)
const beliefProse = generateBeliefContextProse(belief, valuesPhraseFromCompass);

// CC-022c replacement
const beliefProse = generateBeliefContextProse(
  belief,
  valuesPhraseFromCompass,
  args.answers,
  args.demographics
);
```

This automatically threads the user's actual Q-I2 / Q-I3 selections into the markdown's Keystone Reflection section, matching the on-screen render. Including the Q-I3 None-selected structural acknowledgment.

### Item 3 — Insert cross-card pattern prose into Map sub-sections

**File**: `lib/renderMirror.ts`.

CC-022b's `detectCrossCardPatterns(signals, topCompass, topGravity, demographics?)` function returns the active patterns and their prose. Each pattern has an `applicable_card: ShapeCardId` indicating which Map card it should appear in.

In the markdown renderer's Map section (where the per-card SWOT subsections are written), call `detectCrossCardPatterns` once at the top and group the results by `applicable_card`:

```ts
import { detectCrossCardPatterns } from "./identityEngine";

// Inside renderMirrorAsMarkdown, after constitution is destructured:
const signals = constitution.signals;
const topCompass = constitution.topCompass ?? [];
const topGravity = constitution.topGravity ?? [];
const patterns = detectCrossCardPatterns(signals, topCompass, topGravity, args.demographics);
const patternsByCard: Record<string, string[]> = {};
for (const { pattern, prose } of patterns) {
  if (!patternsByCard[pattern.applicable_card]) patternsByCard[pattern.applicable_card] = [];
  patternsByCard[pattern.applicable_card].push(prose);
}
```

Then, when rendering each Map card section, append any pattern prose under that card's heading. The cleanest placement is **after the existing Strength / Trap / Next move sub-sections, before the next card heading**, with a `**Pattern observation**` (or similar) sub-heading marker:

```markdown
### Lens — Eyes

**Strength** — …

**Trap** — …

**Next move** — …

**Pattern observation** — The pattern-reader gift can produce paralysis when the patterns multiply faster than action. Madison may need to choose ground that's good enough rather than waiting for the optimal pattern to land.
```

When multiple patterns fire for the same card, render multiple `**Pattern observation**` paragraphs. When no patterns fire for a card, the existing SWOT structure runs unchanged — no empty section, no orphan heading.

The Conviction card is a special case: it carries both the canonical Strength / Trap / Posture / Next move shape AND any cross-card patterns that target Conviction. Insert pattern prose after the Posture line, before the next card heading.

The Path · Gait card structurally differs (Work / Love / Give / Growth move sub-sections rather than SWOT). Pattern prose for Path goes after the Growth move sub-section.

### Item 4 — Append Simple Summary section to markdown

**File**: `lib/renderMirror.ts`.

CC-022b's `generateSimpleSummary(constitution, demographics?)` returns the full Simple Summary as a single multi-paragraph string with line breaks separating the three closing patterns.

In the markdown renderer, append a new section after the existing Map section (or after the Open Tensions list if it ends the document):

```ts
import { generateSimpleSummary } from "./identityEngine";

// After all Map sections + Open Tensions list rendered:
out.push("");
out.push("## A Synthesis");
out.push("");
out.push("*the eight cards pulled into one read*");
out.push("");
const summaryProse = generateSimpleSummary(constitution, args.demographics);
out.push(summaryProse);
```

The `generateSimpleSummary` function's output already includes the three closing patterns separated by appropriate whitespace, so the markdown render just emits the full string. The italic subtitle (*"the eight cards pulled into one read"*) matches the on-screen render's section-label register.

**Section ordering**: Simple Summary appears at the END of the markdown document, after Open Tensions and before the footer timestamp line. This matches the on-screen render's bottom-of-Mirror placement.

If `generateSimpleSummary` returns an empty string (edge case for sessions with insufficient signals — e.g., a session where most cards are skipped), skip the section heading entirely; don't render an empty `## A Synthesis` block.

### Item 5 — Update call sites to pass `answers`

**File**: `app/components/InnerConstitutionPage.tsx`.

The current call site (in the Share block's button handlers from CC-020) doesn't yet pass `answers`. After CC-022b, `answers` flows naturally through the component's props (added to the page's prop type). Update the `renderMirrorAsMarkdown` call sites (Copy / Download buttons) to include it:

```tsx
// Existing call (replace)
const md = renderMirrorAsMarkdown({
  constitution,
  demographics,
  includeBeliefAnchor,
});

// CC-022c replacement
const md = renderMirrorAsMarkdown({
  constitution,
  demographics,
  answers,                    // CC-022c — flows through from CC-022b prop
  includeBeliefAnchor,
});
```

Two call sites in `InnerConstitutionPage.tsx` (one for Copy, one for Download) get the same one-line addition.

The admin detail view (`app/admin/sessions/[id]/page.tsx`) doesn't currently call `renderMirrorAsMarkdown` directly — it renders via `InnerConstitutionPage` which handles its own export. Verify this is still the case; if any admin-side direct call exists, update it analogously.

### Item 6 — Backward compatibility verification

**Backward compatibility constraint**: a saved session from before CC-022b (whose `answers` array might be missing the Q-I2 / Q-I3 multiselect details, or whose JSONB shape is older) must still render cleanly through the markdown export.

Verify by:

1. Loading any pre-CC-022b saved session via the admin detail view.
2. Triggering a markdown export.
3. Confirming the Keystone Reflection section falls back to the CC-017 generic dimension-label prose.
4. Confirming the cross-card patterns still render (they consume `signals`, `topCompass`, `topGravity` — all present in any saved session's `inner_constitution` JSONB).
5. Confirming the Simple Summary still renders (it consumes the constitution's structural fields — `lens_stack`, `top_compass`, `tensions` — all present).

The graceful-degradation chain: if `answers` is undefined → Keystone citation falls back; if a particular pattern's signals aren't present → that pattern doesn't fire (catalog is signal-driven, not data-required); if Simple Summary's source data is thin → it produces a shorter summary or empty string.

## Allowed-to-Modify

- `lib/renderMirror.ts` — extend `RenderArgs`; add `detectCrossCardPatterns` call + `patternsByCard` grouping; insert pattern prose into Map sub-sections; append Simple Summary section; thread `answers` + `demographics` into the `generateBeliefContextProse` call.
- `app/components/InnerConstitutionPage.tsx` — update Copy / Download button handlers to pass `answers` to `renderMirrorAsMarkdown`.

No other file should be modified.

## Out of Scope — explicit "do not" list

- **Do not** modify `lib/identityEngine.ts`, `lib/beliefHeuristics.ts`, or any other engine code. The engine outputs (cross-card patterns, Simple Summary, Keystone citation prose) are already correct from CC-022b; CC-022c only wires them into markdown.
- **Do not** modify `CROSS_CARD_PATTERNS` registry, the `GIFT_DANGER_LINES` map, or the `THESIS_TEMPLATES` table. Pattern catalog is closed for this CC.
- **Do not** modify the on-screen Mirror render (`MirrorSection.tsx`, `MapSection.tsx`, `KeystoneReflection.tsx`). On-screen rendering is unchanged.
- **Do not** modify the print CSS (`app/globals.css` `@media print` block). The on-screen surface is the source for print; pattern prose + Simple Summary are already rendered on-screen via CC-022b, so the print version inherits them automatically.
- **Do not** modify any tension prose, signal definition, or canon doc.
- **Do not** modify the database schema, migration logic, or save-flow code.
- **Do not** modify the admin auth, the attachments system, or the file-picker UX.
- **Do not** modify Q-I1, Q-I3, or any other question definition.
- **Do not** introduce new dependencies; CC-022c is purely a wiring change.
- **Do not** modify build configuration, AGENTS.md, CLAUDE.md, or any prompt file other than this one.

## Acceptance Criteria

1. **Markdown export includes Keystone selection citation** — for Madison's saved session, the markdown output's Keystone Reflection section cites her actual Q-I2 + Q-I3 selections by source-question label (the same prose the on-screen render produces). Q-I3 None-selected structural acknowledgment is present.
2. **Markdown export includes cross-card patterns** — for Madison's session, the markdown's Map sub-sections contain `**Pattern observation**` blocks for each of the 5 patterns that fire (Faith ↔ Supernatural in Compass; Knowledge ↔ Education trust + Loyalty ↔ Family/Partner trust in Trust; Stability ↔ Chaos formation in Weather; Pattern-reader ↔ paralysis in Lens). No empty pattern blocks under cards where no pattern fired.
3. **Markdown export includes Simple Summary section** — `## A Synthesis` heading + italic subtitle + the full Simple Summary prose with all three closing patterns (parallel lines, gift/danger, *"not X, but Y"* thesis). Appears at the end of the document, before the footer.
4. **Backward compatibility** — pre-CC-022b saved sessions (or any session with `answers === undefined`) still render cleanly: Keystone citation falls back to generic dimension-label prose; cross-card patterns still render (signal-driven); Simple Summary still renders (constitution-driven).
5. **Edge case: empty sections** — when a card has no patterns, no `**Pattern observation**` block is emitted under it; when Simple Summary returns empty, no `## A Synthesis` heading is emitted.
6. **InnerConstitutionPage threads `answers` to markdown calls** — both the Copy and Download buttons pass the new `answers` field.
7. **No on-screen regression** — the live `/admin/sessions/[id]` view and the live test-flow result page render identically before and after this CC. The rendering stays purely on-screen (CC-022b); the markdown export now matches it.
8. **TSC clean.** `npx tsc --noEmit` exits 0.
9. **Lint clean.** `npm run lint` exits 0.
10. **No file outside the Allowed-to-Modify list is modified.**

## Report Back

1. **Files changed** — file-by-file summary.
2. **Markdown export sample (Madison)** — paste the full markdown output for Madison's saved session post-CC-022c. Confirm: (a) Keystone Reflection cites her actual selections by source-question label; (b) Map sub-sections contain `**Pattern observation**` blocks for the 5 patterns that fired; (c) `## A Synthesis` section appears at the end with all three closing patterns.
3. **Markdown export sample (no-name fallback)** — paste the same Madison session with `name_state` simulated as `prefer_not_to_say` (or any session without a specified name). Confirm the Simple Summary's gift/danger and thesis lines fall back gracefully.
4. **Backward compatibility verification** — run a smoke session (or use a pre-CC-022b saved row) where `answers` is missing or older shape. Paste the resulting markdown's Keystone Reflection section; confirm it uses the CC-017 generic posture line, not the citation form.
5. **Edge cases** — confirm: a card with no fired patterns has no orphan `**Pattern observation**` heading; a session with thin signals does not render an empty `## A Synthesis`.
6. **TSC + lint** — exit codes.
7. **Scope-creep check** — confirm only allowed files modified.
8. **Risks / next-step recommendations** — anything noticed during the work that warrants a follow-up CC.

## Notes for the executing engineer

- This is a wiring CC. The engine outputs from CC-022b are already correct; CC-022c just routes them into the markdown renderer. Resist any temptation to "improve" the prose along the way — the prose is canon-aligned per CC-022b's spec; on-screen and markdown should match.
- The `patternsByCard` grouping is a simple `Record<string, string[]>`. When a card has multiple patterns, render them as separate `**Pattern observation**` paragraphs in order — don't try to merge them into a single block. The reader can absorb them sequentially.
- The Simple Summary should appear AFTER the Open Tensions list (or at the very end if Open Tensions is collapsed / not rendered for the session). Confirm by reading where the Open Tensions list currently lives in the markdown structure and place Simple Summary as the final content section before the footer.
- The footer timestamp line stays as the absolute last line of the markdown document (after Simple Summary). Verify the section order: Map → Open Tensions → Simple Summary → Footer.
- **Backward compatibility is the most important verification.** Any saved session with older JSONB shape must render. The graceful-degradation chain is: missing `answers` → Keystone falls back; missing pattern signals → patterns don't fire (no error, no empty block); thin signals → Simple Summary produces shorter or empty output. None of these failure modes should produce a broken markdown document.
- **Browser smoke deferred to Jason.** Engine-level verification covers the wiring (markdown contains the new sections; backward-compat works; TSC + lint clean). Visual verification of the printed PDF and the downloaded `.md` files in real research workflow is Jason's after CC-022c lands.
