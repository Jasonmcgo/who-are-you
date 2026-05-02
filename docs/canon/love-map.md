# Love Map Framework (CC-044)

## 1. Why this framework exists

The instrument already measures every component of the user's love-shape at high resolution: the Lens aux-pair register names the cognitive-relational shape; the Drive distribution names whether the user's coverage-axis runs intimate or expansive; the OCEAN distribution names trait disposition; Q-X4 names personal-trust portfolio; Q-S3 names where money flows in close vs wider circles; Q-E1 names energy allocation between caring / learning / enjoying / building; Q-Stakes1 names what would hurt most to lose; Q-Ambition1 names what success looks like; Path agency aspiration names whether the user's present is composing with their aspirational register. The composite read across these surfaces discriminates love-shape without any new survey questions.

Per the project's standing rule (`feedback_minimal_questions_maximum_output`): *derive new dimensions from existing signals before adding survey questions*. CC-044 is derivation only. No new measurement surface; the instrument's question footprint is unchanged.

The Love Map is the second of three sibling outputs Jason articulated for purpose-output (**Work / Love / Giving**). These map onto the Drive framework's coverage-axis sub-registers: Work expresses the cost-axis (CC-042), Love expresses the *intimate* sub-register of coverage (CC-044), Giving expresses the *expansive* sub-register of coverage (CC-045). All three siblings inherit the architectural pattern: composition over existing signals, top-1-vs-top-2 register matching with named threshold constants, page-section render between adjacent registers.

Love is structurally distinct from Work in two ways:

1. **Love operates on multiple architectural layers.** Where Work Map is well-described by *register × flavor × example anchors* (CC-042's structure), Love Map benefits from a six-layer architecture surfaced through workshop with Jason 2026-04-29.
2. **Love touches existential territory more directly than Work.** Mistakes in tone read as the instrument missing the user in a way that Work-register mistakes don't. Editorial polish gets a higher bar; CC-044 ships the data spine with v1 placeholder content; **CC-044-prose** is queued for the editorial-polish CC.

---

## 2. The six architectural layers

| Layer | Role | Surface |
|---|---|---|
| **1. Pauline framing (1 Corinthians 13)** | Universal/normative; what real love is and refuses to be. Anchors the framework's ethical floor. | Lives in canon doc + the locked Pauline-frame paragraph in the user-facing render. The Pauline framework name itself never surfaces as a named reference — only the qualities (patient, kind, persists, refuses to keep records, rejoices with truth) appear in plain-language paraphrase. |
| **2. Register (7)** | Character-type / cognitive-relational shape. Composes with the aux-pair register. The user matches 1–2 of the 7. | Surfaces in user-facing prose with register label + short description. |
| **3. Flavor (7)** | Functional mode — what love DOES for the person. Top 1–3 surface as an italic line. | Surfaces in user-facing prose as the flavors line (*"Expressed primarily through {flavor1} and {flavor2}..."*). |
| **4. Virtue baseline** | Pauline negatives applied per register as distortion-diagnostic vocabulary. Each register's `characteristic_distortion` field carries the diagnostic. | Currently data-only (not yet rendered to the user). CC-044-prose surfaces the distortion meaning in plain language. The literal "Pauline diagnostic:" framework-name reference must NOT appear in user-facing prose; CC-048 Rule 1 binds. |
| **5. Bond type (Greek 4)** | Eros / Philia / Storge / Agape — sampled from existing signals. | **Deferred to follow-on CC.** Layer exists architecturally; surfacing in user-facing prose is queued for CC-045+. Canon doc acknowledges the layer; render does not. |
| **6. Resource Balance** | Self-vs-other investment ratio. Surfaces as a diagnostic only when distortion fires. | `inward_heavy` / `outward_depleted` / `thin_overall` cases each get a locked prose paragraph; `healthy` is silent. |

**The Pauline frame is load-bearing.** The single-paragraph framing rendered above the Love Map register output names the qualities of real love (patient, kind, persists, refuses to keep records, rejoices with truth) in plain language. Distinguishes the instrument from typology systems — typology says *here is your kind*; the Pauline frame says *the qualities your love must meet to be love at all are not particular to your kind*. **The framework name "Pauline" never surfaces in user-facing prose** per CC-048 Rule 1 (frameworks behind the scenes).

---

## 3. The 7 love registers

Each register has these fields:

```ts
type LoveRegister = {
  register_key: LoveRegisterKey;
  register_label: string;        // v1 placeholder; CC-044-prose refines
  short_description: string;     // v1 placeholder; CC-044-prose refines
  composes_naturally_with: FunctionPairKey[];
  characteristic_distortion: string; // v1 placeholder; references Pauline negative
};
```

| # | Register | Label (v1) | Composes-naturally-with (aux-pair lenses) |
|---|---|---|---|
| 1 | `devoted_partner` | *the Devoted Partner* | most aux-pairs except Open-Heart Ne-driven (NeFi excluded) |
| 2 | `parental_heart` | *the Parental Heart* | FeSi, SiFe, NiFe, FeNi, FiSe, SeFi |
| 3 | `chosen_family` | *the Chosen Family* | FeSi, SiFe, FeNi, FiSe (preferred) |
| 4 | `companion` | *the Companion* | TiNe, NeTi, SiTe, TeSi, FiNe, NeFi, FiSe, SeFi |
| 5 | `belonging_heart` | *the Belonging Heart* | FeSi, SiFe, FeNi, NiFe, SiTe, TeSi |
| 6 | `loyalist` | *the Loyalist* | FiNe, FiSe (Fi-driver only) |
| 7 | `open_heart` | *the Open Heart* | NeTi, NeFi (Ne-driver only) |

### Predicate intent per register

The composite predicate for each register reads multiple signal portfolios; the v1 implementation in `lib/loveMap.ts § REGISTER_PREDICATES` uses weighted boolean gates so partial matches degrade gracefully. The locked *intent* of each predicate:

- **Devoted Partner.** Pair-bond commitment. `partner_trust_priority` ranked 1 of Q-X4-relational AND (`loyalty_priority` OR `family_priority` in Compass top 3) AND `family_spending_priority` rank ≤ 2 in Q-S3-close AND `close_relationships_stakes_priority` top 2 of Q-Stakes1 AND aux-pair register has Pair-Bonder-friendly shape. Coverage-leaning Drive boosts the score.
- **Parental Heart.** Cultivation register. `family_priority` Compass top 3 AND `caring_energy_priority` Q-E1-inward top 2 AND `family_spending_priority` Q-S3-close rank ≤ 2 AND `close_relationships_stakes_priority` Q-Stakes1 top 2 AND coverage-leaning Drive.
- **Chosen Family.** Network-hub register. `friend_trust_priority` Q-X4-relational rank ≤ 2 AND `friends_spending_priority` Q-S3-close rank ≤ 2 AND `social_spending_priority` Q-S3-wider rank ≤ 2 AND `loyalty_priority` Compass top 3 AND aux-pair register in {FeSi, SiFe, FeNi, FiSe} preferred.
- **Companion.** Steady-presence-beside register. `friend_trust_priority` AND `partner_trust_priority` both rank ≤ 2 in Q-X4-relational (moderate-balanced — neither dominates rank 1) AND `caring_energy_priority` moderate (rank 2–3, not necessarily top 1) AND `freedom_priority` OR `truth_priority` Compass top 3.
- **Belonging Heart.** Community/faith-membership register. (`faith_priority` Compass top 3 OR `religious_trust_priority` Q-X3 institutional trust rank ≤ 2) AND `nonprofits_religious_spending_priority` Q-S3-wider rank ≤ 2 AND `family_priority` Compass top 3 (communities often function as extended family) AND coverage-leaning Drive.
- **Loyalist.** Fi-driver values-anchored register. Fi as driver (FiNe or FiSe aux-pair) AND (`justice_priority` OR `truth_priority` Compass top 3) AND (`holds_internal_conviction` OR `high_conviction_under_risk` signal fires) AND `close_relationships_stakes_priority` Q-Stakes1 top 3 (but not necessarily top 1).
- **Open Heart.** Ne-driver distributed-possibility register. Ne as driver (NeTi or NeFi) AND `freedom_priority` Compass top 3 AND `learning_energy_priority` AND `enjoying_energy_priority` both Q-E1-inward rank ≤ 2 AND `social_spending_priority` Q-S3-wider rank ≤ 2.

The 7 register identities (`register_key`) and the predicate-input structure are canonical at CC-044. Register labels, short descriptions, characteristic distortions, and the `composes_naturally_with` lists are v1 placeholders refined in CC-044-prose.

---

## 4. The 7 flavors

Functional modes — what love DOES for the person. Top 1–3 surface as an italic line in the user-facing render.

| # | Flavor | Label (v1) |
|---|---|---|
| 1 | `commitment_loyalty` | Commitment / Loyalty (durability) |
| 2 | `fun_adventure` | Fun / Adventure / Living Life (vitality) |
| 3 | `building_construction` | Building / Co-construction (practical) |
| 4 | `championing` | Championing (goal-support) |
| 5 | `tenderness_care` | Tenderness / Care (comfort) |
| 6 | `witnessing_recognition` | Witnessing / Recognition (being-seen) |
| 7 | `devotion_to_calling` | Devotion to a Calling (passion-as-identity) |

### Predicate intent per flavor

- **Commitment / Loyalty.** `loyalty_priority` Compass top 3 AND (`holds_internal_conviction` OR `high_conviction_under_risk`) AND (`partner_trust_priority` OR `family_trust_priority` rank ≤ 2 in Q-X4-relational) AND `family_priority` Compass top 5.
- **Fun / Adventure / Living Life.** `enjoying_energy_priority` Q-E1-inward rank ≤ 2 AND `freedom_priority` Compass top 3 AND `social_spending_priority` Q-S3-wider rank ≤ 2 AND `learning_energy_priority` Q-E1-inward rank ≤ 2.
- **Building / Co-construction.** `building_energy_priority` Q-E1-outward rank ≤ 2 AND `family_spending_priority` Q-S3-close rank ≤ 2 AND `agency.aspiration` in {creator, stability} AND (`success_priority` AND `family_priority` both top 3 of their respective rankings).
- **Championing.** `caring_energy_priority` moderate-high Q-E1-inward AND `mentor_trust_priority` Q-X4-relational rank ≤ 2 AND (`success_priority` OR `legacy_priority` Q-Ambition1 top 2) AND `individual_responsibility_priority` Q-C4 top 2.
- **Tenderness / Care.** `caring_energy_priority` Q-E1-inward rank ≤ 2 AND (`compassion_priority` AND `mercy_priority` both Compass top 5) AND (Fe as driver OR instrument in aux-pair register) AND `family_priority` Compass top 3.
- **Witnessing / Recognition.** Fi as driver in aux-pair register AND (`truth_priority` AND `family_priority` both Compass top 5) AND `holds_internal_conviction` signal fires AND (`partner_trust_priority` AND `friend_trust_priority` both rank ≤ 2 in Q-X4-relational).
- **Devotion to a Calling.** `legacy_priority` Q-Ambition1 top 2 AND `building_energy_priority` Q-E1-outward rank ≤ 2 AND (`knowledge_priority` OR `honor_priority` Compass top 3) AND love-object-includes-non-personal proxy (high `building_energy` paired with weak `caring_energy`).

The 7 flavor identities (`flavor_key`) are canonical. Labels and descriptions are v1 placeholders refined in CC-044-prose.

**Pleasure / Eros NOT included as a flavor** — Eros stays at Layer 5 bond-type only (deferred to CC-045+). Provision/Stability and Truth-Telling/Honesty NOT included in v1 — candidate flavors that browser smoke can promote in a follow-on CC if 7-flavor coverage reads thin.

---

## 5. The Resource Balance diagnostic

Computes the user's self-investment-vs-other-investment ratio across spending, energy, and stakes signals. Surfaces only when distortion fires.

### Self-investment signals (sum and normalize)

- `self_spending_priority` rank in Q-S3-close
- `enjoying_energy_priority` rank in Q-E1-inward
- `learning_energy_priority` rank in Q-E1-inward
- `freedom_priority` rank in Compass
- Q-Ambition1 signals (`success_priority`, `fame_priority`, `wealth_priority`, `legacy_priority`)

### Other-investment signals (sum and normalize)

- `family_spending_priority`, `friends_spending_priority` ranks in Q-S3-close
- `social_spending_priority`, `nonprofits_religious_spending_priority` ranks in Q-S3-wider
- `caring_energy_priority` rank in Q-E1-inward
- `family_priority`, `loyalty_priority`, `compassion_priority`, `mercy_priority` ranks in Compass
- Q-X4 relational trust composite (`family_trust_priority`, `partner_trust_priority`, `friend_trust_priority`, `mentor_trust_priority`)

### Case classifier

Each signal contributes a normalized rank-aware weight (rank 1 = 3, rank 2 = 2, rank 3 = 1, present-unranked = 1). Self and other scores are normalized to 0..1 by dividing by the maximum theoretical contribution. Cases:

- **`healthy`**: |selfScore - otherScore| ≤ 0.20 AND both > 0.30 (proportional + present)
- **`inward_heavy`**: selfScore - otherScore > 0.25
- **`outward_depleted`**: otherScore - selfScore > 0.25 AND selfScore < 0.30
- **`thin_overall`**: selfScore < 0.30 AND otherScore < 0.30

Threshold values are exported as named constants (`RESOURCE_BALANCE_DELTA_THRESHOLD`, `RESOURCE_BALANCE_HEALTHY_DELTA_THRESHOLD`, `RESOURCE_BALANCE_THIN_FLOOR`) so post-smoke tuning is visible.

### Locked prose templates

The Resource Balance prose templates are **locked verbatim content** — they touch existential territory and the wording matters. From `lib/loveMap.ts § RESOURCE_BALANCE_PROSE`:

- **`healthy`** — empty string (not rendered).
- **`inward_heavy`** — *"Your love map shows strong self-investment relative to other-investment — your money, energy, and stakes weight noticeably toward yourself. Self-care matters as the substrate for loving others, but if the balance stays heavily inward over time, the love-orientation outward may stay underdeveloped. The question isn't whether you should care for yourself; it's whether the care for yourself is making room for caring for others, or replacing it."*
- **`outward_depleted`** — *"Your love map shows minimal self-investment relative to other-investment — your resources are flowing outward without much returning to keep the source full. Selfless love is real, but a love that empties the lover eventually has nothing left to give. Self-care isn't selfishness; it's the resource-base from which sustainable other-directed love operates. The question isn't whether you should give less; it's whether you're giving in a way that's still possible to keep giving."*
- **`thin_overall`** — *"Your love map shows light investment in both self and others. This may simply be a season — life-stage, capacity, attention all elsewhere — or it may be that love-orientation hasn't yet had the chance to settle into form. Either way, the map below describes the shape your love would tend to take if it were more fully developed; the shape is real even when the practice is still arriving."*

**The Resource Balance diagnostic surfaces independently of register matching.** A user with no strong register match but distorted balance still sees the diagnostic. A user with a strong register match AND healthy balance sees the register prose without a balance line. This is intentional — Resource Balance is a separate diagnostic axis.

---

## 6. Pauline reconciliation — 1 Corinthians 13 mapping

The Pauline epistle (1 Corinthians 13:4–7 in particular) provides the canonical floor for what real love is and refuses to be. The Love Map framework draws on Pauline qualities for two distinct purposes:

1. **Framing the entire Love Map output.** The locked one-paragraph framing rendered above the Love Map register section — *"Real love, regardless of register or flavor, is patient and kind, persists, refuses to keep records, rejoices with truth..."* — is a plain-language paraphrase of the Pauline qualities. **The framework name "Pauline" itself does NOT appear in user-facing prose.** The framing acknowledges the qualities; the user does not need to read the source-text reference to receive the meaning.
2. **Per-register distortion-diagnostic vocabulary.** Each register's `characteristic_distortion` field references one or more Pauline negatives (e.g., *keeps no record of wrongs*, *is not self-seeking*, *does not boast*, *does not delight in evil*) to name what the register's distortion looks like. **The literal "Pauline diagnostic:" prefix in the v1 placeholder strings is a framework-name leak — a Rule 1 (CC-048 canon) violation.** Before CC-044-prose surfaces `characteristic_distortion` in user-facing prose, the prefix must be stripped. The Pauline meaning remains; the framework reference is removed.

### Why Pauline rather than other ethical frameworks

The instrument is making a normative claim: real love has qualities that distinguish it from non-love. Without that ethical floor, the Love Map would slide into typology — *here is your kind*, no qualitative distinction. The Pauline 1 Corinthians 13 framing is the project's chosen ethical floor because:

- It names *qualities* (patient, kind, persists, refuses to keep records, rejoices with truth) rather than *behaviors* (which vary by register and culture). Qualities transfer across cultural and developmental contexts.
- It names *what love is not* alongside *what love is*. Both anchors are needed — qualities-only would read as positive imperative without diagnostic; negatives-only would read as moralism without ethical content.
- It is a known-quantity framework for many users; the framework name itself doesn't need to surface for the qualities to land. Plain-language paraphrase carries the meaning without requiring user-facing framework attribution.

### What stays in canon vs surfaces in render

| Surface | Pauline visible? |
|---|---|
| `docs/canon/love-map.md` (this doc) | Yes — full reference and rationale. |
| `lib/loveMap.ts § characteristic_distortion` v1 placeholders | Currently yes ("Pauline diagnostic:" prefix) — **must be stripped before CC-044-prose surfaces.** |
| User-facing render — Love Map page section framing paragraph | No — plain-language paraphrase only. |
| User-facing render — register descriptions | No. |
| User-facing render — flavor labels and descriptions | No. |
| User-facing render — characteristic_distortion (post-CC-044-prose) | No. |
| User-facing render — Resource Balance prose | No. |

---

## 7. Greek 4 bond-type acknowledgment (Layer 5 — deferred)

The Greek-4 bond-type taxonomy — Eros (passionate / erotic), Philia (chosen friendship), Storge (familial-attachment), Agape (selfless / unconditional) — exists architecturally as Layer 5 in the framework. Each bond-type can in principle be sampled from existing signals:

| Bond type | Plausible signal proxy |
|---|---|
| Eros | (No direct proxy in v1 — the instrument doesn't measure passionate / erotic register directly. Could be inferred weakly from `enjoying_energy_priority` + Compass `freedom_priority` patterns, but the inference is too weak to surface.) |
| Philia | `friend_trust_priority` + `friends_spending_priority` + `loyalty_priority` cluster |
| Storge | `family_priority` + `family_spending_priority` + `caring_energy_priority` + `family_trust_priority` cluster |
| Agape | Coverage-leaning Drive + `caring_energy_priority` rank-1 + `nonprofits_religious_spending_priority` + `compassion_priority` + `mercy_priority` cluster |

**Surfacing Greek 4 bond-type emphasis in user-facing prose is explicitly out of scope for CC-044.** Reasons:

- The Eros register lacks a clean v1 signal proxy.
- Philia / Storge / Agape overlap heavily with the existing 7 registers (Storge → Devoted Partner / Parental Heart; Philia → Chosen Family / Companion; Agape → Belonging Heart). Surfacing both would read as redundant taxonomy stacking.
- Editorial workshop on whether Greek-4 bond-type adds discriminating signal beyond the 7 registers is queued for **CC-045 or later**.

The canon doc names the layer for completeness; the render does not. Future CC may promote Greek-4 sampling to user-facing surface — likely in conjunction with CC-045 (Giving Map) since both Love and Giving live on the coverage-axis and a unified Greek-4-vs-register read may compose more cleanly across both maps.

---

## 8. Philautia handling — Layer 6, not a register

Philautia (self-love) is **explicitly handled at Layer 6 (Resource Balance), not as a separate register or bond-type.** The architectural reason:

- A "Self-Love" register would conflate two distinct registers: healthy self-care (substrate for loving others) and inward-heavy distortion (love displaced from outward to inward). Treating these as one type loses the distinction between healthy proportion and distortion.
- Philautia is best read as a *ratio* (self vs. other investment) rather than as a *type*. The Resource Balance diagnostic computes the ratio directly from spending + energy + stakes signals; the four cases (`healthy` / `inward_heavy` / `outward_depleted` / `thin_overall`) read as states of proportion, not as character types.
- Self-love's healthy expression doesn't require a separate register because every register's `composite_predicate` reads through a balanced signal portfolio that already accounts for self-investment without isolating it.

**Healthy Philautia is the `healthy` Resource Balance case** — proportional self and other investment, both above 0.30. No diagnostic prose surfaces. Distorted Philautia is the `inward_heavy` case (excess self-investment) — diagnostic prose surfaces with the canonical framing about whether self-care is making room for or replacing other-care. The mirror distortion (`outward_depleted`) is also a Philautia issue read as deficit rather than excess.

---

## 9. Editorial policy

- The 7 register identities (`register_key`), 7 flavor identities (`flavor_key`), Resource Balance case classifier (4 cases), threshold constants, and Pauline-frame paragraph are canonical at CC-044. They lock with this CC.
- Register labels, short descriptions, characteristic distortions, flavor labels, and flavor descriptions are **v1 placeholders** subject to **CC-044-prose** (queued).
- Predicate weights inside `lib/loveMap.ts` (the `* 0.30`, `* 0.25` coefficients) are workshop-tunable. The *intent* of each predicate is locked; the implementation choice is open.
- The Resource Balance prose templates are **locked verbatim content** — they touch existential territory and the wording matters. CC-044-prose may extend them with secondary discriminators but does not rewrite the locked language.
- The Pauline-frame paragraph is **locked verbatim content**. It is the load-bearing acknowledgment that distinguishes the Love Map from typology. Don't paraphrase or shorten.
- The "LOVE MAP" section header is canonical for the page-section register established by Disposition Map and Work Map.

### Known editorial follow-up flags (for CC-044-prose)

- All seven `characteristic_distortion` strings carry literal "Pauline diagnostic:" prefixes. Per CC-048 Rule 1 + CC-044's own out-of-scope rule, the prefix must be stripped before the field is surfaced in user-facing prose. Currently data-only.
- Register labels read in a "the Devoted Partner / the Parental Heart" register that mixes article + descriptor + role. CC-044-prose should evaluate whether the register-label shape carries the editorial weight the rest of the instrument's analog labels (single-word from CC-038-prose) target.
- Flavor labels include slash-separated compounds ("Commitment / Loyalty", "Fun / Adventure / Living Life"). CC-044-prose should evaluate whether the slash convention reads as taxonomy rather than register.
- The composite prose template per register that names register × top flavor × characteristic_distortion is the editorial centerpiece of Love Map output. v1 ships a placeholder `generateLoveProse`; CC-044-prose authors the per-register composite template.
- Open Heart + Commitment is a known *natural tension* (Ne-driver wants distributed connection; Commitment narrows). The composite prose can acknowledge it in CC-044-prose: *"Your Open Heart register expressed through Commitment is unusual, and worth attending to: you appear to commit by staying open to the person rather than narrowing toward them."*

---

## 10. Sibling-output futures

The Love Map is the second of three sibling outputs:

- **CC-042 — Work Map.** Composes existing signals into 1–2 work registers + example anchors. **Shipped 2026-04-29.**
- **CC-044 — Love Map.** Composes existing signals into 1–2 love registers + 1–3 flavors + Resource Balance diagnostic. **Shipped 2026-04-29 (this CC).**
- **CC-045 — Giving Map.** Composes existing signals into giving-mode read. **Queued.** Will inherit the architectural pattern (composite predicates, top-1-vs-top-2 thresholds, page-section render) with sibling-specific predicate inputs and register taxonomy.

### Pattern transferability for CC-045

The Love Map predicate pattern transfers to Giving with two adjustments:

1. **Predicate inputs shift focal-direction.** Love emphasizes intimate-circle signals (partner / family / friend trust, family / friends / close-relationships spending, caring energy). Giving emphasizes expansive-circle signals (social / nonprofits-religious spending, mentor / outside-expert trust, coverage-Drive, justice / mercy / compassion / faith Compass values).
2. **Register taxonomy is sibling-specific.** Likely Giving register candidates: time-investment / financial-investment / institutional-mediated / direct-care / advocacy / quiet-anonymous / generative-mentorship. Editorial workshop in CC-045.

**Architectural decision deferred to CC-045:** if Work / Love / Giving threshold constants converge, lift to a shared `lib/derivationThresholds.ts` module. CC-044 keeps thresholds local to `loveMap.ts`.

### Greek 4 bond-type futures

Surfacing Greek-4 bond-type emphasis in user-facing prose is queued for CC-045 or later. The architectural decision will be whether bond-type composes orthogonally with the 7 Love registers (as a second-axis read) or as a direct alternative to the register taxonomy. CC-044 ships register-only; CC-045 makes the call.

---

## Implementation surfaces

| Canonical rule | Code-level surface |
|---|---|
| 7 register taxonomy + types | `lib/types.ts` (`LoveRegisterKey`, `LoveRegister`, `LoveFlavorKey`, `LoveFlavor`, `LoveRegisterMatch`, `LoveFlavorMatch`, `ResourceBalanceCase`, `ResourceBalance`, `LoveMapOutput`); `InnerConstitution.loveMap?: LoveMapOutput` |
| Register definitions (labels, descriptions, distortions, composes_naturally_with) | `lib/loveMap.ts § LOVE_REGISTERS` |
| Flavor definitions | `lib/loveMap.ts § LOVE_FLAVORS` |
| Composite register predicates | `lib/loveMap.ts § REGISTER_PREDICATES` |
| Flavor signal predicates | `lib/loveMap.ts § FLAVOR_PREDICATES` |
| Resource Balance compute + prose | `lib/loveMap.ts § computeResourceBalance` + `RESOURCE_BALANCE_PROSE` |
| Threshold constants | `lib/loveMap.ts § LOVE_REGISTER_TOP1_THRESHOLD / LOVE_REGISTER_TOP2_FLOOR / LOVE_REGISTER_FLOOR / LOVE_FLAVOR_FLOOR / RESOURCE_BALANCE_DELTA_THRESHOLD / RESOURCE_BALANCE_HEALTHY_DELTA_THRESHOLD / RESOURCE_BALANCE_THIN_FLOOR` |
| Distribution + matcher + prose | `lib/loveMap.ts` (`computeLoveMapOutput`, `generateLoveProse`) |
| Page-section render | `app/components/LoveMap.tsx` |
| Page assembly + Pauline-frame paragraph + footnote | `app/components/InnerConstitutionPage.tsx` (between Work Map and Map) |
| Engine pipeline | `lib/identityEngine.ts § buildInnerConstitution` (post-Work Map call site) |

---

## CC-059 amendment (2026-05-01) — Rule 1 closure for `lib/loveMap.ts`

CC-059 closes the CC-048 audit Rule 1 (frameworks behind the scenes) violations the original CC-044 ship report flagged as known v1 defects deferred to "CC-044-prose." Nine string replacements landed in `lib/loveMap.ts` § `LOVE_REGISTERS`:

- **7 `characteristic_distortion` rewrites** — strip the *"Pauline diagnostic: ..."* trailer from each register; replace with locked plain-language continuation that preserves the diagnostic content without naming the framework. The Pauline qualities (refusing to keep records, not boasting, always protecting, etc.) survive as paraphrased mechanism descriptions; the framework name does not surface.
- **2 `short_description` rewrites** — strip the *"Fi-driver"* / *"Ne-driver"* typological codenames from `loyalist` and `open_heart`; replace with locked plain-language clauses that name the register's lived shape rather than its cognitive-function-routing source. The aux-pair register's role in matching the user to the love register stays in canon docs and engine code (the `composes_naturally_with` field), not in user-facing string content.

The inline comment block at the top of `lib/loveMap.ts` (lines 19-44) — including the architectural-rule reminder that the Pauline reference lives in canon and informs distortion vocabulary — is preserved unchanged. The Rule 1 canon explicitly preserves canonical-doc + code-comment references to frameworks; only user-facing string literals are governed.

The locked Pauline-frame paragraph at `app/components/InnerConstitutionPage.tsx:457` (the framing block above the Love Map render) is unchanged — already framework-clean per CC-044's design (paraphrases the qualities without naming the framework).

Tone register held: each rewrite ships ~30-50 words; observational ("the distortion is when love starts keeping books love wasn't meant to keep"), not condemning; one register-naming clause + one distortion-mechanism clause per field; second-person consistent with the rest of the engine.

Polish-layer contract impact: per CC-057a, when a future CC adds a render surface for `characteristic_distortion`, that future CC also extends `lib/humanityRendering/contract.ts § buildEngineRenderedReport` to add the cleaned distortion strings to `lockedAnchors[]`. CC-059 does not pre-wire that.
