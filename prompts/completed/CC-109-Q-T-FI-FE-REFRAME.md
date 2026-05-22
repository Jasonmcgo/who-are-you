# CC-109-Q-T-FI-FE-REFRAME

> Cowork-chat authored 2026-05-19. Question-text revision for the four
> Q-T judging questions (Q-T5, Q-T6, Q-T7, Q-T8). Sharpens the Fi/Fe
> options so they probe the canonical "Personal Feelings vs Caring"
> distinction — and specifically discriminate **NeFi hero-rescue
> (selective, inner-resonance-triggered)** from **Fe-dom ambient
> tending (broadcast, need-signal-triggered)**.
>
> **Why now:** Cohort calibration analysis (memory
> `project_cohort_10_fixture_calibration.md`) identified `scoreFe`'s
> broad rules as a structural Fe-bias driver — Michele (canon ENFP)
> and JDrew (canon Fi-Se-(Ti/Te)-Ni) both wholesale-mis-routed to
> ENFJ. Two of Jason's closest relationships, both confirmed wrong
> by direct canon knowledge. The next ~100 Vistage cohort users
> arrive this week. Empirical confirmation comes only AFTER they
> take the test; question-layer fix is cheaper than the
> architecture-layer alternative and tests the hypothesis
> simultaneously.
>
> **Hypothesis being tested:** the Fe-bias is reachable from the
> question layer because the current Q-T Fi options describe the
> *intellectualized* version of personal conviction, which doesn't
> match how NeFi users actually live the trait. With sharper Q-T
> text that probes selectivity vs ambient-tending, NeFi users will
> provide direct Fi evidence on Q-T6 and Q-T8 strong enough to
> outweigh `scoreFe`'s broad rules. If hypothesis holds, the
> architecture-layer CC (`CC-FE-BIAS-CORRECTION`) becomes
> unnecessary. If it doesn't, that CC ships next.

## Why this CC exists

Per `feedback_feel_vs_care_canon_nefi_hero.md`, the canonical Fi/Fe
distinction at the user-facing register is:

| Dimension | Fi (Personal Feelings) | Fe (Caring) |
|---|---|---|
| Judging mode | Internal felt-truth — "does this resonate with what I deeply hold?" | External tending — "what does the room/relationship need?" |
| Care pattern | **SELECTIVE** — activates around specific people/causes that pass the inner-resonance test | **AMBIENT** — broadcast attention, calibrated to whoever is present |
| Activation trigger | **Inner resonance** — "this matters TO ME" | **Need-signal** — "they're asking for X" |
| Care has... | **Shape** — filtered by personal truth, applied selectively | **Reach** — extended broadly, applied responsively |
| Identification / Tending | Their pain becomes my pain (Fi pulls in) | I read their state and provide care (Fe stays differentiated) |
| Archetype | **Healer** | **Caregiver** |

The NeFi-specific pattern — "antenna out / hero rescue" — is the bug
class. Ne scans, Fi evaluates by felt-truth, Fi mobilizes intensely
when a target lands. The observable behavior LOOKS like Fe (caring,
attentive, mobilized for others) but the *trigger is selective inner
conviction, not ambient room-tending.* Current Q-T Fi options don't
surface this selectivity; Fe options describe more concrete
relational behavior; high-Agreeableness NeFi users pick Fe.

## The four reworded questions

**Signal IDs are UNCHANGED.** This is a pure text revision plus a
backward-compatibility shim in `signalFromAnswer` (CC-094 precedent).
Existing fixtures derive identical signals from old answer strings;
new sessions derive identical signals from new answer strings.

### Q-T5 — "When a plan isn't working"

Voices A (`ti`) and B (`te`) **unchanged**. Voices C (`fi`) and D (`fe`) rewritten:

**Voice C (`fi`) — current:**
> *"Before we keep pushing, I want to know whether this plan is actually aligned with what we care about. Maybe the plan is fine but we're wrong about wanting it."*

**Voice C (`fi`) — reworded:**
> *"I want to know if this plan still has personal meaning for me. If something in me has gone quiet about it, no tactical change will fix that. The inner truth of whether I still believe in it is the first question — execution comes after."*

> *Example:* "Two months in, I notice I'm executing the plan but no longer feel it. Before any tactical pivot, I have to ask whether I still believe in what we're building — and if I don't, I'd rather stop than keep pushing what's gone quiet in me."

**Voice D (`fe`) — current:**
> *"The people carrying this work are paying for the plan's failure too. Before we fix the plan, I want to tend to what this is costing them."*

**Voice D (`fe`) — reworded:**
> *"I want to hear what the people carrying this need from me right now. If they're losing heart, I want to tend to what they're actually asking for in this moment — not what I think they should need. The plan's tactics come after the people in it are okay."*

> *Example:* "Before changing tactics, I sit down with the team and ask what they need from me — more time, less pressure, a different role, recognition. I respond to what they actually ask for; the plan gets adjusted around what the people can actually carry."

### Q-T6 — "When someone you respect disagrees with you"

