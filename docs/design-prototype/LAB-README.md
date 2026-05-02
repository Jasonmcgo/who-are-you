# Handoff: Who Are You? — design reference for CoWork

This bundle is a **design reference**, not production code to lift directly. The HTML/JSX inside is a working prototype assembled in Claude as a high-fidelity visual & interaction design — it shows what the product should look like, how the ranking primitive should feel, and how the Inner Constitution should read. Your job is to **recreate this in the target codebase's own framework and design system** (React, Next, SwiftUI, native, whatever the app is built in). If no codebase exists yet, pick a framework that suits the team and recreate the designs there.

The canonical spec is `design.md` (also included). When the prototype and the spec disagree, the spec wins.

---

## 1. What this is

**Who Are You?** is a reflective self-discovery product. The user ranks values, trust sources, attribution instincts, and inner cognitive voices; the engine interprets the rankings as signals, combines them into tensions, and produces a written artifact called the **Inner Constitution**.

The product architecture is a **body-map of the self** with eight cards. Each card has a product-friendly name, a body part it maps to, and a question it answers (locked in `docs/canon/shape-framework.md` on the source project, summarized in `design.md` §3):

| Card | Body part | What it answers |
|---|---|---|
| **Lens** | Eyes | How do you see and process reality? |
| **Compass** | Heart | What do you protect? |
| **Conviction** | Voice | What do you believe and defend? |
| **Gravity** | Spine | Where do cause, blame, and duty fall? |
| **Trust** | Ears | Whom or what do you trust to mediate reality? |
| **Weather** | Nervous system | What shaped you and what surrounds you now? |
| **Fire** | Immune response | What survives when belief costs you something? |
| **Path** | Gait | What are you becoming? |

The prototype implements the ranking primitive against four canon questions (Q-S1, Q-S2 on Compass; Q-X3 on Trust; Q-C4 on Gravity; Q-T1 on Lens / Four Voices) plus a sample Inner Constitution.

---

## 2. Fidelity

**High-fidelity.** Final colors, typography, spacing, ranking interaction, and Inner Constitution treatment are intended to be reproduced as shown. The non-negotiables are listed in §16 of `design.md`. The most important ones to honor in implementation:

1. **Paper-and-ink palette only.** Warm off-white surfaces; near-black ink. Umber is the **only** accent. No blues, greens, gradients, severity colors, or bright fills. (The prototype carries a slate-blue tweak as a Tweaks-panel toggle — it's an exploration knob, **not** the canonical palette. Ship the umber.)
2. **Drag-to-reorder is the ranking primitive.** Same control across desktop and mobile.
3. **Cap any ranking question at 4–5 items.**
4. **The Inner Constitution is a document, not a dashboard.** No charts, no radar plots, no percentile bars, no "your score is".
5. **Provenance disclosure is required.** Every interpretation/tension must support a "tell me more" affordance that surfaces which signals it came from.
6. **Interpretive restraint.** Use "may", "appears to", "this pattern may be present". Never "you are X."
7. **Don't promise saved state unless persistence exists.** The prototype prints "saved · autosave" — replace with "draft" or similar until your backend actually persists.

---

## 3. Files in this bundle

| File | Role |
|---|---|
| `design.md` | Canonical product + interaction spec. Read this first. |
| `Who Are You.html` | Entry point. Loads scripts, defines `<App />`, wires the design canvas. |
| `components.jsx` | All UI components: question shells, ranking primitive, Inner Constitution, treatment swatches. Plus all canon question content (Q-S1, Q-S2, Q-X3, Q-C4, Q-T1) used for the prototype. |
| `styles.css` | Design tokens + component styles. Source of truth for color/type/spacing values. |
| `design-canvas.jsx` | Pan/zoom presentation shell (Claude Design starter). Not part of the shipping product — only used to lay out artboards side-by-side for review. **Do not port this.** |
| `tweaks-panel.jsx` | The exploration tweaks panel (Claude Design starter). Also not part of the shipping product. **Do not port this.** |

**Open the prototype:** open `Who Are You.html` in a browser. The canvas is pan/zoom (drag to pan, scroll/pinch to zoom, click an artboard label to focus). Drag the rows in any ranking artboard — the interaction is real.

---

## 4. Design tokens

All values live as CSS custom properties at the top of `styles.css`. Lift these into your codebase's token system.

### Color

```css
--paper:       #f6f2ea;   /* page background; warm off-white */
--paper-warm:  #efe9dd;   /* secondary surface (confirm cards, hover) */
--paper-deep:  #e6dece;   /* tertiary surface */
--ink:         #1a1713;   /* primary text, primary button bg */
--ink-soft:    #433d33;   /* secondary text */
--ink-mute:    #807566;   /* metadata, kickers, sub copy */
--ink-faint:   #b8ad9c;   /* hairlines, decorative */
--rule:        rgba(26,23,19,.14);   /* row borders */
--rule-soft:   rgba(26,23,19,.08);   /* divider lines */
--umber:       #8a4a1f;   /* THE accent — primary button, kicker, active progress */
--umber-soft:  #a8653a;
--umber-wash:  rgba(138,74,31,.08); /* tension-card and confirm-card faint fill */
```

### Typography

```css
--serif: "Source Serif 4", "Source Serif Pro", "Iowan Old Style", "Palatino", Georgia, serif;
--mono:  "JetBrains Mono", "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
--sans:  "Inter Tight", system-ui, -apple-system, "Segoe UI", sans-serif;
```

Roles (per `design.md` §5.3):

- **Serif** = the voice of the product. Body copy, prompts, Inner Constitution, ranked statement text, Four Voices.
- **Mono** = the voice of the system. Question IDs, card kickers, rank numerals, tension IDs, progress metadata, button labels.
- **Sans** = rare. Small utility microcopy only.

The serif/mono contrast is load-bearing — it lets the product distinguish "the guide speaking" from "the system keeping track." Don't collapse them.

### Type scale (as observed in the prototype, desktop)

| Element | Size | Weight | Family |
|---|---|---|---|
| Page hero ("Who Are You?") | 40px | 400 | serif |
| Question prompt | 19px / 1.3 | 400 | serif |
| Constitution h1 | ~32px | 400 | serif (italic small caps treatment) |
| Constitution body | 16px / 1.6 | 400 | serif |
| Tension title | 18px | 500 | serif |
| Card name (artboard head) | 17px | 500 | serif |
| Body-part suffix (italic) | ~15px | 400 italic | serif |
| Rank numeral | 22px | 500 | mono |
| Sub copy / sub prompt | 11px / 1.5 | 400 | mono uppercase, .16em letter-spacing |
| Kicker | 10.5px | 500 | mono uppercase, .16em |
| Button label | 11px | 500 | mono uppercase, .1em |
| Progress segment label | 10.5px | 500 | mono uppercase, .1em |

### Spacing

The prototype uses a loose 4px rhythm, not a strict scale. Notable values:

- Artboard head padding: `28px 40px 18px`
- Artboard body padding: `22px 40px 18px` (desktop) / `20px 20px 16px` (mobile/`.sm`)
- Artboard footer padding: `12px 40px 16px` (desktop) / `12px 20px 16px` (mobile)
- Rank row padding: `11px 14px 11px 0` (desktop) / `12px 8px 12px 0` (mobile)
- Rank list gap: `8px`
- Confirm card padding: `14px 16px`, `margin-top: 12px`

### Shape

- Border radius: **2px** on rows, buttons, cards. Effectively a hair of softening, not a "rounded UI" feel.
- Borders: 1px, almost always `var(--rule)` or `var(--rule-soft)`. The product is held together by hairlines and ink, not boxes and shadows.
- Shadows: only on the dragged ranking row — `0 12px 40px rgba(26,23,19,.18), 0 0 0 1px var(--umber)`. Nowhere else.

---

## 5. The ranking primitive (the most important component)

This is the central interaction. Spec is in `design.md` §6; reference implementation is `RankingA` in `components.jsx`.

### Anatomy

```
┌──────────────────────────────────────────────────────────────┐
│  1  │  Freedom — the ability to act without needing permis…  │  ⋮⋮  │
└──────────────────────────────────────────────────────────────┘
  ↑      ↑                                                       ↑
  rank   primary label + descriptor                              grip
  (mono  (serif, descriptor after em-dash)                       (3 stacked
   22px,                                                          dots, right
   umber                                                          column 32px)
   color,
   tabular)
```

Grid columns: `44px | 1fr | 32px` desktop · `36px | 1fr | 28px` mobile.

### Behavior contract

- **Whole row is the drag surface.** Pointer down on the row picks it up; the row follows pointer Y; nearest sibling becomes the drop target.
- **Rank numbers reflow live** as positions change.
- **No separate mobile tier mode.** Same drag interaction across breakpoints. The grip column simply gets a larger touch target.
- **Required accessibility (not in the prototype — must be added in production):**
  - Keyboard reorder: focus a row, Space/Enter to "pick up", Arrow ↑/↓ to move, Space/Enter to drop, Esc to cancel.
  - Visible focus state on the row when picked up (the umber 1px outline used on `.dragging` is a good starting point).
  - Live-region announcement on each move: e.g. "Freedom — moved to position 2 of 4."
  - Hit target on grip ≥ 44px tall on touch.
  - Don't rely on color alone for state — the umber rank numeral and rule are accent, not signal; state is also carried by border weight and elevation.
- **Cap items at 4–5.** If a future question wants more, split it into multiple ranking questions.

### Descriptors are not optional

Every ranked option carries a one-sentence gloss after an em-dash (see Q-X3 / Q-C4 in `components.jsx` for the locked glosses; see `design.md` §7.3 / §7.4 for the canon source). The gloss is part of the question's interpretive precision — "Freedom" alone is too broad; the descriptor pins the meaning being ranked. **Don't drop them in implementation.**

---

## 6. Screens / artboards in the prototype

The pan/zoom canvas presents these in sections, top to bottom:

1. **Cover** — designer's orientation. Not a product screen.
2. **Open call · Section titles on the canvas** — three treatment swatches (A body-map names, B neutral, C body part as small tag). Discussion artifact, not a product screen.
3. **Open call · Body-part chip in the artboard head** — five treatment swatches (italic word, mono small caps, parenthetical, glyph, hidden). Discussion artifact, not a product screen.
4. **Compass · Heart — Q-S1 & Q-S2** — desktop (520×720) and mobile (390×720) for Q-S1; desktop for Q-S2.
5. **Gravity · Spine + Trust · Ears** — Q-C4 desktop + mobile, Q-X3 desktop. Both 5-item.
6. **Lens · Eyes — Four Voices · Q-T1 of 8** — desktop (560×760) + mobile (390×760). Voice statements as drag rows, taller row to give the prose air.
7. **Inner Constitution** — desktop (620×880) + mobile (390×880).
8. **Open calls — designer's read** — short text notes on the ranking primitive, 4-vs-5, temperament, and a red flag on the tension-confirmation prompt.

### Question screen anatomy (every Q-* artboard)

```
┌─────────────────────────────────────────────────────────┐
│ COMPASS · HEART      ▬▬▬▬▬▬▬▬▭▬       Q-S1            │ ← .ab-head
├─────────────────────────────────────────────────────────┤
│ COMPASS · HEART · Q-S1 OF S2                            │ ← .prompt-kicker
│                                                         │
│ Order these by what you'd protect first when            │ ← .prompt
│ something has to give.                                  │
│ FOUR OF YOUR OWN. RANK BY WHICH HOLDS FIRST WHEN        │ ← .sub
│ TWO OF THEM PULL APART.                                 │
│                                                         │
│ ┌─────────────────────────────────────────────────┐     │
│ │ 1 │ Freedom — the ability to act without …  │ ⋮⋮  │   │ ← ranking
│ └─────────────────────────────────────────────────┘     │
│ … additional rows                                       │
│                                                         │
│ ┌─────────────────────────────────────────────────┐     │
│ │ A PATTERN MAY BE PRESENT · T-012                │     │ ← tension card
│ │ You placed Freedom above Truth. When these two  │     │   (only after
│ │ pull apart — and they will — the first seems    │     │    ranking is
│ │ to win. Does that feel accurate?                │     │    complete)
│ │ [yes, that's right] [partly] [no, not really]   │     │
│ │ [tell me more]                                  │     │
│ └─────────────────────────────────────────────────┘     │
├─────────────────────────────────────────────────────────┤
│ ← BACK            saved · autosave         CONTINUE →  │ ← .ab-foot
└─────────────────────────────────────────────────────────┘
```

The kicker ("COMPASS · HEART · Q-S1 OF S2") and the artboard head card name ("Compass · *Heart*") together carry the body-map. The italic "· Heart" is currently the canonical treatment — see the Open Call swatches for alternatives the design team is comparing.

### Inner Constitution structure

`ConstitutionPage` in `components.jsx`. Sections, in order:

1. Colophon strip (mono, top): "Inner Constitution · No. 0041 · v.1"
2. h1: "A description, not a verdict."
3. "for — the reader · a body-map of one person"
4. Lede paragraph (drop-cap-friendly serif lede)
5. **Opening shape — Lens, Compass, Gravity** — synthesis paragraph naming three cards by name
6. Active tensions — each with mono ID line ("T-005 · confirmed · Compass × Conviction"), serif title, prose, and a `.signals` chip row showing provenance
7. **Compass — what you protect** — ranked output paragraph
8. **Weather — present condition, not shape** — italic note explicitly distinguishing state from shape (this is a non-negotiable per `design.md` §3)
9. **Path — where this is moving** — trainable-edge paragraph
10. Footer row: annotate / save as PDF / revisit in 3 months

---

## 7. Tension cards (provenance disclosure)

Per `design.md` §9 and §12.2, every interpretation must be challengeable by the user. The tension card pattern (live in the prototype on Q-S1) is:

- Mono kicker with tension ID and short tag ("A pattern may be present · T-012")
- Serif prose interpretation, written conditionally
- Four buttons: **yes, that's right** / **partly** / **no, not really** / **tell me more**
- Subtle umber-wash background, 1px rule border, no left bar (avoid alert/warning vocabulary)

**"Tell me more"** is required and currently a stub in the prototype — it should expand the card to show which signals contributed (e.g. "compass · truth (rank 1)" + "conviction · adapts under social pressure"). The Inner Constitution `.signals` chip row is the visual reference for how those signals should appear when disclosed.

**Designer's red flag** (from the canvas notes): the four-option confirm prompt risks reading as "the system asking for a grade on the user's own self-report." Watch the copy in user testing — keep it tentative, never accusatory.

---

## 8. Mobile vs desktop

One mental model, two breakpoints. Add the `.sm` class to the artboard root to flip to mobile sizing. Differences (see `styles.css` lines ~590+):

- Reduced head/body/foot padding
- Smaller prompt (17px vs 19px)
- Tighter ranking row (`12px 8px 12px 0`, grid `36px 1fr 28px`)
- Smaller rank numeral (18px)

The 5-item ranking artboards already fit at 520×720 desktop with room to spare; mobile fits at 390×720. The verifier confirmed all three desktop artboards (Q-S1 with tension, Q-C4, Q-X3) measured cleanly with no overflow.

---

## 9. State — what to wire up

State the prototype implies but does not yet model:

- **Per-question rank order** — array of option IDs, persisted on every reorder.
- **Per-tension confirmation status** — `{tensionId: "yes" | "partly" | "no" | "more"}`.
- **Per-tension freeform note** (the tension card supports an optional note field per spec).
- **Per-question freeform/insight answers** — Q-I1, Q-I2, Q-I3 are not in the prototype but exist in canon (`design.md` §3, "Freeform / Insight").
- **Progress** — current card, current question within card, completion state across the eight cards.
- **Persistence signal** — whatever copy you use ("draft", "saving…", "saved") must reflect actual backend state. **Don't display "saved · autosave" until persistence is real.**

The Inner Constitution is generated from the union of the above plus signal/tension logic — out of scope for this handoff (canon engine team owns it).

---

## 10. What is NOT in this handoff

- **`design-canvas.jsx`** and **`tweaks-panel.jsx`** are presentation/exploration scaffolding. Do not port them.
- The slate-blue tweak in `Who Are You.html` (`accent: "#1e4a7a"` and the cool ink overrides in `App`'s `useEffect`) is an exploration knob — **the canonical palette is umber**, defined in `styles.css`.
- Rankings B (slot-tap) and C (tier drop) in `components.jsx` are retired alternatives. Use `RankingA` only.
- The four canon questions are reference data, not the full content set. The canon team owns the full question library; treat what's in `components.jsx` as the format & tone exemplar.
- Animations are minimal by design (only the dragged-row elevation transition). Do not add reveal animations, micro-interactions on hover beyond the row border darkening, or transitional flourishes — see `design.md` §5.1 for the visual register.

---

## 11. Open design calls (your call as you implement)

The prototype draws these out on the canvas, but the choice is intentionally yours and the design team's once you see them in context:

1. **Section title style** — body-map names ("Compass · Heart") vs neutral descriptive vs body part as small tag. Designer's lean: neutral with the body-map living inside the artboard.
2. **Body-part chip in the artboard head** — italic word (current), mono small-caps chip, parenthetical, glyph, or hidden. Designer's lean: parenthetical "Compass *(Heart)*" — most editorial, least labeling.
3. **Tap-to-rank fallback** for accessibility — the spec calls for keyboard reorder; whether to also offer a tap-to-place mode on small touch targets is open.

See `design.md` §13 for the full list of open design questions.
