# v2.5 Product Direction — Universal-Three Restructuring

**Status update (2026-04-28):** The principle described in this memo's "The principle" section has been canonized as of CC-030 (`card-schema.md` § Question Types and `question-bank-v1.md` § Ranking Question Schema). The Q-X3 and Q-X4 restructure work follows in CC-031 and CC-032. Q-C4's status as the canonical 5-item exception and Q-T1–Q-T8's status as the canonical four-default-at-scale example are both now in canon. This memo's directional intent for Q-X3 (multi-stage public + information-and-commercial split, Social Media addition, Government / Press / Companies disaggregation) and Q-X4 (relational / chosen split, outside-expert addition) remains memo-only — those are CC-031 and CC-032's scope.

**Status:** Design memo. Not yet implementation. Captures the structural ranking-architecture work identified in the design-jam between Jason and Clarence (2026-04-26). Sits between CC-016 (Allocation Layer) and the v2 Coherence Engine work.

**Audience:** Future CC authors who will scope the Q-X3 / Q-X4 restructure CCs. Plus any product-direction conversation that needs to know why the engine's ranking primitives are converging on a specific shape.

**Relationship to existing canon:** The "3-minimum / 4-default / 5-maximum" principle described here is not yet canonized. The current Ranking Question Schema (`question-bank-v1.md` § Ranking Question Schema) caps items at 4 or 5 and forbids 6+. v2.5 work formalizes *why* that cap exists, names the default, and adds a multi-stage (parent → parent → cross-rank) pattern as the standard answer when a domain requires more than five items of resolution. Q-S3 and Q-E1 (CC-016) are the first canonical instances of that pattern. Q-X3 and Q-X4 are the next.

---

## The principle

The engine's ranking primitive is doing a specific cognitive job: forcing the user to resolve which of N items wins when they're in real competition. That job has a hard upper bound on items.

Below three, ranking collapses into a forced-choice — there's not enough resolution to learn anything ranking-shaped. Above five, the user stops resolving and starts approximating. The middle of the list becomes noise. Cognitive load swamps the signal the engine was trying to read.

The empirically-defensible band, validated through the 8-card iteration cycles and confirmed by Michele's test session, is:

- **3 items minimum** — Below this, prefer forced-choice or another primitive entirely. A ranking of 2 is a forced-choice in disguise.
- **4 items default** — The shape that produces the cleanest aggregate signal across the broadest user population. Standard for Q-S1, Q-S2, Q-X4 (after restructure), Q-T1–Q-T8, the new Q-S3-close / Q-S3-wider / Q-E1-outward / Q-E1-inward parent rankings, and all cross-ranks.
- **5 items maximum** — Acceptable when the domain genuinely requires that resolution and no clean way exists to split it into two parents. Tolerable; not preferred.
- **6+ items** — Not supported by the primitive. Forbidden in canon. When a domain needs more than five items, restructure into the multi-stage pattern.

**The principle, in canonical form:**

> *Three minimum, four default, five maximum. Above five, restructure.*

This is the first new line entering canon as part of v2.5 (target file: `card-schema.md` § Question Types, with cross-reference from `question-bank-v1.md` § Ranking Question Schema).

---

## The multi-stage pattern

When a domain genuinely contains more than five items of resolution, the engine does not ask the user to rank seven or eight things at once. It splits the domain into two parent groups, each ranked separately at 3-or-4 items, then asks the user to resolve the top picks of each parent against each other in a derived cross-rank.

Q-S3 and Q-E1 are the first canonical instances:

- Q-S3-close (3 items, parent) + Q-S3-wider (3 items, parent) → Q-S3-cross (4 items, derived from top-2 of each parent)
- Q-E1-outward (3 items, parent) + Q-E1-inward (3 items, parent) → Q-E1-cross (4 items, derived from top-2 of each parent)

Architectural properties of the pattern:

1. **Each parent stays at 3 or 4 items.** The user never sees more than 4 things to rank in a single panel.
2. **The cross-rank is always 4 items** — top-2 of each parent. That fixes the cross-rank shape regardless of parent size.
3. **Parent rankings emit signals with `rank` 1..N.** Cross-ranks emit cross-rank signals (`cross_rank` 1..4) using the same signal IDs as the parents. This gives the engine a clean, separable view of: *what the user picked in isolation* versus *what the user picked when forced to resolve across the wider domain*.
4. **The cross-rank does not carry the aspirational overlay.** Only parent rankings do. The cross-rank reads pure resolved-priority direction; the overlay reads stated-vs-aspired posture per category, which only makes sense at the parent level where each category is fully visible.
5. **Parents may carry domain-specific overlays.** Q-S3 / Q-E1 parents carry the three-state aspirational overlay (`wish_less` / `right` / `wish_more`). Q-X3 parents may or may not — design TBD per the v2.5 CC.

