# CC-032 — v2.5 Q-X4 Multi-Stage Restructure + Q-I2 Derivation Cascade

**Type:** Question-bank surgery + new signal + Q-I2 derivation cascade + canon updates. **Medium — smaller than CC-031 because Q-X4 only adds 1 new item, but the Q-I2 cascade is part of this CC's scope.**
**Goal:** Replace flat 5-item Q-X4 with a multi-stage pattern (relational parent + chosen parent + cross-rank). Add the missing **Outside-expert** category (therapist / doctor / lawyer / coach / clergy). Update Q-I2's derivation to source from Q-X3-cross + Q-X4-cross instead of legacy Q-X3 + Q-X4 — the cascade that completes CC-031's restructure.
**Predecessors:** CC-030 (principle canonization), CC-031 (Q-X3 multi-stage restructure). The atomic-ship recommendation in CC-031 means CC-032 can land in the same PR or immediately after.
**Successor:** None planned. v2.5 work-stream complete after CC-032 ships.
**Source memo:** `docs/product-direction/v2-5-universal-three.md` § Q-X4 — Personal Trust restructure.

---

## Why this CC

Two architectural moves:

**1. Q-X4 has one structural gap.** The current 5-item flat ranking (Spouse-or-partner / Close-friend / Family / Mentor-or-advisor / Your-own-counsel) is missing the **Outside-expert** category — a therapist, doctor, lawyer, financial advisor, coach, clergy. The trusted-professional category. A user with strong outside-expert posture (and weak family / partner posture) is a real and common pattern. The current 5-item Q-X4 forces them to spread their expert trust into "mentor or advisor" or compress it into "own counsel," neither of which captures it.

**2. The cleanest way to add the 6th item is the multi-stage pattern, not a 6-item ranking.** Per the v2.5 principle (canonized in CC-030), six items is forbidden. The split that the design memo identified is **relational vs. chosen** — entanglement-based trust (Spouse / Family / Close-friend) vs. selection-based trust (Mentor / Outside-expert / Your-own-counsel). Two parent rankings of 3 items each + one 4-item cross-rank.

The relational/chosen split isn't arbitrary. **Relational trust** is a function of *who knew you before this version of you, who is entangled with the rest of your life*. **Chosen trust** is a function of *whose judgment you have selected for, often through paying for it or seeking it out*. The two cluster differently in real users:

- Low relational + high chosen → strong professional support, weak intimate ties
- High relational + low chosen → strong intimate fabric, reluctance to seek outside expertise
- Both high → integrated trust posture
- Both low → guarded; "own counsel" likely dominates

Neither pattern is a value judgment; both are informative.

**3. Q-I2 derivation cascade.** CC-031 introduced Q-X3-cross. CC-032 introduces Q-X4-cross. Q-I2's `derived_from` updates from `["Q-X3", "Q-X4"]` to `["Q-X3-cross", "Q-X4-cross"]`, with `derived_top_n_per_source: 2` (4 items + None + Other instead of 6 items + None + Other today).

User-visible win: Q-I2's checkbox list now potentially shows *Social Media*, *Outside-expert*, *Government-Services*, *News-organizations* as revision-source items. The current flat-Q-X3 + flat-Q-X4 form hides these dimensions inside legacy bucket labels. Q-I2's revision-source read becomes meaningfully sharper post-cascade.

---

## The new structure (v2.5 Q-X4)

**Q-X4-relational** — entanglement-based trust. **3 items** at the principle's default:

| ID | Label | Gloss | Signal |
|---|---|---|---|
| `partner` | A spouse or partner | "someone whose life is fully entangled with yours." | `partner_trust_priority` *(preserved)* |
| `family` | Family | "parents, siblings, or chosen kin who knew you before this version of you." | `family_trust_priority` *(preserved)* |
| `friend` | A close friend | "someone who has earned your trust outside obligation." | `friend_trust_priority` *(preserved)* |

**Q-X4-chosen** — selection-based trust. **3 items** at default:

| ID | Label | Gloss | Signal |
|---|---|---|---|
| `mentor` | A mentor or advisor | "someone whose judgment you've sought across years." | `mentor_trust_priority` *(preserved)* |
| `outside_expert` | An outside expert | "a therapist, doctor, lawyer, coach, financial advisor, or clergy member — the trusted professional." | `outside_expert_trust_priority` *(NEW)* |
| `own_counsel` | Your own counsel | "your own judgment, when no other source feels right." | `own_counsel_trust_priority` *(preserved)* |

**Q-X4-cross** — derived cross-rank. **4 items, top-2 of each parent.** Resolved priority when relational and chosen trust compete.

---

## Signal-library changes summary

| Signal | Status | Notes |
|---|---|---|
| `partner_trust_priority` | **Preserved** | Q-X4-relational |
| `family_trust_priority` | **Preserved** | Q-X4-relational |
| `friend_trust_priority` | **Preserved** | Q-X4-relational |
| `mentor_trust_priority` | **Preserved** | Q-X4-chosen |
| `own_counsel_trust_priority` | **Preserved** | Q-X4-chosen — special-cased in `lib/beliefHeuristics.ts:141` for "guarded" epistemic posture; behavior preserved |
| `outside_expert_trust_priority` | **New** | Q-X4-chosen |

**Net: 5 preserved + 1 new = 6 personal-trust signals.** No retirements.

---

## Scope

This CC modifies the following surfaces:

1. `data/questions.ts` — replace Q-X4 with Q-X4-relational, Q-X4-chosen, Q-X4-cross. Update Q-I2's `derived_from` from `["Q-X3", "Q-X4"]` to `["Q-X3-cross", "Q-X4-cross"]` and `derived_top_n_per_source` from 3 to 2 (the cross-ranks already resolved 4 items each; pulling top-2 of each = 4 + None + Other; pulling top-3 from a 4-item list is mathematically permissible but smearier).
2. `lib/identityEngine.ts`:
   - `SIGNAL_DESCRIPTIONS` (around line 181–189): add `outside_expert_trust_priority` entry. No retirements.
   - Trust-signal aggregation array (around line 1398–1399): add `outside_expert_trust_priority`.
   - Display-name lookup map (around line 1526–1529): add Outside-expert entry.
   - Cross-card pattern detection: audit. `loyalty_vs_close_trust` consumes `family_trust_priority` and `partner_trust_priority` (preserved, no change). No other patterns currently consume Q-X4 signals — verify.
3. `lib/drive.ts` — `SIGNAL_TO_DRIVE_BUCKET` tagging table: add `outside_expert_trust_priority` tagged to `"coverage"` (chosen-trust selected for relationship — same bucket as the existing relational trust signals). The 5 preserved signals retain their existing tags.
4. `lib/beliefHeuristics.ts` — verify the line-141 special-case for `own_counsel_trust_priority` survives unchanged. Update any prose that references the legacy 5-item Q-X4 if needed.
5. **Q-I2 derivation cascade** — `data/questions.ts` Q-I2 entry: `derived_from: ["Q-X3-cross", "Q-X4-cross"]`, `derived_top_n_per_source: 2`. Helper string update if needed (current helper says "which trust sources have power" — still accurate).
6. `app/page.tsx` — phase machinery: insert Q-X4-relational, Q-X4-chosen, Q-X4-cross at the position previously occupied by Q-X4 (around line 119 in `data/questions.ts`). `Q_I1_INDEX` auto-shifts.
7. Canon docs:
   - `docs/canon/question-bank-v1.md` — Q-X4 entry retired; Q-X4-relational, Q-X4-chosen, Q-X4-cross entries added. Q-I2 entry updated for new derivation source.
   - `docs/canon/signal-library.md` — `outside_expert_trust_priority` entry added.
   - `docs/canon/option-glosses-v1.md` — Outside-expert gloss authored; existing 5 glosses preserved.
   - `docs/canon/tension-library-v1.md` — audit; T-001 / T-002 etc. don't reference Q-X4 signals directly per the existing audit, but verify.
   - `docs/canon/shape-framework.md` § Trust card — update to reflect Q-X4 multi-stage form. After CC-032 ships, the Trust card is fully restructured (Q-X3 multi-stage + Q-X4 multi-stage, Q-I2 cascading from both cross-ranks).

