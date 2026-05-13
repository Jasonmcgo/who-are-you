// CC-RELIGIOUS-REGISTER-RULES — vocabulary discipline audit.
//
// 8 assertions verifying the LLM prose layer's register discipline:
//   - module exports (BANNED_PHRASES, GOD_USAGE_RULE, ALLOWED_WITH_CARE, auditor)
//   - banned-phrase list completeness
//   - both LLM system prompts contain the wedding-readout anchor
//   - cohort prose passes banned-phrase audit
//   - bare "God" flags reported (warning, not hard-fail)
//   - KEEP-list vocabulary appears in cohort (sanity check)
//   - cache regeneration mtimes (transitional pre-regen pass)
//   - render layer is untouched
//
// Hand-rolled. Invocation: `npx tsx tests/audit/proseRegister.audit.ts`.

import { readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ALLOWED_WITH_CARE,
  auditProseForBannedPhrases,
  BANNED_PHRASES,
  GOD_USAGE_RULE,
} from "../../lib/proseRegister";
import { SYSTEM_PROMPT } from "../../lib/synthesis3Llm";
import { GRIP_SYSTEM_PROMPT } from "../../lib/gripTaxonomyLlm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "..");

const SYNTH_PROMPT_FILE = join(ROOT, "lib", "synthesis3Llm.ts");
const GRIP_PROMPT_FILE = join(ROOT, "lib", "gripTaxonomyLlm.ts");
const SYNTH_CACHE_FILE = join(ROOT, "lib", "cache", "synthesis3-paragraphs.json");
const GRIP_CACHE_FILE = join(ROOT, "lib", "cache", "grip-paragraphs.json");
const RENDER_MIRROR_FILE = join(ROOT, "lib", "renderMirror.ts");
const INNER_PAGE_FILE = join(
  ROOT,
  "app",
  "components",
  "InnerConstitutionPage.tsx"
);
const PROSE_REGISTER_MODULE = join(ROOT, "lib", "proseRegister.ts");

// CC ship time (per the prompt directive — used to verify cache files
// were regenerated as part of this CC). Set to the current run; the
// audit treats any mtime within the last 24 hours as a passing
// regeneration window.
const REGEN_WINDOW_HOURS = 24;

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

type CacheEntry = { paragraph: string; fixtureHint?: string };
type CacheFile = Record<string, CacheEntry>;

