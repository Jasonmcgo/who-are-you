# CODEX-086 — Label Discipline (Clarence Verdict 2026-05-07)

**Origin:** Clarence's verdict on the post-CC-Q1/Q2/Q3 report (2026-05-07). The expanded-question model is "earning its keep" — Goal/Soul accuracy, Gripping Pull honesty, OCEAN integration, Movement prose all improved. Remaining work is **label discipline**: surface-prose tuning so the rendered numbers don't mislead the reader. Five surgical edits, no new signals, no architecture changes, no math changes.

**Scope frame:** Pure prose / display-label surface work. Two files primary (`lib/oceanDashboard.ts`, `lib/goalSoulMovement.ts`), one React mirror (`app/components/InnerConstitutionPage.tsx`) if the React render path duplicates any of the touched strings. Regression-only audit. Mechanical CODEX, not architectural CC.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Execution Directive

Single pass. Five surgical edits per the §"Allowed to Modify" list below. Read each existing call site once before editing to confirm exact text. Keep all math, signal wiring, and band thresholds untouched — this CODEX only edits user-facing strings.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run audit:goal-soul-give`
- `npm run audit:ocean`
- `git status`, `git diff`
- `node`, `npx tsx`
- `cat`, `grep`, `find`

## Read First (Required)

1. `lib/oceanDashboard.ts` — full file. `DISPOSITION_SIGNAL_MIX_DISCLAIMER`, `BAND_INTERPRETATION.E["moderate-high"]`, `renderOceanDashboardSVG` value-label composition, `composeTraitParagraph`.
2. `lib/goalSoulMovement.ts` — full file. Productive-NE band template, quadrant-label render path.
3. `lib/goalSoulGive.ts` — `quadrant` field producer. Confirm where the user-facing quadrant string is composed (Closing Read / Movement section).
4. `app/components/InnerConstitutionPage.tsx` — Movement and Disposition Signal Mix sections (CODEX-073 / CODEX-074 land sites). Mirror any string changes the markdown render makes.
5. `tests/audit/oceanDashboard.audit.ts` and `tests/audit/goalSoulGive.audit.ts` — for the assertion scaffold.

## Allowed to Modify

### 1. Movement quadrant relabel — "Early Giving / Goal-leaning"

**File:** `lib/goalSoulMovement.ts` (and mirror in React render).

**Rule:** When `quadrant === "give"` AND `angle ∈ [20°, 44°]` (productive-NE band per spec §13.5b), the displayed quadrant label is **"Early Giving / Goal-leaning"** instead of "Giving".

When `quadrant === "give"` AND `angle ∈ [45°, 54°]` (balanced band), display stays **"Giving"** (unmodified — this is the canonical balanced register).

When `quadrant === "give"` AND `angle ∈ [55°, 79°]` — out of scope for this CODEX (§13.5c symmetric band is TBD canon per the project memory). Leave existing display behavior; do not add a Soul-leaning mirror label without canon.

All other quadrants render their existing labels unchanged.

**Implementation:** add an exported helper `composeQuadrantDisplayLabel(quadrant, angle)` in `lib/goalSoulMovement.ts` that takes the engine quadrant value + angle and returns the display string. Use it everywhere the quadrant label renders to the user (Movement section, Closing Read references if any).

### 2. Disposition Signal Mix disclaimer — replace stale "relative weight" language

**File:** `lib/oceanDashboard.ts`.

Replace the `DISPOSITION_SIGNAL_MIX_DISCLAIMER` constant verbatim with Clarence's wording:

> These describe independent disposition intensities detected by the instrument across this assessment. They are not percentile scores against a population, and they are not slices of a 100% pie.

Remove the existing "relative weight of disposition signals" phrasing entirely. The phrase "relative weight" must not appear anywhere in the OCEAN render path after this CODEX.

### 3. Extraversion moderate-high band template — role-based qualifier

**File:** `lib/oceanDashboard.ts`.

Replace `BAND_INTERPRETATION.E["moderate-high"]` verbatim with Clarence's wording:

> the outward-energy register is active in a situational, role-based way — interior movement can find external form when there is a mission, audience, or structure. This should not be overread as constant social appetite or easy emotional broadcast

Keep `BAND_INTERPRETATION.E.high` and the existing CC-077 `moderate` template untouched. The phrase "interior movement tends to find external form" appears in both `moderate-high` and `high` currently — this edit removes it from `moderate-high` only; the `high` band keeps it.

### 4. Agreeableness high-band subtype label — "moral-concern dominant"

**File:** `lib/oceanDashboard.ts`.

When `bucket === "A"` AND `intensity ≥ 80`, the value-label string in both render surfaces (SVG bar chart `valueLabel` and any trait-paragraph band reference) renders as:

> `${intensity} · ${band}, moral-concern dominant`

Example: `"96 · high, moral-concern dominant"`.

For intensity < 80, the label renders unchanged (`"${intensity} · ${band}"`).

Implementation: add a small helper `composeOceanValueLabel(bucket, intensity, band, isProxyER)` next to the existing render code. Return `"low/under-detected"` when `isProxyER` (preserves existing behavior); otherwise return the bucket-and-intensity-aware composed string. Use it in `renderOceanDashboardSVG` where `valueLabel` is currently composed.

The threshold `80` matches the existing `agreeablenessCareWithSpineClose` gate. Both fire together — keeping the gate aligned avoids a label/prose mismatch.

### 5. Movement prose — productive-NE band "lengthen vs steepen" sentence

**File:** `lib/goalSoulMovement.ts`.

In the productive-NE-band prose template, add Clarence's verbatim sentence after the practice-selection line, with the angle interpolated from the actual computed angle:

> At ${angle}°, the next movement is not mainly to lengthen the line through more output; it is to steepen the line by making the beloved object more visible — the people, cause, calling, or sacred value the structure is meant to serve.

Round the angle to the nearest integer for display (e.g., `31°`, not `31.4°`).

Place this sentence between the existing practice line ("Convert structure into mercy…") and the existing closer ("The next move is rarely more output…"). Both existing sentences stay verbatim.

### 6. React mirror

**File:** `app/components/InnerConstitutionPage.tsx`.

Mirror all string changes that flow through the markdown render into the React JSX render path:
- Quadrant display label (uses `composeQuadrantDisplayLabel`).
- Disclaimer constant (re-export or import from `lib/oceanDashboard.ts`).
- Band-interpretation prose (already sourced from `BAND_INTERPRETATION` — should propagate automatically; verify).
- Value-label string (uses `composeOceanValueLabel`).
- Movement prose (already sourced from `composeMovementProse` or equivalent — should propagate automatically; verify).

If the React path duplicates any of the strings rather than importing them, refactor to import from `lib/` so both renders stay in sync. Do NOT inline-edit the React strings in two places.

### 7. Audit assertions

**Files:** `tests/audit/oceanDashboard.audit.ts`, `tests/audit/goalSoulGive.audit.ts`.

Add the following assertions (CODEX-086 block):

**oceanDashboard.audit.ts:**
- `disclaimer-no-relative-weight`: `DISPOSITION_SIGNAL_MIX_DISCLAIMER` does NOT contain the substring `"relative weight"`.
- `disclaimer-says-independent`: `DISPOSITION_SIGNAL_MIX_DISCLAIMER` contains `"independent disposition intensities"`.
- `e-moderate-high-role-based`: `BAND_INTERPRETATION.E["moderate-high"]` contains `"situational"` and `"role-based"`; does NOT contain the standalone phrase `"interior movement tends to find external form"`.
- `a-high-subtype-label`: For any fixture where `intensities.agreeableness >= 80`, the rendered SVG output contains `"moral-concern dominant"`.
- `a-low-no-subtype-label`: For any fixture where `intensities.agreeableness < 80`, the rendered SVG output does NOT contain `"moral-concern dominant"`.

**goalSoulGive.audit.ts:**
- `early-giving-label-productive-ne`: For fixtures where `quadrant === "give"` AND angle ∈ [20°, 44°], the displayed quadrant label is `"Early Giving / Goal-leaning"`. (Specifically: fixture `12-productive-ne-default-pair` if it lands in this band, or any fixture that does.)
- `giving-label-balanced-band`: For fixtures where `quadrant === "give"` AND angle ∈ [45°, 54°], the displayed quadrant label is `"Giving"` (unmodified).
- `steepen-sentence-productive-ne`: For fixtures in productive-NE band, the Movement prose contains the substring `"steepen the line"` and `"beloved object more visible"`. The angle interpolation renders as an integer (regex `/At \d+°,/`).
- `no-steepen-sentence-outside-band`: For fixtures NOT in productive-NE band, the Movement prose does NOT contain `"steepen the line"`.

## Out of Scope (Do Not)

1. **Do NOT modify any band threshold values.** §13.5b angle bands (0°–19° / 20°–44° / 45°–54° / 55°–79° / 80°–90°) and the OCEAN intensity thresholds (CC-075 / CC-077 calibration) are canon. This CODEX consumes them, does not retune them.
2. **Do NOT add a §13.5c symmetric Soul-leaning label.** The 55°–79° band canon is TBD per project memory; do not invent "Early Giving / Soul-leaning" without canon. Leave existing rendering behavior in that band.
3. **Do NOT modify any signal wiring, intensity math, or composite computation.** Pure surface-prose edits.
4. **Do NOT modify any other OCEAN BAND_INTERPRETATION templates** — only `E["moderate-high"]`. Leave O / C / A / N templates untouched, plus E `under-detected` / `low` / `moderate` / `high` untouched.
5. **Do NOT modify the practice-selection logic** in `goalSoulMovement.ts`. The five canonical Soul-lift practices (CC-079 canon) stay untouched. The new sentence is additive.
6. **Do NOT modify the agreeablenessDisambiguation or agreeablenessCareWithSpineClose templates.** Those are CC-077 canon and stay verbatim. The "moral-concern dominant" subtype label is a separate display-label edit on the band-string, not a prose change.
7. **Do NOT modify other-quadrant labels** (gripping / striving / longing / neutral). Only the "give" quadrant gets the band-aware sub-label.
8. **Do NOT add any new signals or extend `SignalId`.**
9. **Do NOT modify** `MEMORY.md`, `AGENTS.md`, `docs/canon/`, or any spec memo. Spec drift documented in Report Back §6 if any.
10. **Do NOT install dependencies.**

## Acceptance Criteria

1. The five label-discipline edits land verbatim per §"Allowed to Modify" 1–5.
2. React mirror path renders the same updated strings (§6).
3. Eight new audit assertions pass (§7); existing assertions continue to pass (regression).
4. `DISPOSITION_SIGNAL_MIX_DISCLAIMER` no longer contains "relative weight".
5. Jason real-session fixture (the productive-NE case): quadrant displays as "Early Giving / Goal-leaning"; Movement prose contains the steepen sentence; A label includes "moral-concern dominant".
6. Fixtures where A < 80: rendered SVG does NOT include "moral-concern dominant".
7. Fixtures outside productive-NE band: Movement prose does NOT include "steepen the line".
8. `npx tsc --noEmit` exits 0.
9. `npm run lint` exits 0.
10. `npm run audit:ocean` exits 0.
11. `npm run audit:goal-soul-give` exits 0.
12. `git status --short` shows only Allowed-to-Modify files.

## Report Back

1. Summary in 4–6 sentences.
2. The five edits' new text verbatim as committed (or pointer to the constants/templates).
3. Per-fixture display impact: for the productive-NE fixtures, show the old vs new quadrant label, the steepen-sentence inclusion, and (if A ≥ 80) the new value-label string. For at least one A-low fixture, confirm the label stays unmodified.
4. Audit pass/fail breakdown including the eight new assertions.
5. React parity check: confirm InnerConstitutionPage renders the same updated strings (single source of truth confirmed, no string duplication).
6. Spec ↔ code drift report (e.g., if §13.5b in `docs/goal-soul-give-spec.md` does not yet name the "Early Giving / Goal-leaning" label, flag for a future spec-sync CODEX).
7. Out-of-scope verification.
