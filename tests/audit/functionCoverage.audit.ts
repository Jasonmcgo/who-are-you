import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { buildInnerConstitution } from "../../lib/identityEngine";
import { renderMirrorAsMarkdown } from "../../lib/renderMirror";
import type { Answer, DemographicSet } from "../../lib/types";

type FunctionId = "Ni" | "Ne" | "Si" | "Se" | "Ti" | "Te" | "Fi" | "Fe";

type Fixture = {
  answers: Answer[];
  demographics?: DemographicSet | null;
};

const FUNCTIONS: FunctionId[] = ["Ni", "Ne", "Si", "Se", "Ti", "Te", "Fi", "Fe"];

const FUNCTION_LABEL: Record<FunctionId, string> = {
  Ni: "pattern-reader",
  Ne: "possibility-finder",
  Si: "precedent-checker",
  Se: "present-tense self",
  Ti: "coherence-checker",
  Te: "structurer",
  Fi: "inner compass",
  Fe: "room-reader",
};

const CANDIDATES = [
  {
    id: "si_tradition_built_from_chaos",
    functions: "Si",
    title: "Si + chaos_exposure formation",
  },
  {
    id: "se_crisis_alive_planning_strain",
    functions: "Se",
    title: "Se + reactive_operator agency",
  },
  {
    id: "ti_closed_reasoning_chamber",
    functions: "Ti",
    title: "Ti + holds_internal_conviction + low Te exposure",
  },
  {
    id: "fi_personally_authentic_only",
    functions: "Fi",
    title: "Fi + high_conviction_under_risk",
  },
  {
    id: "fe_attunement_to_yielded_conviction",
    functions: "Fe",
    title: "Fe + adapts_under_social_pressure",
  },
];

function table(headers: string[], rows: string[][]): string {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => r[i].length))
  );
  const fmt = (cells: string[]) =>
    cells.map((c, i) => c.padEnd(widths[i])).join(" | ");
  return [
    fmt(headers),
    widths.map((w) => "-".repeat(w)).join("-|-"),
    ...rows.map(fmt),
  ].join("\n");
}

function patternBlocks(source: string): Array<{ id: string; block: string }> {
  return [...source.matchAll(/pattern_id: "([^"]+)"([\s\S]*?)(?=\n\s*\/\/ \d+|\n\s*\/\/ ─|^\];)/gm)].map(
    ([, id, body]) => ({ id, block: body })
  );
}

function sectionBetween(source: string, start: string, end: string): string {
  const from = source.indexOf(start);
  if (from < 0) return "";
  const to = source.indexOf(end, from);
  return source.slice(from, to < 0 ? undefined : to);
}

function patternTriggers(block: string, fn: FunctionId): boolean {
  const f = fn.toLowerCase();
  const detection = sectionBetween(block, "detection:", "prose:");
  return (
    detection.includes(`dominant === "${f}"`) ||
    detection.includes(`auxiliary === "${f}"`) ||
    detection.includes(`dominant !== "${f}"`) ||
    detection.includes(`auxiliary !== "${f}"`)
  );
}

function patternReferences(block: string, fn: FunctionId): boolean {
  const f = fn.toLowerCase();
  const prose = sectionBetween(block, "prose:", "\n  },");
  const label = FUNCTION_LABEL[fn].toLowerCase();
  return (
    prose.toLowerCase().includes(label) ||
    new RegExp(`\\b${fn}\\b`).test(prose) ||
    new RegExp(`"${f}"`).test(prose)
  );
}

function loadFixtures(): Array<{ file: string; fixture: Fixture }> {
  const dirs = ["tests/fixtures/ocean", "tests/fixtures/goal-soul-give"];
  return dirs.flatMap((dir) =>
    readdirSync(dir)
      .filter((name) => name.endsWith(".json"))
      .sort()
      .map((name) => ({
        file: `${dir}/${name}`,
        fixture: JSON.parse(readFileSync(join(dir, name), "utf8")) as Fixture,
      }))
  );
}

