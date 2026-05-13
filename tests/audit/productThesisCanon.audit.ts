// CC-PRODUCT-THESIS-CANON — product-thesis canonical doc + LLM-prompt anchor audit.
//
// 5 assertions verifying:
//   - the canonical doc exists at docs/canon/product-thesis.md
//   - the doc has all 9 required sections
//   - the two Clarence canon paragraphs are present verbatim
//   - both LLM SYSTEM_PROMPTs contain the "purpose-orientation instrument" anchor token
//   - render-layer files are untouched (additive-scope enforcement)
//
// Hand-rolled. Invocation: `npx tsx tests/audit/productThesisCanon.audit.ts`.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SYSTEM_PROMPT } from "../../lib/synthesis3Llm";
import { GRIP_SYSTEM_PROMPT } from "../../lib/gripTaxonomyLlm";
import { PRODUCT_THESIS_ANCHOR_BLOCK } from "../../lib/productThesisAnchor";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "..");

const CANON_DOC_PATH = join(ROOT, "docs", "canon", "product-thesis.md");
const RENDER_MIRROR_FILE = join(ROOT, "lib", "renderMirror.ts");
const INNER_PAGE_FILE = join(
  ROOT,
  "app",
  "components",
  "InnerConstitutionPage.tsx"
);

const CANON_QUOTE_1 =
  "Who Are You: The 50° Life is not primarily a personality report. It is a purpose-orientation instrument. The product promise is 50 questions to help a person see their life trajectory, understand the Grip that pulls them off course, and identify the Path that helps them grow with meaning and consequence.";

const CANON_QUOTE_2 =
  "The trajectory image should be the front door. The body cards are depth tools, not the main shareable artifact. Grip explains what holds the person back. Path explains how they uniquely find satisfaction in growth. The final output should help the user articulate, in their own register, why they are here.";

