// CC-126 — Hand-authored follow-up question sets, keyed by canonical
// session name (lowercase, hyphen-separated; matches the cohort fixture
// filename stem, e.g. "michele-real" → "michele"). The resolver in
// `lib/followUpResolver.ts` consults this map first; on miss it falls
// back to the CC-125 deterministic generator.
//
// **Sessionkey convention:** canonical lowercase first name. Reasoning:
// - Session UUIDs are auto-generated and differ across local / dev /
//   prod / test databases — keying on UUID would couple the map to a
//   specific DB instance.
// - First name is stable across the cohort's fixtures and saved
//   sessions, and it's the natural way Jason references the people
//   ("Michele", "Connor", "Harry") when authoring their sets.
// - Lowercasing avoids accidental "Michele" vs "michele" misses.
//
// **Scope (CC-126):** ship the structure + 1 worked example. The other
// 13 cohort sets land in CC-126b as a pure data follow-up. The system
// is fully functional with an empty map — every key not found falls
// through to the CC-125 generator.

import type { FollowUpQuestionSet } from "../lib/followUpQuestions";

/**
 * Hand-authored override map. Keys are canonical lowercase first names.
 * Empty entries fall through to the CC-125 generator.
 */
export const COHORT_FOLLOW_UPS: Record<string, FollowUpQuestionSet> = {
  // CC-126 worked example — Michele (ENFP, Ne-dominant, belonging-usefulness
  // family). Mirrors the generator's structure but with Michele-specific
  // wording authored by Clarence. The remaining 13 cohort members are
  // authored separately in CC-126b.
  michele: {
    personName: "Michele",
    selectedFamilies: ["belonging_usefulness"],
    reasonForQuestions:
      "Hand-authored set for Michele's Ne-dominant ENFP shape with Family/Loyalty at the center — the engine reads belonging/usefulness as the grip family; these questions probe the specific texture of that grip in her life rather than the family-generic version.",
    questions: [
      {
        id: "fq1_grip_object",
        purpose: "grip_object",
        question:
          "When you imagine being with the people you love without arranging anything — without preparing the room, anticipating the need, or quietly making the day go — which of these feels most like what your arranging is actually protecting?",
        responseMode: "rank_top_3",
        options: [
          {
            label: "The bond itself",
            text: "Knowing the bond will be there tomorrow whether or not I tended it today.",
            tags: ["belonging-as-continuity", "fe"],
            interpretation: "Grip on the relationship surviving non-effort.",
          },
          {
            label: "Being the one",
            text: "Being the one who reliably arrives when needed.",
            tags: ["being-the-arriver", "fe"],
            interpretation: "Grip on identity-as-role.",
          },
          {
            label: "Not being a burden",
            text: "Never being the one the room has to accommodate.",
            tags: ["self-erasure", "non-burden"],
            interpretation: "Grip on staying-net-positive in the energy ledger.",
          },
          {
            label: "Reading the room",
            text: "Knowing what each person needs before they ask.",
            tags: ["attunement", "ne"],
            interpretation: "Grip on anticipatory care — the Ne fast-read in service of belonging.",
          },
          {
            label: "Kept in",
            text: "Being kept inside the circle by the care work I do for it.",
            tags: ["earning-belonging"],
            interpretation: "Grip = belonging-as-currency.",
          },
          {
            label: "Making it possible",
            text: "What I make possible for them that wouldn't happen otherwise.",
            tags: ["enablement"],
            interpretation: "Grip on downstream-care as the proof-of-love.",
          },
        ],
      },
      {
        id: "fq2_release_condition",
        purpose: "release_condition",
        question:
          "What would actually make it feel safe to stop arranging your usefulness so carefully — to show up tired, or empty-handed, or asking?",
        responseMode: "rank_top_2",
        options: [
          {
            label: "Stays without orchestrating",
            text: "Proof that someone stays present without me orchestrating it.",
            tags: ["release-unearned", "fe"],
            interpretation: "Release through non-conditional bond.",
          },
          {
            label: "Reciprocal hand first",
            text: "A reciprocal hand offered to me before I ask.",
            tags: ["release-reciprocity", "fi"],
            interpretation: "Release through being-held-first.",
          },
          {
            label: "Received tired",
            text: "Being received warmly the day I show up tired.",
            tags: ["release-non-performative", "fe"],
            interpretation: "Release through unguarded reception.",
          },
          {
            label: "Ask without performing",
            text: "Permission to ask for something without performing the need.",
            tags: ["release-asking"],
            interpretation: "Release through unperformed-ask.",
          },
          {
            label: "Absence doesn't end it",
            text: "Evidence that the bond holds across my actual absence.",
            tags: ["release-secure-distance"],
            interpretation: "Release through continuity-without-me.",
          },
          {
            label: "Named, not used",
            text: "Being named for who I am, not for what I make possible.",
            tags: ["release-named", "fi"],
            interpretation: "Release through ontological recognition.",
          },
        ],
      },
      {
        id: "fq3_aim_replacement",
        purpose: "aim_replacement",
        question:
          "If the grip on being-useful softened, what could the same warm attentive instrument be aimed at instead — without becoming someone you're not?",
        responseMode: "rank_top_3",
        options: [
          {
            label: "Presence, not function",
            text: "Belonging measured as presence, not as function.",
            tags: ["aim-presence", "fe"],
            interpretation: "Aim shifts from doing-to-belong to being-belonged.",
          },
          {
            label: "Care that includes me",
            text: "Care that explicitly includes me as a recipient.",
            tags: ["aim-self-care", "fi"],
            interpretation: "Aim names self-care as part of love.",
          },
          {
            label: "Possibility for them",
            text: "Aimed at what's becoming possible in the people I love — the Ne attention turned generatively outward.",
            tags: ["aim-ne-outward", "ne"],
            interpretation: "Aim = future-seeing on behalf of others.",
          },
          {
            label: "Past the role",
            text: "The relationship past the role — them, with me, not them-with-the-arrival-of-Michele.",
            tags: ["aim-beyond-role"],
            interpretation: "Aim = identity outside function.",
          },
          {
            label: "Receive without repay",
            text: "Receiving without paying back.",
            tags: ["aim-receive"],
            interpretation: "Aim = gift-economy register.",
          },
          {
            label: "Known by name",
            text: "Being known by name, not by the role.",
            tags: ["aim-named", "fi"],
            interpretation: "Aim = ontological belonging.",
          },
        ],
      },
    ],
  },

  // CC-126b — Ashley (belonging/usefulness, care-texture variant).
  // Carries the room's emotional weather as her grip; release-condition
  // probes whether someone else can hold practical / emotional
  // responsibility so she can recover her own signal.
  ashley: {
    personName: "Ashley",
    selectedFamilies: ["belonging_usefulness"],
    reasonForQuestions:
      "Hand-authored set for Ashley's belonging/usefulness shape with a care-texture signature — the grip lands on holding the room's emotional weather and seeing what others miss; the probes name what she'd need to set the weather down without harm.",
    questions: [
      {
        id: "fq1_grip_object",
        purpose: "grip_object",
        question:
          "When you imagine letting go of how the room is feeling — not managing it, not anticipating who needs what — which of these does the grip most want to protect?",
        responseMode: "rank_top_2",
        options: [
          {
            label: "People I care about",
            text: "The wellbeing of the specific people I care about most.",
            tags: ["belonging-people-care", "fe"],
            interpretation: "Grip on protective custody of beloveds.",
          },
          {
            label: "Emotional safety of the room",
            text: "The emotional safety of the room — keeping it from going hard or cold.",
            tags: ["belonging-room-safety", "fe"],
            interpretation: "Grip on collective emotional climate.",
          },
          {
            label: "Truth of what I see coming",
            text: "The accuracy of the read I have on what's about to happen.",
            tags: ["control-foresight", "ni"],
            interpretation: "Grip on the long-arc seeing.",
          },
          {
            label: "My own internal clarity",
            text: "My own internal clarity about what's actually going on.",
            tags: ["control-internal-clarity", "fi"],
            interpretation: "Grip on self-honesty.",
          },
          {
            label: "Future consequences others miss",
            text: "The downstream consequences nobody else seems to be tracking.",
            tags: ["control-foresight-prevent", "ni"],
            interpretation: "Grip on harm-prevention through foresight.",
          },
          {
            label: "Sense I've done enough",
            text: "The sense that I've done enough — that nothing was left undone on my watch.",
            tags: ["worth-done-enough"],
            interpretation: "Grip on done-enough as proof.",
          },
        ],
      },
      {
        id: "fq2_release_condition",
        purpose: "release_condition",
        question:
          "What would actually make it feel safe to stop carrying the room and recover your own signal?",
        responseMode: "choose_one",
        options: [
          {
            label: "Practical responsibility taken",
            text: "Someone else taking practical responsibility for the thing I'm holding.",
            tags: ["release-practical-handoff"],
            interpretation: "Release through external structural ownership.",
          },
          {
            label: "Listened to without fixing",
            text: "Someone listens to what I see without trying to fix me.",
            tags: ["release-witnessed-not-fixed", "fi"],
            interpretation: "Release through unfixed witness.",
          },
          {
            label: "Not carrying the temperature",
            text: "Permission to stop carrying the room's emotional temperature.",
            tags: ["release-no-temperature-keeping", "fe"],
            interpretation: "Release through climate-care delegation.",
          },
          {
            label: "Letting go won't harm",
            text: "Evidence that letting go won't harm the people I love.",
            tags: ["release-non-harm"],
            interpretation: "Release through assured non-injury.",
          },
          {
            label: "Solitude to recover",
            text: "A block of time alone to recover my own signal.",
            tags: ["release-solitude-restore", "fi"],
            interpretation: "Release through solo-restoration.",
          },
        ],
      },
      {
        id: "fq3_aim_replacement",
        purpose: "aim_replacement",
        question:
          "If the grip on holding the room softened, what could the same care and seeing be aimed at instead?",
        responseMode: "choose_one",
        options: [
          {
            label: "Name what I see, don't manage",
            text: "Name what I see without managing how anyone reacts to it.",
            tags: ["aim-naming-without-managing", "ni"],
            interpretation: "Aim = naming-without-stewarding.",
          },
          {
            label: "Let one burden go",
            text: "Let someone else carry one emotional burden I've been holding.",
            tags: ["aim-delegate-emotional"],
            interpretation: "Aim = explicit emotional delegation.",
          },
          {
            label: "Ask before absorbing",
            text: "Ask for help before I've already absorbed the cost.",
            tags: ["aim-ask-first"],
            interpretation: "Aim = pre-cost asking.",
          },
          {
            label: "Quiet block protected",
            text: "Protect one quiet block in the week for my own reflection.",
            tags: ["aim-solitude-claimed", "fi"],
            interpretation: "Aim = solitude as discipline.",
          },
          {
            label: "Say it simply, stop",
            text: "Say the true thing simply, then stop explaining.",
            tags: ["aim-stop-explaining", "ti"],
            interpretation: "Aim = unannotated truth.",
          },
        ],
      },
    ],
  },

  // CC-126b — Brad (security, trait-grip variant). High baseline grip
  // with low stakes-amplifier delta — the grip is the shape, not the
  // weather. Probes the structures Brad now over-maintains.
  brad: {
    personName: "Brad",
    selectedFamilies: ["security"],
    reasonForQuestions:
      "Hand-authored set for Brad's security-family trait grip (high baseline, low delta) — the grip operates as background discipline regardless of stakes; the probes ask which structures and standards have outgrown their protective purpose.",
    questions: [
      {
        id: "fq1_grip_object",
        purpose: "grip_object",
        question:
          "When you imagine the system or standard running without your hand on it, which loss does the grip most want to prevent?",
        responseMode: "rank_top_2",
        options: [
          {
            label: "Financial exposure",
            text: "Real financial exposure landing on me or the people I'm responsible for.",
            tags: ["security-financial"],
            interpretation: "Grip on capital + downside protection.",
          },
          {
            label: "People dropping balls",
            text: "People dropping balls I've quietly been catching.",
            tags: ["security-execution-failure", "te"],
            interpretation: "Grip on execution-floor.",
          },
          {
            label: "Loss of credibility",
            text: "A loss of credibility in domains where I've earned standing.",
            tags: ["security-credibility"],
            interpretation: "Grip on hard-won reputation.",
          },
          {
            label: "Chaos spreading",
            text: "Disorder spreading from one corner into the rest of the system.",
            tags: ["security-anti-chaos"],
            interpretation: "Grip on chaos-containment.",
          },
          {
            label: "Being blamed",
            text: "Being blamed for something that was clearly preventable.",
            tags: ["security-blame-avoidance"],
            interpretation: "Grip on pre-empting fault.",
          },
          {
            label: "Standard collapsing",
            text: "A standard collapsing because no one is enforcing it.",
            tags: ["security-standard-erosion", "te"],
            interpretation: "Grip as standard-enforcement.",
          },
        ],
      },
      {
        id: "fq2_release_condition",
        purpose: "release_condition",
        question:
          "Of the structures you maintain, which one most needs to become a system that works without your control — which one has crossed from useful to gripped?",
        responseMode: "choose_one",
        options: [
          {
            label: "Process now mature",
            text: "A process that works but no longer actually needs my control to keep running.",
            tags: ["release-process-mature"],
            interpretation: "Release through letting a mature process run.",
          },
          {
            label: "Standard past its cost",
            text: "A standard I keep maintaining past the point where it costs more than it returns.",
            tags: ["release-standard-past-cost"],
            interpretation: "Release through cost-benefit recalibration.",
          },
          {
            label: "Person I keep correcting",
            text: "A person I keep correcting in ways the correction is no longer changing.",
            tags: ["release-stop-correcting"],
            interpretation: "Release through corrective fatigue.",
          },
          {
            label: "Risk past its probability",
            text: "A risk I keep managing for after the probability has clearly dropped.",
            tags: ["release-risk-recalibrate", "ti"],
            interpretation: "Release through risk re-pricing.",
          },
          {
            label: "Role I carry alone",
            text: "A role I carry because no one else will do it to the standard.",
            tags: ["release-let-others-fail"],
            interpretation: "Release through tolerating others' floor.",
          },
        ],
      },
      {
        id: "fq3_aim_replacement",
        purpose: "aim_replacement",
        question:
          "If the security grip softened, where could the same vigilance and standard-setting be aimed instead?",
        responseMode: "choose_one",
        options: [
          {
            label: "Outcome, not method",
            text: "Define the outcome and let someone else choose the method.",
            tags: ["aim-outcome-not-method", "te"],
            interpretation: "Aim = method-blind outcome ownership.",
          },
          {
            label: "Acceptable risk named",
            text: "Name the acceptable risk and stop actively managing anything below it.",
            tags: ["aim-risk-tolerance"],
            interpretation: "Aim = named-risk-floor.",
          },
          {
            label: "Clean delegation",
            text: "Delegate one decision and don't re-enter unless I'm asked back in.",
            tags: ["aim-clean-delegation"],
            interpretation: "Aim = un-revisited handoff.",
          },
          {
            label: "Capacity, not prevention",
            text: "Replace \"prevent failure\" with \"build capacity\" as the work I do.",
            tags: ["aim-capacity-not-prevention"],
            interpretation: "Aim = capacity over guardrail.",
          },
          {
            label: "Standard audit",
            text: "Ask honestly what standard actually matters here, versus what's habit.",
            tags: ["aim-standard-audit"],
            interpretation: "Aim = relevance over enforcement.",
          },
        ],
      },
    ],
  },

  // CC-126b — Cindy (belonging/usefulness). The grip is on being-needed
  // as proof of love / safety / connection; probes ask what being
  // needed is protecting and what to fear if she did less.
  cindy: {
    personName: "Cindy",
    selectedFamilies: ["belonging_usefulness"],
    reasonForQuestions:
      "Hand-authored set for Cindy's belonging/usefulness shape with being-needed as the central currency — the probes name what being-needed is actually proving for her and what release would mean inside her closest bonds.",
    questions: [
      {
        id: "fq1_grip_object",
        purpose: "grip_object",
        question:
          "When you imagine someone you love living a day where you weren't quietly making things easier for them, what does the grip on being-needed most want to prove?",
        responseMode: "rank_top_2",
        options: [
          {
            label: "I am loved",
            text: "That I am loved — being needed is the proof.",
            tags: ["belonging-as-loved", "fe"],
            interpretation: "Grip on love-as-need.",
          },
          {
            label: "I am useful",
            text: "That I am useful enough to deserve the place I have.",
            tags: ["belonging-as-useful"],
            interpretation: "Grip on usefulness-as-belonging.",
          },
          {
            label: "I am safe",
            text: "That I am safe inside this relationship — that the bond holds.",
            tags: ["belonging-safety"],
            interpretation: "Grip on relational safety.",
          },
          {
            label: "I am still connected",
            text: "That I am still connected, still close, not slipping out.",
            tags: ["belonging-still-connected", "fe"],
            interpretation: "Grip on continuity of closeness.",
          },
          {
            label: "I matter",
            text: "That I matter — that my being here makes a difference.",
            tags: ["worth-matter"],
            interpretation: "Grip on ontological mattering.",
          },
          {
            label: "They won't drift away",
            text: "That they won't quietly drift away if I'm not the one tending the closeness.",
            tags: ["belonging-no-drift"],
            interpretation: "Grip on anti-drift vigilance.",
          },
        ],
      },
      {
        id: "fq2_release_condition",
        purpose: "release_condition",
        question:
          "If you did less for them this week — quieter, smaller, not anticipating — what would you most fear?",
        responseMode: "choose_one",
        options: [
          {
            label: "They'd be disappointed",
            text: "That they'd be disappointed in me without saying so.",
            tags: ["release-fear-disappointment", "fe"],
            interpretation: "Release-block: fear of silent disappointment.",
          },
          {
            label: "They'd feel less close",
            text: "That they'd feel less close even if nothing else changed.",
            tags: ["release-fear-distance"],
            interpretation: "Release-block: fear of intimacy fade.",
          },
          {
            label: "They'd judge me",
            text: "That they'd judge me as having checked out.",
            tags: ["release-fear-judgment"],
            interpretation: "Release-block: fear of being read as cold.",
          },
          {
            label: "Not needed as much",
            text: "That they'd not need me as much — and the role would feel smaller.",
            tags: ["release-fear-not-needed"],
            interpretation: "Release-block: fear of need-loss.",
          },
          {
            label: "I'd feel selfish",
            text: "That I'd feel selfish for keeping the energy for myself.",
            tags: ["release-fear-selfish", "fi"],
            interpretation: "Release-block: internal selfishness verdict.",
          },
          {
            label: "Relationship less certain",
            text: "That the relationship would feel less certain when I stopped tending it.",
            tags: ["release-fear-uncertainty"],
            interpretation: "Release-block: fear of bond-uncertainty.",
          },
        ],
      },
      {
        id: "fq3_aim_replacement",
        purpose: "aim_replacement",
        question:
          "If being-needed softened as the measure, what could the same warm attention be aimed at instead?",
        responseMode: "choose_one",
        options: [
          {
            label: "Presence before help",
            text: "Offer presence before help — be there before solving anything.",
            tags: ["aim-presence-first", "fe"],
            interpretation: "Aim = company over service.",
          },
          {
            label: "Let them solve",
            text: "Let one person solve their own problem without my making it easier.",
            tags: ["aim-let-them-solve"],
            interpretation: "Aim = restraint as care.",
          },
          {
            label: "Help, or just me?",
            text: "Ask the question: \"Do you want help, or just me with you?\"",
            tags: ["aim-explicit-ask"],
            interpretation: "Aim = consent-based care.",
          },
          {
            label: "One joyful useless thing",
            text: "Do one joyful useless thing together that isn't in service of anything.",
            tags: ["aim-useless-joy"],
            interpretation: "Aim = non-instrumental closeness.",
          },
          {
            label: "Love without earning",
            text: "Let love be received without earning it through tending.",
            tags: ["aim-receive-love"],
            interpretation: "Aim = unearned belonging.",
          },
        ],
      },
    ],
  },

  // CC-126b — Daniel (security, plan-keeper variant). Holds the proven
  // plan because changing feels needlessly risky; probes what would
  // make small experimentation actually feel safe.
  daniel: {
    personName: "Daniel",
    selectedFamilies: ["security"],
    reasonForQuestions:
      "Hand-authored set for Daniel's security-family precedent-keeper shape — the grip lands on the proven plan and the cost of avoidable disorder; the probes name what kind of fallback or boundary would let one variable safely move.",
    questions: [
      {
        id: "fq1_grip_object",
        purpose: "grip_object",
        question:
          "When you imagine changing course on something that's been working, what does the grip on the proven plan most want to protect?",
        responseMode: "rank_top_2",
        options: [
          {
            label: "Plan is genuinely best",
            text: "That this really is the best plan, not just the familiar one.",
            tags: ["security-best-plan", "te"],
            interpretation: "Grip on plan-as-optimum.",
          },
          {
            label: "Change is needlessly risky",
            text: "Avoiding change that feels needlessly risky for what it returns.",
            tags: ["security-change-aversion"],
            interpretation: "Grip on risk-aversion-by-default.",
          },
          {
            label: "People depend on consistency",
            text: "The people who depend on me being consistent.",
            tags: ["security-others-depend"],
            interpretation: "Grip on others' confidence in stability.",
          },
          {
            label: "Avoidable disorder",
            text: "Avoiding the kind of disorder I can clearly see coming if I move the variable.",
            tags: ["security-anti-disorder", "si"],
            interpretation: "Grip on preserved order.",
          },
          {
            label: "Trust what's worked",
            text: "Trusting what's already worked over what hasn't proven itself yet.",
            tags: ["security-trust-precedent", "si"],
            interpretation: "Grip on precedent as evidence.",
          },
          {
            label: "Fallback before experiment",
            text: "Having a real fallback before allowing an experiment.",
            tags: ["security-fallback-first"],
            interpretation: "Grip on safety-net-first.",
          },
        ],
      },
      {
        id: "fq2_release_condition",
        purpose: "release_condition",
        question:
          "What would actually make a small experiment feel safe enough to try?",
        responseMode: "choose_one",
        options: [
          {
            label: "Clear fallback",
            text: "A clear, identified fallback I can return to without consequence.",
            tags: ["release-fallback-defined"],
            interpretation: "Release through named retreat path.",
          },
          {
            label: "Bounded trial",
            text: "A small trial with a defined endpoint.",
            tags: ["release-bounded-trial"],
            interpretation: "Release through time-boxed exposure.",
          },
          {
            label: "Trusted precedent",
            text: "A trusted precedent I can cite when others ask why I'm changing.",
            tags: ["release-precedent-cover", "si"],
            interpretation: "Release through lineage-cover.",
          },
          {
            label: "Shared responsibility",
            text: "Shared responsibility for the outcome — not mine alone.",
            tags: ["release-shared"],
            interpretation: "Release through co-ownership.",
          },
          {
            label: "Boundaries on change",
            text: "Clear boundaries on what won't change while one thing does.",
            tags: ["release-bounded-experiment"],
            interpretation: "Release through stability-around-the-experiment.",
          },
          {
            label: "Time to prepare",
            text: "Enough time to prepare for the move rather than improvise into it.",
            tags: ["release-preparation-time"],
            interpretation: "Release through preparation-window.",
          },
        ],
      },
      {
        id: "fq3_aim_replacement",
        purpose: "aim_replacement",
        question:
          "If the grip on the proven plan softened, what could the same steadiness be aimed at instead?",
        responseMode: "choose_one",
        options: [
          {
            label: "One small test",
            text: "Test one small change without it becoming a life philosophy.",
            tags: ["aim-small-test"],
            interpretation: "Aim = bounded change as practice.",
          },
          {
            label: "One variable movable",
            text: "Hold one variable movable while the rest stays stable.",
            tags: ["aim-one-variable"],
            interpretation: "Aim = single-axis flexibility.",
          },
          {
            label: "Actual risk audit",
            text: "Ask honestly what the actual risk is, versus what I'm imagining.",
            tags: ["aim-risk-audit", "ti"],
            interpretation: "Aim = risk-rationalization.",
          },
          {
            label: "Plan serves the goal",
            text: "Let the plan serve the goal, not become the goal.",
            tags: ["aim-plan-serves-goal"],
            interpretation: "Aim = goal-first planning.",
          },
          {
            label: "Structure as permission",
            text: "Use structure as permission to move, not as restriction.",
            tags: ["aim-structure-permission"],
            interpretation: "Aim = structure-as-freedom.",
          },
        ],
      },
    ],
  },

  // CC-126b — Harry (continuity, Si-dominant). The grip on the
  // familiar reads as home / duty / armor; release probes what
  // happens when something new arrives.
  harry: {
    personName: "Harry",
    selectedFamilies: ["continuity"],
    reasonForQuestions:
      "Hand-authored set for Harry's continuity-family Si-dominant shape — the grip carries lineage and the familiar; the probes ask which register the familiar most lives in, how new possibility lands, and what would let him set down one carried obligation honorably.",
    questions: [
      {
        id: "fq1_grip_object",
        purpose: "grip_object",
        question:
          "When you imagine preserving the familiar — keeping what's already shown its keep — which of these does that holding feel most like?",
        responseMode: "choose_one",
        options: [
          {
            label: "Home",
            text: "Home — the steady place I return to.",
            tags: ["continuity-as-home", "si"],
            interpretation: "Continuity-as-home register.",
          },
          {
            label: "Duty",
            text: "Duty — what was handed to me to keep.",
            tags: ["continuity-as-duty"],
            interpretation: "Continuity-as-duty register.",
          },
          {
            label: "Wisdom",
            text: "Wisdom — the proof of what's been learned the hard way.",
            tags: ["continuity-as-wisdom"],
            interpretation: "Continuity-as-wisdom register.",
          },
          {
            label: "Armor",
            text: "Armor — protection against what would otherwise reach me.",
            tags: ["continuity-as-armor"],
            interpretation: "Continuity-as-armor register.",
          },
          {
            label: "Love",
            text: "Love — fidelity to the people who taught me what to hold.",
            tags: ["continuity-as-love", "fe"],
            interpretation: "Continuity-as-love register.",
          },
          {
            label: "Survival",
            text: "Survival — the thing that keeps the floor under me.",
            tags: ["continuity-as-survival"],
            interpretation: "Continuity-as-survival register.",
          },
        ],
      },
      {
        id: "fq2_release_condition",
        purpose: "release_condition",
        question:
          "When a real new possibility surfaces — something genuinely different — which of these arrive first in you?",
        responseMode: "rank_top_2",
        options: [
          {
            label: "Energy",
            text: "Energy — something in me leans toward it.",
            tags: ["release-energy"],
            interpretation: "First-arrival: forward energy.",
          },
          {
            label: "Caution",
            text: "Caution — what hasn't been thought through yet?",
            tags: ["release-caution-first"],
            interpretation: "First-arrival: protective audit.",
          },
          {
            label: "Longing",
            text: "Longing — something I hadn't named wanted this.",
            tags: ["release-longing"],
            interpretation: "First-arrival: surfaced wanting.",
          },
          {
            label: "Responsibility",
            text: "Responsibility — what about the people I'm already carrying?",
            tags: ["release-responsibility-first"],
            interpretation: "First-arrival: duty-of-the-already-held.",
          },
          {
            label: "Quiet resistance",
            text: "Quiet resistance — a part of me that doesn't want to look.",
            tags: ["release-quiet-resistance"],
            interpretation: "First-arrival: held back.",
          },
          {
            label: "Curiosity with guilt",
            text: "Curiosity mixed with guilt — wanting to look, feeling I shouldn't.",
            tags: ["release-curiosity-with-guilt"],
            interpretation: "First-arrival: bound curiosity.",
          },
        ],
      },
      {
        id: "fq3_aim_replacement",
        purpose: "aim_replacement",
        question:
          "If you were to honorably set down one obligation you've been carrying, what would actually make that feel right?",
        responseMode: "choose_one",
        options: [
          {
            label: "Trusted permission",
            text: "Permission from someone whose judgment I trust.",
            tags: ["aim-trusted-permission", "fe"],
            interpretation: "Aim = relational authorization.",
          },
          {
            label: "Others okay",
            text: "Proof that the people depending on me will be okay.",
            tags: ["aim-others-okay"],
            interpretation: "Aim = downstream-safety confirmed.",
          },
          {
            label: "Bridge old to new",
            text: "A clear bridge from the old form to the new.",
            tags: ["aim-old-to-new-bridge", "si"],
            interpretation: "Aim = honored transition.",
          },
          {
            label: "Smaller first step",
            text: "A smaller first step that doesn't ask for the whole change at once.",
            tags: ["aim-small-step"],
            interpretation: "Aim = incremental honoring.",
          },
          {
            label: "Not betrayal",
            text: "A clear statement, internal or spoken, that stopping isn't betrayal.",
            tags: ["aim-not-betrayal"],
            interpretation: "Aim = release-from-loyalty.",
          },
          {
            label: "Clean handoff",
            text: "Someone takes ownership without my having to ask twice.",
            tags: ["aim-clean-handoff"],
            interpretation: "Aim = un-asked-twice succession.",
          },
        ],
      },
    ],
  },

  // CC-126b — Jason (control_mastery, Ni-dominant architect). The grip
  // lives in building the model; probes ask when modeling crosses from
  // useful into avoidance, and what action can replace the model.
  jasondmcg: {
    personName: "Jason",
    selectedFamilies: ["control_mastery"],
    reasonForQuestions:
      "Hand-authored set for Jason's control/mastery architect shape — the grip operates as model-building before motion; the probes ask what the model is protecting, where modeling has crossed into avoidance, and which release is action.",
    questions: [
      {
        id: "fq1_grip_object",
        purpose: "grip_object",
        question:
          "When you imagine acting on something before the model is fully built, which of these does the grip on building most want to protect?",
        responseMode: "rank_top_3",
        options: [
          {
            label: "Avoiding wasted motion",
            text: "Avoiding motion that turns out to have been wasted.",
            tags: ["control-anti-waste", "te"],
            interpretation: "Grip on motion-efficiency.",
          },
          {
            label: "Being accurately understood",
            text: "Being accurately understood the first time, not via correction.",
            tags: ["control-accurate-understanding", "ni"],
            interpretation: "Grip on first-pass legibility.",
          },
          {
            label: "Preventing foreseeable failure",
            text: "Preventing the failure mode I can already see from here.",
            tags: ["control-prevention", "ni"],
            interpretation: "Grip on foresight-driven prevention.",
          },
          {
            label: "Reducing emotional chaos",
            text: "Reducing the emotional chaos that follows when something is ambiguous.",
            tags: ["control-emotion-modeled", "ti"],
            interpretation: "Grip on ambiguity-as-cost.",
          },
          {
            label: "Not depending on the room",
            text: "Avoiding dependence on a room I don't fully trust to read it correctly.",
            tags: ["control-self-sufficiency"],
            interpretation: "Grip on independence-from-other-readers.",
          },
          {
            label: "Truth from sloppy thinking",
            text: "Protecting the truth of the read from sloppy thinking around it.",
            tags: ["control-truth-protected", "ti"],
            interpretation: "Grip on epistemic floor.",
          },
          {
            label: "Stewardship of the idea",
            text: "Keeping control of how the idea gets used downstream.",
            tags: ["control-idea-stewardship"],
            interpretation: "Grip on downstream stewardship.",
          },
          {
            label: "Action morally justified",
            text: "Making action feel morally justified before taking it.",
            tags: ["control-morally-justified"],
            interpretation: "Grip on conscience-pre-action.",
          },
        ],
      },
      {
        id: "fq2_release_condition",
        purpose: "release_condition",
        question:
          "Of these, which most names the moment modeling has stopped serving the work and become the grip itself?",
        responseMode: "choose_one",
        options: [
          {
            label: "Refining past clarity",
            text: "Refining the model after the next move is already clear.",
            tags: ["release-stop-refining"],
            interpretation: "Release-tell: refinement-past-decision.",
          },
          {
            label: "Defensible before reaction",
            text: "Needing it defensible before anyone has had a chance to react.",
            tags: ["release-stop-pre-defending"],
            interpretation: "Release-tell: pre-emptive defense.",
          },
          {
            label: "Precision delaying conversation",
            text: "Using precision to delay a relational conversation I'd rather not have.",
            tags: ["release-precision-as-avoidance"],
            interpretation: "Release-tell: precision-as-avoidance.",
          },
          {
            label: "Waiting for certainty",
            text: "Waiting for a certainty that only action will actually produce.",
            tags: ["release-certainty-loop"],
            interpretation: "Release-tell: certainty-before-action loop.",
          },
          {
            label: "Immune to criticism first",
            text: "Making it immune to criticism before release.",
            tags: ["release-criticism-armor"],
            interpretation: "Release-tell: pre-armored release.",
          },
          {
            label: "Architecture as avoidance",
            text: "Solving the architecture to avoid the human decision underneath.",
            tags: ["release-architecture-as-avoidance"],
            interpretation: "Release-tell: technical decoy for relational ask.",
          },
        ],
      },
      {
        id: "fq3_aim_replacement",
        purpose: "aim_replacement",
        question:
          "If the grip on building the model softened, what action could the same instrument be aimed at instead?",
        responseMode: "choose_one",
        options: [
          {
            label: "Share the rough model",
            text: "Share the rough version of the model earlier than feels comfortable.",
            tags: ["aim-share-rough"],
            interpretation: "Aim = pre-polished exposure.",
          },
          {
            label: "One reversible action",
            text: "Take one reversible action before the model is complete.",
            tags: ["aim-reversible-action"],
            interpretation: "Aim = action-as-information.",
          },
          {
            label: "Name relational risk",
            text: "Name the relational risk directly instead of routing through structure.",
            tags: ["aim-relational-direct"],
            interpretation: "Aim = direct over architected.",
          },
          {
            label: "80% and stop",
            text: "Define the next 80% move and stop building beyond it.",
            tags: ["aim-80-and-stop"],
            interpretation: "Aim = bounded completeness.",
          },
          {
            label: "Room as tester",
            text: "Ask the room where the model breaks rather than predicting every break.",
            tags: ["aim-room-as-tester", "ne"],
            interpretation: "Aim = participatory falsification.",
          },
          {
            label: "What needs no control",
            text: "Decide what doesn't need to be controlled, and leave it alone.",
            tags: ["aim-pick-noncontrol"],
            interpretation: "Aim = explicit non-control inventory.",
          },
        ],
      },
    ],
  },

  // CC-126b — Kevin (belonging/usefulness, burden/restoration). High
  // load + low stakes-amplifier delta; Q3 is the burden-restoration
  // probe (what comes back first when pressure lifts).
  kevin: {
    personName: "Kevin",
    selectedFamilies: ["belonging_usefulness"],
    reasonForQuestions:
      "Hand-authored set for Kevin's belonging/usefulness shape under high load with low stakes-reactivity — the grip is acting as quiet maintenance more than acute response; the Q3 restoration probe asks what returns first when the load lifts.",
    questions: [
      {
        id: "fq1_grip_object",
        purpose: "grip_object",
        question:
          "When you reach for control of a situation, which of these is the grip most often protecting?",
        responseMode: "rank_top_2",
        options: [
          {
            label: "People I care about",
            text: "The people I care about most — keeping their day or week from getting worse.",
            tags: ["belonging-protect-people", "fe"],
            interpretation: "Grip on direct protection of beloveds.",
          },
          {
            label: "Peace in the environment",
            text: "The peace of the environment around me — keeping it from going hard.",
            tags: ["belonging-peace", "fe"],
            interpretation: "Grip on ambient peace.",
          },
          {
            label: "Reducing burden on others",
            text: "Reducing whatever burden the situation puts on other people.",
            tags: ["belonging-burden-reduction"],
            interpretation: "Grip on burden-deflection.",
          },
          {
            label: "Avoiding disappointment",
            text: "Avoiding the disappointment that would land if I didn't show up.",
            tags: ["belonging-anti-disappointment"],
            interpretation: "Grip on disappointment-prevention.",
          },
          {
            label: "Not falling behind",
            text: "Keeping myself from falling behind on what's mine to do.",
            tags: ["worth-pace"],
            interpretation: "Grip on self-pace.",
          },
          {
            label: "One less complication",
            text: "Preventing one more complication from landing on the pile.",
            tags: ["security-anti-complication"],
            interpretation: "Grip on complication-floor.",
          },
        ],
      },
      {
        id: "fq2_release_condition",
        purpose: "release_condition",
        question:
          "What kind of relief, specifically, actually restores you — not vague rest, but the texture of it?",
        responseMode: "choose_one",
        options: [
          {
            label: "Rest without guilt",
            text: "Rest without the background guilt that I should be doing something.",
            tags: ["release-rest-without-guilt"],
            interpretation: "Release through guilt-free rest.",
          },
          {
            label: "Practical help",
            text: "Practical help on one concrete thing on the list.",
            tags: ["release-practical-help"],
            interpretation: "Release through concrete load-share.",
          },
          {
            label: "Fewer decisions",
            text: "Fewer decisions to make in a given hour.",
            tags: ["release-decision-relief"],
            interpretation: "Release through decision-fatigue relief.",
          },
          {
            label: "Emotional permission",
            text: "Emotional permission — someone saying it's okay to not be okay.",
            tags: ["release-emotional-permission", "fi"],
            interpretation: "Release through explicit emotional safety.",
          },
          {
            label: "Room to move",
            text: "Room to move freely — unstructured time that isn't claimed.",
            tags: ["release-freedom-of-motion"],
            interpretation: "Release through unclaimed time.",
          },
          {
            label: "Noticed unprompted",
            text: "Someone noticing the load without my having to tell them.",
            tags: ["release-being-noticed", "fe"],
            interpretation: "Release through unprompted seeing.",
          },
        ],
      },
      {
        id: "fq3_aim_replacement",
        purpose: "aim_replacement",
        question:
          "When the pressure actually does lift — when there's space — which of these comes back to you first?",
        responseMode: "choose_one",
        options: [
          {
            label: "Playfulness",
            text: "Playfulness — the part of me that messes around.",
            tags: ["aim-playfulness"],
            interpretation: "Restoration: play returns.",
          },
          {
            label: "Action",
            text: "Action — wanting to make a move I'd been putting off.",
            tags: ["aim-action-return"],
            interpretation: "Restoration: agency returns.",
          },
          {
            label: "Generosity",
            text: "Generosity — wanting to give without doing the math.",
            tags: ["aim-generosity"],
            interpretation: "Restoration: ungrudging giving.",
          },
          {
            label: "Curiosity",
            text: "Curiosity — interest in something I hadn't been able to make room for.",
            tags: ["aim-curiosity", "ne"],
            interpretation: "Restoration: open-curiosity returns.",
          },
          {
            label: "Tenderness",
            text: "Tenderness — being able to be soft without bracing.",
            tags: ["aim-tenderness", "fe"],
            interpretation: "Restoration: softness returns.",
          },
          {
            label: "Decisive care",
            text: "Decisive care — knowing what to do for someone and just doing it.",
            tags: ["aim-decisive-care"],
            interpretation: "Restoration: clear caregiving.",
          },
          {
            label: "Humor",
            text: "Humor — finding things funny again.",
            tags: ["aim-humor"],
            interpretation: "Restoration: humor returns.",
          },
          {
            label: "Desire to reconnect",
            text: "The desire to reconnect with specific people I've been holding at a small distance.",
            tags: ["aim-reconnect"],
            interpretation: "Restoration: reach-toward.",
          },
        ],
      },
    ],
  },

  // CC-126b — Matti (worth_achievement, standard-defender variant).
  // The grip defends the standard and execution-quality; probes ask
  // what release looks like when truth isn't on the line.
  matti: {
    personName: "Matti",
    selectedFamilies: ["worth_achievement"],
    reasonForQuestions:
      "Hand-authored set for Matti's worth/achievement standard-defender shape — the grip operates as standard-defense and execution-vigilance; the probes ask what the standard is actually serving and where it's serving ego more than mission.",
    questions: [
      {
        id: "fq1_grip_object",
        purpose: "grip_object",
        question:
          "When you imagine letting a decision be good enough rather than fully right, which of these does the grip most want to protect?",
        responseMode: "rank_top_2",
        options: [
          {
            label: "Excellence",
            text: "Excellence — the quality of the work itself.",
            tags: ["worth-excellence"],
            interpretation: "Grip on craft-excellence.",
          },
          {
            label: "Momentum",
            text: "Momentum — not losing the pace you've built.",
            tags: ["worth-momentum"],
            interpretation: "Grip on tempo.",
          },
          {
            label: "Credibility",
            text: "Credibility — the standing earned by past calls being right.",
            tags: ["worth-credibility"],
            interpretation: "Grip on track-record.",
          },
          {
            label: "Financial safety",
            text: "Financial safety — the real downside of a wrong call.",
            tags: ["worth-financial"],
            interpretation: "Grip on capital floor.",
          },
          {
            label: "The standard",
            text: "The standard itself — keeping it from being eroded by good-enoughs.",
            tags: ["worth-standard-defense", "te"],
            interpretation: "Grip on standard-erosion-resistance.",
          },
          {
            label: "Others won't execute",
            text: "The fear that others won't execute the call well enough on their own.",
            tags: ["worth-execution-fear"],
            interpretation: "Grip on execution-distrust.",
          },
        ],
      },
      {
        id: "fq2_release_condition",
        purpose: "release_condition",
        question:
          "Of these, which most names why being right on this decision matters to you?",
        responseMode: "choose_one",
        options: [
          {
            label: "Truth matters",
            text: "Truth matters — getting the read right is its own value.",
            tags: ["release-truth-matters", "ti"],
            interpretation: "Release-block: truth-as-value.",
          },
          {
            label: "Goal matters",
            text: "The goal matters — getting there depends on the call being right.",
            tags: ["release-goal-matters"],
            interpretation: "Release-block: instrumental rightness.",
          },
          {
            label: "Real risk",
            text: "The risk is real — being wrong here costs something concrete.",
            tags: ["release-real-risk"],
            interpretation: "Release-block: external risk.",
          },
          {
            label: "Wrong feels expensive",
            text: "Being wrong feels personally expensive in a way I'd rather not pay.",
            tags: ["release-wrong-costly", "fi"],
            interpretation: "Release-block: personal cost of error.",
          },
          {
            label: "Others depend",
            text: "Others depend on this decision being the right one.",
            tags: ["release-others-depend"],
            interpretation: "Release-block: downstream stakes.",
          },
          {
            label: "Self-trust at stake",
            text: "I lose trust in myself when I miss something obvious.",
            tags: ["release-self-trust-cost"],
            interpretation: "Release-block: identity-as-accuracy.",
          },
        ],
      },
      {
        id: "fq3_aim_replacement",
        purpose: "aim_replacement",
        question:
          "If the grip on being right softened, where could the same focus be aimed instead?",
        responseMode: "choose_one",
        options: [
          {
            label: "Alignment, not achievement",
            text: "Define success by alignment with the mission, not by achievement against the standard.",
            tags: ["aim-alignment-over-achievement"],
            interpretation: "Aim = mission-fit over standard-defense.",
          },
          {
            label: "Good enough to move",
            text: "Let one decision be good enough to move forward, not perfect to defend.",
            tags: ["aim-good-enough-move"],
            interpretation: "Aim = motion over polish.",
          },
          {
            label: "Mission or ego?",
            text: "Ask whether the standard is serving the mission or my ego.",
            tags: ["aim-mission-or-ego", "ti"],
            interpretation: "Aim = standard-honest audit.",
          },
          {
            label: "Invite challenge first",
            text: "Invite challenge before defending the call.",
            tags: ["aim-invite-challenge"],
            interpretation: "Aim = pre-defense openness.",
          },
          {
            label: "Recovery block",
            text: "Protect one non-productive recovery block in the week.",
            tags: ["aim-recovery-block"],
            interpretation: "Aim = bounded rest as discipline.",
          },
          {
            label: "Let them own",
            text: "Let someone own a result without upgrading it after they finish.",
            tags: ["aim-let-others-own"],
            interpretation: "Aim = un-upgraded delegation.",
          },
        ],
      },
    ],
  },

  // CC-126b — Quelcdp (control_mastery, reputation/freedom variant).
  // **Keying caveat:** quelcdp's demographics name is "Prefer not to
  // say" so name-based resolver matching won't find this entry from
  // the demographics row alone. The API caller resolving quelcdp's
  // session MUST pass "quelcdp" (the fixture stem) as the sessionKey
  // explicitly; otherwise the resolver falls through to the CC-125
  // generator (which is fine — Quelcdp's shape still gets a valid
  // generator set, just not this hand-authored one).
  quelcdp: {
    personName: "Quelcdp",
    selectedFamilies: ["control_mastery"],
    reasonForQuestions:
      "Hand-authored set for Quelcdp's control/mastery shape with reputation and freedom at the center — the grip lives in protecting standing while staying un-owned; the probes ask which loss the grip most wants to prevent and what real freedom would actually look like.",
    questions: [
      {
        id: "fq1_grip_object",
        purpose: "grip_object",
        question:
          "When your reputation feels like it could shift, which of these does the grip most want to avoid?",
        responseMode: "rank_top_2",
        options: [
          {
            label: "Looking weak",
            text: "Looking weak in a way I can't recover from quickly.",
            tags: ["control-anti-weak-appearance"],
            interpretation: "Grip on strength-appearance.",
          },
          {
            label: "Losing respect",
            text: "Losing respect from someone whose respect I want.",
            tags: ["control-respect"],
            interpretation: "Grip on respect-floor.",
          },
          {
            label: "Losing freedom",
            text: "Losing freedom — being narrowed into someone else's frame.",
            tags: ["control-freedom"],
            interpretation: "Grip on degrees-of-motion.",
          },
          {
            label: "Being trapped",
            text: "Being trapped in a position I didn't sign up for.",
            tags: ["control-anti-trapped"],
            interpretation: "Grip on no-trap.",
          },
          {
            label: "Being misunderstood",
            text: "Being misunderstood in a way that changes what's possible for me.",
            tags: ["control-being-understood", "ti"],
            interpretation: "Grip on legibility.",
          },
          {
            label: "Controlled by judgment",
            text: "Being controlled by someone else's judgment of me.",
            tags: ["control-anti-controlled"],
            interpretation: "Grip on judgment-independence.",
          },
        ],
      },
      {
        id: "fq2_release_condition",
        purpose: "release_condition",
        question:
          "When you grip control hard, what does it most give you?",
        responseMode: "choose_one",
        options: [
          {
            label: "Freedom",
            text: "Freedom — the option not to be cornered.",
            tags: ["release-freedom"],
            interpretation: "Release-pull: freedom-purchase.",
          },
          {
            label: "Safety",
            text: "Safety — the floor underneath the next move.",
            tags: ["release-safety"],
            interpretation: "Release-pull: safety-purchase.",
          },
          {
            label: "Speed",
            text: "Speed — being able to move faster than other reads can catch up.",
            tags: ["release-speed"],
            interpretation: "Release-pull: tempo advantage.",
          },
          {
            label: "Respect",
            text: "Respect — staying in the register people defer to.",
            tags: ["release-respect"],
            interpretation: "Release-pull: respect-maintenance.",
          },
          {
            label: "A way out",
            text: "A way out — never being fully locked in.",
            tags: ["release-exit-option"],
            interpretation: "Release-pull: exit-retained.",
          },
          {
            label: "No one owns me",
            text: "Proof that no one owns me.",
            tags: ["release-not-owned"],
            interpretation: "Release-pull: un-owned status.",
          },
        ],
      },
      {
        id: "fq3_aim_replacement",
        purpose: "aim_replacement",
        question:
          "If the grip on reputation softened, what would real freedom — usable, not performed — actually look like?",
        responseMode: "choose_one",
        options: [
          {
            label: "One direct freedom move",
            text: "One direct action that increases real freedom next month, not the appearance of it.",
            tags: ["aim-direct-freedom"],
            interpretation: "Aim = freedom-by-action.",
          },
          {
            label: "Truth without performing",
            text: "Tell the truth about something without performing strength while saying it.",
            tags: ["aim-true-without-performing", "fi"],
            interpretation: "Aim = unperformed candor.",
          },
          {
            label: "Outcome over appearance",
            text: "Stop managing appearance and choose the outcome instead.",
            tags: ["aim-outcome-over-appearance"],
            interpretation: "Aim = substance-over-surface.",
          },
          {
            label: "Respect-independent move",
            text: "Ask what I'd do here if respect weren't at stake, then do that.",
            tags: ["aim-respect-independence"],
            interpretation: "Aim = respect-blind decision.",
          },
          {
            label: "Show uncertainty",
            text: "Let one person see the uncertainty under the confidence.",
            tags: ["aim-show-uncertainty"],
            interpretation: "Aim = bounded vulnerability.",
          },
          {
            label: "Freer next month",
            text: "Choose the move that makes me actually freer next month, not the one that looks freer now.",
            tags: ["aim-freer-future"],
            interpretation: "Aim = forward-freedom.",
          },
        ],
      },
    ],
  },

  // CC-126b — Keith (worth_achievement, leadership-as-proof variant).
  // The grip ties personal value to visible care and capable
  // leadership; probes ask which disappointment most tempts him into
  // over-functioning.
  keith: {
    personName: "Keith",
    selectedFamilies: ["worth_achievement"],
    reasonForQuestions:
      "Hand-authored set for Keith's worth/achievement leadership-as-proof shape — the grip lands on achievement proving value, capability, and care; the probes ask whose disappointment most pulls him into over-functioning, and what leadership without applause looks like.",
    questions: [
      {
        id: "fq1_grip_object",
        purpose: "grip_object",
        question:
          "When the next achievement is on the table, which of these is the grip most trying to prove?",
        responseMode: "rank_top_2",
        options: [
          {
            label: "I am valuable",
            text: "That I am valuable — that what I bring is worth the cost of having me here.",
            tags: ["worth-valuable"],
            interpretation: "Grip on value-proof.",
          },
          {
            label: "I am needed",
            text: "That I am needed — that the work would be different without me.",
            tags: ["worth-needed"],
            interpretation: "Grip on need-as-belonging.",
          },
          {
            label: "I am capable",
            text: "That I am capable — that the difficult thing is in good hands.",
            tags: ["worth-capable", "te"],
            interpretation: "Grip on capability-floor.",
          },
          {
            label: "I am respected",
            text: "That I am respected by the people whose respect I care about.",
            tags: ["worth-respected"],
            interpretation: "Grip on relational standing.",
          },
          {
            label: "Not failing people",
            text: "That I am not failing the people who are counting on me.",
            tags: ["worth-anti-failing"],
            interpretation: "Grip on letting-no-one-down.",
          },
          {
            label: "Care made visible",
            text: "That my care produced something visible — that it counted.",
            tags: ["worth-visible-care"],
            interpretation: "Grip on care-with-evidence.",
          },
        ],
      },
      {
        id: "fq2_release_condition",
        purpose: "release_condition",
        question:
          "Whose disappointment, if you imagine it landing, most pulls you into over-functioning?",
        responseMode: "choose_one",
        options: [
          {
            label: "Family",
            text: "Family — the people I've quietly promised never to let down.",
            tags: ["release-family-disappointment"],
            interpretation: "Release-pull: family-as-promise.",
          },
          {
            label: "Team",
            text: "The team — people working alongside me who'd register the gap.",
            tags: ["release-team-disappointment"],
            interpretation: "Release-pull: lateral standing.",
          },
          {
            label: "Authority",
            text: "Leaders or authority figures whose read of me carries weight.",
            tags: ["release-authority-disappointment"],
            interpretation: "Release-pull: upward standing.",
          },
          {
            label: "Emotional dependents",
            text: "People who depend on me emotionally — losing their confidence in me.",
            tags: ["release-emotional-dependents"],
            interpretation: "Release-pull: emotional steward.",
          },
          {
            label: "People I want to impress",
            text: "People I want to impress — even when I tell myself I don't.",
            tags: ["release-impress-pressure"],
            interpretation: "Release-pull: impression-pressure.",
          },
          {
            label: "Myself",
            text: "Myself — my own internal verdict about who I'm supposed to be.",
            tags: ["release-self-disappointment", "fi"],
            interpretation: "Release-pull: internal verdict.",
          },
        ],
      },
      {
        id: "fq3_aim_replacement",
        purpose: "aim_replacement",
        question:
          "If achievement softened as proof, what could the same care and capability be aimed at instead?",
        responseMode: "choose_one",
        options: [
          {
            label: "Quiet service",
            text: "Serve without it looking impressive from the outside.",
            tags: ["aim-quiet-service"],
            interpretation: "Aim = unwitnessed service.",
          },
          {
            label: "Let them bear",
            text: "Let someone carry the consequence of their own role without me catching it.",
            tags: ["aim-let-them-bear"],
            interpretation: "Aim = consequence-restored.",
          },
          {
            label: "Named limits",
            text: "Name what I can and can't give, and stop pretending the answer is always.",
            tags: ["aim-named-limits"],
            interpretation: "Aim = limits-as-honesty.",
          },
          {
            label: "Maturity, not applause",
            text: "Measure leadership by maturity, not by applause.",
            tags: ["aim-maturity-not-applause"],
            interpretation: "Aim = un-applauded leadership.",
          },
          {
            label: "No rescue this week",
            text: "Stop rescuing one person or system this week.",
            tags: ["aim-no-rescue"],
            interpretation: "Aim = bounded non-rescue.",
          },
          {
            label: "Helping or performing?",
            text: "Ask honestly whether I'm helping, proving, or performing.",
            tags: ["aim-helping-vs-performing"],
            interpretation: "Aim = motive-audit.",
          },
        ],
      },
    ],
  },

  // CC-126b — Connor (belonging/usefulness; Q2 = compression_check).
  // Low Lens confidence + high load + high stakes-amplifier delta —
  // the read may be showing compression rather than shape; Q2 probes
  // what changes first when stakes rise.
  connor: {
    personName: "Connor",
    selectedFamilies: ["belonging_usefulness"],
    reasonForQuestions:
      "Hand-authored set for Connor's belonging/usefulness shape under low Lens confidence + high load + high stakes-amplifier — the read may be showing compression rather than shape; the Q2 swap probes what changes first when stakes rise, and what being-needed most threatens.",
    questions: [
      {
        id: "fq1_grip_object",
        purpose: "grip_object",
        question:
          "When stakes rise, which of these changes first about how you operate?",
        responseMode: "choose_one",
        options: [
          {
            label: "Defensive logic",
            text: "I stop exploring — I need the cleanest defensible logic I can hold.",
            tags: ["control-defensive-logic", "ti"],
            interpretation: "Compression: explore→defend.",
          },
          {
            label: "Retreat to analysis",
            text: "I stop trusting the room and retreat into my own analysis.",
            tags: ["control-retreat-to-analysis"],
            interpretation: "Compression: relational→solo.",
          },
          {
            label: "Needed and trapped",
            text: "I become more needed — and then trapped by being needed.",
            tags: ["belonging-trap-of-need"],
            interpretation: "Compression: usefulness-as-trap.",
          },
          {
            label: "Useful but less free",
            text: "I get more useful but less free in the same motion.",
            tags: ["belonging-usefulness-loses-freedom"],
            interpretation: "Compression: utility-vs-freedom tension.",
          },
          {
            label: "Manage being wrong",
            text: "I start managing the risk of being wrong before doing the work itself.",
            tags: ["control-anti-wrong"],
            interpretation: "Compression: pre-defense.",
          },
          {
            label: "Pressure reveals",
            text: "I don't change much — the pressure mostly reveals what was already there.",
            tags: ["belonging-pressure-reveals"],
            interpretation: "Compression: low-shift (the shape holds).",
          },
        ],
      },
      {
        id: "fq2_compression_check",
        purpose: "compression_check",
        question:
          "When being needed lands hard on you, which of these does it most threaten?",
        responseMode: "rank_top_2",
        options: [
          {
            label: "My freedom",
            text: "My freedom — my sense that I can still choose my own next move.",
            tags: ["compression-freedom-threat"],
            interpretation: "Need-threat: degrees-of-motion.",
          },
          {
            label: "My usefulness",
            text: "My usefulness — what if I can't actually deliver?",
            tags: ["compression-usefulness-threat"],
            interpretation: "Need-threat: delivery-doubt.",
          },
          {
            label: "My identity",
            text: "My identity — who I am when I'm not the person being asked.",
            tags: ["compression-identity-threat"],
            interpretation: "Need-threat: identity-as-function.",
          },
          {
            label: "My competence",
            text: "My competence — that I might be exposed as not enough.",
            tags: ["compression-competence-threat"],
            interpretation: "Need-threat: exposure-of-limit.",
          },
          {
            label: "Right to disappoint",
            text: "My right to disappoint people when I need to.",
            tags: ["compression-disappoint-right"],
            interpretation: "Need-threat: refusal-permission.",
          },
          {
            label: "Ability to explore",
            text: "My ability to keep exploring instead of locking into the next obligation.",
            tags: ["compression-exploration-loss", "ne"],
            interpretation: "Need-threat: Ne-exploration loss.",
          },
          {
            label: "Choosing my path",
            text: "My sense that I can still choose my own path, not the one assigned by need.",
            tags: ["compression-path-choice"],
            interpretation: "Need-threat: chosenness.",
          },
        ],
      },
      {
        id: "fq3_aim_replacement",
        purpose: "aim_replacement",
        question:
          "When the burden of being-needed lifts, which of these returns to you first?",
        responseMode: "choose_one",
        options: [
          {
            label: "Curiosity",
            text: "Curiosity — interest in things that aren't load-bearing.",
            tags: ["aim-curiosity-returns", "ne"],
            interpretation: "Restoration: Ne returns.",
          },
          {
            label: "Humor",
            text: "Humor — being funny again without effort.",
            tags: ["aim-humor-returns"],
            interpretation: "Restoration: humor returns.",
          },
          {
            label: "Experimentation",
            text: "Experimentation — wanting to try something just to see what happens.",
            tags: ["aim-experimentation-returns"],
            interpretation: "Restoration: try-it returns.",
          },
          {
            label: "Debating possibilities",
            text: "Debating possibilities — arguing through what's not yet decided.",
            tags: ["aim-debate-returns"],
            interpretation: "Restoration: dialectic returns.",
          },
          {
            label: "Quiet analysis",
            text: "Quiet analysis — thinking that's mine, not for anyone.",
            tags: ["aim-analysis-returns", "ti"],
            interpretation: "Restoration: Ti returns.",
          },
          {
            label: "Disappear awhile",
            text: "Desire to disappear awhile — not be findable.",
            tags: ["aim-disappear-returns"],
            interpretation: "Restoration: untracked time.",
          },
          {
            label: "Build something new",
            text: "Energy to build something new for its own sake.",
            tags: ["aim-build-energy"],
            interpretation: "Restoration: generative energy.",
          },
          {
            label: "Playful irreverence",
            text: "Playful irreverence — taking the system less seriously.",
            tags: ["aim-irreverence"],
            interpretation: "Restoration: lightness returns.",
          },
        ],
      },
    ],
  },

  // CC-126b — Brian (worth_achievement; Q2 = trait_vs_weather). High
  // baseline grip with low stakes-amplifier delta — the grip operates
  // as long-running shape; Q2 probes whether it's trait or normalized
  // weather.
  brian: {
    personName: "Brian",
    selectedFamilies: ["worth_achievement"],
    reasonForQuestions:
      "Hand-authored set for Brian's worth/achievement shape with a high baseline grip and little stakes reactivity — the achievement-as-measure pattern runs as the steady shape, not the response to a moment; the Q2 swap probes when this drive became the normal gear.",
    questions: [
      {
        id: "fq1_grip_object",
        purpose: "grip_object",
        question:
          "When achievement is the measure you're using on yourself, which of these is that measure most protecting?",
        responseMode: "rank_top_2",
        options: [
          {
            label: "Respect",
            text: "Respect — the standing you earn by what you've built.",
            tags: ["worth-respect"],
            interpretation: "Grip on standing-by-output.",
          },
          {
            label: "Safety",
            text: "Safety — a floor that achievement keeps under you.",
            tags: ["worth-safety"],
            interpretation: "Grip on safety-via-output.",
          },
          {
            label: "Control",
            text: "Control — staying the one who decides what gets built next.",
            tags: ["worth-control-measure"],
            interpretation: "Grip on agency-via-output.",
          },
          {
            label: "Legacy",
            text: "Legacy — what this leaves behind when the run is over.",
            tags: ["worth-legacy"],
            interpretation: "Grip on what-remains.",
          },
          {
            label: "Financial independence",
            text: "Financial independence — the freedom to choose later.",
            tags: ["worth-financial-independence"],
            interpretation: "Grip on capital-as-freedom.",
          },
          {
            label: "Sacrifices were worth it",
            text: "Proof that the sacrifices it cost to get here were worth it.",
            tags: ["worth-proof-of-sacrifice"],
            interpretation: "Grip on cost-justification.",
          },
          {
            label: "Not depending on others",
            text: "Freedom from having to depend on others to be okay.",
            tags: ["worth-anti-dependence"],
            interpretation: "Grip on self-sufficiency.",
          },
        ],
      },
      {
        id: "fq2_trait_vs_weather",
        purpose: "trait_vs_weather",
        question:
          "Looking at the way you measure yourself by output — when did this become the normal gear, the shape rather than the season?",
        responseMode: "choose_one",
        options: [
          {
            label: "Early family",
            text: "Early in family life — the expectations were set before I could name them.",
            tags: ["trait-family-origin"],
            interpretation: "Trait read: family-of-origin.",
          },
          {
            label: "Career competition",
            text: "When the work got competitive — the pace got internalized.",
            tags: ["weather-career-competition"],
            interpretation: "Weather read: career onset.",
          },
          {
            label: "Financial pressure",
            text: "Under financial pressure — when the stakes got concrete.",
            tags: ["weather-financial-pressure"],
            interpretation: "Weather read: money onset.",
          },
          {
            label: "After a loss",
            text: "After a major failure or loss — when the floor I assumed wasn't there.",
            tags: ["weather-failure-onset"],
            interpretation: "Weather read: rupture onset.",
          },
          {
            label: "Responsible for others",
            text: "When I became responsible for other people's day-to-day.",
            tags: ["weather-responsibility-onset"],
            interpretation: "Weather read: stewardship onset.",
          },
          {
            label: "Natural gear",
            text: "It's always felt like my natural gear — even when nothing was at stake.",
            tags: ["trait-natural-gear"],
            interpretation: "Trait read: native-shape.",
          },
          {
            label: "Don't know, slowing feels unsafe",
            text: "I don't know when it happened — I just know slowing down feels unsafe.",
            tags: ["trait-unknown-onset"],
            interpretation: "Trait-by-default: slowing-unsafe.",
          },
        ],
      },
      {
        id: "fq3_aim_replacement",
        purpose: "aim_replacement",
        question:
          "If achievement softened as the measure, where could the same drive be aimed instead?",
        responseMode: "choose_one",
        options: [
          {
            label: "Private goal",
            text: "Pursue one real goal that no one important will know about.",
            tags: ["aim-private-goal"],
            interpretation: "Aim = unwitnessed pursuit.",
          },
          {
            label: "Freedom, not proof",
            text: "Define success by freedom won, not proof rendered.",
            tags: ["aim-freedom-not-proof"],
            interpretation: "Aim = freedom-as-yardstick.",
          },
          {
            label: "Let a win rest",
            text: "Let a win be enough without immediately raising the bar.",
            tags: ["aim-let-win-rest"],
            interpretation: "Aim = arrived-and-stop.",
          },
          {
            label: "Nothing to prove",
            text: "Ask what I'd build with nothing to prove, and try a small version.",
            tags: ["aim-nothing-to-prove"],
            interpretation: "Aim = motive-free building.",
          },
          {
            label: "Delegate ungraded",
            text: "Delegate something meaningful without grading it after.",
            tags: ["aim-delegate-ungraded"],
            interpretation: "Aim = un-audited handoff.",
          },
          {
            label: "Relationship not arena",
            text: "Protect one relationship from becoming another performance arena.",
            tags: ["aim-relationship-not-arena"],
            interpretation: "Aim = bond-out-of-the-arena.",
          },
        ],
      },
    ],
  },

  // CC-126b — Jake (control_mastery, system-builder variant). The
  // grip turns uncertainty into a framework before action; probes
  // what becomes adjustable when the belief becomes expensive.
  jake: {
    personName: "Jake",
    selectedFamilies: ["control_mastery"],
    reasonForQuestions:
      "Hand-authored set for Jake's control/mastery system-builder shape — the grip operates as framework-construction-before-action; the probes ask which uncertainty the framework most makes safe, what shifts when a belief becomes expensive, and what action could replace the system.",
    questions: [
      {
        id: "fq1_grip_object",
        purpose: "grip_object",
        question:
          "When you turn an uncertain situation into a framework, what does the framework most make safe?",
        responseMode: "rank_top_2",
        options: [
          {
            label: "The decision",
            text: "The decision itself — locking the choice so it doesn't re-open.",
            tags: ["control-decision-locked"],
            interpretation: "Grip on decision-stability.",
          },
          {
            label: "My credibility",
            text: "My credibility — being able to defend the call later.",
            tags: ["control-credibility"],
            interpretation: "Grip on after-the-fact defensibility.",
          },
          {
            label: "The relationship",
            text: "The relationship — keeping it from becoming a fight by structuring the conversation.",
            tags: ["control-relationship-systematized"],
            interpretation: "Grip on relational scaffolding.",
          },
          {
            label: "The future",
            text: "The future — having a model that predicts how this lands.",
            tags: ["control-future-modeled", "ni"],
            interpretation: "Grip on predictive scaffold.",
          },
          {
            label: "Self-trust",
            text: "My own trust in the answer — that I'm not just guessing.",
            tags: ["control-self-trust"],
            interpretation: "Grip on internal evidence.",
          },
          {
            label: "Not misread",
            text: "Not being misread — having the framework so the read can't be skewed.",
            tags: ["control-anti-misread"],
            interpretation: "Grip on legibility.",
          },
          {
            label: "Not accepting bad premise",
            text: "The room not accepting a bad premise that would derail the whole conversation.",
            tags: ["control-anti-bad-premise", "ti"],
            interpretation: "Grip on premise-quality.",
          },
        ],
      },
      {
        id: "fq2_release_condition",
        purpose: "release_condition",
        question:
          "If a belief you hold became expensive — costly to maintain — which of these would shift first?",
        responseMode: "choose_one",
        options: [
          {
            label: "Belief itself",
            text: "The belief itself — I'd actually update it.",
            tags: ["release-belief-itself"],
            interpretation: "Release: openness to revision.",
          },
          {
            label: "Express directness",
            text: "How directly I express it — same belief, less front-facing.",
            tags: ["release-expression-directness"],
            interpretation: "Release: register-shift, not content-shift.",
          },
          {
            label: "Audience narrows",
            text: "Who gets to hear it — same belief, smaller audience.",
            tags: ["release-audience-narrowing"],
            interpretation: "Release: audience-narrowing.",
          },
          {
            label: "Evidence bar",
            text: "How much evidence I require before acting on it.",
            tags: ["release-evidence-bar"],
            interpretation: "Release: epistemic-threshold shift.",
          },
          {
            label: "Pre-explanation",
            text: "How much I explain before moving — same conclusion, less pre-talk.",
            tags: ["release-pre-explanation"],
            interpretation: "Release: less-explained action.",
          },
          {
            label: "Misread tolerance",
            text: "How willing I am to be misunderstood while holding it.",
            tags: ["release-misread-tolerance"],
            interpretation: "Release: misread-tolerance.",
          },
        ],
      },
      {
        id: "fq3_aim_replacement",
        purpose: "aim_replacement",
        question:
          "If the grip on the framework softened, what action could the same instrument be aimed at instead?",
        responseMode: "choose_one",
        options: [
          {
            label: "Share reasoning forming",
            text: "Share the reasoning while it's still forming, before it's been armored.",
            tags: ["aim-share-forming"],
            interpretation: "Aim = pre-armored reasoning.",
          },
          {
            label: "Framework test",
            text: "Ask someone where the framework breaks before defending it.",
            tags: ["aim-framework-test"],
            interpretation: "Aim = openly-falsifiable framing.",
          },
          {
            label: "Simple first",
            text: "State the simple version before the careful version.",
            tags: ["aim-simple-first"],
            interpretation: "Aim = direct over architected.",
          },
          {
            label: "Room in shaping",
            text: "Let the room participate in shaping before the conclusion is a verdict.",
            tags: ["aim-room-in-shaping"],
            interpretation: "Aim = participatory build.",
          },
          {
            label: "Relational risk first",
            text: "Take one relational risk before the logic is fully armored.",
            tags: ["aim-relational-risk-first"],
            interpretation: "Aim = relational-leading-with.",
          },
          {
            label: "Good-enough read",
            text: "Trust one good-enough read without converting it into a complete system.",
            tags: ["aim-good-enough-read"],
            interpretation: "Aim = unfinished-trust.",
          },
        ],
      },
    ],
  },
};

/**
 * Look up the hand-authored set for a given session. Returns undefined
 * when no override is present (caller falls through to the generator).
 *
 * Accepts a raw name string — usually the demographics' `name_value`.
 * Normalizes via lowercase + trim. Returns undefined on empty / null /
 * unrecognized keys.
 */
export function cohortFollowUpForName(
  name: string | null | undefined
): FollowUpQuestionSet | undefined {
  if (!name) return undefined;
  const key = name.trim().toLowerCase();
  if (key.length === 0) return undefined;
  return COHORT_FOLLOW_UPS[key];
}
