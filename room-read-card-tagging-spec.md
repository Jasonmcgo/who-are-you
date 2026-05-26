# Room Read — Card Tagging Spec (v1)

This is the spec for turning the card-library prose into **engine-ready, tagged cards**. Hand this whole document to the card generator (ChatGPT). It defines the schema, the **only** valid tags, how to weight them, and the rules that make a card actually work in the game.

---

## How the game uses these cards (why tags are everything)

The library holds the cards. At game time, the **engine** decides which player each card fits: for each card it scores every player as `Σ (card tag weight × that player's signal strength for that tag)`, and picks the highest. So a card written *for* Jason isn't bound to Jason — it carries Jason-ish **trait tags**, and in a room without Jason it lands on whoever's signals best match those tags. **Authorship = inspiration; tags = fit.** Cards travel to whoever fits, in any cohort.

Consequence: **the tags are the whole ballgame.** If a card is tagged with a word the engine doesn't produce, that tag scores `0` for everyone — the card fits no one, gets demoted, and **never appears in a game.** Silently. So every tag must come from the vocabulary in this doc, exactly spelled.

---

## Card schema (output format: JSON)

Emit the whole library as a single JSON array. Each card:

```json
{
  "id": "lens_governance_in_loose_thread",
  "theme": "lens",
  "modes": ["classic"],
  "prompt": "Who's more likely to spot the governance problem hiding inside the loose thread?",
  "tags": [
    { "tag": "pattern_reader", "weight": 1.0 },
    { "tag": "long_arc_thinking", "weight": 0.5 },
    { "tag": "deep_seeing", "weight": 0.4 }
  ]
}
```

