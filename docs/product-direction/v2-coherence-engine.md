# v2 Product Direction — The Coherence Engine

**Status:** Design memo. Not yet implementation. Captures the v2 architectural milestone identified in the design-jam between Jason and Clarence (2026-04-26).

**Audience:** Future CC authors who will eventually scope and draft CC-017 / CC-018 / CC-019 (or whatever the v2 work is named when it begins). Plus any product-direction conversation that needs to know where the engine is going.

**Relationship to existing canon:** This memo describes work that has not yet been canonized. When v2 work begins, the architectural ideas here either get canonized (joining `output-engine-rules.md`, `result-writing-canon.md`, `allocation-rules.md`) or get refined / replaced. Until then, this is design thinking on paper.

---

## The shift

The engine through CC-015c reads each Shape card largely in isolation. Per-card derivation produces per-card SWOT cells. Tensions detect a small set of pre-authored cross-card patterns (T-001 through T-015 after CC-016). The Mirror synthesizes a tighter version. The Map renders the per-card depth.

This works. The output is honest, hedged, and structurally complete. But it has a ceiling.

The ceiling is **what gets read**. The engine sees individual signals; tensions catch a handful of canonical co-occurrences; per-card prose stays within its card. What the engine does NOT do well is **read the user as a portfolio of evidence — stated values, allocation receipts, attribution patterns, behavioral reports, inferred styles, meta-signals — whose coherence (or tension) across the whole portfolio is the actual interesting thing.**

Clarence's diagnosis from the jam:

> *"The engine is now good enough that the writing layer is the bottleneck. That is actually excellent news. It means the architecture is not the main problem anymore. The remaining problem is editorial discipline."*

That was true through CC-015a/b/c. CC-015a ships editorial discipline. CC-015b ships the Mirror+Map structure. CC-015c ships Keystone Reflection. The writing layer is now solid.

The next ceiling: **the engine still reads each measurement as its own signal, not as one piece of evidence in a larger composition.** A user who ranks Family #1 sacred AND allocates discretionary money mostly to Self has produced two pieces of evidence about themselves. The current engine reads each independently. T-013 in CC-016 catches one specific instance of the gap between them. A v2 engine catches the *general principle* — the user offers stated values; the user shows allocation receipts; the gap (or alignment) between what is named and where the resources flow is the most informative pattern, *and the engine reads it as evidence, never as verdict*.

This is the **Coherence Engine**.

---

## The principle

> *"Stated values reveal identity. Spent energy reveals allegiance."* (Clarence — internal design language)

> *"Show me your energy and your spending, and I'll show you what you care about."* (Jason)

The first line stays in protected internal design language; *"allegiance"* is morally weighted and reads as accusation in user-facing prose. The user-facing form of the same idea is:

> *"Stated values reveal identity. Spent energy reveals lived priority."*

Or, when the more expansive form is wanted:

> *"Stated values reveal identity. Spent energy reveals what life is actually organized around."*

All three lines name the same architectural shift: every measurement in the model is either *something the user says about themselves* or *evidence of where their resources actually flow*. The engine's job is to read the user as a whole portfolio of evidence, detect the patterns of coherence and tension across them, and surface those patterns honestly without judging them.

### Engine humility (canon)

> The Coherence Engine does not judge whether the user's stated values are true. It compares categories of evidence: what the user names, what the user trusts, where the user places responsibility, what the user reports under pressure, and where money, energy, attention, and sacrifice appear to flow. Its job is to name alignment and tension with humility. **A gap is not a conviction of hypocrisy. It is an invitation to examine whether the user is living from desire, duty, fear, scarcity, exhaustion, ambition, love, or constraint.**

This paragraph belongs in `result-writing-canon.md` when v2 work begins. It is the moral guardrail of the Coherence Engine — without it, the engine drifts toward prosecution, and the product loses the *strong mirror, no gavel* register that defines its voice.

The Coherence Engine is what makes the body-map metaphor structurally complete. Compass / Heart says *what you protect*. Allocation (Q-S3, Q-E1) says *where your resources flow*. The Coherence Engine reads both as evidence about the same person and surfaces the relationship — without deciding which is the truer measurement of the person.

---

## What the Coherence Engine does, structurally

Three architectural primitives:

### 1. Interpretive Evidence objects

Not everything the user gives the engine is a *claim*. Some answers are stated values; some are reported behaviors; some are allocation receipts; some are trust preferences; some are attribution patterns; some are inferred cognitive styles; some are freeform narrative material; some are meta-signals about the user's engagement (skips, returns, hesitations from CC-014).

