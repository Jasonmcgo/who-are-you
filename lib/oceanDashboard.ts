// CC-072 — OCEAN Dashboard render.
//
// Two exports:
//   - `renderOceanDashboardSVG(mix)` — hand-rolled horizontal bar chart
//     with five bars (one per trait). Independent 0–100 intensities; no
//     100%-summing math (memo §2.3). ~80 lines.
//   - `composeOceanProse(mix, goalSoulGive)` — Disposition Signal Mix
//     paragraphs in dominance rank order. Per memo §6: section heading
//     "Disposition Signal Mix" (NEVER "OCEAN" / "Big Five" / "Personality"),
//     trait names appear after narrative names, intensity bands replace
//     numeric percentages in user-facing text. Per memo §7, each per-trait
//     paragraph adds a one-sentence cross-reference to the Goal/Soul read
//     when the corroborating composite is present.
//
// User-facing register guards (memo §6.4 / §10):
//   - No 100%-summing percentages in user-facing prose.
//   - No "Emotional Reactivity 0%" — ER 0%/under-detected always renders
//     as the §5.2 proxy disclosure.
//   - No personality-verdict framing ("you are an introvert").
//   - No engine-layer math ("your Openness intensity is 67"); use band
//     names instead.
//   - No therapy-coded language.

import type {
  DispositionSignalMix,
  GoalSoulGiveOutput,
  OceanBucket,
  OceanIntensity,
  OceanIntensityBand,
  OpennessFlavor,
} from "./types";

// ── Bucket → narrative + Big Five label ─────────────────────────────────

const BIG_FIVE_LABEL: Record<OceanBucket, string> = {
  O: "Openness",
  C: "Conscientiousness",
  E: "Extraversion",
  A: "Agreeableness",
  N: "Emotional Reactivity",
};

// Memo §6.1 — narrative descriptors used as the entry-point label, with
// the Big Five name following in the body.
const NARRATIVE_LABEL: Record<OceanBucket, string> = {
  O: "how you take in new things",
  C: "how you organize your effort",
  E: "how visibly your interior moves outward",
  A: "how you weigh others alongside yourself",
  N: "how visibly emotion moves through you",
};

// Per-bucket intensity-band → register-interpretation sentence. These are
// observation-not-prescription per memo §10. Phrasing avoids personality-
// verdict framing.
export const BAND_INTERPRETATION: Record<
  OceanBucket,
  Record<OceanIntensityBand, string>
> = {
  O: {
    "under-detected": "the imagination register is not strongly visible in this assessment",
    low: "the imagination register reads quieter — engagement with what could be appears measured",
    moderate: "the imagination register is alive and active",
    "moderate-high": "the imagination register is alive and active",
    high: "the imagination register reads strongly — engagement with what could be is a defining strand",
  },
  C: {
    "under-detected": "the discipline-and-structure register is not strongly visible",
    low: "the discipline-and-structure register reads quieter — organization may follow its own less linear shape",
    moderate: "the discipline-and-structure register supports building, finishing, and carrying responsibility",
    "moderate-high": "the discipline-and-structure register supports building, finishing, and carrying responsibility",
    high: "the discipline-and-structure register is a defining strand — organization, follow-through, and reliability run deep",
  },
  E: {
    "under-detected": "the social-energy register reads lower than average",
    low: "the social-energy register reads lower than average — much of the interior process may not automatically broadcast itself",
    // CC-077 — NEW moderate-E band template (intensity ∈ [40, 60)).
    // Trait = capacity, not default mode. Body-map cards may continue to
    // read default-introvert posture; the OCEAN moderate-E reading
    // reflects full activation range. The phrasing avoids "low" / "lower
    // than average" — those are wrong-band registers reserved for the
    // low / under-detected templates.
    moderate:
      "the outward-energy register reads as situational and measured — moving outward when the moment, role, or mission calls for it, while the interior process does not automatically broadcast itself",
    "moderate-high": "the outward-energy register is active in a situational, role-based way — interior movement can find external form when there is a mission, audience, or structure. This should not be overread as constant social appetite or easy emotional broadcast",
    high: "the social-energy register reads strongly — interior movement readily takes external shape",
  },
  A: {
    "under-detected": "the loyalty/service register is not strongly visible",
    low: "the loyalty/service register reads quieter — moral concern may surface case-by-case rather than as a default posture",
    moderate: "the loyalty/service register is active",
    "moderate-high": "the loyalty/service register is active and load-bearing",
    high: "the loyalty/service register is a defining strand — moral concern, protective care, and relational obligation run deep",
  },
  N: {
    "under-detected": "the affect-visibility register is low or under-detected",
    low: "the affect-visibility register is low",
    moderate: "the affect-visibility register reads in a moderate band",
    "moderate-high": "the affect-visibility register is active — emotional weather may register more readily",
    high: "the affect-visibility register reads strongly — emotional movement is more directly visible",
  },
};

