# CC-027 — Post-CC-024 Housekeeping (Q-P2 labels + formation→weather + stale CC-024 pointers)

**Type:** Data + canon cleanup. **No engine logic, no component edits, no new questions, no new signals.**
**Goal:** Three small data/canon corrections surfaced after CC-024 shipped: relabel Q-P2's middle two options to make a real architectural distinction visible to users; fix the formation→weather body-map mapping (was incorrectly routed to lens); update two canon docs whose forward-pointing CC-024 references are now stale.
**Predecessor:** CC-024 (Keystone Block Restructure) shipped 2026-04-27.
**Successor:** None planned. Compass values expansion is the next architecture-class CC, drafted separately.

---

## Why this CC (three small things, one bundle)

These are three small, independent corrections of the same shape (data-layer or canon-only edits). Bundling them keeps the diff under 10 files, all reviewable. None involves engine logic, component changes, new questions, or new signals.

---

## Item 1 — Q-P2 label distinction

### Problem

Q-P2 ("If a belief put your job at risk, you would:") has four options. The engine wires four distinct signals across them:

| Label (current) | Signal | Architectural meaning |
|---|---|---|
| Change your position | `adapts_under_economic_pressure` | Capitulate — abandon belief |
| Keep it private | `hides_belief` | **Active concealment** |
| Hold it quietly | `holds_internal_conviction` | **Passive non-advocacy** |
| Accept the risk | `high_conviction_under_risk` | Public stand |

Real-user testing (multiple sessions, 2026-04 onward): users consistently flatten "Keep it private" and "Hold it quietly" into the same option in their heads. Both read as *"I have it, but don't talk about it."* The engine treats them as architecturally distinct — `hides_belief` is *active concealment* (would deflect if asked), `holds_internal_conviction` is *passive non-advocacy* (wouldn't volunteer it but wouldn't lie if asked) — but the labels don't surface that distinction. The four-point gradient collapses to three at the user's eye.

### Fix

Sharpen both labels behaviorally. Signals stay the same (no engine change).

In `data/questions.ts` Q-P2 (around line 50):

```ts
options: [
  { label: "Change your position", signal: "adapts_under_economic_pressure" },
  { label: "Hide it from work",     signal: "hides_belief" },               // was "Keep it private"
  { label: "Don't volunteer it",    signal: "holds_internal_conviction" },  // was "Hold it quietly"
  { label: "Accept the risk",       signal: "high_conviction_under_risk" },
],
```

The new labels surface the active-vs-passive split as concrete behavior. *"Hide it from work"* names the active concealment behavior. *"Don't volunteer it"* names the passive non-advocacy posture.

If `docs/canon/question-bank-v1.md` has a Q-P2 entry that lists option text, update it to match the new labels. (Signal IDs and signal descriptions in `lib/identityEngine.ts` and `docs/canon/signal-library.md` stay unchanged — they describe the underlying behavior, not the label text.)

---

## Item 2 — formation → weather body-map mapping

### Problem

`lib/cardAssets.ts` `SURVEY_CARD_TO_SHAPE_CARD` maps survey card_ids to body-map ShapeCardIds. The current mapping routes `formation` to `lens`:

```ts
formation: "lens",   // Formation context feeds the Lens stack.
```

The mapping rationale (engine-feeding adjacency) is real but it's the wrong frame for the *survey-screen icon*. Formation questions ask about the climate the user grew up in:

- Q-F1: *"As a child, authority figures were mostly..."*
- Q-F2: *"Your childhood environment felt: Stable and predictable / Mixed / Uncertain or chaotic."*

Both probe **the climate of formation**. The Lens · Eyes metaphor (perception, how you see) doesn't compose with the questions — the eye image asks "look at this" but the question is asking "what was the weather around you while you were forming." The architectural fit is **Weather · Nervous System** (the conditions card).

Side effect of the change: both `formation` and `context` now route to Weather. That's architecturally consistent — both probe external conditions. Formation = past climate; context = present climate. Same body-part metaphor for both is correct, not a collision.

### Fix

In `lib/cardAssets.ts`:

```ts
export const SURVEY_CARD_TO_SHAPE_CARD: Record<CardId, ShapeCardId> = {
  conviction: "conviction",
  pressure: "fire",
  formation: "weather",     // CC-027 — was "lens". The eye metaphor doesn't compose with
                            // "the climate you formed in." Weather is the conditions card;
                            // formation = past climate, context = present climate.
  context: "weather",
  agency: "gravity",
  sacred: "compass",
  temperament: "lens",
  role: "path",
  contradiction: "conviction",
};
```

Also update the rationale comment block above the table (the multi-line comment that explains each mapping). The current comment says:

```
formation     → lens        Formation context feeds the Lens stack.
```

Replace with:

```
formation     → weather     Climate-of-formation: the weather you grew up in.
                            (Engine-feeds-Lens-stack adjacency is real but the survey-
                            screen icon's metaphor must match the question, not the
                            engine pathway.)
```

And the "Two survey ids map to `lens`" sentence underneath the comment block — adjust to reflect that now only `temperament` maps to `lens`. Two survey ids (`formation` and `context`) map to `weather` post-CC-027.

### Verification

- Q-F1 and Q-F2 render Weather · Nervous System SVG above the kicker on the survey screen, not Lens · Eyes.
- Q-T1–Q-T8 still render Lens · Eyes (temperament → lens unchanged).
- Q-X1–Q-X4 still render Weather · Nervous System (context → weather unchanged).
- No change to engine output. The body-map cards on the report still derive their signal data from the same questions; this is purely the *survey-screen icon* mapping.

