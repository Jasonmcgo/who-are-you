import type {
  Answer,
  CardId,
  InnerConstitution,
  Signal,
  SignalId,
  Tension,
} from "./types";
import { questions } from "../data/questions";

const SIGNAL_DESCRIPTIONS: Record<string, string> = {
  truth_priority_high: "Appears to prioritize truth over social comfort.",
  belonging_priority_high:
    "Appears to weight belonging heavily when truth is socially costly.",
  freedom_priority: "Tends to favor freedom to act.",
  order_priority: "Tends to favor order and structure.",
  adapts_under_social_pressure:
    "May soften or withhold belief when relationships are at risk.",
  moderate_social_expression:
    "Tends to express belief carefully under social pressure.",
  high_conviction_expression:
    "Tends to state belief directly even under social cost.",
  adapts_under_economic_pressure:
    "May change position when economic security is at risk.",
  hides_belief: "May keep belief private when livelihood is exposed.",
  holds_internal_conviction:
    "Appears to retain internal conviction while limiting expression.",
  high_conviction_under_risk:
    "Appears willing to accept economic risk for belief.",
  authority_trust_high:
    "Early experience of authority as protective may shape trust in institutions.",
  authority_skepticism_moderate:
    "Early experience of authority as flawed may produce measured skepticism.",
  authority_distrust:
    "Early experience of authority as unfair may produce durable skepticism.",
  stability_baseline_high:
    "Formed in stability, which may set an internal expectation of predictability.",
  moderate_stability: "Formed in a mix of stability and uncertainty.",
  chaos_exposure:
    "Formed in uncertainty, which may shape later preferences for control or order.",
  stability_present: "Current context appears stable and manageable.",
  moderate_load: "Current context appears busy but controlled.",
  high_pressure_context:
    "Current context appears stretched or overloaded.",
  low_responsibility:
    "Few external dependents at present.",
  moderate_responsibility:
    "Some external dependents at present.",
  high_responsibility:
    "Many others depend on the user at present.",
  proactive_creator:
    "Tends to spend time building or creating.",
  responsibility_maintainer:
    "Tends to spend time maintaining existing responsibilities.",
  reactive_operator:
    "Tends to spend time reacting to incoming demands.",
  relational_investment:
    "Energy would flow toward deepening relationships and care if freed.",
  stability_restoration:
    "Energy would flow toward restoring order and stability if freed.",
  exploration_drive:
    "Energy would flow toward exploring, learning, or wandering if freed.",
  family_priority: "Holds family as a sacred value.",
  truth_priority: "Holds truth as a sacred value.",
  stability_priority: "Holds stability as a sacred value.",
  loyalty_priority: "Tends to prioritize loyalty to people over abstract commitment to truth.",
  knowledge_priority:
    "Holds knowledge — what's actually known and the discipline of seeking more — as a sacred value.",
  justice_priority:
    "Holds justice — fair weight, even when it costs to give it — as a sacred value.",
  faith_priority:
    "Holds faith — trust in what's larger than you, however framed — as a sacred value.",
};

const SACRED_PRIORITY_SIGNAL_IDS: SignalId[] = [
  "freedom_priority",
  "truth_priority",
  "stability_priority",
  "loyalty_priority",
  "family_priority",
  "knowledge_priority",
  "justice_priority",
  "faith_priority",
];

function strengthForRank(rank: number): "high" | "medium" | "low" {
  if (rank <= 1) return "high";
  if (rank <= 2) return "medium";
  return "low";
}

// Mirrors the `Strengtheners:` field declared in docs/canon/tension-library-v1.md.
// Only freeform signals are eligible in CC-004. See docs/canon/signal-and-tension-model.md § Strengtheners.
const STRENGTHENERS: Record<string, SignalId[]> = {
  "T-001": ["conviction_under_cost"],
  "T-002": ["conviction_under_cost"],
};

