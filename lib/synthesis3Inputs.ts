// CC-SYNTHESIS-3 — shared PathMasterInputs derivation.
//
// Both `scripts/buildSynthesis3.ts` (build-time) and the engine
// integration (runtime — for cache lookup) need to compute the same
// PathMasterInputs from a constitution. Sharing the derivation keeps
// the input hash deterministic across both call sites.
//
// IMPORTANT: this module is also runtime-importable (the engine reads
// it during buildInnerConstitution). It must NOT import the Anthropic
// SDK or trigger any API call. The composer module
// (`lib/synthesis3Llm.ts`) handles those — this module is pure data.

import {
  COMPASS_LABEL,
  FUNCTION_VOICE,
  GRAVITY_LABEL,
  composeClosingReadProse,
  detectCrossCardPatterns,
  getTopCompassValues,
  getTopGravityAttribution,
} from "./identityEngine";
import type { InnerConstitution } from "./types";
import type { PathMasterInputs } from "./synthesis3Llm";
import { driverRegisterHint } from "./voiceRubricExamples";
import { computeRiskFormFromAim } from "./riskForm";

const ENGINE_CANONICAL_PHRASES = [
  "convert structure into mercy",
  "care with a spine",
  "the early shape of giving",
  "Your gift is the long read",
  "let context travel with action",
  "Giving is Work that has found its beloved object",
];

const COMPASS_GIVING_DESCRIPTORS: Record<string, string> = {
  knowledge_priority:
    "building structures that make truth more usable, more humane, and less captive to noise",
  family_priority:
    "love that becomes a reliable form others can count on",
  compassion_priority:
    "concrete care with enough structure to last beyond the moment",
  peace_priority:
    "order rebuilt where order broke, durable conditions for flourishing",
  faith_priority:
    "belief made visible through faithful action across time",
  honor_priority:
    "integrity given a body, the kept promise as a form of work",
  freedom_priority:
    "space made for self and others to become without coercion",
  justice_priority:
    "accountable structures that make wrong things right",
  truth_priority:
    "saying clearly what is, in language the room can act on",
  loyalty_priority:
    "commitments that hold when costs arrive, not only when they don't",
  stability_priority: "predictable ground others can build on",
  mercy_priority:
    "care that doesn't hold the past against the present",
};

export function deriveSynthesis3Inputs(
  constitution: InnerConstitution
): PathMasterInputs {
  const dom = constitution.lens_stack.dominant;
  const aux = constitution.lens_stack.auxiliary;
  const tc = getTopCompassValues(constitution.signals).slice(0, 4);
  const tg = getTopGravityAttribution(constitution.signals).slice(0, 2);
  const dash = constitution.goalSoulMovement?.dashboard;
  const closingProse = composeClosingReadProse(constitution);

  const givingDescriptor =
    tc[0] && COMPASS_GIVING_DESCRIPTORS[tc[0].signal_id]
      ? COMPASS_GIVING_DESCRIPTORS[tc[0].signal_id]
      : "care given a durable form, the value made visible through how you build";

  const fired = detectCrossCardPatterns(
    constitution.signals,
    [],
    [],
    constitution.lens_stack,
    constitution.meta_signals,
    null
  );
  const topPattern =
    fired.find(
      (f) => f.pattern.pattern_id !== "endurance_under_low_load"
    ) ?? fired[0];

  return {
    lensDominant: FUNCTION_VOICE[dom],
    lensAux: FUNCTION_VOICE[aux],
    topCompass: tc.map((r) => COMPASS_LABEL[r.signal_id] ?? r.signal_id),
    topGravity: tg.map((r) => GRAVITY_LABEL[r.signal_id] ?? r.signal_id),
    movement: {
      goal: dash?.goalScore ?? 0,
      soul: dash?.soulScore ?? 0,
      // CC-PHASE-3A-LABEL-LOGIC — use legacyLabel for hash stability.
      // Cached LLM paragraphs were keyed on the legacy label set
      // ("Giving / Presence" / "Drift" / etc.); the new labels
      // ("Goal-led Presence", etc.) ship on the constitution for
      // render-layer consumption but the hash continues to consume the
      // legacy collapse to preserve cache.
      quadrant: constitution.movementQuadrant?.legacyLabel ?? "Drift",
      biasDirection: dash?.direction.descriptor ?? "balanced",
      strength: dash?.movementStrength.length ?? 0,
      length: dash?.movementStrength.descriptor ?? "short",
    },
    // CC-PHASE-3A-LABEL-LOGIC — legacy letter for hash stability.
    riskForm: constitution.riskForm?.legacyLetter ?? null,
    loveMap:
      constitution.loveMap?.matches[0]?.register.register_label ??
      "the Companion",
    givingDescriptor,
    engineCanonicalPhrases: ENGINE_CANONICAL_PHRASES.filter((p) =>
      closingProse.includes(p)
    ),
    topPatternInMotion: topPattern?.prose ?? null,
    band: constitution.bandReading?.band ?? null,
    bandLabel: constitution.bandReading?.label ?? null,
    registerHint: constitution.bandReading?.registerHint ?? null,
    // CC-AIM-REBUILD-MOVEMENT-LIMITER — the LLM cache hash uses the
    // LEGACY Aim score so existing cached paragraphs remain valid. The
    // new aimReading.score is available on the constitution for the
    // render layer + Phase 3 prose work, but the hash key intentionally
    // pins to legacy for backward-compat. Phase 3 will switch downstream.
    aimScore: constitution.aimReadingLegacy?.score ?? null,
    // CC-PHASE-3A-LABEL-LOGIC — use legacyLetter for hash stability.
    // CC-GRIP-WIRING-AND-FLOOR-CALIBRATION — `constitution.riskFormFromAim`
    // now classifies on the canonical §13 composed Grip, which shifts
    // its letter for fixtures crossing the 40-grip threshold relative
    // to legacy.
    // CC-GRIP-SIGNAL-WEIGHTING — the new identity-weighted qGrip1 + Q-3C2
    // bumps also feed ResponsibilityIntegration → Aim, so even the NEW
    // aim score can shift for some fixtures. To keep the cache hash
    // byte-stable (Option B), recompute the letter from BOTH the legacy
    // Aim score AND the legacy additive Grip. Production output
    // continues to use the canonical composed-Grip letter; only this
    // hash key reads fully-legacy substrates.
    aimRiskFormLetter: (() => {
      const legacyAim = constitution.aimReadingLegacy?.score;
      const legacyGrip = dash?.grippingPull.score;
      if (legacyAim === undefined || legacyGrip === undefined) {
        return constitution.riskFormFromAim?.legacyLetter ?? null;
      }
      return computeRiskFormFromAim(legacyAim, legacyGrip).legacyLetter;
    })(),
    // CC-GRIP-TAXONOMY-REPLACEMENT — Grip Pattern fields enter the hash
    // so the synthesis3 cache invalidates and regenerates against the
    // proprietary taxonomy (no Foster vocabulary in new prose).
    gripPatternBucket: constitution.gripPattern?.bucket,
    gripPatternLabel: constitution.gripPattern?.renderedLabel,
    gripPatternUnderlyingQuestion:
      constitution.gripPattern?.underlyingQuestion,
    driverRegisterHint: driverRegisterHint(dom),
    // CC-CRISIS-PATH-PROSE — conditional spread. Trajectory-class users
    // get NO crisis-related keys in their inputs object, which keeps
    // their cache hashes byte-identical to the pre-CC-CRISIS-PATH-PROSE
    // generation. Crisis users get the three keys, which produces a
    // distinct hash and triggers crisis-class regeneration.
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
