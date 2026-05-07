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
- **Pattern catalog:** one or two new cross-card patterns (Generative Builder, Parallel Lives, Defensive Builder).
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

### Vulnerability / Openness vector (Z, orthogonal)

The willingness to be seen, corrected, contradicted, or moved. The capacity to let one's own building or loving be unfinished in the presence of another.

Vulnerability is **not** part of the 2x2. Picture Goal and Soul as the X/Y plane and Vulnerability as the Z-axis coming out of the page. High Vulnerability lifts a person toward the synthesis (NE) regardless of which 2x2 quadrant they currently sit in.

Critical rule: do not collapse Vulnerability into Soul. A person can score high Soul with low Vulnerability (the loving but defended caretaker), high Goal with high Vulnerability (the builder who lets unfinished work be seen), or high Goal **and** high Soul with low Vulnerability (the compartmentalized person whose verbs and nouns inhabit different rooms).

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

### NE — Give / Purpose / Generativity (high Goal × high Soul × sufficient Vulnerability)

Form serving love. Expression serving truth. Work becoming gift.

Renders for: Work + Love, giving, inspiring others to give, meaningful courage, vulnerability as posture, moral peace, contribution, mission, generative building, creative expression in service of human need. The narrative may use *purpose, calling, generativity, contribution, mission*. *Destiny* is allowed only when confidence is high — high Goal, high Soul, high Vulnerability, and at least one supporting cross-card pattern firing.

### SE — Striving / Producing (high Goal, low Soul)

Motion without enough love. Achievement detached from care. Solving without human attachment. Execution without meaning. Money or provision untethered from deeper purpose.

Striving is **not** failure. It is capable but incomplete. The completion is not more output — it is anchoring the output in what the person actually loves.

### NW — Longing (low Goal, high Soul)

Love without enough form. Care without action. Empathy without structure. Meaning without motion. Tenderness without agency.

Longing is **not** weakness. It is unincarnated love. The completion is form — the structure, habit, work, or commitment that lets what the person loves become real for someone other than themselves.

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

### Quadrant placement

```
goal_high = goal_score ≥ 50
soul_high = soul_score ≥ 50
vuln_sufficient = vulnerability_score ≥ 0  (i.e., not net-closed)
gripping_cluster_fires = (see §4 SW cluster requirement)

if goal_high and soul_high and vuln_sufficient:
    quadrant = NE (Give)
elif goal_high and soul_high and not vuln_sufficient:
    quadrant = NE-compartmentalized (Parallel Lives pattern)
elif goal_high and not soul_high:
    quadrant = SE (Striving)
elif not goal_high and soul_high:
    quadrant = NW (Longing)
elif gripping_cluster_fires:
    quadrant = SW (Gripping)
else:
    quadrant = neutral / transition (do not render Gripping narrative)
```

**Canon (CC-067 clarification):** the algorithm above intentionally places Striving above the Gripping cluster check. A person with `goal_high = True` whose Gripping cluster *also* fires renders as **Striving with a defensive/protective modifier** (carried by the Defensive Builder pattern in CC-C), NOT as primary SW Gripping. Primary Gripping is reserved for defensive pressure paired with low Goal AND thin Soul. Rationale: the §10 Gripping render frames the state as *a season rather than a shape*, which does not fit a high-output person who is clearly accomplishing things even if defensively. The pattern catalog is the cleaner architectural carrier for high-output defensive cases.

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

**Fires when:** `goal_score ≥ 60` AND `soul_score ≥ 60` AND `vulnerability_score ≥ 10` AND (`building_motive_present` OR `building_motive_expressive`).

**Read:** form serving love. The person builds or creates in service of something they protect.

**Renders in:** Path · Gait card kicker, plus closing Purpose narrative.

### Defensive Builder

(Engine-internal name. Avoid surfacing this label to users — *Defensive Builder* and especially *Gripper Disguised as Builder* read as accusation. The user-facing render should be neutral.)

**Fires when:** (`building_motive_protective` OR `building_motive_control`) AND Gripping cluster active AND `vulnerability_score < 0` AND thin Soul-line.

