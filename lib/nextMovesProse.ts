// CC-104-NEXT-MOVES-SHAPE-AWARE — three-register deterministic prose
// generator. Reads engine outputs + raw answers; emits paragraphs +
// oneSmallMove + reMeasureCue. No LLM calls.
//
// Per-register signal consumption (canon):
//   Load-Audit       → grip publicLabel, Q-A2, Q-Stakes1 top,
//                      Compass top (sacred_values[0]), Q-I1 freeform
//   Identity-Reframe → grip publicLabel, Q-V1 top, Q-GS1 top,
//                      Q-I1 freeform, Compass top
//   Build-Something  → Q-I1 freeform, Compass top-2 (sacred_values
//                      [0..2]), Q-Ambition1 top, named beloved when
//                      Q-V1 top === "soul_beloved_named"

import {
  computeStateLoad,
  routeNextMovesRegister,
  type NextMovesRegister,
  type NextMovesRouterOutput,
} from "./nextMovesRouter";
import { GRIP_PATTERN_BUCKETS, type GripPatternKey } from "./gripPattern";
import type { Answer, ForcedFreeformAnswer, RankingAnswer, InnerConstitution } from "./types";

export interface NextMovesProse {
  paragraphs: string[];
  oneSmallMove: string;
  reMeasureCue: string;
  registerLabel: string;
}

export interface NextMovesAttachment {
  register: NextMovesRegister;
  prose: NextMovesProse;
  routing: NextMovesRouterOutput;
}

// ─────────────────────────────────────────────────────────────────────
// Signal extraction helpers
// ─────────────────────────────────────────────────────────────────────

function getForced(answers: Answer[], qid: string): string | null {
  const a = answers.find((x) => x.question_id === qid);
  if (a && (a.type === "forced" || a.type === "freeform")) {
    return (a as ForcedFreeformAnswer).response ?? null;
  }
  return null;
}

function getRankingTop(answers: Answer[], qid: string): string | null {
  const a = answers.find((x) => x.question_id === qid);
  if (a && a.type === "ranking") {
    return (a as RankingAnswer).order[0] ?? null;
  }
  return null;
}

