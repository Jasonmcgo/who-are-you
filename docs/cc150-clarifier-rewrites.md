# CC-150 — Follow-up clarifier plain-language rewrites (owner review)

CC-150 rewrote every in-scope follow-up clarifier option `text` field in
`lib/followUpQuestions.ts` to satisfy the plain-language rubric CC-149 left
above `FAMILY_SEED_BANKS`. Only `text` changed — `label`, `tags`,
`interpretation`, and `boost` are byte-identical (those are the engine's
signal semantics + the write-back key). `control_mastery.aimReplacement`'s
eight `text` fields are unchanged — they are the owner-locked CC-149
reference.

This manifest is the owner-review artifact. Read column-wise: the
`interpretation` is the ground-truth meaning the new `text` must stay
faithful to.

## Counts per family / bank

| Family                  | gripObject | releaseCondition | aimReplacement | total |
| ----------------------- | ---------: | ---------------: | -------------: | ----: |
| `control_mastery`       |          8 |                8 |       0 (LOCK) |    16 |
| `belonging_usefulness`  |          8 |                8 |              8 |    24 |
| `worth_achievement`     |          8 |                8 |              8 |    24 |
| `continuity`            |          8 |                8 |              8 |    24 |
| `security`              |          8 |                8 |              8 |    24 |
| `responsibility`        |          8 |                8 |              8 |    24 |
| Family sub-total        |         48 |               48 |             40 |   136 |
| `COMPRESSION_CHECK_OPTIONS` |        — |                — |              — |     8 |
| `TRAIT_VS_WEATHER_OPTIONS`  |        — |                — |              — |     8 |
| **Total rewritten**     |            |                  |                |  **152** |

Plus CC-149's `control_mastery.aimReplacement` 8 LOCKED → grand total 160
in-bank options. CC-150 left the 8 LOCKED set byte-identical.

## `control_mastery` — gripObject

| label | interpretation | OLD text | NEW text |
| --- | --- | --- | --- |
| Mastery | Grip-as-skill-sovereignty. | Craft sufficient that nothing about the work surprises me. | Knowing the work well enough that nothing about it can catch you off guard. |
| Authorship | Grip-as-attribution. | Outcomes I can fully attribute to my own hand. | Getting outcomes you can clearly point to as your own doing. |
| Inner certainty | Grip on knowing-before-saying. | Internal certainty before public commitment. | Being completely sure inside before you say anything out loud. |
| Standing scrutiny | Grip-as-defensible-outcome. | The work standing under outside scrutiny. | Knowing the work would hold up if anyone looked closely. |
| Avoiding misread | Grip = avoiding the perceptual cost. | Not being read as incompetent or unprepared. | Not being read as someone who doesn't know what they're doing. |
| Model holding | Grip-as-framework-validation. | The model I built holding under stress. | Seeing your plan hold up when things go wrong. |
| No surprises | Grip-as-anticipation. | Knowledge thorough enough that no question lands cold. | Knowing the material so well that no question can catch you flat-footed. |
| Quiet competence | Grip-as-implicit-authority. | Being someone the room defers to without asking. | Being the person other people quietly defer to without having to ask. |

## `control_mastery` — releaseCondition

| label | interpretation | OLD text | NEW text |
| --- | --- | --- | --- |
| Competent hands | Release through visible peer-competence. | Other competent hands proving load-bearing in the same domain. | Seeing other capable people handle the same kind of work well. |
| Recoveries logged | Release through reversibility. | A track record of recoveries from being wrong landing without consequence. | Having a history of being wrong and recovering, with no real damage done. |
| Low-stakes public | Release through cost-bounded exposure. | Stakes low enough to learn in public without it costing. | Stakes low enough that you can learn out in the open without anything being lost. |
| Sharper peer | Release through being shown up gracefully. | A peer who shows up sharper than me on something I care about. | A peer doing the thing you care about better than you, and being okay with that. |
| Public miss | Release through standing surviving error. | A public miss landing without my standing collapsing. | Missing something in front of people and finding your standing still intact. |
| Time to iterate | Release through pace-tolerance. | Time that doesn't punish iteration as indecision. | Having time to revise without it being read as not making up your mind. |
| Held by structure | Release through scaffolding. | A structure that catches my mistakes before they reach anyone. | Working inside a system that catches your mistakes before anyone else sees them. |
| Trust the inputs | Release through letting go of attribution. | Trusting the inputs I didn't author personally. | Trusting work you didn't do yourself. |

