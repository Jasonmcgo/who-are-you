// CC-REACT-USER-MODE-PARITY audit — verifies the React on-screen render
// path applies the same user/clinician suppression mask as the markdown
// export.
//
// Background: `applyUserModeMask` in lib/renderMirror.ts already strips
// engine-only artifacts (MBTI disclosure, "<MBTI>, provisional" Surface
// Label cell) on the markdown export, but the React render reads
// directly from `constitution.lens_stack` and bypassed the mask. The
// fix threads a `renderMode` prop down InnerConstitutionPage →
// MirrorSection → CoreSignalMap, and InnerConstitutionPage →
// MbtiDisclosure. The default is "user" (suppression on); admin
// surfaces must explicitly opt in via renderMode="clinician".
//
// Assertions:
//   1. MbtiDisclosure user mode (default) renders empty markup — no
//      "Possible surface label:" line, no MBTI four-letter code.
//   2. MbtiDisclosure clinician mode + Jason-shaped high-confidence
//      stack with mbtiCode="INTJ" renders the disclosure paragraph
//      containing "Possible surface label: INTJ".
//   3. CoreSignalMap user mode (default) over the Jason fixture
//      renders zero "INTJ, provisional" occurrences; the Surface
//      label cell value is the user-mode replacement "provisional".
//   4. CoreSignalMap clinician mode over the Jason fixture renders
//      "INTJ, provisional" in the Surface label cell.
//   5. Wiring: app/admin/sessions/[id]/page.tsx passes
//      renderMode="clinician" to <InnerConstitutionPage>.
//   6. Wiring: app/assessment/page.tsx + app/report/[sessionId]/
//      ReportView.tsx do NOT pass renderMode (defaults to user
//      suppression per CC-REACT-USER-MODE-PARITY Rule 2).
//   7. Wiring: MirrorSection threads renderMode to <CoreSignalMap>.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import CoreSignalMap from "../../app/components/CoreSignalMap";
import MbtiDisclosure from "../../app/components/MbtiDisclosure";
import { buildInnerConstitution } from "../../lib/identityEngine";
import type { Answer, DemographicSet, LensStack } from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

function loadJasonConstitution() {
  const raw = JSON.parse(
    readFileSync(join(ROOT, "ocean", "07-jason-real-session.json"), "utf-8")
  ) as { answers: Answer[]; demographics?: DemographicSet | null };
  return buildInnerConstitution(raw.answers, [], raw.demographics ?? null);
}

