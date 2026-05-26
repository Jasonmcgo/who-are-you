# CC-SENSING-TYPING

> Cowork-chat CC, 2026-05-25. Engine calibration. The instrument types
> sensory/aesthetic introverts (Nat: perfect-pitch musician) as conceptual
> architects (Ni/Te) because (1) the aesthetic/sensory signal is MEASURED but no
> function scorer consumes it, and (2) when direct typing is thin, the cross-signal
> "architect halo" OVERRIDES the user's explicit binary picks. Nat self-typed
> **Si+Fi** in the binaries; the engine published **Ni+Te** — both axes inverted.
> This CC routes the sensory signal into the sensing functions AND makes explicit
> direct-typing binaries authoritative over cross-signal proxies. Sibling of
> CC-SCORESI; same flag-don't-regress discipline.

## Step 0 — add Nat as the regression anchor (REQUIRED before any change)

Nat is the canonical failure case and the regression target (as Daniel was for
SCORESI). Add her prod session as a cohort-real fixture
`tests/fixtures/cohort-real/nat-real.json` (portable export of session
`63d439a5-439a-472b-8620-8e8efea0b231`, same format as `jason-real.json`). Do not
proceed until her fixture loads. Her verified ground truth (from her answer sheet):
direct binaries Q-TB-SI-SE→Si, Q-TB-NI-NE→Ne, PERC-ORDER→**Si leads**;
Q-TB-FI-FE→Fi, Q-TB-TI-TE→Ti, JUDG-ORDER→**Fi leads**. Q-T1–T8 (4-way) all SKIPPED.
Q-O1 #1 = "beauty/music/design" (aesthetic). She is **Si+Fi**, deep introvert
(Extraversion 43). See memory [[te-fe-overcredit-hypothesis]].

## Confirmed root causes (verified in code, 2026-05-25)

1. **Sensing-blind typing.** Aesthetic/sensory openness IS measured
   (`lib/ocean.ts`: `openness_aesthetic`, subdimension `aesthetic`; Se→aesthetic
   0.5, Fi→aesthetic 0.3) but `lib/crossSignalDriverInference.ts` consumes NONE of
   it — `ExtractedSignals` (line ~137) carries only `oceanOpenness` (the O
   aggregate), no aesthetic subdimension. So a sensory shape has no path to Si/Se
   and defaults to the conceptual read.
2. **Cross-signal overrides explicit binaries when typing is thin.** The engine
   already DETECTS thin typing (`jungianStack.ts` binary resolver ~407–460 pushes
   `binary-thin` and drops Lens confidence to `low`). But low confidence still
   publishes the cross-signal architect dominant (Ni/Te) over the user's explicit
   Si/Fi binary picks. The agree/disagree/mirror-axis classifier thresholds
   (`score_floor 60`, `gap_floor 20`, `qt_ceiling 40`, mirror floor 50 — see memory
   [[cross-signal-disagreement-thresholds]]) govern this; the precedence is wrong
   when direct binaries exist.

## Part A — route the sensory signal into Si/Se

Thread the `aesthetic` subdimension (from `lib/ocean.ts`) into `ExtractedSignals`
(add a field; populate it in `extractAllSignals` where `oceanOpenness` is set,
~line 515), then add a MODEST component to BOTH `scoreSi` (~781) and `scoreSe`
(~845): high aesthetic/sensory openness lifts the sensing axis (which one wins is
left to the existing perceiving-binary + components — Nat's Si-lead binary resolves
it to Si). Keep the weight bounded (≈+10–15, in line with existing components) so
it nudges sensory shapes off the Ni default without flipping genuine intuitives.
Also consider: ranking "beauty/music/design" #1 on Q-O1 is the strongest single
aesthetic tell — wire that pick, not just the smoothed OCEAN aggregate.

## Part B — explicit binaries beat cross-signal proxies

