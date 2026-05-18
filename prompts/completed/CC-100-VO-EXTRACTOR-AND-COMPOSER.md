# CC-100-VO-EXTRACTOR-AND-COMPOSER

## Objective

Build the Victim/Owner axis as a new cross-signal layer that composes
into the GSAG spine. This CC is **scaffolding only** — adds the
extractor (Layer 1) and composer (Layer 2), producing a
`victimOwnerScore` field on `InnerConstitution`. **No engine math
changes**. Wiring the score into Grip + Aim is deferred to
CC-101-VO-WIRING (Layer 3) after empirical validation against cohort.

Per `feedback_victim_owner_axis_gsag.md`:

> Victim ↔ Owner is a Locus of Control axis that composes into
> Goal/Soul/Aim/Grip directly. Not a personality dimension —
> engine spine. Victim verbs (try/should/want-to) → heavy Grip
> contribution. Owner verbs (do/commit/Knowledge-pursue) →
> strong Aim contribution. Goal/Soul movement is gated by
> victim weight.

Per `feedback_relationships_and_behavioral_metadata_canon.md`:

> Layer 2 — cross-answer relationships and behavioral metadata
> compose into the engine. The V/O axis is the canonical Layer 2
> case: 7 engine signals already victim-coded but uncomposed; the
> composer is the missing piece.

## Read First

- `feedback_victim_owner_axis_gsag.md` — canon (the architecture this CC
  implements)
- `feedback_relationships_and_behavioral_metadata_canon.md` — Layer 2
  architecture
- `feedback_gradient_calibration_canon.md` — gradient routing applies
  to V/O scoring
- `feedback_hypocrisy_as_universal_shape_feature.md` — CC-090 hypocrisy
  panel is one of the composer's inputs
- `feedback_blame_lens_disc_mapping.md` — Q-C4 blame attribution
  contributes to V/O scoring too
