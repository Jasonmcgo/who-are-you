"use client";

import { useEffect, useRef, useState } from "react";
import type { RankingItem } from "../../lib/types";

type Props = {
  items: RankingItem[];
  initialOrder?: string[];
  onChange: (order: string[]) => void;
};

const DRAG_THRESHOLD = 6;

export default function Ranking({ items, initialOrder, onChange }: Props) {
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
        className="border border-gray-300 rounded-md overflow-hidden"
        style={{ listStyle: "none", padding: 0, margin: 0 }}
        aria-label="Ranking. Drag to reorder, or focus a grip and press space to pick up an item."
      >
        {order.map((id, idx) => {
          const item = findItem(id);
          if (!item) return null;
          const isDragging = dragId === id;
          const isPicked = keyboardPicked === id;
          const liStyle: React.CSSProperties = isDragging
            ? {
                transform: `translateY(${dragOffset}px)`,
                boxShadow: "0 12px 40px rgba(26,23,19,.18)",
                outline: "1px solid #8a4a1f",
                background: "white",
                position: "relative",
                zIndex: 10,
                transition: "none",
              }
            : {
                transition: "transform 150ms ease-out",
              };
          return (
            <li
              key={id}
              ref={(el) => {
                liRefs.current[id] = el;
              }}
              className="flex items-stretch border-b border-gray-200 last:border-b-0 bg-white"
              style={{ ...liStyle, touchAction: "manipulation" }}
              aria-roledescription="rankable item"
            >
              <div
                className="flex items-center justify-center px-3 font-mono text-lg text-gray-700 border-r border-gray-200"
                style={{ minWidth: 40 }}
              >
                {idx + 1}
              </div>
              <div className="flex-1 px-3 py-3 text-sm leading-snug">
                <span className="font-medium">{item.label}</span>
                {item.gloss ? (
                  <span className="text-gray-600">
                    {" — "}
                    {item.gloss}
                  </span>
                ) : null}
              </div>
              <button
                data-grip
                aria-label={`Item ${idx + 1} of ${order.length}: ${
                  item.label
                }. Press space to reorder.`}
                aria-pressed={isPicked}
                onPointerDown={(e) => onPointerDown(e, id)}
                onPointerMove={(e) => onPointerMove(e, id)}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onKeyDown={(e) => onKeyDown(e, id)}
                className={
                  "flex items-center justify-center px-3 select-none text-gray-500 hover:text-gray-900 focus:outline-none " +
                  (isPicked
                    ? "ring-2 ring-offset-1 ring-amber-700 "
                    : "focus-visible:ring-2 focus-visible:ring-amber-700 ") +
                  "cursor-grab active:cursor-grabbing"
                }
                style={{
                  minWidth: 44,
                  minHeight: 44,
                  touchAction: dragId === id ? "none" : "manipulation",
                  WebkitTapHighlightColor: "transparent",
                }}
                type="button"
              >
                <span aria-hidden="true">≡</span>
              </button>
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
