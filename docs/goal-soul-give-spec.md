# Goal Line / Soul Line / Give — Spec Memo

**Status:** Draft for canon review. Not yet wired into canon docs or the engine. No CC has been authored against it.
**Authored:** 2026-05-07, Cowork chat session.
**Predecessor work:** Workshop conversation, this session. Existing canon — Drive (Cost/Coverage/Compliance), Compass register, Path · Gait, Q-E1 outward/inward energy, Q-Stakes1, OCEAN-Openness derivation.

---

## 1. Recommendation and Placement

Goal Line / Soul Line / Give belongs in the model as a **derived synthesis layer** rendered in the closing Purpose narrative of the report. It is not a ninth body-map shape card and it is not a sibling of Work/Love/Give. It is the engine-level structure of which Work/Love/Give is the narrative-level vocabulary.

Surfaces:

- **Scoring model:** two derived axis composites (Goal, Soul) plus an orthogonal Vulnerability/Openness Z-score, computed mostly from existing signals.
- **Closing Purpose narrative:** quadrant placement (Give / Striving / Longing / Gripping) drives the synthesis paragraph that closes the report.
- **Pattern catalog:** one or two new cross-card patterns (Generative Builder, Defensive Builder). Parallel Lives was removed post-revision; the asymmetric lift now carries that diagnostic.
- **No new shape card.** The eight-card body-map metaphor stays intact.

The model continues to render eight body-map cards. Goal/Soul sits *above* them as a meta-read of coherence.

## 2. Axis Definitions

### Goal axis (X)

What the person moves, makes, solves, forms, or carries into the world.

Domain: work, money/provision, productive motion, building, solving, achievement, execution, form, structure, usefulness, outward contribution.

Axis question: **What are you moving, making, solving, forming, or carrying into the world?**

### Soul axis (Y)

What the person loves enough to become available to.

Domain: love, care, trust, mercy, loyalty, beauty, meaning, relational attachment, moral concern, what the person is willing to protect, serve, or become available to.

Axis question: **What do you love enough to become available to?**

Note on register: Love is the Soul-line anchor, not Presence. Presence is a condition of Soul, a fruit of Soul, or the state in which Goal and Soul join — but it is not the primary definition. This guards against drifting into therapy register and against the marble-statue humanity gap (accuracy without warmth).

### Vulnerability / Openness as a growable quality

The willingness to be seen, corrected, contradicted, or moved. The capacity to let one's own building or loving be unfinished in the presence of another.

**Vulnerability is a quality, not a third axis.** It is computed internally as a composite (`raw_vulnerability` ∈ [-50, +50], same signal pool as before) and **folded into the math that produces displayed Goal and Soul scores** as an asymmetric lift/suppression factor. The user does NOT see a Vulnerability score on the dashboard. Vulnerability is named in narrative prose as a quality the user can grow — *openness, courage, willingness to be seen* — but never displayed as a number.

**Asymmetric lift (canon, post-revision):** Vulnerability does NOT suppress Goal and Soul equally. Low Vulnerability reduces Soul (the integration/love-line) substantially more than it reduces raw productive motion. A high-output builder with thin Vulnerability keeps a strong Goal score; their Soul score reflects the integration gap. The math is in §7.

**Internal accounting (preserved for audit and debug):**
- `raw_goal` — the unmodified Goal composite (0–100)
- `raw_soul` — the unmodified Soul composite (0–100)
- `vulnerability_composite` — the V composite (-50 to +50)
- `adjusted_goal` — the V-lifted Goal score, displayed to user
- `adjusted_soul` — the V-lifted Soul score, displayed to user

The dashboard surface in §13 specifies what's user-facing.

### The Freedom / Fear pole

The opposite pole of Vulnerability is not caution or self-protection — it is fear-driven closure. **Vulnerability is the freedom to be seen; fear is the prison of having to manage the appearance of being seen.** A person living in the prison spends finite resources keeping the door locked; a person living in the freedom spends those same resources on the work itself.

Freedom is a careful word here. *Freedom from* — the absence of constraint, choice, or required movement — can itself be a Gripping posture: the person who never moves so they never lose, who never speaks so they never need to defend, who never commits so they cannot be pierced. That is not the freedom Vulnerability points at. **True freedom is Courage and Vulnerability together** — the willingness to move against fear and the willingness to be seen while moving.

Important caveat: not every prison is internal. Trauma, financial pressure, illness, family systems, and obligation can create real walls. The Goal/Soul/Give synthesis does not claim every door is optional. The architectural claim is narrower: Vulnerability is the vector that distinguishes a real constraint (which protects) from an internal closure (which only keeps the person small), and the work of Give is learning which is which.

## 3. Mapping to Work / Love / Give

The engine layer is Goal/Soul. The narrative layer is Work/Love/Give plus the named off-quadrants.

| Engine (axis) | Narrative (region) |
|---|---|
| Pure Goal pursuit | **Work** — productive motion, money, structure, output |
| Pure Soul pursuit | **Love** — care, attachment, presence, moral concern |
| Goal × Soul synthesis (NE) | **Give** — purpose, generativity, mission, calling |
| Goal without Soul (SE) | **Striving** — capable but unanchored |
| Soul without Goal (NW) | **Longing** — meaningful but unincarnated |
| Neither (SW) | **Gripping** — defensive, fear-driven, contracted |

This single construct now has two levels of resolution: the engine reads the axes; the narrative names the regions. Work and Love are not separate frameworks — they are the named pure-axis pursuits within the Goal/Soul plane. Give is the NE quadrant. Reports should generally speak in Work/Love/Give language. Goal/Soul should remain the engine structure and appear only when explaining the model or providing a brief interpretive bridge.

## 4. Quadrant Definitions

The 2×2 has **two named user-facing quadrants** — Giving (NE) and Gripping (SW) — and **two unnamed regions** (SE and NW) described as Goal-leaning or Soul-leaning. The visual plot labels Giving and Gripping; SE and NW appear as positions on the chart but carry no quadrant name. Prose describes SE and NW using descriptors, not labels.

This simplification is intentional. Two destinations and one trap (Goal-leaning and Soul-leaning are the descriptors of *direction*, not *categories*). The product's job is to point toward Giving and away from Gripping; intermediate states are read as movement, not identity.

### NE — Giving / Purpose / Generativity (visible label)

Form serving love. Expression serving truth. Work becoming gift. The open hand.

Fires on: high adjusted Goal × high adjusted Soul. The Vulnerability lift (§7) is what produces this combination — without sufficient Vulnerability, raw scores get suppressed before reaching the NE region.

Renders for: Work + Love, giving, inspiring others to give, meaningful courage, vulnerability as posture, moral peace, contribution, mission, generative building, creative expression in service of human need. The narrative may use *purpose, calling, generativity, contribution, mission*. *Destiny* is allowed only when confidence is high and at least one supporting cross-card pattern firing.

### SE — Goal-leaning region (no visible label)

High adjusted Goal, low adjusted Soul. The visual shows the line on the SE side of the 2×2; the dashboard does NOT name this region. Prose describes the user as "Goal-leaning" — capable productive motion ahead of the love-line — and points at the lift toward Giving.

The completion is anchoring the output in what the person actually loves. Common pattern: high raw_goal, raw_soul moderate, vulnerability thin → Soul gets suppressed disproportionately → user reads Goal-leaning. The honest read is *the line is real, the lift is what's missing.*

### NW — Soul-leaning region (no visible label)

Low adjusted Goal, high adjusted Soul. The visual shows the line on the NW side of the 2×2; the dashboard does NOT name this region. Prose describes the user as "Soul-leaning" — love-line ahead of form — and points at the lift toward Giving.

The completion is form — the structure, habit, work, or commitment that lets love land in the world for someone other than the person themselves. Soul-leaning is unincarnated love, not weakness.

### SW — Gripping / FUD (cluster, see below)

Fear without motion. Protection without love.

Critically: **Gripping is not the default for low-Goal-low-Soul.** A person can score low on both axes for benign reasons — a season of rest, recovery, or transition. Defaulting them into Gripping reads as judgment and is wrong.

