# Option Glosses — v1 Draft

**Status.** First draft for review and iteration before the relevant CCs lock these into `question-bank-v1.md`. Not authoritative yet.

**Purpose.** Sentence-level descriptors that appear under each option label in ranked questions, per `docs/design-spec-v1.md` § 3.2. Format: `{Label} — {gloss}.` The gloss is one short clause that anchors the value or category without being preachy. Two lines max in the rendered row.

**Reference register.** Q-S1's four glosses came from the design lab's mobile mockup and set the tonal target:

> Freedom — the ability to act without needing permission.
> Truth — what's actually so, even when it costs.
> Stability — steady ground, for you and the people who rely on you.
> Loyalty — staying with your people through what comes.

Patterns that work in those four:
- Short. Definition + one anchoring clause.
- Operational where possible ("the ability to," "what's actually so," "steady ground").
- Some carry a small stake ("even when it costs," "through what comes") — earned tone.
- Tonally warm but not ornamented. No metaphors that have to be unpacked.

**Iteration format.** Edit in place. Where I've offered alternatives, pick one or rewrite. When this draft stabilizes, the relevant CC for each question (CC-006 Sacred, CC-007 Institutional, CC-008 Responsibility) promotes the locked text into `question-bank-v1.md`.

---

## Q-S1 — Sacred personal-conduct (locked from mockup)

Question: *Order these by what you'd protect first when something has to give.*

These four are confirmed via the design lab mockup. Repeated here for completeness.

- **Freedom** — the ability to act without needing permission.
- **Truth** — what's actually so, even when it costs.
- **Stability** — steady ground, for you and the people who rely on you.
- **Loyalty** — staying with your people through what comes.

---

## Q-S2 — Sacred larger-than-self (proposed)

Question: *Order these by which has the strongest claim on you.*

- **Family** — the people who are yours, and to whom you are theirs.
- **Knowledge** — what's actually known, and the discipline of seeking more.
- **Justice** — fair weight, even when it costs you to give it.
- **Faith** — trust in what's larger than you, however you frame it.

**Alternates worth comparing:**

- *Family* alt: "the people you belong to, by blood or by choice."
- *Knowledge* alt: "what's true, and the work of finding it."
- *Justice* alt: "what's owed, given, or refused, with the scales kept honest."
- *Faith* alt: "belief in what's larger than you, however you'd name it."

The "however you frame it" / "however you'd name it" hedge on Faith is deliberate — it signals the question doesn't require a religious user to translate themselves, and doesn't require a non-religious user to opt out. Worth your eye.

---

## Q-X3 — Institutional Trust (proposed)

Question: *Rank these institutions from most to least trustworthy.*

These need to be informational rather than poetic — the categories are abstract and the user benefits from a small scope clarification rather than a stake.

- **Government** — federal, state, and local public bodies.
- **Press** — newsrooms, journalists, and information outlets.
- **Companies** — businesses and the workplaces that hire you.
- **Education** — schools, colleges, and the credentialing they grant.
- **Non-Profits & Religious** — charities, NGOs, churches, and other voluntary missions.

**Alternates worth comparing:**

- *Government* alt: "the public institutions that set and enforce rules."
- *Press* alt: "the journalism and information sources that shape what people know."
- *Companies* alt: "the businesses and workplaces that pay you and shape your work life."
- *Education* alt: "schools, universities, and the credentialing bodies that pass on knowledge."
- *Non-Profits & Religious* alt: "voluntary mission-driven institutions, secular and faith-based."

**Locked 2026-04-25:** *Employers* renamed to *Companies* (plain English match for the rest of the row, avoids condescending "the people who pay you"). *Non-Profits & Religious organizations* shortened to *Non-Profits & Religious* (mobile-fit). Faith gloss in Q-S2 retained as-is — atheist or humanist users can rank Faith last; the rank itself is informative.

Tradeoff: the longer alternates are more informative but slow the rank task down. The short versions read faster on mobile. My read: ship the short versions, expand only if user testing shows confusion.

---

## Q-C4 — Responsibility Attribution (proposed)

Question: *When something goes wrong, rank where the responsibility most often sits.*

These categories are philosophy-heavy. Glosses can carry more weight here without preaching.

- **Individual** — the person who acted, and what they brought to the moment.
- **System** — the structures and incentives shaping what was possible.
- **Nature** — chance, biology, the way things just are.
- **Supernatural** — divine will, fate, or what's beyond human reach.
- **Authority** — the people in charge of the system, not the system itself.

**Notes on specific items:**

- *Authority* needs to disambiguate from *System*. The current gloss does that explicitly ("not the system itself"). Without that clarification, users will conflate the two and rankings will collapse. Keep this gloss longer than the others if needed — it's load-bearing.
- *Supernatural* is intentionally pluralistic — "divine will, fate, or what's beyond human reach." Covers religious users (divine will), secular-spiritual users (fate), and naturalists who acknowledge limits of agency without metaphysics ("beyond human reach"). The user shouldn't have to translate themselves to engage.
- *Nature* glosses tradeoff: "the way things just are" is plain and accurate. Alternative: "what's structural and impersonal — biology, chance, physics." The plain version reads faster; the technical version makes the category more distinct from System. Worth your call.

**Alternates worth comparing:**

- *Individual* alt: "the person who acted, and the choices they made."
- *System* alt: "the rules, incentives, and structures the person was working inside of."
- *Nature* alt: "what's structural and impersonal — biology, chance, physics."
- *Supernatural* alt: "what is beyond human reach — divine, karmic, or cosmic."
- *Authority* alt: "the people who set the conditions, not the conditions themselves."

---

## Open glosses needed elsewhere

Two further sets of descriptive copy may be needed for the same UI register; flagging here so they don't get lost:

- **Q-T1–Q-T8 Temperament voice rows** — already drafted in `docs/temperament-voice-draft-v1.md` as serif-italic first-person quotes per cognitive function. Different shape from these glosses (quote rather than label-plus-clause). No action needed here.
- **Forced-question option glosses on existing questions (Q-C1, Q-P1, Q-F1, etc.)** — currently bare option labels in canon. Adding glosses to *all* options across the question bank would unify the UI register but is a larger editorial pass and not implied by the design spec. Defer until requested.

---

## Sign-off

When you've reviewed and either accepted my picks or chosen alternates, this draft can be promoted into `question-bank-v1.md` as part of the relevant CC. Suggested promotion bundling:

- **CC-006 (Q-S1 + Q-S2 ranked Sacred):** ships Q-S1 confirmed glosses + Q-S2 locked glosses.
- **CC-007 (Q-X3 Institutional):** ships Q-X3 locked glosses.
- **CC-008 (Q-C4 Responsibility):** ships Q-C4 locked glosses.

Each CC's report-back should include the final gloss text used, so canon and code stay byte-aligned.