function signalFromAnswer(a: Answer): Signal | null {
  if (a.type !== "forced") return null;
  const q = questions.find((q) => q.question_id === a.question_id);
  if (!q || q.type !== "forced") return null;
  const opt = q.options.find((o) => o.label === a.response);
  if (!opt || !opt.signal) return null;
  return {
    signal_id: opt.signal,
    description: SIGNAL_DESCRIPTIONS[opt.signal] ?? opt.signal,
    from_card: q.card_id,
    source_question_ids: [q.question_id],
    strength: "medium",
  };
}

export function signalsFromRankingAnswer(answer: Answer): Signal[] {
  if (answer.type !== "ranking") return [];
  const q = questions.find((q) => q.question_id === answer.question_id);
  if (!q || q.type !== "ranking") return [];
  const out: Signal[] = [];
  answer.order.forEach((itemId, position) => {
    const item = q.items.find((i) => i.id === itemId);
    if (!item || !item.signal) return;
    const rank = position + 1;
    out.push({
      signal_id: item.signal,
      description: SIGNAL_DESCRIPTIONS[item.signal] ?? item.signal,
      from_card: q.card_id,
      source_question_ids: [q.question_id],
      strength: strengthForRank(rank),
      rank,
    });
  });
  return out;
}

export function extractFreeformSignals(answer: Answer): Signal[] {
  if (answer.type !== "freeform") return [];
  const text = answer.response.toLowerCase();
  const signals: Signal[] = [];

  if (text.includes("disagree") || text.includes("people around me")) {
    signals.push({
      signal_id: "independent_thought_signal",
      description: "tends to hold beliefs that differ from those around them",
      from_card: answer.card_id,
      source_question_ids: [answer.question_id],
      strength: "medium",
    });
  }

  if (
    text.includes("change my mind") ||
    text.includes("evidence") ||
    text.includes("proof")
  ) {
    signals.push({
      signal_id: "epistemic_flexibility",
      description: "open to changing beliefs when presented with evidence",
      from_card: answer.card_id,
      source_question_ids: [answer.question_id],
      strength: "medium",
    });
  }

  if (
    text.includes("lost") ||
    text.includes("cost") ||
    text.includes("risk") ||
    text.includes("job") ||
    text.includes("friends")
  ) {
    signals.push({
      signal_id: "conviction_under_cost",
      description: "has experienced cost for holding a belief",
      from_card: answer.card_id,
      source_question_ids: [answer.question_id],
      strength: "medium",
    });
  }

  return signals;
}

export function deriveSignals(answers: Answer[]): Signal[] {
  const out: Signal[] = [];
  for (const a of answers) {
    if (a.type === "ranking") {
      out.push(...signalsFromRankingAnswer(a));
      continue;
    }
    if (a.type === "freeform") {
      if (a.response.trim().length > 0) {
        out.push(...extractFreeformSignals(a));
      }
      continue;
    }
    const s = signalFromAnswer(a);
    if (s) out.push(s);
  }
  return out;
}

function has(signals: Signal[], id: SignalId): boolean {
  return signals.some((s) => s.signal_id === id);
}

function hasFromQuestion(
  signals: Signal[],
  id: SignalId,
  question_id: string
): boolean {
  return signals.some(
    (s) =>
      s.signal_id === id && s.source_question_ids.includes(question_id)
  );
}

function cardFor(signals: Signal[], id: SignalId): CardId | undefined {
  return signals.find((s) => s.signal_id === id)?.from_card;
}

function ref(signals: Signal[], id: SignalId, fallback: CardId) {
  return { signal_id: id, from_card: cardFor(signals, id) ?? fallback };
}

