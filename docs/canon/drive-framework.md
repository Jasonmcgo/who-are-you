# Drive Framework

## Purpose

Most of the model's measurements expose *what* — what you protect, what you do, what you fear, what you trust. **Drive exposes *why*.**

Drive is the model's first explicit broad why-axis. Not what you do — what motivates the doing. The unseen motivator under the visible action. The engine of why your energy flows where it flows.

| Today's measurements | What they answer |
|---|---|
| Q-S1, Q-S2, Q-Stakes1 | *What* you protect / fear losing |
| Q-S3-*, Q-E1-* | *Where* your money / energy actually flows |
| Q-X3, Q-X4 | *Who* you trust |
| Q-T1–T8 | *How* you process |
| Q-A1, Q-A2 | *What* you do with time |
| Q-F1, Q-F2 | *What* shaped you |
| Q-P1 / Q-P2 / Q-C1 / Q-C3 / Q-C4 | *What* you do under pressure / preference |

The Keystone block (Q-I1 / Q-I1b / Q-I2 / Q-I3) does narrow why-work — *why* one specific named belief is held, what could revise it, what it would cost. But it scopes to a single belief. Drive is the broad why-measurement applied to the user's whole answer set.

Drive is **distinct from energy**. Energy is the resource (already measured by Q-E1-outward / Q-E1-inward / Q-E1-cross / Q-A2 — where discretionary energy actually flows). Drive is what motivates the exertion of energy. Drive is stable across days; energy expenditure varies by week.

---

## The three drive buckets

| Drive bucket | Engineer-facing term | Human-language phrase (user-facing) |
|---|---|---|
| Cost-drive | `cost` | *"building & wealth"* (sentence-style: *"Building & wealth"*) |
| Coverage-drive | `coverage` | *"people, service, and society"* (sentence-style: *"People, Service & Society"*) |
| Compliance-drive | `compliance` | *"risk and uncertainty"* |

- **Cost-drive** — ambition, wealth-creation, achievement, building. The motivator that asks *"will this build something — resources, standing, recognition, lasting impact?"*
- **Coverage-drive** — other-directed orientation across three sub-dimensions: *people* (intimate-circle relational), *service* (active-giving / caring labor / professional service), *society* (broader civil belonging / community / public good). The motivator that asks *"will this serve the people, the work, and the world I'm responsible for?"*
- **Compliance-drive** — risk-mitigation, safety-as-engine. The motivator that asks *"will this guard against loss, against what could be taken?"*

The three drives compete for the user's energy expenditure. Most users have one dominant drive most of the time; the rank shifts under pressure or in different life seasons.

### CC-033 amendment — cost-bucket relabel + ambition signals (added 2026-04-29)

The cost-bucket's user-facing label was renamed from "financial security" to "building & wealth." The prior label conflated cost-as-ambition (achievement, wealth-creation, recognition, what-outlives-you) with compliance-as-security (protecting what you have, guarding against loss) — but security already lives in its own bucket (compliance). The relabel sharpens the three-bucket separation by making cost mean *pursuit* rather than *protection*.

The TypeScript codename `cost` is canon-locked at `"cost" | "coverage" | "compliance"` and unchanged. Only human-facing labels and prose changed. The `id: "cost"` Q-3C1 item id and `cost_drive` signal id are also unchanged.

Q-3C1's first item label moved from *"Protecting financial security"* to *"Building wealth and standing"* with a new gloss (*"what you build, accumulate, and become known for."*) to match the rebalanced register.

**Q-Ambition1 (CC-033) added** as a second Path-anchored ranking adjacent to Q-3C1 on the role card. Q-3C1 captures *claimed* top-level drive across all three buckets; Q-Ambition1 refines the *revealed* measurement inside the cost bucket with four explicit pursuit-class signals — Success / Fame / Wealth / Legacy. All four tag `"cost"` in `SIGNAL_DRIVE_TAGS`. None are multi-tagged.

Per-signal tagging rationale (locked in `lib/drive.ts § SIGNAL_DRIVE_TAGS`):

