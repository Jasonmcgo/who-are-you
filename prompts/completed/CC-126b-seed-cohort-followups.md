# CC-126b — Seed the 13 remaining hand-authored cohort follow-up sets

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass.
Do not stop for confirmation between steps. On ambiguity, apply the
canon-faithful interpretation, proceed, and flag it. Permission bypass is
on; the discipline below is scope.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.
**Depends on CC-126 merged** (`data/cohortFollowUps.ts` exists with the Michele
worked example as the structural template).

## Execution Directive

- **Pure data.** Add the 13 remaining cohort members to `COHORT_FOLLOW_UPS` in
  `data/cohortFollowUps.ts`, elaborating each from Clarence's terse authored
  set (Appendix) into the SAME rich shape as the existing Michele entry. No
  logic, no engine/API changes.

## Read First (Required)

- `data/cohortFollowUps.ts` — the **Michele entry is the template**. Match its
  shape exactly: per question `id` / `purpose` / `question` / `responseMode` /
  `options[]`, and per option `label` (short) / `text` (full sentence) /
  `tags` (string[]) / `interpretation` (one line). Plus `personName`,
  `selectedFamilies`, `reasonForQuestions`.
- `lib/followUpQuestions.ts` — `FollowUpQuestionSet` / `FollowUpPurpose` /
  `FollowUpFamily` types.

## Tasks

For each of the 13 people in the Appendix, add an entry keyed by **lowercase
first name** (e.g. `ashley`, `brad`, …, `connor`). Elaborate Clarence's terse
questions + option labels into the Michele-style rich form:
- Keep Clarence's question intent; you may warm the wording to match Michele's
  register. Keep his `responseMode` (rank_top_2 / rank_top_3 / choose_one).
- Each option: `label` (Clarence's short phrase), `text` (a full first-person
  sentence expressing it), `tags` (scoring signals — see Tagging), `interpretation`.
- `purpose` per question per the Appendix (`grip_object` / `release_condition` /
  `aim_replacement`, or the swap probe `compression_check` / `trait_vs_weather`
  noted for Connor / Brian).
- `selectedFamilies` = the family noted per person.
- `reasonForQuestions` = one sentence on why this person gets this set.

**Tagging rule** (mirror Michele): grip_object options → grip-family tags
(`belonging-*`, `worth-*`, `control-*`, `continuity-*`, `security-*`,
`responsibility-*`) + a cognitive-function tag where apt (`fe`/`fi`/`ti`/`te`/
`ne`/`ni`/`si`/`se`). release_condition options → `release-*`. aim_replacement
options → `aim-*`. compression_check → `compression-*`; trait_vs_weather →
`trait-*` / `weather-*`. `tags[0]` is the one that becomes the write-back
signal, so make it the most discriminating.

**Keying caveat:** `quelcdp`'s demographics name is "Prefer not to say" and the
Anonymous session has no name — so name-based resolution won't auto-match them.
Still add `quelcdp` keyed as `"quelcdp"` (its fixture stem) and add a code
comment that the API must resolve quelcdp's session to that key explicitly (or
it falls through to the generator). Do not invent an Anonymous entry.

## Appendix — Clarence's 13 authored sets (source to elaborate)

Format: `purpose · responseMode` then option labels.

**ashley** — family: `belonging_usefulness` (care texture)
- Q1 grip_object · rank_top_2: people I care about / emotional safety of the room / truth of what I see coming / my own internal clarity / future consequences others miss / sense I've done enough
- Q2 release_condition · choose_one: someone else takes practical responsibility / someone listens without fixing me / permission to not carry the room's emotional temperature / evidence letting go won't harm people I love / time alone to recover my own signal
- Q3 aim_replacement · choose_one: name what I see without managing responses / let someone else carry one emotional burden / ask for help before absorbing the cost / protect one quiet block for reflection / say the true thing simply, then stop explaining

**brad** — family: `security`; trait grip (high baseline, low delta)
- Q1 grip_object · rank_top_2: financial exposure / people dropping balls / loss of credibility / chaos spreading / being blamed for something preventable / a standard collapsing unenforced
- Q2 release_condition · choose_one (which structure most becomes grip): a process that works but no longer needs my control / a standard maintained past its cost / a person I keep correcting / a risk I keep managing after the probability changed / a role I carry because no one else will do it right
- Q3 aim_replacement · choose_one: define the outcome, let someone choose the method / name the acceptable risk and stop managing below it / delegate one decision, don't re-enter unless asked / replace "prevent failure" with "build capacity" / ask "what standard actually matters here?"

