// CC-019 — Demographic field definitions for the Identity & Context page.
// Nine fields, all optional, all carrying a "Prefer not to say" canonical
// opt-out. Per docs/canon/demographic-rules.md:
//   - Opt-out is data: prefer_not_to_say is distinct from not_answered.
//   - No inference: the model never derives demographic fields from other
//     answers (no name → gender, no language → location, etc.).
//   - Demographics are side-data: do NOT feed InnerConstitution derivation.
//
// FieldState is declared here as a string-literal union to keep the data
// module client-safe (no transitive db/schema import would pull the postgres
// driver onto the client bundle). The schema enum in db/schema.ts mirrors
// these three values verbatim.

export type FieldState = "specified" | "prefer_not_to_say" | "not_answered";

export type DemographicOption = {
  id: string;
  label: string;
  allows_text?: boolean; // true for "Other (please specify)"
};

export type DemographicField = {
  field_id: string; // matches the schema column root, e.g. "gender"
  question: string;
  helper?: string;
  type: "single_select" | "single_select_with_other" | "freeform";
  options?: DemographicOption[];
  prefer_not_to_say_label: string;
};

export const DEMOGRAPHIC_FIELDS: DemographicField[] = [
  {
    field_id: "name",
    question: "What's your first name?",
    helper:
      "For your own reference — the model doesn't use this in any reading.",
    type: "freeform",
    prefer_not_to_say_label: "Prefer not to say",
  },
  {
    field_id: "gender",
    question: "How would you describe your gender?",
    type: "single_select_with_other",
    options: [
      { id: "man", label: "Man" },
      { id: "woman", label: "Woman" },
      { id: "non_binary", label: "Non-binary" },
      { id: "other", label: "Other", allows_text: true },
    ],
    prefer_not_to_say_label: "Prefer not to say",
  },
  {
    field_id: "age",
    question: "Which decade were you born in?",
    helper:
      "Decade rather than exact year — the model uses cohort context, not precision.",
    type: "single_select",
    options: [
      { id: "1940s", label: "1940s" },
      { id: "1950s", label: "1950s" },
      { id: "1960s", label: "1960s" },
      { id: "1970s", label: "1970s" },
      { id: "1980s", label: "1980s" },
      { id: "1990s", label: "1990s" },
      { id: "2000s", label: "2000s" },
      { id: "2010s", label: "2010s" },
    ],
    prefer_not_to_say_label: "Prefer not to say",
  },
  {
    field_id: "location",
    question: "Where do you live now?",
    helper:
      "Country and (optionally) region — for the cultural-context layer the model will use later.",
    type: "freeform",
    prefer_not_to_say_label: "Prefer not to say",
  },
  {
    field_id: "marital_status",
    question: "What's your relational situation?",
    type: "single_select",
    options: [
      { id: "married", label: "Married" },
      { id: "partnered", label: "Partnered (long-term)" },
      { id: "single", label: "Single" },
      { id: "divorced", label: "Divorced or separated" },
      { id: "widowed", label: "Widowed" },
      { id: "other", label: "Other" },
    ],
    prefer_not_to_say_label: "Prefer not to say",
  },
  {
    field_id: "education",
    question: "What's your highest level of completed education?",
    type: "single_select",
    options: [
      { id: "high_school", label: "High school or equivalent" },
      { id: "some_college", label: "Some college" },
      { id: "bachelors", label: "Bachelor's degree" },
      { id: "masters", label: "Master's degree" },
      { id: "doctorate", label: "Doctorate or professional degree" },
      { id: "trade", label: "Trade or vocational training" },
      { id: "other", label: "Other" },
    ],
    prefer_not_to_say_label: "Prefer not to say",
  },
  {
    field_id: "political",
    question: "How would you describe your political orientation?",
    helper:
      "Broad orientation rather than party — the model is non-US-centric and reads ideological posture, not partisanship.",
    type: "single_select",
    options: [
      { id: "left", label: "Left" },
      { id: "center_left", label: "Center-left" },
      { id: "center", label: "Center" },
      { id: "center_right", label: "Center-right" },
      { id: "right", label: "Right" },
      { id: "apolitical", label: "Apolitical / unengaged" },
      { id: "other", label: "Other" },
    ],
    prefer_not_to_say_label: "Prefer not to say",
  },
  {
    field_id: "religious",
    question: "What's your religious or spiritual orientation?",
    type: "single_select_with_other",
    options: [
      { id: "christianity", label: "Christianity" },
      { id: "judaism", label: "Judaism" },
      { id: "islam", label: "Islam" },
      { id: "hinduism", label: "Hinduism" },
      { id: "buddhism", label: "Buddhism" },
      { id: "spiritual", label: "Spiritual but not religious" },
      { id: "none", label: "None / non-religious" },
      { id: "other", label: "Other", allows_text: true },
    ],
    prefer_not_to_say_label: "Prefer not to say",
  },
  {
    field_id: "profession",
    question: "Which best describes your work?",
    type: "single_select_with_other",
    options: [
      { id: "knowledge", label: "Knowledge worker" },
      { id: "skilled_trades", label: "Skilled trades" },
      { id: "service", label: "Service worker" },
      { id: "public_safety", label: "Public safety" },
      { id: "medical", label: "Medical" },
      { id: "education", label: "Education" },
      { id: "laborer", label: "Laborer" },
      { id: "creative", label: "Creative / Arts" },
      { id: "entrepreneur", label: "Self-employed / Entrepreneur" },
      { id: "retired", label: "Retired / not currently working" },
      { id: "military", label: "Military" },
      { id: "religious_work", label: "Religious / Ministry" },
      { id: "other", label: "Other", allows_text: true },
    ],
    prefer_not_to_say_label: "Prefer not to say",
  },
];
