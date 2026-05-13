# CC-MOMENTUM-HONESTY — Lead with Usable Movement + Grip-Aware Quadrant Labels

**Origin:** Three cohort renders (Jason, Cindy, Michele) surfaced a recurring tension — the engine reads users as having strong momentum even when their Grip is high and Aim is moderate, because Movement Strength is computed from the raw Goal/Soul vector alone and Quadrant labels don't reflect defensive register. Cindy's render is the canonical example: she scores `Movement Strength 85.1 (full)` and `Quadrant: Giving / Presence`, while simultaneously `Risk Form: Grip-Governed` with 5 named grips firing. The labels contradict each other for a reader trying to understand her actual state.

Jason canonized 2026-05-11: *"the model is too kind to momentum in general."*

This CC fixes the labeling layer to be honest:
1. **Lead with Usable Movement** as the primary readout (not Potential)
2. **Make Quadrant labels Grip-aware** — high-Grip users at the integration angle don't get the canonical "Giving / Presence" label
3. **Recalibrate Movement Strength descriptors** to use Usable instead of Potential when categorizing

**Method discipline:** Render + label-logic layer. No engine math changes (Goal/Soul/Aim/Grip/Movement Strength formulas stay). The Quadrant label gating gets a Grip threshold added. LLM prompts untouched. Cohort cache regen optional (only if prose-template strings change in `lib/movementQuadrant.ts` PROSE map).

**Scope frame:** ~2-3 hours executor time. CC-mega scale because of editorial judgment in the new Quadrant labels + the descriptor recalibration.

**Cost surface:** ~$0.10–0.30 cohort cache regen IF the new Quadrant labels propagate into existing cached prose paragraphs (they may not — depends on whether prompts reference Quadrant by name).

---

## Embedded context

### The empirical observations (from rendered cohort)

| Fixture | Potential Movement | Usable Movement | Drag % | Quadrant | Risk Form | Quadrant feels honest? |
|---|---|---|---|---|---|---|
| Jason | 70.8 (long) | 59.2 | 16% | Goal-led Presence | Ungoverned Movement | mostly — moderate honesty |
| Cindy | 85.1 (full) | 62.9 | 26% | Giving / Presence | Grip-Governed | **no — "full" overstates; "Giving / Presence" contradicts Grip-Governed** |
| Michele | 67.7 (long) | 52.5 | 22% | Love without Form | Ungoverned Movement | mostly — "long" descriptor too generous when 22% drag |

### The diagnostic insight

Cindy's case exposes the architectural gap:

- Engine math says: integrated trajectory (56° in 42-58° band), high Soul (100), high Goal (67), strong Movement (85.1)
- Engine math also says: high Grip (46), Aim only borderline (59.8), 5 named grips, Risk Form = Grip-Governed
- Current labels say BOTH: "Giving / Presence" (the canonical destination label) AND "Grip-Governed" (fear is driving)
- These labels contradict each other for the user trying to read their state

The truth: Cindy is at the integration angle, but her giving is *driven by fear* — being needed, approval, reputation. The "Giving / Presence" label captures the *observable behavior pattern*; "Grip-Governed" captures the *internal register*. The Pauline-love precedent applies — patterns that LOOK like presence/giving can be driven by fear. The math correctly surfaces both registers; the labels don't yet reconcile them.

### Three architectural responses, bundled

**A. Lead with Usable Movement (not Potential) as the headline number.**
**B. Make Quadrant labels Grip-aware.**
**C. Recalibrate Movement Strength descriptors against Usable, not Potential.**

All three address "the model is too kind to momentum." Together they restore honest signaling between math and labels.

---

## Architecture

### File map

| File | Action | Purpose |
|---|---|---|
| `lib/movementQuadrant.ts` | MODIFY | Add Grip threshold to Quadrant label gating. Define new labels for high-Grip integration-band cases. |
| `lib/types.ts` | MODIFY | Update `MovementQuadrantLabel` union with new labels. |
| `lib/goalSoulMovement.ts` (wherever Movement Strength descriptor is computed) | MODIFY | Recalibrate descriptor bands to use Usable Movement, not Potential. |
| `lib/renderMirror.ts` | MODIFY | Reorder Movement section — Usable as primary, Potential as context. |
| `app/components/InnerConstitutionPage.tsx` | MODIFY | Same reorder at React layer. |
| `lib/trajectoryChart.ts` | MODIFY | Chart's solid line becomes Usable (was Potential); Potential becomes lighter/ghosted reference. |
| `tests/audit/momentumHonesty.audit.ts` | NEW | 10 audit assertions. |

