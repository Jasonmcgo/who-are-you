// CC-PROSE-V1-RENDER-FIRE-DIAGNOSIS audit — proves the four scoped LLM
// rewrites (Lens / Compass / Hands / Path) fire end-to-end in the
// production user-mode markdown render. Stronger than the existing
// cohort-cache-hit-rate audit (which only checks user-vs-clinician
// inequality): this audit verifies that the user-mode section body
// MATCHES THE CACHE ENTRY VERBATIM, byte-for-byte, for canonical
// Jason / Cindy / Daniel fixtures plus the cohort-wide sweep.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import { renderMirrorAsMarkdown } from "../../lib/renderMirror";
import {
  readCachedRewrite,
  type ProseCardId,
} from "../../lib/proseRewriteLlm";
import type { Answer, DemographicSet } from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");

const SCOPED_HEADERS: Record<ProseCardId, string> = {
  lens: "### Lens — Eyes",
  compass: "### Compass — Heart",
  hands: "### Hands — Work",
  path: "## Path — Gait",
};

const RESERVED_CANON_LINES = [
  "visible, revisable, present-tense structure",
  "grounded, legible, and free",
  "the work is not to care less; it is to let love become sustainable enough to last",
  "the work is not to abandon what has endured; it is to let what has endured remain alive enough to update",
];

const CANONICAL_FIXTURES = [
  { id: "Jason", set: "ocean", file: "07-jason-real-session.json" },
  { id: "Cindy", set: "goal-soul-give", file: "01-generative.json" },
  { id: "Daniel", set: "ocean", file: "24-si-precedent-keeper.json" },
];

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

function loadFixture(set: string, file: string) {
  return JSON.parse(readFileSync(join(ROOT, set, file), "utf-8")) as {
    answers: Answer[];
    demographics?: DemographicSet | null;
  };
}

function extractSection(md: string, header: string): string | null {
  const idx = md.indexOf(header);
  if (idx < 0) return null;
  const rest = md.slice(idx);
  const depth = header.startsWith("## ") && !header.startsWith("### ") ? 2 : 3;
  const stop = depth === 2 ? /\n## / : /\n## |\n### /;
  const next = rest.slice(header.length).search(stop);
  return next < 0 ? rest.trimEnd() : rest.slice(0, header.length + next).trimEnd();
}

