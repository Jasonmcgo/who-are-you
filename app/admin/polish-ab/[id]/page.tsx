// CC-057b — Admin A/B harness page for the Humanity Rendering Layer.
// Server component: loads the saved session, builds the EngineRenderedReport,
// runs both providers in parallel via runAB, and renders the three-column
// comparison (engine baseline / GPT-4-class polish / Claude-class polish).
//
// Admin-only. The route is reachable only via direct URL like the existing
// /admin/sessions/[id] pattern. Not wired into any user-facing nav.
//
// **Substance is locked** — the harness's role is to judge tonal calibration
// only. The validation pass enforces structural identity; if a polished
// output failed validation, that column shows the engine baseline plus the
// validation reason.

import { eq } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "../../../../db";
import { sessions as sessionsTable } from "../../../../db/schema";
import { runAB } from "../../../../lib/humanityRendering/abHarness";
import { buildEngineRenderedReport } from "../../../../lib/humanityRendering/contract";
import {
  buildInnerConstitution,
  getFunctionPairRegister,
  getTopCompassValues,
} from "../../../../lib/identityEngine";
import type {
  Answer,
  InnerConstitution,
  MetaSignal,
} from "../../../../lib/types";
import type {
  ABRunResult,
  PolishRunResult,
  SignalSummary,
} from "../../../../lib/humanityRendering/types";
import NotesPanel from "./NotesPanel";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PolishABPage({ params }: PageProps) {
  const { id } = await params;

  let db;
  try {
    db = getDb();
  } catch (e) {
    return <ErrorView message={e instanceof Error ? e.message : "Database connection failed."} sessionId={id} />;
  }

  const rows = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, id))
    .limit(1);
  if (rows.length === 0) {
    return <ErrorView message="Session not found." sessionId={id} />;
  }
  const session = rows[0];
  const answers = (session.answers ?? []) as Answer[];
  const metaSignals = (session.meta_signals ?? []) as MetaSignal[];

  // Re-derive the constitution against the current engine code (CODEX-050
  // pattern). Build the EngineRenderedReport from it.
  const constitution: InnerConstitution = buildInnerConstitution(answers, metaSignals);
  const signalSummary = buildSignalSummary(constitution);
  const engineReport = buildEngineRenderedReport(constitution, signalSummary);

  // Run both providers. When API keys are unset, both return engine
  // baseline with a "no API key" reason — the page still renders, just
  // without polish content.
  const ab: ABRunResult = await runAB(engineReport);

  return (
    <main
      className="min-h-screen"
      style={{ background: "var(--paper)", color: "var(--ink)" }}
    >
      <header
        className="flex flex-row items-center justify-between"
        style={{
          padding: "16px 28px",
          borderBottom: "1px solid var(--rule)",
          gap: 16,
        }}
      >
        <div className="flex flex-col" style={{ gap: 4 }}>
          <p
            className="font-mono uppercase"
            style={{
              fontSize: 11,
              letterSpacing: "0.16em",
              color: "var(--ink-mute)",
              margin: 0,
            }}
          >
            Polish A/B — judge tonal calibration; substance is locked
          </p>
          <p
            className="font-serif italic"
            style={{
              fontSize: 13,
              color: "var(--ink-soft)",
              margin: 0,
            }}
          >
            session {id} · admin-only · provider deferred per CC-057a/b
          </p>
        </div>
        <Link
          href={`/admin/sessions/${id}`}
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            color: "var(--ink-mute)",
            textDecoration: "underline",
          }}
        >
          ← back to session detail
        </Link>
      </header>

      <div
        style={{
          padding: "20px 28px 48px 28px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 16,
        }}
      >
        <ColumnView
          title="Engine Baseline"
          subtitle="structural read; no polish"
          report={ab.engineBaseline.proseSlots}
          run={null}
        />
        <ColumnView
          title="GPT-4-class polish"
          subtitle={`${ab.openai.cost.provider}/${ab.openai.cost.model}`}
          report={ab.openai.report.proseSlots}
          run={ab.openai}
        />
        <ColumnView
          title="Claude-class polish"
          subtitle={`${ab.anthropic.cost.provider}/${ab.anthropic.cost.model}`}
          report={ab.anthropic.report.proseSlots}
          run={ab.anthropic}
        />
      </div>

      <div style={{ padding: "0 28px 32px 28px" }}>
        <NotesPanel sessionId={id} />
      </div>
    </main>
  );
}

function ColumnView({
  title,
  subtitle,
  report,
  run,
}: {
  title: string;
  subtitle: string;
  report: Record<string, string>;
  run: PolishRunResult | null;
}) {
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "12px 14px",
        border: "1px solid var(--rule, #d4c8a8)",
        background: "var(--paper, #f7f1e6)",
      }}
    >
      <header style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.10em",
            color: "var(--ink-mute)",
            margin: 0,
          }}
        >
          {title}
        </p>
        <p
          className="font-serif italic"
          style={{ fontSize: 12, color: "var(--ink-soft)", margin: 0 }}
        >
          {subtitle}
        </p>
      </header>

      {run ? <CostAndStatus run={run} /> : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
        {Object.entries(report).map(([slot, text]) => (
          <ProseSlot key={slot} slot={slot} text={text} />
        ))}
      </div>
    </section>
  );
}

