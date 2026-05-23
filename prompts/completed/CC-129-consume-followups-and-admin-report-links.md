# CC-129 — Consume follow-up answers in the report (narrative) + admin report links

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass.
Do not stop for confirmation between steps. On ambiguity, apply the
canon-faithful interpretation, proceed, and flag it. Permission bypass is
on; the discipline below is scope.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.
**Depends on CC-125/126/127 merged** (generator, resolver, follow-up answers).
**Supersedes CC-128** — its admin report-link work is folded into Part B here;
do NOT also run CC-128 (delete `prompts/active/CC-128-admin-report-link.md`).

## Context

Verified end-to-end: follow-up answers persist and the engine ingests them
(a real session went 45 → 49 answers, signals 165 → 170). BUT **nothing reads
the follow-up signal tags** (`control-anti-waste`, `release-certainty-loop`,
`aim-share-rough`, …), so the report is byte-identical with or without them.
Collection works; consumption doesn't.

**Design principle (important):** follow-ups must NOT change the numeric
trajectory. Goal / Soul / Aim / Grip / Lens / OCEAN are measured by the
45-question assessment; the follow-ups are *clarifiers*, not new trait
measurement. They drive the **qualitative narrative** — what the Grip is
protecting, what makes release safe, the Aim move — and, for low-confidence
cases, the **Lens decompression note**. So "the numbers didn't move" is
correct; the gap is that the *narrative* doesn't reflect the person's picks.

## Part A — Consume follow-up answers into the report narrative

### Read First
- `lib/identityEngine.ts` — `signalFromSinglePick` / `signalsFromDerivedRanking`
  (how follow-up answers become inline signals); the Grip card + Next Moves
  emit sites in the report render (`lib/renderMirror.ts`).
- `lib/followUpResolver.ts` (CC-126) + `lib/followUpQuestions.ts` (CC-125) —
  to map a stored follow-up answer back to the option the person chose.
- `data/cohortFollowUps.ts` (CC-126b) — the hand-authored sets.

### Tasks
1. **Detect** a session's follow-up answers: the records whose `question_id`
   is not a standard `Q-*` (e.g. `fq1_grip_object`, `fq2_release_condition`,
   `fq3_aim_replacement`, plus `compression_check` / `trait_vs_weather` when
   present). Each carries `picked_id` (+ `picked_signal`) or
   `derived_item_sources` (the ranked picks).
2. **Resolve picks → words.** Re-resolve the session's `FollowUpQuestionSet`
   (via `resolveFollowUps`) and match each stored `picked_id`/signal back to its
   option's `text` + `interpretation`. (The numeric scores already exist on the
   constitution; this is a read-side resolve, not a re-score.)
3. **Emit a "From Grip to Aim" block** into the report — preferably folded into
   the **Grip card / Next Moves**, sourced from the person's own picks:
   - `grip_object` pick → *"What your grip is protecting:"* (their chosen object).
   - `release_condition` pick → *"What would make release feel safe:"* (their condition).
   - `aim_replacement` pick → the leading **Next Move** (their chosen aim).
   This is the "honorable protection → cleaner way to protect it" content the
   whole follow-up design was for.
4. **`compression_check`** (low-Lens-confidence sessions, e.g. Connor): the
   person's answer to "what changes first under stakes" feeds the **Lens
   decompression note** — strengthen/soften the dual-read framing per
   `docs/canon/state-compression-model.md`. (Still a note, never a forced type flip.)
5. **No follow-ups present** → the report renders exactly as today (no empty
   block, no error). The block only appears when follow-up answers exist.
6. **Do NOT alter** Goal/Soul/Aim/Grip/Lens-stack/OCEAN numeric computations.

### Part A acceptance
- Re-deriving the verified session (`jason-real`, the 49-answer fixture) now
  renders a "From Grip to Aim" block reflecting his actual picks
  (`aim-share-rough` → a "share the rough model earlier" Next Move, etc.).
