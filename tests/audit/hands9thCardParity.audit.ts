// CC-HANDS-9TH-CARD-PARITY — file-shape regression-guard audit for the
// Hands 9th-card structural parity work.
//
// Static-string audit (no React renderer) — each assertion is a regex
// or position check against the load-bearing files. Subsequent edits
// that revert the parity treatment (drop the collapse, restore the
// em-dash header, move Hands out of the 3rd slot, etc.) trip these
// gates deterministically.
//
// Hand-rolled. Invocation:
//   `npx tsx tests/audit/hands9thCardParity.audit.ts`.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, "..", "..");

const MAP_SECTION_FILE = join(REPO_ROOT, "app", "components", "MapSection.tsx");
const RENDER_MIRROR_FILE = join(REPO_ROOT, "lib", "renderMirror.ts");

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

function readFile(path: string): string | null {
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf-8");
}

// Canonical card order per CC §"Card placement". The order is what
// appears in MapSection.tsx by `<CardSvgPlate cardId="..."/>` /
// `data-card-svg="..."` markers + the inline Hands block placement.
const CANONICAL_ORDER = [
  "lens",
  "compass",
  "hands",
  "conviction",
  "gravity",
  "trust",
  "weather",
  "fire",
  "path",
] as const;

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];

  const mapBody = readFile(MAP_SECTION_FILE);
  const renderBody = readFile(RENDER_MIRROR_FILE);

  if (mapBody === null) {
    results.push({
      ok: false,
      assertion: "hands-9th-parity-map-section-present",
      detail: `app/components/MapSection.tsx is missing`,
    });
    return results;
  }
  if (renderBody === null) {
    results.push({
      ok: false,
      assertion: "hands-9th-parity-render-mirror-present",
      detail: `lib/renderMirror.ts is missing`,
    });
    return results;
  }

  // ── 1: 9 body cards in canonical order ─────────────────────────────
  // Order is determined by the offsets of each cardId's render anchor
  // in MapSection.tsx. Existing 8 cards use `<CardSvgPlate cardId="..."/>`;
  // Hands uses `data-card-svg="hands"`. We tolerate both shapes.
  const offsets: Array<{ id: string; offset: number }> = [];
  for (const id of CANONICAL_ORDER) {
    const plate = mapBody.indexOf(`<CardSvgPlate cardId="${id}"`);
    const handsPlate = mapBody.indexOf(`data-card-svg="${id}"`);
    const offset =
      plate >= 0 && handsPlate >= 0
        ? Math.min(plate, handsPlate)
        : plate >= 0
          ? plate
          : handsPlate;
    offsets.push({ id, offset });
  }
  const missing = offsets.filter((o) => o.offset < 0).map((o) => o.id);
  let orderOk = missing.length === 0;
  let orderDetail = "";
  if (orderOk) {
    const sorted = [...offsets].sort((a, b) => a.offset - b.offset);
    for (let i = 0; i < CANONICAL_ORDER.length; i++) {
      if (sorted[i].id !== CANONICAL_ORDER[i]) {
        orderOk = false;
        orderDetail = `expected order ${CANONICAL_ORDER.join(", ")}; got ${sorted.map((s) => s.id).join(", ")}`;
        break;
      }
    }
    if (orderOk) {
      orderDetail = `Lens → Compass → Hands → Conviction → Gravity → Trust → Weather → Fire → Path (9 cards in canonical order)`;
    }
  } else {
    orderDetail = `missing render anchors: ${missing.join(", ")}`;
  }
  results.push(
    orderOk
      ? {
          ok: true,
          assertion: "hands-9th-parity-canonical-card-order",
          detail: orderDetail,
        }
      : {
          ok: false,
          assertion: "hands-9th-parity-canonical-card-order",
          detail: orderDetail,
        }
  );

  // ── 2: Hands React title uses middle-dot ("Hands · Work") ─────────
  const hasMiddleDot = mapBody.includes("Hands · Work");
  const hasEmDashInReact =
    /^[^/]*?Hands\s*—\s*Work/m.test(mapBody) === false &&
    mapBody.includes("Hands · Work");
  // Allow em-dash only in comments referencing the markdown emission
  // header (e.g., comments noting the markdown stays "### Hands — Work"
  // for cache stability). The visible JSX must use middle-dot.
  const visibleEmDashLines = mapBody
    .split("\n")
    .filter(
      (l) =>
        l.includes("Hands — Work") &&
        !l.trimStart().startsWith("//") &&
        !l.trimStart().startsWith("*") &&
        !l.includes('"### Hands — Work"')
    );
  results.push(
    hasMiddleDot && visibleEmDashLines.length === 0
      ? {
          ok: true,
          assertion: "hands-9th-parity-middle-dot-header",
          detail: `MapSection renders "Hands · Work" as the visible header${hasEmDashInReact ? "; no em-dash in JSX" : ""}`,
        }
      : {
          ok: false,
          assertion: "hands-9th-parity-middle-dot-header",
          detail: `hasMiddleDot=${hasMiddleDot} visibleEmDashLines=${visibleEmDashLines.length}${visibleEmDashLines[0] ? ` (e.g., "${visibleEmDashLines[0].trim()}")` : ""}`,
        }
  );

  // ── 3: Hands has accordion collapse/expand wiring ─────────────────
  // Required pieces: `hands` in CARD_KEYS, `hands: false` initial
  // expanded state, an onClick that calls `toggle("hands")`, and an
  // aria-expanded read of `expanded.hands`.
  const handsInCardKeys = /CARD_KEYS\s*=\s*\[[\s\S]*?"hands"[\s\S]*?\]/.test(
    mapBody
  );
  const handsInitialFalse = /hands:\s*false/.test(mapBody);
  const handsToggle = /toggle\(\s*"hands"\s*\)/.test(mapBody);
  const handsAriaExpanded = /aria-expanded=\{\s*expanded\.hands\s*\}/.test(
    mapBody
  );
  const accordionOk =
    handsInCardKeys && handsInitialFalse && handsToggle && handsAriaExpanded;
  results.push(
    accordionOk
      ? {
          ok: true,
          assertion: "hands-9th-parity-collapse-by-default",
          detail: `hands is in CARD_KEYS, initial state false, toggle("hands") wired, aria-expanded={expanded.hands}`,
        }
      : {
          ok: false,
          assertion: "hands-9th-parity-collapse-by-default",
          detail: `handsInCardKeys=${handsInCardKeys} handsInitialFalse=${handsInitialFalse} handsToggle=${handsToggle} handsAriaExpanded=${handsAriaExpanded}`,
        }
  );

  // ── 4: ▸/▾ chevron affordance present on Hands header ────────────
  const handsBlockStart = mapBody.indexOf('data-card="hands"');
  let handsChevronOk = false;
  let handsChevronDetail = "";
  if (handsBlockStart < 0) {
    handsChevronDetail = `Hands accordion block (data-card="hands") not found`;
  } else {
    const handsBlock = mapBody.slice(handsBlockStart, handsBlockStart + 4000);
    const chevron = handsBlock.includes("▸") && handsBlock.includes("▾");
    handsChevronOk = chevron;
    handsChevronDetail = chevron
      ? `▸ (collapsed) and ▾ (expanded) chevrons present in the Hands accordion block`
      : `chevrons missing inside the Hands accordion block`;
  }
  results.push(
    handsChevronOk
      ? {
          ok: true,
          assertion: "hands-9th-parity-chevron-affordance",
          detail: handsChevronDetail,
        }
      : {
          ok: false,
          assertion: "hands-9th-parity-chevron-affordance",
          detail: handsChevronDetail,
        }
  );

  // ── 5: Engine markdown header preserved for LLM cache stability ──
  // The CC says "don't bump cache hashes." The Hands LLM cache keys are
  // composed from the engine markdown body, which begins with
  // "### Hands — Work". Renaming the markdown emission to
  // "### Hands · Work" would invalidate every cached Hands rewrite.
  // This assertion locks the markdown header at em-dash; the rename
  // lives at the React surface only.
  const markdownHeaderIntact = renderBody.includes('out.push("### Hands — Work")');
  results.push(
    markdownHeaderIntact
      ? {
          ok: true,
          assertion: "hands-9th-parity-markdown-header-stable-for-cache",
          detail: `lib/renderMirror.ts still emits "### Hands — Work" (markdown) so cached Hands LLM rewrites stay valid; rename lives at the React UI layer only`,
        }
      : {
          ok: false,
          assertion: "hands-9th-parity-markdown-header-stable-for-cache",
          detail: `markdown emission no longer contains 'out.push("### Hands — Work")' — Hands LLM cache will require re-prime`,
        }
  );

  // ── 6: design-studio icon placeholder slot is present ────────────
  const hasIconPlaceholder = mapBody.includes('data-card-svg="hands"');
  results.push(
    hasIconPlaceholder
      ? {
          ok: true,
          assertion: "hands-9th-parity-icon-placeholder-slot",
          detail: `data-card-svg="hands" placeholder div is present, ready to accept the design-studio body-part icon`,
        }
      : {
          ok: false,
          assertion: "hands-9th-parity-icon-placeholder-slot",
          detail: `no data-card-svg="hands" placeholder div — design-studio icon delivery will lack an anchor`,
        }
  );

  // ── 7: Hands body content (LLM-or-engine fork preserved) ────────
  // Both branches of the body still render inside the (now collapsible)
  // accordion. The LLM branch reads `liveScopedRewrites?.hands`; the
  // engine branch reads the structured fields from
  // `constitution.handsCard.*`.
  const llmBranchPresent = /liveScopedRewrites\?\.hands/.test(mapBody);
  const engineFieldsPresent =
    mapBody.includes("constitution.handsCard.strength") &&
    mapBody.includes("constitution.handsCard.growthEdge") &&
    mapBody.includes("constitution.handsCard.underPressure") &&
    mapBody.includes("constitution.handsCard.practice") &&
    mapBody.includes("constitution.handsCard.closingLine");
  results.push(
    llmBranchPresent && engineFieldsPresent
      ? {
          ok: true,
          assertion: "hands-9th-parity-body-content-preserved",
          detail: `both the LLM-rewrite branch (liveScopedRewrites?.hands) and the engine branch (Strength / Growth Edge / Under Pressure / Practice / closing) survive the accordion refactor`,
        }
      : {
          ok: false,
          assertion: "hands-9th-parity-body-content-preserved",
          detail: `llmBranchPresent=${llmBranchPresent} engineFieldsPresent=${engineFieldsPresent}`,
        }
  );

  return results;
}

function main(): number {
  console.log("CC-HANDS-9TH-CARD-PARITY — file-shape regression-guard audit");
  console.log("==============================================================");
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
    "AUDIT PASSED — Hands renders as the 3rd of 9 body cards, with middle-dot header, accordion collapse-by-default, ▸/▾ chevron, icon-placeholder slot, and engine markdown header preserved for cache stability."
  );
  return 0;
}

process.exit(main());
