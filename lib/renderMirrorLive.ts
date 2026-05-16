// CC-LIVE-SESSION-LLM-WIRING — server-only async wrapper around
// `renderMirrorAsMarkdown`. Pre-resolves the four scoped body cards
// (Lens / Compass / Hands / Path) plus the Keystone Reflection via the
// on-demand LLM resolvers BEFORE invoking the synchronous render. Any
// resolution that succeeds is staged into the process-scoped runtime
// cache, where the synchronous `readCachedRewrite` / `readCached
// KeystoneRewrite` calls inside the existing splice pick it up
// transparently.
//
// This file is server-only: imports the LLM server modules (which use
// `process.env.ANTHROPIC_API_KEY`). The synchronous `renderMirror.ts`
// path remains client-bundle-safe.
//
// Cohort regen / audit / test code paths must NOT call this entry; they
// continue to invoke `renderMirrorAsMarkdown` directly with the
// committed cache as source of truth.

import { renderMirrorAsMarkdown, type RenderArgs } from "./renderMirror";
import {
  resolveProseRewriteLive,
  type ProseLiveResolveOptions,
} from "./proseRewriteLlmServer";
import {
  resolveKeystoneRewriteLive,
  type KeystoneLiveResolveOptions,
} from "./keystoneRewriteLlmServer";
import {
  COMPASS_LABEL,
  getTopCompassValues,
} from "./identityEngine";
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

const SCOPED_HEADERS: Record<ProseCardId, string> = {
  lens: "### Lens — Eyes",
  compass: "### Compass — Heart",
  hands: "### Hands — Work",
  path: "## Path — Gait",
};

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

export interface LiveRenderOptions {
  /** Per-session call budget. Defaults to a fresh `SessionLlmBudget()`. */
  budget?: SessionLlmBudget;
  /** Test seam — inject a mock prose composer. */
  proseComposer?: ProseLiveResolveOptions["composer"];
  /** Test seam — inject a mock keystone composer. */
  keystoneComposer?: KeystoneLiveResolveOptions["composer"];
  /** Override the per-call LLM timeout. Default: 10 s. */
  timeoutMs?: number;
  /**
   * CC-LLM-REWRITES-PERSISTED-ON-SESSION — per-session bundle loaded
   * from `sessions.llm_rewrites`. Threaded through to every per-layer
   * resolver. Null on un-backfilled rows.
   */
  sessionLlmBundle?: LlmRewritesBundle | null;
}

/**
 * renderMirrorAsMarkdownLive — async render entry for production code
 * paths. Pre-resolves on-demand LLM rewrites for the four scoped body
 * cards + Keystone before synchronously running the user-mode markdown
 * render. On any individual resolution failure (timeout / API error /
 * cost-guard hit), the synchronous splice silently falls through to the
 * engine prose for that section.
 *
 * Usage: server actions, API routes, or build-time renderers that have
 * `process.env.ANTHROPIC_API_KEY` available. For cohort tests and
 * client-side callers, continue to use `renderMirrorAsMarkdown`.
 */
export async function renderMirrorAsMarkdownLive(
  args: RenderArgs,
  options: LiveRenderOptions = {}
): Promise<string> {
  // Step 1 — pre-render clinician mode to read the engine bodies. The
  // bodies become the engineSectionBody inputs to the LLM cache key.
  const clinMd = renderMirrorAsMarkdown({ ...args, renderMode: "clinician" });
  const archetype =
    args.constitution.profileArchetype?.primary ?? "unmappedType";

  // Step 2 — build per-card resolution inputs and fire all 4 in parallel.
  const budget = options.budget ?? new SessionLlmBudget();
  const proseTasks: Promise<unknown>[] = [];
  for (const cardId of ["lens", "compass", "hands", "path"] as const) {
    const header = SCOPED_HEADERS[cardId];
    const body = extractSection(clinMd, header);
    if (!body) continue;
    const inputs: ProseRewriteInputs = {
      cardId,
      archetype,
      engineSectionBody: body,
      reservedCanonLines: RESERVED_CANON_LINES,
    };
    proseTasks.push(
      resolveProseRewriteLive(inputs, {
        liveSession: true,
        budget,
        timeoutMs: options.timeoutMs,
        composer: options.proseComposer,
        sessionLlmBundle: options.sessionLlmBundle ?? null,
      })
    );
  }

  // Step 3 — Keystone resolution (only when a belief is present).
  const belief = args.constitution.belief_under_tension;
  let keystoneTask: Promise<unknown> | null = null;
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
    keystoneTask = resolveKeystoneRewriteLive(keystoneInputs, {
      liveSession: true,
      budget,
      timeoutMs: options.timeoutMs,
      composer: options.keystoneComposer,
      sessionLlmBundle: options.sessionLlmBundle ?? null,
    });
  }

  // Step 4 — wait for all resolutions. The runtime cache is now
  // populated for every successful section; failed sections leave the
  // synchronous splice to fall through to engine prose.
  await Promise.all([...proseTasks, ...(keystoneTask ? [keystoneTask] : [])]);

  // Step 5 — synchronous user-mode render. `readCachedRewrite` /
  // `readCachedKeystoneRewrite` now hit the runtime cache for any
  // section the LLM successfully resolved.
  return renderMirrorAsMarkdown({ ...args, renderMode: "user" });
}
