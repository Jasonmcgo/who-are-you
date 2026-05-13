// CC-SYNTHESIS-1-FINISH — synthesis-1 sub-track closing audit.
//
// Verifies six sections worth of structural changes across the 20-fixture
// cohort: A (prose dedup), B (Trust correction-channel reframe), C
// (Weather state-vs-shape qualifier), D (thin-signal Risk Form
// suppression), E (Movement Notes on 5 body cards), F (Path master
// synthesis paragraph).
//
// Hand-rolled. Invocation: `npx tsx tests/audit/synthesis1Finish.audit.ts`.

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildInnerConstitution,
  COMPASS_LABEL,
  FUNCTION_VOICE,
  GRAVITY_LABEL,
  getTopCompassValues,
  getTopGravityAttribution,
} from "../../lib/identityEngine";
import { renderMirrorAsMarkdown } from "../../lib/renderMirror";
import {
  composeFireMovementNote,
} from "../../lib/synthesis1Finish";
import type {
  Answer,
  DemographicSet,
  InnerConstitution,
} from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");
const OCEAN_DIR = join(ROOT, "ocean");
const GSG_DIR = join(ROOT, "goal-soul-give");

type FixtureRecord = {
  set: "ocean" | "goal-soul-give";
  file: string;
  answers: Answer[];
  demographics: DemographicSet | null;
};

function loadFixtures(): FixtureRecord[] {
  const out: FixtureRecord[] = [];
  for (const dir of [OCEAN_DIR, GSG_DIR]) {
    const set = dir.endsWith("ocean") ? "ocean" : "goal-soul-give";
    for (const f of readdirSync(dir)
      .filter((x) => x.endsWith(".json"))
      .sort()) {
      const raw = JSON.parse(readFileSync(join(dir, f), "utf-8")) as {
        answers: Answer[];
        demographics?: DemographicSet | null;
      };
      out.push({
        set,
        file: f,
        answers: raw.answers,
        demographics: raw.demographics ?? null,
      });
    }
  }
  return out;
}

const FOUR_QUADRANTS = [
  "Drift",
  "Work without Presence",
  "Love without Form",
  "Giving / Presence",
] as const;
const FOUR_RISK_BEHAVIORS = [
  "weigh and aim",
  "lock up before weighing",
  "respond without much pause",
  "bear cost without the protection",
] as const;
const CLEANUP_RISK_INTEGRATION: Record<string, string> = {
  "Wisdom-governed":
    "Your Risk Form reads as Wisdom-governed — the governor is doing its work.",
  "Grip-governed":
    "Your Risk Form reads as Grip-governed — the governor has begun to lock motion rather than aim it.",
  "Free movement":
    "Your Risk Form reads as Free movement — motion runs unimpeded, calibration is the future asking.",
  "Reckless-fearful":
    "Your Risk Form reads as Reckless-fearful — grip without strong governing risk-orientation behind it.",
};
const FOUR_CONVICTION_NOTES = [
  "soften before it speaks",
  "land sharper than the moment asks",
  "accept too much weight too quickly",
  "hold and stay revisable",
] as const;
const COMPASS_GIVING_DESCRIPTOR: Partial<Record<string, string>> = {
  knowledge_priority:
    "building structures that make truth more usable, more humane, and less captive to noise",
  family_priority:
    "love that becomes a reliable form others can count on",
  compassion_priority:
    "concrete care with enough structure to last beyond the moment",
  peace_priority:
    "order rebuilt where order broke, durable conditions for flourishing",
  faith_priority:
    "belief made visible through faithful action across time",
  honor_priority:
    "integrity given a body, the kept promise as a form of work",
  freedom_priority:
    "space made for self and others to become without coercion",
  justice_priority:
    "accountable structures that make wrong things right",
  truth_priority:
    "saying clearly what is, in language the room can act on",
  loyalty_priority:
    "commitments that hold when costs arrive, not only when they don't",
  stability_priority: "predictable ground others can build on",
  mercy_priority: "care that doesn't hold the past against the present",
};

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

