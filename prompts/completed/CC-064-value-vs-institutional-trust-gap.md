# CC-064 — Value vs Institutional Trust Gap (T-016 — new tension class for the value/institution-trust gap surfaced post-CC-063)

**Type:** New tension class. **Locked-content composition** for six (value → analog institution-trust) pairs that fire as new T-016 tensions when the user's stated sacred value ranks high while its analog institutional-trust signal does not rank in their trusted-institutions top tier. No new questions, no new signals, no new measurement surface — predicate composes from the existing Compass top + Q-X3 institutional trust rankings. Faith is intentionally excluded per CC-054's Faith Shape coverage.
**Goal:** Close the architectural gap surfaced 2026-05-01: the engine systematically detects sacred-value-vs-allocation tensions (T-013 spending, T-014 energy, T-015 multi-domain), and CC-054 Faith Shape composes faith_priority + religious_trust signals into Compass card prose, but no fired-tension surface tests sacred-value-vs-institutional-trust gaps for the rest of the Compass values. After CC-064 ships, T-016 fires for any (value, institution) pair from the locked six where the value ranks Compass top-3 AND the analog institutional-trust signal does NOT rank in the user's top-3 trusted institutions. Each fired T-016 instance surfaces in Open Tensions with the canonical Yes/Partially/No/Explain interactive response affordance.
**Predecessors:** CC-016 (original T-013/T-014 detection logic — same architectural shell). CC-054 (Faith Shape composer — covers `faith_priority` + religious_trust gap; T-016 explicitly defers to it). CC-060 (Allocation Gap 3C's Rewrite — locked-content tension-prompt pattern; T-016 follows the same prefix + middle + reframe + 3-state-close shape). CC-063 (Trust + Responsibility Conditional Framing — surfaced the value-vs-institutional-trust gap as part of the broader trust-prose calibration). CODEX-062 (polish-layer anchor extraction — already extracts every fired tension's `user_prompt` into `lockedAnchors[]`; T-016 prompts flow through automatically).
**Successor:** None hard-blocked. Faith composite remains covered by CC-054's prose-level disambiguation; if browser smoke surfaces other value-institution pairs that need similar prose-level treatment (rather than tension-fired), a future Path-β-style CC handles them per-value.

---

## Why this CC

The instrument's tension catalog as of CC-063 is partial. We catch:

- T-013 / T-014 / T-015 — sacred value vs allocation (spending, energy, multi-domain).
- T-001 through T-012 — earlier tension types per CC-002 / CC-016.
- Drive `claimed_vs_revealed` matrix-tension classifier (CC-026).

We do **not** systematically catch the value-vs-institutional-trust gap class. Faith got a special-case treatment via CC-054's Faith Shape composer (Compass card prose), motivated by the framework's overloading of the value label. The same architectural move was never extended to other sacred values. As a result, a user who ranks Knowledge as a top-3 sacred value while ranking Education at the bottom of trusted institutions sees no surfaced tension — the engine has the data to detect this but doesn't.

CC-064 closes the gap with a new tension class T-016, fired in Open Tensions, surfacing the gap interactively. The Open Tensions surface (Yes/Partially/No/Explain affordance) is the canonical engagement layer for this class of tension — better than informational prose alone because it asks the user to confirm, partially confirm, or push back on the read.

The locked content does the architectural-honest work: it doesn't accuse the user of contradiction. It names the gap, reframes it as the productive question (*"where do you locate Knowledge if not in education's institutional form?"*), and lets the user respond.

CC-064 is engine-side substance per the Path C contract. The locked prompts are polish-layer-immutable; CODEX-062's existing `extractAnchors` already pushes every fired tension's `user_prompt` onto `lockedAnchors[]`, so T-016 prompts inherit polish-round-trip protection automatically.

---

## Scope

Files modified:

