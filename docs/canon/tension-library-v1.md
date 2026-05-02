# Tension Library v1

## Purpose

Define reusable tensions detected by comparing signals across cards.

A tension is not a flaw.  
A tension is a meaningful pull between two or more parts of the person.

---

## T-001 Truth vs Belonging

Signals:
- truth_priority_high
- adapts_under_social_pressure

Description:
The user values truth, but may soften or withhold it when relationships are at risk.

User Prompt:
This pattern may be present: you value truth, but adapt when social cost is high. Does this feel accurate?

Strengtheners:
- conviction_under_cost — raises confidence when the user's freeform answer describes real cost paid for holding a belief.

---

## T-002 Conviction vs Economic Security

Signals:
- truth_priority_high OR strong_independent_conviction
- adapts_under_economic_pressure OR hides_belief

Description:
The user may hold strong beliefs internally while limiting expression when financial security is at risk.

User Prompt:
This pattern may be present: your convictions may remain intact internally, but become more private when economic risk rises. Does this feel accurate?

Strengtheners:
- conviction_under_cost — raises confidence when the user's freeform answer describes real cost paid for holding a belief.

---

## T-003 Independence vs Respect

Signals:
- strong_independent_conviction
- doubt_self_when_respected_people_disagree OR reflective_independence

Description:
The user may think independently, but still gives meaningful weight to respected people.

User Prompt:
This pattern may be present: you are independent, but not immune to the judgment of people you respect. Does this feel accurate?

---

## T-004 Formation vs Current Conviction

Signals:
- authority_trust_high OR authority_skepticism_moderate OR authority_distrust
- institutional_trust OR institutional_skepticism OR institutional_distrust

Description:
The user’s current view of institutions may either extend or resist their early experience with authority.

User Prompt:
This pattern may be present: your current view of institutions may be shaped by, or reacting against, your early experience with authority. Does this feel accurate?

---

## T-005 Stability vs Freedom

Signals:
- stability_priority (rank ≤ 2)
- freedom_priority (rank ≤ 2)

Description:
The user values freedom, but current responsibilities or stability needs may constrain how freely they can act.

User Prompt:
This pattern may be present: you value freedom, but your responsibilities or need for stability may limit how much freedom you can actually choose. Does this feel accurate?

---

## T-006 Creator vs Maintainer

Signals:
- proactive_creator
- responsibility_maintainer OR reactive_operator

Source Questions:
- proactive_creator must come from Q-A2 (aspiration)
- responsibility_maintainer or reactive_operator must come from Q-A1 (current reality)

Description:
The user may see themselves as a builder or creator, while current life demands keep them in maintenance or reaction mode.

User Prompt:
This pattern may be present: part of you wants to build, but much of your life may be spent maintaining or reacting. Does this feel accurate?

---

## T-007 Family vs Truth

Signals:
- family_priority (rank ≤ 2)
- truth_priority (rank ≤ 2) OR truth_priority_high

Description:
The user may experience tension when protecting family conflicts with speaking or pursuing truth.

User Prompt:
This pattern may be present: family and truth both matter deeply to you, and there may be moments where protecting one feels like risking the other. Does this feel accurate?

---

## T-008 Order vs Reinvention

Signals:
- stability_priority (rank ≤ 2)
- freedom_priority (rank ≤ 2) OR proactive_creator

Description:
The user may value order and stability while also wanting freedom to create or reinvent.

User Prompt:
This pattern may be present: you may want stable structures, but also resist structures that prevent reinvention. Does this feel accurate?

---

## T-009 Individual vs System Responsibility

Signals:
- individual_responsibility
- systemic_responsibility OR balanced_responsibility

Description:
The user may believe people are responsible for their choices while also recognizing that systems shape outcomes.

User Prompt:
This pattern may be present: you may hold individuals accountable while still recognizing that systems can meaningfully constrain them. Does this feel accurate?

---

## T-010 Inherited Stability vs Present Chaos

Signals:
- stability_baseline_high
- high_pressure_context OR reactive_operator

Description:
The user may have been formed in stability but currently lives under pressure, overload, or constant reaction.

User Prompt:
This pattern may be present: you may have a strong internal expectation for stability, while your current life feels more pressured or reactive. Does this feel accurate?

---

## T-011 Chaos Formation vs Control Need

Signals:
- chaos_exposure
- order_priority OR stability_priority

Description:
The user may value order or stability partly because early life felt uncertain or chaotic.

User Prompt:
This pattern may be present: your desire for order may be connected to earlier experiences of uncertainty. Does this feel accurate?

---

## T-012 Sacred Value Conflict

