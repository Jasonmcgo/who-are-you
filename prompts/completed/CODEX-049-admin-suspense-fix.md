# CODEX-049 — /admin Suspense Boundary Fix

*(Filename CODEX-049 — agent-routing convention 2026-04-29: CCs prefixed `CODEX-` are docs-only, surgical-fix, audit-only, or mechanical-refactor scope and well-suited for Codex execution. The numbering shares the global CC-### sequence; the prefix is routing metadata, not a separate track.)*

**Type:** Surgical UI fix for Next.js static-page-generation prerendering. **No new logic. No new prose. No canon changes.** Single-file fix to a pre-existing build failure that has been blocking `npm run build` across 10+ CCs since CC-021a.
**Goal:** Wrap the `useSearchParams()` call at the `/admin` route in a `<Suspense>` boundary so Next.js can prerender the page during static generation. After this CC ships, `npm run build` should complete successfully — the first time it has done so since CC-021a-era residue introduced the failure.
**Predecessors:** None hard-blocked. The fix has been deferred CC after CC because it touches a different surface than the canon / prose / aux-pair work that's been the focus.
**Successor:** None. Frees every subsequent CC from working modulo the /admin failure during build verification.

---

## Why this CC

Every CC ship report since approximately CC-021a includes the same line: *"npm run build fails on pre-existing /admin Suspense boundary error — unrelated to this CC."* The cumulative cost of having every production-build verification fail on the same wire is now substantial — executors have to manually classify the failure as pre-existing each time, and a real production-build regression introduced by some future CC could hide inside the same noise. The fix is a five-line refactor in one file.

The Next.js error is structural: `useSearchParams()` triggers client-side rendering and requires a `<Suspense>` boundary above it during static generation. Pre-CC-049, the `/admin` page calls `useSearchParams()` directly inside its top-level component, so Next.js can't prerender the page and aborts the build's static-generation phase.

---

## Scope

Files modified:

1. `app/admin/page.tsx` — refactor so `useSearchParams()` is called inside a child component, and the page-level component wraps that child in `<Suspense>`.

Possibly also (depending on where the call lives):

2. A new `app/admin/AdminPageInner.tsx` (or similar) — the inner component that owns `useSearchParams()`, extracted from `page.tsx` if doing so cleans up the page boundary. **Optional refactor; if `page.tsx` is small enough to host both the inner function and the Suspense wrapper inline, keep both in one file.**

Nothing else. No other routes. No layout changes. No canonical AdminPage features touched. No prose, no logic.

---

## The locked fix pattern

Standard Next.js 13+ pattern for `useSearchParams()` + static generation:

```tsx
// app/admin/page.tsx (after CC-049)
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function AdminPageInner() {
  const searchParams = useSearchParams();
  // ... existing /admin logic that reads from searchParams ...
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <AdminPageInner />
    </Suspense>
  );
}
```

The pattern: extract the body of the page component into an inner function, wrap it in `<Suspense>` from the exported page component. The fallback can be minimal — `<div>Loading…</div>` is sufficient. Match the existing typography register if the project has one (e.g., serif body, ink color); otherwise plain `<div>` is fine.

---

## Steps

### 1. Read `app/admin/page.tsx`

`Read` the current file. Identify where `useSearchParams()` is called and what the surrounding component does. The page may be small (one component, a few lines) or it may have multiple components and routing logic. The fix applies regardless of size.

### 2. Decide refactor scope

- **If `page.tsx` is small (one component, ≤ 50 lines):** extract the inner function inline within `page.tsx`. Single-file change.
- **If `page.tsx` is larger (multiple components or > 50 lines):** create `app/admin/AdminPageInner.tsx` (or whatever filename matches the project's convention), move the body there, and have `page.tsx` import + Suspense-wrap it.

Either path satisfies the fix. Pick whichever produces the cleaner diff for the existing file's structure.

### 3. Apply the Suspense wrapper

Per the locked pattern above. Verify:

- `useSearchParams()` is called *only* inside the inner component, never inside the exported page component.
- The `<Suspense>` has a `fallback` prop (any React node; minimal is fine).
- The `"use client"` directive stays at the top of `page.tsx` if it was there pre-CC-049.

### 4. Verification

- `npx tsc --noEmit` exits 0.
- `npm run lint` passes.
- **`npm run build` succeeds completely** — including static page generation for `/admin`. This is the load-bearing verification; if `/admin` still fails, the fix didn't take.
- Manual: navigate to `/admin` in `npm run dev`, confirm the page renders identically to pre-CC-049 (the Suspense fallback flashes briefly but the actual page content matches).

### 5. Browser smoke (Jason verifies)

- `/admin` route loads without errors.
- Search params (e.g., `?q=...` or whatever the admin uses) still parse correctly.
- The Suspense fallback (*"Loading…"* or whatever string is chosen) is visible only briefly during initial render.
- Production build completes — `npm run build` finishes without the prerendering error for the first time in many CCs.

---

## Acceptance

- `app/admin/page.tsx` (and optionally `app/admin/AdminPageInner.tsx`) refactored per the locked pattern.
- `useSearchParams()` is called only inside an inner component wrapped by `<Suspense>`.
- `npx tsc --noEmit` exits 0.
- `npm run lint` passes.
- **`npm run build` exits successfully** — no prerendering error on `/admin`.
- `git diff --stat` shows changes only in `app/admin/`.
- `/admin` route renders identically to pre-CC-049 in dev.

---

## Out of scope

- **Refactoring any other route.** Only `/admin` is affected.
- **Adding new features to `/admin`.** Pure bug fix.
- **Changing the admin's search-params semantics or query handling.** The values consumed by `useSearchParams()` stay the same; only the call site moves.
- **Restyling the Suspense fallback.** Any minimal fallback is acceptable; matching the project's typography register is optional polish.
- **Changing the `"use client"` boundary** beyond what the fix requires.
- **Updating canon docs.** This is a code-only fix; no canon implications.
- **Editing tests.** No tests reference `/admin`'s rendering structure that would need updating, but if any do (unlikely), update only the directly-affected assertion.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

Codex equivalent acceptable.

## Execution Directive

Single pass. Trivial scope. Edit, verify, ship. The refactor pattern is locked; if the executor finds an architectural reason to deviate (e.g., `useSearchParams()` is called from a hook deeper in the tree rather than directly in `page.tsx`), apply the same Suspense-wrap principle at the right boundary and document the deviation in Report Back.

## Bash Commands Authorized

- `cat app/admin/page.tsx`
- `ls app/admin/`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` (smoke; kill before exiting)
- `git diff --stat`
- `git status`

## Read First (Required)

- `app/admin/page.tsx` (the file in scope; full read).
- `app/admin/` directory listing — check for related components.
- Any layout file at `app/admin/layout.tsx` if present (read-only context).
- `package.json` to confirm Next.js version (the `useSearchParams()` Suspense requirement applies to Next 13+).

## Allowed to Modify

- `app/admin/page.tsx`
- `app/admin/AdminPageInner.tsx` (new, if the refactor benefits from extraction)

## Report Back

1. **Files modified** — paths and line counts.
2. **Refactor approach taken** — inline (single file) or extracted (two files), with one-line justification.
3. **Verification results** — paste tsc, lint, and `npm run build` outputs. The build output should now show `/admin` prerendered successfully.
4. **First clean build confirmation** — explicitly confirm `npm run build` exits 0 with no /admin error. This is the load-bearing acceptance.
5. **Any deviation from the locked pattern** — if the executor encountered a hook-tree depth or other architectural surprise that required a different fix, document.

---

## Notes for the executing engineer

- This fix has been deferred CC after CC. The cumulative cost of every production-build verification failing on the same wire is now substantial — get this right and every subsequent CC's verification report stops carrying the *"modulo /admin"* asterisk.
- The `<Suspense>` fallback content is not load-bearing for the fix. Any node works. Minimal is fine.
- If the page is *already* using Suspense somewhere but the prerender still fails, the boundary is in the wrong place — `useSearchParams()` must be inside the Suspense, not above it. Verify the boundary location specifically.
- If `useSearchParams()` is called from a nested hook (e.g., a custom hook used by the page), the fix may need to wrap the page in Suspense at the outer level. The principle is: nothing that calls `useSearchParams()` (directly or transitively) can be outside a Suspense boundary during static generation.
- Pre-CC-049 saved sessions and admin URLs continue to work identically. The fix changes rendering structure, not routing or search-params semantics.
- This is the smallest CC of the prose-and-canon track interleaved between CC-048 and CC-044. Ship it fast; downstream CCs benefit from clean build verification.
