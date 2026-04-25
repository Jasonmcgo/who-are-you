# Who Are You? — Design Specification

**Status:** Draft 01 — round one of design lab work
**Source of truth for:** ranking primitive, question shell, Inner Constitution layout, type system, color tokens
**Companion files:** `Who Are You.html` (working prototype, drag is real), `components.jsx`, `styles.css` in the design-lab project

This document is the visual + interaction spec. It is intentionally implementation-agnostic; Cowork should translate it into one or more CC prompts (each scoped narrowly per the CC workflow).

---

## 1. Design system

### 1.1 Color tokens

```
--paper:       #f6f2ea   /* page background; warm off-white */
--paper-warm:  #efe9dd   /* secondary surface (autosaved chip) */
--paper-deep:  #e6dece   /* tertiary; rarely used */
--ink:         #1a1713   /* primary text */
--ink-soft:    #433d33   /* secondary text */
--ink-mute:    #807566   /* metadata, kickers */
--ink-faint:   #b8ad9c   /* hairline rules, decorative */
--rule:        rgba(26,23,19,.14)
--rule-soft:   rgba(26,23,19,.08)
--umber:       #8a4a1f   /* the only accent — quiet, oxidized */
--umber-soft:  #a8653a
--umber-wash:  rgba(138, 74, 31, 0.08)
```

**Rules**

- Paper-on-ink, never white-on-black or near-pure-white. The warm off-white is the brand.
- Umber is the *only* accent. No blues, no greens. It marks: kickers ("CARD 09 · SACRED VALUES"), the index-column hairline, the active progress segment, the tension border, primary buttons.
- Never paint a filled colored box behind editable text. The browser will draw a focus ring on focused content; suppress it globally (`*:focus, *:focus-visible { outline: none }`). State is communicated by the index column, not by row fill.

### 1.2 Type pairing

```
--serif: "Source Serif 4", "Source Serif Pro", "Iowan Old Style",
         "Palatino", Georgia, serif;
--mono:  "JetBrains Mono", "IBM Plex Mono", ui-monospace,
         SFMono-Regular, Menlo, monospace;
--sans:  "Inter Tight", system-ui, -apple-system, "Segoe UI", sans-serif;
```

**Roles**

- **Serif** is the voice of the product. Body, prompts, the Inner Constitution, voice quotes in Temperament. Use OpenType features `ss01, onum`.
- **Mono** is the voice of the *system*. Card kickers ("CARD 09 · SACRED VALUES · Q-S1 OF S2"), index numerals (1, 2, 3, 4 in the rank column), tension IDs (T-005), question IDs (Q-S1), buttons. Tracking +0.04em to +0.08em, uppercase for kickers.
- **Sans** is rarely used. Reserved for utility microcopy (autosave chip, tooltip text). Most surfaces don't need it.

**Sizes (desktop / mobile)**

| Role                   | Desktop  | Mobile  |
|------------------------|----------|---------|
| Card kicker (mono)     | 11px     | 11px    |
| Prompt (serif)         | 22–24px  | 18–20px |
| Helper / sub (serif)   | 15px     | 14px    |
| Rank index (mono)      | 22px     | 18px    |
| Rank row text (serif)  | 16px     | 14px    |
| Constitution h1        | 34px     | 26px    |
| Constitution body      | 15.5px   | 15px    |

### 1.3 Spacing

8-unit grid. Card padding: `36px 40px` desktop, `24px 22px` mobile. Row gap inside ranking list: `10px`. Section breaks inside Constitution: `36px 0`.

### 1.4 Hairlines

Use `1px solid var(--rule-soft)` for the index-column divider and the row separator between the head, body, and foot of the question card. Never use shadows for separation.

---

## 2. Page architecture (the question card)

A question screen has three regions. Top to bottom:

```
┌─────────────────────────────────────────────────────┐
│  HEAD                                               │
│  CARD NAME ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    Q-ID   │
│                                                     │
├─────────────────────────────────────────────────────┤
│  BODY                                               │
│  CARD 09 · SACRED VALUES · Q-S1 OF S2  (kicker)     │
│                                                     │
│  Order these by what you'd protect first when       │
│  something has to give.                  (prompt)   │
│                                                     │
│  Four of your own. Rank by which holds first        │
│  when two of them pull apart.            (helper)   │
│                                                     │
│  [ ranking primitive — § 3 ]                        │
│                                                     │
├─────────────────────────────────────────────────────┤
│  FOOT                                               │
│  ← BACK    SAVED · AUTOSAVE       CONTINUE →        │
└─────────────────────────────────────────────────────┘
```

