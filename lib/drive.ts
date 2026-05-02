// CC-026 — Drive Framework (claimed-vs-revealed why-axis).
//
// Most of the model's measurements expose *what*: what you protect, what you
// do, what you fear, what you trust. Drive exposes *why* — what motivates
// the exertion of energy. This file is the canonical home for the three-
// bucket drive framework (Cost / Coverage / Compliance) and the matrix that
// surfaces when claimed drive (Q-3C1) and revealed drive (15-input
// distribution) point in different directions.
//
// Architectural rules (do not relax without a canon revision):
//   - Drive is independent of sacred-value priority/stakes. Drive signal_ids
//     (cost_drive / coverage_drive / compliance_drive) are NOT in
//     SACRED_PRIORITY_SIGNAL_IDS or SACRED_IDS. Conflating would corrupt
//     compass-ranking computations.
//   - User-facing prose uses human-language phrases ("building & wealth" /
//     "the people you love" / "risk and uncertainty"). The framework terms
//     ("drive", "claimed", "revealed", "cost", "coverage", "compliance")
//     never surface to the user.
//   - Tagging table multi-tags (signals that legitimately belong to two
//     buckets) split-weight 50/50. The Four Voices (ni/ne/si/se/ti/te/fi/fe)
//     are excluded — cognitive style is a different axis, not a drive.
//
// CC-033 amendment — the cost bucket's user-facing label was renamed from
// "financial security" to "building & wealth" (the prior phrase conflated
// cost-as-ambition with compliance-as-security; security already lives in
// its own bucket). Q-Ambition1 added Success / Fame / Wealth / Legacy as
// four explicit pursuit-class signals tagged "cost". The TypeScript type
// `DriveBucket` is canon-locked at `"cost" | "coverage" | "compliance"` and
// unchanged — only human-facing labels and prose change.
//
// CC-040 amendment — the coverage bucket's user-facing label was renamed
// from "the people you love" to "people, service, and society" (chart label:
// "People, Service & Society"). Mirrors the CC-033 architectural pattern:
// relabel without re-tagging when the human label undersells the bucket's
// scope. The coverage bucket measures the full other-directed register —
// intimate-circle relational + active service + civic belonging — and the
// prior label captured only the first dimension. The hyphenated form
// "people-service-and-society" is locked for the `balanced` and `unstated`
// engine-prose templates only (list-of-three sentence parallelism); the
// unhyphenated form lives in HUMAN_LABELS and interpolates standalone into
// the four other prose templates. No re-tagging of signals.
//
// CC-035 amendment — Q-Stakes1 gained a sixth concrete-loss signal,
// `time_autonomy_stakes_priority`, tagged `"compliance"` here. Canon rule:
// time-as-autonomy is a risk-mitigation / self-direction loss register, not
// a cost-bucket ambition signal.
//
// CC-043 amendment — reverts CC-035's Time/autonomy addition (category
// mistake: time is the substrate that all three drive registers compete
// for, not a destination of drive). The signal is deleted entirely.
// Separately, retags `job_stakes_priority` from "cost" to "compliance"
// per the *security = compliance* canon principle: security and loss-
// prevention are risk-mitigation variables regardless of which domain
// the security applies to. Career-in-loss-context (the Q-Stakes1 framing)
// is dominantly stability/security register; career-as-ambition is
// captured separately by `success_priority` in Q-Ambition1. The
// `money_stakes_priority` signal stays "cost" — Money / Wealth is the
// resource frame, not the security frame; the prior compound label
// "Money / Financial security" was an overload that CC-043 also fixes
// at the Q-Stakes1 question-label level.

import type {
  Answer,
  DriveBucket,
  DriveCase,
  DriveDistribution,
  DriveOutput,
  DriveRanking,
  Signal,
  SignalId,
  Tension,
} from "./types";

// ── Case-classifier thresholds (named constants for visible tuning) ─────

