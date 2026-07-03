# CC-188 — Typing Hydration: the unique shape, not the MBTI stereotype

> **Product context (owner).** The typing engine is producing stereotypical MBTI outputs when it
> should be surfacing the person's *unique* shape. MBTI is only one axis. Three concrete failures,
> owner-reported:
>   1. **The Ni-Te fallback default + high-axis saturation.** There is a literal
>      `dominant ?? "ni", auxiliary ?? "te"` fallback (jungianStack.ts) that returns INTJ whenever
>      dom/aux can't resolve. **Owner-verified caveat:** this does NOT flatten the population — prod
>      holds exactly 1 INTJ (Jason, correct). So treat the default as a *latent bad default to remove*
>      (an ambiguous read should say "unresolved," not "INTJ"), NOT as a mass-inflation problem. The
>      real damage is per-person mis-ordering (items 2-3), invisible in aggregate counts. Separately,
>      Jason self-reports very high N and very high T *axis range* while presenting a **clean Ni-Te
>      spine** — the engine must not smear him into false NiTeTiNe / Ne-Ti mush; his Ne/Ti are
>      resonance/range **edges**, not stack-order evidence.
>   2. **The introversion attractor (the primary, best-evidenced bug).** A genuinely introverted +
>      feeling person is pulled toward introverted-*perceiving* Feeling types (Si→ISFJ, Ni→INFJ) even
>      when their real perceiving function is extraverted (Se) and their judging is Fi — i.e. Fi-Se
>      **ISFP** people get inverted into Si-Fe/ISFJ or Ni-Fe/INFJ. **Nat is the confirmed in-scope
>      case** (Fi-Se ISFP; the same-attitude recovery still prefers Si-dominant — a principled Fi-Se
>      discriminator fixes her). **JDrew is owner-confirmed ISFP too, but a DIFFERENT/larger inversion**
>      — his live read is room-reader (Fe) + pattern-reader (Ni), a "pastor" Fe-Ni idealist, not
>      Nat's Si-dominant failure. JDrew has no fixture yet and his mechanism is unverified — diagnostic
>      only, possibly a CC-189 case. Nat alone is the solid in-scope anchor for this fix.
>   3. **Suppressed driver published as auxiliary.** A confident cross-signal driver that the stack
>      has relegated to auxiliary never gets promoted. **Connor is the canonical victim**: cross-signal
>      infers `ne`, but the stack publishes Ti-dominant INTP and pins Ne in the aux slot. He is a
>      strong-Ne shape (Ne-lead) mis-read as a cautious INTP — worsened by taking the assessment
>      under stress, which over-fed the Ti/coherence signals. **Brian is a second, owner-confirmed
>      victim (mirror case):** cross-signal infers `te` but the stack publishes Ni-dominant INTJ
>      (confidence low: thin-floor, dominant-convergence-weak, aux-ambiguous, ns-valence). He is a
>      **Te-lead ENTJ** whose driver got pinned as auxiliary *and* who got read introverted (Ni-dom)
>      when he is extraverted (Te-dom) — so Brian ties the introversion attractor (item 2) and the
>      suppressed-driver bug (this item) into one case.
>
> The instrument is also **cumbersome**: testers report "I just guessed / picked the top one."
> Scoring must be robust to that satisficing rather than trusting rank-1 picks alone.
>
> **The thesis:** the engine's underlying read is often strong, but the published output is too
> MBTI-shaped *and too stack-exclusive.* Hydrate the output so it distinguishes **dominant stack
> order** from **axis breadth**, **function resonance**, and **current-state / designer
> contamination**. MBTI stays a downstream litmus label; the primary product output is the unique
> shape: native lead/support **plus** meaningful breadth and honestly hedged uncertainty. The failure
> mode to avoid is symmetric: don't solve stereotype-flattening by creating *over-hydrated mush* where
> every high-N/high-T person becomes an "NT cloud." The target is **clear spine, rich edges** — for
> Jason, a Ni-Te spine with Ne/Ti edges; for Connor, a likely Ne-Ti spine currently disguised by
> stress-inflated Ti.
>
> **North star:** a good result should let a person say *"that is more precise than my MBTI type,"*
> never *"that gave me four types at once."*
>
> **The core general principle — confidence must reach the surface.** The systemic bug (not any one
> person's type) is that the engine renders **low-confidence reads with full confidence.** Verified:
> JDrew publishes a confident ENFJ "pastor" report at `confidence=low` with FOUR flags lit
> (`thin-floor, dominant-convergence-weak, aux-ambiguous, dominant-mirror`); the same disease produces
> the INTJ default, Nat's Si-Fe, Brian's INTJ. The specific wrong type is incidental — the fix is to
> make the confidence flags **govern the output**: a multi-flag read must render as *tentative*
> ("possibly X, possibly quite different"), never as a finished portrait with a confident named type.
> This is the highest-leverage hygiene lever; get it right and the class is fixed, not a person.
> **Surface area (verified 2026-07-03 across the 16 real fixtures): 75% (12/16) read low-confidence**
> yet render confidently — so this fix touches three-quarters of real users, not an edge case.
> **The worst-identified axis is feeling-attitude (Fe/Fi):** every Fe-in-stack shape is low-confidence
> (Harry, JDrew, Ashley), and 3 of 4 Fi shapes are (Nat, Cindy, Kevin); Fi specifically gets lost
> (rendered as Fe — JDrew — or as Si — Nat). A sharper Fe/Fi discriminator is the highest-value
> follow-on (candidate CC-190); this CC's job is to stop confidently rendering these uncertain reads.
>
> **Framing — hygiene, not recalibration.** The aim is to reduce mistype **risk** and surface honest
> **low confidence** for the shapes the instrument handles worst — NOT to re-type people who are
> already correct. Jason is used throughout as an *example of the risk* (intuitive-thinkers mis-align
> across all-N and all-T, so they *risk* mistype-or-low-confidence), not as a recalibration target;
> his Ni-Te is correct and must not move. Genuine recalibration targets are narrow and owner-confirmed
> (the Fi-Se / ISFP cases below). Everywhere this CC says "mistype," read it as "**risk mistype or
> low confidence**."

---

## Embedded context (CC executor environments don't see Cowork memory)

### Canon this CC must respect
- **The type is not the person — trajectory is the identity** (see `docs/canon/type-is-not-the-person.md`).
  A type is a shared coordinate; identity lives in the Goal/Soul/Aim/Grip trajectory. **Two people of
  the same type must never render the same.** Nat and JDrew are both Fi-Se/ISFP and nothing alike —
  that is the product working, not a typing failure. Typing (this whole CC) is *hygiene* so the label
  stops lying; it is NOT the product. Never let a corrected type flatten same-type people into the
  same read.
- **MBTI is a litmus, not the product.** The engine already treats the 4-tuple
  (dominant/auxiliary/tertiary/inferior) as canonical and the `mbtiCode` as a derived label. This CC
  *deepens* that stance: the user-facing primary output becomes the function **shape** (magnitudes +
  breadth), and MBTI is retained but demoted (clinician/secondary view). Do NOT delete the MBTI
  label or the 4-tuple — both stay; MBTI is re-tiered, not removed.
- **Additive over substitutive.** Prefer adding a hydrated shape read + thresholded, cohort-guarded changes
  over rewriting the existing Q-T ranking. Every calibration miss in this repo has traced to a binary
  check where the signal is gradient — prefer more gradient stops, not a new hard rule.
- **Cohort is the validation surface, not synthetic data.** The real-person fixtures in
  `tests/fixtures/cohort-real/` are the calibration anchors. Known truths that MUST hold after this CC:
  - **Jason** = Ni-Te lead (INTJ litmus) — but the hydrated shape should now *also* show his live Ne
    his **high N/T axis range** and any *independently supported* Ne/Ti resonance as edges — rather
    than a bare "INTJ" — while keeping function magnitudes cleanly differentiated (Ni>>Ne, Te>>Ti). He
    stays clean Ni-Te (NOT within-axis broad); his dominant must NOT change.
  - **Daniel** = Si-Te (ISTJ). Dominant must NOT change.
  - **Cindy** = Se-Fi (ESFP). Must NOT invert to an introverted-perceiving dominant.
  - **Harry** = Si↔Ne mirror-axis shape (first-class engine output — not a bug).
  - **Nat** = **Fi-Se (ISFP)** — owner-confirmed (see `feedback_nat_is_fi_se` history / CC-183). This
    CC's introversion-attractor fix should make the *binary same-attitude path* stop preferring
    Si-dominant for Nat. Nat is a FIX TARGET, not a regression guard — but the fix must be principled
    (a real Fi-Se discriminator), not a hardcode for Nat.
  - **JDrew** = owner-confirmed **Fi-Se (ISFP)** — fixture NOW PRESENT
    (`tests/fixtures/cohort-real/jdrew-real.json`, 41 answers, from the admin portable export).
    Verified engine read: **ENFJ, dom=fe aux=ni, confidence=low with 4 flags** (thin-floor,
    dominant-convergence-weak, aux-ambiguous, dominant-mirror). This is a *different, larger* inversion
    than Nat's (Fe-dominant + Ni-over-Se, not Si-dominant), so the same-attitude Fi-Se discriminator
    likely does NOT catch him — he's a **diagnostic** for the general confidence-to-surface fix (a
    4-flag read rendered as a confident pastor), and a candidate CC-190 (Fe/Fi discrimination) case.
    Do NOT force him to ISFP in this CC; the JDrew audit records his before/after, it does not assert.
  - **Connor** = strong-Ne (Ne-lead, ENTP-ward), currently mis-published Ti-dominant INTP.
    **Documented debt in this CC, fix deferred to CC-189** (the dominant-selection rework) — his
    cross-signal already says `ne` but the selector crowns Ti; do NOT retype him here.
  - **Brian** = **Te-lead ENTJ** (owner-confirmed). Currently published Ni-dominant INTJ,
    confidence low, `crossSignalInferredDriver="te"` — an E/I inversion (extravert read as introvert).
    **Documented debt in this CC, fix deferred to CC-189.** Do NOT retype him here.
