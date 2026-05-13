# Question Bank Additions — Spec Memo

**Status:** Draft for canon. Authored 2026-05-07. Approved by Clarence verdict 2026-05-07. Implementation across CC-Q1 through CC-Q4.
**Purpose:** Add 7 questions to the bank (40 → 47), staying under the 50-question ceiling per `AGENTS.md`. Each question closes a measurement gap that the existing instrument cannot derive cleanly.

---

## 1. Scope and budget

**Bank size:** 40 → 47 (3 slots remain under the 50-question ceiling).

**Wiring discipline (per Jason 2026-05-07):** every signal feeds every relevant derivation, not just its home composite. Each question's signal-to-consumer table below lists primary, secondary, and tertiary consumers. A signal that fires only its home composite is under-utilized.

**Per `feedback_coherence_over_cleverness` memory:** these additions close coherence gaps the existing architecture has surfaced empirically (CC-072 Novelty thin in 5/6, ER proxyOnly in 6/6, etc.). They are not architectural cleverness; they are the measurement infrastructure the architecture was designed to consume.

**Per `feedback_minimal_questions_maximum_output` memory:** all 7 questions earn their slot because re-tagging existing signals could not carry the gap. Each has empirical or architectural evidence justifying direct measurement.

## 2. The 7 questions, by bundle

### Bundle 1 — OCEAN (CC-Q1): Q-O1 + Q-O2

#### Q-O1 — Openness subtype

- **Card:** `lens` (or new card `disposition`; see implementation note)
- **Type:** `ranking`
- **Text:** "What kind of *new* are you most drawn toward?"
- **Helper:** "Rank from most pull to least."
- **Items:**
  1. New ideas, models, theories, or frameworks. → `openness_intellectual`
  2. New beauty, music, design, language, or atmosphere. → `openness_aesthetic`
  3. New people, cultures, or perspectives. → `openness_perspective`
  4. New experiences, places, tools, or methods. → `openness_experiential`
  5. New emotional honesty or self-understanding. → `openness_emotional`
  6. I prefer what is tested, familiar, and proven. → `low_novelty_preference`

#### Q-O2 — Direct Emotional Reactivity

- **Card:** `lens` (or `disposition`)
- **Type:** `ranking`, top 2 preferred
- **Text:** "When the stakes rise, your inner state usually becomes:"
- **Helper:** "Rank from most-true to least."
- **Items:**
  1. Sharper and more focused. → `low_reactivity_focus`
  2. Anxious or restless. → `anxious_reactivity`
  3. Angry or reactive. → `anger_reactivity`
  4. Numb, analytical, or detached. → `detached_reactivity`
  5. Overwhelmed but still functional. → `overwhelmed_functioning`
  6. Calm on the outside, intense inside. → `hidden_reactivity`
  7. Avoidant; I look for distraction or escape. → `avoidant_reactivity`

### Bundle 2 — Movement (CC-Q2): Q-GS1 + Q-V1 + Q-GRIP1

#### Q-GS1 — Goal/Soul calibration

- **Card:** `sacred` (Compass-anchored; closing question on what makes effort worth it)
- **Type:** `ranking`, top 3 preferred
- **Text:** "When a major effort succeeds, what makes it feel most worth it?"
- **Helper:** "Rank from most-true to least. The model reads direction, not moral quality."
- **Items:**
  1. The goal was reached. → `goal_completion_signal`
  2. It helped people I care about. → `soul_people_signal`
  3. It served something larger than me. → `soul_calling_signal`
  4. It proved I was capable. → `gripping_proof_signal`
  5. It created security or freedom. → `security_freedom_signal`
  6. It expressed something true that needed form. → `creative_truth_signal`
  7. It created something beautiful, useful, or durable. → `durable_creation_signal`

#### Q-V1 — Vulnerability / open-hand

- **Card:** `conviction` (anchors to the belief register; renders before Keystone)
- **Type:** `ranking`, top 2 preferred
- **Text:** "When someone asks why your work really matters, what are you most likely to do?"
- **Helper:** "Rank from most-likely to least."
- **Items:**
  1. Explain the logic, model, or structure. → `goal_logic_explanation`
  2. Name the person, people, or cause it serves. → `soul_beloved_named`
  3. Admit I am still trying to understand that. → `vulnerability_open_uncertainty`
  4. Deflect, because it feels too personal. → `vulnerability_deflection`
  5. Say the results should speak for themselves. → `performance_identity`
  6. Tie it to a belief I would bear cost to protect. → `sacred_belief_connection`