**Read:** building primarily to prevent collapse, exposure, or loss.

**Renders in:** softened closing narrative — *"the model is reading building as protection right now."* Never as a stable identity claim. May be a season rather than a shape.

### Parallel Lives

**Fires when:** `goal_score ≥ 60` AND `soul_score ≥ 60` AND `vulnerability_score < 0`.

**Read:** the verbs and the nouns are both strong but inhabit different rooms. Building well at work and loving well at home, but the two haven't yet synthesized into Give.

**Renders in:** closing Purpose narrative as a diagnostic. **This is a high-value pattern** — many capable, kind people land here, and the report's most useful single sentence may be naming this gap and pointing to Vulnerability as the bridge.

## 10. Closing Purpose Render Examples

Sample closings, ~3-5 sentences each. The CC implementing this should produce final copy; these are reference shape.

### Register guidance for closing prose (CC-067 clarifications, canonized)

- **"Instrument" over "model"** in user-facing copy. *The instrument reads…* lands warmer than *the model reads…* and frames the report as a tool rather than a verdict-machine.
- **"Giving" over "generativity"** in user-facing copy. Lower-case English over academic register.
- **No engine-layer words in user-facing prose.** "Goal," "Soul," "Vulnerability" do not appear; the narrative uses Work, Love, Give, Purpose, plus the named-region nouns.
- **No engine-internal pattern names in user-facing prose.** "Parallel Lives," "Defensive Builder," "Gripper" never surface to users. The Parallel Lives quadrant renders narratively as *what you build and who you love appearing to live in different rooms*; the bridge is named without the label.
- **Each closing must name a bridge or next movement, not merely describe the quadrant.** A closing that only names where the user is reads as a verdict; one that points at the next move reads as honest companionship. The bridge can be a sentence ("The completion is…", "The way out is rarely…", "The bridge to giving is…", "The work is…"), an action verb, or a forward-pointing clause. If a closing reads as a label without a forward-pointing close, it has not yet earned the render.

### NE — Give

> Your verbs and your nouns appear to be pulling in the same direction. What you build, who you serve, and what you protect are not in three different rooms. The instrument reads this as the early shape of giving — work taking the form of love, love taking the form of work. Whatever you're moving toward next, the conditions are here for it to mean what you want it to mean.

### SE — Striving

> Your form is strong. Your purpose is forming. The instrument sees consistent productive motion — building, solving, executing — without yet a clear love-line connecting it to what you protect. Striving is capable but unfinished; the completion is not more output, it's anchoring the output in what you actually love.

### NW — Longing

> What you love is clear. The form is forming. The instrument sees deep relational and moral signal without yet the structure or motion that would let it land in the world. Longing is not weakness — it is unincarnated love. The completion is form: the structure, habit, work, or commitment that lets what you love become real for someone other than you.

### SW — Gripping (only when cluster fires)

> The instrument is reading defensive pressure right now. What you're holding appears to be held against loss more than for love or motion. This may be a season rather than a shape — Gripping rarely names a person; more often it names a moment they're in. The way out is rarely more holding.

### Parallel Lives (high G + high S + low V)

> What you build and who you love both come through clearly — but the two appear to live in different rooms. The verbs and the nouns are strong; they don't yet inhabit the same space. The bridge to Give isn't more building or more loving — it's vulnerability. The willingness to let the two halves of your life see each other.

### Neutral / Transition (low G + low S + Gripping cluster fails)

> The signal here is quiet. That isn't a verdict — sometimes the model is reading a season of rest, recovery, or transition rather than a settled shape. The body-map cards above still hold; the synthesis read may be more useful after another pass.

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