**cindy** — family: `belonging_usefulness`
- Q1 grip_object · rank_top_2 (being needed proves): I am loved / I am useful / I am safe in the relationship / I am still connected / I matter / they won't drift away
- Q2 release_condition · choose_one (if you did less, what would you fear): they'd be disappointed / they'd feel less close / they'd judge me / they'd not need me as much / I'd feel selfish / the relationship would feel less certain
- Q3 aim_replacement · choose_one: offer presence before help / let one person solve their own problem / ask "help, or just me with you?" / do one joyful useless thing / let love be received without earning it

**daniel** — family: `security`
- Q1 grip_object · rank_top_2 (why hold the proven plan): plan is genuinely best / changing feels needlessly risky / people depend on consistency / I don't want avoidable disorder / I trust what's worked / I need the fallback before the experiment
- Q2 release_condition · choose_one (what makes experimentation safe): a clear fallback / a small trial with a defined endpoint / a trusted precedent / shared responsibility / clear boundaries on what won't change / time to prepare
- Q3 aim_replacement · choose_one: test one small change without it being a life philosophy / hold one variable movable, rest stable / ask "actual risk vs imagined" / let the plan serve the goal, not become it / use structure as permission, not restriction

**harry** — family: `continuity`
- Q1 grip_object · choose_one (preserving the familiar feels like): home / duty / wisdom / armor / love / survival
- Q2 release_condition · rank_top_2 (new possibility — first reaction): energy / caution / longing / responsibility / quiet resistance / curiosity mixed with guilt
- Q3 aim_replacement · choose_one (loosen one carried obligation): permission from someone I trust / proof the people depending on me will be okay / a bridge from old form to new / a smaller first step / a clear statement that stopping isn't betrayal / someone takes ownership without my asking twice

**jasondmcg** — family: `control_mastery`
- Q1 grip_object · rank_top_3 (building the model protects): avoiding wasted motion / being accurately understood / preventing foreseeable failure / reducing emotional chaos / avoiding dependence on an untrusted room / protecting truth from sloppy thinking / keeping control of how the idea is used / making action feel morally justified
- Q2 release_condition · choose_one (when modeling becomes grip): refining after the next move is clear / needing it defensible before anyone reacts / precision to delay a relational conversation / waiting for certainty only action produces / making it immune to criticism before release / solving architecture to avoid the human decision underneath
- Q3 aim_replacement · choose_one: share the rough model earlier / take one reversible action / name the relational risk directly / define the next 80% move and stop / ask the room where it breaks / decide what doesn't need controlling

**kevin** — family: `belonging_usefulness`; burden/restoration (high load, low delta) — Q3 = restoration probe
- Q1 grip_object · rank_top_2 (reaching for control protects): people I care about / peace in the environment / reducing burden on others / avoiding disappointment / keeping myself from falling behind / preventing one more complication
- Q2 release_condition · choose_one (what relief restores you): rest without guilt / practical help / fewer decisions / emotional permission / room to move freely / someone noticing without being told
- Q3 aim_replacement · choose_one (when pressure lifts, what returns first): playfulness / action / generosity / curiosity / tenderness / decisive care / humor / desire to reconnect

**matti** — family: `worth_achievement`
- Q1 grip_object · rank_top_2 (gripping control protects): excellence / momentum / credibility / financial safety / the standard / fear others won't execute well enough
- Q2 release_condition · choose_one (why being right matters): truth matters / the goal matters / the risk is real / being wrong feels personally expensive / others depend on the decision / I lose trust in myself when I miss something obvious
- Q3 aim_replacement · choose_one: define success by alignment, not achievement / let one decision be good enough to move / ask whether the standard serves mission or ego / invite challenge before defending / protect one non-productive recovery block / let someone own a result without upgrading it

