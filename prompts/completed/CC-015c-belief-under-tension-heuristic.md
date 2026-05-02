# CC-015c — Keystone Reflection / Belief Under Tension (Hybrid Heuristic + User Confirmation)

## Goal

Promote Q-I1 / Q-I2 / Q-I3 from underused freeform answers into a **Keystone Reflection** interpretive block. After CC-015c, the engine produces a structured `belief_under_tension` object from the user's free-text belief, the change-of-mind condition, and the cost story — using deterministic heuristic extraction (no API calls, no LLM dependency) — and the renderer surfaces the structured tags inline with **edit affordances** so the user can confirm or correct each tag. Confirmed/corrected tags drive the contextual prose; unconfirmed heuristic tags are rendered with explicit hedging.

This is the **hybrid path** (Path B + user confirmation). Heuristic extraction does the first pass; the user is the final authority on whether the tags are accurate. Architecture mirrors the tension confirmation flow that already exists for tensions — same product principle: *the model proposes, the user confirms*.

Three things land together:

1. **Canon work (small):** rename the section in `question-bank-v1.md` from *Freeform Insight* to *Keystone Reflection*. Add Clarence's "do not score belief content" rule to `result-writing-canon.md`. Add the `BeliefUnderTension` type as canonical.
2. **Engine work (heuristic extraction):** add `BeliefUnderTension` type to `lib/types.ts` with both heuristic-confidence flags AND user-confirmation flags per tag. Add `extractBeliefUnderTension(answers)` function to `lib/identityEngine.ts` with keyword/pattern dictionaries for value-domain, disagreement-context, conviction-temperature, social-cost, and epistemic-posture detection. Wire into `buildInnerConstitution`.
3. **Renderer work (verbatim + interactive confirmation):** new `app/components/KeystoneReflection.tsx` component. Surfaces user's verbatim text + per-tag confirmation/edit affordances + contextual prose. If CC-015b has shipped (`MirrorSection.tsx` exists), integrate as an eighth Mirror section. If CC-015b has not shipped, integrate into `InnerConstitutionPage.tsx` between the synthesis sections and the tensions.

The interpretation is deliberately light AND user-validated. The model does NOT classify whether the belief is correct, admirable, fashionable, or morally acceptable. The model only proposes structural tags (which value it may protect, what context it strains, how convicted the wording sounds, whether the user named a cost, whether the user named conditions for changing their mind) and asks the user to confirm. All heuristic tagging is deterministic; user corrections override the heuristic. Tags surface alongside the user's verbatim text.

---

## Launch Directive (CC tool)

**Run this CC with permission-bypass at the CC tool level.**

```
claude --dangerously-skip-permissions
```

Or, mid-session, type `/permissions` and pick **bypass permissions** mode.

This CC touches `lib/types.ts` (one new type), `lib/identityEngine.ts` (extractor + dictionaries), `app/components/InnerConstitutionPage.tsx` or `app/components/MirrorSection.tsx` (renderer integration depending on CC-015b state), one new component (`app/components/KeystoneReflection.tsx`), and two canon files (one section rename plus the new rule). Per-edit approval prompts will defeat single-pass execution.

## Bash Commands Authorized

This CC will run the following bash commands without further user approval:

- `npx tsc --noEmit` — type check.
- `npm run lint` — lint check.
- `npm run dev` (if browser smoke test is performed by the agent rather than the user; otherwise the user runs this themselves).
- File-system commands: `ls`, `cat`, `grep`, `find`, `git status`, `git diff`, `awk`, `sed`, `head`, `tail`, `wc`.

The agent should not pause to ask permission for these.

---

## Execution Directive

Complete every requirement in a single pass and deliver the full report-back at the end. Do **not** pause mid-execution to ask the user for confirmation, approval, scope clarification, or any additional input.

If something is genuinely ambiguous, apply the most spec-faithful interpretation and flag the decision in Risks / next-step recommendations. Do not halt.

If a prerequisite appears missing (especially: if CC-015b has not yet shipped and `MirrorSection.tsx` does not exist), use the fallback integration path per § D-7. Do not stop.

---

## Read First (Required)

**Canon (read; canon edits are scoped per § Allowed to Modify):**

- `docs/canon/result-writing-canon.md` — adds Clarence's "do not score belief content" rule per § D-2 below. Read first to understand the existing structure; the new rule joins as a new section.
- `docs/canon/question-bank-v1.md` — Q-I1 / Q-I2 / Q-I3 currently sit in the "Freeform Insight" section. CC-015c renames the section to "Keystone Reflection" per § D-1. Question text and signals stay verbatim.
- `docs/canon/inner-constitution.md` — for context on where Keystone Reflection fits in the rendered output. Do NOT edit.
- `docs/canon/shape-framework.md` — the eight cards. Q-I1/I2/I3 cross-card relevance per Clarence's framing (Speak, Heart, Listen, Fire, Lens) is interpretive context only; CC-015c does not modify the canonical card structure.
- `docs/canon/signal-library.md` — the existing `independent_thought_signal`, `epistemic_flexibility`, `cost_awareness` signals from Q-I1/I2/I3 are unchanged. CC-015c does NOT replace or deprecate them. The new `BeliefUnderTension` interpretive object is additive.

