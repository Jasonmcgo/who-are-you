# CC-166-INDIVIDUAL-RESTORE-BUNDLE-1

> Cowork-chat CC, 2026-05-24. Editorial bundle 1 from the Clarence review of
> the Individual report (Jason concurs). Restores the three "human mirrors"
> that the Individual outline dropped, plus the clear bug/heading fixes.
> SLOT the restored sections into the EXISTING 50° outline — do NOT reorder
> the whole report. Render-layer only; no engine math, no scoring change.

## Context (read before touching anything)

The Individual (user-mode) report is assembled by
`composeFiftyDegreeIndividual` in `lib/fiftyDegreeIndividual.ts`. It renders
the full **clinician Guide** markdown first (`guideMd`) and re-places its
prose into the 11-section "50° Life" outline via `extractV3Section(guideMd,
"## …")`. The Guide is unchanged by this CC.

KEY: the three "lost" sections still exist, fully composed and **per-user**,
in the Guide markdown:
- `## Your Top Gifts and Growth Edges`
- `## What Others May Experience`
- `## When the Load Gets Heavy`

So restoring them = `extractV3Section` them out of `guideMd`, compress, and
slot them into the Individual outline. Because they come from `guideMd`, they
stay **shape-aware** — they already say the right thing for each user. Do NOT
author new hardcoded prose for these (Clarence's example wording in the review
is Jason-specific; it is illustrative of LENGTH/TONE, not text to paste — the
content must come from the user's own guide section). This protects against
the shape-blind-routing class of bug.

Current Individual outline (`lib/fiftyDegreeIndividual.ts` section order):
1. How to Read This Report (~219)
2. {possessive} Trajectory (~255)
3. {possessive} Pattern (~277)
4. {possessive} Grip (~293)
5. Why This Is Happening — The Body Cards (~397)
6. Work, Love, and Giving (~437)
7. Disposition Signal Mix (~503)
8. Open Tensions Worth Watching (~521)
9. Keystone Reflection (~557)
10. Your Next Three Moves (~584)
11. Closing Read (~629)

## Changes — all in `lib/fiftyDegreeIndividual.ts` (+ helper imports)

### A. Restore the three mirrors (compressed, slotted, shape-aware)

Use the existing `extractV3Section(guideMd, "## <Heading>")` pattern (see
`composeKeystone` / `composePatternAndGrip` for the idiom — strip the heading
line, `.trim()`, guard for empty). For each, if the Guide section is missing/
empty, emit nothing (no stub).

1. **Top Gifts and Growth Edges** — slot **between Pattern (§3) and Grip
   (§4)**. Extract `## Your Top Gifts and Growth Edges` from `guideMd`; keep
   its existing table verbatim (it's already a compact per-user 3-row gift/
   distortion table). Heading in the Individual: `## Top Gifts and Growth
   Edges`. If the Guide emits surrounding prose around the table, keep only
   the table + at most one lead sentence.

2. **When the Load Gets Heavy** — slot **immediately after the Grip section
   (§4)**, since it makes Grip embodied. Extract `## When the Load Gets
   Heavy`; compress to its first paragraph (the embodied "what narrows under
   load" prose). Heading: `## When the Load Gets Heavy`.

3. **How Others May Experience You** — slot **after When-the-Load, before the
   Body Cards (§5)**. Extract `## What Others May Experience`; compress to one
   short paragraph. Heading: `## How Others May Experience You` (rename from
   the Guide's "What Others May Experience" — second person reads warmer).

Length discipline: each restored block is a few sentences (or the one table).
If a Guide section is long, take the lead paragraph only. Do not exceed the
length of the existing Work/Love/Giving section.

### B. "A possibility, not a verdict" near the top

The Guide header emits `*a possibility, not a verdict*` (renderMirror ~908)
but the Individual header doesn't carry it. Add it to the Individual report's
opening (just under the title / Executive Read lead), as the same italic line.
Sets the epistemic posture early.

### C. MBTI humility drawer

The Guide emits the surface-label note (`*Possible surface label: <CODE>…*`,
renderMirror ~944). Extract it and render it in the Individual as a collapsed
drawer (so it answers "what type am I?" without anchoring the report on a
code). Place it at the **end of the Pattern section (§3)**:

```md
<details>
<summary>If you use personality-type language</summary>

<extracted surface-label note, lightly reworded to: "This may resemble
{CODE}-patterning, but the report isn't built on type labels — the more
important read is the pattern above.">
</details>
```

Pull `{CODE}` from the extracted line; if the Guide emitted no surface label
(non-canonical stack), omit the drawer entirely.

### D. Disposition: add the 4-line read under the chart

`composeDispositionSignalMix` (~498) currently emits the heading + the
one-line `composeDispositionSummaryLine`. The Guide's clinician path emits a
fuller 4-line OCEAN interpretation (renderMirror ~261-296, clinician-gated).
Surface that 4-line read in the Individual, under the chart/summary line, so
the section "actually reads" instead of being a bare chart. Prefer extracting
the Guide's existing 4-line block (shape-aware) over authoring new text; if
it's only emitted in clinician scaffolding form, adapt that same content into
4 plain sentences. Keep it to ~4 lines.

### E. Move raw grip sub-signals into a drawer

The Trajectory (§2) / Grip area surfaces raw diagnostic bullets like
"Grips control under pressure", "Grips money / security under pressure",
"Grips reputation under pressure", "Proving-capability register present".
These read as accusatory/diagnostic in a public report. Replace the inline
list with a single composed summary line, and tuck the raw bullets behind a
drawer:

```md
**Pressure Pull:** {primary} — with {secondary} and {tertiary} pressure in the background.

<details>
<summary>View supporting signals</summary>

- <the raw sub-signal bullets, unchanged>
</details>
```

Locate where these bullets are emitted (they flow from the Trajectory `body`/
dashboard); compose the summary from the same underlying grip data.

### F. Bug fixes

1. **Duplicate Keystone quote.** `composeKeystone` (~534) extracts the Guide
   keystone and strips the `## Keystone Reflection` heading, but the belief
   quote ends up rendered **twice** (once as the belief echo, once left over
   from the extracted body). Dedupe: emit the belief blockquote exactly once,
   then the explanation, then stop. No second orphaned quote.

2. **Rename the Body Cards heading.** Line ~397:
   `## Why This Is Happening — The Body Cards`
   → `## Where the Pattern Shows Up — The Eight Body Cards`
   (the cards organize interpretive dimensions; they don't claim causation).

## Do NOT

- Reorder the whole report (Jason's call: slot in place only).
- Touch the clinician/Guide render path — the Guide must stay byte-identical
  to its baseline (`.cc145-before/jason-guide.md`). All edits live in the
  Individual composer (`fiftyDegreeIndividual.ts`) and any user-mode-only
  helper.
- Author new hardcoded section prose for the three mirrors or the disposition
  read — extract the per-user content from `guideMd` so it stays shape-aware.
  (Hardcoding Jason's "pattern-reader" language would reintroduce the
  shape-blind-routing bug.)
- Change engine math, scoring, grip taxonomy, Movement, or any numeric
  derivation.
- Touch the "ordinary" load line or add confidence-shading — those are
  Bundle 3 (the load line is also baked into the launch-polish-v3 cache and
  needs a coordinated regen; do NOT attempt it here).
- Re-bloat: every restoration is compressed, and the raw sub-signals + MBTI
  note live behind `<details>` drawers.
- Commit or push.

## Audit / acceptance

- `tsc --noEmit` clean; lint clean.
- `individualBodyCardsEnrichment.audit.ts`: the **Guide byte-identical**
  assertion must still pass (we don't touch the Guide). The Individual-
  structure assertions (body-card headers, charts present) must still pass;
  update only assertions that key on the renamed Body Cards heading
  ("Why This Is Happening" → "Where the Pattern Shows Up"). If any assertion
  hard-codes the old heading, update it.
- Render Jason's Individual locally and confirm: no duplicate Keystone quote;
  the three mirrors present and compressed; disposition has a 4-line read;
  raw grip sub-signals behind a drawer with a "Pressure Pull" summary; MBTI
  drawer present; "a possibility, not a verdict" near the top; Body Cards
  heading renamed.
- Full suite green at close (per "full suite after bundle").

## Report back

- Files modified.
- Jason's Individual markdown (or the changed sections) so I can eyeball the
  compression + that the restored prose is shape-aware (his actual content,
  not templated).
- Which audit assertions were updated and why.
- Audit results.

## Next (not this CC)

- Bundle 2 — prose-quality pass: de-template Body-Card Strength lines, shorten
  the trajectory interpretation ~40%, reduce "shape/register/read" density
  (LLM-layer / editorial-review work).
- Bundle 3 — the cache-baked "ordinary" load line + confidence-shading for
  thin signals (engine + cache regen).
