// CC-021a — POST /api/admin/auth — verify the passcode and set the session
// cookie. Body: { passcode: string }. Returns 200 + Set-Cookie on success;
// 401 on mismatch. The middleware allows this route through unauthenticated
// (it's the only way in).

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE_NAME = "wru_admin";
const SEVEN_DAYS_SECONDS = 60 * 60 * 24 * 7;

export async function POST(req: NextRequest) {
  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) {
    // Configuration error — admin is locked until the user adds the env
    // var. Return 500 so the failure mode is loud rather than silently
    // accepting any passcode.
    return NextResponse.json(
      {
        error:
          "ADMIN_PASSCODE is not set on the server. Add it to .env.local and restart the dev server.",
      },
      { status: 500 }
    );
  }

  let body: { passcode?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const submitted = typeof body?.passcode === "string" ? body.passcode : "";

  if (submitted !== expected) {
    return NextResponse.json(
      { error: "Invalid passcode" },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "ok",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SEVEN_DAYS_SECONDS,
    // secure: true in production via the deploy config; left off here
    // because dev runs over plain HTTP on localhost.
  });
  return res;
}
