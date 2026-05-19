# CODEX-PROMPT-CACHE-CONTROL

> **Cowork-authored, executor-eligible.** Mechanical scope: add Anthropic
> `cache_control: { type: "ephemeral" }` to the system blocks of the five
> LLM server modules. No prompt content changes. No engine changes. No
> output-shape changes.

## Why this exists

Jason has invited 100 people to the assessment and is about to make a
Facebook post that will likely bring a few dozen more takers in a
concentrated burst (24–72h window). With cohort traffic concentrated in
a short window, Anthropic's prompt-caching feature pays back
immediately:

- Cache write costs 1.25× standard input rate (one-time per 5-min TTL
  per prompt).
- Cache read costs 0.10× standard input rate.
- Break-even is 2 reads; everything after is ~90% off the cached portion.

Per the cost-calibration memory tier table, fresh generations currently
run ~$0.05 each. With shared system prompts (~1,600–3,600 tokens each,
totaling ~12,800 across the five layers) cached, per-generation input
cost on the cached portion drops ~70%. Per-generation total cost drops
roughly to ~$0.015–0.025 in cache-warm conditions.

Magnitude for the 100-person cohort (existing $20 estimate per the
build-vs-live mismatch memory): expected new range **$5–10**.

## What's eligible

Anthropic's minimum cacheable prefix for Sonnet/Opus is 1,024 tokens.
All five layers clear that floor comfortably:

| Module | System prompt const | Source file | Approx tokens |
|---|---|---|---|
| Prose rewrite | `PROSE_REWRITE_SYSTEM_PROMPT` | `lib/proseRewriteLlm.ts` | ~1,992 |
| Keystone rewrite | `KEYSTONE_REWRITE_SYSTEM_PROMPT` | `lib/keystoneRewriteLlm.ts` | ~2,524 |
| Launch Polish V3 | `V3_REWRITE_SYSTEM_PROMPT` | `lib/launchPolishV3Llm.ts` | ~1,621 |
| Synthesis 3 | `SYSTEM_PROMPT` | `lib/synthesis3Llm.ts` | ~3,597 |
| Grip Taxonomy | `GRIP_SYSTEM_PROMPT` | `lib/gripTaxonomyLlm.ts` | ~3,100 |

## The five edits

For each of these five files, change the `system:` argument passed to
`client.messages.create` from a plain string to an array containing a
single `text` block with `cache_control`.

### 1. `lib/proseRewriteLlmServer.ts` (~line 92)

```ts
// BEFORE
system: PROSE_REWRITE_SYSTEM_PROMPT,

// AFTER
system: [
  {
    type: "text",
    text: PROSE_REWRITE_SYSTEM_PROMPT,
    cache_control: { type: "ephemeral" },
  },
],
```

### 2. `lib/keystoneRewriteLlmServer.ts` (~line 91)

```ts
system: [
  {
    type: "text",
    text: KEYSTONE_REWRITE_SYSTEM_PROMPT,
    cache_control: { type: "ephemeral" },
  },
],
```

### 3. `lib/launchPolishV3LlmServer.ts` (~line 83)

```ts
system: [
  {
    type: "text",
    text: V3_REWRITE_SYSTEM_PROMPT,
    cache_control: { type: "ephemeral" },
  },
],
```

### 4. `lib/synthesis3LlmServer.ts` (~line 109)

```ts
system: [
  {
    type: "text",
    text: SYSTEM_PROMPT,
    cache_control: { type: "ephemeral" },
  },
],
```

### 5. `lib/gripTaxonomyLlmServer.ts` (~line 79)

```ts
system: [
  {
    type: "text",
    text: GRIP_SYSTEM_PROMPT,
    cache_control: { type: "ephemeral" },
  },
],
```

## Acceptance criteria

1. All five `client.messages.create` calls compile against `@anthropic-ai/sdk@0.95.1` with no TypeScript errors. (The SDK's `system` parameter accepts either `string` or `Array<TextBlockParam>`.)
2. Run any existing audit that exercises one of the five LLM paths (e.g.,
   `tests/audit/proseArchitecture.audit.ts` or a synthesis3 audit). Confirm
   it passes — output shape must be byte-identical, since caching is a
   billing/latency optimization, not a prompt-content change.
3. Smoke-test ONE live LLM call per layer (e.g., re-fire a small backfill
   slice or call the build script with `--limit=1`). In the response's
   `usage` object, confirm `cache_creation_input_tokens` is non-zero on
   the first call and `cache_read_input_tokens` is non-zero on a
   second call within ~5 minutes. If both are zero, the cache_control
   field isn't being honored — back out the change and investigate.
4. No edits to:
   - Any prompt content (the strings themselves stay byte-identical).
   - Any engine module (`lib/identityEngine.ts`, `lib/aim.ts`, hash
     functions, output-cache JSONs).
   - Any non-LLM-server module.
   - The cache-key composition for any of the output caches
     (`lib/cache/*.json`) — this CODEX is about input-side caching at
     Anthropic, not the project's output caches.

## Cost ceiling

Hard stop if executor's smoke-test LLM spend exceeds **$0.50** total
across all five layers. Expected: ~$0.05–0.15 (one cache-write + one
cache-read per layer, ~5 calls × $0.02–0.03 each).

## What this does NOT do

- Does not fix the build-vs-live arg mismatch
  (`project_buildvs_live_args_mismatch.md`). That's a separate CC
  (`CC-PROD-LLM-CACHE-COVERAGE-ARCHITECTURE`) and is unaffected by this
  one. Output cache and input cache are independent layers.
- Does not change the 5-minute default TTL. If post-deploy observation
  shows cache hits frequently expiring between same-cohort users, a
  follow-up could opt into the 1-hour TTL (extra beta header, ~2× cache
  write cost — only worth it if cohort traffic is spread over hours,
  not minutes).
- Does not add cache_control to the user message blocks (the per-fixture
  variable suffix). User messages change per-call by definition; caching
  them would never hit.

## Notes for the executor

- The SDK's `cache_control` ergonomics: it must be the LAST property on
  the text block to be picked up. Watch object literal field ordering.
- TypeScript should accept this without a type cast against SDK 0.95.1,
  but if the build complains, the minimum-friction fix is
  `as Anthropic.TextBlockParam[]` — do NOT broaden to `any`.
- Consider logging `response.usage.cache_read_input_tokens` and
  `cache_creation_input_tokens` once per call to a debug-level console
  line — useful for the first 48h of cohort traffic to verify cache is
  warming, can be removed in a follow-up. Optional.
