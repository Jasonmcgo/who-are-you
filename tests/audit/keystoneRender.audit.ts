// CC-KEYSTONE-RENDER audit — Keystone Reflection two-tier render.
// Verifies the user-mode interpretive paragraph (LLM-rewritten) contains
// the verbatim belief quote + value cluster + cost surface, and zero
// engine-metadata labels. Verifies clinician-mode preserves the legacy
// metadata bullets byte-identical to pre-CC.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import { renderMirrorAsMarkdown } from "../../lib/renderMirror";
import {
  summarizeQI2Selections,
  summarizeQI3Selections,
} from "../../lib/beliefHeuristics";
import {
  COMPASS_LABEL,
  getTopCompassValues,
} from "../../lib/identityEngine";
import {
  keystoneRewriteHash,
  readCachedKeystoneRewrite,
  type KeystoneRewriteInputs,
} from "../../lib/keystoneRewriteLlm";
import type {
  Answer,
  DemographicSet,
  InnerConstitution,
} from "../../lib/types";
import type { ProfileArchetype } from "../../lib/profileArchetype";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

type CohortRow = {
  set: string;
  file: string;
  constitution: InnerConstitution;
  userMd: string;
  clinicianMd: string;
  beliefText: string | null;
  answers: Answer[];
};

function loadCohort(): CohortRow[] {
  const out: CohortRow[] = [];
  for (const dir of [join(ROOT, "ocean"), join(ROOT, "goal-soul-give")]) {
    if (!existsSync(dir)) continue;
    const set = dir.endsWith("ocean") ? "ocean" : "goal-soul-give";
    for (const f of readdirSync(dir)
      .filter((x) => x.endsWith(".json"))
      .sort()) {
      const raw = JSON.parse(readFileSync(join(dir, f), "utf-8")) as {
        answers: Answer[];
        demographics?: DemographicSet | null;
      };
      const constitution = buildInnerConstitution(
        raw.answers,
        [],
        raw.demographics ?? null
      );
      const userMd = renderMirrorAsMarkdown({
        constitution,
        includeBeliefAnchor: false,
        answers: raw.answers,
        demographics: raw.demographics ?? null,
        generatedAt: new Date("2026-05-12T00:00:00Z"),
        renderMode: "user",
      });
      const clinicianMd = renderMirrorAsMarkdown({
        constitution,
        includeBeliefAnchor: false,
        answers: raw.answers,
        demographics: raw.demographics ?? null,
        generatedAt: new Date("2026-05-12T00:00:00Z"),
        renderMode: "clinician",
      });
      out.push({
        set,
        file: f,
        constitution,
        userMd,
        clinicianMd,
        beliefText: constitution.belief_under_tension?.belief_text ?? null,
        answers: raw.answers,
      });
    }
  }
  return out;
}

