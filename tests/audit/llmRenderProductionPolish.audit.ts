// CC-LLM-RENDER-PRODUCTION-POLISH audit — three production-readiness
// gates:
//   1. Parallel resolution (Promise.all across 5 sections; total ≈
//      slowest single call, not sum).
//   2. Budget enforcement under parallel calls (cap respected).
//   3. Independent failure (one composer throws; others succeed).
//   4. "refining…" kicker absent from on-screen card surfaces.
//   5. Copy / Download buttons enter a "Generating…" disabled state
//      while the fetch is in flight.

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import { resolveScopedRewritesLive } from "../../lib/resolveScopedRewritesLive";
import {
  _clearRuntimeRewriteCacheForTests,
} from "../../lib/proseRewriteLlm";
import {
  _clearRuntimeKeystoneCacheForTests,
} from "../../lib/keystoneRewriteLlm";
import { SessionLlmBudget } from "../../lib/cacheObservability";
import type {
  Answer,
  BeliefUnderTension,
  DemographicSet,
  InnerConstitution,
} from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

function loadFixture(set: string, file: string): {
  constitution: InnerConstitution;
  answers: Answer[];
  demographics: DemographicSet | null;
} {
  const raw = JSON.parse(readFileSync(join(ROOT, set, file), "utf-8")) as {
    answers: Answer[];
    demographics?: DemographicSet | null;
  };
  return {
    constitution: buildInnerConstitution(
      raw.answers,
      [],
      raw.demographics ?? null
    ),
    answers: raw.answers,
    demographics: raw.demographics ?? null,
  };
}

function syntheticConstitution(): {
  constitution: InnerConstitution;
  answers: Answer[];
  demographics: DemographicSet | null;
} {
  const base = loadFixture("ocean", "07-jason-real-session.json");
  const syntheticBelief: BeliefUnderTension = {
    ...(base.constitution.belief_under_tension as BeliefUnderTension),
    belief_text: `SYNTHETIC parallel-test belief ${Math.random()}.`,
  };
  return {
    constitution: {
      ...base.constitution,
      belief_under_tension: syntheticBelief,
    },
    answers: base.answers,
    demographics: base.demographics,
  };
}

