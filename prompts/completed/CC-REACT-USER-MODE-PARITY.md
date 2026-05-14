# CC-REACT-USER-MODE-PARITY

## Objective
Apply user-mode suppression rules to the React on-screen render of the report, matching the rules already applied to the markdown export. Currently the markdown export (Copy / Download / `/api/render`) correctly suppresses engine artifacts in user mode, but the React on-screen render (`<InnerConstitutionPage>` and its children) renders directly from the constitution object without applying the same suppression. Result: users completing the assessment OR returning via permalink see engine artifacts (MBTI disclosure, "INTJ, provisional" Surface Label cell, etc.) that should have been gated to clinician/admin views.

## Sequencing
**Urgent.** Soft-share is live as of this CC. Every user who completes the assessment or returns via permalink is seeing engine artifacts in their on-screen report right now. Fire as soon as it's drafted.

## Scope
Audit and fix the React render of every section the user sees on `/assessment` (post-submission) and `/report/[sessionId]` for these engine-artifact emissions:

1. **Masthead MBTI disclosure line** — *"Possible surface label: INTJ. Type labels are surface descriptions only — your shape is not reducible to a four-letter code. The Lens reading above is the actual interpretation."* Should render in clinician/admin mode only.

2. **Core Signal Map "Surface label" cell** — currently displays "INTJ, provisional" in user mode. Should either:
   - Suppress the entire "Surface label" row in user mode (preferred — cleanest, no half-rendered state).
   - Or replace with proprietary translation in user mode (e.g., archetype-shape name).

3. **Third-person name interpolation** — verify the React components apply the same name-to-pronoun substitution + verb-conjugation that CC-LAUNCH-VOICE-POLISH-V2 added to the markdown mask. If React reads pre-rendered prose from the constitution, the prose may still have third-person `${name}` interpolated.

4. **`(formerly X)` parentheticals** — verify they're stripped from any prose the React render emits.

5. **Engine vocabulary** — check Disposition section, Faith Shape / Faith Texture mentions, "output channel," etc. — any engine-internal vocabulary that the markdown mask strips should also be absent from the React on-screen render.

## Root cause
The markdown export path runs through `lib/renderMirror.ts` and applies `applyUserModeMask` which gates clinician-mode artifacts. The React render path reads from the constitution data structures directly via `<InnerConstitutionPage>` and its children components, and never runs through the mask. The two render paths diverged.

## Fix approach (cleanest)
The React surface should respect `renderMode` consistently across all components. Two implementation options:

**Option A — Component-level conditional gating.**
Each component that emits engine-artifact prose checks `renderMode` and conditionally renders. Most direct fix; preserves the existing data flow. Files affected (audit to confirm):
- `app/components/InnerConstitutionPage.tsx` — masthead and overall layout
- `app/components/MirrorSection.tsx` — section blocks including masthead detail
- `app/components/CoreSignalMap.tsx` — Surface Label cell
- Possibly `app/components/ShapeCard.tsx` if cards render engine prose

**Option B — Pre-strip in constitution layer.**
Apply user-mode mask to constitution fields before they reach the React layer. Server-side fix; one place to maintain; both render paths automatically benefit. More architecturally clean but bigger lift.

Recommendation: **Option A for this CC** (urgent, smaller surface, faster to verify). Queue Option B as architectural cleanup later.

## Do not
- Change the engine math or engine signal extraction.
- Modify the clinician/admin render path (`/admin/sessions/[id]`) — clinician mode keeps full engine artifacts visible for audit.
- Touch the markdown export (`/api/render`) — that path is already correct.
- Bump cache hashes.
- Add new dependencies.
- Restructure the constitution data model. Surface-only fix.

## Rules

### 1. The `renderMode` prop must thread through to every component that emits an engine artifact
`<InnerConstitutionPage>` receives `renderMode` already (or should). It must pass it down to every child component that renders any of the suppression-list artifacts. Components emit conditionally based on `renderMode === "clinician"`.

### 2. User mode by default
If `renderMode` is not specified, default to `"user"`. Suppression applies. Admin/clinician must explicitly opt in.

### 3. Both render paths must look identical for the same session
Compare the markdown export of session X to the React on-screen render of session X. After this fix, both should contain the same content (with formatting differences allowed — markdown vs HTML). No MBTI artifact in markdown but visible in React, etc.

### 4. Clinician/admin retains everything
The `/admin/sessions/[id]` view (clinician mode) keeps full artifacts visible. No regression there.

## Audit gates
- New audit `tests/audit/reactUserModeParity.audit.ts`:
  - The on-screen render of `/report/[sessionId]` for the Jason fixture contains zero occurrences of "Possible surface label: INTJ" or "INTJ, provisional."
  - The on-screen render of `/assessment` (post-submission report) for the Jason fixture contains zero MBTI artifact strings.
  - The on-screen render of `/admin/sessions/[id]` for the same Jason fixture contains the MBTI disclosure line and "INTJ, provisional" cell (clinician mode preserved).
  - User-mode React render and user-mode markdown export of the same session produce equivalent content (no MBTI in either; same suppression behavior).
- Existing 53+ audits stay green.
- `tsc --noEmit` clean.
- `npm run lint` clean.
- Cost: $0 (no LLM regen).

## Deliverables
- Files changed list.
- Before/after screenshots or descriptions of the `/report/[sessionId]` masthead.
- Confirmation that `/admin/sessions/[id]` clinician render is byte-identical to pre-CC for the same session.
- Audit results.

## Why this is urgent
Soft-share is live. Every user who completes the assessment or visits a permalink right now is seeing the MBTI disclosure line + the "INTJ, provisional" cell. The launch voice polish is leaking via the React render path. This makes the report read as MBTI-derived to careful readers, undermining the proprietary trajectory framing that the rest of the report is built on.

The fix is small (component-level conditionals or a single mask application) but the visible impact is large. Land + push as fast as possible.
