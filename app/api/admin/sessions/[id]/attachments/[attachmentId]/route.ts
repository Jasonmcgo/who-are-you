// CC-021a — PATCH (notes update) and DELETE (remove row + file) for a
// single attachment.
//
// Delete order: row first, file second. If the row delete succeeds but the
// file delete throws, the response still returns 200 — the user's intent
// was the metadata removal, and the file system is treated as best-effort.
// `deleteAttachmentFile` swallows ENOENT, so a missing-file delete is a
// no-op rather than an error.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../../../db";
import { attachments as attachmentsTable } from "../../../../../../../db/schema";
import { deleteAttachmentFile } from "../../../../../../../lib/attachmentStorage";
import type { Attachment } from "../../../../../../../lib/types";

export async function PATCH(
  req: NextRequest,
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

  let body: { label?: unknown; notes?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: { label?: string | null; notes?: string | null } = {};
  if (body.label !== undefined) {
    if (body.label === null) {
      updates.label = null;
    } else if (typeof body.label === "string") {
      const trimmed = body.label.trim();
      updates.label = trimmed.length > 0 ? trimmed : null;
    } else {
      return NextResponse.json({ error: "label must be a string or null" }, { status: 400 });
    }
  }
  if (body.notes !== undefined) {
    if (body.notes === null) {
      updates.notes = null;
    } else if (typeof body.notes === "string") {
      const trimmed = body.notes.trim();
      updates.notes = trimmed.length > 0 ? trimmed : null;
    } else {
      return NextResponse.json({ error: "notes must be a string or null" }, { status: 400 });
    }
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "Provide at least one of: label, notes" },
      { status: 400 }
    );
  }

  const updated = await db
    .update(attachmentsTable)
    .set(updates)
    .where(
      and(
        eq(attachmentsTable.id, attachmentId),
        eq(attachmentsTable.session_id, sessionId)
      )
    )
    .returning();
  if (updated.length === 0) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }
  const row = updated[0];
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
  return NextResponse.json(result);
}

export async function DELETE(
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

  const deleted = await db
    .delete(attachmentsTable)
    .where(
      and(
        eq(attachmentsTable.id, attachmentId),
        eq(attachmentsTable.session_id, sessionId)
      )
    )
    .returning({ storage_path: attachmentsTable.storage_path });
  if (deleted.length === 0) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }

  // File cleanup is best-effort: if the unlink fails for a non-ENOENT
  // reason, log it server-side and still return 200 — the user's request
  // was the metadata removal.
  try {
    await deleteAttachmentFile(deleted[0].storage_path);
  } catch (e) {
    console.error(
      `[attachments] file cleanup failed for ${deleted[0].storage_path}:`,
      e
    );
  }
  return NextResponse.json({ ok: true });
}