- **Flag-don't-fix.** There is known pre-existing assessment-audit debt (CC-183/185). Do NOT absorb
  unrelated reds into this CC. Run the full typing-audit set at the bundle boundary and flag any
  red that isn't this CC's target.

### Seven signals to keep distinct (canon — the core of this CC)

The engine conflates things that are not the same. Keep these seven separate everywhere:

| Signal | Meaning |
|---|---|
| **Dominant function** | Native lead orientation |
| **Auxiliary function** | Main support / balancing function |
| **Axis range** | High strength in a domain family, e.g. high Intuition or high Thinking |
| **Within-axis breadth** | Low differentiation inside that family, e.g. Ni≈Ne or Te≈Ti (the `*Broad` flag) |
| **Resonance** | Functions that feel attractive, interesting, or usable — but are not the lead |
| **Contamination** | Functions inflated by stress, role, season, or self-authorship |
| **MBTI code** | Secondary litmus label, derived |

Three canon rules that fall out of this table:
- **Axis breadth ≠ stack order.** High Ni+Ne or Te+Ti is published as *axis breadth*, never as extra
  slots in the canonical 4-tuple and never as automatic Ne/Ti promotion. Jason may show wide
  Intuition and Thinking *axis range*; the correct read is *"Ni-forward, Te-supported, broadly intuitive,
  thinking-led across Te/Ti."* The incorrect read is *"Ni-Te-Ti-Ne"* or a drift toward Ne-Ti/ENTP.