// Max diff between any two slices for the case to read as "balanced".
export const BALANCED_THRESHOLD_PERCENT = 10;

// Minimum gap between the largest revealed slice and the claimed-#1 slice
// for the case to qualify as "inverted-small". Below this, the inversion
// reads as noise, not signal.
export const INVERSION_GAP_THRESHOLD_PERCENT = 15;

// ── Tagging table — SignalId → primary drive bucket ─────────────────────
//
// Each existing signal touched by one of the 15 input-equivalents is tagged
// with its drive-bucket affinity. Multi-tagged signals split-weight 50/50
// across two buckets (see MULTI_TAG_SPLITS). Excluded signals are tagged
// "exclude" — cognitive-style functions and the claimed-drive signals
// themselves (which feed Q-3C1 directly, not the revealed distribution).
//
// Rationale per multi-tag is documented in docs/canon/drive-framework.md.

type DriveTag = DriveBucket | "multi" | "exclude";

const SIGNAL_DRIVE_TAGS: Record<string, DriveTag> = {
  // Q-S3-close items — money flow within the close circle.
  self_spending_priority: "cost",
  family_spending_priority: "multi", // cost (resource concentration) + coverage (relational care)
  friends_spending_priority: "coverage",

  // Q-S3-wider items — money flow beyond the close circle.
  social_spending_priority: "coverage",
  nonprofits_religious_spending_priority: "coverage",
  companies_spending_priority: "cost",

  // Q-Stakes1 — concrete loss domains. Per the CC-043 *security = compliance*
  // canon principle, every loss-aversion-framed Q-Stakes1 item tags compliance
  // (Job, Reputation, Health) except for the resource-framed item (Money /
  // Wealth, which tags cost) and the relational-framed item (Close
  // relationships, which tags coverage).
  money_stakes_priority: "cost",
  job_stakes_priority: "compliance", // CC-043 — was "cost"; career-in-loss-context is compliance-flavored stability/security register
  close_relationships_stakes_priority: "coverage",
  reputation_stakes_priority: "compliance",
  health_stakes_priority: "compliance",

  // Q-S2 sacred values — Family/Compassion/Mercy subset.
  family_priority: "coverage",
  loyalty_priority: "coverage",

  // Q-S1 sacred values — Stability/Honor subset.
  stability_priority: "multi", // compliance (risk-mitigation) + coverage (relational stability)

  // Q-E1-inward items — inward energy buckets.
  caring_energy_priority: "multi", // coverage + cost (caring as resource investment)
  learning_energy_priority: "cost",
  enjoying_energy_priority: "coverage",

  // Q-E1-outward items — outward generative energy.
  building_energy_priority: "cost",
  solving_energy_priority: "compliance",
  restoring_energy_priority: "compliance",

  // Q-Ambition1 (CC-033) — what success looks like. All four tag cost
  // (ambition-class). None multi-tagged. Rationale documented inline + in
  // docs/canon/drive-framework.md:
  //   success_priority — achievement orientation is ambition-class.
  //   fame_priority    — recognition-seeking is ambition-class. Direction
  //                      of pull is self-elevation, not other-care.
  //   wealth_priority  — wealth-as-end is the canonical cost axis.
  //   legacy_priority  — what-outlives-you is a building-class drive.
  //                      Considered multi-tagging with coverage; rejected
  //                      because relational legacy is already captured by
  //                      family_priority and family-class signals.
  success_priority: "cost",
  fame_priority: "cost",
  wealth_priority: "cost",
  legacy_priority: "cost",

  // Q-X3 institutional trust (CC-031 multi-stage) — all institutional-trust
  // signals skew compliance (institutions exist to mitigate risk and codify
  // stability). Both parents and the cross-rank emit signals from the same
  // catalog. The four legacy signals (government_, press_, companies_,
  // nonprofits_religious_) were retired; the ten v2.5 signals replace them.
  government_elected_trust_priority: "compliance",
  government_services_trust_priority: "compliance",
  education_trust_priority: "compliance",
  nonprofits_trust_priority: "compliance",
  religious_trust_priority: "compliance",
  journalism_trust_priority: "compliance",
  news_organizations_trust_priority: "compliance",
  social_media_trust_priority: "compliance",
  small_business_trust_priority: "compliance",
  large_companies_trust_priority: "compliance",

  // Q-X4 personal trust (CC-032 multi-stage) — chosen-and-relational trust
  // skews coverage. Outside-expert is the new signal CC-032 adds. Note: the
  // pre-CC-031 entries used `friends_trust_priority` and `mentors_trust_priority`
  // (plural-with-s) which never matched the canonical singular signal IDs in
  // SIGNAL_DESCRIPTIONS — silently failing to tag during distribution-compute.
  // CC-031/032 corrects to the singular form so the tagging actually fires.
  family_trust_priority: "coverage",
  friend_trust_priority: "coverage",
  partner_trust_priority: "coverage",
  mentor_trust_priority: "coverage",
  outside_expert_trust_priority: "coverage",
  // Self-counsel is intentionally excluded — it's not an external drive.
  own_counsel_trust_priority: "exclude",

  // Cognitive-function (Lens) signals — cognitive style, not drive.
  ni: "exclude",
  ne: "exclude",
  si: "exclude",
  se: "exclude",
  ti: "exclude",
  te: "exclude",
  fi: "exclude",
  fe: "exclude",

  // Q-3C1 itself — these are CLAIMED drive, not REVEALED. Excluded so
  // the user's Q-3C1 ranking doesn't double-count into the revealed
  // distribution.
  cost_drive: "exclude",
  coverage_drive: "exclude",
  compliance_drive: "exclude",
};

