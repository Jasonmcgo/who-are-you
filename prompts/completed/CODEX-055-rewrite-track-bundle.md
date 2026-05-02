# CODEX-055 — Rewrite-Track Bundle (CC-052b Sentence-2 anchors · CC-058 Ten Use-Case Slots · Name-Resolution Audit · Q-X3 cross-rank canon correction)

*(Filename CODEX-055 per the agent-routing convention 2026-04-29 in `feedback_codex_vs_cc_prompt_naming.md`: locked-content / surgical / mechanical scope; four independent items bundled. Numbering shares the global CC-### sequence; the prefix is routing metadata.)*

**Type:** Four independent, locked-content surgical items. **No new logic. No new prose authored beyond what is locked verbatim in this prompt. No canon decisions delegated to the executor.** Each item is single-file or two-file, locked outcome, no judgment calls.

**Goal:** Close four discrete defects/gaps surfaced after CC-054 shipped: (1) two Sentence 2 anchor fallback misfires in CC-052's gift specificity rewrite (Integrity non-Fi cross-route + Builder NiTe aux-pair); (2) add ten locked use-case slots to the report's "What this is good for" surface (CC-058); (3) audit and close any remaining surfaces that bypass `getUserName(demographics)` and render literal username (CC-047 / CODEX-051 follow-on); (4) correct a canon-doc assertion about Q-X3-cross / Q-X4-cross item counts that doesn't match the repo (CC-035 ship-report flagged the mismatch).

**Predecessors:** CC-052 (Gift Specificity Rewrite — Sentence 1/Sentence 2 architecture; Codex's manual sweep flagged the two anchor misfires fixed here), CC-047 (Username-as-name fallback fix), CODEX-051 (caught one bypass surface in `lib/beliefHeuristics.ts`; the audit here closes the remaining surfaces), CC-035 (Belief Stress-Test Expansion — Codex's ship-report noted the prompt asserted Q-X3-cross/Q-X4-cross item counts that didn't match repo state).

**Successor:** None hard-blocked. Closes the remaining surgical follow-ons accumulated post-CC-052 so the next prose-rewrite-track CCs (CC-055 Mirror Layer Rule 5; CC-056 Love Map polish; CC-059+CC-060 Allocation/Growth Edge) start clean.

---

## Why this CODEX

Each of the four items is small, locked, and unrelated to the other three architecturally. Bundled because:

- All four are surgical (5-50 lines each).
- All four were surfaced during admin-portal re-render validation 2026-04-30 against Jason0429.
- None overlap in files modified.
- Splitting into four CODEX prompts quadruples ship overhead for what is one calibration sweep.
- Per the CODEX-/CC- routing convention: docs/surgical/mechanical scope with locked outcomes belongs in CODEX-###.

The four items do **not** constitute the rewrite track. The substantive prose-rewrite-track CCs (CC-055 Mirror Layer / CC-056 Love Map polish / CC-059+CC-060 / CC-061 / CC-062) follow this bundle.

---

## Item 1: CC-052b — Two Sentence-2 Anchor Fallback Misfires

### Symptom

Codex's manual sweep of CC-052's shipped output against Jason0429 surfaced two cases where the most-specific Sentence 2 doesn't fire and the prose lands on the no-discriminator fallback:

1. **Integrity (non-Fi cross-routed).** Jason0429 is routed to Integrity not via Fi-dominance but via cross-card route (`pickGiftCategory` falls through Fi-specific conditions and reaches Integrity through truth_priority + honor_priority cross-signal). CC-052's Integrity Sentence 2 candidates all gate on `Fi-dominant + …`. Non-Fi cross-routed users hit the no-discriminator fallback ("the inner compass that doesn't bend to social weather") which is structurally accurate but loses the *cross-routing pattern* that actually fired the category for them.

2. **Builder (NiTe aux-pair).** Builder's Sentence 2 candidates gate on `Te-dominant + creator-agency` and `Te-dominant + system_responsibility_priority`. NiTe aux-pair users (Ni-dominant with Te auxiliary, the long-arc-architect aux-pair register from CC-038-prose) read the Builder category through the *aux-pair* lens, not the dominant-Te lens. They hit the no-discriminator Builder fallback, missing the long-arc-architect texture that CC-038-prose locked.

### Locked content (Anchor A for both)

Per Jason 2026-04-30: **"Workshop 1, agree with A for all."**

Add a new Sentence 2 anchor to each affected category, fired by the actual routing pattern. **Verbatim. Do not rewrite.**

#### Integrity — new Sentence 2 anchor (non-Fi cross-routed)

Add a new conditional ahead of the no-discriminator fallback:

- **Condition:** Integrity category fired AND `lensStack.dominant` is NOT `"fi"` AND (`truth_priority` in Compass top 5 OR `honor_priority` in Compass top 5) AND CC-052's existing Fi-dominant conditions did NOT match.
- **Locked Sentence 2:** *"For your shape, this expresses as conviction earned through examination — what survives your testing becomes worth defending, even when the defense is socially costly."*

#### Builder — new Sentence 2 anchor (NiTe aux-pair)

Add a new conditional ahead of the no-discriminator fallback:

- **Condition:** Builder category fired AND `getFunctionPairRegister(lensStack).pair_key === "ni-te"` AND CC-052's existing Te-dominant conditions did NOT match.
- **Locked Sentence 2:** *"For your shape, this expresses as the long-arc architect — building the structure the future shape requires, not the structure the present demands."*

### Locked changes

1. Locate the `getGiftSpecificity` selector (or the equivalent composer added by CC-052) in `lib/identityEngine.ts`.
2. For Integrity: insert the new conditional **before** the no-discriminator fallback and **after** the existing Fi-dominant conditions. Order: existing Fi-dominant conditions → new non-Fi cross-routed conditional → no-discriminator fallback.
3. For Builder: insert the new conditional **before** the no-discriminator fallback and **after** the existing Te-dominant conditions. Order: existing Te-dominant conditions → new NiTe aux-pair conditional → no-discriminator fallback.
4. Use the existing `topCompass` / `lensStack` / `getFunctionPairRegister` accessors — no new helpers required.
5. Both Sentence 2 strings copied **verbatim** from the locked content above, including em-dashes and punctuation.

### Acceptance per item

- Re-rendered Jason0429 (admin route per CODEX-050) shows the new Builder anchor when Builder fires; shows the new Integrity anchor when Integrity fires for a non-Fi cross-routed user.
- The previous no-discriminator fallback still fires when neither the new conditional nor the existing dominant conditionals match (e.g., a Te-dominant non-NiTe user without creator-agency / system_responsibility_priority).
- No other gift category's Sentence 2 logic changes.
- `npx tsc --noEmit` clean.

### Out of scope

- **Rewriting the existing Sentence 2 candidates.** Pure additive; existing strings preserved verbatim.
- **Adding analogous anchors to other gift categories.** If the executor notices similar fallback misfires for other categories (e.g., Pattern for SiNe users, Discernment for Ti-aux users), surface in Report Back; do not silently add anchors. CC-052b is locked to Integrity + Builder only.
- **Touching `pickGiftCategory` or `categoryHasSupport`.** Routing logic untouched; CC-052b only changes which Sentence 2 fires once a category is routed.

---

## Item 2: CC-058 — Ten Use-Case Slots ("What this is good for")

### Why

The current report ends without a closing surface naming **what the user can actually do with the read**. Real-user testing 2026-04-28 surfaced the gap; the user finishes the report unsure whether it's a horoscope to read once or an instrument to consult repeatedly. Naming concrete use cases is the cheapest way to convert the report from artifact to instrument.

Per Jason 2026-04-30: **"#2 let's keep all 10 and refine as we receive more feedback."** All ten ship; calibration through user feedback rather than pre-launch trimming.

### Locked content (10 use cases)

Verbatim. Do not rewrite. The section appears below the existing Path/Next-Move surface and above the masthead-footer / share affordance. Section heading: *"What this is good for."* Subhead: *"This is not a verdict. It's a read you can return to. Here are ten places it earns its keep."*

Each use case is a single titled paragraph (1-3 sentences). Render as a vertical list with no numbering visible to the user (numbering shown here for the executor only).

1. **Career decisions.** *"When the next role is on the table, the question is not which job sounds best. It's whether the role would draw on the gifts the read named, leave the gravity you ranked highest intact, and let your driver function operate without distortion. Run the role against your top three gifts and your top three Compass values; if the answer is structurally flat, the role is wrong for you regardless of the title."*

2. **Work-energy choices.** *"When you're choosing between two efforts that both make sense on paper, your driver register and your work-map composite tell you which one will give you energy back rather than draining it. Effort that aligns with your driver tends to feel like resistance you welcome; effort that aligns with the work-map's anti-shape tends to feel like resistance that costs."*

3. **Family and coworker explanations.** *"When the people closest to you are confused by what you do, the analog label and the driver/instrument language give you something portable to hand them. Not 'I'm an INTJ' — instead 'I'm running the long-arc-architect register; the structure I'm building isn't the one this room is asking for, but it is the one I'm built to build.' Read it back to yourself first; share the parts that hold."*

4. **Conviction-vs-rigidity check.** *"When you can't tell whether you're holding a principled line or a defensive one, the read names which Compass values are protect-class for you and which are aspirational. Conviction holds protect-class items; rigidity holds aspirational items past their evidentiary weight. The read tells you which is which for you."*

5. **Building-vs-maintaining check.** *"When you're choosing whether to build a new thing or steward the existing one, the gift category fired and the work-map composite tell you which mode is yours by default. Builders forced to steward erode; stewards forced to build flounder. Knowing your default doesn't lock you to it; it tells you which mode is the costlier ask for you."*

6. **Principled-vs-familiar fight check.** *"When a fight is worth it, the read tells you whether you're fighting for what your Compass actually protects or for what feels familiar to defend. The Compass top 5 plus the willing-to-bear-cost signal compose the test: if you'd bear the cost named, the fight is principled; if you wouldn't, the fight may be habit."*

7. **Faith and belief patterns under pressure.** *"When your faith or belief is being pressed — by grief, by complexity, by social weather — the Faith Shape and Faith Texture composing in your read tell you which register is operating now and which is recovering. Not 'do you still believe' but 'which way of holding belief is doing the work right now, and which is in repair.'"*

8. **Love calibration.** *"When the relationship feels off, the love-map register and the love-flavor naming what you mean by love tell you whether the gap is incompatibility or under-translation. Two people in adjacent love registers can read each other as 'not loving me' when both are loving in their respective registers. The read gives you a shared vocabulary."*

9. **Sharing the profile.** *"When you want a friend, partner, or therapist to see how you're put together, the report is a portable read they can engage without you having to perform yourself. The masthead's 'a possibility, not a verdict' framing is doing real work — share with that frame intact, and the conversation it opens is more useful than the report alone."*

10. **Periodic return.** *"This read is a snapshot of your current shape, not a permanent label. Return to it when you've been changed by something — grief, success, a new relationship, a season of doubt, a season of clarity. Your gifts and Compass values rarely flip; their composition often re-weights. Re-take the assessment when the question 'has this shifted' starts mattering."*

### Locked changes

1. **Add new component `app/components/UseCasesSection.tsx`** rendering the section heading, subhead, and the ten use-case paragraphs verbatim. Use the existing typography conventions from `MapSection.tsx` / `PathSection.tsx`. No new design tokens.
2. **Wire into `app/components/InnerConstitutionPage.tsx`** — render `UseCasesSection` after the Path/Next-Move section (`PathSection`) and before any masthead-footer / share affordance.
3. **Add the section to `lib/markdownExport.ts`** (or wherever markdown export composes — search for the existing Path-section export composer) so the use cases appear in shared/exported reports too.
4. **No engine logic.** The use cases are static content; no signal-derived gating, no per-user variation. Every user sees the same ten paragraphs.

### Acceptance per item

- Rendered report shows the *"What this is good for"* section after Path, before footer/share, with all ten paragraphs in the locked order with locked content.
- Markdown export includes the section.
- `grep -rn "What this is good for" app/ lib/` returns the new component file as the only source.
- `npx tsc --noEmit` clean.
- No engine logic added; section is static content only.

### Out of scope

- **Per-user variation in the use cases.** Static content for now; if user feedback flags use cases that don't apply to certain shapes, future CC handles per-shape gating. Not now.
- **Numbering visible to the user.** Render as paragraphs with bold titles, not numbered list. The numbers in this prompt are for executor reference only.
- **Trimming or rewriting the locked text.** All ten ship verbatim per Jason's lock.
- **Adding interaction (Yes/No, "Tell me more", etc.).** Static content; no interactive layer.

---

## Item 3: Name-Resolution Audit

### Why

CC-047 added `getUserName(demographics)` as the canonical fallback resolver for username-as-display-name patterns (e.g., "Jason0429" → "you" / "your"). CODEX-051 caught one bypass surface in `lib/beliefHeuristics.ts` (`findName` had its own helper). It is likely there are more.

The audit confirms no surfaces remain that read username directly without the fallback heuristic. This is a read-mostly pass — the audit produces a list of every user-name read site, classifies each as routed-through-`getUserName` or bypass, and fixes any bypasses surgically.

### Locked changes

1. **Audit pass.** Run a comprehensive grep across `app/` and `lib/` for every user-name read pattern:
   - `data.display_name`
   - `session.name`
   - `user.name`
   - `demographics?.first_name` (direct read without `getUserName`)
   - `demographics?.preferred_name`
   - `answers.find(a => a.questionId === "Q-DEMO-name"...)` (direct)
   - any string interpolation containing the literal `${name}` or `${user...name}` or `${session...name}`
   - any place that reads from `Q-DEMO` answers directly for name purposes
2. **Classify each match** as one of:
   - **Routed** — already wraps the read in `getUserName(demographics)` and applies the `nameOrYour` / `nameOrYou` fallback. Leave alone.
   - **Bypass-prose** — emits a literal username into user-facing prose without the fallback. **Fix surgically** by routing through `getUserName(demographics)` and applying the standard fallback (`getUserName(demographics) ? \`${name}\` : "you"` for nominative; `getUserName(demographics) ? \`${name}'s\` : "your"` for possessive; capitalize sentence-initial fallbacks).
   - **Backend** — uses the username for non-prose purposes (storage key, log line, analytics, admin UI label). Leave alone, but document in Report Back.
3. **Fix all bypass-prose sites** in this pass. Use the same fix pattern CC-047 / CODEX-051 used.
4. **Do NOT refactor `getUserName`** beyond fixing bypasses. If the executor notices that `getUserName` itself has a bug or could be improved structurally (e.g., a single canonical resolver service), surface as Report Back rather than refactoring inside this CODEX.

### Acceptance per item

- After the audit, `grep -rn "Jason0429\|display_name\|session.name\|user.name" app/components app/page.tsx app/admin lib/` shows every match either:
  - Inside `getUserName` itself (one site), or
  - Routed through `getUserName(demographics)` with the fallback pattern, or
  - Backend-only (admin label, storage key, analytics) and explicitly documented in Report Back.
- Re-rendered Jason0429 admin session shows **zero** instances of the literal string "Jason0429" in any user-facing prose surface (Mirror, Map, Path, Disposition Map, Work Map, Love Map, Open Tensions, Synthesis, Keystone Reflection, "What this is good for" section).
- Real-name users (e.g., demographics.first_name = "Madison") still render with their first name correctly across all surfaces.
- `npx tsc --noEmit` clean.

### Out of scope

- **Refactoring `getUserName` itself.** If the audit suggests a single-resolver-service architecture, document in Report Back; CODEX-055 does not refactor.
- **Changing username storage, login flow, or session management.** This audit touches *prose* read sites only.
- **Touching the Q-DEMO answer schema.** Demographics question structure is locked; this audit reads it correctly, doesn't redesign it.
- **Adding a name-validation regex or rejecting "username-shaped" first names at intake.** Not the scope; the heuristic in `getUserName` is the canonical detector.

---

## Item 4: Q-X3 / Q-X4 Cross-Rank Canon Correction

### Why

CC-035's prompt asserted that Q-X3-cross had "6+ items" and Q-X4-cross had "5 items" — Codex's ship-report flagged that the actual repo state has both at 4 items (top-2-from-each-parent composition). The math still worked (4 ≥ top-3 derivation Q-I3 cascade requires), so user-facing output landed correctly.

But the canon docs (`docs/canon/derivation-rules.md` and similar) and the audit document (`docs/audits/report-calibration-audit-2026-04-29.md`) carry the inflated item counts as written, which will mislead the next CC author who reads them. Correct the canon to match the repo.

### Locked changes

1. **Audit pass.** Search canon and audit docs for the asserted item counts:
   - `grep -rn "Q-X3-cross.*6\|Q-X4-cross.*5\|6 items\|5 items.*Q-X4\|6+ items\|top-6\|top-5" docs/`
2. **Identify each occurrence** and check whether the assertion is about Q-X3-cross / Q-X4-cross item counts or about something else (e.g., Compass top-5).
3. **Correct each Q-X3-cross / Q-X4-cross item-count assertion** to read **4 items** (top-2 from each parent, post-CC-031 / CC-032 cascade structure). Add a parenthetical note where appropriate: *"(top-2 from each of the two parent questions, composed)."*
4. **Do NOT change repo behavior.** This is a docs-only correction; questions.ts / derivation logic / engine code is untouched.
5. **Mark the correction in the audit doc** under the relevant rule's notes section: *"CODEX-055 corrected the Q-X3-cross/Q-X4-cross item-count assertion from CC-035; actual count is 4 (top-2 from each parent), and current derivation math (top-3 from cross) holds."*

### Acceptance per item

- `grep -rn "Q-X3-cross.*6\|Q-X4-cross.*5" docs/` returns zero hits.
- All references to Q-X3-cross / Q-X4-cross item counts in canon and audit docs read **4 items**, with the parenthetical clarification where the count is load-bearing.
- No code changes — `git diff lib/ data/ app/` returns empty.
- The audit doc carries the explicit correction note.

### Out of scope

- **Changing the actual item count** in `data/questions.ts` or the derivation cascade. The math works; only the docs are wrong. Not this CODEX.
- **Re-running CC-035's belief stress-test analysis** with corrected counts. Not the scope; Codex's ship-report already confirmed the math holds at 4.
- **Touching other canon-doc assertions** that may also drift from repo state. Out of scope for this item; if the audit pass surfaces additional drift, document in Report Back.

---

## Verification (all four items)

- `npx tsc --noEmit` exits 0.
- `npm run lint` passes.
- `npm run build` exits 0 (consecutive clean build post-CODEX-049).
- Manual sweep deferred to Jason: load Jason0429's saved session in admin via `/admin/sessions/[id]`. Confirm:
  - Builder Sentence 2 reads the long-arc-architect anchor.
  - Integrity Sentence 2 reads the conviction-earned-through-examination anchor (if Integrity fires for the user — Jason0429's specific compass may or may not route to Integrity; verify with the Integrity-route audit answers).
  - "What this is good for" section appears after Path with all ten paragraphs in order.
  - Markdown export carries the new section.
  - Zero "Jason0429" in any user-facing prose surface.
  - Audit reports list of every name-read site with classification.
  - Q-X3-cross / Q-X4-cross item-count assertions in canon and audit docs read **4**.

---

## Out of scope (whole CODEX)

- **Rewriting any prose** beyond the four locked-content items. The substantive prose-rewrite-track CCs (CC-055 Mirror Layer / CC-056 Love Map polish / CC-059+CC-060 Allocation/Growth Edge / CC-061 / CC-062) handle the broader rewrite; CODEX-055 only ships these four locked items.
- **Adding new gift-category Sentence 2 anchors** beyond the two locked here.
- **Adding interactivity** to the use-cases section.
- **Refactoring `getUserName` or the demographics resolver service.**
- **Changing question item counts** in `data/questions.ts`.
- **Touching the rewrite-track CCs' content.**
- **Touching CC-053's admin answer-edit components.** That CC is shipped and its surface is independent.
- **Adding tests.** No tests exist on these surfaces; not adding any here.
- **MVP product-vision work** (auth/account/PDF/newsletter/share/population). Per `project_mvp_product_vision.md`: post-launch noodling, not in scope until MVP planning starts.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

Codex equivalent acceptable. **This prompt is filed CODEX- because the scope is surgical / mechanical / docs-only with locked content; routing it to Codex is the intended path.**

## Execution Directive

Single pass. Four items; verify each independently in the manual sweep. **All content is locked verbatim; do not rewrite, paraphrase, or "improve" the locked text.** If the executor encounters an architectural surprise (e.g., the Sentence 2 selector's structure prevents adding the new conditional cleanly, or the use-cases markdown export composer doesn't have an obvious wire point), surface as Report Back rather than restructuring on the fly. **Move prompt to `prompts/completed/` when done.**

## Bash Commands Authorized

- `grep -rn "Jason0429\|display_name\|session.name\|user.name\|preferred_name\|getUserName\|nameOrYour" app/ lib/`
- `grep -rn "Q-X3-cross\|Q-X4-cross\|top-6\|top-5.*cross\|6+ items\|6 items" docs/`
- `grep -rn "What this is good for\|UseCasesSection" app/ lib/`
- `cat <file>` (verifying changes)
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` (smoke; kill before exiting)
- `mv prompts/active/CODEX-055-rewrite-track-bundle.md prompts/completed/CODEX-055-rewrite-track-bundle.md`
- `git diff --stat`
- `git status`

## Read First (Required)

- `AGENTS.md` (workflow, especially the active → completed move convention).
- `docs/canon/result-writing-canon.md` (especially § Rule 2 amendment from CC-052).
- `docs/audits/report-calibration-audit-2026-04-29.md` (especially the Q-X3-cross/Q-X4-cross references; the Rule 2 violations section).
- `lib/identityEngine.ts` — `getGiftSpecificity` selector added by CC-052; `getUserName` / `nameOrYour` helpers from CC-047; `getFunctionPairRegister` accessor.
- `lib/beliefHeuristics.ts` — has its own `findName` helper updated by CODEX-051; verify no further bypass.
- `app/components/MirrorSection.tsx` — gift category prose composer; render site.
- `app/components/InnerConstitutionPage.tsx` — section composition; `UseCasesSection` wires here.
- `app/components/PathSection.tsx` — render-order anchor; UseCasesSection appears after this.
- `lib/markdownExport.ts` — markdown export composer (or wherever the existing Path-section export composes).
- `app/admin/sessions/[id]/page.tsx` — admin re-render entry (verification surface).
- `data/questions.ts` — Q-X3 / Q-X4 / Q-X3-cross / Q-X4-cross definitions (read only; do not modify).

## Allowed to Modify

- **Item 1:** `lib/identityEngine.ts` (Sentence 2 selector additions only).
- **Item 2:** New file `app/components/UseCasesSection.tsx`; `app/components/InnerConstitutionPage.tsx` (one wire-in line); `lib/markdownExport.ts` (or equivalent — one section-composition addition).
- **Item 3:** Any file revealed by the audit grep to contain a bypass-prose username read. Likely candidates: `lib/identityEngine.ts` (additional KeystoneReflection-style composers), `lib/beliefHeuristics.ts` (verify CODEX-051 fix held), `app/components/*.tsx` (any prose surface that bypasses the helper), `lib/loveMap.ts` / `lib/workMap.ts` (if their distortion / register prose contains username interpolation).
- **Item 4:** `docs/canon/derivation-rules.md`; `docs/audits/report-calibration-audit-2026-04-29.md`; any other doc file revealed by the audit grep to contain Q-X3-cross/Q-X4-cross item-count assertions.
- **No other files.** No question schema changes, no tagging-table edits, no engine logic changes, no tension definitions, no test files.

## Report Back

1. **Item 1 (CC-052b):** files modified, before/after diff for the two new Sentence 2 conditionals (Integrity non-Fi cross-routed; Builder NiTe aux-pair). Confirmation that locked Sentence 2 strings are verbatim.
2. **Item 2 (CC-058):** files modified (new component file path, wire-in points), confirmation that all ten use cases ship verbatim in the locked order, markdown export wire confirmation.
3. **Item 3 (Name-resolution audit):** full classification list — every name-read site found, classified as routed/bypass-prose/backend. Bypass-prose sites with before/after fix diffs. Any backend sites left alone with reasoning. Any architectural concerns surfaced (e.g., suggestion for single-resolver-service refactor).
4. **Item 4 (Q-X3 canon correction):** list of every doc occurrence corrected, with file path and line number.
5. **Verification results** — tsc, lint, build outputs. Explicit confirmation `npm run build` exits 0.
6. **Manual sweep deferred to Jason** — explicit list of items to verify in the admin re-rendered Jason0429 session.
7. **Any deviation from locked content** — if the executor encountered a structural reason any locked string couldn't ship verbatim. (Should not happen; flag if it does.)
8. **Prompt move-to-completed confirmation** — explicit confirmation the prompt has moved.

---

## Notes for the executing engineer

- **Locked content is locked.** All Sentence 2 strings, all ten use-case paragraphs, and all canon-doc corrections ship verbatim. If a string seems "off" tonally, surface in Report Back; do not silently rewrite. Tone calibration is a separate authorship pass.
- **The four items are unrelated.** No item depends on another. Verify each in isolation; failure of one doesn't fail the others.
- **CC-052b's two anchors are the *only* additions to gift-category Sentence 2 logic in this CODEX.** If the executor sees other Sentence 2 fallback misfires during the audit, document them in Report Back and let the next CC pick them up. The locked content here is Integrity + Builder only.
- **CC-058's static content is intentional.** The use cases will get user-feedback calibration post-launch; pre-launch trimming is the wrong move per Jason's lock.
- **Item 3's audit is the value-add even more than the fixes.** A clean classification list of every name-read site enables architectural decisions later (single-resolver service vs distributed callers). Even if the audit finds no new bypass-prose sites, the classified list is the deliverable.
- **Item 4 is docs-only.** No code touches; if `git diff` shows code changes for Item 4, something has gone wrong.
- **Pre-CODEX-055 saved sessions** re-render against current engine code on admin load; no migration needed.
- **Per CODEX-/CC- routing convention** the prompt file moves to `prompts/completed/` when shipped. Explicit reminder.