- **Resonance is not dominance.** You can like, understand, use, and be drawn to Ne-Ti without being
  Ne-Ti-led. Ne-Ti feels familiar to Jason because it shares his native altitude (abstraction,
  possibility, logic, architecture) — same neighborhood, not the same lead.
- **Promotion changes stack; breadth enriches shape.** Do NOT use breadth as promotion unless the
  dominant-confidence gates fail. This is the single most important scoring principle in this CC.

**Terminology lock (use this vocabulary consistently everywhere):**
- **Axis range** = high strength in a domain family, e.g. high Intuition or high Thinking.
- **Within-axis breadth** (the `*Broad` flag) = *low differentiation* between the two attitudes inside
  that family, e.g. Ni≈Ne or Te≈Ti.
- **Function magnitude** = allocated function-level strength *after* anti-bleed differentiation.
- Jason has **wide N/T axis range but clean within-axis differentiation** (Ni>>Ne, Te>>Ti). A
  genuinely ambidextrous intuitive is the one with within-axis breadth. "Broad N" must never be read
  the old (axis-range) way where it implies within-axis breadth.

**Jason vs Connor — do NOT treat their live Ne/Ti the same:**
- **Jason:** Ni stays dominant, Te stays auxiliary. His Ne/Ti are *breadth + resonance* signals, and
  are amplified by **designer contamination** (below). They are not promotion targets.
- **Connor:** Ne may be a *true dominant* currently suppressed by stress-inflated Ti/coherence
  scoring — a real dominant-selection bug (fixed in **CC-189**, not here).
Any future dominant correction (CC-189) must therefore require BOTH low-confidence stack instability
AND strong cross-signal dominance evidence — it must never fire merely because a secondary function is
attractive, developed, or high within a broad axis. In THIS CC, neither Jason's resonance nor
Connor's suppressed lead moves any dominant — Connor/Brian are documented debt only.

### Self-author / designer contamination (canon)

For users who understand the model deeply — above all the instrument's designer (Jason) — answers may
reflect *construct awareness* (what they admire, can do, intellectually identify with, or are trying
not to bias) rather than native function order. Treat unusually broad high scores across a
theory-aware user's admired functions as possible **"model-aware resonance"** and route them to the
breadth/resonance fields, NOT to promotion, unless corroborated by behavioral, cross-signal, AND
third-party evidence. (The room-vote / Room Read triangulation is the natural third-party corroborator
— a designer can fool their own self-report but not the room.) Where detectable (e.g. broad
high-scoring across a same-axis pair with clean discriminators still favoring one side), emit a
confidence reason like `model-aware-resonance-suspect` so the prose hedges accordingly. Do NOT
hard-detect "the designer" by identity — this is a pattern caution, not a name check.