| Signal | Tag | Rationale |
|---|---|---|
| `success_priority` | cost | Achievement orientation is ambition-class. |
| `fame_priority` | cost | Recognition-seeking is ambition-class. The direction of pull is self-elevation, not other-care — so not coverage. |
| `wealth_priority` | cost | Wealth-as-end is the canonical cost axis. |
| `legacy_priority` | cost | What-outlives-you is a building-class drive. Considered multi-tagging with coverage (legacy can be relational); rejected because the relational legacy is already captured by `family_priority` and family-class signals. Multi-tagging would double-weight. |

### CC-040 amendment — coverage-bucket relabel (added 2026-04-29)

The coverage-bucket's user-facing label was renamed from "the people you love" to **"people, service, and society"** (chart label: *"People, Service & Society"*). Mirrors the CC-033 architectural pattern: relabel without re-tagging when the human label undersells what the bucket actually measures.

**Rationale.** The prior label captured only the intimate-circle dimension of the coverage bucket. The bucket's tagged signal taxonomy spans a much broader scope: `social_spending_priority` (broader social experience), `nonprofits_religious_spending_priority` (charities / NGOs / faith communities), `mentor_trust_priority` and `outside_expert_trust_priority` (chosen-relational beyond family), `caring_energy_priority` (caring labor extending past intimate circle), and the intimate-circle signals (`family_priority`, `loyalty_priority`, partner / family / friend trust priorities, `close_relationships_stakes_priority`). The bucket measures the full other-directed register; users land high on coverage for any combination of three reasons — intimate orientation, service orientation, civic orientation — and the prior label only named the first.

**Canonical-completeness claim.** The 3C's framework is, by canonical claim, an exhaustive decomposition of where human drive is directed: *Building (do/make/become)* ↔ *Coverage (give/care/belong)* ↔ *Compliance (protect/preserve/mitigate-risk)*. That structural completeness depends on each bucket being labeled coherently with what it actually measures. The prior coverage label undersold the bucket and threatened the framework's exhaustiveness claim — users orienting toward civic service or societal-good registers would not see themselves reflected. The relabel restores semantic alignment.

**Triadic structure.** *People* (intimate-circle relational), *Service* (active-giving / caring labor / mentorship / charity / professional service), *Society* (broader civil belonging / community / public good / social fabric). Each sub-dimension corresponds to a distinct cluster of tagged signals; the label's three nouns name them explicitly so the user can see themselves in the bucket regardless of which sub-dimension drives their share.

**Q-3C1 coverage item.** Updated in lockstep with the chart label so the claimed-drive ranking question uses language that matches the revealed-distribution label. Label: *"Caring for people, service, and society."* Gloss: *"the people you love, the work you give, and the world you contribute to."* The `id: "coverage"` and `signal: "coverage_drive"` fields are canon-locked and unchanged.

**Architectural rule preserved.** The TypeScript codename `coverage` is canon-locked at `"cost" | "coverage" | "compliance"` and unchanged. Only human-facing labels and prose changed. No re-tagging of signals; the bucket's measurement is correct, only its label needed correcting.

**Hyphenation discipline.** Engine-prose templates `balanced` and `unstated` use the hyphenated form *"people-service-and-society"* in their list-of-three sentences (parallelism with sibling-buckets). The unhyphenated form *"people, service, and society"* lives in `HUMAN_LABELS` and interpolates standalone into the four other prose templates (`aligned`, `inverted-small`, `inverted-big`, `partial-mismatch`) where the natural-comma form reads cleanly.

### Vocabulary discipline (binding rule)

The framework terms — *Drive*, *claimed*, *revealed*, and the bucket names *cost* / *coverage* / *compliance* — live in canon docs and engineer-facing surfaces only. **User-facing prose uses human-language phrases** (*"building & wealth"* / *"people, service, and society"* / *"risk and uncertainty"*) and never the framework terms or the words *"drive"* / *"claimed"* / *"revealed"*.

This discipline matches the *Voice substitution* rule from `result-writing-canon.md` — the engine's framework terms are reserved for engineer surfaces; users see lived-language renderings.

---

## Claimed vs. Revealed — the matrix-tension this CC unlocks

Drive carries two readings, separately measured:

- **Claimed drive** — the user's Q-3C1 ranking. Three items (cost / coverage / compliance) ranked by *"which most often guides you when they pull apart."* This is the user's *narrative about themselves* — the why they would name when asked.
- **Revealed drive** — a 15-input distribution computed at engine-derivation time from existing signals across the bank. The user's *answers as a whole* expose a distribution across the three buckets, regardless of what they would name.

