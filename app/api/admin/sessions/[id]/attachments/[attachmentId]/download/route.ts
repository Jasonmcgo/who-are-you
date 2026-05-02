// CC-021a — GET /api/admin/sessions/[id]/attachments/[attachmentId]/download
// Streams the attachment file back to the browser with the original
// filename preserved in Content-Disposition. The MIME type comes from the
// stored row, not the disk, so a renamed file on disk doesn't poison the
// response header.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../../../../db";
import { attachments as attachmentsTable } from "../../../../../../../../db/schema";
import { readAttachmentFile } from "../../../../../../../../lib/attachmentStorage";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const { id: sessionId, attachmentId } = await params;

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
        eq(attachmentsTable.session_id, sessionId)
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

  // Quote-escape the filename for Content-Disposition. RFC 6266: any
  // double-quote in the filename must be backslash-escaped.
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
