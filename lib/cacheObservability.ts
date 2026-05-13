// CC-CACHE-MISS-LOUDFAIL — render-time observability for LLM-rewrite
// cache misses. When a runtime cache lookup returns undefined, callers
// invoke `logCacheMiss` to emit a structured warning that names the
// cache namespace, the section/card identifier, the missed key, and an
// engine-body fingerprint enough to disambiguate which fixture/session
// the miss came from.
//
// This is observability only — the cache lookup return value remains
// undefined on miss and callers continue to fall through to the engine
// prose. Logs surface in dev terminals and aggregated production sinks
// via the standard `console.warn` channel (no new transport).

export type CacheMissNamespace = "prose-rewrites" | "keystone-rewrites";

export interface CacheMissEvent {
  /** Cache namespace — one of the LLM-rewrite caches. */
  namespace: CacheMissNamespace;
  /** Section / card identifier (e.g. "lens", "compass", "hands", "path", "keystone"). */
  section: string;
  /** The deterministic cache key that was looked up. */
  cacheKey: string;
  /** Short fingerprint of the input — first 80 chars of the engine body /
   *  the canonical input string the cache was keyed against. */
  fingerprint: string;
}

/** Truncate an arbitrary string to a short fingerprint suitable for the
 *  log payload. Collapses whitespace + ASCII-escapes newlines so the
 *  fingerprint is a single grep-friendly line. */
export function fingerprintBody(body: string, max = 80): string {
  const oneLine = body.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return oneLine.slice(0, max) + "…";
}

/** Emit a structured cache-miss warning. One call per `undefined` return
 *  from `readCachedRewrite` / `readCachedKeystoneRewrite`. Format is a
 *  single JSON-on-a-line for grep-friendliness in dev terminals + log
 *  aggregators. */
export function logCacheMiss(event: CacheMissEvent): void {
  const payload = {
    event: "cache-miss",
    namespace: event.namespace,
    section: event.section,
    cacheKey: event.cacheKey,
    fingerprint: event.fingerprint,
  };
  console.warn(`[cache-miss] ${JSON.stringify(payload)}`);
}

// CC-LIVE-SESSION-LLM-WIRING — on-demand LLM resolution observability.
// Logs the resolution outcome for each attempted on-demand call so that
// success/timeout/error/cost-guard outcomes appear in dev terminals and
// production log sinks via the same `console.warn` channel.

export type CacheResolutionOutcome =
  | "success"
  | "timeout"
  | "error"
  | "cost-guard-hit";

export interface CacheResolutionEvent {
  namespace: CacheMissNamespace;
  section: string;
  cacheKey: string;
  fingerprint: string;
  outcome: CacheResolutionOutcome;
  latencyMs: number;
  /** Optional supplementary detail (error message, remaining budget, etc.) */
  detail?: string;
}

export function logCacheResolution(event: CacheResolutionEvent): void {
  const payload = {
    event: "cache-resolution",
    namespace: event.namespace,
    section: event.section,
    cacheKey: event.cacheKey,
    fingerprint: event.fingerprint,
    outcome: event.outcome,
    latencyMs: event.latencyMs,
    ...(event.detail ? { detail: event.detail } : {}),
  };
  console.warn(`[cache-resolution] ${JSON.stringify(payload)}`);
}

// CC-LIVE-SESSION-LLM-WIRING — per-session cost guard. Caps the number of
// on-demand LLM calls a single render session can make. Once the budget
// is exhausted, subsequent calls fall through to engine prose (return
// null) without dialing the API. Default cap is 8: enough for the four
// scoped body cards + Keystone + a few retries.

export const DEFAULT_SESSION_LLM_BUDGET = 8;

export class SessionLlmBudget {
  private callsConsumed = 0;
  constructor(private readonly cap: number = DEFAULT_SESSION_LLM_BUDGET) {}

  /** Attempt to reserve one call. Returns true if the call may proceed,
   *  false if the cap has been hit. The reservation is recorded
   *  regardless of whether the call ultimately succeeds. */
  tryConsume(): boolean {
    if (this.callsConsumed >= this.cap) return false;
    this.callsConsumed++;
    return true;
  }

  remaining(): number {
    return Math.max(0, this.cap - this.callsConsumed);
  }

  consumed(): number {
    return this.callsConsumed;
  }

  capacity(): number {
    return this.cap;
  }
}