Signals:
- Any two distinct rank-aware sacred `*_priority` signals at rank ≤ 2:
  freedom_priority, truth_priority, stability_priority, loyalty_priority,
  family_priority, knowledge_priority, justice_priority, faith_priority.

Source Questions:
- Sacred signals are produced by Q-S1 (freedom_priority, truth_priority, stability_priority, loyalty_priority) and Q-S2 (family_priority, knowledge_priority, justice_priority, faith_priority). Both are ranking-type questions per `card-schema.md` § Question Types; each emits its four signals with rank metadata per `signal-mapping-rule.md` § Ranking Question Signal Emission.

Description:
The user may hold multiple sacred values that cannot always be protected at the same time.

User Prompt:
This pattern may be present: some of your deepest values may come into conflict when life forces a tradeoff. Does this feel accurate?

---

## T-013 — Sacred Words vs Sacred Spending

Type: allocation tension (CC-016)

Description:
The user's stated top sacred value (Q-S2) is not in the user's top-2 spending categories (Q-S3-cross). The model reads a gap between what the user names sacred and what receives the user's discretionary money. Bound by `allocation-rules.md`: non-accusatory, hedged, gap surfaced not prescribed.

Signals:
- Left side: at least one sacred-value signal at rank ≤ 1 from Q-S2 (`family_priority`, `faith_priority`, `justice_priority`, `knowledge_priority`).
- Right side: corresponding spending category absent from Q-S3-cross top-2. Mapping (approximate):
  - family_priority → family_spending_priority
  - faith_priority → nonprofits_religious_spending_priority
  - justice_priority → nonprofits_religious_spending_priority OR social_spending_priority
  - knowledge_priority → social_spending_priority OR companies_spending_priority

Source Questions:
- Q-S2 (sacred values, ranking) on the left side.
- Q-S3-cross (derived ranking, items dynamically populated from top-2 of Q-S3-close + top-2 of Q-S3-wider) on the right side.
- Detection guards on whether any cross-rank signal from Q-S3-cross exists; if the user skipped the allocation flow, T-013 does not fire.

Description:
Stated values reveal identity; spent values reveal allegiance. A gap between them may indicate dishonesty, but it may also indicate exhaustion, ambition, season, economic pressure, or a real conflict between stated and lived values. The model surfaces the gap; the user reads it.

User Prompt (CC-025 — softened template; "not hypocrisy" + "cannot know motive" are load-bearing and stay verbatim):
> You named [top sacred value from Q-S2] as among your most sacred values. Your money appears to flow mostly to [top-2 from Q-S3-cross]. That does not mean hypocrisy. The model cannot know motive.
>
> It could mean: exhaustion, a difficult season, needed self-care, social bonding, old habits, or a real gap between stated priority and lived allocation.
>
> The only fair question is: does this feel true, partially true, or not true at all?

---

## T-014 — Words and Energy

Type: allocation tension (CC-016)

Description:
Analogous to T-013 but operating on Q-E1 (energy) instead of Q-S3 (money). The user's stated top sacred value is not aligned with where discretionary energy appears to flow. Energy-domain mappings are looser than money-domain mappings since energy is less directly tied to specific values.

Signals:
- Left side: at least one sacred-value signal at rank ≤ 1.
- Right side: corresponding energy category absent from Q-E1-cross top-2. Mapping:
  - truth_priority → learning_energy_priority OR solving_energy_priority
  - family_priority → caring_energy_priority
  - justice_priority → solving_energy_priority OR caring_energy_priority
  - knowledge_priority → learning_energy_priority OR building_energy_priority
  - freedom_priority → building_energy_priority OR enjoying_energy_priority
  - stability_priority → restoring_energy_priority OR caring_energy_priority

Source Questions:
- Q-S1 / Q-S2 on the left side.
- Q-E1-cross (derived ranking from top-2 of Q-E1-outward + Q-E1-inward) on the right side. Detection guards on whether any Q-E1-cross signal exists.

Description:
The energy you spend is more honest than the energy you say you'd spend. A gap between sacred values and energy allocation may indicate the same set of contextual reasons as T-013 — exhaustion, ambition, season, real conflict — without the model reading which.

User Prompt (CC-025 — softened template + candidate-move close. T-014 is the one allocation tension that ends with a candidate move rather than the 3-state question):
> You named [top sacred value] as among your most sacred values. Your discretionary energy appears to flow mostly to [top-2 from Q-E1-cross]. That does not mean hypocrisy. The model cannot know motive.
>
> It could mean: exhaustion, a difficult season, needed self-care, social bonding, old habits, or a real gap between stated priority and lived allocation.
>
> If [top sacred value] is central, the adjustment may not be dramatic. It may simply mean giving [top sacred value] a scheduled claim on your best energy, not only your leftover energy.

