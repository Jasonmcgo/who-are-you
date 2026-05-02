/* components.jsx — shared UI primitives for "Who Are You?" prototype
   Grounded in canon: Q-S1 (sacred personal-conduct), Q-S2 (sacred larger-than-self),
   Q-X3 (institutional trust), Q-C4 (responsibility attribution), Q-T1 (temperament),
   tensions from tension-library-v1.md, Inner Constitution structure from canon. */

const { useState, useEffect, useRef, useMemo } = React;

// ─────────────────────────────────────────────────────────────────────────────
// Question content (verbatim from canon where possible)
// ─────────────────────────────────────────────────────────────────────────────

// Body-map metadata per canon (shape-framework.md): each card has a
// product-friendly name and a body part it maps to. Kickers use it.
const Q_S1 = {
  card: "Compass",
  body: "Heart",
  ix: "Q-S1",
  kicker: "Compass · Heart · Q-S1 of S2",
  prompt: "Order these by what you'd protect first when something has to give.",
  sub: "Four of your own. Rank by which holds first when two of them pull apart.",
  items: [
    { id: "freedom",   text: "Freedom — the ability to act without needing permission." },
    { id: "truth",     text: "Truth — what's actually so, even when it costs." },
    { id: "stability", text: "Stability — steady ground, for you and the people who rely on you." },
    { id: "loyalty",   text: "Loyalty — staying with your people through what comes." }
  ]
};

const Q_S2 = {
  card: "Compass",
  body: "Heart",
  ix: "Q-S2",
  kicker: "Compass · Heart · Q-S2 of S2",
  prompt: "Order these by which has the strongest claim on you.",
  sub: "The four larger-than-self. Rank by what calls on you hardest when it calls.",
  items: [
    { id: "family",    text: "Family — the people who are yours, and to whom you are theirs." },
    { id: "knowledge", text: "Knowledge — what's actually known, and the discipline of seeking more." },
    { id: "justice",   text: "Justice — fair weight, even when it costs you to give it." },
    { id: "faith",     text: "Faith — trust in what's larger than you, however you frame it." }
  ]
};

const Q_X3 = {
  card: "Trust",
  body: "Ears",
  ix: "Q-X3",
  kicker: "Trust · Ears · Q-X3",
  prompt: "Rank these institutions from most to least trustworthy.",
  sub: "Most trustworthy at the top, least at the bottom. Five items.",
  items: [
    { id: "government", text: "Government — federal, state, and local public bodies." },
    { id: "press",      text: "Press — newsrooms, journalists, and information outlets." },
    { id: "companies",  text: "Companies — businesses and the workplaces that hire you." },
    { id: "education",  text: "Education — schools, colleges, and the credentialing they grant." },
    { id: "civil",      text: "Non-Profits & Religious — charities, NGOs, churches, and other voluntary missions." }
  ]
};

const Q_C4 = {
  card: "Gravity",
  body: "Spine",
  ix: "Q-C4",
  kicker: "Gravity · Spine · Q-C4",
  prompt: "When something goes wrong, rank where the responsibility most often sits.",
  sub: "Five sources. Top is where you most locate responsibility; bottom is where you least.",
  items: [
    { id: "individual",    text: "Individual — the person who acted, and what they brought to the moment." },
    { id: "system",        text: "System — the structures and incentives shaping what was possible." },
    { id: "nature",        text: "Nature — chance, biology, the way things just are." },
    { id: "supernatural",  text: "Supernatural — divine will, fate, or what's beyond human reach." },
    { id: "authority",     text: "Authority — the people in charge of the system, not the system itself." }
  ]
};