---

## Item 3 — Stale CC-024 forward-pointer cleanup

Two canon docs reference CC-024 in future-tense or as-pending. Both are now stale and reading them after the ship date is confusing.

### 3a. `docs/canon/result-writing-canon.md` — line ~197

Current text:

> **Q-I3 None-selected structural acknowledgment**: per the composition-check rule (`prompts/queued/Q-I3-restructure-notes.md`), when the user marks None on Q-I3, the prose acknowledges that *"sacred values, by definition, are not things you would freely sacrifice."* This prevents the prose from reading as gotcha while CC-024 (Keystone Block Restructure) is pending — it does not modify Q-I3 itself.

This describes the CC-022b prose hedge. Per CC-024's ship report (2026-04-27), that hedge was retired in code: *"retired the CC-022b 'sacred values, by definition, are not things you would freely sacrifice' hedge — no longer needed because the verb-noun composition is now coherent."* The canon paragraph now describes behavior that no longer exists.

Replace with:

> **Q-I3 None-selected prose** (post-CC-024): when the user marks None on Q-I3, the prose reads cleanly because Q-I3 now derives from Q-Stakes1's concrete loss domains (not from sacred values). The prose acknowledges the refusal as informative — *"the belief sits inside what your answers protect, not what they would willingly trade."* The pre-CC-024 structural-acknowledgment hedge ("sacred values, by definition, are not things you would freely sacrifice") was retired by CC-024 and is no longer needed; the verb-noun composition is now coherent.

### 3b. `docs/canon/cross-card-patterns.md` — line ~53

Current text:

> This rule is the same composition check noted in `prompts/queued/Q-I3-restructure-notes.md`. The CC-024 — Keystone Block Restructure work picks up the Q-I3 question-level fix; cross-card patterns honor the rule at the prose-layer level.

Future tense ("picks up") is now wrong. Replace with:

> This rule is the same composition check noted in `prompts/queued/Q-I3-restructure-notes.md`. CC-024 (Keystone Block Restructure, shipped 2026-04-27) picked up the Q-I3 question-level fix by re-deriving Q-I3 from Q-Stakes1's concrete loss domains. Cross-card patterns continue to honor the rule at the prose-layer level when authored.

---

## Acceptance

- Q-P2 in `data/questions.ts` shows the four updated option labels (*Change your position* / **Hide it from work** / **Don't volunteer it** / *Accept the risk*). Signal IDs unchanged.
- `lib/cardAssets.ts` `SURVEY_CARD_TO_SHAPE_CARD` shows `formation: "weather"`. The mapping rationale comment block is updated.
- `docs/canon/result-writing-canon.md` paragraph at ~line 197 reflects post-CC-024 prose behavior, not the retired hedge.
- `docs/canon/cross-card-patterns.md` paragraph at ~line 53 reads in past tense regarding CC-024.
- If `docs/canon/question-bank-v1.md` has a Q-P2 entry citing the option labels, that entry is updated to match the new labels.
- `git diff --stat` shows changes to the named files only.
- `npx tsc --noEmit` exits 0. `npm run lint` passes. `npm run build` succeeds.

---

## Out of scope

If you find yourself doing any of these, stop and flag — they belong in a different CC:

- Compass values expansion (Q-S1/Q-S2 4→6 items). That's the next architecture-class CC, drafted separately.
- 3C's integration. Architecture is being decided; not yet a CC.
- Pattern catalog expansion (si/se/ti/fi/fe leverage). Future CC class (CC-029+).
- Path contribution-verbs question. Pending Compass expansion.
- Engine logic changes — `lib/identityEngine.ts`, `lib/beliefHeuristics.ts`, `lib/types.ts`, and `lib/renderMirror.ts` should not be edited.
- Component changes — `MapSection.tsx`, `QuestionShell.tsx`, `ShapeCard.tsx`, `app/page.tsx` should not be edited.
- New SignalIds or new signal descriptions.
- Any change to the eight body-map SVGs or their rendering paths.
- Any change to Q-P1's option labels (Q-P1's two yielding options share a signal by design — that's intentional UX nuance, distinct from Q-P2's collapse-via-labels problem).
- Renaming or removing any existing question, signal, or pattern.

---

## Notes for the executing engineer

- Three independent items; commit them separately if helpful, but a single commit is also fine. Each item is small enough that bisecting won't matter.
- The Q-P2 label change does not require updating signal descriptions in `lib/identityEngine.ts` `SIGNAL_DESCRIPTIONS` — those describe the underlying behavior (`hides_belief`: "May keep belief private when livelihood is exposed.") and stay accurate against the new labels.
- The formation → weather change does not affect engine output. The body-map *report* cards still derive their signal data from the same questions through the same code paths. This is purely a survey-screen icon mapping change. Browser smoke verification: Q-F1 and Q-F2 should display the Weather · Nervous System SVG above the kicker.
- The two canon-doc text replacements above are suggested wording. Adjust phrasing if it doesn't match the surrounding doc's voice; what matters is that the stale forward-pointers (future tense / "while pending") become past-tense and that the retired hedge is named as retired rather than as live behavior.
- Browser smoke required after this CC closes — engine checks confirm the wiring compiles and the URLs serve, but the Q-P2 label-distance read and the formation-screen weather icon both need Jason's eyes to verify they land.
