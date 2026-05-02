"use client";

import { useEffect, useRef, useState } from "react";
import type { AspirationalOverlay, RankingItem } from "../../lib/types";

type Props = {
  items: RankingItem[];
  initialOrder?: string[];
  onChange: (order: string[]) => void;
  // CC-016 — when present, render the per-item three-state aspirational
  // overlay (wish less / right / wish more). Only used on the four
  // allocation parent rankings (Q-S3-close, Q-S3-wider, Q-E1-outward,
  // Q-E1-inward).
  overlay?: Record<string, AspirationalOverlay>;
  onOverlayChange?: (overlay: Record<string, AspirationalOverlay>) => void;
};

const DRAG_THRESHOLD = 6;

export default function Ranking({
  items,
  initialOrder,
  onChange,
  overlay,
  onOverlayChange,
}: Props) {
  const overlayEnabled = !!onOverlayChange;
  function setOverlayFor(itemId: string, value: AspirationalOverlay) {
    if (!onOverlayChange) return;
    const current = overlay ?? {};
    onOverlayChange({ ...current, [itemId]: value });
  }

  const [order, setOrder] = useState<string[]>(() =>
    initialOrder && initialOrder.length === items.length
      ? initialOrder
      : items.map((i) => i.id)
  );
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [keyboardPicked, setKeyboardPicked] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");

  const downIndexRef = useRef(-1);
  const downYRef = useRef(0);
  const dragStartedRef = useRef(false);
  const rowHeightRef = useRef(0);
  const orderRef = useRef(order);
  const pickedOriginalOrderRef = useRef<string[] | null>(null);
  const liRefs = useRef<Record<string, HTMLLIElement | null>>({});

  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  function findItem(id: string): RankingItem | undefined {
    return items.find((i) => i.id === id);
  }

  function commitOrder(next: string[]) {
    setOrder(next);
    onChange(next);
  }

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>, id: string) {
    if (keyboardPicked) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const idx = orderRef.current.indexOf(id);
    downIndexRef.current = idx;
    downYRef.current = e.clientY;
    dragStartedRef.current = false;
    const li = liRefs.current[id];
    rowHeightRef.current = li ? li.offsetHeight : 64;
  }

  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>, id: string) {
    if (downIndexRef.current < 0) return;
    const dy = e.clientY - downYRef.current;
    if (!dragStartedRef.current) {
      if (Math.abs(dy) < DRAG_THRESHOLD) return;
      dragStartedRef.current = true;
      setDragId(id);
    }
    const rh = rowHeightRef.current || 64;
    const currentIndex = orderRef.current.indexOf(id);
    const desired = downIndexRef.current + Math.round(dy / rh);
    const target = Math.max(0, Math.min(orderRef.current.length - 1, desired));
    if (target !== currentIndex) {
      const next = [...orderRef.current];
      const [moved] = next.splice(currentIndex, 1);
      next.splice(target, 0, moved);
      const drift = (target - currentIndex) * rh;
      downYRef.current += drift;
      downIndexRef.current = target;
      setOrder(next);
      orderRef.current = next;
      setDragOffset(e.clientY - downYRef.current);
    } else {
      setDragOffset(dy);
    }
  }

  function onPointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    if (downIndexRef.current < 0) return;
    const dragged = dragStartedRef.current;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    downIndexRef.current = -1;
    dragStartedRef.current = false;
    setDragId(null);
    setDragOffset(0);
    if (dragged) {
      onChange(orderRef.current);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, id: string) {
    if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      if (keyboardPicked === id) {
        setKeyboardPicked(null);
        setAnnounce(`Dropped at position ${orderRef.current.indexOf(id) + 1}.`);
        onChange(orderRef.current);
      } else {
        setKeyboardPicked(id);
        pickedOriginalOrderRef.current = [...orderRef.current];
        setAnnounce(
          `Picked up. Use arrow up and arrow down to move. Press space to drop, escape to cancel.`
        );
      }
      return;
    }
    if (
      keyboardPicked === id &&
      (e.key === "ArrowDown" || e.key === "ArrowUp")
    ) {
      e.preventDefault();
      const idx = orderRef.current.indexOf(id);
      const target =
        e.key === "ArrowDown"
          ? Math.min(orderRef.current.length - 1, idx + 1)
          : Math.max(0, idx - 1);
      if (target !== idx) {
        const next = [...orderRef.current];
        [next[idx], next[target]] = [next[target], next[idx]];
        commitOrder(next);
        setAnnounce(`Moved to position ${target + 1} of ${next.length}.`);
        const li = liRefs.current[id];
        const grip = li?.querySelector<HTMLButtonElement>("[data-grip]");
        grip?.focus();
      }
      return;
    }
    if (e.key === "Escape" && keyboardPicked) {
      e.preventDefault();
      const restored = pickedOriginalOrderRef.current;
      if (restored) {
        commitOrder(restored);
      }
      setKeyboardPicked(null);
      setAnnounce("Cancelled. Order restored.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <ol
        className="overflow-hidden"
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          border: "1px solid var(--rule)",
          borderRadius: 12,
          background: "var(--paper)",
        }}
        aria-label="Ranking. Drag to reorder, or focus a grip and press space to pick up an item."
      >
        {order.map((id, idx) => {
          const item = findItem(id);
          if (!item) return null;
          const isDragging = dragId === id;
          const isPicked = keyboardPicked === id;
          const isActive = isDragging || isPicked;
          const isLast = idx === order.length - 1;
          const liStyle: React.CSSProperties = isDragging
            ? {
                transform: `translateY(${dragOffset}px)`,
                boxShadow:
                  "0 12px 40px rgba(26,23,19,.18), 0 1px 2px var(--rule)",
                outline: "1px solid var(--umber)",
                background: "var(--umber-wash)",
                position: "relative",
                zIndex: 10,
                transition: "none",
              }
            : isPicked
            ? {
                background: "var(--umber-wash)",
                outline: "1px solid var(--umber)",
                transition: "transform 150ms ease-out",
              }
            : {
                transition: "transform 150ms ease-out",
                background: "var(--paper)",
              };
          const overlayValue = overlay?.[id] ?? "right";
          return (
            <li
              key={id}
              ref={(el) => {
                liRefs.current[id] = el;
              }}
              className="flex flex-col"
              style={{
                ...liStyle,
                touchAction: "manipulation",
                borderBottom: isLast ? "none" : "1px solid var(--rule-soft)",
              }}
              aria-roledescription="rankable item"
            >
            <div className="flex items-stretch">
              <div
                className="flex items-center justify-center font-mono"
                style={{
                  minWidth: 48,
                  fontSize: 18,
                  color: "var(--umber)",
                  borderRight: "1px solid var(--rule)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <span className="md:hidden">{idx + 1}</span>
                <span className="hidden md:inline" style={{ fontSize: 22 }}>
                  {idx + 1}
                </span>
              </div>
              {item.voice && item.quote ? (
                <div
                  className="flex-1 flex flex-col"
                  style={{
                    padding: "14px 16px",
                    gap: 6,
                  }}
                >
                  <p
                    className="font-mono uppercase"
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.08em",
                      color: "var(--ink-mute)",
                      margin: 0,
                    }}
                  >
                    {item.voice}
                  </p>
                  <p
                    className="font-serif italic"
                    style={{
                      fontSize: 14,
                      lineHeight: 1.5,
                      color: "var(--ink)",
                      margin: 0,
                      textWrap: "pretty",
                    }}
                  >
                    <span className="md:hidden">{item.quote}</span>
                    <span
                      className="hidden md:inline"
                      style={{ fontSize: 16 }}
                    >
                      {item.quote}
                    </span>
                  </p>
                </div>
              ) : (
                <div
                  className="flex-1 font-serif"
                  style={{
                    padding: "14px 16px",
                    fontSize: 14,
                    lineHeight: 1.4,
                    color: "var(--ink)",
                  }}
                >
                  <span className="md:hidden">
                    <span style={{ color: "var(--ink)" }}>{item.label}</span>
                    {item.gloss ? (
                      <span style={{ color: "var(--ink-soft)" }}>
                        {" — "}
                        {item.gloss}
                      </span>
                    ) : null}
                  </span>
                  <span className="hidden md:inline" style={{ fontSize: 16 }}>
                    <span style={{ color: "var(--ink)" }}>{item.label}</span>
                    {item.gloss ? (
                      <span style={{ color: "var(--ink-soft)" }}>
                        {" — "}
                        {item.gloss}
                      </span>
                    ) : null}
                  </span>
                </div>
              )}
              <button
                data-grip
                data-focus-ring
                aria-label={`Item ${idx + 1} of ${order.length}: ${
                  item.label
                }. Press space to reorder.`}
                aria-pressed={isPicked}
                onPointerDown={(e) => onPointerDown(e, id)}
                onPointerMove={(e) => onPointerMove(e, id)}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onKeyDown={(e) => onKeyDown(e, id)}
                className="flex items-center justify-center select-none"
                style={{
                  minWidth: 44,
                  minHeight: 44,
                  background: "transparent",
                  border: "none",
                  color: isActive ? "var(--umber)" : "var(--ink-mute)",
                  fontSize: 20,
                  cursor: isDragging ? "grabbing" : "grab",
                  touchAction: dragId === id ? "none" : "manipulation",
                  WebkitTapHighlightColor: "transparent",
                }}
                type="button"
              >
                <span aria-hidden="true">≡</span>
              </button>
            </div>
            {overlayEnabled ? (
              <div
                className="flex flex-row items-center"
                role="radiogroup"
                aria-label={`Aspirational overlay for ${item.label}`}
                style={{
                  gap: 6,
                  paddingLeft: 56,
                  paddingRight: 16,
                  paddingBottom: 12,
                  paddingTop: 2,
                }}
              >
                {(["wish_less", "right", "wish_more"] as const).map(
                  (opt) => {
                    const selected = overlayValue === opt;
                    const labelText =
                      opt === "wish_less"
                        ? "wish less"
                        : opt === "right"
                        ? "right"
                        : "wish more";
                    return (
                      <button
                        key={opt}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setOverlayFor(id, opt)}
                        data-focus-ring
                        className="font-mono uppercase"
                        style={{
                          fontSize: 11,
                          letterSpacing: "0.08em",
                          padding: "4px 10px",
                          background: selected ? "var(--umber)" : "transparent",
                          color: selected ? "var(--paper)" : "var(--ink-mute)",
                          border: selected
                            ? "1px solid var(--umber)"
                            : "1px solid var(--rule)",
                          borderRadius: 4,
                          cursor: "pointer",
                          transition:
                            "background 120ms ease-out, color 120ms ease-out",
                        }}
                      >
                        {labelText}
                      </button>
                    );
                  }
                )}
              </div>
            ) : null}
            </li>
          );
        })}
      </ol>
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {announce}
      </div>
    </div>
  );
}
