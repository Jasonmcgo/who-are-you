"use client";

// CC-087-ADMIN-DEMOGRAPHIC-EDIT — per-field demographic edit form. One row
// per demographic field (plus contact_email + contact_mobile). Each row
// shows the current value/state with an EDIT button; clicking EDIT swaps
// the row to an inline form with the appropriate input type (text vs
// select vs select_with_other) plus a "Prefer not to say" toggle and
// Save / Cancel buttons.
//
// Each save call hits the `updateSessionDemographicField` server action
// in `lib/saveSession.ts` — surgical single-field update + one
// ghost_mapping_audit entry. The admin label + optional note inputs are
// shared across all rows (the admin types their name once at the top).
//
// Visual register matches `/admin/sessions/[id]/answers` — same row
// shell (border, padding, mono labels, italic helper text, "Edit" button
// styling) so the two pages read as a single admin tooling surface.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { updateSessionDemographicField } from "../../../../../lib/saveSession";
import type {
  DemographicField,
  FieldState,
} from "../../../../../data/demographics";

// All 11 editable fields. The 9 demographic fields come from
// DEMOGRAPHIC_FIELDS; the 2 contact fields are bolted on at the end.
type DemoFieldKey =
  | "name"
  | "gender"
  | "age"
  | "location"
  | "marital_status"
  | "education"
  | "political"
  | "religious"
  | "profession"
  | "contact_email"
  | "contact_mobile";

type ValueStatePair = {
  state: FieldState;
  value: string | null;
};

type LocationPair = {
  state: FieldState;
  country: string | null;
  region: string | null;
};

export type DemographicsSnapshot = {
  name: ValueStatePair;
  gender: ValueStatePair;
  age: ValueStatePair;
  location: LocationPair;
  marital_status: ValueStatePair;
  education: ValueStatePair;
  political: ValueStatePair;
  religious: ValueStatePair;
  profession: ValueStatePair;
  contact_email: string | null;
  contact_mobile: string | null;
};

interface Props {
  sessionId: string;
  initial: DemographicsSnapshot;
  fields: DemographicField[];
}

const CONTACT_EMAIL_FIELD: DemographicField = {
  field_id: "contact_email",
  question: "Contact email",
  helper:
    "Required at the user-facing email gate, but admin can attach/clear it here.",
  type: "freeform",
  prefer_not_to_say_label: "Prefer not to say",
};

const CONTACT_MOBILE_FIELD: DemographicField = {
  field_id: "contact_mobile",
  question: "Contact mobile",
  helper: "Optional. Stored raw — preserve the user's formatting.",
  type: "freeform",
  prefer_not_to_say_label: "Prefer not to say",
};