## `control_mastery` — aimReplacement (LOCKED — CC-149, unchanged here)

Byte-identical to CC-149. Listed for reference only.

| label | text (LOCKED) |
| --- | --- |
| Ships under feedback | Putting work out before it's perfect and improving it from real feedback. |
| Public iteration | Improving the work in the open, where people can watch it evolve. |
| Mastery as service | Measuring your skill by what it lets other people do — not by how good you are. |
| Next revision | Aiming for the next good version instead of one final, perfect answer. |
| Held lightly | Holding your skill loosely, because there's always a next version. |
| Recoveries on record | Being open about your mistakes and how you fixed them, instead of hiding them. |
| Stewardship of craft | Tending a craft you'll hand down to someone after you. |
| Curiosity over certainty | Letting curiosity matter more than being certain. |

## `belonging_usefulness` — gripObject

| label | interpretation | OLD text | NEW text |
| --- | --- | --- | --- |
| Being the one who arrives | Grip-as-show-up. | Being the one who reliably arrives when needed. | Being the person who always shows up when someone needs you. |
| Useful role | Grip-as-function. | The role of useful presence in the lives of people I love. | Being the useful one in the lives of the people you love. |
| Continuity | Grip-as-reliability. | Continuity others can count on, even when I'm tired. | Being someone people can count on even on days you're worn out. |
| Reading the room | Grip-as-anticipatory-care. | Knowing what each person needs before they ask. | Knowing what each person needs before they have to ask. |
| Kept in | Grip = belonging-as-currency. | Being kept inside the circle by the work I do for it. | Earning your place in the group through the work you do for it. |
| What I make possible | Grip-as-downstream-care. | What I make possible for the people I love. | What you make possible for the people you love. |
| Not being a burden | Grip = care-without-receiving. | Avoiding ever being the one who needs. | Never being the one who has needs of your own. |
| Being needed | Grip-as-indispensability. | Being needed by the people I'd carry anything for. | Being needed by the people you'd do anything for. |

## `belonging_usefulness` — releaseCondition

| label | interpretation | OLD text | NEW text |
| --- | --- | --- | --- |
| Stay without orchestrating | Release through non-conditional bond. | Proof that someone stays without me orchestrating it. | Seeing someone stay close without you having to arrange it. |
| Hand offered first | Release through being held first. | A reciprocal hand offered to me before I ask. | Someone offering you help before you've asked for it. |
| Received tired | Release through non-performative reception. | Being received warmly when I show up tired. | Being met warmly even on a day you show up tired and depleted. |
| Ask without performing | Release through unguarded ask. | Permission to ask for something without performing the need. | Being able to ask for something without first proving you really need it. |
| Absence doesn't end it | Release through proven continuity-without-me. | Evidence that my absence doesn't end the bond. | Knowing the relationship survives even when you're not around. |
| Named, not used | Release through ontological recognition. | Being named for who I am, not what I do. | Being known for who you are, not for what you do for people. |
| Slow week, still in | Release through low-output reception. | Being kept in the circle on a slow week. | Still being part of the circle on a week when you don't bring much. |
| Held while needing | Release through being-the-one-cared-for. | Someone holding the load while I need. | Letting someone carry things for you while you're the one who needs. |

## `belonging_usefulness` — aimReplacement

| label | interpretation | OLD text | NEW text |
| --- | --- | --- | --- |
| Presence, not function | Aim shifts from doing to being. | Belonging as presence, not function. | Belonging because you're there, not because of what you do. |
| Care includes me | Aim names self-care as part of love. | Care that explicitly includes me as a recipient. | Care that includes you as one of the people it covers. |
| Past the role | Aim = identity beyond function. | The relationship past the role. | Being in the relationship past whatever role you've been playing. |
| Receive without repay | Aim = gift-economy register. | Receiving without paying back. | Letting someone do something for you without needing to pay them back. |
| Known by name | Aim = ontological belonging. | Being known by name, not job description. | Being known for who you are, not the function you serve. |
| Continuity past me | Aim = bond stronger than function. | Continuity that survives my absence. | Relationships that hold together even when you step away for a while. |
| Care with form | Aim = bounded generosity. | Care that has structure so it doesn't drain me. | Caring for people in ways that don't drain you dry. |
| Mutual carry | Aim = balanced reciprocity. | Carrying and being carried in the same relationships. | Carrying others, and being carried, inside the same relationships. |

## `worth_achievement` — gripObject