This is the **multi-stage ranking pattern**. Once it's canonized in `question-bank-v1.md`, future questions that need this architecture (e.g., a future Q-X5 or a v3 cultural-context ranking) can reference the pattern by name rather than rebuilding the architecture each time.

---

## Q-X3 — Institutional Trust restructure

**Current canonical state** (`question-bank-v1.md` § Q-X3): one ranking, 5 items: Government, Press, Companies, Education, Non-Profits & Religious. Glosses locked 2026-04-25.

**What the design jam surfaced:** the 5-item form is a compromise that loses signal in three specific places.

1. **"Government" is doing two jobs.** A user trusts elected representatives and the legislative apparatus very differently from how they trust the on-the-ground services of government (DMV, public schools, water authority, social security administration, the local cops). Lumping the two into one ranking forces the user to average a posture that the engine should be able to read separately.
2. **"Press" is doing two jobs.** A user trusts individual journalists and the discipline of journalism differently from how they trust the news organizations and outlets that distribute and shape that journalism. The first is craft-level; the second is institutional-level. They can move opposite directions in the same person — high trust in *journalism* + low trust in *news organizations*, or vice versa — and that pattern is informative.
3. **"Companies" is doing two jobs.** Trust in small / private / closely-held businesses versus large / public / publicly-traded companies pulls different priors in most users. The current single-item form averages them; the engine should be able to read the gap.
4. **Social Media is missing entirely.** It's not Press, not Companies, not Education, not Government. It's its own institutional category in the contemporary trust landscape, and any institutional-trust reading that omits it leaves a hole that anyone testing the model will immediately notice.

**v2.5 directional intent:**

Restructure Q-X3 into the multi-stage pattern:

- **Q-X3-public** (parent): public-mission and civic institutions. Item composition is the design question the v2.5 CC will resolve, but the directional set captured in the jam is some subset of: Government-Elected, Government-Services, Education, Non-Profits, Religious. Likely 4 items after consolidation; possibly 5 if Government-Elected and Government-Services both warrant separate rows alongside Education, Non-Profits, and Religious.
- **Q-X3-information-and-commercial** (parent): commercial and information-distribution institutions. Directional set: Journalism, News-organizations, Social Media, Small / Private Business, Large / Public Companies. Likely 4 items after consolidation; possibly 5.
- **Q-X3-cross** (derived): 4 items, top-2 of each parent, resolved priority.

**Open design questions for the v2.5 CC:**

- Which Government distinction (Elected vs Services) is sharp enough to warrant its own item, and which is the user-recognizable label.
- Whether Non-Profits and Religious stay combined (current canonical "Non-Profits & Religious") or split. If split, whether they fit in the public group or the information-and-commercial group.
- Whether Social Media goes in the information group or the commercial group. (Argument for information: that's how users encounter it. Argument for commercial: that's what it actually is.)
- Whether the 5-item form is acceptable for one of the parents to preserve a needed split that doesn't fit into 4. The "five maximum" principle says yes — but the design jam preferred clean 4+4+4 if achievable.
- Glosses for every new item (the locked 2026-04-25 glosses cover only the current 5-item form).

The v2.5 CC will resolve those questions in dialogue with Jason. This memo's job is to capture the *architectural shape* — multi-stage, 4+4+4 (or 4+5+4 / 5+4+4 if necessary), parents emit standard institutional-trust signals, cross-rank emits cross-rank signals with `cross_rank` 1..4 — not to commit to a specific item list.

**Signal-library implications:**

The current institutional-trust signals (`government_trust_priority`, `press_trust_priority`, `companies_trust_priority`, `education_trust_priority`, `nonprofits_religious_trust_priority`) are all rank-aware per the canonical signal-mapping rule. Splitting Government, Press, and Companies into multiple items introduces new signal IDs (e.g., `government_elected_trust_priority`, `government_services_trust_priority`, `journalism_trust_priority`, `news_organizations_trust_priority`, `small_business_trust_priority`, `large_companies_trust_priority`, `social_media_trust_priority`). The five legacy signal IDs become deprecated in favor of the disaggregated set; T-001 and any other tensions consuming the legacy IDs need a rewrite as part of the v2.5 work.

