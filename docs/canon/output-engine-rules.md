# Output Engine Rules v1

## Purpose

Specify how the engine derives the Inner Constitution's outputs (Gift / Blind Spot / Growth Edge / Risk Under Pressure per Shape card, plus synthesized Top Gifts, Top Risks, Growth Path, Relationship Translation, and Conflict Translation) from the underlying signals. This file is the bridge between `signal-library.md` (raw signal data) and `inner-constitution.md` (rendered output).

It does not specify final user-facing prose — that's the Inner Constitution's job. It specifies the **rules** by which prose is generated: what combines with what, what gift vocabulary the engine may borrow from, how a strength becomes a blind spot, how the four SWOT cells per card are computed.

The two anchor lines from `shape-framework.md` govern everything in this file:

> **Your blind spot is not the opposite of your gift. It is your gift without balance.**

> **Your gift is your shape in health. Your blind spot is your shape under distortion. Your opportunity is your shape under discipline. Your threat is your shape under pressure.**

Every derivation rule below is written so that the resulting output preserves the spirit of those lines.

---

## The Core Formula

The engine computes per-card and cross-card outputs using six derivation rules. Each rule is named, has inputs, and produces an output type.

### Rule 1 — Gift derivation

**Inputs:** Lens signals (cognitive function stack from Q-T1–Q-T8) + Path signals (Agency from Q-A1, Q-A2 + indirect signals from Compass and Gravity).

**Output:** A per-card Gift cell — what this aspect of the user's shape helps them do unusually well.

**Rule:** `Gift(card) = primary_signal_pattern(card) + Lens_inflection + Path_orientation`

Plain language: the Gift on each card is the strength that emerges when that card's signal pattern is operating in its native register, inflected by the user's Lens (how they perceive) and Path (where their energy moves).

**Example:** A user with `truth_priority` ranked #1 on Compass (Sacred Values), `ti` dominant on Lens (Temperament), and `proactive_creator` on Path (Agency) has a Compass Gift around courageous truth-precision: the strength is "willingness to absorb relational cost in service of a clearly-articulated principle."

#### Default fallback gift category per dominant function (CC-034, 2026-04-29)

Rule 1's `primary_signal_pattern(card)` runs through `pickGiftCategory()` in `lib/identityEngine.ts`. The function applies a heuristic priority ladder of conditional category routes (e.g., Ti + Truth or Knowledge → Precision; Fe + Family or Faith → Harmony). When *no* conditional route's predicate matches, every dominant function now resolves to a **function-specific fallback category** rather than dropping to the generic Pattern default:

| Dominant function | Fallback gift category |
|---|---|
| Ni | Pattern |
| Ne | Pattern |
| Si | Stewardship |
| Se | Action |
| Ti | Precision |
| Te | Generativity *(when no creator-agency / system-responsibility match — Builder remains the discriminating route otherwise)* |
| Fi | Integrity |
| Fe | Harmony |

Pre-CC-034, Si / Se / Ti / Te / Fi / Fe dominants whose Compass / Gravity / Agency / Fire signals didn't trigger a conditional route fell through to a generic `return "Pattern"` fallback; combined with `categoryHasSupport`'s Ne/Ni-only Pattern filter, this either rendered intuitive-function Pattern prose to non-Ne/Ni dominants or filtered Pattern out entirely at the per-card path, leaving thin Mirror prose for those users. The CC-034 fallback table eliminates the generic-Pattern landing for non-Ne/Ni dominants.

**Conditional routes take priority.** The fallback fires only when no conditional predicate matches. Ti + Truth still routes to Precision through the conditional path (line 1707) as before; the new Ti fallback at the bottom of the ladder catches Ti dominants without Truth or Knowledge in their Compass top-2.

**Per-card support filter.** `categoryHasSupport()` was widened so Stewardship / Action / Precision / Generativity each return `true` for their fallback function unconditionally (e.g., `dom === "si"` always supports Stewardship). Integrity already had unconditional Fi support; Harmony already had unconditional Fe support. These two needed no edit. Pattern's support clause stays Ne/Ni-only — Pattern is still correctly intuitive-function-only at the support-filter level.

This is **Tier 1** of a three-tier cognitive-function-parity program. CC-034 raises the floor (no function ever reads as generic Pattern prose). CC-029 raises the middle by extending the cross-card pattern catalog so Si / Se / Ti / Te / Fi / Fe pattern coverage matches Ni / Ne. CC-036 raises the ceiling by adding secondary discriminating routes so Si / Se / Ti / Te reach the same 3-category breadth as Ni / Fi / Fe.

#### Secondary discriminating routes per dominant function (CC-036, 2026-04-29)

CC-036 closes the cognitive-function-parity gap at the routing layer by widening Si / Se / Ti / Te beyond their CC-034 defaults. These routes are still evaluated by `pickGiftCategory()` in priority order: most-specific condition first, function-default last.

Gift-category routes per dominant function (post-CC-036):

