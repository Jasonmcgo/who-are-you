# Demographic Rules (CC-019)

The canonical rules that govern the demographic Identity & Context surface introduced by CC-019. The five rules below bind every CC that touches the demographic schema, the Identity & Context page, or the saved-session row shape.

## Rule 1 — Opt-out is data

Each demographic field carries one of three states: `specified`, `prefer_not_to_say`, `not_answered`.

The opt-out signal is itself informative — *the user saw the question and chose privacy.* The model treats opt-out as data, not as missing data. The aggregate frequency of opt-out across users is a separate signal about the population's relationship to that field. A user who answers eight fields and opts out of the ninth is telling the model something different than a user who closed the page after the third field.

The schema stores both the value and the state for every field. Any future analysis that collapses `prefer_not_to_say` and `not_answered` into a single "missing" bucket loses canonical information.

## Rule 2 — No inference of demographic fields

Demographic fields are user-named only. The model does not infer:

- Gender from name.
- Location from IP address, browser locale, or text-mining the user's freeform answers.
- Language community from any other answer.
- Political affiliation from spending allocation, sacred values, or freeform belief content.
- Religious orientation from any other answer.
- Education or profession from vocabulary or sentence structure.

Inference would substitute the model's read for the user's named identity, which violates the canon's user-control register. The user is the only authority on their own demographic identity.

## Rule 3 — All fields optional

The user can fill any subset of the demographic fields. The Save flow does not gate on any field being specified. A session with all fields `not_answered` is a valid saved session — and is itself informative (the user saved the reading but chose to disclose nothing about themselves).

The Skip — save without these affordance on the Identity & Context page is functionally equivalent to "Save and finish" with all fields left blank: both write a `sessions` row + a `demographics` row with all field states defaulting to `not_answered`.

## Rule 4 — Demographics are side-data for derivation; usable for prose interpolation

*Amended 2026-04-26.*

Demographic data does not feed into InnerConstitution derivation. The eight-card body-map reading is independent of who the user is in demographic terms. A 65-year-old retired teacher in Brazil and a 25-year-old software engineer in Berlin who give the same answers across the test flow receive the same derived InnerConstitution shape.

The architectural separation is structural and sharp: the **derivation layer** (`lib/identityEngine.ts`, `lib/beliefHeuristics.ts`, signal extraction, tension detection, per-card derivation, lens-stack aggregation) does not import from `data/demographics.ts` and does not receive `DemographicAnswer[]` as input. Two users with identical answer arrays but different demographics produce identical derived InnerConstitution structures.

Within that constraint, the **prose-generation layer** MAY consume the user-supplied demographic context to interpolate the user's own values back into already-relevant prose surfaces. Interpolation reflects what the user themselves named, in a way that personalizes the read without changing it. Permitted examples:

- The user's name threaded through the Mirror's prose (*"Madison's pattern..."* rather than only *"Your pattern..."*).
- The user's profession interpolated into the Path · Gait Work section (*"Madison's social-work background fits this profile well"*).
- The user's marital status referenced in the Path · Gait Love section when meaningful and the engine's read on that section is already structurally about partnership.
- The user's age decade referenced in the Weather section when meaningful and tied to a real engine observation about formation context.
- The user's location referenced when meaningful and tied to v3+ cultural-frame reads (gated by future v3 user opt-in for cultural framing).

The hard rules around interpolation:

- Interpolation reflects facts the user supplied; it never invents, infers, or substitutes facts about the user. Rule 2 (no inference) still applies — this rule only permits showing back self-supplied demographic facts.
- Interpolation cannot change which signals fire, which tensions activate, which gifts/traps surface, or any other derived attribute. The two layers stay structurally independent: derivation is demographic-blind; prose generation may be demographic-aware.
- Interpolation respects the four field states from Rule 1. `specified` permits interpolation. `prefer_not_to_say` and `not_answered` mean the field does not appear in the prose; the prose generator must gracefully degrade to the un-personalized form (*"Your pattern..."* fallback when name is not specified).
- Interpolation never produces value-laden language tied to demographic membership (*"As someone in your generation..."* / *"Working-class users tend to..."*). The Five Dangers extension applies: cultural-archetype compression is forbidden across demographic axes the same way type-archetype compression is forbidden across personality axes.

Demographics still enrich the research surface (population baselines, cultural-context framings for v3+ work, opt-out frequency analysis). Now they also enrich the prose surface (personalizing the reflected read with the user's own self-supplied context, without altering what's reflected).

## Rule 5 — Local-first, save-required for research mode (amended 2026-04-26)