1. **`lib/identityEngine.ts`** — three additions:
   - **New helper `detectValueInstitutionalTrustGap(signals)` → Tension[]**, fires 0+ T-016 tensions per session. Reads Compass rankings + institutional trust rankings; walks the 6 locked pairs; emits one T-016 per match.
   - **New `VALUE_INSTITUTION_TRUST_PAIRS` Record** (or similar lookup) keyed by `value_signal_id` mapping to `{ analog_trust_signal_id, value_label, institution_label, locked_user_prompt }`.
   - **Wire into `buildInnerConstitution`** — after `detectTensions` and `detectAllocationOverlayTensions`, call `detectValueInstitutionalTrustGap(signals)` and append the returned tensions to the `tensions[]` array.

2. **`lib/types.ts`** — extend the `Tension.tension_id` union (if it's a typed string union) to include `"T-016"`. If `tension_id` is `string`, no type-system change needed.

3. **`docs/canon/result-writing-canon.md`** — append a CC-064 amendment under the existing canon noting T-016's introduction, the six locked value-institution pairs, the detection predicate (top-3 value AND not-top-3 trust), and the explicit Faith exclusion (CC-054 covers).

4. **`docs/audits/report-calibration-audit-2026-04-29.md`** — note T-016 as a new tension type (not a Rule violation closure; this is a coverage extension rather than a calibration fix).

5. **`docs/canon/tension-library-v1.md`** (if present, the canonical tension catalog) — add T-016 entry with description, predicate, and the six locked prompts.

Nothing else. Specifically:

- **No new questions, signals, or tagging tables.** Compass + institutional trust signals exist already.
- **No edits to existing T-001 through T-015 detection logic or prompts.**
- **No edits to the Drive case classifier or Drive-bucket-lean machinery.**
- **No edits to CC-054's Faith Shape composer.** T-016 explicitly excludes `faith_priority` so there's no overlap.
- **No edits to render components.** Open Tensions render reads `tension.user_prompt` verbatim per the existing pattern.
- **No edits to `lib/renderMirror.ts`** beyond what's already present (Open Tensions emit reads `tension.user_prompt` verbatim).
- **No edits to the polish-layer contract.** CODEX-062 already extracts every fired tension's `user_prompt` into `lockedAnchors[]`; T-016 inherits.
- **No new UI affordances.** T-016 uses the existing Yes/Partially/No/Explain pattern.

---

## The locked detection predicate

For each of the 6 locked pairs, fire T-016 when:

1. The **value signal** ranks ≤ 3 in the user's Compass (i.e., among their top-3 sacred values via the existing `rankAtMost(signals, value_signal_id, 3)` accessor).
2. The **analog institutional-trust signal** does NOT rank ≤ 3 in the user's institutional-trust ladder (i.e., `!rankAtMost(signals, trust_signal_id, 3)` — the institution is not in the user's top-3 trusted).
3. Both signals are present (not skipped). If either signal is absent (`undefined` rank), do not fire — the gap requires both rankings to be confidently expressed.

The predicate is type-safe via the existing `rankAtMost` helper. The "top-3" thresholds match the existing Compass and trust-ranking architecture (Compass surfaces top-3 prominently; trust signals are ranked 1-N where 1 is most trusted).

Multi-firing is allowed — a user with knowledge_priority top-3 + truth_priority top-3 + both education and journalism ranking out of top-3 trust fires two T-016 instances (Knowledge gap and Truth gap). Each is a distinct read; surfacing both is canonical, the same way T-015 multi-fires across allocation domains.

---

## The locked content — 6 value-institution pairs

Each pair gets one locked `user_prompt` template. The templates share a four-part structure: prefix (names the value) → middle (names the institutional gap) → reframe (normalizes the tension + names the productive question) → 3-state question close.

### 1. Knowledge → Education

**Predicate:** `rankAtMost(signals, "knowledge_priority", 3)` AND `!rankAtMost(signals, "education_trust_priority", 3)`.

**Locked user_prompt:**

