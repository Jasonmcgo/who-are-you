# CC-183 — Fix Nat's report (Fi-Se-Ne-Ti artist)

> Owner-confirmed: **Nat is Fi-Se-Ne-Ti** (Fi dom, Se aux, then Ne + Ti — a non-MBTI
> stack; she's an artist: painter/musician/graphic designer). Her live report mis-renders
> in four linked ways: the stack TAIL is snapped to a canonical MBTI tuple (publishing
> Ni/Te she never picked), the Work Map reads "Caring / Direct-Service," the Top Gifts
> table repeats one growth-edge across two gifts, and her cohort fixture/lock still encode
> the stale Si/ISFJ anchor. Fix so her report reads as the Fi-Se artist she is.
>
> NOTE: Part A is high-blast-radius (touches the core binary stack derivation). Treat the
> full audit suite + cohortRealLensCanon as the regression gate; **flag-don't-fix** any
> unexpected reds.

## Requirement (owner)

Nat's four picked functions are **Fi, Se, Ne, Ti** (binary picks: Q-TB-SI-SE=se, Q-TB-NI-NE=ne, Q-TB-TI-TE=ti, Q-TB-FI-FE=fi; PERC-ORDER leader=se; JUDG-ORDER leader=fi). Her report must (1) publish a stack of *those four functions* (Fi-Se-Ne-Ti), not a canonical tuple that introduces Ni/Te; (2) route her Work Map to the creative/aesthetic register, not caring/direct-service; (3) show distinct growth edges per gift; (4) have her cohort fixture + lock corrected to Fi-Se.

## Root cause (verified — file:line)

1. **Stack tail** — `lib/jungianStack.ts`. Binary sessions route to `aggregateLensStackBinary` (dispatch ~697-699). Once dom|aux resolve to a canonical pair, the tertiary/inferior are read verbatim from `STACK_TABLE` (4-tuples at ~282-298; emitted ~671-674; copied by `computeJungianStack` ~944-955). `STACK_TABLE` stores only MBTI-canonical tails, so the user's explicit Q-TB-NI-NE / Q-TB-TI-TE picks are **never** honored for the tail — it publishes whatever MBTI canon dictates for the dom|aux pair (for fi|se that's `ni/te`, functions Nat did not pick).
2. **Work map** — `lib/workMap.ts`. `caring_service` (def ~213-224, predicate ~338-359) wins on Fi-driver (0.3) + caring-energy pick (0.15) + Agreeableness-87 ramp (0.2) + family (0.15). The creative register `generative_creative` (def ~250-260, predicate ~403-419) under-scores because (a) its driver gate (~405) tests `["ne","fi"]` in dom/aux, and (b) `oFit` (~409) consumes only `oceanOutput.distribution.O` — **never the Openness *aesthetic* subdimension** (`opennessSubdimensions.aesthetic`, 70 for Nat) or her #1 "kind of new" = aesthetic.
3. **Growth-edge repeat** — `lib/identityEngine.ts`. `synthesizeTopGifts` (~6315-6375) and `synthesizeTopRisks` (~6377-6416) are built independently and paired *positionally* in the table (`renderMirror.ts` ~1028-1036). Growth-edge labels come from `TOP_RISK_LABEL_FOR_CATEGORY[category]` (~4609-4622); two gifts in the same GiftCategory (Integrity) map to the same label, and the risk-list dedup (~6406-6413) doesn't enforce a 1:1 gift↔edge invariant across the two independently-built lists.
4. **Fixture/lock** — `tests/fixtures/cohort-real/nat-real.json` records Q-TB-SI-SE=**si** and PERC-ORDER=**si** (it diverges from her live session, which picks **se**); `tests/audit/cohortRealLensCanon.audit.ts` LOCKS Nat `expectedDominant:"si"`, `expectedAuxFamily:"feeler"` (~90-96). The fixture+lock encode the stale CC-SENSING-TYPING Si anchor.

## Fix — Part A: honor the user's four picked functions in the stack tail