The right framing is **interpretive evidence**: each signal is one piece of evidence the engine uses to read the user, not a binding declaration the engine prosecutes against. The product is a mirror, not a courtroom; the type system should reflect that.

The Coherence Engine constructs typed evidence objects from the existing signal set:

```ts
type InterpretiveEvidence = {
  kind:
    | "stated_value"
    | "stated_trust"
    | "stated_attribution"
    | "stated_belief"
    | "allocation_receipt"
    | "behavioral_report"
    | "inferred_pattern"
    | "meta_signal";
  card: ShapeCardId;
  payload: unknown;          // kind-specific structure
  evidence: SignalRef[];
  confidence: "low" | "medium" | "high";
  rendering_posture: "name_directly" | "suggest_gently" | "hold_as_possibility";
  source_questions: string[];
};
```

The `rendering_posture` field is load-bearing. High-confidence stated values can be named directly. Inferred patterns from a small number of signals should be suggested gently. Cross-card combinations that hint at something but don't confirm it should be held as a possibility, never asserted. The posture is computed from confidence + evidence-type + canonical rendering rules, not authored per-evidence-instance.

Example evidence collection for one specific session — a user whose answers produce a high-confidence pattern-reader Lens with structurer support, Knowledge ranked first in Compass, and discretionary money flowing primarily to Companies. Note that this collection alone does not define a user type — it's one specific portfolio of measurements; another session with the same Lens and same top Compass value could produce a very different Gravity / Trust / Conviction / allocation profile.

- `{ kind: "stated_value", card: "compass", payload: { value: "Knowledge", rank: 1 }, rendering_posture: "name_directly", ... }` — from Q-S2
- `{ kind: "allocation_receipt", card: "compass", payload: { domain: "money", category: "Companies", flow: "high" }, rendering_posture: "suggest_gently", ... }` — from Q-S3
- `{ kind: "stated_belief", card: "conviction", payload: { stated_belief: "...", value_domain: "knowledge" }, rendering_posture: "name_directly", ... }` — from Q-I1 + Keystone Reflection extraction
- `{ kind: "inferred_pattern", card: "lens", payload: { stack: ["ni", "te", "fi", "se"], confidence: "high" }, rendering_posture: "suggest_gently", ... }` — from Q-T1–T8 aggregation
- `{ kind: "meta_signal", card: "compass", payload: { event: "skipped_then_returned", question: "Q-S3-close" }, rendering_posture: "hold_as_possibility", ... }` — from CC-014 skip-resume capture

Evidence objects are the engine's atomic representation of *what the user has shown the engine, by whatever mechanism*. The current model generates evidence implicitly through signals; v2 makes it explicit and rendering-aware.

### 2. Alignment / tension detection

Once evidence is typed, the engine can run pattern-detection passes that compare evidence pieces to each other.

Pre-authored detection patterns (the v2 equivalent of the tension library, but operating on evidence collections rather than raw signals):

- **Stated–allocation alignment**: stated value matches allocation receipt (*"You rank Family #1 sacred AND your money flows primarily to Family"*) → coherence. Surfaced positively in the Mirror.
- **Stated–allocation tension**: stated value differs from allocation receipt (*"You rank Family #1 sacred AND your money flows primarily to Self"*) → tension. Surfaced as observation, never as accusation. Money is one receipt, not the receipt — see *Allocation interpretation rules* below.
- **Aspirational-current tension**: current allocation differs from user's aspirational overlay (T-015 in CC-016 is one specific instance).
- **Cross-card evidence coherence**: stated values + Lens function + Gravity attribution all point in the same direction → strong coherence read.
- **Cross-card evidence tension**: e.g., user ranks Truth high + Conviction posture is "private under threat" + Trust pattern shows distrust of all institutions → a specific shape Clarence identified during user testing as *"truth-protective but socially careful — institutional skepticism is part of the protection mechanism."*
- **Faith ↔ Supernatural distinction** (the canonical worked example): high Faith ranking on Q-S2 + low Supernatural attribution on Q-C4 is a real and informative pattern — *not* an inconsistency. **Faith is a sacred value (Q-S2). Supernatural is a responsibility-attribution category (Q-C4). They are different measurements and the engine must not collapse one into the other.** A user may hold Faith very high while rarely attributing harm, failure, or responsibility to divine will, fate, or unseen forces — that combination may indicate that faith functions as meaning, trust, obligation, worship, or orientation without being used as an explanation that displaces human responsibility. The reverse pattern (low Faith + high Supernatural attribution) is also distinct and informative; it does not indicate "mature faith" or theological certainty. The engine names the pattern; it does not adjudicate it.

