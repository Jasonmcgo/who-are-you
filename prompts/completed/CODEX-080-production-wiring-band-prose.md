# CODEX-080 — Production Wiring for §13.5b Band Prose

**Origin:** CC-079 §12 Open Questions §1 — *"Production users do not yet receive band prose. computeMovement accepts optional `oceanIntensities` and `signals`, but `lib/identityEngine.ts:buildInnerConstitution` continues to call with 2 args... Until then, only the audit fires the new band logic. Jason's actual session would therefore continue to render the CC-068/CC-070 templates."* CC-079 added the optional parameters and the band logic; CODEX-080 connects the two endpoints so production sessions render the §13.5b prose.

**Scope frame:** Mechanical wiring. Two-line change in `buildInnerConstitution`: pass `oceanIntensities` (from `computeOceanOutput`'s already-existing result) and `signals` (already computed earlier in the same function) into the existing `computeMovement` call.

**Why CODEX, not CC:** No architectural decision-making (CC-079 designed the optional params and selection logic). No new types, signals, or prose. Surface area is two lines. Risk is low — both params are optional, backward-compatible.

**Why this matters tomorrow:** Clarence (the inventor of Goal/Soul/Give) takes the assessment tomorrow per Jason's directive. Without CODEX-080, the §13.5b band logic CC-079 just shipped does NOT fire for live sessions; only the audit exercises it. Clarence's report would render the CC-068/CC-070 generic Movement prose instead of the band-aware affirmation + Soul-lift practices. CODEX-080 is the gate between "audit-only" and "user-visible."

---

## Launch Directive

Run with `claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Execution Directive

Single pass. Find the `computeMovement(...)` call inside `buildInnerConstitution`, confirm the values it needs are already in scope (they should be — `signals` is computed earlier; `oceanIntensities` is the `intensities` field of the `computeOceanOutput` result), and pass them as the 3rd and 4th args. No other logic changes.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run audit:goal-soul-give`
- `npm run audit:ocean` (regression)
- `npm run dev` — visual verification with a real session (optional)
- `git status`, `git diff`
- `cat`, `grep`, `find`

## Read First (Required)

1. `lib/identityEngine.ts` — full file. Find `buildInnerConstitution`. Locate (a) the call to `computeOceanOutput(...)` whose result has `dispositionSignalMix.intensities`, (b) the variable holding the extracted `signals` array (likely named `signals` from `deriveSignals(answers)`), (c) the call to `computeMovement(...)` and confirm it's currently called with 2 args.
2. `lib/goalSoulMovement.ts` — confirm the `computeMovement` signature post-CC-079: `computeMovement(goalSoulGive, demographics, oceanIntensities?, signals?)`. The 3rd and 4th args are optional with backward-compatible defaults.
3. `lib/types.ts` — confirm the `OceanIntensities` type matches what `computeOceanOutput(...).dispositionSignalMix.intensities` returns. (Per CC-072: `OceanOutput.dispositionSignalMix.intensities`. Per CC-077: post-cleanup intensities.)
4. `prompts/completed/CC-079-…md` — esp §12 Open Question §1 and §11 Spec ↔ code drift report. The architectural decision is documented; CODEX-080 implements the wiring.
5. `tests/audit/goalSoulGive.audit.ts` — verify the band-prose audit assertions don't change as a result of this CODEX (they shouldn't — the audit already threads the params).

## Allowed to Modify

This file only:

1. **`lib/identityEngine.ts`** — modify the existing `computeMovement(...)` call inside `buildInnerConstitution` to pass the additional `oceanIntensities` and `signals` parameters. The change should be confined to the call site; no other logic edits.

## Out of Scope (Do Not)

