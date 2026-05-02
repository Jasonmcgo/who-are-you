# CC-019 — Persistence Layer + Demographic Identity & Context

## Launch Directive

You are executing CC-019. This CC introduces the project's first **persistence layer** (a local Postgres database accessed via Drizzle ORM) and the **demographic Identity & Context surface** that captures user-supplied context after the test completes. It also adds the **opt-in Save flow** on the result page so a user's session, demographics, and derived InnerConstitution can be written to Postgres for later research review.

This is a substantial CC — comparable to CC-016 in scope. It introduces a new architectural layer (database persistence) and a new product surface (Identity & Context page). No existing test-flow logic is modified; demographics and persistence sit alongside the existing engine without changing its derivation behavior.

The persistence layer ships **local-first**: it connects to a Postgres database running on `localhost:5432` via the user's `DATABASE_URL` environment variable. The same code will work against a cloud-hosted Postgres later (Supabase, Vercel Postgres, etc.) by changing only the connection string. No cloud-specific logic in this CC.

The save flow is **opt-in by default** per the project's user-control register. After the InnerConstitution renders, the user sees an opt-in **Save** affordance. Without clicking, nothing leaves the browser session. With clicking, the session moves through the Identity & Context demographic surface (all fields optional, *Prefer not to say* canonical opt-out) and writes to Postgres.

**Sequenced after CC-016, CC-016b, CC-017, CC-018.** Independent of the v2 Coherence Engine work and the v2.5 Universal-Three Restructuring; both can land afterward without conflict.

## Bash Authorized

Yes. Use the shell freely for `tsc`, `eslint`, dev-server smoke runs, `psql` (for verifying schema), and Drizzle's CLI for generating and running migrations. Do not commit or push.

## Execution Directive

### Item 1 — Choose and install Drizzle ORM

**ORM choice.** Use **Drizzle ORM** for Postgres access. Drizzle is lighter than Prisma, more TypeScript-native, and integrates cleanly with Next.js. Reasons:

- Schema defined in TypeScript (no separate `.prisma` schema file).
- Migrations generated from schema diffs.
- Query API reads as native TypeScript, not as a separate DSL.
- Smaller runtime footprint.

**Install:**

```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit
```

`postgres` is the underlying driver (postgres-js). `drizzle-kit` is the dev tool for migrations.

**Add migration scripts to `package.json`:**

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

**Add `drizzle.config.ts` at project root:**

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### Item 2 — Schema

Create `db/schema.ts`. Two tables:

```ts
import { pgTable, uuid, text, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";

// 4-state enum capturing the user's relationship to each demographic field
// per the canonical opt-out-as-data principle (see Item 7).
export const fieldStateEnum = pgEnum("field_state", [
  "specified",
  "prefer_not_to_say",
  "not_answered",
]);

// Sessions — one row per saved test session.
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  // The full Answer[] from the user's session, serialized as JSON.
  // Stored as JSONB so we can query into it later without rewriting the schema
  // every time a new question type lands.
  answers: jsonb("answers").notNull(),
  // The full InnerConstitution result, serialized as JSON. Same JSONB rationale.
  inner_constitution: jsonb("inner_constitution").notNull(),
  // The list of question_ids that were skipped during the session.
  skipped_question_ids: jsonb("skipped_question_ids").notNull(),
  // The MetaSignal[] from the session.
  meta_signals: jsonb("meta_signals").notNull(),
  // The list of allocation overlays (CC-016) — present only if the user
  // marked any aspirational overlay during the allocation flow.
  allocation_overlays: jsonb("allocation_overlays"),
  // The BeliefUnderTension object (CC-017) — present only if Q-I1 / Q-I1b
  // produced an anchor and Q-I2 / Q-I3 produced selections.
  belief_under_tension: jsonb("belief_under_tension"),
});

// Demographics — one row per saved session, linked by session_id.
// Each demographic field has both a value column and a state column,
// so the engine can distinguish specified / prefer_not_to_say / not_answered.
export const demographics = pgTable("demographics", {
  id: uuid("id").primaryKey().defaultRandom(),
  session_id: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" })
    .unique(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),

  // Each demographic has (value, state) pair.
  name_value: text("name_value"),
  name_state: fieldStateEnum("name_state").notNull().default("not_answered"),

  gender_value: text("gender_value"),                          // enum-as-text or "Other:..."
  gender_state: fieldStateEnum("gender_state").notNull().default("not_answered"),

  age_decade: text("age_decade"),                              // e.g., "1980s", "1990s"
  age_state: fieldStateEnum("age_state").notNull().default("not_answered"),

  location_country: text("location_country"),
  location_region: text("location_region"),
  location_state: fieldStateEnum("location_state").notNull().default("not_answered"),

  marital_status_value: text("marital_status_value"),
  marital_status_state: fieldStateEnum("marital_status_state").notNull().default("not_answered"),

  education_value: text("education_value"),
  education_state: fieldStateEnum("education_state").notNull().default("not_answered"),

  political_value: text("political_value"),
  political_state: fieldStateEnum("political_state").notNull().default("not_answered"),

  religious_value: text("religious_value"),
  religious_state: fieldStateEnum("religious_state").notNull().default("not_answered"),

  profession_value: text("profession_value"),
  profession_state: fieldStateEnum("profession_state").notNull().default("not_answered"),
});
```