- The numeric fields are unchanged vs. the 45-answer base (prove it).
- A session with no follow-ups renders unchanged (no block).

## Part B — Admin: surface the public report link + session UUID

(Folds in CC-128. Frontend only; `/report/[sessionId]` already exists and is
public.)

### Tasks
- In `app/admin/sessions/page.tsx`, per row: show the session **UUID**
  (selectable mono, muted) and add a **"Report ↗"** link to `/report/{id}`
  (new tab, `rel="noopener"`) plus a **"Copy report URL"** control that copies
  the absolute `{origin}/report/{id}` to the clipboard with a "Copied ✓"
  affordance (mirror CC-127's `CopySessionLinkButton`; soft-fail to inline URL).

### Part B acceptance
- Each row shows its UUID + a working Report ↗ link and Copy-report-URL control;
  copied URL is absolute and emailable. Admin auth boundary unchanged.

## Part C — On follow-up submit, reveal the personalized report link

The report link is the **reward for completing the follow-ups** — the person
does NOT get it until they've answered. This also becomes how they find their
own page again.

### Tasks
- `POST /api/follow-up/[token]` (CC-126) → on success, also return
  `reportUrl: "{origin}/report/{sessionId}"` (the handler already resolves
  token → session, so it has the id).
- The public answer page (`app/follow-up/[token]/page.tsx`, CC-127) confirmation:
  replace the current "Thanks — your report is updating" with a warm reveal of
  their page, e.g. *"Thanks, {name} — your page is ready: [Open your report ↗]"*,
  the link/button pointing to `reportUrl` (new tab). Encourage them to bookmark it.
- The link must appear **only after a successful submit** — never on the
  pre-submit form, never on an unsubmitted/expired token.

### Part C acceptance
- After submitting the follow-up page, the confirmation shows a working
  `/report/{sessionId}` link; it is absent before submit.

## Allowed to Modify (exhaustive)

- Part A: a new `lib/followUpNarrative.ts` (resolve picks → narrative block) +
  the Grip/Next-Moves/Lens emit sites in `lib/renderMirror.ts`. Do NOT touch
  the numeric derivation in `lib/identityEngine.ts`.
- Part B: `app/admin/sessions/page.tsx` + an optional small client component.
- Part C: `app/api/follow-up/[token]/route.ts` (POST response adds `reportUrl`)
  and `app/follow-up/[token]/page.tsx` (confirmation reveals the link).
- A test/audit file.

## Out of Scope

- Changing numeric scores from follow-ups. Email send / scheduling.
- Re-openable follow-up tokens / "includes follow-ups since {date}" stamp
  (separate).

## Bash Commands Authorized

- `npx tsc --noEmit`; the repo test runner.

## Acceptance Criteria

1. Follow-up picks render as a Grip→Aim narrative block in the report when
   present; absent → report unchanged.
2. Numeric trajectory (Goal/Soul/Aim/Grip/Lens/OCEAN) byte-identical with vs.
   without follow-ups — prove on `jason-real` (49) vs its 45-answer base.
3. `compression_check` answers adjust only the Lens decompression *note*, never
   force a type change.
4. Admin rows show UUID + Report ↗ + Copy-report-URL (absolute); auth unchanged.
5. On follow-up submit, the confirmation reveals the person's `/report/{id}`
   link (absent before submit).
6. `npx tsc --noEmit` clean. No numeric-derivation files modified.

## Report Back

- Part A: the resolve-picks-to-words mechanism; paste the new Grip→Aim block as
  rendered for `jason-real`; confirm numeric fields unchanged vs base.
- Part B: files touched; confirm Report ↗ target + absolute copied URL.
- Part C: confirm the POST returns `reportUrl` and the confirmation reveals it
  only post-submit.
- `tsc` + test results. Confirm `prompts/active/CC-128-*.md` was deleted.
