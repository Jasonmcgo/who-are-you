// CC-REPORT-PERMALINK — file-shape regression-guard audit.
//
// The permalink route is a Next.js server component that reaches into
// Postgres; running it through `tsx` would require a live DATABASE_URL
// and an actual session row, which the audit harness does not have.
// This audit instead enforces the file-shape contract via static
// reads — every gate from the prompt's §"Audit gates" maps to a
// regex on one of the load-bearing files. If a future edit breaks the
// shape (e.g., a refactor removes the permalink section from
// InnerConstitutionPage or changes the route's not-found copy), the
// audit catches it deterministically.
//
// Hand-rolled. Invocation:
//   `npx tsx tests/audit/reportPermalink.audit.ts`.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, "..", "..");

const ROUTE_FILE = join(
  REPO_ROOT,
  "app",
  "report",
  "[sessionId]",
  "page.tsx"
);
const REPORT_VIEW_FILE = join(
  REPO_ROOT,
  "app",
  "report",
  "[sessionId]",
  "ReportView.tsx"
);
const PAGE_COMPONENT_FILE = join(
  REPO_ROOT,
  "app",
  "components",
  "InnerConstitutionPage.tsx"
);
const ASSESSMENT_PAGE_FILE = join(REPO_ROOT, "app", "assessment", "page.tsx");

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

