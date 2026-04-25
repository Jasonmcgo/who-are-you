# Open Design Calls

Pre-canon deliberation. **All four sections were decided 2026-04-24** — see the "Decision (locked 2026-04-24)" block at the top of each section. The body text below those blocks is preserved as the deliberation record but is no longer authoritative; the locked decision is.

Pattern across all four locks: ranking with expanded option lists. Two sections (Q-S1/T-012, Q-C4/T-009) introduced new signals. Q-S1 split into Q-S1 + Q-S2 to keep each rank list at 4 items per the user's 4–5 cap.

The four locked decisions feed CC-005 (rank as canonical primitive — foundational), then CC-006 onward (per-question implementation). See bottom of file for the post-lock CC sequence.

---

## 1. Q-S1 / T-012 — Sacred Values Multi-Signal

### Decision (locked 2026-04-24)

**Option Jason — split Q-S1 into Q-S1 + Q-S2, both ranked, four items each.**

- **Q-S1** (sacred personal-conduct): rank Freedom / Truth / Stability / Loyalty.
  - Wording: *"Order these by what you'd protect first when something has to give."*
- **Q-S2** (sacred larger-than-self): rank Family / Knowledge / Justice / Faith.
  - Wording: *"Order these by which has the strongest claim on you."*

Both questions sit in the Sacred card. Each emits four ranked `*_priority` signals.

**Signal accounting:**

- Existing signals reused: `freedom_priority`, `truth_priority`, `stability_priority`, `family_priority`, `loyalty_priority` (loyalty becomes cross-card with Q-C2; `primary_cards` becomes `[conviction, sacred]`).
- New signals (status `unused` until tensions consume them): `knowledge_priority`, `justice_priority`, `faith_priority`.

