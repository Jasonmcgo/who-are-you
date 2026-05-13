# CC-083 — Drive Case-Aware Prose (Claimed-vs-Revealed Inversion Render)

**Origin:** Jason's 2026-05-07 observation on his own report — claimed Drive ranks Cost #1 / Coverage #2 / Compliance #3, but his revealed distribution shows Coverage 36% / Compliance 35% / Cost 29% (Cost is #3 in lived flow). The current Drive paragraph reads:

> *"Your distribution is unusually balanced — building & wealth, people-service-and-society, and risk-mitigation motivators show roughly equal weight in your answers. That balance can mean disciplined integration of three competing drives, or it can mean unresolved tradeoffs the model can't see. Which feels closer?"*

Two interpretations offered (disciplined integration, unresolved tradeoffs); the third — and most diagnostic — is missing: **claimed-vs-revealed inversion.** What the user says guides them is not what their week actually serves. Per Jason: *"production/cost/money as #1 but it's actually #3 in % distribution."*

**Engine state already classifies this.** Per project memory `feedback_drive_case_vs_bucket_lean`: `DriveCase` is the matrix-tension classifier (aligned / inverted / etc.) — distinct from bucket lean. The classifier is computed; the prose composer just isn't reading it. This CC wires the case classifier into the Drive paragraph register.

**Per `feedback_coherence_over_cleverness` memory:** this is exactly the kind of cross-surface coherence work Clarence's 2026-05-07 directive prioritizes. No new questions. No new signals. No new patterns. The architecture already knows; the prose just translates the matrix. Build coherence first, add cleverness on a foundation that aligns.

**Scope frame:** editorial-judgment work (not mechanical wiring) because each `DriveCase` value needs a different prose register that lands the contradiction without moralizing. Borderline CC/CODEX; called CC because the prose authoring is the load-bearing decision.

---

## Launch Directive

Run with `claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Execution Directive

Single pass. Inspect the existing `DriveCase` union in `lib/types.ts` first — the canon classifier values drive the case-to-register mapping. Author one prose template per case value. Verify against Jason's session as the canonical real-cohort anchor: his case should fire the inversion register, the prose should name the contradiction explicitly, no moralizing.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run audit:goal-soul-give`
- `npm run audit:ocean` (regression)
- `npm run dev` — visual verification with a real session
- `git status`, `git diff`
- `node`, `npx tsx`
- `cat`, `ls`, `grep`, `find`

## Read First (Required)

1. `lib/types.ts` — find the `DriveCase` union. Report all canonical values (likely `'aligned' | 'inverted' | 'shifted' | 'balanced'` or similar). The exact set drives the case-to-register mapping.
2. `lib/drive.ts` — full file. Find:
   - The case classifier function (likely `computeDriveCase` or inline in `computeDriveOutput`)
   - The prose composer for the Drive paragraph (likely `generateDriveProse` or similar)
   - The current default-balanced prose template (the text starting *"Your distribution is unusually balanced..."*)
3. `lib/types.ts` — confirm `DriveOutput` shape: `{ distribution, claimed?, case, prose, ... }`. The composer reads all four.
4. `data/questions.ts` — confirm Q-3C1 captures claimed Drive (already known; verify the rank order is exposed via `claimed`).
5. Memory cross-references:
   - `feedback_drive_case_vs_bucket_lean` — DriveCase is matrix-tension classifier, not bucket lean. 38% threshold for bucket lean per workMap.ts/loveMap.ts pattern.
   - `feedback_coherence_over_cleverness` — coherence work, not cleverness; the matrix is computed, prose just hasn't been reading it.
   - `feedback_synthesis_over_contradiction` — name the contradiction kindly when evidence supports it.
6. `tests/audit/goalSoulGive.audit.ts` — find the existing Drive-related assertions if any. Pattern for the new case-aware assertions.
7. `prompts/completed/CC-067-…md` (esp the project memory entries about how Drive feeds the report) for context.
8. Report context — Jason's specific case is the canonical Test Fixture A:
   - Claimed: Cost #1, Coverage #2, Compliance #3
   - Revealed: Coverage 36%, Compliance 35%, Cost 29%
   - Expected DriveCase: `'inverted'` (or whatever the classifier returns for this strong pattern)
   - Expected prose register: contradiction-named, not balance-named.

## Allowed to Modify

These files only.

1. **`lib/drive.ts`** — three changes:
   - **Read `DriveCase`** in the Drive prose composer. Currently the composer likely defaults to bucket-lean or balanced templates without reading `case`. Branch the prose template selection on `case` value.
   - **Author per-case prose templates.** One template per `DriveCase` value. Each is a function or a constant that takes `DriveOutput` (for distribution percentages and claimed ranking) and produces the paragraph. Templates documented inline with comments citing CC-083.
   - **Compose the final prose** by selecting the case-appropriate template, then attaching the existing "Which feels closer?" or equivalent confirmation question (preserved across all cases — that part of the register is canon).