Gripping requires a **cluster**:

1. High Q-Stakes1 weight on money / job / reputation (not health or close-relationships, which read as legitimate stakes regardless).
2. Pressure-adaptation cluster: at least two of `hides_belief`, `adapts_under_economic_pressure`, `adapts_under_social_pressure`, `chaos_exposure`.
3. Low Vulnerability/Openness composite.
4. Thin Soul-line signal (operationally `soul_score < 35` per the §7 composite; Q-E1-inward weak AND Q-S2 compassion/mercy/family/faith all bottom-ranked are the underlying evidence).
5. *Optional reinforcer:* `building_motive_protective` or `building_motive_control` from Q-Purpose-Building.

If the cluster fails, render the person as in transition or resting rather than Gripping. Compliance, responsibility, and stewardship are **not** Gripping. A high-Compliance person with active Soul signals is a steward.

**Engine-internal architectural note (do not surface to users):** a recurring Gripping subtype is the person who has substituted risk-mitigation for engagement — Compliance over-invested as a quieter substitute for love or building. This is the person who has never been hurt because they have never fully shown up to be hurt. The cluster requirement above identifies this case correctly when it fires, but the user-facing render must stay at the spec §10 Gripping copy ("a season rather than a shape"). The model does not tell a user "you have not loved" — that is moralizing, and even when accurate it is not the report's job.

## 5. Building vs. Creating

Both can be Goal-only, Soul-only, or Goal + Soul. Distinguishing them sharpens the closing narrative and disambiguates motive.

### Building

Building creates form that can be used, inhabited, trusted, repeated, extended, or depended upon. Tends toward systems, structures, tools, teams, institutions, processes, habits, homes, companies, protection, continuity.

Building asks: **What needs to stand?**

### Creating

Creating gives expression to something that did not yet have expression. Tends toward beauty, language, story, music, imagination, interpretation, invention, emotional truth, meaning, revelation.

Creating asks: **What needs to be expressed?**

### Register difference, not just object difference

Building lives in the **outcomes register** — what gets made, what stands, what holds. Creating lives in the **presence register** — what gets expressed, what comes through, what reveals. A Builder asks *did it work?* A Creator asks *did it land?* Both can produce the same artifact and have entirely different relationships to it. The Goal/Soul axes capture both currents; the closing narrative should not collapse them.

### Canonical phrasings

> Building is Goal when it produces form. Building is Soul when it produces love. Building becomes Purpose when the form serves what the person loves and/or what society needs.

> Creating is Goal when it produces expression. Creating is Soul when it reveals beauty, truth, love, or meaning. Creating becomes Purpose when the expression serves what the person loves and/or what society needs.

> Building gives something a structure. Creating gives something a voice. Purpose appears when structure or voice serves love, truth, or human need.

## 6. Existing Signal Support

The Goal/Soul/Vulnerability composites should be derived primarily from signals already in the bank. The list below is the inventory; weighting and thresholds are in Section 7.

### Goal signals

- Q-E1-outward top-1 (`building_energy_priority`, `solving_energy_priority`, `restoring_energy_priority`)
- Q-A1 (`proactive_creator`, `responsibility_maintainer`)
- Q-A2 (`proactive_creator`, `exploration_drive`, `stability_restoration`)
- Q-3C1 (`cost_drive` ranked high)
- Q-Ambition1 (`success_priority`, `legacy_priority`, `wealth_priority` ranked top-2)
- Q-T temperament Te signals from Q-T5/Q-T6/Q-T7 (`te` ranked top-2)
- Q-T temperament Se signals from Q-T1/Q-T2/Q-T3/Q-T4 (`se` ranked top-2). Note: Q-T1–Q-T4 carry the perceiving functions (ne/ni/se/si); Q-T5–Q-T8 carry the judging functions (ti/te/fi/fe). The Goal composite reads te + se across the relevant blocks; the Soul composite reads fe + fi across Q-T5/Q-T6/Q-T7/Q-T8.
- Q-S1 (`stability_priority` — partial Goal-coding)
- Q-P1/Q-P2 (`high_conviction_expression`, `high_conviction_under_risk` — these also feed Vulnerability; Goal and Vulnerability share these)

### Soul signals

- Q-E1-inward top-1 (`caring_energy_priority`, `learning_energy_priority`, `enjoying_energy_priority`)
- Q-A2 (`relational_investment`)
- Q-S2 (`compassion_priority`, `mercy_priority`, `family_priority`, `faith_priority`)
- Q-S1 (`peace_priority`, `loyalty_priority`)
- Q-X4-relational (`partner_trust_priority`, `family_trust_priority`, `friend_trust_priority`)
- Q-X4-chosen (`mentor_trust_priority`, `outside_expert_trust_priority`)
- Q-T temperament Fe/Fi signals from Q-T5/Q-T6/Q-T7/Q-T8 (`fe`, `fi`)
- Q-S3-close non-self spending priorities (`family_spending_priority`, `friends_spending_priority`)
- Q-S3-wider (`nonprofits_religious_spending_priority`)

### Gripping cluster signals

- Q-Stakes1 top-1/top-2 on money / job / reputation (`money_stakes_priority`, `job_stakes_priority`, `reputation_stakes_priority`)
- Q-P1 (`adapts_under_social_pressure`, `hides_belief` from Q-P2)
- Q-P2 (`adapts_under_economic_pressure`, `hides_belief`)
- Q-X1 (`high_pressure_context`)
- Q-F2 (`chaos_exposure`)
- Q-F1 (`authority_distrust`)
- Inverse: thin Q-E1-inward, bottom-ranked Q-S2 compassion/mercy/family/faith

### Vulnerability / Openness signals

- Q-I1 freeform present and substantive. Engine reality: `lib/identityEngine.ts` extracts `independent_thought_signal`, `epistemic_flexibility`, and `conviction_under_cost` from Q-I1 freeform. `cost_awareness` was named in earlier drafts but is not emitted; the Vulnerability predicate fires on Q-I1 freeform present (≥40 chars) OR `conviction_under_cost` present.
- Q-P1 (`high_conviction_expression`)
- Q-P2 (`high_conviction_under_risk`)
- Q-X4-chosen NOT ranking `own_counsel_trust` first
- OCEAN Openness derivation (already running)
- Inverse penalties: `hides_belief`, `adapts_under_economic_pressure`, `adapts_under_social_pressure`

### Give synthesis signals

Give does not have its own signals. Give is the *emergent* score when Goal-high × Soul-high × Vulnerability-sufficient. The supporting evidentiary cluster is: Q-3C1 + Q-Ambition1 (claimed Cost or Coverage) aligned with revealed Drive distribution; Q-S2 nouns aligned with Q-E1 verbs; Q-Stakes1 weighted toward close-relationships rather than money/reputation; Q-Purpose-Building rank firing `building_motive_present` or `building_motive_expressive`.

### Note on currencies: Energy and Presence

The Soul-line evidence is currently dominated by Energy signals (Q-E1 outward/inward, Q-A1/A2). One adjacent currency should be named explicitly even though the current question bank measures it only indirectly.

- **Energy** — the resource. Vitality, motivation, direction. Energy is morally neutral; it can be spent on positive engagement (caring, building, creating, repairing) or on damaging behavior (controlling, withholding, blaming, performing). Energy alone does not produce Give. Well-measured via Q-E1.
- **Presence** — the quality. Attention without distraction, depth of contact, being there rather than merely being near. Presence is the state in which Goal and Soul actually meet — the difference between a parent who is in the room and a parent who is in the room *and looking up*.

**Time is not treated as a separate currency.** Time has no value outside Energy; what the model needs to read is where Energy goes and whether Presence accompanies it.

Vulnerable + Present is the relational synthesis the Give quadrant points at. A person can spend abundant Energy on a loved one and produce no Give if Presence is absent. A future CC may add a presence-vs-distraction question slot if existing data fails to separate Presence from Energy. Out of scope for the CC-A through CC-D chain unless audit results force it.

## 7. Derivation Logic

Composites are computed on a 0-100 normalized scale. Thresholds gate quadrant placement.

