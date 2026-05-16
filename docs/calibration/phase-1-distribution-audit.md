# Phase 1 Distribution Audit

**Cohort counts** — fixtures N=8 / live N=13 (pre-online 13, current 0) / live skipped N=0.

Engine-version split: sessions created before `2026-05-12T00:00:00.000Z` are bucketed "pre-online"; on/after are "current". Cutoff is per F1's "approximately 2026-05-10 to 2026-05-16" window. CC-STALE-SHAPE-DETECTOR was not present at run time — `engine_shape_version` column is absent on `sessions`, so the cutoff is timestamp-based rather than schema-stamped.

## Findings summary

- **F1 — Engine-version split for §13 stakes amplifier.** Verdict: **inconclusive**. Pre-online mean amplifier delta = 3.4 (n=13); current mean = n/a (n=0). See "Amplifier × engine version" histogram below.
- **F2 — Composed Grip distribution compression.** Verdict: **inconclusive**. Pre-online range = 55.0 pts (n=13, min=0.0, max=55.0); current range = 0.0 pts (n=0, min=n/a, max=n/a). See "Composed Grip × engine version" histogram below.
- **F3 — Soul ceiling cluster.** Verdict: **refuted**. 0% of current-engine live sessions (0/0) sit at Soul ≥ 90; flag threshold = 60%. See "Soul-axis" + "Soul-axis × Q-A2" histograms below.
- **F4 — Cause-Soul vs Person-Soul vector hypothesis.** Verdict: **inconclusive without per-session annotation review** (see scatter table below). The script computes both proxies; final verdict requires human review of the scatter, per the CC's editorial-discipline canon. Confirmed only if engine Soul correlates with person-Soul-proxy and ignores cause-Soul-proxy across multiple sessions.
- **F5 — Cohort-cache zero-match-rate.** Verdict: **confirmed**. 11 session(s) carry an `llm_rewrites` bundle; total matched cache keys across all 5 layers = 0. See "Cohort-cache match-rate" table below.
- **F6 — JasonDMcG self-report calibration anchor.** Surfaced as data, not authority. See "Subject self-report comparison appendix" below.
- **F7 — Grip Pattern card render gate.** Verdict: **inconclusive without bucket-mapping count vs render-status correlation** — surfaced in "Grip Pattern card render × bucket alignment" table; final verdict requires human review of high-grip / low-bucket vs low-grip / high-bucket cells.

## Composed Grip × engine version (F1, F2)

### Composed Grip — 5-point buckets

| Bucket | Fixtures (n) | Live pre-online (n) | Live current (n) | Δ (current − pre-online) |
|---|---:|---:|---:|---:|
| 0–5 | 0 | 4 | 0 | -4 |
| 5–10 | 0 | 0 | 0 | +0 |
| 10–15 | 0 | 2 | 0 | -2 |
| 15–20 | 1 | 0 | 0 | +0 |
| 20–25 | 0 | 0 | 0 | +0 |
| 25–30 | 1 | 2 | 0 | -2 |
| 30–35 | 0 | 1 | 0 | -1 |
| 35–40 | 1 | 2 | 0 | -2 |
| 40–45 | 0 | 0 | 0 | +0 |
| 45–50 | 0 | 1 | 0 | -1 |
| 50–55 | 1 | 0 | 0 | +0 |
| 55–60 | 0 | 1 | 0 | -1 |
| 60–65 | 0 | 0 | 0 | +0 |
| 65–70 | 1 | 0 | 0 | +0 |
| 70–75 | 0 | 0 | 0 | +0 |
| 75–80 | 0 | 0 | 0 | +0 |
| 80–85 | 0 | 0 | 0 | +0 |
| 85–90 | 1 | 0 | 0 | +0 |
| 90–95 | 0 | 0 | 0 | +0 |
| 95–100 | 0 | 0 | 0 | +0 |

## Amplifier × engine version (F1)

### Defensive → Composed amplifier delta

| Bucket | Fixtures (n) | Live pre-online (n) | Live current (n) | Δ (current − pre-online) |
|---|---:|---:|---:|---:|
| <-20 | 0 | 0 | 0 | +0 |
| -20–-10 | 0 | 0 | 0 | +0 |
| -10–0 | 0 | 0 | 0 | +0 |
| 0–5 | 6 | 10 | 0 | -10 |
| 5–10 | 1 | 0 | 0 | +0 |
| 10–15 | 1 | 2 | 0 | -2 |
| 15–20 | 0 | 1 | 0 | -1 |
| 20+ | 0 | 0 | 0 | +0 |

