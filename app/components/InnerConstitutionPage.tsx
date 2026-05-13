"use client";

// CC-057b — Humanity Rendering Layer feature-flag wire-in. Default OFF for
// MVP launch per CC-057a § Operational stance: engine-rendered prose ships
// at MVP without polish; the polish layer is built but disabled until
// CC-057c locks the production provider after manual A/B comparison via
// the /admin/polish-ab/[id] route.
//
// When the flag is ON, the polished prose substitution would happen via a
// server action that wraps the engine constitution and applies licensed
// texture changes per the CC-057a contract (substance-locked, texture-
// licensed). The substitution is a comment-block plumb at v1; activation
// lives in CC-057c per the CC-057b out-of-scope notes.
const POLISH_FLAG = process.env.NEXT_PUBLIC_POLISH_ENABLED === "true";
void POLISH_FLAG; // Reserved for CC-057c activation; pass-through at v1.

import { useEffect, useState } from "react";
import type {
  Answer,
  DemographicSet,
  InnerConstitution,
  Tension,
  TensionStatus,
} from "../../lib/types";
import TensionCard from "./TensionCard";
import MbtiDisclosure from "./MbtiDisclosure";
import MirrorSection from "./MirrorSection";
import MapSection from "./MapSection";
import UseCasesSection from "./UseCasesSection";
import WorkMap from "./WorkMap";
import LoveMap from "./LoveMap";
import { getTopCompassValues, valueListPhrase } from "../../lib/identityEngine";
import {
  buildFilename,
  composeDispositionSummaryLine,
} from "../../lib/renderMirror";
import { generateTrajectoryChartSvgFromConstitution } from "../../lib/trajectoryChart";
import {
  composeOceanProse,
  renderOceanDashboardSVG,
} from "../../lib/oceanDashboard";
import { composeReportCallouts } from "../../lib/composeReportCallouts";
import { composeClosingReadProse } from "../../lib/identityEngine";

type Confirmation = {
  status: TensionStatus;
  note?: string;
};

type Props = {
  constitution: InnerConstitution;
  confirmations: Record<string, Confirmation>;
  setConfirmations: React.Dispatch<
    React.SetStateAction<Record<string, Confirmation>>
  >;
  explainOpen: Record<string, boolean>;
  setExplainOpen: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  onRestart: () => void;
  // CC-020 — Share surface inputs. demographics is non-null only after the
  // user has gone through the Identity & Context page; sessionDate is set
  // only after a save completes. Both are optional — Print/Copy/Download
  // work without either.
  // CC-022a — under the save-before-portrait flow, demographics + date
  // are always populated when the live test flow renders this page. The
  // admin detail view still threads them from the saved session row.
  demographics?: DemographicSet | null;
  sessionDate?: Date | null;
  // CC-021a — admin detail view reuse. The researcher UI renders the
  // saved InnerConstitution read-only; the Share block belongs to the
  // live test-taker flow and is suppressed here.
  hideShareBlock?: boolean;
  // CC-022b — the saved Answer[] for this session. Threaded through to
  // MirrorSection so the Keystone Reflection can cite the user's actual
  // Q-I2 / Q-I3 selections back by source-question label. Optional: when
  // omitted (legacy callers), the Keystone falls back to generic
  // dimension-label prose.
  answers?: Answer[];
};

function SectionRule() {
  return (
    <div
      style={{
        height: 1,
        background: "var(--rule-soft)",
        margin: "32px 0",
      }}
    />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="font-mono uppercase"
      style={{
        fontSize: 11,
        letterSpacing: "0.12em",
        color: "var(--ink-mute)",
        margin: 0,
      }}
    >
      {children}
    </p>
  );
}

function SectionParagraph({ text }: { text: string }) {
  return (
    <p
      className="font-serif text-[15.5px] md:text-[16px]"
      style={{
        color: "var(--ink)",
        lineHeight: 1.65,
        margin: 0,
      }}
    >
      {text}
    </p>
  );
}

function isConfirmedStatus(s: TensionStatus): boolean {
  return s === "confirmed" || s === "partially_confirmed";
}

function isOpenStatus(s: TensionStatus | undefined): boolean {
  return s === undefined || s === "unconfirmed";
}

function isRejectedStatus(s: TensionStatus | undefined): boolean {
  return s === "rejected";
}

