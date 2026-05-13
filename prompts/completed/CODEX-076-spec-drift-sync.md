# CODEX-076 — Spec Drift Sync (OCEAN + Goal/Soul memos)

**Scope frame:** Mechanical spec-memo cleanup. Drift items accumulated across CC-067 through CC-072 reports — places where the deployed code intentionally diverged from spec language for canon reasons (forbidden-phrase guards, audit-vocab alignment, register changes). The code is right; the memos haven't caught up. This CODEX syncs both memos to the deployed state. **Pure documentation, no code changes.**

**Per `feedback_codex_vs_cc_prompt_naming` memory:** mechanical/surgical scope. CODEX, not CC. Two files, no architectural decisions.

**Parallel-fire safety:** This CODEX modifies only `docs/*.md` files. Zero overlap with CC-075's Allowed-to-Modify (`lib/ocean.ts`, `tests/fixtures/ocean/*.json`, `tests/audit/oceanDashboard.audit.ts`, `package.json`). Safe to fire concurrent with CC-075.

---

## Launch Directive

Run with `claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Execution Directive

Single pass. The deployed prose templates and audit assertions are the source of truth; the memos sync to match. On any case where the spec language reads as preferred over the deployed form, leave a `<!-- CODEX-076: code drift — spec preferred -->` HTML comment beside the spec line and proceed; do NOT silently revert.

## Bash Commands Authorized

- `git status`
- `git diff docs/ocean-disposition-spec.md`
- `git diff docs/goal-soul-give-spec.md`
- `cat`, `grep`
- `npx tsc --noEmit` (sanity check; no code change should affect this)

## Read First (Required)

1. `docs/ocean-disposition-spec.md` — full file. The OCEAN drift items live in §3.4, §5.2, §9, §13.7 (legacy mention).
2. `docs/goal-soul-give-spec.md` — full file. The Goal/Soul drift items live in §9 (Defensive/Generative Builder firing conditions), §10 sample copy (some parts already synced via CODEX-069 but post-CC-068 polish may have re-drifted), §13.7 (Tech/Engineering profession qualifier), §13.8 (thin-signal "Vulnerability" example word).
3. `lib/ocean.ts` and `lib/oceanDashboard.ts` — for verifying the deployed prose / disclosure phrasings the spec should sync to.
4. `lib/goalSoulGive.ts`, `lib/goalSoulMovement.ts`, `lib/goalSoulPatterns.ts` — same purpose for the Goal/Soul side.
5. `tests/audit/oceanDashboard.audit.ts` and `tests/audit/goalSoulGive.audit.ts` — for the forbidden-substring lists that tell you what the spec must NOT say.
6. `prompts/completed/CC-068-…md`, `prompts/completed/CC-070-…md`, `prompts/completed/CC-071-…md`, `prompts/completed/CC-072-…md` — each carries a §11 or §12 spec ↔ code drift report. Treat those reports as the authoritative drift checklist.

## Allowed to Modify

These two files only:

1. **`docs/ocean-disposition-spec.md`** — the OCEAN drift items below.
2. **`docs/goal-soul-give-spec.md`** — the Goal/Soul drift items below.

## Out of Scope (Do Not)

1. **Do NOT modify any code file.** Code is canon; spec catches up to it.
2. **Do NOT modify `MEMORY.md`, `AGENTS.md`, or any file under `docs/canon/`.**
3. **Do NOT add new sections to either spec memo.** This CODEX edits existing prose only.
4. **Do NOT change canonical numbered sections (e.g., §5.2 → §5.3 renumbering).** Edits are in-place text replacements.
5. **Do NOT modify the §11 Canon Language quoted phrases** (in either memo) unless one specifically appears in the drift list below.
6. **Do NOT re-architect the §13.5b angle-band sub-rule, §13.4a Dashboard surface, or any §10 sample closing structurally.** This CODEX is text sync, not restructure.
7. **Do NOT alter the §11a Narrative Guidance quarantined phrasings.** That section is canon.
8. **Do NOT install dependencies, edit package.json, or touch tests.**
9. **Do NOT delete the deprecated `OceanOutput.distribution` field** or its memo references — that's CODEX-077's scope after CC-075 lands.

## Acceptance Criteria

### OCEAN spec drift items (`docs/ocean-disposition-spec.md`)

1. **§5.2 forbidden-phrase quote.** The current spec text quotes the negated forbidden phrase: *"the safer read is not 'you are emotionally unaffected,' but 'your emotional reactivity may not be easily visible from the outside.'"* The audit (per CC-072 §9) catches "you are emotionally unaffected" via substring match regardless of negation context. Replace the example with the deployed close-paraphrase: *"the safer read is that your emotional reactivity may not be easily visible from the outside, not that the affect-channel itself is absent."* Verified by grep that the spec no longer contains "you are emotionally unaffected".

2. **§3.4 "co-firing" framing.** The spec describes the Architectural Openness signal cluster as *"signal candidates: building_energy_priority + proactive_creator + truth_priority co-firing, Q-T ni + te co-prominence, Q-3C1 cost_drive + coverage_drive co-firing"* etc. The deployed `lib/ocean.ts` re-tags individual signals into subdimensions; there is no co-firing logic. Soften "co-firing" to "shared signal pool" — concretely: replace the bullet list's "co-firing" tokens with comma-separated signal lists, since each signal contributes independently to the architectural intensity. Preserve the substantive meaning (these are the signals that compose the architectural read); drop the multiplicative implication.

3. **§9 sample render shape — parens vs em-dashes.** The spec sample uses parentheticals: *"…how you organize your effort (Big Five Conscientiousness)…"*. The deployed prose uses em-dashes: *"…how you organize your effort — Big Five Conscientiousness — registering as…"*. Sync §9 to em-dashes throughout the trait-render samples. Style consistency only; meaning unchanged.

4. **§13.7 Tech/Engineering qualifier.** The spec's early-career illustrative example reads *"Early-career professional (1990s–2000s decade, Tech/Engineering)"*. The actual `data/demographics.ts` profession options are coarser (knowledge, creative, skilled_trades, etc.) — there is no Tech/Engineering option. Replace the qualifier with one that exists in the demographics field set, or drop the qualifier entirely. (Goal/Soul memo also has this drift if cross-referenced; sync both consistently.)

5. **§2.3 deprecated `distribution` field reference.** If the spec still describes the legacy 100%-summing `distribution` field as "current implementation," update to past-tense or note that it is deprecated and rendered via the new intensities path. The legacy field migration is CODEX-077's scope; CODEX-076 only updates the spec's *description* of the current state.

### Goal/Soul spec drift items (`docs/goal-soul-give-spec.md`)

6. **§9 Defensive Builder firing conditions.** The spec specifies the firing condition uses `building_motive_protective` OR `building_motive_control` — these are queued signals that don't exist yet (pending Q-Purpose-Building / CC-B). The deployed CC-070 heuristic substitutes `compliance_drive` top-1/2 in Q-3C1 + `grippingClusterFires` + `vulnerability_composite < 0` + `raw_soul < 35`. Add a §9.1 subsection or amend the firing condition to reflect the **CC-070 heuristic form** and note the original `building_motive_*` form ships with CC-B. Both forms preserved in the spec for canon clarity.

7. **§9 Generative Builder firing conditions.** The spec uses `goal_score ≥ 60` AND `soul_score ≥ 60` AND `vulnerability_score ≥ 10` AND (`building_motive_present` OR `building_motive_expressive`). CC-070 implemented `goal ≥ 70` AND `soul ≥ 70` AND `vulnerability ≥ 20` plus cross-axis Q-E1 / Q-S2 / Q-Ambition1 alignment. The thresholds were tightened (60→70, 10→20) because the looser values fired Generative Builder on Parallel Lives cases before Parallel Lives was removed. Sync §9 thresholds to 70/20 and document the alignment heuristic.

8. **§13.8 thin-signal example uses "Vulnerability".** Per CC-070 §11 drift report and CC-071 implementation: the deployed thin-signal close uses "Willingness, courage, action, contact" instead of "Vulnerability, courage, action, contact" because the engine-vocabulary guard forbids "Vulnerability" in user-facing prose (§13.11 + §12.14). Replace the §13.8 example to use "Willingness" verbatim or close paraphrase.

9. **§13.7 demographics example mention of "Tech/Engineering".** Same drift as OCEAN spec §13.7 (item 4 above). The Goal/Soul memo's early-career example contains the same qualifier. Sync both memos consistently.

10. **§10 sample closing copy regression check.** CODEX-069 synced §10 to match `lib/goalSoulGive.ts` `PROSE_TEMPLATES`. CC-071 reframed the templates (drop Parallel Lives template, "Striving"/"Longing" → "Work-leaning"/"Love-leaning" descriptors). Verify §10 still matches the post-CC-071 templates verbatim. If any sample closing has drifted, sync. (CC-071's §11 drift report explicitly flagged the SE Striving sample uses "Striving" verbatim — that's a sync target.)

11. **§9 Parallel Lives "REMOVED" stub completeness.** Confirm §9 Parallel Lives subsection is fully struck-through (CC-071 §9 should already say "REMOVED — post-revision"). If any reference remains as live canon (vs historical note), strike or remove.

### Both memos — coherence

12. **Cross-spec reference integrity.** `goal-soul-give-spec.md` §14 references `ocean-disposition-spec.md`. Verify the cross-reference points are still accurate after the §3.4 and §5.2 edits in the OCEAN memo. No orphaned references.

13. **Numbered sections preserved.** §1 through §14 numbering in `goal-soul-give-spec.md` and §1 through §13 numbering in `ocean-disposition-spec.md` remain unchanged. No section renumbering.

### Build hygiene

14. `npx tsc --noEmit` exits 0 (sanity — no code change).
15. `git status --short` shows ONLY `M docs/ocean-disposition-spec.md` and `M docs/goal-soul-give-spec.md`.
16. Pre-existing modifications to other files (CC-072, CODEX-073, CODEX-074, CC-071 working-tree leftover) are NOT touched by this CODEX. Verified by inspection of every Edit/Write call.

## Report Back

1. **Diff summary** — line-count delta for each memo.
2. **Drift items addressed** — for each numbered AC item (1–11), confirm the edit was applied. If any item revealed the drift was already partially fixed (e.g., a prior CODEX caught half of it), note that.
3. **Verbatim before/after** — for the §5.2 forbidden-phrase fix and the §13.8 "Willingness" fix, paste the before-text and after-text verbatim. These are the highest-stakes edits because they sync to audit-enforced forbidden lists.
4. **Cross-spec reference check** — confirm `goal-soul-give-spec.md` §14 OCEAN cross-reference is still accurate.
5. **Out-of-scope verification** — `git status --short` confirming only the two memos modified.
6. **Open drift items not addressed** — anything in the prior CC reports' drift lists that's NOT in this CODEX's AC. Note whether they're (a) already-fixed by a prior CODEX, (b) left for a future CODEX, or (c) intentionally out of scope.

---

## Method note

Spec catches up to code, never the reverse in this CODEX. The deployed prose templates and audit forbidden-substring lists ARE canon at this point — CC-072 and the prior chain ratified them. The memo language was the prediction; the deployment is the evidence.

If during implementation you find a drift item where the spec language was actually better than the deployed form (e.g., a spec phrasing that the audit happens to reject but should not), do NOT silently switch the spec to match the audit. Leave the comment marker noted in the Execution Directive and proceed; that drift is escalated for a future CC to decide.

The §13.8 "Willingness" / "Vulnerability" sync is the most architecturally meaningful drift item in this CODEX. The spec uses "Vulnerability" in a thin-signal example because the architecture says vulnerability is the lift factor; the deployed prose uses "Willingness" because the engine-vocabulary guard forbids "Vulnerability" in user-facing prose. Both are correct in their layer (spec describes the architecture; deployed prose obeys the user-facing guard). The sync acknowledges the deployment without weakening the architectural claim.
