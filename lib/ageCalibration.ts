// CC-AGE-CALIBRATION — developmental-band calibration of the trajectory model.
//
// Canon (Jason 2026-05-10):
//   "50 degrees by 50 years old is the correct trajectory toward purpose."
//
// Refinement (Clarence 2026-05-10):
//   "Use developmental bands — formation, direction, integration, purpose
//    consolidation, stewardship, wisdom/transmission."
//
// The trajectory model is now age-relative. Younger users get age-
// appropriate expectations; older users get integration framing. Solves
// the seasonality problem without flattening the directional metaphor.
//
// Method discipline:
//   - Engine for truth. Band classification is deterministic over age.
//   - LLM prose layer consumes the band as a register hint, never as a
//     verdict. No "behind" framing — every band has its own dignity.
//   - Pure data — no API calls, no SDK, no `node:*` imports.
//
// Demographic input note: the engine's age field is a decade-of-birth
// id ("1980s"), not a precise age. We estimate age from decade midpoint
// (e.g., "1980s" → 1985) against the current date. The estimate is used
// only for band classification (a coarse signal); precision-anxiety
// language is explicitly avoided in the prose register.

import type { DemographicSet } from "./types";

// ─────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────

export type DevelopmentalBand =
  | "formation"
  | "direction"
  | "integration"
  | "purpose-consolidation"
  | "stewardship"
  | "wisdom-transmission";

export interface BandConfig {
  band: DevelopmentalBand;
  label: string;
  ageRange: { min: number; max: number };
  characterDescription: string;
  trajectoryWorkDescription: string;
  registerHint: string;
}

