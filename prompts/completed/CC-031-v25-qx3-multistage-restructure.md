# CC-031 — v2.5 Q-X3 Multi-Stage Restructure (Institutional Trust)

**Type:** Question-bank surgery + signal-catalog overhaul + tension consumer rewrite + Drive-tagging update + canon updates. **Largest architectural lift remaining in the model.**
**Goal:** Replace the current flat 5-item Q-X3 with a multi-stage pattern (two parents + cross-rank) that resolves four named gaps in the institutional-trust read: Press doing two jobs, Government doing two jobs, Companies doing two jobs, **Social Media missing entirely.**
**Predecessor:** CC-030 (v2.5 Principle Canonization). The principle this CC implements must be in canon before this CC can reference it.
**Successor:** CC-032 (v2.5 Q-X4 Multi-Stage Restructure + Q-I2 Derivation Cascade) follows. CC-032 is independent of CC-031 in implementation but should land after so the engineer can audit Q-I2's parents in their final v2.5 form.
**Source memo:** `docs/product-direction/v2-5-universal-three.md` § Q-X3 — Institutional Trust restructure.

---

## Why this CC

The current Q-X3 is a 5-item flat ranking: Government / Press / Companies / Education / Non-Profits & Religious. Glosses locked 2026-04-25. The v2.5 design memo identifies four gaps the 5-item form cannot resolve:

1. **Press is doing two jobs.** A user trusts individual journalists and the discipline of journalism differently from how they trust the news organizations and outlets that distribute and shape that journalism. The first is craft-level; the second is institutional-level. They can move opposite directions in the same person, and that pattern is informative.

2. **Government is doing two jobs.** Trust in elected representatives and the legislative apparatus differs from trust in the on-the-ground services of government (DMV, public schools, water authority, social security administration, local police). Lumping them averages a posture the engine should be able to read separately.

3. **Companies is doing two jobs.** Small / private / closely-held businesses pull different priors than large / public / publicly-traded companies. Most users hold these very differently.

4. **Social Media is missing entirely.** Not Press, not Companies, not Education, not Government. Its own institutional category in the contemporary trust landscape. *"Any institutional-trust reading that omits it leaves a hole that anyone testing the model will immediately notice."*

The fix is the multi-stage pattern canonized in CC-030. Q-X3 splits into two parent rankings + one derived cross-rank.

---

## The new structure (v2.5 Q-X3)

**Q-X3-public** — public-mission and civic institutions. **5 items at the principle's ceiling**, deliberate per the v2.5 memo's note that 5 is acceptable when the splits are sharp:

| ID | Label | Gloss | Signal |
|---|---|---|---|
| `government_elected` | Government — Elected | "elected representatives, legislatures, and the political apparatus." | `government_elected_trust_priority` |
| `government_services` | Government — Services | "the on-the-ground services of government — public schools, DMV, water, sanitation, local police." | `government_services_trust_priority` |
| `education` | Education | "schools, colleges, and the credentialing they grant." | `education_trust_priority` *(preserved from current Q-X3)* |
| `nonprofits` | Non-Profits | "charities, NGOs, and voluntary missions outside religious frame." | `nonprofits_trust_priority` |
| `religious` | Religious | "churches, faith communities, and explicitly religious missions." | `religious_trust_priority` |

**Q-X3-information-and-commercial** — commercial and information-distribution institutions. **5 items**, again at ceiling:

| ID | Label | Gloss | Signal |
|---|---|---|---|
| `journalism` | Journalism | "individual journalists and the discipline of journalistic craft." | `journalism_trust_priority` |
| `news_organizations` | News organizations | "newsrooms, outlets, and the institutions that distribute and shape journalism." | `news_organizations_trust_priority` |
| `social_media` | Social Media | "platforms that mediate information through algorithm and influence — Twitter/X, TikTok, YouTube, Instagram, Facebook, Substack, Reddit, etc." | `social_media_trust_priority` |
| `small_business` | Small / Private Business | "small, private, closely-held businesses — the local shop, the family firm, the contractor you've used for years." | `small_business_trust_priority` |
| `large_companies` | Large / Public Companies | "large, public, publicly-traded companies — the multinationals, the platforms, the brands at scale." | `large_companies_trust_priority` |

**Q-X3-cross** — derived cross-rank. **4 items, top-2 of each parent.** Resolved priority when public and information-and-commercial trust compete for the same epistemic weight.

