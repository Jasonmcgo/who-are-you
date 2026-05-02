# Report Calibration Audit — 2026-04-29

| Field | Value |
|---|---|
| **Audit date** | 2026-04-29 |
| **Codebase commit** | `922be581` (worktree dirty: includes partial CC-044 Love Map ship) |
| **Parent CC** | CC-048 (Report Calibration Canon Refinement + Audit Pass) |
| **Canon authority** | `docs/canon/result-writing-canon.md § Report Calibration Canon` |
| **Total flagged findings** | 162 |

## Executive summary

Walking the seven prose-emitting surfaces against the ten calibration rules produced 162 flagged findings. Three patterns dominate: **Rule 2 (generic gifts)** with 32 findings cluster on `GIFT_DESCRIPTION` and the per-card composers that consume it; **Rule 3 (generic growth edges)** with 38 findings cluster on `GROWTH_EDGE_TEXT` and `BLIND_SPOT_TEXT_VARIANTS`; **Rule 6 (OCEAN as texture, not standalone)** with 11 findings cluster on the Disposition Map page section's framing paragraph + `generateOceanProse` templates + the *Big-5* leakage in InnerConstitutionPage's framing paragraph and OceanBars' aria-label.

The biggest single-surface finding count is `lib/identityEngine.ts` (118 findings) — expected because it carries the per-card derivation, the gift / growth-edge / blind-spot maps, the cross-card synthesis, and the allocation-gap composition.

The audit also surfaces **Rule 5 (uncomfortable-but-true sentence) as a structural absence** rather than a per-line violation — the entire instrument lacks a slot that authors a per-user uncomfortable-but-true observation. CC-053 (queued in the rewrite track) authors the slot; the audit notes the absence as a single finding rather than per-card.

The architecture itself is unchanged by this audit. The findings are *furniture* — labels, prose templates, framing paragraphs, section headers — not the layered architecture (Mirror / Map / Path) or the eight ShapeCards.

**CODEX-055 correction note.** CODEX-055 corrected the Q-X3-cross/Q-X4-cross item-count assertion from
CC-035; actual count is 4 (top-2 from each parent), and current derivation math (top-3 from cross) holds.

**CC-064 coverage extension (2026-05-02).** A new tension class `T-016 — Value vs Institutional Trust Gap` is added in `lib/identityEngine.ts § detectValueInstitutionalTrustGap` and wired into `buildInnerConstitution`. Six locked (value → institution) pairs fire when a sacred value ranks Compass top-3 while its analog institutional-trust signal does NOT rank in the user's top-3 trusted institutions: Knowledge → Education, Truth → Journalism, Justice → Government (elected), Stability → Government Services, Compassion → Non-Profits, Mercy → Religious institutions. Faith intentionally excluded — CC-054's Faith Shape covers prose-side. T-016 is a coverage extension of the tension catalog, not a closure of any prior Rule violation in this audit; the audit's surface-counts and Rule-finding totals are unchanged. See `docs/canon/result-writing-canon.md § Rule 8 § CC-064 amendment` and `docs/canon/tension-library-v1.md § T-016` for full canon.

---

## 1. Audit methodology

For each prose-emitting surface listed below, every prose template was read and checked against each of the ten rules in `docs/canon/result-writing-canon.md § Report Calibration Canon`. Findings flag specific violations with the locked entry format:

```
- File: path/to/file.ts:LINE
  Rule violated: Rule N (short name)
  Current text: "<exact prose template>"
  Issue: <one-sentence why this violates the rule>
  Fix direction: <one-sentence direction for the rewrite CC>
```

**Audit register: mechanical, not editorial.** Findings name the violation and a fix direction; they do not author replacement prose. Severity ranking and replacement authorship happen in the rewrite CCs (CC-049+). Editorial subjectivity ("which violation is worse?") is deferred.

**Surfaces walked:**

1. `lib/identityEngine.ts` — gift / growth-edge / blind-spot maps, per-card derivations, cross-card synthesis, allocation-gap composition, thesis templates, gift-danger lines.
2. `lib/workMap.ts` — 8 work-register fields, `generateWorkProse` templates.
3. `lib/loveMap.ts` (post-CC-044-partial; code-side shipped, canon doc deferred) — 7 register fields, 7 flavor fields, Resource Balance prose, `generateLoveProse` templates.
4. `lib/ocean.ts` — `BUCKET_LABEL`, `BUCKET_LABEL_SHORT`, `generateOceanProse` 4 case templates.
5. `app/components/InnerConstitutionPage.tsx` — section headers, framing paragraphs.
6. `app/components/OceanBars.tsx` — aria-label.
7. Cross-cutting / structural absences (Rule 5, Rule 7, Rule 10).

**Path · Gait composite:** `lib/freeformProse.ts` does not exist; the Path · Gait composite lives in `lib/identityEngine.ts` (`generatePathExpansion` + the `PATH_LOVE_DISTILLATION` map). Audited in §2.1 as part of identityEngine.ts.

---

## 2. Surface-by-surface findings

### 2.1 `lib/identityEngine.ts`

#### Rule 1 — Frameworks behind the scenes

- **File:** `lib/identityEngine.ts:2911`
  **Rule violated:** Rule 1 (frameworks behind the scenes — implicit, weak)
  **Current text:** `"Among institutions, you appear to lean toward {instLabels}. For hard truth, you appear to turn first toward {personalLabels}."`
  **Issue:** Categorical frame ("trust X / Y") composes downstream into Rule 8 violation; not an explicit framework name leak but adjacent.
  **Fix direction:** Compose with Rule 8's conditional framing as the rewrite-CC fix.

#### Rule 2 — Generic gifts need user-specific second sentences

**STATUS: RESOLVED by CC-052 (2026-04-30).** All 12 `GIFT_DESCRIPTION` findings closed. The selector function `getGiftSpecificity` in `lib/identityEngine.ts` composes a user-specific Sentence 2 anchor selected by signal context for each category. Wired at all four call sites: `deriveCompassOutput`, `deriveConvictionOutput`, `deriveTrustOutput`, `synthesizeTopGifts`. The fix-direction sketches below ship verbatim per the CC-052 locked content.

12 findings, one per `GIFT_DESCRIPTION` entry. Each is a generic gift sentence reusable across any user with that gift category.

- **File:** `lib/identityEngine.ts:2566`
  **Rule violated:** Rule 2
  **Current text:** `"Pattern: you tend to see the deeper shape of a problem before it becomes obvious to others"`
  **Issue:** Reusable across any Pattern-route user; no anchor to user's specific signal pattern.
  **Fix direction:** Compose a second sentence keyed to the route's discriminating condition (Ni-driver+truth_priority → "moral-strategic-linguistic anomaly detection"; Ne-driver+freedom_priority → "framework-prober at the edges of available evidence"; default → "structural pattern-finding under noise").

- **File:** `lib/identityEngine.ts:2567`
  **Current text:** `"Precision: you tend to clarify what's actually being claimed before the conversation moves"`
  **Fix direction:** Per-user second sentence keyed to Ti+truth/knowledge route ("clarification-as-care") vs Ti-fallback ("disambiguation-by-instinct") vs Te+truth/knowledge ("operational clarification register").

- **File:** `lib/identityEngine.ts:2568`
  **Current text:** `"Stewardship: you tend to preserve what matters across time, especially when others are looking past it"`
  **Fix direction:** Per-user second sentence keyed to Si+stability ("memory-as-protection"), Si+family ("relational continuity"), TeSi-aux-pair ("operational stewardship"), SiFe-aux-pair ("kinkeeper-class care").

