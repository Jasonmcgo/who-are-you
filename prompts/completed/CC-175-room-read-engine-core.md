# CC-175-ROOM-READ-ENGINE-CORE

> Cowork-chat CC, 2026-05-25. First of a 3-CC chain building a new multiplayer
> mode, **Room Read: Body Card Journey**, on top of the existing assessment
> engine. This CC builds ONLY the pure-logic core under `lib/games/roomRead/`:
> types, card library, the player-signal builder, engine matching, game
> generation, scoring, verdict — plus unit tests. **No persistence, no API
> routes, no UI** (those are CC-176 / CC-177). Getting the engine to pick sane
> people from REAL constitution data is the whole premise; the read is the
> product, so correctness here gates everything downstream.

## Dependency — run AFTER CC-SCORESI-DISPOSITION-DISCRIMINATOR

This CC is sequenced **second**. `CC-SCORESI-DISPOSITION-DISCRIMINATOR` lands
first and corrects Jason's cross-signal `si` (drops it below his `ni`). Build and
run this CC on the post-SCORESI engine. The Si/Ni sanity test in Acceptance §2
assumes that fix is in place. If you are running this BEFORE SCORESI has landed,
stop and flag — the §2 test will behave differently on Jason.

## The game (context, so the core is shaped right)

One round = **one Body Card theme + one shared prompt**. All players vote on
which player best fits the prompt. The engine independently picks the
best-matching player from their assessment. On reveal, room vote vs engine pick
are compared and scored. 4–10 players, 4–10 rounds. This is NOT "one card per
person per round" — it is one shared prompt per round that the whole room votes
on.

Round themes follow the live Journey order (the 8 body cards):
Lens·Eyes, Compass·Heart, Hands·Work, Voice·Conviction, Gravity·Spine,
Trust·Ears, Fire·Immune-Response, Path·Gait. (Weather/Grip/Aim/Goal/Soul are
NOT rounds — Weather is context, Grip is pressure distortion, Aim is governance,
Goal/Soul are trajectory forces. They may inform tags, not be themes.)

## Scope of THIS CC — files to create under `lib/games/roomRead/`

1. `types.ts` — game/card/signal/pick types.
2. `rounds.ts` — `BODY_CARD_ORDER` + `BODY_CARD_LABELS`.
3. `cards.ts` — card library (≥5 cards per body card; starter copy below).
4. `signals.ts` — **`buildPlayerGameSignals(constitution)`** reading the REAL
   engine fields per the mapping table below. THIS IS THE LOAD-BEARING FILE.