### The verified code map (read before editing — line numbers may drift)

**Function scoring (cross-signal):** `lib/crossSignalDriverInference.ts`
- `scoreNi` (~L699), `scoreNe` (~L753), `scoreSi` (~L810, has the documented over-credit gate
  `CC-SCORESI-DISPOSITION-DISCRIMINATOR`), `scoreSe` (~L946), `scoreFe`, `scoreFi`, `scoreTe`,
  `scoreTi`. Aggregated by `scoreFromComponents` (~L684) into `CrossSignalScores` (0–100 each).
- `inferDriverFromCrossSignals(constitution)` (~L1226) → `{inferredDriver, inferredDriverScore,
  scoreGap, scores, disc, evidenceTrace}`.
- `classifyAgreement(qtDirectDriver, crossSignal)` (~L1369) with thresholds
  `DISAGREE_INFERRED_SCORE_FLOOR=60`, `DISAGREE_GAP_FLOOR=20`, `DISAGREE_QT_DRIVER_CEILING=40`
  (~L1365-1367). Returns `agree | disagree-prefer-cross-signal | mirror-axis`. **Today this verdict
  is informational only — it populates `lens_stack.crossSignalAgreement` /
  `crossSignalInferredDriver` but does NOT reorder the published dominant/auxiliary.**

**Lens stack:** `lib/jungianStack.ts` (single source of truth; re-exported from
`lib/identityEngine.ts` ~L3395)
- `aggregateLensStack(signals)` (~L731) — legacy rank path; `poolTopPickRanking` (~L207) ranks a pool
  by count of `rank===1` top-picks (this is the satisficing-fragile input).
- `aggregateLensStackBinary(...)` (~L407) — binary `Q-TB-*` path.
- **The Ni-Te fallback default** (~L633-645): when dom/aux can't be resolved it returns
  `dominant: dominant ?? "ni", auxiliary: auxiliary ?? "te"`. **This is the INTJ attractor.**
- **The same-attitude recovery** (~L585-632, `CC-SENSING-TYPING`): when perceiving + judging leaders
  share attitude (e.g. Nat: perc=Si intro, judg=Fi intro) it prefers `perceivingLeader` as dominant.
  For Nat this yields Si-dom / Fe-aux (ISFJ) — **inverting her real Fi-Se**. This is the introversion
  attractor at the stack level.
- **E/I inference** (~L546-585): `inferredExtravert` from an `extraversion_proxy` signal; used to pick
  which of perceiving/judging leader is dominant.
- `STACK_TABLE` (~L270), `MBTI_LOOKUP` (~L300), `VALID_AUX_BY_DOMINANT`.
- `applyPerceivingAxisCorrection(lensStack, signals, crossSignalScores)` (~L1084) — can flip a
  **perceiving-dominant** to its other perceiving axis when `dominant-convergence-weak`.
  `otherPerceivingAxisPair(dom)` (~L1077) **returns null for judging dominants** — which is exactly
  why Connor (Ti-dominant) can never have his Ne promoted. Gated by
  `PERCEIVING_AXIS_CORRECTION_CS_GAP_FLOOR=20` and `PERCEIVING_AXIS_CORRECTION_MIN_BLOCKS=3`.
- Cross-signal is attached to the stack in `identityEngine.ts` (~L2738-2754,
  `attachCrossSignalInference`), after `aggregateLensStack` (~L2074) and after
  `applyPerceivingAxisCorrection` (~L2660).

**Types:** `lib/types.ts` — `LensStack`, `CognitiveFunctionId`, `ConfidenceLowReason`
(`thin-floor | dominant-convergence-weak | aux-ambiguous | dominant-mirror | ns-valence |
judging-cooccurrence | binary-*`). FunctionPairKey union is **PascalCase** ("NiTe").

**Type additions required by this CC.** Extend the `ConfidenceLowReason` union to include:
`unresolved-shape`, `low-discrimination`, `model-aware-resonance-suspect`. (The
`dominant-corrected-*` / `aux-promoted-*` reason belongs to CC-189, not this CC.)
Add the `functionMagnitudes`, `axisMagnitude`, within-axis `*Broad` flags, `shapeLabel`, and
`shapeEvidence` fields to `LensStack` (all optional so existing callers keep compiling). Do NOT emit
any string reason that isn't in the union; if an existing broader reason is reused instead of a new
one, document why in report-back.

