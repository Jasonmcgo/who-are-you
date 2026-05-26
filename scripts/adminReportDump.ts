// Admin Report Dump — emits ONE Markdown file containing every completed
// session's full picture, for feeding to an LLM to develop the Room Read
// card library. Per person, four layers:
//   1. Ground-truth note (for locked cohort anchors)
//   2. Engine structured data (lens stack, Goal/Soul, OCEAN, signals)
//   3. Full rendered report PROSE (engine prose via renderMirrorAsMarkdown)
//   4. Raw question-by-question answers
//
// Why MD not xlsx: spreadsheet cells truncate/garble long prose reports;
// Markdown holds full reports per person without loss.
//
// Read-only against the DB (SELECTs only). Runs on your machine, where
// DATABASE_URL is reachable. Same connection pattern as
// scripts/inspectAshleyStack.ts.
//
// Usage (from repo root):
//   # all completed sessions, local DB:
//   npx tsx scripts/adminReportDump.ts
//   # against production:
//   DATABASE_URL="<prod-url>" npx tsx scripts/adminReportDump.ts
//   # only the locked cohort anchors:
//   npx tsx scripts/adminReportDump.ts --cohort
//   # filter by name substring (case-insensitive):
//   npx tsx scripts/adminReportDump.ts --name=jason
//   # custom output path:
//   npx tsx scripts/adminReportDump.ts --out=./my-dump.md

import postgres from "postgres";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import { buildInnerConstitution } from "../lib/identityEngine";
import { renderMirrorAsMarkdown } from "../lib/renderMirror";
import type {
  Answer,
  DemographicAnswer,
  DemographicSet,
  MetaSignal,
} from "../lib/types";

// ── env ──────────────────────────────────────────────────────────────
function loadEnv(): void {
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.trim().match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
    }
  }
}
loadEnv();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("No DATABASE_URL found (.env.local). Run from repo root.");
  process.exit(1);
}