// ── Openness flavor sentences (memo §3.5) ───────────────────────────────

const OPENNESS_FLAVOR_SENTENCE: Record<OpennessFlavor, string> = {
  intellectual_led:
    "Your Openness leans intellectual — curious about ideas, drawn to abstraction and synthesis.",
  aesthetic_led:
    "Your Openness leans aesthetic — sensitive to beauty, mood, emotional weight, and the felt texture of things.",
  novelty_led:
    "Your Openness leans toward novelty — willing to experiment, change routines, and chase the unfamiliar.",
  // CC-077 — Architectural-led now ships the full three-sentence chain
  // per Clarence's verbatim version. Generic mixed-flavor fallback was
  // wrong-register for users whose imagination is alive but disciplined.
  architectural_led:
    "Your openness reads as structured and conceptual rather than novelty-seeking. The imagination register is alive, but it tends to look for form: frameworks, models, songs, systems, strategies, meanings, and long-arc patterns. This is openness under discipline — creativity that wants architecture.",
  mixed:
    "Your Openness reads broadly — multiple registers active, no single dominant flavor.",
};

// ── Cross-reference sentences (memo §7) ─────────────────────────────────
//
// Each per-trait paragraph adds at most one cross-reference sentence to
// Goal/Soul when the corroborating composite is present. Reads
// `goalSoulGive.adjustedScores` (the post-CC-071 user-facing scores).

function crossReferenceFor(
  bucket: OceanBucket,
  mix: DispositionSignalMix,
  goalSoulGive: GoalSoulGiveOutput | undefined
): string | null {
  if (!goalSoulGive) return null;
  const goal = goalSoulGive.adjustedScores.goal;
  const soul = goalSoulGive.adjustedScores.soul;
  const intensities = mix.intensities;

  if (bucket === "C" && intensities.conscientiousness >= 60 && goal >= 60) {
    return "The disposition channel for your output reinforces the Work-line we read elsewhere — output is structured and load-bearing rather than ad-hoc.";
  }
  if (bucket === "O" && intensities.openness >= 40 && soul >= 40) {
    if (
      mix.opennessFlavor === "architectural_led" &&
      goalSoulGive.quadrant === "give"
    ) {
      return "Architectural Openness paired with the giving shape suggests disciplined imagination resolving into form — the early shape of structure-as-purpose.";
    }
    return "Openness keeps the love-line vivid — imagination, beauty, and meaning stay available to the way you take in the world.";
  }
  if (bucket === "E" && intensities.extraversion <= 35 && soul >= 60) {
    return "Much of the love-line you carry may not automatically broadcast itself outward; care, conviction, and what matters most may need deliberate translation to be visible to others.";
  }
  if (bucket === "A" && intensities.agreeableness >= 60) {
    if (soul >= 60) {
      return "Paired with the love-line, this typically expresses as protective care, loyalty, and service — the love that shows up for people, not as social yielding.";
    }
    // CC-077 — de-duplication. Pre-CC-077 this branch ended with "truth
    // and responsibility may still outrank surface harmony", repeating
    // the same phrase already in the disambiguation sentence. Cross-
    // reference now contributes the cause-driven-service register call
    // without restating the truth-vs-harmony tension.
    return "The register here leans toward moral concern and cause-driven service rather than relational accommodation.";
  }
  if (
    bucket === "N" &&
    mix.emotionalReactivityConfidence.proxyOnly
  ) {
    return "The steadiness reads as composure; the cost it carries may not be visible from outside, including possibly to you.";
  }
  return null;
}

