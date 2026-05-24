# N/S Item-Valence Balance — Warmth Parity Across Perceiving Voices

**Status: Canon as of CC-135. Co-authored: Jason + Clarence (item-design
critique) + CC (rebalance + audit).**

## The principle

The instrument measures N vs S on **cognitive process**, not on **warmth**.

If the Intuition (N) voices in a perceiving question are written warmer,
deeper, or more relationally rich than the Sensing (S) voices, then a
warm/people-oriented respondent — including warm Sensors — will be pulled
toward N regardless of their actual cognitive register. That is a
**content-validity** failure: warmth is confounded with intuition.

The fix is **parity of valence**: every Sensing voice in a perceiving block
must carry warmth, inner depth, and people-orientation **within one band of**
its N counterparts in the same block. Not by dulling N — by warming S. The
goal is that a warm Sensor sees themselves cleanly in a Sensing voice.

## What this is NOT
- It is not "more sentiment makes the test more accurate." Warmth is the
  carrier; the content the warmth carries (present-tense attunement for Se,
  remembered devotion for Si) is the actual measurement.
- It is not "every voice must sound identical." Voices stay distinct in
  cognitive register; only the affective + relational tone parameters are
  balanced.
- It is not a rewrite of the `signal` map, the neutral "Voice A–D" labels, or
  the per-question option shuffle. Those defenses are unchanged.

## The voice-warmth rubric (one-band rule)

Each perceiving voice is rated on three axes:

| Axis | Band 0 (cold) | Band 1 (neutral) | Band 2 (warm) |
|---|---|---|---|
| **Warmth** — affective tone | clinical / procedural / impulsive | matter-of-fact / observational | tender / devoted / present-attentive |
| **Depth** — inner-life signal | mechanical only ("X happens") | functional self-report ("I do X") | reflective inner stance ("I want to honor X") |
| **People-orientation** — relational hook | no people / "the situation" only | people referenced as observers | people referenced as the carriers / loved ones / care-objects |

**Rule (directional):** S voices must reach within **one band of N or above**
on every axis (`N_band - S_band ≤ 1`). The original failure mode this canon
fixes is **S colder than N** — that's the warmth-→-N confound. S running
warmer than N is allowed: warmth on both sides is exactly the rebalance goal
("warmth must stop predicting N"). The audit emits a WARN when S exceeds N
by ≥ 2 bands so the rebalance doesn't silently flip the bias the other way.

Lexical cue tokens that often indicate the warm/deep band (heuristic, not
proof):
- People nouns: *people, person, someone, mentor, friends, loved ones*
- Devotional verbs: *honor, hold, carry, remember, tend, attend*
- Felt-experience nouns: *care, weight, texture, presence, memory*
- First-person felt-truth markers: *what I want, what I trust, what felt right*

Lexical cue tokens that often indicate the cold/thin band:
- Action-only verbs without affect: *start, move, try, pick up, look up*
- Engineering register without people: *precedent, baseline, procedure*
- Impulse register: *just*, *whatever surfaces*, *see what happens*

## Audit

`tests/audit/nsItemValence.audit.ts` runs a heuristic lexical check over the
Q-T perceiving items (Q-T1–T4): for each block, it scores N and S voices on
the three axes via cue-token counts and asserts the N-vs-S spread is within
one band on every axis. The audit is a **guide, not a proof** — final
judgment is human-readable. It catches obvious regressions (an Se voice
re-introducing "just start moving" alongside a Ni voice that anchors in
"deeper meaning") but does not certify subtle valence drift.

## Validation gate

The rebalanced items are only **trusted** after a warm-Sensor exemplar
resolves to S, not N. CC-135 ships the rewrite with the gate-status
explicitly named (open or closed) in the prompt's Report Back. Until the
gate closes, the CC-134 §C.6 N/S valence guard + the head-to-head clarifier
remain in force as backstops.

## Provenance

- Canonized: 2026-05-23 (CC-135)
- Item-design author: Clarence (Megan-case diagnosis + rebalance brief)
- Implementation + audit: CC
- Predecessor: `ne-item-validity-review.md` (CC-122 — the analogous
  presence-vs-flavor fix on the Ne / Ni voices)