export interface BandReading {
  band: DevelopmentalBand;
  label: string;
  age: number;
  ageOnLowerEdge: boolean;
  ageOnUpperEdge: boolean;
  characterDescription: string;
  trajectoryWorkDescription: string;
  registerHint: string;
  rationale: string;
  // Decade-derived flag — when the engine age is from a decade-of-birth
  // demographic (the canonical case), this is true and the prose layer
  // can soften any age-specific phrasing accordingly.
  ageFromDecadeMidpoint: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────

export const TOO_YOUNG_AGE = 14;
const EDGE_WINDOW_YEARS = 2;

export const DEVELOPMENTAL_BANDS: ReadonlyArray<BandConfig> = [
  {
    band: "formation",
    label: "Formation",
    ageRange: { min: 14, max: 22 },
    characterDescription:
      "Building self, identity, first commitments. Goal-line emerging from school/family. Soul-line untested.",
    trajectoryWorkDescription:
      "Shape is forming; trajectory not yet measurable as commitment-bearing.",
    registerHint:
      "Generous tone — the user is in early shape-formation. Avoid trajectory-judgment language. Frame the read as a working hypothesis the user is invited to test, not as a current verdict.",
  },
  {
    band: "direction",
    label: "Direction",
    ageRange: { min: 22, max: 32 },
    characterDescription:
      "Establishing trajectory, career foothold, partnership choice.",
    trajectoryWorkDescription:
      "Goal-leaning trajectory expected; the work is to commit and to build.",
    registerHint:
      "Building register. The work is establishing direction; Goal dominance is appropriate at this stage. Frame Soul scarcity as developmentally normal, not as deficit.",
  },
  {
    band: "integration",
    label: "Integration",
    ageRange: { min: 32, max: 45 },
    characterDescription:
      "Bringing Soul to existing Goal-line. Relationships, parenthood, mentorship begin to weave through work.",
    trajectoryWorkDescription:
      "Trajectory shifts toward balance; the work is to integrate, not to choose.",
    registerHint:
      "Integration register. The user has built; the work now is weaving Soul through what they've built. Avoid framing as 'finally ready to slow down' — integration is its own form of motion.",
  },
  {
    band: "purpose-consolidation",
    label: "Purpose Consolidation",
    ageRange: { min: 45, max: 55 },
    characterDescription:
      "Refining what the work was for. Focusing. Beloved object becoming visible.",
    trajectoryWorkDescription:
      "The 50° destination emerges; the work is to make the line steady and the beloved unmistakable.",
    registerHint:
      "Consolidation register. The 50° anchor lands here. The work is making the beloved object unmistakable. Avoid 'still building' framing — the building is converging.",
  },
  {
    band: "stewardship",
    label: "Stewardship",
    ageRange: { min: 55, max: 70 },
    characterDescription:
      "Carrying forward, mentoring, guarding what was built.",
    trajectoryWorkDescription:
      "Soul-leaning past 50°. The work is to transmit, to govern legacy, to keep the line honest as seasons turn.",
    registerHint:
      "Stewardship register. The user is past peak ascent; the work is governance and transmission. Avoid achievement-framing or 'next move' urgency. The next move is keeping watch.",
  },
  {
    band: "wisdom-transmission",
    label: "Wisdom / Transmission",
    ageRange: { min: 70, max: 200 },
    characterDescription:
      "Passing on what was learned. Integration becomes legacy.",
    trajectoryWorkDescription:
      "Trajectory is past steepness; line is becoming testimony.",
    registerHint:
      "Wisdom register. The user is in the transmission stage. Frame as testimony, not as future-work. The instrument is honoring what's been built, not pointing at what's next.",
  },
];

// ─────────────────────────────────────────────────────────────────────
// Demographics → age extraction
// ─────────────────────────────────────────────────────────────────────
//
// The instrument captures age as a decade-of-birth (e.g., "1980s"). We
// estimate age from decade midpoint against the current date. Returns
// { age, fromDecadeMidpoint } when usable, null when the field is
// missing / opted-out / unparseable.

const ENGINE_REFERENCE_YEAR = 2026;
const DECADE_MIDPOINT_OFFSET = 5;

export interface ExtractedAge {
  age: number;
  fromDecadeMidpoint: boolean;
}

export function extractAgeFromDemographics(
  demographics: DemographicSet | null | undefined,
  referenceYear: number = ENGINE_REFERENCE_YEAR
): ExtractedAge | null {
  if (!demographics) return null;
  const ageEntry = demographics.answers.find((a) => a.field_id === "age");
  if (!ageEntry || ageEntry.state !== "specified" || !ageEntry.value) {
    return null;
  }
  // Decade ids are shaped "1980s". Anything else is treated as missing.
  const m = /^(\d{4})s$/.exec(ageEntry.value);
  if (!m) return null;
  const decadeStart = parseInt(m[1], 10);
  if (Number.isNaN(decadeStart)) return null;
  const midpointBirthYear = decadeStart + DECADE_MIDPOINT_OFFSET;
  const age = referenceYear - midpointBirthYear;
  if (age < 0) return null;
  return { age, fromDecadeMidpoint: true };
}

// ─────────────────────────────────────────────────────────────────────
// Band classification
// ─────────────────────────────────────────────────────────────────────

function findBand(age: number): BandConfig | null {
  for (const cfg of DEVELOPMENTAL_BANDS) {
    if (age >= cfg.ageRange.min && age < cfg.ageRange.max) return cfg;
  }
  // Above the highest band's max → still wisdom-transmission (open
  // upper bound).
  if (age >= DEVELOPMENTAL_BANDS[DEVELOPMENTAL_BANDS.length - 1].ageRange.min) {
    return DEVELOPMENTAL_BANDS[DEVELOPMENTAL_BANDS.length - 1];
  }
  return null;
}

export function classifyDevelopmentalBand(
  age: number,
  options: { fromDecadeMidpoint?: boolean } = {}
): BandReading | null {
  if (!Number.isFinite(age) || age < TOO_YOUNG_AGE) return null;
  const cfg = findBand(age);
  if (!cfg) return null;
  const ageOnLowerEdge =
    age >= cfg.ageRange.min && age < cfg.ageRange.min + EDGE_WINDOW_YEARS;
  // Upper edge — within the last EDGE_WINDOW_YEARS years of the band.
  // Wisdom-transmission has open upper bound (200) — don't fire upper-edge.
  const upperBound = cfg.ageRange.max;
  const ageOnUpperEdge =
    upperBound < 100 && age >= upperBound - EDGE_WINDOW_YEARS && age < upperBound;
  return {
    band: cfg.band,
    label: cfg.label,
    age,
    ageOnLowerEdge,
    ageOnUpperEdge,
    characterDescription: cfg.characterDescription,
    trajectoryWorkDescription: cfg.trajectoryWorkDescription,
    registerHint: cfg.registerHint,
    rationale: `Age ${age} falls within the ${cfg.label} band (${cfg.ageRange.min}–${cfg.ageRange.max === 200 ? "70+" : cfg.ageRange.max - 1}).${ageOnLowerEdge ? " On lower edge of band — register softens accordingly." : ""}${ageOnUpperEdge ? " On upper edge of band — register softens accordingly." : ""}`,
    ageFromDecadeMidpoint: options.fromDecadeMidpoint === true,
  };
}

// ─────────────────────────────────────────────────────────────────────
// LLM register-hint anchor block (audit-anchor token: "developmental band")
// ─────────────────────────────────────────────────────────────────────

export const BAND_REGISTER_ANCHOR_BLOCK = `# Developmental band register (anchor — adjusts prose tone)

The user's report includes a developmental band (formation / direction / integration / purpose-consolidation / stewardship / wisdom-transmission). The band reflects life stage, not just age. Adjust prose register accordingly:

- Formation: generous tone; framework is a working hypothesis, not a verdict
- Direction: building register; Goal dominance is appropriate; don't frame Soul scarcity as deficit
- Integration: integration register; the work is weaving, not choosing
- Purpose Consolidation: consolidation register; making the beloved unmistakable
- Stewardship: stewardship register; governance and transmission, not achievement
- Wisdom / Transmission: wisdom register; testimony, not future-work

Never use "behind" framing. Each band has its own dignity. Tracking-late prose says "more of the work is still ahead" without judgment. Tracking-ahead prose says "your line is steeper than the canonical for your stage; the work is to keep the steepness honest as seasons turn."

If the band is null (user under 14, or age missing), use age-agnostic register.`;
