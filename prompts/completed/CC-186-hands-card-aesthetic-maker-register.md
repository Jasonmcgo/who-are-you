# CC-186 — Hands·Work card: aesthetic-maker register (finish Nat's de-Megan)

> Owner-confirmed Nat = Fi-Se-Ne-Ti (ISFP artist: painter/musician/graphic designer). After
> CC-183/185 her report is close, but the **Hands · Work** card is still wrong: the Guide
> renders the **caregiver** register ("Your hands make continuity… meals, calls, the room
> arranged"), and the Individual falls to a **generic** fallback ("Your hands make something
> real. The exact register depends…"). Neither names what her hands actually make — **form,
> craft, art**. She needs a maker/aesthetic Hands register that echoes her (now-correct)
> executive read: *values made visible through what you make.*
>
> Same root the work-map (CC-183) and grip/love (CC-185) had: the engine conflates Fi with
> Fe-care and lets the archetype default win over her explicit aesthetic signal.

## Requirement (owner)

Nat's Hands·Work card must read a **maker/aesthetic register** — her hands make form (the
painting, the song, the designed object); the building is the value made visible — NOT the
caregiver register (meals/calls/presence) and NOT the empty generic fallback. The Guide and
Individual renders must agree. General fix, not a Nat special-case: any Fi-led aesthetic-
maker shape should route here.

## Root cause (verified — file:line)

- `lib/handsCard.ts` `HANDS_TEMPLATES` is keyed by `ProfileArchetype`. `cindyType` (~119-138)
  is the **caregiver** template ("Your hands make continuity… meals, calls, the room
  arranged so what they need is already there"). `unmappedType` (~159-178) is the **generic**
  fallback ("Your hands make something real. The exact register depends…").
- `resolveTemplateArchetype` (~244-269):
  - **line 255:** `if (lensConfidence === "low") return "unmappedType"` — Nat's lens reads
    low-confidence (non-MBTI stack), so the Individual render falls to the generic template.
  - **line 202:** `CAREGIVER_DRIVERS = new Set(["fe", "fi"])` — **lumps Fi with Fe** as a
    "caregiver" driver, so a cindyType + Fi-driver shape keeps the caregiver template (the
    Guide render). This is the conflation: an Fi-Se *artist* is treated as an Fe *caregiver*.
- The caregiver prose Jason saw in the Guide ("build through presence / removes strain") is
  the LLM **prose-rewrite cache** entry for `cindyType + hands` — a polish of the cindyType
  caregiver base. So the cache also encodes cindyType = caregiver and will need regenerating
  once the base register changes (see Part C).

## Fix — Part A: add a maker/aesthetic Hands template

Add a `HANDS_TEMPLATES` register for the **aesthetic maker** — the artist whose hands make
form. Voice: hands make the painting/song/designed object; the work is the value made
visible; growth edge = the made thing arriving after the moment it was for (matches her exec
read); pressure register = making to prove vs making to express; closing ties to "values
made visible." Keep the existing four registers intact.

## Fix — Part B: route aesthetic-maker shapes to it (don't lump Fi with Fe)

In `resolveTemplateArchetype` (and the driver/compass sets), stop treating Fi as
automatically caregiver. Route to the new maker register when the shape is an **aesthetic
maker** — keyed on the **aesthetic signal** (Q-O1 = aesthetic top-1 and/or Openness aesthetic
subdimension high) together with an Fi driver / Se aux — *independent of the cindyType
archetype*. Crucially, this route must fire **even when lens-confidence is low** (line 255):
the aesthetic signal is its own high-confidence input, so don't flatten an aesthetic maker to
the generic fallback just because the full lens stack is uncertain. Genuine Fe-care shapes
(Fe driver + Family/Compassion compass, no aesthetic lead) keep the caregiver register.

## Fix — Part C: regenerate the affected prose-rewrite cache

The `lib/cache/prose-rewrites.json` (+ launch-polish / cross-section caches) hold stale
`cindyType + hands` caregiver rewrites keyed on the old base prose. After Part A/B change
Nat's Hands base, her new base = a new cache key, so the stale caregiver rewrite won't hit —
but regenerate the hands-card cache entries so the maker register gets its polished prose and
no orphaned/stale entries linger. (Respect the regen ordering canon.)

## Do NOT

- Do NOT special-case Nat by name — Parts A/B are general (any Fi-led aesthetic maker routes
  to the maker register).
- Do NOT remove the caregiver register or break genuine Fe-care shapes (Cindy/Kevin-type) —
  only stop Fi-artists from being mis-routed into it.
- Do NOT change the lens/stack typing (CC-183) or the grip/love/exec composers (CC-185).
- Do NOT commit or push (sandbox: prepend `rm -f .git/index.lock`).

## Acceptance

- Nat's Hands·Work card reads the maker/aesthetic register (making/craft/form — "values made
  visible in what you make"), in **both** Guide and Individual renders — not caregiver, not
  generic.
- The maker route fires for her despite low lens-confidence.
- Genuine Fe-care shapes still render the caregiver Hands register (no regression — verify on
  a real Fe-care cohort fixture).
- `handsCard` audit + `cohortRealLensCanon` + full suite green; **flag-don't-fix** the known
  pre-existing reds (the 15 from CC-183 + the stale cindy-anchor from CC-185).
- Cache regenerated for the hands entries; `npx tsc --noEmit` + lint + `npm run build` clean.

## Report back

- The new maker template + the routing predicate (what signals gate it) + confirmation it
  fires at low lens-confidence.
- Nat's new Hands card text (Guide + Individual, confirmed identical register).
- A genuine Fe-care fixture still rendering caregiver (no regression).
- Cache regen scope; tsc/lint/build + suite status; any reds flagged not fixed.
