import type { ReactNode } from "react";
import type { PathOutput } from "../../lib/types";
import { renderDriveDistributionDonut } from "../../lib/driveDistributionChart";
import PieChart from "./PieChart";

type Props = {
  output: PathOutput;
  // CC-SYNTHESIS-1-FINISH Section F — when present, replaces the pre-1F
  // `output.directionalParagraph` opening with the master synthesis
  // paragraph (Work shape + beloved object + Love shape + Risk Form
  // behavior + next-move + closing canonical phrase). The Work / Love /
  // Give detailed blocks below stay verbatim.
  masterSynthesisOverride?: string;
};

function SubsectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col" style={{ gap: 6 }}>
      <p
        className="font-mono uppercase"
        style={{
          fontSize: 10,
          letterSpacing: "0.12em",
          color: "var(--ink-mute)",
          margin: 0,
        }}
      >
        {children}
      </p>
      <span
        aria-hidden="true"
        style={{
          width: 24,
          height: 2,
          background: "var(--umber)",
          display: "block",
        }}
      />
    </div>
  );
}

function SubsectionBody({ text }: { text: string }) {
  return (
    <p
      className="font-serif text-[15px] md:text-[15.5px]"
      style={{ color: "var(--ink)", lineHeight: 1.65, margin: 0 }}
    >
      {text}
    </p>
  );
}

function Subsection({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col" style={{ gap: 10 }}>
      <SubsectionLabel>{label}</SubsectionLabel>
      <SubsectionBody text={text} />
    </div>
  );
}

export default function PathExpanded({
  output,
  masterSynthesisOverride,
}: Props) {
  const drive = output.drive;
  // CC-SYNTHESIS-3 — prefer the cached LLM Path master synthesis when it
  // reaches this component directly or via MapSection's override prop.
  // Missing cache falls back to the legacy mechanical opening.
  const openingParagraph =
    masterSynthesisOverride ??
    output.masterSynthesisLlm ??
    output.directionalParagraph;
  const driveTensionAlsoSurfaces =
    !!drive && (drive.case === "inverted-small" || drive.case === "inverted-big");

  return (
    <div className="flex flex-col" style={{ gap: 22 }}>
      <p
        className="font-serif text-[15.5px] md:text-[16px]"
        style={{ color: "var(--ink)", lineHeight: 1.65, margin: 0 }}
      >
        {openingParagraph}
      </p>
      {drive ? (
        <section className="flex flex-col" style={{ gap: 14 }}>
          <SubsectionLabel>Distribution</SubsectionLabel>
          {/* CC-PROSE-1B Follow-up A — PieChart vs donut decision.
              Option (a) — keep both. Rationale: the PieChart's per-slice
              rank badges encode the user's claimed ordering (1 / 2 / 3
              positioned ON each slice) which the donut's centered
              "Claimed #1" label does not replicate. The donut adds
              segment-percentage-by-bucket labels that the PieChart does
              not surface. The two visualizations carry different
              information; consolidating to one would lose either the
              rank-on-slice signal or the segment-percent signal.
              Re-litigate only if visual review shows duplication of
              specific signals between the two. */}
          <PieChart
            cost={drive.distribution.cost}
            coverage={drive.distribution.coverage}
            compliance={drive.distribution.compliance}
            rank={drive.claimed}
          />
          {/* CC-PROSE-1 Layer 3b — shared donut SVG composer (markdown
              parity). Renders the same donut output as the markdown side
              alongside the existing PieChart visualization. The canonical
              "Claimed #1: [bucket]" centered annotation makes the
              claimed-vs-revealed read legible without parsing the
              PieChart's rank badges. */}
          <div
            aria-hidden="false"
            dangerouslySetInnerHTML={{
              __html: renderDriveDistributionDonut(
                drive.distribution,
                drive.claimed?.first
              ),
            }}
          />
          <p
            className="font-serif text-[15px] md:text-[15.5px]"
            style={{ color: "var(--ink)", lineHeight: 1.65, margin: 0 }}
          >
            {drive.prose}
          </p>
          {driveTensionAlsoSurfaces ? (
            <p
              className="font-mono uppercase"
              style={{
                fontSize: 10,
                letterSpacing: "0.12em",
                color: "var(--ink-mute)",
                margin: 0,
              }}
            >
              Also surfaced in Open Tensions as Claimed and Revealed Drive.
            </p>
          ) : null}
        </section>
      ) : null}
      <Subsection label="Work" text={output.work} />
      <Subsection label="Love" text={output.love} />
      <Subsection label="Give" text={output.give} />
      <Subsection label="Growth move" text={output.growthCounterweight} />
    </div>
  );
}
