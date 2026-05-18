// CC-104-NEXT-MOVES-SHAPE-AWARE audit — 12 assertions covering the
// router, prose generator, render integration, and engine-math
// regression anchor.
//
// Invocation: `npm run audit:next-moves-shape-aware`.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import { renderMirrorAsMarkdown } from "../../lib/renderMirror";
import { routeNextMovesRegister } from "../../lib/nextMovesRouter";
import type {
  Answer,
  DemographicSet,
  InnerConstitution,
} from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES = join(__dirname, "..", "fixtures");

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

// Jason regression anchor (render-only CC must not move these).
const JASON_ANCHOR = {
  Goal: 92,
  Soul: 59,
  Aim: 64.9,
  Grip: 26.3,
  Movement: 77.28195132112025,
};

function loadConstitution(
  fixturePath: string,
  useDemographics: boolean
): InnerConstitution {
  const raw = JSON.parse(readFileSync(fixturePath, "utf-8")) as {
    answers: Answer[];
    demographics?: DemographicSet | null;
  };
  return buildInnerConstitution(
    raw.answers,
    [],
    useDemographics ? raw.demographics ?? null : null
  );
}

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];

  const jasonConstitution = loadConstitution(
    join(FIXTURES, "ocean", "07-jason-real-session.json"),
    true
  );
  const harryConstitution = loadConstitution(
    join(FIXTURES, "cohort-real", "harry-real.json"),
    false
  );
  const micheleConstitution = loadConstitution(
    join(FIXTURES, "cohort-real", "michele-real.json"),
    false
  );

  // ── 1. router-jason-routes-to-identity-reframe ──────────────────────
  {
    const nm = jasonConstitution.nextMoves;
    const ok = nm?.register === "identity-reframe";
    results.push(
      ok
        ? {
            ok: true,
            assertion: "router-jason-routes-to-identity-reframe",
            detail: `Jason → ${nm?.register} (${nm?.routing.confidence})`,
          }
        : {
            ok: false,
            assertion: "router-jason-routes-to-identity-reframe",
            detail: `expected identity-reframe; got ${nm?.register ?? "(no attachment)"}`,
          }
    );
  }

  // ── 2. router-harry-routes-to-load-audit ────────────────────────────
  {
    const nm = harryConstitution.nextMoves;
    const ok = nm?.register === "load-audit";
    results.push(
      ok
        ? {
            ok: true,
            assertion: "router-harry-routes-to-load-audit",
            detail: `Harry → ${nm?.register} (${nm?.routing.confidence}): ${nm?.routing.reason.slice(0, 70)}`,
          }
        : {
            ok: false,
            assertion: "router-harry-routes-to-load-audit",
            detail: `expected load-audit; got ${nm?.register ?? "(no attachment)"}`,
          }
    );
  }

  // ── 3. router-michele-routes-to-load-audit ──────────────────────────
  {
    const nm = micheleConstitution.nextMoves;
    const ok =
      nm?.register === "load-audit" &&
      /fallback/i.test(nm?.routing.reason ?? "");
    results.push(
      ok
        ? {
            ok: true,
            assertion: "router-michele-routes-to-load-audit",
            detail: `Michele → ${nm?.register} (fallback): ${nm?.routing.reason.slice(0, 60)}`,
          }
        : {
            ok: false,
            assertion: "router-michele-routes-to-load-audit",
            detail: `expected load-audit with "fallback" in reason; got ${nm?.register} — ${nm?.routing.reason}`,
          }
    );
  }

  // ── 4. router-synthetic-crisis-routes-to-build-something ────────────
  {
    const out = routeNextMovesRegister({
      vo: { score: 50 },
      stateLoad: {
        composite: 0.3,
        signals: { qx1: null, qx2: null, qa1: null, qo2Top: null },
      },
      gripBucket: "purpose",
      primalCoherence: "crisis",
      aim: 50,
    });
    const ok = out.register === "build-something";
    results.push(
      ok
        ? {
            ok: true,
            assertion: "router-synthetic-crisis-routes-to-build-something",
            detail: `crisis-path → ${out.register} (${out.confidence})`,
          }
        : {
            ok: false,
            assertion: "router-synthetic-crisis-routes-to-build-something",
            detail: `expected build-something; got ${out.register}`,
          }
    );
  }

  // ── 5. router-synthetic-low-aim-control-grip-routes-to-build-something
  {
    const out = routeNextMovesRegister({
      vo: { score: 55 },
      stateLoad: {
        composite: 0.2,
        signals: { qx1: null, qx2: null, qa1: null, qo2Top: null },
      },
      gripBucket: "control",
      primalCoherence: "trajectory",
      aim: 20,
    });
    const ok = out.register === "build-something";
    results.push(
      ok
        ? {
            ok: true,
            assertion: "router-synthetic-low-aim-control-grip-routes-to-build-something",
            detail: `aim=20 + control grip → ${out.register}`,
          }
        : {
            ok: false,
            assertion: "router-synthetic-low-aim-control-grip-routes-to-build-something",
            detail: `expected build-something; got ${out.register}`,
          }
    );
  }

  // ── 6. prose-one-small-move-references-user-signal ──────────────────
  {
    const jasonMove = jasonConstitution.nextMoves?.prose.oneSmallMove ?? "";
    const harryMove = harryConstitution.nextMoves?.prose.oneSmallMove ?? "";
    // Jason's Q-V1 top is `vulnerability_open_uncertainty` → "uncertainty"
    // phrase. Compass top is "Knowledge" → "the question you've been
    // avoiding". Either substring satisfies the assertion.
    const jasonOk =
      /uncertainty|knowledge|question/i.test(jasonMove);
    // Harry's Q-A2 is "Deepening relationships and care", Compass top is
    // "Truth". Either substring satisfies.
    const harryOk = /relationship|truth|care|conversation/i.test(harryMove);
    results.push(
      jasonOk && harryOk
        ? {
            ok: true,
            assertion: "prose-one-small-move-references-user-signal",
            detail: `Jason move references Q-V1/Compass; Harry move references Q-A2/Compass`,
          }
        : {
            ok: false,
            assertion: "prose-one-small-move-references-user-signal",
            detail: `Jason ok=${jasonOk}: "${jasonMove.slice(0, 80)}"; Harry ok=${harryOk}: "${harryMove.slice(0, 80)}"`,
          }
    );
  }

  // ── 7. prose-re-measure-cue-names-question-id ──────────────────────
  {
    const fixtures: Array<[string, InnerConstitution]> = [
      ["jason", jasonConstitution],
      ["harry", harryConstitution],
    ];
    const re = /Q-(X|A|O|V|GS|Ambition|Compass)/i;
    const fails = fixtures.filter(
      ([, c]) => !re.test(c.nextMoves?.prose.reMeasureCue ?? "")
    );
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "prose-re-measure-cue-names-question-id",
            detail: `2 fixtures: reMeasureCue contains a Q- identifier`,
          }
        : {
            ok: false,
            assertion: "prose-re-measure-cue-names-question-id",
            detail: `cues without Q-id: ${fails.map(([n]) => n).join(", ")}`,
          }
    );
  }

  // ── 8. prose-no-engine-vocabulary-leak ──────────────────────────────
  {
    const banList = [
      "V/O",
      "compressed owner",
      "load-audit",
      "identity-reframe",
      "build-something",
      "primal-coherence",
      "GSAG",
      "stateLoad",
      "victim_owner",
    ];
    const jasonUserMd = renderMirrorAsMarkdown({
      constitution: jasonConstitution,
      includeBeliefAnchor: false,
      generatedAt: new Date("2026-05-17T00:00:00Z"),
      renderMode: "user",
    });
    const startIdx = jasonUserMd.indexOf("## Next Moves");
    const endMarker = "## Path";
    const endIdx = jasonUserMd.indexOf(endMarker, startIdx);
    const nextMovesBody =
      startIdx > -1 && endIdx > -1
        ? jasonUserMd.slice(startIdx, endIdx)
        : "";
    const leaks = banList.filter((term) =>
      nextMovesBody.toLowerCase().includes(term.toLowerCase())
    );
    results.push(
      leaks.length === 0 && nextMovesBody.length > 0
        ? {
            ok: true,
            assertion: "prose-no-engine-vocabulary-leak",
            detail: `user-mode Next Moves body (${nextMovesBody.length} chars): 0 banlist hits`,
          }
        : {
            ok: false,
            assertion: "prose-no-engine-vocabulary-leak",
            detail: `bodyLen=${nextMovesBody.length} leaks=${leaks.join(", ")}`,
          }
    );
  }

  // ── 9. render-section-emits-after-grip-before-path ──────────────────
  {
    const md = renderMirrorAsMarkdown({
      constitution: jasonConstitution,
      includeBeliefAnchor: false,
      generatedAt: new Date("2026-05-17T00:00:00Z"),
      renderMode: "user",
    });
    const gripIdx = md.indexOf("Grip Pattern");
    const nextMovesIdx = md.indexOf("## Next Moves");
    const pathIdx = md.indexOf("## Path");
    const ok =
      gripIdx > -1 &&
      nextMovesIdx > -1 &&
      pathIdx > -1 &&
      gripIdx < nextMovesIdx &&
      nextMovesIdx < pathIdx;
    results.push(
      ok
        ? {
            ok: true,
            assertion: "render-section-emits-after-grip-before-path",
            detail: `order: grip(${gripIdx}) < nextMoves(${nextMovesIdx}) < path(${pathIdx})`,
          }
        : {
            ok: false,
            assertion: "render-section-emits-after-grip-before-path",
            detail: `bad order: grip=${gripIdx} nextMoves=${nextMovesIdx} path=${pathIdx}`,
          }
    );
  }

  // ── 10. render-clinician-mode-includes-register-caption ─────────────
  {
    const md = renderMirrorAsMarkdown({
      constitution: jasonConstitution,
      includeBeliefAnchor: false,
      generatedAt: new Date("2026-05-17T00:00:00Z"),
      renderMode: "clinician",
    });
    const ok = /## Next Moves[\s\S]{0,200}_Register: /.test(md);
    results.push(
      ok
        ? {
            ok: true,
            assertion: "render-clinician-mode-includes-register-caption",
            detail: `clinician mode emits the _Register: …_ italic caption`,
          }
        : {
            ok: false,
            assertion: "render-clinician-mode-includes-register-caption",
            detail: `caption missing or not within 200 chars of ## Next Moves header`,
          }
    );
  }

  // ── 11. render-user-mode-omits-register-caption ─────────────────────
  {
    const md = renderMirrorAsMarkdown({
      constitution: jasonConstitution,
      includeBeliefAnchor: false,
      generatedAt: new Date("2026-05-17T00:00:00Z"),
      renderMode: "user",
    });
    const startIdx = md.indexOf("## Next Moves");
    const endIdx = md.indexOf("## Path", startIdx);
    const body = startIdx > -1 && endIdx > -1 ? md.slice(startIdx, endIdx) : "";
    const ok = !/_Register: /.test(body);
    results.push(
      ok
        ? {
            ok: true,
            assertion: "render-user-mode-omits-register-caption",
            detail: `user mode: no _Register: …_ caption in Next Moves body`,
          }
        : {
            ok: false,
            assertion: "render-user-mode-omits-register-caption",
            detail: `user mode leaked the clinician _Register: …_ caption`,
          }
    );
  }

  // ── 12. engine-math-unchanged-jason-anchor ──────────────────────────
  {
    const dash = jasonConstitution.goalSoulMovement?.dashboard;
    const observedGoal = dash?.goalScore ?? null;
    const observedSoul = dash?.soulScore ?? null;
    const observedAim = jasonConstitution.aimReading?.score ?? null;
    const observedGrip =
      jasonConstitution.gripReading?.score ?? dash?.grippingPull?.score ?? null;
    const observedMovement = dash?.movementStrength?.length ?? null;
    const mismatches: string[] = [];
    if (observedGoal !== JASON_ANCHOR.Goal)
      mismatches.push(`Goal=${observedGoal}`);
    if (observedSoul !== JASON_ANCHOR.Soul)
      mismatches.push(`Soul=${observedSoul}`);
    if (observedAim !== JASON_ANCHOR.Aim) mismatches.push(`Aim=${observedAim}`);
    if (observedGrip !== JASON_ANCHOR.Grip)
      mismatches.push(`Grip=${observedGrip}`);
    if (observedMovement !== JASON_ANCHOR.Movement)
      mismatches.push(`Movement=${observedMovement}`);
    results.push(
      mismatches.length === 0
        ? {
            ok: true,
            assertion: "engine-math-unchanged-jason-anchor",
            detail: `Jason Goal=${observedGoal} Soul=${observedSoul} Aim=${observedAim} Grip=${observedGrip} Movement=${observedMovement} — byte-identical to pre-CC-104 anchor`,
          }
        : {
            ok: false,
            assertion: "engine-math-unchanged-jason-anchor",
            detail: `engine math drift: ${mismatches.join("; ")}`,
          }
    );
  }

  return results;
}

const results = runAudit();
const passed = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok).length;
for (const r of results) {
  const tag = r.ok ? "[PASS]" : "[FAIL]";
  console.log(`${tag} ${r.assertion}${r.detail ? `  — ${r.detail}` : ""}`);
}
console.log("");
console.log(
  `CC-104-NEXT-MOVES-SHAPE-AWARE: ${passed}/${results.length} assertions passing.`
);
if (failed > 0) process.exit(1);
