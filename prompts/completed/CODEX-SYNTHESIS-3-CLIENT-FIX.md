# CODEX-SYNTHESIS-3-CLIENT-FIX — Remove node:fs from Client Bundle

**Origin:** CC-SYNTHESIS-3 shipped 2026-05-08 with `lib/synthesis3Llm.ts` importing `node:fs` for cache I/O. `lib/identityEngine.ts` imports `synthesis3Llm.ts`; `app/page.tsx` imports `identityEngine.ts` as a client component. Result: `node:fs` propagates into the client bundle, Turbopack/webpack rejects it, dev server fails with:

> Code generation for chunk item errored
> the chunking context (unknown) does not support external modules (request: node:fs)

The architectural mistake is that `lib/synthesis3Llm.ts` mixes two concerns: build-time cache writing (needs `fs`) and runtime cache lookup (needs only JSON access).

**The fix:** split read and write. Build script writes the cache file; runtime library imports the JSON directly. Zero `node:*` imports in any file reachable from a client component.

**Method discipline:** Surgical fix only. ~minutes of work. No other behavior changes.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run dev` (for verification)
- `npx tsx tests/audit/synthesis3.audit.ts`
- `git status`, `git diff`
- `node`, `npx tsx`
- `cat`, `grep`, `find`

## Read First (Required)

1. `lib/synthesis3Llm.ts` — current implementation. Identify all `node:fs` (or `fs`) imports and where they're used.
2. `scripts/buildSynthesis3.ts` — current implementation. Confirm it does (or should do) the cache writes.
3. `lib/cache/synthesis3-paragraphs.json` — the cache file. Confirm shape (likely `Record<string, string>` keyed by fixture identifier).
4. `lib/identityEngine.ts` — the file that imports synthesis3Llm. Confirm it's a client-component-reachable file.
5. `app/page.tsx` — the consumer pulling identityEngine into the client bundle.

## Allowed to Modify

### Fix — Remove node:fs from the runtime path

**File modified:** `lib/synthesis3Llm.ts`.

Remove ALL `node:fs` (or plain `fs`) imports. Replace any `fs.readFileSync(cacheFilePath)` calls with a direct JSON import:

```ts
// Replace this:
import * as fs from "node:fs";
const cacheData = JSON.parse(fs.readFileSync("./lib/cache/synthesis3-paragraphs.json", "utf-8"));

// With this:
import cacheData from "./cache/synthesis3-paragraphs.json";
```

The JSON import is bundler-native; it works in both server and client bundles. The cache file becomes part of the bundle (slightly larger client bundle by the size of the JSON, currently ~empty, eventually ~24 paragraphs ≈ 5KB).

**File modified:** `scripts/buildSynthesis3.ts`.

ALL cache file writes happen here. This script runs at build time only (via `npx tsx scripts/buildSynthesis3.ts`); it can use `node:fs` freely. If the build script doesn't already own the cache writing, MOVE that logic from `lib/synthesis3Llm.ts` to `scripts/buildSynthesis3.ts`.

After the move:
- `lib/synthesis3Llm.ts` has ZERO `node:*` imports (confirm via grep)
- `scripts/buildSynthesis3.ts` has all the `fs` write logic + the LLM API call + the SDK import (which is also Node-only and can't be in the client bundle)

**Critical: also confirm `@anthropic-ai/sdk` import is NOT in `lib/synthesis3Llm.ts`.** If the SDK is imported there for runtime, that's another Node-only dependency that breaks the client bundle. Move SDK usage entirely into `scripts/buildSynthesis3.ts`. The runtime library only needs cache lookup; it never calls the LLM directly.

**Resulting architecture:**

- `lib/synthesis3Llm.ts` (runtime, client-bundle-safe): exports a `lookupCachedPathSynthesis(fixtureId)` function that reads from the imported JSON. No fs, no SDK, no Node modules.
- `scripts/buildSynthesis3.ts` (build-time, Node-only): imports SDK, calls API, writes cache file via fs. Runs manually with API key set.
- `lib/cache/synthesis3-paragraphs.json` (data file): static JSON, imported as a module by `lib/synthesis3Llm.ts`.

### Audit (no new assertions; verify existing pass)

After the fix:
- `npm run dev` starts the server cleanly without the chunking error
- `npx tsc --noEmit` exits 0
- `npm run lint` exits 0
- `npx tsx tests/audit/synthesis3.audit.ts` passes (existing assertions unchanged; cache lookup behavior preserved)
- `npx tsx scripts/buildSynthesis3.ts` (with API key) still works as before

## Out of Scope (Do Not)

1. **Do NOT modify the LLM system prompt or rubric examples.** The system prompt content stays verbatim; only its location moves (from `lib/synthesis3Llm.ts` to `scripts/buildSynthesis3.ts` if it lived in the lib file).
2. **Do NOT modify any signal pool, intensity math, composite consumption, or engine canon.**
3. **Do NOT modify the cache file's schema** — same `Record<fixtureId, paragraph>` shape.
4. **Do NOT add new dependencies.**
5. **Do NOT change the renderer's fallback behavior.** When cache is empty (no LLM paragraphs), renderer falls back to mechanical Path master synthesis exactly as it does now.
6. **Do NOT modify** the question bank, fixture files, MEMORY.md, AGENTS.md, docs/canon/, or spec memos.
7. **Do NOT touch any audit assertions.** The CC-SYNTHESIS-3 audit assertions are correct as written; they test cache contents, not module structure.
8. **Do NOT modify CC-PROSE / SYNTHESIS-1A / 1F / JUNGIAN / FIXTURES canon.**

## Acceptance Criteria

1. `lib/synthesis3Llm.ts` has zero `node:*` imports (grep -r "node:" lib/synthesis3Llm.ts returns empty).
2. `lib/synthesis3Llm.ts` has zero `@anthropic-ai/sdk` imports (the SDK lives in scripts/ only).
3. Cache lookup works via direct JSON import.
4. `scripts/buildSynthesis3.ts` retains all cache-writing + LLM-calling logic.
5. `npm run dev` starts cleanly (no chunking error on `node:fs` or any other Node module).
6. `npx tsc --noEmit` exits 0.
7. `npm run lint` exits 0.
8. `npx tsx tests/audit/synthesis3.audit.ts` exits 0 (existing assertions unchanged).
9. `git status --short` shows only `lib/synthesis3Llm.ts` and `scripts/buildSynthesis3.ts` modified.

## Report Back

1. **Summary in 2-3 sentences.** Confirm fix landed; client bundle no longer pulls Node-only imports; dev server starts cleanly.
2. **Diff summary** — paste the imports section of `lib/synthesis3Llm.ts` before and after. Confirm zero `node:*` and zero `@anthropic-ai/sdk`.
3. **Verification** — paste `npm run dev` startup output (first 10 lines) confirming clean start, no chunking errors. Paste output of `grep -r "node:" lib/synthesis3Llm.ts` and `grep -r "@anthropic-ai/sdk" lib/synthesis3Llm.ts` showing both are empty.
4. **Audit pass/fail breakdown.**
5. **Out-of-scope verification** — git status; confirm only the two files modified.
