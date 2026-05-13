# CC-RELIGIOUS-REGISTER-RULES — Vocabulary Discipline for the LLM Prose Layer

**Origin:** Jason canonized on 2026-05-10:

> *"AA uses 'God and the Bible' to help folks through addiction without organized religion — the truths are true. Pauline love language doesn't appear to knock someone over the head with New Testament, and candidly, the love language is quite wise, and has endured the test of time."*

The instrument carries spiritual-tradition diagnostic frameworks (7 Primal Questions, Soul/Goal/Give synthesis, Compass values including Faith) without requiring theological commitment. The Soul/Spirit axis stays load-bearing; the vocabulary stays accessible to religious, secular, spiritual-but-not-religious, and atheist users alike.

This CC codifies the vocabulary rules into the LLM prose layer. *Ancient wisdom, universal access* — every existing LLM prose surface (Path master synthesis, Grip taxonomy paragraphs) gets the register discipline baked in. CC-CRISIS-PATH-PROSE depends on this landing first, because crisis-register prose is the highest-stakes language the instrument writes.

**Method discipline:** Engine for truth. LLM for reception. The register rules are deterministic constants (banned phrases, allowed-with-care patterns) embedded in the LLM system prompts. Audit asserts on banned-phrase absence in the cached cohort. The wedding-readout test is a human-judgment audit gate (sample-review cadence — establish in this CC, automate later).

**Scope frame:** ~1-2 hours executor time. CC-standard scale. New constants module + targeted edits to existing LLM system prompts + audit + cohort regeneration to verify no banned phrases slipped through.

**Cost surface:** ~$0.50 cohort regeneration (synthesis3 master paragraphs + grip taxonomy paragraphs). Existing cached entries regenerate because system prompts change → input hashes change → cache invalidation by design.

---

## Embedded context (CC executor environments don't see Cowork memory)

### The vocabulary discipline (the load-bearing tables)

#### KEEP — load-bearing categories of human experience that don't require metaphysical commitment

| Term | How to use | What to avoid |
|---|---|---|
| Soul | A category of interior life — the part that loves, grieves, aspires. Use as common-experience noun. | Don't define it. Don't argue for or against dualism. Don't tie to immortality. |
| Calling | The experience of pull toward purposeful direction. | Don't require a Caller. Don't tie to vocation/career exclusively. |
| Grace | The experience of unearned reception or unexpected mercy. Use sparingly and operationally. | Never as theological doctrine. Never quote scripture. |
| Faith | The structure of belief and trust the user holds. The user's answers determine the content. | Don't presume Christian/Jewish/Muslim default. Faith ≠ religion. |
| Honor | A Compass value — what the user is willing to bear cost to protect. | Don't tie to specific religious traditions. |
| Love | The Pauline operational definition (patient, kind, refuses to keep records, etc.) — the diagnostic content travels regardless of source. | Don't quote 1 Corinthians 13 directly; use the diagnostic substance. |
| Gift | A capacity given to a person, named without theological framing. | Don't say "gift from God" unless the user's own register has established it. |
| Mercy | An experience of being met without earning it. Use rarely. | Avoid theological resonance ("the Lord's mercy"). |
| Stewardship | A relationship of caring for what is not yours to keep. | Avoid "stewards of God's creation" framing. |
| Conviction | The shape of held belief under cost. | Already in active use; keep neutral. |
| Mission | A long-arc orientation toward purposeful work. | Avoid "missionary" framing. |
| Discernment | The capacity to read what's true under uncertainty. | Already in active use; keep neutral. |

#### AVOID — vocabulary that excludes by signaling tribal religious identity

**Banned phrases (audit-enforced absence in cached prose):**