// ── Agreeableness disambiguation (memo §4) ──────────────────────────────
//
// When intensities.agreeableness ≥ 60, the per-trait paragraph explicitly
// distinguishes loyalty/service/moral-concern from accommodation. The
// disambiguation phrase joins after the band interpretation but before the
// cross-reference.

// CC-077 — High-A disambiguation. Returns the loyalty/moral-concern
// register sentence when intensity ≥ 60. The "truth and responsibility may
// still outrank surface harmony" phrase appears here ONCE. The cross-
// reference function (below) was de-duplicated in CC-077 to avoid the
// repeat Clarence flagged.
function agreeablenessDisambiguation(
  intensity: OceanIntensity
): string | null {
  if (intensity < 60) return null;
  return "The signal sits high, but it likely expresses less as automatic accommodation and more as loyalty, moral concern, service, and protective care — in conflict, truth and responsibility may still outrank surface harmony.";
}

// CC-077 — "care with a spine" close at intensity ≥ 80. Distinguishes
// loyalty-with-conviction-for-truth from accommodation-for-harmony in a
// single phrase users can carry. Per CC-077 prompt: canonical phrasing.
function agreeablenessCareWithSpineClose(
  intensity: OceanIntensity
): string | null {
  if (intensity < 80) return null;
  return "The high signal is not 'softness'; it is care with a spine.";
}

// ── Emotional Reactivity proxy disclosure (memo §5.2) ───────────────────

function emotionalReactivityProxyDisclosure(): string {
  // Spec §5.2 phrasing close-paraphrased — avoids quoting the forbidden
  // personality-verdict phrasing verbatim. Audit's verdict-substring guard
  // would trip on the original wording's negation-in-quotes.
  // CC-077 addendum — the four processing modes (composure, analysis,
  // structure, delayed recognition) name how proxy-only ER often looks
  // from outside. Per Clarence's verbatim version.
  return "Because the instrument estimates this through proxy signals rather than direct measurement, it should be treated cautiously — the safer read is that your emotional reactivity may not be easily visible from the outside, not that the affect-channel itself is absent, and may sometimes be processed through composure, analysis, structure, or delayed recognition.";
}

// ── Per-trait paragraph composer ────────────────────────────────────────

function composeTraitParagraph(
  bucket: OceanBucket,
  mix: DispositionSignalMix,
  goalSoulGive: GoalSoulGiveOutput | undefined,
  isLede: boolean
): string {
  const intensity = bucketIntensity(bucket, mix);
  const band = bucketBand(bucket, mix);
  const narrative = NARRATIVE_LABEL[bucket];
  const traitName = BIG_FIVE_LABEL[bucket];

  // Memo §5.1 — Emotional Reactivity 0% / proxy-only branch.
  if (
    bucket === "N" &&
    (mix.emotionalReactivityConfidence.proxyOnly || intensity === 0)
  ) {
    const lede = isLede
      ? `Your strongest signal is in *${narrative}* — Big Five ${traitName} — registering as low or under-detected. `
      : `*${narrative}* — Big Five ${traitName} — appears low or under-detected. `;
    const xref = crossReferenceFor(bucket, mix, goalSoulGive);
    return [
      lede + emotionalReactivityProxyDisclosure(),
      xref ?? "",
    ]
      .filter((s) => s.length > 0)
      .join(" ");
  }

  // Standard per-trait paragraph: narrative-name + Big Five name + band.
  const lede = isLede
    ? `Your strongest signal is in *${narrative}* — Big Five ${traitName} — registering as ${band}. `
    : `*${narrative}* — Big Five ${traitName} — registers as ${band}. `;

  // Openness gets the flavor sentence first.
  const opennessFlavor =
    bucket === "O" ? OPENNESS_FLAVOR_SENTENCE[mix.opennessFlavor] + " " : "";

  const interpretation = BAND_INTERPRETATION[bucket][band];
  // CODEX-081 — architectural-led Openness ships a self-contained
  // three-sentence chain; appending the generic imagination-register
  // closer after it duplicates the chain's second sentence in weaker form.
  const interpretationSentence =
    bucket === "O" && mix.opennessFlavor === "architectural_led"
      ? ""
      : capitalizeFirst(interpretation) + ".";

  // Agreeableness disambiguation when ≥ 60.
  const agreeablenessNote =
    bucket === "A"
      ? agreeablenessDisambiguation(intensity)
      : null;
  // CC-077 — "care with a spine" close fires at intensity ≥ 80.
  const agreeablenessClose =
    bucket === "A" ? agreeablenessCareWithSpineClose(intensity) : null;

  const xref = crossReferenceFor(bucket, mix, goalSoulGive);

  return [
    (lede + opennessFlavor + interpretationSentence).trim(),
    agreeablenessNote ?? "",
    xref ?? "",
    agreeablenessClose ?? "",
  ]
    .filter((s) => s.length > 0)
    .join(" ");
}