export default function InnerConstitutionPage({
  constitution,
  confirmations,
  setConfirmations,
  explainOpen,
  setExplainOpen,
  onRestart,
  demographics,
  sessionDate,
  hideShareBlock,
  answers,
}: Props) {
  // CC-020 — Share block local state. The toggle defaults on (the user
  // owns their own data); flipping it off omits the belief anchor from
  // both the markdown export and the print render. Copy-flash is a
  // brief inline confirmation after navigator.clipboard.writeText.
  const [includeBeliefAnchor, setIncludeBeliefAnchor] = useState(true);
  const [copiedFlash, setCopiedFlash] = useState(false);
  // CC-LLM-RENDER-PRODUCTION-POLISH — visible loading state on the
  // share buttons. Set true while `/api/render` is resolving; set false
  // on success / failure / 30s safety timeout. Disables the button +
  // swaps the label so the user knows work is happening server-side.
  const [isCopying, setIsCopying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // CC-REACT-ON-SCREEN-LLM-RENDER — on-screen LLM rewrites for the four
  // scoped body cards + Keystone. Initial render uses engine prose (the
  // page is fully visible before the LLM resolver returns). The
  // useEffect fires `POST /api/report-cards` on mount; when the response
  // arrives, the rewrites swap into the affected card bodies via prop
  // threading (see `liveScopedRewrites` / `liveKeystoneRewrite` props
  // below). Failure modes (timeout, error, budget exhaustion) leave
  // `liveScopedRewrites` empty; engine prose continues to render.
  const [liveScopedRewrites, setLiveScopedRewrites] = useState<{
    lens: string | null;
    compass: string | null;
    hands: string | null;
    path: string | null;
    keystone: string | null;
  }>({ lens: null, compass: null, hands: null, path: null, keystone: null });
  // CC-LLM-RENDER-PRODUCTION-POLISH — no `liveRewritesResolving` flag.
  // Engine prose is the visible default; the LLM swap happens silently
  // once the fetch resolves. No "refining…" kicker on the card surface.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/report-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers, demographics }),
        });
        if (!res.ok) return;
        const body = (await res.json()) as {
          lens?: string | null;
          compass?: string | null;
          hands?: string | null;
          path?: string | null;
          keystone?: string | null;
        };
        if (cancelled) return;
        setLiveScopedRewrites({
          lens: body.lens ?? null,
          compass: body.compass ?? null,
          hands: body.hands ?? null,
          path: body.path ?? null,
          keystone: body.keystone ?? null,
        });
      } catch (e) {
        console.warn(
          `[on-screen-llm-render] /api/report-cards fetch failed: ${(e as Error).message}`
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [answers, demographics]);

  function handlePrint() {
    if (typeof window !== "undefined") window.print();
  }

  // CC-PRODUCTION-RENDER-PATH-WIRING — the live Copy / Download
  // handlers no longer render the markdown client-side via the sync
  // `renderMirrorAsMarkdown`. They POST the user's answers +
  // demographics to `/api/render`, which calls
  // `renderMirrorAsMarkdownLive` on the server (committed cache →
  // process-scoped runtime cache → on-demand LLM resolution under a
  // per-session budget → Tier C fallback). The live wrapper is
  // server-only because it needs ANTHROPIC_API_KEY + the Anthropic
  // SDK; the API route is the bridge.
  async function fetchLiveMarkdown(): Promise<string | null> {
    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          demographics,
          includeBeliefAnchor,
        }),
      });
      if (!res.ok) return null;
      const body = (await res.json()) as { markdown?: unknown };
      return typeof body.markdown === "string" ? body.markdown : null;
    } catch {
      return null;
    }
  }

  // CC-LLM-RENDER-PRODUCTION-POLISH — 30 s safety timeout so a stuck
  // fetch never leaves the button stuck in a "Generating…" state. If
  // the server is genuinely slow, the user sees the button revert and
  // can retry; we'd rather degrade visibly than appear hung.
  const LIVE_MARKDOWN_SAFETY_MS = 30_000;
  function withSafetyTimeout<T>(p: Promise<T>): Promise<T | null> {
    return new Promise<T | null>((resolve) => {
      let settled = false;
      const t = window.setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve(null);
        }
      }, LIVE_MARKDOWN_SAFETY_MS);
      p.then(
        (v) => {
          if (!settled) {
            settled = true;
            window.clearTimeout(t);
            resolve(v);
          }
        },
        () => {
          if (!settled) {
            settled = true;
            window.clearTimeout(t);
            resolve(null);
          }
        }
      );
    });
  }

  async function handleCopyMarkdown() {
    if (isCopying) return;
    setIsCopying(true);
    try {
      const md = await withSafetyTimeout(fetchLiveMarkdown());
      if (!md) return;
      try {
        await navigator.clipboard.writeText(md);
        setCopiedFlash(true);
        window.setTimeout(() => setCopiedFlash(false), 2000);
      } catch {
        // Clipboard write can fail in sandboxed iframes or non-secure
        // contexts. Surface a soft fallback by leaving copiedFlash false
        // and letting the user fall back to Download.
      }
    } finally {
      setIsCopying(false);
    }
  }

  async function handleDownloadMarkdown() {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const md = await withSafetyTimeout(fetchLiveMarkdown());
      if (!md) return;
      const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = buildFilename(demographics, sessionDate);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  }

  function setStatus(tension_id: string, status: TensionStatus) {
    setConfirmations((prev) => ({
      ...prev,
      [tension_id]: { status, note: prev[tension_id]?.note },
    }));
    if (status !== "unconfirmed") {
      setExplainOpen((prev) => ({ ...prev, [tension_id]: false }));
    }
  }
  function toggleExplain(tension_id: string) {
    setExplainOpen((prev) => ({ ...prev, [tension_id]: !prev[tension_id] }));
  }
  function setNote(tension_id: string, note: string) {
    setConfirmations((prev) => ({
      ...prev,
      [tension_id]: {
        status: prev[tension_id]?.status ?? "unconfirmed",
        note,
      },
    }));
  }
  function editResponse(tension_id: string) {
    setConfirmations((prev) => ({
      ...prev,
      [tension_id]: { status: "unconfirmed", note: prev[tension_id]?.note },
    }));
  }

  const visibleTensions: Tension[] = constitution.tensions.filter(
    (t) => !isRejectedStatus(confirmations[t.tension_id]?.status)
  );
  const confirmedTensions = visibleTensions.filter((t) =>
    isConfirmedStatus(confirmations[t.tension_id]?.status ?? "unconfirmed")
  );
  const openTensions = visibleTensions.filter((t) =>
    isOpenStatus(confirmations[t.tension_id]?.status)
  );

  const cross = constitution.cross_card;
  // CC-SYNTHESIS-1A Addition 3 — composeClosingReadProse handles the
  // pre-1A defensive-builder kicker append AND the new two-tier closing-
  // phrase substitution. Single source of truth shared with the
  // markdown render path.
  const closingReadProseRaw = composeClosingReadProse(constitution);
  const closingReadProse =
    closingReadProseRaw.length > 0 ? closingReadProseRaw : null;
  const movement = constitution.goalSoulMovement;
  const movementDashboard = movement?.dashboard;

  // CC-PROSE-1B Layer 5C — Final Line callout. composeReportCallouts
  // returns a non-null finalLine only when the mechanical -ing →
  // imperative transformation yields a clean carry-away line for the
  // shape; null surfaces the gap honestly (no fabrication).
  const reportCallouts = composeReportCallouts(constitution);
  // CC-TRAJECTORY-VISUALIZATION — four-element chart replaces the
  // legacy two-element chart (renderGoalSoulDashboardSVG). The new chart
  // reads movementLimiter + Aim-tolerance + Grip-drag fields from the
  // constitution to render usable trajectory, tolerance cone, and Grip
  // drag marker alongside the original potential trajectory line.
  const movementSvg = movementDashboard
    ? generateTrajectoryChartSvgFromConstitution(constitution)
    : null;
  const oceanMix = constitution.ocean?.dispositionSignalMix;
  const oceanProse =
    oceanMix && oceanMix.intensities
      ? composeOceanProse(oceanMix, constitution.goalSoulGive)
      : null;
  const oceanSvg =
    oceanMix && oceanMix.intensities ? renderOceanDashboardSVG(oceanMix) : null;

  return (
    <main
      className="min-h-screen"
      style={{ background: "var(--paper)", color: "var(--ink)" }}
    >
      <div
        className="mx-auto px-6 py-10 md:px-10 md:py-14"
        style={{ maxWidth: 720 }}
      >
        {/* Page header */}
        <header
          className="flex flex-col items-center text-center"
          style={{ gap: 8, paddingBottom: 24 }}
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
            The Inner Constitution
          </p>
          <p
            className="font-serif italic text-[15px] md:text-[16px]"
            style={{ color: "var(--ink-soft)", margin: 0 }}
          >
            a possibility, not a verdict
          </p>
        </header>

        <div
          style={{
            height: 1,
            background: "var(--rule)",
          }}
        />

        {/* MIRROR — top, default visible, ~700 words */}
        <div style={{ paddingTop: 32 }}>
          <MirrorSection
            mirror={constitution.mirror}
            mbtiSlot={<MbtiDisclosure stack={constitution.lens_stack} />}
            belief={constitution.belief_under_tension}
            beliefValueListPhrase={valueListPhrase(
              getTopCompassValues(constitution.signals),
              0
            )}
            demographics={demographics}
            answers={answers}
            constitution={constitution}
            liveKeystoneRewriteProse={liveScopedRewrites.keystone}
          />
        </div>

        <SectionRule />

        {closingReadProse ? (
          <>
            <section
              className="flex flex-col"
              style={{ gap: 14, paddingTop: 12, paddingBottom: 12 }}
            >
              <SectionLabel>Closing Read</SectionLabel>
              <SectionParagraph text={closingReadProse} />
            </section>
            <SectionRule />
          </>
        ) : null}

        {movement && movement.prose.length > 0 ? (
          <>
            <section
              className="flex flex-col"
              style={{ gap: 14, paddingTop: 12, paddingBottom: 12 }}
            >
              <SectionLabel>Movement</SectionLabel>
              {movementDashboard ? (
                <div
                  className="font-serif"
                  style={{
                    border: "1px solid var(--rule-soft)",
                    borderRadius: 6,
                    padding: "14px 16px",
                    color: "var(--ink)",
                    fontSize: 14.5,
                    lineHeight: 1.6,
                  }}
                >
                  <dl
                    style={{
                      display: "grid",
                      gridTemplateColumns: "max-content 1fr",
                      columnGap: 12,
                      rowGap: 6,
                      margin: 0,
                    }}
                  >
                    <dt style={{ fontWeight: 700 }}>Goal</dt>
                    <dd style={{ margin: 0 }}>
                      {movementDashboard.goalScore} / 100
                    </dd>
                    <dt style={{ fontWeight: 700 }}>Soul</dt>
                    <dd style={{ margin: 0 }}>
                      {movementDashboard.soulScore} / 100
                    </dd>
                    {/* CC-CRISIS-PATH-PROSE — Direction line is suppressed
                        for crisis-class users (the trajectory framework
                        doesn't apply). */}
                    {constitution.coherenceReading?.pathClass !== "crisis" ? (
                      <>
                        <dt style={{ fontWeight: 700 }}>Direction</dt>
                        <dd style={{ margin: 0 }}>
                          {Math.round(movementDashboard.direction.angle)}° (
                          {movementDashboard.direction.descriptor})
                        </dd>
                      </>
                    ) : null}
                    {/* CC-MOMENTUM-HONESTY — lead with Usable Movement
                        (what the user can actually use after Grip drag
                        and Aim governance), with Potential as secondary
                        context. */}
                    <dt style={{ fontWeight: 700 }}>Movement</dt>
                    <dd style={{ margin: 0 }}>
                      {movementDashboard.movementStrength.length === 0 ? (
                        "0 — the line has not yet been drawn"
                      ) : movementDashboard.movementLimiter ? (
                        <>
                          Usable{" "}
                          {movementDashboard.movementLimiter.usableMovement.toFixed(
                            1
                          )}{" "}
                          / 100 ({movementDashboard.movementLimiter.usableDescriptor})
                          <div style={{ fontSize: "0.85em", opacity: 0.75 }}>
                            Potential{" "}
                            {movementDashboard.movementLimiter.potentialMovement.toFixed(
                              1
                            )}{" "}
                            (-{movementDashboard.movementLimiter.dragPercent}% drag)
                          </div>
                        </>
                      ) : (
                        `${movementDashboard.movementStrength.length.toFixed(
                          1
                        )} / 100 (${
                          movementDashboard.movementStrength.descriptor
                        })`
                      )}
                    </dd>
                    {/* CC-SYNTHESIS-1A Addition 2 — Four-Quadrant
                        Movement label (Drift / Work without Presence /
                        Love without Form / Giving / Presence) replaces
                        the prior `quadrantLabel` two-state. */}
                    {constitution.movementQuadrant ? (
                      <>
                        <dt style={{ fontWeight: 700 }}>Quadrant</dt>
                        <dd style={{ margin: 0 }}>
                          {constitution.movementQuadrant.label}
                        </dd>
                      </>
                    ) : null}
                    {/* CC-AIM-CALIBRATION — Aim composite displayed
                        alongside Grip for parallelism. Both 0-100 axes. */}
                    {constitution.aimReading ? (
                      <>
                        <dt style={{ fontWeight: 700 }}>Aim</dt>
                        <dd style={{ margin: 0 }}>
                          {constitution.aimReading.score.toFixed(1)} / 100
                        </dd>
                      </>
                    ) : null}
                    {/* CC-AIM-CALIBRATION — renamed from "Gripping Pull"
                        to "Grip" for parallelism with the new Aim line.
                        CC-GRIP-WIRING-AND-FLOOR-CALIBRATION — when the
                        §13 stakes amplifier fired (amp > 1.05), surface
                        both defensive and composed; otherwise show
                        single canonical value. */}
                    <dt style={{ fontWeight: 700 }}>Grip</dt>
                    <dd style={{ margin: 0 }}>
                      {constitution.gripReading &&
                      constitution.gripReading.components.amplifier > 1.05 ? (
                        <>
                          {constitution.gripReading.components.defensiveGrip.toFixed(
                            1
                          )}{" "}
                          defensive ·{" "}
                          {constitution.gripReading.score.toFixed(1)} with
                          stakes
                        </>
                      ) : constitution.gripReading ? (
                        `${constitution.gripReading.score.toFixed(1)} / 100`
                      ) : (
                        `${movementDashboard.grippingPull.score} / 100`
                      )}
                      {movementDashboard.grippingPull.signals.length > 0 ? (
                        <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                          {movementDashboard.grippingPull.signals.map((sig) => (
                            <li key={sig.id}>{sig.humanReadable}</li>
                          ))}
                        </ul>
                      ) : null}
                    </dd>
                    {/* CC-SYNTHESIS-1A Addition 1 — Risk Form 2x2 line.
                        CC-SYNTHESIS-1-FINISH Section D — suppressed when
                        movementStrength.length === 0.
                        CC-AIM-CALIBRATION — prefer the Aim-based reading
                        when available; falls back to the legacy compliance-
                        bucket reading. */}
                    {/* CC-CRISIS-PATH-PROSE — Risk Form line suppressed
                        for crisis-class users; Movement hedge replaces
                        the trajectory framing. */}
                    {constitution.coherenceReading?.pathClass !== "crisis" &&
                    (constitution.riskFormFromAim ?? constitution.riskForm) &&
                    movementDashboard.movementStrength.length > 0 ? (
                      <>
                        <dt style={{ fontWeight: 700 }}>Risk Form</dt>
                        <dd style={{ margin: 0 }}>
                          {(constitution.riskFormFromAim ?? constitution.riskForm)!.letter}{" "}
                          (
                          {constitution.riskFormFromAim
                            ? `Aim ${constitution.aimReading?.score.toFixed(0) ?? "?"}`
                            : `Risk-bucket ${constitution.riskForm!.riskBucketPct}%`}
                          , Grip{" "}
                          {(constitution.riskFormFromAim ?? constitution.riskForm)!.gripScore}/100)
                        </dd>
                      </>
                    ) : null}
                  </dl>
                  {constitution.coherenceReading?.pathClass === "crisis" ? (
                    <p
                      className="font-serif italic"
                      style={{
                        fontSize: 14,
                        color: "var(--ink-soft)",
                        lineHeight: 1.55,
                        marginTop: 10,
                        marginBottom: 0,
                      }}
                    >
                      The trajectory framework the report normally uses doesn&apos;t fully apply to this read. See the Path/Gait section for what the read is naming.
                    </p>
                  ) : null}
                  {constitution.coherenceReading?.pathClass !== "crisis" &&
                  (constitution.riskFormFromAim ?? constitution.riskForm) &&
                  movementDashboard.movementStrength.length > 0 ? (
                    <p
                      className="font-serif italic"
                      style={{
                        fontSize: 14,
                        color: "var(--ink-soft)",
                        lineHeight: 1.55,
                        marginTop: 10,
                        marginBottom: 0,
                      }}
                    >
                      {(constitution.riskFormFromAim ?? constitution.riskForm)!.prose}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {movementSvg ? (
                <div
                  style={{
                    width: "100%",
                    maxWidth: 400,
                    aspectRatio: "1 / 1",
                  }}
                  dangerouslySetInnerHTML={{ __html: movementSvg }}
                />
              ) : null}
              {movement.prose.length > 0 ? (
                <SectionParagraph text={movement.prose} />
              ) : null}
            </section>
            <SectionRule />
          </>
        ) : null}

        {/* CC-GRIP-TAXONOMY / CC-GRIP-CALIBRATION — Your Grip section.
            Renders between Movement and Disposition Signal Mix when the
            engine's calibrated Primal cluster has prose mode "rendered"
            (full three-concept block) or "hedged" (short paragraph).
            Section omitted entirely when prose mode is "omitted" (low-
            confidence / zero-grip / ambiguous shapes). LLM-articulated
            prose (cached or runtime-fetched via useGripParagraph)
            preferred; engine fallback when LLM unavailable. */}
        {constitution.gripTaxonomy &&
        constitution.gripTaxonomy.primary &&
        constitution.gripTaxonomy.proseMode !== "omitted" ? (
          <>
            <section
              className="flex flex-col"
              style={{ gap: 14, paddingTop: 12, paddingBottom: 12 }}
            >
              <SectionLabel>Your Grip</SectionLabel>
              <div
                style={{
                  borderLeft: "3px solid var(--umber)",
                  background: "var(--umber-wash)",
                  padding: "14px 18px",
                  borderRadius: 2,
                }}
              >
                {constitution.gripParagraphLlm ? (
                  <p
                    className="font-serif italic"
                    style={{
                      fontSize: 15.5,
                      color: "var(--ink)",
                      lineHeight: 1.65,
                      margin: 0,
                      whiteSpace: "pre-line",
                    }}
                  >
                    {/* CC-GRIP-TAXONOMY-REPLACEMENT — scrub residual
                        Foster vocab from cached LLM prose. */}
                    {[
                      "Am I safe?",
                      "Am I secure?",
                      "Am I wanted?",
                      "Am I loved?",
                      "Am I successful?",
                      "Am I good enough?",
                      "Do I have purpose?",
                      "Primal Question",
                    ].reduce(
                      (acc, p) =>
                        acc.split(p).join(
                          constitution.gripPattern?.underlyingQuestion ??
                            "this same question"
                        ),
                      constitution.gripParagraphLlm
                    )}
                  </p>
                ) : constitution.gripTaxonomy.proseMode === "hedged" ? (
                  <p
                    className="font-serif italic"
                    style={{
                      fontSize: 15.5,
                      color: "var(--ink)",
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    The pressure register reads quietly here. The surface clue is{" "}
                    {constitution.gripTaxonomy.surfaceGrip.toLowerCase()};
                    the underlying recognition may be{" "}
                    {constitution.gripPattern?.underlyingQuestion ??
                      "the question this pressure is asking under the surface"}{" "}
                    — but the signal is thin enough that the question is
                    worth noticing rather than governing.
                  </p>
                ) : (
                  <dl
                    className="font-serif"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "max-content 1fr",
                      columnGap: 14,
                      rowGap: 8,
                      margin: 0,
                      fontSize: 15.5,
                      color: "var(--ink)",
                      lineHeight: 1.55,
                    }}
                  >
                    <dt style={{ fontWeight: 700 }}>Surface Grip</dt>
                    <dd style={{ margin: 0 }}>
                      {constitution.gripTaxonomy.surfaceGrip}.
                    </dd>
                    <dt style={{ fontWeight: 700 }}>Grip Pattern</dt>
                    <dd style={{ margin: 0 }}>
                      {constitution.gripPattern?.renderedLabel ?? "Grip Pattern"}
                    </dd>
                    <dt style={{ fontWeight: 700 }}>Underlying Question</dt>
                    <dd style={{ margin: 0, fontStyle: "italic" }}>
                      {constitution.gripPattern?.underlyingQuestion ??
                        "What is this pressure asking of me that I have not yet named?"}
                    </dd>
                    <dt style={{ fontWeight: 700 }}>Distorted Strategy</dt>
                    <dd style={{ margin: 0 }}>
                      {constitution.gripTaxonomy.distortedStrategy?.text ??
                        "Under pressure, the question can start to drive instead of inform."}
                    </dd>
                    <dt style={{ fontWeight: 700 }}>Healthy Gift</dt>
                    <dd style={{ margin: 0 }}>
                      {constitution.gripTaxonomy.healthyGift}
                    </dd>
                  </dl>
                )}
              </div>
              <dl
                className="font-serif"
                style={{
                  display: "grid",
                  gridTemplateColumns: "max-content 1fr",
                  columnGap: 12,
                  rowGap: 6,
                  margin: 0,
                  fontSize: 14,
                  color: "var(--ink)",
                }}
              >
                <dt style={{ fontWeight: 700 }}>Grip Pattern</dt>
                <dd style={{ margin: 0 }}>
                  {constitution.gripPattern?.renderedLabel ??
                    "Grip Pattern (not yet classified)"}
                </dd>
                <dt style={{ fontWeight: 700 }}>Underlying Question</dt>
                <dd style={{ margin: 0, fontStyle: "italic" }}>
                  {constitution.gripPattern?.underlyingQuestion ??
                    "What is this pressure asking of me that I have not yet named?"}
                </dd>
                {constitution.gripTaxonomy.contributingGrips.length > 0 ? (
                  <>
                    <dt style={{ fontWeight: 700 }}>Contributing grips</dt>
                    <dd style={{ margin: 0 }}>
                      {constitution.gripTaxonomy.contributingGrips.join(", ")}
                    </dd>
                  </>
                ) : null}
                {constitution.gripTaxonomy.subRegister ? (
                  <>
                    <dt style={{ fontWeight: 700 }}>Sub-register</dt>
                    <dd style={{ margin: 0 }}>
                      {constitution.gripTaxonomy.subRegister}
                    </dd>
                  </>
                ) : null}
                <dt style={{ fontWeight: 700 }}>Confidence</dt>
                <dd style={{ margin: 0 }}>
                  {constitution.gripPattern?.confidence ??
                    constitution.gripTaxonomy.confidence}
                </dd>
              </dl>
            </section>
            <SectionRule />
          </>
        ) : null}

        {/* CC-074 — Disposition Signal Mix. React parity for CC-072's
            markdown render: independent trait intensities, prose in
            dominance order, and internal SVG bar chart.
            CC-DISPOSITION-COLLAPSE-DEFAULT — user-mode default-collapses
            the full panel behind a <details> disclosure with a plain-
            language summary line visible above. Markdown export honors
            the same shape (renderMirror.ts emits matching markup). */}
        {oceanMix && oceanMix.intensities ? (
          <>
            <section
              className="flex flex-col"
              style={{ gap: 14, paddingTop: 12, paddingBottom: 12 }}
            >
              <SectionLabel>Disposition Signal Mix</SectionLabel>
              <p
                className="font-serif italic"
                style={{
                  fontSize: 14,
                  color: "var(--ink-soft)",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {composeDispositionSummaryLine(oceanMix)}
              </p>
              <details>
                <summary
                  style={{
                    cursor: "pointer",
                    fontSize: 13,
                    color: "var(--ink-mute)",
                    paddingTop: 4,
                  }}
                >
                  View the full disposition signal panel
                </summary>
                <div
                  className="flex flex-col"
                  style={{ gap: 14, paddingTop: 12 }}
                >
                  {oceanProse ? (
                    <>
                      <p
                        className="font-serif italic"
                        style={{
                          fontSize: 14,
                          color: "var(--ink-soft)",
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        {oceanProse.disclaimer}
                      </p>
                      {oceanProse.paragraphs.map((paragraph, index) => (
                        <SectionParagraph
                          key={`${oceanMix.dominance.ranked[index]}-${index}`}
                          text={paragraph.replace(/\*/g, "")}
                        />
                      ))}
                    </>
                  ) : null}
                  {oceanSvg ? (
                    <div
                      style={{
                        width: "100%",
                        maxWidth: 480,
                      }}
                      dangerouslySetInnerHTML={{ __html: oceanSvg }}
                    />
                  ) : null}
                </div>
              </details>
            </section>
            <SectionRule />
          </>
        ) : null}

        {/* CC-042 — Work Map. Composes Lens aux-pair register + Drive
            distribution + OCEAN + Q-E1 + Compass + Q-Ambition1 + Path
            agency aspiration into 1–2 work registers the user is
            structurally aligned to. Page-level section between Disposition
            Signal Mix and Map; not a ShapeCard. Renders only when the engine
            produced a workMap output (no register fired above the
            threshold floor → silently omits). */}
        {constitution.workMap && constitution.workMap.matches.length > 0 ? (
          <>
            <section
              className="flex flex-col"
              aria-labelledby="work-map-heading"
              style={{ gap: 14, paddingTop: 12, paddingBottom: 12 }}
            >
              <p
                id="work-map-heading"
                className="font-mono uppercase"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  color: "var(--ink-mute)",
                  margin: 0,
                }}
              >
                Work Map
              </p>
              <p
                className="font-serif italic"
                style={{
                  fontSize: 14,
                  color: "var(--ink-soft)",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                Work registers the instrument detects you&apos;re structurally aligned to. Derived from your cognitive register, motivational distribution, trait disposition, and value orientation — not from any vocation-specific question. These are categories of work that will come easy and feel meaningful, not prescriptions.
              </p>
              <WorkMap workMap={constitution.workMap} />
              <p
                className="font-serif"
                style={{
                  fontSize: 15.5,
                  color: "var(--ink)",
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {constitution.workMap.prose}
              </p>
              <p
                className="font-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.08em",
                  color: "var(--ink-mute)",
                  fontStyle: "italic",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                Work Map is a derivation, not a recommendation. It names registers your existing answers point toward; it doesn&apos;t account for training, geographic constraints, or life-stage tradeoffs you bring to any career decision.
              </p>
            </section>
            <SectionRule />
          </>
        ) : null}

        {/* CC-044 — Love Map. Composes Lens aux-pair register + Drive +
            OCEAN + Compass + Q-X4 trust + Q-S3 spending + Q-E1 energy +
            Q-Stakes1 + Q-Ambition1 + agency aspiration into 1–2 love
            registers + top 1–3 flavors + a Resource Balance diagnostic.
            Page-level section between Work Map and Map; not a ShapeCard.
            Renders when matches fire OR when Resource Balance is distorted
            (so users with healthy register match + healthy balance OR no
            register match + healthy balance silently skip the section). */}
        {constitution.loveMap &&
        (constitution.loveMap.matches.length > 0 ||
          constitution.loveMap.resourceBalance.case !== "healthy") ? (
          <>
            <section
              className="flex flex-col"
              aria-labelledby="love-map-heading"
              style={{ gap: 14, paddingTop: 12, paddingBottom: 12 }}
            >
              <p
                id="love-map-heading"
                className="font-mono uppercase"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  color: "var(--ink-mute)",
                  margin: 0,
                }}
              >
                Love Map
              </p>
              <p
                className="font-serif italic"
                style={{
                  fontSize: 14,
                  color: "var(--ink-soft)",
                  margin: 0,
                  lineHeight: 1.55,
                }}
              >
                Love takes many shapes — what follows describes how your love tends to take shape, not whether your love is real. Real love, regardless of register or flavor, is patient and kind, persists, refuses to keep records, rejoices with truth. The map below names the shape; the qualities it must meet to be love at all are not particular to any shape.
              </p>
              <LoveMap loveMap={constitution.loveMap} />
              <p
                className="font-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.08em",
                  color: "var(--ink-mute)",
                  fontStyle: "italic",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                Love Map is a derivation, not a prescription. It names the register and modes your existing answers point toward; it doesn&apos;t account for life-stage, current circumstance, or the relationships you&apos;ve actually chosen to invest in.
              </p>
            </section>
            <SectionRule />
          </>
        ) : null}

        {/* MAP — eight cards as accordions, default collapsed.
            CC-022b — demographics threaded for cross-card-pattern prose
            insertion + Path/Weather demographic interpolation. */}
        <MapSection
          constitution={constitution}
          demographics={demographics}
          liveScopedRewrites={liveScopedRewrites}
        />

        {/* CC-SYNTHESIS-1-FINISH Section A — Growth Path section removed
            (duplicated Path · Gait opening in compressed form). Section
            F's Path master synthesis paragraph absorbs Growth Path's
            job. The engine still produces `cross_card.growthPath` for
            backward compatibility; only the React emit is removed. */}
        <section
          className="flex flex-col"
          style={{ gap: 14, paddingTop: 12, paddingBottom: 12 }}
        >
          <SectionLabel>Conflict Translation</SectionLabel>
          <SectionParagraph text={cross.conflictTranslation} />
        </section>

        <SectionRule />

        <section
          className="flex flex-col"
          style={{ gap: 14, paddingTop: 12, paddingBottom: 12 }}
        >
          <SectionLabel>Mirror-Types Seed</SectionLabel>
          <SectionParagraph text={cross.mirrorTypesSeed} />
        </section>

        {confirmedTensions.length > 0 ? (
          <>
            <SectionRule />
            <section
              className="flex flex-col"
              style={{ gap: 22, paddingTop: 12, paddingBottom: 12 }}
            >
              <SectionLabel>Confirmed Tensions</SectionLabel>
              {confirmedTensions.map((t) => {
                const c = confirmations[t.tension_id];
                return (
                  <TensionCard
                    key={t.tension_id}
                    tension={t}
                    mode="confirmed"
                    status={c?.status ?? "unconfirmed"}
                    note={c?.note ?? ""}
                    explainOpen={!!explainOpen[t.tension_id]}
                    onSetStatus={(s) => setStatus(t.tension_id, s)}
                    onToggleExplain={() => toggleExplain(t.tension_id)}
                    onSetNote={(n) => setNote(t.tension_id, n)}
                    onEditResponse={() => editResponse(t.tension_id)}
                  />
                );
              })}
            </section>
          </>
        ) : null}

        {openTensions.length > 0 ? (
          <>
            <SectionRule />
            <section
              className="flex flex-col"
              style={{ gap: 22, paddingTop: 12, paddingBottom: 12 }}
            >
              <SectionLabel>Open Tensions</SectionLabel>
              {openTensions.map((t) => {
                const c = confirmations[t.tension_id];
                return (
                  <TensionCard
                    key={t.tension_id}
                    tension={t}
                    mode="open"
                    status={c?.status ?? "unconfirmed"}
                    note={c?.note ?? ""}
                    explainOpen={!!explainOpen[t.tension_id]}
                    onSetStatus={(s) => setStatus(t.tension_id, s)}
                    onToggleExplain={() => toggleExplain(t.tension_id)}
                    onSetNote={(n) => setNote(t.tension_id, n)}
                    onEditResponse={() => editResponse(t.tension_id)}
                  />
                );
              })}
            </section>
          </>
        ) : null}

        {/* CC-022a — the CC-019 "Save This Reading?" block was removed.
            Save now happens before the portrait renders (research-mode
            posture per the amended demographic-rules.md Rule 5); by the
            time this page mounts, the session is already persisted. */}

        {/* CC-020 — Share block. Renders unconditionally on the result page.
            Print, copy-as-markdown, and download-markdown are all browser-
            native; no save dependency.
            CC-021a — suppressed in the admin detail view via hideShareBlock. */}
        {hideShareBlock ? null : (
        <div data-print-hide="share">
          <SectionRule />
          <section
            className="flex flex-col"
            style={{ gap: 14, paddingTop: 12, paddingBottom: 12 }}
          >
            <SectionLabel>Share This Reading</SectionLabel>
            <p
              className="font-serif italic"
              style={{
                fontSize: 14.5,
                color: "var(--ink-soft)",
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              Print or export to send to whoever should see it.
            </p>
            <div
              className="flex flex-row flex-wrap"
              style={{ gap: 10, paddingTop: 4, alignItems: "center" }}
            >
              <button
                type="button"
                onClick={handlePrint}
                data-focus-ring
                className="font-mono uppercase"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  padding: "10px 16px",
                  background: "transparent",
                  color: "var(--ink)",
                  border: "1px solid var(--rule)",
                  borderRadius: 6,
                  cursor: "pointer",
                  minHeight: 40,
                }}
              >
                Print
              </button>
              <button
                type="button"
                onClick={handleCopyMarkdown}
                disabled={isCopying}
                aria-busy={isCopying}
                data-focus-ring
                className="font-mono uppercase"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  padding: "10px 16px",
                  background: "transparent",
                  color: isCopying ? "var(--ink-mute)" : "var(--ink)",
                  border: "1px solid var(--rule)",
                  borderRadius: 6,
                  cursor: isCopying ? "wait" : "pointer",
                  minHeight: 40,
                  opacity: isCopying ? 0.7 : 1,
                }}
              >
                {isCopying ? "Generating…" : "Copy as Markdown"}
              </button>
              <button
                type="button"
                onClick={handleDownloadMarkdown}
                disabled={isDownloading}
                aria-busy={isDownloading}
                data-focus-ring
                className="font-mono uppercase"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  padding: "10px 16px",
                  background: "transparent",
                  color: isDownloading ? "var(--ink-mute)" : "var(--ink)",
                  border: "1px solid var(--rule)",
                  borderRadius: 6,
                  cursor: isDownloading ? "wait" : "pointer",
                  minHeight: 40,
                  opacity: isDownloading ? 0.7 : 1,
                }}
              >
                {isDownloading ? "Generating…" : "Download Markdown"}
              </button>
              {copiedFlash ? (
                <span
                  role="status"
                  className="font-serif italic"
                  style={{
                    fontSize: 13,
                    color: "var(--ink-soft)",
                    transition: "opacity 200ms ease-out",
                  }}
                >
                  Copied to clipboard
                </span>
              ) : null}
            </div>
            <label
              className="flex flex-row items-center"
              style={{
                gap: 8,
                paddingTop: 8,
                fontSize: 13,
                color: "var(--ink-soft)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={includeBeliefAnchor}
                onChange={(e) => setIncludeBeliefAnchor(e.target.checked)}
                data-focus-ring
                style={{ cursor: "pointer" }}
              />
              <span className="font-serif">Include belief anchor text</span>
            </label>
          </section>
        </div>
        )}

        <SectionRule />
        <UseCasesSection archetype={constitution.profileArchetype?.primary} />

        {/* CC-PROSE-1B Layer 5C — Final Line callout. Closing-of-the-
            closing, mechanically recombined from shapeDescriptor +
            connector + imperative-cast structuralY. Skipped when
            composeReportCallouts returns null (gap surfaced honestly). */}
        {reportCallouts.finalLine ? (
          <>
            <SectionRule />
            <section
              className="flex flex-col"
              style={{ gap: 14, paddingTop: 12, paddingBottom: 12 }}
            >
              <div
                style={{
                  borderLeft: "3px solid var(--umber)",
                  background: "var(--umber-wash)",
                  padding: "14px 18px",
                  borderRadius: 2,
                }}
              >
                <p
                  className="font-serif italic"
                  style={{
                    fontSize: 15.5,
                    color: "var(--ink)",
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  {reportCallouts.finalLine}
                </p>
              </div>
            </section>
          </>
        ) : null}

        {/* CC-CRISIS-PATH-PROSE — elevated standing reminder for
            crisis-class users. Sits above the page footer so readers
            carry the mirror-not-clinician framing past whichever
            section landed hardest. */}
        {constitution.coherenceReading?.pathClass === "crisis" ? (
          <>
            <SectionRule />
            <section
              className="flex flex-col"
              style={{ gap: 10, paddingTop: 12, paddingBottom: 12 }}
            >
              <div
                style={{
                  borderLeft: "3px solid var(--umber)",
                  background: "var(--umber-wash)",
                  padding: "14px 18px",
                  borderRadius: 2,
                }}
              >
                <p
                  className="font-serif italic"
                  style={{
                    fontSize: 14.5,
                    color: "var(--ink)",
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  This report is a mirror, not a clinical assessment. If anything in it lands hard, please talk with a therapist or someone who knows you well. Some kinds of weight need company to carry.
                </p>
              </div>
            </section>
          </>
        ) : null}

        {/* Page footer */}
        <SectionRule />
        <footer
          className="flex flex-col items-center"
          style={{ gap: 12, paddingTop: 12, paddingBottom: 8 }}
          data-print-hide="footer"
        >
          <p
            className="font-mono uppercase"
            style={{
              fontSize: 10,
              letterSpacing: "0.16em",
              color: "var(--ink-mute)",
              margin: 0,
            }}
          >
            this is a draft. nothing is saved.
          </p>
          <button
            type="button"
            onClick={onRestart}
            data-focus-ring
            className="font-mono uppercase"
            style={{
              fontSize: 10,
              letterSpacing: "0.12em",
              color: "var(--ink-mute)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "8px 0",
              textDecoration: "underline",
            }}
          >
            start over
          </button>
        </footer>
      </div>
    </main>
  );
}