5. `engine.ts` — `scoreCardForPlayer`, `rankPlayersForCard`, `getEnginePick`.
6. `generate.ts` — `generateRoomReadGame({ players, roundCount, mode })`.
7. `scoring.ts` — `calculateCardScores`, `getRoomWinner`.
8. `verdict.ts` — `getVerdict`.
9. Tests under `tests/games/roomRead/` (or the repo's test convention) — see
   Acceptance.

## CRITICAL — the signal builder must read REAL engine fields

The brief that seeded this game shipped a `signals.ts` full of **invented**
field paths (`player.engine.lens.patternReaderScore`, etc.). Those fields DO
NOT EXIST. If you copy them, every signal defaults to 0, every card scores 0
for everyone, and the engine pick degenerates to "whoever sorts first." Use the
verified mapping below instead.

`buildPlayerGameSignals` takes an `InnerConstitution` (the object
`buildInnerConstitution` returns — see `lib/identityEngine.ts` / `lib/types.ts`)
and returns `{ playerId, displayName, signals: Record<TagId, number> }` with
every value clamped to 0..1.

### Verified sources (read these — confirmed in code, 2026-05-25)

**A. Cognitive-function scores (graded 0–100) — call the exported function.**
The per-function matrix is NOT stored on the constitution; only the dominant
label is (`lens_stack.crossSignalInferredDriver`). Get the graded scores by
calling the exported pure function:
```ts
import { inferDriverFromCrossSignals } from "@/lib/crossSignalDriverInference";
const cs = inferDriverFromCrossSignals(constitution);
// cs.scores: { ni, ne, si, se, ti, te, fi, fe }  // each ~0–100
// cs.disc:   { D, i, S, C }                       // DiSC distribution
```
Normalize each function score to 0..1 (divide by 100; clamp). Function→tag map:
| tag | function score |
|---|---|
| pattern_reader, deep_seeing | `ni` |
| possibility_finder, future_awareness | `ne` |
| precedent_memory | `si` |
| improviser, emotional_perception | `se` |
| technical_reasoning | `ti` |
| structurer | `te` |
| connector | `fe` |
| meaning_making | max(`ni`,`fi`) |
| verbal_processing | max(`fe`, extraversion/100) |

**B. OCEAN intensities (0–100, independent per trait).** Optional field — guard
on presence (undefined for thin-signal sessions; default those tags to 0).
Source: `constitution.ocean?.dispositionSignalMix.intensities.{openness,
conscientiousness, extraversion, agreeableness, emotionalReactivity}`. Divide by
100.
| tag | intensity |
|---|---|
| high_conscientiousness, practical_order, faithful_reliability, perfection_pressure | `conscientiousness` |
| high_openness, risk_tolerance | `openness` |
| protective_care, service_orientation, high_agreeableness_spine | `agreeableness` |
| social_warmth | `extraversion` |

> ⚠️ CORRECTED 2026-05-25 after running `buildInnerConstitution` on the 5
> cohort-real anchors (Jason/Harry/Daniel/Keith/Ashley). The seed brief AND the
> first draft of §C/§D/§E below had three silent-zero bugs (`coherenceReading.
> trajectory`, `conviction_temperature`, and `signals[].id` rank-weighting) plus
> one critical omission (`responsibility_load`). The tables below are the
> CORRECTED, runtime-verified mapping. Trust these, not the prose around them.

**C. Grip signals (HYBRID — verified). bucket + curated fired-grips, NOT a
`signals[]` scan.** The 7 Grip Patterns are NOT exposed as per-pattern scores —
only one chosen `constitution.gripPattern.bucket` (∈ safety|security|belonging|
worth|recognition|control|purpose|unmapped) + `.confidence` (high|medium|low).
Both confirmed present on all anchors.

For each `*_grip` tag read the CURATED fired-grips list:
`constitution.goalSoulGive.grippingPull.signals[]` — each entry is
`{ id, humanReadable }` and **the field IS `id` here** (this differs from the
top-level `constitution.signals[]`, whose field is `signal_id` — see §D). base
value = id present in that list ? 0.8 : 0; then **+0.25 (clamp 1.0) if
`gripPattern.bucket` matches**. The grip ids are real:
`grips_control, grips_certainty, grips_security, grips_neededness,
grips_approval, grips_old_plan, grips_comfort, grips_reputation`.
| tag | grip id | bucket match |
|---|---|---|
| control_mastery_grip | grips_control | control |
| control_certainty_grip | grips_certainty | control |
| control_containment_grip | grips_control *(PROXY — no grips_containment exists)* | control |
| security_grip | grips_security | security |
| being_needed_grip | grips_neededness | belonging |
| belonging_approval_grip | grips_approval | belonging |
Overall grip strength (if needed): `constitution.goalSoulGive.grippingPull` is an
OBJECT (NOT a number) — use `.defensiveGrip` or `.score`, both 0–100.

**D. Compass values / belief (verified).** The top-level signal array is
`constitution.signals[]`; entries are `{ signal_id, description, from_card,
source_question_ids, strength }`. **Match by `signal_id` (string equality), NOT
`id`. There is NO rank field** — the graded field is `strength ∈ {low,medium,
high}`. Weight present priority signals: **high→1.0, medium→0.6, low→0.3**
(absent → 0). Belief domain: `constitution.belief_under_tension.value_domain`
(truth|freedom|loyalty|justice|faith|stability|knowledge|family|unknown) is
populated. **DO NOT use `conviction_temperature` — it is uniformly `"unknown"`
across the whole cohort (dead signal).** Use `convictionClarity.score` instead.
| tag | source |
|---|---|
| truth_teller | `truth_priority` signal present → strength scale |
| loyalty | `loyalty_priority` signal present → strength scale |
| freedom_grip | `freedom_priority` signal present → strength scale |
| conviction | `constitution.convictionClarity.score` / 100 *(0–100, discriminates)* |
| cost_bearing | `constitution.convictionClarity.score` / 100 |
| faith_truth_loyalty | value_domain ∈ {truth,faith,loyalty} ? 0.8 : 0.2 |

**E. Trajectory + responsibility (verified).**
| tag | source |
|---|---|
| aim_governance | `constitution.aimReading.score` / 100 |
| crisis_action | `constitution.coherenceReading.pathClass === "crisis" ? 1 : 0` *(NOT `.trajectory` — that key does not exist; `pathClass ∈ {trajectory,crisis}`. `crisisFlavor !== null` is an equivalent test.)* |
| intensity | `constitution.goalSoulMovement.dashboard.movementStrength.descriptor` → {full:1, long:0.75, moderate:0.5, short:0.25} *(cohort only exercises full/long)* |
| responsibility_load | `constitution.responsibilityIntegration.score` / 100 *(0–100; dominant tag across the entire Gravity/Spine round — was UNMAPPED in the seed brief; without this the Spine round scores ~0 for everyone)* |
| burden_responsibility_grip | `responsibilityIntegration.score`/100, +0.2 if grips_neededness fired (clamp 1.0) *(PROXY — appears on one Spine card; no clean grip id)* |

**F. Proxy tags (no clean source — documented rough proxies; flag for a later
refinement pass).** These are best-effort so cards leaning on them don't go
dead. Mark each in a code comment as `// PROXY — rough, refine later`.
| tag | proxy |
|---|---|
| long_arc_thinking | `ni`/100 |
| discernment | max(`ti`,`si`)/100 |
| emotional_containment, calm_containment | 1 − emotionalReactivity/100 |
| steadiness | avg(`si`/100, conscientiousness/100) |
| quiet_sacrifice, useful_devotion | agreeableness/100 |
| competence_mask | conscientiousness/100 (+0.2 if grips_control fired, clamp) |
| hidden_burden | grips_neededness fired ? 0.7 : 0.2 |
| relational_repair, high_agreeableness_spine | max(`fe`/100, agreeableness/100) |
| boundary_awareness | `ti`/100 |
| mission_permission_grip | gripPattern.bucket === "purpose" ? 0.7 : 0.2 |

> Grip-presence checks above ("grips_control fired", "grips_neededness fired")
> mean: id present in `goalSoulGive.grippingPull.signals[]` (per §C), NOT a scan
> of the full `signals[]` array.
> CAVEAT (verified): `emotionalReactivity` is a flat 59 for 4 of 5 anchors, so
> `emotional_containment`/`calm_containment` barely discriminate across the
> cohort — acceptable for MVP but the weakest proxies; flag for refinement.

**G. The one tag with NO usable proxy:** `humor_deflection`. There is no
behavioral humor signal in the engine. EITHER drop the one card that leans on it
(`voice_wrong_time_joke`) from the starter set, OR keep the card but replace its
dominant tag with `connector`/`social_warmth` (room-reader register) and note
it. Report which you chose. Do NOT leave a card whose top tag is unmeasured.

> Implementation note: build a small internal `set(tag, value)` that clamps to
> 0..1 and a single pass that fills every tag the cards reference. After the
> pass, assert (in a test) that NO supported tag is uniformly 0 across the
> cohort-real fixtures — that assertion is the guard against silent regression
> to the placeholder failure mode.

## Engine matching (`engine.ts`)

`scoreCardForPlayer(card, player)` = Σ over `card.tags` of `weight *
(player.signals[tag] ?? 0)`. `rankPlayersForCard` sorts desc.
`getEnginePick(card, players)` returns top + runner-up, a `confidence`
(gap-based: high ≥0.12, medium ≥0.06, else low), the top-3 matched tags, and a
human-readable `reason`. (The brief's engine.ts is essentially correct here —
reuse it; the only dependency was the signal builder, now real.)

## Generation (`generate.ts`)

One card per round; round i theme = `BODY_CARD_ORDER[i % len]`; filter candidate
cards by theme + `modes.includes(mode)` + not-yet-used; rank by
`confidenceBoost + enginePick.score − diversityPenalty` (penalize re-targeting
the same player) and pick the top. Throw if no candidate remains for a theme.
MVP supports 4–8 rounds cleanly (8 themes); 9–10 may reuse themes — acceptable,
but no duplicate CARD in a session.

## Scoring (`scoring.ts`) + Verdict (`verdict.ts`)

Per round, max 5 points: +2 guess == engine pick, +2 guess == room winner, +1
both (perfect read). `getRoomWinner` = plurality; **tie → undefined (Identity
Fog)**. Verdicts: room==engine → "Obvious"; room≠engine → "Human Override";
no room consensus → "Identity Fog". (Engine-Dissent copy exists for the UI CC;
core just needs the three computable outcomes.)

## Cards (`cards.ts`)

Use the starter library from the seeding brief (≥5 per body card, 40 total).
Two required adjustments: (1) every card's tag set must reference tags the
signal builder produces; (2) resolve `humor_deflection` per §G above. Keep the
prompt copy verbatim — the wit is the product voice.

## Do NOT

- Do NOT invent constitution field paths. If a field isn't in the mapping above
  and you can't find it in `lib/identityEngine.ts` / `lib/types.ts`, treat the
  tag as a proxy/0 and flag it — do not guess a path.
- Do NOT build persistence, DB tables/migrations, API routes, or any UI/React
  — those are CC-176 and CC-177.
- Do NOT touch the assessment engine, report renderers, couple game, or any
  existing `lib/*` file. This CC only ADDS files under `lib/games/roomRead/`
  and `tests/`.
- Do NOT change engine math, scores, or any report output.
- Do NOT commit or push.

## Acceptance

- `npx tsc --noEmit` clean; lint clean.
- Unit tests pass:
  1. `buildPlayerGameSignals` on each cohort-real fixture (Harry, Keith, Daniel,
     Ashley, Jason) returns a vector where NOT all supported tags are 0 (the
     anti-placeholder guard).
  2. **Sanity of the read** (the premise): for a Si/precedent card
     (`lens_history_quality_control`), the engine ranks the Si anchors
     (Keith/Daniel/Harry) above the Ni anchors (Jason/Ashley); for an Ni/pattern
     card (`lens_problem_behind_problem`), Jason/Ashley rank above the Si
     anchors. KEEP THIS STRICT (all three Si anchors above both Ni anchors) — it
     now passes cleanly because CC-SCORESI-DISPOSITION-DISCRIMINATOR (landed
     2026-05-25) corrected Jason's cross-signal Si from 75 → 30 (below his
     ni=65). If this test fails on Jason, SCORESI did NOT actually land in your
     workspace — stop and re-verify the engine, do not loosen the test. The
     verified POST-SCORESI per-anchor function vector to assert against:
     ```
             ni  ne  si  se  ti  te  fi  fe
     jason   65  40  30  15  15  95  10  20
     ashley  65  85  50  15  30  25  10  20
     keith   45  40  85  30   0 100  10  25
     daniel  25  15  85  30   0  65  25  45
     harry   40  40  80  30   0  40  25  70
     ```
     (Si-card order is now Keith 85 / Daniel 85 / Harry 80 well above Ashley 50 /
     Jason 30; Ni-card order is Jason 65 / Ashley 65 above the Si anchors.)
  3. min/max player (4/10) and round (4/10) validation rejects out-of-range.
  4. An 8-round game generates exactly 8 rounds, one card each, no duplicate
     card; round order follows the Journey themes.
  5. `getRoomWinner` plurality works; a tie returns undefined → Identity Fog.
  6. `calculateCardScores` maxes at 5 per round; perfect-read +1 fires only when
     guess == engine == room.
  7. Verdict mapping (Obvious / Human Override / Identity Fog) correct.

## Report back

- The final tag→source resolution actually implemented (note any tag you
  couldn't source and how you handled it; how you resolved `humor_deflection`).
- The cohort sanity-check result: for the two diagnostic cards above, paste the
  ranked player order + scores. THIS is the signal that the engine reads real
  shape, not noise.
- Test results; `tsc`/lint status.
- Confirmation no file outside `lib/games/roomRead/` + `tests/` was touched.
- Anything in the mapping that felt thin and should be revisited before CC-176.
