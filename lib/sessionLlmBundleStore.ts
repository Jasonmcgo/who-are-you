// CC-LLM-REWRITES-PERSISTED-ON-SESSION — server-only loader for the
// per-session rewrite bundle persisted in `sessions.llm_rewrites`.
//
// The render-path API routes (`/api/render`, `/api/report-cards`) call
// `loadSessionLlmBundle(sessionId)` to retrieve the bundle, then thread
// it into `renderMirrorAsMarkdownLive` / `resolveScopedRewritesLive`.
// On any failure (missing row, stale shape, DB unavailable), the loader
// returns null and the renderer falls through to engine prose.
//
// Server-only: imports `db/index.ts` (which holds the `postgres` driver
// connection). Never import this from a client bundle.

import { eq } from "drizzle-orm";

import { getDb } from "../db";
import { sessions } from "../db/schema";
import {
  CURRENT_BUNDLE_VERSION,
  type LlmRewritesBundle,
} from "./llmRewritesBundle";

/**
 * `loadSessionLlmBundle` — fetch the persisted bundle for a session.
 *
 * Returns null when:
 *   - sessionId is missing/invalid
 *   - row not found
 *   - row exists but `llm_rewrites` is null (un-backfilled)
 *   - the persisted bundle has an unknown `bundleVersion`
 *   - the DB query throws (connection error, schema drift, etc.)
 *
 * Never throws — the render path is designed to gracefully fall
 * through to engine prose on any bundle-loading failure.
 */
export async function loadSessionLlmBundle(
  sessionId: string
): Promise<LlmRewritesBundle | null> {
  if (!sessionId || typeof sessionId !== "string") return null;
  try {
    const db = getDb();
    const rows = await db
      .select({ llm_rewrites: sessions.llm_rewrites })
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);
    if (rows.length === 0) return null;
    const raw = rows[0]?.llm_rewrites;
    if (!raw || typeof raw !== "object") return null;
    const bundle = raw as Partial<LlmRewritesBundle>;
    if (bundle.bundleVersion !== CURRENT_BUNDLE_VERSION) return null;
    return bundle as LlmRewritesBundle;
  } catch (e) {
    console.warn(
      `[sessionLlmBundleStore] load failed for ${sessionId}: ${(e as Error).message}`
    );
    return null;
  }
}
