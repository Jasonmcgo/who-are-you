// CC-REACT-ON-SCREEN-LLM-RENDER — async helper that runs the same
// per-section LLM resolver chain as `renderMirrorAsMarkdownLive` but
// returns the LLM rewrites as a structured object instead of splicing
// them into a single markdown blob. The on-screen React render fetches
// this via `/api/report-cards` and threads each section's markdown
// down to the corresponding card component.
//
// Reuses every piece of CC-LIVE-SESSION-LLM-WIRING infrastructure:
// SessionLlmBudget, runtime cache, resolveProseRewriteLive,
// resolveKeystoneRewriteLive. Same timeout, same cost guard, same
// failure-mode contract. Differs from `renderMirrorAsMarkdownLive`
// only in the output shape — no markdown splicing.

import { renderMirrorAsMarkdown } from "./renderMirror";
import {
  resolveProseRewriteLive,
  type ProseLiveResolveOptions,
} from "./proseRewriteLlmServer";
import {
  resolveKeystoneRewriteLive,
  type KeystoneLiveResolveOptions,
} from "./keystoneRewriteLlmServer";
import {
  resolveV3RewriteLive,
  type V3LiveResolveOptions,
} from "./launchPolishV3LlmServer";
import {
  V3_SECTION_IDS,
  type V3RewriteInputs,
  type V3SectionId,
} from "./launchPolishV3Llm";
import { COMPASS_LABEL, getTopCompassValues } from "./identityEngine";
import {
  summarizeQI2Selections,
  summarizeQI3Selections,
} from "./beliefHeuristics";
import type {
  ProseCardId,
  ProseRewriteInputs,
} from "./proseRewriteLlm";
import type { KeystoneRewriteInputs } from "./keystoneRewriteLlm";
import { SessionLlmBudget } from "./cacheObservability";
import type { LlmRewritesBundle } from "./llmRewritesBundle";
import type { Answer, DemographicSet, InnerConstitution } from "./types";

const SCOPED_HEADERS: Record<ProseCardId, string> = {
  lens: "### Lens — Eyes",
  compass: "### Compass — Heart",
  hands: "### Hands — Work",
  path: "## Path — Gait",
};

// CC-LAUNCH-VOICE-POLISH-V3 — markdown header per V3 section. Used to
// slice the clinician-mode markdown into per-section bodies that the
// V3 LLM rewrites consume.
const V3_HEADERS: Record<V3SectionId, string> = {
  executiveRead: "## Executive Read",
  corePattern: "## Your Core Pattern",
  whatOthersMayExperience: "## What Others May Experience",
  whenTheLoadGetsHeavy: "## When the Load Gets Heavy",
  synthesis: "## A Synthesis",
  closingRead: "## Closing Read",
  // pathTriptych is special — extracted from inside the Path · Gait card
  // (level 2 section), not at its own top-level header. Handled below.
  pathTriptych: "",
};