> *"You named Knowledge among your most sacred values, yet Education does not appear among the institutions you trust most. That's not a contradiction — but it's worth naming. You may hold the value sacred while distrusting the institutions that claim to embody it. The tension may be: where do you locate Knowledge if not in education's institutional form, and what does that ask of you in how you keep the value alive? Does this feel true, partially true, or not true at all?"*

### 2. Truth → Journalism

**Predicate:** `rankAtMost(signals, "truth_priority", 3)` AND `!rankAtMost(signals, "journalism_trust_priority", 3)`.

**Locked user_prompt:**

> *"You named Truth among your most sacred values, yet Journalism does not appear among the institutions you trust most. That's not a contradiction — but it's worth naming. You may hold the value sacred while distrusting the institutions that publicly claim its mantle. The tension may be: who do you actually turn to when truth is at stake, and what does it mean that the institutions named for it didn't earn your trust? Does this feel true, partially true, or not true at all?"*

### 3. Justice → Government (elected)

**Predicate:** `rankAtMost(signals, "justice_priority", 3)` AND `!rankAtMost(signals, "government_elected_trust_priority", 3)`.

**Locked user_prompt:**

> *"You named Justice among your most sacred values, yet Government does not appear among the institutions you trust most. That's not a contradiction — but it's worth naming. You may hold the value sacred while distrusting the institutions that claim to deliver it. The tension may be: where do you locate Justice if not in the government's institutional form, and what does that ask of you in how you live the value? Does this feel true, partially true, or not true at all?"*

### 4. Stability → Government Services

**Predicate:** `rankAtMost(signals, "stability_priority", 3)` AND `!rankAtMost(signals, "government_services_trust_priority", 3)`.

**Locked user_prompt:**

> *"You named Stability among your most sacred values, yet Government Services do not appear among the institutions you trust most. That's not a contradiction — but it's worth naming. You may hold the value sacred while distrusting the structures meant to provide it. The tension may be: where do you locate Stability if not in the institutions named for it, and what does that ask of you in how you build it for yourself and the people closest to you? Does this feel true, partially true, or not true at all?"*

### 5. Compassion → Non-Profits

**Predicate:** `rankAtMost(signals, "compassion_priority", 3)` AND `!rankAtMost(signals, "nonprofits_trust_priority", 3)`.

**Locked user_prompt:**

> *"You named Compassion among your most sacred values, yet Non-Profits do not appear among the institutions you trust most. That's not a contradiction — but it's worth naming. You may hold the value sacred while distrusting the institutions that organize themselves around it. The tension may be: where do you locate Compassion as a lived practice when the institutional forms haven't earned the trust the value would require? Does this feel true, partially true, or not true at all?"*

### 6. Mercy → Religious institutions

**Predicate:** `rankAtMost(signals, "mercy_priority", 3)` AND `!rankAtMost(signals, "religious_trust_priority", 3)`.

**Locked user_prompt:**

> *"You named Mercy among your most sacred values, yet Religious institutions do not appear among the institutions you trust most. That's not a contradiction — but it's worth naming. You may hold the value sacred while distrusting the institutions that publicly claim it. The tension may be: where do you locate Mercy when the institutions that name it haven't earned the trust the value would require, and what does that ask of you in how the value gets lived rather than only believed? Does this feel true, partially true, or not true at all?"*

---

## The Faith exclusion (canonical)

`faith_priority` is **not** in the T-016 pair set. CC-054's Faith Shape composer already reads `faith_priority + religious_trust_priority + government_trust + supernatural_responsibility + faith-as-burden signals` and produces a per-user Faith register prose block in the Compass card. T-016 firing for the (faith_priority, religious_trust_priority) pair would duplicate.

If browser smoke or future review shows the Faith Shape's prose-level treatment is insufficient for the gap-surfacing job (e.g., users miss the gap because it sits in a Compass card body rather than the more interactive Open Tensions section), a future CC can either (a) add Faith to T-016's pair set or (b) extend the Faith Shape to reference the gap explicitly. Decision deferred. CC-064 ships without faith_priority in scope.

The exclusion is documented in canon (`result-writing-canon.md` CC-064 amendment, `tension-library-v1.md` T-016 entry).