After defining the schema, run `npm run db:generate` to produce the SQL migration file in `./db/migrations/`. The migration creates both tables, the enum type, the foreign key, and the unique constraint. The generated SQL should land at `db/migrations/0000_<some_name>.sql` or similar.

### Item 3 — Database connection layer

Create `db/index.ts`:

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local before running with persistence."
  );
}

// `prepare: false` — required for some hosted Postgres providers; harmless on local.
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
```

This is the single entrypoint for database access throughout the app. All save and read operations go through `db`.

### Item 4 — Demographic field definitions

Create `data/demographics.ts`. Each field has a TypeScript type carrying its option list, wording, and field-state semantics:

```ts
import type { fieldStateEnum } from "../db/schema";

export type FieldState = "specified" | "prefer_not_to_say" | "not_answered";

export type DemographicOption = {
  id: string;
  label: string;
  allows_text?: boolean;          // true for "Other (please specify)"
};

export type DemographicField = {
  field_id: string;               // matches the schema column root, e.g. "gender"
  question: string;               // user-facing question
  helper?: string;                // optional sub-prompt
  type: "single_select" | "single_select_with_other" | "freeform";
  options?: DemographicOption[];  // present for single_select* types
  prefer_not_to_say_label: string; // canonical opt-out language; defaults to "Prefer not to say"
};