In `aggregateLensStackBinary`, when the session provides the full binary set (both perceiving picks Si/Se + Ni/Ne, both judging picks Ti/Te + Fi/Fe, and PERC-ORDER + JUDG-ORDER leaders), the published 4-function stack must be the user's **own four picked functions**, ordered — never a `STACK_TABLE` tuple that introduces a function they didn't pick. For Nat: leaders Fi (judg) + Se (perc), then her remaining picks Ne + Ti as tertiary/inferior → **fi › se › ne › ti** (tert/inf order may follow the existing tert/inf heuristic, but must be drawn from {Ne, Ti}, not {Ni, Te}). Keep the dom/aux resolution behavior intact; only change where the **tail** is sourced (from picks, not STACK_TABLE) when the explicit picks are present.

## Fix — Part B: Work Map consumes the aesthetic subdimension + creative competes

In `generative_creative`'s predicate, consume the Openness **aesthetic subdimension** (`opennessSubdimensions.aesthetic`) and the "kind of new = aesthetic" signal as real positive inputs (not just `distribution.O`). After Part A, Ne re-enters her dom/tail and the `["ne","fi"]` driver gate fires; combined with aesthetic, the creative register should out-score caring for an aesthetic-leading Fi-Se shape. Do **not** kill `caring_service` for genuine caregivers — this is about letting the aesthetic/creative signal *compete*, not suppressing care.

## Fix — Part C: distinct growth-edge per gift

Make the Top Gifts table show a distinct growth edge per gift: either derive each row's growth-edge from the **same card/gift** as that row (true 1:1 pairing), or dedup so no growth-edge label repeats across rows (fall back to the next-best edge for the colliding row). Result: no two rows show the identical growth-edge string.

## Fix — Part D: re-capture Nat's fixture + flip the lock (canon)

Re-capture `tests/fixtures/cohort-real/nat-real.json` from her corrected answers (Q-TB-SI-SE → **se**, Q-TB-PERC-ORDER → **se**; the Ne/Ti/Fi picks already match). Update the cohortRealLensCanon LOCKS entry: Nat `expectedDominant: "fi"`; her aux is Se (a perceiving function) — the lock's `expectedAuxFamily` only encodes judging families (feeler/thinker), so drop it for Nat or extend the schema to assert a perceiving aux. This corrects the stale CC-SENSING-TYPING Si anchor; **Nat = Fi-Se-Ne-Ti** is canon.

## Do NOT

- Do NOT change dom/aux derivation for clean-path (non-same-attitude) sessions — Part A only changes where the TAIL is sourced when explicit picks exist.
- Do NOT special-case Nat by name anywhere — Part A/B must be general (any user who picks those functions / has aesthetic-leading Openness benefits).
- Do NOT suppress `caring_service`; only let the creative register compete.
- Do NOT touch the Room Read module, the couple module, or unrelated report sections.
- Do NOT commit or push (sandbox: prepend `rm -f .git/index.lock`).

## Acceptance

- Nat's live session (`63d439a5-439a-472b-8620-8e8efea0b231`) renders lens stack **fi › se › ne › ti** (no Ni/Te in her tail).
- Her Work Map reads a creative/aesthetic register, not "Caring / Direct-Service."
- Her Top Gifts table shows a distinct growth edge per gift (no repeat).
- `tests/audit/cohortRealLensCanon.audit.ts` is green with Nat `expectedDominant:"fi"`; **every other cohort anchor still passes** (Harry/Ashley/Daniel/Jason/Keith unchanged).
- Full audit suite + `npx tsc --noEmit` + lint + `npm run build` clean. **Flag-don't-fix** any unexpected reds (esp. snapshot/fixture-render tests that may encode old tails) — report them rather than force-updating.

## Report back

- The stack-tail change + a before/after of Nat's published stack.
- The work-map change (how aesthetic is consumed) + Nat's new top work register.
- The growth-edge dedup approach.
- The fixture re-capture + lock change, and confirmation the other anchors stay green.
- Any reds surfaced (flagged, not silently fixed); tsc/lint/build status.
