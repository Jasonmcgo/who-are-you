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
