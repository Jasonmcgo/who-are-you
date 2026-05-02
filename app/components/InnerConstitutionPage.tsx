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

import { useState } from "react";
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
import OceanBars from "./OceanBars";
import UseCasesSection from "./UseCasesSection";
import WorkMap from "./WorkMap";
import LoveMap from "./LoveMap";
import { getTopCompassValues, valueListPhrase } from "../../lib/identityEngine";
import {
  buildFilename,
  renderMirrorAsMarkdown,
} from "../../lib/renderMirror";

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

  function handlePrint() {
    if (typeof window !== "undefined") window.print();
  }

  async function handleCopyMarkdown() {
    const md = renderMirrorAsMarkdown({
      constitution,
      demographics,
      answers,
      includeBeliefAnchor,
    });
    try {
      await navigator.clipboard.writeText(md);
      setCopiedFlash(true);
      window.setTimeout(() => setCopiedFlash(false), 2000);
    } catch {
      // Clipboard write can fail in sandboxed iframes or non-secure
      // contexts. Surface a soft fallback by leaving copiedFlash false
      // and letting the user fall back to Download.
    }
  }

  function handleDownloadMarkdown() {
    const md = renderMirrorAsMarkdown({
      constitution,
      demographics,
      answers,
      includeBeliefAnchor,
    });
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildFilename(demographics, sessionDate);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          />
        </div>

        <SectionRule />

        {/* CC-037 — Disposition Map. Big-5 OCEAN distribution derived from
            existing signals (no new questions). Page-level section between
            Mirror and Map, NOT a ShapeCard. Renders only when the engine
            produced an ocean output (thin-signal sessions skip). */}
        {constitution.ocean ? (
          <>
            <section
              className="flex flex-col"
              aria-labelledby="disposition-heading"
              style={{ gap: 14, paddingTop: 12, paddingBottom: 12 }}
            >
              <p
                id="disposition-heading"
                className="font-mono uppercase"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  color: "var(--ink-mute)",
                  margin: 0,
                }}
              >
                Disposition Map
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
                Disposition tendencies, derived from how you answered other questions in this instrument. No single answer determines a tendency; the model reads patterns across the full question footprint.
              </p>
              <OceanBars distribution={constitution.ocean.distribution} />
              <p
                className="font-serif"
                style={{
                  fontSize: 15.5,
                  color: "var(--ink)",
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {constitution.ocean.prose}
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
                Emotional Reactivity is shown as an estimate — the instrument measures it through proxy signals (formation history, current-context load, pressure-adaptation behavior) rather than directly.
              </p>
            </section>
            <SectionRule />
          </>
        ) : null}

        {/* CC-042 — Work Map. Composes Lens aux-pair register + Drive
            distribution + OCEAN + Q-E1 + Compass + Q-Ambition1 + Path
            agency aspiration into 1–2 work registers the user is
            structurally aligned to. Page-level section between Disposition
            Map and Map; not a ShapeCard. Renders only when the engine
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
        <MapSection constitution={constitution} demographics={demographics} />

        {/* Remaining synthesis — Growth Path, Conflict Translation, Mirror-Types Seed */}
        <section
          className="flex flex-col"
          style={{ gap: 14, paddingTop: 12, paddingBottom: 12 }}
        >
          <SectionLabel>Growth Path</SectionLabel>
          <SectionParagraph text={cross.growthPath} />
        </section>

        <SectionRule />

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
                Copy as Markdown
              </button>
              <button
                type="button"
                onClick={handleDownloadMarkdown}
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
                Download Markdown
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
        <UseCasesSection />

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