### 2.1 Head

- **Card name** (mono, uppercase, ink-mute) on the left.
- **Progress** in the middle: dashed segments, one per question in the card. Filled umber for completed, ink-soft (solid) for current, ink-faint (dashed) for upcoming. ~6px tall.
- **Question ID** (mono, ink-mute) on the right. Always shown. The system is honest about its index — that is part of the tone.

### 2.2 Body

- 1.5em vertical breathing room between kicker, prompt, helper, ranking primitive.
- Prompt is set in serif, weight 400, letter-spacing -0.005em, `text-wrap: pretty`.
- Helper is muted (ink-soft) and short. One sentence. It is *not* an instruction; it is permission to take time.

### 2.3 Foot

- 56px tall. Three columns: back (mono, ghost), autosave chip (mono, micro), continue (mono, primary).
- Continue is **disabled** until the ranking is complete (every position assigned).
- Autosave chip is "SAVED · AUTOSAVE" by default, "SAVING…" briefly during writes, "SAVED · 2:14 PM" after idle.

---

## 3. The ranking primitive

This is the single ranking interaction across the product. Every ranking question — Sacred Values (Q-S1, Q-S2), Institutional Trust (Q-X3), Responsibility (Q-C4), and the eight Temperament voice rankings (Q-T1…Q-T8) — uses this control. There is no second mode for touch, no fallback dropdown, no tier-bucket alternative.

### 3.1 Anatomy

```
┌──┬──────────────────────────────────────────┬────┐
│ 1│  Freedom — the ability to act without    │ ≡  │
│  │  needing permission.                     │    │
├──┼──────────────────────────────────────────┼────┤
│ 2│  Truth — what's actually so, even when   │ ≡  │
│  │  it costs.                               │    │
├──┼──────────────────────────────────────────┼────┤
│ 3│  Stability — steady ground, for you and  │ ≡  │
│  │  the people who rely on you.             │    │
├──┼──────────────────────────────────────────┼────┤
│ 4│  Loyalty — staying with your people      │ ≡  │
│  │  through what comes.                     │    │
└──┴──────────────────────────────────────────┴────┘
```

Three columns. Left: index (mono, large, ink). Center: row content (serif). Right: grip handle (three short rules, ink-soft).

The **index column carries the rank**. It is not a label, it is *the* state indicator. When a row moves, its index updates. There is no separate badge, no checkmark, no fill.

A 1px hairline (`var(--rule-soft)`) sits between the index column and the row text. Rows are separated from each other by the same hairline. The card has a subtle border (`1px solid var(--rule)`) and 12px corner radius.

### 3.2 Row content

- **Generic ranking row (Sacred Values, Institutional Trust, Responsibility):** one short label (e.g. "Freedom") followed by an em-dash and a one-line gloss. Set in serif, 16px, line-height 1.4. Two lines max.
- **Temperament row (Four Voices):** mono kicker `VOICE A` (ink-mute, 11px, +0.08em tracking, uppercase) above the quote. The quote is set in *serif italic*, 16.5px, line-height 1.45. Two-to-three lines per row is fine — the row grows. Quotes are wrapped in real curly quotation marks and read as first-person speech.

### 3.3 Drag interaction

- **Pointer events**, not HTML5 drag-and-drop. Works identically on mouse and touch.
- Pressing on a row (anywhere — handle or text) initiates drag after a 6px move threshold. No long-press required on touch. The threshold prevents accidental drag from a misread tap.
- During drag: the held row gets a soft elevation (`box-shadow: 0 12px 40px rgba(26,23,19,.18), 0 0 0 1px var(--umber)`), other rows reflow live. The dropped position is wherever the held row's vertical center sits when released.
- Release snaps with a 150ms ease-out transform. The index numerals update on release (not during the drag) — keeps the column visually stable while moving.
- **No animation on initial paint.** The list arrives in the canon-defined order; the user's first move is what starts movement.

### 3.4 Touch specifics

- Grip handle hit area: 44×44pt minimum.
- Disable iOS double-tap zoom on the card (`touch-action: manipulation` on the row, `touch-action: none` on the grip during drag).
- Suppress the iOS tap highlight: `-webkit-tap-highlight-color: transparent`.
- The same control is used at every viewport. There is no swipe-to-stack alternative, no long-press menu.

