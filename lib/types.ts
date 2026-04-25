export type CardId =
  | "formation"
  | "context"
  | "role"
  | "temperament"
  | "conviction"
  | "pressure"
  | "contradiction"
  | "agency"
  | "sacred";

export type SignalId = string;

export type TensionId = string;

export type QuestionOption = {
  label: string;
  signal: SignalId | null;
};

export type RankingItemId = string;

export type RankingItem = {
  id: RankingItemId;
  label: string;
  gloss?: string;
  voice?: string;
  quote?: string;
  signal: SignalId;
};

export type ForcedFreeformQuestion = {
  question_id: string;
  card_id: CardId;
  type: "forced" | "freeform";
  text: string;
  options: QuestionOption[];
};

export type RankingQuestion = {
  question_id: string;
  card_id: CardId;
  type: "ranking";
  text: string;
  helper?: string;
  options?: never;
  items: RankingItem[];
};

export type Question = ForcedFreeformQuestion | RankingQuestion;

export type ForcedFreeformAnswer = {
  question_id: string;
  card_id: CardId;
  question_text: string;
  type: "forced" | "freeform";
  response: string;
};

export type RankingAnswer = {
  question_id: string;
  card_id: CardId;
  question_text: string;
  type: "ranking";
  order: RankingItemId[];
};

export type Answer = ForcedFreeformAnswer | RankingAnswer;

export type SignalStrength = "low" | "medium" | "high";

export type Signal = {
  signal_id: SignalId;
  description: string;
  from_card: CardId;
  source_question_ids: string[];
  strength: SignalStrength;
  rank?: number;
};

export type TensionConfidence = "low" | "medium" | "high";

export type TensionStatus =
  | "unconfirmed"
  | "confirmed"
  | "partially_confirmed"
  | "rejected";

export type TensionSignalRef = {
  signal_id: SignalId;
  from_card: CardId;
};

export type Tension = {
  tension_id: TensionId;
  type: string;
  description: string;
  signals_involved: TensionSignalRef[];
  confidence: TensionConfidence;
  status: TensionStatus;
  user_prompt: string;
  strengthened_by: Signal[];
};

export type InnerConstitution = {
  core_orientation: string;
  signals: Signal[];
  tensions: Tension[];
  sacred_values: string[];
  bridge_signals: string[];
};
