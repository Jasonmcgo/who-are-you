# CC-021c — Researcher UI Hotfix (Upload + Label + T-015 Key + Office Docs)

## Launch Directive

You are executing CC-021c. This is a hotfix CC addressing four issues surfaced in browser smoke of CC-021a:

1. **React duplicate-key warning on T-015** — `MirrorSection.tsx` line 206 uses `key={t.tension_id}` for a map over `allocationTensions`; when two T-015 instances fire (Money-Wider + Energy-Inward), both share `tension_id: "T-015"` and React logs a duplicate-key warning.
2. **AttachmentsPanel label field locks after first selection** — once the user picks a value from the label dropdown during pre-upload form fill, the field doesn't re-open or accept a different value. User cannot change their mind without refreshing the page.
3. **AttachmentsPanel upload flow broken** — the file selection / state-update / button-enable / network-fire sequence is failing somewhere. CC-021a's smoke passed on the API endpoint via direct HTTP calls but the UI flow does not work end-to-end. The Upload button reportedly stays disabled even after the user attempts to select a file. Full audit of the state flow required.
4. **MIME allow-list missing common Office formats** — Word, Excel, PowerPoint, RTF documents are rejected by the server. Researchers commonly upload Word interview notes; this is a real gap.

All four are bug fixes / scope corrections, not new features. No new components, no new types, no new schema, no new canon docs. Tightly scoped to the four issues.

Sequenced after CC-020 and CC-021a. Independent of the v2 Coherence Engine work; safe to land in any order.

## Bash Authorized

Yes. Use the shell for `tsc`, `eslint`, dev-server smoke, and `curl` against the running dev server for the upload flow verification. Do not commit or push.

## Execution Directive

### Item 1 — MirrorSection T-015 key collision

**File:** `app/components/MirrorSection.tsx` line 206 (per CC-021a's report).

The current `.map(...)` over `allocationTensions` uses `key={t.tension_id}`. When two T-015 instances fire in the same session, both items have identical keys. Fix: include the map index in the key.

**Change:**

```tsx
{allocationTensions.map((t, idx) => (
  <p
    key={`${t.tension_id}-${idx}`}
    className="font-serif"
    ...
```

The `idx` produces unique keys across the map even when `tension_id` repeats. Stable per-render (the index doesn't change for a given session's tensions array).

If you find a more stable differentiator (e.g., `t.signals_involved[0]?.signal_id`) that's also reliably unique, that's preferable to index-as-key — but for this fix, index is sufficient and immediately closes the warning.

Verify by opening the result page in dev, inspecting the browser console, and confirming the duplicate-key warning is gone for any session with two T-015 instances.

### Item 2 — AttachmentsPanel label field re-editability

**File:** `app/components/AttachmentsPanel.tsx` (label-field portion of the upload form).

CC-021a's engineer chose `<input list>` (datalist) for the label field — gives freeform-with-autocomplete. But the implementation locks after first selection: re-clicking the field doesn't re-open the dropdown, and typing a new value doesn't appear to clear the previous selection.

Replace with a strict `<select>` element and a default *neutral* option that returns the field to "no label chosen" state. Pattern:

```tsx
<label htmlFor="attachment-label">LABEL (optional)</label>
<select
  id="attachment-label"
  name="label"
  value={label ?? ""}
  onChange={(e) => setLabel(e.target.value || null)}
>
  <option value="">— select —</option>
  <option value="LLM rewrite">LLM rewrite</option>
  <option value="Interview notes">Interview notes</option>
  <option value="Consent form">Consent form</option>
  <option value="Audio recording">Audio recording</option>
  <option value="Screenshot">Screenshot</option>
  <option value="Other">Other</option>
</select>
```

Six canonical options + a default *"— select —"* option that maps to no label (null sent to server, or empty string omitted from FormData). The user can return to *"— select —"* at any time before clicking Upload to clear the selection. After clicking Upload, the label is locked into the database row (CC-021a's design intentionally makes labels immutable post-upload; this CC does not change that posture).

The trade-off vs CC-021a's freeform-with-datalist approach: lose the ability to type "LLM rewrite v2" or other compound labels. If a researcher genuinely needs custom labels, the **notes** field captures any descriptive text the label can't (and notes ARE editable post-upload via PATCH).

### Item 3 — AttachmentsPanel upload-flow audit

**File:** `app/components/AttachmentsPanel.tsx` (upload form + handlers).

Symptom: Upload button stays disabled even after the user attempts to pick a file. CC-021a's API endpoint works (smoke verified via direct HTTP), so the bug is in the UI's file-selection → state-update → button-enable → submit sequence.

Audit each step. The most likely failure points, in order:

**A) File picker opening.** Click "Choose File" — does the macOS file picker dialog open? If not, the file input may be hidden (`display: none` with no associated label/button click handler), or the click handler may not call the input's `.click()` method. Fix: ensure the visible "Choose File" button is either the native `<input type="file">` styled appropriately, or it triggers a hidden input via `.click()`.

**B) `onChange` handler firing on file selection.** When the user picks a file in the dialog, the file input's `onChange` event should fire with `e.target.files[0]`. Add a `console.log` defensively during the audit; if it doesn't fire, the input element isn't wired correctly.

