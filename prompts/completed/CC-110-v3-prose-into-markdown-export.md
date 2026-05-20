# CC-110 — Splice launchPolishV3 prose into the markdown export

## Execution mode

Proceed without pausing for permission dialogs. Complete this in a single
pass. Do not stop to ask for confirmation between steps. On genuine
ambiguity, apply the canon-faithful interpretation, proceed, and flag the
decision in the Report Back. This session runs with permission bypass; the
discipline below is about scope, not about asking.

## Launch Directive

Launch with `claude --dangerously-skip-permissions`, or in-session
`/permissions` → bypass. The project `.claude/settings.local.json` already
sets `defaultMode: "bypassPermissions"`.

## Execution Directive

- One pass, no mid-task confirmation prompts.
- Engine remains the source of truth. This CC moves *already-generated*
  prose to a surface that currently can't see it. It must not change any
  derivation, any LLM prompt, or any prose content.
- On ambiguity, prefer the lowest-blast-radius option and record it.

## Context

The app produces the Inner Constitution report on two surfaces from one
engine:

- **React on-screen** (`/api/report-cards` → `resolveScopedRewritesLive` →
  `InnerConstitutionPage`) — receives the warm `launchPolishV3` ("V3")
  rewrites for the seven Part-A sections.
- **Markdown export** (`/api/render` → `renderMirrorAsMarkdownLive` →
  `renderMirrorAsMarkdown`) — receives only the four body-card prose
  rewrites (Lens / Compass / Hands / Path). It **never reads the V3
  rewrites**, so Copy/Download emits the engine's cold, clinical Part-A
  prose even when warm V3 prose exists in cache.

This CC closes that gap: splice the cached V3 rewrites into the markdown
user-mode render, mirroring the existing four-card splice. After this,
the exportable artifact reflects the same Part-A voice the web page
already shows. This is the prerequisite plumbing for all later prose-
effectiveness work — those improvements are invisible in the export until
this lands.

### V3 sections in scope (6)

`executiveRead`, `corePattern`, `whatOthersMayExperience`,
`whenTheLoadGetsHeavy`, `synthesis`, `closingRead`.

`pathTriptych` is the 7th V3 section but is **out of scope** here (it is
extracted from *inside* the Path · Gait card, which the existing four-card
splice already replaces — the interaction needs its own CC).

## Read First (Required)

- `lib/renderMirror.ts` — esp. the mode branch + four-card splice loop
  (~L1842–1905: `if (renderMode === "clinician") return raw;`, the
  `SCOPED_HEADERS` loop, `readCachedRewrite`, `enforceHandsTemplate`,
  `applyUserModeMask`). This is the pattern to mirror.
- `lib/renderMirrorLive.ts` — the pre-resolve wrapper (Steps 1–5: pre-render
  clinician md, fire the 4 prose-card resolves + keystone, await, then sync
  user render). The V3 pre-resolve must be added here.
- `lib/resolveScopedRewritesLive.ts` — the React path that already resolves
  all 7 V3 sections (the V3 input-construction at ~L254–307:
  `topCompassValueLabels`, `quieterAxis`, `V3_HEADERS`, `extractSection`,
  `extractPathTriptych`, `V3RewriteInputs`). **This is the authoritative
  shape of `V3RewriteInputs` — the markdown path must reproduce it
  exactly, or the cache key will differ and every section will miss.**
- `lib/launchPolishV3LlmServer.ts` — `readCachedV3Rewrite`,
  `resolveV3RewriteLive`, `writeRuntimeV3Rewrite`.
- `lib/launchPolishV3Llm.ts` — `V3_SECTION_IDS`, `V3SectionId`,
  `V3RewriteInputs`, `RESERVED_CANON_LINES` (confirm where the canon-line
  constant and `V3_HEADERS` actually live; `V3_HEADERS` is currently local
  to `resolveScopedRewritesLive.ts`).
- `docs/canon/inner-constitution.md` — section ordering / "model proposes,
  you confirm" framing (no content changes here, but confirm headers).
- The audit: `tests/audit/twoTierRenderSurfaceCleanup*.ts` (clinician
  byte-identical baseline) and `tests/audit/proseRegister*.ts` — both must
  still pass.

## Required Design — single source of truth for the cache key

Do **not** copy/paste the `V3RewriteInputs` construction into
`renderMirror.ts`. A second copy of the cache-key logic is a two-truth
hazard: the two surfaces will silently drift and re-introduce the cold-
export bug. Instead:

1. Export `V3_HEADERS` and a single shared `buildV3SectionInputs(...)`
   helper (taking the clinician markdown + constitution + sectionId,
   returning `V3RewriteInputs | null`) from a shared module
   (`launchPolishV3Llm.ts` or a small new `lib/v3SectionInputs.ts`).