export const DEMOGRAPHIC_FIELDS: DemographicField[] = [
  {
    field_id: "name",
    question: "What's your first name?",
    helper: "For your own reference — the model doesn't use this in any reading.",
    type: "freeform",
    prefer_not_to_say_label: "Prefer not to say",
  },
  {
    field_id: "gender",
    question: "How would you describe your gender?",
    type: "single_select_with_other",
    options: [
      { id: "man",        label: "Man" },
      { id: "woman",      label: "Woman" },
      { id: "non_binary", label: "Non-binary" },
      { id: "other",      label: "Other", allows_text: true },
    ],
    prefer_not_to_say_label: "Prefer not to say",
  },
  {
    field_id: "age",
    question: "Which decade were you born in?",
    helper: "Decade rather than exact year — the model uses cohort context, not precision.",
    type: "single_select",
    options: [
      { id: "1940s", label: "1940s" },
      { id: "1950s", label: "1950s" },
      { id: "1960s", label: "1960s" },
      { id: "1970s", label: "1970s" },
      { id: "1980s", label: "1980s" },
      { id: "1990s", label: "1990s" },
      { id: "2000s", label: "2000s" },
      { id: "2010s", label: "2010s" },
    ],
    prefer_not_to_say_label: "Prefer not to say",
  },
  {
    field_id: "location",
    question: "Where do you live now?",
    helper: "Country and (optionally) region — for the cultural-context layer the model will use later.",
    type: "freeform",  // two-part freeform: country + optional region; renderer handles split
    prefer_not_to_say_label: "Prefer not to say",
  },
  {
    field_id: "marital_status",
    question: "What's your relational situation?",
    type: "single_select",
    options: [
      { id: "married",     label: "Married" },
      { id: "partnered",   label: "Partnered (long-term)" },
      { id: "single",      label: "Single" },
      { id: "divorced",    label: "Divorced or separated" },
      { id: "widowed",     label: "Widowed" },
      { id: "other",       label: "Other" },
    ],
    prefer_not_to_say_label: "Prefer not to say",
  },
  {
    field_id: "education",
    question: "What's your highest level of completed education?",
    type: "single_select",
    options: [
      { id: "high_school",     label: "High school or equivalent" },
      { id: "some_college",    label: "Some college" },
      { id: "bachelors",       label: "Bachelor's degree" },
      { id: "masters",         label: "Master's degree" },
      { id: "doctorate",       label: "Doctorate or professional degree" },
      { id: "trade",           label: "Trade or vocational training" },
      { id: "other",           label: "Other" },
    ],
    prefer_not_to_say_label: "Prefer not to say",
  },
  {
    field_id: "political",
    question: "How would you describe your political orientation?",
    helper: "Broad orientation rather than party — the model is non-US-centric and reads ideological posture, not partisanship.",
    type: "single_select",
    options: [
      { id: "left",          label: "Left" },
      { id: "center_left",   label: "Center-left" },
      { id: "center",        label: "Center" },
      { id: "center_right",  label: "Center-right" },
      { id: "right",         label: "Right" },
      { id: "apolitical",    label: "Apolitical / unengaged" },
      { id: "other",         label: "Other" },
    ],
    prefer_not_to_say_label: "Prefer not to say",
  },
  {
    field_id: "religious",
    question: "What's your religious or spiritual orientation?",
    type: "single_select_with_other",
    options: [
      { id: "christianity",   label: "Christianity" },
      { id: "judaism",        label: "Judaism" },
      { id: "islam",          label: "Islam" },
      { id: "hinduism",       label: "Hinduism" },
      { id: "buddhism",       label: "Buddhism" },
      { id: "spiritual",      label: "Spiritual but not religious" },
      { id: "none",           label: "None / non-religious" },
      { id: "other",          label: "Other", allows_text: true },
    ],
    prefer_not_to_say_label: "Prefer not to say",
  },
  {
    field_id: "profession",
    question: "Which best describes your work?",
    type: "single_select_with_other",
    options: [
      { id: "knowledge",      label: "Knowledge worker" },
      { id: "skilled_trades", label: "Skilled trades" },
      { id: "service",        label: "Service worker" },
      { id: "public_safety",  label: "Public safety" },
      { id: "medical",        label: "Medical" },
      { id: "education",      label: "Education" },
      { id: "laborer",        label: "Laborer" },
      { id: "creative",       label: "Creative / Arts" },
      { id: "entrepreneur",   label: "Self-employed / Entrepreneur" },
      { id: "retired",        label: "Retired / not currently working" },
      { id: "military",       label: "Military" },
      { id: "religious_work", label: "Religious / Ministry" },
      { id: "other",          label: "Other", allows_text: true },
    ],
    prefer_not_to_say_label: "Prefer not to say",
  },
];
```

**Field-by-field design notes (for review):**

- **Name**: pure freeform. The model doesn't use it in any reading; it's a reference for the user to identify their own session.
- **Gender**: 4 options + Other-with-text + Prefer-not-to-say.
- **Age**: 8 decade buckets, no specific year. Privacy-friendly; cohort granularity is what v3 uses anyway.
- **Location**: freeform (country + region). Could be promoted to a structured country dropdown in a follow-up CC if the freeform produces too much variation.
- **Marital status**: 6 options + Prefer-not-to-say.
- **Education**: 7 options + Prefer-not-to-say.
- **Political**: 7 options framed as broad ideological posture (Left / Center-left / Center / Center-right / Right / Apolitical / Other). Deliberately non-US-centric — no Democrat/Republican party labels.
- **Religious**: 7 options + Other-with-text + Prefer-not-to-say. Includes "Spiritual but not religious" as a meaningful contemporary category and "None / non-religious" as a separate explicit option (the two are distinct).
- **Profession**: 13 options + Other-with-text + Prefer-not-to-say. Locked in chat (2026-04-26) — Caregiver and Student dropped, Entrepreneur kept as one category in the main list.

### Item 5 — TypeScript types for demographics

Extend `lib/types.ts`:

```ts
import type { FieldState } from "../data/demographics";

