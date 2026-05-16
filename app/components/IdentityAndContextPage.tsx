"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  DEMOGRAPHIC_FIELDS,
  type DemographicField,
  type FieldState,
} from "../../data/demographics";
import type { DemographicAnswer } from "../../lib/types";

// CC-019 — Identity & Context page. Renders after the user opts in via the
// Save affordance on the result page, before the database write. Per spec
// (Item 6 / Item 7): every field is optional, "Prefer not to say" is a
// canonical opt-out distinct from not-answered, and the visual register is
// clearly separate from the eight-card test flow.
//
// CC-022a — flow inverted to save-before-portrait per the amended Rule 5
// (research-mode posture). The page now renders directly after the last
// Keystone question; submitting writes the session, then the portrait
// renders. Header copy updated; scroll-to-top added because the prior
// flow's auto-focus pulled the viewport to the bottom of the form.

type Props = {
  onSubmit: (
    answers: DemographicAnswer[],
    contact: { email: string; mobile: string | null }
  ) => void;
  // CC-DEMOGRAPHICS-SAVE-WIRING — Skip now carries whatever partial
  // state the user has typed (answers + email + mobile). If the user
  // got blocked by the email gate but had already filled their name,
  // gender, profession, etc., Skip preserves it rather than dropping
  // the lot. The `partial` arg is optional so prior callers (none
  // outside this file) continue to compile.
  onSkip: (
    partial?: {
      answers: DemographicAnswer[];
      contact: { email: string | null; mobile: string | null };
    }
  ) => void;
  isSubmitting?: boolean;
};

// CC-HEADER-NAV-AND-EMAIL-GATE — permissive email regex per Rule 2.
// Requires `something@something.something`; no SMTP-grade strictness.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// CC-HEADER-NAV-AND-EMAIL-GATE — optional mobile: when non-empty,
// must look phone-ish. Allows digits, spaces, dashes, parens, plus,
// and periods (e.g., 734.474.5112 is a normal US format). Empty
// passes. Storage keeps the raw input intact.
const MOBILE_RE = /^[\d\s\-+().]+$/;

export function isValidEmail(s: string): boolean {
  return EMAIL_RE.test(s.trim());
}

export function isAcceptableMobile(s: string): boolean {
  const trimmed = s.trim();
  if (trimmed.length === 0) return true;
  return MOBILE_RE.test(trimmed);
}

type LocalFieldState = {
  state: FieldState;
  value?: string; // selected option id, or freeform text
  other_text?: string; // present when value === "other" on Other-with-text fields
  // For location: country + region (joined as "country | region" in `value`).
  location_country?: string;
  location_region?: string;
};