export default function DemographicEditForm({
  sessionId,
  initial,
  fields,
}: Props) {
  const router = useRouter();
  const [adminLabel, setAdminLabel] = useState("");
  const [note, setNote] = useState("");
  const [editingKey, setEditingKey] = useState<DemoFieldKey | null>(null);
  const [flash, setFlash] = useState<
    | {
        kind: "ok";
        fieldKey: DemoFieldKey;
        detail: string;
      }
    | {
        kind: "err";
        detail: string;
      }
    | null
  >(null);
  const [pending, startTransition] = useTransition();

  // The form mutates the local snapshot optimistically on success so the
  // next render shows the just-saved value without a round-trip. The
  // server-component refresh below keeps the DB as the source of truth
  // for any later visit.
  const [snapshot, setSnapshot] = useState<DemographicsSnapshot>(initial);

  function handleSave(args: {
    fieldKey: DemoFieldKey;
    state: FieldState;
    value: string | null;
  }) {
    if (adminLabel.trim().length === 0) {
      setFlash({
        kind: "err",
        detail: "admin label required (who is doing this edit) — fill in the field above",
      });
      return;
    }
    setFlash(null);
    startTransition(async () => {
      try {
        await updateSessionDemographicField({
          sessionId,
          fieldKey: args.fieldKey,
          state: args.state,
          value: args.state === "specified" ? args.value : null,
          adminLabel: adminLabel.trim(),
          note: note.trim().length > 0 ? note.trim() : undefined,
        });
        // Optimistic local update.
        setSnapshot((prev) =>
          applyLocalEdit(prev, args.fieldKey, args.state, args.value)
        );
        setEditingKey(null);
        setFlash({
          kind: "ok",
          fieldKey: args.fieldKey,
          detail: `${args.fieldKey} saved`,
        });
        // Re-fetch the server component so any later EDIT sees the
        // current DB state (in case the local apply missed an edge).
        router.refresh();
      } catch (err) {
        setFlash({
          kind: "err",
          detail: (err as Error).message,
        });
      }
    });
  }

  function handleCancel() {
    setEditingKey(null);
  }

  // ── Admin label / note header (required for every save) ──────────────
  return (
    <>
      <section
        style={{
          border: "1px solid var(--rule, #d4c8a8)",
          background: "var(--paper, #f7f1e6)",
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            color: "var(--ink-mute)",
            margin: 0,
          }}
        >
          who is doing this edit (required)
        </p>
        <input
          type="text"
          value={adminLabel}
          onChange={(e) => setAdminLabel(e.target.value)}
          placeholder="e.g., Jason · 2026-05-16"
          required
          style={inputStyle}
        />
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            color: "var(--ink-mute)",
            margin: "8px 0 0 0",
          }}
        >
          note (optional)
        </p>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g., fingerprint match via Q-A2"
          style={inputStyle}
        />
        {flash ? (
          <p
            role="status"
            style={{
              margin: "8px 0 0 0",
              fontSize: 12,
              color:
                flash.kind === "ok"
                  ? "var(--ok, #2a6a3a)"
                  : "var(--danger, #a83a3a)",
            }}
          >
            {flash.kind === "ok" ? "✓ " : "✕ "}
            {flash.kind === "ok"
              ? `${flash.fieldKey} saved`
              : flash.detail}
          </p>
        ) : null}
      </section>

      {fields.map((f) => {
        const key = f.field_id as DemoFieldKey;
        return (
          <EditableRow
            key={key}
            fieldKey={key}
            field={f}
            snapshot={snapshot}
            isEditing={editingKey === key}
            pending={pending}
            onBeginEdit={() => setEditingKey(key)}
            onCancel={handleCancel}
            onSave={handleSave}
          />
        );
      })}

      <EditableRow
        key="contact_email"
        fieldKey="contact_email"
        field={CONTACT_EMAIL_FIELD}
        snapshot={snapshot}
        isEditing={editingKey === "contact_email"}
        pending={pending}
        onBeginEdit={() => setEditingKey("contact_email")}
        onCancel={handleCancel}
        onSave={handleSave}
      />
      <EditableRow
        key="contact_mobile"
        fieldKey="contact_mobile"
        field={CONTACT_MOBILE_FIELD}
        snapshot={snapshot}
        isEditing={editingKey === "contact_mobile"}
        pending={pending}
        onBeginEdit={() => setEditingKey("contact_mobile")}
        onCancel={handleCancel}
        onSave={handleSave}
      />
    </>
  );
}

// ── EditableRow ────────────────────────────────────────────────────────

function EditableRow({
  fieldKey,
  field,
  snapshot,
  isEditing,
  pending,
  onBeginEdit,
  onCancel,
  onSave,
}: {
  fieldKey: DemoFieldKey;
  field: DemographicField;
  snapshot: DemographicsSnapshot;
  isEditing: boolean;
  pending: boolean;
  onBeginEdit: () => void;
  onCancel: () => void;
  onSave: (args: {
    fieldKey: DemoFieldKey;
    state: FieldState;
    value: string | null;
  }) => void;
}) {
  const display = displayForField(fieldKey, snapshot);

  return (
    <section
      style={{
        border: "1px solid var(--rule, #d4c8a8)",
        background: "var(--paper, #f7f1e6)",
        padding: "12px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <p
            className="font-mono uppercase"
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              color: "var(--ink-mute)",
              margin: 0,
            }}
          >
            {fieldKey} · {display.stateLabel}
          </p>
          <p
            className="font-serif"
            style={{
              fontSize: 14,
              color: "var(--ink, #2b2417)",
              margin: 0,
              lineHeight: 1.45,
            }}
          >
            {field.question}
          </p>
          {field.helper ? (
            <p
              className="font-serif italic"
              style={{
                fontSize: 12,
                color: "var(--ink-mute, #6a5d40)",
                margin: 0,
                lineHeight: 1.45,
              }}
            >
              {field.helper}
            </p>
          ) : null}
        </div>
        {!isEditing ? (
          <button
            type="button"
            onClick={onBeginEdit}
            className="font-mono uppercase"
            style={editBtnStyle}
          >
            Edit
          </button>
        ) : null}
      </div>

      {isEditing ? (
        <FieldEditor
          fieldKey={fieldKey}
          field={field}
          snapshot={snapshot}
          pending={pending}
          onCancel={onCancel}
          onSave={onSave}
        />
      ) : (
        <ReadOnlyValue display={display} />
      )}
    </section>
  );
}