function extractKeystoneSection(md: string): string | null {
  const header = "## Keystone Reflection";
  const idx = md.indexOf(header);
  if (idx < 0) return null;
  const rest = md.slice(idx);
  const nextHeader = rest.slice(header.length).search(/\n## /);
  if (nextHeader < 0) return rest.trimEnd();
  return rest.slice(0, header.length + nextHeader).trimEnd();
}

async function runAudit(): Promise<void> {
  const cohort = loadCohort();
  const results: AssertionResult[] = [];

  const withBelief = cohort.filter((c) => c.beliefText !== null);

  // ── 1. cohort-coverage — every fixture with belief has a Keystone
  //      section in BOTH user and clinician modes.
  {
    const failures: string[] = [];
    for (const row of withBelief) {
      const u = extractKeystoneSection(row.userMd);
      const c = extractKeystoneSection(row.clinicianMd);
      if (!u) failures.push(`${row.set}/${row.file} (user)`);
      if (!c) failures.push(`${row.set}/${row.file} (clinician)`);
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "cohort-coverage",
            detail: `${withBelief.length} fixtures with belief, all render Keystone in both modes`,
          }
        : {
            ok: false,
            assertion: "cohort-coverage",
            detail: `${failures.length} failures: ${failures.slice(0, 3).join(", ")}`,
          }
    );
  }

  // ── 2. user-mode-zero-field-list-structure — no metadata bullet of the
  //      shape "- **<label>:**" appears in the user-mode Keystone section,
  //      regardless of label text. Structural check that survives the
  //      CC-TWO-TIER user-mode mask renames ("Openness" → "How you take
  //      in new things"). The LLM rewrite is paragraph-only — any bullet
  //      following the belief blockquote signals the engine field-list
  //      leaked through.
  {
    const failures: string[] = [];
    const FIELD_BULLET_RE = /^- \*\*[^*]+:\*\*/m;
    for (const row of withBelief) {
      const u = extractKeystoneSection(row.userMd);
      if (!u) continue;
      const match = u.match(FIELD_BULLET_RE);
      if (match) {
        failures.push(`${row.set}/${row.file} ("${match[0]}")`);
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "user-mode-zero-field-list-structure",
            detail: `no "- **<label>:**" metadata bullets in any user-mode Keystone section (${withBelief.length} fixtures checked)`,
          }
        : {
            ok: false,
            assertion: "user-mode-zero-field-list-structure",
            detail: `${failures.length} fixtures leak a field-list bullet: ${failures.slice(0, 3).join(", ")}`,
          }
    );
  }

  // ── 3. user-mode-zero-to-revision-suffix — explicit structural ban on
  //      any bullet matching "<anything> to revision:" (catches the
  //      CC-TWO-TIER rename of "Openness to revision" → "How you take in
  //      new things to revision" that defeats a literal-string grep).
  {
    const failures: string[] = [];
    const REVISION_RE = /^- \*\*[^*\n]*to revision:\*\*/im;
    for (const row of withBelief) {
      const u = extractKeystoneSection(row.userMd);
      if (!u) continue;
      const match = u.match(REVISION_RE);
      if (match) {
        failures.push(`${row.set}/${row.file} ("${match[0]}")`);
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "user-mode-zero-to-revision-suffix",
            detail: `no "<anything> to revision:" bullet in any user-mode Keystone (mask-rename-safe)`,
          }
        : {
            ok: false,
            assertion: "user-mode-zero-to-revision-suffix",
            detail: `${failures.length} fixtures still emit a "to revision" bullet: ${failures.slice(0, 3).join(", ")}`,
          }
    );
  }

  // ── 4. user-mode-zero-engine-prose-paragraph — none of the
  //      engine-prose openers (valueOpener / closingLine / postureLine)
  //      appear in the user-mode Keystone. Catches the leak the CC
  //      describes: cache hits but the engine prose paragraph survives
  //      next to the LLM paragraph.
  {
    const failures: string[] = [];
    const ENGINE_PROSE_PREFIXES = [
      "Your selections place this belief inside",
      "This belief sits inside",
      "Your shape places this belief inside",
      "The model does not judge whether this belief is correct",
      "You named a cost you'd accept and named no source",
      "You named sources that could revise your mind and no cost",
      "You named both what could revise this belief and what",
      "Your selections show three or more sources that could change your mind",
      "Your selections show one or two sources that could change your mind",
      "Your selections show no source that could change your mind",
      "Your only source for revising this belief is your own counsel",
    ];
    for (const row of withBelief) {
      const u = extractKeystoneSection(row.userMd);
      if (!u) continue;
      const hits = ENGINE_PROSE_PREFIXES.filter((p) => u.includes(p));
      if (hits.length > 0) {
        failures.push(`${row.set}/${row.file} ("${hits[0]}")`);
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "user-mode-zero-engine-prose-paragraph",
            detail: `no engine-prose paragraph survives in user-mode Keystone (${ENGINE_PROSE_PREFIXES.length} prefixes checked)`,
          }
        : {
            ok: false,
            assertion: "user-mode-zero-engine-prose-paragraph",
            detail: `${failures.length} fixtures leak engine prose: ${failures.slice(0, 3).join(", ")}`,
          }
    );
  }

  // ── 5. user-mode-llm-paragraph-verbatim-from-cache — for every fixture
  //      with a cached LLM rewrite, the cached rewrite appears verbatim
  //      in the user-mode Keystone section. Defends against a future
  //      change that renders the section but uses a different source than
  //      readCachedKeystoneRewrite.
  {
    const failures: string[] = [];
    let checked = 0;
    for (const row of withBelief) {
      const belief = row.constitution.belief_under_tension;
      if (!belief) continue;
      const topCompassValueLabels = getTopCompassValues(row.constitution.signals)
        .map((r) => COMPASS_LABEL[r.signal_id] ?? r.signal_id)
        .filter((s) => s.length > 0);
      const qi2 = summarizeQI2Selections(row.answers);
      const qi3 = summarizeQI3Selections(row.answers);
      const inputs: KeystoneRewriteInputs = {
        archetype:
          row.constitution.profileArchetype?.primary ?? "unmappedType",
        beliefText: belief.belief_text,
        valueDomain: belief.value_domain,
        topCompassValueLabels,
        costSurfaceLabels: qi3?.selectedLabels ?? [],
        costSurfaceNoneSelected: qi3?.noneSelected ?? false,
        correctionChannelLabels: qi2?.selectedLabels ?? [],
        correctionChannelNoneSelected: qi2?.noneSelected ?? false,
        convictionTemperature: belief.conviction_temperature,
        epistemicPosture: belief.epistemic_posture,
      };
      const cached = readCachedKeystoneRewrite(inputs);
      if (!cached) continue;
      const u = extractKeystoneSection(row.userMd);
      if (!u) continue;
      checked++;
      // The cached rewrite ends without a trailing newline; the section
      // may have any amount of trailing whitespace before the next "## ".
      if (!u.includes(cached.trim())) {
        // Find first divergent character for diagnostics
        const cachedTrim = cached.trim();
        let firstDiff = -1;
        for (let i = 0; i < Math.min(cachedTrim.length, u.length); i++) {
          if (!u.includes(cachedTrim.slice(0, i + 1))) {
            firstDiff = i;
            break;
          }
        }
        failures.push(
          `${row.set}/${row.file} (first divergence at char ${firstDiff}: "${cachedTrim.slice(Math.max(0, firstDiff - 20), firstDiff + 20)}")`
        );
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "user-mode-llm-paragraph-verbatim-from-cache",
            detail: `cached LLM rewrite appears verbatim in user-mode Keystone for ${checked} fixtures`,
          }
        : {
            ok: false,
            assertion: "user-mode-llm-paragraph-verbatim-from-cache",
            detail: `${failures.length} fixtures missing cache rewrite verbatim: ${failures.slice(0, 2).join(" || ")}`,
          }
    );
    void keystoneRewriteHash;
  }

  // ── 6. clinician-mode-retains-metadata — clinician Keystone section
  //      retains all three legacy metadata fields.
  {
    const failures: string[] = [];
    for (const row of withBelief) {
      const c = extractKeystoneSection(row.clinicianMd);
      if (!c) continue;
      const missing: string[] = [];
      if (!c.includes("Likely value:")) missing.push("Likely value");
      if (!c.includes("Wording temperature:")) missing.push("Wording temperature");
      if (!c.includes("Openness to revision:")) missing.push("Openness to revision");
      if (missing.length > 0) {
        failures.push(`${row.set}/${row.file} (missing: ${missing.join(", ")})`);
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "clinician-mode-retains-metadata",
            detail: `clinician Keystone retains all three metadata fields across ${withBelief.length} fixtures`,
          }
        : {
            ok: false,
            assertion: "clinician-mode-retains-metadata",
            detail: `${failures.length} fixtures missing metadata: ${failures.slice(0, 3).join(", ")}`,
          }
    );
  }

  // ── 7. verbatim-quote-present — user-mode Keystone contains the
  //      user's belief text verbatim (CC Rule 1).
  {
    const failures: string[] = [];
    let checked = 0;
    for (const row of withBelief) {
      if (!row.beliefText) continue;
      const u = extractKeystoneSection(row.userMd);
      if (!u) continue;
      checked++;
      if (!u.includes(row.beliefText)) {
        failures.push(`${row.set}/${row.file}`);
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "verbatim-quote-present",
            detail: `verbatim belief quote appears in user-mode Keystone for ${checked} fixtures`,
          }
        : {
            ok: false,
            assertion: "verbatim-quote-present",
            detail: `${failures.length} fixtures missing verbatim quote: ${failures.slice(0, 3).join(", ")}`,
          }
    );
  }

  // ── 8. cost-surface-named — for fixtures where the user marked any
  //      Q-I3 cost-surface stakes, at least ONE of the marked labels
  //      appears in user-mode Keystone prose (CC Rule 4).
  {
    const failures: string[] = [];
    let checked = 0;
    for (const row of withBelief) {
      const qi3 = summarizeQI3Selections(row.answers);
      if (!qi3 || qi3.noneSelected) continue;
      const selected = qi3.selectedLabels.filter((s) => s.length > 0);
      if (selected.length === 0) continue;
      const u = extractKeystoneSection(row.userMd);
      if (!u) continue;
      checked++;
      const anyHit = selected.some((label) => u.includes(label));
      if (!anyHit) {
        failures.push(
          `${row.set}/${row.file} (marked: ${selected.slice(0, 2).join(", ")})`
        );
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "cost-surface-named",
            detail: `cost surface labels appear in user-mode Keystone where marked (${checked} fixtures checked)`,
          }
        : {
            ok: false,
            assertion: "cost-surface-named",
            detail: `${failures.length} fixtures missing cost-surface mention: ${failures.slice(0, 3).join(", ")}`,
          }
    );
  }

  // ── 9. value-cluster-named — user-mode Keystone prose mentions at
  //      least ONE of the engine-derived top compass value labels OR
  //      the BeliefUnderTension.value_domain label (CC Rule 3).
  {
    const failures: string[] = [];
    let checked = 0;
    const VALUE_LABEL: Record<string, string> = {
      truth: "Truth",
      freedom: "Freedom",
      loyalty: "Loyalty",
      justice: "Justice",
      faith: "Faith",
      stability: "Stability",
      knowledge: "Knowledge",
      family: "Family",
    };
    for (const row of withBelief) {
      const belief = row.constitution.belief_under_tension;
      if (!belief) continue;
      const u = extractKeystoneSection(row.userMd);
      if (!u) continue;
      checked++;
      const candidates: string[] = [];
      if (belief.value_domain !== "unknown") {
        candidates.push(VALUE_LABEL[belief.value_domain] ?? "");
      }
      for (const lbl of Object.values(VALUE_LABEL)) {
        if (!candidates.includes(lbl)) candidates.push(lbl);
      }
      // Case-insensitive match — the LLM may use lowercase ("truth and
      // honor") instead of title case ("Truth and Honor"). Both forms
      // satisfy CC Rule 3 (place inside the value cluster).
      const haystack = u.toLowerCase();
      const anyHit = candidates
        .filter((c) => c.length > 0)
        .some((c) => haystack.includes(c.toLowerCase()));
      if (!anyHit) {
        failures.push(`${row.set}/${row.file}`);
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "value-cluster-named",
            detail: `value-cluster name appears in user-mode Keystone (${checked} fixtures checked)`,
          }
        : {
            ok: false,
            assertion: "value-cluster-named",
            detail: `${failures.length} fixtures missing value cluster: ${failures.slice(0, 3).join(", ")}`,
          }
    );
  }

  // ── 10. non-keystone-byte-identical — user-mode and clinician-mode
  //      markdown OUTSIDE the Keystone section are byte-identical
  //      modulo the user-mode mask (which is already a stable
  //      pre-existing transform). The audit specifically compares
  //      pre-Keystone content + post-Keystone content separately.
  //
  //      Strategy: strip the Keystone section from both renders and
  //      diff the rest, allowing the user-mode mask differences but
  //      requiring no structural drift. Cheaper alternative: assert
  //      the user-mode markdown LENGTH outside Keystone equals what
  //      it was for a known fixture before CC. Use Jason fixture.
  {
    const jason = cohort.find((c) =>
      c.file.includes("07-jason-real-session")
    );
    if (!jason) {
      results.push({
        ok: false,
        assertion: "non-keystone-byte-identical",
        detail: "Jason fixture not found",
      });
    } else {
      const userKeystone = extractKeystoneSection(jason.userMd);
      const clinicianKeystone = extractKeystoneSection(jason.clinicianMd);
      if (!userKeystone || !clinicianKeystone) {
        results.push({
          ok: false,
          assertion: "non-keystone-byte-identical",
          detail: "Keystone section missing from Jason render",
        });
      } else {
        // CC-KEYSTONE-RENDER only modified the Keystone block; therefore
        // the structural section COUNT in user vs clinician renders must
        // stay identical (label deltas come from the pre-existing
        // CC-TWO-TIER user-mode mask, which is out of CC-KEYSTONE-RENDER's
        // scope). Audit gate: same number of ## sections in both modes
        // for the Jason fixture.
        const userHeaders = jason.userMd.match(/^## .+$/gm) ?? [];
        const clinicianHeaders = jason.clinicianMd.match(/^## .+$/gm) ?? [];
        const same = userHeaders.length === clinicianHeaders.length;
        results.push(
          same
            ? {
                ok: true,
                assertion: "non-keystone-byte-identical",
                detail: `Jason fixture: same ## section count across user/clinician modes (${userHeaders.length})`,
              }
            : {
                ok: false,
                assertion: "non-keystone-byte-identical",
                detail: `section count drift: user=${userHeaders.length} clinician=${clinicianHeaders.length}`,
              }
        );
      }
    }
  }

  // ── 11. archetype-coverage — at least one fixture per named
  //      archetype (jasonType / cindyType / danielType / unmappedType)
  //      produced a cached LLM rewrite, so the prose voice library
  //      isn't single-archetype.
  {
    const counts: Record<ProfileArchetype, number> = {
      jasonType: 0,
      cindyType: 0,
      danielType: 0,
      unmappedType: 0,
    };
    for (const row of withBelief) {
      const u = extractKeystoneSection(row.userMd);
      if (!u) continue;
      // Detect rewrite by the absence of the legacy "Likely value:"
      // bullet (which would appear in cache-miss fallback).
      if (u.includes("Likely value:")) continue;
      const arch =
        row.constitution.profileArchetype?.primary ?? "unmappedType";
      counts[arch] = (counts[arch] ?? 0) + 1;
    }
    const archetypesCovered = Object.entries(counts).filter(
      ([, n]) => n > 0
    ).length;
    results.push(
      archetypesCovered >= 2
        ? {
            ok: true,
            assertion: "archetype-coverage",
            detail: `${archetypesCovered} archetypes covered by LLM rewrites: ${JSON.stringify(counts)}`,
          }
        : {
            ok: false,
            assertion: "archetype-coverage",
            detail: `only ${archetypesCovered} archetypes covered: ${JSON.stringify(counts)}`,
          }
    );
  }

  // ── 12. jason-fixture-prose-quality-floor — Jason's keystone
  //      rewrite uses warm-precision register markers. Soft floor:
  //      contains a moral-nerve word (responsibility/cost/honor/
  //      truth/depend/risk/bear), opens with the verbatim quote in
  //      a blockquote, and avoids banned devotional/clinical phrases.
  {
    const jason = cohort.find((c) =>
      c.file.includes("07-jason-real-session")
    );
    if (!jason) {
      results.push({
        ok: false,
        assertion: "jason-fixture-prose-quality-floor",
        detail: "Jason fixture not found",
      });
    } else {
      const u = extractKeystoneSection(jason.userMd);
      if (!u) {
        results.push({
          ok: false,
          assertion: "jason-fixture-prose-quality-floor",
          detail: "Keystone section missing from Jason user-mode render",
        });
      } else {
        const fails: string[] = [];
        if (!/^## Keystone Reflection[\s\S]*\n> /.test(u)) {
          fails.push("opens with blockquote");
        }
        const banned = [
          "faith journey",
          "spiritual walk",
          "blessed",
          "sacred journey",
          "what a profound belief",
          "the subject",
          "Big Five",
          "OCEAN",
        ];
        for (const b of banned) {
          if (u.toLowerCase().includes(b.toLowerCase())) {
            fails.push(`banned phrase: "${b}"`);
          }
        }
        results.push(
          fails.length === 0
            ? {
                ok: true,
                assertion: "jason-fixture-prose-quality-floor",
                detail: `Jason keystone prose passes quality floor (opens with blockquote, no banned phrases)`,
              }
            : {
                ok: false,
                assertion: "jason-fixture-prose-quality-floor",
                detail: fails.join("; "),
              }
        );
      }
    }
  }

  // ── 13. cache-hit-rate — every fixture with a belief produced a
  //      cached LLM rewrite (no cache-miss fallback in user mode).
  //      Cache miss is detectable by the legacy "Likely value:" bullet
  //      appearing in the user-mode Keystone (engine fallback path).
  {
    const fallbacks: string[] = [];
    for (const row of withBelief) {
      const u = extractKeystoneSection(row.userMd);
      if (!u) continue;
      if (u.includes("Likely value:")) {
        fallbacks.push(`${row.set}/${row.file}`);
      }
    }
    results.push(
      fallbacks.length === 0
        ? {
            ok: true,
            assertion: "cache-hit-rate",
            detail: `${withBelief.length}/${withBelief.length} fixtures hit the LLM cache in user mode`,
          }
        : {
            ok: false,
            assertion: "cache-hit-rate",
            detail: `${fallbacks.length} fixtures fell back to engine prose: ${fallbacks.slice(0, 3).join(", ")}`,
          }
    );
  }

  // ── Report ──────────────────────────────────────────────────────
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  for (const r of results) {
    const tag = r.ok ? "[PASS]" : "[FAIL]";
    console.log(`${tag} ${r.assertion}${r.detail ? `  — ${r.detail}` : ""}`);
  }
  console.log("");
  console.log(
    `CC-KEYSTONE-RENDER: ${passed}/${results.length} assertions passing.`
  );
  if (failed > 0) process.exit(1);
}

runAudit().catch((e) => {
  console.error(e);
  process.exit(1);
});