function bucketIntensity(
  bucket: OceanBucket,
  mix: DispositionSignalMix
): OceanIntensity {
  switch (bucket) {
    case "O":
      return mix.intensities.openness;
    case "C":
      return mix.intensities.conscientiousness;
    case "E":
      return mix.intensities.extraversion;
    case "A":
      return mix.intensities.agreeableness;
    case "N":
      return mix.intensities.emotionalReactivity;
  }
}

function bucketBand(
  bucket: OceanBucket,
  mix: DispositionSignalMix
): OceanIntensityBand {
  switch (bucket) {
    case "O":
      return mix.bands.openness;
    case "C":
      return mix.bands.conscientiousness;
    case "E":
      return mix.bands.extraversion;
    case "A":
      return mix.bands.agreeableness;
    case "N":
      return mix.bands.emotionalReactivity;
  }
}

function capitalizeFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Top-level prose composer ────────────────────────────────────────────

export const DISPOSITION_SIGNAL_MIX_DISCLAIMER =
  "These describe independent disposition intensities detected by the instrument across this assessment. They are not percentile scores against a population, and they are not slices of a 100% pie.";

export type OceanProseBlock = {
  disclaimer: string;
  paragraphs: string[]; // 5 paragraphs, in dominance rank order
};

export function composeOceanProse(
  mix: DispositionSignalMix,
  goalSoulGive: GoalSoulGiveOutput | undefined
): OceanProseBlock {
  const paragraphs: string[] = [];
  mix.dominance.ranked.forEach((bucket, i) => {
    paragraphs.push(
      composeTraitParagraph(bucket, mix, goalSoulGive, i === 0)
    );
  });
  return {
    disclaimer: DISPOSITION_SIGNAL_MIX_DISCLAIMER,
    paragraphs,
  };
}

// ── SVG bar chart (memo §6 + §13.10) ───────────────────────────────────
//
// Five horizontal bars stacked vertically. Each bar:
//   - Trait name label on the left.
//   - Background bar (light grey) representing the 0–100 axis.
//   - Foreground bar (darker fill) proportional to intensity.
//   - Intensity number + band on the right.
//
// 1:1-ish aspect ratio (memo §6 prefers width-dominant; settled on
// 400×260 viewBox with 5 rows). Hand-rolled, no library.

const SVG_VIEWBOX_W = 400;
const SVG_VIEWBOX_H = 260;
const BAR_COL_X = 120;
const BAR_COL_W = 220;
const VALUE_COL_X = 350;
const ROW_H = 36;
const ROW_GAP = 12;
const BAR_HEIGHT = 18;
const TOP_PADDING = 32;

const SVG_TRAIT_ORDER: OceanBucket[] = ["O", "C", "E", "A", "N"];