**Cohort regression audits (must stay green / are the acceptance surface):**
`tests/audit/crossSignalDriverInference.audit.ts`, `tests/audit/jungianCompletion.audit.ts`,
`tests/audit/lensConfidenceClassAFix.audit.ts`, `tests/audit/mbtiLabelFix.audit.ts`,
`tests/audit/functionVoiceBinary.audit.ts` (the Nat binary case — **this audit's Nat expectation may
need to move from ISFJ→ISFP as part of this CC; if so, update it deliberately and note it**),
`tests/audit/functionCoverage.audit.ts`.

**Docs:** `docs/cohort-typing-notes.md`, `docs/canon/function-pair-registers.md`.

---

## Scope — four parts

### Part A — Publish the hydrated shape: differentiation first, THEN axis range; demote MBTI

Add a first-class **function shape** to the constitution alongside `lens_stack`. Critical design
constraint (owner-corrected): a person can be **axis-broad but function-clean** — very high on N
generally and T generally, yet a decisively differentiated Ni-Te. That axis-lean is an **attractor**:
if axis strength is allowed to credit *both* within-axis functions, a clean Ni-Te smears into a false
"NiTeTiNe" soup or gets tugged toward the Ne-Ti mirror. **Do NOT surface "breadth" as a flattering
all-functions read.** The output must stay a *clean, differentiated* stack with honest magnitudes,
with axis-range shown as a SECONDARY layer that never dilutes or inverts the differentiated stack.