The pattern library starts small (10-20 patterns) and grows as the model encounters more user data. Each pattern has a structured rule + editorial prose template + non-accusatory rendering rule.

#### Allocation interpretation rules

Three canon rules govern how the engine reads allocation receipts. These belong in `coherence-pattern-library.md` when the v2 work begins.

> **Constraint-first interpretation.** Allocation gaps must be interpreted as evidence of lived constraint before they are interpreted as evidence of hypocrisy. The model may observe misalignment, but it must not assume motive. A user may spend against their stated values because survival, obligation, debt, illness, caregiving, fear, economic pressure, or a particular life season has captured their resources.

> **Money is one receipt, not the receipt.** Money allocation should be compared against energy allocation, time-and-presence indicators, and freeform sacrifice before the engine names a strong value gap. A person may spend little discretionary money on family because family does not need money, because money is tight, or because their care is expressed through time, loyalty, practical service, emotional steadiness, or sacrifice. Compressing care into money would be a class-bias category error.

> **Energy is the richer allocation category.** Time shows duration; energy shows devotion under constraint. Energy includes attention, sacrifice, emotional labor, money, creativity, risk, effort, planning, and inconvenience. Where money, attention, effort, risk, and sacrifice converge, the model has stronger evidence of lived priority. Where they diverge, the model surfaces the divergence — without deciding which receipt tells the truth.

### 3. Coherence narrative

The Mirror's *Allocation Tensions* section in CC-016 is the floor of what v2 produces. v2 builds the ceiling: a richer narrative section that reads the user's full pattern of evidence as one coherent (or tension-rich) composition.