### Segment A: Lead with Usable Movement

**Current Movement section ordering:**

```
Goal: 85 / 100
Soul: 53 / 100
Direction: 32° (Goal-leaning)
Movement Strength: 70.8 / 100 (long)   ← potential, prominent
Quadrant: Goal-led Presence
Aim: 51.5 / 100
Grip: 21 / 100
[...]
```

**Proposed reorder:**

```
Goal: 85 / 100
Soul: 53 / 100
Direction: 32° (Goal-leaning)
Movement: Usable 59.2 / 100 (moderate-long)   ← USABLE, primary
            Potential 70.8 (-16% drag)        ← potential as context
Quadrant: Goal-led Presence
Aim: 51.5 / 100
Grip: 21 / 100
[...]
```

The descriptor ("moderate-long") comes from a recalibrated band that uses Usable.

### Segment B: Grip-aware Quadrant labels

**Current Quadrant logic (Phase 3a):**

```ts
if (g >= 50 && s >= 50 && angle 42-58°) → "Giving / Presence"
if (g >= 50 && s >= 50 && angle < 42°)  → "Goal-led Presence"
if (g >= 50 && s >= 50 && angle > 58°)  → "Soul-led Presence"
if (g >= 50 && s < 50)                    → "Work without Presence"
if (g < 50 && s >= 50)                    → "Love without Form"
if (g < 50 && s < 50 && gripFires)        → "Gripping"
if (g < 50 && s < 50 && !gripFires)       → "Drift"
```

**Proposed Grip-aware refinement:**

```ts
// High-Goal + High-Soul cases now have Grip gating
const HIGH_GRIP_THRESHOLD = 35;  // calibrate against cohort

if (g >= 50 && s >= 50 && angle 42-58° && grip < HIGH_GRIP_THRESHOLD)
  → "Giving / Presence"
if (g >= 50 && s >= 50 && angle 42-58° && grip >= HIGH_GRIP_THRESHOLD)
  → "Strained Integration"   // NEW — at the integration angle, but grip is doing the work

if (g >= 50 && s >= 50 && angle < 42° && grip < HIGH_GRIP_THRESHOLD)
  → "Goal-led Presence"
if (g >= 50 && s >= 50 && angle < 42° && grip >= HIGH_GRIP_THRESHOLD)
  → "Driven Output"         // NEW — high movement, Goal-leaning, but defensive

if (g >= 50 && s >= 50 && angle > 58° && grip < HIGH_GRIP_THRESHOLD)
  → "Soul-led Presence"
if (g >= 50 && s >= 50 && angle > 58° && grip >= HIGH_GRIP_THRESHOLD)
  → "Burdened Care"         // NEW — high Soul, but caring is gripping-driven

// Single-axis-low cases ALSO get Grip awareness
if (g >= 50 && s < 50 && grip < HIGH_GRIP_THRESHOLD) → "Work without Presence"
if (g >= 50 && s < 50 && grip >= HIGH_GRIP_THRESHOLD) → "Pressed Output"
if (g < 50 && s >= 50 && grip < HIGH_GRIP_THRESHOLD) → "Love without Form"
if (g < 50 && s >= 50 && grip >= HIGH_GRIP_THRESHOLD) → "Anxious Caring"

// Low-both cases unchanged (Gripping label already reflects grip-driven state)
if (g < 50 && s < 50 && gripClusterFires) → "Gripping"
if (g < 50 && s < 50 && !gripClusterFires) → "Drift"
```

**New labels added:**
- **Strained Integration** — at 50° angle, but grip is doing the work
- **Driven Output** — Goal-leaning + high-both axes, defensive
- **Burdened Care** — Soul-leaning + high-both axes, defensive
- **Pressed Output** — Goal-axis only, defensive
- **Anxious Caring** — Soul-axis only, defensive

