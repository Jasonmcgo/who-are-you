# CC-022 — Engine Prose v2 + Test Flow Restructure (Name + Demographics + Keystone Citation + Cross-Card Patterns + Simple Summary + Second-Pass Reorder + Save-Before-Portrait + Scroll Fix)

## Launch Directive

You are executing CC-022. This CC bundles two related but distinct architectural shifts:

**A. Engine Prose v2** — five capabilities added to the prose-generation layer:

1. **Name threading** — the user's specified name is woven through the Mirror prose where it personalizes the read (per `demographic-rules.md` Rule 4 amendment, 2026-04-26).
2. **Demographic-aware contextual interpolation** — profession, marital status, and age decade interpolate into already-relevant prose surfaces (Path · Gait Work, Love, and Weather sections).
3. **Keystone Reflection selection citation** — instead of summarizing the Keystone with generic dimension labels (*"rigid"* / *"open"* / *"value_domain: Truth"*), the prose cites the user's actual Q-I2 and Q-I3 selections back to them by the source-question labels (their own top-3 trust sources from Q-X3 + Q-X4; their own top-3 sacred drivers from Q-S1 + Q-S2). The user sees their own self-named priorities reflected in the read.
4. **Cross-card pattern surfacing** — an initial catalog of 8-12 canonical cross-card patterns (Faith ↔ Supernatural, Justice ↔ System, Truth ↔ Conviction-posture, Family ↔ Allocation, etc.) detected at prose-generation time and surfaced as specific paragraphs in the relevant card sections. These are the matrix-model insights that distinguish the engine's read from a generic personality summary.
5. **Simple Summary closing section** — a new synthesis paragraph at the end of the Mirror that pulls the eight cards into one cross-card read, ending with the *"To keep X without Y"* parallel-line pattern that closed Madison's LLM rewrite well.

**B. Test Flow Restructure** — three architectural changes to the test-flow sequence:

6. **Second-pass trigger relocated** from post-Keystone to post-Allocation / pre-Keystone. Skipped questions get a second pass *before* the Keystone block, so Q-I2's derivation from Q-X3+Q-X4 and Q-I3's derivation from Q-S1+Q-S2 always have the cleanest possible parent data.
7. **Save-before-portrait flow inversion** — the Identity & Context page (demographics) renders *before* the InnerConstitution, and the user must complete the save flow (with demographics specified or all marked `prefer_not_to_say` / `not_answered`) before the portrait renders. This is a research-mode posture: every interview produces a saved session with associated demographics. Future public-release work may revert this.
8. **Identity & Context scroll-to-top fix** — currently the page mounts with scroll position at the bottom; should mount at top so the user reads from the page header downward.

The two shifts share a common architectural foundation: **demographics are known to the engine before the portrait renders.** That eliminates the CC-020 `submittedDemographics` deviation (which was the workaround for getting demographics back to the portrait after the user saved them). Now demographics arrive natively, and the prose-generation work in items 1-5 has clean inputs throughout.

The motivation is strategic: the project deliberately defers automated LLM substitution (CC-???-future) until the rule-based engine output is rich enough that an LLM would only need to *polish prose*, not *manufacture insight*. CC-022's prose work makes the engine's output specifically smarter rather than offloading insight-generation to a vendor LLM. The flow restructure ensures the engine has the demographic inputs needed to deliver on the prose work's promise.

**Hard architectural constraint preserved**: the **derivation layer** (signal extraction, tension detection, per-card structural derivation) remains demographic-blind per `demographic-rules.md` Rule 4. Demographics enter only at the **prose-generation layer** for interpolation. Two users with identical answer arrays but different demographics still produce identical derived InnerConstitution structures; the prose's surface threading is the only difference.

Sequenced after CC-021c-hotfix lands. Independent of any pending visual-design or vendor-setup work.

## Bash Authorized

Yes. Use the shell freely for `tsc`, `eslint`, dev-server smoke runs, and any inspection scripts you need. Do not commit or push.

## Execution Directive

### Item 1 — Name threading throughout the Mirror

**Architectural shape**: prose-generation functions accept an optional `demographics?: DemographicSet` parameter and use it to interpolate the user's name where prose currently uses *"You"* / *"Your"*.

**Files affected**: `lib/identityEngine.ts`, `lib/beliefHeuristics.ts`, `app/components/MirrorSection.tsx`, `app/components/MapSection.tsx`, `app/components/InnerConstitutionPage.tsx`, `app/admin/sessions/[id]/page.tsx`.

**Helper function** in `lib/identityEngine.ts`:

```ts
export function getUserName(demographics?: DemographicSet | null): string | null {
  if (!demographics) return null;
  const name = demographics.answers.find((a) => a.field_id === "name");
  if (!name || name.state !== "specified" || !name.value || !name.value.trim()) return null;
  return name.value.trim();
}
```

**Usage pattern** (rule of thumb): when prose currently begins a sentence with *"Your"* or *"You"*, and the prose is structurally a per-user reflection, the prose generator may substitute the name. Thread sparingly — every paragraph using the name reads as forced; one or two anchor uses per major section reads as personalized.

Concrete substitutions (examples, not exhaustive):

