import type { ReactNode } from "react";
import type { PathOutput } from "../../lib/types";
import PieChart from "./PieChart";

type Props = {
  output: PathOutput;
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

export default function PathExpanded({ output }: Props) {
  const drive = output.drive;
  const driveTensionAlsoSurfaces =
    !!drive && (drive.case === "inverted-small" || drive.case === "inverted-big");

  return (
    <div className="flex flex-col" style={{ gap: 22 }}>
      <p
        className="font-serif text-[15.5px] md:text-[16px]"
        style={{ color: "var(--ink)", lineHeight: 1.65, margin: 0 }}
      >
        {output.directionalParagraph}
      </p>
      {drive ? (
        <section className="flex flex-col" style={{ gap: 14 }}>
          <SubsectionLabel>Distribution</SubsectionLabel>
          <PieChart
            cost={drive.distribution.cost}
            coverage={drive.distribution.coverage}
            compliance={drive.distribution.compliance}
            rank={drive.claimed}
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