---

## The selector function shape (locked)

```ts
// lib/identityEngine.ts (new helper, near detectTensions / detectAllocationOverlayTensions)

type ValueInstitutionTrustPair = {
  value_signal: SignalId;
  value_label: string;
  institution_signal: SignalId;
  institution_label: string;
  locked_user_prompt: string; // verbatim from CC-064 locked content
};

const VALUE_INSTITUTION_TRUST_PAIRS: ValueInstitutionTrustPair[] = [
  {
    value_signal: "knowledge_priority",
    value_label: "Knowledge",
    institution_signal: "education_trust_priority",
    institution_label: "Education",
    locked_user_prompt: "<locked Knowledge → Education prompt>",
  },
  {
    value_signal: "truth_priority",
    value_label: "Truth",
    institution_signal: "journalism_trust_priority",
    institution_label: "Journalism",
    locked_user_prompt: "<locked Truth → Journalism prompt>",
  },
  {
    value_signal: "justice_priority",
    value_label: "Justice",
    institution_signal: "government_elected_trust_priority",
    institution_label: "Government",
    locked_user_prompt: "<locked Justice → Government prompt>",
  },
  {
    value_signal: "stability_priority",
    value_label: "Stability",
    institution_signal: "government_services_trust_priority",
    institution_label: "Government Services",
    locked_user_prompt: "<locked Stability → Government Services prompt>",
  },
  {
    value_signal: "compassion_priority",
    value_label: "Compassion",
    institution_signal: "nonprofits_trust_priority",
    institution_label: "Non-Profits",
    locked_user_prompt: "<locked Compassion → Non-Profits prompt>",
  },
  {
    value_signal: "mercy_priority",
    value_label: "Mercy",
    institution_signal: "religious_trust_priority",
    institution_label: "Religious institutions",
    locked_user_prompt: "<locked Mercy → Religious prompt>",
  },
];

export function detectValueInstitutionalTrustGap(signals: Signal[]): Tension[] {
  const out: Tension[] = [];
  for (const pair of VALUE_INSTITUTION_TRUST_PAIRS) {
    const valueHigh = rankAtMost(signals, pair.value_signal, 3);
    const valuePresent = signals.some((s) => s.signal_id === pair.value_signal);
    const trustPresent = signals.some((s) => s.signal_id === pair.institution_signal);
    if (!valueHigh || !valuePresent || !trustPresent) continue;
    const trustHigh = rankAtMost(signals, pair.institution_signal, 3);
    if (trustHigh) continue; // not a gap — trust is also high
    out.push({
      tension_id: "T-016",
      type: `Value vs Institutional Trust Gap (${pair.value_label})`,
      description: `User ranks ${pair.value_label} as a sacred value but does not rank ${pair.institution_label} among most-trusted institutions.`,
      signals_involved: [
        ref(signals, pair.value_signal, "sacred"),
        ref(signals, pair.institution_signal, "trust"),
      ],
      confidence: "medium",
      status: "unconfirmed",
      strengthened_by: [],
      user_prompt: pair.locked_user_prompt,
    });
  }
  return out;
}
```

The function uses the existing `rankAtMost` and `ref` helpers — no new utility code. The shape mirrors `detectTensions` and `detectAllocationOverlayTensions` in `lib/identityEngine.ts`.

The `tension_id` is the literal `"T-016"`. Each fired instance carries a distinct `type` label so the Open Tensions UI can render distinct headings (*"Value vs Institutional Trust Gap (Knowledge)"*, etc.) for multi-firings within a single session.

---

## Wire into `buildInnerConstitution`

After the existing `detectTensions(...)` + `detectAllocationOverlayTensions(...)` calls, append:

```ts
const valueTrustGaps = detectValueInstitutionalTrustGap(signals);
tensions.push(...valueTrustGaps);
```

Order does not matter for tension display (Open Tensions surfaces all unconfirmed tensions; the user engages with each independently). T-016 instances appear alongside T-013/T-014/T-015 + earlier tensions in the same surface.