- Ni: Pattern (default), Discernment (truth + bearing-cost), Meaning (faith)
- Ne: Pattern (default), no secondary routes (deliberate — Ne's breadth is in Pattern itself)
- Si: Stewardship (default), Endurance (high weather), Discernment (truth/knowledge)
- Se: Action (default), Advocacy (justice), Builder (creator-agency or system-resp)
- Ti: Precision (default), Discernment (truth/knowledge + bearing-cost), Builder (creator-agency or system-resp)
- Te: Generativity (default), Builder (creator-agency + system-resp/authority-resp), Precision (truth/knowledge)
- Fi: Integrity (default), Harmony (family or faith), Advocacy (justice + responsibility split)
- Fe: Harmony (default), Stewardship (stability or family), Advocacy (justice + responsibility split)

Routes are evaluated in priority order: most-specific condition first, function-default last.

#### CC-038 — Aux-pair routing layer (added 2026-04-29)

CC-038 adds a fourth routing layer keyed on the user's **auxiliary** function (not just the dominant). Sixteen canonical Jung function-stack pairs (NeTi, NeFi, NiTe, NiFe, SeTi, SeFi, SiTe, SiFe, TeNi, TeSi, TiNe, TiSe, FeNi, FeSi, FiNe, FiSe) each route to a gift category that composes with the register's cognitive shape.

**Routing priority** (highest first):

1. **Existing condition-driven routes** (CC-011b / CC-022 / CC-026) — Ni+faith → Meaning; Ti+truth/knowledge → Precision; etc.
2. **CC-036 signal-conditioned secondary routes** — Si+truth → Discernment; Se+justice → Advocacy; Se+creator or Ti+creator → Builder; Te+truth → Precision.
3. **CC-038 aux-pair routes** (NEW) — sixteen `dominant + auxiliary` lookups via `getFunctionPairRegister(stack)`.
4. **Ne / Ni → Pattern baseline** — non-canonical Ne or Ni stacks fall through here.
5. **Te aspiration → Generativity** (existing CC-022 route).
6. **CC-034 function-specific fallbacks** — Si → Stewardship, Se → Action, Ti → Precision, Te → Generativity, Fi → Integrity, Fe → Harmony.
7. **Generic Pattern fallback** (legacy; rarely reached post-CC-034).

The aux-pair layer is **structural** discrimination (cognitive structure / durable trait), distinct from CC-036's **signal-conditioned** discrimination (state and values). Both layers cooperate. CC-036's routes still win when their predicates match; aux-pair fires when no signal-condition has matched; CC-034 fallback fires when neither signal-condition nor canonical aux-pair has matched (e.g., when the user's Lens stack has a non-canonical pair like Si + Ne).

Each register entry carries an `analog_label` (v3 locked single-word identity post-CC-038-prose; e.g., *the prober*, *the architect*, *the seer*), a `short_description`, plus three editorial expression fields: `healthy_expression`, `distorted_expression`, `product_safe_sentence`. The `gift_category` field is canonical and locks at CC-038. Six aux-pair routes land on the same gift category as the corresponding CC-034 fallback (SeFi, SiTe, TiSe, FeSi, FiNe, FiSe) — these "redundant" routes are kept because they carry the load-bearing analog metadata that downstream prose layers (Mirror's `product_safe_sentence` line; future OCEAN / Drive / Path cross-references) read separately.

This is *not* MBTI integration. Engine surfaces the register analog (e.g., *"the architect"*) rather than the typological label (*"INTJ"*). Full architectural framework, the 16 pairs with v3 labels and locked expression sentences, and the cross-reference futures live in `docs/canon/function-pair-registers.md`.

#### CC-038-prose canon principles (added 2026-04-29)

CC-038-prose locks four canon principles that govern this layer (and any future analog/register taxonomy in this instrument). Each is documented in full at `docs/canon/function-pair-registers.md`; brief cross-references here:

1. **A Lens pair is a movement, not a type.** The model never says *"you are Ni-Te."* It says *"Your Lens has an architect quality,"* then explains the movement in ordinary language. This is the operational guardrail that distinguishes the register taxonomy from MBTI typology. (See `function-pair-registers.md § Opening canon`.)
2. **Driver / Instrument framing replaces J/P shorthand.** The Driver is the first voice in the pair (center of gravity); the Instrument is the second (supporting method). J/P shorthand fights Jung's actual driver structure (INTP is Ti-driven though MBTI types it P; INTJ is Ni-driven though MBTI types it J), so canon rejects J/P. (See `§ Driver / Instrument framing canon`.)
3. **Mirror pairs share gift categories but should not be deduplicated.** Ni-Te and Te-Ni both route through Builder, but Ni-Te begins with the long-range pattern and seeks structure while Te-Ni begins with structure and aims it through the long-range pattern. Three doubled-up gift categories in v3: Builder (NiTe + TeNi), Stewardship (SiTe + TeSi), Integrity (FiNe + FiSe). The prose layer must surface the asymmetry through analog labels and `short_description` differences, even when `gift_category` is identical. (See `§ Mirror-pair asymmetry canon`.)
4. **Single-word inhabited identities for register-class labels.** Future register-class labels prefer single-word inhabited identities; the `short_description` carries specificity. Compound labels register as engineered phrases unless the compound names a real distinction the description cannot land. (See `§ Single-word-label canon`.) Twelve of the v3 labels are single-word; three retain compound form (family-tender, troubleshooter, kinkeeper) because each reads as an inhabited identity rather than an engineered phrase.

The `product_safe_sentence` template — *"Your Lens has a [analog] quality: you appear to [observable behavior] ..."* — is the locked Mirror grammar. CC-038-prose wires this sentence into MirrorSection's Top 3 Gifts elaboration. Future surfaces (OCEAN cross-reference prose, tension prose, Mirror prose extensions) compose around this template.

#### CC-038-body-map (added 2026-04-29)

CC-038-body-map landed the body-map route column on `FUNCTION_PAIR_REGISTER`. Each register now carries a `body_map_route: { from: ShapeCardId; to: ShapeCardId }` field describing the user's cognitive movement through the 8-card body model — *Path → Speak* for Ni-Te (the architect), *Heart → Fire* for Fi-Se (the witness), and so on. Engine-side metadata; downstream cross-reference CCs (CC-040+) compose user-facing prose from it.

**Agency vocabulary resolution.** The CC-038-prose workshop draft's body-map column referenced "Agency" in four cells (Te-involved pairs) without that name in the stated 8-card body-map vocabulary. Resolution: **Agency = Conviction (user-facing: Speak)**. Te externalizes operational structure through stance-taking, and Conviction is the body-position that canonically carries that movement. Full rationale at `function-pair-registers.md § Agency vocabulary resolution`.

**Engine-codename / user-facing-metaphor discipline.** The `body_map_route` field stores `ShapeCardId` codenames (`path`, `lens`, `compass`, `conviction`, `gravity`, `trust`, `fire`, `weather`). User-facing prose composes the metaphor names: Heart / Listen / Speak / Gravity / Lens / Weather / Fire / Path. The translation table is canonical at `function-pair-registers.md § User-facing metaphor → ShapeCardId translation`. Don't conflate; engine consumers always use the codename.

**Si-Fe asymmetry.** Si-Fe's route is `compass / trust` (Heart → Listen) rather than `gravity / trust` despite Si being the driver — the active movement of the family-tender register is sacred-care to relational-attention, not continuity to relational-attention. Documented as deliberate canon at `function-pair-registers.md § Si-Fe asymmetry note`.

The `body_map_route` field is additive metadata. CC-038-body-map does not surface it to users; rendering is deferred to a follow-on UI CC if Jason chooses to make the body-map visible. The data structure is in place for CC-040+ cross-reference work.

### Rule 2 — Blind Spot derivation

**Inputs:** The Gift output from Rule 1, plus Weather signals (Formation + Context).

**Output:** A per-card Blind Spot cell — what this same strength can distort when overused, threatened, or immature.

**Rule:** `Blind_Spot(card) = Gift(card) × overuse_under(Weather_pressure)`

Plain language: the Blind Spot on each card is the Gift expressed without balance, often shaped by the weather conditions the user has adapted to.

**Example:** The Compass Gift "courageous truth-precision" becomes the Blind Spot "weaponized correctness" when overused — the same strength applied without timing, translation, or relational care.

This rule encodes the canonical line: *the Blind Spot is not the opposite of the Gift. It is the Gift without balance.*

### Rule 3 — Conviction Posture derivation

**Inputs:** Compass signals (sacred-value rank) + Fire signals (pressure response).

**Output:** Conviction card output — how the user holds belief and what kind of cost their belief tolerates.

**Rule:** `Conviction_Posture = Compass_top_value × Fire_signature`

Plain language: a person's Conviction is what their Compass would still defend when their Fire is real. The intersection reveals whether the person is principled, relational, evidence-driven, identity-driven, pragmatic, or prophetic.

**Conviction style vocabulary** (interpretive, not canonical labels):

- **Principled** — high Compass + Direct Fire. Holds the line when compromise would corrupt the issue.
- **Relational** — high Fe Lens + Soften Fire. Preserves people while navigating disagreement.
- **Evidence-driven** — Te or Ti Lens + Express-carefully Fire. Updates when facts change.
- **Identity-driven** — Fi Lens + Direct Fire. Lives with conscience as the deciding court.
- **Pragmatic** — Te Lens + Adapt-under-pressure Fire. Focuses on workable outcomes.
- **Prophetic** — Ni Lens + Accept-risk Fire. Names what others avoid; lives with the cost.

### Rule 4 — Conflict Style derivation

**Inputs:** Compass signals + Fire signals + Lens signals.

**Output:** A cross-card reading of how this user shows up in conflict — what they protect, what they pay for, and how they perceive the conflict.

**Rule:** `Conflict_Style = Compass_top + Fire_top + Lens_dominant`

Used in the Relationship Translation and Conflict Translation sections of the Inner Constitution. Tells the user how others may experience them and how to translate their shape across difference.

### Rule 5 — Growth Edge derivation

**Inputs:** Blind Spot output + signals the user does NOT strongly emit (the missing values, missing Lens functions, underweighted attributions).

**Output:** A per-card Growth Edge cell — the next development move.

**Rule:** `Growth_Edge(card) = Blind_Spot(card) balanced by missing_signal(opposite_register)`

Plain language: the Growth Edge for each card is the Blind Spot's medicine — usually integration of the value, function, or attribution that the user underweights. The growth move is rarely "do less of your Gift" and almost always "borrow from the part of yourself you've muted."

**Example:** A user with the Compass Blind Spot of "weaponized correctness" has a Growth Edge that borrows from underused Fe (relational attunement) — the move is "translate truth before delivering it; let timing and tone serve the principle rather than betray it."

### Rule 6 — Risk Under Pressure derivation

**Inputs:** Gift output + Fire signals + Weather signals (current load).

**Output:** A per-card Risk Under Pressure cell — how this card's shape can betray the user under cost.

**Rule:** `Risk(card) = Gift(card) × Fire_signature × Weather_current_load`

Plain language: under sustained pressure (Fire) and overload (Weather), a person's Gift can collapse into a smaller version of itself. The Risk cell names that collapse.

**Example:** The Lens Gift "pattern discernment" under pressure + overload may collapse into "over-reading the future" — same capacity, applied without ground truth, becomes paranoia or strategic catastrophizing.

---

## The Twelve Gift Categories (Vocabulary)

The engine uses the following vocabulary when generating Gift cell prose. **These are not canonical labels.** The engine writes sentences that draw from the vocabulary; it does not surface the labels verbatim. A user reads "you bring a pattern-discernment gift — you tend to see the deeper shape of a problem before others do," not "Gift: Pattern Discernment ★."

The "underlying signal pattern" column below is illustrative rather than exhaustive. The canonical routing matrix for dominant-function gift breadth lives in Rule 1 above.

| Vocabulary | Underlying signal pattern | Plain meaning |
|---|---|---|
| Pattern | Ni or Ne dominant + high Compass abstraction values | Sees what is coming or what connects |
| Precision | Ti dominant + Truth or Knowledge in Compass top-2 | Clarifies what is true or logically clean |
| Stewardship | Si or Fe dominant + Stability or Family in Compass top-2 | Preserves what matters across time |
| Action | Se or Te dominant + Freedom or Justice in Compass top-2 | Moves when others freeze |
| Harmony | Fe dominant + low individual_responsibility | Reads the room and repairs trust |
| Integrity | Fi dominant + Truth or Faith in Compass top-2 | Refuses to betray conscience |
| Builder | Te dominant + proactive_creator + Knowledge or Achievement in Compass | Turns ideas into working systems |
| Advocacy | Fi or Fe + Justice in Compass top-1 + systemic_responsibility | Protects the vulnerable or unfairly treated |
| Meaning | Ni dominant + Faith or Truth in Compass top-2 | Connects events to deeper purpose |
| Endurance | Si dominant + high_pressure_context + responsibility_maintainer | Carries responsibility through difficult conditions |
| Discernment | Ti or Ni + low institutional_trust | Detects falsehood, manipulation, or incoherence |
| Generativity | Fe or Fi + Family or Compassion in Compass + relational_investment | Helps others become more capable |

A user typically has **2-4 primary Gifts** drawn from this vocabulary, surfaced in the Top Gifts section of the Inner Constitution.

---

## Gift-to-Blind-Spot Pairs

Every Gift has a corresponding Blind Spot — the same strength under distortion. This table is the canonical pairing the engine uses when computing Rule 2.

| Gift vocabulary | Blind Spot under distortion |
|---|---|
| Pattern | Over-reading the future; private interpretation as fact |
| Precision | Weaponized correctness; relational tone-deafness |
| Stewardship | Fear of disruption; mistaking familiarity for truth |
| Action | Ignoring patterns and precedent; impulsive escalation |
| Harmony | Avoiding necessary truth; consensus-capture |
| Integrity | Private moral certainty; hard-to-reach |
| Builder | Instrumentalizing people; confusing effectiveness with goodness |
| Advocacy | Moral suspicion; assuming disagreement equals moral failure |
| Meaning | Over-spiritualizing practical problems |
| Endurance | Carrying what is not yours; survival mistaken for identity |
| Discernment | Cynicism; capture in conspiracy or paranoia |
| Generativity | Controlling others "for their own good" |

The canonical line worth surfacing in the Inner Constitution: *Your blind spot is your gift without balance.*

---

## Cross-Card Pattern Examples

These are illustrative readings the engine can use as templates. They are not exhaustive — the engine is allowed to generate readings beyond this table when signal patterns warrant. The table exists to anchor the kind of insight the Inner Constitution should be capable of producing.

### Example 1 — Strong Truth Compass + Fe Lens + Silent Fire

**Likely shape:** "You care deeply about truth, but your relational radar is so strong that you may silence yourself to preserve belonging."

- **Gift:** Diplomatic truth-teller; can preserve relationships in conflict.
- **Blind Spot:** May resent people for not knowing what you never said.
- **Growth Edge:** Say the true thing earlier, softer, and cleaner.

### Example 2 — Freedom Compass + Individual Gravity + Low Institutional Trust

**Likely shape:** "You are built to resist control. You notice coercion quickly and instinctively protect agency."

- **Gift:** Hard to manipulate; entrepreneurial; courageous around authority.
- **Blind Spot:** May interpret needed structure as oppression.
- **Growth Edge:** Distinguish control from coordination.

### Example 3 — Family / Loyalty Compass + Stable Weather + Soften Fire

**Likely shape:** "You preserve belonging and continuity. You are the person who keeps the room from breaking."

- **Gift:** Reliable; loyal; relationally protective.
- **Blind Spot:** May protect peace at the expense of truth.
- **Growth Edge:** Learn that truth, spoken carefully, can serve loyalty rather than betray it.

### Example 4 — Justice Compass + System Gravity + Direct Fire

**Likely shape:** "You are wired to confront unfairness and name structural failure."

- **Gift:** Advocate; reformer; courage under conflict.
- **Blind Spot:** May assume disagreement equals moral failure.
- **Growth Edge:** Leave room for ignorance, complexity, and partial responsibility.

### Example 5 — Te Lens + Work Path + High Dependence Weather

**Likely shape:** "You become useful under pressure and may confuse carrying the load with being fully alive."

- **Gift:** Builder; responsible; operationally serious.
- **Blind Spot:** May not notice emotional absence if the system is still working.
- **Growth Edge:** Let love be measured by presence, not only provision.

---

## CC-037 — OCEAN Disposition Map (added 2026-04-29)

CC-037 adds a derived Big-5 OCEAN distribution as a non-card page section between MirrorSection and MapSection. The framework follows the Drive (CC-026) architectural template: a tagging table over existing signals, rank-aware weighted distribution, dedicated render component, no new questions or signals.

Pipeline integration:

1. `lib/identityEngine.ts § buildInnerConstitution` calls `computeOceanOutput(signals, answers)` after the Drive compute call. Result attaches to `InnerConstitution.ocean` as an optional field.
2. `lib/ocean.ts` houses the framework: tagging table (`SIGNAL_OCEAN_TAGS`), distribution-compute (`computeOceanDistribution`), case classifier (`classifyOceanCase`), prose generator (`generateOceanProse`).
3. `lib/drive.ts § weightFor` is the shared rank-aware weighting ladder. CC-037 imports rather than duplicates so future tuning propagates to both frameworks.
4. `app/components/InnerConstitutionPage.tsx` renders the Disposition Map page section between MirrorSection and MapSection. The section guards on `constitution.ocean` presence — pre-CC-037 saved sessions and thin-signal new sessions silently skip the section.

Render position: **Disposition Map** sits between Mirror and Map at the page level. **Not a ShapeCard.** ShapeCards have a 4-section architecture (Strength / Growth Edge / Practice / Pattern Note) and a body-part metaphor; OCEAN is a cross-cutting derivation that doesn't fit. The page-section register matches existing non-card sections (Growth Path / Conflict Translation / Mirror-Types Seed at the page bottom).

User-facing labels: O / C / E / A render as Openness / Conscientiousness / Extraversion / Agreeableness. **N** renders as **"Emotional Reactivity (estimated)"** rather than "Neuroticism" — the clinical-pejorative baggage of "Neuroticism" doesn't match the instrument's tone. The "(estimated)" parenthetical is load-bearing: it makes the proxy nature of the N axis explicit in every surface where the bucket label appears. The TypeScript codename `"N"` stays verbatim.

Distribution-shape cases: `single-dominant`, `two-dominant`, `balanced`, `n-elevated`. The `n-elevated` case takes precedence over the dominant-shape cases — when N clears its threshold, the user gets the Neuroticism-specific prose regardless of the O/C/E/A shape.

Full rationale, tagging table, and weighting math live in `docs/canon/ocean-framework.md`. Per-signal OCEAN tags are documented in `docs/canon/signal-library.md § CC-037 amendment`.

---

## CC-042 — Work Map (added 2026-04-29)

CC-042 adds a derived **Work Map** as a non-card page section between the Disposition Map (CC-037) and Map. The framework follows the OCEAN architectural template: composition over existing signals, named threshold constants, dedicated render component, no new questions or signals.

Pipeline integration:

1. `lib/identityEngine.ts § buildInnerConstitution` calls `computeWorkMapOutput(signals, answers, stack, driveOutput, oceanOutput, agency.aspiration)` after the OCEAN compute call. Result attaches to `InnerConstitution.workMap` as an optional field.
2. `lib/workMap.ts` houses the framework: 8 register taxonomy (`WORK_REGISTERS`), composite predicates (`PREDICATES`), threshold constants (`TOP_ONE_SCORE_THRESHOLD`, `TOP_TWO_FLOOR_THRESHOLD`, `SINGLE_WEAK_MATCH_THRESHOLD`), prose generator (`generateWorkProse`).
3. `app/components/WorkMap.tsx` renders 1–2 matched registers with label / description / italic anchors line. No chart; the section gets its texture from typography rather than from a graphical primitive.
4. `app/components/InnerConstitutionPage.tsx` renders the Work Map page section between Disposition Map and Map. The section guards on `constitution.workMap` presence and `matches.length > 0` — pre-CC-042 saved sessions and thin-signal new sessions silently skip the section.

Render position: **Work Map** sits after Disposition Map at the page level. **Not a ShapeCard.** Page sequence post-CC-042: *Mirror → Disposition Map → Work Map → Map → ...*

The Work Map is the first of three sibling outputs Jason has named — Work / Love / Giving. CC-043 (Love Map) and CC-044 (Giving Map) follow the same architectural pattern (8 registers, composite predicate, top-1-vs-top-2 thresholds, page section between adjacent registers) with sibling-specific predicate inputs and register taxonomies.

The 8 register identities (`register_key`) and the predicate-input structure are canonical at CC-042. Register labels, descriptions, anchors, and `composes_naturally_with` lists are v1 placeholders subject to a future workshop CC. Predicate weights inside `lib/workMap.ts` are workshop-tunable; the *intent* of each predicate is locked.

Full rationale, register definitions, threshold ladder, and predicate intents live in `docs/canon/work-map.md`.

---

## CC-044 — Love Map (added 2026-04-29)

CC-044 adds a derived **Love Map** as a non-card page section between Work Map (CC-042) and Map. The framework follows the Work Map architectural template with three structural extensions: a six-layer architecture (Pauline framing / register / flavor / virtue baseline / bond type / Resource Balance), a flavors layer alongside the register layer, and a Resource Balance diagnostic that surfaces independently of register matching.

Pipeline integration:

1. `lib/identityEngine.ts § buildInnerConstitution` calls `computeLoveMapOutput(signals, answers, stack, driveOutput, oceanOutput, agency)` after the Work Map compute call. Result attaches to `InnerConstitution.loveMap` as an optional field.
2. `lib/loveMap.ts` houses the framework: 7-register taxonomy (`LOVE_REGISTERS`), 7-flavor taxonomy (`LOVE_FLAVORS`), composite register predicates (`REGISTER_PREDICATES`), flavor signal predicates (`FLAVOR_PREDICATES`), Resource Balance compute (`computeResourceBalance`) + locked prose templates (`RESOURCE_BALANCE_PROSE`), threshold constants (`LOVE_REGISTER_TOP1_THRESHOLD`, `LOVE_REGISTER_TOP2_FLOOR`, `LOVE_REGISTER_FLOOR`, `LOVE_FLAVOR_FLOOR`, `RESOURCE_BALANCE_DELTA_THRESHOLD`, `RESOURCE_BALANCE_HEALTHY_DELTA_THRESHOLD`, `RESOURCE_BALANCE_THIN_FLOOR`), prose generator (`generateLoveProse`).
3. `app/components/LoveMap.tsx` renders matched register(s) + flavors line + Resource Balance prose. Editorial register matches `WorkMap.tsx`; typography-driven, no chart.
4. `app/components/InnerConstitutionPage.tsx` renders the Love Map page section between Work Map and Map. The section guards on `constitution.loveMap && (matches.length > 0 || resourceBalance.case !== "healthy")` so users with distorted Resource Balance still see the diagnostic even when no register matches.

Render position: **Love Map** sits after Work Map at the page level. **Not a ShapeCard.** Page sequence post-CC-044: *Mirror → Disposition Map → Work Map → Love Map → Map → ...*

The Love Map is the second of three sibling outputs (Work / Love / Giving). CC-045 (Giving Map) follows the same architectural pattern with sibling-specific predicate inputs and register taxonomy.

The 7 register identities (`register_key`), 7 flavor identities (`flavor_key`), Resource Balance case classifier (4 cases), threshold constants, and the locked Pauline-frame paragraph + Resource Balance prose templates are canonical at CC-044. Register labels, descriptions, characteristic distortions, and flavor labels/descriptions are v1 placeholders — **CC-044-prose** is queued as the editorial-polish CC. The literal "Pauline diagnostic:" prefix in the v1 `characteristic_distortion` fields is a known CC-048 Rule 1 violation that CC-044-prose strips before surfacing the field in user-facing prose.

**Resource Balance is a separate diagnostic axis** — it surfaces independently of register matching. A user with no register match but distorted balance still sees the diagnostic prose; a user with strong register match plus healthy balance sees register prose without a balance line.

Full rationale, six-layer architecture, register / flavor definitions, predicate intents, Pauline reconciliation, Greek-4 bond-type deferral, and Philautia handling live in `docs/canon/love-map.md`.

---

## CC-048 — Report Calibration Canon (added 2026-04-29)

CC-048 codifies ten authoring rules surfaced through real-user calibration on the 2026-04-29 report. The rules govern *furniture* (label specificity, generic gift phrasing, reusable growth-edge phrases, cautious allocation prose, framework-as-section-label visibility). The architecture (8 ShapeCards, three layered registers Mirror / Map / Path, the Disposition / Work / Love / Giving Maps as derivation outputs) is unchanged.

**Full canon authority:** `docs/canon/result-writing-canon.md § Report Calibration Canon`. Use that section as the single-source-of-truth when authoring or refining prose. The audit at `docs/audits/report-calibration-audit-2026-04-29.md` flags specific code-level violations against the ten rules; the rewrite track (CC-049+) inherits the audit findings clustered by rule.

**One-line summary per rule:**

1. **Frameworks behind the scenes** — *"OCEAN"*, *"Jungian"*, *"3 C's"*, *"aux-pair register"*, *"Pauline framing"* never surface as section labels or named references in user-facing prose.
2. **Generic gifts need user-specific second sentences** — every `GIFT_DESCRIPTION` entry must compose with a per-user signal-anchored second sentence.
3. **Generic growth edges need user-specific second sentences** — every `GROWTH_EDGE_TEXT` and `BLIND_SPOT_TEXT_VARIANTS` entry must compose with a per-user signal-anchored second sentence.
4. **Allocation-gap names the 3C's-specific question** — replace cautious *"this may or may not mean anything"* hedging with the bucket-leaning sharp question (cost-leaning → maintenance-vs-creation; coverage-leaning → relational-presence; compliance-leaning → protection-vs-paralysis).
5. **Every report includes at least one uncomfortable-but-true sentence** — new structural slot adjacent to the Mirror golden sentence; per-user composition from strongest aspiration-vs-current tension.
6. **OCEAN reads as texture, not as standalone section** — Disposition Map relocates into Mirror layer with reframed copy ("how these tendencies show up" not "Big-5 percentages"); chart stays. **Render-position relocation work is queued for a separate CC (likely CC-055 or grouped with the three-layer restructure).**
7. **Display name vs narrative name separation** — username-pattern (digit suffix, all-lowercase) never appears as a third-person possessive in prose. CC-047 implements the `getUserName` fallback; CC-048 codifies as canon.
8. **Trust nuance: conditional framing, not categorical** — replace *"You trust X / Y"* (categorical institution categories) with *"You tend to trust institutions when responsibility, consequence, and mission stay close to the people making decisions."*
9. **Responsibility nuance: accountable actors inside systems** — replace *"individual vs system"* binary with *"the accountable actor inside the system, not instead of the system."*
10. **Peace disambiguation via cross-signals** — when `peace_priority` ranks top, compose the user's specific peace-meaning (moral / structural / relational / surface) from cross-signal pattern.

**Engine-pipeline impact:**

- **Rule 6** anticipates a future render-position relocation of the Disposition Map (`app/components/InnerConstitutionPage.tsx`) and reframed `generateOceanProse` templates (`lib/ocean.ts`). The relocation work is out of scope for CC-048; CC-048 codifies the rule.
- **Rule 7** is implemented at `lib/identityEngine.ts § getUserName` (CC-047 fallback). The audit verifies no remaining literal-username-as-name uses across prose-emitting surfaces.
- **Rule 5** anticipates a new structural slot in the Mirror layer; the composition logic is its own follow-on (CC-053 in the prose-rewrite track).

CC-048 ships the canon. CC-049+ ships the rewrites — each rewrite CC takes a clustered subset of the audit's findings and authors per-user-specific replacements.

---

## Synthesis Rules (Cross-Card Outputs)

Beyond per-card SWOT, the Inner Constitution synthesizes cross-card readings. These derivations are simpler in v1, richer in v2.

### Top Gifts (v1: 3 items; v2: 3-5)

**Rule:** Identify the 3 highest-strength Gifts across all eight cards. A Gift's strength = (signal-pattern intensity × cross-card reinforcement).

A Gift that appears strongly in only one card is a single-card Gift. A Gift that appears across multiple cards (e.g., "Builder" surfaces in Lens + Path + Compass for Te-dominant + proactive_creator + Knowledge users) is a synthesized Gift and ranks higher.

### Top Risks (v1: 3 items; v2: 3-5)

**Rule:** Identify the 3 most pressing Risks Under Pressure across all eight cards. A Risk's urgency = (Gift overuse intensity × current Fire signature × Weather load).

### Growth Path (v1: directional; v2: structured)

**v1 rule:** Generate a single directional paragraph describing what kind of work, love, and giving will likely feel meaningful for this Shape, drawn from Compass + Lens + Gravity + existing Path signals. No new measurement needed.

**v2 rule:** Compute a structured Path output across Work / Love / Give / Empower stages with explicit signal sources for each stage.

### Relationship Translation (v1: present; v2: richer)

**Rule:** `Relationship_Translation = Conflict_Style × Lens_dominant_inverted`

Tells the user how others, especially those with different Lens dominance, may experience their Shape. Format: *"Others may experience your [trait] as [positive reading] when they trust you, and as [negative reading] when they do not."*

### Conflict Translation (v1: present; v2: richer)

**Rule:** Generate a recommendation for how to engage with people whose Shape differs from the user's, particularly across Lens or Compass differences. Format: *"When speaking with [Shape pattern X], lead with [adaptation move] before delivering [your native move]."*

### Mirror-Types Seed (v1: present; v2: multi-user matching)

**Rule:** Identify the user's top Compass value and pair it with their dominant Lens function. Generate a paragraph naming how that same value might show up differently in others.

Format: *"Your [value]-shape leans toward [Lens-inflected expression]. People who organize around [value] differently — [other Lens-inflected expressions] — may sound nothing like you and still share your deepest commitment."*

---

## Tone Constraints

Every output the engine generates must obey the canonical tone guardrails from `inner-constitution.md`:

- **Use:** *appears to, may suggest, tends to, leans toward, often, in the moments when.*
- **Avoid:** *you are, you always, your type is, all [type] people, you cannot.*
- **Never:** declarative type labels as headlines, scoring, percentages, comparison-to-population framing.

Gift category vocabulary appears inside sentences, never as standalone labels. The engine writes "you bring a pattern-discernment gift" not "Gift: Pattern Discernment."

The tone register is *thoughtful letter*, not *quiz result*. If a generated sentence reads like a horoscope, the engine must rewrite it.

---

## v1 vs v2 Scope

### What v1 ships

- All eight cards' four-cell SWOT (Gift / Blind Spot / Growth Edge / Risk Under Pressure), with thinner output for Conviction and Path due to question-support gaps.
- The 12-vocabulary Gift category set as interpretive language.
- Top 3 Gifts (synthesized).
- Top 3 Risks (synthesized).
- Directional Growth Path paragraph (no new measurement).
- Relationship Translation paragraph.
- Conflict Translation paragraph.
- Mirror-Types Seed paragraph.
- Templated text per signal-pattern combination — engineering-feasible without LLM dependency.

### What v2 adds

- 3-5 Top Gifts and 3-5 Top Risks instead of 3 each.
- Structured Growth Path across Work / Love / Give / Empower stages with explicit signal sources.
- Richer cross-card pattern detection (lookup table or LLM-generated narrative beyond v1 templates).
- Multi-user mirror-type matching (compare two Shapes, surface structural overlap).
- Path Card v2: dedicated Path questions, signals, and tensions; full Path SWOT instead of directional paragraph.
- Conviction question depth: more questions to support full Conviction SWOT.

---

## Canonical Rules

1. The six derivation rules (Gift, Blind Spot, Conviction Posture, Conflict Style, Growth Edge, Risk Under Pressure) are canonical. New rules require revision to this file.
2. The Gift vocabulary (12 categories) is canonical as **vocabulary**, not as **labels**. The engine writes sentences using the vocabulary; it does not surface the labels verbatim to the user.
3. The Gift-to-Blind-Spot pairing table is canonical. New Gifts require new corresponding Blind Spot pairings.
4. Cross-card pattern examples (the table of five sample readings) are illustrative, not exhaustive. The engine may generate readings beyond them when signal patterns warrant.
5. Conviction and Path SWOT outputs in v1 are leaner due to thin question support. The engine must write these honestly — a directional paragraph instead of forcing a thin SWOT into the four-cell format. See `shape-framework.md` Canonical Rule 7.
6. Tone guardrails from `inner-constitution.md` apply to every generated output without exception.
7. Type labels (e.g., MBTI 4-letter codes) may appear as optional disclosures but never as Inner Constitution headlines.

---

## CC-057a — Derivation runs before polish (added 2026-04-30)

*Migrated into this canonical derivation-authorization doc post-CC-057a. The locked paragraph below was originally seeded into a standalone `derivation-rules.md` stub created when CC-057a's allow-list named a file that didn't exist; the paragraph belongs here per `shape-framework.md`'s intro, which names this file as the canonical derivation-authorization surface. Stub `derivation-rules.md` deleted as part of the migration.*

Derivation runs in the engine, before any LLM polish stage. The Humanity Rendering Layer (Path C; see `humanity-rendering-layer.md`) reads the engine's output as input; it does not re-derive, re-rank, or re-route.

Any change in derivation — adding a signal, changing a threshold, retagging an answer, tweaking the gift-category routing — requires an engine-layer CC, not a polish-layer prompt edit. The polish layer is downstream of derivation and architecturally forbidden from editing it.

This rule is structurally load-bearing for Path C. The engine owns substance (signals, derivations, structural prose anchors per CC-052/CC-052b + CC-054, composition order, section headings, numbered facts). The LLM polish layer owns texture (sentence-level warmth, human-register additions, tonal calibration, surface polish). Sentence 2 anchors and Peace/Faith disambiguation prose are explicitly engine-owned and polish-layer-immutable. Full architectural canon: `humanity-rendering-layer.md`.

---

## Relationship to Other Canon Files

- `shape-framework.md` — defines the eight Shape cards this file derives outputs for.
- `inner-constitution.md` — defines the user-facing structure of the Inner Constitution; this file is the engine that fills it.
- `signal-library.md` — defines the signal_ids this file consumes.
- `signal-mapping-rule.md` — defines how raw answers become the signals this file consumes.
- `tension-library-v1.md` — tensions inform the cross-card readings in this file's Synthesis Rules.
- `temperament-framework.md` — defines the cognitive functions referenced throughout the Lens-dependent rules in this file.
- `research-mapping-v1.md` — academic basis for why these rules produce defensible outputs.
- `humanity-rendering-layer.md` — defines the LLM polish layer that runs downstream of this file's derivation outputs (Path C; canonical post-CC-057a). The polish layer reads `EngineRenderedReport` (this file's output) and adds texture without changing substance.

If a derivation rule conflicts with the signal data in `signal-library.md` or the question structure in `question-bank-v1.md`, the more specific file wins. This file is engine logic; the data files are operational truth.
