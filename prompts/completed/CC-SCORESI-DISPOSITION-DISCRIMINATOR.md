# CC-SCORESI-DISPOSITION-DISCRIMINATOR

> Cowork-chat CC, 2026-05-25. Engine calibration. `scoreSi` in
> `lib/crossSignalDriverInference.ts` over-credits Si for devout,
> highly-conscientious **Ni-dominant** shapes because its components are
> disposition/value proxies (Faith/Honor/Loyalty compass, religious trust,
> conscientiousness, cost-bearing) that fire regardless of cognitive shape. The
> fix adds a discriminator so a faith-and-discipline halo isn't read as Si —
> WITHOUT regressing the true-Si steward anchors. This is NOT the Room Read
> chain (CC-176/177); it touches only the cross-signal Si scorer.

## The problem (verified 2026-05-25 against cohort-real fixtures)

Jason's cross-signal `si=75` — second only to `te=95`, and **above his `ni=65`** —
despite direct Q-T typing that is unambiguously Ni-Te with **Se over Si**
(`Q-TB-SI-SE` picks `se`; Se outranks Si in the `Q-T1` 4-way; `Q-T1–T4` lead Ni;
`Q-T5–T8` + both judging binaries land Te). There is no Si in how he perceives;
Si is arguably his least-preferred function. The 75 is built entirely from
disposition/value proxies:

| `scoreSi` component (weight) | Jason | Keith | Harry | Si-specific? |
|---|---|---|---|---|
| compass∈{Faith,Stability}+(Honor\|Loyalty\|Family) (+25) | ✅ | ✅ | ✅ | no (values) |
| trust∈{Religious,SmallBusiness,mentor} (+20) | ✅ | ✅ | ✅ | no (values) |
| conscientiousness≥90 (+15) | ✅ | ✅ | ✅ | no (disposition) |
| cost_surface≥4 (+10) | ✅ | ✅ | ✅ | no |
| building+people≥0.65 (+5) | ✅ | ✅ | — | no |
| **workMap=Operational/Stewardship (+10)** | **—** | ✅ | ✅ | **YES (genuine Si tell)** |
| keystone=belief-held-close-tradition-anchored (+15) | — | — | — | YES |
| **TOTAL** | **75** | **85** | **80** | |

The one genuinely Si-discriminating component Jason MISSES is workMap=Stewardship;
his workMap is **Strategic/Architectural** (an Ni/Te signature). The true-Si
anchors earn that +10. Jason still reaches 75 purely on the devout+disciplined
stack. This is the exact mirror of Harry (a true Si-dom who reads as N): Jason is a
true Ni-dom whose faith/tradition/loyalty compass reads as S. Separating
**cognitive shape** from the **disposition/values overlay** is the instrument's
differentiator (Jason canon 2026-05-25) — so this fix matters even though it makes
the strict Si/Ni game test go red on Jason (intended signal, per CC-175).

## Goal

Add a discriminator to `scoreSi` so a devout, high-conscientiousness shape whose
work/perceiving signature is **Strategic/Architectural (Ni/Te)** is not credited
with high Si — while the true-Si steward anchors (Keith, Daniel, Harry) keep their
high Si and stay correctly typed.

## Candidate mechanism (executor + Clarence-canon judgment; not prescriptive)

The established pattern is `scoreSe`'s CC-097B-CALIBRATION-V2 Agreeableness gates,
which stopped Fe-drivers being misread as Se. Mirror that here. A plausible
discriminator using only `ExtractedSignals` (scoreSi must stay independent of Q-T —
the disagree-classifier is the place Q-T meets cross-signal, not this scorer):
suppress or cap the value/disposition Si components when an Ni/Te signature is
present — e.g. `workMapRegisterKey` includes `strategic`/`architectural`, and/or
`compass` contains `Knowledge` (the `scoreNi` +25 anchor) with high Openness. Tune
so the faith-halo components don't alone clear the disagree-classifier floor for an
architect shape. Do not simply delete the value components — true-Si stewards rely
on them; gate them on the absence of the Ni/Te signature.

## Constraints — do NOT

- Do NOT touch Q-T direct typing, the binaries, or `Q-TB-*` derivations.
- Do NOT change the disagree-classifier thresholds (`score_floor 60`,
  `gap_floor 20`, `qt_ceiling 40`, mirror-axis floor `50`) — see
  `feedback_cross_signal_disagreement_thresholds`. If the fix only works by moving
  a threshold, STOP and report.
- Do NOT alter other function scorers (`scoreNi/Ne/Se/Te/Ti/Fi/Fe`) except a
  shared helper if strictly needed; the change should live in `scoreSi`.
- Do NOT change any report prose, Lens labels, or surface MBTI output directly —
  those re-derive; verify them as outputs, don't edit them.
- Do NOT commit or push. (Sandbox note: prepend `rm -f .git/index.lock` to any
  commit command handed to Jason.)

## Acceptance (run against tests/fixtures/cohort-real)

1. **Jason:** cross-signal `si` drops **below his `ni`** (currently ni=65) so Si is
   no longer a top-2 perceiving credit; his inferred driver / surface MBTI is
   unchanged (still resolves INTJ via Q-T). Paste his before/after `scores` vector.
2. **No true-Si regression:** Keith (`si=85`), Harry (`si=80`), Daniel (true-Si
   steward) keep Si as their top perceiving function and within a few points of
   current; their inferred drivers and surface labels unchanged. Paste before/after.
3. **Full cohort sweep:** run the cross-signal-driver-inference audit
   (`npm run audit:cross-signal-driver-inference`) AND the full audit suite at the
   bundle boundary (per `feedback_full_suite_after_bundle`). Flag-don't-fix any
   unexpected red — especially anything cacheMissLoudfail-class.
4. `npx tsc --noEmit` clean; lint clean.
5. The disagree-classifier outcomes for the whole cohort are unchanged except where
   Jason's Si rank changes (report any other cohort member whose classification
   moves — that is a regression to investigate, not necessarily accept).

## Report back

- Before/after `{ni,ne,si,se,ti,te,fi,fe}` for Jason + the three Si anchors.
- The exact discriminator added (component gates + weights) and why it separates
  Jason from Keith/Harry/Daniel.
- Any cohort member whose inferred driver, surface label, or disagree-class moved.
- `tsc`/lint/audit status.
- Anything that required touching the forbidden surfaces above (it shouldn't).

## Evidence base

- Memory: `feedback_si_false_positive_disposition`, `feedback_harry_intuitive_si`,
  `feedback_mirror_axis_canon`, `feedback_cross_signal_disagreement_thresholds`,
  `feedback_jungian_over_mbti_canon`.
- Source: `lib/crossSignalDriverInference.ts` — `scoreSi` (line ~781), `scoreSe`
  CC-097B gates (~845) as the discriminator-pattern precedent, `scoreNi` (~the Ni
  attractor: compass=Knowledge +25, openness, conscientiousness).
- Jason0524 prod session `4792ccdc-b92f-4658-a697-088ac627e849` is the live
  confirmation; the `jason-real.json` cohort fixture is the regression anchor.