export function detectTensions(signals: Signal[]): Tension[] {
  const tensions: Tension[] = [];

  if (has(signals, "truth_priority_high") && has(signals, "adapts_under_social_pressure")) {
    tensions.push({
      tension_id: "T-001",
      type: "Truth vs Belonging",
      description:
        "The user values truth, but may soften or withhold it when relationships are at risk.",
      signals_involved: [
        ref(signals, "truth_priority_high", "conviction"),
        ref(signals, "adapts_under_social_pressure", "pressure"),
      ],
      confidence: "medium",
      status: "unconfirmed",
      strengthened_by: [],
      user_prompt:
        "This pattern may be present: you value truth, but adapt when social cost is high. Does this feel accurate?",
    });
  }

  const hasConvictionLeft =
    has(signals, "truth_priority_high") || has(signals, "strong_independent_conviction");
  const hasEconomicAdapt =
    has(signals, "adapts_under_economic_pressure") || has(signals, "hides_belief");
  if (hasConvictionLeft && hasEconomicAdapt) {
    tensions.push({
      tension_id: "T-002",
      type: "Conviction vs Economic Security",
      description:
        "The user may hold strong beliefs internally while limiting expression when financial security is at risk.",
      signals_involved: [
        has(signals, "truth_priority_high")
          ? ref(signals, "truth_priority_high", "conviction")
          : ref(signals, "strong_independent_conviction", "conviction"),
        has(signals, "adapts_under_economic_pressure")
          ? ref(signals, "adapts_under_economic_pressure", "pressure")
          : ref(signals, "hides_belief", "pressure"),
      ],
      confidence: "medium",
      status: "unconfirmed",
      strengthened_by: [],
      user_prompt:
        "This pattern may be present: your convictions may remain intact internally, but become more private when economic risk rises. Does this feel accurate?",
    });
  }

  const constraintSide =
    has(signals, "stability_priority") ||
    has(signals, "high_responsibility") ||
    has(signals, "high_pressure_context");
  if (constraintSide && has(signals, "freedom_priority")) {
    const leftId = has(signals, "stability_priority")
      ? "stability_priority"
      : has(signals, "high_responsibility")
      ? "high_responsibility"
      : "high_pressure_context";
    const leftCard: CardId =
      leftId === "stability_priority" ? "sacred" : "context";
    tensions.push({
      tension_id: "T-005",
      type: "Stability vs Freedom",
      description:
        "The user values freedom, but current responsibilities or stability needs may constrain how freely they can act.",
      signals_involved: [
        ref(signals, leftId, leftCard),
        ref(signals, "freedom_priority", "sacred"),
      ],
      confidence: "medium",
      status: "unconfirmed",
      strengthened_by: [],
      user_prompt:
        "This pattern may be present: you value freedom, but your responsibilities or need for stability may limit how much freedom you can actually choose. Does this feel accurate?",
    });
  }

  const aspirationCreator = hasFromQuestion(signals, "proactive_creator", "Q-A2");
  const currentMaintainer = hasFromQuestion(
    signals,
    "responsibility_maintainer",
    "Q-A1"
  );
  const currentReactive = hasFromQuestion(signals, "reactive_operator", "Q-A1");
  if (aspirationCreator && (currentMaintainer || currentReactive)) {
    const rightId = currentMaintainer
      ? "responsibility_maintainer"
      : "reactive_operator";
    tensions.push({
      tension_id: "T-006",
      type: "Creator vs Maintainer",
      description:
        "The user may see themselves as a builder or creator, while current life demands keep them in maintenance or reaction mode.",
      signals_involved: [
        ref(signals, "proactive_creator", "agency"),
        ref(signals, rightId, "agency"),
      ],
      confidence: "medium",
      status: "unconfirmed",
      strengthened_by: [],
      user_prompt:
        "This pattern may be present: part of you wants to build, but much of your life may be spent maintaining or reacting. Does this feel accurate?",
    });
  }

  if (
    has(signals, "family_priority") &&
    (has(signals, "truth_priority_high") || has(signals, "truth_priority"))
  ) {
    const rightId = has(signals, "truth_priority_high")
      ? "truth_priority_high"
      : "truth_priority";
    const rightCard: CardId =
      rightId === "truth_priority_high" ? "conviction" : "sacred";
    tensions.push({
      tension_id: "T-007",
      type: "Family vs Truth",
      description:
        "The user may experience tension when protecting family conflicts with speaking or pursuing truth.",
      signals_involved: [
        ref(signals, "family_priority", "sacred"),
        ref(signals, rightId, rightCard),
      ],
      confidence: "medium",
      status: "unconfirmed",
      strengthened_by: [],
      user_prompt:
        "This pattern may be present: family and truth both matter deeply to you, and there may be moments where protecting one feels like risking the other. Does this feel accurate?",
    });
  }

  const orderSide =
    has(signals, "order_priority") || has(signals, "stability_priority");
  const reinventionSide =
    has(signals, "freedom_priority") || has(signals, "proactive_creator");
  if (orderSide && reinventionSide) {
    const leftId = has(signals, "order_priority")
      ? "order_priority"
      : "stability_priority";
    const leftCard: CardId =
      leftId === "order_priority" ? "conviction" : "sacred";
    const rightId = has(signals, "freedom_priority")
      ? "freedom_priority"
      : "proactive_creator";
    const rightCard: CardId =
      rightId === "freedom_priority" ? "sacred" : "agency";
    tensions.push({
      tension_id: "T-008",
      type: "Order vs Reinvention",
      description:
        "The user may value order and stability while also wanting freedom to create or reinvent.",
      signals_involved: [
        ref(signals, leftId, leftCard),
        ref(signals, rightId, rightCard),
      ],
      confidence: "medium",
      status: "unconfirmed",
      strengthened_by: [],
      user_prompt:
        "This pattern may be present: you may want stable structures, but also resist structures that prevent reinvention. Does this feel accurate?",
    });
  }

  if (
    has(signals, "stability_baseline_high") &&
    (has(signals, "high_pressure_context") || has(signals, "reactive_operator"))
  ) {
    const rightId = has(signals, "high_pressure_context")
      ? "high_pressure_context"
      : "reactive_operator";
    const rightCard: CardId =
      rightId === "high_pressure_context" ? "context" : "agency";
    tensions.push({
      tension_id: "T-010",
      type: "Inherited Stability vs Present Chaos",
      description:
        "The user may have been formed in stability but currently lives under pressure, overload, or constant reaction.",
      signals_involved: [
        ref(signals, "stability_baseline_high", "formation"),
        ref(signals, rightId, rightCard),
      ],
      confidence: "medium",
      status: "unconfirmed",
      strengthened_by: [],
      user_prompt:
        "This pattern may be present: you may have a strong internal expectation for stability, while your current life feels more pressured or reactive. Does this feel accurate?",
    });
  }

  if (
    has(signals, "chaos_exposure") &&
    (has(signals, "order_priority") || has(signals, "stability_priority"))
  ) {
    const rightId = has(signals, "order_priority")
      ? "order_priority"
      : "stability_priority";
    const rightCard: CardId = rightId === "order_priority" ? "conviction" : "sacred";
    tensions.push({
      tension_id: "T-011",
      type: "Chaos Formation vs Control Need",
      description:
        "The user may value order or stability partly because early life felt uncertain or chaotic.",
      signals_involved: [
        ref(signals, "chaos_exposure", "formation"),
        ref(signals, rightId, rightCard),
      ],
      confidence: "medium",
      status: "unconfirmed",
      strengthened_by: [],
      user_prompt:
        "This pattern may be present: your desire for order may be connected to earlier experiences of uncertainty. Does this feel accurate?",
    });
  }

  const topSacred = signals.filter(
    (s) =>
      SACRED_PRIORITY_SIGNAL_IDS.includes(s.signal_id) &&
      s.rank !== undefined &&
      s.rank <= 2
  );
  const distinctTopSacredIds = Array.from(
    new Set(topSacred.map((s) => s.signal_id))
  );
  if (distinctTopSacredIds.length >= 2) {
    const seen = new Set<string>();
    const involved = topSacred.filter((s) => {
      if (seen.has(s.signal_id)) return false;
      seen.add(s.signal_id);
      return true;
    });
    tensions.push({
      tension_id: "T-012",
      type: "Sacred Value Conflict",
      description:
        "The user may hold multiple sacred values that cannot always be protected at the same time.",
      signals_involved: involved.slice(0, 4).map((s) => ({
        signal_id: s.signal_id,
        from_card: s.from_card,
      })),
      confidence: "medium",
      status: "unconfirmed",
      strengthened_by: [],
      user_prompt:
        "This pattern may be present: some of your deepest values may come into conflict when life forces a tradeoff. Does this feel accurate?",
    });
  }

  return tensions;
}

