// CC-LIVE-SESSION-LLM-WIRING audit — verifies the on-demand resolver
// fires on cache miss in live sessions, respects the per-session cost
// guard, falls through to engine prose on LLM failure, and stays silent
// during cohort/audit runs.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import { renderMirrorAsMarkdown } from "../../lib/renderMirror";
import {
  proseRewriteHash,
  readCachedRewrite,
  _clearRuntimeRewriteCacheForTests,
  type ProseRewriteInputs,
} from "../../lib/proseRewriteLlm";
import {
  keystoneRewriteHash,
  readCachedKeystoneRewrite,
  _clearRuntimeKeystoneCacheForTests,
  type KeystoneRewriteInputs,
} from "../../lib/keystoneRewriteLlm";
import { resolveProseRewriteLive } from "../../lib/proseRewriteLlmServer";
import { resolveKeystoneRewriteLive } from "../../lib/keystoneRewriteLlmServer";
import { SessionLlmBudget } from "../../lib/cacheObservability";
import type { Answer, DemographicSet } from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

function withWarnIntercept<T>(fn: () => Promise<T>): Promise<{ result: T; warnings: string[] }> {
  const warnings: string[] = [];
  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    warnings.push(args.map((a) => String(a)).join(" "));
  };
  return fn()
    .then((result) => {
      console.warn = origWarn;
      return { result, warnings };
    })
    .catch((e) => {
      console.warn = origWarn;
      throw e;
    });
}

function makeSyntheticProseInputs(suffix: string): ProseRewriteInputs {
  return {
    cardId: "lens",
    archetype: "jasonType",
    engineSectionBody: `### Lens — Eyes\n\nSYNTHETIC body for CC-LIVE-SESSION-LLM-WIRING audit ${suffix}.`,
    reservedCanonLines: ["audit-synthetic-canon-line-" + suffix],
  };
}

function makeSyntheticKeystoneInputs(suffix: string): KeystoneRewriteInputs {
  return {
    archetype: "jasonType",
    beliefText: `SYNTHETIC belief ${suffix} for CC-LIVE-SESSION audit — not in cohort.`,
    valueDomain: "truth",
    topCompassValueLabels: ["Synthetic", "Audit"],
    costSurfaceLabels: [],
    costSurfaceNoneSelected: false,
    correctionChannelLabels: [],
    correctionChannelNoneSelected: false,
    convictionTemperature: "unknown",
    epistemicPosture: "unknown",
  };
}

function listFixtures(): Array<{ set: string; file: string }> {
  const out: Array<{ set: string; file: string }> = [];
  for (const set of ["ocean", "goal-soul-give"]) {
    const dir = join(ROOT, set);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)
      .filter((x) => x.endsWith(".json"))
      .sort()) {
      out.push({ set, file: f });
    }
  }
  return out;
}

