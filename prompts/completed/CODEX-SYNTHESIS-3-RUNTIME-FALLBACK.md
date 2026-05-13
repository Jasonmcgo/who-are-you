# CODEX-SYNTHESIS-3-RUNTIME-FALLBACK — Server-Side LLM Fallback for Cache Misses

**Origin:** CC-SYNTHESIS-3 + cache + renderer wiring all shipped 2026-05-09 morning. Cache works perfectly for fixture-derived shapes (24/24 fixtures hit). However, LIVE saved-session renders (e.g., admin/sessions/<id>) compute slightly different input shapes than the fixture files (Risk Form differs, topGravity surfaces differently, Soul values differ by 1, Compass top-3 differs Family vs Faith). Runtime hash doesn't match any cache key, lookup misses, falls back to mechanical paragraph.

This blocks live users from seeing LLM-articulated Path master synthesis. Jason is taking the test to other family members this morning — needs the LLM articulation to render for live sessions, not just fixtures.

**The fix:** Add a server-side runtime fallback. When `lookupCachedPathSynthesis` misses, call the Anthropic API in-line, cache the result, and return the paragraph. First render of a new shape = 3-5 second wait. Subsequent renders of same shape = cache hit, instant.

**Scope:** ~10-15 minutes executor time. CODEX-scale.

**Cost surface:** ~$0.04 per unique live-session shape, paid once and cached forever. For Jason + 5 family members today: < $0.30 total. For broader rollout at 100 users/month: ~$4/month.

---

## Embedded context

CC-SYNTHESIS-3's original design forbade runtime API calls. That constraint was driven by cost concerns. Cost analysis now shows ~$0.04 per unique session is trivial relative to the value (LLM articulation for every live user, not just fixtures). The constraint flips.

The runtime fallback must be **server-side only** — the API key cannot be exposed in the client bundle. Next.js SSR / server components are safe; client components must NOT call the API directly. Calls happen during server render and the awaited result populates `output.path.masterSynthesisLlm`.

The architecture decision: persist new entries to the SAME cache JSON file. That way, future renders of the same shape hit the cache (no repeat API calls). Multi-user concurrency may cause occasional double-writes; that's acceptable (last write wins, both writes are correct).

The existing `composePathMasterSynthesisLlm` function in `scripts/buildSynthesis3.ts` already does the API call. Refactor: extract that function to `lib/synthesis3Llm.ts` (server-only) so both the build script AND the runtime fallback use the same composer.

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

1. `lib/synthesis3Llm.ts` — the runtime library. Locate `lookupCachedPathSynthesis` and the cache import.
2. `scripts/buildSynthesis3.ts` — the build script. Locate `composePathMasterSynthesisLlm` (or whatever the actual API-calling function is named). Note its dependencies (Anthropic SDK, env var read, system prompt content).
3. `lib/identityEngine.ts` — `attachLlmPathMasterSynthesis` (or equivalent). It calls `lookupCachedPathSynthesis`. Currently sync; will become async.
4. `app/components/InnerConstitutionPage.tsx`, `app/components/PathExpanded.tsx` — confirm they're server components or that the engine call happens server-side. Critical for security.
5. `next.config.js` and the project structure — confirm Node.js runtime is available for the routes that render reports (the alternative would be Edge runtime, which has restrictions).
6. `lib/cache/synthesis3-paragraphs.json` — current cache. The fallback writes to this same file.

## Allowed to Modify

### 1. Extract API-calling function from build script to runtime library

**File:** `scripts/buildSynthesis3.ts` and `lib/synthesis3Llm.ts`.

Move `composePathMasterSynthesisLlm` (the function that calls Anthropic API) from `scripts/buildSynthesis3.ts` into `lib/synthesis3Llm.ts` as a server-only function. Mark with the `"use server"` directive at the top of the file OR as a Node.js-only export that bundlers can tree-shake out of client bundles.

The function signature:
```ts
export async function composePathMasterSynthesisLlm(
  inputs: PathMasterInputs
): Promise<string | null>;
```

Returns paragraph string on success, null on API failure (so renderer falls back to mechanical).

The build script (`scripts/buildSynthesis3.ts`) imports this function instead of having its own copy.

### 2. Add runtime fallback wrapper

**File:** `lib/synthesis3Llm.ts`.

Add a new async function:

```ts
export async function lookupOrComputePathSynthesis(
  inputs: PathMasterInputs
): Promise<string | null> {
  // 1. Try cache first
  const cached = lookupCachedPathSynthesis(inputs);
  if (cached) return cached;

  // 2. Cache miss — try runtime API call (server-side only)
  if (typeof window !== "undefined") {
    // Defensive: this should never run in browser bundles
    return null;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return null; // graceful degradation when key not set
  }

  try {
    const paragraph = await composePathMasterSynthesisLlm(inputs);
    if (paragraph) {
      // 3. Persist to cache for future renders
      await persistToCache(inputs, paragraph);
    }
    return paragraph;
  } catch (err) {
    console.warn("[synthesis3] runtime LLM fallback failed:", err);
    return null;
  }
}

async function persistToCache(inputs: PathMasterInputs, paragraph: string): Promise<void> {
  // Read current cache, add new entry, write back
  // This uses node:fs which is server-only — same defensive guard as above
  if (typeof window !== "undefined") return;
  const fs = await import("node:fs");
  const path = await import("node:path");
  const cacheFile = path.join(process.cwd(), "lib/cache/synthesis3-paragraphs.json");
  const current = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
  const key = inputsHash(inputs);
  current[key] = {
    paragraph,
    fixtureHint: "runtime-generated",
    generatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(cacheFile, JSON.stringify(current, null, 2));
}
```

