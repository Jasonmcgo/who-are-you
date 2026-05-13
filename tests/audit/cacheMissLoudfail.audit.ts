// CC-CACHE-MISS-LOUDFAIL audit — verifies the structured cache-miss
// warning fires for synthetic non-fixture inputs while staying silent
// across the entire cohort.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import { renderMirrorAsMarkdown } from "../../lib/renderMirror";
import {
  proseRewriteHash,
  readCachedRewrite,
  type ProseRewriteInputs,
} from "../../lib/proseRewriteLlm";
import {
  keystoneRewriteHash,
  readCachedKeystoneRewrite,
  type KeystoneRewriteInputs,
} from "../../lib/keystoneRewriteLlm";
import type { Answer, DemographicSet } from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

function withWarnIntercept<T>(fn: () => T): { result: T; warnings: string[] } {
  const warnings: string[] = [];
  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    warnings.push(args.map((a) => String(a)).join(" "));
  };
  try {
    const result = fn();
    return { result, warnings };
  } finally {
    console.warn = origWarn;
  }
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

function renderUser(set: string, file: string): string {
  const raw = JSON.parse(readFileSync(join(ROOT, set, file), "utf-8")) as {
    answers: Answer[];
    demographics?: DemographicSet | null;
  };
  const constitution = buildInnerConstitution(
    raw.answers,
    [],
    raw.demographics ?? null
  );
  return renderMirrorAsMarkdown({
    constitution,
    includeBeliefAnchor: false,
    answers: raw.answers,
    demographics: raw.demographics ?? null,
    generatedAt: new Date("2026-05-13T00:00:00Z"),
    renderMode: "user",
  });
}

