# CC-022d — Eight-Card Design Integration *(SUPERSEDED — DO NOT EXECUTE)*

**Status:** Superseded 2026-04-26 by `prompts/active/CC-022d-design-drop-v2.md`.

This earlier draft was authored before the design package landed in the repo at `docs/design_handoff_v2/`. It assumed Claude Design Lab assets would be fetched via API and wired directly into MapSection at small inline sizes. Two architectural problems with the original draft:

1. **Wrong sizing.** It planned to render the SVGs at 64-80px above each Map card heading. The bundle's README is explicit: *"Don't shrink below 96px — the line work falls apart."* Display range is 140-280px with breathing room. The original draft would have under-sized the assets significantly.

2. **Wrong scope.** It tried to do the file-fetch AND the wiring in one CC. The bundle's pre-drafted `CC-XXX-design-drop-v2.md` does just the file moves; the wiring belongs to a separate CC (CC-022e). Splitting them keeps each CC reviewable.

The replacement at `prompts/active/CC-022d-design-drop-v2.md` is a copy of the bundle's pre-drafted file-drop CC, lightly adapted for the actual project state. Pure file moves; no app changes. The wiring CC (CC-022e) lands separately, with the corrected sizing (200-220px in the Map; 48-64px on survey screens) per Jason's Decision A.

---

*The original draft text is preserved below as a historical record. Do not execute it.*

---

(Original draft text preserved at `prompts/active/CC-022d-eight-card-design-integration.md` until the project's housekeeping pass. Both files coexist briefly during the transition; the active version is the design-drop-v2 file. Once the engineer fires CC-022d-design-drop-v2 and the file drop completes, the old draft can be removed entirely.)
