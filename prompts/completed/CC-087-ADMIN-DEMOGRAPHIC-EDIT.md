# CC-087 — Admin Demographic Edit (Unified Per-Field EDIT Pattern)

## Objective

Extend the existing admin answer-review surface to also support per-field demographic editing, matching the EDIT-button-per-row UX already present on `/admin/sessions/[id]/answers`. The standalone `/admin/sessions/ghost-mapping` page built by CC-DEMOGRAPHICS-SAVE-WIRING is functional but doesn't match the user's preferred admin interaction pattern. This CC delivers the unified surface.

**Concrete need being closed:** Two prod sessions are anonymous:
- **Anonymous (Dan, 3h+ ago 2026-05-16)** — Skip-drop casualty before the fix landed
- **JasonDMcG, 2d ago** — took before email gate enforced
Plus all five named users could need a demographic field corrected (e.g., age decade, profession value).

This CC gives the admin a per-field EDIT button + inline form on the existing `/admin/sessions/[id]/answers` (or a sibling `/demographics` route — executor's call which is cleaner). Reuses the `attachDemographicsToSession` server action built by CC-DEMOGRAPHICS-SAVE-WIRING. Writes audit-log entries to the `ghost_mapping_audit` table that already exists.

## Sequencing

- **Can fire in PARALLEL with CC-084, CC-085, or CC-086.** Zero engine/renderMirror.ts file overlap.
- **Independent of all three engine CCs.** This is UX work only.

## Launch Directive

Run with `claude --dangerously-skip-permissions`.

## Execution Directive

Single pass. If the existing `/admin/sessions/[id]/answers` page architecture is too entangled to extend cleanly, build a sibling `/admin/sessions/[id]/demographics` page instead. Don't force-fit if it requires refactoring the answers page.

## Bash Commands Authorized

- `grep`, `ls`, `cat`, `find`, `wc`
- `npx tsc --noEmit`
- `npm run lint`
- `npx tsx tests/audit/<name>.audit.ts`

Do NOT run `npm install`, `git commit`, `git push`, `drizzle-kit push`, or any LLM build script.

## Read First (Required)

1. `app/admin/sessions/[id]/answers/` (or wherever the answer-edit page lives) — confirm the existing per-field EDIT pattern's structure. This is the UX to mirror.
2. `app/admin/sessions/ghost-mapping/page.tsx` — the standalone page from CC-DEMOGRAPHICS-SAVE-WIRING. Confirm whether this CC supersedes it or coexists.
3. `app/admin/sessions/ghost-mapping/GhostMappingForm.tsx` — reuse this component or its server action wiring.
4. `lib/saveSession.ts` — the `attachDemographicsToSession` server action. This CC's UI calls it.
5. `db/schema.ts` — `demographics` table shape + `ghost_mapping_audit` table.
6. `data/demographics.ts` — the canonical demographic field list (DEMOGRAPHIC_FIELDS).

## Scope

### Item 1 — Per-field EDIT UI surface

Add a "Demographics" section to `/admin/sessions/[id]/answers` (or sibling route `/admin/sessions/[id]/demographics`). Behavior:

- For each demographic field (name, gender, age_decade, location, marital_status, education, political, religious, profession, contact_email, contact_mobile), render a row showing:
  - Field label (per DEMOGRAPHIC_FIELDS)
  - Current value (or italicized "—" if empty)
  - Current state (specified / prefer_not_to_say / not_answered)
  - EDIT button
- Clicking EDIT swaps the row to an inline form:
  - Input field appropriate to the type (text input for name/email/mobile/profession/location; radio/select for gender/age_decade/marital/education/political/religious)
  - "Prefer not to say" toggle
  - Save / Cancel buttons
- Save calls `attachDemographicsToSession` server action with the field's new (value, state) pair + required `admin_label` (free-text identifier for who's making the edit) + optional note
- Audit log entry written to `ghost_mapping_audit` per existing schema (before_snapshot + after_snapshot)

### Item 2 — Reuse existing server action

The CC-DEMOGRAPHICS-SAVE-WIRING CC built `attachDemographicsToSession` as a per-call full-row upsert. This CC's per-field EDIT calls it with the full current demographics + the one changed field. The server action's idempotency means re-calling with the same data is safe.

If `attachDemographicsToSession` only accepts full rows (not partial updates), either:
- Read the existing demographics row, merge the one changed field, pass the merged row in (simplest)
- OR extend `attachDemographicsToSession` to accept a partial-update mode (more code, cleaner API)

Pick whichever is faster. Document the choice.

### Item 3 — Coexistence vs supersession of `/admin/sessions/ghost-mapping`

Two options:
- **Supersede** — delete the standalone ghost-mapping page; it's redundant with the per-session edit.
- **Coexist** — keep the standalone page as a "triage list" view that links to per-session edit pages.

