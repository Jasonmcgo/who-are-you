// CC-110 — shared cache-key builder for the launchPolishV3 ("V3") layer.
//
// Two surfaces consume the V3 LLM rewrites:
//
//   - React on-screen (`/api/report-cards` → resolveScopedRewritesLive
//     → InnerConstitutionPage).
//   - Markdown export (`/api/render` → renderMirrorAsMarkdownLive →
//     renderMirrorAsMarkdown, user mode only).
//
// Both surfaces must build the **same** `V3RewriteInputs` for a given
// (constitution, sectionId) pair, or the cache key diverges and the
// markdown export silently misses the entire warm V3 cache. This helper
// is the single source of truth for that construction; both surfaces
// import it.
//
// Pure data — no node:* imports, no SDK. Safe to import from either the
// server-only render path or the client-bundle-safe sync render path.
//
// CC-110 V3 section scope (markdown splice consumes 6 of 7):
//   1. executiveRead              ✓
//   2. corePattern                ✓
//   3. whatOthersMayExperience    ✓
//   4. whenTheLoadGetsHeavy       ✓
//   5. synthesis                  ✓
//   6. closingRead                ✓
//   7. pathTriptych               ✗ (sliced from inside Path · Gait card;
//                                   four-card splice already replaces
//                                   that body — separate CC).

import {
  COMPASS_LABEL,
  getTopCompassValues,
} from "./identityEngine";
import {
  deriveQuieterAxis,
  type V3RewriteInputs,
  type V3SectionId,
} from "./launchPolishV3Llm";
import type { InnerConstitution } from "./types";

// Markdown header per V3 section. Used to slice the clinician-mode
// markdown into per-section bodies that the V3 LLM rewrites consume.
// `pathTriptych` is extracted from inside the Path · Gait card body
// (not at its own top-level header) — see `extractPathTriptych` below.
export const V3_HEADERS: Record<V3SectionId, string> = {
  executiveRead: "## Executive Read",
  corePattern: "## Your Core Pattern",
  whatOthersMayExperience: "## What Others May Experience",
  whenTheLoadGetsHeavy: "## When the Load Gets Heavy",
  synthesis: "## A Synthesis",
  closingRead: "## Closing Read",
  pathTriptych: "",
};

// Canon lines the V3 LLM is told NOT to echo. The list participates in
// the cache key, so it must be stable across surfaces.
export const RESERVED_CANON_LINES = [
  "visible, revisable, present-tense structure",
  "grounded, legible, and free",
  "the work is not to care less; it is to let love become sustainable enough to last",
  "the work is not to abandon what has endured; it is to let what has endured remain alive enough to update",
];

// V3 sections that the markdown user-mode splice substitutes (CC-110
// scope). pathTriptych is out of scope here.
export const V3_MARKDOWN_SPLICE_SECTION_IDS: V3SectionId[] = [
  "executiveRead",
  "corePattern",
  "whatOthersMayExperience",
  "whenTheLoadGetsHeavy",
  "synthesis",
  "closingRead",
];

export function extractV3Section(md: string, header: string): string | null {
  const idx = md.indexOf(header);
  if (idx < 0) return null;
  const rest = md.slice(idx);
  const depth = header.startsWith("## ") && !header.startsWith("### ") ? 2 : 3;
  const stop = depth === 2 ? /\n## / : /\n## |\n### /;
  const next = rest.slice(header.length).search(stop);
  return next < 0 ? rest.trimEnd() : rest.slice(0, header.length + next).trimEnd();
}

// pathTriptych extractor — pulls the Work/Love/Give bold-labeled blocks
// from inside the Path · Gait card. Matches `resolveScopedRewritesLive`
// behavior exactly; included here so the helper covers all 7 sections,
// even though CC-110's markdown splice only consumes 6.
export function extractV3PathTriptych(md: string): string | null {
  const lines = md.split("\n");
  const blocks: string[] = [];
  for (const label of ["**Work**", "**Love**", "**Give**"]) {
    const idx = lines.findIndex((l) => l.startsWith(label));
    if (idx < 0) continue;
    const chunk: string[] = [lines[idx]];
    for (let i = idx + 1; i < lines.length; i++) {
      const next = lines[i];
      if (
        /^\*\*(?:Work|Love|Give|Practice|Pattern Note|Pattern in motion|Movement Note|This week)\*\*/.test(
          next
        ) ||
        /^## /.test(next) ||
        /^### /.test(next)
      ) {
        break;
      }
      chunk.push(next);
    }
    blocks.push(chunk.join("\n").trimEnd());
  }
  if (blocks.length === 0) return null;
  return blocks.join("\n\n");
}

/**
 * Build `V3RewriteInputs` for one section. Returns null when the section
 * body is absent from the engine markdown (a constitution-shape that
 * doesn't emit that section). Both the React surface and the markdown
 * surface MUST construct V3 inputs through this helper — a second copy
 * is a two-truth hazard that silently reintroduces the cold-export bug.
 */
export function buildV3SectionInputs(
  clinMd: string,
  constitution: InnerConstitution,
  sectionId: V3SectionId
): V3RewriteInputs | null {
  const body =
    sectionId === "pathTriptych"
      ? extractV3PathTriptych(clinMd)
      : extractV3Section(clinMd, V3_HEADERS[sectionId]);
  if (!body) return null;

  const archetype = constitution.profileArchetype?.primary ?? "unmappedType";
  const topCompassValueLabels = getTopCompassValues(constitution.signals)
    .map((r) => COMPASS_LABEL[r.signal_id] ?? r.signal_id)
    .filter((s) => s.length > 0);
  const dashboard = constitution.goalSoulMovement?.dashboard;
  const quieterAxis = deriveQuieterAxis(
    dashboard?.goalScore ?? null,
    dashboard?.soulScore ?? null
  );

  return {
    sectionId,
    archetype,
    engineSectionBody: body,
    topCompassValueLabels,
    reservedCanonLines: RESERVED_CANON_LINES,
    quieterAxis,
  };
}