export type DemographicAnswer = {
  field_id: string;
  state: FieldState;
  value?: string;        // present iff state === "specified"
  other_text?: string;   // present iff value === "other" (or similar Other-with-text option)
};

export type DemographicSet = {
  answers: DemographicAnswer[];
};
```

### Item 6 — Identity & Context page

Create `app/components/IdentityAndContextPage.tsx`. This is a **separate page** that renders after the user clicks Save on the result page, before the actual database write.

**Visual register:** clearly distinct from the eight-card test flow. Same typography family (font-serif body, font-mono helpers) but simpler layout — a single column of question blocks, each with its options below. No drag-rank, no multi-select-with-derivation. Just simple radio buttons (single-select), text inputs (freeform), and a "Prefer not to say" affordance per field.

**Page header:**

> *"Now that you've seen your reading, would you tell us a little about who you are? This helps the model improve. Every field is optional, and 'Prefer not to say' is a real answer the model treats as informative."*

**Each field renders as:**

- Question text (font-serif, body-sized)
- Helper (if present, font-mono small)
- Radio buttons for single_select / single_select_with_other (with optional "Other" expanding a text input)
- Text input for freeform
- A small **"Prefer not to say"** affordance below the options (visually distinct — perhaps a subtle gray button or radio with the canonical opt-out label). Clicking sets that field's state to `prefer_not_to_say` and clears any value.

**Footer:** a primary button **"Save and finish"** and a secondary button **"Skip — save without these"**. Either path writes to the database; the difference is what's in the demographic row (specified values vs. all-not-answered).

**State management:** local React state holds the in-progress demographic answers. When the user clicks Save and finish (or Skip), the component invokes a callback that triggers the database write.

### Item 7 — Field-state semantics (canonical opt-out-as-data)

Each demographic field has one of three states:

- `specified` — user gave a real value. Model treats as data.
- `prefer_not_to_say` — user explicitly opted out. Model treats this as informative — *the user saw the question and chose privacy.* Distinct from not-answered.
- `not_answered` — user closed the page or navigated past without engaging. Model treats as no data.

The schema stores both the value and the state. Inference of demographic fields from other answers (e.g., name → gender, language → location) is **explicitly forbidden** by canon — see CC-019 § Out of Scope.

A new short canon doc, `docs/canon/demographic-rules.md`, captures these rules:

```markdown
# Demographic Rules (CC-019)

## Rule 1 — Opt-out is data
Each demographic field carries one of three states: specified, prefer_not_to_say, not_answered.
The opt-out signal is itself informative — the user saw the question and chose privacy.
The model treats opt-out as data, not as missing data. The aggregate frequency of opt-out
across users is a separate signal about the population's relationship to that field.

## Rule 2 — No inference of demographic fields
Demographic fields are user-named only. The model does not infer gender from name, location
from IP address, language community from text-mining, or political affiliation from any other
answer. Inference would substitute the model's read for the user's named identity, which
violates the canon's user-control register.

## Rule 3 — All fields optional
The user can fill any subset of the demographic fields. The Save flow does not gate on
any field being specified. A session with all fields not_answered is a valid saved session.

## Rule 4 — Demographics are side-data
Demographic data does not feed into InnerConstitution derivation. The eight-card body-map
reading is independent of who the user is in demographic terms. Demographics enrich the
research surface (population baselines, cultural framings) without changing the per-user
read.

## Rule 5 — Local-first, opt-in to save
The save flow is opt-in by default. A user who completes the test and does not click Save
leaves no record on the server. Demographics are only collected as part of an explicitly-
chosen save flow.
```

### Item 8 — Save flow on result page

Modify `app/components/InnerConstitutionPage.tsx` (or wherever the result currently renders) to add an opt-in **Save** affordance below the rendered InnerConstitution.

**Affordance text:**

> *"Save this reading? The model uses saved sessions (anonymized, opt-in) to improve. Your reading is shown above either way; saving is optional."*

A **"Save"** button below this text. Clicking transitions to the Identity & Context page.

If the user does not click Save, the result page remains as today — InnerConstitution rendered, no database write. The user can refresh, share via screen, take it again, etc. — all without persistence.

After the Identity & Context page completes (Save and finish or Skip), the database write executes. Show a confirmation screen briefly:

> *"Saved. Thank you for contributing — the model gets smarter with every session."*

Then return to the result page (or stay on the confirmation, with a "Back to your reading" link).

### Item 9 — Save logic

Create `lib/saveSession.ts`:

```ts
import { db } from "../db";
import { sessions, demographics } from "../db/schema";
import type { Answer, MetaSignal, InnerConstitution } from "./types";
import type { DemographicAnswer } from "./types";