### Goal composite (proposed weighting, sum-then-normalize)

```
goal_score =
    25 * (Q-E1-outward top-1 in {building, solving, restoring})
  + 15 * (Q-A1 = proactive_creator OR responsibility_maintainer)
  + 10 * (Q-A2 = proactive_creator OR exploration_drive OR stability_restoration)
  + 15 * (Q-3C1 cost_drive top-1 OR top-2)
  + 15 * (Q-Ambition1 success_priority OR legacy_priority OR wealth_priority in top-2)
  + 10 * (te + se signals from Q-T5/Q-T7 normalized)
  +  5 * (Q-S1 stability_priority in top-2)
  +  5 * (high_conviction_under_risk OR high_conviction_expression)
```

### Soul composite

```
soul_score =
    25 * (Q-E1-inward top-1 = caring_energy_priority)
  + 15 * (Q-A2 = relational_investment)
  + 20 * (Q-S2 top-2 ∩ {compassion, mercy, family, faith})
  + 10 * (Q-S1 top-2 ∩ {peace, loyalty})
  + 10 * (Q-X4-relational top-1 ∈ {partner, family, friend})
  + 10 * (fe + fi signals from Q-T5/T6/T7/T8 normalized)
  + 10 * (Q-S3-close non-self top-1 OR Q-S3-wider nonprofits_religious top-1)
```

### Vulnerability composite (Z-score, -50 to +50)

```
vulnerability_score =
    20 * (Q-I1 substantive freeform with cost_awareness OR conviction_under_cost)
  + 15 * (high_conviction_expression from Q-P1)
  + 15 * (high_conviction_under_risk from Q-P2)
  + 15 * (Q-X4-chosen does NOT rank own_counsel first)
  + 20 * (OCEAN-Openness derived score above median)
  - 15 * (hides_belief OR adapts_under_economic_pressure OR adapts_under_social_pressure, capped)
```

### Vulnerability composite (engine-internal)

```
vulnerability_composite =
    20 * (Q-I1 freeform present (≥40 chars) OR conviction_under_cost present)
  + 15 * (high_conviction_expression from Q-P1)
  + 15 * (high_conviction_under_risk from Q-P2)
  + 15 * (Q-X4-chosen does NOT rank own_counsel first)
  + 20 * (OCEAN-Openness derived score above median)
  - 15 * (hides_belief OR adapts_under_economic_pressure OR adapts_under_social_pressure, capped)

clamped to [-50, +50]
```

Computed but NOT displayed on the dashboard. Used as the lift factor below.

### Asymmetric lift / suppression (canon)

Vulnerability lifts and suppresses Goal and Soul **asymmetrically**. Low Vulnerability suppresses Soul (the integration/love-line) substantially more than it suppresses raw productive motion. A high-output builder with thin Vulnerability keeps a strong Goal score; their Soul score reflects the integration gap.

```
vulnerability_normalized = (vulnerability_composite + 50) / 100   # range 0..1

# Asymmetric lift factors
goal_lift_factor = 0.85 + 0.30 * vulnerability_normalized        # range 0.85..1.15
soul_lift_factor = 0.60 + 0.80 * vulnerability_normalized        # range 0.60..1.40

adjusted_goal = clamp(raw_goal * goal_lift_factor, 0, 100)
adjusted_soul = clamp(raw_soul * soul_lift_factor, 0, 100)
```

Behavior at the three reference points:

| Vulnerability | goal_lift | soul_lift | Interpretation |
|---|---|---|---|
| Deep closure (V = -50, normalized = 0) | 0.85× | 0.60× | Goal mildly suppressed; Soul significantly suppressed. The integration gap is real. |
| Neutral (V = 0, normalized = 0.5) | 1.00× | 1.00× | Raw scores unchanged. |
| Deep openness (V = +50, normalized = 1) | 1.15× | 1.40× | Goal mildly lifted; Soul significantly lifted. The synthesis becomes possible. |

The asymmetry encodes the canon: **vulnerability gates the love-line more than it gates productive motion.** A Striving high-output builder with thin Vulnerability shouldn't have their Goal score crushed; their Soul score should reflect the gap.

The CC implementing this should validate the lift factors against test fixtures before locking them. The 0.85/0.30 and 0.60/0.80 constants are exported tunables, not canon.

### Quadrant placement (revised — Parallel Lives removed)

```
goal_high = adjusted_goal ≥ 50
soul_high = adjusted_soul ≥ 50
gripping_cluster_fires = (see §4 SW cluster requirement)

if goal_high and soul_high:
    quadrant = NE (Giving)
elif goal_high and not soul_high:
    quadrant = SE (Goal-leaning region, no label)
elif not goal_high and soul_high:
    quadrant = NW (Soul-leaning region, no label)
elif gripping_cluster_fires:
    quadrant = SW (Gripping)
else:
    quadrant = neutral / transition (do not render Gripping narrative)
```

**Canon (post-revision):**
- Parallel Lives is removed entirely. The compartmentalized high-G + high-S + low-V case used to fork to a "Parallel Lives" branch; with the asymmetric lift in place, low Vulnerability suppresses adjusted_soul before the comparison reaches `soul_high`, so the user lands in the SE region (Goal-leaning) instead of falsely scoring NE Giving. The math captures the diagnostic; no separate label needed.
- Striving sits above the Gripping cluster check intentionally. A person with `goal_high = True` whose Gripping cluster *also* fires renders as Goal-leaning with a defensive/protective modifier (carried by the Defensive Builder pattern in §9), NOT as primary SW Gripping. Primary Gripping is reserved for defensive pressure paired with low Goal AND thin Soul.

### Gripping Pull (separate read, dashboard-visible)

Independent of quadrant placement, the engine computes a **Gripping Pull score** (0–100) that names the strength of defensive-cluster signals firing for this user, and an associated **named-signal list** rendered alongside.

```
gripping_pull =
    25 * (Q-Stakes1 money OR job OR reputation in top-1)
  + 15 * (Q-Stakes1 money OR job OR reputation in top-2 but not top-1)
  + 10 * (each pressure-adaptation signal firing: hides_belief, adapts_under_economic_pressure, adapts_under_social_pressure, chaos_exposure — capped at 30)
  + 25 * (vulnerability_composite < 0)
  + 20 * (raw_soul < 35)

clamped to [0, 100]
```

The named-signal list is the human-readable enumeration of which signals contributed. Examples:

- *Reputation stakes elevated*
- *Pressure adaptation under economic stress*
- *Conviction concealment*
- *Limited openness signal*
- *Thin love-line evidence*

A user can have a moderate Gripping Pull (say, 30–50) without being in the SW Gripping quadrant — they're not stuck, but the cluster is partially active. The dashboard surfaces this so users can see *what's holding them back* even when they're not at the bottom-left. Per §13 dashboard spec, Gripping Pull is shown both as the 0–100 score AND as the named-signal list.

### Notes on weighting

Weights above are illustrative starting points. The CC that implements this should validate against existing test sessions before locking weights. The model should NOT introduce new question slots to "improve" the composite; if a signal is too thin, the composite simply doesn't fire confidently and the report falls back to a softer rendering.

## 8. Q-Purpose-Building (one new question)

The single measurement gap that existing signals cannot close is **motive of building**. Q-E1-outward asks where energy goes; nothing asks why. Two people both ranking "building" first today read identically — but one is creating, one is controlling chaos. Q-Purpose-Building is the surgical fix.

### Question

> **When you are building or creating at your best, what is most true?**
>
> Choose up to 2.
>
> 1. I feel focused and useful.
> 2. I feel alive and present.
> 3. I feel like I am making something that should exist.
> 4. I feel like I am protecting something from collapse.
> 5. I feel in control.

Five items, multi-select capped at 2. Card placement: `role` (which routes to Path · Gait), adjacent to Q-3C1 and Q-Ambition1. Type: `multiselect_capped` (new type, or repurpose existing multiselect with an items-checked cap).

### Signal mappings

