// CC-188 — Typing Hydration audit.
//
// Verifies the hydrated function shape (magnitudes + axis range + within-
// axis breadth + shapeLabel + shapeEvidence), the two killed Ni-Te
// attractors, the principled Fi-Se discriminator, the satisficing guard,
// and the documented Connor/Brian dominant-selection debt.
//
// Owner decision (2026-07-03): the JDrew fixture's real answers do NOT
// support Fi-Se (Q-T judging splits Fi/Fe 2–2, perceiving is a 4-way tie;
// cross-signal Fe 85 / Si 70 / Se 40 / Fi 35). A principled discriminator
// therefore must NOT flip him to Fi-Se — forcing it would be the name
// hardcode the CC forbids. His honest outcome is low-discrimination /
// low-confidence, which assertion 7 checks. Nat is already Fi-Se (CC-183).
//
// Invoke: npx tsx tests/audit/typingHydration.audit.ts

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  aggregateLensStack,
  applyFiSeSameAttitudeCorrection,
  computeFunctionShape,
} from "../../lib/jungianStack";
import { buildInnerConstitution } from "../../lib/identityEngine";
import { inferDriverFromCrossSignals } from "../../lib/crossSignalDriverInference";
import type {
  Answer,
  CognitiveFunctionId,
  DemographicSet,
  LensStack,
  Signal,
} from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COHORT = join(__dirname, "..", "fixtures", "cohort-real");

interface AssertionResult {
  ok: boolean;
  assertion: string;
  detail: string;
  skipped?: boolean;
}

const ALL_FN: CognitiveFunctionId[] = ["ni", "ne", "si", "se", "ti", "te", "fi", "fe"];

function loadFixture(
  name: string
): { answers: Answer[]; demographics: DemographicSet | null } | null {
  const p = join(COHORT, name);
  if (!existsSync(p)) return null;
  const raw = JSON.parse(readFileSync(p, "utf-8")) as {
    answers?: Answer[];
    demographics?: DemographicSet | null;
  };
  if (!raw.answers) return null;
  return { answers: raw.answers, demographics: raw.demographics ?? null };
}

function stackFor(name: string): LensStack | null {
  const fx = loadFixture(name);
  if (!fx) return null;
  // demographics passed as null (cohort-real fixtures store a flat shape
  // deriveLifeStageGate rejects; demographics has zero derivation impact).
  return buildInnerConstitution(fx.answers, [], null).lens_stack;
}

