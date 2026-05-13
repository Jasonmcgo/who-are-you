"use client";

// CC-REPORT-PERMALINK — client wrapper for the permalink route.
//
// Holds the React state (confirmations / explainOpen) that
// InnerConstitutionPage needs as props, threads in the LLM-augment
// chain (synthesis3 master synthesis + grip-paragraph) the same way
// the admin re-render and the fresh /assessment render do, and
// finally renders InnerConstitutionPage with the saved data + the
// permalink sessionId (so the "Return to this reading" affordance
// fires here too, per CC §"both contexts").
//
// `onRestart` here points to `/` rather than restarting test state —
// a returning visitor reading their own permalinked report doesn't
// have an in-progress test to restart.

import { useState } from "react";

import InnerConstitutionPage from "../../components/InnerConstitutionPage";
import { useLlmMasterSynthesis } from "../../../lib/synthesis3LlmClient";
import { useGripParagraph } from "../../../lib/gripTaxonomyLlmClient";
import type {
  Answer,
  DemographicSet,
  InnerConstitution,
  TensionStatus,
} from "../../../lib/types";

type Confirmation = {
  status: TensionStatus;
  note?: string;
};

type Props = {
  sessionId: string;
  constitution: InnerConstitution;
  answers: Answer[];
  demographics: DemographicSet | null;
  sessionDate: Date | null;
};

export default function ReportView({
  sessionId,
  constitution,
  answers,
  demographics,
  sessionDate,
}: Props) {
  const [confirmations, setConfirmations] = useState<Record<string, Confirmation>>({});
  const [explainOpen, setExplainOpen] = useState<Record<string, boolean>>({});

  // LLM augment chain — matches admin re-render. Both hooks are
  // pass-through on cache hit and silently fire /api on cache miss.
  const synthesisAugmented = useLlmMasterSynthesis(constitution);
  const augmentedConstitution = useGripParagraph(synthesisAugmented);

  return (
    <InnerConstitutionPage
      constitution={augmentedConstitution ?? synthesisAugmented ?? constitution}
      confirmations={confirmations}
      setConfirmations={setConfirmations}
      explainOpen={explainOpen}
      setExplainOpen={setExplainOpen}
      onRestart={() => {
        if (typeof window !== "undefined") {
          window.location.href = "/";
        }
      }}
      demographics={demographics}
      sessionDate={sessionDate}
      answers={answers}
      sessionId={sessionId}
    />
  );
}
