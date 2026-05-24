// CC-132 — React surface for the "50° Life" Individual reformat.
//
// Mirrors the 11-section markdown outline composed by
// `lib/fiftyDegreeIndividual.ts`. Both surfaces consume the same warm
// prose strings (V3 / prose / keystone rewrites) so the on-screen
// Individual and the Copy/Download markdown carry the same content.
//
// Typography: this component renders warm prose as paragraph text with
// minimal inline formatting (bold/italic). It does NOT round-trip
// markdown through a full renderer — markdown blockquotes / lists /
// nested headers inside the warm prose render as plain text. Acceptable
// for outline parity (CC-132 §AC-7); a typographic polish pass is a
// follow-up CC.

"use client";

import type {
  InnerConstitution,
  DemographicSet,
} from "../../lib/types";
import {
  FOUR_FORCES_CANON,
  extractPathBeat,
  extractPathThisWeek,
} from "../../lib/fiftyDegreeIndividual";
import { generateTrajectoryChartSvgFromConstitution } from "../../lib/trajectoryChart";
import { composeReportCallouts } from "../../lib/composeReportCallouts";
// CC-145 — single-sourced body-card + grip field map (shared with
// the markdown composer in `lib/fiftyDegreeIndividual.ts` so the
// two surfaces can't drift on Strength / Growth Edge / Practice).
import {
  BODY_CARDS,
  bodyCardFieldsFor,
  bodyGripBlockFor,
} from "../../lib/bodyCardFieldMap";
import { renderDriveDistributionDonut } from "../../lib/driveDistributionChart";
import { renderOceanDashboardSVG } from "../../lib/oceanDashboard";
import { composeDispositionSummaryLine } from "../../lib/renderMirror";
import type { ProseCardId } from "../../lib/proseRewriteLlm";
// CC-146 Part A — warm 4-card splice for the Individual. Mirrors the
// Guide's MapSection pattern (`<LlmProseBlock>` instead of engine prose
// per card when a warm rewrite is present).
import LlmProseBlock from "./LlmProseBlock";
// CC-146 Part B — claimed-vs-revealed drive prose, lifted from the
// engine's drive output (the same `path.drive.prose` the Guide emits;
// imported as `generateDriveProse` so an unstated/missing-prose fixture
// still renders the case-aware template).
import { generateDriveProse } from "../../lib/drive";

