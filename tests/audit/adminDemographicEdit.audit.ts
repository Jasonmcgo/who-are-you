// CC-087-ADMIN-DEMOGRAPHIC-EDIT — file-shape audit. Confirms the new admin
// route + sibling client form + server action are wired correctly, that
// the form mirrors the answers-page row aesthetic, and that the chosen
// coexistence path (per Item 3) leaves the ghost-mapping triage list
// in place.
//
// Hand-rolled. Invocation:
//   `npx tsx tests/audit/adminDemographicEdit.audit.ts`
//   (or `npm run audit:admin-demographic-edit`).

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, "..", "..");

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

function readFile(path: string): string | null {
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf-8");
}

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];

  const pagePath = join(
    REPO_ROOT,
    "app",
    "admin",
    "sessions",
    "[id]",
    "demographics",
    "page.tsx"
  );
  const formPath = join(
    REPO_ROOT,
    "app",
    "admin",
    "sessions",
    "[id]",
    "demographics",
    "DemographicEditForm.tsx"
  );
  const saveSessionPath = join(REPO_ROOT, "lib", "saveSession.ts");
  const answersPagePath = join(
    REPO_ROOT,
    "app",
    "admin",
    "sessions",
    "[id]",
    "answers",
    "page.tsx"
  );
  const ghostMappingPagePath = join(
    REPO_ROOT,
    "app",
    "admin",
    "sessions",
    "ghost-mapping",
    "page.tsx"
  );

  const pageBody = readFile(pagePath);
  const formBody = readFile(formPath);
  const saveSessionBody = readFile(saveSessionPath);
  const answersBody = readFile(answersPagePath);

  // ── 1: new admin route exists ────────────────────────────────────
  results.push(
    pageBody !== null && formBody !== null
      ? {
          ok: true,
          assertion: "admin-demographic-edit-route-present",
          detail:
            "app/admin/sessions/[id]/demographics/{page.tsx,DemographicEditForm.tsx} both exist",
        }
      : {
          ok: false,
          assertion: "admin-demographic-edit-route-present",
          detail: [
            pageBody === null ? "page.tsx missing" : null,
            formBody === null ? "DemographicEditForm.tsx missing" : null,
          ]
            .filter(Boolean)
            .join("; "),
        }
  );

  // ── 2: form imports updateSessionDemographicField from saveSession ─
  const importsAction =
    formBody !== null &&
    /import\s*\{[^}]*\bupdateSessionDemographicField\b[^}]*\}\s*from\s*["'][^"']*\/lib\/saveSession["']/.test(
      formBody
    );
  results.push(
    importsAction
      ? {
          ok: true,
          assertion: "form-imports-update-session-demographic-field",
          detail: `DemographicEditForm.tsx imports updateSessionDemographicField from lib/saveSession`,
        }
      : {
          ok: false,
          assertion: "form-imports-update-session-demographic-field",
          detail: `import not found in DemographicEditForm.tsx`,
        }
  );

  // ── 3: page imports DEMOGRAPHIC_FIELDS from data/demographics ────
  const importsDemoFields =
    pageBody !== null &&
    /import\s*\{[^}]*\bDEMOGRAPHIC_FIELDS\b[^}]*\}\s*from\s*["'][^"']*\/data\/demographics["']/.test(
      pageBody
    );
  results.push(
    importsDemoFields
      ? {
          ok: true,
          assertion: "page-imports-demographic-fields-canon",
          detail: `page.tsx imports DEMOGRAPHIC_FIELDS from data/demographics`,
        }
      : {
          ok: false,
          assertion: "page-imports-demographic-fields-canon",
          detail: `DEMOGRAPHIC_FIELDS import not found in page.tsx`,
        }
  );

  // ── 4: form contains EDIT button + per-field row component ───────
  // Edit button text is "Edit" inside an EditableRow.
  const hasEditBtn =
    formBody !== null &&
    /EditableRow\b/.test(formBody) &&
    />\s*Edit\s*</.test(formBody);
  results.push(
    hasEditBtn
      ? {
          ok: true,
          assertion: "form-contains-edit-button-per-field",
          detail: `EditableRow component + Edit button text both present in DemographicEditForm.tsx`,
        }
      : {
          ok: false,
          assertion: "form-contains-edit-button-per-field",
          detail: `EditableRow or Edit button text missing`,
        }
  );

  // ── 5: form mirrors answers-page row aesthetic ──────────────────
  // The answers page uses --rule, --paper, font-mono uppercase, "Edit"
  // button text with letterSpacing:0.10em. Check the form uses the same
  // tokens so the two pages read as a single admin surface.
  const mirrorsAesthetic =
    formBody !== null &&
    answersBody !== null &&
    /font-mono uppercase/.test(formBody) &&
    /font-mono uppercase/.test(answersBody) &&
    /var\(--rule[^)]*\)/.test(formBody) &&
    /var\(--rule[^)]*\)/.test(answersBody) &&
    /letterSpacing:\s*["']0\.10em["']/.test(formBody) &&
    /letterSpacing:\s*["']0\.10em["']/.test(answersBody);
  results.push(
    mirrorsAesthetic
      ? {
          ok: true,
          assertion: "form-mirrors-answers-page-row-aesthetic",
          detail: `font-mono uppercase + --rule border + 0.10em letterSpacing tokens shared with /answers page`,
        }
      : {
          ok: false,
          assertion: "form-mirrors-answers-page-row-aesthetic",
          detail: `aesthetic tokens (mono uppercase / --rule / 0.10em) do not match the answers page`,
        }
  );

  // ── 6: ghost-mapping page coexists (Item 3 = coexist) ────────────
  const ghostMappingExists = existsSync(ghostMappingPagePath);
  results.push(
    ghostMappingExists
      ? {
          ok: true,
          assertion: "ghost-mapping-coexists-with-per-session-edit",
          detail: `app/admin/sessions/ghost-mapping/page.tsx still present — triage list coexists with the per-session edit surface`,
        }
      : {
          ok: false,
          assertion: "ghost-mapping-coexists-with-per-session-edit",
          detail: `ghost-mapping page missing — if supersession was chosen, demographicsSaveWiring.audit.ts must drop the ghost-mapping-page-exists assertion`,
        }
  );

  // ── 7: server action exists in lib/saveSession.ts ────────────────
  const actionDeclared =
    saveSessionBody !== null &&
    /export\s+async\s+function\s+updateSessionDemographicField\b/.test(
      saveSessionBody
    );
  const actionWritesAudit =
    saveSessionBody !== null &&
    /ghostMappingAudit/.test(saveSessionBody.split("updateSessionDemographicField")[1] ?? "");
  results.push(
    actionDeclared && actionWritesAudit
      ? {
          ok: true,
          assertion: "server-action-declared-and-writes-audit",
          detail: `updateSessionDemographicField exported from lib/saveSession.ts and writes ghostMappingAudit entries`,
        }
      : {
          ok: false,
          assertion: "server-action-declared-and-writes-audit",
          detail: !actionDeclared
            ? `updateSessionDemographicField export not found in lib/saveSession.ts`
            : `updateSessionDemographicField does not insert into ghostMappingAudit`,
        }
  );

  // ── 8: attachDemographicsToSession signature preserved ───────────
  // CC-DEMOGRAPHICS-SAVE-WIRING's ghost-mapping page calls this; the CC
  // forbids changing the signature.
  const preservedSig =
    saveSessionBody !== null &&
    /export\s+async\s+function\s+attachDemographicsToSession\s*\(\s*args:\s*AttachDemographicsToSessionArgs\s*\)/.test(
      saveSessionBody
    );
  results.push(
    preservedSig
      ? {
          ok: true,
          assertion: "attach-demographics-signature-preserved",
          detail: `attachDemographicsToSession signature unchanged (still takes AttachDemographicsToSessionArgs)`,
        }
      : {
          ok: false,
          assertion: "attach-demographics-signature-preserved",
          detail: `attachDemographicsToSession signature appears altered`,
        }
  );

  // ── 9: no LLM imports in the new files ───────────────────────────
  const noLlm =
    pageBody !== null &&
    formBody !== null &&
    !/from\s+["'][^"']*LlmServer["']/.test(pageBody) &&
    !/from\s+["'][^"']*LlmServer["']/.test(formBody) &&
    !/@anthropic-ai\/sdk/.test(pageBody) &&
    !/@anthropic-ai\/sdk/.test(formBody);
  results.push(
    noLlm
      ? {
          ok: true,
          assertion: "admin-demographic-edit-no-llm-imports",
          detail: `neither page.tsx nor DemographicEditForm.tsx imports any *LlmServer or @anthropic-ai/sdk module`,
        }
      : {
          ok: false,
          assertion: "admin-demographic-edit-no-llm-imports",
          detail: `forbidden LLM-server or @anthropic-ai/sdk import found`,
        }
  );

  return results;
}

function main(): number {
  console.log(
    "CC-087-ADMIN-DEMOGRAPHIC-EDIT — file-shape + wiring audit"
  );
  console.log(
    "========================================================="
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
    `AUDIT PASSED — admin per-field demographic-edit surface wired, server action declared, audit logged, ghost-mapping triage coexists, aesthetic mirrors /answers page.`
  );
  return 0;
}

process.exit(main());