**T-012 detection rule (final):** fires when at least two of the eight `*_priority` signals are ranked at position ≤ 2 across Q-S1 and Q-S2 combined. Strongest reading: top-1 in Q-S1 conflicting with top-1 in Q-S2 (e.g., Family ranked #1 in Q-S2 + Truth ranked #1 in Q-S1 = potential Family-vs-Truth conflict).

Implementation: blocks until CC-005 (rank as canonical primitive) lands. Then per-question CC.

### The problem

Q-S1 is single-choice forced. A user picks one option, producing one of four signals.

```
Q-S1
- question: If you could only protect one, which would it be?
- options:
  - Family
  - Freedom
  - Truth
  - Stability
- signals:
  - family_priority
  - freedom_priority
  - truth_priority
  - stability_priority
```

T-012 requires all four signals simultaneously to fire:

```
T-012 Sacred Value Conflict
Signals:
- family_priority
- freedom_priority
- truth_priority
- stability_priority
```

A single Q-S1 answer cannot satisfy T-012. T-012 is structurally unfireable.

### Why it matters

T-012 surfaces "the user holds multiple things sacred and life forces a tradeoff between them." Arguably the most important tension in the library — the one most likely to land emotionally for a user. Until Q-S1 (or T-012) changes, the product cannot detect this pattern.

### Option A — Ranked Q-S1

User ranks all four options 1–4. Engine emits all four signals, each tagged with rank.

Sample shape:

```
Q-S1
- question: Rank these in the order you would protect them (1 = most sacred, 4 = least):
- options (ranked):
  - Family
  - Freedom
  - Truth
  - Stability
- signals (with rank metadata):
  - family_priority (rank: n)
  - freedom_priority (rank: n)
  - truth_priority (rank: n)
  - stability_priority (rank: n)
```

T-012 detection rule: `at_least_two_signals_with_rank ≤ 2`. Fires whenever the user ranks two or more values in the top half.

**Pros.** Every user produces all four signals. Captures relative priority cleanly. Lets richer tensions emerge — e.g., a future T-XXX could fire on "the value the user ranks #2 conflicts with their behavior on Q-A1."

**Cons.** Ranking UI is harder than radio buttons, especially on mobile. Forces comparison across all four even when some feel obviously sacred and others obviously not. Some users will rank arbitrarily on the bottom half just to finish, polluting low-rank signal.

### Option B — Multi-select Q-S1

User picks 1–N from the four. Engine emits a signal for each selected.

Sample shape:

```
Q-S1
- question: Which of these would you protect, even at significant cost? (select all that apply)
- options (multi-select):
  - Family
  - Freedom
  - Truth
  - Stability
- signals:
  - family_priority (if selected)
  - freedom_priority (if selected)
  - truth_priority (if selected)
  - stability_priority (if selected)
```

T-012 detection rule: `count(*_priority signals) ≥ 2` → fire.

**Pros.** Simple UI, just checkboxes. Captures multi-sacred without forcing comparison. Lets the user honestly say "only one really" or "honestly, all four."

**Cons.** Loses priority info entirely. A user who picks all four is informationally identical to one who picks all four with very different intensities. Some users will check everything to be safe, polluting signal.

### Option C — Paired Q-S2

Keep Q-S1 unchanged. Add Q-S2 asking for the secondary value.

Sample shape:

```
Q-S1 (existing, unchanged)
- question: If you could only protect one, which would it be?
- options: Family / Freedom / Truth / Stability
- signals: family_priority / freedom_priority / truth_priority / stability_priority

Q-S2 (new)
- card_id: sacred
- type: forced
- question: And the next most important after that?
- options:
  - Family / Freedom / Truth / Stability
  - (the option chosen on Q-S1 is hidden)
- signals: family_priority_secondary / freedom_priority_secondary / truth_priority_secondary / stability_priority_secondary
```

Note: needs four new `*_priority_secondary` signals, OR Q-S2 emits the same `*_priority` signals as Q-S1 (in which case the engine sees two signals from the sacred card, which is enough to fire T-012 without new signal_ids). The simpler path is the latter — Q-S2 emits the same signal family.

T-012 detection rule: `count(distinct *_priority signals) ≥ 2` → fire.

**Pros.** Smallest delta to existing canon. Q-S1 stays untouched, Q-S2 is purely additive. UI stays radio-button. Captures the top-two cleanly.

**Cons.** Misses the "all four matter" case. Two questions instead of one. Q-S2's options need dynamic exclusion of the Q-S1 choice (mild UI logic). The user may resent being asked again right after a hard pick.

### Tradeoff summary

| | UI complexity | Captures priority | Captures multi-sacred | New signals needed |
|--|---|---|---|---|
| A: Ranked | High | Yes (full rank) | Yes (top 2) | No (just rank metadata) |
| B: Multi-select | Low | No | Yes (any subset) | No |
| C: Paired Q-S2 | Low | Partial (top two) | Partial (top two only) | No (or four secondary signals) |

### Recommendation

**Option C.** Smallest canon change, simplest UI, captures the most common case (top-two conflict). Edge case of "all four sacred" is rare enough to defer to v2. If the product truly needs all-four detection later, Option A is the right upgrade path.

---

## 2. T-004 — Institutional Question

### Decision (locked 2026-04-24)

**Option Jason — single Q-X3 ranked across 5 institutional categories, with Non-Profits and Religious organizations combined.**

- **Q-X3** (Context card): rank trustworthiness across **Government / Press / Employers / Education / Non-Profits & Religious organizations**.
- Single trustworthiness axis, highest to lowest.

The combine of Non-Profits with Religious organizations was chosen over dropping either: it captures the "civil society / voluntary mission-driven institutions" semantic group without losing trust-signal coverage.

**Signal accounting:** signal-shape is a CC-005-time call (per-category-with-rank vs. aggregated `institutional_*` signals). Three options on the table:
- (a) Five per-category signals each carrying rank metadata (e.g., `government_trust(rank: n)`); existing canonical `institutional_trust | institutional_skepticism | institutional_distrust` derived from aggregate position.
- (b) Five per-category signals + the three existing canonical institutional signals fired by aggregate average.
- (c) Only the three existing canonical signals, fired from majority across the five categories.

Recommendation (TBD at CC time): (a) — preserves per-category data and lets future tensions detect cross-category patterns (e.g., trusts Government but distrusts Press).

**T-004 detection rule (final):** fires when at least one canonical `institutional_*` signal is present and at least one canonical `authority_*` signal (Q-F1) is present and they diverge in valence (e.g., `authority_trust_high` from formation + `institutional_distrust` from current).

Implementation: blocks until CC-005 (rank primitive) lands. Then dedicated CC.

### The problem

T-004:

```
T-004 Formation vs Current Conviction
Signals:
- authority_trust_high OR authority_skepticism_moderate OR authority_distrust
- institutional_trust OR institutional_skepticism OR institutional_distrust
```

Left side comes from Q-F1 (childhood authority experience). Right side has three signals, **none of which any canonical question emits**. All three are dead references. T-004 cannot fire.

### Why it matters

T-004 surfaces the gap between formation (childhood authority) and current view (today's institutional trust). That gap is real — people who were formed in trust often arrive at skepticism; people who were formed in skepticism often arrive at measured trust. Without T-004 fireable, that interpretive surface is missing.

### Option A — Single Q-X3 institutional question

Add one new forced-choice question, structurally parallel to Q-F1's three-level scheme.

Sample shape:

```
Q-X3
- card_id: context
- type: forced
- question: Today, you generally view large institutions (governments, employers, the press) as:
- options:
  - Mostly trustworthy and necessary
  - Necessary but flawed and worth watching closely
  - Unreliable or untrustworthy
- signals:
  - institutional_trust
  - institutional_skepticism
  - institutional_distrust
```

T-004 fires immediately. Dead references become active.

**Pros.** Minimum addition. One question, three signals. Reuses Q-F1's three-level structure so the formation-vs-current comparison is structurally clean.

**Cons.** "Large institutions" is generic. A user with high trust in employers but distrust of the press has to pick a single answer — collapses real per-domain variation.

### Option B — Three sub-questions on specific institution types

Q-X3a (government), Q-X3b (employers / market), Q-X3c (press / information). Each is forced-choice with the same three trust-level options.

Sample shape:

```
Q-X3a — Today, you view government institutions as: Trustworthy / Skeptical / Distrustful
Q-X3b — Today, you view employers and markets as: Trustworthy / Skeptical / Distrustful
Q-X3c — Today, you view press and information sources as: Trustworthy / Skeptical / Distrustful
```

Three questions emit institutional_* signals. Engine could use majority across the three, or "any" for T-004 firing.

**Pros.** Captures real per-domain variation. Allows future tensions to detect "trusts government but distrusts press" — a pattern that's increasingly common and meaningful.

**Cons.** Three questions for one tension. Adds visible weight to the Context Card. Probably overkill for v1 unless per-domain variation is itself a product priority.

### Option C — Rewrite T-004 to use existing signals

Don't add a question. Change T-004's right side to use signals that already exist somewhere.

Candidate rewrites:
- `authority_*` × `freedom_priority OR order_priority` — reframes T-004 as "formation under authority compared to current orientation toward freedom/order."
- `authority_*` × `proactive_creator OR responsibility_maintainer OR reactive_operator` — reframes as "formation under authority compared to current operational mode."

**Pros.** Zero new questions.

**Cons.** T-004 is no longer about institutions. It becomes a different tension wearing T-004's name. The "formation vs current" framing is preserved but the *current* part now means something other than what canon claims it means.

### Recommendation

**Option A (single Q-X3).** Smallest addition that preserves T-004's original meaning. Generic-institutions framing is acceptable for v1. If per-domain variation becomes important, Option B is the upgrade path. Option C is the worst — it rewrites the tension while keeping its name, which is a form of hidden semantic drift.

The Q-X3 question text above is a first draft. Wording deserves your eye.

---

## 3. Q-C4 / T-009 — Responsibility Multi-Signal

### Decision (locked 2026-04-24)

**Option Jason — Q-C4 becomes ranked across 5 attribution sources.**

- **Q-C4** (Conviction card): rank **Individual / System / Nature / Supernatural / Authority**.
- Wording (TBD at CC time; will mirror the Sacred ranking voice).

**Signal accounting:**

- Existing signals reused: `individual_responsibility`, `systemic_responsibility`. Both gain rank metadata.
- `balanced_responsibility` becomes `deprecated` — the "Both equally" option goes away; the balanced state is now expressed as two signals ranking comparably high.
- New signals (status `unused` until tensions consume them):
  - `nature_responsibility` — attribution to impersonal forces, randomness, biology, the way things are.
  - `supernatural_responsibility` — attribution to divine, karmic, or cosmic agency.
  - `authority_responsibility` — attribution to leaders / decision-makers wielding power within structures (distinct from `systemic_responsibility`, which is about the structure itself).

**Naming flag for CC-005 time:** `authority_responsibility` is namespace-adjacent to the existing `authority_*` family from Q-F1 (`authority_trust_high`, `authority_skepticism_moderate`, `authority_distrust`), which measure formative-experience trust in authority figures. The new signal measures blame-attribution to those who wield authority — a different concept. Disambiguating name proposal: `authority_attribution` instead of `authority_responsibility`. Final naming TBD when the CC drafts.

**T-009 question (locked: Option a):** T-009 stays canonically scoped to Individual + System. Fires when both `individual_responsibility` and `systemic_responsibility` rank at position ≤ 2. The other three attribution signals (`nature_*`, `supernatural_*`, `authority_*`) produce signals that remain `unused` until future tensions consume them. New tensions on Causal vs Cosmic, Self vs Authority, Reason vs Faith are deferred until live data shows what users actually rank.

Implementation: blocks until CC-005 (rank primitive) lands. Then dedicated CC.

### The problem

Same shape as Q-S1/T-012.

```
Q-C4 (canonical)
- question: When something goes wrong, responsibility lies mostly with:
- options:
  - The individual
  - The system
  - Both equally
- signals:
  - individual_responsibility
  - systemic_responsibility
  - balanced_responsibility
```

```
T-009 Individual vs System Responsibility
Signals:
- individual_responsibility
- systemic_responsibility OR balanced_responsibility
```

Q-C4 is single-choice. T-009 needs `individual_responsibility` AND something else. Cannot fire from a single Q-C4 answer.

### Why it matters

T-009 surfaces the recognition that most thoughtful adults hold both individual and systemic frames simultaneously — they assign accountability to people *and* recognize that systems shape outcomes. The current Q-C4 forces them to flatten that complexity into one pick. The mismatch is a small but visible canon bug.

### Option A — Multi-select Q-C4

Drop "Both equally" as a separate option. Make it a multi-select with two options.

Sample shape:

```
Q-C4
- question: When something goes wrong, responsibility usually lies with: (select all that apply)
- options (multi-select):
  - The individual
  - The system
- signals:
  - individual_responsibility (if checked)
  - systemic_responsibility (if checked)
```

`balanced_responsibility` becomes implicit when both are checked, OR the engine emits it as a derived signal when both other signals are present. Cleaner: drop `balanced_responsibility` from the canon entirely and detect "balanced" as the conjunction.

T-009 detection: `individual_responsibility AND systemic_responsibility` → fire.

**Pros.** Smallest change. Captures the most common real pattern ("yes, both"). T-009 fires whenever the user holds both frames.

**Cons.** Loses the user who specifically holds a balanced view distinct from holding both views — though that distinction is arguably a phantom anyway. Drops `balanced_responsibility` signal, which would need a status change in `signal-library.md` (`unused` → `deprecated` or removal entirely if no code references it).

### Option B — Q-C4 + Q-C4b degree

Keep Q-C4 single-choice. Add a follow-up that captures the strength of conviction.

Sample shape:

```
Q-C4 (existing): When something goes wrong, responsibility lies mostly with: Individual / System / Both equally

Q-C4b (new): How strongly do you hold that view?
- Strongly — the other side is mostly excuse-making
- Moderately — but I see the other side has weight
- Weakly — I lean this way but acknowledge the other holds significant weight
```

Engine emits the Q-C4 signal at high strength on "Strongly," at medium on "Moderately," and emits BOTH signals (Q-C4 + the opposite frame's signal) at lower strength on "Weakly."

T-009 fires when both signals are present, which now happens for any "Weakly held" answer.

**Pros.** Captures the "I lean X but acknowledge Y" pattern that's the most common real position. Preserves priority info (which option is dominant).

**Cons.** Two questions for one card slot. Introduces a strength concept the rest of the system doesn't currently use (signal `strength` field exists but is hardcoded `medium` everywhere — would need broader change).

### Option C — Rewrite T-009 to fire from any single Q-C4

Make T-009 fire based on a Q-C4 signal combined with some other card's signal — turning T-009 into a cross-card tension instead of a within-Conviction tension.

Same critique as T-004 Option C. T-009 stops being about Individual vs System; it becomes something else with the same name.

### Option D — Q-C5: what the OTHER side argues

Pair Q-C4 with an adaptive follow-up.

Sample shape:

```
Q-C5: Even if you mostly hold the view above, the OTHER frame also has merit when…
- (options dynamically generated based on Q-C4 answer)
```

E.g., if Q-C4 = "Individual," Q-C5 offers system-side concessions: "When the system has stacked the deck" / "When generational disadvantage is real" / "Never — individual responsibility holds always." If a non-"Never" option is picked, emit a softer `systemic_responsibility` signal alongside the dominant `individual_responsibility`.

**Pros.** Captures genuine intellectual humility, the "yes but" pattern, real-world ambivalence.

**Cons.** Adaptive question content adds engineering. UX may feel like the system is arguing with the user. Probably the most accurate but the most expensive option.

### Tradeoff summary

| | Questions | Captures priority | Captures multi-frame | Engine complexity |
|--|---|---|---|---|
| A: Multi-select | 1 | No | Yes | Lowest |
| B: Q-C4 + degree | 2 | Yes (degree) | Partial | Medium |
| C: Rewrite T-009 | 1 (unchanged) | n/a | n/a (different tension) | Lowest, but tension drift |
| D: Q-C5 OTHER side | 2 (adaptive) | Partial | Yes | Highest |

### Recommendation

**Option A.** Same logic as Q-S1 Option C — smallest delta, captures the canonical intent. The lost "Both equally" option is a phantom distinction; users who hold the balanced view will check both boxes, which the engine treats as the same thing structurally and which is what T-009 is actually trying to detect.

`balanced_responsibility` signal goes from `unused` to `deprecated` (or gets removed if no code references it). Worth a separate small CC if pursued.

---

## 4. Temperament Question Set — Sketch

### Decision (locked 2026-04-24)

**Option Jason — 8 ranked questions, 4-option rankings, voice-styled statements.**

The user's design substantially improves on the original 16-question sketch below. Each Temperament question presents four voice-styled statements — each statement written in the register of one cognitive function — and the user ranks them by self-recognition rather than introspective metacognition.

**Structure:**

- **Q-T1–T4: Perceiving functions** (Ni / Ne / Si / Se). Each question presents four voice-styled statements (one per function) under a different scenario. User ranks 1–4.
- **Q-T5–T8: Judging functions** (Ti / Te / Fi / Fe). Same structure under judging-function scenarios.

Across the 8 questions, each function is ranked against its three peers four times. Aggregate rank determines the dominant function for each pair (perceiving and judging). Auxiliary is determined by the canonical attitude rule (introvert/extravert alternation) plus category rule (perceiving/judging alternation). Stack derives MBTI 4-letter type via the Canonical Stack Table in `temperament-framework.md`.

**Voice convention** (each function speaks in its native register):

- **Ni** — convergent future-projection. "Once I see how the pieces are going to land, the rest is just execution."
- **Ne** — divergent possibility-generation. "There are at least four interesting angles here. I want to try each before settling."
- **Si** — continuity and precedent. "Let me check what's worked before in similar situations — there's usually precedent."
- **Se** — present-moment responsiveness. "I just want to start, see what comes up, and respond to what's actually in front of me."
- **Ti** — internal logical refinement. "There's a flaw in the underlying logic. I want to find it before changing anything."
- **Te** — external goal-driven execution. "We need to change what's being done now to hit the target. Diagnose later."
- **Fi** — value-rooted authenticity. "This isn't aligned with what I actually believe is right. Something's off at a deeper level."
- **Fe** — relational harmony. "The team's getting frustrated. We need to address that before the plan can recover."

**Voice-quality guardrail (locked 2026-04-24).** Each function must sound **competent and plausible** in its own register. No straw-man options. The signal comes from priority order — from the user recognizing which voice most sounds like them — not from making three of the four voices obviously weaker. Specifically:

- Ni must not sound mystical or prophetic.
- Ne must not sound scatterbrained.
- Si must not sound rigid or nostalgic.
- Se must not sound impulsive or shallow.
- Ti must not sound pedantic or cold.
- Te must not sound controlling or sociopathic.
- Fi must not sound precious or self-absorbed.
- Fe must not sound needy or self-abnegating.

The user should feel like they are reading four inner voices and ordering which ones sound most like them — not taking a psychology exam. Every statement should be one a competent person using that function would actually say.

**Resolutions of the four originally-open Temperament picks:**

1. **Question count: 8.** ✓ (User locked 2026-04-24.)
2. **"Can't choose" on dominant probes:** moot. No separate dominant-identification questions exist in this design — ranking handles dominant identification across all 8 questions. A `decision_friction` signal may still fire if the user can't rank, design TBD at CC time.
3. **Inferior-grip block (Q-T11/T12 in old sketch):** dropped. Stack derivation already identifies the inferior via the Canonical Stack Table; no separate cross-validation needed. Saves two questions and removes the most psychometrically blunt part of the original sketch.
4. **Tone reference:** each option's voice is self-defining — the function speaks in its own register. Question framing (the scenario header) stays plain. Voice work is in the option statements, not the prompts.

**Signal family update for `temperament-framework.md`:** the original 24-signal family (`{function}_{position}` with position ∈ dominant / present / inferior) likely simplifies under this design. Each function now produces a per-question rank signal (e.g., `ni(rank: n, source_question: Q-Tn)`); aggregate rank across the four questions a function appears in resolves stack position. Final signal-shape decision is a CC-005 / CC-009 time call. The canon framework doc may need a small revision to authorize per-function rank-aware signals as the Temperament canonical signal family. Flag for CC time.

**Tension hooks (Temperament × Pressure / Agency / Context / Role)** described in `temperament-framework.md` remain authorized — they consume cognitive-function signals regardless of how those signals get emitted (rank-aware or position-typed). Implementation of those tensions stays deferred to a later CC.

**Implementation sequencing:**

1. CC-005 — rank as canonical primitive (foundational, blocks everything else).
2. The Temperament CC follows the per-question CCs for Sacred / Institutional / Responsibility, since voice-statement drafting benefits from at-rest review and the ranked primitive will already be exercised by the simpler cases.
3. Voice statements: I (Cowork chat) draft v1 of all 32 voice statements + 8 scenario headers, user iterates in chat before they go into the CC.

### Sketch (preserved as deliberation record — superseded by the locked decision above)

The 16-question sketch below is preserved as the working set that informed the decision. It is not the implementation target.

You don't need options here, you need a **sketch of what 12–16 cognitive-function questions might look like** so you can react to texture and signal mapping before any CC is drafted.

Below is a working set of 16 questions per `temperament-framework.md` Question Design Principles. None of this is final wording. The point is to make the shape concrete.

### Block 1 — Function dichotomy probes (Q-T1 through Q-T8)

Two questions per function pair. Each emits `{function}_present` (stack-position resolution comes later in the session).

**Ni vs Ne — pattern direction**

```
Q-T1
- question: When you're working through something complex, you tend to:
- options:
  - Sit with it until one interpretation feels right → ni_present
  - Generate many possibilities and test each → ne_present
  - Can't choose → decision_friction
```

```
Q-T2
- question: An idea you can't quite articulate has been nagging at you. You're more likely to:
- options:
  - Wait for it to crystallize on its own → ni_present
  - Try a dozen angles to see which one cracks it open → ne_present
  - Can't choose → decision_friction
```

**Si vs Se — sensory direction**

```
Q-T3
- question: When entering a new environment, you first:
- options:
  - Compare it to similar ones you've known → si_present
  - Take in what's actually present right now → se_present
  - Can't choose → decision_friction
```

```
Q-T4
- question: When learning a new physical skill, you tend to:
- options:
  - Reference how you've learned similar things before → si_present
  - Pay attention to what your body is doing in this specific moment → se_present
  - Can't choose → decision_friction
```

**Ti vs Te — thinking direction**

```
Q-T5
- question: When a plan isn't working, your first instinct is to:
- options:
  - Examine whether the plan's underlying logic was sound → ti_present
  - Change what's being done to hit the target → te_present
  - Can't choose → decision_friction
```

```
Q-T6
- question: A coworker proposes a solution that almost-but-not-quite makes sense. You tend to:
- options:
  - Identify exactly where the reasoning breaks → ti_present
  - Push for what would actually work and ship it → te_present
  - Can't choose → decision_friction
```

**Fi vs Fe — feeling direction**

```
Q-T7
- question: When a close person does something you disagree with, the first thing you notice is:
- options:
  - Whether it conflicts with what you fundamentally value → fi_present
  - How it's affecting others around them → fe_present
  - Can't choose → decision_friction
```

```
Q-T8
- question: In a meeting, when the group is heading toward a decision you disagree with, you:
- options:
  - Stay quiet because the principle isn't worth the friction, but it bothers you → fi_present
  - Speak up because the group is about to make a mistake that affects everyone → fe_present
  - Can't choose → decision_friction
```

### Block 2 — Dominant identification (Q-T9, Q-T10)

These force a four-way pick. No "Can't choose" — these questions ask for natural pull, where ambivalence isn't usefully informative.

```
Q-T9
- question: Of these four kinds of work, which energizes you most?
- options:
  - Connecting disparate ideas into a single big-picture insight → ni_dominant
  - Throwing out lots of fresh angles on a problem → ne_dominant
  - Knowing the field's history and applying what's already proven → si_dominant
  - Reading the room and acting in the moment → se_dominant
```

```
Q-T10
- question: Of these four kinds of work, which energizes you most?
- options:
  - Building precise frameworks that hold up under scrutiny → ti_dominant
  - Driving a project to a measurable outcome → te_dominant
  - Holding to what you personally believe is right → fi_dominant
  - Maintaining the wellbeing and harmony of a group → fe_dominant
```

The session's dominant function is the one identified in either Q-T9 or Q-T10 — whichever block the user picks from. The other block then identifies the auxiliary's *category* (perceiving vs. judging).

### Block 3 — Inferior probes / cross-validation (Q-T11, Q-T12)

The inferior is determined by the dominant (per the canonical stack table). Asking about the inferior validates the dominant.

```
Q-T11
- question: Under sustained pressure, you may notice yourself:
- options:
  - Reaching for sensory escape (eating, drinking, hard physical activity) you wouldn't normally choose → se_inferior (Ni-dom grip)
  - Fixating on body sensations or past details in a way you usually don't → si_inferior (Ne-dom grip)
  - Building catastrophic future scenarios you rarely build otherwise → ne_inferior (Si-dom grip)
  - Reading dark hidden meanings into ordinary signs → ni_inferior (Se-dom grip)
  - None of these / can't choose → decision_friction
```

```
Q-T12
- question: When stressed enough that your usual style breaks down, you may:
- options:
  - Lash out emotionally or seek validation in ways that feel out-of-character → fe_inferior (Ti-dom grip)
  - Have a personal-value meltdown / "nobody understands me" → fi_inferior (Te-dom grip)
  - Become rigidly controlling, obsessively task-listing, harsh on others → te_inferior (Fi-dom grip)
  - Withdraw into cold logic and devalue people you care about → ti_inferior (Fe-dom grip)
  - None of these / can't choose → decision_friction
```

### Block 4 — Auxiliary identification (Q-T13, Q-T14)

```
Q-T13
- question: Your dominant style above tends to be supported most by:
- options (six):
  - Tying things back to what's been done → si_present
  - Watching what's happening in the room right now → se_present
  - Logic and framework → ti_present
  - Action and execution → te_present
  - Personal conviction → fi_present
  - Group attunement → fe_present
```

```
Q-T14
- question: When your dominant style is operating well, the steady second-voice in your head is more like:
- (same six options, phrased differently — triangulation)
```

### Block 5 — J vs P (Q-T15, Q-T16)

```
Q-T15
- question: When working on a plan and new information arrives mid-stream, you prefer to:
- options:
  - Revise the plan now to incorporate it → P-leaning
  - Stick with the plan; consider the new info later → J-leaning
  - Can't choose → decision_friction
```

```
Q-T16
- question: Your day generally feels better when:
- options:
  - Most things are decided early so you can execute → J-leaning
  - Most things stay open so you can respond to what comes up → P-leaning
  - Can't choose → decision_friction
```

### What the engine does with these 16

1. Dichotomy probes (Q-T1–T8) establish each function's relative strength.
2. Dominant identification (Q-T9, Q-T10) names the dominant function directly.
3. Inferior probes (Q-T11, Q-T12) cross-validate the dominant via its inferior partner.
4. Auxiliary identification (Q-T13, Q-T14) names the auxiliary.
5. J/P probes (Q-T15, Q-T16) anchor the closure preference.
6. Stack resolution: dominant + auxiliary + J/P → MBTI 4-letter type via the Canonical Stack Table in `temperament-framework.md`.

### Risks visible from this sketch

- **16 is a lot.** Adds substantial weight to the question bank. If this proves too heavy, the dichotomy probes (Q-T1–T8) could collapse to four (one per pair) for a 12-question set. Trades cross-validation for brevity.
- **Inferior-grip probes are blunt.** Real grip behavior is subtle and self-recognition is hard. Q-T11 and Q-T12 may produce noisy signals — users may pick whichever option *sounds* most relatable rather than the one that's actually them.
- **No "Can't choose" on dominant identification (Q-T9, Q-T10).** This is intentional per `temperament-framework.md` Question Design Principles, but it forces users who genuinely don't have a strong dominant to pick one anyway. Worth your call: should those questions also allow `decision_friction`?
- **Phrasing assumes self-awareness.** May not work for users who haven't done much introspective work. Earlier blocks (T1–T8) are more behaviorally framed and probably hold up better than the inferior-grip block.
- **Validation gap.** Cognitive-function questionnaires are notoriously hard to validate against external instruments. If psychometric soundness matters, a separate validation pass (probably its own CC, comparing this set's MBTI output against an established instrument like Sakinorva or the official MBTI) is needed before relying on results.

### What this sketch is not

- Not final question text. Each item needs editing for tone, clarity, and product voice.
- Not a CC prompt. This is design draft. The CC that adds Temperament to `question-bank-v1.md` is downstream.
- Not validated. See risks above.

### Decision asks for the Temperament block

When you decide on this set, please call:

1. **Question count.** 16 (this sketch), or 12 (drop dichotomy probes to one per pair), or somewhere in between?
2. **"Can't choose" on Q-T9 / Q-T10?** Currently absent. Allow it?
3. **Inferior-grip block (Q-T11, Q-T12) — keep or drop?** They're cross-validation, not new info. Cuttable for brevity if the dichotomy + dominant questions are deemed sufficient.
4. **Phrasing pass.** Whose voice does the wording need to match? If you have an existing tone reference (a section of canon, a published piece you wrote), point me at it and I'll edit toward that voice when the CC is drafted.

---

## Post-lock CC sequence

All four sections locked 2026-04-24. CC drafting proceeds in the order below. Each CC is authored in the Cowork chat per `AGENTS.md` cc-workflow.

1. **CC-005 — Rank as canonical primitive.** Foundational. Adds `ranked` question type, `rank` field on Signal, rank-aware tension grammar, signal-mapping-rule and signal-and-tension-model updates, signal-library schema extension, UI support for ranked questions. No per-question changes. Blocks everything below.
2. **CC-006 — Q-S1 + Q-S2 split (Sacred ranked).** Implements Section 1 lock. Introduces three new signals (`knowledge_priority`, `justice_priority`, `faith_priority`); promotes `loyalty_priority` to cross-card; updates T-012 detection to rank-aware semantics.
3. **CC-007 — Q-X3 ranked institutional.** Implements Section 2 lock. Adds 5-category ranked institutional question. Resolves T-004 from dead-reference to active. Decides per-category vs aggregate signal shape.
4. **CC-008 — Q-C4 ranked attribution (5 sources).** Implements Section 3 lock. Adds three new signals (`nature_responsibility`, `supernatural_responsibility`, `authority_responsibility` or `authority_attribution`); deprecates `balanced_responsibility`. Updates T-009 detection to rank-aware semantics.
5. **Voice-statement drafting (chat, not a CC).** I draft v1 of the 32 voice statements + 8 scenario headers for Temperament. User iterates in chat. Output is reviewed copy ready for CC-009.
6. **CC-009 — Temperament question set.** Implements Section 4 lock. Adds 8 ranked Temperament questions, voice-styled options, function-strength rank signals, MBTI surface label derivation per the Canonical Stack Table.

After CC-009 completes, this document can be archived (`docs/archive/`) or deleted. Its locked decisions will already be canonical via the CCs.

## How to use this document (post-lock)

This document is now a record of decisions made, not an open deliberation surface. The "Decision (locked 2026-04-24)" block at the top of each section is authoritative. The body text below those blocks (the original options, recommendations, sketches) is preserved as the deliberation record but is no longer load-bearing.

If a locked decision needs to change, the change goes through a fresh CC, not by editing this document.