| label | interpretation | OLD text | NEW text |
| --- | --- | --- | --- |
| The next visible win | Grip-as-ledger. | The next visible win on the public ledger. | Getting the next visible win other people can see. |
| Substantial output | Grip-as-perceived-weight. | Output the world reads as substantial. | Putting out work the world treats as substantial. |
| Peer standing | Grip-as-relative-position. | Standing measured against people I respect. | Where you rank against the people you most respect. |
| The minimum standard | Grip-as-floor-defense. | The standard I won't allow myself to drop below. | The line you won't let yourself fall below. |
| Justifying the cost | Grip-as-cost-justification. | Achievement that justifies the cost of what I gave up. | Wins big enough to make up for what you gave up to get them. |
| Belonging in the room | Grip-as-credential. | Evidence I belong in the room I'm in. | Proof that you belong in the room you're sitting in. |
| Identity is the work | Grip-as-self-equals-output. | Identity that fuses with the work itself. | Being the kind of person who's defined by what you make. |
| Stopping looks like falling | Grip = motion-as-defense. | Avoiding the pause that would feel like falling behind. | Never stopping, because stopping would feel like falling behind. |

## `worth_achievement` — releaseCondition

| label | interpretation | OLD text | NEW text |
| --- | --- | --- | --- |
| Recognition when idle | Release through non-pursuit. | Recognition that lands when I've stopped chasing it. | Getting recognized when you've stopped chasing recognition. |
| Approval from someone i've stopped needing | Release through outgrowing the audience. | Approval from someone whose approval I've stopped requiring. | Getting approval from someone whose approval no longer matters to you. |
| Worth named idle | Release through being-not-doing. | Worth named when I'm idle, not productive. | Being told you matter on a day you're producing nothing. |
| Peers as peers | Release through unranked belonging. | Peers who treat me as a peer regardless of my output. | Peers treating you as one of them no matter what you're producing. |
| Slow week, seen | Release through visibility-without-output. | Being seen as worth on a slow week. | Being seen as valuable on a slow week. |
| Praise that doesn't catch | Release through ungrasped affirmation. | Praise that doesn't catch on me — i can hear it without needing more. | Hearing praise and just letting it land — not needing more of it. |
| Pause without falling | Release through rest-as-rest. | A pause that doesn't feel like falling behind. | Taking a pause that doesn't feel like falling behind. |
| Failure that survives | Release through fail-safe standing. | A failure where my standing survives. | Failing at something and finding your standing intact afterward. |

## `worth_achievement` — aimReplacement

| label | interpretation | OLD text | NEW text |
| --- | --- | --- | --- |
| Includes maintenance | Aim = baseline-inclusive worth. | Worth that includes the maintenance work, not just the peaks. | Counting the quiet maintenance work as part of what you're worth, not just the high points. |
| Against past self | Aim = self-referential growth. | Standard set against my own previous version. | Measuring yourself against who you used to be, not against other people. |
| Scaled to needed | Aim = fit-for-purpose. | Achievement scaled to the work that's actually needed. | Doing what the work actually needs, no more and no less. |
| Quiet register | Aim = stillness is also work. | Quietness as a register I can occupy without losing standing. | Being quiet sometimes without it costing you standing. |
| Sustained over peak | Aim = long-arc stamina. | Sustained competence over peak performance. | Showing up steady over a long stretch instead of spiking. |
| Worth past output | Aim = ontological worth. | Worth named in domains output can't reach. | Mattering in parts of life that have nothing to do with what you produce. |
| Cost named | Aim = pricing-honest. | Naming the cost of the wins openly. | Being open about what each win actually cost you. |
| Building under-name | Aim = unattributed contribution. | Building things I won't sign. | Making things you won't put your name on. |

## `continuity` — gripObject

| label | interpretation | OLD text | NEW text |
| --- | --- | --- | --- |
| What's worked before | Grip-as-precedent. | What's worked before, especially in the lineage that taught me. | What's worked before, especially from the people who taught you. |
| The familiar shape | Grip-as-known-form. | The familiar shape under uncertainty. | The shape you already know when everything else is uncertain. |
| The institution I'd preserve | Grip-as-custodianship. | The institution, relationship, or discipline I'd preserve. | The institution, relationship, or practice you'd most want to keep alive. |
| Their way of doing it | Grip-as-honoring-source. | The way it was done by people who taught me. | The way the people who taught you did it. |
| Proven pattern | Grip-as-tested-method. | The pattern that's already proven its keep. | The way of doing it that's already proven itself over time. |
| The handoff intact | Grip-as-transmission-fidelity. | Handing on what I received without losing it. | Passing on what you received without losing any of it. |
| Avoid the new fad | Grip-as-risk-floor. | Avoiding the cost of betting on what hasn't proven itself yet. | Not betting on something new that hasn't proven itself yet. |
| Hold the long arc | Grip-as-time-binding. | Holding the long arc together when others would drop it. | Holding a long arc together when other people would let it drop. |

