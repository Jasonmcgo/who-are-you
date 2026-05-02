export const USE_CASES_SECTION_TITLE = "What this is good for.";
export const USE_CASES_SECTION_SUBHEAD =
  "This is not a verdict. It's a read you can return to. Here are ten places it earns its keep.";

export const USE_CASES: ReadonlyArray<{
  title: string;
  body: string;
}> = [
  {
    title: "Career decisions.",
    body: "When the next role is on the table, the question is not which job sounds best. It's whether the role would draw on the gifts the read named, leave the gravity you ranked highest intact, and let your driver function operate without distortion. Run the role against your top three gifts and your top three Compass values; if the answer is structurally flat, the role is wrong for you regardless of the title.",
  },
  {
    title: "Work-energy choices.",
    body: "When you're choosing between two efforts that both make sense on paper, your driver register and your work-map composite tell you which one will give you energy back rather than draining it. Effort that aligns with your driver tends to feel like resistance you welcome; effort that aligns with the work-map's anti-shape tends to feel like resistance that costs.",
  },
  {
    title: "Family and coworker explanations.",
    body: "When the people closest to you are confused by what you do, the analog label and the driver/instrument language give you something portable to hand them. Not 'I'm an INTJ' — instead 'I'm running the long-arc-architect register; the structure I'm building isn't the one this room is asking for, but it is the one I'm built to build.' Read it back to yourself first; share the parts that hold.",
  },
  {
    title: "Conviction-vs-rigidity check.",
    body: "When you can't tell whether you're holding a principled line or a defensive one, the read names which Compass values are protect-class for you and which are aspirational. Conviction holds protect-class items; rigidity holds aspirational items past their evidentiary weight. The read tells you which is which for you.",
  },
  {
    title: "Building-vs-maintaining check.",
    body: "When you're choosing whether to build a new thing or steward the existing one, the gift category fired and the work-map composite tell you which mode is yours by default. Builders forced to steward erode; stewards forced to build flounder. Knowing your default doesn't lock you to it; it tells you which mode is the costlier ask for you.",
  },
  {
    title: "Principled-vs-familiar fight check.",
    body: "When a fight is worth it, the read tells you whether you're fighting for what your Compass actually protects or for what feels familiar to defend. The Compass top 5 plus the willing-to-bear-cost signal compose the test: if you'd bear the cost named, the fight is principled; if you wouldn't, the fight may be habit.",
  },
  {
    title: "Faith and belief patterns under pressure.",
    body: "When your faith or belief is being pressed — by grief, by complexity, by social weather — the Faith Shape and Faith Texture composing in your read tell you which register is operating now and which is recovering. Not 'do you still believe' but 'which way of holding belief is doing the work right now, and which is in repair.'",
  },
  {
    title: "Love calibration.",
    body: "When the relationship feels off, the love-map register and the love-flavor naming what you mean by love tell you whether the gap is incompatibility or under-translation. Two people in adjacent love registers can read each other as 'not loving me' when both are loving in their respective registers. The read gives you a shared vocabulary.",
  },
  {
    title: "Sharing the profile.",
    body: "When you want a friend, partner, or therapist to see how you're put together, the report is a portable read they can engage without you having to perform yourself. The masthead's 'a possibility, not a verdict' framing is doing real work — share with that frame intact, and the conversation it opens is more useful than the report alone.",
  },
  {
    title: "Periodic return.",
    body: "This read is a snapshot of your current shape, not a permanent label. Return to it when you've been changed by something — grief, success, a new relationship, a season of doubt, a season of clarity. Your gifts and Compass values rarely flip; their composition often re-weights. Re-take the assessment when the question 'has this shifted' starts mattering.",
  },
];

export default function UseCasesSection() {
  return (
    <section
      className="flex flex-col"
      aria-labelledby="use-cases-heading"
      style={{ gap: 14, paddingTop: 12, paddingBottom: 12 }}
    >
      <p
        id="use-cases-heading"
        className="font-serif"
        style={{
          fontSize: 28,
          color: "var(--ink)",
          margin: 0,
          lineHeight: 1.1,
        }}
      >
        {USE_CASES_SECTION_TITLE}
      </p>
      <p
        className="font-serif italic text-[15px] md:text-[16px]"
        style={{
          color: "var(--ink-soft)",
          margin: 0,
          lineHeight: 1.55,
        }}
      >
        {USE_CASES_SECTION_SUBHEAD}
      </p>
      {USE_CASES.map((useCase) => (
        <p
          key={useCase.title}
          className="font-serif text-[15.5px] md:text-[16px]"
          style={{
            color: "var(--ink)",
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          <strong>{useCase.title}</strong>{" "}
          {useCase.body}
        </p>
      ))}
    </section>
  );
}