**User-facing label:** *"Named Values, Spent Energy."* The internal handle for design conversations may stay *"Receipts vs Creed"* (it's accurate and memorable); user-facing copy uses *"Named Values, Spent Energy"* — clean, serious, not cute, and structurally non-accusatory. Alternative user-facing labels considered and rejected: *"Where Your Life Is Pointing"* (too directional), *"The Coherence Map"* (too clinical), *"Stated Values and Lived Allocation"* (accurate but heavy).

Sample target output for one specific session — a user whose Lens read as pattern-reader supported by structurer (high confidence), Sacred Values ranked Knowledge / Truth / Faith / Freedom in the top, money-allocation skewed toward Yourself and Companies, energy-allocation skewed toward Building and Solving, and Family ranked sacred but lower in visible allocation. *This is one specific portfolio among many possible portfolios with the same Lens stack and Compass top — the Coherence narrative below is shaped by the full configuration, not by the Lens or the top-Compass-value alone:*

> *"Your stated values cluster around Knowledge, Truth, Faith, and Freedom. Your money currently flows most heavily to Yourself and Companies; Family and Friends sit lower. Your discretionary energy flows toward Building and Solving more than toward Caring or Enjoying. Your Lens reads as the pattern-reader supported by the structurer — long-arc convergent insight, executed through external structure.*
>
> *The pattern is largely coherent: a builder who values knowing what's true, organized around durable structure, currently directing more visible resources toward self-stability and enterprise than toward close relational allocation. Whether that's the right ordering is yours to read; the model only sees that your named values and visible allocations currently form a mostly coherent pattern, with one relational gap worth examining. The notable gap is Family — declared as having a strong claim, less prominent in the visible receipts. That gap may be constraint, season, exhaustion, ambition, or care expressed through channels the model doesn't measure (presence, loyalty, practical service, emotional steadiness). The model cannot decide which. It can only show you the pattern."*

That's a 1-paragraph Coherence narrative shaped by the full evidence collection — stated values + allocation + energy + Lens together. Another session with the same Lens stack and same top sacred value but different allocation (more flow toward Family, less toward Companies) or different Gravity attribution (System #1 instead of Individual) or different Conviction posture would produce a substantially different narrative. The narrative comes from the *whole portfolio*, not from any pair of cards collapsed into a label.

This is the v2 prose ceiling. It requires:

- The interpretive-evidence architecture (so the engine has structured, posture-aware input).
- A cross-card pattern library (so detection is more than per-card).
- A richer prose-generation path — either a more expressive template engine, or a carefully bounded LLM-substitution path. Templated single-card prose hits a coherence ceiling around 100-150 words.

The output may want to live as a new Mirror section, or as its own tier between Mirror and Map. The Mirror today is ~700 words. Coherence narrative adds another ~150-300 words of cross-card synthesis. Architecture decision deferred to v2 implementation.

---

## What v2 Coherence Engine implements

Sharpened sequence — three named CCs, in dependency order:

### CC-017: Interpretive Evidence Layer

Convert existing signals into typed `InterpretiveEvidence` objects. Adds the `kind` taxonomy, the `rendering_posture` field, and the extraction layer that maps every CC-011 / CC-016 signal into the new shape. Modest engine work — most signals translate cleanly. No user-visible change. This is the foundation; nothing else in v2 ships without it.

### CC-018: Coherence Pattern Library

Author the initial 10-20 cross-card detection patterns operating on evidence collections. Each pattern has a structured rule + editorial prose template + non-accusatory rendering rule. Lives in a new `lib/coherencePatterns.ts` and `docs/canon/coherence-pattern-library.md`. The library starts with patterns drawn directly from the design jam:

- Named value aligns with money allocation
- Named value diverges from money allocation (constraint-first interpretation applies)
- Named value aligns with energy allocation
- Named value diverges from energy allocation (constraint-first interpretation applies)
- Faith ranked high + low Supernatural responsibility attribution (Q-S2 ↔ Q-C4 — see *Faith ↔ Supernatural distinction*)
- Justice ranked high + System responsibility attribution (Q-S2 ↔ Q-C4)
- Truth ranked high + private-under-threat Conviction posture (Q-S1 ↔ Q-P)
- Freedom ranked high + Order/Stability also ranked high (Q-S1 internal pull)
- Family ranked sacred + visible energy currently flowing elsewhere (Q-S2 ↔ Q-E1, with constraint-first interpretation)
- Government distrust + support for public-service expansion (Q-X3 ↔ adjacent signals)
- High personal trust (Q-X4) + low institutional trust (Q-X3)
- Pattern-reader Lens stack + low present-tense action (Q-T ↔ Q-A)

The pattern library is the v2 work's center of gravity. It can ship without the narrative generator and produce useful Mirror output through templated prose. The narrative ceiling comes later.

### CC-019: Coherence Narrative

Only after CC-017 + CC-018 land. Reads detected patterns + evidence collection + per-card outputs from CC-011 / CC-016. Produces the cross-card narrative paragraph(s). This is the right place for a first richer-template-engine or bounded-LLM-substitution path. API-key / latency / determinism / privacy / consent / redaction decisions get made here, not earlier.

The sequence prevents the failure mode of writing beautiful prose over unstable architecture. Patterns must work before narrative wraps them.

### Adjacent v2 work (separate CCs)

- **Mirror restructure** to surface the Coherence narrative. Either as a new section between *Your Next 3 Moves* and *Confirmed Tensions*, or as a new tier between Mirror and Map. UX work belongs to whoever drafts the renderer CC.

- **Evidence history view (optional, possibly v2.5).** A page or panel that shows the user the evidence collection itself — every piece of evidence the engine has registered about them, drawn from every question. The user reads their own portfolio, not the model's interpretation of it. Tiered transparency. Honors the *"the user is the final authority"* canon principle structurally.

---

## Three open architectural decisions

These are real product-direction decisions worth a deliberate conversation when v2 work begins.

### A. Richer prose generation

Rule-based prose templates can handle high-confidence patterns and short synthesis (the CC-016 Mirror section is rule-based). The richer multi-evidence synthesis the example above models may eventually require either a more expressive template engine or a carefully bounded LLM-substitution path. LLM substitution is one option among several, not the inevitable answer.

Three paths, deliberately ordered by reversibility:

- **Richer rule-based / template engine.** Extend the current template approach with composition — narrative templates that consume detected patterns + evidence collection and assemble paragraphs from authored fragments. Heavy authoring work; ceiling rises meaningfully past CC-015a/b but does not reach full multi-evidence synthesis.
- **Hybrid.** Rule-based templates for high-confidence detected patterns (the pattern is structurally clear); a bounded LLM path for low-confidence cases or evidence collections with no canonical pattern match. Pragmatic balance.
- **Pure LLM-substituted.** Each session produces an LLM call reading evidence + per-card output, generating the Coherence narrative. Real costs (API, latency, determinism, privacy). Ceiling is much higher; cost surface is much wider.

#### LLM substitution data-boundary rules

If any LLM-substitution path is adopted, the system must define the following before it ships:

- **Redaction.** Freeform belief text (Q-I1, Q-I2, Q-I3) must not be passed to an LLM by default. Any LLM-substituted prose path receives summarized / paraphrased / signal-only versions of freeform input unless the user has explicitly consented to verbatim use.
- **Summarization.** A canonical summarization layer sits between freeform input and any LLM call — running locally, deterministic, and inspectable. The user sees what gets summarized and how.
- **Consent.** LLM-substituted prose generation is gated on explicit per-session consent, not implicit. The default is rule-based.
- **Logging.** What gets sent to the LLM is logged client-side and shown to the user on request. No invisible telemetry of belief content.
- **Retention.** No LLM-side retention of session content. Vendor agreements must explicitly disable training-on-input and content retention. If a vendor cannot provide that contractually, the LLM path does not use that vendor.
- **Data boundaries.** Identifiable user content does not cross any boundary it was not collected to cross. Aggregate or anonymized statistics may eventually leave the session boundary; raw responses do not.

These rules belong in a new `docs/canon/llm-substitution-rules.md` when (and only if) the LLM path is adopted. Until that file exists, the v2 narrative path is rule-based or richer-template-engine — not LLM.

The LLM-substitution decision is genuinely architectural. It changes determinism, cost, privacy, latency, and consent surface. Worth its own product-direction memo when the time comes.

### B. Population baseline (yes/no/when)

Some Coherence reads sharpen with population data. *"Your Lens stack is unusual in your generation"* requires knowing how stacks distribute by generation. *"Your value pattern clusters with [demographic group]"* requires baseline distributions.

Three options:

- **No baseline.** Coherence reads stay self-contained — never compare the user against population. Honest. Limits the read.
- **Synthetic baseline.** Baseline data drawn from the canonical literature (Schwartz Values Survey distributions, MFQ-2 cohort data, Big Five normative samples). Useful but indirect.
- **Real baseline (when scale arrives).** Aggregate user data (anonymized, opt-in) produces real baselines. v3 territory at earliest.

For v2: probably no baseline. Coherence stays self-contained.

### C. Mirror's section architecture (extensible vs locked)

The Mirror after CC-015b has seven sections. CC-016 adds an eighth (Allocation Tensions). v2 Coherence Engine adds another (Coherence narrative or Receipts vs Creed). v3 Aperture work may add three more.

The Mirror's section list should be **data-driven, not hard-coded.** When v2 work begins, the renderer should be capable of adding/removing/reordering Mirror sections without rewriting the page structure. CC-015b's renderer was authored before this constraint was identified — worth flagging in the v2 work to either preserve the current section count cleanly or refactor to a section-list-driven renderer.

---

## Why this matters

The Coherence Engine is what makes the body-map metaphor structurally complete and what gives the product the *"mirror with a pulse"* register Clarence named. The current model surfaces individual measurements honestly. The Coherence Engine surfaces the *pattern across measurements* — which is what users actually want when they take a self-discovery assessment.

It also opens the matrix-pattern surface that Jason flagged during testing — the cross-card connections that produce reads no single card can. The corrected worked example: *"Faith ranked high (Q-S2 sacred value) + low Supernatural responsibility attribution (Q-C4) + high Religious-institution trust (Q-X3)."* Three measurements, three different cards, no single one of them revealing the shape. The combination does.

#### Faith ↔ Supernatural distinction (canon)

> Faith and Supernatural attribution are distinct measurements. Faith belongs to sacred value (Q-S2); Supernatural belongs to responsibility attribution (Q-C4). Their relationship may be coherent, conflicted, or simply nuanced; the engine must not collapse one into the other.
>
> Low Supernatural attribution **must not** be interpreted as low faith. High Supernatural attribution **must not** be interpreted as mature faith or theological certainty. The combination of high Faith and low Supernatural attribution may indicate that faith functions as meaning, trust, obligation, worship, or orientation without being used as an explanation that displaces human responsibility.

A possible user-facing rendering of that combination, for use by the Coherence narrative when the pattern is detected with high confidence:

> *"Faith appears to function less as an escape hatch from responsibility and more as an orienting trust. You may believe in what is beyond human control without using it to excuse what remains within human responsibility."*

That is a strong coherence read — and one no single card produces. It is exactly the class of insight the Coherence Engine exists to surface.

CC-016 ships the first three patterns of this kind (T-013, T-014, T-015). v2 Coherence Engine generalizes the pattern detection and produces the richer narrative.

---

## When this work begins

After CC-016 ships and is verified in real use. The patterns CC-016 introduces (allocation gaps as observation, not accusation) need to be tested with real users before the Coherence Engine generalizes the model.

Probable sequence:

1. CC-016 ships (Allocation Layer).
2. Real-user testing of allocation tensions (T-013/T-014/T-015 in production). The constraint-first interpretation rule gets stress-tested here — does the rule actually hold the model back from prosecution, or does it leak through anyway? Live testing is the only honest answer.
3. v2.5 Universal-Three Restructuring (Q-X3 / Q-X4 splits — separate memo).
4. v2 Coherence Engine begins:
   - **CC-017**: Interpretive Evidence Layer (signal → typed evidence with rendering posture).
   - **CC-018**: Coherence Pattern Library (10-20 patterns, rule-based rendering).
   - **CC-019**: Coherence Narrative (richer prose generation; LLM-substitution decision and data-boundary rules made here, or punted).
   - Plus a Mirror restructure CC adjacent to CC-019 to surface the new narrative section.

Roughly 4-6 substantial CCs, depending on whether the LLM path is adopted and how many patterns the library opens with. Real work.

---

## Protected lines from the design jam

The following lines are product-quality and should be preserved for use in the Coherence narrative when v2 ships. Each is marked for its intended deployment surface — *user-facing* lines may appear in rendered Mirror prose; *internal* lines stay in design conversations and canon files but do not appear in user-rendered output.

User-facing:

> *"Show me where your energy goes when no one is forcing you, and I will show you what your heart has learned to worship."* (user-facing — reads as devotional reflection, not accusation)

> *"The model does not only ask what you value. It asks what your life appears to be valuing on your behalf."* (user-facing)

> *"Stated values reveal identity. Spent energy reveals lived priority."* (user-facing — the public form of the *"allegiance"* line)

> *"Stated values reveal identity. Spent energy reveals what life is actually organized around."* (user-facing — alternative expansive form)

> *"Heart is not only what you name. Heart is what receives your energy under constraint."* (user-facing)

Internal (design language only — do not deploy in user-rendered prose):

> *"Stated values reveal identity. Spent energy reveals allegiance."* (Clarence — internal handle for the architectural shift; *"allegiance"* is morally weighted and reads as accusation when surfaced to a user)

These belong in the Coherence narrative section when it ships, alongside the lines already in `result-writing-canon.md`. Future CCs that touch the Coherence narrative may use the user-facing lines verbatim; they may not paraphrase, abbreviate, or replace. The internal line stays internal.

---

## Relationship to other v2+ work

- **v2.5 Universal-3 Restructuring** (separate memo): Q-X3 / Q-X4 redesign. Related but distinct — adds measurement precision; doesn't change architecture. Coherence Engine reads whatever the measurement layer produces.
- **v3 Aperture / Distance** (separate memo): the user controls how zoomed-in or zoomed-out the Inner Constitution reads. Coherence Engine is close-aperture; Aperture work adds wide-aperture reads (relational, generational, cultural).
- **CC-014 skip mechanism** (already shipped): meta-engagement signals (when did the user skip what) become inputs to the evidence-extraction layer in v2 as `meta_signal` evidence — observations about the user's engagement, distinct from content evidence and rendered with `hold_as_possibility` posture by default.
- **Postgres / persistence**: Coherence Engine doesn't strictly require persistence, but session-level evidence history grows in value when the user can return to it across time. v2 + Postgres together produce the most powerful version of the engine.

---

## Bottom line

The current model gives the user a thoughtful self-portrait. The Coherence Engine gives the user a *coherence map* — a read of how the user's stated values, allocations, attributions, and pressures compose into a recognizable pattern, with the gaps named honestly and never prosecuted.

The two governing rules of the engine, in their cleanest form:

> **Coherence is not prosecution. Allocation is evidence, not a verdict.**

The Coherence Engine should never produce prose that reads as:

> *"You say you care about X, but you really care about Y."*

The same observation, rendered correctly, reads as:

> *"You named X as sacred, while your visible energy currently flows toward Y. That gap may be constraint, season, avoidance, ambition, exhaustion, care expressed through channels the model doesn't measure, or genuine misalignment. The model cannot decide which. It can only show you the pattern."*

That is the right voice. **Strong mirror. No gavel.**

That's the product the design-jam revealed was possible. It's the v2 milestone. CC-016 is the first installment.