1. Compute a normalized **8-function magnitude vector** (`lens_stack.functionMagnitudes:
   Record<CognitiveFunctionId, number>`, 0–100). **Anti-bleed principle (load-bearing):** an axis's
   strength is a *budget allocated across its within-axis pair by the differentiating evidence* — NOT
   a bonus added to both. High N with clean Ni-vs-Ne discriminators → most of the budget to Ni, with
   Ne receiving only the support its differentiating evidence *independently earns* (don't force the
   non-lead artificially low — just don't let axis strength alone inflate it). Only a genuinely
   ambidextrous respondent splits it evenly. Same for T→Te/Ti, F→Fe/Fi, S→Se/Si. **Generalize to all
   six letters, E/I included:** a high reading on ANY dichotomy (E, I, S, N, T, or F) must not
   gravitate to the whole family — high extraversion must not inflate every extraverted function, high
   introversion every introverted one, high F both Fe and Fi. Magnitude on a letter is a budget split
   by differentiating evidence, never a bonus paid to both members. Axis/letter magnitude must never
   inflate the *subordinate* member.
2. Expose two SEPARATE things, not conflated:
   - `axisMagnitude: {intuition, sensing, thinking, feeling}` (0–100) — Jason reads **high** intuition
     and **high** thinking here (honors the real axis-lean / why Ne, Ti feel familiar to him).
   - `withinAxisDifferentiation` per axis + a `*Broad` flag that means **LOW differentiation
     (Ni≈Ne)** — i.e. genuine function ambidexterity, which Jason is **NOT**. For Jason:
     `intuitionBroad=false`, `thinkingBroad=false` (clean), with Ne and Ti magnitudes **low**.
3. `shapeLabel` (NOT the MBTI code) expresses BOTH layers honestly — e.g. Jason ⇒
   `"Ni-Te (clean stack) · wide N/T axis range"`; a truly ambidextrous person ⇒
   `"intuition-broad (Ni≈Ne)"`. The MBTI `mbtiCode` stays on the object, marked secondary/litmus.
   **Label format (so labels stay structured, not ornamental prose)** — name in order: (a) the
   differentiated spine, e.g. `Ni-Te`; (b) stack confidence, e.g. `clean stack` / `low-confidence` /
   `mirror-axis` / `unresolved`; (c) axis range only when meaningful, e.g. `wide N/T axis range`;
   (d) within-axis breadth only when differentiation is genuinely low, e.g. `Ni≈Ne`.
4. Do NOT change what `dominant`/`auxiliary` resolve to in Part A (that's Parts B/C). Part A is
   additive output only — but the anti-bleed allocation in (1) must be the source of the magnitudes
   so axis-lean can never masquerade as a second dominant.
5. **Render note (for the downstream shape prose, so the fields carry the right distinction):** the
   two same-axis motions are qualitatively different and the shape read should be able to say so —
   *Ne-Ti proliferates possibilities to test coherence; Ni-Te collapses complexity toward a usable
   governing pattern.* A broad-NT person can enjoy both, but the hydrated read names their **default
   motion**, not their range. (Prose implementation itself can be a follow-on; Part A just needs to
   expose fields rich enough to support it.)
6. **Provenance — expose enough for the prose layer to stay honest.** Magnitudes + flags alone let a
   downstream renderer talk like mush. Attach a `shapeEvidence` structure carrying, per axis: the
   `axisMagnitude`, the `differentiationGap`, the `broad` flag, the winning function (`leader`) and
   its `partner`; plus top-level `source` (`"cross-signal" | "qt-blend" | "hybrid"`),
   `resonanceFlags?: CognitiveFunctionId[]` (same-axis partners that are resonance, not real breadth),
   and `contaminationFlags?: ConfidenceLowReason[]`. The report layer must be able to tell high axis
   range from clean differentiation, which function actually won, whether a same-axis partner is real
   breadth vs. mere resonance, and whether contamination was suspected. (Exact TS is the executor's
   call; these are the required distinctions.)
7. **Confidence governs the label (the general fix).** When `confidenceLowReasons.length >= 2` (a
   multi-flag read — JDrew has 4), the `shapeLabel` MUST foreground uncertainty (e.g. lead with
   `low-confidence · tentative`) and the `mbtiCode` must be marked tentative/hedged, never presented
   as a settled type. The engine already computes the flags; this makes them *reach the surface* so a
   "possibly X, possibly quite different" read can never render as a confident finished portrait.
   This is the single most important hygiene behavior; it applies to every fixture, not just the
   named ones.

### Part B — Kill the two attractors

1. **Remove the Ni-Te ambiguity default.** At the `dominant ?? "ni", auxiliary ?? "te"` fallback
   (jungianStack.ts ~L633), stop defaulting to the architect stack. Instead:
   - resolve the dominant from the *actual strongest scored function* available (perceiving-pool or
     judging-pool leader by magnitude), and only if truly no signal exists, emit an explicit
     **`unresolved-shape`** confidence reason. **Concrete fallback (don't just swap one fake type for
     another):** if the 4-tuple requires syntactically valid functions, retain a placeholder ONLY
     behind `confidence=low` + `unresolved-shape`, and do NOT derive a confident user-facing label or
     `mbtiCode` from it — prefer `mbtiCode="UNRESOLVED"` if the type system allows, otherwise keep the
     placeholder internal/hidden and render the shape as explicitly uncertain. The placeholder must
     not privilege Ni or Te.
2. **Decontaminate introversion from perceiving credit (the Fi-Se / Nat fix).** In the same-attitude
   recovery (~L585-632), stop *unconditionally* preferring `perceivingLeader` as dominant. Add a
   discriminator: when the judging leader is a **Feeler with a strong Fi signature** and the
   perceiving leader is an introverted-perceiving function whose cross-signal score is **not**
   clearly above the extraverted-perceiving partner, prefer the **judging (Fi) function as dominant**
   and the extraverted perceiving partner as aux → Fi-Se (ISFP) rather than Si-Fe (ISFJ). Gate it on
   cross-signal evidence (Se magnitude vs Si magnitude) so it's a principled Fi-Se detector, not a
   Nat hardcode. Keep `confidence=low` where the picks are structurally inconsistent, but the
   published stack should **prefer the Fi-Se hypothesis when the Fi signature and Se-vs-Si evidence
   clear the discriminator**, rather than defaulting to Si-Fe because introversion bled into
   perceiving credit.
3. Neither change may touch the architect cohort (Jason/Brian/Brad/Daniel do not hit the
   same-attitude-leaders branch; verify empirically).

### Part C — Document the Connor/Brian dominant-selection debt (NO FIX IN THIS CC → CC-189)

**Do NOT ship any promotion mechanism in this CC.** Verified 2026-07-03: every cohort fixture returns
`lens_stack.crossSignalAgreement === "agree"`, so the `classifyAgreement` 60/20/40 gate fires for
nobody — a cross-signal promotion path would be a no-op and fix neither target. The real bug is
upstream in `aggregateLensStack` dominant-selection: for **Connor** the Q-T-direct driver AND
cross-signal BOTH say `ne`, yet it publishes `ti`-dominant (INTP); for **Brian** both say `te`, yet
it publishes `ni`-dominant (INTJ). The selector crowns the mirror / introverted-leaning function over
the agreed driver.

Why it can't be a one-liner here: **Jason is also `dom=ni, xsig=te, agree`** — and his Ni is CORRECT
with Te a genuine auxiliary. So "honor the agreed driver" would wrongly flip Jason to ENTJ. The
discriminator between "agreed driver = suppressed true lead" (Connor/Brian) and "agreed driver =
strong real auxiliary" (Jason) is unknown and needs a real dominant-selection investigation.

**Scope for THIS CC:** only *document* this as known debt (see the `dominant-selection-debt-connor-brian`
audit), so it can't silently regress. The fix is deferred to **CC-189 — Dominant-Selection Rework
(Connor/Brian)**. Do not retype Connor or Brian here.

### Part D — Satisficing robustness

The `poolTopPickRanking` (jungianStack.ts ~L207) leans on `rank===1` counts, which is fragile when
testers "just pick the top one."

1. Blend the **full ranking distribution** into pool ranking, not just top-pick count: weight rank-1
   heavily but give rank-2/3 partial credit (a gradient, per the gradient-calibration canon), so a
   single lazy top-pick can't swing a pool.
2. Add a **flat-response guard**: when a respondent's Q-T picks show low discrimination (e.g. the same
   position chosen across blocks, or near-tied pools everywhere), raise a
   **`low-discrimination`** confidence reason and widen the hedge — do NOT invent a shape from noise.
3. This part is calibration-sensitive: it must not move any canonical cohort dominant. Treat it as
   confidence-widening + tie-robustness, not re-typing.

---

## Audit assertions (new + extended)

New audit `tests/audit/typingHydration.audit.ts` (invocable `npx tsx …`):
1. `hydration-shape-present` — every cohort fixture yields `functionMagnitudes` (8 keys, 0–100) and a
   non-empty `shapeLabel` distinct from `mbtiCode`.
2. `hydration-jason-clean-not-broad` — Jason: `axisMagnitude.intuition` and `.thinking` **high**,
   but `intuitionBroad=false` AND `thinkingBroad=false`; `functionMagnitudes.ni` **>>** `.ne` and
   `.te` **>>** `.ti` (differentiated, anti-bleed working — axis-lean did NOT inflate Ne/Ti);
   dominant stays `ni`, mbtiCode stays `INTJ`; shapeLabel conveys clean Ni-Te + wide axis range.
3. `hydration-anti-bleed` — a constructed high-N/high-T input WITH clean Ni/Te discriminators must
   NOT produce elevated Ne or Ti (no false NiTeTiNe smear, no Ne-Ti mirror flip); an input with
   genuinely even Ni/Ne evidence DOES set `intuitionBroad=true`. Proves budget-allocation, not bonus.
4. `breadth-not-inflation` — Jason may show high N/T `axisMagnitude` and some Ne/Ti resonance
   metadata, but Ne/Ti must NOT become elevated `functionMagnitudes` unless within-axis
   differentiators independently support them, and his dominant/aux stay `ni`/`te`. (Anti-bleed at the
   magnitude level; no promotion mechanism exists in this CC to test.)
5. `attractor-no-nite-default` — a constructed ambiguous/empty-signal input does NOT return
   `dominant="ni"`/`auxiliary="te"`; it returns `unresolved-shape` (or a magnitude-led dominant),
   never a confident INTJ (see the unresolved-shape fallback rule in Part B).
6. `attractor-nat-fi-se` — Nat resolves dominant `fi`, auxiliary `se` (ISFP), NOT Si-Fe/ISFJ.
7. `jdrew-diagnostic-if-fixture-present` — IF `tests/fixtures/cohort-real/jdrew-real.json` is
   available, RECORD JDrew's before/after lens (his live read is Fe-Ni room-reader; owner truth is
   ISFP/Fi-Se). Do NOT hard-assert Fi-Se: if the CC-188 Fi-Se discriminator catches him, note it; if
   he stays Fe-Ni, flag him as a **CC-189 dominant-selection case** (his mistype is a different, larger
   inversion than Nat's). If the fixture is absent, the audit **skips with an explicit note** (does not
   fail). Adding the fixture is itself a report-back item.