function trimSentence(s: string | null, maxLen = 80): string | null {
  if (!s) return null;
  const cleaned = s.replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  if (cleaned.length <= maxLen) return cleaned;
  const cut = cleaned.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

const Q_V1_HUMAN: Record<string, string> = {
  vulnerability_open_uncertainty: "letting one person see your uncertainty",
  sacred_belief_connection: "naming the belief that ties you to a person",
  soul_beloved_named: "spending one hour with your named beloved without performing",
  vulnerability_deflection: "noticing when you deflect a tender moment with a joke",
  performance_identity: "noticing when you perform instead of arrive",
  shame_disclosure: "telling one trusted person the thing you're ashamed of",
  guilt_disclosure: "owning one guilt out loud to someone safe",
};

const Q_GS1_HUMAN: Record<string, string> = {
  found_in_being: "an hour where you're not earning anything",
  found_in_belonging: "a meal with people who know you",
  found_in_meaning: "thirty minutes on the thing that matters even if no one sees",
  found_in_mastery: "one rep of the craft that you don't post",
  found_in_giving: "one small unrequested gift",
  found_in_witnessing: "thirty minutes in the presence of something larger than you",
};

const COMPASS_HUMAN: Record<string, string> = {
  Knowledge: "the question you've been avoiding",
  Truth: "the conversation you've been postponing",
  Peace: "the room you haven't sat quietly in",
  Faith: "the prayer or practice you've been skipping",
  Family: "the person you owe a call",
  Loyalty: "the friend you've been thin with",
  Honor: "the commitment you've been hedging",
  Justice: "the small wrong you could correct this week",
  Mercy: "the grace you've been withholding from yourself",
  Compassion: "the person you've been steeling against",
  Beauty: "the thing you make that no one is asking for",
  Service: "the unrequested help you could offer",
};

// ─────────────────────────────────────────────────────────────────────
// Register A — Load-Audit
// ─────────────────────────────────────────────────────────────────────

function buildLoadAudit(
  gripBucket: GripPatternKey,
  signals: {
    qa2: string | null;
    qstakes1Top: string | null;
    compassTop: string | null;
    qi1: string | null;
  }
): NextMovesProse {
  const gripLabel = GRIP_PATTERN_BUCKETS[gripBucket]?.publicLabel ?? "current grip";
  const compassPhrase =
    (signals.compassTop && COMPASS_HUMAN[signals.compassTop]) ?? null;

  const paragraphs: string[] = [];
  paragraphs.push(
    `You already know who you are. The pull toward ${gripLabel.toLowerCase()} right now isn't who you are — it's what the load is asking you to become.`
  );
  if (signals.qa2) {
    paragraphs.push(
      `Underneath the forced care, your chosen care points somewhere specific: **${signals.qa2.toLowerCase()}**. That direction is what should be growing while the load runs.`
    );
  }
  paragraphs.push(
    `Shed one piece of the load this week. The relationship, the outcome, the system will survive. The trait you're sitting on will return.`
  );

  // oneSmallMove must reference at least one user signal.
  let oneSmallMove: string;
  if (compassPhrase) {
    oneSmallMove = `Pick one place this week where you choose ${compassPhrase}, even if it costs you a half-day of obligations. Tell one person the load is heavier than it looks.`;
  } else if (signals.qa2) {
    oneSmallMove = `Pick one place this week where you protect a half-day for ${signals.qa2.toLowerCase()}, even if a current obligation has to wait.`;
  } else {
    oneSmallMove = `Pick one obligation this week that you hand back or delay. Watch what stays standing without you.`;
  }

  return {
    paragraphs,
    oneSmallMove,
    reMeasureCue:
      "Watch your Q-X2 (people depend on you) and Q-A1 (how you spend your time) on retake — those should tilt back toward chosen-action.",
    registerLabel: "Load-Audit",
  };
}

// ─────────────────────────────────────────────────────────────────────
// Register B — Identity-Reframe
// ─────────────────────────────────────────────────────────────────────

function buildIdentityReframe(
  gripBucket: GripPatternKey,
  signals: {
    qv1Top: string | null;
    qgs1Top: string | null;
    compassTop: string | null;
    qi1: string | null;
  }
): NextMovesProse {
  const gripLabel = GRIP_PATTERN_BUCKETS[gripBucket]?.publicLabel ?? "current grip";
  const qv1Phrase = signals.qv1Top ? Q_V1_HUMAN[signals.qv1Top] ?? null : null;
  const qgs1Phrase = signals.qgs1Top
    ? Q_GS1_HUMAN[signals.qgs1Top] ?? null
    : null;
  const compassPhrase =
    (signals.compassTop && COMPASS_HUMAN[signals.compassTop]) ?? null;
  const qi1Trim = trimSentence(signals.qi1, 110);

  const paragraphs: string[] = [];
  paragraphs.push(
    `The ${gripLabel.toLowerCase()} isn't a habit — it's a belief about who you are when the ${gripLabel.toLowerCase()} isn't there. That belief is testable.`
  );
  if (qi1Trim) {
    paragraphs.push(
      `You wrote: "${qi1Trim}" — the test is to act once as if that conviction is already true without performing it for an audience.`
    );
  }
  paragraphs.push(
    `Notice what's left when you stop performing the trait. The thing you've been protecting may not need protecting.`
  );

  // oneSmallMove — must include user signal substring.
  const moveParts: string[] = [];
  if (qv1Phrase) moveParts.push(qv1Phrase);
  else if (qgs1Phrase) moveParts.push(qgs1Phrase);
  else if (compassPhrase) moveParts.push(compassPhrase);

  let oneSmallMove: string;
  if (moveParts.length > 0) {
    oneSmallMove = `Run one small disproof this week: try ${moveParts[0]}, then notice what about you survives the test.`;
  } else {
    oneSmallMove = `Run one small disproof this week: act once as if the belief about yourself isn't true, then notice what's still standing.`;
  }

  return {
    paragraphs,
    oneSmallMove,
    reMeasureCue:
      "Watch your Q-V1 (top vulnerability move) and Q-GS1 (where you're found) on retake — those should soften the performance edge.",
    registerLabel: "Identity-Reframe",
  };
}

// ─────────────────────────────────────────────────────────────────────
// Register C — Build-Something
// ─────────────────────────────────────────────────────────────────────

function buildBuildSomething(signals: {
  qi1: string | null;
  compassTop: string | null;
  compassSecond: string | null;
  qambition1Top: string | null;
  namedBeloved: string | null;
}): NextMovesProse {
  const compassPhrase =
    (signals.compassTop && COMPASS_HUMAN[signals.compassTop]) ?? null;
  const compassSecondPhrase =
    (signals.compassSecond && COMPASS_HUMAN[signals.compassSecond]) ?? null;
  const qi1Trim = trimSentence(signals.qi1, 110);

  const paragraphs: string[] = [];
  paragraphs.push(
    `The grip you're feeling isn't tightness around something — it's tightness around nothing. The hand needs an anchor before it can release.`
  );
  if (qi1Trim) {
    paragraphs.push(
      `You wrote: "${qi1Trim}" — that's a candidate anchor. So is ${compassPhrase ?? "your top compass value"}. Pick one.`
    );
  } else if (compassPhrase && compassSecondPhrase) {
    paragraphs.push(
      `Your compass points at ${compassPhrase} and ${compassSecondPhrase}. One of those is your anchor. Pick one.`
    );
  }
  paragraphs.push(
    `The next move isn't to let go. It's to put your hand on one thing this week and keep it there. Movement starts from the anchor, not from the release.`
  );

  const anchorCandidate =
    signals.namedBeloved ??
    compassPhrase ??
    signals.qambition1Top ??
    "one held value";

  const oneSmallMove = `Put your hand on ${anchorCandidate} this week — one specific commitment, daily, with no performance audience. The release follows the anchor.`;

  return {
    paragraphs,
    oneSmallMove,
    reMeasureCue:
      "Watch your Q-Ambition1 (top ambition) and Q-Compass top — those should sharpen as the anchor takes hold.",
    registerLabel: "Build-Something",
  };
}

// ─────────────────────────────────────────────────────────────────────
// Public entry point
// ─────────────────────────────────────────────────────────────────────

export function buildNextMovesProse(
  constitution: InnerConstitution,
  answers: Answer[]
): NextMovesAttachment | null {
  const gripBucket = constitution.gripPattern?.bucket ?? null;
  if (gripBucket === null || gripBucket === "unmapped") {
    return null;
  }

  const voScore = constitution.victim_owner?.score;
  if (voScore === undefined || voScore === null) {
    return null;
  }

  const pathClass = constitution.coherenceReading?.pathClass ?? "trajectory";
  const aim = constitution.aimReading?.score ?? null;
  const stateLoad = computeStateLoad(answers);

  const routing = routeNextMovesRegister({
    vo: { score: voScore },
    stateLoad,
    gripBucket,
    primalCoherence: pathClass === "crisis" ? "crisis" : "trajectory",
    aim,
  });

  const sacred = (constitution as InnerConstitution & { sacred_values?: string[] })
    .sacred_values;
  const compassTop = sacred?.[0] ?? null;
  const compassSecond = sacred?.[1] ?? null;

  const commonSignals = {
    qi1: getForced(answers, "Q-I1"),
    compassTop,
  };

  let prose: NextMovesProse;
  switch (routing.register) {
    case "load-audit":
      prose = buildLoadAudit(gripBucket, {
        ...commonSignals,
        qa2: getForced(answers, "Q-A2"),
        qstakes1Top: getRankingTop(answers, "Q-Stakes1"),
      });
      break;
    case "identity-reframe":
      prose = buildIdentityReframe(gripBucket, {
        ...commonSignals,
        qv1Top: getRankingTop(answers, "Q-V1"),
        qgs1Top: getRankingTop(answers, "Q-GS1"),
      });
      break;
    case "build-something": {
      const qv1Top = getRankingTop(answers, "Q-V1");
      const namedBeloved =
        qv1Top === "soul_beloved_named"
          ? "your named beloved"
          : null;
      prose = buildBuildSomething({
        ...commonSignals,
        compassSecond,
        qambition1Top: getRankingTop(answers, "Q-Ambition1"),
        namedBeloved,
      });
      break;
    }
  }

  return { register: routing.register, prose, routing };
}
