// CC-LAUNCH-VOICE-POLISH audit — Part B (deterministic template fixes)
// plus B6 React-side <details> wrap. Part A (LLM rewrite expansion for
// Executive Read et al.) deferred to a follow-up CC.
//
// Assertions:
//   B1. Pronoun sweep: no third-person name interpolation reaches user mode.
//   B2. (formerly X) parentheticals stripped from user mode.
//   B3. "In health: In health" doubled prefix gone.
//   B4. "Mirror-Types Seed" renamed to "Mirror-Type Seed".
//   B5. MBTI surface-label disclaimer suppressed in user mode (still in clinician).
//   B6. Architect failure-mode <details> wraps the uncomfortable-but-true line
//       (React-side; source-code check).
//   B7. Drive distribution donut SVG suppressed in user mode (still in clinician).

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import { renderMirrorAsMarkdown } from "../../lib/renderMirror";
import type {
  Answer,
  DemographicSet,
  InnerConstitution,
} from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");
const REPO_ROOT = join(__dirname, "..", "..");

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

function listFixtures(): Array<{ set: string; file: string }> {
  const out: Array<{ set: string; file: string }> = [];
  for (const set of ["ocean", "goal-soul-give"]) {
    const dir = join(ROOT, set);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)
      .filter((x) => x.endsWith(".json"))
      .sort()) {
      out.push({ set, file: f });
    }
  }
  return out;
}

function renderUser(set: string, file: string): {
  userMd: string;
  clinMd: string;
  name: string | null;
  constitution: InnerConstitution;
} {
  const raw = JSON.parse(readFileSync(join(ROOT, set, file), "utf-8")) as {
    answers: Answer[];
    demographics?: DemographicSet | null;
  };
  const constitution = buildInnerConstitution(
    raw.answers,
    [],
    raw.demographics ?? null
  );
  const stamp = new Date("2026-05-13T00:00:00Z");
  const userMd = renderMirrorAsMarkdown({
    constitution,
    includeBeliefAnchor: false,
    answers: raw.answers,
    demographics: raw.demographics ?? null,
    generatedAt: stamp,
    renderMode: "user",
  });
  const clinMd = renderMirrorAsMarkdown({
    constitution,
    includeBeliefAnchor: false,
    answers: raw.answers,
    demographics: raw.demographics ?? null,
    generatedAt: stamp,
    renderMode: "clinician",
  });
  const name =
    raw.demographics?.answers?.find(
      (a) => a.field_id === "name" && a.state === "specified"
    )?.value ?? null;
  return { userMd, clinMd, name, constitution };
}

