"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Screen } from "@/types/planning";

type EventNavSegmentedProps = {
  items: Array<{ screen: Screen; label: string }>;
  activeScreen: Screen;
  onSelect: (screen: Screen) => void;
};

function NavScrollChevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {direction === "left" ? (
        <path d="M10 3.5 5.5 8 10 12.5" />
      ) : (
        <path d="M6 3.5 10.5 8 6 12.5" />
      )}
    </svg>
  );
}

const NAV_SCROLL_CONTROL_CLASS =
  "absolute top-1/2 z-[2] flex h-8 w-8 -translate-y-1/2 touch-manipulation items-center justify-center rounded-full bg-stone-900/80 text-white shadow-[0_2px_8px_rgba(28,25,23,0.22)] ring-1 ring-stone-900/25 transition-[background-color,transform] hover:bg-stone-900 active:scale-95";

export function EventNavSegmented({ items, activeScreen, onSelect }: EventNavSegmentedProps) {
  const scrollRef = useRef<HTMLUListElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollHints = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const hasOverflow = scrollWidth - clientWidth > 4;
    setCanScrollLeft(hasOverflow && scrollLeft > 4);
    setCanScrollRight(hasOverflow && scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollHints();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollHints, { passive: true });
    const resizeObserver = new ResizeObserver(updateScrollHints);
    resizeObserver.observe(el);
    window.addEventListener("resize", updateScrollHints);

    return () => {
      el.removeEventListener("scroll", updateScrollHints);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScrollHints);
    };
  }, [updateScrollHints, items]);

  const scrollByDirection = (direction: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -180 : 180,
      behavior: "smooth",
    });
  };

  return (
    <div className="no-print sticky top-0 z-30 -mx-5 mt-4 hidden sm:-mx-6 md:block">
      <nav
        aria-label="Event navigation"
        className="border-b border-stone-200/70 bg-[var(--cm-canvas)] px-5 pb-2.5 pt-0.5 shadow-[0_1px_0_0_rgba(28,25,23,0.04)] backdrop-blur-md supports-[backdrop-filter]:bg-[var(--cm-canvas)]/95 sm:px-6"
      >
        <div className="relative rounded-xl border border-stone-200/90 bg-stone-100/70 p-1">
          {canScrollLeft ? (
            <>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-12 rounded-l-[0.65rem] bg-gradient-to-r from-stone-900/28 via-stone-900/10 to-transparent"
              />
              <button
                type="button"
                aria-label="Show earlier sections"
                onClick={() => scrollByDirection("left")}
                className={`${NAV_SCROLL_CONTROL_CLASS} left-1`}
              >
                <NavScrollChevron direction="left" />
              </button>
            </>
          ) : null}
          {canScrollRight ? (
            <>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-12 rounded-r-[0.65rem] bg-gradient-to-l from-stone-900/28 via-stone-900/10 to-transparent"
              />
              <button
                type="button"
                aria-label="Show more sections"
                onClick={() => scrollByDirection("right")}
                className={`${NAV_SCROLL_CONTROL_CLASS} right-1`}
              >
                <NavScrollChevron direction="right" />
              </button>
            </>
          ) : null}
          <ul
            ref={scrollRef}
            className={`relative z-0 flex gap-1 overflow-x-auto overscroll-x-contain no-scrollbar ${canScrollLeft ? "pl-9" : ""} ${canScrollRight ? "pr-9" : ""}`}
          >
            {items.map((item) => {
              const isActive = activeScreen === item.screen;
              return (
                <li key={item.screen} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelect(item.screen)}
                    className={`min-h-9 touch-manipulation whitespace-nowrap rounded-lg px-3 py-2 text-[12px] leading-tight transition-colors lg:min-h-10 lg:px-3.5 lg:text-[13px] ${
                      isActive
                        ? "bg-white font-semibold text-stone-950 shadow-sm ring-1 ring-stone-200/90"
                        : "bg-transparent font-medium text-stone-700 hover:bg-white/70 hover:text-stone-900"
                    }`}
                  >
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </div>
  );
}