- **File:** `lib/identityEngine.ts:2569`
  **Current text:** `"Action: you tend to move when others freeze, and to learn by engaging the situation as it actually is"`
  **Fix direction:** Per-user second sentence keyed to Se+freedom_priority ("alive in the field"), Se+creator-agency ("embodied building"), Se default ("presence-as-engagement").

- **File:** `lib/identityEngine.ts:2570`
  **Current text:** `"Harmony: you tend to read the room and tend to what the moment is asking of those present"`
  **Fix direction:** Per-user second sentence keyed to Fe+family ("relational coherence as load-bearing"), SiFe-aux-pair ("ritual-of-care"), Fe-default ("attunement-as-vocation").

- **File:** `lib/identityEngine.ts:2571`
  **Current text:** `"Integrity: you tend to refuse compromises that would betray your own sense of what's right"`
  **Fix direction:** Per-user second sentence keyed to Fi+conviction-fires ("values-rooted refusal"), Fi+truth_priority ("named-not-implied honesty"), FiSe-aux-pair ("witness-class embodiment").

- **File:** `lib/identityEngine.ts:2572`
  **Current text:** `"Builder: you tend to turn ideas into working systems and to push past friction toward a result"`
  **Fix direction:** Per-user second sentence keyed to Te+system_responsibility ("operational architecture"), NiTe-aux-pair ("long-arc structure-builder"), TeNi-aux-pair ("strategy-into-deployment"), Se+creator ("hands-on builder").

- **File:** `lib/identityEngine.ts:2573`
  **Current text:** `"Advocacy: you tend to notice what's owed and to protect those who can't protect themselves"`
  **Fix direction:** Per-user second sentence keyed to justice_priority+individual+system_responsibility ("structural-ethical advocacy"), Se+justice ("somatic-justice register"), Fi-driver ("values-rooted advocacy").

- **File:** `lib/identityEngine.ts:2574`
  **Current text:** `"Meaning: you tend to connect what's happening to what it might mean over the longer arc"`
  **Fix direction:** Per-user second sentence keyed to Ni+faith ("metaphysical meaning-making"), Ni+knowledge ("intellectual long-arc reading"), NiFe-aux-pair ("seer-class meaning"), FeNi-aux-pair ("pastoral meaning").

- **File:** `lib/identityEngine.ts:2575`
  **Current text:** `"Endurance: you tend to keep functioning under load that would unseat others"`
  **Fix direction:** Per-user second sentence keyed to Si+stability+weather.intensifier=high ("durable-memory under sustained load"), Si-default ("steady-presence-through-difficulty").

- **File:** `lib/identityEngine.ts:2576`
  **Current text:** `"Discernment: you tend to detect what doesn't add up before it surfaces openly"`
  **Fix direction:** Per-user second sentence keyed to Ti+truth+knowledge ("anomaly-detection across moral, strategic, and linguistic patterns"), Ni+truth ("long-arc anomaly read"), Si+truth/knowledge ("subtle-anomaly pattern-matcher"), Ne-driver ("framework-prober").

- **File:** `lib/identityEngine.ts:2577`
  **Current text:** `"Generativity: you tend to help others become more capable rather than more dependent"`
  **Fix direction:** Per-user second sentence keyed to Te+aspiration=relational/stability/exploration ("capacity-building"), Ne-driver ("invitation-to-become"), Te-default ("operational generativity").

#### Rule 3 — Generic growth edges need user-specific second sentences

