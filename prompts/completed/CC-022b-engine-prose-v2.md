# CC-022b — Engine Prose v2 (Name + Demographics + Keystone Citation + Cross-Card Patterns + Simple Summary)

## Launch Directive

You are executing CC-022b. This CC adds five capabilities to the rule-based engine's prose-generation layer, making the engine's output substantially smarter without introducing LLM substitution.

The five capabilities:

1. **Name threading** — the user's specified name is woven through Mirror prose where it personalizes the read. Uses the `getUserName` + `nameOrYour` helpers shipped in CC-022a.
2. **Demographic-aware contextual interpolation** — profession, marital status, and age decade interpolate into already-relevant prose surfaces (Path · Gait Work, Love, and Weather sections). Per `demographic-rules.md` Rule 4 (amended): the derivation layer stays demographic-blind; the prose-generation layer may reflect user-supplied demographics back into already-relevant prose.
3. **Keystone Reflection selection citation** — instead of generic dimension-label prose ("rigid posture," "value_domain: Truth"), the prose cites the user's actual Q-I2 and Q-I3 selections back to them by source-question label. The user sees their own self-named priorities reflected in the read.
4. **Cross-card pattern catalog** — an initial registry of 10-12 canonical cross-card patterns (Faith ↔ Supernatural, Justice ↔ System, Truth ↔ Conviction-posture, Family ↔ Allocation, Builder ↔ Maintenance, etc.). Each pattern has a detection rule + templated prose that surfaces in the relevant card section when active. New canon doc `cross-card-patterns.md`.
5. **Simple Summary closing section** — a new synthesis section at the end of the Mirror with three structural closing patterns: *"To keep X without Y"* parallel lines; the *"Your gift is X. Your danger is X {temporal}"* compression line keyed to the user's dominant Lens function; the *"not X, but Y"* one-line thesis as the final beat.

**The architectural premise**: the engine produces structurally-rich, accurate observations. The prose layer compresses them into shape-specific, memorable language. The engine does not need to produce the compressed line itself — it needs to provide the raw material clearly enough that compression is possible. CC-022b builds the rule-based compression layer. LLM substitution is deferred indefinitely; the engine's output is good enough on its own.

**Hard architectural constraint preserved**: the **derivation layer** (signal extraction, tension detection, per-card structural derivation) remains demographic-blind per `demographic-rules.md` Rule 4. Demographics enter only at the prose-generation layer. Two users with identical answer arrays but different demographics still produce identical derived InnerConstitution structures; the prose's surface threading is the only difference.

**CC-022a prerequisites are in place**:

- `getUserName` + `nameOrYour` helpers exported from `lib/identityEngine.ts` (dormant; CC-022b wires them).
- Demographics flow naturally through `app/page.tsx` → `InnerConstitutionPage` (CC-022a's flow inversion eliminated the `submittedDemographics` workaround).
- Browser smoke verified (test → identity_context → result; second-pass triggers at post-Allocation boundary; scroll lands at top).

**Out of scope explicitly**: the Q-I1 + Q-I3 structural mismatches (sacred-as-cost-target; differentiation-vs-cost-bearing framings) are deferred to **CC-024 — Keystone Block Restructure** per `prompts/queued/Q-I3-restructure-notes.md`. CC-022b does not modify Q-I1 question text, Q-I3 derivation source, or any structural Keystone behavior. CC-022b only enhances the *prose* surrounding the existing structure.

Sequenced after CC-022a (shipped + browser-smoke-verified). Independent of any pending visual-design or vendor-setup work.

## Bash Authorized

Yes. Use the shell freely for `tsc`, `eslint`, dev-server smoke runs, and any inspection scripts. Do not commit or push.

## Execution Directive

### Item 1 — Name threading throughout the Mirror

The `getUserName` and `nameOrYour` helpers exist in `lib/identityEngine.ts` (CC-022a). Wire them through prose generators.

**Threading rule of thumb**: when prose currently begins a sentence with *"Your"* or *"You"*, and the prose is structurally a per-user reflection, the prose generator may substitute the name via `nameOrYour(demographics)`. Thread sparingly — every paragraph using the name reads as forced; one or two anchor uses per major section reads as personalized.

**Threading frequency target**: ~1-2 name uses per Mirror section (Core Pattern, Top 3 Gifts, Top 3 Traps, What Others May Experience, When the Load Gets Heavy, Allocation Gaps, Your Next 3 Moves); ~3-4 name uses per Map card.

**Concrete substitutions** (examples, not exhaustive):

- Mirror's `Core Pattern` opener: *"The pattern you keep living inside..."* → *"The pattern Madison keeps living inside..."*
- Compass card's `cardHeader`: *"When something has to give, you appear to protect..."* → *"When something has to give, Madison appears to protect..."*
- Conviction card `postureSentence`: *"Under cost, your belief tends to hold..."* → *"Under cost, Madison's belief tends to hold..."*
- Top 3 Traps openers: *"Under load, your..."* → *"Under load, Madison's..."*

**Critical fall-back rule**: every name-threaded sentence must have a name-less fallback that reads cleanly when `getUserName` returns null. The prose reads naturally either way. CC-022a guarantees demographics arrive at portrait-render time, but `name_state === "prefer_not_to_say"` is a real path; threading must handle it.

**Pass-through chain**:

- `app/page.tsx` → `InnerConstitutionPage` (already passes `demographics`)
- `InnerConstitutionPage` → `MirrorSection`, `MapSection` (CC-022b adds prop pass-through)
- `app/admin/sessions/[id]/page.tsx` → `InnerConstitutionPage` (CC-022b adds; admin detail view currently fetches demographics but doesn't thread them; one-line addition)

### Item 2 — Demographic-aware contextual interpolation

Three demographic surfaces feed three prose sections.

**Profession in Path · Gait Work** (highest-impact). When `demographics.profession_state === "specified"`, after the existing Work prose, append a profession-keyed sentence. Use a lookup map:

```ts
const PROFESSION_PROSE_HOOKS: Record<string, string> = {
  knowledge:      "knowledge work — research, analysis, writing, code, strategy",
  skilled_trades: "skilled-trade work — building, repairing, making with hands",
  service:        "service work — direct interaction with people who need something",
  public_safety:  "public-safety work — protection, response, emergency, accountability",
  medical:        "medical work — caring for bodies, minds, and the lives wrapped around them",
  education:      "educational work — formation, transmission, the long work of teaching",
  laborer:        "physical labor — sustained effort that the body remembers",
  creative:       "creative or artistic work — making something that didn't exist before you saw it",
  entrepreneur:   "self-employment or entrepreneurship — building from your own conviction",
  retired:        "the post-work register — life organized around what you choose, not what you must",
  military:       "military work — discipline, duty, structures larger than self",
  religious_work: "religious or ministry work — formation, care, sacred trust",
};
```

The hook sentence pattern: *"This shape sits inside {hook}, where {one short phrase tied to the user's actual top values / Lens / Conviction}."* The trailing phrase pulls from structured-source data (e.g., *"...where the long-arc pattern reads against the immediate need"* for a pattern-reader Lens; *"...where named values become the test of every interaction"* for high Faith / Justice). A small lookup keyed by `(profession × dominant_function)` produces 12 × 8 = 96 possible hook completions, but most paths fall through to a sensible default. Author 4-6 default completions and let pattern-keyed ones override.

If the user's profession is `"other"` with `other_text`, surface the `other_text` value verbatim (capitalized + reflected back; not text-mined).

If `prefer_not_to_say` or `not_answered`, the existing Work prose runs unchanged.

**Marital status in Path · Gait Love** (lighter touch). When `marital_status_state === "specified"`:

- `married` / `partnered` → *"A long-term partnership amplifies the steady-presence pattern this shape carries into love."*
- `single` → *"In single life, the love-shape this card surfaces shows up in friendships, family, and chosen kin more than in romantic pairing."*
- `divorced` / `widowed` → tread carefully; surface only when the prose is already structurally about the relational past. Lean: skip by default.

**Age decade in Weather** (lightest touch). When `age_state === "specified"` and the Weather card's read is already about formation context:

- *"Someone shaped in the {decade} read against a particular cultural baseline — the formation patterns that produced steadiness or unsteadiness in that era."*

Use sparingly; skip when forced.

**Hard rules across all three** (per `demographic-rules.md` Rule 4 amendment):

- Interpolation reflects user-supplied facts; never infers.
- Never produces value-laden cultural-archetype claims (*"In your generation, people tend to..."* / *"Working-class users tend to..."*).
- Field state determines availability: `specified` permits interpolation; `prefer_not_to_say` and `not_answered` mean the field doesn't appear.

### Item 3 — Keystone Reflection selection citation

**File affected**: `lib/beliefHeuristics.ts`.

The current `generateBeliefContextProse(belief, valuesPhraseFromCompass)` produces generic dimension-label prose. CC-022b extends it to cite the user's actual Q-I2 and Q-I3 selections by source-question label.

**Helper functions** (new):

```ts
export function summarizeQI2Selections(answers: Answer[]): {
  selectedSources: string[];          // human-readable labels of what user selected
  noneSelected: boolean;
  hasOther: boolean;
  topAvailable: string[];             // the 6 items the user was offered
} | null;

export function summarizeQI3Selections(answers: Answer[]): {
  selectedDrivers: string[];
  noneSelected: boolean;
  hasOther: boolean;
  topAvailable: string[];
} | null;
```

Each walks the saved `Answer[]` array, finds the relevant `multiselect_derived` answer, looks up the human labels via `data/questions.ts` items + the parent rankings' item labels.

**Prose form** (replacing the current generic `postureLine`):

When `summarizeQI2Selections` returns non-null:

- If `noneSelected`:
  > *"Of the six trust sources {nameOrYour} ranked highest — {topAvailable joined} — {nameOrYour, true} marked None as having the power to revise this belief. The belief is held against the full revision space {nameOrYour} {they/you} themselves named as most credible."*
- If 1 source selected:
  > *"Of the six trust sources {nameOrYour} ranked highest — {topAvailable joined} — {nameOrYour, true} marked one ({selectedSources[0]}) as potentially capable of revising this belief. The belief is mostly closed; one named exit remains."*
- If 2 sources selected:
  > *"Of the six trust sources {nameOrYour} ranked highest, {nameOrYour, true} marked two ({selectedSources[0]} and {selectedSources[1]}) as potentially capable of revising this belief — held with care, but not closed."*
- If 3+ sources selected:
  > *"Of the six trust sources {nameOrYour} ranked highest, {nameOrYour, true} marked {n} ({joined list}) as potentially capable of revising this belief. The belief is held with conviction but with multiple revision paths kept open."*

Same structural form for Q-I3 selections, with verbiage adjusted: *"Of the six sacred drivers..."* and *"...you would risk losing for this belief."*

**Important caveat for Q-I3**: per `prompts/queued/Q-I3-restructure-notes.md`, Q-I3's current architecture has a structural mismatch (sacred-values-as-cost-targets is incoherent). CC-022b does not fix that; it just generates better prose for whatever Q-I3 currently produces. The selection-citation prose for Q-I3 should still cite the user's selections back, but the prose should be slightly hedged to acknowledge the question's structural limitation when None is selected:

- For Q-I3 when `noneSelected: true`: *"Of the six sacred drivers {nameOrYour} ranked highest, {nameOrYour, true} marked None as something {nameOrYour} would risk losing for this belief. That refusal is informative — sacred values, by definition, are not things {nameOrYour} would freely sacrifice."*

This last form acknowledges Jason's structural critique without modifying the question itself; the proper fix lands in CC-024.

**Backward compatibility**: extend the function signature to accept `answers?: Answer[]`. When not passed (older sessions whose schema didn't preserve Q-I2/Q-I3 selection details), fall back to the current generic dimension-label prose.

**Closing protected line**: the existing closing line (*"The model does not judge whether this belief is correct..."* / *"Your shape places this belief inside what you protect, not outside it."*) stays verbatim.

### Item 4 — Cross-card pattern catalog

**New canon doc**: `docs/canon/cross-card-patterns.md`.

**New code surface** in `lib/identityEngine.ts`:

```ts
export type CrossCardPattern = {
  pattern_id: string;
  name: string;
  description: string;
  applicable_card: ShapeCardId;             // where the prose is inserted
  detection: (signals: Signal[], topCompass: SignalRef[], topGravity: SignalRef[]) => boolean;
  prose: (
    signals: Signal[],
    topCompass: SignalRef[],
    topGravity: SignalRef[],
    demographics?: DemographicSet | null
  ) => string;
};

export function detectCrossCardPatterns(
  signals: Signal[],
  topCompass: SignalRef[],
  topGravity: SignalRef[],
  demographics?: DemographicSet | null
): { pattern: CrossCardPattern; prose: string }[];
```

**Initial catalog** (10-12 patterns):

1. **Faith ↔ Supernatural distinction** — high `faith_priority` + low `supernatural_responsibility_priority`. **Compass card.** *"Faith appears to function less as an escape hatch from responsibility and more as an orienting trust. {Name?} may believe in what is beyond human control without using it to excuse what remains within human responsibility."*
2. **Justice ↔ System attribution** — high `justice_priority` + high `system_responsibility_priority`. **Gravity card.** *"{NameOrYour, true} sense of justice operates against the structures more than against the individuals — this often shows up as advocacy work, systemic critique, or the kind of attention that seeks the source of the harm rather than the surface of it."*
3. **Truth ↔ private-under-threat** — high `truth_priority` + concealing/private Conviction posture. **Conviction card.** *"{NameOrYour, true} commitment to truth coexists with caution about expressing it publicly. The truth {nameOrYour} {they/you} protect{s/} may live inwardly more than visibly — a conviction kept rather than declared."*
4. **Freedom ↔ Order tension** — high `freedom_priority` + high `order_priority` (or `stability_priority`). **Compass card.** *"{NameOrYour, true} appear{s/} to protect both freedom and order — these often live in tension. The shape of how {nameOrYour} hold{s/} both is one of the more telling things this card surfaces."*
5. **Family ↔ Money allocation gap** — high `family_priority` (Q-S2) + family low in Q-S3-cross top-2. **Compass card** (separate from T-013 — the cross-card pattern is the Compass-side reflection of the same gap). *"{Name?} named Family as among {nameOrYour} most sacred values. The allocation card surfaces a gap between that ranking and where {nameOrYour} discretionary money currently flows — a gap the model surfaces but does not adjudicate."*
6. **Knowledge ↔ Education trust** — high `knowledge_priority` + high `education_trust_priority`. **Trust card.** *"{NameOrYour, true} trust in education aligns with {nameOrYour} sacred ranking of knowledge — the institutions {nameOrYour} trust{s/} most are the ones whose work matches what {nameOrYour} protect{s/}."*
7. **Loyalty ↔ Family / Partner trust** — high `loyalty_priority` + high `family_trust_priority` or `partner_trust_priority`. **Trust card.** *"Loyalty operates as both a sacred value {nameOrYour} protect{s/} AND the kind of trust {nameOrYour} extend{s/} most readily — these reinforce each other in the shape of how {nameOrYour} commit{s/}."*
8. **Stability ↔ Chaos formation** — high `stability_priority` + `chaos_exposure` from Q-F2. **Weather card.** *"The stability {nameOrYour} protect{s/} now may be a deliberate response to early uncertainty. What {nameOrYour} protect{s/} is sometimes shaped by what {nameOrYour} didn't have."*
9. **Pattern-reader Lens ↔ low present-tense action** — dominant `ni` or `ne` + `reactive_operator` from Q-A1 (or related under-load patterns). **Lens card.** *"The pattern-reader gift can produce paralysis when the patterns multiply faster than action. {Name?} may need to choose ground that's good enough rather than waiting for the optimal pattern to land."*
10. **Costly conviction without revision** — `holds_internal_conviction` (or similar Conviction-posture signals) + `belief_impervious` MetaSignal from Q-I2. **Conviction card.** *"{NameOrYour, true} willingness to bear cost for belief comes paired with a closed revision path — neither alone is the full shape; together they describe a conviction that has chosen its room and may stop testing whether the room was rightly chosen."*
11. **Builder ↔ Maintenance allocation gap** — pattern-reader Lens (Ni or Ne dominant) + structurer support (Te aux) + Q-A1 producing `reactive_operator` or `responsibility_maintainer` + at least one structural sacred value (Faith / Truth / Knowledge / Justice) in top-2. **Path · Gait Work card** OR **Compass card.** *"For {nameOrYour} shape, the meaningful allocation gap may not be the standard money-toward-charity question. The sharper question is whether {nameOrYour} creative output, {nameOrYour} protected hours, and {nameOrYour} strategic attention are moving toward the future {nameOrYour} say{s/} {they/you} believe in — or whether maintenance is consuming the time that was supposed to build it."*
12. **Endurance under low present load** — high `holds_internal_conviction` + Weather card showing low current load. **Weather card.** *"The endurance pattern this shape carries shows up best at low load — when there's nothing acute to absorb. The shape's gift may be the reserve that gets called on when load arrives, not the visible carrying that load already requires."*

The exact prose stays in the catalog. Patterns can grow over time; CC-022b ships the initial 12.

**Integration into rendering**: `MirrorSection.tsx` and `MapSection.tsx` check each card's `applicable_card` against the patterns detected; when a pattern fires for that card, its prose is inserted into the card's section. Additive — pattern prose appears alongside existing Strength/Trap/Next move on Map cards, or as additional paragraphs in the Mirror's per-card sections.

**Design rule for future patterns**: per `prompts/queued/Q-I3-restructure-notes.md`'s composition-check rule, the question's verb (or pattern's framing) must compose with the source card's semantics. Audit each new pattern against this rule before adding to the catalog.

### Item 5 — Simple Summary closing section

**New section in the Mirror**, positioned after the Open Tensions list (or as a sibling depending on layout). Synthesizes the eight cards into one cross-card paragraph and ends with three structural closing patterns.

**New function** in `lib/identityEngine.ts`:

```ts
export function generateSimpleSummary(
  constitution: InnerConstitution,
  demographics?: DemographicSet | null
): string;
```

**Output structure** (4-7 synthesizing sentences + three closing patterns):

```
{4-7 sentences synthesizing the eight cards — pulls from lens_stack, top_compass, conviction posture, dominant tensions}

To keep {gift A} without {trap A}.
To keep {gift B} without {trap B}.
To keep {gift C} without {trap C}.
[3-4 such lines]

{NameOrYour, true} gift is {capability}. {NameOrYour, true} danger is {capability} {temporal qualifier}.

{Name | "You" | "This shape"} is a {shape descriptor} whose growth edge is not {assumed answer}, but {actual structural answer}.
```

**Closing pattern A — *"To keep X without Y"* parallel lines.** 3-4 lines, drawn from per-card outputs. The existing Top 3 Traps + Top 3 Gifts feed pattern: *"To keep {gift} without {trap}."* Templated; pulls structured.

**Closing pattern B — *"Your gift is X. Your danger is X {temporal}"* compression.** Per-function template, keyed to dominant Lens function:

```ts
const GIFT_DANGER_LINES: Record<LensFunction, { gift: string; danger: string }> = {
  ni: { gift: "the long read", danger: "believing the long read too early" },
  ne: { gift: "room-reading", danger: "room-reading instead of saying" },
  si: { gift: "durable memory", danger: "durable memory of what no longer applies" },
  se: { gift: "present-tense response", danger: "present-tense response without long enough context" },
  te: { gift: "operational clarity", danger: "operational clarity before the goal has been examined" },
  ti: { gift: "internal coherence", danger: "internal coherence the world doesn't share" },
  fi: { gift: "moral seriousness", danger: "moral seriousness without curiosity" },
  fe: { gift: "attunement", danger: "attunement instead of authorship" },
};
```

Sentence form: *"{NameOrYour, true} gift is {gift}. {NameOrYour, true} danger is {danger}."* — same noun, parallel structure, only the temporal qualifier creates the inversion. The reader cannot disagree with the gift without disagreeing with the danger; they're the same machinery viewed at different moments.

**Closing pattern C — *"not X, but Y"* one-line thesis.** Final beat. Pre-author a small set of (X, Y) pairs keyed by shape (dominant function × top Compass cluster). The X is what the user might assume the answer is; the Y is the more specific structural answer drawn from cross-card patterns + per-card outputs.

Examples:

- Pattern-reader / Knowledge / Builder shape → *"{Name} is a long-arc pattern reader and builder whose growth edge is not caring more, but translating conviction into visible, revisable, present-tense structure."*
- Possibility-finder / Family / Caregiver shape → *"{Name} is a possibility-driven caregiver whose growth edge is not trying harder, but letting one direction become a finished thing."*
- Coherence-checker / Truth / Solver shape → *"{Name} is a coherence-checking truth-seeker whose growth edge is not finding the right answer, but communicating the answer in a register the room can use."*

Keyed by `(dominant_function, top_compass[0]?.signal_id)`. Pre-author 16-24 thesis templates; fall back to a generic *"{Name} is a {dominant function} {top compass} shape whose growth edge is not {generic answer}, but {generic structural answer}"* when no specific (function, compass) pairing is matched.

**Architectural note**: the *"not X, but Y"* construction is what gives the line weight. Most personality writing says *"your growth move is to be more legible"* — this construction says *"the growth edge is not caring more, but translating."* The inversion names what the user might assume the answer is and corrects it. That's what makes the sentence land.

**Integration**: `MirrorSection.tsx` adds a new section block at the end. Visual register: italic subtitle (*"a synthesis"*), then the 4-7 synthesizing sentences, then the three closing patterns separated by visual whitespace.

### Item 6 — Canon updates

**`docs/canon/cross-card-patterns.md`** — NEW. Documents:

- The architectural primitive (cross-card pattern detection at prose-generation time, NOT at derivation time — patterns consume signals that already exist; they don't add new signals).
- The full initial 12-pattern catalog with detection rules + prose templates.
- The composition-check rule (each pattern's framing must compose with the source card's semantics; per `prompts/queued/Q-I3-restructure-notes.md`).
- The growth rule (catalogs add new patterns over time; existing patterns don't break when new ones land).
- Cross-references to `result-writing-canon.md`, `demographic-rules.md`, `cross-card-patterns.md`.

**`docs/canon/result-writing-canon.md`** — append a section documenting the new prose primitives:

- Name threading and the `nameOrYour` helper pattern.
- Demographic-aware interpolation (per amended Rule 4).
- Keystone Reflection selection citation as the canonical form.
- Cross-card patterns as a new prose-layer architectural primitive.
- Simple Summary as a structural close, with all three closing patterns documented:
  - *"To keep X without Y"* parallel lines
  - *"Your gift is X. Your danger is X {temporal}"* compression line
  - *"not X, but Y"* one-line thesis

The protected lines from earlier CCs stay verbatim. New prose primitives are additive.

## Allowed-to-Modify

- `lib/identityEngine.ts` — wire `nameOrYour` through prose generators; add `CrossCardPattern` type + `CROSS_CARD_PATTERNS` catalog + `detectCrossCardPatterns` function; add `generateSimpleSummary` with the three closing patterns; add `GIFT_DANGER_LINES` lookup; extend per-card prose generators to accept optional `demographics?: DemographicSet`; extend `generatePathExpansion` for profession / marital status / age interpolation.
- `lib/beliefHeuristics.ts` — extend `generateBeliefContextProse` to accept `answers?: Answer[]` and produce selection-citation prose; add `summarizeQI2Selections` and `summarizeQI3Selections` helpers.
- `app/components/MirrorSection.tsx` — add Simple Summary section render; thread demographics down to per-card sections.
- `app/components/MapSection.tsx` — thread demographics into per-card prose; insert cross-card-pattern prose into per-card sections where applicable.
- `app/components/InnerConstitutionPage.tsx` — thread demographics down to MirrorSection and MapSection (already accepts `demographics` prop).
- `app/admin/sessions/[id]/page.tsx` — pass the saved session's demographics to InnerConstitutionPage (currently passes only the InnerConstitution itself; one-line addition).
- `lib/types.ts` — add `CrossCardPattern` type if exported; minor type touchups for prose generator signatures.
- `docs/canon/cross-card-patterns.md` — NEW canon doc.
- `docs/canon/result-writing-canon.md` — append the new prose primitives section.

No other file should be modified.

## Out of Scope — explicit "do not" list

- **Do not** modify the derivation layer's signature: `deriveSignals(answers)` and `detectTensions(signals)` stay exactly as-is. Demographics never enter signal extraction or tension detection.
- **Do not** modify any signal definition, MetaSignal type, or tension-detection block.
- **Do not** modify any question definition in `data/questions.ts` or any demographic field in `data/demographics.ts`.
- **Do not** modify Q-I1 question text, Q-I3's `derived_from`, or any Keystone block structural behavior. The Q-I1/Q-I3 structural critiques are deferred to CC-024 — Keystone Block Restructure (per `prompts/queued/Q-I3-restructure-notes.md`).
- **Do not** introduce LLM substitution or any vendor-API call. CC-022b is purely rule-based.
- **Do not** modify any tension's `user_prompt` text. T-001 through T-015 prose stays as authored. Cross-card patterns are a SEPARATE prose layer that surfaces in card sections, not in the Open Tensions list.
- **Do not** modify the Open Tensions list rendering or its Yes/Partially/No affordances.
- **Do not** modify the second-pass mechanism, the save flow, the Identity & Context page, the Share/Print block, or the persistence-layer code (all CC-022a / CC-019 / CC-020 territory).
- **Do not** modify the admin auth, the attachments system, or any researcher-UI surface beyond passing demographics to InnerConstitutionPage in the detail view.
- **Do not** modify the eight-card body-map structure or the Map's section list.
- **Do not** introduce visual design changes to the cards (graphics, icons, colors).
- **Do not** modify the file-picker UX (CC-023 polish item).
- **Do not** introduce new database columns, schema migrations, or persistence-layer changes.
- **Do not** modify build configuration, AGENTS.md, CLAUDE.md, or any prompt file other than this one.
- **Do not** modify `prompts/queued/Q-I3-restructure-notes.md` or `prompts/queued/CC-022b-engine-prose-v2-queue.md` (the queue file is now superseded by this CC; leave it as a historical record).

## Acceptance Criteria

1. **Name threading** — open a saved session whose demographics specify a name. Mirror prose includes the name in 1-2 places per major section. Same session with `name_state === "prefer_not_to_say"` falls back to *"You"* / *"Your"* cleanly. No sentences read awkwardly without the name.
2. **Profession interpolation** — saved session with `profession_state === "specified"`: Path · Gait Work section's prose includes a profession-keyed sentence. With `prefer_not_to_say`: existing Work prose runs unchanged.
3. **Marital status & age interpolation** — present and meaningful when specified; absent and graceful when not.
4. **Keystone selection citation** — for a session with both Q-I2 and Q-I3 answered, Keystone Reflection prose names the user's actual top-3 trust sources from Q-X3 + top-3 from Q-X4 in the Q-I2 citation; actual top-3 sacred drivers from Q-S1 + top-3 from Q-S2 in the Q-I3 citation. Generic dimension-label fallback only fires when answers are unavailable. Q-I3 None-selected case includes the structural acknowledgment that *"sacred values, by definition, are not things {nameOrYour} would freely sacrifice."*
5. **Cross-card patterns** — for a synthetic test session triggering each of the 12 catalog patterns, the corresponding prose paragraph appears in the correct card section. Patterns NOT in the catalog do not produce ghost prose.
6. **Builder ↔ Maintenance pattern** — verify it fires for a session with pattern-reader Lens + structurer support + reactive_operator + Faith/Truth/Knowledge/Justice top-2, and surfaces in Path · Gait Work or Compass card prose.
7. **Simple Summary section** — appears at the end of the Mirror with: 4-7 synthesizing sentences; *"To keep X without Y"* parallel lines; *"Your gift is X. Your danger is X {temporal}"* compression line keyed to the user's dominant Lens function; *"not X, but Y"* one-line thesis. Renders cleanly even when name is missing (falls back to "Your" / "You" / "This shape").
8. **Demographic-blind derivation preserved** — for two synthetic sessions with identical answers but different demographics, the derived InnerConstitution structures are byte-identical. Only the rendered prose differs. Verify via `JSON.stringify(constitution)`.
9. **No tension or signal regression** — T-001 through T-015 detection still produces identical results. Allocation Gaps section renders the same prose for the same input. Open Tensions list is byte-identical to before this CC for any saved session.
10. **Canon docs updated** — `cross-card-patterns.md` exists with all 12 patterns; `result-writing-canon.md` has the new prose-primitives section appended.
11. **Admin detail view** — opening a saved session in `/admin/sessions/[id]` renders the same prose-enhanced output the live test flow produces (with name threading, demographic interpolation, Keystone citation, cross-card patterns, Simple Summary).
12. **Q-I3 None-selected acknowledgment** — for a session where the user selected None on Q-I3, the Keystone prose includes the structural-acknowledgment line and does not read as gotcha.
13. **TSC clean.** `npx tsc --noEmit` exits 0.
14. **Lint clean.** `npm run lint` exits 0.
15. **No file outside the Allowed-to-Modify list is modified.**

## Report Back

1. **Files changed** — file-by-file summary.
2. **Name threading verification** — paste sample Mirror prose excerpt for session with name = "Madison" and the same excerpt for `name_state = prefer_not_to_say`.
3. **Profession interpolation verification** — show profession threaded vs missing.
4. **Keystone citation** — for Madison's actual saved session (and a fresh session that selects None on Q-I3), paste the new Keystone Reflection prose. Confirm actual selections appear by source-question label; confirm None-selected case includes the structural acknowledgment.
5. **Cross-card pattern smoke** — for each of the 12 catalog patterns, run a synthetic session that triggers it; paste the resulting card-section excerpt showing the pattern's prose appearing in the right card.
6. **Simple Summary smoke** — paste the Simple Summary for Madison's session (and one more session with a different shape).
7. **Demographic-blind derivation regression** — two synthetic sessions with identical answers, different demographics. Confirm `JSON.stringify(constitution)` is byte-identical.
8. **Tension regression** — confirm T-001 through T-015 detection produces identical results pre- and post-CC.
9. **TSC + lint** — exit codes.
10. **Scope-creep check** — confirm only allowed files modified.
11. **Risks / next-step recommendations** — anything noticed during the work that warrants a follow-up CC.

## Notes for the executing engineer

- **The `nameOrYour` helper pattern is the cleanest threading approach.** Use it consistently. Verb agreement (e.g., *"appear{s}"* depending on whether the subject is name vs "you") is the caller's responsibility — the helper documents this.
- **Cross-card patterns are a registry, not a dispatch tree.** Each pattern's `detection` function is pure; `detectCrossCardPatterns` filters and returns the active patterns. Adding new patterns is appending entries to `CROSS_CARD_PATTERNS`.
- **The Simple Summary's three closing patterns are template-driven.** Don't try to make them adaptively elegant. Use 3-4 line templates with structured slots; pull slot fills from per-card outputs and detected cross-card patterns.
- **Backward compatibility for older saved sessions.** Keystone selection citation falls back to generic dimension-label prose when `answers` aren't available. Older sessions render cleanly.
- **The Q-I3 None-selected structural acknowledgment** is a careful prose move that doesn't fix the Q-I3 architecture (deferred to CC-024) but does prevent the prose from reading as gotcha. Author it carefully; it's the only Q-I3-specific prose hedge in this CC.
- **Pattern catalog quality > quantity.** 12 patterns is plenty for first ship. Resist authoring 20+ up front. Real-user testing of CC-022b will identify which patterns work and which need tuning.
- **The composition-check rule** (per `prompts/queued/Q-I3-restructure-notes.md`): when authoring new patterns, verify the framing composes with the source card's semantics. Q-I2's pattern-style works because *"could revise"* composes with *"trust source."* Q-I3's pattern-style would fail because *"would risk losing"* doesn't compose with *"sacred value."* Apply the same check to every pattern.
- **Browser smoke deferred to Jason.** Engine-level verification covers correctness (prose appears in the right places; demographic-blind derivation preserved; no regressions). UX/visual verification of how the new prose feels in real-user testing is Jason's after CC-022b lands.