const Q_T1 = {
  card: "Lens",
  body: "Eyes",
  ix: "Q-T1 / T8",
  kicker: "Lens · Eyes · Four Voices · Q-T1 of 8",
  prompt: "When you're working on a hard problem — order these by which most sounds like how you actually approach it.",
  sub: "Four voices. Rank by recognition, not preference.",
  items: [
    { id: "ni", voice: "Voice A", text: "Once I see how the pieces are going to land, the rest is mostly execution. I'm looking for the pattern that would explain everything else." },
    { id: "ne", voice: "Voice B", text: "There are at least four interesting angles here. I want to spend time on each before deciding which one fits." },
    { id: "si", voice: "Voice C", text: "What's worked in similar situations before? There's usually precedent worth checking before reinventing." },
    { id: "se", voice: "Voice D", text: "Let me start moving and see what surfaces. I'll know what I'm dealing with once I'm actually working on it." }
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────────────────────

function cls(...xs) { return xs.filter(Boolean).join(" "); }

function ProgressBar({ total = 6, current = 3, done = 2 }) {
  return (
    <div className="progress" aria-label={`step ${current + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={i < done ? "done" : i === current ? "on" : ""} />
      ))}
    </div>
  );
}

function ArtboardHead({ cardName, body, ix, total = 6, current = 3, done = 2 }) {
  return (
    <div className="ab-head">
      <div className="card-name">
        {cardName}
        {body && (
          <span className="body-tag" style={{
            marginLeft: 10, color: "var(--ink-mute)", fontWeight: 400,
            fontStyle: "italic", letterSpacing: 0,
          }}>
            · {body}
          </span>
        )}
      </div>
      <ProgressBar total={total} current={current} done={done} />
      <div className="ix">{ix}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DIRECTION A — Classic drag-to-reorder
// ─────────────────────────────────────────────────────────────────────────────

function RankingA({ items: initial, onChange }) {
  const [order, setOrder] = useState(initial.map(i => i.id));
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);
  const listRef = useRef(null);

  const byId = useMemo(() => Object.fromEntries(initial.map(i => [i.id, i])), [initial]);

  useEffect(() => { onChange && onChange(order); }, [order]);

  const move = (fromId, toId) => {
    if (fromId === toId) return;
    setOrder(curr => {
      const next = curr.slice();
      const from = next.indexOf(fromId);
      const to = next.indexOf(toId);
      if (from < 0 || to < 0) return curr;
      next.splice(from, 1);
      next.splice(to, 0, fromId);
      return next;
    });
  };

  const handlePointerDown = (e, id) => {
    if (e.button != null && e.button !== 0) return;
    setDragId(id);
    const startY = e.clientY;
    const node = e.currentTarget;
    const initRect = node.getBoundingClientRect();
    try { node.setPointerCapture && node.setPointerCapture(e.pointerId); } catch (_) {}

    const onMove = (ev) => {
      const dy = ev.clientY - startY;
      node.style.transform = `translateY(${dy}px)`;
      const list = listRef.current;
      if (!list) return;
      const siblings = [...list.querySelectorAll("[data-rank-item]")].filter(el => el !== node);
      let target = null;
      let best = Infinity;
      siblings.forEach(el => {
        const r = el.getBoundingClientRect();
        const c = r.top + r.height / 2;
        const d = Math.abs(c - ev.clientY);
        if (d < best) { best = d; target = el; }
      });
      if (target && best < initRect.height * 0.7) {
        setOverId(target.dataset.rankItem);
      }
    };
    const onUp = () => {
      node.style.transform = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setDragId(null);
      setOverId(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  useEffect(() => {
    if (dragId && overId && overId !== dragId) {
      move(dragId, overId);
      setOverId(null);
    }
  }, [overId, dragId]);

  return (
    <ol ref={listRef} className="rankA-list">
      {order.map((id, idx) => {
        const it = byId[id];
        return (
          <li
            key={id}
            data-rank-item={id}
            className={cls("rankA-item", dragId === id && "dragging")}
            onPointerDown={(e) => handlePointerDown(e, id)}
          >
            <div className="rankA-rank">{idx + 1}</div>
            <div className="rankA-text">
              {it.voice && (
                <div style={{
                  fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".08em",
                  textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 6,
                }}>{it.voice}</div>
              )}
              <div style={it.voice ? {
                fontFamily: "var(--serif)", fontStyle: "italic", fontSize: "1.02em",
                lineHeight: 1.45, color: "var(--ink)",
              } : undefined}>{it.text}</div>
            </div>
            <div className="rankA-grip" aria-hidden="true">
              <span /><span /><span />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DIRECTION B — Reading-first. Featured statement; rank by assigning to slot.
// ─────────────────────────────────────────────────────────────────────────────

function RankingB({ items, onChange }) {
  const [cursor, setCursor] = useState(0);
  const [slots, setSlots] = useState(Array(items.length).fill(null));

  useEffect(() => { onChange && onChange(slots); }, [slots]);

  const currentItem = items[cursor];
  const alreadyPlacedAt = slots.indexOf(currentItem.id);

  const placeAt = (slotIdx) => {
    setSlots(curr => {
      const next = curr.slice();
      const wasAt = next.indexOf(currentItem.id);
      if (wasAt >= 0) next[wasAt] = null;
      next[slotIdx] = currentItem.id;
      return next;
    });
    setTimeout(() => {
      setSlots(curr => {
        const unplaced = items.findIndex(it => curr.indexOf(it.id) === -1);
        if (unplaced >= 0) setCursor(unplaced);
        return curr;
      });
    }, 180);
  };

  const byId = Object.fromEntries(items.map(i => [i.id, i]));

  return (
    <div className="rankB-wrap">
      <div className="rankB-feature">
        <div className="voice-tag">
          <span>{currentItem.voice || `Statement ${cursor + 1}`}</span>
          {alreadyPlacedAt >= 0 && (
            <span style={{ marginLeft: 10, color: "var(--umber)" }}>· placed at #{alreadyPlacedAt + 1}</span>
          )}
        </div>
        <blockquote>{currentItem.text}</blockquote>
      </div>

      <div>
        <div className="rankB-slot-row">
          {slots.map((id, i) => {
            const filled = id ? byId[id] : null;
            const nextEmpty = slots.findIndex(s => !s);
            return (
              <button
                key={i}
                className={cls("rankB-slot", filled && "filled", !filled && i === nextEmpty && "active")}
                onClick={() => placeAt(i)}
              >
                <span className="slot-num">#{i + 1}{i === 0 ? " · most" : i === slots.length - 1 ? " · least" : ""}</span>
                <div className="slot-text">{filled ? filled.text : "tap to place here"}</div>
              </button>
            );
          })}
        </div>

        <div className="rankB-controls">
          <div className="rankB-nav">
            <button className="btn ghost" onClick={() => setCursor(c => (c - 1 + items.length) % items.length)}>← prev</button>
            <button className="btn ghost" onClick={() => setCursor(c => (c + 1) % items.length)}>next →</button>
          </div>
          <div className="rankB-dots">
            {items.map((it, i) => (
              <span key={it.id} className={cls(i === cursor && "active", slots.indexOf(it.id) >= 0 && "placed")} />
            ))}
          </div>
          <div className="meta">{slots.filter(Boolean).length}/{items.length} placed</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DIRECTION C — Tier drop-zones. Pool on left, tiers on right.
// ─────────────────────────────────────────────────────────────────────────────

function RankingC({ items, onChange }) {
  const [assigned, setAssigned] = useState({});
  const [dragId, setDragId] = useState(null);
  const [overTier, setOverTier] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => { onChange && onChange(assigned); }, [assigned]);

  const tierCount = items.length;
  const tierOccupant = (idx) => {
    const found = Object.entries(assigned).find(([, t]) => t === idx);
    return found ? items.find(i => i.id === found[0]) : null;
  };

  const assign = (itemId, tierIdx) => {
    setAssigned(curr => {
      const next = { ...curr };
      const occupant = Object.entries(next).find(([, t]) => t === tierIdx);
      if (occupant) delete next[occupant[0]];
      next[itemId] = tierIdx;
      return next;
    });
    setSelected(null);
  };

  const removeFrom = (itemId) => {
    setAssigned(curr => {
      const next = { ...curr };
      delete next[itemId];
      return next;
    });
  };

  const handlePointerDown = (e, itemId) => {
    if (assigned[itemId] != null) return;
    setDragId(itemId);
    const node = e.currentTarget;
    const startX = e.clientX;
    const startY = e.clientY;
    try { node.setPointerCapture && node.setPointerCapture(e.pointerId); } catch (_) {}
    node.style.zIndex = 20;
    node.style.position = "relative";

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      node.style.transform = `translate(${dx}px, ${dy}px)`;
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const tier = el && el.closest && el.closest("[data-tier-idx]");
      setOverTier(tier ? parseInt(tier.dataset.tierIdx, 10) : null);
    };
    const onUp = (ev) => {
      node.style.transform = "";
      node.style.zIndex = "";
      node.style.position = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const tier = el && el.closest && el.closest("[data-tier-idx]");
      if (tier) {
        assign(itemId, parseInt(tier.dataset.tierIdx, 10));
      }
      setDragId(null);
      setOverTier(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const tierLabel = (i) => {
    if (i === 0) return "Most";
    if (i === tierCount - 1) return "Least";
    return "";
  };

  return (
    <div className="rankC-layout">
      <div>
        <div className="rankC-pool-head">Items — drag, or tap to select then tap a tier</div>
        <div className="rankC-pool">
          {items.map(it => (
            <div
              key={it.id}
              className={cls("rankC-chip", assigned[it.id] != null && "placed", dragId === it.id && "dragging")}
              onPointerDown={(e) => handlePointerDown(e, it.id)}
              onClick={() => { if (assigned[it.id] == null) setSelected(s => s === it.id ? null : it.id); }}
              style={selected === it.id ? { borderColor: "var(--umber)", background: "var(--paper)" } : undefined}
            >
              {it.text}
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="rankC-tiers-head">Place each in a tier</div>
        <div className="rankC-tiers">
          {Array.from({ length: tierCount }).map((_, i) => {
            const occ = tierOccupant(i);
            return (
              <div
                key={i}
                data-tier-idx={i}
                className={cls("rankC-tier", overTier === i && "over", occ && "filled")}
                onClick={() => { if (selected && !occ) assign(selected, i); }}
              >
                <div className="rankC-tier-label">
                  <span className="num">{i + 1}</span>
                  {tierLabel(i)}
                </div>
                {occ ? (
                  <div className="rankC-tier-item">
                    <span>{occ.text}</span>
                    <button className="remove" onClick={(e) => { e.stopPropagation(); removeFrom(occ.id); }}>remove</button>
                  </div>
                ) : (
                  <div className="rankC-empty">{selected ? "tap to place here" : "empty"}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic question page shell
// ─────────────────────────────────────────────────────────────────────────────

function QuestionPage({ question, variant, compact = false, progress, tension }) {
  const items = question.items;
  const [order, setOrder] = useState(null);
  const [confirmed, setConfirmed] = useState(null);

  const done = progress?.done ?? 2;
  const current = progress?.current ?? 3;
  const total = progress?.total ?? 6;

  // Render kicker with the body-part segment wrapped in a class so the
  // Tweaks toggle can hide it without rebuilding the string.
  const renderKicker = () => {
    if (!question.body) return question.kicker;
    const parts = (question.kicker || "").split(" · ");
    return parts.map((part, i) => {
      const last = i === parts.length - 1;
      if (part === question.body) {
        return (
          <span key={i} className="kicker-body">
            {part}{!last ? " · " : ""}
          </span>
        );
      }
      return (
        <React.Fragment key={i}>
          {part}{!last ? " · " : ""}
        </React.Fragment>
      );
    });
  };

  return (
    <div className={cls("ab", compact && "sm")}>
      <ArtboardHead cardName={question.card} body={question.body} ix={question.ix} total={total} current={current} done={done} />
      <div className="ab-body">
        <div className="prompt-kicker">{renderKicker()}</div>
        <h2 className="prompt">{question.prompt}</h2>
        <div className="sub">{question.sub}</div>

        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12, flex: 1, minHeight: 0 }}>
          {variant === "A" && <RankingA items={items} onChange={setOrder} />}
          {variant === "B" && <RankingB items={items} onChange={(slots) => setOrder(slots.filter(Boolean))} />}
          {variant === "C" && <RankingC items={items} onChange={(a) => {
            const ord = Object.entries(a).sort((x,y)=>x[1]-y[1]).map(([id])=>id);
            setOrder(ord);
          }} />}
        </div>

        {tension && order && order.length >= 2 && !confirmed && (
          <div className="confirm-card">
            <div className="kicker">{tension.kicker || "A pattern may be present"}</div>
            <p>{typeof tension.prompt === "function" ? tension.prompt(order, items) : tension.prompt}</p>
            <div className="choices">
              <button className="btn" onClick={() => setConfirmed("yes, that's right")}>yes, that's right</button>
              <button className="btn ghost" onClick={() => setConfirmed("partly")}>partly</button>
              <button className="btn ghost" onClick={() => setConfirmed("no, not really")}>no, not really</button>
              <button className="btn ghost" onClick={() => setConfirmed("tell me more")}>tell me more</button>
            </div>
          </div>
        )}
        {confirmed && (
          <div className="confirm-card" style={{ background: "transparent" }}>
            <div className="kicker">noted — {confirmed}</div>
            <p style={{ fontStyle: "normal", color: "var(--ink-soft)", margin: 0 }}>We'll carry this into what comes next.</p>
          </div>
        )}
      </div>
      <div className="ab-foot">
        <button className="btn ghost">← back</button>
        <span className="meta">saved · autosave</span>
        <button className="btn primary" disabled={!order || order.length < items.length}>continue →</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner Constitution — reads like a typeset document
// ─────────────────────────────────────────────────────────────────────────────

function ConstitutionPage({ compact = false }) {
  return (
    <div className={cls("ab", compact && "sm")} style={{ background: "var(--paper)" }}>
      <div className="ab-body" style={{ padding: 0 }}>
        <article className="constitution">
          <div className="colophon">
            <span>Inner Constitution</span>
            <span>No. 0041 · v.1</span>
          </div>
          <h1>A description, not a verdict.</h1>
          <div className="for">for — the reader · a body-map of one person</div>

          <p className="lede">
            What follows is not a result. It is the shape your answers pointed at — read across
            eight registers of a person: how you <em>see</em>, what you <em>protect</em>, what
            you <em>say</em>, where you <em>stand</em>, whom you <em>listen</em> to, what you've
            <em> adapted</em> to, how you <em>defend</em>, and where you're <em>moving</em>. If a
            line feels wrong, it probably is. You are the final authority.
          </p>

          <h4 className="meta" style={{ margin: "0 0 8px", color: "var(--ink-mute)" }}>
            Opening shape — Lens, Compass, Gravity
          </h4>
          <p>
            You appear to look first for the pattern that would explain the rest <em>(Lens)</em>,
            to protect truth and independence of thought before comfort or company
            <em> (Compass)</em>, and to locate responsibility close to the person who acted
            before you reach for the system around them <em>(Gravity)</em>. Together these
            three suggest someone who would rather be accurate than easy, and would rather be
            answerable than aggrieved.
          </p>

          <div className="divider">· · ·</div>

          <h4 className="meta" style={{ margin: "0 0 10px" }}>Active tensions</h4>

          <div className="tension">
            <div className="t-meta">T-005 · confirmed · Compass × Conviction</div>
            <h3>Truth vs. Belonging</h3>
            <p>
              You ranked <em>truth</em> in the top of Q-S1 (Compass) and described adapting
              when the social cost of holding a position is high (Conviction). This is not
              hypocrisy. It is the shape of someone who knows both prices and pays one of
              them every week.
            </p>
            <div className="signals">
              <span>compass · truth (rank 1)</span>
              <span>conviction · adapts under social pressure</span>
              <span>conviction · aware of adaptation</span>
            </div>
          </div>

          <div className="tension">
            <div className="t-meta">T-004 · confirmed · Weather × Trust</div>
            <h3>Formation vs. Current Conviction</h3>
            <p>
              The questions about who shaped you (Q-F1, Weather) and the questions about how
              you now hear institutions (Q-X3, Trust) did not trace the same outline. Where
              they diverge, the answers suggest quiet work rather than rupture — you have
              moved, but you have not burned the letter.
            </p>
            <div className="signals">
              <span>weather · authority trust high (formation)</span>
              <span>trust · institutional skepticism (current)</span>
            </div>
          </div>

          <div className="tension">
            <div className="t-meta">T-009 · partly confirmed · Gravity</div>
            <h3>Individual vs. System Responsibility</h3>
            <p>
              In Q-C4 (Gravity) you ranked <em>the individual</em> highest and <em>the
              system</em> second — close enough that both signals read as present. You act as
              though you are in charge of what you are not always sure you are in charge of.
            </p>
            <div className="signals">
              <span>gravity · individual (rank 1)</span>
              <span>gravity · system (rank 2)</span>
            </div>
          </div>

          <div className="divider">· · ·</div>

          <h4 className="meta" style={{ margin: "0 0 10px" }}>Compass — what you protect</h4>
          <p style={{ fontSize: 15, color: "var(--ink-soft)" }}>
            From Q-S1 and Q-S2, in the order you ranked them:
            <em style={{ color: "var(--ink)" }}> truth, freedom, stability, loyalty</em> —
            and for the larger-than-self, <em style={{ color: "var(--ink)" }}>knowledge,
            family, justice, faith</em>.
          </p>

          <h4 className="meta" style={{ margin: "24px 0 10px" }}>
            Weather — present condition, not shape
          </h4>
          <p style={{ fontSize: 15, color: "var(--ink-soft)", fontStyle: "italic" }}>
            Recent answers about load and support read as elevated. State is not shape — the
            patterns above describe how you tend to stand; this paragraph describes what you
            are standing in. Worth re-reading in three months.
          </p>

          <h4 className="meta" style={{ margin: "24px 0 10px" }}>Path — where this is moving</h4>
          <p style={{ fontSize: 15, color: "var(--ink-soft)" }}>
            The trainable edge here is not more honesty or more independence — those are
            already at the front. The next capacity may be <em>holding</em> what those two
            cost without resenting the people who made them costly.
          </p>

          <div className="divider">· · ·</div>

          <p>
            None of the above is a diagnosis. The engine sees only what you told it, and you
            told it only some of yourself. Annotate, edit, or reject any tension at any time —
            the document updates. It is meant to be a living self-portrait, not a finished one.
          </p>

          <div className="footer-row">
            <button className="btn ghost">annotate</button>
            <button className="btn ghost">save as PDF</button>
            <button className="btn">revisit in 3 months</button>
          </div>
        </article>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Treatment swatches — small artboards that illustrate the open design calls
// ─────────────────────────────────────────────────────────────────────────────

function SectionTitleSwatch({ kicker, title, sub, tag, note }) {
  return (
    <div className="ab" style={{ padding: "20px 24px", justifyContent: "space-between" }}>
      <div>
        <div className="meta" style={{ color: "var(--umber)", marginBottom: 10 }}>{kicker}</div>
        <div style={{
          display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap",
        }}>
          <div style={{
            fontFamily: "var(--serif)", fontSize: 18, lineHeight: 1.2,
            color: "var(--ink)", fontWeight: 500,
          }}>
            {title}
          </div>
          {tag && (
            <span style={{
              fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: ".14em",
              color: "var(--umber)", padding: "3px 7px",
              border: "1px solid var(--umber)", borderRadius: 2,
              textTransform: "uppercase",
            }}>{tag}</span>
          )}
        </div>
        <div style={{
          fontFamily: "var(--serif)", fontSize: 13, lineHeight: 1.45,
          color: "var(--ink-mute)", marginTop: 6, fontStyle: "italic",
        }}>
          {sub}
        </div>
      </div>
      {note && (
        <div style={{
          fontFamily: "var(--serif)", fontSize: 12, lineHeight: 1.45,
          color: "var(--ink-soft)", borderTop: "1px solid var(--rule-soft)",
          paddingTop: 10, marginTop: 14,
        }}>
          {note}
        </div>
      )}
    </div>
  );
}

function ChipTreatmentSwatch({ variant, cardName, body, ix }) {
  const renderHead = () => {
    switch (variant) {
      case "italic":
        return (
          <>
            <span>{cardName}</span>
            <span style={{
              marginLeft: 10, color: "var(--ink-mute)", fontWeight: 400,
              fontStyle: "italic", fontSize: ".88em",
            }}>· {body}</span>
          </>
        );
      case "mono":
        return (
          <>
            <span>{cardName}</span>
            <span style={{
              marginLeft: 12, fontFamily: "var(--mono)", fontWeight: 500,
              fontSize: 10, letterSpacing: ".18em", color: "var(--ink-mute)",
              padding: "2px 6px", border: "1px solid var(--rule)",
              borderRadius: 2, position: "relative", top: -2,
            }}>{body}</span>
          </>
        );
      case "paren":
        return (
          <span>
            {cardName}
            <span style={{ color: "var(--ink-mute)", fontWeight: 400, fontStyle: "italic" }}>
              {" "}({body})
            </span>
          </span>
        );
      case "glyph":
        return (
          <>
            <span style={{
              color: "var(--umber)", fontSize: "1.05em", marginRight: 8,
              position: "relative", top: 1,
            }}>{body}</span>
            <span>{cardName}</span>
          </>
        );
      case "hidden":
        return <span>{cardName}</span>;
      default:
        return <span>{cardName}</span>;
    }
  };

  return (
    <div className="ab" style={{ padding: 0 }}>
      {/* Mock artboard head, true to the real one */}
      <div className="ab-head" style={{ padding: "22px 24px 14px" }}>
        <div className="card-name" style={{
          fontFamily: "var(--serif)", fontSize: 17, fontWeight: 500,
          color: "var(--ink)",
        }}>
          {renderHead()}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[0,1,2,3,4,5,6,7,8].map(i => (
            <span key={i} style={{
              width: 14, height: 3, borderRadius: 1,
              background: i < 4 ? "var(--umber)" : i === 4 ? "var(--umber-soft)" : "var(--rule)",
            }} />
          ))}
        </div>
        <div style={{
          fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--ink-mute)",
          letterSpacing: ".1em",
        }}>{ix}</div>
      </div>
      {/* Mock prompt area, kept faint so the head reads */}
      <div style={{ padding: "16px 24px", flex: 1 }}>
        <div className="meta" style={{ color: "var(--ink-faint)", marginBottom: 8 }}>
          mock prompt area · faded so the head reads
        </div>
        <div style={{
          fontFamily: "var(--serif)", fontSize: 14, lineHeight: 1.45,
          color: "var(--ink-faint)",
        }}>
          Order these by what you'd protect first when something has to give.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  QuestionPage, ConstitutionPage,
  RankingA, RankingB, RankingC,
  Q_S1, Q_S2, Q_X3, Q_C4, Q_T1,
  SectionTitleSwatch, ChipTreatmentSwatch,
  cls,
});
