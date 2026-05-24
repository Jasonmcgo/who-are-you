# Obvious-or-Oblivious — game design spec (workshop draft)

Source: owner workshop input 2026-05-24 (prior Clarence/relationship-notes session). Captured here as the build reference. Supersedes the asymmetric engine-as-truth MVP (CC-COUPLE-1/2/3), which proved the loop but is too thin (3 of 8 items scorable, single-pick, deflating 0% reveals).

## Core concept

Prompt to the guessing partner: *"Your partner already knows this about you. You may or may not."* Each question offers **3 ranked selections** (matches owner direction: ranking, top-3, not single-pick).

## Scoring (light tone, nuanced underneath)

| Result | Points |
|---|---|
| Correct answer ranked #1 | 5 |
| Correct answer in top 3 but not #1 | 3 |
| Strong adjacent answer in top 3 | 1 |
| Partner-confirmed override | +1 bonus |
| "Confidently wrong" | comic badge only (no penalty) |

Never punishes a wrong read — teaches where the read was close vs off.

## Question-design rule (the crux)

Each question carries:
1. **One engine-derived answer** — from Lens, Grip Pattern, Love Shape, Aim, protected value, blame lens, work/love map.
2. **One individually-verified answer** — from the SUBJECT's own answers / self-confirmed notes / cohort data. (This is the dual-truth: engine + self, ~equal weight.)
3. **Several plausible distractors** — nearby patterns, so a half-right answer still teaches.

Bad quiz: "What's your partner's type?" Good quiz: "Which version of love do they accidentally turn into pressure?"

Honesty canon (carried from the report): the engine does not pretend to know biography — it detects a tension, forms a hypothesis, and asks a question biography can confirm.

## Six decks

| Deck | Purpose |
|---|---|
| Obvious to Me | What your partner thinks is obvious but you may miss |
| Oblivious to Me | What you don't realize others experience from you |
| Love Under Aim | Best version of your love |
| Love Under Grip | Fear-driven distortion of your love |
| Fight Weather | What happens in tension |
| Secretly Needed | What your partner needs but may not request |

## Reveal format

- **Engine read:** "The model predicted: reassurance without usefulness."
- **Partner read:** "Your partner selected: rest, appreciation, being chosen."
- **Translation:** "You weren't wrong — you saw the outer behavior; your partner named the inner need."

## Starter question bank (50)

**A. Grip Pattern (gift-under-fear — most useful):** what they call "helping" under pressure; what love becomes when fear gets loud (Control/Rescuing/Approval/Defiance/Proving/Withholding/Over-sacrifice/Suspicion); hidden pressure script ("If I can explain it, I can survive it," etc.); what they do when relationally unsafe; which "not love" pattern they mistake for love; what "I'm fine" means; what worsens Grip; what helps return to Aim; compliment secretly needed; criticism that stings most.

**B. Lens (playful, how they see reality):** what they notice in a messy room; what they protect in an argument (Accuracy/Peace/Freedom/Loyalty/Plan/Relationship/Principle/Future); their mind's default question; what they see before others; what they underweight; their "genius"; when hardest to reach; one-hour problem-solve first move; what "obvious" they assume others see; what they think is common sense but isn't.

**C. Love Shape (heart of the module):** how they show love (Fixing/Listening/Providing/Encouraging/Protecting/Planning/Playing/Staying); what love must feel like; what they wish you noticed; which love would restore them; what they fear love becomes; their best love; their worst love; phrase that lands best; what they confuse with being loved; what they're more hungry for than they admit.

**D. Couple Loop (correct answer is relational):** the loop you fall into; the hidden trade in tension; what one sees the other's oblivious to; what they give you that you under-credit; what they accidentally ask you to carry; the "we're fine" lie; the small correction with most movement; what they need before content in conflict; the Aim exchange that describes you; the relationship's hidden drag.

**E. Party (light, first-engagement):** toxic superpower; villain origin story; least believable sentence; honest love language; how they ruin a relaxing evening; what they secretly think love needs more of; what their "I love you" sounds like; stress costume; most dangerous phrase; what they'd hate being accused of.

**Cohort-informed examples** (engine-tied, validated): Michele (catalytic care/Belonging Grip → over-help so belonging stays secure), Brad (structure/Security Grip → others experience structure before care), Raquel (freedom+safety), Kevin (endurance → "you're allowed to receive care"), Connor (the solver/indispensable), Ashley ("I'm not leaving you, I'm leaving the escalation").

## Build implications (added in workshop)

- **The "individually-verified" answer requires the subject's own input** — a symmetric self-pass (A answers these about themselves) or cohort data. For non-cohort couples, A must self-answer. This is the load-bearing architectural piece beyond the MVP.
- **Each engine-derived answer needs a predictor** mapping the subject's engine output → the correct option. Strongest/most reliable: Grip, Lens, Love, Aim decks. Fuzzier: party deck, "hidden pressure script."
- **Adjacency** ("strong adjacent = 1pt") must be defined per question (which distractors are near the correct answer).

## Proposed phasing (CCs)