- Mirror's `Core Pattern` opener: *"The pattern you keep living inside..."* → *"The pattern Madison keeps living inside..."* (when name available; falls back to "you" otherwise).
- Compass card's `cardHeader`: *"When something has to give, you appear to protect..."* → *"When something has to give, Madison appears to protect..."*.
- Path · Gait Work opener: *"Work, for this shape, runs on..."* → no change (the prose isn't second-person there; leave as-is).
- Conviction card `postureSentence`: *"Under cost, your belief tends to hold..."* → *"Under cost, Madison's belief tends to hold..."*.

**Critical fall-back rule**: every name-threaded sentence must have a name-less fallback that reads cleanly when `getUserName` returns null. Do NOT produce sentences that depend on the name being present (no *"As {name},..."* templates that read awkwardly when name is missing). The simplest pattern is a small helper:

```ts
function nameOrYour(demographics?: DemographicSet | null, capitalized = false): string {
  const name = getUserName(demographics);
  if (name) return capitalized ? name : `${name}'s`;     // proper noun
  return capitalized ? "You" : "your";                    // pronoun fallback
}
```

Use this at sentence-construction time. The prose reads naturally either way.

**Threading frequency target**: ~1-2 name uses per Mirror section, ~3-4 name uses per Map card. Aim for personalization without over-saturation. If you find yourself threading the name into every sentence of a paragraph, dial back.

**Pass-through**: `app/page.tsx` already threads `submittedDemographics` to `InnerConstitutionPage` (CC-020 deviation). `InnerConstitutionPage` needs to pass it down to `MirrorSection` and `MapSection`. The admin detail page (`app/admin/sessions/[id]/page.tsx`) needs to pass the saved session's demographics to `InnerConstitutionPage` (currently passes only the InnerConstitution itself).

### Item 2 — Demographic-aware contextual interpolation

Profession, marital status, and age decade are interpolated into specific prose surfaces where they're structurally relevant. Age decade and marital status are lighter-touch; profession is the most consequential.

**Profession in Path · Gait Work** (`derivePathExpansion` or wherever Path · Gait Work prose is generated):

When `demographics.profession_state === "specified"`, after the existing Work prose, append a single sentence that interpolates the profession label:

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

If the user's profession matches a key, append a hook sentence: *"This shape sits inside {hook}, which {brief note tied to the user's actual top values / Lens / Conviction}."* The prose generator picks the hook based on the user's structured-source data, not from canned text.

If the user's profession is `"other"` with `other_text`, surface the `other_text` value (capitalize and reflect it back without text-mining the substance).

If the user's profession is `prefer_not_to_say` or `not_answered`, the existing Work prose runs unchanged.

**Marital status in Path · Gait Love** (lighter touch):

When `demographics.marital_status_state === "specified"`, the Love section's prose may reference the relational context once. Three meaningful interpolations:

- `married` / `partnered` → *"A long-term partnership amplifies the steady-presence pattern this shape carries into love."*
- `single` → *"In single life, the love-shape this card surfaces shows up in friendships, family, and chosen kin more than in romantic pairing."*
- `divorced` / `widowed` → tread carefully; surface only when the prose is already structurally about the relational past, never as a default. Lean: skip unless a clear hook exists.

**Age decade in Weather** (lightest touch):

When `demographics.age_state === "specified"` and the Weather card's read is already about formation context, the prose may reference the decade once. Example: *"Someone shaped in the {decade} read against a particular cultural baseline — the formation patterns that produced steadiness or unsteadiness in that era."*

This is the lightest-touch interpolation and easiest to skip if the prose feels forced. Use sparingly.

**The hard rule for all three**: interpolation reflects what the user supplied. It NEVER infers, NEVER asserts cultural-archetype claims (*"In your generation, people tend to..."*), NEVER prescribes behavior based on demographic membership.

### Item 3 — Keystone Reflection selection citation

This is the load-bearing item from real-user testing. Madison's actual Q-I2 / Q-I3 selections need to appear in the Keystone Reflection prose by their source-question labels — not summarized as derived dimensions only.

**Files affected**: `lib/beliefHeuristics.ts`.

**Current state**: `generateBeliefContextProse(belief, valuesPhraseFromCompass)` produces prose like *"Your selections show one or two sources that could change your mind — open within a narrower frame."* — generic, derived-dimension-only.

**Target state**: the prose generator accepts the `Answer[]` array (or specifically the Q-I2 and Q-I3 answers) and cites the user's actual selections back by source-question label.

**Helper function** in `lib/beliefHeuristics.ts`:

```ts
export function summarizeQI2Selections(answers: Answer[]): {
  selectedSources: string[];          // e.g., ["Education", "Press", "Own counsel"]
  noneSelected: boolean;
  hasOther: boolean;
  topAvailable: string[];             // the 6 items the user was offered
} | null {
  const qi2 = answers.find(
    (a) => a.question_id === "Q-I2" && a.type === "multiselect_derived"
  );
  if (!qi2 || qi2.type !== "multiselect_derived") return null;
  // Walk qi2.selections + qi2.derived_item_sources to produce
  // human-readable labels for the user's actual selections
  // and the full set of items they were offered.
  // ... implementation reads from data/questions.ts item labels via a lookup
}
```

Same shape for `summarizeQI3Selections`.

**Prose form** (replacing the current generic `postureLine`):

When `summarizeQI2Selections` returns non-null:

- If `noneSelected`: *"Of the six trust sources you ranked highest — {topAvailable joined with commas} — you marked None as having the power to revise this belief. The belief is held against the full revision space you yourself named as most credible."*
- If 1 source selected: *"Of the six trust sources you ranked highest — {topAvailable} — you marked one ({selectedSources[0]}) as potentially capable of revising this belief. The belief is mostly closed; one named exit remains."*
- If 2 sources selected: *"Of the six trust sources you ranked highest, you marked two ({selectedSources[0]} and {selectedSources[1]}) as potentially capable of revising this belief — held with care, but not closed."*
- If 3+ sources selected: *"Of the six trust sources you ranked highest, you marked {selectedSources.length} ({joined list}) as potentially capable of revising this belief. The belief is held with conviction but with multiple revision paths kept open."*

When name is available, substitute *"Madison's"* / *"Madison ranked"* etc. per Item 1's threading.

Same structural form for Q-I3 selections — instead of *"Of the six trust sources..."*, it's *"Of the six sacred drivers you ranked highest..."* and instead of *"could change your mind"*, it's *"you would risk losing for this belief"*.

**Integration with the current `generateBeliefContextProse`**: extend the function signature to accept `answers: Answer[]` (or just the Q-I2 / Q-I3 answers as an extracted bundle). The existing three-line prose (valueOpener, temperatureLine, postureLine) is augmented with the selection-citation paragraph. The closing protected line (*"The model does not judge whether this belief is correct..."* / *"Your shape places this belief inside what you protect, not outside it."*) stays verbatim.

**Backward compatibility**: when `answers` is not passed (e.g., older saved sessions whose schema didn't preserve the Q-I2/Q-I3 selection details), fall back to the current generic dimension-label prose. The new prose is an *enhancement* when data is available, not a replacement that breaks old sessions.

### Item 4 — Cross-card pattern catalog

**New canon doc**: `docs/canon/cross-card-patterns.md`. Documents the architectural primitive (cross-card patterns) and the initial catalog.

**New code surface** in `lib/identityEngine.ts`:

```ts
export type CrossCardPattern = {
  pattern_id: string;
  name: string;
  description: string;
  applicable_card: ShapeCardId;             // where the prose is inserted in the Mirror
  detection: (signals: Signal[]) => boolean;
  prose: (
    signals: Signal[],
    topCompass: SignalRef[],
    topGravity: SignalRef[],
    demographics?: DemographicSet | null
  ) => string;                              // returns the templated paragraph when active
};