async function runAudit(): Promise<void> {
  const results: AssertionResult[] = [];

  // ── 1. MbtiDisclosure user-mode (default) renders empty ───────────
  {
    const stack: LensStack = {
      dominant: "ni",
      auxiliary: "te",
      tertiary: "fi",
      inferior: "se",
      mbtiCode: "INTJ",
      confidence: "high",
    };
    const markup = renderToStaticMarkup(
      createElement(MbtiDisclosure, { stack })
    );
    const leaked = /Possible surface label:/i.test(markup) || /\bINTJ\b/.test(markup);
    results.push(
      !leaked
        ? {
            ok: true,
            assertion: "react-mbti-disclosure-user-mode-silent",
            detail: `MbtiDisclosure default (user) mode renders no disclosure line and no MBTI code`,
          }
        : {
            ok: false,
            assertion: "react-mbti-disclosure-user-mode-silent",
            detail: `MbtiDisclosure leaked artifacts in user mode: ${markup.slice(0, 200)}`,
          }
    );
  }

  // ── 2. MbtiDisclosure clinician-mode retains disclosure ────────────
  {
    const stack: LensStack = {
      dominant: "ni",
      auxiliary: "te",
      tertiary: "fi",
      inferior: "se",
      mbtiCode: "INTJ",
      confidence: "high",
    };
    const markup = renderToStaticMarkup(
      createElement(MbtiDisclosure, { stack, renderMode: "clinician" })
    );
    const hasDisclosure = /Possible surface label: INTJ/.test(markup);
    results.push(
      hasDisclosure
        ? {
            ok: true,
            assertion: "react-mbti-disclosure-clinician-retains",
            detail: `MbtiDisclosure clinician mode renders "Possible surface label: INTJ" disclosure paragraph`,
          }
        : {
            ok: false,
            assertion: "react-mbti-disclosure-clinician-retains",
            detail: `MbtiDisclosure clinician mode did NOT render disclosure: ${markup.slice(0, 200)}`,
          }
    );
  }

  // ── 3. CoreSignalMap user-mode (Jason) suppresses "INTJ, provisional" ─
  {
    const constitution = loadJasonConstitution();
    const mbtiCode = constitution.lens_stack.mbtiCode ?? "";
    const markup = renderToStaticMarkup(
      createElement(CoreSignalMap, { constitution })
    );
    const leakedMbti = mbtiCode.length > 0
      ? new RegExp(`${mbtiCode}, provisional`).test(markup)
      : false;
    const hasProvisional = />provisional</.test(markup);
    if (leakedMbti) {
      results.push({
        ok: false,
        assertion: "react-core-signal-map-user-mode-suppresses",
        detail: `CoreSignalMap user mode leaked "${mbtiCode}, provisional" — Surface label cell not masked`,
      });
    } else if (mbtiCode.length > 0 && !hasProvisional) {
      results.push({
        ok: false,
        assertion: "react-core-signal-map-user-mode-suppresses",
        detail: `CoreSignalMap user mode did not emit the "provisional" replacement value for Surface label`,
      });
    } else {
      results.push({
        ok: true,
        assertion: "react-core-signal-map-user-mode-suppresses",
        detail: `CoreSignalMap user mode renders Surface label as "provisional" (no "<MBTI>, provisional" leak)`,
      });
    }
  }

  // ── 4. CoreSignalMap clinician-mode retains "<MBTI>, provisional" ──
  {
    const constitution = loadJasonConstitution();
    const mbtiCode = constitution.lens_stack.mbtiCode ?? "";
    if (mbtiCode.length === 0) {
      results.push({
        ok: false,
        assertion: "react-core-signal-map-clinician-retains",
        detail: `Jason fixture produced empty mbtiCode — cannot assert clinician retention`,
      });
    } else {
      const markup = renderToStaticMarkup(
        createElement(CoreSignalMap, {
          constitution,
          renderMode: "clinician",
        })
      );
      const hasFullForm = new RegExp(`${mbtiCode}, provisional`).test(markup);
      results.push(
        hasFullForm
          ? {
              ok: true,
              assertion: "react-core-signal-map-clinician-retains",
              detail: `CoreSignalMap clinician mode renders "${mbtiCode}, provisional" in Surface label cell`,
            }
          : {
              ok: false,
              assertion: "react-core-signal-map-clinician-retains",
              detail: `CoreSignalMap clinician mode did NOT render "${mbtiCode}, provisional" (Surface label cell did not retain artifact)`,
            }
      );
    }
  }

  // ── 5. Admin page wires renderMode="clinician" ─────────────────────
  {
    const src = readFileSync(
      join(
        __dirname,
        "..",
        "..",
        "app",
        "admin",
        "sessions",
        "[id]",
        "page.tsx"
      ),
      "utf-8"
    );
    const ok = /<InnerConstitutionPage[\s\S]*?renderMode="clinician"[\s\S]*?\/>/.test(
      src
    );
    results.push(
      ok
        ? {
            ok: true,
            assertion: "admin-page-passes-clinician-mode",
            detail: `app/admin/sessions/[id]/page.tsx passes renderMode="clinician" to <InnerConstitutionPage>`,
          }
        : {
            ok: false,
            assertion: "admin-page-passes-clinician-mode",
            detail: `app/admin/sessions/[id]/page.tsx does NOT pass renderMode="clinician" — admin would lose MBTI artifacts`,
          }
    );
  }

  // ── 6. User-facing surfaces omit renderMode (default-to-user) ──────
  {
    const failures: string[] = [];
    for (const rel of [
      "app/assessment/page.tsx",
      "app/report/[sessionId]/ReportView.tsx",
    ]) {
      const src = readFileSync(
        join(__dirname, "..", "..", rel),
        "utf-8"
      );
      const match = src.match(/<InnerConstitutionPage[\s\S]*?\/>/);
      if (!match) {
        failures.push(`${rel} (no <InnerConstitutionPage> found)`);
        continue;
      }
      if (/renderMode=/.test(match[0])) {
        failures.push(
          `${rel} (passes renderMode= explicitly — user-facing should rely on default "user")`
        );
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "user-facing-defaults-to-user-mode",
            detail: `assessment + report pages omit renderMode — defaults to "user" suppression`,
          }
        : {
            ok: false,
            assertion: "user-facing-defaults-to-user-mode",
            detail: failures.join(", "),
          }
    );
  }

  // ── 7. MirrorSection threads renderMode to CoreSignalMap ───────────
  {
    const src = readFileSync(
      join(__dirname, "..", "..", "app", "components", "MirrorSection.tsx"),
      "utf-8"
    );
    const passesToCoreSignal =
      /<CoreSignalMap[\s\S]*?renderMode=\{renderMode\}[\s\S]*?\/>/.test(src);
    const propTyped = /renderMode\?:\s*"user"\s*\|\s*"clinician"/.test(src);
    results.push(
      passesToCoreSignal && propTyped
        ? {
            ok: true,
            assertion: "mirror-section-threads-render-mode",
            detail: `MirrorSection types renderMode and threads it to <CoreSignalMap>`,
          }
        : {
            ok: false,
            assertion: "mirror-section-threads-render-mode",
            detail: `MirrorSection missing renderMode wiring (typed=${propTyped}, threaded=${passesToCoreSignal})`,
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
    `CC-REACT-USER-MODE-PARITY: ${passed}/${results.length} assertions passing.`
  );
  if (failed > 0) process.exit(1);
}

runAudit().catch((e) => {
  console.error(e);
  process.exit(1);
});