const MULTI_TAG_SPLITS: Record<string, [DriveBucket, DriveBucket]> = {
  family_spending_priority: ["cost", "coverage"],
  caring_energy_priority: ["coverage", "cost"],
  stability_priority: ["compliance", "coverage"],
};

// ── Weighting ───────────────────────────────────────────────────────────
//
// Rank-aware weighting. A signal at rank 1 weighs more than a signal at
// rank 3. Without knowing the parent-question item count up front, we use
// a fixed three-tier ladder that fits the dominant 3-item ranking shape;
// rank ≥ 4 (5-item rankings) tail off to 0.5. Unranked signals (single-pick,
// freeform-tagged) weigh 1.

// Exported for consumption by lib/ocean.ts (CC-037) so the rank-aware
// weighting ladder is shared across both derivation frameworks. A future
// tuning change to the ladder propagates to both Drive and OCEAN at once.
export function weightFor(signal: Signal): number {
  if (signal.rank === undefined) return 1;
  if (signal.rank === 1) return 3;
  if (signal.rank === 2) return 2;
  if (signal.rank === 3) return 1;
  return 0.5;
}

// ── Distribution computation ────────────────────────────────────────────

export function computeDriveDistribution(
  signals: Signal[],
  // answers parameter reserved for future per-answer signal sources that
  // bypass the Signal[] flow (none in v1; kept on the public signature so
  // downstream callers don't break when v2 adds them).
  answers: Answer[]
): DriveDistribution {
  void answers;
  let cost = 0;
  let coverage = 0;
  let compliance = 0;
  let costInputs = 0;
  let coverageInputs = 0;
  let complianceInputs = 0;

  for (const sig of signals) {
    const tag = SIGNAL_DRIVE_TAGS[sig.signal_id];
    if (!tag || tag === "exclude") continue;
    const w = weightFor(sig);

    if (tag === "multi") {
      const split = MULTI_TAG_SPLITS[sig.signal_id];
      if (!split) continue;
      const [a, b] = split;
      const half = w / 2;
      const add = (bucket: DriveBucket) => {
        if (bucket === "cost") {
          cost += half;
          costInputs++;
        } else if (bucket === "coverage") {
          coverage += half;
          coverageInputs++;
        } else {
          compliance += half;
          complianceInputs++;
        }
      };
      add(a);
      add(b);
    } else {
      if (tag === "cost") {
        cost += w;
        costInputs++;
      } else if (tag === "coverage") {
        coverage += w;
        coverageInputs++;
      } else {
        compliance += w;
        complianceInputs++;
      }
    }
  }

  const total = cost + coverage + compliance;
  if (total === 0) {
    return {
      cost: 0,
      coverage: 0,
      compliance: 0,
      rankAware: false,
      inputCount: { cost: 0, coverage: 0, compliance: 0 },
    };
  }

  const costPct = (cost / total) * 100;
  const coveragePct = (coverage / total) * 100;
  const compliancePct = (compliance / total) * 100;

  // Round and reconcile to ensure the three slices sum to exactly 100.
  // Rounding three independently can drift to 99 or 101; correct on the
  // largest slice so visual chart math stays clean.
  const roundedCost = Math.round(costPct);
  const roundedCoverage = Math.round(coveragePct);
  const roundedCompliance = Math.round(compliancePct);
  const sum = roundedCost + roundedCoverage + roundedCompliance;
  const drift = 100 - sum;
  let outCost = roundedCost;
  let outCoverage = roundedCoverage;
  let outCompliance = roundedCompliance;
  if (drift !== 0) {
    if (roundedCost >= roundedCoverage && roundedCost >= roundedCompliance) {
      outCost += drift;
    } else if (roundedCoverage >= roundedCompliance) {
      outCoverage += drift;
    } else {
      outCompliance += drift;
    }
  }

  return {
    cost: outCost,
    coverage: outCoverage,
    compliance: outCompliance,
    rankAware: true,
    inputCount: {
      cost: costInputs,
      coverage: coverageInputs,
      compliance: complianceInputs,
    },
  };
}

