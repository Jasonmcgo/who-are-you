// CC-GRIP-TAXONOMY — shared GripParagraphInputs derivation.
// CC-GRIP-CALIBRATION — extended with sub-register + distorted strategy
// + surface grip so the LLM can render the three-concept structure.
//
// Both `scripts/buildGripTaxonomy.ts` (build-time) and the engine
// integration (runtime — for cache lookup) need to compute the same
// `GripParagraphInputs` from a constitution. Sharing the derivation
// keeps the input hash deterministic across both call sites.
//
// Pure data — no API call, no SDK, no `node:*` imports. Safe for the
// engine to import on the runtime path.

import {
  COMPASS_LABEL,
  FUNCTION_VOICE,
  getTopCompassValues,
} from "./identityEngine";
import type { InnerConstitution } from "./types";
import type { GripParagraphInputs } from "./gripTaxonomyLlm";
import { driverRegisterHint } from "./voiceRubricExamples";
import { computeRiskFormFromAim } from "./riskForm";

export function deriveGripInputs(
  constitution: InnerConstitution
): GripParagraphInputs | null {
  const grip = constitution.gripTaxonomy;
  if (!grip || !grip.primary) return null;
  // CC-GRIP-CALIBRATION — render only when the cluster's prose mode is
  // not "omitted". `rendered` and `hedged` both produce LLM prose; the
  // mode tells the prompt which template to use.
  if (grip.proseMode === "omitted") return null;

  const tc = getTopCompassValues(constitution.signals).slice(0, 4);
  const lensDom = constitution.lens_stack.dominant;
  // CC-PHASE-3A-LABEL-LOGIC — use legacyLabel for hash stability
  // (same pattern as synthesis3Inputs).
  const movementQuadrant =
    constitution.movementQuadrant?.legacyLabel ?? "Drift";

  return {
    // CC-GRIP-TAXONOMY-REPLACEMENT — Grip Pattern fields lead the inputs
    // so the LLM emits the proprietary taxonomy in its output prose.
    // The engine-internal Primal fields below remain for the classifier
    // and as legacy hash anchors.
    gripPatternBucket: constitution.gripPattern?.bucket,
    gripPatternLabel: constitution.gripPattern?.renderedLabel,
    underlyingQuestion: constitution.gripPattern?.underlyingQuestion,
    primary: grip.primary,
    secondary: grip.secondary,
    tertiary: grip.tertiary,
    contributingGrips: grip.contributingGrips,
    // CC-PHASE-3A-LABEL-LOGIC — legacy letter for hash stability.
    riskFormLetter: constitution.riskForm?.legacyLetter ?? null,
    topCompass: tc.map((r) => COMPASS_LABEL[r.signal_id] ?? r.signal_id),
    lensDominant: FUNCTION_VOICE[lensDom],
    movementQuadrant,
    // CC-GRIP-CALIBRATION fields ──────────────────────────────────────
    subRegister: grip.subRegister,
    surfaceGrip: grip.surfaceGrip,
    distortedStrategy: grip.distortedStrategy?.text ?? null,
    healthyGift: grip.healthyGift,
    proseMode: grip.proseMode,
    // CC-AGE-CALIBRATION fields ───────────────────────────────────────
    band: constitution.bandReading?.band ?? null,
    bandLabel: constitution.bandReading?.label ?? null,
    registerHint: constitution.bandReading?.registerHint ?? null,
    // CC-AIM-CALIBRATION fields ───────────────────────────────────────
    // CC-AIM-REBUILD-MOVEMENT-LIMITER — see synthesis3Inputs.ts; pin
    // hash to legacy Aim score for cache stability.
    aimScore: constitution.aimReadingLegacy?.score ?? null,
    // CC-PHASE-3A-LABEL-LOGIC — use legacyLetter for hash stability.
    // CC-GRIP-WIRING-AND-FLOOR-CALIBRATION + CC-GRIP-SIGNAL-WEIGHTING —
    // recompute the letter from BOTH the legacy Aim score AND legacy
    // additive Grip so the cache hash stays byte-stable even when the
    // new substrates feed Aim via ResponsibilityIntegration.
    aimRiskFormLetter: (() => {
      const legacyAim = constitution.aimReadingLegacy?.score;
      const legacyGrip =
        constitution.goalSoulMovement?.dashboard.grippingPull.score;
      if (legacyAim === undefined || legacyGrip === undefined) {
        return constitution.riskFormFromAim?.legacyLetter ?? null;
      }
      return computeRiskFormFromAim(legacyAim, legacyGrip).legacyLetter;
    })(),
    // CC-VOICE-RUBRIC-EXPANSION ───────────────────────────────────────
    driverRegisterHint: driverRegisterHint(lensDom),
    // CC-CRISIS-PATH-PROSE — conditional spread (trajectory-class users
    // get no crisis keys; their cache hashes stay byte-identical).
    ...(constitution.coherenceReading?.pathClass === "crisis" &&
    constitution.coherenceReading?.crisisFlavor
      ? {
          pathClass: "crisis" as const,
          crisisFlavor: constitution.coherenceReading.crisisFlavor,
          coherenceRationale: constitution.coherenceReading.rationale,
        }
      : {}),
  };
}