export async function saveSession(args: {
  answers: Answer[];
  innerConstitution: InnerConstitution;
  skippedQuestionIds: string[];
  metaSignals: MetaSignal[];
  allocationOverlays?: unknown;
  beliefUnderTension?: unknown;
  demographicAnswers: DemographicAnswer[];
}): Promise<{ sessionId: string }> {
  // Single transaction — sessions row + demographics row commit together.
  // Drizzle's transaction API:
  return await db.transaction(async (tx) => {
    const [session] = await tx
      .insert(sessions)
      .values({
        answers: args.answers,
        inner_constitution: args.innerConstitution,
        skipped_question_ids: args.skippedQuestionIds,
        meta_signals: args.metaSignals,
        allocation_overlays: args.allocationOverlays ?? null,
        belief_under_tension: args.beliefUnderTension ?? null,
      })
      .returning({ id: sessions.id });

    // Build the demographics row from the answer list.
    const demoRow = buildDemographicsRow(session.id, args.demographicAnswers);
    await tx.insert(demographics).values(demoRow);

    return { sessionId: session.id };
  });
}

function buildDemographicsRow(
  sessionId: string,
  answers: DemographicAnswer[]
): typeof demographics.$inferInsert {
  // Map field_id → (value, state) pairs onto the schema columns.
  // Each field has both _value and _state columns.
  // Implementation: walk the answers array, set the appropriate columns,
  // default any missing field to ("", "not_answered").
  // ... helper logic ...
}
```

### Item 10 — Wiring it together in `app/page.tsx`

Add state for the persistence flow:

- `phase` state extended with new values: `"save_prompt"` (after InnerConstitution renders, asks Save?) and `"identity_context"` (the demographic page) and `"save_confirmation"` (the brief thank-you).
- New handlers: `handleStartSave()`, `handleSubmitDemographics(demoAnswers)`, `handleSkipDemographics()`.
- Render branches for the new phases.

The existing test flow stays unchanged. The new phases only activate when the user explicitly chooses to save.

## Allowed-to-Modify

- `package.json` — add `drizzle-orm`, `postgres`, `drizzle-kit` dependencies; add the three migration scripts.
- `drizzle.config.ts` — NEW file at project root.
- `db/schema.ts` — NEW file containing the table and enum definitions.
- `db/index.ts` — NEW file containing the connection layer.
- `db/migrations/<generated>.sql` — NEW file generated by `drizzle-kit generate`.
- `lib/types.ts` — add `DemographicAnswer` and `DemographicSet` types; import / re-export `FieldState`.
- `lib/saveSession.ts` — NEW file containing the save transaction logic.
- `data/demographics.ts` — NEW file containing the demographic field definitions (the 9 fields per Item 4).
- `app/components/IdentityAndContextPage.tsx` — NEW component.
- `app/components/InnerConstitutionPage.tsx` — add the opt-in Save affordance below the rendered result; wire to the new phase handlers.
- `app/page.tsx` — add `save_prompt`, `identity_context`, `save_confirmation` phases; render branches; handlers for save flow.
- `docs/canon/demographic-rules.md` — NEW canon doc capturing the five rules.
- `README.md` (optional) — add a "Database" section documenting the local-Postgres setup steps and the migration commands. One short section, ~100 words.

No other file should be modified.

## Out of Scope — explicit "do not" list

- **Do not** modify any existing question in `data/questions.ts` (Q-C, Q-P, Q-F, Q-X, Q-A, Q-S, Q-T, Q-S3, Q-E1, Q-I — all unchanged). Demographics are a separate data structure, not new questions in the test flow.
- **Do not** modify the engine derivation in `lib/identityEngine.ts` or any signal extraction function. Demographics do not feed into InnerConstitution derivation per Rule 4.
- **Do not** modify any per-card derivation function, tension detection block, or Mirror prose generator.
- **Do not** modify the Mirror, Map, ShapeCard, TensionCard, MapSection, PathExpanded, MultiSelectDerived, Ranking, QuestionShell, KeystoneReflection, or any other existing component.
- **Do not** modify the canon files for question-bank, signal-library, tension-library, result-writing, allocation-rules, or keystone-reflection-rules.
- **Do not** introduce any cross-card pattern detection, Coherence Engine work, or Interpretive Evidence Layer types. Those are CC-020+ work.
- **Do not** infer demographic fields from other answers — no name → gender, no IP → location, no text-mining for political/religious cues. Inference is explicitly forbidden by Rule 2.
- **Do not** introduce authentication, user accounts, or sessions-tied-to-users. The session table records sessions anonymously by UUID; cross-session linkage is out of scope.
- **Do not** introduce feedback collection, in-app feedback forms, or external feedback links. That's CC-020 (separate CC).
- **Do not** introduce cloud deployment configuration, Vercel config, environment-specific settings, or production hardening. That's CC-021. The CC ships local-first; the same code will work in cloud later by changing `DATABASE_URL` only.
- **Do not** introduce a privacy policy, terms of use, or consent-banner UI. The current local-only posture means these aren't needed yet; they land in CC-021 alongside cloud deployment.
- **Do not** introduce a session-listing or admin UI. The user sees their own reading and the save confirmation; researchers (Jason) browse the database via pgAdmin or `db:studio`.
- **Do not** add any analytics, telemetry, or third-party tracking. The save flow writes only to the user's own Postgres database.
- **Do not** modify build configuration files (`eslint.config.mjs`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`).
- **Do not** modify AGENTS.md, CLAUDE.md, or any prompt file other than this one.