### 3.5 Keyboard

- Tab focuses the row's grip. Space picks it up; arrow up/down moves it; Space again drops. Escape cancels and restores. Visible focus ring on the grip *only* (a 2px umber outline), never on the row body.
- Screen readers: announce "Item 2 of 4: Freedom. Press space to reorder" and announce position changes verbally on each arrow press.

### 3.6 Empty / partial / complete states

There is no empty state — the ranking arrives pre-populated in the canon order. There is no partial state — every position is always filled, because reordering is a swap, not a placement. The only states are "untouched" (visually identical to "complete") and "complete after at least one move."

The Continue button is enabled the moment the user makes any move *or* explicitly accepts the canon order via a small tap on a "this order is right" pill that appears after 4 seconds of inactivity. (This avoids the pathological case where the canon happens to match the user's preference and they think the system isn't recording an answer.)

### 3.7 Item count rules

- **4 items**: always fits a single viewport on mobile (390pt wide). This is the comfortable case. Sacred Values, Temperament, Q-S2.
- **5 items**: fits desktop comfortably. On mobile, the fifth row pushes against the foot. Acceptable, but the *tail* (positions 4 and 5) is where rankings degrade — users care less. For Q-X3 and Q-C4, the engine should treat positions 1, 2, and (1 vs. 2) as the high-confidence signal and treat 4 and 5 as a low-confidence "also present" pair.
- **6+ items**: do not use this primitive. The interaction breaks down on touch. If a future question wants 6+, design a different control. The product should not silently extend.

### 3.8 What happens after ranking

When the ranking is complete and the user clicks Continue, the page transitions to the next question. The tension-confirmation card (§ 5) only appears at certain canonical moments — not after every ranking. The brief specifies these moments per tension; they should not appear inline on the ranking page.

---

## 4. The Temperament card specifically

Eight Q-T questions, each presenting four first-person statements written in the voice of a different cognitive function. Each question uses the ranking primitive above with the Temperament row variant (mono "VOICE A/B/C/D" kicker + serif italic quote).

**Tone choices**

- The card name shown to the user is **"Four Voices"**, not "Temperament." (Temperament is the canon name; the user-facing label is gentler.) The Q-ID `Q-T1` etc. is still shown.
- The helper line on each Q-T question is identical and short: *"Read each. Order by which most sounds like you."*
- Two ambient breaks at Q-T3 and Q-T6: a single full-bleed page reading "pause. take a breath." in serif italic, with a "ready" button. Not a question; not skippable in flow but skippable by action.

**Why this doesn't feel like a personality exam**

- The reading carries the experience. The ranking falls out of the reading.
- The system never says "you are X." The function-stack inference happens silently and only surfaces as a *signal*, not a label, in the Inner Constitution.
- 8 questions with rest stops is one card's worth, not too heavy. The dashed progress at the head shows "1 of 8" so the user can see the shape of the commitment up front.

---

## 5. The tension-confirmation card