function patternLines(markdown: string): string {
  return markdown
    .split("\n")
    .filter((line) => line.includes("Pattern in motion"))
    .join("\n");
}

function bodyLines(markdown: string): string {
  return markdown
    .split("\n")
    .filter((line) => !line.includes("Pattern in motion"))
    .join("\n");
}

function main(): void {
  const catalogSource = readFileSync("lib/identityEngine.ts", "utf8");
  const cc029 = readFileSync("prompts/completed/CC-029-pattern-catalog-expansion.md", "utf8");
  const blocks = patternBlocks(catalogSource);

  const catalogRows = FUNCTIONS.map((fn) => {
    const triggered = blocks.filter(({ block }) => patternTriggers(block, fn)).length;
    const referenced = blocks.filter(({ block }) => patternReferences(block, fn)).length;
    return [fn, String(triggered), String(referenced)];
  });

  const fixtures = loadFixtures();
  const rendered = fixtures.map(({ file, fixture }) => {
    const constitution = buildInnerConstitution(
      fixture.answers,
      [],
      fixture.demographics ?? null
    );
    const markdown = renderMirrorAsMarkdown({
      constitution,
      demographics: fixture.demographics ?? null,
      answers: fixture.answers,
      includeBeliefAnchor: false,
      generatedAt: new Date("2026-05-08T00:00:00.000Z"),
    });
    return {
      file,
      pattern: patternLines(markdown).toLowerCase(),
      body: bodyLines(markdown).toLowerCase(),
    };
  });

  const renderedRows = FUNCTIONS.map((fn) => {
    const label = FUNCTION_LABEL[fn].toLowerCase();
    const withLabel = rendered.filter((r) => r.pattern.includes(label) || r.body.includes(label));
    const inPattern = withLabel.filter((r) => r.pattern.includes(label));
    const bodyOnly = withLabel.filter((r) => !r.pattern.includes(label) && r.body.includes(label));
    return [fn, `${withLabel.length} / ${fixtures.length}`, String(inPattern.length), String(bodyOnly.length)];
  });

  const candidateRows = CANDIDATES.map((candidate) => {
    const inCatalog = catalogSource.includes(`pattern_id: "${candidate.id}"`);
    const inPrompt = cc029.includes(candidate.id);
    const status = inCatalog ? "SHIPPED" : inPrompt ? "QUEUED" : "MISSING";
    return [candidate.id, candidate.functions, status, candidate.title];
  });

  const summaryRows = FUNCTIONS.map((fn) => {
    const catalog = catalogRows.find((r) => r[0] === fn);
    const renderedCount = renderedRows.find((r) => r[0] === fn)?.[1] ?? `0 / ${fixtures.length}`;
    const triggers = Number(catalog?.[1] ?? 0);
    const refs = Number(catalog?.[2] ?? 0);
    const status = triggers > 0 && refs > 0 ? "FULLY" : triggers > 0 || refs > 0 ? "PARTIALLY" : "MISSING";
    return `${fn}: ${status} consumed by catalog; renders in ${renderedCount} fixtures.`;
  });

  console.log("Jungian Function Coverage Audit");
  console.log("===============================");
  console.log("");
  console.log("Measurement 1 — Pattern catalog consumption");
  console.log(table(["Function", "Patterns triggered", "Patterns referencing"], catalogRows));
  console.log("");
  console.log("Measurement 2 — Rendered output consumption");
  console.log(table(["Function", "Fixtures with label", "In Pattern in motion", "In body prose only"], renderedRows));
  console.log("");
  console.log("Measurement 3 — Queued candidate patterns");
  console.log(table(["Pattern", "Functions", "Status", "Source pattern"], candidateRows));
  console.log("");
  console.log("Final summary");
  for (const line of summaryRows) console.log(`- ${line}`);
}

main();
