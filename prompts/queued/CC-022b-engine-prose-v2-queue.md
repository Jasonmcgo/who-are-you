# CC-022b — Engine Prose v2 (Queue / Working Notes)

*This is a queue file, not a CC. When CC-022a lands and CC-022b is ready to fire, this becomes the source for the full CC spec. New items append here as findings emerge from real-user testing and LLM-rewrite analysis.*

*Sequenced after CC-022a (test flow restructure + helpers + Rule 5 amendment) lands.*

---

## Architectural premise

The engine produces structurally-rich, accurate observations. The prose layer compresses them into shape-specific, memorable language. **The engine does not need to produce the compressed line itself; it needs to provide the raw material clearly enough that compression is possible.** That means rich per-card outputs, named cross-card patterns, and structural cues that a downstream prose layer (templates today; LLM later, possibly never) can compress against.

This insight came from analyzing how Jason's LLM-rewritten report produced the line:

> *"Your gift is the long read. Your danger is believing the long read too early."*

That sentence was not in the original engine output. It was an LLM compression of:

- Lens read: *"pattern-reader, supported by the structurer"*
- Lens trap: *"the pattern you see clearly may stop being tested, allowing private interpretation to settle into private fact"*
- Conviction posture: *"willingness to bear cost when belief is at stake"*
- Generic warning: *"under pressure, the pattern-reader narrows the lens until certainty starts to feel like fact"*

The LLM had four scattered phrases. It compressed them into one parallel-structure sentence (same noun, inverted on a temporal axis). The engine's job is to ensure the four phrases are accurate and structurally tagged; the prose layer's job is the compression.

---

## Items

### Item 1 — Name threading throughout the Mirror

(Original CC-022 spec, Item 1.) Use the `getUserName` + `nameOrYour` helpers shipped in CC-022a; thread name into 1-2 places per major Mirror section + 3-4 places per Map card. Graceful fallback to *"You"* / *"Your"* when name is `prefer_not_to_say` or missing.

### Item 2 — Demographic-aware contextual interpolation

(Original CC-022 spec, Item 2.) Profession in Path · Gait Work; marital status in Love (lighter touch); age decade in Weather (lightest touch). Per the amended `demographic-rules.md` Rule 4 — interpolation reflects user-supplied values; never infers, never asserts cultural archetypes.

### Item 3 — Keystone Reflection selection citation

(Original CC-022 spec, Item 3.) Cite the user's actual Q-I2 / Q-I3 selections back by source-question label. The user sees their own self-named priorities — top-3 trust sources from Q-X3 + top-3 from Q-X4; top-3 sacred drivers from Q-S1 + top-3 from Q-S2. Replaces generic dimension-label prose ("rigid posture") with structurally specific prose ("Of the six trust sources you ranked highest...").

### Item 4 — Cross-card pattern catalog

(Original CC-022 spec, Item 4.) Initial 8-10 canonical cross-card patterns detected at prose-generation time. Each has a detection rule + templated paragraph that surfaces in the relevant card section. Initial catalog candidates (revisable):

- Faith ↔ Supernatural distinction
- Justice ↔ System attribution
- Truth ↔ private-under-threat Conviction posture
- Freedom ↔ Order tension
- Family ↔ Money allocation gap (Compass-side reflection of T-013)
- Knowledge ↔ Education trust
- Loyalty ↔ Family / Partner trust
- Stability ↔ Chaos formation
- Pattern-reader Lens ↔ low present-tense action
- Costly conviction without revision
- **Builder ↔ Maintenance allocation gap** *(NEW — see Item 6 below)*

### Item 5 — Simple Summary closing section

(Original CC-022 spec, Item 5.) New section at the end of the Mirror. Synthesizes eight cards into 4-7 cross-card sentences, then closes with structured patterns:

- *"To keep X without Y"* parallel lines (3-4 lines, drawn from per-card outputs).
- ***"Your gift is X. Your danger is X {temporal}"* compression line** *(NEW — see Item 7 below).*
- ***Best one-line thesis*** *(NEW — see Item 8 below).*

### Item 6 — Builder ↔ Maintenance allocation gap pattern (NEW)

Added 2026-04-26. From analysis of Jason's LLM-rewritten report — specifically the LLM's critique of the current T-013 prose as reading "cheap gotcha" for builder-shapes. The mature framing for pattern-reader / structurer / structural-sacred-values shapes is not *charity spending vs sacred values* but *creative output / protected hours vs maintenance load*.

