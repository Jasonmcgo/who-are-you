# CC-162 — Copy the body-card icon SVGs from the Guide into the Individual report (polish)

> Owner: the Guide's body cards show the icon glyphs (eye = Lens, heart-compass =
> Compass, hands = Hands, etc.); the Individual's enriched body cards (CC-145,
> numbered "01 · LENS · EYES …" with Strength/Growth/Practice prose) render the
> text but NOT the icon. Add the icons for a consistent, polished look. Megan's
> report otherwise reads well now.

## Source (already exists)

`lib/cardAssets.ts` exports `SHAPE_CARD_SVG_PATHS` (8 cards →
`/cards/NN-slug.svg`, e.g. `lens: "/cards/01-lens-eyes.svg"`) and
`HANDS_CARD_IMAGE_PATH = "/cards/09-craft-hands.png"` for the 9th card. The SVGs
live in `public/cards/`. The Guide (`lib/renderMirror.ts`) already imports from
`cardAssets`.

## Verified gap

`app/components/FiftyDegreeIndividualSection.tsx` → `BodyCards` renders the card
prose but does not reference `cardAssets` / `SHAPE_CARD_SVG_PATHS` — so the
enriched Individual cards have no icon. (The trajectory + ocean dashboard SVGs are
rendered elsewhere in the section; this is specifically the per-card body-map
icon that's missing.)

## Tasks

**T1.** In `FiftyDegreeIndividualSection.tsx`'s body-card render, add the card's
icon at the top of each card, sourced from `cardAssets`:
- 8 shape cards → `<img src={SHAPE_CARD_SVG_PATHS[cardId]}>` (or inline the SVG if
  that matches how the Guide does it — match the Guide's approach).
- Hands card → `HANDS_CARD_IMAGE_PATH` (the PNG).
Size/placement to mirror the Guide's body-card presentation (centered above the
card header, modest size). Reuse `SHAPE_CARD_MAP_SIZE_PX` / the Guide's sizing if
applicable.

**T2.** Confirm which Individual section actually lacks the icon and add it there.
If a separate "Map — go deeper" section in the Individual *already* shows icons
(collapsible cards), leave that one; the target is the enriched detailed cards
that currently show prose without an icon.

## Allowed to modify

- `app/components/FiftyDegreeIndividualSection.tsx`
- import from `lib/cardAssets.ts` (read-only; don't change the asset module).

Do NOT change the engine/derivation, the card prose (CC-145), or the Guide.

## Acceptance criteria

1. Each Individual body card shows its icon (eye/Lens, heart-compass/Compass,
   …, hands/Hands) matching the Guide's glyphs, sourced from `cardAssets`.
2. Layout stays clean on the report (icon doesn't crowd the prose); renders on
   the user/report surface.
3. `tsc` + lint clean. No engine/derivation/prose change. Guide unchanged.

## Flag in report

- Which section got the icons, and whether SVGs were `<img>`-referenced or inlined
  (match the Guide).
- A note on the Hands PNG vs the 8 SVGs handling.
