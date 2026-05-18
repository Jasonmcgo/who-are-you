# CC-104-NEXT-MOVES-SHAPE-AWARE

> **Cowork-chat rewrite, 2026-05-17.** Source draft (Clarence-written) was
> filed in this same path; this rewrite corrects field names, file
> paths, grip-cluster keys, project conventions, and adds the
> guardrails required by AGENTS.md. The original intent and the three
> canonical registers (Load-Audit / Identity-Reframe / Build-Something)
> are preserved.

## Why this CC exists

The trajectory chart is now the canonical visual feedback engine: user
takes assessment → sees chart → releases grip → re-takes → Movement bar
grows. CC-103 anchors the chart at midpoint so movement is visible.
CC-101-VO-WIRING wired V/O into Aim/Grip/Movement.

The missing piece is the **release mechanism on the prose side.** The
report names which grip is gripping the user but doesn't tell them HOW
to release it. This CC closes that gap with a shape-aware "Next Moves"
prose layer routed by three registers.

## Launch Directive

Run as `claude --dangerously-skip-permissions` or after `/permissions →
bypass`. The project-level `.claude/settings.local.json` already sets
`defaultMode: "bypassPermissions"`.

## Execution Directive

Complete in a single pass. Do not pause for user confirmation. On
ambiguity, apply canon-faithful interpretation and flag in the
executor report. Auto-execute per
`feedback_cc_prompt_auto_execute` memory rule.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npx tsx tests/audit/<*>.audit.ts`
- `npx tsx tests/audit/twoTierBaseline.snapshot.ts` (baseline regen)
- `npx tsx tests/audit/handsCardBaseline.snapshot.ts` (baseline regen)
- `npm run audit:next-moves-shape-aware` (new script)
- `node -e '…'` for fixture inspection
- `git status`, `git diff` (read-only)
- `mv prompts/active/CC-104-NEXT-MOVES-SHAPE-AWARE.md
  prompts/completed/` on close

## Read First (Required)

- [AGENTS.md](AGENTS.md) — prompt discipline, question-bank ceiling
- [lib/types.ts](lib/types.ts) — `InnerConstitution`, `Answer` union,
  `VictimOwnerReading`, `GripPatternReading`
- [lib/victimOwnerAxis.ts](lib/victimOwnerAxis.ts) — V/O score bands
  (≤20 victim-anchored, 21–40 victim-leaning, 41–59 balanced, 60–79
  owner-leaning, 80+ owner-anchored)
- [lib/gripPattern.ts](lib/gripPattern.ts) — canonical `GripPatternKey`
  union: `safety | security | belonging | worth | recognition | control
  | purpose | unmapped`. Field name is `bucket`, NOT `cluster`.
- [lib/identityEngine.ts](lib/identityEngine.ts) — entry point
  `buildInnerConstitution`; this CC attaches a new field after V/O
  wiring (lines ~2334–2449)
- [lib/renderMirror.ts](lib/renderMirror.ts) — `renderMirrorAsMarkdown`
  is the single render entry; user-vs-clinician masking flows through
  the `renderMode` switch (set by CC-TWO-TIER-RENDER-SURFACE-CLEANUP).
  No separate `userModeMask.ts` exists in this codebase.
- [app/components/InnerConstitutionPage.tsx](app/components/InnerConstitutionPage.tsx)
  — React render; consumes whatever renderMirror emits. Render-side
  edits are NOT in scope this CC; if the markdown section renders,
  the React page surfaces it automatically.
- [data/questions.ts](data/questions.ts) — confirm Q-X1/Q-X2/Q-A1/Q-O2/
  Q-A2/Q-V1/Q-GS1/Q-I1/Q-Stakes1/Q-Ambition1 exist (all present as of
  the bank state at session start)

## The three registers (canonical)

### Register A — Load-Audit

**Diagnostic:** Owner trait under situational compression. The grip is
a load-response, not an identity.

**Release mechanism:** Audit the dependency portfolio, not the trait.
Shed one load → trait re-expresses → chart shows movement.

**Routes when** the user is anywhere on the V/O axis EXCEPT the
narrow identity-fusion corner Register B catches, AND there is either
state-load signal OR no Register-B/C trigger. **This is the safe
default** for compressed-shape readings; Register A receives the
fallback by design.

**Prose pattern:** "You already know who you are. The current pull
toward {grip publicLabel in plain English} isn't who you are — it's
what the load is asking you to become. Pick one place this week where
you {trait counter-move tied to Q-A2 + Compass-top}. The relationship/
outcome/system will survive. The {trait quality} will return."

### Register B — Identity-Reframe

**Diagnostic:** The grip has become identity-level. The user
**identifies as** the grip's promise, not just responds to load.

**Release mechanism:** Name the assumption, then disprove it once in
small. The grip is asking a question (am I worth? am I seen?); the
move is to answer it true.

**Routes when** the V/O reading is at an identity-fusion pole
(owner-anchored, score ≥ 80; OR victim-leaning/anchored, score < 40)
AND the grip bucket is `worth` or `recognition` AND state-load
composite < 0.5. The fusion-grip combination is what makes the grip
an *identity claim* rather than a *load response*.

**Prose pattern:** "The {grip publicLabel} isn't a habit — it's a
belief about who you are when the {grip publicLabel} isn't there.
That belief is testable. {Concrete small test tied to Q-V1 top +
Q-I1 belief text + Compass top}. Notice what's left when you stop
performing it."

### Register C — Build-Something-To-Hold

**Diagnostic:** No frame to release into. The hand is gripping air.

**Release mechanism:** Pick one anchor — a person, a daily practice,
a piece of work, a held value — and build toward it. Don't release
first; build first.

**Routes when** `coherenceReading.pathClass === "crisis"` OR
(`aimReading.score < 35` AND grip bucket ∈ {`control`, `purpose`}
AND no Register-B fusion-grip signature).

**Prose pattern:** "The grip you're feeling isn't tightness around
something — it's tightness around nothing. {Q-I1 belief text /
Compass top / Q-V1 `soul_beloved_named` value} is a candidate
anchor. The next move isn't to let go. It's to put your hand on one
thing this week and keep it there. Movement starts from the anchor,
not from the release."

## Routing function — canonical decision matrix

Add `lib/nextMovesRouter.ts`:

```ts
export type NextMovesRegister =
  | "load-audit"
  | "identity-reframe"
  | "build-something";