export function detectCrossCardPatterns(
  signals: Signal[],
  topCompass: SignalRef[],
  topGravity: SignalRef[],
  demographics?: DemographicSet | null
): { pattern: CrossCardPattern; prose: string }[] {
  return CROSS_CARD_PATTERNS
    .filter((p) => p.detection(signals))
    .map((p) => ({ pattern: p, prose: p.prose(signals, topCompass, topGravity, demographics) }));
}
```

**Initial catalog (the 8-12 patterns)**:

1. **Faith ↔ Supernatural distinction**: high `faith_priority` (Q-S2 rank 1 or 2) + low `supernatural_responsibility_priority` (Q-C4 rank 4 or 5). Prose surfaces in **Compass card**: *"Faith appears to function less as an escape hatch from responsibility and more as an orienting trust. {Name?} may believe in what is beyond human control without using it to excuse what remains within human responsibility."*
2. **Justice ↔ System attribution**: high `justice_priority` + high `system_responsibility_priority`. Prose in **Gravity card** or **Compass**: *"Your sense of justice operates against the structures more than against the individuals — this often shows up as advocacy work, systemic critique, or the kind of attention that seeks the source of the harm rather than the surface of it."*
3. **Truth ↔ private-under-threat**: high `truth_priority` + concealing/private Conviction posture. Prose in **Conviction card**: *"Your commitment to truth coexists with caution about expressing it publicly. The truth you protect may live inwardly more than visibly — a conviction kept rather than declared."*
4. **Freedom ↔ Order tension**: high `freedom_priority` + high `order_priority` (or `stability_priority`). Prose in **Compass card**: *"You appear to protect both freedom and order — these often live in tension. The shape of how you hold both is one of the more telling things this card surfaces."*
5. **Family ↔ Money allocation gap**: high `family_priority` (Q-S2) + family low in Q-S3-cross top-2. Prose in **Compass card** (NOT Allocation Gaps — that's where T-013 fires; this one is the Compass-side reflection of the same pattern): *"You named Family as among your most sacred values. The allocation card surfaces a gap between that ranking and where your discretionary money currently flows — a gap the model surfaces but does not adjudicate."*
6. **Knowledge ↔ Education trust**: high `knowledge_priority` + high `education_trust_priority`. Prose in **Trust card**: *"Your trust in education aligns with your sacred ranking of knowledge — the institutions you trust most are the ones whose work matches what you protect."*
7. **Loyalty ↔ Family / Partner**: high `loyalty_priority` + high `family_trust_priority` or `partner_trust_priority` from Q-X4. Prose in **Trust card**: *"Loyalty operates as both a sacred value you protect AND the kind of trust you extend most readily — these reinforce each other in the shape of how you commit."*
8. **Stability ↔ Chaos formation**: high `stability_priority` + `chaos_exposure` from Q-F2. Prose in **Weather card**: *"The stability you protect now may be a deliberate response to early uncertainty. What you protect is sometimes shaped by what you didn't have."*
9. **Pattern-reader Lens ↔ low present-tense action**: dominant `ni` or `ne` + `reactive_operator` from Q-A1 (or related under-load patterns). Prose in **Lens card**: *"The pattern-reader gift can produce paralysis when the patterns multiply faster than action. {Name?} may need to choose ground that's good enough rather than waiting for the optimal pattern to land."*
10. **Costly conviction without revision**: `holds_internal_conviction` + Q-I2's `belief_impervious` MetaSignal. Prose in **Conviction card**: *"Your willingness to bear cost for belief comes paired with a closed revision path — neither alone is the full shape; together they describe a conviction that has chosen its room and may stop testing whether the room was rightly chosen."*

The exact prose for each pattern stays in the catalog. These are templated; demographics-aware via the `name?` interpolation per Item 1.

The catalog can grow over time. Initial 8-10 is enough for the first ship; future patterns land in subsequent CCs.

**Integration into Mirror render**: `MirrorSection.tsx` (or the per-card output generators) checks each card's `applicable_card` against the patterns detected; when a pattern fires for that card, its prose is inserted into the card's section in the Mirror. The integration is additive — pattern prose appears alongside existing Strength/Trap/Next move on the Map cards, or as additional paragraphs in the Mirror's per-card section.

### Item 5 — Simple Summary closing section

**New section in the Mirror**, positioned after the *Open Tensions* list (or after the Map if Open Tensions is collapsed). Synthesizes the eight cards into one cross-card paragraph and ends with the *"To keep X without Y"* parallel-line pattern.

**New function** in `lib/identityEngine.ts`:

```ts
export function generateSimpleSummary(
  constitution: InnerConstitution,
  demographics?: DemographicSet | null
): string;
```

**Output shape**: 4-7 sentences. Pulls from:

- The InnerConstitution's `lens_stack.dominant` + `auxiliary` (the user's primary processing pattern).
- The `top_compass` (what they protect).
- The Conviction posture (how they hold belief).
- The dominant tension or two (which gaps the engine surfaced).
- The user's name (when available).

**Structural close**: 3-4 *"To keep X without Y"* parallel lines, drawn from the user's specific patterns. Example template:

> *"{Name's} shape is one of {synthesized identity — e.g., 'depth, possibility, conviction, and endurance'}. The growth path is not to become someone else; it is to become more grounded, more legible, and more free inside the person {name} already is.*
>
> *To keep {their dominant gift} without losing {its corresponding trap}.*
> *To keep {their conviction posture} without becoming {its hardened form}.*
> *To keep {their core compass value} without losing {what its over-protection costs}.*
> *To keep {their endurance pattern} without {its over-carrying form}."*

The closing couplet (Madison's rewrite version): *"{Name's} gift may be that {they} can {dominant capacity}. {Name's} challenge may be remembering that {dominant capacity} does not mean {dominant trap}."*

The summary is templated, not LLM-generated. Specific phrases pull from per-card outputs and the cross-card patterns detected.

**Integration**: `MirrorSection.tsx` adds a new section block at the end (before the Open Tensions list, or as a sibling depending on layout). Visual register: italic subtitle (*"a synthesis"*), then the synthesized prose, then the parallel lines + couplet.

### Item 6 — Second-pass trigger relocation

**Files affected**: `app/page.tsx`.

**Current state**: CC-014's second-pass mechanism fires after the user reaches the end of the entire question flow. With CC-018b's question reorder, "the end" is now after Q-I3 (the last Keystone question). This means a user who skipped Q-X3 reaches the Keystone block (Q-I2 derives from Q-X3), produces a degraded Q-I2 cascade-skip, and only then is offered the second pass to recover Q-X3 — too late to feed the Keystone block.

**Target state**: the second-pass trigger fires after **Q-E1-cross** (the last question in the Allocation block) and before **Q-I1** (the first Keystone question). Skipped questions get a second pass before the Keystone block runs, so Q-I2 / Q-I3 always derive from complete (or explicitly second-skipped) parent data.

**Implementation**: in `app/page.tsx`'s `advanceFromIndex` function, detect the post-Allocation / pre-Keystone boundary. When the user advances past Q-E1-cross (the last allocation question) and Q-I1 would be next:

- If `skippedQuestionIds.length > 0`, transition to `phase: "second_pass"` instead of advancing to Q-I1.
- When the second pass completes (all skipped questions either resolved with answers or double-skipped), advance to Q-I1.

The boundary is detectable by checking whether the next question's `card_id` would be `conviction` or `pressure` AND its `question_id` matches `Q-I1`, OR equivalently: the current question is `Q-E1-cross` and there are skipped question_ids in the queue.

**The second-pass mechanism itself is not modified.** The CC-014 single-pick render with examples, the meta-signal `question_double_skipped`, the second-pass page UI — all stay as-is. Only the trigger boundary moves.

**Edge cases to verify**:
- A user who skipped no questions: advance directly from Q-E1-cross to Q-I1 (no second-pass detour). Same behavior as today.
- A user who skipped questions across multiple cards (e.g., skipped Q-X3 AND Q-A1): all skipped questions get the second pass before any Keystone work begins.
- A user who skipped Q-I1 itself: this case doesn't change behavior. Q-I1 is reachable only AFTER the second pass completes, so a Q-I1 skip is its own thing handled by the existing CC-017 Q-I1b conditional render.
- A user who skipped a question and double-skips it on second pass: meta-signal `question_double_skipped` fires; advance to Q-I1 anyway.

### Item 7 — Save-before-portrait flow inversion

**Files affected**: `app/page.tsx`, `app/components/IdentityAndContextPage.tsx`, `app/components/InnerConstitutionPage.tsx`, `lib/saveSession.ts`.

**Current state** (CC-019's flow): user completes test → InnerConstitution renders → user sees portrait → optional Save button below result → clicking Save opens Identity & Context page → demographics filled → DB write.

**Target state** (research-mode flow): user completes test → Identity & Context page renders → user fills demographics (or marks all `prefer_not_to_say` / leaves all `not_answered` via Skip) → Save fires (writes session + demographics atomically) → InnerConstitution renders WITH demographics-aware prose.

**Implementation in `app/page.tsx`**:

- The phase machinery extends with the implicit ordering: after Q-I3 completes (final Keystone question), transition to `phase: "identity_context"` automatically — no intermediate prompt asking *"would you like to save?"*
- The Identity & Context page's submit handler triggers the database write via `saveSession`, then transitions to `phase: "result"` on success.
- The `phase: "result"` rendering passes the just-saved demographics (now in component state from the just-completed Identity & Context fill) into `InnerConstitutionPage` via the existing `demographics` prop.
- The `InnerConstitutionPage`'s Save block (the *"would you like to save this reading?"* prompt block) is removed. The session is already saved by the time this page renders.

**Implementation in `app/components/IdentityAndContextPage.tsx`**:

- The page already exists from CC-019. Modify its submit handler so success transitions directly to the result phase (in current code, it already does this — verify behavior).
- The page header copy may need updating to reflect the new flow ("Before we share your reading, tell us a little about who you are" rather than "Now that you've seen your reading, would you tell us...").
- The "Skip — save without these" affordance still produces a valid save (session row + demographics row with all fields `not_answered`), and after that save the user proceeds to the portrait. *"Skip"* in this context means *"skip the demographic fields"*, not *"skip the save."*

**Implementation in `app/components/InnerConstitutionPage.tsx`**:

- Remove (or hide via prop) the *"Save this reading?"* block. The Share block (CC-020) stays — users can still print or export their reading after viewing.
- The component continues to accept the `demographics` prop for prose interpolation (Items 1-2 in this CC).
- The CC-020 deviation in `app/page.tsx` (`submittedDemographics` state) is no longer needed as a workaround — demographics flow naturally through the new phase ordering. The state variable can stay (cleanup is non-essential) but the `submittedDemographics` is now equivalent to what `app/page.tsx` always has at the time `phase === "result"`.

**Implementation in `lib/saveSession.ts`**: no signature change. The function already accepts demographics and writes both rows atomically. Just called earlier in the flow now.

**Backward compatibility**: this CC changes user-facing behavior. Anyone with a session in mid-flow at the time of deploy will see the new flow on next render. No persisted state breaks; the database schema is unchanged.

### Item 8 — Identity & Context page scroll-to-top fix

**File affected**: `app/components/IdentityAndContextPage.tsx`.

**Current state**: when the page mounts, the scroll position lands at the bottom (likely because the Save button at the bottom of the form auto-focuses, pulling browser scroll to the focused element).

**Target state**: page mounts with scroll position at the top so the user reads from the page header downward.

**Implementation**: add a `useEffect` on mount that explicitly scrolls to top, and disable any auto-focus behavior on submit-area buttons that would pull scroll. The simplest fix:

```tsx
useEffect(() => {
  // Reset scroll on mount; the form's submit buttons should not auto-focus.
  window.scrollTo({ top: 0, behavior: "instant" });
}, []);
```

Plus: verify no input or button has `autoFocus` on it, since `autoFocus` triggers browser scroll-into-view. If any does, remove it.

If the scroll-to-bottom is happening because of `aria-live` or another accessibility behavior, the fix may need to be more nuanced — but the `useEffect` + `autoFocus` audit usually closes it.

### Item 9 — Canon updates

**`docs/canon/cross-card-patterns.md`** — NEW. Documents:

- The architectural primitive (cross-card pattern detection at prose-generation time, not at derivation time — the patterns consume signals that already exist; they don't add new signals).
- The initial 8-10 patterns with their detection rules + prose templates.
- The rule that pattern catalogs grow over time and that future patterns land in subsequent CCs without breaking existing detections.
- Cross-references to `result-writing-canon.md` (for the Five Dangers / protected lines that pattern prose must honor) and `demographic-rules.md` (for the Rule 4 amendment that permits demographic interpolation in pattern prose).

**`docs/canon/result-writing-canon.md`** — append a section documenting the new prose primitives:

- Name threading and the `nameOrYour` helper pattern.
- Demographic-aware interpolation (per the amended Rule 4).
- Keystone Reflection selection citation as the canonical form.
- Cross-card patterns as a new prose-layer architectural primitive.
- Simple Summary as a structural close.

The protected lines from earlier CCs stay verbatim. New prose primitives are additive.

**`docs/canon/demographic-rules.md` Rule 5 amendment** — research-mode posture:

The current Rule 5 ("Local-first, opt-in to save") needs amendment to permit the new flow. Add an amendment block (similar to Rule 4's amendment block) that documents the research-mode shift while preserving the local-first principle:

```markdown
## Rule 5 — Local-first, save-required for research mode (amended 2026-04-26)

