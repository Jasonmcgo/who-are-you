# Guide / Individual Additive Model

## Purpose

Codifies the architectural relationship between the two report views the
engine produces: **Individual** and **Guide**. Every CC that touches
rendering, mode-policy, or prose investment must read this file first and
respect every principle in it.

This canon governs *how the two views relate*. It does not govern *what*
each view contains (that is `result-writing-canon.md` + `inner-constitution.md`)
or *what gets derived* (that is `output-engine-rules.md`).

The product's failure mode without this canon: a "clinician" view that
returns colder, more clinical prose than the "user" view, so prose
investments land only in one surface and the other never inherits them —
two parallel reports that drift apart over time, with the explanatory
surface carrying the *worse* writing rather than the same writing plus
context. The success mode with this canon: a single editorial line that
ships to both surfaces, with the Guide adding diagnostic scaffolding on
top of the Individual rather than substituting cooler copy for it.

---

## The Six Principles

1. **Two views, one read.** "Individual" and "Guide" are the same
   underlying read of the same person. The Guide is never a different or
   more severe verdict — only the same read with more explanation.
   Disagreement between the two views is a bug.

2. **Individual = the canonical, reader-facing report.** All prose
   investment, refinement, warmth, and rewrite cycles target the
   Individual. It is the product. Improvements made anywhere else are
   either ports back to the Individual or a violation of this canon.

3. **Guide = Individual + additive scaffolding.** The Guide is a strict
   **superset** of the Individual: every line in the Individual appears in
   the Guide, plus diagnostic scaffolding (signal logic, scores, inferred
   values, grip components, confidence, surface labels, provenance,
   borrowed-system labels such as MBTI). The Guide inherits Individual
   improvements automatically — it never carries its own colder copy.

4. **Length and repetition are defects in the Individual.** Reader
   feedback flags the Individual as accurate but too long and too
   repetitive. The Individual is tightened ruthlessly — shorter,
   de-duplicated, punchier. Cut material is not lost: it lives in the
   Guide (the "junk drawer"). Cutting from the Individual never destroys
   information because the Guide retains it. This makes aggressive
   tightening of the Individual safe.

5. **Audience.** Individual = the person who took the assessment. Guide =
   whoever helps them interpret it (coach, therapist, pastor, mentor,
   facilitator, trusted friend) plus internal QA / engine review. "Guide"
   is not a medical or clinical designation — the helper need not be a
   licensed professional.

6. **Naming.** Display label "Individual" maps to the internal
   `renderMode` value `"user"`; display label "Guide" maps to the internal
   `renderMode` value `"clinician"`. The internal string values are
   retained for now because renaming them would churn audits and
   baselines that key on them; this doc is the authoritative mapping
   between display label and internal value.

---

## Operational consequences

- A prose-tightening pass on the Individual is **safe** under this model
  even when the cut content is informationally load-bearing for an
  external helper — the Guide carries the cut content.
- A "make the Guide warmer" CC is the wrong shape. The correct shape is:
  invest in the Individual's prose; the Guide picks up the improvement
  for free via the additive superset relationship.
- Audits or tests that assert the Guide-only surface contains some
  scaffolding artifact (MBTI label, raw grip components, confidence
  fields) are correct under this canon. Audits that assert the Guide
  contains *colder* or *more clinical* copy than the Individual are
  expressing the pre-CC-118 inverted model and should be revisited.
- The display-label rename in the admin toggle is a product surface
  change only. Internal `renderMode` string values, `Props['renderMode']`
  types, and audit regexes that match `"user"` / `"clinician"` are
  preserved (per principle 6).