#### Q-GRIP1 — What you grip under pressure

- **Card:** `pressure` (Fire-anchored; pairs with Q-P1, Q-P2)
- **Type:** `ranking`, top 3 preferred
- **Text:** "Under pressure, what do you most tend to grip?"
- **Helper:** "Rank from most-true to least. The model reads pattern, not judgment."
- **Items:**
  1. Control. → `grips_control`
  2. Money or security. → `grips_security`
  3. Reputation. → `grips_reputation`
  4. Being right. → `grips_certainty`
  5. Being needed. → `grips_neededness`
  6. Comfort or escape. → `grips_comfort`
  7. A plan that used to work. → `grips_old_plan`
  8. The approval of people I do not want to disappoint. → `grips_approval`

### Bundle 3 — Drive (CC-Q3): Q-3C2

#### Q-3C2 — Revealed Drive priority under crowding

- **Card:** `role` (Path-anchored; pairs with Q-3C1 claimed)
- **Type:** `ranking`, top 3 preferred
- **Text:** "When life gets crowded, what do you protect first in practice?"
- **Helper:** "Rank from most-protected to least. The model reads behavior, not intention."
- **Items:**
  1. Money, margin, and financial options. → `revealed_cost_priority`
  2. Time and presence with people who depend on me. → `revealed_coverage_priority`
  3. Safety, rules, risk control, and avoiding exposure. → `revealed_compliance_priority`
  4. Progress on the thing I am building. → `revealed_goal_priority`
  5. Rest, health, and recovery. → `revealed_recovery_priority`
  6. Reputation or standing with important people. → `revealed_reputation_priority`

### Bundle 4 — Love (CC-Q4): Q-L1

#### Q-L1 — Love expression / translation

- **Card:** `sacred` (Compass-anchored; pairs with Q-S1, Q-S2)
- **Type:** `ranking`, top 2 preferred
- **Text:** "The people closest to you are most likely to know you love them because you:"
- **Helper:** "Rank from most-true to least."
- **Items:**
  1. Stay present over time. → `love_presence`
  2. Solve problems that burden them. → `love_problem_solving`
  3. Say what they mean to you. → `love_verbal_expression`
  4. Protect them from risk or harm. → `love_protection`
  5. Build conditions where they can flourish. → `love_co_construction`
  6. Sacrifice quietly without making it visible. → `love_quiet_sacrifice`
  7. Create beauty, humor, or shared experience with them. → `love_shared_experience`

## 3. Wiring discipline — signal-to-consumer table

Every signal feeds primary, secondary, and tertiary consumers. Composite consumers update; body-map cards may add prose hooks; tensions sharpen. Bundle CCs implement the consumption.