async function runAudit(): Promise<void> {
  const results: AssertionResult[] = [];

  // ── 1. cohort-runs-quiet ───────────────────────────────────────────
  //   Rendering every cohort fixture in user mode must emit ZERO
  //   cache-miss warnings. The cache is primed for the cohort, so any
  //   miss during cohort runs is a regression signal.
  {
    const { warnings } = withWarnIntercept(() => {
      for (const fx of listFixtures()) {
        renderUser(fx.set, fx.file);
      }
      return null;
    });
    const missWarnings = warnings.filter((w) => w.includes("[cache-miss]"));
    results.push(
      missWarnings.length === 0
        ? {
            ok: true,
            assertion: "cohort-runs-quiet",
            detail: `0 cache-miss warnings across 24 cohort user-mode renders`,
          }
        : {
            ok: false,
            assertion: "cohort-runs-quiet",
            detail: `${missWarnings.length} miss warnings during cohort run: ${missWarnings.slice(0, 3).join(" || ")}`,
          }
    );
  }

  // ── 2. synthetic-prose-miss-emits-one-log ──────────────────────────
  //   A ProseRewriteInputs whose engineSectionBody doesn't match any
  //   cached fixture produces exactly ONE "[cache-miss]" warning.
  {
    const syntheticInputs: ProseRewriteInputs = {
      cardId: "lens",
      archetype: "jasonType",
      engineSectionBody:
        "### Lens — Eyes\n\n**SYNTHETIC NON-CACHED BODY for CC-CACHE-MISS-LOUDFAIL audit; cohort has nothing matching this string.**",
      reservedCanonLines: ["audit-synthetic-line-not-in-real-prose"],
    };
    const { result, warnings } = withWarnIntercept(() =>
      readCachedRewrite(syntheticInputs)
    );
    const missLogs = warnings.filter((w) => w.includes("[cache-miss]"));
    const fails: string[] = [];
    if (result !== null) fails.push(`return value should be null on miss, got: ${typeof result}`);
    if (missLogs.length !== 1) fails.push(`expected 1 miss log, got ${missLogs.length}`);
    const expectedKey = proseRewriteHash(syntheticInputs);
    if (missLogs.length === 1) {
      const log = missLogs[0];
      const jsonStart = log.indexOf("{");
      let payload: Record<string, unknown> | null = null;
      try {
        payload = JSON.parse(log.slice(jsonStart));
      } catch {
        fails.push("payload not JSON-parseable");
      }
      if (payload?.namespace !== "prose-rewrites")
        fails.push("missing namespace=prose-rewrites");
      if (payload?.section !== "lens") fails.push("missing section=lens");
      if (payload?.cacheKey !== expectedKey)
        fails.push("cacheKey != proseRewriteHash(inputs)");
      if (
        typeof payload?.fingerprint !== "string" ||
        !(payload.fingerprint as string).includes("SYNTHETIC NON-CACHED BODY")
      )
        fails.push("missing fingerprint of engine body in payload");
    }
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "synthetic-prose-miss-emits-one-log",
            detail: `synthetic prose-rewrite miss → 1 log with namespace/section/key/fingerprint`,
          }
        : {
            ok: false,
            assertion: "synthetic-prose-miss-emits-one-log",
            detail: fails.join("; "),
          }
    );
  }

  // ── 3. synthetic-keystone-miss-emits-one-log ───────────────────────
  //   Same contract for the Keystone cache.
  {
    const syntheticInputs: KeystoneRewriteInputs = {
      archetype: "jasonType",
      beliefText:
        "SYNTHETIC belief text not present in any cohort fixture; CC-CACHE-MISS-LOUDFAIL audit.",
      valueDomain: "truth",
      topCompassValueLabels: ["Synthetic", "Audit", "Only"],
      costSurfaceLabels: [],
      costSurfaceNoneSelected: false,
      correctionChannelLabels: [],
      correctionChannelNoneSelected: false,
      convictionTemperature: "unknown",
      epistemicPosture: "unknown",
    };
    const { result, warnings } = withWarnIntercept(() =>
      readCachedKeystoneRewrite(syntheticInputs)
    );
    const missLogs = warnings.filter((w) => w.includes("[cache-miss]"));
    const fails: string[] = [];
    if (result !== null) fails.push(`return value should be null on miss, got: ${typeof result}`);
    if (missLogs.length !== 1) fails.push(`expected 1 miss log, got ${missLogs.length}`);
    const expectedKey = keystoneRewriteHash(syntheticInputs);
    if (missLogs.length === 1) {
      const log = missLogs[0];
      const jsonStart = log.indexOf("{");
      let payload: Record<string, unknown> | null = null;
      try {
        payload = JSON.parse(log.slice(jsonStart));
      } catch {
        fails.push("payload not JSON-parseable");
      }
      if (payload?.namespace !== "keystone-rewrites")
        fails.push("missing namespace=keystone-rewrites");
      if (payload?.section !== "keystone")
        fails.push("missing section=keystone");
      if (payload?.cacheKey !== expectedKey)
        fails.push("cacheKey != keystoneRewriteHash(inputs)");
      if (
        typeof payload?.fingerprint !== "string" ||
        !(payload.fingerprint as string).includes("SYNTHETIC belief text")
      )
        fails.push("missing fingerprint of belief text in payload");
    }
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "synthetic-keystone-miss-emits-one-log",
            detail: `synthetic keystone miss → 1 log with namespace/section/key/fingerprint`,
          }
        : {
            ok: false,
            assertion: "synthetic-keystone-miss-emits-one-log",
            detail: fails.join("; "),
          }
    );
  }

  // ── 4. cohort-cache-hit-still-quiet ────────────────────────────────
  //   For a known-cohort input (Jason fixture engine body), the cache
  //   lookup returns a string AND emits zero warnings. Confirms the
  //   instrumentation didn't accidentally fire on hits.
  {
    const jasonRaw = JSON.parse(
      readFileSync(
        join(ROOT, "ocean", "07-jason-real-session.json"),
        "utf-8"
      )
    ) as { answers: Answer[]; demographics?: DemographicSet | null };
    const constitution = buildInnerConstitution(
      jasonRaw.answers,
      [],
      jasonRaw.demographics ?? null
    );
    // Render clinician mode to get the engine body for "lens", then
    // hash it against the cache.
    const clinMd = renderMirrorAsMarkdown({
      constitution,
      includeBeliefAnchor: false,
      answers: jasonRaw.answers,
      demographics: jasonRaw.demographics ?? null,
      generatedAt: new Date("2026-05-13T00:00:00Z"),
      renderMode: "clinician",
    });
    const lensIdx = clinMd.indexOf("### Lens — Eyes");
    const stopIdx = clinMd.slice(lensIdx + 5).search(/\n## |\n### /);
    const lensBody = clinMd
      .slice(lensIdx, lensIdx + 5 + stopIdx)
      .trimEnd();
    const inputs: ProseRewriteInputs = {
      cardId: "lens",
      archetype: "jasonType",
      engineSectionBody: lensBody,
      reservedCanonLines: [
        "visible, revisable, present-tense structure",
        "grounded, legible, and free",
        "the work is not to care less; it is to let love become sustainable enough to last",
        "the work is not to abandon what has endured; it is to let what has endured remain alive enough to update",
      ],
    };
    const { result, warnings } = withWarnIntercept(() =>
      readCachedRewrite(inputs)
    );
    const missLogs = warnings.filter((w) => w.includes("[cache-miss]"));
    const fails: string[] = [];
    if (typeof result !== "string")
      fails.push(`expected string return on hit, got: ${typeof result}`);
    if (missLogs.length !== 0)
      fails.push(`expected 0 miss logs on hit, got ${missLogs.length}`);
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "cohort-cache-hit-still-quiet",
            detail: `Jason Lens cache hit returns a string and emits 0 miss logs`,
          }
        : {
            ok: false,
            assertion: "cohort-cache-hit-still-quiet",
            detail: fails.join("; "),
          }
    );
  }

  // ── 5. return-value-contract-unchanged ─────────────────────────────
  //   Both lookup functions return null on miss (not undefined,
  //   throw, or empty string). Confirms the "no behavior change" rule.
  {
    const proseMiss = readCachedRewrite({
      cardId: "compass",
      archetype: "unmappedType",
      engineSectionBody: "NON-CACHED string for null-return verification.",
      reservedCanonLines: [],
    });
    const keystoneMiss = readCachedKeystoneRewrite({
      archetype: "unmappedType",
      beliefText: "NON-CACHED belief for null-return verification.",
      valueDomain: "unknown",
      topCompassValueLabels: [],
      costSurfaceLabels: [],
      costSurfaceNoneSelected: false,
      correctionChannelLabels: [],
      correctionChannelNoneSelected: false,
      convictionTemperature: "unknown",
      epistemicPosture: "unknown",
    });
    const fails: string[] = [];
    if (proseMiss !== null) fails.push(`prose miss returned ${proseMiss}, not null`);
    if (keystoneMiss !== null)
      fails.push(`keystone miss returned ${keystoneMiss}, not null`);
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "return-value-contract-unchanged",
            detail: `both lookups return null on miss (no behavior change)`,
          }
        : {
            ok: false,
            assertion: "return-value-contract-unchanged",
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
    `CC-CACHE-MISS-LOUDFAIL: ${passed}/${results.length} assertions passing.`
  );
  if (failed > 0) process.exit(1);
}

runAudit().catch((e) => {
  console.error(e);
  process.exit(1);
});
