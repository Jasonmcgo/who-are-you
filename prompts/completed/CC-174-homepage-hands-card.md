# CC-174-HOMEPAGE-HANDS-CARD

> Cowork-chat CC, 2026-05-24. The homepage body-map shows 8 cards and is missing
> Hands (the report engine already renders Hands as card 03). Add it as the 9th,
> matching the existing card voice + style. Static-homepage change.

## Where

`web/index.html`, the `#body-cards` section (`§ 03 · The 8 Body Cards`). Each
card is a `<div class="bcard">` with: an inline line-art `<svg>` inside
`.bcard-svg`, a `.bcard-head` (`<span class="num">NN</span><span
class="body-part">…</span>`), an `<h4>` (card name), and a `<p>` (description).

Current order: 01 Eyes/Lens · 02 Heart/Compass · 03 Voice/Speak · 04 Spine/
Gravity · 05 Ears/Listen · 06 Nervous System/Weather · 07 Immune Response/Fire ·
08 Gait/Path.

## The new card (owner-confirmed copy)

Insert **after Heart/Compass** (so the body-order reads see → protect → make),
as card **03**; renumber the rest (Voice→04, Gravity→05, Ears→06, Weather→07,
Fire→08, Path→09).

- `.body-part` chip: **Craft**
- `<h4>`: **Hands**
- `<p>`: **What your hands make real: the craft you build, the structures you leave behind — and whether the work serves the life, or quietly becomes the place you hide from it.**

(Hands is the one card where the body part *is* the metaphor — your hands already
mean making. "Craft" in the chip keeps it consistent with the `09-craft-hands`
asset + theme; "Hands" as the name carries craft/build/create.)

## Section copy updates

- Kicker: `§ 03 · The 8 Body Cards` → `§ 03 · The 9 Body Cards`
- `<h2>`: "The **eight** deeper signals beneath your *trajectory*." → "The
  **nine** deeper signals beneath your *trajectory*."
- `<p class="sub">`: the verb list "how you see, love, speak, carry, listen,
  feel, react, and return to the path" → add **make** after **love** (matching
  the 03 placement): "…how you see, love, **make**, speak, carry, listen, feel,
  react, and return to the path."

## Icon (the one real decision)

The 8 existing cards use bespoke **inline line-art SVGs** (`viewBox="0 0 320
320"`, `stroke="#1a1713"`, `stroke-width="2.5"`, `fill="none"`, round caps). The
only Hands asset is `public/cards/09-craft-hands.png` — a raster that will NOT
match the line-art set. Two paths:

1. **Preferred — a line-art Hands SVG in the homepage style.** Below is a clean
   candidate (an open hand) to drop into `.bcard-svg`; refine to sit beside the
   eye/heart polish. Keep the same viewBox/stroke conventions.

   ```html
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" fill="none" stroke="#1a1713" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
     <!-- palm -->
     <path d="M104 250 C 96 210, 96 180, 100 156 L116 156 L116 196"></path>
     <!-- four fingers -->
     <path d="M116 196 L116 120 C116 110, 132 110, 132 120 L132 188"></path>
     <path d="M132 188 L132 104 C132 94, 148 94, 148 104 L148 188"></path>
     <path d="M148 188 L148 100 C148 90, 164 90, 164 100 L164 192"></path>
     <path d="M164 192 L164 116 C164 106, 180 106, 180 116 L180 200"></path>
     <!-- thumb -->
     <path d="M180 200 L180 168 C180 150, 198 142, 210 156 L232 182"></path>
     <!-- palm base / wrist -->
     <path d="M104 250 C 130 274, 170 276, 198 256 C 214 244, 222 224, 232 182"></path>
     <!-- spark above the open hand (the "make") -->
     <g stroke-width="1.6" opacity="0.7">
       <line x1="160" y1="40" x2="160" y2="60"></line>
       <line x1="138" y1="50" x2="150" y2="62"></line>
       <line x1="182" y1="50" x2="170" y2="62"></line>
     </g>
   </svg>
   ```
   Treat this as a starting glyph, not final art — adjust until it reads as
   cleanly as the others (an open, making hand with a small spark above it).

2. **Interim — render the PNG.** If a matching SVG isn't ready, use
   `<img src="/cards/09-craft-hands.png" alt="Hands">` styled to fill
   `.bcard-svg` so the card ships now; flag that it's a style mismatch to
   replace with line-art later.

Per the homepage icon pattern, also check whether the **design-handoff mirror**
(the doc that mirrors the inlined card SVGs) needs the new Hands glyph added for
consistency — same 3-place rule we've followed for icon swaps (public/cards,
the handoff mirror, and the inlined `web/index.html` block). For an *add*, the
inlined `web/index.html` block is the load-bearing edit; mirror the others if
they exist.

## Do NOT

- Touch the report engine's Hands card (it already renders correctly) — this is
  homepage/marketing only.
- Change the other 8 cards' copy or SVGs (only their `num` renumbers 04–09).
- Change engine math, the assessment, or any report output.
- Commit or push.

## Acceptance

- Homepage renders 9 body cards; Hands sits at 03 (after Compass) with chip
  "Craft", title "Hands", the confirmed description, and a line-art icon that
  visually matches the set (or the interim PNG, flagged).
- Kicker reads "9 Body Cards"; h2 reads "nine"; the sub verb-list includes
  "make"; cards 04–09 renumbered correctly with no gaps/dupes.
- No layout break in the `.body-cards` grid (9 cards flow/wrap cleanly).
- No change to the report engine or any other page.

## Report back

- The inserted card block + the renumbering.
- Which icon path was used (line-art SVG vs interim PNG) + a note on visual fit.
- Confirmation the section copy (8→9, verb list) updated.
- A screenshot or render note of the body-cards grid with all 9.