1. **Do not collapse Compliance into Gripping.** Compliance is one of the three Drive buckets and represents legitimate stewardship/risk-management. Gripping is fear-driven contraction. Distinguishable by Soul-line activity, Vulnerability score, and Stakes composition (close-relationships and health = stewardship; money and reputation under pressure-adaptation = Gripping).
2. **Do not collapse Vulnerability into Soul.** Z-axis, not Y-axis. The compartmentalized high-G high-S low-V case is the proof — it would be invisible if Vulnerability were folded into Soul.
3. **Do not make Soul too abstract.** Love is the anchor, not Presence. Presence is downstream. Avoid "Soul becoming present in the world" phrasings — they drift into therapy register and reinforce the marble-statue humanity gap.
4. **Do not create a ninth shape card.** Goal/Soul is rendered in the closing Purpose narrative and as a kicker on Path · Gait. The eight-card body-map metaphor stays intact.
5. **Do not let Work/Love/Give compete with Goal/Soul.** They are the same construct at two levels of resolution. Engine speaks axes; narrative speaks regions. Reports should not run both languages in parallel.
6. **Prefer synthesis reads when supported, not only contradiction reads.** The model's tension-detection (claimed-vs-revealed Drive, sacred-vs-stakes, 3C-vs-energy) is strong but defaults the report toward "here's where you're inconsistent." Goal/Soul/Give introduces a coherence read — NE means verbs and nouns pulling the same direction, and the closing narrative gets to say so. Do not default every interesting pattern into contradiction.
7. **Do not surface engine-internal names to users.** *Defensive Builder*, *Gripper Disguised as Builder*, *Parallel Lives* — these are pattern-catalog identifiers, not user-facing labels. The closing narrative should soften further.
8. **Do not infer Gripping from low signal.** Low Goal + low Soul defaults to neutral/transition unless the cluster fires. Gripping is a verdict; verdicts require evidence.

---

## Prompt-Generation Value

This memo should be treated as a prompt architecture source. It enables five prompt families:

1. **Derivation prompts** — compute Goal, Soul, Vulnerability, quadrant, confidence, and evidence.
2. **Narrative prompts** — render the closing Purpose section using Work/Love/Give language.
3. **Pattern prompts** — detect Generative Builder, Parallel Lives, Defensive Builder, and future synthesis patterns.
4. **Audit prompts** — test for overreach, especially false Gripping, Compliance-as-fear, and low-signal misreads.
5. **Calibration prompts** — compare test reports and determine whether the quadrant placement feels earned.

Prompt writers should preserve this hierarchy:

- **Engine layer:** Goal / Soul / Vulnerability.
- **Narrative layer:** Work / Love / Give.
- **Report layer:** Purpose, Striving, Longing, Gripping, Parallel Lives, or Neutral / Transition.
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
3. **CC-C (pattern catalog):** add Generative Builder, Defensive Builder, Parallel Lives patterns to the catalog. Wire into Path · Gait kicker.
4. **CC-D (closing narrative):** author the final Purpose section render. Pull canon language from this memo. Ensure synthesis reads land warmer than contradiction reads.

Each CC should be authored in chat with full guardrails per AGENTS.md (Launch Directive, Execution Directive, Bash Commands, Read First, Allowed-to-Modify, Out of Scope, Acceptance Criteria, Report Back).

## Open Questions for Canon Review

1. **Threshold calibration:** are 50/100 cuts on Goal and Soul the right defaults, or should the engine use percentile-of-cohort once cohort data exists?
2. **Vulnerability threshold for NE:** is `vulnerability_score ≥ 0` strict enough, or should NE require a positive Vulnerability score (e.g., ≥ 10)?
3. **Q-Purpose-Building placement:** confirm `role` card is correct (vs `sacred` — Soul anchor). Recommend `role` because the question reads contribution-mode.
4. **Building vs Creating split:** does the engine need to distinguish them in scoring, or only in narrative? For MVP, recommend narrative-only. However, preserve the Building vs. Creating distinction in canon and output language so future versions can distinguish Builder-purpose from Creator-purpose. Building points toward durable structures, systems, institutions, tools, and homes. Creating points toward expression, beauty, story, music, meaning, language, and revelation. Same quadrant, potentially different life paths — a Builder may need a company; a Creator may need a song, essay, sermon, image, or movement.
5. **Drive bucket tags for new signals:** confirm `building_motive_focused` → Cost; `building_motive_protective` → Compliance; `building_motive_control` → Compliance + Cost split. These affect revealed-Drive distribution and need Drive-canon owner sign-off.
