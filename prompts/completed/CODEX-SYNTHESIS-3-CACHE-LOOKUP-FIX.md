# CODEX-SYNTHESIS-3-CACHE-LOOKUP-FIX — Cache Hits 0/24 at Runtime Despite Populated File

**Origin:** CC-SYNTHESIS-3 + CODEX-SYNTHESIS-3-CLIENT-FIX shipped. Build script (`scripts/buildSynthesis3.ts`) ran successfully and populated `lib/cache/synthesis3-paragraphs.json` with 24 entries. Verified via `cat` — paragraphs are real, formatted correctly, with `fixtureHint` fields naming the right fixture paths.

**The bug:** Despite the cache being populated, the rendered Path master synthesis paragraph for every fixture is still the MECHANICAL fallback version, not the LLM-articulated version. Dev server restart did not fix it. This means the runtime cache LOOKUP is failing — every lookup returns null and the renderer falls back to mechanical.

**Most likely cause:** Hash mismatch between build script and runtime library. The build script's `inputsHash()` function (in `scripts/buildSynthesis3.ts` after CODEX-SYNTHESIS-3-CLIENT-FIX moved it there) writes cache keys like `engineCanonicalPhrases=[...]|givingDescriptor="..."|...`. The runtime lookup in `lib/synthesis3Llm.ts` must compute the SAME hash from the InnerConstitution output's path master inputs, OR the lookup misses every time.

Possible drift sources:
1. Field ordering differs between build-time and runtime hash composition.
2. Stringification differs (e.g., one uses `JSON.stringify`, the other uses canonical-string with sorted keys).
3. One hashing function exists in BOTH files (drifted copies) instead of being shared.
4. Field names differ (e.g., build script reads `lensDominant`, runtime reads `lens_dominant`).
5. The runtime lookup function isn't being called at all — `attachLlmPathMasterSynthesis` (or equivalent) in `lib/identityEngine.ts` may not be wired in.

**Method discipline:** Diagnostic-first. Identify which of the above is the cause. Then surgical fix.

**Scope:** ~minutes of work. CODEX-scale.

---

## Embedded context (CC executor environments don't see Cowork memory)

CC-SYNTHESIS-3 architecture:
- `scripts/buildSynthesis3.ts` reads each fixture, runs `buildInnerConstitution` to derive `PathMasterInputs`, calls Claude API, writes the resulting paragraph to `lib/cache/synthesis3-paragraphs.json` keyed by a hash of the inputs.
- `lib/synthesis3Llm.ts` (runtime, client-bundle-safe per CODEX-SYNTHESIS-3-CLIENT-FIX) imports the cache JSON statically and exposes a `lookupCachedPathSynthesis(inputs)` function. The function should compute the SAME hash and look up the cached paragraph.
- `lib/identityEngine.ts`'s `buildInnerConstitution` should call `lookupCachedPathSynthesis` with the same inputs the build script used, and attach the result to `output.path.masterSynthesisLlm`.
- `lib/renderMirror.ts` and React render paths read `output.path.masterSynthesisLlm` and render it; if null, fall back to mechanical Path master synthesis.

Sample cache entry from the populated file (key truncated for readability):

```
"engineCanonicalPhrases=[\"the early shape of giving\"]|givingDescriptor=\"building structures that make truth more usable, more humane, and less captive to noise\"|lensAux=\"the structurer\"|lensDominant=\"the pattern-reader\"|loveMap=\"the Devoted Partner\"|movement={\"goal\":88,\"soul\":54,\"quadrant\":\"Giving / Presence\",\"biasDirection\":\"Goal-leaning\",\"strength\":73.00684899377592,\"length\":\"long\"}|riskForm=\"Free movement\"|topCompass=[\"Knowledge\",\"Peace\",\"Family\",\"Honor\"]|topGravity=[]|topPatternInMotion=null": {
  "paragraph": "You see the long arc — that's the gift, and the trap...",
  "fixtureHint": "ocean/07-jason-real-session.json",
  "generatedAt": "2026-05-09T11:24:33.935Z"
}
```

