"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

const actionButtonBaseClass =
  "relative z-[1] min-h-12 touch-manipulation rounded-xl px-3 py-2.5 text-[13px] font-medium leading-none tracking-[0.01em] transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100 sm:min-h-11";

/** Movement beyond this cancels a touch tap (scroll/drag intent). */
const TOUCH_SLOP_PX = 10;
/** Long-press still counts as a tap for navigation rows. */
const MAX_TAP_DURATION_MS = 650;

export const coupleMobileActionFooterMobileClass =
  "pointer-events-auto fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] z-[55] touch-manipulation border-t border-stone-200/90 bg-white/98 px-5 py-3 shadow-[0_-4px_24px_-8px_rgba(28,25,23,0.15)] backdrop-blur-sm supports-[backdrop-filter]:bg-white/95";

export const coupleMobileActionFooterDesktopClass =
  "pointer-events-auto mt-6 flex touch-manipulation flex-col gap-2 sm:flex-row sm:flex-wrap";

export const coupleMobileActionFooterInnerClass =
  "pointer-events-auto mx-auto flex w-full max-w-[1400px] flex-col gap-2 sm:flex-row sm:flex-wrap";

/** Reserve space above portaled mobile action footer + bottom nav. */
export const coupleMobileActionContentSpacerClass =
  "pb-[calc(env(safe-area-inset-bottom,0px)+13rem)] md:pb-0";

type ScrollSnapshot = {
  el: HTMLElement | Window;
  top: number;
  left: number;
};

type TouchGestureState = {
  pointerId: number;
  startX: number;
  startY: number;
  startTime: number;
  cancelled: boolean;
  scrollSnapshot: ScrollSnapshot[];
};

function captureScrollSnapshot(target: HTMLElement): ScrollSnapshot[] {
  const snaps: ScrollSnapshot[] = [
    { el: window, top: window.scrollY, left: window.scrollX },
  ];
  let node: HTMLElement | null = target.parentElement;
  while (node) {
    if (
      node.scrollHeight > node.clientHeight + 1 ||
      node.scrollWidth > node.clientWidth + 1
    ) {
      snaps.push({ el: node, top: node.scrollTop, left: node.scrollLeft });
    }
    node = node.parentElement;
  }
  return snaps;
}

function scrollMoved(snapshot: ScrollSnapshot[]): boolean {
  for (const snap of snapshot) {
    const top =
      snap.el === window ? window.scrollY : (snap.el as HTMLElement).scrollTop;
    const left =
      snap.el === window ? window.scrollX : (snap.el as HTMLElement).scrollLeft;
    if (Math.abs(top - snap.top) > 1 || Math.abs(left - snap.left) > 1) {
      return true;
    }
  }
  return false;
}

function useReliableMobileAction(action: () => void, disabled = false) {
  return useCallback(() => {
    if (disabled) return;

    const active = document.activeElement;
    if (
      active instanceof HTMLElement &&
      active !== document.body &&
      (active.tagName === "INPUT" ||
        active.tagName === "TEXTAREA" ||
        active.tagName === "SELECT")
    ) {
      active.blur();
    }
    action();
  }, [action, disabled]);
}

export type CoupleMobileActionHandlers = {
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: React.PointerEvent<HTMLElement>) => void;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
};

/**
 * Scroll-safe tap handling for couple portal navigation rows and cards.
 * Touch: fires on pointer up when movement and scroll stay within slop.
 * Mouse: standard click (no pointer-down shortcut).
 */
export function useCoupleMobileActionHandlers(
  action: () => void,
  disabled = false,
): CoupleMobileActionHandlers {
  const run = useReliableMobileAction(action, disabled);
  const gestureRef = useRef<TouchGestureState | null>(null);
  const touchHandledRef = useRef(false);

  const resetGesture = useCallback(() => {
    gestureRef.current = null;
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (disabled) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (event.pointerType === "mouse") return;

      gestureRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startTime: Date.now(),
        cancelled: false,
        scrollSnapshot: captureScrollSnapshot(event.currentTarget),
      };
      touchHandledRef.current = false;
    },
    [disabled],
  );

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.cancelled || event.pointerId !== gesture.pointerId) return;

    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    if (dx * dx + dy * dy > TOUCH_SLOP_PX * TOUCH_SLOP_PX) {
      gesture.cancelled = true;
    }
  }, []);

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const gesture = gestureRef.current;
      if (!gesture || event.pointerId !== gesture.pointerId) return;

      const duration = Date.now() - gesture.startTime;
      const shouldRun =
        !gesture.cancelled &&
        !scrollMoved(gesture.scrollSnapshot) &&
        duration <= MAX_TAP_DURATION_MS;

      resetGesture();

      if (!shouldRun || disabled) return;

      touchHandledRef.current = true;
      event.preventDefault();
      run();
    },
    [disabled, resetGesture, run],
  );

  const onPointerCancel = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const gesture = gestureRef.current;
      if (gesture && event.pointerId === gesture.pointerId) {
        resetGesture();
      }
    },
    [resetGesture],
  );

  const onClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (disabled) return;

      if (touchHandledRef.current) {
        touchHandledRef.current = false;
        event.preventDefault();
        return;
      }

      if (event.detail === 0) return;
      run();
    },
    [disabled, run],
  );

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClick };
}

export function CoupleMobileActionButton({
  children,
  onAction,
  disabled = false,
  className,
}: {
  children: ReactNode;
  onAction: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClick } =
    useCoupleMobileActionHandlers(onAction, disabled);

  return (
    <button
      type="button"
      disabled={disabled}
      className={`${actionButtonBaseClass} ${className ?? ""}`.trim()}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/** Full-width tappable row surface (timeline cards, etc.) with scroll-safe touch. */
export function CoupleScrollSafeTapSurface({
  onTap,
  disabled = false,
  className = "",
  children,
  ariaLabel,
}: {
  onTap: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  const { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClick } =
    useCoupleMobileActionHandlers(onTap, disabled);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onTap();
      }
    },
    [disabled, onTap],
  );

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={className}
    >
      {children}
    </div>
  );
}

export function CoupleMobileActionFooter({ children }: { children: ReactNode }) {
  const [useMobilePortal, setUseMobilePortal] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setUseMobilePortal(mq.matches);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const inner = <div className={coupleMobileActionFooterInnerClass}>{children}</div>;

  if (useMobilePortal && typeof document !== "undefined") {
    return createPortal(
      <div
        className={coupleMobileActionFooterMobileClass}
        role="navigation"
        aria-label="Chapter actions"
      >
        {inner}
      </div>,
      document.body,
    );
  }

  return (
    <div className={coupleMobileActionFooterDesktopClass} role="navigation" aria-label="Chapter actions">
      {inner}
    </div>
  );
}