**C) State update.** The `onChange` handler should call `setSelectedFile(file)` (or whatever the state name is). The state should update synchronously. Check that the state variable is actually being set and that the component re-renders.

**D) Filename rendering.** After state updates, the *"No file chosen"* text should change to the selected filename. If state updates but UI doesn't reflect — there's a render bug. Likely the filename is read from a different source than where the state is set.

**E) Upload button's `disabled` prop.** The button should be `disabled={!selectedFile}` (or similar). Verify the prop reads the same state variable that's being set in step C. A common bug: the prop reads a stale ref or a derived value that doesn't recompute on state change.

**F) Submit handler.** Clicking Upload (when enabled) should construct a `FormData` object with the file + label + notes, and `fetch` POST to `/api/admin/sessions/[id]/attachments`. Verify the fetch fires (Network tab in dev tools should show the request); verify the response is handled (success → reload list; error → display message).

Make whatever fixes are necessary. Surface in the report which steps were broken and what the fix was. If the bug turns out to be a single root cause (e.g., the `onChange` was wired to the wrong input element), document that clearly.

### Item 4 — Extend MIME allow-list for Office documents

**File:** `lib/attachmentStorage.ts`.

Add the following MIME types to `ALLOWED_MIME_TYPES`:

```ts
"application/msword",                                                          // .doc
"application/vnd.openxmlformats-officedocument.wordprocessingml.document",     // .docx
"application/vnd.ms-excel",                                                    // .xls
"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",           // .xlsx
"application/vnd.ms-powerpoint",                                               // .ppt
"application/vnd.openxmlformats-officedocument.presentationml.presentation",   // .pptx
"application/rtf",                                                             // .rtf
```

The 10 MB size cap stays unchanged; Office files often exceed 1 MB so the cap is the relevant constraint, not the type list.

If the file input's `accept=""` attribute (in `AttachmentsPanel.tsx`) restricts to a subset, update or remove it so the file picker dialog shows the newly-allowed types client-side. The server is the authoritative gate; the client `accept` attribute is just UX hinting.

Verify after fix by uploading a sample `.docx` or `.xlsx` file and confirming the API responds 201 instead of 400.

## Allowed-to-Modify

- `app/components/MirrorSection.tsx` — fix Item 1.
- `app/components/AttachmentsPanel.tsx` — fix Items 2 and 3.
- `lib/attachmentStorage.ts` — fix Item 4 (extend `ALLOWED_MIME_TYPES`).

No other file should be modified. Specifically:

- No new components.
- No new API routes.
- No new schema or migration.
- No new types in `lib/types.ts`.
- No changes to canon, README, or build configuration.

## Out of Scope — explicit "do not" list

- **Do not** modify the post-upload immutability of labels. CC-021a's design (label set at upload time, immutable thereafter, only notes editable via PATCH) stays as-is. Item 2 fixes pre-upload re-editability ONLY.
- **Do not** modify the API routes, the auth middleware, the schema, or any database-side logic.
- **Do not** modify any rendering logic of the InnerConstitution, the Map, the Path section, or the eight cards. The MirrorSection fix is strictly the `key` prop on the allocation-tensions map.
- **Do not** introduce new question types, signals, tensions, or canon documents.
- **Do not** modify the dual-T-015 markdown rendering in `lib/renderMirror.ts` (the differentiated subheadings stay; CC-020 already handled that). The on-screen MirrorSection still renders both T-015 paragraphs without the differentiated subheadings — that's a separate UX polish for a future CC, not in scope here.
- **Do not** modify the engine, signal extraction, tension detection, or per-card derivation.
- **Do not** introduce object storage, cloud config, or production deployment changes.
- **Do not** modify CC-014 second-pass, CC-016 cascade-skip, CC-016b Accept/Skip, CC-017 Q-I block, CC-018 Q-T shuffle, CC-019 save flow, or CC-020 share/print flow. All preserved as-is.
- **Do not** add a real authentication system; the passcode pattern stays.
- **Do not** add file thumbnailing, previews, or in-browser document viewing.
- **Do not** modify `.env.local` or any other env file.

