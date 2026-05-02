# Keystone Block Restructure (Q-I1 + Q-I3) — Open Design Issue

*Surfaced 2026-04-26 by Jason during CC-022a browser smoke. Originally a Q-I3-only critique; expanded same day to recognize Q-I1 has the parallel structural error. Captured for a future structural CC. Not in scope for CC-022b (which is prose-layer only).*

*Probable label: **CC-024 — Keystone Reflection Restructure** (was provisionally CC-024 — Q-I3 Cost-of-Conviction Restructure; expanded scope to cover Q-I1 reframing).*

---

## The two mismatches (same architectural error)

The Keystone block was designed as a **stress-test against social/identity pressure** — a probe of *cost-of-conviction*. Both Q-I1 and Q-I3 currently frame their prompts against registers that don't compose with that purpose.

### Q-I1 — framing privileges social differentiation, not cost-bearing

Current text: *"What is something you believe that most people around you disagree with?"*

The verb composes with **social-differentiation register**. It pulls users toward *"controversial opinions"* rather than *"deeply-held cost-bearing convictions."* Madison's anchor (*"grey is always more accurate than black+white"*) and Jason's anchor (apocalyptic / theological / geopolitical) are both meaningful, but the prompt itself led each toward "differentiated takes" rather than "convictions worth real cost."

Right framing: cost-bearing register. *"What is a belief you'd bear real cost to keep?"* — composes with the block's purpose; sets up Q-I2 (revision path) and Q-I3 (cost calibration) cleanly.

### Q-I3 — answer space is sacred values; question asks what you'd sacrifice

Current text: *"What would you risk losing for this belief?"* with `derived_from: ["Q-S1", "Q-S2"]` (sacred values).

The verb (*"would risk losing"*) doesn't compose with the source card's semantics (*"sacred = protected first"*). Asking the user to rank-order their top sacred values by sacrificiability is incoherent — sacred-by-definition means not-to-be-sacrificed. Honest answer is "I wouldn't want to lose any of those for anything," which is also a refusal of the question.

