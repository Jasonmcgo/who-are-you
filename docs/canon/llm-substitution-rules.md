# LLM Substitution Rules

*Authored 2026-04-26. Governs any path that sends user-supplied or user-derived session content to a large language model for prose generation, summarization, or classification.*

## Status — gating canon

This document is **gating canon** for any LLM-substitution work in the engine. No LLM call may be added to a code path that ships to a user until:

1. The seven rules below are implementable in code,
2. A vendor has been selected per the criteria in § Vendor selection,
3. A consent UI has been authored and tested,
4. The summarization layer (Rule 2) exists and behaves deterministically.

Drafting is in progress. The rules below are the v0 frame; specific implementation details (which vendor, which consent affordance, exactly what the summarization layer summarizes) are deferred to the CC that implements them. Until that CC ships, the engine remains rule-based.

---

## What this governs

- Any code path that sends user-supplied data (freeform answers, belief anchors, demographic context, the full Answer[] array, the InnerConstitution result) to an LLM, whether for narrative generation, summarization, classification, or any other purpose.
- Both first-party LLMs (run on infrastructure under the project's direct control) and third-party LLMs (commercial APIs from Anthropic, OpenAI, Google, etc.).
- Synchronous LLM calls during a live session and asynchronous post-hoc enrichment of saved sessions.

## What this does NOT govern

- The rule-based prose generation shipped in CC-011, CC-015a, CC-015b, CC-015c. Templated prose is not LLM-substituted and is not subject to this document.
- The save flow's local-only writes to Postgres (CC-019). LLM substitution is a content-generation pathway; persistence is a different layer.
- Demographic interpolation into prose (per amended `demographic-rules.md` Rule 4 — pending revision). Showing back demographic values the user self-supplied is not LLM substitution.
- Manual / out-of-band use of an LLM by the project's researcher (e.g., Jason copying a session into ChatGPT during analysis). The researcher's own use of external tools is outside the engine's scope; this document governs the engine itself.

---

## The seven rules

### Rule 1 — Redaction by default

Freeform user input — particularly Q-I1 / Q-I1b belief anchor text and any future freeform fields — must NOT be passed verbatim to an LLM by default. Any LLM-substitution path receives **summarized**, **paraphrased**, or **signal-only** versions of freeform input unless the user has explicitly consented (per Rule 3) to verbatim use of their text.

The defensible reasoning: belief content is the most personal data the engine collects. The user has trusted the engine with what they actually believe; passing that text to a third-party LLM without consent silently extends that trust to a vendor the user did not choose.

### Rule 2 — Summarization layer

A canonical summarization layer sits between freeform user input and any LLM call. The summarization is **local** (runs on the project's infrastructure, never on a third-party LLM), **deterministic** (the same input produces the same output), and **inspectable** (the user can see exactly what gets passed through).

The summarization layer's logic is documented in code, not learned. Implementations might include: extracting noun phrases, classifying belief-content tags via heuristic keyword matching, producing structured-form representations of freeform answers, or generating short safe summaries via a prompt-template approach. The summarization layer does NOT itself call an LLM — that would be circular.

### Rule 3 — Consent

LLM-substituted prose generation is gated on **explicit per-session consent**, not implicit. The default behavior is rule-based templated prose. LLM substitution requires the user to opt in via a clear consent affordance during or before the session.

The consent UI must present:

- What gets sent to the LLM (concrete examples, not abstract descriptions).
- What is NOT sent (the redaction list per Rule 1).
- What the LLM does with the data (per Rule 5: vendor agreements forbid retention/training).
- How to revoke consent and what revoking means (existing prose stays; future prose reverts to rule-based).

Consent is per-session by default. Cross-session consent persistence (i.e., "remember my consent next time") is a v3+ design call, not authorized here.

### Rule 4 — Logging

What gets sent to the LLM is **logged client-side and shown to the user on request**. There is no invisible telemetry of belief content or any other user data. A logged-in user (when accounts exist; not in v1) can review the log of their own LLM calls. A pre-account user (v1) sees the log within the live session via a debug-style affordance accessible from the result page.

The log includes: timestamp, the LLM vendor, the input sent (post-summarization per Rule 2), the prompt template used, and the output received. No additional metadata.

### Rule 5 — Retention

No LLM-side retention of session content. Vendor agreements must explicitly disable training-on-input and content retention. If a vendor cannot provide this contractually, the LLM path does not use that vendor.

Acceptable vendors are those whose API terms include:

- "Customer content is not used to train models"
- "Customer content is not retained beyond the duration of the API call"
- A clear opt-out from any default-on telemetry

Currently (2026-04): Anthropic's Claude API, OpenAI's API with the appropriate enterprise/zero-retention tier, and several smaller providers meet this bar. The exact vendor selection is a separate decision (§ Vendor selection).

### Rule 6 — Data boundaries

Identifiable user content does not cross any boundary it was not collected to cross. Specifically:

- The eight-card answers (rankings, forced-choice, freeform) are collected to produce the user's reading. They may cross the boundary into an LLM only after redaction (Rule 1) and consent (Rule 3).
- Demographic data is collected to inform prose and (eventually) cultural framing reads. It does not cross into an LLM without the same redaction + consent path.
- The user's name (when specified) is treated with extra caution: name + belief anchor + demographic context together produce a maximally-identifying triple that should not be sent to an LLM verbatim under any circumstances.

Aggregate or anonymized statistics may eventually leave the session boundary in v3+ population work; raw individual responses do not.

### Rule 7 — Editorial guardrails

LLM-generated prose passes through editorial checks before reaching the user. The checks may be implemented as **post-LLM filters**, **prompt constraints**, or both.

The minimum guardrails:

- **Five Dangers protection** — no type-label compression ("INTJ users tend to..."), no stress-as-revelation, no moralizing, no clinical implication, no flat-trait combination. These are the canon's existing protections in `result-writing-canon.md`; any LLM output that violates them is rejected and rule-based prose is rendered instead.
- **Protected lines preserved verbatim** — the canon's lines marked as protected (in `result-writing-canon.md`, `allocation-rules.md`, `keystone-reflection-rules.md`, the v2-coherence-engine memo, etc.) appear verbatim in LLM-generated prose where they are referenced. The LLM does not paraphrase, abbreviate, or replace them.
- **Hedge density appropriate to confidence level** — when the engine's underlying read is high-confidence, language can be more direct ("you have conviction"); when it's low-confidence, more hedged ("the results suggest you may have conviction"). Consistent with the rule-based register.
- **Strong mirror, no gavel** — the canonical voice from `result-writing-canon.md` and the v2 memo. No prosecutorial framing of allocation gaps; no verdicts on belief content; no diagnosis of the user.

The post-LLM filter and the prompt constraints both contribute. A robust implementation uses both: prompt constraints reduce violations at generation time; post-filter catches what slips through. When a violation is detected, the system falls back to rule-based prose for that section.

---

## Approved use cases (Phase 1)

When the rules above are implementable in code, the following use cases are approved for LLM substitution:

1. **Cross-card narrative synthesis** — the "Simple Summary" / Coherence Narrative section that pulls eight cards into one coherent paragraph. Substitutes for templated prose only at the synthesis layer; per-card sections remain rule-based.
2. **Per-card prose polish** — individual card sections (Lens, Compass, etc.) can be LLM-rewritten while preserving the canonical Strength / Trap / Next move structure. The structure is rule-driven; the prose inside the structure can be LLM-substituted.
3. **Demographic-aware prose interpolation** — when demographic context is available and the user has consented, the LLM may weave the demographic context into per-card prose (e.g., naming the user's profession in the Path · Gait Work section). Per Rule 6, raw demographics still don't leave the session boundary without consent.

The following use cases are **not approved** without further design:

- Direct rendering of freeform belief text without redaction (forbidden by Rule 1).
- Demographic field generation — the LLM never invents demographic data the user did not supply.
- Cross-session synthesis — one user's prose informed by another user's data. v3 territory; requires its own canon.
- Cultural framing reads — also v3 territory; requires `aperture-rules.md` to land first.

---

## Vendor selection

The choice of LLM vendor is a separate product decision, gated by these criteria:

- **Privacy posture**: training-on-input disabled by default; zero-retention API tier available; clear data-handling terms.
- **Cost per call**: viable economics at the project's expected session volume (low for v1; potentially significant later).
- **Latency**: tolerable for a synchronous flow (the user is waiting). p95 latency under ~3 seconds for typical inputs.
- **Determinism options**: temperature, top_p, and seed parameters supported; the same input can produce the same output for testing.
- **Reliability**: stable API, mature SDK, good error handling.

The vendor selection is the gating step before any LLM-substitution CC can land. Until then, this document defines what's permitted; the implementation defines how.

---

## Cross-references

- `result-writing-canon.md` — the source of the rule-based prose register and the Five Dangers; LLM output must honor these.
- `allocation-rules.md` — the constraint-first interpretation rule and the non-accusatory tension prose; LLM output must honor these.
- `keystone-reflection-rules.md` — the belief-context prose rules; LLM output must honor these.
- `demographic-rules.md` — the demographics-as-side-data rule; pending revision (Rule 4) to permit demographic interpolation into prose without permitting demographic-derived signal generation.
- `docs/product-direction/v2-coherence-engine.md` — the v2 memo's Coherence Narrative section and the architectural arguments for LLM substitution.
- `docs/product-direction/v3-aperture-and-distance.md` — the v3 memo's reference to this document for cultural-framing and population-baseline LLM use cases.

## Revision history

- 2026-04-26 — Initial draft.
