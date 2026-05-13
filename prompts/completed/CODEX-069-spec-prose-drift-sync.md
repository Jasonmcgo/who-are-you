# CODEX-069 — Spec/Code Prose Drift Sync

**Scope frame:** Mechanical sync. The polished prose templates in `lib/goalSoulGive.ts` (CC-068 output) have drifted from the sample closings in `docs/goal-soul-give-spec.md` §10. CC-068's §8 drift report listed every divergence. This CODEX brings the spec into sync with the code so future CCs read a consistent §10. Single file edited; no structural changes; no canon-judgment work.

**Per `feedback_codex_vs_cc_prompt_naming` memory:** CODEX-NNN is for mechanical/surgical scope. This is exactly that.

---

## Launch Directive

Run with `claude --dangerously-skip-permissions`, or in-session via `/permissions` → bypass. Project has `defaultMode: "bypassPermissions"`.

## Execution Directive

Single pass. No interpretive work — match the code templates verbatim or to close paraphrase preserving meaning. On any case where the spec language reads as preferred over the code language, leave a `<!-- CODEX-069: code drift —> spec preferred -->` HTML comment beside the spec line and proceed; do NOT silently revert.

## Bash Commands Authorized

- `git status`
- `git diff docs/goal-soul-give-spec.md`
- `cat`, `grep`
- `npx tsc --noEmit` (sanity check after edits — should not fail since only docs change)

## Read First (Required)

1. `docs/goal-soul-give-spec.md` — full file. Section 10 is the edit target.
2. `lib/goalSoulGive.ts` — the `PROSE_TEMPLATES` constant. This is the source of truth for the sync.
3. `prompts/completed/CC-068-closing-read-prose-polish.md` §8 (Spec ↔ code drift report) — the explicit drift list. Treat it as a checklist, but verify against the actual `PROSE_TEMPLATES` strings in case CC-068's report drifted from final code.

## Allowed to Modify

This file only:

1. **`docs/goal-soul-give-spec.md`** — only §10 sample closings (the six rendered prose blockquotes). Do NOT edit §10's register-guidance subsection, §10's section header, or any other section of the file.

## Out of Scope (Do Not)

1. Do NOT edit `lib/goalSoulGive.ts` or any code file. This is a one-way doc sync; code is canon, doc follows.
2. Do NOT edit any spec section other than §10 sample closings.
3. Do NOT edit `MEMORY.md`, `AGENTS.md`, or any file under `docs/canon/`.
4. Do NOT add new sections, new closings, or new register-guidance entries. CC-068's six templates are the six samples; no more, no fewer.
5. Do NOT change the order of the six closings in §10.
6. Do NOT add commentary or explanatory prose around the closings beyond what already exists.
7. Do NOT update §11 canon language list or §11a narrative guidance — those are unaffected by this sync.
8. Do NOT create new files.

## Acceptance Criteria

1. The six §10 sample closings (NE Give, SE Striving, NW Longing, SW Gripping, Parallel Lives, Neutral/Transition) match the `PROSE_TEMPLATES` in `lib/goalSoulGive.ts` verbatim, OR differ only by trivial whitespace/markdown formatting (blockquote line breaks).
2. The six closings appear in the same order as in §10 today (Give → Striving → Longing → Gripping → Parallel Lives → Neutral).
3. Each closing in §10 is wrapped in markdown blockquote (`>`) syntax, preserving the existing format.
4. No edits anywhere outside §10 sample closings.
5. `git diff docs/goal-soul-give-spec.md` shows changes only within the §10 sample-closings region.
6. `npx tsc --noEmit` exits 0 (sanity — no code changed, but verify nothing broke).
7. `git status --short` shows ONLY `M docs/goal-soul-give-spec.md`.

## Report Back

1. **Diff summary** — line-count delta, plus a one-line summary of which closing changed most.
2. **Verbatim vs paraphrase calls** — any place the code template was preserved verbatim vs any place a `<!-- CODEX-069 -->` HTML comment was left for spec-preferred language.
3. **Verification** — paste the final §10 sample closings as they now appear in the spec, plus the corresponding `PROSE_TEMPLATES` constants, side-by-side or sequentially. Confirm they match.
4. **Out-of-scope verification** — `git status --short` output.

---

## Method note

This CODEX is faster than a CC because there's no architecture to interpret. Read both files, copy the code prose into the spec blockquotes, save. The only judgment call is whether the spec wanted a deliberately-different "reference shape" sample (in which case leave the comment marker and proceed). Default to verbatim match.