| Signal | Primary consumer | Secondary | Tertiary / tensions |
|---|---|---|---|
| `openness_intellectual` | OCEAN Openness Intellectual subdim | Lens (Ni/Te) | Compass (Knowledge value) |
| `openness_aesthetic` | OCEAN Openness Aesthetic subdim | Compass (Peace, Compassion) | Lens (Fi) |
| `openness_perspective` | OCEAN Openness (cross-cuts subdims) | Trust (cross-cultural) | Conflict Translation |
| `openness_experiential` | OCEAN Openness Novelty subdim | Path (Gait — exploration) | Drive (Coverage if travel-care) |
| `openness_emotional` | OCEAN Openness Aesthetic+Emotional subdim | Conviction (vulnerability) | Vulnerability composite (lift) |
| `low_novelty_preference` | OCEAN Openness Novelty subdim (negative) | Compass (Stability) | Drive (Compliance) |
| `low_reactivity_focus` | OCEAN Emotional Reactivity (low band, NOT proxy) | Path · Gait | Composure register |
| `anxious_reactivity` | OCEAN Emotional Reactivity (high) | Weather (current load) | Vulnerability composite (mild) |
| `anger_reactivity` | OCEAN Emotional Reactivity (high) | Fire (pressure response) | Conflict Translation |
| `detached_reactivity` | OCEAN Emotional Reactivity (low/proxy-coded) | Lens (Te) | Vulnerability composite (suppression) |
| `overwhelmed_functioning` | OCEAN Emotional Reactivity (high under load) | Weather | Path (sustainability) |
| `hidden_reactivity` | OCEAN Emotional Reactivity (high but private) | Conviction | Vulnerability composite (negative) |
| `avoidant_reactivity` | OCEAN Emotional Reactivity (active avoidance) | Gripping cluster | Vulnerability composite (negative) |
| `goal_completion_signal` | Goal composite (direct lift) | Drive Cost | Path |
| `soul_people_signal` | Soul composite (direct lift) | Compass (Family/Loyalty) | Love Map |
| `soul_calling_signal` | Soul composite (direct lift) | Compass (Faith) | Path · Give |
| `gripping_proof_signal` | Gripping Pull cluster (mild) | Vulnerability composite (suppression) | Conviction (performance) |
| `security_freedom_signal` | Drive (Cost or Compliance, depending on register) | Compass (Stability) | — |
| `creative_truth_signal` | Soul composite (lift) AND OCEAN Openness Architectural | Path · Give | Conviction |
| `durable_creation_signal` | Goal composite + Soul composite (synthesis) | Path · Give | Generative Builder pattern |
| `goal_logic_explanation` | Goal composite (mild) | Lens (Te) | Vulnerability composite (mild suppression — explaining-not-naming) |
| `soul_beloved_named` | Soul composite (strong direct lift) | Vulnerability composite (lift — naming is vulnerability act) | Compass |
| `vulnerability_open_uncertainty` | Vulnerability composite (strong positive) | Conviction | Path · Love |
| `vulnerability_deflection` | Vulnerability composite (strong negative) | Gripping cluster | Conviction (closure) |
| `performance_identity` | Gripping cluster (mild) | OCEAN Conscientiousness (mild) | Path · Work |
| `sacred_belief_connection` | Conviction body-card (direct) | Compass | Vulnerability composite (lift) |
| `grips_control` | Gripping Pull score + signal list | Drive Compliance | Conscientiousness shadow |
| `grips_security` | Gripping Pull | Drive Cost | Stakes (money) |
| `grips_reputation` | Gripping Pull | Drive Cost (reputation) | Stakes (reputation) |
| `grips_certainty` | Gripping Pull | Conviction (closure) | Lens (Ni overuse) |
| `grips_neededness` | Gripping Pull | Love Map (sacrificial) | OCEAN Agreeableness shadow |
| `grips_comfort` | Gripping Pull | OCEAN Conscientiousness (negative) | Path · Work (avoidance) |
| `grips_old_plan` | Gripping Pull | Lens (Si overuse) | OCEAN Openness (negative) |
| `grips_approval` | Gripping Pull | OCEAN Agreeableness (accommodation) | Vulnerability composite (negative) |
| `revealed_cost_priority` | Drive Cost bucket (revealed) | Stakes (money/job) | Q-3C1 vs Q-3C2 tension |
| `revealed_coverage_priority` | Drive Coverage bucket (revealed) | Path · Love | Q-3C1 vs Q-3C2 tension |
| `revealed_compliance_priority` | Drive Compliance bucket (revealed) | Stakes (safety) | Q-3C1 vs Q-3C2 tension |
| `revealed_goal_priority` | Goal composite + Drive Cost | Path · Work | Q-3C1 vs Q-3C2 tension |
| `revealed_recovery_priority` | Weather (rest signal) | OCEAN Conscientiousness (sustainability) | New register |
| `revealed_reputation_priority` | Drive Cost + Stakes (reputation) | Gripping cluster (mild) | Q-3C1 vs Q-3C2 tension |
| `love_presence` | Love Map flavor: Companion | Path · Love | Compass |
| `love_problem_solving` | Love Map flavor: Builder | Path · Work | Lens (Te) |
| `love_verbal_expression` | Love Map flavor: Vocal | OCEAN Extraversion (mild) | Path · Love |
| `love_protection` | Love Map flavor: Guardian | Compass (Loyalty) | Stakes (close-relationships) |
| `love_co_construction` | Love Map flavor: Builder + Champion | Path · Give | Generative Builder |
| `love_quiet_sacrifice` | Love Map flavor: Servant | Compass (Mercy) | Vulnerability composite (mild — sacrifice without naming) |
| `love_shared_experience` | Love Map flavor: Companion + Co-creator | OCEAN Openness Aesthetic | Path · Love |

## 4. Drive bucket tags for new signals (Q-3C2)

Per `lib/drive.ts SIGNAL_DRIVE_TAGS`:

