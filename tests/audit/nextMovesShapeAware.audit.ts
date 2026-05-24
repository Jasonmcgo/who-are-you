// CC-104-NEXT-MOVES-SHAPE-AWARE audit — 12 assertions covering the
// router, prose generator, render integration, and engine-math
// regression anchor.
//
// **CC-142 — anchor refresh.** Two render-integration assertions
// (#8 prose-no-engine-vocabulary-leak, #9 section-ordering, also #11)
// pointed at user-mode `## Next Moves`, which has been correct in
// neither mode since:
//   - CC-120: the register-based `## Next Moves` section was gated to
//     clinician (it duplicated "Your Next 3 Moves" and exposed
//     question-IDs).
//   - CC-132: user-mode renders the 50° outline; its next-moves
//     section is `## Your Next Three Moves — From Grip to Aim`.
// The render contract is intact; the audit anchors were stale. CC-142
// realigns #8, #9, #11 to the current contract (clinician body slice
// for the leak check; both-mode ordering checks; user-mode caption
// check against the live 50° header). Router / prose / engine math /
// JASON_ANCHOR are unchanged.
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
  // CC-142 realignment: the register-based section is now clinician-
  // only, so the leak check anchors against the **clinician** mode's
  // `## Next Moves` body (the section that carries the router's prose
  // verbatim). The user-mode 50° `## Your Next Three Moves — From
  // Grip to Aim` body is ALSO checked — it's the user-facing section
  // that replaced the old user-mode `## Next Moves`.
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
    const jasonClinicianMd = renderMirrorAsMarkdown({
      constitution: jasonConstitution,
      includeBeliefAnchor: false,
      generatedAt: new Date("2026-05-17T00:00:00Z"),
      renderMode: "clinician",
    });
    const jasonUserMd = renderMirrorAsMarkdown({
      constitution: jasonConstitution,
      includeBeliefAnchor: false,
      generatedAt: new Date("2026-05-17T00:00:00Z"),
      renderMode: "user",
    });
    // Slice a section between its header and the next `## ` header
    // (or end of document). Empty string if the header isn't present.
    function sliceSection(md: string, header: string): string {
      const start = md.indexOf(header);
      if (start < 0) return "";
      const rest = md.slice(start + header.length);
      const nextHeader = rest.search(/\n## /);
      return nextHeader < 0 ? md.slice(start) : md.slice(start, start + header.length + nextHeader);
    }
    const clinicianBody = sliceSection(jasonClinicianMd, "## Next Moves");
    const userBody = sliceSection(
      jasonUserMd,
      "## Your Next Three Moves — From Grip to Aim"
    );
    // The clinician body legitimately carries an italic `_Register:
    // <code>_` caption (asserted by #10 below). The caption is
    // clinician-facing metadata, not user-facing prose, so the
    // register-code term inside it is by design. Strip the caption
    // line before banlist scanning so #8 measures prose-leaks only.
    const clinicianBodyWithoutCaption = clinicianBody.replace(
      /_Register: [^_]+_\s*/g,
      ""
    );
    const clinicianLeaks = banList.filter((term) =>
      clinicianBodyWithoutCaption.toLowerCase().includes(term.toLowerCase())
    );
    const userLeaks = banList.filter((term) =>
      userBody.toLowerCase().includes(term.toLowerCase())
    );
    const ok =
      clinicianLeaks.length === 0 &&
      clinicianBody.length > 0 &&
      userLeaks.length === 0 &&
      userBody.length > 0;
    results.push(
      ok
        ? {
            ok: true,
            assertion: "prose-no-engine-vocabulary-leak",
            detail: `clinician Next Moves body (${clinicianBody.length} chars) + user 50° Next-Three-Moves body (${userBody.length} chars): 0 banlist hits each`,
          }
        : {
            ok: false,
            assertion: "prose-no-engine-vocabulary-leak",
            detail: `clinicianLen=${clinicianBody.length} clinicianLeaks=[${clinicianLeaks.join(",")}] userLen=${userBody.length} userLeaks=[${userLeaks.join(",")}]`,
          }
    );
  }

  // ── 9. render-section-emits-in-the-right-place ──────────────────────
  // CC-142 realignment: section ordering is checked in BOTH modes
  // against the live header set.
  //   - clinician (post-CC-120): `## Next Moves` appears after
  //     `## Your Grip` and before `## Path — Gait`.
  //   - user (post-CC-132 50° outline): `## Your Next Three Moves —
  //     From Grip to Aim` appears after `## Your Grip` and before
  //     `## Closing Read`.
  // Both ordering checks must hold; the intent "the Next-Moves
  // section emits in the right place" is preserved end-to-end across
  // the two surfaces.
  {
    const clinicianMd = renderMirrorAsMarkdown({
      constitution: jasonConstitution,
      includeBeliefAnchor: false,
      generatedAt: new Date("2026-05-17T00:00:00Z"),
      renderMode: "clinician",
    });
    const userMd = renderMirrorAsMarkdown({
      constitution: jasonConstitution,
      includeBeliefAnchor: false,
      generatedAt: new Date("2026-05-17T00:00:00Z"),
      renderMode: "user",
    });
    // Clinician contract.
    const clGripIdx = clinicianMd.indexOf("## Your Grip");
    const clNextIdx = clinicianMd.indexOf("## Next Moves");
    const clPathIdx = clinicianMd.indexOf("## Path — Gait");
    const clinicianOk =
      clGripIdx > -1 &&
      clNextIdx > -1 &&
      clPathIdx > -1 &&
      clGripIdx < clNextIdx &&
      clNextIdx < clPathIdx;
    // User-mode 50° contract.
    const uGripIdx = userMd.indexOf("## Your Grip");
    const uNextIdx = userMd.indexOf(
      "## Your Next Three Moves — From Grip to Aim"
    );
    const uClosingIdx = userMd.indexOf("## Closing Read");
    const userOk =
      uGripIdx > -1 &&
      uNextIdx > -1 &&
      uClosingIdx > -1 &&
      uGripIdx < uNextIdx &&
      uNextIdx < uClosingIdx;
    results.push(
      clinicianOk && userOk
        ? {
            ok: true,
            assertion: "render-section-emits-in-the-right-place",
            detail: `clinician: grip(${clGripIdx}) < nextMoves(${clNextIdx}) < path(${clPathIdx}); user-50°: grip(${uGripIdx}) < next3moves(${uNextIdx}) < closing(${uClosingIdx})`,
          }
        : {
            ok: false,
            assertion: "render-section-emits-in-the-right-place",
            detail: `clinicianOk=${clinicianOk} (grip=${clGripIdx} next=${clNextIdx} path=${clPathIdx}); userOk=${userOk} (grip=${uGripIdx} next3=${uNextIdx} closing=${uClosingIdx})`,
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
  // CC-142 realignment: anchored to the live user-mode 50° next-moves
  // header AND to the full user-mode body (no `_Register: …_` caption
  // anywhere in user mode, since the 50° outline never carries it
  // and the entire register section is clinician-gated). The
  // pre-CC-142 version sliced `## Next Moves … ## Path` in user
  // mode — both headers absent, slice was empty, and "empty has no
  // caption" passed vacuously.
  {
    const md = renderMirrorAsMarkdown({
      constitution: jasonConstitution,
      includeBeliefAnchor: false,
      generatedAt: new Date("2026-05-17T00:00:00Z"),
      renderMode: "user",
    });
    // The 50° next-moves section must exist (proves we're checking
    // the real surface, not vacuously passing on missing headers).
    const nextThreeMovesIdx = md.indexOf(
      "## Your Next Three Moves — From Grip to Aim"
    );
    // The user-mode mask + 50° outline drop the register caption from
    // every section — assert it's absent anywhere in user mode.
    const sectionPresent = nextThreeMovesIdx > -1;
    const captionAbsent = !/_Register: /.test(md);
    results.push(
      sectionPresent && captionAbsent
        ? {
            ok: true,
            assertion: "render-user-mode-omits-register-caption",
            detail: `user 50° next-moves section present at idx ${nextThreeMovesIdx}; no _Register: caption anywhere in user-mode output`,
          }
        : {
            ok: false,
            assertion: "render-user-mode-omits-register-caption",
            detail: `sectionPresent=${sectionPresent}; captionAbsent=${captionAbsent} (caption appeared somewhere in user-mode body)`,
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