- "the Lord," "Lord Jesus," "Christ," "the Father" (and any divine pronouns: "He," "Him," "His" referring to God)
- "the Bible," "Scripture," "Scriptures," "God's word," "Holy Writ"
- "Holy Spirit," "the Spirit" (when functioning as agent)
- "spiritual warfare," "principalities and powers"
- "salvation," "redemption" (in soteriological sense — "redemptive arc" as metaphor is fine if used carefully)
- "worship," "prayer," "praise" (as required practices)
- "sin," "sinful," "fallen nature," "original sin"
- "born again," "saved," "the elect," "covenant" (in religious sense)
- Direct scripture quotation patterns ("As [book] [chapter]:[verse] says...", "It is written...")
- Sermon vocabulary cadences ("Beloved, ...", "And we read in...", "The truth of...")
- Specific religion names in non-neutral framing ("Christianity teaches," "Buddhism says," "Islam holds") — fine to mention as sources of comparative wisdom; not fine to assert as authoritative
- "God" as bare noun (replace with the user's own register if known; otherwise rephrase to avoid)

**Allowed-with-care:**

The KEEP list above. Plus general humanistic/philosophical vocabulary (meaning, purpose, presence, love, hope, courage, integrity, wisdom, peace) that travels regardless of register.

### The wedding-readout test

A paragraph passes if it can be read aloud at a secular wedding without anyone registering it as religious.

- Pauline love language passes (because the diagnostic substance travels): *"love is patient, love is kind"* — secular weddings quote this.
- *"May the Lord guide your steps"* fails.
- *"Your conviction is real and costly"* passes.
- *"Like the prodigal son, you may be returning"* fails.

This is the audit gate. CC-RELIGIOUS-REGISTER-RULES establishes the test as a sample-review cadence — every CC that ships LLM-touched prose includes 5 representative paragraphs in its report-back for the wedding test. Future CCs may automate detection beyond banned-phrase regex; this CC ships the regex baseline.

### The four-register flexibility on purpose

The instrument's read on purpose is metaphysically neutral. Different users place the same read on different metaphysical foundations:

- Religious: purpose discovered (already given)
- Secular: purpose constructed (through commitment)
- Spiritual-but-not-religious: purpose aligned (tuned to something larger)
- Atheist: purpose willed (asserted into existence)

Prose must NOT collapse purpose into one of these. It must name the *shape* of the user's reaching for purpose; the user's own register determines the *content*.

### Why Soul stays load-bearing

Lowering "Soul" to "Care-line" or "Heart-axis" would protect against religious overload but lose the depth that makes the instrument distinctive. Most personality tools refuse spiritual vocabulary entirely; this one is one of the few that engages it with care. The depth is the moat. Keep "Soul." Same for "Faith" as Compass value name — keep.

---

## Architecture

### File map

| File | Action | Purpose |
|---|---|---|
| `lib/proseRegister.ts` | NEW | `BANNED_PHRASES`, `ALLOWED_WITH_CARE`, regex matchers, `auditProseForBannedPhrases()` function. |
| `lib/synthesis3Llm.ts` | MODIFY | Add register-rules block to SYSTEM_PROMPT (after the product-thesis anchor block from CC-PRODUCT-THESIS-CANON). Banned-phrase list embedded inline in the prompt. |
| `lib/gripTaxonomyLlm.ts` | MODIFY | Same treatment — register-rules block added to GRIP_SYSTEM_PROMPT. |
| `tests/audit/proseRegister.audit.ts` | NEW | Audits cached cohort prose for banned-phrase absence; reports any flagged outputs. |
| `lib/cache/synthesis3-paragraphs.json` | REGENERATE | Input hashes change because system prompts change. |
| `lib/cache/grip-paragraphs.json` | REGENERATE | Same. |

### `lib/proseRegister.ts` structure

```ts
// CC-RELIGIOUS-REGISTER-RULES — vocabulary discipline for LLM prose surfaces.

export const BANNED_PHRASES: ReadonlyArray<{ pattern: RegExp; reason: string }> = [
  { pattern: /\bthe Lord\b/i, reason: "tribal religious vocabulary" },
  { pattern: /\bLord Jesus\b/i, reason: "tribal religious vocabulary" },
  { pattern: /\bChrist\b/i, reason: "tribal religious vocabulary" },
  { pattern: /\bthe Father\b/i, reason: "divine address" },
  { pattern: /\bthe Bible\b/i, reason: "tribal religious vocabulary" },
  { pattern: /\bScripture[s]?\b/i, reason: "tribal religious vocabulary" },
  { pattern: /\bGod['']s word\b/i, reason: "tribal religious vocabulary" },
  { pattern: /\bHoly Spirit\b/i, reason: "tribal religious vocabulary" },
  { pattern: /\bthe Spirit\b/i, reason: "ambiguous; defaults religious — rephrase" },
  { pattern: /\bspiritual warfare\b/i, reason: "tribal religious vocabulary" },
  { pattern: /\bprincipalities and powers\b/i, reason: "scripture-derived idiom" },
  { pattern: /\bsalvation\b/i, reason: "soteriological vocabulary" },
  { pattern: /\bborn again\b/i, reason: "soteriological vocabulary" },
  { pattern: /\bsaved\b(?=.*\b(by|through|in)\b)/i, reason: "soteriological vocabulary" },
  { pattern: /\bsinful\b/i, reason: "theological framing" },
  { pattern: /\bfallen nature\b/i, reason: "theological framing" },
  { pattern: /\boriginal sin\b/i, reason: "theological framing" },
  { pattern: /\bthe elect\b/i, reason: "soteriological vocabulary" },
  { pattern: /\bworship\b/i, reason: "religious-practice prescription" },
  { pattern: /\bprayer\b/i, reason: "religious-practice prescription" },
  { pattern: /\bAs .{1,40} (\d+:\d+) says\b/i, reason: "scripture quotation pattern" },
  { pattern: /\bIt is written\b/i, reason: "scripture quotation pattern" },
  { pattern: /\bBeloved,\b/, reason: "sermon-vocabulary cadence" },
  // Note: bare "God" handled separately — see GOD_USAGE_RULE below.
];

// Bare "God" requires context. Allowed in user-quote passthrough; banned in
// LLM-generated narration unless the user's freeform answers establish their
// own register first. The audit flags any "God" in cached prose for review.
export const GOD_USAGE_RULE = {
  pattern: /\bGod\b/,
  reason: "bare 'God' requires user-register grounding; flag for review",
};

export const ALLOWED_WITH_CARE = [
  "soul", "calling", "grace", "faith", "honor", "love", "gift",
  "mercy", "stewardship", "conviction", "mission", "discernment",
  "presence", "purpose", "wisdom", "peace", "hope", "courage", "integrity",
];

export function auditProseForBannedPhrases(prose: string): {
  passed: boolean;
  violations: Array<{ phrase: string; reason: string; index: number }>;
  godFlags: Array<{ context: string; index: number }>;
} {
  // ... regex-walk implementation
}
```

### LLM system prompt register-rules block

In `synthesis3Llm.ts` and `gripTaxonomyLlm.ts`, inserted *after* the CC-PRODUCT-THESIS-CANON anchor block and *before* the operational instructions:

```
# Vocabulary register (anchor — absence-enforced via audit)

You serve users across religious, secular, spiritual-but-not-religious, and atheist registers. Your prose carries spiritual-tradition diagnostic content (Soul, Calling, Grace, Faith, Stewardship) without requiring theological commitment. Use the Pauline-love precedent: the diagnostic substance ("patient, kind, refuses to keep records") travels through secular weddings precisely because it doesn't quote scripture; it lets the wisdom be received without forcing the source to be accepted.

KEEP — load-bearing diagnostic vocabulary, accessible to all registers:
soul · calling · grace · faith · honor · love · gift · mercy · stewardship · conviction · mission · discernment · presence · purpose · wisdom · peace · hope · courage · integrity

AVOID — tribal religious vocabulary that excludes:
"the Lord" · "Lord Jesus" · "Christ" · "the Father" · divine pronouns (He/Him/His for God) · "the Bible" · "Scripture" · "God's word" · "Holy Spirit" · "the Spirit" as agent · "spiritual warfare" · "principalities and powers" · "salvation" · "born again" · "saved" (in soteriological sense) · "sinful" · "fallen nature" · "original sin" · "the elect" · "worship" · "prayer" · scripture quotation patterns ("As [book] [chapter]:[verse] says...") · sermon vocabulary cadences ("Beloved, ...", "And we read in...") · bare "God" without user-register grounding

The wedding-readout test: every paragraph you write should be readable at a secular wedding without anyone registering it as religious. Pauline love language passes; "May the Lord guide your steps" fails.

The four purpose registers: religious users hear purpose as discovered; secular users hear it as constructed; spiritual-but-not-religious users hear it as aligned; atheist users hear it as willed. Your prose names the SHAPE of the user's reaching for purpose; the user's own register determines the CONTENT. Never collapse purpose into one metaphysical register.
```

This block is ~250 words. Embedded as preamble before operational instructions.

---

## Audit assertions (8 NEW)

In `tests/audit/proseRegister.audit.ts`:

1. **`prose-register-module-exists`** — `lib/proseRegister.ts` exists with required exports.
2. **`prose-register-banned-phrases-comprehensive`** — `BANNED_PHRASES` covers all 22+ entries from the avoid-list above (assertion checks for specific entries; future additions are CC scope).
3. **`prose-register-llm-prompts-anchor`** — both `synthesis3Llm.ts` and `gripTaxonomyLlm.ts` SYSTEM_PROMPTs contain the register-rules block (regex match on the canonical phrase "wedding-readout test").
4. **`prose-register-cohort-banned-phrase-absence`** — every cached paragraph in `lib/cache/synthesis3-paragraphs.json` and `lib/cache/grip-paragraphs.json` passes `auditProseForBannedPhrases()`. Hard-fail if any banned phrase fires.
5. **`prose-register-bare-god-flag`** — every cached paragraph is scanned for bare "God"; if any fire, list them in the audit output (warning, not hard-fail; for human review).
6. **`prose-register-keep-list-non-empty-coverage`** — at least 5 of the KEEP-list terms appear across the cached cohort (sanity check that the LLM is using diagnostic vocabulary, not avoiding it entirely).
7. **`prose-register-cache-regenerated`** — cache file mtimes confirm regeneration happened in this CC.
8. **`prose-register-no-render-changes`** — confirm `lib/renderMirror.ts` and `app/components/InnerConstitutionPage.tsx` show zero diff.

In `tests/audit/synthesis3.audit.ts` (extension):
- Add 1 assertion that the SYSTEM_PROMPT contains the register-rules anchor block.

In `tests/audit/gripTaxonomy.audit.ts` (extension):
- Add 1 assertion that the GRIP_SYSTEM_PROMPT contains the register-rules anchor block.

---

## Cohort regeneration

After the prompts change, regenerate both caches:

```
ANTHROPIC_API_KEY=$(grep ^ANTHROPIC_API_KEY .env.local | cut -d= -f2) npx tsx scripts/buildSynthesis3.ts --force
ANTHROPIC_API_KEY=$(grep ^ANTHROPIC_API_KEY .env.local | cut -d= -f2) npx tsx scripts/buildGripTaxonomy.ts --force
```

Expected outcome:
- All 24 synthesis3 paragraphs regenerate (~$0.30)
- All 11 grip paragraphs regenerate (~$0.20)
- Total ~$0.50 cohort regeneration
- Banned-phrase absence audit passes on the new cache

---

## Sample-review cadence (operational rule, not code)

This CC establishes the wedding-readout test as a sample-review cadence:

**Rule:** every CC that ships LLM-touched prose includes 5 representative paragraphs in its report-back for the wedding test.

The CC executor (Codex/Claude Code) selects 5 paragraphs that span the cohort's shape variety (different Primals, different Compass profiles, different Movement quadrants). Jason or Clarence reviews them for tribal-religious markers the regex didn't catch. Findings flow back as `feedback_*` memory entries that may add new banned-phrase regexes in future CCs.

This is a HUMAN audit gate. It cannot be automated yet; the regex catches obvious markers but not subtle register drift (e.g., a paragraph that's grammatically secular but rhetorically sermon-cadenced). Establish the cadence here; automate as data accumulates.

---

## Out-of-scope guardrails (DO NOT)

1. **Do NOT modify any existing LLM operational instructions.** Only ADD the register-rules anchor block. Operational instructions stay byte-identical.
2. **Do NOT modify the user-facing report structure or render code.** This is a prose-layer CC; render layer is untouched.
3. **Do NOT add new measurements, signals, or rules.** Pure vocabulary discipline.
4. **Do NOT remove "Soul," "Faith," or any other KEEP-list term from the engine.** They stay load-bearing. Don't translate them away.
5. **Do NOT modify the existing banned-phrase lists in CC-GRIP-CALIBRATION or CC-GRIP-TAXONOMY system prompts.** Those are CC-specific bans (architecture-narration prevention); this CC adds a register-discipline ban list that composes alongside, not replaces.
6. **Do NOT bundle CC-CRISIS-PATH-PROSE.** Crisis-register prose is the next CC after this one; it consumes the register rules but does not bundle with them.
7. **Do NOT modify `feedback_*` memory entries** outside this CC's scope.
8. **Do NOT add Compass values, change Compass label rendering, or modify the Faith disambiguation logic.** Compass scaffold stays as-is.

---

## Verification checklist

- [ ] `npx tsc --noEmit`
- [ ] `npm run lint`
- [ ] `npx tsx tests/audit/proseRegister.audit.ts` (new — all 8 assertions pass)
- [ ] `npx tsx tests/audit/synthesis3.audit.ts` (extended — pass)
- [ ] `npx tsx tests/audit/gripTaxonomy.audit.ts` (extended — pass)
- [ ] All other existing audits remain green
- [ ] Cohort regeneration runs cleanly; cache files updated
- [ ] No banned-phrase violations in regenerated cache
- [ ] 5 sample paragraphs selected and pasted in report-back for wedding-test review

---

## Report-back format

1. **Summary** — files added/modified, line-count delta, audit pass count.
2. **`lib/proseRegister.ts` paste** — full module content (so Jason can review the regex list).
3. **System prompt anchor confirmation** — paste the register-rules block as inserted in both prompt files.
4. **Cohort regeneration outcome** — count of paragraphs regenerated, cost actual, banned-phrase violation count (should be 0).
5. **Bare "God" flags** — list any cached paragraphs that contain bare "God"; flag for human review.
6. **5 sample paragraphs for wedding-test** — selected for shape variety. Paste each with fixture name + Primal cluster + Compass top values. Jason / Clarence will review for tribal-religious markers.
7. **Audit pass/fail breakdown** — every audit listed in the verification checklist.
8. **Out-of-scope verification** — confirm none of the 8 DO-NOT items were touched.
9. **Recommendations for follow-on work** — including any patterns that the regex doesn't catch but seem worth flagging (sermon-cadence detection, theological-metaphor density, etc.).

---

**Architectural test for this CC:** the cohort regenerates cleanly, no banned phrases fire, the 5 sample paragraphs pass the wedding-readout test on Jason/Clarence review. CC-CRISIS-PATH-PROSE can then build on top of this register foundation confidently.
