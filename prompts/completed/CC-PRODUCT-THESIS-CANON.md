# CC-PRODUCT-THESIS-CANON — Codify the Product Thesis Before Further Prose Work

**Origin:** Clarence + Jason canonized the product thesis on 2026-05-10:

> *Who Are You: The 50° Life is not primarily a personality report. It is a purpose-orientation instrument. The product promise is 50 questions to help a person see their life trajectory, understand the Grip that pulls them off course, and identify the Path that helps them grow with meaning and consequence.*

> *The trajectory image should be the front door. The body cards are depth tools, not the main shareable artifact. Grip explains what holds the person back. Path explains how they uniquely find satisfaction in growth. The final output should help the user articulate, in their own register, why they are here.*

This positioning governs every subsequent architectural and prose decision. This CC codifies it as canonical documentation AND embeds the framing into the LLM system prompts (as architectural anchor, not user-facing copy yet) so all future prose work operates inside it.

**Method discipline:** This is a CANON CC, not a feature CC. No new functionality. No new measurement. No new prose surface for users. Pure documentation + LLM-prompt anchoring. Small scope, but high architectural leverage — every downstream CC consumes this thesis.

**Scope frame:** ~30-60 minutes executor time. CODEX-scale. One new doc file + targeted edits to existing LLM system prompts to embed the thesis as anchor framing.

**Cost surface:** Zero. No LLM calls beyond the existing prompts (which now consume the thesis as comment-block anchor).

---

## Embedded context (CC executor environments don't see Cowork memory)

### What the thesis explicitly displaces

- **Not** "find your type" framing (MBTI, Enneagram, etc.)
- **Not** "discover your strengths" framing (StrengthsFinder, etc.)
- **Not** "fix yourself" framing (most self-help)
- **Not** generic personality assessment

### What the thesis explicitly is

- A **purpose-orientation instrument** — its primary job is helping the user articulate why they are here
- A **trajectory + grip diagnostic** — front-door visual carrier, travelable across audiences
- A **growth-and-release engine** — Path makes growth likely; Grip-naming makes release likely
- A **religious-secular flexible mirror** — serves discovered/constructed/aligned/willed purpose registers without prescribing metaphysics

### The travelable artifact vs the depth tools

| Layer | Job | Travelability | Audience |
|---|---|---|---|
| Trajectory + Grip image | Visual carrier — what people share | High | Anyone the user wants to show |
| Path/Gait card | Personal depth on growth register | Medium | User + close inner circle |
| Body cards (Lens, Compass, Conviction, Gravity, Trust, Weather, Fire) | Depth tools for personal inspection | Low | User alone or with therapist/coach |

### The two-sentence value proposition

> *If people understand more about how they uniquely find satisfaction in growth (Path/Gait), then they're more likely to grow. If they know what and why holds them back (Grip), then they're more likely to release.*

This is the marketing copy. Operational, not descriptive. Serves as the lead value proposition in every future product copy, landing page, or about-page. Cite as the canonical phrasing.

### The purpose question

The instrument's ultimate output answers, in the user's own register: *Why am I here?*

Four registers the instrument serves:
- **Religious users** — purpose discovered (already given, learning to perceive)
- **Secular users** — purpose constructed (shaping through commitment)
- **Spiritual-but-not-religious users** — purpose aligned (tuning to something larger)
- **Atheist users** — purpose willed (asserting meaning into existence)

The architecture is metaphysically neutral. The user's answers determine the *content* of their purpose; the instrument names the *shape* of their reaching.

### Comparison anchors

**Anchors:** ikigai (purpose at intersection of love/skill/world-need/payment), vocational discernment (religious traditions), Spiritual Direction (Ignatian / contemplative), 1 Corinthians 13 love-language (operational diagnostic from spiritual tradition), AA's higher-power frame (universal truths via spiritual vocabulary).

**Anti-anchors:** MBTI (typological collapse), Enneagram (typological collapse, gnostic flavor), StrengthsFinder (output-only, no purpose layer), DISC (workplace-only), Big 5 in isolation (descriptive without directional framing).

The instrument can use diagnostic *content* from any of these. It positions against the typological-collapse pattern.

---

## Architecture

### File map

| File | Action | Purpose |
|---|---|---|
| `docs/canon/product-thesis.md` | NEW | Canonical product thesis doc. The single source of truth for product positioning, value proposition, comparison anchors, and the purpose-register framework. |
| `lib/synthesis3Llm.ts` | MODIFY (system prompt comment block) | Embed the thesis as anchor framing in the SYSTEM_PROMPT. Comment-block at top — visible to LLM, not to users. Tells the LLM what kind of instrument it's writing for. |
| `lib/gripTaxonomyLlm.ts` | MODIFY (system prompt comment block) | Same treatment — thesis embedded as anchor framing. |
| `tests/audit/productThesisCanon.audit.ts` | NEW | Audit assertions: doc file exists with required sections; LLM system prompts contain the canonical thesis lines. |
| `MEMORY.md` (Cowork space) | (not in repo — managed separately) | — |

### `docs/canon/product-thesis.md` structure

The doc file should have these sections (in order):

1. **The thesis** — both Clarence canon paragraphs verbatim
2. **What we are not** — the four "not" statements
3. **What we are** — the four "is" statements
4. **The travelable artifact vs the depth tools** — the table
5. **The two-sentence value proposition** — the canonical phrasing
6. **The purpose question and four registers** — the framework
7. **Comparison anchors and anti-anchors** — the positioning
8. **Architectural rule** — *any future CC that touches user-facing language must consume this thesis as anchor framing*
9. **Provenance** — Clarence + Jason 2026-05-10, CC-PRODUCT-THESIS-CANON