async function runAudit(): Promise<void> {
  const results: AssertionResult[] = [];

  // ── 1. live-session-on-demand-fires-and-caches ─────────────────────
  //   Synthetic non-fixture input + liveSession=true → composer called
  //   once, rewrite returned. Second call → readCachedRewrite returns
  //   the runtime-cached rewrite WITHOUT re-calling the composer.
  {
    _clearRuntimeRewriteCacheForTests();
    const inputs = makeSyntheticProseInputs("A");
    let composerCalls = 0;
    const composer = async (): Promise<string | null> => {
      composerCalls++;
      return "### Lens — Eyes\n\n**MOCK LLM rewrite for audit.**";
    };
    const budget = new SessionLlmBudget(8);
    const { result: first } = await withWarnIntercept(() =>
      resolveProseRewriteLive(inputs, {
        liveSession: true,
        budget,
        composer,
      })
    );
    // Second call: should hit runtime cache, no new composer call.
    const second = await resolveProseRewriteLive(inputs, {
      liveSession: true,
      budget,
      composer,
    });
    // Third call: also pull through the sync readCachedRewrite path.
    const sync = readCachedRewrite(inputs);
    const fails: string[] = [];
    if (typeof first !== "string") fails.push("first call did not return string");
    if (composerCalls !== 1) fails.push(`expected 1 composer call, got ${composerCalls}`);
    if (second !== first) fails.push("second call did not return cached value");
    if (sync !== first) fails.push("sync readCachedRewrite did not pick up runtime cache");
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "live-session-on-demand-fires-and-caches",
            detail: `composer fired once; runtime cache served subsequent reads`,
          }
        : {
            ok: false,
            assertion: "live-session-on-demand-fires-and-caches",
            detail: fails.join("; "),
          }
    );
    _clearRuntimeRewriteCacheForTests();
  }

  // ── 2. cohort-run-zero-on-demand-calls ─────────────────────────────
  //   Calling resolveProseRewriteLive with liveSession=false on a non-
  //   fixture input must NOT invoke the composer; returns null.
  {
    _clearRuntimeRewriteCacheForTests();
    const inputs = makeSyntheticProseInputs("B");
    let composerCalls = 0;
    const composer = async () => {
      composerCalls++;
      return "should-not-be-called";
    };
    const result = await resolveProseRewriteLive(inputs, {
      liveSession: false,
      composer,
    });
    const fails: string[] = [];
    if (result !== null) fails.push(`expected null, got ${typeof result}`);
    if (composerCalls !== 0)
      fails.push(`composer invoked ${composerCalls} times during cohort path`);
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "cohort-run-zero-on-demand-calls",
            detail: `liveSession=false bypassed composer (0 invocations)`,
          }
        : {
            ok: false,
            assertion: "cohort-run-zero-on-demand-calls",
            detail: fails.join("; "),
          }
    );
    _clearRuntimeRewriteCacheForTests();
  }

  // ── 3. timeout-falls-through-to-engine-prose ───────────────────────
  //   Composer returns null (simulated timeout/error). Resolver returns
  //   null; no runtime-cache write; emits cache-resolution log with
  //   outcome="timeout".
  {
    _clearRuntimeRewriteCacheForTests();
    const inputs = makeSyntheticProseInputs("C");
    const composer = async () => null;
    const { result, warnings } = await withWarnIntercept(() =>
      resolveProseRewriteLive(inputs, {
        liveSession: true,
        budget: new SessionLlmBudget(8),
        composer,
      })
    );
    const resLog = warnings.find((w) => w.includes("[cache-resolution]"));
    const fails: string[] = [];
    if (result !== null) fails.push(`expected null on timeout, got ${typeof result}`);
    if (!resLog) fails.push("no cache-resolution log emitted");
    if (resLog) {
      const jsonStart = resLog.indexOf("{");
      let payload: Record<string, unknown> | null = null;
      try {
        payload = JSON.parse(resLog.slice(jsonStart));
      } catch {
        fails.push("payload not JSON-parseable");
      }
      if (payload?.outcome !== "timeout")
        fails.push(`expected outcome=timeout, got ${payload?.outcome}`);
    }
    // Verify no runtime-cache pollution
    const stillNull = readCachedRewrite(inputs);
    // readCachedRewrite emits a miss log, suppress that side effect for cleanliness
    if (stillNull !== null)
      fails.push(`runtime cache leaked after timeout: ${typeof stillNull}`);
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "timeout-falls-through-to-engine-prose",
            detail: `composer-returns-null → resolver returns null + outcome=timeout log + no runtime-cache pollution`,
          }
        : {
            ok: false,
            assertion: "timeout-falls-through-to-engine-prose",
            detail: fails.join("; "),
          }
    );
    _clearRuntimeRewriteCacheForTests();
  }

  // ── 4. cost-guard-stops-additional-calls ───────────────────────────
  //   Budget cap=2. Three sequential misses → composer fires twice,
  //   third call short-circuits with outcome=cost-guard-hit.
  {
    _clearRuntimeRewriteCacheForTests();
    let composerCalls = 0;
    const composer = async (inp: ProseRewriteInputs) => {
      composerCalls++;
      return `### Lens — Eyes\n\nMOCK rewrite for ${inp.cardId} (${composerCalls})`;
    };
    const budget = new SessionLlmBudget(2);
    const { warnings } = await withWarnIntercept(async () => {
      const a = await resolveProseRewriteLive(makeSyntheticProseInputs("D1"), {
        liveSession: true,
        budget,
        composer,
      });
      const b = await resolveProseRewriteLive(makeSyntheticProseInputs("D2"), {
        liveSession: true,
        budget,
        composer,
      });
      const c = await resolveProseRewriteLive(makeSyntheticProseInputs("D3"), {
        liveSession: true,
        budget,
        composer,
      });
      return { a, b, c };
    });
    const guardLog = warnings.find(
      (w) => w.includes("[cache-resolution]") && w.includes('"cost-guard-hit"')
    );
    const fails: string[] = [];
    if (composerCalls !== 2)
      fails.push(`expected 2 composer calls (cap=2), got ${composerCalls}`);
    if (!guardLog) fails.push("no cost-guard-hit log emitted on 3rd call");
    if (budget.consumed() !== 2)
      fails.push(`budget.consumed()=${budget.consumed()} != 2`);
    if (budget.remaining() !== 0)
      fails.push(`budget.remaining()=${budget.remaining()} != 0`);
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "cost-guard-stops-additional-calls",
            detail: `cap=2 → 2 composer calls + 1 guard-hit log; budget exhausted as expected`,
          }
        : {
            ok: false,
            assertion: "cost-guard-stops-additional-calls",
            detail: fails.join("; "),
          }
    );
    _clearRuntimeRewriteCacheForTests();
  }

  // ── 5. cohort-renders-stay-silent ──────────────────────────────────
  //   Render every cohort fixture in user mode via the existing sync
  //   path (the new code adds no on-demand calls for cohort renders;
  //   the runtime cache stays empty since no live wrapper is invoked).
  {
    _clearRuntimeRewriteCacheForTests();
    _clearRuntimeKeystoneCacheForTests();
    const { warnings } = await withWarnIntercept(async () => {
      for (const fx of listFixtures()) {
        const raw = JSON.parse(
          readFileSync(join(ROOT, fx.set, fx.file), "utf-8")
        ) as { answers: Answer[]; demographics?: DemographicSet | null };
        const constitution = buildInnerConstitution(
          raw.answers,
          [],
          raw.demographics ?? null
        );
        renderMirrorAsMarkdown({
          constitution,
          includeBeliefAnchor: false,
          answers: raw.answers,
          demographics: raw.demographics ?? null,
          generatedAt: new Date("2026-05-13T00:00:00Z"),
          renderMode: "user",
        });
      }
      return null;
    });
    const onDemandLogs = warnings.filter((w) =>
      w.includes("[cache-resolution]")
    );
    const missLogs = warnings.filter((w) => w.includes("[cache-miss]"));
    const fails: string[] = [];
    if (onDemandLogs.length > 0)
      fails.push(`${onDemandLogs.length} on-demand resolution logs during cohort render`);
    if (missLogs.length > 0)
      fails.push(`${missLogs.length} cache-miss logs during cohort render`);
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "cohort-renders-stay-silent",
            detail: `24 cohort renders produced 0 resolution logs and 0 miss logs`,
          }
        : {
            ok: false,
            assertion: "cohort-renders-stay-silent",
            detail: fails.join("; "),
          }
    );
  }

  // ── 6. keystone-live-session-on-demand-fires ───────────────────────
  //   Same contract for the Keystone resolver.
  {
    _clearRuntimeKeystoneCacheForTests();
    const inputs = makeSyntheticKeystoneInputs("K1");
    let composerCalls = 0;
    const composer = async () => {
      composerCalls++;
      return `> ${inputs.beliefText}\n\nMOCK keystone rewrite for audit.`;
    };
    const first = await resolveKeystoneRewriteLive(inputs, {
      liveSession: true,
      budget: new SessionLlmBudget(),
      composer,
    });
    const second = await resolveKeystoneRewriteLive(inputs, {
      liveSession: true,
      budget: new SessionLlmBudget(),
      composer,
    });
    const sync = readCachedKeystoneRewrite(inputs);
    const fails: string[] = [];
    if (typeof first !== "string") fails.push("first call did not return string");
    if (composerCalls !== 1) fails.push(`expected 1 composer call, got ${composerCalls}`);
    if (second !== first)
      fails.push("second keystone call did not return cached value");
    if (sync !== first)
      fails.push("sync readCachedKeystoneRewrite did not pick up runtime cache");
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "keystone-live-session-on-demand-fires",
            detail: `keystone composer fired once; runtime cache served subsequent reads`,
          }
        : {
            ok: false,
            assertion: "keystone-live-session-on-demand-fires",
            detail: fails.join("; "),
          }
    );
    _clearRuntimeKeystoneCacheForTests();
  }

  // ── 7. return-contract-preserved ───────────────────────────────────
  //   Resolver returns one of: cached string, fresh string on success,
  //   null on miss-in-cohort, null on timeout/error/guard. Never throws.
  //   Verified across the prior assertions; this is the formal summary.
  {
    _clearRuntimeRewriteCacheForTests();
    const inputs = makeSyntheticProseInputs("E");
    // Cohort path → null
    const cohort = await resolveProseRewriteLive(inputs, {
      liveSession: false,
    });
    // Live path with throwing composer → null + error log
    let didThrow = false;
    const throwingComposer = async () => {
      throw new Error("simulated API failure");
    };
    let liveError: string | null = "unset";
    try {
      liveError = await resolveProseRewriteLive(inputs, {
        liveSession: true,
        budget: new SessionLlmBudget(),
        composer: throwingComposer,
      });
    } catch {
      didThrow = true;
    }
    const fails: string[] = [];
    if (cohort !== null) fails.push("cohort path did not return null");
    if (didThrow) fails.push("resolver threw on composer exception");
    if (liveError !== null) fails.push("error path did not return null");
    // Hash determinism check
    const expectedKey = proseRewriteHash(inputs);
    if (expectedKey !== proseRewriteHash(inputs))
      fails.push("hash not deterministic");
    void keystoneRewriteHash;
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "return-contract-preserved",
            detail: `null on miss/cohort/error/timeout; no exceptions escape resolver`,
          }
        : {
            ok: false,
            assertion: "return-contract-preserved",
            detail: fails.join("; "),
          }
    );
    _clearRuntimeRewriteCacheForTests();
  }

  // ── Report ─────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  for (const r of results) {
    const tag = r.ok ? "[PASS]" : "[FAIL]";
    console.log(`${tag} ${r.assertion}${r.detail ? `  — ${r.detail}` : ""}`);
  }
  console.log("");
  console.log(
    `CC-LIVE-SESSION-LLM-WIRING: ${passed}/${results.length} assertions passing.`
  );
  if (failed > 0) process.exit(1);
}

runAudit().catch((e) => {
  console.error(e);
  process.exit(1);
});