UI display name: **Words and Energy** (CC-025 Step 2.5A — descriptive name surfaced; T-014 ID stays internal-only).

---

## T-015 — Current and Aspirational Allocation

Type: allocation overlay tension (CC-016)

Description:
Within any of the four allocation parent rankings (Q-S3-close, Q-S3-wider, Q-E1-outward, Q-E1-inward), the user marked at least 2 of 3 categories with a non-`right` overlay (either `wish_less` or `wish_more`). The user's *current* ranking diverges from the user's own *aspirational* read within that domain. Detected from the per-category aspirational overlay markers (not from Signal entries).

Signals:
- This tension does not consume Signals. It consumes the per-item `AspirationalOverlay` markers on the parent ranking answer object directly. Detection lives in `detectAllocationOverlayTensions(answers)` rather than in `detectTensions(signals)`.

Source Questions:
- Any of Q-S3-close, Q-S3-wider, Q-E1-outward, Q-E1-inward where the user marked ≥2 categories non-`right`.

Description:
The user is naming the gap themselves — the model only surfaces what the user has already marked. The closing prompt explicitly hands authority back to the user.

User Prompt (CC-025 — softened template, per-instance variant; fires only when exactly one ranking trigger):
> When you ranked [Q-S3-close OR whichever fired the tension], you marked at least two categories where the current flow doesn't match what you wish. That does not mean hypocrisy. The model cannot know motive.
>
> It could mean: exhaustion, a difficult season, needed self-care, social bonding, old habits, or a real gap between stated priority and lived allocation.
>
> The only fair question is: does this feel true, partially true, or not true at all?

CC-025 Step 2.5B — synthesis/collapse path now triggers at **2+ rankings** (was 3+ in CC-016b). The engine collapses any 2+ triggering rankings into one tension (still `tension_id: T-015`, `type: "Current and Aspirational Allocation"`) that reads:

> Across multiple allocation domains, you marked categories where the current flow doesn't match what you wish. The gap shows up in [labels]. That does not mean hypocrisy. The model cannot know motive.
>
> It could mean: exhaustion, a difficult season, needed self-care, social bonding, old habits, or a real gap between stated priority and lived allocation.
>
> The only fair question is: does this feel true, partially true, or not true at all?

The threshold change resolves the dual-T-015 (outward + inward) collision observed in real-user output where two T-015 entries with the same `tension_id` rendered as visually duplicate list items with different prose.

UI display name: **Current and Aspirational Allocation** (CC-025 Step 2.5A — same name across per-instance and synthesis variants; T-015 ID stays internal-only).

---

## T-016 — Value vs Institutional Trust Gap

Type: value-trust gap tension (CC-064)

Description:
Surfaces the gap between a sacred value the user ranks high and the analog institution that would publicly claim or organize around that value. Fires per (value, institution) pair from a locked v1 set of six. Each fired instance carries a distinct `type` label (e.g. *"Value vs Institutional Trust Gap (Knowledge)"*) so the Open Tensions UI renders multi-firings as distinct sections. Multi-firing is canonical — a user with both Knowledge gap and Truth gap fires both T-016 instances independently; they are read distinctly.

Signals:
- Consumes existing Compass value rankings (Q-S1 / Q-S2) and institutional trust rankings (Q-X3 family). No new signals introduced. Detection in `detectValueInstitutionalTrustGap(signals)` in `lib/identityEngine.ts`.

Source Questions:
- Q-S1 / Q-S2 for the value side (knowledge / truth / justice / stability / compassion / mercy priority signals).
- Q-X3 family for the institutional trust side (education / journalism / government_elected / government_services / nonprofits / religious trust priority signals).

Predicate (per pair):
- Both signals must be present in the session.
- Value signal must rank ≤ 3 in the user's Compass (`hasAtRank(signals, value_signal, 3)`).
- Institutional trust signal must NOT rank ≤ 3 (`!hasAtRank(signals, institution_signal, 3)` — the institution didn't make it into the user's top-3 trusted, regardless of whether it ranks > 3 or is absent from the trust ladder).

Locked pair set (v1):

| # | Value | Institution | Value signal | Institution signal |
|---|---|---|---|---|
| 1 | Knowledge | Education | `knowledge_priority` | `education_trust_priority` |
| 2 | Truth | Journalism | `truth_priority` | `journalism_trust_priority` |
| 3 | Justice | Government (elected) | `justice_priority` | `government_elected_trust_priority` |
| 4 | Stability | Government Services | `stability_priority` | `government_services_trust_priority` |
| 5 | Compassion | Non-Profits | `compassion_priority` | `nonprofits_trust_priority` |
| 6 | Mercy | Religious institutions | `mercy_priority` | `religious_trust_priority` |

