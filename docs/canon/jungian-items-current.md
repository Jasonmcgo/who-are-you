# Jungian (Cognitive-Function) Items — Current Snapshot

**Internal reference. Snapshot as of 2026-05-23 (post-CC-138).** Function tags
shown for engine/review work — these are NOT reader-facing.

## CC-138 — Binary-format reformat (the active path for new sessions)

New sessions answer **six binary-pick questions** under `card_id:
"temperament"`, replacing the legacy 4-way ranking (which remains in the
bank for backward-compat — see "Legacy ranking" section below):

- **Q-TB-NI-NE** (`type: "binary_pick"`) — intuitive attitude: Ni vs Ne
- **Q-TB-SI-SE** (`type: "binary_pick"`) — sensing attitude: Si vs Se
- **Q-TB-TI-TE** (`type: "binary_pick"`) — thinking attitude: Ti vs Te
- **Q-TB-FI-FE** (`type: "binary_pick"`) — feeling attitude: Fi vs Fe
- **Q-TB-PERC-ORDER** (`type: "binary_pick_derived"`, derived_from:
  `[Q-TB-NI-NE, Q-TB-SI-SE]`) — perceiving dominance: of the user's two
  perceiving picks, which leads?
- **Q-TB-JUDG-ORDER** (`type: "binary_pick_derived"`, derived_from:
  `[Q-TB-TI-TE, Q-TB-FI-FE]`) — judging dominance: which leads?

