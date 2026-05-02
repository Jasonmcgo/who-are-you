// CC-021a — Researcher-UI gate. Next.js auto-discovers middleware.ts at the
// project root and runs it before every request matching `config.matcher`.
//
// Auth model: a single shared passcode lives in `process.env.ADMIN_PASSCODE`.
// The login page at `/admin` posts the passcode to `POST /api/admin/auth`,
// which sets the `wru_admin=ok` cookie on success. This middleware then
// gates every other `/admin/*` and `/api/admin/*` request on that cookie.
//
// This is intentionally simple-by-design auth, appropriate for a single-
// user local-dev tool. It is NOT production-grade — CC-021c will replace
// it with a real auth provider when cloud deploy lands.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE_NAME = "wru_admin";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow the login surface itself (the form lives here).
  if (pathname === "/admin" || pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Allow the auth API routes (login + logout). Both are unauthenticated:
  // login obviously can't require the cookie it's about to set, and logout
  // should still succeed if the cookie is missing or malformed.
  if (pathname.startsWith("/api/admin/auth")) {
    return NextResponse.next();
  }

  // Gate everything else under /admin and /api/admin.
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const cookie = req.cookies.get(ADMIN_COOKIE_NAME);
    if (!cookie || cookie.value !== "ok") {
      // For API requests, returning a 401 keeps the response well-typed
      // for `fetch` callers; for page navigation we prefer a redirect so
      // the browser lands on the login form.
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      const redirect = new URL("/admin", req.url);
      return NextResponse.redirect(redirect);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