| Item | Signal | Goal-line | Soul-line | Closure / Gripping |
|---|---|---|---|---|
| 1. Focused and useful | `building_motive_focused` | yes | — | — |
| 2. Alive and present | `building_motive_present` | — | yes | — |
| 3. Making something that should exist | `building_motive_expressive` | yes | yes | — |
| 4. Protecting from collapse | `building_motive_protective` | yes | conditional | conditional |
| 5. In control | `building_motive_control` | yes | — | yes |

`building_motive_protective` reads as **stewardship** when surrounded by Soul signals (active Q-S2 compassion/family, active Q-X4-relational trust). It reads as **Gripping** when surrounded by the Gripping cluster (high money/job/reputation Stakes, pressure-adaptation, thin Soul). The motive itself is neutral; the surround disambiguates.

`building_motive_control` is the strongest Closure marker. When it fires alongside low Vulnerability and high Stakes-money/reputation, the Defensive Builder pattern fires.

Drive bucket tagging (for `lib/drive.ts SIGNAL_DRIVE_TAGS`):

- `building_motive_focused` → Cost
- `building_motive_present` → (omit — no Drive bucket; Soul-line only)
- `building_motive_expressive` → Cost + Coverage (split)
- `building_motive_protective` → Compliance
- `building_motive_control` → Compliance + Cost (split)

## 9. Cross-Card Patterns

Add to the existing pattern catalog in `lib/workMap.ts` / `lib/loveMap.ts` / wherever the role-card patterns sit.

### Generative Builder

**Canonical future form (after Q-Purpose-Building / CC-B):** `goal_score ≥ 70` AND `soul_score ≥ 70` AND `vulnerability_score ≥ 20` AND (`building_motive_present` OR `building_motive_expressive`).

**CC-070 deployed heuristic form (current):** fires only inside the Giving quadrant when adjusted Goal ≥ 70, adjusted Soul ≥ 70, raw Vulnerability ≥ 20, Q-E1 outward + inward align (building or solving top-1 outward, caring top-1 inward), and Q-S2 + Q-Ambition1 align (a Soul-line value top-2 with a Goal-line ambition top-2). The thresholds were tightened from 60/60/10 to 70/70/20 so the pattern does not over-fire on compartmentalized cases that the asymmetric lift now routes into the Goal-leaning region.

**Read:** form serving love. The person builds or creates in service of something they protect.

**Renders in:** Path · Gait card kicker, plus closing Purpose narrative.

### Defensive Builder

(Engine-internal name. Avoid surfacing this label to users — *Defensive Builder* and especially *Gripper Disguised as Builder* read as accusation. The user-facing render should be neutral.)

**Canonical future form (after Q-Purpose-Building / CC-B):** (`building_motive_protective` OR `building_motive_control`) AND Gripping cluster active AND `vulnerability_score < 0` AND thin Soul-line.

**CC-070 deployed heuristic form (current):** fires only inside the Goal-leaning / Striving engine quadrant when `compliance_drive` ranks top-1 or top-2 in Q-3C1, the Gripping cluster fires, raw `vulnerability_composite < 0`, and raw Soul is thin (`raw_soul < 35`). This approximates the queued `building_motive_*` signals with the existing Compliance-as-protection evidence until Q-Purpose-Building ships.

**Read:** building primarily to prevent collapse, exposure, or loss.

**Renders in:** softened closing narrative — *"the model is reading building as protection right now."* Never as a stable identity claim. May be a season rather than a shape.

### ~~Parallel Lives~~ — REMOVED (post-revision)

Parallel Lives was the high-G + high-S + low-V case carved out as a separate diagnostic. **It is no longer a pattern in this spec.**

Rationale: with the §7 asymmetric lift in place, low Vulnerability suppresses `adjusted_soul` before the comparison reaches `soul_high`, so a user with strong raw scores but thin Vulnerability automatically lands in the SE Goal-leaning region with their displayed Soul score reflecting the integration gap. The math captures the diagnostic; the separate "Parallel Lives" label was over-clinical and confusing.

The compartmentalized case is now read as: high adjusted_goal, low adjusted_soul, with the prose explaining that the Soul-line is suppressed because the integration isn't yet alive — the lift is named as vulnerability/openness/courage, the next move is to grow the quality so the displayed scores can rise together.

Removed from: catalog, render targets, prose templates, audit fixtures.

## 10. Closing Purpose Render Examples

Sample closings, ~3-5 sentences each. The CC implementing this should produce final copy; these are reference shape.

### Register guidance for closing prose (CC-067 clarifications, canonized)

- **"Instrument" over "model"** in user-facing copy. *The instrument reads…* lands warmer than *the model reads…* and frames the report as a tool rather than a verdict-machine.
- **"Giving" over "generativity"** in user-facing copy. Lower-case English over academic register.
- **No engine-layer words in user-facing prose.** "Goal," "Soul," "Vulnerability" do not appear; the narrative uses Work, Love, Give, Purpose, plus the named-region nouns.
- **No engine-internal pattern names in user-facing prose.** "Parallel Lives," "Defensive Builder," "Generative Builder," "Gripper" never surface to users. Parallel Lives is removed as a rendered quadrant; its former compartmentalized read is carried by the Goal-leaning prose without the label.
- **Each closing must name a bridge or next movement, not merely describe the quadrant.** A closing that only names where the user is reads as a verdict; one that points at the next move reads as honest companionship. The bridge can be a sentence ("The completion is…", "The way out is rarely…", "The bridge to giving is…", "The work is…"), an action verb, or a forward-pointing clause. If a closing reads as a label without a forward-pointing close, it has not yet earned the render.

### NE — Give

> Your verbs and your nouns appear to be pulling in the same direction. What you build, who you serve, and what you protect are not living in three different rooms. The instrument reads this as the early shape of giving — work taking the form of love, love taking the form of work. Whatever you're moving toward next, the conditions are here for it to mean what you want it to mean. The work is to keep this shape honest as the seasons turn.

### SE — Goal-leaning

> Your form is strong; your purpose is still forming. The instrument sees consistent productive motion — building, solving, executing — without yet a clear love-line connecting it to what you protect. This is a Work-leaning shape: capable but unfinished, and the work is not more output. The completion is to anchor the output in what you actually love: to let the people, the cause, or the calling that already claims you become the reason the building is happening at all. The next move is rarely to push harder — it is to find that anchor.

### NW — Soul-leaning

> What you love is clear. The form is still forming. The instrument sees deep relational and moral signal without yet the structure or motion that would let it land in the world for someone other than you. This is a Love-leaning shape — love-line ahead of form, not weakness, but love that hasn't yet been incarnated. The completion is form: the structure, habit, work, or commitment that lets what you love become real to a person other than yourself. The next move is to give that love a body.

### SW — Gripping (only when cluster fires)

> The instrument is reading defensive pressure right now. What you're holding appears to be held against loss more than for love or motion. This may be a season rather than a shape — that posture rarely names a person; more often it names a moment they're inside. The way out is rarely more holding. The next move, when there is energy for it, is to find one place where a slightly more open hand produces less collapse, not more.

### ~~Parallel Lives~~ — REMOVED (post-revision)

Per §9 revision, this template is no longer rendered. The compartmentalized high-G + high-S + low-V case is now read by the §7 asymmetric lift: low Vulnerability suppresses adjusted_soul, the user lands in the SE Goal-leaning region, and the SE prose names the gap and points at the lift. The bridge — vulnerability/openness/willingness — is named in the SE Goal-leaning prose, not in a separate template.

Sample SE Goal-leaning prose (replaces Parallel Lives use case):

> Your form is strong; your purpose is still forming. The instrument sees consistent productive motion — building, solving, executing — without the love-line yet showing up at the same scale. The Soul-line is real, but quieter — held in private rather than alive in the work. The next move is rarely more output; it is letting the willingness to be seen lift what's already there. What you build and what you love can pull together when the willingness to let them see each other catches up.

(The compartmentalized framing — "the two halves of your life see each other" — survives in this prose as a specific bridge sentence inside the SE Goal-leaning template, without the Parallel Lives label.)

### Neutral / Transition (low G + low S + Gripping cluster fails)