2. **`tests/audit/goalSoulGive.audit.ts`** — add Drive case-aware assertions:
   - **Inversion-case prose contains "claimed" AND "revealed"** (or close paraphrases) when `DriveCase === 'inverted'`. The prose must name both registers explicitly to be a contradiction-aware read; mentioning only one register collapses the case to bucket-lean.
   - **Inversion-case prose contains specific bucket names with their inverted positions** — e.g., "ranked X first" + "reads X third" or close paraphrase. Generic "your claimed ranking differs" is too vague; the audit asserts specificity.
   - **Aligned-case prose does NOT contain inversion register** — when claimed and revealed match, the prose doesn't manufacture a contradiction. Avoid false-positive inversion.
   - **Distribution-cap from prior audits still passes** (regression).

3. **`tests/fixtures/goal-soul-give/*.json`** — verify or add a fixture that explicitly fires the inversion case. If Jason's existing real-session fixture (`07-jason-real-session.json` or similar) already produces `DriveCase === 'inverted'`, no new fixture needed; document. If not, add `13-drive-inverted-case.json` with the canonical Jason-shaped Drive contradiction (claimed Cost #1 / revealed Cost #3).

## Out of Scope (Do Not)

1. **Do NOT modify `Q-3C1`** or any question in `data/questions.ts`. Claimed Drive measurement is canon-locked.
2. **Do NOT modify `SIGNAL_DRIVE_TAGS`** in `lib/drive.ts`. Bucket tagging is canon-locked.
3. **Do NOT modify `computeDriveDistribution`, `grippingClusterFires`, or any non-prose function in `lib/drive.ts`.** The math is canon; only the prose composer changes.
4. **Do NOT modify `DriveCase` union** in `lib/types.ts`. The classifier values are canon; the prose just reads them. If the existing union is missing a case the audit needs (e.g., `'partial_inversion'`), document it for a future CC and use the existing values for now.
5. **Do NOT modify Goal/Soul/Movement files** (`lib/goalSoulGive.ts`, `lib/goalSoulMovement.ts`, etc.). The Drive paragraph is independent.
6. **Do NOT modify OCEAN files.** Drive and OCEAN are independent layers.
7. **Do NOT change the "Which feels closer?" confirmation question** at the end of the paragraph (or whatever the existing canonical confirmation phrasing is). That part of the register is canon-preserved across all case branches.
8. **Do NOT install new dependencies.**
9. **Do NOT modify `docs/goal-soul-give-spec.md` or any spec memo.** Spec drift is documented for a follow-on CODEX (CODEX-084 or similar).
10. **Do NOT modify `MEMORY.md`, `AGENTS.md`, or any file under `docs/canon/`.**
11. **Do NOT moralize on inversion.** The contradiction is observation, not judgment. *"You're not living what you say you value"* is forbidden; *"What you say guides you and what your week serves are different things — naming the difference is more useful than naming the balance"* is in-register.
12. **Do NOT use therapy-coded language.** "Your inner work," "shadow," "authentic self," etc. are forbidden in the Drive paragraph as everywhere else.
13. **Do NOT default to inversion when the case is genuinely balanced.** If `DriveCase === 'aligned'` or `'balanced'`, the existing two-interpretation framing (disciplined integration / unresolved tradeoffs) is correct.
14. **Do NOT add a "shape summary" line** at the bottom of the Drive section. That's a possible future workshop item (Clarence's bottom-line framing); out of scope here.

## Acceptance Criteria

### Prose composer branching

1. The Drive prose composer in `lib/drive.ts` reads `DriveOutput.case` and branches the template selection accordingly. One template per `DriveCase` union value. Documented inline.

2. The case-to-register mapping is:
   - **`'aligned'`** (claimed top matches revealed top): existing balanced/dominant framing. The two-interpretation question (disciplined integration / unresolved tradeoffs) is preserved. Prose does NOT name a contradiction.
   - **`'inverted'`** (claimed top is revealed bottom, or similar strong contradiction): contradiction-aware register. Prose names the specific bucket names and their inverted positions ("ranked X first ... reads X third"). Names the gap as the diagnostic, not the balance.
   - **Other cases** (e.g., `'shifted'` if it exists): intermediate register. Names the partial gap without overstating a strong inversion.
   - **`'balanced'`** (no clear dominance, claimed and revealed both balanced): existing balanced framing.

3. The "Which feels closer?" confirmation question (or canonical equivalent) appears in all case branches.

### Inversion-case prose canon