Voices A (`te`) and D (`ti`) **unchanged**. Voices B (`fi`) and C (`fe`) rewritten:

**Voice B (`fi`) — current:**
> *"I have to stay true to what I actually think is right, even if they disagree. But the disagreement matters — I want to sit with it."*

**Voice B (`fi`) — reworded:**
> *"What I personally hold as true matters more to me than their agreement. I can sit with their disapproval; what I can't sit with is abandoning my own felt-truth to keep peace. Being out of step with myself costs more than being out of step with them."*

> *Example:* "When a mentor I respect tells me my decision is wrong, I hear them — and I still can't move from what I felt was right. The cost of pretending to agree with them would be higher than the cost of them thinking I'm wrong."

**Voice C (`fe`) — current:**
> *"I care about the relationship as much as being right. Whatever the answer is, I want us to land somewhere we can both stand."*

**Voice C (`fe`) — reworded:**
> *"Us landing on a position we can both stand on matters as much as which of us is right. I'd rather we arrive together than I be right alone. The connection between us is part of what's at stake here — not separate from the question of who's correct."*

> *Example:* "When we disagree, I want to keep working until we find a frame we can both speak from. If I 'win' the argument but lose how we stand together, I've lost the more important thing."

### Q-T7 — "When you have to make a hard call"

Voices C (`ti`) and D (`te`) **unchanged**. Voices A (`fi`) and B (`fe`) rewritten:

**Voice A (`fi`) — current:**
> *"I can't make this call well until I'm clear on what I actually believe matters here. Externally-optimal but internally-wrong is the worst place to land."*

**Voice A (`fi`) — reworded:**
> *"Until the decision lands as right inside me, no external argument can make it the right call. I have to know what feels true to me first. The wrong choice for me, even if it looks right to others, is the wrong choice."*

> *Example:* "Before I commit to the option that's most defensible on paper, I have to know whether it feels right when I sit with it quietly. If it doesn't, I won't make the call no matter how the optics look."

**Voice B (`fe`) — current:**
> *"Whatever I decide, someone bears the cost and someone gets protected. I want to know which person each option chooses for before I make the call."*

**Voice B (`fe`) — reworded:**
> *"Whoever this lands hardest on becomes my deciding question. I want to see whose lives bear the weight in each option, then pick the call that holds the most of us together. The right move protects the people least able to absorb being wronged."*

> *Example:* "Before the call gets made, I map who pays in each scenario — and I pick the option where the people who can't carry the cost don't have to. The relational consequences are the call, not a side-effect of it."

### Q-T8 — "When someone close to you is struggling" ★ (most important reframe)

Voices B (`ti`) and C (`te`) **unchanged**. Voices A (`fe`) and D (`fi`) rewritten:

**Voice A (`fe`) — current:**
> *"I'm paying attention to what they need from me in the moment: quiet, reassurance, company, honesty, or help carrying it."*

**Voice A (`fe`) — reworded:**
> *"I tune to what they're actually asking for from me — quiet, company, advice, a meal, distraction — and I provide it. My care responds to their need-signal, not to how I personally feel about their situation. I'd offer the same care to anyone close to me who was struggling."*

> *Example:* "I read what they're asking for — whether that's space, presence, problem-solving, or just sitting together — and I provide that specific thing. My response is calibrated to what they need, not filtered through how their situation makes me feel."

**Voice D (`fi`) — current:**
> *"I want to honor what this feels like from inside their life. I don't want to rush past the meaning of it just to make myself useful."*

**Voice D (`fi`) — reworded:**
> *"Something about THIS person's situation lands hard in me — their feelings become my feelings, and I drop my own things to be with it. The pull is selective; not every struggle moves me this way. When it does, my response comes from how it lands inside me, not from what they're asking for."*

> *Example:* "When THIS particular person's situation hits me right, I'm gone — I cancel my plans, I'm in it with them, I can't think about anything else. Two days from now, someone else might be struggling and it won't pull me the same way. The intensity is selective and it comes from how their situation lands in me."

## Backward-compatibility shim (CC-094 precedent)