// ── Claimed-drive extraction (Q-3C1 ranking) ────────────────────────────

const Q3C1_ITEM_TO_BUCKET: Record<string, DriveBucket> = {
  cost: "cost",
  coverage: "coverage",
  compliance: "compliance",
};

export function extractClaimedDrive(answers: Answer[]): DriveRanking | undefined {
  const a = answers.find((x) => x.question_id === "Q-3C1");
  if (!a || a.type !== "ranking") return undefined;
  if (a.order.length < 3) return undefined;
  const f = Q3C1_ITEM_TO_BUCKET[a.order[0]];
  const s = Q3C1_ITEM_TO_BUCKET[a.order[1]];
  const t = Q3C1_ITEM_TO_BUCKET[a.order[2]];
  if (!f || !s || !t) return undefined;
  return { first: f, second: s, third: t };
}

// ── Case classifier ─────────────────────────────────────────────────────

function largestBucket(d: DriveDistribution): DriveBucket {
  if (d.cost >= d.coverage && d.cost >= d.compliance) return "cost";
  if (d.coverage >= d.compliance) return "coverage";
  return "compliance";
}

function smallestBucket(d: DriveDistribution): DriveBucket {
  if (d.cost <= d.coverage && d.cost <= d.compliance) return "cost";
  if (d.coverage <= d.compliance) return "coverage";
  return "compliance";
}

function sliceFor(d: DriveDistribution, bucket: DriveBucket): number {
  if (bucket === "cost") return d.cost;
  if (bucket === "coverage") return d.coverage;
  return d.compliance;
}