## Soul-axis (F3)

### Soul score — 5-point buckets

| Bucket | Fixtures (n) | Live (n) | Δ (live − fixtures) |
|---|---:|---:|---:|
| 0–5 | 0 | 0 | +0 |
| 5–10 | 0 | 0 | +0 |
| 10–15 | 0 | 0 | +0 |
| 15–20 | 1 | 0 | -1 |
| 20–25 | 3 | 0 | -3 |
| 25–30 | 1 | 0 | -1 |
| 30–35 | 0 | 1 | +1 |
| 35–40 | 0 | 1 | +1 |
| 40–45 | 0 | 0 | +0 |
| 45–50 | 0 | 3 | +3 |
| 50–55 | 0 | 1 | +1 |
| 55–60 | 1 | 0 | -1 |
| 60–65 | 0 | 0 | +0 |
| 65–70 | 0 | 0 | +0 |
| 70–75 | 1 | 0 | -1 |
| 75–80 | 0 | 1 | +1 |
| 80–85 | 1 | 0 | -1 |
| 85–90 | 0 | 4 | +4 |
| 90–95 | 0 | 0 | +0 |
| 95–100 | 0 | 1 | +1 |

## Soul-axis × Q-A2 response (F3, F4)

### Fixtures

| Bucket | Building or creating something new | Deepening relationships and care | Restoring order and stability | Exploring, learning, or wandering | n/a |
| --- | --- | --- | --- | --- | --- |
| 0–10 | 0 | 0 | 0 | 0 | 0 |
| 10–20 | 0 | 0 | 0 | 1 | 0 |
| 20–30 | 0 | 2 | 0 | 2 | 0 |
| 30–40 | 0 | 0 | 0 | 0 | 0 |
| 40–50 | 0 | 0 | 0 | 0 | 0 |
| 50–60 | 1 | 0 | 0 | 0 | 0 |
| 60–70 | 0 | 0 | 0 | 0 | 0 |
| 70–80 | 0 | 0 | 0 | 1 | 0 |
| 80–90 | 0 | 0 | 1 | 0 | 0 |
| 90–100 | 0 | 0 | 0 | 0 | 0 |

### Live

| Bucket | Building or creating something new | Deepening relationships and care | Restoring order and stability | Exploring, learning, or wandering | n/a |
| --- | --- | --- | --- | --- | --- |
| 0–10 | 0 | 0 | 0 | 0 | 0 |
| 10–20 | 0 | 0 | 0 | 0 | 0 |
| 20–30 | 0 | 0 | 0 | 0 | 0 |
| 30–40 | 1 | 1 | 0 | 0 | 0 |
| 40–50 | 2 | 0 | 0 | 0 | 1 |
| 50–60 | 1 | 0 | 0 | 0 | 0 |
| 60–70 | 0 | 0 | 0 | 0 | 0 |
| 70–80 | 0 | 0 | 0 | 1 | 0 |
| 80–90 | 2 | 1 | 0 | 1 | 0 |
| 90–100 | 0 | 1 | 0 | 0 | 0 |

## Cause-Soul / Person-Soul proxy scatter (F4)

Per session: engine Soul score, cause-Soul-proxy, person-Soul-proxy, plus dominant proxy. Person-Soul = Q-A2 'Deepening relationships' + Q-GS1 soul_people + Q-V1 soul_beloved_named. Cause-Soul = Q-A2 'Building or creating' + Q-GS1 soul_calling/creative_truth + Q-V1 sacred_belief_connection/goal_logic_explanation.

