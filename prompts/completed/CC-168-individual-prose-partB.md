# CC-168-INDIVIDUAL-PROSE-PART-B

> Cowork-chat CC, 2026-05-24. Bundle 2 **Part B** — the engine-prose +
> cache-coupled half of the Individual prose-quality pass. CC-167 Part A
> (render-safe de-jargon) already shipped; this is self-contained and does
> NOT re-attempt Part A.
>
> ⚠️ FIRE ONLY WITH OWNER AUTHORIZATION. This regenerates LLM caches
> (~$20–25 est., needs ANTHROPIC_API_KEY) and requires a human editorial
> review across shapes. It also shifts the Guide baseline. Not a
> fire-and-forget CC.
>
> ⚠️ SEQUENCING: land the CC-166 + CC-167A Individual commit FIRST (it edits
> `fiftyDegreeIndividual.ts`); this CC edits `identityEngine.ts` + the
> Movement composer, so no file collision, but the report should be in a
> known-committed state before the engine-prose rewrite.

## Why this is its own session (the coupling)

The Strength prose lives in `identityEngine.ts` `gift.text`, and for
Lens/Compass/Path that text is the **LLM splice-cache key**. Rewriting it:
1. changes the Guide render (→ `.cc145-before/jason-guide.md` baseline must
   refresh), and
2. cold-misses the splice cache for every cohort × {Lens,Compass,Path} until
   regenerated (→ those cards fall back to the new engine prose, losing the
   warm LLM splice, until regen runs).

So this is rewrite + regen + baseline-refresh + editorial review, in order.

## B1 — De-template the Body-Card "Strength" prose

Rewrite the templated stems in `identityEngine.ts` so Strength reads human,
not like the engine narrating itself. Confirmed target stems:
- ~L4423 `"{NP} shows up here:"`
- ~L4426 `"In its native register, this card carries {NP_LOWER}:"`
- ~L5214-5216 the Lens block: `"your processing pattern leans toward
  {FUNCTION_VOICE[dom]}. When this is operating in its native register, you
  tend to read the situation through {FUNCTION_VOICE[dom]} and execute through
  {FUNCTION_VOICE[aux]} — a combination that gives the shape its
  characteristic move."`

Symptom to fix (verbatim from Cindy's live render):
> "A clarifying-precision gift shows up here: your processing pattern leans
> toward the present-tense self. When this is operating in its native
> register, you tend to read the situation through the present-tense self and
> execute through the inner compass — a combination that gives the shape its
> characteristic move."
That says the same thing ~3 times and reads like wiring.

Rewrite rules (the engine-vs-human-prose canon — show the conclusion, not the
work):
- **Shape-aware, always.** Preserve the `{NP}` / `FUNCTION_VOICE[dom]` /
  `FUNCTION_VOICE[aux]` interpolation so each card/function still says its own
  thing. Do NOT hardcode one archetype's wording (Clarence's "You see
  structure forming before others have language for it" is Jason-specific —
  it's a TONE/LENGTH reference, never text to paste).
- Kill the self-referential tells: "shows up here", "in its native register",
  "your processing pattern leans toward", the triple-restate.
- One or two vivid sentences per card. Lead with what the person DOES/SEES,
  then the in-health expression.
- Keep it true for Fe/Si/Se/Ni/etc. equally — verify it doesn't only read
  well for the architect (Ni/Te) voices.

## B2 — Shorten the Movement / trajectory interpretation ~40%

Tighten the `## Movement` prose at its composer source (the text feeding
`composeTrajectory`'s extracted `body` in `fiftyDegreeIndividual.ts`). It
currently carries six interpretive loads at once. Compress to the core:
strong/goal-led (or soul-led) movement; the next growth isn't more output but
making the people/cause/calling/sacred value behind the work visible; framed
as the shape's question. Keep the gold lines, cut the fog. Stay shape-aware
(drive from the user's actual Goal/Soul/Movement, not Jason's numbers).

## B3 — Also fix: "the your" double-determiner

`identityEngine.ts:1378` — the T-015 single-ranking allocation tension:
```
user_prompt: `Inside the ${label} ranking, current flow and what you'd protect have separated…`
```
Every value in `T015_RANKING_LABELS` (~L1252-1257) already begins with "your"
(e.g. "your inward, relational energy"), so this renders "Inside **the your**
inward… ranking". Fix: drop the "the" → `Inside ${label} ranking, …`. Verify
all four labels read correctly without the article. (Folded into Part B
because it's engine prose feeding the Guide → needs the same baseline refresh.)

## B4 — Regen + baseline + review (the required tail, in order)

1. **Regen the splice caches** after B1, in canonical order:
   synthesis3 → proseRewrites → launch-polish-v3
   (affected: `lib/cache/synthesis3-paragraphs.json`,
   `lib/cache/prose-rewrites.json`, `lib/cache/launch-polish-v3-rewrites.json`).
   Report ACTUAL cost vs the ~$20–25 estimate.
2. **Refresh** `.cc145-before/jason-guide.md` (the Guide render changes from
   B1/B2/B3) so `cc145-guide-byte-identical-to-baseline` re-greens against the
   intended new baseline. Confirm the ONLY diff is the rewritten prose
   (no unintended drift).
3. **Editorial review across shapes** — render Jason + Cindy + Daniel +
   Madison and surface the Body-Card Strength lines + Movement paragraph for a
   shape/register/hedge review. Confirm they read human for caregiver/steward/
   builder, not just architect (guards the archetype-bias leak). This is owner
   + Clarence review, not Claude-only accept.

## Do NOT

- Fire without owner cost authorization (LLM regen) + the cross-shape review.
- Change engine MATH — only prose strings (Goal/Soul/Aim/Grip/Movement,
  grip taxonomy, lens-stack derivation all unchanged).
- Hardcode any single archetype's wording into shape-aware prose.
- Touch the "ordinary" load line or add confidence-shading (that's Bundle 3,
  separate).
- Reorder the report or re-do CC-166 / CC-167-A work.
- Commit or push (Cowork-chat handles the commit + the baseline/cache story
  after the editorial review passes).

## Acceptance

- `tsc --noEmit` clean; lint clean.
- Splice caches regenerated (synthesis3 → proseRewrites → launch-polish-v3);
  actual cost reported.
- `.cc145-before/jason-guide.md` refreshed; `individualBodyCardsEnrichment`
  18/18 incl. guide-byte-identical (against the new baseline).
- Full suite green at close (per "full suite after bundle").
- Editorial-review notes attached (does it read human for non-architect
  shapes? before/after of 2-3 Strength lines per shape).

## Report back

- Files modified; the new Strength stems + Movement prose (before/after).
- Cache regen order + ACTUAL cost.
- Guide baseline delta (confirm only-intended drift).
- Cross-shape editorial notes (Jason/Cindy/Daniel/Madison).
- Audit results.

## Next (not this CC)

Bundle 3 — the cache-baked "ordinary" load line + confidence-shading for thin
signals (engine + coordinated cache regen). Separate authorized session.
