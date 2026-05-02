# Work Map Framework (CC-042)

## Why this framework exists

The instrument already measures every component of vocational fit at high resolution: the Lens aux-pair register names the cognitive style; the Drive distribution names what motivates the exertion of energy; the OCEAN distribution names trait disposition; Q-E1 names where energy actually flows; Compass + concrete stakes name what is at stake; Q-Ambition1 names what success looks like; Path agency aspiration names whether the present is composing with the aspirational register. The composite read across these seven discriminates vocational fit without any new survey questions.

Per the project's standing rule (`feedback_minimal_questions_maximum_output`): *derive new dimensions from existing signals before adding survey questions*. CC-042 is derivation only. No new measurement surface; the instrument's question footprint is unchanged.

The Work Map is also the first of three sibling outputs Jason has named: **Work / Love / Giving**. Each maps the user's composite read onto a purpose-domain. CC-042 builds the architecture; CC-043 (Love Map) and CC-044 (Giving Map) follow with parallel structures.

---

## The 8 work registers

Each register has six fields:

| Field | Type | Notes |
|---|---|---|
| `register_key` | `WorkRegisterKey` | Canonical, locks at CC-042. |
| `register_label` | string | v1 placeholder; workshop material. |
| `short_description` | string | v1 placeholder; workshop material. |
| `example_anchors` | `string[]` | 2–3 specific vocations / hobbies / skills; grounding handholds, not exhaustive. v1 placeholders. |
| `composes_naturally_with` | `FunctionPairKey[]` | Aux-pair registers that often land here. v1 placeholders subject to workshop refinement. |
| (predicate) | `(WorkMapInputs) => number` | Composite-fit score in 0..1; input structure is locked, internal weighting is workshop-tunable. |

### Register definitions

#### 1. Strategic / Architectural
- **Description:** Work that requires holding the long arc and building the structure to realize it. Time horizons matter; the work compounds across years rather than weeks.
- **Composes with:** NiTe (architect), TeNi (strategist), TiNe (questioner) when system-responsibility ranks high.
- **Predicate intent:** Lens register in {NiTe, TeNi, TiNe} AND (Drive cost-leaning OR creator-aspiration) AND OCEAN.O > 18% AND OCEAN.C > 18%.
- **Anchors:** research lab leadership / R&D direction; strategic planning, architectural practice; founder roles, academic department leadership.

#### 2. Analytical / Investigative
- **Description:** Work that rewards precision-thinking and the discipline of testing what is actually claimed. The texture is depth-of-understanding, not breadth-of-output.
- **Composes with:** TiNe (questioner), TiSe (troubleshooter), NeTi (prober), SiTe (keeper) when truth/knowledge ranks high.
- **Predicate intent:** Lens register in {TiNe, TiSe, NeTi, SiTe} OR (driver in {ti, ni}) AND (truth_priority OR knowledge_priority in Compass top 3) AND OCEAN.O > 18%.
- **Anchors:** research scientist, data analyst; investigative journalist, archivist; technical writer.

#### 3. Embodied Craft
- **Description:** Work that lives in the body — skill expressed through hands, presence, timing, contact. The framework is internalized; the doing is precise because the body knows.
- **Composes with:** SeTi (surgeon), SeFi (artist), TiSe (troubleshooter).
- **Predicate intent:** Lens register in {SeTi, SeFi, TiSe} AND (building/restoring/solving energy fires) AND OCEAN.C > 18%.
- **Anchors:** surgeon, technician, master craftsperson; performer / athlete; chef, instrument-maker.

#### 4. Caring / Direct-Service
- **Description:** Work that lives in attending to people in concrete need. The texture is presence with another's experience; the reward is the relational continuity itself.
- **Composes with:** FiSe (witness), FeSi (kinkeeper), SeFi (artist) when caring_energy ranks high.
- **Predicate intent:** Lens has Fi or Fe as driver or instrument AND Drive coverage-leaning AND caring_energy fires AND (compassion OR family in Compass top 3) AND OCEAN.A > 22%.
- **Anchors:** nurse, hospice worker, social worker; therapist, counselor; teacher, midwife, hospice chaplain.

#### 5. Pastoral / Counselor
- **Description:** Work that holds an unhurried sense of who someone is becoming and tends that becoming through patient relational presence. Long-arc relational, not direct-care urgent.
- **Composes with:** NiFe (seer), FeNi (pastor), FiNe (imaginer).
- **Predicate intent:** Lens register in {NiFe, FeNi, FiNe} AND Drive coverage-leaning AND (faith OR mercy OR family in Compass top 3) AND OCEAN.A > 18% AND (legacy OR success in Q-Ambition1).
- **Anchors:** psychotherapist, spiritual director; coach, mentor, advisor; clergy, pastoral counselor.

