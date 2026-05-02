# CC-054 — Peace + Faith Disambiguation (Cross-Signal Interpretation)

**Type:** Editorial rewrite landing in code. Cross-signal interpretation rules that disambiguate Peace and Faith in user-facing prose without adding any new questions or signals. Implements **Rule 10 (Peace Disambiguation)** from CC-048's audit and a **new Faith Composite rule** surfaced in Clarence's post-CC-052 review.
**Goal:** Stop `peace_priority` and `faith_priority` from rendering as flat single-register values. Each carries multiple distinct meanings per user; the engine composes the user's specific meaning from cross-signal patterns. Peace gets 4 register disambiguation (moral / structural / relational / surface). Faith gets a two-layer architecture: **Shape** (a composite read across Q-C4 attribution + Q-X3 institutional trust + Q-X4 personal trust naming *what kind of faith* operates) plus **Texture** (5 cross-signal-derived registers naming *how faith operates*: moral architecture / resistance to nihilism / hope in reconciliation / living tension / institutional loyalty).
**Predecessors:** CC-048 (audit codified Rule 10 — Peace disambiguation as the canonical resolution for the value's overload). Clarence's post-CC-052 review (2026-04-30 — surfaced that Faith is better understood as a composite read across multiple measurement surfaces, not as a single Compass value with internal flavors). Memory: `feedback_peace_and_faith_disambiguation.md` carries the full register splits and architectural rationale.
**Successor:** None hard-blocked. The disambiguation pattern this CC establishes (cross-signal interpretation in prose, framework-names-canon-only, silent-unless-ranked-top) extends naturally to other ambiguous Compass values (`loyalty_priority` — to-whom-for-what; `freedom_priority` — autonomy-from-what; etc.) when they're flagged for similar treatment.

---

## Why this CC

CC-048's audit found Rule 10 (Peace disambiguation) as a candidate violation: `peace_priority` ranks high for users who mean radically different things by it — moral coherence, structural order, relational harmony, conflict avoidance. Without disambiguation, the report flattens these into a single read and misses the user.

Clarence's post-CC-052 review of Jason0429's re-rendered report extended the same critique to Faith: the report treats `faith_priority` as a stable value, but real faith varies on *what the user has faith in* (supernatural / individual / system / authority / nature) AND *how faith operates* (moral architecture / resistance to nihilism / hope / living tension / institutional loyalty). The instrument already measures both axes — it just doesn't compose them into the user's faith-prose.

The architectural pattern is shared: both values disambiguate via cross-signal interpretation in the prose layer, not via question rewrite. The minimal-questions canon (`feedback_minimal_questions_maximum_output.md`) is preserved.

This CC bundles both because they share the implementation surface (Compass card prose composition), the architectural pattern (cross-signal interpretation), and the canon principle (framework names canon-only; user prose plain-language; silent unless ranked top).

---

## Scope

Files modified:

1. `lib/identityEngine.ts` — add three new helper functions + wire them into `deriveCompassOutput`:
   - `getPeaceRegister(topCompass, agency, weather, fire, signals)` → returns one of 4 Peace prose strings (or `null` if peace_priority not in top 5).
   - `getFaithShape(topCompass, signals, answers)` → returns the Faith Shape prose string composing Q-C4 + Q-X3 + Q-X4 reads (or `null` if faith_priority not in top 5).
   - `getFaithTexture(topCompass, signals)` → returns the Faith Texture prose string (1-2 of 5 registers; or `null` if faith_priority not in top 5).
   - `composeFaithProse` helper that joins Shape + Texture with smooth transition prose.
   - Compass output extended to include optional `peace_register_prose` and `faith_register_prose` fields.

2. `app/components/MapSection.tsx` (or wherever Compass card body renders) — render the disambiguation prose in the expanded Compass card's body, positioned after the existing Strength block. New optional content; if `null` (value not ranked top), no rendering — silent.

3. `docs/canon/result-writing-canon.md` — append CC-054 amendment paragraph under § Rule 10 (mark resolved) and add a new § Faith Composite Disambiguation rule documenting the two-layer Shape + Texture architecture.

4. `docs/audits/report-calibration-audit-2026-04-29.md` — mark Rule 10 (Peace disambiguation) as RESOLVED by CC-054. Note new Faith rule.

5. `docs/canon/signal-library.md` — light addition documenting that `peace_priority` and `faith_priority` are *composite-read* signals: their user-facing prose composes with cross-signals rather than rendering verbatim.

Nothing else. Specifically:

- **No new questions.** Q-C4 (responsibility attribution), Q-X3 (institutional trust), Q-X4 (personal trust) are already measured.
- **No new signals.** All cross-signals referenced exist today.
- **No engine logic changes** beyond the three new helpers.
- **No tagging-table changes.** No additions to `SIGNAL_DRIVE_TAGS` or `SIGNAL_OCEAN_TAGS`.
- **No question text changes.** Q-S1 / Q-S2 stay as-is; users still rank "Peace" and "Faith" without subtype prompts.
- **No edits to the existing Compass strength / growth-edge / pattern-note prose.** The disambiguation lands as new prose adjacent to existing prose, not replacing it.
- **No edits to other ambiguous Compass values** (loyalty_priority, freedom_priority, etc.). Future CC if needed; this one is Peace + Faith only.

---

## The locked content — Peace registers (4)

Selection logic: read `peace_priority` rank in Compass top 5. If not in top 5, return `null` (silent). Otherwise, walk the 4 register conditions in priority order; first match wins.

### 1. Moral peace

**Condition:** `peace_priority` in top 5 AND (`truth_priority` in top 5 OR `knowledge_priority` in top 5 OR `honor_priority` in top 5) AND `fire.willingToBearCost` is true.

**Locked prose:**

> *"You named Peace among your most sacred values — and your other rankings suggest you mean it in the metaphysical / moral register rather than the conflict-avoidance register. Truth and Honor compose with Peace in your top values, and your willingness to bear cost suggests you'd disturb surface ease to protect durable order. For your shape, peace is what comfort sometimes obstructs."*

### 2. Structural peace

**Condition:** `peace_priority` in top 5 AND (`system_responsibility_priority` ranks ≤ 2 in Q-C4 OR `restoring_energy_priority` rank ≤ 2 in Q-E1 OR `stability_priority` in top 5).

**Locked prose:**

> *"You named Peace among your most sacred values — and your other rankings suggest you mean it as durable structural order rather than surface calm. Your attribution patterns favor system-level fixes; your energy register leans toward restoring; stability ranks high. For your shape, peace is the result of fixing the system so recurring conflict stops, not avoiding the recurring conflict."*

### 3. Relational peace

**Condition:** `peace_priority` in top 5 AND (`family_priority` in top 5 OR `caring_energy_priority` rank ≤ 2 in Q-E1 OR `close_relationships_stakes_priority` rank ≤ 2 in Q-Stakes1).

**Locked prose:**

> *"You named Peace among your most sacred values — and your other rankings suggest you mean it as preserved bonds rather than absent conflict. Family ranks high in your sacred values; your caring energy is invested; close relationships sit at the top of what you'd hate to lose. For your shape, peace is the integrity of the connections you've built — sometimes worth disturbance, never worth severance."*

### 4. Surface peace (gentle-flag tone)

**Condition:** `peace_priority` in top 5 AND (`adapts_under_social_pressure` signal fires OR `holds_internal_conviction` signal does NOT fire) AND no other register condition above matched.

**Locked prose:**

> *"You named Peace among your most sacred values, but your pressure-block patterns suggest you may sometimes equate peace with conflict-avoidance — yielding under social pressure, holding internal conviction less firmly than your other answers would suggest. For your shape, surface peace may sometimes substitute for the deeper coherence the Compass would name as your real protection. Worth noticing whether peace, for you, is an integrity-preserving register or a friction-avoiding one."*

The Surface register is the gentle-flag — *"worth noticing"* framing rather than judgment. It surfaces a calibration question rather than asserting a verdict. Tone canonical; do not silently revise.

### 5. Fallback (Peace ranked top, none of the four conditions matched)

**Condition:** `peace_priority` in top 5 AND none of conditions 1-4 matched (rare — would require a user with peace top + neither truth/knowledge/honor + neither system/stability/restoring + neither family/caring/close-relationships + no pressure-block adaptation pattern).

**Locked prose:**

> *"You named Peace among your most sacred values. The instrument doesn't yet have enough cross-signal pattern to disambiguate which register of peace operates for you — moral coherence, structural order, relational continuity, or low-friction harmony. Read the Compass card's other registers for context."*

This fallback should fire rarely; if it fires often, the conditions need tuning.

---

## The locked content — Faith two-layer architecture

Selection logic: read `faith_priority` rank in Compass top 5. If not in top 5, return `null` (silent). Otherwise compose Shape (always) + Texture (1-2 of 5).

### Layer 1 — Faith Shape (composite read)

The Shape names *what kind of faith* the user carries by reading three measurement surfaces:

**Faith-of-attribution** (read Q-C4 — what the user attributes ultimate cause to):

- Supernatural-leaning: `supernatural_responsibility_priority` rank ≤ 2.
- Natural-leaning: `nature_responsibility_priority` rank ≤ 2.
- Individual-leaning: `individual_responsibility_priority` rank ≤ 2.
- System-leaning: `system_responsibility_priority` rank ≤ 2.
- Authority-leaning: `authority_responsibility_priority` rank ≤ 2.

**Faith-of-institution** (read Q-X3 — institutional trust portfolio):

- Religious institutional: `religious_trust_priority` rank ≤ 2 in Q-X3.
- Civil / governance: `government_elected_trust_priority` OR `government_services_trust_priority` rank ≤ 2.
- Knowledge / professional: `education_trust_priority` OR `journalism_trust_priority` rank ≤ 2.
- Mission-driven: `nonprofits_trust_priority` rank ≤ 2.
- Business / economic: `small_business_trust_priority` OR `large_companies_trust_priority` rank ≤ 2.

**Faith-of-relationship** (read Q-X4 — personal trust portfolio):

- Family / partner / friend: any of `family_trust_priority`, `partner_trust_priority`, `friend_trust_priority` rank ≤ 2.
- Chosen-mentor: `mentor_trust_priority` rank ≤ 2.
- Outside-expert: `outside_expert_trust_priority` rank ≤ 2.
- Self-reliant: `own_counsel_trust_priority` rank ≤ 2.

**Composition pattern (locked):**

The Shape prose renders the user's top-ranking pattern across all three surfaces in plain language. Template:

```
"You named Faith among your most sacred values. Your other answers shape what kind of faith you carry: [attribution-leaning prose]. [institutional-faith prose]. [relational-faith prose]."
```

Example sub-component prose (selected by signal pattern):

**Attribution-leaning sub-prose:**

- Supernatural: *"when something goes wrong, you locate cause in supernatural agency more than in human or systemic causation"*
- Individual: *"when something goes wrong, you locate cause in human agency — Individual responsibility — more than in supernatural intervention or systemic causation"*
- System: *"when something goes wrong, you locate cause in systemic structure more than in individual agency or supernatural intervention"*
- Authority: *"when something goes wrong, you locate cause in those who hold authority — leaders, decision-makers, the people in charge of the systems"*
- Natural: *"when something goes wrong, you locate cause in natural / material order — chance, biology, the way things just are"*
- Mixed (Individual + Authority both top): *"when something goes wrong, you locate cause in human agency — Individual and Authority — more than in supernatural intervention or systemic causation"*

**Institutional-faith sub-prose:**

- Religious institutional: *"Your institutional faith lands in religious organizations and faith communities"*
- Mission-driven (non-profit lean): *"Your institutional faith lands in mission-driven organizations and faith communities — places where responsibility, consequence, and mission stay close to the people making decisions"*
- Civil/governance: *"Your institutional faith lands in civic and governance institutions"*
- Knowledge/professional: *"Your institutional faith lands in knowledge institutions — education, journalism, professional expertise"*
- Business/economic (small/private lean): *"Your institutional faith lands in close-to-the-consequence businesses — small/private over large/public"*

**Relational-faith sub-prose:**

- Family / partner: *"Your personal faith lands in your family / partner / closest people first"*
- Chosen-mentor: *"Your personal faith lands in chosen mentors and advisors"*
- Outside-expert: *"Your personal faith lands in chosen professional advisors — therapists, clergy, lawyers, doctors, coaches"*
- Self-reliant (own_counsel top): *"Your personal faith lands in your own counsel before any other person — chosen-self-reliant, not deferential"*
- Mixed (own_counsel + partner): *"Your personal faith lands in your own counsel and your spouse / partner — chosen-relational and self-anchored"*

The composition selector picks ONE sub-prose per surface based on the highest-ranking signal pattern. If the user has multiple ties, the Mixed variant fires.

### Layer 2 — Faith Texture (5 register-class disambiguation)

The Texture names *how faith operates* — the rhetorical-spiritual register. Read additional cross-signals; render top 1-2 textures with composing prose.

#### 1. Moral architecture

**Condition:** `faith_priority` + `truth_priority` + `honor_priority` all in Compass top 5.

**Locked sub-prose:** *"For your shape, faith operates as moral architecture — the framework that makes ethical decisions possible rather than the comfort that makes them feel right."*

#### 2. Resistance to nihilism

**Condition:** `faith_priority` + `supernatural_responsibility_priority` rank moderate (3-4) + (`knowledge_priority` OR `honor_priority` in Compass top).

**Locked sub-prose:** *"Faith for your shape reads as resistance to nihilism — the claim that meaning, work, love, and giving are not accidental, even when the evidence is mixed."*

#### 3. Hope in ultimate reconciliation

**Condition:** `faith_priority` + `compassion_priority` + `mercy_priority` all in Compass top 5.

**Locked sub-prose:** *"Faith for your shape reads as hope in eventual reconciliation — that what's broken will not stay broken; that mercy and justice converge somewhere beyond what's currently visible."*

#### 4. Living tension / burden

**Condition:** `faith_priority` + `holds_internal_conviction` signal fires + `truth_priority` in top 5 + (`high_conviction_under_risk` signal fires OR `fire.willingToBearCost` is true).

**Locked sub-prose:** *"Faith for your shape reads as living tension as much as comfort — what you carry, not just what you believe. The cost of belief is part of the belief."*

#### 5. Institutional loyalty

**Condition:** `faith_priority` + `religious_trust_priority` rank ≤ 2 in Q-X3 + `nonprofits_religious_spending_priority` rank ≤ 2 in Q-S3-wider.

**Locked sub-prose:** *"Faith for your shape reads as belonging — anchored in religious community, expressed through participation, doctrinal alignment, and shared practice."*

### Texture composition rules

- If 0 textures fire: render *"For your shape, faith operates as a settled value — neither carried tension nor public belonging dominates the read."* (the no-discriminator fallback).
- If 1 texture fires: render that texture's sub-prose alone.
- If 2 textures fire (e.g., Moral architecture + Living tension as in Jason0429's pattern): join with *", with notes of"*: *"For your shape, faith operates as moral architecture, with notes of living tension — what you carry, not just what you believe."*
- If 3+ textures fire: render top 2 only (priority order: moral architecture > living tension > hope > resistance to nihilism > institutional loyalty).

### Combined Faith prose template

```
[Layer 1 — Shape composition]

[Layer 2 — Texture composition]
```

Two paragraphs. First paragraph is the composite read across attribution + institution + relationship. Second paragraph is the texture register.

### Worked example: Jason0429's signal pattern

- `faith_priority` in Compass top 5 ✓
- Q-C4: `individual_responsibility_priority` rank ≤ 2 + `authority_responsibility_priority` rank ≤ 2 (mixed-individual-authority)
- Q-X3: `nonprofits_trust_priority` + `small_business_trust_priority` top
- Q-X4: `own_counsel_trust_priority` + `partner_trust_priority` top
- Texture conditions: Moral architecture fires (truth + honor + faith all top); Living tension fires (holds_internal_conviction + truth + willingToBearCost)
- Two textures → join with ", with notes of"

**Composed prose (post-CC-054):**

> *"You named Faith among your most sacred values. Your other answers shape what kind of faith you carry: when something goes wrong, you locate cause in human agency — Individual and Authority — more than in supernatural intervention or systemic causation. Your institutional faith lands in mission-driven organizations and close-to-the-consequence businesses — places where responsibility, consequence, and mission stay close to the people making decisions. Your personal faith lands in your own counsel and your spouse / partner — chosen-relational and self-anchored, not deferential."*
>
> *"For your shape, faith operates as moral architecture, with notes of living tension — what you carry, not just what you believe."*

That's the canonical worked example to verify against in browser smoke after this CC ships.

---

## Steps

### 1. Locate `deriveCompassOutput` in `lib/identityEngine.ts`

Per CC-052's ship report, this is around line ~2896. Read the existing Compass output composition.

### 2. Author the three helper functions

- `getPeaceRegister(topCompass, agency, weather, fire, signals): string | null`
- `getFaithShape(topCompass, signals, answers): string | null`
- `getFaithTexture(topCompass, signals): string | null`
- `composeFaithProse(topCompass, signals, answers): string | null` — wraps Shape + Texture with the two-paragraph template; returns null if `faith_priority` not in top 5.

Each function takes existing engine context (`SignalRef[]`, `Signal[]`, `Answer[]`, etc.). Logic per the locked content above. Return `null` to signal "silent — do not render."

### 3. Wire into `deriveCompassOutput`

Extend the Compass output object with two optional fields:

```ts
type CompassOutput = {
  // ... existing fields ...
  peace_register_prose?: string;
  faith_register_prose?: string;
};
```

Populate from the three helpers. The output composition adds these to whatever the existing return shape is.

### 4. Render in `MapSection.tsx`

In the Compass card's body (the expanded view), after the existing Strength block, render the two new prose blocks if present. Each is a small `<p>` element with the standard prose typography. Render order: Peace block first (if present), Faith block second (if present). If both are null, no rendering — silent.

### 5. Update `docs/canon/result-writing-canon.md`

Two amendments:

1. § Rule 10 (Peace Disambiguation) — mark RESOLVED by CC-054. Append the locked 4-register prose templates as canon reference.
2. NEW § Faith Composite Disambiguation — document the two-layer Shape + Texture architecture, the cross-signal patterns, the composition rules, the worked example.

### 6. Update `docs/audits/report-calibration-audit-2026-04-29.md`

Mark Rule 10 findings (Peace disambiguation) as RESOLVED by CC-054. Note the new Faith Composite rule with the two-layer architecture.

### 7. Update `docs/canon/signal-library.md`

Light addition: note that `peace_priority` and `faith_priority` are *composite-read* signals — their user-facing prose composes with cross-signals rather than rendering verbatim. Cross-reference to result-writing-canon's new sections.

### 8. Verification

- `npx tsc --noEmit` exits 0.
- `npm run lint` passes.
- `npm run build` exits 0 (build streak intact).
- Manual: load Jason0429's saved session in admin via CODEX-050's live-engine render. Confirm the Compass card body now shows:
  - Peace register prose: the **moral peace** template (truth + honor + willingness-to-bear-cost match).
  - Faith composite prose: the worked example above (Shape + Texture).
- For users with peace_priority NOT in top 5: no Peace block renders.
- For users with faith_priority NOT in top 5: no Faith block renders.

### 9. Browser smoke (Jason verifies)

- Jason0429: confirm the Peace + Faith prose matches the worked example.
- Any user with high peace_priority + family_priority + caring_energy: Peace renders the **relational peace** template.
- Any user with low conviction signals + adapts_under_social_pressure + peace ranked: Peace renders the **surface peace** gentle-flag template.
- Any user with faith_priority + religious_trust_priority + nonprofits_religious_spending: Faith Texture renders **institutional loyalty**.

---

## Acceptance

- `lib/identityEngine.ts` exports `getPeaceRegister`, `getFaithShape`, `getFaithTexture`, `composeFaithProse`. All four return `null` when the prerequisite Compass-top condition fails.
- `deriveCompassOutput` populates `peace_register_prose` and `faith_register_prose` optional fields.
- `MapSection.tsx` (or wherever Compass body renders) shows the two prose blocks conditionally; silent when null.
- `docs/canon/result-writing-canon.md` carries the CC-054 amendment for Rule 10 + new Faith Composite section.
- `docs/audits/report-calibration-audit-2026-04-29.md` marks Rule 10 findings RESOLVED by CC-054.
- `docs/canon/signal-library.md` notes the composite-read status of peace_priority and faith_priority.
- `git diff --stat` shows changes only in named files.
- `npx tsc --noEmit` exits 0. `npm run lint` passes. `npm run build` succeeds.
- Manual sweep confirms Jason0429's Peace + Faith prose match the worked example.

---

## Out of scope

- **Disambiguating other Compass values** (loyalty_priority, freedom_priority, etc.). Future CC if flagged.
- **Asking the user which kind of peace or faith they mean.** Cross-signal interpretation only; no question changes.
- **Changing question text for Q-S1 / Q-S2.** Users still rank Peace and Faith without subtype prompts.
- **Editing other Compass card prose** (existing Strength / Growth Edge / Practice / Pattern Note stay verbatim).
- **Adding new measurement surfaces** for faith-of-attribution, faith-of-institution, faith-of-relationship. The instrument already measures all three via Q-C4, Q-X3, Q-X4.
- **Surface framework names in user prose.** *"Faith-of-attribution"*, *"Layer 1 / Layer 2"*, *"Texture register"* never appear in user-facing copy. Plain language only.
- **Authoring per-user Faith Texture combinations beyond top-2.** If 3+ textures fire, render top 2; don't over-stack.
- **Editing the `pickGiftCategory` routing** or any gift-category prose. Different surface.
- **Re-rendering existing snapshots.** Per CODEX-050, admin re-derives on each load; saved `inner_constitution` snapshots stay frozen.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

This is a CC- (Claude Code) prompt because the editorial-judgment density is meaningful — the executor needs to verify each composed sub-prose reads coherently, that the cross-signal patterns fire for plausible user shapes, and that the prose tone matches the surrounding Compass register. Codex could execute it, but the tone-sensitivity and the worked-example verification weigh toward Claude Code.

## Execution Directive

Single pass. The 4 Peace prose templates are locked content — verbatim. The Faith Shape sub-prose templates and 5 Faith Texture sub-prose templates are locked content — verbatim. Composition logic structure (read-and-select-by-signal-pattern) has executor latitude on implementation language (switch / if-chain / object-lookup). Surface in Report Back if any sub-prose reads obviously off in composition with another sub-prose. **Move prompt to `prompts/completed/` when shipped.**

## Bash Commands Authorized

- `grep -rn "deriveCompassOutput\|peace_priority\|faith_priority\|COMPASS_LABEL" lib/ app/`
- `cat <file>`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` (smoke; kill before exiting)
- `mv prompts/active/CC-054-peace-faith-disambiguation.md prompts/completed/CC-054-peace-faith-disambiguation.md`
- `git diff --stat`
- `git status`

## Read First (Required)

- `AGENTS.md`
- `lib/identityEngine.ts` `deriveCompassOutput` (around line 2896 per CC-052 ship report), `topCompass` / `topGravity` access patterns, signal-ref helpers (`hasAtRank`, `compassRanksTop`).
- `lib/types.ts` `CompassOutput`, `SignalRef`, `AgencyPattern`, `WeatherLoad`, `FirePattern`.
- `app/components/MapSection.tsx` Compass card body rendering.
- `docs/canon/result-writing-canon.md` § Rule 10 (post-CC-048 form).
- `docs/audits/report-calibration-audit-2026-04-29.md` § Rule 10 findings.
- Memory: `feedback_peace_and_faith_disambiguation.md` for the full register splits and architectural rationale.

## Allowed to Modify

- `lib/identityEngine.ts`
- `app/components/MapSection.tsx`
- `lib/types.ts` (only to add `peace_register_prose?` / `faith_register_prose?` optional fields to CompassOutput)
- `docs/canon/result-writing-canon.md`
- `docs/audits/report-calibration-audit-2026-04-29.md`
- `docs/canon/signal-library.md`

## Report Back

1. **Files modified** with line counts.
2. **Helper function shapes** — paste signatures for `getPeaceRegister`, `getFaithShape`, `getFaithTexture`, `composeFaithProse`.
3. **Verification results** — tsc, lint, build outputs.
4. **Manual sweep — Jason0429** — paste the actual rendered Peace prose and Faith composite prose. Confirm against the worked example.
5. **Coverage check** — for each of the 4 Peace registers and 5 Faith Textures, name the minimal-config user pattern that would fire it. Confirm fallbacks reachable.
6. **Out-of-scope drift caught**.
7. **Any sub-prose that read obviously off in composition** — flag for editorial follow-up; do not silently revise.
8. **Audit + canon updates verified**.
9. **Browser smoke deferred to Jason** — name the four sessions that test all 4 Peace + 5 Faith Texture branches.
10. **Prompt move-to-completed confirmation**.

---

## Notes for the executing engineer

- This CC implements the cross-signal-interpretation-in-prose architectural pattern that future ambiguous-Compass-value CCs will follow. The pattern: read the value's rank in Compass top, read cross-signals, compose user-facing prose in plain language, return `null` (silent) when the value isn't load-bearing.
- The 4 Peace prose templates and the Faith sub-prose components are content — preserve verbatim. The composition logic that selects which sub-prose fires is the executor's authoring task within the locked conditions.
- The "silent unless ranked top" rule is canonical. Users who didn't rank Peace or Faith in their top 5 see nothing in this surface — the report doesn't impose a register frame on them. Per Jason 2026-04-30: *"Silent."*
- The framework names (Layer 1 / Layer 2 / Shape / Texture / faith-of-attribution / etc.) never appear in user-facing prose. They live in canon docs and code comments only. Per Jason 2026-04-30: *"Agreed."*
- The two-layer Faith architecture (Shape + Texture) is the main innovation per Jason 2026-04-30: *"Shape + Texture."* Don't collapse to one-layer.
- The Surface Peace gentle-flag tone is canonical — *"worth noticing whether..."* surfaces a calibration question rather than asserting a verdict. This is the tone Clarence's review specifically said the instrument needs more of (Rule 5 - uncomfortable-but-true sentence) but applied carefully so it reads as observation, not judgment.
- Pre-CC-054 saved sessions: re-rendering picks up the new prose automatically when the engine re-runs. Admin live-engine renders show the disambiguation; pre-CC-054 stored snapshots (if any) keep the old text. No migration needed.
- Per CODEX-/CC- routing convention, the prompt file moves to `prompts/completed/` when shipped.
