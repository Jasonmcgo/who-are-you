# Intuition Item Validity — Presence vs. Flavor

**Status: Clarence-reviewed 2026-05-22. Diagnosis confirmed. Ready for
item-bank revision (scoring change deferred — see Implementation Path).**
**Authors: Jason (hypothesis) · CC (item analysis) · Clarence (refinement).**

## The architectural move

> **Separate intuition *presence* from intuition *flavor*.**

Otherwise the model keeps asking NFs to prove intuition by sounding like NTs.
This is the canon principle the rest of the document serves.

## The claim (precise form)

The current intuition items appear to detect intuition most reliably when it
presents as **impersonal abstraction**: mapping forces, comparing methods,
identifying conceptual angles, or finding the underlying explanation. That
works for many NT and some ST profiles, but it **under-detects intuition when
it presents through relational possibility, symbolic meaning, future
trajectory, emotional pattern recognition, or person-centered generativity.**

The engine is not misreading the answers. The problem is earlier: **the answer
options do not give intuitive Feelers a clean way to express intuition without
sounding like either Thinking or Feeling.** ENFP-style Ne collapses into Fe.
INFJ-style Ni disappears beneath Fe, Fi, or even Se, depending on the
surrounding items.

This is a **content-validity** problem, not a scoring bug. And it is *not*
"the test needs to be warmer" — it is "intuition is operationalized too
narrowly." The fix is more validity, not more sentiment.

## Evidence — the current Ne voices (verbatim)

Every Ne option is set in an impersonal task / problem / method context:

- **Q-T1 (hard problem)** — *"There are at least four interesting angles here.
  I want to spend time on each before deciding which one fits."*
- **Q-T2 (new environment)** — *"so many new possibilities here. I want to
  explore widely before forming any conclusions."*
- **Q-T3 (learning)** — *"I'd rather try several approaches than commit to one
  method. Different methods reveal different things about the skill."*
- **Q-T4 (reading a situation)** — *"There are probably several forces at work
  here. I want to map them and see how they interact before picking a read."*

The Ni voices are framed the same analytic way (*"the single underlying thing
that explains all observations," "what this place is really about"*).

**Q-O1 (novelty)** routes the Feeler expression away from the intuition core:
the intuition-loaded option is *"New ideas, models, theories, or frameworks"*
(NT); *"new people/perspectives"* and *"emotional honesty"* are siloed as
separate openness facets that don't reinforce the intuition signal.

## Cohort evidence

| Person | Jason (truth) | Engine read | Lost signal |
| --- | --- | --- | --- |
| Michele | ENFP (High) | ENFJ (high conf) | Ne-dom → Fe-dom. Confirmed: over-endorsed Fe 'people/care' items; Ne never registered. |
| Ashley | INFJ (High) | ESFP (low conf) | Ni-dom → Se. Intuition lost entirely; defaulted to Sensing. |

Both are **intuitive Feelers**; both lost N. Counter-evidence to protect: the
items **correctly** type the Thinking/Sensing shapes (Brad, Daniel, Matti,
quelcdp, Brian, Jason all matched). Any change must not degrade those.

## Item-design canon (proposed guardrail)

> An intuition item should measure the **perception of possibility, pattern,
> trajectory, or underlying meaning.** It should **not** require the respondent
> to express that perception in an analytic, impersonal, or intellectual
> register.

## Ne and Ni need *different* F-register expressions

They are different animals. Adding "people" to both is the over-correction
trap — a warm, relational answer is not automatically intuitive.

**Ne** — *"What could this become if we followed the living thread?"*
Distinguish from **Fe** (*"What does the group need emotionally/relationally
right now?"*). Ne is future/possibility/connection, not present social need.

**Ni** — *"Where is this actually going, beneath the surface? What is the
hidden shape of this?"* Distinguish from **Fe** (*"What is the emotional/social
reality in the room?"*) and **Fi** (*"Is this aligned with what is true or
sacred inside me?"*). Ni is hidden direction/pattern, not felt-value alignment.

## Sample revised items (Clarence)

**Ne — hard problem:** *"I start seeing several ways this could open up. One
idea leads to another, and the useful path often appears after I've followed a
few live threads."*

**Ne — relational:** *"I notice what this could become between people: the
unexpected connection, the new possibility, the path no one has named yet."*
(NF-Ne — not merely "I care how people feel.")

**Ne — learning:** *"I learn by exploring different entrances into the thing.
A conversation, an example, a story, or a tangent can suddenly make the whole
subject come alive."*

**Ne — under pressure:** *"When stuck, I look for another door. The first
answer may be too narrow, so I start asking what else could be true, possible,
or worth trying."* (Clean Ne; works for Thinkers and Feelers.)

**Ni — hard problem:** *"I keep looking for the hidden shape underneath the
details. Once I see the pattern, the scattered pieces start to arrange
themselves."*

**Ni — relational:** *"I often sense where something is headed before people
have fully said it. I may not have all the evidence yet, but the direction
begins to feel clear."*

**Ni — learning:** *"I need the underlying meaning or organizing principle.
Once I understand what the thing is really about, the details become easier to
place."*

**Ni — under pressure:** *"I get quiet and look for the one thread that
explains why the situation feels off. Too many details can distract me until
the deeper pattern comes into view."*

## Avoiding "every warm person becomes an intuitive"

The NF intuition options must carry future, pattern, possibility, symbolic
meaning, or underlying direction — otherwise they read as Fe / Agreeableness.

- **Bad NF-Ne:** *"I like connecting with people and hearing their stories."*
  (Fe.) → **Better:** *"People's stories quickly make me imagine new paths,
  connections, and possibilities for what could happen next."*
- **Bad NF-Ni:** *"I can tell how people are feeling."* (Fe/empathy.) →
  **Better:** *"I often sense the deeper direction of a person or situation
  before the surface facts fully explain it."*

## Implementation path (item-bank first, scoring later)

Changing scoring first would hide the measurement flaw. Fix the language, then
watch what the engine does.

1. **Add F-register Ne/Ni options** to the same forced-ranking contexts
   (Q-T1–T4, and reconsider Q-O1 facet routing).
2. **Tag them intuition-first, flavor-second:** `Ne_core + F_register`,
   `Ni_core + F_register` — **not** `Fe`. This is the mechanism that prevents
   the double-count that sank Michele.
3. **Regression** against known-good Thinker/Sensor matches — their types must
   stay put.
4. **Retest Michele and Ashley** — must move toward ENFP / INFJ.
5. **Only then** consider scoring changes.

## The one-sentence question

> Are we measuring intuition itself, or only intuition expressed in an
> impersonal/analytic register? If the latter, can we add NF-register Ne/Ni
> items that preserve the intuition construct without double-counting Feeling?

## Guardrails

- Do **not** inflate intuition globally; the goal is to stop *suppressing*
  Feeler intuition, not to add an N thumb on the scale.
- F-register intuition items must still test pattern / possibility / trajectory
  / hidden meaning — never warmth alone.
- Validate against the ground-truth cohort before/after. Michele's planned
  answer-update + rerun is the first live test.
- Relates to [[state-compression-model]] — both describe intuition being
  under-read; this lever is *item design*, that one is *load/trait*. Same
  signature, different cause.