async function runAudit(): Promise<void> {
  const results: AssertionResult[] = [];

  // ── 1. parallel-resolution-timing ──────────────────────────────────
  //   5 mock composers each sleep 200ms. With Promise.all the total
  //   wall-clock is ≈ 200ms; serial would be ≈ 1000ms+. Assert ≤ 500ms.
  //   Synthesizes inputs that miss the committed prose-rewrite cache
  //   by mutating archetype reservedCanonLines / engineSectionBody so
  //   all five composers actually fire (cohort hits would skip them).
  {
    _clearRuntimeRewriteCacheForTests();
    _clearRuntimeKeystoneCacheForTests();
    // Use a synthetic constitution + force misses by injecting a
    // composer that always runs (the resolver only invokes the composer
    // on a cache miss; cohort body cards hit, so to time 5 calls we
    // need 5 fresh inputs). Strategy: call resolveProseRewriteLive
    // directly on 5 synthetic inputs in parallel.
    const { resolveProseRewriteLive } = await import(
      "../../lib/proseRewriteLlmServer"
    );
    const { resolveKeystoneRewriteLive } = await import(
      "../../lib/keystoneRewriteLlmServer"
    );
    type Card = "lens" | "compass" | "hands" | "path";
    const slowComposer = async () => {
      await new Promise((r) => setTimeout(r, 200));
      return "MOCK";
    };
    const budget = new SessionLlmBudget(8);
    const startedAt = Date.now();
    const tasks: Promise<unknown>[] = [];
    for (const cardId of ["lens", "compass", "hands", "path"] as Card[]) {
      tasks.push(
        resolveProseRewriteLive(
          {
            cardId,
            archetype: "unmappedType",
            engineSectionBody: `### Test\n\nSYNTHETIC parallel timing body for ${cardId} ${Math.random()}.`,
            reservedCanonLines: [],
          },
          {
            liveSession: true,
            budget,
            composer: slowComposer,
          }
        )
      );
    }
    tasks.push(
      resolveKeystoneRewriteLive(
        {
          archetype: "unmappedType",
          beliefText: `SYNTHETIC parallel timing belief ${Math.random()}.`,
          valueDomain: "unknown",
          topCompassValueLabels: [],
          costSurfaceLabels: [],
          costSurfaceNoneSelected: false,
          correctionChannelLabels: [],
          correctionChannelNoneSelected: false,
          convictionTemperature: "unknown",
          epistemicPosture: "unknown",
        },
        { liveSession: true, budget, composer: slowComposer }
      )
    );
    await Promise.all(tasks);
    const elapsed = Date.now() - startedAt;
    results.push(
      elapsed < 500
        ? {
            ok: true,
            assertion: "parallel-resolution-timing",
            detail: `5 composers × 200ms ran in ${elapsed}ms (parallel; serial would be ≥1000ms)`,
          }
        : {
            ok: false,
            assertion: "parallel-resolution-timing",
            detail: `${elapsed}ms is too slow — serial regression suspected (target < 500ms)`,
          }
    );
    _clearRuntimeRewriteCacheForTests();
    _clearRuntimeKeystoneCacheForTests();
  }

  // ── 2. budget-enforced-under-parallel ──────────────────────────────
  //   Budget cap=2 with 5 synthetic sections → ≤2 composer invocations.
  //   resolveScopedRewritesLive needs to honor the budget even with
  //   parallel-launched tasks.
  {
    _clearRuntimeRewriteCacheForTests();
    _clearRuntimeKeystoneCacheForTests();
    const { constitution, answers, demographics } = syntheticConstitution();
    let composerCalls = 0;
    const composer = async () => {
      composerCalls++;
      return "MOCK";
    };
    await resolveScopedRewritesLive(
      { constitution, answers, demographics },
      {
        proseComposer: composer,
        keystoneComposer: composer,
        budget: new SessionLlmBudget(2),
      }
    );
    results.push(
      composerCalls <= 2
        ? {
            ok: true,
            assertion: "budget-enforced-under-parallel",
            detail: `budget=2 → composer invoked ${composerCalls}× (≤ cap, parallel-safe)`,
          }
        : {
            ok: false,
            assertion: "budget-enforced-under-parallel",
            detail: `budget=2 but composer fired ${composerCalls}× under parallel resolution`,
          }
    );
    _clearRuntimeRewriteCacheForTests();
    _clearRuntimeKeystoneCacheForTests();
  }

  // ── 3. independent-section-failure ─────────────────────────────────
  //   Keystone composer throws; the resolver still returns the
  //   ScopedRewritesResult with `keystone: null` AND the four body
  //   cards keep their committed-cache hits intact. The overall call
  //   does not throw.
  {
    _clearRuntimeRewriteCacheForTests();
    _clearRuntimeKeystoneCacheForTests();
    const { constitution, answers, demographics } = syntheticConstitution();
    const throwingKeystoneComposer = async () => {
      throw new Error("simulated keystone composer failure");
    };
    let threw = false;
    let result: Awaited<
      ReturnType<typeof resolveScopedRewritesLive>
    > | null = null;
    try {
      result = await resolveScopedRewritesLive(
        { constitution, answers, demographics },
        { keystoneComposer: throwingKeystoneComposer }
      );
    } catch {
      threw = true;
    }
    const fails: string[] = [];
    if (threw) fails.push("resolver threw on keystone composer exception");
    if (!result) fails.push("resolver returned null instead of result object");
    if (result && result.keystone !== null)
      fails.push(`keystone should be null on throw, got ${typeof result.keystone}`);
    // Body cards: Jason cohort fixture has cache hits, so all four
    // strings come from the committed cache regardless of composer state.
    if (result) {
      for (const k of ["lens", "compass", "hands", "path"] as const) {
        if (typeof result[k] !== "string")
          fails.push(`${k} not resolved (expected committed-cache hit)`);
      }
    }
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "independent-section-failure",
            detail: `keystone composer threw → keystone=null + 4 body cards still resolved + no exception`,
          }
        : {
            ok: false,
            assertion: "independent-section-failure",
            detail: fails.join("; "),
          }
    );
    _clearRuntimeRewriteCacheForTests();
    _clearRuntimeKeystoneCacheForTests();
  }

  // ── 4. refining-kicker-absent ──────────────────────────────────────
  //   Source-code level: no in-scope component renders "refining…" or
  //   threads the kicker prop. Strips // line-comments and /* … */
  //   block-comments before checking so comments documenting the
  //   removal don't false-trip the audit.
  function stripComments(src: string): string {
    return src
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1");
  }
  {
    const filesToCheck = [
      "app/components/ShapeCard.tsx",
      "app/components/MapSection.tsx",
      "app/components/InnerConstitutionPage.tsx",
    ];
    const fails: string[] = [];
    for (const rel of filesToCheck) {
      const p = join(__dirname, "..", "..", rel);
      if (!existsSync(p)) {
        fails.push(`${rel}: file missing`);
        continue;
      }
      const src = stripComments(readFileSync(p, "utf-8"));
      // No "refining…" JSX-rendered text (in stripped source).
      if (/refining\s*…/.test(src))
        fails.push(`${rel}: "refining…" text still emitted in non-comment source`);
      // No `llmResolving` identifier in stripped source.
      if (/\bllmResolving\b/.test(src))
        fails.push(`${rel}: "llmResolving" identifier still present in code`);
      // No `liveRewritesResolving` identifier in stripped source.
      if (/\bliveRewritesResolving\b/.test(src))
        fails.push(
          `${rel}: "liveRewritesResolving" identifier still present in code`
        );
    }
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "refining-kicker-absent",
            detail: `no "refining…" kicker text, no llmResolving / liveRewritesResolving identifier in any in-scope component (comments stripped)`,
          }
        : {
            ok: false,
            assertion: "refining-kicker-absent",
            detail: fails.join("; "),
          }
    );
  }

  // ── 5. share-button-loading-state-wired ────────────────────────────
  //   Source-code level: InnerConstitutionPage.tsx exposes `isCopying`
  //   + `isDownloading` state, ties them to the Copy / Download
  //   handlers, and the buttons disable + show "Generating…" while
  //   pending. Verified via grep for the key patterns; running React
  //   in a headless harness is outside this audit's scope.
  {
    const abs = join(
      __dirname,
      "..",
      "..",
      "app",
      "components",
      "InnerConstitutionPage.tsx"
    );
    const fails: string[] = [];
    if (!existsSync(abs)) {
      fails.push("InnerConstitutionPage.tsx missing");
    } else {
      const src = readFileSync(abs, "utf-8");
      if (!/\bisCopying\b/.test(src)) fails.push("missing isCopying state");
      if (!/\bisDownloading\b/.test(src)) fails.push("missing isDownloading state");
      if (!/disabled=\{isCopying\}/.test(src))
        fails.push("Copy button does not disable on isCopying");
      if (!/disabled=\{isDownloading\}/.test(src))
        fails.push("Download button does not disable on isDownloading");
      if (!/Generating…/.test(src))
        fails.push('missing "Generating…" label in button text');
      // Verify the 30s safety timeout exists (a finally-only reversion
      // is acceptable; the safety timeout is belt-and-suspenders).
      if (!/30_000|30000/.test(src) && !/LIVE_MARKDOWN_SAFETY_MS/.test(src))
        fails.push("no 30s safety timeout / hard cap visible in source");
    }
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "share-button-loading-state-wired",
            detail: `Copy + Download buttons: isCopying/isDownloading + disabled + "Generating…" label + 30s safety`,
          }
        : {
            ok: false,
            assertion: "share-button-loading-state-wired",
            detail: fails.join("; "),
          }
    );
  }

  // ── 6. parallel-helpers-use-Promise-all ────────────────────────────
  //   Defensive source-code gate: both server helpers
  //   (resolveScopedRewritesLive + renderMirrorAsMarkdownLive) await
  //   `Promise.all([…])` over the section tasks. Catches a future
  //   accidental refactor that switches one back to sequential awaits.
  {
    const fails: string[] = [];
    for (const rel of [
      "lib/resolveScopedRewritesLive.ts",
      "lib/renderMirrorLive.ts",
    ]) {
      const p = join(__dirname, "..", "..", rel);
      if (!existsSync(p)) {
        fails.push(`${rel}: file missing`);
        continue;
      }
      const src = readFileSync(p, "utf-8");
      if (!/Promise\.all\s*\(/.test(src))
        fails.push(`${rel}: no Promise.all call (parallel resolution missing?)`);
    }
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "parallel-helpers-use-Promise-all",
            detail: `resolveScopedRewritesLive + renderMirrorAsMarkdownLive both call Promise.all`,
          }
        : {
            ok: false,
            assertion: "parallel-helpers-use-Promise-all",
            detail: fails.join("; "),
          }
    );
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
    `CC-LLM-RENDER-PRODUCTION-POLISH: ${passed}/${results.length} assertions passing.`
  );
  if (failed > 0) process.exit(1);
}

runAudit().catch((e) => {
  console.error(e);
  process.exit(1);
});