Right framing: concrete loss domains as answer space. Money / Family / Work / Country / Possessions / Reputation / Honor / Comfort / Trust / Job / Relationships / Physical pain / Emotional pain (Jason's expanded list, 2026-04-26). Quantifiable costs the user can coherently rank.

### The architectural rule both errors share

**The question's verb must compose with the source card's semantics (or the block's purpose).** Q-I2 passes the composition check (`"could revise"` ↔ `trust source`). Q-I1 and Q-I3 fail it.

Future cross-card derivations should pass this composition check before being authored.

## What the question should measure

The intended measurement: *what concrete cost would the user bear for this belief?* That's the cost-of-conviction read — the dimension that distinguishes held belief from costly held belief.

The right answer space is **concrete loss domains**, not abstract values. Quantifiable losses; user can answer *"yes, I'd risk that"* or *"no, that's too much"* coherently for each.

### Recommended canonical list (6 items + None + Other)

Decided 2026-04-26 after analysis of category coverage and Jason's expanded list:

1. **Money / Financial security** — your money, savings, financial stability.
2. **Job / Career** — your professional standing, your work.
3. **Close relationships** — partner, family, closest friends.
4. **Reputation** — how others see you, your standing in your community.
5. **Comfort / Daily ease** — your routines, your quality of life.
6. **Physical safety / Health** — your body, your safety.

Plus the canonical pair:
- **None of these** (mutually exclusive with the 6 — emits `belief_no_cost_named` MetaSignal as today).
- **Other (please specify)** — freeform escape; not text-mined per existing architecture.

### Considered and deferred to v2

- **Citizenship / Political belonging** — discriminating signal for users for whom citizenship is at stake (religious minorities, political dissidents, immigrants), but not nearly-universally meaningful. Add as 7th item only if real-user testing surfaces *"I'd risk my citizenship but the survey didn't let me say so"* feedback.
- **Honor / How you see yourself** — too internal-coded; most users would conflate with Reputation. v2 candidate.
- **Possessions** — too narrow; covered by Money for most users.
- **Time / Years of life** — too extreme; useful only in mortality-stakes scenarios.
- **Emotional pain** — implicitly covered by Close relationships, Reputation. Including it explicitly would over-signal the emotional dimension and underweight material/civic.

### Category structure — what the list covers

The 6 items ladder roughly material → relational → quality-of-life → bodily:

- **Material**: Money (#1), Job (#2)
- **Relational**: Close relationships (#3), Reputation (#4)
- **Quality-of-life**: Comfort (#5)
- **Bodily**: Physical safety / Health (#6)

A v2 expansion adds civic: Citizenship (#7).

## Three architectural paths (revised 2026-04-26)

### Path A — Re-derive from Q-S3 allocation surfaces *(rejected)*

Change `derived_from: ["Q-S1", "Q-S2"]` to `derived_from: ["Q-S3-close", "Q-S3-wider"]`. Items become Yourself / Family / Friends / Social life / Non-Profits & Religious / Companies.

**Verdict**: rejected. Q-S3's surfaces are categories of *where money goes*, not categories of *what cost-type the user would bear*. The framing — *"Would you reduce your money flow toward Non-Profits & Religious for this belief?"* — is awkward and doesn't match the cost-of-conviction register.

### Path B — Fixed canonical list at Q-I3 only *(superseded by Path C; was v1 recommended)*

*Decision flipped 2026-04-26: Jason chose Path C as v1, with the stakes ranked before Keystone for matrix-model consistency.*

The 6 items (per § Recommended canonical list above) appear at Q-I3 as the answer set. Not derived from any prior question. The user encounters them for the first time at Q-I3.

**Pros**:
- Question composes correctly. The verb *"would you risk losing"* matches the answer space of *concrete losses*.
- No new question added to the test flow.
- Items are recognizable enough that no pre-introduction is required.
- Shippable in CC-024 without architectural drift.

**Cons**:
- Breaks the matrix-model consistency Q-I2 has (Q-I2 cites the user's *own previously-named* trust sources back; Path B's Q-I3 cites a *canonical* list).
- The reflection is slightly less personalized — the report can say *"of these 6 cost categories, you marked..."* but not *"of YOUR top 3 stakes, you marked..."*

**Lean for v1**: yes. Framing-clarity gain is substantial; matrix-model loss is small.

### Path C — Compass Extension (Stakes ranking) → derived Q-I3 *(v1 chosen 2026-04-26)*

Add a new ranking question (provisional ID **Q-Stakes1**) inside the Compass card. The user ranks the 6-7 concrete-loss-domain items by importance to their life. Q-I3 then derives from the user's top-3 of that ranking.

The Compass card naturally extends from *abstract values* (Q-S1 / Q-S2 sacred ranking) to *concrete stakes* (Q-Stakes1 loss-domain ranking). Both registers cohabit in the heart-as-compass body part: what the heart loves abstractly + what the heart fears losing concretely. Symmetric to how CC-016 added Q-S3 / Q-E1 as Compass extensions for allocation.

**Where the new question lives architecturally**: as a Compass card extension, sitting alongside Q-S1, Q-S2, Q-S3-close, Q-S3-wider, Q-S3-cross. Probable position in the test flow: after the existing Q-S3 / Q-E1 allocation block, before the second-pass / Keystone transition. Fits the Compass card's story: *here are your sacred values; here is where your discretionary resources flow; here are your concrete stakes.*

**Pros**:
- Matrix-model consistency restored. Q-I3 cites the user's own ranked stakes back.
- The Compass card becomes more complete (covers both abstract-and-concrete protection).
- Useful for other cross-card patterns. e.g., a future cross-card pattern could match *"high Money in Q-Stakes + low costs-named in Q-I3"* as a coherence read.

**Cons**:
- Adds a new ranking question to the test flow (~3-5 minutes additional).
- Adds canonical surface (new question, new signals, new prose).
- Requires updating the Compass card's framing in canon docs.

**Sequencing**: lands in **CC-024 — Keystone Block Restructure** alongside Q-I1 reframing and Q-I3 redefinition. Single substantial CC; comparable in scope to CC-016 (Allocation Layer).

**Implementation surface for CC-024 (revised)**:

1. **Q-I1 reframing** — change question text to cost-bearing register (*"What is a belief you'd bear real cost to keep?"*).
2. **Q-Stakes1 — NEW Compass extension** — 5-item ranking, positioned after Q-E1-cross and before the second-pass / Keystone transition.
   - Items: Money / Financial security; Job / Career; Close relationships; Reputation; Physical safety / Health.
   - Card: `compass`. Type: `ranking`.
   - 5 signals emitted: `money_stakes_priority`, `job_stakes_priority`, `close_relationships_stakes_priority`, `reputation_stakes_priority`, `health_stakes_priority`.
3. **Q-I3 redefinition** — `derived_from: ["Q-Stakes1"]` instead of `["Q-S1", "Q-S2"]`. `derived_top_n_per_source: 3`. The user's top-3 stakes become Q-I3's checkbox items, plus None + Other.

**Files affected**:
- `data/questions.ts` — add Q-Stakes1; update Q-I3.
- `lib/identityEngine.ts` — `signalsFromRankingAnswer` already handles this (no new function needed); BeliefUnderTension construction updates to derive `cost_dimensions` from Q-Stakes1 + Q-I3.
- `lib/beliefHeuristics.ts` — `summarizeQI3Selections` updates to read from the Q-Stakes1-derived items.
- `lib/types.ts` — no major changes; new signal IDs added to the SignalId union.
- `app/page.tsx` — phase machinery (Q-Stakes1 sits in the test flow naturally; second-pass trigger boundary may shift if Q-Stakes1 lands between Q-E1-cross and the existing boundary).
- `docs/canon/question-bank-v1.md` — Q-Stakes1 entry; Q-I3 update.
- `docs/canon/signal-library.md` — 5 new signals.
- `docs/canon/keystone-reflection-rules.md` — BeliefUnderTension cost-dimensions update.
- `docs/canon/shape-framework.md` — Compass card framing extension.

**Boundary note for CC-022a interaction**: the second-pass trigger fires when `nextIdx === Q_I1_INDEX`. After Q-Stakes1 is added, Q_I1_INDEX shifts by 1. The boundary check still works (it's question_id-based, not position-based), but the trigger's "after Q-E1-cross" comment in the code needs updating to "after Q-Stakes1."

## Implementation surface (when this CC happens)

- `data/questions.ts` — Q-I3 redefined.
- `lib/types.ts` — possibly new question type if Path B (or extension of `multiselect_derived` to support canonical lists).
- `lib/beliefHeuristics.ts` — `analyzeBeliefSubmission` updates to consume the new Q-I3 shape.
- `docs/canon/keystone-reflection-rules.md` — Rule update reflecting the corrected Q-I3 architecture.
- `docs/canon/question-bank-v1.md` — Q-I3 entry rewritten.

## What stays the same

- Q-I2's cross-card derivation against Trust card (`derived_from: ["Q-X3", "Q-X4"]`) is correct and stays.
- Q-I1 / Q-I1b anchor mechanism stays.
- The "anchor + cross-card structured stress-test" architectural pattern stays — only Q-I3's cross-card target changes (or adds Path B layer).
- `belief_no_cost_named` MetaSignal still fires when Q-I3's None-of-these is selected.

## Sequencing

Defer until after:
- CC-022b lands (prose-layer work; doesn't depend on Q-I3 structure).
- Real-user testing surfaces whether Q-I3's current form actually produces useful or useless data across multiple sessions. Madison's session and Jason's session both hit this issue; if 3-5 more interviews echo it, the structural restructure is well-evidenced.

Probable label: **CC-024 — Q-I3 Cost-of-Conviction Restructure**. Sized similar to CC-017 (introduced the multiselect_derived primitive); this CC re-derives or replaces it.

## Worth flagging

This is a structural critique that the LLM rewrite analysis didn't surface — the rewrite glossed Q-I3's value_domain output as *"value_domain: Truth"* without questioning whether the question itself was coherent. Jason caught it in browser smoke by hitting the question himself and noticing the answer space refused the question's premise.

The architectural insight generalizes: **cross-card derivation works only when the verb of the new question composes with the semantics of the source card.** Q-I2 works because *"could revise"* composes with *"trust source."* Q-I3 fails because *"would risk losing"* doesn't compose with *"sacred value."* Future cross-card derivations should pass this composition check.
