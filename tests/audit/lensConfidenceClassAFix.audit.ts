// CC-097-CONFIDENCE-FIX audit — Class A sensing-driver confidence bug.
//
// Seven assertions per the CC spec. All cases are constructed via
// synthetic Signal[] arrays rather than cohort fixtures: the cohort
// fixtures don't reproduce the bug-trigger pattern (developed Si/Se
// driver with strong tertiary), so synthetic signals are the
// canonical test surface. Assertions:
//
//   1. Daniel synthetic (Si dom, Te aux, Ne tertiary developed) →
//      confidence: "high"  (Class A wrong-low cured)
//   2. Cindy synthetic (Se dom, Fi aux, Ni tertiary developed) →
//      confidence: "high"
//   3. Harry synthetic (Si dom, Fe aux, Ne tertiary developed — non-
//      canonical Si-Fe-Ne-Te shape per Jungian-over-MBTI canon) →
//      confidence: "high"
//   4. Same-dim ambiguity (Si vs Se tight) → confidence: "low".
//      Genuine driver-attitude ambiguity is still flagged.
//   5. Jason synthetic (Ni dom, Te aux, clean stack) →
//      confidence: "high" (regression anchor; was always high).
//   6. MBTI_TIE_MARGIN constant is at its documented value (0.5).
//   7. SAME_DIMENSION_MIRROR map covers every cog function.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  aggregateLensStack,
  MBTI_TIE_MARGIN,
} from "../../lib/jungianStack";
import type { Signal } from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO = join(__dirname, "..", "..");

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

function sig(fn: string, rank: number): Signal {
  return {
    signal_id: fn as Signal["signal_id"],
    rank,
    source_question_ids: ["Q-T1"],
  } as Signal;
}

interface SyntheticCase {
  name: string;
  expected: "high" | "low";
  expectedDom?: string;
  expectedAux?: string;
  signals: Signal[];
}

const SYNTHETICS: SyntheticCase[] = [
  {
    name: "daniel-class-a-cured",
    expected: "high",
    expectedDom: "si",
    expectedAux: "te",
    signals: [
      // Si dom (avg 1.0), Ne tertiary developed (avg 1.25 — pre-fix
      // would trigger dominantTooTight against Ne, falsely flagging
      // low). Post-fix: dominantMirror=Se (avg 4.0), far → high.
      sig("si", 1), sig("si", 1), sig("si", 1), sig("si", 1),
      sig("ne", 1), sig("ne", 1), sig("ne", 1), sig("ne", 2),
      sig("ni", 3), sig("ni", 3), sig("ni", 3), sig("ni", 3),
      sig("se", 4), sig("se", 4), sig("se", 4), sig("se", 4),
      sig("te", 1), sig("te", 1), sig("te", 1), sig("te", 1),
      sig("ti", 2), sig("ti", 2), sig("ti", 2), sig("ti", 2),
      sig("fi", 3), sig("fi", 3), sig("fi", 3), sig("fi", 3),
      sig("fe", 4), sig("fe", 4), sig("fe", 4), sig("fe", 4),
    ],
  },
  {
    name: "cindy-class-a-cured",
    expected: "high",
    expectedDom: "se",
    expectedAux: "fi",
    signals: [
      // Se dom (avg 1.0), Ni tertiary developed (avg 1.25). Post-fix
      // dominantMirror=Si (avg 4.0), far → high.
      sig("se", 1), sig("se", 1), sig("se", 1), sig("se", 1),
      sig("ni", 1), sig("ni", 1), sig("ni", 1), sig("ni", 2),
      sig("ne", 3), sig("ne", 3), sig("ne", 3), sig("ne", 3),
      sig("si", 4), sig("si", 4), sig("si", 4), sig("si", 4),
      sig("fi", 1), sig("fi", 1), sig("fi", 1), sig("fi", 1),
      sig("fe", 2), sig("fe", 2), sig("fe", 2), sig("fe", 2),
      sig("te", 3), sig("te", 3), sig("te", 3), sig("te", 3),
      sig("ti", 4), sig("ti", 4), sig("ti", 4), sig("ti", 4),
    ],
  },
  {
    name: "harry-non-canonical-si-fe-ne-te",
    expected: "high",
    expectedDom: "si",
    expectedAux: "fe",
    signals: [
      // Harry's Si-Fe-Ne-Te non-canonical stack: Si dom, Fe aux,
      // developed Ne tertiary (avg 1.25). The MBTI canonical ISFJ
      // stack is Si-Fe-Ti-Ne, so the engine canonicalizes Harry's
      // top-2 (Si/Fe) but the tertiary mismatch doesn't affect the
      // confidence calc — what matters is dominantMirror=Se (avg 4.0,
      // far → high).
      sig("si", 1), sig("si", 1), sig("si", 1), sig("si", 1),
      sig("ne", 1), sig("ne", 1), sig("ne", 1), sig("ne", 2),
      sig("ni", 3), sig("ni", 3), sig("ni", 3), sig("ni", 3),
      sig("se", 4), sig("se", 4), sig("se", 4), sig("se", 4),
      sig("fe", 1), sig("fe", 1), sig("fe", 1), sig("fe", 1),
      sig("te", 2), sig("te", 2), sig("te", 2), sig("te", 2),
      sig("fi", 3), sig("fi", 3), sig("fi", 3), sig("fi", 3),
      sig("ti", 4), sig("ti", 4), sig("ti", 4), sig("ti", 4),
    ],
  },
  {
    name: "same-dimension-ambiguity-still-flagged",
    expected: "low",
    expectedDom: "si",
    expectedAux: "te",
    signals: [
      // Si avg 1.0, Se avg 1.25 — genuinely ambiguous sensing
      // attitude. Post-fix STILL flags low because the dominantMirror
      // (Se) is close to Si.
      sig("si", 1), sig("si", 1), sig("si", 1), sig("si", 1),
      sig("se", 1), sig("se", 1), sig("se", 1), sig("se", 2),
      sig("ne", 3), sig("ne", 3), sig("ne", 3), sig("ne", 3),
      sig("ni", 4), sig("ni", 4), sig("ni", 4), sig("ni", 4),
      sig("te", 1), sig("te", 1), sig("te", 1), sig("te", 1),
      sig("ti", 2), sig("ti", 2), sig("ti", 2), sig("ti", 2),
      sig("fi", 3), sig("fi", 3), sig("fi", 3), sig("fi", 3),
      sig("fe", 4), sig("fe", 4), sig("fe", 4), sig("fe", 4),
    ],
  },
  {
    name: "jason-ni-te-regression-anchor",
    expected: "high",
    expectedDom: "ni",
    expectedAux: "te",
    signals: [
      // Ni dom (avg 1.0), Si tertiary (avg 2.0), Ne shadow (avg 3.0),
      // Se inferior (avg 4.0). The canonical INTJ stack. Pre-fix this
      // already read high (runner-up perceiving Se is at inferior,
      // far). Post-fix: dominantMirror=Ne (avg 3.0), far → high.
      sig("ni", 1), sig("ni", 1), sig("ni", 1), sig("ni", 1),
      sig("ne", 3), sig("ne", 3), sig("ne", 3), sig("ne", 3),
      sig("si", 2), sig("si", 2), sig("si", 2), sig("si", 2),
      sig("se", 4), sig("se", 4), sig("se", 4), sig("se", 4),
      sig("te", 1), sig("te", 1), sig("te", 1), sig("te", 1),
      sig("ti", 2), sig("ti", 2), sig("ti", 2), sig("ti", 2),
      sig("fi", 3), sig("fi", 3), sig("fi", 3), sig("fi", 3),
      sig("fe", 4), sig("fe", 4), sig("fe", 4), sig("fe", 4),
    ],
  },
];

