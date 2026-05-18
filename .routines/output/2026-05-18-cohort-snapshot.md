# Cohort distribution snapshot — 2026-05-18

Scheduled weekly observational snapshot of label distribution and Aim/Grip
spread across the audited cohort. Observational only — no recommendations.

Sources:
- `tests/audit/phase3aLabels.audit.ts` (PASS — quadrant + Risk Form table)
- `tests/audit/aimRebuild.audit.ts` (PASS — Aim + Grip decomposition)

Cohort size: **24 fixtures** (ocean/* + goal-soul-give/*).

## Risk Form letter distribution

| Risk Form letter         | Count |
|--------------------------|------:|
| Grip-Governed            |     8 |
| Ungoverned Movement      |     7 |
| Open-Handed Aim          |     6 |
| Lightly Governed Movement |    3 |
| White-Knuckled Aim       |     0 |

Notes:
- 5-band canonical set per CC-RISK-FORM-LIGHTLY-GOVERNED-MOVEMENT rename.
- "White-Knuckled Aim" band is unrepresented in the current cohort.

## Movement Quadrant distribution

| Quadrant                | Count |
|-------------------------|------:|
| Love without Form       |     7 |
| Pressed Output          |     4 |
| Giving / Presence       |     3 |
| Goal-led Presence       |     2 |
| Work without Presence   |     2 |
| Drift                   |     2 |
| Driven Output           |     2 |
| Strained Integration    |     1 |
| Gripping                |     1 |
| Soul-led Presence       |     0 |

Notes:
- 12-label canonical union per CC-MOMENTUM-HONESTY.
- "Soul-led Presence" is unrepresented in the current cohort.
- Love without Form is the heaviest single bucket (7/24 ≈ 29%).

## Aim score (refined Phase-3a formula)

| Statistic | Value |
|-----------|------:|
| min       |  16.1 |
| median    |  46.55 |
| max       |  75.6 |
| mean      |  49.31 |

Aim threshold bands (≥60 / 40–60 / <40):

| Band   | Count |
|--------|------:|
| ≥60    |     6 |
| 40–60  |    11 |
| <40    |     7 |

Audit reports threshold review: *"appears calibrated; Hold at 60 for V1."*

## Grip score (`gripReading.score` after §13 compose + floor)

| Statistic | Value |
|-----------|------:|
| min       |   0.0 |
| median    |  26.00 |
| max       | 100.0 |
| mean      |  34.33 |

## Drift comparison

This is the first cohort-snapshot file in `.routines/output/`. No prior
snapshot to compare against. Subsequent weekly runs will diff against this
baseline.

## Notes on label coverage

- Quadrant cohort exercises 9/12 canonical labels; missing from cohort:
  Soul-led Presence, plus 2 others not observed in this run.
- Risk Form cohort exercises 4/5 canonical letters; missing: White-Knuckled
  Aim.
- Both gaps are present *in the union test* (synthetic probes pass the
  union-completeness assertion) — they simply don't manifest in current
  fixture archetypes.

## Per-fixture table (reference)

| fixture | quadrant | risk | Aim | Grip |
|---|---|---|---:|---:|
| ocean/01-architectural-openness | Goal-led Presence | Open-Handed Aim | 70.0 | 0.0 |
| ocean/02-high-conscientiousness | Work without Presence | Lightly Governed Movement | 46.8 | 45.0 |
| ocean/03-low-extraversion-high-soul | Love without Form | Ungoverned Movement | 30.9 | 0.0 |
| ocean/04-high-agreeableness-loyalty | Love without Form | Ungoverned Movement | 39.5 | 0.0 |
| ocean/05-low-emotional-reactivity-proxy | Work without Presence | Lightly Governed Movement | 55.1 | 20.0 |
| ocean/06-thin-signal-under-detected | Drift | Grip-Governed | 16.1 | 45.0 |
| ocean/07-jason-real-session | Goal-led Presence | Open-Handed Aim | 64.9 | 21.0 |
| ocean/24-si-precedent-keeper | Strained Integration | Ungoverned Movement | 58.4 | 31.0 |
| ocean/25-ti-coherence-prober | Pressed Output | Grip-Governed | 43.4 | 81.0 |
| ocean/26-fi-inner-truth-anchor | Giving / Presence | Open-Handed Aim | 74.2 | 21.0 |
| ocean/27-fe-room-reader-attuned | Love without Form | Lightly Governed Movement | 55.0 | 31.0 |
| goal-soul-give/01-generative | Giving / Presence | Open-Handed Aim | 75.6 | 21.0 |
| goal-soul-give/02-compartmentalized | Driven Output | Grip-Governed | 46.3 | 68.0 |
| goal-soul-give/03-striving | Pressed Output | Grip-Governed | 46.2 | 43.0 |
| goal-soul-give/04-longing | Love without Form | Ungoverned Movement | 33.3 | 21.0 |
| goal-soul-give/05-steward-not-gripper | Love without Form | Ungoverned Movement | 49.5 | 21.0 |
| goal-soul-give/06-neutral | Drift | Grip-Governed | 16.1 | 45.0 |
| goal-soul-give/07-true-gripping | Gripping | Grip-Governed | 32.0 | 100.0 |
| goal-soul-give/08-early-career-striving | Pressed Output | Grip-Governed | 46.2 | 43.0 |
| goal-soul-give/09-mid-career-balance | Giving / Presence | Open-Handed Aim | 75.6 | 21.0 |
| goal-soul-give/10-entrepreneur-striving | Pressed Output | Grip-Governed | 46.2 | 43.0 |
| goal-soul-give/11-retirement-longing | Love without Form | Ungoverned Movement | 33.3 | 21.0 |
| goal-soul-give/12-productive-ne-default-pair | Driven Output | Open-Handed Aim | 68.9 | 61.0 |
| goal-soul-give/13-drive-inverted-case | Love without Form | Ungoverned Movement | 59.9 | 21.0 |
