# CODEX-CC-105-FINALIZE

> Cowork-chat informal CODEX, 2026-05-18.
> Closes the baseline + audit gap left by CC-105's substantive close.
> Per `feedback_codex_llm_editorial_review.md`: if cache regen is
> triggered, editorial review is required before declaring complete.

## Why this CODEX exists

CC-105 substantively closed with 16 audits green and the chart +
Soul-trim changes shipped. Two finishing steps were deferred:

1. Baseline snapshot regeneration (chart SVG bytes shifted; baselines
   will drift on next audit run).
2. Full audit suite execution to confirm 77/77 (or whatever current
   count is) green.

This CODEX handles both, plus any cache regen the audit run reveals
as needed.

## Step sequence

### Step 1 — Regenerate baseline snapshots

```bash
npx tsx tests/audit/twoTierBaseline.snapshot.ts
npx tsx tests/audit/handsCardBaseline.snapshot.ts
```

If those entry points don't work, find the corresponding regen
scripts via:

```bash
grep -rn "snapshot.*regen\|baseline.*regen\|writeFileSync.*Baseline.snapshot.json" tests/audit/ scripts/ package.json
```

Run whatever generates the snapshot JSON files. Expected: both
snapshot files updated (chart SVG section bytes shift across all 24
fixtures).

### Step 2 — Run the full audit suite

Run every audit in `tests/audit/`. Report total green/red count.

If any audit reports unexpected reds (beyond the two baseline files
just regenerated), classify each per `feedback_full_suite_after_bundle.md`
discipline:

- **Baseline drift** (snapshot stale due to CC-105 byte shifts) →
  fixable by regenerating the relevant baseline.
- **Cache miss** (section body hash changed; LLM rewrite cache no
  longer covers a fixture) → fixable by running buildProseRewrites
  (and others, in canonical order per `feedback_cache_regen_ordering.md`).
- **Real behavior regression** (CC-105 broke something) → STOP and
  flag for triage.

### Step 3 — If LLM cache regen is required

Per `feedback_cache_regen_ordering.md`, run scripts in dependency
order:

```bash
npx tsx scripts/buildSynthesis3.ts
npx tsx scripts/buildProseRewrites.ts
npx tsx scripts/buildKeystoneRewrites.ts
npx tsx scripts/buildGripTaxonomy.ts
npx tsx scripts/buildLaunchPolishV3.ts
```

Expected cost: $1-3 LLM (only fixtures with shifted Soul scores will
regenerate — Michele, Ashley, possibly Jason; the 4 still-saturated
fixtures' engine bodies may not shift since their Soul stayed at 100).

### Step 4 — Editorial review (if Step 3 ran)

REQUIRED per `feedback_codex_llm_editorial_review.md`. Read each
newly-generated entry and report:

- Hedge count (target: ≤3)
- Shape-routing leak check (architect-coded vocabulary should NOT
  appear in cindyType / danielType / unmapped non-architect entries;
  the CC-105-introduced shape-aware prompt amendment for those
  archetypes should hold)
- Voice consistency with prior renderings of the same archetype

Report first 2-3 sentences of each new entry in the response.

### Step 5 — Re-run full audit suite

Confirm:
- Full audit count: target 77/77 (or current expected count) green
- `npx tsc --noEmit` clean
- `npm run lint` clean (pre-existing `PathExpanded.tsx` warning OK)

### Step 6 — Engine math byte-identical confirmation

Run engine output for canonical Jason fixture
(`tests/fixtures/ocean/07-jason-real-session.json`) and report:
- Goal
- Soul (will differ from pre-CC-105 — expected, this is the trim)
- Aim
- Grip
- Movement Potential
- Movement Usable
- Direction angle

Compare against CC-105's Phase 2 expected sanity check: Jason Soul
≈ 75 (down from ~79). Everything else should be byte-identical.

## Allowed to modify

- `tests/audit/twoTierBaseline.snapshot.json`
- `tests/audit/handsCardBaseline.snapshot.json`
- Any other `tests/audit/*.snapshot.json` that drifts
- `lib/cache/*.json` (only if Step 3 fires)

## Do NOT

- Modify engine code (V/O, Goal/Soul, Aim, Grip, Movement, Quadrant,
  Risk Form, Next Moves).
- Modify chart geometry code (Phase 1 closed).
- Modify Soul direct bonuses (Phase 2 closed; further trim is CC-106).
- Modify any audit assertion files (CC-105 already updated the
  affected assertions).
- Make commits or push.
- Skip editorial review if Step 3 fires.

## Expected runtime

~20-30 min:
- Step 1 (baselines): ~5 min
- Step 2 (full audit): ~5 min
- Step 3 (cache regen, IF needed): ~10 min + ~$1-3 LLM
- Step 4 (editorial review, IF Step 3 ran): ~5 min
- Step 5 (full audit re-run): ~5 min

## Cost budget

$0 if no cache regen needed. ~$1-3 if cache regen fires. Stop and
flag if cost exceeds $5.

## Report back

- Step 1: baseline files regenerated, byte sizes before/after.
- Step 2: full audit count, list any unexpected reds with
  classification.
- Step 3: cache regen runs (script, runtime, generated count), or
  "not needed" if no cache reds.
- Step 4: editorial review notes (per newly-generated entry).
- Step 5: final full audit count.
- Step 6: Jason engine math values.
- Total LLM cost observed.

## Next after this closes green

Cowork-chat handles commit + push of CC-105 + this CODEX's outputs
as one bundle. Then deploy verification on prod renders, then fire
CODEX-LLM-LIVE-SESSION-COVERAGE for Jason's session backfill.
