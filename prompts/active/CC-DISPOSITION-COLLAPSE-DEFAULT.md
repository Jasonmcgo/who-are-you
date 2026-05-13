# CC-DISPOSITION-COLLAPSE-DEFAULT

## Objective
Collapse the "How Your Disposition Reads" section (the OCEAN/Big Five panel including the per-trait paragraphs and the bar chart) by default in user mode. A one-line summary stays visible; the full prose and chart go behind a `<details>` disclosure that the reader can open if they want. Clinician mode renders the section in full as today.

## Rationale (canon)
Across all three live renders 2026-05-13 (Jason / Cindy / Daniel), every trait scores in the high or moderate-high band. One sentence in the section ("Architectural curiosity paired with the giving shape suggests disciplined imagination resolving into form — the early shape of structure-as-purpose") fires verbatim in all three reports — proof that the section is not producing meaningfully differentiated content across archetypes. The OCEAN spec memory positions OCEAN as a secondary disposition layer, not primary. The prose carries engine vocabulary residue ("Your output channel echoes the Work-line we read elsewhere") that resists mechanical cleanup. The section is the weakest part of the user-facing report and is not a candidate for the heavy LLM rewrite in the next prose track. Collapsing by default removes the visible weak point without deleting the engine's underlying disposition output (which still flows into clinician audit metadata and downstream composite reads).

## Sequencing
Independent of CC-LIVE-SESSION-LLM-WIRING and CC-KEYSTONE-USER-MODE-UNCONDITIONAL. Can land in parallel.

## Scope
- lib/renderMirror.ts disposition section emission in user mode.
- The disposition section in markdown output (where the report is rendered to markdown).
- app/components/MirrorSection.tsx or wherever the React surface emits the disposition section, if React surface presentation differs from markdown export.

## Do not
- Modify the OCEAN/disposition calculation in the engine. The underlying signal extraction stays unchanged.
- Remove the section entirely. The full content is still available behind the disclosure.
- Touch clinician mode. Clinician view renders disposition in full as today (no collapse).
- Modify any other section's structure or content.
- Rewrite the disposition prose (out of scope — and the next prose track explicitly does not include this section).
- Bump cache hashes.
- Add new dependencies.
- Change the disposition chart SVG.

## Rules

### 1. User-mode disposition default-collapsed
In user-mode markdown export, the disposition section renders as:

```
## How Your Disposition Reads

*A short one-line summary of the five-signal mix, free of engine vocabulary.*

<details>
<summary>View the full disposition signal panel</summary>

[full current content: lead italic + per-trait paragraphs + bar chart SVG]

</details>
```

### 2. Summary line content
The visible one-liner above the disclosure must be plain English, no borrowed-system labels, no engine vocabulary. Examples (engine picks based on which traits register highest):

- "Your strongest signals are in how you organize your effort and how you take in new things — full panel below."
- "Your disposition reads as steady and structured across the five dimensions the instrument measures — full panel below."

The line stays one sentence, names what the reader gets if they open the disclosure, and avoids "register," "channel," "Work-line," "OCEAN," "Big Five," or any borrowed-system label.

### 3. Clinician mode unchanged
Clinician-mode renders the full disposition section as today — no `<details>` wrapper, no summary substitution. The clinician audit metadata path stays byte-identical to pre-CC baseline.

### 4. Engine output unaffected
The OCEAN/disposition computation, the trait scores, the underlying signals, and any downstream composite reads that consume disposition data continue to operate as today. This CC changes how the section is presented in user mode, not what the engine computes.

### 5. React surface parity
If the React surface (in-app reading view) renders the disposition section, it must honor the same collapse: default-closed disclosure with the summary line visible. The disclosure opens on click.

## Implementation notes
- The `<details>` HTML element is supported in markdown renderers and renders as a native collapsible disclosure in browsers. No JS required.
- If the React render path emits the section through a different component, the collapse should be implemented via a controlled `<details>` (or equivalent) so server-side markdown and React surface stay consistent.

## Audit gates
- User-mode rendered markdown for Jason / Cindy / Daniel:
  - Contains a `<details>` tag wrapping the disposition section content.
  - Contains a one-line summary visible above the `<details>` tag.
  - Summary line contains no "register," "channel," "Work-line," "OCEAN," "Big Five," or any other engine-internal or borrowed-system vocabulary.
- Clinician-mode rendered markdown for the same three fixtures: byte-identical to pre-CC baseline (no `<details>` wrapper, full prose visible).
- OCEAN/disposition engine output is unchanged: same trait scores, same intensity labels.
- 41-fixture sweep stays green.
- React surface (if applicable): default-collapsed disclosure, opens on click.
- tsc + lint clean.
- Cost: $0 (deterministic markup change).

## Deliverables
- Files changed list.
- Before/after user-mode disposition section markdown for Jason fixture.
- Sample summary lines for Jason / Cindy / Daniel.
- Clinician-mode byte-identity confirmation.
- Engine-output equivalence confirmation (disposition trait scores unchanged).
- 41-fixture sweep status.