---

## Q-X4 — Personal Trust restructure

**Current canonical state** (`question-bank-v1.md` § Q-X4): one ranking, 5 items: A spouse or partner, A close friend, Family, A mentor or advisor, Your own counsel. Glosses locked verbatim in `shape-framework.md` § Card 5.

**What the design jam surfaced:** Q-X4 has one structural gap and one resolution problem.

1. **"Outside-expert" is missing.** A therapist, doctor, lawyer, financial advisor, coach — the trusted-professional category. A user with strong outside-expert trust posture (and weak family / partner posture) is a real and common pattern. The current 5-item Q-X4 forces that user to spread their expert trust into "mentor or advisor" or compress it into "own counsel," neither of which captures it.
2. **Five items is at the principle's ceiling.** The canon's stated cap. Adding a sixth item without restructuring violates the principle — *six is forbidden*. The rule applies to Q-X4 as much as to Q-X3.

**v2.5 directional intent:**

Restructure Q-X4 into the multi-stage pattern with the new sixth item:

- **Q-X4-relational** (parent, 3 items): the entanglement-based trust group — Spouse-or-partner, Family, Close friend.
- **Q-X4-chosen** (parent, 3 items): the chosen / professional / self trust group — Mentor or advisor, Outside expert (therapist / doctor / lawyer / coach / clergy), Your own counsel.
- **Q-X4-cross** (derived, 4 items): top-2 of each parent, resolved priority.

The relational / chosen split is the cleanest cut the design jam found. Relational trust is a function of *who knew you before this version of you, who is entangled with the rest of your life*. Chosen trust is a function of *whose judgment you have selected for, often through paying for it or seeking it*. The two cluster differently in real users: low-relational + high-chosen reads as a user with strong professional support and weak intimate ties; high-relational + low-chosen reads as a user with strong intimate fabric and reluctance to seek outside expertise. Neither is a value judgment; both are informative.

**Signal-library implications:**

Five existing signals (`partner_trust_priority`, `friend_trust_priority`, `family_trust_priority`, `mentor_trust_priority`, `own_counsel_trust_priority`) survive. One new signal: `outside_expert_trust_priority`. Cross-rank emits the same signal IDs with `cross_rank` 1..4. Existing tension catalog (T-002 if it consumes these — check current signal consumers) may need a light rewrite to handle the rank-aware form, depending on what it currently expects.

**On the deferred per-item "doesn't apply" affordance:** `shape-framework.md` § Deferred currently parks "doesn't apply" handling to v2. The multi-stage form gives that affordance a natural home — at the parent level, where the user can mark e.g. partner as "doesn't apply" before ranking the remaining items. Whether to ship "doesn't apply" alongside the v2.5 restructure or after is a sequencing call for the v2.5 CC, not architectural.

---

## Q-C4 — the canonical exception

**Current canonical state** (`question-bank-v1.md` § Q-C4): one ranking, 5 items: Individual, System, Nature, Supernatural, Authority. Locked at umbrella level in `shape-framework.md` § Card 4 (Gravity). Glosses verbatim from `docs/option-glosses-v1.md` § Q-C4.

Q-C4 is the lone canonical 5-item ranking that does *not* restructure into a multi-stage form. The five attribution categories (Individual / System / Nature / Supernatural / Authority) do not split cleanly into two parents — they are, in a real sense, five distinct ontological frames for where responsibility lives, and forcing them into two groups would smear a distinction the question is specifically trying to surface (System as structural-impersonal versus Authority as structural-personal, for instance, only reads cleanly when both are visible at once).

The five-maximum principle was designed to permit exactly this kind of case. Q-C4 sits at the ceiling, deliberately, because the alternative loses signal.

**v2.5 documentation work:** Q-C4's status as the canonical exception is captured in `question-bank-v1.md` § Q-C4 trailing note. The note should be expanded as part of v2.5 to explicitly reference the new "three-min / four-default / five-max" principle and name Q-C4 as the deliberate ceiling case, so future CCs don't reflexively try to restructure it.

---

## Q-T — already canonical

**Current canonical state** (`question-bank-v1.md` § Q-T1–Q-T8): eight rankings, four items each. The four-voice voice-styled rows (A / B / C / D) carry the function signals (`ni`, `ne`, `si`, `se`, `ti`, `te`, `fi`, `fe`); the user ranks each scenario 1–4 by self-recognition. Aggregate rank across each function's four appearances produces the stack per `temperament-framework.md` § 4.