The cache persistence uses `node:fs` directly — must be guarded by `typeof window !== "undefined"` so it tree-shakes from client bundles.

### 3. Update engine integration

**File:** `lib/identityEngine.ts`.

Change `attachLlmPathMasterSynthesis` (or wherever `lookupCachedPathSynthesis` is called) from sync to async. It now calls `lookupOrComputePathSynthesis` instead.

```ts
async function attachLlmPathMasterSynthesis(constitution: InnerConstitution): Promise<void> {
  const inputs = derivePathMasterInputs(constitution);
  const paragraph = await lookupOrComputePathSynthesis(inputs);
  constitution.shape_outputs.path.masterSynthesisLlm = paragraph; // null if both cache and API fail
}
```

`buildInnerConstitution` becomes async (or already is — confirm). Callers must await.

### 4. Update render call sites

Find every place `buildInnerConstitution` is called. Make sure callers await it (Next.js server components support top-level await within the component function).

For server components in Next.js App Router:
```tsx
export default async function PageComponent() {
  const constitution = await buildInnerConstitution(input);
  return <InnerConstitutionPage output={constitution} />;
}
```

If any caller is in a client component, that's a security problem and must be moved server-side.

### 5. Audit assertions

**File:** `tests/audit/synthesis3.audit.ts`. Add:

- `synth-3-runtime-fallback-disabled-without-key`: When `ANTHROPIC_API_KEY` is unset, `lookupOrComputePathSynthesis` returns null on cache miss without throwing.
- `synth-3-runtime-fallback-server-only-guard`: The function returns null in browser environments (`typeof window !== "undefined"`).
- `synth-3-cache-persistence-shape`: New cache entries written by the runtime fallback have the same JSON structure as build-script entries (paragraph, fixtureHint, generatedAt).

(Don't add an audit that actually CALLS the API — those are integration tests, not unit tests.)

## Out of Scope (Do Not)

1. **Do NOT call the API from client components.** Server-only via `typeof window !== "undefined"` guards or `"use server"` directives.
2. **Do NOT modify the Anthropic SDK call itself or the system prompt** — those are CC-SYNTHESIS-3 canon, just relocate them.
3. **Do NOT change the cache file format or location.** Runtime entries live in the same JSON file with the same shape.
4. **Do NOT modify** any signal pool, intensity math, composite consumption, CC-PROSE / SYNTHESIS-1A / 1F / JUNGIAN / FIXTURES canon.
5. **Do NOT modify** the question bank, fixture files, MEMORY.md, AGENTS.md, docs/canon/, or spec memos.
6. **Do NOT install dependencies.** Anthropic SDK is already installed.
7. **Do NOT touch existing audit assertions** that aren't broken by the change.
8. **Do NOT modify the masthead, "How to Read This", or any visual treatment.**
9. **Do NOT add caching layers beyond the existing JSON file.** No Redis, no in-memory map for now — the JSON file is fine for current scale.
10. **Do NOT block the render on the API call indefinitely.** Add a 10-second timeout to the API call; on timeout, return null and fall back to mechanical.

## Acceptance Criteria

1. `lib/synthesis3Llm.ts` exports `lookupOrComputePathSynthesis(inputs): Promise<string | null>`.
2. `composePathMasterSynthesisLlm` is in `lib/synthesis3Llm.ts` (moved from build script). Build script imports it from there.
3. Runtime fallback gated by `typeof window !== "undefined"` guards — never runs in client bundles.
4. Runtime fallback gated by `ANTHROPIC_API_KEY` presence — graceful null return when missing.
5. New cache entries persist to `lib/cache/synthesis3-paragraphs.json` with `fixtureHint: "runtime-generated"`.
6. `attachLlmPathMasterSynthesis` (or equivalent engine call) is async and awaits the lookup-or-compute.
7. `buildInnerConstitution` is async (or remains so) and all call sites await it.
8. `npx tsc --noEmit` exits 0.
9. `npm run lint` exits 0.
10. Existing CC-SYNTHESIS-3 audit assertions still pass.
11. New `synth-3-runtime-fallback-*` audit assertions pass (3 new assertions).
12. `git status --short` shows only the modified files.

## Report Back

1. **Summary in 3-4 sentences.** Confirm runtime fallback ships server-only with cache persistence.
2. **Live-session render verification** — start dev server (`npm run dev -- -p 3005`), visit Jason's admin session URL (`/admin/sessions/54265a13-ab24-4c70-95fd-8052e85c4a3f`), confirm Path · Gait now shows the LLM paragraph instead of the mechanical version. Paste the first 200 chars of the rendered Path master synthesis paragraph.
3. **Cache file growth** — confirm new entry was written to `lib/cache/synthesis3-paragraphs.json` for Jason's live shape (look for `fixtureHint: "runtime-generated"`).
4. **Audit pass/fail.**
5. **Out-of-scope verification** — git status; confirm only the expected files changed.
6. **Cost note** — first render of Jason's session = ~$0.04, then cached. Document that future family-member sessions will each incur ~$0.04 on first render, then cached.