In `lib/signalFromAnswer.ts` (or wherever Q-T answer-to-signal mapping
lives), add a legacy-string-to-new-string remapping for the 8 rewritten
options. Pre-CC-109 sessions stored old answer strings (e.g.,
*"Before we keep pushing, I want to know whether this plan is actually
aligned..."*) — those must continue to derive their canonical signal
(`fi` in this case). The remapping table should be a simple dict from
old quote → signal, applied before the new-string lookup.

Verify by re-running all 10 cohort-real fixtures through the engine:
**every fixture must derive byte-identical lens_stack output** after
the shim is in place. If any cohort fixture's Lens changes, the shim
has a hole. (Note: Michele and JDrew's pre-CC-109 fixtures will still
land wrong via the old `scoreFe` path — that's expected; the reword
fixes new sessions, not historical ones.)

## Cache regen scope

Editorial changes to Q-T text affect:
- The question rendered to the user (no LLM cost, just markup)
- The signal derivation (no change — same signal_ids)
- Engine downstream consumers (no change — they read signals, not question text)
- LLM prose-rewrite layers that quote or reference Q-T verbatim: check
  `proseRewriteLlm.ts` system prompt, `keystoneRewriteLlm.ts`,
  `synthesis3Llm.ts`, `launchPolishV3Llm.ts` for any embedded Q-T
  references. If none, no LLM regen needed. If any, regen affected
  fixtures only.

**Expected regen cost:** $0–$3. Default to $0; if LLM prompts reference
Q-T verbatim, escalate to $3 hard cap.

## Validation gates

1. **TypeScript clean** — `npx tsc --noEmit` passes.

2. **Engine-output preservation on all 10 cohort fixtures.** Run each
   fixture through `buildInnerConstitution` post-shim; the `lens_stack`
   output (dominant/auxiliary/tertiary/inferior/mbtiCode/confidence/
   crossSignalAgreement/crossSignalInferredDriver) must be **byte-
   identical** to pre-CC-109 output. **Especially Harry's Si-Fe ISFJ
   stack must hold** — his Fe is legitimate auxiliary, not promoted
   dom; if reword breaks Harry, the shim has a hole or the new Fe
   text is overcorrecting.

3. **Editorial review** — sample-read all 8 reworded options. Confirm:
   - Each Fi option contains explicit selectivity / inner-truth /
     personal-resonance language ("personal meaning," "felt-truth,"
     "lands inside me," "THIS situation")
   - Each Fe option contains explicit ambient / need-signal / external-
     tending language ("what they're asking for," "what they need,"
     "the connection," "tend to")
   - No Fi option reads as "intellectualized care" (the prior failure
     mode)
   - No Fe option reads as "self-sacrificing care" (which would skew
     toward Fi register)

4. **Audit suite** — full `npm test` green. 77/77 must hold.

5. **Cohort-real fixture re-extraction test:** re-extract Brad / Matti
   / Raquel via `scripts/extractCohortRealFixtures.ts` (their actual
   prod sessions are pre-CC-109). Confirm they still derive
   ENTJ / ENTJ / ESTP canonical at high confidence after shim.

## Acceptance signal (only validatable post-deploy)

The empirical test of this CC is **Michele and JDrew retaking the
assessment after deploy**. Both should land Fi-canonical:
- Michele: ENFP (Ne-Fi-Te-Si)
- JDrew: Fi-Se-(Ti/Te)-Ni (non-MBTI; closest MBTI is ISFP)

If either still lands as ENFJ on retake, the question-layer fix did
NOT resolve the bug, and `CC-FE-BIAS-CORRECTION` ships next.

## What this CC does NOT do

- **Does NOT change Q-T1-Q-T4 perceiving-axis options.** The Ni/Ne/Si/
  Se options are calibrated correctly per the post-CC-097A cohort
  data (Brad/Matti/Raquel all routed correctly). Out of scope.
- **Does NOT change Ti/Te options on Q-T5, Q-T6, Q-T7.** Only Fi/Fe
  options are rewritten. The Ti/Te options are calibrated correctly.
- **Does NOT change `scoreFe`'s rule weights or thresholds in
  `crossSignalDriverInference.ts`.** Engine math is untouched. The
  hypothesis is that better Q-T direct evidence will outweigh
  scoreFe's broad rules without retuning them.
- **Does NOT change the MBTI-label suppression behavior for non-
  canonical stacks** (per JDrew memo). That's a separate scope.
- **Does NOT regenerate LLM prose** unless prompt text references Q-T
  verbatim. Default no regen.
- **Does NOT add or remove any survey questions** (per canon
  `feedback_minimal_questions_maximum_output.md`).
- **Does NOT change any signal_id.** Pure text revision.

## Notes for the executor

- Executor time estimate: ~45 min – 1.5 hours. Per
  `feedback_cc_time_estimates_5x_too_high.md`, reject any estimate
  >2 hours as overshoot.
- The reworded text is provided above as a complete draft. Executor
  should preserve the editorial register (canonical example after
  the quote, second-person, present-tense). Editor judgment OK on
  minor word-level tightening; preserve all canonical phrases
  (e.g., "feelings become my feelings," "tend to what they're asking
  for") since those carry the discrimination.
- The Q-T questions live in `data/questions.ts`. Each ranking item
  has `id`, `label`, `voice`, `quote`, `example`, `signal` fields.
  Update `quote` and `example` fields; keep `id`, `label`, `voice`,
  `signal` unchanged.
- The signal-from-answer shim should match the pattern CC-094
  established for Q-P2. See git history for that precedent if needed.
- Per `feedback_sandbox_git_lockfile.md`: any commit command handed
  to Jason should prepend `rm -f .git/index.lock`.

## Save-to-memory after landing

Save a delta memory noting:
- Date landed
- Old Fi/Fe quote text snapshot (for archaeological reference if a
  future cohort calibration questions whether the reword caused a
  regression)
- Cohort fixture stack outputs post-shim (must be byte-identical)
- Pending: Michele + JDrew retake results when available
