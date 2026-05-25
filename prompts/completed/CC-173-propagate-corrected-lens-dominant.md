# CC-173-PROPAGATE-CORRECTED-LENS-DOMINANT

> Cowork-chat CC, 2026-05-24. CC-171 corrected the lens DOMINANT (Ni→Si for
> intuitive-Si shapes), and CC-172 bumped the shape version so it re-derives.
> But a class of lens-derived PROSE still reads the pre-correction dominant, so
> a corrected report (Keith, fresh post-CC-172 render) contradicts itself —
> Si in some sections, Ni in others. Make ALL lens-derived prose key off the
> corrected dominant. This is a page-correctness fix; getting it right matters
> more than any one-off artifact.

## Proof it's live (not a stale render)

Keith's fresh Guide + Individual (generated 2026-05-25, post-CC-172) read **Si**
in: Core Signal Map ("Precedent-checker"), Executive Read ("durable memory…
precedent-anchored"), Synthesis opening ("the precedent-checker supported by
the structurer"), the Lens **Movement Note** ("the precedent-checker… continuity,
tested forms, the inheritance of what has worked"), Path opening ("Work shape is
continuity, tested forms…"), Grip AIM-SAYS ("held as stewardship"), Trust/Weather
"Pattern in motion" (precedent/what-holds).

…and **Ni** in: the masthead ("led by the pattern-reader"), Core Pattern ("the
pattern-reader reads the situation"), Top Gifts ("a pattern-discernment gift /
pattern certainty becoming private fact"), What Others May Experience ("the
pattern-reader as clarity"), When the Load Gets Heavy ("the present-tense self
surfaces" — the wrong inferior; an Si-dom's stress-surfacing is the
possibility-finder / Ne), the Lens card **Strength + Growth Edge** ("the
pattern-reader… over-reading the future… long-arc certainty that closes early"),
Compass Strength ("the long-arc read — a pattern that hasn't fully revealed
itself"), Gravity Growth Edge ("the long-arc structure ignoring the present arc's
signal… the future shape you're building toward"), Conflict Translation ("the
read the pattern-reader gives you"), Mirror-Types Seed ("convergent insight…
the long-arc interpretation"), and the Synthesis parallel-close gift labels.

**The diagnostic tell:** the Lens card's Movement Note (Si) and its Growth Edge
(Ni) sit two lines apart in the SAME card. So the two are reading different
dominant sources — one corrected, one not.

## Root-cause hypothesis (verify in Step 1)

CC-171's `applyPerceivingAxisCorrection` flips `lens_stack.dominant` (the field
the cohortRealLensCanon audit checks, and the Signal Map / Movement Note read).
But the Ni-voiced prose above is keyed to a DIFFERENT source that the correction
didn't touch — likely one or more of:
1. A sibling dominant/driver/voice field on the constitution (e.g. a "driver",
   "shapeInOneSentence", blind-spot/gift keyed to the pre-correction Q-T
   dominant) that `applyPerceivingAxisCorrection` doesn't rewrite.
2. The blind-spot / growth-edge / stress-function templates keyed directly to
   the pre-correction dominant function rather than to `lens_stack.dominant`.
3. LLM splice-cache entries (masthead/core-pattern/synthesis warm prose) whose
   cache key is built from a pre-correction engine body, so they still serve the
   old Ni warm prose even after the dominant flips.
Most likely a combination of (1)/(2) for the engine prose and (3) for the warm
splice.

## Step 1 — DIAGNOSE (before changing code)

Render Keith (and Harry — also corrected) and, for each Ni-voiced spot in the
checklist below, trace which field/source the template reads and why it didn't
follow the correction. Produce a table: spot → source field → corrected? →
fix. Confirm whether the warm-splice cache is also serving pre-correction prose.

Checklist (all must end up Si for Keith/Harry):
- masthead "led by the {driver}" line
- Core Pattern "{driver} reads the situation; the {support} carries"
- Top Gifts table (gift label + blind-spot) + Synthesis parallel-close labels
- What Others May Experience opener
- When the Load Gets Heavy — the narrowing function AND the stress-surfacing
  function (must be the possibility-finder / Ne for Si-dom, not present-tense
  self / Se; cross-check Daniel's Si render for the correct pairing)
- Lens card: low-confidence hedge label, Strength, Growth Edge
- Compass Strength
- Gravity Growth Edge
- Conflict Translation
- Mirror-Types Seed
- Path "Work" paragraph framing

## Step 2 — FIX

Establish a single corrected-dominant source of truth that ALL lens-derived
prose consumes:
- Have `applyPerceivingAxisCorrection` (or the integration site in
  identityEngine) update EVERY derived field the prose reads — the driver/voice
  label, the gift/blind-spot selection, the stress-function pairing, the
  shape-in-one-sentence — so they follow the corrected dominant. (Or repoint
  those consumers at `lens_stack.dominant`.) The stress-function pairing must
  derive from the corrected dominant's axis (Si-dom → Ne inferior surfacing),
  not the pre-correction dominant's.
- If the warm splice cache is serving pre-correction prose, the cache key must
  incorporate the corrected dominant so a corrected session misses the stale
  entry and regenerates (then regen Keith/Harry's affected entries).

## Controls (must NOT change)

- **Ashley, Jason** — true Ni, NOT corrected (no `dominant-convergence-weak`
  flip). Their prose must STAY Ni-voiced (pattern-reader). The fix only changes
  sessions whose dominant was actually corrected.
- **Daniel** — clean Si, never corrected; his (already-Si) prose unchanged.
- Engine math, scores, Grip pattern, Movement numbers — untouched.

## Do NOT

- Re-open the typing logic (CC-171 is correct) — this is downstream PROSE
  propagation only.
- Down-weight Ni or touch uncorrected sessions' prose.
- Hardcode Keith/Harry — fix the propagation generally so any future corrected
  session renders consistently.
- Commit or push.

## Acceptance

- `tsc --noEmit` clean; lint clean.
- Keith's render (Guide AND Individual) is internally consistent Si: every spot
  in the checklist reads precedent-checker / Si; the When-the-Load stress
  function reads the possibility-finder (Ne); no "pattern-reader" / "over-reading
  the future" / "long-arc certainty closes early" residue.
- Harry's render likewise consistent Si.
- Ashley / Jason renders unchanged (still Ni-voiced); Daniel unchanged.
- cohortRealLensCanon 5/5 still green; functionVoiceBinary byte-identity green;
  full suite green at close. If the warm cache was regenerated, report the cost.

## Report back

- The diagnosis table (spot → source → why stale → fix).
- Confirmation Keith + Harry render consistent Si end-to-end; controls unchanged.
- Whether a cache regen was needed + its cost.
- Audit results.

## Note

This is the same propagation class as CC-168.1 (the Lens preamble) — the
corrected dominant reaching some prose paths and not others — but the general
fix. Once this lands, a corrected intuitive-Si session reads as one coherent
shape, which is the whole point: the page is the product.