The persistence layer ships local-first: it connects to a Postgres database running on `localhost:5432` via the user's `DATABASE_URL` environment variable. The same code works against a hosted Postgres provider (Supabase, Vercel Postgres, etc.) by changing only the connection string. No cloud-specific logic in this codebase as of CC-022a.

For **research mode** (the current architectural posture, where every interview produces a saved session and the engine uses demographic context to enrich the rendered prose), the Save flow is **required before the InnerConstitution renders**. The user fills the Identity & Context page (any subset of fields, with `prefer_not_to_say` available per Rule 1) and the save commits before the portrait shows. This ensures every saved session has a paired demographics row and that the engine has demographic context available for prose interpolation per the amended Rule 4.

For a **future public release**, this posture will likely revert: the portrait renders first, save is opt-in afterward, and the demographic-aware prose interpolation handles the no-demographics case gracefully (falling back to the un-personalized *"Your"* / *"You"* form). When that release lands, this rule's amendment is reversed and the CC that does the reversal carries the canonical record of the flow change.

The hard rules around save:

- A user who completes the test must complete the Identity & Context page (with any combination of `specified` / `prefer_not_to_say` / `not_answered` fields) before the portrait renders.
- The *"Skip — save without these"* affordance produces a valid `demographics` row with all fields `not_answered` — and the portrait still renders. *"Skip"* means *"skip the demographic disclosure,"* not *"skip the save."*
- Closing the browser mid-flow on the Identity & Context page leaves no rows — the database transaction has not yet committed when the user closes the page. The save is atomic: both the `sessions` row and the `demographics` row commit together inside a single Drizzle transaction (`lib/saveSession.ts`).
- Local-first is preserved: no third-party services receive the data, no cloud-side persistence ships in this CC.

### History

- **CC-019** introduced the original Rule 5 ("Local-first, opt-in to save"): the user reads the portrait first, then optionally clicks Save below the result, then fills demographics, then writes.
- **CC-022a** (2026-04-26) inverts the flow for research-mode use: demographics → save → portrait. The motivation is the prose-generation layer (per the amended Rule 4) needing demographic context available *before* the engine renders the read. The opt-in posture is preserved as the public-release intent and is documented above as the future-reversion path.

---

## Implementation surfaces

| Canonical rule | Code-level surface |
|---|---|
| Rule 1 (opt-out is data) | `db/schema.ts` (`fieldStateEnum` + per-field `_state` columns); `data/demographics.ts` (`prefer_not_to_say_label`); `IdentityAndContextPage.tsx` (per-field opt-out affordance) |
| Rule 2 (no inference) | Negative — enforced by absence. `lib/identityEngine.ts` does NOT import from `data/demographics.ts`; `extractFreeformSignals` does not consume `other_text` from any field. |
| Rule 3 (all fields optional) | `IdentityAndContextPage.tsx` (no required fields; both Save and Skip paths produce a valid demographic row); `lib/saveSession.ts` (defaults missing fields to `not_answered` in the row) |
| Rule 4 (demographics are side-data for derivation; usable for prose) | **Derivation layer**: `lib/identityEngine.ts` (engine signature accepts only `Answer[]` + `MetaSignal[]`, never `DemographicAnswer[]`); `db/schema.ts` (separate table). **Prose-generation layer**: per-card output generators and the Mirror generator MAY accept an optional `demographics?: DemographicSet` parameter to interpolate user-supplied values into already-relevant prose surfaces (Rule 4 amendment, 2026-04-26). |
| Rule 5 (local-first, save-required for research mode) | `app/page.tsx` (phase machinery transitions test → identity_context → result, with save firing during the identity_context → result transition); `app/components/IdentityAndContextPage.tsx` (renders directly after the test completes; submit triggers save); `lib/saveSession.ts` (server action runs on Identity & Context submit); `db/index.ts` (lazy connection — dev server boots cleanly without DATABASE_URL). Future public-release reversion: `phase: "identity_context"` becomes optional after `phase: "result"` rather than gating it. |

---

## What this canon does NOT govern

- The wording or option lists of individual demographic fields. Those live in `data/demographics.ts` and are reviewable per-CC. The five rules govern the architecture; the field definitions are content choices.
- Cross-session linkage. CC-019 records sessions anonymously by UUID. Authentication, user accounts, or sessions-tied-to-users are out of scope here (and out of scope for v2 generally).
- Cloud deployment / privacy policy / consent banners. Those land in CC-021 alongside cloud deployment.
- Feedback collection on the result page. Out of scope here (CC-020 territory).
- Inference within other surfaces (e.g., the model can still infer cognitive-function patterns from Q-T rankings — that's not a demographic field). Rule 2 applies specifically to the nine fields defined in `data/demographics.ts`.