4. When `DriveCase === 'inverted'`, the rendered Drive paragraph:
   - Contains both "claimed" AND "revealed" (or close paraphrases). Audit-asserted.
   - Names the specific bucket inversion pair (e.g., "ranked Building & wealth first ... reads Building & wealth third"). Audit-asserted.
   - Frames the gap as the diagnostic ("the gap is the diagnostic — not the balance" or close paraphrase).
   - Does NOT moralize ("you're not living what you say you value" or similar is forbidden).
   - Preserves the closing "Which feels closer?" or canonical confirmation.
   - Word count: 80–160 (richer than balanced's ~70 words because contradiction naming requires specificity).

### Aligned-case regression

5. When `DriveCase === 'aligned'`, the rendered Drive paragraph:
   - Does NOT contain "claimed and revealed don't agree" or close paraphrase. The aligned case has no contradiction; the prose doesn't manufacture one. Audit-asserted.
   - Retains the existing balanced/disciplined-integration framing.

### Jason-shape verification

6. Jason's session (real-cohort fixture; classified as `DriveCase === 'inverted'`):
   - Renders the inversion-aware register.
   - Specifically names "Building & wealth" first claimed / third revealed (or equivalent specific bucket-name pairing).
   - Audit-asserted via fixture.

### Audit additions

7. New audit assertions added to `tests/audit/goalSoulGive.audit.ts`:
   - `drive-inverted-prose-contains-both-registers`: when `DriveCase === 'inverted'`, prose contains "claimed" AND "revealed".
   - `drive-inverted-prose-names-buckets`: when `DriveCase === 'inverted'`, prose contains at least one bucket-name pair (e.g., "Building & wealth ... first ... third" or similar specific pairing).
   - `drive-aligned-prose-no-inversion-register`: when `DriveCase === 'aligned'`, prose does NOT contain "claimed and revealed don't agree" or "the gap is the diagnostic".
   - `drive-prose-no-moralizing`: across all cases, prose does NOT contain "you're not living", "you should", "what you really value" (and similar moralizing phrases).
   - `drive-prose-preserves-confirmation`: across all cases, prose ends with "Which feels closer?" or canonical equivalent.

8. Existing CC-067/068/070/071/077 audit assertions continue to pass.

### Build hygiene

9. `npx tsc --noEmit` exits 0.
10. `npm run lint` exits 0.
11. `npm run audit:goal-soul-give` exits 0.
12. `npm run audit:ocean` exits 0 (regression — OCEAN unchanged).
13. `git status --short` shows only Allowed-to-Modify files.
14. `data/questions.ts` unchanged (40 question_ids).
15. No new dependencies.

## Report Back

1. **Summary** — what was implemented in 5–8 sentences.
2. **`DriveCase` union values** — verbatim from `lib/types.ts`. The exact set drives the case-to-register mapping.
3. **Per-case prose templates** — for each `DriveCase` value, paste the rendered prose verbatim using a representative fixture. The inversion case is the headline; show the contradiction language landing.
4. **Jason fixture verification** — quote the rendered Drive paragraph for the inversion fixture (Jason-shaped if available, or synthesized canonical inversion). Verify both registers named, specific buckets cited, no moralizing.
5. **Audit pass/fail breakdown** — fixture-by-fixture, including all CC-067 through CC-079 + CODEX-080/081/082 + CC-083 layers.
6. **Canon ambiguities** — quote the spec where it doesn't anticipate the case-to-register mapping, name the call.
7. **Files modified** — every path with line-count delta.
8. **Out-of-scope verification** — `git status --short`.
9. **Spec ↔ code drift report** — note that the case-to-register mapping should canonize in a follow-on CODEX. Specifically: spec needs a section documenting (a) `DriveCase` values, (b) which prose register each fires, (c) the inversion-naming canon ("name claimed and revealed bucket positions explicitly").
10. **Open questions** — anything that surfaced.

---

## Method note

**The matrix is computed; the prose just hasn't been reading it.** This CC is pure coherence work — engine state already classifies the contradiction; the user-facing surface just needs to translate. No new measurement, no new architecture. Jason's *"production/cost/money as #1 but it's actually #3"* is the canonical inversion case the existing classifier should already be flagging; this CC makes the prose say so.

**Naming the contradiction is more useful than naming the balance.** Two interpretations offered ("disciplined integration / unresolved tradeoffs") were genuine but missed the diagnostic. The user's question — *"Which feels closer?"* — preserves the user's confirmation role. The case-aware register tells the user *what the model is actually reading,* not just *that the model sees ambiguity.*

**Don't moralize on inversion.** A user who claims Cost #1 but lives Coverage #1 isn't wrong, dishonest, or unaligned with their values. They may be in a season where coverage demands have grown faster than they've updated their self-narrative; they may be living their values better than they've articulated them; they may be in genuine tension. The prose names the gap; the user names what it means. That's the canon register.

**The "Which feels closer?" confirmation is preserved across all cases** because the user's interpretive role is canon. The case-aware register changes the diagnostic premise (balance vs contradiction); the user still owns the meaning.
