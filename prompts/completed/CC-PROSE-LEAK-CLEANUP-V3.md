# CC-PROSE-LEAK-CLEANUP-V3

## Objective
Two leaks visible in live soft-share user reports that the existing audit suite missed. Both are small, deterministic fixes. Each one is independently noticeable to careful readers.

1. **`3 C's` engine-internal vocabulary still appears in Open Tensions user-facing prose.** The canon ("engine-vocabulary ban + 3 C's architectural truth," 2026-05-10) said `3 C's` should not appear in user-facing prose. The canon was set but the Open Tensions templates were never actually updated.

2. **The Hands card section header (`### Hands — Work / **What you build and carry**`) is rendering twice** in user-mode reports. The `enforceHandsTemplate` post-processor from CC-SMALL-FIXES-BUNDLE injects the header when missing, but isn't idempotent — when the header is already present (LLM-rewritten path or engine archetypes that emit it directly), it injects a duplicate.

## Sequencing
**Urgent.** Soft-share is live and these are visible in every user's report. Land + push as soon as drafted.

## Scope

### Fix 1 — Strip `3 C's` from Open Tensions prose
Find every occurrence of `3 C's` (also `3Cs`, `three Cs`, etc.) in user-facing prose templates. Identified sites from live reports:

- **"Words and Energy" tension**: *"The 3 C's question for your shape is sharper than..."* — strip "3 C's" or rewrite as *"The question for your shape is sharper than..."*
- **"Sacred Words vs Sacred Spending" tension**: same phrase, same strip.
- **"Current and Aspirational Allocation" tension**: same phrase, same strip.

Other potentially-affected files (audit first):
- `lib/identityEngine.ts` — Open Tensions template emission
- `lib/threeCStrength.ts` — title-cased "3 C's" anywhere it leaks
- Any other prose module emitting Open Tensions content

The simplest fix: replace `"The 3 C's question for your shape"` → `"The question for your shape"` throughout the templates. Drop the "3 C's" qualifier; the question framing stands on its own.

**Audit:** zero occurrences of `3 C's`, `3Cs`, `three Cs`, or `3 Cs` in user-mode rendered output across 24 cohort fixtures.

### Fix 2 — Hands card header dedup
The `enforceHandsTemplate` post-processor should be **idempotent**: if `### Hands — Work` and `**What you build and carry**` are already present in the input, skip injection. Two implementation paths:

- **Option A (preferred):** before injecting the header in `enforceHandsTemplate`, check if the input already contains `### Hands — Work` and skip if so. Single conditional.
- **Option B:** strip any existing header before injection, then inject canonically once. Net result is the same single header but more invasive.

Same idempotency check for the closing line — verify whether `Hands is what your life makes real. Work Map is where that making may fit.` is appearing once vs twice in user-mode renders; if twice, apply same idempotency pattern.

**Audit:** in user-mode rendered output, the literal string `### Hands — Work` appears exactly once per report across 24 cohort fixtures. Same for `**What you build and carry**` — exactly once per report.

## Do not
- Change the canon ("engine-vocabulary ban + 3 C's banned from user-facing prose"). This CC enforces the existing canon, doesn't revise it.
- Touch admin / clinician-mode rendering — the duplicates and `3 C's` references in clinician mode are not regression-tested in this CC. (Worth verifying clinician-mode doesn't have the dup either, but it's not in scope.)
- Modify the engine math, the LLM prompts, or the cache structure.
- Bump cache hashes.
- Add new dependencies.
- Rewrite the Open Tensions in second-person from the templates if they were name-interpolated (the pronoun mask handles that — see CC-LAUNCH-VOICE-POLISH-V2 conjugateYouVerbs).

## Rules

### 1. Idempotent post-processors
Any prose post-processor that injects content should first check whether the content is already present. Idempotency is a structural requirement, not optional polish.

### 2. Engine-vocabulary ban is enforceable
The canon already bans `3 C's` from user surface. This CC operationalizes the ban. Future engine-internal vocabulary additions must enter user-facing prose only through proprietary translations (Goal/Soul/Wisdom for 3C's; pattern-reader/structurer for cognitive functions; etc.).

### 3. Clinician retains everything
This CC's audit verifies user-mode. Clinician-mode audit equivalence (no dup, no leak) is desirable but not strictly required — if clinician has the engine artifacts intact (which is the existing canon), the fixes here apply user-mode-only.

## Audit gates
- New audit `tests/audit/proseLeakCleanupV3.audit.ts`:
  - Zero occurrences of `3 C's` (and case variants) in user-mode rendered output across all cohort fixtures.
  - The string `### Hands — Work` appears at most once per user-mode rendered report.
  - The string `**What you build and carry**` appears at most once per user-mode rendered report.
  - The Hands card section content is otherwise unchanged — Strength/Growth Edge/Under Pressure/Practice paragraphs all present.
- Existing audits stay green (53+).
- `tsc --noEmit` clean.
- `npm run lint` clean.
- Cost: $0 (deterministic fixes; no LLM regen; no cache touch).

## Deliverables
- Files changed list.
- Before/after excerpts for both fixes (Jason fixture + daughter's-style synthetic Cindy fixture).
- Audit results.
- Confirmation that clinician mode is unaffected (no regression).
