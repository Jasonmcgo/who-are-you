# CC-185 — Nat's grip primal + auxiliary-aware prose (finish the de-Megan)

> Owner-confirmed: **Nat is Fi-Se-Ne-Ti** (ISFP artist; Agreeableness 87). CC-183 fixed her
> stack, work-map, and growth-edges. Three report surfaces are still wrong, and they share
> a theme: **disposition-derived classifiers outrank her explicit answers.**
>   1. Grip primal renders "Belonging through care / Am I still welcome when I have nothing
>      left to give?" — but her Q-GRIP1 grips are SAFETY/SECURITY (top-3: a-plan-that-used-
>      to-work, control, money/security; belonging grips rank 6th & 8th). It should read
>      Safety/Security.
>   2. Love Map renders Fe-care registers (the Companion + the Parental Heart) for a shape
>      with no Fe.
>   3. Executive Read is generic Fi-dom — byte-identical for Nat (Fi-Se) and Megan (Fi-Ne)
>      because it never reads the auxiliary.
>
> This is the same principle CC-183 applied to the work-map: **explicit answers beat the
> care/Agreeableness disposition; the auxiliary (Se vs Ne) must differentiate.**

## Requirement (owner)

Nat's grip primal must resolve to **Safety/Security** ("Will the foundation hold?" /
"Security through what worked"), driven by her Q-GRIP1 ranking — not the archetype's
belonging default. Her Love Map must surface an Fi-authentic register, not pure Fe-care.
Her Executive Read must read differently from an Fi-Ne (Megan) shape. None of these may be
a Nat-by-name special-case — they're general fixes.

## Root cause (verified — file:line)

1. **Grip primal — `lib/gripPattern.ts`.** `classifyGripPattern` has a `cindyType`
   classical-defensive branch (~lines 433-440) that hard-returns `bucket: "belonging"`
   **before** checking the surface grip — even though `isClassicalDefensiveSurface()`
   (~112-119) correctly flags her `grips_old_plan` rank-1 as the security cluster. The
   user-facing strings come from `renderElaborativeLabel()` (~176: `cindyType → "Belonging
   through care"`) and `generateUnderlyingQuestion()` (~232: `cindyType → "Am I still
   welcome…"`). The low-confidence disambiguator chain (~292-337, gated at ~384) never runs
   because the cindyType branch returns high/medium. She's `cindyType` via
   `lib/profileArchetype.ts` `computeArchetype()` (~167-232): her `FiSe` driver + Family/
   Compassion compass match cindyType — but that archetype conflates an Fi-Se *artist* with
   an Fe-care *caregiver*. **Key fact:** the engine-internal `derivePrimalCluster` /
   `gripCalibration.ts` already resolve her to "Am I secure?" correctly from her grip floor
   — only the user-facing `gripPattern.ts` layer diverges. Wired via
   `lib/identityEngine.ts` `attachGripPattern` (~2862-2913; `qGrip1Top3` built ~2869-2878).
2. **Love Map — `lib/loveMap.ts`.** `parentalHeartPredicate` (~391-415) fires on
   `caring_energy_priority` + `family_priority` + closeStakes + coverage-drive — the
   care/Family cluster, no Fi gate. The Fi register `the Loyalist` (`loyalistPredicate`
   ~514-541) is value-gated to `justice_priority`/`truth_priority` top-3 **and** a verbal
   love-expression lift — Nat's compass is Family/Compassion and her love isn't verbal, so
   her Fi register scores ~0 while the care registers win. There is **no aesthetic/
   authenticity register** in `LOVE_REGISTERS` (~205-271) for an Fi-led artist.
3. **Executive Read — `lib/identityEngine.ts`.** `composeExecutiveRead()` (~8408) =
   `composeGiftDangerLine()` (~8396-8400, reads `GIFT_DANGER_LINES[dom]` ~8090-8093) +
   `thesisFor()` (~8259-8266, falls back to `THESIS_FALLBACK_BY_FUNCTION[dom]` ~8245-8250).
   **Neither reads `lens_stack.auxiliary`** — so every Fi-dominant gets identical text.