**Detection (provisional)**: pattern-reader Lens (Ni or Ne dominant) + structurer support (Te aux) + Q-A1 producing `reactive_operator` or `responsibility_maintainer` + at least one structural / future-oriented sacred value (Faith, Truth, Knowledge, or Justice in the user's top-2).

**Prose template (provisional)**:

> *"For {nameOrYour} shape, the meaningful allocation gap may not be the standard money-toward-charity question. The sharper question is whether {nameOrYour} creative output, {nameOrYour} protected hours, and {nameOrYour} strategic attention are moving toward the future {nameOrYour} say{s} {they} believe in — or whether maintenance is consuming the time that was supposed to build it."*

**Architectural placement**: this is a Compass-side **OR** Path · Gait Work-side cross-card pattern, distinct from the T-013 instance that may also fire. Both can render — they're at different abstraction levels (T-013 surfaces the specific money-flow gap; this pattern surfaces the deeper builder-shape gap).

**Worth flagging**: the LLM's critique of T-013 prose as "cheap gotcha" generalizes — the constraint-first interpretation rule from `allocation-rules.md` Rule 4 is being honored at the policy level but the per-instance T-013 prose still occasionally lands prosecutorially for specific shapes. This pattern is the builder-shape correction; future patterns may correct other shapes (caregiving-shape, exploring-shape, etc.) similarly. The prose register correction is more important than the catalog growth — name the right gap for the right shape.

### Item 7 — *"Your gift is X. Your danger is X {temporal}"* template (NEW)

Added 2026-04-26. From Jason's call-out of the line *"Your gift is the long read. Your danger is believing the long read too early."* as profoundly resonant.

**Architectural insight**: this template captures the dialectic of cognitive functions in compressed form. The same noun (the capability) is gift and danger; only the temporal qualifier ("too early," "for too long," "without testing," "when no longer needed") creates the inversion. The reader cannot disagree with the gift without disagreeing with the danger — they're the same machinery viewed at different moments.

**Use as Simple Summary closing pattern**, alongside the existing *"To keep X without Y"* lines. One *"Your gift is X. Your danger is X temporal"* line per session, derived from the user's dominant Lens function + its characteristic failure mode.

**Per-shape templates (initial set, revisable)**:

- **Pattern-reader (Ni dominant)**: *"Your gift is the long read. Your danger is believing the long read too early."*
- **Possibility-finder (Ne dominant)**: *"Your gift is room-reading. Your danger is room-reading instead of saying."*
- **Precedent-checker (Si dominant)**: *"Your gift is durable memory. Your danger is durable memory of what no longer applies."*
- **Coherence-checker (Se dominant)**: *"Your gift is present-tense response. Your danger is present-tense response without long enough context."*
- **Structurer (Te dominant)**: *"Your gift is operational clarity. Your danger is operational clarity before the goal has been examined."*
- **Logic-tester (Ti dominant)**: *"Your gift is internal coherence. Your danger is internal coherence the world doesn't share."*
- **Conviction-holder (Fi dominant)**: *"Your gift is moral seriousness. Your danger is moral seriousness without curiosity."*
- **Room-reader (Fe dominant)**: *"Your gift is attunement. Your danger is attunement instead of authorship."*

These are templates per the dominant function. The compression must feel earned — generic "your gift is X" sentences without the temporal inversion don't carry the same weight. The template is *gift-and-failure-of-the-same-machinery*, not *gift-then-unrelated-trap*.

**Implementation hook**: in `generateSimpleSummary`, select the gift/danger line by user's `lens_stack.dominant`. Pre-author one line per function (8 total) plus a generic fallback for unusual stack combinations.

### Item 8 — Best one-line thesis as Simple Summary final beat (NEW)

Added 2026-04-26. From Jason's LLM rewrite, the final line: *"Jason is a long-arc pattern reader and builder whose growth edge is not caring more, but translating conviction into visible, revisable, present-tense structure."*

**Architectural shape**: one sentence. Captures the user's shape + the growth-edge inversion in compressed form. The *"not X, but Y"* construction is what gives it weight — most personality writing says *"your growth move is to be more legible"*; this version says *"the growth edge is not caring more, but translating."* The inversion names what the user might assume the answer is and corrects it.

**Use as Simple Summary's final line**, after the *"To keep X without Y"* parallel lines and after the *"Your gift is X. Your danger is X temporal"* compression. The flow becomes:

```
{4-7 sentences synthesizing the eight cards}

To keep X without Y.
To keep X without Y.
To keep X without Y.

{Name's} gift is {capability}. {Name's} danger is {capability} {temporal}.

{Name} is a {shape descriptor} whose growth edge is not {assumed answer}, but {actual structural answer}.
```

**Implementation hook**: the *"not X, but Y"* construction is templated. X is what the user might assume from the prose ("be more legible," "care more," "speak up more"); Y is the more specific structural answer drawn from the cross-card patterns + per-card outputs. Pre-author a small set of (X, Y) pairs keyed by shape; pick at render time.

### Item 9 — Canon updates

Same as original CC-022 spec. `cross-card-patterns.md` (NEW), `result-writing-canon.md` append.

Plus: extend `result-writing-canon.md`'s prose primitives section to include the *"Your gift is X. Your danger is X temporal"* compression template + the *"not X, but Y"* growth-edge construction as canonical Simple Summary beats.

---

## Open questions for the eventual full CC

- **How many cross-card patterns at first ship?** Original spec said 8-10. With the Builder ↔ Maintenance addition, lean 10-12 initially. Don't over-author; real-user testing will identify gaps.
- **Where exactly does the Simple Summary section sit?** Original spec said before Open Tensions. Worth re-checking once CC-022a's flow restructure lands and the page layout settles.
- **Backward compatibility for older saved sessions** without the structured Q-I2/Q-I3 selection details — fall back to dimension-label prose. Same as original spec.
- **Hedge-density tuning** is currently deferred to CC-023. Worth reconsidering inclusion in CC-022b if real-user testing surfaces hedge-stacking as a felt issue.

---

## Future additions (append below)

*(Empty until next observation surfaces. New items get added with date + source.)*

---

## When CC-022a lands

1. Smoke the flow restructure (Identity & Context renders before portrait; second-pass triggers at right boundary; scroll lands at top).
2. Once CC-022a is verified, this queue file gets converted into a full CC-022b spec with Launch Directive / Bash Authorized / Allowed-to-Modify / Out of Scope / Acceptance Criteria / Report Back sections.
3. Items 6, 7, 8 above carry into the full spec as material additions to CC-022's original 5 items.