Recommend coexist (the triage view is useful when prioritizing which anonymous rows to fix first). If superseding, also remove the audit assertion that checks the standalone page exists (in `demographicsSaveWiring.audit.ts` — `ghost-mapping-page-exists`).

### Item 4 — Smoke verification

Manually verify the flow against local DB (sandbox can't run the dev server, so this is documented expected behavior rather than tested automatically):
- Load `/admin/sessions/[Dan's-session-id]/answers` (or `/demographics` if sibling route chose)
- Click EDIT on name field, type "Daniel", save
- Verify the row in local DB has name_value = "Daniel" + a ghost_mapping_audit entry
- Same for email field

### Item 5 — Audit

New `tests/audit/adminDemographicEdit.audit.ts` with assertions:
1. The new admin route exists (file present at the expected path)
2. The route imports `attachDemographicsToSession` from `lib/saveSession.ts`
3. The route imports DEMOGRAPHIC_FIELDS from `data/demographics.ts`
4. The route's form component contains an EDIT button per field
5. The route uses the same fingerprint-display pattern as `/admin/sessions/[id]/answers` (sanity check that it matches the existing admin aesthetic — verify by grep for the answers-page's row class names or component imports)
6. The standalone ghost-mapping page either still exists (if coexist chosen) or the assertion documenting its removal is added to `demographicsSaveWiring.audit.ts` (if supersede chosen)

## Do NOT

- **Do NOT change any engine code.** This CC is UX + admin only.
- **Do NOT change the `demographics` or `ghost_mapping_audit` schema.** Use existing columns.
- **Do NOT change the `attachDemographicsToSession` server action's signature** unless Item 2 requires it (partial-update mode). If extended, the existing call sites in `app/admin/sessions/ghost-mapping/GhostMappingForm.tsx` must continue to work.
- **Do NOT auto-attach identity to any session.** Every edit requires explicit admin click + admin_label.
- **Do NOT touch the `/assessment` flow.** User-facing form is out of scope here.
- **Do NOT modify Wave 1 persistence files** (the *LlmServer.ts modules, llmRewritesBundle, sessionLlmBundleStore, staleShape).
- **Do NOT regenerate any cache file** under `lib/cache/`.
- **Do NOT regenerate `tests/audit/twoTierBaseline.snapshot.json`.** Render output unchanged by this CC; baseline should match.
- **Do NOT call any LLM.** No `*LlmServer.ts` imports. No `@anthropic-ai/sdk`.
- **Do NOT commit or push.**
- **Do NOT write to prod DB during this CC.** Local DB only for testing. Prod ghost-mapping is the user's manual action after CC lands + Vercel deploys.

## Allowed to Modify

- `app/admin/sessions/[id]/answers/page.tsx` (extend with demographics section)
   OR `app/admin/sessions/[id]/demographics/page.tsx` (new sibling route)
- `app/admin/sessions/[id]/answers/AnswerEditForm.tsx` (if extending answers page; otherwise new DemographicEditForm.tsx)
- `lib/saveSession.ts` (extend `attachDemographicsToSession` per Item 2 if needed; preserve existing signature for ghost-mapping page)
- `tests/audit/adminDemographicEdit.audit.ts` (new)
- `tests/audit/demographicsSaveWiring.audit.ts` (only if Item 3 supersede chosen)
- `package.json` (add `audit:admin-demographic-edit` script)
- Move prompt to `prompts/completed/` at end

## Out of Scope

- Engine math / prose / rendering
- Schema changes
- User-facing assessment flow
- LLM rewrite layer
- Ghost-mapping rows in prod (admin action post-deploy)

## Acceptance Criteria

1. `npx tsc --noEmit` passes
2. `npm run lint` passes
3. `npx tsx tests/audit/adminDemographicEdit.audit.ts` passes all assertions (≥5)
4. Wave 1 audits still pass
5. `audit:demographics-save-wiring` still passes (with optional update per Item 3)
6. Demographics edit UI exists at the documented route
7. Save action writes to `demographics` table + `ghost_mapping_audit` table
8. Edit is per-field, not whole-row replacement
9. Zero modifications to Wave 1 persistence files
10. Zero LLM calls
11. Zero cache file modifications
12. Zero commits
13. Zero writes to prod DB during the CC

## Report Back

- Route location (extended `/answers` or new `/demographics`)
- Item 3 decision (coexist vs supersede) + reasoning
- Item 2 implementation choice (read-merge-write vs partial-update mode)
- Audit results
- Smoke walk: did the executor verify the flow against local DB? If yes, paste the audit-log entry that resulted from the test edit.

## Notes for executor

- Estimated time: 60 min
- Cost: $0
- The biggest risk is over-scoping. The existing answer-edit page might be tempting to refactor; don't. Match its pattern at the row level; don't rebuild the page.