// ── Display helpers ────────────────────────────────────────────────────

type FieldDisplay = {
  stateLabel: string;
  valueLabel: string | null;
};

function displayForField(
  fieldKey: DemoFieldKey,
  snapshot: DemographicsSnapshot
): FieldDisplay {
  if (fieldKey === "contact_email") {
    return {
      stateLabel: snapshot.contact_email ? "set" : "not set",
      valueLabel: snapshot.contact_email,
    };
  }
  if (fieldKey === "contact_mobile") {
    return {
      stateLabel: snapshot.contact_mobile ? "set" : "not set",
      valueLabel: snapshot.contact_mobile,
    };
  }
  if (fieldKey === "location") {
    const loc = snapshot.location;
    const combined =
      loc.state === "specified"
        ? [loc.country, loc.region].filter(Boolean).join(" | ")
        : null;
    return {
      stateLabel: loc.state,
      valueLabel: combined && combined.length > 0 ? combined : null,
    };
  }
  const pair = snapshot[fieldKey] as ValueStatePair;
  return {
    stateLabel: pair.state,
    valueLabel: pair.state === "specified" ? pair.value : null,
  };
}

function ReadOnlyValue({ display }: { display: FieldDisplay }) {
  if (display.valueLabel && display.valueLabel.length > 0) {
    return (
      <p
        className="font-serif"
        style={{
          fontSize: 13.5,
          color: "var(--ink, #2b2417)",
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {display.valueLabel}
      </p>
    );
  }
  return (
    <p
      className="font-serif italic"
      style={{
        fontSize: 13,
        color: "var(--ink-mute, #6a5d40)",
        margin: 0,
        lineHeight: 1.5,
      }}
    >
      —
    </p>
  );
}

// ── FieldEditor ────────────────────────────────────────────────────────

function FieldEditor({
  fieldKey,
  field,
  snapshot,
  pending,
  onCancel,
  onSave,
}: {
  fieldKey: DemoFieldKey;
  field: DemographicField;
  snapshot: DemographicsSnapshot;
  pending: boolean;
  onCancel: () => void;
  onSave: (args: {
    fieldKey: DemoFieldKey;
    state: FieldState;
    value: string | null;
  }) => void;
}) {
  const current = displayForField(fieldKey, snapshot);
  const [state, setState] = useState<FieldState>(
    fieldKey === "contact_email" || fieldKey === "contact_mobile"
      ? "specified"
      : ((): FieldState => {
          if (fieldKey === "location") return snapshot.location.state;
          return (snapshot[fieldKey] as ValueStatePair).state;
        })()
  );
  const [value, setValue] = useState<string>(current.valueLabel ?? "");

  function submit() {
    if (state === "specified") {
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        // Coerce empty-string saves into not_answered to avoid storing
        // a state=specified with no value.
        onSave({ fieldKey, state: "not_answered", value: null });
        return;
      }
      onSave({ fieldKey, state: "specified", value: trimmed });
      return;
    }
    onSave({ fieldKey, state, value: null });
  }

  const showPnTSToggle = fieldKey !== "contact_email" && fieldKey !== "contact_mobile";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        marginTop: 4,
      }}
    >
      {showPnTSToggle ? (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <label
            className="font-mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              color: "var(--ink, #2b2417)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <input
              type="radio"
              name={`state-${fieldKey}`}
              checked={state === "specified"}
              onChange={() => setState("specified")}
            />
            specified
          </label>
          <label
            className="font-mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              color: "var(--ink, #2b2417)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <input
              type="radio"
              name={`state-${fieldKey}`}
              checked={state === "prefer_not_to_say"}
              onChange={() => setState("prefer_not_to_say")}
            />
            prefer not to say
          </label>
          <label
            className="font-mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              color: "var(--ink, #2b2417)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <input
              type="radio"
              name={`state-${fieldKey}`}
              checked={state === "not_answered"}
              onChange={() => setState("not_answered")}
            />
            not answered
          </label>
        </div>
      ) : null}

      {state === "specified" ? (
        <ValueInput
          fieldKey={fieldKey}
          field={field}
          value={value}
          onChange={setValue}
        />
      ) : null}

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 8,
          marginTop: 4,
        }}
      >
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="font-mono uppercase"
          style={{
            ...primaryBtnStyle,
            opacity: pending ? 0.6 : 1,
            cursor: pending ? "wait" : "pointer",
          }}
        >
          {pending ? "saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="font-mono uppercase"
          style={editBtnStyle}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── ValueInput — picks the right input type per field ───────────────────

function ValueInput({
  fieldKey,
  field,
  value,
  onChange,
}: {
  fieldKey: DemoFieldKey;
  field: DemographicField;
  value: string;
  onChange: (v: string) => void;
}) {
  if (fieldKey === "contact_email") {
    return (
      <input
        type="email"
        inputMode="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
        placeholder="user@example.com"
      />
    );
  }
  if (fieldKey === "contact_mobile") {
    return (
      <input
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
        placeholder="raw — preserve user formatting"
      />
    );
  }
  if (fieldKey === "location") {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
        placeholder="country  |  region (optional)"
      />
    );
  }
  if (
    field.type === "single_select" ||
    field.type === "single_select_with_other"
  ) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      >
        <option value="">— pick —</option>
        {(field.options ?? []).map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
  // freeform fallback
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={inputStyle}
    />
  );
}

// ── Local snapshot patch on success ─────────────────────────────────────

function applyLocalEdit(
  prev: DemographicsSnapshot,
  fieldKey: DemoFieldKey,
  state: FieldState,
  value: string | null
): DemographicsSnapshot {
  const next = { ...prev };
  switch (fieldKey) {
    case "name":
      next.name = { state, value: state === "specified" ? value : null };
      break;
    case "gender":
      next.gender = { state, value: state === "specified" ? value : null };
      break;
    case "age":
      next.age = { state, value: state === "specified" ? value : null };
      break;
    case "location": {
      if (state === "specified" && value) {
        const [country, ...rest] = value.split("|").map((s) => s.trim());
        next.location = {
          state,
          country: country || null,
          region: rest.length > 0 ? rest.join(" | ") : null,
        };
      } else {
        next.location = { state, country: null, region: null };
      }
      break;
    }
    case "marital_status":
      next.marital_status = {
        state,
        value: state === "specified" ? value : null,
      };
      break;
    case "education":
      next.education = { state, value: state === "specified" ? value : null };
      break;
    case "political":
      next.political = { state, value: state === "specified" ? value : null };
      break;
    case "religious":
      next.religious = { state, value: state === "specified" ? value : null };
      break;
    case "profession":
      next.profession = {
        state,
        value: state === "specified" ? value : null,
      };
      break;
    case "contact_email":
      next.contact_email = value && value.length > 0 ? value : null;
      break;
    case "contact_mobile":
      next.contact_mobile = value && value.length > 0 ? value : null;
      break;
  }
  return next;
}

// ── Styles ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--rule, #d4c8a8)",
  borderRadius: 2,
  padding: "6px 10px",
  fontSize: 14,
  fontFamily: "var(--font-serif)",
  background: "var(--paper)",
  color: "var(--ink)",
};

const editBtnStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.10em",
  padding: "4px 12px",
  border: "1px solid var(--rule, #d4c8a8)",
  background: "transparent",
  color: "var(--ink, #2b2417)",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const primaryBtnStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.10em",
  padding: "4px 14px",
  border: "1px solid var(--umber, #8a6f3a)",
  background: "var(--umber, #8a6f3a)",
  color: "var(--paper, #f7f1e6)",
  cursor: "pointer",
  whiteSpace: "nowrap",
};
