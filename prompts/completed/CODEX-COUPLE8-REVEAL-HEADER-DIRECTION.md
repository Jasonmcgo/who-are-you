# CODEX-COUPLE8-REVEAL-HEADER-DIRECTION

> CODEX-scale bug fix. CC-COUPLE-8's bilateral reveal header inverts who-read-whom
> for the `a_guesses_b` direction. The questions, subject resolution, and scoring
> are all CORRECT (verified live: subject = the partner being read, scored against
> their IC). Only the "How clearly X read Y" HEADER label is wrong. Surgical.

## The bug (verified live)

Live bond A=Jason0524, B=Michele. Jason played, reading Michele (direction
`a_guesses_b`: guesser = A/Jason, subject = B/Michele). The questions correctly
read "When Michele is in an argument…" (subject = Michele ✓). But the reveal
header rendered **"How clearly Michele read Jason0524"** — guesser and subject
swapped. It should read **"How clearly Jason0524 read Michele."**

## Root cause

`app/couple/[token]/page.tsx` lines 705–707 hardcode the header to the old
one-directional (CC-COUPLE-7) framing, ignoring `direction`:
```tsx
{partnerBName
  ? `How clearly ${partnerBName} read ${aName === "your partner" ? "your partner" : aName}`
  : `How clearly you read ${aName === "your partner" ? "your partner" : aName}`}
```
This always renders "Partner B read Partner A", which is only correct for
`b_guesses_a`. For `a_guesses_b` it inverts reader and subject. The reveal payload
DOES carry `direction` (`route.ts` RevealPayload ~line 161), but the header doesn't
consult it. Contributing smell: `RevealPayload.partnerAName` is overloaded as "alias
of subjectName" (route ~line 152), so A/B and guesser/subject are conflated.

## Fix — make guesser/subject explicit, render header from them

1. **Route (`app/api/couple/[token]/route.ts`):** the single-direction reveal
   (`buildRevealPayload`, ~548–607) already computes the subject via
   `ctx.subjectName`. Add the direction-aware **`guesserName`** and **`subjectName`**
   to `RevealPayload` and populate them — mirror what `buildDirectionView`
   (~614–623) already does correctly for the compare view (it takes `guesserName`
   and sets `subjectName: ctx.subjectName`). `guesserName` = the partner who is NOT
   the subject for this direction: `a_guesses_b` → guesser = partnerA, subject =
   partnerB; `b_guesses_a` → guesser = partnerB, subject = partnerA.
2. **Page (`app/couple/[token]/page.tsx`, 705–707):** render the header from the
   explicit names:
   ```tsx
   {guesserName
     ? `How clearly ${guesserName} read ${subjectName}`
     : `How clearly you read ${subjectName === "your partner" ? "your partner" : subjectName}`}
   ```
   (Pull `guesserName`/`subjectName` from `data`.) Keep the legacy "you read X"
   branch for Mode-1 one-sided bonds where there's no second partner / no guesser
   name.

Do NOT change the questions, subject IC routing, scoring, or `WarmTotalCard`
(those are correct). Prefer fixing the overloaded `partnerAName`-as-subject alias
by using the new explicit `subjectName`, rather than threading more A/B logic into
the page.

## Acceptance

- Bond A=Jason0524 / B=Michele, Jason plays (a_guesses_b): header reads
  **"How clearly Jason0524 read Michele"**; questions still "When Michele…".
- Michele plays the other side (b_guesses_a): header reads **"How clearly Michele
  read Jason0524"**; questions "When Jason0524…".
- A Mode-1 one-sided bond (no partner B): header still "How clearly you read {subject}".
- The compare view (both done) is unchanged and already correct.
- `npx tsc --noEmit` clean; `npm run lint` clean on the two files; couple-flow +
  coupleReveal audits still green.
- Do NOT commit or push (sandbox: prepend `rm -f .git/index.lock` to any commit
  command handed to Jason).

## Report back

- Before/after header strings for both directions; confirmation questions/scoring
  unchanged; tsc/lint/audit status; confirm only the two files changed.
