// CC-171 — cohort-real Lens-canon regression lock.
//
// Locks the cohort-real anchors whose canonical Lens dominant is
// owner-confirmed (Harry, Ashley, Daniel, Jason). Without this audit,
// a future engine-math change can silently flip one of these and we
// only notice when an anchor's render reads wrong.
//
// Harry is the CC-171 regression: he was Si pre-CC-134 ("CC-134/134.1/
// 135/136: typing accuracy + N/S valence rebalance"), then Ni from
// CC-134 onward because the top-pick (rank-1) convergence rule
// promoted his bimodal Ni (2 rank-1 picks) over his consistent Si
// (1 rank-1 pick, but rank 2 in the other 3 perceiving blocks). The
// CC-171 fix re-routes Q-T-direct perceiving dominants whose pool
// convergence is weak when the cross-signal evidence (broader
// signature) strongly prefers the OTHER perceiving mirror axis. See
// `applyPerceivingAxisCorrection` in lib/jungianStack.ts.
//
// Ashley/Jason are owner-confirmed Ni; Daniel is owner-confirmed Si.
// They serve as CONTROLS: the fix must move only Harry. Ashley + Jason
// gate-fail (no `dominant-convergence-weak` — Q-T Ni lead is 3 / 4);
// Daniel is already Si.
//
// Hand-rolled. Invocation: `npx tsx tests/audit/cohortRealLensCanon.audit.ts`.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import type {
  Answer,
  CognitiveFunctionId,
  MetaSignal,
} from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES = join(__dirname, "..", "fixtures", "cohort-real");

interface AnchorLock {
  fixture: string;
  canonName: string;
  expectedDominant: CognitiveFunctionId;
  rationale: string;
}

const LOCKS: AnchorLock[] = [
  {
    fixture: "harry-real.json",
    canonName: "Harry",
    expectedDominant: "si",
    rationale:
      "Harry = ISFJ (Si-Fe), strong Ne mirror partner. CC-171 regression fix: bimodal Ni won CC-134 top-pick by 1 in a 4-block sample but cross-signal puts him firmly on the Si↔Ne axis.",
  },
  {
    fixture: "ashley-real.json",
    canonName: "Ashley",
    expectedDominant: "ni",
    rationale:
      "Ashley = INFJ direction (owner-confirmed Ni). CONTROL — clean Q-T Ni lead (3) means `dominant-convergence-weak` does NOT fire, so the CC-171 correction gate-fails and she stays Ni.",
  },
  {
    fixture: "daniel-real.json",
    canonName: "Daniel",
    expectedDominant: "si",
    rationale:
      "Daniel = ISTJ direction (owner-confirmed Si, clean — not mirror). CONTROL — already Si; the CC-171 correction only flips perceiving dominants in the other axis direction.",
  },
  {
    fixture: "jason-real.json",
    canonName: "Jason",
    expectedDominant: "ni",
    rationale:
      "Jason = INTJ (owner-confirmed Ni). CONTROL — Q-T Ni lead of 4 (overwhelming) means `dominant-convergence-weak` does NOT fire; stays Ni regardless of any cross-signal axis preference.",
  },
  {
    fixture: "keith-real.json",
    canonName: "Keith",
    expectedDominant: "si",
    rationale:
      "Keith = intuitive Si (Si↔Ne, Si-led), same family as Harry. CC-171 cross-signal correction: his Q-T over-read a very live Ne (D&D DM + comic-canon nerd-podcast = divergent possibility-play) as bimodal Ni, which won top-pick — but the lived signature puts him on Si↔Ne (Stability #1, 'maintaining responsibilities', grips the plan-that-used-to-work under pressure, teaching/canon mastery; cross-signal Si=75 vs Ni=45). Owner-confirmed via biography (former middle-school teacher; runs a comic-movie + D&D podcast). NOTE: cross-signal-derived lock — Q-T-direct alone reads Se↔Ni for him, so this anchor doubles as the canonical 'Q-T over-reads Ne as Ni for intuitive-Si' calibration case.",
  },
];

interface Outcome {
  ok: boolean;
  name: string;
  detail: string;
}

function runOne(lock: AnchorLock): Outcome {
  const raw = JSON.parse(
    readFileSync(join(FIXTURES, lock.fixture), "utf-8")
  ) as { answers: Answer[]; metaSignals?: MetaSignal[] };
  const c = buildInnerConstitution(
    raw.answers,
    raw.metaSignals ?? [],
    null
  );
  const actual = c.lens_stack.dominant;
  const ok = actual === lock.expectedDominant;
  return {
    ok,
    name: `${lock.canonName}-lens-dom-equals-${lock.expectedDominant}`,
    detail: ok
      ? `${lock.canonName} → dominant=${actual} ✓ (${lock.rationale})`
      : `${lock.canonName} → dominant=${actual}, expected=${lock.expectedDominant}. ${lock.rationale}`,
  };
}

const results = LOCKS.map(runOne);
console.log("CC-171 COHORT-REAL LENS CANON audit");
console.log("=====================================");
console.log("");
for (const r of results) {
  console.log(`[${r.ok ? "PASS" : "FAIL"}] ${r.name} — ${r.detail}`);
}
console.log("");
const fails = results.filter((r) => !r.ok).length;
if (fails > 0) {
  console.log(`AUDIT FAILED — ${fails}/${results.length} assertion(s) regressed.`);
  process.exit(1);
}
console.log(
  `AUDIT PASSED — ${results.length}/${results.length} cohort-real Lens-canon assertions green.`
);
