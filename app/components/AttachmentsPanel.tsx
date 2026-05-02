// CC-021a — Attachments panel for the researcher UI. Renders the upload
// form at the top and the list of existing attachments below. All actions
// (upload / download / delete / edit notes) talk to the admin API routes;
// success/failure surfaces inline.

"use client";

import { useRef, useState } from "react";
import type { Attachment } from "../../lib/types";

// CC-021c — strict-dropdown options for the label field. The "" default
// returns the field to "no label chosen" so the user can clear a prior
// selection before clicking Upload. Compound / freeform labels are
// covered by the editable Notes field.
const CANONICAL_LABELS = [
  "LLM rewrite",
  "Interview notes",
  "Consent form",
  "Audio recording",
  "Screenshot",
  "Other",
];

// CC-021c — accept hint for the file picker dialog. Mirrors the server-
// side ALLOWED_MIME_TYPES set in lib/attachmentStorage.ts but stays a
// UX hint only; the server is the authoritative gate.
const FILE_ACCEPT_HINT = [
  ".txt", ".md", ".csv", ".json", ".pdf",
  ".png", ".jpg", ".jpeg", ".webp", ".gif",
  ".mp3", ".m4a", ".wav",
  ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".rtf",
].join(",");

type Props = {
  sessionId: string;
  initialAttachments: Attachment[];
  onAttachmentsChange?: (next: Attachment[]) => void;
};