1. **Do NOT modify `lib/goalSoulMovement.ts`.** CC-079 already added the optional params and band logic.
2. **Do NOT modify `lib/ocean.ts` or `lib/oceanDashboard.ts`.** OCEAN computation is unchanged.
3. **Do NOT modify the `MovementOutput` type, `computeMovement` signature, or any function declaration.** This CODEX is purely a call-site change.
4. **Do NOT add new fields, new helpers, or new imports beyond what's needed to reach the existing `oceanIntensities` and `signals` values in scope.**
5. **Do NOT modify `tests/audit/goalSoulGive.audit.ts`.** The audit already exercises the band logic via its own threading.
6. **Do NOT modify `app/page.tsx` or any other production caller.** `buildInnerConstitution` is the integration point; downstream callers are unaffected.
7. **Do NOT modify spec memos (`docs/goal-soul-give-spec.md`, `docs/ocean-disposition-spec.md`).** Spec drift is documented for a follow-on CODEX (CODEX-082 spec sync).
8. **Do NOT modify `MEMORY.md`, `AGENTS.md`, or any file under `docs/canon/`.**
9. **Do NOT install new dependencies.**
10. **Do NOT change the order of computation in `buildInnerConstitution`.** OCEAN must continue to compute before Movement; both `signals` and `oceanIntensities` must be in scope at the point of the `computeMovement` call. If they're not currently in the right order, document it in Report Back rather than restructuring.
11. **Do NOT add fallback / null-check logic beyond what's already there.** The `computeMovement` signature already declares both new params optional with sensible defaults; passing them when available is sufficient.

## Acceptance Criteria

1. The `computeMovement(...)` call inside `buildInnerConstitution` now passes 4 arguments: `(goalSoulGive, demographics, oceanIntensities, signals)`. Verified by inspection.
2. `oceanIntensities` is sourced from the `computeOceanOutput(...)` result's `dispositionSignalMix.intensities` (or whatever field CC-072/CC-077 actually lands at). Use the locked field name from the deployed type, not the spec-predicted name.
3. `signals` is sourced from the variable already in scope in `buildInnerConstitution` (likely the result of `deriveSignals(answers)` called earlier in the same function).
4. The `computeMovement` signature is unchanged — only the call site updated.
5. Backward compatibility preserved: any other caller of `computeMovement` (e.g., direct test invocations) continues to work with 2 args.
6. `npx tsc --noEmit` exits 0.
7. `npm run lint` exits 0.
8. `npm run audit:goal-soul-give` exits 0 (regression — band assertions still pass; non-band fixtures unchanged).
9. `npm run audit:ocean` exits 0 (regression — OCEAN unchanged).
10. `git status --short` shows ONLY `M lib/identityEngine.ts`. No other files modified by CODEX-080.
11. `data/questions.ts` unchanged (40 question_ids).

### Functional verification (post-merge, manual)

12. After merging, a re-rendered report for a session whose Movement angle falls in [20°, 44°] AND length ≥ 40 AND raw_soul ≥ 20 (e.g., Jason's session ID `54265a13-ab24-4c70-95fd-8052e85c4a3f`) renders the §13.5b band prose: opens with "productive NE movement", names 1–2 of the five canonical Soul-lift practices, closes with the lift framing. Verifiable via `npm run dev` and inspecting the rendered Movement section, OR by re-reading the generated markdown.

## Report Back

1. **Summary** — what was changed in 2–3 sentences.
2. **Diff** — the BEFORE and AFTER `computeMovement(...)` call site, verbatim.
3. **Field-name verification** — confirm the `oceanIntensities` source path. Quote the line that extracts it from `computeOceanOutput`'s result (e.g., `oceanOutput.dispositionSignalMix.intensities`).
4. **Computation order check** — confirm both `signals` and `oceanIntensities` are in scope at the `computeMovement` call site. If not, document the issue and (if minor) reorder the computation; if non-trivial, halt and report rather than restructure.
5. **Audit pass/fail breakdown** — confirm both audits still green; band assertions in goal-soul audit continue to pass.
6. **Out-of-scope verification** — `git status --short`.
7. **Visual verification** — if `npm run dev` was run, paste the rendered Movement section for at least one in-band session.
8. **Open questions** — anything that surfaced.

---

## Method note

**This CODEX is the smallest possible change that makes CC-079's work user-visible.** Don't widen scope — no prose tweaks, no audit changes, no architectural revisits. The two-line wiring is the entire deliverable.

**The architectural decision was made in CC-079** when it added the optional params with the explicit design rationale of "production caller threads when ready." This CODEX is the "ready" moment.

**Tomorrow's deadline matters.** Clarence's session is the first non-Jason real-cohort case for the band prose. After CODEX-080, his report will exercise the same selection logic: low-E or compartmentalized → translate care visibly; high-C + Te-top-2 → convert structure into mercy; etc. The audit fixtures don't fully cover all branches; Clarence's session will tell us whether the selection logic generalizes beyond Jason's signal pattern.