| Source | Id | Name | Soul | Cause-proxy | Person-proxy | Dominant |
|---|---|---|---:|---:|---:|---|
| fixture | `fi-quiet-resister.json` | Fi Quiet Resister (CC-COHORT-EXPANSION-SI-SE-CRISIS Addition 4) | 56 | 100 | 0 | cause |
| fixture | `grasp-without-substance-` | Grasp Without Substance — Relational (CC-COHORT-EXPANSION-SI-SE-CRISIS Addition 5) | 15 | 0 | 0 | tie |
| fixture | `paralysis-shame-without-` | Paralysis — Shame Without Project (CC-COHORT-EXPANSION-SI-SE-CRISIS Addition 6) | 21 | 0 | 33 | person |
| fixture | `restless-reinvention-no-` | Restless Reinvention Without Anchor (CC-COHORT-EXPANSION-SI-SE-CRISIS Addition 8) | 24 | 0 | 0 | tie |
| fixture | `se-high-extraversion-res` | Se High-Extraversion Responder (CC-COHORT-EXPANSION-SI-SE-CRISIS Addition 2) | 72 | 34 | 0 | cause |
| fixture | `si-tradition-steward.jso` | Si Tradition Steward (CC-COHORT-EXPANSION-SI-SE-CRISIS Addition 1) | 84 | 34 | 0 | cause |
| fixture | `ti-systems-analyst.json` | Ti Systems Analyst (CC-COHORT-EXPANSION-SI-SE-CRISIS Addition 3) | 26 | 67 | 0 | cause |
| fixture | `withdrawal-movement-coll` | Withdrawal — Movement Collapse (CC-COHORT-EXPANSION-SI-SE-CRISIS Addition 7) | 21 | 0 | 33 | person |
| live | `31b4e006-3dc6-4a43-b705-` | (unnamed) | 39 | 0 | 33 | person |
| live | `35d61070-fff7-497e-a518-` | (unnamed) | 95 | 67 | 33 | cause |
| live | `3629ddb6-edb8-49a5-9211-` | (unnamed) | 46 | 33 | 0 | cause |
| live | `3e6abe27-ec0f-41ed-925e-` | (unnamed) | 47 | 0 | 0 | tie |
| live | `3e940638-dabf-4c3c-95fd-` | (unnamed) | 48 | 33 | 0 | cause |
| live | `5063c920-dc37-44a3-8931-` | (unnamed) | 100 | 0 | 100 | person |
| live | `54265a13-ab24-4c70-95fd-` | (unnamed) | 53 | 100 | 0 | cause |
| live | `5740f936-9488-4400-943f-` | (unnamed) | 88 | 33 | 33 | tie |
| live | `7a68e4d5-a8eb-4a1d-b9fd-` | (unnamed) | 85 | 0 | 33 | person |
| live | `9ff07fd7-ac59-4cec-9f24-` | (unnamed) | 33 | 33 | 0 | cause |
| live | `c2a7984e-b662-430b-9a9e-` | (unnamed) | 87 | 0 | 0 | tie |
| live | `e5cc0a6d-510d-48fc-b72d-` | (unnamed) | 86 | 33 | 0 | cause |
| live | `fe71b212-8ef0-43da-9e10-` | (unnamed) | 78 | 0 | 0 | tie |

## Grip Pattern card render × bucket alignment (F7)

Per session: composed Grip, primal-cluster primary + confidence, contributing-grips count. The Grip Pattern card renders when primalCluster.confidence is `high` or `medium-high`. Hypothesis (F7): renders correlate with high primal confidence (clean bucket-mapping), not with composed Grip score.

| Source | Id | Composed Grip | Primal primary | Confidence | Contributing grips |
|---|---|---:|---|---|---:|
| fixture | `fi-quiet-resister.json` | 26.9 | Am I secure? | low | 0 |
| fixture | `grasp-without-substance-` | 89.8 | Am I wanted? | medium-high | 0 |
| fixture | `paralysis-shame-without-` | 100.0 | Am I successful? | low | 0 |
| fixture | `restless-reinvention-no-` | 65.0 | Am I good enough? | medium | 0 |
| fixture | `se-high-extraversion-res` | 19.9 | Am I good enough? | medium | 0 |
| fixture | `si-tradition-steward.jso` | 35.8 | Am I secure? | high | 0 |
| fixture | `ti-systems-analyst.json` | 52.5 | Am I good enough? | high | 0 |
| fixture | `withdrawal-movement-coll` | 100.0 | Am I secure? | medium-high | 0 |
| live | `31b4e006-3dc6-4a43-b705-` | 49.0 | Am I secure? | medium-high | 0 |
| live | `35d61070-fff7-497e-a518-` | 55.0 | Am I secure? | high | 0 |
| live | `3629ddb6-edb8-49a5-9211-` | 0.0 | (none) | low | 0 |
| live | `3e6abe27-ec0f-41ed-925e-` | 25.0 | (none) | low | 0 |
| live | `3e940638-dabf-4c3c-95fd-` | 0.0 | Am I successful? | medium | 0 |
| live | `5063c920-dc37-44a3-8931-` | 38.2 | Am I wanted? | high | 0 |
| live | `54265a13-ab24-4c70-95fd-` | 30.7 | Am I good enough? | high | 0 |
| live | `5740f936-9488-4400-943f-` | 2.0 | Am I good enough? | medium | 0 |
| live | `7a68e4d5-a8eb-4a1d-b9fd-` | 36.8 | Am I wanted? | medium-high | 0 |
| live | `9ff07fd7-ac59-4cec-9f24-` | 25.0 | (none) | low | 0 |
| live | `c2a7984e-b662-430b-9a9e-` | 10.0 | (none) | low | 0 |
| live | `e5cc0a6d-510d-48fc-b72d-` | 10.0 | Am I secure? | medium-high | 0 |
| live | `fe71b212-8ef0-43da-9e10-` | 0.0 | Am I secure? | medium | 0 |

