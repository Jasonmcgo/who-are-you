// CC-057b — Polish layer validation pass.
//
// Runs the four-check sequence specified in CC-057b § "The locked content —
// validation pass":
//   1. Anchor preservation
//   2. Derivation immutability
//   3. Structural assertion preservation
//   4. Numbered-fact preservation
//
// Any failure → return { ok: false, reason, failedCheck }. The caller
// (`polish()`) then returns the engine-rendered baseline (graceful
// fallback). Better to ship a structurally-accurate marble statue than a
// warmer-but-incorrect polished version.

import {
  extractStructuralAssertions,
  reportsHaveSameAnchors,
  reportsHaveSameDerivations,
  reportsHaveSameDisambiguation,
  reportsHaveSameNumberedFacts,
} from "./contract";
import type {
  EngineRenderedReport,
  PolishedReport,
  PolishValidationResult,
} from "./types";

export function validatePolish(
  engineReport: EngineRenderedReport,
  candidatePolished: PolishedReport
): PolishValidationResult {
  // Check 1 — Anchor preservation. Locked Sentence 2 anchors must survive
  // verbatim somewhere in the polished output (proseSlots or lockedAnchors).
  const anchorCheck = reportsHaveSameAnchors(engineReport, candidatePolished);
  if (!anchorCheck.ok) {
    return {
      ok: false,
      reason: anchorCheck.reason,
      failedCheck: "anchor",
    };
  }

  // Check 1b — Peace/Faith disambiguation block preservation. Same rule as
  // anchor preservation; treated as a sub-check of "anchor" for the
  // failedCheck classification because the LLM tends to fail both the same
  // way (over-eager rewrite of locked register prose).
  const disambigCheck = reportsHaveSameDisambiguation(
    engineReport,
    candidatePolished
  );
  if (!disambigCheck.ok) {
    return {
      ok: false,
      reason: disambigCheck.reason,
      failedCheck: "anchor",
    };
  }

  // Check 2 — Derivation immutability. The full set of engine derivations
  // must appear in the polished output's derivations field, byte-for-byte.
  const derivationCheck = reportsHaveSameDerivations(
    engineReport,
    candidatePolished
  );
  if (!derivationCheck.ok) {
    return {
      ok: false,
      reason: derivationCheck.reason,
      failedCheck: "derivation",
    };
  }

  // Check 3 — Structural assertion preservation. Subset of derivations
  // (driver/aux/aux-pair/gift-routing/work/love/drive/ocean) must all
  // appear. Redundant with Check 2 when Check 2 passes; preserved as a
  // separate check so the failure-classification can name the structural
  // sub-failure when validation tightens in CC-057c.
  const engineStructural = extractStructuralAssertions(engineReport);
  const polishedStructural = extractStructuralAssertions(candidatePolished);
  const polishedSet = new Set(polishedStructural);
  for (const claim of engineStructural) {
    if (!polishedSet.has(claim)) {
      return {
        ok: false,
        reason: `Structural assertion missing from polished: "${claim}"`,
        failedCheck: "structural_assertion",
      };
    }
  }

  // Check 4 — Numbered-fact preservation. Top-3 gift order, Compass top-5
  // ranking, Drive percentages, OCEAN bucket labels. All must match exactly.
  const numberedCheck = reportsHaveSameNumberedFacts(
    engineReport,
    candidatePolished
  );
  if (!numberedCheck.ok) {
    return {
      ok: false,
      reason: numberedCheck.reason,
      failedCheck: "numbered_fact",
    };
  }

  return { ok: true };
}
