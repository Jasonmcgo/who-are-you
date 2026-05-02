# CC-047 — Username-as-Name Fallback Fix

**Type:** Defensive prose-rendering fix in the name-substitution logic. **No new logic. No new prose templates.**
**Goal:** Stop the freeform-prose composer from rendering raw usernames (e.g., `"Jason0429"`) as third-person possessives in user-facing copy. When the user's name resolution falls back to a username-pattern (digit suffix, all-lowercase, or other non-name signals), substitute *"you"* / *"your"* in the second-person register instead of treating the username as a proper name.
**Predecessors:** None hard-blocked. Symptom surfaced in real-user report 2026-04-29: prose renders *"Jason0429's gift is the long read"* / *"Jason0429 may need to choose ground that's good enough"* / etc.
**Successor:** None.

---

## Why this CC

Real-user report 2026-04-29 shows the freeform-prose composer treating the username `"Jason0429"` as a proper name and rendering it in third-person possessive form throughout the report. Symptom appears in:

- *"Jason0429's gift is the long read"*
- *"Jason0429's danger is believing the long read too early"*
- *"Jason0429 may need to choose ground that's good enough"*
- *"For Jason0429's shape, the meaningful allocation gap may not be..."*
- *"Jason0429's creative output, Jason0429's protected hours, and Jason0429's strategic attention..."*

Each instance reads as if the name were a proper name like *"Jason"* or *"Madison"*, when in fact the literal string is a username with a digit suffix that's clearly not a real name.