> The signal here is quiet. That is not a verdict — sometimes the instrument is reading a season of rest, recovery, or transition rather than a settled shape. The body-map cards above still hold. The synthesis read may become more useful after another pass, or after the season changes. The next move is not to force a verdict where the evidence is thin — it is to let the picture clarify on its own time.

## 11. Canon Language

For inclusion in `docs/canon/` once approved. Quotes are intended verbatim.

> Goal without Soul becomes striving. Soul without Goal becomes longing. Low Goal and low Soul become gripping. Goal joined to Soul becomes giving.

> Purpose is what you build for the sake of what you love.

> Building is Goal when it produces form. Building is Soul when it produces love. Building becomes Purpose when the form serves what the person loves and/or what society needs.

> Creating is Goal when it produces expression. Creating is Soul when it reveals beauty, truth, love, or meaning. Creating becomes Purpose when the expression serves what the person loves and/or what society needs.

> Vulnerability is the anti-FUD vector.

> Give requires enough openness for the person's verbs and nouns to inhabit the same room.

> Building gives something a structure. Creating gives something a voice. Purpose appears when structure or voice serves love, truth, or human need.

> True freedom is Courage and Vulnerability together.

> Energy is the resource. Presence is the quality. A person can spend Energy without giving Presence; only the second produces Give.

> Building asks "did it work?" Creating asks "did it land?" Both can be Purpose; the register matters.

## 11a. Narrative Guidance (closing-copy register)

The phrasings below are intended for narrative copy in the closing Purpose section, not for use as engine rules or hard claims. They may be paraphrased, softened, or omitted depending on the user's context — particularly when signal indicates real external constraint (high `chaos_exposure`, high `high_pressure_context`, or trauma-adjacent freeform content). Use these as register guides, not as required output.

> Vulnerability is freedom. Fear is a prison. Sometimes the door is real; sometimes it was optional all along. The work is learning which prison still protects you and which one only keeps you small.

> Freedom-from-movement can be a quieter form of the same prison.

> The way out is rarely more holding.

> What you build and who you love can both be strong, and still live in different rooms. The bridge between them is rarely more building or more loving — it is the willingness to let them see each other.

These lines should never appear verbatim in copy when their underlying claim would overreach the user's actual situation. The closing render is responsible for that judgment; the audit pass is responsible for catching when it fails.

## 12. Risks and Guardrails

1. **Do not collapse Compliance into Gripping.** Compliance is one of the three Drive buckets and represents legitimate stewardship/risk-management. Gripping is fear-driven contraction. Distinguishable by Soul-line activity, Vulnerability composite, and Stakes composition (close-relationships and health = stewardship; money and reputation under pressure-adaptation = Gripping).
2. **Vulnerability folds into Goal/Soul math (post-revision); the asymmetric lift is canon.** Soul gets a larger lift coefficient than Goal. Do NOT apply equal lift to both axes — that would falsely flatten the high-output builder with thin Vulnerability. The 0.85/0.30 (Goal) and 0.60/0.80 (Soul) constants are exported tunables; the asymmetry is the canon.
3. **Do not display Vulnerability as a numeric score.** Vulnerability is engine-internal. The dashboard surfaces adjusted_goal, adjusted_soul, angle (Direction), length (Movement Strength), and Gripping Pull — never a Vulnerability number. Vulnerability is named in narrative prose as a quality the user can grow.
4. **Do not make Soul too abstract.** Love is the anchor, not Presence. Presence is downstream. Avoid "Soul becoming present in the world" phrasings — they drift into therapy register and reinforce the marble-statue humanity gap.
5. **Do not create a ninth shape card.** Goal/Soul is rendered in the closing Purpose narrative + Movement section + dashboard, plus as a kicker on Path · Gait. The eight-card body-map metaphor stays intact.
6. **Do not let Work/Love/Give compete with Goal/Soul in narrative prose.** They are the same construct at two levels of resolution. The dashboard surface uses engine vocabulary (Goal, Soul, Giving, Gripping). Narrative prose uses the Work/Love/Give register. Don't run both languages in the same paragraph.
7. **Carve-out for user-facing labels (post-revision):** *Giving* (NE) and *Gripping* (SW) are user-facing as quadrant labels on the dashboard surface AND as named states in prose. *Striving*, *Longing*, *Parallel Lives*, *Defensive Builder*, *Generative Builder*, and *Gripper Disguised as Builder* remain engine-internal — never user-facing as labels. Striving and Longing become *descriptors* (Goal-leaning, Soul-leaning) in narrative prose, not regional names.
8. **Prefer synthesis reads when supported, not only contradiction reads.** The model's tension-detection (claimed-vs-revealed Drive, sacred-vs-stakes, 3C-vs-energy) is strong but defaults the report toward "here's where you're inconsistent." Goal/Soul/Give introduces a coherence read — NE means verbs and nouns pulling the same direction, and the closing narrative gets to say so. Do not default every interesting pattern into contradiction.
9. **Do not infer Gripping (the SW quadrant) from low signal.** Low adjusted_goal + low adjusted_soul defaults to neutral/transition unless the Gripping cluster fires. Gripping is a verdict; verdicts require evidence.
10. **Gripping Pull is a separate read from quadrant placement.** A user can have a moderate Gripping Pull score (e.g., 30–50) without being in the SW Gripping quadrant — they're not stuck, but the cluster is partially active. Render Gripping Pull always; render the SW Gripping quadrant only when the cluster fully fires.
11. **Parallel Lives is removed entirely (post-revision).** Do not re-introduce it as a pattern, label, prose template, or detection branch. The compartmentalized case is now captured by the §7 asymmetric lift suppressing adjusted_soul.

---

## 13. Movement Layer (Static Read for MVP, Trajectory Read Downstream)

Goal/Soul/Give locates a user in a 2×2 plane of derived composites. The Movement layer reads that location **directionally** — not just *where* the user is, but the *shape and scale* of the line from origin to that point, and (eventually) how that line is changing over time.

The Movement read is the part of the instrument that converts the report from descriptive (*here are some things to consider*) to prescriptive (*here is what wants more energy, vulnerability, courage, action*). This is its purpose and its register: tough-love companionship.

### 13.1 Geometry

The Goal/Soul plane is Cartesian: Goal = X (0–100), Soul = Y (0–100). The Movement read is the polar transform of that point.

- **Angle (degrees, 0°–90°):** `atan2(soul, goal) × 180 / π`, clamped to [0°, 90°]. 0° = pure Goal pursuit (Striving leaning); 45° = balanced Give; 90° = pure Soul pursuit (Longing leaning). The angle is the *shape* of the user's posture — how verbs and nouns are weighted relative to each other.
- **Length (0–100, normalized):** `sqrt(goal² + soul²) / sqrt(2)` clamped to [0, 100]. Long line = full activity on both axes; short line = thin total Goal-and-Soul presence. Length is the *scale* of the user's posture.

Edge cases:

- **goal = 0 AND soul = 0:** length = 0, angle undefined. Render as the deepest stuck case — minimum signal across both axes. Movement read fires the strongest call to motion (per §13.8, no soft-fallback in MVP).
- **goal = 0, soul > 0:** angle = 90°, length = soul / sqrt(2). Pure Longing.
- **goal > 0, soul = 0:** angle = 0°, length = goal / sqrt(2). Pure Striving.
- **goal = 100, soul = 100:** angle = 45°, length = 100. Full Generative.

### 13.2 The trajectory thesis

Over a life arc, a person's line should:

1. **Rise in angle** — from the Goal-leaning shape that survival and early career require, toward a more balanced shape (typically somewhere in 35°–70° depending on life goals) that includes the Love-line in proportion.
2. **Grow in length** — accumulated activity on both axes as life lived deepens both verbs and nouns.

Both increases together produce *Give* — generativity at scale. Either alone is incomplete: a long Goal-only line is Striving at scale (rich but unanchored); a balanced short line is forming-Give without the activity yet to embody it.

The trajectory thesis is a **forward-projection** for the Movement read in MVP — guidance language about what direction a line typically wants to move at the user's life stage, not observed data. It becomes **observed trajectory** once the platform supports repeat assessments.

### 13.2a The 50/50 teaching coordinate (memorable, NOT prescriptive)

