// CC-021a — Filesystem layer for researcher-uploaded attachments.
//
// Storage shape: attachments/<session_id>/<attachment_id>-<sanitized-filename>
// The relative path under the project root is what gets stored in the
// `attachments.storage_path` column. The bytes are never read into Postgres.
//
// Local-first: the same module will be replaced (or wrapped) by an object-
// storage adapter (S3 / R2 / Vercel Blob) when CC-021b lands cloud deploy.
// Until then, the project root's attachments/ directory IS the bucket.
//
// All file operations are async and idempotent on cleanup — see
// deleteAttachmentFile for the rationale.

import { promises as fs } from "fs";
import path from "path";

const ATTACHMENTS_ROOT = path.join(process.cwd(), "attachments");

export const ALLOWED_MIME_TYPES = new Set<string>([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  // CC-021c — Office documents. Researchers commonly upload Word interview
  // notes; the .doc / .docx pair plus their Excel and PowerPoint siblings
  // and RTF cover the bulk of real research workflows.
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-excel", // .xls
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-powerpoint", // .ppt
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "application/rtf", // .rtf
]);

export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;

export async function saveAttachmentFile(args: {
  sessionId: string;
  attachmentId: string;
  originalFilename: string;
  buffer: Buffer;
}): Promise<string> {
  const dir = path.join(ATTACHMENTS_ROOT, args.sessionId);
  await fs.mkdir(dir, { recursive: true });
  const safeFilename = sanitizeFilename(args.originalFilename);
  const storagePath = path.join(
    args.sessionId,
    `${args.attachmentId}-${safeFilename}`
  );
  const fullPath = path.join(ATTACHMENTS_ROOT, storagePath);
  await fs.writeFile(fullPath, args.buffer);
  return storagePath;
}

export async function readAttachmentFile(storagePath: string): Promise<Buffer> {
  return fs.readFile(path.join(ATTACHMENTS_ROOT, storagePath));
}

export async function deleteAttachmentFile(storagePath: string): Promise<void> {
  try {
    await fs.unlink(path.join(ATTACHMENTS_ROOT, storagePath));
  } catch (err) {
    // Idempotent: a missing file is a no-op (user may have removed it
    // out-of-band). Surface other errors (permissions, IO) so the caller
    // can react.
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}

// Filenames travel from the browser; trust nothing. Strip everything that
// isn't a safe shell-friendly character and clamp the length so the resulting
// path stays well under the OS limit when joined with the UUID prefix.
function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
  return cleaned.length > 0 ? cleaned : "file";
}
