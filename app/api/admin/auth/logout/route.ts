// CC-021a — POST /api/admin/auth/logout — clear the session cookie.
// Idempotent: succeeds even if the user wasn't logged in.
//
// The handler issues a 303 redirect to /admin so a plain HTML form-submit
// from the sessions table lands the browser back on the login page after
// the cookie is cleared. fetch callers also follow the redirect by
// default; if a JSON-only client is ever added it can opt out via
// `redirect: "manual"`.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE_NAME = "wru_admin";

export async function POST(req: NextRequest) {
  const url = new URL("/admin", req.url);
  const res = NextResponse.redirect(url, { status: 303 });
  res.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