Each `binary_pick` answers as a `SinglePickAnswer` (existing type — reused).
The derived ordering questions populate their items at render time from
the user's earlier picks (parallel to `ranking_derived` / `multiselect_
derived`). The engine extracts each pick as a rank-1 function signal
via the existing `signalFromSinglePick` path; no new extractor.

**Why binaries:** every canonical Jungian stack holds exactly one T and
one F (opposite attitudes — `{Ti,Fe}` or `{Te,Fi}`) and exactly one N
and one S (opposite attitudes — `{Ni,Se}` or `{Ne,Si}`). Same-dimension
selection asks an *answerable* question; the cross-dimension valence
confound (warm-Ti pulls Fi, warm-N pulls S) that drove CC-134/135 cannot
fire structurally. The opposite-attitude constraint becomes a built-in
consistency check: a same-attitude pair (Ni+Si, Ti+Fi) is impossible in
a canonical stack and flags contamination → `confidence = "low"` +
CC-134 §D head-to-head clarifier.

**Dominance + I/E resolution:** the two page-winners (one perceiving,
one judging — guaranteed opposite attitude by the binaries) form the
dominant/auxiliary pair. I/E is inferred from the existing
`extraversion_proxy` / `extraversion_priority` / `outward_energy_priority`
signal — no new prompt. If inference is ambiguous, the resolver
defaults to introverted dominance (historically safer); a future
explicit "order the two" fallback is flagged but not implemented in
CC-138.

**Resolver:** `lib/jungianStack.ts:aggregateLensStackBinary`. The
top-level `aggregateLensStack` dispatches: presence of any `Q-TB-*`
signal in the session routes to `aggregateLensStackBinary`; absence
falls through to the CC-134 top-pick path (legacy compatibility).

**Voice text:** the binary items reuse the CC-122 warm-balanced Ni/Ne
voices and the CC-135 warm-balanced Se/Si voices verbatim. The judging
binaries (Q-TB-TI-TE, Q-TB-FI-FE) reuse the canonical Ti/Te/Fi/Fe
voices from Q-T5/Q-T7 (the most discriminating instances). All voices
labeled "Voice A / Voice B" — no attitude-label leakage.

## Legacy ranking format (kept for backward-compat)

Source: `data/questions.ts`, `card_id: "temperament"`, `type: "ranking"`.
Each item is a **forced ranking** of four Voices. Scoring uses the Voice's
`signal` (function) + the rank the respondent assigns; the quote/example prose
is display-only (`signalsFromRankingAnswer`, identityEngine.ts:502).

- **Q-T1–T4** = perceiving axis (Ni / Ne / Si / Se). Ne/Ni voices **revised by
  CC-122** (register-neutral re-voicing to fix NF intuition under-detection);
  Si/Se voices **revised by CC-135** (warm-balanced rewrite for N/S valence
  parity).
- **Q-T5–T8** = judging axis (Ti / Te / Fi / Fe). Unchanged.

**Status:** the legacy questions remain in the bank so existing cohort
fixtures (the 25 fixtures captured pre-CC-138) continue to derive
byte-identically via the CC-134 top-pick convergence path. New sessions
no longer answer Q-T1-Q-T8 (the assessment surface filters them out via
the binary-path conditional); the engine path persists.

---

## Q-T1 — "When you're working on a hard problem"

- **Ni** *(CC-122)* — "I keep looking for the hidden shape underneath the details. Once I see the pattern, the scattered pieces start to arrange themselves."
  - *ex:* "I sit with it until the underlying shape clicks; after that the specifics mostly sort themselves out."
- **Ne** *(CC-122)* — "I start seeing several ways this could open up — one idea leads to another, and the useful path usually appears after I've followed a few live threads."
  - *ex:* "Partway in, I've got three or four threads I want to pull, and chasing them is usually how the workable path shows up."
- **Si** — "What's worked in similar situations before? There's usually precedent worth checking before reinventing."
  - *ex:* "Before I start, I look up what we did the last time something like this came up and use that as the baseline."
- **Se** — "Let me start moving and see what surfaces. I'll know what I'm dealing with once I'm actually working on it."
  - *ex:* "I'd rather pick it up and start working than spend another hour planning what working on it will look like."

## Q-T2 — "When you walk into a new environment"

- **Ne** *(CC-122)* — "I start sensing what this place could become and where it might lead — I want to follow the openings before I settle into any read."
  - *ex:* "I find myself imagining what could happen here and which directions are worth following, well before I've pinned anything down."
- **Si** — "I'm comparing this to similar environments I've been in. The differences are telling me what I need to pay attention to."
  - *ex:* "I keep noting the small ways this place is different from the last one I worked in — the differences tell me what to pay attention to."
- **Se** — "I'm taking in what's physically present — the layout, the lighting, the sounds, the way the space is arranged. I'll respond to what's actually in the room."
  - *ex:* "I notice the physical setup — where things are, what's in motion, what the space looks and sounds like — and that's where I orient my response."
- **Ni** *(CC-122)* — "I sense where this place is actually headed before much has been said — the direction starts to feel clear even without all the evidence."
  - *ex:* "A short while in, I have a quiet read on where this is really going, beneath what people are telling me."

## Q-T3 — "When you're learning something new"

- **Si** — "I want to follow the sequence that's been proven to work — the path I or others have walked before. Repetition of what works builds the skill."
  - *ex:* "I work through it step by step the way it's been done before; the repetition of a tested sequence is how the skill becomes mine."
- **Se** — "I learn by doing it. Pick it up, try it, adjust based on what's actually happening in my hands."
  - *ex:* "I pick the thing up and try it, then adjust based on what's actually happening as I work."
- **Ni** *(CC-122)* — "I need the underlying meaning or organizing principle first. Once I understand what the thing is really about, the details fall into place."
  - *ex:* "Until I grasp what it's fundamentally for, the steps won't stick; once I do, they settle into place on their own."
- **Ne** *(CC-122)* — "I learn by finding different entrances into the thing — a conversation, an example, a story, or a tangent can suddenly make the whole subject come alive."
  - *ex:* "A chat, a story, a side-tangent — somewhere across those different ways in, it suddenly clicks into a whole."

## Q-T4 — "When you're trying to read a complex situation"

- **Se** — "I focus on the concrete, observable signals — what people are physically doing, facial expression, posture, what's in motion in the space. The body language tells me what the explanations don't."
  - *ex:* "I read what's physically happening — facial expression, posture, who's moving toward what — and let the observable signals tell me what the explanations miss."
- **Ni** *(CC-122)* — "I sense the deeper direction beneath the surface facts; where this is actually headed often becomes clear before I can fully explain why."
  - *ex:* "The underlying direction starts to feel clear to me before the evidence has fully caught up."
- **Ne** *(CC-122)* — "Several different things could be going on here — I follow where each one might lead before I settle on a read."
  - *ex:* "I hold a few live possibilities open and watch where each could go before I commit to one."
- **Si** — "I've seen this kind of situation before. The pattern-match to past examples tells me a lot about what's likely happening."
  - *ex:* "I notice this looks a lot like something I went through three years ago, and that comparison tells me most of what I need."

---

## Q-T5 — "When a plan isn't working"

- **Ti** — "There's a flaw in the underlying logic of the plan. I want to find it before we change what we're doing."
  - *ex:* "Before we change anything, I want to find the assumption in the original plan that turned out not to hold."
- **Te** — "Let's change what we're doing now to hit the target. We can diagnose the failure afterward."
  - *ex:* "Let's switch tactics now and still hit the deadline; we can figure out why the first plan failed once we're past it."
- **Fi** — "I want to know if this plan still has personal meaning for me. If something in me has gone quiet about it, no tactical change will fix that. The inner truth of whether I still believe in it is the first question — execution comes after."
  - *ex:* "Two months in, I notice I'm executing the plan but no longer feel it. Before any tactical pivot, I have to ask whether I still believe in what we're building — and if I don't, I'd rather stop than keep pushing what's gone quiet in me."
- **Fe** — "I want to hear what the people carrying this need from me right now. If they're losing heart, I want to tend to what they're actually asking for in this moment — not what I think they should need. The plan's tactics come after the people in it are okay."
  - *ex:* "Before changing tactics, I sit down with the team and ask what they need from me — more time, less pressure, a different role, recognition. I respond to what they actually ask for; the plan gets adjusted around what the people can actually carry."

## Q-T6 — "When someone you respect disagrees with you"

- **Te** — "If they're right, we should change course quickly. What's the fastest way to test who's seeing it more clearly?"
  - *ex:* "If they might be right, the fastest move is a small test that settles it — and then we go with whoever was closer."
- **Fi** — "What I personally hold as true matters more to me than their agreement. I can sit with their disapproval; what I can't sit with is abandoning my own felt-truth to keep peace. Being out of step with myself costs more than being out of step with them."
  - *ex:* "When a mentor I respect tells me my decision is wrong, I hear them — and I still can't move from what I felt was right. The cost of pretending to agree with them would be higher than the cost of them thinking I'm wrong."
- **Fe** — "Us landing on a position we can both stand on matters as much as which of us is right. I'd rather we arrive together than I be right alone. The connection between us is part of what's at stake here — not separate from the question of who's correct."
  - *ex:* "When we disagree, I want to keep working until we find a frame we can both speak from. If I 'win' the argument but lose how we stand together, I've lost the more important thing."
- **Ti** — "Before I adjust, I want to understand exactly where their reasoning differs from mine. The disagreement is informative — I just need to pin down what it turns on."
  - *ex:* "I want to keep going until I find the exact step where their reasoning diverged from mine — that's where the real disagreement lives."

## Q-T7 — "When you have to make a hard call"

- **Fi** — "Until the decision lands as right inside me, no external argument can make it the right call. I have to know what feels true to me first. The wrong choice for me, even if it looks right to others, is the wrong choice."
  - *ex:* "Before I commit to the option that's most defensible on paper, I have to know whether it feels right when I sit with it quietly. If it doesn't, I won't make the call no matter how the optics look."
- **Fe** — "Whoever this lands hardest on becomes my deciding question. I want to see whose lives bear the weight in each option, then pick the call that holds the most of us together. The right move protects the people least able to absorb being wronged."
  - *ex:* "Before the call gets made, I map who pays in each scenario — and I pick the option where the people who can't carry the cost don't have to. The relational consequences are the call, not a side-effect of it."
- **Ti** — "I want to get the decision framework right first. The right framework makes the call itself straightforward."
  - *ex:* "If I can name the criteria the right way, the actual choice usually becomes obvious — most of the work is in setting up the question."
- **Te** — "The data's in. Let's pick the option that best hits the goal and move. We can course-correct once we see how it plays out."
  - *ex:* "The data is good enough. I'll pick the option that best hits the goal, ship it, and adjust once we see what happens."

## Q-T8 — "When someone close to you is struggling"

- **Fe** — "I tune to what they're actually asking for from me — quiet, company, advice, a meal, distraction — and I provide it. My care responds to their need-signal, not to how I personally feel about their situation. I'd offer the same care to anyone close to me who was struggling."
  - *ex:* "I read what they're asking for — whether that's space, presence, problem-solving, or just sitting together — and I provide that specific thing. My response is calibrated to what they need, not filtered through how their situation makes me feel."
- **Ti** — "I want to understand what's really going on before I respond. If I misread the problem, even sincere help can make it worse."
  - *ex:* "I ask a few quiet questions first — well-meant help aimed at the wrong problem can make things worse."
- **Te** — "I want to find the next useful action. What needs to be handled, fixed, arranged, or removed so they can breathe?"
  - *ex:* "I scan for the one thing I can handle for them right now — a meal, a logistics call, a thing taken off their plate."
- **Fi** — "Something about THIS person's situation lands hard in me — their feelings become my feelings, and I drop my own things to be with it. The pull is selective; not every struggle moves me this way. When it does, my response comes from how it lands inside me, not from what they're asking for."
  - *ex:* "When THIS particular person's situation hits me right, I'm gone — I cancel my plans, I'm in it with them, I can't think about anything else. Two days from now, someone else might be struggling and it won't pull me the same way. The intensity is selective and it comes from how their situation lands in me."
