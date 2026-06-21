"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";

type CouplePortalAccountMenuProps = {
  coupleDisplayName: string;
  onSignOut: () => void | Promise<void>;
};

const DROPDOWN_WIDTH_PX = 248;
const DROPDOWN_GAP_PX = 8;

function useMobileSheetLayout() {
  const [useSheet, setUseSheet] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setUseSheet(mq.matches);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return useSheet;
}

function AccountMenuPanel({
  menuId,
  coupleDisplayName,
  signingOut,
  onSignOut,
  variant,
  style,
}: {
  menuId: string;
  coupleDisplayName: string;
  signingOut: boolean;
  onSignOut: () => void;
  variant: "dropdown" | "sheet";
  style?: CSSProperties;
}) {
  const panelClass =
    variant === "sheet"
      ? "cm-couple-account-menu-panel cm-couple-account-menu-panel--sheet"
      : "cm-couple-account-menu-panel cm-couple-account-menu-panel--dropdown";

  return (
    <div
      id={menuId}
      role="menu"
      aria-label="Account"
      className={panelClass}
      style={style}
    >
      <div className="cm-couple-account-menu-header">
        <p className="cm-couple-account-menu-names">{coupleDisplayName}</p>
        <p className="cm-couple-account-menu-subtitle">Wedding Planning Portal</p>
      </div>
      <div className="cm-couple-account-menu-divider" role="separator" />
      <button
        type="button"
        role="menuitem"
        disabled={signingOut}
        onClick={onSignOut}
        className="cm-couple-account-menu-sign-out"
      >
        {signingOut ? "Signing out…" : "Sign Out"}
      </button>
    </div>
  );
}

export function CouplePortalAccountMenu({
  coupleDisplayName,
  onSignOut,
}: CouplePortalAccountMenuProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const useMobileSheet = useMobileSheetLayout();

  const closeMenu = useCallback(() => {
    setOpen(false);
    setDropdownStyle(null);
    requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  }, []);

  const updateDropdownPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const viewportPadding = 12;
    const maxLeft = Math.max(
      viewportPadding,
      window.innerWidth - DROPDOWN_WIDTH_PX - viewportPadding,
    );
    const left = Math.min(Math.max(rect.right - DROPDOWN_WIDTH_PX, viewportPadding), maxLeft);

    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + DROPDOWN_GAP_PX,
      left,
      width: DROPDOWN_WIDTH_PX,
      zIndex: 70,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open || useMobileSheet) {
      setDropdownStyle(null);
      return;
    }
    updateDropdownPosition();
  }, [open, updateDropdownPosition, useMobileSheet]);

  useEffect(() => {
    if (!open || useMobileSheet) return;

    const reposition = () => {
      updateDropdownPosition();
    };

    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, updateDropdownPosition, useMobileSheet]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      const menu = document.getElementById(menuId);
      if (menu?.contains(target)) return;
      closeMenu();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeMenu, menuId, open, useMobileSheet]);

  useEffect(() => {
    if (!open || !useMobileSheet) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, useMobileSheet]);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    closeMenu();
    try {
      await onSignOut();
    } finally {
      setSigningOut(false);
    }
  };

  const displayName = coupleDisplayName.trim() || "Your celebration";

  const mobileSheet =
    open && useMobileSheet && typeof document !== "undefined"
      ? createPortal(
          <>
            <button
              type="button"
              className="cm-couple-account-menu-backdrop"
              aria-label="Close account menu"
              onClick={closeMenu}
            />
            <AccountMenuPanel
              menuId={menuId}
              coupleDisplayName={displayName}
              signingOut={signingOut}
              onSignOut={() => {
                void handleSignOut();
              }}
              variant="sheet"
            />
          </>,
          document.body,
        )
      : null;

  const desktopDropdown =
    open && !useMobileSheet && dropdownStyle && typeof document !== "undefined"
      ? createPortal(
          <AccountMenuPanel
            menuId={menuId}
            coupleDisplayName={displayName}
            signingOut={signingOut}
            onSignOut={() => {
              void handleSignOut();
            }}
            variant="dropdown"
            style={dropdownStyle}
          />,
          document.body,
        )
      : null;

  return (
    <>
      <div className="cm-couple-portal-account-row">
        <div ref={rootRef} className="cm-couple-portal-account-anchor">
          <button
            ref={triggerRef}
            type="button"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls={open ? menuId : undefined}
            aria-label="Account menu"
            onClick={() => setOpen((prev) => !prev)}
            className="cm-couple-portal-account-trigger"
          >
            <span className="cm-couple-portal-account-icon inline-flex items-center justify-center text-[10px] font-semibold">
              SF
            </span>
          </button>
        </div>
      </div>
      {desktopDropdown}
      {mobileSheet}
    </>
  );
}
