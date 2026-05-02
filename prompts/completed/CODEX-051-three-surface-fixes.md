# CODEX-051 — Three Surface Fixes (Keystone Username · Masthead Placeholder · Allocation-Gaps Dedup)

*(Filename CODEX-051 per the agent-routing convention 2026-04-29: surgical / mechanical scope; three independent fixes bundled. The numbering shares the global CC-### sequence; the prefix is routing metadata.)*

**Type:** Three independent surface fixes. **No new logic. No new prose authored. No canon changes.** Each fix is single-file or two-file, locked outcome, no judgment calls.
**Goal:** Close three visible report-rendering issues that surfaced during admin-portal re-render validation 2026-04-30: Keystone Reflection still shows username as third-person possessive (CC-047 partial gap); masthead carries a placeholder *"+ optional type label"* string; Allocation Gaps prose renders twice in the same report (once in main flow, once in Open Tensions section).
**Predecessors:** CC-047 (Username-as-name fallback fix — handled `getUserName` but missed surfaces that bypass it), CODEX-050 (admin re-render mode — surfaced the visible issues).
**Successor:** None hard-blocked.

---

## Why this CC

Real-user re-render of saved session Jason0429 against current engine code 2026-04-30 surfaced three discrete surface issues. Each is small, mechanical, and unrelated to the other two. Bundling into one CC because:

- All three are surgical (5-30 lines each).
- All three are visible in the same admin re-render walk (cheap to verify together).
- None have architectural overlap; one CC's changes don't affect the others' files.
- Splitting into three separate CCs triples review/ship overhead for what's effectively one calibration sweep.

The three fixes are not prose-rewrite-track work — they're surface defects that should clear before the substantive Gift Specificity / Allocation Gap / Growth Edge rewrite CCs (CC-052+) start.

---

## Fix 1: Keystone Reflection Username Fallback

### Symptom

In the re-rendered Jason0429 report, the Keystone Reflection section reads:

> *"Of the five stakes Jason0429 ranked highest, Jason0429 marked 4 (Close relationships, Money / Wealth, Reputation, and Job / Career) as concrete costs Jason0429 would bear for this belief..."*

Three instances of *"Jason0429"* as third-person possessive. Other prose surfaces (Mirror, Synthesis, Path) correctly render *"Your"* / *"You"* per CC-047's `getUserName` fallback. The Keystone Reflection composer is reading the username from a different source — likely directly from session metadata via `data.display_name` or `session.name` rather than through `getUserName(demographics)`.

### Locked changes

1. Locate the Keystone Reflection composer. Likely in `lib/identityEngine.ts` (search for *"ranked highest"* or *"marked"* prose templates) or `app/components/KeystoneReflection.tsx`.
2. Replace any direct username reads (`data.display_name`, `session.name`, `user.name`, etc.) with `getUserName(demographics)` from `lib/identityEngine.ts`.
3. Wrap each name reference with the standard fallback pattern: `getUserName(demographics) ? `${name}` : "you"` for nominative, `getUserName(demographics) ? `${name}'s` : "your"` for possessive.
4. Capitalize sentence-initial fallbacks per existing convention.

### Acceptance per fix

- Re-rendered Jason0429 Keystone Reflection reads *"Of the five stakes you ranked highest, you marked 4..."*
- No instances of literal *"Jason0429"* in any prose surface for username-pattern users.
- Real-name users (e.g., demographics.first_name = `"Madison"`) still render with their first name correctly.

---

## Fix 2: Remove "+ optional type label" Placeholder from Masthead

### Symptom

In the rendered report's masthead/title area, immediately below the subtitle *"a possibility, not a verdict"* and the existing prose intro, the literal string *"+ optional type label"* appears. Looks like a design-handoff placeholder that was never removed when whatever feature it scaffolded shipped (or didn't ship).

### Locked changes

1. Grep `app/components/` and `app/page.tsx` for the literal string *"+ optional type label"*.
2. Remove the line/element that emits it.
3. If it's a placeholder for a feature that should ship, surface in Report Back rather than silently removing — the Report Back will document whether it was a stale leftover (deleted) or an incomplete feature (deleted with flag).

### Acceptance per fix

- Re-rendered report no longer contains *"+ optional type label"* anywhere.
- `grep -rn "optional type label" app/ lib/` returns zero hits.
- Surrounding masthead layout reads cleanly without the placeholder text.