Out of scope: cross-card patterns leveraging the new Outside-expert signal (future CC); saved-session migration; LLM substitution; deferred per-item "doesn't apply" affordance (see Notes).

---

## Steps

### Step 1 — Replace Q-X4 in `data/questions.ts`

Around line 119, replace the single Q-X4 with three entries:

```ts
// CC-032 — Q-X4 multi-stage. The single 5-item Q-X4 is retired; the personal-trust
// read now resolves through two parent rankings + one cross-rank. Adds the missing
// Outside-expert category (therapist/doctor/lawyer/coach/clergy). Per the v2.5 memo,
// the relational/chosen split captures the architectural truth that entanglement-based
// trust and selection-based trust cluster differently in real users.
{
  question_id: "Q-X4-relational",
  card_id: "context",
  type: "ranking",
  text: "When you need to hear the truth and not just kindness, whom of these — the people entangled in your life — do you trust most? Rank in order.",
  helper: "Three relational trust sources. Most trusted at the top, least trusted at the bottom.",
  items: [
    { id: "partner", label: "A spouse or partner", gloss: "someone whose life is fully entangled with yours.",                          signal: "partner_trust_priority" },
    { id: "family",  label: "Family",              gloss: "parents, siblings, or chosen kin who knew you before this version of you.", signal: "family_trust_priority"  },
    { id: "friend",  label: "A close friend",      gloss: "someone who has earned your trust outside obligation.",                      signal: "friend_trust_priority"  },
  ],
},
{
  question_id: "Q-X4-chosen",
  card_id: "context",
  type: "ranking",
  text: "And when you need truth from someone you've selected for their judgment — not someone bound to you by relationship — whom do you trust most? Rank in order.",
  helper: "Three chosen trust sources. Most trusted at the top, least trusted at the bottom.",
  items: [
    { id: "mentor",         label: "A mentor or advisor", gloss: "someone whose judgment you've sought across years.",                                                          signal: "mentor_trust_priority"         },
    { id: "outside_expert", label: "An outside expert",   gloss: "a therapist, doctor, lawyer, coach, financial advisor, or clergy member — the trusted professional.",         signal: "outside_expert_trust_priority" },
    { id: "own_counsel",    label: "Your own counsel",    gloss: "your own judgment, when no other source feels right.",                                                       signal: "own_counsel_trust_priority"    },
  ],
},
{
  question_id: "Q-X4-cross",
  card_id: "context",
  type: "ranking_derived",
  derived_from: ["Q-X4-relational", "Q-X4-chosen"],
  text: "When relational trust and chosen trust compete for the same hard-truth question, who actually wins?",
  helper: "Your top picks from the previous two rankings. Rank in resolved priority.",
},
```

### Step 2 — Update Q-I2's derivation in `data/questions.ts`

Around line 405, update Q-I2's entry:

```ts
{
  // CC-017 (original) → CC-032 (cascade): Q-I2 now derives from the v2.5
  // cross-ranks (Q-X3-cross + Q-X4-cross) instead of the legacy flat Q-X3 + Q-X4.
  // The user's revision-source space now potentially includes Social Media,
  // Outside-expert, Government-Services, News-organizations — dimensions the
  // legacy form averaged into bucket labels.
  question_id: "Q-I2",
  card_id: "conviction",
  type: "multiselect_derived",
  derived_from: ["Q-X3-cross", "Q-X4-cross"],
  derived_top_n_per_source: 2,  // top-2 of each cross-rank = 4 items
  text: "What or who could change your mind about this belief?",
  helper: "Check all that apply. The model reads which trust sources have power over this belief.",
  none_option: { id: "none", label: "None of these" },
  other_option: { id: "other", label: "Other (please specify)", allows_text: true },
},
```

The change from `top_n: 3` (= 6 items) to `top_n: 2` (= 4 items) is intentional. Cross-ranks already resolved priority across the wider domain — top-2 of a cross-rank is a sharper read than top-3 of a flat ranking. Engineer can tune this if real-user testing surfaces a smearier-than-desired Q-I2 read post-cascade, but lean top-2 for v1.