All preserve `legacyLabel` mapping for backward compatibility (e.g., Strained Integration → Giving / Presence). LLM prompts referring to legacy names continue to work via the alias.

**Calibration knob:** `HIGH_GRIP_THRESHOLD` — start at 35. Cohort review post-CC may suggest 30 or 40. Lower threshold = more users flagged "strained"; higher = label changes only for clearly-defensive cases.

Audit reports cohort distribution shift at 35; flags whether 30 or 40 might fit better.

### Segment C: Movement Strength descriptor recalibration

**Current descriptor bands (anchored on Potential):**

```ts
0-30:  "short"
30-60: "moderate"
60-85: "long"
85+:   "full"
```

**Proposed (anchored on Usable):**

```ts
0-30:  "short"
30-50: "moderate"
50-65: "long"
65-80: "high"
80+:   "high, well-governed"  // only at >=80 Usable AND Aim >=60 AND Grip <=30
```

Note: the "full" descriptor at Usable 80+ is reserved for shapes that genuinely have high movement *AND* governance *AND* low drag. A user at Usable 80 but Aim 50 with Grip 50 reads "high" — not "full." Full = the canonical 50° destination.

For cohort:
- Jason Usable 59.2 → "long" (was "long" on Potential 70.8 — no change for him)
- Cindy Usable 62.9 → "long" (was "full" on Potential 85.1 — meaningful demotion)
- Michele Usable 52.5 → "long" (was "long" on Potential 67.7 — small honest demotion)

The descriptor now reflects what the user can actually USE, not what they theoretically possess.

### Segment D: Trajectory chart adjustment

The chart's solid line currently emphasizes Potential. After this CC:

- **Potential line:** rendered in `var(--ink-faint)` (light/ghosted) as a reference
- **Usable line:** rendered in `var(--ink)` (dark/solid) as the primary
- **Length readout above the plot point:** *"Usable 59.2 of potential 70.8 (-16% drag)"*

This visually inverts the previous emphasis. The line you actually see is the usable one; the potential is context.

---

## Audit assertions (10 NEW)

In `tests/audit/momentumHonesty.audit.ts`:

1. **`movement-headline-is-usable-not-potential`** — rendered markdown contains "Usable" as the prominent Movement number, not "Movement Strength".
2. **`movement-descriptor-anchored-on-usable`** — for cohort fixtures, the descriptor ("short", "moderate", "long", "high", "high, well-governed") is computed from Usable Movement, not Potential.
3. **`high-grip-quadrant-relabels`** — for fixtures with high-both axes AND Grip ≥ HIGH_GRIP_THRESHOLD AND angle in 42-58° band, Quadrant label is "Strained Integration" (NOT "Giving / Presence"). Cindy fixture verifies.
4. **`grip-aware-quadrant-coverage`** — every new label (Strained Integration, Driven Output, Burdened Care, Pressed Output, Anxious Caring) appears in the `MovementQuadrantLabel` union and has a legacyLabel alias.
5. **`grip-threshold-calibration-reported`** — audit output reports cohort distribution at HIGH_GRIP_THRESHOLD = 30, 35, 40 so future calibration is informed.
6. **`movement-honesty-cindy-validates`** — Cindy fixture renders:
   - Quadrant: "Strained Integration" (was "Giving / Presence")
   - Movement descriptor: "long" (was "full")
   - Headline number: Usable 62.9 (not Potential 85.1)
7. **`movement-honesty-jason-validates`** — Jason fixture (low Grip 21):
   - Quadrant: "Goal-led Presence" (unchanged — Grip below threshold)
   - Movement descriptor: "long" (unchanged)
   - Headline number: Usable 59.2
8. **`movement-honesty-michele-validates`** — Michele fixture (Grip 35, near threshold):
   - Quadrant: "Anxious Caring" if HIGH_GRIP_THRESHOLD = 30, else "Love without Form" if =35 or =40. Report which lands.
   - Movement descriptor: "long" (Usable 52.5)
