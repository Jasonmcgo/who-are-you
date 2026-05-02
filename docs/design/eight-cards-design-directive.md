# Eight Body-Map Cards — Design Directive

*For Claude Design Lab. One SVG asset per card; consistent visual family across all eight. Use this brief verbatim or paraphrased; the per-card paragraphs are the anchors.*

---

## Visual Family Constraints (apply to all eight)

- **Format**: SVG, square canvas. Suggest 240×240 or 320×320 viewBox. Transparent background.
- **Line weight**: consistent across all eight, ~2-3px at the baseline. Don't vary stroke weight between cards; the family identity comes from line-weight consistency.
- **Palette**: monochrome line-art. Single ink color in the project's deep umber-brown register (`var(--ink)`). Optional single accent color for one focal element per card if needed (`var(--umber)`); otherwise stay single-color.
- **Style register**: serious, considered, slightly archaic — closer to **medical illustration**, **alchemical diagrams**, or **vintage anatomical plates** than to modern UI iconography or playful illustration. The cards are reflections on the human, not decorative chrome. Avoid cartoonish, avoid clinical-photographic, avoid neon / corporate / startup-tech aesthetic. Aim for the register of an old anatomy textbook redrawn with modern restraint.
- **No gradients, no realistic shading, no photorealism, no patterned fills.** Pure line work. Flat. Structural.
- **Center the metaphor in the canvas.** Modest negative space around the figure. Each card should feel composed, not crowded.
- **Each card is self-contained.** No connective tissue, no card-to-card visual reference. Side-by-side they should read as a family, but each individually should stand on its own.

The cards illustrate metaphors, not literal anatomy. Aim for evocative + structurally clear over realistic.

---

## Per-Card Directives

### 1. Lens · Eyes — *The gaze the user brings before the world tells them what to see*

A stylized human eye, slightly elongated horizontally, with the iris drawn in detail (radial striations) and the lids deliberately rendered. Focus is on the pupil — perhaps a subtle radial pattern of fine concentric or radiating lines suggesting attention reaching outward from inside. Closer in spirit to a botanical illustration of a flower's center than to a realistic eye photograph. **Emotional register**: alert, considered, observant — the kind of eye that's already seeing the pattern before the room has finished forming.

### 2. Compass · Heart — *What the user protects when something has to give*

A heart shape, anatomically-flavored rather than cartoonish (closer to a medical-textbook outline than to a valentine card). Inside the heart, or overlaid through it, a compass rose with cardinal points marked — the needle pointing decisively in one direction. The heart and compass should merge so that the heart IS the compass; not heart-with-compass-decoration. **Emotional register**: directional, weighted, anchored — the moral center that tells you where north is when something has to give.

### 3. Conviction · Voice — *How the user speaks and holds belief under pressure*

A stylized human throat / larynx area, viewed from the front, with three to five short vibration arcs emanating outward suggesting sound carrying. The throat shape itself should be clean line work, the vibration arcs should suggest weight rather than chirpiness — not a microphone graphic, not a cartoon speech bubble. The voice this represents has cost. **Emotional register**: declarative, weighted, costly — the kind of voice that doesn't speak casually.

### 4. Gravity · Spine — *Where responsibility lives when something goes wrong*

A stylized human spine, viewed from the back, vertical, rendered as a column of connected vertebrae from top to bottom (suggest 8-12 vertebrae). A horizontal weighted bar resting across the upper portion (across the shoulders), suggesting the load it bears. The spine should read as load-bearing structure, not as anatomy diagram. **Emotional register**: structural, accountable, weight-carrying — the column that stays upright under load.

### 5. Trust · Ears — *Whose truth the user lets in*

A stylized human ear, viewed from the side, with the inner whorl (helix → antihelix → tragus → lobe) rendered in clean continuous line-work. Three to four concentric sound-wave arcs entering the ear from outside (left side of the canvas, suggesting incoming truth). The ear is receptive, not just decorative. **Emotional register**: receptive, listening, discerning — the channel through which truth reaches the self.

### 6. Weather · Nervous System — *Current load and old adaptations*

Branching pathways — a single trunk at the bottom that splits into progressively finer branches as it rises. The branches could read as neural fiber under a microscope OR as a stylized lightning fork OR as the wind-pattern of a storm front; the metaphor is *body-as-weather-system*, atmospheric and reactive. Add a small node-cluster at one of the branching points to suggest a signaling intersection. **Emotional register**: responsive, conditioned, atmospheric — the body that's been answering questions about its environment for a long time.

### 7. Fire · Immune Response — *How the user responds when something costs them*

A stylized flame contained within or emerging from a cell-shaped form (antibody Y-shape, lymphocyte silhouette, or simple cellular outline). The flame is small, focused, contained — *defensive activation*, not destruction. Alternatively: a single antibody Y-shape with a small flame at the joint or apex. The metaphor is the body's response under threat — vigilant, activated, mobilized. **Emotional register**: vigilant, activated, defensive — the system that comes online when belief or value is challenged.

### 8. Path · Gait — *How this shape moves through work, love, and giving*

Three to four stylized footprints in a forward direction, alternating left-right (so the viewer reads forward motion), receding slightly into the canvas to suggest depth. Each footprint is anatomically-flavored (heel + ball + toes visible) but not realistic — closer to a beach-sand impression in clean line work than to a forensic footprint diagram. **Emotional register**: kinetic, ongoing, directional — the rhythm of a life moving through its days.

---

## Notes for the designer

- The eight cards will be embedded in a typeset web page. They should feel like editorial anatomical plates inside a serious book, not like product icons or app interface chrome.
- Each card metaphor is also a body part — *Lens · Eyes*, *Compass · Heart*, etc. The body part is the literal anatomical anchor; the card name is the metaphorical role. Both should be readable in the visual: someone glancing at the Compass · Heart card should see *a heart* and recognize *a compass*, then realize they're the same thing.
- The metaphor is *body-as-self-reading-instrument*. The cards are illustrations of how a person reads themselves — through their eyes, their heart, their voice, their spine, their ears, their nervous system, their immune response, their gait. The whole instrument is the body.
- If any card produces 2-3 SVG variants during exploration, please share all of them. The right one for each card may not be the first one.

If a card's metaphor is fighting you, the emotional register is the more important constraint than the literal body part. Preserve the *register* (serious, considered, weighted, archaic) and adapt the literal anatomy as needed.
