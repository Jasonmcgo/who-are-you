# CODEX-050 — Admin Session Re-Render Mode

*(Filename CODEX-050 per the agent-routing convention 2026-04-29: docs / surgical / mechanical scope; well-suited for Codex execution. The numbering shares the global CC-### sequence; the prefix is routing metadata, not a separate track.)*

**Type:** Admin-tooling feature. Read existing saved session answers, derive a fresh `InnerConstitution` against current engine code, render via existing report components. **No new questions. No new signals. No new prose. No engine logic changes. No persistence updates.**
**Goal:** Let an admin loading a saved session see what the user's report looks like when rendered against *current* engine code (rather than against a snapshot from when the user took the test). Useful for validating that prose-rewrite CCs landed correctly, comparing pre- and post-engine-change reports for the same answer set, and smoke-testing engine changes against real saved data without requiring the original respondent to re-take the assessment.
**Predecessors:** CC-019 (Persistence and demographics), CC-020 (Shareable result format), CODEX-049 (/admin Suspense fix — `/admin` route now prerenders cleanly).
**Successor:** None hard-blocked. Could enable a future CC for side-by-side original-vs-rerendered comparison, but that's heavier UI work and explicitly out of scope here.

---

## Why this CC

After ~18 substantive CCs in the recent run (CC-029 through CC-049), the engine produces materially different output than it did when most existing saved sessions were taken. The differences include: relabeled Drive buckets (CC-033, CC-040), new Disposition Map / Work Map / Love Map sections (CC-037, CC-042, CC-044), aux-pair register prose (CC-038-prose), bug fixes for Compass label leaks and username rendering (CC-046, CC-047), and the post-CC-048 calibration canon awaiting its rewrite track.

The most informative single test of the cumulative changes is to load a saved session and read the rendered report against current code. If the admin session detail view currently re-derives the report on load, this CC adds a small indicator naming the "live engine" render mode. If the admin view currently shows a stored snapshot, this CC changes the rendering path to re-derive.

Either way, the deliverable is small: the admin user sees a fresh report rendered against current engine code, with a clear visual indicator that this is a live-engine render (not the original report the user saw when taking the test).

---

## Scope

Files modified — depends on what Step 1's audit reveals:

1. `app/admin/sessions/[id]/page.tsx` (or wherever the admin session detail view lives — verify with `Read` first; the `/admin/sessions` route was visible in CODEX-049's build output as a dynamic server-rendered route).
2. Possibly `lib/saveSession.ts` (or equivalent) — if the saved-session loader currently returns a stored snapshot, may need a new `loadSessionForRerender` path that returns just the answers + demographics (not the persisted output).
3. Possibly `app/admin/sessions/[id]/RerenderView.tsx` (new, if the rendering path is meaningfully different from the user-facing version and benefits from a separate component).

Nothing else. **Specifically out of scope:**

- **Persistence updates.** The re-rendered report is *not* written back to storage. The original session's persisted output (if any) stays untouched. This is read-only inspection.
- **Side-by-side comparison view.** Showing original-vs-rerendered together is a heavier UI. Future CC if useful.
- **Bulk re-render across all sessions.** This CC is per-session-on-demand only.
- **Public-facing surfacing.** Admin route only. Users don't see the re-render mode.
- **Re-prompting the user to answer new questions.** If the saved session predates Q-Ambition1 (CC-033) or has v0 trust signals (pre-CC-031/CC-032), the re-render proceeds with whatever signals exist. Missing signals silently don't fire. No prompts.
- **Capturing browser-smoke screenshots or persisting them.** Visual review is the admin user's responsibility.

---

## The locked behavior

When an admin loads a saved session at `/admin/sessions/[id]`:

1. The session's saved answers + demographics are loaded from storage.
2. The current `buildInnerConstitution(answers, demographics)` runs against those inputs.
3. The resulting `InnerConstitution` is passed to the existing `<InnerConstitutionPage />` component (the same component that renders for users).
4. A small indicator at the top of the rendered report names the render mode and the engine state.

The indicator wording (locked):

```
LIVE-ENGINE RENDER · this report was generated against current engine code
{date}, may differ from the report the user saw when taking the test
```

Position: above the existing `# The Inner Constitution` heading, styled as a mono-uppercase admin-only banner (use the project's existing admin-banner styling if one exists; otherwise plain `text-sm font-mono uppercase` with `var(--ink-mute)` color and a small bottom border).

The banner only appears on the `/admin` route — never on the public report URL. If the saved-session loader is shared between admin and public, the admin route adds the banner via wrapper component; the public route renders the report unchanged.

---

## Steps

### 1. Audit the current admin session detail view

`Read` the file at `app/admin/sessions/[id]/page.tsx` (or whatever the dynamic-route file is — verify with `ls app/admin/sessions/`). Determine:

- Does it currently re-derive the `InnerConstitution` on load? (Calls `buildInnerConstitution(savedAnswers, savedDemographics)` or equivalent.) — if YES, the work is small: add the banner.
- Does it currently render a stored snapshot? (Reads a persisted `inner_constitution_json` field or similar.) — if YES, change the rendering path to re-derive, and add the banner.

Document which case applies in the Report Back.

### 2. Implement the live-engine render path

**If Step 1 found re-derive already:** add the locked-content banner above the report. One-component change.

**If Step 1 found stored-snapshot rendering:** swap to re-derive. Pseudocode:

```tsx
// app/admin/sessions/[id]/page.tsx (post-CODEX-050)
import { buildInnerConstitution } from "@/lib/identityEngine";
import InnerConstitutionPage from "@/app/components/InnerConstitutionPage";
import { loadSessionAnswers } from "@/lib/saveSession"; // or whatever the loader is

export default async function AdminSessionPage({ params }: { params: { id: string } }) {
  const { answers, demographics } = await loadSessionAnswers(params.id);
  const constitution = buildInnerConstitution(answers, demographics);
  return (
    <>
      <LiveEngineBanner sessionDate={...} />
      <InnerConstitutionPage constitution={constitution} demographics={demographics} />
    </>
  );
}
```

`loadSessionAnswers` returns just the inputs needed to re-derive — answers + demographics. Existing `loadSession` (or equivalent) may already return this shape; if it returns a full snapshot including persisted `inner_constitution`, factor out a new exported helper that returns answers/demographics only without touching the existing function (so user-facing surfaces aren't affected).

### 3. Create the LiveEngineBanner component (if needed)

Single small component, ~10-15 lines:

```tsx
// app/admin/sessions/[id]/LiveEngineBanner.tsx (new)
function LiveEngineBanner({ sessionDate }: { sessionDate: string }) {
  return (
    <div className="font-mono uppercase text-sm tracking-wider"
         style={{ color: "var(--ink-mute)", borderBottom: "1px solid var(--ink-mute)", padding: "8px 0", marginBottom: "16px" }}>
      LIVE-ENGINE RENDER · this report was generated against current engine code{sessionDate ? ` (session originally taken ${sessionDate})` : ""}, may differ from the report the user saw when taking the test
    </div>
  );
}
```

If the project has an existing admin-banner component or styling pattern, prefer that over inline styling. Match conventions.

### 4. Verify the public-facing report path is unchanged

Critical: the user-facing report at the public session URL (not `/admin`) must NOT show the LiveEngineBanner. Verify that the wrapper change is admin-route-only. If the public route shares the same component path, isolate the banner at the admin-route level — don't push it into `InnerConstitutionPage` itself.

### 5. Verify

- `npx tsc --noEmit` exits 0.
- `npm run lint` passes.
- `npm run build` succeeds — should now include `/admin/sessions/[id]` as either prerendered (if static) or dynamic-server-rendered route. CODEX-049 cleared the only known prerender blocker, so this build should be the second consecutive clean build.
- Manual: load any existing session ID in `npm run dev` against `/admin/sessions/[id]`. Confirm:
  - Banner appears at the top of the report.
  - Report sections render against current code (Disposition Map, Work Map, Love Map sections all visible if the session has appropriate signal coverage).
  - Public route at the user-facing session URL does NOT show the banner.

### 6. Browser smoke (Jason verifies)

Load the existing Jason0429 saved session in the admin portal:

- Banner appears: *"LIVE-ENGINE RENDER · this report was generated against current engine code..."*
- Drive distribution renders with new labels (*"Building & wealth"* / *"People, Service & Society"* / *"Risk and uncertainty"*) — not the old labels from the original report.
- Compass values render with proper labels (*"Peace"*, *"Honor"* — not `peace_priority`, `honor_priority`).
- Username renders as *"Your"* / *"You"* — not *"Jason0429's"*.
- Disposition Map section renders between Mirror and Compass.
- Work Map section renders between Disposition Map and Map.
- Love Map section renders between Work Map and Map.
- Mirror has the product-safe-sentence line after Top 3 Gifts (*"Your Lens has a [analog] quality..."*).
- Audit-flagged violations from CC-048 are visible in the rendered prose (this is expected; the rewrite track will fix them).

Loading the same session at the public (non-admin) URL: report renders without the banner, otherwise identical to the admin view's content.

---

## Acceptance

- `app/admin/sessions/[id]/page.tsx` (or equivalent) re-derives `InnerConstitution` from saved answers + demographics on each render.
- LiveEngineBanner appears at the top of the admin session detail view.
- Public-facing session URL does NOT show the banner.
- `npx tsc --noEmit` exits 0. `npm run lint` passes. `npm run build` succeeds (no /admin Suspense regressions; CODEX-049's fix preserved).
- Manual verification confirms the live-engine render produces all post-CC-044 sections (Disposition Map, Work Map, Love Map) for sessions with sufficient signal coverage.
- `git diff --stat` shows changes only in admin-route files and possibly `lib/saveSession.ts`.

---

## Out of scope

- **Public-facing re-render.** Users don't need the live-engine view; they get whatever the report path normally produces.
- **Persisting the re-rendered output.** Read-only inspection; the saved session's persisted form stays as-is.
- **Side-by-side original-vs-rerendered view.** UI complexity not justified for v1.
- **A "fill in gaps" mode** that prompts the user to take only newly-added questions (Q-Ambition1, CC-028 sacred values). Future CC if useful; explicitly not in CODEX-050.
- **Bulk re-render across all sessions** with diff output. Per-session-on-demand only.
- **Authentication / authorization changes** to `/admin`. The route is already admin-gated; this CC inherits that.
- **Engine logic changes.** Pure rendering / loader change.
- **Visual diff between original snapshot and re-rendered report.** Just produces the re-render; admin compares mentally with whatever original they have.
- **Capturing screenshots, exports, or shareable URLs of the re-rendered view.** Future CC if useful.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

Codex equivalent acceptable. Prompt is filed under the CODEX- prefix per the 2026-04-29 routing convention; well-suited for Codex execution given the scope is mechanical (load → derive → render with banner).

## Execution Directive

Single pass. The locked behavior + locked banner content are the two non-negotiable elements. UI placement (where the banner sits, exact styling) has minor latitude as long as it's clearly admin-distinct. **Move prompt to `prompts/completed/` when done** — this step is part of the standard CC workflow per AGENTS.md and is repeated explicitly here because Codex has missed it on prior CCs.

## Bash Commands Authorized

- `ls app/admin/sessions/`
- `cat app/admin/sessions/[id]/page.tsx` (or equivalent)
- `grep -rn "buildInnerConstitution\|loadSession" lib/ app/` (locate loader and engine entry)
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` (smoke; kill before exiting)
- `mv prompts/active/CODEX-050-admin-session-rerender.md prompts/completed/CODEX-050-admin-session-rerender.md` (final step)
- `git diff --stat`
- `git status`

## Read First (Required)

- `AGENTS.md` (workflow rules, especially the `prompts/active` → `prompts/completed` move-on-ship convention).
- `app/admin/` directory listing — check route structure.
- `app/admin/sessions/[id]/page.tsx` (or equivalent) — full read.
- `lib/saveSession.ts` (or wherever session persistence lives — verify by grep) — locate the loader.
- `lib/identityEngine.ts` `buildInnerConstitution` signature — confirm the inputs needed for re-derivation.
- `app/components/InnerConstitutionPage.tsx` — the rendering component, used unchanged.
- `prompts/completed/CODEX-049-admin-suspense-fix.md` — context on the recent /admin route work.

## Allowed to Modify

- `app/admin/sessions/[id]/page.tsx` (or wherever the admin session detail view's route file lives)
- `app/admin/sessions/[id]/LiveEngineBanner.tsx` (new, if extracted as a separate component)
- `lib/saveSession.ts` (only if a new exported helper is needed to return answers/demographics without the persisted snapshot)

**No other files.** The user-facing report rendering path stays untouched.

## Report Back

1. **Step 1 audit result** — was the admin session detail view re-deriving already, or rendering a stored snapshot?
2. **Files modified** with line counts.
3. **LiveEngineBanner placement** — where does it appear, and which file owns it.
4. **Public-route isolation** — explicit confirmation that the public-facing session URL does not show the banner.
5. **Verification results** — tsc, lint, build outputs. Explicitly confirm `npm run build` exits 0 (this is the second consecutive clean build expected post-CODEX-049).
6. **Browser smoke deferred to Jason** — Jason loads the Jason0429 session at the admin URL and confirms the post-CC-044 sections render.
7. **Out-of-scope drift caught** — anything considered and rejected.
8. **Prompt move-to-completed confirmation** — explicit confirmation that `prompts/active/CODEX-050-admin-session-rerender.md` has been moved to `prompts/completed/`.

---

## Notes for the executing engineer

- Saved sessions store *answers + demographics*, not rendered output. The engine derives the `InnerConstitution` from those inputs. If `lib/saveSession.ts` (or equivalent) returns a richer object that includes a persisted `inner_constitution`, ignore that field for the re-render path and call `buildInnerConstitution(answers, demographics)` directly.
- Q-Ambition1 (CC-033) and CC-028 sacred values (Peace / Honor / Compassion / Mercy) are questions added recently. Saved sessions taken before those CCs shipped don't have answers for them. The engine handles missing signals silently — they just don't fire. The Drive cost bucket may render with lower signal density for pre-CC-033 sessions; the Compass top may not include CC-028 values for pre-CC-028 sessions. This is expected and not a defect.
- v2.5 trust signal IDs (CC-031 / CC-032) replaced legacy single-flat Q-X3 / Q-X4 signals. Pre-v2.5 sessions store legacy signal IDs that aren't in the post-v2.5 tagging tables. The engine's distribution-compute code skips unrecognized signals via the `if (!tag) continue;` guard at the lookup site. Pre-v2.5 sessions render with thin trust contributions — expected.
- The banner content is locked. The exact styling has minor latitude but it must be clearly admin-distinct (mono uppercase, a different visual weight from the regular report typography). The intent is unmistakable signal that the admin is looking at a live-engine render, not the user's original report.
- If the project's admin route has session-listing pages (e.g., `/admin/sessions`) in addition to detail pages, those don't need the banner — only the detail view that renders a single user's report.
- Per CODEX-/CC- routing convention, the prompt file at `prompts/active/CODEX-050-admin-session-rerender.md` should move to `prompts/completed/CODEX-050-admin-session-rerender.md` when shipped. This step has been missed on prior Codex executions; explicit reminder here.
