"use client";

// CC-DEMOGRAPHICS-SAVE-WIRING — ghost-mapping client form. One per
// anonymous session row. Submits to the `attachDemographicsToSession`
// server action; on success, shows a brief flash + asks the parent
// page to refresh so the row drops out of the anonymous list.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { attachDemographicsToSession } from "../../../../lib/saveSession";
import type { DemographicAnswer } from "../../../../lib/types";

interface Props {
  sessionId: string;
  initial: {
    name: string;
    email: string;
    gender: string;
    age: string;
    profession: string;
  };
}

export default function GhostMappingForm({ sessionId, initial }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [gender, setGender] = useState(initial.gender);
  const [age, setAge] = useState(initial.age);
  const [profession, setProfession] = useState(initial.profession);
  const [mobile, setMobile] = useState("");
  const [adminLabel, setAdminLabel] = useState("");
  const [note, setNote] = useState("");
  const [flash, setFlash] = useState<
    { kind: "ok"; detail: string } | { kind: "err"; detail: string } | null
  >(null);
  const [pending, startTransition] = useTransition();

  function makeAnswer(field_id: string, value: string): DemographicAnswer | null {
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;
    return { field_id, state: "specified", value: trimmed };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (adminLabel.trim().length === 0) {
      setFlash({
        kind: "err",
        detail: "admin label required (who is doing this mapping)",
      });
      return;
    }
    setFlash(null);
    const answers: DemographicAnswer[] = [];
    for (const [fid, v] of [
      ["name", name],
      ["gender", gender],
      ["age", age],
      ["profession", profession],
    ] as Array<[string, string]>) {
      const a = makeAnswer(fid, v);
      if (a) answers.push(a);
    }
    const contactEmail = email.trim().length > 0 ? email.trim() : null;
    const contactMobile = mobile.trim().length > 0 ? mobile.trim() : null;

    startTransition(async () => {
      try {
        const result = await attachDemographicsToSession({
          sessionId,
          demographicAnswers: answers,
          contactEmail,
          contactMobile,
          adminLabel: adminLabel.trim(),
          note: note.trim().length > 0 ? note.trim() : undefined,
        });
        setFlash({
          kind: "ok",
          detail: result.created ? "row inserted" : "row updated",
        });
        // Server-component refresh so the row drops out of the
        // anonymous list once it has a name + email.
        router.refresh();
      } catch (err) {
        setFlash({
          kind: "err",
          detail: (err as Error).message,
        });
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 8,
        alignItems: "end",
      }}
    >
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span className="font-mono uppercase" style={{ fontSize: 10, color: "var(--ink-mute)" }}>
          name
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span className="font-mono uppercase" style={{ fontSize: 10, color: "var(--ink-mute)" }}>
          email
        </span>
        <input
          type="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span className="font-mono uppercase" style={{ fontSize: 10, color: "var(--ink-mute)" }}>
          gender
        </span>
        <input
          type="text"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          style={inputStyle}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span className="font-mono uppercase" style={{ fontSize: 10, color: "var(--ink-mute)" }}>
          age
        </span>
        <input
          type="text"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          style={inputStyle}
          placeholder="20s / 30s / 40s …"
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span className="font-mono uppercase" style={{ fontSize: 10, color: "var(--ink-mute)" }}>
          profession
        </span>
        <input
          type="text"
          value={profession}
          onChange={(e) => setProfession(e.target.value)}
          style={inputStyle}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span className="font-mono uppercase" style={{ fontSize: 10, color: "var(--ink-mute)" }}>
          mobile (opt)
        </span>
        <input
          type="tel"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          style={inputStyle}
        />
      </label>
      <label
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          gridColumn: "1 / -1",
        }}
      >
        <span className="font-mono uppercase" style={{ fontSize: 10, color: "var(--ink-mute)" }}>
          admin label (required — who is doing this)
        </span>
        <input
          type="text"
          value={adminLabel}
          onChange={(e) => setAdminLabel(e.target.value)}
          required
          style={inputStyle}
        />
      </label>
      <label
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          gridColumn: "1 / -1",
        }}
      >
        <span className="font-mono uppercase" style={{ fontSize: 10, color: "var(--ink-mute)" }}>
          note (optional — fingerprint detail that clinched the match)
        </span>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={inputStyle}
        />
      </label>
      <div style={{ gridColumn: "1 / -1", display: "flex", gap: 16, alignItems: "center" }}>
        <button
          type="submit"
          disabled={pending}
          style={{
            background: pending ? "transparent" : "var(--umber)",
            color: pending ? "var(--umber)" : "var(--paper)",
            border: "1px solid var(--umber)",
            borderRadius: 2,
            padding: "8px 14px",
            cursor: pending ? "wait" : "pointer",
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
            fontSize: 11,
            letterSpacing: "0.06em",
          }}
        >
          {pending ? "saving…" : "attach identity"}
        </button>
        {flash ? (
          <span
            role="status"
            style={{
              fontSize: 12,
              color:
                flash.kind === "ok"
                  ? "var(--ok, #2a6a3a)"
                  : "var(--danger, #a83a3a)",
            }}
          >
            {flash.kind === "ok" ? "✓ " : "✕ "}
            {flash.detail}
          </span>
        ) : null}
      </div>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--rule)",
  borderRadius: 2,
  padding: "6px 10px",
  fontSize: 14,
  fontFamily: "var(--font-serif)",
  background: "var(--paper)",
  color: "var(--ink)",
};