### Step 3 — Add `outside_expert_trust_priority` signal

In `lib/identityEngine.ts` `SIGNAL_DESCRIPTIONS` (around line 181–189), append:

```ts
outside_expert_trust_priority:
  "Ranks an outside expert — therapist, doctor, lawyer, coach, financial advisor, or clergy member — as a trusted personal source for hard truth.",
```

In the trust-signal aggregation array (around line 1398–1399), add `"outside_expert_trust_priority"`.

In the display-name lookup map (around line 1526–1529), add: `outside_expert_trust_priority: "an outside expert"`.

### Step 4 — Update `lib/drive.ts` tagging

Around line 101–106, add:

```ts
outside_expert_trust_priority: "coverage",
```

(Outside-expert is a chosen-trust signal; per the drive framework's coverage register, professional support relationships fall under coverage — selected-for caring across years.)

### Step 5 — Audit `lib/beliefHeuristics.ts`

Line 141 has a special-case: `fromX4[0].signal === "own_counsel_trust_priority"`. After Q-I2's derivation cascade, `fromX4` (or whatever the variable is called) now sources from Q-X4-cross. The `own_counsel_trust_priority` reference is still valid because that signal is preserved. Verify the special-case logic survives the cascade — it should.

If `summarizeQI2Selections` does any direct Q-X4 lookups (rather than walking the question definition's `derived_from`), update to walk Q-X4-cross. Engineer audits.

### Step 6 — Tension consumer audit

Read tension definitions in `lib/identityEngine.ts` for any consumer of Q-X4 signals. The v2.5 memo notes T-002 may be a consumer ("check current signal consumers"). Verify and update if needed.

`loyalty_vs_close_trust` cross-card pattern consumes `family_trust_priority` or `partner_trust_priority` — both preserved, no change. Verify.

### Step 7 — Canon docs

- `docs/canon/question-bank-v1.md`: retire Q-X4 entry; add Q-X4-relational, Q-X4-chosen, Q-X4-cross entries with full glosses. Update Q-I2 entry to reflect new derivation source. Cross-reference CC-030 principle.
- `docs/canon/signal-library.md`: add `outside_expert_trust_priority` entry following the existing template.
- `docs/canon/option-glosses-v1.md`: add Outside-expert gloss; preserve existing 5 Q-X4 glosses (just regrouped between the two parents).
- `docs/canon/shape-framework.md` § Trust card: update for full v2.5 Q-X3+Q-X4 multi-stage form. After CC-032 ships, the Trust card section reads as the architecturally-complete v2.5 form.
- `docs/canon/keystone-reflection-rules.md`: Q-I2 derivation update may affect prose generation in `qi2CitationLine`. Verify and update if needed.

### Step 8 — Verification

- `npx tsc --noEmit` exits 0.
- `npm run lint` passes.
- `npm run build` succeeds.
- A fresh real-user session through Q-X4-relational + Q-X4-chosen + Q-X4-cross renders correctly. Outside-expert appears as a rankable item.
- Q-I2 renders with 4 items derived from Q-X3-cross top-2 + Q-X4-cross top-2 (e.g., a user might see *"Social Media"*, *"Education"*, *"Outside expert"*, *"Family"* as their checkbox items if those were their top-2 in each cross-rank).
- `loyalty_vs_close_trust` cross-card pattern continues to fire correctly.
- Mirror's Keystone Reflection prose continues to read coherently with the new Q-I2 selections.

---

## Acceptance

- `data/questions.ts` contains Q-X4-relational (3 items), Q-X4-chosen (3 items, including Outside-expert), Q-X4-cross (derived) replacing legacy Q-X4. Q-I2 updated with new `derived_from` and `derived_top_n_per_source: 2`.
- `lib/identityEngine.ts` has `outside_expert_trust_priority` entry in `SIGNAL_DESCRIPTIONS`, trust-signal aggregation array, and display-name lookup.
- `lib/drive.ts` tags the new signal to `"coverage"`.
- `lib/beliefHeuristics.ts` `own_counsel_trust_priority` special-case verified intact.
- Tension consumers audited and updated if needed.
- Canon docs updated: question-bank-v1.md, signal-library.md, option-glosses-v1.md, shape-framework.md, keystone-reflection-rules.md.
- `git diff --stat` shows changes only in the named files.
- Build, type-check, lint all pass.
- Smoke confirms multi-stage Q-X4 + cascading Q-I2 render correctly.

---

## Out of scope

- **New cross-card patterns leveraging Outside-expert signal** (e.g., "high outside-expert + low family-trust = professional-but-isolated profile"). Future CC.
- **Per-item "doesn't apply" affordance.** The v2.5 memo notes this could land alongside the Q-X4 restructure or as a follow-up. Defer to a separate small CC; CC-032 doesn't ship the affordance.
- **Saved-session migration.** Pre-CC-032 sessions render gracefully but legacy Q-X4 signal IDs aren't migrated.
- **LLM substitution path.**
- **Renaming any preserved Q-X4 signal.**
- **Renaming "Outside expert" to a different label.** "Outside expert" is the canonical user-facing label per the v2.5 memo. Don't substitute.
- **Splitting `outside_expert_trust_priority` into separate signals per profession (therapist vs. doctor etc.).** The trusted-professional category is one signal in v2.5. Future segmentation if real-user evidence demands.

---

## Housekeeping items surfaced for post-v2.5 cleanup CC

(Add to the cleanup pass alongside existing items: `nameThreadFirst*` removal, sacred-IDs collapse, `truth_vs_private_threat` pattern fix, plus whatever CC-031 surfaces.)

- Q-I2's `derived_top_n_per_source` change from 3 to 2 should be smoke-tested across multiple sessions to verify the 4-item checkbox feels right vs. the legacy 6-item form.
- The "doesn't apply" affordance (mentioned in v2.5 memo) is now unblocked by CC-032's multi-stage form. Worth queuing as a small follow-up CC if user feedback surfaces "I don't have a partner / mentor / outside expert" responses.
- After CC-032 ships, the Trust card has its full v2.5 architecture. Mirror prose tuning for the Trust card output may be worth a Round 3 pass to reflect the richer signal set (CC-025 prose architecture handles the structural shape; content tuning to reference the new categories specifically is a smaller follow-up).

---

## Notes for the executing engineer

- **Atomic ship with CC-031 strongly recommended.** CC-031 introduces Q-X3-cross; CC-032 references it in Q-I2's derivation. Landing them separately requires a temporary shim. Single PR is cleanest.
- **Q-I2's derivation cascade is the load-bearing change.** Q-X4 multi-stage is structurally analogous to Q-X3 (just smaller). Q-I2 is the architectural integration — the moment when the v2.5 work shows up in the user's Keystone Reflection. Verify Q-I2's prose generation reads coherently across the four cases (all 4 items selected, some selected, None selected, mix).
- **Outside-expert label is canonical.** Don't substitute "professional" or "expert" or "advisor." The label "outside expert" was selected to be inclusive across the trusted-professional category (therapist + doctor + lawyer + coach + clergy) without implying credentialed authority above other categories.
- **Drive bucket assignment is `"coverage"` for Outside-expert.** Same register as relational trust signals — chosen-for-relationship, even when transactional. Don't tag to compliance even though professional advice can have a risk-mitigation dimension; the architectural truth is that the user has *chosen* this relationship, and chosen relationships fall under Coverage.
- **Browser smoke required.** Engine checks confirm wiring. The visual experience of two 3-item rankings + one 4-item cross-rank is different from a single 5-item ranking; pacing and helper-text clarity need Jason's eyes.
- **After CC-032 ships, the v2.5 work-stream is complete.** The Trust card has its full multi-stage architecture (Q-X3-public + Q-X3-info-and-commercial + Q-X3-cross + Q-X4-relational + Q-X4-chosen + Q-X4-cross) and Q-I2 cascades cleanly through both cross-ranks. The model's institutional and personal trust reads are at architectural completeness.