9. **`movement-honesty-chart-usable-is-primary`** — `lib/trajectoryChart.ts` renders Usable line in `var(--ink)`, Potential line in `var(--ink-faint)`.
10. **`movement-honesty-legacy-labels-preserved`** — every new Quadrant label has `legacyLabel` mapping to a Phase 3a label (Strained Integration → Giving / Presence, Driven Output → Goal-led Presence, etc.).

---

## Out-of-scope guardrails (DO NOT)

1. **Do NOT modify Goal/Soul/Aim/Grip/Movement Strength formulas.** Engine math stays as Phase 2 shipped them. Only labels and rendering change.
2. **Do NOT modify Risk Form letter logic.** Phase 3a's Open-Handed Aim / White-Knuckled Aim / Grip-Governed / Ungoverned Movement labels stay.
3. **Do NOT modify LLM system prompts or prose anchors.** Prose register stays as is; new Quadrant labels will surface to LLM via existing input contract if/when cohort regenerates.
4. **Do NOT modify the angle-band integration logic.** The 42-58° integration band stays as canonical per canon §2.
5. **Do NOT add Aim-aware Quadrant gating.** This CC adds Grip-aware gating only. Aim-aware refinement (e.g., "Wise-Governed Integration" if Aim ≥ 70 + Grip < 20) would be a follow-on CC if cohort review surfaces it.
6. **Do NOT modify `lib/movementLimiter.ts` formulas.** The drag and tolerance functions stay as Phase 2 shipped them. The other CC (CC-CHART-LABEL-LEGIBILITY-AND-TOLERANCE-SMOOTHING) handles the tolerance band smoothing.
7. **Do NOT bundle the chart label legibility fixes.** That's a separate CC.

---

## Verification checklist

- [ ] `npx tsc --noEmit` clean
- [ ] `npm run lint` clean
- [ ] `npx tsx tests/audit/momentumHonesty.audit.ts` — all 10 assertions pass
- [ ] All other existing audits remain green
- [ ] Visual check: Cindy, Jason, Michele renders show:
  - Usable as headline Movement number
  - Descriptor anchored on Usable
  - Cindy lands "Strained Integration" (not "Giving / Presence")
  - Trajectory chart's solid line is Usable, not Potential

---

## Report-back format

1. **Summary** — files modified, line-count delta, audit pass count.
2. **New MovementQuadrantLabel union paste** — confirm 12-label enumeration with legacy aliases.
3. **Grip-aware Quadrant logic paste** — show the updated `computeMovementQuadrant` function.
4. **Movement descriptor function paste** — show the recalibrated band logic.
5. **Cohort relabeling table** — for all 28+ fixtures: legacy Quadrant / new Quadrant / Movement descriptor old / new. Highlight any fixtures whose label changed.
6. **HIGH_GRIP_THRESHOLD calibration report** — cohort distribution at 30, 35, 40. Recommend which threshold to ship at V1.
7. **Cindy validation** — paste her fixture's new Quadrant label, new descriptor, and confirm chart shows Usable as primary line.
8. **Jason validation** — paste his fixture's new state. Confirm low-Grip means no relabel.
9. **Michele validation** — paste her fixture's new state. Note which threshold determines her label.
10. **Audit pass/fail breakdown** — every audit listed in the verification checklist.
11. **Out-of-scope verification** — confirm none of the 7 DO-NOT items were touched.

---

**Architectural test:** Cindy's render now reads honestly:
- *"Movement: Usable 62.9 / 100 (long) — Potential 85.1, -26% drag"*
- *"Quadrant: Strained Integration"*
- *"Risk Form: Grip-Governed (Aim 60, Grip 46)"*

The three labels now tell a coherent story: she's at the integration angle, but her movement is heavily drag-reduced and the grip is doing the work. *"Strained Integration"* names the pattern accurately — the integration is real, but it's strained. The Pauline-love precedent holds: pattern that looks like presence, driven by fear, the instrument reads both registers and labels them honestly.

Jason's render unchanged in substance (his Grip 21 is below threshold, so no relabel; his descriptors stay long). The CC adds honesty for the cohort where it's warranted without disturbing already-honest reads.
