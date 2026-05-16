# CC-TYPO-TRIPLET-FIX

## Objective

Fix three specific user-mode prose template typos that surfaced in live render review post-CC-LLM-REWRITES-PERSISTED-ON-SESSION, and bump the prose-rewrite cache version so cohort re-renders pick up the corrected templates. Also unblocks the failing assertion in `tests/audit/proseRegister.audit.ts` whose detail string points to one of the three typos.

This is a small, visibility-driven cleanup CC. Five-minute scope; the value is removing reader-facing grammatical leaks before any further calibration / cohort / prose work fires on top of them.

## Sequencing

Independent of CC-STALE-SHAPE-DETECTOR (engine fallback / type-guard concern, different files) and CC-CALIBRATION-PHASE-1-DISTRIBUTION-AUDIT (read-only analytics). All three can run in parallel.

Wave 1 / item 2. Lands after CC-LLM-REWRITES-PERSISTED-ON-SESSION (already shipped); does not block any subsequent Wave.

## Launch Directive

Run with `claude --dangerously-skip-permissions`. Project-level `.claude/settings.local.json` has `defaultMode: "bypassPermissions"`.

## Execution Directive

Complete in a single pass. Do not pause for user confirmation. If the proseRegister.audit failure detail does not point cleanly at the three typos described in Scope, apply canon-faithful interpretation: the three typos are the three highest-severity ungrammatical leaks visible in the user-mode markdown render of Jason, Daniel, and Cindy fixtures — fix those three and flag the substitution in the report-back.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npx tsx tests/audit/proseRegister.audit.ts`
- `npx tsx tests/audit/typoTripletFix.audit.ts` (this CC creates this audit)
- Whatever cohort-sweep audit currently runs in the project's standard verification flow (identify during Read First; do not invent a new one).
- `grep`, `ls`, `cat`, `find` for inspection.

Do not run `npm install`, any `build*` script, `git commit`, `git push`, or anything that touches `api.anthropic.com`.

## Read First (Required)

1. `tests/audit/proseRegister.audit.ts` — identify which assertion is currently failing and what its detail string says about the offending template / phrase.
2. `lib/proseRegister.ts` — banned-phrase list and the wedding-readout register canon. Any rewrite of an engine template must not introduce a banned phrase.
3. `lib/identityEngine.ts` — locate the three template strings flagged. Most user-mode engine prose lives in this file or in `lib/crisisProseTemplates.ts`.
4. `lib/crisisProseTemplates.ts` — second-most-likely home for the offending strings.
5. `prompts/completed/CC-SUBSTITUTION-LEAK-CLEANUP.md` — already-shipped sibling CC; do not re-touch the six leak sites it already addressed. The three typos in scope for THIS CC are distinct from those six.
6. `prompts/completed/CC-LLM-REWRITES-PERSISTED-ON-SESSION.md` — context on why the rewrite cache exists and how the cache-or-engine contract works (relevant to the cache-version bump in Item 3).

## Scope

### Item 1 — Fix the three known typos

These three typos are confirmed present in the user-mode markdown render of multiple production sessions (Kevin 08:37, Michele 08:49, Cindy 09:04, JasonDMcG 09:05) and were captured during the 2026-05-16 cohort review session. Each is an engine-prose template typo, not a cached LLM rewrite issue.

| # | Pre-fix bytes | Post-fix bytes | Section |
|---|---------------|----------------|---------|
| 1 | `the way you proces the world` | `the way you process the world` | "A Synthesis" card |
| 2 | `regardles of the title` | `regardless of the title` | "What this is good for" → "Career decisions" bullet |
| 3 | `they may strike you a sentimental` | `they may strike you as sentimental` | "Mirror-Type Seed" |

Locate the source location for each (likely `lib/identityEngine.ts`, possibly `lib/crisisProseTemplates.ts` or a sibling). Apply the exact byte substitution. The three are independent string replacements with no cross-dependency.

**Important deploy-timing context for the executor:** Ashley's 08:53 render and Daniel's 08:56 render do NOT contain the typos, while Cindy's 09:04 render (the latest in the cohort) DOES. This rules out a deploy-timing hypothesis. The most likely root cause is that Ashley + Daniel hit a cache path that pre-dates the typo'd template insertion, while Kevin / Michele / Cindy / JasonDMcG hit the fresh-render path. Either way, the fix is the same — correct the template strings — but the cache version bump in Item 3 is what guarantees the corrected templates reach every future render.

**Do not** surface or fix any additional ungrammatical fragments encountered along the way. If a fourth qualifying typo is spotted, queue it in the report-back as a candidate for a follow-up CC; do not let scope expand.

### Item 2 — Verify the fix doesn't break clinician mode

Each of the three substitutions is a single-character or single-word correction with no semantic change. Clinician-mode prose should be byte-identical at the three sites pre/post-fix. Verify this against the live render of any one of the five affected sessions (Kevin / Michele / Cindy / JasonDMcG / Daniel-if-renderable) in clinician mode.

If the engine template structure forces clinician mode to also receive the corrected bytes (which is fine, since the corrected bytes are grammatically correct in both modes), that's acceptable — the canon rule is "user-mode-only fix" but the rationale is "do not regress clinician mode," and a correctly-spelled word is not a regression.

### Item 3 — Cache version bump

Bump the prose-rewrite cache version constant so cohort cache regeneration (whenever it next fires intentionally via a `build*` script) picks up the corrected templates. The bump is one constant change; it does NOT delete or modify any `lib/cache/*.json` file.

Identify the version constant during Read First — likely lives in `lib/proseRewriteLlm.ts` or a sibling. The bump invalidates the rewrite-key namespace for re-warming purposes only; it does not touch existing cache entries.

This bump is intentional and isolated: nothing else in this CC touches cache hashes for `keystoneRewriteHash`, `synthesis3` keys, `grip` keys, or `launchPolish v3` hashes. Only the prose-rewrite version moves.

### Item 4 — Audit: `tests/audit/typoTripletFix.audit.ts`

Hand-rolled audit. Verifies:

1. The three pre-fix strings (`proces the world`, `regardles of the title`, `you a sentimental`) no longer appear anywhere in `lib/identityEngine.ts` or `lib/crisisProseTemplates.ts` (grep, fail if found).
2. The three post-fix strings (`process the world`, `regardless of the title`, `you as sentimental`) appear exactly once each in the same source files.
3. The user-mode markdown render of every available real-cohort fixture (Kevin / Michele / Ashley / JasonDMcG) contains the post-fix strings and does not contain the pre-fix strings. Skip Daniel and Cindy if CC-STALE-SHAPE-DETECTOR has not landed yet (they currently throw on render).
4. The prose-rewrite cache version constant has incremented by exactly 1.
5. No file in `lib/cache/*.json` has been modified.

### Item 5 — Regression gates

After Items 1–4 land:

- `npx tsx tests/audit/proseRegister.audit.ts` passes all assertions (including the previously failing one).
- The standard cohort sweep audit passes.
- `npx tsc --noEmit` passes.
- `npm run lint` passes.

## Do NOT

- **Do NOT expand scope beyond three typos.** If more surface, queue them in the report-back as candidates for a follow-up CC. Scope creep on a five-minute fix is how Wave 1 stalls.
- **Do NOT regenerate any LLM rewrite.** The cache files are not modified. The version bump is a marker for future intentional re-warm via `build*` scripts; nothing in this CC calls the API.
- **Do NOT touch any `lib/cache/*.json` file.** Read-only here.
- **Do NOT touch the six leak sites already fixed by CC-SUBSTITUTION-LEAK-CLEANUP.** Those are done. Re-touching them risks regressing the existing fix.
- **Do NOT modify clinician mode.** The two-tier render canon stands: user-mode-only fix, clinician mode byte-identical at the three sites. If the engine template structure forces clinician-mode change, restructure into per-mode variants rather than letting the fix bleed.
- **Do NOT change any banned-phrase entry in `lib/proseRegister.ts`.** The register canon is owned by CC-RELIGIOUS-REGISTER-RULES and CC-ENGINE-VOCABULARY-BAN. This CC is downstream of that canon.
- **Do NOT bump any cache version other than prose-rewrite.** Keystone / synthesis3 / grip / launchPolish v3 versions stay where they are.
- **Do NOT add a new banned phrase or expand the suppression list.** The fix is mechanical grammar correction, not register policing.
- **Do NOT introduce new dependencies.**
- **Do NOT call `api.anthropic.com` for any reason.** Executor runs with no `ANTHROPIC_API_KEY` in scope per the post-incident discipline.
- **Do NOT commit or push.** Leave for review.

## Allowed to Modify

- `lib/identityEngine.ts` (only the three template strings; nothing else in this file)
- `lib/crisisProseTemplates.ts` (only if one or more of the three fragments lives here)
- `lib/proseRewriteLlm.ts` (only the version constant)
- `tests/audit/typoTripletFix.audit.ts` (new file)
- `package.json` (add `"audit:typo-triplet-fix"` script; nothing else)

Anything not listed is forbidden. Specifically: do not touch any `lib/cache/*.json` file, any `lib/*LlmServer.ts` file, any body-card module (`lib/handsCard.ts`, etc.), any React component, any admin route, any rewrite-key builder.

## Out of Scope

- Any prose change beyond the three identified typos.
- LLM rewrite regeneration.
- Re-warm of the prose-rewrite cache (the version bump prepares for re-warm; actual re-warm is a separate user-initiated `build*` invocation).
- Banned-phrase canon changes.
- Clinician-mode changes.
- Body-card prose changes.

## Acceptance Criteria

1. `npx tsc --noEmit` passes.
2. `npm run lint` passes.
3. `npx tsx tests/audit/proseRegister.audit.ts` passes — the previously failing assertion now passes.
4. `npx tsx tests/audit/typoTripletFix.audit.ts` passes all 6 assertions.
5. The standard cohort sweep audit passes.
6. Exactly three template strings are edited in source.
7. Exactly one cache version constant is bumped by exactly 1.
8. Zero files in `lib/cache/*.json` are modified (`git status` confirms).
9. Clinician-mode markdown for Jason / Daniel / Cindy is byte-identical to pre-CC baseline at the three fix sites.
10. No file outside the Allowed-to-Modify list has been edited.

## Report Back

Include in the CC summary:

- The proseRegister.audit failing-assertion detail string captured at the start.
- For each of the three typos: file + line, pre-fix bytes, post-fix bytes, fixtures affected.
- Whether any additional qualifying fragments surfaced (and were queued, not fixed).
- The cache version constant: file + line + pre/post value.
- Any ambiguity encountered + canon-faithful resolution applied.
- Confirmation no API key was present in scope.

## Notes for executor

- Estimated executor time: 20–40 minutes. If you find yourself over an hour, the three typos are likely intertwined with deeper template structure — stop and report rather than continuing.
- Cost: $0. No API spend. No LLM rewrites generated.
- The cache version bump is intentionally not paired with re-warm in this CC. Re-warm will happen later via an explicit `build*` invocation with `LLM_REWRITE_RUNTIME=on` and the user's reissued API key — both gated on the public-deploy cost-guard checklist.