## Grip Pattern bucket distribution

### Primal primary

| Bucket | Fixtures (n) | Live (n) | Δ (live − fixtures) |
|---|---:|---:|---:|
| Am I safe? | 0 | 0 | +0 |
| Am I secure? | 3 | 4 | +1 |
| Am I loved? | 0 | 0 | +0 |
| Am I wanted? | 1 | 2 | +1 |
| Am I successful? | 1 | 1 | +0 |
| Am I good enough? | 3 | 2 | -1 |
| Do I have purpose? | 0 | 0 | +0 |
| (none) | 0 | 4 | +4 |

Mapping note: the CC's 'Safety / Security / Belonging / Worth / Recognition / Control / Purpose / unmapped' bucket names correspond to the engine's PrimalQuestion enum values verbatim ('Am I safe?' → Safety, 'Am I loved?' → Belonging, 'Am I wanted?' → Recognition, 'Am I successful?' → Worth, 'Am I good enough?' → Mastery/Control, 'Do I have purpose?' → Purpose, '(none)' → unmapped). The engine ships the question-form labels; the CC's bucket names are interpretive.

## Risk Form label distribution

### Risk Form letter

| Bucket | Fixtures (n) | Live (n) | Δ (live − fixtures) |
|---|---:|---:|---:|
| Open-Handed Aim | 0 | 2 | +2 |
| White-Knuckled Aim | 0 | 1 | +1 |
| Grip-Governed | 5 | 1 | -4 |
| Ungoverned Movement | 2 | 7 | +5 |
| Lightly Governed Movement | 1 | 2 | +1 |
| Strained Integration | 0 | 0 | +0 |
| (unset) | 0 | 0 | +0 |

Per the CC's expected finding: Lightly Governed Movement should show 0 entries (canon wiring not landed) — this table confirms or refutes.

## Cost / Coverage / Compliance bucket lean (38% threshold per workMap.ts canon)

### 3C lean

| Bucket | Fixtures (n) | Live (n) | Δ (live − fixtures) |
|---|---:|---:|---:|
| cost-leaning | 0 | 1 | +1 |
| coverage-leaning | 6 | 5 | -1 |
| compliance-leaning | 0 | 0 | +0 |
| aligned | 2 | 7 | +5 |
| unknown | 0 | 0 | +0 |

## DriveCase distribution

### DriveCase

| Bucket | Fixtures (n) | Live (n) | Δ (live − fixtures) |
|---|---:|---:|---:|
| aligned | 2 | 5 | +3 |
| inverted-small | 1 | 0 | -1 |
| inverted-big | 2 | 0 | -2 |
| partial-mismatch | 3 | 0 | -3 |
| balanced | 0 | 2 | +2 |
| unstated | 0 | 6 | +6 |
| (unset) | 0 | 0 | +0 |

## Cohort-cache match-rate per session per layer (F5)

Fixtures cohort is the cohort cache (trivially matches itself), so only live is shown.

| Session id | prose | keystone | synthesis3 | grip | launchPolishV3 | total |
|---|---:|---:|---:|---:|---:|---:|
| `31b4e006-3dc6-4a43-b705-` | 0 | 0 | 0 | 0 | 0 | 0 |
| `35d61070-fff7-497e-a518-` | 0 | 0 | 0 | 0 | 0 | 0 |
| `3629ddb6-edb8-49a5-9211-` | 0 | 0 | 0 | 0 | 0 | 0 |
| `3e6abe27-ec0f-41ed-925e-` | 0 | 0 | 0 | 0 | 0 | 0 |
| `3e940638-dabf-4c3c-95fd-` | 0 | 0 | 0 | 0 | 0 | 0 |
| `5063c920-dc37-44a3-8931-` | 0 | 0 | 0 | 0 | 0 | 0 |
| `54265a13-ab24-4c70-95fd-` | — | — | — | — | — | (no bundle) |
| `5740f936-9488-4400-943f-` | — | — | — | — | — | (no bundle) |
| `7a68e4d5-a8eb-4a1d-b9fd-` | 0 | 0 | 0 | 0 | 0 | 0 |
| `9ff07fd7-ac59-4cec-9f24-` | 0 | 0 | 0 | 0 | 0 | 0 |
| `c2a7984e-b662-430b-9a9e-` | 0 | 0 | 0 | 0 | 0 | 0 |
| `e5cc0a6d-510d-48fc-b72d-` | 0 | 0 | 0 | 0 | 0 | 0 |
| `fe71b212-8ef0-43da-9e10-` | 0 | 0 | 0 | 0 | 0 | 0 |