export default function IdentityAndContextPage({
  onSubmit,
  onSkip,
  isSubmitting,
}: Props) {
  const [fieldState, setFieldState] = useState<Record<string, LocalFieldState>>(
    {}
  );
  // CC-HEADER-NAV-AND-EMAIL-GATE — contact fields. Email is required +
  // gates the Continue button; mobile is optional but if filled must
  // look phone-ish. `attemptedSubmit` arms the red error helper text
  // only after the user has tried to proceed (avoids shouting at them
  // before they've finished typing).
  const [email, setEmail] = useState<string>("");
  const [mobile, setMobile] = useState<string>("");
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const emailValid = isValidEmail(email);
  const mobileValid = isAcceptableMobile(mobile);
  const canSubmit = emailValid && mobileValid;

  // CC-022a Item 8 — reset scroll on mount. The prior flow's submit-area
  // chrome (or browser autoscroll-into-view from focus) was landing the
  // viewport at the bottom; the user should read from the page header
  // downward.
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, []);

  function get(fieldId: string): LocalFieldState {
    return fieldState[fieldId] ?? { state: "not_answered" };
  }

  function setSpecified(fieldId: string, value: string, otherText?: string) {
    setFieldState((prev) => ({
      ...prev,
      [fieldId]: {
        state: "specified",
        value,
        ...(otherText !== undefined ? { other_text: otherText } : {}),
      },
    }));
  }

  function setOptOut(fieldId: string) {
    setFieldState((prev) => ({
      ...prev,
      [fieldId]: { state: "prefer_not_to_say" },
    }));
  }

  function setLocation(country: string, region: string) {
    const value = region ? `${country} | ${region}` : country;
    setFieldState((prev) => ({
      ...prev,
      location: {
        state: country.trim().length > 0 ? "specified" : "not_answered",
        value: value.trim().length > 0 ? value : undefined,
        location_country: country,
        location_region: region,
      },
    }));
  }

  function handleSave() {
    // CC-HEADER-NAV-AND-EMAIL-GATE — required email gate. If missing
    // or malformed, arm the error helper and stop. Mobile is optional
    // but blocks submission when present + malformed.
    if (!canSubmit) {
      setAttemptedSubmit(true);
      return;
    }
    const answers: DemographicAnswer[] = DEMOGRAPHIC_FIELDS.map((f) => {
      const s = get(f.field_id);
      if (s.state === "prefer_not_to_say") {
        return { field_id: f.field_id, state: "prefer_not_to_say" };
      }
      if (s.state === "specified" && s.value) {
        return {
          field_id: f.field_id,
          state: "specified",
          value: s.value,
          ...(s.other_text ? { other_text: s.other_text } : {}),
        };
      }
      return { field_id: f.field_id, state: "not_answered" };
    });
    onSubmit(answers, {
      email: email.trim(),
      mobile: mobile.trim().length > 0 ? mobile.trim() : null,
    });
  }

  return (
    <main
      className="min-h-screen"
      style={{ background: "var(--paper)", color: "var(--ink)" }}
    >
      <div
        className="mx-auto px-6 py-10 md:px-10 md:py-14"
        style={{ maxWidth: 640 }}
      >
        <header
          className="flex flex-col items-center text-center"
          style={{ gap: 10, paddingBottom: 28 }}
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
            Identity & Context
          </p>
          <p
            className="font-serif italic text-[15px] md:text-[16px]"
            style={{
              color: "var(--ink-soft)",
              margin: 0,
              lineHeight: 1.5,
              maxWidth: 540,
            }}
          >
            Before we share your reading, would you tell us a little about who
            you are? This helps the model frame your read with more context.
            Every field is optional, and &ldquo;Prefer not to say&rdquo; is a
            real answer the model treats as informative.
          </p>
        </header>

        <div
          style={{
            height: 1,
            background: "var(--rule)",
            marginBottom: 24,
          }}
        />

        <div className="flex flex-col" style={{ gap: 36 }}>
          {/* CC-HEADER-NAV-AND-EMAIL-GATE — contact block. Email is
              required; mobile is optional. Rendered above the existing
              optional demographic fields so the gate is visually clear
              before the user enters the rest of the form. */}
          <ContactBlock
            email={email}
            mobile={mobile}
            emailValid={emailValid}
            mobileValid={mobileValid}
            attemptedSubmit={attemptedSubmit}
            onEmailChange={(v) => {
              setEmail(v);
              if (attemptedSubmit) setAttemptedSubmit(false);
            }}
            onMobileChange={(v) => {
              setMobile(v);
              if (attemptedSubmit) setAttemptedSubmit(false);
            }}
          />

          {DEMOGRAPHIC_FIELDS.map((field) => (
            <FieldBlock
              key={field.field_id}
              field={field}
              state={get(field.field_id)}
              onSpecify={(value, otherText) =>
                setSpecified(field.field_id, value, otherText)
              }
              onOptOut={() => setOptOut(field.field_id)}
              onLocation={(country, region) => setLocation(country, region)}
            />
          ))}
        </div>

        <div
          style={{
            height: 1,
            background: "var(--rule)",
            marginTop: 36,
            marginBottom: 24,
          }}
        />

        <footer
          className="flex flex-col"
          style={{ gap: 14, paddingBottom: 12 }}
        >
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting || !canSubmit}
            aria-disabled={isSubmitting || !canSubmit}
            data-focus-ring
            className="font-mono uppercase"
            style={{
              fontSize: 12,
              letterSpacing: "0.08em",
              background:
                isSubmitting || !canSubmit ? "transparent" : "var(--umber)",
              color:
                isSubmitting || !canSubmit
                  ? "var(--ink-faint)"
                  : "var(--paper)",
              border:
                isSubmitting || !canSubmit
                  ? "1px solid var(--rule)"
                  : "1px solid var(--umber)",
              padding: "14px 20px",
              cursor:
                isSubmitting || !canSubmit ? "not-allowed" : "pointer",
              minHeight: 48,
              transition: "background 120ms ease-out",
              alignSelf: "stretch",
              opacity: !canSubmit && !isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? "saving…" : "save and finish →"}
          </button>
          <button
            type="button"
            onClick={() => {
              // CC-DEMOGRAPHICS-SAVE-WIRING — Skip preserves whatever
              // partial state the user has typed: demographic answers
              // they filled, email (if it looks valid), mobile (if it
              // looks phone-ish). Lets users who get blocked by the
              // email gate still save the rest.
              const partialAnswers: DemographicAnswer[] = DEMOGRAPHIC_FIELDS
                .map((f) => {
                  const s = get(f.field_id);
                  if (s.state === "prefer_not_to_say") {
                    return {
                      field_id: f.field_id,
                      state: "prefer_not_to_say",
                    } as DemographicAnswer;
                  }
                  if (s.state === "specified" && s.value) {
                    return {
                      field_id: f.field_id,
                      state: "specified",
                      value: s.value,
                      ...(s.other_text ? { other_text: s.other_text } : {}),
                    } as DemographicAnswer;
                  }
                  return null;
                })
                .filter((x): x is DemographicAnswer => x !== null);
              const trimmedEmail = email.trim();
              const trimmedMobile = mobile.trim();
              onSkip({
                answers: partialAnswers,
                contact: {
                  email:
                    trimmedEmail.length > 0 && emailValid
                      ? trimmedEmail
                      : null,
                  mobile:
                    trimmedMobile.length > 0 && mobileValid
                      ? trimmedMobile
                      : null,
                },
              });
            }}
            disabled={isSubmitting}
            data-focus-ring
            className="font-mono uppercase"
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              color: "var(--ink-mute)",
              background: "transparent",
              border: "none",
              padding: "8px 0",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            skip — save without these
          </button>
          <p
            className="font-serif italic text-center"
            style={{
              fontSize: 13,
              color: "var(--ink-soft)",
              margin: 0,
              lineHeight: 1.5,
              paddingTop: 6,
            }}
          >
            Either path saves your session and shows your reading. The
            difference is what the model knows about who took it.
          </p>
        </footer>
      </div>
    </main>
  );
}