## `continuity` — releaseCondition

| label | interpretation | OLD text | NEW text |
| --- | --- | --- | --- |
| Update that doesn't betray | Release through reverent revision. | An update that doesn't betray what came before. | Changing something in a way that doesn't betray what came before it. |
| Small change held | Release through bounded experiment. | A small change tested and held. | Trying a small change and watching it hold. |
| Permission to revise | Release through authorized change. | Permission to revise something I'm faithful to. | Being given permission to revise something you've been faithful to. |
| Trusted hands | Release through co-stewardship. | Trusted hands holding what I'd usually carry. | Trusted hands carrying what you usually carry. |
| New doesn't lose old | Release through additive change. | Evidence the new way doesn't lose the old way's gift. | Seeing that the new way doesn't lose what the old way was good at. |
| Ancestors would approve | Release through imagined consent. | A change that those who taught me would have made themselves. | Making a change the people who taught you would have made themselves. |
| One precedent broken | Release through small-stakes break. | Breaking one precedent and seeing the world keep working. | Breaking one piece of tradition and watching the world keep working. |
| Time for the new to prove | Release through observation-window. | Time for the new pattern to prove itself. | Giving a new way enough time to prove itself. |

## `continuity` — aimReplacement

| label | interpretation | OLD text | NEW text |
| --- | --- | --- | --- |
| Stewardship lets things update | Aim = living-tradition register. | Stewardship that lets things update without losing them. | Tending what you've been given in a way that lets it change without losing what mattered. |
| Faith as discipline | Aim = practice over preservation. | Faithfulness as an evolving discipline. | Being faithful as an ongoing practice, not as a fixed object. |
| Revision as honoring | Aim = change-as-respect. | Continuity that admits revision as honoring. | Treating careful revision as a way of honoring what came before. |
| Held lightly | Aim = grip-by-not-gripping. | Tradition held lightly enough to last. | Holding tradition loosely enough that it can keep going. |
| Next chapter same voice | Aim = continuity through voice not form. | The next chapter named in the same voice as the last. | Keeping the same spirit as you carry something into a new form. |
| Care for past survives change | Aim = memory + motion. | Care for the past that survives the change. | Caring for the past in a way that survives when things change. |
| Inheritance with edits | Aim = generative stewardship. | Inheritance handed on with my own honest edits. | Passing on what you received, with your own honest edits in it. |
| Tradition that breathes | Aim = living rather than embalmed. | A tradition that breathes — moves with the season. | A tradition that breathes — that moves with the season instead of being frozen. |

## `security` — gripObject

| label | interpretation | OLD text | NEW text |
| --- | --- | --- | --- |
| Margin against worst | Grip-as-buffer. | Margin against the worst case. | Having a cushion in case the worst case happens. |
| Foundations don't fail | Grip-as-bedrock. | Foundations others can't pull out from under me. | Foundations no one else can pull out from under you. |
| No-surprise plan | Grip-as-completeness. | Plans with no surprise edges. | Plans with no surprises hiding at the edges. |
| Floor under what I love | Grip = floor-for-others. | A floor under the people and things I love. | A solid base under the people and things you love. |
| Money / structure that holds | Grip-as-resource-buffer. | Money or structure that doesn't fail when tested. | Money or structure that holds when it gets tested. |
| Not at someone's mercy | Grip-as-independence. | Not being at someone else's mercy for what I need. | Not having to depend on anyone else for what you need. |
| Knowing where it is | Grip-as-inventory. | Knowing where every important thing is, today. | Knowing exactly where every important thing is, today. |
| Hedge the unknown | Grip-as-anti-uncertainty. | Hedging against what I can't predict. | Hedging against what you can't predict. |

## `security` — releaseCondition