---

## Signal-library changes summary

| Signal | Status | Action |
|---|---|---|
| `government_trust_priority` | **Retired** | Replaced by `government_elected_trust_priority` + `government_services_trust_priority` |
| `press_trust_priority` | **Retired** | Replaced by `journalism_trust_priority` + `news_organizations_trust_priority` |
| `companies_trust_priority` | **Retired** | Replaced by `small_business_trust_priority` + `large_companies_trust_priority` |
| `nonprofits_religious_trust_priority` | **Retired** | Replaced by `nonprofits_trust_priority` + `religious_trust_priority` |
| `education_trust_priority` | **Preserved** | Kept; gloss unchanged |
| `government_elected_trust_priority` | **New** | Q-X3-public |
| `government_services_trust_priority` | **New** | Q-X3-public |
| `nonprofits_trust_priority` | **New** | Q-X3-public |
| `religious_trust_priority` | **New** | Q-X3-public |
| `journalism_trust_priority` | **New** | Q-X3-information-and-commercial |
| `news_organizations_trust_priority` | **New** | Q-X3-information-and-commercial |
| `social_media_trust_priority` | **New** | Q-X3-information-and-commercial |
| `small_business_trust_priority` | **New** | Q-X3-information-and-commercial |
| `large_companies_trust_priority` | **New** | Q-X3-information-and-commercial |

**Net: 4 retired + 9 new + 1 preserved = 10 trust signals on the new Q-X3 (vs. 5 today).**

---

## Scope

This CC modifies the following surfaces:

1. `data/questions.ts` — replace Q-X3 with Q-X3-public, Q-X3-information-and-commercial, Q-X3-cross.
2. `lib/types.ts` — add 9 new SignalIds (declarative type union — currently `SignalId = string`, but worth confirming).
3. `lib/identityEngine.ts`:
   - `SIGNAL_DESCRIPTIONS` (around line 171–180): retire 4 legacy entries; add 9 new entries; preserve `education_trust_priority`.
   - Trust-signal aggregation array (around line 1394–1395): update from legacy 5 to new 10.
   - Display-name lookup map (around line 1518–1522): retire 4 legacy entries; add 9 new entries; preserve education.
   - Cross-card pattern detection: audit; `knowledge_vs_education_trust` consumes `education_trust_priority` (preserved, no change). No other patterns currently consume the retired signals — verify.
