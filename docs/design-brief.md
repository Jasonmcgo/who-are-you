# Who Are You? — Design Brief

**For:** Anthropic Design Lab
**Prepared:** 2026-04-24
**Purpose:** Share what this product is and where design input would most help — especially around ranking interactions and overall tone.

---

## What it is

"Who Are You?" is a self-discovery tool. The user answers questions across different aspects of identity — what they value, how they were formed, what pressure they're under, how their mind processes things — and the product returns an **Inner Constitution**: a short, tone-careful reflection of the patterns the answers point at.

What separates it from a personality quiz is that it doesn't end with "you are an INTJ" or "you're 73% conscientious." It ends with **a description of the tensions inside the person** — the places where two things they care about pull against each other, or where who they were formed to be is at odds with what their current life is asking.

## How it works

Every answer produces one or more **signals** — small semantic units like `truth_priority_high` or `adapts_under_social_pressure`. Signals accumulate across the session. Certain combinations fire **tensions** — named patterns like "Truth vs Belonging" or "Formation vs Current Conviction." Detected tensions are surfaced as possibilities, not declarations:

> *"This pattern may be present: you value truth, but adapt when social cost is high. Does this feel accurate?"*

The user can confirm, partially confirm, reject, or annotate each tension. The final Inner Constitution is built from confirmed tensions and the signals supporting them.

It's a **signal-first** system — the engine infers meaning from answer combinations rather than sorting users into pre-cut types. Labels like MBTI are optional outputs, derivable when useful, never the primary interpretive move.

## The nine-card architecture

Questions are organized into nine cards, each a different lens on identity:

- **Formation** — how you were shaped
- **Context** — where your life currently is
- **Role** — what's expected of you
- **Temperament** — how your mind operates by default
- **Conviction** — what you believe
- **Pressure** — what survives when holding a belief costs you
- **Contradiction** — where your life is internally at odds
- **Agency** — what you actually do
- **Sacred Values** — what you refuse to compromise

Plus an **Insight** layer of freeform questions the engine extracts additional signals from.

Six of the nine cards have question sets today. Three (Role, Temperament, Contradiction) are queued. Temperament is the largest piece now in motion — an eight-question set that identifies cognitive-function patterns and derives an MBTI surface label from the function stack when confident enough.

---

## Why we're reaching out

We've committed to a product-design move that ranking — rank-ordering a set of options from most to least — should replace forced-single-choice for several of the hardest questions. Ranking produces richer signal than binary picks and handles real-world ambivalence without forcing users to flatten it. But the interaction design is still open.

Ranking appears in four places:

- **Sacred Values (Q-S1, Q-S2).** Two ranking questions — "Order these by what you'd protect first when something has to give" (Freedom / Truth / Stability / Loyalty) and "Order these by which has the strongest claim on you" (Family / Knowledge / Justice / Faith).
- **Institutional Trust (Q-X3).** Rank five categories — Government, Press, Employers, Education, Non-Profits & Religious organizations — from most to least trustworthy.
- **Responsibility Attribution (Q-C4).** Rank five sources — Individual, System, Nature, Supernatural, Authority — from most to least where the user locates responsibility when things go wrong.
- **Temperament (Q-T1–Q-T8).** Eight ranking questions, each presenting four first-person statements written in the voice of a different cognitive function. The user orders them by which most "sounds like me."

An example Temperament question:

> **When you're working on a hard problem — order these by which most sounds like how you actually approach it:**
>
> - "Once I see how the pieces are going to land, the rest is mostly execution."
> - "There are at least four interesting angles here. I want to try each before settling."
> - "What's worked in similar situations before? There's usually precedent worth checking."
> - "Let me start moving and see what surfaces."

---

## Where design input would most help

**1. The ranking primitive.** What's the right interaction on both desktop and mobile? Drag-to-reorder is familiar but fiddly on touch. Click-to-place (tap #1, tap the item) is clearer but feels slow. Numbered dropdowns are accessible but unlovely. We have not designed this — we've only committed that it's needed.

**2. 4 vs. 5 items.** We've capped ranking at 5 options. Is there a meaningful UX difference between 4 and 5 on small screens? Do users' rankings degrade at the tail? Is there a case for capping at 3?

**3. The Temperament experience specifically.** Eight ranking questions is a lot. Each presents four carefully-voiced statements the user reads and ranks. We want the *reading* to feel like the thing — the user recognizing themselves in a voice — and the ranking to fall out of that naturally. Is there an interaction that supports that rhythm? Can we avoid it reading like a personality exam?

**4. Tone and register.** The product wants to feel closer to a thoughtful letter than a BuzzFeed quiz. Tensions are surfaced as possibilities, not declarations ("this pattern may be present" / "appears to"). What typography, pacing, and visual language would hold that register?

**5. The Inner Constitution artifact.** The thing the user reads at the end — prose plus confirmed tensions. We haven't designed what it looks like. It should feel like something the person wants to save, not a report they close.

## Not on the table

To save suggestions we've already ruled out:

- No user-typing ("You are an ENFP!").
- No gamification (points, streaks, badges).
- No social sharing in v1.
- No therapist-avatar or chatbot. The voice lives in the questions and the Inner Constitution.

## What would help most

- Sketches or principles for the ranking primitive (desktop + mobile).
- A point of view on whether 8 ranked Temperament questions is one card's worth or too heavy.
- Tone / typography direction for the Inner Constitution artifact.
- Red flags we should have seen but haven't.

Anything else the team sees is welcome. A running local build is available on request.