export interface FiftyDegreeIndividualSectionProps {
  constitution: InnerConstitution;
  demographics?: DemographicSet | null;
  generatedAt: Date;
  liveRewrites: {
    executiveRead: string | null;
    corePattern: string | null;
    pathTriptych: string | null;
    keystone: string | null;
    closingRead: string | null;
    synthesis: string | null;
    // CC-146 Part A — warm scoped rewrites for the 4 deep cards.
    // `lens / compass / hands` map 1:1 to BodyCards entries; `path` is
    // accepted for parity with the Guide's MapSection but has no
    // body-card slot in BODY_CARDS, so it is currently a no-op in the
    // Individual's render (Path content sits in §Work, Love, and Giving
    // and is fed by `pathTriptych`).
    lens: string | null;
    compass: string | null;
    hands: string | null;
    path: string | null;
  };
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function displayName(demographics?: DemographicSet | null): string {
  if (!demographics) return "You";
  const ans = demographics.answers ?? [];
  const lookup = (id: string): string | null => {
    const a = ans.find((x) => x.field_id === id);
    if (!a) return null;
    if (typeof a.value !== "string") return null;
    return a.value.trim() || null;
  };
  return (
    lookup("first_name") ?? lookup("firstName") ?? lookup("name") ?? "You"
  );
}

function possessiveName(name: string): string {
  if (name === "You") return "Your";
  if (name.endsWith("s")) return `${name}'`;
  return `${name}'s`;
}

function bandLabel(score: number | null | undefined): string {
  if (score == null) return "Quiet — thin signal in this register.";
  if (score >= 70) return "Strong.";
  if (score >= 55) return "Present.";
  if (score >= 40) return "Mixed.";
  return "Quiet — the growth edge.";
}

function aimBandLabel(score: number | null | undefined): string {
  if (score == null) return "Quiet — thin signal in this register.";
  if (score >= 70) return "Open-handed — Aim is doing real work.";
  if (score >= 55) return "Present — Aim is holding the line.";
  if (score >= 40) return "Mixed — Aim is partial.";
  return "The growth edge — Aim is the line you'd most like to lift.";
}

function firstSentence(s: string): string {
  if (!s) return "";
  const idx = s.search(/[.!?](\s|$)/);
  if (idx < 0) return s.trim();
  return s.slice(0, idx + 1).trim();
}

function stripAccuracyPrompt(prompt: string): string {
  return prompt
    .replace(
      /\n+\s*(Does this (feel|read) accurate.*|Is that how[^\n]*|Does this match[^\n]*|Does this read like .*)\??\s*$/i,
      ""
    )
    .replace(
      /\s+(Does this (feel|read) accurate\??|Is that how (it|that) reads\??|Does this match (your|the) read\??|Does this read like .+?\?)\s*$/i,
      ""
    )
    .trim();
}

// Render a string with markdown-style inline emphasis (**bold**, *italic*).
// Used for warm prose paragraphs and table cells.
function renderInline(text: string): React.ReactNode {
  const out: React.ReactNode[] = [];
  let i = 0;
  let keyCounter = 0;
  while (i < text.length) {
    const remaining = text.slice(i);
    const bold = remaining.match(/^\*\*([^*]+)\*\*/);
    if (bold) {
      out.push(<strong key={`b${keyCounter++}`}>{bold[1]}</strong>);
      i += bold[0].length;
      continue;
    }
    const italic = remaining.match(/^\*([^*]+)\*/);
    if (italic) {
      out.push(<em key={`i${keyCounter++}`}>{italic[1]}</em>);
      i += italic[0].length;
      continue;
    }
    // Take everything up to the next * marker (or end).
    const nextMarker = remaining.search(/\*/);
    const chunkEnd = nextMarker < 0 ? remaining.length : nextMarker;
    out.push(remaining.slice(0, chunkEnd));
    i += chunkEnd;
    if (chunkEnd === 0 && nextMarker === 0) {
      // Bail to avoid infinite loop on malformed input — consume one char.
      out.push(remaining[0]);
      i += 1;
    }
  }
  return out;
}

function paragraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

export default function FiftyDegreeIndividualSection({
  constitution,
  demographics,
  generatedAt,
  liveRewrites,
}: FiftyDegreeIndividualSectionProps) {
  const name = displayName(demographics);
  const possessive = possessiveName(name);

  return (
    <div className="flex flex-col" style={{ gap: 32 }}>
      <Cover name={name} />
      <Epigraph executiveRead={liveRewrites.executiveRead} />
      <HowToRead name={name} constitution={constitution} />
      <Trajectory possessive={possessive} constitution={constitution} />
      <PatternAndGrip
        possessive={possessive}
        constitution={constitution}
        corePattern={liveRewrites.corePattern}
      />
      <BodyCards
        constitution={constitution}
        warmRewrites={{
          lens: liveRewrites.lens,
          compass: liveRewrites.compass,
          hands: liveRewrites.hands,
        }}
      />
      <DispositionSignalMix constitution={constitution} />
      <WorkLoveGiving
        constitution={constitution}
        pathTriptych={liveRewrites.pathTriptych}
      />
      <OpenTensions constitution={constitution} />
      <Keystone constitution={constitution} keystone={liveRewrites.keystone} />
      <NextMoves constitution={constitution} pathTriptych={liveRewrites.pathTriptych} />
      <Closing closingRead={liveRewrites.closingRead} synthesis={liveRewrites.synthesis} />
      <Footer name={name} generatedAt={generatedAt} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="font-serif"
      style={{
        fontSize: 22,
        margin: "0 0 8px 0",
        color: "var(--ink)",
      }}
    >
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="font-serif"
      style={{
        fontSize: 17,
        margin: "16px 0 4px 0",
        color: "var(--ink)",
      }}
    >
      {children}
    </h3>
  );
}

function P({ text }: { text: string }) {
  return (
    <p
      className="font-serif"
      style={{ fontSize: 16, lineHeight: 1.6, margin: "0 0 8px 0" }}
    >
      {renderInline(text)}
    </p>
  );
}

function Quote({ text }: { text: string }) {
  return (
    <blockquote
      className="font-serif italic"
      style={{
        margin: "0 0 8px 0",
        padding: "0 0 0 16px",
        borderLeft: "3px solid var(--rule)",
        fontSize: 16,
        color: "var(--ink-soft)",
      }}
    >
      {renderInline(text)}
    </blockquote>
  );
}

function Cover({ name }: { name: string }) {
  // Cover (CC-133): "The Inner Constitution" comes from the page header;
  // here we render FOR {NAME} only. NO bucket/type label — the Epigraph
  // (below) leads instead. Type label parked until the engine can derive a
  // per-person label.
  return (
    <div className="flex flex-col items-center text-center" style={{ gap: 6 }}>
      <p
        className="font-mono uppercase"
        style={{
          fontSize: 12,
          letterSpacing: "0.12em",
          color: "var(--ink-mute)",
          margin: "8px 0 0 0",
        }}
      >
        FOR {name.toUpperCase()}
      </p>
    </div>
  );
}

// Epigraph (CC-133): the Executive Read pull-quote, relocated off the
// cover to sit just under it as the report's opening thesis line.
function Epigraph({ executiveRead }: { executiveRead: string | null }) {
  if (!executiveRead) return null;
  const m = executiveRead.match(/^> \*([^\n]+)\*/m);
  const quote = m ? m[1].trim() : null;
  if (!quote) return null;
  return (
    <blockquote
      className="font-serif italic"
      style={{
        margin: "0 auto",
        padding: "0 24px",
        fontSize: 16,
        lineHeight: 1.6,
        color: "var(--ink-soft)",
        maxWidth: 600,
        textAlign: "center",
      }}
    >
      {renderInline(quote)}
    </blockquote>
  );
}

function HowToRead({
  name,
  constitution,
}: {
  name: string;
  constitution: InnerConstitution;
}) {
  const dash = constitution.goalSoulMovement?.dashboard;
  const aim = constitution.aimReading?.score;
  const grip = constitution.gripPattern;
  const reads: Record<"goal" | "soul" | "aim" | "grip", string> = {
    goal: bandLabel(dash?.goalScore),
    soul: bandLabel(dash?.soulScore),
    aim: aimBandLabel(aim),
    grip: grip?.renderedLabel
      ? `${grip.renderedLabel}: ${firstSentence(grip.underlyingQuestion ?? "")}`
      : "Quiet — no dominant grip cluster fired.",
  };
  const readColumn =
    name === "You" ? "YOUR READ" : `${name.toUpperCase()}'S READ`;
  const keys = ["goal", "soul", "aim", "grip"] as const;
  return (
    <section>
      <H2>How to Read This Report</H2>
      <p
        className="font-serif italic"
        style={{ fontSize: 15, color: "var(--ink-soft)", margin: "0 0 12px 0" }}
      >
        Four forces shape every life. The table below names them and what
        each one looks like for you.
      </p>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 14,
          marginBottom: 8,
        }}
      >
        <thead>
          <tr>
            <th style={cellStyle({ header: true, width: "14%" })}>Force</th>
            <th style={cellStyle({ header: true })}>What it means</th>
            <th style={cellStyle({ header: true, width: "28%" })}>{readColumn}</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => {
            const f = FOUR_FORCES_CANON[k];
            return (
              <tr key={k}>
                <td style={cellStyle()}>
                  <strong>{f.label}</strong>
                </td>
                <td style={cellStyle()}>{renderInline(f.what)}</td>
                <td style={cellStyle()}>{renderInline(reads[k])}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function cellStyle({
  header = false,
  width,
}: { header?: boolean; width?: string } = {}): React.CSSProperties {
  return {
    border: "1px solid var(--rule)",
    padding: "8px 10px",
    verticalAlign: "top",
    textAlign: "left",
    fontWeight: header ? 600 : 400,
    background: header ? "var(--paper-soft, #f6f3ee)" : undefined,
    width,
  };
}

function Trajectory({
  possessive,
  constitution,
}: {
  possessive: string;
  constitution: InnerConstitution;
}) {
  const dash = constitution.goalSoulMovement?.dashboard;
  if (!dash) return null;
  const limiter = dash.movementLimiter;
  const callouts = composeReportCallouts(constitution);
  const finalLine = callouts.finalLine;
  const svg = generateTrajectoryChartSvgFromConstitution(constitution);
  const gripReading = constitution.gripReading;
  const quadrant = constitution.movementQuadrant?.label;

  return (
    <section>
      <H2>{possessive} Trajectory</H2>
      <ul style={{ paddingLeft: 18, margin: "0 0 8px 0", fontSize: 14 }}>
        <li>
          <strong>Goal:</strong> {dash.goalScore} / 100
        </li>
        <li>
          <strong>Soul:</strong> {dash.soulScore} / 100
        </li>
        <li>
          <strong>Direction:</strong> {Math.round(dash.direction.angle)}° (
          {dash.direction.descriptor})
        </li>
        {limiter ? (
          <>
            <li>
              <strong>Movement:</strong> Usable {limiter.usableMovement.toFixed(1)} / 100 ({limiter.usableDescriptor})
            </li>
            <li style={{ marginLeft: 16, opacity: 0.85 }}>
              Potential {limiter.potentialMovement.toFixed(1)} (-{limiter.dragPercent}% drag)
            </li>
          </>
        ) : null}
        {quadrant ? (
          <li>
            <strong>Quadrant:</strong> {quadrant}
          </li>
        ) : null}
        {constitution.aimReading ? (
          <li>
            <strong>Aim:</strong> {constitution.aimReading.score.toFixed(1)} / 100
          </li>
        ) : null}
        {gripReading ? (
          <li>
            <strong>Grip:</strong> {gripReading.score.toFixed(1)} / 100
          </li>
        ) : null}
      </ul>
      <div
        style={{ margin: "12px 0", maxWidth: 480 }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {constitution.goalSoulMovement?.prose
        ? paragraphs(constitution.goalSoulMovement.prose).map((p, i) => (
            <P key={i} text={p} />
          ))
        : null}
      {finalLine ? <Quote text={`*${finalLine}*`} /> : null}
    </section>
  );
}

function PatternAndGrip({
  possessive,
  constitution,
  corePattern,
}: {
  possessive: string;
  constitution: InnerConstitution;
  corePattern: string | null;
}) {
  const grip = constitution.gripPattern;
  const taxonomy = constitution.gripTaxonomy;
  const rows: Array<{ grip: string; aim: string }> = [];
  if (taxonomy?.distortedStrategy?.text) {
    const giftLabel = taxonomy.healthyGift?.trim() ?? "";
    const aimCell = giftLabel.length > 0
      ? `Same protection, lighter hand — held as ${giftLabel} rather than as defense.`
      : "Same protection without the cost — held with a lighter hand.";
    rows.push({ grip: taxonomy.distortedStrategy.text, aim: aimCell });
  }
  // CC-145 — full Grip block sourced from `bodyGripBlockFor` so the
  // React surface matches the markdown composer's emit.
  const block = bodyGripBlockFor(constitution);
  return (
    <section>
      <H2>{possessive} Pattern</H2>
      {corePattern
        ? paragraphs(corePattern).map((p, i) => <P key={i} text={p} />)
        : null}
      {grip ? (
        <>
          <H2>{possessive} Grip</H2>
          {grip.underlyingQuestion ? (
            <Quote text={grip.underlyingQuestion} />
          ) : null}
          {rows.length > 0 ? (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
                marginTop: 8,
                marginBottom: 12,
              }}
            >
              <thead>
                <tr>
                  <th style={cellStyle({ header: true })}>GRIP SAYS</th>
                  <th style={cellStyle({ header: true })}>AIM SAYS</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td style={cellStyle()}>{renderInline(r.grip)}</td>
                    <td style={cellStyle()}>{renderInline(r.aim)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          {block ? (
            <>
              <P text={block.narrative} />
              <p
                className="font-serif"
                style={{ fontSize: 15, lineHeight: 1.6, margin: "8px 0 4px 0" }}
              >
                <strong>Surface Grip:</strong> {renderInline(block.surfaceGrip)}
              </p>
              <p
                className="font-serif"
                style={{ fontSize: 15, lineHeight: 1.6, margin: "4px 0" }}
              >
                <strong>Grip Pattern:</strong> {renderInline(block.patternLabel)}
              </p>
              <p
                className="font-serif"
                style={{ fontSize: 15, lineHeight: 1.6, margin: "4px 0" }}
              >
                <strong>Underlying Question:</strong>{" "}
                {renderInline(block.underlyingQuestion)}
              </p>
              {block.distortedStrategy.length > 0 ? (
                <p
                  className="font-serif"
                  style={{ fontSize: 15, lineHeight: 1.6, margin: "4px 0" }}
                >
                  <strong>Distorted Strategy:</strong>{" "}
                  {renderInline(block.distortedStrategy)}
                </p>
              ) : null}
              {block.healthyGift.length > 0 ? (
                <p
                  className="font-serif"
                  style={{ fontSize: 15, lineHeight: 1.6, margin: "4px 0" }}
                >
                  <strong>Healthy Gift:</strong>{" "}
                  {renderInline(block.healthyGift)}
                </p>
              ) : null}
              {block.contributingGrips.length > 0 ? (
                <p
                  className="font-serif"
                  style={{ fontSize: 15, lineHeight: 1.6, margin: "4px 0" }}
                >
                  <strong>Contributing grips:</strong>{" "}
                  {block.contributingGrips.join(", ")}
                </p>
              ) : null}
              {block.subRegister ? (
                <p
                  className="font-serif"
                  style={{ fontSize: 15, lineHeight: 1.6, margin: "4px 0" }}
                >
                  <strong>Sub-register:</strong> {renderInline(block.subRegister)}
                </p>
              ) : null}
              <p
                className="font-serif"
                style={{ fontSize: 15, lineHeight: 1.6, margin: "4px 0" }}
              >
                <strong>Confidence:</strong> {renderInline(block.confidence)}
              </p>
            </>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function BodyCards({
  constitution,
  warmRewrites,
}: {
  constitution: InnerConstitution;
  // CC-146 Part A — warm prose per card. When non-null/non-empty for a
  // given source, the card body renders the warm LLM rewrite via
  // <LlmProseBlock> in place of the engine Strength / Growth Edge /
  // Practice trio (mirrors MapSection's per-card treatment in the
  // Guide). Sources without a warm slot — gravity / trust / weather /
  // fire / conviction — always render engine prose.
  warmRewrites?: {
    lens: string | null;
    compass: string | null;
    hands: string | null;
  };
}) {
  return (
    <section>
      <H2>Why This Is Happening — The Body Cards</H2>
      <p
        className="font-serif italic"
        style={{ fontSize: 14, color: "var(--ink-soft)", margin: "0 0 8px 0" }}
      >
        Eight body parts, eight pressure points. Each card names one register
        of your shape — the question that lives there, the strength it carries,
        the growth edge it surfaces, and a practice you can apply.
      </p>
      <div style={{ display: "grid", gap: 12 }}>
        {BODY_CARDS.map((card, i) => {
          const num = String(i + 1).padStart(2, "0");
          const fields = bodyCardFieldsFor(card.source, constitution);
          // CC-146 Part A — pick the warm rewrite slot for the 3 deep
          // cards that have one (lens / compass / hands). Falsy →
          // engine prose; truthy → LlmProseBlock replaces the trio.
          const warm =
            card.source === "lens"
              ? warmRewrites?.lens
              : card.source === "compass"
                ? warmRewrites?.compass
                : card.source === "hands"
                  ? warmRewrites?.hands
                  : null;
          const useWarm = typeof warm === "string" && warm.trim().length > 0;
          return (
            <div
              key={card.source}
              style={{
                border: "1px solid var(--rule)",
                borderRadius: 4,
                padding: "10px 14px",
              }}
            >
              <p
                className="font-mono uppercase"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  color: "var(--ink-mute)",
                  margin: "0 0 4px 0",
                }}
              >
                {num} · {card.name} · {card.body}
              </p>
              {fields ? (
                <>
                  <p
                    className="font-serif italic"
                    style={{
                      fontSize: 15,
                      color: "var(--ink-soft)",
                      margin: "0 0 6px 0",
                    }}
                  >
                    {fields.question}
                  </p>
                  <p
                    className="font-serif italic"
                    style={{
                      fontSize: 15,
                      color: "var(--ink-soft)",
                      margin: "0 0 10px 0",
                    }}
                  >
                    {fields.readLede}
                  </p>
                  {useWarm ? (
                    <LlmProseBlock markdown={warm as string} />
                  ) : (
                    <>
                      <p
                        className="font-serif"
                        style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 8px 0" }}
                      >
                        <strong>Strength</strong> — {renderInline(fields.strength)}
                      </p>
                      <p
                        className="font-serif"
                        style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 8px 0" }}
                      >
                        <strong>Growth Edge</strong> — {renderInline(fields.growthEdge)}
                      </p>
                      <p
                        className="font-serif"
                        style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 0 0" }}
                      >
                        <strong>{fields.practiceLabel}</strong> — {renderInline(fields.practice)}
                      </p>
                    </>
                  )}
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// CC-145 — Disposition Signal Mix React mirror. Renders the same
// compact section the markdown composer emits: summary line + SVG.
function DispositionSignalMix({
  constitution,
}: {
  constitution: InnerConstitution;
}) {
  const mix = constitution.ocean?.dispositionSignalMix;
  if (!mix) return null;
  const svg = renderOceanDashboardSVG(mix);
  const summary = composeDispositionSummaryLine(mix);
  return (
    <section>
      <H2>Disposition Signal Mix</H2>
      <p
        className="font-serif italic"
        style={{ fontSize: 15, color: "var(--ink-soft)", margin: "0 0 8px 0" }}
      >
        {summary}
      </p>
      <div
        style={{ margin: "8px 0", maxWidth: 480 }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </section>
  );
}

function WorkLoveGiving({
  constitution,
  pathTriptych,
}: {
  constitution: InnerConstitution;
  pathTriptych: string | null;
}) {
  // CC-145 — Drive distribution donut renders at the top of this
  // section when Path drive data is available (mirrors the markdown
  // composer's placement).
  const drive = constitution.shape_outputs?.path.drive;
  const beats: Array<{ label: string; text: string }> = [];
  if (pathTriptych) {
    for (const label of ["Work", "Love", "Give"] as const) {
      const body = extractPathBeat(pathTriptych, label);
      if (body) {
        beats.push({
          label: label === "Give" ? "Giving" : label,
          text: body,
        });
      }
    }
  }
  if (!drive && beats.length === 0) return null;
  // CC-146 Part B — claimed-vs-revealed drive prose. Mirrors the
  // Guide's renderMirror.ts ~L1870-1890 emit so the Individual carries
  // the same Distribution / Claimed lines + case-aware narrative.
  const DRIVE_LABELS: Record<"cost" | "coverage" | "compliance", string> = {
    cost: "Building & wealth",
    coverage: "People, Service & Society",
    compliance: "Risk and uncertainty",
  };
  const driveProse = drive ? generateDriveProse(drive) : null;
  return (
    <section>
      <H2>Work, Love, and Giving</H2>
      {drive ? (
        <div
          style={{ margin: "0 0 16px 0", maxWidth: 480 }}
          dangerouslySetInnerHTML={{
            __html: renderDriveDistributionDonut(
              drive.distribution,
              drive.claimed?.first
            ),
          }}
        />
      ) : null}
      {drive ? (
        <>
          <p
            className="font-serif"
            style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 6px 0" }}
          >
            [Distribution: Building & wealth {drive.distribution.cost}%, People,
            Service & Society {drive.distribution.coverage}%, Risk and
            uncertainty {drive.distribution.compliance}%]
          </p>
          {drive.claimed ? (
            <p
              className="font-serif"
              style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 10px 0" }}
            >
              Claimed drive: 1. {DRIVE_LABELS[drive.claimed.first]} · 2.{" "}
              {DRIVE_LABELS[drive.claimed.second]} · 3.{" "}
              {DRIVE_LABELS[drive.claimed.third]}
            </p>
          ) : null}
          {driveProse ? <P text={driveProse} /> : null}
        </>
      ) : null}
      {beats.map((b, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <p
            className="font-serif"
            style={{ fontSize: 16, lineHeight: 1.6, margin: 0 }}
          >
            <strong>{b.label}.</strong> {renderInline(b.text)}
          </p>
        </div>
      ))}
    </section>
  );
}

function OpenTensions({ constitution }: { constitution: InnerConstitution }) {
  const HYPOCRISY = new Set(["T-013", "T-014", "T-016"]);
  const open = (constitution.tensions ?? []).filter(
    (t) =>
      (t.status === undefined || t.status === "unconfirmed") &&
      !HYPOCRISY.has(t.tension_id)
  );
  if (open.length === 0) return null;
  return (
    <section>
      <H2>Open Tensions Worth Watching</H2>
      {open.map((t) => (
        <div key={t.tension_id} style={{ marginBottom: 16 }}>
          <H3>{t.type.toUpperCase()}</H3>
          <P text={stripAccuracyPrompt(t.user_prompt)} />
        </div>
      ))}
    </section>
  );
}

function Keystone({
  constitution,
  keystone,
}: {
  constitution: InnerConstitution;
  keystone: string | null;
}) {
  const belief = constitution.belief_under_tension;
  if (!belief?.belief_text) return null;
  if (!keystone) return null;
  // Dedup: if warm prose already opens with a blockquote echoing the
  // belief, skip our own blockquote.
  const beliefStart = belief.belief_text.trim().slice(0, 30);
  const warmStartsWithBelief =
    keystone.startsWith("> ") &&
    keystone.split("\n", 1)[0].includes(beliefStart);
  return (
    <section>
      <H2>Keystone Reflection</H2>
      {!warmStartsWithBelief ? <Quote text={belief.belief_text} /> : null}
      {paragraphs(keystone).map((p, i) => {
        if (p.startsWith("> ")) {
          return <Quote key={i} text={p.replace(/^>\s*/gm, "").trim()} />;
        }
        return <P key={i} text={p} />;
      })}
    </section>
  );
}

function NextMoves({
  constitution,
  pathTriptych,
}: {
  constitution: InnerConstitution;
  pathTriptych: string | null;
}) {
  const moves = constitution.mirror?.yourNext3Moves ?? [];
  if (moves.length === 0) return null;
  const thisWeek = pathTriptych ? extractPathThisWeek(pathTriptych) : null;
  const oneSmallMove = constitution.nextMoves?.prose.oneSmallMove ?? null;
  const practice = thisWeek ?? oneSmallMove;
  return (
    <section>
      <H2>Your Next Three Moves — From Grip to Aim</H2>
      {moves.map((m, i) => (
        <div key={i} style={{ marginBottom: 16 }}>
          <H3>{`${i + 1}. ${m.label}`}</H3>
          <P text={m.paragraph} />
          {i === 0 && practice ? (
            <p
              className="font-serif"
              style={{ fontSize: 15, margin: "4px 0 0 0" }}
            >
              <strong>Practice.</strong> {renderInline(practice)}
            </p>
          ) : null}
        </div>
      ))}
    </section>
  );
}

function Closing({
  closingRead,
  synthesis,
}: {
  closingRead: string | null;
  synthesis: string | null;
}) {
  if (!closingRead && !synthesis) return null;
  return (
    <section>
      <H2>Closing Read</H2>
      {closingRead
        ? paragraphs(closingRead).map((p, i) => <P key={`c${i}`} text={p} />)
        : null}
      {synthesis
        ? paragraphs(
            synthesis.replace(
              /^\*one cross-card read, with the parallel-line close\.\*\n?/m,
              ""
            )
          ).map((p, i) => <P key={`s${i}`} text={p} />)
        : null}
    </section>
  );
}

function Footer({
  name,
  generatedAt,
}: {
  name: string;
  generatedAt: Date;
}) {
  const date = generatedAt.toISOString().slice(0, 10);
  const verb = name === "You" ? "CONFIRM" : "CONFIRMS";
  return (
    <div
      style={{
        borderTop: "1px solid var(--rule)",
        paddingTop: 12,
        fontFamily: "monospace",
        fontSize: 11,
        letterSpacing: "0.08em",
        color: "var(--ink-mute)",
        textAlign: "center",
        fontStyle: "italic",
      }}
    >
      THE MODEL PROPOSES — {name.toUpperCase()} {verb} · GENERATED {date}
    </div>
  );
}

// Re-export the ProseCardId reference so tsc doesn't flag the import as
// unused — kept for downstream consumers that thread the same enum.
export type { ProseCardId };