export interface NextMovesRouterInput {
  vo: { score: number };
  stateLoad: {
    composite: number;
    signals: {
      qx1: string | null;
      qx2: string | null;
      qa1: string | null;
      qo2Top: string | null;
    };
  };
  gripBucket: GripPatternKey;
  primalCoherence: "trajectory" | "crisis";
  aim: number | null;
}

export interface NextMovesRouterOutput {
  register: NextMovesRegister;
  confidence: "high" | "medium" | "low";
  reason: string;
}
```

Routing rules (first match wins):

1. **Register C — Build-Something** if
   `primalCoherence === "crisis"` OR
   (`aim !== null && aim < 35 && gripBucket ∈ {"control","purpose"}`).
2. **Register B — Identity-Reframe** if
   (`vo.score >= 80` OR `vo.score < 40`) AND
   `gripBucket ∈ {"worth","recognition"}` AND
   `stateLoad.composite < 0.5`.
3. **Register A — Load-Audit** (explicit) if
   `stateLoad.composite >= 0.4` AND
   `gripBucket ∈ {"belonging","security","control","recognition","safety"}`.
4. **Fallback → Register A — Load-Audit** (safe default for compressed
   shapes; `reason` must include "fallback").

### State-load composite (deterministic, 0–1)

Read Q-X1, Q-X2, Q-A1 (`ForcedFreeformAnswer.response`) and Q-O2
(`RankingAnswer.order[0]`). Sum the matching weights:

- Q-X1 response === `"Overwhelming or stretched"` → +0.30
- Q-X2 response === `"A lot"` → +0.25
- Q-A1 response === `"Reacting to demands"` → +0.25
- Q-O2 top ∈ {`"overwhelmed_functioning"`, `"anxious_reactivity"`} → +0.20

Composite clamps to [0, 1]. Default to 0 if any input is missing.

## Prose generator

Add `lib/nextMovesProse.ts`:

```ts
export interface NextMovesProse {
  paragraphs: string[]; // 1–3 short paragraphs
  oneSmallMove: string; // single retakable behavior, ≤ 30 words
  reMeasureCue: string; // names a Q-X / Q-A / Q-O2 / Q-V / Q-GS / Q-Ambition / Q-Compass id
  registerLabel: string;
}

export function buildNextMovesProse(constitution: InnerConstitution): {
  register: NextMovesRegister;
  prose: NextMovesProse;
  routing: NextMovesRouterOutput;
};
```

Per-register signal consumption (at least one user-specific signal must
appear in `oneSmallMove`):

- **Load-Audit** consumes: grip `bucket` publicLabel, Q-A2 response,
  Q-Stakes1 top, Compass top, Q-I1 freeform text.
- **Identity-Reframe** consumes: grip publicLabel, Q-V1 top, Q-GS1
  top, Q-I1 freeform text, Compass top.
- **Build-Something** consumes: Q-I1 freeform text, Compass top-2,
  Q-Ambition1 top, named beloved if Q-V1 top is `soul_beloved_named`.

If a signal is missing, fall back to a register-generic phrase that
does NOT mention the missing signal. Never emit a placeholder like
"{Q-I1}".

## Render integration

Wire through `lib/renderMirror.ts` only. Emit a markdown section
titled `### Next Moves` immediately after the Grip Pattern section
and before the Path section.