const REQUIRED_SECTIONS = [
  /^##\s+1\.\s+The thesis\b/m,
  /^##\s+2\.\s+What we are not\b/m,
  /^##\s+3\.\s+What we are\b/m,
  /^##\s+4\.\s+The travelable artifact vs the depth tools\b/m,
  /^##\s+5\.\s+The two-sentence value proposition\b/m,
  /^##\s+6\.\s+The purpose question and four registers\b/m,
  /^##\s+7\.\s+Comparison anchors and anti-anchors\b/m,
  /^##\s+8\.\s+Architectural rule\b/m,
  /^##\s+9\.\s+Provenance\b/m,
];

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];

  // ── 1. product-thesis-doc-exists ────────────────────────────────────
  const docExists = existsSync(CANON_DOC_PATH);
  results.push(
    docExists
      ? {
          ok: true,
          assertion: "product-thesis-doc-exists",
          detail: `docs/canon/product-thesis.md present`,
        }
      : {
          ok: false,
          assertion: "product-thesis-doc-exists",
          detail: `docs/canon/product-thesis.md missing`,
        }
  );

  if (!docExists) {
    // Skip downstream doc assertions.
    return [
      ...results,
      {
        ok: false,
        assertion: "product-thesis-doc-sections",
        detail: "doc missing — section check skipped",
      },
      {
        ok: false,
        assertion: "product-thesis-canonical-quote",
        detail: "doc missing — canonical-quote check skipped",
      },
    ];
  }

  const docContent = readFileSync(CANON_DOC_PATH, "utf-8");

  // ── 2. product-thesis-doc-sections ──────────────────────────────────
  const missingSections: string[] = [];
  for (const pattern of REQUIRED_SECTIONS) {
    if (!pattern.test(docContent)) {
      missingSections.push(pattern.source);
    }
  }
  results.push(
    missingSections.length === 0
      ? {
          ok: true,
          assertion: "product-thesis-doc-sections",
          detail: `all ${REQUIRED_SECTIONS.length} sections present`,
        }
      : {
          ok: false,
          assertion: "product-thesis-doc-sections",
          detail: `missing: ${missingSections.join(" | ")}`,
        }
  );

  // ── 3. product-thesis-canonical-quote ───────────────────────────────
  const quoteFails: string[] = [];
  if (!docContent.includes(CANON_QUOTE_1)) {
    quoteFails.push("quote 1 (purpose-orientation instrument paragraph)");
  }
  if (!docContent.includes(CANON_QUOTE_2)) {
    quoteFails.push("quote 2 (trajectory-as-front-door paragraph)");
  }
  results.push(
    quoteFails.length === 0
      ? {
          ok: true,
          assertion: "product-thesis-canonical-quote",
          detail: "both Clarence canon paragraphs present verbatim",
        }
      : {
          ok: false,
          assertion: "product-thesis-canonical-quote",
          detail: `missing verbatim: ${quoteFails.join(", ")}`,
        }
  );

  // ── 4. product-thesis-llm-prompt-anchor ─────────────────────────────
  const anchorMissing: string[] = [];
  if (!/purpose-orientation instrument/i.test(SYSTEM_PROMPT)) {
    anchorMissing.push("synthesis3Llm.SYSTEM_PROMPT");
  }
  if (!/purpose-orientation instrument/i.test(GRIP_SYSTEM_PROMPT)) {
    anchorMissing.push("gripTaxonomyLlm.GRIP_SYSTEM_PROMPT");
  }
  // Also confirm the anchor block constant is the same one both prompts
  // import — no drift between embedded copies.
  if (!SYSTEM_PROMPT.includes(PRODUCT_THESIS_ANCHOR_BLOCK)) {
    anchorMissing.push("synthesis3Llm: anchor block content drift");
  }
  if (!GRIP_SYSTEM_PROMPT.includes(PRODUCT_THESIS_ANCHOR_BLOCK)) {
    anchorMissing.push("gripTaxonomyLlm: anchor block content drift");
  }
  results.push(
    anchorMissing.length === 0
      ? {
          ok: true,
          assertion: "product-thesis-llm-prompt-anchor",
          detail: "both SYSTEM_PROMPTs contain the verbatim anchor block + 'purpose-orientation instrument' token",
        }
      : {
          ok: false,
          assertion: "product-thesis-llm-prompt-anchor",
          detail: anchorMissing.join(" | "),
        }
  );

  // ── 5. product-thesis-no-prose-changes ──────────────────────────────
  const renderMirror = readFileSync(RENDER_MIRROR_FILE, "utf-8");
  const innerPage = readFileSync(INNER_PAGE_FILE, "utf-8");
  const renderFails: string[] = [];
  if (/productThesisAnchor/.test(renderMirror)) {
    renderFails.push("renderMirror.ts references productThesisAnchor");
  }
  if (/productThesisAnchor/.test(innerPage)) {
    renderFails.push("InnerConstitutionPage.tsx references productThesisAnchor");
  }
  if (/PRODUCT_THESIS_ANCHOR_BLOCK/.test(renderMirror)) {
    renderFails.push("renderMirror.ts references PRODUCT_THESIS_ANCHOR_BLOCK");
  }
  if (/PRODUCT_THESIS_ANCHOR_BLOCK/.test(innerPage)) {
    renderFails.push("InnerConstitutionPage.tsx references PRODUCT_THESIS_ANCHOR_BLOCK");
  }
  results.push(
    renderFails.length === 0
      ? {
          ok: true,
          assertion: "product-thesis-no-prose-changes",
          detail: "render layer untouched (no productThesisAnchor references)",
        }
      : {
          ok: false,
          assertion: "product-thesis-no-prose-changes",
          detail: renderFails.join(" | "),
        }
  );

  return results;
}

function main(): number {
  console.log("CC-PRODUCT-THESIS-CANON — product-thesis canonical doc + LLM-prompt anchor audit");
  console.log("==================================================================================");
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
  console.log("AUDIT PASSED — all CC-PRODUCT-THESIS-CANON assertions green.");
  return 0;
}

process.exit(main());