export function classifyDriveCase(
  claimed: DriveRanking | undefined,
  revealed: DriveDistribution
): DriveCase {
  if (revealed.cost + revealed.coverage + revealed.compliance === 0) {
    return "unstated";
  }

  // Balanced takes precedence: when all three slices are within
  // BALANCED_THRESHOLD_PERCENT of each other, the read is balance, not
  // alignment or inversion.
  const slices = [revealed.cost, revealed.coverage, revealed.compliance];
  const max = Math.max(...slices);
  const min = Math.min(...slices);
  if (max - min <= BALANCED_THRESHOLD_PERCENT) return "balanced";

  if (!claimed) return "unstated";

  const largest = largestBucket(revealed);
  const smallest = smallestBucket(revealed);
  const claimedFirstSlice = sliceFor(revealed, claimed.first);

  // Inverted-big: claimed.third is the largest revealed bucket. The
  // motivator the user named *last* is the one their answers most expose.
  if (claimed.third === largest) return "inverted-big";

  // Inverted-small: claimed.first is the smallest revealed bucket AND the
  // gap between the largest slice and the claimed-#1 slice clears the
  // INVERSION_GAP_THRESHOLD_PERCENT bar.
  if (
    claimed.first === smallest &&
    claimed.first !== largest &&
    max - claimedFirstSlice >= INVERSION_GAP_THRESHOLD_PERCENT
  ) {
    return "inverted-small";
  }

  // Aligned: claimed.first matches the largest revealed bucket.
  if (claimed.first === largest) return "aligned";

  // Otherwise the claim is real but not the largest — partial mismatch.
  return "partial-mismatch";
}

// ── Prose generation ────────────────────────────────────────────────────
//
// Six locked templates per case. Per spec: don't substitute. If a template
// reads off-tone in browser smoke, surface for follow-up.

