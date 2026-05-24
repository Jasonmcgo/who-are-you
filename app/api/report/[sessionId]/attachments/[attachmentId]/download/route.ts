// CC-165 — PUBLIC attachment download route, served from the report
// permalink. Same shape as the admin download route but the WHERE
// clause additionally requires `shared_with_individual = true`, so
// non-shared rows are unreachable from this surface no matter what id
// the caller supplies.
//
// Trust model: the unguessable session-id in the URL is the access
// token (same trust model as the report permalink itself). No admin
// auth. The shared-flag gate is what limits which attachments are
// reachable through this route.
//
// 404 is intentionally generic ("Attachment not found") and applied
// equally to: wrong id / wrong session / row exists but not shared.
// We never distinguish "exists but not shared" from "doesn't exist"
// because doing so would leak which attachments exist on a session.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../../../db";
import { attachments as attachmentsTable } from "../../../../../../../db/schema";
import { readAttachmentFile } from "../../../../../../../lib/attachmentStorage";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string; attachmentId: string }> }
) {
  const { sessionId, attachmentId } = await params;

  let db;
  try {
    db = getDb();
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "Database connection failed.",
      },
      { status: 500 }
    );
  }

  const rows = await db
    .select()
    .from(attachmentsTable)
    .where(
      and(
        eq(attachmentsTable.id, attachmentId),
        eq(attachmentsTable.session_id, sessionId),
        // CC-165 — the critical gate. Without this, the public route
        // would expose admin-only files to anyone holding the session
        // id. SQL-level enforcement (not an in-memory filter after the
        // fact) so there is no window where the row's bytes are loaded
        // into the handler before the flag is checked.
        eq(attachmentsTable.shared_with_individual, true)
      )
    )
    .limit(1);
  if (rows.length === 0) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }
  const row = rows[0];

  let bytes: Buffer;
  try {
    bytes = await readAttachmentFile(row.storage_path);
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? `Failed to read attachment: ${e.message}`
            : "Failed to read attachment.",
      },
      { status: 500 }
    );
  }

  // Same Content-Disposition handling as the admin route — RFC 6266:
  // backslash-escape any double-quote in the filename.
  const safeName = row.filename.replace(/"/g, '\\"');
  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": row.mime_type || "application/octet-stream",
      "Content-Length": String(row.size_bytes),
      "Content-Disposition": `attachment; filename="${safeName}"`,
    },
  });
}
