# CODEX-SYNTHESIS-3-RENDERER-WIRING — Renderer Reads masterSynthesisLlm Field

**Origin:** CC-SYNTHESIS-3 + CODEX-CACHE-LOOKUP-FIX shipped. Cache is populated and `buildInnerConstitution` correctly attaches `output.path.masterSynthesisLlm` (verified by Codex diagnostic 2026-05-09). Despite this, the rendered Path master synthesis paragraph in the browser still shows the mechanical version, not the LLM version. The renderer is not consuming the LLM field.

**The bug:** Either `lib/renderMirror.ts` (markdown render path) or one of the React components (`app/components/InnerConstitutionPage.tsx`, `app/components/PathExpanded.tsx`) doesn't actually read `output.path.masterSynthesisLlm` and substitute it for the mechanical Path master synthesis paragraph.

**The fix:** Wire the renderer(s) to prefer `output.path.masterSynthesisLlm` when non-null, falling back to the mechanical version when null/missing.

**Scope:** ~minutes. CODEX-scale.

---

## Embedded context

CC-SYNTHESIS-3 shipped with this contract per the original prompt:

> In each render path, the Path master synthesis paragraph reads:
> ```ts
> const masterSynthesis = output.path.masterSynthesisLlm ?? output.path.masterSynthesisMechanical;
> // render masterSynthesis
> ```

Codex verified that `output.path.masterSynthesisLlm` IS populated (rendering "You see the long arc — that's the gift, and the trap..." for Jason canonical). The field is there; the renderer doesn't use it.

The mechanical Path master synthesis composer is `composePathMasterSynthesis` (or similar — locate via grep) in `lib/synthesis1Finish.ts`. Its output is what's currently rendering. The fix is to check for `masterSynthesisLlm` first.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run dev`
- `npx tsx tests/audit/synthesis3.audit.ts`
- `git status`, `git diff`
- `cat`, `grep`, `find`

## Read First (Required)

1. `lib/types.ts` — confirm `path.masterSynthesisLlm` field exists on InnerConstitutionOutput. Note the exact field name and casing.
2. `lib/renderMirror.ts` — locate the Path master synthesis paragraph rendering. Currently it calls `composePathMasterSynthesis` (or whichever mechanical composer) directly. Find that line.
3. `app/components/InnerConstitutionPage.tsx` and `app/components/PathExpanded.tsx` — locate where the React render path emits the Path master synthesis paragraph.
4. `lib/synthesis1Finish.ts` — confirm the mechanical composer name and signature.
5. `lib/cache/synthesis3-paragraphs.json` — confirm Jason canonical entry exists (sample first 100 chars: "You see the long arc — that's the gift, and the trap...").

## Diagnostic step (REQUIRED before fixing)

Run this:

```bash
cd /Users/jasondmcgovernimac/Desktop/who-are-you
grep -rn "masterSynthesisLlm" lib/ app/ --include="*.ts" --include="*.tsx"
```

Expected output: matches in `lib/types.ts` (type definition) and `lib/identityEngine.ts` (where `buildInnerConstitution` attaches the field). If there are NO matches in `lib/renderMirror.ts`, `app/components/InnerConstitutionPage.tsx`, or `app/components/PathExpanded.tsx`, that confirms the renderer wiring was never added — and is the bug.

## Allowed to Modify

### Wire the renderer to consume `masterSynthesisLlm`

**Files:** `lib/renderMirror.ts`, `app/components/InnerConstitutionPage.tsx`, `app/components/PathExpanded.tsx` (whichever actually renders the Path master synthesis paragraph — possibly all three).

**Pattern:**

Find the line that renders the mechanical Path master synthesis. It probably looks like:

```ts
// markdown render
const masterSynthesisParagraph = composePathMasterSynthesis(input);
markdown += `\n${masterSynthesisParagraph}\n`;
```

Or in React:

```tsx
<p>{composePathMasterSynthesis(output)}</p>
```

Replace with the cache-aware version:

```ts
// markdown render
const masterSynthesisParagraph =
  output.path?.masterSynthesisLlm ?? composePathMasterSynthesis(input);
markdown += `\n${masterSynthesisParagraph}\n`;
```

Or in React:

```tsx
<p>{output.path?.masterSynthesisLlm ?? composePathMasterSynthesis(output)}</p>
```

The exact code shape depends on existing patterns. Match the surrounding style.

**Verify all three render paths are wired.** If markdown is wired but React isn't (or vice versa), the rendered HTML will diverge between the two surfaces. They must match.

## Out of Scope (Do Not)

1. **Do NOT modify `buildInnerConstitution` or any engine code.** The field attachment is correct; only the renderer needs the wiring.
2. **Do NOT modify `lib/synthesis3Llm.ts` or the cache lookup.** Codex confirmed it works.
3. **Do NOT modify the mechanical `composePathMasterSynthesis`.** It stays as the fallback.
4. **Do NOT modify the cache file.**
5. **Do NOT regenerate the cache.**
6. **Do NOT modify any signal pool, intensity math, composite consumption, or other engine canon.**
7. **Do NOT modify CC-PROSE / SYNTHESIS-1A / 1F / JUNGIAN canon.**
8. **Do NOT add LLM calls anywhere.**
9. **Do NOT modify** the question bank, fixture files, MEMORY.md, AGENTS.md, docs/canon/, or spec memos.
10. **Do NOT install dependencies.**
11. **Do NOT touch any audit assertions.**
12. **Do NOT modify the masthead, "How to Read This", section ordering, or any visual treatment.**

## Acceptance Criteria

1. Diagnostic step run; confirms the renderer files don't currently reference `masterSynthesisLlm`.
2. Wiring added in all rendering paths (markdown + both React components if applicable).
3. After fix, `npm run dev` (on a fresh port like 3005 to bypass any stale-server caching) shows Jason canonical (`ocean/07-jason-real-session.json`) with Path master synthesis paragraph starting with "You see the long arc — that's the gift, and the trap..." instead of the mechanical "Your movement is Goal-leaning..." version.
4. `npx tsc --noEmit` exits 0.
5. `npm run lint` exits 0.
6. Existing audits all pass.
7. `git status --short` shows only the renderer files modified.

## Report Back

1. **Diagnostic finding** — paste the grep result. Confirms which renderer file(s) didn't reference `masterSynthesisLlm` before the fix.
2. **Files modified** — list them.
3. **Diff samples** — paste the before/after lines showing the cache-aware fallback added.
4. **Render verification** — paste the FIRST 200 characters of the rendered Jason canonical Path master synthesis paragraph after the fix. Should start with "You see the long arc — that's the gift, and the trap..."
5. **Audit pass/fail.**
6. **Out-of-scope verification** — git status; only renderer files changed.