## Acceptance Criteria

1. **Drizzle installed** as a dependency. `package.json` shows `drizzle-orm`, `postgres`, `drizzle-kit` (the last as devDependency). `npm install` runs without errors.
2. **`drizzle.config.ts` at project root** with the schema path, output path, dialect, and `dbCredentials.url` from `process.env.DATABASE_URL`.
3. **`db/schema.ts` defines two tables and one enum** matching the spec in Item 2: `sessions`, `demographics`, `field_state` enum.
4. **Migration generated** in `db/migrations/`. Running `npm run db:generate` produces the SQL file. Running `npm run db:migrate` applies it to the database (assumes `DATABASE_URL` is set and the database `who_are_you` exists in Postgres). After migration, `psql who_are_you -c "\dt"` lists both tables.
5. **`db/index.ts` exports a `db` client** that fails clearly with a descriptive error if `DATABASE_URL` is missing.
6. **9 demographic fields defined** in `data/demographics.ts` matching Item 4's spec. Each field has the correct option list, helper text where applicable, and a `prefer_not_to_say_label`.
7. **Identity & Context page renders** after the user clicks Save on the result page. All 9 fields visible in a single scrollable column. Each field has its options + Prefer-not-to-say affordance.
8. **Field-state semantics work**: selecting a real option sets state to `specified`; clicking Prefer-not-to-say sets state to `prefer_not_to_say` and clears the value; closing without engaging leaves state as `not_answered`.
9. **Save flow writes to Postgres**: clicking Save and finish (or Skip) executes a transaction that inserts a `sessions` row and a linked `demographics` row. Verify by inspecting the database in pgAdmin after a smoke session — both rows present, foreign key satisfied, JSONB columns contain valid JSON.
10. **Opt-in default**: not clicking Save leaves no database row. Verify by completing a session, ignoring the Save button, refreshing the page; pgAdmin shows no new rows.
11. **Cancel-from-Identity-page does not orphan**: closing the browser mid-Identity-page leaves no rows (the transaction has not yet committed).
12. **`docs/canon/demographic-rules.md` exists** with the five rules per Item 7.
13. **TSC clean.** `npx tsc --noEmit` exits 0 with no output.
14. **Lint clean.** `npm run lint` exits 0 with no warnings.
15. **No file outside the Allowed-to-Modify list is modified.**
16. **Existing test flow unchanged**: the engine still produces the same InnerConstitution for the same input, the Mirror still renders the same prose, all 17 ranking + 2 ranking_derived + 2 multiselect_derived + 13 forced/freeform questions still work as today.
17. **CC-016 / CC-016b / CC-017 / CC-018 regressions clean**: cascade-skip still works, Accept/Skip still renders on rankings, Q-I1b conditional render still works, Q-T item-order shuffle still produces correct stack outputs. Run the existing engine smoke from CC-018's report and confirm identical signal outputs.

