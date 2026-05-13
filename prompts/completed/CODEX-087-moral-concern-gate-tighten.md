# CODEX-087 — Moral-Concern Dominant Gate Tighten (≥80 → ≥90)

**Origin:** Post-CC-AS + CC-JX cohort distribution shifted. CODEX-086 §4 introduced the "moral-concern dominant" subtype label gated at A intensity ≥ 80, calibrated against the pre-cleanup distribution. Post-cleanup (CC-AS removed peace / family / justice's A; CC-JX removed all Jungian → A and applied position-weighted contribution), the cohort distribution has different shape: Jason's A=89 still triggers the label, and 11/20 fixtures still land at A ≥ 80, which means the label continues firing universally rather than distinguishing genuinely-saturated profiles. Tighten the gate to ≥ 90 so the label fires only for users whose A signal density genuinely warrants the subtype distinction.

**Scope frame:** One constant change + audit assertion updates. Five-minute CODEX. Pure surface-prose tuning; no math, no signal wiring.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Execution Directive

Single pass. Locate the `moral-concern dominant` gate in `lib/oceanDashboard.ts` (introduced by CODEX-086 §4 in `composeOceanValueLabel` helper). Change the threshold from `>= 80` to `>= 90`. Update the corresponding audit assertions in `tests/audit/oceanDashboard.audit.ts` to match.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run audit:ocean`
- `npm run audit:goal-soul-give`
- `git status`, `git diff`
- `cat`, `grep`, `find`

## Read First (Required)

1. `lib/oceanDashboard.ts` — `composeOceanValueLabel` helper added by CODEX-086 §4; locate the `intensity >= 80` gate.
2. `tests/audit/oceanDashboard.audit.ts` — locate the CODEX-086 assertions `a-high-subtype-label` and `a-low-no-subtype-label`.

## Allowed to Modify

### 1. `lib/oceanDashboard.ts` — gate change

In `composeOceanValueLabel`, change the moral-concern dominant gate from:

```ts
bucket === "A" && intensity >= 80
```

to:

```ts
bucket === "A" && intensity >= 90
```

Update any inline comment referencing the threshold (e.g., "matches the existing agreeablenessCareWithSpineClose gate" — the care-with-a-spine close stays at ≥ 80; the moral-concern dominant subtype label now diverges to ≥ 90 because subtype labels need to distinguish, not universally fire). Comment should explain: post-CC-AS + CC-JX, the gate was tightened to keep the label distinguishing rather than universal.

### 2. `tests/audit/oceanDashboard.audit.ts` — assertion updates

Update CODEX-086 assertions:

- `a-high-subtype-label`: change `agreeableness >= 80` to `agreeableness >= 90`. Assertion now reads: "For any fixture where `intensities.agreeableness >= 90`, the rendered SVG output contains `moral-concern dominant`."
- `a-low-no-subtype-label`: change `agreeableness < 80` to `agreeableness < 90`. Assertion now reads: "For any fixture where `intensities.agreeableness < 90`, the rendered SVG output does NOT contain `moral-concern dominant`."

## Out of Scope (Do Not)

1. **Do NOT modify `agreeablenessCareWithSpineClose`** (the prose close at A ≥ 80). That stays at ≥ 80 — the close serves a different rhetorical function ("care with a spine") and fires for anyone in the high band; only the displayed subtype label is being gate-tightened.
2. **Do NOT modify `agreeablenessDisambiguation`** (the prose disambiguation at A ≥ 60). Stays at ≥ 60.
3. **Do NOT modify any signal wiring or intensity math.**
4. **Do NOT modify other CODEX-086 edits** — quadrant relabel, disclaimer, E moderate-high template, Movement steepen sentence all stay verbatim.
5. **Do NOT modify** `MEMORY.md`, `AGENTS.md`, spec memos.
6. **Do NOT install dependencies.**

## Acceptance Criteria

1. `composeOceanValueLabel` gate changed to `intensity >= 90` for moral-concern dominant suffix.
2. Two CODEX-086 audit assertions updated to `>= 90` and `< 90` respectively.
3. `npx tsc --noEmit` exits 0.
4. `npm run lint` exits 0.
5. `npm run audit:ocean` exits 0.
6. `npm run audit:goal-soul-give` exits 0.
7. `git status --short` shows only `lib/oceanDashboard.ts` and `tests/audit/oceanDashboard.audit.ts`.

## Report Back

1. **Summary** in 1–2 sentences.
2. **Per-fixture impact** — count of fixtures where the moral-concern dominant suffix fired pre-CODEX-087 vs post; specifically confirm Jason fixture (A=81 post-CC-AS, expected A=76-83 post-CC-JX depending on signal pool) no longer triggers the label.
3. **Audit pass/fail** — confirm both updated assertions pass and existing assertions remain green.
4. **Recommendation for CODEX-088 (conditional):** if post-tighten the label fires for fewer than 2 fixtures cohort-wide, recommend removing the label entirely as a follow-up. If it fires for 3-5 fixtures (the genuinely-saturated profiles), the label is doing distinguishing work and stays.