The doc file is checked into the repo at `docs/canon/product-thesis.md`. Future CCs reference it. Marketing/product copy work draws from it directly.

### LLM system prompt anchor block

In `lib/synthesis3Llm.ts` and `lib/gripTaxonomyLlm.ts`, add a comment-block at the very top of the SYSTEM_PROMPT (so the LLM sees it as preamble before the operational instructions):

```
# Product context (anchor — not for user-facing output)

You are composing for Who Are You: The 50° Life — a purpose-orientation instrument.

The product is not a personality report. It is a mirror that helps the user articulate, in their own register, why they are here. The trajectory image is the front door; this prose adds depth to that image. Path explains how the user uniquely finds satisfaction in growth; Grip explains what holds them back; the final output points the user toward purpose without prescribing the metaphysics behind it.

You serve users across four purpose registers — religious (discovered), secular (constructed), spiritual-but-not-religious (aligned), and atheist (willed). The architecture is metaphysically neutral; the user's answers determine the content of their purpose. Your prose names the shape of their reaching without prescribing where purpose comes from.

Never write prose that collapses the instrument into "find your type" or "discover your strengths" framing. Never write prose that requires the user to share a specific theological or metaphysical commitment.

# Operational instructions follow.
```

This block is ~150 words. It's the architectural framing the LLM operates inside. It does NOT change any user-facing output (the operational instructions still produce the same kind of prose). It changes what the LLM is *aiming at* when composing.

### Why embed in system prompts (not just docs)

The LLM doesn't read `docs/canon/`. The system prompt is the LLM's anchor. If we want every prose output to be aimed at the right thesis, the thesis has to be in the prompt.

The doc file serves humans (you, Clarence, future CC executors). The prompt anchor serves the LLM. Both are needed.

---

## Audit assertions (5 NEW)

In `tests/audit/productThesisCanon.audit.ts`:

1. **`product-thesis-doc-exists`** — `docs/canon/product-thesis.md` exists at the expected path.
2. **`product-thesis-doc-sections`** — all 9 required sections are present (regex match on section headers).
3. **`product-thesis-canonical-quote`** — the two Clarence canon paragraphs are present verbatim in the doc.
4. **`product-thesis-llm-prompt-anchor`** — `lib/synthesis3Llm.ts` and `lib/gripTaxonomyLlm.ts` SYSTEM_PROMPT (or GRIP_SYSTEM_PROMPT) contain the anchor block (regex match on the canonical phrase "purpose-orientation instrument").
5. **`product-thesis-no-prose-changes`** — confirm that `lib/renderMirror.ts` and `app/components/InnerConstitutionPage.tsx` show zero diff. CC-PRODUCT-THESIS-CANON is purely additive at the doc + prompt-anchor layer.

---

## Out-of-scope guardrails (DO NOT)

1. **Do NOT modify any rendered prose.** Existing LLM-generated paragraphs stay as they are. Future cohort regeneration may reflect the new anchor framing; that's a downstream effect, not this CC's deliverable.
2. **Do NOT regenerate the cohort cache.** The thesis anchor is a comment block; existing cached paragraphs do not need invalidation. The next time a paragraph regenerates (CC-RELIGIOUS-REGISTER-RULES, CC-CRISIS-PATH-PROSE, etc.), it will pick up the anchor.
3. **Do NOT modify the user-facing report structure.** The chart-as-front-door restructure is a future CC (probably CC-REPORT-RESTRUCTURE), not this one.
4. **Do NOT modify marketing pages, landing pages, about-pages.** The doc is the source; copy work that consumes it is a separate track.
5. **Do NOT add new measurements, signals, or rules.** Pure documentation + prompt anchoring.
6. **Do NOT modify the SYSTEM_PROMPT operational instructions.** Only add the anchor block at the top. Operational instructions stay byte-identical.
7. **Do NOT modify other LLM-prompt files** beyond `synthesis3Llm.ts` and `gripTaxonomyLlm.ts`. Other LLM surfaces that exist (or land later) get the anchor in their own CC.
8. **Do NOT bundle CC-RELIGIOUS-REGISTER-RULES.** That's the next CC. Register vocabulary discipline is separate from product thesis canon.

---

## Verification checklist

- [ ] `npx tsc --noEmit`
- [ ] `npm run lint`
- [ ] `npx tsx tests/audit/productThesisCanon.audit.ts` (new — all 5 assertions pass)
- [ ] All existing audits remain green (no behavior changes)
- [ ] `docs/canon/product-thesis.md` is human-readable, well-structured, and matches the section list above

---

## Report-back format

1. **Summary** — files created/modified, line-count delta.
2. **`docs/canon/product-thesis.md` paste** — full content of the new doc file (so Jason can verify the language is accurate).
3. **System prompt anchor confirmation** — paste the anchor block as inserted in `synthesis3Llm.ts` and `gripTaxonomyLlm.ts`.
4. **Audit pass/fail** — all 5 new assertions + confirmation that existing audits are unchanged.
5. **Out-of-scope verification** — confirm no diffs in operational instructions, render code, or fixture data.

---

**Architectural test for this CC:** future CCs that touch LLM prose should be able to reference `docs/canon/product-thesis.md` as their positioning anchor without re-deriving it. CC-RELIGIOUS-REGISTER-RULES is the immediate next test — its prose vocabulary discipline operates inside the thesis, not in parallel to it.
