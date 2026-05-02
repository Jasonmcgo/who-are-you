# CC-048 — Report Calibration Canon Refinement + Audit Pass

**Type:** Canon-doc additions + read-only audit pass. **No prose rewrites. No engine logic changes. No new questions or signals.** Codifies the calibration rules surfaced through Clarence's review of the 2026-04-29 user report; produces an audit document flagging specific prose violations across the engine for follow-on rewrite CCs to inherit.
**Goal:** Raise the floor for every prose-touching CC that follows. The architecture-vs-furniture distinction has been validated through real-user calibration; this CC codifies the prose rules in canon and produces a single authoritative audit document so subsequent rewrite work can proceed against a settled standard rather than re-derive the rules per CC.
**Predecessors:** CC-025 (4-section ShapeCard architecture), CC-038-prose (single-word-label canon principle), CC-042 / CC-044 (Work Map / Love Map architecture establishing the Mirror-Map-Path layered hierarchy).
**Successor:** A series of prose-rewrite CCs (CC-049 through CC-054 or thereabouts) inherit the canon and the audit's flagged-violations list. Each rewrite CC takes a subset of the audit findings and rewrites them; CC-048 itself rewrites nothing.

---

## Why this CC

Real-user calibration on the 2026-04-29 report (Clarence's review) surfaced ten canonical authoring rules that, taken together, name the discipline distinguishing a *directional mirror* from a *precision instrument*. The architecture (Lens / Compass / Drive / OCEAN / aux-pair register / Work Map / Love Map / Giving Map) was validated as accurate; the *furniture* (label specificity, generic gift phrasing, reusable growth-edge phrases, cautious allocation prose, framework-as-section-label visibility) was identified as the calibration gap.

Three architectural reasons to codify these rules now rather than rewrite per CC:

1. **The rules touch many surfaces.** Frameworks-behind-scenes affects every section header decision. Generic-gifts-need-specificity affects the `GIFT_DESCRIPTION` map and every place that consumes it. Allocation-gap-3Cs-specific affects the Path · Gait composition. OCEAN-as-texture affects how Disposition Map output composes with the rest of the report. Codifying the rules once lets every downstream CC reference the same standard rather than re-derive it.

2. **An audit costs less than a rewrite and front-loads the discovery.** Walking the prose-emitting code with the canon in hand surfaces specific violations cheaply. Flagging is mechanical; rewriting is editorial and high-judgment. Splitting the work means subsequent CCs can be paced and review-bounded.

3. **CC-044 (Love Map) shipped with Love-specific rules baked in but without the cross-card canon.** The architecture-vs-furniture protection requires the canon to settle before the prose-rewrite track begins; otherwise each rewrite CC drifts from the others.

This CC's deliverable is two artifacts:

- **The Report Calibration Canon** — added to `docs/canon/result-writing-canon.md` and cross-referenced in `docs/canon/output-engine-rules.md`. Ten rules with rationale, violation/adherence examples, and where each rule applies in code.

- **The audit document** — `docs/audits/report-calibration-audit-YYYY-MM-DD.md`. Flagged violations across the prose-emitting engine, file:line citations, rule violated per finding, suggested fix direction (one-line-each, not full rewrite). Becomes the input for the prose-rewrite CC class.

CC-048 ships the canon. CC-049+ ships the rewrites. The architecture-vs-furniture distinction is preserved by the sequencing.

---

## Scope

Files modified or created:

1. `docs/canon/result-writing-canon.md` — major addition. New top-level section *"Report Calibration Canon (CC-048, added 2026-04-29)"* containing all ten rules with rationale + examples + scope-of-application.
2. `docs/canon/output-engine-rules.md` — cross-reference to result-writing-canon's calibration section. Light additions where the calibration rules touch engine-pipeline architecture (e.g., where OCEAN output composes with Mirror prose).
3. **NEW** — `docs/audits/report-calibration-audit-YYYY-MM-DD.md`. Single audit document with all flagged violations across the engine.
4. **NEW** — `docs/audits/README.md` (only if `docs/audits/` doesn't exist as a directory yet).

Nothing else. Specifically:

- **No rewrites of any prose.** Every flagged violation in the audit gets a file:line citation and a one-line fix direction; the actual rewrite happens in CC-049+.
- **No code logic changes.** Canon doc additions and audit document only.
- **No new questions, no new signals, no tagging-table changes.**
- **No section restructure of the report.** That's CC-055 territory (three-layer Mirror/Map/Path reorganization, queued separately).

---

## The ten calibration rules — locked content

The canon document gets the following ten rules verbatim. Each rule has: rule statement, rationale, violation example, adherence example, scope-of-application (which code surfaces the rule governs).

### Rule 1 — Frameworks behind the scenes

**Rule:** *"Jungian"*, *"OCEAN"*, *"3 C's"*, *"aux-pair register"*, *"Pauline framing"*, *"Greek bond types"* never surface as section labels or as named references in user-facing prose. The user sees the Mirror / Map / Path layers; frameworks inform the prose without naming themselves.

**Rationale:** The user is not taking a personality test about cognitive function theory. They are taking an instrument that proposes who they appear to be. Surfacing framework names turns the report into *"a graduate seminar wearing a personality-test costume"* (Clarence's phrase). The frameworks do their work as backend; the user reads sentences, not labels.

**Violation example:** A section header reading *"OCEAN Disposition Map"* or prose containing *"Your Big-5 profile shows..."* or *"In Jungian terms, you are a pattern-reader..."*.

**Adherence example:** Section header *"Disposition Map"* (without OCEAN reference) — or better, integrate the disposition reads into Mirror prose without the chart having its own section header. Prose: *"Your appetite for ambiguity shows up in the kinds of frames you build"* (high-O behavioral anchor) instead of *"Your high openness (38%) suggests..."*

**Scope of application:** Every section header in the rendered report. Every prose template in `lib/identityEngine.ts`, `lib/freeformProse.ts`, `lib/workMap.ts`, `lib/loveMap.ts`, `lib/ocean.ts`. The rule explicitly governs whether OCEAN appears as a standalone section (Disposition Map) or weaves through other sections — see Rule 6 for the resolution.

### Rule 2 — Generic gifts need user-specific second sentences

**Rule:** Every gift-category description in user-facing prose must include a second sentence that anchors the generic gift to the user's actual signal pattern. The first sentence names the category; the second sentence names *what this user's version of it does*.

**Rationale:** Generic gift labels (Discernment, Pattern, Integrity) flatter without informing. Most users would accept *"You have discernment"* as plausible; the report needs to earn the assertion by naming the discriminating signal pattern. *"Anomaly-detection across moral, strategic, and linguistic patterns when truth_priority and knowledge_priority both rank top-3"* is observation; *"Discernment"* alone is horoscope.

**Violation example:** *"A discernment gift. — You tend to detect what doesn't add up before it surfaces openly."* (Generic; reusable for any user with any Discernment route.)

**Adherence example:** *"A discernment gift. — You tend to detect what doesn't add up before it surfaces openly. For your shape, this expresses as anomaly-detection across moral, strategic, and linguistic patterns — noticing when language doesn't match reality, when an incentive doesn't match a stated objective, when a structure can't produce a promised outcome."* (Anchored to truth + knowledge + responsibility-attribution + structural-thinking signals.)

**Scope of application:** The 12 entries in `GIFT_DESCRIPTION` (`lib/identityEngine.ts:2114-2127`). Each entry's prose composition needs a per-user second sentence keyed to the user's signal pattern. The composition logic lives wherever Top 3 Gifts are rendered; the second sentence draws from whatever signals fired the gift category for this user.

### Rule 3 — Generic growth edges need user-specific second sentences

**Rule:** Every growth-edge phrase in user-facing prose must include a second sentence that anchors the generic edge to the user's actual signal pattern. *"Integrity becoming rigidity"* alone is reusable; the report needs the second sentence that names what *this user's* rigidity looks like.

**Rationale:** Growth-edge phrases are even more reusable than gift labels. *"Cynicism"*, *"pre-judgment"*, *"weather mistaken for shape"*, *"integrity becoming rigidity"* could appear in nearly any report. The second sentence is what makes them earn their place in this report.

**Violation example:** *"Pattern certainty becoming private fact. — Under ordinary pressure, the pattern-reader narrows the lens until certainty starts to feel like fact, while the present-tense self surfaces in cruder form."* (Generic; reusable for any pattern-reader user.)

**Adherence example:** *"Pattern certainty becoming private fact. — Rigidity for your shape isn't merely stubbornness. It's when a long-range read becomes morally fused before the room has caught up — the pattern feels obvious to you and premature to them, and you arrive at the conclusion before others can see the bridge you crossed."* (Anchored to long-arc reading + structural-thinking + holds_internal_conviction signals.)

**Scope of application:** The 12 entries in `GROWTH_EDGE_TEXT` (`lib/identityEngine.ts:2129-2142`). The 12 entries in `BLIND_SPOT_TEXT_VARIANTS`. Possibly the per-card Growth Edge sentences in the eight ShapeCard outputs.

### Rule 4 — Allocation-gap names the 3C's-specific question

**Rule:** The allocation-gap section in user-facing prose names the sharper 3C's-specific question rather than retreating to *"this may or may not mean anything."* The question varies by which bucket the user leans toward: cost-leaning users get the maintenance-vs-creation question; coverage-leaning users get the relational-presence question; compliance-leaning users get the protection-vs-paralysis question.

**Rationale:** The current allocation-gap prose is too cautious. Multiple disclaimers (*"this may or may not mean anything"*, *"the model cannot know motive"*, *"it could mean exhaustion, a difficult season..."*) make the section feel like it's apologizing for itself. The 3C's framework is one of the instrument's strongest differentiators; the prose should honor that with a sharp question rather than diluted hedging.

**Violation example:** *"You named Knowledge as among your most sacred values. Your money appears to flow mostly to family and yourself. That does not mean hypocrisy. The model cannot know motive. It could mean: exhaustion, a difficult season, needed self-care, social bonding, old habits, or a real gap between stated priority and lived allocation. The only fair question is: does this feel true, partially true, or not true at all?"* (Three sentences of disclaimer, one sentence of question.)

**Adherence example (cost-leaning user):** *"You named Knowledge as among your most sacred values. Your money flows mostly to family and yourself; your protected hours flow mostly to maintenance. The 3 C's question for your shape is sharper than 'do you donate enough to Knowledge causes?' It is whether your protected hours, creative output, and strategic attention are moving toward the future you say matters — or whether maintenance is consuming the life that was supposed to build it. Does this feel true, partially true, or not true at all?"*

**Scope of application:** The Allocation Gaps section composition (`lib/identityEngine.ts` or `lib/freeformProse.ts`; locate via grep on *"allocation"* or the literal current text). The composition needs to read which Drive bucket the user leans toward and select the matching sharp question.

### Rule 5 — Every report includes at least one uncomfortable-but-true sentence

**Rule:** Every report contains at least one observation the reader recognizes as probably true but doesn't enjoy reading. Prevents the report from sliding into pure flattery.

**Rationale:** Clarence's review: *"every report needs at least one sentence the user may not enjoy reading but recognizes as probably true."* Without this, the report becomes a *"flattering enough to share"* artifact rather than a tool for self-knowledge. The uncomfortable-but-true sentence is what distinguishes the instrument from a horoscope.

**Violation example:** A report with no observation that lands as a corner the reader didn't enjoy. The Jason0429 report on 2026-04-29 was flagged as flattering-throughout by Clarence; its closest approach to uncomfortable-but-true is the growth-edge section, but those phrases are too reusable to register as personal correction.

**Adherence example (for a long-arc-pattern-reader user):** *"You can confuse having absorbed more context with having earned more authority to conclude."* Or: *"You sometimes treat translation as optional because the pattern feels obvious to you."* (Both Clarence's examples for the Jason0429 read.)

**Scope of application:** A new structural slot in the Mirror layer — likely adjacent to the golden sentence ("Your gift is the long read. Your danger is believing it too early"). Each user gets a per-user uncomfortable-but-true sentence composed from their strongest tension between aspiration and current state. The composition logic is its own follow-on (CC-053 in the prose-rewrite track).

### Rule 6 — OCEAN reads as texture, not as standalone section

**Rule:** OCEAN observations weave into Mirror / Map / Path prose anchored to behavioral specifics. The Disposition Map either (a) keeps the bar chart as a quiet visual inside the Mirror layer with reframed copy that names behavior rather than percentages, or (b) deprecates as a standalone section entirely with OCEAN reads threading through other sections. **Per CC-048, decision is option (a): keep chart as quiet Mirror-internal visual; reframe copy from 'here are your Big-5 percentages' to 'here is how those traits show up.'**

**Rationale:** The current Disposition Map (CC-037 standalone section between Mirror and Compass) reads as the report announcing its own personality-test infrastructure. Clarence's review: *"OCEAN can add nuance, but I would not make it the star unless users already understand Big Five."* The bar chart still has informational value; the framing around it should be behavioral rather than psychometric.

**Violation example:** Section header *"DISPOSITION MAP"* with the framing paragraph *"Big-5 personality dimensions, derived from how you answered other questions in this instrument..."* — too explicit about the framework.

**Adherence example:** Section moves into Mirror layer (after Top 3 Gifts, before the Map opens) with reframed copy: *"How these tendencies show up in your week"* rather than *"Big-5 derived dimensions"*. The bar chart stays. OCEAN observations also weave into Mirror gift descriptions (*"Your appetite for ambiguity..."*) and Path mode prose (*"Your structuring instinct..."*).

**Scope of application:** `app/components/InnerConstitutionPage.tsx` (or whatever component assembles the report) — Disposition Map's render position and surrounding framing. `lib/ocean.ts` — `generateOceanProse` templates need reframed copy. `app/components/OceanBars.tsx` — the *(estimated)* subscript on N stays; section header context changes.

### Rule 7 — Display name vs narrative name separation

**Rule:** Two distinct fields. *Report label* preserves user-entered username (e.g., *"Jason0429"*) and appears in the report's metadata header. *Narrative name* is what prose uses — first name when detected, *"you"* / *"your"* otherwise. Username-pattern (digit suffix, underscore, all-lowercase) never appears as a third-person possessive in prose.

**Rationale:** *"Jason0429's gift is the long read"* fights the report's tone. *"Your gift is the long read"* lands. The username serves report identity (so a user can find their report later); the narrative name serves prose register.

**Violation example:** *"Jason0429's gift is the long read. Jason0429's danger is believing the long read too early. For Jason0429's shape, the meaningful allocation gap may not be..."* — username treated as first name throughout.

**Adherence example:** Report header: *"For: Jason0429"*. Prose: *"Your gift is the long read. Your danger is believing the long read too early. For your shape, the meaningful allocation gap..."*

**Scope of application:** CC-047 implements the username-pattern fallback in `getUserName`. CC-048 codifies it as canon and verifies the rule applies across every prose surface. Audit verifies no remaining literal-username-as-name uses.

### Rule 8 — Trust nuance: conditional framing, not categorical

**Rule:** Trust prose names the *condition* under which the user's trust extends rather than asserting a categorical label. Replace *"You trust non-profits and small business"* with *"You tend to trust institutions when responsibility, consequence, and mission stay close to the people making decisions."*

**Rationale:** Clarence's review: *"You do not seem to trust non-profits as a category naively. You may trust mission-driven organizations in theory, but only when they retain integrity and competence."* The categorical framing makes the user sound naive about institutional capture. The conditional framing names what the user is actually testing for.

**Violation example:** *"For hard truth, you appear to turn first toward your own counsel and a spouse or partner. Your top-trusted sources (Non-Profits, Small / Private Business, and your own counsel) are who you appear to weight most when truth is at stake."*

**Adherence example:** *"You tend to trust institutions when responsibility, consequence, and mission stay close to the people making decisions. Among the institutions in your top-trust ranking, Non-Profits and Small / Private Business sit highest — likely because they tend to hold those proximities better than larger, more abstracted forms. For relational truth, your own counsel and your spouse or partner are where you turn first."*

**Scope of application:** Trust card prose in `lib/identityEngine.ts` (search for *"trust"* / *"trusted source"* prose). Path · Gait composite where trust feeds into the synthesis.

### Rule 9 — Responsibility nuance: accountable actors inside systems

**Rule:** Responsibility-attribution prose names *"accountable actors inside systems"* rather than *"individual responsibility vs system blame"* binary. Preserves the user's structural-thinking dimension without making them sound reductionist.

**Rationale:** Clarence's review: *"You do seem to resist vague system-blame. But you also spend a lot of time thinking structurally. So you are not simply an 'individual responsibility' person. The better read: you look for the accountable actor inside the system, not instead of the system."* The categorical framing flattens what's actually a structural-with-accountability stance.

**Violation example:** *"When something goes wrong, you appear to look first toward Individual and Authority."*

**Adherence example:** *"When something goes wrong, you appear to look first for the accountable actor inside the system — Individual and Authority rank highest in your responsibility weighting because they name *who* had agency, who made the decision, who failed to act. That doesn't mean you skip the system; it means you locate where the system became personal."*

**Scope of application:** Gravity card prose (`lib/identityEngine.ts` Gravity composition). The Synthesis section's responsibility framing.

### Rule 10 — Peace disambiguation via cross-signals

**Rule:** When `peace_priority` ranks in a user's Compass top, the prose composes the user's specific peace-meaning from cross-signal pattern: moral peace (with truth + knowledge + honor) / structural peace (with system_responsibility + stability + restoring_energy) / relational peace (with family + caring_energy + close_relationships_stakes) / surface peace (with adapts_under_social_pressure + holds_internal_conviction low).

**Rationale:** *"Peace"* is overloaded as a value-label. Different users mean different things by it. The instrument's existing signal portfolio can disambiguate without asking a new question — cross-signal interpretation is the canonical resolution. Per Jason 2026-04-29: *"Comfort is the enemy of Peace"* names the moral-peace register; the prose should be able to render this without conflating with surface-peace.

**Violation example:** *"You named Peace as among your most sacred values."* — flat, no disambiguation, leaves the user's actual peace-meaning unread.

**Adherence example (moral-peace pattern):** *"You named Peace among your most sacred values — and your other rankings suggest you mean it in the metaphysical / moral register rather than the conflict-avoidance register: Truth and Honor compose with Peace in your top values, and your willingness to bear cost suggests you'd disturb surface ease to protect durable order. For your shape, peace is what comfort sometimes obstructs."*

**Scope of application:** Compass card prose where `peace_priority` is read. Path · Gait composite where peace_priority feeds the synthesis. New cross-signal interpretation rule in `lib/identityEngine.ts` or wherever Compass composition happens.

---

## The audit pass — locked methodology

The audit walks every prose-emitting surface in the engine, checks each prose template against each of the ten rules, and produces a single flagged-violations document. **No rewrites.** Each violation entry has:

```
- File: lib/identityEngine.ts:2118
  Rule violated: Rule 2 (generic gifts need user-specific second sentence)
  Current text: "Action — you tend to move when others freeze, and to learn by engaging the situation as it actually is"
  Issue: Reusable across any Action-route user; no anchor to specific signal pattern.
  Fix direction: Add second sentence keyed to the route's discriminating condition (Se+freedom_priority → "alive in the field"; Se+creator-agency → "embodied building"; Se default → "presence-as-engagement").
```

Surfaces to walk:

1. `lib/identityEngine.ts`:
   - `GIFT_NOUN_PHRASE` (line 2099)
   - `GIFT_DESCRIPTION` (line 2114)
   - `GROWTH_EDGE_TEXT` (line 2129)
   - `BLIND_SPOT_TEXT_VARIANTS` (line 2024)
   - `SHAPE_CARD_PRACTICE_TEXT` (line 2159)
   - `SHAPE_CARD_PATTERN_NOTE` (line 2178)
   - `CROSS_CARD_PATTERNS` prose functions (lines 3705+)
   - `THESIS_TEMPLATES` and `THESIS_FALLBACK_BY_FUNCTION` (lines 4007+)
   - `GIFT_DANGER_LINES` (lines 3970+)
   - Allocation Gaps composition (locate via grep)
   - Synthesis section composition (locate via grep)
   - Compass / Gravity / Trust card composition (locate via grep on card-name)

2. `lib/freeformProse.ts` (or wherever Path · Gait composite lives):
   - Work / Love / Give compression closers
   - Aspirational direction prose

3. `lib/workMap.ts`:
   - 8 work-register `register_label` and `short_description` fields
   - 8 `example_anchors` lists
   - `generateWorkProse` templates

4. `lib/loveMap.ts` (post-CC-044 ship; if CC-044 hasn't shipped yet, audit-by-spec from the prompt):
   - 7 register `register_label`, `short_description`, `characteristic_distortion` fields
   - 7 flavor `flavor_label`, `short_description` fields
   - Resource Balance prose templates
   - `generateLoveProse` templates

5. `lib/ocean.ts`:
   - `BUCKET_LABEL` and `BUCKET_LABEL_SHORT`
   - `generateOceanProse` templates (4 cases: single-dominant / two-dominant / balanced / n-elevated)

6. `app/components/InnerConstitutionPage.tsx`:
   - Section headers (Rule 1 and Rule 6)
   - Disposition Map framing paragraph (Rule 6)
   - Work Map / Love Map / Giving Map framing paragraphs

The audit document is structured by surface (one section per file), then by rule within surface. Each entry follows the format above. Total expected length: ~150-300 flagged entries across ten rules and seven surfaces.

---

## Steps

### 1. Author the Report Calibration Canon section in `docs/canon/result-writing-canon.md`

Add a new top-level section *"Report Calibration Canon (CC-048, added 2026-04-29)"* with all ten rules per the locked content above. Each rule's full statement, rationale, violation example, adherence example, scope of application.

### 2. Cross-reference in `docs/canon/output-engine-rules.md`

Add a brief section after the existing CC-038-prose canon principles section: *"Report Calibration Canon (see result-writing-canon.md § Report Calibration Canon)"* with one-line summaries of each rule and a pointer back to the full canon doc. Where any rule directly affects engine-pipeline behavior (Rule 6 OCEAN render position; Rule 7 username fallback), add a brief note.

### 3. Walk every prose-emitting surface and flag violations

Read each surface listed above. For each prose template, check against each rule. Flag any violation per the locked entry format.

### 4. Compose the audit document

Single file at `docs/audits/report-calibration-audit-YYYY-MM-DD.md` (use `git rev-parse HEAD` and current date in header). Structure:

- Header block: audit date, codebase commit hash, executing engineer, one-paragraph executive summary.
- Section 1: Audit methodology (point to canon).
- Section 2: Surface-by-surface findings (one subsection per file, entries within ordered by line number).
- Section 3: Aggregated rule-violation counts per rule (helps prioritize the rewrite track).
- Section 4: Suggested CC sequencing for the prose-rewrite track (which findings cluster naturally into a single rewrite CC; e.g., all Rule 2 violations might cluster into CC-049 — Gift Specificity Rewrite).

### 5. Create `docs/audits/README.md` if directory is new

One-paragraph framing per the CC-039 spec convention.

### 6. Verification

- Audit document exists at the expected path.
- Every section is present per the structure above.
- Each violation has file:line + rule + current text + issue + fix direction.
- Audit's flagged count matches a sanity-check expectation (~150-300 entries).
- `npx tsc --noEmit`, `npm run lint`, `npm run build` all pass — but expected since this CC modifies only docs.
- `git diff --stat` shows changes only in `docs/canon/result-writing-canon.md`, `docs/canon/output-engine-rules.md`, and the new `docs/audits/` files.

### 7. No browser smoke required

Documentation CC. No code changes. No user-visible surface affected.

---

## Acceptance

- `docs/canon/result-writing-canon.md` contains the Report Calibration Canon section with all ten rules per the locked content (rule statement + rationale + violation example + adherence example + scope of application per rule).
- `docs/canon/output-engine-rules.md` cross-references the calibration canon.
- `docs/audits/report-calibration-audit-YYYY-MM-DD.md` exists with the audit findings.
- `docs/audits/README.md` exists if the directory was new.
- Audit findings cite file:line for every violation.
- Audit's "Suggested CC sequencing" section identifies which rewrite CCs naturally inherit which findings.
- `git diff --stat` shows changes only in named files.
- No code logic changes. No prose rewrites. No new questions or signals.

---

## Out of scope

If you find yourself doing any of these, stop and flag — they belong elsewhere:

- **Rewriting any prose template flagged by the audit.** That's CC-049+. The audit's job is to flag; the rewrite CCs inherit the flags.
- **Adding new rules beyond the ten in the locked content.** Workshop further rules in chat; codify in a future CC if needed.
- **Restructuring the report's layered architecture (Mirror / Map / Path).** That's CC-055 (queued separately). CC-048 codifies prose rules; the IA reorganization is its own CC.
- **Changing OCEAN's render position before the canon settles.** Rule 6 specifies option (a) — keep chart, reframe copy — but the actual relocation work belongs to CC-055 or a dedicated CC, not CC-048.
- **Modifying any `lib/*.ts` file.** This is a docs + audit CC. No code edits.
- **Re-running CC-039's wiring audit.** Different audit; different scope.
- **Authoring rewrite suggestions in the audit beyond the one-line fix direction per finding.** The audit flags; the rewrite CCs author.
- **Auditing surfaces not on the listed-surfaces list.** If a prose-emitting file isn't on the list, the audit notes its existence in a closing-section "potential further surfaces" but doesn't audit it deeply.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

Codex equivalent acceptable.

## Execution Directive

Single pass. The ten calibration rules are locked content per the Locked-Content section — verbatim into the canon doc with the structure given. The audit methodology is locked — file:line citations, no rewrites, structured by surface then by rule. Don't add scope; don't rewrite prose; don't restructure the report.

## Bash Commands Authorized

- `grep -rn` against `lib/` and `app/` for finding prose templates and section headers (read-only)
- `git rev-parse HEAD` (audit header block)
- `npx tsc --noEmit`, `npm run lint`, `npm run build` (verification — should all pass since no code changes)
- `git diff --stat`, `git status`

## Read First (Required)

- `AGENTS.md`
- `docs/canon/result-writing-canon.md` — locate where the calibration canon should land relative to existing canon sections.
- `docs/canon/output-engine-rules.md` — locate cross-reference position.
- `lib/identityEngine.ts` — full read for `GIFT_NOUN_PHRASE`, `GIFT_DESCRIPTION`, `GROWTH_EDGE_TEXT`, `BLIND_SPOT_TEXT_VARIANTS`, `SHAPE_CARD_PRACTICE_TEXT`, `SHAPE_CARD_PATTERN_NOTE`, `CROSS_CARD_PATTERNS` prose functions, `THESIS_TEMPLATES`, `GIFT_DANGER_LINES`, allocation/synthesis composition.
- `lib/freeformProse.ts` (or where Path · Gait composite lives) — Work / Love / Give compression closers.
- `lib/workMap.ts`, `lib/loveMap.ts` (post-CC-044 if shipped, or audit-by-prompt otherwise), `lib/ocean.ts`.
- `app/components/InnerConstitutionPage.tsx` — section headers, framing paragraphs.
- `prompts/completed/CC-038-prose.md` — for the canon principles already in place that compose with the new ten rules.
- `prompts/completed/CC-042-work-map.md` and `prompts/active/CC-044-love-map.md` — for context on the Mirror-Map-Path layer architecture.

## Allowed to Modify

- `docs/canon/result-writing-canon.md`
- `docs/canon/output-engine-rules.md`
- `docs/audits/report-calibration-audit-YYYY-MM-DD.md` (new)
- `docs/audits/README.md` (new, only if directory is freshly created)

**No `lib/*.ts` files. No `app/*.tsx` files. No `data/questions.ts`. Audit-and-canon-only CC.**

## Report Back

1. **Files modified or created** — paths.
2. **Canon section verified** — confirm all ten rules are in `result-writing-canon.md` with the locked structure (rule + rationale + violation + adherence + scope).
3. **Audit highlights** — top three most frequent rule violations across the codebase. Top three surfaces with most flagged findings. Don't paste the whole audit.
4. **Suggested CC sequencing** — confirm the audit's Section 4 names the rewrite CCs that naturally inherit clustered findings. Recommend CC numbers.
5. **Verification results** — confirm tsc / lint / build all pass (expected since no code changes).
6. **Out-of-scope drift caught** — anything considered and rejected.
7. **Any rule that landed less precisely than the locked content** — flag for editorial follow-up rather than silently revising.

---

## Notes for the executing engineer

- **The ten rules are locked content.** Verbatim into the canon doc with the structure given. Editorial refinement of rule wording is post-ship workshop; this CC ships the rules as written.
- **The audit is mechanical, not editorial.** Walk the surfaces, check templates against rules, flag with file:line + rule + issue + fix direction. Don't compose rewrites; don't workshop replacements; don't decide which violations are worse. Severity ranking happens in the rewrite CCs.
- **The "Suggested CC sequencing" section in the audit is the bridge to the rewrite track.** Cluster findings by rule (or by surface-and-rule pair) to suggest natural rewrite-CC scopes. CC-049 might be *"all Rule 2 (generic gifts) violations"*; CC-050 might be *"all Rule 4 (allocation gap) violations"*; etc. The clustering helps Jason pick the next rewrite CC.
- **OCEAN render-position decision (Rule 6) ships as option (a) — keep chart, reframe copy.** The actual relocation of the Disposition Map section and copy refresh is its own CC (likely CC-055 or grouped with the three-layer restructure). CC-048 codifies the rule; it doesn't move the section.
- **The audit document filename** should use the current date and may include the commit hash if the worktree is dirty. If a CC-039 wiring-audit document was supposed to exist but never landed, that's separate; don't conflate.
- **Pre-CC-048 saved sessions** are unaffected by this CC. No code changes. Reports re-render identically.
- **The architecture-vs-furniture distinction** is the load-bearing principle this CC protects. The rules protect the furniture; the architecture stays as-is. If during execution a rule seems to push toward architectural change, surface as a workshop question rather than committing.
- **Subsequent prose-rewrite CCs (CC-049+) inherit the audit and do the actual rewrites.** Each rewrite CC takes a clustered subset of findings and authors per-user-specific replacements. The rewrite CCs are paced and reviewable per cluster; the audit consolidates the discovery so the rewrites don't have to re-derive the rules.