async function runAudit(): Promise<void> {
  const results: AssertionResult[] = [];

  // ── B1. pronoun-sweep-second-person ────────────────────────────────
  //   Across the 24-fixture cohort: zero occurrences of the user's
  //   first name in body prose (masthead "For: {name}" line exempted).
  //   Same gate `headerNavAndEmailGate` enforces, expanded to also
  //   cover lines containing the user's name as a possessive ("'s").
  //   Cohort fixtures mostly have no `name` set so this protects
  //   against future regressions when names are present.
  {
    const failures: string[] = [];
    for (const fx of listFixtures()) {
      const { userMd, name } = renderUser(fx.set, fx.file);
      if (!name) continue;
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`\\b${escaped}('s)?\\b`, "g");
      const stripped = userMd
        .split("\n")
        .filter((l) => !l.includes(`For: ${name}`))
        .join("\n");
      if (re.test(stripped))
        failures.push(`${fx.set}/${fx.file} (name="${name}")`);
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "B1-pronoun-sweep-second-person",
            detail: `no third-person name leaks across cohort user-mode renders (masthead "For:" exempted)`,
          }
        : {
            ok: false,
            assertion: "B1-pronoun-sweep-second-person",
            detail: `${failures.length} fixtures leak name: ${failures.slice(0, 3).join(", ")}`,
          }
    );
  }

  // ── B2. formerly-parenthetical-stripped ────────────────────────────
  //   Zero "(formerly X)" patterns in user mode; clinician retains them.
  {
    const userFails: string[] = [];
    let clinicianRetains = 0;
    for (const fx of listFixtures()) {
      const { userMd, clinMd } = renderUser(fx.set, fx.file);
      if (/\(formerly\s/.test(userMd))
        userFails.push(`${fx.set}/${fx.file} (user mode)`);
      if (/\(formerly\s/.test(clinMd)) clinicianRetains++;
    }
    const fails: string[] = [];
    if (userFails.length > 0)
      fails.push(`${userFails.length} user leaks: ${userFails.slice(0, 3).join(", ")}`);
    if (clinicianRetains === 0)
      fails.push("clinician mode does not retain (formerly …) — engine docs lost");
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "B2-formerly-parenthetical-stripped",
            detail: `user mode has 0 "(formerly …)" hits; clinician retains them in ${clinicianRetains} fixtures`,
          }
        : {
            ok: false,
            assertion: "B2-formerly-parenthetical-stripped",
            detail: fails.join("; "),
          }
    );
  }

  // ── B3. in-health-doubled-prefix-gone ──────────────────────────────
  //   The Hands engine prose previously emitted "**Under Pressure** —
  //   In health: In health, you build…" because the template's lead-in
  //   collided with handsCard.healthRegister's own "In health, you…"
  //   opener. Zero hits in user mode across the cohort.
  {
    const failures: string[] = [];
    for (const fx of listFixtures()) {
      const { userMd, clinMd } = renderUser(fx.set, fx.file);
      if (/In health: In health/.test(userMd))
        failures.push(`${fx.set}/${fx.file} (user)`);
      if (/In health: In health/.test(clinMd))
        failures.push(`${fx.set}/${fx.file} (clinician)`);
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "B3-in-health-doubled-prefix-gone",
            detail: `0 "In health: In health" doubled prefix across user + clinician`,
          }
        : {
            ok: false,
            assertion: "B3-in-health-doubled-prefix-gone",
            detail: failures.slice(0, 3).join(", "),
          }
    );
  }

  // ── B4. mirror-types-seed-singularized ─────────────────────────────
  //   "Mirror-Types Seed" → "Mirror-Type Seed" across both modes.
  {
    const failures: string[] = [];
    for (const fx of listFixtures()) {
      const { userMd, clinMd } = renderUser(fx.set, fx.file);
      if (/Mirror-Types Seed/.test(userMd))
        failures.push(`${fx.set}/${fx.file} (user, plural)`);
      if (/Mirror-Types Seed/.test(clinMd))
        failures.push(`${fx.set}/${fx.file} (clinician, plural)`);
    }
    // Also verify the singularized form appears somewhere in each.
    const { userMd: jasonUser } = renderUser("ocean", "07-jason-real-session.json");
    if (!/Mirror-Type Seed/.test(jasonUser))
      failures.push("Jason user mode missing singularized 'Mirror-Type Seed'");
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "B4-mirror-types-seed-singularized",
            detail: `0 plural occurrences; singular form present`,
          }
        : {
            ok: false,
            assertion: "B4-mirror-types-seed-singularized",
            detail: failures.slice(0, 3).join(", "),
          }
    );
  }

  // ── B5. mbti-disclosure-suppressed-user-mode ───────────────────────
  //   "Possible surface label" + "Type labels are surface descriptions
  //   only" — zero hits in user mode; both still appear in clinician
  //   mode where Jason fixture has high-confidence MBTI.
  {
    const userFails: string[] = [];
    let clinicianPresent = 0;
    for (const fx of listFixtures()) {
      const { userMd, clinMd } = renderUser(fx.set, fx.file);
      if (/Possible surface label/.test(userMd))
        userFails.push(`${fx.set}/${fx.file} (user, surface-label)`);
      if (/Type labels are surface descriptions only/.test(userMd))
        userFails.push(`${fx.set}/${fx.file} (user, type-labels)`);
      if (/Possible surface label/.test(clinMd)) clinicianPresent++;
    }
    const fails: string[] = [];
    if (userFails.length > 0)
      fails.push(`${userFails.length} user leaks: ${userFails.slice(0, 3).join(", ")}`);
    if (clinicianPresent === 0)
      fails.push("clinician mode does not retain MBTI disclosure for any fixture");
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "B5-mbti-disclosure-suppressed-user-mode",
            detail: `0 MBTI disclosure hits in user mode; clinician retains it in ${clinicianPresent} fixtures`,
          }
        : {
            ok: false,
            assertion: "B5-mbti-disclosure-suppressed-user-mode",
            detail: fails.join("; "),
          }
    );
  }

  // ── B6. architect-uncomfortable-details-wired ──────────────────────
  //   The React-side MirrorSection wraps the uncomfortable-but-true
  //   line in a <details> element with archetype-specific explanation
  //   paragraphs. Source-code check.
  {
    const path = join(REPO_ROOT, "app", "components", "MirrorSection.tsx");
    const fails: string[] = [];
    if (!existsSync(path)) {
      fails.push("MirrorSection.tsx missing");
    } else {
      const src = readFileSync(path, "utf-8");
      if (!/UncomfortableButTrueDetails/.test(src))
        fails.push("missing UncomfortableButTrueDetails component");
      if (!/UNCOMFORTABLE_DETAILS_BY_ARCHETYPE/.test(src))
        fails.push("missing per-archetype explanation map");
      // Per-archetype keys must all be present in the map.
      for (const key of [
        "jasonType",
        "cindyType",
        "danielType",
        "unmappedType",
      ]) {
        if (!new RegExp(`\\b${key}\\b:`).test(src))
          fails.push(`map missing ${key} key`);
      }
      if (!/<details/.test(src))
        fails.push("no <details> element in MirrorSection (the wrap)");
    }
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "B6-architect-uncomfortable-details-wired",
            detail: `UncomfortableButTrueDetails component + 4-archetype explanation map + <details> wrap present`,
          }
        : {
            ok: false,
            assertion: "B6-architect-uncomfortable-details-wired",
            detail: fails.join("; "),
          }
    );
  }

  // ── B7. drive-donut-suppressed-user-mode ───────────────────────────
  //   The donut SVG no longer renders on the user-mode markdown for
  //   the Path/Gait section; clinician mode still renders it.
  {
    const userFails: string[] = [];
    let clinicianPresent = 0;
    for (const fx of listFixtures()) {
      const { userMd, clinMd, constitution } = renderUser(fx.set, fx.file);
      const hasDrive = !!constitution.shape_outputs?.path?.drive;
      if (!hasDrive) continue;
      // The donut composer emits aria-label="Drive distribution donut chart" —
      // match on that unique signature.
      const userHasDonut = /Drive distribution donut chart/.test(userMd);
      const clinHasDonut = /Drive distribution donut chart/.test(clinMd);
      if (userHasDonut) userFails.push(`${fx.set}/${fx.file} (user)`);
      if (clinHasDonut) clinicianPresent++;
    }
    const fails: string[] = [];
    if (userFails.length > 0)
      fails.push(`${userFails.length} user leaks: ${userFails.slice(0, 3).join(", ")}`);
    if (clinicianPresent === 0)
      fails.push("clinician mode does not retain the donut SVG in any drive-bearing fixture");
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "B7-drive-donut-suppressed-user-mode",
            detail: `0 donut SVGs in user mode; clinician retains the donut in ${clinicianPresent} drive-bearing fixtures`,
          }
        : {
            ok: false,
            assertion: "B7-drive-donut-suppressed-user-mode",
            detail: fails.join("; "),
          }
    );
  }

  // ── Report ─────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  for (const r of results) {
    const tag = r.ok ? "[PASS]" : "[FAIL]";
    console.log(`${tag} ${r.assertion}${r.detail ? `  — ${r.detail}` : ""}`);
  }
  console.log("");
  console.log(
    `CC-LAUNCH-VOICE-POLISH: ${passed}/${results.length} assertions passing.`
  );
  if (failed > 0) process.exit(1);
}

runAudit().catch((e) => {
  console.error(e);
  process.exit(1);
});
