"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const actionButtonBaseClass =
  "relative z-[1] min-h-12 touch-manipulation rounded-xl px-3 py-2.5 text-[13px] font-medium leading-none tracking-[0.01em] transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100 sm:min-h-11";

export const coupleMobileActionFooterMobileClass =
  "pointer-events-auto fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] z-[55] touch-manipulation border-t border-stone-200/90 bg-white/98 px-5 py-3 shadow-[0_-4px_24px_-8px_rgba(28,25,23,0.15)] backdrop-blur-sm supports-[backdrop-filter]:bg-white/95";

export const coupleMobileActionFooterDesktopClass =
  "pointer-events-auto mt-6 flex touch-manipulation flex-col gap-2 sm:flex-row sm:flex-wrap";

export const coupleMobileActionFooterInnerClass =
  "pointer-events-auto mx-auto flex w-full max-w-[1400px] flex-col gap-2 sm:flex-row sm:flex-wrap";

/** Reserve space above portaled mobile action footer + bottom nav. */
export const coupleMobileActionContentSpacerClass =
  "pb-[calc(env(safe-area-inset-bottom,0px)+13rem)] md:pb-0";

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

export function useCoupleMobileActionHandlers(action: () => void, disabled = false) {
  const run = useReliableMobileAction(action, disabled);
  const skipClickRef = useRef(false);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (event.pointerType === "mouse") return;

      event.preventDefault();
      skipClickRef.current = true;
      run();
    },
    [disabled, run],
  );

  const onClick = useCallback(() => {
    if (disabled) return;
    if (skipClickRef.current) {
      skipClickRef.current = false;
      return;
    }
    run();
  }, [disabled, run]);

  return { onPointerDown, onClick };
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
  const { onPointerDown, onClick } = useCoupleMobileActionHandlers(onAction, disabled);

  return (
    <button
      type="button"
      disabled={disabled}
      className={`${actionButtonBaseClass} ${className ?? ""}`.trim()}
      onPointerDown={onPointerDown}
      onClick={onClick}
    >
      {children}
    </button>
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