At the integration site where `lens_stack.dominant` is chosen between the Q-T
DIRECT driver (from the binaries / 4-way) and the CROSS-SIGNAL inferred driver:
when the user gave explicit direct binary picks, those WIN over cross-signal
proxies — especially on the F/T (judging) axis, where Nat explicitly picked Fi and
was published Te. And invert the current weighting: `binary-thin` / low-confidence
direct typing should LOWER the cross-signal's authority to override, not raise it
(today, thin typing → cross-signal takes over → architect halo). The cross-signal
remains the tie-breaker ONLY when direct typing is genuinely absent or internally
contradictory. Check whether CC-171 (cross-signal perceiving-axis correction /
intuitive-Si) already covers part of the perceiving axis and extend rather than
duplicate it.

## Do NOT

- Do NOT regress the cohort architects. Jason (INTJ, Ni-Te — and his SCORESI-fixed
  si=30 must hold), Keith/Daniel/Harry (Si stewards), Ashley (Ne), Brian/Jake must
  keep their established dominant + surface MBTI. The aesthetic lift must be a
  nudge, not a flip; the binaries-authoritative rule must not fire when binaries
  are absent/contradictory.
- Do NOT change the disagree-classifier thresholds themselves unless unavoidable;
  if a fix only works by moving a threshold, STOP and report (mirrors SCORESI).
- Do NOT add new survey questions — this is a routing/precedence fix on signals the
  user ALREADY gives (memory [[minimal-questions-maximum-output]]).
- Do NOT touch Room Read, the couple module, report prose, or anything outside the
  typing/scoring path.
- Do NOT commit or push. (Sandbox: prepend `rm -f .git/index.lock` to any commit
  command handed to Jason.)

## Acceptance (run against tests/fixtures/cohort-real, incl. new nat-real.json)

1. **Nat:** published dominant respects her explicit binaries — perceiving resolves
   to **Si** (not Ni), judging to a **Feeler** (Fi, not Te). At minimum the JUDGING
   inversion (Te→Fi) is corrected; ideally both axes. Paste her before/after
   cross-signal scores + published dominant.
2. **No architect regression:** Jason still INTJ (Ni-Te, si=30 unchanged); Keith/
   Daniel/Harry still Si-top; Ashley still Ne-led; Brian/Jake unchanged. Paste
   before/after for all.
3. Aesthetic routing: a synthetic high-aesthetic/low-conceptual fixture lifts Si/Se
   measurably; a high-conceptual/low-aesthetic fixture does NOT gain sensing.
4. Full audit suite green at the bundle boundary: `cross-signal-driver-inference`,
   `cohortRealLensCanon` (add Nat's Si+Fi as a locked anchor), `functionVoiceBinary`
   (byte-identity), `staleShapeDetector`. Flag-don't-fix unexpected reds.
5. `npx tsc --noEmit` clean; lint clean.

## Report back

- Nat before/after (scores + dominant) and confirmation her binaries now win.
- Every cohort member whose dominant/surface label moved (architects must NOT).
- The exact aesthetic component (weights) + the integration precedence change, and
  whether CC-171 already covered part of it.
- tsc/lint/audit status; anything that needed a threshold move (should be none).

## Evidence base

- Memory: [[te-fe-overcredit-hypothesis]] (confirmed Nat finding + sensing-blind
  gap), [[si-false-positive-from-disposition]] (CC-SCORESI sibling),
  [[cross-signal-disagreement-thresholds]], [[pattern-catalog-function-bias]]
  (only 3/8 functions consumed — sensing is the starved half),
  [[minimal-questions-maximum-output]].
- Source: `lib/ocean.ts` (aesthetic subdimension), `lib/crossSignalDriverInference.ts`
  (`ExtractedSignals` ~137, `extractAllSignals` ~515, `scoreSi` ~781, `scoreSe`
  ~845, classifier ~960), `lib/jungianStack.ts` (binary resolver + `binary-thin`
  ~407–460, Lens confidence).
