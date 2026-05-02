import type { Question } from "../lib/types";

export const questions: Question[] = [
  {
    question_id: "Q-C1",
    card_id: "conviction",
    type: "forced",
    text: "Would you rather be misunderstood but correct, or liked but slightly dishonest?",
    options: [
      { label: "Misunderstood but correct", signal: "truth_priority_high" },
      { label: "Liked but slightly dishonest", signal: "belonging_priority_high" },
    ],
  },
  {
    question_id: "Q-C3",
    card_id: "conviction",
    type: "forced",
    text: "Which feels more important to preserve?",
    options: [
      { label: "Freedom to act", signal: "freedom_priority" },
      { label: "Stability and order", signal: "order_priority" },
    ],
  },
  {
    question_id: "Q-C4",
    card_id: "conviction",
    type: "ranking",
    text: "When something goes wrong, rank where the responsibility most often sits.",
    items: [
      { id: "individual",   label: "Individual",   gloss: "the person who acted, and what they brought to the moment.",       signal: "individual_responsibility_priority"   },
      { id: "system",       label: "System",       gloss: "the structures and incentives shaping what was possible.",          signal: "system_responsibility_priority"       },
      { id: "nature",       label: "Nature",       gloss: "chance, biology, the way things just are.",                         signal: "nature_responsibility_priority"       },
      { id: "supernatural", label: "Supernatural", gloss: "divine will, fate, or what's beyond human reach.",                  signal: "supernatural_responsibility_priority" },
      { id: "authority",    label: "Authority",    gloss: "the people in charge of the system, not the system itself.",        signal: "authority_responsibility_priority"    },
    ],
  },
  {
    question_id: "Q-P1",
    card_id: "pressure",
    type: "forced",
    text: "If expressing a belief would cost you close relationships, you would:",
    options: [
      { label: "Stay silent", signal: "adapts_under_social_pressure" },
      { label: "Soften it", signal: "adapts_under_social_pressure" },
      { label: "Express it carefully", signal: "moderate_social_expression" },
      { label: "Say it directly", signal: "high_conviction_expression" },
    ],
  },
  {
    question_id: "Q-P2",
    card_id: "pressure",
    type: "forced",
    text: "If a belief put your job at risk, you would:",
    // CC-027 — middle-two labels sharpened to surface the active-vs-passive
    // split that the engine already encodes via distinct signals. Pre-fix,
    // "Keep it private" and "Hold it quietly" collapsed in users' heads to
    // the same option (both read as "I have it, but don't talk about it").
    // Post-fix: "Hide it from work" names the active concealment behavior;
    // "Don't volunteer it" names the passive non-advocacy posture. Signal
    // IDs unchanged.
    options: [
      { label: "Change your position", signal: "adapts_under_economic_pressure" },
      { label: "Hide it from work",    signal: "hides_belief" },
      { label: "Don't volunteer it",   signal: "holds_internal_conviction" },
      { label: "Accept the risk",      signal: "high_conviction_under_risk" },
    ],
  },
  {
    question_id: "Q-F1",
    card_id: "formation",
    type: "forced",
    text: "As a child, authority figures were mostly:",
    options: [
      { label: "Trustworthy and protective", signal: "authority_trust_high" },
      { label: "Necessary but flawed", signal: "authority_skepticism_moderate" },
      { label: "Arbitrary or unfair", signal: "authority_distrust" },
    ],
  },
  {
    question_id: "Q-F2",
    card_id: "formation",
    type: "forced",
    text: "Your childhood environment felt:",
    options: [
      { label: "Stable and predictable", signal: "stability_baseline_high" },
      { label: "Mixed", signal: "moderate_stability" },
      { label: "Uncertain or chaotic", signal: "chaos_exposure" },
    ],
  },
  {
    question_id: "Q-X1",
    card_id: "context",
    type: "forced",
    text: "Your current life feels:",
    options: [
      { label: "Stable and manageable", signal: "stability_present" },
      { label: "Busy but controlled", signal: "moderate_load" },
      { label: "Overwhelming or stretched", signal: "high_pressure_context" },
    ],
  },
  {
    question_id: "Q-X2",
    card_id: "context",
    type: "forced",
    text: "Right now, people depend on you:",
    options: [
      { label: "Very little", signal: "low_responsibility" },
      { label: "Some", signal: "moderate_responsibility" },
      { label: "A lot", signal: "high_responsibility" },
    ],
  },
  // CC-031 — Q-X3 multi-stage. The single 5-item Q-X3 is retired; the
  // institutional-trust read now resolves through two parent rankings + one
  // cross-rank. Per the v2.5 memo (and CC-030's canonized item-count rule),
  // this addresses four gaps in the legacy form: Press doing two jobs
  // (journalism vs. news organizations), Government doing two jobs (elected
  // vs. services), Companies doing two jobs (small vs. large), Social Media
  // missing entirely. Each parent sits at the principle's 5-item ceiling
  // deliberately because the four splits (Government, Press, Companies,
  // NP&Religious) are the architectural reason for the CC; collapsing any
  // of them loses the signal CC-031 is specifically designed to preserve.
  {
    question_id: "Q-X3-public",
    card_id: "context",
    type: "ranking",
    text: "How much do you trust each of these public-mission institutions to tell the truth and act in good faith? Rank in order.",
    helper: "Five public and civic institutions. Most trusted at the top, least trusted at the bottom.",
    items: [
      { id: "government_elected",  label: "Government — Elected",  gloss: "elected representatives, legislatures, and the political apparatus.",                                                signal: "government_elected_trust_priority"  },
      { id: "government_services", label: "Government — Services", gloss: "the on-the-ground services of government — public schools, DMV, water, sanitation, local police.",                  signal: "government_services_trust_priority" },
      { id: "education",           label: "Education",             gloss: "schools, colleges, and the credentialing they grant.",                                                              signal: "education_trust_priority"           },
      { id: "nonprofits",          label: "Non-Profits",           gloss: "charities, NGOs, and voluntary missions outside religious frame.",                                                  signal: "nonprofits_trust_priority"          },
      { id: "religious",           label: "Religious",             gloss: "churches, faith communities, and explicitly religious missions.",                                                   signal: "religious_trust_priority"           },
    ],
  },
  {
    question_id: "Q-X3-information-and-commercial",
    card_id: "context",
    type: "ranking",
    text: "How much do you trust each of these information and commercial institutions to tell the truth and act in good faith? Rank in order.",
    helper: "Five information-distribution and commercial institutions. Most trusted at the top, least trusted at the bottom.",
    items: [
      { id: "journalism",          label: "Journalism",               gloss: "individual journalists and the discipline of journalistic craft.",                                                                       signal: "journalism_trust_priority"          },
      { id: "news_organizations",  label: "News organizations",       gloss: "newsrooms, outlets, and the institutions that distribute and shape journalism.",                                                          signal: "news_organizations_trust_priority"  },
      { id: "social_media",        label: "Social Media",             gloss: "platforms that mediate information through algorithm and influence — Twitter/X, TikTok, YouTube, Instagram, Facebook, Substack, Reddit.", signal: "social_media_trust_priority"        },
      { id: "small_business",      label: "Small / Private Business", gloss: "small, private, closely-held businesses — the local shop, the family firm, the contractor you've used for years.",                       signal: "small_business_trust_priority"      },
      { id: "large_companies",     label: "Large / Public Companies", gloss: "large, public, publicly-traded companies — the multinationals, the platforms, the brands at scale.",                                     signal: "large_companies_trust_priority"     },
    ],
  },
  {
    question_id: "Q-X3-cross",
    card_id: "context",
    type: "ranking_derived",
    derived_from: ["Q-X3-public", "Q-X3-information-and-commercial"],
    text: "When public-mission and information-and-commercial institutions compete for your trust, where does it actually go?",
    helper: "Your top picks from the previous two rankings. Rank in resolved priority — what wins when they're forced to compete.",
  },
  // CC-032 — Q-X4 multi-stage. The single 5-item Q-X4 is retired; the
  // personal-trust read now resolves through two parent rankings + one
  // cross-rank. Adds the missing Outside-expert category (therapist /
  // doctor / lawyer / coach / clergy). Per the v2.5 memo, the relational /
  // chosen split captures the architectural truth that entanglement-based
  // trust and selection-based trust cluster differently in real users:
  // relational trust is a function of who knew you before this version of
  // you and is entangled with the rest of your life; chosen trust is a
  // function of whose judgment you've selected for, often through paying
  // for it or seeking it out.
  {
    question_id: "Q-X4-relational",
    card_id: "context",
    type: "ranking",
    text: "When you need to hear the truth and not just kindness, whom of these — the people entangled in your life — do you trust most? Rank in order.",
    helper: "Three relational trust sources. Most trusted at the top, least trusted at the bottom.",
    items: [
      { id: "partner", label: "A spouse or partner", gloss: "someone whose life is fully entangled with yours.",                          signal: "partner_trust_priority" },
      { id: "family",  label: "Family",              gloss: "parents, siblings, or chosen kin who knew you before this version of you.", signal: "family_trust_priority"  },
      { id: "friend",  label: "A close friend",      gloss: "someone who has earned your trust outside obligation.",                      signal: "friend_trust_priority"  },
    ],
  },
  {
    question_id: "Q-X4-chosen",
    card_id: "context",
    type: "ranking",
    text: "And when you need truth from someone you've selected for their judgment — not someone bound to you by relationship — whom do you trust most? Rank in order.",
    helper: "Three chosen trust sources. Most trusted at the top, least trusted at the bottom.",
    items: [
      { id: "mentor",         label: "A mentor or advisor", gloss: "someone whose judgment you've sought across years.",                                                  signal: "mentor_trust_priority"         },
      { id: "outside_expert", label: "An outside expert",   gloss: "a therapist, doctor, lawyer, coach, financial advisor, or clergy member — the trusted professional.", signal: "outside_expert_trust_priority" },
      { id: "own_counsel",    label: "Your own counsel",    gloss: "your own judgment, when no other source feels right.",                                                signal: "own_counsel_trust_priority"    },
    ],
  },
  {
    question_id: "Q-X4-cross",
    card_id: "context",
    type: "ranking_derived",
    derived_from: ["Q-X4-relational", "Q-X4-chosen"],
    text: "When relational trust and chosen trust compete for the same hard-truth question, who actually wins?",
    helper: "Your top picks from the previous two rankings. Rank in resolved priority.",
  },
  {
    question_id: "Q-A1",
    card_id: "agency",
    type: "forced",
    text: "How do you spend most of your time?",
    options: [
      { label: "Building or creating", signal: "proactive_creator" },
      { label: "Maintaining responsibilities", signal: "responsibility_maintainer" },
      { label: "Reacting to demands", signal: "reactive_operator" },
    ],
  },
  {
    question_id: "Q-A2",
    card_id: "agency",
    type: "forced",
    text: "If your obligations were lighter, where would your energy naturally go?",
    options: [
      { label: "Building or creating something new", signal: "proactive_creator" },
      { label: "Deepening relationships and care", signal: "relational_investment" },
      { label: "Restoring order and stability", signal: "stability_restoration" },
      { label: "Exploring, learning, or wandering", signal: "exploration_drive" },
    ],
  },
  {
    // CC-028 — expanded from 4 items to 6 (added Peace, Honor) to resolve
    // the top-3-universal compression real-user testing surfaced across
    // four sessions. Q-S1's register is embodied / qualities-of-self
    // (things you protect because they are how you stand); Peace + Honor
    // both compose with that register.
    question_id: "Q-S1",
    card_id: "sacred",
    type: "ranking",
    text: "Order these by what you'd protect first when something has to give.",
    helper: "Six of your own. Rank by which holds first when two of them pull apart.",
    items: [
      { id: "freedom",   label: "Freedom",   gloss: "the ability to act without needing permission.",                         signal: "freedom_priority"   },
      { id: "truth",     label: "Truth",     gloss: "what's actually so, even when it costs.",                                 signal: "truth_priority"     },
      { id: "stability", label: "Stability", gloss: "steady ground, for you and the people who rely on you.",                  signal: "stability_priority" },
      { id: "loyalty",   label: "Loyalty",   gloss: "staying with your people through what comes.",                            signal: "loyalty_priority"   },
      { id: "peace",     label: "Peace",     gloss: "interior groundedness — the calm that holds even when conditions don't.", signal: "peace_priority"     },
      { id: "honor",     label: "Honor",     gloss: "keeping faith with your word, even when no one would notice the breach.", signal: "honor_priority"     },
    ],
  },
  {
    // CC-028 — expanded from 4 items to 6 (added Compassion, Mercy).
    // Q-S2's register is external pulls / orientations toward others
    // (things that claim you because of what they are or who they are);
    // both new items compose with that register — the suffering of
    // others claims compassion; the imperfection of others claims mercy.
    question_id: "Q-S2",
    card_id: "sacred",
    type: "ranking",
    text: "Order these by which has the strongest claim on you.",
    items: [
      { id: "family",     label: "Family",     gloss: "the people who are yours, and to whom you are theirs.",      signal: "family_priority"     },
      { id: "knowledge",  label: "Knowledge",  gloss: "what's actually known, and the discipline of seeking more.", signal: "knowledge_priority"  },
      { id: "justice",    label: "Justice",    gloss: "fair weight, even when it costs you to give it.",            signal: "justice_priority"    },
      { id: "faith",      label: "Faith",      gloss: "trust in what's larger than you, however you frame it.",     signal: "faith_priority"      },
      { id: "compassion", label: "Compassion", gloss: "being moved by what hurts in others, and not turning away.", signal: "compassion_priority" },
      { id: "mercy",      label: "Mercy",      gloss: "softening the verdict, even when the verdict was fair.",     signal: "mercy_priority"      },
    ],
  },
  {
    question_id: "Q-T1",
    card_id: "temperament",
    type: "ranking",
    text: "When you're working on a hard problem",
    items: [
      { id: "ni", label: "Voice A", voice: "Voice A", quote: `"Once I see how the pieces are going to land, the rest is mostly execution. I'm looking for the pattern that would explain everything else."`, example: "Halfway through reading a long thread, I already have a sense of where the argument is heading and what its real point will turn out to be.", signal: "ni" },
      { id: "ne", label: "Voice B", voice: "Voice B", quote: `"There are at least four interesting angles here. I want to spend time on each before deciding which one fits."`, example: "I leave a brainstorm with three new directions I want to chase before lunch is over.", signal: "ne" },
      { id: "si", label: "Voice C", voice: "Voice C", quote: `"What's worked in similar situations before? There's usually precedent worth checking before reinventing."`, example: "Before I start, I look up what we did the last time something like this came up and use that as the baseline.", signal: "si" },
      { id: "se", label: "Voice D", voice: "Voice D", quote: `"Let me start moving and see what surfaces. I'll know what I'm dealing with once I'm actually working on it."`, example: "I'd rather pick it up and start working than spend another hour planning what working on it will look like.", signal: "se" },
    ],
  },
  {
    question_id: "Q-T2",
    card_id: "temperament",
    type: "ranking",
    text: "When you walk into a new environment",
    items: [
      { id: "ne", label: "Voice A", voice: "Voice A", quote: `"This is interesting — there are so many new possibilities here. I want to explore widely before forming any conclusions."`, example: "I want to wander into every room, ask everyone what they're working on, and circle back to my impressions later.", signal: "ne" },
      { id: "si", label: "Voice B", voice: "Voice B", quote: `"I'm comparing this to similar environments I've been in. The differences are telling me what I need to pay attention to."`, example: "I keep noting the small ways this place is different from the last one I worked in — the differences tell me what to pay attention to.", signal: "si" },
      { id: "se", label: "Voice C", voice: "Voice C", quote: `"I'm taking in what's actually present — the room, the people, the energy. I'll respond to what I find."`, example: "I scan the room, register what's actually in front of me, and let what I find guide how I move through the day.", signal: "se" },
      { id: "ni", label: "Voice D", voice: "Voice D", quote: `"I'm already picking up on what this place is really about. A few cues tell me more than the formal orientation would."`, example: "Two minutes into my first day, I notice the way people are sitting and what isn't being said, and I get a quick read on what this place is actually like.", signal: "ni" },
    ],
  },
  {
    question_id: "Q-T3",
    card_id: "temperament",
    type: "ranking",
    text: "When you're learning something new",
    items: [
      { id: "si", label: "Voice A", voice: "Voice A", quote: `"I want to learn it the way experts have taught it. The proven sequence usually exists for a reason."`, example: "I follow the standard course in the order it's laid out — the established sequence usually exists for a reason.", signal: "si" },
      { id: "se", label: "Voice B", voice: "Voice B", quote: `"I learn by doing it. Pick it up, try it, adjust based on what's actually happening in my hands."`, example: "I pick the thing up and try it, then adjust based on what's actually happening as I work.", signal: "se" },
      { id: "ni", label: "Voice C", voice: "Voice C", quote: `"I want to understand what the skill is really *for*. Once I get the underlying principle, the specifics fall into place."`, example: "I want to know what the deeper point of this skill is before I'll commit to memorizing the steps.", signal: "ni" },
      { id: "ne", label: "Voice D", voice: "Voice D", quote: `"I'd rather try several approaches than commit to one method. Different methods reveal different things about the skill."`, example: "I'll try three different tutorials in an afternoon — each one shows me a different facet of how this works.", signal: "ne" },
    ],
  },
  {
    question_id: "Q-T4",
    card_id: "temperament",
    type: "ranking",
    text: "When you're trying to read a complex situation",
    items: [
      { id: "se", label: "Voice A", voice: "Voice A", quote: `"I'm watching what's actually happening, not what people say is happening. Behavior in the moment is more honest than explanations."`, example: "I watch what people are actually doing in the room, not what they say they're doing — the behavior is the real read.", signal: "se" },
      { id: "ni", label: "Voice B", voice: "Voice B", quote: `"I'm looking for the one underlying thing that would explain all the other observations at once."`, example: "I'm looking for the single thing that, if true, would make all the small confusing details suddenly fit.", signal: "ni" },
      { id: "ne", label: "Voice C", voice: "Voice C", quote: `"There are probably several forces at work here. I want to map them and see how they interact before picking a read."`, example: "I list the four or five things that could be in play, then watch how they bump into each other before I pick a read.", signal: "ne" },
      { id: "si", label: "Voice D", voice: "Voice D", quote: `"I've seen this kind of situation before. The pattern-match to past examples tells me a lot about what's likely happening."`, example: "I notice this looks a lot like something I went through three years ago, and that comparison tells me most of what I need.", signal: "si" },
    ],
  },
  {
    question_id: "Q-T5",
    card_id: "temperament",
    type: "ranking",
    text: "When a plan isn't working",
    items: [
      { id: "ti", label: "Voice A", voice: "Voice A", quote: `"There's a flaw in the underlying logic of the plan. I want to find it before we change what we're doing."`, example: "Before we change anything, I want to find the assumption in the original plan that turned out not to hold.", signal: "ti" },
      { id: "te", label: "Voice B", voice: "Voice B", quote: `"Let's change what we're doing now to hit the target. We can diagnose the failure afterward."`, example: "Let's switch tactics now and still hit the deadline; we can figure out why the first plan failed once we're past it.", signal: "te" },
      { id: "fi", label: "Voice C", voice: "Voice C", quote: `"Before we keep pushing, I want to know whether this plan is actually aligned with what we care about. Maybe the plan is fine but we're wrong about wanting it."`, example: "Before we push harder, I want to know whether we even still want what this plan was trying to achieve.", signal: "fi" },
      { id: "fe", label: "Voice D", voice: "Voice D", quote: `"People are getting frustrated. Before we can fix the plan, we need to address what the friction is doing to the team."`, example: "I can see people getting frustrated; we need to deal with how the team is feeling before we can productively talk about the plan.", signal: "fe" },
    ],
  },
  {
    question_id: "Q-T6",
    card_id: "temperament",
    type: "ranking",
    text: "When someone you respect disagrees with you",
    items: [
      { id: "te", label: "Voice A", voice: "Voice A", quote: `"If they're right, we should change course quickly. What's the fastest way to test who's seeing it more clearly?"`, example: "If they might be right, the fastest move is a small test that settles it — and then we go with whoever was closer.", signal: "te" },
      { id: "fi", label: "Voice B", voice: "Voice B", quote: `"I have to stay true to what I actually think is right, even if they disagree. But the disagreement matters — I want to sit with it."`, example: "I respect their read, and I'm going to sit with it for a while — but I can't agree until it actually feels true to me.", signal: "fi" },
      { id: "fe", label: "Voice C", voice: "Voice C", quote: `"I care about the relationship as much as being right. Whatever the answer is, I want us to land somewhere we can both stand."`, example: "I care about being right and I care about us still being okay afterward — I want a landing place we can both live with.", signal: "fe" },
      { id: "ti", label: "Voice D", voice: "Voice D", quote: `"Before I adjust, I want to understand exactly where their reasoning differs from mine. The disagreement is informative — I just need to pin down what it turns on."`, example: "I want to keep going until I find the exact step where their reasoning diverged from mine — that's where the real disagreement lives.", signal: "ti" },
    ],
  },
  {
    question_id: "Q-T7",
    card_id: "temperament",
    type: "ranking",
    text: "When you have to make a hard call",
    items: [
      { id: "fi", label: "Voice A", voice: "Voice A", quote: `"I can't make this call well until I'm clear on what I actually believe matters here. Externally-optimal but internally-wrong is the worst place to land."`, example: "Until I'm clear on what I actually think matters here, I can't trust any answer the spreadsheet gives me.", signal: "fi" },
      { id: "fe", label: "Voice B", voice: "Voice B", quote: `"Whatever I decide affects other people. I want to understand who carries what cost before I choose."`, example: "Before I lock this in, I want to know who carries the weight of each option — the cost lands on someone, and I want to see them.", signal: "fe" },
      { id: "ti", label: "Voice C", voice: "Voice C", quote: `"I want to get the decision framework right first. The right framework makes the call itself straightforward."`, example: "If I can name the criteria the right way, the actual choice usually becomes obvious — most of the work is in setting up the question.", signal: "ti" },
      { id: "te", label: "Voice D", voice: "Voice D", quote: `"The data's in. Let's pick the option that best hits the goal and move. We can course-correct once we see how it plays out."`, example: "The data is good enough. I'll pick the option that best hits the goal, ship it, and adjust once we see what happens.", signal: "te" },
    ],
  },
  {
    question_id: "Q-T8",
    card_id: "temperament",
    type: "ranking",
    text: "When someone close to you is struggling",
    items: [
      { id: "fe", label: "Voice A", voice: "Voice A", quote: `"I'm paying attention to what they need from me in the moment: quiet, reassurance, company, honesty, or help carrying it."`, example: "I tune in to what they need from me in this exact moment — sometimes it's company, sometimes it's quiet, sometimes it's the truth.", signal: "fe" },
      { id: "ti", label: "Voice B", voice: "Voice B", quote: `"I want to understand what's really going on before I respond. If I misread the problem, even sincere help can make it worse."`, example: "I ask a few quiet questions first — well-meant help aimed at the wrong problem can make things worse.", signal: "ti" },
      { id: "te", label: "Voice C", voice: "Voice C", quote: `"I want to find the next useful action. What needs to be handled, fixed, arranged, or removed so they can breathe?"`, example: "I scan for the one thing I can handle for them right now — a meal, a logistics call, a thing taken off their plate.", signal: "te" },
      { id: "fi", label: "Voice D", voice: "Voice D", quote: `"I want to honor what this feels like from inside their life. I don't want to rush past the meaning of it just to make myself useful."`, example: "I want to honor what this actually means to them before I do anything that's really about my own need to be helpful.", signal: "fi" },
    ],
  },
  // ── CC-016 — Allocation Layer (Money + Energy) ─────────────────────────
  {
    question_id: "Q-S3-close",
    card_id: "sacred",
    type: "ranking",
    text: "When you have discretionary money — beyond basic survival — where does it most naturally flow among the people closest to you?",
    helper: "Rank from most flow to least. The model reads direction, not moral quality.",
    items: [
      { id: "yourself", label: "Yourself",   gloss: "your own needs, comforts, savings, well-being.",                                  signal: "self_spending_priority"    },
      { id: "family",   label: "Family",     gloss: "kin — parents, children, siblings, spouse, chosen kin.",                          signal: "family_spending_priority"  },
      { id: "friends",  label: "Friends",    gloss: "people you've chosen as close, outside family obligation.",                       signal: "friends_spending_priority" },
    ],
  },
  {
    question_id: "Q-S3-wider",
    card_id: "sacred",
    type: "ranking",
    text: "When your money flows beyond your immediate circle, where does it most naturally go?",
    helper: "Rank from most flow to least. Direction only — the model doesn't judge what kind of allocation this is.",
    items: [
      { id: "social",               label: "Social life",            gloss: "experiences, leisure, dining, travel, entertainment.",                                                                                                                          signal: "social_spending_priority"               },
      { id: "nonprofits_religious", label: "Non-Profits & Religious", gloss: "civil society and faith communities — charities, NGOs, churches, voluntary missions.",                                                                                       signal: "nonprofits_religious_spending_priority" },
      { id: "companies",            label: "Companies",              gloss: "businesses you transact with — whether you own them, work for them, invest in them, or buy from them. (For self-employed users, this category may overlap with Yourself.)",   signal: "companies_spending_priority"            },
    ],
  },
  {
    question_id: "Q-S3-cross",
    card_id: "sacred",
    type: "ranking_derived",
    derived_from: ["Q-S3-close", "Q-S3-wider"],
    text: "When close-circle and wider-circle compete for the same dollar, where does it actually go?",
    helper: "These are your top picks from the previous two rankings. Rank them in resolved priority — what wins when they're forced to compete.",
  },
  {
    question_id: "Q-E1-outward",
    card_id: "sacred",
    type: "ranking",
    text: "When you have discretionary energy — not forced by obligation — where does it most naturally go in the outward, generative direction?",
    helper: "Rank from most flow to least.",
    items: [
      { id: "building",  label: "Building / creating",  gloss: "making something new — products, structures, frameworks, art, code, businesses, ideas.",       signal: "building_energy_priority"  },
      { id: "solving",   label: "Solving problems",    gloss: "removing dysfunction — debugging, repairing, troubleshooting, fixing what's broken.",          signal: "solving_energy_priority"   },
      { id: "restoring", label: "Restoring order",     gloss: "bringing back coherence — organizing, cleaning, maintaining, preserving what already works.",  signal: "restoring_energy_priority" },
    ],
  },
  {
    question_id: "Q-E1-inward",
    card_id: "sacred",
    type: "ranking",
    text: "And in the inward, relational direction — where does your discretionary energy most naturally go?",
    helper: "Rank from most flow to least.",
    items: [
      { id: "caring",    label: "Caring for people",          gloss: "attending to others — listening, supporting, presence, emotional labor.",       signal: "caring_energy_priority"   },
      { id: "learning",  label: "Learning / understanding",   gloss: "taking in — reading, studying, exploring, making sense.",                       signal: "learning_energy_priority" },
      { id: "enjoying",  label: "Enjoying life / experience", gloss: "savoring — being in the moment, pleasure, rest, presence with what is.",        signal: "enjoying_energy_priority" },
    ],
  },
  {
    question_id: "Q-E1-cross",
    card_id: "sacred",
    type: "ranking_derived",
    derived_from: ["Q-E1-outward", "Q-E1-inward"],
    text: "When outward energy and inward energy compete for the same hour, which actually wins?",
    helper: "Your top picks from the previous two rankings. Rank in resolved priority.",
  },
  {
    // CC-024 — Q-Stakes1. Compass card extension: concrete stakes ranking.
    // Pairs with Q-S1/Q-S2 (abstract sacred values) to give Compass a second
    // register — what the heart loves abstractly + what the heart fears
    // losing concretely. Feeds Q-I3's derivation (replacing Q-S1/Q-S2 as
    // the source) so Q-I3 asks about cost-bearing in coherent terms.
    // CC-024 note — card_id is "sacred" (the survey-side CardId), which routes
    // to the Compass shape card on the report via SURVEY_CARD_TO_SHAPE_CARD
    // in lib/cardAssets.ts. The spec body's "card_id: 'compass'" was a
    // slip — survey card_ids never include "compass". Existing Compass-
    // extension questions (Q-S1, Q-S2, Q-S3-*) all use "sacred" too.
    question_id: "Q-Stakes1",
    card_id: "sacred",
    type: "ranking",
    text: "Rank these by importance to your life — what would hurt most to lose.",
    helper: "Drag to reorder. Top is most important; bottom is least.",
    items: [
      { id: "money",               label: "Money / Wealth",              gloss: "Your money, savings, the resources you've built.",        signal: "money_stakes_priority"               },
      { id: "job",                 label: "Job / Career",                gloss: "Your professional standing, your work.",                  signal: "job_stakes_priority"                 },
      { id: "close_relationships", label: "Close relationships",         gloss: "Partner, family, closest friends.",                       signal: "close_relationships_stakes_priority" },
      { id: "reputation",          label: "Reputation",                  gloss: "How others see you, your standing in your community.",    signal: "reputation_stakes_priority"          },
      { id: "health",              label: "Physical safety / Health",    gloss: "Your body, your safety.",                                 signal: "health_stakes_priority"              },
    ],
  },
  {
    // CC-026 — Q-3C1. Path-anchored drive-priority ranking. Captures the user's
    // CLAIMED drive across the three drive-categories (Cost-drive / Coverage-
    // drive / Compliance-drive). Internal framework name: Drive. User-facing
    // prose never exposes the framework terms — items render in human language.
    //
    // The rank captured here is the claimed drive. The user's REVEALED drive
    // derives from 15 existing question-equivalents (5 per bucket; see
    // lib/drive.ts tagging table). The matrix between claimed and revealed is
    // the tension this CC surfaces — the model's first claimed-vs-revealed
    // why-axis.
    //
    // card_id "role" is a previously-reserved CardId already mapped to Path ·
    // Gait via SURVEY_CARD_TO_SHAPE_CARD in lib/cardAssets.ts. No mapping
    // change needed.
    question_id: "Q-3C1",
    card_id: "role",
    type: "ranking",
    text: "When you have to choose, which most often guides you?",
    helper: "Three of how decisions actually get made. Rank by which most often wins when they pull apart.",
    items: [
      // CC-033 — first item label/gloss rewritten. Prior "Protecting financial
      // security" conflated cost-as-ambition with compliance-as-security; the
      // new wording lands the cost bucket as ambition / wealth-creation. The
      // item id ("cost") and signal ("cost_drive") are canon-locked.
      { id: "cost",       label: "Building wealth and standing",     gloss: "what you build, accumulate, and become known for.",      signal: "cost_drive"       },
      // CC-040 — coverage item label/gloss rewritten to match the broader
      // scope the bucket actually measures (intimate-care + active service +
      // civic belonging). The item id ("coverage") and signal
      // ("coverage_drive") are canon-locked.
      { id: "coverage",   label: "Caring for people, service, and society", gloss: "the people you love, the work you give, and the world you contribute to.", signal: "coverage_drive"   },
      { id: "compliance", label: "Managing risk and uncertainty",    gloss: "guarding against loss, protecting what could be taken.", signal: "compliance_drive" },
    ],
  },
  {
    // CC-033 — Q-Ambition1. Path-anchored ambition-class ranking. Captures
    // explicit pursuit-orientation signals (Success / Fame / Wealth / Legacy)
    // for the cost bucket of the Drive framework. All four items tag "cost"
    // in lib/drive.ts SIGNAL_DRIVE_TAGS. Rank-aware weighting applies (rank 1
    // = 3x, rank 2 = 2x, rank 3 = 1x, rank 4 = 0.5x).
    //
    // Sits adjacent to Q-3C1 on the role card. Q-3C1 captures CLAIMED top-
    // level drive across all three buckets; Q-Ambition1 refines the REVEALED
    // measurement inside the cost bucket.
    question_id: "Q-Ambition1",
    card_id: "role",
    type: "ranking",
    text: "When you imagine succeeding — what does the win look like?",
    helper: "Rank from most pull to least. There are no wrong answers; the model reads direction.",
    items: [
      { id: "success", label: "Success", gloss: "hitting the goals you set, accomplishing what you set out to do.",          signal: "success_priority" },
      { id: "fame",    label: "Fame",    gloss: "being known beyond your immediate circle — recognition, attention, reach.", signal: "fame_priority"    },
      { id: "wealth",  label: "Wealth",  gloss: "accumulation as an end — money and assets you've built and hold.",          signal: "wealth_priority"  },
      { id: "legacy",  label: "Legacy",  gloss: "lasting impact — what outlives you in the world or in others.",             signal: "legacy_priority"  },
    ],
  },
  // ── CC-015c + CC-017 — Keystone Reflection (anchor + cross-card belief stress-test) ─────
  // Sequenced after the Allocation Layer (re-ordered 2026-04-26): the user names stated
  // values, then sees their actual allocation receipts, then marks aspirational gaps,
  // and only then is asked to articulate a belief. The named ↔ spent ↔ wished priming
  // produces more honest belief naming than asking up front.
  // CC-024 — Q-Stakes1 lands between the Allocation block and Q-I1, completing
  // the Compass card's measurement surface (abstract values + concrete stakes)
  // before the Keystone block stress-tests the user's named belief.
  {
    // Q-I1 — anchor only (CC-017). Content not signal-extracted into BeliefUnderTension;
    // the four catalog signals (independent_thought_signal, epistemic_flexibility,
    // conviction_under_cost, cost_awareness) continue to fire from this freeform via
    // extractFreeformSignals, preserved for v0 → v1 LLM-substitution continuity.
    // CC-024 — text reframed from social-differentiation register ("believe that most
    // people around you disagree with") to cost-bearing register, matching the
    // block's intended purpose. The composition rule: Q-I1's verb must compose
    // with the Keystone block's stress-test-of-cost-of-conviction purpose.
    question_id: "Q-I1",
    card_id: "conviction",
    type: "freeform",
    text: "What is a belief you'd bear real cost to keep?",
    options: [],
  },
  {
    // CC-017 — Q-I1b. Conditional follow-up that renders only when Q-I1 was
    // skipped. Unskippable (the only such question in the bank). The softer
    // fallback now stays in cost-bearing register (CC-024) — otherwise Q-I1's
    // reframe is undermined the moment a user skips it.
    question_id: "Q-I1b",
    card_id: "conviction",
    type: "freeform",
    text: "Ok, maybe not a heavy cost. How about a belief you'd defend even when it makes things harder?",
    options: [],
    render_if_skipped: "Q-I1",
    unskippable: true,
  },
  {
    // CC-017 (original) → CC-032 (cascade): Q-I2 now derives from the v2.5
    // cross-ranks (Q-X3-cross + Q-X4-cross) instead of the legacy flat Q-X3 +
    // Q-X4. The user's revision-source space now potentially includes Social
    // Media, Outside-expert, Government-Services, News-organizations —
    // dimensions the legacy form averaged into bucket labels.
    //
    // derived_top_n_per_source dropped 3 → 2 in CC-032 because cross-ranks
    // already resolved priority across the wider domain. CC-035 expands that
    // surface 2 → 3 so Q-I2 can expose secondary trust pulls again without
    // changing the parent architecture. Total checkbox items = 6 + None +
    // Other.
    question_id: "Q-I2",
    card_id: "conviction",
    type: "multiselect_derived",
    derived_from: ["Q-X3-cross", "Q-X4-cross"],
    derived_top_n_per_source: 3,
    text: "What or who could change your mind about this belief?",
    helper: "Check all that apply. The model reads which trust sources have power over this belief.",
    none_option: { id: "none", label: "None of these" },
    other_option: { id: "other", label: "Other (please specify)", allows_text: true },
  },
  {
    // CC-024 — Q-I3 re-derived. Was multiselect_derived from Q-S1+Q-S2 (sacred
    // values) — incoherent because sacred-by-definition means not-to-be-
    // sacrificed. Now derives from Q-Stakes1 concrete loss domains, so the
    // verb "would risk losing" composes with the answer space. CC-035 expands
    // the derived depth 3 → 6 after Q-Stakes1 itself grew to 6 items.
    // card_id stays "pressure" — Q-I3 reads cost-bearing under pressure
    // (Fire/immune-response register), unchanged by the derivation source shift.
    question_id: "Q-I3",
    card_id: "pressure",
    type: "multiselect_derived",
    derived_from: ["Q-Stakes1"],
    derived_top_n_per_source: 6,
    text: "What would you risk losing for this belief?",
    helper: "Check all that apply. The model reads which concrete costs you'd bear for this belief.",
    none_option: { id: "none", label: "None of these" },
    other_option: { id: "other", label: "Other (please specify)", allows_text: true },
  },
];