The instrument is bounded at 50 questions (see `AGENTS.md` Question Bank Architecture) and the angle is bounded at 90°. The numeric symmetry is felicitous: somewhere around the midpoint of a life arc, an angle in the neighborhood of 50° is approximately where a thriving trajectory tends to converge — Goal and Soul roughly balanced, Movement Strength meaningful, Vulnerability lift active enough to keep the line from collapsing toward Gripping.

This is a **teaching coordinate**, not a prescription. It is offered as a memorable convergence point for thinking about the model — *50 questions, 50 degrees, often around 50 years* — but does NOT claim that any specific user *should* be at any specific angle at any specific age.

Specifically forbidden interpretations:

- A 22-year-old at 5° is not behind. Their season legitimately favors Goal-line activity; the angle is expected to rise as the season turns.
- A 75-year-old at 30° is not failed. The angle and length carry whatever the lived arc actually carries; the coordinate is descriptive of trajectories *that converge*, not normative for any individual life.
- A 50-year-old at 50° is not a target users should aim toward. Some lives integrate at 35°, some at 70°. The coordinate names a center, not a destination.

The canonical move is **forward, away from Gripping** — regardless of where the user starts. The 50/50 coordinate is a useful frame for prompt-writers and report explanations; it is not a math rule, not a guidance threshold, and not a moralizing yardstick. §13.11 guardrails (no specific angles by demographic; tough-love has a floor) remain binding.

### 13.3 Static vs trajectory split

- **Static read (MVP, CC-070 scope):** computes angle and length from the current assessment; renders posture description with movement-suggestion guidance gated by life-stage demographics. No history.
- **Trajectory read (downstream, post-platform-CC):** stores composites across repeat assessments; renders deltas (*"Six months ago you were at 8°. You're now at 14°. The line is rising."*) and projected trajectories. Requires user accounts, persistent storage, and opt-in consent for longitudinal tracking. Out of scope until those product capabilities exist.

### 13.4 Render placement (post-revision: Dashboard + prose)

The Movement section is now structured in **two layers**:

1. **Dashboard surface (top of `## Movement` section)** — visible engine state: scores, angle, length (relabeled as "Direction" and "Movement Strength" for users), Gripping Pull score, named-signal list, and the 2×2 visual plot.
2. **Narrative prose (below the dashboard)** — the existing Movement prose, derived from the displayed values. Speaks in the geometric/motion/warmer registers; explains and contextualizes what the dashboard shows.

This order reverses the prior "prose-only" architecture per the post-CC-070 canon revision: data first, then explanation derived from the data. The dashboard does not duplicate the prose; the prose does not restate the dashboard. Each carries its own register.

### 13.4a Dashboard surface specification (canon)

The Movement dashboard renders the following user-facing fields, in this order:

| Field | Source | Display | Notes |
|---|---|---|---|
| Goal score | `adjusted_goal` | "Goal: 80 / 100" | Engine-layer label *Goal* is user-facing on the dashboard surface (carve-out per §12.7). |
| Soul score | `adjusted_soul` | "Soul: 45 / 100" | Same carve-out. |
| Direction | `angle` | "Direction: 29° (Goal-leaning)" | The angle in degrees plus a one-word descriptor: *Goal-leaning*, *balanced*, *Soul-leaning*. The descriptor is computed from the angle's region: 0–35° = Goal-leaning, 35–55° = balanced, 55–90° = Soul-leaning. |
| Movement Strength | `length` | "Movement Strength: 65 / 100" | Length normalized 0–100. |
| Quadrant | computed | "Quadrant: Giving" or "Quadrant: Gripping" or omitted | Only Giving (NE) and Gripping (SW) appear as labels. SE and NW render as "(Goal-leaning region)" and "(Soul-leaning region)" without quadrant naming. |
| Gripping Pull | `gripping_pull` | "Gripping Pull: 22 / 100" | The 0–100 score from §7. Always shown, even when low. |
| Gripping Pull signals | `gripping_pull.signals` | bullet list | Named, plain-English list of the firing signals. Examples: *Reputation stakes elevated, Pressure adaptation under economic stress, Limited openness signal*. Empty list when score = 0. |

The 2×2 visual plot:
- Square aspect ratio (1:1)
- Goal axis horizontal (right = high Goal); Soul axis vertical (up = high Soul)
- Both axes scaled 0–100
- A line drawn from origin (0,0) to the user's `(adjusted_goal, adjusted_soul)` point
- Quadrant guides: light dashed lines at goal=50 and soul=50
- Quadrant labels: "Giving" in the NE corner, "Gripping" in the SW corner. SE and NW corners unlabeled.
- Direction label (e.g., "29°") rendered near the angle's apex at the origin
- Movement Strength label (e.g., "65") rendered near the line's midpoint or at the endpoint

The dashboard surface uses **engine-layer vocabulary** (Goal, Soul, Giving, Gripping). The narrative prose below the dashboard uses the **narrative register** (Work axis, Love-line, the line, the work, the bridge to giving, etc.) — the two layers don't speak the same language, by design.

What is **not** displayed on the dashboard:
- Vulnerability score (engine-internal; named only in narrative prose as a quality)
- raw_goal, raw_soul (engine-internal; preserved for audit/debug)
- Confidence band (currently engine-internal; may surface in a future CC)
- Pattern names other than Giving/Gripping ("Defensive Builder", "Generative Builder" remain engine-internal)

### 13.5 Narrative prose register (post-revision)

The narrative prose below the dashboard speaks in the geometric/motion/warmer registers from §13.6. It explains what the dashboard shows in human terms. **It does NOT restate the dashboard's numbers.** The dashboard says "Goal: 80, Soul: 45, Direction: 29°"; the prose says "your line leans toward the Work axis, with the love-line beginning to register, and the next move is what would let it rise."

Required prose shape: 3–5 sentences. First sentence names the posture (Goal-leaning / Soul-leaning / balanced) without restating the numerical Direction. Final sentence names a bridge or next move. The dashboard does the precision work; the prose does the meaning work.

### 13.5b Angle-band sub-rules for the Movement narrative prose

The Movement narrative prose layer (§13.5) varies by **angle band** within each quadrant. Five bands are canonical:

| Band | Range | Quadrant region | Prose register |
|---|---|---|---|
| Deep Goal-leaning | 0°–19° | SE | Productive motion ahead of the love-line; anchor the output. |
| **Productive NE movement (Goal-side)** | **20°–44°** | **SE** | **Affirm out-of-Gripping; identify Goal as stronger; prescribe Soul-lift practices.** |
| Balanced sweet spot | 45°–54° | NE | Verbs and nouns pulling together when length meaningful. |
| **Productive NE movement (Soul-side)** | **55°–79°** | **NW** | **TBD canon — symmetric Goal-lift practices. See §13.5c.** |
| Deep Soul-leaning | 80°–90° | NW | Love-line ahead of form; the completion is form. |

#### Canon for the 20°–44° band (Productive NE movement, Goal-side)

When `angle ∈ [20°, 44°]` AND `length ≥ 40` AND `raw_soul ≥ 20`, the Movement narrative prose follows this composition:

1. **First sentence — affirmation.** Before any prescription, name the position honestly. The user is outside Gripping; both axes are present; the lift toward Giving is happening. Example: *"Your line sits in productive NE movement — leading on the Work axis, with the love-line beginning to register at meaningful scale. The lift toward giving has started."*

2. **Second sentence — observation.** Identify Goal as the stronger axis without prescribing more output. The user does not need to produce more; that is not the lift. Example: *"What's strong here is the form — the building, the structure, the productive motion that has earned the position you're at."*

3. **Bridge sentence(s) — prescribe Soul-lift practices.** Recommend one or more of the following five practices as the move (one or two per render, not all five at once). The practices, verbatim canon:

   1. **Name the beloved.** Make the people, the cause, or the calling concrete; an abstract love-line reads thinner than a named one.
   2. **Allocate resources to the sacred value.** Time, attention, and resources flow toward what's said to matter, and the gap between *named* and *funded* is the most common love-line gap.
   3. **Translate care visibly.** The internal love-line is real; the external sign of it can be sparse. The work is making the care legible to the people it's for.
   4. **Convert structure into mercy.** The same structuring gift that builds systems can build relief, comfort, and care. Use the gift in service of the love-line.
   5. **Choose one recurring act of Giving that does not depend on urgency.** Small and durable beats large and crisis-driven. The act survives the season.