export default function AttachmentsPanel({
  sessionId,
  initialAttachments,
  onAttachmentsChange,
}: Props) {
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [statusFlash, setStatusFlash] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);
  // CC-021c — keep a ref on the file input so we can clear it via
  // `inputRef.current.value = ""` after a successful upload. The previous
  // `(e.target as HTMLFormElement).reset()` would also nuke the controlled
  // <select>'s DOM value — fine while React re-controls it from state, but
  // brittle if a future input expects DOM-level defaults.
  const fileInputRef = useRef<HTMLInputElement>(null);

  function commit(next: Attachment[]) {
    setAttachments(next);
    onAttachmentsChange?.(next);
  }

  // CC-021c — named handler so it doesn't recreate per render and so the
  // synchronous capture of `e.target.files?.[0]` is explicit. React 19's
  // synthetic events are still pooled in some runtimes; capturing first
  // before the awaited setState is the defensive pattern.
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null;
    setFile(picked);
    // Clear any "Pick a file first" error the moment the user picks one.
    if (picked && statusFlash?.text === "Pick a file first.") {
      setStatusFlash(null);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setStatusFlash({ kind: "err", text: "Pick a file first." });
      return;
    }
    setUploading(true);
    setStatusFlash(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (label.trim()) fd.append("label", label.trim());
      if (notes.trim()) fd.append("notes", notes.trim());
      const res = await fetch(
        `/api/admin/sessions/${sessionId}/attachments`,
        { method: "POST", body: fd }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg =
          typeof body?.error === "string"
            ? body.error
            : `Upload failed (${res.status})`;
        setStatusFlash({ kind: "err", text: msg });
        return;
      }
      const created: Attachment = await res.json();
      commit([...attachments, created]);
      setFile(null);
      setLabel("");
      setNotes("");
      // CC-021c — clear the file input's DOM value so the same file can
      // be re-picked if the user wants to. (Native file inputs don't fire
      // onChange when the same file is reselected unless the value is
      // cleared first.) Avoids the form.reset() that previously also
      // touched the controlled <select>.
      if (fileInputRef.current) fileInputRef.current.value = "";
      setStatusFlash({ kind: "ok", text: "Uploaded." });
    } catch (err) {
      setStatusFlash({
        kind: "err",
        text: err instanceof Error ? err.message : "Upload failed.",
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(att: Attachment) {
    const ok = window.confirm(
      `Delete "${att.filename}"? This removes both the database row and the file on disk.`
    );
    if (!ok) return;
    try {
      const res = await fetch(
        `/api/admin/sessions/${sessionId}/attachments/${att.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setStatusFlash({
          kind: "err",
          text:
            typeof body?.error === "string"
              ? body.error
              : `Delete failed (${res.status})`,
        });
        return;
      }
      commit(attachments.filter((a) => a.id !== att.id));
      setStatusFlash({ kind: "ok", text: "Deleted." });
    } catch (err) {
      setStatusFlash({
        kind: "err",
        text: err instanceof Error ? err.message : "Delete failed.",
      });
    }
  }

  async function handleSaveNotes(att: Attachment, nextNotes: string) {
    try {
      const res = await fetch(
        `/api/admin/sessions/${sessionId}/attachments/${att.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: nextNotes }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setStatusFlash({
          kind: "err",
          text:
            typeof body?.error === "string"
              ? body.error
              : `Update failed (${res.status})`,
        });
        return false;
      }
      const updated: Attachment = await res.json();
      commit(attachments.map((a) => (a.id === att.id ? updated : a)));
      setStatusFlash({ kind: "ok", text: "Notes saved." });
      return true;
    } catch (err) {
      setStatusFlash({
        kind: "err",
        text: err instanceof Error ? err.message : "Update failed.",
      });
      return false;
    }
  }

  return (
    <section
      className="flex flex-col"
      style={{
        gap: 16,
        padding: 16,
        background: "var(--paper-warm)",
        border: "1px solid var(--rule)",
        borderRadius: 8,
      }}
    >
      <header className="flex flex-col" style={{ gap: 4 }}>
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.16em",
            color: "var(--ink-mute)",
            margin: 0,
          }}
        >
          Attachments
        </p>
        <p
          className="font-serif italic"
          style={{
            fontSize: 13,
            color: "var(--ink-soft)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Upload LLM rewrites, interview notes, audio, or any other file
          associated with this session.
        </p>
      </header>

      <form
        onSubmit={handleUpload}
        className="flex flex-col"
        style={{
          gap: 8,
          paddingBottom: 16,
          borderBottom: "1px solid var(--rule-soft)",
        }}
      >
        {/* CC-021c — uncontrolled native file input with explicit name +
            ref. Visible "Selected: filename" feedback below confirms the
            React state update without the user having to trust the
            (browser-rendered) "no file chosen" text. */}
        <label className="flex flex-col" style={{ gap: 4 }}>
          <span
            className="font-mono uppercase"
            style={{
              fontSize: 10,
              letterSpacing: "0.12em",
              color: "var(--ink-mute)",
            }}
          >
            File
          </span>
          <input
            ref={fileInputRef}
            type="file"
            name="file"
            accept={FILE_ACCEPT_HINT}
            onChange={handleFileChange}
            data-focus-ring
            style={{ fontSize: 13 }}
          />
          {file ? (
            <p
              className="font-mono"
              style={{
                fontSize: 11,
                color: "var(--ink-soft)",
                margin: 0,
              }}
            >
              Selected: {file.name} ({formatSize(file.size)})
            </p>
          ) : null}
        </label>
        <label className="flex flex-col" style={{ gap: 4 }}>
          <span
            className="font-mono uppercase"
            style={{
              fontSize: 10,
              letterSpacing: "0.12em",
              color: "var(--ink-mute)",
            }}
          >
            Label (optional)
          </span>
          {/* CC-021c — strict <select> instead of <input list>. The empty
              "" option lets the user clear a prior selection by re-picking
              "— select —". Compound / freeform labels move to the editable
              Notes field. */}
          <select
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            data-focus-ring
            className="font-serif"
            style={{
              background: "var(--paper)",
              color: "var(--ink)",
              border: "1px solid var(--rule)",
              padding: "7px 10px",
              fontSize: 13,
              borderRadius: 6,
            }}
          >
            <option value="">— select —</option>
            {CANONICAL_LABELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col" style={{ gap: 4 }}>
          <span
            className="font-mono uppercase"
            style={{
              fontSize: 10,
              letterSpacing: "0.12em",
              color: "var(--ink-mute)",
            }}
          >
            Notes (optional)
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            data-focus-ring
            rows={2}
            className="font-serif"
            style={{
              background: "var(--paper)",
              color: "var(--ink)",
              border: "1px solid var(--rule)",
              padding: "7px 10px",
              fontSize: 13,
              borderRadius: 6,
              resize: "vertical",
            }}
          />
        </label>
        <button
          type="submit"
          disabled={uploading || !file}
          data-focus-ring
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.08em",
            background:
              uploading || !file ? "transparent" : "var(--umber)",
            color: uploading || !file ? "var(--ink-faint)" : "var(--paper)",
            border:
              uploading || !file
                ? "1px solid var(--rule)"
                : "1px solid var(--umber)",
            padding: "8px 14px",
            borderRadius: 6,
            cursor: uploading || !file ? "not-allowed" : "pointer",
            alignSelf: "flex-start",
          }}
        >
          {uploading ? "Uploading…" : "Upload"}
        </button>
        {statusFlash ? (
          <p
            role={statusFlash.kind === "err" ? "alert" : "status"}
            className="font-serif italic"
            style={{
              fontSize: 12,
              color:
                statusFlash.kind === "err" ? "var(--umber)" : "var(--ink-soft)",
              margin: 0,
            }}
          >
            {statusFlash.text}
          </p>
        ) : null}
      </form>

      {attachments.length === 0 ? (
        <p
          className="font-serif italic"
          style={{
            fontSize: 13,
            color: "var(--ink-soft)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          No attachments yet. Upload an LLM rewrite, interview notes, or any
          other file you want associated with this session.
        </p>
      ) : (
        <div className="flex flex-col" style={{ gap: 12 }}>
          {attachments.map((att) => (
            <AttachmentCard
              key={att.id}
              sessionId={sessionId}
              att={att}
              onDelete={() => handleDelete(att)}
              onSaveNotes={(n) => handleSaveNotes(att, n)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatRelative(iso: string): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return iso;
  const diffMs = Date.now() - then;
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month}mo ago`;
  return `${Math.floor(month / 12)}y ago`;
}

function AttachmentCard({
  sessionId,
  att,
  onDelete,
  onSaveNotes,
}: {
  sessionId: string;
  att: Attachment;
  onDelete: () => void;
  onSaveNotes: (next: string) => Promise<boolean>;
}) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [draftNotes, setDraftNotes] = useState(att.notes ?? "");
  const [saving, setSaving] = useState(false);

  const downloadHref = `/api/admin/sessions/${sessionId}/attachments/${att.id}/download`;

  async function handleSave() {
    setSaving(true);
    const ok = await onSaveNotes(draftNotes);
    setSaving(false);
    if (ok) setEditingNotes(false);
  }

  return (
    <article
      className="flex flex-col"
      style={{
        gap: 8,
        padding: 12,
        background: "var(--paper)",
        border: "1px solid var(--rule)",
        borderRadius: 6,
      }}
    >
      <div
        className="flex flex-row items-baseline"
        style={{ gap: 8, flexWrap: "wrap" }}
      >
        <p
          className="font-serif"
          style={{
            fontSize: 14,
            color: "var(--ink)",
            margin: 0,
            wordBreak: "break-all",
          }}
        >
          {att.filename}
        </p>
        {att.label ? (
          <span
            className="font-mono uppercase"
            style={{
              fontSize: 10,
              letterSpacing: "0.08em",
              padding: "2px 8px",
              background: "var(--umber-wash)",
              color: "var(--umber)",
              borderRadius: 999,
            }}
          >
            {att.label}
          </span>
        ) : null}
      </div>
      <p
        className="font-mono"
        style={{
          fontSize: 11,
          color: "var(--ink-mute)",
          margin: 0,
        }}
      >
        {formatSize(att.size_bytes)} · uploaded {formatRelative(att.uploaded_at)}
      </p>
      {!editingNotes && att.notes ? (
        <p
          className="font-serif italic"
          style={{
            fontSize: 13,
            color: "var(--ink-soft)",
            margin: 0,
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
          }}
        >
          {att.notes}
        </p>
      ) : null}
      {editingNotes ? (
        <div className="flex flex-col" style={{ gap: 6 }}>
          <textarea
            value={draftNotes}
            onChange={(e) => setDraftNotes(e.target.value)}
            data-focus-ring
            rows={3}
            className="font-serif"
            style={{
              background: "var(--paper-warm)",
              color: "var(--ink)",
              border: "1px solid var(--rule)",
              padding: "7px 10px",
              fontSize: 13,
              borderRadius: 6,
              resize: "vertical",
            }}
          />
          <div className="flex flex-row" style={{ gap: 6 }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              data-focus-ring
              className="font-mono uppercase"
              style={{
                fontSize: 10,
                letterSpacing: "0.08em",
                background: saving ? "transparent" : "var(--umber)",
                color: saving ? "var(--ink-faint)" : "var(--paper)",
                border: "1px solid var(--umber)",
                padding: "5px 10px",
                borderRadius: 4,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingNotes(false);
                setDraftNotes(att.notes ?? "");
              }}
              data-focus-ring
              className="font-mono uppercase"
              style={{
                fontSize: 10,
                letterSpacing: "0.08em",
                background: "transparent",
                color: "var(--ink-mute)",
                border: "1px solid var(--rule)",
                padding: "5px 10px",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
      <div
        className="flex flex-row"
        style={{ gap: 6, paddingTop: 4, flexWrap: "wrap" }}
      >
        <a
          href={downloadHref}
          download={att.filename}
          data-focus-ring
          className="font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.08em",
            background: "transparent",
            color: "var(--ink)",
            border: "1px solid var(--rule)",
            padding: "5px 10px",
            borderRadius: 4,
            textDecoration: "none",
          }}
        >
          Download
        </a>
        {!editingNotes ? (
          <button
            type="button"
            onClick={() => setEditingNotes(true)}
            data-focus-ring
            className="font-mono uppercase"
            style={{
              fontSize: 10,
              letterSpacing: "0.08em",
              background: "transparent",
              color: "var(--ink)",
              border: "1px solid var(--rule)",
              padding: "5px 10px",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Edit notes
          </button>
        ) : null}
        <button
          type="button"
          onClick={onDelete}
          data-focus-ring
          className="font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.08em",
            background: "transparent",
            color: "var(--umber)",
            border: "1px solid var(--rule)",
            padding: "5px 10px",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