**quelcdp** — family: `control_mastery` (reputation/freedom)
- Q1 grip_object · rank_top_2 (when reputation matters, avoiding): looking weak / losing respect / losing freedom / being trapped / being misunderstood / being controlled by someone's judgment
- Q2 release_condition · choose_one (gripping control gives): freedom / safety / speed / respect / a way out / proof no one owns me
- Q3 aim_replacement · choose_one: one direct action that increases real freedom / tell the truth without performing strength / stop managing appearance, choose the outcome / ask what I'd do if respect weren't at stake / let one person see the uncertainty under the confidence / choose the move that makes me freer next month

**keith** — family: `worth_achievement`
- Q1 grip_object · rank_top_2 (achievement proves): I am valuable / I am needed / I am capable / I am respected / I am not failing people / my care produced something visible
- Q2 release_condition · choose_one (whose disappointment tempts over-functioning): family / team / leaders/authority / people who depend on me emotionally / people I want to impress / myself
- Q3 aim_replacement · choose_one: serve without it looking impressive / let someone carry the consequence of their own role / name what I can and can't give / measure leadership by maturity not applause / stop rescuing one person/system this week / ask whether I'm helping, proving, or performing

**connor** — family: `belonging_usefulness`; **Q2 = compression_check** (low conf + high load + high delta)
- Q1 grip_object · choose_one (when stakes rise, what changes first): stop exploring, need cleanest defensible logic / stop trusting the room, retreat into analysis / become needed then trapped by it / more useful but less free / start managing the risk of being wrong / don't change much, pressure reveals what's there
- Q2 compression_check · rank_top_2 (being needed threatens): my freedom / my usefulness / my identity / my competence / my right to disappoint people / my ability to keep exploring / my sense I can choose my own path
- Q3 aim_replacement · choose_one (when burden lifts, returns first): curiosity / humor / experimentation / debating possibilities / quiet analysis / desire to disappear a while / energy to build something new / playful irreverence

**brian** — family: `worth_achievement`; **Q2 = trait_vs_weather** (high baseline, no delta)
- Q1 grip_object · rank_top_2 (achievement-as-measure protects): respect / safety / control / legacy / financial independence / proof my sacrifices were worth it / freedom from depending on others
- Q2 trait_vs_weather · choose_one (when did this drive become normal): early family expectations / career competition / financial pressure / a major failure or loss / becoming responsible for others / it's always felt like my natural gear / I don't know, but slowing down feels unsafe
- Q3 aim_replacement · choose_one: pursue one goal no one important will know about / define success by freedom not proof / let a win be enough without raising the bar / ask what I'd build with nothing to prove / delegate something meaningful without grading it / protect one relationship from becoming a performance arena

**jake** — family: `control_mastery`
- Q1 grip_object · rank_top_2 (turning uncertainty into a system makes safe): the decision / my credibility / the relationship / the future / my own trust in the answer / the risk of being misunderstood / the room accepting a bad premise
- Q2 release_condition · choose_one (if a belief became expensive, what changes first): the belief itself / how directly I express it / who gets to hear it / how much evidence I require before acting / how much I explain before moving / how willing I am to be misunderstood
- Q3 aim_replacement · choose_one: share the reasoning while it's still forming / ask someone where the framework breaks / state the simple version before the careful one / let the room participate before the conclusion is a verdict / take one relational risk before the logic is armored / trust one good-enough read without converting it to a complete system

## Allowed to Modify (exhaustive)

- `data/cohortFollowUps.ts` only (add the 13 entries; keep Michele unchanged).
- A test/audit file is optional.

## Out of Scope

- Engine / scoring / API / UI changes. The generator (CC-125) and backend
  (CC-126) are done.

## Bash Commands Authorized

- `npx tsc --noEmit`

## Acceptance Criteria

1. `COHORT_FOLLOW_UPS` has all 14 keys (michele + the 13), lowercase first name.
2. Each set: exactly 3 questions; purposes include `grip_object` +
   `aim_replacement` + (`release_condition` or the noted swap); every option has
   non-empty `tags` (tags[0] = the write-back signal) and `interpretation`.
3. `responseMode`s match the Appendix.
4. `npx tsc --noEmit` clean. Michele entry unchanged. No other file modified.

## Report Back

- The 13 keys added; any (e.g. quelcdp) flagged for the name-resolution caveat.
- `tsc` result.
- Paste the full Connor and Harry entries so we can compare to Clarence's source.