#### 6. Civic / Advocacy
- **Description:** Work that names what is owed and protects those who can't protect themselves. Values-driven public action; the texture is structural-ethical.
- **Composes with:** FiNe (imaginer), FeNi (pastor), NeFi (catalyst), TiNe (questioner) when justice ranks high.
- **Predicate intent:** justice_priority in Compass top 3 AND (individual_responsibility AND system_responsibility) in Gravity AND (Drive coverage-leaning OR balanced).
- **Anchors:** lawyer (public-interest, civil rights); activist, organizer, nonprofit leadership; public servant, policy advisor.

#### 7. Generative / Creative
- **Description:** Work that turns possibilities into invitations. The texture is values-as-expression; the gift is naming what could become true so others can see it.
- **Composes with:** NeFi (catalyst), FiNe (imaginer), SeFi (artist), NeTi (prober) when learning/enjoying energy ranks high.
- **Predicate intent:** Lens has Ne or Fi as driver or instrument AND OCEAN.O > 22% AND (learning_energy OR enjoying_energy fires); Drive intentionally weak (creative work can be cost- or coverage-leaning).
- **Anchors:** writer, artist, designer; teacher (creative subjects), filmmaker; marketing/brand, copywriter, performer.

#### 8. Operational / Stewardship
- **Description:** Work that keeps systems running through standards, precedent, duty, and operational trust. The texture is reliability over years; the gift is making the institution continue to work.
- **Composes with:** TeSi (operator), SiTe (keeper), SiFe (family-tender).
- **Predicate intent:** Lens register in {TeSi, SiTe, SiFe} AND OCEAN.C > 22% AND (stability OR honor in Compass top 3) AND (restoring_energy OR solving_energy fires).
- **Anchors:** operations management, COO; institutional administration; military / police leadership, project / program management.

---

## The matching algorithm

`computeWorkMapOutput` scores each of the 8 registers against the user via its composite predicate, sorts by score, and applies a threshold ladder:

| Threshold | Action |
|---|---|
| Top score > **0.7** (`TOP_ONE_SCORE_THRESHOLD`) | Single match — the read is tight enough to surface alone. |
| Top two each > **0.5** (`TOP_TWO_FLOOR_THRESHOLD`) | Two matches — surfaces the register *spread* without fragmenting into a horoscope. |
| Top score > **0.4** (`SINGLE_WEAK_MATCH_THRESHOLD`) | Single weak match — preserves a directional read for users with thin signal. |
| Otherwise | Returns `undefined`; the page section silently omits. |

The thresholds are exported as named constants in `lib/workMap.ts` so future tuning is visible. v1 values are starting points; post-browser-smoke refinement happens in a successor CC.

The Work Map renders 1–2 matches, never all 8. The user should land on a tight register read, not a horoscope spread.

---

## Composite predicate inputs

Each predicate composes from the same input bundle:

- **Lens aux-pair register** — driver/instrument identity; pair-key membership in the register's `composes_naturally_with` list.
- **Drive distribution** — cost-leaning, coverage-leaning, compliance-leaning, or balanced (max-min spread ≤ 12pp).
- **OCEAN distribution** — soft ramps over O / C / E / A / N percentages so small movements in trait disposition produce small movements in score.
- **Q-E1 energy allocation** — outward (building / solving / restoring) vs inward (caring / learning / enjoying).
- **Compass values + concrete stakes** — top-3 ranking presence checks against truth / knowledge / justice / faith / mercy / family / stability / honor / compassion.
- **Q-Ambition1** — success / fame / wealth / legacy presence checks.
- **Path agency aspiration** — creator / relational / stability / exploration; passed through from `inferAgencyPattern`.

Predicates combine boolean gates (Lens membership, agency aspiration) with normalized soft ramps (`ramp(value, floor, ceiling)`). The `ramp` helper keeps scores continuous so unusual distributions don't fall off cliffs.

---

## Render position

A new page section labeled **"Work Map"** rendered after the Disposition Map (which sits between Mirror and Map per CC-037). New sequence: *Mirror → Disposition Map → **Work Map** → Map → ...*

**Not a ShapeCard.** ShapeCards have a 4-section architecture (Strength / Growth Edge / Practice / Pattern Note) and a body-part metaphor; Work Map is a cross-cutting derivation that doesn't fit either schema. The page-section register matches Disposition Map and the existing Growth Path / Conflict Translation / Mirror-Types Seed sections at page bottom.

The section contains:

1. Mono-uppercase section header: **"Work Map"**.
2. One-paragraph framing: *"Work registers the instrument detects you're structurally aligned to. Derived from your cognitive register, motivational distribution, trait disposition, and value orientation — not from any vocation-specific question. These are categories of work that will come easy and feel meaningful, not prescriptions."*
3. `<WorkMap />` rendering 1–2 matched registers with label / description / italic anchors line.
4. Composite-prose paragraph (single match: register quote; dual match: register-spread framing).
5. Footnote: *"Work Map is a derivation, not a recommendation. It names registers your existing answers point toward; it doesn't account for training, geographic constraints, or life-stage tradeoffs you bring to any career decision."*