## Cross-question contradiction table

### Pairs

Threshold: contradiction rates ≥ 25% are **bolded**.

| Pair | Fixtures (exp/cont/n.a) | Fixtures rate | Live (exp/cont/n.a) | Live rate | Δ |
|---|---|---:|---|---:|---:|
| Q-A2↔Q-E1-outward | 2/0/6 | 0.0% | 5/1/7 | 16.7% | +16.7 pts |
| Q-Stakes1↔Q-GRIP1 | 2/4/2 | **66.7%** | 1/1/11 | **50.0%** | -16.7 pts |
| Q-A2↔Q-GS1 (Soul intent) | 1/2/5 | **66.7%** | 3/1/9 | **25.0%** | -41.7 pts |
| Q-V1↔Q-GS1 (cause vs person) | 4/0/4 | 0.0% | 3/0/10 | 0.0% | +0.0 pts |

- **Q-A2↔Q-E1-outward** — Q-A2 'Building or creating something new' should pair with Q-E1-outward top-1 = 'building' or 'solving'.
- **Q-Stakes1↔Q-GRIP1** — Q-Stakes1 top-1 ∈ {money, job} should pair with Q-GRIP1 top-1 ∈ {grips_security, grips_reputation, grips_certainty}; Q-Stakes1 top-1 = close_relationships should pair with Q-GRIP1 top-1 ∈ {grips_neededness, grips_approval}.
- **Q-A2↔Q-GS1 (Soul intent)** — Q-A2 'Deepening relationships and care' should pair with Q-GS1 top = soul_people / soul_calling; Q-A2 'Building or creating something new' should pair with Q-GS1 top = durable_creation / creative_truth / goal_completion.
- **Q-V1↔Q-GS1 (cause vs person)** — Q-V1 top = soul_beloved_named should pair with Q-GS1 top = soul_people; Q-V1 top = sacred_belief_connection / goal_logic_explanation should pair with Q-GS1 top ∈ {soul_calling, creative_truth, durable_creation, goal_completion}.

## Subject self-report comparison appendix (F6)

Per CC F6: data, not authority. The other 6 sessions' self-reports arrive separately and outside this CC's scope; calibration cannot be tuned to a single subject's intuition.

| Subject | Stated | Rendered (composed Grip) | Rendered (Usable Movement) | Discrepancy |
|---|---|---:|---:|---|
| JasonDMcG | (not found in live cohort by demographic name) | — | — | n/a |

## Data gaps

No data gaps: every histogram in this artifact was producible from the cohort.

## Inputs

- **Git SHA**: `6787d8193b67ef5a1bd1c6c9fbeecd74a85d6a30`
- **Engine entry point**: `buildInnerConstitution(answers, [], demographics)` from `lib/identityEngine.ts`
- **Engine-version cutoff**: `2026-05-12T00:00:00.000Z` (timestamp-based; `engine_shape_version` column absent because CC-STALE-SHAPE-DETECTOR has not shipped)
- **Fixtures cohort dir**: `tests/fixtures/cohort/` (8 files)
  - fi-quiet-resister.json
  - grasp-without-substance-relational.json
  - paralysis-shame-without-project.json
  - restless-reinvention-no-anchor.json
  - se-high-extraversion-responder.json
  - si-tradition-steward.json
  - ti-systems-analyst.json
  - withdrawal-movement-collapse.json
- **Live cohort**: `SELECT id, created_at, answers, llm_rewrites FROM sessions` (13 rows; 0 skipped)
- **Contradiction bold threshold**: 25%
- **Soul-cluster flag threshold**: 60%

**No API key was in scope during run** — script imports nothing from `lib/*LlmServer.ts`, does not instantiate the Anthropic SDK, and made zero requests to `api.anthropic.com`.