Q-T is already at the four-default canonical form. No restructure required for v2.5. The Q-T item count (four) matches the principle precisely; the eight-question structure is the design choice that gives the engine adequate observation depth without piling items into any single ranking.

The v2.5 documentation work for Q-T is small: ensure the Q-T1–Q-T8 trailing notes (which already explain the four-voice scheme) cross-reference the new principle so future readers see Q-T as the canonical example of the four-default at scale.

---

## Implementation sequencing

The v2.5 work happens *after* CC-016 (Allocation Layer) ships, because CC-016 establishes the multi-stage pattern in canon for the first time. The pattern needs to exist as a working primitive before Q-X3 / Q-X4 inherit it.

Suggested ordering:

1. **CC-016 ships first.** Q-S3 / Q-E1 multi-stage rankings, `DerivedRankingQuestion` type added, `allocation-rules.md` written, identityEngine consumes cross-rank signals via T-013 / T-014 / T-015. This is the working reference implementation of the multi-stage pattern.

2. **CC-017 (or whatever it's named) — principle canonization.** Edit `card-schema.md` § Question Types to add the "three-min / four-default / five-max" principle as a named rule. Edit `question-bank-v1.md` § Ranking Question Schema to cross-reference the principle and document the multi-stage pattern with Q-S3 / Q-E1 as the canonical examples. Light touch on Q-C4 trailing note (mark as the canonical exception) and Q-T1–Q-T8 trailing notes (mark as the canonical four-default-at-scale case).

3. **CC-018 — Q-X3 restructure.** Multi-stage Q-X3-public + Q-X3-information-and-commercial + Q-X3-cross. New signal IDs in `signal-library.md`. Legacy 5-item signals deprecated. T-001 (and any other consumers) rewritten to consume the new signal set. Glosses authored for every new item in `option-glosses-v1.md`.

4. **CC-019 — Q-X4 restructure.** Multi-stage Q-X4-relational + Q-X4-chosen + Q-X4-cross. New `outside_expert_trust_priority` signal. Existing tension consumers updated. Decision on whether to ship "doesn't apply" affordance alongside or as a follow-up.

CC-018 and CC-019 are independent of each other and could land in either order or in parallel, depending on appetite. CC-017 is a prerequisite for both.

The whole v2.5 sequence is a *runway extension*, not a v2 dependency. The Coherence Engine work described in `v2-coherence-engine.md` does not require any of this — it consumes whatever signal set exists at the time it ships. But running v2.5 first means the Coherence Engine inherits a cleaner ranking primitive set, with disaggregated institutional-trust signals and a new outside-expert signal both already present in the claim catalog. That makes the eventual claim-types richer without adding scope to the v2 work itself.

---

## What this memo is not

This memo is not a CC. It does not specify acceptance criteria, file targets, allowed-to-modify boundaries, or out-of-scope guards. The CC authoring still happens in dialogue between Jason and the Cowork chat session, per the project's standing prompt-authorship rule. This memo's job is to capture the architectural shape so that when the v2.5 CCs are drafted, they don't have to re-derive the principle, the multi-stage pattern, the rationale for the Q-X3 / Q-X4 splits, or the Q-C4 / Q-T exception status — those are settled.

This memo also does not lock item composition for Q-X3 or Q-X4. The directional intent is captured (the Government / Press / Companies splits, the Social Media addition, the relational / chosen cut for personal trust, the outside-expert addition); the precise final item lists and glosses are design work the v2.5 CCs will resolve.

---

## Cross-references

- `v2-coherence-engine.md` — the v2 work this memo is a runway-extension for. v2.5 does not depend on the Coherence Engine; the Coherence Engine benefits from but does not require v2.5.
- `prompts/active/CC-016-allocation-layer.md` — the working draft of the Allocation Layer CC, which establishes the multi-stage ranking pattern as canon for the first time.
- `docs/canon/question-bank-v1.md` § Ranking Question Schema — the current canonical schema; v2.5 extends it with the multi-stage pattern and the "three-min / four-default / five-max" principle.
- `docs/canon/card-schema.md` § Question Types — likely target for the new principle.
- `docs/canon/signal-library.md` — adds disaggregated institutional-trust signal IDs and `outside_expert_trust_priority` as part of CC-018 / CC-019.
- `docs/option-glosses-v1.md` — adds glosses for every new Q-X3 / Q-X4 item.
- `shape-framework.md` § Deferred — Q-X4 "doesn't apply" affordance lives here; v2.5 may resolve it.