---

## Fix 3: De-duplicate Allocation Gaps Prose

### Symptom

In the re-rendered Jason0429 report:

**Main flow section:**

> *"Allocation Gaps — the gap between what you name and where your resources actually go.*
>
> *You named Knowledge as among your most sacred values. Your money appears to flow mostly to family and yourself. That does not mean hypocrisy. The model cannot know motive. It could mean: exhaustion, a difficult season, needed self-care, social bonding, old habits, or a real gap between stated priority and lived allocation. The only fair question is: does this feel true, partially true, or not true at all?*
>
> *Across multiple allocation domains, you marked categories where the current flow doesn't match what you wish. The gap shows up in where your money goes beyond your immediate circle and where your outward energy lands. That does not mean hypocrisy..."*

**Open Tensions section (further down the same report):**

> *"Sacred Words vs Sacred Spending — open*
>
> *You named Knowledge as among your most sacred values. Your money appears to flow mostly to family and yourself. That does not mean hypocrisy..."*
>
> *"Current and Aspirational Allocation — open*
>
> *Across multiple allocation domains, you marked categories where the current flow doesn't match what you wish..."*

The same prose paragraphs appear twice. The Open Tensions section's *Sacred Words vs Sacred Spending* and *Current and Aspirational Allocation* tensions render the same content as the standalone *Allocation Gaps* section.

### Locked changes

1. Locate the source of both renderings. Likely:
   - Standalone *Allocation Gaps* section: composed in `lib/identityEngine.ts` or rendered directly in `InnerConstitutionPage.tsx`.
   - Open Tensions cards: tension definitions at `lib/identityEngine.ts` or `lib/tensions.ts` (search for *"Sacred Words vs Sacred Spending"*).

2. **Decision: collapse to ONE rendering, keep Open Tensions.** The Open Tensions section's interactive design (with *YesPartiallyNoExplain* response buttons + *"tell me more"* expansion) is more functional than the standalone Allocation Gaps prose. Remove the standalone Allocation Gaps section; the tensions surface in Open Tensions where the user can engage with them.

3. **Implementation path:**
   - Locate where the standalone *Allocation Gaps* section is rendered (the section header emit + the two paragraph emits).
   - Remove that section's rendering entirely.
   - Verify the Open Tensions section still surfaces both tensions (*Sacred Words vs Sacred Spending* and *Current and Aspirational Allocation*) — they should already be in the tension catalog and fire when their predicates match.

4. **If the executing engineer determines the standalone Allocation Gaps section serves a discoverability purpose** (e.g., promotes the tensions higher in the report so they don't get missed in the longer Open Tensions list), surface as a Report Back question rather than removing. Default action: remove.

### Acceptance per fix

- Re-rendered report shows *Sacred Words vs Sacred Spending* and *Current and Aspirational Allocation* prose exactly once each (in Open Tensions section, not in a separate Allocation Gaps section).
- The standalone *Allocation Gaps* section header and its two paragraphs are removed.
- Layout flows cleanly past the removed section (no orphan whitespace).

---

## Verification (all three fixes)

- `npx tsc --noEmit` exits 0.
- `npm run lint` passes.
- `npm run build` exits 0 (third consecutive clean build post-CODEX-049).
- Manual: load Jason0429's saved session in admin via `/admin/sessions/[id]` (per CODEX-050's live-engine render). Confirm:
  - Keystone Reflection uses *"you"* / *"your"* throughout.
  - No *"+ optional type label"* anywhere on the page.
  - Allocation Gaps prose appears once (in Open Tensions), not twice.

---

## Out of scope

- **Rewriting the Allocation Gaps prose itself.** The Rule 4 violation (cautious *"may or may not mean anything"* hedging) stays for CC-053+ rewrite track to fix. CODEX-051 only de-duplicates; the prose itself is untouched.
- **Adding new tensions, removing existing tensions, or changing tension predicates.** Pure de-duplication of rendering surfaces.
- **Changing the YesPartiallyNoExplain interaction pattern** in Open Tensions.
- **Editing other prose templates** flagged by CC-048 audit. This CC handles three discrete defects, not the broader rewrite track.
- **Refactoring `getUserName` or its callers** beyond what Fix 1 requires.
- **Adding tests.** No tests exist for these surfaces; not adding any here.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

