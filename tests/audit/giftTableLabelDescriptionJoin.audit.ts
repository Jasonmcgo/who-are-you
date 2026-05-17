// CC-092-GIFT-TABLE-LABEL-DESCRIPTION-JOIN — label/description coherence
// audit.
//
// Five assertions per the CC's Item 5:
//   1. Cohort fixtures' Gifts tables: label + description come from the
//      same archetype-positional source for every named archetype.
//   2. Daniel-shape (si-tradition-steward) regression: row 0 = "stewardship"
//      label paired with the "preserve what matters" description, and
//      row 1 ("faithful responsibility") + row 2 ("operational trust")
//      no longer carry the Integrity / Advocacy descriptions.
//   3. Cindy-shape (fi-quiet-resister) regression: "present-tense care"
//      no longer paired with Builder's "turn ideas into working systems"
//      description.
//   4. Jason-shape (paralysis-shame) regression anchor: Gifts table
//      unchanged — labels still match the Te/Ti-coded
//      `GIFT_NOUN_PHRASE` entries.
//   5. Source-level: the overlay site references both
//      `GIFT_LABELS_BY_ARCHETYPE` AND `GIFT_DESCRIPTIONS_BY_ARCHETYPE`
//      (so label and description share a single archetype-positional
//      source).
//
// Hand-rolled. Invocation:
//   `npx tsx tests/audit/giftTableLabelDescriptionJoin.audit.ts`
//   (or `npm run audit:gift-table-label-description-join`).

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import type { Answer, DemographicSet, InnerConstitution } from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, "..", "..");
const COHORT_DIR = join(REPO_ROOT, "tests", "fixtures", "cohort");

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

function readFile(path: string): string | null {
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf-8");
}

function loadFixture(file: string): {
  answers: Answer[];
  demographics: DemographicSet | null;
} {
  const raw = JSON.parse(readFileSync(join(COHORT_DIR, file), "utf-8")) as {
    answers: Answer[];
    demographics?: DemographicSet | null;
  };
  return {
    answers: raw.answers,
    demographics: raw.demographics ?? null,
  };
}

function build(file: string): InnerConstitution {
  const { answers, demographics } = loadFixture(file);
  return buildInnerConstitution(answers, [], demographics);
}

// Archetype-positional descriptions — load-bearing constants the audit
// re-asserts the overlay against. Order must match the table inside
// identityEngine.ts. Strings copied verbatim so a future edit to the
// table fails the audit (forcing the audit to be updated as well).
const ARCHETYPE_DESCRIPTIONS: Record<
  "cindyType" | "danielType",
  ReadonlyArray<string>
> = {
  cindyType: [
    "you tend to read the moment as it is and to tend to what the situation in front of you is asking for, rather than what the plan said it would be",
    "you tend to stay with the people you've claimed, holding the through-line of who-belongs-to-whom even when it costs",
    "you tend to bring steadiness to a room through presence rather than performance — the kind of being-there that others can lean against",
  ],
  danielType: [
    "you tend to preserve what matters across time, especially when others are looking past it",
    "you tend to carry what's been entrusted to you with continuity, treating responsibility as a thing kept over time rather than a load to discharge",
    "you tend to make institutions work through the small kept commitments — standards, precedent, and the trust that compounds when what was promised is actually done",
  ],
};

const ARCHETYPE_LABELS: Record<
  "cindyType" | "danielType",
  ReadonlyArray<string>
> = {
  cindyType: ["present-tense care", "protective loyalty", "embodied steadiness"],
  danielType: ["stewardship", "faithful responsibility", "operational trust"],
};

// Descriptions the pre-CC bug surfaced — the audit checks these no
// longer appear paired with the wrong archetype label.
const BUG_PAIRINGS = {
  builderDesc:
    "you tend to turn ideas into working systems and to push past friction toward a result",
  integrityDesc:
    "you tend to refuse compromises that would betray your own sense of what's right",
  advocacyDesc:
    "you tend to notice what's owed and to protect those who can't protect themselves",
  precisionDesc:
    "you tend to clarify what's actually being claimed before the conversation moves",
};