function scoresSignal(fn: CognitiveFunctionId, rank: number): Signal {
  return {
    signal_id: fn,
    description: fn,
    from_card: "temperament",
    source_question_ids: ["Q-T-synthetic"],
    strength: "high",
    rank,
  };
}

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];
  const push = (ok: boolean, assertion: string, detail: string, skipped = false) =>
    results.push({ ok, assertion, detail, skipped });

  const cohortFiles = readdirSync(COHORT)
    .filter((f) => f.endsWith(".json"))
    .sort();

  // ── 1. hydration-shape-present ────────────────────────────────────
  {
    const bad: string[] = [];
    for (const f of cohortFiles) {
      const fx = loadFixture(f);
      if (!fx) continue;
      const ls = buildInnerConstitution(fx.answers, [], null).lens_stack;
      const fm = ls.functionMagnitudes;
      const keysOk =
        fm !== undefined &&
        ALL_FN.every(
          (fn) => typeof fm[fn] === "number" && fm[fn] >= 0 && fm[fn] <= 100
        );
      const labelOk =
        typeof ls.shapeLabel === "string" &&
        ls.shapeLabel.length > 0 &&
        ls.shapeLabel !== ls.mbtiCode;
      if (!keysOk || !labelOk) bad.push(`${f}(keys=${keysOk},label=${labelOk})`);
    }
    push(
      bad.length === 0,
      "hydration-shape-present",
      bad.length === 0
        ? `all ${cohortFiles.length} cohort fixtures carry 8 functionMagnitudes (0–100) + a non-empty shapeLabel ≠ mbtiCode`
        : `missing shape on: ${bad.join(", ")}`
    );
  }

  // ── 2. hydration-jason-clean-not-broad ────────────────────────────
  {
    const ls = stackFor("jason-real.json");
    if (!ls) {
      push(false, "hydration-jason-clean-not-broad", "jason-real.json missing");
    } else {
      const am = ls.axisMagnitude!;
      const wb = ls.withinAxisBroad!;
      const fm = ls.functionMagnitudes!;
      const ok =
        am.intuition >= 60 &&
        am.thinking >= 60 &&
        wb.intuitionBroad === false &&
        wb.thinkingBroad === false &&
        fm.ni - fm.ne >= 15 &&
        fm.te - fm.ti >= 15 &&
        ls.dominant === "ni" &&
        ls.mbtiCode === "INTJ" &&
        /Ni-Te/.test(ls.shapeLabel ?? "") &&
        /axis range/.test(ls.shapeLabel ?? "");
      push(
        ok,
        "hydration-jason-clean-not-broad",
        `axN=${am.intuition} axT=${am.thinking} iBroad=${wb.intuitionBroad} tBroad=${wb.thinkingBroad} ni=${fm.ni} ne=${fm.ne} te=${fm.te} ti=${fm.ti} dom=${ls.dominant} mbti=${ls.mbtiCode} label="${ls.shapeLabel}"`
      );
    }
  }

  // ── 3. hydration-anti-bleed (unit on computeFunctionShape) ─────────
  {
    const baseStack: LensStack = {
      dominant: "ni", auxiliary: "te", tertiary: "fi", inferior: "se",
      mbtiCode: "INTJ", confidence: "high",
    };
    // High N + high T with CLEAN discriminators → Ne/Ti must NOT inflate,
    // and neither axis reads broad.
    const clean = computeFunctionShape(baseStack, {
      ni: 82, ne: 24, si: 18, se: 12, ti: 20, te: 86, fi: 10, fe: 14,
    });
    const cleanOk =
      clean.functionMagnitudes.ne <= 35 &&
      clean.functionMagnitudes.ti <= 35 &&
      clean.withinAxisBroad.intuitionBroad === false &&
      clean.withinAxisBroad.thinkingBroad === false;
    // Genuinely even Ni/Ne → intuitionBroad = true.
    const even = computeFunctionShape(baseStack, {
      ni: 74, ne: 71, si: 18, se: 12, ti: 20, te: 40, fi: 10, fe: 14,
    });
    const evenOk = even.withinAxisBroad.intuitionBroad === true;
    push(
      cleanOk && evenOk,
      "hydration-anti-bleed",
      `clean: ne=${clean.functionMagnitudes.ne} ti=${clean.functionMagnitudes.ti} iBroad=${clean.withinAxisBroad.intuitionBroad} tBroad=${clean.withinAxisBroad.thinkingBroad}; even: iBroad=${even.withinAxisBroad.intuitionBroad}`
    );
  }

  // ── 4. breadth-not-inflation (Jason keeps ni/te; Ne/Ti not elevated)
  {
    const ls = stackFor("jason-real.json");
    if (!ls) {
      push(false, "breadth-not-inflation", "jason-real.json missing");
    } else {
      const fm = ls.functionMagnitudes!;
      const ok =
        ls.dominant === "ni" &&
        ls.auxiliary === "te" &&
        fm.ne < fm.ni &&
        fm.ti < fm.te &&
        fm.ne <= 55 &&
        fm.ti <= 45;
      push(
        ok,
        "breadth-not-inflation",
        `dom/aux=${ls.dominant}/${ls.auxiliary} ni=${fm.ni} ne=${fm.ne} te=${fm.te} ti=${fm.ti} (Ne/Ti not elevated into the stack)`
      );
    }
  }

  // ── 5. attractor-no-nite-default ──────────────────────────────────
  {
    // Empty/degenerate signal → must NOT default to the Ni-Te architect
    // stack; must hedge unresolved-shape and never publish a confident INTJ.
    const empty = aggregateLensStack([]);
    const notNiTe = !(empty.dominant === "ni" && empty.auxiliary === "te");
    const unresolved =
      (empty.confidenceLowReasons ?? []).includes("unresolved-shape") ||
      empty.mbtiCode === "UNRESOLVED";
    const notConfidentIntj = empty.mbtiCode !== "INTJ";
    push(
      notNiTe && unresolved && notConfidentIntj,
      "attractor-no-nite-default",
      `empty → dom=${empty.dominant} aux=${empty.auxiliary} mbti=${empty.mbtiCode} reasons=${(empty.confidenceLowReasons ?? []).join(",")}`
    );
  }

  // ── 6. attractor-nat-fi-se ────────────────────────────────────────
  {
    const ls = stackFor("nat-real.json");
    if (!ls) {
      push(false, "attractor-nat-fi-se", "nat-real.json missing");
    } else {
      const ok = ls.dominant === "fi" && ls.auxiliary === "se";
      push(
        ok,
        "attractor-nat-fi-se",
        `Nat → dom=${ls.dominant} aux=${ls.auxiliary} mbti=${ls.mbtiCode} (expected fi/se ISFP, NOT Si-Fe/Ni-Fe)`
      );
    }
  }

  // ── 6b. fi-se-discriminator-principled (unit on the post-pass) ─────
  {
    const recoveredISFJ: LensStack = {
      dominant: "si", auxiliary: "fe", tertiary: "ti", inferior: "ne",
      mbtiCode: "ISFJ", confidence: "low",
      confidenceLowReasons: ["binary-same-attitude-leaders-resolved"],
    };
    // Supportive cross-signal (Se ≥ Si, Fi not below Fe) → flip to Fi-Se.
    const flipped = applyFiSeSameAttitudeCorrection(recoveredISFJ, [], {
      ni: 0, ne: 0, si: 40, se: 55, ti: 0, te: 0, fi: 52, fe: 40,
    });
    const flipOk =
      flipped.dominant === "fi" &&
      flipped.auxiliary === "se" &&
      flipped.mbtiCode === "ISFP";
    // Si clearly dominant in cross-signal → must NOT flip (stays ISFJ).
    const held = applyFiSeSameAttitudeCorrection(recoveredISFJ, [], {
      ni: 0, ne: 0, si: 82, se: 28, ti: 0, te: 0, fi: 38, fe: 62,
    });
    const holdOk = held.dominant === "si" && held.mbtiCode === "ISFJ";
    // Without the recovery marker it must be a no-op (gate 1).
    const noMarker: LensStack = { ...recoveredISFJ, confidenceLowReasons: ["aux-ambiguous"] };
    const noMarkerHeld = applyFiSeSameAttitudeCorrection(noMarker, [], {
      ni: 0, ne: 0, si: 40, se: 55, ti: 0, te: 0, fi: 52, fe: 40,
    });
    const gateOk = noMarkerHeld.dominant === "si";
    push(
      flipOk && holdOk && gateOk,
      "fi-se-discriminator-principled",
      `supportive→${flipped.mbtiCode} (want ISFP); Si-dominant→${held.mbtiCode} (want ISFJ); no-marker→${noMarkerHeld.dominant} (want si)`
    );
  }

  // ── 6c. fi-se-lift-block ──────────────────────────────────────────
  //    A Fi-Se-corrected binary typing is still structurally inconsistent
  //    (both leaders shared attitude). Its dominant now equals the
  //    cross-signal driver, which would satisfy the CC-097B lift's
  //    `inferredDriver === dominant` gate — so the recovery marker MUST
  //    be in the lift blocklist or the lift could harden it to `high`,
  //    breaking the correction's own "confidence stays low" invariant.
  {
    const enginePath = join(__dirname, "..", "..", "lib", "identityEngine.ts");
    const src = readFileSync(enginePath, "utf-8");
    const m = src.match(/blockingReasons[^=]*=\s*\[([\s\S]*?)\];/);
    const body = m?.[1] ?? "";
    const ok = /"binary-same-attitude-leaders-resolved"/.test(body);
    push(
      ok,
      "fi-se-lift-block",
      ok
        ? "CC-097B lift blocklist includes binary-same-attitude-leaders-resolved (a corrected Fi-Se typing cannot be hardened to high)"
        : "blocklist MISSING binary-same-attitude-leaders-resolved — a corrected Fi-Se typing could be wrongly lifted to high"
    );
  }

  // ── 7. attractor-jdrew-honest-low-confidence ──────────────────────
  //    Owner decision: JDrew's real answers do not support Fi-Se, so the
  //    principled discriminator does NOT flip him. Honest outcome =
  //    low-discrimination / low-confidence (NOT a forced fi/se hardcode).
  {
    const ls = stackFor("jdrew-real.json");
    if (!ls) {
      push(true, "attractor-jdrew-honest-low-confidence", "jdrew-real.json absent — skipped", true);
    } else {
      const reasons = ls.confidenceLowReasons ?? [];
      const ok =
        ls.confidence === "low" &&
        reasons.includes("low-discrimination") &&
        // NOT force-flipped to a hardcoded Fi dominant.
        ls.dominant !== "fi";
      push(
        ok,
        "attractor-jdrew-honest-low-confidence",
        `JDrew → dom=${ls.dominant} conf=${ls.confidence} reasons=${reasons.join(",")} (honest low-discrimination hedge; not a Fi-Se hardcode)`
      );
    }
  }

  // ── 8. dominant-selection-debt-connor-brian ───────────────────────
  //    Documents the current (wrong) published dominant vs. the cross-
  //    signal-inferred driver; guards against silent regression. Fix is
  //    deferred to CC-189. If a future change moves either dominant, this
  //    fails loudly (a reminder to reconcile with CC-189).
  {
    const debtRows: string[] = [];
    let allDoc = true;
    const cases: Array<{ file: string; dom: CognitiveFunctionId; drv: CognitiveFunctionId }> = [
      { file: "connor-real.json", dom: "ti", drv: "ne" },
      { file: "brian-real.json", dom: "ni", drv: "te" },
    ];
    for (const c of cases) {
      const fx = loadFixture(c.file);
      if (!fx) { debtRows.push(`${c.file}:MISSING`); allDoc = false; continue; }
      const con = buildInnerConstitution(fx.answers, [], null);
      const inferred = inferDriverFromCrossSignals(con).inferredDriver;
      const documented =
        con.lens_stack.dominant === c.dom && // still the wrong published dominant
        inferred === c.drv && // cross-signal still evidences the suppressed driver
        inferred !== con.lens_stack.dominant; // and it's a real mismatch
      if (!documented) allDoc = false;
      debtRows.push(
        `${c.file.replace("-real.json", "")}: published=${con.lens_stack.dominant} inferred=${inferred} (debt: ${c.drv})`
      );
    }
    push(
      allDoc,
      "dominant-selection-debt-connor-brian",
      `${debtRows.join(" | ")} — documented dominant-selection debt (deferred to CC-189, not fixed here)`
    );
  }

  // ── 9. promotion-not-implemented ──────────────────────────────────
  {
    const expect: Record<string, CognitiveFunctionId> = {
      "jason-real.json": "ni",
      "daniel-real.json": "si",
      "cindy-real.json": "se",
      "ashley-real.json": "ni",
    };
    const bad: string[] = [];
    for (const [file, dom] of Object.entries(expect)) {
      const ls = stackFor(file);
      if (!ls) { bad.push(`${file}:MISSING`); continue; }
      if (ls.dominant !== dom) bad.push(`${file}:${ls.dominant}!=${dom}`);
    }
    push(
      bad.length === 0,
      "promotion-not-implemented",
      bad.length === 0
        ? "Jason/Daniel/Cindy/Ashley dominants unchanged (ni/si/se/ni) — no promotion mechanism shipped"
        : `moved: ${bad.join(", ")}`
    );
  }

  // ── 10. satisficing-flat-guard ────────────────────────────────────
  {
    // Real anchor: JDrew's flat data raises low-discrimination (checked in
    // 7). Synthetic anchor: a judging pool tied on rank-1 with a near-flat
    // full distribution must raise low-discrimination and stay low, with
    // no perceiving signal to crown a confident dominant.
    const flatSignals: Signal[] = [
      // judging pool tied on rank-1 (fi/fe/ti/te each once) + even rank-2
      // spread → this is the flat pool AND the dominant pool.
      scoresSignal("fi", 1), scoresSignal("fe", 1), scoresSignal("ti", 1), scoresSignal("te", 1),
      scoresSignal("fe", 2), scoresSignal("fi", 2), scoresSignal("te", 2), scoresSignal("ti", 2),
      // perceiving pool: no rank-1 (weak rank-3s) so JUDGING wins the
      // cross-pool selection and its internal tie drives the guard.
      scoresSignal("se", 3), scoresSignal("si", 3),
    ];
    const flat = aggregateLensStack(flatSignals);
    const jdrew = stackFor("jdrew-real.json");
    const jdrewFlat =
      jdrew !== null && (jdrew.confidenceLowReasons ?? []).includes("low-discrimination");
    const syntheticFlat =
      (flat.confidenceLowReasons ?? []).includes("low-discrimination") &&
      flat.confidence === "low";
    push(
      syntheticFlat && (jdrew === null || jdrewFlat),
      "satisficing-flat-guard",
      `synthetic flat → reasons=${(flat.confidenceLowReasons ?? []).join(",")} conf=${flat.confidence}; jdrew low-discrimination=${jdrew === null ? "n/a" : jdrewFlat}`
    );
  }

  // ── 11. mbti-demoted-retained ─────────────────────────────────────
  {
    const bad: string[] = [];
    for (const f of cohortFiles) {
      const fx = loadFixture(f);
      if (!fx) continue;
      const ls = buildInnerConstitution(fx.answers, [], null).lens_stack;
      const mbtiOk = typeof ls.mbtiCode === "string" && ls.mbtiCode.length > 0;
      const tupleOk = ([ls.dominant, ls.auxiliary, ls.tertiary, ls.inferior] as string[]).every(
        (fn) => (ALL_FN as string[]).includes(fn)
      );
      if (!mbtiOk || !tupleOk) bad.push(`${f}(mbti=${mbtiOk},tuple=${tupleOk})`);
    }
    push(
      bad.length === 0,
      "mbti-demoted-retained",
      bad.length === 0
        ? `mbtiCode retained + 4-tuple intact on all ${cohortFiles.length} fixtures (MBTI demoted, not removed)`
        : `broken: ${bad.join(", ")}`
    );
  }

  return results;
}

const results = runAudit();
const passed = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok).length;
const skipped = results.filter((r) => r.skipped).length;
console.log("CC-188 — Typing Hydration audit");
console.log("=".repeat(68));
for (const r of results) {
  const tag = r.skipped ? "[SKIP]" : r.ok ? "[PASS]" : "[FAIL]";
  console.log(`${tag} ${r.assertion}  — ${r.detail}`);
}
console.log("");
console.log(`CC-188 hydration: ${passed}/${results.length} passing${skipped ? ` (${skipped} skipped)` : ""}.`);
if (failed > 0) process.exit(1);