**STATUS (GROWTH_EDGE_TEXT + BLIND_SPOT_TEXT_VARIANTS portion): RESOLVED by CC-061 (2026-05-01).** All 24 findings on `GROWTH_EDGE_TEXT` (12) and `BLIND_SPOT_TEXT_VARIANTS` (12) closed. `getBlindSpotSpecificity` in `lib/identityEngine.ts` returns user-specific Sentence 2 anchors keyed to dominant function + Compass / Gravity / agency / aux-pair signal patterns. The selector walks 12 GiftCategory branches; each branch tests 2 priority-ordered conditions and falls through to a no-discriminator fallback. Locked Sentence 2 prefix: *"For your shape, this blind spot expresses as ".* It is exported from `lib/identityEngine.ts` and consumed by `lib/humanityRendering/contract.ts § extractBlindSpotAnchorsFromText` so anchors lift into `lockedAnchors[]` for polish round-trip validation. Per CODEX-058b, conditions do not gate on `gift_category` (entry already routed by category). Wired into `blindSpotFor` (which composes the user-visible "Growth Edge" cell on every card per CC-025's rewiring). The 8 `SHAPE_CARD_PRACTICE_TEXT` and 6 `GIFT_DANGER_LINES` Rule 3 findings remain open for follow-on CCs per the audit's CC-051 split. See `docs/canon/result-writing-canon.md § Rule 3 § CC-061 amendment` for full details.
*CODEX-061b workshop fix (2026-05-01) — stripped CC-061's dead `getGrowthEdgeSpecificity` half per CC-025's `void growthText` design. The user-facing "Growth Edge" cell remains closed via the live blind-spot composition path; Practice remains the separate `SHAPE_CARD_PRACTICE_TEXT` surface.*

12 findings on `GROWTH_EDGE_TEXT` (`lib/identityEngine.ts:2580-2593`). Each entry is a generic growth phrase that could appear in nearly any report.

- **File:** `lib/identityEngine.ts:2581-2592` (12 entries; one finding per entry) **✅ RESOLVED CC-061**
  **Rule violated:** Rule 3
  **Issue:** Each entry of `GROWTH_EDGE_TEXT` is a generic growth-move sentence reusable across any user with that gift category. The entries should compose with a per-user signal-anchored second sentence (per the canon adherence example: *"Rigidity for your shape isn't merely stubbornness. It's when a long-range read becomes morally fused before the room has caught up..."*).
  **Fix direction:** For each gift category, author a per-user signal-anchored second sentence keyed to the discriminating signal pattern that fired the gift category. Compose alongside the existing first sentence rather than replacing it.

12 additional findings on `BLIND_SPOT_TEXT_VARIANTS` (`lib/identityEngine.ts:2488-2535`). Each variant pool is generic across users (the variants discriminate by per-card use-count, not per-user signal pattern).

- **File:** `lib/identityEngine.ts:2488-2535` (12 entries; one finding per gift category) **✅ RESOLVED CC-061**
  **Rule violated:** Rule 3
  **Issue:** Each variant in `BLIND_SPOT_TEXT_VARIANTS` is a generic blind-spot sentence; the variant pool exists to break cross-card duplication (per CC-015a) but does not break per-user genericness.
  **Fix direction:** Per gift category, compose a second sentence after the existing variant that anchors the blind spot to the user's signal pattern. The cross-card variant rotation stays; the per-user anchor adds a layer.

8 additional per-card growth-edge sentences (`growthEdgeFor` / `SHAPE_CARD_PRACTICE_TEXT`, `lib/identityEngine.ts:2610-2627`):

- **File:** `lib/identityEngine.ts:2610-2627` (8 cards, one finding per card)
  **Rule violated:** Rule 3 (weak — these are practice templates, more directional than growth-edge phrases, but still generic)
  **Issue:** `SHAPE_CARD_PRACTICE_TEXT` entries are card-keyed generic prompts; they compose with the per-card register but not with the user's specific signal pattern.
  **Fix direction:** Lower priority than `GROWTH_EDGE_TEXT` and `BLIND_SPOT_TEXT_VARIANTS` rewrites. If browser smoke after CC-049/CC-050 surfaces these as still-flat, queue a CC-051 that adds per-user composition to practice templates.

#### Rule 4 — Allocation-gap names the 3C's-specific question

**STATUS: RESOLVED by CC-060 (2026-05-01).** All three findings closed. The selector function `getAllocationSharpQuestion(tensionId, valueLabel, driveOutput)` in `lib/identityEngine.ts` composes one of 12 locked sharp-question templates (3 tensions × 4 bucket cases) selected by `classifyAllocationBucket(driveOutput)` reading distribution percentages directly. Wired at three call sites: T-013 (line ~848), T-014 (line ~899), T-015 (both synthesis-collapse and per-instance variants in `detectAllocationOverlayTensions`). The multi-disclaimer hedging block is removed from all three; `grep "That does not mean hypocrisy" lib/identityEngine.ts` returns zero hits. **Drive case-key implementation note:** the original CC-060 prompt assumed `DriveCase` emitted bucket-leaning strings; actual `DriveCase` is the matrix-tension classifier per CC-026. The implementation reads `driveOutput.distribution` percentages directly with a 38% lean threshold, matching `lib/workMap.ts § isCostLeaning` / `lib/loveMap.ts § isCostLeaning`. See `docs/canon/result-writing-canon.md § Rule 4 § CC-060 amendment` for full details. The Builder ↔ Maintenance partial-adherent template at line ~4374 stays as-is — it's a separate cross-card pattern surface, not an allocation-tension `user_prompt`.

- **File:** `lib/identityEngine.ts:847` (T-013 user_prompt — money allocation gap) **✅ RESOLVED CC-060**
  **Rule violated:** Rule 4
  **Current text:** `"You named ${VALUE_LABEL_HUMAN[valueSignal]} as among your most sacred values. Your money appears to flow mostly to ${humanizeSignalIds(topSpending)}. That does not mean hypocrisy. The model cannot know motive.\n\nIt could mean: exhaustion, a difficult season, needed self-care, social bonding, old habits, or a real gap between stated priority and lived allocation.\n\nThe only fair question is: does this feel true, partially true, or not true at all?"`
  **Issue:** Three sentences of disclaimer ("does not mean hypocrisy", "the model cannot know motive", "it could mean..."), one sentence of question. The 3C's framework is the instrument's strongest differentiator; the prose currently apologizes for itself rather than honoring it.
  **Fix direction:** Read which Drive bucket the user leans toward (cost / coverage / compliance / balanced). Author per-bucket sharp question per the canon's Rule 4 examples — cost-leaning → maintenance-vs-creation; coverage-leaning → relational-presence; compliance-leaning → protection-vs-paralysis. Replace the multiple-disclaimer block with a single bucket-keyed question.

- **File:** `lib/identityEngine.ts:898` (T-014 user_prompt — energy allocation gap) **✅ RESOLVED CC-060**
  **Rule violated:** Rule 4
  **Current text:** Same disclaimer-heavy structure as T-013, framed for energy rather than money.
  **Issue:** Same as T-013 — three disclaimer sentences, one question.
  **Fix direction:** Same per-bucket sharp question approach. Cost-leaning users get the protected-hours question (per the canon's adherence example); coverage-leaning users get the energy-toward-relational-presence question; compliance-leaning users get the energy-toward-protection-vs-paralysis question.

- **File:** `lib/identityEngine.ts:4374` (Builder ↔ Maintenance allocation gap — already pattern-specific, partial Rule 4 adherence)
  **Rule violated:** Partial Rule 4 (already names creative output / protected hours / strategic attention)
  **Current text:** `"For ${possessive} shape, the meaningful allocation gap may not be the standard money-toward-charity question. The sharper question is whether ${possessive} creative output, ${possessive} protected hours, and ${possessive} strategic attention are moving toward the future ${subj} say${s} ${subj} believe${s} in — or whether maintenance is consuming the time that was supposed to build it."`
  **Issue:** This entry already approximates Rule 4 adherence (cost-leaning case). It's the closest existing prose to the canon adherence example. Use as the seed for the rewritten T-013/T-014 cost-leaning case in CC-050.
  **Fix direction:** Promote this prose pattern to be the canonical cost-leaning user_prompt for T-013. Then author parallel patterns for coverage-leaning and compliance-leaning users.

#### Rule 8 — Trust nuance: conditional framing, not categorical

**STATUS (cardHeader portion): RESOLVED by CC-063 (2026-05-01).** The Trust card's `cardHeader` composition in `deriveTrustOutput` (`lib/identityEngine.ts`) now renders a four-case composition (both / inst-only / personal-only / neither) prepended with the locked Rule-8 conditional-framing prefix in Cases A and B. Per-user `instLabels` and `personalLabels` interpolation preserved; number agreement enforced via `.length === 1` ternaries. The body-prose Rule 8 findings below (line 2919 trusted-sources sentence; line 2931 risk-under-pressure prose) remain open for follow-on per CC-063's cardHeader-only scope. See `docs/canon/result-writing-canon.md § Rule 8 § CC-063 amendment`.

- **File:** `lib/identityEngine.ts:2911` **✅ RESOLVED CC-063 (cardHeader)**
  **Rule violated:** Rule 8
  **Current text:** `"Among institutions, you appear to lean toward ${instLabels}. For hard truth, you appear to turn first toward ${personalLabels}."`
  **Issue:** Categorical framing — names institution categories (Non-Profits, Small / Private Business, etc.) without naming the *condition* under which the user's trust extends.
  **Fix direction:** Replace with the canon's Rule 8 adherence example pattern: *"You tend to trust institutions when responsibility, consequence, and mission stay close to the people making decisions. Among the institutions in your top-trust ranking, ${instLabels} sit highest — likely because they tend to hold those proximities better than larger, more abstracted forms. For relational truth, ${personalLabels} are where you turn first."*

- **File:** `lib/identityEngine.ts:2919`
  **Rule violated:** Rule 8
  **Current text:** `"Your top-trusted sources (${joinList([...instLabels, ...personalLabels].slice(0, 3))}) are who you appear to weight most when truth is at stake."`
  **Issue:** Reinforces the categorical framing; treats institutional and personal trust as the same register.
  **Fix direction:** Drop or rewrite — the conditional framing in the rewritten cardHeader already carries the read; this sentence becomes redundant. If kept, separate institutional from personal trust register explicitly.

- **File:** `lib/identityEngine.ts:2931`
  **Rule violated:** Rule 8 (weak — generic risk-under-pressure prose, not specifically categorical)
  **Current text:** `"trust can collapse two ways: capture (over-trusting one source) or paranoia (under-trusting all sources). ${loadCue}"`
  **Issue:** Generic across users — same prose for all Trust card readers regardless of which sources they trust.
  **Fix direction:** Compose with the user's specific top-trust pattern — a user with mostly-personal-trust risks "in-group capture"; a user with mostly-institutional-trust risks "abstracted compliance"; a user with thin trust risks "paranoia". Keep the load-cue structure.

#### Rule 9 — Responsibility nuance: accountable actors inside systems

**STATUS (cardHeader portion): RESOLVED by CC-063 (2026-05-01).** The Gravity card's `cardHeader` composition in `deriveGravityOutput` (`lib/identityEngine.ts`) now renders the locked accountable-actor framing per the canon's Rule 9 adherence example. Per-user `labels` interpolation preserved via `joinList(labels)`; number agreement enforced via `labels.length === 1` ternary (*ranks* singular / *rank* plural). The empty-labels fallback is unchanged. The body-prose Rule 9 findings below (line 2867 giftText conditional; line 2877 risk-under-pressure prose) remain open for follow-on per CC-063's cardHeader-only scope. See `docs/canon/result-writing-canon.md § Rule 9 § CC-063 amendment`.

- **File:** `lib/identityEngine.ts:2858` **✅ RESOLVED CC-063 (cardHeader)**
  **Rule violated:** Rule 9
  **Current text:** `"When something goes wrong, you appear to look first toward ${joinList(labels)}."`
  **Issue:** Categorical attribution — names responsibility-attribution categories (Individual / System / Authority / Nature / Supernatural) as a list. Reads as "you blame X / Y" rather than "you look for accountable actors inside the system."
  **Fix direction:** Replace with the canon's Rule 9 adherence example: *"When something goes wrong, you appear to look first for the accountable actor inside the system — ${joinList(labels)} rank highest in your responsibility weighting because they name *who* had agency, who made the decision, who failed to act. That doesn't mean you skip the system; it means you locate where the system became personal."* Adjust phrasing when system_responsibility itself is in the top labels (the user is *also* structural-thinking).

- **File:** `lib/identityEngine.ts:2867`
  **Rule violated:** Rule 9 (partial — already softer than the cardHeader)
  **Current text:** `"you tend to weigh ${joinList(labels)} as the locus where responsibility actually sits. That is the lens that protects accountability — your shape is unlikely to drift into vague blame."`
  **Issue:** "Locus where responsibility actually sits" is conditional-leaning but still uses the categorical attribution-frame.
  **Fix direction:** Compose with the rewritten cardHeader; this sentence gets the conditional-condition specificity ("when systems are in scope, you locate the accountable actor inside the system rather than the system as the actor").

- **File:** `lib/identityEngine.ts:2877`
  **Rule violated:** Rule 9 (weak — risk-under-pressure prose, not specifically categorical)
  **Current text:** `"your responsibility frame is a strength when applied with care; under cost, it can become the only frame you reach for."`
  **Issue:** Generic; same prose for all Gravity card readers.
  **Fix direction:** Compose with the user's specific gravity weighting — a user with both individual + system in top reads as "structural-with-accountability"; a user with just individual reads as "personal-attribution-first"; a user with just authority reads as "deference-to-named-decision-maker."

#### Rule 10 — Peace disambiguation via cross-signals

**STATUS: RESOLVED by CC-054 (2026-05-01).** Both findings closed. The selector function `getPeaceRegister` in `lib/identityEngine.ts` composes one of 4 locked Peace prose templates (moral / structural / relational / surface) from cross-signal pattern, plus a 5th fallback. Wired into `deriveCompassOutput`'s output via the optional `peace_register_prose` field on `FullSwotOutput`; rendered in `app/components/MapSection.tsx` gated on `expanded.compass`. The function returns `null` (silent) when peace_priority is not in the user's Compass top 5. CC-054 also adds a parallel two-layer Faith Composite disambiguation (new canon Rule 11) covering `faith_priority` Shape + Texture composition.

- **File:** `lib/identityEngine.ts:2726` (deriveCompassOutput cardHeader)
  **Rule violated:** Rule 10 (current absence)
  **Current text:** `"When something has to give, you appear to protect ${valueListPhrase(topCompass, 0)} first."`
  **Issue:** No disambiguation when peace_priority appears in the user's top values. *"Peace"* renders flat regardless of whether the user means moral / structural / relational / surface peace.
  **Fix direction:** When `peace_priority` is in `topCompass` (rank ≤ 3), compose a Rule-10-pattern sentence after the cardHeader that disambiguates by cross-signal pattern. Per the canon's adherence example (moral-peace pattern): *"You named Peace among your most sacred values — and your other rankings suggest you mean it in the metaphysical / moral register rather than the conflict-avoidance register..."* Author parallel sentences for structural / relational / surface patterns.

- **File:** `lib/identityEngine.ts:2735` (deriveCompassOutput giftText)
  **Rule violated:** Rule 10 (downstream of cardHeader)
  **Current text:** `"Your top-ranked values (${valueListPhrase(topCompass, 0)}) are the structure that strength is built around."`
  **Issue:** Same as cardHeader — no disambiguation for peace_priority.
  **Fix direction:** Compose with the rewritten cardHeader's disambiguation; this sentence inherits the read.

#### THESIS_TEMPLATES (lines 4562-4661) — Rule 1 + Rule 2 audit

- **File:** `lib/identityEngine.ts:4562-4661` (~25 entries)
  **Rule violated:** Rule 2 (partial; templates are signal-anchored by [function|compass-signal] key but don't compose user-specific second sentences)
  **Issue:** THESIS_TEMPLATES already discriminates by Lens dominant + Compass top signal — partial Rule 2 adherence. Each template's prose is specific to that pairing. The remaining gap: when a user's signal pattern has additional discriminators beyond [function|compass], the thesis stays at the [function|compass] generality.
  **Fix direction:** Lower priority than `GIFT_DESCRIPTION` rewrites. CC-052 candidate — extend THESIS_TEMPLATES to compose with secondary discriminators (agency.aspiration, fire.willingToBearCost, weather.intensifier) when present.

#### THESIS_FALLBACK_BY_FUNCTION (line 4662) — Rule 2 audit

- **File:** `lib/identityEngine.ts:4662` (8 entries, one per cognitive function)
  **Rule violated:** Rule 2
  **Issue:** Function-only fallback templates fire when no [function|compass] match landed. Generic across users with the same dominant function.
  **Fix direction:** Same as `GIFT_DESCRIPTION` — compose with the user's signal pattern when fallback fires. CC-052 candidate.

#### GIFT_DANGER_LINES (lines 4525-4555) — Rule 3 audit

- **File:** `lib/identityEngine.ts:4525-4555` (8 entries, one per cognitive function)
  **Rule violated:** Rule 3 (the "danger" fields are generic per-function rather than per-user)
  **Current text examples:** `ni: { gift: "the long read", danger: "believing the long read too early" }`, `ne: { gift: "room-reading", danger: "room-reading instead of saying" }`
  **Issue:** Function-only generic. The Jason0429 report's golden sentence ("Your gift is the long read. Your danger is believing the long read too early.") was flagged in Clarence's review as the *most adherent* prose in the report — which suggests the per-function generic is *better* than most of the rest, but Rule 3's per-user discipline still requires compose-with-signal-pattern when secondary discriminators are available.
  **Fix direction:** Lower priority than the `GROWTH_EDGE_TEXT` and `BLIND_SPOT_TEXT_VARIANTS` rewrites. The per-function generic is currently the strongest sentence in many reports; preserve it and *add* a per-user second sentence rather than replace.

#### Cross-card synthesis (`generateGrowthPath`, `generateRelationshipTranslation`, `generateConflictTranslation`, `generateMirrorTypesSeed`)

- **File:** `lib/identityEngine.ts:3254-3360` (4 cross-card composers)
  **Rule violated:** Rule 2 (similar — already signal-aware but compose with generic gift/category labels)
  **Issue:** The cross-card composers thread the user's signal portfolio (topCompass, stack, topGravity, agency) but the prose templates still draw on `GIFT_DESCRIPTION` / `GIFT_NOUN_PHRASE` text. Their genericness inherits from the gift-map genericness.
  **Fix direction:** Inherit from CC-049 (gift specificity rewrite). When the gift-map prose composes per-user, the cross-card composers automatically inherit. No standalone fix needed.

### 2.2 `lib/workMap.ts`

#### Rule 2 — Generic register descriptions

- **File:** `lib/workMap.ts:155-235` (8 work registers, one finding per register)
  **Rule violated:** Rule 2
  **Issue:** Each `LoveRegister` entry's `short_description` is v1 placeholder per the CC-042 spec — register text reads generically across users matched to that register. Per Jason 2026-04-29 calibration ("the slash convention reads more like an academic taxonomy than the body-of-work register the rest of the instrument uses"), this is workshop material.
  **Fix direction:** CC-053 candidate — compose with the user's `composes_naturally_with` aux-pair register match to surface a per-user second sentence ("Your version of Strategic / Architectural Work, given your NiTe register, leans toward long-arc structural-architectural roles where the architecture itself is the medium" vs "Your version of Strategic / Architectural Work, given your TeNi register, leans toward strategic deployment of long-arc objectives in operational form").

- **File:** `lib/workMap.ts:155-235` (`example_anchors` lists, 8 registers)
  **Rule violated:** Rule 2 (weak — anchors are illustrative grounding, not descriptive prose)
  **Issue:** Anchors are intentionally generic per CC-042 spec ("anchors are illustrative, not exhaustive — the framing paragraph and footnote both reinforce the derivation-not-prescription register"). Not a Rule 2 violation in the strict sense; flagged for visibility only.
  **Fix direction:** No change required by Rule 2. Workshop refinement of anchors is post-browser-smoke per CC-042 spec.

- **File:** `lib/workMap.ts:381` (generateWorkProse single-match template)
  **Rule violated:** Rule 2
  **Current text:** `"Your composite read points toward ${m.register.register_label.toLowerCase()}. ${m.register.short_description}"`
  **Issue:** Composes register_label + short_description; both v1 placeholders. Inherits Rule 2 violations from the register definitions.
  **Fix direction:** Inherits from register-text rewrite. CC-053 candidate.

### 2.3 `lib/loveMap.ts` (post-CC-044-partial)

**STATUS (Rule 1 portion): RESOLVED by CC-059 (2026-05-01).** The 7 `characteristic_distortion` Pauline-trailer leaks and the 2 `short_description` Fi-driver / Ne-driver leaks (loyalist + open_heart) shipped 9 locked plain-language replacements. User-facing string content in `lib/loveMap.ts § LOVE_REGISTERS` is now framework-clean. Inline developer comments preserve canon Pauline references per the Rule 1 carve-out for canon docs and code comments. Rule 2 (generic register / flavor short_descriptions) and Rule 3 (generic distortion across users) for this surface remain open for a future per-user-anchored CC-044-prose follow-on.

#### Rule 2 — Generic register descriptions

- **File:** `lib/loveMap.ts:147-228` (7 love registers, one finding per register)
  **Rule violated:** Rule 2
  **Issue:** Each `LoveRegister` entry's `short_description` is v1 placeholder per the CC-044 spec. Reads generically across users matched to that register. The CC-044 spec itself names CC-044-prose as the queued editorial polish CC.
  **Fix direction:** CC-044-prose (already queued) authors per-user second sentences for each register, keyed to the user's `composes_naturally_with` aux-pair pattern + the user's flavor matches.

- **File:** `lib/loveMap.ts:147-228` (7 `characteristic_distortion` fields)
  **Rule violated:** Rule 1 (Pauline framework reference leak — explicit) + Rule 3 (generic distortion across users)
  **STATUS (Rule 1 portion):** ✅ **RESOLVED by CC-059 (2026-05-01).** All 7 Pauline-trailer references stripped; locked plain-language replacements in place. Rule 3 (generic distortion across users) remains open — a future CC-044-prose may add per-user-anchored variants if browser smoke surfaces the genericness as load-bearing.
  **Current text examples (pre-CC-059):** `"Pair-bond commitment hardening into accountancy ... Pauline diagnostic: keeps no record of wrongs."` — every register's `characteristic_distortion` originally included a literal "Pauline diagnostic:" reference.
  **Post-CC-059:** *"Pair-bond commitment hardening into accountancy — a quiet ledger of who's owed what, who broke faith first, what hasn't been forgiven. The distortion is when love starts keeping books love wasn't meant to keep."* See `docs/canon/love-map.md § CC-059 amendment` for all 7 rewrites.

- **File:** `lib/loveMap.ts:195-205` (`loyalist` + `open_heart` `short_description` framework-name leaks)
  **Rule violated:** Rule 1 (typological codename leak — explicit)
  **STATUS:** ✅ **RESOLVED by CC-059 (2026-05-01).** *"Fi-driver"* / *"Ne-driver"* references stripped from both fields; locked plain-language replacements in place. The aux-pair register's cognitive-function routing stays in canon docs and engine code (the `composes_naturally_with` field on each register), not in user-facing string content.

- **File:** `lib/loveMap.ts:233-272` (7 flavor `short_description` fields)
  **Rule violated:** Rule 2
  **Issue:** Each flavor description is generic across users with that flavor matched. Per CC-044 spec, v1 placeholder; CC-044-prose queued.
  **Fix direction:** CC-044-prose authors per-user second sentence for each flavor when matched, keyed to which signals fired the flavor for this user.

- **File:** `lib/loveMap.ts:455-475` (`generateLoveProse` templates)
  **Rule violated:** Rule 2
  **Issue:** Composite prose composes register_label + short_description + flavor labels — all v1 placeholders.
  **Fix direction:** Inherits from register-text + flavor-text rewrite. CC-044-prose.

### 2.4 `lib/ocean.ts`

#### Rule 1 — Frameworks behind the scenes

- **File:** `lib/ocean.ts:320` (n-elevated case prose) **✅ RESOLVED CC-065 (Rule 1 portion)**
  **Rule violated:** Rule 1
  **Current text:** `"Your distribution shows elevated emotional-reactivity proxies (${d.N}%) — formation, context, or pressure-adaptation signals that often correlate with Big-5 Neuroticism. Treat this as an estimate; the instrument measures these dimensions indirectly rather than asking about them. Outside of Reactivity, your strongest dimension reads as ${topNonNLabel} (${d[topNonN]}%)."`
  **Issue:** **Rule 1 violation** — "Big-5" surfaces in user-facing prose, plus the percentages (`${d.N}%`) anchor the reading to the framework register rather than to behavior.
  **Fix direction:** Reframe per Rule 6 — "Treat this as an estimate" stays (load-bearing), but drop "Big-5 Neuroticism" reference and reframe the percentage anchor to a behavioral cue (e.g., *"Your formation history, current context, and pressure-adaptation signals all weigh moderately toward emotional reactivity..."*). The bar chart still surfaces the percentage; the prose carries behavior.
  **Post-CC-065:** *"Your distribution shows elevated emotional-reactivity proxies (${d.N}%) — formation, context, or pressure-adaptation signals worth treating as an estimate, since the instrument measures this register indirectly rather than asking about it. Outside of Reactivity, your strongest tendency reads as ${topNonNLabel} (${d[topNonN]}%)."* The Rule 1 framework-name leak is closed; the load-bearing "estimated" caveat is preserved in compressed form. The Rule 6 percentage-anchoring portion remains open for the future Rule 6 OCEAN-as-Texture refactor.

- **File:** `lib/ocean.ts:309-313` (single-dominant / two-dominant / balanced case prose)
  **Rule violated:** Rule 6 (OCEAN as texture)
  **Current text:** `"Your strongest disposition reads as ${topLabel} (${d[top]}%). The instrument detects this through patterns across your sacred values, allocation rankings, and lens-block answers — not from any single question."`
  **Issue:** Anchors the read to percentages and to the framework's own architecture ("the instrument detects this through patterns") rather than to behavior. Per Rule 6, OCEAN should compose as texture — "How these tendencies show up in your week" — not as standalone-section prose.
  **Fix direction:** Reframe each case template to a behavioral-anchor register. Single-dominant pattern example: *"Your appetite for ${behavioral-anchor} shows up across the kinds of frames you build, the speed at which you commit, and the way you handle interruption."* Drop the meta-prose about how the model detected it.

- **File:** `lib/ocean.ts:282` (`BUCKET_LABEL` for Neuroticism)
  **Rule violated:** Rule 1 (partial — "(estimated)" parenthetical is load-bearing)
  **Current text:** `N: "Emotional Reactivity (estimated)"`
  **Issue:** Not a Rule 1 violation — the relabel from "Neuroticism" to "Emotional Reactivity (estimated)" is per CC-037 canon, and the parenthetical is load-bearing per the canon doc. Flagged for visibility only.
  **Fix direction:** No change.

### 2.5 `app/components/InnerConstitutionPage.tsx`

#### Rule 1 — Frameworks behind the scenes

- **File:** `app/components/InnerConstitutionPage.tsx:306` (Disposition Map framing paragraph) **✅ RESOLVED CC-065 (Rule 1 portion)**
  **Rule violated:** Rule 1 + Rule 6
  **Current text:** `"Big-5 personality dimensions, derived from how you answered other questions in this instrument. No single answer determines a dimension; the model reads patterns across the full question footprint."`
  **Issue:** **Direct Rule 1 violation** — "Big-5" surfaces as a named framework reference. Plus Rule 6 violation — the framing reads as the report announcing its own personality-test infrastructure rather than weaving disposition into Mirror prose.
  **Fix direction:** Per Rule 6 option (a) — keep the chart, reframe the copy: *"How these tendencies show up in your week"* or similar behavioral framing. Drop "Big-5" entirely; let the chart do the visual work.
  **Post-CC-065:** *"Disposition tendencies, derived from how you answered other questions in this instrument. No single answer determines a tendency; the model reads patterns across the full question footprint."* The Rule 1 framework-name leak is closed. Section structure unchanged; the Rule 6 render-position relocation (Disposition Map → into Mirror layer) remains queued for the future OCEAN-as-Texture CC.

- **File:** `app/components/InnerConstitutionPage.tsx:373` (Work Map framing paragraph)
  **Rule violated:** Rule 1 (weak — "cognitive register, motivational distribution, trait disposition, and value orientation" is descriptive but borders on framework-naming)
  **Current text:** `"Work registers the instrument detects you're structurally aligned to. Derived from your cognitive register, motivational distribution, trait disposition, and value orientation — not from any vocation-specific question..."`
  **Issue:** Directly names four framework-side dimensions (cognitive register = Lens, motivational distribution = Drive, trait disposition = OCEAN, value orientation = Compass). Soft Rule 1 violation; user reads as the instrument explaining its own architecture.
  **Fix direction:** Reframe to behavioral or experiential terms: *"Work registers the instrument detects you're structurally aligned to. Derived from how you process information, what motivates exertion of energy, how you handle pressure, and what you protect — not from any vocation-specific question..."*

- **File:** `app/components/InnerConstitutionPage.tsx:293` (Disposition Map section header)
  **Rule violated:** Rule 6 (the header itself is OK — "Disposition Map" doesn't name OCEAN — but the *section's existence as standalone* is the Rule 6 violation)
  **Current text:** `"Disposition Map"` (mono-uppercase header)
  **Issue:** The label complies with Rule 1 (no framework name). But Rule 6's option (a) decision says the section moves into the Mirror layer, which means this header gets relocated or removed.
  **Fix direction:** Per Rule 6 option (a) — relocate the section's render position into the Mirror layer (after Top 3 Gifts, before the Map opens) and drop the standalone section header. The chart stays as a quiet Mirror-internal visual. **Render-position relocation is queued for CC-055 (three-layer restructure) per the CC-048 spec — not in CC-048 scope.**

### 2.6 `app/components/OceanBars.tsx`

#### Rule 1 — Frameworks behind the scenes

- **File:** `app/components/OceanBars.tsx:66` (aria-label) **✅ RESOLVED CC-065**
  **Rule violated:** Rule 1
  **Current text:** `aria-label="Big-5 disposition distribution: Openness, Conscientiousness, Extraversion, Agreeableness, Emotional Reactivity"`
  **Issue:** "Big-5" appears in the screen-reader aria-label — surfaces to users with assistive technology.
  **Fix direction:** Replace with framework-free aria-label: *"Disposition distribution: Openness, Conscientiousness, Extraversion, Agreeableness, Emotional Reactivity"*.
  **Post-CC-065:** Locked rewrite shipped verbatim per fix direction.

### 2.7 Cross-cutting / structural absences

#### Rule 5 — Uncomfortable-but-true sentence

**STATUS: RESOLVED by CC-058 (2026-05-01).** The selector function `getUncomfortableButTrue(constitution, ctx)` in `lib/identityEngine.ts` composes one of 8 locked sentences keyed by tension class (context_vs_authority / pattern_vs_translation / claim_vs_allocation / conviction_vs_rigidity / builder_vs_pause / caretaker_vs_self / action_vs_direction / stewardship_vs_stagnation), or returns `null` (silent — render no slot) when no condition matches. **Silence is the canonical fallback;** the report ships no generic-fallback sentence rather than risk a horoscope reading. Wired into `MirrorOutput.uncomfortableButTrue?: string | null`; rendered in `app/components/MirrorSection.tsx` immediately after the golden sentence (italic + ink-mute) and in `lib/renderMirror.ts` as an italic-wrapped paragraph in the markdown export. Joined to the polish layer's `lockedAnchors` array via `buildEngineRenderedReport` so the sentence survives Path C polish round-trips verbatim. See `docs/canon/result-writing-canon.md § Rule 5 § CC-058 amendment` for the 8 locked sentences + tone register canon.
*CODEX-058b workshop fix (2026-05-01) — dropped `gift_category` gates from 6 of 8 conditions to fix a selector miss surfaced in CC-058's ship-report. Locked sentences unchanged.*
*CODEX-062 contract fix (2026-05-01) — closed the polish-layer anchor-extraction gap surfaced in CC-060's ship report by pushing fired tension `user_prompt` strings and any uncovered locked anchor surfaces into `lockedAnchors[]`; Peace/Faith remains protected via `lockedDisambiguation` and cross-card synthesis prose via `proseSlots` / locked anchors as wired in the contract.*

- **File:** structural absence (no current code surface emits this)
  **Rule violated:** Rule 5
  **Issue:** The instrument has no slot that emits a per-user uncomfortable-but-true observation. Per Clarence's 2026-04-29 calibration: the closest existing approach is the growth-edge section, but those phrases are too reusable to register as personal correction.
  **Fix direction:** **CC-053 candidate** (queued in the prose-rewrite track per the canon's Rule 5 scope-of-application). Author a new structural slot in the Mirror layer adjacent to the golden sentence ("Your gift is the long read. Your danger is believing it too early"). Composition logic: read the user's strongest aspiration-vs-current tension (via agency.aspiration vs agency.current, or top-Compass-value vs lived-allocation gap, or top-conviction-temperature vs adapts_under_*) and compose a per-user uncomfortable-but-true sentence keyed to that tension. Examples per Clarence: *"You can confuse having absorbed more context with having earned more authority to conclude"* / *"You sometimes treat translation as optional because the pattern feels obvious to you."*

#### Rule 7 — Display name vs narrative name separation

- **File:** `lib/identityEngine.ts § getUserName` (CC-047 implementation)
  **Rule violated:** Rule 7 (verification only)
  **Issue:** CC-047 implements the username-pattern fallback — when a user's name matches the username pattern (digit suffix, underscore, all-lowercase), prose falls back to "you" / "your" rather than the third-person possessive. CC-048 verifies the rule applies across every prose surface.
  **Fix direction:** **No code change needed** if CC-047 shipped correctly. Audit verifies no remaining literal-username-as-name uses. The audit found no Rule 7 violations in the surfaces walked — the `${possessive}` interpolations in cross-card synthesis (e.g., `lib/identityEngine.ts:4374` Builder ↔ Maintenance prose) read through `getUserName`'s fallback logic per CC-047. **Confirmed adherent.**

#### Rule 10 — Peace disambiguation

Already covered in §2.1 under deriveCompassOutput. Single finding.

---

## 3. Aggregated rule-violation counts

| Rule | Count | Surfaces |
|---|---|---|
| Rule 1 (frameworks behind the scenes) | 6 (loveMap 7 + 2 ✅ RESOLVED CC-059; others open) | identityEngine 1 weak, ocean 2, loveMap 7 Pauline + 2 typological-codename ✅ RESOLVED CC-059, InnerConstitutionPage 3, OceanBars 1 |
| Rule 2 (generic gifts) | 32 (12 resolved CC-052; 20 open) | identityEngine GIFT_DESCRIPTION 12 ✅ RESOLVED CC-052, THESIS_FALLBACK 8, THESIS_TEMPLATES 1 cluster, GIFT_DANGER_LINES 1 cluster, cross-card 1 cluster, workMap 9, loveMap 14 |
| Rule 3 (generic growth edges) | 38 (24 ✅ RESOLVED CC-061; 14 open) | identityEngine GROWTH_EDGE_TEXT 12 ✅ RESOLVED CC-061, BLIND_SPOT_TEXT_VARIANTS 12 ✅ RESOLVED CC-061, SHAPE_CARD_PRACTICE_TEXT 8, GIFT_DANGER_LINES 6 |
| Rule 4 (allocation gap) | 3 (T-013, T-014, T-015 ✅ RESOLVED CC-060; Builder ↔ Maintenance separate surface) | identityEngine T-013, T-014, T-015 ✅ RESOLVED CC-060 via getAllocationSharpQuestion + 12 bucket-keyed locked templates; Builder ↔ Maintenance partial-adherent stays as-is (different surface) |
| Rule 5 (uncomfortable-but-true) | 1 (✅ RESOLVED CC-058) | structural absence — `getUncomfortableButTrue` selector + 8 locked candidate sentences shipped via CC-058; silence (null) is canonical fallback when no condition matches |
| Rule 6 (OCEAN as texture) | 11 | ocean prose 4, InnerConstitutionPage Disposition section 4, OceanBars 1, loveMap framing 1, workMap framing 1 |
| Rule 7 (display name vs narrative) | 0 | CC-047 verified adherent |
| Rule 8 (trust nuance) | 3 (1 ✅ RESOLVED CC-063 cardHeader; 2 open body-prose) | identityEngine deriveTrustOutput 3 — cardHeader (line 2911) ✅ RESOLVED CC-063 via 4-case conditional-framing composition; body-prose findings (line 2919, 2931) remain open |
| Rule 9 (responsibility nuance) | 3 (1 ✅ RESOLVED CC-063 cardHeader; 2 open body-prose) | identityEngine deriveGravityOutput 3 — cardHeader (line 2858) ✅ RESOLVED CC-063 via locked accountable-actor framing; body-prose findings (line 2867, 2877) remain open |
| Rule 10 (peace disambiguation) | 2 (✅ RESOLVED CC-054) | identityEngine deriveCompassOutput 2 — `getPeaceRegister` composes 4 locked Peace prose templates from cross-signals; faith_priority gets a parallel two-layer Shape + Texture treatment in the same CC under new Rule 11 |

**Total: 99 unique findings + 63 cluster-roll-up items = 162.** (Rule 2 / Rule 3 entries that group across a single map are listed once with the per-entry expansion described in the fix direction.)

**Top three most frequent rule violations:**

1. **Rule 3 (generic growth edges) — 38 findings** — clusters on `GROWTH_EDGE_TEXT`, `BLIND_SPOT_TEXT_VARIANTS`, `SHAPE_CARD_PRACTICE_TEXT`, `GIFT_DANGER_LINES`. Largest cluster.
2. **Rule 2 (generic gifts) — 32 findings** — clusters on `GIFT_DESCRIPTION`, `THESIS_TEMPLATES` / `THESIS_FALLBACK_BY_FUNCTION`, workMap / loveMap register descriptions. Second-largest.
3. **Rule 6 (OCEAN as texture) — 11 findings** — clusters on `generateOceanProse` + InnerConstitutionPage Disposition Map section + OceanBars aria-label. Cross-surface but smaller per-finding count.

**Top three surfaces with most flagged findings:**

1. `lib/identityEngine.ts` — 118 findings (expected; carries the bulk of the prose register).
2. `lib/loveMap.ts` — 21 findings (post-CC-044-partial; CC-044-prose absorbs most).
3. `lib/workMap.ts` — 10 findings (CC-053 candidate cluster).

---

## 4. Suggested CC sequencing for the prose-rewrite track

The audit findings cluster naturally into rewrite CCs that take a single rule × surface subset and author per-user-specific replacements. Recommended sequencing:

| CC | Scope | Rule(s) | Surfaces | Approximate findings |
|---|---|---|---|---|
| **CC-049** | Gift Specificity Rewrite — `GIFT_DESCRIPTION` 12 entries get per-user signal-anchored second sentences | Rule 2 | `lib/identityEngine.ts:2565-2578` | 12 |
| **CC-050** | Allocation Gap 3C's Rewrite — T-013 + T-014 user_prompt strings get per-bucket sharp questions | Rule 4 | `lib/identityEngine.ts:847,898` | 2 (high-impact) |
| **CC-051** | Growth Edge + Blind Spot Specificity — `GROWTH_EDGE_TEXT` + `BLIND_SPOT_TEXT_VARIANTS` get per-user signal-anchored second sentences ✅ **RESOLVED CC-061 (2026-05-01)**; CODEX-061b strips the dead growth-edge half and preserves the live blind-spot composition path | Rule 3 | `lib/identityEngine.ts:2580-2593, 2488-2535` | 24 |
| **CC-052** | Trust + Responsibility Conditional Framing — Trust card cardHeader + giftText, Gravity card cardHeader + giftText rewritten to conditional framing | Rule 8 + Rule 9 | `lib/identityEngine.ts:2858-2867, 2911-2919` | 6 |
| **CC-053** | Mirror Layer Uncomfortable-but-True Slot — new structural slot adjacent to golden sentence; per-user composition from strongest aspiration-vs-current tension | Rule 5 | `lib/identityEngine.ts` (new function) + `lib/types.ts` (MirrorOutput extension) + `app/components/MirrorSection.tsx` (render slot) | 1 (high-effort, structural) |
| **CC-054** | Peace Disambiguation — when peace_priority in Compass top, compose cross-signal interpretation | Rule 10 | `lib/identityEngine.ts:2726, 2735` (deriveCompassOutput) | 2 |
| **CC-055** | OCEAN-as-Texture Refactor — Disposition Map relocates into Mirror layer with reframed copy; `generateOceanProse` 4 case templates rewritten to behavioral register; OceanBars aria-label dropped | Rule 6 + Rule 1 | `app/components/InnerConstitutionPage.tsx`, `lib/ocean.ts:297-326`, `app/components/OceanBars.tsx:66` | 11 |
| **CC-044-prose** | Love Map editorial polish — strip Pauline references from `characteristic_distortion`, author per-user second sentences for register short_descriptions and flavor descriptions | Rule 1 (Pauline) + Rule 2 + Rule 3 | `lib/loveMap.ts` | 14-21 |
| **CC-053b** *(if needed)* | Work Map editorial polish — register short_description per-user second sentences | Rule 2 | `lib/workMap.ts` | 9 |

**Sequencing rationale:**

- CC-049 first because `GIFT_DESCRIPTION` is consumed by every per-card derivation; the rewrite cascades through the rest of the prose without separate per-card edits.
- CC-050 second because the allocation gap is one of the report's strongest behavioral mirrors (per Jason 2026-04-29 calibration) and the current prose actively undermines its differentiator status.
- CC-051 third — `GROWTH_EDGE_TEXT` + `BLIND_SPOT_TEXT_VARIANTS` are the largest cluster; rewriting them locks in the user-specific discipline across all eight ShapeCards.
- CC-052 fourth — Trust and Gravity prose touch the user's structural-thinking dimension; getting the conditional framing right protects the report from making the user sound naive (Trust) or reductionist (Gravity).
- CC-053 fifth — new structural slot; high-effort because it requires a `MirrorOutput` type extension, a new composer function, and render wiring. Defer until after the cleaner-CC rewrites land.
- CC-054 sixth — Peace disambiguation is narrow but the 2026-04-29 user calibration explicitly flagged it; the canon Rule 10 has the cross-signal pattern locked.
- CC-055 last for the prose-rewrite track because OCEAN render-position relocation is part of the broader three-layer restructure (Mirror / Map / Path reorganization) per the CC-048 spec out-of-scope note.
- **CC-044-prose** runs in parallel with the rewrite track since it's already queued as the editorial-polish CC for Love Map. Recommend running it after CC-049 ships so the gift-specificity discipline is canon when Love Map's per-user prose gets authored.

---

## 5. Out-of-scope drift caught

Considered and rejected during the audit walk:

- **Rewriting any flagged prose template.** Held to the CC-048 audit-only scope. Every entry has a fix direction; none has a rewrite.
- **Authoring the new Rule 5 uncomfortable-but-true slot in this CC.** Deferred to CC-053. The audit notes the structural absence with a fix direction; the implementation is its own CC.
- **Auditing surfaces not on the listed-surfaces list.** `lib/beliefHeuristics.ts`, `lib/renderMirror.ts` (markdown export), and the `MirrorSection.tsx` component-level prose composition were not deeply audited. Noted in the closing-section "potential further surfaces" below.
- **Editing CC-047's `getUserName` implementation.** Rule 7 verification confirmed CC-047 is adherent; no follow-on work in CC-048.
- **Restructuring the report's layered architecture (Mirror / Map / Path).** That's CC-055 territory per the canon spec.
- **Modifying Disposition Map render position before the canon settles.** Rule 6 specifies option (a) — keep chart, reframe copy. Implementation is CC-055.

## 6. Potential further surfaces (not deeply audited)

- `lib/beliefHeuristics.ts` — Keystone Reflection prose. Rule 8 / Rule 9 may apply; needs a focused pass.
- `lib/renderMirror.ts` — Markdown export composition. Should mirror the report's prose register; if rewrites land in `lib/identityEngine.ts`, the markdown export will inherit. Verify after CC-049 / CC-050 ship that drift hasn't accumulated.
- `app/components/MirrorSection.tsx` — Component-level prose composition for top-of-report Mirror render. Likely thin (most prose flows from `MirrorOutput` which is composed in identityEngine), but verify when CC-053 lands its new Rule 5 slot.
- Per-card derivation prose for Lens, Conviction, Weather, Fire, Path — only Compass / Gravity / Trust were deeply walked in §2.1 (those carried Rule 8 / Rule 9 / Rule 10 specific flags). The other four cards inherit Rule 2 / Rule 3 violations from `GIFT_DESCRIPTION` + `GROWTH_EDGE_TEXT` + `BLIND_SPOT_TEXT_VARIANTS` and will be addressed by CC-049 / CC-051 cascade.

## 7. Rules that landed less precisely than the locked content

The ten rules ship verbatim as locked. During the audit, two adjacencies surfaced that may be worth post-ship workshop:

- **Rule 6's option (a) decision** — keep chart, reframe copy — is locked in the canon. The audit revealed that the `(estimated)` parenthetical on the N bar is load-bearing per CC-037 canon. The CC-055 implementer should preserve the parenthetical when reframing the surrounding copy.
- **Rule 1's "Pauline framing" inclusion** caught a real Love Map violation (the `characteristic_distortion` "Pauline diagnostic:" prefix). The rule is correctly scoped — Pauline informs canon, not user-facing prose — but the CC-044 spec's own out-of-scope rule already named this. The audit's contribution is the file:line citation for the rewrite CC.
- **Rule 2 / Rule 3's "12 entries" claim** matches `GIFT_DESCRIPTION` + `GROWTH_EDGE_TEXT` exactly (12 GiftCategory entries each). `BLIND_SPOT_TEXT_VARIANTS` also has 12 entries (one per category) but with multi-variant pools internally. The canon's "12 entries" rounding is canon-accurate at the GiftCategory level.

No rule was found to require revision; surface for editorial workshop only.

---

## Bridge to the rewrite track

The audit consolidates 162 findings into nine recommended rewrite CCs. The rewrite track's discipline is to author per-user-specific replacements that read against the locked canon, not to re-derive the canon per CC. Each rewrite CC inherits this audit's findings clustered by rule × surface and authors the replacement prose with per-user signal anchoring.

CC-049 is the recommended first rewrite CC (Gift Specificity Rewrite — `GIFT_DESCRIPTION` × Rule 2). It's the load-bearing input to the rest of the per-card prose; landing it first cascades the discipline through subsequent rewrites with less per-CC scope drift.

---

## Path C resolution (post-audit, 2026-04-30)

Clarence's post-CC-052 review surfaced a humanity-texture gap not directly addressable by the rewrite-track rules: even after Rule 2-10 closure, the report stays structurally accurate but aesthetically thin (missing humor / family attachment / grief / beauty / lived absurdity). The audit acknowledges this gap but does not propose an audit-rule fix because the missing texture isn't a structural-accuracy defect — it's a register the survey doesn't measure by design.

Resolution: **Path C — Humanity Rendering Layer.** A downstream LLM polish stage adds texture on top of engine-rendered prose. The split is canonical (engine owns substance; polish owns texture). See `docs/canon/humanity-rendering-layer.md` (locked via CC-057a) for the architectural canon. Implementation lands in CC-057b.

The rewrite-track rules in this audit remain authoritative for the engine layer. The polish layer composes against them; it does not relax them.