function leadingDescription(paragraph: string): string {
  // Mirrors swapLeadingDescription's split rule.
  const idx = paragraph.indexOf(". ");
  if (idx < 0) return paragraph.trim().toLowerCase();
  return paragraph.slice(0, idx).trim().toLowerCase();
}

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];

  // ── 1: cohort sweep — every named-archetype fixture has aligned rows ─
  const cohortFiles = readdirSync(COHORT_DIR).filter((f) => f.endsWith(".json"));
  type Misalignment = { file: string; row: number; reason: string };
  const misalignments: Misalignment[] = [];
  let namedArchetypeChecks = 0;
  for (const file of cohortFiles) {
    let c: InnerConstitution;
    try {
      c = build(file);
    } catch (e) {
      misalignments.push({
        file,
        row: -1,
        reason: `build threw: ${e instanceof Error ? e.message : String(e)}`,
      });
      continue;
    }
    const archetype = c.profileArchetype?.primary;
    if (archetype !== "cindyType" && archetype !== "danielType") continue;
    namedArchetypeChecks++;
    const gifts = c.cross_card.topGifts;
    for (let i = 0; i < ARCHETYPE_LABELS[archetype].length; i++) {
      const expectedLabel = ARCHETYPE_LABELS[archetype][i];
      const expectedDesc = ARCHETYPE_DESCRIPTIONS[archetype][i];
      const row = gifts[i];
      if (!row) {
        misalignments.push({
          file,
          row: i,
          reason: `gift row ${i} missing`,
        });
        continue;
      }
      if (row.label !== expectedLabel) {
        misalignments.push({
          file,
          row: i,
          reason: `label "${row.label}" !== expected "${expectedLabel}"`,
        });
      }
      const leading = leadingDescription(row.paragraph);
      const expectedLeading = expectedDesc.toLowerCase().trim();
      if (leading !== expectedLeading) {
        misalignments.push({
          file,
          row: i,
          reason: `leading description does not match archetype-positional source`,
        });
      }
    }
  }
  results.push(
    misalignments.length === 0 && namedArchetypeChecks > 0
      ? {
          ok: true,
          assertion: "cohort-named-archetypes-label-description-aligned",
          detail: `${namedArchetypeChecks} named-archetype cohort fixture(s) — every Gifts-table row has label + description from same archetype-positional source`,
        }
      : {
          ok: false,
          assertion: "cohort-named-archetypes-label-description-aligned",
          detail:
            namedArchetypeChecks === 0
              ? `no cohort fixture resolved to cindyType or danielType — overlay path is untested`
              : misalignments
                  .map((m) => `${m.file} row=${m.row}: ${m.reason}`)
                  .join("; "),
        }
  );

  // ── 2: Daniel-shape regression ─────────────────────────────────
  let danielErr: string | null = null;
  let danielGifts: InnerConstitution["cross_card"]["topGifts"] = [];
  try {
    const c = build("si-tradition-steward.json");
    danielGifts = c.cross_card.topGifts;
  } catch (e) {
    danielErr = e instanceof Error ? e.message : String(e);
  }
  const daniel0Ok =
    danielGifts[0]?.label === "stewardship" &&
    leadingDescription(danielGifts[0].paragraph) ===
      ARCHETYPE_DESCRIPTIONS.danielType[0].toLowerCase().trim();
  const daniel1NoIntegrityBug =
    danielGifts[1]?.label === "faithful responsibility" &&
    leadingDescription(danielGifts[1].paragraph) !==
      BUG_PAIRINGS.integrityDesc.toLowerCase().trim();
  const daniel2NoAdvocacyBug =
    danielGifts[2]?.label === "operational trust" &&
    leadingDescription(danielGifts[2].paragraph) !==
      BUG_PAIRINGS.advocacyDesc.toLowerCase().trim();
  results.push(
    danielErr === null && daniel0Ok && daniel1NoIntegrityBug && daniel2NoAdvocacyBug
      ? {
          ok: true,
          assertion: "daniel-fixture-stewardship-faithful-operational-aligned",
          detail: `si-tradition-steward.json: row 0 stewardship → "preserve what matters"; row 1 faithful responsibility no longer paired with Integrity description; row 2 operational trust no longer paired with Advocacy description`,
        }
      : {
          ok: false,
          assertion: "daniel-fixture-stewardship-faithful-operational-aligned",
          detail:
            danielErr !== null
              ? `build threw: ${danielErr}`
              : !daniel0Ok
                ? `row 0 stewardship/description mismatch`
                : !daniel1NoIntegrityBug
                  ? `row 1 still carries Integrity description bug`
                  : `row 2 still carries Advocacy description bug`,
        }
  );

  // ── 3: Cindy-shape regression ─────────────────────────────────
  let cindyErr: string | null = null;
  let cindyGifts: InnerConstitution["cross_card"]["topGifts"] = [];
  try {
    const c = build("fi-quiet-resister.json");
    cindyGifts = c.cross_card.topGifts;
  } catch (e) {
    cindyErr = e instanceof Error ? e.message : String(e);
  }
  // CC names the bug: "present-tense care" paired with Builder's description.
  const cindy0HasNoBuilderBug =
    cindyGifts[0]?.label === "present-tense care" &&
    leadingDescription(cindyGifts[0].paragraph) !==
      BUG_PAIRINGS.builderDesc.toLowerCase().trim();
  const cindy0HasArchetypeDesc =
    cindyGifts[0] &&
    leadingDescription(cindyGifts[0].paragraph) ===
      ARCHETYPE_DESCRIPTIONS.cindyType[0].toLowerCase().trim();
  // The CC also names "protective loyalty" paired with Precision's
  // description, and "embodied steadiness" paired with Advocacy's
  // description, as bug rows. Verify both are gone.
  const cindy1HasNoPrecisionBug =
    cindyGifts[1] &&
    leadingDescription(cindyGifts[1].paragraph) !==
      BUG_PAIRINGS.precisionDesc.toLowerCase().trim();
  const cindy2HasNoAdvocacyBug =
    cindyGifts[2] &&
    leadingDescription(cindyGifts[2].paragraph) !==
      BUG_PAIRINGS.advocacyDesc.toLowerCase().trim();
  results.push(
    cindyErr === null &&
      cindy0HasNoBuilderBug &&
      cindy0HasArchetypeDesc &&
      cindy1HasNoPrecisionBug &&
      cindy2HasNoAdvocacyBug
      ? {
          ok: true,
          assertion: "cindy-fixture-no-builder-precision-advocacy-bugs",
          detail: `fi-quiet-resister.json: present-tense care no longer paired with Builder; protective loyalty no longer paired with Precision; embodied steadiness no longer paired with Advocacy`,
        }
      : {
          ok: false,
          assertion: "cindy-fixture-no-builder-precision-advocacy-bugs",
          detail:
            cindyErr !== null
              ? `build threw: ${cindyErr}`
              : !cindy0HasArchetypeDesc
                ? `row 0 description doesn't match archetype-positional source`
                : !cindy0HasNoBuilderBug
                  ? `row 0 still carries Builder description bug`
                  : !cindy1HasNoPrecisionBug
                    ? `row 1 still carries Precision description bug`
                    : `row 2 still carries Advocacy description bug`,
        }
  );

  // ── 4: Jason-shape regression anchor (unchanged) ─────────────
  let jasonErr: string | null = null;
  let jasonGifts: InnerConstitution["cross_card"]["topGifts"] = [];
  let jasonArchetype = "";
  try {
    const c = build("paralysis-shame-without-project.json");
    jasonGifts = c.cross_card.topGifts;
    jasonArchetype = c.profileArchetype?.primary ?? "";
  } catch (e) {
    jasonErr = e instanceof Error ? e.message : String(e);
  }
  // jasonType + unmappedType do NOT enter the overlay branch, so the
  // labels remain the engine's `capitalize(GIFT_NOUN_PHRASE[cat]) + "."`
  // form — i.e., they begin with "A " or "An " and end with ".". We
  // assert that property here as the "no archetype overlay applied"
  // anchor. (Don't pin to specific GiftCategory values — those depend
  // on the picker's per-card scoring which other CCs may shift.)
  const jasonRowsUntouched =
    jasonGifts.length >= 3 &&
    jasonGifts
      .slice(0, 3)
      .every(
        (g) =>
          (/^(A|An) [a-z'-]/.test(g.label) || /gift$/.test(g.label.replace(/\.$/, ""))) &&
          g.label.endsWith(".") &&
          g.paragraph.length > 0
      );
  // Also: Jason's archetype should not be cindyType / danielType
  // (otherwise overlay would have rewritten the labels).
  const jasonArchetypeOk =
    jasonArchetype !== "cindyType" && jasonArchetype !== "danielType";
  results.push(
    jasonErr === null && jasonRowsUntouched && jasonArchetypeOk
      ? {
          ok: true,
          assertion: "jason-fixture-regression-anchor-unchanged",
          detail: `paralysis-shame-without-project.json: archetype=${jasonArchetype}; gifts table labels are still engine GIFT_NOUN_PHRASE form (begin with "A "/"An " or end with " gift.")`,
        }
      : {
          ok: false,
          assertion: "jason-fixture-regression-anchor-unchanged",
          detail:
            jasonErr !== null
              ? `build threw: ${jasonErr}`
              : !jasonArchetypeOk
                ? `Jason fixture resolved to ${jasonArchetype} — should not pass through the cindyType/danielType overlay`
                : `Jason gifts labels are not in the expected GIFT_NOUN_PHRASE form`,
        }
  );

  // ── 5: source-level — overlay site references both label and
  //      description archetype tables ─────────────────────────────
  const engineBody = readFile(join(REPO_ROOT, "lib", "identityEngine.ts"));
  const overlayReferencesBoth =
    engineBody !== null &&
    /GIFT_LABELS_BY_ARCHETYPE\[archetypeKey\]/.test(engineBody) &&
    /GIFT_DESCRIPTIONS_BY_ARCHETYPE\[archetypeKey\]/.test(engineBody) &&
    /swapLeadingDescription\s*\(/.test(engineBody);
  results.push(
    overlayReferencesBoth
      ? {
          ok: true,
          assertion: "overlay-site-references-shared-archetype-source",
          detail: `lib/identityEngine.ts overlay references GIFT_LABELS_BY_ARCHETYPE + GIFT_DESCRIPTIONS_BY_ARCHETYPE + swapLeadingDescription — label and description share a single archetype-positional source`,
        }
      : {
          ok: false,
          assertion: "overlay-site-references-shared-archetype-source",
          detail: `expected overlay references to both archetype tables not found`,
        }
  );

  return results;
}

function main(): number {
  console.log(
    "CC-092-GIFT-TABLE-LABEL-DESCRIPTION-JOIN — label/description coherence audit"
  );
  console.log(
    "============================================================================"
  );
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
  console.log(
    "AUDIT PASSED — Gifts-table label and description rows now come from the same archetype-positional source for cindyType / danielType; jasonType regression anchor unchanged."
  );
  return 0;
}

process.exit(main());