2. Refactor `resolveScopedRewritesLive.ts` to consume that shared helper
   instead of its local construction. **The React `/api/report-cards`
   output must remain byte-identical** — verify against a fixture.
3. `renderMirror.ts` and `renderMirrorLive.ts` consume the same helper.

## Tasks

1. **Shared helper.** Extract `V3_HEADERS` + `buildV3SectionInputs` to a
   single exported location; refactor `resolveScopedRewritesLive.ts` onto
   it with zero behavior change.
2. **Pre-resolve in `renderMirrorLive.ts`.** After the prose-card +
   keystone resolves and before the final `await Promise.all`, fire
   `resolveV3RewriteLive` for the 6 in-scope sections (skip a section when
   `buildV3SectionInputs` returns null), using the same `budget`,
   `timeoutMs`, `sessionLlmBundle`, and an optional `v3Composer` test seam.
   Add them to the awaited set so the runtime cache is warm before Step 5.
3. **Splice in `renderMirror.ts`.** In user mode only, after the four-card
   splice loop and before `enforceHandsTemplate`, add a V3 splice loop:
   for each in-scope section, locate `V3_HEADERS[sectionId]` in `raw`,
   extract the engine section body the same way the helper expects, build
   inputs via `buildV3SectionInputs`, call `readCachedV3Rewrite`, and
   substitute the section body when a cache entry exists. Fall through to
   engine prose on miss. Clinician mode path is untouched
   (`if (renderMode === "clinician") return raw;` stays above the splice).
4. **Verify cache-key parity** (see Acceptance #4).

## Allowed to Modify (exhaustive)

- `lib/renderMirror.ts`
- `lib/renderMirrorLive.ts`
- `lib/resolveScopedRewritesLive.ts`
- `lib/launchPolishV3Llm.ts` (export additions only) — OR a new file
  `lib/v3SectionInputs.ts` if cleaner; if created, add it to this list in
  the Report Back.

Anything not listed is forbidden. In particular: do **not** edit
`launchPolishV3LlmServer.ts` logic, any `lib/cache/*.json`,
`identityEngine.ts`, the React components, or any test baseline file.

## Out of Scope

- `pathTriptych` splicing (own CC).
- Any change to the V3 LLM **prompt** or prose content (effectiveness
  tuning is a sibling CC).
- Third-person / mode-driven **voice** change.
- New sections ("{Name} at a Glance", "The Deeper Tension").
- Telemetry / hedging suppression and `isProtectedLine` changes.
- Any PDF / print path.
- Regenerating or editing committed cohort caches.
- Touching engine derivation or `applyUserModeMask` STRIP/PROTECT lists.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run dev` (smoke a render if needed)
- targeted test runs for the two named audits
- `grep` / `sed` / `rg` read-only verification
- a one-off node/ts script to render one fixture in user mode and diff
  (do not commit the script)

## Acceptance Criteria

1. `npx tsc --noEmit` clean; `npm run lint` clean (pre-existing warnings ok).
2. **Clinician markdown is byte-identical** to before this CC for all
   cohort fixtures (`twoTierRenderSurfaceCleanup` passes). The V3 splice
   sits below the clinician early-return.
3. **React `/api/report-cards` output is byte-identical** to before for a
   reference fixture (the helper refactor changed structure, not behavior).
4. **Cache-key parity:** for a fixture whose V3 cache entries exist, the
   markdown user export now contains the V3-rewritten body for all 6
   sections (prove the splice hit cache, not a coincidental match). For a
   fixture with no V3 cache, the export falls through to engine prose with
   no error.
5. No second copy of `V3RewriteInputs` construction exists — both surfaces
   import one helper (grep proves a single construction site).
6. No file outside the Allowed-to-Modify list has been edited.
7. `proseRegister` audit state is unchanged by this CC (this CC does not
   regenerate caches; if it was failing on staleness before, that is
   pre-existing and noted, not addressed here).

## Report Back

- Files touched + whether `lib/v3SectionInputs.ts` was created.
- The exact splice insertion point in `renderMirror.ts` (line + the
  guard ordering relative to the clinician return and `enforceHandsTemplate`).
- Cache-key parity evidence (which fixture, before/after section bodies).
- Confirmation clinician + React outputs are byte-identical (how verified).
- Any section where extraction differed between surfaces and how it was
  reconciled.
- Any scope decision made under ambiguity.
- Anything that should become a follow-up CC (expected: pathTriptych
  splice; the prose-effectiveness V3-prompt tuning).
