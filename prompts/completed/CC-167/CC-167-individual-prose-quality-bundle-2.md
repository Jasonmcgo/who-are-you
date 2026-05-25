# CC-167-INDIVIDUAL-PROSE-QUALITY-BUNDLE-2

> Cowork-chat CC, 2026-05-24. Editorial bundle 2 from the Clarence review:
> the prose-quality / humanization pass. This is the HARD bundle — parts of
> it touch engine prose that is LLM-cache-coupled and feeds the Guide, so it
> needs cache regen + baseline refresh + editorial review, not just edits.
>
> ⚠️ SEQUENCING: fire this ONLY AFTER CC-166 has landed. Both CCs edit
> `lib/fiftyDegreeIndividual.ts`; running them in parallel will collide.

## What Clarence flagged (and the engineering reality of each)

| Item | Where it lives | Coupling |
|---|---|---|
| Templated Body-Card "Strength" prose | `identityEngine.ts` `gift.text` (~4423/4426/5214-5215) | **Engine prose.** For Lens/Compass/Path it's the LLM splice-cache key → regen + Guide baseline refresh required. |
| Over-long trajectory interpretation | Guide `## Movement` prose, extracted in `composeTrajectory` | Touching the source changes the Guide; compressing in the Individual layer is safer. |
| "shape/register/read" overuse | Individual composer strings + engine templates | The Individual-composer strings are render-safe; engine templates are coupled. |

Because of the coupling, do this in two parts, **Part A first, verify, then
Part B**.

## Part A — render-safe (Individual composer only; no Guide/cache impact)

All in `lib/fiftyDegreeIndividual.ts`. Do NOT touch `identityEngine.ts`,
`renderMirror.ts` engine prose, or any `gift.text`/`*.text` source in Part A.

### A1. Reduce "shape / register / read" density ~25%

~27 occurrences across the Individual composer's own literal strings. Cut/
reword roughly a quarter of them — but ONLY in strings the Individual composer
itself authors (headings, connective prose, callouts). Do NOT edit words that
arrive via `extractV3Section`/`gift.text` (that's extracted engine content —
Part B territory). Prefer plain alternatives: "shape" → "you/your pattern"
where natural; "register" → drop or "mode"; "read" → "sense/see/picture" where
it's the composer's own connective tissue. Keep canonical lines intact (e.g.
"a possibility, not a verdict", the Grip "Grip asks…" line, the keystone).

### A2. Tighten the trajectory framing the COMPOSER adds

`composeTrajectory` emits the extracted `## Movement` `body` plus the composer's
own framing/`finalLine`. Tighten only the composer-authored connective prose
around the body (and any Individual-only lead-in) so the section reads less
abstract. Do NOT rewrite the extracted Movement `body` itself in Part A — that
edit belongs in Part B (it's Guide-coupled). If after A2 the section is still
carrying too many interpretive loads, that's the Part-B Movement rewrite's job;
flag it, don't force it here.

Part A acceptance: Guide byte-identical baseline UNCHANGED; no cache regen
needed; `tsc`/lint clean; Individual renders with lower jargon density.

## Part B — engine prose + cache-coupled (do after Part A verifies)

### B1. De-template the Body-Card "Strength" prose

Rewrite the templated stems in `identityEngine.ts` so Strength reads like a
person wrote it, NOT the engine talking to itself. Target stems:
- ~4423 `"{NP} shows up here:"`
- ~4426 `"In its native register, this card carries {NP_LOWER}:"`
- ~5214-5215 the Lens "your processing pattern leans toward {FUNCTION_VOICE}…
  native register… read the situation through… characteristic move" block.

Rewrite rules (this is the "engine-vs-human prose" canon — show the
conclusion, not the work):
- Keep it **shape-aware**: preserve the `{NP}`/`FUNCTION_VOICE[...]`
  interpolation so each card/function still says its own thing. Do NOT
  hardcode a single archetype's wording (Clarence's "You see structure
  forming before others have language for it" is Jason-specific — it's a
  TONE/LENGTH example, not text to paste).
- Kill the self-referential tells: "shows up here", "in its native register",
  "your processing pattern leans toward", saying the same thing three times.
- One or two vivid sentences per card. Lead with what the person DOES/SEES,
  then the in-health expression.

### B2. Shorten the Movement/trajectory interpretation ~40%

Tighten the `## Movement` prose at its composer (the source feeding
`composeTrajectory`'s `body`). Compress to the core: strong/goal-led movement,
the next growth isn't more output but making the people/cause/calling/sacred
value behind the work visible, framed as the shape's question. Keep the gold
lines; cut the fog. Stay shape-aware (drive from the user's actual Goal/Soul/
Movement, not Jason's numbers).

### B3. Required because B1/B2 change Guide + cache-keyed prose

- **Guide baseline refresh:** `.cc145-before/jason-guide.md` will change (the
  Guide consumes the same engine prose). Regenerate it after B1/B2 — same
  refresh pattern prior chart/prose CCs used. The byte-identical audit then
  re-greens against the new baseline.
- **Splice-cache regen:** Lens/Compass/Path `gift.text` is the LLM rewrite
  cache key. After B1, regenerate the affected cache entries in the canonical
  order (synthesis3 → proseRewrites → others) so the warm splice re-lands;
  otherwise those cards cold-fall-back to the new engine prose (acceptable but
  not the warm version). Report the regen cost.
- **Editorial review:** B1/B2 output must get a shape/register/hedge review
  across several cohort fixtures (not just Jason) before accept — confirm the
  rewrite reads human for caregiver/steward/builder shapes too, not just the
  architect register (guard against the archetype-bias leak).

## Do NOT

- Fire before CC-166 lands (file collision in `fiftyDegreeIndividual.ts`).
- Change engine MATH — only prose strings. Goal/Soul/Aim/Grip/Movement
  numbers, grip taxonomy, lens-stack derivation all unchanged.
- Touch the "ordinary" load line or add confidence-shading (that's Bundle 3).
- Reorder the report or change which sections appear (that was CC-166).
- Hardcode any single archetype's wording into shape-aware prose.
- Commit or push.

## Acceptance

- `tsc --noEmit` clean; lint clean.
- Part A: Guide baseline UNCHANGED; full suite green.
- Part B: Guide baseline refreshed (intended drift only); splice cache
  regenerated; `individualBodyCardsEnrichment` + the prose audits green;
  editorial review notes attached.
- Render Jason + 2-3 other cohort fixtures (e.g. Cindy/caregiver,
  Daniel/steward) and confirm the Strength lines read human and distinct
  per shape.

## Report back

- Files modified; which strings were de-jargoned (A1) vs rewritten (B1/B2).
- Before/after of 2-3 Body-Card Strength lines across different shapes.
- Cache regen cost + order; Guide baseline delta.
- Editorial-review notes (does it read human for non-architect shapes?).
- Audit results.

## Next (not this CC)

Bundle 3 — the cache-baked "ordinary" load line + confidence-shading for thin
signals (engine + coordinated cache regen).
