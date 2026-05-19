# CC-107-PREAMBLE-USER-MODE-SUPPRESSION

> Cowork-chat authored 2026-05-18. Surgical user-mode suppression of
> three pre-Executive-Read preamble passages that currently leak
> engine-internal vocabulary and borrowed-system labels into the
> user-facing report. Clinician mode preserves everything verbatim.
>
> **Why now:** Vistage cohort users are landing on the live report.
> Every new user is currently reading three paragraphs of clinician-
> register preamble before reaching the Executive Read where the
> warmth starts. Per the two-tier render canon
> (`feedback_two_tier_render_canon.md`), borrowed-system labels and
> engine-internal vocabulary suppress in user view. Today's user-mode
> mask doesn't catch this preamble class.
>
> **Why standalone (not bundled into CC-106):** Cohort users are
> arriving now; CC-106's cache regen wall-time delays its ship. This
> CC is pure deterministic mask logic (no LLM regen, no cache
> invalidation) and can deploy independently within the hour.

## Why this CC exists

Jason reviewed Harry's rendered report against what the user actually
sees and flagged three passages for user-mode suppression:

1. **Function-voice opening line.** Source: `lib/identityEngine.ts:6808`
   composes `Yours is a shape led by ${FUNCTION_VOICE[dom]}, supported
   by ${FUNCTION_VOICE[aux]} — one that ${valueClause}${gravityClause}.`
   The `FUNCTION_VOICE` map (defined ~line 3389) is the user-facing
   translation of Jungian function names (Si → "the precedent-checker",
   Fe → "the room-reader", Ni → "the pattern-reader", etc.). These are
   engine-internal cognitive-function vocabulary in user clothing —
   they still describe Jungian dynamics in a register the cohort
   reader has no frame for. Belongs in clinician view; suppress in
   user view.

2. **Allocation-disclaimer line.** Source: `lib/identityEngine.ts:6886`
   emits the static line: *"You can claim what you haven't yet
   allocated toward — and the gap between what you name and what your
   week actually pays for is part of your shape, not a verdict against
   it."* Meta-philosophical disclaimer. Belongs in clinician view;
   suppress in user view.

3. **MBTI disclosure line.** Source: `lib/renderMirror.ts:770` emits:
   *"Possible surface label: ISFJ. Type labels are surface descriptions
   only — your shape is not reducible to a four-letter code. The Lens
   reading above is the actual interpretation."* Architecturally
   surprising: this line is currently *explicitly protected* from
   suppression via `isProtectedLine` (`renderMirror.ts:498`), so even
   though the 4-letter MBTI code IS in `STRIP_PATTERNS`, the
   protected-line check exits early before the strip runs. That
   protection contradicts the two-tier canon. The React component
   (`MbtiDisclosure.tsx`) already requires explicit clinician mode to
   render — the markdown path needs the same gate.

**Effect on user-facing reading order, before and after:**

Before:
```
The Inner Constitution
a possibility, not a verdict

Yours is a shape led by the precedent-checker, supported by the room-reader...
You can claim what you haven't yet allocated toward...
Possible surface label: ISFJ. Type labels are surface descriptions only...

Executive Read
Your gift is...
```

After (user mode):
```
The Inner Constitution
a possibility, not a verdict

Executive Read
Your gift is...
```

After (clinician mode): unchanged — all three preamble lines preserved.

## The three edits

All in `lib/renderMirror.ts` (single-file change keeps blast radius
minimal). No edits to `lib/identityEngine.ts` — the engine continues
to emit these lines; the mask suppresses them in user mode.

### Edit 1 — Add `PREAMBLE_USER_SUPPRESS_PATTERNS` array

Add a new constant near the existing `STRIP_PATTERNS` declaration
(~line 460):

```ts
// CC-107 — Pre-Executive-Read preamble suppression in user mode.
// Each pattern matches a WHOLE LINE (anchored). The mask removes the
// matched line entirely (not just the matched substring) — these are
// preamble paragraphs that should disappear, not be hollowed-out.
// Clinician mode preserves all three; they remain part of the
// downloaded clinician artifact.
const PREAMBLE_USER_SUPPRESS_PATTERNS: RegExp[] = [
  // The function-voice opening composed at identityEngine.ts:6808.
  // FUNCTION_VOICE values: "the precedent-checker", "the room-reader",
  // "the pattern-reader", "the framework-builder", "the now-mover",
  // "the meaning-keeper", "the value-anchor", "the logic-checker".
  // Match on the structural prefix — any value substitution lands here.
  /^Yours is a shape led by .+ supported by .+ — one that .+\.$/,
  // Allocation disclaimer at identityEngine.ts:6886.
  /^You can claim what you haven't yet allocated toward .+\.$/,
];
```

### Edit 2 — Remove the MBTI-line protection exemption

In `isProtectedLine` (~line 496-518), DELETE these two lines:

```ts
  // Possible surface label disclaimer — masthead's allowed-MBTI line.
  if (line.includes("Possible surface label")) return true;
```

