import type { ReactNode } from "react";
import ProgressIndicator from "./ProgressIndicator";
import {
  SHAPE_CARD_KICKER_ICON_SIZE_PX,
  getSurveyKickerIcon,
} from "../../lib/cardAssets";
import type { CardId } from "../../lib/types";

type Props = {
  kicker: string;
  prompt: string;
  helper?: string;
  currentIndex: number;
  totalCount: number;
  onBack?: () => void;
  canContinue: boolean;
  onContinue: () => void;
  children: ReactNode;
  mode?: "first_pass" | "second_pass";
  onSkip?: () => void;
  // CC-016b — primary action label override. Defaults to "Continue".
  // Ranking and ranking_derived questions pass "Accept" to make commit
  // intent explicit (vs. silently committing the canonical seed order).
  continueLabel?: string;
  // CC-017 — when true, Skip button does not render. Used by Q-I1b (the only
  // unskippable question in the bank).
  unskippable?: boolean;
  // CC-022f — when present, render the matching body-map SVG above the
  // kicker. Optional so existing callers (and any non-question shell use)
  // render unchanged. Resolved via getSurveyKickerIcon(cardId).
  cardId?: CardId;
};

export default function QuestionShell({
  kicker,
  prompt,
  helper,
  currentIndex,
  totalCount,
  onBack,
  canContinue,
  onContinue,
  children,
  mode = "first_pass",
  onSkip,
  continueLabel = "Continue",
  unskippable = false,
  cardId,
}: Props) {
  const skipVisible =
    mode === "first_pass" && typeof onSkip === "function" && !unskippable;
  const kickerIconPath = cardId ? getSurveyKickerIcon(cardId) : null;
  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ background: "var(--paper)" }}
    >
      <div
        className="w-full mx-auto flex flex-col flex-1"
        style={{ maxWidth: 640 }}
      >
        <header
          className="flex flex-col gap-3 px-6 pt-8 pb-4 md:px-10 md:pt-10 md:pb-5"
          style={{ borderBottom: "1px solid var(--rule-soft)" }}
        >
          <ProgressIndicator
            currentIndex={currentIndex}
            totalCount={totalCount}
          />
          {kickerIconPath ? (
            // CC-022f — small body-map plate above the kicker. Decorative
            // (alt=""): the kicker text immediately below names the card.
            // Mobile clamp scales the icon down on narrow viewports so it
            // doesn't crowd the kicker on a 320px phone. The plain <img>
            // pattern matches CC-022e's MapSection wiring (no next/image
            // since the project doesn't use it).
            <div
              data-card-svg-kicker={cardId}
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={kickerIconPath}
                alt=""
                width={SHAPE_CARD_KICKER_ICON_SIZE_PX}
                height={SHAPE_CARD_KICKER_ICON_SIZE_PX}
                style={{
                  width: `min(${SHAPE_CARD_KICKER_ICON_SIZE_PX}px, 16vw)`,
                  height: "auto",
                  display: "block",
                }}
              />
            </div>
          ) : null}
          <p
            className="font-mono uppercase"
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              color: "var(--ink-mute)",
            }}
          >
            {kicker}
          </p>
        </header>

        <section className="flex-1 flex flex-col gap-6 px-6 py-6 md:px-10 md:py-9">
          <h1
            className="font-serif"
            style={{
              fontSize: "20px",
              lineHeight: 1.25,
              letterSpacing: "-0.005em",
              color: "var(--ink)",
              fontWeight: 400,
              textWrap: "pretty",
            }}
          >
            <span className="md:hidden">{prompt}</span>
            <span className="hidden md:inline" style={{ fontSize: 24 }}>
              {prompt}
            </span>
          </h1>
          {helper ? (
            <p
              className="font-serif italic"
              style={{
                fontSize: 14,
                color: "var(--ink-soft)",
                lineHeight: 1.5,
              }}
            >
              <span className="md:hidden">{helper}</span>
              <span className="hidden md:inline" style={{ fontSize: 15 }}>
                {helper}
              </span>
            </p>
          ) : null}
          <div>{children}</div>
        </section>

        <footer
          className="flex items-center justify-between gap-3 px-6 py-5 md:px-10"
          style={{ borderTop: "1px solid var(--rule-soft)" }}
        >
          <div className="min-w-0 flex-1 flex justify-start">
            {onBack ? (
              <button
                onClick={onBack}
                data-focus-ring
                className="font-mono uppercase"
                style={{
                  fontSize: 12,
                  letterSpacing: "0.08em",
                  color: "var(--ink-mute)",
                  background: "transparent",
                  border: "none",
                  padding: "10px 0",
                  cursor: "pointer",
                  minHeight: 44,
                }}
              >
                ← back
              </button>
            ) : null}
          </div>
          <p
            className="font-mono uppercase text-center"
            style={{
              fontSize: 10,
              letterSpacing: "0.12em",
              color: "var(--ink-mute)",
            }}
          >
            draft in progress
          </p>
          <div
            className="min-w-0 flex-1 flex flex-col items-end"
            style={{ gap: 6 }}
          >
            <button
              onClick={onContinue}
              disabled={!canContinue}
              data-focus-ring
              className="font-mono uppercase"
              style={{
                fontSize: 12,
                letterSpacing: "0.08em",
                background: canContinue ? "var(--umber)" : "transparent",
                color: canContinue ? "var(--paper)" : "var(--ink-faint)",
                border: canContinue
                  ? "1px solid var(--umber)"
                  : "1px solid var(--rule)",
                padding: "12px 18px",
                cursor: canContinue ? "pointer" : "not-allowed",
                minHeight: 44,
                transition: "background 120ms ease-out",
              }}
            >
              {continueLabel.toLowerCase()} →
            </button>
            {skipVisible ? (
              <button
                type="button"
                onClick={onSkip}
                aria-label="Skip this question; we'll come back with examples"
                data-focus-ring
                className="font-mono uppercase skip-link"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  color: "var(--ink-mute)",
                  background: "transparent",
                  border: "none",
                  padding: "4px 0",
                  cursor: "pointer",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                skip — i&rsquo;ll come back to this
              </button>
            ) : null}
          </div>
        </footer>
      </div>
    </main>
  );
}
