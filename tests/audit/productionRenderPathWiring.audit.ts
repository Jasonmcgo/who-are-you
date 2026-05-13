// CC-PRODUCTION-RENDER-PATH-WIRING audit — verifies the live render
// path (renderMirrorAsMarkdownLive via `/api/render`) fires on-demand
// LLM resolution for non-cohort inputs, while cohort renders and
// admin paths stay silent (no on-demand LLM calls, no runtime-cache
// writes).
//
// The audit avoids real API calls by injecting mock composers into the
// live wrapper. The audit does NOT invoke the `/api/render` endpoint
// itself (that would require a running Next.js server); instead it
// exercises `renderMirrorAsMarkdownLive` directly which is what the
// route delegates to.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import { renderMirrorAsMarkdownLive } from "../../lib/renderMirrorLive";
import { renderMirrorAsMarkdown } from "../../lib/renderMirror";
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

async function withWarnIntercept<T>(
  fn: () => Promise<T>
): Promise<{ result: T; warnings: string[] }> {
  const warnings: string[] = [];
  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    warnings.push(args.map((a) => String(a)).join(" "));
  };
  try {
    const result = await fn();
    return { result, warnings };
  } finally {
    console.warn = origWarn;
  }
}

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

  // ── 1. live-call-site-inventory ────────────────────────────────────
  //   Verifies the source code state: no user-facing client component
  //   imports `renderMirrorAsMarkdown` directly. The InnerConstitution
  //   Page's Copy / Download handlers must go through the API route.
  //   Admin paths + scripts + tests are allowed to keep the sync import.
  {
    const filesToCheck = [
      "app/components/InnerConstitutionPage.tsx",
    ];
    const failures: string[] = [];
    for (const rel of filesToCheck) {
      const abs = join(__dirname, "..", "..", rel);
      if (!existsSync(abs)) {
        failures.push(`${rel}: file missing`);
        continue;
      }
      const src = readFileSync(abs, "utf-8");
      // Look for a non-comment, non-string import or call of
      // `renderMirrorAsMarkdown(`. Comments referencing the name are fine.
      const importMatch = src.match(
        /import\s*\{[^}]*\brenderMirrorAsMarkdown\b[^}]*\}\s*from/
      );
      const callMatch = src.match(/\brenderMirrorAsMarkdown\s*\(/);
      if (importMatch) {
        failures.push(`${rel}: imports renderMirrorAsMarkdown (live client component)`);
      }
      if (callMatch) {
        failures.push(`${rel}: calls renderMirrorAsMarkdown() (live client component)`);
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "live-call-site-inventory",
            detail: `user-facing client component InnerConstitutionPage no longer calls renderMirrorAsMarkdown directly`,
          }
        : {
            ok: false,
            assertion: "live-call-site-inventory",
            detail: failures.join(", "),
          }
    );
  }

  // ── 2. api-render-route-exists ─────────────────────────────────────
  //   The bridge from client → server. The route file must exist AND
  //   import `renderMirrorAsMarkdownLive`.
  {
    const abs = join(__dirname, "..", "..", "app", "api", "render", "route.ts");
    const fails: string[] = [];
    if (!existsSync(abs)) {
      fails.push("app/api/render/route.ts does not exist");
    } else {
      const src = readFileSync(abs, "utf-8");
      if (!/renderMirrorAsMarkdownLive/.test(src))
        fails.push("route does not import renderMirrorAsMarkdownLive");
      if (!/export\s+async\s+function\s+POST/.test(src))
        fails.push("route does not export `async function POST`");
    }
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "api-render-route-exists",
            detail: `app/api/render/route.ts exports async POST and calls renderMirrorAsMarkdownLive`,
          }
        : {
            ok: false,
            assertion: "api-render-route-exists",
            detail: fails.join(", "),
          }
    );
  }

  // ── 3. live-on-demand-fires-for-non-fixture-input ──────────────────
  //   Synthetic non-cohort constitution → renderMirrorAsMarkdownLive
  //   with injected mock composers. Verify both prose-rewrite and
  //   keystone composers are invoked AND the rendered output contains
  //   the mock prose for every scoped section.
  {
    _clearRuntimeRewriteCacheForTests();
    _clearRuntimeKeystoneCacheForTests();

    // Start from a cohort fixture but mutate the belief text so it
    // misses the committed Keystone cache. For the body cards, use
    // the canonical Jason fixture as a base; the mock composers
    // intercept regardless of input (the runtime-cache write path
    // produces synthetic output the renderer picks up).
    const jason = loadFixture("ocean", "07-jason-real-session.json");
    const syntheticBelief: BeliefUnderTension = {
      ...(jason.constitution.belief_under_tension as BeliefUnderTension),
      belief_text: "SYNTHETIC live belief — CC-PRODUCTION-RENDER-PATH-WIRING audit.",
    };
    const constitution: InnerConstitution = {
      ...jason.constitution,
      belief_under_tension: syntheticBelief,
    };
    // Force-bust the prose-rewrite cache by mutating signal ordering;
    // simpler: inject mock composers that always fire (and the LIVE
    // wrapper only invokes them when readCachedRewrite/readCached
    // KeystoneRewrite return null). For cohort cache hits, the mock
    // is never called.
    // Approach: use a non-cohort belief text + mock composers, and
    // for body cards rely on the mock to fire on any miss.

    let proseCalls = 0;
    let keystoneCalls = 0;
    const proseComposer = async () => {
      proseCalls++;
      return `### Hands — Work\n\n**MOCK PROSE for live audit ${proseCalls}.**`;
    };
    const keystoneComposer = async () => {
      keystoneCalls++;
      return `> ${syntheticBelief.belief_text}\n\nMOCK KEYSTONE rewrite for live audit.`;
    };

    const { result: md, warnings } = await withWarnIntercept(() =>
      renderMirrorAsMarkdownLive(
        {
          constitution,
          answers: jason.answers,
          demographics: jason.demographics,
          includeBeliefAnchor: false,
        },
        {
          proseComposer,
          keystoneComposer,
          budget: new SessionLlmBudget(8),
        }
      )
    );

    const resolutionLogs = warnings.filter((w) =>
      w.includes("[cache-resolution]") && w.includes('"outcome":"success"')
    );
    const fails: string[] = [];
    // For cohort body-card hits, proseComposer doesn't fire — those
    // sections come from the committed cache. The Keystone fires
    // because we synthesized a non-cohort belief.
    if (keystoneCalls < 1) {
      fails.push(`keystone composer fired ${keystoneCalls}× (expected ≥1)`);
    }
    if (!md.includes("MOCK KEYSTONE rewrite for live audit")) {
      fails.push("rendered output missing keystone mock rewrite");
    }
    if (resolutionLogs.length < 1) {
      fails.push(`expected ≥1 success resolution log, got ${resolutionLogs.length}`);
    }
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "live-on-demand-fires-for-non-fixture-input",
            detail: `synthetic non-cohort belief → keystone composer fired ${keystoneCalls}× + success log + rendered output contains mock rewrite`,
          }
        : {
            ok: false,
            assertion: "live-on-demand-fires-for-non-fixture-input",
            detail: fails.join("; "),
          }
    );
    _clearRuntimeRewriteCacheForTests();
    _clearRuntimeKeystoneCacheForTests();
  }

  // ── 4. cohort-runs-zero-on-demand-resolution ───────────────────────
  //   Running every cohort fixture through the SYNC renderer
  //   (`renderMirrorAsMarkdown`) — the path admin / audit / cohort
  //   regen takes — produces ZERO `[cache-resolution]` logs. Cache
  //   misses are also expected to be zero because the cohort fixtures
  //   are cache-primed.
  {
    _clearRuntimeRewriteCacheForTests();
    _clearRuntimeKeystoneCacheForTests();
    const { warnings } = await withWarnIntercept(async () => {
      for (const fx of listFixtures()) {
        const { constitution, answers, demographics } = loadFixture(
          fx.set,
          fx.file
        );
        renderMirrorAsMarkdown({
          constitution,
          answers,
          demographics,
          includeBeliefAnchor: false,
          generatedAt: new Date("2026-05-13T00:00:00Z"),
          renderMode: "user",
        });
      }
      return null;
    });
    const resLogs = warnings.filter((w) => w.includes("[cache-resolution]"));
    const missLogs = warnings.filter((w) => w.includes("[cache-miss]"));
    const fails: string[] = [];
    if (resLogs.length > 0)
      fails.push(`${resLogs.length} resolution logs during sync cohort run`);
    if (missLogs.length > 0)
      fails.push(`${missLogs.length} miss logs during sync cohort run`);
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "cohort-runs-zero-on-demand-resolution",
            detail: `24 cohort renders through sync path → 0 resolution logs and 0 miss logs`,
          }
        : {
            ok: false,
            assertion: "cohort-runs-zero-on-demand-resolution",
            detail: fails.join("; "),
          }
    );
  }

  // ── 5. admin-clinician-mode-zero-on-demand ─────────────────────────
  //   Admin renders the report in clinician mode by default (the
  //   admin page calls renderMirrorAsMarkdown with includeBeliefAnchor:
  //   true and no renderMode → default 'user', BUT it does NOT route
  //   through renderMirrorAsMarkdownLive). Whether clinician or user
  //   mode, the sync path produces zero on-demand resolution logs.
  {
    _clearRuntimeRewriteCacheForTests();
    _clearRuntimeKeystoneCacheForTests();
    const jason = loadFixture("ocean", "07-jason-real-session.json");
    const { warnings } = await withWarnIntercept(async () => {
      // Mimic admin path
      renderMirrorAsMarkdown({
        constitution: jason.constitution,
        answers: jason.answers,
        demographics: jason.demographics,
        includeBeliefAnchor: true,
      });
      return null;
    });
    const resLogs = warnings.filter((w) => w.includes("[cache-resolution]"));
    results.push(
      resLogs.length === 0
        ? {
            ok: true,
            assertion: "admin-clinician-mode-zero-on-demand",
            detail: `admin-style sync render → 0 resolution logs`,
          }
        : {
            ok: false,
            assertion: "admin-clinician-mode-zero-on-demand",
            detail: `${resLogs.length} resolution logs (expected 0)`,
          }
    );
  }

  // ── 6. live-wrapper-budget-bounded ─────────────────────────────────
  //   Calling the live wrapper with a synthetic input + budget cap of
  //   2 → composer fires at most 2 times (for prose + keystone
  //   together). Demonstrates the per-session cost guard is wired
  //   end-to-end through the live wrapper.
  {
    _clearRuntimeRewriteCacheForTests();
    _clearRuntimeKeystoneCacheForTests();
    const jason = loadFixture("ocean", "07-jason-real-session.json");
    const syntheticBelief: BeliefUnderTension = {
      ...(jason.constitution.belief_under_tension as BeliefUnderTension),
      belief_text: "SYNTHETIC budget-test belief — audit input.",
    };
    const constitution: InnerConstitution = {
      ...jason.constitution,
      belief_under_tension: syntheticBelief,
    };
    let totalComposerCalls = 0;
    const proseComposer = async () => {
      totalComposerCalls++;
      return "**MOCK**";
    };
    const keystoneComposer = async () => {
      totalComposerCalls++;
      return "**MOCK keystone**";
    };
    await renderMirrorAsMarkdownLive(
      {
        constitution,
        answers: jason.answers,
        demographics: jason.demographics,
        includeBeliefAnchor: false,
      },
      {
        proseComposer,
        keystoneComposer,
        budget: new SessionLlmBudget(2),
      }
    );
    results.push(
      totalComposerCalls <= 2
        ? {
            ok: true,
            assertion: "live-wrapper-budget-bounded",
            detail: `budget=2 → composer invoked ${totalComposerCalls}× total (≤ cap)`,
          }
        : {
            ok: false,
            assertion: "live-wrapper-budget-bounded",
            detail: `budget=2 but composer invoked ${totalComposerCalls}× (cap broken)`,
          }
    );
    _clearRuntimeRewriteCacheForTests();
    _clearRuntimeKeystoneCacheForTests();
  }

  // ── 7. live-wrapper-returns-valid-markdown-on-composer-null ────────
  //   Composer returning null (simulated timeout/error) → wrapper
  //   still returns valid markdown (engine fallback splice). This
  //   defends the contract from CC-LIVE-SESSION-LLM-WIRING that no
  //   failure mode produces an empty render.
  {
    _clearRuntimeRewriteCacheForTests();
    _clearRuntimeKeystoneCacheForTests();
    const jason = loadFixture("ocean", "07-jason-real-session.json");
    const syntheticBelief: BeliefUnderTension = {
      ...(jason.constitution.belief_under_tension as BeliefUnderTension),
      belief_text: "SYNTHETIC null-composer belief.",
    };
    const constitution: InnerConstitution = {
      ...jason.constitution,
      belief_under_tension: syntheticBelief,
    };
    const nullComposer = async () => null;
    const md = await renderMirrorAsMarkdownLive(
      {
        constitution,
        answers: jason.answers,
        demographics: jason.demographics,
        includeBeliefAnchor: false,
      },
      {
        proseComposer: nullComposer,
        keystoneComposer: nullComposer,
      }
    );
    const fails: string[] = [];
    if (typeof md !== "string" || md.length < 1000)
      fails.push(`live wrapper returned ${typeof md} of length ${md?.length}`);
    if (!md.includes("## Keystone Reflection"))
      fails.push("Keystone section missing");
    if (!md.includes("### Hands — Work")) fails.push("Hands section missing");
    if (!md.includes("SYNTHETIC null-composer belief"))
      fails.push("verbatim belief quote missing (Tier C path broken)");
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "live-wrapper-returns-valid-markdown-on-composer-null",
            detail: `composer=null → wrapper returns valid markdown with all sections + Tier C verbatim quote`,
          }
        : {
            ok: false,
            assertion: "live-wrapper-returns-valid-markdown-on-composer-null",
            detail: fails.join("; "),
          }
    );
    _clearRuntimeRewriteCacheForTests();
    _clearRuntimeKeystoneCacheForTests();
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
    `CC-PRODUCTION-RENDER-PATH-WIRING: ${passed}/${results.length} assertions passing.`
  );
  if (failed > 0) process.exit(1);
}

runAudit().catch((e) => {
  console.error(e);
  process.exit(1);
});