- `lib/identityEngine.ts` — `signalFromAnswer` (Q-I1 freeform extraction
  site), `attachCrossSignalDriverInference` (V/O composer integration
  site — same architectural rationale as CC-097B's integration)
- `lib/identityEngine.ts:828-841` and `lib/identityEngine.ts:3058-3071`
  — existing Q-P1/Q-P2 victim-coded signal extraction (reference pattern)
- `lib/types.ts` — `InnerConstitution` schema (add new `victim_owner`
  optional field)
- `data/questions.ts` Q-I1, Q-I1b — freeform belief questions where verb
  patterns surface
- `tests/fixtures/cohort/*.json` — cohort fixtures with Q-I1 paragraphs

## Canon constraints (locked)

- **Zero engine math changes.** Grip composition, Aim calculation,
  Goal/Soul/Movement scoring all untouched. This CC adds new signal
  extraction + a composer module producing a score. Wiring to engine
  math is CC-101-VO-WIRING's scope, not this one.
- **Zero Wave 1 persistence file changes.** Standard list:
  `lib/staleShape.ts`, `lib/llmRewritesBundle.ts`,
  `lib/sessionLlmBundleStore.ts`, `lib/*LlmServer.ts` untouched.
- **All cohort agreement-case fixtures stay byte-identical for
  rendered prose.** The new score is data-only at this layer — no
  prose change yet.
- **Document EVERY weight with rationale per AGENTS.md.** Each
  composer weight gets a code comment naming the canon source
  (e.g., "+15 victim per `feedback_victim_owner_axis_gsag.md` verb
  register table") and the empirical effect on the cohort.
- **No LLM calls, no cache file edits, no commits, no pushes.**

## Scope — Layer 1: Q-I1 / Q-I1b verb-register extraction

### Item 1a — Owner verb pattern detection

New extraction in `signalFromAnswer` for Q-I1 freeform AND Q-I1b
fallback (when used). Detect owner-register verbs in the user's
belief text:

```
const OWNER_VERB_PATTERNS = [
  /\b(do|did|does|doing)\b/i,
  /\b(will|i'll|i will)\b/i,
  /\b(am|i'm|i am)\b/i,
  /\b(commit|commits|committed|committing)\b/i,
  /\b(chose|chosen|choosing|choose)\b/i,
  /\b(believe|believed|believing)\b/i,
  /\b(stand|stood|standing)\b/i,
  /\b(refuse|refused|refusing)\b/i,
  /\b(bear|bears|bearing|bore|borne)\b/i,
  /\b(pursue|pursues|pursued|pursuing)\b/i,
];
```

Each match contributes +1 to an owner-verb count for the answer.
Emit a single signal `verb_register_owner_signal` with strength
proportional to count (capped at strength 5 for the heaviest cases).

### Item 1b — Victim verb pattern detection

Parallel detection for victim-register verbs:

```
const VICTIM_VERB_PATTERNS = [
  /\b(try|tries|tried|trying)\b/i,
  /\b(should|shouldn't|should not)\b/i,
  /\b(want to|wanted to|wanting to)\b/i,
  /\b(need to|needed to|needing to)\b/i,
  /\b(if only|i wish)\b/i,
  /\b(they made me|they make me|forced me)\b/i,
  /\b(because of them|because of him|because of her)\b/i,
  /\b(can't|cannot|couldn't|could not)\b/i,
  /\b(hope to|hoping to)\b/i,
];
```

Emit `verb_register_victim_signal` with strength proportional to
count (capped at 5).

**Important nuance for "hope":** "hope" alone is not victim-coded
(could be owner-anchored). Only `hope to + INFINITIVE` pattern
fires — the deferred-action register. Test against Q-I1 fixture text
where users describe their belief; if "hope" appears in a
Faith-context noun phrase (e.g., "hope in Christ"), it should NOT
fire. The regex pattern `\b(hope to|hoping to)\b` excludes this
correctly.

**Important nuance for "can't":** Reading "can't" as victim requires
context. Some users say "I can't compromise on this" which is
owner-register (refusal as conviction). Others say "I can't change
this" which is victim-register (deflection). For Layer 1, treat
"can't" as victim by default but flag this in the report as a known
imprecision for a future CC-VO-CALIBRATION to refine.

### Item 1c — Q-I1 normalized text capture

To enable downstream composition (and potential LLM disambiguation in
future CCs), also capture the user's normalized Q-I1 text as a new
optional field on Constitution:

```
constitution.identity_freeform = {
  q_i1_text: string | null,
  q_i1b_text: string | null,
  owner_verb_count: number,
  victim_verb_count: number,
};
```

This is data-only — no prose generation reads from it yet.

### Item 1d — Audit assertions for Layer 1

- `vo-owner-verb-extracts-on-jason-keystone` — Jason's Q-I1
  ("Heaven and Hell are most meaningful a place we can reach on
  earth...") contains "expecting/hoping for" which is victim-coded
  (hope to). Owner-verb count should be 0-1 (low). Victim-verb count
  should be 1 (hope-to fires).
- `vo-owner-verb-extracts-on-daniel-keystone` — Daniel's "Faith and
  Family" is too short to fire either pattern reliably. Expected:
  both counts 0.
- `vo-victim-pattern-fires-on-synthetic` — Construct a synthetic
  fixture with text "I try to be a good person, I should do better,
  if only they understood" — victim count should be ≥3.
- `vo-owner-pattern-fires-on-synthetic` — Synthetic fixture with
  "I commit to this. I am the one who chose this. I will bear the
  cost." — owner count should be ≥3.

## Scope — Layer 2: VictimOwnerAxis composer

### Item 2a — New module `lib/victimOwnerAxis.ts`

Composes `victimOwnerScore` (0-100, where 100 = full owner, 0 =
full victim, 50 = balanced) from multiple signal sources:

```
interface VictimOwnerReading {
  score: number;            // 0-100, owner-anchored
  register: "owner-anchored" | "owner-leaning" | "balanced" |
            "victim-leaning" | "victim-anchored";
  evidence: {
    verbRegister: { owner: number; victim: number };
    blameAttribution: number;  // contribution to owner-side
    costBearing: number;        // contribution to owner-side
    hypocrisyDrag: number;     // negative — Hypocrisy fires pull victim
    truthRegister: "pursuit" | "possession" | "neutral";
    existingVictimSignals: string[];
  };
  rationale: string;          // human-readable summary
}
```

### Item 2b — Composition weights (canon-anchored)

| Component | Owner contribution | Victim contribution | Canon source |
|---|---|---|---|
| `verb_register_owner_signal` strength × 4 | +0 to +20 | — | `feedback_victim_owner_axis_gsag.md` verb table |
| `verb_register_victim_signal` strength × 4 | — | +0 to +20 | same |
| Q-C4 top=Individual + Agreeableness ≥ 70 | +15 | — | "Individual-blame + high-A = owner" canon |
| Q-C4 top=Authority OR System (without Individual top-3) | — | +10 | "Authority/System-blame without Individual = victim" canon |
| Q-I3 cost-surface ≥ 4 items (wide) | +10 | — | "wide cost surface = owner" canon |
| Q-I3 cost-surface = 0 ("none of these") | — | +15 | "refusing to bear cost = victim" canon |
| `gripping_proof_signal` (existing Q-GS1) | — | +8 | existing victim-coded |
| `vulnerability_deflection` (existing Q-V1) | — | +10 | existing victim-coded |
| `performance_identity` (existing Q-V1) | — | +8 | existing victim-coded |
| `adapts_under_social_pressure` (existing Q-P1) | — | +6 | existing victim-coded |
| `adapts_under_economic_pressure` (existing Q-P2) | — | +6 | existing victim-coded |
| `hides_belief` (existing Q-P2) | — | +12 | existing victim-coded |
| `avoidant_reactivity` (existing Q-O2) | — | +8 | existing victim-coded |
| `high_conviction_under_risk` (existing Q-P2) | +12 | — | owner-coded analog |
| `say_directly_under_relational_cost` (Q-P1) | +10 | — | owner-coded analog |
| `independent_thought_signal` (Q-I1) | +6 | — | owner-coded analog |
| `conviction_under_cost` (Q-I1) | +10 | — | owner-coded analog |
| Q-S2 Knowledge top-2 + Q-V1 owner-register top-1 | +8 | — | "Knowledge-pursuit + owner-verb = pursuit register" canon |
| Q-S1 Truth top-2 + verb_register_victim ≥ 2 | — | +8 | "Truth as deflection" canon |
| Hypocrisy panel fired ≥ 2 entries | — | +6 | "named-vs-paid gap = victim register" canon |

Score formula: start at 50 (neutral), add owner contributions,
subtract victim contributions, clamp to [0, 100].

Register bands:
- 0-20: victim-anchored
- 21-40: victim-leaning
- 41-59: balanced
- 60-79: owner-leaning
- 80-100: owner-anchored

### Item 2c — Integration site

Per CC-097B and CC-097B-CALIBRATION precedent, the V/O composer
runs at `lib/identityEngine.ts:attachCrossSignalDriverInference` (or
a new sibling `attachVictimOwnerAxis`). Same architectural rationale:
Constitution-level data is needed (OCEAN, Compass, hypocrisy panel,
existing signals) which `aggregateLensStack` can't see.

Add `victim_owner` optional field to `InnerConstitution`:

```
victim_owner?: VictimOwnerReading;
```

### Item 2d — Audit assertions for Layer 2

**Cohort expected reads** (calibration anchors):

| User | Expected register | Expected score range | Rationale |
|---|---|---|---|
| Jason | owner-anchored | 75-90 | Wide cost surface, Individual blame, "I commit to..." verb register, Knowledge top-2, no hypocrisy |
| Daniel | owner-leaning | 65-80 | Wide cost surface, Individual blame, high A, no victim verbs in keystone |
| Harry | owner-leaning | 60-75 | Wide cost surface, Supernatural-blame contributes neutrally not victim (faith-as-trust, not faith-as-escape) |
| Cindy | balanced | 45-60 | Wide cost surface BUT `adapts_under_pressure` fires, ESFP register softens owner |
| Michele | owner-leaning | 55-70 | Wide cost surface, System blame (slight victim contribution), Truth top-2 with owner verbs |
| Kevin | balanced | 45-60 | High A overrides Individual blame, Fe-protector register fires both owner (high conviction) and victim (adapts) signals |
| Ashley | owner-leaning | 60-75 | Wide cost surface (5 items "all of the above"), System blame moderate, INFJ-latent humanist conviction |

**Audit assertions:**

- `vo-jason-owner-anchored` — score ≥ 75, register = "owner-anchored"
- `vo-daniel-owner-leaning-or-anchored` — score ≥ 65
- `vo-harry-owner-leaning` — score ≥ 60 (Supernatural blame doesn't tip him victim; he's a faith-anchored owner)
- `vo-cindy-balanced` — score 40-65 (caregiver-balanced)
- `vo-no-cohort-fixture-scores-below-30` — empirical floor check (no real cohort user should read as deep victim)
- `vo-rationale-string-populated` — every cohort fixture produces a non-empty `rationale` field
- `vo-evidence-trace-completeness` — every cohort fixture produces an `evidence` object with all sub-fields populated (not undefined)

### Item 2e — Synthetic victim-anchored fixture

Add `tests/fixtures/cc-vo-synthetic/victim-anchored.json` with:
- Q-I1: "I try to do better but I can't because of everyone else. I should be a good person but they make me angry. If only they would understand."
- Q-C4: System or Authority top (NOT Individual)
- Q-I3: "none of these" (refuses cost surface)
- Q-P1: "Hide it" (`adapts_under_social_pressure`)
- Q-P2: "Hide it from work" (`hides_belief`)
- Q-V1: "Deflect" (`vulnerability_deflection`)
- Q-O2: "Avoidant" (`avoidant_reactivity`)

Expected: score ≤ 20, register = "victim-anchored".

**Audit assertion:** `vo-synthetic-victim-anchored` — score ≤ 20

### Item 2f — Synthetic owner-anchored fixture

Add `tests/fixtures/cc-vo-synthetic/owner-anchored.json` with:
- Q-I1: "I commit to bearing what this costs. I am the one who chose this. I do what conviction asks, even when I bear the cost alone."
- Q-C4: Individual top
- Q-I3: all 5 cost items selected
- Q-P1: "Say it directly"
- Q-P2: "Accept the risk"
- Q-V1: "Tie it to a belief I would bear cost to protect"
- Q-O2: "Sharper and more focused"
- OCEAN: A ≥ 70, C ≥ 80

Expected: score ≥ 85, register = "owner-anchored".

**Audit assertion:** `vo-synthetic-owner-anchored` — score ≥ 85

## Out of scope (defer to CC-101-VO-WIRING)

- **Wiring `victimOwnerScore` into Grip composition.** Per canon,
  victim weight contributes to Grip and owner weight contributes
  to Aim. That's engine math change — owned by CC-101-VO-WIRING with
  full cohort regression gates.
- **Wiring into Goal/Soul movement gating.** Same — engine math.
- **Prose surfacing.** No card prose changes. The Victim/Owner read
  may eventually surface as a card or panel, but design is
  deferred to a future CC after the score is empirically validated.
- **Refinement of "hope" / "can't" context disambiguation.** Layer 1
  uses regex defaults. Refinement (e.g., dependency-parse-light or
  noun-phrase context check) is deferred to a future
  CC-VO-CALIBRATION if the cohort surfaces false positives.

## Acceptance criteria

1. `npx tsc --noEmit` clean
2. lint clean (no new warnings)
3. `audit:victim-owner-axis` exits 0 with 100% PASS on all new assertions
4. Wave 1 audits all pass
5. CC-084 / 085 / 086 / 087 / 089 / 090 / 091 / 092 / 094 / 097-CONFIDENCE-FIX
   / 097A / 097B / 097B-CALIBRATION / 097B-CALIBRATION-V2 audits all pass
6. All 8 cohort fixtures produce a populated `victim_owner` field on
   `InnerConstitution` (none undefined, none scoring exactly 50 by
   coincidence — coincidence-50 indicates the composer never ran)
7. Cohort fixtures' rendered Markdown is byte-identical to pre-CC
   (no prose drift — score is data-only at this layer)
8. Every composer weight documented with code comment citing canon
   source
9. Zero engine math changes — Grip/Aim/Goal/Soul/Movement scores
   byte-identical for all cohort fixtures pre- and post-CC
10. Zero Wave 1 persistence file changes
11. Zero LLM calls
12. Zero cache file modifications
13. Zero commits / pushes — left dirty for review

## Allowed to modify

- `lib/identityEngine.ts` — Q-I1/Q-I1b verb extraction in
  `signalFromAnswer`; integration site for composer
- `lib/victimOwnerAxis.ts` (new file)
- `lib/types.ts` — new `VictimOwnerReading` type + new optional
  fields on `InnerConstitution` (`victim_owner`,
  `identity_freeform`)
- `tests/audit/victimOwnerAxis.audit.ts` (new file)
- `tests/fixtures/cc-vo-synthetic/*.json` (new synthetics)
- `package.json` — new `audit:victim-owner-axis` script
- `prompts/active/CC-100-VO-EXTRACTOR-AND-COMPOSER.md` →
  `prompts/completed/`

Nothing else.

## Estimated

3-4 hours, $0.

## Notes for executor

- **This is Layer 1+2 scaffolding only.** The V/O axis won't be
  visible in user-facing reports yet. Don't add prose, don't change
  Grip/Aim math, don't surface the score on any card. The score
  is data-only on the `InnerConstitution` for now.
- **Cohort expected reads in Item 2d are the calibration anchors.**
  Tune weights to land each cohort user in their expected register
  band. If a weight change for one user breaks another, document
  the tradeoff and prefer cohort stability.
- **Reading the existing victim-coded signals correctly is the
  load-bearing prerequisite.** 7 signals already exist in the engine
  (`gripping_proof_signal`, `vulnerability_deflection`,
  `performance_identity`, `adapts_under_social_pressure`,
  `adapts_under_economic_pressure`, `hides_belief`,
  `avoidant_reactivity`). Verify each one is correctly produced
  by the existing engine before assuming the composer can read them.
- The Q-I1 verb extraction should be case-insensitive and resilient
  to common typos / punctuation. Run regex against the normalized
  text only.
- If any cohort user produces an unexpected register (e.g., Daniel
  scores victim-leaning), STOP and report. Don't tune weights
  blindly to force a target — surface the surprise so we can
  decide whether the surprise reflects a real shape (which would
  change the cohort calibration map) or a composer bug.
- Per `feedback_cc_prompt_guardrails.md`: when in doubt, document
  the gap explicitly rather than fabricating a fix. The composer
  is a Layer 2 architectural piece — getting it right matters
  more than getting it complete in one CC.
