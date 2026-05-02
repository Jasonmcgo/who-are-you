# CC-013 — Design Prototype Drop (Reference Files Only)

## Goal

Fetch the Claude Design Lab prototype reference files and place them into `docs/design-prototype/` so subsequent translation CCs (CC-D2, CC-D3, etc.) have the pixel-faithful reference the project's `docs/design-prototype/README.md` was written to expect.

This CC is **fetch + place + report.** Nothing more. It does not run the prototype, does not translate any of its code into the production stack, does not modify any file outside `docs/design-prototype/`, and does not touch any component or canon file. Translation from prototype to production is a separate downstream CC (or sequence of CCs) that reads what CC-013 dropped and decides — file by file, divergence by divergence — what to port.

The prototype is **reference, not production code.** Per `docs/design-prototype/README.md`:

> *"These files exist as a pixel-faithful and interaction-faithful reference for translating the spec into CC prompts. Translation between the two is a CC author's decision; do not lift the prototype code wholesale."*

CC-013 honors that explicitly: the files arrive in `docs/design-prototype/` and stay there. No file under `app/`, `lib/`, `data/`, `docs/canon/`, or anywhere else is touched.

---

## Launch Directive (CC tool)

**Run this CC with permission-bypass at the CC tool level.**

```
claude --dangerously-skip-permissions
```

Or, mid-session, type `/permissions` and pick **bypass permissions** mode.

The fetch and the file-write are quick. Per-edit approval prompts will defeat single-pass execution but the surface area is small.

## Bash Commands Authorized

This CC will run the following bash commands without further user approval:

- `curl` (or equivalent) to fetch from the design URL. If the fetch fails (URL unreachable, requires authentication, returns non-2xx), report the failure and stop — do not improvise content.
- `ls`, `cat`, `wc`, `head`, `tail`, `file` for verification.
- File-write commands to place fetched content into `docs/design-prototype/`.

The agent should not pause to ask permission for these.

---

## Execution Directive

Complete the fetch, placement, and report in a single pass. Do **not** pause mid-execution to ask the user for confirmation, approval, or scope clarification.

If the URL returns content that is genuinely ambiguous (e.g., a single response containing multiple file boundaries that need parsing, or a redirect to a different host), apply the most spec-faithful interpretation, place what can be confidently identified, and flag the rest in Risks / next-step recommendations.

If the fetch fails entirely (network error, 4xx/5xx response, authentication required, host unreachable), do not improvise file content. Report the failure clearly with the HTTP status / error and stop. The user will retry with a different URL or a different fetch path.

Do not truncate the work to request user review. Only the final report-back goes to the user.

---

## Read First (Required)

Reference (do NOT edit):

- `docs/design-prototype/README.md` — describes the expected files (`Who Are You.html`, `components.jsx`, `styles.css`), their roles, and the translation discipline. **The README will be updated by this CC** (Status section only); read it before editing so the update lands cleanly.
- `docs/design-spec-v2.md` § 1–17 — the brief that was sent to Claude Design Lab. The fetched files are the response to this brief. No edits.

That's it. CC-013 doesn't need to read canon, types, or runtime code — it doesn't translate, it just drops.

---

## Context

The design URL provided by the user is:

```
https://api.anthropic.com/v1/design/h/fPOZWkj6XzaMjXS45ES2cg?open_file=components.jsx
```

The `?open_file=components.jsx` query parameter is a UI hint, not a content filter. The endpoint may return:

- A multi-file response (likely a JSON envelope or a directory listing referencing all three files).
- A single file (`components.jsx`) with sibling files reachable by varying the query parameter or a path component.
- A web-rendered page that requires further fetches to retrieve raw file content.

The agent must determine the response shape on first fetch and then retrieve all three expected files (`Who Are You.html`, `components.jsx`, `styles.css`) via whatever path the endpoint supports. If only some are accessible, drop what arrives and report which are missing.

If the URL returns nothing useful or requires authentication the agent does not have, **report the failure and stop.** Do not generate prototype content from imagination, do not substitute existing project components for the missing files, do not partial-implement based on the spec alone.

---

## Decisions Locked in This Prompt