Faith exclusion (canonical): `faith_priority` is intentionally NOT in the pair set. CC-054's Faith Shape composer in `deriveCompassOutput` already produces a per-user Faith register prose block from `faith_priority + religious_trust_priority + adjacent signals`; adding Faith to T-016 would duplicate. Future CC may revisit if browser smoke surfaces the prose-level treatment as insufficient.

User Prompts (CC-064 — locked content; six per-pair templates ship verbatim from the CC-064 prompt). Each follows a four-part structure: prefix (names the value) → middle (names the institutional gap) → reframe (normalizes + names productive question) → 3-state question close. See `lib/identityEngine.ts § VALUE_INSTITUTION_TRUST_PAIRS` for the full locked strings.

UI display name: **Value vs Institutional Trust Gap ({value_label})** — distinct per-pair labels surface as section headings; the `T-016` ID stays internal-only.

---

## T-D1 — Claimed and Revealed Drive

Type: drive matrix tension (CC-026)

Description:
Surfaces the gap between the user's *claimed* drive (Q-3C1 ranking) and the drive their distribution *reveals* across the 15-input drive map. Bound by `drive-framework.md`: claimed-vs-revealed is the architectural framing; the gap is informative regardless of which read is "closer to truth." Sibling pattern to CC-016's allocation tensions — same softening template (CC-025 Pattern 2: "not hypocrisy" + "cannot know motive" + 6-item interpretation list + 3-state question).

Signals:
- This tension does not consume Signals via the standard `detectTensions` pipeline. It is constructed from the `DriveOutput` (computed in `lib/drive.ts`) and appended to `tensions` in `buildInnerConstitution` after `derivePathOutput` runs. `signals_involved` references the three claimed-drive signals (`cost_drive` / `coverage_drive` / `compliance_drive`) for completeness; the actual fire condition reads the `DriveOutput.case` field.

Source Questions:
- Q-3C1 (claimed drive). When Q-3C1 is unanswered, the tension cannot fire (the matrix has no claim to compare against).
- The 15 input-equivalents that feed the revealed distribution (see `drive-framework.md § The 15-input revealed-drive map`).

Description:
The tension fires only on `inverted-small` and `inverted-big` cases. The other four `DriveCase` values (`aligned` / `partial-mismatch` / `balanced` / `unstated`) are read by the engine but do not produce a tension entry. The Distribution subsection on Path renders prose for all six cases; the tension layer surfaces the two cases where the gap is structurally large enough to warrant a confirm/partial/reject affordance.

User Prompt (CC-025 Pattern 2 softening template; "not hypocrisy" + "cannot know motive" load-bearing and verbatim):
> You named [claimed_first_human] as the drive that most often guides you. Your distribution reveals a different motivator — your answers point most strongly toward [revealed_first_human], with [claimed_first_human] appearing as the [gap descriptor]. That gap does not mean dishonesty. The model cannot know which is closer to truth.
>
> It could mean: a season of constraint, a recent shift, a stated ideal that hasn't yet caught up to lived reality, or a real gap between the why you tell yourself and the why your answers reveal.
>
> The only fair question is: does this feel true, partially true, or not true at all?

Interpolations: `[claimed_first_human]` and `[revealed_first_human]` use the human-language phrases (*"financial security"* / *"the people you love"* / *"risk and uncertainty"*); `[gap descriptor]` reads *"the smallest share"* (`inverted-small`) or *"the share you named first but not the share your answers expose most"* (`inverted-big`).

UI display name: **Claimed and Revealed Drive** (CC-025 Step 2.5A — descriptive name surfaced; T-D1 ID stays internal-only).

Cross-reference: the Distribution subsection on Path · Gait emits a small *"Also surfaced in Open Tensions as Claimed and Revealed Drive."* note on the inverted cases so the on-screen reader knows the same observation appears in two surfaces.

---

## Canonical Rules

1. Tensions must be derived from signals, not raw guesses.
2. Tensions must be presented as possibilities, not declarations.
3. Every tension must include a user-facing confirmation prompt.
4. A rejected tension must not be reused as settled truth.
5. Confirmed tensions may be used in the Inner Constitution.
6. Tensions should never shame adaptation, caution, silence, or compromise.
7. Tensions should reveal structure, not assign blame.
8. (CC-016) Allocation tensions must surface gaps as observations, never verdicts. Bound by `allocation-rules.md` Rule 4 — non-accusatory interpretation. The closing line of every allocation tension is always a question, not a statement.