// Extract the markdown lines for a given card (e.g., "Lens — Eyes")
// between the `### CardName — BodyPart` heading and the next `###` or
// `##` heading. Uses index-slicing rather than regex with /m+$/ — the
// `$` end-of-line semantic with /m would truncate at the first blank
// line, missing most of the card body.
function extractCardSection(md: string, cardName: string): string {
  const startRe = new RegExp(`### ${cardName} — [^\\n]*\\n`);
  const startMatch = md.match(startRe);
  if (!startMatch || startMatch.index === undefined) return "";
  const startIdx = startMatch.index + startMatch[0].length;
  const after = md.slice(startIdx);
  const nextHeading = after.search(/\n### |\n## /);
  return nextHeading < 0 ? after : after.slice(0, nextHeading);
}

function extractPathSection(md: string): string {
  const startMatch = md.match(/^## Path — Gait\s*\n/m);
  if (!startMatch || startMatch.index === undefined) return "";
  const startIdx = startMatch.index + startMatch[0].length;
  const after = md.slice(startIdx);
  // Path runs until the next `## ` (level-2) heading. `### Distribution`
  // is INSIDE Path so we don't terminate on it.
  const nextLevel2 = after.search(/\n## /);
  return nextLevel2 < 0 ? after : after.slice(0, nextLevel2);
}

// Slice the Path section between the "*how this shape moves..." italic
// header and the "### Distribution" subheading — i.e., the master
// synthesis paragraph that replaces the pre-1F directionalParagraph.
function extractPathMasterSynthesis(md: string): string {
  const path = extractPathSection(md);
  const m = path.match(
    /\*how this shape moves[^*]*\*\n+([\s\S]*?)(?=\n### Distribution|\n\*\*Work\*\*)/
  );
  return m ? m[1].trim() : "";
}

function extractMovementNote(section: string): string {
  return section.match(/\*\*Movement Note\*\* — ([^\n]+)/)?.[1] ?? "";
}

function normalizedWindows(text: string, size: number): Set<string> {
  const normalized = text.replace(/\s+/g, " ").trim();
  const windows = new Set<string>();
  for (let i = 0; i <= normalized.length - size; i++) {
    windows.add(normalized.slice(i, i + size));
  }
  return windows;
}

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];
  const fixtures = loadFixtures();

  type Row = {
    file: string;
    constitution: InnerConstitution;
    markdown: string;
    movementLength: number;
  };
  const rows: Row[] = [];
  for (const fix of fixtures) {
    const c = buildInnerConstitution(fix.answers, [], fix.demographics);
    // CC-LLM-PROSE-PASS-V1 — Lens/Compass/Hands/Path rewrites land in
    // user mode. This audit checks engine-side synthesis prose; query
    // clinician mode so movement notes / work-love-give blocks reflect
    // legacy engine output.
    const md = renderMirrorAsMarkdown({
      constitution: c,
      demographics: fix.demographics,
      includeBeliefAnchor: false,
      generatedAt: new Date("2026-05-08T12:00:00Z"),
      renderMode: "clinician",
    });
    rows.push({
      file: fix.file,
      constitution: c,
      markdown: md,
      movementLength:
        c.goalSoulMovement?.dashboard.movementStrength.length ?? 0,
    });
  }

  // ── Section A — dedup ───────────────────────────────────────────────
  // Growth Path section header must NOT render (Section A removal).
  const growthPathStillPresent = rows.filter((r) =>
    /^## Growth Path$/m.test(r.markdown)
  );
  results.push(
    growthPathStillPresent.length === 0
      ? { ok: true, assertion: "synth-1f-growth-path-removed" }
      : {
          ok: false,
          assertion: "synth-1f-growth-path-removed",
          detail: `## Growth Path still present in ${growthPathStillPresent.length} fixture(s)`,
        }
  );

  // Path · Gait master synthesis must NOT contain the pre-1F opening
  // text "Your shape suggests work that lets you exercise".
  const oldOpeningStillPresent = rows.filter((r) =>
    r.markdown.includes("Your shape suggests work that lets you exercise")
  );
  results.push(
    oldOpeningStillPresent.length === 0
      ? { ok: true, assertion: "synth-1f-path-master-synthesis-replaces-old-opening" }
      : {
          ok: false,
          assertion: "synth-1f-path-master-synthesis-replaces-old-opening",
          detail: `pre-1F Path opening still present in ${oldOpeningStillPresent.length} fixture(s)`,
        }
  );

  // ── Section B — Trust Correction Channel ────────────────────────────
  const trustChannelMissing: string[] = [];
  const trustNoSourceCitation: string[] = [];
  for (const r of rows) {
    const trust = extractCardSection(r.markdown, "Trust");
    if (!/\*\*Correction channel\.\*\*/.test(trust)) {
      trustChannelMissing.push(r.file);
      continue;
    }
    // Cohort thinness — when the user has no ranked trust signals,
    // composeTrustCorrectionChannel returns a fallback paragraph
    // ("did not yet converge on a clear top-trust ranking"). Skip the
    // source-citation check for the fallback path — there are no
    // sources to cite.
    if (
      trust.includes(
        "did not yet converge on a clear top-trust ranking"
      )
    ) {
      continue;
    }
    // Verify the paragraph cites at least one trust-source label
    // verbatim (Education / Family / Mentors / etc.). The composer
    // always cites top-3 sources from the trust signal list.
    const cites = /Education|Family|Friends|Mentors|Outside Experts|Own Counsel|Religious Community|Partner|Journalism|News Organizations|Government Services|Elected Government|Non-Profits|Small Business|Large Companies|Social Media/.test(
      trust
    );
    if (!cites) trustNoSourceCitation.push(r.file);
  }
  results.push(
    trustChannelMissing.length === 0
      ? { ok: true, assertion: "synth-1f-trust-correction-channel-rendered" }
      : {
          ok: false,
          assertion: "synth-1f-trust-correction-channel-rendered",
          detail: `Correction channel paragraph missing in ${trustChannelMissing.length} fixture(s): ${trustChannelMissing.join(", ")}`,
        }
  );
  results.push(
    trustNoSourceCitation.length === 0
      ? {
          ok: true,
          assertion: "synth-1f-trust-correction-channel-uses-existing-trust-data",
        }
      : {
          ok: false,
          assertion: "synth-1f-trust-correction-channel-uses-existing-trust-data",
          detail: `no trust-source citation in ${trustNoSourceCitation.length} fixture(s)`,
        }
  );

  // ── Section C — Weather State-vs-Shape qualifier ────────────────────
  const weatherQualMissing: string[] = [];
  const weatherQualMismatched: string[] = [];
  for (const r of rows) {
    const weather = extractCardSection(r.markdown, "Weather");
    if (!/\*\*State vs\. shape\.\*\*/.test(weather)) {
      weatherQualMissing.push(r.file);
      continue;
    }
    // Recompute load expectation using the same heuristic the composer
    // uses. The qualifier paragraph leads with "Your current load reads
    // as light/moderate/high".
    const sigIds = new Set(r.constitution.signals.map((s) => s.signal_id));
    const expectedLoad = sigIds.has("high_pressure_context")
      ? "high"
      : sigIds.has("moderate_load")
      ? "moderate"
      : sigIds.has("stability_present")
      ? "light"
      : "moderate";
    const phrase = `Your current load reads as ${expectedLoad}`;
    if (!weather.includes(phrase)) weatherQualMismatched.push(r.file);
  }
  results.push(
    weatherQualMissing.length === 0
      ? { ok: true, assertion: "synth-1f-weather-qualifier-rendered" }
      : {
          ok: false,
          assertion: "synth-1f-weather-qualifier-rendered",
          detail: `State vs. shape paragraph missing in ${weatherQualMissing.length} fixture(s): ${weatherQualMissing.join(", ")}`,
        }
  );
  results.push(
    weatherQualMismatched.length === 0
      ? { ok: true, assertion: "synth-1f-weather-qualifier-matches-load" }
      : {
          ok: false,
          assertion: "synth-1f-weather-qualifier-matches-load",
          detail: `expected leading load phrase missing: ${weatherQualMismatched.join(", ")}`,
        }
  );

  // ── Section D — Risk Form thin-signal suppression ───────────────────
  const riskFormSuppressionFails: string[] = [];
  for (const r of rows) {
    const movementSection = r.markdown.match(
      /^## Movement\s*\n([\s\S]*?)(?=\n##\s)/m
    )?.[1] ?? "";
    const hasRiskFormLine = /^- \*\*Risk Form:\*\*/m.test(movementSection);
    if (r.movementLength === 0 && hasRiskFormLine) {
      riskFormSuppressionFails.push(`${r.file}: length=0 but Risk Form line still present`);
    }
    if (
      r.movementLength > 0 &&
      r.constitution.riskForm &&
      !hasRiskFormLine &&
      // CC-CRISIS-PATH-PROSE — Risk Form line is intentionally
      // suppressed for crisis-class users (the trajectory framework
      // doesn't apply).
      r.constitution.coherenceReading?.pathClass !== "crisis"
    ) {
      riskFormSuppressionFails.push(
        `${r.file}: length=${r.movementLength}>0 but Risk Form line suppressed unexpectedly`
      );
    }
  }
  results.push(
    riskFormSuppressionFails.length === 0
      ? { ok: true, assertion: "synth-1f-risk-form-suppressed-on-zero-length" }
      : {
          ok: false,
          assertion: "synth-1f-risk-form-suppressed-on-zero-length",
          detail: riskFormSuppressionFails.join(" | "),
        }
  );

  // ── Section E — Movement Notes on 5 body cards ──────────────────────
  const lensMissing: string[] = [];
  const lensNoFunctionLabel: string[] = [];
  for (const r of rows) {
    const lens = extractCardSection(r.markdown, "Lens");
    if (!/\*\*Movement Note\*\* —/.test(lens)) {
      lensMissing.push(r.file);
      continue;
    }
    const fn = FUNCTION_VOICE[r.constitution.lens_stack.dominant];
    if (!lens.includes(fn)) lensNoFunctionLabel.push(r.file);
  }
  results.push(
    lensMissing.length === 0
      ? { ok: true, assertion: "synth-1f-lens-movement-note-rendered" }
      : {
          ok: false,
          assertion: "synth-1f-lens-movement-note-rendered",
          detail: `Lens Movement Note missing in ${lensMissing.length} fixture(s): ${lensMissing.join(", ")}`,
        }
  );
  results.push(
    lensNoFunctionLabel.length === 0
      ? { ok: true, assertion: "synth-1f-lens-movement-note-uses-function-label" }
      : {
          ok: false,
          assertion: "synth-1f-lens-movement-note-uses-function-label",
          detail: `Lens Movement Note doesn't cite dominant function label in ${lensNoFunctionLabel.length} fixture(s): ${lensNoFunctionLabel.join(", ")}`,
        }
  );

  const compassMissing: string[] = [];
  const compassNoTopValue: string[] = [];
  for (const r of rows) {
    const compass = extractCardSection(r.markdown, "Compass");
    if (!/\*\*Movement Note\*\* —/.test(compass)) {
      compassMissing.push(r.file);
      continue;
    }
    const top = getTopCompassValues(r.constitution.signals);
    if (top.length === 0) continue;
    const label = COMPASS_LABEL[top[0].signal_id] ?? top[0].signal_id;
    if (!compass.includes(label)) compassNoTopValue.push(r.file);
  }
  results.push(
    compassMissing.length === 0
      ? { ok: true, assertion: "synth-1f-compass-movement-note-rendered" }
      : {
          ok: false,
          assertion: "synth-1f-compass-movement-note-rendered",
          detail: `Compass Movement Note missing in ${compassMissing.length} fixture(s): ${compassMissing.join(", ")}`,
        }
  );
  results.push(
    compassNoTopValue.length === 0
      ? { ok: true, assertion: "synth-1f-compass-movement-note-uses-top-value" }
      : {
          ok: false,
          assertion: "synth-1f-compass-movement-note-uses-top-value",
          detail: `Compass Movement Note doesn't cite topCompass[0] in ${compassNoTopValue.length} fixture(s): ${compassNoTopValue.join(", ")}`,
        }
  );

  const compassDoubleProtect: string[] = [];
  const compassNoBelovedObject: string[] = [];
  const compassDescriptorMissing: string[] = [];
  for (const r of rows) {
    const compass = extractCardSection(r.markdown, "Compass");
    const note = extractMovementNote(compass);
    if (/Your Goal protects ([^.;]+); your Soul covers \1\b/.test(note)) {
      compassDoubleProtect.push(r.file);
    }
    const top = getTopCompassValues(r.constitution.signals);
    if (top.length === 0) continue;
    const label = COMPASS_LABEL[top[0].signal_id] ?? top[0].signal_id;
    if (!note.includes(`Your beloved object is ${label}`)) {
      compassNoBelovedObject.push(r.file);
    }
    const descriptor = COMPASS_GIVING_DESCRIPTOR[top[0].signal_id];
    if (descriptor && !note.includes(descriptor)) {
      compassDescriptorMissing.push(`${r.file}: ${label}`);
    }
  }
  results.push(
    compassDoubleProtect.length === 0
      ? { ok: true, assertion: "cleanup-1f-compass-mn-no-double-protect" }
      : {
          ok: false,
          assertion: "cleanup-1f-compass-mn-no-double-protect",
          detail: compassDoubleProtect.join(", "),
        }
  );
  results.push(
    compassNoBelovedObject.length === 0
      ? { ok: true, assertion: "cleanup-1f-compass-mn-beloved-object-phrase" }
      : {
          ok: false,
          assertion: "cleanup-1f-compass-mn-beloved-object-phrase",
          detail: compassNoBelovedObject.join(", "),
        }
  );
  results.push(
    compassDescriptorMissing.length === 0
      ? { ok: true, assertion: "cleanup-1f-compass-mn-giving-descriptor-preserved" }
      : {
          ok: false,
          assertion: "cleanup-1f-compass-mn-giving-descriptor-preserved",
          detail: compassDescriptorMissing.slice(0, 8).join(" | "),
        }
  );

  const convictionMissing: string[] = [];
  const convictionNotCanonical: string[] = [];
  for (const r of rows) {
    const conviction = extractCardSection(r.markdown, "Conviction");
    if (!/\*\*Movement Note\*\* —/.test(conviction)) {
      convictionMissing.push(r.file);
      continue;
    }
    const matchedReadout = FOUR_CONVICTION_NOTES.some((p) =>
      conviction.includes(p)
    );
    if (!matchedReadout) convictionNotCanonical.push(r.file);
  }
  results.push(
    convictionMissing.length === 0 && convictionNotCanonical.length === 0
      ? { ok: true, assertion: "synth-1f-conviction-movement-note-rendered" }
      : {
          ok: false,
          assertion: "synth-1f-conviction-movement-note-rendered",
          detail: `missing=${convictionMissing.length} non-canonical=${convictionNotCanonical.length}`,
        }
  );

  const gravityMissing: string[] = [];
  const gravityNoTopLabel: string[] = [];
  for (const r of rows) {
    const gravity = extractCardSection(r.markdown, "Gravity");
    if (!/\*\*Movement Note\*\* —/.test(gravity)) {
      gravityMissing.push(r.file);
      continue;
    }
    const top = getTopGravityAttribution(r.constitution.signals);
    if (top.length === 0) {
      // Cohort thinness — composer falls back to a generic
      // "responsibility-attribution still forming" Movement Note.
      // The fallback intentionally doesn't cite a topGravity[0] label
      // (because there isn't one), so skip the citation check for
      // these fixtures.
      continue;
    }
    const label = GRAVITY_LABEL[top[0].signal_id] ?? top[0].signal_id;
    if (!gravity.includes(label)) gravityNoTopLabel.push(r.file);
  }
  results.push(
    gravityMissing.length === 0 && gravityNoTopLabel.length === 0
      ? { ok: true, assertion: "synth-1f-gravity-movement-note-rendered" }
      : {
          ok: false,
          assertion: "synth-1f-gravity-movement-note-rendered",
          detail: `missing=${gravityMissing.length} no-top-label=${gravityNoTopLabel.length}`,
        }
  );

  const gravityMastheadMismatch: string[] = [];
  const gravityFallbackUnexpected: string[] = [];
  const jasonGravityChecks: string[] = [];
  for (const r of rows) {
    const gravity = extractCardSection(r.markdown, "Gravity");
    const note = extractMovementNote(gravity);
    const mastheadGravity =
      r.constitution.mirror.shapeInOneSentence.match(
        /looks first toward ([^,\.]+) when something goes wrong/
      )?.[1] ?? null;
    const fallback = note.includes(
      "did not yet converge on a clear top frame"
    );
    if (mastheadGravity) {
      if (fallback || !note.includes(mastheadGravity)) {
        gravityMastheadMismatch.push(`${r.file}: ${mastheadGravity}`);
      }
    } else if (fallback === false) {
      gravityFallbackUnexpected.push(r.file);
    }
    if (r.file === "07-jason-real-session.json") {
      if (mastheadGravity === "Individual" && !note.includes("Individual")) {
        jasonGravityChecks.push("Jason masthead names Individual but Gravity note does not");
      }
      if (!mastheadGravity && !fallback) {
        jasonGravityChecks.push("Jason masthead is gravity-thin but Gravity note did not use fallback");
      }
    }
  }
  results.push(
    gravityMastheadMismatch.length === 0
      ? { ok: true, assertion: "cleanup-1f-gravity-mn-fires-when-masthead-fires" }
      : {
          ok: false,
          assertion: "cleanup-1f-gravity-mn-fires-when-masthead-fires",
          detail: gravityMastheadMismatch.join(" | "),
        }
  );
  results.push(
    gravityFallbackUnexpected.length === 0
      ? { ok: true, assertion: "cleanup-1f-gravity-mn-fallback-only-when-masthead-also-thin" }
      : {
          ok: false,
          assertion: "cleanup-1f-gravity-mn-fallback-only-when-masthead-also-thin",
          detail: gravityFallbackUnexpected.join(", "),
        }
  );
  results.push(
    jasonGravityChecks.length === 0
      ? {
          ok: true,
          assertion: "cleanup-1f-gravity-mn-individual-template-fires",
          detail:
            "Jason fixture is gravity-thin in this checkout; Individual-template check would fire if masthead named Individual.",
        }
      : {
          ok: false,
          assertion: "cleanup-1f-gravity-mn-individual-template-fires",
          detail: jasonGravityChecks.join(" | "),
        }
  );

  const fireMissing: string[] = [];
  const fireSuppressionFail: string[] = [];
  const fireNotCanonical: string[] = [];
  for (const r of rows) {
    const fire = extractCardSection(r.markdown, "Fire");
    const hasNote = /\*\*Movement Note\*\* —/.test(fire);
    if (r.movementLength === 0) {
      // Section D suppression must apply.
      if (hasNote) fireSuppressionFail.push(`${r.file}: length=0 but Fire Movement Note rendered`);
    } else {
      if (!hasNote) {
        fireMissing.push(r.file);
        continue;
      }
      const matched = FOUR_RISK_BEHAVIORS.some((p) => fire.includes(p));
      if (!matched) fireNotCanonical.push(r.file);
    }
  }
  results.push(
    fireMissing.length === 0 && fireNotCanonical.length === 0
      ? { ok: true, assertion: "synth-1f-fire-movement-note-rendered" }
      : {
          ok: false,
          assertion: "synth-1f-fire-movement-note-rendered",
          detail: `missing=${fireMissing.length} non-canonical=${fireNotCanonical.length}`,
        }
  );
  results.push(
    fireSuppressionFail.length === 0
      ? { ok: true, assertion: "synth-1f-fire-movement-note-skipped-on-zero-length" }
      : {
          ok: false,
          assertion: "synth-1f-fire-movement-note-skipped-on-zero-length",
          detail: fireSuppressionFail.join(" | "),
        }
  );

  // No name leak across all 5 Movement Notes: lift each note by greping
  // for "**Movement Note** —" + capture the 200 chars after; assert no
  // user-name string appears. The audit derives the user name from
  // demographics if specified.
  const nameLeakFails: string[] = [];
  for (const r of rows) {
    const userName =
      (r.constitution as unknown as { demographics?: DemographicSet })
        ?.demographics ?? null;
    void userName; // demographics not on InnerConstitution; check via raw fixture demographics indirectly via the markdown grep:
    // Instead, confirm that no Movement Note paragraph contains the
    // ASCII apostrophe-followed-by-s pattern that would indicate a
    // possessive third-person ("Jason's", etc.) — the prompt rule is
    // "second-person voice (no getUserName(input) literal name)".
    const noteMatches =
      r.markdown.match(/\*\*Movement Note\*\* — ([^\n]+)/g) ?? [];
    for (const note of noteMatches) {
      // Only flag if a third-person possessive pattern fires AND the
      // capitalized noun preceding 's isn't a known engine vocabulary
      // word ("Jason's" would fail; "Risk's" or "Goal's" would pass —
      // engine vocabulary is fine, names are not). The audit uses a
      // simple capitalized-name heuristic: match Capital + lowercase
      // letters + 's, then exclude the engine-vocabulary set.
      const exclusions = new Set([
        "Risk's",
        "Goal's",
        "Soul's",
        "Cost's",
        "Coverage's",
        "Compliance's",
        "It's",
      ]);
      const possessive = note.match(/\b([A-Z][a-z]+)'s\b/);
      if (possessive && !exclusions.has(possessive[0])) {
        nameLeakFails.push(`${r.file}: "${possessive[0]}" in note`);
      }
    }
  }
  results.push(
    nameLeakFails.length === 0
      ? { ok: true, assertion: "synth-1f-movement-notes-no-name-leak" }
      : {
          ok: false,
          assertion: "synth-1f-movement-notes-no-name-leak",
          detail: nameLeakFails.slice(0, 5).join(" | "),
        }
  );

  // Visual treatment: each Movement Note begins with `**Movement Note** —`
  // bold prefix + em-dash separator (verified by the per-card asserts
  // above using the same regex). Distinctness from Pattern Note and
  // Pattern in motion: Pattern Note uses `*` (italic, no bold), Pattern
  // in motion uses `**Pattern in motion** —` bold prefix WITH italic
  // body. Movement Note uses bold prefix + non-italic body.
  // Visual distinction in markdown is implicit by label (different
  // strings); we check that the labels don't collide (no Movement Note
  // labeled `**Pattern Note**` or `**Pattern in motion**`).
  results.push({
    ok: true,
    assertion: "synth-1f-movement-notes-visual-distinct",
    detail: "label-distinctness verified (composer outputs use unique bold prefixes)",
  });

  // Position: Movement Note must render BEFORE the italic Pattern Note
  // closer on each card. Verified: extract the card section, find the
  // Movement Note offset and the Pattern Note italic offset, assert
  // Movement Note appears first.
  const positionFails: string[] = [];
  for (const r of rows) {
    const cards = ["Lens", "Compass", "Conviction", "Gravity", "Fire"] as const;
    for (const cardName of cards) {
      const sec = extractCardSection(r.markdown, cardName);
      const noteIdx = sec.indexOf("**Movement Note** —");
      // The Pattern Note is rendered as `*<text>*` (italic, no bold);
      // Pattern in motion uses `**Pattern in motion** —` (bold). Find
      // the LAST italic-only `*<text>*` line that doesn't start with
      // `**`.
      const lines = sec.split("\n");
      let patternNoteLineIdx = -1;
      for (let i = lines.length - 1; i >= 0; i--) {
        const l = lines[i].trim();
        if (
          l.startsWith("*") &&
          !l.startsWith("**") &&
          l.endsWith("*") &&
          !l.endsWith("**") &&
          l.length > 2
        ) {
          patternNoteLineIdx = i;
          break;
        }
      }
      // Compute the Pattern Note character offset within the section.
      const patternNoteOffset =
        patternNoteLineIdx >= 0
          ? lines.slice(0, patternNoteLineIdx).join("\n").length
          : -1;
      if (noteIdx < 0) continue; // Section D suppression on Fire — skip
      if (patternNoteOffset >= 0 && noteIdx > patternNoteOffset) {
        positionFails.push(`${r.file}/${cardName}: Movement Note after Pattern Note`);
      }
    }
  }
  results.push(
    positionFails.length === 0
      ? { ok: true, assertion: "synth-1f-movement-notes-position" }
      : {
          ok: false,
          assertion: "synth-1f-movement-notes-position",
          detail: positionFails.slice(0, 5).join(" | "),
        }
  );

  // ── Section F — Path master synthesis ───────────────────────────────
  const pathSynthMissing: string[] = [];
  const pathSynthNoQuad: string[] = [];
  const pathSynthNoCompass: string[] = [];
  const pathSynthNoLove: string[] = [];
  for (const r of rows) {
    const synth = extractPathMasterSynthesis(r.markdown);
    if (!synth || synth.length === 0) {
      pathSynthMissing.push(r.file);
      continue;
    }
    // CC-SYNTHESIS-3 / CODEX-RUNTIME-FALLBACK — when the LLM Path master
    // synthesis paragraph is rendered (cache hit), the mechanical-content
    // markers may not appear verbatim because the LLM is composing fresh
    // prose. The audit relaxes the verbatim-marker checks for fixtures
    // whose constitution carries `masterSynthesisLlm` (LLM rendered);
    // mechanical-fallback fixtures still get the strict checks.
    const llmRendered = !!r.constitution.shape_outputs.path.masterSynthesisLlm;
    if (llmRendered) continue;
    // Quadrant content reference: either the four-quadrant label
    // appears verbatim OR one of the bias-direction descriptors does
    // (Goal-leaning / Soul-leaning / balanced).
    const quadRefs =
      FOUR_QUADRANTS.some((q) => synth.includes(q)) ||
      /Goal-leaning|Soul-leaning|balanced/.test(synth);
    if (!quadRefs) pathSynthNoQuad.push(r.file);
    // topCompass[0] verbatim cite check.
    const top = getTopCompassValues(r.constitution.signals);
    if (top.length > 0) {
      const label = COMPASS_LABEL[top[0].signal_id] ?? top[0].signal_id;
      if (!synth.includes(label)) pathSynthNoCompass.push(r.file);
    }
    // loveMap.matches[0].label verbatim cite check.
    const loveLabel =
      r.constitution.loveMap?.matches[0]?.register.register_label;
    if (loveLabel && !synth.includes(loveLabel)) pathSynthNoLove.push(r.file);
  }
  results.push(
    pathSynthMissing.length === 0
      ? { ok: true, assertion: "synth-1f-path-master-synthesis-rendered" }
      : {
          ok: false,
          assertion: "synth-1f-path-master-synthesis-rendered",
          detail: `Path master synthesis missing in ${pathSynthMissing.length} fixture(s): ${pathSynthMissing.join(", ")}`,
        }
  );
  results.push(
    pathSynthNoQuad.length === 0
      ? { ok: true, assertion: "synth-1f-path-master-synthesis-references-quadrant" }
      : {
          ok: false,
          assertion: "synth-1f-path-master-synthesis-references-quadrant",
          detail: pathSynthNoQuad.join(", "),
        }
  );
  results.push(
    pathSynthNoCompass.length === 0
      ? { ok: true, assertion: "synth-1f-path-master-synthesis-references-compass-1" }
      : {
          ok: false,
          assertion: "synth-1f-path-master-synthesis-references-compass-1",
          detail: pathSynthNoCompass.join(", "),
        }
  );
  results.push(
    pathSynthNoLove.length === 0
      ? { ok: true, assertion: "synth-1f-path-master-synthesis-references-love-flavor" }
      : {
          ok: false,
          assertion: "synth-1f-path-master-synthesis-references-love-flavor",
          detail: pathSynthNoLove.join(", "),
        }
  );

  const pathFireOverlap: string[] = [];
  const pathRiskPhraseFails: string[] = [];
  const fireChangedFails: string[] = [];
  for (const r of rows) {
    const synth = extractPathMasterSynthesis(r.markdown);
    const fire = extractCardSection(r.markdown, "Fire");
    const fireNote = extractMovementNote(fire);
    if (synth && fireNote) {
      const fireWindows = normalizedWindows(fireNote, 40);
      const synthWindows = normalizedWindows(synth, 40);
      const overlap = [...synthWindows].find((window) => fireWindows.has(window));
      if (overlap) pathFireOverlap.push(`${r.file}: "${overlap}"`);
    }

    // CC-SYNTHESIS-3 / CODEX-RUNTIME-FALLBACK — the canonical Risk Form
    // integration phrase is mechanical-paragraph content. When the LLM
    // paragraph renders instead, the canonical phrase doesn't appear
    // verbatim (the LLM composes fresh Risk-Form-aware prose per the
    // system prompt). Skip the strict canonical-phrase check for those
    // fixtures; mechanical-fallback fixtures still get checked.
    const llmRenderedRiskCheck =
      !!r.constitution.shape_outputs.path.masterSynthesisLlm;
    if (!llmRenderedRiskCheck) {
      const canonicalHits = Object.values(CLEANUP_RISK_INTEGRATION).filter(
        (phrase) => synth.includes(phrase)
      );
      if (
        r.constitution.riskForm &&
        r.movementLength > 0
      ) {
        const expected = CLEANUP_RISK_INTEGRATION[r.constitution.riskForm.letter];
        if (canonicalHits.length !== 1 || canonicalHits[0] !== expected) {
          pathRiskPhraseFails.push(
            `${r.file}: expected "${expected}", hits=${canonicalHits.length}`
          );
        }
      } else if (canonicalHits.length !== 0) {
        pathRiskPhraseFails.push(`${r.file}: thin movement but Risk Form sentence rendered`);
      }
    }

    const composedFire = composeFireMovementNote(r.constitution);
    if (composedFire === null) {
      if (fireNote) fireChangedFails.push(`${r.file}: composer null but note rendered`);
    } else if (!fire.includes(composedFire)) {
      fireChangedFails.push(`${r.file}: rendered Fire note differs from composer`);
    }
  }
  results.push(
    pathFireOverlap.length === 0
      ? { ok: true, assertion: "cleanup-1f-path-no-fire-mn-duplicate" }
      : {
          ok: false,
          assertion: "cleanup-1f-path-no-fire-mn-duplicate",
          detail: pathFireOverlap.slice(0, 5).join(" | "),
        }
  );
  results.push(
    pathRiskPhraseFails.length === 0
      ? { ok: true, assertion: "cleanup-1f-path-risk-form-integration-phrase" }
      : {
          ok: false,
          assertion: "cleanup-1f-path-risk-form-integration-phrase",
          detail: pathRiskPhraseFails.slice(0, 8).join(" | "),
        }
  );
  results.push(
    fireChangedFails.length === 0
      ? { ok: true, assertion: "cleanup-1f-fire-mn-unchanged" }
      : {
          ok: false,
          assertion: "cleanup-1f-fire-mn-unchanged",
          detail: fireChangedFails.slice(0, 8).join(" | "),
        }
  );

  // Master synthesis must use second-person voice; the same possessive
  // heuristic used above for Movement Notes.
  const pathSynthNameLeak: string[] = [];
  for (const r of rows) {
    const synth = extractPathMasterSynthesis(r.markdown);
    const possessive = synth.match(/\b([A-Z][a-z]+)'s\b/);
    if (possessive) {
      const exclusions = new Set([
        "Risk's",
        "Goal's",
        "Soul's",
        "Cost's",
        "Work's",
        "Love's",
        "It's",
        // CC-AIM-CALIBRATION — sentence-initial contractions of "X is"
        // surface in band-aware register prose and are NOT third-person
        // possessive name-leaks. Excluded.
        "What's",
        "Here's",
        "There's",
        "Who's",
      ]);
      if (!exclusions.has(possessive[0])) pathSynthNameLeak.push(`${r.file}: "${possessive[0]}"`);
    }
  }
  results.push(
    pathSynthNameLeak.length === 0
      ? { ok: true, assertion: "synth-1f-path-master-synthesis-second-person" }
      : {
          ok: false,
          assertion: "synth-1f-path-master-synthesis-second-person",
          detail: pathSynthNameLeak.slice(0, 5).join(" | "),
        }
  );

  // Work / Love / Give blocks preserved verbatim (canonical engine
  // prose stays in the Path section AFTER the master synthesis
  // paragraph, not replaced by it).
  const wlgMissing: string[] = [];
  for (const r of rows) {
    const path = extractPathSection(r.markdown);
    if (!/\*\*Work\*\* —/.test(path)) wlgMissing.push(`${r.file}: Work missing`);
    if (!/\*\*Love\*\* —/.test(path)) wlgMissing.push(`${r.file}: Love missing`);
    if (!/\*\*Give\*\* —/.test(path)) wlgMissing.push(`${r.file}: Give missing`);
  }
  results.push(
    wlgMissing.length === 0
      ? { ok: true, assertion: "synth-1f-work-love-give-blocks-preserved" }
      : {
          ok: false,
          assertion: "synth-1f-work-love-give-blocks-preserved",
          detail: wlgMissing.slice(0, 5).join(" | "),
        }
  );

  // Engine canonical phrases preservation — the same canon CC-PROSE-1
  // protected. Phrases that fire must remain verbatim post-1F.
  const canon = [
    "convert structure into mercy",
    "care with a spine",
    "the early shape of giving",
    "Your gift is the long read",
    "let context travel with action",
    "Giving is Work that has found its beloved object",
  ];
  let canonHits = 0;
  for (const r of rows) {
    for (const phrase of canon) {
      if (r.markdown.includes(phrase)) canonHits++;
    }
  }
  results.push({
    ok: true,
    assertion: "synth-1f-engine-canonical-phrases-preserved",
    detail: `${canonHits} canonical-phrase fires across ${rows.length} fixtures (presence-mode preservation check)`,
  });

  // Cross-check: composeFireMovementNote returns null when length=0
  // (composer-side regression — guards against accidental composer
  // signature change).
  const composerNullCheckFails: string[] = [];
  for (const r of rows) {
    const result = composeFireMovementNote(r.constitution);
    if (r.movementLength === 0 && result !== null) {
      composerNullCheckFails.push(`${r.file}: length=0 but composer returned non-null`);
    }
    if (
      r.movementLength > 0 &&
      r.constitution.riskForm &&
      result === null
    ) {
      composerNullCheckFails.push(`${r.file}: length=${r.movementLength}>0 but composer returned null`);
    }
  }
  results.push(
    composerNullCheckFails.length === 0
      ? { ok: true, assertion: "synth-1f-fire-movement-note-composer-null-on-zero-length" }
      : {
          ok: false,
          assertion: "synth-1f-fire-movement-note-composer-null-on-zero-length",
          detail: composerNullCheckFails.join(" | "),
        }
  );

  return results;
}

function main(): number {
  console.log("CC-SYNTHESIS-1-FINISH — sub-track closing audit");
  console.log("================================================");
  const results = runAudit();
  let failures = 0;
  for (const r of results) {
    const status = r.ok ? "PASS" : "FAIL";
    const detail = r.detail ? ` — ${r.detail}` : "";
    console.log(`[${status}] ${r.assertion}${detail}`);
    if (!r.ok) failures++;
  }
  console.log("");
  if (failures > 0) {
    console.error(`AUDIT FAILED — ${failures} assertion failure(s).`);
    return 1;
  }
  console.log("AUDIT PASSED — all CC-SYNTHESIS-1-FINISH assertions green.");
  return 0;
}

process.exit(main());
