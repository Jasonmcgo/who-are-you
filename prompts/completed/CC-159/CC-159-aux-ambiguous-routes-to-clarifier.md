# CC-159 — Route `aux-ambiguous` to a resolving head-to-head clarifier (the INTJ↔INFJ gap)

> Owner-found via a real calibration case: his daughter Nat reads as INFJ but the
> engine returned **low-confidence INTJ**, and her minted follow-up link was
> ~verbatim his (a confident INTJ) — i.e., the clarifier that should distinguish
> her never fired. Root cause confirmed below: an ambiguous auxiliary detects
> uncertainty but asks **nothing** to resolve it.

## Verified root cause

- INTJ vs INFJ differ only in the auxiliary: Ni-**Te** vs Ni-**Fe**. When the engine
  can't separate them it raises `aux-ambiguous` (`lib/jungianStack.ts` ~L784,
  when `auxiliary.topPicks - auxRunnerUp.topPicks < auxMargin`).
- The judging head-to-head clarifier only fires on `judging-cooccurrence` or
  `binary-attitude-violation` (`lib/followUpQuestions.ts` ~L509-513). **`aux-ambiguous`
  is not in that set**, so no clarifier is generated — the report just hedges to
  "low confidence" and the respondent falls through to generic grip-family
  clarifiers (why Nat's link ≈ Jason's).
- Plumbing gap: `LensStack` (lib/types.ts:334-335) exposes `dominant` + `auxiliary`
  but **not the aux runner-up**, and the judging head-to-head builder hardcodes its
  pairs (`ti/fi`, `te/fe`) off the co-occurrence type (followUpQuestions.ts:566-575).
  So even to fire it, we must surface *which two functions* are the close pair.

This affects the whole same-dominant/different-aux class: INTJ↔INFJ, INTP↔INFP,
ENTJ↔ENFJ, ENTP↔ENFP, and the perceiving-aux analogues (e.g. Fi-dom Ne↔Se).

## Execution mode

Single pass; flag ambiguity. Clarifier-trigger + a small type/engine-surface
change. No change to dominant/aux *selection* or any Movement/derivation math —
only what gets *asked* when the aux is already ambiguous.

## Tasks

**T1 — surface the ambiguous aux pair.** In `lib/jungianStack.ts`, where
`aux-ambiguous` is pushed, also expose the two close candidates on `LensStack` —
the chosen `auxiliary` and its runner-up (the function it's within-margin of) —
e.g. a new optional `auxAmbiguousPair?: [CognitiveFunctionId, CognitiveFunctionId]`.
Add the field to `LensStack` in `lib/types.ts`. Only populated when
`aux-ambiguous` is raised.

**T2 — route aux-ambiguous to the right head-to-head.** In `buildFollowUpInput`
(`lib/followUpQuestions.ts`), when `confidenceLowReasons` includes `aux-ambiguous`
and `auxAmbiguousPair` is present:
  - If the pair is a **judging pair** (one of {ti,te} + one of {fi,fe}) → set
    `judgingHeadToHeadA/B` to those two functions and mark the judging clarifier
    eligible, with a new trigger value (e.g. `aux_ambiguous_judging`). This is the
    INTJ↔INFJ (Te vs Fe) case.
  - If the pair is a **perceiving pair** (one of {ni,ne} N-side + one of {si,se}
    S-side) → route to the N/S head-to-head (`nsLeaderN`/`nsLeaderS`) with a new
    trigger (e.g. `aux_ambiguous_perceiving`).
  Extend the `judgingHeadToHeadTrigger` / `nsHeadToHeadTrigger` unions in
  `lib/types.ts` for the new values.

**T3 — builder voice coverage.** Confirm `buildJudgingClarityHeadToHead` (and the
N/S builder) have equal-warmth voices for every function they may now be asked to
pit (te, fe, ti, fi for judging; ni, ne, si, se for perceiving). Add any missing
voice with the same neutral "Voice A / Voice B" framing CC-141/149 use (no
function-code leakage). Resolver still maps by `tags[0]`, unchanged.

## Allowed to modify

- `lib/jungianStack.ts` (surface the pair on aux-ambiguous — no selection change)
- `lib/types.ts` (`LensStack.auxAmbiguousPair` + the trigger-enum additions)
- `lib/followUpQuestions.ts` (route aux-ambiguous → head-to-head; voice coverage)

Do NOT change dominant/aux selection, the cross-signal lift, Movement/derivation
math, or the report render. This only adds a clarifier where one was missing.

## Acceptance criteria

1. A constructed **low-confidence INTJ** (Ni dominant clear, Te/Fe aux within
   margin → `aux-ambiguous`) generates a **Te-vs-Fe** judging head-to-head
   clarifier in its follow-up set. (This is the Nat case — prove it.)
2. A constructed **perceiving-aux** ambiguity (e.g. Fi-dom, Ne/Se aux close)
   generates the **N/S** head-to-head, not a judging one.
3. Confident sessions (no `aux-ambiguous`) are unchanged — no new clarifier; a
   confident INTJ's follow-up is unaffected (so it stops matching a low-confidence
   INTJ's).
4. Existing `judging-cooccurrence` / `binary-attitude-violation` triggers still
   fire and don't double-emit with the new aux-ambiguous path.
5. Voices have no function-code leakage ("Voice A/B"); resolver maps by tags[0].
6. `tsc` + lint clean. No Movement/derivation change. Follow-up + lens audits pass;
   if any moves, STOP and flag.

## Flag in report

- Prove the Nat case: paste the generated Te-vs-Fe clarifier for the constructed
  low-confidence INTJ, and show a confident INTJ generates no such clarifier
  (so the two stop looking identical).
- Which voices had to be added for T3.
- Confirm no double-emit when both aux-ambiguous and a co-occurrence reason are
  present.