Codex equivalent acceptable.

## Execution Directive

Single pass. Three fixes; verify each independently in the manual sweep. The Allocation Gaps decision (Fix 3) defaults to *"remove standalone, keep Open Tensions"* — surface as Report Back question only if the standalone section appears to serve a discoverability purpose the executor can articulate. **Move prompt to `prompts/completed/` when done.**

## Bash Commands Authorized

- `grep -rn "Jason0429\|getUserName\|optional type label\|Sacred Words vs Sacred Spending\|Allocation Gaps" app/ lib/`
- `cat <file>` (verifying changes)
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` (smoke; kill before exiting)
- `mv prompts/active/CODEX-051-three-surface-fixes.md prompts/completed/CODEX-051-three-surface-fixes.md`
- `git diff --stat`
- `git status`

## Read First (Required)

- `AGENTS.md` (workflow, especially the active → completed move convention).
- `app/components/KeystoneReflection.tsx` if it exists, or wherever Keystone Reflection prose composes.
- `lib/identityEngine.ts` `getUserName`, `nameOrYour` helpers, plus search for *"ranked highest"* or *"marked"* templates.
- `app/components/InnerConstitutionPage.tsx` for masthead rendering and Allocation Gaps section.
- `lib/identityEngine.ts` or `lib/tensions.ts` for tension definitions (search *"Sacred Words"*).

## Allowed to Modify

- Files revealed by the grep audits to contain the three defects. Likely candidates:
  - `app/components/KeystoneReflection.tsx` (Fix 1)
  - `lib/identityEngine.ts` (Fix 1 prose template, Fix 3 standalone section)
  - `app/components/InnerConstitutionPage.tsx` (Fix 2 masthead, Fix 3 standalone section render)
  - Any file containing the literal *"+ optional type label"* string
- **No other files.** No tension definitions, no canon docs, no engine logic.

## Report Back

1. **Fix 1: Keystone Reflection username** — files modified, before/after snippet showing the username-fallback wiring.
2. **Fix 2: Masthead placeholder** — file containing *"+ optional type label"*, line removed, whether it was a stale leftover or an incomplete feature.
3. **Fix 3: Allocation Gaps dedup** — files modified, decision made (remove standalone vs other), confirmation that Open Tensions still surfaces both tensions.
4. **Verification results** — tsc, lint, build outputs. Explicit confirmation `npm run build` exits 0.
5. **Manual sweep deferred to Jason** — three items to verify in the admin re-rendered Jason0429 session.
6. **Any deviation from locked changes** — if the executor encountered an architectural surprise that required a different fix path.
7. **Prompt move-to-completed confirmation** — explicit confirmation the prompt has moved.

---

## Notes for the executing engineer

- These three fixes were surfaced during admin-portal re-render validation 2026-04-30 (CODEX-050 enabled the re-render). Each is a real defect visible in user-facing output, not a hypothetical.
- The bundle is intentionally small. Resist any temptation to expand scope — the rewrite-track CCs (CC-052+) handle the substantive prose calibration; CODEX-051 handles three surgical defects only.
- Fix 1's username-fallback gap is a partial-fix issue from CC-047. The original fix at `getUserName` works for surfaces that route through that helper; CODEX-051 catches the bypass surface in the Keystone Reflection composer specifically. If the audit reveals additional surfaces that bypass `getUserName`, surface them in Report Back (don't necessarily fix in this CC) — they may warrant a more architectural fix routing all username reads through a single resolver.
- Fix 2's *"+ optional type label"* string is unfamiliar. It's not in any spec I (the prompt author) am aware of. Could be design-handoff scaffolding. Safe to remove unless the executor finds active wiring for it.
- Fix 3's de-duplication decision favors Open Tensions because of the interactive design pattern (YesPartiallyNoExplain + tell-me-more). The standalone Allocation Gaps section is informational-only. If the executor finds an architectural reason to keep both (e.g., the standalone surfaces a tension that doesn't fire in Open Tensions for some users), surface as Report Back question.
- Per CODEX-/CC- routing convention, the prompt file moves to `prompts/completed/` when shipped. This step has been missed on prior Codex executions; explicit reminder in this prompt.
- Pre-CODEX-051 saved sessions: re-rendering picks up the fixes automatically when the admin route re-derives. No migration needed.
