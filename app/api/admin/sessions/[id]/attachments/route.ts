// CC-021a — POST /api/admin/sessions/[id]/attachments — upload a file. The
// body is multipart/form-data with one File field (`file`) and two optional
// text fields (`label`, `notes`). The handler validates the MIME type +
// size, generates the attachment id (UUID), persists the row, and writes
// the bytes under attachments/<session_id>/<attachment_id>-<safe-name>.
//
// Order of operations matters: insert the row first so the storage path
// (which references the freshly-generated attachment id) is determined
// before the disk write. If the disk write fails, the row is rolled back
// so the table never points at a missing file.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getDb } from "../../../../../../db";
import {
  attachments as attachmentsTable,
  sessions as sessionsTable,
} from "../../../../../../db/schema";
import {
  ALLOWED_MIME_TYPES,
  MAX_ATTACHMENT_SIZE_BYTES,
  saveAttachmentFile,
} from "../../../../../../lib/attachmentStorage";
import type { Attachment } from "../../../../../../lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

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

  // Confirm the session exists before accepting bytes; spares a wasted
  // disk write when the user pastes a stale URL.
  const sessionRows = await db
    .select({ id: sessionsTable.id })
    .from(sessionsTable)
    .where(eq(sessionsTable.id, sessionId))
    .limit(1);
  if (sessionRows.length === 0) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Pre-flight Content-Length check — multipart parsing can fail on
  // oversized bodies before our per-file cap runs, which would surface as
  // a misleading "expected multipart" error. Catch it here with the clean
  // size message. Multipart adds boundary overhead so the threshold is
  // generous (cap + 1 MiB headroom).
  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_ATTACHMENT_SIZE_BYTES + 1024 * 1024
  ) {
    return NextResponse.json(
      {
        error: `Request body exceeds the ${MAX_ATTACHMENT_SIZE_BYTES} byte (${
          MAX_ATTACHMENT_SIZE_BYTES / (1024 * 1024)
        } MB) per-file limit.`,
      },
      { status: 400 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data body" },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing required form field: file" },
      { status: 400 }
    );
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      {
        error: `Disallowed MIME type: ${file.type || "(unknown)"}. Allowed: ${[
          ...ALLOWED_MIME_TYPES,
        ].join(", ")}.`,
      },
      { status: 400 }
    );
  }

  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return NextResponse.json(
      {
        error: `File exceeds the ${MAX_ATTACHMENT_SIZE_BYTES} byte (${
          MAX_ATTACHMENT_SIZE_BYTES / (1024 * 1024)
        } MB) limit.`,
      },
      { status: 400 }
    );
  }

  const labelRaw = formData.get("label");
  const notesRaw = formData.get("notes");
  const label =
    typeof labelRaw === "string" && labelRaw.trim().length > 0
      ? labelRaw.trim()
      : null;
  const notes =
    typeof notesRaw === "string" && notesRaw.trim().length > 0
      ? notesRaw.trim()
      : null;

  const attachmentId = randomUUID();
  const buffer = Buffer.from(await file.arrayBuffer());

  // Write the file first; on success, persist the metadata. If the write
  // throws, no row is created and the request fails cleanly.
  let storagePath: string;
  try {
    storagePath = await saveAttachmentFile({
      sessionId,
      attachmentId,
      originalFilename: file.name,
      buffer,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "Failed to write attachment to disk.",
      },
      { status: 500 }
    );
  }

  const inserted = await db
    .insert(attachmentsTable)
    .values({
      id: attachmentId,
      session_id: sessionId,
      filename: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      storage_path: storagePath,
      label,
      notes,
    })
    .returning();
  const row = inserted[0];

  const result: Attachment = {
    id: row.id,
    session_id: row.session_id,
    uploaded_at: row.uploaded_at.toISOString(),
    filename: row.filename,
    mime_type: row.mime_type,
    size_bytes: row.size_bytes,
    storage_path: row.storage_path,
    label: row.label,
    notes: row.notes,
  };
  return NextResponse.json(result, { status: 201 });
}