export function applyStrengtheners(
  tensions: Tension[],
  signals: Signal[]
): Tension[] {
  return tensions.map((t) => {
    const ids = STRENGTHENERS[t.tension_id];
    if (!ids || ids.length === 0) return t;
    const matching = signals.filter((s) => ids.includes(s.signal_id));
    if (matching.length === 0) return t;
    return { ...t, confidence: "high", strengthened_by: matching };
  });
}

export function deriveCoreOrientation(signals: Signal[]): string {
  const parts: string[] = [];

  if (has(signals, "truth_priority_high")) {
    parts.push("appears to prioritize truth, even when it creates social distance");
  } else if (has(signals, "belonging_priority_high")) {
    parts.push("appears to weigh belonging heavily when beliefs are contested");
  }

  if (has(signals, "freedom_priority") && !has(signals, "order_priority")) {
    parts.push("tends to value freedom to act");
  } else if (has(signals, "order_priority") && !has(signals, "freedom_priority")) {
    parts.push("tends to value order and structure");
  }

  if (has(signals, "high_conviction_under_risk")) {
    parts.push("may accept real risk rather than suppress belief");
  } else if (has(signals, "hides_belief") || has(signals, "adapts_under_economic_pressure")) {
    parts.push("may hold belief privately when livelihood is exposed");
  }

  if (has(signals, "high_pressure_context") || has(signals, "high_responsibility")) {
    parts.push("currently appears to carry significant responsibility or load");
  }

  if (has(signals, "proactive_creator")) {
    parts.push("tends to spend time building or creating");
  } else if (has(signals, "responsibility_maintainer")) {
    parts.push("tends to spend time maintaining what exists");
  } else if (has(signals, "reactive_operator")) {
    parts.push("tends to spend time reacting to demands");
  }

  if (parts.length === 0) {
    return "The available answers do not yet suggest a clear orientation. More inputs may sharpen the picture.";
  }

  return "This configuration " + parts.join("; ") + ".";
}

