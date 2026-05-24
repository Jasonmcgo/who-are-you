// CC-143 — Love Map register distribution audit.
//
// Diagnostic-only audit. Runs every cohort fixture through
// `computeLoveMapOutput` and reports which register(s) each session
// resolves to + the per-register score for the top-2. The acceptance
// gate (CC-143 §Acceptance gate): a genuine spread, not a monoculture
// — ≥ 4 of 7 registers represented across the available cohorts. The
// pre-CC-143 baseline showed every cohort resolving to "devoted_partner"
// (a single-register monoculture); this audit makes the spread visible.
//
// Run: `npx tsx tests/audit/loveMapRegisterDistribution.audit.ts`.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import { LOVE_REGISTERS } from "../../lib/loveMap";
import type {
  Answer,
  DemographicSet,
  LoveRegisterKey,
} from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");

interface Row {
  fixture: string;
  topRegister: LoveRegisterKey | "(none)";
  topScore: number;
  secondRegister: LoveRegisterKey | "(none)";
  secondScore: number;
  matchedCount: number;
}

function analyzeFixture(path: string): Row | null {
  const raw = JSON.parse(readFileSync(path, "utf-8")) as {
    answers?: Answer[];
    demographics?: DemographicSet | null;
  };
  if (!raw.answers) return null;
  let constitution;
  try {
    constitution = buildInnerConstitution(
      raw.answers,
      [],
      raw.demographics ?? null
    );
  } catch {
    return null;
  }
  const live = constitution.loveMap;
  if (!live || !live.matches || live.matches.length === 0) {
    return {
      fixture: path.replace(ROOT + "/", ""),
      topRegister: "(none)",
      topScore: 0,
      secondRegister: "(none)",
      secondScore: 0,
      matchedCount: 0,
    };
  }
  return {
    fixture: path.replace(ROOT + "/", ""),
    topRegister: live.matches[0].register.register_key,
    topScore: live.matches[0].score,
    secondRegister:
      live.matches[1]?.register.register_key ?? "(none)",
    secondScore: live.matches[1]?.score ?? 0,
    matchedCount: live.matches.length,
  };
}

function main(): number {
  const rows: Row[] = [];
  const dirs = ["ocean", "goal-soul-give", "cohort-real"];
  for (const dir of dirs) {
    const dirPath = join(ROOT, dir);
    if (!existsSync(dirPath)) continue;
    for (const f of readdirSync(dirPath)
      .filter((x) => x.endsWith(".json"))
      .sort()) {
      const r = analyzeFixture(join(dirPath, f));
      if (r) rows.push(r);
    }
  }

  console.log("CC-143 — Love Map register distribution audit");
  console.log("=".repeat(72));
  console.log(`Fixtures audited: ${rows.length}`);
  console.log(`Registers in canon: ${LOVE_REGISTERS.length}`);
  console.log("");
  console.log("Per-fixture top register + runner-up:");
  console.log("");
  for (const r of rows) {
    const top = `${r.topRegister} (${r.topScore.toFixed(2)})`;
    const second = r.secondRegister === "(none)"
      ? "(single)"
      : `${r.secondRegister} (${r.secondScore.toFixed(2)})`;
    console.log(`  ${r.fixture}`);
    console.log(`    → ${top}  |  runner-up: ${second}`);
  }
  console.log("");

  const registerCounts: Record<string, number> = {};
  for (const r of rows) {
    const key = r.topRegister;
    registerCounts[key] = (registerCounts[key] ?? 0) + 1;
  }
  const uniqueRegisters = Object.keys(registerCounts).filter(
    (k) => k !== "(none)"
  );
  console.log("Top-register distribution:");
  for (const [k, v] of Object.entries(registerCounts).sort(
    (a, b) => b[1] - a[1]
  )) {
    const pct = ((v / rows.length) * 100).toFixed(0);
    console.log(`  ${k.padEnd(22)} ${v.toString().padStart(3)} / ${rows.length}  (${pct}%)`);
  }
  console.log("");
  console.log(
    `Spread: ${uniqueRegisters.length} distinct register(s) across ${rows.length} fixtures.`
  );
  const SPREAD_FLOOR = 4;
  const ok = uniqueRegisters.length >= SPREAD_FLOOR;
  console.log(
    ok
      ? `RESULT: PASS — spread ≥ ${SPREAD_FLOOR} of 7 registers (gate met).`
      : `RESULT: FAIL — spread < ${SPREAD_FLOOR} of 7 (CC-143 calibration not done).`
  );
  return ok ? 0 : 1;
}

process.exit(main());
