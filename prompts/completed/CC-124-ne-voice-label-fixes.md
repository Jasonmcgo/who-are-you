# CC-124 — Fix two Ne-dominant prose mislabels (Executive Read + pattern-in-motion)

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass.
Do not stop for confirmation between steps. On ambiguity, apply the
canon-faithful interpretation, proceed, and flag it. Permission bypass is
on; the discipline below is scope.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.

## Execution Directive

- One pass, no mid-task confirmation prompts.
- This fixes **prose/label text** for Ne-dominant shapes. It does NOT change
  type derivation, scoring, the cognitive stack, movement, or any signal —
  Lens/MBTI/movement outputs are unaffected. Only the words in two prose
  surfaces change, and only for Ne-dominant reads.

## Context

A re-cast cohort member (Michele) now reads correctly as Ne-dominant
(possibility-finder + inner compass), but her report carried two internal
inconsistencies that trace to mislabeled prose keyed to the Ne function:

1. **Executive Read** rendered *"Your gift is room-reading. Your danger is
   room-reading instead of saying."* — "room-reading" is the **Fe**
   (room-reader) descriptor, wrongly authored onto the **`ne`** row of
   `GIFT_DANGER_LINES`. Every other row is correct; only `ne` is wrong. So
   every Ne-dominant gets Fe language in the Executive Read.
2. **Lens "pattern-in-motion"** insight (`pattern_reader_vs_paralysis`) fires
   for "Dominant **Ni or Ne**" but hardcodes Ni's voice: *"The **pattern-reader**
   gift … the optimal **pattern** to land."* For an Ne lead it should say
   possibility-finder / options.

NOT a bug (do not touch): the "When the Load Gets Heavy" line naming the
**precedent-checker** surfacing in cruder form uses the *inferior* function;
for Ne-dominant (Ne-Fi-Te-**Si**) the inferior is Si = precedent-checker, which
is correct.

These are prose-only; they affect every Ne-dominant report (Michele is the
current cohort case).

## Read First (Required)

- `lib/identityEngine.ts:7763–7793` — `GIFT_DANGER_LINES` map (the `ne` row).
- `lib/identityEngine.ts:7414–7428` — the `pattern_reader_vs_paralysis`
  cross-pattern; note `prose: (_s, _tc, _tg, _ls, demographics) => …` already
  receives the lens stack (`_ls`) and `_ls.dominant` is used in `detection`.
- `lib/identityEngine.ts:8094` — confirm the Executive Read returns
  `Your gift is ${gd.gift}. Your danger is ${gd.danger}.` keyed to dominant.

## Tasks

### A. Fix the `ne` gift/danger text — `GIFT_DANGER_LINES` (~L7768)

Replace:

```ts
  ne: { gift: "room-reading", danger: "room-reading instead of saying" },
```

with:

```ts
  ne: {
    gift: "seeing what could become",
    danger: "seeing what could become instead of finishing it",
  },
```

Leave every other row unchanged.

### B. De-hardcode the pattern-in-motion voice (~L7424–7427)

Replace:

```ts
    prose: (_s, _tc, _tg, _ls, demographics) => {
      const subj = getUserName(demographics) ?? "You";
      return `The pattern-reader gift can produce paralysis when the patterns multiply faster than action. ${subj} may need to choose ground that's good enough rather than waiting for the optimal pattern to land.`;
    },
```

with:

```ts
    prose: (_s, _tc, _tg, ls, demographics) => {
      const subj = getUserName(demographics) ?? "You";
      const isNe = ls.dominant === "ne";
      const voice = isNe ? "possibility-finder" : "pattern-reader";
      const multiplying = isNe ? "options multiply" : "patterns multiply";
      const optimal = isNe ? "the optimal option to land" : "the optimal pattern to land";
      return `The ${voice} gift can produce paralysis when the ${multiplying} faster than action. ${subj} may need to choose ground that's good enough rather than waiting for ${optimal}.`;
    },
```

(Only the `prose` fn changes — the `_ls` param is renamed to `ls` and used.)

## Allowed to Modify (exhaustive)

- `lib/identityEngine.ts` — the `ne` row of `GIFT_DANGER_LINES`, and the
  `prose` function of the `pattern_reader_vs_paralysis` cross-pattern. Nothing
  else.

## Out of Scope

- All other `GIFT_DANGER_LINES` rows; the `description` metadata string on the
  cross-pattern (dev-facing, not rendered).
- The "cruder form" / inferior-function line (`:6808` / `:5157`) — correct as-is.
- Type derivation, scoring, cognitive stack, movement, signals. No question or
  fixture edits. No cache regen.
- The "possibility-driven caregiver" thesis descriptor — out of scope.

## Bash Commands Authorized

- `npx tsc --noEmit`
- The existing audit/test suite.

## Acceptance Criteria

1. The two edits applied exactly as above; no other lines touched.
2. `npx tsc --noEmit` clean (the `ls` param is now used, so no unused-var issue).
3. A re-render of an Ne-dominant fixture (e.g. `tests/fixtures/cohort-real/michele-real.json`)
   shows the Executive Read reading *"Your gift is seeing what could become.
   Your danger is seeing what could become instead of finishing it."* and the
   Lens pattern-in-motion reading "possibility-finder … options … optimal option."
4. A non-Ne fixture (any Ni-dominant) is **unchanged** in both surfaces.
5. Audit suite: structural assertions pass. If the byte-baseline snapshot is
   re-run and any Ne-dominant fixture's Executive Read / pattern-in-motion text
   differs, that diff is intentional (this CC); confirm it is confined to those
   two surfaces on Ne-dominant fixtures only.

## Report Back

- The two edits (line numbers), confirming only the `ne` row + the one `prose`
  fn changed.
- `tsc` result.
- Before/after of the Executive Read line and the pattern-in-motion line for an
  Ne-dominant fixture, and confirmation an Ni-dominant fixture is unchanged.