function loadCache(p: string): CacheFile {
  try {
    return JSON.parse(readFileSync(p, "utf-8")) as CacheFile;
  } catch {
    return {};
  }
}

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];

  // ── 1. prose-register-module-exists ─────────────────────────────────
  let moduleSource = "";
  try {
    moduleSource = readFileSync(PROSE_REGISTER_MODULE, "utf-8");
  } catch (e) {
    results.push({
      ok: false,
      assertion: "prose-register-module-exists",
      detail: `cannot read lib/proseRegister.ts: ${(e as Error).message}`,
    });
    return results;
  }
  const requiredExports = [
    "BANNED_PHRASES",
    "GOD_USAGE_RULE",
    "ALLOWED_WITH_CARE",
    "auditProseForBannedPhrases",
    "REGISTER_RULES_ANCHOR_BLOCK",
  ];
  const missingExports = requiredExports.filter(
    (s) => !new RegExp(`export\\s+(?:const|function)\\s+${s}\\b`).test(moduleSource)
  );
  results.push(
    missingExports.length === 0
      ? {
          ok: true,
          assertion: "prose-register-module-exists",
          detail: `all 5 required exports present`,
        }
      : {
          ok: false,
          assertion: "prose-register-module-exists",
          detail: `missing exports: ${missingExports.join(", ")}`,
        }
  );

  // ── 2. prose-register-banned-phrases-comprehensive ──────────────────
  // Spot-check that the BANNED_PHRASES array covers the canonical set.
  // Each phrase below must match at least one rule's pattern.
  const requiredBans = [
    "the Lord",
    "Lord Jesus",
    "Christ",
    "the Father",
    "the Bible",
    "Scripture",
    "Holy Spirit",
    "the Spirit",
    "spiritual warfare",
    "principalities and powers",
    "salvation",
    "born again",
    "sinful",
    "fallen nature",
    "original sin",
    "the elect",
    "covenant",
    "worship",
    "prayer",
    "It is written",
    "Beloved, ",
    "And we read in",
    "Christianity teaches",
  ];
  const banFails: string[] = [];
  for (const phrase of requiredBans) {
    const hit = BANNED_PHRASES.some((rule) => {
      const re = new RegExp(rule.pattern.source, rule.pattern.flags);
      return re.test(phrase);
    });
    if (!hit) banFails.push(phrase);
  }
  results.push(
    banFails.length === 0
      ? {
          ok: true,
          assertion: "prose-register-banned-phrases-comprehensive",
          detail: `${requiredBans.length} canonical phrases each match a banned-phrase rule (table size: ${BANNED_PHRASES.length})`,
        }
      : {
          ok: false,
          assertion: "prose-register-banned-phrases-comprehensive",
          detail: `not covered: ${banFails.join(", ")}`,
        }
  );

  // ── 3. prose-register-llm-prompts-anchor ────────────────────────────
  // Check the RENDERED prompt strings — the source files compose the
  // anchor via `${REGISTER_RULES_ANCHOR_BLOCK}` interpolation, so the
  // source itself doesn't contain the literal phrase. The audit verifies
  // the prompts that actually reach the API.
  const anchorMissing: string[] = [];
  if (!/wedding-readout test/i.test(SYSTEM_PROMPT)) {
    anchorMissing.push("synthesis3Llm.SYSTEM_PROMPT");
  }
  if (!/wedding-readout test/i.test(GRIP_SYSTEM_PROMPT)) {
    anchorMissing.push("gripTaxonomyLlm.GRIP_SYSTEM_PROMPT");
  }
  // Both source files must import the anchor block constant — confirms
  // the wiring isn't accidentally inlined or duplicated.
  const synthSrc = readFileSync(SYNTH_PROMPT_FILE, "utf-8");
  const gripSrc = readFileSync(GRIP_PROMPT_FILE, "utf-8");
  if (!/REGISTER_RULES_ANCHOR_BLOCK/.test(synthSrc)) {
    anchorMissing.push("synthesis3Llm.ts:REGISTER_RULES_ANCHOR_BLOCK import");
  }
  if (!/REGISTER_RULES_ANCHOR_BLOCK/.test(gripSrc)) {
    anchorMissing.push("gripTaxonomyLlm.ts:REGISTER_RULES_ANCHOR_BLOCK import");
  }
  results.push(
    anchorMissing.length === 0
      ? {
          ok: true,
          assertion: "prose-register-llm-prompts-anchor",
          detail: `register-rules block + import present in both prompt files`,
        }
      : {
          ok: false,
          assertion: "prose-register-llm-prompts-anchor",
          detail: `missing: ${anchorMissing.join(", ")}`,
        }
  );

  // ── 4. prose-register-cohort-banned-phrase-absence ──────────────────
  // HARD FAIL if any banned phrase fires in cached prose.
  const synthCache = loadCache(SYNTH_CACHE_FILE);
  const gripCache = loadCache(GRIP_CACHE_FILE);
  const violations: Array<{ source: string; key: string; hint?: string; phrase: string; reason: string }> = [];
  for (const [k, v] of Object.entries(synthCache)) {
    const result = auditProseForBannedPhrases(v.paragraph);
    for (const vio of result.violations) {
      violations.push({
        source: "synthesis3",
        key: k.slice(0, 40),
        hint: v.fixtureHint,
        phrase: vio.phrase,
        reason: vio.reason,
      });
    }
  }
  for (const [k, v] of Object.entries(gripCache)) {
    const result = auditProseForBannedPhrases(v.paragraph);
    for (const vio of result.violations) {
      violations.push({
        source: "grip",
        key: k.slice(0, 40),
        hint: v.fixtureHint,
        phrase: vio.phrase,
        reason: vio.reason,
      });
    }
  }
  results.push(
    violations.length === 0
      ? {
          ok: true,
          assertion: "prose-register-cohort-banned-phrase-absence",
          detail: `clean across ${Object.keys(synthCache).length + Object.keys(gripCache).length} cached paragraphs`,
        }
      : {
          ok: false,
          assertion: "prose-register-cohort-banned-phrase-absence",
          detail: violations
            .slice(0, 5)
            .map((v) => `${v.source}/${v.hint ?? v.key}: "${v.phrase}" (${v.reason})`)
            .join(" | "),
        }
  );

  // ── 5. prose-register-bare-god-flag ─────────────────────────────────
  // WARNING — not hard-fail. List flagged paragraphs for human review.
  const godFlags: Array<{ source: string; hint?: string; context: string }> = [];
  for (const [, v] of Object.entries(synthCache)) {
    const result = auditProseForBannedPhrases(v.paragraph);
    for (const f of result.godFlags) {
      godFlags.push({ source: "synthesis3", hint: v.fixtureHint, context: f.context });
    }
  }
  for (const [, v] of Object.entries(gripCache)) {
    const result = auditProseForBannedPhrases(v.paragraph);
    for (const f of result.godFlags) {
      godFlags.push({ source: "grip", hint: v.fixtureHint, context: f.context });
    }
  }
  // Always pass; surface flag count + samples in detail.
  results.push({
    ok: true,
    assertion: "prose-register-bare-god-flag",
    detail:
      godFlags.length === 0
        ? "no bare 'God' tokens in cached cohort"
        : `${godFlags.length} flag(s) for human review: ${godFlags.slice(0, 3).map((f) => `[${f.source}/${f.hint ?? "?"}] "${f.context}"`).join(" | ")}`,
  });

  // ── 6. prose-register-keep-list-non-empty-coverage ──────────────────
  // At least 5 of the KEEP-list terms must appear in cached cohort.
  const allProse = [
    ...Object.values(synthCache),
    ...Object.values(gripCache),
  ]
    .map((e) => e.paragraph)
    .join("\n");
  const seen = ALLOWED_WITH_CARE.filter((term) =>
    new RegExp(`\\b${term}\\b`, "i").test(allProse)
  );
  results.push(
    seen.length >= 5
      ? {
          ok: true,
          assertion: "prose-register-keep-list-non-empty-coverage",
          detail: `${seen.length}/${ALLOWED_WITH_CARE.length} KEEP terms surface in cohort: ${seen.slice(0, 8).join(", ")}${seen.length > 8 ? "…" : ""}`,
        }
      : {
          ok: false,
          assertion: "prose-register-keep-list-non-empty-coverage",
          detail: `only ${seen.length} KEEP terms in cohort; need ≥5`,
        }
  );

  // ── 7. prose-register-cache-regenerated ─────────────────────────────
  // Confirm both cache files were touched within the regeneration window.
  const now = Date.now();
  const windowMs = REGEN_WINDOW_HOURS * 3_600_000;
  const synthMtime = statSync(SYNTH_CACHE_FILE).mtimeMs;
  const gripMtime = statSync(GRIP_CACHE_FILE).mtimeMs;
  const synthFresh = now - synthMtime < windowMs;
  const gripFresh = now - gripMtime < windowMs;
  results.push(
    synthFresh && gripFresh
      ? {
          ok: true,
          assertion: "prose-register-cache-regenerated",
          detail: `both cache files updated within last ${REGEN_WINDOW_HOURS}h`,
        }
      : {
          ok: false,
          assertion: "prose-register-cache-regenerated",
          detail: `synth fresh=${synthFresh}, grip fresh=${gripFresh} (window=${REGEN_WINDOW_HOURS}h)`,
        }
  );

  // ── 8. prose-register-no-render-changes ─────────────────────────────
  const renderMirror = readFileSync(RENDER_MIRROR_FILE, "utf-8");
  const innerPage = readFileSync(INNER_PAGE_FILE, "utf-8");
  const renderFails: string[] = [];
  if (/proseRegister/.test(renderMirror)) {
    renderFails.push("renderMirror.ts references proseRegister");
  }
  if (/proseRegister/.test(innerPage)) {
    renderFails.push("InnerConstitutionPage.tsx references proseRegister");
  }
  if (/auditProseForBannedPhrases/.test(renderMirror)) {
    renderFails.push("renderMirror.ts references auditProseForBannedPhrases");
  }
  if (/auditProseForBannedPhrases/.test(innerPage)) {
    renderFails.push("InnerConstitutionPage.tsx references auditProseForBannedPhrases");
  }
  results.push(
    renderFails.length === 0
      ? {
          ok: true,
          assertion: "prose-register-no-render-changes",
          detail: "render layer untouched (no proseRegister references)",
        }
      : {
          ok: false,
          assertion: "prose-register-no-render-changes",
          detail: renderFails.join(" | "),
        }
  );

  // Diagnostic — non-failing.
  console.log(`\nGOD_USAGE_RULE pattern: ${GOD_USAGE_RULE.pattern.source}`);
  console.log(`BANNED_PHRASES count: ${BANNED_PHRASES.length}`);
  console.log(
    `Cache sizes: synth3=${Object.keys(synthCache).length}, grip=${Object.keys(gripCache).length}`
  );

  return results;
}

function main(): number {
  console.log("CC-RELIGIOUS-REGISTER-RULES — vocabulary discipline audit");
  console.log("===========================================================");
  const results = runAudit();
  let failures = 0;
  for (const r of results) {
    const status = r.ok ? "PASS" : "FAIL";
    const detail = r.detail ? ` — ${r.detail}` : "";
    console.log(`[${status}] ${r.assertion}${detail}`);
    if (!r.ok) failures++;
  }
  console.log("");
  if (failures > 0) {
    console.error(`AUDIT FAILED — ${failures} assertion failure(s).`);
    return 1;
  }
  console.log("AUDIT PASSED — all CC-RELIGIOUS-REGISTER-RULES assertions green.");
  return 0;
}

process.exit(main());