In **user mode**: paragraphs + `**One move this week:**` + oneSmallMove
+ `**Watch for change in:**` + reMeasureCue. No register label.

In **clinician mode**: same body PLUS `_Register: {registerLabel} —
{routing.reason}_` italic caption beneath the heading.

No new React component. The React page auto-surfaces new markdown.

## Files to create

- `lib/nextMovesRouter.ts` (new)
- `lib/nextMovesProse.ts` (new)
- `tests/audit/nextMovesShapeAware.audit.ts` (new)

## Files allowed to modify (exhaustive — nothing else)

- `lib/identityEngine.ts` — attach `constitution.nextMoves = ...`
  after V/O wiring.
- `lib/types.ts` — add `nextMoves?: ...` field to `InnerConstitution`.
- `lib/renderMirror.ts` — emit the new section.
- `package.json` — add `audit:next-moves-shape-aware` script.
- `tests/audit/twoTierBaseline.snapshot.json` — regenerate.
- `tests/audit/handsCardBaseline.snapshot.json` — regenerate.
- This prompt → `prompts/completed/`.

Anything not listed above is **forbidden**.

## Out of scope

- V/O composer math, weights, or wiring (CC-101 closed; consume only).
- Grip Pattern taxonomy / classifier.
- New questions / signals; 50-question ceiling holds.
- Chart, Movement bar, any visualization.
- LLM rewrites of Next Moves prose.
- Other card prose (Lens, Compass, Path, Hands, etc.).
- Wave 1 persistence (`lib/staleShape.ts`, `lib/llmRewritesBundle.ts`,
  `lib/sessionLlmBundleStore.ts`, `lib/*LlmServer.ts`).
- React component files. Markdown flows through automatically.
- Time-banded language variants. Default "this week".
- Cohort fixture demographics-format bug (pre-existing; audit passes
  `null` for demographics on cohort-real fixtures).

## Audit — `audit:next-moves-shape-aware`

Add `tests/audit/nextMovesShapeAware.audit.ts`. Assertions:

1. `router-jason-routes-to-identity-reframe`
2. `router-harry-routes-to-load-audit` (cohort-real, null demo)
3. `router-michele-routes-to-load-audit` (fallback acceptable; reason
   must say "fallback")
4. `router-synthetic-crisis-routes-to-build-something`
5. `router-synthetic-low-aim-control-grip-routes-to-build-something`
6. `prose-one-small-move-references-user-signal` — Jason: Compass-top
   OR Q-V1 OR Q-I1 substring; Harry: Q-A2 OR Compass-top substring
7. `prose-re-measure-cue-names-question-id`
8. `prose-no-engine-vocabulary-leak` — zero occurrences of "V/O",
   "compressed owner", "load-audit", "identity-reframe",
   "build-something", "primal-coherence", "GSAG", "stateLoad",
   "victim_owner" in user-visible prose
9. `render-section-emits-after-grip-before-path`
10. `render-clinician-mode-includes-register-caption`
11. `render-user-mode-omits-register-caption`
12. `engine-math-unchanged-jason-anchor` — Goal=92 Soul=59 Aim=64.9
    Grip=26.3 Movement=77.28195132112025 byte-identical

Pass criteria: 12/12 green.

## Acceptance criteria

1. `npx tsc --noEmit` clean
2. `npm run lint` clean (allow pre-existing warning)
3. `npm run audit:next-moves-shape-aware` exits 0 with 12/12 PASS
4. `twoTierRenderSurfaceCleanup` + `handsCard` audits PASS after
   baseline regen
5. CC-097 / CC-103 / momentumHonesty / trajectoryChart / aimRebuild
   remain green
6. `audit:victim-owner-axis` and `audit:victim-owner-wiring` remain
   green
7. Jason engine math byte-identical pre/post-CC
8. Zero edits outside "Files allowed to modify"
9. Zero LLM calls / cache edits / commits / pushes
10. Pre-existing failing audits (`gripTaxonomyReplacement`,
    `phase3aLabels`) remain failing-in-same-way

## Report Back

1. **Routing table** — register + confidence + reason for jason,
   daniel, harry, cindy, michele, kevin, ashley (cohort-real with
   null demo) and ocean/07-jason
2. **Prose excerpt** — one oneSmallMove sample per register
3. **Baseline drift summary**
4. **Side-effects log** — any file touched outside allowed list
5. **Pre-existing failure status**