## Report Back

1. **Files changed** — file-by-file summary.
2. **Drizzle install confirmation** — paste the `package.json` diff showing the three new dependencies.
3. **Migration verification** — paste the generated SQL from `db/migrations/`. Run `npm run db:migrate` against the local database; confirm tables exist via `psql -c "\dt"`.
4. **Schema verification** — paste the result of `psql who_are_you -c "\d demographics"` showing the table structure.
5. **Demographic field rendering** — describe (or screenshot) the Identity & Context page rendering all 9 fields. Confirm the Prefer-not-to-say affordance per field.
6. **Save flow smoke** — complete a smoke session: take the test (synthetic answers), click Save, fill in 3 demographic fields specified + 3 prefer-not-to-say + 3 left as not-answered, click Save and finish. Inspect the database; paste the resulting rows (with PII redacted if any).
7. **Opt-in default smoke** — complete a session, do not click Save, refresh the browser. Confirm no database row was written.
8. **Field-state distinguishability** — paste the demographics row from the smoke session showing the three-state distribution across fields.
9. **TSC + lint** — exit codes.
10. **Existing-test-flow regression check** — paste a smoke comparing InnerConstitution output before and after CC-019 for the same input. Should be identical.
11. **Scope-creep check** — confirm only allowed files were modified.
12. **Risks / next-step recommendations** — anything you noticed during the work that warrants a follow-up CC. Specifically: any UX issue with the Identity & Context page (the column scroll, the Prefer-not-to-say affordance feel, etc.), any database schema issue worth flagging for CC-020 / CC-021, any Drizzle behavior that surprised you.

## Notes for the executing engineer

- **Local Postgres setup is the user's responsibility.** The user has Postgres + pgAdmin running locally with a `who_are_you` database created. The user has populated `.env.local` with the `DATABASE_URL` connection string. You do not set up the database; you write code that connects to it. If `npm run db:migrate` fails because the database doesn't exist or the connection string is wrong, surface clearly in the report — don't try to provision the database programmatically.
- **The 9 demographic field definitions in Item 4 are draft language locked in chat.** The wording and option lists are reviewable; if any specific phrasing reads awkwardly to you (e.g., the political-orientation framing), surface in the Risks section but ship as-spec'd.
- **The Identity & Context page's UX is a high-uncertainty surface.** This is a new product surface unlike anything in the test flow. Make the visual register clean and clearly different from the eight-card flow — but match the project's existing typography, color tokens, and CSS variables. If you need to author new design tokens, surface in the report; lean on existing tokens (`--ink`, `--paper`, `--umber`, `--rule`, etc.) where possible.
- **The Save flow's confirmation screen is small and brief.** A single sentence + a "Back to your reading" link. Don't over-design.
- **The `buildDemographicsRow` helper in Item 9** is a small but tedious mapping step. Be careful with the field-by-field column assignments — easy to get a column name wrong. Type the function carefully so TypeScript catches mismatches at compile time.
- **Drizzle's transaction API** uses callback style (`db.transaction(async (tx) => { ... })`). Both the sessions insert and the demographics insert must use `tx`, not `db`, for the transaction semantics to work.
- **`prepare: false` in the postgres-js options** is required for some hosted Postgres providers (Supabase pgbouncer, Vercel Postgres) and harmless on local. Keep it.
- **Browser smoke is deferred to Jason.** Your smoke testing should cover: schema migration, engine code unchanged (TSC + lint + InnerConstitution regression), save-transaction writes both rows, opt-in default leaves no rows, the demographic field-state semantics work end-to-end. UX/visual verification is Jason's after the CC lands.
- **The `cost_awareness` runtime-dead status from CC-017's report is preserved.** No work on that here. Out of CC-019 scope.
- **The `toAnswer` narrowing fragility flagged in CC-017's report** may need attention if the save flow's serialization touches it. Surface in the report if you encounter the issue; if not, defer to a future CC.