function readFile(path: string): string | null {
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf-8");
}

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];

  // ── 1: route file exists ────────────────────────────────────────────
  const routeBody = readFile(ROUTE_FILE);
  results.push(
    routeBody !== null
      ? {
          ok: true,
          assertion: "report-permalink-route-file-exists",
          detail: `app/report/[sessionId]/page.tsx is present (${routeBody.length} bytes)`,
        }
      : {
          ok: false,
          assertion: "report-permalink-route-file-exists",
          detail: `app/report/[sessionId]/page.tsx is missing`,
        }
  );

  // ── 2: route is a server component that queries the DB by session id
  if (routeBody) {
    const hasGetDb = routeBody.includes("getDb()");
    const hasSessionsTable =
      routeBody.includes("sessionsTable") ||
      routeBody.includes("from sessions");
    const hasParams = /params:\s*Promise<\{\s*sessionId/.test(routeBody);
    const isNoClientUseEffect = !routeBody.includes('"use client"');
    const allOk =
      hasGetDb && hasSessionsTable && hasParams && isNoClientUseEffect;
    results.push(
      allOk
        ? {
            ok: true,
            assertion: "report-permalink-route-is-server-component-with-db-fetch",
            detail: `route is server-rendered (no "use client"), reads getDb(), queries sessions table, params shape includes sessionId`,
          }
        : {
            ok: false,
            assertion: "report-permalink-route-is-server-component-with-db-fetch",
            detail: `getDb=${hasGetDb} sessionsTable=${hasSessionsTable} params=${hasParams} serverComponent=${isNoClientUseEffect}`,
          }
    );
  }

  // ── 3: route renders friendly not-found JSX on miss ────────────────
  if (routeBody) {
    // JSX requires entity-encoding the apostrophe (react/no-unescaped-entities),
    // so the rendered output reads `This reading wasn't found` but the source
    // file carries `wasn&apos;t`. Match either form.
    const hasNotFoundCopy =
      routeBody.includes("This reading wasn't found") ||
      routeBody.includes("This reading wasn&apos;t found");
    const hasTakeAssessmentLink = /href=["']\/["'][\s\S]{0,300}Take the assessment/.test(
      routeBody
    );
    const hasReturnNullCheck =
      routeBody.includes("return <ReportNotFound") ||
      routeBody.includes("ReportNotFound()");
    results.push(
      hasNotFoundCopy && hasTakeAssessmentLink && hasReturnNullCheck
        ? {
            ok: true,
            assertion: "report-permalink-route-renders-friendly-not-found",
            detail: `not-found copy + "Take the assessment" link to / are both present, and ReportNotFound is invoked on miss`,
          }
        : {
            ok: false,
            assertion: "report-permalink-route-renders-friendly-not-found",
            detail: `notFoundCopy=${hasNotFoundCopy} takeAssessmentLink=${hasTakeAssessmentLink} renderNotFound=${hasReturnNullCheck}`,
          }
    );
  }

  // ── 4: route hands the saved data to ReportView client wrapper ────
  if (routeBody) {
    const handsToReportView =
      routeBody.includes("<ReportView") && routeBody.includes("sessionId=");
    results.push(
      handsToReportView
        ? {
            ok: true,
            assertion: "report-permalink-route-delegates-to-report-view",
            detail: `route emits <ReportView /> with sessionId prop`,
          }
        : {
            ok: false,
            assertion: "report-permalink-route-delegates-to-report-view",
            detail: `route does not delegate to <ReportView /> with sessionId`,
          }
    );
  }

  // ── 5: ReportView is a client wrapper that renders InnerConstitutionPage
  const reportViewBody = readFile(REPORT_VIEW_FILE);
  if (reportViewBody !== null) {
    const isClient = reportViewBody.includes('"use client"');
    const rendersInner = reportViewBody.includes("<InnerConstitutionPage");
    const passesSessionId = /sessionId\s*=\s*\{sessionId\}/.test(reportViewBody);
    const wiresLlmAugments =
      reportViewBody.includes("useLlmMasterSynthesis") &&
      reportViewBody.includes("useGripParagraph");
    results.push(
      isClient && rendersInner && passesSessionId && wiresLlmAugments
        ? {
            ok: true,
            assertion: "report-permalink-report-view-is-client-wrapper",
            detail: `ReportView is "use client", renders <InnerConstitutionPage sessionId=...>, and threads useLlmMasterSynthesis + useGripParagraph for cache-warm augments`,
          }
        : {
            ok: false,
            assertion: "report-permalink-report-view-is-client-wrapper",
            detail: `useClient=${isClient} rendersInner=${rendersInner} passesSessionId=${passesSessionId} llmAugments=${wiresLlmAugments}`,
          }
    );
  } else {
    results.push({
      ok: false,
      assertion: "report-permalink-report-view-is-client-wrapper",
      detail: `app/report/[sessionId]/ReportView.tsx is missing`,
    });
  }

  // ── 6: InnerConstitutionPage accepts sessionId prop ───────────────
  const pageBody = readFile(PAGE_COMPONENT_FILE);
  if (pageBody !== null) {
    const hasPropType = /sessionId\?:\s*string\s*\|\s*null/.test(pageBody);
    const destructuresProp = /^\s*sessionId,\s*$/m.test(pageBody);
    results.push(
      hasPropType && destructuresProp
        ? {
            ok: true,
            assertion: "report-permalink-inner-constitution-accepts-sessionId-prop",
            detail: `InnerConstitutionPage Props include sessionId?: string | null and the destructure passes through`,
          }
        : {
            ok: false,
            assertion: "report-permalink-inner-constitution-accepts-sessionId-prop",
            detail: `hasPropType=${hasPropType} destructuresProp=${destructuresProp}`,
          }
    );
  } else {
    results.push({
      ok: false,
      assertion: "report-permalink-inner-constitution-accepts-sessionId-prop",
      detail: `InnerConstitutionPage.tsx is missing`,
    });
  }

  // ── 7: InnerConstitutionPage renders the permalink section ────────
  if (pageBody) {
    const hasSectionHeader = pageBody.includes("Return to this reading");
    const hasHelperCopy = pageBody.includes(
      "Bookmark this link to return any time"
    );
    const hasPrivacyCopy = pageBody.includes(
      "Anyone with the link can view this reading"
    );
    const hasUrlDisplay = pageBody.includes("/report/${sessionId}");
    const hasCopyButton =
      pageBody.includes('data-action="copy-link"') &&
      pageBody.includes("handleCopyLink");
    const allOk =
      hasSectionHeader &&
      hasHelperCopy &&
      hasPrivacyCopy &&
      hasUrlDisplay &&
      hasCopyButton;
    results.push(
      allOk
        ? {
            ok: true,
            assertion: "report-permalink-section-renders-with-copy-button",
            detail: `section header, helper copy, privacy copy, /report/<id> URL display, and copy-link button are all present`,
          }
        : {
            ok: false,
            assertion: "report-permalink-section-renders-with-copy-button",
            detail: `header=${hasSectionHeader} helper=${hasHelperCopy} privacy=${hasPrivacyCopy} url=${hasUrlDisplay} copyButton=${hasCopyButton}`,
          }
    );
  }

  // ── 8: permalink section sits ABOVE the Share This Reading block ──
  if (pageBody) {
    const permalinkIdx = pageBody.indexOf("Return to this reading");
    const shareIdx = pageBody.indexOf("Share This Reading");
    const permalinkAboveShare =
      permalinkIdx >= 0 && shareIdx >= 0 && permalinkIdx < shareIdx;
    results.push(
      permalinkAboveShare
        ? {
            ok: true,
            assertion: "report-permalink-section-renders-above-share-block",
            detail: `"Return to this reading" appears at offset ${permalinkIdx}, above "Share This Reading" at offset ${shareIdx} (DOM order preserved)`,
          }
        : {
            ok: false,
            assertion: "report-permalink-section-renders-above-share-block",
            detail: `permalink at ${permalinkIdx}, share at ${shareIdx} — expected permalink first`,
          }
    );
  }

  // ── 9: permalink section gates on sessionId presence ──────────────
  if (pageBody) {
    // The guard pattern is `hideShareBlock || !sessionId ? null : (...)`.
    const hasGuard = /hideShareBlock\s*\|\|\s*!sessionId\s*\?\s*null/.test(
      pageBody
    );
    results.push(
      hasGuard
        ? {
            ok: true,
            assertion: "report-permalink-section-guards-on-sessionid",
            detail: `section is gated on (!hideShareBlock && sessionId) so in-progress / admin renders silently omit it`,
          }
        : {
            ok: false,
            assertion: "report-permalink-section-guards-on-sessionid",
            detail: `expected guard pattern "hideShareBlock || !sessionId ? null : ..." not found`,
          }
    );
  }

  // ── 10: assessment flow threads sessionId into InnerConstitutionPage ─
  const assessmentBody = readFile(ASSESSMENT_PAGE_FILE);
  if (assessmentBody !== null) {
    const capturesSessionId =
      /const\s*\{\s*sessionId\s*\}\s*=\s*await\s+saveSession\(/.test(
        assessmentBody
      );
    const passesSessionId = /sessionId=\{savedSessionId\}/.test(assessmentBody);
    results.push(
      capturesSessionId && passesSessionId
        ? {
            ok: true,
            assertion: "report-permalink-assessment-threads-sessionid-post-save",
            detail: `assessment flow destructures sessionId from saveSession() and threads it into <InnerConstitutionPage /> as sessionId={savedSessionId}`,
          }
        : {
            ok: false,
            assertion: "report-permalink-assessment-threads-sessionid-post-save",
            detail: `capturesSessionId=${capturesSessionId} passesSessionId=${passesSessionId}`,
          }
    );
  } else {
    results.push({
      ok: false,
      assertion: "report-permalink-assessment-threads-sessionid-post-save",
      detail: `app/assessment/page.tsx is missing`,
    });
  }

  return results;
}

function main(): number {
  console.log("CC-REPORT-PERMALINK — file-shape regression-guard audit");
  console.log("=========================================================");
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
    "AUDIT PASSED — /report/[sessionId] route, ReportView client wrapper, permalink section, and assessment-side sessionId threading are all in place."
  );
  return 0;
}

process.exit(main());
