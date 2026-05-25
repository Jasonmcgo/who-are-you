# Couple Module — Obvious or Oblivious + Partner Trajectory (MVP Build Spec)

Status: DRAFT spec, 2026-05-23. Strategy approved by Jason; sequencing not yet canon.
Source brainstorm: `uploads/50_degree_life_relationship_marriage_product_notes.md`.
Companion thesis (agreed): the couple module is **trajectory, not compatibility** — what love
becomes under Aim, what it becomes under Grip, and the one move that returns each partner toward path.

This doc exists to turn the brainstorm into something buildable. It makes the decisions the notes
left open: which slice ships first, the exact data the game must capture, how scoring works, the
safety floor that keeps the read from becoming a weapon, and the order of CC prompts.

---

## 1. The wedge (what we build first, and why)

We ship **one game mode**, not five. The wedge is **Obvious or Oblivious? (Mode 1)** —
each partner answers for themselves, then guesses the other's answer.

It wins on all three axes we care about:

- **Viral loop.** It structurally requires a second person. Partner A can't finish the fun part
  alone, so A recruits B. That is the share mechanism the individual report never had.
- **Calibration data.** B guessing A's answers is exactly the **second-rater signal** the typing
  work has lacked. Agreement = A is legible on that dimension; disagreement = a surprise we can
  mine (e.g., warm-Sensor exemplars where a people-oriented answer is *not* NF intuition).
- **Emotional payoff with low blast radius.** "My partner guessed me / missed me" is delightful and
  safe. We hold the heavier modes (Grip or Gift?, What Am I Protecting?) until the safety floor and
  confidence tiers are proven.

The other four modes (Grip or Gift?, What Am I Protecting?, The Aim Swap, Who Said It?) are
**Phase 2** content riding the same data spine. Don't build their scoring until Mode 1 ships.

The **serious module** name stays "The Partner Trajectory"; the game name stays "Obvious or
Oblivious?" Sticky front door, serious room behind it.

---

## 2. MVP scope (the line)

**In:**

1. Invite flow: Partner A (has an individual session) invites Partner B by link.
2. Obvious-or-Oblivious Mode 1: ~8–12 playful items (the brainstorm's question categories), each
   answered self + guess-partner, for *both* directions.
3. The five **reveal types** (Obvious / Oblivious / Mirror Blind / Hidden Pattern / Loving Misread)
   as the result surface — these are already written and are the product's voice.
4. A **lean couple report**: three sections only —
   - **Aim Exchange** — what each partner receives from the other's Aim (notes §"What My Aim Gives You").
   - **Grip Loop** — the one reactive loop between the two Grips (notes §"What My Grip Costs You").
   - **What Your Partner Loves About You** — appreciation surface, sourced from each individual report.
5. **One course correction** — the single highest-leverage move, not a list.
6. A couple score with an honest shadow (see §4).

**Out (Phase 2+):** the other four game modes; `hiddenDrag`, `loveCalibration`, `forecast`,
`fivePsAsPair` from the full `CoupleReport`; OCEAN-as-pair; longitudinal re-check / trajectory-over-time.

The full `CoupleReport` type in the notes is the *destination*. The MVP populates
`aimExchange`, `gripLoop`, `partnerAppreciation`, `obviousOrOblivious`, `courseCorrection`
and leaves the rest `null` behind confidence gates.

---

## 3. Data model the game must capture

Every Obvious-or-Oblivious item produces a 4-tuple per direction:

```
selfAnswer        — what A says about A
partnerGuess      — what B guessed A would say
selfKnows         — (optional) does A think this is obvious about themselves?
sourceSignal      — which engine signal/claim this item maps to (e.g. love_register, grip_pattern, ns_valence)
```

The reveal type is a pure function of the tuple:

| selfAnswer vs partnerGuess | self-aware? | Reveal |
|---|---|---|
| match | — | **Obvious** |
| mismatch, partner generous-but-wrong | — | **Loving Misread** |
| mismatch, partner names the real driver A underplays | A underplays | **Mirror Blind** |
| mismatch, A clear / B missed | A clear | **Oblivious** |
| neither names the engine's likely driver | — | **Hidden Pattern** |

`sourceSignal` is the load-bearing field — it's what makes the game double as calibration. Log it.
When `partnerGuess` disagrees with `selfAnswer` on an item whose `sourceSignal` is a typing axis we
already flag as fragile (N/S valence, Ne-vs-Fe, Ti-beats-Fi), that disagreement is a **labeled
training example** for the accuracy work, not just a game result.

Persist these to a new table (couple session) rather than overloading `sessions.answers` — game
guesses are *about* another person and must never merge into that person's individual answers.

---

## 4. Scoring (with the shadow)

Two numbers, shown together, never one alone:

- **Legibility** — % of items where `partnerGuess == selfAnswer`. "How clearly your partner reads you."
- **Blind-spot count** — items where the *engine's* likely driver matched neither person's answer
  (Hidden Pattern). "What the relationship reacts to before it understands."

The gamified couple score ("Kite and String" / partner-trajectory) is a **presentation** of these
plus the Aim Exchange — it is never a compatibility percentage. Hard rule: **no single number that
reads as a verdict on the relationship.** A high legibility score with a high blind-spot count is a
*more interesting* result than a clean sweep, and the copy should say so.

---

## 5. Safety floor (non-negotiable, gates the whole module)

The couple read can do real harm if it ships as ammunition. Four invariants:

1. **Consent gate.** Never surface a read *about A* to B that A has not seen and released. B sees A's
   patterns only after A opts in to share that layer. The game's guess-step is fine (B is guessing,
   not being shown); the *report* layer is consent-gated.