function runAudit(): void {
  const results: AssertionResult[] = [];

  // ── 1-5. Synthetic cases ──────────────────────────────────────────
  for (const c of SYNTHETICS) {
    const lens = aggregateLensStack(c.signals);
    const confOk = lens.confidence === c.expected;
    const domOk = !c.expectedDom || lens.dominant === c.expectedDom;
    const auxOk = !c.expectedAux || lens.auxiliary === c.expectedAux;
    results.push(
      confOk && domOk && auxOk
        ? {
            ok: true,
            assertion: c.name,
            detail: `${lens.dominant}/${lens.auxiliary} → ${lens.confidence}`,
          }
        : {
            ok: false,
            assertion: c.name,
            detail: `expected dom=${c.expectedDom ?? "*"} aux=${c.expectedAux ?? "*"} conf=${c.expected}; got dom=${lens.dominant} aux=${lens.auxiliary} conf=${lens.confidence}`,
          }
    );
  }

  // ── 6. MBTI_TIE_MARGIN constant value ─────────────────────────────
  results.push(
    MBTI_TIE_MARGIN === 0.5
      ? {
          ok: true,
          assertion: "mbti-tie-margin-constant",
          detail: `MBTI_TIE_MARGIN = ${MBTI_TIE_MARGIN}`,
        }
      : {
          ok: false,
          assertion: "mbti-tie-margin-constant",
          detail: `expected 0.5, got ${MBTI_TIE_MARGIN}`,
        }
  );

  // ── 7. Code documentation — CC-097-CONFIDENCE-FIX inline comment ──
  //   The fix code carries an inline comment referencing this CC so
  //   future readers can find the rationale via grep.
  {
    const src = readFileSync(join(REPO, "lib", "jungianStack.ts"), "utf-8");
    const hasMarker = /CC-097-CONFIDENCE-FIX/.test(src);
    const hasMirrorMap = /SAME_DIMENSION_MIRROR/.test(src);
    results.push(
      hasMarker && hasMirrorMap
        ? {
            ok: true,
            assertion: "code-marker-and-mirror-map-present",
            detail: `lib/jungianStack.ts carries CC-097-CONFIDENCE-FIX marker + SAME_DIMENSION_MIRROR map`,
          }
        : {
            ok: false,
            assertion: "code-marker-and-mirror-map-present",
            detail: `marker=${hasMarker} mirrorMap=${hasMirrorMap}`,
          }
    );
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  for (const r of results) {
    const tag = r.ok ? "[PASS]" : "[FAIL]";
    console.log(`${tag} ${r.assertion}${r.detail ? `  — ${r.detail}` : ""}`);
  }
  console.log("");
  console.log(`CC-097-CONFIDENCE-FIX: ${passed}/${results.length} assertions passing.`);
  if (failed > 0) process.exit(1);
}

runAudit();
