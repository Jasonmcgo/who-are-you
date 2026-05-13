// CC-PROSE-1B Layer 4 — Core Signal Map composer.
//
// Pulls 12 canonical cells from the existing InnerConstitution outputs
// into an at-a-glance grid that renders immediately after the Executive
// Read callout, before "How to Read This." Every cell is a verbatim lift
// from existing engine output — no new vocabulary, no synthesis.
//
// Signal-grounding canon: the grid is a re-presentation of computed
// outputs, not a re-derivation. Empty source fields render the cell with
// a blank value rather than skipping (audit-enforced); the grid stays
// visually balanced even on thin-signal fixtures.
//
// Twelve cells in canonical order:
//   1.  Driver           lens_stack.dominant (FUNCTION_VOICE_SHORT, Title-cased)
//   2.  Support          lens_stack.auxiliary
//   3.  Protected value  topCompass[0] via COMPASS_LABEL
//   4.  First blame lens topGravity[0] via GRAVITY_LABEL
//   5.  Surface label    lens_stack.mbtiCode + ", provisional" (when present)
//   6.  Work map         workMap.matches[0].register.register_label
//   7.  Love map         loveMap.matches[0].register.register_label
//   8.  Pressure pull    grippingPull.signals.slice(0,3).humanReadable.join(", ")
//   9.  Movement         "Goal {goal} / Soul {soul}"
//   10. Direction        "{angle}°, {descriptor}"
//   11. Strength         "{length}, {descriptor}" (or "0 — line not drawn")
//   12. Grip             "{score} / 100"

import {
  COMPASS_LABEL,
  FUNCTION_VOICE_SHORT,
  GRAVITY_LABEL,
  getTopCompassValues,
  getTopGravityAttribution,
} from "./identityEngine";
import type { InnerConstitution } from "./types";

export type CoreSignalCell = {
  label: string;
  value: string;
};

// Canonical cell order — used by both markdown and React render paths.
// Audit asserts all 12 labels appear in the rendered output, preserving
// the order so a reader can scan the grid the same way every time.
export const CORE_SIGNAL_CELL_LABELS: readonly string[] = [
  "Driver",
  "Support",
  "Protected value",
  "First blame lens",
  "Surface label",
  "Work map",
  "Love map",
  "Pressure pull",
  "Movement",
  "Direction",
  "Strength",
  "Grip",
];

// CC-PROSE-1B canonical italic line under the grid. Second-person; the
// closing engine voice. Audit asserts this line renders verbatim.
export const CORE_SIGNAL_MAP_FOOTER =
  "The useful question is not whether the read is final. It is whether it helps you become more grounded, more legible, and more free.";

