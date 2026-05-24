# CC-156 — Cohort follow-up clarifier plain-language rewrites (owner review)

`data/cohortFollowUps.ts` is a hand-authored map of bespoke per-cohort
follow-up sets. CC-149/150 fixed the dynamic generator + the family seed
banks; this CC closes the third surface where the old jargon ("same
instrument," "be aimed at instead," "the grip on X softened," "same warm
attentive instrument") was still rendering on real cohort follow-up
links.

Owner trigger: a cohort member opened their follow-up link and saw *"If
the grip on building the model softened, what action could the same
instrument be aimed at instead?"* — exactly the register CC-149's stem
rewrites killed in the generator, surviving only in this hand-authored
file.

## How this file is consumed (T3 context note, no reroute)

`data/cohortFollowUps.ts` exports `COHORT_FOLLOW_UPS` keyed by canonical
lowercase first name. `lib/followUpResolver.ts:41` calls
`cohortFollowUpForName(sessionKey)` first; on hit, the cohort entry
wins and the dynamic generator is bypassed entirely. On miss, the
resolver falls through to the CC-125 generator (now CC-149/150-cleaned).

That means **every cohort follow-up link rendered the strings in this
file verbatim**, not the cleaned generator copies — which is exactly
why the owner saw the bad stem on a real link despite CC-149/150
landing. The fix is in-place rewrite of this file; no reroute or
deprecation per owner decision.

The consumer in `lib/followUpNarrative.ts:108` is just a doc-comment
pointer; no code path reads from `cohortFollowUps` there.

## Counts

| Cohorts in file | Stems total | Stems rewritten | Options rewritten | Other fields touched |
| ---: | ---: | ---: | ---: | ---: |
| 14 | 42 | **9** | **2** | **0** |

The 9 rewritten stems are all the `fq3_aim_replacement` slots — that's
where every "same instrument / aimed at instead / grip on X softened"
occurrence lived. The other 33 stems (`fq1_grip_object`,
`fq2_release_condition`) already read in plain second-person language
and were left byte-identical.

The 2 rewritten options were the only places where "register" survived
as an insider noun in display text (quelcdp's `Reputation` option and
keith's `Worth named idle` option).

## Diff scope

Verified by `git diff data/cohortFollowUps.ts` — only `question:` and
`text:` string lines change. No edits to `question_id`, `purpose`,
`responseMode`, `signal`/`tags`/`interpretation`, option `label`,
cohort keying (`michele:`/`ashley:`/etc.), `personName`,
`selectedFamilies`, `reasonForQuestions`, or file structure. Diff stat:
`22 lines changed (11 ins / 11 del)` — perfect 1-for-1 symmetry =
text-only edits.

## Per-cohort rewrites

### `michele` — fq3_aim_replacement

| | text |
| --- | --- |
| OLD | If the grip on being-useful softened, what could the same warm attentive instrument be aimed at instead — without becoming someone you're not? |
| NEW | If your place with the people you love didn't depend on being useful, where could that same attentive care point instead — without you becoming someone you're not? |

### `ashley` — fq3_aim_replacement

| | text |
| --- | --- |
| OLD | If the grip on holding the room softened, what could the same care and seeing be aimed at instead? |
| NEW | If carrying the room's emotional weather felt less necessary, where could that same care and seeing point instead? |

### `cindy` — fq3_aim_replacement

| | text |
| --- | --- |
| OLD | If being-needed softened as the measure, what could the same warm attention be aimed at instead? |
| NEW | If being needed weren't the thing that proved you matter, where could that same attentive care point instead? |

### `daniel` — fq3_aim_replacement

| | text |
| --- | --- |
| OLD | If the grip on the proven plan softened, what could the same steadiness be aimed at instead? |
| NEW | If holding to the plan that already works felt less necessary, where could that same steadiness point instead? |

### `jasondmcg` — fq3_aim_replacement

| | text |
| --- | --- |
| OLD | If the grip on building the model softened, what action could the same instrument be aimed at instead? |
| NEW | If building the model didn't have to be the answer, where could that same focus point instead? |

> This is the exact stem the owner saw in production that triggered
> CC-156.

### `matti` — fq3_aim_replacement

| | text |
| --- | --- |
| OLD | If the grip on being right softened, where could the same focus be aimed instead? |
| NEW | If being right mattered less, where could that same focus point instead? |

### `quelcdp` — fq3_aim_replacement

| | text |
| --- | --- |
| OLD | If the grip on reputation softened, what would real freedom — usable, not performed — actually look like? |
| NEW | If your standing weren't on the line every day, what would real freedom — useful, not performed — actually look like for you? |

### `quelcdp` — fq2 option `Respect — staying in the register people defer to`

| | text |
| --- | --- |
| OLD | Respect — staying in the register people defer to. |
| NEW | Respect — staying the person other people defer to. |

> `label` stays unchanged ("Respect — staying in the register people
> defer to") because labels are internal write-back keys; only the
> displayed `text` is on the cold-reader surface.

### `keith` — fq3_aim_replacement

| | text |
| --- | --- |
| OLD | If achievement softened as proof, what could the same care and capability be aimed at instead? |
| NEW | If you didn't need the next achievement to prove anything, where could that same care and capability point instead? |

### `keith` — fq3 option `The team — people working alongside me who'd register the gap`

| | text |
| --- | --- |
| OLD | The team — people working alongside me who'd register the gap. |
| NEW | The team — people working alongside me who'd notice if the gap opened. |

### `jake` — fq3_aim_replacement

| | text |
| --- | --- |
| OLD | If the grip on the framework softened, what action could the same instrument be aimed at instead? |
| NEW | If the framework didn't have to hold everything together, where could that same focus point instead? |

## Cohorts with no rewrites needed

`harry`, `kevin`, `keith` (stems other than fq3), `connor`, `brian`, `brad`.
All their fq3 aim-replacement stems were already plain-language and
didn't carry the jargon patterns. Their grip-object and
release-condition stems likewise read in second-person plain English
already. Spot-checked; nothing forced a touch.

## Ambiguous — needs owner

**None.** Every rewritten stem had a clear underlying intent visible
from the surrounding cohort context (`reasonForQuestions` + the
fq1/fq2 stems above each fq3). No rewrite required inventing meaning;
each fits the same locked CC-149 structure ("If <eased fear or
loosened condition>, where could that same <named strength> point
instead?") with the cohort's specific noun preserved (e.g., "building
the model" for Jason; "the framework" for Jake; "carrying the room's
emotional weather" for Ashley).

If owner review later flags any rewrite as drifting from the cohort's
intent, the targeted fix is a one-line `question:` swap —
`question_id`, `purpose`, `responseMode`, and every option stay stable,
so write-back + scoring is unaffected.