4. **Final sentence — landing.** Close on the Soul-lift framing without restating the dashboard's numerical readouts. Example: *"The next move is rarely more output — it is letting one of these practices become regular enough that the love-line catches up to the form."*

User-facing register note: this subsection names architectural engine concepts in the spec, but the deployed Movement narrative substitutes narrative vocabulary where it renders to users. The engine-vocabulary guard forbids `goal`, `soul`, and `vulnerability` substrings in Movement narrative prose; user-facing examples therefore say "leading on the Work axis" and "love-line" rather than the engine terms.

#### Selection rule for which practice(s) to render

Pick one or two practices per Movement narrative based on the user's strongest body-map signals. Selection is first-firing-wins in this order:

1. Low Extraversion or compartmentalized signal cluster → *Translate care visibly*.
2. High Conscientiousness + structurer (Te) prominence → *Convert structure into mercy*.
3. Sacred-Words-vs-Sacred-Spending tension firing → *Allocate resources to the sacred value*.
4. Default / no earlier branch fires → *Name the beloved* + *Choose one recurring act*.

#### Forbidden in 20°–44° prose

- **Do NOT prescribe more output.** The user is already producing. The work is not "build harder" or "ship more"; it is the Soul-lift.
- **Do NOT moralize on the asymmetry.** *"You're not loving enough"* is forbidden; *"the love-line is forming and these practices help it land"* is in-register.
- **Do NOT lock all five practices into every render.** Maximum two practices named per Movement read.
- **Do NOT use the words "Striving" or "Goal-leaning" as a label** in the affirmation sentence — say "productive NE movement" or "the lift toward giving has started" instead.

### 13.5c Symmetric 55°–79° band (TBD canon — flagged for workshop)

The mirror band — `angle ∈ [55°, 79°]` AND `length ≥ 40` AND `raw_goal ≥ 20` — is the Soul-leading user whose love-line is alive but not yet incarnated in form. The composition shape mirrors §13.5b: affirmation, observation (Soul as the stronger axis), prescription of Goal-lift practices, landing.

The five Goal-lift practices are **TBD canon** — they need workshop authoring before lock. Speculative starting candidates (NOT canon yet):

1. Name the form — what would the love look like built?
2. Schedule the build — carve a recurring block.
3. Make love legible as work — commitment, structure, contract.
4. Convert care into a system — so the love survives the day's energy.
5. Ship one small thing the love asks for, even unfinished.

A future workshop session locks the symmetric set. Until then, 55°–79° prose uses the existing NW Soul-leaning template without the band-specific affirmation/prescription structure.

### 13.6 Vocabulary register (priority-ordered, mixable)

For the **narrative prose** layer (NOT the dashboard surface), three registers are usable in priority order. Mixing registers within a single Movement prose is fine when natural; the priority order is which register *anchors* the read, not which is exclusive.

1. **Geometric (priority 1):** *the line, the angle, the scale*. Concrete and measurable. *Your line is rising. The angle is balanced. The scale is short.* Primary register for narrative prose; carries the geometry honestly.
2. **Motion (priority 2):** *the posture, the rise, the trajectory*. Dynamic frame. *Your posture leans toward the Work axis. The rise is gentle. The trajectory points toward giving.* Use to soften where the geometric register would read as cold.
3. **Warmer (priority 3):** *the shape, the balance*. Less precise but more accessible. *Your shape is forming. The balance leans toward Work.* Use sparingly, for moments where the warmer register lands a closing.

The dashboard surface uses **engine vocabulary** (Goal, Soul, Direction, Movement Strength, Giving, Gripping, Gripping Pull) — that's the data register and stays exact. Don't mix engine vocabulary into narrative prose; don't mix narrative vocabulary into dashboard fields.

### 13.7 Demographics gating

Life-stage guidance gates on **age (decade) + profession** only for MVP. Marital_status and the (currently absent) children/dependents field are NOT used by Movement read in CC-070. Parent-stage gating is deferred entirely to a future CC that adds a children field AND authors parent-specific guidance prose.

Per `demographic-rules.md` Rule 4: demographics may shape the Movement read's *guidance language* (interpolation), but MUST NOT change the angle/length math. Demographics has zero derivation impact.

Illustrative guidance shapes (CC-070 authors final prose):

- *Early-career professional (1990s–2000s decade, Knowledge worker):* Work-leaning short line is expected; the prompt is letting the line tilt as the season changes.
- *Mid-career (1970s decade, Healthcare):* the line typically broadens at this stage; both axes deserve activity.
- *Entrepreneur (any decade, Self-employed/Entrepreneur):* venture-building pulls the line hard toward Work; the question is whether the Love-line is pulling alongside or being deferred.

### 13.8 Confidence gating (MVP register)

For MVP, the Movement read renders **regardless of composite confidence**. A low-confidence read is NOT withheld behind a soft fallback (*"the picture isn't clear enough yet"*) — that response defeats the layer's purpose. Low signal density across Goal/Soul/Vulnerability composites correlates strongly with stuck-ness in the SW register; users in that state need *more* prompt to action, not less.

The MVP register is **tough-love companionship**: the Movement read names the short line and the thin signal honestly, and points at what motion would clarify the picture. Example shape:

> Your line is short and hard to read clearly. The signal here is thin. That is itself a Movement read: thin signal often means motion is what's needed to make the picture clearer. Willingness, courage, action, contact with what already matters to you — the line begins to widen when the verbs and the nouns get used. The next move is the smallest motion that contacts what already matters.

A future CC may add a soft fallback for users where low signal density reflects assessment incompleteness rather than stuck-ness. Until then, the strong read ships and observes.

### 13.9 Pattern catalog interaction

Movement read is **independent** of the cross-card pattern catalog (§9). When patterns fire (Defensive Builder, Generative Builder — *Parallel Lives is removed per the post-revision §9*), they render in their assigned surfaces — Closing Read kicker for Defensive Builder, Path · Gait card kicker for Generative Builder. Movement read does NOT read pattern fires; it reads geometry directly off `adjusted_goal` and `adjusted_soul`.

