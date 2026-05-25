# CC-161 — Binary-path follow-up clarifier: right axis, voices from the binary picks

> Live bug (Nat): a binary-format respondent's follow-up asked a **Ne-vs-Si**
> perceiving question — functions she never picked and that aren't in her stack
> (she's reliably Ni-dominant). The clarifier that should fire — the judging axis
> that separates INTJ (Ni-Te-Fi) from INFJ (Ni-Fe-Ti), i.e. **Fi-vs-Fe** and
> **Te-vs-Ti** — never appeared. CC-159 fixed this for the legacy path only; the
> binary path is still broken.

## Verified root cause (`lib/followUpQuestions.ts`)

1. A binary session raises **`binary-dominance-ambiguous`**, which blanket-makes
   **both** the N/S (perceiving) clarifier eligible (L521-525) AND the judging
   clarifier eligible (L526-529) — even when perceiving is settled and only the
   judging/feeling axis is in contention.
2. The head-to-head leaders are chosen by **`topPickCountFor`** (L557-558) — which
   counts **legacy Q-T rank picks**. A binary-format session has none, so the
   leader selection falls back to garbage and picks **Ne / Si** (functions the
   respondent never chose). That's the nonsensical question.

Net: the binary clarifier fires the wrong *axis* and builds it from the wrong
*signal source*.

## Execution mode

Single pass; flag ambiguity. Follow-up clarifier-construction fix for the binary
path. No change to lens/type *selection* or Movement/derivation math — only which
clarifier is asked and how its voices are chosen.

## Tasks

**T1 — surface the binary ambiguous pair.** In `aggregateLensStackBinary`
(`lib/jungianStack.ts`), when the resolver is low-confidence, expose **which
functions are actually in contention** based on the respondent's binary picks +
the close/ambiguous step — mirroring CC-159's `auxAmbiguousPair`, but derived
from the binary picks, not legacy ranks. Distinguish whether the contested pair
is **judging** (Ti/Te + Fi/Fe — the INTJ↔INFJ case) or **perceiving** (Ni/Ne or
Si/Se). For Nat: Ni settled; the contested pair is the feeling/thinking attitude
(Fi-vs-Fe and/or Te-vs-Ti).

**T2 — build the head-to-head from the binary picks, not `topPickCountFor`.** When
the session is binary-format, the N/S and judging head-to-head leaders must come
from the binary picks / the T1 contested pair — NOT `topPickCountFor` (legacy
rank counts that are empty for binary sessions). Never pit a function the
respondent didn't pick or that isn't in contention (kills the Ne/Si bug).

**T3 — route to the contested axis only.** Stop `binary-dominance-ambiguous` from
blanket-firing the perceiving clarifier when perceiving is settled. Fire the
**judging** head-to-head (Fi-vs-Fe, Te-vs-Ti) when the judging/feeling pick is the
ambiguous one; fire the **perceiving** head-to-head only when the perceiving pick
is actually contested. (For Nat → judging only.)

## Allowed to modify

- `lib/jungianStack.ts` (`aggregateLensStackBinary` — surface the contested pair;
  no selection-math change)
- `lib/followUpQuestions.ts` (binary-path clarifier eligibility + leader
  construction from the contested pair; suppress wrong-axis/wrong-voice emission)
- `lib/types.ts` if a new `LensStack` field is needed for the binary contested
  pair (parallel to `auxAmbiguousPair`)

Do NOT change dominant/aux selection, Movement/derivation math, the legacy-path
CC-159 routing, or the report render.

## Acceptance criteria

1. A constructed **binary-format Ni-dominant session with a contested feeling/
   thinking attitude** (the Nat case) generates a **Fi-vs-Fe and/or Te-vs-Ti
   judging head-to-head** in its follow-up — and does **NOT** generate a
   Ne-vs-Si (or any) perceiving clarifier. Paste the generated question.
2. The head-to-head voices are the functions actually in contention (from the
   binary picks), never functions the respondent didn't choose.
3. A binary session whose *perceiving* pick is genuinely contested still gets the
   perceiving head-to-head (correct routing, not blanket-suppressed).
4. Legacy-path sessions (CC-159) and confident binary sessions are unchanged —
   no new clarifier where none is warranted; no double-emit.
5. `tsc` + lint clean. No Movement/derivation change. Follow-up + lens audits pass.

## Flag in report

- The generated clarifier for the constructed Nat case (prove Fi/Fe or Te/Ti, not
  Ne/Si).
- How the binary contested pair is surfaced and how leaders are now chosen
  (binary picks vs the old `topPickCountFor`).
- Confirm legacy-path + confident-session behavior is unchanged.