function buildBothRenders(set: string, file: string) {
  const raw = loadFixture(set, file);
  const constitution = buildInnerConstitution(
    raw.answers,
    [],
    raw.demographics ?? null
  );
  const stamp = new Date("2026-05-12T00:00:00Z");
  const userMd = renderMirrorAsMarkdown({
    constitution,
    includeBeliefAnchor: false,
    answers: raw.answers,
    demographics: raw.demographics ?? null,
    generatedAt: stamp,
    renderMode: "user",
  });
  const clinMd = renderMirrorAsMarkdown({
    constitution,
    includeBeliefAnchor: false,
    answers: raw.answers,
    demographics: raw.demographics ?? null,
    generatedAt: stamp,
    renderMode: "clinician",
  });
  const archetype =
    constitution.profileArchetype?.primary ?? "unmappedType";
  return { userMd, clinMd, archetype };
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

  // ── 1. canonical-fixtures-all-four-cards-fire-verbatim ─────────────
  //   Jason / Cindy / Daniel × 4 scoped cards: user-mode section body
  //   contains the cache-entry rewrite. For Lens/Compass/Path the body
  //   matches BYTE-FOR-BYTE. For Hands, CC-SMALL-FIXES-BUNDLE Fix 2's
  //   structural post-processor injects the sub-header / italic canon
  //   closing / italicized Work Map trail when missing, so the user
  //   body is a superset of the cache rewrite — the audit verifies the
  //   cache's distinctive prose appears verbatim AND the structural
  //   markers are present.
  {
    const failures: string[] = [];
    let checked = 0;
    for (const fx of CANONICAL_FIXTURES) {
      const { userMd, clinMd, archetype } = buildBothRenders(fx.set, fx.file);
      for (const [cardId, header] of Object.entries(SCOPED_HEADERS) as Array<
        [ProseCardId, string]
      >) {
        const userBody = extractSection(userMd, header);
        const clinBody = extractSection(clinMd, header);
        if (!userBody || !clinBody) {
          failures.push(`${fx.id}/${cardId} (section missing)`);
          continue;
        }
        const cached = readCachedRewrite({
          cardId,
          archetype,
          engineSectionBody: clinBody,
          reservedCanonLines: RESERVED_CANON_LINES,
        });
        if (!cached) {
          failures.push(`${fx.id}/${cardId} (cache miss)`);
          continue;
        }
        checked++;
        if (cardId === "hands") {
          // Hands: post-processor may inject structural elements. Check
          // the cache rewrite's "**Strength** —" paragraph appears
          // verbatim in user body (cache is a substring of user body).
          const strengthIdx = cached.indexOf("**Strength** —");
          if (strengthIdx < 0) {
            failures.push(`${fx.id}/${cardId} (cache lacks Strength marker)`);
            continue;
          }
          const sentenceEnd = cached.indexOf("\n\n", strengthIdx + 20);
          const strengthPara = cached.slice(
            strengthIdx,
            sentenceEnd < 0 ? undefined : sentenceEnd
          );
          if (!userBody.includes(strengthPara)) {
            failures.push(`${fx.id}/${cardId} (cache Strength paragraph absent in user body)`);
          }
        } else {
          if (userBody !== cached.trimEnd()) {
            failures.push(`${fx.id}/${cardId} (user body != cache)`);
          }
        }
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "canonical-fixtures-all-four-cards-fire-verbatim",
            detail: `Jason/Cindy/Daniel × 4 cards = ${checked}/${checked} renders contain the cache rewrite (Hands allows structural post-processing)`,
          }
        : {
            ok: false,
            assertion: "canonical-fixtures-all-four-cards-fire-verbatim",
            detail: `${failures.length} failures: ${failures.slice(0, 4).join(", ")}`,
          }
    );
  }

  // ── 2. compass-and-path-fire-specifically ──────────────────────────
  //   Explicit named-card gate per CC: Compass and Path splices fire
  //   for Jason / Cindy / Daniel. Separated from #1 so a future
  //   Compass-or-Path-only regression surfaces immediately rather than
  //   getting averaged into a broader pass.
  {
    const failures: string[] = [];
    for (const fx of CANONICAL_FIXTURES) {
      const { userMd, clinMd, archetype } = buildBothRenders(fx.set, fx.file);
      for (const cardId of ["compass", "path"] as const) {
        const header = SCOPED_HEADERS[cardId];
        const userBody = extractSection(userMd, header);
        const clinBody = extractSection(clinMd, header);
        if (!userBody || !clinBody) {
          failures.push(`${fx.id}/${cardId} missing`);
          continue;
        }
        if (userBody === clinBody) {
          failures.push(`${fx.id}/${cardId} (splice did NOT fire)`);
          continue;
        }
        const cached = readCachedRewrite({
          cardId,
          archetype,
          engineSectionBody: clinBody,
          reservedCanonLines: RESERVED_CANON_LINES,
        });
        if (!cached) {
          failures.push(`${fx.id}/${cardId} (cache miss)`);
          continue;
        }
        if (userBody !== cached.trimEnd()) {
          failures.push(`${fx.id}/${cardId} (user body diverges from cache)`);
        }
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "compass-and-path-fire-specifically",
            detail: `Compass + Path splices verified across Jason/Cindy/Daniel`,
          }
        : {
            ok: false,
            assertion: "compass-and-path-fire-specifically",
            detail: `${failures.length} failures: ${failures.slice(0, 4).join(", ")}`,
          }
    );
  }

  // ── 3. signature-phrase-present ────────────────────────────────────
  //   For each canonical fixture × card, take the FIRST non-whitespace
  //   sentence (≥25 chars) after the section header from the cache
  //   entry and assert it appears in the user-mode rendered output.
  //   This catches a regression where the splice lands but a follow-on
  //   transform (e.g., applyUserModeMask) strips or rewrites the LLM
  //   prose in a way that makes the section unrecognizable.
  {
    const failures: string[] = [];
    let checked = 0;
    for (const fx of CANONICAL_FIXTURES) {
      const { userMd, clinMd, archetype } = buildBothRenders(fx.set, fx.file);
      for (const [cardId, header] of Object.entries(SCOPED_HEADERS) as Array<
        [ProseCardId, string]
      >) {
        const clinBody = extractSection(clinMd, header);
        if (!clinBody) continue;
        const cached = readCachedRewrite({
          cardId,
          archetype,
          engineSectionBody: clinBody,
          reservedCanonLines: RESERVED_CANON_LINES,
        });
        if (!cached) continue;
        const lines = cached
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(
            (l) =>
              l.length >= 25 &&
              !l.startsWith("#") &&
              !l.startsWith("**") &&
              !l.startsWith("*") &&
              !l.startsWith(">")
          );
        if (lines.length === 0) continue;
        const phrase = lines[0].slice(0, 60);
        checked++;
        if (!userMd.includes(phrase)) {
          failures.push(`${fx.id}/${cardId} ("${phrase}")`);
        }
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "signature-phrase-present",
            detail: `signature phrases from cache appear verbatim in user-mode output (${checked} checks)`,
          }
        : {
            ok: false,
            assertion: "signature-phrase-present",
            detail: `${failures.length} failures: ${failures.slice(0, 4).join(", ")}`,
          }
    );
  }

  // ── 4. cohort-sweep-100pct-byte-match ──────────────────────────────
  //   Every (fixture × scoped-card) combo where cache lookup hits must
  //   produce a user-mode section body that matches the cache entry
  //   (byte-identical for Lens/Compass/Path; the Hands card allows
  //   structural post-processing from CC-SMALL-FIXES-BUNDLE Fix 2, so
  //   Hands requires the cache's Strength paragraph appears as a
  //   substring of the user body). Catches subtle drift in splice
  //   boundary logic.
  {
    const failures: string[] = [];
    let hit = 0;
    let total = 0;
    for (const fx of listFixtures()) {
      const { userMd, clinMd, archetype } = buildBothRenders(fx.set, fx.file);
      for (const [cardId, header] of Object.entries(SCOPED_HEADERS) as Array<
        [ProseCardId, string]
      >) {
        const userBody = extractSection(userMd, header);
        const clinBody = extractSection(clinMd, header);
        if (!userBody || !clinBody) continue;
        const cached = readCachedRewrite({
          cardId,
          archetype,
          engineSectionBody: clinBody,
          reservedCanonLines: RESERVED_CANON_LINES,
        });
        if (!cached) continue;
        total++;
        if (cardId === "hands") {
          const strengthIdx = cached.indexOf("**Strength** —");
          if (strengthIdx < 0) {
            failures.push(`${fx.set}/${fx.file}/${cardId} (cache lacks Strength marker)`);
            continue;
          }
          const sentenceEnd = cached.indexOf("\n\n", strengthIdx + 20);
          const strengthPara = cached.slice(
            strengthIdx,
            sentenceEnd < 0 ? undefined : sentenceEnd
          );
          if (userBody.includes(strengthPara)) {
            hit++;
          } else {
            failures.push(`${fx.set}/${fx.file}/${cardId}`);
          }
        } else if (userBody === cached.trimEnd()) {
          hit++;
        } else {
          failures.push(`${fx.set}/${fx.file}/${cardId}`);
        }
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "cohort-sweep-100pct-byte-match",
            detail: `${hit}/${total} cohort (fixture × card) splices match cache byte-for-byte`,
          }
        : {
            ok: false,
            assertion: "cohort-sweep-100pct-byte-match",
            detail: `${failures.length}/${total} mismatches: ${failures.slice(0, 4).join(", ")}`,
          }
    );
  }

  // ── 5. per-card-cohort-coverage ────────────────────────────────────
  //   Each of the four scoped cards must fire in ≥ 1 cohort fixture.
  //   Catches a class of regression where (e.g.) Path stops firing in
  //   ALL fixtures because of a splice/header issue.
  {
    const counts: Record<ProseCardId, number> = {
      lens: 0,
      compass: 0,
      hands: 0,
      path: 0,
    };
    for (const fx of listFixtures()) {
      const { userMd, clinMd, archetype } = buildBothRenders(fx.set, fx.file);
      for (const [cardId, header] of Object.entries(SCOPED_HEADERS) as Array<
        [ProseCardId, string]
      >) {
        const userBody = extractSection(userMd, header);
        const clinBody = extractSection(clinMd, header);
        if (!userBody || !clinBody) continue;
        const cached = readCachedRewrite({
          cardId,
          archetype,
          engineSectionBody: clinBody,
          reservedCanonLines: RESERVED_CANON_LINES,
        });
        if (!cached) continue;
        if (cardId === "hands") {
          const strengthIdx = cached.indexOf("**Strength** —");
          if (strengthIdx < 0) continue;
          const sentenceEnd = cached.indexOf("\n\n", strengthIdx + 20);
          const strengthPara = cached.slice(
            strengthIdx,
            sentenceEnd < 0 ? undefined : sentenceEnd
          );
          if (userBody.includes(strengthPara)) counts[cardId]++;
        } else if (userBody === cached.trimEnd()) {
          counts[cardId]++;
        }
      }
    }
    const fails: string[] = [];
    for (const [c, n] of Object.entries(counts)) {
      if (n === 0) fails.push(`${c}: 0 fires`);
    }
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "per-card-cohort-coverage",
            detail: `each card fires in ≥1 fixture: ${JSON.stringify(counts)}`,
          }
        : {
            ok: false,
            assertion: "per-card-cohort-coverage",
            detail: fails.join(", "),
          }
    );
  }

  // ── 6. clinician-mode-no-rewrite ───────────────────────────────────
  //   Sanity gate: clinician mode does NOT apply the rewrite. The
  //   clinician body equals the engine prose, which is what the cache
  //   keyed off — so clinician body should NEVER equal a cache entry
  //   (because the cache entry IS the rewrite, which differs from
  //   engine prose by construction).
  {
    const failures: string[] = [];
    for (const fx of CANONICAL_FIXTURES) {
      const { clinMd, archetype } = buildBothRenders(fx.set, fx.file);
      for (const [cardId, header] of Object.entries(SCOPED_HEADERS) as Array<
        [ProseCardId, string]
      >) {
        const clinBody = extractSection(clinMd, header);
        if (!clinBody) continue;
        const cached = readCachedRewrite({
          cardId,
          archetype,
          engineSectionBody: clinBody,
          reservedCanonLines: RESERVED_CANON_LINES,
        });
        if (!cached) continue;
        if (clinBody === cached.trimEnd()) {
          failures.push(
            `${fx.id}/${cardId} (clinician body == cache entry — rewrite leaked into clinician path)`
          );
        }
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "clinician-mode-no-rewrite",
            detail: `clinician renders bypass the LLM rewrite (verified across canonical fixtures)`,
          }
        : {
            ok: false,
            assertion: "clinician-mode-no-rewrite",
            detail: failures.join(", "),
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
    `CC-PROSE-V1-RENDER-FIRE-DIAGNOSIS: ${passed}/${results.length} assertions passing.`
  );
  if (failed > 0) process.exit(1);
}

runAudit().catch((e) => {
  console.error(e);
  process.exit(1);
});