- **Phase 1 — scoring + reveal redesign** on existing items: 3-rank, partial credit (5/3/1), comic badge, warm 3-part reveal. Fixes the deflating UX immediately, even with current predictors.
- **Phase 2 — bank + predictors**, deck by deck, starting Grip → Lens → Love (strongest engine mapping); define adjacency.
- **Phase 3 — symmetric self-pass**: subject self-answers → "verified" truth → dual-truth scoring + partner-override bonus + Mirror Blind / Hidden Pattern reveals unlocked.

---

# Mode 2 — "Who's More Likely To…" (comparative)

A second, distinct mode (owner workshop input 2026-05-24). Mode 1 = B *guesses A's* answer (how well do you read me). Mode 2 = *compare the two partners* on a trait/scenario.

## Format

Prompt + answers: **Partner A / Partner B / Both, but for different reasons / Neither (call someone competent)**. Two sources per prompt:
- **Engine pick** — compare A's vs B's Lens/Grip/Aim/risk on the prompt's tagged dimension, pick the higher.
- **Partner pick** — each partner's lived-reality answer.

## Scoring

| Result | Points |
|---|---|
| Engine + partner agree, player guessed right | 5 |
| Partner agrees, engine disagrees | 4 |
| Engine agrees, partner disagrees | 3 |
| Great explanation | +1 |
| Painfully true, everyone laughs | auto-win |

Reveal: *"Engine says Jason / Partner says Michele / Verdict: the engine saw the pattern, Michele has the receipts."* — productive engine-vs-partner disagreement.

## "Both, but for different reasons" — first-class in EVERY round (owner's strong rec)

This is where the relational gold lives: the reveal articulates the *two different reasons* (A does it via Se-courage, B via Fe-loyalty) — surfaces complementarity / the Aim-exchange (Kite-and-String).

## Engine mapping (tag each prompt)

Lens tags (Ni/Ne/Si/Se/Ti/Te/Fi/Fe) + Grip tags (Control/Approval/Security/Freedom/Reputation/Responsibility/Certainty/Belonging). Each prompt → a dimension → compare A vs B → engine pick. The "engine-disagreement" prompts (#91-105: "calm but running a 47-tab crisis sim," "mistake being useful for being loved," "turn fear into a TED talk") are the diagnostic ones; the rest are party-fun.

## 10 themed decks

Adventurous · Dangerous-but-funny · Miraculous · Heroic · Humorous · Relationally Brave · Chaotic Good · Survival Movie · Mythic/Ridiculous · Engine-disagreement. ~105 starter prompts authored; a "best 25" sticky/diagnostic set flagged. (Full bank in the 2026-05-24 workshop notes.)

## Key difference: Mode 2 needs BOTH partners assessed

Mode 1 needs only A assessed (B just guesses). Mode 2 is a *comparison*, so it needs **both partners to have profiles** AND both to answer each prompt (lived pick). Deeper-funnel.

## Funnel / growth loop (the strategic point)

Mode 1 is the **low-barrier viral entry** (one assessed, partner guesses) — and it naturally pulls the guessing partner to take the assessment themselves. Once both are assessed, **Mode 2 unlocks** (play together). So: **Mode 1 invite → B assesses → Mode 2** — the two modes are a growth loop, not competitors. Build Mode 1's scoring/reveal first (closest to the existing MVP); Mode 2 is the both-assessed layer after.

---

# Score history over time (parked idea — owner, 2026-05-24)

## Where scoring stands today

The game already keeps score per play: the reveal computes a warm total (`totalPoints`/`maxPoints` + clean/close/adjacent/off + "how clearly you read them"), persisted to `couple_sessions.game_results`. Limit: **one score per bond** — play is idempotent (a completed token returns the saved reveal, never re-scores). No history, no trend. A screenshot is the only way to keep a result. That's fine for now.

## The idea

Track score *over time* so a couple sees themselves getting to know each other better — a climbing trend as encouragement. Owner's instinct: this could contribute positively to trajectory movement.

## Two mechanisms (keep them separate — very different builds)

1. **Indirect (recommended near-term).** The individual trajectory (Goal/Soul/Grip/Movement) is computed purely from that person's own assessment answers — the couple game feeds nothing into it today. What actually moves the chart is real change (less defensiveness, more generous reading) followed by **re-taking the assessment**, which the trajectory chart's feedback loop then renders as a delta. A score *history* is the between-assessments motivator that nudges toward re-assessment. Loosely coupled, low-risk, on-thesis (lower Grip → more Movement).

2. **Direct (defer; needs a canon decision).** Explicitly wire game-score trend as an input into the individual trajectory. Powerful, but makes the instrument partly *behavioral* rather than purely self-report — a deliberate decision about whether relational logging should move someone's personal shape. Hold for a proper design conversation.

## Sketch (when picked up — ~CC-COUPLE-9, after bond CC-COUPLE-7 + Mode 2 CC-COUPLE-8)

Replayable bonds + a small per-bond results log (append each play instead of one-shot overwrite) → a "you've played N times, here's the climb" view. Keep the trajectory engine assessment-driven; the score history stands on its own and points back toward re-assessment.