The render layer guards on `constitution.workMap` presence and `matches.length > 0` — pre-CC-042 saved sessions don't have the field, and `computeWorkMapOutput` returns `undefined` when no register fires above the floor. The Work Map section silently skips render in either case.

---

## Editorial policy

- The 8 register identities (`register_key`) and the predicate-input structure are canonical at CC-042. They lock with this CC.
- Register labels, descriptions, anchors, and `composes_naturally_with` lists are **v1 placeholders** subject to a future workshop CC. If a label reads obviously off in browser smoke (e.g., "Caring / Direct-Service" feels too clinical), surface as a workshop question rather than silently rewriting.
- The `example_anchors` field is the load-bearing user-facing content for grounding. Each anchor names a recognizable vocation/role/skill. Anchors are illustrative, not exhaustive — the framing paragraph and footnote both reinforce the derivation-not-prescription register.
- The "Work Map" section header and "Work Map" page-section label are canonical for the page-section register established by Disposition Map.
- Predicate weights inside `lib/workMap.ts` (the `* 0.35`, `* 0.25` coefficients) are workshop-tunable. The *intent* of each predicate is locked; the implementation choice is open.

---

## Sibling outputs (CC-043, CC-044)

The Work Map is the first of three siblings:

- **CC-042 — Work Map.** Derivation over the seven inputs above; 8 register taxonomy.
- **CC-043 — Love Map.** Sibling architecture, different predicate inputs (likely emphasizes A, family/loyalty/peace values, partner_trust, family_trust, caring_energy, close_relationships_stakes), different register taxonomy (relational categories: long-form partnership / chosen-family / community-rooted / parent-anchor / etc.).
- **CC-044 — Giving Map.** Sibling architecture, different predicate inputs (likely emphasizes coverage-Drive, nonprofits_trust, social_spending, nonprofits_religious_spending, justice/mercy/compassion values), different register taxonomy (giving categories: time-investment / financial-investment / institutional / direct / advocacy / etc.).

If during execution of a sibling CC an architectural decision should generalize across all three, surface as a refactor proposal rather than committing to the generalization in the sibling CC. The pattern (8 registers, composite predicate, top-1-vs-top-2 thresholds, page section between adjacent registers) is the canonical scaffold; per-domain register identities and predicate inputs are sibling-specific.

---

## Implementation surfaces

| Canonical rule | Code-level surface |
|---|---|
| 8 register taxonomy + types | `lib/types.ts` (`WorkRegisterKey`, `WorkRegister`, `WorkMapMatch`, `WorkMapOutput`); `InnerConstitution.workMap?: WorkMapOutput` |
| Register definitions (labels, anchors, composes_naturally_with) | `lib/workMap.ts § WORK_REGISTERS` |
| Composite predicates | `lib/workMap.ts § PREDICATES` |
| Threshold constants | `lib/workMap.ts § TOP_ONE_SCORE_THRESHOLD / TOP_TWO_FLOOR_THRESHOLD / SINGLE_WEAK_MATCH_THRESHOLD` |
| Distribution + matcher + prose | `lib/workMap.ts` (`computeWorkMapOutput`, `generateWorkProse`) |
| Page-section render | `app/components/WorkMap.tsx` |
| Page assembly | `app/components/InnerConstitutionPage.tsx` (between Disposition Map and Map) |
| Engine pipeline | `lib/identityEngine.ts § buildInnerConstitution` (post-OCEAN call site) |

---

## Open questions for future tuning

- **Predicate-weight calibration.** v1 weights (e.g., `lensFit * 0.35 + driveFit * 0.25 + ...`) are starting points. Browser smoke may reveal that one component dominates or is under-weighted; surface as a tuning CC.
- **Register-overlap gradient.** The Strategic / Analytical / Pastoral registers all benefit from high O. If multiple registers consistently fire above 0.7 for the same user, the matcher returns the top-1; the second register may be obscured even when it's also a real fit. Consider whether top-2 should fire when both score above 0.7.
- **Workshop refinement of labels and anchors.** The v1 register labels and example anchors will receive editorial workshop attention post-browser-smoke. Track which labels read off-tone in real sessions.
- **Aspirational dimension.** A future CC could compose a "work-as-aspiration vs work-as-current" tension that compares the user's current vocation register (asked? not in v1) vs the Work Map's matched register. Out of v1 scope; not in CC-042.
- **Markdown export wiring.** The Work Map is not yet wired into `lib/renderMirror.ts` for the markdown-export surface. Future fix-CC if drift accumulates (per the CC-041 pattern for Drive).