The gap between claimed-why and revealed-why is the model's first surface where the user can see whether the story they tell themselves matches the story their answers tell.

### The five cases

| Claimed (Q-3C1 #1) | Revealed (largest slice) | Case |
|---|---|---|
| Cost | Cost | **Aligned** |
| Cost | Coverage / Compliance with claim as smallest | **Inverted-small** |
| Cost | Compliance with claim as third in user's own rank | **Inverted-big** |
| Cost | Coverage / Compliance, claim is real but not largest | **Partial-mismatch** |
| (Q-3C1 skipped) | Any | **Unstated** |
| All three within `BALANCED_THRESHOLD_PERCENT` | Any rank | **Balanced** |

The **inverted-small** case (claimed #1 is the smallest revealed slice) is the central architectural insight. It's not that the user is being dishonest — it's that the why-they-tell-themselves and the why-their-answers-reveal are pointing at different things. That gap is informative and worth seeing.

The **inverted-big** case (claimed #3 is the largest revealed slice) is the deeper variant: the motivator the user named *last* in priority is the one their answers most expose. Sometimes the motivators we don't name carry the most weight.

---

## The 15-input revealed-drive map

Five inputs per bucket, drawn from existing question-equivalents. The math at distribution-compute time is rank-aware: a signal at rank 1 in a 3-item ranking weighs more than a signal at rank 3.

### Cost-drive (5 inputs + Q-Ambition1)

| Input | Source | Notes |
|---|---|---|
| Q-S3-close items | 3-item ranking, money flow within close circle | `self_spending_priority` is pure cost; `family_spending_priority` is multi-tagged (cost + coverage). |
| Q-S3-wider items | 3-item ranking, money flow beyond close circle | `companies_spending_priority` is cost; the others lean coverage. |
| Q-S3-cross | Resolved money tension | Inherits the within/across mix. |
| Q-Stakes1 *money* item | Concrete loss domain | Pure cost — Money / Wealth is the resource frame (post-CC-043 the item label drops the prior "Money / Financial security" overload). |
| Q-P2 economic-pressure response | Forced response | Cost; the question explicitly probes economic-pressure orientation. |
| Q-Ambition1 items (CC-033) | 4-item ranking — Success / Fame / Wealth / Legacy | All four tag pure cost. Pursuit-class refinement of the cost bucket; rank-aware weighting (rank 1 = 3x, rank 2 = 2x, rank 3 = 1x, rank 4 = 0.5x). Adjacent to Q-3C1 on the role card. |

### Coverage-drive (5 inputs)

| Input | Source | Notes |
|---|---|---|
| Q-E1-inward items | 3-item ranking, caring/learning/enjoying energy | `caring_energy_priority` is multi-tagged (coverage + cost at resource layer); `enjoying_energy_priority` leans coverage; `learning_energy_priority` leans cost (self-investment). |
| Q-E1-cross | Resolved energy tension | Inherits the within/across mix. |
| Q-S2 (Family / Compassion / Mercy items) | Sacred-value ranking | `family_priority` and `loyalty_priority` straight coverage. |
| Q-X4 (close-trust sources) | 5-item ranking | Family / friends / partner / mentors all coverage; `own_counsel_trust_priority` is excluded (self-counsel is not external drive). |
| Q-Stakes1 *close-relationships* item | Concrete loss domain | Pure coverage. |

### Compliance-drive (5 inputs)

| Input | Source | Notes |
|---|---|---|
| Q-S1 (Stability / Honor items) | Sacred-value ranking | `stability_priority` is multi-tagged (compliance + coverage). |
| Q-X1 forced response | Current load | Compliance — the question probes how the user reads stability under current pressure. |
| Q-X3 (institutional trust) | 5-item ranking | All five (government / press / companies / education / nonprofits) lean compliance — institutions exist to mitigate risk and codify stability. |
| Q-F1 + Q-F2 (formation context) | Forced responses, treated as one input | Compliance — formation under chaos / under safety both compose with the risk-mitigation register. |
| Q-Stakes1 *health* + *reputation* + *job* items | Concrete loss domains | All three compliance — health is bodily safety; reputation is social safety; job-in-loss-context is professional security (post-CC-043 retag per *security = compliance* canon principle). |

### Multi-tagged signals (50/50 split)

Three signals legitimately belong to two buckets and split-weight 50/50 at compute time:

| Signal | Buckets | Rationale |
|---|---|---|
| `family_spending_priority` | cost + coverage | Spending on family is both resource concentration *and* relational care. Splitting prevents either bucket from claiming the signal whole. |
| `caring_energy_priority` | coverage + cost | Care for people is coverage at the relational layer *and* cost at the resource layer (caring expenditure depletes a resource). |
| `stability_priority` | compliance + coverage | Stability is risk-mitigation *and* relational steadiness. The two are entwined in the user's sacred-value semantics. |

Future authors who need to multi-tag a fourth signal: document the rationale here. Multi-tagging is a real choice, not a default.

**CC-035 amendment (2026-04-29)**: `time_autonomy_stakes_priority` was added to the compliance bucket. Canon ruling: time-as-autonomy is a risk-mitigation / self-direction loss register, not a cost-bucket ambition signal and not a multi-tagged split. *(Reverted in CC-043; see below.)*

---

### CC-043 amendment — Q-Stakes1 architectural cleanup (added 2026-04-29)

**Three architectural drift items in Q-Stakes1 are corrected together:**

1. **Time/autonomy reverted.** The CC-035 addition was a category mistake. Time isn't a *destination* of drive; it's the *substrate* that all three drive registers compete for. The 3C's framework is exhaustive precisely because Building / People-Service-Society / Risk-management *are* the only three places time and energy go. The signal `time_autonomy_stakes_priority` is also redundant with existing measurements: `freedom_priority` in Compass; `agency.aspirational` register on Path; creator-agency detection across the Q-A1 / Q-E1 surface. The signal is deleted entirely from the codebase (questions, SIGNAL_DESCRIPTIONS, Drive tagging, OCEAN tagging).
2. **`job_stakes_priority` retagged from cost to compliance.** Career-in-loss-context (the Q-Stakes1 framing — "what would hurt most to lose") is dominantly stability/security register. Career-as-ambition (the building dimension) is captured separately by `success_priority` in Q-Ambition1. Tagging job_stakes as cost conflated these two registers; the loss-domain framing of Q-Stakes1 makes job_stakes architecturally compliance-flavored. Single-tag (not multi); multi-tagging would re-introduce the cost-flavor that ambition-level career building already gets via `success_priority`.
3. **Q-Stakes1 money item renamed.** *"Money / Financial security"* overloaded two registers (Money is cost-flavored resource; Financial security is compliance-flavored security frame). Renamed to *"Money / Wealth"* with gloss *"Your money, savings, the resources you've built."* `money_stakes_priority` stays cost; the rename removes the compliance overload from the label without changing what the signal measures. The new label aligns with the post-CC-033 Drive cost-bucket label *"Building & wealth"* so the user's mental map composes (ranking money/wealth → contributes to cost bucket → renders as "Building & wealth" in Drive distribution).

**Security = compliance canon principle.** Security and loss-prevention are risk-mitigation variables regardless of which domain the security applies to. *Financial security*, *physical safety*, *job security*, *reputation protection* are all compliance-class registers — *security* is the load-bearing word; the domain modifier names which area the security applies to. Q-Stakes1's loss-domain framing ("what would hurt most to lose") brings out the compliance dimension of any item that's named in security/protection/loss-prevention terms. Items that name a *resource* (Money / Wealth) rather than a *security frame* tag by their domain register (cost), not compliance. This principle resolves the CC-043 retag rationale and forecloses future drift on similar items.

**Architectural picture post-CC-043.** The Drive framework's exhaustiveness claim (Building / Coverage / Compliance is a complete decomposition of where human drive is directed) finally has tagging that matches the claim — every loss-aversion-framed Q-Stakes1 item tags compliance (Job, Reputation, Health) except for the one resource-framed item (Money / Wealth, which tags cost) and the one relational-framed item (Close relationships, which tags coverage):

| Q-Stakes1 item | signal_id | Drive tag |
|---|---|---|
| Money / Wealth | `money_stakes_priority` | cost |
| Job / Career | `job_stakes_priority` | **compliance** *(was cost; CC-043)* |
| Close relationships | `close_relationships_stakes_priority` | coverage |
| Reputation | `reputation_stakes_priority` | compliance |
| Physical safety / Health | `health_stakes_priority` | compliance |

### Excluded signals

- The Four Voices (`ni` / `ne` / `si` / `se` / `ti` / `te` / `fi` / `fe`) — cognitive style, not drive. Tagged `"exclude"`.
- `own_counsel_trust_priority` — self-counsel is not an external drive. Tagged `"exclude"`.
- The three claimed-drive signals themselves (`cost_drive` / `coverage_drive` / `compliance_drive`) — these feed Q-3C1's *claimed* read, not the revealed distribution. Tagged `"exclude"` so the user's Q-3C1 ranking doesn't double-count into their revealed distribution.

---

## Independence from sacred-value math (binding rule)

**Drive signals are NOT in `SACRED_PRIORITY_SIGNAL_IDS` or `SACRED_IDS`.** Drive is its own register. Conflating with sacred-value math would corrupt:

- The compass-ranking computations that read `getTopCompassValues(signals)`.
- The Compass card's gift / blind-spot derivation.
- Tensions T-001 through T-015 that read sacred-priority signal patterns.

CC-028 had a spec slip on the duplicate sacred-IDs arrays (`SACRED_PRIORITY_SIGNAL_IDS` and `SACRED_IDS` had to both be extended for new sacred values). CC-026 explicitly does NOT generalize that pattern — drive signals stay independent. If a future CC adds a fourth drive bucket or a new claimed-drive signal, the new signal goes in `SIGNAL_DESCRIPTIONS` only. Touching the sacred-priority arrays is a regression.

---

## Case-classifier thresholds

Two named constants (`lib/drive.ts`):

- **`BALANCED_THRESHOLD_PERCENT = 10`** — max diff between any two slices for the case to read as `balanced`. Default chosen so a 30/35/35 distribution reads as balanced; a 25/35/40 distribution doesn't.
- **`INVERSION_GAP_THRESHOLD_PERCENT = 15`** — minimum gap between the largest revealed slice and the claimed-#1 slice for the case to qualify as `inverted-small`. Default chosen so a 50/35/15 inversion fires; a 40/35/25 doesn't (the latter reads as partial-mismatch).

Future tuning should adjust these constants and document the rationale in this file rather than rewriting classifier logic.

---

## Prose templates (locked)

Six canonical templates per case, exported from `lib/drive.ts` `generateDriveProse`. The phrasing is locked at the canon layer; future tunings should propose changes here before editing the engine. The templates lead with the **claimed-vs-revealed** framing, not stated-vs-actual — the goal is to surface the gap between two reads of the user's own data, not to imply one is more honest.

The templates are:

- **aligned** — claim and answers point at the same thing; the match is informative.
- **inverted-small** — claim is real but smallest revealed slice; the gap is the reading.
- **inverted-big** — claim's #3 is the largest revealed slice; the unnamed motivator is the heaviest one.
- **partial-mismatch** — claim is a real share but not the largest; the lean is the reading.
- **balanced** — three motivators in roughly equal weight; disciplined integration *or* unresolved tradeoffs.
- **unstated** — Q-3C1 unanswered; distribution renders without claim comparison.

Full text lives at `lib/drive.ts § generateDriveProse`.

---

## T-D1 — Claimed and Revealed Drive

Internal tension_id `T-D1`; user-facing name **"Claimed and Revealed Drive"** (per CC-025 Step 2.5A — descriptive name surfaced; T-### IDs internal-only).

**Fires on:** `inverted-small` and `inverted-big` cases. Other cases (aligned / partial-mismatch / balanced / unstated) do not produce a tension entry.

**Template** — follows CC-025's Allocation Gap softening pattern (the load-bearing phrases *"not hypocrisy"* / *"cannot know motive"* and the 3-state question stay verbatim):

> *"You named {claimed_first_human} as the drive that most often guides you. Your distribution reveals a different motivator — your answers point most strongly toward {revealed_first_human}, with {claimed_first_human} appearing as the {gap_descriptor}. That gap does not mean dishonesty. The model cannot know which is closer to truth.*
>
> *It could mean: a season of constraint, a recent shift, a stated ideal that hasn't yet caught up to lived reality, or a real gap between the why you tell yourself and the why your answers reveal.*
>
> *The only fair question is: does this feel true, partially true, or not true at all?"*

Interpolations: `{claimed_first_human}`, `{revealed_first_human}` use the human-language phrases; `{gap_descriptor}` reads *"smallest share"* (`inverted-small`) or *"share you named first but not the share your answers expose most"* (`inverted-big`).

The tension renders in Open Tensions and the on-screen Distribution subsection emits a small *"Also surfaced in Open Tensions as Claimed and Revealed Drive."* note so the cross-reference is visible.

---

## Mirror Synthesis hook (forward-looking)

CC-025's Mirror Synthesis section can — in a follow-up tuning pass — reference the drive read directly. Example phrasing:

> *"What animates this shape — the why under the what — appears to be {revealed_first_human}."*

This hook is documented here for CC-025's prose work to consume; CC-026 does not edit Synthesis prose itself. When CC-025-followup picks this up, the integration point is the Simple Summary closing pattern — the drive read can land alongside the gift-and-danger compression as one more cross-card synthesis line.

---

## Saved-session compatibility

Pre-CC-026 saved sessions don't have Q-3C1 answers. The engine still computes the revealed distribution from the existing 15 inputs; rank badges and the T-D1 tension only render when Q-3C1 is answered. Old sessions therefore display:

- A populated pie chart with no rank-1/2/3 badge overlays.
- The `unstated` prose template ("*Without your claimed drive, the model can't compare what you'd say guides you against what your answers expose.*").
- No T-D1 tension entry.

No migration needed.

---

## What this canon does NOT govern

- **Cross-card drive-pattern surfaces** (Lens × Drive, Conviction × Drive, Sacred × Drive, Weather × Drive). Deferred to CC-026b after v1 smoke confirms the read is meaningful.
- **LLM substitution path** for the prose templates. Engine-deterministic per the standing rule.
- **The Compass card's value-pool or allocation surfaces.** Drive lives on Path; compass extensions live in their own canon.
- **The pie chart visual itself.** Engineer's choice on rendering details; canon governs the framework, not the SVG.
- **Threshold tuning history.** When `BALANCED_THRESHOLD_PERCENT` or `INVERSION_GAP_THRESHOLD_PERCENT` change, document the rationale here, not in commit messages.

---

## Implementation surfaces

| Canonical rule | Code-level surface |
|---|---|
| Q-3C1 ranking question | `data/questions.ts` (Q-3C1 entry; `card_id: "role"` routes to Path · Gait via `SURVEY_CARD_TO_SHAPE_CARD`) |
| Three claimed-drive signals | `lib/identityEngine.ts § SIGNAL_DESCRIPTIONS` (`cost_drive` / `coverage_drive` / `compliance_drive`); intentionally absent from `SACRED_PRIORITY_SIGNAL_IDS` and `SACRED_IDS` |
| Drive types | `lib/types.ts` (`DriveBucket`, `DriveRanking`, `DriveDistribution`, `DriveCase`, `DriveOutput`); `PathOutput.drive` field |
| Tagging table + computation | `lib/drive.ts` (`SIGNAL_DRIVE_TAGS`, `MULTI_TAG_SPLITS`, `computeDriveDistribution`, `extractClaimedDrive`, `classifyDriveCase`, `generateDriveProse`, `computeDriveOutput`) |
| T-D1 tension | `lib/drive.ts § buildDriveTension`; appended to `tensions` in `lib/identityEngine.ts § buildInnerConstitution` after `derivePathOutput` runs |
| Pie-chart render | `app/components/PieChart.tsx` (3-slice SVG; rank badges optional; paper / ink / umber palette; mobile clamp `width: min(240px, 80vw)`) |
| Path Distribution subsection | `app/components/PathExpanded.tsx` (Distribution mounts above Work; tension cross-reference note on inverted cases) |
| Markdown export | `lib/renderMirror.ts` (Distribution subsection inside `## Path — Gait`; canonical post-CC-033 + CC-040 format would be `[Distribution: Building & wealth X%, People, Service & Society Y%, Risk and uncertainty Z%]` once the export-string update lands — `lib/renderMirror.ts` was outside CC-033's and CC-040's allow-lists, so the file still emits the legacy "Financial security" / "People you love" labels until a follow-up CC catches it). |
