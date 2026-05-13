# CODEX-082 — Accumulated Spec Drift Sync (post CC-072 → CODEX-081)

**Scope frame:** Mechanical doc-only sync. The deployed code from CC-072 through CODEX-081 has accumulated spec/code drift items that prior CCs honestly flagged but didn't fix (per the "spec catches up to code, not the reverse" rule from CODEX-076). This CODEX bundles all flagged drift into a single mechanical sync against `docs/ocean-disposition-spec.md` and `docs/goal-soul-give-spec.md`.

**Per `feedback_codex_vs_cc_prompt_naming` memory:** mechanical/surgical scope. CODEX, not CC. Two files, no architectural decisions.

**Per `feedback_coherence_over_cleverness` memory:** spec-to-code coherence is exactly the kind of foundational work that fits Clarence's 2026-05-07 directive. Doc layer alignment closes a coherence gap; doesn't add cleverness.

**Parallel-fire safety:** This CODEX modifies only `docs/*.md` files. Zero overlap with any other CC's Allowed-to-Modify scope. Safe alongside any in-flight architectural CC.

---

## Launch Directive

Run with `claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Execution Directive

Single pass. Each drift item below has a flagged source (CC report §X) and a sync target (spec section). The deployed code is canon at this point — the spec language was the prediction; the deployment is the evidence. On any case where the spec language reads as preferred over the deployed form, leave a `<!-- CODEX-082: code drift — spec preferred -->` HTML comment beside the spec line and proceed; do NOT silently revert.

## Bash Commands Authorized

- `git status`
- `git diff docs/ocean-disposition-spec.md`
- `git diff docs/goal-soul-give-spec.md`
- `cat`, `grep`
- `npx tsc --noEmit` (sanity — no code change should affect this)

## Read First (Required)

1. `docs/ocean-disposition-spec.md` — full file. The OCEAN drift items below sit in §3.4 / §3.5 / §3.6 / §4 / §6 / §11.
2. `docs/goal-soul-give-spec.md` — full file. Goal/Soul drift items sit in §13.5b / §13.5c.
3. `lib/ocean.ts` and `lib/oceanDashboard.ts` — for the deployed phrasings the spec must sync to (especially the architectural-led three-sentence chain, the moderate-E template, the "care with a spine" close, the architectural-tie-break logic).
4. `lib/goalSoulMovement.ts` — for the §13.5b deployed phrasings (the "Soul" → "love-line" and "Goal-leading" → "leading on the Work axis" close-paraphrases).
5. CC reports flagged drift in their §11 or §12 sections — treat those reports as the authoritative drift checklist:
   - `prompts/completed/CC-072-…md` §12 (Spec ↔ code drift report)
   - `prompts/completed/CC-077-…md` §12 (Spec ↔ code drift report)
   - `prompts/completed/CC-079-…md` §11 (Spec ↔ code drift report)
   - `prompts/completed/CODEX-078-…md` (architectural-tie-break canon §3.5)
   - `prompts/completed/CODEX-080-…md` (production wiring; minimal drift)
   - `prompts/completed/CODEX-081-…md` (architectural-led generic-closer skip)

## Allowed to Modify

These two files only:

1. **`docs/ocean-disposition-spec.md`** — sync the OCEAN drift items below.
2. **`docs/goal-soul-give-spec.md`** — sync the Goal/Soul drift items below.

## Out of Scope (Do Not)

1. **Do NOT modify any code file.** Code is canon; spec catches up to it.
2. **Do NOT modify `MEMORY.md`, `AGENTS.md`, or any file under `docs/canon/`.**
3. **Do NOT add new sections.** Edits are in-place text replacements.
4. **Do NOT change canonical numbered sections** (e.g., §5.2 → §5.3 renumbering).
5. **Do NOT modify §11 Canon Language quoted phrases** unless one specifically appears in the drift list below.
6. **Do NOT alter the §11a Narrative Guidance quarantined phrasings.** That section is canon.
7. **Do NOT install dependencies, edit package.json, or touch tests.**
8. **Do NOT delete the deprecated `OceanOutput.distribution` field references** if they're still informative as historical context. The legacy field deletion is CODEX-083's scope (queued).

## Acceptance Criteria

### OCEAN spec drift items (`docs/ocean-disposition-spec.md`)

1. **§3.4 signal-pool tagging update (CC-077).** The signal pool description for Architectural Openness (and other subdimensions if applicable) needs to reflect post-CC-077 cleanup: (a) Q-T cog-function signals (`ne`, `se`, `te`, `fe`) no longer carry secondary E tags; each tags only its native bucket; (b) the four love-line signals (`coverage_drive`, `partner_trust_priority`, `close_relationships_stakes_priority`, `family_trust_priority`) no longer tag into A; they feed Soul via Goal/Soul derivation. Update §3.4 (and §3 framing if needed) to note the love-line / Soul carve-out and the cog-function single-bucket discipline.

2. **§3.5 architectural-led flavor — three-sentence chain (CC-077).** The spec lists single-sentence flavor strings per subdimension. Architectural-led was promoted to the verbatim three-sentence chain in CC-077: *"Your openness reads as structured and conceptual rather than novelty-seeking. The imagination register is alive, but it tends to look for form: frameworks, models, songs, systems, strategies, meanings, and long-arc patterns. This is openness under discipline — creativity that wants architecture."* Update §3.5 to canonize the three-sentence chain as the architectural-led flavor (replacing the single-sentence form) and note the asymmetry — only architectural-led has the three-sentence chain; the other subdimensions retain single-sentence flavors.

3. **§3.5 architectural-tie-break canon (CODEX-078).** Add a paragraph (or a §3.5a subsection) documenting the tie-break rule: *"When intellectual and architectural Openness subdimensions tie or near-tie at the high band (architectural ≥ 80 AND within `OPENNESS_FLAVOR_GAP_THRESHOLD = 15` points of the top), architectural-led wins the flavor selection. Architectural is the integration register — disciplined imagination resolving into structure — and is the more useful read when ties saturate."* This is the asymmetric tie-break that fires Jason's architectural chain instead of the mixed fallback.

4. **§3.6 architectural-led generic-closer skip (CODEX-081).** Add a clarifying sentence to §3.6 (or wherever flavor-rendering is described): *"The architectural-led three-sentence chain is self-contained; the generic per-band Openness closer is skipped only for this flavor to avoid duplicating the chain's second sentence in weaker form. Other flavors retain the band closer."* Documents the CODEX-081 surgical fix.

5. **§4 Agreeableness register — "care with a spine" canonical phrase (CC-077).** Add to §4 the canonical close phrase for high-A: *"The high signal is not 'softness'; it is care with a spine."* Note this is the closing sentence of the high-A paragraph (intensity ≥ 80), and that "care with a spine" disambiguates loyalty/moral-concern from accommodation in a single sentence.

6. **§4 Agreeableness register — duplicate-phrase guard (CC-077).** The pre-CC-077 high-A template doubled "truth and responsibility may still outrank surface harmony" once in the loyalty disambiguation and once in the moral-concern register restatement. Add a sentence to §4: *"The phrase 'truth and responsibility may still outrank surface harmony' appears at most once in the rendered A paragraph; doubling it is a regression of the duplicate-phrase fix."*

7. **§6 moderate-E new band template (CC-077).** §6 register table likely defines low-E and high-E narrative phrasings; moderate-E was ambient. Add a row to §6 (or extend the relevant subsection) with the canonical moderate-E template: *"the outward-energy register reads as situational and measured — moving outward when the moment, role, or mission calls for it, while the interior process does not automatically broadcast itself."* Note the band threshold: 40 ≤ intensity < 65.

8. **§5.2 forbidden-phrase example (CC-072 → CODEX-076 already partial).** Verify CODEX-076 fully removed the negated quote of "you are emotionally unaffected." If any reference remains, sync to the deployed close-paraphrase: *"the safer read is that your emotional reactivity may not be easily visible from the outside, not that the affect-channel itself is absent."*

### Goal/Soul spec drift items (`docs/goal-soul-give-spec.md`)

9. **§13.5b "Soul" → "love-line" close-paraphrase (CC-079).** Practices 1 and 2 in the spec use "Soul" verbatim in their explanatory clauses. The deployed Movement narrative is forbidden from using the substring "soul" (case-insensitive) per the §13.11 / §12.14 engine-vocabulary guard. CC-079 close-paraphrased to "love-line" in both. Sync §13.5b: rewrite Practice 1's *"Abstract Soul reads thinner than named Soul"* to *"an abstract love-line reads thinner than a named one"* (or similar deployed phrasing). Rewrite Practice 2's *"the most common Soul gap"* to *"the most common love-line gap"* (or similar). Note inline that the spec text is the user-facing register, not the engine-vocabulary form.

10. **§13.5b "Goal-leading" → "leading on the Work axis" (CC-079).** The example affirmation uses "Goal-leading" which contains the forbidden substring "goal." Sync the §13.5b example to the deployed "leading on the Work axis" form. Add a note that the engine-vocabulary guard forbids "goal" / "soul" / "vulnerability" substrings in user-facing prose.

11. **§13.5b selection-rule precedence (CC-079).** The spec describes the selection rule informally ("low-E → translate care visibly," etc.). CC-079 codified the rule as a first-firing-wins if-chain in `selectSoulLiftPractices`. Sync §13.5b to pin the rule order explicitly: *"Selection is first-firing-wins in this order: (a) low-E or compartmentalized → translate care visibly; (b) high-C + Te-top-2 → convert structure into mercy; (c) sacred-words-vs-spending tension → allocate resources to the sacred value; (d) default pair → name the beloved + choose one recurring act of Giving."*

12. **§13.5c symmetric 55°–79° band — TBD canon explicit (CC-079).** Confirm §13.5c notes the band's status as TBD. If it's already noted, no change needed. If not, add: *"The symmetric 55°–79° Soul-side band is TBD canon. Five Goal-lift practices need workshop authoring before lock; until then, the existing CC-068 Longing template stands for in-band fixtures."*

### Both memos — coherence

13. **Cross-spec reference integrity.** Verify `goal-soul-give-spec.md` §14 OCEAN cross-reference points are still accurate after the OCEAN spec edits. No orphaned references.

14. **Numbered sections preserved.** §1 through §14 numbering in `goal-soul-give-spec.md` and §1 through §13 numbering in `ocean-disposition-spec.md` remain unchanged. No section renumbering.

### Build hygiene

15. `npx tsc --noEmit` exits 0 (sanity — no code change).
16. `git status --short` shows ONLY `M docs/ocean-disposition-spec.md` and `M docs/goal-soul-give-spec.md`.

## Report Back

1. **Diff summary** — line-count delta for each memo.
2. **Drift items addressed** — for each numbered AC item (1–12), confirm the edit was applied. If any item was already partially fixed (e.g., a prior CODEX caught half of it), note that.
3. **Verbatim before/after** — for §3.5 (three-sentence chain), §4 ("care with a spine" canonical phrase), §6 (moderate-E template), and §13.5b ("love-line" + "leading on the Work axis" + selection-rule precedence): paste the before-text and after-text. These are the highest-stakes edits because they sync to audit-enforced canon.
4. **Cross-spec reference check** — confirm §14 cross-references still accurate.
5. **Out-of-scope verification** — `git status --short` confirming only the two memos modified.
6. **Open drift items not addressed** — anything in the prior CC reports' drift lists that's NOT in this CODEX's AC. Note whether they're (a) already fixed by a prior CODEX, (b) intentionally left for a future CODEX, or (c) intentionally out of scope.

---

## Method note

Spec catches up to code. The deployed prose templates and audit forbidden-substring lists ARE canon at this point — CC-072, CC-077, CC-079, CODEX-078, CODEX-080, CODEX-081 ratified them. The memo language was the prediction; the deployment is the evidence.

If during implementation you find a drift item where the spec language was actually better than the deployed form (e.g., a spec phrasing that the audit happens to reject but should not), do NOT silently switch the spec to match the audit. Leave the comment marker noted in the Execution Directive and proceed; that drift is escalated for a future CC to decide.

The "love-line" / "Soul" sync in §13.5b is the highest-leverage canon clarification this CODEX makes. It documents the engine-vocabulary substitution canon: the spec describes architecture in engine vocabulary; the deployment renders in narrative vocabulary; the substitution at render time is canon, not error.

The "care with a spine" canonical phrase in §4 does load-bearing register work in a single sentence — distinguishes loyalty-with-conviction-for-truth from accommodation-for-harmony cleanly. Future Agreeableness calibration CCs should preserve it.