## Fix — Part A: grip primal honors the explicit Q-GRIP1 grip

**Preferred:** source the user-facing grip label + underlying question from the engine-
internal primal cluster (`derivePrimalCluster` / `gripCalibration.ts`), which already
resolves Nat to "Am I secure?" — making `gripPattern.ts` defer to the single source of
truth instead of re-deriving from archetype.

**Minimum (if deferring is too invasive):** in `classifyGripPattern`, before the
archetype branch returns `belonging`, check the explicit Q-GRIP1 rank-1: when `top1 ∈
{grips_old_plan, grips_security, grips_control, grips_certainty}`, route to the `security`
bucket ("Security through what worked" / "Will the foundation hold?") regardless of
archetype. Surface (the explicit grip) wins over the archetype default. General rule, not
Nat-specific: any archetype whose Q-GRIP1 rank-1 is an explicit security/defensive grip
gets the security primal.

## Fix — Part B: let an Fi-led shape's authentic register compete

Make a values-rooted **Fi register** available to an Fi-driver shape without requiring
Justice/Truth specifically — Fi expresses through whatever value the person actually holds
(Family included), so the `loyalistPredicate` value-gate should fire on `fiDriver` + ANY
top-compass value (drop the Justice/Truth-only gate and the verbal-expression requirement
for Fi-led shapes). **Owner decision:** (a) loosen the Loyalist gate as above [lighter], or
(b) add a new aesthetic/authenticity register ("the Aesthete" / "the Authentic") to
`LOVE_REGISTERS` that composes with `FiSe`/`FiNe` [richer, truer to the artist]. Recommend
(a) now, (b) as a follow-up. Do NOT suppress the care registers — let the Fi register
*compete*.

## Fix — Part C: Executive Read reads the auxiliary

Key the gift/danger line and the thesis fallback on the **dominant + auxiliary** pair (not
dominant alone), so Fi-Se (present/aesthetic — "what your values build in the world") reads
differently from Fi-Ne (possibility — Megan's register). Add Se-aux vs Ne-aux variants in
`GIFT_DANGER_LINES` / `thesisFor` / `THESIS_FALLBACK_BY_FUNCTION`. Nat's exec read should
name her aesthetic-artist register, not the generic "interior-compass / feeling more."

## Do NOT

- Do NOT special-case Nat by name — Parts A/B/C must be general (any shape with the same
  explicit grip / Fi-driver / aux benefits).
- Do NOT suppress the care/parental love registers or the belonging grip primal for shapes
  that genuinely warrant them — only let the explicit-answer / Fi / aux signals compete.
- Do NOT change the dominant/aux typing (that's CC-183's domain) or the Room Read module.
- Do NOT commit or push (sandbox: prepend `rm -f .git/index.lock`).

## Acceptance

- Nat's grip primal resolves to **Safety/Security** ("Security through what worked" / "Will
  the foundation hold?"), driven by her Q-GRIP1 — not "Belonging through care."
- Her Love Map surfaces an Fi-authentic register (not only Fe-care Companion/Parental-Heart).
- Her Executive Read differs from an Fi-Ne shape's (aux now differentiates).
- `cohortRealLensCanon` + the full audit suite green; **every other cohort report
  unchanged** except where the same general rule correctly applies. **Flag-don't-fix** any
  unexpected reds (note the 15 pre-existing branch reds from the CC-183 run — don't touch).
- `npx tsc --noEmit` + lint + `npm run build` clean.

## Report back

- The grip-primal change (deferred-to-internal vs surface-honors-top1) + Nat's new primal.
- The love-map change (gate loosen vs new register) + Nat's new top love register.
- The exec-read aux differentiation + Nat's new gift/danger + thesis lines.
- Confirmation other cohort reports are unchanged; tsc/lint/build + suite status; any reds
  flagged not fixed.