| label | interpretation | OLD text | NEW text |
| --- | --- | --- | --- |
| Safety net named | Release through identifiable backup. | A safety net I can name and trust by name. | A backup plan you can name out loud and actually trust. |
| Stakes without losing ground | Release through bounded loss. | Stakes I can lose without losing the ground. | Stakes you could lose without losing the ground under you. |
| People who'd catch me | Release through trusted hands. | People who'd catch me before I fell. | People who would catch you before you hit bottom. |
| One risk allowed | Release through risk-affordability. | Margin enough to take one calculated risk. | Enough cushion to take one calculated risk without it being reckless. |
| Vigilance can rest | Release through trustworthy structure. | Evidence my security doesn't require constant vigilance. | Seeing that your security doesn't need you watching it constantly. |
| Loss survivable | Release through tested-resilience. | A real loss that I survived intact. | Surviving a real loss and finding you're still intact. |
| Others share the load | Release through co-protection. | Others sharing the load of keeping things safe. | Other people sharing the work of keeping things safe. |
| Enough is enough | Release through enoughness. | A clear sense that what I have is enough. | A clear sense that what you already have is enough. |

## `security` — aimReplacement

| label | interpretation | OLD text | NEW text |
| --- | --- | --- | --- |
| Stewardship over hoarding | Aim = circulation-not-accumulation. | Stewardship of resources rather than hoarding them. | Tending what you have so it can circulate, instead of just stockpiling it. |
| Quiet floor, not fence | Aim = supportive-not-defensive. | Security as a quiet floor, not a fence around the day. | Security as something quiet that you stand on, not a fence built around your day. |
| Generosity from margin | Aim = abundance-from-buffer. | Generosity made possible by the margin. | Being generous because you've built up enough room to give from. |
| Structure that holds without me | Aim = systemic over personal. | Trust that the structure holds without my constant tending. | Trusting the structure to hold without you tending it every minute. |
| Stability shared | Aim = collective-floor. | Stability shared with others, not just kept. | Sharing your stability with other people instead of just keeping it for yourself. |
| Enough as the read | Aim = sufficiency-claimed. | Naming enough as the actual read, not the prelude. | Naming what you have as actually enough, not just a step on the way to more. |
| Risk as practice | Aim = risk-integrated. | Calculated risk as part of the practice, not the threat. | Taking calculated risks as part of how you work, not as the enemy. |
| Safety extended outward | Aim = protection-as-gift. | The safety I built extending out beyond my own life. | Letting the safety you've built reach past your own life into other people's. |

## `responsibility` — gripObject

| label | interpretation | OLD text | NEW text |
| --- | --- | --- | --- |
| What others count on | Grip-as-promise. | What others are counting on me to carry. | What other people are counting on you to carry. |
| Role no one else takes | Grip-as-default-volunteer. | The role no one else is taking up. | The job no one else is stepping up to do. |
| Weight I picked up | Grip-as-uncleared-debt. | The weight I picked up and didn't put down. | The load you picked up at some point and never put down. |
| Silent promise | Grip-as-tacit-contract. | The promise I made silently and won't break. | The promise you made without saying it out loud, and won't break. |
| Maintenance unseen | Grip-as-hidden-stewardship. | The maintenance work no one else sees. | The upkeep work no one else notices. |
| Caretaker by default | Grip-as-assumed-duty. | Becoming the caretaker because someone had to. | Becoming the caretaker because someone had to be. |
| Putting them first | Grip-as-prioritization. | Putting them first because no one else will. | Putting them first because no one else is going to. |
| Not letting it fall | Grip-as-watch-duty. | Not letting the structure fall on my watch. | Not letting the thing fall apart on your watch. |

## `responsibility` — releaseCondition

| label | interpretation | OLD text | NEW text |
| --- | --- | --- | --- |
| Hands take a piece | Release through proven co-bearer. | Hands that take a piece of the load without dropping it. | Someone taking a piece of the load and not dropping it. |
| Permission to say no | Release through bounded refusal. | Permission to say no to one obligation without consequence. | Saying no to one obligation and finding nothing bad happens. |
| Clean handoff | Release through transfer-not-abandonment. | A clean handoff of one thing I've been holding. | Handing off one thing you've been carrying, cleanly. |
| World keeps working | Release through proven dispensability. | Time off where the world keeps working without me. | Taking time off and watching the world keep working without you. |
| Someone else carries a week | Release through felt-relief. | Someone else carrying my weight for a week. | Someone else carrying your weight for a week, and you feeling the relief of it. |
| Permission from the source | Release through source-authorized rest. | Permission from the person I'm carrying for. | Hearing from the person you're carrying for that you can step back. |
| Asked, not assumed | Release through explicit-invitation. | Being asked to carry it, not assuming I should. | Being asked to carry something, instead of just assuming you had to. |
| Care for me named | Release through being-cared-for. | Someone naming care for me as part of the system. | Someone naming care for you as part of how this works. |