When a tension fires (per the engine's canonical signal rules), the user sees a card immediately after the question that produced the triggering signal. The card uses the same body shell.

**Anatomy**

- Mono kicker: `A PATTERN MAY BE PRESENT · T-005`
- Prompt (serif, italic, slightly larger than question prompt): "This pattern may be present: you value truth, but adapt when social cost is high. Does this feel accurate?"
- Four buttons in a 2×2 grid, mono, equal weight:
  - `yes, that's right`
  - `partly`
  - `no, not really`
  - `tell me more`

The fourth — `tell me more` — is critical. It expands the card to show the signal provenance: which questions fired which signals to surface this tension. The text is the engine's own language, not user-facing prose ("Q-C1 · truth_priority_high · medium"). The point is that the user can audit the move. Users tolerate a pattern they can see inside of.

**Tone**

- Possibility, never declaration. "May be present," "appears to," "seems to." Never "is."
- After the user picks an answer, the card collapses to a one-line note ("noted — partly") and the flow continues. No celebration, no animation beyond the collapse.

---

## 6. The Inner Constitution

The end-of-session artifact. The user reads this once, can revisit it any time, can save it. It is *not* a results page.

### 6.1 Layout

```
┌──────────────────────────────────────────────────────┐
│  INNER CONSTITUTION                    NO. 0041 · v1 │  ← colophon (mono, micro)
│                                                      │
│  A description, not a verdict.                       │  ← h1 (serif, 34px)
│                                                      │
│  for — the reader                                    │  ← dedication (mono, italic)
│                                                      │
│  ┌─                                                  │
│  W│hat follows is not a result. It is a shape your   │  ← lede (drop cap umber)
│   │answers pointed at — the places where two things  │
│  ─┘you appear to care about pull against each other  │
│   and the things you seem to refuse to let go of    │
│   when they do. If a line feels wrong, it probably   │
│   is. You are the final authority.                   │
│                                                      │
│  CORE ORIENTATION                                    │  ← h4 mono, ink-mute
│  You appear to prioritize truth and independence...  │  ← body serif
│                                                      │
│  · · ·                                               │  ← divider (letter-spaced)
│                                                      │
│  CONFIRMED TENSIONS                                  │
│                                                      │
│  │ T-005 · CONFIRMED                                 │  ← umber left-rule
│  │ Truth vs. Belonging                               │  ← h3 serif italic
│  │ You ranked truth in the top of Q-S1 and...        │
│  │ · truth_priority (rank 1)  · adapts_under...      │  ← signals (mono micro)
│                                                      │
│  · · ·                                               │
│                                                      │
│  SACRED VALUES                                       │
│  From Q-S1 and Q-S2, in the order you ranked them:   │
│    truth, freedom, stability, loyalty                │
│                                                      │
│  ─────────                                           │
│  [annotate]  [save as PDF]  [revisit in 3 months]    │
└──────────────────────────────────────────────────────┘
```

### 6.2 Rules

- Set in serif throughout. Mono only for kickers (`CONFIRMED TENSIONS`, `T-005 · CONFIRMED`), signals (`truth_priority (rank 1)`), and the colophon.
- Each tension block has a 2px umber left rule and 20px left padding. No box, no fill.
- The signals line below each tension is mono, 10–11px, ink-mute, separated by ` · `. This is the signal provenance — present in the document by default but tweakable off.
- Sacred Values are listed as serif italics inline; not bulleted.
- Buttons in the footer are mono, ghost styling, 2px umber border on hover.
- The Constitution scrolls. It is a single article. It does not paginate, does not split into tabs.

### 6.3 What it doesn't do

- No type label ("you are an INTJ"). MBTI surface labels live in canon, but they are not shown by default. They appear, if at all, as an optional disclosure under a "what shorthand fits this?" pill — never as the headline.
- No score, no percentage, no chart.
- No share button (per brief — no social sharing in v1).
- No avatar, no chatbot framing.

---

## 7. Data shapes

### 7.1 Ranking question (new question type)

```ts
type RankingQuestion = {
  question_id: string;          // "Q-S1"
  card_id: CardId;              // "sacred"
  type: "ranking";              // new variant alongside "forced" and "freeform"
  text: string;                 // the prompt
  helper?: string;              // the "Four of your own…" sub-line
  items: Array<{
    id: string;                 // "freedom"
    label: string;              // "Freedom"
    gloss?: string;             // "the ability to act without needing permission."
    voice?: string;             // Temperament-only: "Voice A"
    quote?: string;             // Temperament-only: replaces label+gloss
    signal: SignalId | null;    // which signal this carries when ranked at position 1
  }>;
};
```

Note the union shape: a Temperament item uses `voice` + `quote`, a generic item uses `label` + `gloss`. The renderer picks based on which is present.

### 7.2 Ranking answer

```ts
type RankingAnswer = {
  question_id: string;
  card_id: CardId;
  question_text: string;
  type: "ranking";
  // The user's order — array of item ids, position 0 = ranked first.
  order: string[];
};
```

The engine reads `order` to derive signals: position-1 emits the item's `signal` at high strength, position-2 at medium, the rest as "also present" at low strength. Specific mapping rules belong in canon, not here.

### 7.3 Migration

Five questions in `data/questions.ts` should change from `forced` to `ranking`:

- **Q-S1** — "If you could only protect one, which would it be?" → "Order these by what you'd protect first when something has to give." 4 items: Freedom, Truth, Stability, Loyalty.
- **Q-S2** (already ranking-shaped in canon) — "Order these by which has the strongest claim on you." 4 items: Family, Knowledge, Justice, Faith.
- **Q-X3** (new) — "Rank these institutions from most to least trustworthy." 5 items: Government, Press, Employers, Education, Non-Profits & Religious organizations.
- **Q-C4** (new) — "When something goes wrong, rank where the responsibility most often sits." 5 items: Individual, System, Nature, Supernatural, Authority.
- **Q-T1 through Q-T8** — Temperament. Each: 4 voice statements per the Temperament canon. Voice quotes live in `docs/temperament-voice-draft-v1.md`.

The current Q-S1 forced-choice version should be retired (single-protection forced choice produces a thinner signal than the ordering).

---

## 8. Open calls (designer's read)

These are positions the design lab is taking. Cowork should react and override before any are translated into CC prompts.

1. **One ranking primitive, every device.** Drag-to-reorder is the control everywhere. We considered a tier-bucket alternative for touch and rejected it — splitting the interaction by device fragments the mental model and doubles testing surface. The pointer-events implementation works on both with a single code path.
2. **5 items is the cap.** No question should request a 6+ ranking. If a future question wants more options, we should split it or design a different control — never silently extend this one.
3. **The tail is structurally low-confidence at 5 items.** The engine should weight position-1 and position-2 (and their relative order) heavily, and treat positions 4 and 5 as "also present." This shapes the ranking experience honestly: the user is not asked to manufacture certainty about what they care about least.
4. **Temperament is "Four Voices" to the user.** The card name shown is "Four Voices." The function-stack inference (and any MBTI-shorthand surface label) lives only in the engine and the optional disclosure in the Inner Constitution.
5. **Browser focus ring is suppressed.** State is communicated by the index column, the umber rule, and the dropped-row elevation. The browser's default focus outline competes with that and looks like a bug. Replace it with an explicit umber ring on the grip handle only, for keyboard users.
6. **`tell me more` on tension cards is a hard requirement.** The signal-provenance disclosure is what makes the engine feel honest rather than oracular.
7. **The Constitution is one document, not a results dashboard.** No charts, no scores, no type labels by default. Everything that wants to be a chip is a sentence instead.

---

## 9. Translation notes for Cowork

A reasonable CC slicing of this spec:

- **CC-A — Ranking primitive (component + types).** Add `"ranking"` to the question type union, define `RankingQuestion` and `RankingAnswer`, build the component (pointer-events drag, keyboard reorder, 44pt grip target), wire it into the question renderer in `app/page.tsx`. Bound to `lib/types.ts`, a new `app/components/Ranking.tsx`, `app/page.tsx`. No engine changes.
- **CC-B — Migrate Q-S1, add Q-S2, Q-X3, Q-C4.** `data/questions.ts` only. New ranking questions, retire the forced-choice Q-S1. No engine changes (engine continues to derive signals as before from existing forced/freeform; ranking signals are a follow-up).
- **CC-C — Engine: derive signals from ranking order.** `lib/identityEngine.ts`. Position-1 → high, position-2 → medium, tail → low. Wire into `deriveSignals`. Update canon `signal-mapping-rule.md` to document.
- **CC-D — Type system: tokens, fonts, globals.** `app/globals.css` (or split into a tokens file imported there). Add the color and font tokens. Suppress focus rings. Set body font.
- **CC-E — Question shell.** New `app/components/QuestionShell.tsx` with head/body/foot, dashed progress segments, autosave chip, back/continue. Refactor `app/page.tsx` to use it.
- **CC-F — Tension card.** `app/components/TensionCard.tsx`. Replaces the current confirmation block in `page.tsx`. Adds the `tell me more` provenance disclosure.
- **CC-G — Temperament card (Four Voices).** Eight Q-T questions, two ambient breaks. Probably one CC; it is its own card.
- **CC-H — Inner Constitution layout.** `app/components/Constitution.tsx`. Replaces the current result block. The drop cap, the umber-rule tensions, the colophon, the action footer.

Each CC should be sized so it can be reviewed in one sitting and tested against `npx tsc --noEmit` and `npm run lint` cleanly. The order above is a suggestion; CC-A through CC-D are the foundation and should land first.

---

## 10. Reference prototype

The prototype in the design-lab project (`Who Are You.html`) is a working render of every screen described in this spec at desktop and mobile widths. It is not Next.js; it is React via Babel + a small CSS file. Treat it as a faithful pixel reference but do not lift the code directly — the production stack has its own conventions (Next.js + Tailwind), and the move from CSS-variables-on-elements to whatever token strategy the team chooses for Tailwind is a CC author's decision.

Files to read when translating:

- `Who Are You.html` — page structure, canvas of every screen
- `components.jsx` — `RankingA` (the primitive), `QuestionPage` (the shell), `ConstitutionPage` (the artifact), question data shapes
- `styles.css` — every token and class referenced above

End of spec.