- `revealed_cost_priority` → Cost
- `revealed_coverage_priority` → Coverage
- `revealed_compliance_priority` → Compliance
- `revealed_goal_priority` → Cost (50%) + Coverage (50% if building serves people)
- `revealed_recovery_priority` → Compliance (50%) + Coverage (50% — caring for self)
- `revealed_reputation_priority` → Cost (75%) + Compliance (25%)

Q-O1, Q-O2, Q-V1, Q-GRIP1, Q-GS1, Q-L1 signals do NOT tag into Drive buckets — they feed OCEAN, Vulnerability, Soul, Goal, Gripping Pull, Love Map, but Drive distribution stays sourced from Q-3C1 + Q-3C2 + the existing 15 signal-equivalents.

## 5. Tensions sharpened by the additions

- **Q-3C1 claimed vs Q-3C2 revealed.** The DriveCase classifier now has direct measurement on both sides — claimed (Q-3C1) and revealed (Q-3C2). Inversion cases become more reliable.
- **Sacred-Words-vs-Sacred-Spending.** Q-GS1 + Q-S2 + Q-S3 sharpens the gap between named values and resource flow.
- **Vulnerability claimed vs revealed.** Q-V1's `vulnerability_open_uncertainty` (claimed) cross-checked against `vulnerability_deflection` and existing pressure signals (revealed).
- **OCEAN direct vs proxy.** Q-O2 ER replaces the proxy-only state for Emotional Reactivity. After CC-Q1, the proxy-disclosure prose only fires when Q-O2 is genuinely thin, not as a default.
- **Love Map flavor calibration.** Q-L1 directly anchors Love Map flavors that were previously fully inferred.

## 6. Composite consumption (per-CC integration)

Each bundle CC implements:

1. Add questions to `data/questions.ts`.
2. Add SignalIds to `lib/types.ts` SignalId union.
3. Add SIGNAL_DESCRIPTIONS entries.
4. Add signal extractors that fire on the new questions' rankings (rank-aware: rank 1 = 3x, rank 2 = 2x, rank 3 = 1x, etc.).
5. Wire signals into composite consumers per the §3 table (primary at minimum; secondary/tertiary may be deferred to a CC-RW re-weighting CC if scope demands).
6. Add audit fixtures exercising each new question's signal pattern.
7. Add Drive bucket tags where applicable (Q-3C2 only).

## 7. Implementation sequencing

```
1. CC-Q1 — OCEAN (Q-O1 + Q-O2)         smallest scope
2. CC-Q2 — Movement (Q-GS1 + Q-V1 + Q-GRIP1)  largest scope
3. CC-Q3 — Drive (Q-3C2)                medium scope
4. CC-Q4 — Love (Q-L1)                  smallest scope at end
```

Each CC stays within its own architectural domain. Sequential firing tests each domain independently. Total bank: 40 → 47.

## 8. Open questions for canon review

1. **Card placement for Q-O1, Q-O2.** `lens` (existing) vs new `disposition` card. Bundle CC may default to `lens` for minimum-viable scope; future restructure could create a `disposition` card if OCEAN deserves its own anchor.
2. **`security_freedom_signal` tagging.** Drive Cost (security as financial) vs Compliance (security as risk-mitigation) is a register choice. Defer to bundle CC's interpretation.
3. **`revealed_recovery_priority` is a new register** not previously named in the architecture. CC-Q3 may need to add a "recovery" composite or map it into Compliance (rest as risk-mitigation) + Weather (current load context).
4. **Q-3C1 wording cleanup.** Clarence's earlier verdict suggested Q-3C1 could become less business-coded. Out of scope for CC-Q3 unless trivial; queue for a future small CODEX.

## 9. Guardrails

- Bank stays ≤ 50 questions. After CC-Q1–Q4: 47. 3 slots available.
- Each new signal feeds primary consumer at minimum; secondary/tertiary documented but may defer to CC-RW.
- No question text or item gloss may use therapy register. Every option phrased neutrally — the model reads pattern, not judgment.
- Forbidden prose drift: bundle CCs do NOT modify `Closing Read`, `Movement`, `Disposition Signal Mix`, or `Path · Gait` prose templates. Those updates wait for a future CC-RW (re-weight + re-prose) once direct measurement data accumulates.
- No question may pre-judge the user toward a "right" answer. Q-V1 specifically: "Tie it to a belief I would bear cost to protect" reads aspirationally — pair with neutrals like "Explain the logic" so the rank captures real signal, not desirability bias.
