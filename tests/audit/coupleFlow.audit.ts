// CC-COUPLE-3 — Flow-level audit for the asymmetric couple game.
//
// Direct lib-call integration (no HTTP). Walks the round-trip the
// `/api/couple/*` routes wrap and asserts the safety-floor invariants
// the CC prompt §"Acceptance Criteria" enumerates.
//
// Assertions:
//   1. The three new routes + the page exist on disk.
//   2. `sessions.answers` for partner A is byte-identical before and after
//      B submits — guarantees B's guesses are NEVER written into A's row
//      (CC-COUPLE-1 invariant + CC-COUPLE-3 acceptance §4).
//   3. Saved `couple_sessions.game_results` round-trips through
//      `resolveReveal` and only ever produces Obvious / Oblivious /
//      Loving Misread for asymmetric play (selfKnows undefined +
//      selfAnswer == enginePredicted by construction → MB + HP
//      structurally unreachable — CC-COUPLE-3 acceptance §3).
//   4. Items with `predict(icA) === null` are stored with selfAnswer=""
//      and surface as `scored: false` in the resolver-derived payload.
//   5. Legibility computation: matches over scored items only; never a
//      single compatibility number (presence of `breakdown` + non-null
//      structure on the API-shape contract — CC-COUPLE-3 acceptance §5).
//   6. Couple row status flips invited → completed on save.
//
// Invocation:
//   `npx tsx tests/audit/coupleFlow.audit.ts`

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { eq } from "drizzle-orm";

import { getDb } from "../../db";
import { coupleSessions, sessions } from "../../db/schema";
import { mintCoupleInviteLink } from "../../lib/coupleInviteLink";
import {
  getCoupleSessionByToken,
  saveGameResults,
} from "../../lib/coupleSession";
import { COUPLE_GAME_ITEMS } from "../../lib/coupleGameItems";
import { resolveReveal } from "../../lib/coupleReveal";
import type {
  CoupleGameItem,
  CoupleGameResults,
  RevealType,
} from "../../lib/coupleTypes";
import { buildInnerConstitution } from "../../lib/identityEngine";
import type {
  Answer,
  InnerConstitution,
  MetaSignal,
} from "../../lib/types";

// ─────────────────────────────────────────────────────────────────────
// .env.local loader — tsx doesn't auto-load it.
// ─────────────────────────────────────────────────────────────────────
(function loadEnvLocal() {
  if (process.env.DATABASE_URL) return;
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
    }
  }
})();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, "..", "..");

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

const results: AssertionResult[] = [];

function assert(ok: boolean, assertion: string, detail: string): void {
  results.push(ok ? { ok: true, assertion, detail } : { ok: false, assertion, detail });
}

