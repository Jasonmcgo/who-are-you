# CC-097A — Q-T Item Wording Refinement (Layer 1)

## Objective

Per the four-class routing failure taxonomy (`feedback_se_fi_attractor_canon.md`) surfaced by the 2026-05-17 cohort calibration workshop with Jason: Q-T1–Q-T8 ranking items currently can't reliably separate **three extraverted functions** that all present as "outward-engaging" in answer-space:

- **Ne** (possibility-finding) vs **Fe** (room-reading) — Class B failure (Michele's Ne-Fi gets promoted to Fe-Ni)
- **Fe** (room-reading) vs **Se** (present-tense engagement) — Class C failure (Kevin's Fe-Si gets demoted to Se-Fi)
- **Si** (precedent-tested) vs **Ni-Fe authority-trust** — Class C contributor (Ashley's Ni-Fe-latent picks Si-coded items)

This CC ships **5 surgical reword refinements** to Q-T items. Each item keeps its existing `signal:` mapping unchanged (`signal: "se"` stays `signal: "se"`). The wording is sharpened to surface the *cognitive move* (am I jumping to possibilities / reading emotional state / engaging present-tense reality / following tested precedent?) rather than the *outward-engagement register* that conflates them.

Per Jason canon 2026-05-17 (`feedback_se_fi_attractor_canon.md`): *"I'd like to adjust wording of the jungian questions while keeping everything else the same."* This is backward-compatible Layer 1 question-content work, mirroring CC-094's Q-P2 relabel pattern.

## Sequencing

- Parallel-safe with CC-097-CONFIDENCE-FIX (different files: this CC touches `data/questions.ts`; CONFIDENCE-FIX touches `lib/jungianStack.ts`).
- Independent of CC-097B / CC-097C / CC-097D (Layer 2 architectural work).
- Should fire AFTER Wave CC-088–CC-094 has landed (per commit 704d714 on 2026-05-17 — confirmed landed).

## Launch Directive

Run with `claude --dangerously-skip-permissions`.

## Execution Directive

Single pass with five concrete reword subtasks (Q-T2 Se, Q-T3 Si, Q-T4 Se, Q-T5 Fe, Q-T7 Fe). Each is text-only in `data/questions.ts`. Signal mappings (`signal: "se"`, `signal: "si"`, `signal: "fe"`) remain unchanged. Quote text + example text + label/voice fields ALL change to match the new register; only the `signal:` field is preserved.

## Bash Commands Authorized

- `grep`, `ls`, `cat`, `find`, `wc`
- `npx tsc --noEmit`
- `npm run lint`
- `npx tsx tests/audit/<name>.audit.ts`

Do not run `npm install`, `git commit`, `git push`, `drizzle-kit push`, or any LLM build script.

## Read First (Required)

1. `data/questions.ts` — find Q-T1 through Q-T8 definitions (lines ~266–360). Confirm the current item structure and signal mappings.
2. `feedback_se_fi_attractor_canon.md` — four-class routing failure taxonomy with cross-signal anchors. This canon names exactly which Q-T items conflate which functions.
3. `feedback_jungian_over_mbti_canon.md` — engine detects any 4-function ordering; non-MBTI stacks (Harry's Si-Fe-Ne-Te) are valid shapes; the Q-T items must support driver detection for the 8 functions, not just the 16 canonical MBTI pairs.
4. `feedback_qp2_gradient_asymmetry.md` — CC-094 precedent for backward-compatible Q-### relabel.
5. `feedback_minimal_questions_maximum_output.md` — derive from existing signals before adding new ones; this CC sharpens existing items, doesn't add new ones.

## Scope

### Item 1 — Q-T2 Se reword (Class C — Fe→Se attractor)

**Current (line ~285):**

```
{ id: "se", label: "Voice C", voice: "Voice C",
  quote: `"I'm taking in what's actually present — the room, the people, the energy.
          I'll respond to what I find."`,
  example: "I scan the room, register what's actually in front of me, and let
            what I find guide how I move through the day.",
  signal: "se" }
```

**Problem:** "the room, the people, the energy" describes what Fe-presenters do (reading the emotional weather of the room) — not what Se does (engaging the physical/concrete present). Fe-driver users (Kevin) pick this item because it sounds like their move, getting demoted to Se-Fi routing instead of Fe-Si/Fe-Ni.

**Revised:**

```
{ id: "se", label: "Voice C", voice: "Voice C",
  quote: `"I'm taking in what's physically present — the layout, the lighting,
          the sounds, the way the space is arranged. I'll respond to what's
          actually in the room."`,
  example: "I notice the physical setup — where things are, what's in motion,
            what the space looks and sounds like — and that's where I orient
            my response.",
  signal: "se" }
```

**Rationale:** Pure-physical anchors. "Layout, lighting, sounds, arrangement" cannot be mistaken for emotional-state reading. Trades some warmth (Cindy's genuine Se-driver warmth is reduced) for Fe-distinguishability. Per Jason 2026-05-17, this tradeoff is acceptable: the engine still has CC-097B cross-signal layer to detect Cindy's Fe-warmth from her Compass/OCEAN/Trust signature even if Q-T2 Se reads cooler.

### Item 2 — Q-T3 Si reword (Class C — Ni-Fe authority-trust attractor)

**Current (line ~295):**

```
{ id: "si", label: "Voice A", voice: "Voice A",
  quote: `"I want to learn it the way experts have taught it. The proven
          sequence usually exists for a reason."`,
  example: "I follow the standard course in the order it's laid out — the
            established sequence usually exists for a reason.",
  signal: "si" }
```

**Problem:** "The way experts have taught it" attracts Ni-Fe authority-respecters (Ashley's INFJ-latent, anyone with high education-trust) who aren't actually Si-dominant. The signal "respect for institutional authority" is a Trust/Fe signal, not a Si signal. Si is about *personal repetition of what works* — first-person tested-sequence, not deferential expert-following.

**Revised:**

```
{ id: "si", label: "Voice A", voice: "Voice A",
  quote: `"I want to follow the sequence that's been proven to work — the path
          I or others have walked before. Repetition of what works builds the
          skill."`,
  example: "I work through it step by step the way it's been done before; the
            repetition of a tested sequence is how the skill becomes mine.",
  signal: "si" }
```

**Rationale:** Anchors Si to first-person/lineage-tested repetition. Removes the "expert authority" framing that attracts Ni-Fe types.

### Item 3 — Q-T4 Se reword (Class C — Fe/Te/Ti also pick Se)

**Current (line ~307):**

```
{ id: "se", label: "Voice A", voice: "Voice A",
  quote: `"I'm watching what's actually happening, not what people say is
          happening. Behavior in the moment is more honest than explanations."`,
  example: "I watch what people are actually doing in the room, not what they
            say they're doing — the behavior is the real read.",
  signal: "se" }
```

**Problem:** "Not what people say is happening" reads as *skepticism-of-stated-words* — a move Fe-driver, Te-driver, AND Ti-driver users also make. Plus "behavior" is broader than Se.

**Revised:**

```
{ id: "se", label: "Voice A", voice: "Voice A",
  quote: `"I focus on the concrete, observable signals — what people are
          physically doing, facial expression, posture, what's in motion in
          the space. The body language tells me what the explanations don't."`,
  example: "I read what's physically happening — facial expression, posture,
            who's moving toward what — and let the observable signals tell me
            what the explanations miss.",
  signal: "se" }
```

**Rationale:** Anchors Se to physical/embodied observation (facial expression, posture, motion). "Skepticism" is no longer the load-bearing register; observation-of-physical is.

### Item 4 — Q-T5 Fe reword (Class B contributor + Fe-protector register)

**Current (line ~322):**

```
{ id: "fe", label: "Voice D", voice: "Voice D",
  quote: `"People are getting frustrated. Before we can fix the plan, we
          need to address what the friction is doing to the team."`,
  example: "I can see people getting frustrated; we need to deal with how
            the team is feeling before we can productively talk about the
            plan.",
  signal: "fe" }
```

**Problem:** "Team friction" reads as Fe-managerial register — but Fe-driver protectors (Kevin) experience Fe as *protective care for individuals*, not team-management. The current item over-narrows Fe to a workplace-management flavor.

**Revised:**

```
{ id: "fe", label: "Voice D", voice: "Voice D",
  quote: `"The people carrying this work are paying for the plan's failure
          too. Before we fix the plan, I want to tend to what this is
          costing them."`,
  example: "I see what this is costing the people I'm working with; I want
            to tend to them before we figure out the next move on the plan.",
  signal: "fe" }
```

**Rationale:** Reframes Fe as protective-care of-people-carrying-cost. Captures both the Fe-driver protector register (Kevin) AND the Fe-aux relational-tender register (Michele's correctly-routed-ENFJ-Lens-prose). Preserves Fe signal.

### Item 5 — Q-T7 Fe reword (Fe-protector register additive)

**Current (line ~344):**

```
{ id: "fe", label: "Voice B", voice: "Voice B",
  quote: `"Whatever I decide affects other people. I want to understand who
          carries what cost before I choose."`,
  example: "Before I lock this in, I want to know who carries the weight of
            each option — the cost lands on someone, and I want to see them.",
  signal: "fe" }
```

**Problem:** Good Fe-managerial register, but missing the Fe-protector register flavor that Kevin and Michele actually express. Currently captures "cost accounting" but not "who am I protecting."

**Revised:**

```
{ id: "fe", label: "Voice B", voice: "Voice B",
  quote: `"Whatever I decide, someone bears the cost and someone gets
          protected. I want to know which person each option chooses for
          before I make the call."`,
  example: "Each option protects somebody and asks somebody else to bear the
            cost; I want to see who's on each side of that before I commit.",
  signal: "fe" }
```

**Rationale:** Adds "who gets protected" register alongside "who carries cost." Captures Fe-driver protector AND Fe-aux relational-care register.

### Item 6 — Q-T1, Q-T6, Q-T8 — NO CHANGES

These three items are well-differentiated in their current wording. Q-T1's Se item ("Let me start moving and see what surfaces") could read as Fe-responsive in edge cases, but the surrounding Ni/Ne/Si items frame it physically enough that it's clean. Q-T6 and Q-T8 differentiate Fe from Fi/Ti/Te cleanly. Do not change these.

### Item 7 — Audit

New `tests/audit/qtItemWordingRefinement.audit.ts` with assertions:

1. Q-T2 Se item text contains "physically present" and does NOT contain "the people, the energy"
2. Q-T3 Si item text contains "sequence" + "walked before" and does NOT contain "experts have taught"
3. Q-T4 Se item text contains "physically doing" + "posture" and does NOT contain "not what people say"
4. Q-T5 Fe item text contains "the people carrying this work" and does NOT contain "team"
5. Q-T7 Fe item text contains "gets protected" and does NOT contain only "who carries what cost"
6. All Q-T items still have their original `signal:` mappings unchanged (signal: "se" stays signal: "se", etc.)
7. Existing cohort fixtures still parse without error (backward compat: stored answer strings might reference old quote text, but `signal:` mapping is preserved)
8. Synthetic Daniel-shape fixture (Si-Te) still routes to Si-driver Lens read
9. Synthetic Cindy-shape fixture (Se-Fi) still routes to Se-driver Lens read

### Item 8 — Cohort fixture sweep

Check `tests/fixtures/cohort/` for fixtures with Q-T answers. Stored answers in fixtures are likely indexed by signal (`"se"`, `"si"`, etc.) rather than by quote-string. If by signal: no fixture changes needed. If by quote-string: fixtures need quote-string updates to match the new wording, but the underlying signal data stays the same.

Document either way:
- If fixtures key on signal: no changes required.
- If fixtures key on quote-string: update fixture quote-strings to new wording; signal-derivation unchanged.

### Item 9 — Regression sweep

After Items 1-8:
- Wave 1 audits pass
- CC-084 / CC-085 / CC-086 / CC-087 / CC-088 / CC-089 / CC-090 / CC-091 / CC-092 / CC-093 / CC-094 audits all pass
- New `audit:qt-item-wording-refinement` passes 9/9
- twoTier baseline: no expected change (Q-T signal mappings preserved means signal derivation unchanged means cohort fixtures produce identical engine output)

## Do NOT

- **Do NOT change any item's `signal:` mapping.** Signal preservation is the load-bearing backward-compat guarantee.
- **Do NOT add or remove any Q-T items.** Five wording refinements only.
- **Do NOT change Q-T1, Q-T6, Q-T8.** Those are clean per the canon.
- **Do NOT add a Fe option to Q-T1-Q-T4.** Architectural split (perceiving in T1-T4, judging in T5-T8) is intentional. Fe-driver detection improves via CC-097B cross-signal layer + Q-T5/Q-T7 reword in this CC, not by adding Fe to perceiving items.
- **Do NOT touch any engine math.** No `lib/identityEngine.ts` changes. No `lib/jungianStack.ts` changes. (CC-097-CONFIDENCE-FIX owns jungianStack.ts.)
- **Do NOT modify cohort fixtures unless quote-string indexing requires it.** Prefer signal-indexed.
- **Do NOT touch any Wave 1 persistence file.**
- **Do NOT regenerate any cache file** under `lib/cache/`.
- **Do NOT regenerate `tests/audit/twoTierBaseline.snapshot.json`** unless cohort fixture quote-strings genuinely changed (they shouldn't).
- **Do NOT call any LLM.** No `*LlmServer.ts` imports. No SDK.
- **Do NOT commit or push.**

## Allowed to Modify

- `data/questions.ts` — Q-T2, Q-T3, Q-T4, Q-T5, Q-T7 item wording (quote + example fields only; signal field preserved)
- `tests/audit/qtItemWordingRefinement.audit.ts` (new)
- `package.json` (add `audit:qt-item-wording-refinement` script)
- `tests/fixtures/cohort/*.json` — ONLY if quote-string-indexed (unlikely)
- Move prompt to `prompts/completed/` at end

## Out of Scope

- Engine math (`lib/identityEngine.ts`)
- Confidence calc (`lib/jungianStack.ts` — CC-097-CONFIDENCE-FIX owns)
- Cross-signal layer (CC-097B)
- Mirror-axis schema (CC-097C)
- Function-by-function Lens prose composer (CC-097D)
- New Q-T items
- Fe options in Q-T1-Q-T4
- Any other question (Q-P1, Q-O1, Q-X3, etc.)
- Schema changes
- DB migration

## Acceptance Criteria

1. `npx tsc --noEmit` passes
2. `npm run lint` passes (no new warnings introduced)
3. `npx tsx tests/audit/qtItemWordingRefinement.audit.ts` passes 9/9
4. Wave 1 audits still pass
5. CC-084 / CC-085 / CC-086 / CC-087 / CC-088 / CC-089 / CC-090 / CC-091 / CC-092 / CC-093 / CC-094 audits still pass
6. Q-T2 Se item rewritten per Item 1 (pure-physical phrasing)
7. Q-T3 Si item rewritten per Item 2 (sequence + lineage, not experts)
8. Q-T4 Se item rewritten per Item 3 (concrete-observable signals)
9. Q-T5 Fe item rewritten per Item 4 (protector reframe)
10. Q-T7 Fe item rewritten per Item 5 (who-protected register additive)
11. Q-T1, Q-T6, Q-T8 — UNCHANGED
12. All Q-T signal mappings preserved
13. Cohort fixtures still parse and route correctly
14. Zero engine math changes
15. Zero confidence calc changes (`lib/jungianStack.ts` untouched)
16. Zero Wave 1 persistence file changes
17. Zero LLM calls
18. Zero cache file modifications
19. Zero commits

## Report Back

- Exact revised text for each of the 5 reworded items (quote + example)
- Confirmation Q-T1, Q-T6, Q-T8 unchanged
- Confirmation all `signal:` mappings preserved
- Cohort fixture impact: fixture format (signal-indexed or quote-string-indexed); changes made if any
- Audit results (9/9 + regression sweep)
- Any deviation from Allowed-to-Modify list

## Notes for executor

- Estimated time: 30-60 min
- Cost: $0 (no LLM)
- This is Layer 1 question-content work, mirror of CC-094 pattern. Lowest-risk change in the CC-097 series.
- The reword text in each Item is **suggested phrasing** — the executor may adjust word choice if a better register lands, AS LONG AS:
  - Q-T2 Se removes "people, energy" entirely (pure-physical)
  - Q-T3 Si removes "experts have taught" framing (replace with sequence/lineage)
  - Q-T4 Se anchors to physical/embodied observation
  - Q-T5 Fe shifts from team-managerial to protective-care
  - Q-T7 Fe adds "who gets protected" alongside "who carries cost"
- If unsure on phrasing, apply canon-faithful interpretation per `AGENTS.md` and flag in report. The semantic shape per item is documented; exact word choice has flexibility.
- Cohort revalidation post-landing: rerender Daniel, Cindy, Harry, Kevin, Michele, Ashley fixtures and confirm driver+aux detection is still correct (or improved). Class A confidence bug is owned by CC-097-CONFIDENCE-FIX, not this CC — expect ⚠ badge still on sensing-driver shapes until CONFIDENCE-FIX lands.
