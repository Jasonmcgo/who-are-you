// CC-021a / CC-130 — Storage layer for researcher-uploaded attachments.
//
// Two backends, selected at call time by the presence of
// `BLOB_READ_WRITE_TOKEN`:
//
//   - **Vercel Blob (production / preview):** when the env var is set,
//     uploads go to a Vercel-managed object store via `@vercel/blob`.
//     `saveAttachmentFile` returns the blob's public URL as the
//     `storage_path` persisted on the attachment row. Reads `fetch()`
//     the URL; deletes call `del()`. The download API route still
//     proxies the bytes, so the admin auth gate stays server-side
//     (the blob URL is public-but-unguessable; bytes only leave via
//     the gated proxy).
//
//   - **Local filesystem (dev fallback):** when the env var is absent,
//     the original CC-021a behavior runs: write under
//     `attachments/<session_id>/<attachment_id>-<sanitized-filename>`
//     and return the relative path. Dev still works without a Vercel
//     Blob store connected.
//
// The three exported function signatures are stable across both
// backends, so the API routes + AttachmentsPanel need no changes
// beyond a one-line `contentType` arg threaded into the POST route.
// Detection at read/delete is by URL shape: `storagePath` that starts
// with `http://` or `https://` → blob; anything else → fs.

import { promises as fs } from "fs";
import path from "path";
import { del, put } from "@vercel/blob";

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

function isBlobBackend(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function looksLikeUrl(storagePath: string): boolean {
  return /^https?:\/\//i.test(storagePath);
}

/**
 * Persist an uploaded attachment.
 *
 * `contentType` is optional for backward-compat with any caller not
 * threading it (the original signature didn't carry it). When present,
 * Vercel Blob uses it as the `Content-Type` header on the stored
 * object — important for inline download / direct-serve scenarios.
 * The fs branch ignores it (the local file has no metadata of its own;
 * the row's `mime_type` column is the source of truth).
 *
 * Returns the value to persist in `attachments.storage_path`:
 *   - Blob branch: the blob's public URL.
 *   - FS branch: the relative path under the attachments root.
 */
export async function saveAttachmentFile(args: {
  sessionId: string;
  attachmentId: string;
  originalFilename: string;
  buffer: Buffer;
  contentType?: string;
}): Promise<string> {
  const safeFilename = sanitizeFilename(args.originalFilename);
  const objectKey = `attachments/${args.sessionId}/${args.attachmentId}-${safeFilename}`;

  if (isBlobBackend()) {
    // CC-130 — Vercel Blob branch. The `access: "public"` flag makes
    // the URL fetchable without an auth header; the URL itself carries
    // an unguessable suffix (we disable Vercel's `addRandomSuffix` so
    // the key is stable, but Vercel's blob URLs are domain-isolated and
    // not enumerable). The download route still proxies the bytes
    // through the admin gate.
    const result = await put(objectKey, args.buffer, {
      access: "public",
      contentType: args.contentType,
      addRandomSuffix: false,
    });
    return result.url;
  }

  // FS fallback (local dev). Same shape as pre-CC-130.
  const dir = path.join(ATTACHMENTS_ROOT, args.sessionId);
  await fs.mkdir(dir, { recursive: true });
  const storagePath = path.join(
    args.sessionId,
    `${args.attachmentId}-${safeFilename}`
  );
  const fullPath = path.join(ATTACHMENTS_ROOT, storagePath);
  await fs.writeFile(fullPath, args.buffer);
  return storagePath;
}

/**
 * Read an attachment's bytes for the admin download proxy.
 *
 * Backend chosen by the shape of `storagePath`: any value starting
 * with `http://` or `https://` is treated as a blob URL and fetched;
 * anything else is treated as a relative filesystem path. This lets
 * rows written under one backend still resolve correctly after the
 * env flips (rows are immutable on `storage_path`).
 */
export async function readAttachmentFile(storagePath: string): Promise<Buffer> {
  if (looksLikeUrl(storagePath)) {
    const res = await fetch(storagePath);
    if (!res.ok) {
      throw new Error(
        `Failed to fetch attachment from blob storage: ${res.status} ${res.statusText}`
      );
    }
    return Buffer.from(await res.arrayBuffer());
  }
  return fs.readFile(path.join(ATTACHMENTS_ROOT, storagePath));
}

/**
 * Delete the persisted file. Idempotent on missing target — a row
 * deleted out-of-band shouldn't break the DELETE handler.
 */
export async function deleteAttachmentFile(storagePath: string): Promise<void> {
  if (looksLikeUrl(storagePath)) {
    try {
      await del(storagePath);
    } catch (err) {
      // `del` may throw on already-deleted blobs; swallow so the
      // route's DB-delete still proceeds. Other surface errors
      // (permissions, network) propagate.
      const message = err instanceof Error ? err.message : String(err);
      if (!/not found|404|already/i.test(message)) throw err;
    }
    return;
  }
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