The persistence layer ships local-first: it connects to a Postgres database running on `localhost:5432` via the user's `DATABASE_URL` environment variable. The same code works against a hosted Postgres provider by changing only the connection string. No cloud-specific logic in this codebase as of CC-022.

For **research mode** (the current architectural posture, where every interview produces a saved session and the engine uses demographic context to enrich the rendered prose), the Save flow is **required before the InnerConstitution renders**. The user fills the Identity & Context page (any subset of fields, with `prefer_not_to_say` available per Rule 1) and the save commits before the portrait shows. This ensures every saved session has a paired demographics row and that the engine has demographic context available for prose interpolation.

For a **future public release**, this posture will likely revert: the portrait renders first, save is opt-in afterward, and the demographic-aware prose interpolation handles the no-demographics case gracefully (falling back to the un-personalized "Your" / "You" form). When that release lands, this rule's amendment is reversed and the CC that does the reversal carries the canonical record of the flow change.

The hard rules around save:

- A user who completes the test must complete the Identity & Context page (with any combination of specified / prefer_not_to_say / not_answered fields) before the portrait renders.
- The "Skip — save without these" affordance produces a valid demographics row with all fields `not_answered` — and the portrait still renders. "Skip" means "skip the demographic disclosure," not "skip the save."
- Closing the browser mid-flow on the Identity & Context page leaves no rows. The atomic transaction (sessions row + demographics row) commits only on explicit click.
- Local-first is preserved: no third-party services receive the data, no cloud-side persistence ships in this CC.
```

The Implementation surfaces table for Rule 5 should be updated to reflect the new flow:

```markdown
| Rule 5 (local-first, save-required for research mode) | `app/page.tsx` (phase machinery transitions test → identity_context → result, with save firing during the identity_context → result transition); `lib/saveSession.ts` (server action runs on Identity & Context submit); `db/index.ts` (lazy connection — dev server boots cleanly without DATABASE_URL). Future public-release reversion: `phase: "identity_context"` becomes optional after `phase: "result"` rather than gating it. |
```

The protected lines from earlier CCs stay verbatim. New rule amendments are additive and clearly dated.

## Allowed-to-Modify

- `lib/identityEngine.ts` — add `getUserName` + `nameOrYour` helpers; add `CrossCardPattern` type + `CROSS_CARD_PATTERNS` catalog + `detectCrossCardPatterns` function; add `generateSimpleSummary`; extend per-card prose generators to accept optional `demographics?: DemographicSet`; extend `generatePathExpansion` for profession / marital status / age interpolation.
- `lib/beliefHeuristics.ts` — extend `generateBeliefContextProse` to accept `answers: Answer[]` and produce selection-citation prose; add `summarizeQI2Selections` and `summarizeQI3Selections` helpers.
- `app/components/MirrorSection.tsx` — add Simple Summary section render; thread demographics down to per-card sections.
- `app/components/MapSection.tsx` — thread demographics into per-card prose; insert cross-card-pattern prose into per-card sections where applicable.
- `app/components/InnerConstitutionPage.tsx` — pass demographics down to MirrorSection and MapSection; remove (or hide via prop) the *"Save this reading?"* block, since the save now happens before the portrait renders. The Share block (CC-020) stays.
- `app/components/IdentityAndContextPage.tsx` — update header copy to reflect pre-portrait flow; add scroll-to-top `useEffect`; audit for any `autoFocus` that pulls scroll; verify submit handler transitions to `phase: "result"` after successful save.
- `app/admin/sessions/[id]/page.tsx` — pass the saved session's demographics to InnerConstitutionPage (currently passes only the InnerConstitution itself).
- `app/page.tsx` — phase machinery: relocate second-pass trigger to post-Allocation / pre-Keystone boundary (Item 6); transition test → identity_context → result instead of test → result → optional-identity_context (Item 7); the existing `submittedDemographics` deviation from CC-020 can stay (or be cleaned up if natural — non-essential).
- `lib/saveSession.ts` — no signature change. Called earlier in the flow now; verify no behavior change is introduced.
- `lib/types.ts` — add `CrossCardPattern` type if exported; minor type touchups for prose generator signatures.
- `docs/canon/cross-card-patterns.md` — NEW canon doc.
- `docs/canon/result-writing-canon.md` — append the new prose primitives section.
- `docs/canon/demographic-rules.md` — amend Rule 5 (research-mode save-required posture, with explicit future-public-release reversion note); update the Implementation surfaces table row for Rule 5.

No other file should be modified.

## Out of Scope — explicit "do not" list

- **Do not** modify the derivation layer's signature: `deriveSignals(answers)` and `detectTensions(signals)` stay exactly as-is. Demographics never enter signal extraction or tension detection. Per `demographic-rules.md` Rule 4, the layer separation is structural.
- **Do not** modify any signal definition, MetaSignal type, or tension-detection block.
- **Do not** modify any question definition in `data/questions.ts` or any demographic field in `data/demographics.ts`.
- **Do not** add new questions, new demographics, or new structured data sources.
- **Do not** introduce LLM substitution or any vendor-API call. CC-022 is the engine-side investment that defers the LLM path; this CC stays purely rule-based.
- **Do not** modify any tension's `user_prompt` text. T-001 through T-015 prose stays as authored. Cross-card patterns are a SEPARATE prose layer that surfaces in card sections, not in the Open Tensions list.
- **Do not** modify the Open Tensions list rendering or its Yes/Partially/No affordances.
- **Do not** modify the **second-pass mechanism itself** — only its trigger boundary moves (Item 6). The second-pass page UI, the single-pick-with-examples render, the `question_double_skipped` MetaSignal — all stay as authored in CC-014.
- **Do not** modify the **save transaction shape** — `saveSession` writes both rows atomically as before (CC-019). Item 7 changes only WHEN the save fires (before portrait, not after), not HOW.
- **Do not** modify the database schema. No new tables, columns, or migrations.
- **Do not** modify the admin auth, the attachments system, or any researcher-UI surface beyond passing demographics to InnerConstitutionPage in the detail view.
- **Do not** modify the eight-card body-map structure or the Map's section list.
- **Do not** introduce visual design changes to the cards (graphics, icons, colors). Visual design lives in the parallel Claude Design Lab workstream.
- **Do not** modify the file-picker UX (the "wonky" click target reported during CC-021c-hotfix verification). That's a CC-023 polish item.
- **Do not** modify the demographic question definitions or their option lists.
- **Do not** introduce a "skip the save entirely" path. The research-mode posture per the amended Rule 5 makes save required; the user can mark every field `prefer_not_to_say` or use "Skip — save without these," but they cannot bypass the save itself.
- **Do not** modify build configuration, AGENTS.md, CLAUDE.md, or any prompt file other than this one.

## Acceptance Criteria

1. **Name threading** — open a saved session whose demographics specify a name. The Mirror's prose includes the name in 1-2 places per major section. The same session with `name_state === "prefer_not_to_say"` falls back to *"You"* / *"Your"* cleanly. No sentences read awkwardly without the name.
2. **Profession interpolation** — open a saved session whose `profession_state === "specified"`. The Path · Gait Work section's prose includes a profession-keyed sentence. Switch the same session's profession to `prefer_not_to_say` (in pgAdmin or via a smoke fixture) and confirm the existing Work prose runs unchanged.
3. **Marital status & age interpolation** — present and meaningful when specified; absent and graceful when not.
4. **Keystone selection citation** — for a session with both Q-I2 and Q-I3 answered (Madison's saved session is a candidate), the Keystone Reflection prose names the user's actual top-3 trust sources from Q-X3 + top-3 from Q-X4 in the Q-I2 citation, and the actual top-3 sacred drivers from Q-S1 + top-3 from Q-S2 in the Q-I3 citation. Generic dimension-label fallback only fires when answers are unavailable.
5. **Cross-card patterns** — for a synthetic test session that triggers each of the 8-10 catalog patterns, confirm the corresponding prose paragraph appears in the correct card section. Confirm patterns NOT in the catalog do not produce ghost prose.
6. **Simple Summary section** — a new section appears at the end of the Mirror with the synthesized 4-7 sentences + the *"To keep X without Y"* parallel lines + the closing couplet. Renders cleanly even when name is missing (falls back to "Your" / "You").
7. **Second-pass trigger relocation** — a synthetic session that skips Q-X3 (or any Trust/Compass-card question) reaches the second-pass phase BEFORE Q-I1 renders. The second-pass page renders, the user resolves or double-skips the question, and only then does Q-I1 appear. Verify by walking a smoke session that skips Q-X3 and confirming the second-pass page appears between Q-E1-cross and Q-I1 (not after Q-I3).
8. **Save-before-portrait flow** — completing a smoke session reaches the Identity & Context page DIRECTLY after Q-I3 (no intermediate "Save?" prompt block, no portrait pre-render). Filling demographics and clicking either *"Save and finish"* or *"Skip — save without these"* triggers the database write and transitions to the result phase. The InnerConstitution then renders WITH the demographics that were just saved (verify by checking the prose includes the name if specified).
9. **Identity & Context scroll-to-top** — opening the Identity & Context page in a browser shows the page header and first field at the top of the viewport, not at the bottom. Verify visually.
10. **No "Save this reading?" block on result page** — the InnerConstitution page no longer shows the optional Save affordance. The Share/Print block (CC-020) still renders.
11. **Demographic-blind derivation preserved** — for two synthetic sessions with identical answers but different demographics, the derived InnerConstitution structures are byte-identical. Only the rendered prose differs. Verify by comparing `JSON.stringify(constitution)` for both.
12. **No tension or signal regression** — T-001 through T-015 detection still produces identical results across all smoke sessions. Allocation Gaps section in the Mirror renders the same prose for the same input. The Open Tensions list is byte-identical to before this CC for any saved session.
13. **Canon docs updated** — `cross-card-patterns.md` exists with the catalog; `result-writing-canon.md` has the new prose-primitives section appended; `demographic-rules.md` Rule 5 amendment is in place with the future-public-release reversion note.
14. **Admin detail view** — opening a saved session in `/admin/sessions/[id]` renders the same prose-enhanced output the live test flow produces (with name threading, demographic interpolation, Keystone citation, cross-card patterns, Simple Summary).
15. **CC-019 / CC-020 / CC-021a / CC-021c-hotfix regressions clean** — save transaction shape unchanged; share/print flow works; admin auth + attachments work; second-pass mechanism's UI behaves correctly (only its trigger boundary moved).
16. **TSC clean.** `npx tsc --noEmit` exits 0.
17. **Lint clean.** `npm run lint` exits 0.
18. **No file outside the Allowed-to-Modify list is modified.**

## Report Back

1. **Files changed** — file-by-file summary.
2. **Name threading verification** — paste a sample Mirror prose excerpt for a session with name = "Madison", and the same excerpt for a session with `name_state = prefer_not_to_say`. Show the graceful fallback.
3. **Profession interpolation verification** — same shape; show profession threaded vs missing.
4. **Keystone citation** — for Madison's actual saved session, paste the new Keystone Reflection prose. Confirm her actual Q-I2 and Q-I3 selections appear by source-question label.
5. **Cross-card pattern smoke** — for each of the 8-10 catalog patterns, run a synthetic session that triggers it; paste the resulting card-section excerpt showing the pattern's prose appearing in the right card.
6. **Simple Summary smoke** — paste the Simple Summary for Madison's session.
7. **Second-pass trigger relocation smoke** — walk a smoke session that skips Q-X3, confirm the second-pass page renders BEFORE Q-I1 (not after Q-I3). Paste the phase-transition log if any.
8. **Save-before-portrait flow smoke** — walk a smoke session through to Q-I3, confirm the Identity & Context page renders directly (no intermediate prompt), filling demographics + clicking Save transitions to the portrait, the portrait shows the demographic-aware prose. Confirm "Skip — save without these" path also works (writes a saved session with all `not_answered`, then renders the portrait without name threading).
9. **Scroll-to-top verification** — confirm the Identity & Context page mounts with scroll position at the top. Browser smoke deferred to user; describe what was changed (the `useEffect` add, any `autoFocus` removals).
10. **No "Save this reading?" block on result page** — confirm the live InnerConstitution page does not render the Save affordance. Share/Print block still renders.
11. **Demographic-blind derivation regression** — two synthetic sessions with identical answers, different demographics. Confirm `JSON.stringify(constitution)` is byte-identical.
12. **Tension regression** — confirm T-001 through T-015 detection produces identical results pre- and post-CC.
13. **CC-019 / CC-020 / CC-021a / CC-021c-hotfix regressions** — confirm save transaction works, share/print works, admin auth + attachments work, second-pass mechanism's UI behaves correctly at its new trigger boundary.
14. **TSC + lint** — exit codes.
15. **Scope-creep check** — confirm only allowed files modified.
16. **Risks / next-step recommendations** — anything noticed during the work that warrants a follow-up CC.

## Notes for the executing engineer

- **The `nameOrYour` helper pattern is the cleanest threading approach.** It lets the prose generator construct each sentence with one helper call rather than every prose function having its own demographic-awareness logic. Use it consistently.
- **Cross-card patterns are a registry, not a dispatch tree.** Each pattern's `detection` function is pure and reads from the signals array; `detectCrossCardPatterns` filters and returns the active patterns. Adding new patterns to the catalog over time is just adding entries to the `CROSS_CARD_PATTERNS` array. Keep the registry shape simple.
- **The Simple Summary's parallel lines are template-driven.** Don't try to make them adaptively elegant by stringing together arbitrary card outputs. Use a 3-4 line template with structured slots; pull the slot fills from per-card outputs and cross-card pattern detections. The pattern is "Madison's-rewrite-shaped" but rule-based.
- **Backward-compatibility for old saved sessions.** The Keystone selection citation falls back to the current generic dimension-label prose when `answers` aren't available. Older sessions saved before the schema preserved Q-I2/Q-I3 selection details should still render cleanly, just without the citation upgrade. Verify by loading a pre-CC-022 saved session and confirming the Mirror still renders.
- **Browser smoke deferred to Jason.** Your role is to verify the engine-level correctness (prose appears in the right places; demographic-blind derivation preserved; no regressions). Visual verification of how the new prose feels in real-user testing is Jason's after CC-022 lands.
- **The cross-card pattern catalog is intentionally minimal at 8-10 entries.** Don't over-author. Real-user testing of CC-022 will identify which patterns are working and which need tuning; subsequent CCs add patterns based on observed gaps. Resist the urge to author 20+ patterns up front.