function titleCase(s: string): string {
  if (s.length === 0) return s;
  // FUNCTION_VOICE_SHORT entries are already lower-kebab ("pattern-reader",
  // "inner compass"). Capitalize the first letter only — preserves the
  // engine's body-of-work casing for compound words.
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function buildCoreSignalCells(
  constitution: InnerConstitution
): CoreSignalCell[] {
  const stack = constitution.lens_stack;

  // 1. Driver — Lens dominant, title-cased.
  const driverValue = titleCase(FUNCTION_VOICE_SHORT[stack.dominant] ?? "");

  // 2. Support — Lens auxiliary.
  const supportValue = titleCase(FUNCTION_VOICE_SHORT[stack.auxiliary] ?? "");

  // 3. Protected value — top compass label.
  const topCompass = getTopCompassValues(constitution.signals);
  const protectedValue =
    topCompass.length > 0
      ? COMPASS_LABEL[topCompass[0].signal_id] ?? topCompass[0].signal_id
      : "";

  // 4. First blame lens — top gravity label.
  const topGravity = getTopGravityAttribution(constitution.signals);
  const blameLens =
    topGravity.length > 0
      ? GRAVITY_LABEL[topGravity[0].signal_id] ?? topGravity[0].signal_id
      : "";

  // 5. Surface label — MBTI code + ", provisional". Empty when not high-confidence
  //    (mirrors the canonical disclosure rule in renderMirror.ts §1a).
  const mbti = stack.confidence === "high" && stack.mbtiCode ? stack.mbtiCode : "";
  const surfaceLabel = mbti ? `${mbti}, provisional` : "";

  // 6. Work map — first register match's label, if any.
  const workLabel =
    constitution.workMap?.matches[0]?.register.register_label ?? "";

  // 7. Love map — first register match's label, if any.
  const loveLabel =
    constitution.loveMap?.matches[0]?.register.register_label ?? "";

  // 8. Pressure pull — top 3 grippingPull signals, comma-joined.
  const dashboard = constitution.goalSoulMovement?.dashboard;
  const gripSignals = dashboard?.grippingPull?.signals ?? [];
  const pressurePull = gripSignals
    .slice(0, 3)
    .map((s) => s.humanReadable)
    .join(", ");

  // 9. Movement — "Goal X / Soul Y" if dashboard present, else empty.
  const movement = dashboard
    ? `Goal ${dashboard.goalScore} / Soul ${dashboard.soulScore}`
    : "";

  // 10. Direction — "{angle}°, {descriptor}".
  const direction = dashboard
    ? `${Math.round(dashboard.direction.angle)}°, ${dashboard.direction.descriptor}`
    : "";

  // 11. Strength — "{length}, {descriptor}" (or "0 — line not drawn" when
  //     length === 0, mirroring the canonical zero-origin special-case in
  //     renderMirror.ts).
  let strength = "";
  if (dashboard) {
    const ms = dashboard.movementStrength;
    if (ms.length === 0) {
      strength = "0 — line not drawn";
    } else {
      strength = `${ms.length.toFixed(1)}, ${ms.descriptor}`;
    }
  }

  // 12. Grip — "{score} / 100".
  const grip = dashboard ? `${dashboard.grippingPull.score} / 100` : "";

  return [
    { label: "Driver", value: driverValue },
    { label: "Support", value: supportValue },
    { label: "Protected value", value: protectedValue },
    { label: "First blame lens", value: blameLens },
    { label: "Surface label", value: surfaceLabel },
    { label: "Work map", value: workLabel },
    { label: "Love map", value: loveLabel },
    { label: "Pressure pull", value: pressurePull },
    { label: "Movement", value: movement },
    { label: "Direction", value: direction },
    { label: "Strength", value: strength },
    { label: "Grip", value: grip },
  ];
}

// Markdown render — three 4-cell tables stacked. Each table is a
// header-row + value-row pair. This format renders correctly in every
// markdown viewer (no fenced HTML required) and degrades to a readable
// label/value list in plain text. Empty values render as a single space
// so the column structure stays intact.
export function renderCoreSignalMapMarkdown(
  constitution: InnerConstitution,
  renderMode: "user" | "clinician" = "clinician"
): string {
  const cells = buildCoreSignalCells(constitution);
  // CC-SUBSTITUTION-LEAK-CLEANUP — Leak 1. The "Surface label" cell emits
  // "${mbti}, provisional" in clinician mode. In user mode the TWO-TIER
  // strip removes the four-letter code, leaving the orphan ", provisional"
  // fragment. Replace the cell value with "provisional" alone for user
  // mode (the masthead already carries the surface-label disclosure).
  if (renderMode === "user") {
    for (const cell of cells) {
      if (cell.label === "Surface label" && cell.value.length > 0) {
        cell.value = "provisional";
      }
    }
  }
  const out: string[] = [];

  // Three rows of 4 cells each. Each row renders as its own markdown
  // table; surrounding blank lines keep markdown parsers from collapsing
  // adjacent rows.
  for (let row = 0; row < 3; row++) {
    const slice = cells.slice(row * 4, row * 4 + 4);
    const headerRow = `| ${slice.map((c) => c.label).join(" | ")} |`;
    const sepRow = `| ${slice.map(() => "---").join(" | ")} |`;
    const valueRow = `| ${slice.map((c) => c.value || "—").join(" | ")} |`;
    out.push(headerRow);
    out.push(sepRow);
    out.push(valueRow);
    if (row < 2) out.push("");
  }

  out.push("");
  out.push(`*${CORE_SIGNAL_MAP_FOOTER}*`);

  return out.join("\n");
}