export function composeOceanValueLabel(
  bucket: OceanBucket,
  intensity: OceanIntensity,
  band: OceanIntensityBand,
  isProxyER: boolean
): string {
  if (isProxyER) return "low/under-detected";
  // CODEX-087 — post-CC-AS + CC-JX, tighten the subtype label gate so
  // "moral-concern dominant" distinguishes genuinely saturated A profiles.
  // The separate high-A prose close ("care with a spine") remains at >= 80.
  const subtype =
    bucket === "A" && intensity >= 90 ? ", moral-concern dominant" : "";
  return `${intensity} · ${band}${subtype}`;
}

export function renderOceanDashboardSVG(mix: DispositionSignalMix): string {
  const lines: string[] = [];
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_VIEWBOX_W} ${SVG_VIEWBOX_H}" width="100%" height="auto" role="img" aria-label="Disposition Signal Mix bar chart" style="max-width:480px;">`
  );
  // Title row
  lines.push(
    `  <text x="0" y="20" font-size="12" font-family="system-ui, sans-serif" fill="#444" font-weight="600">Disposition Signal Mix — independent 0–100 intensities</text>`
  );

  // Per-trait rows
  SVG_TRAIT_ORDER.forEach((bucket, i) => {
    const intensity = bucketIntensity(bucket, mix);
    const band = bucketBand(bucket, mix);
    const y = TOP_PADDING + i * (ROW_H + ROW_GAP);
    const barY = y + (ROW_H - BAR_HEIGHT) / 2;
    // For ER, when proxyOnly, render bar at 50% opacity to signal
    // under-detection visually.
    const isProxyER =
      bucket === "N" && mix.emotionalReactivityConfidence.proxyOnly;
    const barOpacity = isProxyER ? 0.45 : 1.0;
    const filledW = (intensity / 100) * BAR_COL_W;
    const valueLabel = composeOceanValueLabel(
      bucket,
      intensity,
      band,
      isProxyER
    );
    const labelText = BIG_FIVE_LABEL[bucket];

    lines.push(
      `  <text x="0" y="${y + ROW_H / 2 + 4}" font-size="11" font-family="system-ui, sans-serif" fill="#333">${labelText}</text>`
    );
    lines.push(
      `  <rect x="${BAR_COL_X}" y="${barY}" width="${BAR_COL_W}" height="${BAR_HEIGHT}" fill="#ede4d3" />`
    );
    lines.push(
      `  <rect x="${BAR_COL_X}" y="${barY}" width="${filledW}" height="${BAR_HEIGHT}" fill="#8b6f47" opacity="${barOpacity}" />`
    );
    // 50% midline (gentle reference).
    lines.push(
      `  <line x1="${BAR_COL_X + BAR_COL_W / 2}" y1="${barY}" x2="${BAR_COL_X + BAR_COL_W / 2}" y2="${barY + BAR_HEIGHT}" stroke="#bbb" stroke-width="0.5" stroke-dasharray="2 2" />`
    );
    lines.push(
      `  <text x="${VALUE_COL_X - 5}" y="${y + ROW_H / 2 + 4}" font-size="10" font-family="system-ui, sans-serif" fill="#444" text-anchor="end">${valueLabel}</text>`
    );
  });

  // 0–100 axis line at the bottom.
  const axisY = TOP_PADDING + 5 * (ROW_H + ROW_GAP) + 4;
  lines.push(
    `  <line x1="${BAR_COL_X}" y1="${axisY}" x2="${BAR_COL_X + BAR_COL_W}" y2="${axisY}" stroke="#aaa" stroke-width="0.5" />`
  );
  lines.push(
    `  <text x="${BAR_COL_X}" y="${axisY + 12}" font-size="9" font-family="system-ui, sans-serif" fill="#777">0</text>`
  );
  lines.push(
    `  <text x="${BAR_COL_X + BAR_COL_W / 2}" y="${axisY + 12}" font-size="9" font-family="system-ui, sans-serif" fill="#777" text-anchor="middle">50</text>`
  );
  lines.push(
    `  <text x="${BAR_COL_X + BAR_COL_W}" y="${axisY + 12}" font-size="9" font-family="system-ui, sans-serif" fill="#777" text-anchor="end">100</text>`
  );

  lines.push(`</svg>`);
  return lines.join("\n");
}
