# CC-079 — Angle-Band Movement Narrative Prose (§13.5b implementation)

**Origin:** `docs/goal-soul-give-spec.md` §13.5b — canonized 2026-05-07 post-CC-071-launch as a refinement to the Movement narrative prose layer. The five canonical bands (deep Goal-leaning 0°–19°, productive NE Goal-side 20°–44°, balanced sweet spot 45°–54°, productive NE Soul-side 55°–79° (TBD canon), deep Soul-leaning 80°–90°) define different prose registers. The 20°–44° band has been canonized in §13.5b but **never implemented** — CC-068's prose templates predate the canon, and CC-070/CC-071 didn't extend them. This CC ships the implementation. Jason's own session (angle 29° / length 64.9) sits in this band, so the user-visible improvement is direct.

**Scope frame:** Implement the §13.5b 20°–44° band prose rule. Three coordinated parts:

1. **Affirmation rule.** When `angle ∈ [20°, 44°]` AND `length ≥ 40` AND `raw_soul ≥ 20`, the Movement narrative's first sentence affirms the position before prescribing. The user has earned out-of-Gripping; the prose says so before pointing at any next move.

2. **Soul-lift practices.** One or two of the five canonical practices are named in the bridge sentences. Selection is signal-driven, not random.

3. **Forbidden registers.** No "Striving" or "Goal-leaning" as labels in the affirmation sentence (those are dashboard descriptors, not prose labels). No "more output" prescription. No moralizing on the asymmetry.

**Out of scope:** the symmetric 55°–79° Soul-side band is **TBD canon** per §13.5c — not implemented in CC-079. Five Goal-lift practices are speculative; lock waits for a future workshop session. The 0°–19°, 45°–54°, and 80°–90° bands keep their existing prose; only 20°–44° gets the new structure.

---

## Launch Directive

Run with `claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Execution Directive

Single pass. Read §13.5b carefully — the canon specifies four-sentence prose composition (affirmation → observation → 1–2 practices → landing) and five canonical practices verbatim. The selection rule is signal-driven; the implementation maps signal patterns to practices. On ambiguity, apply canon-faithful interpretation per §13.5b verbatim and flag in Report Back.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run audit:goal-soul-give`
- `npm run audit:ocean` (regression check)
- `git status`, `git diff`
- `node`, `npx tsx`
- `cat`, `ls`, `grep`, `find`

## Read First (Required)