8. `dominant-selection-debt-connor-brian` — Connor and Brian are explicitly flagged as known
   dominant-selection debt: both show Q-T-direct + cross-signal evidence for a driver (`ne` / `te`)
   that is not their published dominant. This audit **documents** the current (wrong) output and
   guards against silent regression, but does NOT require retyping in this CC.
9. `promotion-not-implemented` — no cross-signal promotion path is active in this CC;
   Jason/Daniel/Cindy/Ashley dominants unchanged.
10. `satisficing-flat-guard` — a synthetic flat/lazy response set raises `low-discrimination` and does
   NOT emit a confident dominant.
11. `mbti-demoted-retained` — `mbtiCode` still present on every fixture (litmus retained), and the
   4-tuple is intact.

Extend existing audits deliberately:
- `functionVoiceBinary.audit.ts` — move Nat's expectation ISFJ→ISFP (note the change in report-back).
- `crossSignalDriverInference.audit.ts` / `jungianCompletion.audit.ts` / `lensConfidenceClassAFix.audit.ts`
  / `mbtiLabelFix.audit.ts` — must stay green with only **Nat (→ISFP)** moving as a committed fix.
  JDrew moves to ISFP ONLY if his fixture is added AND the discriminator genuinely catches him
  (otherwise he's flagged for CC-189, not forced). Connor and Brian keep their current (wrong)
  published type in this CC (documented debt). Any other cohort dominant that moves is a REGRESSION.

---

## Do NOT
1. Do NOT delete the MBTI `mbtiCode` or the dominant/aux/tertiary/inferior 4-tuple. MBTI is demoted,
   not removed.
2. Do NOT add new survey questions in this CC. Assessment redesign is a separate follow-on; this CC
   only makes the current engine more honest about shape, uncertainty, attractors, and response
   quality. (Owner has already improved the questions; this is engine-side.)
3. Do NOT hardcode Nat or JDrew by name/fixture-id anywhere in engine logic — the Fi-Se fix must be a
   principled discriminator that happens to correct them.
4. Do NOT touch the `classifyAgreement` thresholds (60/20/40) or the min-blocks floor (3) — the
   Connor/Brian rework (CC-189) will decide those; leave them alone here.
5. Do NOT move any canonical cohort dominant other than **Nat → Fi-Se, and JDrew → Fi-Se only if his
   real fixture is added and the same discriminator supports it.** Connor and Brian are flagged, not
   fixed, in this CC. Jason stays Ni, Daniel Si, Cindy Se, Ashley Ni, Harry mirror-axis.
6. Do NOT change the OCEAN/disposition inputs or the `scoreSi` faith-gate from CC-SCORESI (out of scope).
7. Do NOT rewrite the Q-T ranking wholesale — Part D is a gradient + tie-robustness overlay, additive.
8. Do NOT produce "over-hydrated mush." A high-N/high-T person must not become an undifferentiated NT
   cloud, and breadth/resonance must never append functions to the 4-tuple or reorder the stack. Clear
   spine, rich edges — always.
9. Do NOT commit or push (sandbox: prepend `rm -f .git/index.lock` to any git command handed to Jason).

## Acceptance
- Hydrated shape (`functionMagnitudes`, `axisMagnitude`, within-axis differentiation/breadth flags,
  `shapeLabel`, `shapeEvidence`) present on every constitution; Jason reads high-N/high-T axis range
  with a clean Ni-Te spine while staying INTJ underneath — he must NOT read as
  intuitionBroad/thinkingBroad unless within-axis differentiation is actually low.
- Ambiguous typing no longer defaults to Ni-Te; it hedges as `unresolved-shape` or resolves by real
  magnitude **without emitting a confident fake INTJ**.
- Nat resolves Fi-Se (ISFP), and JDrew resolves Fi-Se if his real fixture is available and the same
  principled discriminator supports it.
- Connor and Brian are documented as dominant-selection known debt, **not fixed** in this CC; no no-op
  promotion mechanism is shipped.
- Satisficing/flat responses widen confidence instead of inventing a type.
- No canonical cohort dominant moves except the owner-confirmed Fi-Se corrections above.
- `npx tsc --noEmit` + `npm run lint` + `npm run build` clean; the full typing-audit set green (with
  the deliberate Nat→ISFP, and JDrew→ISFP if fixture-added, expectation moves); flag any unrelated
  red, don't fix it here.

## Report back
1. The `functionMagnitudes` / `axisMagnitude` / within-axis flags / `shapeLabel` / `shapeEvidence`
   shape (types + where computed) and Jason's hydrated read (magnitudes + axis-range + breadth flags +
   shapeLabel + retained mbtiCode) — showing clean Ni>>Ne, Te>>Ti.