const HUMAN_LABELS: Record<DriveBucket, string> = {
  cost: "building & wealth",
  coverage: "people, service, and society",
  compliance: "risk and uncertainty",
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function generateDriveProse(output: DriveOutput): string {
  const { distribution, claimed } = output;
  const largest = largestBucket(distribution);
  const revFirst = HUMAN_LABELS[largest];
  const claimedFirst = claimed ? HUMAN_LABELS[claimed.first] : "";
  const claimedThird = claimed ? HUMAN_LABELS[claimed.third] : "";

  switch (output.case) {
    case "aligned":
      return `You name ${claimedFirst} as what most often guides you, and your answers reveal the same motivator — your distribution shows ${revFirst} as the largest share. The match is informative; the why you claim and the why your answers expose are pointing at the same thing.`;
    case "inverted-small":
      return `You name ${claimedFirst} as what most often guides you. Your distribution reveals a different motivator — your answers point most strongly toward ${revFirst}, with ${claimedFirst} appearing as the smallest share. There's a gap between the why you tell yourself and the why your answers expose. The model doesn't read which is closer to truth — it surfaces the gap and asks whether you want to.`;
    case "inverted-big":
      return `What you rank as third in priority is what your distribution reveals as your largest share. ${capitalize(revFirst)} dominates your answers — even though you named ${claimedThird} as third in priority. Sometimes the motivators we don't name are the motivators that have the most weight in our actual lives.`;
    case "partial-mismatch":
      return `You name ${claimedFirst} as your top drive, and your answers reveal it as a real share — but not the largest. Your distribution leans more toward ${revFirst}. The lean is informative; the question is whether it's intentional, seasonal, or a quiet drift the model is exposing.`;
    case "balanced":
      return `Your distribution is unusually balanced — building & wealth, people-service-and-society, and risk-mitigation motivators show roughly equal weight in your answers. That balance can mean disciplined integration of three competing drives, or it can mean unresolved tradeoffs the model can't see. Which feels closer?`;
    case "unstated":
    default:
      return `Your distribution across building & wealth, people-service-and-society, and risk-mitigation motivators reveals ${revFirst} as the largest share. Without your claimed drive, the model can't compare what you'd say guides you against what your answers expose.`;
  }
}

// ── Top-level: full DriveOutput, or undefined when no inputs landed ─────

export function computeDriveOutput(
  signals: Signal[],
  answers: Answer[]
): DriveOutput | undefined {
  const distribution = computeDriveDistribution(signals, answers);
  const total = distribution.cost + distribution.coverage + distribution.compliance;
  if (total === 0) return undefined;

  const claimed = extractClaimedDrive(answers);
  const driveCase = classifyDriveCase(claimed, distribution);
  const partial: DriveOutput = {
    distribution,
    claimed,
    case: driveCase,
    prose: "",
  };
  partial.prose = generateDriveProse(partial);
  return partial;
}

// ── T-D1 tension builder ────────────────────────────────────────────────
//
// Internal tension_id "T-D1"; user-facing name "Claimed and Revealed Drive"
// (CC-025 Step 2.5A — descriptive name surfaced; T-D1 ID stays internal).
// Fires only on inverted-small and inverted-big cases. The user_prompt
// follows CC-025's Allocation Gap softening pattern: "not hypocrisy" + the
// model "cannot know motive" + 6-item interpretation list + 3-state
// question. Multi-paragraph layout via "\n\n"; renderers handle pre-line.

export function buildDriveTension(output: DriveOutput): Tension | null {
  if (output.case !== "inverted-small" && output.case !== "inverted-big") {
    return null;
  }
  if (!output.claimed) return null;

  const claimedFirst = HUMAN_LABELS[output.claimed.first];
  const largest = largestBucket(output.distribution);
  const revFirst = HUMAN_LABELS[largest];
  const gapDescriptor = output.case === "inverted-small" ? "smallest" : "third";

  // The "claimed_first appears as ..." phrasing: for inverted-big the
  // claimed-first isn't the smallest slice, so we describe the gap by where
  // the claimed-first sits relative to the largest. Inverted-big's
  // descriptor uses "third" to anchor on the rank, not the share.
  const claimedFirstSliceMention =
    output.case === "inverted-small"
      ? `with ${claimedFirst} appearing as the smallest share`
      : `with ${claimedFirst} appearing as the share you named first but not the share your answers expose most`;

  // Note: the gapDescriptor variable is reserved for future template tuning
  // (e.g., copy that interpolates "smallest" vs "third" into a different
  // sentence shape). Suppressed-unused so the public template surface stays
  // forgiving to follow-up tweaks.
  void gapDescriptor;

  const userPrompt =
    `You named ${claimedFirst} as the drive that most often guides you. ` +
    `Your distribution reveals a different motivator — your answers point most strongly toward ${revFirst}, ${claimedFirstSliceMention}. ` +
    `That gap does not mean dishonesty. The model cannot know which is closer to truth.\n\n` +
    `It could mean: a season of constraint, a recent shift, a stated ideal that hasn't yet caught up to lived reality, or a real gap between the why you tell yourself and the why your answers reveal.\n\n` +
    `The only fair question is: does this feel true, partially true, or not true at all?`;

  // Reference the three claimed-drive signals so the tension's
  // signals_involved isn't empty (matches the CC-016 allocation-tension
  // shape; also useful for future strengtheners).
  const signalsInvolved: { signal_id: SignalId; from_card: "role" }[] = [
    { signal_id: "cost_drive", from_card: "role" },
    { signal_id: "coverage_drive", from_card: "role" },
    { signal_id: "compliance_drive", from_card: "role" },
  ];

  return {
    tension_id: "T-D1",
    type: "Claimed and Revealed Drive",
    description:
      "The model reads a gap between the user's claimed drive (Q-3C1 ranking) and the drive their distribution reveals across the 15 input signals.",
    signals_involved: signalsInvolved,
    confidence: "medium",
    status: "unconfirmed",
    strengthened_by: [],
    user_prompt: userPrompt,
  };
}

// ── Vocabulary helpers exported for renderers ───────────────────────────

export function humanLabelFor(bucket: DriveBucket): string {
  return HUMAN_LABELS[bucket];
}