Why: with the exemption removed, `STRIP_PATTERNS`' existing
`/\b(INTJ|INTP|...|ESFP)\b/g` will catch the 4-letter code on the
line. But the line still reads "Possible surface label: . Type
labels..." with the code stripped, which is worse than no line. Edit
3 below removes the whole line cleanly in user mode.

### Edit 3 — Add MBTI-line whole-line suppression

Extend the `PREAMBLE_USER_SUPPRESS_PATTERNS` array (Edit 1) with:

```ts
  // MBTI disclosure line emitted at renderMirror.ts:770. Whole-line
  // suppression in user mode — the React surface MbtiDisclosure.tsx
  // already gates this to clinician mode; the markdown path needs the
  // same gate.
  /^\*Possible surface label: .+\.\*$/,
```

(Note the surrounding `*…*` — the markdown emits this line as italics.)

### Edit 4 — Wire the new patterns into `applyUserModeMask`

In `applyUserModeMask` (~line 554), inside the per-line loop, BEFORE
the `STRIP_PATTERNS` application, add:

```ts
    // CC-107 — Preamble line suppression (user mode only). If any
    // preamble pattern matches the whole trimmed line, skip emission
    // entirely. Runs before STRIP_PATTERNS so the line is gone before
    // substring strips would have a chance to hollow it out.
    let suppressedAsPreamble = false;
    for (const re of PREAMBLE_USER_SUPPRESS_PATTERNS) {
      if (re.test(s.trim())) {
        suppressedAsPreamble = true;
        break;
      }
    }
    if (suppressedAsPreamble) continue;
```

The `continue` skips both the push to `out` AND the trailing
substring-rewrite passes — the line is gone, not hollowed.

## Acceptance criteria

1. **TypeScript clean:** `npx tsc --noEmit` passes.

2. **User-mode render of three cohort fixtures** (Jason / Cindy /
   Daniel) via the existing markdown test path:
   - Does NOT contain "led by the precedent-checker" / "led by the
     pattern-reader" / "led by the room-reader" / any of the 8
     `FUNCTION_VOICE` openings.
   - Does NOT contain "You can claim what you haven't yet allocated".
   - Does NOT contain "Possible surface label:" (exact substring).
   - DOES contain everything else — Executive Read, Core Pattern,
     Movement panel, body cards, etc. — byte-identical to pre-CC-107
     baseline EXCEPT for the three suppressed lines.

3. **Clinician-mode render of the same three fixtures:**
   - DOES contain all three preamble lines, verbatim.
   - Otherwise byte-identical to pre-CC-107 baseline (no regression
     in clinician artifact).

4. **Full audit suite green.** `npm test` or equivalent. Per
   `feedback_full_suite_after_bundle.md`: per-CC audits green ≠
   bundle audits green — run the whole suite and report any reds.
   The `twoTierRenderSurfaceCleanup` audit already exists and exercises
   the user/clinician split; it should remain green or, if it asserts
   "user-mode includes 'Possible surface label'", it needs updating to
   match the new canon (flag if so, don't auto-update).

5. **No LLM regen required.** No cache files touched. No
   `engineHash` change. The mask runs at render time downstream of all
   composition.

## What this CC does NOT do

- Does NOT modify `lib/identityEngine.ts` (engine continues to emit
  the lines; mask suppresses them in user mode only).
- Does NOT modify `app/components/MbtiDisclosure.tsx` (already
  gating correctly on `renderMode`).
- Does NOT modify the FUNCTION_VOICE map or any cognitive-function
  vocabulary — those stay live in clinician mode.
- Does NOT change masthead, Executive Read, Core Signal Map, body
  cards, Movement panel, Grip section, or any post-preamble section.
- Does NOT regenerate any LLM cache. No prompt changes; engine
  output bytes only change in the user-mode-masked surface.
- Does NOT bundle in CC-106's progressive-disclosure work. CC-106
  and CC-107 are independent and can deploy in either order.

## Notes for the executor

- Total executor time estimate: ~20 minutes including the audit run.
  Per `feedback_cc_time_estimates_5x_too_high.md`, reject any estimate
  above 45 minutes as overshoot.
- The regex anchors (`^` and `$`) are essential. Without anchors a
  partial match would suppress lines that happen to contain the
  phrase, including the keystone reflection's *"The gap between what
  you name and what your week actually pays for is part of your shape,
  not a verdict against it"* which appears verbatim inside Compass
  cross-signal templates at `identityEngine.ts:1961, 1965`. The
  anchored pattern (`^You can claim what you haven't yet allocated
  toward .+\.$`) only matches the preamble's own line, not the
  identical phrase used as part of a longer sentence elsewhere.
- If a future CC adds new preamble paragraphs, extend
  `PREAMBLE_USER_SUPPRESS_PATTERNS` — same shape, anchored, whole-
  line. This is the canonical surface for user-mode preamble
  suppression going forward.
- Per `feedback_sandbox_git_lockfile.md`: any commit command handed
  to Jason should prepend `rm -f .git/index.lock`.