**Reference (read; do NOT edit):**

- `docs/canon/temperament-framework.md` — for understanding which cognitive function patterns relate to epistemic posture markers.

**Existing code (read; will be edited):**

- `lib/types.ts` — adds `BeliefUnderTension` type. Existing types preserved.
- `lib/identityEngine.ts` — adds `extractBeliefUnderTension`, pattern dictionaries, integration into `buildInnerConstitution`. Existing functions preserved.
- `app/components/InnerConstitutionPage.tsx` — integrate `<KeystoneReflection>` per § D-7 (fallback path if CC-015b hasn't shipped). Otherwise unchanged.
- `app/components/MirrorSection.tsx` — only if CC-015b has shipped: add the new eighth section per § D-7. Read to verify file exists.

**Existing code (do NOT edit):**

- `lib/identityEngine.ts` — preserve `signalFromAnswer`, `signalsFromRankingAnswer`, `extractFreeformSignals`, `deriveSignals`, `detectTensions`, `applyStrengtheners`, `deriveCoreOrientation`, `deriveSacredValues`, `aggregateLensStack`, all per-card derivation functions, all cross-card synthesis functions, `toAnswer`, `toRankingAnswer`, `strengthForRank`, `has`, `hasFromQuestion`, `hasAtRank`, `cardFor`, `ref`, `signalFromSinglePick`, all `SIGNAL_DESCRIPTIONS`, `SACRED_PRIORITY_SIGNAL_IDS`, `STRENGTHENERS`, `STACK_TABLE`, `MBTI_LOOKUP`, `FUNCTION_VOICE`, `FUNCTION_VOICE_SHORT`, `UNDER_PRESSURE_BEHAVIOR`, `TOP_RISK_CARD_FALLBACK`, `BLIND_SPOT_TEXT_VARIANTS`, `valueListPhrase`, plus any CC-015b additions like `generateMirror`, `generatePressureSection`, `generateNextMoves`, `generatePathExpansion`. CC-015c is additive; do not modify any existing function or constant.
- `app/components/Ranking.tsx`, `app/components/QuestionShell.tsx`, `app/components/ProgressIndicator.tsx`, `app/components/ShapeCard.tsx`, `app/components/TensionCard.tsx`, `app/components/MbtiDisclosure.tsx`, `app/components/SinglePickPicker.tsx`, `app/components/SecondPassPage.tsx`, `app/components/MapSection.tsx` (if exists), `app/components/PathExpanded.tsx` (if exists).
- `data/questions.ts`.
- Any tension detection block.
- Any signal definition.

---

## Context

The Q-I1/I2/I3 questions are the most reflective questions in the assessment. The user does substantial work to answer:

- Q-I1: *"What is something you believe that most people around you disagree with?"*
- Q-I2: *"What would change your mind about that belief?"*
- Q-I3: *"Have you ever paid a cost for a belief? What happened?"*

But the engine currently does almost nothing with the answer beyond firing one keyword-derived signal (`independent_thought_signal` from Q-I1, `epistemic_flexibility` from Q-I2, `cost_awareness` from Q-I3). The reflection's information value is captured in the user's prose itself; the engine never surfaces it back.

Clarence's framing names this gap: Q-I1 is not a Conviction-only question. It touches **Speak** (the user named a conviction at all), **Heart** (the value protected), **Listen** (whose disagreement was named), **Fire** (whether cost was named), and **Lens** (how the user reasons about the belief). Q-I2 reveals epistemic posture. Q-I3 reveals lived consequence. The triad together is one of the strongest interpretive units in the model.

Path B (heuristic extraction) is what CC-015c implements:

- Pattern-match the user's free text against curated lexicons.
- Produce a structured `BeliefUnderTension` object with rough but honest tags.
- Render the tags alongside the user's verbatim text.
- Do NOT judge the content; do NOT classify the belief as right/wrong.

This is deterministic. Ships immediately. No API costs. No latency. Privacy-preserving (data stays in-memory).

The interpretive limit: heuristics are imprecise. A user who writes *"I believe the system is broken in ways most people prefer not to see"* might tag as `truth`-domain (because of "see") or `unknown` (because no canonical value word appears). The renderer handles low-confidence tags with grace — defaulting to *"the belief you named"* without specific value-domain claims when confidence is low.

Future enhancements (out of scope for CC-015c): hybrid heuristic + user confirmation (let the user correct the tags), curated pattern library expansion (~500 value patterns instead of the starter ~50), or LLM-driven extraction (Path A) when persistence + API integration land.

---

## Decisions Locked in This Prompt

These are decisions made at prompt-authorship time so the executing agent does not have to make them.

### D-1: Section rename in `question-bank-v1.md`

The section currently named *"Freeform Insight"* (or however it's labeled in `question-bank-v1.md` — the agent verifies) becomes *"Keystone Reflection"*.

The Q-I1, Q-I2, Q-I3 question entries themselves (text, signals, helper, etc.) stay byte-identical. Only the section heading changes. If the section heading exists as a markdown `## Freeform Insight` line, change to `## Keystone Reflection`.

Add a one-line section description below the heading:

> *"Three short reflective questions. The model treats the answers as a Belief Under Tension probe — a stress test for whether the user can name a conviction, articulate what would revise it, and recall what it has cost. The model does not score the answers by content."*

### D-2: New canon rule in `result-writing-canon.md`

Append a new section to `docs/canon/result-writing-canon.md`. Title: *"Belief content rule (CC-015c)"*. Body verbatim:

> *"Freeform belief questions do not directly score the user by content. The model does not judge whether the stated belief is correct, admirable, fashionable, or morally acceptable. The model interprets only the role the belief plays in the user's shape: what value it may protect, what cost it carries, what community it strains, and what evidence or experience could revise it. The user's stated belief surfaces only verbatim or with minimal paraphrase. Any tagging produced by heuristic extraction is structural metadata about the belief's role, not a verdict on its content."*

This rule binds every future CC that touches Keystone Reflection prose.

### D-3: `BeliefUnderTension` type

Add to `lib/types.ts`:

```ts
export type ValueDomain =
  | "truth" | "freedom" | "loyalty" | "justice"
  | "faith" | "stability" | "knowledge" | "family"
  | "unknown";

export type DisagreementContext =
  | "family" | "friends" | "workplace" | "culture"
  | "religious_community" | "political_tribe" | "unspecified";

export type ConvictionTemperature = "low" | "moderate" | "high";
export type SocialCost = "none_named" | "implied" | "explicit";
export type EpistemicPosture = "open" | "guarded" | "rigid" | "reflective" | "unknown";

export type BeliefUnderTension = {
  stated_belief: string;             // user's verbatim Q-I1 answer
  change_condition: string;          // user's verbatim Q-I2 answer
  cost_story: string;                // user's verbatim Q-I3 answer

  // Heuristic-derived tags (initial draft, may be overridden by user):
  likely_value_domain: ValueDomain;
  disagreement_context: DisagreementContext;
  conviction_temperature: ConvictionTemperature;
  social_cost: SocialCost;
  epistemic_posture: EpistemicPosture;

  // Heuristic confidence flags — true when extraction has ≥2 distinct phrase matches
  // OR ≥1 very-strong phrase match. Low-confidence tags render with explicit hedging
  // until user confirms.
  value_domain_confident: boolean;
  context_confident: boolean;
  temperature_confident: boolean;
  cost_confident: boolean;
  posture_confident: boolean;

  // User-confirmation flags — true once the user has explicitly confirmed or corrected
  // the tag. Confirmed tags drive the contextual prose without hedging.
  // Until confirmed, the tag is treated as a heuristic guess.
  value_domain_user_confirmed: boolean;
  context_user_confirmed: boolean;
  temperature_user_confirmed: boolean;
  cost_user_confirmed: boolean;
  posture_user_confirmed: boolean;
};
```

Extend `InnerConstitution`:

```ts
export type InnerConstitution = {
  // existing fields preserved verbatim, including any CC-015b additions
  ...
  belief_under_tension: BeliefUnderTension | null;  // NEW; null if no Q-I1 answer
};
```

If the user did not answer Q-I1 (skipped or left blank), `belief_under_tension` is `null`. The renderer hides the Keystone Reflection section in that case.

### D-4: Pattern dictionaries for heuristic extraction

Add five exported constants to `lib/identityEngine.ts` (or a new `lib/beliefHeuristics.ts` file if cleaner — agent picks).

**Value-domain patterns.** Map each of the eight sacred values to a list of detection phrases. Match case-insensitive on word boundaries. Multi-word phrases match as substrings.

```ts
export const VALUE_DOMAIN_PATTERNS: Record<Exclude<ValueDomain, "unknown">, string[]> = {
  truth: [
    "truth", "honest", "honesty", "what's actually", "what is true",
    "facts", "reality", "real", "deception", "lie", "lies", "lying",
    "accuracy", "accurate", "evidence", "proof", "data",
  ],
  freedom: [
    "freedom", "free to", "liberty", "autonomy", "independence",
    "without permission", "without being told", "self-determination",
    "agency", "control over", "choose for", "live my own",
  ],
  loyalty: [
    "loyalty", "loyal", "stick with", "stand by", "betray", "betrayal",
    "abandon", "in their corner", "have their back", "tribe",
    "my people", "our people", "stay with",
  ],
  justice: [
    "justice", "just", "unjust", "fair", "unfair", "equity", "equality",
    "rights", "oppression", "oppressed", "exploitation", "system is",
    "structurally", "structural injustice",
  ],
  faith: [
    "faith", "god", "spiritual", "soul", "transcendent", "sacred",
    "holy", "divine", "religion", "religious", "belief in something",
    "larger than", "beyond", "meaning of",
  ],
  stability: [
    "stability", "stable", "order", "orderly", "predictable",
    "secure", "security", "safe", "safety", "structure", "consistent",
    "tradition", "preserve", "continuity",
  ],
  knowledge: [
    "knowledge", "knowing", "understand", "understanding", "wisdom",
    "education", "learning", "curiosity", "discipline of",
    "what's actually known", "intellectual", "scholarly",
  ],
  family: [
    "family", "kin", "parents", "children", "kids", "spouse", "partner",
    "marriage", "blood", "ancestors", "lineage", "household",
  ],
};
```

**Disagreement-context patterns.** Where the user names whose disagreement they live with.

```ts
export const DISAGREEMENT_CONTEXT_PATTERNS: Record<Exclude<DisagreementContext, "unspecified">, string[]> = {
  family: [
    "my family", "my parents", "my mom", "my dad", "my siblings",
    "my brother", "my sister", "my kids", "my spouse", "at home",
    "around the dinner table", "household",
  ],
  friends: [
    "my friends", "people i know", "social circle", "peers",
    "people my age", "around me", "circle",
  ],
  workplace: [
    "at work", "my coworkers", "colleagues", "office", "team",
    "company", "industry", "profession", "professionally",
  ],
  culture: [
    "society", "the culture", "broader culture", "americans",
    "everyone", "modern world", "this generation", "where i live",
    "around here",
  ],
  religious_community: [
    "my church", "my congregation", "fellow believers", "religious community",
    "my faith community", "synagogue", "mosque", "temple",
  ],
  political_tribe: [
    "my party", "people on my side", "people on the left", "people on the right",
    "conservatives", "liberals", "progressives", "my tribe", "political tribe",
  ],
};
```

**Conviction-temperature markers.** How strongly the user's wording asserts the belief.

```ts
export const CONVICTION_TEMPERATURE_HIGH_MARKERS: string[] = [
  "i strongly", "deeply believe", "fundamentally", "absolutely",
  "without question", "with all my", "to my core", "i'm certain",
  "i am certain", "no doubt", "always", "every time", "fundamentally true",
];

export const CONVICTION_TEMPERATURE_LOW_MARKERS: string[] = [
  "i think", "i guess", "maybe", "sort of", "kind of",
  "i'm not sure", "i'm not certain", "i could be wrong",
  "this might", "perhaps", "possibly",
];
// "moderate" is the default if neither high nor low fires.
```

**Social-cost markers in Q-I3.** Whether the user named a cost.

```ts
export const SOCIAL_COST_EXPLICIT_MARKERS: string[] = [
  "lost", "i lost", "ended", "broken", "broke", "estranged",
  "no longer speak", "fired", "ostracized", "alone", "isolation",
  "isolated", "rejected", "left out", "shunned", "exiled",
  "cost me", "paid for", "haven't talked since",
];

export const SOCIAL_COST_IMPLIED_MARKERS: string[] = [
  "uncomfortable", "awkward", "strain", "tension", "distance",
  "drifted", "complicated", "hard to", "didn't go well",
  "felt like", "hurt", "wasn't easy",
];
// "none_named" is the default if neither fires AND Q-I3 answer is non-empty.
// If Q-I3 is empty/skipped, return "none_named" with cost_confident: false.
```

**Epistemic-posture markers in Q-I2.** Whether the user named conditions for changing their mind.

```ts
export const EPISTEMIC_POSTURE_OPEN_MARKERS: string[] = [
  "if i saw", "if there were evidence", "if it turned out",
  "if someone showed me", "if someone could", "evidence",
  "data", "proof", "if i learned", "i'd update", "i would update",
  "i'd revise", "i'd reconsider",
];

export const EPISTEMIC_POSTURE_RIGID_MARKERS: string[] = [
  "nothing", "nothing could", "nothing would", "i can't imagine",
  "i couldn't imagine", "no amount of", "this is who i am",
  "core identity", "non-negotiable", "wouldn't matter what",
  "no evidence would", "i'd never",
];

export const EPISTEMIC_POSTURE_REFLECTIVE_MARKERS: string[] = [
  "i've thought about", "i've wrestled", "i've struggled",
  "good question", "honestly i'm not sure", "i go back and forth",
  "depends", "complicated", "nuanced",
];

export const EPISTEMIC_POSTURE_GUARDED_MARKERS: string[] = [
  "i don't really discuss", "i keep this to myself",
  "i don't talk about", "private", "rather not say",
  "not something i share",
];
// "unknown" is the default if no markers fire.
```

The agent may extend any of these starter lexicons during implementation if more obvious markers come to mind, but should not add controversial or politically-charged words to the value-domain or context patterns. Keep the lexicons neutral.

### D-5: Extractor function

Add to `lib/identityEngine.ts` (or beliefHeuristics.ts):

```ts
export function extractBeliefUnderTension(answers: Answer[]): BeliefUnderTension | null {
  const qi1 = answers.find((a) => a.question_id === "Q-I1" && a.type === "freeform");
  if (!qi1 || !("response" in qi1) || qi1.response.trim().length === 0) {
    return null;
  }
  const qi2 = answers.find((a) => a.question_id === "Q-I2" && a.type === "freeform");
  const qi3 = answers.find((a) => a.question_id === "Q-I3" && a.type === "freeform");

  const stated = (qi1.response as string).trim();
  const change = qi2 && "response" in qi2 ? (qi2.response as string).trim() : "";
  const cost = qi3 && "response" in qi3 ? (qi3.response as string).trim() : "";

  // Tag value domain from Q-I1
  const valueDomain = detectValueDomain(stated);
  // Tag disagreement context from Q-I1
  const context = detectDisagreementContext(stated);
  // Tag conviction temperature from Q-I1 wording
  const temperature = detectConvictionTemperature(stated);
  // Tag social cost from Q-I3
  const cost_signal = detectSocialCost(cost);
  // Tag epistemic posture from Q-I2
  const posture = detectEpistemicPosture(change);

  return {
    stated_belief: stated,
    change_condition: change,
    cost_story: cost,
    likely_value_domain: valueDomain.tag,
    disagreement_context: context.tag,
    conviction_temperature: temperature.tag,
    social_cost: cost_signal.tag,
    epistemic_posture: posture.tag,
    value_domain_confident: valueDomain.confident,
    context_confident: context.confident,
    temperature_confident: temperature.confident,
    cost_confident: cost_signal.confident,
    posture_confident: posture.confident,
  };
}
```

Each `detect*` helper returns `{ tag, confident: boolean }`. Confidence is `true` when at least 2 distinct phrase matches occur OR a single very-strong phrase matches; `false` otherwise. The agent designs each detector against the patterns from § D-4. Detectors are case-insensitive; tokenize on word boundaries; allow multi-word phrases to match as substrings.

If no value-domain pattern fires, return `{ tag: "unknown", confident: false }`. Same for context (returns `"unspecified"`). Conviction temperature defaults to `"moderate"` with `confident: false` when neither high nor low markers fire. Cost defaults to `"none_named"`. Posture defaults to `"unknown"`.

### D-6: Integration into `buildInnerConstitution`

Update `buildInnerConstitution` to call `extractBeliefUnderTension(answers)` and assign to the new `belief_under_tension` field:

```ts
export function buildInnerConstitution(answers: Answer[], metaSignals?: MetaSignal[]): InnerConstitution {
  // ... existing CC-011 / CC-014 / CC-015a / CC-015b derivation ...
  const belief_under_tension = extractBeliefUnderTension(answers);

  return {
    // ... existing fields ...
    belief_under_tension,
  };
}
```

The five existing freeform-derived signals (`independent_thought_signal`, `epistemic_flexibility`, `cost_awareness`) continue to fire from `extractFreeformSignals` — CC-015c does not modify their derivation. The new `belief_under_tension` object is additive.

### D-7: Renderer integration — adapt to CC-015b state

The agent verifies whether `app/components/MirrorSection.tsx` exists at runtime.

**If `MirrorSection.tsx` exists (CC-015b has shipped):**

Add a new eighth section to the Mirror titled *"Your Keystone Reflection"*. Position: between section 7 (*Your Next 3 Moves*) and the closing of the Mirror. Renders the new `<KeystoneReflection>` component reading from `constitution.belief_under_tension`.

The Mirror's word budget grows by ~120-180 words to accommodate the new section. Total Mirror target stays ~750-900 words (vs 700 originally). Acceptable scope creep.

**If `MirrorSection.tsx` does NOT exist (CC-015b has not shipped):**

Mount `<KeystoneReflection>` inside `app/components/InnerConstitutionPage.tsx` between the Mirror-Types Seed section and the Confirmed Tensions section. Same component; different mount point. When CC-015b ships, the mount can move to MirrorSection in a small follow-up.

In either case: hide the section entirely if `constitution.belief_under_tension === null`.

### D-8: `KeystoneReflection.tsx` component (interactive)

New component. Stateful — manages per-tag confirmation/edit state. Renders:

- **Section header.** Mono kicker: `KEYSTONE REFLECTION`. Serif italic subtitle: *"the belief you named, where it sits in your shape."*
- **Stated belief block.** The user's verbatim Q-I1 answer, displayed as a block quote (serif italic, `var(--ink-soft)`, with a small umber left-rule). Text is wrapped in `<blockquote>` for accessibility. Do not paraphrase, do not abbreviate, do not summarize. **Not editable.**
- **Tag confirmation panel.** Five tag-rows, one per tag dimension. Each row shows:
  - Mono caps label (e.g., `LIKELY VALUE`, `DISAGREEMENT CONTEXT`, `WORDING TEMPERATURE`, `NAMED COST`, `OPENNESS TO REVISION`).
  - The current tag value as serif body. If `*_user_confirmed === true`: rendered in `var(--ink)` (firm). If `*_user_confirmed === false` AND `*_confident === true`: rendered in `var(--ink-soft)` with subtle italic + a small *"feels right?"* affordance. If `*_user_confirmed === false` AND `*_confident === false`: rendered with explicit hedge prefix *"the model couldn't tell — guessing:"* + the heuristic guess + an *"edit"* affordance.
  - Three-button cluster on the right: `Yes` / `Different` / `Skip`. `Yes` confirms the heuristic (sets `*_user_confirmed: true`). `Different` opens a small dropdown with the other valid options for that tag (selecting one updates the tag value AND sets `*_user_confirmed: true`). `Skip` leaves the tag as heuristic-only (no user confirmation).
  - After confirmation/edit, the buttons collapse into a quiet *"confirmed"* status indicator (mono caps, `var(--ink-mute)`). User can re-open the affordance via a small *"edit"* link.

  Affordance pattern matches the existing TensionCard's confirmation flow (Yes / Partially / No) — same UX language, same button styling.

- **Contextual prose paragraph (~80-120 words).** Generated from the current tag values (heuristic OR user-corrected) per § D-9. Re-renders when tags change. The prose treats user-confirmed tags as firm ("you named family as where this belief lives") and unconfirmed-but-confident tags with light hedging ("the wording suggests this may sit in family relationships"). Unconfirmed-low-confidence tags are omitted from the prose entirely.

- **Change condition block** (if Q-I2 was answered). Small mono caps label: `WHAT WOULD CHANGE YOUR MIND`. Then the user's verbatim Q-I2 text in serif italic. Not editable.
- **Cost story block** (if Q-I3 was answered). Small mono caps label: `WHAT IT HAS COST`. Then the user's verbatim Q-I3 text in serif italic. Not editable.
- **Closing line** (single sentence). Verbatim from `result-writing-canon.md`'s belief-content rule, in spirit:

  > *"The model does not judge whether this belief is correct. The model only sees the role it plays in your shape — and the role appears to be load-bearing."*

  Or: *"Your shape places this belief inside what you protect, not outside it."*

  The agent picks the closing line that fits the user's specific data; both are protected canon-quality variants.

**State management.** The KeystoneReflection component receives the heuristic-derived `BeliefUnderTension` object and maintains its own React state for the user's confirmations / corrections. When the user confirms or edits a tag, state updates locally. The lifted `belief_under_tension` on the constitution should also update so the contextual prose paragraph re-derives. Two implementation options:

1. **Local-only state.** KeystoneReflection holds local state; contextual prose recomputes on local state. Simpler. The constitution's `belief_under_tension` reflects the heuristic only. Acceptable for v1.
2. **Lifted state.** State lives in the parent (`InnerConstitutionPage` or `MirrorSection`); KeystoneReflection accepts updater callbacks. The constitution's `belief_under_tension` always reflects user corrections. More correct architecturally; more wiring.

Pick option 1 for v1 simplicity — the structured `belief_under_tension` on the constitution is stored as the heuristic guess; user corrections live in the UI's local state and influence the rendered prose only. If a future CC adds persistence (Postgres), corrections move to lifted state and persist with the session.

Visual treatment: paper background, serif body, mono caps labels, umber left-rule on block quotes. Confirmation buttons match TensionCard's style. Inherits CC-D / CC-012 typography tokens.

### D-9: The contextual prose generator (confirmation-aware)

A helper function `generateBeliefContextProse(belief: BeliefUnderTension, topCompass, topGravity, lensStack): string` that:

1. Opens with the belief-protected-by-values reading. Uses `valueListPhrase(topCompass, ...)` to vary the value-list phrasing.
2. Adds the disagreement context line if `context_user_confirmed: true` (firm: *"You named family as the room where this lives."*) OR if `context_confident: true` AND `context_user_confirmed: false` (hedged: *"The wording suggests this may sit in family relationships."*). Skip entirely if `context_confident: false` AND `context_user_confirmed: false`.
3. Adds the conviction temperature line under the same firm/hedge/skip rule.
4. Adds the cost line if confirmed-or-confident AND `social_cost !== "none_named"`.
5. Adds the posture line under the same rule.
6. Closes with the role-it-plays line.

Total ~80-120 words. If multiple tags are low-confidence and unconfirmed, the prose stays shorter, hedged, and omits ambiguous structural reads. Never speculates beyond what the heuristics + confirmations support.

**Three-state rule per tag** (firm / hedge / omit):

| `*_user_confirmed` | `*_confident` | Render as |
|---|---|---|
| `true` | (any) | Firm ("you named X") |
| `false` | `true` | Hedged ("the wording suggests Y, may revise") |
| `false` | `false` | Omit from prose |

The prose generator re-runs whenever a tag's confirmation state changes (user confirms or edits via the affordance), so the rendered paragraph stays in sync.

The prose templates respect:
- Result-writing canon's hedging vocabulary.
- Five Dangers compliance (no moralizing the belief, no clinical implication, no type-label headlines).
- The "do not score belief content" rule from § D-2.

### D-10: Five Dangers + belief-content rule compliance

Every authored prose template in CC-015c must respect:

- The five dangers from `shape-framework.md`.
- The new belief-content rule from § D-2.

In particular: the contextual prose must NEVER include phrases like *"this is a controversial belief"*, *"this belief is admirable"*, *"this belief is concerning"*, *"this belief may not be widely accepted"*. The model surfaces structural metadata (which value, which context, which posture) without commenting on the belief's truth or social acceptability.

---

## Requirements

### 1. Canon: rename section in `question-bank-v1.md` per § D-1

Change the section heading from *"Freeform Insight"* to *"Keystone Reflection"*. Add the one-line description below.

### 2. Canon: append the belief-content rule to `result-writing-canon.md` per § D-2

New section titled *"Belief content rule (CC-015c)"*. Body verbatim per § D-2.

### 3. Code: add `BeliefUnderTension` and helper types to `lib/types.ts` per § D-3

`ValueDomain`, `DisagreementContext`, `ConvictionTemperature`, `SocialCost`, `EpistemicPosture`, `BeliefUnderTension`. Extend `InnerConstitution` with `belief_under_tension: BeliefUnderTension | null`.

### 4. Code: add pattern dictionaries per § D-4

Five exported constants in `lib/identityEngine.ts` (or a new `lib/beliefHeuristics.ts` file). All pattern lists from § D-4 verbatim, with the agent free to extend non-controversially.

### 5. Code: implement `extractBeliefUnderTension` and `detect*` helpers per § D-5

Function returns `BeliefUnderTension | null`. Five `detect*` helpers (one per tag dimension), each returning `{ tag, confident: boolean }`. Confidence rule: ≥2 distinct phrase matches OR ≥1 very-strong phrase match.

### 6. Code: integrate into `buildInnerConstitution` per § D-6

Call `extractBeliefUnderTension(answers)` and populate the new `belief_under_tension` field in the returned `InnerConstitution`.

### 7. Renderer: create `app/components/KeystoneReflection.tsx` per § D-8

Section header, verbatim belief block, **per-tag confirmation panel with `Yes` / `Different` / `Skip` affordances** (matches TensionCard's confirmation pattern), contextual prose, optional change-condition block, optional cost-story block, closing line. Local React state holds user confirmations per § D-8 implementation option 1. The contextual prose re-derives whenever a tag's confirmation/correction state changes.

### 8. Renderer: integrate `<KeystoneReflection>` per § D-7

Detect whether `MirrorSection.tsx` exists. If yes: add as eighth Mirror section. If no: mount in `InnerConstitutionPage.tsx` between Mirror-Types Seed and Confirmed Tensions.

Document the choice in report-back.

### 9. Code: implement `generateBeliefContextProse` per § D-9 (confirmation-aware)

Helper that produces the ~80-120 word contextual paragraph from the structured tags + user's top Compass / top Gravity / lens stack. **Three-state rule per tag** per § D-9:
- `*_user_confirmed: true` → render firm.
- `*_user_confirmed: false` AND `*_confident: true` → render hedged.
- `*_user_confirmed: false` AND `*_confident: false` → omit from prose entirely.

Re-runs whenever any tag's confirmation state changes.

### 10. Type-check, lint, and verify

- `npx tsc --noEmit` — passes cleanly.
- `npm run lint` — passes cleanly.
- Manual smoke test:
  - Synthetic answer set 1 (high-confidence INTJ-ish belief about Truth + Family disagreement context + named cost + open posture): `belief_under_tension` produces value_domain=truth, context=family, temperature=high, social_cost=explicit, posture=open, all confident=true. Renderer surfaces all blocks with rich contextual prose.
  - Synthetic answer set 2 (low-effort answer with no clear value or context): tags default to unknown / unspecified / moderate, low confidence, prose is appropriately short and hedged.
  - Synthetic answer set 3 (Q-I1 skipped/empty): `belief_under_tension === null`, KeystoneReflection section hidden entirely.
- Browser smoke at `localhost:3003` (or deferred to user).

---

## Allowed to Modify

**Canon:**

- `docs/canon/question-bank-v1.md` — section rename per § D-1.
- `docs/canon/result-writing-canon.md` — append belief-content rule per § D-2.

**Code:**

- `lib/types.ts` — add types per § D-3.
- `lib/identityEngine.ts` — add extractor + dictionaries + helper functions per §§ D-4 / D-5 / D-6 / D-9. Update `buildInnerConstitution` only to populate the new field. All other functions and constants preserved.
- `lib/beliefHeuristics.ts` — NEW (optional). If the agent chooses to factor the dictionaries + detectors into a separate file for cleanliness. Imports/exports as needed.
- `app/components/KeystoneReflection.tsx` — NEW.
- `app/components/InnerConstitutionPage.tsx` — only if MirrorSection does not exist. Single mount point added per § D-7 fallback. Otherwise unchanged.
- `app/components/MirrorSection.tsx` — only if it exists (CC-015b has shipped). Single new section added per § D-7 primary path.

Do **NOT** modify:

- Any `docs/canon/*.md` file other than `question-bank-v1.md` and `result-writing-canon.md`.
- `app/components/Ranking.tsx`, `QuestionShell.tsx`, `ProgressIndicator.tsx`, `ShapeCard.tsx`, `TensionCard.tsx`, `MbtiDisclosure.tsx`, `SinglePickPicker.tsx`, `SecondPassPage.tsx`, `MapSection.tsx`, `PathExpanded.tsx`.
- `app/globals.css`, `app/layout.tsx`.
- `data/questions.ts`.
- Any tension detection block.
- Any signal definition.
- Any aggregation helper or per-card derivation function or cross-card synthesis function.
- The CC-015a / CC-015b constants and helpers (`FUNCTION_VOICE`, etc.).
- `prompts/`, `AGENTS.md`, `CLAUDE.md`, `README.md`, `package.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `.claude/settings.local.json`, `postcss.config.mjs`.

---

## Out of Scope

- **LLM-based extraction (Path A).** Future work, contingent on broader LLM integration architecture.
- **Curated pattern library expansion to ~500 phrases.** Starter lexicons are intentionally small. Future work.
- **Lifted state for user corrections (option 2 in § D-8).** User corrections live in local React state in V1. Persistence requires the broader Postgres work. Future enhancement.
- **Modifying existing freeform signals** (`independent_thought_signal`, `epistemic_flexibility`, `cost_awareness`). They continue to fire as before.
- **New questions, new sacred values, new tensions.**
- **Persistence / autosave / sharing.**
- **Engine derivation rule changes.**
- **Tension provenance changes.**

---

## Acceptance Criteria

1. `docs/canon/question-bank-v1.md` section header reads *"Keystone Reflection"* with the one-line description per § D-1. Q-I1 / Q-I2 / Q-I3 question entries are byte-identical (no text, signal, or helper changes).
2. `docs/canon/result-writing-canon.md` has a new section *"Belief content rule (CC-015c)"* with the body verbatim per § D-2.
3. `lib/types.ts` declares `ValueDomain`, `DisagreementContext`, `ConvictionTemperature`, `SocialCost`, `EpistemicPosture`, `BeliefUnderTension`. The `BeliefUnderTension` type includes BOTH the five `*_confident` heuristic flags AND the five `*_user_confirmed` user-correction flags. `InnerConstitution` extended with `belief_under_tension: BeliefUnderTension | null`. Existing types preserved.
4. Pattern dictionaries (five) exist per § D-4 (in `lib/identityEngine.ts` or `lib/beliefHeuristics.ts`).
5. `extractBeliefUnderTension(answers)` exists and returns the structured object or null per § D-5. Five `detect*` helpers exist with confidence flags.
6. `buildInnerConstitution` populates `belief_under_tension` per § D-6.
7. `app/components/KeystoneReflection.tsx` exists per § D-8 with verbatim block, **per-tag confirmation panel (Yes / Different / Skip affordances) for the five tags**, contextual prose (re-derives on confirmation change), optional change/cost blocks, closing line. Confirmation affordance pattern matches the existing TensionCard's confirmation flow.
8. Renderer integration per § D-7. The agent documents which path was taken (MirrorSection eighth-section vs InnerConstitutionPage mount).
9. Section is hidden entirely when `belief_under_tension === null`.
10. Five Dangers + belief-content-rule compliance: no prose judges the belief's content. Pure structural metadata + verbatim user text + user-validated tags.
11. Three-state rendering rule per tag (firm / hedge / omit) per § D-9 holds: confirmed tags read firm, confident-but-unconfirmed tags hedge, low-confidence-unconfirmed tags omit from prose.
11. `npx tsc --noEmit` passes cleanly.
12. `npm run lint` passes cleanly.
13. No file outside the Allowed to Modify list has been edited.
14. No existing function, constant, signal, tension, or question is modified.

---

## Report Back

Return a single markdown block with:

1. **Files changed** — bullet per file with one-line description. Note new components.
2. **Canon: section rename** — quote the new section header + description in `question-bank-v1.md`.
3. **Canon: belief-content rule** — quote the new rule in `result-writing-canon.md` verbatim.
4. **Type system** — quote `BeliefUnderTension` and helper types verbatim. Confirm existing types preserved.
5. **Pattern dictionaries** — quote a representative subset (e.g., `VALUE_DOMAIN_PATTERNS.truth`, `DISAGREEMENT_CONTEXT_PATTERNS.family`, `EPISTEMIC_POSTURE_RIGID_MARKERS`). Confirm all five dictionaries are present.
6. **Extractor function** — quote `extractBeliefUnderTension` body. Quote one of the `detect*` helpers (e.g., `detectValueDomain`).
7. **Integration into buildInnerConstitution** — quote the relevant addition.
8. **KeystoneReflection component** — quote the component code or relevant excerpts. Confirm verbatim block, contextual prose, optional sub-blocks, closing line.
9. **Renderer integration choice** — state which path was taken (MirrorSection vs InnerConstitutionPage). Justify if the choice was non-obvious.
10. **Smoke-test results** — synthetic answer set 1 (high-confidence), set 2 (low-confidence), set 3 (Q-I1 empty). Confirm expected behavior. Note browser smoke if performed or deferred.
11. **Type check and lint** — outputs of both.
12. **Scope-creep check** — explicit confirmation that:
    - Q-I1 / Q-I2 / Q-I3 question entries are byte-identical.
    - Existing freeform signals (`independent_thought_signal`, `epistemic_flexibility`, `cost_awareness`) are unchanged.
    - No tension, no aggregation helper, no per-card derivation function, no cross-card synthesis function modified.
    - No file outside the Allowed list touched.
    - No belief content was scored or judged in any prose template.
13. **Risks / next-step recommendations** — anything that surfaced. Specifically:
    - Pattern-dictionary precision: which detectors fired correctly vs which produced false positives or false negatives in the smoke test. Suggest where the lexicons most need expansion.
    - Confidence-flag thresholds: whether the ≥2-match rule felt right or whether some detectors needed adjustment.
    - Whether the contextual prose template adapts gracefully when several tags are low-confidence (the section may read as thin).
    - Whether the integration choice (MirrorSection vs InnerConstitutionPage) is the right one, or whether a follow-up CC should reconcile if both are present.
    - Suggestions for v1.5 follow-up: hybrid heuristic + user confirmation; pattern library expansion; LLM-driven Path A when API integration lands.
    - Any other observation worth surfacing.
