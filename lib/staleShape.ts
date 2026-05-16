// CC-STALE-SHAPE-DETECTOR — render-time type guard + shape-version
// detector for the post-persistence render path.
//
// Throw signature this module catches: `Cannot read properties of
// undefined (reading 'bands')`. Located in `lib/oceanDashboard.ts`
// (lines reading `mix.bands.openness` / `mix.bands.conscientiousness`
// etc.) and `lib/renderMirror.ts:1200` (reading
// `constitution.ocean.dispositionSignalMix.bands`). The throw fires
// when a stored `inner_constitution` was produced by an older engine
// schema that lacks the `bands` field on `ocean.dispositionSignalMix`.
//
// The detector lives at the render-entry boundary — every render path
// that reads a stored `inner_constitution` runs `detectStaleShape(row)`
// before handing the constitution to the renderer. Three branches:
//
//   1. fresh — engine_shape_version matches AND isFreshConstitution
//      passes → render directly from the stored bundle.
//   2. re-derivable — version mismatch or predicate fail, BUT
//      `answers` is present → re-derive via `buildInnerConstitution`
//      and render from the re-derived constitution.
//   3. un-rerenderable — version mismatch or predicate fail AND
//      `answers` is absent/incomplete → render a "this report needs
//      to be retaken" graceful-error message.
//
// Re-derivation is engine-only — this module never imports from any
// `lib/*LlmServer.ts`. The render-path cache-or-engine contract from
// CC-LLM-REWRITES-PERSISTED-ON-SESSION is preserved: stale-shape
// renders fall through to engine prose for every layer.

import type { Answer, InnerConstitution } from "./types";

// Bump this when any engine-output field consumed by the render path
// changes shape (added required field, removed field, renamed field,
// changed numeric range, changed enum union, etc.). Bumping this
// constant marks every previously-saved row as stale-shape on next
// read; the render path then triggers re-derivation from `answers`.
export const ENGINE_SHAPE_VERSION = 1;

export type StaleShapeReason =
  | "fresh"
  | "version-null"
  | "version-mismatch"
  | "missing-ocean-bands"
  | "missing-mirror"
  | "missing-shape-outputs"
  | "missing-lens-stack"
  | "missing-signals"
  | "answers-absent";

// The five Big-Five-aligned band keys that the disposition section
// reads. If any are missing on a stored constitution, the renderer
// will throw on `mix.bands.<key>` access.
const REQUIRED_BAND_KEYS = [
  "openness",
  "conscientiousness",
  "extraversion",
  "agreeableness",
  "emotionalReactivity",
] as const;

// Render-path-consumed top-level fields. The predicate verifies each
// is present; the schema-hash signs each by its keyset. These two
// together let the detector distinguish "stored bundle is structurally
// equivalent to current engine output" from "stored bundle is missing
// fields a newer renderer dereferences."
const REQUIRED_TOP_LEVEL_KEYS = [
  "signals",
  "lens_stack",
  "shape_outputs",
  "mirror",
  "meta_signals",
] as const;

// ─────────────────────────────────────────────────────────────────────
// isFreshConstitution — structural type guard
// ─────────────────────────────────────────────────────────────────────

