# CC-HANDS-9TH-CARD-PARITY

## Objective
Bring the Hands card to structural and visual parity with the other 8 body cards (Lens / Compass / Voice / Spine / Ears / Weather / Fire / Gait). Hands was added as the 9th body card by CC-HANDS-CARD but doesn't yet render with equal treatment in the React surface — collapse/expand behavior, header structure, visual frame, and dual-naming convention are all slightly off, which is why the card visually leaks into Compass's area when expanded and reads as a less-finished member of the set.

## Sequencing
Independent of CC-PROSE-LEAK-CLEANUP-V3 (those leak fixes resolve the immediate dup bug; this CC addresses the deeper structural treatment). Recommended to land after PROSE-LEAK-CLEANUP-V3 since that CC's idempotency fix will simplify the parity work.

## Scope

### Card placement
Keep current placement: between **Compass — Heart** and **Conviction — Voice**. Rationale: "what you protect (Compass) → what you build to protect it (Hands) → how that belief speaks under cost (Voice)" is a natural conceptual flow. Hands as the verb of Heart's noun.

Final body-card order (9 cards):
1. Lens · Eyes
2. Compass · Heart
3. **Hands · Work** (NEW — 9th card placed third)
4. Conviction · Voice
5. Gravity · Spine
6. Trust · Ears
7. Weather · Nervous System
8. Fire · Immune Response
9. Path · Gait

### Visual + structural parity items
The other 8 cards share these characteristics:

- **Header dual-naming**: `Card Name · Body Part` (middle dot separator) — e.g., "Lens · Eyes," "Compass · Heart"
- **Sub-header** in mono caps: one-line description (e.g., "How you read reality")
- **Lead italic** sentence describing the read
- **Strength / Growth Edge / Practice** structured paragraphs (some cards add Movement Note or Pattern in motion)
- **Closing italic** one-line aphorism
- **Collapse/expand affordance** with ▸/▾ on the React surface; click to expand

Hands currently:
- Uses "Hands — Work" (em-dash) instead of the middle-dot convention used by other 8 ("Compass · Heart"). **Fix:** rename to "Hands · Work" for visual consistency.
- Has the right structural template (after CC-SMALL-FIXES-BUNDLE's enforceHandsTemplate) but the header is doubling and the closing line is doubling (will be resolved by CC-PROSE-LEAK-CLEANUP-V3's idempotency fix).
- Renders expanded-by-default on the React surface while other 8 are collapsed-by-default. **Decision needed:** keep Hands expanded-by-default OR make it collapse-by-default to match the rest.

### Recommendation: collapse Hands by default like the other 8
The whole-set design language is "click ▸ to inspect the card you care about." Having Hands always-expanded breaks the visual rhythm and forces every reader to scroll past it. Make Hands collapsible like the others; the click-to-expand affordance is the body map's interaction pattern.

### Design studio integration
Design studio is preparing the visual assets for the Hands card to match the other 8. When delivered, this CC's scope can be extended OR a follow-up CC can wire the visual assets. For now, this CC focuses on the **structural** parity (collapse/expand, dual-naming convention, render placement, equal weight in the card grid).

## Do not
- Change the engine-side Hands card logic (handsCard.ts), the LLM rewrite cache, or the Hands prose content. This CC is purely structural/visual treatment.
- Modify any other body card. All 8 existing cards stay byte-identical.
- Touch admin / clinician-mode rendering.
- Bump cache hashes.
- Add new dependencies.
- Change the Hands LLM prompt or cached content.
- Re-order the cards beyond what's specified above (current placement: 3rd position, after Compass).

## Rules

### 1. Collapse/expand parity
All 9 cards (including Hands) render collapsed-by-default in user mode. Click to expand. Same ▸/▾ affordance, same animation, same expanded-state visual treatment as the other 8.

### 2. Dual-naming convention
Rename header from "Hands — Work" (em-dash) to "Hands · Work" (middle dot) to match the other 8 cards' convention ("Lens · Eyes," "Compass · Heart," etc.). Apply both in user mode and clinician mode.

### 3. Card-grid order
Render in the 3rd slot (after Compass, before Voice) in both user-mode and clinician-mode renders. Verify by reading the rendered DOM order.

### 4. Visual weight equivalent to the other 8
Same card-frame styling, same typography, same internal-padding, same collapse/expand interaction. The card visually reads as one of nine equal-weight body cards, not as a structurally-different inserted element.

### 5. Engine prose template + LLM rewrite both work in the parity treatment
When the LLM rewrite is present (cache hit or on-demand resolution), it renders inside the expanded card. When engine fallback is used, the engine template renders inside the expanded card. Both fit the same card frame; the user can't tell from frame alone whether the content was LLM-rewritten or engine-templated.

### 6. Design studio asset slot
The card layout should be ready to accept a body-part SVG icon when design studio delivers the Hands visual. Existing cards each have an icon glyph in the header area (Eyes, Heart, Voice, Spine, Ears, etc.); Hands should have a placeholder slot ready for the design studio's icon delivery.

## Implementation notes
- Most of this work is in the React component layer — likely `app/components/MapSection.tsx` and `app/components/ShapeCard.tsx` (or wherever the body-card grid is rendered).
- The structural template enforcement (Hands header + closing line idempotency) is handled by CC-PROSE-LEAK-CLEANUP-V3. This CC works on top of that fix.
- The dual-naming rename is a simple find-and-replace in the engine output + React component.

## Audit gates
- New audit `tests/audit/hands9thCardParity.audit.ts`:
  - The 9 body cards render in the canonical order (Lens / Compass / Hands / Voice / Spine / Ears / Weather / Fire / Gait) for cohort fixtures.
  - Hands card uses the "Hands · Work" (middle dot) header convention, not "Hands — Work" (em-dash).
  - Hands renders collapsed-by-default in user mode, expand-on-click.
  - Hands card frame/typography/padding match the other 8 (verified by component-render snapshot or structural-pattern check).
  - Clinician mode still renders all 9 cards with all engine artifacts intact.
  - Existing Hands content (Strength / Growth Edge / Under Pressure / Practice + closing italic) renders inside the collapsed/expanded card frame without duplication (depends on CC-PROSE-LEAK-CLEANUP-V3 landing first).
- Existing audits stay green.
- `tsc --noEmit` clean.
- `npm run lint` clean.
- Cost: $0 (no LLM regen).

## Deliverables
- Files changed list.
- Before/after screenshots or descriptions of the Hands card in user mode.
- Confirmation that all 9 body cards render in the canonical order.
- Confirmation that the "Hands · Work" header rename is applied.
- Confirmation that collapse-by-default behavior matches the other 8.
- Clinician-mode byte-identity confirmation for the 9-card set.
- Audit results.

## Why this CC matters
The Hands card landing as a 9th body card was canonically the right call — it gives the body map a Work-axis card alongside the Soul/Wisdom-axis cards. But landing it without equal structural treatment creates a visual stutter: readers notice that one card is "different" from the rest, even if they can't articulate why. Structural parity makes the 9 cards read as a coherent set rather than 8 + 1.

Design studio's visual asset (the body-part icon and any frame refinements) will land as a follow-up CC. This CC ensures the structural foundation is ready for that visual work.
