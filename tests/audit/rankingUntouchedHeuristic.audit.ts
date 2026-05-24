// CC-134 Part B — Untouched-ranking heuristic audit.
//
// Existing sessions carry no `touched` flag (CC-134 Part A adds it
// going forward). For historical / cohort data we DETECT a suspected
// untouched ranking heuristically: **a saved ranking whose `order`
// exactly equals the question's default `items` order** is flagged
// "suspected untouched / low confidence."
//
// This audit is DIAGNOSTIC ONLY — it does not mutate fixtures and does
// not gate the build. It reports per-fixture which rankings match
// default order so we can see how much of each report (esp. Megan) is
// artifact from passive respondents.
//
// Run: `npx tsx tests/audit/rankingUntouchedHeuristic.audit.ts`.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// CC-138.2 — audit operates on the full bank including legacy Q-T defs.
import { allQuestions as questions } from "../../data/questions";
import type { Answer, RankingAnswer, RankingQuestion } from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");

interface FixtureReport {
  fixture: string;
  totalRankings: number;
  flaggedRankings: Array<{
    question_id: string;
    card_id: string;
    defaultOrder: string[];
    savedOrder: string[];
  }>;
  highSignalFlagged: string[]; // Q-S1, Q-S2, Q-T1..Q-T8 specifically
}

const HIGH_SIGNAL_PREFIXES = ["Q-S1", "Q-S2", "Q-T"];

function isHighSignal(qid: string): boolean {
  return HIGH_SIGNAL_PREFIXES.some((p) => qid === p || qid.startsWith(p));
}

function rankingQuestionForId(qid: string): RankingQuestion | null {
  const q = questions.find((q) => q.question_id === qid);
  if (!q || q.type !== "ranking") return null;
  return q;
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function analyzeFixture(fixturePath: string): FixtureReport {
  const raw = JSON.parse(readFileSync(fixturePath, "utf-8")) as {
    answers?: Answer[];
  };
  const answers = raw.answers ?? [];
  const rankings = answers.filter(
    (a): a is RankingAnswer => a.type === "ranking"
  );
  const flagged: FixtureReport["flaggedRankings"] = [];
  const highSignal: string[] = [];
  for (const ans of rankings) {
    const q = rankingQuestionForId(ans.question_id);
    if (!q) continue;
    const defaultOrder = q.items.map((i) => i.id);
    if (arraysEqual(ans.order, defaultOrder)) {
      flagged.push({
        question_id: ans.question_id,
        card_id: ans.card_id,
        defaultOrder,
        savedOrder: ans.order,
      });
      if (isHighSignal(ans.question_id)) highSignal.push(ans.question_id);
    }
  }
  return {
    fixture: fixturePath.replace(ROOT + "/", ""),
    totalRankings: rankings.length,
    flaggedRankings: flagged,
    highSignalFlagged: highSignal,
  };
}

function main(): number {
  const reports: FixtureReport[] = [];
  const dirs = ["ocean", "goal-soul-give", "cohort-real"];
  for (const dir of dirs) {
    const dirPath = join(ROOT, dir);
    if (!existsSync(dirPath)) continue;
    for (const f of readdirSync(dirPath)
      .filter((x) => x.endsWith(".json"))
      .sort()) {
      reports.push(analyzeFixture(join(dirPath, f)));
    }
  }

  const lines: string[] = [];
  lines.push("CC-134 Part B — Untouched-ranking heuristic audit");
  lines.push("=".repeat(64));
  lines.push(`Fixtures audited: ${reports.length}`);
  lines.push("");
  lines.push("A ranking is flagged 'suspected untouched / low confidence'");
  lines.push("when its saved order exactly equals the question's default");
  lines.push("`items` order (no deliberate reorder detected).");
  lines.push("");
  let totalFlagged = 0;
  let totalHighSignal = 0;
  for (const r of reports) {
    if (r.flaggedRankings.length === 0) continue;
    totalFlagged += r.flaggedRankings.length;
    totalHighSignal += r.highSignalFlagged.length;
    lines.push(`# ${r.fixture}`);
    lines.push(
      `  ${r.flaggedRankings.length}/${r.totalRankings} rankings flagged · high-signal: ${r.highSignalFlagged.length} (${r.highSignalFlagged.join(", ") || "—"})`
    );
    for (const f of r.flaggedRankings) {
      const high = isHighSignal(f.question_id) ? " [HIGH-SIGNAL]" : "";
      lines.push(`    • ${f.question_id} (${f.card_id})${high}`);
    }
    lines.push("");
  }
  lines.push("");
  lines.push(
    `Totals: ${totalFlagged} flagged rankings across all fixtures; ${totalHighSignal} of those are high-signal (Q-S1 / Q-S2 / Q-T*).`
  );
  lines.push("");
  lines.push("This audit is diagnostic only — it does not gate the build.");
  console.log(lines.join("\n"));
  return 0;
}

process.exit(main());