4. `lib/drive.ts` — `SIGNAL_TO_DRIVE_BUCKET` tagging table: retire 4 legacy entries; add 9 new entries (all tag to `"compliance"` bucket — same register as the legacy signals); preserve `education_trust_priority` tag.
5. `lib/beliefHeuristics.ts` — audit for any references to retired Q-X3 signals (likely none — `summarizeQI2Selections` reads via the question definition's `derived_from`, not by signal ID; verify).
6. **Tension consumers** — audit `lib/identityEngine.ts` tension definitions (T-001 through T-015 plus any others) for references to retired signals. Rewrite as needed.
7. `app/page.tsx` — phase machinery: insert Q-X3-public, Q-X3-info-and-commercial, Q-X3-cross at the position previously occupied by Q-X3 (around line 106 in `data/questions.ts`). `Q_I1_INDEX` is dynamically computed via `findIndex`, so insertion auto-shifts indices. No app/page.tsx edit should be required, but verify.
8. **Q-I2 derivation NOT updated yet.** Q-I2 still references `["Q-X3", "Q-X4"]` after CC-031. CC-032 handles the cascade. CC-031 is *intentionally* leaving Q-I2 in a temporarily-broken state because Q-X3 (the singular) no longer exists. **This means CC-031 must ship together with CC-032, OR CC-031 must include a temporary shim that points Q-I2's derived_from to Q-X3-cross.** Engineer's call on which approach; the cleanest is to ship CC-031 + CC-032 atomically (single PR), but that's a sequencing decision.
9. Canon docs:
   - `docs/canon/question-bank-v1.md` — Q-X3 entry retired; Q-X3-public, Q-X3-information-and-commercial, Q-X3-cross entries added with new signals + glosses.
   - `docs/canon/signal-library.md` — 4 legacy entries marked deprecated; 9 new entries added with `produced_by_questions`, rank-aware, primary_cards.
   - `docs/canon/tension-library-v1.md` — any tensions consuming retired signals updated.
   - `docs/canon/shape-framework.md` — Trust card section updated to reflect the multi-stage form.
   - `docs/canon/option-glosses-v1.md` — 4 legacy Q-X3 glosses deprecated; 9 new glosses authored to match the locked register.

Out of scope: Q-X4 restructure (CC-032). Q-I2 derivation cascade (CC-032). New cross-card patterns leveraging new trust signals (CC-029 territory or beyond). LLM substitution.

---

## Steps

### Step 1 — Replace Q-X3 in `data/questions.ts`

Around line 106, the current Q-X3 is a single ranking question. Replace with three entries:

```ts
// CC-031 — Q-X3 multi-stage. The single 5-item Q-X3 is retired; the institutional-trust
// read now resolves through two parent rankings + one cross-rank. Per the v2.5 memo,
// this addresses four gaps in the legacy form: Press doing two jobs (journalism vs.
// news-organizations), Government doing two jobs (elected vs. services), Companies
// doing two jobs (small vs. large), Social Media missing entirely.
{
  question_id: "Q-X3-public",
  card_id: "context",
  type: "ranking",
  text: "How much do you trust each of these public-mission institutions to tell the truth and act in good faith? Rank in order.",
  helper: "Five public and civic institutions. Most trusted at the top, least trusted at the bottom.",
  items: [
    { id: "government_elected",  label: "Government — Elected",  gloss: "elected representatives, legislatures, and the political apparatus.",                                                signal: "government_elected_trust_priority"  },
    { id: "government_services", label: "Government — Services", gloss: "the on-the-ground services of government — public schools, DMV, water, sanitation, local police.",                  signal: "government_services_trust_priority" },
    { id: "education",           label: "Education",             gloss: "schools, colleges, and the credentialing they grant.",                                                              signal: "education_trust_priority"           },
    { id: "nonprofits",          label: "Non-Profits",           gloss: "charities, NGOs, and voluntary missions outside religious frame.",                                                  signal: "nonprofits_trust_priority"          },
    { id: "religious",           label: "Religious",             gloss: "churches, faith communities, and explicitly religious missions.",                                                   signal: "religious_trust_priority"           },
  ],
},
{
  question_id: "Q-X3-information-and-commercial",
  card_id: "context",
  type: "ranking",
  text: "How much do you trust each of these information and commercial institutions to tell the truth and act in good faith? Rank in order.",
  helper: "Five information-distribution and commercial institutions. Most trusted at the top, least trusted at the bottom.",
  items: [
    { id: "journalism",          label: "Journalism",             gloss: "individual journalists and the discipline of journalistic craft.",                                                                       signal: "journalism_trust_priority"          },
    { id: "news_organizations",  label: "News organizations",     gloss: "newsrooms, outlets, and the institutions that distribute and shape journalism.",                                                          signal: "news_organizations_trust_priority"  },
    { id: "social_media",        label: "Social Media",           gloss: "platforms that mediate information through algorithm and influence — Twitter/X, TikTok, YouTube, Instagram, Facebook, Substack, Reddit.", signal: "social_media_trust_priority"        },
    { id: "small_business",      label: "Small / Private Business", gloss: "small, private, closely-held businesses — the local shop, the family firm, the contractor you've used for years.",                       signal: "small_business_trust_priority"      },
    { id: "large_companies",     label: "Large / Public Companies", gloss: "large, public, publicly-traded companies — the multinationals, the platforms, the brands at scale.",                                     signal: "large_companies_trust_priority"     },
  ],
},
{
  question_id: "Q-X3-cross",
  card_id: "context",
  type: "ranking_derived",
  derived_from: ["Q-X3-public", "Q-X3-information-and-commercial"],
  text: "When public-mission and information-and-commercial institutions compete for your trust, where does it actually go?",
  helper: "Your top picks from the previous two rankings. Rank in resolved priority — what wins when they're forced to compete.",
},
```

The 5-item parents sit at the v2.5 principle's ceiling deliberately. Per the memo: *"acceptable when the domain genuinely requires that resolution and no clean way exists to split it into two parents."* The four splits (Government, Press, Companies, NP&Religious) all matter; collapsing any of them loses signal CC-031 was specifically designed to preserve.

### Step 2 — Update `SIGNAL_DESCRIPTIONS` in `lib/identityEngine.ts`

Around line 171–180, retire the 4 legacy trust signals and add the 9 new ones. Keep `education_trust_priority` unchanged. Add CC-031 marker comments.

### Step 3 — Update trust-signal arrays + display-name maps

Around lines 1394–1395 (signal aggregation), 1518–1522 (display names), update from legacy 5 to new 10. Each new signal gets a display-name entry matching its label.

### Step 4 — Update `lib/drive.ts` tagging table

Around line 94–98, retire 4 legacy entries; add 9 new entries (all tagged `"compliance"` since institutional-trust signals all live in the Compliance drive bucket per the existing tagging logic). Preserve `education_trust_priority`.

### Step 5 — Audit tension consumers

Read `lib/identityEngine.ts` tension definitions starting at the cross-card-patterns section. Any tension consuming `government_trust_priority`, `press_trust_priority`, `companies_trust_priority`, or `nonprofits_religious_trust_priority` needs rewriting. Most likely T-001 (per `lib/identityEngine.ts:524`); verify by reading the T-001 definition.

For each consumer, decide:
- **Keep semantics, switch to new signal:** map the legacy signal to the *most-aligned* new signal (e.g., if T-001 was reading `press_trust_priority` as a proxy for "trust in mass media," map to `news_organizations_trust_priority` — not `journalism_trust_priority`, because the institutional-distribution sense is what matters in that tension).
- **Expand to multiple signals:** rewrite to consume the union (`press_trust_priority` → `journalism_trust_priority` OR `news_organizations_trust_priority`).
- **Mark as legacy and rebuild:** if the tension's intent doesn't survive the split cleanly, retire the legacy formulation and queue a rewrite for a future CC.

### Step 6 — Phase machinery in `app/page.tsx`

`Q_I1_INDEX` is dynamically computed (`findIndex(q => q.question_id === "Q-I1")`). Inserting three new questions in place of one auto-shifts the index. No app/page.tsx edit should be required. Verify by reading the surrounding code.

### Step 7 — Q-I2 temporary state (sequencing decision)

Q-I2 still has `derived_from: ["Q-X3", "Q-X4"]` in `data/questions.ts`. After Step 1, Q-X3 doesn't exist. Two paths:

- **Atomic ship:** CC-031 + CC-032 land in the same PR. Q-I2's derivation updates to `["Q-X3-cross", "Q-X4-cross"]` in CC-032. CC-031 alone is never deployed.
- **Temporary shim:** CC-031 updates Q-I2's derived_from to `["Q-X3-cross", "Q-X4"]` (using the new cross-rank but keeping legacy Q-X4). CC-032 then updates to `["Q-X3-cross", "Q-X4-cross"]`. Allows CC-031 to ship independently.

**Recommend atomic ship** — both restructures land together. Eliminates the intermediate broken state and avoids the temporary-shim pattern where Q-I2's derivation references mixed legacy and v2.5 questions.

### Step 8 — Canon docs

- `docs/canon/question-bank-v1.md`: retire Q-X3 entry; add Q-X3-public, Q-X3-information-and-commercial, Q-X3-cross entries with full item lists, glosses, signals, rank-aware notes. Cross-reference CC-030 principle.
- `docs/canon/signal-library.md`: mark 4 legacy entries as `deprecated_in: CC-031`; add 9 new entries following the existing template (signal_id, description, primary_cards, produced_by_questions, rank-aware, active).
- `docs/canon/option-glosses-v1.md`: deprecate the 4 legacy Q-X3 glosses; author 10 new glosses (5 Q-X3-public + 5 Q-X3-info-and-commercial). Match the locked register from existing glosses.
- `docs/canon/tension-library-v1.md`: update any tensions whose consumers changed in Step 5.
- `docs/canon/shape-framework.md` § Trust card: update to reflect the multi-stage Q-X3 form. Note the new Social Media + Outside-expert reads will be available once CC-032 also lands.

### Step 9 — Saved-session compatibility

Pre-CC-031 saved sessions store Q-X3 answers with the legacy 5 signal IDs. Post-CC-031, the engine's signal taxonomy doesn't include those IDs. Two cases:

- **Reading old sessions in admin:** the admin route should still render legacy sessions. Engine prose generation that tries to resolve a legacy signal ID via `SIGNAL_DESCRIPTIONS` will get `undefined` and fall through to the signal_id string. UI doesn't crash but reads roughly. **Acceptable for v1; saved-session migration is not in this CC's scope.**
- **Cross-card patterns reading old sessions:** patterns whose detection functions reference retired signal IDs will return false for old sessions (signals don't exist). Mirror prose for old sessions degrades gracefully. **Acceptable.**

If saved-session migration becomes a priority, queue as a separate CC. CC-031 doesn't migrate.

### Step 10 — Verification

- `npx tsc --noEmit` exits 0.
- `npm run lint` passes.
- `npm run build` succeeds.
- A fresh real-user session through Q-X3-public + Q-X3-information-and-commercial + Q-X3-cross renders correctly. The cross-rank shows 4 items (top-2 of each parent).
- Existing cross-card patterns that reference `education_trust_priority` (only `knowledge_vs_education_trust` per audit) continue to fire correctly when conditions are met.

---

## Acceptance

- `data/questions.ts` contains Q-X3-public (5 items), Q-X3-information-and-commercial (5 items), Q-X3-cross (derived) — replacing the legacy Q-X3.
- `lib/identityEngine.ts` has 9 new `SIGNAL_DESCRIPTIONS` entries; 4 legacy entries removed.
- `lib/drive.ts` `SIGNAL_TO_DRIVE_BUCKET` tagging updated.
- Tension consumers of retired signals rewritten or marked legacy.
- Canon docs updated: question-bank-v1.md, signal-library.md, option-glosses-v1.md, tension-library-v1.md, shape-framework.md.
- `git diff --stat` shows changes only in the named files.
- Build, type-check, lint all pass.
- Smoke confirms the multi-stage Q-X3 renders correctly.

---

## Out of scope

- **Q-X4 restructure.** CC-032.
- **Q-I2 derivation cascade.** CC-032 (or atomic ship — see Step 7).
- **New cross-card patterns leveraging new trust signals** (e.g., Social Media trust × belief revision; Religious trust × Faith priority). Future CC.
- **Saved-session migration.** Pre-CC-031 sessions render gracefully but legacy signal IDs aren't migrated.
- **LLM substitution path.**
- **Renaming or removing any question outside Q-X3.**
- **Splitting `nonprofits_religious_trust_priority` differently.** This CC splits it into `nonprofits_trust_priority` + `religious_trust_priority`. Don't keep them combined unless real-user testing post-ship demands it.
- **Component edits beyond what the auto-shifting `Q_I1_INDEX` requires.** No MapSection / MirrorSection / ShapeCard / QuestionShell edits.

---

## Housekeeping items surfaced for post-v2.5 cleanup CC

(These are items CC-031's audit may identify but doesn't fix. Bundle into the post-v2.5 reductive cleanup CC alongside the items already queued — `nameThreadFirst*` removal, sacred-IDs array collapse, `truth_vs_private_threat` pattern fix.)

- Any tensions whose semantic intent doesn't survive the Q-X3 signal split cleanly may need a full rewrite, not just a signal-name swap.
- Pre-CC-031 saved sessions' admin views display legacy signal IDs as raw strings (no description). Worth a "legacy signal display" affordance in admin if many old sessions need to remain readable.
- The `*_priority` naming convention is now mixed across very different axes (sacred values, trust sources, drives, stakes). Worth canonical-doc clarification on what "_priority" suffix means in each context.

---

## Notes for the executing engineer

- **The atomic-ship recommendation is strong.** Land CC-031 + CC-032 in the same PR. The temporary-shim alternative requires careful handling of Q-I2's mixed-legacy-and-v2.5 derivation and risks subtle bugs.
- **Tension consumer audit is the load-bearing risk.** If a tension's signal references aren't fully audited, post-CC-031 prose can silently break. Read every tension definition that mentions a trust signal.
- **The 5+5 parent-item split is at the principle's ceiling.** This is deliberate. Don't try to drop items to get to 4+4 — every split (Government, Press, Companies, NP&Religious) is the architectural reason for the CC. If a future CC determines one of the splits isn't earning its keep, that's a v2.6 conversation.
- **Drive bucket assignments are uniform** — all 9 new institutional-trust signals tag to `"compliance"` (same register as the legacy 5). The drive-tagging memo's editorial rationale doesn't change for this CC.
- **`education_trust_priority` is preserved unchanged.** Glossary, signal description, drive bucket, cross-card pattern reference all stay. Don't rename.
- **Browser smoke required.** Engine checks confirm wiring and signal taxonomy. The visual experience of ranking 5 items twice (instead of 5 once) needs Jason's eyes — pacing, helper-text clarity, cross-rank readability.
