# CC-ROOMREAD-CARD-GRAPHIC

> Room Read polish. Each round shows only the card's prompt text in a box — no body-
> card graphic. The owner expected each round to display its body-card image (the
> Lens/Compass/Hands/etc. art). The SVG/PNG assets already exist; the round screens
> just don't reference them.

## Requirement (owner)

Every round (both the voting screen and the reveal screen) should display the body-
card graphic for that round's theme, so the round reads as a "card," not a text box.

## Root cause (verified)

`app/games/room-read/[token]/page.tsx` renders the prompt text only — a grep for
`cards/`, `.svg`, `<img>`, `Image` on the round screens returns nothing. The assets
exist in `public/cards/`:

| theme    | asset                          |
|----------|--------------------------------|
| lens     | `01-lens-eyes.svg`             |
| compass  | `02-compass-heart.svg`         |
| hands    | `09-craft-hands.png`           |
| voice    | `03-conviction-voice.svg`      |
| gravity  | `04-gravity-spine.svg`         |
| trust    | `05-trust-ears.svg`            |
| fire     | `07-fire-immune-response.svg`  |
| path     | `08-path-gait.svg`             |

(`06-weather-nervous-system` is intentionally NOT a round theme. Note `hands` is a
PNG; the rest are SVG.)

## Fix

Add a `BODY_CARD_ASSET: Record<BodyCardTheme, string>` map (theme → `/cards/<file>`)
next to `BODY_CARD_LABELS` in `lib/games/roomRead/rounds.ts`, covering the 8 round
themes above. Render the graphic on `VotingScreen` and `RevealScreen` (above or
beside the prompt), referenced by public path (`/cards/...`). Give it sensible
fixed dimensions + `alt` text (the theme label). Match the existing paper/serif
visual register.

## Do NOT

- Do NOT add an asset for `weather` (not a round theme) or change `BODY_CARD_ORDER`.
- Do NOT inline the SVGs (the homepage does that for its static path; here, reference
  the public asset — keep it simple).
- Do NOT change scoring, generation, the leak guard, or payload shapes.
- Do NOT touch the couple module or the assessment engine.
- Do NOT commit or push (sandbox: prepend `rm -f .git/index.lock`).

## Acceptance

- Each round's voting and reveal screens show the correct body-card graphic for the
  theme; `hands` loads its PNG, the rest their SVGs.
- No layout breakage on the existing screens; `alt` text present.
- `npx tsc --noEmit` + lint clean; `npm run build` compiles; roomRead tests green.

## Report back

- The theme→asset map as built; a note confirming all 8 themes resolve to an
  existing file in `public/cards/`.
- Files touched (rounds.ts + player page only); tsc/lint/build status.