// Silence the engine's `[cache-miss]` diagnostic lines (one per section
// per session) so the real progress + "Wrote …" output isn't drowned —
// especially on a large production run. ONLY [cache-miss]-prefixed lines
// are dropped; everything else passes through.
{
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const wrap =
    (orig: (...a: any[]) => void) =>
    (...a: any[]): void => {
      if (typeof a[0] === "string" && a[0].startsWith("[cache-miss]")) return;
      orig(...a);
    };
  console.log = wrap(console.log.bind(console)) as any;
  console.info = wrap(console.info.bind(console)) as any;
  console.warn = wrap(console.warn.bind(console)) as any;
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

// ── CLI flags ────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const cohortOnly = args.includes("--cohort");
const nameFilter =
  args.find((a) => a.startsWith("--name="))?.slice("--name=".length)?.toLowerCase() ?? null;
const outPath =
  args.find((a) => a.startsWith("--out="))?.slice("--out=".length) ??
  `cohort-report-dump-${new Date().toISOString().slice(0, 10)}.md`;

// ── Ground-truth (the 6 locked cohort anchors, from
//    tests/audit/cohortRealLensCanon.audit.ts LOCKS). Keyed by lowercased
//    first name; matched against demographics.name_value. Other cohort
//    members (Cindy, Megan, Kevin, Michele, …) have no LOCK, so they show
//    "no locked ground-truth". Extend this map as you confirm more. ─────
const GROUND_TRUTH: Record<string, string> = {
  harry: "ISFJ (Si-Fe) — intuitive Si, strong Ne mirror partner. Owner-confirmed.",
  ashley: "INFJ (Ni-dom) — owner-confirmed Ni. Clean Q-T Ni lead.",
  daniel: "ISTJ (Si-dom, clean — not mirror) — owner-confirmed.",
  jason: "INTJ (Ni-dom) — owner-confirmed; overwhelming Q-T Ni lead.",
  keith: "Intuitive Si (Si↔Ne, ISFJ-family, Si-led) — owner-confirmed via biography (ex-teacher; D&D + comics podcast). Q-T-direct over-reads his live Ne as Ni.",
  nat: "ISFJ (Si-Fe-Ti-Ne) — owner-confirmed; perfect-pitch musician, deep introvert. CC-SENSING-TYPING recovery anchor.",
};

function groundTruthFor(name: string | null): string {
  if (!name) return "_(anonymous — no name on session)_";
  const key = name.trim().toLowerCase().split(/\s+/)[0];
  return GROUND_TRUTH[key] ?? "_(no locked ground-truth for this name)_";
}

// ── demographics row → DemographicSet (mirrors the converter in
//    lib/games/roomRead/persistence.ts / the follow-up route) ───────────
interface DemoRow {
  session_id: string;
  name_value: string | null;
  name_state: string | null;
  gender_value: string | null;
  gender_state: string | null;
  age_decade: string | null;
  age_state: string | null;
  location_country: string | null;
  location_region: string | null;
  location_state: string | null;
  marital_status_value: string | null;
  marital_status_state: string | null;
  education_value: string | null;
  education_state: string | null;
  political_value: string | null;
  political_state: string | null;
  religious_value: string | null;
  religious_state: string | null;
  profession_value: string | null;
  profession_state: string | null;
}

function demoSetFromRow(row: DemoRow | undefined): DemographicSet | null {
  if (!row) return null;
  const out: DemographicAnswer[] = [];
  const push = (field_id: string, state: string | null, value: string | null): void => {
    if (state === "specified" && value) {
      out.push({ field_id, state: "specified", value });
    } else if (state === "prefer_not_to_say") {
      out.push({ field_id, state: "prefer_not_to_say" });
    } else {
      out.push({ field_id, state: "not_answered" });
    }
  };
  push("name", row.name_state, row.name_value);
  push("gender", row.gender_state, row.gender_value);
  push("age", row.age_state, row.age_decade);
  const locValue =
    row.location_state === "specified"
      ? row.location_region
        ? `${row.location_country ?? ""} | ${row.location_region}`.trim()
        : row.location_country ?? null
      : null;
  push("location", row.location_state, locValue);
  push("marital_status", row.marital_status_state, row.marital_status_value);
  push("education", row.education_state, row.education_value);
  push("political", row.political_state, row.political_value);
  push("religious", row.religious_state, row.religious_value);
  push("profession", row.profession_state, row.profession_value);
  return { answers: out };
}

// ── structured-data extraction (defensive — IC shape varies by version) ─
function structuredBlock(ic: unknown): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = ic as any;
  const lines: string[] = [];
  const stack = c?.lens_stack;
  if (stack) {
    lines.push(
      `- **Lens stack:** ${stack.dominant} › ${stack.auxiliary} › ${stack.tertiary} › ${stack.inferior}` +
        (stack.mbtiCode ? ` (${stack.mbtiCode})` : "") +
        (stack.confidence ? ` · confidence: ${stack.confidence}` : "")
    );
  }
  const gsg = c?.goalSoulGive;
  if (gsg) {
    const raw = gsg.rawScores ?? {};
    const adj = gsg.adjustedScores ?? {};
    lines.push(
      `- **Goal/Soul:** raw goal=${raw.goal ?? "?"} soul=${raw.soul ?? "?"} vuln=${raw.vulnerability ?? "?"} · adjusted goal=${adj.goal ?? "?"} soul=${adj.soul ?? "?"}` +
        (gsg.quadrant ? ` · quadrant: ${gsg.quadrant}` : "") +
        (gsg.grippingPull != null ? ` · grippingPull: ${gsg.grippingPull}` : "")
    );
  }
  if (c?.profileArchetype) lines.push(`- **Profile archetype:** ${c.profileArchetype}`);
  if (c?.riskForm) lines.push(`- **Risk form:** ${JSON.stringify(c.riskForm)}`);
  if (c?.movementQuadrant) lines.push(`- **Movement quadrant:** ${JSON.stringify(c.movementQuadrant)}`);
  const ocean = c?.ocean;
  if (ocean) {
    lines.push(
      `- **OCEAN:** ${ocean.case ? `case=${ocean.case}` : ""} ${ocean.dispositionSignalMix ? `· mix=${JSON.stringify(ocean.dispositionSignalMix)}` : ""}`.trim()
    );
  }
  // Top signals by strength
  const signals = Array.isArray(c?.signals) ? c.signals : [];
  if (signals.length > 0) {
    const top = [...signals]
      .sort((a: any, b: any) => (b.strength ?? 0) - (a.strength ?? 0)) // eslint-disable-line @typescript-eslint/no-explicit-any
      .slice(0, 12)
      .map((s: any) => `${s.signal_id}(${s.strength ?? "?"})`) // eslint-disable-line @typescript-eslint/no-explicit-any
      .join(", ");
    lines.push(`- **Top signals:** ${top}`);
  }
  return lines.length > 0 ? lines.join("\n") : "_(no structured fields extracted)_";
}