function CostAndStatus({ run }: { run: PolishRunResult }) {
  const c = run.cost;
  const okBadge = run.fellBackToEngine ? "FALLBACK" : "POLISH";
  const reason =
    run.validation.ok === false ? run.validation.reason : "";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "6px 8px",
        border: "1px dashed var(--rule, #d4c8a8)",
        background: "var(--paper, #f7f1e6)",
      }}
    >
      <p
        className="font-mono"
        style={{
          fontSize: 10,
          letterSpacing: "0.06em",
          color: run.fellBackToEngine ? "var(--umber, #8a6f3a)" : "var(--ink, #2b2417)",
          margin: 0,
        }}
      >
        {okBadge} · prompt {c.promptTokens} · completion {c.completionTokens} · total {c.totalTokens} · ${c.usdCost.toFixed(6)}
      </p>
      {reason ? (
        <p
          className="font-mono italic"
          style={{
            fontSize: 10,
            color: "var(--ink-mute, #6a5d40)",
            margin: 0,
          }}
        >
          reason: {reason}
        </p>
      ) : null}
    </div>
  );
}

function ProseSlot({ slot, text }: { slot: string; text: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <p
        className="font-mono"
        style={{
          fontSize: 9,
          letterSpacing: "0.08em",
          color: "var(--ink-mute, #6a5d40)",
          margin: 0,
        }}
      >
        {slot}
      </p>
      <p
        className="font-serif"
        style={{
          fontSize: 13,
          lineHeight: 1.55,
          color: "var(--ink, #2b2417)",
          margin: 0,
          whiteSpace: "pre-line",
        }}
      >
        {text || <em style={{ color: "var(--ink-mute)" }}>(empty)</em>}
      </p>
    </div>
  );
}

function ErrorView({
  message,
  sessionId,
}: {
  message: string;
  sessionId: string;
}) {
  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--paper)", color: "var(--ink)" }}
    >
      <div
        className="flex flex-col items-center"
        style={{ gap: 12, maxWidth: 480, padding: 24, textAlign: "center" }}
      >
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.16em",
            color: "var(--ink-mute)",
            margin: 0,
          }}
        >
          Polish A/B failed to load
        </p>
        <p
          className="font-serif italic"
          style={{ fontSize: 14, color: "var(--ink-soft)", margin: 0 }}
        >
          {message}
        </p>
        <Link
          href={`/admin/sessions/${sessionId}`}
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            color: "var(--umber)",
            textDecoration: "underline",
            marginTop: 8,
          }}
        >
          ← back to session detail
        </Link>
      </div>
    </main>
  );
}

// ── Build a SignalSummary from the constitution ──────────────────────────
//
// The summary is metadata the polish layer reads to anchor its texture
// additions. It is NOT validated; it's input-only.

function buildSignalSummary(constitution: InnerConstitution): SignalSummary {
  const stack = constitution.lens_stack;
  const auxPair = getFunctionPairRegister(stack);
  const topCompass = getTopCompassValues(constitution.signals);
  const drive = constitution.shape_outputs.path?.drive;
  const ocean = constitution.ocean;
  // Determine the dominant OCEAN dimension (highest pct).
  let oceanTopDimension: string | null = null;
  if (ocean) {
    const d = ocean.distribution;
    const entries = [
      { label: "Openness", v: d.O },
      { label: "Conscientiousness", v: d.C },
      { label: "Extraversion", v: d.E },
      { label: "Agreeableness", v: d.A },
      { label: "Emotional Reactivity", v: d.N },
    ];
    entries.sort((a, b) => b.v - a.v);
    oceanTopDimension = entries[0]?.label ?? null;
  }
  // Drive lean.
  let driveBucketLean: SignalSummary["driveBucketLean"] = "unstated";
  if (drive) {
    const d = drive.distribution;
    if (d.cost > d.coverage && d.cost > d.compliance) driveBucketLean = "cost";
    else if (d.coverage > d.cost && d.coverage > d.compliance) driveBucketLean = "coverage";
    else if (d.compliance > d.cost && d.compliance > d.coverage) driveBucketLean = "compliance";
    else driveBucketLean = "balanced";
  }
  return {
    driverFunction: stack.dominant,
    auxiliaryFunction: stack.auxiliary,
    auxPairKey: auxPair?.pair_key ?? null,
    compassTopFive: topCompass.slice(0, 5).map((r) => r.signal_id),
    driveBucketLean,
    oceanTopDimension,
    agencyAspiration: "unknown",
    weatherIntensifier: "unknown",
    fireWillingToBearCost: false,
  };
}
