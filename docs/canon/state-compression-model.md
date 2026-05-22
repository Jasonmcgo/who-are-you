# State Compression — How Grip and Load Distort the Read

**Status: DRAFT — design proposal, not yet ratified. For review.**

## The problem

The instrument measures **presentation** — how a person is operating right
now. Under a strong grip and a heavy load, presentation diverges from
**durable shape** — who the person is when the load eases. Today the engine
treats that divergence as a *confidence footnote* (the Lens read fires
"low") and a *prose caveat* (the Weather card's "state is not self"). It
does not **model** the divergence. So a person whose natural shape is
masked by grip + load is classified as the masked version, confidently and
warmly, all the way into the gold-standard PDF.

Connor is the motivating case. He reads as a natural **Ne** (ENTP) —
possibility-finder. But under a **Belonging Grip** ("will I be welcome if I
bring this whole thing into the room?") plus a **high load**, he governs
himself into Ti-first: he coherence-checks before he lets the Ne diverge,
because divergence feels too costly to be received. The engine measured
that governed presentation and classified him **INTP** (Ti→Ne) — the mirror
of his durable **ENTP** (Ne→Ti). The Ti-lead is the grip wearing his
clothes, not the shape underneath. The Lens confidence fired LOW (he was a
near-tie), which is the engine sensing the wobble — but it stopped at
"uncertain" instead of explaining *why* and naming the likely durable read.

## The principle

> **Grip and load are a distortion lens over every other read, not just a
> card of their own.** A strong grip bends the cognitive stack, the E/I
> read, and the conviction read. The engine must (a) recognize when a
> measured read is likely a compressed presentation, (b) compute a durable-
> shape hypothesis by decompressing, and (c) surface both — "who you're
> operating as under load" and "who you are underneath it."

This is the product thesis made literal: *Who Are You* (durable shape) vs.
*the Grip that pulls you off course* (the compression). The instrument
already finds the grip well; this model lets the grip explain the rest of
the read instead of silently corrupting it.

## The mechanism

Two ingredients already exist in separate places:

1. **Grip read** — `gripTaxonomy` / `gripPattern` (the pattern, its
   underlying question, its named contributing grips, defensive vs.
   with-stakes strength).
2. **Load read** — `weather` / current-load (`high` / `moderate` / `low`,
   responsibility weight, formation context).

What's missing is the **coupling**: a function that, given grip pattern +
grip strength + load level, predicts how the *measured* presentation likely
differs from the durable shape, and applies that to the other reads.

### Core compression rule (cognitive stack)

A natural **extraverted-dominant** function (Ne, Se, Fe, Te) under a
social / belonging / job-stakes grip + high load tends to present as its
**introverted-judging auxiliary stepping forward as self-governance.** The
dominant/auxiliary *order inverts* — which is exactly what flips an MBTI
type to its mirror (ENTP↔INTP, ENFP↔INFP, ESTP↔ISTP, etc., via the
`jungianStack` dom|aux lookup). The compression is strongest when:

- the grip is a **belonging / social / approval / job-stakes** pattern
  (these specifically suppress *outward* expression), AND
- **load is high**, AND
- the measured dom/aux were a **near-tie** (within `MBTI_TIE_MARGIN`) — i.e.
  the engine was already on the fence.

When all three hold, the measured introverted-led read is a strong
candidate for a compressed extraverted-led durable shape.

### Distortion signatures (grip pattern → expected shift)

Each grip pattern gets a documented distortion signature on the other
reads. Initial set (extend as data warrants):

- **Belonging / social-adaptation / job-stakes grip:** suppresses E
  (measured Extraversion reads lower than baseline); surfaces introverted-
  judging governance over the natural extraverted-perceiving dominant.
  → likely durable type is the **extraverted mirror** of the measured type.
- **Worth-through-achievement grip:** surfaces output/structure (Te/Ti
  governance) over a softer natural perceiving/feeling dominant; inflates
  Conscientiousness presentation.
- **Control / security grip:** narrows Openness presentation; surfaces
  Si/Te governance.
- *(Others to be specified.)*

## The decompression rule

When grip strength × load exceeds a threshold AND a distortion signature
applies AND the relevant measured signal was a near-tie:

1. **Lower confidence** in the as-measured read (the engine already does
   this; now it's for a *named* reason, not a generic flag).
2. **Compute a durable-shape hypothesis** by applying the inverse of the
   signature (e.g., flip dom/aux to the extraverted mirror; restore E
   toward baseline).
3. **Surface both reads** (see Output). The durable read is a *hypothesis*,
   never a verdict.

The strength of decompression scales with **grip × load**:
- Low grip / low load → trust the measured read; no decompression.
- High grip / high load + signature + near-tie → present the durable
  hypothesis prominently.

## Output (dual read)

Where the report currently emits a single low-confidence Lens read, it
emits two, clearly labeled:

> *As you're operating right now — under a heavy load and a belonging grip —
> the shape presents as a coherence-checker who governs before diverging
> (INTP-shaped). With the load eased, the durable shape underneath is most
> likely the possibility-finder leading (ENTP-shaped): you're a natural
> diverger currently governing the divergence because being received feels
> costly. The clothes don't fit because they aren't yours; they're the
> load's.*

The Guide gets the mechanism (signature, scores, margin); the Individual
gets the plain-language dual read.

## Confidence calibration

- Replace the binary low/high Lens confidence with a read that carries
  **why**: `compressed-presentation` (high grip × load, near-tie, signature
  present) vs. `genuinely-ambiguous` (near-tie, no grip/load explanation)
  vs. `clear`.
- A `compressed-presentation` flag *raises* confidence in the durable
  hypothesis even as it lowers confidence in the measured read.

## Guardrails

- The durable read is **"a possibility, not a verdict"** — same canon frame
  as the whole report. Never assert the decompressed type as fact.
- Only decompress on a **near-tie or a strong signature** — do not flip a
  clear, well-separated dominant just because load is high.
- Do not let decompression invent a shape with no measured basis; it
  re-orders / re-weights *existing* measured functions, it doesn't
  hallucinate new ones.
- The Weather card remains the honesty backstop: state is not self.

## Worked example — Connor

- **Measured:** Ti-dominant (coherence-checker), Ne-auxiliary (possibility-
  finder) → INTP. Lens confidence LOW (near-tie). Extraversion 57
  (moderate). Belonging Grip; load HIGH; "overwhelming/stretched"; many
  people depend on him.
- **Signature match:** belonging/job-stakes grip + high load + Ti/Ne
  near-tie → core compression rule fires.
- **Durable hypothesis:** Ne-dominant, Ti-auxiliary → **ENTP**. Natural
  diverger currently governing the divergence under social/load pressure.
- **Output:** present both; explain the compression; hold the ENTP read as
  the likely durable shape, not a verdict.

## Implementation notes (for the follow-up CC)

- Hook point: the Lens-confidence logic in `lib/identityEngine.ts`
  (~L2499–2559, where confidence is lifted/lowered) is where the
  decompression decision belongs — it already has the stack + can read
  grip + load.
- Inputs available: `lens_stack` (dom/aux + margin), `gripTaxonomy` /
  `gripPattern`, current-load / weather, OCEAN extraversion.
- New: a `compressionSignature(gripPattern, load)` map + a
  `decompressStack(stack, signature)` that returns the durable hypothesis +
  a typed confidence reason.
- Surfaces: the Lens card (dual read), the Movement/Weather caveat, and the
  MBTI disclosure (measured + durable).
- Eval: add a fixture pair where a known extraverted-dominant under a
  belonging grip + high load should yield the dual read; regression-guard
  that low grip/load does NOT trigger decompression.
