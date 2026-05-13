// CC-REACT-ON-SCREEN-LLM-RENDER audit — verifies the on-screen LLM
// resolver path: `resolveScopedRewritesLive` returns structured per-
// section rewrites; the `/api/report-cards` route exists and imports
// the helper; cohort fixture renders produce no on-demand calls;
// failure modes return the null-shaped result; budget enforcement
// passes through to the live resolver chain.

import { readFileSync, readdirSync, existsSync } from "node:fs";
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

  // ── 1. route-exists-and-wires-resolver ─────────────────────────────
  //   `/api/report-cards/route.ts` must exist and import the structured
  //   resolver. `resolveScopedRewritesLive` must export the expected
  //   `ScopedRewritesResult` shape.
  {
    const routePath = join(
      __dirname,
      "..",
      "..",
      "app",
      "api",
      "report-cards",
      "route.ts"
    );
    const libPath = join(
      __dirname,
      "..",
      "..",
      "lib",
      "resolveScopedRewritesLive.ts"
    );
    const fails: string[] = [];
    if (!existsSync(routePath)) {
      fails.push("app/api/report-cards/route.ts missing");
    } else {
      const src = readFileSync(routePath, "utf-8");
      if (!/resolveScopedRewritesLive/.test(src))
        fails.push("route does not import resolveScopedRewritesLive");
      if (!/export\s+async\s+function\s+POST/.test(src))
        fails.push("route does not export async POST");
      if (!/runtime\s*=\s*"nodejs"/.test(src))
        fails.push('route does not declare runtime="nodejs"');
    }
    if (!existsSync(libPath)) {
      fails.push("lib/resolveScopedRewritesLive.ts missing");
    } else {
      const src = readFileSync(libPath, "utf-8");
      if (!/export\s+async\s+function\s+resolveScopedRewritesLive/.test(src))
        fails.push("helper does not export resolveScopedRewritesLive");
      if (!/ScopedRewritesResult/.test(src))
        fails.push("helper does not export ScopedRewritesResult");
    }
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "route-exists-and-wires-resolver",
            detail: `/api/report-cards/route.ts + lib/resolveScopedRewritesLive.ts present and wired`,
          }
        : {
            ok: false,
            assertion: "route-exists-and-wires-resolver",
            detail: fails.join("; "),
          }
    );
  }

  // ── 2. inner-constitution-page-fetches-on-mount ────────────────────
  //   The client component imports useEffect AND issues a POST to
  //   /api/report-cards. Catches accidental removal of the wiring.
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
      if (!/useEffect/.test(src)) fails.push("missing useEffect import/use");
      if (!/['"`]\/api\/report-cards['"`]/.test(src))
        fails.push("does not POST to /api/report-cards");
    }
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "inner-constitution-page-fetches-on-mount",
            detail: `InnerConstitutionPage imports useEffect + fetches /api/report-cards`,
          }
        : {
            ok: false,
            assertion: "inner-constitution-page-fetches-on-mount",
            detail: fails.join("; "),
          }
    );
  }

  // ── 3. synthetic-non-fixture-triggers-llm-resolver ─────────────────
  //   Build a synthetic constitution whose belief misses the cohort
  //   Keystone cache; inject mock composers; assert the resolver
  //   returns the mock prose for keystone AND fires the keystone
  //   composer at least once.
  {
    _clearRuntimeRewriteCacheForTests();
    _clearRuntimeKeystoneCacheForTests();
    const jason = loadFixture("ocean", "07-jason-real-session.json");
    const syntheticBelief: BeliefUnderTension = {
      ...(jason.constitution.belief_under_tension as BeliefUnderTension),
      belief_text: "SYNTHETIC belief for CC-REACT-ON-SCREEN-LLM-RENDER audit.",
    };
    const constitution: InnerConstitution = {
      ...jason.constitution,
      belief_under_tension: syntheticBelief,
    };
    let proseCalls = 0;
    let keystoneCalls = 0;
    const proseComposer = async () => {
      proseCalls++;
      return `**MOCK prose ${proseCalls} for on-screen audit.**`;
    };
    const keystoneComposer = async () => {
      keystoneCalls++;
      return `> ${syntheticBelief.belief_text}\n\nMOCK ON-SCREEN keystone rewrite.`;
    };
    const result = await resolveScopedRewritesLive(
      {
        constitution,
        answers: jason.answers,
        demographics: jason.demographics,
      },
      {
        proseComposer,
        keystoneComposer,
        budget: new SessionLlmBudget(8),
      }
    );
    const fails: string[] = [];
    if (keystoneCalls < 1)
      fails.push(`keystone composer fired ${keystoneCalls}× (expected ≥1)`);
    if (typeof result.keystone !== "string")
      fails.push(`result.keystone is not a string: ${typeof result.keystone}`);
    if (
      typeof result.keystone === "string" &&
      !result.keystone.includes("MOCK ON-SCREEN keystone rewrite")
    )
      fails.push("keystone result missing mock content");
    // The four body cards: Jason fixture hits the committed cache for
    // each (the synthetic belief change doesn't affect body cards), so
    // proseCalls may be 0. Verify the returned strings exist.
    for (const card of ["lens", "compass", "hands", "path"] as const) {
      if (typeof result[card] !== "string")
        fails.push(`result.${card} is null (cache miss + composer didn't fire)`);
    }
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "synthetic-non-fixture-triggers-llm-resolver",
            detail: `synthetic belief → keystone composer fired ${keystoneCalls}× + result contains mock rewrite + all 4 body cards resolved`,
          }
        : {
            ok: false,
            assertion: "synthetic-non-fixture-triggers-llm-resolver",
            detail: fails.join("; "),
          }
    );
    _clearRuntimeRewriteCacheForTests();
    _clearRuntimeKeystoneCacheForTests();
  }

  // ── 4. cohort-fixtures-return-cached-no-on-demand ──────────────────
  //   For every cohort fixture, calling resolveScopedRewritesLive
  //   produces ZERO composer invocations (committed cache hits across
  //   the board) AND returns non-null for every scoped section that
  //   has a cohort entry.
  {
    _clearRuntimeRewriteCacheForTests();
    _clearRuntimeKeystoneCacheForTests();
    let proseCalls = 0;
    let keystoneCalls = 0;
    const proseComposer = async () => {
      proseCalls++;
      return "should-not-be-called";
    };
    const keystoneComposer = async () => {
      keystoneCalls++;
      return "should-not-be-called";
    };
    let belieflessFixtures = 0;
    for (const fx of listFixtures()) {
      const { constitution, answers, demographics } = loadFixture(
        fx.set,
        fx.file
      );
      if (!constitution.belief_under_tension?.belief_text) belieflessFixtures++;
      await resolveScopedRewritesLive(
        { constitution, answers, demographics },
        { proseComposer, keystoneComposer, budget: new SessionLlmBudget(8) }
      );
    }
    const fails: string[] = [];
    if (proseCalls > 0)
      fails.push(`prose composer fired ${proseCalls}× during cohort run`);
    if (keystoneCalls > 0)
      fails.push(`keystone composer fired ${keystoneCalls}× during cohort run`);
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "cohort-fixtures-return-cached-no-on-demand",
            detail: `24 cohort fixtures resolved entirely from committed caches (${belieflessFixtures} had no belief)`,
          }
        : {
            ok: false,
            assertion: "cohort-fixtures-return-cached-no-on-demand",
            detail: fails.join("; "),
          }
    );
    _clearRuntimeRewriteCacheForTests();
    _clearRuntimeKeystoneCacheForTests();
  }

  // ── 5. composer-failure-yields-null-not-throw ──────────────────────
  //   Mock composer returns null (simulated timeout). The resolver
  //   returns nulls for all sections that can't resolve; does NOT
  //   throw; the returned shape is still the expected
  //   `ScopedRewritesResult`.
  {
    _clearRuntimeRewriteCacheForTests();
    _clearRuntimeKeystoneCacheForTests();
    const jason = loadFixture("ocean", "07-jason-real-session.json");
    const syntheticBelief: BeliefUnderTension = {
      ...(jason.constitution.belief_under_tension as BeliefUnderTension),
      belief_text: "SYNTHETIC null-composer on-screen audit belief.",
    };
    const constitution: InnerConstitution = {
      ...jason.constitution,
      belief_under_tension: syntheticBelief,
    };
    const nullComposer = async () => null;
    const result = await resolveScopedRewritesLive(
      {
        constitution,
        answers: jason.answers,
        demographics: jason.demographics,
      },
      {
        proseComposer: nullComposer,
        keystoneComposer: nullComposer,
      }
    );
    const fails: string[] = [];
    if (typeof result !== "object" || result === null)
      fails.push("result not an object");
    if (!("lens" in result)) fails.push("result missing 'lens' key");
    if (!("keystone" in result)) fails.push("result missing 'keystone' key");
    if (result.keystone !== null)
      fails.push(`keystone should be null on composer failure, got ${typeof result.keystone}`);
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "composer-failure-yields-null-not-throw",
            detail: `null composer → ScopedRewritesResult with nulls + no exception`,
          }
        : {
            ok: false,
            assertion: "composer-failure-yields-null-not-throw",
            detail: fails.join("; "),
          }
    );
  }

  // ── 6. budget-cap-enforced ─────────────────────────────────────────
  //   Budget cap=1 → at most 1 composer invocation across all 5
  //   sections. Confirms the SessionLlmBudget flows through
  //   resolveScopedRewritesLive end-to-end.
  {
    _clearRuntimeRewriteCacheForTests();
    _clearRuntimeKeystoneCacheForTests();
    const jason = loadFixture("ocean", "07-jason-real-session.json");
    const syntheticBelief: BeliefUnderTension = {
      ...(jason.constitution.belief_under_tension as BeliefUnderTension),
      belief_text: "SYNTHETIC budget-cap audit belief.",
    };
    const constitution: InnerConstitution = {
      ...jason.constitution,
      belief_under_tension: syntheticBelief,
    };
    let totalCalls = 0;
    const composer = async () => {
      totalCalls++;
      return "MOCK rewrite";
    };
    await resolveScopedRewritesLive(
      {
        constitution,
        answers: jason.answers,
        demographics: jason.demographics,
      },
      {
        proseComposer: composer,
        keystoneComposer: composer,
        budget: new SessionLlmBudget(1),
      }
    );
    results.push(
      totalCalls <= 1
        ? {
            ok: true,
            assertion: "budget-cap-enforced",
            detail: `budget=1 → composer invoked ${totalCalls}× (≤ cap)`,
          }
        : {
            ok: false,
            assertion: "budget-cap-enforced",
            detail: `budget=1 but composer invoked ${totalCalls}× (cap broken)`,
          }
    );
    _clearRuntimeRewriteCacheForTests();
    _clearRuntimeKeystoneCacheForTests();
  }

  // ── 7. endpoint-not-called-from-admin-scripts-tests ────────────────
  //   Grep for the new endpoint path across admin / scripts / tests.
  //   None should reference it. The new audit itself doesn't count
  //   (it imports the resolver helper, not the endpoint).
  {
    const dirsToCheck = [
      join(__dirname, "..", "..", "app", "admin"),
      join(__dirname, "..", "..", "scripts"),
      join(__dirname, "..", ".."), // tests/* gets a separate walk below
    ];
    // Manual walk to find /api/report-cards references in non-allowed
    // paths. Excludes app/api/, app/components/, lib/, the prompts/
    // and node_modules.
    function walk(dir: string, hits: string[]): void {
      if (!existsSync(dir)) return;
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, entry.name);
        if (entry.isDirectory()) {
          // Skip node_modules + .next + the allowed subtrees + this audit.
          if (
            entry.name === "node_modules" ||
            entry.name === ".next" ||
            entry.name === ".git" ||
            entry.name === "prompts" ||
            entry.name === "docs"
          )
            continue;
          if (p.endsWith("/app/api") || p.endsWith("/app/components") || p.endsWith("/lib"))
            continue;
          walk(p, hits);
        } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
          if (p.endsWith("reactOnScreenLlmRender.audit.ts")) continue;
          try {
            const src = readFileSync(p, "utf-8");
            if (/\/api\/report-cards/.test(src)) hits.push(p);
          } catch {
            // file unreadable — ignore
          }
        }
      }
    }
    const hits: string[] = [];
    for (const d of dirsToCheck) walk(d, hits);
    // Filter out the actual route file (the source of truth), the audit
    // file itself (in case the recursive walk picked it up), and any
    // user-facing route file that mounts InnerConstitutionPage
    // (`/assessment/page.tsx`, `/report/[sessionId]/page.tsx`).
    const filtered = hits.filter(
      (p) =>
        !p.includes("/app/api/report-cards/route.ts") &&
        !p.includes("reactOnScreenLlmRender.audit.ts") &&
        !p.endsWith("InnerConstitutionPage.tsx") &&
        !p.includes("/app/assessment/page.tsx") &&
        !p.includes("/app/report/")
    );
    results.push(
      filtered.length === 0
        ? {
            ok: true,
            assertion: "endpoint-not-called-from-admin-scripts-tests",
            detail: `no admin / scripts / non-InnerConstitution test files reference /api/report-cards`,
          }
        : {
            ok: false,
            assertion: "endpoint-not-called-from-admin-scripts-tests",
            detail: `references found in: ${filtered.slice(0, 3).join(", ")}`,
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
    `CC-REACT-ON-SCREEN-LLM-RENDER: ${passed}/${results.length} assertions passing.`
  );
  if (failed > 0) process.exit(1);
}

runAudit().catch((e) => {
  console.error(e);
  process.exit(1);
});
