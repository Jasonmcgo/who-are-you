// CC-HEADER-NAV-AND-EMAIL-GATE audit — three production-readiness
// surface gates:
//   A. SiteHeader component renders on routes that need a return-home
//      affordance; suppressed on `/` (landing handles its own brand).
//   B. IdentityAndContextPage has required email + optional mobile;
//      validation gates the Continue button; helper text turns red on
//      attempted submit with invalid input.
//   C. Static landing page renames the "Pass along to someone that
//      matters" CTA and wires the click to copy the assessment URL.
//   D. Drizzle schema adds contact_email / contact_mobile columns +
//      a migration file lands in db/migrations.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  isValidEmail,
  isAcceptableMobile,
} from "../../app/components/IdentityAndContextPage";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, "..", "..");

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

async function runAudit(): Promise<void> {
  const results: AssertionResult[] = [];

  // ── A1. site-header-component-exists ───────────────────────────────
  {
    const path = join(REPO_ROOT, "app", "components", "SiteHeader.tsx");
    const fails: string[] = [];
    if (!existsSync(path)) {
      fails.push("app/components/SiteHeader.tsx missing");
    } else {
      const src = readFileSync(path, "utf-8");
      if (!/Who Are You\?/.test(src))
        fails.push("SiteHeader does not render 'Who Are You?' text");
      if (!/href="\/"|href={`?\/`?}/.test(src))
        fails.push("SiteHeader does not link to '/'");
      if (!/usePathname/.test(src))
        fails.push("SiteHeader does not consult pathname for / suppression");
      if (!/pathname === "\/"/.test(src) && !/pathname === '\/'/.test(src))
        fails.push("SiteHeader does not suppress on '/' explicitly");
    }
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "site-header-component-exists",
            detail: `SiteHeader.tsx: renders 'Who Are You?' linking to '/', suppressed on / via usePathname`,
          }
        : {
            ok: false,
            assertion: "site-header-component-exists",
            detail: fails.join("; "),
          }
    );
  }

  // ── A2. site-header-rendered-in-root-layout ────────────────────────
  {
    const path = join(REPO_ROOT, "app", "layout.tsx");
    const fails: string[] = [];
    if (!existsSync(path)) {
      fails.push("app/layout.tsx missing");
    } else {
      const src = readFileSync(path, "utf-8");
      if (!/import\s+SiteHeader\s+from/.test(src))
        fails.push("layout does not import SiteHeader");
      if (!/<SiteHeader\s*\/>/.test(src))
        fails.push("layout does not render <SiteHeader />");
    }
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "site-header-rendered-in-root-layout",
            detail: `layout.tsx imports and renders <SiteHeader />`,
          }
        : {
            ok: false,
            assertion: "site-header-rendered-in-root-layout",
            detail: fails.join("; "),
          }
    );
  }

  // ── B1. email-validation-helper-is-permissive ──────────────────────
  //   Verify the exported validator accepts realistic emails and
  //   rejects obvious garbage. Per CC Rule 2 the regex is permissive.
  {
    const fails: string[] = [];
    const acceptCases = [
      "a@b.co",
      "jason.mcgovern@example.org",
      "a+b@c.io",
      "x_y@sub.domain.tld",
    ];
    for (const c of acceptCases) {
      if (!isValidEmail(c)) fails.push(`rejected valid email: "${c}"`);
    }
    const rejectCases = ["", "  ", "no-at-symbol", "no-tld@host", "@nolocal.tld", "missing-dot@host"];
    for (const c of rejectCases) {
      if (isValidEmail(c)) fails.push(`accepted invalid email: "${c}"`);
    }
    if (!isAcceptableMobile("")) fails.push("empty mobile rejected (should pass)");
    if (!isAcceptableMobile("+1 (555) 123-4567"))
      fails.push("phone with punctuation rejected");
    if (!isAcceptableMobile("734.474.5112"))
      fails.push("phone with periods (e.g., 734.474.5112) rejected — Cindy regression");
    if (isAcceptableMobile("not-a-phone"))
      fails.push("non-phone string accepted as mobile");
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "email-validation-helper-is-permissive",
            detail: `isValidEmail + isAcceptableMobile validate per CC contract`,
          }
        : {
            ok: false,
            assertion: "email-validation-helper-is-permissive",
            detail: fails.join("; "),
          }
    );
  }

  // ── B2. identity-context-page-has-contact-fields ───────────────────
  {
    const path = join(
      REPO_ROOT,
      "app",
      "components",
      "IdentityAndContextPage.tsx"
    );
    const fails: string[] = [];
    if (!existsSync(path)) {
      fails.push("IdentityAndContextPage.tsx missing");
    } else {
      const src = readFileSync(path, "utf-8");
      if (!/Email address/.test(src))
        fails.push('missing "Email address" label');
      if (!/Mobile number/.test(src))
        fails.push('missing "Mobile number" label');
      if (!/id="contact-email"/.test(src))
        fails.push("missing contact-email input id");
      if (!/id="contact-mobile"/.test(src))
        fails.push("missing contact-mobile input id");
      if (!/type="email"/.test(src))
        fails.push("missing type=email on email input");
      if (!/required/.test(src))
        fails.push("email input not marked required");
      // The Continue button must be gated on `canSubmit`.
      if (!/disabled=\{isSubmitting \|\| !canSubmit\}/.test(src))
        fails.push("Continue button not gated on canSubmit");
      // The error helper text must exist for attempted-submit + invalid.
      if (!/Please enter a valid email to view your reading\./.test(src))
        fails.push("missing error helper text for invalid email");
      // Privacy line.
      if (!/We won&apos;t share your contact info\.|We won't share your contact info\./.test(src))
        fails.push("missing privacy line below contact fields");
    }
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "identity-context-page-has-contact-fields",
            detail: `email + mobile inputs + required gate + error helper + privacy line all present`,
          }
        : {
            ok: false,
            assertion: "identity-context-page-has-contact-fields",
            detail: fails.join("; "),
          }
    );
  }

  // ── C1. landing-cta-renamed ─────────────────────────────────────────
  //   web/index.html no longer contains "Give it to someone you love"
  //   nor the unqualified "Give it to someone". The new CTA text is
  //   "Pass along to someone that matters" with a data-share-cta
  //   attribute.
  {
    const path = join(REPO_ROOT, "web", "index.html");
    const fails: string[] = [];
    if (!existsSync(path)) {
      fails.push("web/index.html missing");
    } else {
      const src = readFileSync(path, "utf-8");
      if (/Give it to someone you love/.test(src))
        fails.push('"Give it to someone you love" still in landing');
      if (/Give it to someone\b(?! that matters)/.test(src))
        fails.push('legacy "Give it to someone" still in landing');
      const passAlongCount = (
        src.match(/Pass along to someone that matters/g) ?? []
      ).length;
      if (passAlongCount < 2)
        fails.push(
          `"Pass along to someone that matters" appears ${passAlongCount}× (expected ≥2)`
        );
      const shareCtaCount = (src.match(/data-share-cta/g) ?? []).length;
      if (shareCtaCount < 2)
        fails.push(`data-share-cta attribute appears ${shareCtaCount}× (expected ≥2)`);
    }
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "landing-cta-renamed",
            detail: `landing CTAs renamed to "Pass along to someone that matters" and tagged with data-share-cta`,
          }
        : {
            ok: false,
            assertion: "landing-cta-renamed",
            detail: fails.join("; "),
          }
    );
  }

  // ── C2. landing-share-cta-wiring-component-exists ──────────────────
  //   The client component that copies the share URL on click exists
  //   and is mounted from app/page.tsx.
  {
    const wiringPath = join(
      REPO_ROOT,
      "app",
      "components",
      "LandingShareCtaWiring.tsx"
    );
    const landingPath = join(REPO_ROOT, "app", "page.tsx");
    const fails: string[] = [];
    if (!existsSync(wiringPath)) {
      fails.push("app/components/LandingShareCtaWiring.tsx missing");
    } else {
      const src = readFileSync(wiringPath, "utf-8");
      if (!/"use client"/.test(src))
        fails.push("LandingShareCtaWiring missing 'use client' directive");
      if (!/data-share-cta/.test(src))
        fails.push("LandingShareCtaWiring does not query data-share-cta");
      if (!/navigator\.clipboard/.test(src))
        fails.push("LandingShareCtaWiring does not use navigator.clipboard");
      if (!/the50degreelife\.com\/assessment/.test(src))
        fails.push("LandingShareCtaWiring does not copy the canonical share URL");
    }
    if (!existsSync(landingPath)) {
      fails.push("app/page.tsx missing");
    } else {
      const src = readFileSync(landingPath, "utf-8");
      if (!/<LandingShareCtaWiring\s*\/>/.test(src))
        fails.push("app/page.tsx does not mount <LandingShareCtaWiring />");
    }
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "landing-share-cta-wiring-component-exists",
            detail: `LandingShareCtaWiring is a client component, queries data-share-cta, uses navigator.clipboard, mounted from app/page.tsx`,
          }
        : {
            ok: false,
            assertion: "landing-share-cta-wiring-component-exists",
            detail: fails.join("; "),
          }
    );
  }

  // ── D1. drizzle-schema-adds-contact-columns ────────────────────────
  {
    const path = join(REPO_ROOT, "db", "schema.ts");
    const fails: string[] = [];
    if (!existsSync(path)) {
      fails.push("db/schema.ts missing");
    } else {
      const src = readFileSync(path, "utf-8");
      if (!/contact_email:\s*text\("contact_email"\)/.test(src))
        fails.push("contact_email column missing in schema");
      if (!/contact_mobile:\s*text\("contact_mobile"\)/.test(src))
        fails.push("contact_mobile column missing in schema");
    }
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "drizzle-schema-adds-contact-columns",
            detail: `db/schema.ts adds contact_email (text, nullable) + contact_mobile (text, nullable) to demographics`,
          }
        : {
            ok: false,
            assertion: "drizzle-schema-adds-contact-columns",
            detail: fails.join("; "),
          }
    );
  }

  // ── D2. drizzle-migration-file-exists ──────────────────────────────
  {
    const migDir = join(REPO_ROOT, "db", "migrations");
    const fails: string[] = [];
    if (!existsSync(migDir)) {
      fails.push("db/migrations directory missing");
    } else {
      const files = readdirSync(migDir).filter((f) => f.endsWith(".sql"));
      // Find a migration that adds the contact_email column.
      const matching = files.filter((f) => {
        const src = readFileSync(join(migDir, f), "utf-8");
        return /ADD COLUMN "contact_email"/.test(src);
      });
      if (matching.length === 0)
        fails.push("no migration file adds contact_email column");
      else if (matching.length > 0) {
        const mig = readFileSync(join(migDir, matching[0]), "utf-8");
        if (!/ADD COLUMN "contact_mobile"/.test(mig))
          fails.push(`${matching[0]} adds contact_email but not contact_mobile`);
      }
    }
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "drizzle-migration-file-exists",
            detail: `db/migrations contains a SQL file adding contact_email + contact_mobile`,
          }
        : {
            ok: false,
            assertion: "drizzle-migration-file-exists",
            detail: fails.join("; "),
          }
    );
  }

  // ── D3. save-session-persists-contact-fields ───────────────────────
  {
    const path = join(REPO_ROOT, "lib", "saveSession.ts");
    const fails: string[] = [];
    if (!existsSync(path)) {
      fails.push("lib/saveSession.ts missing");
    } else {
      const src = readFileSync(path, "utf-8");
      if (!/contactEmail/.test(src))
        fails.push("saveSession does not accept contactEmail");
      if (!/contactMobile/.test(src))
        fails.push("saveSession does not accept contactMobile");
      if (!/contact_email\s*=\s*args\.contactEmail/.test(src))
        fails.push("saveSession does not assign contact_email to row");
      if (!/contact_mobile\s*=\s*args\.contactMobile/.test(src))
        fails.push("saveSession does not assign contact_mobile to row");
    }
    results.push(
      fails.length === 0
        ? {
            ok: true,
            assertion: "save-session-persists-contact-fields",
            detail: `saveSession accepts + persists contactEmail + contactMobile into the demographics row`,
          }
        : {
            ok: false,
            assertion: "save-session-persists-contact-fields",
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
    `CC-HEADER-NAV-AND-EMAIL-GATE: ${passed}/${results.length} assertions passing.`
  );
  if (failed > 0) process.exit(1);
}

runAudit().catch((e) => {
  console.error(e);
  process.exit(1);
});