Fields:
- **id** — unique, stable slug, `theme_short_descriptor`, lowercase_snake_case. Must be unique across the ENTIRE library (it's the dedup key). 840 cards = 840 unique ids.
- **theme** — exactly one of the 8 engine theme keys (see mapping below).
- **modes** — always `["classic"]`.
- **prompt** — the player-facing question (see Rule 1).
- **tags** — 2–4 entries (3 is the norm), each `{tag, weight}` (see Rules 2–4).

---

## Theme keys (map the library's labels → engine keys)

| Library label              | engine `theme` |
|----------------------------|----------------|
| Lens / Eyes                | `lens`         |
| Compass / Heart            | `compass`      |
| Hands / Work (a.k.a Craft) | `hands`        |
| Conviction / Voice         | `voice`        |
| Gravity / Spine            | `gravity`      |
| Trust / Ears               | `trust`        |
| Fire / Immune Response     | `fire`         |
| Path / Gait                | `path`         |

---

## Rule 1 — The prompt must be a complete sentence

Every prompt is a grammatical question: **"Who's more likely to `[VERB]` …?"** The verb is mandatory — a prompt with no verb after "more likely to" is a fragment and is rejected. Verb palette by theme (illustrative, not exhaustive):

- **lens:** spot, see, name, notice, catch, read
- **compass:** protect, defend, choose, guard, hold, honor
- **hands:** build, draft, produce, ship, over-engineer, make
- **voice:** say, name, deliver, blurt, land
- **gravity:** carry, hold, own, shoulder, absorb
- **trust:** trust, believe, defer to, follow
- **fire:** run toward, fight, confront, protect, stay calm through
- **path:** return to, rebuild, move toward, commit to

---

## Rule 1b — Gender-neutral prompts (no exceptions)

Cards travel to **any** player by tag-fit, so a card written "for her" will land on a male player and read wrong. **No gendered pronouns** — never `he`, `she`, `him`, `her`, `his`, `hers`, `himself`, `herself`. Use `they / them / their / themselves`, and fix verb agreement (`he remembers` → `they remember`, `she is` → `they are`). The card is about whoever the engine picks, not the person it was inspired by.

## Rule 2 — One dominant trait per card

Each card expresses **exactly one** dominant trait, plus 1–2 supporting traits that genuinely co-occur with it. **Do NOT tag a card with the person's whole profile.** Build from a person's report, but distill each card to a *single readable facet* of them ("rewrites the email four times" → `perfection_pressure`), not all 12 of their signals. Over-tagged cards over-fit their origin person and stop traveling. 3 tags total is the norm; never more than 4.

---

## Rule 3 — Valid tags ONLY (the complete vocabulary)

Use only these tags, spelled exactly. Each card's tags should be drawn primarily from its theme's affinity list, but any tag below is valid on any theme if it genuinely fits.

**Reading reality (lens-leaning):**
- `pattern_reader` — sees the underlying pattern/system others miss
- `deep_seeing` — perceives what's beneath the surface; the unspoken
- `long_arc_thinking` — thinks in long time horizons
- `future_awareness` — anticipates downstream / second-order consequences
- `discernment` — judges quality/credibility; separates signal from noise
- `precedent_memory` — measures the new against every prior version
- `emotional_perception` — reads the emotional weather/undercurrent
- `possibility_finder` — generates branches/alternatives (Ne)
- `improviser` — works in the live present moment; adapts on the fly
- `meaning_making` — finds the meaning / the "why" beneath the surface

**What you protect (compass-leaning):**
- `loyalty` — shows up for the same people over decades
- `steadiness` — constant, unflappable, same week after week
- `faithful_reliability` — keeps commitments; can be counted on
- `truth_teller` — says the uncomfortable true thing
- `conviction` — holds a principle/belief at cost
- `cost_bearing` — pays a personal price for what's right
- `freedom_grip` — protects autonomy; resists obligation
- `high_openness` — curious, exploratory, open to the new
- `boundary_awareness` — knows and holds the line between self and others
- `faith_truth_loyalty` — organizes life around one sacred idea/belief
- `protective_care` — quietly responsible for protecting people
- `useful_devotion` — love expressed as practical help / showing up
- `quiet_sacrifice` — gives up something unseen for others

**What the hands make (hands-leaning):**
- `practical_order` — builds the actual thing; makes order real
- `high_conscientiousness` — thorough, careful, finishes well
- `structurer` — builds frameworks/systems/scaffolding
- `competence_mask` — hides strain behind looking-handled
- `hidden_burden` — carries unseen load
- `control_mastery_grip` — grips control through mastery/competence
- `mission_permission_grip` — only rests when the work has a real reason
- `perfection_pressure` — over-refines; can't ship until it's right

**Speak (voice-leaning):**
- `connector` — reads the room; bridges/translates people
- `verbal_processing` — thinks out loud; processes through talking
- `relational_repair` — fixes the relationship before the argument
- `social_warmth` — warmth that puts a room at ease
- `emotional_containment` — holds emotion; silence that means something

**Carry the weight (gravity-leaning):**
- `responsibility_load` — picks up what nobody else will own
- `burden_responsibility_grip` — grips on being the one who carries
- `being_needed_grip` — identity tied to being needed
- `high_agreeableness_spine` — holds the line FOR others

**Whose voice gets authority (trust-leaning):**
- `security_grip` — trusts the budget/runway over the vision
- `belonging_approval_grip` — calibrated by a few people's approval

**Immune response (fire-leaning):**
- `crisis_action` — comes alive / acts decisively in a crisis
- `intensity` — high-amplitude presence; the weather in the room
- `calm_containment` — pulse stays at 68 in chaos
- `control_certainty_grip` — returns to the plan that used to work, under pressure

**Long arc (path-leaning):**
- `aim_governance` — a long quiet arc the rest of life arranges around
- `risk_tolerance` — jumps before certain; would rather be wrong than wait

### Theme → common tags (use these first for each theme)

- **lens:** pattern_reader, deep_seeing, long_arc_thinking, future_awareness, discernment, precedent_memory, emotional_perception, possibility_finder, improviser, meaning_making
- **compass:** loyalty, steadiness, faithful_reliability, truth_teller, conviction, cost_bearing, freedom_grip, high_openness, boundary_awareness, faith_truth_loyalty, protective_care, useful_devotion, quiet_sacrifice
- **hands:** practical_order, high_conscientiousness, structurer, competence_mask, hidden_burden, control_mastery_grip, useful_devotion, mission_permission_grip, conviction, perfection_pressure
- **voice:** truth_teller, conviction, cost_bearing, connector, verbal_processing, relational_repair, social_warmth, improviser, emotional_containment, boundary_awareness, discernment, high_agreeableness_spine
- **gravity:** responsibility_load, faithful_reliability, high_conscientiousness, quiet_sacrifice, hidden_burden, burden_responsibility_grip, being_needed_grip, high_agreeableness_spine, protective_care, competence_mask, control_mastery_grip
- **trust:** conviction, precedent_memory, faith_truth_loyalty, discernment, long_arc_thinking, boundary_awareness, loyalty, faithful_reliability, security_grip, practical_order, belonging_approval_grip, connector
- **fire:** protective_care, conviction, cost_bearing, calm_containment, emotional_containment, steadiness, truth_teller, crisis_action, improviser, structurer, control_certainty_grip, precedent_memory
- **path:** aim_governance, long_arc_thinking, conviction, intensity, high_openness, future_awareness, steadiness, faithful_reliability, high_conscientiousness, meaning_making, risk_tolerance, improviser

---

## Rule 4 — Weight rubric

- **Dominant tag:** `1.0` (use `0.7–0.9` only for a deliberately softer/blended card).
- **Supporting tag(s):** `0.4–0.6`.
- **Optional tertiary:** `0.3`.

The dominant `1.0` is what makes the card "about" that trait, so the engine ranks players cleanly on that one signal. Don't flatten — avoid three tags all at the same weight.

---

## Rule 5 — Grip tags are real but use sparingly

Tags ending in `_grip` (`control_mastery_grip`, `freedom_grip`, `security_grip`, `belonging_approval_grip`, `being_needed_grip`, `burden_responsibility_grip`, `mission_permission_grip`, `control_certainty_grip`) describe a shape under *pressure*. They're valid and useful for the darker/sharper cards, but a card whose dominant tag is a grip should read as the gift-under-pressure, not a flat insult.

---

## Gold standard — JasonDMcG's 40 cards (the reference to mimic)

Pattern anchor: Ni-Te pattern-reader / structurer; Faith, Truth, Knowledge, Loyalty; Control/Mastery grip. Note how each card has **one dominant tag**, a complete-sentence prompt, and rubric weights.

```json
[
  { "id": "lens_governance_in_loose_thread", "theme": "lens", "modes": ["classic"],
    "prompt": "Who's more likely to spot the governance problem hiding inside the loose thread?",
    "tags": [{"tag":"pattern_reader","weight":1.0},{"tag":"long_arc_thinking","weight":0.5},{"tag":"deep_seeing","weight":0.4}] },
  { "id": "lens_second_order_consequence", "theme": "lens", "modes": ["classic"],
    "prompt": "Who's more likely to see the second-order consequence before the first one has even found parking?",
    "tags": [{"tag":"future_awareness","weight":1.0},{"tag":"long_arc_thinking","weight":0.6},{"tag":"pattern_reader","weight":0.4}] },
  { "id": "lens_coincidence_pattern", "theme": "lens", "modes": ["classic"],
    "prompt": "Who's more likely to catch the pattern everyone else calls a coincidence because they're tired?",
    "tags": [{"tag":"pattern_reader","weight":1.0},{"tag":"deep_seeing","weight":0.5},{"tag":"discernment","weight":0.4}] },
  { "id": "lens_driving_assumption", "theme": "lens", "modes": ["classic"],
    "prompt": "Who's more likely to name the assumption quietly driving the whole room?",
    "tags": [{"tag":"deep_seeing","weight":1.0},{"tag":"pattern_reader","weight":0.5},{"tag":"discernment","weight":0.4}] },
  { "id": "lens_moral_weather_in_technical", "theme": "lens", "modes": ["classic"],
    "prompt": "Who's more likely to see the moral weather hiding inside a technical issue?",
    "tags": [{"tag":"meaning_making","weight":1.0},{"tag":"deep_seeing","weight":0.6},{"tag":"pattern_reader","weight":0.4}] },

  { "id": "compass_truth_with_dependents", "theme": "compass", "modes": ["classic"],
    "prompt": "Who's more likely to defend the truth like it has dependents?",
    "tags": [{"tag":"truth_teller","weight":1.0},{"tag":"conviction","weight":0.6},{"tag":"cost_bearing","weight":0.4}] },
  { "id": "compass_faith_as_infrastructure", "theme": "compass", "modes": ["classic"],
    "prompt": "Who's more likely to treat faith as if it were infrastructure?",
    "tags": [{"tag":"faith_truth_loyalty","weight":1.0},{"tag":"conviction","weight":0.5},{"tag":"long_arc_thinking","weight":0.4}] },
  { "id": "compass_principle_when_room_leaves", "theme": "compass", "modes": ["classic"],
    "prompt": "Who's more likely to hold the principle even when the room starts putting on its coats?",
    "tags": [{"tag":"conviction","weight":1.0},{"tag":"cost_bearing","weight":0.5},{"tag":"truth_teller","weight":0.4}] },
  { "id": "compass_people_under_the_structure", "theme": "compass", "modes": ["classic"],
    "prompt": "Who's more likely to protect the people carried by the structure — once he remembers to name them?",
    "tags": [{"tag":"protective_care","weight":1.0},{"tag":"responsibility_load","weight":0.5},{"tag":"quiet_sacrifice","weight":0.4}] },
  { "id": "compass_sacred_as_system", "theme": "compass", "modes": ["classic"],
    "prompt": "Who's more likely to honor the sacred thing by turning it into a system with a maintenance plan?",
    "tags": [{"tag":"faith_truth_loyalty","weight":1.0},{"tag":"structurer","weight":0.5},{"tag":"useful_devotion","weight":0.4}] },

  { "id": "hands_seven_part_framework", "theme": "hands", "modes": ["classic"],
    "prompt": "Who's more likely to build a seven-part framework with legal implications?",
    "tags": [{"tag":"structurer","weight":1.0},{"tag":"high_conscientiousness","weight":0.5},{"tag":"practical_order","weight":0.4}] },
  { "id": "hands_bridge_and_essay", "theme": "hands", "modes": ["classic"],
    "prompt": "Who's more likely to deliver the bridge, the inspection protocol, and a short essay on bridge theory?",
    "tags": [{"tag":"practical_order","weight":1.0},{"tag":"structurer","weight":0.6},{"tag":"high_conscientiousness","weight":0.4}] },
  { "id": "hands_unrequested_strategy_memo", "theme": "hands", "modes": ["classic"],
    "prompt": "Who's more likely to write a strategy memo nobody requested but everyone later uses?",
    "tags": [{"tag":"structurer","weight":1.0},{"tag":"long_arc_thinking","weight":0.5},{"tag":"mission_permission_grip","weight":0.4}] },
  { "id": "hands_structure_before_tea", "theme": "hands", "modes": ["classic"],
    "prompt": "Who's more likely to build a structure around the person before asking whether the person wanted tea?",
    "tags": [{"tag":"control_mastery_grip","weight":1.0},{"tag":"structurer","weight":0.6},{"tag":"practical_order","weight":0.4}] },
  { "id": "hands_lawyer_proof_model", "theme": "hands", "modes": ["classic"],
    "prompt": "Who's more likely to build a model sturdy enough to survive lawyers, weather, and cousin-level feedback?",
    "tags": [{"tag":"perfection_pressure","weight":1.0},{"tag":"high_conscientiousness","weight":0.6},{"tag":"structurer","weight":0.4}] },

  { "id": "voice_accurate_before_budgeted", "theme": "voice", "modes": ["classic"],
    "prompt": "Who's more likely to say the accurate thing before the room has emotionally budgeted for accuracy?",
    "tags": [{"tag":"truth_teller","weight":1.0},{"tag":"conviction","weight":0.6},{"tag":"cost_bearing","weight":0.4}] },
  { "id": "voice_unrequested_ted_talk", "theme": "voice", "modes": ["classic"],
    "prompt": "Who's more likely to deliver a TED Talk nobody requested but several people needed?",
    "tags": [{"tag":"verbal_processing","weight":1.0},{"tag":"conviction","weight":0.5},{"tag":"connector","weight":0.4}] },
  { "id": "voice_brief_then_convention", "theme": "voice", "modes": ["classic"],
    "prompt": "Who's more likely to say 'I'll be brief' and then convene a constitutional convention?",
    "tags": [{"tag":"verbal_processing","weight":1.0},{"tag":"structurer","weight":0.5},{"tag":"conviction","weight":0.4}] },
  { "id": "voice_wounds_the_furniture", "theme": "voice", "modes": ["classic"],
    "prompt": "Who's more likely to deliver the truth carefully enough to wound nobody and still somehow wound the furniture?",
    "tags": [{"tag":"truth_teller","weight":1.0},{"tag":"discernment","weight":0.5},{"tag":"cost_bearing","weight":0.4}] },
  { "id": "voice_conclusion_with_footnotes", "theme": "voice", "modes": ["classic"],
    "prompt": "Who's more likely to land a conclusion with footnotes, humility, and one suspiciously sharp edge?",
    "tags": [{"tag":"conviction","weight":1.0},{"tag":"discernment","weight":0.5},{"tag":"truth_teller","weight":0.4}] },

  { "id": "gravity_thing_behind_the_thing", "theme": "gravity", "modes": ["classic"],
    "prompt": "Who's more likely to carry the thing, the thing behind the thing, and the future committee that will misread both?",
    "tags": [{"tag":"responsibility_load","weight":1.0},{"tag":"long_arc_thinking","weight":0.5},{"tag":"future_awareness","weight":0.4}] },
  { "id": "gravity_strategic_burden", "theme": "gravity", "modes": ["classic"],
    "prompt": "Who's more likely to shoulder the strategic burden and call it just thinking ahead?",
    "tags": [{"tag":"responsibility_load","weight":1.0},{"tag":"hidden_burden","weight":0.5},{"tag":"long_arc_thinking","weight":0.4}] },
  { "id": "gravity_accountability_until_blame_leaves", "theme": "gravity", "modes": ["classic"],
    "prompt": "Who's more likely to hold accountability until vague blame quietly leaves the building?",
    "tags": [{"tag":"responsibility_load","weight":1.0},{"tag":"high_conscientiousness","weight":0.5},{"tag":"faithful_reliability","weight":0.4}] },
  { "id": "gravity_load_bearing_question", "theme": "gravity", "modes": ["classic"],
    "prompt": "Who's more likely to own the load-bearing question no one else wanted?",
    "tags": [{"tag":"responsibility_load","weight":1.0},{"tag":"conviction","weight":0.5},{"tag":"burden_responsibility_grip","weight":0.4}] },
  { "id": "gravity_two_lonely_parts", "theme": "gravity", "modes": ["classic"],
    "prompt": "Who's more likely to carry the responsible part, plus two nearby parts that looked lonely?",
    "tags": [{"tag":"burden_responsibility_grip","weight":1.0},{"tag":"responsibility_load","weight":0.6},{"tag":"hidden_burden","weight":0.4}] },

  { "id": "trust_receipts_over_charisma", "theme": "trust", "modes": ["classic"],
    "prompt": "Who's more likely to trust receipts over confidence, charisma, or interpretive dance?",
    "tags": [{"tag":"discernment","weight":1.0},{"tag":"practical_order","weight":0.5},{"tag":"boundary_awareness","weight":0.4}] },
  { "id": "trust_proximity_over_title", "theme": "trust", "modes": ["classic"],
    "prompt": "Who's more likely to trust the person with operational proximity over the person with a title?",
    "tags": [{"tag":"discernment","weight":1.0},{"tag":"practical_order","weight":0.5},{"tag":"long_arc_thinking","weight":0.4}] },
  { "id": "trust_interrupter_before_architecture", "theme": "trust", "modes": ["classic"],
    "prompt": "Who's more likely to keep one trusted interrupter on hand before certainty becomes architecture?",
    "tags": [{"tag":"discernment","weight":1.0},{"tag":"control_mastery_grip","weight":0.5},{"tag":"loyalty","weight":0.4}] },
  { "id": "trust_evidence_updates_model", "theme": "trust", "modes": ["classic"],
    "prompt": "Who's more likely to follow evidence that updates the model, even when the model resents it?",
    "tags": [{"tag":"discernment","weight":1.0},{"tag":"high_openness","weight":0.5},{"tag":"long_arc_thinking","weight":0.4}] },
  { "id": "trust_own_counsel_as_mentor", "theme": "trust", "modes": ["classic"],
    "prompt": "Who's more likely to trust the mentor, then his own counsel, then his own counsel pretending to be the mentor?",
    "tags": [{"tag":"conviction","weight":1.0},{"tag":"precedent_memory","weight":0.5},{"tag":"loyalty","weight":0.4}] },

  { "id": "fire_run_toward_with_disappointment", "theme": "fire", "modes": ["classic"],
    "prompt": "Who's more likely to run toward the system failure with a plan and mild disappointment?",
    "tags": [{"tag":"crisis_action","weight":1.0},{"tag":"structurer","weight":0.5},{"tag":"conviction","weight":0.4}] },
  { "id": "fire_dragon_governance_postmortem", "theme": "fire", "modes": ["classic"],
    "prompt": "Who's more likely to fight the dragon, then write the dragon-governance postmortem?",
    "tags": [{"tag":"crisis_action","weight":1.0},{"tag":"structurer","weight":0.6},{"tag":"long_arc_thinking","weight":0.4}] },
  { "id": "fire_both_fire_and_department", "theme": "fire", "modes": ["classic"],
    "prompt": "Who's more likely to be both the fire and the fire department?",
    "tags": [{"tag":"intensity","weight":1.0},{"tag":"crisis_action","weight":0.5},{"tag":"control_mastery_grip","weight":0.4}] },
  { "id": "fire_chaos_into_steering_committee", "theme": "fire", "modes": ["classic"],
    "prompt": "Who's more likely to turn chaos into a steering committee before lunch?",
    "tags": [{"tag":"structurer","weight":1.0},{"tag":"crisis_action","weight":0.5},{"tag":"control_certainty_grip","weight":0.4}] },
  { "id": "fire_redesign_the_conditions", "theme": "fire", "modes": ["classic"],
    "prompt": "Who's more likely to protect the vulnerable by redesigning the conditions that made them vulnerable?",
    "tags": [{"tag":"protective_care","weight":1.0},{"tag":"structurer","weight":0.5},{"tag":"long_arc_thinking","weight":0.4}] },

  { "id": "path_rebuild_the_path", "theme": "path", "modes": ["classic"],
    "prompt": "Who's more likely to return to purpose by rebuilding the path instead of merely walking it?",
    "tags": [{"tag":"aim_governance","weight":1.0},{"tag":"meaning_making","weight":0.5},{"tag":"long_arc_thinking","weight":0.4}] },
  { "id": "path_love_is_not_the_point", "theme": "path", "modes": ["classic"],
    "prompt": "Who's more likely to remember love is not winning the point — while keeping the point available for review?",
    "tags": [{"tag":"meaning_making","weight":1.0},{"tag":"relational_repair","weight":0.5},{"tag":"conviction","weight":0.4}] },
  { "id": "path_save_kingdom_complain_meeting", "theme": "path", "modes": ["classic"],
    "prompt": "Who's more likely to save the kingdom and then complain about the meeting?",
    "tags": [{"tag":"mission_permission_grip","weight":1.0},{"tag":"conviction","weight":0.5},{"tag":"intensity","weight":0.4}] },
  { "id": "path_structure_becomes_mercy", "theme": "path", "modes": ["classic"],
    "prompt": "Who's more likely to let structure become mercy instead of just machinery?",
    "tags": [{"tag":"aim_governance","weight":1.0},{"tag":"structurer","weight":0.5},{"tag":"meaning_making","weight":0.4}] },
  { "id": "path_decides_what_not_to_control", "theme": "path", "modes": ["classic"],
    "prompt": "Who's more likely to move forward once he decides what does not need to be controlled?",
    "tags": [{"tag":"control_mastery_grip","weight":1.0},{"tag":"aim_governance","weight":0.5},{"tag":"risk_tolerance","weight":0.4}] }
]
```

---

## Output checklist (the validator enforces all of these)

- [ ] Every `tag` is in the vocabulary above, spelled exactly.
- [ ] Every `theme` is one of the 8 engine keys.
- [ ] Every `id` is unique across the whole library.
- [ ] Every `prompt` is a complete "Who's more likely to `[VERB]` …?" sentence (no fragments).
- [ ] Each card has 2–4 tags, exactly one dominant (`1.0`, or `0.7–0.9`), supporting at `0.4–0.6`.
- [ ] Output is a single valid JSON array.