2. **Symmetric self-implication.** Every read about your partner implicates you too. "What My Grip
   Costs You" always ships paired with "What Your Aim Gives Them." No one-sided indictment.
3. **Gift-under-fear framing, always.** Grip is "an honorable gift doing unauthorized work," never a
   character flaw. This is the moat *and* the safety mechanism — same sentence does both jobs.
4. **Engine can't see the room.** Copy never asserts what *is* happening between them; it names a
   tension and asks the question the biography would confirm. This is the confidence-tier discipline
   (Signal → Hypothesis → Question → Guidance) applied to two people instead of one.

If any of these four can't be guaranteed for a given output, that output is suppressed, not hedged.

---

## 6. Build sequence (CC prompts, in order)

This rides the existing engine. Inputs the notes list — Love Map, Grip Pattern, Goal/Soul/Aim/Grip,
Risk Form, Load/Weather — already exist (verify before each CC; see §7). Proposed chain:

1. **CC-COUPLE-1 — Couple session data model.** New couple-session table + invite-link mint (reuse
   `mintFollowUpLink` pattern). Stores the §3 4-tuples. No UI yet. *Pure plumbing; cheap.*
2. **CC-COUPLE-2 — Obvious-or-Oblivious item bank + reveal resolver.** Encode the ~8–12 Mode-1 items
   with `sourceSignal` tags; implement the §3 reveal-type function. Deterministic, $0.
3. **CC-COUPLE-3 — Game UI + invite/answer/guess flow.** Partner A invite → B plays → reveal screen
   using the five reveal-type templates (already written in the notes).
4. **CC-COUPLE-4 — Lean couple report (3 sections + 1 course correction).** Compose Aim Exchange /
   Grip Loop / Appreciation from the two individual reads, behind the §5 safety floor and confidence
   tiers. Reuse warm LLM prose; budget one new generation per couple (~$0.05), not a regen.
5. **CC-COUPLE-5 — Calibration tap.** Pipe `sourceSignal` disagreements into the cohort/accuracy
   surface so partner guesses feed the typing work. *This is the strategic payoff — don't skip it.*

Phase 2 (after Mode 1 proves the loop): the other four game modes, then `forecast` /
`loveCalibration` / `fivePsAsPair`, then longitudinal trajectory.

---

## 7. Dependencies & open questions

- **Depends on typing accuracy.** A couple read compounds two individual reads, so it inherits both
  their errors. The CC-134/134.1/135/141 accuracy work (and CC-138, the binary reformat) is the
  foundation — the couple module shouldn't ship reads to *pairs* until the individual confidence is
  trustworthy. Sequence the couple build to *start* now (data spine, game) while typing settles, and
  gate the *report* layer on the accuracy bar.
- **Verify engine inputs exist** before CC-COUPLE-4: `loveMap` register/flavor, grip pattern bucket,
  Goal/Soul/Aim/Grip scores, Risk Form label, Load/Weather. (Quick grep pass — see task list.)
- **Pressure-test the pairing gems against real data.** The notes' Brad & Raquel / Jason & Michele /
  Daniel & Cindy pairing narratives are compelling but unvalidated. Before any pairing logic hard-codes
  them, read the cohort-real fixtures and confirm the claims hold in the answers (e.g. does Brad's data
  actually show "creativity needs a mission wrapper," does Raquel's show "freedom with a security
  floor"). Open offer — flagged by Jason.
- **Q-blame / "What Am I Protecting?"** maps onto the existing Grip Pattern taxonomy (Safety/Security/
  Belonging/Worth/Recognition/Control/Purpose). Phase-2 Mode 3 should reuse that, not invent a parallel set.

---

## 8. One-line summary

Ship the game first (it recruits the second player and hands us the calibration data we've never had),
keep the report lean and consent-gated, never print a compatibility number, and treat every Grip as a
gift under fear. Serious underneath, playful on the surface.
