// CC-153 — POST /api/admin/sessions/import
//
// Accepts a portable session JSON (the export shape produced by
// /api/admin/sessions/[id]/portable) and creates a NEW session row in
// Postgres. Owner use case: import partial legacy tests (Madison /
// JDrew / LaCinda) taken before the current question bank existed.
//
// Pipeline:
//   1. Parse + validate the JSON against `PortableSession` shape.
//   2. Derive `InnerConstitution` via `buildInnerConstitution`.
//   3. T3 fallback — if (2) throws on a partial answer set, persist a
//      placeholder `{}` constitution + `engine_shape_version: null` so
//      `detectStaleShape` returns `re-derivable` at read time and the
//      render entry re-derives against current code.
//   4. Stamp the provenance meta signal (`imported_legacy`) so admin
//      queries can distinguish imports from native sessions.
//   5. `saveSession` → new sessions row + new demographics row in one
//      transaction.
//   6. Return `{ sessionId, derivationStatus, unknownQuestionIds }`.
//
// Routed under `/api/admin/*` → middleware-guarded by the
// `wru_admin=ok` cookie (see `middleware.ts`).

import { saveSession } from "../../../../../lib/saveSession";
import { buildInnerConstitution } from "../../../../../lib/identityEngine";
import {
  importProvenanceSignal,
  validatePortableSession,
} from "../../../../../lib/sessionPortable";
import type {
  DemographicSet,
  InnerConstitution,
  MetaSignal,
} from "../../../../../lib/types";

export async function POST(req: Request) {
  // Parse the body; reject anything that isn't valid JSON.
  let raw: unknown;
  try {
    raw = await req.json();
  } catch (e) {
    return Response.json(
      { error: `body is not valid JSON: ${(e as Error).message}` },
      { status: 400 }
    );
  }

  // Validate against the portable shape. Returns a typed
  // `PortableSession` or a specific error string. Pure function — no
  // I/O — so a malformed upload persists nothing.
  const validation = validatePortableSession(raw);
  if (!validation.ok) {
    return Response.json({ error: validation.error }, { status: 400 });
  }
  const { portable, unknownQuestionIds } = validation;

  // ── Derive (with T3 fallback) ─────────────────────────────────────
  //
  // `buildInnerConstitution` can throw on legacy partial answer sets
  // (e.g. the non-canonical Jungian-stack path). The import must NOT
  // 500 — losing a manually-curated upload because of a thin signal
  // would be the worst kind of UX failure. So we wrap the call and,
  // on throw, persist the session with a placeholder constitution +
  // `engine_shape_version: null`. The render path's
  // `detectStaleShape` will see the null version and route to the
  // re-derivable branch, which calls `buildInnerConstitution` again
  // at read time (the next gap-fill answer may unblock the derive).
  //
  // The demographics arg to `buildInnerConstitution` is the
  // `DemographicSet { answers }` shape (Movement-guidance hint
  // only — derivation is unaffected per canon §demographic-rules
  // Rule 4).
  const demoSet: DemographicSet = { answers: portable.demographics };
  let constitution: InnerConstitution;
  let derivationStatus: "fresh" | "deferred-to-re-derive";
  let derivationError: string | null = null;
  let engineShapeVersion: number | null | undefined; // undefined → saveSession stamps current
  try {
    constitution = buildInnerConstitution(
      portable.answers,
      portable.metaSignals,
      demoSet
    );
    derivationStatus = "fresh";
  } catch (e) {
    // Placeholder — the JSONB column is `.notNull()`, so we can't
    // write a real null. The `engine_shape_version: null` stamp is
    // what actually triggers re-derive on read.
    //
    // CC-153.1 — minimally-iterable shape (`signals: []`,
    // `tensions: []`) rather than bare `{}` so any direct reader
    // (e.g. the admin roster's compass/tensions aggregators in
    // `app/admin/sessions/page.tsx`) doesn't crash on
    // `iter(undefined)` before the read path's re-derive kicks in.
    // Belt-and-suspenders with T1's `?? []` guards there.
    constitution = {
      signals: [],
      tensions: [],
    } as unknown as InnerConstitution;
    derivationStatus = "deferred-to-re-derive";
    derivationError = e instanceof Error ? e.message : String(e);
    engineShapeVersion = null;
  }

  // Add the provenance stamp to the imported meta signals. Out-of-
  // union `type: "imported_legacy"` is intentional (see
  // `lib/sessionPortable.ts` for the rationale).
  const metaSignalsWithProvenance: MetaSignal[] = [
    importProvenanceSignal(),
    ...portable.metaSignals,
  ];

  let sessionId: string;
  try {
    const result = await saveSession({
      answers: portable.answers,
      innerConstitution: constitution,
      skippedQuestionIds: portable.skippedQuestionIds,
      metaSignals: metaSignalsWithProvenance,
      allocationOverlays: constitution.allocation_overlays,
      beliefUnderTension: constitution.belief_under_tension ?? null,
      demographicAnswers: portable.demographics,
      contactEmail: portable.contactEmail,
      contactMobile: portable.contactMobile,
      engineShapeVersion,
    });
    sessionId = result.sessionId;
  } catch (e) {
    return Response.json(
      { error: `persist failed: ${(e as Error).message}` },
      { status: 500 }
    );
  }

  return Response.json(
    {
      sessionId,
      derivationStatus,
      derivationError,
      unknownQuestionIds,
    },
    { status: 200 }
  );
}