1. `docs/goal-soul-give-spec.md` — full file. **§13.5b (20°–44° band canon, the load-bearing section), §13.5c (55°–79° TBD), §13.11 (Movement-specific guardrails — esp the new affirmation rule and Soul-lift practices canonical claims), §13.4a (Dashboard surface — for register-distinction context: dashboard uses Goal/Soul descriptors; prose uses narrative).**
2. `lib/goalSoulMovement.ts` — full file. The Movement narrative prose templates and band-selection logic. The current implementation has prose for low/balanced/high regions; the 20°–44° sub-band needs a new template path within the SE Goal-leaning region.
3. `lib/goalSoulGive.ts` — for the angle / length values that get passed to Movement; verify how `raw_soul` is exposed (needed for the affirmation rule's "raw_soul ≥ 20" gate per §13.5b).
4. `tests/audit/goalSoulGive.audit.ts` — current Movement assertion structure. New band-specific assertions extend this.
5. `tests/fixtures/goal-soul-give/01-generative.json` through `11-retirement-longing.json` — the 11 fixtures. Note which fixtures' angles fall in [20°, 44°]; these are the validation cases. Per CC-070/CC-071 reports: fixture 02-compartmentalized at 41° likely in band; fixture 07-true-gripping at 27° in band; possibly others. Audit each.
6. `prompts/completed/CC-068-…md` — for context on the original Movement prose templates and the bridge-phrase requirement (which carries forward to CC-079: every render names a bridge or next move).
7. `prompts/completed/CC-070-…md` and `prompts/completed/CC-071-…md` — for the post-revision Movement narrative architecture (descriptors not labels; engine words forbidden in prose; etc.).

Memory cross-references:

- `feedback_synthesis_over_contradiction` — coherence reads, evidence-gated. The 20°–44° affirmation IS the coherence read for users in productive-NE-movement.
- `feedback_marble_statue_humanity_gap` — accuracy without warmth. The Soul-lift practices are concrete, actionable, non-therapy-coded — exactly what the gap requires.
- `project_goal_soul_give_spec` — current canon state.

## Allowed to Modify

These files only.

1. **`lib/goalSoulMovement.ts`** — add the 20°–44° sub-template logic. Specifically:
   - **Band detector:** a helper function `isProductiveNEMovementBand(angle, length, rawSoul): boolean` that returns true when `angle ∈ [20°, 44°]` AND `length ≥ 40` AND `rawSoul ≥ 20`. Per §13.5b verbatim gate.
   - **Affirmation sentence template** for the band: opens with affirmation language ("Your line sits in productive NE movement…" / "The lift toward giving has started…" / similar). Per §13.5b: "name the position honestly. The user is outside Gripping; both axes are present; the lift toward Giving is happening." Verbatim or close paraphrase.
   - **Observation sentence template:** identifies Goal as the stronger axis WITHOUT prescribing more output. Per §13.5b: "What's strong here is the form — the building, the structure, the productive motion that has earned the position you're at." Verbatim or close paraphrase.
   - **Practice selection function** `selectSoulLiftPractices(constitution): SoulLiftPractice[]` returning 1–2 practices from the five canonical set per the §13.5b selection rule:
     - Low Extraversion (`adjusted_extraversion < 40` from `constitution.ocean.intensities.extraversion`) OR compartmentalized signal cluster (raw_goal ≥ 50 AND raw_soul ≥ 50 BUT vulnerability_composite < 0) → *Translate care visibly*.
     - High Conscientiousness (`adjusted_conscientiousness ≥ 60`) + Te prominence (Q-T te ranked top-2 in any block) → *Convert structure into mercy*.
     - Sacred-Words-vs-Sacred-Spending tension firing (the existing tension detector if accessible; or signal proxy: high Q-S2 family/compassion/mercy/faith priority + low corresponding Q-S3 spending priority) → *Allocate resources to the sacred value*.
     - Default pair (none of the above signal-driven rules fire): *Name the beloved* + *Choose one recurring act of Giving that does not depend on urgency*.
   - **Soul-lift practice prose templates** (5 short sentences, verbatim per §13.5b):
     1. **Name the beloved.** Make the people, the cause, or the calling concrete. Abstract Soul reads thinner than named Soul.
     2. **Allocate resources to the sacred value.** Time, attention, and resources flow toward what's said to matter. The gap between *named* and *funded* is the most common Soul gap.
     3. **Translate care visibly.** The internal love-line is real; the external sign of it can be sparse. The work is making the care legible to the people it's for.
     4. **Convert structure into mercy.** The same structuring gift that builds systems can build relief, comfort, and care. Use the gift in service of the love-line.
     5. **Choose one recurring act of Giving that does not depend on urgency.** Small and durable beats large and crisis-driven. The act survives the season.
   - **Landing sentence:** closes on the Soul-lift framing without restating the dashboard's numerical readouts. Per §13.5b: "The next move is rarely more output — it is letting one of these practices become regular enough that the love-line catches up to the form." Verbatim or close paraphrase.
   - **Composition:** when the band detector fires, the rendered narrative is `[affirmation] + [observation] + [practice 1, optionally + practice 2] + [landing]`. Total 4–5 sentences depending on how many practices selected.

2. **`tests/audit/goalSoulGive.audit.ts`** — add 20°–44° band assertions:
   - Band-detection assertion: for each fixture, verify `isProductiveNEMovementBand` returns the expected value (true if angle ∈ [20°, 44°] AND length ≥ 40 AND raw_soul ≥ 20; false otherwise).
   - **Affirmation present:** when in-band, the rendered Movement narrative's first sentence contains "productive NE movement" OR "the lift toward giving has started" OR close paraphrase. Substring match.
   - **Practices named:** when in-band, the prose contains AT LEAST ONE practice from the five-practice canonical set (substring match: "name the beloved" / "allocate resources to the sacred value" / "translate care visibly" / "convert structure into mercy" / "recurring act of Giving"). At MOST TWO of the five appear.
   - **Forbidden labels:** when in-band, the affirmation sentence does NOT contain "Striving" or "Goal-leaning" as labels (those are dashboard descriptors, not prose register).
   - **No "more output" prescription:** when in-band, the prose does NOT contain "build harder", "ship more", "produce more", or close variants. The work is the lift, not the volume.
   - **Word count adjusted:** when in-band, the prose word count is between 80–160 (richer than the bare-template 60–120 because affirmation + observation + practices + landing).
   - **Bridge phrase still required** per CC-068 canon: prose contains at least one phrase from the existing bridge allowlist (the work / the way / the bridge / the completion / next / begin / becoming / the willingness / moves toward / anchor / is to).
   - **Practice-selection sanity:** for fixtures with low-E + high-Soul, *Translate care visibly* should be in the practice list. For high-C + Te-dominant fixtures, *Convert structure into mercy*. Verify on at least one fixture per selection rule branch.

3. **`tests/fixtures/goal-soul-give/*.json`** — add 1–2 new fixtures specifically exercising the 20°–44° band if the existing fixture set doesn't cover all selection-rule branches. Likely fixtures needed:
   - One in-band fixture with low-E + active Soul (verifies *Translate care visibly* selection)
   - One in-band fixture with high-C + Te-dominant (verifies *Convert structure into mercy* selection)
   - Existing in-band fixtures likely cover the default-pair branch (Name the beloved + Choose one recurring act); verify by audit.
   
   **Do NOT modify existing fixtures' answer arrays.** Only add new fixtures with new IDs. Update `EXPECTED_PATTERNS_BY_FIXTURE` and other audit truth tables to include the new fixtures.

## Out of Scope (Do Not)

1. **Do NOT implement the 55°–79° Soul-side symmetric band.** Per §13.5c, the five Goal-lift practices are TBD canon and need a future workshop session. CC-079 is 20°–44° only.
2. **Do NOT modify the existing 0°–19° (deep Goal-leaning), 45°–54° (balanced), or 80°–90° (deep Soul-leaning) prose templates.** Those bands keep their CC-068 prose unchanged.
3. **Do NOT change the angle / length / Movement Strength math** in `lib/goalSoulMovement.ts`. CC-071 locked the polar geometry; CC-079 only adds prose-template logic.
4. **Do NOT change quadrant placement** in `lib/goalSoulGive.ts`. CC-077 locked that algorithm; the band detector reads angle/length/raw_soul from the existing computed values.
5. **Do NOT modify the dashboard surface** in `lib/goalSoulMovement.ts:dashboard` or `lib/goalSoulDashboard.ts`. The dashboard fields (Goal, Soul, Direction, Movement Strength, Quadrant, Gripping Pull) are unchanged. Only the narrative prose below the dashboard changes.
6. **Do NOT add Q-Purpose-Building or any new question** to `data/questions.ts`. CC-B remains deferred.
7. **Do NOT add new signals** to `lib/types.ts` SignalId / SIGNAL_DESCRIPTIONS / extractors.
8. **Do NOT modify OCEAN files** (`lib/ocean.ts`, `lib/oceanDashboard.ts`). The practice-selection logic *reads* OCEAN intensities (specifically `adjusted_extraversion`, `adjusted_conscientiousness`) but does not modify them.
9. **Do NOT modify `docs/goal-soul-give-spec.md` or `docs/ocean-disposition-spec.md`.** Spec drift is documented for a follow-on CODEX.
10. **Do NOT modify `MEMORY.md`, `AGENTS.md`, or any file under `docs/canon/`.**
11. **Do NOT install new dependencies.**
12. **Do NOT use therapy-coded register** in any of the five practices' prose. The five canonical phrasings are locked; do NOT paraphrase them into "your inner work" / "shadow integration" / "authentic self" / etc.
13. **Do NOT prescribe specific demographic-keyed practices.** The selection rule is signal-driven (low-E user → translate care visibly), NOT demographic-keyed (parent-stage → specific practice). Demographic gating is deferred per §13.7.
14. **Do NOT use "Striving" or "Goal-leaning" as labels in the affirmation sentence.** Those are dashboard descriptors. The prose register avoids them per §13.5b verbatim guardrail.
15. **Do NOT prescribe "more output."** The 20°–44° user is already producing; the work is the lift, not the volume.
16. **Do NOT lock more than two practices into a single render.** Maximum two practices per Movement narrative; rotate or select based on signal pattern.
17. **Do NOT moralize on a 20°–44° user.** The affirmation rule is the floor — they've earned the position; the prose says so before any prescription.

## Acceptance Criteria

### Band detection

1. `isProductiveNEMovementBand(angle, length, rawSoul)` exists in `lib/goalSoulMovement.ts` and returns true when `angle ∈ [20°, 44°]` AND `length ≥ 40` AND `rawSoul ≥ 20`. Returns false otherwise. Verified by audit.

### Prose composition (when band fires)

2. The Movement narrative for in-band fixtures contains an **affirmation sentence** as the first sentence. Substring match: "productive NE movement" OR "the lift toward giving has started" OR equivalent affirmation register.
3. The Movement narrative contains an **observation sentence** identifying Goal as the stronger axis. Substring match for: "form" or "building" or "structure" or "productive motion" appearing alongside "earned" or equivalent.
4. The Movement narrative contains 1–2 of the five canonical Soul-lift practices. Each practice prose lifted verbatim or close paraphrase from the §13.5b list.
5. The Movement narrative ends with a landing sentence. Substring match: "the next move" or "the lift" or "let one of these practices" or equivalent forward-pointing phrasing.
6. Total word count in-band: 80–160 words (richer than out-of-band 60–120).

### Practice selection (signal-driven)

7. For an in-band fixture with `adjusted_extraversion < 40` (low-E case), the prose contains *Translate care visibly* (substring or close paraphrase).
8. For an in-band fixture with `adjusted_conscientiousness ≥ 60` AND Q-T te ranked top-2 in at least one Q-T block (high-C + Te-dominant), the prose contains *Convert structure into mercy*.
9. For in-band fixtures where neither (7) nor (8) fires AND the Sacred-Words-vs-Sacred-Spending tension proxy doesn't fire, the prose contains both *Name the beloved* AND *Choose one recurring act of Giving* (the default pair).

### Forbidden registers (in-band)

10. The affirmation sentence does NOT contain "Striving" or "Goal-leaning" as labels.
11. The Movement narrative does NOT contain "build harder", "ship more", "produce more", or close variants.
12. The Movement narrative does NOT contain therapy-coded phrases ("your inner work", "shadow integration", "authentic self", etc.) — the existing CC-068 forbidden-list assertion still passes.
13. The bridge-phrase requirement from CC-068 still passes (at least one of: the work / the way / the bridge / the completion / next / begin / becoming / the willingness / moves toward / anchor / is to).

### Out-of-band fixtures unchanged

14. Fixtures where `angle ∉ [20°, 44°]` OR `length < 40` OR `raw_soul < 20` continue to render with the existing CC-068 prose templates. No band-specific affirmation, no Soul-lift practices.
15. The 0°–19°, 45°–54°, and 80°–90° band fixtures' prose word counts remain in 60–120 range.

### Build hygiene

16. `npx tsc --noEmit` exits 0.
17. `npm run lint` exits 0.
18. `npm run audit:goal-soul-give` exits 0 — all in-band assertions pass; out-of-band fixtures unchanged.
19. `npm run audit:ocean` exits 0 (regression — Movement reads from OCEAN's `adjusted_extraversion` / `adjusted_conscientiousness` for practice selection; OCEAN itself unchanged).
20. `git status --short` shows only Allowed-to-Modify files.
21. `data/questions.ts` unchanged (40 question_ids).
22. No new dependencies.

## Report Back

1. **Summary** — what was implemented in 5–8 sentences.
2. **Band detector** — the implementation of `isProductiveNEMovementBand` with the §13.5b verbatim gate. Confirm gate matches: `angle ∈ [20°, 44°]` AND `length ≥ 40` AND `raw_soul ≥ 20`.
3. **In-band fixture audit** — for each fixture whose angle falls in [20°, 44°], paste the rendered Movement narrative verbatim. Identify which practices were selected for each and which selection rule branch fired.
4. **Practice-selection sanity check** — confirm the four selection-rule branches each fire on at least one fixture (low-E case, high-C+Te case, Sacred-Words-vs-Sacred-Spending case, default-pair case).
5. **Out-of-band regression** — confirm fixtures outside the band render with their existing CC-068 prose unchanged.
6. **New fixtures** — if any added, document the specific signal patterns each tests and the expected practice selection.
7. **Audit pass/fail breakdown** — fixture-by-fixture, including all CC-067/068/070/071/077 assertions plus the new CC-079 ones.
8. **Canon ambiguities** — quote the spec, name the call.
9. **Files modified** — every path with line-count delta.
10. **Out-of-scope verification** — `git status --short`.
11. **Spec ↔ code drift report** — note that §13.5b sample affirmation/observation/landing sentences are illustrative; the implementation may have chosen close paraphrases. List any meaningful drift for a follow-on CODEX.
12. **Open questions** — anything that surfaced during implementation, especially about the 55°–79° symmetric band (which remains TBD canon).

---

## Method note

**The five practices are canonical, not suggestive.** Spec §13.5b lists them verbatim with their explanatory sentences. The implementation lifts those sentences directly into the prose templates; close paraphrase is allowed for selectivity but the substantive claim of each practice is locked.

**Selection is signal-driven, not editorial-discretionary.** A user's signal pattern determines which 1–2 practices appear. Don't randomize, don't rotate by user ID, don't pick by hash. The signal-driven mapping in §13.5b is the canon: low-E → translate care; high-C+Te → convert structure; Sacred-Words-vs-Spending → allocate resources; default → name the beloved + choose one recurring act.

**The affirmation rule is the most architecturally important sentence.** Skipping affirmation in the 20°–44° band defaults the prose to "you're at moderate Movement Strength, here's what to do" — which reads as cold prescription. The affirmation lets the user know they've earned the position before the prose offers a next move. §13.11 codified this as binding ("affirmation rule is the floor, not optional").

**Jason's session is the canonical real-cohort case for this band.** At angle 29° / length 64.9, his session falls cleanly in 20°–44°. The post-CC-079 render of his Movement narrative should: (a) affirm productive-NE-movement in the first sentence; (b) name Goal as the stronger axis without "more output" prescription; (c) include 1–2 practices selected by his signal pattern (likely Translate care visibly given low-E, possibly Convert structure into mercy given high-C); (d) close with the lift framing. Validating against his fixture is the empirical anchor.

**The 55°–79° symmetric band stays TBD.** Don't author Goal-lift practices speculatively. When that band's canon locks via a future workshop session, a CC-079b can mirror this CC's structure.