// ── raw answers formatter ────────────────────────────────────────────
function rawAnswersBlock(answers: Answer[]): string {
  if (!answers || answers.length === 0) return "_(no answers)_";
  return answers
    .map((a) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const x = a as any;
      const q = x.question_text ?? x.question_id ?? "(question)";
      let resp: string;
      if (x.picked_label) resp = x.picked_label;
      else if (x.picked_id) resp = x.picked_id;
      else if (Array.isArray(x.order)) resp = `ranked: ${x.order.join(" > ")}`;
      else if (Array.isArray(x.selections)) resp = `selected: ${x.selections.join(", ")}`;
      else if (x.response != null) resp = String(x.response);
      else if (x.value != null) resp = String(x.value);
      else {
        const { question_text, question_id, ...rest } = x;
        resp = JSON.stringify(rest);
      }
      return `- **${q}** → ${resp}`;
    })
    .join("\n");
}

// ── main ─────────────────────────────────────────────────────────────
const sql = postgres(DATABASE_URL, { max: 1 });

async function main(): Promise<void> {
  const sessions = await sql<
    { id: string; created_at: Date; answers: Answer[]; meta_signals: MetaSignal[] | null }[]
  >`
    SELECT id, created_at, answers, meta_signals
    FROM sessions
    WHERE jsonb_array_length(answers) > 0
    ORDER BY created_at ASC
  `;

  const demoRows = await sql<DemoRow[]>`SELECT * FROM demographics`;
  const demoBySession = new Map<string, DemoRow>();
  for (const d of demoRows) demoBySession.set(d.session_id, d);

  const sections: string[] = [];
  let included = 0;
  let errors = 0;

  for (const s of sessions) {
    const demoRow = demoBySession.get(s.id);
    const name =
      demoRow?.name_state === "specified" && demoRow.name_value
        ? demoRow.name_value
        : null;

    // Filters
    if (cohortOnly) {
      const key = name?.trim().toLowerCase().split(/\s+/)[0] ?? "";
      if (!(key in GROUND_TRUTH)) continue;
    }
    if (nameFilter && !(name ?? "").toLowerCase().includes(nameFilter)) continue;

    const displayName = name ?? `Anonymous (${s.id.slice(0, 8)})`;
    const answers = (s.answers ?? []) as Answer[];
    const metaSignals = (s.meta_signals ?? []) as MetaSignal[];
    const demographics = demoSetFromRow(demoRow);

    let body: string;
    try {
      const ic = buildInnerConstitution(answers, metaSignals, demographics);
      const prose = renderMirrorAsMarkdown({
        constitution: ic,
        demographics,
        answers,
        includeBeliefAnchor: true,
        renderMode: "user",
      });
      body = [
        `## Ground Truth`,
        groundTruthFor(name),
        ``,
        `## Engine Structured Data`,
        structuredBlock(ic),
        ``,
        `## Raw Answers (${answers.length})`,
        rawAnswersBlock(answers),
        ``,
        `## Rendered Report (engine prose)`,
        "```markdown",
        prose.trim(),
        "```",
      ].join("\n");
    } catch (e) {
      errors++;
      body = `> ⚠️ Failed to render this session: ${e instanceof Error ? e.message : String(e)}`;
    }

    sections.push(
      `# ${displayName}\n\n` +
        `- session: \`${s.id}\`\n- created: ${s.created_at.toISOString()}\n- answers: ${answers.length}\n\n` +
        body
    );
    included++;
  }

  const header = [
    `# Cohort Report Dump`,
    ``,
    `Generated: ${new Date().toISOString()}`,
    `Sessions included: ${included}${cohortOnly ? " (cohort-anchors only)" : ""}${nameFilter ? ` (name~"${nameFilter}")` : ""}`,
    errors > 0 ? `Render errors: ${errors}` : ``,
    ``,
    `Purpose: develop the Room Read card library. Each person below has a`,
    `ground-truth note (for locked anchors), engine structured data, raw`,
    `answers, and the full engine-prose report.`,
    ``,
    `---`,
    ``,
  ]
    .filter((l) => l !== ``)
    .join("\n");

  const md = header + "\n\n" + sections.join("\n\n---\n\n") + "\n";
  writeFileSync(outPath, md, "utf-8");
  console.log(
    `Wrote ${outPath} — ${included} session(s)${errors ? `, ${errors} render error(s)` : ""}.`
  );
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
