# Design Handoff v2 — Body-Map Cards + Spec Drop

**For:** Claude CoWork (drafting CC prompts) and Claude Code (executing them).
**Source of truth:** `docs/design-spec-v2.md` and `docs/option-glosses-v1.md` (the latter already in repo).
**Status:** Ready to drop into the `who-are-you/` repo. Paths in this bundle mirror their final repo locations — copy as-is.

---

## What's in this bundle

```
design_handoff_v2/
├── README.md                                  ← you are here
├── docs/
│   ├── design-spec-v2.md                      ← REPLACES docs/design-spec-v1.md
│   └── design/
│       └── reference/                         ← read-only design reference
│           ├── Who Are You.html
│           ├── components.jsx
│           ├── styles.css
│           └── Body-Map Cards.html
├── public/
│   └── cards/                                 ← 8 SVG body-map cards
│       ├── 01-lens-eyes.svg
│       ├── 02-compass-heart.svg
│       ├── 03-conviction-voice.svg
│       ├── 04-gravity-spine.svg
│       ├── 05-trust-ears.svg
│       ├── 06-weather-nervous-system.svg
│       ├── 07-fire-immune-response.svg
│       └── 08-path-gait.svg
└── prompts/
    └── CC-XXX-design-drop-v2.md               ← draft CC prompt for the drop
```

## How to install in the repo

From the repo root (`who-are-you/`):

```bash
# 1) Spec — replaces v1
cp design_handoff_v2/docs/design-spec-v2.md docs/design-spec-v2.md
git rm docs/design-spec-v1.md            # optional — keep if you want history side-by-side

# 2) Card SVGs — for use in question pages
mkdir -p public/cards
cp design_handoff_v2/public/cards/*.svg public/cards/

# 3) Reference prototype (read-only — never imported by the app)
mkdir -p docs/design/reference
cp -R design_handoff_v2/docs/design/reference/* docs/design/reference/

# 4) CC drop prompt
cp design_handoff_v2/prompts/CC-XXX-design-drop-v2.md prompts/active/
# (rename CC-XXX to the next available CC number)

git add docs/design-spec-v2.md docs/design/reference public/cards prompts/active/CC-*-design-drop-v2.md
git commit -m "design: drop v2 — body-map cards, updated spec, prototype reference"
```

That's the whole drop. Nothing here changes app code — it's docs + assets only. Wiring the cards into `app/page.tsx` and the question screens is the **next** CC, not this one.

---

## What each piece is for

### `docs/design-spec-v2.md`
The canonical product + interaction spec. Replaces v1. Built around the **eight body-map cards** (Lens · Eyes, Compass · Heart, Conviction · Voice, Gravity · Spine, Trust · Ears, Weather · Nervous System, Fire · Immune Response, Path · Gait) per `docs/canon/shape-framework.md`. Section breakdown for CC slicing is in §17 of the spec.

### `public/cards/*.svg`
Eight body-map cards, one SVG per card. **320×320 viewBox**, monochrome `#1a1713` line at ~2.5px, single umber `#8a4a1f` accent reserved for one focal element per card. They are *editorial plates*, not UI icons — usage matters:

- **Right places:** card-opener screens, the Inner Constitution artifact, top of section reviews, print/PDF export. Display at **140–280px** on screen, with breathing room.
- **Wrong places:** dense list rows, navigation bars, buttons. Don't shrink below 96px — the line work falls apart.

The current SVGs are **v1 — not yet design-approved**. Treat them as placeholders that pass the family/register test; expect 1-2 to be replaced after the design lab review.

### `docs/design/reference/`
Read-only reference for Claude Code. **Do not import or transpile any of these into the app.** They demonstrate the visual system; the production styling lives in real Tailwind / CSS modules per the spec.

- `Who Are You.html` — hi-fi prototype canvas; ranking primitive, Temperament page, Inner Constitution artifact.
- `components.jsx` — single-file React reference for the ranking primitive (`RankingA`), `QuestionPage`, and `ConstitutionPage`. **Patterns to copy** (state shape, drag/drop semantics, "settling" animation hooks). **Not a runtime artifact** — it loads via inline Babel and uses globals; the production version belongs in `app/components/` as proper TS components.
- `styles.css` — design tokens and the visual system (paper / ink / umber palette, type scale, ranking row styling, Inner Constitution layout). Mine values out into Tailwind tokens or a CSS module; do not link this file directly.
- `Body-Map Cards.html` — the contact sheet showing the eight cards as a family.

### `prompts/CC-XXX-design-drop-v2.md`
A pre-drafted CC prompt for Claude Code that just performs steps 1–3 above (file moves only, no app changes). Use this if you want the drop done as an auditable CC instead of a manual `cp`.

---

## What's NOT in this bundle (intentionally)

- **No `app/`, `components/`, or `lib/` changes.** Wiring the cards into question pages is its own CC — see §17 of the spec for the slicing.
- **No `data/questions.ts` updates.** Locked option glosses are already in `docs/option-glosses-v1.md`; the data update belongs in a separate CC.
- **No tests.** Test coverage for the ranking primitive belongs to the wiring CC, not the design drop.
- **`design-canvas.jsx` and `tweaks-panel.jsx` from the prototype.** Those are design-lab scaffolding (pan/zoom canvas + in-page tweaks panel). They have no production analogue and would be confusing; omitted on purpose.

---

## How CoWork should use this

1. Read `docs/design-spec-v2.md` end-to-end.
2. Confirm the option glosses in §7.2/§7.3 still match `docs/canon/option-glosses-v1.md`. (They should — the lab synced them in this round. Worth re-checking.)
3. Slice §17 into CC prompts. The natural order is:
   - **CC-A** — this drop (use the included `CC-XXX-design-drop-v2.md`).
   - **CC-B** — extend `Question` type with a `ranking` variant; update `data/questions.ts` to add Q-S1, Q-S2, Q-X3, Q-C4 with locked glosses.
   - **CC-C** — implement `<RankingQuestion>` per §6 and the reference component. Pointer-based drag, keyboard reorder, live announce.
   - **CC-D** — Card opener screens that display the body-map SVG; eight openers, one per card.
   - **CC-E** — Inner Constitution artifact page per §9.
   - **CC-F** — Tests + a11y audit.
4. Hand each CC to Claude Code in turn.

Do not ask Claude Code to do CC-B through CC-F in one shot — they're independent and the spec says so.

---

## Open design questions

Flagged in the spec; not blocking the drop, but worth raising with the lab before CC-D:

- Should the body-map labels appear on every kicker (`Compass · Heart · Q-S1`) or only on the card openers? The prototype tests both via a Tweak; the spec leaves it open.
- Conviction · Voice and Fire · Immune Response are the most likely SVGs to be replaced. If the lab returns alternates, swap files in `public/cards/` before CC-D.
- Print / PDF export of the Inner Constitution — design exists, engineering decision pending.