### D-1: File placement

All fetched files go into `docs/design-prototype/`. Filenames preserve the design lab's exact naming, including spaces:

- `docs/design-prototype/Who Are You.html` (note the space and capitalization)
- `docs/design-prototype/components.jsx`
- `docs/design-prototype/styles.css`

If the design lab named files differently (e.g., `who-are-you.html` or `index.html` or `App.jsx`), preserve their actual names — flag the discrepancy in the report so the README's "Expected files" section can be reconciled in a follow-up.

### D-2: File contents are byte-for-byte verbatim

Do not reformat, lint-fix, prettier-pass, or modify the fetched content in any way. The reference value is in fidelity. If the fetched content contains tabs, trailing whitespace, comments, console.log statements, or anything else that would normally get cleaned — keep it.

### D-3: README Status update

The README currently says:

> *"This directory was created 2026-04-24 alongside `docs/design-spec-v2.md`. Reference files are not yet in place. Once they're added, this README's 'Expected files' section becomes a manifest of what's present."*

After CC-013, replace that paragraph with a Status block listing:

- Date the files dropped (use today's date — agent can run `date` if needed).
- Each file that arrived with file size and line count.
- Any expected file that did NOT arrive, with a brief note on why.
- The CC that performed the drop (CC-013).

Do not modify any other section of the README. Specifically: do not modify the "How CC prompts should reference these" section, the "Not in scope" section, or any other prose. README edits are limited to the Status section.

### D-4: Absolutely no production-code changes

This CC does not modify any file under `app/`, `lib/`, `data/`, `docs/canon/`, `prompts/`, or any other production directory. It does not modify `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `.claude/settings.local.json`, or any configuration file.

Even if `components.jsx` imports a library not currently in `package.json`, do NOT add the dependency. Even if `styles.css` references font URLs the production stack doesn't load, do NOT modify `app/layout.tsx`. Even if `Who Are You.html` references icon assets, do NOT copy them into `public/`.

Translation work happens in a separate downstream CC.

### D-5: No execution

Do not run `npm install`, `npm run dev`, or any other command that would execute prototype code. The files are inert reference material as far as CC-013 is concerned.

### D-6: No regression risk on existing code

`npx tsc --noEmit` and `npm run lint` should pass before and after CC-013 with no change in their output, because no production file is touched. The agent should run both as a regression sanity check at the end of the CC and confirm zero diff in their output.

---

## Requirements

### 1. Fetch the design URL and identify the response shape

Attempt the fetch. Identify whether the response is:

- A multi-file envelope (JSON, archive, etc.) — extract all three expected files.
- A single file with sibling URLs — fetch each sibling.
- A web page that requires HTML parsing — extract raw file content from script tags or downloadable links.
- An authentication failure or unreachable host — report and stop.

### 2. Place fetched files into `docs/design-prototype/`

Per § D-1 / § D-2. Byte-for-byte verbatim. Filenames preserved.

### 3. Update `docs/design-prototype/README.md` Status section

Per § D-3. Status block listing what arrived, what didn't, and the date.

### 4. Verify no production code was touched

- `git status` should show changes only under `docs/design-prototype/` (the three new files plus the README edit).
- `git diff --stat` confirms the surface area is bounded.
- `npx tsc --noEmit` runs cleanly (no diff in output from pre-CC-013).
- `npm run lint` runs cleanly (no diff in output from pre-CC-013).

### 5. Report back

Per § Report Back below.

---

## Allowed to Modify

- `docs/design-prototype/Who Are You.html` (NEW — created by fetch).
- `docs/design-prototype/components.jsx` (NEW — created by fetch).
- `docs/design-prototype/styles.css` (NEW — created by fetch).
- `docs/design-prototype/README.md` (Status section only; all other prose preserved).

Do **NOT** modify any other file. Specifically:

- Any file under `app/`, `lib/`, `data/`, `docs/canon/`, `prompts/`.
- Any config: `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `.claude/settings.local.json`, `AGENTS.md`, `CLAUDE.md`, `README.md` (project root README, not the design-prototype README).
- Any other section of `docs/design-prototype/README.md` outside the Status block.
- Any file under `public/`, even if the prototype references icons or fonts that would need to live there.

---

## Out of Scope

CC-013 does not do any of the following. Each is a future-CC concern.

- **Translation of prototype code into the production stack.** Future CC-D2 (or whatever the next translation CC is named) reads what CC-013 dropped and decides what to port.
- **Adding npm dependencies referenced by the prototype.** Future translation CC handles this.
- **Loading prototype fonts / assets.** Future translation CC handles this.
- **Diff comparison between prototype and current `app/components/*.tsx`.** Future review CC.
- **Identifying which prototype components map to which production components.** Future translation CC.
- **Any modification to existing production code, types, canon, or runtime.**

---

## Acceptance Criteria

1. `docs/design-prototype/components.jsx` exists with byte-for-byte content from the design URL (no reformatting). If the file did not arrive from the fetch, this criterion is documented as failed in report-back with a clear reason.
2. `docs/design-prototype/Who Are You.html` exists similarly, OR is documented as missing with reason.
3. `docs/design-prototype/styles.css` exists similarly, OR is documented as missing with reason.
4. `docs/design-prototype/README.md` Status section is updated to reflect what arrived and what didn't, with today's date and the CC ID.
5. `git status` shows changes only inside `docs/design-prototype/`. No file under `app/`, `lib/`, `data/`, `docs/canon/`, `prompts/`, or root config has been modified.
6. `npx tsc --noEmit` runs cleanly (no change in output vs. pre-CC-013).
7. `npm run lint` runs cleanly (no change in output vs. pre-CC-013).
8. No npm dependency was added.
9. The prototype was not executed.
10. If the fetch failed, the report clearly documents the failure with HTTP status / error message and the CC stopped without imagining file content.

---

## Report Back

Return a single markdown block with the following sections, in order:

1. **Fetch result** — describe the response shape (multi-file envelope, single file with siblings, web page, etc.). Quote the HTTP status code(s) for each fetch attempt. If the fetch failed, this section is the bulk of the report and explains what was tried.
2. **Files placed** — for each file that arrived: full path, file size in bytes, line count, a 5-line head + 5-line tail excerpt to confirm content fidelity. If a file did not arrive, say "MISSING — [reason]."
3. **README Status update** — quote the new Status block verbatim.
4. **Surface-area verification** — output of `git status --short` and `git diff --stat`. Confirm only `docs/design-prototype/` paths appear.
5. **Regression sanity** — output of `npx tsc --noEmit` and `npm run lint`. Confirm zero functional change vs. pre-CC-013.
6. **Component-name preview** (informational, not action-taken) — grep `components.jsx` for top-level component names (e.g., `export default function`, `export function`, `const X = ()`) and list them. This helps the next translation CC identify which prototype components correspond to which production components. **Do not act on this list.** Just surface it.
7. **Class-name / token preview** (informational) — grep `styles.css` for the design tokens used (`--paper`, `--ink`, `--umber`, `--rule`, etc.). Compare to what's already in `app/globals.css` (read-only) — list any tokens the prototype references that are NOT yet in the production stylesheet. **Do not add them to globals.css.** Just surface for the translation CC's planning.
8. **Scope-creep check** — explicit confirmation that:
    - No production file was modified.
    - No npm dependency was added.
    - No prototype code was executed.
    - The README's Status section is the only README edit; all other README prose is byte-identical.
    - `tsc` and `lint` outputs are byte-identical pre/post CC.
9. **Risks / next-step recommendations** — anything that surfaced. Specifically:
    - If the fetch URL required authentication or returned content that suggests it's not the intended endpoint, flag.
    - If the prototype's component names (from § 6) overlap with existing production component names (`Ranking`, `QuestionShell`, `ProgressIndicator`, `ShapeCard`, `TensionCard`, `MbtiDisclosure`, `InnerConstitutionPage`), flag the overlap and recommend a translation CC that picks one mapping at a time.
    - If the prototype's design tokens (from § 7) diverge significantly from the CC-D production tokens, flag the divergence.
    - Any other observation worth surfacing for the downstream translation CC.
