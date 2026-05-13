// CC-KEYSTONE-USER-MODE-UNCONDITIONAL audit — verifies the three-tier
// resolution contract for user-mode Keystone:
//
//   Tier A — committed-cache hit (cohort fixture).
//   Tier B — runtime-cache hit (CC-LIVE-SESSION-LLM-WIRING populated it
//            on-demand). Simulated here via writeRuntimeKeystoneRewrite.
//   Tier C — both caches miss → deterministic plain-prose fallback.
//
// Every tier in user mode must satisfy Rule 1 absolutely: no field-list
// bullets after the belief quote, no "Unsure" literal, no engine
// valueOpener signature ("with X as the value most directly at risk for
// it"), no "Likely value:" / "Wording temperature:" / "to revision:"
// patterns. The verbatim belief quote opens every tier.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import { renderMirrorAsMarkdown } from "../../lib/renderMirror";
import {
  COMPASS_LABEL,
  getTopCompassValues,
} from "../../lib/identityEngine";
import {
  summarizeQI2Selections,
  summarizeQI3Selections,
} from "../../lib/beliefHeuristics";
import {
  readCachedKeystoneRewrite,
  writeRuntimeKeystoneRewrite,
  _clearRuntimeKeystoneCacheForTests,
  type KeystoneRewriteInputs,
} from "../../lib/keystoneRewriteLlm";
import type {
  Answer,
  BeliefUnderTension,
  DemographicSet,
  InnerConstitution,
} from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");

const CANONICAL_FIXTURES = [
  { id: "Jason", set: "ocean", file: "07-jason-real-session.json" },
  { id: "Cindy", set: "goal-soul-give", file: "01-generative.json" },
  { id: "Daniel", set: "ocean", file: "24-si-precedent-keeper.json" },
];

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