2. The exact code removed/replaced at the Ni-Te fallback (and the `unresolved-shape` fallback that
   replaced it), and the new same-attitude Fi-Se discriminator (with the Se-vs-Si gate that makes it
   principled).
3. Whether `jdrew-real.json` was added; if so JDrew's before/after (→ISFP); if not, say so.
4. Part D: how full-distribution weighting + the flat-response guard work, and proof no cohort
   dominant moved because of it.
5. Which audit expectations changed deliberately (Nat ISFJ→ISFP; JDrew→ISFP if added) vs. which
   stayed green; and confirmation Connor/Brian were left as documented debt (not retyped).
6. tsc / lint / build + full audit pass/fail, with any unrelated reds flagged (not fixed).
7. Cohort dominant table before/after for all real fixtures — proof only the Fi-Se corrections moved.

---

**Architectural test for this CC:** run the cohort. Jason still types INTJ underneath but now *reads*
as high-N/high-T axis range with a clean Ni-Te spine — not a bare architect stereotype and not an
Ne/Ti smear. Nat, and JDrew if fixture-backed, come out Fi-Se instead of Si-Fe/Ni-Fe. Connor and
Brian are explicitly flagged as unresolved dominant-selection debt rather than silently misread or
"fixed" by a no-op promotion gate. If those things are true and the cohort is otherwise stable, the
hydration is doing real work: the engine is surfacing unique shape and uncertainty instead of the
nearest stereotype.