The key format is: top-level keys sorted alphabetically, each value JSON-stringified, joined by `|`.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run dev`
- `npx tsx tests/audit/synthesis3.audit.ts`
- `npx tsx -e "..."` (for runtime diagnostic eval)
- `cat`, `grep`, `find`
- `git status`, `git diff`

## Read First (Required)

1. `lib/synthesis3Llm.ts` — the runtime library. Locate the cache lookup function (likely `lookupCachedPathSynthesis` or similar). Identify how it computes the hash key.
2. `scripts/buildSynthesis3.ts` — the build script. Locate `inputsHash()` (or equivalent — the function that produces cache keys when writing). Identify how it composes the key.
3. `lib/identityEngine.ts` — `buildInnerConstitution`. Find where it should call the runtime lookup and attach `output.path.masterSynthesisLlm`. Confirm this wiring exists; if missing, that IS the bug.
4. `lib/cache/synthesis3-paragraphs.json` — first one or two cache entries. Note the EXACT key format.
5. `lib/types.ts` — confirm the `path.masterSynthesisLlm` field exists on InnerConstitution output type.

## Diagnostic Step (REQUIRED before fixing)

Run this in the project root:

```bash
cd /Users/jasondmcgovernimac/Desktop/who-are-you
npx tsx -e "
import fs from 'node:fs';
const cache = JSON.parse(fs.readFileSync('lib/cache/synthesis3-paragraphs.json', 'utf-8'));
const cacheKeys = Object.keys(cache);
console.log('Cache has', cacheKeys.length, 'entries');
console.log('First cache key (sample):');
console.log(cacheKeys[0]);
console.log('---');
console.log('Sample fixtureHint:', cache[cacheKeys[0]].fixtureHint);
"
```

Then run the runtime computation for the same fixture and compare:

```bash
npx tsx -e "
import { buildInnerConstitution } from './lib/identityEngine.ts';
import fixture from './tests/fixtures/ocean/07-jason-real-session.json' with { type: 'json' };
const result = buildInnerConstitution(fixture);
console.log('LLM paragraph attached:', result.path?.masterSynthesisLlm ? 'YES' : 'NO');
console.log('Master synthesis (first 100 chars):', (result.path?.masterSynthesisLlm || 'null/missing').slice(0, 100));
"
```

If the LLM paragraph is `NO`, the lookup is failing. Add temporary `console.log` to `lookupCachedPathSynthesis` to print the hash it computes vs the keys it's searching against, then compare the runtime hash to the actual cache key for `ocean/07-jason-real-session.json`. The diff will reveal the drift.

## Allowed to Modify

### Fix the cache lookup so runtime hash matches build-time hash

Once the diagnostic identifies the drift, fix it. Most likely options:

**Option A — Hash function drifted between build script and runtime library.** Extract the hash function into a SHARED location (e.g., a new export from `lib/synthesis3Llm.ts` that the build script imports). Both paths use the same function. No drift possible.

**Option B — Field name mismatch.** Update the runtime library to use the same field names as the build script (or vice versa).

**Option C — Wiring missing.** If `buildInnerConstitution` doesn't actually call `lookupCachedPathSynthesis` and attach to `output.path.masterSynthesisLlm`, add the wiring. The function signature should be:

```ts
const llmParagraph = lookupCachedPathSynthesis({
  lensDominant: output.lens_stack.dominantLabel, // or however it's named
  lensAux: output.lens_stack.auxiliaryLabel,
  topCompass: output.topCompass,
  topGravity: output.topGravity,
  movement: { goal, soul, quadrant, biasDirection, strength, length },
  riskForm: output.riskForm?.letter ?? null,
  loveMap: output.loveMap?.matches?.[0]?.label,
  givingDescriptor: /* the canonical giving descriptor for top-Compass-1 */,
  engineCanonicalPhrases: /* phrases that fired for this shape */,
  topPatternInMotion: /* the pattern body if any pattern fires */,
});
output.path.masterSynthesisLlm = llmParagraph; // null if cache miss
```

Whichever the actual cause, the fix is small. Make it. Re-test.

## Out of Scope (Do Not)

1. **Do NOT regenerate the cache.** The cache content is correct; the lookup is what's broken. Don't run the build script as part of debugging this — the cache is fine.
2. **Do NOT modify the cache file or its format.** Match the runtime lookup TO the cache, not the other way around.
3. **Do NOT modify any signal pool, intensity math, or composite consumption.**
4. **Do NOT modify CC-PROSE / SYNTHESIS-1A / 1F / JUNGIAN canon.**
5. **Do NOT add LLM calls in any new locations.** The runtime library only LOOKS UP cached paragraphs; it doesn't call the API.
6. **Do NOT add new dependencies.**
7. **Do NOT modify** the question bank, fixture files, MEMORY.md, AGENTS.md, docs/canon/, or spec memos.
8. **Do NOT touch any audit assertions** that aren't broken by the fix.
9. **Do NOT change the cache file's location** (`lib/cache/synthesis3-paragraphs.json` stays where it is).
10. **Do NOT add a runtime API call as a "fallback"** if the cache lookup fails. Cache miss = mechanical fallback per CC-SYNTHESIS-3 design. No runtime API.

## Acceptance Criteria

1. Diagnostic step run; root cause identified and named in Report Back.
2. Fix applied — runtime hash now matches build-time hash, OR wiring added so `output.path.masterSynthesisLlm` gets attached when cache hits.
3. After fix, running the diagnostic eval again shows `LLM paragraph attached: YES` for at least Jason canonical (`ocean/07-jason-real-session.json`).
4. After fix, `npm run dev` rendering of the Jason canonical fixture shows the LLM-articulated Path master synthesis paragraph (starting with "You see the long arc — that's the gift, and the trap...") instead of the mechanical version.
5. `npx tsc --noEmit` exits 0.
6. `npm run lint` exits 0.
7. Existing audit assertions still pass; if any synth-3 assertion was vacuous before (because cache was effectively empty at runtime) and now fires real checks, that's expected.

## Report Back

1. **Root cause** in 2-3 sentences. What was the actual drift between build-time and runtime hash? Or was it a wiring issue?
2. **Diagnostic output** — paste the result of the two `npx tsx -e` commands from the diagnostic step above. Show the cache key vs the runtime-computed key, side by side, so the drift is visible.
3. **Fix summary** — which option (A / B / C / other) was the fix, and what file(s) changed.
4. **Verification** — paste the rendered Path master synthesis paragraph for Jason canonical (`ocean/07-jason-real-session.json`) AFTER the fix. Confirm it starts with "You see the long arc — that's the gift, and the trap..." (the LLM version) instead of the mechanical version.
5. **Cohort spot-check** — how many of 24 fixtures now show LLM paragraphs vs fall back? Should be 24 if the fix was a single point of drift.
6. **Audit pass/fail breakdown.**