export function deriveSacredValues(answers: Answer[]): string[] {
  const out: string[] = [];
  for (const qid of ["Q-S1", "Q-S2"] as const) {
    const a = answers.find((x) => x.question_id === qid);
    if (!a) continue;
    if (a.type === "ranking") {
      const q = questions.find((q) => q.question_id === qid);
      if (!q || q.type !== "ranking") continue;
      for (const itemId of a.order) {
        const item = q.items.find((i) => i.id === itemId);
        if (item) out.push(item.label);
      }
    } else if (a.type !== "freeform") {
      if (a.response) out.push(a.response);
    }
  }
  return out;
}

export function buildInnerConstitution(answers: Answer[]): InnerConstitution {
  const signals = deriveSignals(answers);
  let tensions = detectTensions(signals);
  tensions = applyStrengtheners(tensions, signals);
  return {
    core_orientation: deriveCoreOrientation(signals),
    signals,
    tensions,
    sacred_values: deriveSacredValues(answers),
    bridge_signals: [],
  };
}

export function toRankingAnswer(
  question_id: string,
  order: string[]
): Answer | null {
  const q = questions.find((q) => q.question_id === question_id);
  if (!q || q.type !== "ranking") return null;
  return {
    question_id,
    card_id: q.card_id,
    question_text: q.text,
    type: "ranking",
    order,
  };
}

export function toAnswer(
  question_id: string,
  response: string
): Answer | null {
  const q = questions.find((q) => q.question_id === question_id);
  if (!q || q.type === "ranking") return null;
  return {
    question_id,
    card_id: q.card_id,
    question_text: q.text,
    response,
    type: q.type,
  };
}