The mechanism likely lives in `lib/identityEngine.ts` or a freeform-prose helper (commonly `getUserName` / `nameOrYour` / `capitalize` per CC-029's pattern-prose convention). The function returns the user's display name when one is present in demographics; falls back to the literal `display_name` field when no first name is found. The fallback should detect *"this isn't actually a name"* and use *"you"* second-person instead.

The defect affects every user whose `display_name` doesn't parse as a clean first name (digit suffix, single-character, all-lowercase usernames, email-style identifiers, etc.). The Pattern Notes from CC-029 also use the same name-substitution helpers and are equally affected.

---

## Scope

Files modified:

1. `lib/identityEngine.ts` — locate the name-resolver helpers (`getUserName`, `nameOrYour`, or equivalent) and add a username-pattern detection guard. When the resolved name fails the pattern test, return `null` / `undefined` so downstream `getUserName(demographics) ? ... : ...` conditionals fall through to the second-person *"you"* branch.

Possibly also:

2. `lib/freeformProse.ts` or wherever the Path · Gait composite prose lives — if username-substitution happens in a separate composer, fix it there too. Verify with grep.

Nothing else. No new prose templates, no demographics-extraction changes, no engine logic edits.

---

## The locked changes

### 1. Username-pattern detection

Add a helper `isLikelyUsername(name: string): boolean` that returns `true` when the input string fails to read as a clean first name. Heuristics:

- Contains digits (`/\d/.test(name)`)
- Is all-lowercase (`name === name.toLowerCase()`) AND has length > 2 (so single initials like *"K"* aren't false-positive)
- Contains underscore, hyphen, or period (typical username delimiters)
- Length > 20 characters (real first names are typically ≤ 15)

A name fails the test if ANY of those heuristics fire. Pass means it reads as a clean first name and can be used as-is.

```ts
function isLikelyUsername(name: string | undefined | null): boolean {
  if (!name) return false; // empty/null is "no name", not "username"
  if (/\d/.test(name)) return true;             // digit suffix or embedded digit
  if (/[_\-\.]/.test(name)) return true;        // underscore, hyphen, or period
  if (name.length > 20) return true;            // unreasonably long for a first name
  if (name === name.toLowerCase() && name.length > 2) return true; // all-lowercase non-initial
  return false;
}
```

### 2. `getUserName` guard

Modify `getUserName(demographics)` (or whatever the canonical name-resolver is called) to return `null`/`undefined` when the resolved name fails the username-pattern test:

```ts
function getUserName(demographics: Demographics | undefined): string | null {
  if (!demographics) return null;
  const name = demographics.first_name ?? demographics.display_name ?? null;
  if (!name) return null;
  if (isLikelyUsername(name)) return null; // CC-047 — fall through to "you"
  return name;
}
```

After this change, every existing `getUserName(demographics) ? "Jason" : "you"` conditional will correctly fall through to *"you"* when the user's display_name is a username pattern.

### 3. `nameOrYour` cascade

`nameOrYour` (or equivalent) reads `getUserName` and returns either the name or *"your"*. After the `getUserName` fix, `nameOrYour` automatically returns *"your"* for username-pattern users. No change needed if it's structured this way; verify by reading the current implementation.

### 4. `capitalize(nameOrYour(...))` cascade

Pattern-prose code (CC-029) often does `capitalize(nameOrYour(demographics))` to produce the sentence-opening form. After the fix, this returns *"Your"* for username-pattern users. No change needed; verify.

---

## Steps

### 1. Locate the name-resolver helpers

`grep -n "getUserName\|nameOrYour\|first_name\|display_name" lib/identityEngine.ts lib/freeformProse.ts` (or wherever prose composers live). Identify the canonical name-resolution path.

### 2. Add `isLikelyUsername` and update `getUserName`

Per the locked content above. Position `isLikelyUsername` near the existing helper functions (likely close to `capitalize`, `nameOrYour`).

### 3. Verify all consumers fall through correctly

Every consumer of `getUserName` should be a `getUserName(demographics) ? <name-branch> : <you-branch>` conditional. Confirm via grep that each consumer handles the null/undefined return path correctly.

If any consumer uses `getUserName(...) ?? <something>` (nullish coalesce to a literal), verify the fallback is *"you"* / *"your"* and not the literal username.

### 4. Verification

- `npx tsc --noEmit` exits 0.
- `npm run lint` passes.
- `npm run build` succeeds (modulo pre-existing /admin Suspense).
- Existing test suite passes. If a test asserts that `getUserName("Jason0429")` returns `"Jason0429"`, update to expect `null` (or `undefined`).
- Manual sweep: synthesize 4 user-name scenarios:
  - **A**: `first_name: "Jason"` → `getUserName` returns `"Jason"`. Prose reads *"Jason's gift..."*.
  - **B**: `display_name: "Jason0429"` (no first_name) → `getUserName` returns `null`. Prose reads *"Your gift..."*.
  - **C**: `display_name: "j_smith"` → `getUserName` returns `null` (underscore). Prose reads *"Your gift..."*.
  - **D**: `display_name: "K"` → `getUserName` returns `"K"` (length ≤ 2, escapes the all-lowercase trap). Prose reads *"K's gift..."*. Edge case — single-character name. Acceptable.

### 5. Browser smoke (Jason verifies)

Re-render the existing Jason0429 report. Confirm:
- All instances of *"Jason0429's"* now render as *"Your"* / *"your"* (capitalized when sentence-initial, lowercase otherwise).
- All instances of *"Jason0429 may"* / *"Jason0429 marked"* / etc. render as *"You may"* / *"You marked"*.
- The Keystone Reflection's *"Jason0429 marked 4 (Close relationships, Money / Wealth, Reputation, and Job / Career)"* should now read *"You marked 4..."*.
- No other layout changes; the rest of the report stays identical.

---

## Acceptance

- `lib/identityEngine.ts` (or `lib/freeformProse.ts`) contains `isLikelyUsername` helper and updated `getUserName`.
- All username-pattern test cases (digit suffix, underscore, hyphen, period, all-lowercase, > 20 chars) return `null` from `getUserName`.
- Real first names (capitalized initial, no digits/punctuation, ≤ 20 chars) return as-is.
- `git diff --stat` shows changes only in named files.
- `npx tsc --noEmit` exits 0. `npm run lint` passes. `npm run build` succeeds (modulo /admin).
- Manual sweep confirms 4 name scenarios behave correctly.

---

## Out of scope

- **Demographics-extraction changes.** If the user's actual first name is in the data but not being read, that's a separate bug (demographics-parsing). CC-047 fixes the *fallback behavior* when the name isn't found / is a username; not the upstream extraction.
- **Adding a name-prompt to the survey.** The instrument doesn't currently ask for first name explicitly; that's a product-flow change.
- **Renaming `getUserName` / `nameOrYour` / etc.** Keep existing function names.
- **Authoring new prose templates** that use first-person or other-person registers. Pure resolver fix.
- **Editing CC-029 cross-card patterns' prose** to make them more username-resilient. The patterns already use `capitalize(nameOrYour(demographics))` correctly; the fix is upstream at `getUserName`.
- **Validating real names** more strictly than the heuristic (e.g., looking up against name databases). The heuristic is intentionally simple — a clean first name passes; obviously-not-a-name fails. Edge cases (foreign names, single-character names) are acceptable as long as they don't break.
- **Allowing the user to choose how they're addressed.** UX feature for a future CC.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Execution Directive

Single pass. Tight-scope. The four heuristics in `isLikelyUsername` are locked.

## Bash Commands Authorized

- `grep -n "getUserName\|nameOrYour\|first_name\|display_name\|isLikelyUsername" lib/identityEngine.ts lib/freeformProse.ts`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `git diff --stat`
- `git status`

## Read First (Required)

- `lib/identityEngine.ts` — locate `getUserName`, `nameOrYour`, `capitalize` helpers.
- `lib/freeformProse.ts` (or whatever module composes Path · Gait composite prose).
- `prompts/completed/CC-029-pattern-catalog-expansion.md` for context on how patterns use the name helpers.

## Allowed to Modify

- `lib/identityEngine.ts`
- `lib/freeformProse.ts` (only if the name-resolver lives there instead — verify with Read)

## Report Back

1. **Helper added** — `isLikelyUsername` definition and where it's positioned.
2. **`getUserName` updated** — paste before/after.
3. **Consumer verification** — confirm all `getUserName(...)` consumers handle the null return correctly.
4. **Manual sweep** — 4 name scenarios with resolved values and expected prose.
5. **Verification results** — tsc, lint, build.
6. **Browser smoke deferred to Jason**.

---

## Notes for the executing engineer

- The four heuristics in `isLikelyUsername` are locked. Don't tighten or loosen them without flagging.
- If the `display_name` field is meaningfully different from `first_name` in the demographics schema, the fallback chain (`first_name ?? display_name`) should already handle the case where `first_name` is missing. Verify by reading the Demographics type.
- Pre-CC-047 saved sessions: re-rendering picks up the new resolver. The username-pattern users see *"Your"* / *"you"* in their re-rendered reports; users with real first names see no change.
- Edge case: a real first name that contains a digit (e.g., *"D'Angelo"* with apostrophe — wait, that's punctuation, not a digit). Or a real name like *"X Æ A-12"* (Elon Musk's son). The heuristic would flag this as a username. Acceptable — these are edge cases; falling through to *"you"* is graceful.
- Edge case: a real first name in a non-Western character set. The all-lowercase test only fires for ASCII; non-Latin scripts pass through. Verify with a Cyrillic or Hangul test name if convenient.