export function isFreshConstitution(
  value: unknown
): value is InnerConstitution {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  // Required top-level fields must all be present.
  for (const k of REQUIRED_TOP_LEVEL_KEYS) {
    if (!(k in c)) return false;
  }
  // `signals` and `meta_signals` must be arrays.
  if (!Array.isArray(c.signals)) return false;
  if (!Array.isArray(c.meta_signals)) return false;
  // If `ocean` is present, the `bands` keyset must be complete — this
  // is the concrete throw site CC §"Concrete error signature" calls out.
  const ocean = c.ocean as
    | {
        dispositionSignalMix?: { bands?: Record<string, unknown> };
      }
    | null
    | undefined;
  if (ocean) {
    const bands = ocean.dispositionSignalMix?.bands;
    if (!bands || typeof bands !== "object") return false;
    for (const k of REQUIRED_BAND_KEYS) {
      if (!(k in bands)) return false;
    }
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────
// hashEngineShape — deterministic schema-shape hash
// ─────────────────────────────────────────────────────────────────────

// Walks the constitution's keyset (recursively, depth-limited) and
// emits a canonical string of "key:type" pairs, sorted. Two
// constitutions with identical structure but different VALUES yield
// the same hash; two constitutions where one has `bands` and the
// other doesn't yield different hashes.
export function hashEngineShape(constitution: InnerConstitution): string {
  return canonicalShape(constitution as unknown, 0);
}

function canonicalShape(value: unknown, depth: number): string {
  if (depth > 4) return "…";
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (Array.isArray(value)) {
    if (value.length === 0) return "array<>";
    return `array<${canonicalShape(value[0], depth + 1)}>`;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    if (keys.length === 0) return "{}";
    return `{${keys
      .map((k) => `${k}:${canonicalShape(obj[k], depth + 1)}`)
      .join(",")}}`;
  }
  return typeof value;
}

// ─────────────────────────────────────────────────────────────────────
// diffShape — names the top-level keys that differ between two
// constitutions' shapes. Used in [stale-shape:re-derived] log lines.
// ─────────────────────────────────────────────────────────────────────

export function diffShape(
  stored: unknown,
  fresh: InnerConstitution
): string[] {
  const diffs: string[] = [];
  if (!stored || typeof stored !== "object") {
    return ["<entire constitution>"];
  }
  const s = stored as Record<string, unknown>;
  const f = fresh as unknown as Record<string, unknown>;
  // Top-level required-keys differences.
  for (const k of REQUIRED_TOP_LEVEL_KEYS) {
    if (!(k in s) && k in f) diffs.push(k);
  }
  // OCEAN bands — the concrete throw site.
  const sOcean = s.ocean as
    | { dispositionSignalMix?: { bands?: Record<string, unknown> } }
    | undefined
    | null;
  const fOcean = f.ocean as
    | { dispositionSignalMix?: { bands?: Record<string, unknown> } }
    | undefined
    | null;
  if (fOcean?.dispositionSignalMix?.bands) {
    if (!sOcean?.dispositionSignalMix?.bands) {
      diffs.push("ocean.dispositionSignalMix.bands");
    } else {
      for (const k of REQUIRED_BAND_KEYS) {
        if (!(k in sOcean.dispositionSignalMix.bands)) {
          diffs.push(`ocean.dispositionSignalMix.bands.${k}`);
        }
      }
    }
  }
  return diffs;
}

// ─────────────────────────────────────────────────────────────────────
// detectStaleShape — branch verdict for a stored session row
// ─────────────────────────────────────────────────────────────────────

export interface StoredSessionRow {
  sessionId: string;
  engineShapeVersion: number | null;
  innerConstitution: unknown;
  answers: Answer[] | null;
}

export type DetectVerdict =
  | { branch: "fresh"; constitution: InnerConstitution }
  | {
      branch: "re-derivable";
      reason: StaleShapeReason;
      // The detector returns the *stored* constitution alongside the
      // verdict; the caller (a render entry) is expected to call
      // `buildInnerConstitution(answers, [], demographics)` and use
      // the re-derived constitution instead. We don't import the
      // engine here to keep this module pure-data.
      storedConstitution: unknown;
    }
  | {
      branch: "un-rerenderable";
      reason: StaleShapeReason;
    };

export function detectStaleShape(row: StoredSessionRow): DetectVerdict {
  const versionMatches = row.engineShapeVersion === ENGINE_SHAPE_VERSION;
  const predicatePasses = isFreshConstitution(row.innerConstitution);
  if (versionMatches && predicatePasses) {
    return { branch: "fresh", constitution: row.innerConstitution as InnerConstitution };
  }
  // Stale shape. Can we re-derive?
  if (!row.answers || !Array.isArray(row.answers) || row.answers.length === 0) {
    return {
      branch: "un-rerenderable",
      reason: row.engineShapeVersion === null ? "answers-absent" : "answers-absent",
    };
  }
  // Re-derivable. Compute reason for telemetry.
  let reason: StaleShapeReason;
  if (row.engineShapeVersion === null) {
    reason = "version-null";
  } else if (!versionMatches) {
    reason = "version-mismatch";
  } else if (!predicatePasses) {
    // Predicate failed but version matched — likely a partial schema
    // drift between version bumps. Tag with the most specific reason.
    const c = row.innerConstitution as Record<string, unknown> | null;
    if (!c) reason = "missing-mirror";
    else if (
      !("ocean" in c) ||
      !(c.ocean as { dispositionSignalMix?: { bands?: unknown } })
        ?.dispositionSignalMix?.bands
    ) {
      reason = "missing-ocean-bands";
    } else if (!("mirror" in c)) reason = "missing-mirror";
    else if (!("shape_outputs" in c)) reason = "missing-shape-outputs";
    else if (!("lens_stack" in c)) reason = "missing-lens-stack";
    else if (!("signals" in c)) reason = "missing-signals";
    else reason = "missing-mirror";
  } else {
    reason = "missing-ocean-bands";
  }
  return {
    branch: "re-derivable",
    reason,
    storedConstitution: row.innerConstitution,
  };
}

// ─────────────────────────────────────────────────────────────────────
// logStaleShapeReDerived — structured observability via cacheObservability
// ─────────────────────────────────────────────────────────────────────

export function logStaleShapeReDerived(args: {
  sessionId: string;
  storedVersion: number | null;
  currentVersion: number;
  reason: StaleShapeReason;
  fieldDiffs: string[];
}): void {
  // Structured single-line warning tagged `[stale-shape:re-derived]`
  // per the CC's smoke step. Mirrors the observability shape of
  // `cacheObservability.logCacheResolution` but is emitted via
  // `console.warn` directly so this module doesn't have to bump the
  // cacheObservability namespace enum (which would be out-of-scope
  // per the CC's Allowed-to-Modify list).
  console.warn(
    `[stale-shape:re-derived] ${JSON.stringify({
      sessionId: args.sessionId,
      storedVersion: args.storedVersion,
      currentVersion: args.currentVersion,
      reason: args.reason,
      fieldDiffs: args.fieldDiffs,
    })}`
  );
}
