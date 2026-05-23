# CC-126 — Follow-up collection backend (resolver + missing-Q diff + tokenized link + write-back)

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass.
Do not stop for confirmation between steps. On ambiguity, apply the
canon-faithful interpretation, proceed, and flag it. Permission bypass is
on; the discipline below is scope.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.
**Depends on CC-125 (`lib/followUpQuestions.ts`) being merged first** — this
imports `buildFollowUpInput` and `generateFollowUpQuestions` from it.

## Execution Directive

- One pass, no mid-task confirmation prompts.
- This is the **backend** for the admin follow-up flow. **No UI** (the admin
  "Copy URL" button and the public answer page are CC-127). Build: the
  missing-question diff, the follow-up resolver, the tokenized-link mint, and
  the public GET/POST API that returns the questions and writes answers back +
  re-derives.
- **Discovery-driven on persistence:** READ how sessions are stored, how
  answers are shaped, how the admin re-derive works, and how API routes/DB
  access are done in THIS repo, and follow those conventions exactly. Do not
  introduce a new ORM or persistence pattern.

## Context

Product flow (manual until 50+ cohorts): from the admin sessions list, the
operator mints a **tokenized public link** for a session and emails it by hand
(Copy-URL, no Gmail integration). The link opens a page with (a) the questions
that session never answered, and (b) that person's follow-up questions. They
answer; the answers merge into the session as **first-class signal-tagged
answers** and the session **re-derives** a fresh report.

Decisions locked:
- **Content:** hand-authored set if the session has one seeded, else the
  CC-125 generator. (Generator path must work for everyone now; the 14
  hand-authored sets are populated as a separate data step — see Task C.)
- **Write-back:** follow-up + gap answers become real answers on the session so
  re-derivation consumes them (compression-check can move the Lens read, etc.).
- **Link:** unguessable token, public (no login).

## Read First (Required)

- How a session + its `answers` are persisted and read (the same `sessions`
  table the extractor reads; find the app's DB access layer + the Answer shape
  in `lib/types.ts`).
- The admin **re-derive** path (the sessions admin shows "Stale-shape sessions
  … re-derived" — find the function that re-runs `buildInnerConstitution` and
  persists the result; reuse it).
- `data/questions.ts` — the current question bank + the `signal` scoring-tag
  convention; `signalsFromRankingAnswer` in `lib/identityEngine.ts`.
- `lib/followUpQuestions.ts` (CC-125, MERGED) — `FollowUpQuestionSet`,
  `FollowUpInput`, and the actual signatures:
  `buildFollowUpInput(constitution: InnerConstitution, answers: Answer[], personName?: string): FollowUpInput`
  and `generateFollowUpQuestions(input: FollowUpInput): FollowUpQuestionSet`.
  NOTE: `buildFollowUpInput` requires `answers` (state-load is computed from
  Q-X1/X2/A1/O2, not stored on the constitution), so the resolver must thread
  `answers` through.
- Existing API route + migration conventions in the repo.

## Tasks

### A. Missing-question diff — `lib/missingQuestions.ts`

`missingQuestionIds(answers: Answer[]): string[]` — every `question_id` in the
current `questions.ts` bank that is NOT present in the session's answers
(skip derived-only items per their existing rules). Returns ids in bank order.
Also export `missingQuestions(answers): Question[]` (the full objects, for the UI).

### B. Follow-up resolver — `lib/followUpResolver.ts`

`resolveFollowUps(sessionKey: string, constitution, answers: Answer[], personName?: string): FollowUpQuestionSet`:
- if `cohortFollowUps[sessionKey]` exists (Task C seed) → return it (hand-authored override);
- else → `generateFollowUpQuestions(buildFollowUpInput(constitution, answers, personName))`.
(Thread `answers` through — `buildFollowUpInput` needs them for state-load.)
`sessionKey` = the session id (and/or canonical name) — pick whichever the seed
map is keyed on; document it.

### C. Hand-authored seed map — `data/cohortFollowUps.ts`

Typed `Record<string, FollowUpQuestionSet>` keyed by session id (or canonical
name). **Ship the structure + 1 worked example, EMPTY otherwise** — populating
the 14 cohort members' hand-authored sets (from Clarence's authored sets) is a
follow-up data task (CC-126b), NOT this CC. The resolver must fall back to the
generator for any key not present, so the system is fully functional with an
empty seed map.

### D. Tokenized link + persistence

- A `follow_up_links` table (or the repo's equivalent): `token` (unguessable,
  e.g. crypto random), `session_id`, `created_at`, `used_at` nullable. Migration
  per repo convention.
- `mintFollowUpLink(sessionId): { token, url }` — the backend the admin
  Copy-URL button (CC-127) will call. URL shape: `/{publicPath}/{token}`.

### E. Public API

- `GET /api/follow-up/[token]` → resolve token → session → returns
  `{ personName, missingQuestions, followUps }` (no PII beyond first name).
  404 on unknown/used token (or allow re-open until submitted — your call,
  document it).
- `POST /api/follow-up/[token]` → accept submitted answers for the missing
  questions + the follow-ups → **append/merge them onto the session's `answers`
  as first-class answers** (follow-up answers carry their option `tags` as the
  `signal`, so `deriveSignals` consumes them like any ranking/forced answer) →
  trigger the existing **re-derive** → mark token `used_at`. Idempotent on
  re-submit (don't double-append).

## Allowed to Modify (exhaustive)

- NEW: `lib/missingQuestions.ts`, `lib/followUpResolver.ts`,
  `data/cohortFollowUps.ts`, the `follow_up_links` migration, the two API route
  files, and a small `lib/followUpLink.ts` (mint helper).
- A test file per repo convention.
- Do NOT modify the engine, scoring, `questions.ts`, the renderer, or any admin
  UI (that's CC-127). Reuse the existing re-derive function; don't reimplement it.

## Out of Scope

- All UI (admin Copy-URL button, public answer page) → CC-127.
- Populating the 14 hand-authored sets → CC-126b (data).
- Email send / scheduling.
- The follow-up generator itself (CC-125).

## Bash Commands Authorized

- `npx tsc --noEmit`
- the repo's test runner and migration command (read-only verify is fine;
  do not run destructive migrations against prod — local/dev only).

## Acceptance Criteria

1. `missingQuestionIds` returns the correct unanswered set for a fixture
   session (e.g. a session missing Q-I1b/Q-I2 returns those).
2. `resolveFollowUps` returns the generator's set when the seed map lacks the
   key, and the hand-authored set when present (test with the 1 worked example).
3. `mintFollowUpLink` returns an unguessable token + URL; token persists.
4. `POST` merges answers as first-class signal-tagged answers and the session
   re-derives (verify the constitution changes when a follow-up answer is added).
5. Re-submit is idempotent.
6. `npx tsc --noEmit` clean. No engine/scoring/renderer/UI files modified.

## Report Back

- New files + the migration; the `sessionKey` the seed map is keyed on.
- Which existing re-derive function was reused (path).
- How a follow-up answer's option `tag` becomes a `signal` the engine consumes
  (the merge shape) — one concrete before/after showing a re-derive moved.
- `tsc` + test results.