function loadConstitution(set: string, file: string): {
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

function renderUser(
  constitution: InnerConstitution,
  answers: Answer[],
  demographics: DemographicSet | null
): string {
  return renderMirrorAsMarkdown({
    constitution,
    includeBeliefAnchor: false,
    answers,
    demographics,
    generatedAt: new Date("2026-05-13T00:00:00Z"),
    renderMode: "user",
  });
}

function renderClinician(
  constitution: InnerConstitution,
  answers: Answer[],
  demographics: DemographicSet | null
): string {
  return renderMirrorAsMarkdown({
    constitution,
    includeBeliefAnchor: false,
    answers,
    demographics,
    generatedAt: new Date("2026-05-13T00:00:00Z"),
    renderMode: "clinician",
  });
}

function extractKeystone(md: string): string | null {
  const idx = md.indexOf("## Keystone Reflection");
  if (idx < 0) return null;
  const end = md.indexOf("\n## ", idx + 30);
  return md.slice(idx, end < 0 ? undefined : end);
}

function buildKeystoneInputs(
  constitution: InnerConstitution,
  answers: Answer[]
): KeystoneRewriteInputs | null {
  const belief = constitution.belief_under_tension;
  if (!belief) return null;
  const topCompassValueLabels = getTopCompassValues(constitution.signals)
    .map((r) => COMPASS_LABEL[r.signal_id] ?? r.signal_id)
    .filter((s) => s.length > 0);
  const qi2 = summarizeQI2Selections(answers);
  const qi3 = summarizeQI3Selections(answers);
  return {
    archetype: constitution.profileArchetype?.primary ?? "unmappedType",
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
}

/** Structural checks that must hold for EVERY user-mode Keystone tier. */
function userModeStructuralCheck(section: string): string[] {
  const fails: string[] = [];
  // Belief blockquote present (line starting with "> ").
  if (!/^\s*> .+/m.test(section)) fails.push("no verbatim belief blockquote");
  // Strip the section header + lead-in italic to focus on body.
  const headerStripped = section
    .split(/\r?\n/)
    .filter(
      (l) =>
        !/^## Keystone Reflection/.test(l) &&
        !/^\*the belief you named/.test(l)
    )
    .join("\n");
  // Rule 1.1 — no bullet matching `- **<label>:**` in user mode.
  const bulletMatch = headerStripped.match(/^- \*\*[^*]+:\*\*/m);
  if (bulletMatch) fails.push(`field-list bullet present: "${bulletMatch[0]}"`);
  // Rule 1.2 — no "Unsure" literal in user mode.
  if (/\bUnsure\b/.test(headerStripped)) fails.push('"Unsure" literal present');
  // Rule 1.3 — no engine valueOpener signature.
  if (/as the value most directly at risk for it/.test(headerStripped))
    fails.push('engine valueOpener signature ("as the value most directly at risk for it") present');
  // Rule 1.4 — no "Likely value:" / "Wording temperature:" / "to revision:" literal sub-patterns.
  if (/Likely value:/.test(headerStripped))
    fails.push('"Likely value:" present');
  if (/Wording temperature:/.test(headerStripped))
    fails.push('"Wording temperature:" present');
  if (/to revision:/.test(headerStripped)) fails.push('"to revision:" present');
  return fails;
}

async function runAudit(): Promise<void> {
  const results: AssertionResult[] = [];

  // Precompute per-fixture renders + cache state for the three tiers.
  type FixtureRender = {
    id: string;
    inputs: KeystoneRewriteInputs;
    cohortUserMd: string;
    syntheticUserMd: string;
    syntheticRuntimeUserMd: string;
    cohortClinicianMd: string;
    syntheticConstitution: InnerConstitution;
    syntheticAnswers: Answer[];
    syntheticDemographics: DemographicSet | null;
  };
  const renders: FixtureRender[] = [];

  for (const fx of CANONICAL_FIXTURES) {
    _clearRuntimeKeystoneCacheForTests();
    const { constitution, answers, demographics } = loadConstitution(
      fx.set,
      fx.file
    );
    const inputs = buildKeystoneInputs(constitution, answers);
    if (!inputs) continue;

    // Tier A render — cohort fixture, committed cache hit expected.
    const cohortUserMd = renderUser(constitution, answers, demographics);
    const cohortClinicianMd = renderClinician(constitution, answers, demographics);

    // Build a synthetic-belief-text constitution so the committed cache
    // misses (the cache is keyed on beliefText + engine inputs).
    const syntheticBelief: BeliefUnderTension = {
      ...(constitution.belief_under_tension as BeliefUnderTension),
      belief_text: `SYNTHETIC belief for ${fx.id} (CC-KEYSTONE-USER-MODE-UNCONDITIONAL audit) — not in cohort cache.`,
    };
    const syntheticConstitution: InnerConstitution = {
      ...constitution,
      belief_under_tension: syntheticBelief,
    };
    const syntheticInputs: KeystoneRewriteInputs = {
      ...inputs,
      beliefText: syntheticBelief.belief_text,
    };

    // Tier C render — synthetic input + clean runtime cache → deterministic
    // fallback path.
    _clearRuntimeKeystoneCacheForTests();
    const syntheticUserMd = renderUser(
      syntheticConstitution,
      answers,
      demographics
    );

    // Tier B render — write a synthetic LLM rewrite to runtime cache
    // (simulating CC-LIVE-SESSION-LLM-WIRING success) → render now picks
    // up the runtime cache.
    _clearRuntimeKeystoneCacheForTests();
    const tierBPayload = `> ${syntheticBelief.belief_text}\n\nMOCK TIER-B LLM rewrite for ${fx.id} — this prose comes from the on-demand runtime cache, not the committed cohort cache.`;
    writeRuntimeKeystoneRewrite(syntheticInputs, tierBPayload);
    const syntheticRuntimeUserMd = renderUser(
      syntheticConstitution,
      answers,
      demographics
    );

    renders.push({
      id: fx.id,
      inputs,
      cohortUserMd,
      syntheticUserMd,
      syntheticRuntimeUserMd,
      cohortClinicianMd,
      syntheticConstitution,
      syntheticAnswers: answers,
      syntheticDemographics: demographics,
    });
  }
  _clearRuntimeKeystoneCacheForTests();

  // ── 1. tier-a-committed-cache-hits ─────────────────────────────────
  //   Cohort fixture user-mode Keystone contains the committed-cache
  //   LLM rewrite (verified by passing the structural check AND
  //   containing the actual cached text).
  {
    const fails: string[] = [];
    for (const r of renders) {
      const section = extractKeystone(r.cohortUserMd);
      if (!section) {
        fails.push(`${r.id}: no Keystone section`);
        continue;
      }
      const structuralFails = userModeStructuralCheck(section);
      if (structuralFails.length > 0)
        fails.push(`${r.id}: ${structuralFails.join("; ")}`);
      // Verify the cached LLM rewrite text appears in the rendered section.
      const cached = readCachedKeystoneRewrite(r.inputs);
      if (!cached) {
        fails.push(`${r.id}: committed cache miss (expected hit for cohort fixture)`);
        continue;
      }
      if (!section.includes(cached.trim().slice(0, 80))) {
        fails.push(`${r.id}: cached rewrite text not present in render`);
      }
    }
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "tier-a-committed-cache-hits",
            detail: `Jason/Cindy/Daniel cohort fixtures render their committed-cache LLM rewrite + pass structural check`,
          }
        : {
            ok: false,
            assertion: "tier-a-committed-cache-hits",
            detail: fails.join(" || "),
          }
    );
  }

  // ── 2. tier-b-runtime-cache-hits ───────────────────────────────────
  //   Synthetic input with a runtime-cache-staged rewrite renders the
  //   runtime rewrite (proves the CC-LIVE-SESSION-LLM-WIRING handoff
  //   works end-to-end through the keystone branch).
  {
    const fails: string[] = [];
    for (const r of renders) {
      const section = extractKeystone(r.syntheticRuntimeUserMd);
      if (!section) {
        fails.push(`${r.id}: no Keystone section`);
        continue;
      }
      const structuralFails = userModeStructuralCheck(section);
      if (structuralFails.length > 0)
        fails.push(`${r.id}: ${structuralFails.join("; ")}`);
      if (!section.includes("MOCK TIER-B LLM rewrite")) {
        fails.push(`${r.id}: runtime-cache rewrite NOT present in render`);
      }
    }
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "tier-b-runtime-cache-hits",
            detail: `runtime-cache rewrite served + structural check passes across canonical fixtures`,
          }
        : {
            ok: false,
            assertion: "tier-b-runtime-cache-hits",
            detail: fails.join(" || "),
          }
    );
  }

  // ── 3. tier-c-deterministic-fallback ───────────────────────────────
  //   Synthetic input + empty runtime cache → render falls through to
  //   composeKeystoneFallback. The verbatim quote appears + value
  //   cluster sentence + cost-surface sentence. Structural check holds.
  {
    const fails: string[] = [];
    for (const r of renders) {
      const section = extractKeystone(r.syntheticUserMd);
      if (!section) {
        fails.push(`${r.id}: no Keystone section`);
        continue;
      }
      const structuralFails = userModeStructuralCheck(section);
      if (structuralFails.length > 0)
        fails.push(`${r.id}: ${structuralFails.join("; ")}`);
      // Verify verbatim synthetic-belief text appears.
      const expectedBelief = `SYNTHETIC belief for ${r.id}`;
      if (!section.includes(expectedBelief)) {
        fails.push(`${r.id}: synthetic verbatim quote missing`);
      }
      // Value cluster sentence MUST mention at least one of the labels.
      const compassLabels = r.inputs.topCompassValueLabels;
      const hasValueLabel = compassLabels.some((l) => section.includes(l));
      if (compassLabels.length > 0 && !hasValueLabel) {
        fails.push(
          `${r.id}: Tier C output missing any value-cluster label (${compassLabels.slice(0, 3).join(", ")})`
        );
      }
    }
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "tier-c-deterministic-fallback",
            detail: `synthetic non-cached inputs render the deterministic fallback with verbatim quote + value cluster + structural check`,
          }
        : {
            ok: false,
            assertion: "tier-c-deterministic-fallback",
            detail: fails.join(" || "),
          }
    );
  }

  // ── 4. all-tiers-structurally-clean ────────────────────────────────
  //   Cross-tier sweep: every tier of every canonical fixture passes
  //   the absolute structural check.
  {
    const fails: string[] = [];
    for (const r of renders) {
      const tierARes = userModeStructuralCheck(
        extractKeystone(r.cohortUserMd) ?? ""
      );
      const tierBRes = userModeStructuralCheck(
        extractKeystone(r.syntheticRuntimeUserMd) ?? ""
      );
      const tierCRes = userModeStructuralCheck(
        extractKeystone(r.syntheticUserMd) ?? ""
      );
      if (tierARes.length) fails.push(`${r.id}/A: ${tierARes.join("; ")}`);
      if (tierBRes.length) fails.push(`${r.id}/B: ${tierBRes.join("; ")}`);
      if (tierCRes.length) fails.push(`${r.id}/C: ${tierCRes.join("; ")}`);
    }
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "all-tiers-structurally-clean",
            detail: `Jason/Cindy/Daniel × {A,B,C} = 9 tier renders, all pass structural check`,
          }
        : {
            ok: false,
            assertion: "all-tiers-structurally-clean",
            detail: fails.join(" || "),
          }
    );
  }

  // ── 5. cohort-21-fixture-no-leak ───────────────────────────────────
  //   Run user-mode render across every fixture with a belief; assert
  //   structural check passes for all. Covers the full Keystone cohort.
  {
    const fails: string[] = [];
    _clearRuntimeKeystoneCacheForTests();
    let withBelief = 0;
    for (const set of ["ocean", "goal-soul-give"]) {
      const dir = join(ROOT, set);
      if (!existsSync(dir)) continue;
      for (const f of readdirSync(dir)
        .filter((x) => x.endsWith(".json"))
        .sort()) {
        const { constitution, answers, demographics } = loadConstitution(set, f);
        if (!constitution.belief_under_tension?.belief_text) continue;
        withBelief++;
        const u = renderUser(constitution, answers, demographics);
        const section = extractKeystone(u);
        if (!section) {
          fails.push(`${set}/${f}: no Keystone section`);
          continue;
        }
        const structuralFails = userModeStructuralCheck(section);
        if (structuralFails.length > 0) {
          fails.push(`${set}/${f}: ${structuralFails.join("; ")}`);
        }
      }
    }
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "cohort-21-fixture-no-leak",
            detail: `${withBelief} cohort fixtures with belief: all user-mode Keystones structurally clean`,
          }
        : {
            ok: false,
            assertion: "cohort-21-fixture-no-leak",
            detail: `${fails.length} fixtures leak: ${fails.slice(0, 4).join(" || ")}`,
          }
    );
  }

  // ── 6. clinician-mode-byte-identity ────────────────────────────────
  //   Clinician mode for every cohort fixture STILL contains the
  //   full field-list metadata bullets + engine valueOpener signature.
  //   This is the audit/debug reversibility floor.
  {
    const fails: string[] = [];
    _clearRuntimeKeystoneCacheForTests();
    for (const set of ["ocean", "goal-soul-give"]) {
      const dir = join(ROOT, set);
      if (!existsSync(dir)) continue;
      for (const f of readdirSync(dir)
        .filter((x) => x.endsWith(".json"))
        .sort()) {
        const { constitution, answers, demographics } = loadConstitution(set, f);
        if (!constitution.belief_under_tension?.belief_text) continue;
        const cl = renderClinician(constitution, answers, demographics);
        const section = extractKeystone(cl);
        if (!section) {
          fails.push(`${set}/${f}: no Keystone in clinician`);
          continue;
        }
        const missing: string[] = [];
        if (!section.includes("- **Likely value:**")) missing.push("Likely value");
        if (!section.includes("- **Wording temperature:**"))
          missing.push("Wording temperature");
        if (!section.includes("- **Openness to revision:**"))
          missing.push("Openness to revision");
        // valueOpener signature must still appear in clinician.
        // (Either the known-domain phrasing or unknown fallback.)
        const valueOpener =
          section.includes("as the value most directly at risk for it") ||
          /This belief sits inside .+, not outside them\./.test(section);
        if (!valueOpener) missing.push("engine valueOpener prose");
        if (missing.length > 0) {
          fails.push(`${set}/${f}: missing ${missing.join(", ")}`);
        }
      }
    }
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "clinician-mode-byte-identity",
            detail: `clinician mode retains all 3 metadata bullets + engine valueOpener across cohort`,
          }
        : {
            ok: false,
            assertion: "clinician-mode-byte-identity",
            detail: `${fails.length} fixtures missing clinician content: ${fails.slice(0, 3).join(" || ")}`,
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
    `CC-KEYSTONE-USER-MODE-UNCONDITIONAL: ${passed}/${results.length} assertions passing.`
  );
  if (failed > 0) process.exit(1);
}

runAudit().catch((e) => {
  console.error(e);
  process.exit(1);
});