## `responsibility` — aimReplacement

| label | interpretation | OLD text | NEW text |
| --- | --- | --- | --- |
| Shared, not solo | Aim = distributed care. | Responsibility shared, not held solo. | Responsibility carried with other people, not alone. |
| No as discipline | Aim = saying-no-is-care. | The discipline of saying no as part of the duty. | Treating saying no as part of doing the job well. |
| Self-maintenance included | Aim = self-inclusive duty. | Maintenance that includes self-maintenance. | Maintenance that includes looking after yourself, too. |
| Relay, not solo race | Aim = succession-thinking. | Stewardship as a relay, not a solo race. | Carrying things like a relay where you hand off, not a solo race. |
| Care delegated | Aim = trust the next hands. | Care delegated without being abandoned. | Letting someone else carry the care, without it being abandoned. |
| Chosen, not conscripted | Aim = volitional service. | The weight as something I choose, not something I'm conscripted to. | Carrying the weight because you chose it, not because you were drafted. |
| Receiving in the cycle | Aim = mutuality. | Receiving care as part of the cycle of giving it. | Receiving care as part of the same cycle that gives it. |
| Discharge complete | Aim = finite duty. | Being able to mark a duty discharged and walk forward. | Being able to mark a duty done and walk away from it. |

## `COMPRESSION_CHECK_OPTIONS`

| label | interpretation | OLD text | NEW text |
| --- | --- | --- | --- |
| What would restore | Folded release: stakes-end signal. | What would restore me first: one signal that the stakes are over. | What would help you first: one clear sign that the pressure is over. |
| Voice / pace | Compression shows as register-shift. | My voice and pace tighten — i speak faster and shorter. | Your voice and pace tighten — you speak faster and shorter than usual. |
| What I notice | Compression shows as perceptual-narrowing. | What I notice narrows — I see only the threat, not the room. | Your attention narrows — you see only the threat, not the rest of the room. |
| Body | Compression shows as held-tension. | My body holds — shoulders, jaw, breath. | Your body holds tight — shoulders, jaw, breath. |
| Trust | Compression shows as control-takeover. | I stop trusting other people's read of the situation. | You stop trusting other people's read of the situation. |
| Time | Compression shows as horizon-collapse. | Time shrinks — I act on the next 60 seconds, not the next month. | Your time horizon shrinks — you act on the next sixty seconds, not the next month. |
| Listening | Compression shows as defensive-attending. | I stop listening for what's true and listen for what's threatening. | You stop listening for what's true and start listening for what's threatening. |
| Who I become | Compression shows as character-shift. | I become someone slightly different — more directive, less curious. | You become someone a little different — more directive, less curious. |

## `TRAIT_VS_WEATHER_OPTIONS`

| label | interpretation | OLD text | NEW text |
| --- | --- | --- | --- |
| What would soften it | Folded release: low-stakes interval. | What would soften it: one season where nothing is at stake. | What would soften it: one stretch where nothing is on the line. |
| Always been this way | Trait read. | This has been my shape since before I can remember. | This has been the way you are for as long as you can remember. |
| Last few years | Weather read. | This sharpened in the last few years — a season, not the bones. | This got sharper in the last few years — it feels like a season, not who you are. |
| Since the load | Weather read tied to onset. | Since the load came on — the specific event or arc — it's been like this. | Since a specific event or arc started — that's when it's been like this. |
| Always like this under stress | Trait-under-load. | Always like this under stress, otherwise different. | Always like this when you're stressed, but different the rest of the time. |
| Became normal | Slow normalization. | It became normal so gradually I stopped noticing. | It became normal so slowly that you stopped noticing it was happening. |
| Inherited | Inherited register. | I learned this from someone I lived with. | You learned this from someone you lived with. |
| Choice that hardened | Choice-to-trait drift. | A choice I made once that hardened into how I do everything. | A choice you made once that hardened into the way you do everything. |

## Ambiguous — needs owner

None. Every in-scope option carries a clear `interpretation` that anchors the
meaning the new `text` was written to. No option's intent was unclear enough
to require leaving the original `text` intact for owner workshop.

If owner review later flags any rewrite as drifting from the underlying
interpretation, the targeted fix is a one-line `text` swap — `label`/`tags`/
`interpretation`/`boost` will remain stable, so write-back is unaffected.