// Extract the Work/Love/Give triptych from inside the Path · Gait card.
// Pattern: lines starting with `**Work** — ...`, `**Love** — ...`,
// `**Give** — ...`. Returns concatenated block, or null if all three
// are absent.
function extractPathTriptych(md: string): string | null {
  const lines = md.split("\n");
  const blocks: string[] = [];
  for (const label of ["**Work**", "**Love**", "**Give**"]) {
    const idx = lines.findIndex((l) => l.startsWith(label));
    if (idx < 0) continue;
    // Collect this line + any continuation lines until the next blank +
    // bold marker, or end of file.
    const chunk: string[] = [lines[idx]];
    for (let i = idx + 1; i < lines.length; i++) {
      const next = lines[i];
      if (
        /^\*\*(?:Work|Love|Give|Practice|Pattern Note|Pattern in motion|Movement Note)\*\*/.test(
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

const RESERVED_CANON_LINES = [
  "visible, revisable, present-tense structure",
  "grounded, legible, and free",
  "the work is not to care less; it is to let love become sustainable enough to last",
  "the work is not to abandon what has endured; it is to let what has endured remain alive enough to update",
];

function extractSection(md: string, header: string): string | null {
  const idx = md.indexOf(header);
  if (idx < 0) return null;
  const rest = md.slice(idx);
  const depth = header.startsWith("## ") && !header.startsWith("### ") ? 2 : 3;
  const stop = depth === 2 ? /\n## / : /\n## |\n### /;
  const next = rest.slice(header.length).search(stop);
  return next < 0 ? rest.trimEnd() : rest.slice(0, header.length + next).trimEnd();
}

export interface ResolveScopedRewritesArgs {
  constitution: InnerConstitution;
  answers?: Answer[];
  demographics?: DemographicSet | null;
}

export interface ResolveScopedRewritesOptions {
  budget?: SessionLlmBudget;
  /** Test seam — inject a mock prose composer. */
  proseComposer?: ProseLiveResolveOptions["composer"];
  /** Test seam — inject a mock keystone composer. */
  keystoneComposer?: KeystoneLiveResolveOptions["composer"];
  /** Test seam — inject a mock V3 composer. */
  v3Composer?: V3LiveResolveOptions["composer"];
  /** Override the per-call LLM timeout. */
  timeoutMs?: number;
  /**
   * CC-LLM-REWRITES-PERSISTED-ON-SESSION — per-session rewrite bundle
   * loaded from `sessions.llm_rewrites`. When present, the per-layer
   * resolvers check the bundle before falling through to the runtime
   * gate. Null on un-backfilled rows (which is the default for any
   * caller that doesn't have a saved session in scope).
   */
  sessionLlmBundle?: LlmRewritesBundle | null;
}

export interface ScopedRewritesResult {
  /** Full LLM rewrite markdown for the Lens body card, or null on miss. */
  lens: string | null;
  compass: string | null;
  hands: string | null;
  path: string | null;
  /** Full LLM rewrite for the Keystone Reflection body, or null on miss. */
  keystone: string | null;
  // CC-LAUNCH-VOICE-POLISH-V3 — seven additional sections.
  executiveRead: string | null;
  corePattern: string | null;
  whatOthersMayExperience: string | null;
  whenTheLoadGetsHeavy: string | null;
  synthesis: string | null;
  closingRead: string | null;
  pathTriptych: string | null;
}

/**
 * resolveScopedRewritesLive — fires the on-demand LLM resolver chain
 * for the four scoped body cards + Keystone in parallel, and returns
 * each section's resolved markdown (or `null` when both the committed
 * cache and on-demand resolution fail).
 *
 * Used by `/api/report-cards` to populate the on-screen body cards
 * + Keystone with LLM prose. Same SessionLlmBudget / timeout / Tier
 * C semantics as `renderMirrorAsMarkdownLive`.
 */
export async function resolveScopedRewritesLive(
  args: ResolveScopedRewritesArgs,
  options: ResolveScopedRewritesOptions = {}
): Promise<ScopedRewritesResult> {
  const clinMd = renderMirrorAsMarkdown({
    constitution: args.constitution,
    answers: args.answers,
    demographics: args.demographics,
    includeBeliefAnchor: false,
    renderMode: "clinician",
  });
  const archetype =
    args.constitution.profileArchetype?.primary ?? "unmappedType";
  const budget = options.budget ?? new SessionLlmBudget();

  // Prose body card resolutions, parallel.
  const proseTasks: Array<{
    cardId: ProseCardId;
    promise: Promise<string | null>;
  }> = [];
  for (const cardId of ["lens", "compass", "hands", "path"] as const) {
    const header = SCOPED_HEADERS[cardId];
    const body = extractSection(clinMd, header);
    if (!body) {
      proseTasks.push({
        cardId,
        promise: Promise.resolve<string | null>(null),
      });
      continue;
    }
    const inputs: ProseRewriteInputs = {
      cardId,
      archetype,
      engineSectionBody: body,
      reservedCanonLines: RESERVED_CANON_LINES,
    };
    proseTasks.push({
      cardId,
      promise: resolveProseRewriteLive(inputs, {
        liveSession: true,
        budget,
        timeoutMs: options.timeoutMs,
        composer: options.proseComposer,
        sessionLlmBundle: options.sessionLlmBundle ?? null,
      }),
    });
  }

  // Keystone resolution.
  const belief = args.constitution.belief_under_tension;
  let keystonePromise: Promise<string | null> = Promise.resolve<string | null>(
    null
  );
  if (belief && belief.belief_text) {
    const topCompassValueLabels = getTopCompassValues(
      args.constitution.signals
    )
      .map((r) => COMPASS_LABEL[r.signal_id] ?? r.signal_id)
      .filter((s) => s.length > 0);
    const qi2 = args.answers ? summarizeQI2Selections(args.answers) : null;
    const qi3 = args.answers ? summarizeQI3Selections(args.answers) : null;
    const keystoneInputs: KeystoneRewriteInputs = {
      archetype,
      beliefText: belief.belief_text,
      valueDomain: belief.value_domain,
      topCompassValueLabels,
      costSurfaceLabels: qi3?.selectedLabels ?? [],
      costSurfaceNoneSelected: qi3?.noneSelected ?? false,
      correctionChannelLabels: qi2?.selectedLabels ?? [],
      correctionChannelNoneSelected: qi2?.noneSelected ?? false,
      convictionTemperature: belief.conviction_temperature,
      epistemicPosture: belief.epistemic_posture,
    };
    keystonePromise = resolveKeystoneRewriteLive(keystoneInputs, {
      liveSession: true,
      budget,
      timeoutMs: options.timeoutMs,
      composer: options.keystoneComposer,
      sessionLlmBundle: options.sessionLlmBundle ?? null,
    });
  }

  // CC-LAUNCH-VOICE-POLISH-V3 — seven additional section resolutions,
  // dispatched in parallel with the prose card + keystone resolutions.
  const topCompassValueLabels = getTopCompassValues(args.constitution.signals)
    .map((r) => COMPASS_LABEL[r.signal_id] ?? r.signal_id)
    .filter((s) => s.length > 0);
  const v3Tasks: Array<{
    sectionId: V3SectionId;
    promise: Promise<string | null>;
  }> = [];
  for (const sectionId of V3_SECTION_IDS) {
    const body =
      sectionId === "pathTriptych"
        ? extractPathTriptych(clinMd)
        : extractSection(clinMd, V3_HEADERS[sectionId]);
    if (!body) {
      v3Tasks.push({
        sectionId,
        promise: Promise.resolve<string | null>(null),
      });
      continue;
    }
    const inputs: V3RewriteInputs = {
      sectionId,
      archetype,
      engineSectionBody: body,
      topCompassValueLabels,
      reservedCanonLines: RESERVED_CANON_LINES,
    };
    v3Tasks.push({
      sectionId,
      promise: resolveV3RewriteLive(inputs, {
        liveSession: true,
        budget,
        timeoutMs: options.timeoutMs,
        composer: options.v3Composer,
        sessionLlmBundle: options.sessionLlmBundle ?? null,
      }),
    });
  }

  const [
    lens,
    compass,
    hands,
    path,
    keystone,
    executiveRead,
    corePattern,
    whatOthersMayExperience,
    whenTheLoadGetsHeavy,
    synthesis,
    closingRead,
    pathTriptych,
  ] = await Promise.all([
    proseTasks[0]!.promise,
    proseTasks[1]!.promise,
    proseTasks[2]!.promise,
    proseTasks[3]!.promise,
    keystonePromise,
    v3Tasks[0]!.promise,
    v3Tasks[1]!.promise,
    v3Tasks[2]!.promise,
    v3Tasks[3]!.promise,
    v3Tasks[4]!.promise,
    v3Tasks[5]!.promise,
    v3Tasks[6]!.promise,
  ]);
  return {
    lens,
    compass,
    hands,
    path,
    keystone,
    executiveRead,
    corePattern,
    whatOthersMayExperience,
    whenTheLoadGetsHeavy,
    synthesis,
    closingRead,
    pathTriptych,
  };
}