## Acceptance Criteria

1. **T-015 duplicate-key warning is gone** in browser console for any session with two T-015 instances. Verify by opening a saved session that produced two T-015 fires (Madison's session likely has at least one T-015) in `/admin/sessions/[id]` or in the live test flow's result page; check the browser console.
2. **Label dropdown re-editable pre-upload**: select a value, then change to a different value before clicking Upload. The select element returns to *"— select —"* state when chosen and accepts new selections freely.
3. **Label is locked post-upload**: once an attachment is uploaded, its label appears in the attachment list (per CC-021a's render) and is not editable from the UI. (No PATCH route for label exists; this is preserved by not adding one.)
4. **Upload flow works end-to-end**: pick "Choose File," select a file in the dialog, see the filename appear next to "Choose File," see the Upload button become enabled, click Upload, the network request fires, the response 201 lands, the attachment appears in the list, and the file is on disk in `attachments/{session_id}/`.
5. **Office formats accepted**: upload a `.docx` file (or `.xlsx`, `.pptx`, `.rtf`) and confirm 201 success. Upload a disallowed type (e.g., `.zip` or `.exe`) and confirm 400 with the spec'd error message.
6. **TSC clean.** `npx tsc --noEmit` exits 0.
7. **Lint clean.** `npm run lint` exits 0.
8. **Existing flows unchanged**: take the test, save a session, share/print, view in `/admin/sessions`, view session detail. All work identically to before this CC.
9. **No file outside the Allowed-to-Modify list is modified.**

## Report Back

1. **Files changed** — file-by-file summary.
2. **T-015 key fix verification** — paste a snippet of the fixed `.map(...)` and a brief note confirming the console warning is gone in browser smoke (or mock if you can't run the browser).
3. **Label dropdown fix verification** — paste the new `<select>` JSX. Describe the user flow (select option A, then change to option B, confirm field updates and is editable).
4. **Upload flow audit findings** — for each of A through F in Item 3, report what was found and what was fixed. If a single root cause was responsible for the entire flow being broken, name it explicitly.
5. **Upload flow end-to-end smoke**: walk through file selection → filename render → button enable → Upload click → network response → row created → file on disk. Paste the API response body and the resulting `attachments` row.
6. **Office format verification** — paste the result of uploading a `.docx` (success) and a `.exe` (rejected with 400).
7. **TSC + lint** — exit codes.
8. **Scope-creep check** — confirm only allowed files modified.
9. **Risks / next-step recommendations** — anything noticed during the work that warrants a follow-up CC.

## Notes for the executing engineer

- **Item 3 is the core bug.** The other three are simpler fixes; the upload-flow audit is where the real diagnostic work happens. Do that one carefully — instrument with console.log defensively during the audit, surface what you find, and remove the logs before declaring done.
- **The CC-021a smoke passed on the API endpoint via direct HTTP** but missed the UI flow. That's a real verification gap. When you fix the UI flow, also walk through it manually in a browser (or describe what you'd expect to see) so this gap doesn't recur.
- **Item 2's swap to `<select>` removes the freeform-label capability** that CC-021a's `<input list>` provided. If during the audit you find the existing implementation can be salvaged with a smaller fix (e.g., the dropdown does re-open if a different state is reset), that's preferable to swapping the element. Use your judgment; if salvage is messy, ship the `<select>` swap.
- **Item 4's allowed types are minimum** — if you find common research formats not yet on either CC-021a's or this CC's list (e.g., `.eml` for email exports, `.zip` for archives), surface in the Risks section but ship as-spec'd.
- **Browser smoke deferred to Jason after the CC lands** — your role is to verify the engine-level fix (console warning, allowed type accepted, server response) and report what you fixed in Item 3. Visual verification of the dropdown UX and the upload-button-enabling sequence is Jason's after the build is in his hands.