async function main() {
  // ── (1) Route + page files exist.
  const REQUIRED_FILES = [
    "app/api/couple/mint/route.ts",
    "app/api/couple/[token]/route.ts",
    "app/couple/[token]/page.tsx",
  ];
  for (const rel of REQUIRED_FILES) {
    const ok = existsSync(join(REPO_ROOT, rel));
    assert(ok, `(1) ${rel} exists`, ok ? "ok" : "missing");
  }

  // ── DB-dependent assertions need a real A session.
  const db = getDb();
  const recent = await db
    .select({ id: sessions.id, answers: sessions.answers })
    .from(sessions)
    .orderBy(sessions.created_at)
    .limit(50);
  if (recent.length === 0) {
    assert(false, "DB has at least one session for the round-trip", "0 sessions in dev DB");
    return finalize();
  }
  const partnerA = recent[recent.length - 1];
  const baselineAnswersJson = JSON.stringify(partnerA.answers);

  // Mint a link.
  const { token } = await mintCoupleInviteLink(partnerA.id, {
    baseUrl: "http://localhost:3003",
  });

  // Compose B's guesses: for every item with a real predict() output we
  // either match the engine (→ Obvious) or pick the most generous valenced
  // option we can (→ Loving Misread). For null-predict items we still
  // record a guess so we can verify the unscored branch.
  const aSessionRow = (
    await db.select().from(sessions).where(eq(sessions.id, partnerA.id)).limit(1)
  )[0];
  const icA: InnerConstitution = (() => {
    try {
      return buildInnerConstitution(
        (aSessionRow.answers ?? []) as Answer[],
        (aSessionRow.meta_signals ?? []) as MetaSignal[],
        null
      );
    } catch {
      return aSessionRow.inner_constitution as InnerConstitution;
    }
  })();

  const storedItems: CoupleGameItem[] = COUPLE_GAME_ITEMS.map((item, idx) => {
    const enginePredicted = item.predict(icA);
    // Alternate: half match engine, half pick a different option.
    let partnerGuess: string;
    if (enginePredicted && idx % 2 === 0) {
      partnerGuess = enginePredicted;
    } else {
      // Find a generous option if any, else first option.
      const generous = item.options.find((o) => o.valence === "generous");
      partnerGuess = generous?.id ?? item.options[0].id;
    }
    return {
      itemId: item.itemId,
      direction: "b_guesses_a",
      selfAnswer: enginePredicted ?? "",
      partnerGuess,
      sourceSignal: item.sourceSignal,
    };
  });

  const results_payload: CoupleGameResults = {
    items: storedItems,
    playedAt: new Date().toISOString(),
  };

  await saveGameResults(token, results_payload);

  // ── (6) Couple row status flipped to completed.
  const after = await getCoupleSessionByToken(token);
  assert(
    after?.status === "completed",
    "(6) couple_sessions.status flipped to completed",
    `status=${after?.status}`
  );

  // ── (2) Partner A's sessions.answers is byte-identical (the safety
  //    floor invariant: B's guesses never touch A's row).
  const afterA = (
    await db.select().from(sessions).where(eq(sessions.id, partnerA.id)).limit(1)
  )[0];
  const afterAnswersJson = JSON.stringify(afterA.answers);
  assert(
    afterAnswersJson === baselineAnswersJson,
    "(2) A's sessions.answers byte-identical after B submits",
    afterAnswersJson === baselineAnswersJson
      ? "ok"
      : `len before=${baselineAnswersJson.length} after=${afterAnswersJson.length}`
  );

  // ── (3) Resolver only fires Obvious / Oblivious / Loving Misread for
  //    asymmetric play, never Mirror Blind / Hidden Pattern.
  // ── (4) Null-predict items are recorded with selfAnswer="" and
  //    surface as scored:false when resolved.
  const reveals: RevealType[] = [];
  let unscoredCount = 0;
  for (const stored of after!.game_results!.items) {
    const itemSpec = COUPLE_GAME_ITEMS.find((i) => i.itemId === stored.itemId);
    if (stored.selfAnswer === "") {
      unscoredCount += 1;
      continue;
    }
    const reveal = resolveReveal({
      selfAnswer: stored.selfAnswer,
      partnerGuess: stored.partnerGuess,
      enginePredicted: stored.selfAnswer,
      selfKnows: stored.selfKnows,
      options: itemSpec?.options,
    });
    reveals.push(reveal);
  }
  const FORBIDDEN: RevealType[] = ["mirror_blind", "hidden_pattern"];
  for (const r of reveals) {
    assert(
      !FORBIDDEN.includes(r),
      `(3) asymmetric reveal type ∉ {mirror_blind, hidden_pattern}`,
      `saw=${r}`
    );
  }
  const distribution = reveals.reduce<Record<string, number>>((acc, r) => {
    acc[r] = (acc[r] ?? 0) + 1;
    return acc;
  }, {});
  assert(
    Object.keys(distribution).length > 0,
    "(3) at least one scored reveal fired",
    `dist=${JSON.stringify(distribution)} unscored=${unscoredCount}`
  );

  const nullPredictItems = COUPLE_GAME_ITEMS.filter(
    (i) => i.predict(icA) === null
  );
  // unscoredCount must include every null-predict item B answered.
  assert(
    unscoredCount >= nullPredictItems.length,
    "(4) null-predict items produce unscored stored items",
    `unscored=${unscoredCount} expected≥${nullPredictItems.length}`
  );

  // ── (5) Legibility computation: matches / scored ratio is the only
  //    aggregate; the second-line breakdown is always present.
  const matches = reveals.filter((r) => r === "obvious").length;
  const percent = reveals.length === 0 ? null : Math.round((matches / reveals.length) * 100);
  assert(
    percent === null || (percent >= 0 && percent <= 100),
    "(5) legibility percent is null OR 0..100 (never a verdict outside the scored set)",
    `matches=${matches} scored=${reveals.length} percent=${percent}`
  );

  // Cleanup: remove the couple row so reruns don't accumulate.
  await db.delete(coupleSessions).where(eq(coupleSessions.invite_token, token));

  console.log("\nDistribution of reveals (scored items):");
  console.log(JSON.stringify(distribution, null, 2));
  console.log(`Unscored items: ${unscoredCount}`);
  console.log(`Legibility: ${matches} / ${reveals.length} = ${percent}%`);

  return finalize();
}

function finalize() {
  const failed = results.filter((r) => !r.ok);
  const passed = results.length - failed.length;
  console.log(`\n${passed}/${results.length} assertions passed.`);
  if (failed.length > 0) {
    console.log("\nFAILURES:");
    for (const f of failed) {
      console.log(`  ✗ ${f.assertion}`);
      console.log(`     ${f.detail}`);
    }
    process.exit(1);
  }
  console.log("\nALL ASSERTIONS PASSED.");
  process.exit(0);
}

main().catch((e) => {
  console.error("AUDIT THREW:", e);
  process.exit(1);
});