This independence is intentional. Patterns are categorical (fires or doesn't); Movement is continuous (an angle and a length). Compositing them in either direction collapses information.

### 13.10 Visual plot — ships in CC-A (post-revision)

The 2×2 visual plot is **part of the Goal/Soul Dashboard CC** (the next CC, no longer deferred). The plot specification is in §13.4a. Earlier draft of this section deferred the visual to a follow-up CC; that decision is reversed per the post-CC-070 canon revision — the dashboard surface is incomplete without the visual.

Implementation notes (carried from CC-070's recommendations for the visual plot):
- Hand-rolled SVG, ~80 lines. Recharts/Chart.js are overkill for one line + axis pair + labels.
- 90° arc only — Goal and Soul are positive composites, so only the first quadrant of the (line origin) coordinate plane is needed.
- Square 1:1 aspect ratio (CSS `aspect-ratio: 1 / 1` on the wrapper).
- Mobile breakpoint: full-width up to ~360px square; tablet/desktop: 320–400px.
- Special render for length=0: dot at origin, no line, label "the line has not yet been drawn" (matches the Neutral/Transition render).
- Special render for low confidence: line at 50% opacity with a "thin signal" annotation rather than a degree label.

### 13.11 Movement-specific guardrails

In addition to §12 general guardrails, the Movement layer adds:

- **Do NOT moralize on a short Movement Strength.** A short line reflects a moment, not a person. A short Movement Strength at age 22 is not a verdict; a short one at age 60 describes a posture, not a worth.
- **Do NOT prescribe specific Direction values by demographic.** The trajectory thesis is direction (the angle should rise; Movement Strength should grow), not a target. *"You should be at 35°"* is therapy register and is forbidden.
- **Do NOT collapse the Movement narrative into the dashboard or into Closing Read.** The dashboard, the Movement narrative, and Closing Read are three reads with three registers; each carries its own work.
- **Do NOT render Movement narrative prose with engine-layer words.** *Goal*, *Soul*, *Vulnerability*, *Direction*, *Movement Strength*, *Gripping Pull* are dashboard-surface labels — they appear in the dashboard data block but NOT in the narrative prose below it. Narrative prose uses the geometric / motion / warmer registers.
- **Do NOT speak both forward-projection and observed-trajectory simultaneously.** Until repeat assessments exist, Movement read speaks only forward-projection. When trajectory data lands, the read shifts; it does not become both.
- **Tough-love has a floor.** *Honest companionship* is the register; cruelty is not. *"Your Movement Strength is low — show up for your own life"* is editorial overreach. *"The line is short right now, and the work is to lengthen it through motion that contacts what you actually love"* is in-register.
- **Vulnerability is named in narrative prose as a growable quality, never as a number.** *"Vulnerability would lift this"*, *"the next move is the willingness to be seen"*, *"openness is what makes the line rise"* — all in-register. *"Your Vulnerability score is 22"* is forbidden — Vulnerability is engine-internal and never appears as a numeric field.
- **The 20°–44° angle band carries an affirmation rule.** Per §13.5b, when a user lands in this productive-NE-movement band with meaningful length, the prose's first sentence names the position honestly (out of Gripping, both axes active, lift toward Giving has started) BEFORE any prescription. Skipping the affirmation in this band is editorial overreach — the user has earned the position; the prose says so.
- **Soul-lift practices in 20°–44° prose are canonical, not optional.** Per §13.5b, one or two of the five practices appear in the bridge sentence(s); selecting which is signal-driven, not decorative.

---

## 14. OCEAN Integration (cross-reference to ocean-disposition-spec.md)

OCEAN/Disposition is a **disposition layer**, not an identity layer. It sits below the Goal/Soul/Give synthesis in the report's hierarchy: Body Map → Goal/Soul/Give synthesis → OCEAN/Disposition → Applied Maps. Big Five trait readings translate and color the deeper outputs; they never stand alone as a personality verdict and never lead the report.

Full architecture in `docs/ocean-disposition-spec.md`. The cross-references below summarize how each trait modifies the Goal/Soul read; deeper rules (composition, render canon, subdimensions, register interpretation) live in the OCEAN memo.

- **Conscientiousness × Goal.** High Conscientiousness strengthens the Work-line — the disposition channel through which productive motion gets organized, sustained, and finished. Risk: high Conscientiousness with thin Soul can entrench Striving.
- **Openness × Soul** (and **Architectural Openness × Goal+Soul integration**). Non-architectural Openness (Intellectual, Aesthetic, Novelty) tends to feed Soul. Architectural Openness — disciplined imagination that resolves into structure — sits at the integration point and strongly corroborates the Generative Builder pattern.
- **Extraversion × Soul visibility.** Low Extraversion can make a strong Love-line invisible to others — the user reads as Goal-leaning on the dashboard even with strong raw Soul, because the Vulnerability lift is what makes Soul-line activity visible enough to score.
- **Agreeableness × Soul interpretation.** High Agreeableness with high Soul typically reads as protective care, loyalty, and service. Low Agreeableness with high Soul can read as moral conviction, cause-driven service, or loyalty to truth/justice over relational accommodation. **In this instrument the Agreeableness signal predominantly expresses as loyalty/service/moral concern, not accommodation/social softness** — render canon §4 of the OCEAN memo is binding.
- **Emotional Reactivity × pressure response.** Low Emotional Reactivity can preserve steadiness under cost but may also conceal grief, longing, tenderness, or need. The Weather/Fire body-map cards already read pressure response; OCEAN adds the dispositional layer.

Render integration is implemented per the OCEAN memo §7–§8 composition rules and is **out of scope for the CC-067 → CC-070 chain**. OCEAN-side CCs follow once the Goal/Soul/Give chain settles.

---

## Prompt-Generation Value

This memo should be treated as a prompt architecture source. It enables five prompt families:

1. **Derivation prompts** — compute Goal, Soul, Vulnerability, quadrant, confidence, and evidence.
2. **Narrative prompts** — render the closing Purpose section using Work/Love/Give language.
3. **Pattern prompts** — detect Generative Builder, Defensive Builder, and future synthesis patterns.
4. **Audit prompts** — test for overreach, especially false Gripping, Compliance-as-fear, and low-signal misreads.
5. **Calibration prompts** — compare test reports and determine whether the quadrant placement feels earned.

Prompt writers should preserve this hierarchy:

- **Engine layer:** Goal / Soul / Vulnerability.
- **Narrative layer:** Work / Love / Give.
- **Report layer:** Purpose/Giving, Goal-leaning, Soul-leaning, Gripping, or Neutral / Transition.
- **Guardrail layer:** do not over-diagnose, do not moralize low signal, and prefer synthesis reads when supported.

### Prompt-family-to-roadmap mapping

| Prompt family | Implementation home |
|---|---|
| 1. Derivation | CC-A (composites + quadrant placement) |
| 2. Narrative | CC-D (closing Purpose section) |
| 3. Pattern | CC-C (pattern catalog additions) |
| 4. Audit | CC-A acceptance criteria — overreach tests must pass before composite weights are locked. Re-run on every later CC that touches the derivation or signal list. |
| 5. Calibration | Standing test surface, not a single CC. Fixture-driven cohort review of test sessions; should be re-run after any CC that changes signal weighting, narrative copy, or pattern thresholds. |

Audit and calibration are not optional. The risk this layer protects against is the report shipping a Gripping verdict, a false Generative Builder, or a Compliance-coded steward misread as a Gripper — each of which is a worse failure than the report rendering a softer Neutral/Transition closer.

---

## Implementation Sequencing (not a CC, but a roadmap)

A future CC chain to implement this would proceed roughly as:

1. **CC-A (derivation only):** implement Goal/Soul/Vulnerability composites against existing signals; validate quadrant placement on test sessions; render placeholder closing narratives. No new questions.
2. **CC-B (motive disambiguation):** add Q-Purpose-Building, five new `building_motive_*` signals, drive-bucket tags. Update `data/questions.ts`, `lib/types.ts`, `lib/drive.ts`. Update the question-bank xlsx (v4).
3. **CC-C (pattern catalog):** add Generative Builder and Defensive Builder patterns to the catalog. Wire into Path · Gait kicker.
4. **CC-D (closing narrative):** author the final Purpose section render. Pull canon language from this memo. Ensure synthesis reads land warmer than contradiction reads.

Each CC should be authored in chat with full guardrails per AGENTS.md (Launch Directive, Execution Directive, Bash Commands, Read First, Allowed-to-Modify, Out of Scope, Acceptance Criteria, Report Back).

## Open Questions for Canon Review

1. **Threshold calibration:** are 50/100 cuts on Goal and Soul the right defaults, or should the engine use percentile-of-cohort once cohort data exists?
2. **Vulnerability threshold for NE:** is `vulnerability_score ≥ 0` strict enough, or should NE require a positive Vulnerability score (e.g., ≥ 10)?
3. **Q-Purpose-Building placement:** confirm `role` card is correct (vs `sacred` — Soul anchor). Recommend `role` because the question reads contribution-mode.
4. **Building vs Creating split:** does the engine need to distinguish them in scoring, or only in narrative? For MVP, recommend narrative-only. However, preserve the Building vs. Creating distinction in canon and output language so future versions can distinguish Builder-purpose from Creator-purpose. Building points toward durable structures, systems, institutions, tools, and homes. Creating points toward expression, beauty, story, music, meaning, language, and revelation. Same quadrant, potentially different life paths — a Builder may need a company; a Creator may need a song, essay, sermon, image, or movement.
5. **Drive bucket tags for new signals:** confirm `building_motive_focused` → Cost; `building_motive_protective` → Compliance; `building_motive_control` → Compliance + Cost split. These affect revealed-Drive distribution and need Drive-canon owner sign-off.