---

## Acceptance

- `npx tsc --noEmit` clean.
- `npm run lint` clean.
- `npm run build` exits 0.
- `detectValueInstitutionalTrustGap` shipped with all 6 locked pairs verbatim.
- `VALUE_INSTITUTION_TRUST_PAIRS` Record contains exactly 6 entries; `faith_priority` is NOT in the list.
- Re-rendered Jason0429 (admin route per CODEX-050) shows:
  - At least one T-016 instance fires (Jason0429's canonical Compass top likely includes Knowledge + Truth + Honor; if education_trust + journalism_trust are not in top-3 institutional trust, those T-016 instances fire and render in Open Tensions).
  - Each fired T-016 renders the locked `user_prompt` verbatim.
- A test session with all relevant value/trust pairs in matching alignment (value high + trust high) fires zero T-016 instances.
- A test session with Knowledge top-3 but Education at top-1 trust fires zero T-016 instances (gap requires non-top-3 trust).
- A test session with Knowledge top-3 + Education absent or rank>3 fires one T-016 instance.
- Multi-firing test: a session with Knowledge + Truth both top-3 + both Education and Journalism rank>3 fires two T-016 instances.
- Faith exclusion verified: a session with Faith top-3 + religious_trust rank>3 fires zero T-016 instances (handled by CC-054's Faith Shape; documented).
- Polish-layer round-trip (when API keys set) preserves the new T-016 prompts via CODEX-062's existing `extractAnchors` extraction. No new contract edit needed.
- Open Tensions UI renders T-016 instances with the canonical Yes/Partially/No/Explain interactive affordance.
- Markdown export (`lib/renderMirror.ts`) emits T-016 prompts verbatim per the existing Open Tensions emit path.

---

## Out of scope

- **Adding `faith_priority` to T-016's pair set.** Excluded by canon — CC-054's Faith Shape covers. Future CC if browser smoke shows the Faith Shape is insufficient.
- **Adding more value-institution pairs beyond the 6.** v1 floor. Future CCs can extend (e.g., honor → military, family → community, etc., though those analogs are weaker).
- **Per-user variation in the locked prompts.** All Knowledge gap users get the same Knowledge prompt. Future CC may add Compass-context-specific anchors (e.g., a Knowledge gap that fires *with* Truth top vs without); not now.
- **Combining multi-firings into a single synthesis tension.** Each T-016 fires as its own instance. T-015's synthesis-collapse pattern is for allocation overlays, not for T-016.
- **Editing T-001 through T-015 detection logic, prompts, or thresholds.**
- **Editing CC-054's Faith Shape composer.**
- **Touching the Drive case classifier, OCEAN, Work Map, or Love Map.**
- **Touching Open Tensions render or interaction.**
- **Touching the polish-layer adapters, A/B harness, validation, or system prompt.** The new prompts flow into `lockedAnchors[]` via CODEX-062's existing extraction.
- **Adding Compass card prose for the gap (Path β).** Path α was chosen 2026-05-01.
- **Adding tests.**
- **Migrating pre-CC-064 saved sessions.** Re-render against current engine code on admin load picks up T-016 firings automatically.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

This CC is filed CC- per the routing convention because the work involves new tension-class detection logic (architectural addition) plus locked editorial-judgment-adjacent prose. Claude Code is the cleaner default; Codex acceptable given the locked-content discipline.

## Execution Directive

Single pass. **All 6 locked tension prompts ship verbatim from this prompt's locked content.** If the executor encounters a structural surprise (e.g., the institutional trust signal IDs don't exactly match the strings used in this prompt; the `Tension.tension_id` union type doesn't currently allow `"T-016"` and requires a type-union extension; the `rankAtMost` helper has a different signature than expected), surface in Report Back rather than rewriting locked content. Verify the canonical institutional trust signal IDs in `data/questions.ts` and `lib/identityEngine.ts § VALUE_LABEL_HUMAN` and similar before locking the predicate strings. **Move prompt to `prompts/completed/` when done.**

## Bash Commands Authorized

- `grep -n "rankAtMost\|knowledge_priority\|truth_priority\|justice_priority\|stability_priority\|compassion_priority\|mercy_priority\|education_trust_priority\|journalism_trust_priority\|government_elected_trust_priority\|government_services_trust_priority\|nonprofits_trust_priority\|religious_trust_priority" lib/identityEngine.ts data/questions.ts`
- `grep -n "tension_id\|T-013\|T-014\|T-015\|T-016\|detectTensions\|detectAllocationOverlayTensions\|buildInnerConstitution" lib/identityEngine.ts`
- `cat lib/identityEngine.ts | sed -n '800,920p'` (existing tension detection patterns)
- `grep -n "Tension\b" lib/types.ts`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` (smoke; kill before exit)
- `mv prompts/active/CC-064-value-vs-institutional-trust-gap.md prompts/completed/CC-064-value-vs-institutional-trust-gap.md`
- `git diff --stat`
- `git diff lib/identityEngine.ts`

## Read First (Required)

- `AGENTS.md`.
- `lib/identityEngine.ts § detectTensions, detectAllocationOverlayTensions` (existing tension detection — same architectural shell CC-064 follows).
- `lib/identityEngine.ts § rankAtMost, ref, hasAtRank, hasAtCrossRank` (existing predicate helpers).
- `lib/identityEngine.ts § VALUE_LABEL_HUMAN` (verify Compass value labels).
- `lib/identityEngine.ts § INST_LABEL` (verify institutional trust labels).
- `lib/types.ts § Tension, Signal, SignalId` (verify Tension shape and `tension_id` type).
- `data/questions.ts` Q-S1, Q-S2 (Compass), Q-X3 (institutional trust) — verify the signal IDs used in this prompt's predicates match repo state exactly.
- `lib/humanityRendering/contract.ts § buildEngineRenderedReport` (verify CODEX-062's tension `user_prompt` extraction is in place; T-016 inherits).
- `docs/canon/result-writing-canon.md` § Rule 8 (CC-063 trust calibration that motivated this gap discovery).
- `docs/canon/tension-library-v1.md` (if present — canonical tension catalog; T-016 entry to add).
- Memory:
  - `feedback_peace_and_faith_disambiguation.md` (CC-054's Faith Shape coverage — explicit deferral).

## Allowed to Modify

- `lib/identityEngine.ts` — new `detectValueInstitutionalTrustGap` helper + `VALUE_INSTITUTION_TRUST_PAIRS` Record + one-line wire-in to `buildInnerConstitution`.
- `lib/types.ts` — only if `Tension.tension_id` is a typed union that needs `"T-016"` added; otherwise unchanged.
- `docs/canon/result-writing-canon.md` — CC-064 amendment.
- `docs/canon/tension-library-v1.md` (if present) — T-016 entry.
- `docs/audits/report-calibration-audit-2026-04-29.md` — note T-016 as new tension class (not a Rule violation closure).
- **No other files.** Specifically NOT: `lib/loveMap.ts`, `lib/workMap.ts`, `lib/drive.ts`, `lib/ocean.ts`, `lib/beliefHeuristics.ts`, `data/questions.ts`, `app/components/*.tsx`, `lib/renderMirror.ts`, `lib/humanityRendering/*`, any test files.

## Report Back

1. **Helper + Record** — diff for the new `detectValueInstitutionalTrustGap` function and the `VALUE_INSTITUTION_TRUST_PAIRS` Record. Confirmation that all 6 locked prompts ship verbatim from this prompt; `faith_priority` is NOT in the list.
2. **Wire-in to `buildInnerConstitution`** — diff showing the new `tensions.push(...detectValueInstitutionalTrustGap(signals))` call after existing tension detection.
3. **Signal ID verification** — confirm each value_signal_id and institution_signal_id matches the canonical strings in `data/questions.ts` / `lib/identityEngine.ts § VALUE_LABEL_HUMAN` / similar. If any signal ID in this prompt's predicate is wrong (e.g., `government_elected_trust_priority` is actually named differently in repo state), surface and use the actual canonical string.
4. **Type-system path** — confirm whether `Tension.tension_id` accepts `"T-016"` directly. If not, extend the typed union.
5. **Canon doc updates** — line ranges for the CC-064 amendments in `result-writing-canon.md` and (if present) `tension-library-v1.md`.
6. **Audit doc note** — line range for T-016 introduction note.
7. **Verification results** — tsc, lint, build all clean.
8. **Polish-layer integration** — confirm (via reading `lib/humanityRendering/contract.ts`) that CODEX-062's tension `user_prompt` extraction picks up T-016 prompts automatically. No contract edit needed.
9. **Manual sweep deferred to Jason** — explicit verification list:
   - Re-rendered Jason0429 fires expected T-016 instances based on his Compass top + trust rankings (Knowledge gap likely; possibly Truth and Justice gaps).
   - Each fired T-016 renders the locked `user_prompt` verbatim.
   - Test panel: a session aligned (value high + trust high) fires zero T-016; a session with the canonical Knowledge gap fires Knowledge T-016; a multi-pair session fires multiple T-016 instances.
   - Faith exclusion holds — even with Faith top + low religious_trust, no T-016 fires (Faith Shape covers).
   - Open Tensions UI renders T-016 with Yes/Partially/No/Explain affordance.
   - Markdown export emits T-016 prompts verbatim.
   - Polish-layer A/B harness preserves T-016 prompts via CODEX-062.
10. **Any deviation from locked content** — if any signal ID, threshold, or predicate had to deviate from the prompt due to repo state.
11. **Prompt move-to-completed confirmation.**

---

## Notes for the executing engineer

- **Locked tension prompts ship verbatim.** Tonal calibration is a separate authorship pass. If a sentence reads "off" tonally, surface in Report Back. Do not silently revise.
- **Faith exclusion is canonical.** CC-054's Faith Shape is the load-bearing surface for the (faith_priority + religious_trust) gap. Adding Faith to T-016's pair set duplicates. The deferral is documented; future CC may revisit.
- **`tension_id: "T-016"`** is a single string for all 6 instances; each instance differs by `type` label and `user_prompt`. The Open Tensions UI renders by `type`, so the per-pair distinct labels are what users see as section headings.
- **Multi-firing is canonical.** A user with multiple value-trust gaps gets multiple T-016 instances. Don't try to collapse them into a synthesis tension; T-015 has the synthesis-collapse pattern, but T-016's gaps are per-pair and read distinctly.
- **`rankAtMost` semantics:** returns `true` when the signal exists AND its rank is ≤ the threshold. So `!rankAtMost(signals, "education_trust_priority", 3)` returns `true` either when education ranks > 3 OR when education is absent. Both cases are valid "gap" conditions — the institution didn't make it into the top-3 trusted, regardless of why.
- **Null-safe predicates.** Verify the value signal AND the institution signal both exist before evaluating `rankAtMost`. The `valuePresent` / `trustPresent` guards in the pseudocode are load-bearing — without them, a thin-signal session could fire spurious T-016s.
- **Polish-layer integration is automatic.** CODEX-062's `buildEngineRenderedReport` already pushes every fired tension's `user_prompt` onto `lockedAnchors[]`. T-016 prompts inherit. No contract edit required.
- **Per the routing convention** the prompt file moves to `prompts/completed/` when shipped. Explicit reminder.
- **Pre-CC-064 saved sessions** re-render against current engine code on admin load. T-016 firings populate automatically when sessions re-derive.
- **CC-064 sequencing:** ships standalone. No file conflicts with CC-063 or earlier CCs. Active queue will be empty after CC-064 lands; the rewrite-track residual after that is OCEAN-as-Texture (Rules 6+1) and workMap-prose (Rule 2 in lib/workMap.ts).