// CC-HEADER-NAV-AND-EMAIL-GATE — contact block. Required email +
// optional mobile. Visually consistent with the existing FieldBlock
// register; one error helper toggles red when an invalid email is
// submitted. No modal / alert / toast.
function ContactBlock({
  email,
  mobile,
  emailValid,
  mobileValid,
  attemptedSubmit,
  onEmailChange,
  onMobileChange,
}: {
  email: string;
  mobile: string;
  emailValid: boolean;
  mobileValid: boolean;
  attemptedSubmit: boolean;
  onEmailChange: (v: string) => void;
  onMobileChange: (v: string) => void;
}) {
  const emailError = attemptedSubmit && !emailValid;
  const mobileError = attemptedSubmit && !mobileValid && mobile.trim().length > 0;
  return (
    <section
      className="flex flex-col"
      style={{
        gap: 14,
        padding: "18px 0",
        borderBottom: "1px solid var(--rule-soft, rgba(26,23,19,0.08))",
      }}
    >
      <div className="flex flex-col" style={{ gap: 6 }}>
        <label
          htmlFor="contact-email"
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            color: "var(--ink-mute, #807566)",
          }}
        >
          Email address
        </label>
        <input
          id="contact-email"
          type="email"
          required
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          aria-invalid={emailError}
          aria-describedby="contact-email-helper"
          className="font-serif"
          style={{
            fontSize: 15,
            color: "var(--ink, #1a1713)",
            background: "var(--paper, #f6f2ea)",
            border: `1px solid ${
              emailError
                ? "var(--umber, #8a4a1f)"
                : "var(--rule, rgba(26,23,19,0.14))"
            }`,
            borderRadius: 6,
            padding: "10px 12px",
            outline: "none",
          }}
        />
        <p
          id="contact-email-helper"
          className="font-serif italic"
          style={{
            fontSize: 13,
            color: emailError
              ? "var(--umber, #8a4a1f)"
              : "var(--ink-soft, #433d33)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {emailError
            ? "Please enter a valid email to view your reading."
            : "Required to view your reading. We won't share your email."}
        </p>
      </div>
      <div className="flex flex-col" style={{ gap: 6 }}>
        <label
          htmlFor="contact-mobile"
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            color: "var(--ink-mute, #807566)",
          }}
        >
          Mobile number
        </label>
        <input
          id="contact-mobile"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={mobile}
          onChange={(e) => onMobileChange(e.target.value)}
          aria-invalid={mobileError}
          aria-describedby="contact-mobile-helper"
          className="font-serif"
          style={{
            fontSize: 15,
            color: "var(--ink, #1a1713)",
            background: "var(--paper, #f6f2ea)",
            border: `1px solid ${
              mobileError
                ? "var(--umber, #8a4a1f)"
                : "var(--rule, rgba(26,23,19,0.14))"
            }`,
            borderRadius: 6,
            padding: "10px 12px",
            outline: "none",
          }}
        />
        <p
          id="contact-mobile-helper"
          className="font-serif italic"
          style={{
            fontSize: 13,
            color: mobileError
              ? "var(--umber, #8a4a1f)"
              : "var(--ink-soft, #433d33)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {mobileError
            ? "Please enter a valid phone number, or leave this blank."
            : "Optional. Only for follow-up if you ask for it."}
        </p>
      </div>
      <p
        className="font-serif italic"
        style={{
          fontSize: 12,
          color: "var(--ink-mute, #807566)",
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        We won&apos;t share your contact info.
      </p>
    </section>
  );
}

function FieldBlock({
  field,
  state,
  onSpecify,
  onOptOut,
  onLocation,
}: {
  field: DemographicField;
  state: LocalFieldState;
  onSpecify: (value: string, otherText?: string) => void;
  onOptOut: () => void;
  onLocation: (country: string, region: string) => void;
}) {
  const isOptOut = state.state === "prefer_not_to_say";
  return (
    <section className="flex flex-col" style={{ gap: 10 }}>
      <p
        className="font-serif"
        style={{
          fontSize: 16,
          color: "var(--ink)",
          margin: 0,
          lineHeight: 1.45,
          fontWeight: 500,
        }}
      >
        {field.question}
      </p>
      {field.helper ? (
        <p
          className="font-mono"
          style={{
            fontSize: 11,
            letterSpacing: "0.04em",
            color: "var(--ink-mute)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {field.helper}
        </p>
      ) : null}

      {!isOptOut ? renderInput(field, state, onSpecify, onLocation) : null}

      <div
        className="flex flex-row items-center"
        style={{ gap: 10, paddingTop: 4 }}
      >
        <button
          type="button"
          role="radio"
          aria-checked={isOptOut}
          onClick={onOptOut}
          data-focus-ring
          className="font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.12em",
            padding: "5px 10px",
            background: isOptOut ? "var(--ink-mute)" : "transparent",
            color: isOptOut ? "var(--paper)" : "var(--ink-mute)",
            border: isOptOut
              ? "1px solid var(--ink-mute)"
              : "1px solid var(--rule)",
            borderRadius: 4,
            cursor: "pointer",
            transition:
              "background 120ms ease-out, color 120ms ease-out",
          }}
        >
          {field.prefer_not_to_say_label}
        </button>
        {isOptOut ? (
          <span
            className="font-serif italic"
            style={{ fontSize: 13, color: "var(--ink-soft)" }}
          >
            opted out — the model treats this as informative.
          </span>
        ) : null}
      </div>
    </section>
  );
}

function renderInput(
  field: DemographicField,
  state: LocalFieldState,
  onSpecify: (value: string, otherText?: string) => void,
  onLocation: (country: string, region: string) => void
): ReactNode {
  if (field.field_id === "location") {
    return (
      <div className="flex flex-col" style={{ gap: 8 }}>
        <input
          type="text"
          placeholder="Country"
          value={state.location_country ?? ""}
          onChange={(e) =>
            onLocation(e.target.value, state.location_region ?? "")
          }
          data-focus-ring
          className="font-serif"
          style={{
            background: "var(--paper-warm)",
            color: "var(--ink)",
            border: "1px solid var(--rule)",
            padding: "10px 12px",
            fontSize: 15,
            borderRadius: 6,
          }}
        />
        <input
          type="text"
          placeholder="Region (optional)"
          value={state.location_region ?? ""}
          onChange={(e) =>
            onLocation(state.location_country ?? "", e.target.value)
          }
          data-focus-ring
          className="font-serif"
          style={{
            background: "var(--paper-warm)",
            color: "var(--ink)",
            border: "1px solid var(--rule)",
            padding: "10px 12px",
            fontSize: 15,
            borderRadius: 6,
          }}
        />
      </div>
    );
  }
  if (field.type === "freeform") {
    return (
      <input
        type="text"
        value={state.value ?? ""}
        onChange={(e) => onSpecify(e.target.value)}
        data-focus-ring
        className="font-serif"
        style={{
          background: "var(--paper-warm)",
          color: "var(--ink)",
          border: "1px solid var(--rule)",
          padding: "10px 12px",
          fontSize: 15,
          borderRadius: 6,
        }}
      />
    );
  }
  if (
    field.type === "single_select" ||
    field.type === "single_select_with_other"
  ) {
    const options = field.options ?? [];
    const selected = state.value;
    const otherOption = options.find((o) => o.allows_text);
    const otherSelected = selected === otherOption?.id;
    return (
      <div
        className="flex flex-col"
        role="radiogroup"
        aria-label={field.question}
        style={{ gap: 6 }}
      >
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => {
                if (opt.allows_text) {
                  onSpecify(opt.id, state.other_text ?? "");
                } else {
                  onSpecify(opt.id);
                }
              }}
              data-focus-ring
              className="font-serif text-left"
              style={{
                background: isSelected
                  ? "var(--umber-wash)"
                  : "var(--paper-warm)",
                border: isSelected
                  ? "1px solid var(--umber)"
                  : "1px solid var(--rule)",
                color: "var(--ink)",
                padding: "10px 12px",
                fontSize: 15,
                lineHeight: 1.4,
                borderRadius: 6,
                cursor: "pointer",
                transition:
                  "background 120ms ease-out, border-color 120ms ease-out",
              }}
            >
              {opt.label}
            </button>
          );
        })}
        {otherSelected && otherOption ? (
          <input
            type="text"
            placeholder="Please specify…"
            value={state.other_text ?? ""}
            onChange={(e) => onSpecify(otherOption.id, e.target.value)}
            data-focus-ring
            className="font-serif"
            style={{
              background: "var(--paper-warm)",
              color: "var(--ink)",
              border: "1px solid var(--rule)",
              padding: "10px 12px",
              fontSize: 15,
              borderRadius: 6,
              marginTop: 4,
            }}
          />
        ) : null}
      </div>
    );
  }
  return null;
}
